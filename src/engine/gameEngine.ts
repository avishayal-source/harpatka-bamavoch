import type {
  Catalog,
  CharacterClass,
  Choice,
  ChoiceView,
  GameState,
  NewGameInput,
  RolledCharacter,
  RoomView,
} from '../models/types'
import { ATTRIBUTE_KEYS } from '../models/types'
import { choiceAccess, choiceUsed, effectiveAttribute, intelligenceHintThreshold } from './requirementEvaluator'
import { keysMissing, keysNeeded, shopPrice } from './gear'
import { shopActions } from './shop'
import { directionWord, exitBlocked, isSecretLink, neighborIds } from './mazeNav'
import { randomSeed, type Rng } from './random'
import { textFor } from './text'

export { acknowledgeFeedback, resolveChoice } from './choiceResolver'
export { combatAction, combatActions, defenseScore } from './combat'
export { gearBonus, keysMissing, keysNeeded } from './gear'
export { getMapView } from './mazeNav'
export { scoreGame } from './scoring'

export function rollAttribute(min: number, max: number, rng: Rng): number {
  if (max <= min) return min
  return min + Math.floor(rng() * (max - min + 1))
}

export function rollCharacter(classId: CharacterClass, catalog: Catalog, rng: Rng = Math.random): RolledCharacter {
  const definition = catalog.classes[classId]
  const attributes = {} as RolledCharacter['attributes']
  for (const key of ATTRIBUTE_KEYS) {
    const [min, max] = definition.ranges[key]
    attributes[key] = rollAttribute(min, max, rng)
  }
  return {
    classId,
    attributes,
    maxHp: definition.hp,
    maxMagicPoints: definition.magicPoints,
  }
}

export function createNewGame(input: NewGameInput, catalog: Catalog): GameState {
  const definition = catalog.classes[input.classId]
  const weapon = catalog.weapons[input.weaponId]
  if (!weapon || weapon.classId !== input.classId) {
    throw new Error('Weapon does not belong to this character')
  }
  for (const key of ATTRIBUTE_KEYS) {
    const [min, max] = definition.ranges[key]
    const value = input.attributes[key]
    if (value < min || value > max) {
      throw new Error(`Attribute ${key} is outside the class range`)
    }
  }

  const seed = input.seed ?? randomSeed()
  const startRoomId = catalog.world.startRoomId

  return {
    seed,
    character: {
      classId: input.classId,
      name: definition.name,
      attributes: { ...input.attributes },
      weaponId: input.weaponId,
    },
    currentRoomId: startRoomId,
    routeIndex: 0,
    plannedRoute: [startRoomId],
    hp: definition.hp,
    maxHp: definition.hp,
    magicPoints: definition.magicPoints,
    maxMagicPoints: definition.magicPoints,
    treasure: 0,
    visitedRooms: [startRoomId],
    roomVisits: { [startRoomId]: 1 },
    discoveredEdges: [],
    cameFromRoomId: null,
    defeatedMonsters: [],
    monsterHp: {},
    resolvedChoices: [],
    foundDoors: [],
    journal: [],
    keys: [],
    gear: [],
    shops: {},
    diceState: seed || 1,
    combat: null,
    decisions: [],
    difficulty: input.difficulty,
    ageGroup: input.ageGroup,
    adventureLength: input.adventureLength,
    secondChanceAvailable: true,
    roomsCompleted: 1,
    phase: 'playing',
    pendingFeedback: null,
  }
}

export function listChoiceViews(state: GameState, catalog: Catalog): ChoiceView[] {
  const room = catalog.rooms[state.currentRoomId]
  if (!room || state.combat) return []
  const story = room.choices.flatMap((choice) => {
    if (choiceUsed(choice, room, state)) return []
    const access = choiceAccess(choice, state)
    if (!access.visible) return []
    return [{ id: choice.id, label: priceLabel(state, room.id, choice), enabled: access.enabled, reason: access.reason }]
  })
  return [...story, ...shopActions(state, catalog), ...exitChoices(state, catalog)]
}

function priceLabel(state: GameState, roomId: string, choice: Choice): string {
  if (choice.cost === undefined) return choice.label
  const price = shopPrice(state, roomId, choice.cost)
  const was = price === choice.cost ? '' : ` (במקום ${choice.cost})`
  return `${choice.label} · ${price} מטבעות${was}`
}

