import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { generateProjectId, formatDate, formatCurrency, addProjectLog } from '../utils/helpers';
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

const emptyForm = {
  // Basic
  name: '',
  description: '',
  detailContent: '',
  status: 'Planning',
  // Team & Dates (original)
  holder: '',
  manager: '',
  startDate: '',
  endDate: '',
  // Funding & Support (original)
  governmentGrant: '',
  technicalSupport: '',
  budget: '',
  budgetUsed: '',
  // Applicant Info
  applicantName: '',
  department: '',
  contactNumber: '',
  email: '',
  // Project Manager details
  projectManagerName: '',
  projectManagerDept: '',
  projectManagerEmail: '',
  projectManagerPhone: '',
  // Owner details
  ownerName: '',
  ownerDept: '',
  ownerContact: '',
  ownerEmail: '',
  // Tech Support contacts
  techSupportName: '',
  techSupportDept: '',
  techSupportContact: '',
  techSupportEmail: '',
  // Project Type
  projectType: '',
  // Project Details (full)
  background: '',
  painPoint: '',
  currentWorkarounds: '',
  deliverables: '',
  benefits: '',
  projectPhases: '',
  risks: '',
  // Timeline & Termination
  targetCompletionDate: '',
  terminationCondition1: '',
  terminationCondition2: '',
  terminationCondition3: '',
  // Budget Breakdown
  totalBudget: '',
  fundSource: '',
  budgetBreakdown: '',
  targetGovFund: '',
  targetGovFundDetails: '',
  // Resources
  resourceRequirements: '',
  crossDeptAssistance: '',
  // Tech & Innovation
  techDirection: '',
  innovationElement: '',
  technicalRequirements: '',
  // IP & Attachments
  requireIP: 'No',
  ipRegion: '',
  remarks: '',
};

