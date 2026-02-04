# API 参考 - 类型

## PromptType

用于描述补全上下文的提示类型。

```ts
type PromptType = "common" | "code" | "markdown" | string;
```

### 内置类型

- `"common"`：普通文本
- `"code"`：代码片段
- `"markdown"`：Markdown 内容

### 自定义类型

你可以扩展自己的提示类型：

```ts
type MyPromptType = "javascript" | "python" | "sql" | PromptType;
```

## CompletionPluginState

插件内部状态结构：

```ts
interface CompletionPluginState {
  activeSuggestion: CompletionResult | null;
  triggerPos: number | null;
  isLoading: boolean;
  abortController: AbortController | null;
  decorations: DecorationSet;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  options: CompletionOptions;
}
```

字段说明：

- `activeSuggestion`：当前建议内容
- `triggerPos`：触发补全的位置
- `isLoading`：是否正在请求补全
- `abortController`：用于取消请求
- `decorations`：用于渲染 ghost text 的装饰
- `debounceTimer`：防抖计时器
- `options`：插件配置

## CompletionAction

插件内部的状态变更动作：

```ts
type CompletionAction =
  | { type: "start"; pos: number }
  | { type: "suggest"; result: CompletionResult; pos: number }
  | { type: "apply" }
  | { type: "cancel" }
  | { type: "loading"; isLoading: boolean };
```

- `start`：开始补全
- `suggest`：设置新的建议
- `apply`：接受建议
- `cancel`：取消建议
- `loading`：更新加载状态

## 插件 Key

从 `EditorState` 中读取插件状态：

```ts
import { completionPluginKey } from "@prosemirror-completion/plugin";

const pluginState = completionPluginKey.getState(editorState);
```

## 常用类型引用

```ts
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Node } from "prosemirror-model";
```
