const {
    JSON_DESCRIPTION_ADD,
    JSON_DESCRIPTION_LIST,
    JSON_DESCRIPTION_DONE,
    JSON_DESCRIPTION_CLEAR,
    JSON_DESCRIPTION_CREATE_LIST,
    JSON_DESCRIPTION_SHOW_ALL_LISTS,
    handleShoppingAdd,
    handleShoppingShowList, 
    handleShoppingDone, 
    handleShoppingClear,
    handleCreateShoppingList,
    handleShowAllShoppingLists

 } = require('../handlers/shopping-handler');

const availableToolsForUserGroup = (userGroup) => {
    if (userGroup === 'admin') {
        return [JSON_DESCRIPTION_CREATE_LIST,
                JSON_DESCRIPTION_ADD,
                JSON_DESCRIPTION_LIST,
                JSON_DESCRIPTION_DONE,
                JSON_DESCRIPTION_CLEAR,
                JSON_DESCRIPTION_SHOW_ALL_LISTS];
    }
    
    return [JSON_DESCRIPTION_ADD,
            JSON_DESCRIPTION_LIST,
            JSON_DESCRIPTION_DONE,
            JSON_DESCRIPTION_CLEAR,
            JSON_DESCRIPTION_SHOW_ALL_LISTS];
};

const executeTool = (toolName, toolInput, userId) => {
    console.log(`Executing tool: ${toolName} with input: ${JSON.stringify(toolInput)} for userId: ${userId}`);

    switch (toolName) {
        case 'create_shopping_list':
            return handleCreateShoppingList(toolInput.name, toolInput.description);
        case 'add_to_shopping_list':
            return handleShoppingAdd(toolInput.items);
        case 'list_shopping_items':
            return handleShoppingShowList(toolInput.tableName);
        case 'show_all_shopping_lists':
            return handleShowAllShoppingLists();
        case 'mark_item_as_bought':
            return handleShoppingDone(toolInput.tableName, toolInput.itemId);
        case 'clear_bought_items':
            return handleShoppingClear(toolInput.tableName);
        default:
            return `Unknown tool: ${toolName}`;
    }
}

module.exports = {
    availableToolsForUserGroup,
    executeTool
};