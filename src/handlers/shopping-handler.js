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
            items: {
                type: 'array',
                description: 'Array of items to add to the shopping list',
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'The name of the item'
                        },
                        quantity: {
                            type: 'number',
                            description: 'The quantity of the item'
                        }
                    },
                    required: ['name', 'quantity']
                }
            }
        },
        required: ['items'],
        additionalProperties: false
    }
};

const handleShoppingAdd = (items, senderName) => {
    console.log(`handleShoppingAdd called with items: ${JSON.stringify(items)}, senderName: ${senderName}`);
    if (!items || !Array.isArray(items) || items.length === 0) {
        return 'What should I add? Please provide items with names and quantities.';
    }

    const addedItems = [];
    for (const item of items) {
        addItems([item.name], item.quantity, senderName);
        addedItems.push(`${item.name} (qty: ${item.quantity})`);
    }

    return `Added to list: ${addedItems.join(', ')}`;
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
    console.log('handleShoppingShowList called');
    const rows = listItems();

    if (!rows.length) {
        return '🛒 Shopping list is empty!';
    }

    const lines = rows.map((r, i) => `${i + 1}. ${r.item} (qty: ${r.quantity}) - ${r.added_by}`);

    return `*Shopping List*\n${lines.join('\n')}`;
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
    console.log(`handleShoppingDone called with args: ${args}, senderName: ${senderName}`);
    if (!args.length) {
        return 'Which item number did you buy? Try: !done 2';
    }

    const idx = parseInt(args[0], 10) - 1;
    const item = markDone(idx);

    return `Marked as bought: ${item}`;
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
    console.log('handleShoppingClear called');
    const clearedItems = clrBought();

    return `Removed ${clearedItems} bought item(s).`;
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
