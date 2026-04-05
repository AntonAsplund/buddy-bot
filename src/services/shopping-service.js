const db = require('../core/database');

const createTable = (table) => {
    const createTableSQL = `CREATE TABLE IF NOT EXISTS ${table.name} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL,
        added_by TEXT,
        bought INTEGER DEFAULT 0
    )`;
    db.prepare(createTableSQL).run();

    // Add the table to a master list of shopping lists
    db.prepare(`INSERT INTO shopping_lists (name, description) VALUES (?, ?)`).run(table.name, table.description);

    return `Created table: ${table.name}`;
};

const listAllShoppingLists = () => {
    const rows = db.prepare(`SELECT name, description FROM shopping_lists`).all();
    return rows;
}

const addItems = (tableName, item, quantity, description, addedBy, bought) => {
    const stmt = db.prepare(
        `INSERT INTO ${tableName} (item, quantity, description, added_by, bought) VALUES (?, ?, ?, ?, ?)`
    );
    const qty = quantity || 1;
    stmt.run(item, qty, description, addedBy, bought);
    return item;
};

const listItems = (tableName) => {
    const rows = db
        .prepare(
            `SELECT * FROM ${tableName} ORDER BY id`
        )
        .all();

    return rows;
};

const markDone = (tableName, itemId) => {
    const row = db
        .prepare(
            `SELECT id, item FROM ${tableName} WHERE id = ?`
        )
        .get(itemId);

    if (!row) {
        return null;
    }

    db.prepare(`UPDATE ${tableName} SET bought = 1 WHERE id = ?`).run(itemId);

    return row.item;
};

const clrBought = (tableName) => {
    const info = db
        .prepare(`DELETE FROM ${tableName} WHERE bought = 1`)
        .run();

    return info.changes;
};

module.exports = { addItems, listItems, markDone, clrBought, createTable, listAllShoppingLists };
