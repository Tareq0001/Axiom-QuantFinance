/**
 * Axiom QuantFinance - Fundamental Valuation & DCF Engine
 * Discounted Cash Flow, WACC, Gordon Growth & Sensitivity Matrix
 * @author أ. طارق ابوعشي
 */

/**
 * Weighted Average Cost of Capital (WACC)
 * WACC = (E/V)*Re + (D/V)*Rd*(1 - Tc)
 */
export function calculateWACC({
  equityValue,
  debtValue,
  costOfEquity,
  costOfDebt,
  taxRate
}) {
  const totalCapital = equityValue + debtValue;
  if (totalCapital <= 0) return costOfEquity;

  const we = equityValue / totalCapital;
  const wd = debtValue / totalCapital;
  const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);

  return (we * costOfEquity) + (wd * afterTaxCostOfDebt);
}

/**
 * Comprehensive Discounted Cash Flow (DCF) Model
 * @param {Object} params
 * @param {Array<number>} params.projectedFCFF - Array of projected Free Cash Flows to Firm (e.g. 5 years)
 * @param {number} params.wacc - Weighted Average Cost of Capital (discount rate, e.g. 0.09)
 * @param {number} params.terminalGrowthRate - Perpetual growth rate g (e.g. 0.025)
 * @param {number} params.netDebt - Total Debt minus Cash and Equivalents
 * @param {number} params.sharesOutstanding - Total number of diluted shares
 * @param {number} params.currentMarketPrice - Current share price for upside/downside comparison
 */
export function calculateDCF({
  projectedFCFF,
  wacc,
  terminalGrowthRate = 0.025,
  netDebt = 0,
  sharesOutstanding = 1,
  currentMarketPrice = 100
}) {
  if (wacc <= terminalGrowthRate) {
    throw new Error("WACC must be strictly greater than terminal growth rate.");
  }

  const pvCashFlows = [];
  let sumPVCashFlows = 0;

  for (let year = 1; year <= projectedFCFF.length; year++) {
    const fcf = projectedFCFF[year - 1];
    const discountFactor = Math.pow(1 + wacc, year);
    const pv = fcf / discountFactor;
    pvCashFlows.push(pv);
    sumPVCashFlows += pv;
  }

  // Terminal Value via Gordon Growth on Year N cash flow
  const lastFCF = projectedFCFF[projectedFCFF.length - 1];
  const terminalFCF = lastFCF * (1 + terminalGrowthRate);
  const terminalValue = terminalFCF / (wacc - terminalGrowthRate);
  const pvTerminalValue = terminalValue / Math.pow(1 + wacc, projectedFCFF.length);

  // Enterprise Value
  const enterpriseValue = sumPVCashFlows + pvTerminalValue;

  // Equity Value
  const equityValue = enterpriseValue - netDebt;

  // Intrinsic Value per share
  const intrinsicValuePerShare = sharesOutstanding > 0 ? equityValue / sharesOutstanding : 0;
  const upsidePct = currentMarketPrice > 0 ? ((intrinsicValuePerShare - currentMarketPrice) / currentMarketPrice) * 100 : 0;

  // 2D Sensitivity Table (WACC vs Terminal Growth Rate)
  const waccRange = [-0.015, -0.0075, 0, 0.0075, 0.015].map(delta => Number((wacc + delta).toFixed(4)));
  const gRange = [-0.01, -0.005, 0, 0.005, 0.01].map(delta => Number((terminalGrowthRate + delta).toFixed(4)));

  const sensitivityMatrix = [];
  for (const testWacc of waccRange) {
    const row = [];
    for (const testG of gRange) {
      if (testWacc <= testG) {
        row.push(null);
      } else {
        const tv = (lastFCF * (1 + testG)) / (testWacc - testG);
        const pvTv = tv / Math.pow(1 + testWacc, projectedFCFF.length);
        let sumPv = 0;
        for (let y = 1; y <= projectedFCFF.length; y++) {
          sumPv += projectedFCFF[y - 1] / Math.pow(1 + testWacc, y);
        }
        const eqVal = (sumPv + pvTv) - netDebt;
        row.push(Number((eqVal / sharesOutstanding).toFixed(2)));
      }
    }
    sensitivityMatrix.push({ wacc: testWacc, values: row });
  }

  return {
    enterpriseValue,
    equityValue,
    intrinsicValuePerShare,
    fairValuePerShare: intrinsicValuePerShare,
    currentMarketPrice,
    upsidePct,
    sumPVCashFlows,
    terminalValue,
    pvTerminalValue,
    pvCashFlows,
    sensitivity: {
      waccRange,
      growthRange: gRange,
      matrix: sensitivityMatrix
    }
  };
}

/**
 * Gordon Growth Model (Dividend Discount Model - DDM)
 * P_0 = D_1 / (r - g)
 */
export function calculateGordonGrowthModel({ nextDividend, requiredRateOfReturn, dividendGrowthRate }) {
  if (requiredRateOfReturn <= dividendGrowthRate) {
    throw new Error("Required return must exceed dividend growth rate.");
  }
  const fairValue = nextDividend / (requiredRateOfReturn - dividendGrowthRate);
  return { fairValue };
}
