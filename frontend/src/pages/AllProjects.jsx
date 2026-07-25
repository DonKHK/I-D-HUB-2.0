import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function AllProjects({ onNavigate }) {
  const { projects } = useData();
  const { isAuthenticated, logout } = useAuth();

  const handleBackToLogin = () => {
    if (window.confirm('确定要返回登录页面吗？')) {
      logout();
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Completed') return 'all-projects-status--completed';
    if (status === 'In Progress') return 'all-projects-status--progress';
    return 'all-projects-status--planning';
  };

  const getStatusLabel = (status) => {
    if (status === 'Completed') return '已完成';
    if (status === 'In Progress') return '进行中';
    return '规划中';
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
        <h2 className="section-title">项目总汇</h2>
        {!isAuthenticated && (
          <button onClick={handleBackToLogin} className="all-projects-back-btn">
            ← 返回登录页
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="all-projects-info-box">
        <p>以下为截至今日，本公司所有待开发 / 开发中 / 已完成之项目。</p>
        <p>如您对当中任何 project 有兴趣或想了解更多详情，欢迎联络我们部门：</p>
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
            暂无任何项目资料
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
              <span className="proj-card-id">{p.id}</span>
            </div>
            <h3 className="proj-card-name">{p.name || '未命名项目'}</h3>
            <p className="proj-card-desc">{p.description || '无描述'}</p>
            <p className="proj-card-detail">{p.detail || p.detailContent || '无详细内容'}</p>
            <div className="proj-card-owner">
              <span className="proj-card-owner-label">持有人：</span>
              {p.owner || p.holder || '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}