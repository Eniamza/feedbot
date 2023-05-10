const { ethers } = require("ethers");
const axios = require('axios');
const { sendTelegramMessage } = require("./telegram");
const config = require("./config");
const INFURA_API_KEY = process.env.INFURA_PROJECT_ID;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const gifUrl = config.gifURL

const provider = new ethers.providers.FallbackProvider([
  new ethers.providers.InfuraProvider("homestead", INFURA_API_KEY),
  new ethers.providers.AlchemyProvider("homestead", ALCHEMY_API_KEY),
  new ethers.providers.EtherscanProvider("homestead", ETHERSCAN_API_KEY),
]);

const abi = config.contractABI
const contract = new ethers.Contract(config.contractAddress, abi, provider);

const pendingBuyEvents = [];
let processingBuyEvents = false;

async function getWETHPriceInUSD() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const wethPriceInUSD = response.data.ethereum.usd;
    console.log(wethPriceInUSD);
    return wethPriceInUSD;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getTokenPrice() {
  try {
    const query = `
      {
        pair(id: "${config.uniswapPairAddress}") {
          token0Price
          token1 {
            symbol
          }
          token1Price
          token0 {
            symbol
          }
        }
      }
    `;

    const response = await axios.post("https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2", { query });
    const pairData = response.data.data.pair;

    const tokenPriceInWETH = (pairData.token0.symbol === "WETH" || pairData.token0.symbol === "ETH") ? parseFloat(pairData.token0Price) : parseFloat(pairData.token1Price);

    console.log(tokenPriceInWETH);
    return tokenPriceInWETH;
  } catch (error) {
    console.error(error);
    return null;
  }
}


const processPendingBuyEvents = async () => {
  if (processingBuyEvents || pendingBuyEvents.length === 0) return;

  processingBuyEvents = true;
  const buyEvent = pendingBuyEvents.shift();

  // Pass the gifUrl as the second parameter when calling sendTelegramMessage
  await sendTelegramMessage(buyEvent.message, gifUrl);
  setTimeout(() => {
    processingBuyEvents = false;
    processPendingBuyEvents();
  }, 5000);
};

const fetchAndProcessEvents = async () => {
  try {
    const eventName = "Transfer";
    const eventFilter = contract.filters[eventName]();
    const latestBlock = await provider.getBlockNumber();

    console.log("Fetching events from block", latestBlock - 1, "to", latestBlock);

    const events = await contract.queryFilter(eventFilter, latestBlock - 1, latestBlock);
    console.log("Found", events.length, "events");

    const wethPriceInUSD = await getWETHPriceInUSD();

    events.forEach(async (event) => {
      const { from, to, value } = event.args;
      const amount = parseFloat(ethers.utils.formatEther(value)).toFixed(2);
      const tokenPriceInWETH = await getTokenPrice();
      const tokenPriceInUSD = tokenPriceInWETH * wethPriceInUSD;
      const amountInUSD = (amount * tokenPriceInUSD).toFixed(2);
      const amountInETH = (amount * tokenPriceInWETH).toFixed(2)

      console.log("Detected event:", {
        from: from,
        to: to,
        amount: amount,
        amountInUSD: amountInUSD,
        amountInETH: amountInETH
      });

      console.log("Detected event:", {
        from: from,
        to: to,
        amount: amount,
        amountInUSD: amountInUSD,
        amountInETH: amount,
      });

      if (config.features.alertOnBuy && amountInUSD >= config.minimumBuyAmountInUSD) {
        const message = `🚨 *Buy CREPE* 🚨
        🥞🥞🥞🥞🥞🥞🥞🥞🥞🥞🥞🥞🥞🥞🥞🥞🥞🥞🥞🥞
        
  Someone just bought *${amount} $CREPES 
  💵 ${amountInETH} ETH ($${amountInUSD})
  📥 From: [${from}](https://etherscan.io/address/${from})
  📤 To: [${to}](https://etherscan.io/address/${to})
  🔍 [View on Etherscan](https://etherscan.io/tx/${event.transactionHash})
  💵 Buy From [UniSwap](https://app.uniswap.org/#/swap?outputCurrency=0x556d19ec20f7fffdfbe1a2c2403737ebcded96ca) or [DexTools](https://www.dextools.io/app/en/ether/pair-explorer/0x9505f89b7895c6e2ea4b0c34748caf8d128860ae)
        
  🐤 [Click To Tweet This!](http://twitter.com/intent/tweet?text=Someone%20bought%20${amount}%20$CREPE%20s,%20To%20the%20$MOON!.%20Grab%20your%20Bag!%20https://tinyurl.com/mr266jme)`;

        console.log("Sending buy alert:", message);

        pendingBuyEvents.push({message, gifUrl});
    processPendingBuyEvents();
      }
    });
  } catch (error) {
    if (error.code === "SERVER_ERROR") {
      console.log("Retry in 5 seconds due to a server error");
      setTimeout(fetchAndProcessEvents, 5000);
    } else {
      console.error("Error processing events:", error);
    }
  }
};

const monitorBuyTransactions = async () => {
  fetchAndProcessEvents();
};

module.exports = {
  monitorBuyTransactions,
};
