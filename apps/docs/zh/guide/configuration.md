# 配置

## 插件选项

通过以下选项控制补全的触发节奏、展示形式以及回调。

```ts
interface CompletionOptions {
  /** 补全请求的防抖时间，默认 300ms */
  debounceMs?: number;
  /** 触发补全的最小字符数，默认 3 */
  minTriggerLength?: number;
  /** 实际补全函数（必填） */
  callCompletion: (
    context: CompletionContext
  ) => Promise<CompletionResult> | CompletionResult;
  /** 根据上下文推断 prompt 类型 */
  getPromptType?: (context: CompletionContext) => PromptType;
  /** 用户输入变化时回调 */
  onChange?: (context: CompletionContext, view: EditorView) => void;
  /** 取消补全时回调 */
  onExit?: (view: EditorView) => void;
  /** 接受补全时回调 */
  onApply?: (result: CompletionResult, view: EditorView) => void;
  /** Ghost text 的自定义 class，默认 "prosemirror-ghost-text" */
  ghostClassName?: string;
  /** 是否展示 ghost text，默认 true */
  showGhost?: boolean;
}
```

## 补全上下文

`callCompletion` 会收到完整上下文，便于按位置与节点类型定制逻辑：

```ts
interface CompletionContext {
  abortController: AbortController;  // 取消请求
  parent: Node;                      // 光标所在父节点
  pos: number;                       // 文档内绝对位置
  beforeText: string;                // 光标前文本
  afterText: string;                 // 光标后文本
  promptType: PromptType;            // 推断的 prompt 类型
  state: EditorState;                // 当前 EditorState
}
```

## 返回结果

补全函数可以返回以下形态：

```ts
// 纯文本
return "plain text";

// 同时返回纯文本与 HTML
return {
  plain: "plain text",
  html: "<strong>formatted</strong> text"
};

// 仅返回 HTML
return {
  html: "<p>formatted paragraph</p>"
};

// 返回 ProseMirror Node
return { prosemirror: someNode };
```

## 示例配置

### 快速响应

```ts
createCompletionPlugin({
  debounceMs: 100,
  minTriggerLength: 2,
  callCompletion: myCompletionFn,
});
```

### 保守策略

```ts
createCompletionPlugin({
  debounceMs: 800,
  minTriggerLength: 10,
  callCompletion: myCompletionFn,
});
```

### 代码补全

```ts
createCompletionPlugin({
  debounceMs: 500,
  getPromptType: (ctx) => {
    if (ctx.parent.type.name === "code_block") {
      return "code";
    }
    return "common";
  },
  callCompletion: myCompletionFn,
});
```
