/**
 * Axiom QuantFinance - Interactive Greeks Radar Canvas Chart
 * 5-Axis Spider/Radar Risk Sensitivity Visualizer for Derivatives
 * @author أ. طارق ابوعشي
 */

export function renderGreeksRadarChart(canvas, greeks) {
  if (!canvas || !greeks) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 280;
  const height = rect.height || 260;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Clear
  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2 + 10;
  const maxRadius = Math.min(centerX, centerY) * 0.65;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const ringAlphaBase = isDark ? 0.05 : 0.06;
  const ringAlphaStep = isDark ? 0.02 : 0.025;
  const ringColor = isDark ? '255, 255, 255' : '15, 23, 42';
  const spokeColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)';
  const rawValColor = isDark ? '#A1A1AA' : '#64748B';

  // 5 axes: Delta, Gamma, Vega, Theta, Rho normalized to [0, 1]
  const axes = [
    { label: "Delta Δ", val: Math.min(1, Math.max(0.1, Math.abs(greeks.delta))), raw: greeks.delta.toFixed(2), color: isDark ? '#38BDF8' : '#2563EB' },
    { label: "Gamma Γ", val: Math.min(1, Math.max(0.1, greeks.gamma * 25)), raw: greeks.gamma.toFixed(3), color: isDark ? '#C084FC' : '#7C3AED' },
    { label: "Vega ν", val: Math.min(1, Math.max(0.1, greeks.vega * 1.5)), raw: greeks.vega.toFixed(2), color: isDark ? '#F59E0B' : '#D97706' },
    { label: "Theta Θ", val: Math.min(1, Math.max(0.1, Math.abs(greeks.theta) * 2.5)), raw: greeks.theta.toFixed(2), color: isDark ? '#F87171' : '#DC2626' },
    { label: "Rho ρ", val: Math.min(1, Math.max(0.1, Math.abs(greeks.rho) * 1.8)), raw: greeks.rho.toFixed(2), color: isDark ? '#60A5FA' : '#0284C7' }
  ];

  const totalAxes = axes.length;

  // 1. Draw Concentric Pentagonal Web Rings
  const numRings = 4;
  for (let r = 1; r <= numRings; r++) {
    const rad = (maxRadius * r) / numRings;
    ctx.strokeStyle = `rgba(${ringColor}, ${ringAlphaBase + r * ringAlphaStep})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < totalAxes; i++) {
      const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
      const x = centerX + Math.cos(angle) * rad;
      const y = centerY + Math.sin(angle) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 2. Draw Spokes / Axes lines
  for (let i = 0; i < totalAxes; i++) {
    const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
    const x = centerX + Math.cos(angle) * maxRadius;
    const y = centerY + Math.sin(angle) * maxRadius;

    ctx.strokeStyle = spokeColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Axis Labels with Raw Value
    const labelRad = maxRadius + 22;
    const lx = centerX + Math.cos(angle) * labelRad;
    const ly = centerY + Math.sin(angle) * labelRad;

    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = axes[i].color;
    ctx.fillText(`${axes[i].label}`, lx, ly - 6);
    ctx.fillStyle = rawValColor;
    ctx.font = '9px JetBrains Mono';
    ctx.fillText(`(${axes[i].raw})`, lx, ly + 6);
  }

  // 3. Draw Risk Sensitivity Polygon
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < totalAxes; i++) {
    const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
    const rad = maxRadius * axes[i].val;
    const x = centerX + Math.cos(angle) * rad;
    const y = centerY + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Gradient Fill
  const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
  if (isDark) {
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.40)');
    grad.addColorStop(0.7, 'rgba(192, 132, 252, 0.20)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
  } else {
    grad.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
    grad.addColorStop(0.7, 'rgba(124, 58, 237, 0.12)');
    grad.addColorStop(1, 'rgba(37, 99, 235, 0.03)');
  }
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = isDark ? '#38BDF8' : '#2563EB';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 4. Nodes on vertices
  for (let i = 0; i < totalAxes; i++) {
    const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
    const rad = maxRadius * axes[i].val;
    const x = centerX + Math.cos(angle) * rad;
    const y = centerY + Math.sin(angle) * rad;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = axes[i].color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.stroke();
  }
}
