const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = process.env.BOT_PERSONA ||
  `تو داری به‌جای صاحب این اکانت تلگرام به پیام‌ها جواب می‌دی. مودب، کوتاه و طبیعی جواب بده. اگه سوالی نیاز به اطلاعات خاصی داشت که نداری، بگو صاحب اکانت به‌زودی خودش جواب می‌ده.`;

if (!TELEGRAM_TOKEN || !GEMINI_API_KEY) {
  console.error('خطا: TELEGRAM_BOT_TOKEN و GEMINI_API_KEY باید تنظیم بشن.');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: SYSTEM_PROMPT,
});

const chatHistory = new Map();
const MAX_HISTORY = 10;

async function getAIReply(chatId, userMessage) {
  const history = chatHistory.get(chatId) || [];

  const chat = model.startChat({
    history: history,
  });

  const result = await chat.sendMessage(userMessage);
  const replyText = result.response.text();

  history.push({ role: 'user', parts: [{ text: userMessage }] });
  history.push({ role: 'model', parts: [{ text: replyText }] });
  chatHistory.set(chatId, history.slice(-MAX_HISTORY));

  return replyText;
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;
  if (msg.from.is_bot) return;

  try {
    bot.sendChatAction(chatId, 'typing');
    const reply = await getAIReply(chatId, text);
    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error('خطا در پاسخ‌دهی:', err.message);
  }
});

console.log('بات با موفقیت اجرا شد و منتظر پیام‌هاست...');
