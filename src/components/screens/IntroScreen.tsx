import { keysNeeded } from '../../engine/gear'
import { textFor } from '../../engine/text'
import { catalog } from '../../game/catalog'
import type { GameState } from '../../models/types'
import { introExpect, introGoal, introLegend, introReason, keysGoal } from '../../worlds/lostFortress/intro'

export function IntroScreen({ state, onEnter }: { state: GameState; onEnter: () => void }) {
  const hero = catalog.classes[state.character.classId]
  return (
    <main className="layout">
      <article className="story-card intro">
        <p className="kicker">הסיפור מתחיל</p>
        <h1>{catalog.world.title}</h1>
        <p className="story">{textFor(state.ageGroup, introLegend)}</p>
        <h2>למה יצאתם לדרך, {hero.name}</h2>
        <p className="story">{textFor(state.ageGroup, introReason[state.character.classId])}</p>
        <p className="hint">
          {textFor(state.ageGroup, introGoal)}
          <br />
          {keysGoal(keysNeeded(state))}
        </p>
        <h2>מה מחכה במבוך</h2>
        <ul className="expect">
          {introExpect.map((item) => (
            <li key={item.title}>
              <span className="emoji" aria-hidden="true">
                {item.icon}
              </span>
              <span>
                <b>{item.title}</b>
                <br />
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </article>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onEnter}>
          נכנסים למבוך
        </button>
      </div>
    </main>
  )
}
