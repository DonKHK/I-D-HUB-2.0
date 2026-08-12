// Multi-layer pricing calculator for the Commercialization Plan questionnaire.
//
// Default margin assumptions per direction (all user-adjustable):
//   B2C                : company margin 50-70%   → final ≈ cost × 2.5
//   B2B                : company margin 40-60%   → final ≈ cost × 2.0
//   B2G                : company margin 30-50%   → final ≈ cost × 1.7
//   Channel/Distributor: company 40-55% + distributor 1.3-1.7× → final ≈ cost × 2.8
//   B2B2C              : company 40-55% + distributor 1.3-1.6× + retail 1.3-1.6× → final ≈ cost × 3.6
//   B2B2G              : company 40-55% + distributor 1.3-1.6× → final ≈ cost × 2.8
//   OEM / White Label  : company margin 25-40%   → final ≈ cost × 1.5
//   PaaS               : fee-based (cost recovery + service margin)

export const DIRECTION_OPTIONS = [
  { key: 'b2c', label: 'B2C' },
  { key: 'b2b', label: 'B2B' },
  { key: 'b2g', label: 'B2G' },
  { key: 'b2b2c', label: 'B2B2C' },
  { key: 'b2b2g', label: 'B2B2G' },
  { key: 'oem', label: 'OEM / White Label' },
  { key: 'channel', label: 'Channel / Distributor' },
  { key: 'paas', label: 'Product-as-a-Service (PaaS)' },
];

export const DIRECTION_PRICING = {
  b2c: {
    label: 'B2C Direct',
    companyMarginDefault: 60,
    companyMarginRange: [50, 70],
    factorRange: [2.0, 3.3],
    layers: [{ type: 'company', label: 'Company layer', defaultPct: 60 }],
    summaryNote: 'B2C direct — final price ≈ cost × 2.0–3.3',
  },
  b2b: {
    label: 'B2B Direct',
    companyMarginDefault: 50,
    companyMarginRange: [40, 60],
    factorRange: [1.7, 2.5],
    layers: [{ type: 'company', label: 'Company layer', defaultPct: 50 }],
    summaryNote: 'B2B direct — final price ≈ cost × 1.7–2.5',
  },
  b2g: {
    label: 'B2G',
    companyMarginDefault: 41,
    companyMarginRange: [30, 50],
    factorRange: [1.4, 2.0],
    layers: [{ type: 'company', label: 'Company layer', defaultPct: 41 }],
    summaryNote: 'B2G — final price ≈ cost × 1.4–2.0',
  },
  channel: {
    label: 'Channel / Distributor',
    companyMarginDefault: 50,
    companyMarginRange: [40, 55],
    distributorMarkupRange: [1.4, 1.7],
    factorRange: [2.0, 2.9],
    layers: [
      { type: 'company', label: 'Company layer', defaultPct: 50 },
      { type: 'distributor', label: 'Distributor markup', defaultMarkup: 1.4 },
    ],
    summaryNote: 'Channel / Distributor — final price ≈ cost × 2.0–2.9',
  },
  b2b2c: {
    label: 'B2B2C',
    companyMarginDefault: 50,
    companyMarginRange: [40, 55],
    distributorMarkupRange: [1.4, 1.6],
    retailMarkupRange: [1.3, 1.6],
    factorRange: [2.4, 3.8],
    layers: [
      { type: 'company', label: 'Company layer', defaultPct: 50 },
      { type: 'distributor', label: 'Distributor markup', defaultMarkup: 1.4 },
      { type: 'retail', label: 'Retail markup', defaultMarkup: 1.3 },
    ],
    summaryNote: 'B2B2C — final price ≈ cost × 2.4–3.8',
  },
  b2b2g: {
    label: 'B2B2G',
    companyMarginDefault: 50,
    companyMarginRange: [40, 55],
    distributorMarkupRange: [1.4, 1.6],
    factorRange: [2.0, 2.9],
    layers: [
      { type: 'company', label: 'Company layer', defaultPct: 50 },
      { type: 'distributor', label: 'Distributor markup', defaultMarkup: 1.4 },
    ],
    summaryNote: 'B2B2G — final price ≈ cost × 2.0–2.9',
  },
  oem: {
    label: 'OEM / White Label',
    companyMarginDefault: 33,
    companyMarginRange: [25, 40],
    factorRange: [1.3, 1.7],
    layers: [{ type: 'company', label: 'Company layer', defaultPct: 33 }],
    summaryNote: 'OEM / White Label — final price ≈ cost × 1.3–1.7',
  },
  paas: {
    type: 'fee',
    label: 'Product-as-a-Service (PaaS)',
    recoveryMonthsDefault: 24,
    serviceMarginDefault: 30,
    serviceMarginRange: [40, 60],
    summaryNote: 'PaaS — monthly/yearly fee = cost recovery + service margin',
  },
};

