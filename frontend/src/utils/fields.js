/**
 * fields.js — Single source of truth for every shared field in the app.
 *
 * MASTER = Submit Idea (frontend/src/pages/IdeaSubmission.jsx).
 * Any label / key / value-domain used by IDEA Detail, My Projects, Detail Project,
 * Edit Project (ProjectForm), Approved Projects, All Projects, Report Export or
 * Settings MUST come from this file, so the same data always shows the same name.
 *
 * - `FIELDS[key]` → canonical Firestore field name (= key) + canonical label
 * - `CONTACT_GROUPS` → the 4 contact blocks (Applicant / PM / Owner / Tech Support)
 * - `KEY_RENAMES` / `STAGE_KEY_RENAMES` / `DROP_KEYS` → one-time normalisation
 *
 * Do NOT hard-code field labels elsewhere.
 */

/* ───────────────────────────── Value domains (master) ───────────────────────────── */

export const PROJECT_TYPES = [
  'Business Transformation / Development',
  'Process Improvement',
  'Cost Saving',
  'Customer Experience',
  'Technology Development',
  'Others',
];

export const FUND_SOURCES = [
  'Department Budget',
  'Company Central Fund',
  'Government Grant',
  'External Sponsorship',
  'Other',
];

/**
 * Stage type — used by the idea wizard (`currentStage`) AND by project stages
 * (`stages[].type`). Master list (9) is authoritative.
 */
export const STAGE_TYPES = [
  'Idea / R&D',
  'Feasibility',
  'POC',
  'Demo',
  'Pilot',
  'Commercialization',
  'Production',
  'Wrap up & Handover',
  'Others',
];

/**
 * Stage status — master list + 'On Hold' (kept because project stages need it;
 * the idea wizard offers the same list so both sides are identical).
 * Legacy 'Not Started' is migrated to 'Planning' (see STAGE_STATUS_RENAMES).
 */
export const STAGE_STATUSES = ['Planning', 'In Progress', 'Completed', 'On Hold'];

export const IP_REGIONS = ['Hong Kong', 'China', 'United States', 'European Union', 'Other'];

export const REQUIRE_IP_OPTIONS = ['是', '否', '待定'];

/** Project lifecycle status (project-only — idea.status has its own lifecycle) */
export const PROJECT_STATUSES = ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

/* ───────────────────────────── Defaults ───────────────────────────── */

export const DEFAULT_PROJECT_TYPE = PROJECT_TYPES[0];
export const DEFAULT_FUND_SOURCE = FUND_SOURCES[0];
export const DEFAULT_STAGE_TYPE = 'Feasibility';
export const DEFAULT_STAGE_STATUS = 'Planning';
export const DEFAULT_IP_REGION = IP_REGIONS[0];
export const DEFAULT_REQUIRE_IP = '待定';
export const DEFAULT_PROJECT_STATUS = 'Planning';

/* ───────────────────────────── The 4 contact blocks ───────────────────────────── */
/**
 * Rendered identically by the idea wizard, both detail pages and every edit form.
 * Order of the 4 sub-fields is always: Name, Department, Contact Number, Email.
 */
export const CONTACT_GROUPS = [
  {
    id: 'projectManager',
    title: 'Project Manager 項目經理',
    shortLabel: 'Project Manager',
    name: 'projectManagerName',
    dept: 'projectManagerDept',
    contact: 'projectManagerPhone',
    email: 'projectManagerEmail',
  },
  {
    id: 'owner',
    title: 'Project Owner 項目持有者',
    shortLabel: 'Project Owner',
    name: 'ownerName',
    dept: 'ownerDept',
    contact: 'ownerContact',
    email: 'ownerEmail',
  },
  {
    id: 'techSupport',
    title: 'Technical Support 技術支援',
    shortLabel: 'Technical Support',
    name: 'techSupportName',
    dept: 'techSupportDept',
    contact: 'techSupportContact',
    email: 'techSupportEmail',
  },
];

export const CONTACT_FIELD_ORDER = ['name', 'dept', 'contact', 'email'];

