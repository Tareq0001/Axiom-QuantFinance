/**
 * Axiom QuantFinance - Upgraded Derivatives & Options Laboratory View Component
 * BSM Pricing, Greeks Radar Canvas, Isometric 3D Volatility Landscape & Payoff Architect
 * @author أ. طارق ابوعشي
 */

import { calculateBSM } from '../../core/derivatives/black-scholes.js';
import { calculateBinomialTree } from '../../core/derivatives/binomial-tree.js';
import { createStrategyTemplate } from '../../core/derivatives/strategies.js';
import { generateOptionsChain } from '../../data/options-chain-mock.js';
import { renderPayoffChart } from '../charts/canvas-payoff.js';
import { renderVolSurfaceHeatmap } from '../charts/canvas-vol-surface.js';
import { renderGreeksRadarChart } from '../charts/canvas-greeks-radar.js';
import { TRANSLATIONS } from '../i18n/translations.js';

let bsmState = {
  S: 575.0,
  K: 575.0,
  days: 30,
  r: 0.045,
  sigma: 0.22,
  type: 'call'
};

let activeStrategyKey = 'iron_condor';

export function renderDerivativesLabView(container, currentLang = 'ar') {
  const t = TRANSLATIONS[currentLang];

  // 1. Compute BSM & Greeks
  const T = bsmState.days / 365;
  const bsm = calculateBSM({
    S: bsmState.S,
    K: bsmState.K,
    T,
    r: bsmState.r,
    q: 0.012,
    sigma: bsmState.sigma,
    type: bsmState.type
  });

  // American Binomial Tree Comparison
  const tree = calculateBinomialTree({
    S: bsmState.S,
    K: bsmState.K,
    T,
    r: bsmState.r,
    q: 0.012,
    sigma: bsmState.sigma,
    steps: 50,
    type: bsmState.type,
    style: 'american'
  });

  // 2. Options Strategy Payoff
  const strategy = createStrategyTemplate(activeStrategyKey, {
    S: bsmState.S,
    T,
    r: bsmState.r,
    iv: bsmState.sigma
  });
  const payoffData = strategy.generatePayoffCurve(bsmState.S, 0.25, 60, bsmState.r);

  // 3. Options Chain Data for SPY
  const optionsChain = generateOptionsChain(bsmState.S, "SPY", bsmState.r, bsmState.sigma);

  container.innerHTML = `
    <div class="view-header">
      <h2>${t.derivativesTitle}</h2>
      <p>${t.derivativesDesc}</p>
    </div>

    <!-- Black-Scholes Calculator & Greeks Radar Grid -->
    <div class="grid-2col" style="margin-bottom: 24px;">
      <div class="quant-card">
        <div class="quant-card-title">
          <span>${t.bsmCalculatorTitle}</span>
          <span class="badge-tag">BSM & CRR Binomial</span>
        </div>

        <div class="grid-2col" style="gap: 12px; margin-bottom: 12px;">
          <div class="form-group">
            <label>${t.inputSpot}</label>
            <input type="number" id="input-bsm-s" class="form-control" value="${bsmState.S}" step="1">
          </div>
          <div class="form-group">
            <label>${t.inputStrike}</label>
            <input type="number" id="input-bsm-k" class="form-control" value="${bsmState.K}" step="1">
          </div>
          <div class="form-group">
            <label>${t.inputExpiry}</label>
            <input type="number" id="input-bsm-days" class="form-control" value="${bsmState.days}" min="1" max="730">
          </div>
          <div class="form-group">
            <label>${t.inputVol}</label>
            <input type="number" id="input-bsm-vol" class="form-control" value="${(bsmState.sigma * 100).toFixed(1)}" step="0.5">
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 16px;">
          <button id="btn-type-call" class="btn-primary" style="flex: 1; opacity: ${bsmState.type === 'call' ? '1' : '0.45'}">
            ${t.typeCall}
          </button>
          <button id="btn-type-put" class="btn-primary" style="flex: 1; opacity: ${bsmState.type === 'put' ? '1' : '0.45'}; background: #6366F1;">
            ${t.typePut}
          </button>
        </div>

        <!-- Calculated Values Display -->
        <div style="background: rgba(0,0,0,0.4); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <span style="font-size: 13px; color: var(--text-muted);">${t.theoreticalPrice}</span>
            <span class="mono-val" style="font-size: 28px; font-weight: 800; color: var(--accent-cyan); text-shadow: 0 0 16px var(--accent-cyan-glow);">
              ${bsm.price.toFixed(2)} $
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-dim); flex-wrap: wrap; gap: 8px;">
            <span>${t.intrinsicValue}: <strong class="mono-val" style="color: var(--text-main);">${bsm.intrinsicValue.toFixed(2)} $</strong></span>
            <span>${t.timeValue}: <strong class="mono-val" style="color: var(--text-main);">${bsm.timeValue.toFixed(2)} $</strong></span>
            <span>American CRR: <strong class="mono-val" style="color: var(--accent-gold);">${tree.price.toFixed(2)} $</strong></span>
          </div>
        </div>
      </div>

      <!-- The Greeks Risk Radar (Visual 5-Axis Spider Chart) -->
      <div class="quant-card">
        <div class="quant-card-title">
          <span>${t.greeksTitle}</span>
          <span class="badge-tag">Spider Risk Radar</span>
        </div>

        <div style="display: flex; align-items: center; justify-content: center; height: 260px;">
          <canvas id="canvas-greeks-radar" style="width: 100%; height: 100%;"></canvas>
        </div>
      </div>
    </div>

    <!-- Strategy Builder & Interactive Payoff Profile -->
    <div class="quant-card" style="margin-bottom: 24px;">
      <div class="quant-card-title">
        <span>${t.strategyBuilderTitle}</span>
        <div style="display: flex; gap: 8px;">
          <select id="select-strategy-template" class="form-control" style="width: auto; padding: 4px 12px; font-size: 12px; font-weight: 700;">
            <option value="iron_condor" ${activeStrategyKey === 'iron_condor' ? 'selected' : ''}>${t.stratIronCondor}</option>
            <option value="bull_call_spread" ${activeStrategyKey === 'bull_call_spread' ? 'selected' : ''}>${t.stratBullCall}</option>
            <option value="bear_put_spread" ${activeStrategyKey === 'bear_put_spread' ? 'selected' : ''}>${t.stratBearPut}</option>
            <option value="long_straddle" ${activeStrategyKey === 'long_straddle' ? 'selected' : ''}>${t.stratStraddle}</option>
            <option value="covered_call" ${activeStrategyKey === 'covered_call' ? 'selected' : ''}>${t.stratCoveredCall}</option>
          </select>
        </div>
      </div>

      <!-- Strategy Metrics Summary Bar -->
      <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 16px; background: rgba(0,0,0,0.35); padding: 12px 18px; border-radius: 6px; border: 1px solid var(--border-subtle);">
        <div>
          <span style="font-size: 12px; color: var(--text-muted);">${t.maxProfit}:</span>
          <span class="mono-val" style="color: var(--accent-green); font-weight: 800; margin-left: 6px;">
            ${payoffData.maxProfit === Infinity ? 'Unlimited' : `+${Math.round(payoffData.maxProfit)} $`}
          </span>
        </div>
        <div>
          <span style="font-size: 12px; color: var(--text-muted);">${t.maxLoss}:</span>
          <span class="mono-val" style="color: var(--accent-red); font-weight: 800; margin-left: 6px;">
            ${payoffData.maxLoss === -Infinity ? 'Unlimited' : `${Math.round(payoffData.maxLoss)} $`}
          </span>
        </div>
        <div>
          <span style="font-size: 12px; color: var(--text-muted);">${t.netCost}:</span>
          <span class="mono-val" style="color: ${payoffData.isDebit ? 'var(--accent-red)' : 'var(--accent-green)'}; font-weight: 800; margin-left: 6px;">
            ${payoffData.isDebit ? `Debit (-${Math.round(payoffData.netCost)}$)` : `Credit (+${Math.round(-payoffData.netCost)}$)`}
          </span>
        </div>
        <div>
          <span style="font-size: 12px; color: var(--text-muted);">${t.breakevenPoints}:</span>
          <span class="mono-val" style="color: var(--accent-cyan); font-weight: 800; margin-left: 6px;">
            ${payoffData.breakevens.join(', ') || 'N/A'}
          </span>
        </div>
      </div>

      <div class="canvas-wrapper">
        <canvas id="canvas-payoff"></canvas>
      </div>
    </div>

    <!-- Isometric 3D Volatility Surface -->
    <div class="quant-card" style="margin-bottom: 24px;">
      <div class="quant-card-title">
        <span>${t.volSurfaceTitle}</span>
        <span class="badge-tag">Isometric 3D Landscape</span>
      </div>
      <div class="canvas-wrapper" style="height: 320px;">
        <canvas id="canvas-vol-surface"></canvas>
      </div>
    </div>

    <!-- Options Chain Matrix -->
    <div class="quant-card">
      <div class="quant-card-title">
        <span>${t.optionsChainTitle} (SPY 30-Day Expiration)</span>
        <span class="badge-tag">Live Order Book Quotes</span>
      </div>
      <div style="overflow-x: auto;">
        <table class="quant-table">
          <thead>
            <tr style="text-align: center;">
              <th colspan="4" style="background: rgba(16, 185, 129, 0.08); color: var(--accent-green); text-align: center;">CALLS (عقود الشراء)</th>
              <th rowspan="2" style="background: rgba(0, 240, 255, 0.15); color: var(--accent-cyan); text-align: center;">STRIKE K</th>
              <th colspan="4" style="background: rgba(99, 102, 241, 0.08); color: #818CF8; text-align: center;">PUTS (عقود البيع)</th>
            </tr>
            <tr>
              <th>Bid</th>
              <th>Ask</th>
              <th>Delta</th>
              <th>IV</th>
              <th>Bid</th>
              <th>Ask</th>
              <th>Delta</th>
              <th>IV</th>
            </tr>
          </thead>
          <tbody>
            ${optionsChain.chainByExpiration["30 Days (Monthly)"].contracts.map(c => `
              <tr style="${Math.abs(c.strike - bsmState.S) < 3 ? 'background: rgba(0, 240, 255, 0.08); border-left: 3px solid var(--accent-cyan);' : ''}">
                <td class="mono-val" style="color: var(--accent-green); font-weight: 700;">${c.call.bid.toFixed(2)}</td>
                <td class="mono-val" style="color: var(--accent-green);">${c.call.ask.toFixed(2)}</td>
                <td class="mono-val">${c.call.delta.toFixed(2)}</td>
                <td class="mono-val">${(c.iv * 100).toFixed(1)}%</td>

                <td class="mono-val" style="text-align: center; font-weight: 800; color: var(--accent-cyan); background: rgba(0,0,0,0.25);">
                  ${c.strike.toFixed(1)}
                </td>

                <td class="mono-val" style="color: #818CF8; font-weight: 700;">${c.put.bid.toFixed(2)}</td>
                <td class="mono-val" style="color: #818CF8;">${c.put.ask.toFixed(2)}</td>
                <td class="mono-val">${c.put.delta.toFixed(2)}</td>
                <td class="mono-val">${(c.iv * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render Charts
  const canvasPayoff = container.querySelector('#canvas-payoff');
  if (canvasPayoff) {
    setTimeout(() => {
      renderPayoffChart(canvasPayoff, payoffData, bsmState.S);
    }, 50);
  }

  const canvasVol = container.querySelector('#canvas-vol-surface');
  if (canvasVol) {
    setTimeout(() => {
      renderVolSurfaceHeatmap(canvasVol, optionsChain);
    }, 50);
  }

  const canvasRadar = container.querySelector('#canvas-greeks-radar');
  if (canvasRadar) {
    setTimeout(() => {
      renderGreeksRadarChart(canvasRadar, bsm);
    }, 50);
  }

  // Bind BSM Inputs
  const inputS = container.querySelector('#input-bsm-s');
  const inputK = container.querySelector('#input-bsm-k');
  const inputDays = container.querySelector('#input-bsm-days');
  const inputVol = container.querySelector('#input-bsm-vol');

  function updateBSMFromInputs() {
    bsmState.S = parseFloat(inputS.value) || 575;
    bsmState.K = parseFloat(inputK.value) || 575;
    bsmState.days = parseInt(inputDays.value) || 30;
    bsmState.sigma = (parseFloat(inputVol.value) || 22) / 100;
    renderDerivativesLabView(container, currentLang);
  }

  [inputS, inputK, inputDays, inputVol].forEach(inp => {
    if (inp) inp.addEventListener('change', updateBSMFromInputs);
  });

  // Call / Put Toggle
  const btnCall = container.querySelector('#btn-type-call');
  const btnPut = container.querySelector('#btn-type-put');
  if (btnCall && btnPut) {
    btnCall.addEventListener('click', () => {
      bsmState.type = 'call';
      renderDerivativesLabView(container, currentLang);
    });
    btnPut.addEventListener('click', () => {
      bsmState.type = 'put';
      renderDerivativesLabView(container, currentLang);
    });
  }

  // Strategy Select
  const selStrat = container.querySelector('#select-strategy-template');
  if (selStrat) {
    selStrat.addEventListener('change', (e) => {
      activeStrategyKey = e.target.value;
      renderDerivativesLabView(container, currentLang);
    });
  }
}
