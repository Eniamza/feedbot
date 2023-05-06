const axios = require("axios");
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

const sendTelegramMessage = async (message, animationUrl) => {
  try {
    if (animationUrl) {
      const animationPayload = {
        chat_id: TELEGRAM_CHAT_ID,
        animation: animationUrl,
        caption: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      };

      const animationApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`;
      await axios.post(animationApiUrl, animationPayload);
    } else {
      const textPayload = {
        chat_id: TELEGRAM_CHAT_ID,
        parse_mode: "Markdown",
        text: message,
        disable_web_page_preview: true,
      };

      const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      await axios.post(telegramApiUrl, textPayload);
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error);
  }
};



module.exports = {
  sendTelegramMessage,
};
