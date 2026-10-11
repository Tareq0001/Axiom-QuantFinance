/**
 * Axiom QuantFinance - Multi-Leg Options Strategy & Payoff Architecture
 * Payoff profiles, Breakevens, Max Profit/Loss & Aggregate Portfolio Greeks
 * @author أ. طارق ابوعشي
 */

import { calculateBSM } from './black-scholes.js';

export class OptionsStrategy {
  constructor(name = "Custom Strategy") {
    this.name = name;
    this.legs = []; // Array of { type: 'call'|'put'|'stock', side: 'buy'|'sell', qty: number, strike: number, premium: number, expiryT: number, iv: number }
  }

  addLeg(leg) {
    this.legs.push({
      id: Math.random().toString(36).substring(2, 9),
      type: leg.type.toLowerCase(), // 'call' | 'put' | 'stock'
      side: leg.side.toLowerCase(), // 'buy' | 'sell'
      qty: Math.abs(leg.qty || 1),
      strike: leg.strike || 0,
      premium: leg.premium || 0,
      expiryT: leg.expiryT || (30 / 365),
      iv: leg.iv || 0.20
    });
    return this;
  }

  /**
   * Calculate Net Premium (Debit = positive cost, Credit = negative cost)
   */
  getNetCost() {
    let cost = 0;
    for (const leg of this.legs) {
      const sign = leg.side === 'buy' ? 1 : -1;
      cost += sign * leg.premium * leg.qty * 100; // 100 shares per contract standard
    }
    return cost;
  }

  /**
   * Evaluate Payoff of the combined strategy at expiration for a given underlying price S_T
   */
  evaluatePayoffAtExpiry(ST) {
    let totalProfit = 0;
    for (const leg of this.legs) {
      const sign = leg.side === 'buy' ? 1 : -1;
      let legPayoff = 0;

      if (leg.type === 'call') {
        const intrinsic = Math.max(0, ST - leg.strike);
        legPayoff = sign * (intrinsic - leg.premium);
      } else if (leg.type === 'put') {
        const intrinsic = Math.max(0, leg.strike - ST);
        legPayoff = sign * (intrinsic - leg.premium);
      } else if (leg.type === 'stock') {
        legPayoff = sign * (ST - leg.premium); // premium is entry price for stock
      }

      totalProfit += legPayoff * leg.qty * 100;
    }
    return totalProfit;
  }

  /**
   * Evaluate Current Theoretical Value & PnL prior to expiry using BSM
   */
  evaluateCurrentPnL(S, r = 0.05, q = 0) {
    let currentPnL = 0;
    let delta = 0, gamma = 0, vega = 0, theta = 0, rho = 0;

    for (const leg of this.legs) {
      const sign = leg.side === 'buy' ? 1 : -1;
      if (leg.type === 'stock') {
        currentPnL += sign * (S - leg.premium) * leg.qty;
        delta += sign * leg.qty;
      } else {
        const bsm = calculateBSM({
          S,
          K: leg.strike,
          T: leg.expiryT,
          r,
          q,
          sigma: leg.iv,
          type: leg.type
        });
        const theoreticalValue = bsm.price;
        const pnlPerShare = sign * (theoreticalValue - leg.premium);
        currentPnL += pnlPerShare * leg.qty * 100;

        delta += sign * bsm.delta * leg.qty * 100;
        gamma += sign * bsm.gamma * leg.qty * 100;
        vega += sign * bsm.vega * leg.qty * 100;
        theta += sign * bsm.theta * leg.qty * 100;
        rho += sign * bsm.rho * leg.qty * 100;
      }
    }

    return {
      currentPnL,
      greeks: { delta, gamma, vega, theta, rho }
    };
  }

  /**
   * Generate Full Curve for Charting and Analytical Boundaries
   */
  generatePayoffCurve(spotPrice, rangePct = 0.40, steps = 100, r = 0.05) {
    const minS = Math.max(0.1, spotPrice * (1 - rangePct));
    const maxS = spotPrice * (1 + rangePct);
    const stepSize = (maxS - minS) / steps;

    const pricePoints = [];
    const expiryPayoffs = [];
    const currentPayoffs = [];

    let maxProfit = -Infinity;
    let maxLoss = Infinity;
    const breakevens = [];

    let prevPayoff = null;

    for (let i = 0; i <= steps; i++) {
      const s = minS + i * stepSize;
      const expiryPnl = this.evaluatePayoffAtExpiry(s);
      const currentVal = this.evaluateCurrentPnL(s, r).currentPnL;

      pricePoints.push(s);
      expiryPayoffs.push(expiryPnl);
      currentPayoffs.push(currentVal);

      if (expiryPnl > maxProfit) maxProfit = expiryPnl;
      if (expiryPnl < maxLoss) maxLoss = expiryPnl;

      // Breakeven crossing check
      if (prevPayoff !== null && ((prevPayoff <= 0 && expiryPnl >= 0) || (prevPayoff >= 0 && expiryPnl <= 0))) {
        // Linear interpolation for exact zero crossing
        const prevS = s - stepSize;
        const zeroS = prevS - prevPayoff * ((s - prevS) / (expiryPnl - prevPayoff));
        breakevens.push(Number(zeroS.toFixed(2)));
      }
      prevPayoff = expiryPnl;
    }

    const netCost = this.getNetCost();
    const isDebit = netCost > 0;

    return {
      name: this.name,
      legs: this.legs,
      netCost,
      isDebit,
      maxProfit: Math.abs(maxProfit) > 1e7 ? Infinity : maxProfit,
      maxLoss: Math.abs(maxLoss) > 1e7 ? -Infinity : maxLoss,
      breakevens: [...new Set(breakevens)],
      pricePoints,
      expiryPayoffs,
      currentPayoffs
    };
  }
}

