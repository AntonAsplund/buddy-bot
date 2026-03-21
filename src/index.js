const fs = require('fs');
const path = require('path');

// Make sure data folder exists
const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

require('./interfaces/whatsapp/bot');

console.log('Family Assistant starting...');
