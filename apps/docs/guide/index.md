# ProseMirror Completion

> Copilot-style text completion plugin for ProseMirror, inspired by GitHub Copilot.

## Features

- 🎯 **Invisible Trigger**: Automatically fires completion as you type without extra shortcuts.
- 👻 **Ghost Text**: Suggestions overlay the caret without mutating the document.
- ⌨️ **Intuitive Keybindings**: Tab accepts, Esc cancels.
- 🔌 **Customizable**: Debounce, AbortController, and prompt builders are all configurable.
- 🤖 **WebLLM Integration**: Built-in example for browser-based LLM inference.

## Quick Start

```bash
npm install @prosemirror-completion/plugin
```

```ts
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  completion,
  approveCompletion,
  exitCompletion,
} from "@prosemirror-completion/plugin";

const completionPlugin = completion({
  debounceMs: 300,
  callCompletion: async (context) => {
    // Your completion logic here
    return "suggested text";
  },
});

const completionKeymap = keymap({
  Tab: approveCompletion,
  Escape: exitCompletion,
});

const state = EditorState.create({
  schema,
  plugins: [completionPlugin, completionKeymap, ...exampleSetup({ schema })],
});

new EditorView(document.querySelector("#editor")!, { state });
```

## Architecture

The plugin is built with a three-layer architecture:

1. **Matcher (State Tracker)**: Tracks cursor position and triggers completion.
2. **Ghost Decoration**: Virtual rendering layer for suggestion display.
3. **Key Handler**: Intercepts Tab / Esc actions for completion controls.

## Next Steps

- [Getting Started](./getting-started)
- [Configuration](./configuration)
- [WebLLM Integration](./webllm)
