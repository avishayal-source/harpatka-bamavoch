import type { AgeGroup, AgeText } from '../models/types'

export function textFor(age: AgeGroup, text: AgeText): string {
  if (age === '6-7') return text.young
  if (age === '8-9') return text.medium
  return text.older
}
