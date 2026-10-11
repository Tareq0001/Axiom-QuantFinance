/**
 * Axiom QuantFinance - Monte Carlo & Quantitative Risk Analytics View Component
 * Geometric Brownian Motion (GBM), VaR / CVaR Methodologies & Macroeconomic Stress Testing
 * @author أ. طارق ابوعشي
 */

import { runMonteCarloSimulation } from '../../core/risk/monte-carlo.js';
import { calculateRiskMetrics, calculateMonteCarloVaR } from '../../core/risk/var-cvar.js';
import { HISTORICAL_SCENARIOS, applyStressScenario } from '../../core/risk/stress-testing.js';
import { getAssetBySymbol } from '../../data/market-feed.js';
import { renderMonteCarloChart } from '../charts/canvas-monte-carlo.js';
import { TRANSLATIONS } from '../i18n/translations.js';

let mcSettings = {
  numSimulations: 800,
  days: 45
};

let selectedScenarioId = "gfc_2008";

export function renderRiskSimulationView(container, currentLang = 'ar') {
  const t = TRANSLATIONS[currentLang];
  const spy = getAssetBySymbol("SPY");

  // Daily returns of SPY for historical & parametric VaR
  const closes = spy.prices.map(p => p.close);
  const spyReturns = [];
  for (let i = 1; i < closes.length; i++) {
    spyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }

  // 1. Run Monte Carlo Simulation
  const mc = runMonteCarloSimulation({
    S0: spy.spotPrice,
    mu: 0.11,
    sigma: 0.16,
    days: mcSettings.days,
    numSimulations: mcSettings.numSimulations
  });

  // 2. Risk Metrics (VaR & CVaR)
  const portfolioVal = 500000; // $500,000 reference portfolio
  const risk95 = calculateRiskMetrics({
    historicalReturns: spyReturns,
    portfolioValue: portfolioVal,
    confidenceLevel: 0.95
  });
  const risk99 = calculateRiskMetrics({
    historicalReturns: spyReturns,
    portfolioValue: portfolioVal,
    confidenceLevel: 0.99
  });
  const mcVaR95 = calculateMonteCarloVaR(spy.spotPrice, mc.sortedFinals, portfolioVal, 0.95);

  // 3. Stress Test
  const mockPortfolio = {
    equityHoldingsValue: 400000,
    cashValue: 100000,
    optionsDelta: 45,
    optionsVega: 85
  };
  const stressResult = applyStressScenario(mockPortfolio, selectedScenarioId);

  container.innerHTML = `
    <div class="view-header">
      <h2>${t.riskTitle}</h2>
      <p>${t.riskDesc}</p>
    </div>

    <!-- VaR & CVaR High-Level KPI Cards -->
    <div class="grid-4col" style="margin-bottom: 24px;">
      <div class="kpi-card">
        <span class="kpi-label">${t.varConfidence95} (Parametric 1-Day)</span>
        <span class="kpi-value red"><span style="direction: ltr; display: inline-block;">-$${Math.round(risk95.parametric.varAmount).toLocaleString()}</span></span>
        <span class="kpi-sub"><span style="direction: ltr; display: inline-block;">${(risk95.parametric.varPct * 100).toFixed(2)}%</span> of Portfolio</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">${t.cvarConfidence95} (Expected Shortfall)</span>
        <span class="kpi-value red"><span style="direction: ltr; display: inline-block;">-$${Math.round(risk95.parametric.cvarAmount).toLocaleString()}</span></span>
        <span class="kpi-sub">Tail Average Expected Loss</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">${t.varConfidence99} (Parametric 1-Day)</span>
        <span class="kpi-value red"><span style="direction: ltr; display: inline-block;">-$${Math.round(risk99.parametric.varAmount).toLocaleString()}</span></span>
        <span class="kpi-sub"><span style="direction: ltr; display: inline-block;">${(risk99.parametric.varPct * 100).toFixed(2)}%</span> Extreme Loss</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Monte Carlo Horizon VaR (${mcSettings.days}D)</span>
        <span class="kpi-value gold"><span style="direction: ltr; display: inline-block;">-$${Math.round(mcVaR95.varAmount).toLocaleString()}</span></span>
        <span class="kpi-sub"><span style="direction: ltr; display: inline-block;">${(mcVaR95.lossPct * 100).toFixed(2)}%</span> Horizon Loss</span>
      </div>
    </div>

    <!-- Monte Carlo Simulation Panel & Fan Chart -->
    <div class="quant-card" style="margin-bottom: 24px;">
      <div class="quant-card-title">
        <span>${t.mcTitle}</span>
        <div style="display: flex; gap: 16px; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-size: 12px; color: var(--text-muted);">${t.inputSimulations}</label>
            <input type="number" id="input-mc-sims" class="form-control" style="width: 80px; padding: 4px 8px;" value="${mcSettings.numSimulations}" min="100" max="2000" step="100">
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-size: 12px; color: var(--text-muted);">${t.inputHorizonDays}</label>
            <input type="number" id="input-mc-days" class="form-control" style="width: 70px; padding: 4px 8px;" value="${mcSettings.days}" min="10" max="252" step="5">
          </div>
          <button id="btn-run-mc" class="btn-primary" style="padding: 6px 14px;">
            <span>⚡</span> <span>${t.btnRunSimulation}</span>
          </button>
        </div>
      </div>

      <div class="canvas-wrapper" style="height: 380px;">
        <canvas id="canvas-monte-carlo"></canvas>
      </div>
    </div>

    <!-- Historical Crisis Stress Testing Panel -->
    <div class="quant-card">
      <div class="quant-card-title">
        <span>${t.stressTestingTitle}</span>
        <span class="badge-tag">Macroeconomic Shock Simulation</span>
      </div>

      <div class="grid-2col" style="gap: 20px; align-items: center;">
        <div>
          <div class="form-group">
            <label>${t.selectScenario}</label>
            <select id="select-stress-scenario" class="form-control" style="font-weight: 700;">
              ${HISTORICAL_SCENARIOS.map(s => `
                <option value="${s.id}" ${s.id === selectedScenarioId ? 'selected' : ''}>
                  ${currentLang === 'ar' ? s.nameAr : s.nameEn} (Equities: ${(s.equityShock * 100).toFixed(0)}%, Vol: +${(s.volatilityShock * 100).toFixed(0)}%)
                </option>
              `).join('')}
            </select>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
            ${currentLang === 'ar' ? stressResult.scenario.descriptionAr : stressResult.scenario.descriptionEn}
          </p>
          <div style="font-size: 12px; color: var(--text-dim); display: flex; gap: 15px;">
            <span>Rates Shock: <strong class="mono-val" style="color: var(--text-main);">${stressResult.scenario.rateShockBps} bps</strong></span>
            <span>Credit Spread: <strong class="mono-val" style="color: var(--text-main);">+${stressResult.scenario.creditSpreadBps} bps</strong></span>
          </div>
        </div>

        <div style="background: rgba(0,0,0,0.35); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <span style="font-size: 13px; color: var(--text-muted);">${t.lossImpact}</span>
            <span class="mono-val" style="font-size: 24px; font-weight: 800; color: var(--accent-red);">
              ${Math.round(stressResult.totalPnL).toLocaleString()} $ (${stressResult.drawdownPct.toFixed(1)}%)
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
            <span>${t.remainingValue}</span>
            <span class="mono-val" style="font-weight: 700; color: var(--text-main);">${Math.round(stressResult.totalValueAfter).toLocaleString()} $</span>
          </div>
          <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; font-size: 11.5px; color: var(--text-dim); display: flex; justify-content: space-between;">
            <span>Equity Loss: ${Math.round(stressResult.breakdown.equityLoss).toLocaleString()} $</span>
            <span>Options Delta: ${Math.round(stressResult.breakdown.optionsDeltaImpact).toLocaleString()} $</span>
            <span>Options Vega: +${Math.round(stressResult.breakdown.optionsVegaImpact).toLocaleString()} $</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render Monte Carlo Canvas
  const canvasMC = container.querySelector('#canvas-monte-carlo');
  if (canvasMC) {
    setTimeout(() => {
      renderMonteCarloChart(canvasMC, mc);
    }, 50);
  }

  // Bind Monte Carlo controls
  const btnRunMC = container.querySelector('#btn-run-mc');
  const inputSims = container.querySelector('#input-mc-sims');
  const inputDays = container.querySelector('#input-mc-days');

  if (btnRunMC) {
    btnRunMC.addEventListener('click', () => {
      mcSettings.numSimulations = parseInt(inputSims.value) || 800;
      mcSettings.days = parseInt(inputDays.value) || 45;
      renderRiskSimulationView(container, currentLang);
    });
  }

  // Bind Stress Scenario select
  const selScenario = container.querySelector('#select-stress-scenario');
  if (selScenario) {
    selScenario.addEventListener('change', (e) => {
      selectedScenarioId = e.target.value;
      renderRiskSimulationView(container, currentLang);
    });
  }
}
