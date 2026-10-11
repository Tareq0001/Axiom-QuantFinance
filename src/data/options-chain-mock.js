/**
 * Axiom QuantFinance - Options Chains Matrix
 * Expiration Ladder, Strike Ladders, Bid/Ask Quotes, Volume, and Open Interest
 * @author أ. طارق ابوعشي
 */

import { calculateBSM } from '../core/derivatives/black-scholes.js';

export function generateOptionsChain(spotPrice, symbol = "SPY", r = 0.045, baseIV = 0.22) {
  const expirations = [
    { label: "7 Days (Weekly)", days: 7, T: 7 / 365 },
    { label: "30 Days (Monthly)", days: 30, T: 30 / 365 },
    { label: "60 Days (Bi-Monthly)", days: 60, T: 60 / 365 },
    { label: "90 Days (Quarterly)", days: 90, T: 90 / 365 },
    { label: "180 Days (Semi-Annual)", days: 180, T: 180 / 365 }
  ];

  // Strike step based on spot price magnitude
  const strikeStep = spotPrice > 300 ? 5 : (spotPrice > 100 ? 2.5 : 0.5);
  const atmStrike = Math.round(spotPrice / strikeStep) * strikeStep;

  // 15 strikes ladder (-7 to +7 strikes around ATM)
  const strikes = [];
  for (let i = -7; i <= 7; i++) {
    strikes.push(Number((atmStrike + i * strikeStep).toFixed(2)));
  }

  const chainByExpiration = {};

  for (const exp of expirations) {
    const contracts = [];

    for (const strike of strikes) {
      // Volatility Skew: OTM Puts have higher IV (Smile/Smirk)
      const moneyness = strike / spotPrice;
      const skewAdjustment = (1 - moneyness) * 0.15; // Higher IV for lower strikes
      const contractIV = Math.max(0.08, baseIV + skewAdjustment);

      // Call Contract Calculation
      const callBSM = calculateBSM({
        S: spotPrice,
        K: strike,
        T: exp.T,
        r,
        sigma: contractIV,
        type: 'call'
      });
      const callMid = Math.max(0.05, Number(callBSM.price.toFixed(2)));
      const callSpread = Math.max(0.02, Number((callMid * 0.02).toFixed(2)));

      // Put Contract Calculation
      const putBSM = calculateBSM({
        S: spotPrice,
        K: strike,
        T: exp.T,
        r,
        sigma: contractIV,
        type: 'put'
      });
      const putMid = Math.max(0.05, Number(putBSM.price.toFixed(2)));
      const putSpread = Math.max(0.02, Number((putMid * 0.02).toFixed(2)));

      // Liquidity simulation (highest at ATM)
      const distFromATM = Math.abs(strike - atmStrike) / strikeStep;
      const baseLiquidity = Math.max(50, Math.round(5000 / (1 + distFromATM)));

      contracts.push({
        strike,
        iv: Number(contractIV.toFixed(4)),
        call: {
          bid: Number((callMid - callSpread / 2).toFixed(2)),
          ask: Number((callMid + callSpread / 2).toFixed(2)),
          last: callMid,
          volume: Math.round(baseLiquidity * (0.8 + Math.random() * 0.4)),
          openInterest: Math.round(baseLiquidity * 4),
          delta: Number(callBSM.delta.toFixed(3)),
          gamma: Number(callBSM.gamma.toFixed(4)),
          vega: Number(callBSM.vega.toFixed(3)),
          theta: Number(callBSM.theta.toFixed(3)),
          intrinsic: Number(callBSM.intrinsicValue.toFixed(2)),
          timeValue: Number(callBSM.timeValue.toFixed(2))
        },
        put: {
          bid: Number((putMid - putSpread / 2).toFixed(2)),
          ask: Number((putMid + putSpread / 2).toFixed(2)),
          last: putMid,
          volume: Math.round(baseLiquidity * (0.8 + Math.random() * 0.4)),
          openInterest: Math.round(baseLiquidity * 4.2),
          delta: Number(putBSM.delta.toFixed(3)),
          gamma: Number(putBSM.gamma.toFixed(4)),
          vega: Number(putBSM.vega.toFixed(3)),
          theta: Number(putBSM.theta.toFixed(3)),
          intrinsic: Number(putBSM.intrinsicValue.toFixed(2)),
          timeValue: Number(putBSM.timeValue.toFixed(2))
        }
      });
    }

    chainByExpiration[exp.label] = {
      expiration: exp,
      contracts
    };
  }

  return {
    symbol,
    spotPrice,
    expirations,
    chainByExpiration
  };
}
