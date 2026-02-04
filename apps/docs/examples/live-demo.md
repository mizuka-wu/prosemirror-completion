# Live Demo Playground

Experiment with the ProseMirror Completion plugin directly in the docs. The playground below lets you switch between different completion modes, including WebLLM-powered suggestions.

<!-- markdownlint-disable-next-line MD033 -->
<CompletionDemo />

## Scenarios Covered

1. **Plain Text** – basic mock completions.
2. **Code Blocks** – writing inside fenced code blocks yields code-oriented snippets.
3. **Markdown to Node** – markdown strings are parsed via `prosemirror-markdown` and inserted as nodes.
4. **HTML** – HTML strings are parsed and inserted with formatting.
5. **ProseMirror Node** – returns schema-safe nodes directly.
6. **Custom Prompt** – demonstrates prompt templating before calling `callCompletion`.
7. **WebLLM** – browser LLM completions via `@mlc-ai/web-llm`.

> **Note**: WebLLM requires downloading a model (~100MB) at first use. Please wait for the status message to show “WebLLM ready” before typing.

## Usage Tips

- Type at least 3 characters to trigger suggestions.
- Use <!-- markdownlint-disable-line MD033 --> <kbd>Tab</kbd> to accept and <kbd>Esc</kbd> to cancel.
- For the code mode, wrap your text in triple backticks (` ``` `) to indicate a code block.
- Markdown mode produces headings, lists, and blockquotes to showcase structured insertions.
- HTML mode is a quick way to preview rich text inserted by the plugin.

## Troubleshooting

- If WebLLM fails to load, check the console for errors or retry; network connectivity is required.
- For best performance, keep a single demo instance active at a time.
