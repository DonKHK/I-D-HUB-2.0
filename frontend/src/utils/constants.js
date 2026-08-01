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

export const DEFAULT_AI_PROMPT = `Please act as a professional innovation project evaluation consultant. Analyze the following Innovation Idea comprehensively and produce a report suitable for submission to the company's Innovation Committee for approval.

1. Executive Summary
Use 3-5 sentences to clearly explain the problem this idea solves, its core value, and target users.

2. Scorecard Overview
Score each dimension from 1-10 with a brief justification:
- Market demand and pain-point clarity
- Technical feasibility
- Commercial value and return potential
- Alignment with the company's existing business/strategy
- Execution difficulty and risk
- Degree of innovation
- Overall recommended score (weighted)

3. Detailed Analysis
- Problem & opportunity analysis
- Solution assessment (strengths, weaknesses, differentiation)
- Target market & competitive landscape
- Technology roadmap & feasibility
- Business model & potential revenue
- Required resources (people, funding, time, external partners)
- Key risks & mitigation recommendations

4. AI Recommendations for this Idea
- Provide specific, actionable optimization suggestions (product direction, technology roadmap, business model, go-to-market strategy, etc.)
- Highlight areas that can be strengthened or supplemented
- Suggest valuable extension directions that may have been overlooked

5. Appendices (Optional)
- Recommend what additional materials or data the committee should request for further decision-making.

Write in a professional, objective, concise tone suitable for reading by a Hong Kong corporate internal committee. Use English.`;

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
  aiPrompt: DEFAULT_AI_PROMPT,
  alertCriticalColor: '#ef4444',
  alertWarningColor: '#eab308',
  alertSuccessColor: '#22c55e',
  alertCompletedColor: '#3b82f6',
};

