import { secondChanceBody } from '../content/uiText'
import type { Difficulty, GameState, JournalEntry, PendingFeedback } from '../models/types'
import { scaleHpChange, scaleTreasure } from './adjustments'
import { clamp } from './clamp'

const SECOND_CHANCE_FRACTION = 0.35

export interface VitalChange {
  hpDelta?: number
  magicDelta?: number
  treasureDelta?: number
  message: string
  success: boolean
  victory?: boolean
  nextRoomId?: string | null
  choiceId?: string
  recordDecision?: string
  dice?: PendingFeedback['dice']
  resolveChoice?: boolean
  defeatMonsterId?: string
  endCombat?: boolean
  /** Edge key of a secret door this result opens. */
  revealDoor?: string
  journal?: JournalEntry[]
  /** Remember a monster's life after you leave its room. */
  rememberMonster?: { id: string; hp: number }
}

export function applyVitals(state: GameState, change: VitalChange): GameState {
  const hpBefore = state.hp
  const magicBefore = state.magicPoints
  const treasureBefore = state.treasure
  const hpDelta = scaleHpChange(change.hpDelta ?? 0, state.difficulty)
  const magicDelta = change.magicDelta ?? 0
  const treasureDelta = scaleTreasure(change.treasureDelta ?? 0, state.difficulty)

  let hp = Math.min(state.maxHp, hpBefore + hpDelta)
  let secondChanceAvailable = state.secondChanceAvailable
  let secondChanceUsed = false
  let gameOver = false

  if (hp <= 0) {
    if (secondChanceAvailable) {
      hp = Math.max(1, Math.round(state.maxHp * SECOND_CHANCE_FRACTION))
      secondChanceAvailable = false
      secondChanceUsed = true
    } else {
      hp = 0
      gameOver = true
    }
  }

  const magicAfter = clamp(magicBefore + magicDelta, 0, state.maxMagicPoints)
  const treasureAfter = Math.max(0, treasureBefore + treasureDelta)
  const message = secondChanceUsed ? `${change.message}\n\n${secondChanceBody}` : change.message
  const tone: PendingFeedback['tone'] = secondChanceUsed
    ? 'second-chance'
    : hp < hpBefore && !change.victory
      ? 'bad'
      : change.success
        ? 'good'
        : 'neutral'

  const decisions = change.choiceId ? [...state.decisions, change.choiceId] : [...state.decisions]
  if (change.success && change.recordDecision) decisions.push(change.recordDecision)
  const resolvedChoices =
    change.resolveChoice && change.choiceId && !state.resolvedChoices.includes(change.choiceId)
      ? [...state.resolvedChoices, change.choiceId]
      : state.resolvedChoices
  const defeatedMonsters =
    change.defeatMonsterId && !state.defeatedMonsters.includes(change.defeatMonsterId)
      ? [...state.defeatedMonsters, change.defeatMonsterId]
      : state.defeatedMonsters
  const foundDoors =
    change.revealDoor && !state.foundDoors.includes(change.revealDoor)
      ? [...state.foundDoors, change.revealDoor]
      : state.foundDoors
  const monsterHp = { ...state.monsterHp }
  if (change.rememberMonster) monsterHp[change.rememberMonster.id] = change.rememberMonster.hp
  if (change.defeatMonsterId) delete monsterHp[change.defeatMonsterId]

  return {
    ...state,
    hp,
    magicPoints: magicAfter,
    treasure: treasureAfter,
    secondChanceAvailable,
    decisions,
    resolvedChoices,
    defeatedMonsters,
    foundDoors,
    monsterHp,
    journal: change.journal ? [...state.journal, ...change.journal] : state.journal,
    combat: change.endCombat || gameOver ? null : state.combat,
    phase: change.victory ? 'victory' : gameOver ? 'gameover' : 'feedback',
    pendingFeedback: {
      tone: gameOver ? 'bad' : tone,
      message,
      success: change.success,
      secondChanceUsed,
      hpBefore,
      hpAfter: hp,
      magicBefore,
      magicAfter,
      treasureBefore,
      treasureAfter,
      nextRoomId: change.victory || gameOver ? null : (change.nextRoomId ?? null),
      dice: change.dice,
    },
  }
}

export function monsterTuning(difficulty: Difficulty, hp: number, attack: number): { hp: number; attack: number } {
  if (difficulty === 'easy') return { hp: Math.max(6, hp - 2), attack: Math.max(1, attack - 1) }
  if (difficulty === 'brave') return { hp: hp + 2, attack: attack + 1 }
  return { hp, attack }
}
