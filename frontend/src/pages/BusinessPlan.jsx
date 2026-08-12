import React, { useState, useEffect, useMemo } from 'react';
import {
  BUSINESS_PLAN_QUESTIONS,
  buildBusinessPlanPrompt,
} from '../utils/businessPlanQuestions';
import { useData } from '../context/DataContext';
import { callAi } from '../utils/aiCall';

const DRAFT_KEY = 'pmis_business_plan_draft';
const RESULT_KEY = 'pmis_business_plan_result';

const PROVIDERS = [
  { key: 'openai', label: 'OpenAI' },
  { key: 'custom', label: 'Custom' },
  { key: 'cloudflare', label: 'Cloudflare' },
];

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function loadResult() {
  try {
    return localStorage.getItem(RESULT_KEY) || '';
  } catch (e) {
    return '';
  }
}

export default function BusinessPlan() {
  const { settings } = useData();
  const [answers, setAnswers] = useState(loadDraft);
  const [result, setResult] = useState(loadResult);

  // AI settings
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiEndpoint, setAiEndpoint] = useState('');
  const [aiModel, setAiModel] = useState('gpt-3.5-turbo');
  const [aiAccountId, setAiAccountId] = useState('');
  const [aiCloudflareToken, setAiCloudflareToken] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Save draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
    } catch (e) { /* ignore */ }
  }, [answers]);

  // Save result on every change
  useEffect(() => {
    try {
      localStorage.setItem(RESULT_KEY, result);
    } catch (e) { /* ignore */ }
  }, [result]);

  const handleAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const answeredCount = BUSINESS_PLAN_QUESTIONS.filter((q) => (answers[q.id] || '').trim()).length;
  const progress = Math.round((answeredCount / BUSINESS_PLAN_QUESTIONS.length) * 100);

  // Group questions by section, preserving section order
  const sections = useMemo(() => {
    const map = {};
    const order = [];
    BUSINESS_PLAN_QUESTIONS.forEach((q) => {
      if (!map[q.section]) {
        map[q.section] = [];
        order.push(q.section);
      }
      map[q.section].push(q);
    });
    return order.map((s) => ({ section: s, questions: map[s] }));
  }, []);

  const runGenerate = async () => {
    // Provider-specific validation
    if (aiProvider === 'cloudflare') {
      if (!String(aiAccountId || '').trim()) {
        setAiError('Please enter your Cloudflare Account ID.');
        return;
      }
      if (!String(aiCloudflareToken || '').trim()) {
        setAiError('Please enter your Cloudflare API Token.');
        return;
      }
    } else {
      if (!String(aiApiKey || '').trim()) {
        setAiError('Please enter an API Key.');
        return;
      }
      if (aiProvider === 'custom' && !String(aiEndpoint || '').trim()) {
        setAiError('Please enter an API endpoint URL.');
        return;
      }
    }

    setAiLoading(true);
    setAiError('');
    setResult('');

    const prompt = buildBusinessPlanPrompt(answers, settings?.businessPlanAiPrompt);

    try {
      const content = await callAi({
        provider: aiProvider,
        apiKey: aiApiKey,
        endpoint: aiEndpoint,
        model: aiModel,
        accountId: aiAccountId,
        token: aiCloudflareToken,
        prompt,
      });
      setResult(content);
    } catch (err) {
      if (err?.message === 'Failed to fetch') {
        setAiError('無法連接到 AI 服務。請檢查網絡連線，並確認 backend server (port 5000) 已啟動。');
      } else {
        setAiError(err.message || 'Generation failed. Please check your API settings and try again.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setResult('');
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(RESULT_KEY);
    } catch (e) { /* ignore */ }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      alert('Business plan copied to clipboard!');
    } catch (e) {
      alert('Copy failed — please select the text manually.');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-plan-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">📈 Business Plan Generator</h1>
      </div>
      <p className="page-subtitle">
        Answer the guided questions below, then click Generate — AI will turn your answers into a complete business plan.
      </p>

      <div className="business-plan-progress">
        <div className="business-plan-progress-text">
          Answered <strong>{answeredCount}</strong> / {BUSINESS_PLAN_QUESTIONS.length} questions
        </div>
        <div className="business-plan-progress-bar">
          <div className="business-plan-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Questions */}
      <div className="card business-plan-questions">
        {sections.map(({ section, questions }) => (
          <div key={section} className="business-plan-section">
            <h3 className="business-plan-section-title">{section}</h3>
            {questions.map((q) => (
              <div key={q.id} className="form-group">
                <label className="form-label">{q.label}</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder={q.placeholder}
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* AI Settings */}
      <div className="card business-plan-ai">
        <h3 className="business-plan-section-title">🤖 AI Settings</h3>
        <p className="settings-section-desc">
          Choose your AI provider and enter your key. The plan is generated in the same language as your answers.
        </p>

        <div className="ai-provider-tabs">
          {PROVIDERS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`ai-provider-tab ${aiProvider === p.key ? 'active' : ''}`}
              onClick={() => setAiProvider(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {aiProvider === 'cloudflare' && (
          <>
            <div className="form-group">
              <label className="form-label">Cloudflare Account ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="Your Cloudflare Account ID"
                value={aiAccountId}
                onChange={(e) => setAiAccountId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cloudflare API Token</label>
              <input
                type="password"
                className="form-input"
                placeholder="Your Cloudflare API Token"
                value={aiCloudflareToken}
                onChange={(e) => setAiCloudflareToken(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                type="text"
                className="form-input"
                placeholder="@cf/deepseek-ai/deepseek-r1-distill-qwen-32b"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              />
            </div>
          </>
        )}

        {aiProvider !== 'cloudflare' && (
          <>
            <div className="form-group">
              <label className="form-label">API Key</label>
              <input
                type="password"
                className="form-input"
                placeholder={aiProvider === 'openai' ? 'sk-...' : 'Enter your API key (leave empty if not required)'}
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
              />
            </div>
            {aiProvider === 'custom' && (
              <div className="form-group">
                <label className="form-label">API Endpoint URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://your-api.com/v1/chat/completions"
                  value={aiEndpoint}
                  onChange={(e) => setAiEndpoint(e.target.value)}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Model Name</label>
              <input
                type="text"
                className="form-input"
                placeholder={aiProvider === 'openai' ? 'gpt-3.5-turbo' : 'e.g. gpt-3.5-turbo, llama3, mistral'}
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              />
            </div>
          </>
        )}

        {aiError && <div className="alert alert--warning">{aiError}</div>}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn btn--primary"
            onClick={runGenerate}
            disabled={aiLoading}
          >
            {aiLoading ? 'Generating...' : '🤖 Generate Business Plan'}
          </button>
          <button className="btn btn--secondary" onClick={handleReset} disabled={aiLoading}>
            Reset
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card business-plan-result">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="business-plan-section-title" style={{ margin: 0 }}>📄 Your Business Plan</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn--secondary" onClick={handleCopy}>📋 Copy</button>
              <button className="btn btn--secondary" onClick={handleDownload}>⬇️ Download .txt</button>
              <button className="btn btn--secondary" onClick={() => window.print()}>🖨️ Print</button>
            </div>
          </div>
          <textarea
            className="form-input business-plan-result-text"
            rows={24}
            value={result}
            onChange={(e) => setResult(e.target.value)}
          />
          <p className="business-plan-result-hint">
            💡 The text above is editable — tweak it, then copy / download / print.
          </p>
        </div>
      )}
    </div>
  );
}
