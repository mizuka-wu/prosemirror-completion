# ProseMirror Completion

> 以 GitHub Copilot 为灵感，为 ProseMirror 编辑器带来实时补全体验。

## 功能亮点

- 🎯 **隐形触发**：根据当前输入自动触发补全，无需额外快捷键。
- 👻 **Ghost Text**：建议以半透明文本覆盖在光标位置，不修改文档内容。
- ⌨️ **直觉式快捷键**：按 Tab 接受、Esc 取消。
- 🔌 **高度可定制**：Debounce、AbortController、Prompt builder 等都可自由配置。
- 🤖 **原生 WebLLM 集成**：内置浏览器端 LLM 推理示例。

## 快速开始

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
    // 在这里实现补全逻辑
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

## 架构概览

插件由三层组成：

1. **Matcher（状态跟踪）**：监听光标位置并判断是否触发补全。
2. **Ghost Decoration（展示层）**：负责渲染悬浮的建议文本。
3. **Key Handler（键盘层）**：统一处理 Tab/ Esc 等交互。

## 下一步

- [快速开始](/zh/guide/getting-started)
- [配置项说明](/zh/guide/configuration)
- [WebLLM 集成](/zh/guide/webllm)
