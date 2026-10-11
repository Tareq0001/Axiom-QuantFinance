/**
 * Axiom QuantFinance - Pseudo-Random & Quasi-Random Distributions Core
 * Box-Muller Transformation and Seedable PRNG
 * @author أ. طارق ابوعشي
 */

// Seedable PRNG (Mulberry32) for reproducible statistical trials
export class SeededRandom {
  constructor(seed = 1337) {
    this.s = seed;
  }

  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/**
 * Box-Muller Transform to generate Standard Normal Random Variables Z ~ N(0, 1)
 */
let hasSpare = false;
let spare = 0;

export function sampleStandardNormal(rng = null) {
  if (hasSpare && !rng) {
    hasSpare = false;
    return spare;
  }

  let u, v, s;
  do {
    const r1 = rng ? rng.next() : Math.random();
    const r2 = rng ? rng.next() : Math.random();
    u = r1 * 2 - 1;
    v = r2 * 2 - 1;
    s = u * u + v * v;
  } while (s >= 1 || s === 0);

  const mul = Math.sqrt(-2.0 * Math.log(s) / s);
  if (!rng) {
    spare = v * mul;
    hasSpare = true;
  }
  return u * mul;
}

/**
 * Generate correlated standard normal pairs given correlation rho
 */
export function sampleCorrelatedNormals(rho, rng = null) {
  const z1 = sampleStandardNormal(rng);
  const z2 = sampleStandardNormal(rng);
  const correlatedZ2 = rho * z1 + Math.sqrt(1 - rho * rho) * z2;
  return [z1, correlatedZ2];
}
