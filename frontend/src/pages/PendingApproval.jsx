import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatCurrency, calculateIdeaHealth } from '../utils/helpers';
import Modal from '../components/Modal';

export default function PendingApproval({ onNavigate }) {
  const navigate = useNavigate();
  const {
    ideas,
    updateIdea,
    deleteIdea,
    permanentlyDeleteIdea,
    restoreIdea,
    approveIdea,
  } = useData();
  const { isSuperAdmin } = useAuth();

  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [permDeleteModal, setPermDeleteModal] = useState(null);

  const pendingIdeas = useMemo(() => ideas.filter((i) => i.status === 'pending'), [ideas]);
  const approvedIdeas = useMemo(() => ideas.filter((i) => i.status === 'approved'), [ideas]);
  const rejectedIdeas = useMemo(() => ideas.filter((i) => i.status === 'rejected'), [ideas]);
  const deletedIdeas = useMemo(() => ideas.filter((i) => i.status === 'deleted'), [ideas]);

  const handleApprove = (id) => {
    approveIdea(id);
    setApproveModal(null);
  };

  const handleReject = (id) => {
    updateIdea(id, { status: 'rejected', rejectReason });
    setRejectModal(null);
    setRejectReason('');
  };

  const handlePermanentDelete = (id) => {
    permanentlyDeleteIdea(id);
    setPermDeleteModal(null);
  };

  const handleViewDetails = (id) => {
    navigate(`/idea-detail/${id}`);
  };

  const renderIdeaCard = (idea, type) => {
    const health = calculateIdeaHealth(idea);
    const getStatusColor = () => {
      switch (type) {
        case 'pending': return '#f59e0b';
        case 'approved': return '#22c55e';
        case 'rejected': return '#ef4444';
        case 'deleted': return '#6b7280';
        default: return '#6b7280';
      }
    };

    return (
      <div key={idea.id} className={`approval-card approval-card--${type}`}>
        <div className="approval-card-header">
          <span className="health-dot" style={{ backgroundColor: health?.color || getStatusColor() }} />
          <span className={`status-badge status-badge--${type}`}>
            {type === 'pending' ? 'Pending' : type === 'approved' ? 'Approved' : type === 'rejected' ? 'Rejected' : 'Deleted'}
          </span>
        </div>
        <h3 className="approval-card-title">{idea.title || idea.projectTitle || 'Untitled'}</h3>
        <div className="approval-card-meta">
          <span
            className="approval-card-id-link"
            onClick={() => handleViewDetails(idea.id)}
            title="Click to view full details"
          >
            📋 {idea.id}
          </span>
          <span>👤 {idea.applicantName || idea.applicant || idea.ownerName || '-'}</span>
          <span>📅 {formatDate(idea.createdAt)}</span>
          {type === 'approved' && <span>⭐ Approved: {formatDateTime(idea.approvedAt)}</span>}
        </div>
        {idea.oneLineDesc && <p className="approval-card-desc">{idea.oneLineDesc}</p>}
        {idea.rejectReason && <p className="reject-reason">Reason: {idea.rejectReason}</p>}
        <div className="approval-card-actions">
          <button className="btn btn--small" onClick={() => handleViewDetails(idea.id)}>
            View Details
          </button>

          {type === 'pending' && (
            <>
              <button className="btn btn--small btn--primary" onClick={() => setApproveModal(idea.id)}>
                Approve
              </button>
              <button className="btn btn--small btn--danger" onClick={() => setRejectModal(idea.id)}>
                Reject
              </button>
              <button className="btn btn--small btn--outline-danger" onClick={() => deleteIdea(idea.id)} title="Soft delete">
                🗑️
              </button>
            </>
          )}

          {(type === 'approved' || type === 'rejected') && isSuperAdmin && (
            <button className="btn btn--small btn--outline-danger" onClick={() => deleteIdea(idea.id)} title="Soft delete">
              🗑️
            </button>
          )}

          {type === 'deleted' && isSuperAdmin && (
            <>
              <button className="btn btn--small btn--primary" onClick={() => restoreIdea(idea.id)}>
                Restore
              </button>
              <button className="btn btn--small btn--danger" onClick={() => setPermDeleteModal(idea.id)}>
                Permanently Delete
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (title, ideas, type) => (
    <div className="dashboard-card">
      <h2 className="dashboard-card-title">
        {title} ({ideas.length})
      </h2>
      {ideas.length === 0 && <p className="empty-text">No {title.toLowerCase()}</p>}
      {ideas.map((idea) => renderIdeaCard(idea, type))}
    </div>
  );

  return (
    <div className="page">
      <h1 className="page-title">Pending Approval</h1>

      <div className="approval-sections">
        {renderSection('Pending Review', pendingIdeas, 'pending')}
        {renderSection('Approved', approvedIdeas, 'approved')}
        {renderSection('Rejected', rejectedIdeas, 'rejected')}
        {renderSection('Deleted', deletedIdeas, 'deleted')}
      </div>

      {/* Approve Modal */}
      <Modal isOpen={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Idea">
        <p>Are you sure you want to approve this idea? A new project will be created from it.</p>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setApproveModal(null)}>Cancel</button>
          <button className="btn btn--primary" onClick={() => handleApprove(approveModal)}>Approve</button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Idea">
        <div className="form-group">
          <label>Reason for rejection</label>
          <textarea rows="3" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Provide a reason..." />
        </div>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setRejectModal(null)}>Cancel</button>
          <button className="btn btn--danger" onClick={() => handleReject(rejectModal)} disabled={!rejectReason.trim()}>
            Reject
          </button>
        </div>
      </Modal>

      {/* Permanently Delete Modal */}
      <Modal isOpen={!!permDeleteModal} onClose={() => setPermDeleteModal(null)} title="Permanently Delete Idea">
        <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem' }}>
          ⚠️ This action cannot be undone!
        </p>
        <p>Are you sure you want to permanently delete this idea? It will be removed from the system entirely.</p>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setPermDeleteModal(null)}>Cancel</button>
          <button className="btn btn--danger" onClick={() => handlePermanentDelete(permDeleteModal)}>
            Permanently Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}