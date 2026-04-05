require('dotenv').config();
const { availableToolsForUserGroup, executeTool } = require('./handlers');
const { getPrompt } = require('./prompts');
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// TODO: Update to make use of DB for context persistance between messages.
const conversations = {}; 

// TODO: Refactor the logic to handle tool_use blocks in a more elegant way.
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
        system: getPrompt(userGroup),
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
                    // TODO: Add error handling for tool execution.
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
        let finalResponse = await client.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1024,
            system: getPrompt(userGroup),
            messages: conversations[userId],
            tools: availableToolsForUserGroup(userGroup)
        }, { maxRetries: 5 });

        while (finalResponse.content.some(block => block.type === 'tool_use')) {
            conversations[userId].push({ role: 'assistant', content: finalResponse.content });
            
            const finalToolUseBlocks = finalResponse.content.filter(block => block.type === 'tool_use');
            const finalToolResults = await Promise.all(
                finalToolUseBlocks.map(async (toolUse) => {
                    console.log(`Executing tool in final response: ${toolUse.name} with input: ${JSON.stringify(toolUse.input)} for userId: ${userId}`);
                    const result = await executeTool(toolUse.name, toolUse.input, userId);
                    console.log(`Tool ${toolUse.name} executed with result: ${result}`);
                    return {
                        type: 'tool_result',
                        tool_use_id: toolUse.id,
                        content: result
                    };
                })
            );
            
            conversations[userId].push({ 
                role: 'user', 
                content: finalToolResults
            });
            
            finalResponse = await client.messages.create({
                model: 'claude-haiku-4-5',
                max_tokens: 1024,
                system: getPrompt(userGroup),
                messages: conversations[userId],
                tools: availableToolsForUserGroup(userGroup)
            }, { maxRetries: 5 });
        }

        const reply = finalResponse.content[0].text || 'Done!';
        conversations[userId].push({ role: 'assistant', content: reply });
        return reply;
    }

    // Handle text responses (no tool use)
    const reply = response.content[0].text || 'I didn\'t understand that.';
    conversations[userId].push({ role: 'assistant', content: reply });

    return reply;
}



function clearHistory(userId) {
    conversations[userId] = [];
}

module.exports = { chat, clearHistory };
