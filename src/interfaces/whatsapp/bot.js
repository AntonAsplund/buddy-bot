require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleShopping } = require('../../handlers/shopping-handler');
const { chat } = require('./claude');
const ALLOWED = (process.env.ALLOWED_PHONES || '').split(',');

const SYSTEM_PROMPT = `You are a friendly family assistant.
Keep replies short and casual. You help with shopping,
and chatting. Reply in the same language as the user.`;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] },
});

client.on('qr', (qr) => {
    console.log('Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.on('message', async (msg) => {
    if (!ALLOWED.includes(msg.from)) {
        // TODO: Add proper auth with roles and multiple users
        return;
    }

    // Added for initial verification of flow
    // TODO: Refactor to sctructure commands better and not have this in the main message handler
    // TODO:Add LLM command parsing and routing later as well
    const text = msg.body.trim();
    const contact = await msg.getContact();
    const name = contact.pushname || 'Unknown';
    const [command, ...args] = text.split(' ');
    const shoppingReply = handleShopping(command, args, name);

    if (shoppingReply) {
        return msg.reply(shoppingReply);
    }

    // Everything else goes to Claude as a normal chat message for fallback handling and general conversation
    try {
        const reply = await chat(msg.from, text, SYSTEM_PROMPT);
        msg.reply(reply);
    } catch (err) {
        console.error(err);
        msg.reply('Sorry, something went wrong!');
    }
});

client.initialize();
