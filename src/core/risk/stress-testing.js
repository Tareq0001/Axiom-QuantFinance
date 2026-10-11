/**
 * Axiom QuantFinance - Macroeconomic & Crisis Stress Testing Engine
 * Historical Financial Shocks (2008 Lehman, 2020 Covid, 1987 Black Monday, 2022 Fed Rate Hike)
 * @author أ. طارق ابوعشي
 */

export const HISTORICAL_SCENARIOS = [
  {
    id: "gfc_2008",
    nameEn: "2008 Global Financial Crisis",
    nameAr: "الأزمة المالية العالمية 2008",
    descriptionEn: "Severe credit contraction, Lehman collapse, broad market liquidation.",
    descriptionAr: "انكماش حاد في الائتمان، انهيار ليمان براذرز، وتسييل واسع لأسواق الأسهم.",
    equityShock: -0.38,
    volatilityShock: +1.20, // +120% increase in IV
    rateShockBps: -250,      // -250 bps rate cut
    creditSpreadBps: +450
  },
  {
    id: "covid_2020",
    nameEn: "2020 Covid-19 Liquidity Shock",
    nameAr: "صدمة سيولة كوفيد-19 (مارس 2020)",
    descriptionEn: "Unprecedented volatility surge, extreme flight to cash and rapid drawdown.",
    descriptionAr: "قفزة غير مسبوقة في مؤشر التقلب VIX وهروب حاد للسيولة النقدية.",
    equityShock: -0.34,
    volatilityShock: +1.80,
    rateShockBps: -150,
    creditSpreadBps: +350
  },
  {
    id: "black_monday_1987",
    nameEn: "1987 Black Monday",
    nameAr: "الإثنين الأسود 1987",
    descriptionEn: "Single-day market crash driven by automated portfolio insurance selling.",
    descriptionAr: "انهيار تاريخي في يوم واحد مدفوعاً ببرامج التحوط الآلي للمحافظ.",
    equityShock: -0.226,
    volatilityShock: +2.10,
    rateShockBps: -50,
    creditSpreadBps: +200
  },
  {
    id: "rate_shock_2022",
    nameEn: "2022 Rapid Inflation & Rate Hike",
    nameAr: "صدمة التضخم ورفع الفائدة السريع 2022",
    descriptionEn: "Aggressive central bank tightening, multiple compression in high-multiple tech.",
    descriptionAr: "تشديد نقدي عالمي عنيف وضغط شديد على مضاعفات أسهم التكنولوجيا والنمو.",
    equityShock: -0.25,
    volatilityShock: +0.45,
    rateShockBps: +450,
    creditSpreadBps: +150
  }
];

/**
 * Apply Stress Scenario to a Portfolio
 * @param {Object} portfolio
 * @param {number} portfolio.equityHoldingsValue
 * @param {number} portfolio.cashValue
 * @param {number} portfolio.optionsDelta - Total net delta of options
 * @param {number} portfolio.optionsVega - Total net vega of options
 * @param {string} scenarioId
 */
export function applyStressScenario(portfolio, scenarioId) {
  const scenario = HISTORICAL_SCENARIOS.find(s => s.id === scenarioId) || HISTORICAL_SCENARIOS[0];
  const totalValueBefore = portfolio.equityHoldingsValue + portfolio.cashValue;

  // Direct equity impact
  const equityLoss = portfolio.equityHoldingsValue * scenario.equityShock;

  // Options Greeks nonlinear impact
  // Delta impact: delta * S * dS_pct
  const optionsDeltaImpact = (portfolio.optionsDelta || 0) * scenario.equityShock * 100;
  // Vega impact: vega * dVol_pts
  const optionsVegaImpact = (portfolio.optionsVega || 0) * (scenario.volatilityShock * 100);

  const totalPnL = equityLoss + optionsDeltaImpact + optionsVegaImpact;
  const totalValueAfter = Math.max(0, totalValueBefore + totalPnL);
  const drawdownPct = totalValueBefore > 0 ? (totalPnL / totalValueBefore) * 100 : 0;

  return {
    scenario,
    totalValueBefore,
    totalValueAfter,
    totalPnL,
    drawdownPct,
    breakdown: {
      equityLoss,
      optionsDeltaImpact,
      optionsVegaImpact
    }
  };
}
