import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { defaultMarkdownParser } from "prosemirror-markdown";
import { completion } from "@prosemirror-completion/plugin";
import type {
  CompletionContext,
  CompletionResult,
} from "@prosemirror-completion/plugin";
import type { Node } from "prosemirror-model";
import "./style.css";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-example-setup/style/style.css";

// Create schema
const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

// ============ 1. Basic mock completion ============
async function mockCallCompletion(
  context: CompletionContext,
): Promise<CompletionResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const beforeText = context.beforeText;

  if (context.promptType === "code") {
    return `// TODO: Implement based on:\n// ${beforeText.slice(-50)}`;
  } else if (context.promptType === "markdown") {
    return `**Keep writing**: based on "${beforeText.slice(-30)}..."`;
  } else {
    return `This completion is based on "${beforeText.slice(-30)}".`;
  }
}

// ============ 2. HTML rich-text completion ============
async function htmlCallCompletion(
  context: CompletionContext,
): Promise<CompletionResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const beforeText = context.beforeText;

  return {
    plain: `Bold and italic text example`,
    html: `<p>This is an example of <strong>bold</strong> and <em>italic</em> text based on: ${beforeText.slice(-20)}</p>`,
  };
}

// ============ 3. Markdown to ProseMirror node ============
async function markdownCallCompletion(
  context: CompletionContext,
): Promise<CompletionResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const beforeText = context.beforeText;

  const markdownContent = `
## Suggestions based on "${beforeText.slice(-30)}"

This is an example of **Markdown** content.

- Supports list items
- Supports *italic* and **bold**

> This is a block quote
`;

  const parsedNode = defaultMarkdownParser.parse(markdownContent);

  if (parsedNode) {
    return { prosemirror: parsedNode };
  }

  return markdownContent;
}

// ============ 4. Return ProseMirror node directly ============
async function prosemirrorNodeCompletion(
  context: CompletionContext,
): Promise<CompletionResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const paragraph = schema.nodes.paragraph.create(
    null,
    schema.text("This node is constructed directly", [
      schema.marks.strong.create(),
    ]),
  );

  const paragraph2 = schema.nodes.paragraph.create(
    null,
    schema.text("Supports rich text formatting", [schema.marks.em.create()]),
  );

  const doc = schema.nodes.doc.create(null, [paragraph, paragraph2]);

  return { prosemirror: doc };
}

// ============ 5. WebLLM AI completion ============
async function webLLMCallCompletion(
  context: CompletionContext,
): Promise<CompletionResult> {
  const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
  const engine = await CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC");

  const prompt = `Continue the following text naturally:\n\n${context.beforeText}\n\nContinue:`;

  const response = await engine.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content ?? "";
}

// Completion handler mapping
type CompletionMode = "mock" | "html" | "markdown" | "prosemirror" | "webllm";

const completionHandlers: Record<
  CompletionMode,
  (context: CompletionContext) => Promise<CompletionResult>
> = {
  mock: mockCallCompletion,
  html: htmlCallCompletion,
  markdown: markdownCallCompletion,
  prosemirror: prosemirrorNodeCompletion,
  webllm: webLLMCallCompletion,
};

const modeDescriptions: Record<CompletionMode, string> = {
  mock: "Basic mock completion - returns plain text",
  html: "HTML completion - returns HTML string for insertion",
  markdown: "Markdown completion - parsed with prosemirror-markdown",
  prosemirror: "ProseMirror node - returns a Node object directly",
  webllm: "WebLLM - real AI completion",
};

// Create editor
function createEditor(container: HTMLElement, mode: CompletionMode) {
  const completionPlugin = completion({
    debounceMs: 500,
    minTriggerLength: 3,
    callCompletion: completionHandlers[mode],
    ghostClassName: "prosemirror-ghost-text",
    showGhost: true,
    onChange: (context: CompletionContext, view: EditorView) => {
      console.log("Completion triggered:", context.promptType);
    },
    onApply: (result: CompletionResult, view: EditorView) => {
      console.log("Completion applied:", result);
    },
    onExit: (view: EditorView) => {
      console.log("Completion cancelled");
    },
  });

  const state = EditorState.create({
    schema,
    plugins: [...exampleSetup({ schema }), completionPlugin],
  });

  const view = new EditorView(container, {
    state,
  });

  return view;
}

