import { ref, shallowRef } from "vue";

const MODEL_NAME = "Qwen2-0.5B-Instruct-q4f16_1-MLC";

type WebLLMStatus = "idle" | "loading" | "ready" | "error";
type WebLLMMessageKey = WebLLMStatus | "custom";
type StatusMessages = Record<WebLLMStatus, string>;

const status = ref<WebLLMStatus>("idle");
const messageKey = ref<WebLLMMessageKey>("idle");
const message = ref(
  "WebLLM idle. Click preload to download the model (~200MB).",
);
const progress = ref(0);
const engine = shallowRef<any>(null);
const isClient = typeof window !== "undefined";
let enginePromise: Promise<any> | null = null;
let currentMessages: StatusMessages = {
  idle: "WebLLM idle. Click preload to download the model (~200MB).",
  loading: "Downloading WebLLM model (~100MB)...",
  ready: "WebLLM ready. AI modes are available.",
  error: "Failed to load WebLLM. Click to retry.",
};

export function useWebLLM() {
  return {
    status,
    message,
    messageKey,
    progress,
    engine,
    ensureEngine,
  };
}

async function ensureEngine(messages?: StatusMessages) {
  if (!isClient) {
    return null;
  }
  if (messages) {
    currentMessages = messages;
  }
  if (engine.value) {
    return engine.value;
  }
  if (!enginePromise) {
    status.value = "loading";
    messageKey.value = "loading";
    message.value = currentMessages.loading;
    progress.value = 0;
    enginePromise = import("@mlc-ai/web-llm").then(
      async ({ CreateMLCEngine }) => {
        return CreateMLCEngine(MODEL_NAME, {
          initProgressCallback: (report) => {
            if (report.progress != null) {
              progress.value = Math.max(0, Math.min(1, report.progress));
            }
            if (report.text) {
              message.value = report.text;
              messageKey.value = "custom";
            }
          },
        });
      },
    );
  } else {
    status.value = "loading";
    messageKey.value = "loading";
    message.value = currentMessages.loading;
    progress.value = 0.1;
  }

  try {
    engine.value = await enginePromise;
    status.value = "ready";
    messageKey.value = "ready";
    message.value = currentMessages.ready;
    progress.value = 1;
  } catch (error) {
    console.error("WebLLM load failed", error);
    status.value = "error";
    messageKey.value = "error";
    message.value = currentMessages.error;
    progress.value = 0;
    enginePromise = null;
    return null;
  }

  return engine.value;
}
