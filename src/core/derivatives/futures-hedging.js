/**
 * Axiom QuantFinance - Futures Pricing & Hedging Engineering
 * Cost of Carry, Basis Risk, and Minimum-Variance Optimal Hedge Ratio
 * @author أ. طارق ابوعشي
 */

/**
 * Futures / Forward Price via Cost of Carry Model
 * F_0 = S_0 * exp((r - q + u) * T)
 * @param {Object} params
 * @param {number} params.S0 - Spot price of underlying asset
 * @param {number} params.r - Risk-free interest rate
 * @param {number} [params.q=0] - Income yield / dividend yield
 * @param {number} [params.u=0] - Continuous storage cost rate
 * @param {number} params.T - Time to delivery in years
 */
export function calculateFuturesPrice({ S0, r, q = 0, u = 0, T }) {
  const costOfCarryRate = r - q + u;
  const futuresPrice = S0 * Math.exp(costOfCarryRate * T);
  const netFinancingCost = futuresPrice - S0;
  return {
    futuresPrice,
    netFinancingCost,
    costOfCarryRate,
    theoreticalBasis: S0 - futuresPrice
  };
}

/**
 * Optimal Hedge Ratio (Minimum Variance Hedging)
 * h* = rho * (sigma_S / sigma_F)
 * @param {number} sigmaSpot - Standard deviation of spot price changes
 * @param {number} sigmaFutures - Standard deviation of futures price changes
 * @param {number} correlation - Correlation coefficient between spot and futures changes
 */
export function calculateOptimalHedgeRatio(sigmaSpot, sigmaFutures, correlation) {
  if (sigmaFutures <= 0) return { hStar: 1.0, hedgeEffectiveness: 1.0 };
  const hStar = correlation * (sigmaSpot / sigmaFutures);
  const hedgeEffectiveness = correlation * correlation; // R-squared
  return {
    hStar,
    hedgeEffectiveness
  };
}

/**
 * Portfolio Beta-Neutral Futures Hedging
 * N* = (beta_target - beta_portfolio) * (V_portfolio / V_futures)
 */
export function calculateBetaHedge({
  portfolioValue,
  portfolioBeta,
  targetBeta = 0,
  futuresPrice,
  contractMultiplier = 1
}) {
  const futuresContractValue = futuresPrice * contractMultiplier;
  if (futuresContractValue <= 0) return { contractsNeeded: 0, direction: 'none' };

  const betaDifference = targetBeta - portfolioBeta;
  const rawContracts = betaDifference * (portfolioValue / futuresContractValue);
  const contractsNeeded = Math.round(rawContracts);

  return {
    contractsNeeded: Math.abs(contractsNeeded),
    direction: contractsNeeded < 0 ? 'short' : (contractsNeeded > 0 ? 'long' : 'none'),
    rawContracts,
    hedgedPortfolioValue: portfolioValue
  };
}
