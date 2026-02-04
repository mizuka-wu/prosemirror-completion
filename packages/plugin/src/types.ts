import type { Node } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";
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
   * 补全退出时的回调（按 Esc 或点击别处）
   */
  onExit?: (view: EditorView) => void;

  /**
   * 补全应用时的回调（按 Tab）
   */
  onApply?: (result: CompletionResult, view: EditorView) => void;

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

export interface ResolvedCompletionOptions extends Required<CompletionOptions> {}

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
  options: CompletionOptions;
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
  | { type: "start"; pos: number }
  | { type: "suggest"; result: CompletionResult; pos: number }
  | { type: "apply" }
  | { type: "cancel" }
  | { type: "loading"; isLoading: boolean };
