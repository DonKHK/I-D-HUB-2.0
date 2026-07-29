import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import { addProjectLog, formatDate, formatDateTime, formatCurrency, calculateHealth } from '../utils/helpers';

export default function MyProject() {
  const navigate = useNavigate();
  const { userProjectId } = useAuth();
  const { projects, updateProject } = useData();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Stage management
  const [showStageForm, setShowStageForm] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageForm, setStageForm] = useState({ type: 'Feasibility', startDate: '', endDate: '', budget: '', budgetUsed: '', status: 'Not Started', description: '' });
  const [deleteStageConfirm, setDeleteStageConfirm] = useState(null);

  // Refresh key for activity log
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (userProjectId) {
      const p = projects.find((pr) => pr.id === userProjectId);
      if (p) {
        setProject(p);
        setEditForm({
          name: p.name || '',
          description: p.description || '',
          detailContent: p.detailContent || '',
          startDate: p.startDate || '',
          endDate: p.endDate || '',
          budget: p.budget || '',
          budgetUsed: p.budgetUsed || '',
          manager: p.manager || '',
          holder: p.holder || '',
          background: p.background || '',
          painPoint: p.painPoint || '',
          benefits: p.benefits || '',
          deliverables: p.deliverables || '',
          status: p.status || 'Planning',
        });
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userProjectId, projects, refreshKey]);

  // Determine project status color
  const statusColor = {
    'Planning': '#f59e0b',
    'In Progress': '#3b82f6',
    'Completed': '#10b981',
    'On Hold': '#ef4444',
    'Cancelled': '#6b7280',
  }[project?.status] || '#6b7280';

  const health = project ? calculateHealth(project) : { color: '#6b7280', label: 'N/A' };

  const resetStageForm = () => {
    setStageForm({ type: 'Feasibility', startDate: '', endDate: '', budget: '', budgetUsed: '', status: 'Not Started', description: '' });
  };

  const handleAddStage = () => {
    const newStage = {
      ...stageForm,
      id: 's' + Date.now(),
      budget: parseFloat(stageForm.budget) || 0,
      budgetUsed: parseFloat(stageForm.budgetUsed) || 0,
    };
    const updatedStages = [...(project.stages || []), newStage];
    updateProject(project.id, { stages: updatedStages });
    addProjectLog(project, 'Stage Added', `Added stage "${newStage.type}" (${formatDate(newStage.startDate)} ~ ${formatDate(newStage.endDate)}), Budget: ${formatCurrency(newStage.budget)}`, null, updateProject);
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
      if (parseFloat(oldStage.budget || 0) !== parseFloat(stageForm.budget || 0)) changedFields.push(`budget: ${formatCurrency(oldStage.budget)} → ${formatCurrency(stageForm.budget)}`);
      if (oldStage.startDate !== stageForm.startDate) changedFields.push(`startDate: ${oldStage.startDate} → ${stageForm.startDate}`);
      if (oldStage.endDate !== stageForm.endDate) changedFields.push(`endDate: ${oldStage.endDate} → ${stageForm.endDate}`);
    }
    addProjectLog(project, 'Stage Edited', `Stage "${stageForm.type}": ${changedFields.join(', ') || 'details updated'}`, null, updateProject);
    setShowStageForm(false);
    setEditingStage(null);
    resetStageForm();
  };

  const handleDeleteStage = (stageId) => {
    const deletedStage = (project.stages || []).find((s) => s.id === stageId);
    const updatedStages = (project.stages || []).filter((s) => s.id !== stageId);
    updateProject(project.id, { stages: updatedStages });
    if (deletedStage) {
      addProjectLog(project, 'Stage Deleted', `Deleted stage "${deletedStage.type}" (${deletedStage.status})`, null, updateProject);
    }
    setDeleteStageConfirm(null);
  };

  const handleSaveEdit = () => {
    const changedFields = [];
    if (editForm.name !== project.name) changedFields.push(`name: "${project.name}" → "${editForm.name}"`);
    if (editForm.status !== project.status) changedFields.push(`status: ${project.status} → ${editForm.status}`);
    if (editForm.description !== (project.description || '')) changedFields.push('description updated');
    if (editForm.startDate !== (project.startDate || '')) changedFields.push(`startDate: ${project.startDate || '-'} → ${editForm.startDate || '-'}`);
    if (editForm.endDate !== (project.endDate || '')) changedFields.push(`endDate: ${project.endDate || '-'} → ${editForm.endDate || '-'}`);
    if (parseFloat(editForm.budget || 0) !== parseFloat(project.budget || 0)) changedFields.push(`budget: ${formatCurrency(project.budget)} → ${formatCurrency(editForm.budget)}`);

    updateProject(project.id, editForm);
    if (changedFields.length > 0) {
      addProjectLog(project, 'Project Edited', `Updated: ${changedFields.join('; ')}`, null, updateProject);
    }
    setEditMode(false);
    setRefreshKey((k) => k + 1);
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: project.name || '',
      description: project.description || '',
      detailContent: project.detailContent || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      budget: project.budget || '',
      budgetUsed: project.budgetUsed || '',
      manager: project.manager || '',
      holder: project.holder || '',
      background: project.background || '',
      painPoint: project.painPoint || '',
      benefits: project.benefits || '',
      deliverables: project.deliverables || '',
      status: project.status || 'Planning',
    });
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container">
        <div className="page-card">
          <h2>My Project</h2>
          <p>No project found for your account. Please contact the system administrator.</p>
        </div>
      </div>
    );
  }

  /* ===== STAGE STATUS BADGE CLASS ===== */
  const stageBadgeClass = (status) => {
    if (status === 'Completed') return 'status-badge--completed';
    if (status === 'In Progress') return 'status-badge--progress';
    if (status === 'On Hold') return 'status-badge--hold';
    return 'status-badge--pending';
  };

  return (
    <div className="page-container">
      <div className="page-card">
        {/* ===== HEADER ===== */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2>My Project</h2>
            <span className="project-status-badge" style={{ backgroundColor: statusColor }}>
              {project.status || 'Planning'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {!editMode ? (
              <button className="btn btn--primary" onClick={() => setEditMode(true)}>
                ✏️ Edit Project
              </button>
            ) : (
              <>
                <button className="btn btn--primary" onClick={handleSaveEdit}>
                  💾 Save Changes
                </button>
                <button className="btn btn--outline" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Health Status */}
        <div className="detail-meta-row" style={{ marginBottom: '16px' }}>
          <span className="detail-meta-health">
            <span
              className="health-dot health-dot--large"
              style={{ backgroundColor: health.color }}
            />
            <span className="detail-meta-text" style={{ color: health.color }}>
              {health.label}
            </span>
          </span>
          <span className="detail-divider">|</span>
          <span className="detail-id">ID: {project.id}</span>
        </div>

        {/* ===== INLINE EDIT FIELDS ===== */}
        <div className="edit-fields">
          {/* Project Name */}
          <div className="form-section">
            <h3 className="form-section-title">Project Name 項目名稱</h3>
            {editMode ? (
              <input
                className="form-input"
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            ) : (
              <p className="form-section-value">{project.name || 'Untitled'}</p>
            )}
          </div>

          {/* Status */}
          <div className="form-section">
            <h3 className="form-section-title">Status 狀態</h3>
            {editMode ? (
              <select
                className="form-select"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                {['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <p className="form-section-value">{project.status || 'Planning'}</p>
            )}
          </div>

          {/* Description */}
          <div className="form-section">
            <h3 className="form-section-title">Description 簡短描述</h3>
            {editMode ? (
              <textarea
                className="form-textarea"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            ) : (
              <p className="form-section-value">{project.description || '-'}</p>
            )}
          </div>

          {/* Detail Content */}
          {editMode || project.detailContent ? (
            <div className="form-section">
              <h3 className="form-section-title">Detail Content 詳細內容</h3>
              {editMode ? (
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={editForm.detailContent}
                  onChange={(e) => setEditForm({ ...editForm, detailContent: e.target.value })}
                />
              ) : (
                <p className="form-section-value">{project.detailContent || '-'}</p>
              )}
            </div>
          ) : null}

          {/* Timeline */}
          <div className="form-section">
            <h3 className="form-section-title">Timeline 時間表</h3>
            {editMode ? (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', marginBottom: '2px', display: 'block' }}>Start Date 開始日期</label>
                  <input
                    className="form-input"
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', marginBottom: '2px', display: 'block' }}>End Date 結束日期</label>
                  <input
                    className="form-input"
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <p className="form-section-value">
                {project.startDate ? `Start: ${formatDate(project.startDate)}` : ''}
                {project.startDate && project.endDate ? ' | ' : ''}
                {project.endDate ? `End: ${formatDate(project.endDate)}` : 'No dates set'}
              </p>
            )}
          </div>

          {/* Budget */}
          <div className="form-section">
            <h3 className="form-section-title">Budget 預算</h3>
            {editMode ? (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', marginBottom: '2px', display: 'block' }}>Total Budget (HKD)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', marginBottom: '2px', display: 'block' }}>Budget Used (HKD)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={editForm.budgetUsed}
                    onChange={(e) => setEditForm({ ...editForm, budgetUsed: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <p className="form-section-value">
                {(project.budget > 0 || project.totalBudget > 0) ? `HK$ ${(project.budget || project.totalBudget || 0).toLocaleString()}` : 'No budget set'}
              </p>
            )}
          </div>

          {/* Key Contacts */}
          <div className="form-section">
            <h3 className="form-section-title">Key Contacts 主要聯絡人</h3>
            {editMode ? (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', marginBottom: '2px', display: 'block' }}>Manager 經理</label>
                  <input
                    className="form-input"
                    type="text"
                    value={editForm.manager}
                    onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', marginBottom: '2px', display: 'block' }}>Holder 持有人</label>
                  <input
                    className="form-input"
                    type="text"
                    value={editForm.holder}
                    onChange={(e) => setEditForm({ ...editForm, holder: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div>
                {project.manager && <p><strong>Manager:</strong> {project.manager}</p>}
                {project.holder && <p><strong>Holder:</strong> {project.holder}</p>}
                {project.projectManagerName && <p><strong>Project Manager:</strong> {project.projectManagerName}</p>}
                {!project.manager && !project.holder && !project.projectManagerName && <p className="form-section-value">-</p>}
              </div>
            )}
          </div>

          {/* Background */}
          {editMode || project.background ? (
            <div className="form-section">
              <h3 className="form-section-title">Background 背景</h3>
              {editMode ? (
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={editForm.background}
                  onChange={(e) => setEditForm({ ...editForm, background: e.target.value })}
                />
              ) : (
                <p className="form-section-value">{project.background}</p>
              )}
            </div>
          ) : null}

          {/* Pain Point */}
          {editMode || project.painPoint ? (
            <div className="form-section">
              <h3 className="form-section-title">Pain Point 痛點</h3>
              {editMode ? (
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={editForm.painPoint}
                  onChange={(e) => setEditForm({ ...editForm, painPoint: e.target.value })}
                />
              ) : (
                <p className="form-section-value">{project.painPoint}</p>
              )}
            </div>
          ) : null}

          {/* Expected Benefits */}
          {editMode || project.benefits ? (
            <div className="form-section">
              <h3 className="form-section-title">Expected Benefits 預期效益</h3>
              {editMode ? (
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={editForm.benefits}
                  onChange={(e) => setEditForm({ ...editForm, benefits: e.target.value })}
                />
              ) : (
                <p className="form-section-value">{project.benefits}</p>
              )}
            </div>
          ) : null}

          {/* Deliverables */}
          {editMode || project.deliverables ? (
            <div className="form-section">
              <h3 className="form-section-title">Deliverables 交付成果</h3>
              {editMode ? (
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={editForm.deliverables}
                  onChange={(e) => setEditForm({ ...editForm, deliverables: e.target.value })}
                />
              ) : (
                <p className="form-section-value">{project.deliverables}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* ===== PROJECT STAGES ===== */}
        <div className="form-section" style={{ marginTop: '24px' }}>
          <div className="card-header-row">
            <h3 className="form-section-title">Project Stages 項目階段 ({project.stages?.length || 0})</h3>
            <button
              className="btn btn--small"
              onClick={() => { resetStageForm(); setShowStageForm(true); setEditingStage(null); }}
            >
              + Add Stage
            </button>
          </div>

          {(project.stages && project.stages.length > 0) ? (
            <div className="stages-list" style={{ marginTop: '12px' }}>
              {project.stages.map((stage) => (
                <div key={stage.id} className="stage-card">
                  <div className="stage-header">
                    <span className="stage-type">{stage.name || stage.type || stage.stage || '-'}</span>
                    <span className={`status-badge status-badge--small ${stageBadgeClass(stage.status)}`}>
                      {stage.status || 'Not Started'}
                    </span>
                  </div>
                  {stage.description && <p className="stage-desc">{stage.description}</p>}
                  <div className="stage-dates">
                    <span>📅 {formatDate(stage.startDate)} - {formatDate(stage.endDate)}</span>
                  </div>
                  <div className="stage-budget">
                    <span>💰 {formatCurrency(stage.budget)}</span>
                    {(stage.budgetUsed > 0) && (
                      <span className={stage.budgetUsed > (stage.budget || 0) * 0.9 ? 'text-danger' : ''}>
                        Used: {formatCurrency(stage.budgetUsed)}
                      </span>
                    )}
                  </div>
                  <div className="stage-actions">
                    <button className="btn btn--small btn--outline" onClick={() => handleEditStage(stage)}>Edit</button>
                    <button className="btn btn--small btn--danger" onClick={() => setDeleteStageConfirm(stage.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text" style={{ marginTop: '8px' }}>No stages defined yet</p>
          )}
        </div>

        {/* ===== ACTIVITY LOG ===== */}
        <div className="form-section" style={{ marginTop: '24px' }}>
          <h3 className="form-section-title">
            Activity Log 活動記錄 ({project.logs?.length || 0})
          </h3>
          {project.logs && project.logs.length > 0 ? (
            <div className="activity-log-list" style={{ marginTop: '8px' }}>
              {[...project.logs].reverse().map((log) => (
                <div key={log.id} className="activity-log-entry">
                  <span className="activity-log-timestamp">{formatDateTime(log.timestamp)}</span>
                  <span className="activity-log-user">{log.user}</span>
                  <span className="activity-log-action-tag">{log.action}</span>
                  <span className="activity-log-details">{log.details}</span>
                  {/* No delete button for PROJECT_USER */}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text" style={{ marginTop: '8px' }}>No activity recorded yet</p>
          )}
        </div>
      </div>

      {/* ===== STAGE FORM MODAL ===== */}
      <Modal
        isOpen={showStageForm}
        onClose={() => { setShowStageForm(false); setEditingStage(null); resetStageForm(); }}
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
            <button className="btn btn--outline" onClick={() => { setShowStageForm(false); setEditingStage(null); resetStageForm(); }}>Cancel</button>
            <button className="btn btn--primary" onClick={editingStage ? handleUpdateStage : handleAddStage}>
              {editingStage ? 'Update' : 'Add'} Stage
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== STAGE DELETE CONFIRM ===== */}
      <Modal
        isOpen={!!deleteStageConfirm}
        onClose={() => setDeleteStageConfirm(null)}
        title="Confirm Delete Stage"
      >
        <p>Are you sure you want to delete this stage?</p>
        <p className="text-muted">This action cannot be undone. It will be recorded in the Activity Log.</p>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setDeleteStageConfirm(null)}>Cancel</button>
          <button className="btn btn--danger" onClick={() => { handleDeleteStage(deleteStageConfirm); }}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}