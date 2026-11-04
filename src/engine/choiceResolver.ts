import type { Catalog, GameState } from '../models/types'
import { moveTo } from './movement'
import { choiceAccess, passesCheck } from './requirementEvaluator'
import { textFor } from './text'
import { applyVitals } from './vitals'

export function resolveChoice(state: GameState, choiceId: string, catalog: Catalog): GameState {
  if (state.phase !== 'playing') throw new Error('Choices can only be resolved while playing')
  if (state.combat) throw new Error('Finish the fight first')
  if (choiceId.startsWith('move:')) return moveTo(state, choiceId.slice(5), catalog)
  const room = catalog.rooms[state.currentRoomId]
  if (!room) throw new Error(`Unknown room: ${state.currentRoomId}`)
  const choice = room.choices.find((item) => item.id === choiceId)
  if (!choice) throw new Error(`Unknown choice: ${choiceId}`)
  if (state.resolvedChoices.includes(choice.id)) throw new Error(`Already resolved: ${choiceId}`)

  const access = choiceAccess(choice, state)
  if (!access.visible) throw new Error(`Hidden choice: ${choiceId}`)
  if (!access.enabled) throw new Error(`Disabled choice: ${choiceId}`)

  const weapon = catalog.weapons[state.character.weaponId]
  const success = choice.check ? passesCheck(choice.check, state, weapon?.damage ?? 0) : true
  const outcome = !success && choice.failure ? choice.failure : choice.success
  return applyVitals(state, {
    hpDelta: outcome.hpChange,
    magicDelta: outcome.magicChange,
    treasureDelta: outcome.treasureChange,
    message: textFor(state.ageGroup, outcome.message),
    success,
    victory: outcome.victory,
    nextRoomId: outcome.nextRoomId ?? null,
    choiceId: choice.id,
    recordDecision: outcome.recordDecision,
    resolveChoice: true,
  })
}

export function acknowledgeFeedback(state: GameState): GameState {
  if (state.phase !== 'feedback' || !state.pendingFeedback) return state
  const nextRoomId = state.pendingFeedback.nextRoomId
  if (!nextRoomId) return { ...state, phase: 'playing', pendingFeedback: null }
  const routeIndex = state.plannedRoute.indexOf(nextRoomId)
  return {
    ...state,
    phase: 'playing',
    pendingFeedback: null,
    currentRoomId: nextRoomId,
    cameFromRoomId: state.currentRoomId,
    routeIndex: routeIndex >= 0 ? routeIndex : state.routeIndex,
    visitedRooms: state.visitedRooms.includes(nextRoomId)
      ? state.visitedRooms
      : [...state.visitedRooms, nextRoomId],
  }
}
