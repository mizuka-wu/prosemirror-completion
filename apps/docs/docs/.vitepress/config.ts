import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/prosemirror-completion/",
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      title: "ProseMirror Completion",
      description: "Copilot-style text completion plugin for ProseMirror",
      themeConfig: {
        nav: [
          { text: "Guide", link: "/guide/" },
          { text: "API", link: "/api/" },
          { text: "Examples", link: "/examples/" },
        ],
        sidebar: {
          "/guide/": [
            {
              text: "Guide",
              items: [
                { text: "Introduction", link: "/guide/" },
                { text: "Getting Started", link: "/guide/getting-started" },
                { text: "Configuration", link: "/guide/configuration" },
                { text: "WebLLM Integration", link: "/guide/webllm" },
              ],
            },
          ],
          "/api/": [
            {
              text: "API Reference",
              items: [
                { text: "Plugin", link: "/api/plugin" },
                { text: "Types", link: "/api/types" },
                { text: "Utils", link: "/api/utils" },
              ],
            },
          ],
          "/examples/": [
            {
              text: "Examples",
              items: [
                { text: "Overview", link: "/examples/" },
                { text: "Vue + WebLLM", link: "/examples/vue-webllm" },
              ],
            },
          ],
        },
      },
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh/",
      title: "ProseMirror Completion",
      description: "面向 ProseMirror 的 Copilot 风格补全插件",
      themeConfig: {
        nav: [
          { text: "指南", link: "/zh/guide/" },
          { text: "API", link: "/zh/api/" },
          { text: "示例", link: "/zh/examples/" },
        ],
        sidebar: {
          "/zh/guide/": [
            {
              text: "指南",
              items: [
                { text: "介绍", link: "/zh/guide/" },
                { text: "快速开始", link: "/zh/guide/getting-started" },
                { text: "配置", link: "/zh/guide/configuration" },
                { text: "WebLLM 集成", link: "/zh/guide/webllm" },
              ],
            },
          ],
          "/zh/api/": [
            {
              text: "API",
              items: [
                { text: "插件", link: "/zh/api/plugin" },
                { text: "类型", link: "/zh/api/types" },
                { text: "工具", link: "/zh/api/utils" },
              ],
            },
          ],
          "/zh/examples/": [
            {
              text: "示例",
              items: [
                { text: "概览", link: "/zh/examples/" },
                { text: "Vue + WebLLM", link: "/zh/examples/vue-webllm" },
              ],
            },
          ],
        },
      },
    },
  },
  themeConfig: {
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/your-org/prosemirror-completion",
      },
    ],
  },
});
