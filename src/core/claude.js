require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const conversations = {}; // TODO: Update to make use of DB for context persistance between messages.
const {
    JSON_DESCRIPTION_ADD,
    JSON_DESCRIPTION_LIST,
    JSON_DESCRIPTION_DONE,
    JSON_DESCRIPTION_CLEAR,
    handleShoppingAdd,
    handleShoppingShowList, 
    handleShoppingDone, 
    handleShoppingClear

 } = require('../handlers/shopping-handler');

 const SYSTEM_PROMPT = `You are a friendly family assistant.
Keep replies short and casual. You help with shopping,
and chatting. Reply in the same language as the user.`;

const ADMIN_SYSTEM_PROMPT = `You are a helpful assistant for managing family tasks and activities.
You can help with shopping list management, activity scheduling, and general family organization.
You can also chat and provide information as needed.
Keep replies concise and actionable. When responding to shopping list commands, provide clear instructions and confirmations.
When responding to activity scheduling commands, confirm details and provide reminders as needed.`;


const availableToolsForUserGroup = (userGroup) => {
    // For example, you could have different tools available for 'admin' vs 'user'
    if (userGroup === 'admin') {
        return [JSON_DESCRIPTION_ADD, JSON_DESCRIPTION_LIST, JSON_DESCRIPTION_DONE, JSON_DESCRIPTION_CLEAR];
    }
    
    return [JSON_DESCRIPTION_ADD, JSON_DESCRIPTION_LIST, JSON_DESCRIPTION_DONE, JSON_DESCRIPTION_CLEAR];
}

async function chat(userId, userMessage, userGroup) {
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
        system: userGroup === 'admin' ? ADMIN_SYSTEM_PROMPT : SYSTEM_PROMPT,
        messages: conversations[userId],
        tools: availableToolsForUserGroup(userGroup)
    }, { maxRetries: 5 });

    // Check if response contains tool_use blocks
    const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
    
    if (toolUseBlocks.length > 0) {
        // Add the assistant's response (which contains tool_use blocks) to conversation
        conversations[userId].push({ role: 'assistant', content: response.content });
        
        // Execute all tools and collect results
        const toolResults = await Promise.all(
            toolUseBlocks.map(async (toolUse) => {
                console.log(`Executing tool: ${toolUse.name} with input: ${JSON.stringify(toolUse.input)} for userId: ${userId}`);
                const result = await executeTool(toolUse.name, toolUse.input, userId);
                console.log(`Tool ${toolUse.name} executed with result: ${result}`);
                return {
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: result
                };
            })
        );
        
        // Add all tool results in a single user message
        conversations[userId].push({ 
            role: 'user', 
            content: toolResults
        });

        // Make another request to get the final response after tool execution
        const finalResponse = await client.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1024,
            system: userGroup === 'admin' ? ADMIN_SYSTEM_PROMPT : SYSTEM_PROMPT,
            messages: conversations[userId],
            tools: availableToolsForUserGroup(userGroup)
        }, { maxRetries: 5 });

        const reply = finalResponse.content[0].text || 'Done!';
        conversations[userId].push({ role: 'assistant', content: reply });
        return reply;
    }

    // Handle text responses (no tool use)
    const reply = response.content[0].text || 'I didn\'t understand that.';
    conversations[userId].push({ role: 'assistant', content: reply });

    return reply;
}

const executeTool = (toolName, toolInput, userId) => {
    console.log(`Executing tool: ${toolName} with input: ${JSON.stringify(toolInput)} for userId: ${userId}`);

    switch (toolName) {
        case 'add_to_shopping_list':
            return handleShoppingAdd(toolInput.items, userId);
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
