import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatCurrency, calculateIdeaHealth } from '../utils/helpers';
import Modal from '../components/Modal';

export default function PendingApproval({ onNavigate }) {
  const navigate = useNavigate();
  const {
    ideas,
    projects,
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
  const [aiProvider, setAiProvider] = useState('openai'); // 'openai' | 'custom'
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiEndpoint, setAiEndpoint] = useState('');
  const [aiModel, setAiModel] = useState('gpt-3.5-turbo');
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
    return `You are an AI project evaluation assistant. Analyze the following project idea and return a JSON object (no markdown, no code fences) with the following keys:

{
  "creativity": { "score": <1-10>, "comment": "..." },
  "marketDemand": { "score": <1-10>, "comment": "..." },
  "existingSolutions": { "score": <1-10>, "comment": "..." },
  "feasibility": { "score": <1-10>, "comment": "..." },
  "overallScore": <1-10>,
  "summary": "..."
}

Idea details:
- Title: ${idea.title || 'N/A'}
- Background: ${idea.background || 'N/A'}
- Pain Points: ${idea.painPoint || 'N/A'}
- Current Workarounds: ${idea.currentWorkarounds || 'N/A'}
- Scope: ${idea.projectScope || 'N/A'}
- Deliverables: ${idea.deliverables || 'N/A'}
- Benefits: ${idea.benefits || 'N/A'}
- Budget: ${idea.totalBudget || 'N/A'}
- Tech Direction: ${idea.techDirection || 'N/A'}
- Innovation: ${idea.innovationElement || 'N/A'}`;
  };

  const runAiAnalysis = async () => {
    if (!aiApiKey.trim()) {
      setAiError('Please enter an API Key.');
      return;
    }
    if (aiProvider === 'custom' && !aiEndpoint.trim()) {
      setAiError('Please enter an API endpoint URL.');
      return;
    }

    setAiLoading(true);
    setAiError('');
    setAiResult(null);

    const idea = aiModal;
    const prompt = buildPrompt(idea);

    let url, headers, body;

    if (aiProvider === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`,
      };
      body = {
        model: aiModel || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      };
    } else {
      // Custom (OpenAI-compatible)
      url = aiEndpoint;
      headers = {
        'Content-Type': 'application/json',
        ...(aiApiKey.trim() ? { 'Authorization': `Bearer ${aiApiKey}` } : {}),
      };
      body = {
        model: aiModel || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from API.');
      }

      // Parse JSON from response - handle potential markdown fences
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```(json)?/g, '').trim();
      }
      const parsed = JSON.parse(jsonStr);

      const analysis = {
        creativity: parsed.creativity || { score: 0, comment: '' },
        marketDemand: parsed.marketDemand || { score: 0, comment: '' },
        existingSolutions: parsed.existingSolutions || { score: 0, comment: '' },
        feasibility: parsed.feasibility || { score: 0, comment: '' },
        overallScore: parsed.overallScore || 0,
        summary: parsed.summary || '',
        analyzedAt: new Date().toISOString(),
        provider: aiProvider,
        model: aiModel,
      };

      // Save to idea
      updateIdea(idea.id, { aiAnalysis: analysis });
      setAiResult(analysis);
    } catch (err) {
      setAiError(err.message || 'Analysis failed. Please check your API settings and try again.');
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

          {type === 'pending' && (
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

          {type === 'deleted' && (
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
    const { creativity, marketDemand, existingSolutions, feasibility, overallScore, summary, analyzedAt, provider, model } = analysis;

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

    return (
      <div className="ai-report">
        <div className="ai-report-meta">
          {analyzedAt && <span className="ai-report-date">Analyzed: {formatDateTime(analyzedAt)}</span>}
          {provider && <span className="ai-report-provider">Provider: {provider}{model ? ` / ${model}` : ''}</span>}
        </div>

        <div className="ai-score-grid">
          <div className="ai-score-item">
            <label>Creativity</label>
            {scoreBar(creativity?.score || 0)}
            {creativity?.comment && <p className="ai-score-comment">{creativity.comment}</p>}
          </div>
          <div className="ai-score-item">
            <label>Market Demand</label>
            {scoreBar(marketDemand?.score || 0)}
            {marketDemand?.comment && <p className="ai-score-comment">{marketDemand.comment}</p>}
          </div>
          <div className="ai-score-item">
            <label>Existing Solutions</label>
            {scoreBar(existingSolutions?.score || 0)}
            {existingSolutions?.comment && <p className="ai-score-comment">{existingSolutions.comment}</p>}
          </div>
          <div className="ai-score-item">
            <label>Feasibility</label>
            {scoreBar(feasibility?.score || 0)}
            {feasibility?.comment && <p className="ai-score-comment">{feasibility.comment}</p>}
          </div>
        </div>

        <div className="ai-overall-score">
          <span className="ai-overall-label">Overall Score</span>
          <span className="ai-overall-value">{overallScore}/10</span>
        </div>

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
          </div>
        </div>

        {/* API Key (both providers) */}
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
          <button className="btn btn--danger" onClick={() => handleReject(rejectModal)} disabled={!rejectReason.trim()}>
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