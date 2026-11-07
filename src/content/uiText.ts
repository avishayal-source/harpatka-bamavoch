import type { AdventureLength, AgeGroup, AttributeKey, Difficulty, RoomType } from '../models/types'

export const gameTitle = 'אבן האש'

export const copyrightLine = '© 2026 אבישי אלפנדרי. כל הזכויות שמורות.'

export const privacyLine = 'המשחק לא אוסף מידע אישי. ההתקדמות נשמרת רק בדפדפן שלכם, במכשיר הזה.'

export const attributeMeta: { key: AttributeKey; label: string; icon: string }[] = [
  { key: 'strength', label: 'כוח', icon: '💪' },
  { key: 'intelligence', label: 'חכמה', icon: '🧠' },
  { key: 'agility', label: 'זריזות', icon: '🏃' },
  { key: 'magic', label: 'קסם', icon: '✨' },
  { key: 'charisma', label: 'כריזמה', icon: '🗣️' },
]

export const classEmoji = {
  WARRIOR: '⚔️',
  WIZARD: '🔮',
  THIEF: '🗝️',
  ELF: '🍃',
  DWARF: '🔨',
} as const

export const roomTypeLabel: Record<RoomType, string> = {
  START: 'פתיחה',
  NORMAL: 'מסדרון',
  COMBAT: 'אתגר',
  TRAP: 'מלכודת',
  TREASURE: 'אוצר',
  HEALING: 'מנוחה',
  PUZZLE: 'חידה',
  CHARACTER: 'מפגש',
  MAGIC: 'קסם',
  CHOICE: 'בחירה',
  SHOP: 'חנות',
  EXIT: 'יציאה',
}

export const ageOptions: { id: AgeGroup; label: string; detail: string }[] = [
  { id: '6-7', label: '6–7', detail: 'סיפור קצר ומילים פשוטות' },
  { id: '8-9', label: '8–9', detail: 'קצת יותר אווירה' },
  { id: '10-12', label: '10–12', detail: 'יותר פרטים, מסתורין והומור' },
]

export const difficultyOptions: { id: Difficulty; label: string; detail: string }[] = [
  { id: 'easy', label: 'קל', detail: 'פחות נזק, בדיקות קלות יותר, ויותר ריפוי' },
  { id: 'normal', label: 'רגיל', detail: 'הרפתקה מאוזנת' },
  { id: 'brave', label: 'אמיץ', detail: 'בדיקות קשות יותר, יותר נזק, יותר אוצר, ועוד מפתח לדלת היציאה (עד 3)' },
]

export const lengthOptions: { id: AdventureLength; label: string; detail: string }[] = [
  { id: 'short', label: 'הרפתקה קצרה', detail: 'מחפשים את היציאה, ואפשר גם לחזור אחורה' },
  { id: 'long', label: 'הרפתקה ארוכה', detail: 'אותו מבוך. שווה להסתובב ולאסוף אוצר' },
]

export const feedbackHeading = {
  good: 'הצלחתם!',
  bad: 'אוי!',
  neutral: 'לא הפעם',
  'second-chance': 'נפלתם!',
} as const

export const secondChanceBody =
  'אבל בדיוק בזמן מצאתם שיקוי חירום בתיק.\nההרפתקה עדיין לא הסתיימה.'

export const gameOver = {
  title: 'ההרפתקה הסתיימה הפעם...',
  again: 'בפעם הבאה אולי דרך אחרת תוביל אתכם אל היציאה!',
}

export const victoryTitle = 'הצלחתם לצאת מהמבוך!'
