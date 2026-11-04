import type { Difficulty } from '../models/types'

const DAMAGE_MULTIPLIER: Record<Difficulty, number> = {
  easy: 0.7,
  normal: 1,
  brave: 1.25,
}

/** Negative changes are damage. Positive changes are healing and shift slightly with difficulty. */
export function scaleHpChange(amount: number, difficulty: Difficulty): number {
  if (amount < 0) {
    return -Math.max(1, Math.round(Math.abs(amount) * DAMAGE_MULTIPLIER[difficulty]))
  }
  if (amount > 0) {
    if (difficulty === 'easy') return amount + 1
    if (difficulty === 'brave') return Math.max(1, amount - 1)
    return amount
  }
  return 0
}

export function scaleTreasure(amount: number, difficulty: Difficulty): number {
  if (amount > 0 && difficulty === 'brave') return Math.round(amount * 1.25)
  return amount
}
