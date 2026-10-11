/**
 * Axiom QuantFinance - Dividend Income & DRIP Compounding Calculator Modal
 * Interactive dividend cash flow projection and wealth compounding visualizer
 * @author أ. طارق ابوعشي
 */

import { getSaudiStocks } from '../../data/market-feed.js';
import { calculateDRIPCompounding } from '../../core/portfolio/simulator.js';

export function openDividendCalculatorModal(defaultSymbol = '2222.SR', currentLang = 'ar') {
  const isAr = currentLang === 'ar';
  const saudiStocks = getSaudiStocks();

  let selectedStock = saudiStocks.find(s => s.symbol === defaultSymbol) || saudiStocks[0];
  let capitalSAR = 50000;
  let horizonYears = 10;
  let capitalAppreciation = selectedStock.annualReturn || 0.07;

  const existing = document.getElementById('dividend-modal-root');
  if (existing) existing.remove();

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'dividend-modal-root';
  modalOverlay.className = 'quant-modal-overlay';

  function renderModal() {
    const divYield = selectedStock.dividendYield || 0.04;
    const dripResult = calculateDRIPCompounding({
      principalSAR: capitalSAR,
      annualCapitalAppreciation: capitalAppreciation,
      dividendYield: divYield,
      years: horizonYears
    });

    const sharesOwned = Math.floor(capitalSAR / selectedStock.spotPrice);
    const annualCashSAR = capitalSAR * divYield;
    const quarterlyCashSAR = annualCashSAR / 4;

    modalOverlay.innerHTML = `
      <div class="quant-modal-card dividend-modal">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-badge-icon">💰</span>
            <div>
              <h3>${isAr ? 'حاسبة دخل التوزيعات وإعادة الاستثمار التراكمي (DRIP)' : 'Dividend Income & DRIP Compounding Calculator'}</h3>
              <p>${isAr ? 'توقع التدفقات النقدية ومضاعفة الثروة عبر إعادة استثمار أرباح الأسهم السعودية' : 'Simulate cash flow yield and compound growth over time'}</p>
            </div>
          </div>
          <button class="modal-close-btn" id="close-div-modal-btn">✕</button>
        </div>

        <!-- Controls Row -->
        <div class="div-calc-controls-grid">
          <div class="calc-field">
            <label>${isAr ? 'اختر السهم القيادي:' : 'Select Blue-Chip Stock:'}</label>
            <select id="div-stock-select" class="comp-select">
              ${saudiStocks.map(s => `
                <option value="${s.symbol}" ${s.symbol === selectedStock.symbol ? 'selected' : ''}>
                  ${s.shortCode} - ${isAr ? s.nameAr : s.nameEn} (عائد ${(s.dividendYield * 100).toFixed(1)}%)
                </option>
              `).join('')}
            </select>
          </div>

          <div class="calc-field">
            <label>${isAr ? 'رأس المال المستثمر (ر.س):' : 'Invested Capital (SAR):'}</label>
            <input type="number" id="div-capital-input" class="calc-input mono-val" value="${capitalSAR}" step="5000" min="5000" max="10000000" />
          </div>

          <div class="calc-field">
            <label>${isAr ? 'الأفق الزمني للاستثمار:' : 'Investment Horizon:'}</label>
            <div class="calc-pills-row">
              <button class="time-pill ${horizonYears === 5 ? 'active' : ''}" data-years="5">5 ${isAr ? 'سنوات' : 'Years'}</button>
              <button class="time-pill ${horizonYears === 10 ? 'active' : ''}" data-years="10">10 ${isAr ? 'سنوات' : 'Years'}</button>
              <button class="time-pill ${horizonYears === 15 ? 'active' : ''}" data-years="15">15 ${isAr ? 'سنة' : 'Years'}</button>
            </div>
          </div>
        </div>

        <!-- Key Payout Metric Badges -->
        <div class="div-metrics-strip">
          <div class="d-metric-box">
            <span class="d-label">${isAr ? 'عدد الأسهم المشتراة' : 'Shares Acquired'}</span>
            <span class="d-val mono-val">${sharesOwned.toLocaleString()} ${isAr ? 'سهم' : 'Shares'}</span>
            <span class="d-sub">${isAr ? 'بسعر' : 'At'} ${selectedStock.spotPrice.toFixed(2)} ${selectedStock.currency}</span>
          </div>

          <div class="d-metric-box highlight-green">
            <span class="d-label">${isAr ? 'التوزيع السنوي المتوقع' : 'Annual Cash Payout'}</span>
            <span class="d-val mono-val">${annualCashSAR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
            <span class="d-sub">${isAr ? 'عائد سنوي' : 'Yield:'} ${(divYield * 100).toFixed(1)}%</span>
          </div>

          <div class="d-metric-box">
            <span class="d-label">${isAr ? 'التوزيع ربع السنوي' : 'Quarterly Cash Payout'}</span>
            <span class="d-val mono-val">${quarterlyCashSAR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
            <span class="d-sub">${isAr ? 'كل 3 أشهر' : 'Every 3 Months'}</span>
          </div>

          <div class="d-metric-box highlight-blue">
            <span class="d-label">${isAr ? 'فارق ثروة إعادة الاستثمار' : 'DRIP Wealth Advantage'}</span>
            <span class="d-val mono-val">+${dripResult.dripAdvantageSAR.toLocaleString()} ر.س</span>
            <span class="d-sub">${isAr ? 'فائض تراكمي' : 'Compounding boost:'} +${dripResult.dripAdvantagePct}%</span>
          </div>
        </div>

        <!-- Canvas Compounding Progression Chart -->
        <div class="div-chart-box">
          <div class="div-chart-header">
            <h4>${isAr ? 'مقارنة مسار نمو رأس المال: إعادة استثمار التوزيعات (DRIP) مقابل سحبها نقداً' : 'Wealth Trajectory: DRIP Reinvestment vs Cash Withdrawal'}</h4>
            <div class="chart-legend-row">
              <span class="legend-item"><span class="dot" style="background:#059669;"></span> ${isAr ? 'مع إعادة استثمار الأرباح (DRIP)' : 'With DRIP Reinvestment'}</span>
              <span class="legend-item"><span class="dot" style="background:#2563EB;"></span> ${isAr ? 'سحب الأرباح نقداً' : 'Cash Withdrawal'}</span>
            </div>
          </div>
          <div class="canvas-chart-holder" style="height: 220px; position: relative;">
            <canvas id="drip-canvas-chart"></canvas>
          </div>
        </div>
      </div>
    `;

    modalOverlay.querySelector('#close-div-modal-btn')?.addEventListener('click', () => modalOverlay.remove());

    modalOverlay.querySelector('#div-stock-select')?.addEventListener('change', (e) => {
      selectedStock = saudiStocks.find(s => s.symbol === e.target.value) || selectedStock;
      capitalAppreciation = selectedStock.annualReturn || 0.07;
      renderModal();
    });

    modalOverlay.querySelector('#div-capital-input')?.addEventListener('change', (e) => {
      const val = Number(e.target.value);
      if (val >= 1000) {
        capitalSAR = val;
        renderModal();
      }
    });

    modalOverlay.querySelectorAll('.time-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        horizonYears = Number(btn.getAttribute('data-years'));
        renderModal();
      });
    });

    // Draw Canvas chart
    setTimeout(() => {
      drawDRIPChart(dripResult.yearlyProgression, isAr);
    }, 20);
  }

  function drawDRIPChart(progression, isAr) {
    const canvas = document.getElementById('drip-canvas-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = 220;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const pad = { top: 20, right: 30, bottom: 35, left: 88 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const maxVal = Math.max(...progression.map(p => Math.max(p.balanceWithDRIP, p.totalWealthWithoutDRIP))) * 1.08;
    const minVal = progression[0].balanceWithDRIP * 0.9;

    // Draw Grid Lines
    ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#27272A' : '#E2E8F0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();

      const labelVal = Math.round(maxVal - (i / 4) * (maxVal - minVal));
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(labelVal.toLocaleString() + ' SAR', pad.left - 8, y + 4);
    }

    // Points generator
    const getX = (idx) => pad.left + (idx / (progression.length - 1)) * chartW;
    const getY = (val) => pad.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

    // 1. Line With DRIP (Emerald Green)
    ctx.beginPath();
    progression.forEach((p, idx) => {
      const x = getX(idx);
      const y = getY(p.balanceWithDRIP);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Line Without DRIP (Royal Blue)
    ctx.beginPath();
    progression.forEach((p, idx) => {
      const x = getX(idx);
      const y = getY(p.totalWealthWithoutDRIP);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Year Labels on X-axis
    ctx.fillStyle = '#64748B';
    ctx.font = '11px JetBrains Mono';
    ctx.textAlign = 'center';
    progression.forEach((p, idx) => {
      if (idx % 2 === 0 || idx === progression.length - 1) {
        ctx.fillText('Y' + p.year, getX(idx), height - 12);
      }
    });
  }

  document.body.appendChild(modalOverlay);
  renderModal();

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.remove();
  });
}
