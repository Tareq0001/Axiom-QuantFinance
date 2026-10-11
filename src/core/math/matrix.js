/**
 * Axiom QuantFinance - Matrix & Linear Algebra Operations
 * Covariance, Inversion, and Quadratic Optimization Tools for Markowitz
 * @author أ. طارق ابوعشي
 */

/**
 * Compute Sample Covariance Matrix for multi-asset return series
 * @param {Array<Array<number>>} returnsMatrix - Array of return vectors [asset0Returns, asset1Returns, ...]
 */
export function computeCovarianceMatrix(returnsMatrix) {
  const numAssets = returnsMatrix.length;
  const matrix = Array.from({ length: numAssets }, () => new Float64Array(numAssets));

  for (let i = 0; i < numAssets; i++) {
    for (let j = i; j < numAssets; j++) {
      let cov;
      if (i === j) {
        cov = computeVectorVariance(returnsMatrix[i]);
      } else {
        cov = computeVectorCovariance(returnsMatrix[i], returnsMatrix[j]);
      }
      matrix[i][j] = cov;
      matrix[j][i] = cov; // Symmetric
    }
  }
  return matrix;
}

function computeVectorVariance(arr) {
  const n = arr.length;
  if (n < 2) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += arr[i];
  const m = sum / n;
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const diff = arr[i] - m;
    sumSq += diff * diff;
  }
  return sumSq / (n - 1);
}

function computeVectorCovariance(arrX, arrY) {
  const n = Math.min(arrX.length, arrY.length);
  if (n < 2) return 0;
  let sumX = 0, sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += arrX[i];
    sumY += arrY[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let sumProd = 0;
  for (let i = 0; i < n; i++) {
    sumProd += (arrX[i] - meanX) * (arrY[i] - meanY);
  }
  return sumProd / (n - 1);
}

/**
 * Matrix Inversion using Gauss-Jordan with Partial Pivoting
 */
export function invertMatrix(A) {
  const n = A.length;
  // Clone A and construct identity augmented matrix
  const M = A.map(row => Array.from(row));
  const I = Array.from({ length: n }, (_, i) => {
    const row = new Float64Array(n);
    row[i] = 1;
    return row;
  });

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxEl = Math.abs(M[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxEl) {
        maxEl = Math.abs(M[k][i]);
        maxRow = k;
      }
    }

    if (maxEl < 1e-12) {
      throw new Error("Matrix is singular or ill-conditioned, cannot invert.");
    }

    // Swap rows in M and I
    const tmpM = M[i]; M[i] = M[maxRow]; M[maxRow] = tmpM;
    const tmpI = I[i]; I[i] = I[maxRow]; I[maxRow] = tmpI;

    // Normalize pivot row
    const pivot = M[i][i];
    for (let j = 0; j < n; j++) {
      M[i][j] /= pivot;
      I[i][j] /= pivot;
    }

    // Eliminate column in other rows
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = M[k][i];
      for (let j = 0; j < n; j++) {
        M[k][j] -= factor * M[i][j];
        I[k][j] -= factor * I[i][j];
      }
    }
  }

  return I;
}

/**
 * Matrix-Vector Multiplication: y = A * x
 */
export function matrixVectorMultiply(A, x) {
  const n = A.length;
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    y[i] = sum;
  }
  return y;
}

/**
 * Dot Product of two vectors: u . v
 */
export function dotProduct(u, v) {
  let sum = 0;
  for (let i = 0; i < u.length; i++) {
    sum += u[i] * v[i];
  }
  return sum;
}

/**
 * Quadratic Form: w^T * Sigma * w (Portfolio Variance)
 */
export function portfolioVariance(weights, covMatrix) {
  const sigmaW = matrixVectorMultiply(covMatrix, weights);
  return dotProduct(weights, sigmaW);
}
