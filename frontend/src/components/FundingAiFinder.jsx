import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

// Backend API base URL - uses Vite proxy (/api -> localhost:5000) by default
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

// AI credentials are remembered ONLY on the user's own browser (localStorage).
// They are never uploaded to Firestore or the backend.
const STORAGE_KEY = 'pmis_funding_ai_config';

const readSavedConfig = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {};
  } catch (e) {
    return {};
  }
};

/**
 * Robustly parse the AI response into an array of funding-scheme objects.
 * Handles markdown fences, surrounding prose and trailing commas.
 */
function parseFundingSchemes(raw) {
  let str = String(raw || '').trim();
  if (!str) throw new Error('AI 回傳內容為空。');

  // Strip markdown code fences
  str = str.replace(/```(?:json)?/gi, '').trim();

  // Prefer the JSON array; otherwise accept an object like { schemes: [...] }
  const firstBracket = str.indexOf('[');
  const lastBracket = str.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    str = str.slice(firstBracket, lastBracket + 1).trim();
  }

  // Fix trailing commas left by some AI models
  str = str.replace(/,\s*([}\]])/g, '$1');

  let data;
  try {
    data = JSON.parse(str);
  } catch (e) {
    throw new Error('AI 回傳內容無法解析為 Funding 資料，請再試一次。');
  }

  const list = Array.isArray(data)
    ? data
    : data && Array.isArray(data.schemes)
      ? data.schemes
      : null;
  if (!list) throw new Error('AI 回傳內容格式不正確（預期 JSON array）。');

  return list
    .filter((s) => s && String(s.name || '').trim())
    .map((s, i) => ({
      key: `cand-${Date.now()}-${i}`,
      name: String(s.name || '').trim(),
      provider: String(s.provider || '').trim() || 'Government / 政府部門',
      totalAmount: Number(s.totalAmount) || 0,
      description: String(s.description || '').trim(),
      eligibility: String(s.eligibility || '').trim(),
      deadline: String(s.deadline || '').trim(),
      status: ['Open', 'Closed', 'Pending'].includes(String(s.status || '').trim())
        ? String(s.status).trim()
        : 'Open',
      matchReason: String(s.matchReason || s.reason || '').trim(),
    }));
}
const DEFAULT_MODEL = {
  openai: 'gpt-3.5-turbo',
  custom: 'gpt-3.5-turbo',
  cloudflare: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
};

const money = (v) => `HK$${Number(v || 0).toLocaleString()}`;
const short = (s, n = 200) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

export default function FundingAiFinder() {
  const { projects, ideas, fundingSchemes, addFundingScheme } = useData();
  const { isSuperAdmin } = useAuth();

  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState(() => readSavedConfig().provider || 'openai');
  const [apiKey, setApiKey] = useState(() => readSavedConfig().apiKey || '');
  const [endpoint, setEndpoint] = useState(() => readSavedConfig().endpoint || '');
  const [model, setModel] = useState(() => {
    const saved = readSavedConfig();
    return saved.model || DEFAULT_MODEL[saved.provider || 'openai'] || DEFAULT_MODEL.openai;
  });
  const [accountId, setAccountId] = useState(() => readSavedConfig().accountId || '');
  const [token, setToken] = useState(() => readSavedConfig().token || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetDone, setResetDone] = useState(false);

  // Persist credentials on the user's OWN browser so they only have to enter them once.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider, apiKey, endpoint, model, accountId, token }));
    } catch (e) { /* storage may be unavailable — ignore */ }
  }, [provider, apiKey, endpoint, model, accountId, token]);

  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [adding, setAdding] = useState(false);
  const [doneInfo, setDoneInfo] = useState(null);

  if (!isSuperAdmin) return null;

  const openModal = () => {
    const saved = readSavedConfig();
    setOpen(true);
    setProvider(saved.provider || 'openai');
    setApiKey(saved.apiKey || '');
    setEndpoint(saved.endpoint || '');
    setModel(saved.model || DEFAULT_MODEL[saved.provider || 'openai'] || DEFAULT_MODEL.openai);
    setAccountId(saved.accountId || '');
    setToken(saved.token || '');
    setLoading(false);
    setError('');
    setResetDone(false);
    setCandidates([]);
    setSelected([]);
  };

  const closeModal = () => {
    setOpen(false);
    setLoading(false);
    setError('');
  };

  const pickProvider = (p) => {
    setProvider(p);
    if (p === 'cloudflare') {
      setModel((m) => (m && m.startsWith('@cf/') ? m : DEFAULT_MODEL.cloudflare));
    } else {
      setModel(DEFAULT_MODEL[p] || DEFAULT_MODEL.openai);
    }
  };

  const resetSavedKey = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    setProvider('openai');
    setApiKey('');
    setEndpoint('');
    setModel(DEFAULT_MODEL.openai);
    setAccountId('');
    setToken('');
    setResetDone(true);
    window.setTimeout(() => setResetDone(false), 2500);
  };

  const buildPrompt = () => {
    const projectLines = projects
      .slice(0, 30)
      .map((p) => `- ${p.id} | ${short(p.name, 120)} | status=${p.status || 'Planning'} | budget=${money(p.budget)} | currentFund=${short(p.governmentGrant || p.fundSource || 'N/A', 100)} | ${short(p.description || '')}`)
      .join('\n');
    const ideaLines = ideas
      .filter((i) => i.status !== 'deleted')
      .slice(0, 30)
      .map((i) => `- ${i.id} | ${short(i.title || i.projectTitle || 'Untitled', 120)} | type=${short(i.projectType || i.ideaType || 'N/A', 60)} | budget=${money(i.totalBudget)} | fundSource=${short(i.fundSource || 'N/A', 100)} | ${short(i.oneLineDesc || i.background || '')}`)
      .join('\n');
    const existingNames = fundingSchemes.map((s) => String(s.name || '').trim()).filter(Boolean).join('\n');

    return `You are a Hong Kong government funding advisor. Based on the company's projects and innovation ideas below, recommend suitable Hong Kong government / quasi-government funding schemes (e.g. ITC, DEVB, CIC, HKPC, HKSTP, Cyberport programmes, etc.) that fit the work.

FUNDING SCHEMES ALREADY IN THE SYSTEM (do NOT recommend these again; look for OTHER suitable schemes):
${existingNames || '(none)'}

COMPANY PROJECTS:
${projectLines || '(none)'}

INNOVATION IDEAS:
${ideaLines || '(none)'}

TASK:
Recommend at most 8 of the most suitable funding schemes, ordered by best fit. For each scheme return ONE object in a STRICT JSON array (no markdown, no prose, no code fences) with exactly these keys:
{
  "name": "Official scheme name (English + Chinese if known)",
  "provider": "Administering body, e.g. Innovation and Technology Commission (ITC)",
  "totalAmount": <max funding per project in HKD as a number; use 0 if unknown>,
  "description": "2-3 sentence summary of the scheme",
  "eligibility": "Who is eligible (companies / industries / requirements)",
  "deadline": "YYYY-MM-DD if there is a closing date, or empty string if rolling / unknown",
  "status": "Open | Closed | Pending",
  "matchReason": "Briefly explain why this scheme fits the company's projects/ideas"
}

Only output the JSON array - no extra text. Facts that cannot be confirmed should be marked inside the description as "please verify".`;
  };
  const runSearch = async () => {
    if (provider === 'cloudflare') {
      if (!String(accountId || '').trim()) {
        setError('Please enter your Cloudflare Account ID.');
        return;
      }
      if (!String(token || '').trim()) {
        setError('Please enter your Cloudflare API Token.');
        return;
      }
    } else if (provider === 'custom' && !String(endpoint || '').trim()) {
      setError('Please enter an API endpoint URL.');
      return;
    } else if (!String(apiKey || '').trim()) {
      setError('Please enter an API Key.');
      return;
    }

    setLoading(true);
    setError('');

    const cfModel = model && model.startsWith('@cf/') ? model : DEFAULT_MODEL.cloudflare;

    try {
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
          prompt: buildPrompt(),
          jsonMode: true,
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

      if (provider === 'cloudflare' && data.success === false) {
        const errMsg = data.errors?.[0]?.message || 'Cloudflare API error';
        throw new Error(errMsg);
      }

      const contentKey = provider === 'cloudflare' ? 'result.response' : 'choices.0.message.content';
      const content = contentKey.split('.').reduce((o, k) => (o == null ? undefined : o[k]), data);
      if (!content) throw new Error('No response content from API.');

      const list = parseFundingSchemes(content);
      if (list.length === 0) throw new Error('AI 冇搵到 funding scheme，請再試一次。');

      // Flag candidates that already exist in the list (by name)
      const existing = new Set(fundingSchemes.map((s) => String(s.name || '').trim().toLowerCase()));
      const flagged = list.map((c) => ({ ...c, exists: existing.has(c.name.toLowerCase()) }));

      setSelected([]);
      setCandidates(flagged);
    } catch (err) {
      if (err?.message === 'Failed to fetch') {
        setError('無法連接到 AI 服務。請檢查網絡連線，並確認 backend server (port 5000) 已啟動。');
      } else {
        setError(err.message || 'Search failed. Please check your API settings and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (key) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const addSelected = async () => {
    const toAdd = candidates.filter((c) => selected.includes(c.key) && !c.exists);
    if (toAdd.length === 0) return;

    setAdding(true);
    setError('');
    let ok = 0;
    for (const c of toAdd) {
      try {
        await addFundingScheme({
          name: c.name,
          provider: c.provider,
          totalAmount: c.totalAmount || 0,
          description: c.description || '',
          eligibility: c.eligibility || '',
          deadline: c.deadline || '',
          status: c.status,
        });
        ok += 1;
      } catch (e) {
        console.error('Add funding scheme failed:', e);
      }
    }
    setAdding(false);
    setOpen(false);
    setCandidates([]);
    setSelected([]);
    setDoneInfo({ added: ok, skipped: toAdd.length - ok });
  };

  const selectedAddable = candidates.filter((c) => selected.includes(c.key) && !c.exists);
  return (
    <>
      <button
        type="button"
        className="btn btn--primary"
        onClick={openModal}
        title="Let AI find suitable government funding schemes"
        style={{ marginRight: '0.5rem' }}
      >
        🤖 AI Funding Finder
      </button>

      <Modal isOpen={open} onClose={closeModal} title="AI Funding Finder">
        {candidates.length === 0 ? (
          <>
            <p style={{ marginBottom: '1rem', color: '#475569', fontSize: '0.9rem' }}>
              AI 會根據 Hub 入面嘅 Projects & Ideas 幫你搵合適嘅政府 Funding。
              揀 AI provider 同輸入憑證後按「搵 Funding」。💾 API Key / Account ID 會儲存喺你部機嘅瀏覽器(localStorage),
              下次唔使再輸入,亦唔會上傳去 Firebase。
            </p>

            <div className="form-group">
              <label>AI Provider</label>
              <div className="ai-provider-tabs">
                {['openai', 'custom', 'cloudflare'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`ai-provider-tab ${provider === p ? 'active' : ''}`}
                    onClick={() => pickProvider(p)}
                  >
                    {p === 'openai' ? 'OpenAI' : p === 'custom' ? 'Custom (OpenAI-compatible)' : 'Cloudflare AI'}
                  </button>
                ))}
              </div>
            </div>

            {provider === 'cloudflare' ? (
              <>
                <div className="form-group">
                  <label>Cloudflare Account ID</label>
                  <input type="text" className="form-input" value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="e.g. 1a2b3c4d5e6f..." />
                  <p className="form-hint">Cloudflare Dashboard → 右邊 Overview → Account ID</p>
                </div>
                <div className="form-group">
                  <label>Cloudflare API Token</label>
                  <input type="password" className="form-input" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter your Workers AI API Token" />
                  <p className="form-hint">My Profile → API Tokens → Create Token (揀 Workers AI 權限)</p>
                </div>
                <div className="form-group">
                  <label>Model Name</label>
                  <input type="text" className="form-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="@cf/deepseek-ai/deepseek-r1-distill-qwen-32b" />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>API Key</label>
                  <input type="password" className="form-input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={provider === 'openai' ? 'sk-...' : 'Enter your API key (leave empty if not required)'} />
                </div>
                {provider === 'custom' && (
                  <>
                    <div className="form-group">
                      <label>API Endpoint URL</label>
                      <input type="text" className="form-input" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="e.g. http://localhost:11434/v1/chat/completions" />
                      <p className="form-hint">Full URL including /chat/completions path</p>
                    </div>
                    <div className="form-group">
                      <label>Model Name</label>
                      <input type="text" className="form-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. gpt-3.5-turbo, llama3, mistral" />
                    </div>
                  </>
                )}
                {provider === 'openai' && (
                  <div className="form-group">
                    <label>Model Name</label>
                    <input type="text" className="form-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-3.5-turbo" />
                  </div>
                )}
              </>
            )}

            <div className="funding-ai-key-actions">
              <span className="form-hint" style={{ margin: 0 }}>
                💾 API Key / Account ID 已儲存喺你部機嘅瀏覽器。
              </span>
              <button type="button" className="btn btn--small btn--outline-danger" onClick={resetSavedKey}>
                🗑 Reset Saved Key
              </button>
            </div>
            {resetDone && (
              <p className="form-hint" style={{ color: '#059669' }}>已清除本機儲存嘅 API Key / Account ID。</p>
            )}

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button className="btn btn--outline" onClick={closeModal} disabled={loading}>Cancel</button>
              <button className="btn btn--primary" onClick={runSearch} disabled={loading}>
                {loading ? 'Searching...' : '🔍 搵 Funding'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="funding-ai-result-header">
              <span className="funding-ai-result-title">🎯 建議 {candidates.length} 個 funding scheme — 揀你想加入嘅</span>
              <button type="button" className="btn btn--small btn--outline" onClick={() => { setCandidates([]); setSelected([]); }}>← 再搜過</button>
            </div>
            <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
              AI 內容只供參考；加入後可用卡片上嘅 Edit 修改細節。
            </p>
            <div className="funding-ai-result-list">
              {candidates.map((c) => (
                <div key={c.key} className={`scheme-card funding-ai-result-item${c.exists ? ' funding-ai-result-item--exists' : ''}`}>
                  <div className="scheme-card-header">
                    <label className="funding-ai-result-check" title={c.exists ? '已存在' : '選擇加入'}>
                      <input type="checkbox" checked={!c.exists && selected.includes(c.key)} disabled={c.exists} onChange={() => toggleSelect(c.key)} />
                    </label>
                    <h3>{c.name}</h3>
                    <span className={`status-badge status-badge--small ${c.status === 'Open' ? 'status-badge--approved' : 'status-badge--rejected'}`}>
                      {c.exists ? '已存在' : c.status}
                    </span>
                  </div>
                  <p className="scheme-provider">{c.provider}</p>
                  <p className="scheme-desc">{c.description}</p>
                  {c.matchReason && <p className="funding-ai-match"><strong>點解啱：</strong>{c.matchReason}</p>}
                  <div className="scheme-details">
                    <div className="scheme-detail">
                      <label>Total Amount</label>
                      <span>{c.totalAmount > 0 ? money(c.totalAmount) : '不確定 / 0'}</span>
                    </div>
                    <div className="scheme-detail">
                      <label>Eligibility</label>
                      <span>{c.eligibility || '—'}</span>
                    </div>
                    <div className="scheme-detail">
                      <label>Deadline</label>
                      <span>{c.deadline || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button className="btn btn--outline" onClick={closeModal} disabled={adding}>Close</button>
              <button className="btn btn--primary" onClick={addSelected} disabled={adding || selectedAddable.length === 0}>
                {adding ? '加入中...' : `➕ 加入所選 (${selectedAddable.length})`}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={!!doneInfo} onClose={() => setDoneInfo(null)} title="AI Funding Finder">
        {doneInfo && (
          <>
            <p style={{ fontSize: '1rem' }}>
              ✅ 已成功加入 <strong>{doneInfo.added}</strong> 個 funding scheme。
            </p>
            {doneInfo.skipped > 0 && (
              <p className="form-hint">{doneInfo.skipped} 個因寫入失敗而跳過，可以㩒 Edit 手動補返。</p>
            )}
            <p className="form-hint">新加入嘅 scheme 已經顯示喺下面 Funding Schemes 列表。</p>
            <div className="modal-actions">
              <button className="btn btn--primary" onClick={() => setDoneInfo(null)}>Done</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