function exitChoices(state: GameState, catalog: Catalog): ChoiceView[] {
  const here = catalog.rooms[state.currentRoomId]
  if (!here) return []
  return neighborIds(state.currentRoomId, catalog, state).map((roomId) => {
    const there = catalog.rooms[roomId]
    const blocked = exitBlocked(state, catalog, roomId)
    const way = here.x !== undefined && there?.x !== undefined ? directionWord(here, there) : 'הלאה'
    const back = roomId === state.cameFromRoomId ? 'חזרה ' : ''
    const secret = isSecretLink(catalog, here.id, roomId) ? ' דרך הדלת הסודית' : ''
    const known = state.visitedRooms.includes(roomId)
    const finalDoor = roomId === catalog.world.exitRoomId
    const missing = keysMissing(state)
    const name = finalDoor ? 'הדלת הגדולה' : known ? (there?.title ?? roomId) : 'חדר שעוד לא ראיתם'
    let reason: string | undefined
    if (blocked) {
      if (finalDoor && missing > 0) {
        reason = missing === 1 ? 'הדלת נעולה. חסר לכם עוד מפתח אחד' : `הדלת נעולה. חסרים לכם עוד ${missing} מפתחות`
      } else {
        reason = here.type === 'TRAP' ? 'קודם עוברים את המלכודת, או חוזרים אחורה' : 'קודם מתמודדים עם הדלת, או חוזרים אחורה'
      }
    }
    return {
      id: `move:${roomId}`,
      label: `${back}${way}${secret} אל ${name}`,
      enabled: !blocked,
      reason,
    }
  })
}

export function finalDoorText(state: GameState): string {
  const needed = keysNeeded(state)
  const holes = needed === 1 ? 'חור מנעול אחד' : `${needed} חורי מנעול`
  const have = Math.min(state.keys.length, needed)
  if (keysMissing(state) === 0) return `בקיר יש דלת גדולה עם ${holes}. יש לכם מספיק מפתחות, והדלת נפתחת!`
  return `בקיר יש דלת גדולה עם ${holes}. יש לכם ${have} מתוך ${needed} מפתחות. מפתחות מסתתרים בפינות השקטות של המבוך.`
}

/** Most recent first, with the room each thing happened in. */
export function getJournalView(state: GameState, catalog: Catalog, limit = 8): { room: string; text: string }[] {
  return state.journal
    .slice(-limit)
    .reverse()
    .map((entry) => ({ room: catalog.rooms[entry.roomId]?.title ?? entry.roomId, text: entry.text }))
}

export function getRoomView(state: GameState, catalog: Catalog): RoomView {
  const room = catalog.rooms[state.currentRoomId]
  if (!room) throw new Error(`Unknown room: ${state.currentRoomId}`)
  const needed = room.hint
    ? intelligenceHintThreshold(state.difficulty, room.hint.minIntelligence)
    : Number.POSITIVE_INFINITY
  const showHint = room.hint !== undefined && !state.combat && effectiveAttribute(state, 'intelligence') >= needed
  const monster = room.monsterId ? catalog.monsters[room.monsterId] : undefined
  const returned = (state.roomVisits[room.id] ?? 0) > 1 && !state.combat
  const cleared = monster && state.defeatedMonsters.includes(monster.id)
  let story = textFor(state.ageGroup, room.story)
  if (state.combat && monster) {
    story = textFor(state.ageGroup, monster.description)
    const { monsterHp, monsterMaxHp, round } = state.combat
    if (round === 1 && monsterHp < monsterMaxHp) {
      story += `\n${monster.name} זוכר אתכם מהפעם הקודמת. הוא עדיין פצוע: נשארו לו ${monsterHp} מתוך ${monsterMaxHp} חיים.`
    }
  } else if (returned) {
    story = `אתם שוב כאן, ב${room.title}. ${cleared ? `${monster?.name} כבר לא חוסם את הדרך.` : 'אפשר לבחור דרך אחרת.'}`
  } else if (cleared) {
    story = `${room.title}. ${monster?.name} יושב בצד ונותן לכם לעבור.`
  }
  const byFinalDoor = !state.combat && neighborIds(room.id, catalog, state).includes(catalog.world.exitRoomId)
  if (byFinalDoor) story += `\n${finalDoorText(state)}`
  const memory = state.combat
    ? []
    : state.journal.filter((entry) => entry.roomId === room.id).map((entry) => entry.text)
  return {
    id: room.id,
    type: room.type,
    title: room.title,
    story,
    hint: showHint && room.hint ? textFor(state.ageGroup, room.hint.text) : undefined,
    memory,
    choices: listChoiceViews(state, catalog),
    routeIndex: state.visitedRooms.length,
    routeLength: Object.keys(catalog.rooms).length,
  }
}
