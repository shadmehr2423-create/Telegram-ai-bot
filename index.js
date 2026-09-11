const TelegramBot = require('node-telegram-bot-api');
const Anthropic = require('@anthropic-ai/sdk');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = process.env.BOT_PERSONA ||
  `تو داری به‌جای صاحب این اکانت تلگرام به پیام‌ها جواب می‌دی. مودب، کوتاه و طبیعی جواب بده. اگه سوالی نیاز به اطلاعات خاصی داشت که نداری، بگو صاحب اکانت به‌زودی خودش جواب می‌ده.`;

if (!TELEGRAM_TOKEN || !ANTHROPIC_API_KEY) {
  console.error('خطا: TELEGRAM_BOT_TOKEN و ANTHROPIC_API_KEY باید تنظیم بشن.');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const chatHistory = new Map();
const MAX_HISTORY = 10;

async function getAIReply(chatId, userMessage) {
  const history = chatHistory.get(chatId) || [];
  history.push({ role: 'user', content: userMessage });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: history,
  });

  const replyText = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  history.push({ role: 'assistant', content: replyText });
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