/** Applicant block (same shape as CONTACT_GROUPS but with its own keys). */
export const APPLICANT_GROUP = {
  id: 'applicant',
  title: 'Applicant Information 申請人資料',
  name: 'applicantName',
  dept: 'department',
  contact: 'contactNumber',
  email: 'email',
};

/** Find a CONTACT_GROUPS entry by its id. */
export function contactGroup(id) {
  return CONTACT_GROUPS.find((g) => g.id === id) || null;
}

/* ───────────────────────────── Field registry ───────────────────────────── */
/**
 * type      : 'text' | 'email' | 'textarea' | 'number' | 'date' | 'select' | 'radio'
 * required  : renders the trailing ' *' on the label
 * options   : value domain for 'select' / 'radio'
 * group     : which section the field belongs to
 */
export const FIELDS = {
  /* — Applicant — */
  applicantName: { label: 'Applicant Name 申請人姓名', type: 'text', required: true, group: 'applicant' },
  department: { label: 'Department / Company 所屬部門或公司', type: 'text', required: true, group: 'applicant' },
  contactNumber: { label: 'Contact Number 聯絡電話', type: 'text', required: true, group: 'applicant' },
  email: { label: 'Email 電郵', type: 'email', required: true, group: 'applicant' },

  /* — Project Manager — */
  projectManagerName: { label: 'Name 姓名', type: 'text', required: true, group: 'projectManager' },
  projectManagerDept: { label: 'Department / Company 所屬部門或公司', type: 'text', required: false, group: 'projectManager' },
  projectManagerPhone: { label: 'Contact Number 聯絡電話', type: 'text', required: true, group: 'projectManager' },
  projectManagerEmail: { label: 'Email 電郵', type: 'email', required: false, group: 'projectManager' },

  /* — Project Owner — */
  ownerName: { label: 'Name 姓名', type: 'text', required: true, group: 'owner' },
  ownerDept: { label: 'Department / Company 所屬部門或公司', type: 'text', required: true, group: 'owner' },
  ownerContact: { label: 'Contact Number 聯絡電話', type: 'text', required: true, group: 'owner' },
  ownerEmail: { label: 'Email 電郵', type: 'email', required: true, group: 'owner' },

  /* — Technical Support — */
  techSupportName: { label: 'Name 姓名', type: 'text', required: true, group: 'techSupport' },
  techSupportDept: { label: 'Department / Company 所屬部門或公司', type: 'text', required: true, group: 'techSupport' },
  techSupportContact: { label: 'Contact Number 聯絡電話', type: 'text', required: true, group: 'techSupport' },
  techSupportEmail: { label: 'Email 電郵', type: 'email', required: true, group: 'techSupport' },

  /* — Project type — */
  projectType: { label: 'Project Type 項目類型', type: 'select', required: true, options: PROJECT_TYPES, group: 'type' },

  /* — Project details — */
  title: { label: 'Project Title 項目名稱', type: 'text', required: true, group: 'details' },
  background: { label: 'Project Background & Objective 項目背景信息及目標', type: 'textarea', required: true, group: 'details' },
  painPoint: { label: 'Pain Points 痛點描述', type: 'textarea', required: true, group: 'details' },
  currentWorkarounds: { label: 'Current Workarounds 現有臨時處理方法', type: 'textarea', required: false, group: 'details' },
  projectScope: { label: 'Project Scope 項目範圍', type: 'textarea', required: true, group: 'details' },
  deliverables: { label: 'Expected Deliverables 預期交付成果', type: 'textarea', required: true, group: 'details' },
  benefits: { label: 'Expected Benefits 預期效益', type: 'textarea', required: true, group: 'details' },
  projectPhases: { label: 'Project Phases 項目實施階段', type: 'textarea', required: false, group: 'details' },
  risks: { label: 'Risks & Challenges 潛在風險及實施困難', type: 'textarea', required: false, group: 'details' },

  /* — Timeline & termination — */
  expectedStartDate: { label: 'Expected Start Date 預計開始日期', type: 'date', required: true, group: 'timeline' },
  targetCompletionDate: { label: 'Target Completion Date 預計完成日期', type: 'date', required: true, group: 'timeline' },
  terminationCondition1: { label: 'Termination Condition (1) 終止觸發條件(一)', type: 'textarea', required: false, group: 'timeline' },
  terminationCondition2: { label: 'Termination Condition (2) 終止觸發條件(二)', type: 'textarea', required: false, group: 'timeline' },
  terminationCondition3: { label: 'Termination Condition (3) 終止觸發條件(三)', type: 'textarea', required: false, group: 'timeline' },

  /* — Budget & funding — */
  totalBudget: { label: 'Total Estimated Budget 總預算估算（單位：港幣）', type: 'number', required: true, group: 'budget' },
  fundSource: { label: 'Source of Project Fund 項目預算來源', type: 'select', required: true, options: FUND_SOURCES, group: 'budget' },
  budgetBreakdown: { label: 'Budget Breakdown 預算細分', type: 'textarea', required: false, group: 'budget' },
  targetGovFund: { label: 'Target Gov. Fund 目標政府支助（如有）', type: 'number', required: false, group: 'budget' },
  targetGovFundDetails: { label: 'Target Gov. Fund Details 目標資金詳情（如有）', type: 'textarea', required: false, group: 'budget' },

  /* — Resources & support — */
  resourceRequirements: { label: 'Resource Requirements 其他所需資源（非資金類）', type: 'textarea', required: false, group: 'resources' },
  crossDeptAssistance: { label: 'Cross-Departmental Assistance Required 預計需要公司哪些內部部門協助？', type: 'textarea', required: false, group: 'resources' },

  /* — Technical & innovation — */
  techDirection: { label: 'Proposed Technology Direction 建議技術方向', type: 'textarea', required: false, group: 'tech' },
  innovationElement: { label: 'Innovation Element 項目創新亮點', type: 'textarea', required: false, group: 'tech' },
  technicalRequirements: { label: 'Technical Requirements 具體技術需求', type: 'textarea', required: false, group: 'tech' },

  /* — Current stage — */
  currentStage: { label: 'Current Stage 現時階段', type: 'select', required: true, options: STAGE_TYPES, group: 'stage' },
  stageStartDate: { label: 'Stage Start Date 階段開始日期', type: 'date', required: true, group: 'stage' },
  stageEndDate: { label: 'Stage End Date 預計完成日期', type: 'date', required: true, group: 'stage' },
  stageStatus: { label: 'Stage Status 階段狀態', type: 'select', required: true, options: STAGE_STATUSES, group: 'stage' },
  stageDescription: { label: 'Stage Description 主要描述', type: 'textarea', required: false, group: 'stage' },

  /* — IP & attachments — */
  requireIP: { label: 'Require IP 是否需要申請專利', type: 'radio', required: false, options: REQUIRE_IP_OPTIONS, group: 'ip' },
  ipRegion: { label: 'IP Region 專利申請國家', type: 'select', required: false, options: IP_REGIONS, group: 'ip' },
  remarks: { label: 'Any Other Comments 其他補充備註', type: 'textarea', required: false, group: 'ip' },
  businessProposalFile: { label: 'Business Proposal 商業計劃書', type: 'file', required: false, group: 'ip' },
  otherDocFile: { label: 'Other Documents 其他文件', type: 'file', required: false, group: 'ip' },

  /* — Project-only (not part of the idea wizard) — */
  description: { label: 'Description 簡短描述', type: 'textarea', required: false, group: 'details' },
  status: { label: 'Project Status 項目狀態', type: 'select', required: true, options: PROJECT_STATUSES, group: 'details' },
  budgetUsed: { label: 'Budget Used 已使用（單位：港幣）', type: 'number', required: false, group: 'budget' },
  governmentGrant: { label: 'Government Grant 政府資助', type: 'text', required: false, group: 'budget' },
};

