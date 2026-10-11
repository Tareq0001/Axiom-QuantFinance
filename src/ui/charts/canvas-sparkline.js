/**
 * Axiom QuantFinance - Micro Sparkline Canvas Renderer
 * High-performance mini area trend chart for ticker tape and summary cards
 * @author أ. طارق ابوعشي
 */

export function renderSparkline(canvas, prices, isPositive) {
  if (!canvas || !prices || prices.length < 2) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 60;
  const h = rect.height || 22;

  canvas.width = w * dpr;
  canvas.height = h * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Sample down to recent 15 bars for clean sparkline
  const data = prices.slice(-15);
  const n = data.length;

  let minP = Infinity, maxP = -Infinity;
  for (let i = 0; i < n; i++) {
    const val = typeof data[i] === 'object' ? data[i].close : data[i];
    if (val < minP) minP = val;
    if (val > maxP) maxP = val;
  }

  const pRange = maxP - minP || 1;
  const padTop = 3;
  const padBot = 3;
  const plotH = h - padTop - padBot;

  function getX(i) {
    return (i / (n - 1)) * (w - 6) + 3;
  }
  function getY(i) {
    const val = typeof data[i] === 'object' ? data[i].close : data[i];
    return padTop + plotH * (1 - (val - minP) / pRange);
  }

  const strokeColor = isPositive ? '#10B981' : '#F43F5E';
  const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
  fillGrad.addColorStop(0, isPositive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)');
  fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  // Draw Area Fill
  ctx.beginPath();
  ctx.moveTo(getX(0), h);
  for (let i = 0; i < n; i++) {
    ctx.lineTo(getX(i), getY(i));
  }
  ctx.lineTo(getX(n - 1), h);
  ctx.closePath();
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // Draw Stroke Line
  ctx.beginPath();
  ctx.moveTo(getX(0), getY(0));
  for (let i = 1; i < n; i++) {
    ctx.lineTo(getX(i), getY(i));
  }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Glowing End Dot
  const endX = getX(n - 1);
  const endY = getY(n - 1);
  ctx.fillStyle = strokeColor;
  ctx.beginPath();
  ctx.arc(endX, endY, 2.5, 0, 2 * Math.PI);
  ctx.fill();
}
