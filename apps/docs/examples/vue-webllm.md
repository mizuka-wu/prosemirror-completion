# Vue + WebLLM Example / Vue + WebLLM 示例

本示例展示如何在 Vue 3 + ProseMirror 中接入 `@prosemirror-completion/plugin`，并使用 WebLLM 直接在浏览器中生成补全文本。

This example shows how to integrate `@prosemirror-completion/plugin` inside a Vue 3 editor powered by ProseMirror while running WebLLM inference fully in the browser.

## Prerequisites / 前置条件

- Vue 3 + Vite 项目 (TS)
- `@prosemirror-completion/plugin`
- `@mlc-ai/web-llm`

```bash
pnpm add @prosemirror-completion/plugin @mlc-ai/web-llm
```

## Component Setup / 组件编写

```vue
<template>
  <section class="playground">
    <h2>Vue + WebLLM Completion</h2>
    <div ref="editorEl" class="editor"></div>
    <p class="hint">Tab 接受 · Tab to accept ｜ Esc 取消 · Esc to cancel</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { createCompletionPlugin } from "@prosemirror-completion/plugin";
import { CreateMLCEngine } from "@mlc-ai/web-llm";

const editorEl = ref<HTMLDivElement | null>(null);
let view: EditorView | null = null;
let enginePromise: Promise<ReturnType<typeof CreateMLCEngine>> | null = null;

const getEngine = () => {
  enginePromise ??= CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC");
  return enginePromise;
};

const completionPlugin = createCompletionPlugin({
  debounceMs: 400,
  minTriggerLength: 3,
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

onMounted(() => {
  view = new EditorView(editorEl.value!, {
    state: EditorState.create({
      schema,
      plugins: [...exampleSetup({ schema }), completionPlugin],
    }),
  });
});

onBeforeUnmount(() => {
  view?.destroy();
});
</script>

<style scoped>
.playground {
  padding: 24px;
  border: 1px solid #d0d7de;
  border-radius: 16px;
  background: #fafbfc;
}
.editor {
  min-height: 260px;
  border: 1px solid #d0d7de;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
}
.hint {
  margin-top: 8px;
  font-size: 13px;
  color: #6c7785;
}
</style>
```

## Tips / 小贴士

- **Engine caching**：初始化 WebLLM 较慢，务必缓存 `CreateMLCEngine` Promise。
- **Abort handling**：可以将 `context.abortController.signal` 传入 `engine.chat.completions.create`，在用户继续输入时自动取消。
- **Styling ghost text**：设置 `ghostClassName` 自定义补全文本样式，使 Vue 主题保持一致。

继续阅读 [WebLLM 指南](../guide/webllm) 了解更多模型选择与性能调优技巧。
