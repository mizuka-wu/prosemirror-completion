# API Reference - Utils

## Prompt Builders

### buildCommonPrompt

Creates a general-purpose completion prompt.

```typescript
function buildCommonPrompt(context: CompletionContext): string
```

**Example:**

```typescript
import { buildCommonPrompt } from "@prosemirror-completion/plugin";

const prompt = buildCommonPrompt(context);
// Returns:
// Continue the following text naturally and concisely:
//
// [context.beforeText]
//
// Continue:
```

### buildCodePrompt

Creates a code completion prompt.

```typescript
function buildCodePrompt(context: CompletionContext): string
```

**Example:**

```typescript
import { buildCodePrompt } from "@prosemirror-completion/plugin";

const prompt = buildCodePrompt(context);
// Returns code-formatted prompt
```

### buildMarkdownPrompt

Creates a markdown completion prompt.

```typescript
function buildMarkdownPrompt(context: CompletionContext): string
```

### buildPrompt

Generic prompt builder that selects based on type.

```typescript
function buildPrompt(
  context: CompletionContext,
  type?: PromptType
): string
```

**Example:**

```typescript
import { buildPrompt } from "@prosemirror-completion/plugin";

// Uses context.promptType
const prompt = buildPrompt(context);

// Or specify type
const codePrompt = buildPrompt(context, "code");
```

## Language Detection

### detectLanguage

Detects programming language from code context.

```typescript
function detectLanguage(beforeText: string): string
```

**Returns:** `"typescript" | "python" | "html" | "css" | "javascript"`

**Example:**

```typescript
import { detectLanguage } from "@prosemirror-completion/plugin";

const lang = detectLanguage("const x: string = ");
// Returns: "typescript"
```

## Text Utilities

### getTextBeforeCursor

Gets text before cursor position.

```typescript
function getTextBeforeCursor(
  state: EditorState,
  pos: number
): string
```

### getTextAfterCursor

Gets text after cursor position.

```typescript
function getTextAfterCursor(
  state: EditorState,
  pos: number
): string
```

### defaultGetPromptType

Default prompt type detector.

```typescript
function defaultGetPromptType(
  context: CompletionContext
): PromptType
```

Detects based on content patterns:
- Code: Function definitions, imports, etc.
- Markdown: Headers, lists, formatting
- Common: Default fallback

## Debounce

### debounce

Creates a debounced function.

```typescript
function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void
```

**Example:**

```typescript
import { debounce } from "@prosemirror-completion/plugin";

const debouncedFn = debounce((text: string) => {
  console.log(text);
}, 300);

debouncedFn("a");  // Will not log yet
debouncedFn("ab"); // Resets timer
debouncedFn("abc"); // Resets timer, logs after 300ms
```
