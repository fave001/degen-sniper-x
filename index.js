const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Load env vars
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TOKEN, { polling: false });

// === MAIN ALERT FUNCTION ===
async function checkPumpFun() {
  try {
    const res = await axios.get('https://pump.fun/api/token/list');
    const tokens = res.data.tokens;

    for (let token of tokens.slice(0, 5)) {
      const age = Date.now() / 1000 - token.created_unix;

      if (age < 300 && token.total_volume > 2) {
        const buyLink = `https://jup.ag/swap/SOL-${token.mint}`;
        const chartLink = `https://birdeye.so/token/${token.mint}?chain=solana`;

        const message = `
🚀 <b>New Token Spotted</b>
<b>Name:</b> ${token.name}
<b>Volume:</b> ${token.total_volume.toFixed(2)} SOL
<b>Age:</b> ${Math.floor(age)} secs
<b>Holders:</b> ${token.holder_count}

🔗 <a href="${chartLink}">Chart</a> | <a href="${buyLink}">Buy Now</a>
        `;

        await bot.sendMessage(CHAT_ID, message, { parse_mode: 'HTML' });
      }
    }
  } catch (err) {
    console.error("Pump.fun check failed:", err.message);
  }
}

// Run check every 30 seconds
setInterval(checkPumpFun, 30 * 1000);
