/**
 * Axiom QuantFinance - High-DPI Interactive Candlestick & Volume Canvas Chart
 * Price Action, SMA/EMA Overlay, Volume Histogram & Crosshair Tooltip
 * @author أ. طارق ابوعشي
 */

export function renderCandlestickChart(canvas, priceSeries, indicators = {}) {
  if (!canvas || !priceSeries || priceSeries.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  // Layout bounds
  const paddingLeft = 10;
  const paddingRight = 60;
  const paddingTop = 20;
  const volumeHeight = 60;
  const paddingBottom = 30;
  const pricePlotHeight = height - paddingTop - volumeHeight - paddingBottom;

  // Clear background transparently to inherit porcelain/titanium card background
  ctx.clearRect(0, 0, width, height);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.07)';
  const labelColor = isDark ? '#A1A1AA' : '#64748B';
  const upColor = isDark ? '#10B981' : '#059669';
  const downColor = isDark ? '#EF4444' : '#DC2626';
  const upVolFill = isDark ? 'rgba(16, 185, 129, 0.22)' : 'rgba(5, 150, 105, 0.18)';
  const downVolFill = isDark ? 'rgba(239, 68, 68, 0.22)' : 'rgba(220, 38, 38, 0.18)';
  const smaColor = isDark ? '#38BDF8' : '#2563EB';

  // Range of data
  const data = priceSeries.slice(-60); // Show recent 60 bars
  const n = data.length;
  if (n === 0) return;

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let maxVol = 0;

  for (const bar of data) {
    if (bar.low < minPrice) minPrice = bar.low;
    if (bar.high > maxPrice) maxPrice = bar.high;
    if (bar.volume > maxVol) maxVol = bar.volume;
  }

  const pricePadding = (maxPrice - minPrice) * 0.05;
  minPrice -= pricePadding;
  maxPrice += pricePadding;
  const priceRange = maxPrice - minPrice || 1;

  const plotWidth = width - paddingLeft - paddingRight;
  const candleSpacing = plotWidth / n;
  const candleWidth = Math.max(2, candleSpacing * 0.7);

  // Helper coordinate conversions
  function getY(p) {
    return paddingTop + pricePlotHeight * (1 - (p - minPrice) / priceRange);
  }
  function getX(i) {
    return paddingLeft + i * candleSpacing + candleSpacing / 2;
  }

  // Draw Horizontal Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  const gridSteps = 5;
  for (let g = 0; g <= gridSteps; g++) {
    const p = minPrice + (priceRange * g) / gridSteps;
    const y = getY(p);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    // Price Labels
    ctx.fillStyle = labelColor;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText(p.toFixed(2), width - paddingRight + 8, y + 3);
  }

  // Draw Volume Bars
  const volBaseY = height - paddingBottom;
  for (let i = 0; i < n; i++) {
    const bar = data[i];
    const isUp = bar.close >= bar.open;
    const volHeight = (bar.volume / maxVol) * volumeHeight;
    const x = getX(i);

    ctx.fillStyle = isUp ? upVolFill : downVolFill;
    ctx.fillRect(x - candleWidth / 2, volBaseY - volHeight, candleWidth, volHeight);
  }

  // Draw Candlesticks
  for (let i = 0; i < n; i++) {
    const bar = data[i];
    const isUp = bar.close >= bar.open;
    const x = getX(i);
    const yOpen = getY(bar.open);
    const yClose = getY(bar.close);
    const yHigh = getY(bar.high);
    const yLow = getY(bar.low);

    const candleColor = isUp ? upColor : downColor;
    ctx.strokeStyle = candleColor;
    ctx.fillStyle = candleColor;
    ctx.lineWidth = 1.2;

    // Wick
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.stroke();

    // Body
    const bodyTop = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
    ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
  }

  // Draw SMA Line if provided
  if (indicators.sma && indicators.sma.length >= n) {
    const smaData = indicators.sma.slice(-n);
    ctx.strokeStyle = smaColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < n; i++) {
      if (smaData[i] !== null) {
        const x = getX(i);
        const y = getY(smaData[i]);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else { ctx.lineTo(x, y); }
      }
    }
    ctx.stroke();
  }

  // Date labels at bottom
  ctx.fillStyle = labelColor;
  ctx.font = '9px JetBrains Mono';
  ctx.textAlign = 'center';
  const labelStep = Math.ceil(n / 6);
  for (let i = 0; i < n; i += labelStep) {
    const x = getX(i);
    ctx.fillText(data[i].date.substring(5), x, height - 10);
  }
}