export default function ProjectForm({ editProject, onBack }) {
  const { addProject, updateProject, projects } = useData();
  const { user } = useAuth();
  const isEditing = !!editProject;

  const [form, setForm] = useState({ ...emptyForm });
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
        status: editProject.status || 'Planning',
        holder: editProject.holder || '',
        manager: editProject.manager || '',
        startDate: editProject.startDate || '',
        endDate: editProject.endDate || '',
        governmentGrant: editProject.governmentGrant || '',
        technicalSupport: editProject.technicalSupport || '',
        budget: editProject.budget || '',
        budgetUsed: editProject.budgetUsed || '',
        applicantName: editProject.applicantName || '',
        department: editProject.department || '',
        contactNumber: editProject.contactNumber || '',
        email: editProject.email || '',
        projectManagerName: editProject.projectManagerName || '',
        projectManagerDept: editProject.projectManagerDept || '',
        projectManagerEmail: editProject.projectManagerEmail || '',
        projectManagerPhone: editProject.projectManagerPhone || '',
        ownerName: editProject.ownerName || '',
        ownerDept: editProject.ownerDept || '',
        ownerContact: editProject.ownerContact || '',
        ownerEmail: editProject.ownerEmail || '',
        techSupportName: editProject.techSupportName || '',
        techSupportDept: editProject.techSupportDept || '',
        techSupportContact: editProject.techSupportContact || '',
        techSupportEmail: editProject.techSupportEmail || '',
        projectType: editProject.projectType || '',
        background: editProject.background || '',
        painPoint: editProject.painPoint || '',
        currentWorkarounds: editProject.currentWorkarounds || '',
        deliverables: editProject.deliverables || '',
        benefits: editProject.benefits || '',
        projectPhases: editProject.projectPhases || '',
        risks: editProject.risks || '',
        targetCompletionDate: editProject.targetCompletionDate || '',
        terminationCondition1: editProject.terminationCondition1 || '',
        terminationCondition2: editProject.terminationCondition2 || '',
        terminationCondition3: editProject.terminationCondition3 || '',
        totalBudget: editProject.totalBudget || '',
        fundSource: editProject.fundSource || '',
        budgetBreakdown: editProject.budgetBreakdown || '',
        targetGovFund: editProject.targetGovFund || '',
        targetGovFundDetails: editProject.targetGovFundDetails || '',
        resourceRequirements: editProject.resourceRequirements || '',
        crossDeptAssistance: editProject.crossDeptAssistance || '',
        techDirection: editProject.techDirection || '',
        innovationElement: editProject.innovationElement || '',
        technicalRequirements: editProject.technicalRequirements || '',
        requireIP: editProject.requireIP || 'No',
        ipRegion: editProject.ipRegion || '',
        remarks: editProject.remarks || '',
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
      setStages((prev) =>
        prev.map((s) => (s.id === editingStageId ? { ...s, ...parsed } : s))
      );
    } else {
      const newStage = { ...parsed, id: 's' + Date.now() };
      setStages((prev) => [...prev, newStage]);
    }

    setShowStageModal(false);
    setEditingStageId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      const projectData = {
        ...form,
        budget: parseFloat(form.budget) || 0,
        budgetUsed: parseFloat(form.budgetUsed) || 0,
        totalBudget: parseFloat(form.totalBudget) || 0,
        targetGovFund: parseFloat(form.targetGovFund) || 0,
        stages: stages,
      };

      if (isEditing) {
        const oldProject = editProject;
        const changes = [];
        if (oldProject.name !== form.name) changes.push(`name: "${oldProject.name}" → "${form.name}"`);
        if (oldProject.status !== form.status) changes.push(`status: ${oldProject.status} → ${form.status}`);
        if (Number(oldProject.budget) !== Number(form.budget)) changes.push(`budget: ${formatCurrency(oldProject.budget)} → ${formatCurrency(form.budget)}`);
        if (oldProject.startDate !== form.startDate) changes.push(`startDate: ${oldProject.startDate} → ${form.startDate}`);
        if (oldProject.endDate !== form.endDate) changes.push(`endDate: ${oldProject.endDate} → ${form.endDate}`);
        if (oldProject.holder !== form.holder) changes.push(`holder: "${oldProject.holder}" → "${form.holder}"`);
        if (oldProject.manager !== form.manager) changes.push(`manager: "${oldProject.manager}" → "${form.manager}"`);

        updateProject(editProject.id, projectData);
        addProjectLog(editProject, 'Project Updated', `Updated project fields: ${changes.join('; ') || 'no major field changes'}`, user, updateProject);
      } else {
        const existingIds = projects.map((p) => p.id);
        const newProject = {
          ...projectData,
          id: generateProjectId(existingIds),
          createdAt: new Date().toISOString(),
        };
        addProject(newProject);
        // After adding, we can't log via addProjectLog because the project isn't in state yet.
        // Instead we log the creation directly by calling updateProject on the new id after a brief delay.
        setTimeout(() => {
          const logEntry = {
            id: 'log-' + Date.now(),
            timestamp: new Date().toISOString(),
            action: 'Project Created',
            details: `Created project "${newProject.name}" with budget ${formatCurrency(newProject.budget)}, start: ${newProject.startDate || 'TBD'}, end: ${newProject.endDate || 'TBD'}`,
            user: user?.displayName || user?.email || 'Unknown',
          };
          updateProject(newProject.id, { logs: [logEntry] });
        }, 100);
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
          <h3>Basic Information 基本資料</h3>
          <div className="form-group">
            <label>Project Name 項目名稱 *</label>
            <input required value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Enter project name" />
          </div>
          <div className="form-group">
            <label>Description 簡短描述</label>
            <textarea rows="2" value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Short description" />
          </div>
          <div className="form-group">
            <label>Detail Content 詳細內容</label>
            <textarea rows="3" value={form.detailContent} onChange={(e) => handleChange('detailContent', e.target.value)} placeholder="Detailed description of the project" />
          </div>
          <div className="form-group">
            <label>Project Type 項目類型</label>
            <input value={form.projectType} onChange={(e) => handleChange('projectType', e.target.value)} placeholder="e.g. R&D, Construction, IT" />
          </div>
        </div>

        {/* ===== Applicant Information ===== */}
        <div className="form-section">
          <h3>Applicant Information 申請人資料</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Applicant Name 申請人</label>
              <input value={form.applicantName} onChange={(e) => handleChange('applicantName', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Department 部門</label>
              <input value={form.department} onChange={(e) => handleChange('department', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Number 聯絡電話</label>
              <input value={form.contactNumber} onChange={(e) => handleChange('contactNumber', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email 電郵</label>
              <input value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ===== Project Team ===== */}
        <div className="form-section">
          <h3>Project Team 項目團隊</h3>
          <h4 style={{ marginTop: '0.5rem', marginBottom: '0.5rem', color: '#555' }}>Holder 持有人</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Owner Name (Holder) 持有人</label>
              <input value={form.holder} onChange={(e) => handleChange('holder', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Owner Dept 部門</label>
              <input value={form.ownerDept} onChange={(e) => handleChange('ownerDept', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Owner Contact 聯絡電話</label>
              <input value={form.ownerContact} onChange={(e) => handleChange('ownerContact', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Owner Email 電郵</label>
              <input value={form.ownerEmail} onChange={(e) => handleChange('ownerEmail', e.target.value)} />
            </div>
          </div>

          <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#555' }}>Project Manager 項目經理</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Manager Name</label>
              <input value={form.manager} onChange={(e) => handleChange('manager', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Manager Dept 部門</label>
              <input value={form.projectManagerDept} onChange={(e) => handleChange('projectManagerDept', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Manager Email</label>
              <input value={form.projectManagerEmail} onChange={(e) => handleChange('projectManagerEmail', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Manager Phone</label>
              <input value={form.projectManagerPhone} onChange={(e) => handleChange('projectManagerPhone', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ===== Tech Support Contacts ===== */}
        <div className="form-section">
          <h3>Technical Support 技術支援</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Support Name</label>
              <input value={form.techSupportName} onChange={(e) => handleChange('techSupportName', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Support Dept 部門</label>
              <input value={form.techSupportDept} onChange={(e) => handleChange('techSupportDept', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Support Contact</label>
              <input value={form.techSupportContact} onChange={(e) => handleChange('techSupportContact', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Support Email</label>
              <input value={form.techSupportEmail} onChange={(e) => handleChange('techSupportEmail', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ===== Project Details (Full) ===== */}
        <div className="form-section">
          <h3>Project Details 項目詳情</h3>
          <div className="form-group">
            <label>Background 背景</label>
            <textarea rows="2" value={form.background} onChange={(e) => handleChange('background', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Pain Points 痛點</label>
            <textarea rows="2" value={form.painPoint} onChange={(e) => handleChange('painPoint', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Current Workarounds 現有替代方案</label>
            <textarea rows="2" value={form.currentWorkarounds} onChange={(e) => handleChange('currentWorkarounds', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Deliverables 交付成果</label>
            <textarea rows="2" value={form.deliverables} onChange={(e) => handleChange('deliverables', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Benefits 預期效益</label>
            <textarea rows="2" value={form.benefits} onChange={(e) => handleChange('benefits', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Project Phases 項目階段</label>
            <textarea rows="2" value={form.projectPhases} onChange={(e) => handleChange('projectPhases', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Risks 風險</label>
            <textarea rows="2" value={form.risks} onChange={(e) => handleChange('risks', e.target.value)} />
          </div>
        </div>

        {/* ===== Dates ===== */}
        <div className="form-section">
          <h3>Dates 日期範圍</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date 開始日期</label>
              <input type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Date 結束日期</label>
              <input type="date" value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Target Completion Date 目標完成日期</label>
            <input type="date" value={form.targetCompletionDate} onChange={(e) => handleChange('targetCompletionDate', e.target.value)} />
          </div>
        </div>

        {/* ===== Termination Conditions ===== */}
        <div className="form-section">
          <h3>Termination Conditions 終止條件</h3>
          <div className="form-group">
            <label>Termination Condition 1</label>
            <textarea rows="1" value={form.terminationCondition1} onChange={(e) => handleChange('terminationCondition1', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Termination Condition 2</label>
            <textarea rows="1" value={form.terminationCondition2} onChange={(e) => handleChange('terminationCondition2', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Termination Condition 3</label>
            <textarea rows="1" value={form.terminationCondition3} onChange={(e) => handleChange('terminationCondition3', e.target.value)} />
          </div>
        </div>

        {/* ===== Budget & Funding ===== */}
        <div className="form-section">
          <h3>Budget & Funding 預算及資金</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Total Budget 總預算 (HKD)</label>
              <input type="number" min="0" value={form.budget} onChange={(e) => handleChange('budget', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Budget Used 已使用 (HKD)</label>
              <input type="number" min="0" value={form.budgetUsed} onChange={(e) => handleChange('budgetUsed', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Fund Source 資金來源</label>
              <input value={form.fundSource} onChange={(e) => handleChange('fundSource', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Government Grant 政府資助</label>
              <input value={form.governmentGrant} onChange={(e) => handleChange('governmentGrant', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Budget Breakdown 預算細項</label>
            <textarea rows="2" value={form.budgetBreakdown} onChange={(e) => handleChange('budgetBreakdown', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Target Gov. Fund 目標政府資助 (HKD)</label>
              <input type="number" min="0" value={form.targetGovFund} onChange={(e) => handleChange('targetGovFund', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Technical Support 技術支援</label>
              <input value={form.technicalSupport} onChange={(e) => handleChange('technicalSupport', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Gov. Fund Details 資助詳情</label>
            <textarea rows="2" value={form.targetGovFundDetails} onChange={(e) => handleChange('targetGovFundDetails', e.target.value)} />
          </div>
        </div>

        {/* ===== Resources ===== */}
        <div className="form-section">
          <h3>Resources & Support 資源及協助</h3>
          <div className="form-group">
            <label>Resource Requirements 資源需求</label>
            <textarea rows="2" value={form.resourceRequirements} onChange={(e) => handleChange('resourceRequirements', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Cross-dept Assistance 跨部門協助</label>
            <textarea rows="2" value={form.crossDeptAssistance} onChange={(e) => handleChange('crossDeptAssistance', e.target.value)} />
          </div>
        </div>

        {/* ===== Technical & Innovation ===== */}
        <div className="form-section">
          <h3>Technical & Innovation 技術及創新</h3>
          <div className="form-group">
            <label>Tech Direction 技術方向</label>
            <textarea rows="2" value={form.techDirection} onChange={(e) => handleChange('techDirection', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Innovation Element 創新元素</label>
            <textarea rows="2" value={form.innovationElement} onChange={(e) => handleChange('innovationElement', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Technical Requirements 技術要求</label>
            <textarea rows="2" value={form.technicalRequirements} onChange={(e) => handleChange('technicalRequirements', e.target.value)} />
          </div>
        </div>

        {/* ===== IP & Attachments ===== */}
        <div className="form-section">
          <h3>IP & Attachments 知識產權及附件</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Require IP 需要知識產權</label>
              <select value={form.requireIP} onChange={(e) => handleChange('requireIP', e.target.value)}>
                <option value="No">No 否</option>
                <option value="是">Yes 是</option>
              </select>
            </div>
            {form.requireIP === '是' && (
              <div className="form-group">
                <label>IP Region 知識產權地區</label>
                <input value={form.ipRegion} onChange={(e) => handleChange('ipRegion', e.target.value)} />
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Remarks 備註</label>
            <textarea rows="2" value={form.remarks} onChange={(e) => handleChange('remarks', e.target.value)} />
          </div>
        </div>

        {/* ===== Status ===== */}
        <div className="form-section">
          <h3>Status 狀態</h3>
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
              <h3>Project Stages 項目階段 ({stages.length})</h3>
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