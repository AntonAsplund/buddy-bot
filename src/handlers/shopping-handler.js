const {
    addItems,
    listItems,
    markDone,
    clrBought,
    createTable,
    listAllShoppingLists
} = require('../services/shopping-service');

const JSON_DESCRIPTION_CREATE_LIST = {
    name: 'create_shopping_list',
    description: 'Create a new shopping list with specified items. It will be created as a table in an sql database. Remember to check if the table exists already before creating and only use alphanumeric characters and underscores for table names and columns.',
    input_schema: {
        type: 'object',
        properties: {
            items: {
                type: 'array',
                description: 'Array of new shopping tables to create',
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'The name of the table to create'
                        },
                        description: {
                            type: 'string',
                            description: 'A short description of the table'
                        },
                        columns: {
                            type: 'array',
                            description: 'Array of columns for the table. Each column should have a name and a data type.',
                            items: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                        description: 'The name of the column'
                                    },
                                    type: {
                                        type: 'string',
                                        description: 'The data type of the column'
                                    }
                                },
                                required: ['name', 'type']
                            }
                        }
                    },
                    required: ['name', 'description', 'columns']
                }
            }
        },
        required: ['items'],
        additionalProperties: false
    }
};

const handleCreateShoppingList = (items) => {
    console.log(`handleCreateShoppingList called with items: ${JSON.stringify(items)}`);
    if (!items || !Array.isArray(items) || items.length === 0) {
        return 'What should I create? Please provide tables with names, descriptions, and columns.';
    }

    createTable(items);

    return `Created tables: ${items.map(item => item.name).join(', ')}`;
}

const JSON_DESCRIPTION_ADD = {
    name: 'add_to_shopping_list',
    description: 'Add items to the shopping list',
    input_schema: {
        type: 'object',
        properties: {
            tableName: {
                type: 'string',
                description: 'The name of the shopping list table to add items to'
            },
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
        required: ['items', 'tableName'],
        additionalProperties: false
    }
};

const handleShoppingAdd = (tableName, items, senderName) => {
    console.log(`handleShoppingAdd called with tableName: ${tableName}, items: ${JSON.stringify(items)}, senderName: ${senderName}`);
    if (!items || !Array.isArray(items) || items.length === 0) {
        return 'What should I add? Please provide items with names and quantities.';
    }

    const addedItems = [];
    for (const item of items) {
        addItems(tableName, item.name, item.quantity, senderName);
        addedItems.push(`${item.name} (qty: ${item.quantity})`);
    }

    return `Added to list: ${addedItems.join(', ')}`;
};

const JSON_DESCRIPTION_LIST = {
    name: 'list_shopping_items',
    description: 'List all items in a specific shopping list',
    input_schema: {
        type: 'object',
        properties: {
            tableName: {
                type: 'string',
                description: 'The name of the shopping list table to list items from'
            }
        },
        required: ['tableName'],
        additionalProperties: false
    }
};

const handleShoppingShowList = (tableName) => {
    console.log(`handleShoppingShowList called with tableName: ${tableName}`);
    const rows = listItems(tableName);

    if (!rows.length) {
        return 'Shopping list is empty!';
    }

    const lines = rows.map((r, i) => `${i + 1}. ${r.item} (qty: ${r.quantity}) - ${r.added_by}`);

    return `*Shopping List*\n${lines.join('\n')}`;
};

const JSON_DESCRIPTION_SHOW_ALL_LISTS = {
    name: 'show_all_shopping_lists',
    description: 'Show all shopping lists with their descriptions',
    input_schema: {
        type: 'object',
        properties: {},
        additionalProperties: false
    }
};

const handleShowAllShoppingLists = () => {
    console.log(`handleShowAllShoppingLists called`);
    const rows = listAllShoppingLists();
    
    if (!rows.length) {
        return 'No shopping lists found!';
    }
    const lines = rows.map((r, i) => `${i + 1}. ${r.name} - ${r.description}`);
    
    return `*Shopping Lists*\n${lines.join('\n')}`;
}


const JSON_DESCRIPTION_DONE = {
    name: 'mark_item_as_bought',
    description: 'Mark an item as bought',
    input_schema: {
        type: 'object',
        properties: {
            tableName: {
                type: 'string',
                description: 'The name of the shopping list table'
            },
            item_number: {
                type: 'number',
                description: 'The number of the item to mark as bought'
            }
        },
        required: ['item_number', 'tableName'],
        additionalProperties: false
    }
};

const handleShoppingDone = (itemNumber, tableName, senderName) => {
    console.log(`handleShoppingDone called with itemNumber: ${itemNumber}, tableName: ${tableName}, senderName: ${senderName}`);

    const idx = parseInt(itemNumber, 10) - 1;
    const item = markDone(idx, tableName);

    return `Marked as bought: ${item}`;
};

const JSON_DESCRIPTION_CLEAR = {
    name: 'clear_bought_items',
    description: 'Clear all bought items from the shopping list',
    input_schema: {
        type: 'object',
        properties: {
            tableName: {
                type: 'string',
                description: 'The name of the shopping list table'
            }
        },
        required: ['tableName'],
        additionalProperties: false
    }
};

const handleShoppingClear = (tableName) => {
    console.log(`handleShoppingClear called with tableName: ${tableName}`);
    const clearedItems = clrBought(tableName);

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
    handleShoppingClear,
    JSON_DESCRIPTION_CREATE_LIST,
    handleCreateShoppingList,
    JSON_DESCRIPTION_SHOW_ALL_LISTS,
    handleShowAllShoppingLists
};
