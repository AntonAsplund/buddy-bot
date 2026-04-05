const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../../data/family.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS shopping_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    description TEXT,
    added_by TEXT,
    bought INTEGER DEFAULT 0 
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child TEXT NOT NULL,
    activity TEXT NOT NULL,
    day TEXT,
    time TEXT,
    location TEXT
  ); 

  CREATE TABLE IF NOT EXISTS shopping_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
  );

`);

module.exports = db;
