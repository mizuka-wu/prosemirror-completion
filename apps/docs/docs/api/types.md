# API Reference - Types

## PromptType

Type of prompt for completion context.

```typescript
type PromptType = "common" | "code" | "markdown" | string;
```

### Built-in Types

- `"common"`: General text completion
- `"code"`: Code completion
- `"markdown"`: Markdown document completion

### Custom Types

You can define your own prompt types:

```typescript
type MyPromptType = "javascript" | "python" | "sql" | PromptType;
```

## CompletionPluginState

Internal state of the completion plugin.

```typescript
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

### Properties

- `activeSuggestion`: Current completion suggestion
- `triggerPos`: Position where completion was triggered
- `isLoading`: Whether a completion request is in progress
- `abortController`: Controller for cancelling requests
- `decorations`: ProseMirror decorations for ghost text
- `debounceTimer`: Timer for debounced completion
- `options`: Plugin configuration options

## CompletionAction

Actions dispatched to the plugin state.

```typescript
type CompletionAction =
  | { type: "start"; pos: number }
  | { type: "suggest"; result: CompletionResult; pos: number }
  | { type: "apply" }
  | { type: "cancel" }
  | { type: "loading"; isLoading: boolean };
```

### Action Types

- `start`: Begin completion at position
- `suggest`: Set completion suggestion
- `apply`: Accept current suggestion
- `cancel`: Cancel current suggestion
- `loading`: Set loading state

## Plugin Key

Access plugin state from editor state.

```typescript
import { completionPluginKey } from "@prosemirror-completion/plugin";

const pluginState = completionPluginKey.getState(editorState);
```

## Utility Types

### EditorState

```typescript
import type { EditorState } from "prosemirror-state";
```

### EditorView

```typescript
import type { EditorView } from "prosemirror-view";
```

### Node

```typescript
import type { Node } from "prosemirror-model";
```
