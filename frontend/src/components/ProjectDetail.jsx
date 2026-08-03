import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatCurrency, calculateHealth, calculateStageHealth, addProjectLog, exportLogsToTxt } from '../utils/helpers';
import Modal from './Modal';

/* ───── Collapsible Section Helper ───── */
function CollapsibleSection({ title, defaultOpen = false, actions, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`detail-collapsible ${open ? 'detail-collapsible--open' : ''}`}>
      <div className="detail-collapsible-header" onClick={() => setOpen(!open)}>
        <span className="detail-collapsible-arrow">{open ? '▼' : '▶'}</span>
        <h3>{title}</h3>
        {actions && <div className="detail-collapsible-actions" onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </div>
      {open && <div className="detail-collapsible-body">{children}</div>}
    </div>
  );
}

/* ───── Idea Detail Section (matches PendingApproval.jsx) ───── */
function IdeaDetailSection({ idea }) {
  const [openSections, setOpenSections] = useState({
    applicantInfo: true,
    projectType: false,
    projectDetails: false,
    timeline: false,
    budget: false,
    resources: false,
    techInnovation: false,
    ipAttachments: false,
  });

  const toggle = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  if (!idea) return null;

  return (
    <div className="detail-idea-source">
      <div className="detail-idea-source-header">
        <span className="detail-idea-badge">📄 Idea Source</span>
        <span className="detail-idea-id">{idea.id}</span>
        <span className={`status-badge status-badge--small status-badge--${idea.status === 'approved' ? 'completed' : idea.status === 'rejected' ? 'danger' : 'pending'}`}>
          {idea.status}
        </span>
      </div>

      {/* 1. Applicant Info */}
      <div className={`${openSections.applicantInfo ? 'approval-card-details--extended' : ''}`}>
        <div className="detail-collapsible-header" onClick={() => toggle('applicantInfo')}>
          <span className="detail-collapsible-arrow">{openSections.applicantInfo ? '▼' : '▶'}</span>
          <h4>Applicant Information 申請人資料</h4>
        </div>
        {openSections.applicantInfo && (
          <div className="detail-grid-inner">
            <p><strong>Name:</strong> {idea.applicantName || '-'}</p>
            <p><strong>Department:</strong> {idea.department || '-'}</p>
            <p><strong>Contact:</strong> {idea.contactNumber || '-'}</p>
            <p><strong>Email:</strong> {idea.email || '-'}</p>
            <p className="detail-full"><strong>1st Contact:</strong> {idea.firstContactName ? `${idea.firstContactName} (${idea.firstContactDept}) - ${idea.firstContactEmail} / ${idea.firstContactPhone}` : '-'}</p>
            <p className="detail-full"><strong>2nd Contact:</strong> {idea.secondContactName ? `${idea.secondContactName} (${idea.secondContactDept}) - ${idea.secondContactEmail} / ${idea.secondContactPhone}` : '-'}</p>
          </div>
        )}
      </div>

      {/* 2. Project Type & Owner */}
      <div className={`${openSections.projectType ? 'approval-card-details--extended' : ''}`}>
        <div className="detail-collapsible-header" onClick={() => toggle('projectType')}>
          <span className="detail-collapsible-arrow">{openSections.projectType ? '▼' : '▶'}</span>
          <h4>Project Type & Owner 項目類型及持有者</h4>
        </div>
        {openSections.projectType && (
          <div className="detail-grid-inner">
            <p><strong>Type:</strong> {idea.projectType || '-'}</p>
            <p><strong>Owner:</strong> {idea.ownerName ? `${idea.ownerName} (${idea.ownerDept})` : '-'}</p>
            <p><strong>Owner Contact:</strong> {idea.ownerContact || '-'}</p>
            <p><strong>Owner Email:</strong> {idea.ownerEmail || '-'}</p>
          </div>
        )}
      </div>

      {/* 3. Project Details */}
      <div className={`${openSections.projectDetails ? 'approval-card-details--extended' : ''}`}>
        <div className="detail-collapsible-header" onClick={() => toggle('projectDetails')}>
          <span className="detail-collapsible-arrow">{openSections.projectDetails ? '▼' : '▶'}</span>
          <h4>Project Details 項目 / 意念詳情</h4>
        </div>
        {openSections.projectDetails && (
          <div className="detail-grid-inner">
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
        )}
      </div>

      {/* 4. Timeline & Termination */}
      <div className={`${openSections.timeline ? 'approval-card-details--extended' : ''}`}>
        <div className="detail-collapsible-header" onClick={() => toggle('timeline')}>
          <span className="detail-collapsible-arrow">{openSections.timeline ? '▼' : '▶'}</span>
          <h4>Timeline & Termination 時間表及終止條件</h4>
        </div>
        {openSections.timeline && (
          <div className="detail-grid-inner">
            <p><strong>Expected Start:</strong> {idea.expectedStartDate || '-'}</p>
            <p><strong>Target Completion:</strong> {idea.targetCompletionDate || '-'}</p>
            <p><strong>Termination (1):</strong> {idea.terminationCondition1 || '-'}</p>
            <p><strong>Termination (2):</strong> {idea.terminationCondition2 || '-'}</p>
            <p><strong>Termination (3):</strong> {idea.terminationCondition3 || '-'}</p>
          </div>
        )}
      </div>

      {/* 5. Budget & Funding */}
      <div className={`${openSections.budget ? 'approval-card-details--extended' : ''}`}>
        <div className="detail-collapsible-header" onClick={() => toggle('budget')}>
          <span className="detail-collapsible-arrow">{openSections.budget ? '▼' : '▶'}</span>
          <h4>Budget & Funding 預算及資金</h4>
        </div>
        {openSections.budget && (
          <div className="detail-grid-inner">
            <p><strong>Budget:</strong> {formatCurrency(idea.totalBudget)}</p>
            <p><strong>Fund Source:</strong> {idea.fundSource || '-'}</p>
            <p className="detail-full"><strong>Budget Breakdown:</strong> {idea.budgetBreakdown || '-'}</p>
            <p><strong>Gov. Fund:</strong> {formatCurrency(idea.targetGovFund)}</p>
            <p><strong>Gov. Fund Details:</strong> {idea.targetGovFundDetails || '-'}</p>
          </div>
        )}
      </div>

      {/* 6. Resources & Support */}
      <div className={`${openSections.resources ? 'approval-card-details--extended' : ''}`}>
        <div className="detail-collapsible-header" onClick={() => toggle('resources')}>
          <span className="detail-collapsible-arrow">{openSections.resources ? '▼' : '▶'}</span>
          <h4>Resources & Support 資源及協助</h4>
        </div>
        {openSections.resources && (
          <div className="detail-grid-inner">
            <p className="detail-full"><strong>Resource Req:</strong> {idea.resourceRequirements || '-'}</p>
            <p className="detail-full"><strong>Cross-dept Assistance:</strong> {idea.crossDeptAssistance || '-'}</p>
          </div>
        )}
      </div>

      {/* 7. Technical & Innovation */}
      <div className={`${openSections.techInnovation ? 'approval-card-details--extended' : ''}`}>
        <div className="detail-collapsible-header" onClick={() => toggle('techInnovation')}>
          <span className="detail-collapsible-arrow">{openSections.techInnovation ? '▼' : '▶'}</span>
          <h4>Technical & Innovation 技術及創新</h4>
        </div>
        {openSections.techInnovation && (
          <div className="detail-grid-inner">
            <p className="detail-full"><strong>Tech Direction:</strong> {idea.techDirection || '-'}</p>
            <p className="detail-full"><strong>Innovation:</strong> {idea.innovationElement || '-'}</p>
            <p className="detail-full"><strong>Tech Requirements:</strong> {idea.technicalRequirements || '-'}</p>
          </div>
        )}
      </div>

      {/* 8. IP & Attachments */}
      <div className={`${openSections.ipAttachments ? 'approval-card-details--extended' : ''}`}>
        <div className="detail-collapsible-header" onClick={() => toggle('ipAttachments')}>
          <span className="detail-collapsible-arrow">{openSections.ipAttachments ? '▼' : '▶'}</span>
          <h4>IP & Attachments 知識產權及附件</h4>
        </div>
        {openSections.ipAttachments && (
          <div className="detail-grid-inner">
            <p><strong>Require IP:</strong> {idea.requireIP || '-'}</p>
            {idea.requireIP === '是' && <p><strong>IP Region:</strong> {idea.ipRegion || '-'}</p>}
            <p className="detail-full"><strong>Remarks:</strong> {idea.remarks || '-'}</p>
            <p><strong>Business Proposal:</strong> {idea.businessProposalFile || 'Not uploaded'}</p>
            <p><strong>Other Docs:</strong> {idea.otherDocFile || 'Not uploaded'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── Main Project Detail Component ───── */
export default function ProjectDetail({ project, onBack, onNavigate, isProjectUser = false, editMode, onEdit, onSave, onCancel, editForm, onEditFormChange, canEdit = true }) {
  const { projects, ideas, updateProject, deleteProject, settings } = useData();
  const { user, isSuperAdmin } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Derive project from context (Firestore is now writable by PW users too)
  const latestProject = useMemo(() => {
    const found = projects.find((p) => p.id === project.id);
    return found || project;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, projects, refreshKey]);

  // Derive the latest project from context so Activity Log stays up-to-date
  const health = calculateHealth(latestProject, settings);

  // Find linked idea via originalIdeaId
  const linkedIdea = useMemo(() => {
    if (!project.originalIdeaId) return null;
    return ideas.find((i) => i.id === project.originalIdeaId) || null;
  }, [project.originalIdeaId, ideas]);

  const [showStageForm, setShowStageForm] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageForm, setStageForm] = useState({ type: 'Feasibility', startDate: '', endDate: '', budget: '', budgetUsed: '', status: 'Not Started', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteStageConfirm, setDeleteStageConfirm] = useState(null);

  const handleAddStage = () => {
    const newStage = {
      ...stageForm,
      id: 's' + Date.now(),
      budget: parseFloat(stageForm.budget) || 0,
      budgetUsed: parseFloat(stageForm.budgetUsed) || 0,
    };
    const updatedStages = [...(latestProject.stages || []), newStage];
    updateProject(project.id, { stages: updatedStages });

    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'Stage Added',
      details: `Added stage "${newStage.type}" (${formatDate(newStage.startDate)} ~ ${formatDate(newStage.endDate)}), Budget: ${formatCurrency(newStage.budget)}`,
      user: user?.displayName || user?.email || 'Unknown',
    };
    const updatedLogs = [...(latestProject.logs || []), newLog];
    updateProject(project.id, { logs: updatedLogs });

    setRefreshKey((k) => k + 1);

    setShowStageForm(false);
    resetStageForm();
  };

  const handleEditStage = (stage) => {
    setEditingStage(stage.id);
    setStageForm({ ...stage });
    setShowStageForm(true);
  };

  const handleUpdateStage = () => {
    const oldStage = (latestProject.stages || []).find((s) => s.id === editingStage);
    const updatedStages = (latestProject.stages || []).map((s) =>
      s.id === editingStage ? { ...stageForm, id: s.id, budget: parseFloat(stageForm.budget) || 0, budgetUsed: parseFloat(stageForm.budgetUsed) || 0 } : s
    );

    updateProject(project.id, { stages: updatedStages });

    const changedFields = [];
    if (oldStage) {
      if (oldStage.type !== stageForm.type) changedFields.push(`type: ${oldStage.type} → ${stageForm.type}`);
      if (oldStage.status !== stageForm.status) changedFields.push(`status: ${oldStage.status} → ${stageForm.status}`);
      if (oldStage.budget !== parseFloat(stageForm.budget)) changedFields.push(`budget: ${formatCurrency(oldStage.budget)} → ${formatCurrency(stageForm.budget)}`);
      if (oldStage.startDate !== stageForm.startDate) changedFields.push(`startDate: ${oldStage.startDate} → ${stageForm.startDate}`);
      if (oldStage.endDate !== stageForm.endDate) changedFields.push(`endDate: ${oldStage.endDate} → ${stageForm.endDate}`);
    }
    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'Stage Edited',
      details: `Stage "${stageForm.type}": ${changedFields.join(', ') || 'details updated'}`,
      user: user?.displayName || user?.email || 'Unknown',
    };
    const updatedLogs = [...(latestProject.logs || []), newLog];
    updateProject(project.id, { logs: updatedLogs });

    setRefreshKey((k) => k + 1);

    setShowStageForm(false);
    setEditingStage(null);
    resetStageForm();
  };

  const resetStageForm = () => {
    setStageForm({ type: 'Feasibility', startDate: '', endDate: '', budget: '', budgetUsed: '', status: 'Not Started', description: '' });
  };

  const handleDeleteStage = (stageId) => {
    const deletedStage = (latestProject.stages || []).find((s) => s.id === stageId);
    const updatedStages = (latestProject.stages || []).filter((s) => s.id !== stageId);

    updateProject(project.id, { stages: updatedStages });

    if (deletedStage) {
      const newLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'Stage Deleted',
        details: `Deleted stage "${deletedStage.type}" (${deletedStage.status})`,
        user: user?.displayName || user?.email || 'Unknown',
      };
      const updatedLogs = [...(latestProject.logs || []), newLog];
      updateProject(project.id, { logs: updatedLogs });
    }

    setRefreshKey((k) => k + 1);
    setDeleteStageConfirm(null);
  };

  const handleDeleteLog = (logId) => {
    const updatedLogs = (latestProject.logs || []).filter((log) => log.id !== logId);
    updateProject(project.id, { logs: updatedLogs });
    setRefreshKey((k) => k + 1);
  };

  function statusBadgeClass(status) {
    if (status === 'Completed') return 'status-badge--completed';
    if (status === 'In Progress') return 'status-badge--progress';
    return 'status-badge--planning';
  }

  function stageBadgeClass(status) {
    if (status === 'Completed') return 'status-badge--completed';
    if (status === 'In Progress') return 'status-badge--progress';
    if (status === 'On Hold') return 'status-badge--hold';
    return 'status-badge--pending';
  }

  return (
    <div className="project-detail">
      <div className="detail-header">
        <div className="detail-header-top">
          <div className="detail-header-title-row">
            <h1>{project.name}</h1>
            <span className={`status-badge status-badge--small ${statusBadgeClass(project.status)}`}>
              {project.status || 'Planning'}
            </span>
          </div>
          <div className="detail-header-actions">
            {canEdit && (
              editMode ? (
                <>
                  <button className="btn btn--primary" onClick={onSave}>💾 Save Changes</button>
                  <button className="btn btn--outline" onClick={onCancel}>Cancel</button>
                </>
              ) : (
                <>
                  {isSuperAdmin && (
                    <button className="btn btn--outline" onClick={onEdit}>✏️ Edit Project</button>
                  )}
                  {isSuperAdmin && !isProjectUser && (
                    <button className="btn btn--danger" onClick={() => setDeleteConfirm(true)}>Delete</button>
                  )}
                </>
              )
            )}
          </div>
        </div>
        <div className="detail-meta-row">
          <span className="detail-meta-health">
            <span className="health-dot health-dot--large" style={{ backgroundColor: health.color }} />
            <span className="detail-meta-text" style={{ color: health.color }}>
              {health.label}
            </span>
          </span>
          <span className="detail-divider">|</span>
          <span className="detail-id">ID: {project.id}</span>
          {project.originalIdeaId && (
            <>
              <span className="detail-divider">|</span>
              <span
                className="detail-idea-id"
                style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                onClick={() => onNavigate?.(`/idea-detail/${project.originalIdeaId}`)}
                title="Click to view original idea"
              >
                Idea: {project.originalIdeaId}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ===== FULL PROJECT DATA ===== */}
      <CollapsibleSection title="Project Information 項目基本資料" defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field">
            <label>Project Name 項目名稱</label>
            {editMode ? (
              <input className="form-input" type="text" value={editForm?.name || ''} onChange={(e) => onEditFormChange?.('name', e.target.value)} />
            ) : (
              <p>{project.name || '-'}</p>
            )}
          </div>
          <div className="detail-field">
            <label>Status 狀態</label>
            {editMode ? (
              <select className="form-select" value={editForm?.status || 'Planning'} onChange={(e) => onEditFormChange?.('status', e.target.value)}>
                {['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <p>{project.status || '-'}</p>
            )}
          </div>
          <div className="detail-field detail-field--full">
            <label>Description 簡短描述</label>
            {editMode ? (
              <textarea className="form-textarea" rows={3} value={editForm?.description || ''} onChange={(e) => onEditFormChange?.('description', e.target.value)} />
            ) : (
              <p>{project.description || '-'}</p>
            )}
          </div>
          <div className="detail-field detail-field--full">
            <label>Detail Content 詳細內容</label>
            {editMode ? (
              <textarea className="form-textarea" rows={3} value={editForm?.detailContent || ''} onChange={(e) => onEditFormChange?.('detailContent', e.target.value)} />
            ) : (
              <p>{project.detailContent || '-'}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Team 項目團隊" defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field">
            <label>Holder 持有人</label>
            {editMode ? (
              <input className="form-input" type="text" value={editForm?.holder || ''} onChange={(e) => onEditFormChange?.('holder', e.target.value)} />
            ) : (
              <p>{project.holder || '-'}</p>
            )}
          </div>
          <div className="detail-field">
            <label>Manager 項目經理</label>
            {editMode ? (
              <input className="form-input" type="text" value={editForm?.manager || ''} onChange={(e) => onEditFormChange?.('manager', e.target.value)} />
            ) : (
              <p>{project.manager || '-'}</p>
            )}
          </div>
          {project.applicantName && <div className="detail-field"><label>Applicant 申請人</label><p>{project.applicantName}</p></div>}
          {project.department && <div className="detail-field"><label>Department 部門</label><p>{project.department}</p></div>}
          {project.contactNumber && <div className="detail-field"><label>Contact 聯絡電話</label><p>{project.contactNumber}</p></div>}
          {project.email && <div className="detail-field"><label>Email 電郵</label><p>{project.email}</p></div>}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Dates 日期範圍" defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field">
            <label>Start Date 開始日期</label>
            {editMode ? (
              <input className="form-input" type="date" value={editForm?.startDate || ''} onChange={(e) => onEditFormChange?.('startDate', e.target.value)} />
            ) : (
              <p>{formatDate(project.startDate) || '-'}</p>
            )}
          </div>
          <div className="detail-field">
            <label>End Date 結束日期</label>
            {editMode ? (
              <input className="form-input" type="date" value={editForm?.endDate || ''} onChange={(e) => onEditFormChange?.('endDate', e.target.value)} />
            ) : (
              <p>{formatDate(project.endDate) || 'TBD'}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Budget & Funding 預算及資金" defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field">
            <label>Total Budget 總預算</label>
            {editMode ? (
              <input className="form-input" type="number" value={editForm?.budget || ''} onChange={(e) => onEditFormChange?.('budget', e.target.value)} />
            ) : (
              <p>{formatCurrency(project.budget)}</p>
            )}
          </div>
          <div className="detail-field">
            <label>Budget Used 已使用</label>
            {editMode ? (
              <input className="form-input" type="number" value={editForm?.budgetUsed || ''} onChange={(e) => onEditFormChange?.('budgetUsed', e.target.value)} />
            ) : (
              <p>{formatCurrency(project.budgetUsed)}</p>
            )}
          </div>
          <div className="detail-field"><label>Government Grant 政府資助</label><p>{project.governmentGrant || '-'}</p></div>
          <div className="detail-field"><label>Technical Support 技術支援</label><p>{project.technicalSupport || '-'}</p></div>
          {project.fundSource && <div className="detail-field"><label>Fund Source 資金來源</label><p>{project.fundSource}</p></div>}
          {project.targetGovFund > 0 && <div className="detail-field"><label>Target Gov. Fund 目標政府資助</label><p>{formatCurrency(project.targetGovFund)}</p></div>}
          {project.targetGovFundDetails && <div className="detail-field detail-field--full"><label>Gov. Fund Details 資助詳情</label><p>{project.targetGovFundDetails}</p></div>}
        </div>
      </CollapsibleSection>

      {/* ===== IDEA SOURCE DATA ===== */}
      {linkedIdea && (
        <CollapsibleSection title={`Original Idea Submission 原始意念提交 (${linkedIdea.id})`} defaultOpen={true}>
          <IdeaDetailSection idea={linkedIdea} />
        </CollapsibleSection>
      )}

      {/* ===== STAGES ===== */}
      <div className="detail-section">
        <div className="card-header-row">
          <h3>Project Stages 項目階段 ({latestProject.stages?.length || 0})</h3>
          {(isSuperAdmin || isProjectUser) && (
            <button className="btn btn--small" onClick={() => { resetStageForm(); setShowStageForm(true); setEditingStage(null); }}>
              + Add Stage
            </button>
          )}
        </div>
        {(latestProject.stages || []).length === 0 && <p className="empty-text">No stages defined</p>}
        <div className="stages-list">
          {(latestProject.stages || []).map((stage) => {
            const stageHealth = calculateStageHealth(stage, settings);
            const isStageCritical = stageHealth.status === 'critical';
            const isStageWarning = stageHealth.status === 'warning';
            const isStageCompleted = stageHealth.status === 'completed';
            return (
            <div key={stage.id} className="stage-card">
              <div className="stage-header">
                <span className="stage-type">{stage.name || stage.type || stage.stage || '-'}</span>
                <span className="stage-header-right">
                  <span className={`status-badge status-badge--small ${stageBadgeClass(stage.status)}`}>
                    {stage.status}
                  </span>
                  <span className="stage-health" style={{ color: stageHealth.color }}>
                    <span className="health-dot" style={{ backgroundColor: stageHealth.color }} />
                    {stageHealth.label}
                  </span>
                </span>
              </div>
              <p className="stage-desc">{stage.description}</p>
              <div className="stage-dates">
                <span className={`${isStageCritical ? 'text-danger' : isStageWarning ? 'text-warning' : ''}`}>
                  📅 {formatDate(stage.startDate)} - {formatDate(stage.endDate)}
                </span>
              </div>
              <div className="stage-budget">
                <span className={`${isStageCritical ? 'text-danger' : isStageWarning ? 'text-warning' : ''}`}>
                  💰 {formatCurrency(stage.budget)}
                </span>
                <span className={`${isStageCritical ? 'text-danger' : isStageWarning ? 'text-warning' : ''}`}>
                  Used: {formatCurrency(stage.budgetUsed)}
                </span>
              </div>
              {(isSuperAdmin || isProjectUser) && (
                <div className="stage-actions">
                  <button className="btn btn--small btn--outline" onClick={() => handleEditStage(stage)}>Edit</button>
                  <button className="btn btn--small btn--danger" onClick={() => setDeleteStageConfirm(stage.id)}>Delete</button>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Stage Form Modal */}
      <Modal
        isOpen={showStageForm}
        onClose={() => { setShowStageForm(false); setEditingStage(null); }}
        title={editingStage ? 'Edit Stage' : 'Add Stage'}
      >
        <div className="form">
          <div className="form-group">
            <label>Type</label>
            <select value={stageForm.type} onChange={(e) => setStageForm({ ...stageForm, type: e.target.value })}>
              {['Idea / R&D', 'Feasibility', 'POC', 'Demo', 'Pilot', 'Commercialization', 'Production'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={stageForm.startDate} onChange={(e) => setStageForm({ ...stageForm, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={stageForm.endDate} onChange={(e) => setStageForm({ ...stageForm, endDate: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Budget (HKD)</label>
              <input type="number" value={stageForm.budget} onChange={(e) => setStageForm({ ...stageForm, budget: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Used Amount</label>
              <input type="number" value={stageForm.budgetUsed} onChange={(e) => setStageForm({ ...stageForm, budgetUsed: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={stageForm.status} onChange={(e) => setStageForm({ ...stageForm, status: e.target.value })}>
              {['Not Started', 'In Progress', 'Completed', 'On Hold'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows="2" value={stageForm.description} onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => { setShowStageForm(false); setEditingStage(null); }}>Cancel</button>
            <button className="btn btn--primary" onClick={editingStage ? handleUpdateStage : handleAddStage}>
              {editingStage ? 'Update' : 'Add'} Stage
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Confirm Delete">
        <p>Delete this project permanently?</p>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setDeleteConfirm(false)}>Cancel</button>
          <button className="btn btn--danger" onClick={() => { deleteProject(project.id); if (onBack) onBack(); }}>Delete</button>
        </div>
      </Modal>

      {/* Stage Delete Confirm */}
      <Modal isOpen={!!deleteStageConfirm} onClose={() => setDeleteStageConfirm(null)} title="Confirm Delete Stage">
        <p>Are you sure you want to delete this stage?</p>
        <p className="text-muted">This action cannot be undone.</p>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setDeleteStageConfirm(null)}>Cancel</button>
          <button className="btn btn--danger" onClick={() => { handleDeleteStage(deleteStageConfirm); setDeleteStageConfirm(null); }}>Delete</button>
        </div>
      </Modal>

      {/* ===== ACTIVITY LOG ===== */}
      <CollapsibleSection
        title={`Activity Log 活動記錄 (${(latestProject.logs || []).length})`}
        defaultOpen={false}
        actions={
          <button
            className="btn btn--small"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            🔄 Refresh
          </button>
        }
      >
        <div className="activity-log-toolbar">
          <span className="activity-log-count">{latestProject.logs?.length || 0} entries</span>
          <div className="activity-log-actions">
            <button
              className="btn btn--small"
              onClick={() => exportLogsToTxt(latestProject)}
              disabled={!latestProject.logs || latestProject.logs.length === 0}
            >
              ⬇ Export TXT
            </button>
          </div>
        </div>
        {(!latestProject.logs || latestProject.logs.length === 0) ? (
          <p className="empty-text">No activity recorded yet</p>
        ) : (
          <div className="activity-log-list">
            {[...(latestProject.logs || [])].reverse().map((log) => (
              <div key={log.id} className="activity-log-entry">
                <span className="activity-log-timestamp">{formatDateTime(log.timestamp)}</span>
                <span className="activity-log-user">{log.user}</span>
                <span className="activity-log-action-tag">{log.action}</span>
                <span className="activity-log-details">{log.details}</span>
                {isSuperAdmin && !isProjectUser && (
                  <button
                    className="activity-log-delete-btn"
                    title="Delete this log entry"
                    onClick={() => handleDeleteLog(log.id)}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}