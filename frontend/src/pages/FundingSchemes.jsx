import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import Modal from '../components/Modal';

export default function FundingSchemes() {
  const { fundingSchemes, addFundingScheme, updateFundingScheme, deleteFundingScheme } = useData();
  const { isSuperAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editScheme, setEditScheme] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    name: '',
    provider: '',
    totalAmount: '',
    description: '',
    eligibility: '',
    deadline: '',
    status: 'Open',
  });

  const filtered = fundingSchemes.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setForm({ name: '', provider: '', totalAmount: '', description: '', eligibility: '', deadline: '', status: 'Open' });
  };

  const handleEdit = (scheme) => {
    setEditScheme(scheme.id);
    setForm({
      name: scheme.name,
      provider: scheme.provider,
      totalAmount: scheme.totalAmount || '',
      description: scheme.description || '',
      eligibility: scheme.eligibility || '',
      deadline: scheme.deadline || '',
      status: scheme.status || 'Open',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    const data = {
      ...form,
      totalAmount: parseFloat(form.totalAmount) || 0,
    };
    if (editScheme) {
      updateFundingScheme(editScheme, data);
    } else {
      addFundingScheme({
        ...data,
        id: 'fs' + Date.now(),
      });
    }
    setShowForm(false);
    setEditScheme(null);
    resetForm();
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">Funding Schemes</h1>
        {isSuperAdmin && (
          <button className="btn btn--primary" onClick={() => { resetForm(); setEditScheme(null); setShowForm(true); }}>
            + Add Scheme
          </button>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search funding schemes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="schemes-grid">
        {filtered.length === 0 && <p className="empty-text">{search ? 'No matches found' : 'No funding schemes'}</p>}
        {filtered.map((scheme) => (
          <div key={scheme.id} className="scheme-card">
            <div className="scheme-card-header">
              <h3>{scheme.name}</h3>
              <span className={`status-badge status-badge--small ${scheme.status === 'Open' ? 'status-badge--approved' : 'status-badge--rejected'}`}>
                {scheme.status}
              </span>
            </div>
            <p className="scheme-provider">{scheme.provider}</p>
            <p className="scheme-desc">{scheme.description}</p>
            <div className="scheme-details">
              <div className="scheme-detail">
                <label>Total Amount</label>
                <span>{formatCurrency(scheme.totalAmount)}</span>
              </div>
              <div className="scheme-detail">
                <label>Eligibility</label>
                <span>{scheme.eligibility}</span>
              </div>
              <div className="scheme-detail">
                <label>Deadline</label>
                <span>{scheme.deadline || 'N/A'}</span>
              </div>
            </div>
            {isSuperAdmin && (
              <div className="scheme-actions">
                <button className="btn btn--small btn--outline" onClick={() => handleEdit(scheme)}>Edit</button>
                <button className="btn btn--small btn--danger" onClick={() => setDeleteConfirm(scheme.id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditScheme(null); }} title={editScheme ? 'Edit Scheme' : 'Add Scheme'}>
        <div className="form">
          <div className="form-group">
            <label>Scheme Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Provider *</label>
            <input required value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Total Amount (HKD)</label>
            <input type="number" min="0" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Eligibility Criteria</label>
            <textarea rows="2" value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Deadline</label>
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => { setShowForm(false); setEditScheme(null); }}>Cancel</button>
            <button className="btn btn--primary" onClick={handleSave} disabled={!form.name.trim() || !form.provider.trim()}>
              {editScheme ? 'Update' : 'Add'} Scheme
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <p>Delete this funding scheme?</p>
        <div className="modal-actions">
          <button className="btn btn--outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn--danger" onClick={() => { deleteFundingScheme(deleteConfirm); setDeleteConfirm(null); }}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}