import { describe, expect, it } from 'vitest'
import { classOrder, classes } from '../data/characters'
import { weaponsForClass } from '../data/weapons'
import { generateRoute } from '../engine/adventureGenerator'
import { scaleHpChange, scaleTreasure } from '../engine/adjustments'
import {
  acknowledgeFeedback,
  combatAction,
  createNewGame,
  getRoomView,
  listChoiceViews,
  resolveChoice,
  rollAttribute,
  rollCharacter,
  scoreGame,
} from '../engine/gameEngine'
import { moveTo } from '../engine/movement'
import { createRng } from '../engine/random'
import type { Attributes, Catalog, CharacterClass, GameState, Room } from '../models/types'
import { parseSave, serializeSave } from '../storage/saveGame'
import { rooms } from '../worlds/lostFortress/rooms'
import { catalog } from '../game/catalog'

const line = { young: 'קצר', medium: 'בינוני יותר', older: 'משפט ארוך עם יותר פרטים על מה שקרה בחדר.' }

function maxAttributes(classId: CharacterClass): Attributes {
  const ranges = classes[classId].ranges
  return {
    strength: ranges.strength[1],
    intelligence: ranges.intelligence[1],
    agility: ranges.agility[1],
    magic: ranges.magic[1],
    charisma: ranges.charisma[1],
  }
}

function newGame(classId: CharacterClass, extra?: Partial<GameState>): GameState {
  const state = createNewGame(
    {
      classId,
      attributes: maxAttributes(classId),
      weaponId: weaponsForClass(classId)[0].id,
      ageGroup: '8-9',
      difficulty: 'normal',
      adventureLength: 'short',
      seed: 1,
    },
    catalog,
  )
  return { ...state, ...extra, character: extra?.character ?? state.character }
}

function atRoom(classId: CharacterClass, roomId: string, extra?: Partial<GameState>): GameState {
  const state = newGame(classId)
  const routeIndex = state.plannedRoute.indexOf(roomId)
  return {
    ...state,
    ...extra,
    character: extra?.character ?? state.character,
    currentRoomId: roomId,
    routeIndex: routeIndex >= 0 ? routeIndex : state.routeIndex,
    visitedRooms: [...new Set([...state.visitedRooms, roomId])],
    magicPoints: extra?.magicPoints ?? state.maxMagicPoints,
  }
}

describe('character generation', () => {
  it('stays inside each class range', () => {
    const rng = createRng(7)
    for (const classId of classOrder) {
      for (let i = 0; i < 40; i += 1) {
        const rolled = rollCharacter(classId, catalog, rng)
        for (const [key, range] of Object.entries(classes[classId].ranges)) {
          const value = rolled.attributes[key as keyof Attributes]
          expect(value).toBeGreaterThanOrEqual(range[0])
          expect(value).toBeLessThanOrEqual(range[1])
        }
        expect(rolled.maxHp).toBe(classes[classId].hp)
        expect(rolled.maxMagicPoints).toBe(classes[classId].magicPoints)
      }
    }
  })

  it('gives warriors, thieves, and dwarves no magic points', () => {
    for (const classId of ['WARRIOR', 'THIEF', 'DWARF'] as const) {
      expect(rollAttribute(0, 0, () => 0.9)).toBe(0)
      expect(classes[classId].magicPoints).toBe(0)
    }
  })

  it('rejects a weapon from another class', () => {
    expect(() =>
      createNewGame(
        {
          classId: 'WIZARD',
          attributes: maxAttributes('WIZARD'),
          weaponId: 'warrior-sword',
          ageGroup: '10-12',
          difficulty: 'easy',
          adventureLength: 'short',
          seed: 2,
        },
        catalog,
      ),
    ).toThrow(/Weapon/)
  })
})

