/**
 * Axiom QuantFinance - Master Application Orchestrator
 * Dynamic Cursor Spotlight Tracker, Workspace Presets & Reactive Event Bus
 * @author أ. طارق ابوعشي
 */

import { renderTopBar } from './ui/components/top-bar.js';
import { renderSaudiStocksView } from './ui/components/saudi-stocks-view.js';
import { renderPortfolioView } from './ui/components/portfolio-view.js';
import { renderEquityAnalysisView } from './ui/components/equity-analysis-view.js';
import { renderDerivativesLabView } from './ui/components/derivatives-lab-view.js';
import { renderRiskSimulationView } from './ui/components/risk-simulation-view.js';
import { renderPaperTradingView } from './ui/components/paper-trading-view.js';
import { renderTerminalConsole } from './ui/components/terminal-console.js';

class AxiomQuantApp {
  constructor() {
    this.currentLang = localStorage.getItem('axiom_lang') || 'ar';
    this.currentTheme = localStorage.getItem('axiom_theme') || 'light';
    this.activeTab = 'saudi-stocks';
    this.activeWorkspace = 'saudi';

    this.topBarContainer = document.getElementById('top-bar-root');
    this.workspaceContainer = document.getElementById('workspace-root');

    this.init();
  }

  init() {
    this.applyTheme();
    this.applyDirection();
    this.renderHeader();
    this.renderCurrentView();
    this.bindEvents();
    this.initSpotlightTracker();

    // Redraw active canvas on window resize with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.renderCurrentView();
      }, 150);
    });
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }

  applyDirection() {
    document.documentElement.lang = this.currentLang;
    document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
  }

  renderHeader() {
    renderTopBar(this.topBarContainer, this.currentLang, this.activeWorkspace, this.currentTheme);

    // Theme toggle button
    const btnTheme = document.getElementById('btn-toggle-theme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('axiom_theme', this.currentTheme);
        this.applyTheme();
        this.renderHeader();
        this.renderCurrentView();
      });
    }

    // Lang toggle button
    const btnLang = document.getElementById('btn-toggle-lang');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        this.currentLang = this.currentLang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('axiom_lang', this.currentLang);
        this.applyDirection();
        this.renderHeader();
        this.renderCurrentView();
      });
    }

    // Nav Tab buttons
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = btn.getAttribute('data-tab');
        if (targetTab && targetTab !== this.activeTab) {
          this.activeTab = targetTab;
          tabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderCurrentView();
        }
      });
    });

    // Mark active tab button
    const activeBtn = document.querySelector(`.nav-tab-btn[data-tab="${this.activeTab}"]`);
    if (activeBtn) {
      tabBtns.forEach(b => b.classList.remove('active'));
      activeBtn.classList.add('active');
    }

    // Workspace Mode Buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const ws = btn.getAttribute('data-workspace');
        this.activeWorkspace = ws;
        if (ws === 'saudi') this.switchTab('saudi-stocks');
        else if (ws === 'derivatives') this.switchTab('derivatives');
        else if (ws === 'equity') this.switchTab('equity');
        else if (ws === 'risk') this.switchTab('risk');
        else this.switchTab('portfolio');
      });
    });
  }

  renderCurrentView() {
    this.workspaceContainer.innerHTML = '';

    switch (this.activeTab) {
      case 'saudi-stocks':
        renderSaudiStocksView(this.workspaceContainer, this.currentLang);
        break;
      case 'portfolio':
        renderPortfolioView(this.workspaceContainer, this.currentLang);
        break;
      case 'equity':
        renderEquityAnalysisView(this.workspaceContainer, this.currentLang);
        break;
      case 'derivatives':
        renderDerivativesLabView(this.workspaceContainer, this.currentLang);
        break;
      case 'risk':
        renderRiskSimulationView(this.workspaceContainer, this.currentLang);
        break;
      case 'paper-trading':
        renderPaperTradingView(this.workspaceContainer, this.currentLang);
        break;
      case 'console':
        renderTerminalConsole(this.workspaceContainer, this.currentLang);
        break;
      default:
        renderSaudiStocksView(this.workspaceContainer, this.currentLang);
    }
  }

  initSpotlightTracker() {
    document.addEventListener('mousemove', (e) => {
      const cards = document.querySelectorAll('.quant-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  bindEvents() {
    // Universal shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === '1') { this.switchTab('saudi-stocks'); }
      if (e.altKey && e.key === '2') { this.switchTab('portfolio'); }
      if (e.altKey && e.key === '3') { this.switchTab('equity'); }
      if (e.altKey && e.key === '4') { this.switchTab('derivatives'); }
      if (e.altKey && e.key === '5') { this.switchTab('risk'); }
      if (e.altKey && e.key === '6') { this.switchTab('paper-trading'); }
      if (e.altKey && e.key === '7') { this.switchTab('console'); }
    });
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.renderHeader();
    this.renderCurrentView();
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.AxiomApp = new AxiomQuantApp();
});