/**
 * Strategy Templates Factory
 */
export function createStrategyTemplate(templateType, { S, T = 30 / 365, r = 0.05, iv = 0.25 }) {
  const roundedS = Math.round(S);
  const spreadDelta = Math.max(1, Math.round(S * 0.05)); // 5% strike step

  switch (templateType) {
    case 'bull_call_spread': {
      const strat = new OptionsStrategy("Bull Call Spread");
      const k1 = roundedS;
      const k2 = roundedS + spreadDelta;
      const bsm1 = calculateBSM({ S, K: k1, T, r, sigma: iv, type: 'call' });
      const bsm2 = calculateBSM({ S, K: k2, T, r, sigma: iv, type: 'call' });
      strat.addLeg({ type: 'call', side: 'buy', qty: 1, strike: k1, premium: bsm1.price, expiryT: T, iv });
      strat.addLeg({ type: 'call', side: 'sell', qty: 1, strike: k2, premium: bsm2.price, expiryT: T, iv });
      return strat;
    }

    case 'bear_put_spread': {
      const strat = new OptionsStrategy("Bear Put Spread");
      const k1 = roundedS - spreadDelta;
      const k2 = roundedS;
      const bsm1 = calculateBSM({ S, K: k1, T, r, sigma: iv, type: 'put' });
      const bsm2 = calculateBSM({ S, K: k2, T, r, sigma: iv, type: 'put' });
      strat.addLeg({ type: 'put', side: 'sell', qty: 1, strike: k1, premium: bsm1.price, expiryT: T, iv });
      strat.addLeg({ type: 'put', side: 'buy', qty: 1, strike: k2, premium: bsm2.price, expiryT: T, iv });
      return strat;
    }

    case 'iron_condor': {
      const strat = new OptionsStrategy("Iron Condor");
      const putBuyK = roundedS - 2 * spreadDelta;
      const putSellK = roundedS - spreadDelta;
      const callSellK = roundedS + spreadDelta;
      const callBuyK = roundedS + 2 * spreadDelta;

      const pBuy = calculateBSM({ S, K: putBuyK, T, r, sigma: iv, type: 'put' });
      const pSell = calculateBSM({ S, K: putSellK, T, r, sigma: iv, type: 'put' });
      const cSell = calculateBSM({ S, K: callSellK, T, r, sigma: iv, type: 'call' });
      const cBuy = calculateBSM({ S, K: callBuyK, T, r, sigma: iv, type: 'call' });

      strat.addLeg({ type: 'put', side: 'buy', qty: 1, strike: putBuyK, premium: pBuy.price, expiryT: T, iv });
      strat.addLeg({ type: 'put', side: 'sell', qty: 1, strike: putSellK, premium: pSell.price, expiryT: T, iv });
      strat.addLeg({ type: 'call', side: 'sell', qty: 1, strike: callSellK, premium: cSell.price, expiryT: T, iv });
      strat.addLeg({ type: 'call', side: 'buy', qty: 1, strike: callBuyK, premium: cBuy.price, expiryT: T, iv });
      return strat;
    }

    case 'long_straddle': {
      const strat = new OptionsStrategy("Long Straddle");
      const k = roundedS;
      const callBSM = calculateBSM({ S, K: k, T, r, sigma: iv, type: 'call' });
      const putBSM = calculateBSM({ S, K: k, T, r, sigma: iv, type: 'put' });
      strat.addLeg({ type: 'call', side: 'buy', qty: 1, strike: k, premium: callBSM.price, expiryT: T, iv });
      strat.addLeg({ type: 'put', side: 'buy', qty: 1, strike: k, premium: putBSM.price, expiryT: T, iv });
      return strat;
    }

    case 'covered_call': {
      const strat = new OptionsStrategy("Covered Call");
      const callK = roundedS + spreadDelta;
      const callBSM = calculateBSM({ S, K: callK, T, r, sigma: iv, type: 'call' });
      strat.addLeg({ type: 'stock', side: 'buy', qty: 100, strike: 0, premium: S, expiryT: T, iv: 0 });
      strat.addLeg({ type: 'call', side: 'sell', qty: 1, strike: callK, premium: callBSM.price, expiryT: T, iv });
      return strat;
    }

    default: {
      const strat = new OptionsStrategy("Single Call");
      const bsm = calculateBSM({ S, K: roundedS, T, r, sigma: iv, type: 'call' });
      strat.addLeg({ type: 'call', side: 'buy', qty: 1, strike: roundedS, premium: bsm.price, expiryT: T, iv });
      return strat;
    }
  }
}
