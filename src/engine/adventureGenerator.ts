import type { AdventureLength, PoolId, Room, Segment, WorldConfig } from '../models/types'
import type { Rng } from './random'

type RouteRng = Rng

function draw(ids: string[], rng: RouteRng): string {
  const index = Math.min(ids.length - 1, Math.floor(rng() * ids.length))
  return ids.splice(index, 1)[0]
}

export function generateRoute(
  world: WorldConfig,
  pools: Record<PoolId, string[]>,
  rooms: Record<string, Room>,
  length: AdventureLength,
  rng: RouteRng,
): string[] {
  const template = world.templates[length]
  const used = new Set<string>()
  const route: string[] = []

  for (const segment of template) {
    const ids = segmentIds(segment, pools, used, rng)
    for (const id of ids) {
      if (used.has(id)) continue
      if (!rooms[id]) {
        throw new Error(`Missing room: ${id}`)
      }
      used.add(id)
      route.push(id)
    }
  }

  if (route[0] !== world.startRoomId || route[route.length - 1] !== world.exitRoomId) {
    throw new Error('Route must start at the opening and end at the exit')
  }
  return route
}

function segmentIds(
  segment: Segment,
  pools: Record<PoolId, string[]>,
  used: Set<string>,
  rng: RouteRng,
): string[] {
  if (segment.kind === 'fixed') return [segment.roomId]
  const available = pools[segment.pool].filter((id) => !used.has(id))
  const picked: string[] = []
  const copy = [...available]
  for (let i = 0; i < segment.count && copy.length > 0; i += 1) {
    picked.push(draw(copy, rng))
  }
  return picked
}
