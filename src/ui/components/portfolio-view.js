/**
 * Axiom QuantFinance - Modern Portfolio Theory & Markowitz View Component
 * Efficient Frontier, Optimal Tangency Weights, Custom Allocations & Dividend Cash Flow Simulator
 * @author أ. طارق ابوعشي
 */

import { runMarkowitzOptimization } from '../../core/portfolio/markowitz.js';
import { generateRebalancingOrders } from '../../core/portfolio/performance.js';
import { getReturnsMatrix, getSaudiStocks } from '../../data/market-feed.js';
import { simulateCustomPortfolio } from '../../core/portfolio/simulator.js';
import { renderEfficientFrontierChart } from '../charts/canvas-efficient-frontier.js';
import { TRANSLATIONS } from '../i18n/translations.js';

export function renderPortfolioView(container, currentLang = 'ar') {
  const t = TRANSLATIONS[currentLang];
  const isAr = currentLang === 'ar';
  const universeSymbols = ["2222.SR", "1120.SR", "AAPL", "NVDA", "SPY", "GLD"];
  const { assets, returnsMatrix } = getReturnsMatrix(universeSymbols);

  const mpt = runMarkowitzOptimization({
    assetSymbols: universeSymbols,
    returnsMatrix,
    riskFreeRate: 0.045
  });

  const tan = mpt.tangencyPortfolio;
  const gmv = mpt.gmvPortfolio;

  // Setup Saudi blue chips for custom allocation simulator
  const saudiStocks = getSaudiStocks().slice(0, 6); // Top 6 for clean slider UI
  let customCapitalSAR = 100000;
  let customWeights = [0.30, 0.25, 0.15, 0.15, 0.10, 0.05];

  function getSimulationResult() {
    return simulateCustomPortfolio({
      assets: saudiStocks,
      weights: customWeights,
      capitalSAR: customCapitalSAR
    });
  }

  container.innerHTML = `
    <div class="view-header">
      <h2>${t.portfolioTitle}</h2>
      <p>${t.portfolioDesc}</p>
    </div>

    <!-- Top KPI Cards -->
    <div class="grid-4col" style="margin-bottom: 24px;">
      <div class="kpi-card">
        <span class="kpi-label">${t.metricSharpe} (Tangency)</span>
        <span class="kpi-value cyan"><span style="direction: ltr; display: inline-block;">${tan.sharpe.toFixed(2)}</span></span>
        <span class="kpi-sub">Max Risk-Adjusted Return</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">${t.metricAnnualReturn}</span>
        <span class="kpi-value green"><span style="direction: ltr; display: inline-block;">+${(tan.expectedReturn * 100).toFixed(1)}%</span></span>
        <span class="kpi-sub">Annualized Tangency Yield</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">${t.metricVolatility} (Tangency σ)</span>
        <span class="kpi-value gold"><span style="direction: ltr; display: inline-block;">${(tan.volatility * 100).toFixed(1)}%</span></span>
        <span class="kpi-sub">Portfolio Standard Deviation</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">${t.gmvWeightsTitle} (Min σ)</span>
        <span class="kpi-value"><span style="direction: ltr; display: inline-block;">${(gmv.volatility * 100).toFixed(1)}%</span></span>
        <span class="kpi-sub">GMV Sharpe: ${gmv.sharpe.toFixed(2)}</span>
      </div>
    </div>

    <!-- Main Chart and Optimal Breakdown -->
    <div class="grid-2col" style="margin-bottom: 24px;">
      <div class="quant-card">
        <div class="quant-card-title">
          <span>${t.efficientFrontierTitle}</span>
          <span class="badge-tag">Markowitz MPT</span>
        </div>
        <div class="canvas-wrapper">
          <canvas id="canvas-frontier"></canvas>
        </div>
      </div>

      <div class="quant-card">
        <div class="quant-card-title">
          <span>${t.optimalWeightsTitle}</span>
          <span class="badge-tag">Tangency Portfolio</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${universeSymbols.map((sym, idx) => {
            const asset = assets.find(a => a.symbol === sym);
            const weightPct = Math.max(0, tan.weights[idx] * 100);
            return `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                  <span style="font-weight: 600;">${sym} (${currentLang === 'ar' ? asset.nameAr : asset.nameEn})</span>
                  <span class="mono-val" style="color: var(--accent-cyan); font-weight: 700;">${weightPct.toFixed(1)}%</span>
                </div>
                <div style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, var(--accent-cyan), var(--accent-indigo)); width: ${Math.min(100, weightPct)}%; height: 100%;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: var(--text-muted);">${currentLang === 'ar' ? 'نموذج التحسين الرياضي:' : 'Optimization Algorithm:'} <strong>Two-Fund Separation Theorem</strong></span>
          <button id="btn-rebalance-action" class="btn-primary">
            <span>⚡</span>
            <span>${t.btnRebalance}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Rebalancing Output Modal / Section -->
    <div id="rebalancing-orders-card" class="quant-card" style="display: none; margin-bottom: 24px;">
      <div class="quant-card-title">
        <span>${currentLang === 'ar' ? 'أوامر إعادة التوازن المقترحة لتطابق المحفظة المثلى' : 'Rebalancing Trade Recommendations'}</span>
        <span id="rebalance-turnover-tag" class="badge-tag"></span>
      </div>
      <div style="overflow-x: auto;">
        <table class="quant-table" id="rebalancing-table">
          <thead>
            <tr>
              <th>${currentLang === 'ar' ? 'الأصل المالي' : 'Asset'}</th>
              <th>${currentLang === 'ar' ? 'الإجراء' : 'Action'}</th>
              <th>${currentLang === 'ar' ? 'الكمية (أسهم)' : 'Shares'}</th>
              <th>${currentLang === 'ar' ? 'السعر المقدر' : 'Price'}</th>
              <th>${currentLang === 'ar' ? 'القيمة الإجمالية' : 'Total Amount'}</th>
              <th>${currentLang === 'ar' ? 'الوزن الحالي' : 'Current %'}</th>
              <th>${currentLang === 'ar' ? 'الوزن المستهدف' : 'Target %'}</th>
            </tr>
          </thead>
          <tbody id="rebalancing-tbody"></tbody>
        </table>
      </div>
    </div>

    <!-- NEW: Interactive Saudi Portfolio & Dividend Cash Flow Simulator -->
    <div class="quant-card custom-portfolio-builder-card" style="margin-bottom: 24px;">
      <div class="quant-card-title">
        <span class="title-glyph">💰</span>
        <span>${isAr ? 'باني المحافظ السعودية ومحاكي التدفقات النقدية والأرباح السنوية' : 'Interactive Saudi Portfolio & Dividend Cash-Flow Builder'}</span>
        <span class="badge-tag">${isAr ? 'حساب التدفق بالريال' : 'SAR Cash Flow'}</span>
      </div>

      <!-- Presets & Capital Input Row -->
      <div class="builder-controls-top" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 20px; padding: 14px; background: rgba(0,0,0,0.02); border-radius: 8px; border: 1px solid var(--border-subtle);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <label style="font-weight: 600; font-size: 13px;">${isAr ? 'رأس مال المحفظة (ر.س):' : 'Portfolio Capital (SAR):'}</label>
          <input type="number" id="builder-capital-input" class="calc-input mono-val" value="${customCapitalSAR}" step="10000" min="10000" max="100000000" style="width: 140px; padding: 6px 10px;" />
        </div>

        <div class="builder-presets-group" style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="preset-pill active" data-preset="balanced">${isAr ? '⚖️ محفظة متوازنة' : 'Balanced'}</button>
          <button class="preset-pill" data-preset="high_div">${isAr ? '💰 أقصى توزيعات نقدية' : 'Max Dividends'}</button>
          <button class="preset-pill" data-preset="growth">${isAr ? '🚀 محفظة النمو السريع' : 'High Growth'}</button>
          <button class="preset-pill" data-preset="defensive">${isAr ? '🛡️ محفظة دفاعية' : 'Defensive'}</button>
        </div>
      </div>

      <!-- Sliders Grid & Live Cash Flow Summary -->
      <div class="builder-main-grid" style="display: grid; grid-template-columns: 1fr 340px; gap: 24px;">
        <!-- Left: Sliders for 6 Saudi blue chips -->
        <div id="sliders-container" style="display: flex; flex-direction: column; gap: 12px;"></div>

        <!-- Right: Live Dividend Cash Flow Box -->
        <div id="sim-result-box" class="builder-summary-card" style="padding: 18px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-subtle); display: flex; flex-direction: column; justify-content: space-between;"></div>
      </div>
    </div>
  `;

  // Mount canvas
  const canvas = container.querySelector('#canvas-frontier');
  if (canvas) {
    setTimeout(() => {
      renderEfficientFrontierChart(canvas, mpt);
    }, 50);
  }

  // Bind Rebalance Button
  const btnRebalance = container.querySelector('#btn-rebalance-action');
  const ordersCard = container.querySelector('#rebalancing-orders-card');
  const turnoverTag = container.querySelector('#rebalance-turnover-tag');
  const tbody = container.querySelector('#rebalancing-tbody');

  if (btnRebalance) {
    btnRebalance.addEventListener('click', () => {
      const currentHoldings = [
        { symbol: "2222.SR", shares: 1000, price: 25.74 },
        { symbol: "1120.SR", shares: 300, price: 62.35 },
        { symbol: "AAPL", shares: 150, price: 228.40 },
        { symbol: "NVDA", shares: 200, price: 132.50 },
        { symbol: "SPY", shares: 80, price: 575.20 },
        { symbol: "GLD", shares: 50, price: 245.80 }
      ];

      const targetWeights = {};
      universeSymbols.forEach((sym, idx) => {
        targetWeights[sym] = Math.max(0, tan.weights[idx]);
      });

      const rebalanceRes = generateRebalancingOrders({
        currentHoldings,
        targetWeights,
        cashAvailable: 25000
      });

      turnoverTag.textContent = `${isAr ? 'معدل التدوير:' : 'Turnover:'} ${rebalanceRes.turnoverRatePct.toFixed(1)}%`;
      tbody.innerHTML = rebalanceRes.orders.map(o => `
        <tr>
          <td><strong class="symbol-ticker">${o.symbol}</strong></td>
          <td><span class="badge-tag" style="background: ${o.action === 'BUY' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${o.action === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)'}">${o.action}</span></td>
          <td class="mono-val">${o.shares.toLocaleString()}</td>
          <td class="mono-val">${o.estimatedPrice.toFixed(2)}</td>
          <td class="mono-val">${Math.round(o.estimatedTotal).toLocaleString()} $</td>
          <td class="mono-val">${o.currentWeightPct.toFixed(1)}%</td>
          <td class="mono-val" style="color: var(--accent-cyan); font-weight: 700;">${o.targetWeightPct.toFixed(1)}%</td>
        </tr>
      `).join('');

      ordersCard.style.display = 'block';
      ordersCard.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // --- Interactive Slider & Dividend Simulator Logic ---
  const slidersContainer = container.querySelector('#sliders-container');
  const simResultBox = container.querySelector('#sim-result-box');
  const capitalInput = container.querySelector('#builder-capital-input');

  function updateSimulatorUI() {
    const sim = getSimulationResult();

    // Render Sliders
    slidersContainer.innerHTML = saudiStocks.map((stock, idx) => {
      const w = Math.round(customWeights[idx] * 100);
      return `
        <div class="slider-row-box" style="padding: 10px 14px; background: rgba(0,0,0,0.015); border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
            <span style="font-weight: 600;">
              ${stock.shortCode} - ${isAr ? stock.nameAr : stock.nameEn}
              <span style="font-size: 11px; color: #059669; margin-inline-start: 6px;">(عائد ${(stock.dividendYield * 100).toFixed(1)}%)</span>
            </span>
            <span class="mono-val" style="font-weight: 700; color: #2563EB;">${w}%</span>
          </div>
          <input type="range" class="weight-slider" data-index="${idx}" min="0" max="100" value="${w}" style="width: 100%; accent-color: #2563EB;" />
        </div>
      `;
    }).join('');

    // Rebind slider changes
    slidersContainer.querySelectorAll('.weight-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const idx = Number(e.target.getAttribute('data-index'));
        customWeights[idx] = Number(e.target.value) / 100;
        updateSummaryBoxOnly();
      });
    });

    updateSummaryBoxOnly();
  }

  function updateSummaryBoxOnly() {
    const sim = getSimulationResult();
    simResultBox.innerHTML = `
      <div>
        <h4 style="margin: 0 0 12px 0; font-size: 14px; color: var(--text-muted);">${isAr ? 'عوائد المحفظة المخصصة السنوية' : 'Custom Portfolio Forecast'}</h4>
        
        <div style="margin-bottom: 16px; padding: 12px; background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.25); border-radius: 8px;">
          <span style="font-size: 11px; color: #059669; font-weight: 700; display: block; margin-bottom: 4px;">
            ${isAr ? '💵 التوزيعات النقدية السنوية المقدرة:' : 'Annual Cash Dividends:'}
          </span>
          <span class="mono-val" style="font-size: 22px; font-weight: 800; color: #059669;">
            ${sim.annualDividendIncomeSAR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
          </span>
          <span style="display: block; font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            ${isAr ? 'الدفعة ربع السنوية (كل 3 أشهر):' : 'Quarterly:'} <b>${sim.quarterlyDividendIncomeSAR.toLocaleString()} ر.س</b>
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">${isAr ? 'العائد السنوي المتوقع:' : 'Expected Annual Return:'}</span>
            <span class="mono-val" style="font-weight: 700; color: #2563EB;">+${sim.expectedReturn}%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">${isAr ? 'متوسط عائد التوزيعات:' : 'Weighted Dividend Yield:'}</span>
            <span class="mono-val" style="font-weight: 700; color: #059669;">${sim.weightedDividendYieldPct}%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">${isAr ? 'التقلب السنوي (σ):' : 'Annual Volatility:'}</span>
            <span class="mono-val">${sim.volatility}%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">${isAr ? 'نسبة شارب المحسوبة:' : 'Portfolio Sharpe:'}</span>
            <span class="mono-val"><b>${sim.sharpe}</b></span>
          </div>
        </div>
      </div>

      <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border-subtle); font-size: 11px; color: var(--text-muted);">
        ${isAr ? 'تعتمد التوزيعات على أحدث العوائد النقدية المعلنة للشركات القيادية في تداول.' : 'Yield based on latest declared official Tadawul distributions.'}
      </div>
    `;
  }

  // Capital input listener
  capitalInput.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    if (val >= 1000) {
      customCapitalSAR = val;
      updateSummaryBoxOnly();
    }
  });

  // Presets listeners
  container.querySelectorAll('.preset-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.preset-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const p = btn.getAttribute('data-preset');
      if (p === 'balanced') {
        customWeights = [0.166, 0.166, 0.166, 0.166, 0.166, 0.166];
      } else if (p === 'high_div') {
        // High dividend: Aramco, stc, SABIC, Al Rajhi
        customWeights = [0.35, 0.15, 0.10, 0.30, 0.05, 0.05];
      } else if (p === 'growth') {
        // Growth: ACWA Power, Elm, Maaden
        customWeights = [0.10, 0.20, 0.05, 0.10, 0.10, 0.45];
      } else if (p === 'defensive') {
        // Defensive: Aramco, stc, SNB
        customWeights = [0.45, 0.15, 0.10, 0.25, 0.05, 0.00];
      }
      updateSimulatorUI();
    });
  });

  updateSimulatorUI();
}
