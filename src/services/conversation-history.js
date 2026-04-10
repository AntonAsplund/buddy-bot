const db = require('../core/database');

/**
 * Fetch last N messages for a user from the database
 */
function getConversationHistory(userId, limit = 20) {
    const rows = db.prepare(`
        SELECT role, content FROM conversations 
        WHERE userId = ? 
        ORDER BY id ASC 
        LIMIT ?
    `).all(userId, limit);
    
    return rows.map(row => ({
        role: row.role,
        content: JSON.parse(row.content)
    }));
}

/**
 * Add multiple messages to the conversation history (batch insert)
 */
function batchAddConversationMessages(userId, messages) {
    const stmt = db.prepare(`
        INSERT INTO conversations (userId, role, content) 
        VALUES (?, ?, ?)
    `);
    
    const insertMany = db.transaction((msgs) => {
        for (const msg of msgs) {
            stmt.run(userId, msg.role, JSON.stringify(msg.content));
        }
    });
    
    insertMany(messages);
}

/**
 * Clear all conversation history for a user
 */
function clearHistory(userId) {
    db.prepare('DELETE FROM conversations WHERE userId = ?').run(userId);
}

module.exports = {
    getConversationHistory,
    batchAddConversationMessages,
    clearHistory
};
