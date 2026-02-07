# Getting Started

## Installation

```bash
npm install @prosemirror-completion/plugin
# or
yarn add @prosemirror-completion/plugin
# or
pnpm add @prosemirror-completion/plugin
```

## Basic Usage

```typescript
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

// Create the completion plugin
const completionPlugin = completion({
  debounceMs: 300,
  minTriggerLength: 3,
  callCompletion: async (context) => {
    // Simple mock completion
    return ` completion for: ${context.beforeText.slice(-20)}`;
  },
});

// Wire Tab/Esc to the command helpers
const completionKeymap = keymap({
  Tab: approveCompletion,
  Escape: exitCompletion,
});

// Create editor state
const state = EditorState.create({
  schema,
  plugins: [completionPlugin, completionKeymap, ...exampleSetup({ schema })],
});

// Create editor view
const view = new EditorView(document.querySelector("#editor"), {
  state,
});
```

## How It Works

1. **Type to trigger**: When you type at least `minTriggerLength` characters, the plugin starts a debounced completion request.
2. **Ghost text appears**: A gray "ghost" text appears after your cursor showing the suggestion.
3. **Accept or cancel**: Press `Tab` to accept or use `Esc`/blur to cancel.

## Next Steps

- Learn about [Configuration options](./configuration)
- Integrate with [WebLLM](./webllm) for AI-powered completion
