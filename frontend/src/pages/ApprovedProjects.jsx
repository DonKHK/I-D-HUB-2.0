import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatCurrency } from '../utils/helpers';
import Modal from '../components/Modal';

export default function ApprovedProjects() {
  const navigate = useNavigate();
  const { ideas, projects, deleteProject } = useData();
  const { isSuperAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteProject = async (id) => {
    setDeleting(true);
    await deleteProject(id);
    setDeleting(false);
    setDeleteModal(null);
  };

  const approved = useMemo(() => {
    let list = ideas.filter((i) => i.status === 'approved');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          i.applicant.toLowerCase().includes(q)
      );
    }
    return list;
  }, [ideas, search]);

  return (
    <div className="page">
      <h1 className="page-title">Approved Projects</h1>
      <p className="page-subtitle">Ideas that have been approved and are transitioning into active projects</p>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by title, ID, or applicant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {approved.length === 0 && (
        <p className="empty-text">{search ? 'No matches found' : 'No approved projects yet'}</p>
      )}

      <div className="projects-grid">
        {approved.map((idea) => {
          // Find the project that was generated from this idea
          const project = projects.find((p) => p.originalIdeaId === idea.id);

          return (
            <div key={idea.id} className="project-card">
              <div className="project-card__header">
                <span className="status-badge status-badge--approved">Approved</span>
                {isSuperAdmin && project && (
                  <button
                    className="btn btn--danger btn--sm"
                    style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal(project);
                    }}
                    title="Delete project"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
              <div className="project-card__body">
                <h3 className="project-card__title">{idea.title}</h3>
                <p className="project-card__desc">{idea.oneLineDesc}</p>

                  <div className="project-card__details">
                    <div className="project-card__detail">
                      <label>Project ID</label>
                      <span>
                        {project ? (
                          <a
                            href="#"
                            className="link"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/my-projects/${project.id}`);
                            }}
                          >
                            {project.id}
                          </a>
                        ) : '—'}
                      </span>
                    </div>
                    <div className="project-card__detail">
                      <label>Idea ID</label>
                      <span>
                        <a
                          href="#"
                          className="link"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/idea-detail/${idea.id}`);
                          }}
                        >
                          {idea.id}
                        </a>
                      </span>
                    </div>
                    <div className="project-card__detail">
                      <label>Budget</label>
                      <span>{formatCurrency(idea.totalBudget)}</span>
                    </div>
                    <div className="project-card__detail">
                      <label>Score</label>
                      <span>{idea.innovativeScore}/10</span>
                    </div>
                    <div className="project-card__detail">
                      <label>Submitted</label>
                      <span>{formatDateTime(idea.createdAt)}</span>
                    </div>
                    <div className="project-card__detail">
                      <label>Approved</label>
                      <span>{formatDateTime(idea.approvedAt)}</span>
                    </div>
                  </div>

                <div className="project-card__team" style={{ marginTop: '0.5rem' }}>
                  <span>👤 {idea.applicant}</span>
                  <span>🏷️ {idea.ideaType}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <Modal
          title="Delete Project"
          onClose={() => setDeleteModal(null)}
        >
          <p style={{ marginBottom: '1rem' }}>
            Are you sure you want to permanently delete project <strong>{deleteModal.id}</strong> — <em>{deleteModal.name}</em>?
          </p>
          <p style={{ marginBottom: '1.5rem', color: '#e74c3c', fontSize: '0.9rem' }}>
            This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn--secondary" onClick={() => setDeleteModal(null)} disabled={deleting}>
              Cancel
            </button>
            <button className="btn btn--danger" onClick={() => handleDeleteProject(deleteModal.id)} disabled={deleting}>
              {deleting ? 'Deleting...' : '🗑️ Delete Permanently'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
