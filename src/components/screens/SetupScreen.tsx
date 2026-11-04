import { ageOptions, difficultyOptions, lengthOptions } from '../../content/uiText'
import { classes } from '../../data/characters'
import { weapons } from '../../data/weapons'
import type { Draft } from '../../game/draft'
import type { AdventureLength, AgeGroup, Difficulty } from '../../models/types'
import { ScreenHeader } from '../ScreenHeader'

export function SetupScreen({
  draft,
  onChange,
  onStart,
  onBack,
}: {
  draft: Draft
  onChange: (patch: Partial<Draft>) => void
  onStart: () => void
  onBack: () => void
}) {
  const weapon = draft.weaponId ? weapons[draft.weaponId] : undefined
  return (
    <main className="layout">
      <ScreenHeader
        step={3}
        title="לפני שיוצאים לדרך"
        subtitle={`${classes[draft.classId].name} עם ${weapon?.name ?? 'כלי נשק'}`}
      />
      <section className="group">
        <h2>בן/בת כמה השחקן?</h2>
        <p className="fine">זה משנה את אורך הסיפור, לא את הקושי.</p>
        <div className="options">
          {ageOptions.map((option) => (
            <Option
              key={option.id}
              pressed={draft.ageGroup === option.id}
              label={option.label}
              detail={option.detail}
              onClick={() => onChange({ ageGroup: option.id as AgeGroup })}
            />
          ))}
        </div>
      </section>
      <section className="group">
        <h2>רמת קושי</h2>
        <div className="options">
          {difficultyOptions.map((option) => (
            <Option
              key={option.id}
              pressed={draft.difficulty === option.id}
              label={option.label}
              detail={option.detail}
              onClick={() => onChange({ difficulty: option.id as Difficulty })}
            />
          ))}
        </div>
      </section>
      <section className="group">
        <h2>אורך ההרפתקה</h2>
        <div className="options">
          {lengthOptions.map((option) => (
            <Option
              key={option.id}
              pressed={draft.adventureLength === option.id}
              label={option.label}
              detail={option.detail}
              onClick={() => onChange({ adventureLength: option.id as AdventureLength })}
            />
          ))}
        </div>
      </section>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onStart}>
          התחל בהרפתקה
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          חזרה לכלי הנשק
        </button>
      </div>
    </main>
  )
}

function Option({
  pressed,
  label,
  detail,
  onClick,
}: {
  pressed: boolean
  label: string
  detail: string
  onClick: () => void
}) {
  return (
    <button type="button" className="option" aria-pressed={pressed} onClick={onClick}>
      <strong>{label}</strong>
      <small>{detail}</small>
    </button>
  )
}
