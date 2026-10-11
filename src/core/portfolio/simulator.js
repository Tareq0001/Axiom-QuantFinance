/**
 * Axiom QuantFinance - Custom Portfolio Simulator & Dividend Compounding Engine
 * Analytical multi-asset backtester, cash dividend projection, and DRIP models
 * @author أ. طارق ابوعشي
 */

import { matrixVectorMultiply, dotProduct } from '../math/matrix.js';

/**
 * Calculates portfolio statistics for arbitrary user-defined weights
 * @param {Object} params
 * @param {Array<Object>} params.assets - Selected asset definitions
 * @param {Array<number>} params.weights - Normalized weights array (sum = 1)
 * @param {number} params.capitalSAR - Total investment capital in SAR (e.g. 100,000)
 */
export function simulateCustomPortfolio({ assets, weights, capitalSAR = 100000 }) {
  if (!assets || assets.length === 0 || !weights || weights.length !== assets.length) {
    throw new Error("Invalid assets or weights for portfolio simulation.");
  }

  // Normalize weights just in case
  const sumW = weights.reduce((a, b) => a + b, 0);
  const normalizedWeights = sumW > 0 ? weights.map(w => w / sumW) : weights.map(() => 1 / weights.length);

  // Expected Annual Return
  let expectedReturn = 0;
  let weightedDividendYield = 0;
  let weightedBeta = 0;

  assets.forEach((asset, i) => {
    const w = normalizedWeights[i];
    expectedReturn += w * (asset.annualReturn || 0.08);
    weightedDividendYield += w * (asset.dividendYield || 0.03);
    weightedBeta += w * (asset.beta || 1.0);
  });

  // Approximate portfolio volatility using individual volatilities and pairwise correlation assumption (rho ~ 0.35 in TASI)
  let variance = 0;
  for (let i = 0; i < assets.length; i++) {
    for (let j = 0; j < assets.length; j++) {
      const rho = i === j ? 1.0 : 0.35;
      const sigmaI = assets[i].annualVolatility || 0.20;
      const sigmaJ = assets[j].annualVolatility || 0.20;
      variance += normalizedWeights[i] * normalizedWeights[j] * rho * sigmaI * sigmaJ;
    }
  }
  const volatility = Math.sqrt(Math.max(0, variance));
  const sharpe = volatility > 0 ? (expectedReturn - 0.045) / volatility : 0;

  // Annual & Quarterly Dividend Cash Flow in SAR
  const annualDividendIncomeSAR = capitalSAR * weightedDividendYield;
  const quarterlyDividendIncomeSAR = annualDividendIncomeSAR / 4;

  // Allocation breakdown per asset
  const breakdown = assets.map((asset, i) => {
    const weight = normalizedWeights[i];
    const allocatedCapital = capitalSAR * weight;
    const sharesCount = Math.floor(allocatedCapital / asset.spotPrice);
    const annualDivSAR = allocatedCapital * (asset.dividendYield || 0);

    return {
      symbol: asset.symbol,
      shortCode: asset.shortCode || asset.symbol.replace('.SR', ''),
      nameAr: asset.nameAr,
      nameEn: asset.nameEn,
      weight: Number((weight * 100).toFixed(1)),
      spotPrice: asset.spotPrice,
      allocatedCapital: Number(allocatedCapital.toFixed(2)),
      sharesCount,
      dividendYieldPct: Number(((asset.dividendYield || 0) * 100).toFixed(2)),
      annualDivSAR: Number(annualDivSAR.toFixed(2))
    };
  });

  return {
    capitalSAR,
    expectedReturn: Number((expectedReturn * 100).toFixed(2)),
    volatility: Number((volatility * 100).toFixed(2)),
    sharpe: Number(sharpe.toFixed(2)),
    weightedBeta: Number(weightedBeta.toFixed(2)),
    weightedDividendYieldPct: Number((weightedDividendYield * 100).toFixed(2)),
    annualDividendIncomeSAR: Number(annualDividendIncomeSAR.toFixed(2)),
    quarterlyDividendIncomeSAR: Number(quarterlyDividendIncomeSAR.toFixed(2)),
    breakdown
  };
}

/**
 * Simulates Dividend Reinvestment Plan (DRIP) compounding vs cash withdrawal over N years
 * @param {Object} params
 * @param {number} params.principalSAR - Initial capital in SAR (e.g. 50,000)
 * @param {number} params.annualCapitalAppreciation - Stock price annual growth rate (e.g. 0.07)
 * @param {number} params.dividendYield - Annual dividend yield (e.g. 0.055)
 * @param {number} params.years - Simulation horizon in years (default: 10)
 */
export function calculateDRIPCompounding({ principalSAR = 50000, annualCapitalAppreciation = 0.07, dividendYield = 0.05, years = 10 }) {
  const yearlyProgression = [];

  let balanceWithDRIP = principalSAR;
  let balanceWithoutDRIP = principalSAR;
  let cumulativeCashDividends = 0;

  yearlyProgression.push({
    year: 0,
    balanceWithDRIP: Math.round(balanceWithDRIP),
    balanceWithoutDRIP: Math.round(balanceWithoutDRIP),
    cumulativeCashDividends: 0,
    totalWealthWithoutDRIP: Math.round(balanceWithoutDRIP)
  });

  for (let y = 1; y <= years; y++) {
    // 1. With DRIP: dividends are automatically reinvested into buying more shares
    const totalReturnWithDRIP = annualCapitalAppreciation + dividendYield;
    balanceWithDRIP = balanceWithDRIP * (1 + totalReturnWithDRIP);

    // 2. Without DRIP: dividends are taken as cash, principal only grows by capital appreciation
    const annualDivCash = balanceWithoutDRIP * dividendYield;
    cumulativeCashDividends += annualDivCash;
    balanceWithoutDRIP = balanceWithoutDRIP * (1 + annualCapitalAppreciation);

    yearlyProgression.push({
      year: y,
      balanceWithDRIP: Math.round(balanceWithDRIP),
      balanceWithoutDRIP: Math.round(balanceWithoutDRIP),
      cumulativeCashDividends: Math.round(cumulativeCashDividends),
      totalWealthWithoutDRIP: Math.round(balanceWithoutDRIP + cumulativeCashDividends)
    });
  }

  const finalDRIPWealth = Math.round(balanceWithDRIP);
  const finalNoDRIPWealth = Math.round(balanceWithoutDRIP + cumulativeCashDividends);
  const dripAdvantageSAR = finalDRIPWealth - finalNoDRIPWealth;
  const dripAdvantagePct = Number(((dripAdvantageSAR / finalNoDRIPWealth) * 100).toFixed(1));

  return {
    principalSAR,
    years,
    finalDRIPWealth,
    finalNoDRIPWealth,
    dripAdvantageSAR,
    dripAdvantagePct,
    yearlyProgression
  };
}
