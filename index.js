require("dotenv").config();
const { monitorBuyTransactions } = require("./monitor");

(async () => {
  console.log("🚀 Bot is running...");

  // Run the monitor function every 15 seconds
  setInterval(async () => {
    await monitorBuyTransactions();
  }, 30);
})();
