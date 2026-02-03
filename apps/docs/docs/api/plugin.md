# API Reference - Plugin

## createCompletionPlugin

Creates the completion plugin instance.

```typescript
function createCompletionPlugin(
  options: CompletionOptions
): Plugin<CompletionPluginState>
```

### Parameters

#### `CompletionOptions`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `debounceMs` | `number` | `300` | Delay before triggering completion |
| `minTriggerLength` | `number` | `3` | Minimum characters to trigger |
| `callCompletion` | `function` | required | Completion function |
| `getPromptType` | `function` | - | Detect prompt type from context |
| `onChange` | `function` | - | Callback when typing |
| `onExit` | `function` | - | Callback when completion cancelled |
| `onApply` | `function` | - | Callback when completion applied |
| `ghostClassName` | `string` | `"prosemirror-ghost-text"` | CSS class for ghost text |
| `showGhost` | `boolean` | `true` | Whether to show ghost text |

### Example

```typescript
import { createCompletionPlugin } from "@prosemirror-completion/plugin";

const plugin = createCompletionPlugin({
  debounceMs: 500,
  callCompletion: async (context) => {
    return "suggested completion";
  },
});
```

## CompletionContext

Context object passed to `callCompletion`.

```typescript
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

### Properties

- `abortController`: Use to cancel requests
- `parent`: Parent node at cursor position
- `pos`: Absolute cursor position in document
- `beforeText`: Text before cursor in current node
- `afterText`: Text after cursor in current node
- `promptType`: Detected type (common, code, markdown)
- `state`: Current editor state

## CompletionResult

Return type of `callCompletion`.

```typescript
type CompletionResult =
  | string
  | { plain: string; html?: string }
  | { html: string };
```

### String Result

```typescript
return "plain text completion";
```

### Object with Plain and HTML

```typescript
return {
  plain: "plain text",
  html: "<strong>formatted</strong> text"
};
```

### HTML Only

```typescript
return {
  html: "<p>formatted paragraph</p>"
};
```

## Commands

### insertCompletion

```typescript
function insertCompletion(
  state: EditorState,
  result: CompletionResult
): Transaction
```

Inserts completion text at cursor position.

### cancelCompletion

```typescript
function cancelCompletion(state: EditorState): Transaction
```

Cancels the active completion.

### hasActiveCompletion

```typescript
function hasActiveCompletion(state: EditorState): boolean
```

Returns `true` if there's an active completion suggestion.

### getActiveSuggestion

```typescript
function getActiveSuggestion(
  state: EditorState
): CompletionResult | null
```

Returns the current completion suggestion.
