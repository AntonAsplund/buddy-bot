const {
    addItems,
    listItems,
    markDone,
    clrBought,
} = require('../services/shopping-service');

function handleShopping(command, args, senderName) {
    const cmd = command.toLowerCase();

    if (cmd === '!add') {
        if (!args.length) {
            return 'What should I add? Try: !add milk';
        }
        const items = args
            .join(' ')
            .split(',')
            .map((i) => i.trim())
            .filter(Boolean);

        const updatedItems = addItems(items, senderName);

        return `✅ Added to list: ${updatedItems.join(', ')}`;
    }

    if (cmd === '!list') {
        const rows = listItems();

        if (!rows.length) {
            return '🛒 Shopping list is empty!';
        }

        const lines = rows.map((r, i) => `${i + 1}. ${r.item} (${r.added_by})`);

        return `🛒 *Shopping List*\n${lines.join('\n')}`;
    }

    if (cmd === '!done') {
        if (!args.length) {
            return 'Which item number did you buy? Try: !done 2';
        }

        const idx = parseInt(args[0], 10) - 1;
        const item = markDone(idx);

        return `✔️ Marked as bought: ${item}`;
    }

    if (cmd === '!clear') {
        const clearedItems = clrBought();

        return `🗑️ Removed ${clearedItems} bought item(s).`;
    }

    return 'Error: Unknown command. Use !add, !list, !done, or !clear.';
}

module.exports = { handleShopping };
