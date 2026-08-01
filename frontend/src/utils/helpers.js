/**
 * Generate Project ID: YYMM + 4 digit serial
 */
export function generateProjectId(existingIds = []) {
  const now = new Date();
  const prefix = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  let serial = 1;
  const existing = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(4), 10))
    .filter((n) => !isNaN(n));
  if (existing.length > 0) {
    serial = Math.max(...existing) + 1;
  }
  return `${prefix}${String(serial).padStart(4, '0')}`;
}

/**
 * Generate Idea ID: IDEA- + 6 digit serial
 */
export function generateIdeaId(existingIds = []) {
  let serial = 1;
  const existing = existingIds
    .map((id) => parseInt(id.replace('IDEA-', ''), 10))
    .filter((n) => !isNaN(n));
  if (existing.length > 0) {
    serial = Math.max(...existing) + 1;
  }
  return `IDEA-${String(serial).padStart(6, '0')}`;
}

/**
 * Calculate health status of a project
 * Returns: 'completed' | 'critical' | 'warning' | 'healthy'
 *
 * Priority: Completed (blue) > Red conditions > Yellow conditions > Green (On Track)
 * - Completed: project status === 'Completed'
 * - Red: No End Date / No Budget / Overdue / Budget Overrun (>= 105%)
 * - Yellow: Due within 14 days / Budget close to limit (> 95%)
 * - Green: everything else
 *
 * Colors come from settings (optional) so users can customize them.
 */
export function calculateHealth(project, settings = {}) {
  const today = new Date();

  // Completed projects are always blue
  if (project.status === 'Completed') {
    return { status: 'completed', label: '🔵 Completed', color: settings.alertCompletedColor || '#3b82f6', reasons: [] };
  }

  const redReasons = [];
  const yellowReasons = [];

  // End date checks
  if (!project.endDate) {
    redReasons.push('No End Date');
  } else {
    const end = new Date(project.endDate);
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      redReasons.push('Overdue');
    } else if (diffDays <= 14) {
      yellowReasons.push(`Due within ${diffDays} days`);
    }
  }

  // Budget checks
  if (!project.budget || project.budget <= 0) {
    redReasons.push('No Budget');
  } else {
    const used = project.budgetUsed || 0;
    const ratio = used / project.budget;
    if (ratio >= 1.05) {
      redReasons.push('Budget Overrun');
    } else if (ratio > 0.95) {
      yellowReasons.push('Budget Close to Limit');
    }
  }

  const allReasons = [...redReasons, ...yellowReasons];

  if (redReasons.length > 0) {
    return { status: 'critical', label: `🔴 ${allReasons.join(', ')}`, color: settings.alertCriticalColor || '#ef4444', reasons: allReasons };
  }
  if (yellowReasons.length > 0) {
    return { status: 'warning', label: `🟡 ${allReasons.join(', ')}`, color: settings.alertWarningColor || '#eab308', reasons: allReasons };
  }
  return { status: 'healthy', label: '🟢 On Track', color: settings.alertSuccessColor || '#22c55e', reasons: [] };
}

/**
 * Calculate health for an Idea (based on dates)
 */
export function calculateIdeaHealth(idea) {
  const today = new Date();
  const created = new Date(idea.createdAt || Date.now());
  const daysSinceCreation = Math.ceil((today - created) / (1000 * 60 * 60 * 24));
  if (daysSinceCreation > 30) {
    return { status: 'critical', label: 'Stale', color: '#ef4444' };
  }
  if (daysSinceCreation > 14) {
    return { status: 'warning', label: 'Aging', color: '#eab308' };
  }
  return { status: 'healthy', label: 'New', color: '#22c55e' };
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-CA');
}

/**
 * Format date to YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString('en-CA');
  const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${datePart} ${timePart}`;
}

/**
 * Format currency in HKD
 */
export function formatCurrency(amount) {
  if (!amount && amount !== 0) return '-';
  return `HK$ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

/**
 * Get days until end date
 */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const end = new Date(dateStr);
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
}

/**
 * Add a log entry to a project's activity log.
 * Logs are stored in project.logs array in Firestore.
 */
export function addProjectLog(project, action, details, user, updateProject) {
  const newLog = {
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    action,
    details,
    user: user?.displayName || user?.email || 'Unknown',
  };
  const updatedLogs = [...(project.logs || []), newLog];
  updateProject(project.id, { logs: updatedLogs });
  return updatedLogs;
}

/**
 * Format a log entry for TXT export
 */
export function formatLogForExport(log) {
  const ts = formatDateTime(log.timestamp);
  return `[${ts}] ${log.user} - ${log.action}\n  ${log.details}\n`;
}

/**
 * Generate a TXT blob from an array of log entries and trigger a download
 */
export function exportLogsToTxt(project) {
  if (!project || !project.logs || project.logs.length === 0) return;
  
  const lines = [
    `=== Activity Log: ${project.name} (ID: ${project.id}) ===`,
    `Export Date: ${formatDateTime(new Date().toISOString())}`,
    `Total Entries: ${project.logs.length}`,
    '',
    project.logs
      .slice()
      .reverse()
      .map((log) => formatLogForExport(log))
      .join(''),
    '=== End of Log ===',
  ];
  
  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `log-${project.id}-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
