# ProseMirror Completion

Copilot-style text completion plugin for ProseMirror.

## Features

- 🎯 **Invisible Trigger**: Automatically triggers completion as you type
- 👻 **Ghost Text**: Visual suggestion overlay that doesn't interfere with editing
- ⌨️ **Intuitive Keybindings**: Tab to accept, Esc to cancel
- 🔌 **Customizable**: Debounce, abort controller, custom prompts
- 🤖 **WebLLM Integration**: Built-in support for browser-based LLM inference

## Installation

```bash
npm install @prosemirror-completion/plugin
```

## Quick Start

```typescript
import { createCompletionPlugin } from "@prosemirror-completion/plugin";

const completionPlugin = createCompletionPlugin({
  debounceMs: 300,
  callCompletion: async (context) => {
    return "suggested text";
  },
});
```

## Project Structure

```
packages/plugin/src/
├── types.ts       # Type definitions
├── plugin.ts      # Core plugin implementation
├── state.ts       # Plugin state management
├── decorations.ts # Ghost text rendering
├── keymap.ts      # Keyboard handlers
├── utils.ts       # Utility functions
├── prompts.ts     # Prompt builders
├── commands.ts    # Editor commands
└── index.ts       # Main exports

apps/
├── demo/          # Demo application with WebLLM
│   ├── src/main.ts
│   └── src/completion.test.ts
└── docs/          # VitePress documentation
    └── docs/
        ├── guide/
        ├── api/
        └── examples/
```

## Development

```bash
# Install dependencies
npm install

# Run demo
cd apps/demo && npm run dev

# Run tests
cd apps/demo && npm run test

# Build docs
cd apps/docs && npm run build
```

## Architecture

The plugin is built with a three-layer architecture:

1. **Matcher (State Tracker)**: Tracks cursor position and triggers completion using Transaction meta
2. **Ghost Decoration**: Virtual rendering layer using ProseMirror DecorationSet
3. **Key Handler**: Intercepts Tab and Esc for completion actions

## License

MIT
