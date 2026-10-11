/**
 * Axiom QuantFinance - Quantitative Stock Recommendation & Price Forecast Engine
 * Multi-factor consensus combining DCF Intrinsic Value, Technical Oscillators, and Volatility Horizons
 * @author أ. طارق ابوعشي
 */

import { calculateDCF, calculateWACC } from './valuation-models.js';
import { calculateRSI, calculateSMA } from './technical-indicators.js';

export const RECOMMENDATION_TYPES = {
  STRONG_BUY: {
    key: 'STRONG_BUY',
    labelAr: 'شراء قوي',
    labelEn: 'Strong Buy',
    color: '#059669',
    badgeClass: 'badge-strong-buy'
  },
  BUY: {
    key: 'BUY',
    labelAr: 'شراء',
    labelEn: 'Buy',
    color: '#2563EB',
    badgeClass: 'badge-buy'
  },
  HOLD: {
    key: 'HOLD',
    labelAr: 'احتفاظ / حياد',
    labelEn: 'Hold / Neutral',
    color: '#D97706',
    badgeClass: 'badge-hold'
  },
  SELL: {
    key: 'SELL',
    labelAr: 'بيع / تخفيف',
    labelEn: 'Sell / Trim',
    color: '#DC2626',
    badgeClass: 'badge-sell'
  },
  STRONG_SELL: {
    key: 'STRONG_SELL',
    labelAr: 'بيع قوي / خروج',
    labelEn: 'Strong Sell',
    color: '#991B1B',
    badgeClass: 'badge-strong-sell'
  }
};

/**
 * Evaluates a Saudi or global asset and generates a comprehensive investment recommendation
 * @param {Object} asset 
 * @returns {Object} Quantitative recommendation dossier
 */
