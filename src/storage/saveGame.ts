import type { Catalog, GameState } from '../models/types'

const SAVE_KEY = 'harpatka-bamavoch-save-v2'

interface SaveFile {
  version: 2
  state: GameState
}

export function serializeSave(state: GameState): string {
  const file: SaveFile = { version: 2, state }
  return JSON.stringify(file)
}

export function parseSave(raw: string, catalog: Catalog): GameState | null {
  try {
    const file = JSON.parse(raw) as Partial<SaveFile>
    if (file.version !== 2 || !file.state) return null
    return isResumable(file.state, catalog) ? file.state : null
  } catch {
    return null
  }
}

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, serializeSave(state))
}

export function loadGame(catalog: Catalog): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return parseSave(raw, catalog)
  } catch {
    return null
  }
}

export function clearGame(): void {
  localStorage.removeItem(SAVE_KEY)
}

export function hasSave(catalog: Catalog): boolean {
  return loadGame(catalog) !== null
}

function isResumable(state: GameState, catalog: Catalog): boolean {
  if (state.phase !== 'playing' && state.phase !== 'feedback') return false
  if (!state.character || !catalog.classes[state.character.classId]) return false
  if (!catalog.weapons[state.character.weaponId]) return false
  if (!catalog.rooms[state.currentRoomId]) return false
  if (!Array.isArray(state.plannedRoute) || state.plannedRoute.length === 0) return false
  if (state.plannedRoute.some((roomId) => !catalog.rooms[roomId])) return false
  if (!Array.isArray(state.visitedRooms) || !Array.isArray(state.discoveredEdges)) return false
  if (!Array.isArray(state.defeatedMonsters) || !Array.isArray(state.resolvedChoices)) return false
  return true
}
