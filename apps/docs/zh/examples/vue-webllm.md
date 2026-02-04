# Vue + WebLLM 示例

本示例演示如何在 Vue 3 + ProseMirror 编辑器中接入 `@prosemirror-completion/plugin`，并使用 WebLLM 在浏览器内直接生成补全文本。

## 前置条件

- Vue 3 + Vite（TypeScript）
- `@prosemirror-completion/plugin`
- `@mlc-ai/web-llm`

```bash
pnpm add @prosemirror-completion/plugin @mlc-ai/web-llm
```

## 组件实现

```vue
<template>
  <section class="playground">
    <h2>Vue + WebLLM Completion</h2>
    <div ref="editorEl" class="editor"></div>
    <p class="hint">Tab 接受 · Esc 取消</p>
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

## 使用建议

- **缓存引擎**：`CreateMLCEngine` 初始化耗时，务必缓存 Promise。
- **取消逻辑**：将 `context.abortController.signal` 传给 `engine.chat.completions.create`，在用户继续输入时中断请求。
- **统一样式**：通过 `ghostClassName` 自定义补全文本的外观，使其与 Vue 主题保持一致。

更多细节可以查看 [WebLLM 指南](/zh/guide/webllm)。