const money = (n) => {
  const v = Number(n || 0);
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

/**
 * Calculate layer-by-layer recommended selling price for a cost-based direction.
 * @returns {Object|null} { steps: [{label, value, note?}], companyPrice, finalPrice, factor } or null when input is invalid.
 */
export function calculatePriceLayers({ cost, directionKey, companyMarginPct, distributorMarkup }) {
  const cfg = DIRECTION_PRICING[directionKey];
  const baseCost = Number(cost);
  if (!cfg || cfg.type === 'fee' || !baseCost || baseCost <= 0) return null;

  const companyMargin = companyMarginPct != null && Number(companyMarginPct) > 0
    ? Number(companyMarginPct)
    : cfg.companyMarginDefault;

  const steps = [];
  let price = baseCost;

  // Layer 1: company margin
  const companyPrice = baseCost / (1 - companyMargin / 100);
  steps.push({
    label: `Company layer (margin ${companyMargin}%)`,
    value: companyPrice,
    note: `cost ${money(baseCost)} ÷ (1 − ${companyMargin}%)`,
  });
  price = companyPrice;

  // Remaining layers (distributor / retail markups)
  cfg.layers.forEach((layer) => {
    if (layer.type === 'company') return;
    const markup =
      layer.type === 'distributor' && distributorMarkup != null && Number(distributorMarkup) > 1
        ? Number(distributorMarkup)
        : layer.defaultMarkup;
    price = price * markup;
    steps.push({
      label: `${layer.label} ${markup}×`,
      value: price,
      note: `× ${markup}`,
    });
  });

  return {
    steps,
    companyPrice,
    finalPrice: price,
    factor: price / baseCost,
  };
}

/**
 * Calculate a recommended selling price RANGE for a cost-based direction,
 * using the default margin ranges in the assumptions table.
 * @returns {Object|null} { low, high, lowFactor, highFactor, factorRange } or null when invalid.
 */
export function calculatePriceRange(cost, directionKey) {
  const cfg = DIRECTION_PRICING[directionKey];
  const baseCost = Number(cost);
  if (!cfg || cfg.type === 'fee' || !baseCost || baseCost <= 0) return null;

  const [minMargin, maxMargin] = cfg.companyMarginRange || [cfg.companyMarginDefault, cfg.companyMarginDefault];
  let low = baseCost / (1 - minMargin / 100);
  let high = baseCost / (1 - maxMargin / 100);

  cfg.layers.forEach((layer) => {
    if (layer.type === 'company') return;
    if (layer.type === 'distributor' && cfg.distributorMarkupRange) {
      low *= cfg.distributorMarkupRange[0];
      high *= cfg.distributorMarkupRange[1];
    } else if (layer.type === 'retail' && cfg.retailMarkupRange) {
      low *= cfg.retailMarkupRange[0];
      high *= cfg.retailMarkupRange[1];
    }
  });

  return {
    low,
    high,
    lowFactor: low / baseCost,
    highFactor: high / baseCost,
    factorRange: cfg.factorRange || [low / baseCost, high / baseCost],
  };
}

/**
 * Calculate fee-based pricing for the PaaS direction.
 * @returns {Object|null} { feeMonthly, feeYearly, recoveryMonths, serviceMargin } or null when invalid.
 */
export function calculatePaaS({ cost, recoveryMonths, serviceMarginPct }) {
  const baseCost = Number(cost);
  const months = Number(recoveryMonths) || 24;
  const margin = Number(serviceMarginPct) || 30;
  if (!baseCost || baseCost <= 0) return null;
  const feeMonthly = (baseCost / months) * (1 + margin / 100);
  const feeYearly = feeMonthly * 12;
  return { feeMonthly, feeYearly, recoveryMonths: months, serviceMargin: margin };
}

/** Format a currency amount for display (HK$, no decimals). */
export function formatMoney(n) {
  return `HK$ ${money(n)}`;
}
