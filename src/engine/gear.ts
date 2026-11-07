import type { AgeGroup, GameState } from '../models/types'

const BASE_KEYS: Record<AgeGroup, number> = { '6-7': 1, '8-9': 2, '10-12': 3 }

/** Keys the final door needs: one per age step, one more on the brave level, never more than 3. */
export function keysNeeded(state: Pick<GameState, 'ageGroup' | 'difficulty'>): number {
  return Math.min(3, BASE_KEYS[state.ageGroup] + (state.difficulty === 'brave' ? 1 : 0))
}

export function keysMissing(state: GameState): number {
  return Math.max(0, keysNeeded(state) - state.keys.length)
}

export function gearBonus(state: GameState, stat: 'damage' | 'defense' | 'spell'): number {
  return state.gear.reduce((sum, item) => sum + (item[stat] ?? 0), 0)
}
