# ProseMirror Completion

ProseMirror 的类 Copilot 文本补全插件。

## 功能特性

- 🎯 **隐形触发**: 输入时自动触发补全
- 👻 **幽灵文本**: 视觉建议覆盖层，不干扰编辑
- ⌨️ **直观快捷键**: Tab 接受，Esc 取消
- 🔌 **高度可定制**: 防抖、中止控制器、自定义提示词
- 🤖 **WebLLM 集成**: 内置浏览器端 LLM 推理支持

## 安装

```bash
npm install @prosemirror-completion/plugin
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
} from "@prosemirror-completion/plugin";

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

1. **匹配器 (状态追踪器)**: 追踪光标位置，使用 Transaction meta 触发补全
2. **幽灵装饰**: 使用 ProseMirror DecorationSet 的虚拟渲染层
3. **键盘处理器**: 拦截 Tab 和 Esc 键执行补全操作

## 许可证

MIT
