import type { EditorState, Transaction } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import type {
  CompletionResult,
  CompletionPluginState,
} from "./types";
import { completionPluginKey } from "./types";
import { parseCompletionResult } from "./decorations";

/**
 * 插入补全内容
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

  const text = parseCompletionResult(result);
  const pos = state.selection.from;

  // 插入文本
  const tr = state.tr.insertText(text, pos);

  // 将光标移到插入文本之后
  const newPos = pos + text.length;
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
