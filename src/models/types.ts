export const ATTRIBUTE_KEYS = [
  'strength',
  'intelligence',
  'agility',
  'magic',
  'charisma',
] as const

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number]

export type CharacterClass = 'WARRIOR' | 'WIZARD' | 'THIEF' | 'ELF' | 'DWARF'

export type Difficulty = 'easy' | 'normal' | 'brave'

export type AgeGroup = '6-7' | '8-9' | '10-12'

export type AdventureLength = 'short' | 'long'

export type RoomType =
  | 'START'
  | 'NORMAL'
  | 'COMBAT'
  | 'TRAP'
  | 'TREASURE'
  | 'HEALING'
  | 'PUZZLE'
  | 'CHARACTER'
  | 'MAGIC'
  | 'CHOICE'
  | 'EXIT'

export type PoolId =
  | 'exploration'
  | 'trap'
  | 'treasure'
  | 'character'
  | 'puzzle'
  | 'combat'
  | 'healing'
  | 'magic'

export type Phase = 'playing' | 'feedback' | 'victory' | 'gameover'

export type FeedbackTone = 'good' | 'bad' | 'neutral' | 'second-chance'

export interface AgeText {
  young: string
  medium: string
  older: string
}

export type Attributes = Record<AttributeKey, number>

export interface ClassDefinition {
  id: CharacterClass
  name: string
  /** Sheet heading, for example "הלוחם שלך". */
  sheetTitle: string
  summary: string
  strengths: string[]
  weaknesses: string[]
  ranges: Record<AttributeKey, readonly [number, number]>
  hp: number
  magicPoints: number
}

export interface Weapon {
  id: string
  classId: CharacterClass
  name: string
  damage: number
  description: string
}

export interface Character {
  classId: CharacterClass
  name: string
  attributes: Attributes
  weaponId: string
}

export interface AttributeCheck {
  kind: 'attribute'
  attribute: AttributeKey
  minimum: number
}

export interface CombatCheck {
  kind: 'combat'
  enemyPower: number
}

export type Check = AttributeCheck | CombatCheck

export interface Outcome {
  message: AgeText
  hpChange?: number
  magicChange?: number
  treasureChange?: number
  nextRoomId?: string
  recordDecision?: string
  victory?: boolean
}

export interface Choice {
  id: string
  label: string
  requiresClass?: CharacterClass[]
  requiresMagic?: number
  requiresWeapon?: string
  requiresDifficulty?: Difficulty
  requiresDecision?: string
  requiresPreviousRoom?: string
  check?: Check
  success: Outcome
  failure?: Outcome
}

export interface Room {
  id: string
  type: RoomType
  title: string
  story: AgeText
  choices: Choice[]
  tags?: string[]
  /** Grid position. North is up, so a smaller y is north. */
  x?: number
  y?: number
  mapLabel?: string
  monsterId?: string
  hint?: {
    minIntelligence: number
    text: AgeText
  }
}

export interface Monster {
  id: string
  name: string
  description: AgeText
  hp: number
  attack: number
  defense: number
  speed: number
  abilities: string[]
}

export interface MazeLink {
  a: string
  b: string
}

export type CombatAction = 'strike' | 'flee' | 'spell' | 'skill'

export interface CombatState {
  monsterId: string
  monsterHp: number
  monsterMaxHp: number
  round: number
}

export interface DiceSide {
  die: number
  bonus: number
  total: number
  label: string
}

export interface DiceLine {
  title: string
  you: DiceSide
  foe: DiceSide
  result: string
}

export interface SegmentFixed {
  kind: 'fixed'
  roomId: string
}

export interface SegmentPool {
  kind: 'pool'
  pool: PoolId
  count: number
}

export type Segment = SegmentFixed | SegmentPool

export interface WorldConfig {
  id: string
  title: string
  description: string
  startRoomId: string
  exitRoomId: string
  templates: Record<AdventureLength, Segment[]>
}

export interface PendingFeedback {
  tone: FeedbackTone
  message: string
  success: boolean
  secondChanceUsed: boolean
  hpBefore: number
  hpAfter: number
  magicBefore: number
  magicAfter: number
  treasureBefore: number
  treasureAfter: number
  nextRoomId: string | null
  dice?: DiceLine[]
}

export interface GameState {
  seed: number
  character: Character
  currentRoomId: string
  routeIndex: number
  plannedRoute: string[]
  hp: number
  maxHp: number
  magicPoints: number
  maxMagicPoints: number
  treasure: number
  visitedRooms: string[]
  roomVisits: Record<string, number>
  discoveredEdges: string[]
  cameFromRoomId: string | null
  defeatedMonsters: string[]
  resolvedChoices: string[]
  diceState: number
  combat: CombatState | null
  decisions: string[]
  difficulty: Difficulty
  ageGroup: AgeGroup
  adventureLength: AdventureLength
  secondChanceAvailable: boolean
  roomsCompleted: number
  phase: Phase
  pendingFeedback: PendingFeedback | null
}

export interface Catalog {
  rooms: Record<string, Room>
  weapons: Record<string, Weapon>
  classes: Record<CharacterClass, ClassDefinition>
  world: WorldConfig
  pools: Record<PoolId, string[]>
  links: MazeLink[]
  monsters: Record<string, Monster>
}

export interface MapRoom {
  id: string
  x: number
  y: number
  label: string
  kind: 'here' | 'visited' | 'seen'
}

export interface MapCorridor {
  a: string
  b: string
  walked: boolean
}

export interface MapView {
  rooms: MapRoom[]
  corridors: MapCorridor[]
  minX: number
  minY: number
  width: number
  height: number
}

export interface ChoiceView {
  id: string
  label: string
  enabled: boolean
  reason?: string
}

export interface RoomView {
  id: string
  type: RoomType
  title: string
  story: string
  hint?: string
  choices: ChoiceView[]
  routeIndex: number
  routeLength: number
}

export interface ScoreBreakdown {
  treasure: number
  healthBonus: number
  explorationBonus: number
  difficultyBonus: number
  total: number
}

export interface RolledCharacter {
  classId: CharacterClass
  attributes: Attributes
  maxHp: number
  maxMagicPoints: number
}

export interface NewGameInput {
  classId: CharacterClass
  attributes: Attributes
  weaponId: string
  ageGroup: AgeGroup
  difficulty: Difficulty
  adventureLength: AdventureLength
  seed?: number
}
