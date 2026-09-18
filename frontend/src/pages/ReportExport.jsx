import React from 'react';
import * as XLSX from 'xlsx';
import { useData } from '../context/DataContext';
import { fieldLabel, readField, readStageField, DEFAULT_PROJECT_STATUS } from '../utils/fields';

/* ─────────────── My Project export (mirrors the My Project page) ─────────────── */
/**
 * Fixed milestone columns. A cell shows the matching stage's `stageStatus`, or
 * 'NA' when the project has no stage with that exact type (case-insensitive).
 */
const MILESTONE_COLUMNS = [
  'Feasibility',
  'POC',
  'Development',
  'Pilot/UAT',
  'Commercialization',
  'Handover',
];

/**
 * Column contract of the "My Project" sheet — one row per project, in exactly the
 * order the My Project page presents the same data.
 */
const MY_PROJECT_HEADERS = [
  'Project ID',
  'Idea ID',
  'Project Name',
  'Project Status',
  'Project Owner',
  'Project management',
  'Technical Support',
  'Budget',
  'Project Start Date',
  'Project End Date',
  ...MILESTONE_COLUMNS,
];

/** Number format used for every real date cell written to Excel. */
const EXCEL_DATE_FORMAT = 'yyyy-mm-dd';

/** stageStatus of the project's stage whose type matches the milestone, else 'NA'. */
const stageStatusFor = (project, milestone) => {
  const key = milestone.trim().toLowerCase();
  const stage = (project.stages || []).find(
    (s) => (readStageField(s, 'type') || '').trim().toLowerCase() === key
  );
  return stage ? readStageField(stage, 'stageStatus') || 'NA' : 'NA';
};

/**
 * 'YYYY-MM-DD' (or an existing Excel serial) → JS Date, so SheetJS writes a real
 * Excel date cell instead of plain text. Unparseable values pass through as-is.
 */
const toExcelDate = (value) => {
  if (value === undefined || value === null || value === '') return '';
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(Date.UTC(1899, 11, 30) + value * 86400000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d;
};

/** My Project sheet rows — the same data the My Project / My Projects page shows. */
const buildMyProjectRows = (projects) =>
  projects.map((p) => {
    const row = {
      'Project ID': p.id,
      'Idea ID': p.originalIdeaId || '',
      'Project Name': readField(p, 'title') || '',
      'Project Status': p.status || DEFAULT_PROJECT_STATUS,
      'Project Owner': readField(p, 'ownerName') || '',
      'Project management': readField(p, 'projectManagerName') || '',
      'Technical Support': readField(p, 'techSupportName') || readField(p, 'techSupportDept') || '',
      Budget: readField(p, 'totalBudget') ?? '',
      'Project Start Date': toExcelDate(readField(p, 'expectedStartDate')),
      'Project End Date': toExcelDate(readField(p, 'targetCompletionDate')),
    };
    MILESTONE_COLUMNS.forEach((m) => {
      row[m] = stageStatusFor(p, m);
    });
    return row;
  });

/** Ideas sheet rows. */
const buildIdeaRows = (ideas) =>
  ideas.map((i) => ({
    'Idea ID': i.id,
    [fieldLabel('title')]: i.title,
    [fieldLabel('applicantName')]: i.applicantName,
    [fieldLabel('department')]: i.department,
    [fieldLabel('contactNumber')]: i.contactNumber,
    [fieldLabel('email')]: i.email,
    [fieldLabel('projectType')]: i.projectType,
    'Status 狀態': i.status,
    [fieldLabel('totalBudget')]: i.totalBudget,
    [fieldLabel('fundSource')]: i.fundSource,
    [fieldLabel('expectedStartDate')]: i.expectedStartDate,
    [fieldLabel('targetCompletionDate')]: i.targetCompletionDate,
    [fieldLabel('projectScope')]: i.projectScope,
    'AI Score': i.aiAnalysis?.overallScore ?? '',
    'Created Date': i.createdAt ? i.createdAt.slice(0, 10) : '',
  }));

/** Funding Schemes sheet rows — labels match the Funding Schemes form. */
const buildFundingRows = (schemes) =>
  schemes.map((fs) => ({
    'Scheme ID': fs.id,
    'Scheme Name': fs.name,
    'Provider': fs.provider,
    'Total Amount (HKD)': fs.totalAmount,
    'Eligibility Criteria': fs.eligibility,
    'Deadline': fs.deadline,
    'Status': fs.status,
    'Description': fs.description,
  }));

/** Derive a header array from a row builder, so headers can never drift from rows. */
const headersOf = (buildRows) => Object.keys(buildRows([{}])[0] || {});

const IDEA_HEADERS = headersOf(buildIdeaRows);
const FUNDING_HEADERS = headersOf(buildFundingRows);

/**
 * Write one sheet to its own workbook. Passing `headers` guarantees the header row
 * is still written when the collection is empty (previously the file had no columns).
 */
const writeSheet = (rows, sheetName, cols, filePrefix, headers) => {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers, dateNF: EXCEL_DATE_FORMAT });
  if (cols) ws['!cols'] = cols;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/** Column widths for the "My Project" sheet — one entry per MY_PROJECT_HEADERS. */
