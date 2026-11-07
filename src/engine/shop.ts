import type { Catalog, ChoiceView, DiceLine, GameState, ShopState } from '../models/types'
import { weaponDamage } from './combat'
import { MAX_DISCOUNT, shopState } from './gear'
import { rollDie } from './random'
import { effectiveAttribute } from './requirementEvaluator'
import { applyVitals } from './vitals'

export const HAGGLE = 'shop:haggle'
export const HIT_SELLER = 'shop:hit'

const HAGGLE_STEP = 10
const HAGGLE_TRIES = 2
/** After a failed hit, prices go up by half. */
const HIT_MARKUP = -50
const HIT_PRIZE = 20
/** Seller's edge on a d10 against yours: you need to beat it by 6 or more, exactly 1 roll in 10. */
const HIT_EDGE = 5

export interface ForcedShopRolls {
  player: number
  foe: number
}

export function shopActions(state: GameState, catalog: Catalog): ChoiceView[] {
  const room = catalog.rooms[state.currentRoomId]
  if (!room?.seller || state.combat) return []
  const { name } = room.seller
  const shop = shopState(state, room.id)
  const views: ChoiceView[] = []
  if (!shop.haggleClosed) {
    const atCap = shop.discount >= MAX_DISCOUNT
    const now = shop.discount > 0 ? ` · עכשיו ${shop.discount}% הנחה` : ''
    views.push({
      id: HAGGLE,
      label: `מתמקחים עם ${name} (כריזמה)${now}`,
      enabled: !atCap,
      reason: atCap ? `${name} כבר הוריד כמה שהוא מוכן` : undefined,
    })
  }
  if (!shop.hitTried) views.push({ id: HIT_SELLER, label: `מכים את ${name} (קשה מאוד)`, enabled: true })
  return views
}

export function haggle(state: GameState, catalog: Catalog, forced?: ForcedShopRolls): GameState {
  const { room, seller, shop } = shopContext(state, catalog)
  if (shop.haggleClosed || shop.discount >= MAX_DISCOUNT) throw new Error('No more haggling here')

  let diceState = state.diceState || 1
  const roll = (fixed?: number) => {
    if (fixed !== undefined) return fixed
    const rolled = rollDie(diceState)
    diceState = rolled.diceState
    return rolled.roll
  }
  const you = side(roll(forced?.player), effectiveAttribute(state, 'charisma'), 'כריזמה')
  const foe = side(roll(forced?.foe), seller.stubbornness, 'עקשנות')

  let next: ShopState
  let message: string
  let result: string
  const won = you.total > foe.total
  if (won) {
    const discount = Math.min(MAX_DISCOUNT, shop.discount + HAGGLE_STEP)
    next = { ...shop, discount }
    result = `המחיר ירד: ${discount}% הנחה`
    message =
      discount >= MAX_DISCOUNT
        ? `${seller.name} נאנח ומוריד שוב את המחירים. "זהו! יותר מזה אני לא יכול להוריד," הוא אומר. עכשיו יש לכם ${discount}% הנחה על כל מה שבחנות.`
        : `${seller.name} מגרד בראש, נאנח, ומוריד את המחירים. עכשיו יש לכם ${discount}% הנחה על כל מה שבחנות.`
  } else if (you.total === foe.total) {
    next = shop
    result = 'תיקו: המחיר לא זז'
    message = `${seller.name} מתלבט ארוכות, אבל בסוף משאיר את המחיר כמו שהוא. אפשר לנסות שוב.`
  } else {
    const failedHaggles = shop.failedHaggles + 1
    const closed = failedHaggles >= HAGGLE_TRIES
    next = { ...shop, failedHaggles, haggleClosed: closed }
    result = 'המוכר לא השתכנע'
    message = closed
      ? `${seller.name} מקמט את המצח: "מספיק להתמקח! המחירים נשארים כמו שהם." מעכשיו הוא לא מוכן להתמקח יותר.`
      : `${seller.name} צוחק: "יפה ניסיתם, אבל לא." המחיר לא זז. נשאר לכם עוד ניסיון אחד לפני שהוא יתעצבן.`
  }
  const dice: DiceLine[] = [{ title: 'מיקוח', you, foe, result }]
  return applyVitals(
    { ...state, diceState, shops: { ...state.shops, [room.id]: next } },
    {
      message,
      success: won,
      dice,
      journal: won ? [{ roomId: room.id, text: `התמקחתם וקיבלתם ${next.discount}% הנחה` }] : undefined,
    },
  )
}

export function hitSeller(state: GameState, catalog: Catalog, forced?: ForcedShopRolls): GameState {
  const { room, seller, shop } = shopContext(state, catalog)
  if (shop.hitTried) throw new Error('Already tried')

  let diceState = state.diceState || 1
  const roll = (fixed?: number) => {
    if (fixed !== undefined) return fixed
    const rolled = rollDie(diceState, 10)
    diceState = rolled.diceState
    return rolled.roll
  }
  const power = effectiveAttribute(state, 'strength') + weaponDamage(state, catalog)
  const you = side(roll(forced?.player), power, 'כוח וכלי נשק')
  const foe = side(roll(forced?.foe), power + HIT_EDGE, 'עור עבה')
  const lucky = you.total > foe.total
  const dice: DiceLine[] = [
    { title: 'המכה במוכר (קוביות של 10)', you, foe, result: lucky ? 'הצלחה נדירה!' : 'המוכר חזק מדי' },
  ]

  if (lucky) {
    return applyVitals(
      {
        ...state,
        diceState,
        shops: { ...state.shops, [room.id]: { ...shop, hitTried: true, haggleClosed: true, discount: MAX_DISCOUNT } },
      },
      {
        treasureDelta: HIT_PRIZE,
        message: `המכה מפתיעה את ${seller.name}, והוא נופל אחורה לתוך ערימת הסחורה. כשהוא קם, הוא נבוך מאוד: "טוב, טוב! קחו ${HIT_PRIZE} מטבעות, ומעכשיו הכול אצלי בהנחה הכי גדולה." דבר כזה קורה רק לעיתים נדירות!`,
        success: true,
        dice,
        journal: [{ roomId: room.id, text: `הכיתם את ${seller.name}, והוא נבהל ונתן לכם מטבעות והנחה` }],
      },
    )
  }
  return applyVitals(
    {
      ...state,
      diceState,
      shops: { ...state.shops, [room.id]: { ...shop, hitTried: true, haggleClosed: true, discount: HIT_MARKUP } },
    },
    {
      hpDelta: -3,
      message: `${seller.name} תופס את היד שלכם בלי מאמץ ודוחף אתכם לאחור. "ככה מתנהגים בחנות?!" הוא כועס, לא מוכן להתמקח יותר, ומעכשיו כל המחירים אצלו יקרים בחצי.`,
      success: false,
      dice,
      journal: [{ roomId: room.id, text: `ניסיתם להכות את ${seller.name}. עכשיו המחירים אצלו יקרים יותר` }],
    },
  )
}

function shopContext(state: GameState, catalog: Catalog) {
  if (state.phase !== 'playing' || state.combat) throw new Error('Not now')
  const room = catalog.rooms[state.currentRoomId]
  if (!room?.seller) throw new Error('No shop here')
  return { room, seller: room.seller, shop: shopState(state, room.id) }
}

function side(die: number, bonus: number, label: string) {
  return { die, bonus, total: die + bonus, label }
}
