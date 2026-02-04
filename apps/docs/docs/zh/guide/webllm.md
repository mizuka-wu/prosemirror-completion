# WebLLM 集成

ProseMirror Completion 可以与 [WebLLM](https://github.com/mlc-ai/web-llm) 无缝结合，在浏览器内完成 LLM 推理。

## 安装

```bash
npm install @mlc-ai/web-llm
```

## 基础集成

```ts
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { createCompletionPlugin } from "@prosemirror-completion/plugin";

async function webLLMCallCompletion(context) {
  const engine = await CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC");
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

## 搭配 Prompt Builder

```ts
import { buildPrompt } from "@prosemirror-completion/plugin/prompts";

async function webLLMCallCompletion(context) {
  const engine = await CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC");
  const prompt = buildPrompt(context);

  const response = await engine.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content ?? "";
}
```

## 缓存引擎

下载模型较耗时，可缓存 `CreateMLCEngine` 返回的 promise：

```ts
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

## 模型选择

|模型|体积|适用场景|
|----|----|--------|
|Llama-3.1-8B|4.5GB|通用场景|
|Llama-3.1-70B|40GB|高质量输出|
|Phi-3-mini|1.8GB|低延迟、轻量化|
|Qwen2.5-7B|4.1GB|多语言场景|

## 支持取消

```ts
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

当用户继续输入时，插件会触发 `abortController` 取消请求，避免卡顿。
