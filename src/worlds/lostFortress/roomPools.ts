import type { PoolId } from '../../models/types'

/**
 * Pools for מבוך המצודה האבודה.
 * The vertical slice fills only the rooms needed for one short loop.
 * Add future room ids here; the long-adventure template already asks for them.
 */
export const roomPools: Record<PoolId, string[]> = {
  exploration: ['corridor', 'fork'],
  combat: ['stone-guardian'],
  trap: ['floor-trap'],
  treasure: ['coin-chest'],
  healing: ['glow-fountain'],
  character: [],
  puzzle: [],
  magic: [],
}
