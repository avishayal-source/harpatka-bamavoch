import type { AttributeKey, Check, Choice, Difficulty, GameState, Room } from '../models/types'
import { edgeKey } from './mazeNav'

const LOW_HP_RATIO = 0.25

export function thresholdShift(difficulty: Difficulty): number {
  if (difficulty === 'easy') return -1
  if (difficulty === 'brave') return 1
  return 0
}

export function effectiveAttribute(state: GameState, attribute: AttributeKey): number {
  const base = state.character.attributes[attribute]
  const wounded = state.maxHp > 0 && state.hp / state.maxHp < LOW_HP_RATIO
  if (wounded && (attribute === 'strength' || attribute === 'agility')) {
    return base - 1
  }
  return base
}

export function passesCheck(check: Check, state: GameState, weaponDamage: number): boolean {
  const shift = thresholdShift(state.difficulty)
  if (check.kind === 'attribute') {
    return effectiveAttribute(state, check.attribute) >= check.minimum + shift
  }
  const power = effectiveAttribute(state, 'strength') + weaponDamage
  return power >= check.enemyPower + shift
}

export interface ChoiceAccess {
  visible: boolean
  enabled: boolean
  reason?: string
}

export function choiceAccess(choice: Choice, state: GameState): ChoiceAccess {
  if (choice.requiresClass && !choice.requiresClass.includes(state.character.classId)) {
    return { visible: false, enabled: false }
  }
  if (choice.requiresDifficulty && choice.requiresDifficulty !== state.difficulty) {
    return { visible: false, enabled: false }
  }
  if (choice.requiresWeapon && choice.requiresWeapon !== state.character.weaponId) {
    return { visible: false, enabled: false }
  }
  if (choice.requiresDecision && !state.decisions.includes(choice.requiresDecision)) {
    return { visible: false, enabled: false }
  }
  if (choice.requiresPreviousRoom && !state.visitedRooms.includes(choice.requiresPreviousRoom)) {
    return { visible: false, enabled: false }
  }
  if (choice.requiresMagic !== undefined && state.maxMagicPoints <= 0) {
    return { visible: false, enabled: false }
  }
  if (choice.requiresMagic !== undefined && state.magicPoints < choice.requiresMagic) {
    return {
      visible: true,
      enabled: false,
      reason: `אין מספיק נקודות קסם (צריך ${choice.requiresMagic})`,
    }
  }
  return { visible: true, enabled: true }
}

/** Used already, or an alternative in its group was used, or all it does is open a door you found. */
export function choiceUsed(choice: Choice, room: Room, state: GameState): boolean {
  if (state.resolvedChoices.includes(choice.id)) return true
  if (
    choice.group &&
    room.choices.some((other) => other.group === choice.group && state.resolvedChoices.includes(other.id))
  ) {
    return true
  }
  const door = choice.success.revealDoor
  return Boolean(door && !choice.success.treasureChange && state.foundDoors.includes(edgeKey(room.id, door)))
}

export function intelligenceHintThreshold(difficulty: Difficulty, minimum: number): number {
  if (difficulty === 'easy') return minimum - 2
  if (difficulty === 'brave') return minimum + 1
  return minimum
}
