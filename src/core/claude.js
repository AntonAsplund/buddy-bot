require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const conversations = {};

async function chat(userId, userMessage, systemPrompt) {
    if (!conversations[userId]) {
        conversations[userId] = [];
    }

    conversations[userId].push({ role: 'user', content: userMessage });

    // Keep last 20 messages to control costs
    if (conversations[userId].length > 20) {
        conversations[userId] = conversations[userId].slice(-20);
    }

    // TODO: Add retry pattern
    const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: conversations[userId],
    });

    const reply = response.content[0].text;
    conversations[userId].push({ role: 'assistant', content: reply });

    return reply;
}

function clearHistory(userId) {
    conversations[userId] = [];
}

module.exports = { chat, clearHistory };
