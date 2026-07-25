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
 * Returns: 'healthy' | 'warning' | 'critical'
 */
export function calculateHealth(project) {
  const today = new Date();
  let score = 0;
  let reasons = [];

  // Check end date
  if (project.endDate) {
    const end = new Date(project.endDate);
    const daysDiff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) {
      score -= 2;
      reasons.push(`Overdue by ${Math.abs(daysDiff)} days`);
    } else if (daysDiff <= 14) {
      score -= 1;
      reasons.push(`Due within ${daysDiff} days`);
    }
  } else {
    score -= 1;
    reasons.push('No end date set');
  }

  // Check budget
  if (project.budget && project.budget > 0) {
    const used = project.budgetUsed || 0;
    const ratio = used / project.budget;
    if (ratio > 0.9) {
      score -= 2;
      reasons.push(`Budget ${Math.round(ratio * 100)}% used`);
    } else if (ratio > 0.75) {
      score -= 1;
      reasons.push(`Budget ${Math.round(ratio * 100)}% used`);
    }
  } else if (project.budget === 0 || project.budget === undefined) {
    score -= 1;
    reasons.push('No budget set');
  }

  // Check start date
  if (project.startDate && project.status !== 'Completed') {
    const start = new Date(project.startDate);
    if (today < start) {
      // Not yet started, ok
    }
  }

  if (score >= 0) return { status: 'healthy', label: 'Healthy', color: '#22c55e', reasons };
  if (score >= -1) return { status: 'warning', label: 'Warning', color: '#eab308', reasons };
  return { status: 'critical', label: 'Critical', color: '#ef4444', reasons };
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