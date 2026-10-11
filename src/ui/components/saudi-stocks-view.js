/**
 * Axiom QuantFinance - Modern Luxury FinTech Saudi Stocks Desk (Robinhood Pro / Linear Style)
 * Minimalist Hero Price, Interactive Spline Canvas Chart, Segmented Ticker Ribbon & Borderless Screener
 * @author أ. طارق ابوعشي
 */

import { getSaudiStocks, getAssetBySymbol } from '../../data/market-feed.js';
import { generateStockRecommendation } from '../../core/equity/stock-recommendation.js';
import { renderStockForecastChart } from '../charts/canvas-stock-forecast.js';
import { openStockComparatorModal } from './stock-comparator-modal.js';
import { openDividendCalculatorModal } from './dividend-calculator-modal.js';
import { quickBuyModal } from './paper-trading-view.js';

let selectedSymbol = '2222.SR';
let activeFilter = 'all';
let searchQuery = '';
let activePillarTab = 'fundamental';

export function renderSaudiStocksView(container, currentLang = 'ar') {
  const saudiStocks = getSaudiStocks();
  let currentAsset = getAssetBySymbol(selectedSymbol);
  if (!currentAsset || !currentAsset.symbol.endsWith('.SR')) {
    currentAsset = saudiStocks[0];
    selectedSymbol = currentAsset.symbol;
  }

  // Pre-calculate recommendations
  const allRecommendations = saudiStocks.map(stock => {
    return {
      asset: stock,
      rec: generateStockRecommendation(stock)
    };
  });

  const activeRec = allRecommendations.find(r => r.asset.symbol === selectedSymbol)?.rec 
    || generateStockRecommendation(currentAsset);

  const isAr = currentLang === 'ar';
  const recBadgeColor = activeRec.recType.color;

  // Filter stocks for quick ribbon based on search query
  const filteredRibbon = allRecommendations.filter(({ asset }) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return asset.shortCode.includes(q) ||
           asset.nameAr.toLowerCase().includes(q) ||
           asset.nameEn.toLowerCase().includes(q) ||
           asset.symbol.toLowerCase().includes(q);
  });

  // Compute smart radar signals across all stocks
  const oversoldStocks = allRecommendations.filter(r => r.rec.rsi < 48);
  const undervaluedStocks = allRecommendations.filter(r => r.rec.valuationUpsidePct >= 4);
  const highDivStocks = allRecommendations.filter(r => r.asset.dividendYield >= 0.045);
  const goldenCrossStocks = allRecommendations.filter(r => r.rec.isGoldenCross);

  // Filter stocks for the screener table
  const filteredTable = getFilteredRecommendations(allRecommendations, activeFilter);

  container.innerHTML = `
    <div class="fintech-desk-layout">
      <!-- 1. Sleek Search & Ticker Capsule Ribbon -->
      <div class="ribbon-controls-bar">
        <div class="ribbon-search-wrap">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            id="tasi-quick-search" 
            class="ribbon-search-input" 
            placeholder="${isAr ? 'بحث سريع برمز أو اسم السهم (أرامكو، الراجحي، 2222...)' : 'Quick search symbol or name...'}"
            value="${searchQuery}"
          />
          ${searchQuery ? `<button id="clear-search-btn" class="clear-search-btn">✕</button>` : ''}
        </div>

        <div class="ribbon-ticker-scroll" id="ribbon-ticker-scroll">
          ${filteredRibbon.map(({ asset, rec }) => {
            const isSelected = asset.symbol === selectedSymbol;
            const badgeColor = rec.recType.color;
            return `
              <button class="ticker-capsule ${isSelected ? 'active' : ''}" data-symbol="${asset.symbol}">
                <span class="cap-code">${asset.shortCode}</span>
                <span class="cap-name">${isAr ? asset.nameAr : asset.nameEn}</span>
                <span class="cap-price mono-val">${rec.currentPrice.toFixed(2)}</span>
                <span class="cap-tag" style="background: ${badgeColor}18; color: ${badgeColor}; border: 1px solid ${badgeColor}35;">
                  ${rec.expectedReturnPct >= 0 ? '+' : ''}${rec.expectedReturnPct}%
                </span>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Smart Opportunities Radar Bar -->
      <div class="smart-radar-bar">
        <span class="radar-title-chip">📡 ${isAr ? 'رادار الفرص الكمية اللحظي:' : 'Smart Signal Radar:'}</span>
        <button class="radar-signal-chip ${activeFilter === 'oversold' ? 'active' : ''}" data-radar="oversold" title="${isAr ? 'فرص ارتداد قاع' : 'Oversold'}">
          ⚡ ${isAr ? 'فرص ارتداد قاع' : 'Oversold'} <span class="r-count">${oversoldStocks.length}</span>
        </button>
        <button class="radar-signal-chip ${activeFilter === 'undervalued' ? 'active' : ''}" data-radar="undervalued" title="${isAr ? 'خصم عن القيمة العادلة' : 'DCF Undervalued'}">
          💎 ${isAr ? 'خصم عن القيمة العادلة' : 'Undervalued'} <span class="r-count">${undervaluedStocks.length}</span>
        </button>
        <button class="radar-signal-chip ${activeFilter === 'high_div' ? 'active' : ''}" data-radar="high_div" title="${isAr ? 'أعلى عوائد توزيعات نقدية' : 'High Dividends'}">
          💰 ${isAr ? 'توزيعات نقدية سخية' : 'High Yield'} <span class="r-count">${highDivStocks.length}</span>
        </button>
        <button class="radar-signal-chip ${activeFilter === 'golden_cross' ? 'active' : ''}" data-radar="golden_cross" title="${isAr ? 'زخم اختراق صاعد' : 'Golden Cross'}">
          🚀 ${isAr ? 'زخم اختراق' : 'Golden Cross'} <span class="r-count">${goldenCrossStocks.length}</span>
        </button>
      </div>

      <!-- 2. Master Hero Stock Showcase Card -->
      <div class="hero-showcase-card">
        <!-- Showcase Header -->
        <div class="hero-top-row">
          <div class="hero-stock-meta">
            <div class="stock-title-wrap">
              <svg width="20" height="13" viewBox="0 0 20 13" fill="none" style="display:inline-block; vertical-align:middle; border-radius:2px; margin-inline-end:6px;" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="13" rx="2" fill="#006C35"/><path d="M4 9h12M6 6.5h8" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/><circle cx="10" cy="4" r="0.9" fill="#fff"/></svg>
              <h2>${isAr ? currentAsset.nameAr : currentAsset.nameEn} <span class="stock-code-pill">${currentAsset.shortCode}</span></h2>
            </div>
            <div class="stock-sub-meta">
              <span>${isAr ? currentAsset.sectorAr : currentAsset.sectorEn}</span>
              <span class="dot-sep">•</span>
              <span>${currentAsset.market}</span>
              <span class="dot-sep">•</span>
              <span class="live-status-chip"><span class="pulse-led"></span> ${isAr ? 'جلسة التداول اللحظية' : 'Live Session'}</span>
            </div>
          </div>

          <!-- Institutional Recommendation Capsule -->
          <div class="hero-rec-capsule" style="background: ${recBadgeColor}15; border: 1px solid ${recBadgeColor}40;">
            <span class="rec-bullet" style="background: ${recBadgeColor}; box-shadow: 0 0 8px ${recBadgeColor};"></span>
            <div class="rec-capsule-text">
              <span class="rec-main-verdict" style="color: ${recBadgeColor};">
                ${isAr ? activeRec.recType.labelAr : activeRec.recType.labelEn}
              </span>
              <span class="rec-score-sub">
                ${isAr ? `إجماع كمي: ${activeRec.convictionScore}%` : `Conviction: ${activeRec.convictionScore}%`}
              </span>
            </div>
          </div>
        </div>

        <!-- Big Hero Price Display & Expected Return -->
        <div class="hero-price-row">
          <div class="hero-price-block">
            <span class="hero-num mono-val">${activeRec.currentPrice.toFixed(2)}</span>
            <span class="hero-cur">${activeRec.currency}</span>
            <span class="hero-return-badge ${activeRec.expectedReturnPct >= 0 ? 'pos' : 'neg'} mono-val">
              ${activeRec.expectedReturnPct >= 0 ? '▲ +' : '▼ '}${activeRec.expectedReturnPct}% ${isAr ? 'عائد سنوي متوقع' : '12M Expected'}
            </span>
          </div>

          <div class="hero-quick-stats">
            <div class="q-stat">
              <span class="q-label">${isAr ? 'القيمة العادلة (DCF)' : 'Fair Value'}</span>
              <span class="q-val mono-val">${activeRec.intrinsicFairValue} ${activeRec.currency}</span>
            </div>
            <div class="q-stat">
              <span class="q-label">${isAr ? 'مكرر الربحية P/E' : 'P/E Ratio'}</span>
              <span class="q-val mono-val">${activeRec.peRatio}x</span>
            </div>
            <div class="q-stat">
              <span class="q-label">${isAr ? 'عائد التوزيعات' : 'Div Yield'}</span>
              <span class="q-val mono-val">${activeRec.dividendYieldPct}%</span>
            </div>
          </div>
        </div>

        <!-- Action Pills Toolbar -->
        <div class="hero-actions-toolbar">
          <button id="btn-hero-paper-trade" class="hero-tool-btn highlight-blue" title="${isAr ? 'تنفيذ أمر شراء افتراضي لحظي' : 'Simulated Trade'}">
            💼 ${isAr ? 'تداول افتراضي (Paper Trade)' : 'Simulate Trade'}
          </button>
          <button id="btn-hero-compare" class="hero-tool-btn" title="${isAr ? 'مقارنة هذا السهم مع أسهم أخرى' : 'Compare Stock'}">
            ⚖️ ${isAr ? 'مقارنة السهم وجهاً لوجه' : 'Compare Head-to-Head'}
          </button>
          <button id="btn-hero-dividends" class="hero-tool-btn" title="${isAr ? 'حاسبة دخل التوزيعات النقدية ونمو DRIP' : 'Dividend & DRIP Calculator'}">
            💰 ${isAr ? 'حاسبة التوزيعات و DRIP' : 'Dividend & DRIP Calc'}
          </button>
        </div>

        <!-- Interactive Canvas Forecast Chart -->
        <div class="hero-chart-container">
          <div class="chart-header-actions">
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-color-dot historical"></span> ${isAr ? 'مسار السعر (60 يوماً)' : 'Historical Price'}</span>
              <span class="legend-item"><span class="legend-color-dot target"></span> ${isAr ? 'الهدف السنوي 12M' : '12M Target'}</span>
              <span class="legend-item"><span class="legend-color-dot stop"></span> ${isAr ? 'وقف الخسارة' : 'Stop-Loss'}</span>
              <span class="legend-item"><span class="legend-color-dot cone"></span> ${isAr ? 'مخروط التوقع المستقبلي' : 'Confidence Cone'}</span>
            </div>
            <div class="chart-mode-pill">
              <span>⚡ ${isAr ? 'نموذج محاكاة الانجراف الإحصائي' : 'Drift & Volatility Forecast'}</span>
            </div>
          </div>
          <canvas id="tasi-forecast-chart" class="hero-forecast-canvas"></canvas>
        </div>

        <!-- 4 Minimalist Executive Target Metrics -->
        <div class="hero-targets-strip">
          <div class="strip-item">
            <span class="strip-label">${isAr ? 'السعر الحالي' : 'Spot Price'}</span>
            <span class="strip-val mono-val">${activeRec.currentPrice.toFixed(2)} <small>${activeRec.currency}</small></span>
            <span class="strip-hint">${isAr ? 'آخر إغلاق سوقي' : 'Last Close'}</span>
          </div>
          <div class="strip-item highlight-green">
            <span class="strip-label">${isAr ? 'الهدف السنوي (12M)' : '12M Target Price'}</span>
            <span class="strip-val mono-val" style="color: #10B981;">${activeRec.targetPrice12M.toFixed(2)} <small>${activeRec.currency}</small></span>
            <span class="strip-hint pos mono-val">${activeRec.expectedReturnPct >= 0 ? '+' : ''}${activeRec.expectedReturnPct}% ${isAr ? 'مستهدف سنوي' : 'Target'}</span>
          </div>
          <div class="strip-item highlight-blue">
            <span class="strip-label">${isAr ? 'الهدف القريب (3M)' : '3M Target Price'}</span>
            <span class="strip-val mono-val" style="color: #3B82F6;">${activeRec.targetPrice3M.toFixed(2)} <small>${activeRec.currency}</small></span>
            <span class="strip-hint">${isAr ? 'مستهدف ربع سنوي' : 'Quarterly Target'}</span>
          </div>
          <div class="strip-item highlight-red">
            <span class="strip-label">${isAr ? 'وقف الخسارة المقترح' : 'Stop-Loss Level'}</span>
            <span class="strip-val mono-val" style="color: #F43F5E;">${activeRec.stopLoss.toFixed(2)} <small>${activeRec.currency}</small></span>
            <span class="strip-hint">${isAr ? `العائد للمخاطرة 1:${activeRec.riskRewardRatio}` : `R/R: 1:${activeRec.riskRewardRatio}`}</span>
          </div>
        </div>
      </div>

      <!-- 3. Three-Pillar Breakdown in Clean Glass Tabs -->
      <div class="pillars-glass-card">
        <div class="pillars-nav-bar">
          <button class="pillar-tab-btn ${activePillarTab === 'fundamental' ? 'active' : ''}" data-pillar="fundamental">
            <span>📊</span> ${isAr ? 'التقييم المالي والتدفقات النقدية (DCF)' : '1. Fundamental DCF Valuation'}
          </button>
          <button class="pillar-tab-btn ${activePillarTab === 'technical' ? 'active' : ''}" data-pillar="technical">
            <span>📈</span> ${isAr ? 'التحليل الفني والزخم (RSI & SMA)' : '2. Technical & Momentum'}
          </button>
          <button class="pillar-tab-btn ${activePillarTab === 'risk' ? 'active' : ''}" data-pillar="risk">
            <span>🛡️</span> ${isAr ? 'إدارة المخاطر وتحديد وقف الخسارة' : '3. Risk & Stop-Loss Bounds'}
          </button>
        </div>

        <div class="pillar-content-area">
          ${activePillarTab === 'fundamental' ? `
            <div class="pillar-panel">
              <p class="pillar-statement">${isAr ? activeRec.justifications.fundamentalAr : activeRec.justifications.fundamentalEn}</p>
              <div class="pillar-chips-row">
                <span class="p-chip">${isAr ? 'القيمة الجوهرية العادلة:' : 'Intrinsic Fair Value:'} <b class="mono-val">${activeRec.intrinsicFairValue} ${activeRec.currency}</b></span>
                <span class="p-chip">${isAr ? 'الفارق السعري عن السوق:' : 'Valuation Upside:'} <b class="mono-val ${activeRec.valuationUpsidePct >= 0 ? 'pos' : 'neg'}">${activeRec.valuationUpsidePct >= 0 ? '+' : ''}${activeRec.valuationUpsidePct}%</b></span>
                <span class="p-chip">${isAr ? 'مكرر الأرباح P/E:' : 'P/E Multiple:'} <b class="mono-val">${activeRec.peRatio}x</b></span>
                <span class="p-chip">${isAr ? 'عائد التوزيعات السنوي:' : 'Dividend Yield:'} <b class="mono-val">${activeRec.dividendYieldPct}%</b></span>
              </div>
            </div>
          ` : activePillarTab === 'technical' ? `
            <div class="pillar-panel">
              <p class="pillar-statement">${isAr ? activeRec.justifications.technicalAr : activeRec.justifications.technicalEn}</p>
              <div class="pillar-chips-row">
                <span class="p-chip">${isAr ? 'مؤشر القوة النسبية RSI (14):' : 'RSI (14):'} <b class="mono-val">${activeRec.rsi}</b></span>
                <span class="p-chip">${isAr ? 'المتوسط المتحرك SMA (20):' : '20-day SMA:'} <b class="mono-val">${activeRec.sma20}</b></span>
                <span class="p-chip">${isAr ? 'المتوسط المتحرك SMA (50):' : '50-day SMA:'} <b class="mono-val">${activeRec.sma50}</b></span>
                <span class="p-chip">${isAr ? 'أعلى سعر في 52 أسبوعاً:' : '52W High:'} <b class="mono-val">${activeRec.high52}</b></span>
                <span class="p-chip">${isAr ? 'أدنى سعر في 52 أسبوعاً:' : '52W Low:'} <b class="mono-val">${activeRec.low52}</b></span>
              </div>
            </div>
          ` : `
            <div class="pillar-panel">
              <p class="pillar-statement">${isAr ? activeRec.justifications.riskRewardAr : activeRec.justifications.riskRewardEn}</p>
              <div class="pillar-chips-row">
                <span class="p-chip">${isAr ? 'مستوى وقف الخسارة المقترح:' : 'Stop-Loss Price:'} <b class="mono-val" style="color: #F43F5E;">${activeRec.stopLoss} ${activeRec.currency}</b></span>
                <span class="p-chip">${isAr ? 'نسبة العائد إلى المخاطرة:' : 'Risk/Reward Ratio:'} <b class="mono-val" style="color: #10B981;">1 : ${activeRec.riskRewardRatio}</b></span>
                <span class="p-chip">${isAr ? 'الهدف السنوي المقترح:' : '12M Target:'} <b class="mono-val">${activeRec.targetPrice12M} ${activeRec.currency}</b></span>
              </div>
            </div>
          `}
        </div>
      </div>

      <!-- 4. Modern Borderless TASI Screener Table -->
      <div class="screener-card">
        <div class="screener-header">
          <div>
            <h3>${isAr ? 'مسح ومقارنة الأسهم القيادية (تاسي)' : 'TASI Master Equities Screener'}</h3>
            <p>${isAr ? 'مقارنة فورية لكافة الأسهم القيادية حسب التوصية الكمية، الأهداف السعرية ونسبة العائد' : 'Multi-factor institutional comparison of Saudi blue chips'}</p>
          </div>

          <!-- Filter Chips -->
          <div class="screener-filter-pills">
            <button class="filter-pill ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">
              ${isAr ? 'جميع الأسهم (12)' : 'All Stocks (12)'}
            </button>
            <button class="filter-pill ${activeFilter === 'buy' ? 'active' : ''}" data-filter="buy">
              ${isAr ? 'الموصى بشرائها فقط 🟢' : 'Buy Ratings Only 🟢'}
            </button>
            <button class="filter-pill ${activeFilter === 'high_return' ? 'active' : ''}" data-filter="high_return">
              ${isAr ? 'أعلى عائد متوقع 📈' : 'Highest Expected Return 📈'}
            </button>
            <button class="filter-pill ${activeFilter === 'high_div' ? 'active' : ''}" data-filter="high_div">
              ${isAr ? 'أعلى توزيعات أرباح 💰' : 'Highest Dividend Yield 💰'}
            </button>
          </div>
        </div>

        <div class="table-responsive-wrapper">
          <table class="fintech-screener-table">
            <thead>
              <tr>
                <th>${isAr ? 'الرمز' : 'Symbol'}</th>
                <th>${isAr ? 'الشركة' : 'Company'}</th>
                <th>${isAr ? 'القطاع' : 'Sector'}</th>
                <th>${isAr ? 'السعر الحالي' : 'Spot Price'}</th>
                <th>${isAr ? 'التوصية الكمية' : 'Quant Rating'}</th>
                <th>${isAr ? 'درجة الثقة' : 'Conviction'}</th>
                <th>${isAr ? 'الهدف 12M' : '12M Target'}</th>
                <th>${isAr ? 'العائد المتوقع' : 'Exp. Return'}</th>
                <th>${isAr ? 'وقف الخسارة' : 'Stop Loss'}</th>
                <th>${isAr ? 'عائد التوزيعات' : 'Div Yield'}</th>
                <th>${isAr ? 'مكرر P/E' : 'P/E'}</th>
                <th style="text-align: center;">${isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTable.map(({ asset, rec }) => {
                const isCurrent = asset.symbol === selectedSymbol;
                const badgeColor = rec.recType.color;
                return `
                  <tr class="screener-row ${isCurrent ? 'row-selected' : ''}" data-symbol="${asset.symbol}">
                    <td class="td-code mono-val">${asset.shortCode}</td>
                    <td class="td-name">
                      <div class="company-name-bold">${isAr ? asset.nameAr : asset.nameEn}</div>
                      <small class="company-ticker-sub">${asset.symbol}</small>
                    </td>
                    <td class="td-sector">${isAr ? asset.sectorAr : asset.sectorEn}</td>
                    <td class="td-price mono-val"><b>${rec.currentPrice.toFixed(2)}</b> <small>${rec.currency}</small></td>
                    <td>
                      <span class="fintech-table-badge" style="background: ${badgeColor}18; color: ${badgeColor}; border: 1px solid ${badgeColor}35;">
                        ${isAr ? rec.recType.labelAr : rec.recType.labelEn}
                      </span>
                    </td>
                    <td>
                      <div class="mini-progress-wrap">
                        <div class="mini-progress-bar" style="width: ${rec.convictionScore}%; background: ${badgeColor};"></div>
                        <span class="mini-progress-text mono-val">${rec.convictionScore}%</span>
                      </div>
                    </td>
                    <td class="mono-val" style="font-weight: 700; color: #10B981;">${rec.targetPrice12M.toFixed(2)}</td>
                    <td class="mono-val ${rec.expectedReturnPct >= 0 ? 'pos' : 'neg'}" style="font-weight: 700;">
                      ${rec.expectedReturnPct >= 0 ? '+' : ''}${rec.expectedReturnPct}%
                    </td>
                    <td class="mono-val" style="color: #F43F5E;">${rec.stopLoss.toFixed(2)}</td>
                    <td class="mono-val">${rec.dividendYieldPct}%</td>
                    <td class="mono-val">${rec.peRatio}x</td>
                    <td style="text-align: center;">
                      <button class="btn-quick-select ${isCurrent ? 'active' : ''}" data-symbol="${asset.symbol}">
                        ${isCurrent ? (isAr ? 'المحدد الآن ✓' : 'Selected ✓') : (isAr ? 'تحليل فوري 🔍' : 'Analyze 🔍')}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Draw Forecast Canvas Chart
  setTimeout(() => {
    const canvas = container.querySelector('#tasi-forecast-chart');
    if (canvas) {
      renderStockForecastChart(canvas, currentAsset, activeRec);
    }
  }, 40);

  // Bind Search Input
  const searchInput = container.querySelector('#tasi-quick-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderSaudiStocksView(container, currentLang);
      const nextInput = container.querySelector('#tasi-quick-search');
      if (nextInput) {
        nextInput.focus();
        nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
      }
    });
  }

  // Bind Clear Search Button
  const clearSearchBtn = container.querySelector('#clear-search-btn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      renderSaudiStocksView(container, currentLang);
    });
  }

  // Bind Ticker Capsule Buttons
  const capsuleBtns = container.querySelectorAll('.ticker-capsule');
  capsuleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sym = btn.getAttribute('data-symbol');
      if (sym && sym !== selectedSymbol) {
        selectedSymbol = sym;
        renderSaudiStocksView(container, currentLang);
      }
    });
  });

  // Bind Pillar Tab Switcher
  const pillarBtns = container.querySelectorAll('.pillar-tab-btn');
  pillarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-pillar');
      if (p && p !== activePillarTab) {
        activePillarTab = p;
        renderSaudiStocksView(container, currentLang);
      }
    });
  });

  // Bind Screener Filter Pills
  const filterPills = container.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      activeFilter = pill.getAttribute('data-filter');
      renderSaudiStocksView(container, currentLang);
    });
  });

  // Bind Radar Signal Chips
  const radarBtns = container.querySelectorAll('.radar-signal-chip');
  radarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const rf = btn.getAttribute('data-radar');
      activeFilter = activeFilter === rf ? 'all' : rf;
      renderSaudiStocksView(container, currentLang);
    });
  });

  // Bind Hero Action Buttons
  container.querySelector('#btn-hero-paper-trade')?.addEventListener('click', () => {
    quickBuyModal(selectedSymbol);
  });

  container.querySelector('#btn-hero-compare')?.addEventListener('click', () => {
    openStockComparatorModal(selectedSymbol, currentLang);
  });

  container.querySelector('#btn-hero-dividends')?.addEventListener('click', () => {
    openDividendCalculatorModal(selectedSymbol, currentLang);
  });

  // Bind Table Select Buttons & Row Clicks
  const selectBtns = container.querySelectorAll('.btn-quick-select');
  selectBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sym = btn.getAttribute('data-symbol');
      if (sym) {
        selectedSymbol = sym;
        renderSaudiStocksView(container, currentLang);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  const screenerRows = container.querySelectorAll('.screener-row');
  screenerRows.forEach(row => {
    row.addEventListener('click', () => {
      const sym = row.getAttribute('data-symbol');
      if (sym && sym !== selectedSymbol) {
        selectedSymbol = sym;
        renderSaudiStocksView(container, currentLang);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function getFilteredRecommendations(list, filter) {
  let result = [...list];
  if (filter === 'buy') {
    result = result.filter(r => r.rec.recType.key === 'STRONG_BUY' || r.rec.recType.key === 'BUY');
  } else if (filter === 'high_return') {
    result.sort((a, b) => b.rec.expectedReturnPct - a.rec.expectedReturnPct);
  } else if (filter === 'high_div') {
    result.sort((a, b) => b.rec.dividendYieldPct - a.rec.dividendYieldPct);
  } else if (filter === 'oversold') {
    result = result.filter(r => r.rec.rsi < 48);
  } else if (filter === 'undervalued') {
    result = result.filter(r => r.rec.valuationUpsidePct >= 4);
  } else if (filter === 'golden_cross') {
    result = result.filter(r => r.rec.isGoldenCross);
  }
  return result;
}
