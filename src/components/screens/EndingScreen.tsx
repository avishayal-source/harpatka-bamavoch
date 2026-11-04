import { gameOver, victoryTitle } from '../../content/uiText'
import { scoreGame } from '../../engine/scoring'
import type { GameState } from '../../models/types'

export function EndingScreen({
  state,
  onRetry,
  onNewCharacter,
  onHome,
}: {
  state: GameState
  onRetry: () => void
  onNewCharacter: () => void
  onHome: () => void
}) {
  const won = state.phase === 'victory'
  const score = scoreGame(state)
  return (
    <main className="layout">
      <article className="story-card result">
        <p className="kicker">{won ? 'יציאה' : 'סיום'}</p>
        <h1>{won ? victoryTitle : gameOver.title}</h1>
        <p className="story">{state.pendingFeedback?.message}</p>
        {won ? (
          <>
            <ul className="score-list">
              <li>
                <span>אוצר</span>
                <bdi>{score.treasure}</bdi>
              </li>
              <li>
                <span>בונוס חיים</span>
                <bdi>{score.healthBonus}</bdi>
              </li>
              <li>
                <span>בונוס חקירה</span>
                <bdi>{score.explorationBonus}</bdi>
              </li>
              <li>
                <span>בונוס קושי</span>
                <bdi>{score.difficultyBonus}</bdi>
              </li>
            </ul>
            <p className="total">
              <span>ניקוד סופי</span>
              <bdi>{score.total}</bdi>
            </p>
          </>
        ) : (
          <p className="story">
            {state.treasure > 0
              ? `הגעתם רחוק ואספתם ${state.treasure} אוצר.`
              : 'הגעתם רחוק, ועוד יש מה לגלות בפעם הבאה.'}{' '}
            {gameOver.again}
          </p>
        )}
      </article>
      <div className="actions">
        {won ? (
          <button type="button" className="btn btn-primary" onClick={onNewCharacter}>
            בחרו דמות אחרת
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            נסו שוב
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={won ? onRetry : onNewCharacter}>
          {won ? 'שחקו שוב עם אותה דמות' : 'בחרו דמות אחרת'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onHome}>
          לדף הבית
        </button>
      </div>
    </main>
  )
}
