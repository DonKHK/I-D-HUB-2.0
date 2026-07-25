import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { calculateHealth, formatCurrency, daysUntil, calculateIdeaHealth } from '../utils/helpers';
import Chart from 'chart.js/auto';

export default function Dashboard({ onNavigate }) {
  const { projects, ideas } = useData();
  const { isAuthenticated } = useAuth();
  const [showAllIdeas, setShowAllIdeas] = useState(false);
  const healthChartRef = useRef(null);
  const chartInstance = useRef(null);

  // === KPI Stats ===
  const stats = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter((p) => p.status === 'In Progress').length;
    const planning = projects.filter((p) => p.status === 'Planning').length;
    const completed = projects.filter((p) => p.status === 'Completed').length;
    const healthStats = projects.map((p) => calculateHealth(p));
    const yellow = healthStats.filter((h) => h.status === 'warning').length;
    const red = healthStats.filter((h) => h.status === 'critical').length;
    return { total, inProgress, planning, completed, yellow, red };
  }, [projects]);

  // === Health Distribution ===
  const healthDistribution = useMemo(() => {
    const h = { healthy: 0, warning: 0, critical: 0 };
    projects.forEach((p) => {
      const health = calculateHealth(p);
      h[health.status] = (h[health.status] || 0) + 1;
    });
    return h;
  }, [projects]);

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
            status: days < 0 ? '已超期' : days <= 14 ? '即將到期' : '正常',
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
    const sorted = [...ideas].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
          labels: ['正常', '即將到期', '需注意'],
          datasets: [{
            data: [healthDistribution.healthy, healthDistribution.warning, healthDistribution.critical],
            backgroundColor: ['#00B42A', '#FF7D00', '#F53F3F'],
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
  }, [healthDistribution]);

  const kpiData = [
    { label: '總項目', value: stats.total, icon: 'fa-folder-open', color: '#165DFF' },
    { label: '進行中', value: stats.inProgress, icon: 'fa-spinner', color: '#3b82f6' },
    { label: '規劃中', value: stats.planning, icon: 'fa-calendar', color: '#d97706' },
    { label: '已完成', value: stats.completed, icon: 'fa-check-circle', color: '#059669' },
    { label: '即將到期', value: stats.yellow, icon: 'fa-exclamation-triangle', color: '#d97706' },
    { label: '需注意', value: stats.red, icon: 'fa-fire', color: '#dc2626' },
  ];

  return (
    <div className="dashboard-ref">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">I&D 項目管理系統</h1>
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
            <i className="fa fa-pie-chart" style={{ color: '#165DFF' }} /> 項目健康度分布
          </h3>
          <div className="chart-container">
            <canvas ref={healthChartRef} />
          </div>
        </div>

        {/* Upcoming Items */}
        <div className="dashboard-card-ref">
          <h3 className="dashboard-card-ref-title">即將到期 / 已超期項目</h3>
          <div className="upcoming-list-ref">
            {upcomingItems.length === 0 ? (
              <p className="empty-text">目前沒有即將到期的項目</p>
            ) : (
              upcomingItems.map((item) => (
                <div key={item.id} className="upcoming-item-ref">
                  <div className="health-dot-ref" style={{ backgroundColor: item.color }} />
                  <div className="upcoming-item-ref-info">
                    <div className="upcoming-item-ref-name">{item.name}</div>
                    <div className="upcoming-item-ref-meta">{item.id} · {item.status}</div>
                  </div>
                  <div className="upcoming-item-ref-days" style={{ color: item.color }}>
                    {item.days < 0 ? '已超期' : `${item.days}天`}
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
            <i className="fa fa-lightbulb-o" style={{ color: '#165DFF' }} /> 最近提交的 Idea
          </h3>
          {ideas.length > 4 && (
            <button className="btn-link-ref" onClick={() => setShowAllIdeas(!showAllIdeas)}>
              {showAllIdeas ? '收起' : '查看全部'} <i className="fa fa-arrow-right" />
            </button>
          )}
        </div>
        <div className="ideas-grid-ref">
          {recentIdeas.length === 0 && <p className="empty-text">暫無 Idea 申請</p>}
          {recentIdeas.map((idea) => {
            const health = calculateIdeaHealth(idea);
            return (
              <div key={idea.id} className="idea-card-ref">
                <div className="idea-card-ref-header">
                  <span className="idea-card-ref-id">{idea.id}</span>
                  <span className="idea-card-ref-date">{new Date(idea.createdAt).toLocaleDateString('zh-HK')}</span>
                </div>
                <h4 className="idea-card-ref-title">{idea.title || '未命名 Idea'}</h4>
                <p className="idea-card-ref-desc">{idea.oneLineDesc || idea.background || '無描述'}</p>
                <div className="idea-card-ref-footer">
                  <span className="health-dot-ref" style={{ backgroundColor: health.color }} />
                  <span className="idea-card-ref-status">{health.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      {isAuthenticated && (
        <div className="dashboard-actions-ref">
          <button className="btn-ref btn-ref--primary" onClick={() => onNavigate && onNavigate('idea-submission')}>
            <i className="fa fa-plus" /> 提交新 Idea
          </button>
          <button className="btn-ref btn-ref--outline" onClick={() => onNavigate && onNavigate('my-projects')}>
            <i className="fa fa-folder-open" /> 管理項目
          </button>
        </div>
      )}
    </div>
  );
}