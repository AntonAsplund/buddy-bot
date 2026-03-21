const fs = require('fs').promises;
const path = require('path');

const MEDIA_DIR = path.join(__dirname, '../../data/media');

/**
 * Saves media from a WhatsApp message to local storage
 * @param {Object} msg - The message object from whatsapp-web.js
 * @returns {Promise<{success: boolean, filename?: string, filepath?: string, error?: string}>}
 */
const saveMediaAsFile = async (msg) => {
    try {
        if (!msg.hasMedia) {
            return { success: false, error: 'Message does not contain media' };
        }

        const media = await msg.downloadMedia();

        const mimeType = media.mimetype || 'application/octet-stream';
        const extension = mimeType.split('/')[1] || 'bin';
        const filename = `${msg.from}_${Date.now()}.${extension}`;
        const filepath = path.join(MEDIA_DIR, filename);
        
        await fs.mkdir(MEDIA_DIR, { recursive: true });
        
        const buffer = Buffer.from(media.data, 'base64');
        await fs.writeFile(filepath, buffer);
        
        return {
            success: true,
            filename,
            filepath,
            mimetype: media.mimetype,
            size: buffer.length
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    }
};

module.exports = { saveMediaAsFile };