const myProjectCols = [
  { wch: 14 }, { wch: 14 }, { wch: 40 }, { wch: 14 }, { wch: 24 },
  { wch: 26 }, { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
  ...MILESTONE_COLUMNS.map(() => ({ wch: 16 })),
];

const ideaCols = [
  { wch: 14 }, { wch: 40 }, { wch: 20 }, { wch: 24 },
  { wch: 18 }, { wch: 26 }, { wch: 24 }, { wch: 12 },
  { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 18 },
  { wch: 40 }, { wch: 10 }, { wch: 14 },
];

const fundingCols = [
  { wch: 10 }, { wch: 35 }, { wch: 30 }, { wch: 20 },
  { wch: 40 }, { wch: 14 }, { wch: 10 }, { wch: 50 },
];

export default function ReportExport() {
  const { projects, ideas, fundingSchemes } = useData();

  const exportProjects = () => {
    writeSheet(buildMyProjectRows(projects), 'My Project', myProjectCols, 'Projects_Report', MY_PROJECT_HEADERS);
  };

  const exportIdeas = () => {
    writeSheet(buildIdeaRows(ideas), 'Ideas', ideaCols, 'Ideas_Report', IDEA_HEADERS);
  };

  const exportFundingSchemes = () => {
    writeSheet(buildFundingRows(fundingSchemes), 'Funding Schemes', fundingCols, 'FundingSchemes_Report', FUNDING_HEADERS);
  };

  const exportAllInOne = () => {
    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(buildMyProjectRows(projects), { header: MY_PROJECT_HEADERS, dateNF: EXCEL_DATE_FORMAT });
    ws1['!cols'] = myProjectCols;
    XLSX.utils.book_append_sheet(wb, ws1, 'My Project');

    const ws2 = XLSX.utils.json_to_sheet(buildIdeaRows(ideas), { header: IDEA_HEADERS, dateNF: EXCEL_DATE_FORMAT });
    ws2['!cols'] = ideaCols;
    XLSX.utils.book_append_sheet(wb, ws2, 'Ideas');

    const ws3 = XLSX.utils.json_to_sheet(buildFundingRows(fundingSchemes), { header: FUNDING_HEADERS, dateNF: EXCEL_DATE_FORMAT });
    ws3['!cols'] = fundingCols;
    XLSX.utils.book_append_sheet(wb, ws3, 'Funding Schemes');

    XLSX.writeFile(wb, `All_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="report-export-page">
      <h1 className="page-title">Report Export</h1>
      <p className="page-subtitle">Export data to Excel (.xlsx) files for reporting and analysis</p>

      <div className="export-cards">
        <div className="export-card">
          <div className="export-card-icon">📋</div>
          <h3>Projects Report</h3>
          <p>Export every project exactly as shown on the My Project page — owner, team, budget, dates and milestone status</p>
          <div className="export-card-info">
            <span>{projects.length} projects</span>
            <span>{MY_PROJECT_HEADERS.length} columns</span>
          </div>
          <button className="export-btn export-btn--projects" onClick={exportProjects}>
            📥 Export Projects
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-icon">💡</div>
          <h3>Ideas Report</h3>
          <p>Export all submitted ideas with applicant details, budget, and status</p>
          <div className="export-card-info">
            <span>{ideas.length} ideas</span>
            <span>{Object.keys(buildIdeaRows(ideas)[0] || {}).length} columns</span>
          </div>
          <button className="export-btn export-btn--ideas" onClick={exportIdeas}>
            📥 Export Ideas
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-icon">💰</div>
          <h3>Funding Schemes Report</h3>
          <p>Export all funding schemes with provider, amount, deadline, and eligibility</p>
          <div className="export-card-info">
            <span>{fundingSchemes.length} schemes</span>
            <span>{Object.keys(buildFundingRows(fundingSchemes)[0] || {}).length} columns</span>
          </div>
          <button className="export-btn export-btn--funding" onClick={exportFundingSchemes}>
            📥 Export Funding Schemes
          </button>
        </div>
      </div>

      <div className="export-all-section">
        <button className="export-btn export-btn--all" onClick={exportAllInOne}>
          📦 Export All (3 Sheets in One File)
        </button>
      </div>
    </div>
  );
}