import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { callAi } from '../utils/aiCall';
import { calculateHealth } from '../utils/helpers';

const CONFIG_STORAGE_KEY = 'idhub_ai_config';

// Load saved AI settings (API key etc.) from localStorage so users don't re-enter them every time.
function loadSavedConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

// Build a compact text summary of all projects + ideas for the AI context.
function buildContext(projects, ideas) {
  const now = new Date();

  const projectLines = (projects || []).map((p) => {
    const health = calculateHealth(p);
    const budget = Number(p.budget) || 0;
    const used = Number(p.budgetUsed) || 0;
    const usedPct = budget > 0 ? Math.round((used / budget) * 100) : null;
    let daysLeft = null;
    if (p.endDate) {
      daysLeft = Math.ceil((new Date(p.endDate) - now) / (1000 * 60 * 60 * 24));
    }
    const stages = Array.isArray(p.stages) && p.stages.length
      ? p.stages
          .map((s) => `${s.type || s.name || s.stage || 'Stage'}(${s.status || '?'}${s.endDate ? ` due ${s.endDate}` : ''})`)
          .join('; ')
      : 'None';
    return (
      `- [${p.id}] "${p.name || 'Untitled'}" | status: ${p.status || 'Planning'} | health: ${health.label} ` +
      `| budget: ${budget} (${usedPct === null ? 'N/A' : usedPct + '%'} used) | start: ${p.startDate || '-'} | end: ${p.endDate || '-'} ` +
      `| daysLeft: ${daysLeft === null ? '-' : daysLeft} | manager: ${p.manager || p.projectManagerName || '-'} ` +
      `| holder: ${p.holder || p.applicantName || '-'} | stages: ${stages}`
    );
  });

  const ideaLines = (ideas || []).map((i) => {
    const budget = Number(i.totalBudget) || 0;
    return (
      `- [${i.id}] "${i.title || i.projectTitle || 'Untitled'}" | status: ${i.status || '-'} | applicant: ${i.applicantName || '-'} ` +
      `| budget: ${budget} | type: ${i.projectType || '-'}`
    );
  });

  return (
    `PROJECTS (${(projects || []).length}):\n${projectLines.join('\n') || 'None'}\n\n` +
    `IDEAS (${(ideas || []).length}):\n${ideaLines.join('\n') || 'None'}`
  );
}

