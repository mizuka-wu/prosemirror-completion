import { Decoration, DecorationSet } from "prosemirror-view";
import type { EditorState } from "prosemirror-state";
import type { Node } from "prosemirror-model";
import type {
  CompletionOptions,
  CompletionResult,
  CompletionPluginState,
} from "./types";

/**
 * 创建 ghost text 的 decoration
 */
export function createGhostDecoration(
  pos: number,
  result: CompletionResult,
  options: CompletionOptions
): Decoration {
  const dom = document.createElement("span");
  dom.className = options.ghostClassName ?? "prosemirror-ghost-text";

  // 解析补全结果
  const text = parseCompletionResult(result);
  dom.textContent = text;

  // side: 1 确保它在光标后，stopEvent 阻止用户点击灰字导致光标偏移
  return Decoration.widget(pos, dom, {
    side: 1,
    stopEvent: () => true,
    key: "ghost-completion",
  });
}

/**
 * 解析补全结果为纯文本
 */
export function parseCompletionResult(result: CompletionResult): string {
  if (typeof result === "string") {
    return result;
  }
  if ("plain" in result && result.plain !== undefined) {
    return result.plain;
  }
  if ("html" in result && result.html !== undefined) {
    // 简单去除 HTML 标签获取纯文本
    const tmp = document.createElement("div");
    tmp.innerHTML = result.html;
    return tmp.textContent ?? "";
  }
  if ("prosemirror" in result && result.prosemirror) {
    // 从 ProseMirror Node 提取文本内容
    return result.prosemirror.textContent ?? "";
  }
  return "";
}

/**
 * 将补全结果转换为 ProseMirror 可以插入的片段
 */
export function createCompletionFragment(
  result: CompletionResult,
  state: EditorState
): { text: string; html?: string; node?: Node } {
  if (typeof result === "string") {
    return { text: result };
  }
  if ("prosemirror" in result) {
    return { text: result.prosemirror.textContent ?? "", node: result.prosemirror };
  }
  if ("plain" in result && "html" in result) {
    return { text: result.plain, html: result.html };
  }
  if ("html" in result) {
    return {
      text: parseCompletionResult(result),
      html: result.html,
    };
  }
  if ("plain" in result) {
    return { text: result.plain };
  }
  return { text: "" };
}

/**
 * 创建空的 DecorationSet
 */
export function emptyDecorations(state: EditorState | null): DecorationSet {
  if (!state) {
    return DecorationSet.empty;
  }
  return DecorationSet.create(state.doc, []);
}

/**
 * 更新 DecorationSet，添加 ghost decoration
 */
export function updateGhostDecoration(
  state: EditorState | null,
  pluginState: CompletionPluginState,
  pos: number,
  result: CompletionResult,
  options: CompletionOptions
): DecorationSet {
  if (!options.showGhost || !result || !state) {
    return emptyDecorations(state);
  }

  const deco = createGhostDecoration(pos, result, options);
  return DecorationSet.create(state.doc, [deco]);
}

/**
 * 创建空的 DecorationSet
 */
export function clearDecorations(state: EditorState | null): DecorationSet {
  return emptyDecorations(state);
}
