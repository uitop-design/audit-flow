/** Small seeded PRNG (mulberry32) so demo data is identical on every run. Not for security use. */
export interface Random {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
  /** Lower-case hex string of the given length. */
  hex(length: number): string;
}

export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));

  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      const item = items[int(0, items.length - 1)];
      if (item === undefined) {
        throw new Error('Cannot pick from an empty list');
      }
      return item;
    },
    chance: (probability) => next() < probability,
    hex: (length) => Array.from({ length }, () => int(0, 15).toString(16)).join(''),
  };
}
