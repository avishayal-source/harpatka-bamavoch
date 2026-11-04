import type { Weapon } from '../models/types'

export const weapons: Record<string, Weapon> = {
  'warrior-sword': {
    id: 'warrior-sword',
    classId: 'WARRIOR',
    name: 'חרב',
    damage: 4,
    description: 'כלי נשק יציב לקרב קרוב.',
  },
  'warrior-spear': {
    id: 'warrior-spear',
    classId: 'WARRIOR',
    name: 'חנית',
    damage: 3,
    description: 'ארוכה וקלה יותר, ופוגעת קצת פחות.',
  },
  'wizard-dagger': {
    id: 'wizard-dagger',
    classId: 'WIZARD',
    name: 'פגיון',
    damage: 2,
    description: 'קטן. מתאים למי שמעדיף קסם על קרב.',
  },
  'wizard-staff': {
    id: 'wizard-staff',
    classId: 'WIZARD',
    name: 'מטה קסם',
    damage: 2,
    description: 'עוזר בקרב כמו פגיון. לא מוסיף נקודות קסם.',
  },
  'thief-dagger': {
    id: 'thief-dagger',
    classId: 'THIEF',
    name: 'פגיון',
    damage: 3,
    description: 'קצר, שקט, ונוח כשצריך לזוז מהר.',
  },
  'thief-axe': {
    id: 'thief-axe',
    classId: 'THIEF',
    name: 'גרזן קטן',
    damage: 3,
    description: 'קל ליד, עם אותה עוצמה כמו הפגיון.',
  },
  'elf-sword': {
    id: 'elf-sword',
    classId: 'ELF',
    name: 'חרב קצרה',
    damage: 3,
    description: 'קלה ומאוזנת, כמו האלף עצמו.',
  },
  'elf-dagger': {
    id: 'elf-dagger',
    classId: 'ELF',
    name: 'פגיון',
    damage: 2,
    description: 'מהיר ושקט, עם פגיעה קטנה יותר.',
  },
  'dwarf-axe': {
    id: 'dwarf-axe',
    classId: 'DWARF',
    name: 'גרזן',
    damage: 4,
    description: 'כבד וחזק. מתאים למי שאוהב מכה אחת טובה.',
  },
  'dwarf-hammer': {
    id: 'dwarf-hammer',
    classId: 'DWARF',
    name: 'פטיש',
    damage: 4,
    description: 'כבד וחזק, טוב נגד אבן.',
  },
}

export function weaponsForClass(classId: Weapon['classId']): Weapon[] {
  return Object.values(weapons).filter((weapon) => weapon.classId === classId)
}
