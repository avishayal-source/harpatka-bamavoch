export type Rng = () => number

export function createRng(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic die roll from the saved dice state, so a reload can't reroll. */
export function rollDie(diceState: number, sides = 6): { roll: number; diceState: number } {
  const next = (Math.imul(diceState || 1, 1664525) + 1013904223) >>> 0
  return { roll: (next % sides) + 1, diceState: next || 1 }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000)
}
