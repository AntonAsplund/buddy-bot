const db = require('../core/database');

const createTable = (tables) => {
    tables.forEach((table) => {
        const columnsDef = table.columns
            .map((col) => `${col.name} ${col.type}`)
            .join(', ');
            
        const createTableSQL = `CREATE TABLE IF NOT EXISTS ${table.name} (${columnsDef})`;
        db.prepare(createTableSQL).run();
    });

    // Add the tables to a master list of shopping lists
    tables.forEach((table) => {
        db.prepare(`INSERT INTO shopping_lists (name, description) VALUES (?, ?)`).run(table.name, table.description);
    });

    return `Created tables: ${tables.map(table => table.name).join(', ')}`;
};

const listAllShoppingLists = () => {
    const rows = db.prepare(`SELECT name, description FROM shopping_lists`).all();
    return rows;
}

const addItems = (tableName, item, quantity, senderName) => {
    const stmt = db.prepare(
        `INSERT INTO ${tableName} (item, quantity, added_by) VALUES (?, ?, ?)`
    );
    const qty = quantity || 1;
    stmt.run(item, qty, senderName);
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

const markDone = (idx, tableName) => {
    const rows = db
        .prepare(
            `SELECT id, item FROM ${tableName} WHERE bought = 0 ORDER BY id`
        )
        .all();

    if (isNaN(idx) || !rows[idx]) {
        return null;
    }

    db.prepare('UPDATE shopping_items SET bought = 1 WHERE id = ?').run(
        rows[idx].id
    );

    return rows[idx].item;
};

const clrBought = (tableName) => {
    const info = db
        .prepare(`DELETE FROM ${tableName} WHERE bought = 1`)
        .run();

    return info.changes;
};

module.exports = { addItems, listItems, markDone, clrBought, createTable, listAllShoppingLists };
