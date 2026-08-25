/**
 * Deterministic, named random streams. Same seed -> same sequence, forever
 * - useful for reproducible procedural generation (same seed should give
 * the same level/loot/whatever every time).
 *
 * This is the kind of logic worth a Tier 3 project: it's easy to get subtly
 * wrong (see the mulberry32 constants below - typo one of those and every
 * test still "runs", it just silently stops being uniformly distributed),
 * so it's worth covering with jest instead of only eyeballing it in the
 * GDevelop preview.
 */

type RandomGenerator = () => number;

const mulberry32 = (seed: number): RandomGenerator => {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const streams = new Map<string, RandomGenerator>();

export const seed = (streamName: string, seedValue: number): void => {
  streams.set(streamName, mulberry32(seedValue));
};

export const next = (streamName: string): number => {
  const rng = streams.get(streamName);
  if (!rng) {
    throw new Error(
      `Unknown random stream "${streamName}" - call Seed on it first.`
    );
  }
  return rng();
};

export const nextInRange = (
  streamName: string,
  min: number,
  max: number
): number => min + next(streamName) * (max - min);
