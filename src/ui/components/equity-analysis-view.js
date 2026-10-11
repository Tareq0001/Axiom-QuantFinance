/**
 * Axiom QuantFinance - Equity Analysis & Fundamental DCF View Component
 * Candlestick Technicals, Discounted Cash Flow (DCF), Sensitivity Matrix & CAPM
 * @author أ. طارق ابوعشي
 */

import { ASSET_UNIVERSE, getAssetBySymbol } from '../../data/market-feed.js';
import { calculateSMA, calculateRSI } from '../../core/equity/technical-indicators.js';
import { calculateDCF, calculateWACC } from '../../core/equity/valuation-models.js';
import { calculateCAPM } from '../../core/equity/factor-models.js';
import { renderCandlestickChart } from '../charts/canvas-candlestick.js';
import { TRANSLATIONS } from '../i18n/translations.js';

let selectedSymbol = "AAPL";
let currentWacc = 0.088;
let currentGrowth = 0.025;

export function renderEquityAnalysisView(container, currentLang = 'ar') {
  const t = TRANSLATIONS[currentLang];
  const asset = getAssetBySymbol(selectedSymbol);

  // Compute indicators
  const closes = asset.prices.map(p => p.close);
  const sma20 = calculateSMA(closes, 20);
  const rsi14 = calculateRSI(closes, 14);
  const currentRSI = rsi14[rsi14.length - 1];

  // Benchmark SPY returns for CAPM
  const spyAsset = getAssetBySymbol("SPY");
  const spyCloses = spyAsset.prices.map(p => p.close);
  const assetReturns = [];
  const spyReturns = [];
  for (let i = 1; i < closes.length; i++) {
    assetReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    spyReturns.push((spyCloses[i] - spyCloses[i - 1]) / spyCloses[i - 1]);
  }
  const capm = calculateCAPM({ assetReturns, marketReturns: spyReturns });

  // DCF Model
  // Mock 5 years FCF projections growing at 8%
  const baseFCF = asset.freeCashFlowAnnual > 0 ? asset.freeCashFlowAnnual : 10000000000;
  const projectedFCF = [
    baseFCF * 1.08,
    baseFCF * 1.16,
    baseFCF * 1.25,
    baseFCF * 1.34,
    baseFCF * 1.42
  ];

  const dcf = calculateDCF({
    projectedFCFF: projectedFCF,
    wacc: currentWacc,
    terminalGrowthRate: currentGrowth,
    netDebt: asset.netDebt,
    sharesOutstanding: asset.sharesOutstanding,
    currentMarketPrice: asset.spotPrice
  });

  const isUpside = dcf.upsidePct >= 0;

  container.innerHTML = `
    <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: gap: 15px;">
      <div>
        <h2>${t.equityTitle}</h2>
        <p>${t.equityDesc}</p>
      </div>
      <div style="min-width: 250px;">
        <label style="font-size: 12px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 6px;">${t.selectAsset}</label>
        <select id="select-equity-asset" class="form-control" style="font-weight: 700;">
          ${ASSET_UNIVERSE.map(a => `
            <option value="${a.symbol}" ${a.symbol === selectedSymbol ? 'selected' : ''}>
              ${a.symbol} - ${currentLang === 'ar' ? a.nameAr : a.nameEn} (${a.market})
            </option>
          `).join('')}
        </select>
      </div>
    </div>

    <!-- Fundamental Stats KPI Cards -->
    <div class="grid-4col" style="margin-bottom: 24px;">
      <div class="kpi-card">
        <span class="kpi-label">${t.currentPrice}</span>
        <span class="kpi-value cyan">${asset.spotPrice.toFixed(2)} ${asset.currency}</span>
        <span class="kpi-sub">Market Capitalization: ${asset.marketCap}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">${t.fairValue}</span>
        <span class="kpi-value ${isUpside ? 'green' : 'red'}">${dcf.intrinsicValuePerShare.toFixed(2)} ${asset.currency}</span>
        <span class="kpi-sub">${t.upsidePotential}: ${isUpside ? '+' : ''}${dcf.upsidePct.toFixed(1)}%</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">P/E Ratio & Div Yield</span>
        <span class="kpi-value gold">${asset.peRatio > 0 ? asset.peRatio.toFixed(1) : 'N/A'}</span>
        <span class="kpi-sub">Dividend Yield: ${(asset.dividendYield * 100).toFixed(2)}%</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">${t.capmBeta} & Alpha</span>
        <span class="kpi-value">${capm.beta.toFixed(2)}</span>
        <span class="kpi-sub">Jensen Alpha: ${(capm.jensenAlpha * 100).toFixed(2)}%</span>
      </div>
    </div>

    <!-- Technical Chart & DCF Interactive Panel -->
    <div class="grid-2col" style="margin-bottom: 24px;">
      <div class="quant-card">
        <div class="quant-card-title">
          <span>${t.chartPriceTitle}</span>
          <span class="badge-tag">SMA 20 | RSI: ${currentRSI ? currentRSI.toFixed(1) : '--'}</span>
        </div>
        <div class="canvas-wrapper">
          <canvas id="canvas-candlestick"></canvas>
        </div>
      </div>

      <div class="quant-card">
        <div class="quant-card-title">
          <span>${t.dcfTitle}</span>
          <span class="badge-tag">Gordon Growth Model</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-group">
            <label>${t.inputWacc}</label>
            <div class="slider-container">
              <input type="range" id="slider-wacc" class="slider-input" min="0.05" max="0.15" step="0.002" value="${currentWacc}">
              <span id="label-wacc" class="slider-val mono-val">${(currentWacc * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div class="form-group">
            <label>${t.inputGrowth}</label>
            <div class="slider-container">
              <input type="range" id="slider-growth" class="slider-input" min="0.01" max="0.045" step="0.001" value="${currentGrowth}">
              <span id="label-growth" class="slider-val mono-val">${(currentGrowth * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
            <div>
              <span style="font-size: 12px; color: var(--text-muted);">${currentLang === 'ar' ? 'قيمة المنشأة (Enterprise Value):' : 'Enterprise Value:'}</span>
              <p class="mono-val" style="font-weight: 700; color: var(--text-main); font-size: 15px;">${(dcf.enterpriseValue / 1e9).toFixed(2)}B ${asset.currency}</p>
            </div>
            <div>
              <span style="font-size: 12px; color: var(--text-muted);">${currentLang === 'ar' ? 'القيمة السوقية للحقوق (Equity Value):' : 'Equity Value:'}</span>
              <p class="mono-val" style="font-weight: 700; color: var(--accent-cyan); font-size: 15px;">${(dcf.equityValue / 1e9).toFixed(2)}B ${asset.currency}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2D Sensitivity Table -->
    <div class="quant-card">
      <div class="quant-card-title">
        <span>${t.sensitivityTableTitle}</span>
        <span class="badge-tag">Intrinsic Fair Value Matrix</span>
      </div>
      <div style="overflow-x: auto;">
        <table class="quant-table">
          <thead>
            <tr>
              <th>WACC \\ Growth</th>
              ${dcf.sensitivity.growthRange.map(g => `<th style="text-align: center;">${(g * 100).toFixed(2)}%</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${dcf.sensitivity.matrix.map(row => `
              <tr>
                <td><strong>${(row.wacc * 100).toFixed(2)}%</strong></td>
                ${row.values.map(v => {
                  if (v === null) return `<td class="heatmap-cell" style="color: var(--text-dim);">-</td>`;
                  const isUp = v >= asset.spotPrice;
                  return `
                    <td class="heatmap-cell" style="color: ${isUp ? 'var(--accent-green)' : 'var(--accent-red)'}; background: ${isUp ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)'}">
                      ${v.toFixed(2)}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render Candlestick Chart
  const canvas = container.querySelector('#canvas-candlestick');
  if (canvas) {
    setTimeout(() => {
      renderCandlestickChart(canvas, asset.prices, { sma: sma20 });
    }, 50);
  }

  // Bind Select Asset
  const selAsset = container.querySelector('#select-equity-asset');
  if (selAsset) {
    selAsset.addEventListener('change', (e) => {
      selectedSymbol = e.target.value;
      renderEquityAnalysisView(container, currentLang);
    });
  }

  // Bind WACC Slider
  const sliderWacc = container.querySelector('#slider-wacc');
  const labelWacc = container.querySelector('#label-wacc');
  if (sliderWacc) {
    sliderWacc.addEventListener('input', (e) => {
      currentWacc = parseFloat(e.target.value);
      labelWacc.textContent = `${(currentWacc * 100).toFixed(1)}%`;
      renderEquityAnalysisView(container, currentLang);
    });
  }

  // Bind Growth Slider
  const sliderGrowth = container.querySelector('#slider-growth');
  const labelGrowth = container.querySelector('#label-growth');
  if (sliderGrowth) {
    sliderGrowth.addEventListener('input', (e) => {
      currentGrowth = parseFloat(e.target.value);
      labelGrowth.textContent = `${(currentGrowth * 100).toFixed(1)}%`;
      renderEquityAnalysisView(container, currentLang);
    });
  }
}
