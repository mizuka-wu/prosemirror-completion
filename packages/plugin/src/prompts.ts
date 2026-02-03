/**
 * Prompt 构建工具包
 * 提供不同场景下的 prompt 生成函数
 */

import type { CompletionContext, PromptType } from "./types";

/**
 * 通用文本补全 prompt
 */
export function buildCommonPrompt(context: CompletionContext): string {
  return `Continue the following text naturally and concisely:

${context.beforeText}

Continue:`;
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
  return `Continue writing the following markdown document:

${context.beforeText}

Continue:`;
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
export function getPromptBuilder(type: PromptType) {
  switch (type) {
    case "code":
      return buildCodePrompt;
    case "markdown":
      return buildMarkdownPrompt;
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
  type?: PromptType,
): string {
  const promptType = type ?? context.promptType;
  const builder = getPromptBuilder(promptType);
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
