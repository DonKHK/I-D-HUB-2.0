// Shared AI client — calls the backend / Vercel AI proxy (/api/ai/analyze)
// and returns the raw text content from the provider response.
// Supports OpenAI, custom (OpenAI-compatible) and Cloudflare Workers AI.

// Backend API base URL — uses Vite proxy (/api -> localhost:5000) by default
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

/**
 * Best-effort flattening of a parsed JSON object into readable text lines,
 * used when an AI model ignores instructions and returns JSON.
 */
function flattenJsonToText(obj) {
  const lines = [];
  const walk = (node, prefix = '') => {
    if (node == null) return;
    if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
      lines.push(`${prefix}${node}`);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${prefix}${i + 1}. `));
      return;
    }
    if (typeof node === 'object') {
      Object.entries(node).forEach(([k, v]) => {
        if (v && typeof v === 'object') {
          lines.push(`${prefix}${k}:`);
          walk(v, `${prefix}  `);
        } else {
          lines.push(`${prefix}${k}: ${v}`);
        }
      });
    }
  };
  walk(obj);
  return lines.join('\n');
}

/**
 * Clean up an AI response so it renders as a plain text report:
 * - strips <think>...</think> reasoning blocks
 * - strips markdown code fences
 * - converts pure JSON output into readable text
 */
export function cleanAiOutput(raw) {
  let text = String(raw || '');

  // Remove reasoning blocks (DeepSeek-R1 etc.)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove markdown code fences (```json ... ``` / ``` ... ```)
  text = text.replace(/```[a-zA-Z]*\s*([\s\S]*?)```/g, '$1');
  // Remove any leftover fence markers
  text = text.replace(/^```\s*/m, '').replace(/```\s*$/m, '');

  const trimmed = text.trim();

  // If the result looks like pure JSON, convert to readable text
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const obj = JSON.parse(trimmed);
      return flattenJsonToText(obj).trim();
    } catch (e) {
      // Not parseable JSON — return as-is
    }
  }

  return trimmed;
}

export async function callAi({
  provider = 'openai',
  apiKey = '',
  endpoint = '',
  model = 'gpt-3.5-turbo',
  accountId = '',
  token = '',
  prompt = '',
}) {
  if (!prompt) throw new Error('Missing prompt');

  // Where to read the AI response text from (provider-specific response shape)
  const responseContentKey = provider === 'cloudflare'
    ? 'result.response'
    : 'choices.0.message.content';

  const cfModel = model && model.startsWith('@cf/') ? model : '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';

  const response = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      apiKey,
      endpoint,
      model: provider === 'cloudflare' ? cfModel : model,
      accountId,
      token,
      prompt,
    }),
  });

  if (!response.ok) {
    let errMsg = `API error ${response.status}`;
    try {
      const errData = await response.json();
      errMsg = errData.error || errData.message || errMsg;
    } catch (e) { /* response not JSON */ }
    throw new Error(errMsg);
  }

  const data = await response.json();

  // Cloudflare returns { success: false, errors: [...] } on failure
  if (provider === 'cloudflare' && data.success === false) {
    const errMsg = data.errors?.[0]?.message || 'Cloudflare API error';
    throw new Error(errMsg);
  }

  const content = responseContentKey
    ? responseContentKey.split('.').reduce((obj, key) => (obj == null ? undefined : obj[key]), data)
    : null;

  if (!content) {
    throw new Error('No response content from API.');
  }

  return cleanAiOutput(content);
}