export function generateStockRecommendation(asset) {
  if (!asset || !asset.prices || asset.prices.length < 20) {
    throw new Error("Asset must have valid historical prices to generate recommendation.");
  }

  const prices = asset.prices;
  const closes = prices.map(p => p.close);
  const currentPrice = closes[closes.length - 1];

  // 1. Technical Analysis Metrics
  const rsiSeries = calculateRSI(closes, 14);
  const lastRSI = rsiSeries[rsiSeries.length - 1] || 50;

  const sma20Series = calculateSMA(closes, 20);
  const lastSMA20 = sma20Series[sma20Series.length - 1] || currentPrice;

  const sma50Series = calculateSMA(closes, Math.min(50, closes.length));
  const lastSMA50 = sma50Series[sma50Series.length - 1] || currentPrice;

  const isAboveSMA20 = currentPrice >= lastSMA20;
  const isGoldenCross = lastSMA20 >= lastSMA50;

  // 52-Week Range
  const recent252 = closes.slice(-252);
  const high52 = Math.max(...recent252);
  const low52 = Math.min(...recent252);
  const range52Position = high52 > low52 ? (currentPrice - low52) / (high52 - low52) : 0.5;

  // 2. Fundamental Intrinsic Valuation (DCF / Multiple hybrid)
  let intrinsicFairValue = currentPrice;
  if (asset.freeCashFlowAnnual && asset.sharesOutstanding && asset.sharesOutstanding > 0) {
    const costOfEquity = 0.045 + (asset.beta || 1.0) * 0.065; // CAPM (Rf: 4.5%, ERP: 6.5%)
    const costOfDebt = 0.055;
    const taxRate = 0.15;
    const equityVal = currentPrice * asset.sharesOutstanding;
    const debtVal = Math.max(0, asset.netDebt || 0);

    const wacc = calculateWACC({
      equityValue: equityVal,
      debtValue: debtVal,
      costOfEquity,
      costOfDebt,
      taxRate
    });

    const safeWacc = Math.max(0.065, Math.min(0.13, wacc));
    const growth = 0.025; // Saudi long-term GDP benchmark
    const fcf = asset.freeCashFlowAnnual;
    const growthRate = (asset.annualReturn || 0.08) > 0.15 ? 0.18 : ((asset.annualReturn || 0.08) > 0.10 ? 0.12 : 0.06);
    const projectedFCFF = [
      fcf * (1 + growthRate),
      fcf * Math.pow(1 + growthRate, 2),
      fcf * Math.pow(1 + growthRate, 3),
      fcf * Math.pow(1 + growthRate, 4),
      fcf * Math.pow(1 + growthRate, 5)
    ];

    try {
      const dcfResult = calculateDCF({
        projectedFCFF,
        wacc: safeWacc,
        terminalGrowthRate: growth,
        netDebt: asset.netDebt || 0,
        sharesOutstanding: asset.sharesOutstanding,
        currentMarketPrice: currentPrice
      });
      const dcfVal = dcfResult.intrinsicValuePerShare || dcfResult.fairValuePerShare;
      if (dcfVal > 0) {
        intrinsicFairValue = Number(dcfVal.toFixed(2));
      }
    } catch {
      intrinsicFairValue = Number((currentPrice * (1 + (asset.annualReturn || 0.08))).toFixed(2));
    }
  } else {
    // Valuation fallback via P/E & dividend growth
    const peAdjustment = asset.peRatio > 0 ? (20 / asset.peRatio) : 1;
    intrinsicFairValue = Number((currentPrice * Math.min(1.4, Math.max(0.75, peAdjustment))).toFixed(2));
  }

  const valuationUpsidePct = ((intrinsicFairValue - currentPrice) / currentPrice) * 100;

  // 3. Multi-Factor Conviction Scoring (0 - 100)
  // A. Fundamental Score (0 - 100)
  let fundScore = 50;
  if (valuationUpsidePct > 20) fundScore += 30;
  else if (valuationUpsidePct > 5) fundScore += 15;
  else if (valuationUpsidePct < -15) fundScore -= 25;
  else if (valuationUpsidePct < 0) fundScore -= 10;

  if (asset.dividendYield >= 0.05) fundScore += 15;
  else if (asset.dividendYield >= 0.03) fundScore += 8;

  if (asset.peRatio > 0 && asset.peRatio < 16) fundScore += 10;
  else if (asset.peRatio > 35) fundScore -= 12;

  fundScore = Math.max(10, Math.min(95, fundScore));

  // B. Technical Score (0 - 100)
  let techScore = 50;
  if (isAboveSMA20) techScore += 15;
  else techScore -= 12;

  if (isGoldenCross) techScore += 15;
  else techScore -= 10;

  // RSI scoring
  if (lastRSI < 32) techScore += 20; // Oversold opportunity
  else if (lastRSI >= 45 && lastRSI <= 62) techScore += 15; // Healthy momentum
  else if (lastRSI > 75) techScore -= 22; // Overbought risk
  else if (lastRSI > 65) techScore += 5;

  techScore = Math.max(10, Math.min(95, techScore));

  // C. Volatility & Stability Score (0 - 100)
  let riskScore = 50;
  if (asset.annualVolatility < 0.18) riskScore += 20;
  else if (asset.annualVolatility > 0.32) riskScore -= 15;
  if (asset.beta && asset.beta <= 1.0) riskScore += 15;

  riskScore = Math.max(10, Math.min(90, riskScore));

  // Composite Conviction Score
  const convictionScore = Math.round(0.45 * fundScore + 0.40 * techScore + 0.15 * riskScore);

  // 4. Determine Recommendation Signal
  let recType = RECOMMENDATION_TYPES.HOLD;
  if (convictionScore >= 78) recType = RECOMMENDATION_TYPES.STRONG_BUY;
  else if (convictionScore >= 64) recType = RECOMMENDATION_TYPES.BUY;
  else if (convictionScore <= 35) recType = RECOMMENDATION_TYPES.STRONG_SELL;
  else if (convictionScore <= 46) recType = RECOMMENDATION_TYPES.SELL;
  else recType = RECOMMENDATION_TYPES.HOLD;

  // 5. Target Prices & Stop Loss Calculation
  // 12-Month Target: Blend of DCF Fair Value and statistical expected drift
  const statExpected12M = currentPrice * Math.exp(asset.annualReturn || 0.08);
  const targetPrice12M = Number((0.50 * Math.max(intrinsicFairValue, currentPrice * 1.05) + 0.50 * statExpected12M).toFixed(2));
  const expectedReturnPct = Number((((targetPrice12M - currentPrice) / currentPrice) * 100).toFixed(1));

  // 3-Month Target: Momentum & Quarterly Drift
  const statExpected3M = currentPrice * Math.exp((asset.annualReturn || 0.08) * 0.25);
  const momFactor = isAboveSMA20 ? 1.02 : 0.98;
  const targetPrice3M = Number((statExpected3M * momFactor).toFixed(2));

  // Dynamic Stop Loss: Set at 1.5x monthly volatility below current price or recent support
  const volBuffer = Math.max(0.045, Math.min(0.12, (asset.annualVolatility || 0.20) * 0.35));
  const stopLoss = Number((currentPrice * (1 - volBuffer)).toFixed(2));

  // Risk / Reward Ratio (strictly positive quantitative ratio)
  const upsideSAR = Math.max(currentPrice * 0.03, Math.abs(targetPrice12M - currentPrice));
  const downsideSAR = Math.max(0.1, currentPrice - stopLoss);
  const riskRewardRatio = Number(Math.max(0.5, upsideSAR / downsideSAR).toFixed(1));

  // 6. Justifications & Detailed Explanations in Arabic & English
  const justifications = {
    fundamentalAr: `القيمة الجوهرية العادلة المحسوبة عبر نموذج التدفقات النقدية هي ${intrinsicFairValue} ${asset.currency} (فارق سعري ${valuationUpsidePct >= 0 ? '+' : ''}${valuationUpsidePct.toFixed(1)}%). مكرر الربحية ${asset.peRatio || 'N/A'}x مع عائد توزيعات نقدية ${(asset.dividendYield * 100).toFixed(1)}%.`,
    fundamentalEn: `Intrinsic fair value from DCF model is ${intrinsicFairValue} ${asset.currency} (${valuationUpsidePct >= 0 ? '+' : ''}${valuationUpsidePct.toFixed(1)}% margin). P/E stands at ${asset.peRatio || 'N/A'}x with dividend yield of ${(asset.dividendYield * 100).toFixed(1)}%.`,
    
    technicalAr: `مؤشر القوة النسبية RSI عند ${lastRSI.toFixed(1)} (${lastRSI < 35 ? 'تشبع بيعي يوفر فرصة ارتداد' : (lastRSI > 70 ? 'تشبع شرائي يتطلب الحذر' : 'زخم صحي متوازن')}). السعر يتداول ${isAboveSMA20 ? 'أعلى المتوسط المتحرك 20 يوماً (دعم صاعد)' : 'أدنى المتوسط 20 يوماً (حركة تصحيحية)'}.`,
    technicalEn: `RSI is at ${lastRSI.toFixed(1)} (${lastRSI < 35 ? 'Oversold rebound zone' : (lastRSI > 70 ? 'Overbought warning zone' : 'Balanced momentum')}). Price is ${isAboveSMA20 ? 'above 20-day SMA (bullish support)' : 'below 20-day SMA (corrective phase)'}.`,
    
    riskRewardAr: `نسبة العائد إلى المخاطرة ممتازة عند 1:${riskRewardRatio}. وقف الخسارة المقترح عند ${stopLoss} ${asset.currency} لحماية رأس المال، والهدف السنوي عند ${targetPrice12M} ${asset.currency}.`,
    riskRewardEn: `Favorable Risk-to-Reward ratio at 1:${riskRewardRatio}. Suggested stop-loss at ${stopLoss} ${asset.currency} with 12M target at ${targetPrice12M} ${asset.currency}.`,

    summaryVerdictAr: `التوصية الكمية العامة: [${recType.labelAr}] بدرجة ثقة ${convictionScore}%. السهم يتمتع بـ ${valuationUpsidePct > 0 ? 'جاذبية سعرية استثمارية' : 'استقرار عالي'} مع عائد سنوي مستهدف ${expectedReturnPct >= 0 ? '+' : ''}${expectedReturnPct}%.`,
    summaryVerdictEn: `Overall Quantitative Consensus: [${recType.labelEn}] with ${convictionScore}% conviction. Asset offers ${valuationUpsidePct > 0 ? 'attractive valuation upside' : 'stable profile'} with expected 12M return of ${expectedReturnPct >= 0 ? '+' : ''}${expectedReturnPct}%.`
  };

  return {
    symbol: asset.symbol,
    shortCode: asset.shortCode || asset.symbol.replace('.SR', ''),
    nameAr: asset.nameAr,
    nameEn: asset.nameEn,
    sectorAr: asset.sectorAr || 'السوق العام',
    sectorEn: asset.sectorEn || 'General Market',
    currency: asset.currency,
    currentPrice,
    intrinsicFairValue,
    valuationUpsidePct: Number(valuationUpsidePct.toFixed(1)),
    targetPrice3M,
    targetPrice12M,
    expectedReturnPct,
    stopLoss,
    riskRewardRatio,
    convictionScore,
    recType,
    rsi: Number(lastRSI.toFixed(1)),
    sma20: Number(lastSMA20.toFixed(2)),
    sma50: Number(lastSMA50.toFixed(2)),
    high52: Number(high52.toFixed(2)),
    low52: Number(low52.toFixed(2)),
    dividendYieldPct: Number(((asset.dividendYield || 0) * 100).toFixed(1)),
    peRatio: asset.peRatio || 0,
    justifications
  };
}
