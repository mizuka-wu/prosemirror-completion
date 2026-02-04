# ProseMirror Completion

> Copilot-style text completion plugin for ProseMirror, inspired by GitHub Copilot.

## Features

- 🎯 **Invisible Trigger**: Automatically triggers completion as you type
- 👻 **Ghost Text**: Visual suggestion overlay that doesn't interfere with editing
- ⌨️ **Intuitive Keybindings**: Tab to accept, Esc to cancel
- 🔌 **Customizable**: Debounce, abort controller, custom prompts
- 🤖 **WebLLM Integration**: Built-in support for browser-based LLM inference

## Quick Start

```bash
npm install @prosemirror-completion/plugin
```

```typescript
import { createCompletionPlugin } from "@prosemirror-completion/plugin";

const completionPlugin = createCompletionPlugin({
  debounceMs: 300,
  callCompletion: async (context) => {
    // Your completion logic here
    return "suggested text";
  },
});
```

## Architecture

The plugin is built with a three-layer architecture:

1. **Matcher (State Tracker)**: Tracks cursor position and triggers completion
2. **Ghost Decoration**: Virtual rendering layer for suggestion display
3. **Key Handler**: Intercepts Tab and Esc for completion actions

## Next Steps

- [Getting Started](./getting-started)
- [Configuration](./configuration)
- [WebLLM Integration](./webllm)
