/**
 * Axiom QuantFinance - Portfolio Risk-Adjusted Performance Metrics
 * Sharpe, Sortino (Downside Risk), Max Drawdown (MDD), and Calmar Ratios
 * @author أ. طارق ابوعشي
 */

import { mean, stdDev } from '../math/statistics.js';

export function calculatePerformanceMetrics(returnsSeries, riskFreeRate = 0.04) {
  if (!returnsSeries || returnsSeries.length === 0) {
    return {
      annualizedReturn: 0,
      annualizedVolatility: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdownPct: 0,
      calmarRatio: 0,
      winRate: 0
    };
  }

  const n = returnsSeries.length;
  const dailyMean = mean(returnsSeries);
  const dailyStd = stdDev(returnsSeries);
  const annualizedReturn = dailyMean * 252;
  const annualizedVolatility = dailyStd * Math.sqrt(252);

  // Sharpe Ratio
  const sharpeRatio = annualizedVolatility > 0
    ? (annualizedReturn - riskFreeRate) / annualizedVolatility
    : 0;

  // Downside Deviation (Sortino Ratio)
  let sumNegativeSq = 0;
  let negativeCount = 0;
  for (let i = 0; i < n; i++) {
    if (returnsSeries[i] < 0) {
      sumNegativeSq += returnsSeries[i] * returnsSeries[i];
      negativeCount++;
    }
  }
  const downsideDeviation = Math.sqrt(sumNegativeSq / n) * Math.sqrt(252);
  const sortinoRatio = downsideDeviation > 0
    ? (annualizedReturn - riskFreeRate) / downsideDeviation
    : 0;

  // Maximum Drawdown (MDD) calculation over cumulative wealth path
  let peak = 1.0;
  let currentWealth = 1.0;
  let maxDrawdown = 0;
  let positiveDays = 0;

  for (let i = 0; i < n; i++) {
    currentWealth *= (1 + returnsSeries[i]);
    if (currentWealth > peak) peak = currentWealth;
    const drawdown = (peak - currentWealth) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    if (returnsSeries[i] > 0) positiveDays++;
  }

  const maxDrawdownPct = maxDrawdown * 100;
  const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;
  const winRate = (positiveDays / n) * 100;

  return {
    annualizedReturn,
    annualizedVolatility,
    sharpeRatio,
    sortinoRatio,
    downsideDeviation,
    maxDrawdownPct,
    calmarRatio,
    winRate,
    totalTradingDays: n
  };
}

/**
 * Rebalancing Engine
 * Compares current holdings against target weights and generates rebalancing orders
 */
export function generateRebalancingOrders({
  currentHoldings, // [{ symbol, shares, price }]
  targetWeights,   // { AAPL: 0.25, 2222: 0.30, ... }
  cashAvailable = 10000
}) {
  let totalEquity = 0;
  const positionValues = {};

  for (const h of currentHoldings) {
    const val = h.shares * h.price;
    positionValues[h.symbol] = val;
    totalEquity += val;
  }

  const totalPortfolioValue = totalEquity + cashAvailable;
  const orders = [];
  let turnoverAmount = 0;

  for (const symbol in targetWeights) {
    const targetPct = targetWeights[symbol];
    const targetVal = totalPortfolioValue * targetPct;
    const currentVal = positionValues[symbol] || 0;
    const currentHolding = currentHoldings.find(h => h.symbol === symbol);
    const price = currentHolding ? currentHolding.price : 100;

    const diffVal = targetVal - currentVal;
    turnoverAmount += Math.abs(diffVal);

    const sharesToTrade = Math.round(diffVal / price);
    if (sharesToTrade !== 0) {
      orders.push({
        symbol,
        action: sharesToTrade > 0 ? 'BUY' : 'SELL',
        shares: Math.abs(sharesToTrade),
        estimatedPrice: price,
        estimatedTotal: Math.abs(sharesToTrade * price),
        currentWeightPct: (currentVal / totalPortfolioValue) * 100,
        targetWeightPct: targetPct * 100
      });
    }
  }

  return {
    totalPortfolioValue,
    orders,
    turnoverAmount,
    turnoverRatePct: (turnoverAmount / (2 * totalPortfolioValue)) * 100
  };
}
