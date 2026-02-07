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
      link: ./examples/vue-webllm
features:
  - title: WebLLM Integration Guide
    details: Works with any ProseMirror editor via minimal configuration.
  - title: Transparent Ghost Text
    details: Ghost suggestions sit on top of current text without interrupting typing.
  - title: Layered Architecture
    details: Matcher / Decoration / Keymap layers keep the system easy to extend.
---

## Why ProseMirror Completion?

- ✨ **Invisible Trigger**: Automatically reacts to typing context without extra shortcuts.
- 🎯 **Fine-grained Control**: Customize debounce, AbortController, and prompt builders.
- 🤖 **Background AI Ready**: Plug into any LLM stack (e.g., WebLLM) without changing editor code.
- 🧩 **Plugin-first Design**: Every capability is exposed as a plugin for effortless reuse.

## Quick Start

```bash
pnpm add @prosemirror-completion/plugin
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
    // Customize your completion logic
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

Continue with the [Guide](/guide/) to configure the plugin and connect to WebLLM.

## Interactive Demo

Experience the basic integration (ProseMirror + completion plugin + WebLLM) directly below.

<!-- markdownlint-disable-next-line MD033 -->
<WebLLMEditor />
