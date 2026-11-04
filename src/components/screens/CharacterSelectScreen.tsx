import { classEmoji } from '../../content/uiText'
import { classOrder, classes } from '../../data/characters'
import type { CharacterClass } from '../../models/types'
import { ScreenHeader } from '../ScreenHeader'

export function CharacterSelectScreen({
  onPick,
  onBack,
}: {
  onPick: (classId: CharacterClass) => void
  onBack: () => void
}) {
  return (
    <main className="layout">
      <ScreenHeader step={0} title="בחרו דמות" subtitle="לכל דמות יש דרך אחרת לעבור את המבוך." />
      <div className="stack">
        {classOrder.map((classId) => {
          const definition = classes[classId]
          return (
            <button key={classId} type="button" className="class-card" onClick={() => onPick(classId)}>
              <span className="emoji" aria-hidden="true">
                {classEmoji[classId]}
              </span>
              <span>
                <h2>{definition.name}</h2>
                <p className="summary">{definition.summary}</p>
                <span className="chips">
                  {definition.strengths.map((item) => (
                    <span key={item} className="chip">
                      {item}
                    </span>
                  ))}
                  {definition.weaknesses.map((item) => (
                    <span key={item} className="chip weak">
                      פחות: {item}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          )
        })}
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          חזרה
        </button>
      </div>
    </main>
  )
}
