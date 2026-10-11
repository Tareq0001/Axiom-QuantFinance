/**
 * Axiom QuantFinance - Automated Test Runner & Mathematical Verification
 * Validating quantitative models against academic & industry benchmarks (John C. Hull)
 * @author أ. طارق ابوعشي
 */

import { normalPDF, normalCDF, inverseNormalCDF } from '../src/core/math/statistics.js';
import { invertMatrix, matrixVectorMultiply } from '../src/core/math/matrix.js';
import { calculateBSM } from '../src/core/derivatives/black-scholes.js';
import { calculateImpliedVolatility } from '../src/core/derivatives/implied-volatility.js';
import { calculateBinomialTree } from '../src/core/derivatives/binomial-tree.js';
import { createStrategyTemplate } from '../src/core/derivatives/strategies.js';
import { calculateFuturesPrice, calculateOptimalHedgeRatio } from '../src/core/derivatives/futures-hedging.js';
import { runMarkowitzOptimization } from '../src/core/portfolio/markowitz.js';
import { runMonteCarloSimulation } from '../src/core/risk/monte-carlo.js';
import { calculateRiskMetrics } from '../src/core/risk/var-cvar.js';
import { calculateDCF, calculateWACC } from '../src/core/equity/valuation-models.js';
import { calculateRSI } from '../src/core/equity/technical-indicators.js';
import { generateStockRecommendation } from '../src/core/equity/stock-recommendation.js';
import { getSaudiStocks } from '../src/data/market-feed.js';
import { PaperTradingWallet } from '../src/core/trading/paper-trading.js';
import { simulateCustomPortfolio, calculateDRIPCompounding } from '../src/core/portfolio/simulator.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  }
}

