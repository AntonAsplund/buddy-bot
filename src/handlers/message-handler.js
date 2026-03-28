const { handleShopping } = require('../../handlers/shopping-handler');
const { chat } = require('../../core/claude');
const { saveMediaAsFile } = require('../../utils/media-utils');

const SYSTEM_PROMPT = `You are a friendly family assistant.
Keep replies short and casual. You help with shopping,
and chatting. Reply in the same language as the user.`;

const ADMIN_SYSTEM_PROMPT = `You are a helpful assistant for managing family tasks and activities.
You can help with shopping list management, activity scheduling, and general family organization.
Keep replies concise and actionable. When responding to shopping list commands, provide clear instructions and confirmations.
When responding to activity scheduling commands, confirm details and provide reminders as needed.`;



export const handleMessage = async (msg, userGroup) => {
    // TODO: Implement message handling logic based on user group and message content
    // This is where you would parse the message, determine if it's a command, and route it to the appropriate handler
    // For example, if the message starts with "!", it could be a command that we want to handle
    // This is a placeholder implementation and should be expanded based on your specific requirements

    // Added for initial verification of flow
    // TODO:Add LLM command parsing and routing
    const text = msg.body.trim();
    const contact = await msg.getContact();
    const name = contact.pushname || 'Unknown';
    const [command, ...args] = text.split(' ');
    const shoppingReply = handleShopping(command, args, name);

    console.log(shoppingReply);

    if (shoppingReply) {
        msg.reply(shoppingReply);
    }

    if (msg.hasMedia && userGroup === 'admin') {
        saveMediaAsFile(msg).then((result) => {
            if (result.success) {
                msg.reply(`Media saved as ${result.filename}`);
            }
            
            msg.reply(`Failed to save media: ${result.error}`);
        });
        return;
    }

    // Everything else goes to Claude as a normal chat message for fallback handling and general conversation
    try {
        msg.reply( await chat(msg.from, text, userGroup === 'admin' ? ADMIN_SYSTEM_PROMPT : SYSTEM_PROMPT));
    } catch (err) {
        console.error(err);
        msg.reply('Sorry, something went wrong!');
    }
}