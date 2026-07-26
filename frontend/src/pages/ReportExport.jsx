import React from 'react';
import * as XLSX from 'xlsx';
import { sampleProjects, sampleIdeas, sampleFundingSchemes } from '../data/sampleData';

export default function ReportExport() {
  const exportProjects = () => {
    const data = sampleProjects.map(p => ({
      'Project ID': p.id,
      'Name': p.name,
      'Description': p.description,
      'Manager': p.manager,
      'Holder': p.holder,
      'Status': p.status,
      'Budget (HKD)': p.budget,
      'Budget Used (HKD)': p.budgetUsed,
      'Start Date': p.startDate,
      'End Date': p.endDate,
      'Government Grant': p.governmentGrant,
      'Technical Support': p.technicalSupport || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 12 }, { wch: 35 }, { wch: 40 }, { wch: 18 },
      { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    XLSX.writeFile(wb, `Projects_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportIdeas = () => {
    const data = sampleIdeas.map(idea => ({
      'Idea ID': idea.id,
      'Title': idea.title,
      'Applicant': idea.applicantName,
      'Type': idea.ideaType,
      'Status': idea.status,
      'Budget (HKD)': idea.totalBudget,
      'Innovative Score': idea.innovativeScore,
      'Created Date': idea.createdAt ? idea.createdAt.slice(0, 10) : '',
      'Start Date': idea.expectedStartDate,
      'End Date': idea.expectedEndDate,
      'One-line Description': idea.oneLineDesc,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 14 }, { wch: 40 }, { wch: 18 }, { wch: 20 },
      { wch: 12 }, { wch: 15 }, { wch: 16 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 50 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ideas');
    XLSX.writeFile(wb, `Ideas_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportFundingSchemes = () => {
    const data = sampleFundingSchemes.map(fs => ({
      'Scheme ID': fs.id,
      'Name': fs.name,
      'Provider': fs.provider,
      'Total Amount (HKD)': fs.totalAmount,
      'Deadline': fs.deadline,
      'Status': fs.status,
      'Description': fs.description,
      'Eligibility': fs.eligibility,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 10 }, { wch: 35 }, { wch: 30 }, { wch: 20 },
      { wch: 14 }, { wch: 10 }, { wch: 50 }, { wch: 50 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Funding Schemes');
    XLSX.writeFile(wb, `FundingSchemes_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportAllInOne = () => {
    const wb = XLSX.utils.book_new();

    // Projects sheet
    const projectsData = sampleProjects.map(p => ({
      'Project ID': p.id, 'Name': p.name, 'Status': p.status,
      'Manager': p.manager, 'Budget': p.budget, 'Budget Used': p.budgetUsed,
    }));
    const ws1 = XLSX.utils.json_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Projects');

    // Ideas sheet
    const ideasData = sampleIdeas.map(idea => ({
      'Idea ID': idea.id, 'Title': idea.title, 'Applicant': idea.applicantName,
      'Type': idea.ideaType, 'Status': idea.status, 'Budget': idea.totalBudget,
    }));
    const ws2 = XLSX.utils.json_to_sheet(ideasData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Ideas');

    // Funding Schemes sheet
    const fsData = sampleFundingSchemes.map(fs => ({
      'Scheme ID': fs.id, 'Name': fs.name, 'Provider': fs.provider,
      'Amount': fs.totalAmount, 'Deadline': fs.deadline, 'Status': fs.status,
    }));
    const ws3 = XLSX.utils.json_to_sheet(fsData);
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
            <span>{sampleProjects.length} projects</span>
            <span>12 columns</span>
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
            <span>{sampleIdeas.length} ideas</span>
            <span>11 columns</span>
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
            <span>{sampleFundingSchemes.length} schemes</span>
            <span>8 columns</span>
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