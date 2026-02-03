# Configuration

## Plugin Options

```typescript
interface CompletionOptions {
  /**
   * Debounce time in milliseconds
   * @default 300
   */
  debounceMs?: number;

  /**
   * Minimum characters to trigger completion
   * @default 3
   */
  minTriggerLength?: number;

  /**
   * The completion function
   */
  callCompletion: (
    context: CompletionContext
  ) => Promise<CompletionResult> | CompletionResult;

  /**
   * Determine prompt type based on context
   */
  getPromptType?: (context: CompletionContext) => PromptType;

  /**
   * Called when user types
   */
  onChange?: (context: CompletionContext, view: EditorView) => void;

  /**
   * Called when completion is cancelled
   */
  onExit?: (view: EditorView) => void;

  /**
   * Called when completion is applied
   */
  onApply?: (result: CompletionResult, view: EditorView) => void;

  /**
   * Custom CSS class for ghost text
   * @default "prosemirror-ghost-text"
   */
  ghostClassName?: string;

  /**
   * Whether to show ghost text
   * @default true
   */
  showGhost?: boolean;
}
```

## Completion Context

The `callCompletion` function receives a context object:

```typescript
interface CompletionContext {
  abortController: AbortController;  // For cancelling requests
  parent: Node;                      // Parent node at cursor position
  pos: number;                       // Cursor position
  beforeText: string;                // Text before cursor
  afterText: string;                 // Text after cursor
  promptType: PromptType;            // Detected prompt type
  state: EditorState;                // Current editor state
}
```

## Completion Result

The completion function can return:

```typescript
// Simple string
type CompletionResult = "plain text";

// With HTML formatting
type CompletionResult = {
  plain: "plain text";
  html: "<strong>formatted</strong> text";
};

// HTML only
type CompletionResult = {
  html: "<p>formatted content</p>";
};
```

## Example Configurations

### Fast Typing

```typescript
createCompletionPlugin({
  debounceMs: 100,  // Quick response
  minTriggerLength: 2,
  callCompletion: myCompletionFn,
});
```

### Conservative

```typescript
createCompletionPlugin({
  debounceMs: 800,  // Wait for user to pause
  minTriggerLength: 10,  // More context needed
  callCompletion: myCompletionFn,
});
```

### Code Completion

```typescript
createCompletionPlugin({
  debounceMs: 500,
  getPromptType: (ctx) => {
    // Detect if in code block
    if (ctx.parent.type.name === "code_block") {
      return "code";
    }
    return "common";
  },
  callCompletion: myCompletionFn,
});
```
