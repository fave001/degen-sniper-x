const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TOKEN, { polling: false });

// Store seen tokens to avoid duplicate alerts
const seenTokens = new Set();

// Main function to check Pump.fun trending tokens
async function checkPumpFun() {
  try {
    const res = await axios.get('https://client-api.pump.fun/tokens/trending?limit=25');
    const tokens = res.data;

    for (let token of tokens) {
      if (seenTokens.has(token.mint)) continue;

      const age = Date.now() / 1000 - token.created_unix;
      if (age > 300 || token.total_volume < 2) continue; // Only fresh + active ones

      // Get full token details
      const detailRes = await axios.get(`https://client-api.pump.fun/tokens/${token.mint}`);
      const details = detailRes.data;

      // Build links
      const chartLink = `https://birdeye.so/token/${token.mint}?chain=solana`;
      const buyLink = `https://jup.ag/swap/SOL-${token.mint}`;

      const message = `
🚀 <b>New Meme Coin Spotted!</b>
<b>Name:</b> ${token.name}
<b>Symbol:</b> ${details.symbol || "N/A"}
<b>Price:</b> ${details.price?.toFixed(6) || "?"} SOL
<b>Market Cap:</b> ${Math.floor(details.marketCap || 0)} USD
<b>Volume:</b> ${token.total_volume.toFixed(2)} SOL
<b>Age:</b> ${Math.floor(age)} seconds
<b>Holders:</b> ${details.holderCount || 0}

🔗 <a href="${chartLink}">Chart</a> | <a href="${buyLink}">Buy Now</a>
      `;

      await bot.sendMessage(CHAT_ID, message.trim(), { parse_mode: 'HTML' });

      seenTokens.add(token.mint);
    }
  } catch (err) {
    console.error("Pump.fun check failed:", err.message);
  }
}

// Run every 30 seconds
setInterval(checkPumpFun, 30 * 1000);
