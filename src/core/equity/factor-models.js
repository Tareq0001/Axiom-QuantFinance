/**
 * Axiom QuantFinance - Factor Models & Asset Pricing Architecture
 * Capital Asset Pricing Model (CAPM), Beta Sensitivity, Jensen's Alpha & Information Ratio
 * @author أ. طارق ابوعشي
 */

import { covariance, variance, mean, stdDev } from '../math/statistics.js';

/**
 * Calculate Beta of an asset relative to market benchmark
 * \beta = Cov(R_asset, R_market) / Var(R_market)
 */
export function calculateBeta(assetReturns, marketReturns) {
  const cov = covariance(assetReturns, marketReturns);
  const mktVar = variance(marketReturns);
  if (mktVar === 0) return 1.0;
  return cov / mktVar;
}

/**
 * Capital Asset Pricing Model (CAPM) Metrics
 * E(R_i) = R_f + \beta * (E(R_m) - R_f)
 * Jensen's Alpha = Actual_Return - Expected_CAPM_Return
 */
export function calculateCAPM({
  assetReturns,
  marketReturns,
  riskFreeRate = 0.04 // Annualized
}) {
  const n = Math.min(assetReturns.length, marketReturns.length);
  const subAsset = assetReturns.slice(0, n);
  const subMarket = marketReturns.slice(0, n);

  // Annualize returns assuming daily data (252 days)
  const dailyRf = Math.pow(1 + riskFreeRate, 1 / 252) - 1;
  const assetMeanDaily = mean(subAsset);
  const marketMeanDaily = mean(subMarket);

  const annualizedAssetReturn = assetMeanDaily * 252;
  const annualizedMarketReturn = marketMeanDaily * 252;

  const beta = calculateBeta(subAsset, subMarket);
  const expectedReturnCAPM = riskFreeRate + beta * (annualizedMarketReturn - riskFreeRate);
  const jensenAlpha = annualizedAssetReturn - expectedReturnCAPM;

  // Treynor Ratio = (R_p - R_f) / Beta
  const treynorRatio = beta !== 0 ? (annualizedAssetReturn - riskFreeRate) / beta : 0;

  // Tracking Error and Information Ratio
  const excessReturns = [];
  for (let i = 0; i < n; i++) {
    excessReturns.push(subAsset[i] - subMarket[i]);
  }
  const trackingErrorDaily = stdDev(excessReturns);
  const annualizedTrackingError = trackingErrorDaily * Math.sqrt(252);
  const annualizedActiveReturn = annualizedAssetReturn - annualizedMarketReturn;
  const informationRatio = annualizedTrackingError > 0 ? annualizedActiveReturn / annualizedTrackingError : 0;

  return {
    beta,
    annualizedAssetReturn,
    annualizedMarketReturn,
    expectedReturnCAPM,
    jensenAlpha,
    treynorRatio,
    annualizedTrackingError,
    informationRatio
  };
}
