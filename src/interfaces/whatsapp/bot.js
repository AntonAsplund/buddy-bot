require('dotenv').config();
const qrcode = require('qrcode-terminal');

const { Client, LocalAuth } = require('whatsapp-web.js');
const { getUserGroupForPhoneNumber, verifyAccessForPhoneNumber } = require('../../utils/auth-utils');
const { handleMessage } = require('../../handlers/message-handler');

const client = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html`,
    },
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
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

client.on('message', async (msg) => {
    console.log(`Received message from ${msg.from}: ${msg.body}`);

    // Get the sender's phone number from contact
    let senderPhone = null;
    try {
        const contact = await msg.getContact();
        senderPhone = contact.number;
        console.log(`  Contact phone number: ${senderPhone}`);
    } catch (err) {
        console.error(`  Error fetching contact: ${err.message}`);
    }

    if (!senderPhone || !verifyAccessForPhoneNumber(senderPhone)) {
        console.log(`Unauthorized access attempt from ${msg.from}`);
        return;
    }

    const currentUserGroup = getUserGroupForPhoneNumber(senderPhone);
    handleMessage(msg, currentUserGroup);
});

client.initialize();
