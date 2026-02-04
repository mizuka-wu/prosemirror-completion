# Vue + WebLLM 详解

本页展示如何在 Vue 3 + ProseMirror 场景中集成 [WebLLM](https://github.com/mlc-ai/web-llm)，让补全插件直接运行在浏览器端。

## 场景概览

- **技术栈**：Vue 3、TypeScript、Vite / VitePress。
- **目标**：使用 WebLLM 返回 Ghost Text 建议。
- **优势**：无需服务器，数据全留在本地。

## 1. 安装依赖

```bash
pnpm add @prosemirror-completion/plugin @mlc-ai/web-llm prosemirror-example-setup prosemirror-state prosemirror-view
```

## 2. 创建 WebLLM Loader

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

单例 Promise 可以避免重复下载模型或启动多个 Worker。

## 3. 注册补全插件

```ts
// completionPlugin.ts
import { createCompletionPlugin } from "@prosemirror-completion/plugin";
import { getEngine } from "./webllm";

export const webLLMPlugin = createCompletionPlugin({
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

## 4. 构建 Vue 组件

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
const status = ref("正在加载模型…");
let view: EditorView | null = null;

onMounted(async () => {
  view = new EditorView(editorEl.value!, {
    state: EditorState.create({
      schema,
      plugins: [...exampleSetup({ schema }), webLLMPlugin],
    }),
  });
  status.value = "WebLLM 就绪，开始输入吧";
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

## 5. SSR 防护

在存在 SSR 的场景（如 VitePress）务必检查 `window`：

```ts
const isClient = typeof window !== "undefined";
const plugins = [...exampleSetup({ schema }), ...(isClient ? [webLLMPlugin] : [])];
```

## 6. 排错清单

1. **下载速度慢**：换用更小的量化模型，或在用户聚焦前预加载 `getEngine()`。
2. **`SharedArrayBuffer` 报错**：确保服务端返回 `Cross-Origin-Embedder-Policy: require-corp` 与 `Cross-Origin-Opener-Policy: same-origin`。
3. **SSR 崩溃**：所有与 WebLLM 相关的逻辑都需要 `isClient` 守卫。

## 下一步

- 参考 [实时 Demo](/zh/examples/live-demo) 获取完整懒加载实现。
- 可在 `WebLLMEditor.vue` 中查看文档站实际使用的 UI、状态管理与提示文案。
