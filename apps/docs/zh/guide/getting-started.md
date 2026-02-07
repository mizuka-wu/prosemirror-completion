# 快速开始

## 安装

```bash
npm install @prosemirror-completion/plugin
# 或
yarn add @prosemirror-completion/plugin
# 或
pnpm add @prosemirror-completion/plugin
```

## 基础用法

```ts
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  completion,
  approveCompletion,
  exitCompletion,
} from "@prosemirror-completion/plugin";

// 创建补全插件
const completionPlugin = completion({
  debounceMs: 300,
  minTriggerLength: 3,
  callCompletion: async (context) => {
    // 简单示例补全
    return ` completion for: ${context.beforeText.slice(-20)}`;
  },
});

// 绑定 Tab/Esc 到命令
const completionKeymap = keymap({
  Tab: approveCompletion,
  Escape: exitCompletion,
});

// 创建 EditorState
const state = EditorState.create({
  schema,
  plugins: [completionPlugin, completionKeymap, ...exampleSetup({ schema })],
});

// 创建 EditorView
const view = new EditorView(document.querySelector("#editor"), {
  state,
});
```

## 运行逻辑

1. **输入即触发**：当输入字符数大于 `minTriggerLength` 时触发防抖请求。
2. **幽灵文本展示**：建议以灰色文本显示在光标之后。
3. **接受或取消**：按 `Tab` 接受，`Esc` 或点击空白处取消。

## 样式

```css
.prosemirror-ghost-text {
  color: #999;
  opacity: 0.6;
  pointer-events: none;
}
```

## 下一步

- 查看 [配置项说明](/zh/guide/configuration)
- 尝试 [WebLLM 集成](/zh/guide/webllm)
