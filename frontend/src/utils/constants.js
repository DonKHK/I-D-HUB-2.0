export const ROLES = {
  GUEST: 'guest',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superadmin',
  PROJECT_USER: 'project_user',
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
  { key: 'settings', label: 'Settings', icon: '⚙️', roles: ['superadmin'] },
  { key: 'alerts', label: 'Alerts', icon: '⚠️', roles: ['admin', 'superadmin'] },
  { key: 'report-export', label: 'Report Export', icon: '📄', roles: ['superadmin'] },
];

// For PROJECT_USER - only can see their own project
export const SIDEBAR_ITEMS_PROJECT_USER = [
  { key: 'my-project', label: 'My Project', icon: '📁', roles: ['project_user'] },
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
  alertCriticalColor: '#ef4444',
  alertWarningColor: '#eab308',
  alertSuccessColor: '#22c55e',
  alertCompletedColor: '#3b82f6',
};

