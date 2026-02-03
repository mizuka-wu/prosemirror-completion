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
    if (context.beforeText.includes("```")) {
      return "code";
    }
    return "common";
  },
});
```

## WebLLM Integration

```typescript
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { buildPrompt } from "@prosemirror-completion/plugin";

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

    const prompt = buildPrompt(context);

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

## Code Editor

```typescript
import { defaultGetPromptType } from "@prosemirror-completion/plugin";

const codePlugin = createCompletionPlugin({
  debounceMs: 500,
  minTriggerLength: 5,
  getPromptType: (context) => {
    // Check if in code block
    if (context.parent.type.name === "code_block") {
      return "code";
    }
    // Use default detection
    return defaultGetPromptType(context);
  },
  callCompletion: async (context) => {
    if (context.promptType === "code") {
      // Use code-specific completion
      return fetchCodeCompletion(context);
    }
    return fetchTextCompletion(context);
  },
});
```

## Full Demo

See the [demo app](../demo/) for a complete working example with both mock and WebLLM completion modes.
