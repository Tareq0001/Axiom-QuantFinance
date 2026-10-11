/**
 * Axiom QuantFinance - Modern Portfolio Theory Efficient Frontier Canvas Chart
 * Analytical Curve, Random Portfolios Cloud, Tangency & GMV Portfolio Markers
 * @author أ. طارق ابوعشي
 */

export function renderEfficientFrontierChart(canvas, mptData, currentPortfolio = null) {
  if (!canvas || !mptData || !mptData.efficientFrontier) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  const paddingLeft = 55;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Clear canvas transparently
  ctx.clearRect(0, 0, width, height);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.07)';
  const labelColor = isDark ? '#A1A1AA' : '#64748B';
  const axisTitleColor = isDark ? '#D4D4D8' : '#334155';
  const scatterColor = isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(99, 102, 241, 0.28)';
  const frontierCurveColor = isDark ? '#38BDF8' : '#2563EB';
  const gmvColor = isDark ? '#F59E0B' : '#D97706';
  const maxSharpeColor = isDark ? '#10B981' : '#059669';
  const customColor = isDark ? '#F43F5E' : '#E11D48';

  // Determine domain (Volatility X, Return Y)
  const frontier = mptData.efficientFrontier;
  const randoms = mptData.randomPortfolios || [];

  let minVol = Infinity, maxVol = -Infinity;
  let minRet = Infinity, maxRet = -Infinity;

  for (const pt of frontier) {
    if (pt.volatility < minVol) minVol = pt.volatility;
    if (pt.volatility > maxVol) maxVol = pt.volatility;
    if (pt.expectedReturn < minRet) minRet = pt.expectedReturn;
    if (pt.expectedReturn > maxRet) maxRet = pt.expectedReturn;
  }

  for (const p of randoms) {
    if (p.volatility < minVol) minVol = p.volatility;
    if (p.volatility > maxVol) maxVol = p.volatility;
    if (p.expectedReturn < minRet) minRet = p.expectedReturn;
    if (p.expectedReturn > maxRet) maxRet = p.expectedReturn;
  }

  minVol = Math.max(0, minVol * 0.85);
  maxVol = maxVol * 1.15;
  minRet = Math.min(0, minRet * 0.85);
  maxRet = maxRet * 1.15;

  const volRange = maxVol - minVol || 1;
  const retRange = maxRet - minRet || 1;

  function getX(v) {
    return paddingLeft + ((v - minVol) / volRange) * plotWidth;
  }
  function getY(r) {
    return paddingTop + plotHeight * (1 - (r - minRet) / retRange);
  }

  // 1. Grid & Ticks
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  const steps = 5;

  for (let i = 0; i <= steps; i++) {
    // Y Grid (Return)
    const retVal = minRet + (retRange * i) / steps;
    const y = getY(retVal);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    ctx.fillStyle = labelColor;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(`${(retVal * 100).toFixed(1)}%`, paddingLeft - 8, y + 3);

    // X Grid (Volatility)
    const volVal = minVol + (volRange * i) / steps;
    const x = getX(volVal);
    ctx.beginPath();
    ctx.moveTo(x, paddingTop);
    ctx.lineTo(x, height - paddingBottom);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillText(`${(volVal * 100).toFixed(1)}%`, x, height - paddingBottom + 16);
  }

  // Axis Labels
  ctx.fillStyle = axisTitleColor;
  ctx.font = '11px JetBrains Mono';
  ctx.textAlign = 'center';
  ctx.fillText("Volatility σ (Annualized Risk)", paddingLeft + plotWidth / 2, height - 10);

  // 2. Draw Random Portfolio Scatter Cloud
  for (const p of randoms) {
    const x = getX(p.volatility);
    const y = getY(p.expectedReturn);
    ctx.fillStyle = scatterColor;
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // 3. Draw Analytical Efficient Frontier Curve
  ctx.strokeStyle = frontierCurveColor;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  for (let i = 0; i < frontier.length; i++) {
    const pt = frontier[i];
    const x = getX(pt.volatility);
    const y = getY(pt.expectedReturn);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 4. Mark Global Minimum Variance (GMV) Portfolio
  if (mptData.gmvPortfolio) {
    const gmv = mptData.gmvPortfolio;
    const x = getX(gmv.volatility);
    const y = getY(gmv.expectedReturn);

    ctx.fillStyle = gmvColor;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = gmvColor;
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText("GMV (Min Vol)", x + 9, y - 4);
  }

  // 5. Mark Tangency Portfolio (Maximum Sharpe Ratio)
  if (mptData.tangencyPortfolio) {
    const tan = mptData.tangencyPortfolio;
    const x = getX(tan.volatility);
    const y = getY(tan.expectedReturn);

    ctx.fillStyle = maxSharpeColor;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, 2 * Math.PI);
    ctx.fill();

    // Center dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = maxSharpeColor;
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText(`Max Sharpe (${tan.sharpe.toFixed(2)})`, x + 10, y + 4);
  }

  // 6. Mark User's Current Custom Allocation if provided
  if (currentPortfolio) {
    const x = getX(currentPortfolio.volatility);
    const y = getY(currentPortfolio.expectedReturn);

    ctx.fillStyle = customColor;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = customColor;
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText("Current Allocation", x + 8, y + 12);
  }
}
