<template>
  <ClientOnly>
    <div class="webllm-editor">
      <div class="webllm-editor__toolbar">
        <button class="webllm-editor__button" type="button" :disabled="webllmStatus === 'loading'"
          @click="preloadWebLLM">
          {{ buttonLabel }}
        </button>
        <div class="webllm-editor__status-group">
          <span class="webllm-editor__status">{{ statusText }}</span>
          <div v-if="webllmStatus === 'loading'" class="webllm-editor__progress" aria-label="Model download progress">
            <div class="webllm-editor__progress-bar"></div>
          </div>
        </div>
      </div>
      <div ref="editorContainer" class="webllm-editor__surface"></div>
      <p v-if="showWarmupNote" class="webllm-editor__note">
        {{ warmupNote }}
      </p>
      <p class="webllm-editor__hint" v-html="hintHtml"></p>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import {
  createCompletionPlugin,
  type CompletionContext,
  type CompletionResult,
} from "@prosemirror-completion/plugin";
import { useData } from "vitepress";
import { useWebLLM } from "../webllmStore";

import "prosemirror-view/style/prosemirror.css";
import "prosemirror-example-setup/style/style.css";

const editorContainer = ref<HTMLDivElement | null>(null);
const { lang } = useData();

const messages = {
  en: {
    preloadButton: "Preload WebLLM",
    readyButton: "WebLLM Ready",
    hint: "Type at least 3 characters to trigger AI completion. <kbd>Tab</kbd> accepts, <kbd>Esc</kbd> cancels.",
    warmup: "Click \"Preload WebLLM\" to warm up the model (~300MB download).",
    loading: "Downloading WebLLM model...",
    warmingUpFallback: "WebLLM is warming up...",
    suggestionReady: "Suggestion ready. Press Tab to insert.",
    emptyResponse: "AI responded with empty text.",
    generating: "Generating suggestion…",
    inserted: "Completion inserted. Keep typing!",
    dismissed: "Completion dismissed.",
    readyStatus: "WebLLM ready. AI modes are available.",
    errorStatus: "Failed to load WebLLM. Click to retry.",
  },
  zh: {
    preloadButton: "预加载 WebLLM",
    readyButton: "WebLLM 已就绪",
    hint: "输入至少 3 个字符触发补全。<kbd>Tab</kbd> 确认，<kbd>Esc</kbd> 取消。",
    warmup: "点击“预加载 WebLLM”预热模型（约 300MB）。",
    loading: "正在下载 WebLLM 模型…",
    warmingUpFallback: "WebLLM 正在预热…",
    suggestionReady: "建议已就绪，按 Tab 插入。",
    emptyResponse: "AI 未返回内容。",
    generating: "正在生成建议…",
    inserted: "已插入补全，继续输入吧！",
    dismissed: "补全已取消。",
    readyStatus: "WebLLM 已可使用。",
    errorStatus: "加载失败，请重试。",
  },
};

const localeText = computed(() =>
  lang.value?.startsWith("zh") ? messages.zh : messages.en,
);

const statusText = ref(localeText.value.warmup);
const buttonLabel = computed(() =>
  webllmStatus.value === "ready"
    ? localeText.value.readyButton
    : localeText.value.preloadButton,
);
const hintHtml = computed(() => localeText.value.hint);
const warmupNote = computed(() => localeText.value.warmup);
const showWarmupNote = computed(() => webllmStatus.value !== "ready");
const storeMessages = computed(() => ({
  idle: localeText.value.warmup,
  loading: localeText.value.loading,
  ready: localeText.value.readyStatus,
  error: localeText.value.errorStatus,
}));
const isClient = typeof window !== "undefined";

let view: EditorView | null = null;

const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

const {
  ensureEngine,
  status: webllmStatus,
  message: webllmMessage,
  messageKey: webllmMessageKey,
} = useWebLLM();

const completionPlugin = createCompletionPlugin({
  debounceMs: 500,
  minTriggerLength: 3,
  debug: true,
  callCompletion: async (context: CompletionContext): Promise<CompletionResult> => {
    console.log("[WebLLMEditor] callCompletion invoked", {
      length: context.beforeText.length,
      promptType: context.promptType,
    });
    const engine = await ensureEngine();
    if (!engine) {
      console.warn("[WebLLMEditor] WebLLM engine not ready yet");
      return localeText.value.warmingUpFallback;
    }

    const prompt = `Continue the following text in one or two sentences.\n\n${context.beforeText}\n\nContinuation:`;
    console.log("[WebLLMEditor] Sending prompt to WebLLM", prompt.slice(-160));

    const response = await engine.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 120,
    });

    const text = response.choices?.[0]?.message?.content?.trim();
    console.log("[WebLLMEditor] Received response", text);
    if (text && text.length > 0) {
      statusText.value = localeText.value.suggestionReady;
      return text;
    }
    statusText.value = localeText.value.emptyResponse;
    return "(No AI response)";
  },
  onChange: () => {
    statusText.value = localeText.value.generating;
  },
  onApply: () => {
    statusText.value = localeText.value.inserted;
  },
  onExit: () => {
    statusText.value = localeText.value.dismissed;
  },
});

function createEditor(): boolean {
  const mount = editorContainer.value;
  if (!mount || !isClient) return false;

  if (view) {
    view.destroy();
    view = null;
  }

  const state = EditorState.create({
    schema,
    plugins: [...exampleSetup({ schema, menuBar: false }), completionPlugin],
  });

  mount.textContent = "";
  view = new EditorView(mount, {
    state,
    editable: () => true,
  });

  console.log("[WebLLMEditor] ProseMirror editor mounted");
  return true;
}

async function preloadWebLLM() {
  await ensureEngine(storeMessages.value);
}

watch(
  () => editorContainer.value,
  (el) => {
    if (!isClient || !el) return;
    createEditor();
  },
  { immediate: true }
);

onMounted(() => {
  if (!isClient) return;
  if (editorContainer.value) {
    createEditor();
  }
  void ensureEngine(storeMessages.value);
});

onBeforeUnmount(() => {
  if (view) {
    view.destroy();
    view = null;
  }
});

const getStoreStatusText = () => {
  switch (webllmMessageKey.value) {
    case "idle":
      return localeText.value.warmup;
    case "loading":
      return localeText.value.loading;
    case "ready":
      return localeText.value.readyStatus;
    case "error":
      return localeText.value.errorStatus;
    case "custom":
    default:
      return webllmMessage.value;
  }
};

watch([localeText, webllmMessageKey, webllmMessage], () => {
  if (webllmMessageKey.value !== "custom") {
    statusText.value = getStoreStatusText();
    return;
  }
  statusText.value = webllmMessage.value;
});
</script>
