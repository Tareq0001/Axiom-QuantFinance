/**
 * Axiom QuantFinance - Isometric 3D Wireframe Volatility Surface Canvas
 * 3D Landscape Projection of Volatility Smile, Skew, and Term Structure
 * @author أ. طارق ابوعشي
 */

export function renderVolSurfaceHeatmap(canvas, chainData) {
  if (!canvas || !chainData || !chainData.chainByExpiration) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Clear transparently to integrate into card surface
  ctx.clearRect(0, 0, width, height);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const titleColor = isDark ? '#38BDF8' : '#2563EB';
  const subtitleColor = isDark ? '#A1A1AA' : '#64748B';
  const frontWireColor = isDark ? '#38BDF8' : '#2563EB';
  const wireColor = isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(37, 99, 235, 0.4)';
  const atmWireColor = isDark ? 'rgba(245, 158, 11, 0.85)' : 'rgba(217, 119, 6, 0.85)';
  const crossWireColor = isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(99, 102, 241, 0.3)';
  const peakColor = isDark ? '#F59E0B' : '#D97706';
  const labelColor = isDark ? '#A1A1AA' : '#64748B';

  const expKeys = Object.keys(chainData.chainByExpiration);
  const numRows = expKeys.length;
  const sampleExp = chainData.chainByExpiration[expKeys[0]];
  const contracts = sampleExp.contracts;
  const numCols = contracts.length;

  // Find min and max IV
  let minIV = Infinity, maxIV = -Infinity;
  for (const expKey of expKeys) {
    for (const c of chainData.chainByExpiration[expKey].contracts) {
      if (c.iv < minIV) minIV = c.iv;
      if (c.iv > maxIV) maxIV = c.iv;
    }
  }

  const ivRange = maxIV - minIV || 1;

  // Isometric 3D Projection Parameters - Perfectly Centered & Scaled
  const centerX = width * 0.48;
  const startY = height * 0.56;
  const stepCol = (width * 0.48) / numCols;
  const stepRow = (height * 0.36) / numRows;
  const heightScale = height * 0.42;

  // Calculate 2D Screen Points for each 3D (Row, Col, IV) grid node
  const gridPoints = Array.from({ length: numRows }, () => new Array(numCols));

  for (let r = 0; r < numRows; r++) {
    const expKey = expKeys[r];
    const expContracts = chainData.chainByExpiration[expKey].contracts;

    for (let c = 0; c < numCols; c++) {
      const contract = expContracts[c];
      const normIV = (contract.iv - minIV) / ivRange;

      // Isometric projection formula:
      // X: spread across diagonal
      // Y: tilt downward with depth, rise upward with IV elevation
      const x = centerX + (c - numCols / 2) * stepCol - (r - numRows / 2) * stepRow * 1.3;
      const y = startY + (r - numRows / 2) * stepRow * 0.9 + (c - numCols / 2) * stepRow * 0.35 - normIV * heightScale;

      gridPoints[r][c] = { x, y, normIV, iv: contract.iv, strike: contract.strike };
    }
  }

  // 1. Draw Quads with Translucent Gradient Fills (Back to Front)
  for (let r = 0; r < numRows - 1; r++) {
    for (let c = 0; c < numCols - 1; c++) {
      const p1 = gridPoints[r][c];
      const p2 = gridPoints[r][c + 1];
      const p3 = gridPoints[r + 1][c + 1];
      const p4 = gridPoints[r + 1][c];

      const avgNorm = (p1.normIV + p2.normIV + p3.normIV + p4.normIV) / 4;

      // Color from deep blue (low IV) to amber (high IV)
      let fillColor;
      if (avgNorm < 0.5) {
        fillColor = isDark 
          ? `rgba(14, 116, 144, ${0.15 + avgNorm * 0.35})`
          : `rgba(37, 99, 235, ${0.08 + avgNorm * 0.22})`;
      } else {
        fillColor = isDark
          ? `rgba(245, 158, 11, ${0.20 + (avgNorm - 0.5) * 0.4})`
          : `rgba(217, 119, 6, ${0.12 + (avgNorm - 0.5) * 0.32})`;
      }

      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 2. Draw Wireframe Ribbons (Strike lines across expirations)
  ctx.lineWidth = 1.2;
  for (let r = 0; r < numRows; r++) {
    ctx.beginPath();
    for (let c = 0; c < numCols; c++) {
      const pt = gridPoints[r][c];
      if (c === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.strokeStyle = r === 0 ? frontWireColor : wireColor;
    ctx.stroke();

    // Row Expiration Label on right edge
    const edgePt = gridPoints[r][numCols - 1];
    ctx.fillStyle = labelColor;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText(`${expKeys[r].split(' ')[0]}`, edgePt.x + 8, edgePt.y + 3);
  }

  // Draw Cross Ribbons (Expiration lines across strikes)
  for (let c = 0; c < numCols; c++) {
    ctx.beginPath();
    for (let r = 0; r < numRows; r++) {
      const pt = gridPoints[r][c];
      if (r === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    const isATM = Math.abs(c - Math.floor(numCols / 2)) <= 1;
    ctx.strokeStyle = isATM ? atmWireColor : crossWireColor;
    ctx.lineWidth = isATM ? 1.6 : 1.0;
    ctx.stroke();

    // Strike label at front row (r = numRows - 1)
    if (c % 2 === 0) {
      const frontPt = gridPoints[numRows - 1][c];
      ctx.fillStyle = labelColor;
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`K:${contracts[c].strike}`, frontPt.x, frontPt.y + 14);
    }
  }

  // 3. Highlight Top Peak Nodes
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const pt = gridPoints[r][c];
      if (pt.normIV > 0.75) {
        ctx.fillStyle = peakColor;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  // Overlay HUD Legend
  ctx.font = 'bold 11px JetBrains Mono';
  ctx.textAlign = 'left';
  ctx.fillStyle = titleColor;
  ctx.fillText("▲ Isometric 3D Volatility Landscape", 20, 25);
  ctx.font = '10px JetBrains Mono';
  ctx.fillStyle = subtitleColor;
  ctx.fillText("X: Strike (K)  |  Y: Term (DTE)  |  Z: Implied Volatility (σ)", 20, 42);
}
