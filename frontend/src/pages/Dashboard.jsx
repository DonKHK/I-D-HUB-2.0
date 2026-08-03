import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { calculateHealth, formatCurrency, daysUntil, calculateIdeaHealth } from '../utils/helpers';
import Chart from 'chart.js/auto';

export default function Dashboard() {
  const { projects, ideas, settings } = useData();
  const [showAllIdeas, setShowAllIdeas] = useState(false);
  const healthChartRef = useRef(null);
  const chartInstance = useRef(null);

  // === KPI Stats ===
  const stats = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter((p) => p.status === 'In Progress').length;
    const planning = projects.filter((p) => p.status === 'Planning').length;
    const completed = projects.filter((p) => p.status === 'Completed').length;
    const healthStats = projects.map((p) => calculateHealth(p, settings));
    const yellow = healthStats.filter((h) => h.status === 'warning').length;
    const red = healthStats.filter((h) => h.status === 'critical').length;
    return { total, inProgress, planning, completed, yellow, red };
  }, [projects, settings]);

  // === Health Distribution ===
  const healthDistribution = useMemo(() => {
    const h = { completed: 0, healthy: 0, warning: 0, critical: 0 };
    projects.forEach((p) => {
      const health = calculateHealth(p, settings);
      h[health.status] = (h[health.status] || 0) + 1;
    });
    return h;
  }, [projects, settings]);

  // === Upcoming Items ===
  const upcomingItems = useMemo(() => {
    const items = [];
    projects.forEach((p) => {
      if (p.endDate && p.status !== 'Completed') {
        const days = daysUntil(p.endDate);
        if (days !== null) {
          items.push({
            id: p.id,
            name: p.name,
            days,
            status: days < 0 ? 'Overdue' : days <= 14 ? 'Due Soon' : 'On Track',
            color: days < 0 ? '#ef4444' : days <= 14 ? '#FF7D00' : '#00B42A',
          });
        }
      }
    });
    items.sort((a, b) => a.days - b.days);
    return items.slice(0, 6);
  }, [projects]);

  // === Recent Ideas ===
  const recentIdeas = useMemo(() => {
    const active = ideas.filter((i) => i.status !== 'deleted');
    const sorted = [...active].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return showAllIdeas ? sorted : sorted.slice(0, 4);
  }, [ideas, showAllIdeas]);

  // === Chart.js Doughnut ===
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    if (healthChartRef.current) {
      chartInstance.current = new Chart(healthChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Healthy', 'Warning', 'Critical'],
          datasets: [{
            data: [healthDistribution.completed, healthDistribution.healthy, healthDistribution.warning, healthDistribution.critical],
            backgroundColor: [settings.alertCompletedColor || '#3b82f6', settings.alertSuccessColor || '#22c55e', settings.alertWarningColor || '#eab308', settings.alertCriticalColor || '#ef4444'],
            borderWidth: 6,
            borderColor: '#fff',
          }],
        },
        options: {
          cutout: '55%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } },
          },
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    }
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [healthDistribution, settings]);

  const kpiData = [
    { label: 'Total Projects', value: stats.total, icon: 'fa-folder-open', color: '#165DFF' },
    { label: 'In Progress', value: stats.inProgress, icon: 'fa-spinner', color: '#3b82f6' },
    { label: 'Planning', value: stats.planning, icon: 'fa-calendar', color: '#d97706' },
    { label: 'Completed', value: stats.completed, icon: 'fa-check-circle', color: '#059669' },
    { label: 'Due Soon', value: stats.yellow, icon: 'fa-exclamation-triangle', color: '#d97706' },
    { label: 'At Risk', value: stats.red, icon: 'fa-fire', color: '#dc2626' },
  ];

  return (
    <div className="dashboard-ref">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">I&D Project Management Hub</h1>
          <p className="dashboard-subtitle">Innovation & Development · v1.0</p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid-ref">
        {kpiData.map((k, i) => (
          <div key={i} className="kpi-card-ref">
            <div className="kpi-card-ref-body">
              <div>
                <p className="kpi-card-ref-label">{k.label}</p>
                <p className="kpi-card-ref-value">{k.value}</p>
              </div>
              <i className={`fa ${k.icon} kpi-card-ref-icon`} style={{ color: k.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Health Chart + Upcoming */}
      <div className="dashboard-grid">
        {/* Health Doughnut Chart */}
        <div className="dashboard-card-ref">
          <h3 className="dashboard-card-ref-title">
            <i className="fa fa-pie-chart" style={{ color: '#165DFF' }} /> Project Health Distribution
          </h3>
          <div className="chart-container">
            <canvas ref={healthChartRef} />
          </div>
        </div>

        {/* Upcoming Items */}
        <div className="dashboard-card-ref">
          <h3 className="dashboard-card-ref-title">Upcoming / Overdue Projects</h3>
          <div className="upcoming-list-ref">
            {upcomingItems.length === 0 ? (
              <p className="empty-text">No upcoming items</p>
            ) : (
              upcomingItems.map((item) => (
                <div key={item.id} className="upcoming-item-ref">
                  <div className="health-dot-ref" style={{ backgroundColor: item.color }} />
                  <div className="upcoming-item-ref-info">
                    <div className="upcoming-item-ref-name">{item.name}</div>
                    <div className="upcoming-item-ref-meta">{item.id} · {item.status}</div>
                  </div>
                  <div className="upcoming-item-ref-days" style={{ color: item.color }}>
                    {item.days < 0 ? 'Overdue' : `${item.days}d`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Ideas */}
      <div className="dashboard-card-ref">
        <div className="card-header-row">
          <h3 className="dashboard-card-ref-title">
            <i className="fa fa-lightbulb-o" style={{ color: '#165DFF' }} /> Recent Ideas
          </h3>
          {/* Only show View All if there are more than 4 active (non-deleted) ideas */}
          {ideas.filter((i) => i.status !== 'deleted').length > 4 && (
            <button className="btn-link-ref" onClick={() => setShowAllIdeas(!showAllIdeas)}>
              {showAllIdeas ? 'Collapse' : 'View All'} <i className="fa fa-arrow-right" />
            </button>
          )}
        </div>
        <div className="ideas-grid-ref">
          {recentIdeas.length === 0 && <p className="empty-text">No ideas submitted yet</p>}
          {recentIdeas.map((idea) => {
            const health = calculateIdeaHealth(idea);
            return (
              <div key={idea.id} className="idea-card-ref">
                <div className="idea-card-ref-header">
                  <span className="idea-card-ref-id">{idea.id}</span>
                <span className="idea-card-ref-date">{new Date(idea.createdAt).toLocaleDateString('en-US')}</span>
                </div>
                <h4 className="idea-card-ref-title">{idea.title || 'Untitled Idea'}</h4>
                <p className="idea-card-ref-desc">{idea.oneLineDesc || idea.background || 'No description'}</p>
                <div className="idea-card-ref-footer">
                  <span className="health-dot-ref" style={{ backgroundColor: health.color }} />
                  <span className="idea-card-ref-status">{health.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}