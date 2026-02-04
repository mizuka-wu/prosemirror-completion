export function buildChinesePrompt(context: CompletionContext): string {
  const before = context.beforeText.trim() || "(无内容)";
  const after = context.afterText.trim();
  return [
    "你是一名中文写作助手，请延续作者的语气继续写 1~2 句。",
    "只输出中文内容，不要重复已存在的句子，也不要加解释。",
    `光标前内容：\n\n${before}\n` +
      (after ? `\n光标后内容：\n\n${after}\n` : ""),
    "续写：",
  ].join("\n\n");
}

import type { CompletionContext, PromptType, PromptOptions } from "./types";

const ZH_LANG_REGEX = /^(zh|zh-.*|cn|中文)$/i;

/**
 * 通用文本补全 prompt
 */
export function buildCommonPrompt(context: CompletionContext): string {
  const before = context.beforeText.trim();
  const after = context.afterText.trim();
  return [
    "You are an inline writing assistant.",
    "Continue the user's text in the same language and tone with 1-2 sentences.",
    "Do not repeat existing content or add explanations.",
    before
      ? `Context before cursor:\n\n${before}\n`
      : "Context before cursor is empty.",
    after ? `Context after cursor:\n\n${after}\n` : "",
    "Continuation:",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * 代码补全 prompt
 */
export function buildCodePrompt(context: CompletionContext): string {
  return `Complete the following code snippet. 
Only provide the completion, no explanations:

\`\`\`
${context.beforeText}
\`\`\`

Completion:`;
}

/**
 * Markdown 补全 prompt
 */
export function buildMarkdownPrompt(context: CompletionContext): string {
  const before = context.beforeText.trim();
  return [
    "Continue the following markdown document in a natural style.",
    "Use valid markdown syntax (headings, lists, code blocks, etc.).",
    before
      ? `Existing markdown:\n\n${before}\n`
      : "Existing document is empty.",
    "Continuation:",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * JavaScript/TypeScript 代码补全
 */
export function buildJavaScriptPrompt(context: CompletionContext): string {
  return `Complete the following JavaScript/TypeScript code:

\`\`\`javascript
${context.beforeText}
\`\`\`

Completion:`;
}

/**
 * Python 代码补全
 */
export function buildPythonPrompt(context: CompletionContext): string {
  return `Complete the following Python code:

\`\`\`python
${context.beforeText}
\`\`\`

Completion:`;
}

/**
 * 根据 prompt 类型选择对应的 builder
 */
export function getPromptBuilder(type: PromptType | undefined) {
  switch (type) {
    case "code":
      return buildCodePrompt;
    case "markdown":
      return buildMarkdownPrompt;
    case "zh":
    case "chinese":
    case "中文":
      return buildChinesePrompt;
    case "common":
    default:
      return buildCommonPrompt;
  }
}

/**
 * 构建完整的 prompt
 */
export function buildPrompt(
  context: CompletionContext,
  options?: PromptOptions,
): string {
  const lang = options?.lang;
  if (lang && ZH_LANG_REGEX.test(lang)) {
    return buildChinesePrompt(context);
  }

  const explicitType = options?.type ?? context.promptType;
  const builder = getPromptBuilder(explicitType);
  return builder(context);
}

/**
 * 检测代码语言
 */
export function detectLanguage(beforeText: string): string {
  const text = beforeText.slice(-100);

  // TypeScript/JavaScript
  if (
    /:\s*(string|number|boolean|any|void|interface|type)\b/.test(text) ||
    /\b(const|let|var)\s+\w+:\s*\w+/.test(text)
  ) {
    return "typescript";
  }

  // Python
  if (/\b(def|class|import|from)\b/.test(text) && /:\s*\n/.test(text)) {
    return "python";
  }

  // HTML
  if (/<\w+/.test(text) && />/.test(text)) {
    return "html";
  }

  // CSS
  if (/\{[\s\S]*?:[\s\S]*?;/.test(text)) {
    return "css";
  }

  return "javascript";
}