function assertCloseTo(actual, expected, tol, message) {
  const diff = Math.abs(actual - expected);
  const ok = diff <= tol;
  if (ok) {
    console.log(`  ✔ ${message} (Actual: ${actual.toFixed(4)}, Expected: ${expected.toFixed(4)})`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${message} (Actual: ${actual}, Expected: ${expected}, Diff: ${diff} > Tol: ${tol})`);
    failed++;
  }
}

console.log("============================================================");
console.log("🧪 Axiom QuantFinance - Mathematical Benchmark Verification");
console.log("============================================================\n");

// --- TEST SUITE 1: Normal Distribution & Solvers ---
console.log("▶ Suite 1: Statistical Foundations & Precision Normal Math");
assertCloseTo(normalPDF(0), 0.398942, 1e-4, "Normal PDF at 0");
assertCloseTo(normalCDF(0), 0.500000, 1e-5, "Normal CDF at 0");
assertCloseTo(normalCDF(1.95996), 0.975000, 1e-4, "Normal CDF at 1.96 (97.5% quantile)");
assertCloseTo(inverseNormalCDF(0.975), 1.95996, 1e-4, "Inverse Normal CDF at 0.975");
assertCloseTo(inverseNormalCDF(0.5), 0.00000, 1e-5, "Inverse Normal CDF at 0.5");

// Matrix Inversion Check
const A = [
  [4, 2],
  [1, 3]
];
const invA = invertMatrix(A);
// A * invA should be identity
const col0 = matrixVectorMultiply(A, [invA[0][0], invA[1][0]]);
const col1 = matrixVectorMultiply(A, [invA[0][1], invA[1][1]]);
assertCloseTo(col0[0], 1, 1e-6, "Matrix Inversion: (A * invA)[0][0] == 1");
assertCloseTo(col0[1], 0, 1e-6, "Matrix Inversion: (A * invA)[1][0] == 0");
assertCloseTo(col1[0], 0, 1e-6, "Matrix Inversion: (A * invA)[0][1] == 0");
assertCloseTo(col1[1], 1, 1e-6, "Matrix Inversion: (A * invA)[1][1] == 1");

// --- TEST SUITE 2: Black-Scholes-Merton & Hull Benchmarks ---
console.log("\n▶ Suite 2: Black-Scholes-Merton (Hull 10th Ed. Benchmark: S=100, K=100, T=1, r=0.05, sigma=0.20)");
const bsmCall = calculateBSM({ S: 100, K: 100, T: 1, r: 0.05, q: 0, sigma: 0.20, type: 'call' });
const bsmPut = calculateBSM({ S: 100, K: 100, T: 1, r: 0.05, q: 0, sigma: 0.20, type: 'put' });

assertCloseTo(bsmCall.price, 10.4506, 0.005, "Call Price matches Hull Benchmark (10.4506)");
assertCloseTo(bsmPut.price, 5.5735, 0.005, "Put Price matches Hull Benchmark (5.5735)");
// Put-Call Parity: C - P = S - K * exp(-rT)
const parityDiff = (bsmCall.price - bsmPut.price) - (100 - 100 * Math.exp(-0.05 * 1));
assertCloseTo(parityDiff, 0, 1e-6, "Put-Call Parity identity exactly holds");

// Greeks Verification
assertCloseTo(bsmCall.delta, 0.6368, 0.005, "Call Delta matches benchmark (0.6368)");
assertCloseTo(bsmPut.delta, -0.3632, 0.005, "Put Delta equals Call Delta - 1 (-0.3632)");
assertCloseTo(bsmCall.gamma, 0.0188, 0.001, "Gamma matches benchmark (0.0188)");
assertCloseTo(bsmCall.vega, 0.3752, 0.005, "Vega matches benchmark (0.3752)");
assert(bsmCall.theta < 0, "Call Theta represents negative time decay");

// --- TEST SUITE 3: Implied Volatility Solver ---
console.log("\n▶ Suite 3: Implied Volatility Numerical Inversion");
const ivResult = calculateImpliedVolatility({
  targetPrice: 10.4506,
  S: 100,
  K: 100,
  T: 1,
  r: 0.05,
  q: 0,
  type: 'call'
});
assert(ivResult.converged, "IV Solver converged successfully");
assertCloseTo(ivResult.iv, 0.2000, 0.001, "Recovered Implied Volatility matches original 20.00%");

// --- TEST SUITE 4: Binomial Tree American vs European ---
console.log("\n▶ Suite 4: Cox-Ross-Rubinstein (CRR) Binomial Lattice");
const treeEuro = calculateBinomialTree({ S: 100, K: 100, T: 1, r: 0.05, sigma: 0.20, steps: 80, type: 'call', style: 'european' });
const treeAmerPut = calculateBinomialTree({ S: 100, K: 100, T: 1, r: 0.05, sigma: 0.20, steps: 80, type: 'put', style: 'american' });
const treeEuroPut = calculateBinomialTree({ S: 100, K: 100, T: 1, r: 0.05, sigma: 0.20, steps: 80, type: 'put', style: 'european' });

assertCloseTo(treeEuro.price, bsmCall.price, 0.15, "European Binomial converges to BSM analytical price");
assert(treeAmerPut.price >= treeEuroPut.price - 1e-6, "American Put Price >= European Put Price (Early Exercise Premium)");

// --- TEST SUITE 5: Options Strategies (Iron Condor) ---
console.log("\n▶ Suite 5: Multi-Leg Options Strategy Payoff Architect");
const ironCondor = createStrategyTemplate('iron_condor', { S: 100, T: 30 / 365, r: 0.05, iv: 0.20 });
const payoff = ironCondor.generatePayoffCurve(100, 0.30, 50);
assert(payoff.legs.length === 4, "Iron Condor contains exactly 4 option legs");
assert(payoff.breakevens.length === 2, "Iron Condor has exactly 2 breakeven boundaries");
assert(payoff.maxProfit > 0, "Iron Condor maximum profit is positive credit");

// --- TEST SUITE 6: Futures & Optimal Hedge Ratio ---
console.log("\n▶ Suite 6: Cost of Carry & Hedging");
const fut = calculateFuturesPrice({ S0: 100, r: 0.05, q: 0.02, u: 0, T: 0.5 });
// F = 100 * exp((0.05 - 0.02) * 0.5) = 100 * exp(0.015) = 101.511
assertCloseTo(fut.futuresPrice, 101.511, 0.01, "Futures Cost-of-Carry pricing verified");
const hedge = calculateOptimalHedgeRatio(0.20, 0.22, 0.90);
assertCloseTo(hedge.hStar, 0.8181, 0.01, "Optimal Minimum-Variance Hedge Ratio h* verified");

// --- TEST SUITE 7: Markowitz Modern Portfolio Theory ---
console.log("\n▶ Suite 7: Markowitz Mean-Variance Portfolio Optimization");
// 3 assets returns simulation
const r1 = [0.01, -0.005, 0.02, 0.015, -0.01, 0.005, 0.012, -0.008, 0.018, 0.002];
const r2 = [0.005, 0.01, -0.01, 0.02, 0.005, -0.005, 0.008, 0.012, -0.002, 0.015];
const r3 = [0.002, 0.001, 0.003, -0.001, 0.002, 0.001, 0.002, -0.002, 0.004, 0.001];

const mpt = runMarkowitzOptimization({
  assetSymbols: ["Asset A", "Asset B", "Asset C"],
  returnsMatrix: [r1, r2, r3],
  riskFreeRate: 0.02
});

const sumWeightsGMV = mpt.gmvPortfolio.weights.reduce((a, b) => a + b, 0);
const sumWeightsTan = mpt.tangencyPortfolio.weights.reduce((a, b) => a + b, 0);
assertCloseTo(sumWeightsGMV, 1.0, 1e-4, "GMV portfolio weights sum to 100%");
assertCloseTo(sumWeightsTan, 1.0, 1e-4, "Tangency portfolio weights sum to 100%");
assert(mpt.tangencyPortfolio.sharpe >= mpt.gmvPortfolio.sharpe - 1e-4, "Tangency Sharpe Ratio >= GMV Sharpe Ratio");
assert(mpt.efficientFrontier.length > 10, "Analytical Efficient Frontier curve calculated");

// --- TEST SUITE 8: Monte Carlo & Risk VaR / CVaR ---
console.log("\n▶ Suite 8: Monte Carlo Simulation & Quantitative VaR/CVaR");
const mc = runMonteCarloSimulation({ S0: 100, mu: 0.10, sigma: 0.20, days: 30, numSimulations: 500 });
assert(mc.previewPaths.length > 0, "Monte Carlo paths generated");
assert(mc.sortedFinals.length === 500, "All 500 terminal prices simulated");

const risk = calculateRiskMetrics({
  historicalReturns: r1,
  portfolioValue: 1000000,
  confidenceLevel: 0.95
});
assert(risk.parametric.varAmount > 0, "Parametric 95% VaR is positive risk loss");
assert(risk.parametric.cvarAmount >= risk.parametric.varAmount, "Parametric CVaR (Expected Shortfall) >= VaR");

// --- TEST SUITE 9: Fundamental DCF Valuation ---
console.log("\n▶ Suite 9: Discounted Cash Flow (DCF) & Technical RSI");
const wacc = calculateWACC({
  equityValue: 800,
  debtValue: 200,
  costOfEquity: 0.10,
  costOfDebt: 0.05,
  taxRate: 0.20
});
assertCloseTo(wacc, 0.088, 1e-4, "WACC calculated accurately (8.80%)");

const dcf = calculateDCF({
  projectedFCFF: [100, 110, 120, 130, 140],
  wacc: 0.09,
  terminalGrowthRate: 0.025,
  netDebt: 100,
  sharesOutstanding: 10,
  currentMarketPrice: 150
});
assert(dcf.intrinsicValuePerShare > 0, "DCF yields positive intrinsic value per share");
assert(dcf.sensitivity.matrix.length === 5, "DCF 2D sensitivity matrix generated");

// RSI Test
const testCloses = [44, 44.5, 45, 44, 43.5, 43, 44, 45, 46, 47, 48, 47.5, 48, 49, 50, 51];
const rsi = calculateRSI(testCloses, 14);
const lastRsi = rsi[rsi.length - 1];
// --- TEST SUITE 10: Saudi Stocks Recommendation & Price Forecast Engine ---
console.log("\n▶ Suite 10: Saudi Stocks Quantitative Recommendations & Price Targets");
const saudiStocks = getSaudiStocks();
assert(saudiStocks.length === 12, `Saudi stock universe contains 12 blue chips (Actual: ${saudiStocks.length})`);

const aramco = saudiStocks.find(s => s.symbol === '2222.SR');
assert(aramco !== undefined, "Saudi Aramco (2222.SR) exists in universe");
const alrajhi = saudiStocks.find(s => s.symbol === '1120.SR');
assert(alrajhi !== undefined, "Al Rajhi Bank (1120.SR) exists in universe");

// Test recommendation generation for all 12 Saudi stocks
let allPassedRec = true;
saudiStocks.forEach(stock => {
  const rec = generateStockRecommendation(stock);
  if (rec.convictionScore < 0 || rec.convictionScore > 100) allPassedRec = false;
  if (!rec.recType || !rec.recType.key || !rec.recType.labelAr) allPassedRec = false;
  if (rec.targetPrice12M <= 0) allPassedRec = false;
  if (rec.targetPrice3M <= 0) allPassedRec = false;
  if (rec.stopLoss <= 0 || rec.stopLoss >= rec.currentPrice) allPassedRec = false;
  if (rec.riskRewardRatio <= 0) allPassedRec = false;
  if (!rec.justifications.fundamentalAr || !rec.justifications.technicalAr) allPassedRec = false;
});
assert(allPassedRec, "All 12 Saudi stocks generated valid quantitative recommendations & forecasts");

// Deep check on Aramco recommendation & Official Spot Calibration
const aramcoRec = generateStockRecommendation(aramco);
assert(aramcoRec.currentPrice === 25.74, `Aramco spot price matches official Tadawul close: 25.74 SAR (Actual: ${aramcoRec.currentPrice})`);
assert(aramcoRec.stopLoss < aramcoRec.currentPrice, `Aramco stop-loss is placed below spot (Stop-loss: ${aramcoRec.stopLoss} SAR)`);
assert(aramcoRec.riskRewardRatio > 0, `Aramco risk/reward ratio is positive (Actual: 1:${aramcoRec.riskRewardRatio})`);
assert(aramcoRec.justifications.fundamentalAr.includes("القيمة الجوهرية"), "Aramco fundamental justification includes DCF explanation");
assert(aramcoRec.justifications.technicalAr.includes("RSI"), "Aramco technical justification includes RSI analysis");

// Official Tadawul Price Benchmarks Verification for all stocks
const officialBenchmarks = {
  '2082.SR': 166.10, // ACWA Power
  '2222.SR': 25.74,  // Aramco
  '1120.SR': 62.35,  // Al Rajhi Bank
  '7203.SR': 592.00, // Elm
  '1211.SR': 62.00,  // Ma'aden
  '2010.SR': 46.50,  // SABIC
  '7010.SR': 42.60,  // stc
  '4263.SR': 174.00, // SAL Logistics
  '1150.SR': 23.85,  // Alinma Bank
  '1180.SR': 37.86,  // SNB
  '4190.SR': 16.00,  // Jarir
  '2020.SR': 116.70  // SABIC Agri-Nutrients
};

for (const [sym, expectedSpot] of Object.entries(officialBenchmarks)) {
  const stock = saudiStocks.find(s => s.symbol === sym);
  const actualClose = stock.prices[stock.prices.length - 1].close;
  assert(actualClose === expectedSpot, `${stock.nameAr} (${sym}) terminal close matches exact Tadawul price: ${expectedSpot} SAR (Actual: ${actualClose})`);
}

// --- TEST SUITE 11: Paper Trading Wallet & Virtual Execution Engine ---
console.log("\n▶ Suite 11: Paper Trading Wallet & Virtual Order Execution");
const wallet = new PaperTradingWallet(100000);
wallet.reset(100000);
assert(wallet.cash === 100000, "Wallet initializes with exactly 100,000 SAR cash balance");

// Test BUY execution: 100 shares of Aramco at 25.74 SAR
const buyRes = wallet.executeOrder({
  symbol: "2222.SR",
  shortCode: "2222",
  type: "BUY",
  shares: 100,
  price: 25.74
});
assert(buyRes.success === true, "Market BUY order executed successfully");
assertCloseTo(wallet.cash, 100000 - 2574, 1e-4, "Cash correctly deducted after BUY order (97,426 SAR)");
assert(wallet.positions["2222.SR"].shares === 100, "Position holds exactly 100 shares of Aramco");
assertCloseTo(wallet.positions["2222.SR"].avgPrice, 25.74, 1e-4, "Average price matches purchase price (25.74 SAR)");

// Test Insufficient funds validation
const invalidBuy = wallet.executeOrder({
  symbol: "7203.SR",
  type: "BUY",
  shares: 10000,
  price: 592.00
});
assert(invalidBuy.success === false, "Rejects order when capital is insufficient");

// Test Partial SELL execution: 40 shares of Aramco at 28.00 SAR
const sellRes = wallet.executeOrder({
  symbol: "2222.SR",
  shortCode: "2222",
  type: "SELL",
  shares: 40,
  price: 28.00
});
assert(sellRes.success === true, "Market SELL order executed successfully");
assert(wallet.positions["2222.SR"].shares === 60, "Remaining position holds exactly 60 shares");
assertCloseTo(sellRes.transaction.realizedPnL, 90.40, 0.01, "Realized profit calculated accurately (+90.40 SAR)");

// Test Summary with current spot prices
const summary = wallet.getSummary({ "2222.SR": 25.74 });
assert(summary.positions.length === 1, "Summary lists 1 active position");
assert(summary.totalEquity > 100000, "Total equity reflects realized profit");

// --- TEST SUITE 12: Custom Saudi Portfolio Simulator & DRIP Compounding ---
console.log("\n▶ Suite 12: Custom Portfolio Allocation & DRIP Compounding");
const simAssets = [
  { symbol: "2222.SR", spotPrice: 25.74, annualReturn: 0.075, annualVolatility: 0.15, dividendYield: 0.068, beta: 0.65 },
  { symbol: "1120.SR", spotPrice: 62.35, annualReturn: 0.12, annualVolatility: 0.19, dividendYield: 0.038, beta: 1.12 }
];
const simResult = simulateCustomPortfolio({
  assets: simAssets,
  weights: [0.60, 0.40],
  capitalSAR: 100000
});

assert(simResult.expectedReturn > 8 && simResult.expectedReturn < 11, "Portfolio expected annual return in realistic corridor");
assert(simResult.annualDividendIncomeSAR > 5000, "Annual cash dividend correctly computed (> 5,000 SAR)");
assertCloseTo(simResult.quarterlyDividendIncomeSAR, simResult.annualDividendIncomeSAR / 4, 0.01, "Quarterly dividend is exactly 1/4th of annual payout");

// DRIP Compounding verification
const drip = calculateDRIPCompounding({
  principalSAR: 50000,
  annualCapitalAppreciation: 0.07,
  dividendYield: 0.05,
  years: 10
});
assert(drip.yearlyProgression.length === 11, "DRIP progression generates 11 milestones (Year 0 to 10)");
assert(drip.finalDRIPWealth > drip.finalNoDRIPWealth, "DRIP reinvestment yields significantly higher total wealth than cash withdrawal");
assert(drip.dripAdvantageSAR > 0, "DRIP wealth advantage is strictly positive (> 0 SAR)");

console.log("\n============================================================");
console.log(`📊 TEST RESULTS: Passed: ${passed} | Failed: ${failed}`);
if (failed === 0) {
  console.log("🎉 ALL AXIOM QUANTFINANCE MATHEMATICAL TESTS PASSED 100%!");
} else {
  console.error("❌ Some tests failed!");
  process.exit(1);
}
console.log("============================================================\n");
