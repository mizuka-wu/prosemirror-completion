# Examples

Explore different ways to wire the completion plugin into editors and runtimes. Each scenario focuses on a single idea with focused snippets so you can mix and match in your app.

## Vue + WebLLM Example

Combine WebLLM with the plugin inside a Vue 3 + ProseMirror setup for a fully in-browser AI completion experience. See the [full write-up](./vue-webllm) for additional explanations.

```vue
<template>
  <div class="editor" ref="editorEl"></div>
  <p class="hint">Tab to accept · Esc to cancel</p>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from "vue";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { completion } from "@prosemirror-completion/plugin";
import { CreateMLCEngine } from "@mlc-ai/web-llm";

const editorEl = ref<HTMLDivElement | null>(null);
let enginePromise: Promise<ReturnType<typeof CreateMLCEngine>> | null = null;
const getEngine = () => enginePromise ??= CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC");

const plugin = completion({
  debounceMs: 400,
  callCompletion: async (context) => {
    const engine = await getEngine();
    const response = await engine.chat.completions.create({
      messages: [{ role: "user", content: context.beforeText }],
      temperature: 0.6,
      max_tokens: 80,
      stream: false,
    });
    return response.choices[0]?.message?.content ?? "";
  },
});

let view: EditorView | null = null;

onMounted(() => {
  view = new EditorView(editorEl.value!, {
    state: EditorState.create({
      schema,
      plugins: [...exampleSetup({ schema }), plugin],
    }),
  });
});

onBeforeUnmount(() => view?.destroy());
</script>

<style scoped>
.editor {
  border: 1px solid #d0d7de;
  border-radius: 12px;
  padding: 16px;
  min-height: 240px;
}
.hint {
  margin-top: 8px;
  color: #768390;
  font-size: 13px;
}
</style>
```

## Basic Example

```typescript
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { completion } from "@prosemirror-completion/plugin";

const completionPlugin = completion({
  debounceMs: 300,
  minTriggerLength: 3,
  callCompletion: async (context) => {
    return ` completion for: ${context.beforeText.slice(-20)}`;
  },
});

const state = EditorState.create({
  schema,
  plugins: [...exampleSetup({ schema }), completionPlugin],
});

const view = new EditorView(document.querySelector("#editor"), { state });
```

## HTML Rich Text Completion

Return HTML so the suggestion inserts formatted content:

```typescript
const htmlPlugin = completion({
  debounceMs: 500,
  callCompletion: async (context) => {
    return {
      plain: "Bold and italic text",
      html: "<p>This is <strong>bold</strong> and <em>italic</em> text</p>"
    };
  },
});
```

## Markdown to ProseMirror Node

Parse Markdown into a ProseMirror node via `prosemirror-markdown`:

```typescript
import { defaultMarkdownParser } from "prosemirror-markdown";

const markdownPlugin = completion({
  debounceMs: 500,
  callCompletion: async (context) => {
    const markdown = `
## Suggestion

This is **bold** and *italic* text.

- Item 1
- Item 2
`;
    const node = defaultMarkdownParser.parse(markdown);
    return { prosemirror: node };
  },
});
```

## Direct ProseMirror Node

Return fully constructed ProseMirror nodes:

```typescript
import { schema } from "prosemirror-schema-basic";

const nodePlugin = completion({
  debounceMs: 500,
  callCompletion: async (context) => {
    // Create a formatted paragraph
    const paragraph = schema.nodes.paragraph.create(
      null,
      schema.text("Bold text", [schema.marks.strong.create()])
    );

    return { prosemirror: paragraph };
  },
});
```

## Mock Completion

```typescript
const mockPlugin = completion({
  debounceMs: 500,
  callCompletion: async (context) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (context.promptType === "code") {
      return `// TODO: Complete this code\n// ${context.beforeText.slice(-30)}`;
    }

    return `Continue: ${context.beforeText.slice(-20)}`;
  },
  getPromptType: (context) => {
    if (context.beforeText.includes("\`\`\`")) {
      return "code";
    }
    return "common";
  },
});
```

## WebLLM Integration

```typescript
import { CreateMLCEngine } from "@mlc-ai/web-llm";

let enginePromise = null;

async function getEngine() {
  if (!enginePromise) {
    enginePromise = CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC");
  }
  return enginePromise;
}

const webLLMPlugin = completion({
  debounceMs: 800,
  callCompletion: async (context) => {
    const engine = await getEngine();

    const prompt = `Continue: ${context.beforeText}`;

    const response = await engine.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    return response.choices[0]?.message?.content ?? "";
  },
});
```

## With Callbacks

```typescript
const pluginWithCallbacks = completion({
  callCompletion: async (context) => {
    return "suggestion";
  },
  onChange: (context, view) => {
    console.log("Completion triggered:", context.promptType);
  },
  onApply: (result, view) => {
    console.log("Applied:", result);
  },
  onExit: (view) => {
    console.log("Completion cancelled");
  },
});
```

## Custom Styling

```css
/* Custom ghost text styling */
.my-ghost-text {
  color: #888;
  opacity: 0.5;
  font-style: italic;
  pointer-events: none;
}

/* Loading state */
.my-ghost-text.loading {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
```

```typescript
completion({
  callCompletion: myCompletionFn,
  ghostClassName: "my-ghost-text",
});
```

## Prompt Templates

Provide a default prompt builder so downstream apps share a consistent completion style:

```typescript
const basePrompt = ({ beforeText, promptType }: CompletionContext) => {
  return `You are a helpful ${promptType} assistant. Continue the user input in the same tone.

Context (last 120 chars):
${beforeText.slice(-120)}

Rules:
- Keep the completion under 40 words.
- Do not repeat existing text.
- Finish the sentence naturally.`;
};

const promptAwarePlugin = completion({
  callCompletion: async (context) => {
    const prompt = basePrompt(context);
    return fetchLLM(prompt);
  },
  getPromptType: (context) => {
    if (context.parent.type.name === "code_block") return "code";
    if (context.beforeText.includes("#")) return "markdown";
    return "common";
  },
});
```

> Tip: expose `basePrompt` as a shared utility so other teams can reuse the same tone/structure.

## Full Demo

See the [Live Demo](/examples/live-demo) for a complete working example with all completion modes:

- **Mock** - Basic text completion
- **HTML** - Rich text with HTML formatting
- **Markdown** - Markdown parsed to ProseMirror nodes
- **ProseMirror** - Direct Node construction
- **WebLLM** - Real AI completion
