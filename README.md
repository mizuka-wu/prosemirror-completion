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
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { completion } from "@prosemirror-completion/plugin";

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

const state = EditorState.create({
  schema,
  plugins: [...exampleSetup({ schema }), completionPlugin],
});

const view = new EditorView(document.querySelector("#editor")!, {
  state,
});
```

### Completion result shapes

`callCompletion` 可以返回简单字符串，或包含 HTML、ProseMirror Node 的对象：

```ts
type CompletionResult =
  | string
  | { plain: string; html?: string }
  | { html: string }
  | { prosemirror: Node };
```

## Configuration

`completion` 接受以下可配置项：

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `debounceMs` | `number` | `300` | 触发补全前的防抖时间，单位毫秒 |
| `minTriggerLength` | `number` | `3` | 光标前至少输入多少字符才会开始请求 |
| `callCompletion` | `(context) => CompletionResult \| Promise<CompletionResult>` | **必填** | 真正的补全函数，返回字符串、HTML 或 ProseMirror Node |
| `getPromptType` | `(context) => PromptType` | `defaultGetPromptType` | 自定义 prompt 类型推断逻辑（如代码/Markdown 检测） |
| `onChange` | `(context, view) => void` | `undefined` | 用户持续输入时触发，可用于埋点或实时展示状态 |
| `ghostClassName` | `string` | `"prosemirror-ghost-text"` | Ghost Text 的自定义样式类名 |
| `showGhost` | `boolean` | `true` | 是否展示 Ghost Text（可关闭仅保留快捷键行为） |
| `debug` | `boolean` | `false` | 是否输出调试日志，便于排查触发与请求过程 |

> `CompletionResult` 支持 `string`、`{ plain; html? }`、`{ html }`、`{ prosemirror: Node }`，详见 docs 示例。
>
> 回调层面如果需要在用户接受/取消补全时执行逻辑，可监听并扩展导出的 `approveCompletion`/`exitCompletion` 命令。

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

1. **Matcher (State Tracker)**: Tracks cursor position and triggers completion using Transaction meta
2. **Ghost Decoration**: Virtual rendering layer using ProseMirror DecorationSet
3. **Key Handler**: Intercepts Tab and Esc for completion actions

## License

MIT
