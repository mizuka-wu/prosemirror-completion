import type { EditorView } from "prosemirror-view";
import type { CompletionPluginState, CompletionAction } from "./types";

/**
 * 键盘事件处理器
 * 处理 Tab（应用）、Esc（取消）、和其他按键
 */
export function handleKeyDown(
  view: EditorView,
  event: KeyboardEvent,
  pluginState: CompletionPluginState
): boolean {
  const { activeSuggestion, triggerPos } = pluginState;

  // 没有激活的补全时，不拦截
  if (!activeSuggestion || triggerPos === null) {
    return false;
  }

  // Tab: 应用补全
  if (event.key === "Tab" && !event.shiftKey) {
    event.preventDefault();
    const action: CompletionAction = { type: "apply" };
    view.dispatch(view.state.tr.setMeta("prosemirror-completion", action));
    return true;
  }

  // Escape: 取消补全
  if (event.key === "Escape") {
    event.preventDefault();
    const action: CompletionAction = { type: "cancel" };
    view.dispatch(view.state.tr.setMeta("prosemirror-completion", action));
    return true;
  }

  // 其他按键：更新状态，让 state.apply 处理
  return false;
}

/**
 * 检查是否需要取消补全（光标移出触发区域等）
 */
export function shouldCancelCompletion(
  view: EditorView,
  pluginState: CompletionPluginState
): boolean {
  const { activeSuggestion, triggerPos } = pluginState;

  if (!activeSuggestion || triggerPos === null) {
    return false;
  }

  const { from, to } = view.state.selection;

  // 如果光标不在触发位置之后，取消补全
  if (from < triggerPos) {
    return true;
  }

  return false;
}
