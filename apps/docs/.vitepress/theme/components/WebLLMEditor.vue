<template>
  <ClientOnly>
    <div class="webllm-editor">
      <div class="webllm-editor__toolbar">
        <button class="webllm-editor__button" type="button" :disabled="webllmStatus === 'loading'"
          @click="preloadWebLLM">
          {{ webllmStatus === "ready" ? "WebLLM Ready" : "Preload WebLLM" }}
        </button>
        <div class="webllm-editor__status-group">
          <span class="webllm-editor__status">{{ statusText }}</span>
          <div v-if="webllmStatus === 'loading'" class="webllm-editor__progress" aria-label="Model download progress">
            <div class="webllm-editor__progress-bar"></div>
          </div>
        </div>
      </div>
      <div ref="editorContainer" class="webllm-editor__surface"></div>
      <p class="webllm-editor__hint">
        Type at least 3 characters to trigger AI completion. <kbd>Tab</kbd> accepts, <kbd>Esc</kbd> cancels.
      </p>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
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
import { useWebLLM } from "../webllmStore";

import "prosemirror-view/style/prosemirror.css";
import "prosemirror-example-setup/style/style.css";

const editorContainer = ref<HTMLDivElement | null>(null);
const statusText = ref("Click \"Preload WebLLM\" to warm up the model (~300MB download).");
const isClient = typeof window !== "undefined";

let view: EditorView | null = null;

const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

const { ensureEngine, status: webllmStatus, message: webllmMessage } = useWebLLM();

const completionPlugin = createCompletionPlugin({
  debounceMs: 500,
  minTriggerLength: 3,
  callCompletion: async (context: CompletionContext): Promise<CompletionResult> => {
    console.log("[WebLLMEditor] callCompletion invoked", {
      length: context.beforeText.length,
      promptType: context.promptType,
    });
    const engine = await ensureEngine();
    if (!engine) {
      console.warn("[WebLLMEditor] WebLLM engine not ready yet");
      return "WebLLM is warming up...";
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
      statusText.value = "Suggestion ready. Press Tab to insert.";
      return text;
    }
    statusText.value = "AI responded with empty text.";
    return "(No AI response)";
  },
  onChange: () => {
    statusText.value = "Generating suggestion…";
  },
  onApply: () => {
    statusText.value = "Completion inserted. Keep typing!";
  },
  onExit: () => {
    statusText.value = "Completion dismissed.";
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
  await ensureEngine();
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
  void ensureEngine();
});

onBeforeUnmount(() => {
  if (view) {
    view.destroy();
    view = null;
  }
});

watch(webllmMessage, (val) => {
  if (webllmStatus.value === "idle") {
    statusText.value = "Click \"Preload WebLLM\" to warm up the model (~100MB download).";
    return;
  }
  statusText.value = val;
});
</script>
