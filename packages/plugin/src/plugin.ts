import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type {
  CompletionOptions,
  CompletionPluginState,
  CompletionAction,
  ResolvedCompletionOptions,
  CompletionContext,
} from "./types";
import { completionPluginKey } from "./types";
import {
  emptyDecorations,
  clearDecorations,
  updateGhostDecoration,
  parseCompletionResult,
} from "./decorations";
import {
  getTextBeforeCursor,
  getTextAfterCursor,
  defaultGetPromptType,
  shouldTriggerCompletion,
} from "./utils";

const LOG_PREFIX = "[prosemirror-completion]";

/**
 * 创建补全插件
 */
function resolveOptions(options: CompletionOptions): ResolvedCompletionOptions {
  const debug = options.debug ?? false;

  const providedLogger = options.logger ?? {};
  const logger: ResolvedCompletionOptions["logger"] = {
    info:
      providedLogger.info ??
      (debug
        ? (...args: unknown[]) => console.info(LOG_PREFIX, ...args)
        : () => {}),
    warn:
      providedLogger.warn ??
      (debug
        ? (...args: unknown[]) => console.warn(LOG_PREFIX, ...args)
        : () => {}),
    error:
      providedLogger.error ??
      ((...args: unknown[]) => console.error(LOG_PREFIX, ...args)),
  };

  const onError =
    options.onError ??
    ((error: unknown, context: CompletionContext) => {
      logger.error("Completion error", error, context);
    });

  return {
    debounceMs: options.debounceMs ?? 300,
    minTriggerLength: options.minTriggerLength ?? 3,
    callCompletion: options.callCompletion,
    getPromptType: options.getPromptType ?? defaultGetPromptType,
    onChange: options.onChange ?? (() => {}),
    onExit: options.onExit ?? (() => {}),
    onApply: options.onApply ?? (() => {}),
    onError,
    fallbackResult: options.fallbackResult ?? null,
    logger,
    ghostClassName: options.ghostClassName ?? "prosemirror-ghost-text",
    showGhost: options.showGhost ?? true,
    debug,
  };
}

export function completion(
  initOptions: CompletionOptions,
): Plugin<CompletionPluginState> {
  const options = resolveOptions(initOptions);
  const debounceMs = options.debounceMs;
  const minTriggerLength = options.minTriggerLength;

  let requestSeq = 0;
  const nextRequestId = () =>
    `pmc-${Date.now().toString(36)}-${(requestSeq += 1)}`;

  const buildContext = (
    view: EditorView,
    pos: number,
    abortController: AbortController,
    requestId: string,
  ): CompletionContext => {
    const $pos = view.state.doc.resolve(pos);
    const parent = $pos.parent;
    const beforeText = getTextBeforeCursor(view.state, pos);
    const afterText = getTextAfterCursor(view.state, pos);
    const metrics = {
      startedAt: Date.now(),
      beforeChars: beforeText.length,
      afterChars: afterText.length,
    };

    const baseContext: CompletionContext = {
      abortController,
      parent,
      pos,
      beforeText,
      afterText,
      promptType: "common",
      state: view.state,
      requestId,
      metrics,
    };

    const promptType =
      options.getPromptType?.(baseContext) ?? defaultGetPromptType(baseContext);

    return {
      ...baseContext,
      promptType,
    };
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
          activeContext: null,
          pendingContext: null,
          lastError: undefined,
        };
      },

      apply(tr, pluginState): CompletionPluginState {
        const action = tr.getMeta(
          "prosemirror-completion",
        ) as CompletionAction | null;

        // 处理 action
        if (action) {
          switch (action.type) {
            case "request-start":
              return {
                ...pluginState,
                isLoading: true,
                abortController: action.controller,
                pendingContext: action.context,
                triggerPos: action.pos,
                activeSuggestion: null,
                lastError: undefined,
              };

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
                activeContext:
                  action.context ?? pluginState.pendingContext ?? null,
                pendingContext: null,
                lastError: undefined,
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
                activeContext: null,
                pendingContext: null,
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
                activeContext: null,
                pendingContext: null,
              };

            case "loading":
              return {
                ...pluginState,
                isLoading: action.isLoading,
              };

            case "error":
              return {
                ...pluginState,
                isLoading: false,
                abortController: null,
                activeSuggestion: null,
                triggerPos: null,
                decorations: clearDecorations({
                  doc: tr.doc,
                } as import("prosemirror-state").EditorState),
                activeContext: null,
                pendingContext: null,
                lastError: action.error,
              };

            case "timer":
              return {
                ...pluginState,
                debounceTimer: action.timer,
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
            timer = null;
          }

          if (lastAbortController) {
            lastAbortController.abort();
            lastAbortController = null;
          }

          timer = setTimeout(async () => {
            const abortController = new AbortController();
            lastAbortController = abortController;
            const requestId = nextRequestId();
            const context = buildContext(view, pos, abortController, requestId);

            options.logger.info("Trigger completion", {
              requestId,
              pos,
              promptType: context.promptType,
            });

            options.onChange(context, view);

            view.dispatch(
              view.state.tr.setMeta("prosemirror-completion", {
                type: "request-start",
                context,
                controller: abortController,
                pos,
              }),
            );

            try {
              const result = await Promise.resolve(
                options.callCompletion(context),
              );

              if (abortController.signal.aborted) {
                options.logger.info("Completion aborted", { requestId, pos });
                return;
              }

              context.metrics.durationMs =
                Date.now() - context.metrics.startedAt;
              context.metrics.resultChars =
                parseCompletionResult(result).length;

              view.dispatch(
                view.state.tr.setMeta("prosemirror-completion", {
                  type: "suggest",
                  result,
                  pos,
                  context,
                }),
              );
            } catch (error) {
              if (abortController.signal.aborted) {
                options.logger.info("Completion aborted", { requestId, pos });
                return;
              }

              options.onError(error, context);
              const message =
                error instanceof Error ? error.message : String(error);

              view.dispatch(
                view.state.tr.setMeta("prosemirror-completion", {
                  type: "error",
                  error: message,
                }),
              );

              if (options.fallbackResult) {
                context.metrics.durationMs =
                  Date.now() - context.metrics.startedAt;
                context.metrics.usedFallback = true;
                context.metrics.resultChars = parseCompletionResult(
                  options.fallbackResult,
                ).length;

                view.dispatch(
                  view.state.tr.setMeta("prosemirror-completion", {
                    type: "suggest",
                    result: options.fallbackResult,
                    pos,
                    context,
                  }),
                );
              }
            } finally {
              view.dispatch(
                view.state.tr.setMeta("prosemirror-completion", {
                  type: "loading",
                  isLoading: false,
                }),
              );
              lastAbortController = null;
              timer = null;
              view.dispatch(
                view.state.tr.setMeta("prosemirror-completion", {
                  type: "timer",
                  timer: null,
                }),
              );
            }
          }, debounceMs);

          view.dispatch(
            view.state.tr.setMeta("prosemirror-completion", {
              type: "timer",
              timer,
            }),
          );
        };
      })();

      // 监听文档和选择变化
      const handleInput = (from: number) => {
        // 检查是否应该触发补全
        if (!shouldTriggerCompletion(view.state, options)) {
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

            if (docChanged || selectionChanged) {
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
