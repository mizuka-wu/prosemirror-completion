# API 参考 - 工具

## Prompt Builder

### buildCommonPrompt

生成通用文本补全提示：

```ts
function buildCommonPrompt(context: CompletionContext): string
```

```ts
import { buildCommonPrompt } from "@prosemirror-completion/plugin";

const prompt = buildCommonPrompt(context);
// Continue the following text naturally and concisely:
// ...
// Continue:
```

### buildCodePrompt

生成代码补全提示：

```ts
function buildCodePrompt(context: CompletionContext): string
```

### buildMarkdownPrompt

```ts
function buildMarkdownPrompt(context: CompletionContext): string
```

### buildPrompt

根据 `context.promptType` 自动选择合适提示：

```ts
function buildPrompt(
  context: CompletionContext,
  type?: PromptType
): string
```

## 语言检测

### detectLanguage

根据上下文推断编程语言：

```ts
function detectLanguage(beforeText: string): string
```

返回值示例：`"typescript" | "python" | "html" | "css" | "javascript"`。

## 文本工具

```ts
function getTextBeforeCursor(state: EditorState, pos: number): string
function getTextAfterCursor(state: EditorState, pos: number): string
```

## 默认 Prompt 类型推断

```ts
function defaultGetPromptType(
  context: CompletionContext
): PromptType
```

- 检测函数定义、import 等 => `code`
- 检测 Markdown 语法 => `markdown`
- 其他情况 => `common`

## 防抖工具

```ts
function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void
```

```ts
const debouncedFn = debounce((text: string) => {
  console.log(text);
}, 300);

debouncedFn("a");   // 未输出
debouncedFn("ab");  // 重置计时
debouncedFn("abc"); // 300ms 后输出
```
