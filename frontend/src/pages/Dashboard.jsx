import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { calculateHealth, formatCurrency, daysUntil, calculateIdeaHealth } from '../utils/helpers';
import Chart from 'chart.js/auto';
import AIAssistant from './AIAssistant';

import { readField } from '../utils/fields';

/**
 * Chart.js inline plugin — prints the count of every slice just outside the
 * doughnut, with a short leader line in the slice colour. Counts only (no %),
 * zero-value slices are skipped, and the text is aligned to the left/right half
 * of the ring so neighbouring labels never overlap.
 */
const doughnutCountLabels = {
  id: 'doughnutCountLabels',
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data?.datasets?.[0];
    if (!meta || !dataset) return;

    const values = (dataset.data || []).map((v) => Number(v) || 0);
    if (values.every((v) => v === 0)) return;

    const colors = dataset.backgroundColor || [];
    const { ctx } = chart;
    ctx.save();
    ctx.font = '700 13px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';

    meta.data.forEach((arc, i) => {
      const value = values[i];
      if (!value) return;

      const { startAngle, endAngle, outerRadius, x: cx, y: cy } = arc;
      // Slices hidden via the legend collapse to a zero span — skip those too
      if (Math.abs(endAngle - startAngle) < 0.01) return;

      const mid = (startAngle + endAngle) / 2;
      const isRightHalf = Math.cos(mid) >= 0;
      const color = (Array.isArray(colors) ? colors[i] : colors) || '#94a3b8';

      // Leader line from the ring edge outwards
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(mid) * (outerRadius + 2), cy + Math.sin(mid) * (outerRadius + 2));
      ctx.lineTo(cx + Math.cos(mid) * (outerRadius + 12), cy + Math.sin(mid) * (outerRadius + 12));
      ctx.stroke();

      // The count itself
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#334155';
      ctx.textAlign = isRightHalf ? 'left' : 'right';
      ctx.fillText(String(value), cx + Math.cos(mid) * (outerRadius + 15), cy + Math.sin(mid) * (outerRadius + 15));
    });

    ctx.restore();
  },
};

export default function Dashboard() {
  const { projects, ideas, settings } = useData();
  const { isAdmin, isSuperAdmin } = useAuth();
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
      const endDate = readField(p, 'targetCompletionDate');
      if (endDate && p.status !== 'Completed') {
        const days = daysUntil(endDate);
        if (days !== null) {
          items.push({
            id: p.id,
            name: readField(p, 'title'),
            days,
            status: days < 0 ? 'Overdue' : days <= 14 ? 'Due Soon' : 'On Track',
            color: days < 0 ? '#ef4444' : days <= 14 ? '#FF7D00' : '#00B42A',
          });
        }
      }
    });
    items.sort((a, b) => a.days - b.days);
    return items;
  }, [projects]);

  // === Recent Ideas ===
  const recentIdeas = useMemo(() => {
    const active = ideas.filter((i) => i.status !== 'deleted');
    const sorted = [...active].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return showAllIdeas ? sorted : sorted.slice(0, 4);
  }, [ideas, showAllIdeas]);

  // === Chart.js Doughnut ===
  // Create the chart ONCE on mount. Later data changes only update the existing
  // chart in place (animation disabled) so it never flickers / looks like it is
  // re-loading.
  const chartDataKeyRef = useRef('');

  useEffect(() => {
    if (!healthChartRef.current) return;
    chartInstance.current = new Chart(healthChartRef.current, {
      type: 'doughnut',
      plugins: [doughnutCountLabels],
      data: {
        labels: ['Completed', 'Healthy', 'Warning', 'Critical'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ['#3b82f6', '#22c55e', '#eab308', '#ef4444'],
          borderWidth: 6,
          borderColor: '#fff',
        }],
      },
      options: {
        cutout: '55%',
        // Leaves room on all sides for the counts drawn outside the ring
        layout: { padding: { top: 12, right: 18, bottom: 4, left: 18 } },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              boxWidth: 10,
              // Legend items carry the count too, e.g. "Healthy (12)"
              generateLabels: (chart) => {
                const labels = chart.data?.labels || [];
                const dataset = chart.data?.datasets?.[0] || {};
                const values = dataset.data || [];
                const fill = dataset.backgroundColor;
                const meta = chart.getDatasetMeta(0);
                return labels.map((label, i) => {
                  const color = Array.isArray(fill) ? fill[i] : fill;
                  return {
                    text: `${label} (${Number(values[i]) || 0})`,
                    fillStyle: color,
                    strokeStyle: color,
                    lineWidth: 0,
                    pointStyle: 'circle',
                    hidden: meta?.data?.[i] ? !meta.data[i].visible : false,
                    index: i,
                  };
                });
              },
            },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
      },
    });
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync live data into the chart in place — never destroy/recreate.
  useEffect(() => {
    const chart = chartInstance.current;
    if (!chart) return;
    const counts = [
      healthDistribution.completed,
      healthDistribution.healthy,
      healthDistribution.warning,
      healthDistribution.critical,
    ];
    const colors = [
      settings.alertCompletedColor || '#3b82f6',
      settings.alertSuccessColor || '#22c55e',
      settings.alertWarningColor || '#eab308',
      settings.alertCriticalColor || '#ef4444',
    ];
    const key = `${counts.join(',')}|${colors.join(',')}`;
    if (key === chartDataKeyRef.current) return; // nothing changed → skip redraw
    chartDataKeyRef.current = key;
    chart.data.datasets[0].data = counts;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update('none');
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
          <p className="dashboard-subtitle">Innovation & Development · v2.0</p>
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

      {/* AI Assistant (admin / superadmin only) */}
      {(isAdmin || isSuperAdmin) && <AIAssistant />}

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
                <p className="idea-card-ref-desc">{idea.projectScope || idea.background || 'No description'}</p>
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