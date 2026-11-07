import type { Catalog, GameState, JournalEntry } from '../models/types'
import { weaponDamage } from './combat'
import { keysNeeded } from './gear'
import { edgeKey } from './mazeNav'
import { moveTo } from './movement'
import { choiceAccess, choiceUsed, passesCheck } from './requirementEvaluator'
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
  if (choiceUsed(choice, room, state)) throw new Error(`Already resolved: ${choiceId}`)

  const access = choiceAccess(choice, state)
  if (!access.visible) throw new Error(`Hidden choice: ${choiceId}`)
  if (!access.enabled) throw new Error(`Disabled choice: ${choiceId}`)

  const success = choice.check ? passesCheck(choice.check, state, weaponDamage(state, catalog)) : true
  const outcome = !success && choice.failure ? choice.failure : choice.success
  const journal: JournalEntry[] = [
    {
      roomId: room.id,
      text: choice.cost
        ? `קניתם: ${choice.label} (${choice.cost} מטבעות)`
        : choice.check
          ? `${choice.label} (${success ? 'הצליח' : 'לא הצליח'})`
          : choice.label,
    },
  ]
  const door = outcome.revealDoor
  if (door) {
    journal.push({ roomId: room.id, text: `מצאתם דלת סודית אל ${catalog.rooms[door]?.title ?? door}` })
  }
  const key = outcome.key && !state.keys.includes(outcome.key) ? outcome.key : undefined
  let message = textFor(state.ageGroup, outcome.message)
  if (key) {
    const name = catalog.keys[key] ?? key
    const have = state.keys.length + 1
    const needed = keysNeeded(state)
    journal.push({ roomId: room.id, text: `מצאתם את ${name}` })
    message +=
      have >= needed
        ? `\n\n🔑 מצאתם את ${name}! יש לכם ${have} מפתחות, וזה מספיק כדי לפתוח את הדלת הגדולה שליד היציאה.`
        : `\n\n🔑 מצאתם את ${name}! יש לכם ${have} מתוך ${needed} מפתחות לדלת הגדולה.`
  }
  return applyVitals(state, {
    hpDelta: outcome.hpChange,
    magicDelta: outcome.magicChange,
    treasureDelta: outcome.treasureChange,
    message,
    success,
    victory: outcome.victory,
    nextRoomId: outcome.nextRoomId ?? null,
    choiceId: choice.id,
    recordDecision: outcome.recordDecision,
    resolveChoice: true,
    revealDoor: door ? edgeKey(room.id, door) : undefined,
    journal,
    spend: choice.cost,
    key,
    gear: outcome.gear,
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
