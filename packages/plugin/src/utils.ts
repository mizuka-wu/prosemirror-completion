import type { EditorState, Transaction } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import { Node as PMNode } from "prosemirror-model";
import type {
  CompletionContext,
  CompletionOptions,
  CompletionPluginState,
  CompletionResult,
  PromptType,
} from "./types";
import { completionPluginKey } from "./types";
import { parseCompletionResult } from "./decorations";

/**
 * 获取光标前的文本内容
 */
export function getTextBeforeCursor(state: EditorState, pos: number): string {
  const $pos = state.doc.resolve(pos);
  const node = $pos.parent;

  // 获取从节点开始到光标位置的文本
  let text = "";
  let offset = $pos.parentOffset;

  // 遍历子节点收集文本
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child.isText) {
      const childText = child.text ?? "";
      if (offset <= childText.length) {
        text += childText.slice(0, offset);
        break;
      } else {
        text += childText;
        offset -= childText.length;
      }
    } else {
      // 非文本节点，记录为空格或换行
      text += " ";
      offset -= 1;
      if (offset <= 0) break;
    }
  }

  return text;
}

/**
 * 获取光标后的文本内容
 */
export function getTextAfterCursor(state: EditorState, pos: number): string {
  const $pos = state.doc.resolve(pos);
  const node = $pos.parent;

  let text = "";
  let offset = $pos.parentOffset;
  let started = false;

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child.isText) {
      const childText = child.text ?? "";
      if (!started) {
        if (offset < childText.length) {
          text += childText.slice(offset);
          started = true;
        } else {
          offset -= childText.length;
        }
      } else {
        text += childText;
      }
    } else {
      if (started || offset <= 0) {
        text += " ";
        started = true;
      } else {
        offset -= 1;
      }
    }
  }

  return text;
}

/**
 * 默认的 prompt 类型检测
 */
export function defaultGetPromptType(context: CompletionContext): PromptType {
  const { beforeText } = context;

  // 检测代码块
  if (
    beforeText.includes("```") ||
    /^\s*(function|const|let|var|class|import|export|if|for|while)/.test(
      beforeText.slice(-50),
    )
  ) {
    return "code";
  }

  // 检测 markdown 特征
  if (
    /^\s*(#{1,6}\s|>|\*|\d+\.|\[|!\[)/.test(beforeText.slice(-20)) ||
    beforeText.includes("**") ||
    beforeText.includes("__")
  ) {
    return "markdown";
  }

  return "common";
}

/**
 * 检查是否应该触发补全
 */
export function shouldTriggerCompletion(
  state: EditorState,
  options: CompletionOptions,
): boolean {
  const { from } = state.selection;
  const beforeText = getTextBeforeCursor(state, from);

  // 检查最小触发长度
  const minLength = options.minTriggerLength ?? 3;

  // 获取最后一个"词"的长度（以空格或标点分隔）
  const lastWord = beforeText.split(/[\s\n]+/).pop() ?? "";

  return lastWord.length >= minLength;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, ms);
  };
}

/**
 * ------------------ Completion Helpers (原 commands.ts) ------------------
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

function getCompletionNode(result: CompletionResult): PMNode | undefined {
  if (typeof result === "string") {
    return undefined;
  }
  if ("prosemirror" in result && result.prosemirror) {
    return result.prosemirror;
  }
  return undefined;
}

function parseHTMLToFragment(html: string, state: EditorState): PMNode | null {
  const dom = new DOMParser().parseFromString(html, "text/html");

  try {
    const nodes: PMNode[] = [];
    const body = dom.body;

    for (let i = 0; i < body.childNodes.length; i++) {
      const child = body.childNodes[i];
      if (child.nodeType === 3) {
        const text = child.textContent ?? "";
        if (text) {
          nodes.push(state.schema.text(text));
        }
      } else if (child.nodeType === 1) {
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

    return state.schema.nodes.doc.create(null, nodes);
  } catch {
    return null;
  }
}

function parseElement(element: HTMLElement, state: EditorState): PMNode | null {
  const tagName = element.tagName.toLowerCase();

  switch (tagName) {
    case "p":
      return (
        state.schema.nodes.paragraph?.create(
          null,
          parseInlineContent(element, state),
        ) ?? null
      );
    case "strong":
    case "b":
      return state.schema.text(element.textContent ?? "", [
        state.schema.marks.strong?.create(),
      ]);
    case "em":
    case "i":
      return state.schema.text(element.textContent ?? "", [
        state.schema.marks.em?.create(),
      ]);
    case "code":
      return state.schema.text(element.textContent ?? "", [
        state.schema.marks.code?.create(),
      ]);
    case "br":
      return state.schema.text("\n");
    default:
      return state.schema.text(element.textContent ?? "");
  }
}

function parseInlineContent(
  element: HTMLElement,
  state: EditorState,
): PMNode[] {
  const nodes: PMNode[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    if (child.nodeType === 3) {
      const text = child.textContent ?? "";
      if (text) {
        nodes.push(state.schema.text(text));
      }
    } else if (child.nodeType === 1) {
      const parsed = parseElement(child as HTMLElement, state);
      if (parsed) {
        nodes.push(parsed);
      }
    }
  }

  return nodes;
}

export function insertCompletion(
  state: EditorState,
  result: CompletionResult,
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

  if (node) {
    tr = state.tr.insert(pos, node.content);
    insertedSize = tr.doc.content.size - state.doc.content.size;
  } else if (html) {
    const fragment = parseHTMLToFragment(html, state);
    if (fragment && fragment.childCount > 0) {
      tr = state.tr.insert(pos, fragment.content);
      insertedSize = tr.doc.content.size - state.doc.content.size;
    } else {
      tr = state.tr.insertText(text, pos);
      insertedSize = text.length;
    }
  } else {
    tr = state.tr.insertText(text, pos);
    insertedSize = text.length;
  }

  const newPos = pos + insertedSize;
  tr.setSelection(TextSelection.create(tr.doc, newPos));
  tr.setMeta("prosemirror-completion", { type: "apply" });

  return tr;
}

export function cancelCompletion(state: EditorState): Transaction {
  const tr = state.tr;
  tr.setMeta("prosemirror-completion", { type: "cancel" });
  return tr;
}

export function hasActiveCompletion(state: EditorState): boolean {
  const pluginState = completionPluginKey.getState(state);
  return !!(pluginState?.activeSuggestion && pluginState?.triggerPos !== null);
}

export function getActiveSuggestion(
  state: EditorState,
): CompletionResult | null {
  const pluginState = completionPluginKey.getState(state);
  return pluginState?.activeSuggestion ?? null;
}
