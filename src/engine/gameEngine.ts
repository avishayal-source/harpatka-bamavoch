import type {
  Catalog,
  CharacterClass,
  ChoiceView,
  GameState,
  NewGameInput,
  RolledCharacter,
  RoomView,
} from '../models/types'
import { ATTRIBUTE_KEYS } from '../models/types'
import { choiceAccess, effectiveAttribute, intelligenceHintThreshold } from './requirementEvaluator'
import { directionWord, neighborIds, trapBlocks } from './mazeNav'
import { randomSeed, type Rng } from './random'
import { textFor } from './text'

export { acknowledgeFeedback, resolveChoice } from './choiceResolver'
export { combatAction, combatActions, defenseScore } from './combat'
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
    resolvedChoices: [],
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
    if (state.resolvedChoices.includes(choice.id)) return []
    const access = choiceAccess(choice, state)
    if (!access.visible) return []
    return [{ id: choice.id, label: choice.label, enabled: access.enabled, reason: access.reason }]
  })
  return [...story, ...exitChoices(state, catalog)]
}

function exitChoices(state: GameState, catalog: Catalog): ChoiceView[] {
  const here = catalog.rooms[state.currentRoomId]
  if (!here) return []
  return neighborIds(state.currentRoomId, catalog).map((roomId) => {
    const there = catalog.rooms[roomId]
    const blocked = trapBlocks(state, catalog, roomId)
    const way = here.x !== undefined && there?.x !== undefined ? directionWord(here, there) : 'הלאה'
    const back = roomId === state.cameFromRoomId ? 'חזרה ' : ''
    return {
      id: `move:${roomId}`,
      label: `${back}${way} אל ${there?.title ?? roomId}`,
      enabled: !blocked,
      reason: blocked ? 'קודם עוברים את המלכודת, או חוזרים אחורה' : undefined,
    }
  })
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
  if (state.combat && monster) story = textFor(state.ageGroup, monster.description)
  else if (returned) story = `אתם שוב כאן, ב${room.title}. ${cleared ? 'היצור כבר לא חוסם את הדרך.' : 'אפשר לבחור דרך אחרת.'}`
  return {
    id: room.id,
    type: room.type,
    title: room.title,
    story,
    hint: showHint && room.hint ? textFor(state.ageGroup, room.hint.text) : undefined,
    choices: listChoiceViews(state, catalog),
    routeIndex: state.visitedRooms.length,
    routeLength: Object.keys(catalog.rooms).length,
  }
}
