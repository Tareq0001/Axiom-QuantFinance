/**
 * Axiom QuantFinance - Interactive Stock Forecast & Target Bands Canvas Chart
 * Smooth Bezier Price Trajectory, Area Gradient Fill, Target/Stop-Loss Levels, and Interactive Crosshair
 * @author أ. طارق ابوعشي
 */

export function renderStockForecastChart(canvas, asset, recommendation) {
  if (!canvas || !asset || !recommendation) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 720;
  const height = rect.height || 340;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Recent 60 historical bars
  const history = asset.prices.slice(-60);
  const n = history.length;
  if (n < 2) return;

  const currentPrice = recommendation.currentPrice;
  const target12M = recommendation.targetPrice12M;
  const target3M = recommendation.targetPrice3M;
  const stopLoss = recommendation.stopLoss;

  const paddingLeft = 16;
  const paddingRight = 95;
  const paddingTop = 32;
  const paddingBottom = 36;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const historyWidth = plotWidth * 0.76;
  const forecastWidth = plotWidth - historyWidth;

  // Global bounds
  let minP = Math.min(stopLoss * 0.95, ...history.map(p => p.low));
  let maxP = Math.max(target12M * 1.05, ...history.map(p => p.high));
  const pRange = maxP - minP || 1;

  function getY(p) {
    return paddingTop + plotHeight * (1 - (p - minP) / pRange);
  }

  function getXHist(i) {
    return paddingLeft + (i / (n - 1)) * historyWidth;
  }

  function drawChart(hoverIndex = -1) {
    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)';
    const labelColor = isDark ? '#64748B' : '#94A3B8';
    const isBullish = recommendation.recType.key.includes('BUY');
    const priceLineColor = isBullish ? (isDark ? '#10B981' : '#059669') : (isDark ? '#38BDF8' : '#2563EB');
    const targetLineColor = isDark ? '#10B981' : '#059669';
    const stopLineColor = isDark ? '#F43F5E' : '#E11D48';

    // 1. Horizontal Grid Lines & Price Labels
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const steps = 4;
    for (let s = 0; s <= steps; s++) {
      const p = minP + (pRange * s) / steps;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight + 10, y);
      ctx.stroke();

      ctx.fillStyle = labelColor;
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.toFixed(2), width - 12, y);
    }

    // 2. Confidence Forecast Cone
    const xLast = getXHist(n - 1);
    const yLast = getY(currentPrice);
    const xTarget = paddingLeft + plotWidth;
    const yTarget = getY(target12M);
    const yStop = getY(stopLoss);

    const coneGrad = ctx.createLinearGradient(xLast, 0, xTarget, 0);
    coneGrad.addColorStop(0, isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(5, 150, 105, 0.10)');
    coneGrad.addColorStop(1, isDark ? 'rgba(16, 185, 129, 0.02)' : 'rgba(5, 150, 105, 0.01)');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(xLast, yLast);
    ctx.lineTo(xTarget, yTarget);
    ctx.lineTo(xTarget, yStop);
    ctx.closePath();
    ctx.fill();

    // 3. Smooth Area Gradient Fill Under Price Curve
    const areaGrad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + plotHeight);
    if (isBullish) {
      areaGrad.addColorStop(0, isDark ? 'rgba(16, 185, 129, 0.28)' : 'rgba(5, 150, 105, 0.20)');
      areaGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    } else {
      areaGrad.addColorStop(0, isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.18)');
      areaGrad.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
    }

    ctx.beginPath();
    ctx.moveTo(getXHist(0), paddingTop + plotHeight);
    ctx.lineTo(getXHist(0), getY(history[0].close));
    for (let i = 1; i < n; i++) {
      const xc = (getXHist(i - 1) + getXHist(i)) / 2;
      const yc = (getY(history[i - 1].close) + getY(history[i].close)) / 2;
      ctx.quadraticCurveTo(getXHist(i - 1), getY(history[i - 1].close), xc, yc);
    }
    ctx.lineTo(getXHist(n - 1), getY(history[n - 1].close));
    ctx.lineTo(getXHist(n - 1), paddingTop + plotHeight);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // 4. Smooth Historical Price Line (Spline Curve)
    ctx.strokeStyle = priceLineColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(getXHist(0), getY(history[0].close));
    for (let i = 1; i < n; i++) {
      const xc = (getXHist(i - 1) + getXHist(i)) / 2;
      const yc = (getY(history[i - 1].close) + getY(history[i].close)) / 2;
      ctx.quadraticCurveTo(getXHist(i - 1), getY(history[i - 1].close), xc, yc);
    }
    ctx.lineTo(getXHist(n - 1), getY(history[n - 1].close));
    ctx.stroke();

    // 5. Projected Forward Trajectory (Dashed Line to 12M Target)
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = targetLineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xLast, yLast);
    ctx.lineTo(xTarget, yTarget);
    ctx.stroke();
    ctx.restore();

    // 6. Target Price & Stop-Loss Level Guides
    // 12M Target Line
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = targetLineColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, yTarget);
    ctx.lineTo(xTarget, yTarget);
    ctx.stroke();

    // Target Tag Pill
    ctx.fillStyle = targetLineColor;
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(`🎯 ${target12M.toFixed(2)} (${recommendation.expectedReturnPct >= 0 ? '+' : ''}${recommendation.expectedReturnPct}%)`, width - 12, yTarget - 4);
    ctx.restore();

    // Stop Loss Line
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = stopLineColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, yStop);
    ctx.lineTo(xTarget, yStop);
    ctx.stroke();

    // Stop Loss Tag Pill
    ctx.fillStyle = stopLineColor;
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(`⛔ ${stopLoss.toFixed(2)} (وقف)`, width - 12, yStop - 4);
    ctx.restore();

    // 7. Spot Price Glowing Marker
    ctx.save();
    ctx.shadowColor = priceLineColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(xLast, yLast, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = priceLineColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // 8. Time Axis Labels
    ctx.fillStyle = labelColor;
    ctx.font = '9px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('البيانات السابقة (60 يوماً)', paddingLeft + historyWidth * 0.5, height - 10);
    ctx.fillText('توقع 12 شهراً ➔', paddingLeft + historyWidth + forecastWidth * 0.5, height - 10);

    // 9. Interactive Crosshair Hover
    if (hoverIndex >= 0 && hoverIndex < n) {
      const hx = getXHist(hoverIndex);
      const hy = getY(history[hoverIndex].close);
      const bar = history[hoverIndex];

      // Vertical crosshair
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hx, paddingTop);
      ctx.lineTo(hx, paddingTop + plotHeight);
      ctx.stroke();

      // Tooltip Circle
      ctx.fillStyle = priceLineColor;
      ctx.beginPath();
      ctx.arc(hx, hy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Tooltip Card
      const ttText = `${bar.date}: ${bar.close.toFixed(2)} SAR`;
      ctx.font = '11px JetBrains Mono';
      const textWidth = ctx.measureText(ttText).width;
      const boxW = textWidth + 16;
      const boxH = 24;
      const boxX = Math.max(paddingLeft, Math.min(width - boxW - 10, hx - boxW / 2));
      const boxY = Math.max(paddingTop, hy - 32);

      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ttText, boxX + boxW / 2, boxY + boxH / 2);
      ctx.restore();
    }
  }

  // Initial draw
  drawChart();

  // Mouse interactivity
  canvas.onmousemove = (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    if (mx >= paddingLeft && mx <= paddingLeft + historyWidth) {
      const idx = Math.round(((mx - paddingLeft) / historyWidth) * (n - 1));
      drawChart(idx);
    } else {
      drawChart(-1);
    }
  };

  canvas.onmouseleave = () => {
    drawChart(-1);
  };
}
