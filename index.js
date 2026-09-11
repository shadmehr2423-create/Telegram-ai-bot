const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = process.env.BOT_PERSONA || 
  `تو یک ربات تلگرام هستی. مودب، مفید و دوستانه جواب بده.`;

if (!TELEGRAM_TOKEN || !GEMINI_API_KEY) {
  console.error('خطا: TELEGRAM_BOT_TOKEN و GEMINI_API_KEY باید تنظیم بشن');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-3.8-flash',
  systemInstruction: SYSTEM_PROMPT,
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  try {
    const result = await model.generateContent(text);
    const response = await result.response;
    const reply = response.text();

    await bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error('خطا در پاسخ‌دهی:', error);
    await bot.sendMessage(chatId
