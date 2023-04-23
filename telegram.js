const axios = require("axios");
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

const sendTelegramMessage = async (message) => {
  const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await axios.post(telegramApiUrl, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "Markdown",
  });

  return response.data;
};

module.exports = {
  sendTelegramMessage,
};
