# Demo Application

Run `apps/demo` to try every completion mode (Mock, HTML, Markdown, ProseMirror Node, WebLLM).

## Development

```bash
pnpm install
pnpm --filter demo dev
```

Open `http://localhost:5173/` and switch between tabs to preview each scenario.

## Production Build

```bash
pnpm --filter demo build
pnpm --filter demo preview
```

## Features

- **Mock** – Basic plain-text completion
- **HTML** – Directly insert rich HTML markup
- **Markdown** – Parse Markdown via `prosemirror-markdown`
- **ProseMirror Node** – Return schema-safe nodes
- **WebLLM** – Browser LLM-powered completion
