const {
    addItems,
    listItems,
    markDone,
    clrBought,
} = require('../services/shopping-service');

const JSON_DESCRIPTION_ADD = {
    name: 'add_to_shopping_list',
    description: 'Add items to the shopping list',
    input_schema: {
        type: 'object',
        properties: {
            item: {
                type: 'string',
                description: 'Single item or comma-separated items to add (e.g., "milk" or "milk, eggs, bread")'
            },
            quantity: {
                type: 'number',
                description: 'Quantity of the item'
            }
        },
        required: ['item'],
        additionalProperties: false
    }
};

const handleShoppingAdd = (args, quantity, senderName) => {
    if (!args.length) {
        return 'What should I add? Try: !add milk';
    }
    const items = args
        .join(' ')
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

    const updatedItems = addItems(items, quantity, senderName);

    return `✅ Added to list: ${updatedItems.join(', ')}`;
};

const JSON_DESCRIPTION_LIST = {
    name: 'list_shopping_items',
    description: 'List all items in the shopping list',
    input_schema: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false
    }
};

const handleShoppingShowList = () => {
    const rows = listItems();

    if (!rows.length) {
        return '🛒 Shopping list is empty!';
    }

    const lines = rows.map((r, i) => `${i + 1}. ${r.item} (qty: ${r.quantity}) - ${r.added_by}`);

    return `🛒 *Shopping List*\n${lines.join('\n')}`;
};


const JSON_DESCRIPTION_DONE = {
    name: 'mark_item_as_bought',
    description: 'Mark an item as bought',
    input_schema: {
        type: 'object',
        properties: {
            item_number: {
                type: 'number',
                description: 'The number of the item to mark as bought'
            }
        },
        required: ['item_number'],
        additionalProperties: false
    }
};

const handleShoppingDone = (args, senderName) => {
    if (!args.length) {
        return 'Which item number did you buy? Try: !done 2';
    }

    const idx = parseInt(args[0], 10) - 1;
    const item = markDone(idx);

    return `✔️ Marked as bought: ${item}`;
};

const JSON_DESCRIPTION_CLEAR = {
    name: 'clear_bought_items',
    description: 'Clear all bought items from the shopping list',
    input_schema: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false
    }
};

const handleShoppingClear = () => {
    const clearedItems = clrBought();

    return `🗑️ Removed ${clearedItems} bought item(s).`;
};

module.exports = {
    JSON_DESCRIPTION_ADD,
    handleShoppingAdd,
    JSON_DESCRIPTION_LIST,
    handleShoppingShowList,
    JSON_DESCRIPTION_DONE,
    handleShoppingDone,
    JSON_DESCRIPTION_CLEAR,
    handleShoppingClear
};
