import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  bpmToMs,
  msToBpm,
  tempoCurve,
  polyrhythmCycleLength,
  polyrhythmPattern,
  polyrhythmDensity,
  swingFactor,
  grooveVelocity,
  microtiming,
  syncopationScore,
  offbeatDensity,
  rhythmicEntropy,
  isSimple,
  isCompound,
  isOdd,
  beatCount,
  subdivision,
  downbeats,
  timeSignatureChanges,
} from "../dist/index.js";

const near = (a: number, b: number, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

// ── Tempo ────────────────────────────────────────────────────────────────────

describe("tempo", () => {
  it("bpmToMs converts 120 → 500ms", () => near(bpmToMs(120), 500));
  it("bpmToMs converts 60 → 1000ms", () => near(bpmToMs(60), 1000));
  it("msToBpm converts 500 → 120", () => near(msToBpm(500), 120));
  it("msToBpm converts 1000 → 60", () => near(msToBpm(1000), 60));
  it("bpmToMs and msToBpm are inverses", () => near(msToBpm(bpmToMs(140)), 140));

  it("tempoCurve linear endpoints", () => {
    const c = tempoCurve(100, 200, 5, "linear");
    assert.equal(c.length, 5);
    near(c[0], 100);
    near(c[4], 200);
  });

  it("tempoCurve linear middle values", () => {
    const c = tempoCurve(100, 200, 5, "linear");
    near(c[2], 150);
  });

  it("tempoCurve exponential is monotonic", () => {
    const c = tempoCurve(100, 200, 5, "exponential");
    assert.equal(c.length, 5);
    near(c[0], 100);
    assert.ok(c[4] > c[0]);
  });

  it("tempoCurve logarithmic produces values", () => {
    const c = tempoCurve(100, 200, 5, "logarithmic");
    assert.equal(c.length, 5);
    near(c[0], 100, 0.5);
  });

  it("tempoCurve throws on unknown curve", () => {
    assert.throws(() => tempoCurve(100, 200, 5, "banana" as any));
  });

  it("tempoCurve single step", () => {
    const c = tempoCurve(120, 120, 1, "linear");
    assert.equal(c.length, 1);
    near(c[0], 120);
  });
});

// ── Polyrhythm ───────────────────────────────────────────────────────────────

describe("polyrhythm", () => {
  it("cycleLength [3,2] → 6", () => assert.equal(polyrhythmCycleLength([3, 2]), 6));
  it("cycleLength [3,4] → 12", () => assert.equal(polyrhythmCycleLength([3, 4]), 12));
  it("cycleLength [2,3,5] → 30", () => assert.equal(polyrhythmCycleLength([2, 3, 5]), 30));
  it("cycleLength [4] → 4", () => assert.equal(polyrhythmCycleLength([4]), 4));
  it("cycleLength [4,3] → 12", () => assert.equal(polyrhythmCycleLength([4, 3]), 12));

  it("pattern [3,2] produces 2 voices of length 6", () => {
    const p = polyrhythmPattern([3, 2]);
    assert.equal(p.length, 2);
    assert.equal(p[0].length, 6);
    assert.equal(p[1].length, 6);
  });

  it("pattern [3,2] voice 0 has 3 hits", () => {
    const p = polyrhythmPattern([3, 2]);
    assert.equal(p[0].reduce((s, v) => s + v, 0), 3);
  });

  it("density [3,2] → 5/6", () => near(polyrhythmDensity([3, 2]), 5 / 6));
  it("density [4] → 1.0", () => near(polyrhythmDensity([4]), 1.0));
});

// ── Groove ───────────────────────────────────────────────────────────────────

describe("groove", () => {
  it("swingFactor leaves on-beats unchanged", () => {
    const grid = [0, 0.5, 1.0, 1.5];
    const swung = swingFactor(grid, 0.5);
    assert.equal(swung[0], 0);
    assert.equal(swung[2], 1.0);
  });

  it("swingFactor moves off-beats", () => {
    const grid = [0, 0.5, 1.0, 1.5];
    const swung = swingFactor(grid, 0.5);
    assert.ok(swung[1] > 0.5);
  });

  it("swingFactor zero amount returns same grid", () => {
    const grid = [0, 0.5, 1.0, 1.5];
    const swung = swingFactor(grid, 0);
    assert.deepEqual(swung, grid);
  });

  it("grooveVelocity binary pattern", () => {
    const vel = grooveVelocity([1, 0, 1, 0]);
    assert.equal(vel.length, 4);
    assert.equal(vel[1], 0);
    assert.ok(vel[0] > 0);
  });

  it("grooveVelocity with accents", () => {
    const vel = grooveVelocity([1, 1, 1, 1], [2, 1, 2, 1]);
    assert.ok(vel[0] > vel[1]);
  });

  it("grooveVelocity clamps at 127", () => {
    const vel = grooveVelocity([1], [10]);
    assert.equal(vel[0], 127);
  });

  it("microtiming with zero humanize returns copy", () => {
    const offsets = [0, 5, -3, 10];
    const result = microtiming(offsets, 0);
    assert.deepEqual(result, offsets);
    assert.notStrictEqual(result, offsets);
  });

  it("microtiming with humanize produces same length", () => {
    const offsets = [0, 0, 0, 0];
    const result = microtiming(offsets, 5);
    assert.equal(result.length, 4);
  });
});

// ── Syncopation ──────────────────────────────────────────────────────────────

describe("syncopation", () => {
  it("all downbeats = zero syncopation", () => {
    near(syncopationScore([1, 0, 1, 0, 1, 0, 1, 0], 4), 0);
  });

  it("all offbeats = positive syncopation", () => {
    assert.ok(syncopationScore([0, 1, 0, 1, 0, 1, 0, 1], 4) > 0);
  });

  it("empty pattern = zero", () => {
    assert.equal(syncopationScore([], 4), 0);
  });

  it("offbeatDensity all on-beats = 0", () => {
    near(offbeatDensity([1, 0, 1, 0], 4), 0);
  });

  it("offbeatDensity mixed pattern", () => {
    assert.ok(offbeatDensity([1, 1, 1, 1], 4) > 0);
  });

  it("offbeatDensity empty = 0", () => {
    assert.equal(offbeatDensity([], 4), 0);
  });

  it("rhythmicEntropy solid pattern = 0", () => {
    assert.equal(rhythmicEntropy([1, 1, 1, 1]), 0);
  });

  it("rhythmicEntropy varied pattern > 0", () => {
    assert.ok(rhythmicEntropy([1, 0, 1, 0, 0, 1, 0, 1]) > 0);
  });

  it("rhythmicEntropy single hit = 0", () => {
    assert.equal(rhythmicEntropy([1]), 0);
  });

  it("rhythmicEntropy two hits = 0", () => {
    assert.equal(rhythmicEntropy([1, 1]), 0);
  });
});

// ── Meter ────────────────────────────────────────────────────────────────────

describe("meter", () => {
  it("4/4 is simple", () => assert.ok(isSimple({ numerator: 4, denominator: 4 })));
  it("3/4 is simple", () => assert.ok(isSimple({ numerator: 3, denominator: 4 })));
  it("4/4 is not compound", () => assert.ok(!isCompound({ numerator: 4, denominator: 4 })));
  it("4/4 is not odd", () => assert.ok(!isOdd({ numerator: 4, denominator: 4 })));

  it("6/8 is compound", () => assert.ok(isCompound({ numerator: 6, denominator: 8 })));
  it("6/8 beatCount = 2", () => assert.equal(beatCount({ numerator: 6, denominator: 8 }), 2));
  it("6/8 subdivision = 3", () => assert.equal(subdivision({ numerator: 6, denominator: 8 }), 3));

  it("7/8 is odd", () => assert.ok(isOdd({ numerator: 7, denominator: 8 })));
  it("7/8 beatCount = 7", () => assert.equal(beatCount({ numerator: 7, denominator: 8 }), 7));

  it("5/4 is odd", () => assert.ok(isOdd({ numerator: 5, denominator: 4 })));

  it("4/4 beatCount = 4", () => assert.equal(beatCount({ numerator: 4, denominator: 4 }), 4));
  it("4/4 subdivision = 2", () => assert.equal(subdivision({ numerator: 4, denominator: 4 }), 2));

  it("downbeats for 3 measures of 4/4", () => {
    assert.deepEqual(downbeats(3, { numerator: 4, denominator: 4 }), [0, 4, 8]);
  });

  it("downbeats for 0 measures", () => {
    assert.deepEqual(downbeats(0, { numerator: 4, denominator: 4 }), []);
  });

  it("timeSignatureChanges with repeats", () => {
    const changes = timeSignatureChanges(
      [{ numerator: 4, denominator: 4 }, { numerator: 3, denominator: 4 }],
      [2, 1]
    );
    assert.equal(changes.length, 3);
    assert.equal(changes[0].numerator, 4);
    assert.equal(changes[1].numerator, 4);
    assert.equal(changes[2].numerator, 3);
  });

  it("timeSignatureChanges without repeats", () => {
    const changes = timeSignatureChanges([
      { numerator: 4, denominator: 4 },
      { numerator: 3, denominator: 4 },
    ]);
    assert.equal(changes.length, 2);
  });
});
