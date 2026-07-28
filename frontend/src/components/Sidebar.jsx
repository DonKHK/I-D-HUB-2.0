import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SIDEBAR_ITEMS, SIDEBAR_BOTTOM } from '../utils/constants';

export default function Sidebar({ activePage, onNavigate, onSync, onBackup, onRestore }) {
  const { user, hasPermission, logout } = useAuth();
  const { syncFromRemote, backupAll } = useData();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('idhub_sidebar_collapsed') === 'true';
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('idhub_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  const visibleItems = SIDEBAR_ITEMS.filter((item) => hasPermission(item.roles));
  const visibleBottom = SIDEBAR_BOTTOM.filter((item) => hasPermission(item.roles));

  const handleNav = (key) => {
    if (key === 'sync') {
      handleSync();
      return;
    }
    if (key === 'backup') {
      handleBackup();
      return;
    }
    if (key === 'restore') {
      if (onRestore) onRestore();
      return;
    }
    if (onNavigate) onNavigate(key);
  };

  const handleSync = async () => {
    setSyncing(true);
    if (onSync) await onSync();
    else await syncFromRemote();
    setSyncing(false);
  };

  const handleBackup = () => {
    const data = backupAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idhub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onBackup) onBackup();
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

      <div className="sidebar__bottom">
        {visibleBottom.map((item) => (
          <button
            key={item.key}
            className={`sidebar__item ${item.key === 'sync' && syncing ? 'sidebar__item--syncing' : ''}`}
            onClick={() => handleNav(item.key)}
            title={collapsed ? item.label : ''}
            disabled={item.key === 'sync' && syncing}
          >
            <span className="sidebar__item-icon">
              {item.key === 'sync' && syncing ? '⏳' : item.icon}
            </span>
            {!collapsed && (
              <span className="sidebar__item-label">
                {item.key === 'sync' && syncing ? 'Syncing...' : item.label}
              </span>
            )}
          </button>
        ))}
      </div>

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
            <div className="sidebar__dev-text">© {new Date().getFullYear()} I.D.E.A.S. HUB 2.0</div>
            <div className="sidebar__dev-text">Powered by I.T. Department</div>
          </div>
        )}
      </div>
    </aside>
  );
}