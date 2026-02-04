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

## Configuration

`createCompletionPlugin` 接受以下可配置项：

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `debounceMs` | `number` | `300` | 触发补全前的防抖时间，单位毫秒 |
| `minTriggerLength` | `number` | `3` | 光标前至少输入多少字符才会开始请求 |
| `callCompletion` | `(context) => CompletionResult \| Promise<CompletionResult>` | **必填** | 真正的补全函数，返回字符串、HTML 或 ProseMirror Node |
| `getPromptType` | `(context) => PromptType` | `defaultGetPromptType` | 自定义 prompt 类型推断逻辑（如代码/Markdown 检测） |
| `onChange` | `(context, view) => void` | `undefined` | 用户持续输入时触发，可用于埋点或实时展示状态 |
| `onExit` | `(view) => void` | `undefined` | 用户按 `Esc` 或取消补全时回调 |
| `onApply` | `(result, view) => void` | `undefined` | 用户按 `Tab` 接受补全时回调，可用于记录结果 |
| `ghostClassName` | `string` | `"prosemirror-ghost-text"` | Ghost Text 的自定义样式类名 |
| `showGhost` | `boolean` | `true` | 是否展示 Ghost Text（可关闭仅保留快捷键行为） |

> `CompletionResult` 支持 `string`、`{ plain; html? }`、`{ html }`、`{ prosemirror: Node }`，详见 docs 示例。

## Project Structure

```text
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
