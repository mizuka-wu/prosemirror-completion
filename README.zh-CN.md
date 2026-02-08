# ProseMirror Completion

ProseMirror 的类 Copilot 文本补全插件。

## 功能特性

- 🎯 **隐形触发**: 基于光标上下文，输入时自动触发补全
- 👻 **幽灵文本**: 视觉建议覆盖层，不干扰编辑
- ⌨️ **直观快捷键**: Tab 接受，Esc 取消
- 🔌 **高度可定制**: 防抖时间、中止控制器、自定义提示词构建器
- 🎨 **丰富结果**: 支持纯文本、HTML、Markdown 或 ProseMirror 节点
- ⚡ **框架无关**: 可与任何 JavaScript 框架或原生 JS 配合使用

## 安装

```bash
npm install prosemirror-completion
```

## 快速开始

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
} from "prosemirror-completion";

const completionPlugin = completion({
  debounceMs: 300,
  callCompletion: async (context) => "建议的文本",
});

const completionKeymap = keymap({
  Tab: approveCompletion,
  Escape: exitCompletion,
});

const state = EditorState.create({
  schema,
  plugins: [completionPlugin, completionKeymap, ...exampleSetup({ schema })],
});

const view = new EditorView(document.querySelector("#editor")!, { state });
```

## 项目结构

```
packages/plugin/src/
├── types.ts       # 类型定义
├── plugin.ts      # 核心插件实现
├── state.ts       # 插件状态管理
├── decorations.ts # 幽灵文本渲染
├── keymap.ts      # 键盘处理器
├── utils.ts       # 工具函数
├── prompts.ts     # 提示词构建器
└── index.ts       # 主入口导出

apps/
├── demo/          # WebLLM 演示应用
│   ├── src/main.ts
│   └── src/completion.test.ts
└── docs/          # VitePress 文档站点
    └── docs/
        ├── guide/
        ├── api/
        └── examples/
```

## 开发

```bash
# 安装依赖
npm install

# 运行演示
cd apps/demo && npm run dev

# 运行测试
cd apps/demo && npm run test

# 构建文档
cd apps/docs && npm run build
```

## 架构

插件采用三层架构设计：

```
┌─────────────────────────────────────────────────────────────┐
│                      用户交互层                              │
│              (输入 → 视图更新 → 状态变更)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │     匹配器    │───▶│    补全请求   │───▶│    幽灵装饰   │  │
│  │   (Plugin)   │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │           │
│         │ 空闲时触发         │ 返回建议          │ 渲染覆盖层   │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      键盘处理器 (Keymap)                     │
│              Tab: 接受补全    Esc: 取消补全                    │
└─────────────────────────────────────────────────────────────┘
```

### 数据流向

1. **输入检测**：用户输入时，匹配器通过 ProseMirror Transaction 追踪光标位置和文本变化
2. **触发逻辑**：当条件满足时（防抖超时、最小触发长度），触发补全请求
3. **异步补全**：调用 `callCompletion` 并传入上下文（beforeText、afterText、promptType）获取建议
4. **幽灵渲染**：返回的建议以幽灵文本装饰层的形式渲染
5. **用户操作**：Tab 键接受补全，Esc 键取消补全

### 核心组件

| 组件 | 功能 | 文件 |
|------|------|------|
| **Matcher** | 状态追踪、触发检测 | `plugin.ts` |
| **Decorations** | 幽灵文本覆盖层渲染 | `decorations.ts` |
| **Keymap** | Tab/Esc 键盘处理器 | `keymap.ts` |
| **Prompts** | 内置提示词类型构建器 | `prompts.ts` |
| **Utils** | 命令和上下文辅助函数 | `utils.ts` |

## 许可证

MIT
