/**
 * Axiom QuantFinance - Numerical Solvers Core
 * Newton-Raphson & Brent's Root-Finding Algorithms
 * @author أ. طارق ابوعشي
 */

/**
 * Newton-Raphson Root-Finding Algorithm
 * @param {Function} f - Objective function f(x)
 * @param {Function} fPrime - Derivative f'(x)
 * @param {number} x0 - Initial guess
 * @param {number} tol - Tolerance for convergence (default: 1e-7)
 * @param {number} maxIter - Maximum iterations (default: 100)
 */
export function newtonRaphson(f, fPrime, x0, tol = 1e-7, maxIter = 100) {
  let x = x0;
  for (let i = 0; i < maxIter; i++) {
    const y = f(x);
    if (Math.abs(y) < tol) return { root: x, iterations: i, converged: true };
    const dy = fPrime(x);
    if (Math.abs(dy) < 1e-12) break; // Derivative too small, abort
    const nextX = x - y / dy;
    if (Math.abs(nextX - x) < tol) return { root: nextX, iterations: i + 1, converged: true };
    x = nextX;
  }
  return { root: x, iterations: maxIter, converged: false };
}

/**
 * Brent's Method for Guaranteed Root Finding in a Bracket [a, b]
 */
export function brentRoot(f, a, b, tol = 1e-7, maxIter = 100) {
  let fa = f(a);
  let fb = f(b);

  if (Math.abs(fa) < tol) return { root: a, iterations: 0, converged: true };
  if (Math.abs(fb) < tol) return { root: b, iterations: 0, converged: true };
  if (fa * fb > 0) {
    // If endpoints do not bracket root, fall back to bisection attempt
    return { root: (a + b) / 2, iterations: 0, converged: false, error: "Root not bracketed" };
  }

  let c = a, fc = fa;
  let d = b - a, e = d;

  for (let iter = 0; iter < maxIter; iter++) {
    if (Math.abs(fc) < Math.abs(fb)) {
      a = b; b = c; c = a;
      fa = fb; fb = fc; fc = fa;
    }

    const tolAct = 2 * 1e-15 * Math.abs(b) + 0.5 * tol;
    const newStep = 0.5 * (c - b);

    if (Math.abs(newStep) <= tolAct || Math.abs(fb) <= tol) {
      return { root: b, iterations: iter, converged: true };
    }

    if (Math.abs(e) >= tolAct && Math.abs(fa) > Math.abs(fb)) {
      let p, q, r;
      const s = fb / fa;
      if (a === c) {
        // Linear interpolation
        p = 2 * newStep * s;
        q = 1 - s;
      } else {
        // Inverse quadratic interpolation
        q = fa / fc;
        r = fb / fc;
        p = s * (2 * newStep * q * (q - r) - (b - a) * (r - 1));
        q = (q - 1) * (r - 1) * (s - 1);
      }
      if (p > 0) q = -q;
      p = Math.abs(p);

      if (2 * p < Math.min(3 * newStep * q - Math.abs(tolAct * q), Math.abs(e * q))) {
        e = d;
        d = p / q;
      } else {
        d = newStep;
        e = d;
      }
    } else {
      d = newStep;
      e = d;
    }

    a = b;
    fa = fb;
    b += (Math.abs(d) > tolAct) ? d : (newStep > 0 ? tolAct : -tolAct);
    fb = f(b);
  }

  return { root: b, iterations: maxIter, converged: false };
}
