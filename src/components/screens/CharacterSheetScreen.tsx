import { attributeMeta, classEmoji } from '../../content/uiText'
import { classes } from '../../data/characters'
import type { Draft } from '../../game/draft'
import { ScreenHeader } from '../ScreenHeader'
import { StatMeter } from '../StatMeter'

export function CharacterSheetScreen({
  draft,
  onAccept,
  onReroll,
  onBack,
}: {
  draft: Draft
  onAccept: () => void
  onReroll: () => void
  onBack: () => void
}) {
  const definition = classes[draft.classId]
  return (
    <main className="layout">
      <ScreenHeader
        step={1}
        title={definition.sheetTitle}
        subtitle="אלה המספרים של הדמות. מספר גבוה עוזר בבחירות שמתאימות לה."
      />
      <section className="sheet card">
        <div className="identity">
          <span className="emoji" aria-hidden="true">
            {classEmoji[draft.classId]}
          </span>
          <div className="pool">
            <span>
              ❤️ חיים <bdi>{draft.maxHp}</bdi>
            </span>
            <span>
              ✨ קסם <bdi>{draft.maxMagicPoints}</bdi>
            </span>
          </div>
        </div>
        {attributeMeta.map((attribute) => (
          <StatMeter
            key={attribute.key}
            icon={attribute.icon}
            label={attribute.label}
            value={draft.attributes[attribute.key]}
          />
        ))}
      </section>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onAccept}>
          ממשיכים לבחירת כלי נשק
        </button>
        {draft.rerollUsed ? (
          <p className="fine" style={{ textAlign: 'center' }}>
            כבר הגרלתם את הפעם הנוספת.
          </p>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={onReroll}>
            הגרל שוב
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          חזרה לבחירת דמות
        </button>
      </div>
    </main>
  )
}
