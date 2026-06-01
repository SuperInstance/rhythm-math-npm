// rhythm-math — Rhythm mathematics for the browser and web audio

// ── Types ────────────────────────────────────────────────────────────────────

export interface Tempo {
  bpm: number;
}

export interface Polyrhythm {
  rates: number[];
}

export interface Groove {
  velocities: number[];
  offsets: number[];
}

export interface Meter {
  numerator: number;
  denominator: number;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

// ── Tempo ────────────────────────────────────────────────────────────────────

/**
 * Convert BPM to milliseconds per beat.
 */
export function bpmToMs(bpm: number): number {
  return 60000.0 / bpm;
}

/**
 * Convert milliseconds per beat to BPM.
 */
export function msToBpm(ms: number): number {
  return 60000.0 / ms;
}

/**
 * Generate a tempo curve from start to end BPM.
 * curve: "linear" | "exponential" | "logarithmic"
 */
export function tempoCurve(
  start: number,
  end: number,
  steps: number,
  curve: "linear" | "exponential" | "logarithmic" = "linear"
): number[] {
  const safeStart = Math.max(start, 0.1);
  const denom = Math.max(steps - 1, 1);

  if (curve === "linear") {
    return Array.from({ length: steps }, (_, i) =>
      start + (end - start) * (i / denom)
    );
  }

  if (curve === "exponential") {
    const ratio = end / safeStart;
    return Array.from({ length: steps }, (_, i) =>
      start * Math.pow(ratio, i / denom)
    );
  }

  if (curve === "logarithmic") {
    const logStart = Math.log(safeStart);
    const logEnd = Math.log(Math.max(end, 0.1));
    return Array.from({ length: steps }, (_, i) =>
      Math.exp(logStart + (logEnd - logStart) * (i / denom))
    );
  }

  throw new Error(`Unknown curve type: ${curve}`);
}

// ── Polyrhythm ───────────────────────────────────────────────────────────────

/**
 * Compute the LCM cycle length for a set of polyrhythmic rates.
 */
export function polyrhythmCycleLength(rates: number[]): number {
  return rates.reduce((acc, r) => lcm(acc, r), 1);
}

/**
 * Generate binary patterns for each voice of a polyrhythm.
 * Returns one binary array per rate.
 */
export function polyrhythmPattern(rates: number[]): number[][] {
  const cycle = polyrhythmCycleLength(rates);
  return rates.map((r) => {
    const step = cycle / r;
    return Array.from({ length: cycle }, (_, i) =>
      i % step === 0 ? 1 : 0
    );
  });
}

/**
 * Average density (hits per subdivision) across all voices.
 */
export function polyrhythmDensity(rates: number[]): number {
  const totalHits = rates.reduce((s, r) => s + r, 0);
  return totalHits / polyrhythmCycleLength(rates);
}

// ── Groove ───────────────────────────────────────────────────────────────────

/**
 * Apply swing to a grid of beat positions.
 * swingAmount: 0 = straight, 1 = full triplet swing.
 */
export function swingFactor(grid: number[], amount: number = 0): number[] {
  const result = grid.slice();
  for (let i = 1; i < result.length; i += 2) {
    result[i] += amount * (result[i] - result[i - 1]) * 0.33;
  }
  return result;
}

/**
 * Convert a binary pattern to velocity values with optional accents.
 */
export function grooveVelocity(
  pattern: number[],
  accents?: number[]
): number[] {
  const accent = accents ?? pattern.map(() => 1);
  return pattern.map((p, i) =>
    Math.min(127, Math.round(p * 80 * (accent[i] ?? 1)))
  );
}

/**
 * Add human-like microtiming to note offsets using a seeded Gaussian.
 * humanize: standard deviation in ms (0 = no humanization).
 * If humanize > 0, uses a simple Box-Muller transform.
 */
export function microtiming(
  offsets: number[],
  humanize: number = 0
): number[] {
  if (humanize <= 0) return offsets.slice();
  // Deterministic pseudo-random using a simple LCG for reproducibility
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  return offsets.map((o) => {
    const u1 = Math.max(rand(), 1e-10);
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return o + humanize * z;
  });
}

// ── Syncopation ──────────────────────────────────────────────────────────────

/**
 * Compute syncopation score using Longuet-Higgins/Lee measure.
 */
export function syncopationScore(
  pattern: number[],
  meterNumerator: number = 4
): number {
  const n = pattern.length;
  if (n === 0) return 0.0;

  const weights: number[] = [];
  for (let i = 0; i < n; i++) {
    const beat = i % meterNumerator;
    if (beat === 0) weights.push(4.0);
    else if (beat === meterNumerator / 2) weights.push(3.0);
    else if (beat % 2 === 0) weights.push(2.0);
    else weights.push(1.0);
  }

  let syncopation = 0.0;
  for (let i = 0; i < n; i++) {
    if (pattern[i] === 1) {
      const next = (i + 1) % n;
      if (pattern[next] === 0 && weights[next] > weights[i]) {
        syncopation += weights[next] - weights[i];
      }
    }
  }
  return syncopation;
}

/**
 * Fraction of hits that fall on off-beats.
 */
export function offbeatDensity(
  pattern: number[],
  meterNumerator: number = 4
): number {
  const hits = pattern.reduce((s, v) => s + v, 0);
  if (hits === 0) return 0.0;

  const strongBeats = new Set([0, Math.floor(meterNumerator / 2)]);
  let offbeatHits = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === 1 && !strongBeats.has(i % meterNumerator)) {
      offbeatHits++;
    }
  }
  return offbeatHits / hits;
}

