import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { generateProjectId, formatDate, formatCurrency } from '../utils/helpers';
import Modal from '../components/Modal';

const STAGE_TYPES = ['Idea / R&D', 'Feasibility', 'POC', 'Demo', 'Pilot', 'Commercialization', 'Production'];
const STAGE_STATUSES = ['Not Started', 'In Progress', 'Completed', 'On Hold'];

const emptyStageForm = {
  type: 'Feasibility',
  startDate: '',
  endDate: '',
  budget: '',
  budgetUsed: '',
  status: 'Not Started',
  description: '',
};

export default function ProjectForm({ editProject, onBack }) {
  const { addProject, updateProject, projects } = useData();
  const isEditing = !!editProject;

  const [form, setForm] = useState({
    name: '',
    description: '',
    detailContent: '',
    governmentGrant: '',
    technicalSupport: '',
    manager: '',
    holder: '',
    startDate: '',
    endDate: '',
    budget: '',
    budgetUsed: '',
    status: 'Planning',
  });

  const [stages, setStages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stageToDelete, setStageToDelete] = useState(null);

  // Stage modal state
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStageId, setEditingStageId] = useState(null);
  const [stageForm, setStageForm] = useState({ ...emptyStageForm });

  useEffect(() => {
    if (editProject) {
      setForm({
        name: editProject.name || '',
        description: editProject.description || '',
        detailContent: editProject.detailContent || '',
        governmentGrant: editProject.governmentGrant || '',
        technicalSupport: editProject.technicalSupport || '',
        manager: editProject.manager || '',
        holder: editProject.holder || '',
        startDate: editProject.startDate || '',
        endDate: editProject.endDate || '',
        budget: editProject.budget || '',
        budgetUsed: editProject.budgetUsed || '',
        status: editProject.status || 'Planning',
      });
      setStages(editProject.stages ? [...editProject.stages] : []);
    }
  }, [editProject]);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  // ── Stage handlers ──
  const openAddStage = () => {
    setStageForm({ ...emptyStageForm });
    setEditingStageId(null);
    setShowStageModal(true);
  };

  const openEditStage = (stage) => {
    setStageForm({ ...stage });
    setEditingStageId(stage.id);
    setShowStageModal(true);
  };

  const openDeleteConfirm = (stage) => {
    setStageToDelete(stage);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStage = () => {
    if (stageToDelete) {
      setStages((prev) => prev.filter((s) => s.id !== stageToDelete.id));
    }
    setShowDeleteConfirm(false);
    setStageToDelete(null);
  };

  const cancelDeleteStage = () => {
    setShowDeleteConfirm(false);
    setStageToDelete(null);
  };

  const handleSaveStage = () => {
    const parsed = {
      ...stageForm,
      budget: parseFloat(stageForm.budget) || 0,
      budgetUsed: parseFloat(stageForm.budgetUsed) || 0,
    };

    if (editingStageId) {
      // Update existing stage
      setStages((prev) =>
        prev.map((s) => (s.id === editingStageId ? { ...s, ...parsed } : s))
      );
    } else {
      // Add new stage
      const newStage = {
        ...parsed,
        id: 's' + Date.now(),
      };
      setStages((prev) => [...prev, newStage]);
    }

    setShowStageModal(false);
    setEditingStageId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      if (isEditing) {
        updateProject(editProject.id, {
          ...form,
          budget: parseFloat(form.budget) || 0,
          budgetUsed: parseFloat(form.budgetUsed) || 0,
          stages: stages,
        });
      } else {
        const existingIds = projects.map((p) => p.id);
        const newProject = {
          ...form,
          id: generateProjectId(existingIds),
          budget: parseFloat(form.budget) || 0,
          budgetUsed: parseFloat(form.budgetUsed) || 0,
          stages: stages,
          createdAt: new Date().toISOString(),
        };
        addProject(newProject);
      }
      setSaving(false);
      if (onBack) onBack();
    }, 200);
  };

  return (
    <div className="page">
      <h1 className="page-title">{isEditing ? 'Edit Project' : 'New Project'}</h1>

      <form className="form form--wide" onSubmit={handleSubmit}>
        {/* ===== Basic Information ===== */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label>Project Name *</label>
            <input required value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Enter project name" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows="2" value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Short description" />
          </div>
          <div className="form-group">
            <label>Detail Content</label>
            <textarea rows="3" value={form.detailContent} onChange={(e) => handleChange('detailContent', e.target.value)} placeholder="Detailed description of the project" />
          </div>
        </div>

        {/* ===== Team & Dates ===== */}
        <div className="form-section">
          <h3>Team & Dates</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Project Owner (Holder)</label>
              <input value={form.holder} onChange={(e) => handleChange('holder', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Project Manager</label>
              <input value={form.manager} onChange={(e) => handleChange('manager', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ===== Funding & Support ===== */}
        <div className="form-section">
          <h3>Funding & Support</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Government Grant</label>
              <input value={form.governmentGrant} onChange={(e) => handleChange('governmentGrant', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Technical Support</label>
              <input value={form.technicalSupport} onChange={(e) => handleChange('technicalSupport', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Total Budget (HKD)</label>
              <input type="number" min="0" value={form.budget} onChange={(e) => handleChange('budget', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Budget Used (HKD)</label>
              <input type="number" min="0" value={form.budgetUsed} onChange={(e) => handleChange('budgetUsed', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ===== Status ===== */}
        <div className="form-section">
          <h3>Status</h3>
          <div className="form-group">
            <label>Project Status</label>
            <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
              {['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ===== Project Stages ===== */}
        {isEditing && (
          <div className="form-section">
            <div className="card-header-row">
              <h3>Project Stages ({stages.length})</h3>
              <button type="button" className="btn btn--small" onClick={openAddStage}>
                + Add Stage
              </button>
            </div>

            {stages.length === 0 && <p className="empty-text">No stages defined</p>}

            <div className="stages-list">
              {stages.map((stage) => (
                <div key={stage.id} className="stage-card">
                  <div className="stage-header">
                    <span className="stage-type">{stage.type}</span>
                    <span className={`status-badge status-badge--small status-badge--${
                      stage.status === 'Completed' ? 'completed' :
                      stage.status === 'In Progress' ? 'progress' :
                      stage.status === 'On Hold' ? 'hold' : 'pending'
                    }`}>
                      {stage.status}
                    </span>
                  </div>
                  <p className="stage-desc">{stage.description || '—'}</p>
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
                    <button type="button" className="btn btn--small btn--outline" onClick={() => openEditStage(stage)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn--small btn--danger" onClick={() => openDeleteConfirm(stage)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Form Actions ===== */}
        <div className="form-actions">
          <button type="button" className="btn btn--outline" onClick={onBack}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={saving || !form.name.trim()}>
            {saving ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>

      {/* ===== Stage Modal ===== */}
      <Modal
        isOpen={showStageModal}
        onClose={() => { setShowStageModal(false); setEditingStageId(null); }}
        title={editingStageId ? 'Edit Stage' : 'Add Stage'}
      >
        <div className="form">
          <div className="form-group">
            <label>Type</label>
            <select value={stageForm.type} onChange={(e) => setStageForm({ ...stageForm, type: e.target.value })}>
              {STAGE_TYPES.map((t) => (
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
              <input type="number" min="0" value={stageForm.budget} onChange={(e) => setStageForm({ ...stageForm, budget: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Used Amount</label>
              <input type="number" min="0" value={stageForm.budgetUsed} onChange={(e) => setStageForm({ ...stageForm, budgetUsed: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={stageForm.status} onChange={(e) => setStageForm({ ...stageForm, status: e.target.value })}>
              {STAGE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows="2" value={stageForm.description} onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn--outline" onClick={() => { setShowStageModal(false); setEditingStageId(null); }}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={handleSaveStage}>
              {editingStageId ? 'Update Stage' : 'Add Stage'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== Delete Confirmation Modal ===== */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={cancelDeleteStage}
        title="Confirm Delete"
      >
        <div className="form">
          <p style={{ marginBottom: '1.25rem', lineHeight: 1.6 }}>
            Are you sure you want to delete the stage <strong>"{stageToDelete?.type}"</strong>?<br />
            This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn--outline" onClick={cancelDeleteStage}>
              Cancel
            </button>
            <button type="button" className="btn btn--danger" onClick={confirmDeleteStage}>
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
