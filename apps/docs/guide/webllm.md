# WebLLM Integration

Bring real LLM-powered suggestions directly into the browser by wiring the completion plugin to [WebLLM](https://github.com/mlc-ai/web-llm). This guide walks through the moving pieces so you can ship latency-friendly completions without a server.

## Requirements

- `@mlc-ai/web-llm` version `0.2.78` or newer.
- A model artifact supported by WebLLM (e.g. `Llama-3.1-8B-Instruct-q4f32_1-MLC`).
- A build setup that can handle WASM + worker assets (VitePress / Vite already work out of the box).

## Installation

The docs workspace already depends on WebLLM. For another project run:

```bash
pnpm add @mlc-ai/web-llm
```

## Creating a shared engine loader

Streaming models can take several seconds to initialize. Keep a single `CreateMLCEngine` promise so repeated completions reuse the same worker:

```ts
import { CreateMLCEngine } from "@mlc-ai/web-llm";

type Engine = Awaited<ReturnType<typeof CreateMLCEngine>>;
let enginePromise: Promise<Engine> | null = null;

export const getEngine = () => {
  if (!enginePromise) {
    enginePromise = CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC", {
      appConfig: { useIndexedDBCache: true },
    });
  }
  return enginePromise;
};
```

## Wiring the completion plugin

```ts
import { createCompletionPlugin } from "@prosemirror-completion/plugin";
import { getEngine } from "./engine";

export const webLLMPlugin = createCompletionPlugin({
  debounceMs: 500,
  minTriggerLength: 8,
  callCompletion: async (context) => {
    const engine = await getEngine();
    const response = await engine.chat.completions.create({
      messages: [{ role: "user", content: context.beforeText }],
      temperature: 0.7,
      max_tokens: 96,
    });
    return response.choices[0]?.message?.content ?? "";
  },
});
```

### Guarding SSR builds

If the editor is rendered during SSR (like inside VitePress), only instantiate the plugin on the client:

```ts
const isClient = typeof window !== "undefined";
const plugins = isClient ? [webLLMPlugin] : [];
```

## Vue component example

The [`<CompletionDemo />`](/examples/live-demo) component in this site demonstrates:

1. Lazy-loading WebLLM after the user clicks *Enable AI*.
2. Surfacing model download progress via a status pill.
3. Falling back to mock completions when WebLLM is not ready.

Check the [Vue + WebLLM walkthrough](/examples/vue-webllm) for a complete integration reference.

## Troubleshooting

- **Model download stuck** – ensure the site is served over HTTPS or `localhost`; browsers block worker + WASM streaming otherwise.
- **`SharedArrayBuffer` errors** – WebLLM requires cross-origin isolation. Use a bundler dev server or static hosting that sets `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` (Vite/Vercel already do this).
- **Slow warm-up** – adjust `model_config.json` to a smaller quantized model, or preload in the background before the user focuses the editor.
