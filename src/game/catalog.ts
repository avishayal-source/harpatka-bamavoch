import { classes } from '../data/characters'
import { weapons } from '../data/weapons'
import type { Catalog } from '../models/types'
import { mazeLinks } from '../worlds/lostFortress/maze'
import { monsters } from '../worlds/lostFortress/monsters'
import { rooms } from '../worlds/lostFortress/rooms'
import { roomPools } from '../worlds/lostFortress/roomPools'
import { lostFortressWorld } from '../worlds/lostFortress/worldConfig'

export const catalog: Catalog = {
  rooms,
  weapons,
  classes,
  world: lostFortressWorld,
  pools: roomPools,
  links: mazeLinks,
  monsters,
}
