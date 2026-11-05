import type { Catalog, GameState, MapView, MazeLink, Room } from '../models/types'

export function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/** Corridors you can use: every normal one, plus secret doors already found. */
export function openLinks(catalog: Catalog, state?: Pick<GameState, 'foundDoors'>): MazeLink[] {
  return catalog.links.filter((link) => !link.hidden || (state?.foundDoors.includes(edgeKey(link.a, link.b)) ?? false))
}

export function neighborIds(roomId: string, catalog: Catalog, state?: Pick<GameState, 'foundDoors'>): string[] {
  const ids = new Set<string>()
  for (const link of openLinks(catalog, state)) {
    if (link.a === roomId) ids.add(link.b)
    if (link.b === roomId) ids.add(link.a)
  }
  return [...ids]
}

export function isSecretLink(catalog: Catalog, a: string, b: string): boolean {
  return catalog.links.some((link) => link.hidden && edgeKey(link.a, link.b) === edgeKey(a, b))
}

export function directionWord(from: Room, to: Room): string {
  const dx = (to.x ?? 0) - (from.x ?? 0)
  const dy = (to.y ?? 0) - (from.y ?? 0)
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'מזרחה' : 'מערבה'
  if (dy > 0) return 'דרומה'
  return 'צפונה'
}

/** Traps and barrier rooms keep every way but the way back shut until you try one of their choices. */
export function exitBlocked(state: GameState, catalog: Catalog, toRoomId: string): boolean {
  const room = catalog.rooms[state.currentRoomId]
  if (!room || (room.type !== 'TRAP' && !room.barrier)) return false
  if (toRoomId === state.cameFromRoomId) return false
  if (room.choices.length === 0) return false
  return !room.choices.some((choice) => state.resolvedChoices.includes(choice.id))
}

export function getMapView(state: GameState, catalog: Catalog): MapView {
  const placed = Object.values(catalog.rooms).filter((room) => room.x !== undefined && room.y !== undefined)
  const minX = Math.min(...placed.map((room) => room.x ?? 0))
  const minY = Math.min(...placed.map((room) => room.y ?? 0))
  const maxX = Math.max(...placed.map((room) => room.x ?? 0))
  const maxY = Math.max(...placed.map((room) => room.y ?? 0))
  const visited = new Set(state.visitedRooms)
  const seen = new Set(state.visitedRooms)
  for (const roomId of state.visitedRooms) {
    for (const neighbor of neighborIds(roomId, catalog, state)) seen.add(neighbor)
  }

  const rooms = placed.flatMap((room) => {
    if (!seen.has(room.id)) return []
    const kind = room.id === state.currentRoomId ? 'here' : visited.has(room.id) ? 'visited' : 'seen'
    const monster =
      room.monsterId && visited.has(room.id)
        ? state.defeatedMonsters.includes(room.monsterId)
          ? ('beaten' as const)
          : ('alive' as const)
        : undefined
    return [
      {
        id: room.id,
        x: room.x ?? 0,
        y: room.y ?? 0,
        label: kind === 'seen' ? '?' : (room.mapLabel ?? room.title),
        kind: kind as MapView['rooms'][number]['kind'],
        monster,
      },
    ]
  })

  const corridors = openLinks(catalog, state).flatMap((link) => {
    const walked = state.discoveredEdges.includes(edgeKey(link.a, link.b))
    const visible = visited.has(link.a) || visited.has(link.b)
    if (!visible) return []
    return [{ a: link.a, b: link.b, walked, secret: link.hidden === true }]
  })

  return {
    rooms,
    corridors,
    minX,
    minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}