describe('adventure route', () => {
  it('builds a short loop through every slice room', () => {
    const route = generateRoute(catalog.world, catalog.pools, catalog.rooms, 'short', () => 0)
    expect(route).toHaveLength(9)
    expect(route[0]).toBe('start')
    expect(route.at(-1)).toBe('exit')
    expect(new Set(route).size).toBe(route.length)
    expect(route).toEqual([
      'start',
      'corridor',
      'stone-guardian',
      'hall',
      'floor-trap',
      'glow-fountain',
      'coin-chest',
      'fork',
      'exit',
    ])
  })

  it('puts the long route’s exploration before the midpoint and skips empty pools', () => {
    const route = generateRoute(catalog.world, catalog.pools, catalog.rooms, 'long', () => 0)
    const hall = route.indexOf('hall')
    expect(route.indexOf('corridor')).toBeLessThan(hall)
    expect(route.indexOf('fork')).toBeLessThan(hall)
    expect(route).not.toContain(undefined)
    expect(route.at(-1)).toBe('exit')
  })

  it('can swap the order of exploration rooms', () => {
    const first = generateRoute(catalog.world, catalog.pools, catalog.rooms, 'short', () => 0)[1]
    const other = generateRoute(catalog.world, catalog.pools, catalog.rooms, 'short', () => 0.999)[1]
    expect(first).not.toBe(other)
  })
})

