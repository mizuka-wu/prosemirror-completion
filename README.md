# ProseMirror Completion

Copilot-style text completion plugin for ProseMirror.

## Features

- 🎯 **Invisible Trigger**: Automatically triggers completion as you type based on cursor context
- 👻 **Ghost Text**: Visual suggestion overlay that doesn't interfere with editing
- ⌨️ **Intuitive Keybindings**: Tab to accept, Esc to cancel
- 🔌 **Customizable**: Debounce timing, abort controller, custom prompt builders
- 🎨 **Rich Results**: Support plain text, HTML, Markdown, or ProseMirror nodes
- ⚡ **Framework Agnostic**: Works with any JavaScript framework or vanilla JS

## Installation

```bash
npm install prosemirror-completion
```

## Quick Start

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
} from "prosemirror-completion";

const completionPlugin = completion({
  debounceMs: 300,
  minTriggerLength: 2,
  getPromptType: (ctx) =>
    ctx.parent.type.name === "code_block" ? "code" : "common",
  callCompletion: async ({ beforeText }) => {
    const lastWord = beforeText.split(/\s+/).pop() ?? "";
    return lastWord ? `${lastWord}…` : "";
  },
  debug: import.meta.env.DEV,
});

const completionKeymap = keymap({
  Tab: approveCompletion,
  Escape: exitCompletion,
});

const state = EditorState.create({
  schema,
  plugins: [completionPlugin, completionKeymap, ...exampleSetup({ schema })],
});

const view = new EditorView(document.querySelector("#editor")!, {
  state,
});
```

### Completion result shapes

`callCompletion` can return a simple string, or an object containing HTML or ProseMirror Node:

```ts
type CompletionResult =
  | string
  | { plain: string; html?: string }
  | { html: string }
  | { prosemirror: Node };
```

## Configuration

`completion` accepts the following configuration options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `debounceMs` | `number` | `300` | Debounce time before triggering completion, in milliseconds |
| `minTriggerLength` | `number` | `3` | Minimum characters before cursor to trigger completion request |
| `callCompletion` | `(context) => CompletionResult \| Promise<CompletionResult>` | **Required** | The actual completion function, returns string, HTML or ProseMirror Node |
| `getPromptType` | `(context) => PromptType` | `defaultGetPromptType` | Custom prompt type inference logic (e.g., code/Markdown detection) |
| `onChange` | `(context, view) => void` | `undefined` | Triggered when user types continuously, can be used for analytics or real-time status display |
| `ghostClassName` | `string` | `"prosemirror-ghost-text"` | Custom CSS class for Ghost Text |
| `showGhost` | `boolean` | `true` | Whether to show Ghost Text (can be disabled to keep only keyboard behavior) |
| `debug` | `boolean` | `false` | Whether to output debug logs for troubleshooting trigger and request processes |

> `CompletionResult` supports `string`, `{ plain; html? }`, `{ html }`, `{ prosemirror: Node }`, see docs for examples.
>
> If you need to execute logic when the user accepts/cancels completion at the callback level, you can listen to and extend the exported `approveCompletion`/`exitCompletion` commands.

## Project Structure

```text
packages/
├── plugin/
│   ├── src/
│   │   ├── decorations.ts # Ghost text rendering
│   │   ├── index.ts       # Entry exports
│   │   ├── keymap.ts      # Keyboard handlers
│   │   ├── plugin.ts      # Core plugin implementation
│   │   ├── prompts.ts     # Prompt builders
│   │   ├── types.ts       # Shared types & contexts
│   │   └── utils.ts       # Helpers (commands, prompt detection, text extraction…)
│   ├── scripts/postbuild.mjs
│   └── package.json
├── eslint-config/         # Shared eslint preset
└── typescript-config/     # Shared tsconfig presets

apps/
├── demo/                  # Playground + Vitest suite
│   ├── src/main.ts
│   └── src/completion.test.ts
└── docs/                  # VitePress documentation site (en & zh)
    └── docs/
        ├── guide/
        ├── api/
        └── examples/
```

## Development

```bash
# Install dependencies (pnpm workspace)
pnpm install

# Run the playground demo
pnpm --filter demo dev

# Run Vitest suite for the demo (covers plugin behaviors)
pnpm --filter demo test

# Build documentation site
pnpm --filter docs build

# Build the plugin package
pnpm --filter @prosemirror-completion/plugin build
```

## Architecture

The plugin is built with a three-layer architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction                         │
│              (Type → View updates → State)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Matcher    │───▶│ Completion   │───▶│   Ghost      │  │
│  │  (Plugin)    │    │   Request    │    │ Decoration   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │           │
│         │ Triggers          │ Returns           │ Renders   │
│         │ when idle         │ suggestion        │ overlay   │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Key Handler (Keymap)                     │
│              Tab: approve    Esc: cancel                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Input Detection**: As the user types, the Matcher tracks cursor position and text changes via ProseMirror Transactions
2. **Trigger Logic**: When conditions are met (debounce timeout, minTriggerLength), it fires the completion request
3. **Async Completion**: `callCompletion` is invoked with context (beforeText, afterText, promptType) to fetch the suggestion
4. **Ghost Rendering**: The returned suggestion is rendered as a ghost text decoration overlay
5. **User Action**: Tab accepts the completion, Escape cancels it

### Core Components

| Component | Purpose | File |
|-----------|---------|------|
| **Matcher** | State tracking, trigger detection | `plugin.ts` |
| **Decorations** | Ghost text overlay rendering | `decorations.ts` |
| **Keymap** | Keyboard handler for Tab/Esc | `keymap.ts` |
| **Prompts** | Built-in prompt type builders | `prompts.ts` |
| **Utils** | Commands and context helpers | `utils.ts` |

## License

MIT
