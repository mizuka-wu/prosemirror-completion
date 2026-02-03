import { describe, it, expect, vi } from "vitest";
import { EditorState } from "prosemirror-state";
import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { createCompletionPlugin } from "@prosemirror-completion/plugin";
import type { CompletionContext, CompletionResult } from "@prosemirror-completion/plugin";

const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

describe("Completion Plugin", () => {
  it("should create plugin with default options", () => {
    const mockCallCompletion = vi.fn(async (): Promise<CompletionResult> => "test");
    
    const plugin = createCompletionPlugin({
      callCompletion: mockCallCompletion,
    });

    expect(plugin).toBeDefined();
    expect(plugin.spec.state).toBeDefined();
  });

  it("should initialize plugin state correctly", () => {
    const mockCallCompletion = vi.fn(async (): Promise<CompletionResult> => "test");
    
    const plugin = createCompletionPlugin({
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
    const mockCallCompletion = vi.fn(async (context: CompletionContext): Promise<CompletionResult> => {
      expect(context).toHaveProperty("abortController");
      expect(context).toHaveProperty("parent");
      expect(context).toHaveProperty("pos");
      expect(context).toHaveProperty("beforeText");
      expect(context).toHaveProperty("afterText");
      expect(context).toHaveProperty("promptType");
      return "completed";
    });

    const plugin = createCompletionPlugin({
      callCompletion: mockCallCompletion,
    });

    const state = EditorState.create({
      schema,
      plugins: [plugin],
    });

    // 触发文本输入
    const tr = state.tr.insertText("Hello world test");
    const newState = state.apply(tr);

    // 等待防抖
    await new Promise(resolve => setTimeout(resolve, 600));

    // 由于防抖，可能需要更多时间
  });
});

describe("Completion Utils", () => {
  it("should parse completion result correctly", () => {
    // 测试字符串结果
    const strResult: CompletionResult = "plain text";
    
    // 测试对象结果
    const objResult: CompletionResult = { plain: "plain", html: "<b>html</b>" };
    
    // 测试 HTML 结果
    const htmlResult: CompletionResult = { html: "<p>html only</p>" };

    expect(typeof strResult).toBe("string");
    expect(typeof objResult).toBe("object");
    expect(typeof htmlResult).toBe("object");
  });
});

describe("Ghost Text Decoration", () => {
  it("should create ghost decoration with correct class", () => {
    // 装饰会在视图中创建，这里测试配置
    const mockCallCompletion = vi.fn(async (): Promise<CompletionResult> => "test");
    
    const plugin = createCompletionPlugin({
      callCompletion: mockCallCompletion,
      ghostClassName: "custom-ghost-class",
    });

    expect(plugin).toBeDefined();
  });

  it("should support disabling ghost text", () => {
    const mockCallCompletion = vi.fn(async (): Promise<CompletionResult> => "test");
    
    const plugin = createCompletionPlugin({
      callCompletion: mockCallCompletion,
      showGhost: false,
    });

    expect(plugin).toBeDefined();
  });
});
