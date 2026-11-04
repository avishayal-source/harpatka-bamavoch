import type { WorldConfig } from '../../models/types'

export const lostFortressWorld: WorldConfig = {
  id: 'lost-fortress',
  title: 'מבוך המצודה האבודה',
  description: 'מצודה עתיקה של מסדרונות, מערות, אולמות, אוצרות ויצורים מוזרים.',
  startRoomId: 'start',
  exitRoomId: 'exit',
  templates: {
    short: [
      { kind: 'fixed', roomId: 'start' },
      { kind: 'pool', pool: 'exploration', count: 1 },
      { kind: 'pool', pool: 'combat', count: 1 },
      { kind: 'fixed', roomId: 'hall' },
      { kind: 'pool', pool: 'trap', count: 1 },
      { kind: 'pool', pool: 'healing', count: 1 },
      { kind: 'pool', pool: 'treasure', count: 1 },
      { kind: 'pool', pool: 'exploration', count: 1 },
      { kind: 'fixed', roomId: 'exit' },
    ],
    long: [
      { kind: 'fixed', roomId: 'start' },
      { kind: 'pool', pool: 'exploration', count: 1 },
      { kind: 'pool', pool: 'combat', count: 1 },
      { kind: 'pool', pool: 'exploration', count: 1 },
      { kind: 'fixed', roomId: 'hall' },
      { kind: 'pool', pool: 'trap', count: 1 },
      { kind: 'pool', pool: 'healing', count: 1 },
      { kind: 'pool', pool: 'puzzle', count: 1 },
      { kind: 'pool', pool: 'treasure', count: 1 },
      { kind: 'pool', pool: 'magic', count: 1 },
      { kind: 'pool', pool: 'character', count: 1 },
      { kind: 'pool', pool: 'exploration', count: 1 },
      { kind: 'fixed', roomId: 'exit' },
    ],
  },
}
