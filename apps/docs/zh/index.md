---
layout: home
title: ProseMirror Completion
hero:
  name: ProseMirror Completion
  text: 为 ProseMirror 编辑器带来 Copilot 式补全体验
  tagline: Ghost Text、隐形触发器与可定制工作流，由 prosemirror-completion 驱动。
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: 查看示例
      link: /zh/examples/
features:
  - title: 无缝集成
    details: 仅需少量配置即可嵌入任意 ProseMirror 编辑器。
  - title: 透明补全体验
    details: Ghost text 悬浮展示建议，不会打断当前输入。
  - title: 可扩展架构
    details: Matcher / Decoration / Keymap 三层结构，方便扩展与维护。
---

## 为什么选择 ProseMirror Completion？

- ✨ **隐形触发器**：根据上下文自动触发补全，无需额外快捷键。
- 🎯 **精细化控制**：可自定义 debounce、AbortController 与 prompt builder。
- 🤖 **背景 AI 能力**：可无缝接入任意 LLM（如 WebLLM），无需改动编辑器代码。
- 🧩 **插件化设计**：全部能力都以插件形式暴露，便于复用。

## 快速上手

```bash
pnpm add prosemirror-completion
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
} from "prosemirror-completion";

const completionPlugin = completion({
  debounceMs: 300,
  callCompletion: async (context) => {
    // 自定义补全逻辑
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

继续阅读 [指南](/zh/guide/) 了解如何配置插件并接入 WebLLM。

## 交互示例

体验基础的补全链路（ProseMirror + Completion Plugin + WebLLM）👇

<!-- markdownlint-disable-next-line MD033 -->
<WebLLMEditor />
