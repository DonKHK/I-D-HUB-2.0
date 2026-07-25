import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { calculateHealth, daysUntil, formatDate } from '../utils/helpers';

export default function Alerts({ onNavigate }) {
  const { projects } = useData();
  const [filter, setFilter] = useState('all');

  const alerts = useMemo(() => {
    const result = [];

    projects.forEach((project) => {
      const health = calculateHealth(project);
      const daysLeft = project.endDate ? daysUntil(project.endDate) : null;

      // Overdue
      if (daysLeft !== null && daysLeft < 0) {
        result.push({
          id: `overdue-${project.id}`,
          projectId: project.id,
          type: 'overdue',
          severity: 'critical',
          message: `Project "${project.name}" is overdue by ${Math.abs(daysLeft)} day(s)`,
          date: project.endDate,
        });
      }

      // Due soon
      if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 14) {
        result.push({
          id: `due-${project.id}`,
          projectId: project.id,
          type: 'due_soon',
          severity: 'warning',
          message: `Project "${project.name}" is due in ${daysLeft} day(s)`,
          date: project.endDate,
        });
      }

      // Budget overspent
      if (project.budget > 0 && project.budgetUsed > project.budget) {
        result.push({
          id: `budget-${project.id}`,
          projectId: project.id,
          type: 'budget',
          severity: 'critical',
          message: `Project "${project.name}" has exceeded its budget (${Math.round((project.budgetUsed / project.budget) * 100)}% used)`,
          date: null,
        });
      } else if (project.budget > 0 && project.budgetUsed > project.budget * 0.9) {
        result.push({
          id: `budget-warn-${project.id}`,
          projectId: project.id,
          type: 'budget',
          severity: 'warning',
          message: `Project "${project.name}" is using ${Math.round((project.budgetUsed / project.budget) * 100)}% of its budget`,
          date: null,
        });
      }

      // Health status
      if (health.level === 'low') {
        result.push({
          id: `health-${project.id}`,
          projectId: project.id,
          type: 'health',
          severity: 'warning',
          message: `Project "${project.name}" has low health score (${health.label})`,
          date: null,
        });
      }
    });

    // Sort by severity then date
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    result.sort((a, b) => {
      const sa = severityOrder[a.severity] || 99;
      const sb = severityOrder[b.severity] || 99;
      if (sa !== sb) return sa - sb;
      if (a.date && b.date) return new Date(a.date) - new Date(b.date);
      return 0;
    });

    return result;
  }, [projects]);

  const filtered = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter((a) => a.severity === filter);
  }, [alerts, filter]);

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">Alerts & Notifications</h1>
      </div>

      <div className="filter-tabs">
        {[
          { key: 'all', label: `All (${alerts.length})` },
          { key: 'critical', label: `Critical (${alerts.filter((a) => a.severity === 'critical').length})` },
          { key: 'warning', label: `Warnings (${alerts.filter((a) => a.severity === 'warning').length})` },
        ].map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? 'filter-tab--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="alerts-list">
        {filtered.length === 0 && <p className="empty-text">No alerts</p>}
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className={`alert-card alert-card--${alert.severity} ${alert.severity === 'critical' ? 'alert-card--pulse' : ''}`}
            onClick={() => onNavigate && onNavigate('project-detail', projects.find((p) => p.id === alert.projectId))}
            style={{ cursor: 'pointer' }}
          >
            <div className="alert-icon">
              {alert.severity === 'critical' ? '🔴' : '🟡'}
            </div>
            <div className="alert-content">
              <p className="alert-message">{alert.message}</p>
              <span className="alert-meta">
                {alert.type === 'overdue' && 'Overdue'}
                {alert.type === 'due_soon' && 'Due Soon'}
                {alert.type === 'budget' && 'Budget Alert'}
                {alert.type === 'health' && 'Health Alert'}
                {alert.date && ` • ${formatDate(alert.date)}`}
              </span>
            </div>
            <div className="alert-severity">
              <span className={`severity-badge severity-badge--${alert.severity}`}>
                {alert.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}