import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { SECTION_LABELS } from '../utils/fields';
import FieldSection, { ContactFieldSections } from '../components/FieldSection';

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ideas } = useData();
  const idea = ideas.find((i) => i.id === id);

  if (!idea) {
    return (
      <div className="page">
        <div className="page-header-row">
          <h1 className="page-title">Idea Not Found</h1>
          <button className="btn btn--outline" onClick={() => navigate('/pending-approval')}>← Back</button>
        </div>
        <p className="empty-text">The idea with ID "{id}" does not exist.</p>
      </div>
    );
  }

  // Money / date / attachment formatting for the canonical fields (labels come from the registry)
  const renderIdeaValue = (key, value) => {
    if (value === undefined || value === null || value === '') {
      return key === 'businessProposalFile' || key === 'otherDocFile' ? 'Not uploaded' : '-';
    }
    if (key === 'totalBudget' || key === 'targetGovFund') return formatCurrency(value);
    if (key === 'expectedStartDate' || key === 'targetCompletionDate' || key === 'stageStartDate' || key === 'stageEndDate') {
      return formatDate(value);
    }
    return value;
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">Idea Detail: {idea.id}</h1>
        <button className="btn btn--outline" onClick={() => navigate('/pending-approval')}>← Back to Pending Approval</button>
      </div>

      <div className="detail-page-content">
        <ContactFieldSections doc={idea} renderValue={renderIdeaValue} />

        <FieldSection title={SECTION_LABELS.projectType} fields={['projectType']} doc={idea} />

        <FieldSection
          title={SECTION_LABELS.details}
          fields={[
            'title',
            'background',
            'painPoint',
            'currentWorkarounds',
            'projectScope',
            'deliverables',
            'benefits',
            'projectPhases',
            'risks',
          ]}
          doc={idea}
        />

        <FieldSection
          title={SECTION_LABELS.timeline}
          fields={[
            'expectedStartDate',
            'targetCompletionDate',
            'terminationCondition1',
            'terminationCondition2',
            'terminationCondition3',
          ]}
          doc={idea}
          renderValue={renderIdeaValue}
        />

        <FieldSection
          title={SECTION_LABELS.budget}
          fields={['totalBudget', 'fundSource', 'budgetBreakdown', 'targetGovFund', 'targetGovFundDetails']}
          doc={idea}
          renderValue={renderIdeaValue}
        />

        <FieldSection
          title={SECTION_LABELS.resources}
          fields={['resourceRequirements', 'crossDeptAssistance']}
          doc={idea}
        />

        <FieldSection
          title={SECTION_LABELS.tech}
          fields={['techDirection', 'innovationElement', 'technicalRequirements']}
          doc={idea}
        />

        <FieldSection
          title={SECTION_LABELS.stage}
          fields={['currentStage', 'stageStartDate', 'stageEndDate', 'stageStatus', 'stageDescription']}
          doc={idea}
          renderValue={renderIdeaValue}
        />

        <FieldSection
          title={SECTION_LABELS.ip}
          fields={
            idea.requireIP === '是'
              ? ['requireIP', 'ipRegion', 'remarks', 'businessProposalFile', 'otherDocFile']
              : ['requireIP', 'remarks', 'businessProposalFile', 'otherDocFile']
          }
          doc={idea}
          renderValue={renderIdeaValue}
        />

        {/* Status Info */}
        <div className="detail-section">
          <h4 className="detail-section-title">Status 狀態</h4>
          <div className="detail-grid">
            <p><strong>Status:</strong> <span className={`status-badge status-badge--${idea.status}`}>{idea.status}</span></p>
            <p><strong>Created:</strong> {formatDate(idea.createdAt)}</p>
            {idea.approvedAt && <p><strong>Approved:</strong> {formatDate(idea.approvedAt)}</p>}
            {idea.rejectReason && <p className="detail-full"><strong>Reject Reason:</strong> {idea.rejectReason}</p>}
            {idea.deletedAt && <p><strong>Deleted:</strong> {formatDate(idea.deletedAt)}</p>}
          </div>
        </div>

        {/* AI Analysis Report */}
        {idea.aiAnalysis && (
          <div className="detail-section">
            <h4 className="detail-section-title">AI Analysis Report</h4>
            {renderAiReport(idea.aiAnalysis)}
          </div>
        )}
      </div>
    </div>
  );
}

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
        {analyzedAt && <span className="ai-report-date">Analyzed: {formatDate(analyzedAt)}</span>}
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
