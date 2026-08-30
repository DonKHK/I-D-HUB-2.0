// Vercel Serverless Function — POST /api/ai/analyze
// Server-side AI proxy (avoids browser CORS). Mirrors backend/routes/ai.js.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const {
    provider = 'openai',
    apiKey = '',
    endpoint = '',
    model = 'gpt-3.5-turbo',
    accountId = '',
    token = '',
    jsonMode = false,
    prompt = '',
  } = body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  let url, headers, payload;

  if (provider === 'cloudflare') {
    const cfModel = model && model.startsWith('@cf/') ? model : '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';
    if (!accountId) return res.status(400).json({ error: 'Missing Cloudflare Account ID' });
    if (!token) return res.status(400).json({ error: 'Missing Cloudflare API Token' });
    // Note: model is NOT URL-encoded so the / in @cf/meta/... stays intact
    url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${cfModel}`;
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const systemPrompt = jsonMode
      ? 'You are a helpful project evaluation assistant. Always respond with valid JSON only.'
      : 'You are a helpful, concise assistant. Respond in natural language.';
    payload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4096,
    };
  } else if (provider === 'custom') {
    if (!endpoint) return res.status(400).json({ error: 'Missing custom API endpoint URL' });
    url = endpoint;
    headers = {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    };
    payload = { model, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 4096 };
  } else {
    // OpenAI (default)
    if (!apiKey) return res.status(400).json({ error: 'Missing OpenAI API Key' });
    url = 'https://api.openai.com/v1/chat/completions';
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
    payload = { model, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 4096 };
  }

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      console.error(`[api/ai] Provider ${provider} returned ${upstream.status}:`, text.slice(0, 300));
      return res.status(upstream.status).json({ error: `Provider error ${upstream.status}: ${text}` });
    }

    // Forward the raw provider response body back to the frontend.
    // AI providers may return malformed JSON — never crash the serverless function.
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error(`[api/ai] Provider ${provider} returned non-JSON body:`, text.slice(0, 300));
      return res.status(502).json({
        error: `AI provider (${provider}) returned an invalid response. Please try again or use a different model.`,
      });
    }
    res.status(upstream.status).json(data);
  } catch (e) {
    console.error(`[api/ai] Cannot reach provider ${provider}:`, e.message);
    return res.status(502).json({
      error: `Cannot reach AI provider (${provider}) from backend: ${e.message}`,
    });
  }
};

module.exports.config = { maxDuration: 60 };