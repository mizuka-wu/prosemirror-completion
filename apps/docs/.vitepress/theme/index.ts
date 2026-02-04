import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import WebLLMEditor from "./components/WebLLMEditor.vue";
import "./styles/webllm-editor.css";

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx);
    ctx.app.component("WebLLMEditor", WebLLMEditor);
  },
};

export default theme;
