import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import WebLLMEditor from "./components/WebLLMEditor.vue";
import CompletionExamples from "./components/CompletionExamples.vue";
import "./styles/webllm-editor.css";
import "./styles/completion-examples.css";

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx);
    ctx.app.component("WebLLMEditor", WebLLMEditor);
    ctx.app.component("CompletionExamples", CompletionExamples);
  },
};

export default theme;
