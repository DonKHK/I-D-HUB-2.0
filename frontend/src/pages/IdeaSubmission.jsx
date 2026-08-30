import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { generateIdeaId } from '../utils/helpers';
import Modal from '../components/Modal';

const STAGES = [
  'Applicant Info',
  'Project Details',
  'Timeline & Termination',
  'Budget & Funding',
  'Resources & Support',
  'Technical & Innovation',
  'Current Stage',
  'IP & Attachments'
];

const PROJECT_TYPES = [
  'Business Transformation / Development',
  'Process Improvement',
  'Cost Saving',
  'Customer Experience',
  'Technology Development',
  'Others'
];

const FUND_SOURCES = [
  'Department Budget',
  'Company Central Fund',
  'Government Grant',
  'External Sponsorship',
  'Other'
];

const CURRENT_STAGES = [
  'Idea / R&D',
  'Feasibility',
  'POC',
  'Demo',
  'Pilot',
  'Commercialization',
  'Production',
  'Wrap up & Handover',
  'Others'
];

const STAGE_STATUSES = [
  'Planning',
  'In Progress',
  'Completed'
];

const IP_REGIONS = [
  'Hong Kong',
  'China',
  'United States',
  'European Union',
  'Other'
];

const initialForm = {
  // Applicant Info
  applicantName: '',
  department: '',
  contactNumber: '',
  email: '',
  projectManagerName: '',
  projectManagerDept: '',
  projectManagerEmail: '',
  projectManagerPhone: '',
  ownerName: '',
  ownerDept: '',
  ownerContact: '',
  ownerEmail: '',
  techSupportName: '',
  techSupportDept: '',
  techSupportContact: '',
  techSupportEmail: '',

  // Project Type
  projectType: 'Business Transformation / Development',

  // Project Details
  title: '',
  background: '',
  painPoint: '',
  currentWorkarounds: '',
  projectScope: '',
  deliverables: '',
  benefits: '',
  projectPhases: '',
  risks: '',

  // Timeline & Termination
  expectedStartDate: '',
  targetCompletionDate: '',
  terminationCondition1: '',
  terminationCondition2: '',
  terminationCondition3: '',

  // Budget & Funding
  totalBudget: '',
  fundSource: 'Department Budget',
  budgetBreakdown: '',
  targetGovFund: '',
  targetGovFundDetails: '',

  // Resources & Support
  resourceRequirements: '',
  crossDeptAssistance: '',

  // Technical & Innovation
  techDirection: '',
  innovationElement: '',
  technicalRequirements: '',

  // Current Stage
  currentStage: '',
  stageStartDate: '',
  stageEndDate: '',
  stageStatus: '',
  stageDescription: '',

  // IP & Attachments
  requireIP: '待定',
  ipRegion: 'Hong Kong',
  remarks: '',
  businessProposalFile: '',
  otherDocFile: '',
};

