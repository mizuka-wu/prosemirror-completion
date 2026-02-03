# WebLLM Integration

ProseMirror Completion integrates seamlessly with [WebLLM](https://github.com/mlc-ai/web-llm) for browser-based LLM inference.

## Installation

```bash
npm install @mlc-ai/web-llm
```

## Basic Integration

```typescript
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { createCompletionPlugin } from "@prosemirror-completion/plugin";

async function webLLMCallCompletion(context) {
  const engine = await CreateMLCEngine(
    "Llama-3.1-8B-Instruct-q4f32_1-MLC"
  );

  const prompt = `Continue the following text:\n\n${context.beforeText}\n\nContinue:`;

  const response = await engine.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content ?? "";
}

const completionPlugin = createCompletionPlugin({
  callCompletion: webLLMCallCompletion,
});
```

## With Prompt Builder

```typescript
import { buildPrompt } from "@prosemirror-completion/plugin/prompts";

async function webLLMCallCompletion(context) {
  const engine = await CreateMLCEngine(
    "Llama-3.1-8B-Instruct-q4f32_1-MLC"
  );

  // Use built-in prompt builder
  const prompt = buildPrompt(context);

  const response = await engine.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content ?? "";
}
```

## Caching the Engine

For better performance, cache the engine instance:

```typescript
let enginePromise: Promise<ReturnType<typeof CreateMLCEngine>> | null = null;

async function getEngine() {
  if (!enginePromise) {
    enginePromise = CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC");
  }
  return enginePromise;
}

async function webLLMCallCompletion(context) {
  const engine = await getEngine();

  const response = await engine.chat.completions.create({
    messages: [{ role: "user", content: context.beforeText }],
    temperature: 0.7,
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content ?? "";
}
```

## Model Selection

WebLLM supports various models:

| Model | Size | Best For |
|-------|------|----------|
| Llama-3.1-8B | 4.5GB | General purpose |
| Llama-3.1-70B | 40GB | High quality |
| Phi-3-mini | 1.8GB | Fast, efficient |
| Qwen2.5-7B | 4.1GB | Multilingual |

## Abort Support

WebLLM supports request cancellation:

```typescript
async function webLLMCallCompletion(context) {
  const engine = await getEngine();

  const response = await engine.chat.completions.create(
    {
      messages: [{ role: "user", content: context.beforeText }],
      max_tokens: 100,
    },
    { signal: context.abortController.signal }
  );

  return response.choices[0]?.message?.content ?? "";
}
```

This allows the plugin to cancel pending requests when the user continues typing.
