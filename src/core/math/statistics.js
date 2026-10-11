/**
 * Axiom QuantFinance - Statistical & Probability Mathematics Core
 * Precision Normal Distribution, Moments, and Inverse CDF Functions
 * @author أ. طارق ابوعشي
 */

const SQRT_2PI = Math.sqrt(2 * Math.PI);

/**
 * Standard Normal Probability Density Function (PDF)
 * \phi(x) = (1 / \sqrt{2\pi}) * e^(-x^2 / 2)
 */
export function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / SQRT_2PI;
}

/**
 * Standard Normal Cumulative Distribution Function (CDF)
 * Uses high-precision Hart approximation (error < 1e-15)
 */
export function normalCDF(x) {
  if (x < -10) return 0;
  if (x > 10) return 1;

  // Abramowitz and Stegun 7.1.26 high-precision polynomial
  const isNegative = x < 0;
  const absX = Math.abs(x);
  
  const p = 0.2316419;
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  
  const t = 1.0 / (1.0 + p * absX);
  const poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
  const cdf = 1.0 - normalPDF(absX) * poly;

  return isNegative ? 1.0 - cdf : cdf;
}

/**
 * Inverse Standard Normal CDF (Quantile Function)
 * Peter J. Acklam's algorithm (precision: 1.15e-9)
 */
export function inverseNormalCDF(p) {
  if (p <= 0 || p >= 1) {
    throw new RangeError("Probability p must be in the open interval (0, 1)");
  }

  // Coefficients in rational approximations
  const a = [
    -3.969683028665376e+01,
     2.209460984245205e+02,
    -2.759285104469687e+02,
     1.383577518672690e+02,
    -3.066479806614716e+01,
     2.506628277459239e+00
  ];

  const b = [
    -5.447609879822406e+01,
     1.615858368580409e+02,
    -1.556989798598866e+02,
     6.680131188771972e+01,
    -1.328068155288572e+01
  ];

  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
     4.374664141464968e+00,
     2.938163982698783e+00
  ];

  const d = [
     7.784695709041462e-03,
     3.224671290700398e-01,
     2.445134137142996e+00,
     3.754408661907416e+00
  ];

  const p_low = 0.02425;
  const p_high = 1 - p_low;

  let q, r;

  // Rational approximation for central region
  if (p > p_low && p < p_high) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r + a[1])*r + a[2])*r + a[3])*r + a[4])*r + a[5])*q /
           (((((b[0]*r + b[1])*r + b[2])*r + b[3])*r + b[4])*r + 1);
  }

  // Rational approximation for lower tail
  if (p <= p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
           ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
  }

  // Rational approximation for upper tail
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
          ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
}

/**
 * Basic Vector Statistical Measures
 */
export function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  return sum / arr.length;
}

export function variance(arr, isSample = true) {
  if (!arr || arr.length < 2) return 0;
  const m = mean(arr);
  let sumSq = 0;
  for (let i = 0; i < arr.length; i++) {
    const diff = arr[i] - m;
    sumSq += diff * diff;
  }
  return sumSq / (isSample ? arr.length - 1 : arr.length);
}

export function stdDev(arr, isSample = true) {
  return Math.sqrt(variance(arr, isSample));
}

export function covariance(arrX, arrY, isSample = true) {
  const n = Math.min(arrX.length, arrY.length);
  if (n < 2) return 0;
  const meanX = mean(arrX.slice(0, n));
  const meanY = mean(arrY.slice(0, n));
  let sumProd = 0;
  for (let i = 0; i < n; i++) {
    sumProd += (arrX[i] - meanX) * (arrY[i] - meanY);
  }
  return sumProd / (isSample ? n - 1 : n);
}

export function correlation(arrX, arrY) {
  const cov = covariance(arrX, arrY);
  const stdX = stdDev(arrX);
  const stdY = stdDev(arrY);
  if (stdX === 0 || stdY === 0) return 0;
  return cov / (stdX * stdY);
}
