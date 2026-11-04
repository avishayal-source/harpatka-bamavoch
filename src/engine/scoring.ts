import type { Difficulty, GameState, ScoreBreakdown } from '../models/types'

const DIFFICULTY_BONUS: Record<Difficulty, number> = {
  easy: 10,
  normal: 15,
  brave: 25,
}

/**
 * Final score = treasure + remaining health bonus + exploration bonus + difficulty bonus.
 * Health bonus is 0–20 from the share of HP left.
 * Exploration bonus is 2 per room resolved, capped at 40.
 */
export function scoreGame(state: GameState): ScoreBreakdown {
  const healthBonus = state.maxHp === 0 ? 0 : Math.round((state.hp / state.maxHp) * 20)
  const explorationBonus = Math.min(40, state.roomsCompleted * 2)
  const difficultyBonus = DIFFICULTY_BONUS[state.difficulty]
  return {
    treasure: state.treasure,
    healthBonus,
    explorationBonus,
    difficultyBonus,
    total: state.treasure + healthBonus + explorationBonus + difficultyBonus,
  }
}
