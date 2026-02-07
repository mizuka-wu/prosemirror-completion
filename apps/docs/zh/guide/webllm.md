# WebLLM 集成指南

利用 [WebLLM](https://github.com/mlc-ai/web-llm) 在浏览器内直接运行大语言模型，为 ProseMirror 编辑器带来无需服务器的 AI 补全体验。

## 前置条件

- `@mlc-ai/web-llm` 版本 `0.2.78` 及以上。
- 支持的模型文件（如 `Llama-3.1-8B-Instruct-q4f32_1-MLC`）。
- 能够加载 WASM + Worker 的构建环境（Vite / VitePress 原生支持）。

## 安装

文档站已经依赖 WebLLM，若在其他项目中使用：

```bash
pnpm add @mlc-ai/web-llm
```

## 创建共享的引擎加载器

模型初始化可能耗时数秒，可将 `CreateMLCEngine` 包装成单例 Promise，避免重复下载：

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

## 注册补全插件

```ts
import { completion } from "@prosemirror-completion/plugin";
import { getEngine } from "./engine";

export const webLLMPlugin = completion({
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

### SSR 兼容性

在 VitePress 等包含 SSR 的场景，仅在客户端挂载：

```ts
const isClient = typeof window !== "undefined";
const plugins = isClient ? [webLLMPlugin] : [];
```

## Vue 组件示例

本站的 [`<CompletionDemo />`](/zh/examples/live-demo) 组件演示了：

1. 用户点击“启用 AI”后再懒加载 WebLLM。
2. 通过状态提示展示模型下载进度。
3. 当 WebLLM 尚未就绪时自动回退到 Mock 补全。

可参考 [Vue + WebLLM 示例](/zh/examples/vue-webllm) 获取完整实现细节。

## 常见问题

- **模型下载卡住**：确认站点使用 HTTPS 或 `localhost`，避免浏览器阻止 Worker + WASM。
- **出现 `SharedArrayBuffer` 报错**：需要 `Cross-Origin-Embedder-Policy: require-corp` 与 `Cross-Origin-Opener-Policy: same-origin`，Vite/Vercel 默认已配置。
- **启动耗时过长**：换用更小的量化模型，或在后台预加载 `getEngine()`。
