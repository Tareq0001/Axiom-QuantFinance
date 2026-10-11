/**
 * Axiom QuantFinance - Modern Single Floating Glass Navbar (Linear / Robinhood Pro)
 * Ultra-sleek 56px unified bar, segmented tab switch, live TASI pulse chip, theme/lang controls
 * @author أ. طارق ابوعشي
 */

import { TRANSLATIONS } from '../i18n/translations.js';

export function renderTopBar(container, currentLang = 'ar', activeWorkspace = 'all', currentTheme = 'light') {
  const t = TRANSLATIONS[currentLang];
  const isAr = currentLang === 'ar';

  container.innerHTML = `
    <header class="glass-navbar">
      <div class="navbar-inner">
        <!-- 1. Brand Logo & Identity -->
        <div class="navbar-brand">
          <div class="brand-monogram">
            <span class="mono-glyph">Ω</span>
            <span class="pulse-led"></span>
          </div>
          <div class="brand-text">
            <div class="brand-title-wrap">
              <span class="brand-name">AXIOM</span>
              <span class="brand-sub">QUANT</span>
            </div>
            <span class="brand-badge">${isAr ? 'منصة التحليل المؤسسي' : 'Institutional'}</span>
          </div>
        </div>

        <!-- 2. Sleek Segmented Navigation Switcher -->
        <nav class="navbar-segmented-nav">
          <button class="nav-tab-btn active" data-tab="saudi-stocks" title="${t.navSaudiStocks}">
            <svg width="15" height="10" viewBox="0 0 20 13" fill="none" style="display:inline-block; vertical-align:middle; border-radius:2px; margin-inline-end:4px;" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="13" rx="2" fill="#006C35"/><path d="M4 9h12M6 6.5h8" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/><circle cx="10" cy="4" r="0.9" fill="#fff"/></svg>
            <span>${isAr ? 'الأسهم السعودية (تاسي)' : 'Saudi Stocks (TASI)'}</span>
          </button>
          <button class="nav-tab-btn" data-tab="portfolio" title="${t.navPortfolio}">
            <span>📊</span> <span>${isAr ? 'المحافظ (ماركويتز)' : 'Portfolio (MPT)'}</span>
          </button>
          <button class="nav-tab-btn" data-tab="equity" title="${t.navEquity}">
            <span>📈</span> <span>${isAr ? 'التقييم الجوهري (DCF)' : 'Valuation (DCF)'}</span>
          </button>
          <button class="nav-tab-btn" data-tab="derivatives" title="${t.navDerivatives}">
            <span>⚡</span> <span>${isAr ? 'معمل المشتقات' : 'Derivatives Lab'}</span>
          </button>
          <button class="nav-tab-btn" data-tab="risk" title="${t.navRisk}">
            <span>🎲</span> <span>${isAr ? 'مونت كارلو والمخاطر' : 'Risk & VaR'}</span>
          </button>
          <button class="nav-tab-btn" data-tab="paper-trading" title="${isAr ? 'محفظة التداول الافتراضي' : 'Paper Trading'}">
            <span>💼</span> <span>${isAr ? 'التداول الافتراضي' : 'Paper Trading'}</span>
          </button>
          <button class="nav-tab-btn" data-tab="console" title="${t.navConsole}">
            <span>💻</span> <span>${isAr ? 'الطرفية الكمية' : 'Quant Terminal'}</span>
          </button>
        </nav>

        <!-- 3. Actions: Market Chip, Theme Toggle, Language -->
        <div class="navbar-actions">
          <div class="tasi-market-chip" title="${isAr ? 'مؤشر السوق الرئيسي (تاسي) اللحظي' : 'TASI Main Index Live Spot'}">
            <span class="chip-dot"></span>
            <span class="chip-name">TASI</span>
            <span class="chip-val mono-val">11,852.4</span>
            <span class="chip-change mono-val pos">▲ +0.4%</span>
          </div>

          <button id="btn-toggle-theme" class="navbar-icon-btn" title="${currentTheme === 'dark' ? (isAr ? 'الوضع الفاتح' : 'Light Mode') : (isAr ? 'الوضع الداكن' : 'Dark Mode')}">
            <span>${currentTheme === 'dark' ? '☀️' : '🌙'}</span>
          </button>

          <button id="btn-toggle-lang" class="navbar-pill-btn" title="تبديل اللغة / Toggle Language">
            <span>🌐</span>
            <span>${t.langToggle}</span>
          </button>
        </div>
      </div>
    </header>
  `;
}