/* ───────────────────────────── Labels & options ───────────────────────────── */

/** Canonical label for a field key. `withRequired` appends ' *'. */
export function fieldLabel(key, { withRequired = false } = {}) {
  const field = FIELDS[key];
  if (!field) return key;
  return withRequired && field.required ? `${field.label} *` : field.label;
}

/** Options for a 'select' / 'radio' field (empty array when not applicable). */
export function fieldOptions(key) {
  return FIELDS[key]?.options || [];
}

/** True when the field is mandatory in the master (Submit Idea) form. */
export function isFieldRequired(key) {
  return !!FIELDS[key]?.required;
}

/* ───────────────────────────── Section titles ───────────────────────────── */
/**
 * The 8 wizard steps. `label` is used by the step indicator AND the section <h3>
 * (master previously showed 'Applicant Info' in the bar but 'Applicant Information'
 * in the page — now a single string). `desc` is the Chinese sub-line.
 */
export const STAGE_STEPS = [
  { key: 'applicant', label: 'Applicant Info', desc: '申請人資料' },
  { key: 'details', label: 'Project Details', desc: '項目 / 意念詳情' },
  { key: 'timeline', label: 'Timeline & Termination', desc: '時間表及終止條件' },
  { key: 'budget', label: 'Budget & Funding', desc: '預算及資金' },
  { key: 'resources', label: 'Resources & Support', desc: '資源及協助' },
  { key: 'tech', label: 'Technical & Innovation', desc: '技術及創新' },
  { key: 'stage', label: 'Current Stage', desc: '現時階段' },
  { key: 'ip', label: 'IP & Attachments', desc: '知識產權及附件' },
];

