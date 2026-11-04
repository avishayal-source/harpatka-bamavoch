import type { Catalog, GameState } from '../models/types'
import { edgeKey, neighborIds, trapBlocks } from './mazeNav'
import { monsterTuning } from './vitals'

export function moveTo(state: GameState, roomId: string, catalog: Catalog): GameState {
  if (state.phase !== 'playing') throw new Error('not playing')
  if (state.combat) throw new Error('in combat')
  if (!neighborIds(state.currentRoomId, catalog).includes(roomId)) throw new Error('not connected')
  if (trapBlocks(state, catalog, roomId)) throw new Error('trap blocks this way')

  const from = state.currentRoomId
  const visits = { ...state.roomVisits, [roomId]: (state.roomVisits[roomId] ?? 0) + 1 }
  const edge = edgeKey(from, roomId)
  const next: GameState = {
    ...state,
    currentRoomId: roomId,
    cameFromRoomId: from,
    roomVisits: visits,
    visitedRooms: state.visitedRooms.includes(roomId) ? state.visitedRooms : [...state.visitedRooms, roomId],
    discoveredEdges: state.discoveredEdges.includes(edge) ? state.discoveredEdges : [...state.discoveredEdges, edge],
    roomsCompleted: visits[roomId] === 1 ? state.roomsCompleted + 1 : state.roomsCompleted,
    routeIndex: state.visitedRooms.includes(roomId) ? state.routeIndex : state.visitedRooms.length,
  }
  return beginFight(next, catalog)
}

export function beginFight(state: GameState, catalog: Catalog): GameState {
  const room = catalog.rooms[state.currentRoomId]
  if (!room?.monsterId || state.defeatedMonsters.includes(room.monsterId) || state.combat) return state
  const monster = catalog.monsters[room.monsterId]
  if (!monster) return state
  const tuned = monsterTuning(state.difficulty, monster.hp, monster.attack)
  return {
    ...state,
    combat: {
      monsterId: monster.id,
      monsterHp: tuned.hp,
      monsterMaxHp: tuned.hp,
      round: 1,
    },
  }
}
