// Business Plan guided questions + AI prompt builder
// Used by the More Features → Business Plan tool.

export const BUSINESS_PLAN_QUESTIONS = [
  // ── Company & Team ──
  { id: 'companyName', section: 'Company & Team', label: 'What is your company / department name?', placeholder: 'e.g. AAI – Innovation & Development Department' },
  { id: 'team', section: 'Company & Team', label: 'Who are the key people / team members and their roles?', placeholder: 'e.g. John (Project Lead), Mary (Finance), Alex (Tech)...' },
  { id: 'companyBackground', section: 'Company & Team', label: 'Briefly describe your company background and experience.', placeholder: 'e.g. Established in 2010, focused on construction technology...' },

  // ── Product / Service ──
  { id: 'productService', section: 'Product / Service', label: 'What product or service are you offering?', placeholder: 'e.g. An AI-powered PPE compliance monitoring system...' },
  { id: 'problemSolved', section: 'Product / Service', label: 'What problem does it solve?', placeholder: 'e.g. Manual safety inspections are slow and inconsistent...' },
  { id: 'features', section: 'Product / Service', label: 'What are the key features and benefits?', placeholder: 'e.g. Real-time detection, automated reports, 60% fewer violations...' },

  // ── Target Market ──
  { id: 'targetCustomers', section: 'Target Market', label: 'Who are your target customers?', placeholder: 'e.g. Construction sites, property developers, government bodies...' },
  { id: 'marketSize', section: 'Target Market', label: 'What is the market size / opportunity?', placeholder: 'e.g. HK has 300+ active construction sites...' },
  { id: 'competitors', section: 'Target Market', label: 'Who are your main competitors and what is your competitive advantage?', placeholder: 'e.g. Company X, Company Y; our edge is local training data...' },

  // ── Business Model ──
  { id: 'revenueModel', section: 'Business Model', label: 'How will you make money? (revenue sources)', placeholder: 'e.g. Software subscription + hardware sales + maintenance...' },
  { id: 'pricing', section: 'Business Model', label: 'What is your pricing strategy?', placeholder: 'e.g. HK$ 20,000 per site per year...' },
  { id: 'keyCosts', section: 'Business Model', label: 'What are the key costs involved?', placeholder: 'e.g. Hardware, cloud compute, staffing, marketing...' },

  // ── Marketing & Sales ──
  { id: 'channels', section: 'Marketing & Sales', label: 'How will you reach your customers? (channels)', placeholder: 'e.g. Industry exhibitions, direct sales, government tenders...' },
  { id: 'marketingPlan', section: 'Marketing & Sales', label: 'What is your marketing plan?', placeholder: 'e.g. Launch event, case-study white paper, partnerships...' },
  { id: 'salesTargets', section: 'Marketing & Sales', label: 'What are your sales targets for the first year?', placeholder: 'e.g. 10 customers, HK$ 1.5M revenue...' },

  // ── Operations & Team ──
  { id: 'resources', section: 'Operations & Team', label: 'What resources / equipment do you need?', placeholder: 'e.g. Cameras, servers, office space, 3 engineers...' },
  { id: 'timeline', section: 'Operations & Team', label: 'What are the key operational steps and timeline?', placeholder: 'e.g. Phase 1 (3 months): prototype; Phase 2 (6 months): pilot...' },

  // ── Financial Plan ──
  { id: 'fundingNeeded', section: 'Financial Plan', label: 'How much funding do you need?', placeholder: 'e.g. HK$ 500,000 seed funding...' },
  { id: 'fundsUsage', section: 'Financial Plan', label: 'How will the funds be used?', placeholder: 'e.g. 40% R&D, 30% marketing, 20% staffing, 10% contingency...' },
  { id: 'financialProjection', section: 'Financial Plan', label: 'What are your revenue / cost projections for the next 1–3 years?', placeholder: 'e.g. Y1 revenue 1.5M / cost 1.2M; Y2 3M / 2M; Y3 5M / 3M...' },

  // ── Risks ──
  { id: 'risks', section: 'Risks', label: 'What are the main risks?', placeholder: 'e.g. Technology failure, market competition, regulatory changes...' },
  { id: 'riskMitigation', section: 'Risks', label: 'How will you mitigate these risks?', placeholder: 'e.g. Contingency budget, pilot testing, legal review...' },
];

export const BUSINESS_PLAN_PROMPT = `You are a professional business plan consultant. Based on the answers below provided by the user, generate a complete, professional business plan.

IMPORTANT OUTPUT RULES:
- Write ENTIRELY in English.
- Do NOT output JSON, XML or any structured data format. Do NOT use code fences. Do NOT include reasoning or chain-of-thought — output only the final plan.
- Write plain prose with clear section headings (e.g. "## 1. Executive Summary").
- If an answer is missing, never leave a section empty — make a reasonable, clearly-labelled assumption and mark it as "Assumption — please verify".

Required sections:
1. Executive Summary
2. Company Description
3. Product / Service
4. Market Analysis (market size, target customers, competition)
5. Business Model
6. Marketing & Sales Strategy
7. Operations & Implementation Plan
8. Financial Plan
9. Risks & Mitigation
10. Next Steps (a concrete 90-day action plan with specific actions, owners and timeframes)

User's answers:
`;

export function buildBusinessPlanPrompt(answers, customPrompt = '') {
  const prompt = (customPrompt && customPrompt.trim()) || BUSINESS_PLAN_PROMPT;
  const lines = BUSINESS_PLAN_QUESTIONS.map((q, i) => {
    const ans = (answers[q.id] || '').trim();
    return `${i + 1}. ${q.label}\n${ans || '(No answer)'}`;
  });
  return prompt + '\n' + lines.join('\n\n') + '\n';
}