export const STAGE_STEP_LABELS = STAGE_STEPS.map((s) => s.label);

/** Shared collapsible / section titles used by both detail pages. */
export const SECTION_LABELS = {
  applicant: 'Applicant Information 申請人資料',
  projectManager: 'Project Manager 項目經理',
  owner: 'Project Owner 項目持有者',
  techSupport: 'Technical Support 技術支援',
  projectType: 'Project Type 項目類型',
  details: 'Project Details 項目 / 意念詳情',
  timeline: 'Timeline & Termination 時間表及終止條件',
  budget: 'Budget & Funding 預算及資金',
  resources: 'Resources & Support 資源及協助',
  tech: 'Technical & Innovation 技術及創新',
  stage: 'Current Stage 現時階段',
  ip: 'IP & Attachments 知識產權及附件',
  team: 'Team 項目團隊',
  projectInfo: 'Project Information 項目基本資料',
  dates: 'Dates 日期範圍',
  stages: 'Project Stages 項目階段',
  activityLog: 'Activity Log 活動記錄',
  ideaSource: 'Original Idea Submission 原始意念提交',
};

/* ───────────────────────────── One-time normalisation maps ───────────────────────────── */
/**
 * Unconditional project renames — the value is copied to the canonical key and the
 * legacy key is deleted. A copy only happens when the canonical key is empty, so a
 * value that was already edited on the canonical key is never overwritten.
 */
export const PROJECT_KEY_RENAMES = {
  name: 'title',
  manager: 'projectManagerName',
  holder: 'ownerName',
  budget: 'totalBudget',
  startDate: 'expectedStartDate',
  endDate: 'targetCompletionDate',
};

/**
 * Conditional merges — the source is only deleted when its value was actually moved
 * into the target (i.e. the target was empty). Otherwise the source is kept so no
 * data is ever lost.
 */
export const PROJECT_MERGE_KEYS = {
  detailContent: 'projectScope',
  technicalSupport: 'techSupportDept',
};

/** Legacy keys that are always removed from project documents. */
export const PROJECT_DROP_KEYS = [
  'owner',
  'detail',
  'firstContactName',
  'firstContactDept',
  'firstContactEmail',
  'firstContactPhone',
  'secondContactName',
  'secondContactDept',
  'secondContactEmail',
  'secondContactPhone',
];

/** Per-stage renames inside `project.stages[]`. */
export const STAGE_KEY_RENAMES = {
  budget: 'totalBudget',
  startDate: 'stageStartDate',
  endDate: 'stageEndDate',
  status: 'stageStatus',
  description: 'stageDescription',
};

/** Legacy stage status values → canonical. */
export const STAGE_STATUS_RENAMES = {
  'Not Started': 'Planning',
};

