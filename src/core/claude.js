require('dotenv').config();
const { availableToolsForUserGroup, executeTool } = require('./handlers');
const { getPrompt } = require('./prompts');
const Anthropic = require('@anthropic-ai/sdk');
const { getConversationHistory, batchAddConversationMessages, clearHistory: clearHistoryService } = require('../services/conversation-history');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); 

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
    const dbHistory = getConversationHistory(userId, 20);
    const messages = [...dbHistory];
    const newMessages = [];

    const userMsg = { role: 'user', content: userMessage };
    messages.push(userMsg);
    newMessages.push(userMsg);

    let response = await callClaudeAPI(messages, userGroup);

    while (response.content.some(block => block.type === 'tool_use')) {
        const assistantMsg = { role: 'assistant', content: response.content };
        messages.push(assistantMsg);
        newMessages.push(assistantMsg);

        const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
        const toolResults = await executeToolsAndGetResults(toolUseBlocks, userId);

        const toolResultMsg = { role: 'user', content: toolResults };
        messages.push(toolResultMsg);
        newMessages.push(toolResultMsg);

        response = await callClaudeAPI(messages, userGroup);
    }

    const reply = response.content[0].text || 'Done!';
    const finalMsg = { role: 'assistant', content: reply };
    messages.push(finalMsg);
    newMessages.push(finalMsg);

    batchAddConversationMessages(userId, newMessages);
    
    return reply;
}

function clearHistory(userId) {
    clearHistoryService(userId);
}

module.exports = { chat, clearHistory };
