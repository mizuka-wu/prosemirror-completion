<template>
  <ClientOnly>
    <section class="completion-examples">
      <header class="completion-examples__header">
        <p class="completion-examples__eyebrow">{{ localeText.eyebrow }}</p>
        <h2>{{ localeText.title }}</h2>
        <p class="completion-examples__description">{{ localeText.subtitle }}</p>
      </header>

      <div class="completion-examples__tabs" role="tablist">
        <button v-for="example in examples" :key="example.id" class="completion-examples__tab"
          :class="{ 'is-active': example.id === activeExampleId }" type="button" role="tab"
          :aria-selected="example.id === activeExampleId" @click="() => switchExample(example.id)">
          {{ pick(example.title) }}
        </button>
      </div>

      <div class="completion-examples__panel">
        <div class="completion-examples__panel-header">
          <div>
            <h3>{{ pick(activeExample.title) }}</h3>
            <p>{{ pick(activeExample.description) }}</p>
          </div>
          <ul class="completion-examples__badges">
            <li v-for="badge in activeExample.badges" :key="badge">{{ badge }}</li>
          </ul>
        </div>

        <div class="completion-examples__layout">
          <div class="completion-examples__editor-card">
            <div class="completion-examples__status">
              <span>{{ localeText.status }}:</span>
              <strong>{{ statusText }}</strong>
            </div>
            <div class="completion-examples__editor" ref="editorContainer"></div>
            <p class="completion-examples__hint" v-html="localeText.hint"></p>

            <div v-if="shouldShowPromptPreview" class="completion-examples__prompt">
              <div class="completion-examples__prompt-header">
                <strong>{{ localeText.promptPreview }}</strong>
                <button type="button" class="completion-examples__prompt-copy" @click="copyPrompt">
                  {{ promptCopyStatus === "copied" ? localeText.copied : localeText.copy }}
                </button>
              </div>
              <pre><code>{{ promptPreview }}</code></pre>
            </div>

            <div v-if="activeExample.extraPanel === 'promptTemplate'" class="completion-examples__template">
              <label for="prompt-template">{{ localeText.templateLabel }}</label>
              <textarea id="prompt-template" v-model="promptTemplate" rows="6" spellcheck="false"></textarea>
              <p class="completion-examples__template-note">
                {{ localeText.templateHint }}
                <code v-for="token in templateTokens" :key="token">{{ formatPlaceholder(token) }}</code>
              </p>
            </div>
          </div>

          <div class="completion-examples__code-card">
            <div class="completion-examples__code-header">
              <div>
                <strong>{{ localeText.codeTitle }}</strong>
                <p>{{ localeText.codeDescription }}</p>
              </div>
              <button type="button" class="completion-examples__copy" @click="copyCode">
                {{ copyStatus === "copied" ? localeText.copied : localeText.copy }}
              </button>
            </div>
            <pre class="language-ts"><code>{{ activeExample.code }}</code></pre>
          </div>
        </div>
      </div>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import { defaultMarkdownParser } from "prosemirror-markdown";
import {
  buildPrompt,
  completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionOptions,
} from "@prosemirror-completion/plugin";
import { useData } from "vitepress";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-example-setup/style/style.css";

interface LocaleCopy {
  en: string;
  zh: string;
}

interface ExampleHelpers {
  setPromptPreview?: (value: string) => void;
  getPromptTemplate?: () => string;
}

interface ExampleDefinition {
  id: string;
  title: LocaleCopy;
  description: LocaleCopy;
  badges: string[];
  code: string;
  showPromptPreview?: boolean;
  extraPanel?: "promptTemplate";
  showGhost?: boolean;
  createOptions: (helpers: ExampleHelpers) => CompletionOptions;
}

const { lang } = useData();
const isClient = typeof window !== "undefined";
const editorContainer = ref<HTMLDivElement | null>(null);
let view: EditorView | null = null;

const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

const templateTokens = ["beforeText", "afterText", "promptType"];
const defaultTemplate = `You are a tone-aware assistant.
Continue the draft using the same language.
Context: {{beforeText}}
Tone hint: {{promptType}}
Next:`;

const promptTemplate = ref(defaultTemplate);
const promptPreview = ref("");
const promptCopyStatus = ref<"idle" | "copied">("idle");
const copyStatus = ref<"idle" | "copied">("idle");

