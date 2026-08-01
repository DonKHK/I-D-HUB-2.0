const express = require('express');
const router = express.Router();

// POST /api/ai/analyze — server-side AI proxy (avoids browser CORS)
router.post('/analyze', async (req, res) => {
  const {
    provider = 'openai',
    apiKey = '',
    endpoint = '',
    model = 'gpt-3.5-turbo',
    accountId = '',
    token = '',
    prompt = '',
  } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  let url, headers, body;

  if (provider === 'cloudflare') {
    const cfModel = model && model.startsWith('@cf/') ? model : '@cf/meta/llama-3.1-8b-instruct';
    if (!accountId) return res.status(400).json({ error: 'Missing Cloudflare Account ID' });
    if (!token) return res.status(400).json({ error: 'Missing Cloudflare API Token' });
    url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${cfModel}`;
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    body = {
      messages: [
        { role: 'system', content: 'You are a helpful project evaluation assistant. Always respond with valid JSON only.' },
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
    body = { model, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 4096 };
  } else {
    // OpenAI (default)
    if (!apiKey) return res.status(400).json({ error: 'Missing OpenAI API Key' });
    url = 'https://api.openai.com/v1/chat/completions';
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
    body = { model, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 4096 };
  }

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      console.error(`[routes/ai] Provider ${provider} returned ${upstream.status}:`, text.slice(0, 300));
      return res.status(upstream.status).json({ error: `Provider error ${upstream.status}: ${text}` });
    }

    // Forward the raw provider JSON back to the frontend.
    // Never crash if the provider returns malformed JSON.
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error(`[routes/ai] Provider ${provider} returned non-JSON body:`, text.slice(0, 300));
      return res.status(502).json({
        error: `AI provider (${provider}) returned an invalid response. Please try again or use a different model.`,
      });
    }
    res.status(upstream.status).json(data);
  } catch (e) {
    console.error(`[routes/ai] Cannot reach provider ${provider}:`, e.message);
    return res.status(502).json({
      error: `Cannot reach AI provider (${provider}) from backend: ${e.message}`,
    });
  }
});

module.exports = router;