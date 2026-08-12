// Shared AI client — calls the backend / Vercel AI proxy (/api/ai/analyze)
// and returns the raw text content from the provider response.
// Supports OpenAI, custom (OpenAI-compatible) and Cloudflare Workers AI.

// Backend API base URL — uses Vite proxy (/api -> localhost:5000) by default
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

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

  return String(content).trim();
}
