# Examples

## Basic Example

```typescript
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { createCompletionPlugin } from "@prosemirror-completion/plugin";

const completionPlugin = createCompletionPlugin({
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

返回 HTML 字符串，插件会自动解析并插入带格式的内容：

```typescript
const htmlPlugin = createCompletionPlugin({
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

使用 prosemirror-markdown 将 Markdown 解析为 ProseMirror Node：

```typescript
import { defaultMarkdownParser } from "prosemirror-markdown";

const markdownPlugin = createCompletionPlugin({
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

直接构建 ProseMirror Node 对象：

```typescript
import { schema } from "prosemirror-schema-basic";

const nodePlugin = createCompletionPlugin({
  debounceMs: 500,
  callCompletion: async (context) => {
    // 创建带格式的段落
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
const mockPlugin = createCompletionPlugin({
  debounceMs: 500,
  callCompletion: async (context) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (context.promptType === "code") {
      return `// TODO: Complete this code\n// ${context.beforeText.slice(-30)}`;
    }

    return `继续: ${context.beforeText.slice(-20)}`;
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

## With Callbacks

```typescript
const pluginWithCallbacks = createCompletionPlugin({
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
createCompletionPlugin({
  callCompletion: myCompletionFn,
  ghostClassName: "my-ghost-text",
});
```

## Full Demo

See the [demo app](../demo/) for a complete working example with all completion modes:

- **Mock** - Basic text completion
- **HTML** - Rich text with HTML formatting
- **Markdown** - Markdown parsed to ProseMirror nodes
- **ProseMirror** - Direct Node construction
- **WebLLM** - Real AI completion
