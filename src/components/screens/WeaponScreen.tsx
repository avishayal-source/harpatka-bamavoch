import { classes } from '../../data/characters'
import { weaponsForClass } from '../../data/weapons'
import type { Draft } from '../../game/draft'
import { ScreenHeader } from '../ScreenHeader'

export function WeaponScreen({
  draft,
  onPick,
  onBack,
}: {
  draft: Draft
  onPick: (weaponId: string) => void
  onBack: () => void
}) {
  const definition = classes[draft.classId]
  return (
    <main className="layout">
      <ScreenHeader step={2} title="בחרו כלי נשק" subtitle={`${definition.sheetTitle}. הכלי עוזר כשנלחמים.`} />
      <div className="stack">
        {weaponsForClass(draft.classId).map((weapon) => (
          <button key={weapon.id} type="button" className="weapon-card" onClick={() => onPick(weapon.id)}>
            <h2>{weapon.name}</h2>
            <small>נזק {weapon.damage}</small>
            <p className="summary">{weapon.description}</p>
          </button>
        ))}
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          חזרה למספרים
        </button>
      </div>
    </main>
  )
}