export default function IdeaSubmission({ onBack }) {
  const { ideas, addIdea } = useData();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({ ...initialForm, applicantName: user?.username || '', email: user?.email || '' });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = () => {
    const newIdea = {
      ...form,
      id: generateIdeaId(ideas.map((i) => i.id)),
      totalBudget: parseFloat(form.totalBudget) || 0,
      targetGovFund: parseFloat(form.targetGovFund) || 0,
      status: 'pending',
      aiAnalysis: null,
      createdAt: new Date().toISOString(),
    };
    addIdea(newIdea);
    setShowSuccess(true);
  };

  const nextStep = () => {
    if (step < STAGES.length - 1) setStep(step + 1);
    else handleSubmit();
  };
  const prevStep = () => { if (step > 0) setStep(step - 1); };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="form-section">
            <h3>Applicant Information</h3>
            <p className="form-section-desc">申請人資料</p>
            <div className="form-row">
              <div className="form-group">
                <label>Applicant Name 申請人姓名 *</label>
                <input required value={form.applicantName} onChange={(e) => handleChange('applicantName', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Department / Team 所屬部門及團隊 *</label>
                <input value={form.department} onChange={(e) => handleChange('department', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contact Number 聯絡電話 *</label>
                <input required value={form.contactNumber} onChange={(e) => handleChange('contactNumber', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email 電郵 *</label>
                <input required type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
            </div>

            <h4 style={{ marginTop: 20, marginBottom: 8 }}>Project Manager 項目經理</h4>
            <div className="contact-group">
              <div className="form-row">
                <div className="form-group">
                  <label>Name 姓名</label>
                  <input value={form.projectManagerName} onChange={(e) => handleChange('projectManagerName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Department 部門</label>
                  <input value={form.projectManagerDept} onChange={(e) => handleChange('projectManagerDept', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number 聯絡電話 *</label>
                  <input value={form.projectManagerPhone} onChange={(e) => handleChange('projectManagerPhone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email 電郵</label>
                  <input type="email" value={form.projectManagerEmail} onChange={(e) => handleChange('projectManagerEmail', e.target.value)} />
                </div>
              </div>
            </div>

            <h4 style={{ marginTop: 16, marginBottom: 8 }}>Project Owner 項目持有者</h4>
            <div className="contact-group">
              <div className="form-row">
                <div className="form-group">
                  <label>Name 姓名 *</label>
                  <input required value={form.ownerName} onChange={(e) => handleChange('ownerName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Department / Company 所屬部門或公司 *</label>
                  <input required value={form.ownerDept} onChange={(e) => handleChange('ownerDept', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number 聯絡電話 *</label>
                  <input required value={form.ownerContact} onChange={(e) => handleChange('ownerContact', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>E-Mail 電郵 *</label>
                  <input required type="email" value={form.ownerEmail} onChange={(e) => handleChange('ownerEmail', e.target.value)} />
                </div>
              </div>
            </div>

            <h4 style={{ marginTop: 16, marginBottom: 8 }}>Technical Support</h4>
            <div className="contact-group">
              <div className="form-row">
                <div className="form-group">
                  <label>Name 姓名 *</label>
                  <input required value={form.techSupportName} onChange={(e) => handleChange('techSupportName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Department / Company 所屬部門或公司 *</label>
                  <input required value={form.techSupportDept} onChange={(e) => handleChange('techSupportDept', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number 聯絡電話 *</label>
                  <input required value={form.techSupportContact} onChange={(e) => handleChange('techSupportContact', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>E-Mail 電郵 *</label>
                  <input required type="email" value={form.techSupportEmail} onChange={(e) => handleChange('techSupportEmail', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Project Type 項目類型 *</label>
              <select value={form.projectType} onChange={(e) => handleChange('projectType', e.target.value)}>
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="form-section">
            <h3>Project Details</h3>
            <p className="form-section-desc">項目 / 意念詳情</p>
            <div className="form-group">
              <label>Project Title 項目名稱 *</label>
              <input required value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Project Background & Objective 項目背景信息及目標 *</label>
              <textarea rows="3" value={form.background} onChange={(e) => handleChange('background', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Pain Points 痛點描述 *</label>
                <textarea rows="3" value={form.painPoint} onChange={(e) => handleChange('painPoint', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Current Workarounds 現有臨時處理方法</label>
                <textarea rows="3" value={form.currentWorkarounds} onChange={(e) => handleChange('currentWorkarounds', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Project Scope 項目範圍 *</label>
              <textarea rows="3" value={form.projectScope} onChange={(e) => handleChange('projectScope', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expected Deliverables 預期交付成果 *</label>
                <textarea rows="3" value={form.deliverables} onChange={(e) => handleChange('deliverables', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Expected Benefits 預期效益 *</label>
                <textarea rows="3" value={form.benefits} onChange={(e) => handleChange('benefits', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Project Phases 項目實施階段</label>
                <textarea rows="3" value={form.projectPhases} onChange={(e) => handleChange('projectPhases', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Risks & Challenges 潛在風險及實施困難</label>
                <textarea rows="3" value={form.risks} onChange={(e) => handleChange('risks', e.target.value)} />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-section">
            <h3>Timeline & Termination</h3>
            <p className="form-section-desc">時間表及終止條件</p>
            <div className="form-row">
              <div className="form-group">
                <label>Expected Start Date 預計開始日期 *</label>
                <input type="date" value={form.expectedStartDate} onChange={(e) => handleChange('expectedStartDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Target Completion Date 預計完成日期 *</label>
                <input type="date" value={form.targetCompletionDate} onChange={(e) => handleChange('targetCompletionDate', e.target.value)} />
              </div>
            </div>
            <h4 style={{ marginTop: 20, marginBottom: 8 }}>Project Termination Trigger Conditions 項目終止觸發條件</h4>
            <div className="form-group">
              <label>Condition (1) 終止觸發條件(一)</label>
              <textarea rows="2" value={form.terminationCondition1} onChange={(e) => handleChange('terminationCondition1', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Condition (2) 終止觸發條件(二)</label>
              <textarea rows="2" value={form.terminationCondition2} onChange={(e) => handleChange('terminationCondition2', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Condition (3) 終止觸發條件(三)</label>
              <textarea rows="2" value={form.terminationCondition3} onChange={(e) => handleChange('terminationCondition3', e.target.value)} />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-section">
            <h3>Budget & Funding</h3>
            <p className="form-section-desc">預算及資金</p>
            <div className="form-row">
              <div className="form-group">
                <label>Total Estimated Budget 總預算估算（單位：港幣）*</label>
                <input type="number" min="0" value={form.totalBudget} onChange={(e) => handleChange('totalBudget', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Source of Project Fund 項目預算來源 *</label>
                <select value={form.fundSource} onChange={(e) => handleChange('fundSource', e.target.value)}>
                  {FUND_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Budget Breakdown 預算細分</label>
              <textarea rows="3" value={form.budgetBreakdown} onChange={(e) => handleChange('budgetBreakdown', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Target Gov. Fund 目標政府支助（如有）</label>
                <input type="number" min="0" value={form.targetGovFund} onChange={(e) => handleChange('targetGovFund', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Target Gov. Fund Details 目標資金詳情（如有）</label>
                <input value={form.targetGovFundDetails} onChange={(e) => handleChange('targetGovFundDetails', e.target.value)} />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-section">
            <h3>Resources & Support</h3>
            <p className="form-section-desc">資源及協助</p>
            <div className="form-group">
              <label>Resource Requirements 其他所需資源（非資金類）</label>
              <textarea rows="3" value={form.resourceRequirements} onChange={(e) => handleChange('resourceRequirements', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Cross-departmental Assistance Required 預計需要公司哪些內部部門協助？</label>
              <textarea rows="3" value={form.crossDeptAssistance} onChange={(e) => handleChange('crossDeptAssistance', e.target.value)} />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="form-section">
            <h3>Technical & Innovation</h3>
            <p className="form-section-desc">技術及創新</p>
            <div className="form-group">
              <label>Proposed Technology Direction 建議技術方向</label>
              <textarea rows="3" value={form.techDirection} onChange={(e) => handleChange('techDirection', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Innovation Element 項目創新亮點</label>
              <textarea rows="3" value={form.innovationElement} onChange={(e) => handleChange('innovationElement', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Technical Requirements 具體技術需求</label>
              <textarea rows="3" value={form.technicalRequirements} onChange={(e) => handleChange('technicalRequirements', e.target.value)} />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="form-section">
            <h3>Current Stage</h3>
            <p className="form-section-desc">現時階段</p>
            <div className="form-group">
              <label>Current Stage 現時階段 *</label>
              <select value={form.currentStage} onChange={(e) => handleChange('currentStage', e.target.value)}>
                <option value="">-- Select --</option>
                {CURRENT_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>階段開始日期 *</label>
                <input type="date" value={form.stageStartDate} onChange={(e) => handleChange('stageStartDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>預計完成日期 *</label>
                <input type="date" value={form.stageEndDate} onChange={(e) => handleChange('stageEndDate', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>階段狀態 *</label>
              <select value={form.stageStatus} onChange={(e) => handleChange('stageStatus', e.target.value)}>
                <option value="">-- Select --</option>
                {STAGE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>主要描述</label>
              <textarea rows="4" value={form.stageDescription} onChange={(e) => handleChange('stageDescription', e.target.value)} />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="form-section">
            <h3>IP & Attachments</h3>
            <p className="form-section-desc">知識產權及附件</p>
            <div className="form-row">
              <div className="form-group">
                <label>Require IP 是否需要申請專利</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="requireIP" value="是" checked={form.requireIP === '是'} onChange={(e) => handleChange('requireIP', e.target.value)} />
                    是
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="requireIP" value="否" checked={form.requireIP === '否'} onChange={(e) => handleChange('requireIP', e.target.value)} />
                    否
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="requireIP" value="待定" checked={form.requireIP === '待定'} onChange={(e) => handleChange('requireIP', e.target.value)} />
                    待定
                  </label>
                </div>
              </div>
              {form.requireIP === '是' && (
                <div className="form-group">
                  <label>IP Region 專利申請國家</label>
                  <select value={form.ipRegion} onChange={(e) => handleChange('ipRegion', e.target.value)}>
                    {IP_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Any Other Comments 其他補充備註</label>
              <textarea rows="3" value={form.remarks} onChange={(e) => handleChange('remarks', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Business Proposal 商業計劃書</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleChange('businessProposalFile', e.target.files[0]?.name || '')} />
                <span className="file-hint">Accepted: PDF, DOC, DOCX</span>
              </div>
              <div className="form-group">
                <label>Other Supporting Documents 其他文件上傳</label>
                <input type="file" accept=".pdf,.doc,.docx,.xlsx,.pptx" onChange={(e) => handleChange('otherDocFile', e.target.files[0]?.name || '')} />
                <span className="file-hint">Accepted: PDF, DOC, XLSX, PPTX</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">Idea Submission</h1>
        {step > 0 && (
          <button className="btn btn--outline" onClick={prevStep}>← Back to Step {step}</button>
        )}
      </div>

      {/* Step Indicator */}
      <div className="step-indicator step-indicator--compact">
        {STAGES.map((label, i) => (
          <div
            key={i}
            className={`step ${i === step ? 'step--active' : ''} ${i < step ? 'step--completed' : ''}`}
            onClick={() => { if (i < step) setStep(i); }}
            style={{ cursor: i < step ? 'pointer' : 'default' }}
          >
            <div className="step-circle">{i < step ? '✓' : i + 1}</div>
            <div className="step-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <form className="form form--wide" onSubmit={(e) => e.preventDefault()}>
        {renderStep()}

        <div className="form-actions">
          {step > 0 ? (
            <button type="button" className="btn btn--outline" onClick={prevStep}>Previous</button>
          ) : (
            <button type="button" className="btn btn--outline" onClick={onBack}>Cancel</button>
          )}
          <button type="button" className="btn btn--primary" onClick={nextStep}>
            {step === STAGES.length - 1 ? 'Submit' : 'Next'}
          </button>
        </div>
      </form>

      <Modal isOpen={showSuccess} onClose={() => { setShowSuccess(false); if (onBack) onBack(); }} title="Submission Successful">
        <div className="success-content">
          <div className="success-icon">✅</div>
          <p>Your idea has been submitted successfully and will be reviewed by the admin team.</p>
          <p className="text-muted">You can track the status of your submission in the Pending Approval section.</p>
        </div>
        <div className="modal-actions">
          <button className="btn btn--primary" onClick={() => { setShowSuccess(false); if (onBack) onBack(); }}>Done</button>
        </div>
      </Modal>
    </div>
  );
}