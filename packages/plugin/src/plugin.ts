import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type {
  CompletionOptions,
  CompletionPluginState,
  CompletionAction,
} from "./types";
import {
  completionPluginKey,
} from "./types";
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
export function createCompletionPlugin(
  options: CompletionOptions
): Plugin<CompletionPluginState> {
  const debounceMs = options.debounceMs ?? 300;
  const minTriggerLength = options.minTriggerLength ?? 3;

  return new Plugin<CompletionPluginState>({
    key: completionPluginKey,

    state: {
      init(): CompletionPluginState {
        return {
          activeSuggestion: null,
          triggerPos: null,
          isLoading: false,
          abortController: null,
          decorations: emptyDecorations(null as unknown as import("prosemirror-state").EditorState),
          debounceTimer: null,
          options,
        };
      },

      apply(tr, pluginState): CompletionPluginState {
        const action = tr.getMeta(
          "prosemirror-completion"
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
                  tr,
                  pluginState,
                  action.pos,
                  action.result,
                  options
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
                decorations: clearDecorations(tr),
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
                decorations: clearDecorations(tr),
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

        // 检查是否需要取消补全（例如光标移出了触发区域）
        const { from } = tr.selection;
        if (from < pluginState.triggerPos) {
          // 取消补全
          if (pluginState.abortController) {
            pluginState.abortController.abort();
          }
          if (pluginState.debounceTimer) {
            clearTimeout(pluginState.debounceTimer);
          }

          // 调用 onExit 回调
          if (options.onExit) {
            // onExit 会在 view 更新后调用
            setTimeout(() => {
              // 这需要 view 引用，在这里无法直接调用
            }, 0);
          }

          return {
            ...pluginState,
            activeSuggestion: null,
            triggerPos: null,
            isLoading: false,
            abortController: null,
            decorations: clearDecorations(tr),
            debounceTimer: null,
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
              })
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

              // 调用补全函数
              const result = await Promise.resolve(options.callCompletion(context));

              // 如果已经被取消，不更新
              if (abortController.signal.aborted) {
                return;
              }

              // 更新建议
              view.dispatch(
                view.state.tr.setMeta("prosemirror-completion", {
                  type: "suggest",
                  result,
                  pos,
                })
              );

              // 调用 onChange 回调
              if (options.onChange) {
                options.onChange(context, view);
              }
            } catch (error) {
              if (abortController.signal.aborted) {
                return;
              }
              console.error("Completion error:", error);
            } finally {
              // 清除 loading 状态
              view.dispatch(
                view.state.tr.setMeta("prosemirror-completion", {
                  type: "loading",
                  isLoading: false,
                })
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

      // 监听文档变化
      const handleInput = () => {
        const { from } = view.state.selection;

        // 检查是否应该触发补全
        if (!shouldTriggerCompletion(view.state, { ...options, minTriggerLength })) {
          return;
        }

        const pluginState = completionPluginKey.getState(view.state);
        if (pluginState?.activeSuggestion) {
          // 已经有补全，更新它
          debouncedRequest(from);
        } else {
          // 新的补全请求
          debouncedRequest(from);
        }
      };

      // 使用 ProseMirror 的 update 监听文档变化
      return {
        update: (view, prevState) => {
          // 检查文档是否变化
          if (view.state.doc !== prevState.doc) {
            handleInput();
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
