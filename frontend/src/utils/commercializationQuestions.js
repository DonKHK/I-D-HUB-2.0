// Commercialization Plan Questionnaire — sections, questions, branching and summary builder.
// Questions follow the approved spec (Sections A–G).

export const COMMERCIALIZATION_SECTIONS = [
  { id: 'A', title: 'Product Basic Info', icon: '📦' },
  { id: 'B', title: 'Current Alternatives & Quantified Advantages', icon: '⚖️' },
  { id: 'C', title: 'Commercialization Direction & Target Customers', icon: '🎯' },
  { id: 'D', title: 'Value & Competition', icon: '💎' },
  { id: 'E', title: 'Go-to-Market & Sales', icon: '📣' },
  { id: 'F', title: 'Cost, Pricing & Margin Calculation', icon: '💰' },
  { id: 'G', title: 'Execution Readiness', icon: '🚀' },
];

// True when a channel-type direction was selected in Q14
const hasChannelDirection = (a) => {
  const dirs = a.directions || [];
  return dirs.some((d) => ['channel', 'b2b2c', 'b2b2g'].includes(d));
};

export const COMMERCIALIZATION_QUESTIONS = [
  // ─── Section A: Product Basic Info ───
  {
    id: 'productTypes',
    section: 'A',
    type: 'multi',
    label: '1. What is the main type of your product? (select all that apply)',
    options: ['Hardware', 'Software', 'Hardware + Software', 'Service / Solution', 'Platform / SaaS', 'AI Model / Algorithm', 'Other (please specify)'],
    other: true,
    required: true,
  },
  {
    id: 'productDescription',
    section: 'A',
    type: 'textarea',
    label: '2. Please describe in 2-3 sentences: What does this product do and what core problem does it solve?',
    placeholder: 'e.g. Our AI camera system automatically detects PPE compliance in real time, solving the problem of slow and inconsistent manual safety inspections.',
    required: true,
  },
  {
    id: 'devStage',
    section: 'A',
    type: 'select',
    label: '3. Current development stage?',
    options: ['Concept', 'Prototype', 'Functional validation', 'Pilot production', 'Ready for mass production'],
    required: true,
  },
  {
    id: 'techAdvantage',
    section: 'A',
    type: 'textarea',
    label: '4. What is currently the biggest technical advantage?',
    placeholder: 'e.g. Proprietary detection algorithm trained on HK site conditions.',
  },
  {
    id: 'limitation',
    section: 'A',
    type: 'textarea',
    label: '5. What is currently the biggest limitation or unfinished part?',
    placeholder: 'e.g. Camera hardware not yet FCC/CE certified; battery life needs improvement.',
  },
  {
    id: 'patent',
    section: 'A',
    type: 'select',
    label: '6. Have you applied or planned to apply for patent / trademark?',
    options: ['Yes, applied', 'Planned', 'No, not yet', 'Not sure'],
  },

  // ─── Section B: Current Alternatives & Quantified Advantages ───
  {
    id: 'altMethods',
    section: 'B',
    type: 'textarea',
    label: '7. Before your product existed, what methods does the market mainly use to solve the same problem?',
    placeholder: 'e.g. Manual safety patrols by safety officers, paper checklists.',
  },
  {
    id: 'altCost',
    section: 'B',
    type: 'text',
    label: '8. Using the traditional method, how much does it cost per time / per project?',
    placeholder: 'e.g. HK$ 50,000 per project',
  },
  {
    id: 'altTime',
    section: 'B',
    type: 'text',
    label: '9. Using the traditional method, how long does it take to complete once?',
    placeholder: 'e.g. 2 days per inspection round',
  },
  {
    id: 'improvedAspects',
    section: 'B',
    type: 'multi',
    label: '10. After using your method, which aspects are significantly improved? (select all that apply)',
    options: ['Cheaper', 'Faster', 'Safer', 'Less manpower', 'Other'],
    other: true,
  },
  {
    id: 'cheaperBy',
    section: 'B',
    type: 'text',
    label: '11. How much cheaper can the cost be? (number or percentage)',
    placeholder: 'e.g. 60% cheaper',
  },
  {
    id: 'fasterBy',
    section: 'B',
    type: 'text',
    label: '12. How much faster can the processing time be? (number or percentage)',
    placeholder: 'e.g. 3× faster',
  },
  {
    id: 'basis',
    section: 'B',
    type: 'select',
    label: '13. Are the above quantified numbers based on actual tests, customer feedback, or estimates?',
    options: ['Actual tests', 'Customer feedback', 'Estimates', 'Mix of the above'],
  },
  // ─── Section C: Commercialization Direction & Target Customers ───
  {
    id: 'directions',
    section: 'C',
    type: 'multi',
    label: '14. Which commercialization direction do you think should be the priority? (select all that apply)',
    options: ['B2C', 'B2B', 'B2G', 'B2B2C', 'B2B2G', 'OEM / White Label', 'Channel / Distributor', 'Product-as-a-Service (PaaS)'],
    required: true,
  },
  {
    id: 'whyDirections',
    section: 'C',
    type: 'textarea',
    label: '15. Why do you choose this / these direction(s) as priority?',
    placeholder: 'e.g. B2G because government mandates safety compliance; quickest to scale.',
  },
  {
    id: 'deprioritized',
    section: 'C',
    type: 'textarea',
    label: '16. Are there any directions you think are not suitable for now and should be deprioritized? Why?',
    placeholder: 'e.g. B2C — high marketing cost and low willingness to pay in the early stage.',
  },
  {
    id: 'targetCustomers',
    section: 'C',
    type: 'textarea',
    label: '17. According to the priority direction, who are the main target customers (people / companies / organizations)?',
    placeholder: 'e.g. Large construction contractors and public utilities in Hong Kong.',
  },
  {
    id: 'decisionMaker',
    section: 'C',
    type: 'textarea',
    label: '18. Which position usually makes the purchasing or usage decision? How long is the decision process roughly?',
    placeholder: 'e.g. Safety Director / Procurement Manager; 3-6 months.',
  },
  {
    id: 'contactedCustomers',
    section: 'C',
    type: 'textarea',
    label: '19. Have you already contacted real potential customers? What was their reaction?',
    placeholder: 'e.g. Met 5 contractors at an exhibition; 3 showed strong interest and asked for a pilot.',
  },
  {
    id: 'marketSize',
    section: 'C',
    type: 'textarea',
    label: '20. How big do you estimate this segment market is in Hong Kong (or target region)? What obvious opportunities or changes in the next 2-3 years?',
    placeholder: 'e.g. 200+ active sites; smart site mandates coming in 2026.',
  },
  {
    id: 'trends',
    section: 'C',
    type: 'textarea',
    label: '21. Are there any specific policies, seasons, or industry trends that will significantly affect demand?',
    placeholder: 'e.g. New OSH legislation, government subsidies for smart construction.',
  },

  // ─── Section D: Value & Competition ───
  {
    id: 'top3Advantages',
    section: 'D',
    type: 'textarea',
    label: '22. Compared with existing solutions, what are our top 3 advantages?',
    placeholder: '1) …  2) …  3) …',
  },
  {
    id: 'weaknesses',
    section: 'D',
    type: 'textarea',
    label: '23. Are there any obvious weaknesses compared to competitors?',
    placeholder: 'e.g. No established brand, smaller sales team, higher hardware cost.',
  },
  {
    id: 'purchaseFactors',
    section: 'D',
    type: 'multi',
    label: '24. What are the most important purchasing factors for customers? (select up to 5, then rank them in the box below)',
    options: ['Price', 'Quality / Performance', 'Safety', 'Reliability', 'Ease of use', 'Support & after-sales', 'Brand trust', 'Speed / Delivery time', 'Other'],
    other: true,
    max: 5,
  },
  {
    id: 'factorRanking',
    section: 'D',
    type: 'textarea',
    label: '24b. Rank the selected factors by importance (e.g. 1. Safety, 2. Price, …)',
    placeholder: '1) … 2) … 3) … 4) … 5) …',
  },
  {
    id: 'valueProposition',
    section: 'D',
    type: 'textarea',
    label: '25. Summarize in one sentence: Why should customers choose us?',
    placeholder: 'e.g. We cut safety inspection cost by 60% while improving accuracy and coverage.',
  },
  // ─── Section E: Go-to-Market & Sales ───
  {
    id: 'gtmMethods',
    section: 'E',
    type: 'textarea',
    label: '26. What main methods do you recommend to reach and close the target customers?',
    placeholder: 'e.g. Direct sales team + industry exhibitions + government tenders.',
  },
  {
    id: 'firstCustomers',
    section: 'E',
    type: 'textarea',
    label: '27. Where are the first batch of customers most likely to come from? What channels or partners need to be established?',
    placeholder: 'e.g. Referrals from current safety consultancy clients; need a distributor in mainland China.',
  },
  {
    id: 'proofsRequired',
    section: 'E',
    type: 'textarea',
    label: '28. What proofs or conditions are usually required before closing a deal (case studies, certifications, insurance, maintenance, etc.)?',
    placeholder: 'e.g. Pilot case study, ISO 9001, product liability insurance, 24h maintenance.',
  },
  {
    id: 'afterSales',
    section: 'E',
    type: 'textarea',
    label: '29. How should after-sales service and maintenance be arranged to be competitive?',
    placeholder: 'e.g. 24/7 hotline, SLA of 4-hour response, remote diagnostics + annual maintenance plan.',
  },

  // ─── Section F: Cost, Pricing & Margin Calculation ───
  {
    id: 'unitCost',
    section: 'F',
    type: 'number',
    label: '30. What is the current approximate cost per unit / per set of this product? (Material + assembly + basic testing)',
    placeholder: 'e.g. 1000',
  },
  {
    id: 'companyMargin',
    section: 'F',
    type: 'select',
    label: '31. What is the minimum gross margin you want for the company layer? (you can override in the calculator below)',
    options: ['40%', '50%', '60%', '70%', 'Custom (use calculator below)'],
  },
  {
    id: 'distributorMargin',
    section: 'F',
    type: 'select',
    label: '32. If going through distributors / agents, what margin can you accept for the distributor?',
    options: ['Use system default', '1.2×', '1.4×', '1.5×', '1.7×'],
    showIf: hasChannelDirection,
  },
  {
    id: 'pricingStrategy',
    section: 'F',
    type: 'select',
    label: '33. Which pricing strategy do you prefer?',
    options: ['Cost-plus', 'Value-based', 'Competitive', 'Penetration', 'Other'],
  },
  {
    id: 'valueAdds',
    section: 'F',
    type: 'textarea',
    label: '34. Are there any complementary services or value-added items that can be sold together?',
    placeholder: 'e.g. Installation, training, data analytics subscription, extended warranty.',
  },

  // ─── Section G: Execution Readiness ───
  {
    id: 'smallBatch',
    section: 'G',
    type: 'textarea',
    label: '35a. To achieve small batch trial production (e.g. 10-20 units), how long and what resources are needed?',
    placeholder: 'e.g. 3 months, HK$ 300k, 2 engineers, 1 PM.',
  },
  {
    id: 'bottleneck',
    section: 'G',
    type: 'textarea',
    label: '35b. What is the biggest bottleneck for mass production?',
    placeholder: 'e.g. Lead time of camera module from overseas supplier.',
  },
  {
    id: 'certifications',
    section: 'G',
    type: 'textarea',
    label: '35c. What certifications / insurance are needed?',
    placeholder: 'e.g. CE / FCC, ISO 9001, product liability insurance.',
  },
  {
    id: 'supportNeeded',
    section: 'G',
    type: 'textarea',
    label: '35d. What are the top 3 supports needed from the company in the next 12 months?',
    placeholder: '1) … 2) … 3) …',
  },
  {
    id: 'teamGap',
    section: 'G',
    type: 'textarea',
    label: '35e. What capabilities is the team currently most lacking?',
    placeholder: 'e.g. Sales / BD experience, regulatory knowledge.',
  },
  {
    id: 'risks',
    section: 'G',
    type: 'textarea',
    label: '35f. What are the top 3 risks?',
    placeholder: '1) … 2) … 3) …',
  },
  {
    id: 'focus6months',
    section: 'G',
    type: 'textarea',
    label: '35g. What are the top 3 things that should be focused on in the next 6 months?',
    placeholder: '1) … 2) … 3) …',
  },
];

