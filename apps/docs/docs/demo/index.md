# Demo Application

运行 `apps/demo` 可以体验所有补全模式（Mock、HTML、Markdown、ProseMirror、WebLLM）。

## 开发环境

```bash
pnpm install
pnpm --filter demo dev
```

访问 `http://localhost:5173/` 即可切换不同 Tab 体验各示例。

## 生产构建

```bash
pnpm --filter demo build
pnpm --filter demo preview
```

## 主要功能

- **Mock**：基础纯文本补全
- **HTML**：直接插入富文本格式
- **Markdown**：使用 `prosemirror-markdown` 解析后插入
- **ProseMirror Node**：返回 Schema 支持的 Node 对象
- **WebLLM**：调用浏览器内置 LLM 生成补全
