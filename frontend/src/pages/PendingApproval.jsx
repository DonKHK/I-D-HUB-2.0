import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatCurrency, calculateIdeaHealth } from '../utils/helpers';
import { DEFAULT_AI_PROMPT } from '../utils/constants';
import Modal from '../components/Modal';

// Backend API base URL — uses Vite proxy (/api -> localhost:5000) by default
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

// Robust AI JSON parser — AI models often return malformed JSON (truncated strings,
// trailing commas, unescaped newlines, smart quotes, markdown fences).
const safeParseAiJson = (raw) => {
  let str = String(raw || '').trim();
  if (!str) throw new Error('AI 回傳內容為空。');

  // Remove markdown code fences (```json ... ``` or ``` ... ```)
  str = str.replace(/```(?:json)?/gi, '').trim();

  // Extract the first {...} to the last } — ignore surrounding prose
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    str = str.slice(firstBrace, lastBrace + 1).trim();
  }

  const fixTrailingCommas = (s) => s.replace(/,\s*([}\]])/g, '$1');

  // Repair literal newlines that appear inside JSON string values
  const repairRawNewlinesInStrings = (s) => {
    let fixed = '';
    let inString = false;
    let escape = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (inString) {
        if (escape) { fixed += ch; escape = false; }
        else if (ch === '\\') { fixed += ch; escape = true; }
        else if (ch === '"') { fixed += ch; inString = false; }
        else if (ch === '\n' || ch === '\r') { fixed += '\\n'; }
        else { fixed += ch; }
      } else {
        if (ch === '"') inString = true;
        fixed += ch;
      }
    }
    return fixed;
  };

  // Repair truncated JSON: count { vs } and close any unclosed strings
  const repairTruncated = (s) => {
    let fixed = '';
    let inString = false;
    let escape = false;
    let openBraces = 0;
    let openBrackets = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (inString) {
        if (escape) { fixed += ch; escape = false; }
        else if (ch === '\\') { fixed += ch; escape = true; }
        else if (ch === '"') { fixed += ch; inString = false; }
        else if (ch === '\n' || ch === '\r') { fixed += '\\n'; }
        else { fixed += ch; }
      } else {
        if (ch === '"') { inString = true; }
        else if (ch === '{') openBraces++;
        else if (ch === '}') openBraces = Math.max(0, openBraces - 1);
        else if (ch === '[') openBrackets++;
        else if (ch === ']') openBrackets = Math.max(0, openBrackets - 1);
        fixed += ch;
      }
    }
    // Close any unclosed string
    if (inString) {
      fixed += '"';
    }
    // Close any unclosed braces/brackets
    for (let i = 0; i < openBrackets; i++) fixed += ']';
    for (let i = 0; i < openBraces; i++) fixed += '}';
    return fixed;
  };

  const attempts = [
    () => JSON.parse(str),
    () => JSON.parse(fixTrailingCommas(str)),
    () => JSON.parse(fixTrailingCommas(repairRawNewlinesInStrings(str))),
    () => JSON.parse(fixTrailingCommas(str.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"'))),
    () => JSON.parse(fixTrailingCommas(repairRawNewlinesInStrings(str.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')))),
    // Truncation repair
    () => JSON.parse(fixTrailingCommas(repairRawNewlinesInStrings(repairTruncated(fixTrailingCommas(str))))),
    () => JSON.parse(fixTrailingCommas(repairRawNewlinesInStrings(repairTruncated(fixTrailingCommas(str.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')))))),
  ];

  for (const attempt of attempts) {
    try {
      const parsed = attempt();
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) { /* try next strategy */ }
  }

  throw new Error('AI 回傳嘅分析格式無效（可能被截斷）。請再試一次，或轉用其他 AI 模型。');
};

export default function PendingApproval({ onNavigate }) {
  const navigate = useNavigate();
  const {
    ideas,
    projects,
    settings,
    updateIdea,
    deleteIdea,
    permanentlyDeleteIdea,
    restoreIdea,
    approveIdea,
  } = useData();
  const { isSuperAdmin } = useAuth();

  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [permDeleteModal, setPermDeleteModal] = useState(null);
  const [softDeleteModal, setSoftDeleteModal] = useState(null);
  const [restoreModal, setRestoreModal] = useState(null);

  // AI Analysis state
  const [aiModal, setAiModal] = useState(null); // idea object when modal is open
  const [aiProvider, setAiProvider] = useState('openai'); // 'openai' | 'custom' | 'cloudflare'
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiEndpoint, setAiEndpoint] = useState('');
  const [aiModel, setAiModel] = useState('gpt-3.5-turbo');
  const [aiAccountId, setAiAccountId] = useState('');
  const [aiCloudflareToken, setAiCloudflareToken] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState(null);

  // View AI report modal
  const [viewAiModal, setViewAiModal] = useState(null);

  const pendingIdeas = useMemo(() => ideas.filter((i) => i.status === 'pending'), [ideas]);
  const approvedIdeas = useMemo(() => ideas.filter((i) => i.status === 'approved'), [ideas]);
  const rejectedIdeas = useMemo(() => ideas.filter((i) => i.status === 'rejected'), [ideas]);
  const deletedIdeas = useMemo(() => ideas.filter((i) => i.status === 'deleted'), [ideas]);

  const handleApprove = (id) => {
    approveIdea(id);
    setApproveModal(null);
  };

  const handleReject = (id) => {
    updateIdea(id, { status: 'rejected', rejectReason });
    setRejectModal(null);
    setRejectReason('');
  };

  const handlePermanentDelete = (id) => {
    permanentlyDeleteIdea(id);
    setPermDeleteModal(null);
  };

  const handleViewDetails = (id) => {
    navigate(`/idea-detail/${id}`);
  };

  const openAiModal = (idea) => {
    setAiModal(idea);
    setAiProvider('openai');
    setAiApiKey('');
    setAiEndpoint('');
    setAiModel('gpt-3.5-turbo');
    setAiAccountId('');
    setAiCloudflareToken('');
    setAiLoading(false);
    setAiError('');
    setAiResult(null);
  };

  const closeAiModal = () => {
    setAiModal(null);
    setAiLoading(false);
    setAiError('');
    setAiResult(null);
  };

  const openViewAiModal = (idea) => {
    setViewAiModal(idea);
  };

  const closeViewAiModal = () => {
    setViewAiModal(null);
  };

  const buildPrompt = (idea) => {
    // Use the user-customizable prompt from Settings, fall back to default
    const userPrompt = (settings && settings.aiPrompt) || DEFAULT_AI_PROMPT;

    return `${userPrompt}

Idea details:
- Title: ${idea.title || 'N/A'}
- Background: ${idea.background || 'N/A'}
- Pain Points: ${idea.painPoint || 'N/A'}
- Current Workarounds: ${idea.currentWorkarounds || 'N/A'}
- Scope: ${idea.projectScope || 'N/A'}
- Deliverables: ${idea.deliverables || 'N/A'}
- Benefits: ${idea.benefits || 'N/A'}
- Total Budget: ${idea.totalBudget || 'N/A'} (HKD)
- Fund Source: ${idea.fundSource || 'N/A'}
- Expected Start: ${idea.expectedStartDate || 'N/A'}
- Target Completion: ${idea.targetCompletionDate || 'N/A'}
- Resource Requirements: ${idea.resourceRequirements || 'N/A'}
- Cross-dept Assistance: ${idea.crossDeptAssistance || 'N/A'}
- Risks: ${idea.risks || 'N/A'}
- Expected Outcome: ${idea.expectedOutcome || 'N/A'}
- Tech Direction: ${idea.techDirection || 'N/A'}
- Innovation: ${idea.innovationElement || 'N/A'}
- Tech Requirements: ${idea.technicalRequirements || 'N/A'}

--- Output format requirement ---
After completing the analysis above, output a STRICT JSON object (no markdown, no code fences) with the following keys for the scorecard:
{
  "creativity": { "score": <1-10>, "comment": "..." },
  "marketDemand": { "score": <1-10>, "comment": "..." },
  "existingSolutions": { "score": <1-10>, "comment": "..." },
  "budgetFeasibility": { "score": <1-10>, "comment": "Is the budget realistic and sufficient?" },
  "timelineFeasibility": { "score": <1-10>, "comment": "Is the timeline realistic?" },
  "scopeClarity": { "score": <1-10>, "comment": "Are scope and deliverables clearly defined?" },
  "riskLevel": { "score": <1-10>, "comment": "Lower = riskier. Comment on risks." },
  "overallScore": <1-10>,
  "recommendation": "Approve | Conditional | Reject",
  "recommendationReason": "...",
  "summary": "..."
}`;
  };

  const runAiAnalysis = async () => {
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
    setAiResult(null);

    const idea = aiModal;
    const prompt = buildPrompt(idea);

    // 'contentKey' tells us where to read the AI response text from
    let responseContentKey = null;
    if (aiProvider === 'cloudflare') {
      responseContentKey = 'result.response';
    } else {
      responseContentKey = 'choices.0.message.content';
    }

    const cfModel = aiModel && aiModel.startsWith('@cf/') ? aiModel : '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';

    // Send the request through the backend proxy to avoid browser CORS / mixed-content restrictions
    try {
      const response = await fetch(`${API_BASE}/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: aiApiKey,
          endpoint: aiEndpoint,
          model: aiProvider === 'cloudflare' ? cfModel : aiModel,
          accountId: aiAccountId,
          token: aiCloudflareToken,
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
      if (aiProvider === 'cloudflare' && data.success === false) {
        const errMsg = data.errors?.[0]?.message || 'Cloudflare API error';
        throw new Error(errMsg);
      }

      // Extract the raw text content from the provider-specific response shape
      const content = responseContentKey
        ? responseContentKey.split('.').reduce((obj, key) => (obj == null ? undefined : obj[key]), data)
        : null;

      if (!content) {
        throw new Error('No response content from API.');
      }

      // Parse JSON from response — robust parser handles malformed AI output
      const parsed = safeParseAiJson(content);

      const analysis = {
        creativity: parsed.creativity || { score: 0, comment: '' },
        marketDemand: parsed.marketDemand || { score: 0, comment: '' },
        existingSolutions: parsed.existingSolutions || { score: 0, comment: '' },
        budgetFeasibility: parsed.budgetFeasibility || { score: 0, comment: '' },
        timelineFeasibility: parsed.timelineFeasibility || { score: 0, comment: '' },
        scopeClarity: parsed.scopeClarity || { score: 0, comment: '' },
        riskLevel: parsed.riskLevel || { score: 0, comment: '' },
        overallScore: parsed.overallScore || 0,
        recommendation: parsed.recommendation || '',
        recommendationReason: parsed.recommendationReason || '',
        summary: parsed.summary || '',
        analyzedAt: new Date().toISOString(),
        provider: aiProvider,
        model: aiProvider === 'cloudflare' ? (aiModel.startsWith('@cf/') ? aiModel : '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b') : aiModel,
      };

      // Save to idea
      updateIdea(idea.id, { aiAnalysis: analysis });
      setAiResult(analysis);
    } catch (err) {
      if (err?.message === 'Failed to fetch') {
        setAiError('無法連接到 AI 服務。請檢查網絡連線，並確認 backend server (port 5000) 已啟動。');
      } else {
        setAiError(err.message || 'Analysis failed. Please check your API settings and try again.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const renderIdeaCard = (idea, type) => {
    const health = calculateIdeaHealth(idea);
    const getStatusColor = () => {
      switch (type) {
        case 'pending': return '#f59e0b';
        case 'approved': return '#22c55e';
        case 'rejected': return '#ef4444';
        case 'deleted': return '#6b7280';
        default: return '#6b7280';
      }
    };

    return (
      <div key={idea.id} className={`approval-card approval-card--${type}`}>
        <div className="approval-card-header">
          <span className="health-dot" style={{ backgroundColor: health?.color || getStatusColor() }} />
          <span className={`status-badge status-badge--${type}`}>
            {type === 'pending' ? 'Pending' : type === 'approved' ? 'Approved' : type === 'rejected' ? 'Rejected' : 'Deleted'}
          </span>
        </div>
        <h3 className="approval-card-title">{idea.title || idea.projectTitle || 'Untitled'}</h3>
        <div className="approval-card-meta">
          <span
            className="approval-card-id-link"
            onClick={() => handleViewDetails(idea.id)}
            title="Click to view full details"
          >
            📋 {idea.id}
          </span>
          {type === 'approved' && (() => {
            const linkedProject = projects.find((p) => p.originalIdeaId === idea.id && !p._migratedTo);
            return linkedProject ? (
              <span className="approval-card-project-link" title="Linked project">
                🏗️ {linkedProject.id}
              </span>
            ) : null;
          })()}
          <span>👤 {idea.applicantName || idea.applicant || idea.ownerName || '-'}</span>
          <span>📅 {formatDate(idea.createdAt)}</span>
          {type === 'approved' && <span>⭐ Approved: {formatDateTime(idea.approvedAt)}</span>}
        </div>
        {idea.oneLineDesc && <p className="approval-card-desc">{idea.oneLineDesc}</p>}
        {idea.rejectReason && <p className="reject-reason">Reason: {idea.rejectReason}</p>}
        <div className="approval-card-actions">
          <button className="btn btn--small" onClick={() => handleViewDetails(idea.id)}>
            View Details
          </button>

          {type === 'pending' && isSuperAdmin && (
            <>
              {/* AI Analysis Button */}
              {idea.aiAnalysis ? (
                <button className="btn btn--small btn--ai" onClick={() => openViewAiModal(idea)} title="View AI Analysis Report">
                  📊 AI Report
                </button>
              ) : (
                <button className="btn btn--small btn--ai-outline" onClick={() => openAiModal(idea)} title="Run AI Analysis">
                  🤖 AI Analyze
                </button>
              )}
              <button className="btn btn--small btn--primary" onClick={() => setApproveModal(idea.id)}>
                Approve
              </button>
              <button className="btn btn--small btn--danger" onClick={() => setRejectModal(idea.id)}>
                Reject
              </button>
              <button className="btn btn--small btn--outline-danger" onClick={() => setSoftDeleteModal(idea.id)} title="Soft delete">
                🗑️
              </button>
            </>
          )}

          {(type === 'approved' || type === 'rejected') && isSuperAdmin && (
            <button className="btn btn--small btn--outline-danger" onClick={() => setSoftDeleteModal(idea.id)} title="Soft delete">
              🗑️
            </button>
          )}

          {type === 'deleted' && isSuperAdmin && (
            <>
              <button className="btn btn--small btn--primary" onClick={() => setRestoreModal(idea.id)}>
                Restore
              </button>
              <button className="btn btn--small btn--danger" onClick={() => setPermDeleteModal(idea.id)}>
                Permanently Delete
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (title, ideas, type) => (
    <div className="dashboard-card">
      <h2 className="dashboard-card-title">
        {title} ({ideas.length})
      </h2>
      {ideas.length === 0 && <p className="empty-text">No {title.toLowerCase()}</p>}
      {ideas.map((idea) => renderIdeaCard(idea, type))}
    </div>
  );

  // Render AI report content
  const renderAiReport = (analysis) => {
    if (!analysis) return null;
    const { creativity, marketDemand, existingSolutions, budgetFeasibility, timelineFeasibility, scopeClarity, riskLevel, overallScore, recommendation, recommendationReason, summary, analyzedAt, provider, model } = analysis;

    const scoreBar = (score) => {
      const pct = Math.min(100, Math.max(0, score * 10));
      return (
        <div className="ai-score-bar-wrapper">
          <div className="ai-score-bar-bg">
            <div className="ai-score-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="ai-score-value">{score}/10</span>
        </div>
      );
    };

    const scoreItem = (label, item) =>
      item && (
        <div className="ai-score-item">
          <label>{label}</label>
          {scoreBar(item.score || 0)}
          {item.comment && <p className="ai-score-comment">{item.comment}</p>}
        </div>
      );

    const recommendationColor = !recommendation ? '#6b7280' : recommendation === 'Approve' ? '#22c55e' : recommendation === 'Conditional' ? '#eab308' : '#ef4444';

    return (
      <div className="ai-report">
        <div className="ai-report-meta">
          {analyzedAt && <span className="ai-report-date">Analyzed: {formatDateTime(analyzedAt)}</span>}
          {provider && <span className="ai-report-provider">Provider: {provider}{model ? ` / ${model}` : ''}</span>}
        </div>

        <div className="ai-score-grid">
          {scoreItem('Creativity', creativity)}
          {scoreItem('Market Demand', marketDemand)}
          {scoreItem('Existing Solutions', existingSolutions)}
          {scoreItem('Budget Feasibility', budgetFeasibility)}
          {scoreItem('Timeline Feasibility', timelineFeasibility)}
          {scoreItem('Scope Clarity', scopeClarity)}
          {scoreItem('Risk Level (higher = safer)', riskLevel)}
        </div>

        <div className="ai-overall-score">
          <span className="ai-overall-label">Overall Score</span>
          <span className="ai-overall-value">{overallScore}/10</span>
        </div>

        {recommendation && (
          <div className="ai-recommendation" style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: `${recommendationColor}15`, borderLeft: `4px solid ${recommendationColor}` }}>
            <span className="ai-recommendation-label" style={{ fontWeight: 700, color: recommendationColor, marginRight: '0.5rem' }}>
              Recommendation:
            </span>
            <span style={{ fontWeight: 600, color: recommendationColor }}>{recommendation}</span>
            {recommendationReason && <p style={{ marginTop: '0.4rem', color: '#475569', fontSize: '0.9rem' }}>{recommendationReason}</p>}
          </div>
        )}

        {summary && (
          <div className="ai-summary">
            <h5>Summary</h5>
            <p>{summary}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <h1 className="page-title">Pending Approval</h1>

      <div className="approval-sections">
        {renderSection('Pending Review', pendingIdeas, 'pending')}
        {renderSection('Approved', approvedIdeas, 'approved')}
        {renderSection('Rejected', rejectedIdeas, 'rejected')}
        {renderSection('Deleted', deletedIdeas, 'deleted')}
      </div>

      {/* AI Analysis Modal */}
      <Modal isOpen={!!aiModal && !aiResult} onClose={closeAiModal} title="AI Analysis">
        <p style={{ marginBottom: '1rem', color: '#475569', fontSize: '0.9rem' }}>
          Select your AI provider and enter credentials. Your API key is used only for this request and is not stored.
        </p>

        {/* Provider Selection */}
        <div className="form-group">
          <label>AI Provider</label>
          <div className="ai-provider-tabs">
            <button
              className={`ai-provider-tab ${aiProvider === 'openai' ? 'active' : ''}`}
              onClick={() => setAiProvider('openai')}
            >
              OpenAI
            </button>
            <button
              className={`ai-provider-tab ${aiProvider === 'custom' ? 'active' : ''}`}
              onClick={() => setAiProvider('custom')}
            >
              Custom (OpenAI-compatible)
            </button>
            <button
              className={`ai-provider-tab ${aiProvider === 'cloudflare' ? 'active' : ''}`}
              onClick={() => {
                setAiProvider('cloudflare');
                // Default to DeepSeek on Cloudflare if no @cf/ model is set
                setAiModel((m) => (m && m.startsWith('@cf/') ? m : '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'));
              }}
            >
              Cloudflare AI
            </button>
          </div>
        </div>

        {/* Cloudflare provider fields */}
        {aiProvider === 'cloudflare' ? (
          <>
            <div className="form-group">
              <label>Cloudflare Account ID</label>
              <input
                type="text"
                className="form-input"
                value={aiAccountId}
                onChange={(e) => setAiAccountId(e.target.value)}
                placeholder="e.g. 1a2b3c4d5e6f..."
              />
              <p className="form-hint">Cloudflare Dashboard → 右邊 Overview → Account ID</p>
            </div>
            <div className="form-group">
              <label>Cloudflare API Token</label>
              <input
                type="password"
                className="form-input"
                value={aiCloudflareToken}
                onChange={(e) => setAiCloudflareToken(e.target.value)}
                placeholder="Enter your Workers AI API Token"
              />
              <p className="form-hint">My Profile → API Tokens → Create Token (揀 Workers AI 權限)</p>
            </div>
            <div className="form-group">
              <label>Model Name</label>
              <input
                type="text"
                className="form-input"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="@cf/deepseek-ai/deepseek-r1-distill-qwen-32b"
              />
              <p className="form-hint">預設 @cf/deepseek-ai/deepseek-r1-distill-qwen-32b，可改其他 Workers AI model</p>
            </div>
          </>
        ) : (
          <>
            {/* API Key (OpenAI / Custom) */}
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                className="form-input"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder={aiProvider === 'openai' ? 'sk-...' : 'Enter your API key (leave empty if not required)'}
              />
            </div>

            {/* Custom provider fields */}
            {aiProvider === 'custom' && (
              <>
                <div className="form-group">
                  <label>API Endpoint URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={aiEndpoint}
                    onChange={(e) => setAiEndpoint(e.target.value)}
                    placeholder="e.g. http://localhost:11434/v1/chat/completions"
                  />
                  <p className="form-hint">Full URL including /chat/completions path</p>
                </div>
                <div className="form-group">
                  <label>Model Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    placeholder="e.g. gpt-3.5-turbo, llama3, mistral"
                  />
                </div>
              </>
            )}

            {aiProvider === 'openai' && (
              <div className="form-group">
                <label>Model Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder="gpt-3.5-turbo"
                />
              </div>
            )}
          </>
        )}

        {aiError && <p className="form-error">{aiError}</p>}

        <div className="modal-actions">
          <button className="btn btn--outline" onClick={closeAiModal} disabled={aiLoading}>Cancel</button>
          <button className="btn btn--primary" onClick={runAiAnalysis} disabled={aiLoading}>
            {aiLoading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </Modal>

      {/* AI Result Modal */}
      <Modal isOpen={!!aiResult} onClose={closeAiModal} title="AI Analysis Result">
        {aiResult && renderAiReport(aiResult)}
        <div className="modal-actions" style={{ marginTop: '1rem' }}>
          <button className="btn btn--primary" onClick={closeAiModal}>Done</button>
        </div>
      </Modal>

      {/* View Existing AI Report Modal */}
      <Modal isOpen={!!viewAiModal} onClose={closeViewAiModal} title={`AI Report - ${viewAiModal?.id || ''}`}>
        {viewAiModal?.aiAnalysis && renderAiReport(viewAiModal.aiAnalysis)}
        {!viewAiModal?.aiAnalysis && <p className="empty-text">No AI analysis report available.</p>}
        <div className="modal-actions" style={{ marginTop: '1rem' }}>
          <button className="btn btn--primary" onClick={closeViewAiModal}>Close</button>
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal isOpen={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Idea">
        <p>Are you sure you want to approve this idea? A new project will be created from it.</p>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setApproveModal(null)}>Cancel</button>
          <button className="btn btn--primary" onClick={() => handleApprove(approveModal)}>Approve</button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Idea">
        <div className="form-group">
          <label>Reason for rejection</label>
          <textarea rows="3" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Provide a reason..." />
        </div>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setRejectModal(null)}>Cancel</button>
      <button className="btn btn--danger" onClick={() => handleReject(rejectModal)} disabled={!String(rejectReason || '').trim()}>
            Reject
          </button>
        </div>
      </Modal>

      {/* Soft Delete (Trash) Modal */}
      <Modal isOpen={!!softDeleteModal} onClose={() => setSoftDeleteModal(null)} title="Move to Trash">
        <p>Are you sure you want to move this idea to trash?</p>
        <p className="text-muted" style={{ marginTop: '0.25rem' }}>It can be restored later from the Deleted section.</p>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setSoftDeleteModal(null)}>Cancel</button>
          <button className="btn btn--primary" onClick={() => { deleteIdea(softDeleteModal); setSoftDeleteModal(null); }}>Move to Trash</button>
        </div>
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal isOpen={!!restoreModal} onClose={() => setRestoreModal(null)} title="Restore Idea">
        <p>Are you sure you want to restore this idea? It will be moved back to Pending Review.</p>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setRestoreModal(null)}>Cancel</button>
          <button className="btn btn--primary" onClick={() => { restoreIdea(restoreModal); setRestoreModal(null); }}>Restore</button>
        </div>
      </Modal>

      {/* Permanently Delete Modal */}
      <Modal isOpen={!!permDeleteModal} onClose={() => setPermDeleteModal(null)} title="Permanently Delete Idea">
        <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem' }}>
          ⚠️ This action cannot be undone!
        </p>
        <p>Are you sure you want to permanently delete this idea? It will be removed from the system entirely.</p>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setPermDeleteModal(null)}>Cancel</button>
          <button className="btn btn--danger" onClick={() => handlePermanentDelete(permDeleteModal)}>
            Permanently Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}