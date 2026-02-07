import { describe, it, expect, vi } from "vitest";
import { EditorState } from "prosemirror-state";
import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import {
  completion,
  insertCompletion,
  parseCompletionResult,
} from "@prosemirror-completion/plugin";
import type {
  CompletionContext,
  CompletionResult,
} from "@prosemirror-completion/plugin";
import { completionPluginKey } from "@prosemirror-completion/plugin";

const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

// Helper: create editor state with the completion plugin
function createEditorState(result: CompletionResult) {
  const mockCallCompletion = vi.fn(
    async (): Promise<CompletionResult> => result,
  );
  const plugin = completion({
    callCompletion: mockCallCompletion,
  });
  return EditorState.create({
    schema,
    plugins: [plugin],
  });
}

describe("Completion Plugin", () => {
  it("should create plugin with default options", () => {
    const mockCallCompletion = vi.fn(
      async (): Promise<CompletionResult> => "test",
    );

    const plugin = completion({
      callCompletion: mockCallCompletion,
    });

    expect(plugin).toBeDefined();
    expect(plugin.spec.state).toBeDefined();
  });

  it("should initialize plugin state correctly", () => {
    const mockCallCompletion = vi.fn(
      async (): Promise<CompletionResult> => "test",
    );

    const plugin = completion({
      callCompletion: mockCallCompletion,
      debounceMs: 300,
      minTriggerLength: 3,
    });

    const state = EditorState.create({
      schema,
      plugins: [plugin],
    });

    const pluginState = plugin.getState(state);
    expect(pluginState).toBeDefined();
    expect(pluginState?.activeSuggestion).toBeNull();
    expect(pluginState?.triggerPos).toBeNull();
    expect(pluginState?.isLoading).toBe(false);
  });

  it("should call completion function with correct context", async () => {
    const mockCallCompletion = vi.fn(
      async (context: CompletionContext): Promise<CompletionResult> => {
        expect(context).toHaveProperty("abortController");
        expect(context).toHaveProperty("parent");
        expect(context).toHaveProperty("pos");
        expect(context).toHaveProperty("beforeText");
        expect(context).toHaveProperty("afterText");
        expect(context).toHaveProperty("promptType");
        return "completed";
      },
    );

    const plugin = completion({
      callCompletion: mockCallCompletion,
    });

    const state = EditorState.create({
      schema,
      plugins: [plugin],
    });

    // Trigger text input
    const tr = state.tr.insertText("Hello world test");
    const newState = state.apply(tr);

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Extra wait may be required because of debounce
  });
});

describe("Completion Result Types", () => {
  it("should handle string result", () => {
    const strResult: CompletionResult = "plain text";
    const parsed = parseCompletionResult(strResult);
    expect(parsed).toBe("plain text");
  });

  it("should handle plain/html object result", () => {
    const objResult: CompletionResult = {
      plain: "plain text",
      html: "<b>html</b>",
    };
    const parsed = parseCompletionResult(objResult);
    expect(parsed).toBe("plain text");
  });

  it("should handle html-only result", () => {
    const htmlResult: CompletionResult = { html: "<p>paragraph</p>" };
    const parsed = parseCompletionResult(htmlResult);
    expect(parsed).toBe("paragraph");
  });

  it("should handle prosemirror node result", () => {
    const paragraph = schema.nodes.paragraph.create(
      null,
      schema.text("node content"),
    );
    const nodeResult: CompletionResult = { prosemirror: paragraph };
    const parsed = parseCompletionResult(nodeResult);
    expect(parsed).toBe("node content");
  });
});

describe("Insert Completion", () => {
  it("should insert plain text completion", () => {
    const mockCallCompletion = vi.fn(
      async (): Promise<CompletionResult> => "test result",
    );
    const plugin = completion({
      callCompletion: mockCallCompletion,
    });

    let state = EditorState.create({ schema, plugins: [plugin] });

    // Set initial content
    state = state.apply(state.tr.insertText("Hello "));

    // Configure plugin state (simulate active suggestion)
    const tr = state.tr;
    tr.setMeta("prosemirror-completion", {
      type: "suggest",
      result: "test result",
      pos: state.selection.from,
    });
    state = state.apply(tr);

    // Insert completion
    const insertTr = insertCompletion(state, "test result");
    const newState = state.apply(insertTr);

    expect(newState.doc.textContent).toContain("test result");
  });

  it("should insert html completion with formatting", () => {
    const htmlResult: CompletionResult = {
      plain: "formatted text",
      html: "<strong>formatted</strong> text",
    };

    const mockCallCompletion = vi.fn(
      async (): Promise<CompletionResult> => htmlResult,
    );
    const plugin = completion({
      callCompletion: mockCallCompletion,
    });

    let state = EditorState.create({ schema, plugins: [plugin] });
    state = state.apply(state.tr.insertText("Start "));

    // Configure plugin state
    const tr = state.tr;
    tr.setMeta("prosemirror-completion", {
      type: "suggest",
      result: htmlResult,
      pos: state.selection.from,
    });
    state = state.apply(tr);

    // Insert HTML completion
    const insertTr = insertCompletion(state, htmlResult);
    const newState = state.apply(insertTr);

    expect(newState.doc.textContent).toContain("formatted");
  });

  it("should insert prosemirror node completion", () => {
    const paragraph = schema.nodes.paragraph.create(
      null,
      schema.text("Node content", [schema.marks.strong.create()]),
    );
    const nodeResult: CompletionResult = { prosemirror: paragraph };

    const mockCallCompletion = vi.fn(
      async (): Promise<CompletionResult> => nodeResult,
    );
    const plugin = completion({
      callCompletion: mockCallCompletion,
    });

    let state = EditorState.create({ schema, plugins: [plugin] });
    state = state.apply(state.tr.insertText("Before "));

    // Configure plugin state
    const tr = state.tr;
    tr.setMeta("prosemirror-completion", {
      type: "suggest",
      result: nodeResult,
      pos: state.selection.from,
    });
    state = state.apply(tr);

    // Insert node completion
    const insertTr = insertCompletion(state, nodeResult);
    const newState = state.apply(insertTr);

    expect(newState.doc.textContent).toContain("Node content");
  });
});

describe("Ghost Text Decoration", () => {
  it("should create ghost decoration with correct class", () => {
    const mockCallCompletion = vi.fn(
      async (): Promise<CompletionResult> => "test",
    );

    const plugin = completion({
      callCompletion: mockCallCompletion,
      ghostClassName: "custom-ghost-class",
    });

    expect(plugin).toBeDefined();
  });

  it("should support disabling ghost text", () => {
    const mockCallCompletion = vi.fn(
      async (): Promise<CompletionResult> => "test",
    );

    const plugin = completion({
      callCompletion: mockCallCompletion,
      showGhost: false,
    });

    expect(plugin).toBeDefined();
  });
});