const messages = {
  en: {
    eyebrow: "Playground",
    title: "Completion Plugin Examples",
    subtitle:
      "Each scenario wires the plugin differently. Switch tabs to experiment with live editors and inspect their source.",
    hint: "Type at least <strong>3 characters</strong>. <kbd>Tab</kbd> accepts · <kbd>Esc</kbd> cancels.",
    status: "Status",
    ready: "Waiting for your input",
    generating: "Generating suggestion…",
    inserted: "Completion inserted",
    dismissed: "Completion dismissed",
    codeTitle: "Source code",
    codeDescription: "Exact snippet powering this mode.",
    copy: "Copy",
    copied: "Copied!",
    promptPreview: "Prompt preview",
    templateLabel: "Prompt template (use {{placeholder}} syntax)",
    templateHint: "Available placeholders:",
  },
  zh: {
    eyebrow: "交互示例",
    title: "Completion 插件示例合集",
    subtitle: "每个标签都是不同的集成方式，可一边体验一边查看源码。",
    hint: "输入至少 <strong>3 个字符</strong>。<kbd>Tab</kbd> 接受 · <kbd>Esc</kbd> 取消。",
    status: "状态",
    ready: "等待输入",
    generating: "正在生成…",
    inserted: "补全已插入",
    dismissed: "补全已取消",
    codeTitle: "示例源码",
    codeDescription: "此模式对应的实现。",
    copy: "复制",
    copied: "已复制!",
    promptPreview: "当前 Prompt",
    templateLabel: "Prompt 模板（支持 {{placeholder}}）",
    templateHint: "可用占位符：",
  },
};

const localeText = computed(() =>
  lang.value && lang.value.startsWith("zh") ? messages.zh : messages.en,
);

const statusText = ref(localeText.value.ready);
watch(localeText, () => {
  statusText.value = localeText.value.ready;
});

const examples = getExamples();
const activeExampleId = ref(examples[0]?.id ?? "default");
const activeExample = computed<ExampleDefinition>(() => {
  return examples.find((example) => example.id === activeExampleId.value) ?? examples[0];
});

const shouldShowPromptPreview = computed(
  () => activeExample.value.showPromptPreview && promptPreview.value.length > 0,
);

function pick(copy: LocaleCopy): string {
  return lang.value && lang.value.startsWith("zh") ? copy.zh : copy.en;
}

function formatPlaceholder(token: string): string {
  return `{{${token}}}`;
}

async function copyCode() {
  if (!isClient) return;
  await navigator.clipboard.writeText(activeExample.value.code);
  copyStatus.value = "copied";
  setTimeout(() => {
    copyStatus.value = "idle";
  }, 1500);
}

async function copyPrompt() {
  if (!isClient || !promptPreview.value) return;
  await navigator.clipboard.writeText(promptPreview.value);
  promptCopyStatus.value = "copied";
  setTimeout(() => {
    promptCopyStatus.value = "idle";
  }, 1500);
}

function switchExample(id: string) {
  if (activeExampleId.value === id) return;
  activeExampleId.value = id;
  promptPreview.value = "";
  promptCopyStatus.value = "idle";
  copyStatus.value = "idle";
}

function createEditor(example: ExampleDefinition) {
  const mount = editorContainer.value;
  if (!mount || !isClient) return;

  if (view) {
    view.destroy();
    view = null;
  }

  const helpers: ExampleHelpers = {};
  if (example.showPromptPreview) {
    helpers.setPromptPreview = (value: string) => {
      promptPreview.value = value;
      promptCopyStatus.value = "idle";
    };
  }
  if (example.extraPanel === "promptTemplate") {
    helpers.getPromptTemplate = () => promptTemplate.value;
  }

  const scenarioOptions = example.createOptions(helpers);
  const { onChange, ...restOptions } = scenarioOptions;

  const plugin = completion({
    ...restOptions,
    debounceMs: restOptions.debounceMs ?? 400,
    minTriggerLength: restOptions.minTriggerLength ?? 3,
    showGhost: example.showGhost ?? restOptions.showGhost ?? true,
    ghostClassName: restOptions.ghostClassName ?? "completion-examples__ghost",
    onChange: (context, editorView) => {
      statusText.value = localeText.value.generating;
      onChange?.(context, editorView);
    },
  });

  const state = EditorState.create({
    schema,
    plugins: [...exampleSetup({ schema, menuBar: false }), plugin],
  });

  mount.textContent = "";
  view = new EditorView(mount, { state });
}

watch(
  [() => editorContainer.value, activeExampleId, () => localeText.value],
  () => {
    if (!editorContainer.value || !isClient) return;
    statusText.value = localeText.value.ready;
    createEditor(activeExample.value);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (view) {
    view.destroy();
    view = null;
  }
});