/** Idea-side renames (applied to the ideas collection as well). */
export const IDEA_KEY_RENAMES = {
  applicant: 'applicantName',
  projectTitle: 'title',
  manager: 'projectManagerName',
  holder: 'ownerName',
  budget: 'totalBudget',
  expectedEndDate: 'targetCompletionDate',
  detail: 'projectScope',
  ideaType: 'projectType',
};

/**
 * Idea keys that are never part of the master schema.
 * `oneLineDesc` / `shortDescription` are copied into the project's `description`
 * (short description) before being dropped.
 */
/**
 * Drop only the keys that no longer have any meaning anywhere in the app.
 * `oneLineDesc` / `shortDescription` / `innovativeScore` are kept because
 * approveIdea() uses them to seed the project's short description and the
 * AI score is still shown on the approval cards.
 */
export const IDEA_DROP_KEYS = [
  'firstContactName',
  'firstContactDept',
  'firstContactEmail',
  'firstContactPhone',
  'secondContactName',
  'secondContactDept',
  'secondContactEmail',
  'secondContactPhone',
];

/** Keys that legitimately belong to a project only (no idea counterpart). */
export const PROJECT_ONLY_KEYS = [
  'status',
  'stages',
  'budgetUsed',
  'governmentGrant',
  'description',
  'logs',
  'originalIdeaId',
  'createdAt',
  'uid',
  'pmPassword',
  'ownerPassword',
  'isIdeaConversion',
];

/* ───────────────────────────── Transition-safe reader ───────────────────────────── */

/** canonical key → legacy key (reverse of PROJECT_KEY_RENAMES + merge sources). */
const LEGACY_FALLBACK = {
  ...Object.fromEntries(
    Object.entries(PROJECT_KEY_RENAMES).map(([legacy, canonical]) => [canonical, legacy])
  ),
  projectScope: 'detailContent',
  techSupportDept: 'technicalSupport',
};

/**
 * Read a canonical field from a document, falling back to the legacy key while the
 * one-time normalisation has not run yet. Always use this in display components
 * during the transition so nothing renders empty.
 */
export function readField(doc, key) {
  if (!doc) return undefined;
  const direct = doc[key];
  if (direct !== undefined && direct !== null && direct !== '') return direct;
  const legacy = LEGACY_FALLBACK[key];
  return legacy ? doc[legacy] : direct;
}

/** canonical stage key → legacy stage key (reverse of STAGE_KEY_RENAMES). */
const STAGE_LEGACY_FALLBACK = Object.fromEntries(
  Object.entries(STAGE_KEY_RENAMES).map(([legacy, canonical]) => [canonical, legacy])
);

/** Same as readField, but for items inside `project.stages[]`. */
export function readStageField(stage, key) {
  if (!stage) return undefined;
  const direct = stage[key];
  if (direct !== undefined && direct !== null && direct !== '') return direct;
  const legacy = STAGE_LEGACY_FALLBACK[key];
  return legacy ? stage[legacy] : direct;
}

/** Build the canonical stage object written to `project.stages[]`. */
export function buildStage(stageForm, extra = {}) {
  return {
    type: stageForm.type || DEFAULT_STAGE_TYPE,
    stageStartDate: stageForm.stageStartDate || '',
    stageEndDate: stageForm.stageEndDate || '',
    totalBudget: parseFloat(stageForm.totalBudget) || 0,
    budgetUsed: parseFloat(stageForm.budgetUsed) || 0,
    stageStatus: stageForm.stageStatus || DEFAULT_STAGE_STATUS,
    stageDescription: stageForm.stageDescription || '',
    ...extra,
  };
}

/** Convert an existing stage document into the canonical form shape. */
export function stageToForm(stage) {
  return {
    type: readStageField(stage, 'type') || DEFAULT_STAGE_TYPE,
    stageStartDate: readStageField(stage, 'stageStartDate') || '',
    stageEndDate: readStageField(stage, 'stageEndDate') || '',
    totalBudget: readStageField(stage, 'totalBudget') ?? '',
    budgetUsed: readStageField(stage, 'budgetUsed') ?? '',
    stageStatus: readStageField(stage, 'stageStatus') || DEFAULT_STAGE_STATUS,
    stageDescription: readStageField(stage, 'stageDescription') || '',
  };
}
