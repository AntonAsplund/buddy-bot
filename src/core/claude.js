require('dotenv').config();
const { availableToolsForUserGroup, executeTool } = require('./handlers');
const { getPrompt } = require('./prompts');
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// TODO: Update to make use of DB for context persistance between messages.
const conversations = {}; 

/**
 * Make a single API call to Claude
 */
function callClaudeAPI(messages, userGroup) {
    return client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: getPrompt(userGroup),
        messages,
        tools: availableToolsForUserGroup(userGroup)
    }, { maxRetries: 5 });
}

/**
 * Execute tools and return formatted results
 */
function executeToolsAndGetResults(toolUseBlocks, userId) {
    return Promise.allSettled(
        toolUseBlocks.map(async (toolUse) => {
            try {
                console.log(`Executing tool: ${toolUse.name} with input: ${JSON.stringify(toolUse.input)} for userId: ${userId}`);
                const result = await executeTool(toolUse.name, toolUse.input, userId);
                console.log(`Tool ${toolUse.name} executed successfully with result: ${result}`);
                return {
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: result
                };
            } catch (error) {
                console.error(`Tool ${toolUse.name} failed for userId ${userId}:`, error.message);
                return {
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: `Error executing tool: ${error.message}`
                };
            }
        })
    ).then(results =>
        results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    );
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

    let response = await callClaudeAPI(conversations[userId], userGroup);

    while (response.content.some(block => block.type === 'tool_use')) {
        conversations[userId].push({ role: 'assistant', content: response.content });

        const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
        const toolResults = await executeToolsAndGetResults(toolUseBlocks, userId);

        conversations[userId].push({ role: 'user', content: toolResults });

        response = await callClaudeAPI(conversations[userId], userGroup);
    }

    // Handle final text response
    const reply = response.content[0].text || 'Done!';
    conversations[userId].push({ role: 'assistant', content: reply });
    
    return reply;
}

function clearHistory(userId) {
    conversations[userId] = [];
}

module.exports = { chat, clearHistory };
