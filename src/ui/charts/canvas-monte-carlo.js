/**
 * Axiom QuantFinance - Monte Carlo Simulation & VaR Distribution Chart
 * Price Paths Fan, Percentile Envelopes & Terminal Frequency Histogram
 * @author أ. طارق ابوعشي
 */

export function renderMonteCarloChart(canvas, mcData) {
  if (!canvas || !mcData || !mcData.previewPaths) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  // Divide canvas: 70% left for Paths, 30% right for Terminal Histogram
  const pathsWidth = Math.floor(width * 0.70);
  const histWidth = width - pathsWidth;

  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 35;

  // Clear canvas transparently
  ctx.clearRect(0, 0, width, height);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.07)';
  const labelColor = isDark ? '#A1A1AA' : '#64748B';
  const dividerColor = isDark ? '#27272A' : '#CBD5E1';
  const pathsColor = isDark ? 'rgba(129, 140, 248, 0.16)' : 'rgba(99, 102, 241, 0.15)';
  const var5Color = isDark ? '#EF4444' : '#DC2626';
  const medianColor = isDark ? '#38BDF8' : '#2563EB';
  const upside95Color = isDark ? '#10B981' : '#059669';
  const normalHistFill = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(37, 99, 235, 0.25)';
  const varHistFill = isDark ? 'rgba(239, 68, 68, 0.45)' : 'rgba(220, 38, 38, 0.35)';

  const days = mcData.days;
  const paths = mcData.previewPaths;
  const percentiles = mcData.percentiles;

  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (const path of paths) {
    for (let t = 0; t <= days; t++) {
      if (path[t] < minPrice) minPrice = path[t];
      if (path[t] > maxPrice) maxPrice = path[t];
    }
  }

  const pRange = maxPrice - minPrice || 1;
  const plotWidth = pathsWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  function getX(t) {
    return paddingLeft + (t / days) * plotWidth;
  }
  function getY(p) {
    return paddingTop + plotHeight * (1 - (p - minPrice) / pRange);
  }

  // 1. Grid lines on left plot
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const val = minPrice + (pRange * i) / steps;
    const y = getY(val);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(pathsWidth - paddingRight, y);
    ctx.stroke();

    ctx.fillStyle = labelColor;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1), paddingLeft - 6, y + 3);
  }

  // 2. Draw Simulated Paths (Translucent Lines)
  ctx.lineWidth = 1;
  for (const path of paths) {
    ctx.strokeStyle = pathsColor;
    ctx.beginPath();
    for (let t = 0; t <= days; t++) {
      const x = getX(t);
      const y = getY(path[t]);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 3. Draw Percentile Envelopes
  // 5th Percentile (Downside Risk - Red)
  ctx.strokeStyle = var5Color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let t = 0; t <= days; t++) {
    const x = getX(t);
    const y = getY(percentiles.p5[t]);
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 50th Percentile (Median - Sapphire/Cyan)
  ctx.strokeStyle = medianColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let t = 0; t <= days; t++) {
    const x = getX(t);
    const y = getY(percentiles.p50[t]);
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 95th Percentile (Upside - Emerald)
  ctx.strokeStyle = upside95Color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let t = 0; t <= days; t++) {
    const x = getX(t);
    const y = getY(percentiles.p95[t]);
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Divider between paths and histogram
  ctx.strokeStyle = dividerColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pathsWidth, paddingTop);
  ctx.lineTo(pathsWidth, height - paddingBottom);
  ctx.stroke();

  // 4. Draw Terminal Distribution Histogram
  const hist = mcData.histogram || [];
  let maxCount = 0;
  for (const b of hist) {
    if (b.count > maxCount) maxCount = b.count;
  }

  const histPlotWidth = histWidth - 30;
  for (const b of hist) {
    const yTop = getY(b.binEnd);
    const yBot = getY(b.binStart);
    const barH = Math.max(1.5, Math.abs(yBot - yTop) - 1);
    const barW = maxCount > 0 ? (b.count / maxCount) * histPlotWidth : 0;

    const isBelowVaR = b.binStart < percentiles.p5[days];
    ctx.fillStyle = isBelowVaR ? varHistFill : normalHistFill;
    ctx.fillRect(pathsWidth + 10, yTop, barW, barH);
  }

  // Legend at top
  ctx.font = '10px JetBrains Mono';
  ctx.textAlign = 'left';

  ctx.fillStyle = var5Color;
  ctx.fillText("━ 5% VaR Boundary", paddingLeft + 10, paddingTop - 8);

  ctx.fillStyle = medianColor;
  ctx.fillText("━ Median Path", paddingLeft + 140, paddingTop - 8);

  ctx.fillStyle = upside95Color;
  ctx.fillText("━ 95% Upside", paddingLeft + 250, paddingTop - 8);

  ctx.fillStyle = labelColor;
  ctx.fillText("Terminal Frequency", pathsWidth + 10, paddingTop - 8);
}
