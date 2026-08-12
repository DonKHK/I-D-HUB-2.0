import React, { useState, useEffect, useMemo } from 'react';
import {
  COMMERCIALIZATION_SECTIONS,
  COMMERCIALIZATION_QUESTIONS,
  buildCommercializationSummary,
  buildCommercializationAiPrompt,
} from '../utils/commercializationQuestions';
import {
  DIRECTION_OPTIONS,
  DIRECTION_PRICING,
  calculatePriceLayers,
  calculatePriceRange,
  calculatePaaS,
  formatMoney,
} from '../utils/commercializationPricing';
import { callAi } from '../utils/aiCall';

const DRAFT_KEY = 'pmis_commercialization_draft';

const labelToKey = (label) => {
  const found = DIRECTION_OPTIONS.find((d) => d.label === label);
  return found ? found.key : null;
};

const keyToLabel = (key) => {
  const found = DIRECTION_OPTIONS.find((d) => d.key === key);
  return found ? found.label : key;
};

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// Replace "Other (please specify)" with the user's typed text for summary output
function finalizeAnswers(answers) {
  const out = { ...answers };
  COMMERCIALIZATION_QUESTIONS.forEach((q) => {
    if (q.other && Array.isArray(out[q.id])) {
      const spec = String(out[`${q.id}_other`] || '').trim();
      out[q.id] = out[q.id].map((o) =>
        o === 'Other (please specify)' && spec ? `${o}: ${spec}` : o
      );
    }
  });
  return out;
}

// ─── Multi-select toggle with max limit ───
function toggleMultiValue(current, option, max) {
  let next = Array.isArray(current) ? [...current] : [];
  if (next.includes(option)) {
    next = next.filter((o) => o !== option);
  } else {
    if (max && next.length >= max) return current; // do not exceed max
    next.push(option);
  }
  return next;
}

