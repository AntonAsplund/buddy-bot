const fs = require('fs');
const path = require('path');

// Make sure data folder exists
const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

require('./interfaces/whatsapp/bot');
const { startScheduler, stopScheduler } = require('./core/scheduler-bootstrap');

console.log('Family Assistant starting...');

// Initialize and start scheduler
(async () => {
    try {
        await startScheduler();
    } catch (error) {
        console.error('Failed to start scheduler:', error);
    }
})();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    stopScheduler();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    stopScheduler();
    process.exit(0);
});
