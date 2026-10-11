/**
 * Axiom QuantFinance - Institutional Paper Trading Desk Component
 * Real-time order execution, virtual cash wallet, portfolio positions & audit trail
 * @author أ. طارق ابوعشي
 */

import { getSaudiStocks } from '../../data/market-feed.js';
import { getPaperTradingWallet } from '../../core/trading/paper-trading.js';
import { TRANSLATIONS } from '../i18n/translations.js';

export function renderPaperTradingView(container, currentLang = 'ar') {
  const isAr = currentLang === 'ar';
  const saudiStocks = getSaudiStocks();
  const wallet = getPaperTradingWallet();

  // Create current prices map
  const pricesMap = {};
  saudiStocks.forEach(s => {
    pricesMap[s.symbol] = s.spotPrice;
  });

  let selectedOrderSymbol = '2222.SR';
  let orderType = 'BUY';
  let orderShares = 100;

  function renderDesk() {
    const summary = wallet.getSummary(pricesMap);
    const selectedAsset = saudiStocks.find(s => s.symbol === selectedOrderSymbol) || saudiStocks[0];
    const estimatedTotal = orderShares * selectedAsset.spotPrice;

    container.innerHTML = `
      <div class="paper-trading-desk-layout">
        <!-- Header -->
        <div class="desk-intro-row">
          <div>
            <h2 class="desk-title">
              <span class="desk-icon">💼</span>
              ${isAr ? 'محفظة التداول الافتراضي اللحظي (Paper Trading)' : 'Institutional Paper Trading Terminal'}
            </h2>
            <p class="desk-sub">
              ${isAr ? 'تداول تجريبي واقعي بأسعار تداول الحقيقية برصيد افتراضي 100,000 ريال لاختبار الاستراتيجيات بأمان تام' : 'Risk-free simulated execution against real Tadawul live prices'}
            </p>
          </div>
          <button id="reset-wallet-btn" class="danger-btn-outline" title="${isAr ? 'إعادة ضبط المحفظة إلى 100,000 ريال' : 'Reset Wallet'}">
            ↺ ${isAr ? 'إعادة ضبط المحفظة' : 'Reset Wallet (100k SAR)'}
          </button>
        </div>

        <!-- 1. Master KPI Cards -->
        <div class="grid-4col" style="margin-bottom: 24px;">
          <div class="kpi-card highlight-glow">
            <span class="kpi-label">${isAr ? 'إجمالي قيمة المحفظة (Total Equity)' : 'Total Portfolio Equity'}</span>
            <span class="kpi-value mono-val cyan">
              ${summary.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span class="currency-tag">SAR</span>
            </span>
            <span class="kpi-sub ${summary.netOverallPnL >= 0 ? 'green' : 'red'}">
              ${summary.netOverallPnL >= 0 ? '▲ +' : '▼ '}${summary.netOverallPnL.toFixed(2)} SAR (${summary.netOverallReturnPct >= 0 ? '+' : ''}${summary.netOverallReturnPct}%)
            </span>
          </div>

          <div class="kpi-card">
            <span class="kpi-label">${isAr ? 'الرصيد النقدي المتاح (Cash)' : 'Available Cash Balance'}</span>
            <span class="kpi-value mono-val">
              ${summary.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span class="currency-tag">SAR</span>
            </span>
            <span class="kpi-sub">${isAr ? 'جاهز للشراء الفوري' : 'Ready for allocation'}</span>
          </div>

          <div class="kpi-card">
            <span class="kpi-label">${isAr ? 'القيمة السوقية للأسهم' : 'Holdings Market Value'}</span>
            <span class="kpi-value mono-val green">
              ${summary.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span class="currency-tag">SAR</span>
            </span>
            <span class="kpi-sub">${summary.positions.length} ${isAr ? 'مراكز استثمارية مفتوحة' : 'active positions'}</span>
          </div>

          <div class="kpi-card">
            <span class="kpi-label">${isAr ? 'الأرباح المحققة (Realized P&L)' : 'Realized Closed P&L'}</span>
            <span class="kpi-value mono-val ${summary.totalRealizedPnL >= 0 ? 'green' : 'red'}">
              ${summary.totalRealizedPnL >= 0 ? '+' : ''}${summary.totalRealizedPnL.toFixed(2)}
              <span class="currency-tag">SAR</span>
            </span>
            <span class="kpi-sub">${isAr ? 'أرباح الصفقات المغلقة' : 'From closed executions'}</span>
          </div>
        </div>

        <!-- 2. Main Workspace Grid: Order Ticket + Active Positions -->
        <div class="grid-order-positions" style="display: grid; grid-template-columns: 360px 1fr; gap: 20px; margin-bottom: 24px;">
          <!-- Left: Order Placement Ticket -->
          <div class="quant-card order-ticket-card">
            <div class="quant-card-title">
              <span class="title-glyph">⚡</span>
              <span>${isAr ? 'تذكرة تنفيذ الأوامر' : 'Execution Order Ticket'}</span>
            </div>

            <!-- Buy / Sell Segmented Switch -->
            <div class="order-type-switch">
              <button class="order-type-btn ${orderType === 'BUY' ? 'active-buy' : ''}" id="btn-set-buy">
                ${isAr ? 'شراء (Buy)' : 'Buy'}
              </button>
              <button class="order-type-btn ${orderType === 'SELL' ? 'active-sell' : ''}" id="btn-set-sell">
                ${isAr ? 'بيع (Sell)' : 'Sell'}
              </button>
            </div>

            <div class="order-form-body">
              <div class="form-group">
                <label>${isAr ? 'اختر السهم من تاسي:' : 'Select Asset:'}</label>
                <select id="order-asset-select" class="comp-select">
                  ${saudiStocks.map(s => `
                    <option value="${s.symbol}" ${s.symbol === selectedOrderSymbol ? 'selected' : ''}>
                      ${s.shortCode} - ${isAr ? s.nameAr : s.nameEn} (${s.spotPrice.toFixed(2)} SAR)
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label>${isAr ? 'سعر التنفيذ اللحظي (سعر السوق):' : 'Execution Market Spot:'}</label>
                <div class="spot-display-box mono-val">
                  <span>${selectedAsset.spotPrice.toFixed(2)} SAR</span>
                  <span class="live-pill">LIVE</span>
                </div>
              </div>

              <div class="form-group">
                <label>${isAr ? 'عدد الأسهم (Shares):' : 'Quantity (Shares):'}</label>
                <input type="number" id="order-shares-input" class="calc-input mono-val" value="${orderShares}" min="1" step="10" />
                <div class="quick-qty-pills">
                  <button class="qty-pill" data-qty="50">50</button>
                  <button class="qty-pill" data-qty="100">100</button>
                  <button class="qty-pill" data-qty="500">500</button>
                  <button class="qty-pill" data-qty="1000">1000</button>
                </div>
              </div>

              <!-- Cost estimation summary -->
              <div class="order-est-summary">
                <div class="est-row">
                  <span>${isAr ? 'التكلفة الإجمالية التقديرية:' : 'Estimated Total:'}</span>
                  <span class="mono-val" style="font-weight: 700; color: ${orderType === 'BUY' ? '#2563EB' : '#DC2626'};">
                    ${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                  </span>
                </div>
                <div class="est-row sub">
                  <span>${isAr ? 'الرصيد المتبقي بعد الأمر:' : 'Remaining Cash After:'}</span>
                  <span class="mono-val">
                    ${orderType === 'BUY' ? (summary.cash - estimatedTotal).toFixed(2) : (summary.cash + estimatedTotal).toFixed(2)} SAR
                  </span>
                </div>
              </div>

              <div id="order-feedback-msg" class="order-feedback-msg" style="display: none;"></div>

              <button id="submit-order-btn" class="submit-order-btn ${orderType === 'BUY' ? 'btn-buy' : 'btn-sell'}">
                ${orderType === 'BUY' ? (isAr ? 'تنفيذ أمر الشراء اللحظي' : 'Execute Market BUY') : (isAr ? 'تنفيذ أمر البيع' : 'Execute Market SELL')}
              </button>
            </div>
          </div>

          <!-- Right: Active Open Positions Table -->
          <div class="quant-card">
            <div class="quant-card-title">
              <span class="title-glyph">📊</span>
              <span>${isAr ? 'المراكز الاستثمارية المفتوحة (Active Positions)' : 'Active Open Positions'}</span>
              <span class="badge-count">${summary.positions.length}</span>
            </div>

            ${summary.positions.length === 0 ? `
              <div class="empty-positions-state">
                <span class="empty-icon">📂</span>
                <h4>${isAr ? 'لا توجد أسهم في المحفظة حالياً' : 'No Open Positions'}</h4>
                <p>${isAr ? 'اختر سهماً من القائمة يساراً ونفّذ أول أمر شراء للبدء في تتبع محفظتك' : 'Place your first simulated order on the left ticket to begin'}</p>
              </div>
            ` : `
              <div class="table-responsive-wrapper">
                <table class="fintech-screener-table">
                  <thead>
                    <tr>
                      <th>${isAr ? 'السهم' : 'Asset'}</th>
                      <th>${isAr ? 'الكمية' : 'Shares'}</th>
                      <th>${isAr ? 'متوسط الشراء' : 'Avg Cost'}</th>
                      <th>${isAr ? 'السعر الحالي' : 'Spot'}</th>
                      <th>${isAr ? 'القيمة السوقية' : 'Market Val'}</th>
                      <th>${isAr ? 'الربح/الخسارة' : 'Unrealized P&L'}</th>
                      <th>${isAr ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${summary.positions.map(p => `
                      <tr>
                        <td>
                          <div class="asset-cell-compact">
                            <span class="asset-code-bold">${p.shortCode}</span>
                            <span class="asset-name-small">${isAr ? p.nameAr : p.nameEn}</span>
                          </div>
                        </td>
                        <td class="mono-val"><b>${p.shares.toLocaleString()}</b></td>
                        <td class="mono-val">${p.avgPrice.toFixed(2)} SAR</td>
                        <td class="mono-val"><b>${p.currentPrice.toFixed(2)} SAR</b></td>
                        <td class="mono-val">${p.marketValue.toLocaleString()} SAR</td>
                        <td class="mono-val ${p.unrealizedPnL >= 0 ? 'pos' : 'neg'}">
                          <b>${p.unrealizedPnL >= 0 ? '+' : ''}${p.unrealizedPnL.toFixed(2)} SAR</b>
                          <div class="sub-pct">(${p.returnPct >= 0 ? '+' : ''}${p.returnPct}%)</div>
                        </td>
                        <td>
                          <button class="quick-sell-btn" data-symbol="${p.symbol}" data-shares="${p.shares}">
                            ${isAr ? 'تسييل الكل' : 'Close'}
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>

        <!-- 3. Transaction History Log -->
        <div class="quant-card">
          <div class="quant-card-title">
            <span class="title-glyph">📜</span>
            <span>${isAr ? 'سجل العمليات والصفقات المنفذة (Audit Trail)' : 'Transaction History Log'}</span>
            <span class="badge-count">${summary.history.length}</span>
          </div>

          ${summary.history.length === 0 ? `
            <p style="padding: 20px; color: #94A3B8; text-align: center;">${isAr ? 'لم يتم تنفيذ أي صفقات بعد' : 'No transactions recorded yet'}</p>
          ` : `
            <div class="table-responsive-wrapper">
              <table class="fintech-screener-table audit-table">
                <thead>
                  <tr>
                    <th>${isAr ? 'معرف العملية' : 'Tx ID'}</th>
                    <th>${isAr ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                    <th>${isAr ? 'النوع' : 'Type'}</th>
                    <th>${isAr ? 'السهم' : 'Asset'}</th>
                    <th>${isAr ? 'الكمية' : 'Quantity'}</th>
                    <th>${isAr ? 'سعر التنفيذ' : 'Price'}</th>
                    <th>${isAr ? 'إجمالي القيمة' : 'Total Value'}</th>
                    <th>${isAr ? 'الربح المحقق' : 'Realized P&L'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${summary.history.map(h => `
                    <tr>
                      <td class="mono-val text-muted" style="font-size: 11px;">${h.id}</td>
                      <td class="mono-val text-muted" style="font-size: 11px;">${new Date(h.timestamp).toLocaleString(isAr ? 'ar-SA' : 'en-US')}</td>
                      <td>
                        <span class="tx-badge ${h.type === 'BUY' ? 'badge-buy' : 'badge-sell'}">
                          ${h.type}
                        </span>
                      </td>
                      <td><b>${h.shortCode}</b></td>
                      <td class="mono-val">${h.shares.toLocaleString()}</td>
                      <td class="mono-val">${h.price.toFixed(2)} SAR</td>
                      <td class="mono-val">${h.totalSAR.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR</td>
                      <td class="mono-val ${h.realizedPnL > 0 ? 'pos' : (h.realizedPnL < 0 ? 'neg' : '')}">
                        ${h.type === 'SELL' ? `${h.realizedPnL >= 0 ? '+' : ''}${h.realizedPnL.toFixed(2)} SAR` : '-'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    // Event Bindings
    document.getElementById('btn-set-buy').addEventListener('click', () => {
      orderType = 'BUY';
      renderDesk();
    });

    document.getElementById('btn-set-sell').addEventListener('click', () => {
      orderType = 'SELL';
      renderDesk();
    });

    document.getElementById('order-asset-select').addEventListener('change', (e) => {
      selectedOrderSymbol = e.target.value;
      renderDesk();
    });

    document.getElementById('order-shares-input').addEventListener('input', (e) => {
      const val = Math.max(1, Math.floor(Number(e.target.value) || 1));
      orderShares = val;
      const asset = saudiStocks.find(s => s.symbol === selectedOrderSymbol);
      const est = val * asset.spotPrice;
      const estEl = container.querySelector('.order-est-summary span.mono-val');
      if (estEl) estEl.innerText = est.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' SAR';
    });

    document.querySelectorAll('.qty-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        orderShares = Number(btn.getAttribute('data-qty'));
        renderDesk();
      });
    });

    // Submit Order
    document.getElementById('submit-order-btn').addEventListener('click', () => {
      const asset = saudiStocks.find(s => s.symbol === selectedOrderSymbol);
      const result = wallet.executeOrder({
        symbol: asset.symbol,
        shortCode: asset.shortCode,
        nameAr: asset.nameAr,
        nameEn: asset.nameEn,
        type: orderType,
        shares: orderShares,
        price: asset.spotPrice
      });

      const feedback = document.getElementById('order-feedback-msg');
      if (!result.success) {
        feedback.style.display = 'block';
        feedback.className = 'order-feedback-msg err';
        feedback.innerText = result.error;
      } else {
        renderDesk();
      }
    });

    // Quick Sell from Positions Table
    document.querySelectorAll('.quick-sell-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sym = btn.getAttribute('data-symbol');
        const sh = Number(btn.getAttribute('data-shares'));
        const asset = saudiStocks.find(s => s.symbol === sym);
        if (asset && sh > 0) {
          wallet.executeOrder({
            symbol: sym,
            shortCode: asset.shortCode,
            nameAr: asset.nameAr,
            nameEn: asset.nameEn,
            type: 'SELL',
            shares: sh,
            price: asset.spotPrice
          });
          renderDesk();
        }
      });
    });

    // Reset Wallet
    document.getElementById('reset-wallet-btn').addEventListener('click', () => {
      if (confirm(isAr ? 'هل أنت متأكد من إعادة ضبط المحفظة الافتراضية إلى 100,000 ريال؟' : 'Are you sure you want to reset your paper wallet to 100,000 SAR?')) {
        wallet.reset(100000);
        renderDesk();
      }
    });
  }

  renderDesk();
}

/**
 * Quick helper to open buy modal directly for a given stock from another view
 */
export function quickBuyModal(symbol) {
  const wallet = getPaperTradingWallet();
  const stocks = getSaudiStocks();
  const stock = stocks.find(s => s.symbol === symbol) || stocks[0];
  const qty = prompt(`شراء أسهم افتراضية لـ ${stock.nameAr} (${stock.spotPrice} ر.س):\nأدخل عدد الأسهم المراد شراؤها:`, "100");
  if (qty && Number(qty) > 0) {
    const res = wallet.executeOrder({
      symbol: stock.symbol,
      shortCode: stock.shortCode,
      nameAr: stock.nameAr,
      nameEn: stock.nameEn,
      type: 'BUY',
      shares: Number(qty),
      price: stock.spotPrice
    });
    if (res.success) {
      alert(`✔ تم تنفيذ أمر الشراء بنجاح!\nتم شراء ${qty} سهم بقيمة ${(Number(qty) * stock.spotPrice).toFixed(2)} ر.س`);
    } else {
      alert(`❌ فشل تنفيذ الأمر: ${res.error}`);
    }
  }
}
