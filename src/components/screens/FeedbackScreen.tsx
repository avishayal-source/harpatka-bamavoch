import { feedbackHeading } from '../../content/uiText'
import { getMapView } from '../../engine/gameEngine'
import { catalog } from '../../game/catalog'
import type { GameState } from '../../models/types'
import { MazeMap } from '../MazeMap'
import { StatusBar } from '../StatusBar'

export function FeedbackScreen({
  state,
  onContinue,
  onSaveExit,
}: {
  state: GameState
  onContinue: () => void
  onSaveExit: () => void
}) {
  const feedback = state.pendingFeedback
  if (!feedback) return null
  const weapon = catalog.weapons[state.character.weaponId]
  const hp = feedback.hpAfter - feedback.hpBefore
  const magic = feedback.magicAfter - feedback.magicBefore
  const treasure = feedback.treasureAfter - feedback.treasureBefore

  return (
    <main className="play-layout">
      <section className="play-main">
        <StatusBar
          hp={state.hp}
          maxHp={state.maxHp}
          magic={state.magicPoints}
          maxMagic={state.maxMagicPoints}
          treasure={state.treasure}
          weaponName={`${state.character.name} · ${weapon.name}`}
          secondChance={state.secondChanceAvailable}
        />
        <article className={`story-card result tone-${feedback.tone}`}>
          <h1>{feedbackHeading[feedback.tone]}</h1>
          <p className="story">{feedback.message}</p>
          {feedback.dice?.map((line) => (
            <p key={line.title} className="dice-line">
              <strong>{line.title}</strong>
              <br />
              אתם: קובייה {line.you.die} + {line.you.label} {line.you.bonus} = <bdi>{line.you.total}</bdi>
              <br />
              מולם: קובייה {line.foe.die} + {line.foe.label} {line.foe.bonus} = <bdi>{line.foe.total}</bdi>
              <br />
              {line.result}
            </p>
          ))}
          <div className="deltas">
            <Delta value={hp} label="חיים" />
            <Delta value={magic} label="קסם" />
            <Delta value={treasure} label="אוצר" />
            {feedback.secondChanceUsed ? <span className="delta up">שיקוי חירום</span> : null}
          </div>
        </article>
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={onContinue}>
            {state.combat ? 'לסיבוב הבא' : 'המשך'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onSaveExit}>
            שמור וצא
          </button>
        </div>
      </section>
      <MazeMap view={getMapView(state, catalog)} />
    </main>
  )
}

function Delta({ value, label }: { value: number; label: string }) {
  if (value === 0) return null
  const sign = value > 0 ? '+' : ''
  return (
    <span className={value > 0 ? 'delta up' : 'delta down'}>
      <bdi>
        {sign}
        {value}
      </bdi>{' '}
      {label}
    </span>
  )
}
