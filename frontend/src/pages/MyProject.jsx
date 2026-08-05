import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import ProjectDetail from '../components/ProjectDetail';
import { addProjectLog } from '../utils/helpers';

export default function MyProject() {
  const navigate = useNavigate();
  const { user, userProjectId } = useAuth();
  const { projects, updateProject } = useData();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Refresh key for activity log
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (userProjectId) {
      const p = projects.find((pr) => pr.id === userProjectId);
      if (p) {
        setProject(p);
        setEditForm({
          name: p.name || '',
          description: p.description || '',
          detailContent: p.detailContent || '',
          startDate: p.startDate || '',
          endDate: p.endDate || '',
          budget: p.budget || '',
          budgetUsed: p.budgetUsed || '',
          manager: p.manager || '',
          holder: p.holder || '',
          background: p.background || '',
          painPoint: p.painPoint || '',
          benefits: p.benefits || '',
          deliverables: p.deliverables || '',
          status: p.status || 'Planning',
        });
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userProjectId, projects, refreshKey]);

  const handleEdit = () => {
    if (!project) return;
    setEditForm({
      name: project.name || '',
      description: project.description || '',
      detailContent: project.detailContent || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      budget: project.budget || '',
      budgetUsed: project.budgetUsed || '',
      manager: project.manager || '',
      holder: project.holder || '',
      background: project.background || '',
      painPoint: project.painPoint || '',
      benefits: project.benefits || '',
      deliverables: project.deliverables || '',
      status: project.status || 'Planning',
    });
    setEditMode(true);
  };

  const handleSave = () => {
    if (!project) return;
    const changedFields = [];
    if (editForm.name !== project.name) changedFields.push(`name: "${project.name}" → "${editForm.name}"`);
    if (editForm.status !== project.status) changedFields.push(`status: ${project.status} → ${editForm.status}`);
    if (editForm.description !== (project.description || '')) changedFields.push('description updated');
    if (editForm.startDate !== (project.startDate || '')) changedFields.push(`startDate: ${project.startDate || '-'} → ${editForm.startDate || '-'}`);
    if (editForm.endDate !== (project.endDate || '')) changedFields.push(`endDate: ${project.endDate || '-'} → ${editForm.endDate || '-'}`);

    updateProject(project.id, editForm);
    if (changedFields.length > 0) {
      addProjectLog(project, 'Project Edited', `Updated: ${changedFields.join('; ')}`, user, updateProject);
    }
    setEditMode(false);
    setRefreshKey((k) => k + 1);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="page">
        <p>Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page">
        <h2>My Project</h2>
        <p>No project found for your account. Please contact the system administrator.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>{project.name || 'My Project'}</h2>
        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: user?.projectRole === 'owner' ? '#eef2ff' : '#ecfdf5',
            color: user?.projectRole === 'owner' ? '#4f46e5' : '#059669',
            border: `1px solid ${user?.projectRole === 'owner' ? '#c7d2fe' : '#a7f3d0'}`,
          }}
        >
          {user?.projectRole === 'owner' ? '👤 Owner' : '👨‍💼 PM'}
        </span>
      </div>
      <ProjectDetail
        project={project}
        onBack={() => navigate('/dashboard')}
        onNavigate={() => {}}
        isProjectUser={true}
        canEdit={false}
        editMode={editMode}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        editForm={editForm}
        onEditFormChange={handleEditFormChange}
      />
    </div>
  );
}