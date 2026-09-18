import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { generateProjectId, formatDate, formatCurrency, addProjectLog } from '../utils/helpers';
import {
  SECTION_LABELS,
  STAGE_STEPS,
  PROJECT_TYPES,
  FUND_SOURCES,
  STAGE_TYPES,
  STAGE_STATUSES,
  IP_REGIONS,
  REQUIRE_IP_OPTIONS,
  PROJECT_STATUSES,
  CONTACT_GROUPS,
  CONTACT_FIELD_ORDER,
  APPLICANT_GROUP,
  DEFAULT_PROJECT_TYPE,
  DEFAULT_PROJECT_STATUS,
  DEFAULT_STAGE_TYPE,
  DEFAULT_STAGE_STATUS,
  DEFAULT_REQUIRE_IP,
  DEFAULT_IP_REGION,
  fieldLabel,
  isFieldRequired,
  readField,
  readStageField,
  buildStage,
  stageToForm,
} from '../utils/fields';
import Modal from '../components/Modal';

// Labels / value domains / field keys come from utils/fields.js (canonical master).

const emptyStageForm = {
  type: DEFAULT_STAGE_TYPE,
  stageStartDate: '',
  stageEndDate: '',
  totalBudget: '',
  budgetUsed: '',
  stageStatus: DEFAULT_STAGE_STATUS,
  stageDescription: '',
};