// ─── Summary builder ───────────────────────────────────────────────
// Compiles all answers (plus the calculated pricing text) into a
// readable, structured commercialization plan (plain text).

const val = (answers, id) => {
  const v = answers[id];
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v).trim();
};

const line = (label, value) => {
  const v = (value || '').toString().trim();
  return v ? `- ${label}: ${v}\n` : '';
};

export function buildCommercializationSummary(answers, pricingText = '') {
  let s = '# Commercialization Plan\n\n';

  s += '## 1. Product Overview\n';
  s += line('Product type', val(answers, 'productTypes'));
  s += line('What it does & problem solved', val(answers, 'productDescription'));
  s += line('Development stage', val(answers, 'devStage'));
  s += line('Biggest technical advantage', val(answers, 'techAdvantage'));
  s += line('Biggest limitation', val(answers, 'limitation'));
  s += line('Patent / trademark', val(answers, 'patent'));
  s += '\n';

  s += '## 2. Current Alternatives & Quantified Advantages\n';
  s += line('Current methods', val(answers, 'altMethods'));
  s += line('Traditional cost', val(answers, 'altCost'));
  s += line('Traditional time', val(answers, 'altTime'));
  s += line('Improved aspects', val(answers, 'improvedAspects'));
  s += line('Cost improvement', val(answers, 'cheaperBy'));
  s += line('Time improvement', val(answers, 'fasterBy'));
  s += line('Basis of numbers', val(answers, 'basis'));
  s += '\n';

  s += '## 3. Commercialization Direction & Target Customers\n';
  s += line('Priority directions', val(answers, 'directions'));
  s += line('Why these directions', val(answers, 'whyDirections'));
  s += line('Deprioritized directions', val(answers, 'deprioritized'));
  s += line('Target customers', val(answers, 'targetCustomers'));
  s += line('Decision maker & process', val(answers, 'decisionMaker'));
  s += line('Customer contacts & reaction', val(answers, 'contactedCustomers'));
  s += line('Market size & opportunity', val(answers, 'marketSize'));
  s += line('Policies / trends', val(answers, 'trends'));
  s += '\n';

  s += '## 4. Value & Competition\n';
  s += line('Top 3 advantages', val(answers, 'top3Advantages'));
  s += line('Weaknesses', val(answers, 'weaknesses'));
  s += line('Purchase factors', val(answers, 'purchaseFactors'));
  s += line('Factor ranking', val(answers, 'factorRanking'));
  s += line('Value proposition', val(answers, 'valueProposition'));
  s += '\n';

  s += '## 5. Go-to-Market & Sales\n';
  s += line('Go-to-market methods', val(answers, 'gtmMethods'));
  s += line('First customers & channels', val(answers, 'firstCustomers'));
  s += line('Proofs / conditions required', val(answers, 'proofsRequired'));
  s += line('After-sales & maintenance', val(answers, 'afterSales'));
  s += '\n';

  s += '## 6. Pricing & Margin\n';
  s += line('Unit cost', val(answers, 'unitCost') ? `HK$ ${val(answers, 'unitCost')}` : '');
  s += line('Company margin', val(answers, 'companyMargin'));
  s += line('Distributor margin', val(answers, 'distributorMargin'));
  s += line('Pricing strategy', val(answers, 'pricingStrategy'));
  if (pricingText) s += `\nRecommended selling prices:\n${pricingText}\n`;
  s += line('Value-added items', val(answers, 'valueAdds'));
  s += '\n';

  s += '## 7. Execution Readiness\n';
  s += line('Small batch trial production', val(answers, 'smallBatch'));
  s += line('Mass production bottleneck', val(answers, 'bottleneck'));
  s += line('Certifications / insurance', val(answers, 'certifications'));
  s += line('Support needed from company', val(answers, 'supportNeeded'));
  s += line('Team capability gap', val(answers, 'teamGap'));
  s += line('Top risks', val(answers, 'risks'));
  s += line('Next 6 months focus', val(answers, 'focus6months'));
  s += '\n';

  s += '---\nGenerated by I&D Hub — Commercialization Plan Questionnaire\n';
  return s;
}