export default function AIAssistant() {
  const { projects, ideas } = useData();

  // AI settings (persisted to localStorage)
  const saved = useMemo(loadSavedConfig, []);
  const [provider, setProvider] = useState(saved.provider || 'openai'); // 'openai' | 'custom' | 'cloudflare'
  const [apiKey, setApiKey] = useState(saved.apiKey || '');
  const [endpoint, setEndpoint] = useState(saved.endpoint || '');
  const [model, setModel] = useState(saved.model || 'gpt-3.5-turbo');
  const [accountId, setAccountId] = useState(saved.accountId || '');
  const [cfToken, setCfToken] = useState(saved.cfToken || '');
  const [configOpen, setConfigOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Persist AI settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ provider, apiKey, endpoint, model, accountId, cfToken }));
    } catch (e) { /* storage may be unavailable — ignore */ }
  }, [provider, apiKey, endpoint, model, accountId, cfToken]);

  // Auto-scroll chat to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Provider-specific validation (mirrors the other AI tools)
    if (provider === 'cloudflare') {
      if (!String(accountId || '').trim()) { setError('Please enter your Cloudflare Account ID.'); return; }
      if (!String(cfToken || '').trim()) { setError('Please enter your Cloudflare API Token.'); return; }
    } else if (provider === 'custom') {
      if (!String(endpoint || '').trim()) { setError('Please enter a custom API endpoint URL.'); return; }
    } else {
      if (!String(apiKey || '').trim()) { setError('Please enter an OpenAI API Key.'); return; }
    }

    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const context = buildContext(projects, ideas);

      // Keep the conversation compact — only the latest 6 turns.
      const historyBlock = history
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = `You are the AI assistant of the "I&D Hub" project management system (Asia Allied Group). You help staff understand the projects and ideas in the system.

Below is the current system data. Use ONLY this data to answer questions — never invent projects, numbers or statuses that are not listed. If the data does not contain the answer, say so.

## SYSTEM DATA
${context}

## CONVERSATION HISTORY
${historyBlock}

## LATEST USER QUESTION
${text}

IMPORTANT OUTPUT RULES:
- Respond in plain, natural language (paragraphs or short sentences). Do NOT output JSON, do NOT output a numbered list of every project, and do NOT just repeat the raw data back.
- Start with a direct one-sentence answer to the question, then briefly explain using only the 1-3 most relevant projects/ideas, then give a short practical suggestion if useful.
- When the user writes in Chinese, reply in the same Chinese using simple everyday language. Otherwise reply in English.
- Be concise and professional. Reference actual project/idea names (not IDs) where relevant.`;

      const reply = await callAi({
        provider,
        apiKey,
        endpoint,
        model,
        accountId,
        token: cfToken,
        prompt,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message || 'AI call failed. Please check your settings and try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError('');
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">🤖 AI Assistant</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button className="btn btn--outline" onClick={() => setConfigOpen(!configOpen)}>
            {configOpen ? '▾ Hide AI Settings' : '▸ AI Settings'}
          </button>
          <button className="btn btn--outline" onClick={handleClear} disabled={messages.length === 0}>
            🗑 Clear Chat
          </button>
        </div>
      </div>
      <p className="page-subtitle">
        Ask questions about your projects and ideas — the assistant knows your live system data and can hold a multi-turn conversation.
      </p>

      {/* AI Settings panel */}
      {configOpen && (
        <div className="card ai-chat-config">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Provider</label>
              <select className="form-input" value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="custom">Custom (OpenAI-compatible)</option>
                <option value="cloudflare">Cloudflare Workers AI</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                className="form-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={provider === 'cloudflare' ? '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b' : 'gpt-3.5-turbo'}
              />
            </div>
          </div>

          {provider !== 'cloudflare' && (
            <div className="form-group">
              <label className="form-label">
                API Key
                <span className="form-hint">Stored only in your browser (localStorage) — never sent to our server.</span>
              </label>
              <input
                type="password"
                className="form-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'custom' ? 'Optional for custom endpoints' : 'sk-...'}
              />
            </div>
          )}

          {provider === 'custom' && (
            <div className="form-group">
              <label className="form-label">Custom API Endpoint URL</label>
              <input className="form-input" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://your-endpoint/v1/chat/completions" />
            </div>
          )}

          {provider === 'cloudflare' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cloudflare Account ID</label>
                <input className="form-input" value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="Account ID" />
              </div>
              <div className="form-group">
                <label className="form-label">Cloudflare API Token</label>
                <input type="password" className="form-input" value={cfToken} onChange={(e) => setCfToken(e.target.value)} placeholder="API Token" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat messages */}
      <div className="card ai-chat">
        <div className="ai-chat-messages">
          {messages.length === 0 && (
            <div className="ai-chat-empty">
              <div className="ai-chat-empty-icon">🤖</div>
              <p>I can see your live projects and ideas. Try asking:</p>
              <ul>
                <li>「邊個 project 最危險？」</li>
                <li>「幫我總結所有進行緊嘅 project」</li>
                <li>「Which idea is pending approval?」</li>
                <li>「AI Chatbot 個 project 用咗幾多 budget？」</li>
              </ul>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`ai-chat-msg ${m.role === 'user' ? 'ai-chat-msg--user' : 'ai-chat-msg--assistant'}`}>
              <div className="ai-chat-msg-bubble">{m.content}</div>
            </div>
          ))}

          {loading && (
            <div className="ai-chat-msg ai-chat-msg--assistant">
              <div className="ai-chat-msg-bubble ai-chat-loading">Thinking…</div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && <div className="alert alert--warning" style={{ marginBottom: '0.75rem' }}>{error}</div>}

        <div className="ai-chat-input-row">
          <textarea
            ref={inputRef}
            className="form-input ai-chat-input"
            rows="2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="問我關於你啲 project / idea 嘅問題… (Enter 送出，Shift+Enter 換行)"
            disabled={loading}
          />
          <button className="btn btn--primary" onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? 'Thinking…' : '➤ Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

