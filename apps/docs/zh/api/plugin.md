# API 参考 - 插件

## completion

创建补全插件实例。

```ts
function completion(
  options: CompletionOptions
): Plugin<CompletionPluginState>
```

### 参数

|属性|类型|默认值|说明|
|----|----|------|----|
|`debounceMs`|`number`|`300`|触发补全前的防抖时间|
|`minTriggerLength`|`number`|`3`|触发所需的最小字符数|
|`callCompletion`|`function`|必填|实际补全函数|
|`getPromptType`|`function`|-|根据上下文判断提示类型|
|`onChange`|`function`|-|用户输入变化时的回调|
|`onExit`|`function`|-|取消补全时的回调|
|`onApply`|`function`|-|接受补全时的回调|
|`ghostClassName`|`string`|`"prosemirror-ghost-text"`|Ghost text 的自定义类名|
|`showGhost`|`boolean`|`true`|是否展示 ghost text|

### 示例

```ts
import { completion } from "@prosemirror-completion/plugin";

const plugin = completion({
  debounceMs: 500,
  callCompletion: async () => "suggested completion",
});
```

## CompletionContext

传入 `callCompletion` 的上下文对象：

```ts
interface CompletionContext {
  abortController: AbortController;
  parent: Node;
  pos: number;
  beforeText: string;
  afterText: string;
  promptType: PromptType;
  state: EditorState;
}
```

### 字段说明

- `abortController`：用于取消请求
- `parent`：光标所在父节点
- `pos`：文档内绝对位置
- `beforeText`：光标前的文本
- `afterText`：光标后的文本
- `promptType`：推断出的提示类型（common、code、markdown）
- `state`：当前 `EditorState`

## CompletionResult

`callCompletion` 的返回类型：

```ts
type CompletionResult =
  | string
  | { plain: string; html?: string }
  | { html: string }
  | { prosemirror: Node };
```

### 返回纯文本

```ts
return "plain text completion";
```

### 同时返回纯文本和 HTML

```ts
return {
  plain: "plain text",
  html: "<strong>formatted</strong> text",
};
```

### 仅返回 HTML

```ts
return {
  html: "<p>formatted paragraph</p>",
};
```

### 返回 ProseMirror Node

```ts
import { schema } from "prosemirror-schema-basic";

const paragraph = schema.nodes.paragraph.create(
  null,
  schema.text("Bold text", [schema.marks.strong.create()])
);

return { prosemirror: paragraph };
```

也可配合 `prosemirror-markdown`：

```ts
import { defaultMarkdownParser } from "prosemirror-markdown";

const markdown = "**Bold** and *italic* text";
const node = defaultMarkdownParser.parse(markdown);

return { prosemirror: node };
```

## Commands

### insertCompletion

```ts
function insertCompletion(
  state: EditorState,
  result: CompletionResult
): Transaction
```

在光标位置插入补全文本。

### cancelCompletion

```ts
function cancelCompletion(state: EditorState): Transaction
```

取消当前补全。

### hasActiveCompletion

```ts
function hasActiveCompletion(state: EditorState): boolean
```

若存在活动补全则返回 `true`。

### getActiveSuggestion

```ts
function getActiveSuggestion(
  state: EditorState
): CompletionResult | null
```

返回当前建议内容。
