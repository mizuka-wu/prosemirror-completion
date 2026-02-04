# 实时 Demo

直接在文档中体验 ProseMirror Completion 插件，支持多种补全模式（包括 WebLLM）。下方为交互式 Playground：

<!-- markdownlint-disable-next-line MD033 -->
<CompletionDemo locale="zh" />

## 覆盖场景

1. **纯文本**：基础 mock 补全。
2. **代码块**：在 ```` ``` ```` 包裹的代码块内输入可获得代码建议。
3. **Markdown 转 Node**：使用 `prosemirror-markdown` 将 Markdown 解析为节点。
4. **HTML**：返回 HTML 片段并插入格式化内容。
5. **ProseMirror Node**：直接返回 schema 安全的节点。
6. **自定义 Prompt**：演示如何在调用 `callCompletion` 前动态拼装 prompt。
7. **WebLLM**：基于 `@mlc-ai/web-llm` 的浏览器端 LLM 补全。

> **提示**：首次启用 WebLLM 需要下载模型（约 100MB）。等待状态提示显示“WebLLM 就绪”后再输入。

## 使用技巧

- 输入至少 3 个字符后才会触发补全。
- 使用 <!-- markdownlint-disable-line MD033 --> <kbd>Tab</kbd> 接受，<kbd>Esc</kbd> 取消。
- 代码模式需放在 ```` ``` ```` 内，才能识别为代码 Prompt。
- Markdown 模式会插入标题、列表等结构化内容，便于展示渲染效果。
- HTML 模式可快速预览富文本插入。

## 常见问题

- 如果 WebLLM 加载失败，请刷新页面或检查网络。
- 单次仅建议开启一个 Demo，避免反复加载模型。
