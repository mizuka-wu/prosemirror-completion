# Docs Demo Implementation Plan

## Goal

Embed fully interactive ProseMirror Completion demos inside the VitePress docs that showcase real WebLLM-backed completions across multiple scenarios (text, code, markdown-to-node, HTML insertion, custom prompts, etc.).

## Constraints & Considerations

- Docs build uses VitePress with Vue, so demos need to be Vue/TS components under `.vitepress/theme` or MDX-style components.
- WebLLM bundle is heavy; need lazy loading or toggle to avoid blocking docs load.
- Should reuse plugin logic from `apps/demo` to avoid divergent behavior.
- Provide both English and Chinese docs parity.

## Phases

1. **Infrastructure Setup**
   - Create shared demo component (e.g., `LiveCompletionDemo.vue`) under `.vitepress/theme/components`.
   - Extract reusable schema + helper code from `apps/demo` into a shared module (e.g., `packages/demo-shared` or simple copy). Ensure dependency is workspace-symlinked.
   - Add WebLLM dependency to docs package and verify SSR/CSR compatibility (may need client-only guard).

2. **Core Demo Integration**
   - Mount ProseMirror editor inside Vue component with tabs for different completion modes.
   - Provide UI controls (mode selector, show prompt, accept/cancel instructions) similar to demo app but tailored for docs.
   - Handle WebLLM initialization lazily (user click to activate) to avoid large initial payload.

3. **Scenario Implementations**
   - **Plain Text Completion**: Basic mock completions.
   - **Code Block Completion**: Detect `code_block` parent, return code snippet.
   - **Markdown Completion**: Convert Markdown string via `prosemirror-markdown` to Node before insertion.
   - **HTML Completion**: Return HTML fragment and verify plugin inserts rich text correctly.
   - **ProseMirror Node**: Return pre-built nodes with marks.
   - **Custom Prompt Builder**: Showcase custom `getPromptType` or manual prompt injection.
   - **WebLLM-backed Completion**: Real AI completions with streaming or final text insertion.

4. **Documentation Updates**
   - New page `docs/examples/live-demo.md` describing usage, prerequisites (WebLLM model download), and scenarios.
   - Link from homepage / nav to the interactive demo page.
   - Provide step-by-step instructions for each scenario (code snippets + how to trigger).

5. **Localization**
   - Mirror the live demo page and descriptions under `/zh/examples/live-demo.md`.
   - Ensure UI strings in the Vue component support i18n (either via props or locale detection).

6. **Testing & Build Validation**
   - Run `pnpm --filter docs dev` locally, verify demos render and interactions work in both languages.
   - Run full `pnpm run build` to confirm VitePress bundling handles WebLLM assets and no dead links appear.
   - Document fallback/mocking behavior when WebLLM is unavailable (e.g., show warning or fallback to mock data).

## Deliverables

- `LiveCompletionDemo.vue` (or similar) component integrated into docs.
- Updated docs pages highlighting each scenario with interactive playground.
- PR checklist: SSR guard for WebLLM, localization, updated nav/sidebar, build/test proof.
