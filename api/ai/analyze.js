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
    prompt = '',
  } = body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  let url, headers, payload;

  if (provider === 'cloudflare') {
    const cfModel = model && model.startsWith('@cf/') ? model : '@cf/meta/llama-3.1-8b-instruct';
    if (!accountId) return res.status(400).json({ error: 'Missing Cloudflare Account ID' });
    if (!token) return res.status(400).json({ error: 'Missing Cloudflare API Token' });
    // Note: model is NOT URL-encoded so the / in @cf/meta/... stays intact
    url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${cfModel}`;
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    payload = {
      messages: [
        { role: 'system', content: 'You are a helpful project evaluation assistant. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
    };
  } else if (provider === 'custom') {
    if (!endpoint) return res.status(400).json({ error: 'Missing custom API endpoint URL' });
    url = endpoint;
    headers = {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    };
    payload = { model, messages: [{ role: 'user', content: prompt }], temperature: 0.3 };
  } else {
    // OpenAI (default)
    if (!apiKey) return res.status(400).json({ error: 'Missing OpenAI API Key' });
    url = 'https://api.openai.com/v1/chat/completions';
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
    payload = { model, messages: [{ role: 'user', content: prompt }], temperature: 0.3 };
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

    res.status(upstream.status).json(JSON.parse(text));
  } catch (e) {
    console.error(`[api/ai] Cannot reach provider ${provider}:`, e.message);
    return res.status(502).json({
      error: `Cannot reach AI provider (${provider}) from backend: ${e.message}`,
    });
  }
};

module.exports.config = { maxDuration: 60 };