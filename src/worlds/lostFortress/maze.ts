import type { MazeLink } from '../../models/types'

/**
 * Fixed fortress map. North is up (smaller y). Add a room here when a new idea gets a place.
 *
 *  x:   0          1            2           3            4            5
 *  y0:             מגדל ─────── שער ─────── חצר ········ באר
 *                   │            │           │            ┊
 *  y1:  מטבח ───── נשק          דלת         פרשה ─────── מתפתל ────── מדרגות
 *       │           │            │           │            │
 *  y2:  חנות ───── מלכודת ───── אולם ────── מזרקה        לולייני ──── טרול
 *                   │            │           │            │
 *  y3:  הד ─────── גובלין ───── ארגז        ספרייה ───── מרתף
 *                   │            │           ┊            │
 *  y4:             מנהרה ······ צר          כספת         פטריות
 *                                │           │
 *  y5:                          שומר ─────── גשר
 *                                🔒
 *  y6:                          יציאה
 *
 *  Dotted lines are secret doors. Dead ends: באר, מדרגות, הד, מנהרה, פטריות, טרול.
 *  Shops: חנות (the minotaur) and טרול. The door from שומר to יציאה needs keys.
 */
export const mazeLayout: Record<string, { x: number; y: number; mapLabel: string; monsterId?: string }> = {
  watchtower: { x: 1, y: 0, mapLabel: 'מגדל', monsterId: 'stone-bat' },
  start: { x: 2, y: 0, mapLabel: 'שער' },
  'torch-court': { x: 3, y: 0, mapLabel: 'חצר' },
  well: { x: 4, y: 0, mapLabel: 'באר' },
  kitchen: { x: 0, y: 1, mapLabel: 'מטבח' },
  armory: { x: 1, y: 1, mapLabel: 'נשק' },
  corridor: { x: 2, y: 1, mapLabel: 'דלת' },
  fork: { x: 3, y: 1, mapLabel: 'פרשה' },
  'winding-hall': { x: 4, y: 1, mapLabel: 'מתפתל' },
  'collapsed-stair': { x: 5, y: 1, mapLabel: 'מדרגות' },
  'minotaur-shop': { x: 0, y: 2, mapLabel: 'חנות' },
  'floor-trap': { x: 1, y: 2, mapLabel: 'מלכודת' },
  hall: { x: 2, y: 2, mapLabel: 'אולם' },
  'glow-fountain': { x: 3, y: 2, mapLabel: 'מזרקה' },
  'spiral-stair': { x: 4, y: 2, mapLabel: 'לולייני' },
  'troll-shop': { x: 5, y: 2, mapLabel: 'טרול' },
  'echo-room': { x: 0, y: 3, mapLabel: 'הד' },
  goblin: { x: 1, y: 3, mapLabel: 'גובלין', monsterId: 'dust-goblin' },
  'coin-chest': { x: 2, y: 3, mapLabel: 'ארגז' },
  library: { x: 3, y: 3, mapLabel: 'ספרייה' },
  'flooded-cellar': { x: 4, y: 3, mapLabel: 'מרתף', monsterId: 'rust-crab' },
  'dwarf-tunnel': { x: 1, y: 4, mapLabel: 'מנהרה' },
  'narrow-pass': { x: 2, y: 4, mapLabel: 'צר' },
  'secret-vault': { x: 3, y: 4, mapLabel: 'כספת' },
  'mushroom-cave': { x: 4, y: 4, mapLabel: 'פטריות' },
  'stone-guardian': { x: 2, y: 5, mapLabel: 'שומר', monsterId: 'stone-guardian' },
  'mist-bridge': { x: 3, y: 5, mapLabel: 'גשר', monsterId: 'mist-wolf' },
  exit: { x: 2, y: 6, mapLabel: 'יציאה' },
}

export const mazeLinks: MazeLink[] = [
  { a: 'start', b: 'watchtower' },
  { a: 'start', b: 'torch-court' },
  { a: 'start', b: 'corridor' },
  { a: 'torch-court', b: 'well' },
  { a: 'torch-court', b: 'fork' },
  { a: 'well', b: 'winding-hall', hidden: true },
  { a: 'watchtower', b: 'armory' },
  { a: 'armory', b: 'kitchen' },
  { a: 'armory', b: 'floor-trap' },
  { a: 'kitchen', b: 'minotaur-shop' },
  { a: 'minotaur-shop', b: 'floor-trap' },
  { a: 'spiral-stair', b: 'troll-shop' },
  { a: 'corridor', b: 'hall' },
  { a: 'fork', b: 'winding-hall' },
  { a: 'fork', b: 'glow-fountain' },
  { a: 'winding-hall', b: 'collapsed-stair' },
  { a: 'winding-hall', b: 'spiral-stair' },
  { a: 'floor-trap', b: 'hall' },
  { a: 'floor-trap', b: 'goblin' },
  { a: 'hall', b: 'glow-fountain' },
  { a: 'hall', b: 'coin-chest' },
  { a: 'glow-fountain', b: 'library' },
  { a: 'spiral-stair', b: 'flooded-cellar' },
  { a: 'goblin', b: 'echo-room' },
  { a: 'goblin', b: 'coin-chest' },
  { a: 'goblin', b: 'dwarf-tunnel' },
  { a: 'coin-chest', b: 'narrow-pass' },
  { a: 'library', b: 'flooded-cellar' },
  { a: 'library', b: 'secret-vault', hidden: true },
  { a: 'flooded-cellar', b: 'mushroom-cave' },
  { a: 'dwarf-tunnel', b: 'narrow-pass', hidden: true },
  { a: 'narrow-pass', b: 'stone-guardian' },
  { a: 'secret-vault', b: 'mist-bridge' },
  { a: 'stone-guardian', b: 'mist-bridge' },
  { a: 'stone-guardian', b: 'exit' },
]
