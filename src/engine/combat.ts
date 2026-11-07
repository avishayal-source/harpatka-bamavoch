import type { Catalog, CharacterClass, CombatAction, DiceLine, GameState, Monster } from '../models/types'
import { gearBonus } from './gear'
import { edgeKey } from './mazeNav'
import { effectiveAttribute } from './requirementEvaluator'
import { applyVitals, monsterTuning } from './vitals'

export interface ForcedRolls {
  player: number
  foe: number
  counterPlayer?: number
  counterFoe?: number
}

export interface CombatActionView {
  id: CombatAction
  label: string
  detail: string
  enabled: boolean
  reason?: string
}

const SKILL: Record<CharacterClass, { label: string; detail: string; cost: number }> = {
  WARRIOR: { label: 'מכת כוח', detail: 'מכה חזקה. אם מפספסים, המפלצת מכה חזק יותר.', cost: 0 },
  WIZARD: { label: 'מגן אור', detail: 'בולמים חצי מהמכה בסיבוב הזה.', cost: 1 },
  THIEF: { label: 'מכה מהצל', detail: 'מכים עם זריזות במקום כוח.', cost: 0 },
  ELF: { label: 'לחש ירח', detail: 'מכה שמערבת קסם וחכמה.', cost: 1 },
  DWARF: { label: 'עמידת אבן', detail: 'מכה יציבה, והמכה שחוזרת כואבת פחות.', cost: 0 },
}

export function defenseScore(state: GameState): number {
  const strength = effectiveAttribute(state, 'strength')
  const agility = effectiveAttribute(state, 'agility')
  const base = Math.max(agility, Math.floor(strength / 2))
  const sturdy = state.character.classId === 'WARRIOR' || state.character.classId === 'DWARF' ? 1 : 0
  return base + sturdy + gearBonus(state, 'defense')
}

export function weaponDamage(state: GameState, catalog: Catalog): number {
  return (catalog.weapons[state.character.weaponId]?.damage ?? 0) + gearBonus(state, 'damage')
}

export function tunedMonster(state: GameState, monster: Monster): Monster {
  const tuned = monsterTuning(state.difficulty, monster.hp, monster.attack)
  return { ...monster, hp: tuned.hp, attack: tuned.attack }
}

export function combatActions(state: GameState): CombatActionView[] {
  const skill = SKILL[state.character.classId]
  const actions: CombatActionView[] = [
    { id: 'strike', label: 'הכה', detail: 'קובייה + כוח + כלי הנשק', enabled: true },
    {
      id: 'skill',
      label: skill.label,
      detail: skill.detail,
      enabled: state.magicPoints >= skill.cost,
      reason: state.magicPoints >= skill.cost ? undefined : `צריך ${skill.cost} נקודות קסם`,
    },
  ]
  if (state.maxMagicPoints > 0) {
    actions.push({
      id: 'spell',
      label: 'כדור אור',
      detail: 'עולה 2 נקודות קסם. קובייה + קסם.',
      enabled: state.magicPoints >= 2,
      reason: state.magicPoints >= 2 ? undefined : 'צריך 2 נקודות קסם',
    })
  }
  actions.push({
    id: 'flee',
    label: 'ברח',
    detail: 'קובייה + זריזות. אם מצליחים, חוזרים לחדר הקודם.',
    enabled: state.cameFromRoomId !== null,
    reason: state.cameFromRoomId ? undefined : 'אין לאן לברוח',
  })
  return actions
}

