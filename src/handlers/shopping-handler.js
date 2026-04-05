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
    description: 'Create a new shopping list with five columns.'
                + ' It will be created as a table in an sql database.'
                + ' Remember to check if the table exists already before creating and only use alphanumeric characters and underscores for table names.'
                + ' The five columns will be name (string), description (string), quantity (number), added_by (string), and bought (boolean).',
    input_schema: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'The name of the table to create'
            },
            description: {
                type: 'string',
                description: 'A short description of the table'
            }
        },
        required: ['name', 'description']
    }
};

const handleCreateShoppingList = (name, description) => {
    console.log(`handleCreateShoppingList called with name: ${name}, description: ${description}`);
    if (!name || !description) {
        return 'What should I create? Please provide a valid table definition with name and description.';
    }

    createTable({ name, description });

    return `Created table: ${name}`;
}

const JSON_DESCRIPTION_ADD = {
    name: 'add_to_shopping_list',
    description: 'Add items to the shopping list',
    input_schema: {
        type: 'object',
        properties: {
            items: {
                type: 'array',
                description: 'Array of new items to create.'
                            + ' Each item should have the following properties: tableName (string), name (string), quantity (number), '
                            + 'description (string), addedBy (string), bought (int represented as 0 or 1).'
                            + ' The tableName property specifies which shopping list table to add the item to.'
                            + ' The name property is the name of the item to add.'
                            + ' The quantity property is the quantity of the item to add.'
                            + ' The description property is a short description of the item.'
                            + ' The addedBy property is the name of the person adding the item.'
                            + ' The bought property indicates whether the item has been bought (0 or 1, where 1 means bought).'
                            + 'Example input: { items: [ { tableName: "weekly_groceries", name: "milk", quantity: 2, description: "2% milk", addedBy: "Alice", bought: 0 } ] }',
                items: {
                    type: 'object',
                    properties: {
                        tableName: {
                            type: 'string',
                            description: 'The name of the shopping list table to add items to'
                        },
                        name: {
                            type: 'string',
                            description: 'The name of the item'
                        },
                        quantity: {
                            type: 'number',
                            description: 'The quantity of the item'
                        },
                        description: {
                            type: 'string',
                            description: 'A short description of the item'
                        },
                        addedBy: {
                            type: 'string',
                            description: 'The name of the person adding the item'
                        },
                        bought: {
                            type: 'number',
                            description: 'Whether the item has been bought'
                        }
                    },
                    required: ['tableName', 'name', 'quantity', 'description', 'addedBy', 'bought'],
                    additionalProperties: false
                }
            }
        },
        required: ['items'],
        additionalProperties: false
    }
};

const handleShoppingAdd = (items) => {
    console.log(`handleShoppingAdd called with items: ${JSON.stringify(items)}`);
    if (!items || !Array.isArray(items) || items.length === 0) {
        return 'No empty items to add! Please provide an array of items with the following properties: tableName (string), name (string), quantity (number), description (string), addedBy (string), bought (int represented as 0 or 1). Example input: { items: [ { tableName: "weekly_groceries", name: "milk", quantity: 2, description: "2% milk", addedBy: "Alice", bought: 0 } ] }';
    }

    const addedItems = [];
    items.forEach(item => {
        const { tableName, name, quantity, description, addedBy, bought } = item;
        addItems(tableName, name, quantity, description, addedBy, bought);
        addedItems.push(`${name} (qty: ${quantity})`);
    });

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

    const lines = rows.map((r) => {
        const bought = r.bought ? '✓' : ' ';
        return `[${bought}] ID ${r.id}: ${r.item} (qty: ${r.quantity}) - ${r.description}`;
    });

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
    description: 'Mark an item as bought by its ID',
    input_schema: {
        type: 'object',
        properties: {
            tableName: {
                type: 'string',
                description: 'The name of the shopping list table'
            },
            itemId: {
                type: 'number',
                description: 'The ID of the item to mark as bought (not the position number)'
            }
        },
        required: [ 'tableName' ,'itemId'],
        additionalProperties: false
    }
};

const handleShoppingDone = (tableName, itemId) => {
    console.log(`handleShoppingDone called with itemId: ${itemId}, tableName: ${tableName}`);

    const item = markDone(tableName, itemId);

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
