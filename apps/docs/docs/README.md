---
layout: home
title: ProseMirror Completion
hero:
  name: ProseMirror Completion
  text: Copilot-style completion experience for ProseMirror editors
  tagline: Ghost text, invisible triggers, and customizable workflows powered by @prosemirror-completion/plugin.
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /examples/
features:
  - title: 无缝集成
    details: 仅需少量配置即可与任何 ProseMirror 编辑器结合使用。
  - title: 透明的补全体验
    details: 通过悬浮式 ghost text 呈现建议，不打断当前输入。
  - title: 可扩展架构
    details: Matcher、Decoration、Keymap 三层结构，方便扩展及维护。
---

## 为什么选择 ProseMirror Completion？

- ✨ **隐形触发器**：根据上下文自动触发补全，无需额外快捷键。
- 🎯 **精细化控制**：可自定义 debounce、AbortController 以及调用提示词。
- 🤖 **WebLLM 支持**：内置 Web 端 LLM 推理接入示例。
- 🧩 **插件化设计**：所有能力均以插件形式暴露，便于与现有项目整合。

## 快速上手

```bash
pnpm add @prosemirror-completion/plugin
```

```ts
import { createCompletionPlugin } from "@prosemirror-completion/plugin";

const plugin = createCompletionPlugin({
  debounceMs: 300,
  callCompletion: async (context) => {
    // 自定义补全逻辑
    return "suggested text";
  },
});
```

接下来可以按照 [指南](/guide/) 深入了解如何在项目中启用、配置以及与 WebLLM 集成。
