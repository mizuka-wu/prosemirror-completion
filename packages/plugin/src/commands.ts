import type { EditorState, Transaction } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import { Node as PMNode } from "prosemirror-model";
import type {
  CompletionResult,
  CompletionPluginState,
} from "./types";
import { completionPluginKey } from "./types";
import { parseCompletionResult } from "./decorations";

/**
 * 获取补全结果的 HTML 内容
 */
function getCompletionHTML(result: CompletionResult): string | undefined {
  if (typeof result === "string") {
    return undefined;
  }
  if ("html" in result && result.html !== undefined) {
    return result.html;
  }
  return undefined;
}

/**
 * 获取补全结果的 ProseMirror Node
 */
function getCompletionNode(result: CompletionResult): PMNode | undefined {
  if (typeof result === "string") {
    return undefined;
  }
  if ("prosemirror" in result && result.prosemirror) {
    return result.prosemirror;
  }
  return undefined;
}

/**
 * 将 HTML 字符串解析为 ProseMirror 文档片段
 */
function parseHTMLToFragment(
  html: string,
  state: EditorState
): PMNode | null {
  // 使用 DOMParser 将 HTML 解析为 DOM
  const dom = new DOMParser().parseFromString(html, "text/html");

  try {
    const nodes: PMNode[] = [];
    const body = dom.body;

    for (let i = 0; i < body.childNodes.length; i++) {
      const child = body.childNodes[i];
      if (child.nodeType === 3) { // TEXT_NODE
        const text = child.textContent ?? "";
        if (text) {
          nodes.push(state.schema.text(text));
        }
      } else if (child.nodeType === 1) { // ELEMENT_NODE
        const element = child as HTMLElement;
        const parsed = parseElement(element, state);
        if (parsed) {
          nodes.push(parsed);
        }
      }
    }

    if (nodes.length === 0) {
      return null;
    }

    // 创建文档片段
    return state.schema.nodes.doc.create(null, nodes);
  } catch {
    return null;
  }
}

/**
 * 解析单个 HTML 元素为 ProseMirror 节点
 */
function parseElement(element: HTMLElement, state: EditorState): PMNode | null {
  const tagName = element.tagName.toLowerCase();

  // 处理常见标签
  switch (tagName) {
    case "p":
      return state.schema.nodes.paragraph?.create(
        null,
        parseInlineContent(element, state)
      );
    case "strong":
    case "b":
      return state.schema.text(
        element.textContent ?? "",
        [state.schema.marks.strong?.create()]
      );
    case "em":
    case "i":
      return state.schema.text(
        element.textContent ?? "",
        [state.schema.marks.em?.create()]
      );
    case "code":
      return state.schema.text(
        element.textContent ?? "",
        [state.schema.marks.code?.create()]
      );
    case "br":
      return state.schema.text("\n");
    default:
      // 对于未知标签，尝试解析其文本内容
      return state.schema.text(element.textContent ?? "");
  }
}

/**
 * 解析内联内容
 */
function parseInlineContent(element: HTMLElement, state: EditorState): PMNode[] {
  const nodes: PMNode[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    if (child.nodeType === 3) { // TEXT_NODE
      const text = child.textContent ?? "";
      if (text) {
        nodes.push(state.schema.text(text));
      }
    } else if (child.nodeType === 1) { // ELEMENT_NODE
      const parsed = parseElement(child as HTMLElement, state);
      if (parsed) {
        nodes.push(parsed);
      }
    }
  }

  return nodes;
}

/**
 * 插入补全内容 - 支持 HTML 直接渲染和 ProseMirror Node
 */
export function insertCompletion(
  state: EditorState,
  result: CompletionResult
): Transaction {
  const pluginState = completionPluginKey.getState(state) as
    | CompletionPluginState
    | undefined;

  if (!pluginState || pluginState.triggerPos === null) {
    return state.tr;
  }

  const node = getCompletionNode(result);
  const html = getCompletionHTML(result);
  const text = parseCompletionResult(result);
  const pos = state.selection.from;

  let tr: Transaction;
  let insertedSize = 0;

  // 优先处理 prosemirror 类型
  if (node) {
    // 直接插入 ProseMirror Node
    tr = state.tr.insert(pos, node.content);
    insertedSize = tr.doc.content.size - state.doc.content.size;
  } else if (html) {
    // 如果有 HTML 内容，尝试插入富文本
    const fragment = parseHTMLToFragment(html, state);
    if (fragment && fragment.childCount > 0) {
      tr = state.tr.insert(pos, fragment.content);
      insertedSize = tr.doc.content.size - state.doc.content.size;
    } else {
      // 回退到纯文本插入
      tr = state.tr.insertText(text, pos);
      insertedSize = text.length;
    }
  } else {
    // 纯文本插入
    tr = state.tr.insertText(text, pos);
    insertedSize = text.length;
  }

  // 将光标移到插入内容之后
  const newPos = pos + insertedSize;
  tr.setSelection(TextSelection.create(tr.doc, newPos));

  // 添加 meta 标记已应用
  tr.setMeta("prosemirror-completion", { type: "apply" });

  return tr;
}

/**
 * 取消补全
 */
export function cancelCompletion(state: EditorState): Transaction {
  const tr = state.tr;
  tr.setMeta("prosemirror-completion", { type: "cancel" });
  return tr;
}

/**
 * 检查是否有活动的补全
 */
export function hasActiveCompletion(state: EditorState): boolean {
  const pluginState = completionPluginKey.getState(state);
  return !!(
    pluginState?.activeSuggestion && pluginState?.triggerPos !== null
  );
}

/**
 * 获取当前补全建议
 */
export function getActiveSuggestion(
  state: EditorState
): CompletionResult | null {
  const pluginState = completionPluginKey.getState(state);
  return pluginState?.activeSuggestion ?? null;
}
