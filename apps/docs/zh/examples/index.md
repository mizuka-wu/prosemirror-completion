# 示例

展示在不同场景下使用补全插件的做法，便于快速对照并组合到自己的项目中。

## Vue + WebLLM 示例

结合 Vue 3、ProseMirror 与 WebLLM，在浏览器内完成本地推理。可前往 [详细示例](./vue-webllm) 查看完整说明。

```vue
<template>
  <div class="editor" ref="editorEl"></div>
  <p class="hint">Tab 接受 · Esc 取消</p>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from "vue";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { createCompletionPlugin } from "@prosemirror-completion/plugin";
import { CreateMLCEngine } from "@mlc-ai/web-llm";

const editorEl = ref<HTMLDivElement | null>(null);
let enginePromise: Promise<ReturnType<typeof CreateMLCEngine>> | null = null;
const getEngine = () => enginePromise ??= CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC");

const plugin = createCompletionPlugin({
  debounceMs: 400,
  callCompletion: async (context) => {
    const engine = await getEngine();
    const response = await engine.chat.completions.create({
      messages: [{ role: "user", content: context.beforeText }],
      temperature: 0.6,
      max_tokens: 80,
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

## 基础示例

```ts
const completionPlugin = createCompletionPlugin({
  debounceMs: 300,
  minTriggerLength: 3,
  callCompletion: async (context) => {
    return ` completion for: ${context.beforeText.slice(-20)}`;
  },
});
```

## HTML 富文本

返回 HTML 字符串，插件会自动解析并插入格式化内容：

```ts
const htmlPlugin = createCompletionPlugin({
  debounceMs: 500,
  callCompletion: async () => ({
    plain: "Bold and italic text",
    html: "<p>This is <strong>bold</strong> and <em>italic</em> text</p>",
  }),
});
```

## Markdown 转 ProseMirror Node

```ts
import { defaultMarkdownParser } from "prosemirror-markdown";

const markdownPlugin = createCompletionPlugin({
  callCompletion: async () => {
    const markdown = "## Suggestion\n\nThis is **bold** and *italic* text.";
    const node = defaultMarkdownParser.parse(markdown);
    return { prosemirror: node };
  },
});
```

## 直接返回 Node

```ts
const nodePlugin = createCompletionPlugin({
  callCompletion: async () => {
    const paragraph = schema.nodes.paragraph.create(
      null,
      schema.text("Bold text", [schema.marks.strong.create()])
    );
    return { prosemirror: paragraph };
  },
});
```

## 模拟补全

```ts
const mockPlugin = createCompletionPlugin({
  debounceMs: 500,
  callCompletion: async (context) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (context.promptType === "code") {
      return `// TODO: Complete this code\n// ${context.beforeText.slice(-30)}`;
    }
    return `继续: ${context.beforeText.slice(-20)}`;
  },
});
```

## WebLLM 集成

```ts
const webLLMPlugin = createCompletionPlugin({
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

## 带回调

```ts
const pluginWithCallbacks = createCompletionPlugin({
  callCompletion: async () => "suggestion",
  onChange: (context) => console.log("Completion triggered", context.promptType),
  onApply: (result) => console.log("Applied", result),
  onExit: () => console.log("Completion cancelled"),
});
```

## 自定义样式

```css
.my-ghost-text {
  color: #888;
  opacity: 0.5;
  font-style: italic;
  pointer-events: none;
}
```

```ts
createCompletionPlugin({
  callCompletion: myCompletionFn,
  ghostClassName: "my-ghost-text",
});
```

## 完整 Demo

访问 [demo 应用](/zh/demo/) 可体验 Mock / HTML / Markdown / ProseMirror / WebLLM 全模式。
