import { ref, shallowRef } from "vue";

const MODEL_NAME = "Qwen2-0.5B-Instruct-q4f16_1-MLC";

const status = ref<"idle" | "loading" | "ready" | "error">("idle");
const message = ref(
  "WebLLM idle. Click preload to download the model (~200MB).",
);
const progress = ref(0);
const engine = shallowRef<any>(null);
const isClient = typeof window !== "undefined";
let enginePromise: Promise<any> | null = null;

export function useWebLLM() {
  return {
    status,
    message,
    progress,
    engine,
    ensureEngine,
  };
}

async function ensureEngine() {
  if (!isClient) {
    return null;
  }
  if (engine.value) {
    return engine.value;
  }
  if (!enginePromise) {
    status.value = "loading";
    message.value = "Downloading WebLLM model (~100MB)...";
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
            }
          },
        });
      },
    );
  } else {
    status.value = "loading";
    message.value = "WebLLM model is loading...";
    progress.value = 0.1;
  }

  try {
    engine.value = await enginePromise;
    status.value = "ready";
    message.value = "WebLLM ready. AI modes are available.";
    progress.value = 1;
  } catch (error) {
    console.error("WebLLM load failed", error);
    status.value = "error";
    message.value = "Failed to load WebLLM. Click to retry.";
    progress.value = 0;
    enginePromise = null;
    return null;
  }

  return engine.value;
}
