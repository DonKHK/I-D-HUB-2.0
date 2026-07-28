import React, { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { calculateHealth, formatDate, formatDateTime, formatCurrency, daysUntil, addProjectLog, exportLogsToTxt } from '../utils/helpers';
import Modal from '../components/Modal';

/* ───── health logic matching idprojecthub ───── */
function getProjectHealth(p) {
  if (!p.endDate) {
    return { color: '#ef4444', label: 'No End Date', cls: 'health-red' };
  }
  if (!p.budget || p.budget <= 0) {
    return { color: '#ef4444', label: 'No Budget', cls: 'health-red' };
  }

  const now = new Date();
  const end = new Date(p.endDate);
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

  let label = '';
  let color = '#22c55e';
  let cls = 'health-green';

  if (diffDays < 0) {
    label = `Overdue ${Math.abs(diffDays)} days`;
    color = '#ef4444';
    cls = 'health-red';
  } else if (diffDays <= 14) {
    label = `Remaining ${diffDays} days`;
    color = '#eab308';
    cls = 'health-yellow';
  } else {
    label = 'Normal';
    color = '#22c55e';
    cls = 'health-green';
  }

  if (p.budgetUsed && p.budgetUsed > 0) {
    const ratio = p.budgetUsed / p.budget;
    if (ratio > 1.05) {
      label += ' | Budget Overrun';
      color = '#ef4444';
      cls = 'health-red';
    } else if (ratio > 0.95 && cls !== 'health-red') {
      label += ' | Budget close to limit';
      color = '#eab308';
      cls = 'health-yellow';
    }
  }

  return { color, label, cls };
}

/* ───── Status badge class ───── */
function statusClass(status) {
  if (status === 'Completed') return 'badge-completed';
  if (status === 'In Progress') return 'badge-progress';
  return 'badge-planning';
}

export default function MyProjects({ onNavigate }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, ideas, deleteProject } = useData();
  const { isSuperAdmin } = useAuth();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created-desc');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Build combined list: projects + approved ideas that don't already have a project
  const combinedItems = useMemo(() => {
    // Collect originalIdeaIds that already have a project
    const projectIdeaIds = new Set(
      projects.filter((p) => p.originalIdeaId).map((p) => p.originalIdeaId)
    );
    // Map approved ideas (without an existing project) into project-compatible shape
    const approvedIdeaProjects = ideas
      .filter((i) => i.status === 'approved' && !projectIdeaIds.has(i.id))
      .map((idea) => ({
        id: idea.id,
        name: idea.title || idea.projectTitle || 'Untitled',
        description: idea.oneLineDesc || idea.shortDescription || '',
        detailContent: idea.projectScope || idea.detailContent || '',
        manager: idea.projectManagerName || idea.ownerName || '',
        holder: idea.applicantName || idea.applicant || '',
        technicalSupport: idea.techSupportDept || idea.governmentGrant || '',
        governmentGrant: idea.governmentGrant || '',
        budget: idea.totalBudget || idea.budget || 0,
        budgetUsed: 0,
        startDate: idea.expectedStartDate || idea.startDate || '',
        endDate: idea.targetCompletionDate || idea.expectedEndDate || '',
        status: 'Planning',
        stages: [],
        createdAt: idea.approvedAt || idea.createdAt,
        originalIdeaId: idea.id,
        _isApprovedIdea: true,   // flag to show a label on the card
      }));
    return [...projects, ...approvedIdeaProjects];
  }, [projects, ideas]);

  const [viewProject, setViewProject] = useState(() => {
    return null; // will be resolved in the filtered useMemo below
  });

  const filtered = useMemo(() => {
    let list = [...combinedItems];
    if (filter !== 'all') {
      list = list.filter((p) => p.status === filter);
    }
    switch (sortBy) {
      case 'created-desc':
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'created-asc':
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'end-asc':
        list.sort((a, b) => {
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate) - new Date(b.endDate);
        });
        break;
      case 'amount-desc':
        list.sort((a, b) => (b.budget || 0) - (a.budget || 0));
        break;
      case 'amount-asc':
        list.sort((a, b) => (a.budget || 0) - (b.budget || 0));
        break;
      default:
        break;
    }
    return list;
  }, [combinedItems, filter, sortBy]);

  const handleDelete = (id) => {
    deleteProject(id);
    setDeleteConfirm(null);
  };

  if (viewProject) {
    return (
      <div className="page">
        <button className="btn btn--text" onClick={() => setViewProject(null)}>
          ← Back to Projects
        </button>
        <ProjectDetailPage project={viewProject} onBack={() => setViewProject(null)} onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="page">
      {/* ===== HEADER ===== */}
      <header className="myprojects-header">
        <div className="myprojects-header-row">
          <h2 className="myprojects-title">My Projects</h2>
          <div className="myprojects-header-actions">
            {/* Filter tabs */}
            <div className="myprojects-filters">
              {[
                { key: 'all', label: 'All' },
                { key: 'Planning', label: 'Planning' },
                { key: 'In Progress', label: 'In Progress' },
                { key: 'Completed', label: 'Completed' },
              ].map((f) => (
                <button
                  key={f.key}
                  className={`myprojects-filter-btn ${filter === f.key ? 'myprojects-filter-btn--active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <select
              className="myprojects-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created-desc">Created Date (Newest)</option>
              <option value="created-asc">Created Date (Oldest)</option>
              <option value="end-asc">End Date (Earliest)</option>
              <option value="amount-desc">Amount (High → Low)</option>
              <option value="amount-asc">Amount (Low → High)</option>
            </select>

          </div>
        </div>
      </header>

      {/* ===== PROJECT GRID ===== */}
      <div className="myprojects-grid">
        {filtered.length === 0 && <p className="empty-text">No projects available</p>}
        {filtered.map((project) => {
          const health = getProjectHealth(project);
          return (
            <div key={project.id} className={`myprojects-card ${project._isApprovedIdea ? 'myprojects-card--idea' : ''}`}>
              {project._isApprovedIdea && <div className="myprojects-idea-badge">✅ Approved Idea</div>}
              {/* Top row: health dot + label + ID + status + delete */}
              <div className="myprojects-card-top">
                <div className="myprojects-card-health">
                  <span
                    className={`health-dot-simple ${health.cls}`}
                    style={{ backgroundColor: health.color }}
                  />
                  <span className="myprojects-health-label">{health.label}</span>
                </div>
                <div className="myprojects-card-id-status">
                  <span className="myprojects-id-tag">ID: {project.id}</span>
                  {project.originalIdeaId && (
                    <span className="myprojects-idea-id-tag">Idea: {project.originalIdeaId}</span>
                  )}
                  <span className={`myprojects-status-badge ${statusClass(project.status)}`}>
                    {project.status || 'Planning'}
                  </span>
                </div>
                <button
                  className="myprojects-delete-icon"
                  title="Delete project"
                  onClick={() => setDeleteConfirm(project.id)}
                >
                  🗑️
                </button>
              </div>

              {/* Title */}
              <h3 className="myprojects-card-title">{project.name}</h3>

              {/* Info grid — 2x3 layout */}
              <div className="myprojects-card-info">
                <div className="myprojects-info-item">
                  <span className="myprojects-info-label">Project Manager</span>
                  <span>{project.manager || '—'}</span>
                </div>
                <div className="myprojects-info-item">
                  <span className="myprojects-info-label">Project Owner</span>
                  <span>{project.holder || '—'}</span>
                </div>
                <div className="myprojects-info-item">
                  <span className="myprojects-info-label">Technical Support</span>
                  <span>{project.technicalSupport || project.governmentGrant || '—'}</span>
                </div>
                <div className="myprojects-info-item">
                  <span className="myprojects-info-label">Amount</span>
                  <span className="myprojects-info-amount">
                    HK$ {Number(project.budget || 0).toLocaleString()}
                  </span>
                </div>
                <div className="myprojects-info-item">
                  <span className="myprojects-info-label">Start Date</span>
                  <span>{project.startDate || '—'}</span>
                </div>
                <div className="myprojects-info-item">
                  <span className="myprojects-info-label">Finish Date</span>
                  <span>{project.endDate || '—'}</span>
                </div>
              </div>

              {/* Stages Chips */}
              {(project.stages || []).length > 0 && (
                <div className="myprojects-card-stages">
                  <span className="myprojects-stages-label">Stages:</span>
                  <div className="myprojects-stages-chips">
                    {(project.stages || []).slice(0, 4).map((stage) => (
                      <span key={stage.id} className={`stage-chip stage-chip--${stage.status === 'Completed' ? 'completed' : stage.status === 'In Progress' ? 'progress' : stage.status === 'On Hold' ? 'hold' : 'pending'}`}>
                        <span className={`stage-chip-dot stage-chip-dot--${stage.status === 'Completed' ? 'green' : stage.status === 'In Progress' ? 'blue' : stage.status === 'On Hold' ? 'orange' : 'gray'}`} />
                        {stage.type}
                      </span>
                    ))}
                    {(project.stages || []).length > 4 && (
                      <span className="stage-chip stage-chip--more">+{project.stages.length - 4} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="myprojects-card-actions">
                <button
                  className="myprojects-btn-primary"
                  onClick={() => setViewProject(project)}
                >
                  Detail
                </button>
                <button
                  className="myprojects-btn-edit"
                  onClick={() => onNavigate && onNavigate('project-form', project)}
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Deletion">
        <p>Are you sure you want to permanently delete this project?</p>
        <p className="text-muted">This action cannot be undone.</p>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn--danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}

/* ───── Collapsible Section Helper ───── */
function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`detail-collapsible ${open ? 'detail-collapsible--open' : ''}`}>
      <div className="detail-collapsible-header" onClick={() => setOpen(!open)}>
        <span className="detail-collapsible-arrow">{open ? '▼' : '▶'}</span>
        <h3>{title}</h3>
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

/* ───── Detail Page ───── */
function ProjectDetailPage({ project, onBack, onNavigate }) {
  const { projects, ideas, updateProject, deleteProject } = useData();
  const { user, isSuperAdmin } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  // Derive the latest project data from context so Activity Log stays up-to-date
  const latestProject = useMemo(() => {
    const found = projects.find((p) => p.id === project.id);
    return found || project;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, projects, refreshKey]);
  const health = calculateHealth(latestProject);

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
    const updatedStages = [...(project.stages || []), newStage];
    updateProject(project.id, { stages: updatedStages });
    addProjectLog(project, 'Stage Added', `Added stage "${newStage.type}" (${formatDate(newStage.startDate)} ~ ${formatDate(newStage.endDate)}), Budget: ${formatCurrency(newStage.budget)}`, user, updateProject);
    setShowStageForm(false);
    resetStageForm();
  };

  const handleEditStage = (stage) => {
    setEditingStage(stage.id);
    setStageForm({ ...stage });
    setShowStageForm(true);
  };

  const handleUpdateStage = () => {
    const oldStage = (project.stages || []).find((s) => s.id === editingStage);
    const updatedStages = (project.stages || []).map((s) =>
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
    addProjectLog(project, 'Stage Edited', `Stage "${stageForm.type}": ${changedFields.join(', ') || 'details updated'}`, user, updateProject);
    setShowStageForm(false);
    setEditingStage(null);
    resetStageForm();
  };

  const resetStageForm = () => {
    setStageForm({ type: 'Feasibility', startDate: '', endDate: '', budget: '', budgetUsed: '', status: 'Not Started', description: '' });
  };

  const handleDeleteStage = (stageId) => {
    const deletedStage = (project.stages || []).find((s) => s.id === stageId);
    const updatedStages = (project.stages || []).filter((s) => s.id !== stageId);
    updateProject(project.id, { stages: updatedStages });
    if (deletedStage) {
      addProjectLog(project, 'Stage Deleted', `Deleted stage "${deletedStage.type}" (${deletedStage.status})`, user, updateProject);
    }
    setDeleteStageConfirm(null);
  };

  function statusBadgeClass(status) {
    if (status === 'Completed') return 'status-badge--completed';
    if (status === 'In Progress') return 'status-badge--progress';
    return 'status-badge--planning';
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
            <button className="btn btn--outline" onClick={() => onNavigate && onNavigate('project-form', project)}>Edit</button>
            <button className="btn btn--danger" onClick={() => setDeleteConfirm(true)}>Delete</button>
          </div>
        </div>
        <div className="detail-meta-row">
          <span className="detail-meta-health">
            <span className="health-dot health-dot--large" style={{ backgroundColor: health.color }} />
            <span className="detail-meta-text" style={{ color: health.color }}>
              {health.label}{health.reasons && health.reasons.length > 0 ? ` - ${health.reasons.join(', ')}` : ''}
            </span>
          </span>
          <span className="detail-divider">|</span>
          <span className="detail-id">ID: {project.id}</span>
          {project.originalIdeaId && (
            <>
              <span className="detail-divider">|</span>
              <span className="detail-idea-id">Idea: {project.originalIdeaId}</span>
            </>
          )}
        </div>
      </div>

      {/* ===== FULL PROJECT DATA ===== */}
      <CollapsibleSection title="Project Information 項目基本資料" defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field"><label>Project Name 項目名稱</label><p>{project.name || '-'}</p></div>
          <div className="detail-field"><label>Status 狀態</label><p>{project.status || '-'}</p></div>
          <div className="detail-field detail-field--full"><label>Description 簡短描述</label><p>{project.description || '-'}</p></div>
          <div className="detail-field detail-field--full"><label>Detail Content 詳細內容</label><p>{project.detailContent || '-'}</p></div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Team 項目團隊" defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field"><label>Holder 持有人</label><p>{project.holder || '-'}</p></div>
          <div className="detail-field"><label>Manager 項目經理</label><p>{project.manager || '-'}</p></div>
          {project.applicantName && <div className="detail-field"><label>Applicant 申請人</label><p>{project.applicantName}</p></div>}
          {project.department && <div className="detail-field"><label>Department 部門</label><p>{project.department}</p></div>}
          {project.contactNumber && <div className="detail-field"><label>Contact 聯絡電話</label><p>{project.contactNumber}</p></div>}
          {project.email && <div className="detail-field"><label>Email 電郵</label><p>{project.email}</p></div>}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Dates 日期範圍" defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field"><label>Start Date 開始日期</label><p>{formatDate(project.startDate) || '-'}</p></div>
          <div className="detail-field"><label>End Date 結束日期</label><p>{formatDate(project.endDate) || 'TBD'}</p></div>
          {project.targetCompletionDate && <div className="detail-field"><label>Target Completion 目標完成</label><p>{project.targetCompletionDate}</p></div>}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Budget & Funding 預算及資金" defaultOpen={true}>
        <div className="detail-grid-2col">
          <div className="detail-field"><label>Total Budget 總預算</label><p>{formatCurrency(project.budget)}</p></div>
          <div className="detail-field"><label>Budget Used 已使用</label><p>{formatCurrency(project.budgetUsed)}</p></div>
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
          <h3>Project Stages 項目階段 ({project.stages?.length || 0})</h3>
            <button className="btn btn--small" onClick={() => { resetStageForm(); setShowStageForm(true); setEditingStage(null); }}>
              + Add Stage
            </button>
        </div>
        {(project.stages || []).length === 0 && <p className="empty-text">No stages defined</p>}
        <div className="stages-list">
          {(project.stages || []).map((stage) => (
            <div key={stage.id} className="stage-card">
              <div className="stage-header">
                <span className="stage-type">{stage.type}</span>
                <span className={`status-badge status-badge--small status-badge--${stage.status === 'Completed' ? 'completed' : stage.status === 'In Progress' ? 'progress' : stage.status === 'On Hold' ? 'hold' : 'pending'}`}>
                  {stage.status}
                </span>
              </div>
              <p className="stage-desc">{stage.description}</p>
              <div className="stage-dates">
                <span>📅 {formatDate(stage.startDate)} - {formatDate(stage.endDate)}</span>
              </div>
              <div className="stage-budget">
                <span>💰 {formatCurrency(stage.budget)}</span>
                <span className={stage.budgetUsed > stage.budget * 0.9 ? 'text-danger' : ''}>
                  Used: {formatCurrency(stage.budgetUsed)}
                </span>
              </div>
              <div className="stage-actions">
                <button className="btn btn--small btn--outline" onClick={() => handleEditStage(stage)}>Edit</button>
                <button className="btn btn--small btn--danger" onClick={() => setDeleteStageConfirm(stage.id)}>Delete</button>
              </div>
            </div>
          ))}
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
          <button className="btn btn--danger" onClick={() => { deleteProject(project.id); onBack(); }}>Delete</button>
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
      <CollapsibleSection title={`Activity Log 活動記錄 (${(latestProject.logs || []).length})`} defaultOpen={false}>
        <div className="activity-log-toolbar">
          <span className="activity-log-count">{latestProject.logs?.length || 0} entries</span>
          <div className="activity-log-actions">
            <button
              className="btn btn--small"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              🔄 Refresh
            </button>
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
                <div className="activity-log-timestamp">{formatDateTime(log.timestamp)}</div>
                <div className="activity-log-user">{log.user}</div>
                <div className="activity-log-action">
                  <span className="activity-log-action-tag">{log.action}</span>
                </div>
                <div className="activity-log-details">{log.details}</div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}