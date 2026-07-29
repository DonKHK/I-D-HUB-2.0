import React, { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { calculateHealth, formatDate, formatDateTime, formatCurrency, daysUntil } from '../utils/helpers';
import Modal from '../components/Modal';
import ProjectDetail from '../components/ProjectDetail';

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
        <ProjectDetail project={viewProject} onBack={() => setViewProject(null)} onNavigate={onNavigate} />
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

