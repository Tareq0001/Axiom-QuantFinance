/**
 * Axiom QuantFinance - Cox-Ross-Rubinstein (CRR) Binomial Tree Model
 * American and European Options Pricing with Backward Induction & Early Exercise Premium
 * @author أ. طارق ابوعشي
 */

/**
 * Price Options using Binomial Lattice Model
 * @param {Object} params
 * @param {number} params.S - Spot price
 * @param {number} params.K - Strike price
 * @param {number} params.T - Time to expiration in years
 * @param {number} params.r - Risk-free interest rate
 * @param {number} [params.q=0] - Continuous dividend yield
 * @param {number} params.sigma - Volatility
 * @param {number} [params.steps=50] - Number of tree steps
 * @param {string} [params.type='call'] - 'call' or 'put'
 * @param {string} [params.style='american'] - 'american' or 'european'
 */
export function calculateBinomialTree({
  S,
  K,
  T,
  r,
  q = 0,
  sigma,
  steps = 50,
  type = 'call',
  style = 'american'
}) {
  const isCall = type.toLowerCase() === 'call';
  const isAmerican = style.toLowerCase() === 'american';

  if (T <= 0 || steps < 1) {
    const intrinsic = isCall ? Math.max(0, S - K) : Math.max(0, K - S);
    return { price: intrinsic, earlyExercisePremium: 0, delta: 0, gamma: 0, steps };
  }

  const dt = T / steps;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  const discount = Math.exp(-r * dt);
  const p = (Math.exp((r - q) * dt) - d) / (u - d);
  const oneMinusP = 1 - p;

  // Initialize terminal payoff at maturity step N
  // In CRR tree, at step N there are N+1 nodes: S * u^j * d^(N-j) for j = 0..N
  const optionValues = new Float64Array(steps + 1);
  const assetPrices = new Float64Array(steps + 1);

  for (let j = 0; j <= steps; j++) {
    const assetPriceAtExpiry = S * Math.pow(u, j) * Math.pow(d, steps - j);
    assetPrices[j] = assetPriceAtExpiry;
    optionValues[j] = isCall
      ? Math.max(0, assetPriceAtExpiry - K)
      : Math.max(0, K - assetPriceAtExpiry);
  }

  // Backward Induction through the lattice
  let step1Values = null;
  let step1Assets = null;
  let step2Values = null;
  let step2Assets = null;

  for (let step = steps - 1; step >= 0; step--) {
    for (let j = 0; j <= step; j++) {
      const currentAsset = S * Math.pow(u, j) * Math.pow(d, step - j);
      const continuationValue = discount * (p * optionValues[j + 1] + oneMinusP * optionValues[j]);

      if (isAmerican) {
        const intrinsicValue = isCall
          ? Math.max(0, currentAsset - K)
          : Math.max(0, K - currentAsset);
        optionValues[j] = Math.max(intrinsicValue, continuationValue);
      } else {
        optionValues[j] = continuationValue;
      }
    }

    if (step === 2) {
      step2Values = [optionValues[0], optionValues[1], optionValues[2]];
      step2Assets = [S * d * d, S, S * u * u];
    }
    if (step === 1) {
      step1Values = [optionValues[0], optionValues[1]];
      step1Assets = [S * d, S * u];
    }
  }

  const price = optionValues[0];

  // Tree Numerical Greeks Calculation
  let delta = 0;
  let gamma = 0;
  if (step1Values && step1Assets) {
    const dS = step1Assets[1] - step1Assets[0];
    delta = dS !== 0 ? (step1Values[1] - step1Values[0]) / dS : 0;
  }

  if (step2Values && step2Assets && step1Assets) {
    const deltaUp = (step2Values[2] - step2Values[1]) / (step2Assets[2] - step2Assets[1]);
    const deltaDown = (step2Values[1] - step2Values[0]) / (step2Assets[1] - step2Assets[0]);
    const h = 0.5 * (step2Assets[2] - step2Assets[0]);
    gamma = h !== 0 ? (deltaUp - deltaDown) / h : 0;
  }

  return {
    price,
    delta,
    gamma,
    u,
    d,
    p,
    steps,
    style
  };
}
