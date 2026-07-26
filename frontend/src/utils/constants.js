export const ROLES = {
  GUEST: 'guest',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superadmin',
};

export const STATUS = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
};

export const PHASE_TYPES = [
  'Idea / R&D',
  'Feasibility',
  'POC',
  'Demo',
  'Pilot',
  'Commercialization',
  'Production',
];

export const PHASE_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
};

export const IDEA_TYPES = [
  'New Technology',
  'Process Improvement',
  'Cost Saving',
  'Safety Enhancement',
  'Quality Improvement',
  'Digital Transformation',
];

export const SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'superadmin'] },
  { key: 'all-projects', label: 'All Projects', icon: '📋', roles: ['guest', 'admin', 'superadmin'] },
  { key: 'my-projects', label: 'My Projects', icon: '📁', roles: ['admin', 'superadmin'] },
  { key: 'pending-approval', label: 'Pending Approval', icon: '⏳', roles: ['admin', 'superadmin'] },
  { key: 'approved-projects', label: 'Approved Projects', icon: '✅', roles: ['admin', 'superadmin'] },
  { key: 'idea-submission', label: 'Submit Idea', icon: '💡', roles: ['guest', 'admin', 'superadmin'] },
  { key: 'funding-schemes', label: 'Funding Schemes', icon: '💰', roles: ['guest', 'admin', 'superadmin'] },
  { key: 'settings', label: 'Settings', icon: '⚙️', roles: ['admin', 'superadmin'] },
  { key: 'alerts', label: 'Alerts', icon: '⚠️', roles: ['admin', 'superadmin'] },
  { key: 'report-export', label: 'Report Export', icon: '📄', roles: ['admin', 'superadmin'] },
];

export const DEFAULT_SETTINGS = {
  overdueWarningDays: 7,
  overdueCriticalDays: 0,
  budgetWarningPercent: 80,
  budgetCriticalPercent: 100,
  emailEnabled: false,
  emailRecipients: '',
  emailOnOverdue: true,
  emailOnBudgetExceeded: true,
  emailFrequency: 'daily',
  healthWeightDate: 1,
  healthWeightBudget: 1,
  alertCriticalColor: '#ef4444',
  alertWarningColor: '#eab308',
  alertInfoColor: '#3b82f6',
};

export const SIDEBAR_BOTTOM = [
  { key: 'sync', label: 'Sync Latest Data', icon: '🔄', roles: ['admin', 'superadmin'] },
  { key: 'backup', label: 'Full System Backup', icon: '💾', roles: ['superadmin'] },
  { key: 'restore', label: 'Restore Backup', icon: '📥', roles: ['superadmin'] },
];