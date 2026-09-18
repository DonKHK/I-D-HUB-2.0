import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { generateIdeaId } from '../utils/helpers';
import {
  STAGE_STEPS,
  STAGE_STEP_LABELS,
  PROJECT_TYPES,
  FUND_SOURCES,
  STAGE_TYPES,
  STAGE_STATUSES,
  IP_REGIONS,
  REQUIRE_IP_OPTIONS,
  CONTACT_GROUPS,
  APPLICANT_GROUP,
  DEFAULT_PROJECT_TYPE,
  DEFAULT_FUND_SOURCE,
  DEFAULT_IP_REGION,
  DEFAULT_REQUIRE_IP,
  fieldLabel,
  isFieldRequired,
} from '../utils/fields';
import Modal from '../components/Modal';

// Value domains + labels live in utils/fields.js (canonical master). Do not redefine.

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
  projectType: DEFAULT_PROJECT_TYPE,

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
  fundSource: DEFAULT_FUND_SOURCE,
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
  requireIP: DEFAULT_REQUIRE_IP,
  ipRegion: DEFAULT_IP_REGION,
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
    if (step < STAGE_STEP_LABELS.length - 1) setStep(step + 1);
    else handleSubmit();
  };
  const prevStep = () => { if (step > 0) setStep(step - 1); };

  // Open the user's email client pre-filled to send Business Proposal / other documents
  const handleSendEmail = () => {
    const subject = 'I&DD Idea Submission Attachment';
    const body = form.title ? `Idea: ${form.title}` : '';
    window.location.href = `mailto:don.kwan@asiaalliedgroup.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="form-section">
            <h3>{STAGE_STEPS[0].label}</h3>
            <p className="form-section-desc">{STAGE_STEPS[0].desc}</p>
            <h4 style={{ marginTop: 4, marginBottom: 8 }}>{APPLICANT_GROUP.title}</h4>
            <div className="contact-group">
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

            {CONTACT_GROUPS.map((group) => (
              <React.Fragment key={group.id}>
                <h4 style={{ marginTop: 20, marginBottom: 8 }}>{group.title}</h4>
                <div className="contact-group">
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
                </div>
              </React.Fragment>
            ))}

            <div className="form-group">
              <label>{fieldLabel('projectType', { withRequired: true })}</label>
              <select value={form.projectType} onChange={(e) => handleChange('projectType', e.target.value)}>
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="form-section">
            <h3>{STAGE_STEPS[1].label}</h3>
            <p className="form-section-desc">{STAGE_STEPS[1].desc}</p>
            <div className="form-group">
              <label>{fieldLabel('title', { withRequired: true })}</label>
              <input required value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{fieldLabel('background', { withRequired: true })}</label>
              <textarea rows="3" value={form.background} onChange={(e) => handleChange('background', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{fieldLabel('painPoint', { withRequired: true })}</label>
                <textarea rows="3" value={form.painPoint} onChange={(e) => handleChange('painPoint', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{fieldLabel('currentWorkarounds')}</label>
                <textarea rows="3" value={form.currentWorkarounds} onChange={(e) => handleChange('currentWorkarounds', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>{fieldLabel('projectScope', { withRequired: true })}</label>
              <textarea rows="3" value={form.projectScope} onChange={(e) => handleChange('projectScope', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{fieldLabel('deliverables', { withRequired: true })}</label>
                <textarea rows="3" value={form.deliverables} onChange={(e) => handleChange('deliverables', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{fieldLabel('benefits', { withRequired: true })}</label>
                <textarea rows="3" value={form.benefits} onChange={(e) => handleChange('benefits', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{fieldLabel('projectPhases')}</label>
                <textarea rows="3" value={form.projectPhases} onChange={(e) => handleChange('projectPhases', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{fieldLabel('risks')}</label>
                <textarea rows="3" value={form.risks} onChange={(e) => handleChange('risks', e.target.value)} />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-section">
            <h3>{STAGE_STEPS[2].label}</h3>
            <p className="form-section-desc">{STAGE_STEPS[2].desc}</p>
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
            <h4 style={{ marginTop: 20, marginBottom: 8 }}>Project Termination Trigger Conditions 項目終止觸發條件</h4>
            <div className="form-group">
              <label>{fieldLabel('terminationCondition1')}</label>
              <textarea rows="2" value={form.terminationCondition1} onChange={(e) => handleChange('terminationCondition1', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{fieldLabel('terminationCondition2')}</label>
              <textarea rows="2" value={form.terminationCondition2} onChange={(e) => handleChange('terminationCondition2', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{fieldLabel('terminationCondition3')}</label>
              <textarea rows="2" value={form.terminationCondition3} onChange={(e) => handleChange('terminationCondition3', e.target.value)} />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-section">
            <h3>{STAGE_STEPS[3].label}</h3>
            <p className="form-section-desc">{STAGE_STEPS[3].desc}</p>
            <div className="form-row">
              <div className="form-group">
                <label>{fieldLabel('totalBudget', { withRequired: true })}</label>
                <input type="number" min="0" value={form.totalBudget} onChange={(e) => handleChange('totalBudget', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{fieldLabel('fundSource', { withRequired: true })}</label>
                <select value={form.fundSource} onChange={(e) => handleChange('fundSource', e.target.value)}>
                  {FUND_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>{fieldLabel('budgetBreakdown')}</label>
              <textarea rows="3" value={form.budgetBreakdown} onChange={(e) => handleChange('budgetBreakdown', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{fieldLabel('targetGovFund')}</label>
                <input type="number" min="0" value={form.targetGovFund} onChange={(e) => handleChange('targetGovFund', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{fieldLabel('targetGovFundDetails')}</label>
                <input value={form.targetGovFundDetails} onChange={(e) => handleChange('targetGovFundDetails', e.target.value)} />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-section">
            <h3>{STAGE_STEPS[4].label}</h3>
            <p className="form-section-desc">{STAGE_STEPS[4].desc}</p>
            <div className="form-group">
              <label>{fieldLabel('resourceRequirements')}</label>
              <textarea rows="3" value={form.resourceRequirements} onChange={(e) => handleChange('resourceRequirements', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{fieldLabel('crossDeptAssistance')}</label>
              <textarea rows="3" value={form.crossDeptAssistance} onChange={(e) => handleChange('crossDeptAssistance', e.target.value)} />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="form-section">
            <h3>{STAGE_STEPS[5].label}</h3>
            <p className="form-section-desc">{STAGE_STEPS[5].desc}</p>
            <div className="form-group">
              <label>{fieldLabel('techDirection')}</label>
              <textarea rows="3" value={form.techDirection} onChange={(e) => handleChange('techDirection', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{fieldLabel('innovationElement')}</label>
              <textarea rows="3" value={form.innovationElement} onChange={(e) => handleChange('innovationElement', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{fieldLabel('technicalRequirements')}</label>
              <textarea rows="3" value={form.technicalRequirements} onChange={(e) => handleChange('technicalRequirements', e.target.value)} />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="form-section">
            <h3>{STAGE_STEPS[6].label}</h3>
            <p className="form-section-desc">{STAGE_STEPS[6].desc}</p>
            <div className="form-group">
              <label>{fieldLabel('currentStage', { withRequired: true })}</label>
              <select value={form.currentStage} onChange={(e) => handleChange('currentStage', e.target.value)}>
                <option value="">-- Select --</option>
                {STAGE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{fieldLabel('stageStartDate', { withRequired: true })}</label>
                <input type="date" value={form.stageStartDate} onChange={(e) => handleChange('stageStartDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{fieldLabel('stageEndDate', { withRequired: true })}</label>
                <input type="date" value={form.stageEndDate} onChange={(e) => handleChange('stageEndDate', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>{fieldLabel('stageStatus', { withRequired: true })}</label>
              <select value={form.stageStatus} onChange={(e) => handleChange('stageStatus', e.target.value)}>
                <option value="">-- Select --</option>
                {STAGE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{fieldLabel('stageDescription')}</label>
              <textarea rows="4" value={form.stageDescription} onChange={(e) => handleChange('stageDescription', e.target.value)} />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="form-section">
            <h3>{STAGE_STEPS[7].label}</h3>
            <p className="form-section-desc">{STAGE_STEPS[7].desc}</p>
            <div className="form-row">
              <div className="form-group">
                <label>{fieldLabel('requireIP')}</label>
                <div className="radio-group">
                  {REQUIRE_IP_OPTIONS.map((option) => (
                    <label key={option} className="radio-label">
                      <input
                        type="radio"
                        name="requireIP"
                        value={option}
                        checked={form.requireIP === option}
                        onChange={(e) => handleChange('requireIP', e.target.value)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
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
              <textarea rows="3" value={form.remarks} onChange={(e) => handleChange('remarks', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Send Documents via Email 電郵發送文件</label>
              <button type="button" className="btn btn--primary" onClick={handleSendEmail}>
                📧 發送 Business Proposal 商業計劃書 及 其他文件
              </button>
              <span className="file-hint">
                One click opens your email with the recipient, subject &amp; idea name pre-filled — please attach your files and send. 一按會開啟 Email（預填收件人、標題及 Idea 名稱），請自行附上文件後送出。
              </span>
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
        {STAGE_STEP_LABELS.map((label, i) => (
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
            {step === STAGE_STEP_LABELS.length - 1 ? 'Submit' : 'Next'}
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