import adventurersArt from '../../assets/home-adventurers.jpg'
import { gameTitle } from '../../content/uiText'
import { catalog } from '../../game/catalog'

export function HomeScreen({
  canContinue,
  notice,
  onNewGame,
  onContinue,
}: {
  canContinue: boolean
  notice: string | null
  onNewGame: () => void
  onContinue: () => void
}) {
  return (
    <main className="layout home">
      <img className="home-art" src={adventurersArt} alt="" width={1024} height={576} />
      <h1>{gameTitle}</h1>
      <p className="world-name">{catalog.world.title}</p>
      <p className="lede">{catalog.world.description} בחרו דמות, היכנסו פנימה, חפשו את אבן האש האבודה, ומצאו את הדרך החוצה עם כמה שיותר אוצר.</p>
      <div className="stack">
        {canContinue ? (
          <button type="button" className="btn btn-primary" onClick={onContinue}>
            המשך הרפתקה
          </button>
        ) : null}
        <button type="button" className={canContinue ? 'btn btn-secondary' : 'btn btn-primary'} onClick={onNewGame}>
          הרפתקה חדשה
        </button>
      </div>
      {notice ? <p className="notice">{notice}</p> : null}
    </main>
  )
}
