/**
 * Axiom QuantFinance - Modern Portfolio Theory (MPT) & Markowitz Engine
 * Analytical Efficient Frontier, Global Min-Variance, and Tangency (Max Sharpe) Portfolio
 * @author أ. طارق ابوعشي
 */

import {
  computeCovarianceMatrix,
  invertMatrix,
  matrixVectorMultiply,
  dotProduct,
  portfolioVariance
} from '../math/matrix.js';
import { mean } from '../math/statistics.js';

export function runMarkowitzOptimization({
  assetSymbols,
  returnsMatrix, // Array of return vectors: [returnsAsset0, returnsAsset1, ...]
  riskFreeRate = 0.04
}) {
  const n = assetSymbols.length;
  if (n < 2) throw new Error("At least two assets are required for Markowitz portfolio optimization.");

  // 1. Calculate annualized expected returns and covariance matrix
  const expectedReturns = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    expectedReturns[i] = mean(returnsMatrix[i]) * 252; // Annualized
  }

  const dailyCovMatrix = computeCovarianceMatrix(returnsMatrix);
  // Annualize covariance matrix (* 252)
  const annualCovMatrix = dailyCovMatrix.map(row => row.map(cov => cov * 252));
  const invCovMatrix = invertMatrix(annualCovMatrix);

  // Vector of ones
  const ones = new Float64Array(n).fill(1.0);

  // Intermediate scalars for two-fund separation theorem
  // A = 1^T * Sigma^-1 * mu
  // B = mu^T * Sigma^-1 * mu
  // C = 1^T * Sigma^-1 * 1
  // D = B*C - A^2
  const invCovOnes = matrixVectorMultiply(invCovMatrix, ones);
  const invCovMu = matrixVectorMultiply(invCovMatrix, expectedReturns);

  const A = dotProduct(ones, invCovMu);
  const B = dotProduct(expectedReturns, invCovMu);
  const C = dotProduct(ones, invCovOnes);
  const D = B * C - A * A;

  // 2. Global Minimum Variance (GMV) Portfolio
  // w_min = Sigma^-1 * 1 / C
  const gmvWeights = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    gmvWeights[i] = invCovOnes[i] / C;
  }
  const gmvVariance = 1 / C;
  const gmvStdDev = Math.sqrt(gmvVariance);
  const gmvExpectedReturn = A / C;
  const gmvSharpe = (gmvExpectedReturn - riskFreeRate) / gmvStdDev;

  // 3. Tangency Portfolio (Maximum Sharpe Ratio)
  // w_tan = Sigma^-1 * (mu - Rf * 1) / (1^T * Sigma^-1 * (mu - Rf * 1))
  const excessReturns = new Float64Array(n);
  for (let i = 0; i < n; i++) excessReturns[i] = expectedReturns[i] - riskFreeRate;
  const invCovExcess = matrixVectorMultiply(invCovMatrix, excessReturns);
  const sumInvCovExcess = dotProduct(ones, invCovExcess);

  const tangencyWeights = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    tangencyWeights[i] = invCovExcess[i] / sumInvCovExcess;
  }
  const tangencyVar = portfolioVariance(tangencyWeights, annualCovMatrix);
  const tangencyStdDev = Math.sqrt(tangencyVar);
  const tangencyReturn = dotProduct(tangencyWeights, expectedReturns);
  const tangencySharpe = (tangencyReturn - riskFreeRate) / tangencyStdDev;

  // 4. Construct Analytical Efficient Frontier Curve
  // sigma^2(R) = (C * R^2 - 2*A*R + B) / D
  const minReturn = gmvExpectedReturn * 0.7;
  const maxReturn = Math.max(...expectedReturns) * 1.3;
  const curvePoints = [];
  const steps = 40;
  const stepReturn = (maxReturn - minReturn) / steps;

  for (let s = 0; s <= steps; s++) {
    const targetR = minReturn + s * stepReturn;
    const numerator = C * targetR * targetR - 2 * A * targetR + B;
    if (numerator >= 0 && D > 0) {
      const varR = numerator / D;
      const sigmaR = Math.sqrt(varR);
      curvePoints.push({
        expectedReturn: targetR,
        volatility: sigmaR,
        sharpe: (targetR - riskFreeRate) / sigmaR
      });
    }
  }

  // 5. Generate Random Portfolio Simulation Cloud (300 points for visualization)
  const randomPortfolios = [];
  for (let k = 0; k < 300; k++) {
    const rawW = new Float64Array(n);
    let sumW = 0;
    for (let i = 0; i < n; i++) {
      rawW[i] = Math.random();
      sumW += rawW[i];
    }
    for (let i = 0; i < n; i++) rawW[i] /= sumW; // Normalize to sum 1

    const portR = dotProduct(rawW, expectedReturns);
    const portV = Math.sqrt(portfolioVariance(rawW, annualCovMatrix));
    randomPortfolios.push({
      volatility: portV,
      expectedReturn: portR,
      sharpe: (portR - riskFreeRate) / portV
    });
  }

  return {
    assetSymbols,
    expectedReturns: Array.from(expectedReturns),
    annualCovMatrix,
    gmvPortfolio: {
      weights: Array.from(gmvWeights),
      expectedReturn: gmvExpectedReturn,
      volatility: gmvStdDev,
      sharpe: gmvSharpe
    },
    tangencyPortfolio: {
      weights: Array.from(tangencyWeights),
      expectedReturn: tangencyReturn,
      volatility: tangencyStdDev,
      sharpe: tangencySharpe
    },
    efficientFrontier: curvePoints,
    randomPortfolios
  };
}
