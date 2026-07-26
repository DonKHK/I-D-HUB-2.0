import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';

export default function AllProjects({ onNavigate }) {
  const { projects } = useData();
  const { isAuthenticated, logout } = useAuth();

  const [demoModal, setDemoModal] = useState(null);

  const handleBackToLogin = () => {
    if (window.confirm('Are you sure you want to go back to login?')) {
      logout();
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Completed') return 'all-projects-status--completed';
    if (status === 'In Progress') return 'all-projects-status--progress';
    return 'all-projects-status--planning';
  };

  const getStatusLabel = (status) => {
    if (status === 'Completed') return 'Completed';
    if (status === 'In Progress') return 'In Progress';
    return 'Planning';
  };

  const getHealthDotClass = (p) => {
    if (p.status === 'Completed') return 'proj-dot--green';
    if (p.status === 'In Progress') return 'proj-dot--blue';
    return 'proj-dot--amber';
  };

  return (
    <div className="page page--wide">
      {/* Header */}
      <div className="all-projects-header">
        <h2 className="section-title">All Projects</h2>
        {!isAuthenticated && (
          <button onClick={handleBackToLogin} className="all-projects-back-btn">
            ← Back to Login
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="all-projects-info-box">
        <p>Below is a full list of all projects — pending, in progress, and completed.</p>
        <p>If you're interested in any project or would like more details, feel free to contact our department:</p>
        <div className="all-projects-contacts">
          <div>
            <strong>Christy Wong</strong><br />
            <a href="mailto:christy.wong.yt@asiaalliedgroup.com">christy.wong.yt@asiaalliedgroup.com</a>
          </div>
          <div>
            <strong>Don Kwan</strong><br />
            <a href="mailto:don.kwan@asiaalliedgroup.com">don.kwan@asiaalliedgroup.com</a>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="all-projects-grid">
        {projects.length === 0 && (
          <p className="empty-text" style={{ gridColumn: '1 / -1', padding: '5rem 0' }}>
            No project data available
          </p>
        )}
        {projects.map((p) => (
          <div key={p.id} className="proj-card">
            <div className="proj-card-top">
              <div className="proj-card-badges">
                <span className={`proj-dot ${getHealthDotClass(p)}`} />
                <span className={`all-projects-status ${getStatusBadgeClass(p)}`}>
                  {getStatusLabel(p.status)}
                </span>
              </div>
              <div className="proj-card-ids">
                <span className="proj-card-id">ID: {p.id}</span>
                {p.originalIdeaId && (
                  <span className="proj-card-idea-id">Idea: {p.originalIdeaId}</span>
                )}
              </div>
            </div>
            <h3 className="proj-card-name">{p.name || 'Untitled Project'}</h3>
            <p className="proj-card-desc">{p.description || 'No description'}</p>
            <p className="proj-card-detail">{p.detail || p.detailContent || 'No details'}</p>
            <div className="proj-card-owner">
              <span className="proj-card-owner-label">Owner: </span>
              {p.owner || p.holder || '—'}
            </div>
            <button className="btn btn--small btn--demo" onClick={() => setDemoModal(p)}>
              🔗 DEMO
            </button>
          </div>
        ))}
      </div>

      {/* DEMO Modal */}
      <Modal isOpen={!!demoModal} onClose={() => setDemoModal(null)} title={`DEMO - ${demoModal?.name || ''}`}>
        <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '1rem' }}>
            🚧 暫未有資料
          </p>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            Demo 資料將會喺稍後更新
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn btn--primary" onClick={() => setDemoModal(null)}>關閉</button>
        </div>
      </Modal>
    </div>
  );
}
