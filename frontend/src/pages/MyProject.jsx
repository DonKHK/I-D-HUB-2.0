import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function MyProject() {
  const navigate = useNavigate();
  const { userProjectId } = useAuth();
  const { projects, updateProject } = useData();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProjectId) {
      const p = projects.find((pr) => pr.id === userProjectId);
      if (p) {
        setProject(p);
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userProjectId, projects]);

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

  // Determine project status color
  const statusColor = {
    'Planning': '#f59e0b',
    'In Progress': '#3b82f6',
    'Completed': '#10b981',
    'On Hold': '#ef4444',
    'Cancelled': '#6b7280',
  }[project.status] || '#6b7280';

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="page-header">
          <h2>My Project</h2>
          <span
            className="project-status-badge"
            style={{ backgroundColor: statusColor }}
          >
            {project.status || 'Planning'}
          </span>
        </div>

        {/* Project ID */}
        <div className="form-section">
          <h3 className="form-section-title">Project ID</h3>
          <p className="form-section-value">{project.id}</p>
        </div>

        {/* Project Name */}
        <div className="form-section">
          <h3 className="form-section-title">Project Name</h3>
          <p className="form-section-value">{project.name || 'Untitled'}</p>
        </div>

        {/* Description */}
        {project.description && (
          <div className="form-section">
            <h3 className="form-section-title">Description</h3>
            <p className="form-section-value">{project.description}</p>
          </div>
        )}

        {/* Timeline */}
        {(project.startDate || project.endDate) && (
          <div className="form-section">
            <h3 className="form-section-title">Timeline</h3>
            <p className="form-section-value">
              {project.startDate && `Start: ${project.startDate}`}
              {project.startDate && project.endDate && ' | '}
              {project.endDate && `End: ${project.endDate}`}
            </p>
          </div>
        )}

        {/* Budget */}
        {(project.budget > 0 || project.totalBudget > 0) && (
          <div className="form-section">
            <h3 className="form-section-title">Budget</h3>
            <p className="form-section-value">
              HK$ {(project.budget || project.totalBudget || 0).toLocaleString()}
            </p>
          </div>
        )}

        {/* Key Contacts */}
        {(project.manager || project.holder) && (
          <div className="form-section">
            <h3 className="form-section-title">Key Contacts</h3>
            {project.manager && <p><strong>Manager:</strong> {project.manager}</p>}
            {project.holder && <p><strong>Holder:</strong> {project.holder}</p>}
            {project.projectManagerName && <p><strong>Project Manager:</strong> {project.projectManagerName}</p>}
          </div>
        )}

        {/* Background & Details */}
        {project.background && (
          <div className="form-section">
            <h3 className="form-section-title">Background</h3>
            <p className="form-section-value">{project.background}</p>
          </div>
        )}

        {project.painPoint && (
          <div className="form-section">
            <h3 className="form-section-title">Pain Point</h3>
            <p className="form-section-value">{project.painPoint}</p>
          </div>
        )}

        {project.benefits && (
          <div className="form-section">
            <h3 className="form-section-title">Expected Benefits</h3>
            <p className="form-section-value">{project.benefits}</p>
          </div>
        )}

        {project.deliverables && (
          <div className="form-section">
            <h3 className="form-section-title">Deliverables</h3>
            <p className="form-section-value">{project.deliverables}</p>
          </div>
        )}

        {/* Project Phases / Stages */}
        {project.stages && project.stages.length > 0 && (
          <div className="form-section">
            <h3 className="form-section-title">Project Stages</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {project.stages.map((stage, idx) => (
                  <tr key={idx}>
                    <td>{stage.name || stage.stage || `Stage ${idx + 1}`}</td>
                    <td>{stage.status || '-'}</td>
                    <td>{stage.startDate || '-'}</td>
                    <td>{stage.endDate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Additional Details */}
        {project.detailContent && (
          <div className="form-section">
            <h3 className="form-section-title">Details</h3>
            <p className="form-section-value">{project.detailContent}</p>
          </div>
        )}

        {/* Technical Support Info */}
        {project.techSupportDept && (
          <div className="form-section">
            <h3 className="form-section-title">Technical Support</h3>
            <p className="form-section-value">{project.techSupportDept}</p>
          </div>
        )}
      </div>
    </div>
  );
}