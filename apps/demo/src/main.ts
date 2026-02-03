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
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  .tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
  .tab-button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: #f5f5f5;
    cursor: pointer;
    border-radius: 4px;
  }
  .tab-button.active {
    background: #007acc;
    color: white;
    border-color: #007acc;
  }
  #editor-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    min-height: 300px;
    padding: 10px;
  }
  .ProseMirror {
    outline: none;
    min-height: 280px;
  }
  .prosemirror-ghost-text {
    color: #999;
    opacity: 0.6;
    pointer-events: none;
  }
  .instructions {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 4px;
  }
  .instructions kbd {
    background: #eee;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
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
