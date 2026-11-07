import { keysNeeded } from '../engine/gear'
import type { GameState } from '../models/types'

export function StatusBar({ state, weaponName }: { state: GameState; weaponName: string }) {
  const needed = keysNeeded(state)
  return (
    <div>
      <div className="hud">
        <div className="pill">
          <span>חיים</span>
          <b>
            <bdi>
              {state.hp} / {state.maxHp}
            </bdi>
          </b>
        </div>
        <div className="pill">
          <span>קסם</span>
          <b>
            <bdi>
              {state.magicPoints} / {state.maxMagicPoints}
            </bdi>
          </b>
        </div>
        <div className="pill">
          <span>אוצר</span>
          <b>
            <bdi>{state.treasure}</bdi>
          </b>
        </div>
        <div className="pill">
          <span>מפתחות</span>
          <b>
            <bdi>
              {Math.min(state.keys.length, needed)} / {needed}
            </bdi>
          </b>
        </div>
      </div>
      <p className="weapon-line">{weaponName}</p>
      {state.gear.length > 0 ? <p className="weapon-line">ציוד: {state.gear.map((item) => item.name).join(', ')}</p> : null}
      {state.secondChanceAvailable ? (
        <p className="safety">יש לכם שיקוי חירום אחד, אם החיים ייגמרו.</p>
      ) : (
        <p className="safety">שיקוי החירום כבר נוצל.</p>
      )}
    </div>
  )
}
