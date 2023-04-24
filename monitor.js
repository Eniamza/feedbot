const {ethers} = require("ethers");
const { sendTelegramMessage } = require("./telegram");
const config = require("./config");
const INFURA_API_KEY = process.env.INFURA_PROJECT_ID;

const provider = new ethers.providers.InfuraProvider("homestead", INFURA_API_KEY);
const abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]; // Put the provided ABI array here
const contract = new ethers.Contract(config.contractAddress, abi, provider);

const monitorBuyTransactions = async () => {
  const eventName = "Transfer";
  const eventFilter = contract.filters[eventName]();
  const latestBlock = await provider.getBlockNumber();

  contract.queryFilter(eventFilter, latestBlock - 1, latestBlock).then((events) => {
    events.forEach(async (event) => {
      const { from, to, value } = event.args;
      const amount = ethers.utils.formatEther(value);

      if (config.features.alertOnBuy) {
        const message = `🚨 *Buy Alert* 🚨
  Someone just bought *${amount} PAINS* 
  
  📥 From: [${from}](https://etherscan.io/address/${from})
  📤 To: [${to}](https://etherscan.io/address/${to})
  🔍 [View on Etherscan](https://etherscan.io/tx/${event.transactionHash})
  💵 Buy From [UniSwap](https://app.uniswap.org/#/swap?outputCurrency=0x556d19ec20f7fffdfbe1a2c2403737ebcded96ca) or [DexTools](https://www.dextools.io/app/en/ether/pair-explorer/0x9505f89b7895c6e2ea4b0c34748caf8d128860ae)`

        await sendTelegramMessage(message);
      }
    });
  });
};

module.exports = {
  monitorBuyTransactions,
};
