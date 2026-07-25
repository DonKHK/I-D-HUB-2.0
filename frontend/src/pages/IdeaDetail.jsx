import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { formatCurrency, formatDate } from '../utils/helpers';

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

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">Idea Detail: {idea.id}</h1>
        <button className="btn btn--outline" onClick={() => navigate('/pending-approval')}>← Back to Pending Approval</button>
      </div>

      <div className="detail-page-content">
        {/* Applicant Info */}
        <div className="detail-section">
          <h4 className="detail-section-title">Applicant Information 申請人資料</h4>
          <div className="detail-grid">
            <p><strong>Name:</strong> {idea.applicantName || '-'}</p>
            <p><strong>Department:</strong> {idea.department || '-'}</p>
            <p><strong>Contact:</strong> {idea.contactNumber || '-'}</p>
            <p><strong>Email:</strong> {idea.email || '-'}</p>
          </div>
        </div>

        {/* Project Manager */}
        <div className="detail-section">
          <h4 className="detail-section-title">Project Manager 項目經理</h4>
          <div className="detail-grid">
            <p><strong>Name:</strong> {idea.projectManagerName || '-'}</p>
            <p><strong>Department:</strong> {idea.projectManagerDept || '-'}</p>
            <p><strong>Email:</strong> {idea.projectManagerEmail || '-'}</p>
            <p><strong>Phone:</strong> {idea.projectManagerPhone || '-'}</p>
          </div>
        </div>

        {/* Project Owner */}
        <div className="detail-section">
          <h4 className="detail-section-title">Project Owner 項目持有者</h4>
          <div className="detail-grid">
            <p><strong>Name:</strong> {idea.ownerName || '-'}</p>
            <p><strong>Department / Company:</strong> {idea.ownerDept || '-'}</p>
            <p><strong>Contact:</strong> {idea.ownerContact || '-'}</p>
            <p><strong>Email:</strong> {idea.ownerEmail || '-'}</p>
          </div>
        </div>

        {/* Technical Support */}
        <div className="detail-section">
          <h4 className="detail-section-title">Technical Support</h4>
          <div className="detail-grid">
            <p><strong>Name:</strong> {idea.techSupportName || '-'}</p>
            <p><strong>Department / Company:</strong> {idea.techSupportDept || '-'}</p>
            <p><strong>Contact:</strong> {idea.techSupportContact || '-'}</p>
            <p><strong>Email:</strong> {idea.techSupportEmail || '-'}</p>
          </div>
        </div>

        {/* Project Type */}
        <div className="detail-section">
          <h4 className="detail-section-title">Project Type 項目類型</h4>
          <div className="detail-grid">
            <p><strong>Type:</strong> {idea.projectType || '-'}</p>
          </div>
        </div>

        {/* Project Details */}
        <div className="detail-section">
          <h4 className="detail-section-title">Project Details 項目 / 意念詳情</h4>
          <div className="detail-grid">
            <p className="detail-full"><strong>Title:</strong> {idea.title || '-'}</p>
            <p className="detail-full"><strong>Background:</strong> {idea.background || '-'}</p>
            <p className="detail-full"><strong>Pain Points:</strong> {idea.painPoint || '-'}</p>
            <p className="detail-full"><strong>Workarounds:</strong> {idea.currentWorkarounds || '-'}</p>
            <p className="detail-full"><strong>Scope:</strong> {idea.projectScope || '-'}</p>
            <p className="detail-full"><strong>Deliverables:</strong> {idea.deliverables || '-'}</p>
            <p className="detail-full"><strong>Benefits:</strong> {idea.benefits || '-'}</p>
            <p className="detail-full"><strong>Phases:</strong> {idea.projectPhases || '-'}</p>
            <p className="detail-full"><strong>Risks:</strong> {idea.risks || '-'}</p>
          </div>
        </div>

        {/* Timeline & Termination */}
        <div className="detail-section">
          <h4 className="detail-section-title">Timeline & Termination 時間表及終止條件</h4>
          <div className="detail-grid">
            <p><strong>Expected Start:</strong> {idea.expectedStartDate || '-'}</p>
            <p><strong>Target Completion:</strong> {idea.targetCompletionDate || '-'}</p>
            <p><strong>Termination (1):</strong> {idea.terminationCondition1 || '-'}</p>
            <p><strong>Termination (2):</strong> {idea.terminationCondition2 || '-'}</p>
            <p><strong>Termination (3):</strong> {idea.terminationCondition3 || '-'}</p>
          </div>
        </div>

        {/* Budget & Funding */}
        <div className="detail-section">
          <h4 className="detail-section-title">Budget & Funding 預算及資金</h4>
          <div className="detail-grid">
            <p><strong>Budget:</strong> {formatCurrency(idea.totalBudget)}</p>
            <p><strong>Fund Source:</strong> {idea.fundSource || '-'}</p>
            <p className="detail-full"><strong>Budget Breakdown:</strong> {idea.budgetBreakdown || '-'}</p>
            <p><strong>Gov. Fund:</strong> {formatCurrency(idea.targetGovFund)}</p>
            <p><strong>Gov. Fund Details:</strong> {idea.targetGovFundDetails || '-'}</p>
          </div>
        </div>

        {/* Resources */}
        <div className="detail-section">
          <h4 className="detail-section-title">Resources & Support 資源及協助</h4>
          <div className="detail-grid">
            <p className="detail-full"><strong>Resource Req:</strong> {idea.resourceRequirements || '-'}</p>
            <p className="detail-full"><strong>Cross-dept Assistance:</strong> {idea.crossDeptAssistance || '-'}</p>
          </div>
        </div>

        {/* Technical & Innovation */}
        <div className="detail-section">
          <h4 className="detail-section-title">Technical & Innovation 技術及創新</h4>
          <div className="detail-grid">
            <p className="detail-full"><strong>Tech Direction:</strong> {idea.techDirection || '-'}</p>
            <p className="detail-full"><strong>Innovation:</strong> {idea.innovationElement || '-'}</p>
            <p className="detail-full"><strong>Tech Requirements:</strong> {idea.technicalRequirements || '-'}</p>
          </div>
        </div>

        {/* Current Stage */}
        <div className="detail-section">
          <h4 className="detail-section-title">Current Stage 現時階段</h4>
          <div className="detail-grid">
            <p><strong>Stage:</strong> {idea.currentStage || '-'}</p>
            <p><strong>Stage Start:</strong> {idea.stageStartDate || '-'}</p>
            <p><strong>Stage End:</strong> {idea.stageEndDate || '-'}</p>
            <p><strong>Status:</strong> {idea.stageStatus || '-'}</p>
            <p className="detail-full"><strong>Description:</strong> {idea.stageDescription || '-'}</p>
          </div>
        </div>

        {/* IP & Attachments */}
        <div className="detail-section">
          <h4 className="detail-section-title">IP & Attachments 知識產權及附件</h4>
          <div className="detail-grid">
            <p><strong>Require IP:</strong> {idea.requireIP || '-'}</p>
            {idea.requireIP === '是' && <p><strong>IP Region:</strong> {idea.ipRegion || '-'}</p>}
            <p className="detail-full"><strong>Remarks:</strong> {idea.remarks || '-'}</p>
            <p><strong>Business Proposal:</strong> {idea.businessProposalFile || 'Not uploaded'}</p>
            <p><strong>Other Docs:</strong> {idea.otherDocFile || 'Not uploaded'}</p>
          </div>
        </div>

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
      </div>
    </div>
  );
}