const emptyForm = {
  // Basic
  title: '',
  description: '',
  projectScope: '',
  status: DEFAULT_PROJECT_STATUS,
  projectType: DEFAULT_PROJECT_TYPE,
  // Applicant
  applicantName: '',
  department: '',
  contactNumber: '',
  email: '',
  // Project Manager / Owner / Technical Support (canonical keys)
  projectManagerName: '',
  projectManagerDept: '',
  projectManagerPhone: '',
  projectManagerEmail: '',
  ownerName: '',
  ownerDept: '',
  ownerContact: '',
  ownerEmail: '',
  techSupportName: '',
  techSupportDept: '',
  techSupportContact: '',
  techSupportEmail: '',
  // Project details
  background: '',
  painPoint: '',
  currentWorkarounds: '',
  deliverables: '',
  benefits: '',
  projectPhases: '',
  risks: '',
  // Timeline & termination
  expectedStartDate: '',
  targetCompletionDate: '',
  terminationCondition1: '',
  terminationCondition2: '',
  terminationCondition3: '',
  // Budget & funding
  totalBudget: '',
  budgetUsed: '',
  fundSource: FUND_SOURCES[0],
  governmentGrant: '',
  budgetBreakdown: '',
  targetGovFund: '',
  targetGovFundDetails: '',
  // Resources
  resourceRequirements: '',
  crossDeptAssistance: '',
  // Tech & innovation
  techDirection: '',
  innovationElement: '',
  technicalRequirements: '',
  // IP & attachments
  requireIP: DEFAULT_REQUIRE_IP,
  ipRegion: DEFAULT_IP_REGION,
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
        title: readField(editProject, 'title') || '',
        description: editProject.description || '',
        projectScope: readField(editProject, 'projectScope') || '',
        status: editProject.status || DEFAULT_PROJECT_STATUS,
        projectType: editProject.projectType || DEFAULT_PROJECT_TYPE,
        applicantName: editProject.applicantName || '',
        department: editProject.department || '',
        contactNumber: editProject.contactNumber || '',
        email: editProject.email || '',
        projectManagerName: readField(editProject, 'projectManagerName') || '',
        projectManagerDept: editProject.projectManagerDept || '',
        projectManagerPhone: editProject.projectManagerPhone || '',
        projectManagerEmail: editProject.projectManagerEmail || '',
        ownerName: readField(editProject, 'ownerName') || '',
        ownerDept: editProject.ownerDept || '',
        ownerContact: editProject.ownerContact || '',
        ownerEmail: editProject.ownerEmail || '',
        techSupportName: editProject.techSupportName || '',
        techSupportDept: readField(editProject, 'techSupportDept') || '',
        techSupportContact: editProject.techSupportContact || '',
        techSupportEmail: editProject.techSupportEmail || '',
        background: editProject.background || '',
        painPoint: editProject.painPoint || '',
        currentWorkarounds: editProject.currentWorkarounds || '',
        deliverables: editProject.deliverables || '',
        benefits: editProject.benefits || '',
        projectPhases: editProject.projectPhases || '',
        risks: editProject.risks || '',
        expectedStartDate: readField(editProject, 'expectedStartDate') || '',
        targetCompletionDate: readField(editProject, 'targetCompletionDate') || '',
        terminationCondition1: editProject.terminationCondition1 || '',
        terminationCondition2: editProject.terminationCondition2 || '',
        terminationCondition3: editProject.terminationCondition3 || '',
        totalBudget: readField(editProject, 'totalBudget') || '',
        budgetUsed: editProject.budgetUsed || '',
        fundSource: editProject.fundSource || FUND_SOURCES[0],
        governmentGrant: editProject.governmentGrant || '',
        budgetBreakdown: editProject.budgetBreakdown || '',
        targetGovFund: editProject.targetGovFund || '',
        targetGovFundDetails: editProject.targetGovFundDetails || '',
        resourceRequirements: editProject.resourceRequirements || '',
        crossDeptAssistance: editProject.crossDeptAssistance || '',
        techDirection: editProject.techDirection || '',
        innovationElement: editProject.innovationElement || '',
        technicalRequirements: editProject.technicalRequirements || '',
        requireIP: editProject.requireIP || DEFAULT_REQUIRE_IP,
        ipRegion: editProject.ipRegion || DEFAULT_IP_REGION,
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
    setStageForm(stageToForm(stage));
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
    const parsed = buildStage(stageForm);

    if (editingStageId) {
      setStages((prev) =>
        prev.map((s) => (s.id === editingStageId ? { ...parsed, id: editingStageId } : s))
      );
    } else {
      setStages((prev) => [...prev, { ...parsed, id: 's' + Date.now() }]);
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
        totalBudget: parseFloat(form.totalBudget) || 0,
        budgetUsed: parseFloat(form.budgetUsed) || 0,
        targetGovFund: parseFloat(form.targetGovFund) || 0,
        stages: stages,
      };

      if (isEditing) {
        const oldProject = editProject;
        const changes = [];
        if (readField(oldProject, 'title') !== form.title) changes.push(`title: "${readField(oldProject, 'title')}" → "${form.title}"`);
        if (oldProject.status !== form.status) changes.push(`status: ${oldProject.status} → ${form.status}`);
        if (Number(readField(oldProject, 'totalBudget')) !== Number(form.totalBudget)) changes.push(`totalBudget: ${formatCurrency(readField(oldProject, 'totalBudget'))} → ${formatCurrency(form.totalBudget)}`);
        if (readField(oldProject, 'expectedStartDate') !== form.expectedStartDate) changes.push(`expectedStartDate: ${readField(oldProject, 'expectedStartDate')} → ${form.expectedStartDate}`);
        if (readField(oldProject, 'targetCompletionDate') !== form.targetCompletionDate) changes.push(`targetCompletionDate: ${readField(oldProject, 'targetCompletionDate')} → ${form.targetCompletionDate}`);
        if (readField(oldProject, 'ownerName') !== form.ownerName) changes.push(`ownerName: "${readField(oldProject, 'ownerName')}" → "${form.ownerName}"`);
        if (readField(oldProject, 'projectManagerName') !== form.projectManagerName) changes.push(`projectManagerName: "${readField(oldProject, 'projectManagerName')}" → "${form.projectManagerName}"`);

        // Compare stages to detect add / delete / edit
        const oldStages = oldProject.stages || [];
        const oldStageIds = new Set(oldStages.map((s) => s.id));
        const newStageIds = new Set(stages.map((s) => s.id));

        // Added stages
        const addedStages = stages.filter((s) => !oldStageIds.has(s.id));
        addedStages.forEach((s) => changes.push(`added stage: "${s.type || 'Untitled'}"`));

        // Deleted stages
        const deletedStages = oldStages.filter((s) => !newStageIds.has(s.id));
        deletedStages.forEach((s) => changes.push(`deleted stage: "${readStageField(s, 'type') || 'Untitled'}"`));

        // Edited stages (same id, changed fields)
        stages.forEach((s) => {
          const old = oldStages.find((os) => os.id === s.id);
          if (!old) return;
          const changed = [];
          if ((readStageField(old, 'type') || '') !== (s.type || '')) changed.push('type');
          if ((readStageField(old, 'stageStatus') || '') !== (s.stageStatus || '')) changed.push('stageStatus');
          if ((readStageField(old, 'stageStartDate') || '') !== (s.stageStartDate || '')) changed.push('stageStartDate');
          if ((readStageField(old, 'stageEndDate') || '') !== (s.stageEndDate || '')) changed.push('stageEndDate');
          if (Number(readStageField(old, 'totalBudget') || 0) !== Number(s.totalBudget || 0)) changed.push('totalBudget');
          if ((readStageField(old, 'stageDescription') || '') !== (s.stageDescription || '')) changed.push('stageDescription');
          if (changed.length > 0) {
            changes.push(`edited stage "${s.type || 'Untitled'}": ${changed.join(', ')}`);
          }
        });

        const newLog = {
          id: 'log-' + Date.now(),
          timestamp: new Date().toISOString(),
          action: 'Project Updated',
          details: `Updated project fields: ${changes.join('; ') || 'no major field changes'}`,
          user: user?.displayName || user?.email || 'Unknown',
        };
        const updatedLogs = [...(editProject.logs || []), newLog];
        updateProject(editProject.id, { ...projectData, logs: updatedLogs });
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
            details: `Created project "${readField(newProject, 'title')}" with budget ${formatCurrency(readField(newProject, 'totalBudget'))}, start: ${readField(newProject, 'expectedStartDate') || 'TBD'}, end: ${readField(newProject, 'targetCompletionDate') || 'TBD'}`,
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
            <label>{fieldLabel('title', { withRequired: true })}</label>
            <input required value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('description')}</label>
            <textarea rows="2" value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('projectScope', { withRequired: true })}</label>
            <textarea rows="3" value={form.projectScope} onChange={(e) => handleChange('projectScope', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('projectType', { withRequired: true })}</label>
            <select value={form.projectType} onChange={(e) => handleChange('projectType', e.target.value)}>
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* ===== Applicant Information ===== */}
        <div className="form-section">
          <h3>{APPLICANT_GROUP.title}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>{fieldLabel(APPLICANT_GROUP.name, { withRequired: true })}</label>
              <input required={isFieldRequired(APPLICANT_GROUP.name)} value={form[APPLICANT_GROUP.name]} onChange={(e) => handleChange(APPLICANT_GROUP.name, e.target.value)} />
            </div>
            <div className="form-group">
              <label>{fieldLabel(APPLICANT_GROUP.dept, { withRequired: true })}</label>
              <input required={isFieldRequired(APPLICANT_GROUP.dept)} value={form[APPLICANT_GROUP.dept]} onChange={(e) => handleChange(APPLICANT_GROUP.dept, e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{fieldLabel(APPLICANT_GROUP.contact, { withRequired: true })}</label>
              <input required={isFieldRequired(APPLICANT_GROUP.contact)} value={form[APPLICANT_GROUP.contact]} onChange={(e) => handleChange(APPLICANT_GROUP.contact, e.target.value)} />
            </div>
            <div className="form-group">
              <label>{fieldLabel(APPLICANT_GROUP.email, { withRequired: true })}</label>
              <input required={isFieldRequired(APPLICANT_GROUP.email)} type="email" value={form[APPLICANT_GROUP.email]} onChange={(e) => handleChange(APPLICANT_GROUP.email, e.target.value)} />
            </div>
          </div>
        </div>

        {/* ===== Project Team (Project Manager / Project Owner / Technical Support) ===== */}
        <div className="form-section">
          <h3>{SECTION_LABELS.team}</h3>
          {CONTACT_GROUPS.map((group) => (
            <React.Fragment key={group.id}>
              <h4 style={{ marginTop: '0.5rem', marginBottom: '0.5rem', color: '#555' }}>{group.title}</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>{fieldLabel(group.name, { withRequired: true })}</label>
                  <input required={isFieldRequired(group.name)} value={form[group.name]} onChange={(e) => handleChange(group.name, e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{fieldLabel(group.dept, { withRequired: true })}</label>
                  <input required={isFieldRequired(group.dept)} value={form[group.dept]} onChange={(e) => handleChange(group.dept, e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{fieldLabel(group.contact, { withRequired: true })}</label>
                  <input required={isFieldRequired(group.contact)} value={form[group.contact]} onChange={(e) => handleChange(group.contact, e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{fieldLabel(group.email, { withRequired: true })}</label>
                  <input required={isFieldRequired(group.email)} type="email" value={form[group.email]} onChange={(e) => handleChange(group.email, e.target.value)} />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* ===== Project Details (Full) ===== */}
        <div className="form-section">
          <h3>Project Details 項目詳情</h3>
          <div className="form-group">
            <label>{fieldLabel('background', { withRequired: true })}</label>
            <textarea rows="2" value={form.background} onChange={(e) => handleChange('background', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('painPoint', { withRequired: true })}</label>
            <textarea rows="2" value={form.painPoint} onChange={(e) => handleChange('painPoint', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('currentWorkarounds')}</label>
            <textarea rows="2" value={form.currentWorkarounds} onChange={(e) => handleChange('currentWorkarounds', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('deliverables', { withRequired: true })}</label>
            <textarea rows="2" value={form.deliverables} onChange={(e) => handleChange('deliverables', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('benefits', { withRequired: true })}</label>
            <textarea rows="2" value={form.benefits} onChange={(e) => handleChange('benefits', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('projectPhases')}</label>
            <textarea rows="2" value={form.projectPhases} onChange={(e) => handleChange('projectPhases', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('risks')}</label>
            <textarea rows="2" value={form.risks} onChange={(e) => handleChange('risks', e.target.value)} />
          </div>
        </div>

        {/* ===== Dates ===== */}
        <div className="form-section">
          <h3>{SECTION_LABELS.dates}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>{fieldLabel('expectedStartDate', { withRequired: true })}</label>
              <input type="date" value={form.expectedStartDate} onChange={(e) => handleChange('expectedStartDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{fieldLabel('targetCompletionDate', { withRequired: true })}</label>
              <input type="date" value={form.targetCompletionDate} onChange={(e) => handleChange('targetCompletionDate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ===== Termination Conditions ===== */}
        <div className="form-section">
          <h3>Termination Conditions 終止條件</h3>
          <div className="form-group">
            <label>{fieldLabel('terminationCondition1')}</label>
            <textarea rows="1" value={form.terminationCondition1} onChange={(e) => handleChange('terminationCondition1', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('terminationCondition2')}</label>
            <textarea rows="1" value={form.terminationCondition2} onChange={(e) => handleChange('terminationCondition2', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('terminationCondition3')}</label>
            <textarea rows="1" value={form.terminationCondition3} onChange={(e) => handleChange('terminationCondition3', e.target.value)} />
          </div>
        </div>

        {/* ===== Budget & Funding ===== */}
        <div className="form-section">
          <h3>{SECTION_LABELS.budget}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>{fieldLabel('totalBudget', { withRequired: true })}</label>
              <input type="number" min="0" value={form.totalBudget} onChange={(e) => handleChange('totalBudget', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{fieldLabel('budgetUsed')}</label>
              <input type="number" min="0" value={form.budgetUsed} onChange={(e) => handleChange('budgetUsed', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{fieldLabel('fundSource', { withRequired: true })}</label>
              <select value={form.fundSource} onChange={(e) => handleChange('fundSource', e.target.value)}>
                {FUND_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{fieldLabel('governmentGrant')}</label>
              <input value={form.governmentGrant} onChange={(e) => handleChange('governmentGrant', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>{fieldLabel('budgetBreakdown')}</label>
            <textarea rows="2" value={form.budgetBreakdown} onChange={(e) => handleChange('budgetBreakdown', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('targetGovFund')}</label>
            <input type="number" min="0" value={form.targetGovFund} onChange={(e) => handleChange('targetGovFund', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('targetGovFundDetails')}</label>
            <textarea rows="2" value={form.targetGovFundDetails} onChange={(e) => handleChange('targetGovFundDetails', e.target.value)} />
          </div>
        </div>

        {/* ===== Resources ===== */}
        <div className="form-section">
          <h3>{SECTION_LABELS.resources}</h3>
          <div className="form-group">
            <label>{fieldLabel('resourceRequirements')}</label>
            <textarea rows="2" value={form.resourceRequirements} onChange={(e) => handleChange('resourceRequirements', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('crossDeptAssistance')}</label>
            <textarea rows="2" value={form.crossDeptAssistance} onChange={(e) => handleChange('crossDeptAssistance', e.target.value)} />
          </div>
        </div>

        {/* ===== Technical & Innovation ===== */}
        <div className="form-section">
          <h3>{SECTION_LABELS.tech}</h3>
          <div className="form-group">
            <label>{fieldLabel('techDirection')}</label>
            <textarea rows="2" value={form.techDirection} onChange={(e) => handleChange('techDirection', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('innovationElement')}</label>
            <textarea rows="2" value={form.innovationElement} onChange={(e) => handleChange('innovationElement', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{fieldLabel('technicalRequirements')}</label>
            <textarea rows="2" value={form.technicalRequirements} onChange={(e) => handleChange('technicalRequirements', e.target.value)} />
          </div>
        </div>

        {/* ===== IP & Attachments ===== */}
        <div className="form-section">
          <h3>{SECTION_LABELS.ip}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>{fieldLabel('requireIP')}</label>
              <select value={form.requireIP} onChange={(e) => handleChange('requireIP', e.target.value)}>
                {REQUIRE_IP_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            {form.requireIP === '是' && (
              <div className="form-group">
                <label>{fieldLabel('ipRegion')}</label>
                <select value={form.ipRegion} onChange={(e) => handleChange('ipRegion', e.target.value)}>
                  {IP_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>{fieldLabel('remarks')}</label>
            <textarea rows="2" value={form.remarks} onChange={(e) => handleChange('remarks', e.target.value)} />
          </div>
        </div>

        {/* ===== Status ===== */}
        <div className="form-section">
          <h3>{fieldLabel('status')}</h3>
          <div className="form-group">
            <label>{fieldLabel('status', { withRequired: true })}</label>
            <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ===== Project Stages ===== */}
        {isEditing && (
          <div className="form-section">
            <div className="card-header-row">
              <h3>{SECTION_LABELS.stages} ({stages.length})</h3>
              <button type="button" className="btn btn--small" onClick={openAddStage}>
                + Add Stage
              </button>
            </div>

            {stages.length === 0 && <p className="empty-text">No stages defined</p>}

            <div className="stages-list">
              {stages.map((stage) => (
                <div key={stage.id} className="stage-card">
                  <div className="stage-header">
                    <span className="stage-type">{readStageField(stage, 'type')}</span>
                    <span className={`status-badge status-badge--small status-badge--${
                      readStageField(stage, 'stageStatus') === 'Completed' ? 'completed' :
                      readStageField(stage, 'stageStatus') === 'In Progress' ? 'progress' :
                      readStageField(stage, 'stageStatus') === 'On Hold' ? 'hold' : 'pending'
                    }`}>
                      {readStageField(stage, 'stageStatus')}
                    </span>
                  </div>
                  <p className="stage-desc">{readStageField(stage, 'stageDescription') || '—'}</p>
                  <div className="stage-dates">
                    <span>📅 {formatDate(readStageField(stage, 'stageStartDate'))} - {formatDate(readStageField(stage, 'stageEndDate'))}</span>
                  </div>
                  <div className="stage-budget">
                    <span>💰 {formatCurrency(readStageField(stage, 'totalBudget'))}</span>
                    <span className={stage.budgetUsed > readStageField(stage, 'totalBudget') * 0.9 ? 'text-danger' : ''}>
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
          <button type="submit" className="btn btn--primary" disabled={saving || !form.title.trim()}>
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
              <input type="number" min="0" value={stageForm.totalBudget} onChange={(e) => setStageForm({ ...stageForm, totalBudget: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{fieldLabel('budgetUsed')}</label>
              <input type="number" min="0" value={stageForm.budgetUsed} onChange={(e) => setStageForm({ ...stageForm, budgetUsed: e.target.value })} />
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
            Are you sure you want to delete the stage <strong>"{readStageField(stageToDelete, 'type')}"</strong>?<br />
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