require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const conversations = {}; // TODO: Update to make use of DB for context persistance between messages.
const {
    JSON_DESCRIPTION_ADD,
    JSON_DESCRIPTION_LIST,
    JSON_DESCRIPTION_MARK_DONE,
    JSON_DESCRIPTION_CLEAR_BOUGHT,
    handleShoppingAdd,
    handleShoppingShowList, 
    handleShoppingDone, 
    handleShoppingClear

 } = require('../handlers/message-handler');

// const determineAvailableToolsForUserGroup = (userGroup) => {
//     // For example, you could have different tools available for 'admin' vs 'user'
//     if (userGroup === 'admin') {
//         return ['shopping', 'activity_planner', 'general_chat'];
//     }
    
//     return ['shopping'];
// }

async function chat(userId, userMessage, systemPrompt) {
    if (!conversations[userId]) {
        conversations[userId] = [];
    }

    conversations[userId].push({ role: 'user', content: userMessage });

    // Keep last 20 messages to control costs
    if (conversations[userId].length > 20) {
        conversations[userId] = conversations[userId].slice(-20);
    }

    const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: conversations[userId],
        tools: [
            JSON_DESCRIPTION_ADD,
            JSON_DESCRIPTION_LIST,
            JSON_DESCRIPTION_MARK_DONE,
            JSON_DESCRIPTION_CLEAR_BOUGHT
        ]
    },
    { maxRetries: 5 });

    if (response.content[0].type === 'tool_use') {
        const toolToUse = response.content[0];
        const toolResult = await executeTool(toolToUse.name, toolToUse.input, userId);

        console.log(`Tool ${toolToUse.name} executed with result: ${toolResult}`);
        console.log('Full tool response:', toolResult);
    };

    const reply = response.content[0].text;
    conversations[userId].push({ role: 'assistant', content: reply });

    return reply;
}

const executeTool = (toolName, toolInput, userId) => {
    switch (toolName) {
        case 'add_to_shopping_list':
            return handleShoppingAdd(toolInput.item, toolInput.quantity, userId);
        case 'list_shopping_items':
            return handleShoppingShowList();
        case 'mark_item_as_bought':
            return handleShoppingDone([toolInput.item_number], userId);
        case 'clear_bought_items':
            return handleShoppingClear();
        default:
            return `Unknown tool: ${toolName}`;
    }
}

function clearHistory(userId) {
    conversations[userId] = [];
}

module.exports = { chat, clearHistory };
