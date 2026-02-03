import type { EditorState } from "prosemirror-state";
import type {
  CompletionContext,
  CompletionOptions,
  PromptType,
} from "./types";

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
      beforeText.slice(-50)
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
  options: CompletionOptions
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
  ms: number
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
