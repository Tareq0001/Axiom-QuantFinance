/**
 * Axiom QuantFinance - Head-to-Head Saudi Stock Comparator Modal
 * Side-by-side quantitative benchmarking across fundamentals, technicals, and price targets
 * @author أ. طارق ابوعشي
 */

import { getSaudiStocks } from '../../data/market-feed.js';
import { generateStockRecommendation } from '../../core/equity/stock-recommendation.js';

export function openStockComparatorModal(defaultSymbol = '2222.SR', currentLang = 'ar') {
  const isAr = currentLang === 'ar';
  const saudiStocks = getSaudiStocks();

  // Pick 2 comparison stocks by default
  let stock1 = saudiStocks.find(s => s.symbol === defaultSymbol) || saudiStocks[0];
  let stock2 = saudiStocks.find(s => s.symbol !== stock1.symbol) || saudiStocks[1];
  let stock3 = saudiStocks.find(s => s.symbol !== stock1.symbol && s.symbol !== stock2.symbol) || saudiStocks[2];

  let activeCompareCount = 2; // 2 or 3

  // Remove existing modal if open
  const existing = document.getElementById('comparator-modal-root');
  if (existing) existing.remove();

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'comparator-modal-root';
  modalOverlay.className = 'quant-modal-overlay';

  function renderModalContent() {
    const rec1 = generateStockRecommendation(stock1);
    const rec2 = generateStockRecommendation(stock2);
    const rec3 = activeCompareCount === 3 ? generateStockRecommendation(stock3) : null;

    modalOverlay.innerHTML = `
      <div class="quant-modal-card comparator-modal">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-badge-icon">⚖️</span>
            <div>
              <h3>${isAr ? 'مقارنة الأسهم المباشرة وجهاً لوجه' : 'Head-to-Head Stock Comparator'}</h3>
              <p>${isAr ? 'مقارنة كمية ومؤسسية شاملة بين الأسهم القيادية في السوق السعودي' : 'Multi-factor institutional side-by-side evaluation'}</p>
            </div>
          </div>
          <button class="modal-close-btn" id="close-comparator-btn">✕</button>
        </div>

        <!-- Stock Selector Bar -->
        <div class="comparator-selectors-row">
          <div class="comp-selector-box">
            <label>${isAr ? 'السهم الأول:' : 'Stock 1:'}</label>
            <select id="select-stock-1" class="comp-select">
              ${saudiStocks.map(s => `<option value="${s.symbol}" ${s.symbol === stock1.symbol ? 'selected' : ''}>${s.shortCode} - ${isAr ? s.nameAr : s.nameEn}</option>`).join('')}
            </select>
          </div>

          <div class="comp-vs-badge">VS</div>

          <div class="comp-selector-box">
            <label>${isAr ? 'السهم الثاني:' : 'Stock 2:'}</label>
            <select id="select-stock-2" class="comp-select">
              ${saudiStocks.map(s => `<option value="${s.symbol}" ${s.symbol === stock2.symbol ? 'selected' : ''}>${s.shortCode} - ${isAr ? s.nameAr : s.nameEn}</option>`).join('')}
            </select>
          </div>

          ${activeCompareCount === 3 ? `
            <div class="comp-vs-badge">VS</div>
            <div class="comp-selector-box">
              <label>${isAr ? 'السهم الثالث:' : 'Stock 3:'}</label>
              <select id="select-stock-3" class="comp-select">
                ${saudiStocks.map(s => `<option value="${s.symbol}" ${s.symbol === stock3.symbol ? 'selected' : ''}>${s.shortCode} - ${isAr ? s.nameAr : s.nameEn}</option>`).join('')}
              </select>
            </div>
          ` : ''}

          <div class="comp-toggle-3rd">
            <button id="toggle-3rd-btn" class="comp-action-btn">
              ${activeCompareCount === 2 ? (isAr ? '+ إضافة سهم ثالث' : '+ Add 3rd Stock') : (isAr ? '- إزالة السهم الثالث' : '- Remove 3rd Stock')}
            </button>
          </div>
        </div>

        <!-- Matrix Comparison Table -->
        <div class="comparator-matrix-wrapper">
          <table class="comparator-table">
            <thead>
              <tr>
                <th class="metric-col">${isAr ? 'المعيار المالي / الفني' : 'Metric / Factor'}</th>
                <th class="stock-col stock-1-col">
                  <div class="col-stock-header">
                    <span class="col-code">${stock1.shortCode}</span>
                    <span class="col-name">${isAr ? stock1.nameAr : stock1.nameEn}</span>
                    <span class="col-rec" style="color: ${rec1.recType.color}; background: ${rec1.recType.color}15;">${isAr ? rec1.recType.labelAr : rec1.recType.labelEn}</span>
                  </div>
                </th>
                <th class="stock-col stock-2-col">
                  <div class="col-stock-header">
                    <span class="col-code">${stock2.shortCode}</span>
                    <span class="col-name">${isAr ? stock2.nameAr : stock2.nameEn}</span>
                    <span class="col-rec" style="color: ${rec2.recType.color}; background: ${rec2.recType.color}15;">${isAr ? rec2.recType.labelAr : rec2.recType.labelEn}</span>
                  </div>
                </th>
                ${rec3 ? `
                  <th class="stock-col stock-3-col">
                    <div class="col-stock-header">
                      <span class="col-code">${stock3.shortCode}</span>
                      <span class="col-name">${isAr ? stock3.nameAr : stock3.nameEn}</span>
                      <span class="col-rec" style="color: ${rec3.recType.color}; background: ${rec3.recType.color}15;">${isAr ? rec3.recType.labelAr : rec3.recType.labelEn}</span>
                    </div>
                  </th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              <!-- 1. Spot Price -->
              <tr>
                <td class="m-label">${isAr ? 'سعر السوق اللحظي (تداول)' : 'Official Spot Price'}</td>
                <td class="mono-val stock-val"><b>${rec1.currentPrice.toFixed(2)}</b> ${rec1.currency}</td>
                <td class="mono-val stock-val"><b>${rec2.currentPrice.toFixed(2)}</b> ${rec2.currency}</td>
                ${rec3 ? `<td class="mono-val stock-val"><b>${rec3.currentPrice.toFixed(2)}</b> ${rec3.currency}</td>` : ''}
              </tr>

              <!-- 2. Fair Value DCF -->
              <tr>
                <td class="m-label">${isAr ? 'القيمة الجوهرية العادلة (DCF)' : 'Intrinsic Fair Value'}</td>
                <td class="mono-val stock-val">${rec1.intrinsicFairValue} ${rec1.currency} <span class="sub-pill ${rec1.valuationUpsidePct >= 0 ? 'pos' : 'neg'}">${rec1.valuationUpsidePct >= 0 ? '+' : ''}${rec1.valuationUpsidePct}%</span></td>
                <td class="mono-val stock-val">${rec2.intrinsicFairValue} ${rec2.currency} <span class="sub-pill ${rec2.valuationUpsidePct >= 0 ? 'pos' : 'neg'}">${rec2.valuationUpsidePct >= 0 ? '+' : ''}${rec2.valuationUpsidePct}%</span></td>
                ${rec3 ? `<td class="mono-val stock-val">${rec3.intrinsicFairValue} ${rec3.currency} <span class="sub-pill ${rec3.valuationUpsidePct >= 0 ? 'pos' : 'neg'}">${rec3.valuationUpsidePct >= 0 ? '+' : ''}${rec3.valuationUpsidePct}%</span></td>` : ''}
              </tr>

              <!-- 3. 12M Target & Expected Return -->
              <tr>
                <td class="m-label">${isAr ? 'الهدف السنوي 12M والعائد المتوقع' : '12M Target & Expected Return'}</td>
                <td class="mono-val stock-val" style="color: #2563EB;"><b>${rec1.targetPrice12M}</b> ${rec1.currency} (+${rec1.expectedReturnPct}%)</td>
                <td class="mono-val stock-val" style="color: #2563EB;"><b>${rec2.targetPrice12M}</b> ${rec2.currency} (+${rec2.expectedReturnPct}%)</td>
                ${rec3 ? `<td class="mono-val stock-val" style="color: #2563EB;"><b>${rec3.targetPrice12M}</b> ${rec3.currency} (+${rec3.expectedReturnPct}%)</td>` : ''}
              </tr>

              <!-- 4. P/E Ratio -->
              <tr>
                <td class="m-label">${isAr ? 'مكرر الربحية P/E' : 'P/E Multiple'}</td>
                <td class="mono-val stock-val">${stock1.peRatio ? stock1.peRatio + 'x' : 'N/A'}</td>
                <td class="mono-val stock-val">${stock2.peRatio ? stock2.peRatio + 'x' : 'N/A'}</td>
                ${rec3 ? `<td class="mono-val stock-val">${stock3.peRatio ? stock3.peRatio + 'x' : 'N/A'}</td>` : ''}
              </tr>

              <!-- 5. Dividend Yield -->
              <tr>
                <td class="m-label">${isAr ? 'عائد التوزيعات النقدية السنوي' : 'Dividend Yield'}</td>
                <td class="mono-val stock-val" style="color: #059669;"><b>${(stock1.dividendYield * 100).toFixed(1)}%</b></td>
                <td class="mono-val stock-val" style="color: #059669;"><b>${(stock2.dividendYield * 100).toFixed(1)}%</b></td>
                ${rec3 ? `<td class="mono-val stock-val" style="color: #059669;"><b>${(stock3.dividendYield * 100).toFixed(1)}%</b></td>` : ''}
              </tr>

              <!-- 6. Beta (Systematic Risk) -->
              <tr>
                <td class="m-label">${isAr ? 'معامل بيتا (حساسية السوق)' : 'Beta (Market Sensitivity)'}</td>
                <td class="mono-val stock-val">${stock1.beta || '1.00'}</td>
                <td class="mono-val stock-val">${stock2.beta || '1.00'}</td>
                ${rec3 ? `<td class="mono-val stock-val">${stock3.beta || '1.00'}</td>` : ''}
              </tr>

              <!-- 7. RSI Technical Momentum -->
              <tr>
                <td class="m-label">${isAr ? 'مؤشر القوة النسبية RSI (14)' : 'RSI Momentum'}</td>
                <td class="mono-val stock-val">${rec1.rsi}</td>
                <td class="mono-val stock-val">${rec2.rsi}</td>
                ${rec3 ? `<td class="mono-val stock-val">${rec3.rsi}</td>` : ''}
              </tr>

              <!-- 8. Stop-Loss Level -->
              <tr>
                <td class="m-label">${isAr ? 'وقف الخسارة المقترح' : 'Suggested Stop-Loss'}</td>
                <td class="mono-val stock-val" style="color: #DC2626;">${rec1.stopLoss} ${rec1.currency}</td>
                <td class="mono-val stock-val" style="color: #DC2626;">${rec2.stopLoss} ${rec2.currency}</td>
                ${rec3 ? `<td class="mono-val stock-val" style="color: #DC2626;">${rec3.stopLoss} ${rec3.currency}</td>` : ''}
              </tr>

              <!-- 9. Quantitative Conviction Score -->
              <tr class="highlight-row">
                <td class="m-label">${isAr ? 'درجة الإجماع الكمي الشامل' : 'Quantitative Conviction Score'}</td>
                <td class="mono-val stock-val">
                  <div class="comp-progress-wrap">
                    <div class="comp-progress-bar" style="width: ${rec1.convictionScore}%; background: ${rec1.recType.color};"></div>
                  </div>
                  <b>${rec1.convictionScore}%</b>
                </td>
                <td class="mono-val stock-val">
                  <div class="comp-progress-wrap">
                    <div class="comp-progress-bar" style="width: ${rec2.convictionScore}%; background: ${rec2.recType.color};"></div>
                  </div>
                  <b>${rec2.convictionScore}%</b>
                </td>
                ${rec3 ? `
                  <td class="mono-val stock-val">
                    <div class="comp-progress-wrap">
                      <div class="comp-progress-bar" style="width: ${rec3.convictionScore}%; background: ${rec3.recType.color};"></div>
                    </div>
                    <b>${rec3.convictionScore}%</b>
                  </td>
                ` : ''}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event Bindings
    modalOverlay.querySelector('#close-comparator-btn')?.addEventListener('click', () => modalOverlay.remove());

    modalOverlay.querySelector('#select-stock-1')?.addEventListener('change', (e) => {
      stock1 = saudiStocks.find(s => s.symbol === e.target.value) || stock1;
      renderModalContent();
    });

    modalOverlay.querySelector('#select-stock-2')?.addEventListener('change', (e) => {
      stock2 = saudiStocks.find(s => s.symbol === e.target.value) || stock2;
      renderModalContent();
    });

    if (activeCompareCount === 3) {
      modalOverlay.querySelector('#select-stock-3')?.addEventListener('change', (e) => {
        stock3 = saudiStocks.find(s => s.symbol === e.target.value) || stock3;
        renderModalContent();
      });
    }

    modalOverlay.querySelector('#toggle-3rd-btn')?.addEventListener('click', () => {
      activeCompareCount = activeCompareCount === 2 ? 3 : 2;
      renderModalContent();
    });
  }

  document.body.appendChild(modalOverlay);
  renderModalContent();

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.remove();
  });
}
