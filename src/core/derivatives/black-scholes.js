/**
 * Axiom QuantFinance - Black-Scholes-Merton (BSM) Options Pricing Engine
 * Analytical Option Valuation with Continuous Dividends & Full Greek Sensitivities
 * @author أ. طارق ابوعشي
 */

import { normalCDF, normalPDF } from '../math/statistics.js';

/**
 * Price European Options and Calculate First & Second Order Greeks
 * @param {Object} params
 * @param {number} params.S - Underlying asset spot price
 * @param {number} params.K - Strike price
 * @param {number} params.T - Time to expiration in years (e.g. 30 days = 30/365)
 * @param {number} params.r - Risk-free interest rate (annualized, e.g. 0.05 for 5%)
 * @param {number} [params.q=0] - Continuous dividend yield (annualized, e.g. 0.015 for 1.5%)
 * @param {number} params.sigma - Volatility (annualized standard deviation, e.g. 0.20 for 20%)
 * @param {string} [params.type='call'] - 'call' or 'put'
 */
export function calculateBSM({ S, K, T, r, q = 0, sigma, type = 'call' }) {
  const isCall = type.toLowerCase() === 'call';

  // Boundary conditions at expiration T <= 0
  if (T <= 0 || sigma <= 0) {
    const intrinsic = isCall ? Math.max(0, S - K) : Math.max(0, K - S);
    let delta = 0;
    if (isCall) {
      delta = S > K ? 1 : (S === K ? 0.5 : 0);
    } else {
      delta = S < K ? -1 : (S === K ? -0.5 : 0);
    }
    return {
      price: intrinsic,
      intrinsicValue: intrinsic,
      timeValue: 0,
      delta,
      gamma: 0,
      vega: 0,
      theta: 0,
      rho: 0,
      vanna: 0,
      volga: 0,
      d1: 0,
      d2: 0
    };
  }

  const sqrtT = Math.sqrt(T);
  const sigmaSqrtT = sigma * sqrtT;
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / sigmaSqrtT;
  const d2 = d1 - sigmaSqrtT;

  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const N_minus_d1 = normalCDF(-d1);
  const N_minus_d2 = normalCDF(-d2);
  const nd1 = normalPDF(d1);

  const exp_qT = Math.exp(-q * T);
  const exp_rT = Math.exp(-r * T);

  let price, delta, rho;

  if (isCall) {
    price = S * exp_qT * Nd1 - K * exp_rT * Nd2;
    delta = exp_qT * Nd1;
    // Rho: Derivative with respect to r (scaled to 1% move)
    rho = (K * T * exp_rT * Nd2) / 100;
  } else {
    price = K * exp_rT * N_minus_d2 - S * exp_qT * N_minus_d1;
    delta = -exp_qT * N_minus_d1;
    // Rho: Derivative with respect to r (scaled to 1% move)
    rho = (-K * T * exp_rT * N_minus_d2) / 100;
  }

  // Ensure non-negative option price
  price = Math.max(0, price);

  // Gamma: Second derivative w.r.t underlying S
  const gamma = (exp_qT * nd1) / (S * sigmaSqrtT);

  // Vega: Derivative w.r.t volatility sigma (scaled to 1% move)
  const vega = (S * exp_qT * nd1 * sqrtT) / 100;

  // Theta: Derivative w.r.t time to expiration (scaled to 1 day move, decay)
  let thetaYear;
  if (isCall) {
    thetaYear = - (S * sigma * exp_qT * nd1) / (2 * sqrtT)
                + q * S * exp_qT * Nd1
                - r * K * exp_rT * Nd2;
  } else {
    thetaYear = - (S * sigma * exp_qT * nd1) / (2 * sqrtT)
                - q * S * exp_qT * N_minus_d1
                + r * K * exp_rT * N_minus_d2;
  }
  const theta = thetaYear / 365;

  // Higher Order Greeks
  // Vanna = dDelta / dVol = dVega / dS
  const vanna = (-exp_qT * nd1 * (d2 / sigma)) / 100;
  // Volga (Vomma) = dVega / dVol
  const volga = (vega * 100 * (d1 * d2 / sigma)) / 10000;

  const intrinsic = isCall ? Math.max(0, S - K) : Math.max(0, K - S);
  const timeValue = Math.max(0, price - intrinsic);

  return {
    price,
    intrinsicValue: intrinsic,
    timeValue,
    delta,
    gamma,
    vega,
    theta,
    rho,
    vanna,
    volga,
    d1,
    d2
  };
}
