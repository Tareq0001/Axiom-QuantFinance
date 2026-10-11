/**
 * Axiom QuantFinance - Implied Volatility (IV) Numerical Solver
 * Newton-Raphson with Vega derivative & Brent Method Robust Fallback
 * @author أ. طارق ابوعشي
 */

import { calculateBSM } from './black-scholes.js';
import { brentRoot } from '../math/solvers.js';

/**
 * Calculate Implied Volatility for an Option
 * @param {Object} params
 * @param {number} params.targetPrice - Observed market option price
 * @param {number} params.S - Spot price
 * @param {number} params.K - Strike price
 * @param {number} params.T - Time to expiration in years
 * @param {number} params.r - Risk-free interest rate
 * @param {number} [params.q=0] - Continuous dividend yield
 * @param {string} [params.type='call'] - 'call' or 'put'
 * @param {number} [params.tol=1e-6] - Convergence tolerance
 * @param {number} [params.maxIter=50] - Max iterations
 */
export function calculateImpliedVolatility({
  targetPrice,
  S,
  K,
  T,
  r,
  q = 0,
  type = 'call',
  tol = 1e-6,
  maxIter = 50
}) {
  const isCall = type.toLowerCase() === 'call';
  const intrinsic = isCall ? Math.max(0, S - K) : Math.max(0, K - S);

  if (targetPrice <= intrinsic) {
    return { iv: 0.0001, iterations: 0, converged: true, warning: "Price at or below intrinsic value" };
  }

  // 1. Initial Guess using Brenner & Subrahmanyam (1988) approximation
  let sigma = Math.sqrt((2 * Math.PI) / T) * (targetPrice / S);
  if (isNaN(sigma) || sigma <= 0.01) sigma = 0.25;
  if (sigma > 3.0) sigma = 0.50;

  // 2. Newton-Raphson Iteration
  for (let iter = 0; iter < maxIter; iter++) {
    const bsm = calculateBSM({ S, K, T, r, q, sigma, type });
    const diff = bsm.price - targetPrice;

    if (Math.abs(diff) < tol) {
      return { iv: sigma, iterations: iter, converged: true };
    }

    // Unscaled Vega: dPrice / dSigma = vega * 100
    const rawVega = bsm.vega * 100;

    if (rawVega < 1e-8) {
      // Vega is too flat (deep ITM or deep OTM), break to Brent fallback
      break;
    }

    const nextSigma = sigma - diff / rawVega;

    // Guard rails for sigma
    if (nextSigma <= 0.0001 || nextSigma > 5.0 || isNaN(nextSigma)) {
      break;
    }

    if (Math.abs(nextSigma - sigma) < tol) {
      return { iv: nextSigma, iterations: iter + 1, converged: true };
    }

    sigma = nextSigma;
  }

  // 3. Brent's Method Fallback in bracket [0.001, 4.0]
  const objective = (testVol) => {
    return calculateBSM({ S, K, T, r, q, sigma: testVol, type }).price - targetPrice;
  };

  const brentResult = brentRoot(objective, 0.0001, 5.0, tol, 60);
  return {
    iv: Math.max(0.0001, Math.min(5.0, brentResult.root)),
    iterations: brentResult.iterations,
    converged: brentResult.converged,
    method: "brent"
  };
}
