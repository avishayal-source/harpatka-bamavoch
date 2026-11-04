import { roomTypeLabel } from '../../content/uiText'
import { combatActions, defenseScore, tunedMonster } from '../../engine/combat'
import { getMapView, getRoomView } from '../../engine/gameEngine'
import { catalog } from '../../game/catalog'
import type { CombatAction, GameState } from '../../models/types'
import { MazeMap } from '../MazeMap'
import { StatusBar } from '../StatusBar'

export function AdventureScreen({
  state,
  onChoose,
  onCombat,
  onSaveExit,
}: {
  state: GameState
  onChoose: (choiceId: string) => void
  onCombat: (action: CombatAction) => void
  onSaveExit: () => void
}) {
  const view = getRoomView(state, catalog)
  const weapon = catalog.weapons[state.character.weaponId]
  const combat = state.combat
  const monster = combat ? tunedMonster(state, catalog.monsters[combat.monsterId]) : undefined

  return (
    <main className="play-layout">
      <section className="play-main">
        <StatusBar
          hp={state.hp}
          maxHp={state.maxHp}
          magic={state.magicPoints}
          maxMagic={state.maxMagicPoints}
          treasure={state.treasure}
          weaponName={`${state.character.name} · ${weapon.name} · נזק ${weapon.damage}`}
          secondChance={state.secondChanceAvailable}
        />
        <article className="story-card">
          <p className="kicker">{combat ? `קרב · סיבוב ${combat.round}` : roomTypeLabel[view.type]}</p>
          <h1>{combat && monster ? monster.name : view.title}</h1>
          <p className="story">{view.story}</p>
          {view.hint ? <p className="hint">{view.hint}</p> : null}
          {combat && monster ? (
            <div className="versus">
              <article className="monster-card">
                <h2>המפלצת</h2>
                <p>
                  חיים <bdi>{combat.monsterHp} / {combat.monsterMaxHp}</bdi>
                </p>
                <ul>
                  <li>התקפה {monster.attack}</li>
                  <li>שריון {monster.defense}</li>
                  <li>מהירות {monster.speed}</li>
                  {monster.abilities.map((ability) => (
                    <li key={ability}>{ability}</li>
                  ))}
                </ul>
              </article>
              <article className="hero-card">
                <h2>{state.character.name}</h2>
                <ul>
                  <li>כוח {state.character.attributes.strength}</li>
                  <li>
                    {weapon.name} נזק {weapon.damage}
                  </li>
                  <li>זריזות {state.character.attributes.agility}</li>
                  <li>קסם {state.character.attributes.magic}</li>
                  <li>הגנה {defenseScore(state)}</li>
                  <li>
                    חיים <bdi>{state.hp} / {state.maxHp}</bdi>
                  </li>
                </ul>
              </article>
            </div>
          ) : null}
        </article>
        <div className="choices">
          {combat
            ? combatActions(state).map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="choice"
                  disabled={!action.enabled}
                  onClick={() => onCombat(action.id)}
                >
                  <span>{action.label}</span>
                  <span className="choice-reason">{action.enabled ? action.detail : action.reason}</span>
                </button>
              ))
            : view.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className="choice"
                  disabled={!choice.enabled}
                  onClick={() => onChoose(choice.id)}
                >
                  <span>{choice.label}</span>
                  {!choice.enabled && choice.reason ? <span className="choice-reason">{choice.reason}</span> : null}
                </button>
              ))}
        </div>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={onSaveExit}>
            שמור וצא
          </button>
        </div>
      </section>
      <MazeMap view={getMapView(state, catalog)} />
    </main>
  )
}
