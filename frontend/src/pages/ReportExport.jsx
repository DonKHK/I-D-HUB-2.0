import React from 'react';
import * as XLSX from 'xlsx';
import { useData } from '../context/DataContext';
import { fieldLabel, readField, CONTACT_GROUPS } from '../utils/fields';

// Contact columns are prefixed with the role so a spreadsheet header is unambiguous
// (e.g. "Project Manager — Name 姓名").
const PM = CONTACT_GROUPS[0];
const OWNER = CONTACT_GROUPS[1];
const TECH = CONTACT_GROUPS[2];
const contactHeader = (group, slot) => `${group.shortLabel} — ${fieldLabel(group[slot])}`;

/** Projects sheet rows — one canonical label per column (source: utils/fields.js). */
const buildProjectRows = (projects) =>
  projects.map((p) => ({
    'Project ID': p.id,
    [fieldLabel('title')]: readField(p, 'title'),
    [fieldLabel('status')]: p.status,
    [fieldLabel('projectType')]: p.projectType,
    [contactHeader(PM, 'name')]: readField(p, 'projectManagerName'),
    [contactHeader(PM, 'dept')]: readField(p, 'projectManagerDept'),
    [contactHeader(PM, 'contact')]: readField(p, 'projectManagerPhone'),
    [contactHeader(PM, 'email')]: readField(p, 'projectManagerEmail'),
    [contactHeader(OWNER, 'name')]: readField(p, 'ownerName'),
    [contactHeader(OWNER, 'dept')]: readField(p, 'ownerDept'),
    [contactHeader(OWNER, 'contact')]: readField(p, 'ownerContact'),
    [contactHeader(OWNER, 'email')]: readField(p, 'ownerEmail'),
    [contactHeader(TECH, 'name')]: readField(p, 'techSupportName'),
    [contactHeader(TECH, 'dept')]: readField(p, 'techSupportDept'),
    [contactHeader(TECH, 'contact')]: readField(p, 'techSupportContact'),
    [fieldLabel('totalBudget')]: readField(p, 'totalBudget'),
    [fieldLabel('budgetUsed')]: p.budgetUsed,
    [fieldLabel('fundSource')]: p.fundSource,
    [fieldLabel('governmentGrant')]: p.governmentGrant,
    [fieldLabel('expectedStartDate')]: readField(p, 'expectedStartDate'),
    [fieldLabel('targetCompletionDate')]: readField(p, 'targetCompletionDate'),
    [fieldLabel('description')]: p.description,
    [fieldLabel('projectScope')]: readField(p, 'projectScope'),
  }));

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

const writeSheet = (rows, sheetName, cols, filePrefix) => {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
  if (cols) ws['!cols'] = cols;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const projectCols = [
  { wch: 12 }, { wch: 35 }, { wch: 14 }, { wch: 26 },
  { wch: 26 }, { wch: 26 }, { wch: 18 }, { wch: 26 },
  { wch: 26 }, { wch: 26 }, { wch: 18 }, { wch: 26 },
  { wch: 26 }, { wch: 26 }, { wch: 18 },
  { wch: 22 }, { wch: 16 }, { wch: 22 }, { wch: 28 },
  { wch: 18 }, { wch: 18 }, { wch: 40 }, { wch: 40 },
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
    writeSheet(buildProjectRows(projects), 'Projects', projectCols, 'Projects_Report');
  };

  const exportIdeas = () => {
    writeSheet(buildIdeaRows(ideas), 'Ideas', ideaCols, 'Ideas_Report');
  };

  const exportFundingSchemes = () => {
    writeSheet(buildFundingRows(fundingSchemes), 'Funding Schemes', fundingCols, 'FundingSchemes_Report');
  };

  const exportAllInOne = () => {
    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(buildProjectRows(projects).length ? buildProjectRows(projects) : [{}]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Projects');

    const ws2 = XLSX.utils.json_to_sheet(buildIdeaRows(ideas).length ? buildIdeaRows(ideas) : [{}]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Ideas');

    const ws3 = XLSX.utils.json_to_sheet(buildFundingRows(fundingSchemes).length ? buildFundingRows(fundingSchemes) : [{}]);
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
          <p>Export all projects with budget, status, dates, and team information</p>
          <div className="export-card-info">
            <span>{projects.length} projects</span>
            <span>{Object.keys(buildProjectRows(projects)[0] || {}).length} columns</span>
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