import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_VERSION, SIDEBAR_ITEMS, SIDEBAR_ITEMS_PROJECT_USER } from '../utils/constants';

export default function Sidebar({ activePage, onNavigate }) {
  const { user, hasPermission, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('idhub_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('idhub_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  const isProjectUser = user?.role === 'project_user';
  const itemsSource = isProjectUser ? SIDEBAR_ITEMS_PROJECT_USER : SIDEBAR_ITEMS;
  const visibleItems = itemsSource.filter((item) => hasPermission(item.roles));

  const handleNav = (key) => {
    if (onNavigate) onNavigate(key);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <img className="sidebar__logo-icon" src="/AAI_logo.jpg" alt="AAI Logo" />
          {!collapsed && <span className="sidebar__logo-text">I&D Hub</span>}
        </div>
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="sidebar__nav">
        {visibleItems.map((item) => (
          <button
            key={item.key}
            className={`sidebar__item ${activePage === item.key ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav(item.key)}
            title={collapsed ? item.label : ''}
          >
            <span className="sidebar__item-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar__item-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <span className="sidebar__user-icon">👤</span>
          {!collapsed && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.displayName || 'User'}</span>
              <span className="sidebar__user-role">{user?.role || ''}</span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button className="sidebar__logout" onClick={logout}>
            Logout
          </button>
        )}
        {!collapsed && (
          <div className="sidebar__footer-info">
            <div className="sidebar__dev-text">© {new Date().getFullYear()} I.D.E.A.S. HUB V{APP_VERSION}</div>
            <div className="sidebar__dev-text">Powered by I.T. Department</div>
          </div>
        )}
      </div>
    </aside>
  );
}