export function combatAction(
  state: GameState,
  action: CombatAction,
  catalog: Catalog,
  forced?: ForcedRolls,
): GameState {
  if (state.phase !== 'playing' || !state.combat) throw new Error('No active fight')
  const monster = catalog.monsters[state.combat.monsterId]
  if (!monster) throw new Error('Unknown monster')
  const view = tunedMonster(state, monster)
  const picked = combatActions(state).find((item) => item.id === action)
  if (!picked?.enabled) throw new Error('Combat action is not available')

  let diceState = state.diceState || 1
  const draw = () => {
    if (forced) return 0
    const rolled = rollD6(diceState)
    diceState = rolled.diceState
    return rolled.roll
  }
  const playerDie = forced?.player ?? draw()
  const foeDie = forced?.foe ?? draw()
  const counterPlayer = forced?.counterPlayer ?? forced?.player ?? draw()
  const counterFoe = forced?.counterFoe ?? forced?.foe ?? draw()

  const damage = weaponDamage(state, catalog)
  const strength = effectiveAttribute(state, 'strength')
  const agility = effectiveAttribute(state, 'agility')
  const magic = effectiveAttribute(state, 'magic')
  const intelligence = effectiveAttribute(state, 'intelligence')
  const skill = SKILL[state.character.classId]

  if (action === 'flee') {
    const you = side(playerDie, agility, 'זריזות')
    const foe = side(foeDie, view.speed, 'מהירות')
    const escaped = you.total >= foe.total
    const dice: DiceLine[] = [{ title: 'בריחה', you, foe, result: escaped ? 'הצלחתם לברוח' : 'לא הספקתם' }]
    if (escaped && state.cameFromRoomId) {
      const destination = state.cameFromRoomId
      const moved = arrive(state, destination, diceState)
      const left = state.combat.monsterHp
      return applyVitals(moved, {
        message: `הרגליים מהירות מהמפלצת. אתם חוזרים לחדר הקודם, והיא לא רודפת.\n${view.name} נשאר עם ${left} חיים, ויחכה לכם שם.`,
        success: true,
        dice,
        endCombat: true,
        rememberMonster: { id: view.id, hp: left },
        journal: [{ roomId: state.currentRoomId, text: `ברחתם מ${view.name} (נשארו לו ${left} חיים)` }],
      })
    }
    const counter = monsterStrike(state, view, counterPlayer, counterFoe, 0, 0)
    const caught =
      counter.damage > 0
        ? `${view.name} מהיר יותר וחוסם לכם את הדרך. עוד לפני שאתם מגיעים לדלת, הוא פוגע בכם.`
        : `${view.name} מהיר יותר וחוסם לכם את הדרך. הוא מנסה לפגוע בכם ומחטיא, אבל אתם עדיין תקועים בחדר איתו.`
    return applyVitals({ ...state, diceState, combat: nextRound(state) }, {
      hpDelta: counter.damage === 0 ? 0 : -counter.damage,
      message: `הבריחה לא הצליחה.\n${caught}`,
      success: false,
      dice: [...dice, counter.line],
    })
  }

  let attackBonus = strength + damage
  let attackLabel = 'כוח וכלי נשק'
  let magicCost = 0
  let incomingCut = 0
  let missPunish = 0

  if (action === 'spell') {
    attackBonus = magic + 2 + gearBonus(state, 'spell')
    attackLabel = 'קסם'
    magicCost = 2
  } else if (action === 'skill') {
    magicCost = skill.cost
    if (state.character.classId === 'WARRIOR') {
      attackBonus = strength + damage + 3
      attackLabel = 'מכת כוח'
      missPunish = 2
    } else if (state.character.classId === 'WIZARD') {
      attackBonus = 0
      attackLabel = 'מגן'
    } else if (state.character.classId === 'THIEF') {
      attackBonus = agility + damage
      attackLabel = 'זריזות וכלי נשק'
    } else if (state.character.classId === 'ELF') {
      attackBonus = magic + Math.floor(intelligence / 2)
      attackLabel = 'קסם וחכמה'
    } else {
      attackBonus = strength + Math.max(1, damage - 1)
      attackLabel = 'עמידת אבן'
      incomingCut = 2
    }
  }

  const shielding = action === 'skill' && state.character.classId === 'WIZARD'
  const you = side(playerDie, attackBonus, attackLabel)
  const foe = side(foeDie, view.defense, 'שריון')
  const dealt = shielding ? 0 : clash(you.total, foe.total)
  const monsterHp = Math.max(0, state.combat.monsterHp - dealt)
  const dice: DiceLine[] = shielding
    ? []
    : [
        {
          title: 'המכה שלכם',
          you,
          foe,
          result: dealt > 0 ? `פגעתם ב-${dealt}` : 'החטאתם',
        },
      ]

  if (monsterHp <= 0) {
    return applyVitals({ ...state, diceState, combat: { ...state.combat, monsterHp: 0 } }, {
      magicDelta: -magicCost,
      treasureDelta: 5,
      message: `${view.name} מפסיק לחסום את הדרך ומתיישב בצד. על הרצפה נשאר מטבע קטן.`,
      success: true,
      dice,
      endCombat: true,
      defeatMonsterId: view.id,
      journal: [{ roomId: state.currentRoomId, text: `ניצחתם את ${view.name}` }],
    })
  }

  const counter = monsterStrike(state, view, counterPlayer, counterFoe, incomingCut, missPunish > 0 && dealt === 0 ? missPunish : 0)
  let taken = counter.damage
  if (shielding) taken = Math.floor(taken / 2)
  return applyVitals(
    { ...state, diceState, combat: { ...nextRound(state), monsterHp } },
    {
      hpDelta: taken === 0 ? 0 : -taken,
      magicDelta: -magicCost,
      message: `${
        shielding
          ? 'מגן האור עוטף אתכם, והמכה שחוזרת נחתכת לחצי.'
          : dealt > 0
            ? `${view.name} נפגע, ונשארו לו ${monsterHp} חיים.`
            : `${view.name} מתחמק.`
      }\n${counter.text}`,
      success: shielding || dealt > 0,
      dice: [...dice, counter.line],
    },
  )
}

