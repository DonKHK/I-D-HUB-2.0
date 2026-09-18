import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatCurrency, calculateHealth, calculateStageHealth, addProjectLog, exportLogsToTxt } from '../utils/helpers';
import {
  SECTION_LABELS,
  APPLICANT_GROUP,
  CONTACT_GROUPS,
  CONTACT_FIELD_ORDER,
  FIELDS,
  fieldLabel,
  readField,
  PROJECT_STATUSES,
  STAGE_TYPES,
  STAGE_STATUSES,
  DEFAULT_PROJECT_STATUS,
  DEFAULT_STAGE_TYPE,
  DEFAULT_STAGE_STATUS,
  readStageField,
  buildStage,
  stageToForm,
} from '../utils/fields';
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

/* ───── Idea Detail Section (canonical labels from utils/fields) ───── */
// Field list per section — labels always come from the registry so the original
// idea submission reads identically to Submit Idea / IDEA Detail.
const IDEA_DETAIL_FIELDS = {
  projectType: ['projectType'],
  projectDetails: ['title', 'background', 'painPoint', 'currentWorkarounds', 'projectScope', 'deliverables', 'benefits', 'projectPhases', 'risks'],
  timeline: ['expectedStartDate', 'targetCompletionDate', 'terminationCondition1', 'terminationCondition2', 'terminationCondition3'],
  budget: ['totalBudget', 'fundSource', 'budgetBreakdown', 'targetGovFund', 'targetGovFundDetails'],
  resources: ['resourceRequirements', 'crossDeptAssistance'],
  techInnovation: ['techDirection', 'innovationElement', 'technicalRequirements'],
  stage: ['currentStage', 'stageStartDate', 'stageEndDate', 'stageStatus', 'stageDescription'],
};