describe('choices', () => {
  it('shows the room choices plus a way into every connected corridor', () => {
    for (const classId of classOrder) {
      for (const room of Object.values(rooms)) {
        if (room.x === undefined) continue
        const views = listChoiceViews(atRoom(classId, room.id), catalog)
        const story = views.filter((choice) => !choice.id.startsWith('move:'))
        const exits = views.filter((choice) => choice.id.startsWith('move:'))
        expect(story.length).toBeLessThanOrEqual(4)
        expect(exits.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('hides other classes’ door solutions', () => {
    const views = listChoiceViews(atRoom('THIEF', 'corridor'), catalog).map((choice) => choice.id)
    expect(views).toContain('corridor-thief')
    expect(views).toContain('corridor-around')
    expect(views).not.toContain('corridor-warrior')
    expect(views).not.toContain('corridor-wizard')
  })

  it('disables a spell when magic points are short', () => {
    const views = listChoiceViews(atRoom('WIZARD', 'corridor', { magicPoints: 1 }), catalog)
    const spell = views.find((choice) => choice.id === 'corridor-wizard')
    expect(spell?.enabled).toBe(false)
    expect(() => resolveChoice(atRoom('WIZARD', 'corridor', { magicPoints: 1 }), 'corridor-wizard', catalog)).toThrow(
      /Disabled/,
    )
  })

  it('reveals the statue’s drawer only after a successful talk', () => {
    expect(listChoiceViews(atRoom('ELF', 'coin-chest'), catalog).some((choice) => choice.id === 'chest-drawer')).toBe(
      false,
    )
    const trusted = listChoiceViews(atRoom('ELF', 'coin-chest', { decisions: ['statue-trust'] }), catalog).filter(
      (choice) => !choice.id.startsWith('move:'),
    )
    expect(trusted.some((choice) => choice.id === 'chest-drawer')).toBe(true)
    expect(trusted.length).toBeLessThanOrEqual(4)
  })

  it('applies a low-health penalty to strength', () => {
    const wounded = atRoom('WARRIOR', 'corridor', { hp: 5 })
    wounded.character = {
      ...wounded.character,
      attributes: { ...wounded.character.attributes, strength: 7 },
    }
    const failed = resolveChoice(wounded, 'corridor-warrior', catalog)
    expect(failed.pendingFeedback?.success).toBe(false)
    expect(failed.hp).toBeLessThan(5)

    const healthy = atRoom('WARRIOR', 'corridor', { hp: 22 })
    healthy.character = {
      ...healthy.character,
      attributes: { ...healthy.character.attributes, strength: 7 },
    }
    expect(resolveChoice(healthy, 'corridor-warrior', catalog).pendingFeedback?.success).toBe(true)
  })

  it('fights with dice, and a strong hit beats a weak defense', () => {
    const warrior = moveTo(moveTo(moveTo(moveTo(newGame('WARRIOR'), 'corridor', catalog), 'hall', catalog), 'coin-chest', catalog), 'stone-guardian', catalog)
    expect(warrior.combat?.monsterId).toBe('stone-guardian')
    const hit = combatAction(warrior, 'strike', catalog, { player: 6, foe: 1, counterPlayer: 6, counterFoe: 1 })
    expect(hit.pendingFeedback?.dice?.[0]?.result).toContain('פגעתם')
    expect(hit.combat?.monsterHp).toBeLessThan(warrior.combat?.monsterHp ?? 0)
  })

  it('treats the wizard shield as defense, not a missed attack', () => {
    const wizard = moveTo(newGame('WIZARD'), 'watchtower', catalog)
    const shielded = combatAction(wizard, 'skill', catalog, { player: 1, foe: 6, counterPlayer: 6, counterFoe: 1 })
    expect(shielded.pendingFeedback?.message).toContain('מגן האור')
    expect(shielded.pendingFeedback?.tone).toBe('good')
    expect(shielded.magicPoints).toBe(wizard.magicPoints - 1)
    expect(shielded.combat?.monsterHp).toBe(wizard.combat?.monsterHp)
  })
})

describe('consequences', () => {
  it('scales damage and treasure, and never heals past max', () => {
    expect(scaleHpChange(-4, 'easy')).toBe(-3)
    expect(scaleHpChange(-4, 'normal')).toBe(-4)
    expect(scaleHpChange(-4, 'brave')).toBe(-5)
    expect(scaleTreasure(10, 'brave')).toBe(13)

    const brave = atRoom('WARRIOR', 'coin-chest', { difficulty: 'brave' })
    const looted = resolveChoice(brave, 'chest-coins', catalog)
    expect(looted.treasure).toBe(13)

    const full = atRoom('WIZARD', 'glow-fountain', { hp: 14, difficulty: 'easy' })
    expect(resolveChoice(full, 'fountain-drink', catalog).hp).toBe(14)
  })

  it('uses the emergency potion once, then ends the adventure', () => {
    const spike = (id: string): Room => ({
      id,
      type: 'TRAP',
      title: 'בדיקה',
      story: line,
      choices: [
        {
          id: `${id}-hit`,
          label: 'מכה',
          success: { message: line, hpChange: -100, nextRoomId: 'spike-2' },
        },
      ],
    })
    const testCatalog: Catalog = {
      ...catalog,
      rooms: { ...catalog.rooms, spike: spike('spike'), 'spike-2': spike('spike-2') },
    }
    let state = newGame('WIZARD', {
      currentRoomId: 'spike',
      plannedRoute: ['spike', 'spike-2', 'exit'],
      routeIndex: 0,
      hp: 20,
      maxHp: 20,
    })
    state = resolveChoice(state, 'spike-hit', testCatalog)
    expect(state.phase).toBe('feedback')
    expect(state.pendingFeedback?.secondChanceUsed).toBe(true)
    expect(state.secondChanceAvailable).toBe(false)
    expect(state.hp).toBe(7)

    state = acknowledgeFeedback(state)
    expect(state.currentRoomId).toBe('spike-2')
    expect(state.phase).toBe('playing')

    state = resolveChoice(state, 'spike-2-hit', testCatalog)
    expect(state.phase).toBe('gameover')
    expect(state.hp).toBe(0)
  })

  it('keeps one hit smaller than the least health in the game', () => {
    for (const room of Object.values(rooms)) {
      for (const choice of room.choices) {
        for (const outcome of [choice.success, choice.failure]) {
          if (!outcome?.hpChange || outcome.hpChange >= 0) continue
          expect(Math.abs(scaleHpChange(outcome.hpChange, 'brave'))).toBeLessThan(14)
        }
      }
    }
  })

  it('scores treasure, health, exploration, and difficulty', () => {
    const state = newGame('DWARF', {
      treasure: 120,
      hp: 15,
      maxHp: 22,
      roomsCompleted: 10,
      difficulty: 'brave',
    })
    expect(scoreGame(state)).toEqual({
      treasure: 120,
      healthBonus: 14,
      explorationBonus: 20,
      difficultyBonus: 25,
      total: 179,
    })
  })
})

describe('story text and saves', () => {
  it('gives younger players a shorter story', () => {
    for (const room of Object.values(rooms)) {
      expect(room.story.young.length).toBeLessThan(room.story.older.length)
      if (room.type !== 'COMBAT') expect(room.choices.length).toBeGreaterThanOrEqual(2)
    }
    const young = getRoomView(newGame('ELF', { ageGroup: '6-7' }), catalog)
    const older = getRoomView(newGame('ELF', { ageGroup: '10-12' }), catalog)
    expect(young.story.length).toBeLessThan(older.story.length)
  })

  it('shows an intelligence hint on easy and hides it when the check fails', () => {
    const clever = atRoom('WIZARD', 'corridor')
    expect(getRoomView(clever, catalog).hint).toBeTruthy()

    const warrior = atRoom('WARRIOR', 'corridor')
    warrior.character = {
      ...warrior.character,
      attributes: { ...warrior.character.attributes, intelligence: 4 },
    }
    expect(getRoomView(warrior, catalog).hint).toBeUndefined()

    const helped = { ...warrior, difficulty: 'easy' as const }
    helped.character = {
      ...helped.character,
      attributes: { ...helped.character.attributes, intelligence: 6 },
    }
    expect(getRoomView(helped, catalog).hint).toBeTruthy()
  })

  it('round-trips a resumable game and rejects a finished one', () => {
    const state = newGame('ELF')
    const restored = parseSave(serializeSave(state), catalog)
    expect(restored?.currentRoomId).toBe(state.currentRoomId)
    expect(restored?.plannedRoute).toEqual(state.plannedRoute)
    expect(parseSave('not json', catalog)).toBeNull()
    expect(parseSave(serializeSave({ ...state, phase: 'victory' }), catalog)).toBeNull()
  })
})

describe('the fortress maze', () => {
  it('lets you walk forward and back, and remembers the corridor', () => {
    let state = moveTo(newGame('WARRIOR'), 'corridor', catalog)
    expect(state.currentRoomId).toBe('corridor')
    expect(state.cameFromRoomId).toBe('start')
    expect(state.discoveredEdges).toContain('corridor|start')
    state = moveTo(state, 'start', catalog)
    expect(state.currentRoomId).toBe('start')
    expect(state.visitedRooms).toEqual(['start', 'corridor'])
    const back = listChoiceViews(state, catalog).find((choice) => choice.id === 'move:corridor')
    expect(back?.label).toContain('חזרה')
  })

  it('starts a fight when you enter a monster room and lets you run home', () => {
    let state = moveTo(newGame('THIEF'), 'watchtower', catalog)
    expect(state.combat?.monsterId).toBe('stone-bat')
    expect(listChoiceViews(state, catalog)).toHaveLength(0)
    state = combatAction(state, 'flee', catalog, { player: 6, foe: 1 })
    state = acknowledgeFeedback(state)
    expect(state.currentRoomId).toBe('start')
    expect(state.combat).toBeNull()
  })

  it('can be won by walking to the exit and beating the guardian', () => {
    let state = newGame('WIZARD')
    for (const roomId of ['corridor', 'hall', 'coin-chest', 'stone-guardian']) {
      state = moveTo(state, roomId, catalog)
    }
    for (let guard = 0; state.combat && guard < 8; guard += 1) {
      state = combatAction(state, 'strike', catalog, { player: 6, foe: 1, counterPlayer: 6, counterFoe: 1 })
      expect(state.phase).toBe('feedback')
      state = acknowledgeFeedback(state)
    }
    expect(state.defeatedMonsters).toContain('stone-guardian')
    state = moveTo(state, 'exit', catalog)
    state = resolveChoice(state, 'exit-leave', catalog)
    expect(state.phase).toBe('victory')
    expect(state.treasure).toBeGreaterThan(0)
  })
})
