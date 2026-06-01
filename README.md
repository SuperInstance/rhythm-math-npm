# rhythm-math

Rhythm mathematics for the browser and web audio — tempo, polyrhythm, groove, syncopation, and meter.

## Install

```bash
npm install rhythm-math
```

## API

### Types

- `Tempo` — `{ bpm: number }`
- `Polyrhythm` — `{ rates: number[] }`
- `Groove` — `{ velocities: number[], offsets: number[] }`
- `Meter` — `{ numerator: number, denominator: number }`

### Tempo

- `bpmToMs(bpm)` → milliseconds per beat
- `msToBpm(ms)` → BPM
- `tempoCurve(start, end, steps, curve)` → `number[]` where curve is `"linear"`, `"exponential"`, or `"logarithmic"`

### Polyrhythm

- `polyrhythmCycleLength(rates)` → LCM of rates
- `polyrhythmPattern(rates)` → binary arrays per voice
- `polyrhythmDensity(rates)` → average hit density

### Groove

- `swingFactor(grid, amount)` → swung grid positions
- `grooveVelocity(pattern, accents?)` → MIDI velocities (0–127)
- `microtiming(offsets, humanize)` → humanized offsets

### Syncopation

- `syncopationScore(pattern, meterNumerator)` → Longuet-Higgins/Lee score
- `offbeatDensity(pattern, meterNumerator)` → fraction of off-beat hits
- `rhythmicEntropy(pattern)` → Shannon entropy of interval distribution

### Meter

- `isSimple(meter)`, `isCompound(meter)`, `isOdd(meter)` → boolean
- `beatCount(meter)` → main beats per measure
- `subdivision(meter)` → subdivisions per beat
- `downbeats(measures, meter)` → downbeat positions
- `timeSignatureChanges(meters, repeats?)` → expanded meter sequence

## License

MIT
