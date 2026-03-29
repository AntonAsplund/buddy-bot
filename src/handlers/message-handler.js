const { chat } = require('../core/claude');
const { saveMediaAsFile } = require('../utils/media-utils');

const handleMessage = async (msg, userGroup) => {
    const text = msg.body.trim();

    // Move into a tool-based flow if message contains media and user is admin, otherwise treat as normal chat message for fallback handling and general conversation
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
        msg.reply( await chat(msg.from, text, userGroup));
    } catch (err) {
        console.error(err);
        msg.reply('Sorry, something went wrong!');
    }
}

module.exports = {
    handleMessage,
};