/**
 * Shannon entropy of the interval distribution in the pattern.
 */
export function rhythmicEntropy(pattern: number[]): number {
  const hitPositions: number[] = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === 1) hitPositions.push(i);
  }
  if (hitPositions.length < 2) return 0.0;

  const intervals: number[] = [];
  for (let i = 0; i < hitPositions.length - 1; i++) {
    intervals.push(hitPositions[i + 1] - hitPositions[i]);
  }
  // Wrap around
  intervals.push(pattern.length - hitPositions[hitPositions.length - 1] + hitPositions[0]);

  const total = intervals.length;
  const counts = new Map<number, number>();
  for (const iv of intervals) counts.set(iv, (counts.get(iv) ?? 0) + 1);

  let entropy = 0.0;
  for (const c of counts.values()) {
    const p = c / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// ── Meter ────────────────────────────────────────────────────────────────────

export function isSimple(meter: Meter): boolean {
  return meter.numerator === 2 || meter.numerator === 3 || meter.numerator === 4;
}

export function isCompound(meter: Meter): boolean {
  return meter.numerator % 3 === 0 && meter.numerator > 3;
}

export function isOdd(meter: Meter): boolean {
  return ![2, 3, 4, 6, 9, 12].includes(meter.numerator);
}

export function beatCount(meter: Meter): number {
  return isCompound(meter) ? meter.numerator / 3 : meter.numerator;
}

export function subdivision(meter: Meter): number {
  return isCompound(meter) ? 3 : 2;
}

/**
 * Positions of downbeats across multiple measures.
 */
export function downbeats(measures: number, meter: Meter): number[] {
  return Array.from({ length: measures }, (_, i) => i * meter.numerator);
}

/**
 * Generate a sequence of time signature changes.
 * meters: list of meters to cycle through.
 * repeats: how many times to repeat each meter (default 1 each).
 */
export function timeSignatureChanges(
  meters: Meter[],
  repeats?: number[]
): Meter[] {
  const reps = repeats ?? meters.map(() => 1);
  const result: Meter[] = [];
  for (let i = 0; i < meters.length; i++) {
    for (let j = 0; j < (reps[i] ?? 1); j++) {
      result.push(meters[i]);
    }
  }
  return result;
}
