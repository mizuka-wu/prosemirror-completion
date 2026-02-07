# Vue + WebLLM Walkthrough

Combine the completion plugin with [WebLLM](https://github.com/mlc-ai/web-llm) to deliver fully client-side AI completions inside a Vue 3 + ProseMirror editor.

## Scenario overview

- **Stack**: Vue 3, TypeScript, VitePress/Vite.
- **Goal**: Render ghost-text suggestions backed by WebLLM.
- **Why**: Remove server round-trips and keep user data on-device.

## 1. Install dependencies

```bash
pnpm add @prosemirror-completion/plugin @mlc-ai/web-llm prosemirror-example-setup prosemirror-state prosemirror-view
```

## 2. Create a shared WebLLM loader

```ts
// webllm.ts
import { CreateMLCEngine } from "@mlc-ai/web-llm";

type Engine = Awaited<ReturnType<typeof CreateMLCEngine>>;
let enginePromise: Promise<Engine> | null = null;

export async function getEngine() {
  if (!enginePromise) {
    enginePromise = CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC", {
      appConfig: { useIndexedDBCache: true },
    });
  }
  return enginePromise;
}
```

Keeping a singleton promise avoids repeated downloads and worker startups.

## 3. Wire the completion plugin

```ts
// completionPlugin.ts
import { completion } from "@prosemirror-completion/plugin";
import { getEngine } from "./webllm";

export const webLLMPlugin = completion({
  debounceMs: 500,
  minTriggerLength: 12,
  callCompletion: async (context) => {
    const engine = await getEngine();
    const response = await engine.chat.completions.create({
      messages: [{ role: "user", content: context.beforeText }],
      temperature: 0.65,
      max_tokens: 96,
    });
    return response.choices[0]?.message?.content ?? "";
  },
});
```

## 4. Build the Vue editor component

```vue
<template>
  <div class="demo-card">
    <div class="editor" ref="editorEl"></div>
    <p class="status">{{ status }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { webLLMPlugin } from "./completionPlugin";

const editorEl = ref<HTMLDivElement | null>(null);
const status = ref("Loading model…");
let view: EditorView | null = null;

onMounted(async () => {
  view = new EditorView(editorEl.value!, {
    state: EditorState.create({
      schema,
      plugins: [...exampleSetup({ schema }), webLLMPlugin],
    }),
  });
  status.value = "WebLLM ready – type to trigger";
});

onBeforeUnmount(() => view?.destroy());
</script>

<style scoped>
.demo-card {
  border: 1px solid #dadde1;
  border-radius: 12px;
  padding: 16px;
}
.editor {
  min-height: 240px;
}
.status {
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
}
</style>
```

## 5. SSR guards

When embedding inside VitePress, instantiate the editor only on the client:

```ts
const isClient = typeof window !== "undefined";
const plugins = [...exampleSetup({ schema }), ...(isClient ? [webLLMPlugin] : [])];
```

## 6. Troubleshooting checklist

1. **Model download slower than expected** → switch to a smaller quantized variant or prefetch via `getEngine()` before the user focuses the editor.
2. **`SharedArrayBuffer` errors** → ensure the host sets `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin`.
3. **SSR crashes** → gate WebLLM usage behind `isClient` checks.

## Next steps

- Explore the [Live Demo](/examples/live-demo) for a production-ready Vue component with lazy loading.
- Mirror the setup in `/zh/examples/vue-webllm` for localized documentation.
