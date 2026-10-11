/**
 * Axiom QuantFinance - Value at Risk (VaR) & Conditional VaR (CVaR) Engine
 * Parametric (Delta-Normal), Historical Simulation, and Monte Carlo Quantitative Estimations
 * @author أ. طارق ابوعشي
 */

import { mean, stdDev, inverseNormalCDF } from '../math/statistics.js';

/**
 * Calculate Value at Risk and Expected Shortfall across multiple methodologies
 * @param {Object} params
 * @param {Array<number>} params.historicalReturns - Array of daily percentage returns (e.g. [0.01, -0.02, ...])
 * @param {number} params.portfolioValue - Current cash portfolio valuation
 * @param {number} [params.confidenceLevel=0.95] - Confidence level (0.95 or 0.99)
 * @param {number} [params.holdingPeriodDays=1] - Horizon in days
 */
export function calculateRiskMetrics({
  historicalReturns,
  portfolioValue,
  confidenceLevel = 0.95,
  holdingPeriodDays = 1
}) {
  const alpha = 1 - confidenceLevel;
  const sqrtDays = Math.sqrt(holdingPeriodDays);

  // 1. Parametric (Delta-Normal) VaR
  const mu = mean(historicalReturns);
  const sigma = stdDev(historicalReturns);
  const zScore = inverseNormalCDF(confidenceLevel);

  // Normal distribution VaR percentage loss
  const parametricVaRPct = (zScore * sigma - mu) * sqrtDays;
  const parametricVaR = Math.max(0, parametricVaRPct * portfolioValue);

  // Parametric CVaR: E[X | X > VaR] for standard normal is mu + sigma * (phi(z) / alpha)
  const zDensity = Math.exp(-0.5 * zScore * zScore) / Math.sqrt(2 * Math.PI);
  const parametricCVaRPct = (sigma * (zDensity / alpha) - mu) * sqrtDays;
  const parametricCVaR = Math.max(0, parametricCVaRPct * portfolioValue);

  // 2. Historical Simulation VaR
  const sortedReturns = Array.from(historicalReturns).sort((a, b) => a - b);
  const cutoffIndex = Math.max(0, Math.floor(alpha * sortedReturns.length));
  const historicalVaRPct = -sortedReturns[cutoffIndex] * sqrtDays;
  const historicalVaR = Math.max(0, historicalVaRPct * portfolioValue);

  // Historical CVaR: Average of returns in the tail below cutoff
  let tailSum = 0;
  for (let i = 0; i <= cutoffIndex; i++) {
    tailSum += sortedReturns[i];
  }
  const historicalCVaRPct = -(tailSum / (cutoffIndex + 1)) * sqrtDays;
  const historicalCVaR = Math.max(0, historicalCVaRPct * portfolioValue);

  return {
    confidenceLevel,
    holdingPeriodDays,
    portfolioValue,
    dailyMu: mu,
    dailySigma: sigma,
    parametric: {
      varPct: parametricVaRPct,
      varAmount: parametricVaR,
      cvarPct: parametricCVaRPct,
      cvarAmount: parametricCVaR
    },
    historical: {
      varPct: historicalVaRPct,
      varAmount: historicalVaR,
      cvarPct: historicalCVaRPct,
      cvarAmount: historicalCVaR
    }
  };
}

/**
 * Monte Carlo VaR & CVaR from simulated final price outcomes
 */
export function calculateMonteCarloVaR(S0, sortedFinalPrices, portfolioValue = 100000, confidenceLevel = 0.95) {
  const alpha = 1 - confidenceLevel;
  const n = sortedFinalPrices.length;
  const cutoffIdx = Math.max(0, Math.floor(alpha * n));

  const cutoffPrice = sortedFinalPrices[cutoffIdx];
  const lossPct = Math.max(0, (S0 - cutoffPrice) / S0);
  const varAmount = lossPct * portfolioValue;

  let sumTailLoss = 0;
  for (let i = 0; i <= cutoffIdx; i++) {
    sumTailLoss += Math.max(0, (S0 - sortedFinalPrices[i]) / S0);
  }
  const cvarPct = sumTailLoss / (cutoffIdx + 1);
  const cvarAmount = cvarPct * portfolioValue;

  return {
    confidenceLevel,
    lossPct,
    varAmount,
    cvarPct,
    cvarAmount,
    cutoffPrice
  };
}
