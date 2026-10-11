/**
 * Axiom QuantFinance - Monte Carlo Simulation Core
 * Geometric Brownian Motion (GBM) Paths, Percentile Envelopes & Terminal Distribution
 * @author أ. طارق ابوعشي
 */

import { sampleStandardNormal } from '../math/random.js';

/**
 * Geometric Brownian Motion (GBM) Simulation
 * dS = \mu * S * dt + \sigma * S * dW
 * S_{t+dt} = S_t * exp((\mu - 0.5 * \sigma^2)*dt + \sigma * sqrt(dt) * Z)
 * @param {Object} params
 * @param {number} params.S0 - Initial spot price
 * @param {number} params.mu - Drift rate (annualized expected return, e.g. 0.08)
 * @param {number} params.sigma - Volatility (annualized, e.g. 0.22)
 * @param {number} params.days - Simulation time horizon in trading days (e.g. 60)
 * @param {number} [params.numSimulations=1000] - Number of paths
 */
export function runMonteCarloSimulation({
  S0,
  mu,
  sigma,
  days,
  numSimulations = 1000
}) {
  const dt = 1 / 252; // Daily time step
  const drift = (mu - 0.5 * sigma * sigma) * dt;
  const volStep = sigma * Math.sqrt(dt);

  // Store representative paths for visual charting (e.g. 50 paths to keep UI light)
  const previewPathsCount = Math.min(50, numSimulations);
  const previewPaths = [];

  const finalPrices = new Float64Array(numSimulations);
  const matrixByDay = Array.from({ length: days + 1 }, () => new Float64Array(numSimulations));

  for (let sim = 0; sim < numSimulations; sim++) {
    let currentPrice = S0;
    matrixByDay[0][sim] = S0;

    let pathRecord = null;
    if (sim < previewPathsCount) {
      pathRecord = new Float64Array(days + 1);
      pathRecord[0] = S0;
    }

    for (let t = 1; t <= days; t++) {
      const z = sampleStandardNormal();
      currentPrice = currentPrice * Math.exp(drift + volStep * z);
      matrixByDay[t][sim] = currentPrice;
      if (pathRecord) pathRecord[t] = currentPrice;
    }

    finalPrices[sim] = currentPrice;
    if (pathRecord) previewPaths.push(pathRecord);
  }

  // Calculate Percentile Envelopes across time (5%, 25%, 50% Median, 75%, 95%)
  const percentiles = {
    p5: new Float64Array(days + 1),
    p25: new Float64Array(days + 1),
    p50: new Float64Array(days + 1),
    p75: new Float64Array(days + 1),
    p95: new Float64Array(days + 1)
  };

  for (let t = 0; t <= days; t++) {
    const sortedDay = Array.from(matrixByDay[t]).sort((a, b) => a - b);
    percentiles.p5[t] = sortedDay[Math.floor(numSimulations * 0.05)];
    percentiles.p25[t] = sortedDay[Math.floor(numSimulations * 0.25)];
    percentiles.p50[t] = sortedDay[Math.floor(numSimulations * 0.50)];
    percentiles.p75[t] = sortedDay[Math.floor(numSimulations * 0.75)];
    percentiles.p95[t] = sortedDay[Math.floor(numSimulations * 0.95)];
  }

  // Sorted Terminal Prices for Histogram & VaR
  const sortedFinals = Array.from(finalPrices).sort((a, b) => a - b);
  const minFinal = sortedFinals[0];
  const maxFinal = sortedFinals[sortedFinals.length - 1];

  // Build 25-bin Histogram for terminal distribution
  const numBins = 25;
  const binWidth = (maxFinal - minFinal) / numBins;
  const histogram = Array.from({ length: numBins }, (_, idx) => ({
    binStart: minFinal + idx * binWidth,
    binEnd: minFinal + (idx + 1) * binWidth,
    count: 0
  }));

  for (let i = 0; i < sortedFinals.length; i++) {
    const val = sortedFinals[i];
    let bIdx = Math.floor((val - minFinal) / binWidth);
    if (bIdx >= numBins) bIdx = numBins - 1;
    histogram[bIdx].count++;
  }

  return {
    S0,
    days,
    numSimulations,
    previewPaths,
    percentiles,
    terminalMean: percentiles.p50[days],
    minTerminal: minFinal,
    maxTerminal: maxFinal,
    histogram,
    sortedFinals
  };
}