function getExamples(): ExampleDefinition[] {
  return [
    {
      id: "default",
      title: { en: "Default prompt builder", zh: "默认 Prompt 构建" },
      description: {
        en: "Leverage buildPrompt so common / markdown / code styles auto-switch based on context.",
        zh: "借助 buildPrompt 根据上下文自动切换英文、Markdown、代码风格。",
      },
      badges: ["buildPrompt", "auto-type"],
      showPromptPreview: true,
      code: String.raw`import { buildPrompt, completion } from "@prosemirror-completion/plugin";

const plugin = completion({
  callCompletion: async (context) => {
    const prompt = buildPrompt(context);
    return pseudoLLM(prompt);
  },
});`,
      createOptions: ({ setPromptPreview }) => ({
        debounceMs: 450,
        callCompletion: async (context: CompletionContext): Promise<CompletionResult> => {
          const prompt = buildPrompt(context);
          setPromptPreview?.(prompt);
          return pseudoLLM(prompt, context);
        },
      }),
    },
    {
      id: "noGhost",
      title: { en: "Ghost text disabled", zh: "禁用 Ghost Text" },
      description: {
        en: "Show completions only after Tab while still supporting Tab / Esc actions.",
        zh: "关闭灰字，仅在按 Tab 时插入补全，但仍支持 Tab / Esc 控制。",
      },
      badges: ["showGhost: false", "UX"],
      showGhost: false,
      code: String.raw`const plugin = completion({
  showGhost: false,
  callCompletion: async (context) => {
    return \`[\${context.promptType}]\${context.beforeText.slice(-16)}\`;
  },
});`,
      createOptions: () => ({
        showGhost: false,
        callCompletion: async (context: CompletionContext): Promise<CompletionResult> => {
          await sleep(360);
          const preview = context.beforeText.slice(-20) || "…";
          return `✨ ${context.promptType} · ${preview}`;
        },
      }),
    },
    {
      id: "html",
      title: { en: "Return HTML", zh: "返回 HTML" },
      description: {
        en: "Provide both plain + html so the plugin can insert rich formatting inline.",
        zh: "同时返回 plain 与 html，展示富文本插入能力。",
      },
      badges: ["HTML", "rich-text"],
      code: String.raw`const plugin = completion({
  callCompletion: async (context) => {
    return {
      plain: "Bold + italic",
      html: \`<p>Based on <strong>\${context.promptType}</strong> mode.</p>\`,
    };
  },
});`,
      createOptions: () => ({
        callCompletion: async (context: CompletionContext): Promise<CompletionResult> => {
          await sleep(350);
          const escaped = escapeHtml(context.beforeText.slice(-40) || "your text");
          return {
            plain: "HTML rich text",
            html: `<section>
  <p>✨ <strong>Rich suggestion</strong> derived from:</p>
  <blockquote>${escaped}</blockquote>
  <p><em>Feel free to keep typing!</em></p>
</section>`,
          };
        },
      }),
    },
    {
      id: "markdown",
      title: { en: "Markdown → ProseMirror", zh: "Markdown → ProseMirror" },
      description: {
        en: "Convert markdown to schema-safe nodes via prosemirror-markdown before insertion.",
        zh: "先通过 prosemirror-markdown 解析 markdown，再以节点形式插入。",
      },
      badges: ["markdown", "prosemirror"],
      code: String.raw`import { defaultMarkdownParser } from "prosemirror-markdown";

const plugin = completion({
  callCompletion: async () => {
    const markdown = "## Suggestion\\n\\nThis is **bold** and *italic*";
    return { prosemirror: defaultMarkdownParser.parse(markdown) };
  },
});`,
      createOptions: () => ({
        callCompletion: async (context: CompletionContext): Promise<CompletionResult> => {
          await sleep(350);
          const lastLine = context.beforeText.split("\n").slice(-1)[0] || "(empty)";
          const markdown = `## Suggestion

- Based on: ${context.promptType}
- Cursor tail: ${lastLine}

> Markdown is parsed to nodes.`;
          const node = defaultMarkdownParser.parse(markdown);
          return { prosemirror: node };
        },
      }),
    },
    {
      id: "template",
      title: { en: "Prompt template playground", zh: "Prompt 模板实验" },
      description: {
        en: "Edit a template with {{beforeText}} placeholders and preview compiled prompts in real time.",
        zh: "使用 {{beforeText}} 等占位符实时编写 Prompt，并立即预览结果。",
      },
      badges: ["template", "{{variable}}"],
      showPromptPreview: true,
      extraPanel: "promptTemplate",
      code: String.raw`const template = "Continue {{promptType}} text based on {{beforeText}}";

const plugin = completion({
  callCompletion: async (context) => {
    const compiled = renderTemplate(template, context);
    return compiled.slice(-80);
  },
});`,
      createOptions: ({ setPromptPreview, getPromptTemplate }) => ({
        debounceMs: 500,
        callCompletion: async (context: CompletionContext): Promise<CompletionResult> => {
          await sleep(420);
          const template = getPromptTemplate?.() ?? defaultTemplate;
          const compiled = renderTemplate(template, context);
          setPromptPreview?.(compiled);
          return `🧩 template says:\n${compiled.slice(0, 160)}...`;
        },
      }),
    },
  ];
}

function renderTemplate(template: string, context: CompletionContext) {
  return template.replace(/{{\s*(beforeText|afterText|promptType)\s*}}/g, (_, key: string) => {
    switch (key) {
      case "beforeText":
        return context.beforeText.trim() || "(empty)";
      case "afterText":
        return context.afterText.trim() || "(empty)";
      case "promptType":
        return context.promptType;
      default:
        return "";
    }
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pseudoLLM(prompt: string, context: CompletionContext): Promise<string> {
  await sleep(320);
  const tail = context.beforeText.slice(-36) || "(empty)";
  const promptHead = prompt.slice(0, 60).trim() || "(prompt empty)";
  return `→ ${context.promptType} prompt • tail: ${tail} • prompt: ${promptHead}…`;
}
</script>
