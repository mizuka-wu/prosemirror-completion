---
layout: home
title: ProseMirror Completion
hero:
  name: ProseMirror Completion
  text: Copilot-style completion experience for ProseMirror editors
  tagline: Ghost text, invisible triggers, and customizable workflows powered by prosemirror-completion.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View Examples
      link: /examples/
features:
  - title: Seamless Integration
    details: Works with any ProseMirror editor via minimal configuration.
  - title: Transparent Ghost Text
    details: Ghost suggestions sit on top of current text without interrupting typing.
  - title: Layered Architecture
    details: Matcher / Decoration / Keymap layers keep the system easy to extend.
---

## Why ProseMirror Completion?

- ✨ **Invisible Trigger**: Automatically reacts to typing context without extra shortcuts.
- 🎯 **Fine-grained Control**: Customize debounce, AbortController, and prompt builders.
- 🤖 **WebLLM Ready**: Built-in browser LLM integration sample.
- 🧩 **Plugin-first Design**: Every capability is exposed as a plugin for effortless reuse.

## Quick Start

```bash
pnpm add @prosemirror-completion/plugin
```

```ts
import { createCompletionPlugin } from "@prosemirror-completion/plugin";

const plugin = createCompletionPlugin({
  debounceMs: 300,
  callCompletion: async (context) => {
    // Customize your completion logic
    return "suggested text";
  },
});
```

Continue with the [Guide](/guide/) to configure the plugin and connect to WebLLM.
