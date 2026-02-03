import { defineConfig } from "vitepress";

export default defineConfig({
  title: "ProseMirror Completion",
  description: "Copilot-style text completion plugin for ProseMirror",
  base: "/prosemirror-completion/",
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
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/your-org/prosemirror-completion" },
    ],
  },
});
