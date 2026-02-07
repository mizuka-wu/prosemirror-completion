import type { Node } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";
import type { EditorView, DecorationSet } from "prosemirror-view";
import { PluginKey } from "prosemirror-state";

/**
 * 补全返回结果格式
 */
export type CompletionResult =
  | string
  | { plain: string; html?: string }
  | { html: string }
  | { prosemirror: Node };

/**
 * Prompt 类型建议
 */
export type PromptType = "common" | "code" | "markdown" | string;

/**
 * 补全上下文
 */
export interface CompletionMetrics {
  /** 请求开始时间戳（ms） */
  startedAt: number;
  /** 光标前文本长度 */
  beforeChars: number;
  /** 光标后文本长度 */
  afterChars: number;
  /** 请求耗时（ms） */
  durationMs?: number;
  /** 结果文本长度 */
  resultChars?: number;
  /** 是否使用 fallback 结果 */
  usedFallback?: boolean;
}

export interface CompletionContext {
  /** 用于取消请求的 AbortController */
  abortController: AbortController;
  /** 当前位置的父节点 */
  parent: Node;
  /** 当前位置 */
  pos: number;
  /** 光标前的文本 */
  beforeText: string;
  /** 光标后的文本 */
  afterText: string;
  /** 建议的 prompt 类型 */
  promptType: PromptType;
  /** 编辑器状态 */
  state: EditorState;
  /** 请求链路 ID */
  requestId: string;
  /** 生命周期指标 */
  metrics: CompletionMetrics;
}

/**
 * 补全插件配置选项
 */
export interface CompletionOptions {
  /**
   * 防抖时间（毫秒）
   * @default 300
   */
  debounceMs?: number;

  /**
   * 触发补全的最小字符数
   * @default 3
   */
  minTriggerLength?: number;

  /**
   * 补全函数 - 接收上下文，返回补全结果
   */
  callCompletion: (
    context: CompletionContext,
  ) => Promise<CompletionResult> | CompletionResult;

  /**
   * 确定当前上下文适合的 prompt 类型
   */
  getPromptType?: (context: CompletionContext) => PromptType;

  /**
   * 用户打字时的回调
   */
  onChange?: (context: CompletionContext, view: EditorView) => void;

  /**
   * 补全出错时的回调
   */
  onError?: (error: unknown, context: CompletionContext) => void;

  /**
   * 当补全失败时的降级结果
   */
  fallbackResult?: CompletionResult | null;

  /**
   * 自定义日志输出
   */
  logger?: CompletionLogger;

  /**
   * 自定义 ghost text 的 CSS 类名
   * @default "prosemirror-ghost-text"
   */
  ghostClassName?: string;

  /**
   * 是否显示 ghost text
   * @default true
   */
  showGhost?: boolean;

  /**
   * 调试模式，开启后会在控制台输出关键日志
   * @default false
   */
  debug?: boolean;
}

export interface ResolvedCompletionOptions extends Required<
  Omit<CompletionOptions, "fallbackResult" | "logger">
> {
  fallbackResult: CompletionResult | null;
  logger: Required<CompletionLogger>;
}

export interface CompletionLogger {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

export interface PromptOptions {
  type?: PromptType;
  lang?: string;
}

/**
 * 内部插件状态
 */
export interface CompletionPluginState {
  /** 当前激活的补全建议 */
  activeSuggestion: CompletionResult | null;
  /** 补全触发位置 */
  triggerPos: number | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 当前 AbortController */
  abortController: AbortController | null;
  /** DecorationSet */
  decorations: DecorationSet;
  /** 防抖计时器 */
  debounceTimer: ReturnType<typeof setTimeout> | null;
  /** 插件配置 */
  options: ResolvedCompletionOptions;
  /** 当前激活的上下文 */
  activeContext: CompletionContext | null;
  /** 等待中的上下文 */
  pendingContext: CompletionContext | null;
  /** 最近一次错误信息 */
  lastError?: string;
}

/**
 * Transaction meta key
 */
export const completionMetaKey = "prosemirror-completion";

/**
 * 插件 Key
 */
export const completionPluginKey = new PluginKey<CompletionPluginState>(
  "prosemirror-completion",
);

/**
 * Action 类型
 */
export type CompletionAction =
  | {
      type: "request-start";
      context: CompletionContext;
      controller: AbortController;
      pos: number;
    }
  | {
      type: "suggest";
      result: CompletionResult;
      pos: number;
      context?: CompletionContext;
    }
  | { type: "apply" }
  | { type: "cancel"; reason?: string; error?: string }
  | { type: "loading"; isLoading: boolean }
  | { type: "error"; error: string }
  | { type: "timer"; timer: ReturnType<typeof setTimeout> | null };
