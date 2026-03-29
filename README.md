# Buddy Bot 🤖

A WhatsApp bot that uses Claude to help with shopping lists and casual family chat. This started as an experiment to see what's possible with WhatsApp automation and AI, and it's been pretty fun to build.

## What it does

- Connect to WhatsApp and respond to messages
- Parse natural language like "I need milk and bread" and add them to a list
- Use Claude to understand context and respond intelligently
- Keep track of who's buying what with a simple shopping list
- Respect different permission levels (admin vs regular users)

The main thing that makes this work is getting Claude to understand **when** to use its tools vs just chatting. That's still something I'm experimenting with.

## Getting started

**You'll need:**
- Node.js (v20 or so)
- A WhatsApp account 
- An API key from Anthropic

**Setup:**
```bash
git clone <your-repo>
cd buddy-bot
npm install
```

Create a `.env` file:
```env
ANTHROPIC_API_KEY=sk-ant-...
ALLOWED_PHONES=1234567890
ADMIN_PHONE=1234567890
```

Then run:
```bash
npm run dev
```

Scan the QR code with WhatsApp and you're good to go.

## How it works

The flow is pretty straightforward:
1. WhatsApp message comes in → white listed by phone number
2. Fetch the contact's actual phone number (the `@lid` format is annoying)
3. Send to Claude with available tools
4. If Claude wants to add items, execute that tool
5. Send the response back

The trickiest part was getting Claude to format the shopping list requests properly. It kept trying different formats until I defined the exact JSON structure it should use.

## File structure

```
src/
├── index.js                  # Entry point
├── core/
│   ├── claude.js             # Handles conversation with Claude
│   └── database.js           # SQLite stuff
├── handlers/
│   ├── message-handler.js    # Routes messages
│   └── shopping-handler.js   # Shopping list logic
├── interfaces/whatsapp/
│   └── bot.js                # WhatsApp Web.js client
├── services/
│   └── shopping-service.js   # Database queries
└── utils/
    ├── auth-utils.js         # Phone number checking
    └── media-utils.js        # Media downloads
```

## What I learned

- WhatsApp Web.js is cool but fragile - it breaks when WhatsApp updates their web interface
- Claude's tool-use works really well once you get the format right
- Keeping only the last 20 messages saves a lot on API costs
- Phone number handling in WhatsApp is a mess (hence the `@lid` stuff)

## Things that still need work

- The Puppeteer context destruction error happens sometimes - not sure why yet
- It only remembers the last 20 messages, which is fine for testing but not ideal long-term
- SQLite works but this would need proper infrastructure for real family use
- No proper error handling or logging to a file

## What's next

Some ideas I want to try:
- Scheduled reminders for groceries
- Family member profiles so it remembers preferences
- Better conversation memory (maybe with embeddings?)
- A way to actually see the shopping list from the web
- Better offline support when WhatsApp Web isn't available

## Running it locally

```bash
npm run dev          # Watch mode
npm run lint         # Check code
npm run lint:fix     # Auto-fix linting issues
npm run format       # Prettier formatting
```

## Troubleshooting

**"Execution context was destroyed"** 
- Clear the cache: `rm -rf .wwebjs_auth .wwebjs_cache`
- Restart and scan the QR code again

**Bot not responding**
- Check the phone number actually got added to `.env`
- Make sure your API key works
- The WhatsApp Web session might have timed out

## License

MIT - do what you want with it

---

This is still very much experimental. If you find bugs or have ideas, let me know!