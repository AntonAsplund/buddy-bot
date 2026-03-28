require('dotenv').config();
const qrcode = require('qrcode-terminal');

const { Client, LocalAuth } = require('whatsapp-web.js');
const { getUserGroupForPhoneNumber } = require('../../utils/auth-utils');
const { handleMessage } = require('../../handlers/message-handler');

const ALLOWED = (process.env.ALLOWED_PHONES || '').split(',');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-sync',
            '--disable-default-apps',
            '--disable-background-networking',
            '--disable-breakpad',
            '--disable-component-extensions-with-background-pages',
        ],
    },
});

client.on('qr', (qr) => {
    console.log('Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot is ready!');
});

client.on('disconnected', (reason) => {
    console.log('❌ Bot disconnected:', reason);
    console.log('Reconnecting in 5 seconds...');
    setTimeout(() => {
        client.initialize().catch((err) => {
            console.error('Failed to reconnect:', err.message);
        });
    }, 5000);
});

client.on('error', (error) => {
    console.error('⚠️ WhatsApp client error:', error.message);
});

// client.on('message_create', async (msg) => {
//     console.log(`\n[message_create event] FROM: ${msg.from} | BODY: ${msg.body}`);
// });

client.on('message_create', async (msg) => {
    console.log(`Received message from ${msg.from}: ${msg.body}`);

    if (!ALLOWED.includes(msg.from)) {
        // TODO: Add proper logging instead of console.log, and log to a file or monitoring system
        console.log(`Unauthorized access attempt from ${msg.from}`);
        return;
    }

    const currentUserGroup = getUserGroupForPhoneNumber(msg.from);
    handleMessage(msg, currentUserGroup);
});

client.initialize();