export default function CommercializationQuestionnaire() {
  const [answers, setAnswers] = useState(loadDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepError, setStepError] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  // Pricing calculator state
  const [calcDirection, setCalcDirection] = useState('b2b');
  const [companyMarginPct, setCompanyMarginPct] = useState(50);
  const [distributorMarkup, setDistributorMarkup] = useState(1.4);
  const [recoveryMonths, setRecoveryMonths] = useState(24);
  const [serviceMarginPct, setServiceMarginPct] = useState(30);

  // AI plan state (Option A — provider + key entered each time)
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiEndpoint, setAiEndpoint] = useState('');
  const [aiModel, setAiModel] = useState('gpt-3.5-turbo');
  const [aiAccountId, setAiAccountId] = useState('');
  const [aiCloudflareToken, setAiCloudflareToken] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiPlanResult, setAiPlanResult] = useState('');

  // Save draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
    } catch (e) { /* ignore */ }
  }, [answers]);

  const currentSection = COMMERCIALIZATION_SECTIONS[stepIndex] || COMMERCIALIZATION_SECTIONS[0];

  const setAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleMulti = (q, option) => {
    setAnswers((prev) => ({
      ...prev,
      [q.id]: toggleMultiValue(prev[q.id], option, q.max),
    }));
  };

  // Sync calculator direction with the first priority direction chosen in Q14
  useEffect(() => {
    const dirs = answers.directions || [];
    if (dirs.length > 0) {
      const firstKey = labelToKey(dirs[0]);
      if (firstKey) setCalcDirection(firstKey);
    }
  }, [answers.directions]);

  // Visible questions for the current section (branching-aware)
  const visibleQuestions = useMemo(
    () =>
      COMMERCIALIZATION_QUESTIONS.filter(
        (q) => q.section === currentSection.id && (!q.showIf || q.showIf(answers))
      ),
    [currentSection, answers]
  );

  // ─── Pricing calculation ───
  const costValue = Number(answers.unitCost);
  const isPaas = calcDirection === 'paas';

  const pricingResult = useMemo(() => {
    if (isPaas) {
      return { type: 'fee', ...(calculatePaaS({ cost: costValue, recoveryMonths, serviceMarginPct }) || {}) };
    }
    return calculatePriceLayers({
      cost: costValue,
      directionKey: calcDirection,
      companyMarginPct,
      distributorMarkup,
    });
  }, [isPaas, costValue, calcDirection, companyMarginPct, distributorMarkup, recoveryMonths, serviceMarginPct]);

  // Company margin default from Q31 selection (e.g. "50%") when it is numeric
  const companyMarginFromAnswer = useMemo(() => {
    const v = String(answers.companyMargin || '').trim();
    const m = v.match(/^(\d+)%/);
    return m ? Number(m[1]) : null;
  }, [answers.companyMargin]);

  // Distributor markup from Q32 selection
  const distributorMarkupFromAnswer = useMemo(() => {
    const v = String(answers.distributorMargin || '').trim();
    const m = v.match(/^([\d.]+)×/);
    return m ? Number(m[1]) : null;
  }, [answers.distributorMargin]);

  const effectiveCompanyMargin = companyMarginPct || companyMarginFromAnswer || DIRECTION_PRICING[calcDirection]?.companyMarginDefault || 50;
  const effectiveDistributorMarkup = distributorMarkup || distributorMarkupFromAnswer || 1.4;

  const buildPricingText = () => {
    const dirs = answers.directions || [];
    if (dirs.length === 0) return '';
    const lines = [];
    dirs.forEach((label) => {
      const key = labelToKey(label);
      if (!key) return;
      if (key === 'paas') {
        const fee = calculatePaaS({ cost: costValue, recoveryMonths, serviceMarginPct });
        if (fee) {
          lines.push(
            `- PaaS: monthly fee ≈ ${formatMoney(fee.feeMonthly)} / yearly ≈ ${formatMoney(fee.feeYearly)} (cost recovered over ${fee.recoveryMonths} months + ${fee.serviceMargin}% service margin)`
          );
        }
        return;
      }
      const res = calculatePriceLayers({
        cost: costValue,
        directionKey: key,
        companyMarginPct: companyMarginFromAnswer || DIRECTION_PRICING[key]?.companyMarginDefault,
        distributorMarkup: distributorMarkupFromAnswer || undefined,
      });
      if (res) {
        const layerText = res.steps.map((st) => `${st.label} ${formatMoney(st.value)}`).join(' → ');
        lines.push(`- ${keyToLabel(key)}: cost ${formatMoney(costValue)} → ${layerText} → final ≈ ${formatMoney(res.finalPrice)} (cost × ${res.factor.toFixed(2)})`);
      }
    });
    return lines.join('\n');
  };

  // ─── Step validation & navigation ───
  const validateStep = () => {
    for (const q of visibleQuestions) {
      if (!q.required) continue;
      const v = answers[q.id];
      if (Array.isArray(v)) {
        if (v.length === 0) return `Please answer: ${q.label}`;
      } else if (v == null || String(v).trim() === '') {
        return `Please answer: ${q.label}`;
      }
    }
    return '';
  };

  const goNext = () => {
    const err = validateStep();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError('');
    setShowSummary(false);
    if (stepIndex < COMMERCIALIZATION_SECTIONS.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const goBack = () => {
    setStepError('');
    setShowSummary(false);
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const generateSummary = () => {
    const pricingText = buildPricingText();
    setSummaryText(buildCommercializationSummary(finalizeAnswers(answers), pricingText));
    setShowSummary(true);
  };

  // ─── AI detailed plan ───
  const runAiPlan = async () => {
    // Provider-specific validation
    if (aiProvider === 'cloudflare') {
      if (!String(aiAccountId || '').trim()) {
        setAiError('Please enter your Cloudflare Account ID.');
        return;
      }
      if (!String(aiCloudflareToken || '').trim()) {
        setAiError('Please enter your Cloudflare API Token.');
        return;
      }
    } else {
      if (!String(aiApiKey || '').trim()) {
        setAiError('Please enter an API Key.');
        return;
      }
      if (aiProvider === 'custom' && !String(aiEndpoint || '').trim()) {
        setAiError('Please enter an API endpoint URL.');
        return;
      }
    }

    setAiLoading(true);
    setAiError('');
    setAiPlanResult('');

    const prompt = buildCommercializationAiPrompt(finalizeAnswers(answers), buildPricingText());

    try {
      const content = await callAi({
        provider: aiProvider,
        apiKey: aiApiKey,
        endpoint: aiEndpoint,
        model: aiModel,
        accountId: aiAccountId,
        token: aiCloudflareToken,
        prompt,
      });
      setAiPlanResult(content);
      setShowSummary(false);
    } catch (err) {
      if (err?.message === 'Failed to fetch') {
        setAiError('無法連接到 AI 服務。請檢查網絡連線，並確認 backend server (port 5000) 已啟動。');
      } else {
        setAiError(err.message || 'AI generation failed. Please check your API settings and try again.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const copyAiPlan = async () => {
    if (!aiPlanResult) return;
    try {
      await navigator.clipboard.writeText(aiPlanResult);
      alert('AI commercialization plan copied to clipboard!');
    } catch (e) {
      alert('Copy failed — please select the text manually.');
    }
  };

  const downloadAiPlan = () => {
    if (!aiPlanResult) return;
    const blob = new Blob([aiPlanResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commercialization-plan-ai-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Question rendering ───
  const renderMulti = (q) => {
    const current = Array.isArray(answers[q.id]) ? answers[q.id] : [];
    const hasOther = q.other && current.includes('Other (please specify)');
    return (
      <div className="com-question-options">
        {q.options.map((opt) => {
          const checked = current.includes(opt);
          const disabled = !checked && q.max && current.length >= q.max;
          return (
            <label key={opt} className={`com-option ${checked ? 'com-option--checked' : ''} ${disabled ? 'com-option--disabled' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => handleMulti(q, opt)}
              />
              <span>{opt}</span>
            </label>
          );
        })}
        {hasOther && (
          <input
            type="text"
            className="form-input com-other-input"
            placeholder="Please specify..."
            value={answers[`${q.id}_other`] || ''}
            onChange={(e) => setAnswer(`${q.id}_other`, e.target.value)}
          />
        )}
      </div>
    );
  };

  const renderSelect = (q) => (
    <select
      className="form-input"
      value={answers[q.id] || ''}
      onChange={(e) => setAnswer(q.id, e.target.value)}
    >
      <option value="">— Select —</option>
      {q.options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );

  const renderInput = (q) =>
    q.type === 'textarea' ? (
      <textarea
        className="form-input"
        rows={3}
        placeholder={q.placeholder || ''}
        value={answers[q.id] || ''}
        onChange={(e) => setAnswer(q.id, e.target.value)}
      />
    ) : (
      <input
        type={q.type === 'number' ? 'number' : 'text'}
        className="form-input"
        placeholder={q.placeholder || ''}
        value={answers[q.id] || ''}
        onChange={(e) => setAnswer(q.id, e.target.value)}
      />
    );

  const renderQuestion = (q) => {
    let control = null;
    if (q.type === 'multi') control = renderMulti(q);
    else if (q.type === 'select') control = renderSelect(q);
    else control = renderInput(q);
    return (
      <div key={q.id} className="form-group com-question">
        <label className="form-label">{q.label}</label>
        {control}
      </div>
    );
  };

  // ─── Summary actions ───
  const copySummary = async () => {
    if (!summaryText) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      alert('Commercialization plan copied to clipboard!');
    } catch (e) {
      alert('Copy failed — please select the text manually.');
    }
  };

  const downloadSummary = () => {
    if (!summaryText) return;
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commercialization-plan-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setAnswers({});
    setStepIndex(0);
    setShowSummary(false);
    setSummaryText('');
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) { /* ignore */ }
  };

  const answeredTotal = COMMERCIALIZATION_QUESTIONS.filter((q) => {
    const v = answers[q.id];
    if (Array.isArray(v)) return v.length > 0;
    return v != null && String(v).trim() !== '';
  }).length;

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">📦 Commercialization Plan Questionnaire</h1>
        <button className="btn btn--outline" onClick={resetAll}>Reset</button>
      </div>
      <p className="page-subtitle">
        Answer section by section. Your answers are saved automatically in this browser.
      </p>

      {/* Stepper */}
      <div className="com-stepper">
        {COMMERCIALIZATION_SECTIONS.map((sec, i) => (
          <div
            key={sec.id}
            className={`com-step ${i === stepIndex ? 'com-step--active' : ''} ${i < stepIndex ? 'com-step--done' : ''}`}
            onClick={() => { setStepIndex(i); setShowSummary(false); setStepError(''); }}
            title={sec.title}
          >
            <span className="com-step-icon">{i < stepIndex ? '✓' : sec.icon}</span>
            <span className="com-step-label">{sec.id}</span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="com-progress">
        <span>Answered <strong>{answeredTotal}</strong> / {COMMERCIALIZATION_QUESTIONS.length} questions</span>
        <div className="com-progress-bar">
          <div className="com-progress-fill" style={{ width: `${Math.round((answeredTotal / COMMERCIALIZATION_QUESTIONS.length) * 100)}%` }} />
        </div>
      </div>

      {/* Section content */}
      <div className="card com-section-card">
        <h2 className="com-section-title">{currentSection.icon} Section {currentSection.id}: {currentSection.title}</h2>
        {visibleQuestions.length === 0 && <p className="empty-text">No questions in this section for your selections.</p>}
        {visibleQuestions.map((q) => renderQuestion(q))}

        {/* Pricing calculator (Section F) */}
        {currentSection.id === 'F' && (
          <div className="com-pricing">
            <h3 className="com-pricing-title">💰 Multi-layer Recommended Selling Price</h3>
            <p className="com-pricing-desc">
              Enter the unit cost and adjust the direction / margins below. The layers are shown step by step.
            </p>
            <div className="com-pricing-controls">
              <div className="form-group">
                <label className="form-label">Direction</label>
                <select className="form-input" value={calcDirection} onChange={(e) => setCalcDirection(e.target.value)}>
                  {DIRECTION_OPTIONS.map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit cost (HK$)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 1000"
                  value={answers.unitCost || ''}
                  onChange={(e) => setAnswer('unitCost', e.target.value)}
                />
              </div>
              {!isPaas && (
                <div className="form-group">
                  <label className="form-label">Company margin %</label>
                  <input
                    type="number"
                    className="form-input"
                    value={effectiveCompanyMargin}
                    onChange={(e) => setCompanyMarginPct(Number(e.target.value))}
                  />
                </div>
              )}
              {!isPaas && ['channel', 'b2b2c', 'b2b2g'].includes(calcDirection) && (
                <div className="form-group">
                  <label className="form-label">Distributor markup ×</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={effectiveDistributorMarkup}
                    onChange={(e) => setDistributorMarkup(Number(e.target.value))}
                  />
                </div>
              )}
              {isPaas && (
                <>
                  <div className="form-group">
                    <label className="form-label">Cost recovery (months)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={recoveryMonths}
                      onChange={(e) => setRecoveryMonths(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service margin %</label>
                    <input
                      type="number"
                      className="form-input"
                      value={serviceMarginPct}
                      onChange={(e) => setServiceMarginPct(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
            </div>

            {isPaas && pricingResult && pricingResult.feeMonthly ? (
              <div className="com-pricing-result">
                <div className="com-price-step"><span>Monthly fee</span><strong>{formatMoney(pricingResult.feeMonthly)}</strong></div>
                <div className="com-price-step"><span>Yearly fee</span><strong>{formatMoney(pricingResult.feeYearly)}</strong></div>
                <div className="com-price-factor">= cost recovery over {pricingResult.recoveryMonths} months + {pricingResult.serviceMargin}% service margin</div>
              </div>
            ) : pricingResult ? (
              <div className="com-pricing-result">
                {pricingResult.steps.map((st, i) => (
                  <div key={i} className="com-price-step">
                    <span>{st.label}</span>
                    <strong>{formatMoney(st.value)}</strong>
                  </div>
                ))}
                <div className="com-price-step com-price-step--final">
                  <span>Recommended final selling price</span>
                  <strong>≈ {formatMoney(pricingResult.finalPrice)}</strong>
                </div>
                <div className="com-price-factor">≈ cost × {pricingResult.factor.toFixed(2)}</div>
                {(() => {
                  const range = calculatePriceRange(answers.unitCost, calcDirection);
                  return range ? (
                    <div className="com-price-range">
                      Suggested range ≈ {formatMoney(range.low)} – {formatMoney(range.high)}
                      <span className="com-price-range-note">(cost × {range.lowFactor.toFixed(1)}–{range.highFactor.toFixed(1)})</span>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : (
              <p className="com-pricing-hint">Enter a unit cost above to see the price calculation.</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {stepError && <div className="alert alert--warning">{stepError}</div>}
      <div className="com-nav">
        <button className="btn btn--secondary" onClick={goBack} disabled={stepIndex === 0}>
          ← Back
        </button>
        {stepIndex < COMMERCIALIZATION_SECTIONS.length - 1 ? (
          <button className="btn btn--primary" onClick={goNext}>Next →</button>
        ) : (
          <button className="btn btn--primary" onClick={generateSummary}>📋 Generate Summary</button>
        )}
        <button className="btn btn--outline" onClick={generateSummary} title="Generate summary from current answers">
          ⚡ Summary
        </button>
      </div>

      {/* AI Detailed Plan (on last section) */}
      {stepIndex === COMMERCIALIZATION_SECTIONS.length - 1 && (
        <div className="card com-ai-panel">
          <h3 className="com-section-title" style={{ marginBottom: '0.35rem' }}>🤖 AI Detailed Commercialization Plan</h3>
          <p className="com-pricing-desc">
            Generate a detailed, professional commercialization plan with AI using all your answers and the calculated prices.
          </p>

          <div className="ai-provider-tabs">
            {[
              { key: 'openai', label: 'OpenAI' },
              { key: 'custom', label: 'Custom' },
              { key: 'cloudflare', label: 'Cloudflare' },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                className={`ai-provider-tab ${aiProvider === p.key ? 'active' : ''}`}
                onClick={() => setAiProvider(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {aiProvider === 'cloudflare' && (
            <>
              <div className="form-group">
                <label className="form-label">Cloudflare Account ID</label>
                <input type="text" className="form-input" placeholder="Your Cloudflare Account ID" value={aiAccountId} onChange={(e) => setAiAccountId(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Cloudflare API Token</label>
                <input type="password" className="form-input" placeholder="Your Cloudflare API Token" value={aiCloudflareToken} onChange={(e) => setAiCloudflareToken(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input type="text" className="form-input" placeholder="@cf/deepseek-ai/deepseek-r1-distill-qwen-32b" value={aiModel} onChange={(e) => setAiModel(e.target.value)} />
              </div>
            </>
          )}
          {aiProvider !== 'cloudflare' && (
            <>
              <div className="form-group">
                <label className="form-label">API Key</label>
                <input type="password" className="form-input" placeholder={aiProvider === 'openai' ? 'sk-...' : 'Enter your API key (leave empty if not required)'} value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} />
              </div>
              {aiProvider === 'custom' && (
                <div className="form-group">
                  <label className="form-label">API Endpoint URL</label>
                  <input type="text" className="form-input" placeholder="https://your-api.com/v1/chat/completions" value={aiEndpoint} onChange={(e) => setAiEndpoint(e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Model Name</label>
                <input type="text" className="form-input" placeholder={aiProvider === 'openai' ? 'gpt-3.5-turbo' : 'e.g. gpt-3.5-turbo, llama3, mistral'} value={aiModel} onChange={(e) => setAiModel(e.target.value)} />
              </div>
            </>
          )}

          {aiError && <div className="alert alert--warning">{aiError}</div>}

          <button className="btn btn--primary" onClick={runAiPlan} disabled={aiLoading}>
            {aiLoading ? 'Generating...' : '🤖 Generate Detailed AI Plan'}
          </button>

          {aiPlanResult && (
            <div className="com-ai-result">
              <div className="com-summary-header">
                <h4 style={{ margin: 0, color: '#1a237e' }}>📄 AI Commercialization Plan</h4>
                <div className="com-summary-actions">
                  <button className="btn btn--secondary" onClick={copyAiPlan}>📋 Copy</button>
                  <button className="btn btn--secondary" onClick={downloadAiPlan}>⬇️ Download .txt</button>
                  <button className="btn btn--secondary" onClick={() => window.print()}>🖨️ Print</button>
                </div>
              </div>
              <textarea className="form-input com-ai-result-text" rows={30} value={aiPlanResult} onChange={(e) => setAiPlanResult(e.target.value)} />
              <p className="com-pricing-desc">💡 The text above is editable — tweak it, then copy / download / print.</p>
            </div>
          )}
        </div>
      )}

      {/* Summary result */}
      {showSummary && summaryText && (
        <div className="card com-summary">
          <div className="com-summary-header">
            <h3 className="com-section-title" style={{ margin: 0 }}>📋 Commercialization Plan</h3>
            <div className="com-summary-actions">
              <button className="btn btn--secondary" onClick={copySummary}>📋 Copy</button>
              <button className="btn btn--secondary" onClick={downloadSummary}>⬇️ Download .txt</button>
              <button className="btn btn--secondary" onClick={() => window.print()}>🖨️ Print</button>
            </div>
          </div>
          <textarea className="form-input com-summary-text" rows={30} readOnly value={summaryText} />
        </div>
      )}
    </div>
  );
}
