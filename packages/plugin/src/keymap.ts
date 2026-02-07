import type { Command } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { CompletionPluginState } from "./types";
import { completionPluginKey } from "./types";
import { insertCompletion } from "./utils";

/**
 * 检查是否需要取消补全（光标移出触发区域等）
 */
export function shouldCancelCompletion(
  view: EditorView,
  pluginState: CompletionPluginState,
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

export const approveCompletion: Command = (state, dispatch, view) => {
  const pluginState = completionPluginKey.getState(state);
  if (!pluginState?.activeSuggestion || pluginState.triggerPos === null) {
    return false;
  }

  const tr = insertCompletion(state, pluginState.activeSuggestion);
  dispatch?.(tr);

  if (view) {
    const exitContext = pluginState.activeContext ?? undefined;
    pluginState.options.onApply(
      pluginState.activeSuggestion,
      view,
      exitContext,
    );
  }

  return true;
};

export const exitCompletion: Command = (state, dispatch, view) => {
  const pluginState = completionPluginKey.getState(state);
  if (!pluginState?.activeSuggestion) {
    return false;
  }

  dispatch?.(state.tr.setMeta("prosemirror-completion", { type: "cancel" }));

  if (view) {
    const exitContext =
      pluginState.activeContext ?? pluginState.pendingContext ?? undefined;
    pluginState.options.onExit(view, exitContext);
  }

  return true;
};
