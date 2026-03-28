const db = require('../core/database');

const addItems = (items, quantity, senderName) => {
    const stmt = db.prepare(
        'INSERT INTO shopping_items (item, quantity, added_by) VALUES (?, ?, ?)'
    );
    const qty = quantity || 1;
    items.forEach((item) => stmt.run(item, qty, senderName));
    return items;
};

const listItems = () => {
    const rows = db
        .prepare(
            'SELECT item, quantity, added_by FROM shopping_items WHERE bought = 0 ORDER BY id'
        )
        .all();

    return rows;
};

const markDone = (idx) => {
    const rows = db
        .prepare(
            'SELECT id, item FROM shopping_items WHERE bought = 0 ORDER BY id'
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

const clrBought = () => {
    const info = db
        .prepare('DELETE FROM shopping_items WHERE bought = 1')
        .run();

    return info.changes;
};

module.exports = { addItems, listItems, markDone, clrBought };
