# rhythm-math

> Rhythm mathematics for the browser and Node.js — polyrhythms, syncopation, groove, meter, and tempo.

## What This Does

`rhythm-math` provides pure rhythm math for JavaScript/TypeScript. It models time signatures, polyrhythms, syncopation (Longuet-Higgins/Lee), groove patterns with velocity and microtiming, and tempo curves. No audio — just the numbers. Use it for Web Audio sequencers, music information retrieval, generative music, or rhythm analysis.

## The Cultural Root

Polyrhythms are central to West African drumming traditions (Ewe, Yoruba, Djembe). A master drummer plays conflicting rhythmic patterns that create emergent complexity — a 3:2 polyrhythm (hemiola) exists simultaneously as both 3 and 2. The math: the pattern repeats every LCM(3,2) = 6 beats. Syncopation — accenting the unexpected — is measured by the gap between expected metric weight and actual onset.

## Install

```bash
npm install rhythm-math
```

## Quick Start

```typescript
import {
  bpmToMs, tempoCurve,
  polyrhythmPattern, polyrhythmCycleLength,
  syncopationScore, offbeatDensity, rhythmicEntropy,
  swingFactor, grooveVelocity, microtiming,
  Meter, isSimple, isOdd,
  timeSignatureChanges,
} from "rhythm-math";

// Tempo
const msPerBeat = bpmToMs(120);  // 500
const curve = tempoCurve(120, 60, 8, "linear");

// Polyrhythm
const pattern = polyrhythmPattern([3, 2]);  // [[1,0,0,1,0,0], [1,0,1,0,1,0]]
const cycleLen = polyrhythmCycleLength([3, 2]);  // 6

// Syncopation
const score = syncopationScore([1,0,0,1,0,0,1,0], 4);
const offbeat = offbeatDensity([1,0,1,0,1,0,1,0], 4);  // 1.0
const entropy = rhythmicEntropy([1,0,0,1,0,0,1,0]);

// Groove
const swung = swingFactor([0, 0, 0, 0], 0.67);  // Apply swing
const velocities = grooveVelocity([1,0,1,0,1,1,0,1], [127,0,100,0,120,90,0,110]);
const humanized = microtiming([0,0,0,0], 3.0);

// Meter
const meter: Meter = { numerator: 7, denominator: 8 };
isSimple(meter);   // false
isOdd(meter);      // true

// Time signature changes
const changes = timeSignatureChanges([
  { numerator: 4, denominator: 4 },
  { numerator: 7, denominator: 8 },
], 2);
```

## API Reference

### Tempo
- `bpmToMs(bpm: number) → number` — Milliseconds per beat
- `msToBpm(ms: number) → number` — BPM from milliseconds
- `tempoCurve(start, end, steps, curve?) → number[]` — `"linear"` | `"exponential"` | `"logarithmic"`

### Polyrhythm
- `polyrhythmCycleLength(rates: number[]) → number`
- `polyrhythmPattern(rates: number[]) → number[][]` — Binary pattern per voice
- `polyrhythmDensity(rates: number[]) → number`

### Syncopation
- `syncopationScore(pattern: number[], meterNumerator?: number) → number`
- `offbeatDensity(pattern: number[], meterNumerator?: number) → number`
- `rhythmicEntropy(pattern: number[]) → number` — Shannon entropy of intervals

### Groove
- `swingFactor(grid: number[], amount?: number) → number[]`
- `grooveVelocity(pattern: number[], accentPattern?: number[]) → number[]`
- `microtiming(offsets: number[], amount?: number) → number[]`

### Meter
- `isSimple(meter: Meter) → boolean` — 2, 3, or 4
- `isCompound(meter: Meter) → boolean` — Grouped in 3s
- `isOdd(meter: Meter) → boolean` — 5, 7, 11, etc.
- `beatCount(meter: Meter) → number`
- `subdivision(meter: Meter) → number`
- `downbeats(measures: number, meter: Meter) → number[]`
- `timeSignatureChanges(meters: Meter[], repeats?: number) → Meter[]`

### Types
```typescript
interface Tempo { bpm: number; }
interface Polyrhythm { rates: number[]; }
interface Groove { velocities: number[]; offsets: number[]; }
interface Meter { numerator: number; denominator: number; }
```

## How It Works

Identical algorithms to the Python version (`rhythm-nation-math`):

- **Polyrhythms:** LCM cycle, binary pattern per voice
- **Syncopation:** Longuet-Higgins/Lee weight-based measure
- **Entropy:** Shannon entropy of inter-onset intervals
- **Swing:** Delay off-beat positions by fraction of grid spacing
- **Tempo curves:** Linear, exponential (BPM ratio), or logarithmic interpolation

## The Math

See `rhythm-nation-math` (PyPI version) for full mathematical details. Same algorithms, different language.

## License

MIT