function monsterStrike(
  state: GameState,
  monster: Monster,
  playerDie: number,
  foeDie: number,
  incomingCut: number,
  extraFoeBonus: number,
): { damage: number; text: string; line: DiceLine } {
  const you = side(playerDie, defenseScore(state), 'הגנה')
  const foe = side(foeDie, monster.attack + extraFoeBonus, extraFoeBonus ? 'התקפה חזקה' : 'התקפה')
  const raw = clash(foe.total, you.total, 4)
  const damage = Math.max(0, raw - incomingCut)
  return {
    damage,
    text: damage > 0 ? `${monster.name} פוגע בכם בכבדות.` : `${monster.name} מנסה לפגוע בכם, ואתם זזים בזמן.`,
    line: {
      title: 'המכה של המפלצת',
      you,
      foe,
      result: damage > 0 ? `נפגעתם ב-${damage}` : 'המפלצת החטיאה',
    },
  }
}

function clash(attack: number, defense: number, cap = 6): number {
  if (attack > defense) return Math.min(cap, attack - defense)
  if (attack === defense) return 1
  return 0
}

function side(die: number, bonus: number, label: string) {
  return { die, bonus, total: die + bonus, label }
}

function nextRound(state: GameState): NonNullable<GameState['combat']> {
  if (!state.combat) throw new Error('No fight')
  return { ...state.combat, round: state.combat.round + 1 }
}

function rollD6(diceState: number): { roll: number; diceState: number } {
  const next = (Math.imul(diceState || 1, 1664525) + 1013904223) >>> 0
  const roll = (next % 6) + 1
  return { roll, diceState: next || 1 }
}

function arrive(state: GameState, roomId: string, diceState: number): GameState {
  const from = state.currentRoomId
  const visits = { ...state.roomVisits, [roomId]: (state.roomVisits[roomId] ?? 0) + 1 }
  const edge = edgeKey(from, roomId)
  return {
    ...state,
    diceState,
    currentRoomId: roomId,
    cameFromRoomId: from,
    roomVisits: visits,
    visitedRooms: state.visitedRooms.includes(roomId) ? state.visitedRooms : [...state.visitedRooms, roomId],
    discoveredEdges: state.discoveredEdges.includes(edge) ? state.discoveredEdges : [...state.discoveredEdges, edge],
    roomsCompleted: visits[roomId] === 1 ? state.roomsCompleted + 1 : state.roomsCompleted,
    combat: null,
  }
}

export { SKILL }