// Initialize app
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="demo-container">
    <h1>ProseMirror Completion Demo</h1>
    <p class="subtitle">Intelligent completion plugin with multiple return types</p>
    <div class="tabs">
      <button class="tab-button active" data-mode="mock">Mock</button>
      <button class="tab-button" data-mode="html">HTML</button>
      <button class="tab-button" data-mode="markdown">Markdown</button>
      <button class="tab-button" data-mode="prosemirror">ProseMirror</button>
      <button class="tab-button" data-mode="webllm">WebLLM</button>
    </div>
    <div id="editor-container"></div>
    <div class="mode-description" id="mode-description"></div>
    <div class="instructions">
      <p><strong>How to use:</strong></p>
      <ul>
        <li>Type at least 3 characters to trigger completion</li>
        <li><kbd>Tab</kbd> - Accept completion</li>
        <li><kbd>Esc</kbd> - Cancel completion</li>
        <li>Gray text is Ghost Text (suggested content)</li>
      </ul>
    </div>
  </div>
`;

// Styles
const style = document.createElement("style");
style.textContent = `
  .demo-container {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .demo-container h1 {
    margin-top: 0;
    margin-bottom: 4px;
    font-size: 1.5em;
    color: #333;
  }
  .subtitle {
    margin: 0 0 16px 0;
    color: #666;
    font-size: 0.9em;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 12px;
  }
  .tab-button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.2s;
  }
  .tab-button:hover {
    background: #f5f5f5;
  }
  .tab-button.active {
    background: #007acc;
    color: white;
    border-color: #007acc;
  }
  #editor-container {
    border: 1px solid #ddd;
    border-radius: 6px;
    min-height: 300px;
    background: white;
  }
  .mode-description {
    margin-top: 12px;
    padding: 12px 16px;
    background: #e3f2fd;
    border-radius: 6px;
    font-size: 14px;
    color: #1976d2;
  }
  .mode-description:empty {
    display: none;
  }
  .ProseMirror {
    outline: none;
    min-height: 300px;
    padding: 16px;
    font-size: 16px;
    line-height: 1.6;
    color: #333;
  }
  .ProseMirror p {
    margin: 0 0 0.8em 0;
  }
  .ProseMirror-focused {
    border-color: #007acc;
    box-shadow: 0 0 0 3px rgba(0,122,204,0.1);
  }
  .prosemirror-ghost-text {
    color: #999;
    opacity: 0.7;
    pointer-events: none;
    font-style: italic;
  }
  .instructions {
    margin-top: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 4px solid #007acc;
  }
  .instructions p {
    margin: 0 0 8px 0;
    font-weight: 600;
  }
  .instructions ul {
    margin: 0;
    padding-left: 20px;
  }
  .instructions li {
    margin: 4px 0;
  }
  .instructions kbd {
    background: #e8e8e8;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.9em;
    border: 1px solid #ccc;
  }
  /* ProseMirror Menubar */
  .ProseMirror-menubar {
    border-bottom: 1px solid #ddd;
    background: #f8f9fa;
    padding: 4px 8px;
    min-height: 36px;
    display: flex;
    align-items: center;
    gap: 2px;
    border-radius: 6px 6px 0 0;
  }
  .ProseMirror-menubar-wrapper {
    border-radius: 6px 6px 0 0;
  }
  .ProseMirror-menuitem {
    display: inline-flex;
  }
  .ProseMirror-menuseparator {
    display: inline-block;
    width: 1px;
    height: 20px;
    background: #ddd;
    margin: 0 4px;
  }
  .ProseMirror-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    color: #555;
    font-size: 14px;
    line-height: 1;
  }
  .ProseMirror-icon:hover {
    background: #e9ecef;
    border-color: #ced4da;
  }
  .ProseMirror-icon svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
  .ProseMirror-menu-dropdown {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    color: #555;
  }
  .ProseMirror-menu-dropdown:hover {
    background: #e9ecef;
    border-color: #ced4da;
  }
  .ProseMirror-menu-dropdown-menu {
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    padding: 4px 0;
    min-width: 120px;
  }
  .ProseMirror-menu-dropdown-item {
    padding: 6px 12px;
    cursor: pointer;
    font-size: 13px;
    color: #333;
  }
  .ProseMirror-menu-dropdown-item:hover {
    background: #f0f0f0;
  }
  .ProseMirror-menu-active {
    background: #e3f2fd !important;
    border-color: #90caf9 !important;
    color: #1976d2 !important;
  }
`;
document.head.appendChild(style);

// Current editor instance
let currentView: EditorView | null = null;
const container = document.getElementById("editor-container")!;
const descriptionEl = document.getElementById("mode-description")!;

// Update mode description
function updateDescription(mode: CompletionMode) {
  descriptionEl.textContent = `Current mode: ${modeDescriptions[mode]}`;
}

// Create initial editor
currentView = createEditor(container, "mock");
updateDescription("mock");

// Tab switching
document.querySelectorAll(".tab-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-button")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const mode = btn.getAttribute("data-mode") as CompletionMode;
    if (currentView) {
      currentView.destroy();
    }
    currentView = createEditor(container, mode);
    updateDescription(mode);
  });
});
