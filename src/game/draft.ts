import type { AdventureLength, AgeGroup, Attributes, CharacterClass, Difficulty } from '../models/types'

export interface Draft {
  classId: CharacterClass
  attributes: Attributes
  maxHp: number
  maxMagicPoints: number
  rerollUsed: boolean
  weaponId?: string
  ageGroup: AgeGroup
  difficulty: Difficulty
  adventureLength: AdventureLength
}
