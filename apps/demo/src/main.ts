import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { createCompletionPlugin } from "@prosemirror-completion/plugin";
import type { CompletionContext, CompletionResult } from "@prosemirror-completion/plugin";
import "./style.css";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-example-setup/style/style.css";

// 创建 schema
const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

// 模拟 WebLLM 补全函数
async function mockCallCompletion(
  context: CompletionContext
): Promise<CompletionResult> {
  // 模拟延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  const beforeText = context.beforeText;

  // 简单的模拟补全
  if (context.promptType === "code") {
    return `// TODO: Implement based on:\n// ${beforeText.slice(-50)}`;
  } else if (context.promptType === "markdown") {
    return `**继续写作**: 基于 "${beforeText.slice(-30)}..."`;
  } else {
    return `这是基于 "${beforeText.slice(-30)}" 的补全内容。`;
  }
}

// WebLLM 补全函数（真实实现）
async function webLLMCallCompletion(
  context: CompletionContext
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

// 创建编辑器
function createEditor(container: HTMLElement, useWebLLM = false) {
  const completionPlugin = createCompletionPlugin({
    debounceMs: 500,
    minTriggerLength: 3,
    callCompletion: useWebLLM ? webLLMCallCompletion : mockCallCompletion,
    ghostClassName: "prosemirror-ghost-text",
    showGhost: true,
    onChange: (context, view) => {
      console.log("Completion triggered:", context.promptType);
    },
    onApply: (result, view) => {
      console.log("Completion applied:", result);
    },
    onExit: (view) => {
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

// 初始化应用
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="demo-container">
    <h1>ProseMirror Completion Demo</h1>
    <div class="tabs">
      <button class="tab-button active" data-mode="mock">Mock 补全</button>
      <button class="tab-button" data-mode="webllm">WebLLM 补全</button>
    </div>
    <div id="editor-container"></div>
    <div class="instructions">
      <p><strong>使用说明：</strong></p>
      <ul>
        <li>输入至少 3 个字符触发补全</li>
        <li><kbd>Tab</kbd> - 接受补全</li>
        <li><kbd>Esc</kbd> - 取消补全</li>
        <li>灰色文字是 Ghost Text（建议内容）</li>
      </ul>
    </div>
  </div>
`;

// 样式
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
    font-size: 1.5em;
    color: #333;
  }
  .tabs {
    display: flex;
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

// 当前编辑器
let currentView: EditorView | null = null;
const container = document.getElementById("editor-container")!;

// 创建初始编辑器
currentView = createEditor(container, false);

// 标签切换
document.querySelectorAll(".tab-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-button")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const mode = btn.getAttribute("data-mode");
    if (currentView) {
      currentView.destroy();
    }
    currentView = createEditor(container, mode === "webllm");
  });
});
