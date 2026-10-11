/**
 * Axiom QuantFinance - Options Payoff Visualizer Canvas Chart
 * Expiry Profile, Theoretical T+0 Value, Breakeven Crossings & Profit/Loss Shading
 * @author أ. طارق ابوعشي
 */

export function renderPayoffChart(canvas, payoffData, spotPrice) {
  if (!canvas || !payoffData || !payoffData.pricePoints) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Background - clear transparently to inherit card surface
  ctx.clearRect(0, 0, width, height);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.07)';
  const labelColor = isDark ? '#A1A1AA' : '#64748B';
  const zeroLineColor = isDark ? '#71717A' : '#94A3B8';
  const profitZoneFill = isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(5, 150, 105, 0.06)';
  const lossZoneFill = isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(220, 38, 38, 0.06)';
  const expiryLineColor = isDark ? '#38BDF8' : '#2563EB';
  const currentLineColor = isDark ? '#C084FC' : '#7C3AED';
  const spotColor = isDark ? '#F59E0B' : '#D97706';
  const beColor = isDark ? '#10B981' : '#059669';

  const prices = payoffData.pricePoints;
  const expiryPnl = payoffData.expiryPayoffs;
  const currentPnl = payoffData.currentPayoffs;

  const minX = prices[0];
  const maxX = prices[prices.length - 1];

  let minY = Math.min(...expiryPnl, ...currentPnl);
  let maxY = Math.max(...expiryPnl, ...currentPnl);

  // Symmetrize or ensure 0 is visible with comfortable margin
  minY = Math.min(minY, -50);
  maxY = Math.max(maxY, 50);
  const yPadding = (maxY - minY) * 0.15;
  minY -= yPadding;
  maxY += yPadding;
  const yRange = maxY - minY || 1;

  function getX(p) {
    return paddingLeft + ((p - minX) / (maxX - minX)) * plotWidth;
  }
  function getY(v) {
    return paddingTop + plotHeight * (1 - (v - minY) / yRange);
  }

  const zeroY = getY(0);

  // 1. Shaded Profit and Loss Zones
  ctx.save();
  ctx.beginPath();
  ctx.rect(paddingLeft, paddingTop, plotWidth, Math.max(0, zeroY - paddingTop));
  ctx.clip();
  ctx.fillStyle = profitZoneFill; // Subtle profit zone
  ctx.fillRect(paddingLeft, paddingTop, plotWidth, plotHeight);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(paddingLeft, zeroY, plotWidth, Math.max(0, height - paddingBottom - zeroY));
  ctx.clip();
  ctx.fillStyle = lossZoneFill; // Subtle loss zone
  ctx.fillRect(paddingLeft, paddingTop, plotWidth, plotHeight);
  ctx.restore();

  // 2. Grid Lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  const ySteps = 6;
  for (let i = 0; i <= ySteps; i++) {
    const val = minY + (yRange * i) / ySteps;
    const y = getY(val);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    ctx.fillStyle = labelColor;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(`${val >= 0 ? '+' : ''}${Math.round(val)}$`, paddingLeft - 8, y + 3);
  }

  // 3. Zero PnL Baseline
  ctx.strokeStyle = zeroLineColor;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(paddingLeft, zeroY);
  ctx.lineTo(width - paddingRight, zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Current Underlying Spot Price Marker (Dotted line)
  if (spotPrice >= minX && spotPrice <= maxX) {
    const spotX = getX(spotPrice);
    ctx.strokeStyle = spotColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(spotX, paddingTop);
    ctx.lineTo(spotX, height - paddingBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = spotColor;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`Spot: ${spotPrice.toFixed(2)}`, spotX, paddingTop - 8);
  }

  // 5. Draw Expiration Payoff Profile (Solid Line)
  ctx.strokeStyle = expiryLineColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < prices.length; i++) {
    const x = getX(prices[i]);
    const y = getY(expiryPnl[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 6. Draw Theoretical Current Value T+0 (Dashed Line)
  if (currentPnl && currentPnl.length > 0) {
    ctx.strokeStyle = currentLineColor;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    for (let i = 0; i < prices.length; i++) {
      const x = getX(prices[i]);
      const y = getY(currentPnl[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 7. Mark Breakeven Points
  if (payoffData.breakevens) {
    for (const be of payoffData.breakevens) {
      if (be >= minX && be <= maxX) {
        const beX = getX(be);
        ctx.fillStyle = beColor;
        ctx.beginPath();
        ctx.arc(beX, zeroY, 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = beColor;
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`BE: ${be}`, beX, zeroY + 16);
      }
    }
  }

  // Legend at top right
  ctx.font = '11px JetBrains Mono';
  ctx.textAlign = 'right';

  ctx.fillStyle = expiryLineColor;
  ctx.fillText("● Payoff at Expiry", width - paddingRight, paddingTop - 12);

  ctx.fillStyle = currentLineColor;
  ctx.fillText("-- Current T+0 Theoretical", width - paddingRight - 140, paddingTop - 12);
}