// ─── AI prompt builder ─────────────────────────────────────────────
// Builds a detailed prompt so the AI can generate a full commercialization plan.

export const COMMERCIALIZATION_AI_PROMPT = `You are a senior commercialization / product-launch strategy consultant. Based on the answers from the commercialization questionnaire below, produce a DETAILED, professional commercialization plan.

Required structure:
1. Executive Summary
2. Product & Technology (what it is, core problem it solves, development stage, biggest technical advantage, limitations)
3. Market & Customers (current alternatives, quantified advantages, target customers, decision process, market size, policies/trends)
4. Competitive Analysis (top 3 advantages, weaknesses, key purchase factors, value proposition)
5. Commercialization Strategy (priority directions, why chosen, directions to deprioritize and why)
6. Pricing & Margin Plan (include the calculated layer-by-layer recommended selling prices and the price range)
7. Go-to-Market & Sales (channels, first customers, proofs/conditions required, after-sales & maintenance)
8. Execution Roadmap (small-batch trial production, mass-production bottleneck, certifications, resources needed, next 6 months focus)
9. Financial & Funding (cost structure, funding requirement, expected revenue)
10. Risks & Mitigation (top risks and concrete mitigations)
11. 90-Day Action Plan (specific concrete steps with owners and timeframes)

Rules:
- Write in the same language as the user's answers (Chinese answers → Traditional Chinese; English answers → English).
- Be specific and actionable; use the numbers the user provided.
- If an answer is empty, keep that section brief but still complete.
- Use clear section headings (e.g. "## 1. Executive Summary").
- Plain formatted text only — no JSON markup.

User's questionnaire answers:

`;

export function buildCommercializationAiPrompt(answers, pricingText = '') {
  const lines = COMMERCIALIZATION_QUESTIONS.map((q) => {
    const ans = answers[q.id];
    let text = '';
    if (Array.isArray(ans)) {
      text = ans.join(', ');
      if (q.other && answers[`${q.id}_other`]) text += ` (${answers[`${q.id}_other`]})`;
    } else if (ans != null && String(ans).trim() !== '') {
      text = String(ans).trim();
    }
    return `${q.label}\n${text || '(No answer)'}`;
  });
  const pricing = pricingText
    ? `\n\nCalculated recommended selling prices (from the pricing module):\n${pricingText}\n`
    : '';
  return COMMERCIALIZATION_AI_PROMPT + '\n' + lines.join('\n\n') + pricing + '\n';
}
