import { mazeLayout } from '../maze'
import { moreRooms } from './moreRooms'
import { sliceRooms } from './sliceRooms'
import type { Room } from '../../../models/types'

export { sliceRooms } from './sliceRooms'
export { moreRooms } from './moreRooms'

export const rooms: Record<string, Room> = Object.fromEntries(
  [...sliceRooms, ...moreRooms].map((room) => {
    const spot = mazeLayout[room.id]
    if (!spot) return [room.id, room]
    return [room.id, { ...room, x: spot.x, y: spot.y, mapLabel: spot.mapLabel, monsterId: spot.monsterId }]
  }),
)
