import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type {
  CompletionOptions,
  CompletionPluginState,
  CompletionAction,
  ResolvedCompletionOptions,
} from "./types";
import { completionPluginKey } from "./types";
import {
  emptyDecorations,
  clearDecorations,
  updateGhostDecoration,
} from "./decorations";
import { handleKeyDown, shouldCancelCompletion } from "./keymap";
import {
  getTextBeforeCursor,
  getTextAfterCursor,
  defaultGetPromptType,
  shouldTriggerCompletion,
} from "./utils";
import { insertCompletion } from "./commands";

/**
 * 创建补全插件
 */
function resolveOptions(options: CompletionOptions): ResolvedCompletionOptions {
  return {
    debounceMs: options.debounceMs ?? 300,
    minTriggerLength: options.minTriggerLength ?? 3,
    callCompletion: options.callCompletion,
    getPromptType: options.getPromptType ?? defaultGetPromptType,
    onChange: options.onChange ?? (() => {}),
    onExit: options.onExit ?? (() => {}),
    onApply: options.onApply ?? (() => {}),
    ghostClassName: options.ghostClassName ?? "prosemirror-ghost-text",
    showGhost: options.showGhost ?? true,
    debug: options.debug ?? false,
  };
}

export function createCompletionPlugin(
  initOptions: CompletionOptions,
): Plugin<CompletionPluginState> {
  const options = resolveOptions(initOptions);
  const debounceMs = options.debounceMs;
  const minTriggerLength = options.minTriggerLength;
  const debugEnabled = options.debug;
  const debugLog = (...args: unknown[]) => {
    if (!debugEnabled) return;
    console.log("[prosemirror-completion]", ...args);
  };

  return new Plugin<CompletionPluginState>({
    key: completionPluginKey,

    state: {
      init(): CompletionPluginState {
        return {
          activeSuggestion: null,
          triggerPos: null,
          isLoading: false,
          abortController: null,
          decorations: emptyDecorations(null),
          debounceTimer: null,
          options,
        };
      },

      apply(tr, pluginState): CompletionPluginState {
        const action = tr.getMeta(
          "prosemirror-completion",
        ) as CompletionAction | null;

        // 处理 action
        if (action) {
          switch (action.type) {
            case "suggest":
              return {
                ...pluginState,
                activeSuggestion: action.result,
                triggerPos: action.pos,
                isLoading: false,
                abortController: null,
                decorations: updateGhostDecoration(
                  { doc: tr.doc } as import("prosemirror-state").EditorState,
                  pluginState,
                  action.pos,
                  action.result,
                  options,
                ),
                debounceTimer: null,
              };

            case "apply": {
              // 清理 decoration，补全内容已插入
              return {
                ...pluginState,
                activeSuggestion: null,
                triggerPos: null,
                isLoading: false,
                abortController: null,
                decorations: clearDecorations({
                  doc: tr.doc,
                } as import("prosemirror-state").EditorState),
                debounceTimer: null,
              };
            }

            case "cancel":
              // 取消之前的请求
              if (pluginState.abortController) {
                pluginState.abortController.abort();
              }
              if (pluginState.debounceTimer) {
                clearTimeout(pluginState.debounceTimer);
              }
              return {
                ...pluginState,
                activeSuggestion: null,
                triggerPos: null,
                isLoading: false,
                abortController: null,
                decorations: clearDecorations({
                  doc: tr.doc,
                } as import("prosemirror-state").EditorState),
                debounceTimer: null,
              };

            case "loading":
              return {
                ...pluginState,
                isLoading: action.isLoading,
              };
          }
        }

        // 如果没有 active suggestion，正常返回
        if (!pluginState.activeSuggestion || pluginState.triggerPos === null) {
          return {
            ...pluginState,
            decorations: pluginState.decorations.map(tr.mapping, tr.doc),
          };
        }

        // 映射 decorations
        return {
          ...pluginState,
          decorations: pluginState.decorations.map(tr.mapping, tr.doc),
        };
      },
    },

    props: {
      decorations(state) {
        return this.getState(state)?.decorations ?? null;
      },

      handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
        const pluginState = completionPluginKey.getState(view.state);
        if (!pluginState) return false;

        return handleKeyDown(view, event, pluginState);
      },
    },

    view(editorView) {
      const view = editorView;

      // 防抖处理补全请求
      const debouncedRequest = (() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        let lastAbortController: AbortController | null = null;

        return (pos: number) => {
          if (timer) {
            clearTimeout(timer);
          }

          // 取消之前的请求
          if (lastAbortController) {
            lastAbortController.abort();
          }

          timer = setTimeout(async () => {
            const abortController = new AbortController();
            lastAbortController = abortController;

            // 更新 loading 状态
            view.dispatch(
              view.state.tr.setMeta("prosemirror-completion", {
                type: "loading",
                isLoading: true,
              }),
            );

            try {
              const $pos = view.state.doc.resolve(pos);
              const parent = $pos.parent;
              const beforeText = getTextBeforeCursor(view.state, pos);
              const afterText = getTextAfterCursor(view.state, pos);
              const promptType = options.getPromptType
                ? options.getPromptType({
                    abortController,
                    parent,
                    pos,
                    beforeText,
                    afterText,
                    promptType: "common",
                    state: view.state,
                  })
                : defaultGetPromptType({
                    abortController,
                    parent,
                    pos,
                    beforeText,
                    afterText,
                    promptType: "common",
                    state: view.state,
                  });

              const context = {
                abortController,
                parent,
                pos,
                beforeText,
                afterText,
                promptType,
                state: view.state,
              };

              debugLog("Trigger completion", {
                pos,
                promptType,
                beforePreview: beforeText.slice(-40),
              });

              if (options.onChange) {
                options.onChange(context, view);
              }

              // 调用补全函数
              const result = await Promise.resolve(
                options.callCompletion(context),
              );

              debugLog("Completion result", result);

              // 如果已经被取消，不更新
              if (abortController.signal.aborted) {
                debugLog("Completion aborted", { pos });
                return;
              }

              // 更新建议
              view.dispatch(
                view.state.tr.setMeta("prosemirror-completion", {
                  type: "suggest",
                  result,
                  pos,
                }),
              );
            } catch (error) {
              if (abortController.signal.aborted) {
                return;
              }
              console.error(
                "[prosemirror-completion] Completion error:",
                error,
              );
            } finally {
              // 清除 loading 状态
              view.dispatch(
                view.state.tr.setMeta("prosemirror-completion", {
                  type: "loading",
                  isLoading: false,
                }),
              );
            }

            timer = null;
            lastAbortController = null;
          }, debounceMs);

          // 保存 timer 到插件状态
          const currentState = completionPluginKey.getState(view.state);
          if (currentState && currentState.debounceTimer) {
            clearTimeout(currentState.debounceTimer);
          }
        };
      })();

      // 监听文档和选择变化
      const handleInput = (from: number) => {
        // 检查是否应该触发补全
        if (
          !shouldTriggerCompletion(view.state, { ...options, minTriggerLength })
        ) {
          return;
        }
        // 触发新的补全请求
        debouncedRequest(from);
      };

      // 使用 ProseMirror 的 update 监听文档和选择变化
      return {
        update: (view, prevState) => {
          const pluginState = completionPluginKey.getState(view.state);
          if (!pluginState) return;

          // 检查是否有 active suggestion
          if (pluginState.activeSuggestion) {
            const { from } = view.state.selection;
            const selectionChanged =
              view.state.selection.eq(prevState.selection) === false;
            const docChanged = view.state.doc !== prevState.doc;

            // 如果有补全，检查是否需要取消
            if (docChanged || selectionChanged) {
              // 取消当前补全
              view.dispatch(
                view.state.tr.setMeta("prosemirror-completion", {
                  type: "cancel",
                }),
              );
            }
          }

          // 检查是否应该触发新的补全
          if (view.state.doc !== prevState.doc) {
            handleInput(view.state.selection.from);
          }
        },
        destroy: () => {
          // 清理
          const pluginState = completionPluginKey.getState(view.state);
          if (pluginState?.abortController) {
            pluginState.abortController.abort();
          }
          if (pluginState?.debounceTimer) {
            clearTimeout(pluginState.debounceTimer);
          }
        },
      };
    },
  });
}