function IdeaDetailSection({ idea }) {
  const [openSections, setOpenSections] = useState({
    applicantInfo: true,
    projectManager: true,
    owner: true,
    techSupport: true,
    projectType: false,
    projectDetails: false,
    timeline: false,
    budget: false,
    resources: false,
    techInnovation: false,
    stage: false,
    ipAttachments: false,
  });

  const toggle = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  if (!idea) return null;

  const renderValue = (key, value) => {
    if (value === undefined || value === null || value === '') {
      return key === 'businessProposalFile' || key === 'otherDocFile' ? 'Not uploaded' : '-';
    }
    if (key === 'totalBudget' || key === 'targetGovFund') return formatCurrency(value);
    if (['expectedStartDate', 'targetCompletionDate', 'stageStartDate', 'stageEndDate'].includes(key)) {
      return formatDate(value);
    }
    return value;
  };

  const sections = [
    ...[APPLICANT_GROUP, ...CONTACT_GROUPS].map((group) => ({
      id: group.id === 'applicant' ? 'applicantInfo' : group.id,
      title: group.title,
      fields: CONTACT_FIELD_ORDER.map((slot) => group[slot]),
    })),
    { id: 'projectType', title: SECTION_LABELS.projectType, fields: IDEA_DETAIL_FIELDS.projectType },
    { id: 'projectDetails', title: SECTION_LABELS.details, fields: IDEA_DETAIL_FIELDS.projectDetails },
    { id: 'timeline', title: SECTION_LABELS.timeline, fields: IDEA_DETAIL_FIELDS.timeline },
    { id: 'budget', title: SECTION_LABELS.budget, fields: IDEA_DETAIL_FIELDS.budget },
    { id: 'resources', title: SECTION_LABELS.resources, fields: IDEA_DETAIL_FIELDS.resources },
    { id: 'techInnovation', title: SECTION_LABELS.tech, fields: IDEA_DETAIL_FIELDS.techInnovation },
    { id: 'stage', title: SECTION_LABELS.stage, fields: IDEA_DETAIL_FIELDS.stage },
    {
      id: 'ipAttachments',
      title: SECTION_LABELS.ip,
      fields:
        idea.requireIP === '是'
          ? ['requireIP', 'ipRegion', 'remarks', 'businessProposalFile', 'otherDocFile']
          : ['requireIP', 'remarks', 'businessProposalFile', 'otherDocFile'],
    },
  ];

  return (
    <div className="detail-idea-source">
      <div className="detail-idea-source-header">
        <span className="detail-idea-badge">📄 Idea Source</span>
        <span className="detail-idea-id">{idea.id}</span>
        <span className={`status-badge status-badge--small status-badge--${idea.status === 'approved' ? 'completed' : idea.status === 'rejected' ? 'danger' : 'pending'}`}>
          {idea.status}
        </span>
      </div>

      {sections.map((section) => (
        <div key={section.id} className={`${openSections[section.id] ? 'approval-card-details--extended' : ''}`}>
          <div className="detail-collapsible-header" onClick={() => toggle(section.id)}>
            <span className="detail-collapsible-arrow">{openSections[section.id] ? '▼' : '▶'}</span>
            <h4>{section.title}</h4>
          </div>
          {openSections[section.id] && (
            <div className="detail-grid-inner">
              {section.fields.map((key) => (
                <p key={key} className={FIELDS[key]?.type === 'textarea' ? 'detail-full' : undefined}>
                  <strong>{fieldLabel(key)}:</strong> {renderValue(key, idea[key])}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}



/* ───── Main Project Detail Component ───── */
export default function ProjectDetail({ project, onBack, onNavigate, isProjectUser = false, editMode, onEdit, onSave, onCancel, editForm, onEditFormChange, canEdit = true, highlightIdeaSection = false }) {
  const navigate = useNavigate();
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

  // Anchor + brief flash for the "Original Idea Submission" section so that
  // arriving from a project card's "Idea" tag auto-scrolls to the original
  // application content.
  const ideaSectionRef = useRef(null);
  const [ideaFlash, setIdeaFlash] = useState(false);

  useEffect(() => {
    if (!highlightIdeaSection || !linkedIdea) return;
    let flashTimer;
    const scrollTimer = setTimeout(() => {
      ideaSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIdeaFlash(true);
      flashTimer = setTimeout(() => setIdeaFlash(false), 1800);
    }, 200);
    return () => {
      clearTimeout(scrollTimer);
      if (flashTimer) clearTimeout(flashTimer);
    };
  }, [highlightIdeaSection, linkedIdea]);

  const [showStageForm, setShowStageForm] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageForm, setStageForm] = useState({ type: DEFAULT_STAGE_TYPE, stageStartDate: '', stageEndDate: '', totalBudget: '', budgetUsed: '', stageStatus: DEFAULT_STAGE_STATUS, stageDescription: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteStageConfirm, setDeleteStageConfirm] = useState(null);

  const handleAddStage = () => {
    const newStage = buildStage(stageForm, { id: 's' + Date.now() });
    const updatedStages = [...(latestProject.stages || []), newStage];
    updateProject(project.id, { stages: updatedStages });

    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'Stage Added',
      details: `Added stage "${newStage.type}" (${formatDate(newStage.stageStartDate)} ~ ${formatDate(newStage.stageEndDate)}), Budget: ${formatCurrency(newStage.totalBudget)}`,
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
    setStageForm(stageToForm(stage));
    setShowStageForm(true);
  };

  const handleUpdateStage = () => {
    const oldStage = (latestProject.stages || []).find((s) => s.id === editingStage);
    const updatedStages = (latestProject.stages || []).map((s) =>
      s.id === editingStage ? buildStage(stageForm, { id: s.id }) : s
    );

    updateProject(project.id, { stages: updatedStages });

    const changedFields = [];
    if (oldStage) {
      if (readStageField(oldStage, 'type') !== stageForm.type) changedFields.push(`type: ${readStageField(oldStage, 'type')} → ${stageForm.type}`);
      if (readStageField(oldStage, 'stageStatus') !== stageForm.stageStatus) changedFields.push(`stageStatus: ${readStageField(oldStage, 'stageStatus')} → ${stageForm.stageStatus}`);
      if (Number(readStageField(oldStage, 'totalBudget')) !== Number(stageForm.totalBudget)) changedFields.push(`totalBudget: ${formatCurrency(readStageField(oldStage, 'totalBudget'))} → ${formatCurrency(stageForm.totalBudget)}`);
      if (readStageField(oldStage, 'stageStartDate') !== stageForm.stageStartDate) changedFields.push(`stageStartDate: ${readStageField(oldStage, 'stageStartDate')} → ${stageForm.stageStartDate}`);
      if (readStageField(oldStage, 'stageEndDate') !== stageForm.stageEndDate) changedFields.push(`stageEndDate: ${readStageField(oldStage, 'stageEndDate')} → ${stageForm.stageEndDate}`);
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
    setStageForm({ type: DEFAULT_STAGE_TYPE, stageStartDate: '', stageEndDate: '', totalBudget: '', budgetUsed: '', stageStatus: DEFAULT_STAGE_STATUS, stageDescription: '' });
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
        details: `Deleted stage "${deletedStage.type}" (${readStageField(deletedStage, 'stageStatus')})`,
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
            <h1>{readField(project, 'title')}</h1>
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
                onClick={() => navigate(`/idea-detail/${project.originalIdeaId}`)}
                title="Click to view original idea"
              >
                Idea: {project.originalIdeaId}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ===== FULL PROJECT DATA ===== */}
      <CollapsibleSection title={SECTION_LABELS.projectInfo} defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field">
            <label>{fieldLabel('title')}</label>
            {editMode ? (
              <input className="form-input" type="text" value={editForm?.title || ''} onChange={(e) => onEditFormChange?.('title', e.target.value)} />
            ) : (
              <p>{readField(project, 'title') || '-'}</p>
            )}
          </div>
          <div className="detail-field">
            <label>{fieldLabel('status')}</label>
            {editMode ? (
              <select className="form-select" value={editForm?.status || DEFAULT_PROJECT_STATUS} onChange={(e) => onEditFormChange?.('status', e.target.value)}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <p>{project.status || '-'}</p>
            )}
          </div>
          <div className="detail-field detail-field--full">
            <label>{fieldLabel('description')}</label>
            {editMode ? (
              <textarea className="form-textarea" rows={3} value={editForm?.description || ''} onChange={(e) => onEditFormChange?.('description', e.target.value)} />
            ) : (
              <p>{project.description || '-'}</p>
            )}
          </div>
          <div className="detail-field detail-field--full">
            <label>{fieldLabel('projectScope')}</label>
            {editMode ? (
              <textarea className="form-textarea" rows={3} value={editForm?.projectScope || ''} onChange={(e) => onEditFormChange?.('projectScope', e.target.value)} />
            ) : (
              <p>{readField(project, 'projectScope') || '-'}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={SECTION_LABELS.team} defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field">
            <label>{fieldLabel('ownerName')}</label>
            {editMode ? (
              <input className="form-input" type="text" value={editForm?.ownerName || ''} onChange={(e) => onEditFormChange?.('ownerName', e.target.value)} />
            ) : (
              <p>{readField(project, 'ownerName') || '-'}</p>
            )}
          </div>
          <div className="detail-field">
            <label>{fieldLabel('projectManagerName')}</label>
            {editMode ? (
              <input className="form-input" type="text" value={editForm?.projectManagerName || ''} onChange={(e) => onEditFormChange?.('projectManagerName', e.target.value)} />
            ) : (
              <p>{readField(project, 'projectManagerName') || '-'}</p>
            )}
          </div>
          {/* Department / Contact / Email for the same three people — same canonical
              labels as Submit Idea. Edit these with ✏️ Edit Project. */}
          {CONTACT_GROUPS.flatMap((group) =>
            CONTACT_FIELD_ORDER.filter((slot) => slot !== 'name').map((slot) => {
              const key = group[slot];
              const value = readField(project, key);
              if (!value) return null;
              return (
                <div className="detail-field" key={key}>
                  <label>{fieldLabel(key)}</label>
                  <p>{value}</p>
                </div>
              );
            })
          )}
          {project.applicantName && <div className="detail-field"><label>{fieldLabel('applicantName')}</label><p>{project.applicantName}</p></div>}
          {project.department && <div className="detail-field"><label>{fieldLabel('department')}</label><p>{project.department}</p></div>}
          {project.contactNumber && <div className="detail-field"><label>{fieldLabel('contactNumber')}</label><p>{project.contactNumber}</p></div>}
          {project.email && <div className="detail-field"><label>{fieldLabel('email')}</label><p>{project.email}</p></div>}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={SECTION_LABELS.dates} defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field">
            <label>{fieldLabel('expectedStartDate')}</label>
            {editMode ? (
              <input className="form-input" type="date" value={editForm?.expectedStartDate || ''} onChange={(e) => onEditFormChange?.('expectedStartDate', e.target.value)} />
            ) : (
              <p>{formatDate(readField(project, 'expectedStartDate'))}</p>
            )}
          </div>
          <div className="detail-field">
            <label>{fieldLabel('targetCompletionDate')}</label>
            {editMode ? (
              <input className="form-input" type="date" value={editForm?.targetCompletionDate || ''} onChange={(e) => onEditFormChange?.('targetCompletionDate', e.target.value)} />
            ) : (
              <p>{readField(project, 'targetCompletionDate') ? formatDate(readField(project, 'targetCompletionDate')) : 'TBD'}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={SECTION_LABELS.budget} defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field">
            <label>{fieldLabel('totalBudget')}</label>
            {editMode ? (
              <input className="form-input" type="number" value={editForm?.totalBudget || ''} onChange={(e) => onEditFormChange?.('totalBudget', e.target.value)} />
            ) : (
              <p>{formatCurrency(readField(project, 'totalBudget'))}</p>
            )}
          </div>
          <div className="detail-field">
            <label>{fieldLabel('budgetUsed')}</label>
            {editMode ? (
              <input className="form-input" type="number" value={editForm?.budgetUsed || ''} onChange={(e) => onEditFormChange?.('budgetUsed', e.target.value)} />
            ) : (
              <p>{formatCurrency(project.budgetUsed)}</p>
            )}
          </div>
          <div className="detail-field"><label>{fieldLabel('governmentGrant')}</label><p>{project.governmentGrant || '-'}</p></div>
          {project.fundSource && <div className="detail-field"><label>{fieldLabel('fundSource')}</label><p>{project.fundSource}</p></div>}
          {project.targetGovFund > 0 && <div className="detail-field"><label>{fieldLabel('targetGovFund')}</label><p>{formatCurrency(project.targetGovFund)}</p></div>}
          {project.targetGovFundDetails && <div className="detail-field detail-field--full"><label>{fieldLabel('targetGovFundDetails')}</label><p>{project.targetGovFundDetails}</p></div>}
        </div>
      </CollapsibleSection>

      {/* ===== IDEA SOURCE DATA ===== */}
      {linkedIdea && (
        <div
          ref={ideaSectionRef}
          className={`idea-source-anchor ${ideaFlash ? 'idea-source-anchor--flash' : ''}`}
        >
          <CollapsibleSection title={`${SECTION_LABELS.ideaSource} (${linkedIdea.id})`} defaultOpen={true}>
            <IdeaDetailSection idea={linkedIdea} />
          </CollapsibleSection>
        </div>
      )}

      {/* ===== STAGES ===== */}
      <div className="detail-section">
        <div className="card-header-row">
          <h3>{SECTION_LABELS.stages} ({latestProject.stages?.length || 0})</h3>
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
                <span className="stage-type">{readStageField(stage, 'type') || stage.name || '-'}</span>
                <span className="stage-header-right">
                  <span className={`status-badge status-badge--small ${stageBadgeClass(readStageField(stage, 'stageStatus'))}`}>
                    {readStageField(stage, 'stageStatus')}
                  </span>
                  <span className="stage-health" style={{ color: stageHealth.color }}>
                    <span className="health-dot" style={{ backgroundColor: stageHealth.color }} />
                    {stageHealth.label}
                  </span>
                </span>
              </div>
              <p className="stage-desc">{readStageField(stage, 'stageDescription')}</p>
              <div className="stage-dates">
                <span className={`${isStageCritical ? 'text-danger' : isStageWarning ? 'text-warning' : ''}`}>
                  📅 {formatDate(readStageField(stage, 'stageStartDate'))} - {formatDate(readStageField(stage, 'stageEndDate'))}
                </span>
              </div>
              <div className="stage-budget">
                <span className={`${isStageCritical ? 'text-danger' : isStageWarning ? 'text-warning' : ''}`}>
                  💰 {formatCurrency(readStageField(stage, 'totalBudget'))}
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
            <label>{fieldLabel('currentStage')}</label>
            <select value={stageForm.type} onChange={(e) => setStageForm({ ...stageForm, type: e.target.value })}>
              {STAGE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{fieldLabel('stageStartDate')}</label>
              <input type="date" value={stageForm.stageStartDate} onChange={(e) => setStageForm({ ...stageForm, stageStartDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{fieldLabel('stageEndDate')}</label>
              <input type="date" value={stageForm.stageEndDate} onChange={(e) => setStageForm({ ...stageForm, stageEndDate: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{fieldLabel('totalBudget')}</label>
              <input type="number" value={stageForm.totalBudget} onChange={(e) => setStageForm({ ...stageForm, totalBudget: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{fieldLabel('budgetUsed')}</label>
              <input type="number" value={stageForm.budgetUsed} onChange={(e) => setStageForm({ ...stageForm, budgetUsed: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>{fieldLabel('stageStatus')}</label>
            <select value={stageForm.stageStatus} onChange={(e) => setStageForm({ ...stageForm, stageStatus: e.target.value })}>
              {STAGE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{fieldLabel('stageDescription')}</label>
            <textarea rows="2" value={stageForm.stageDescription} onChange={(e) => setStageForm({ ...stageForm, stageDescription: e.target.value })} />
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
        title={`${SECTION_LABELS.activityLog} (${(latestProject.logs || []).length})`}
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