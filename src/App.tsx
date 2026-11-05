import { useEffect, useState } from 'react'
import { AdventureScreen } from './components/screens/AdventureScreen'
import { CharacterSelectScreen } from './components/screens/CharacterSelectScreen'
import { CharacterSheetScreen } from './components/screens/CharacterSheetScreen'
import { EndingScreen } from './components/screens/EndingScreen'
import { FeedbackScreen } from './components/screens/FeedbackScreen'
import { HomeScreen } from './components/screens/HomeScreen'
import { IntroScreen } from './components/screens/IntroScreen'
import { SetupScreen } from './components/screens/SetupScreen'
import { WeaponScreen } from './components/screens/WeaponScreen'
import { acknowledgeFeedback, combatAction, createNewGame, resolveChoice, rollCharacter } from './engine/gameEngine'
import { catalog } from './game/catalog'
import type { Draft } from './game/draft'
import type { CharacterClass, CombatAction, GameState } from './models/types'
import { clearGame, hasSave, loadGame, saveGame } from './storage/saveGame'

type Flow =
  | { screen: 'home' }
  | { screen: 'character' }
  | { screen: 'sheet'; draft: Draft }
  | { screen: 'weapon'; draft: Draft }
  | { screen: 'setup'; draft: Draft }
  | { screen: 'intro'; state: GameState }
  | { screen: 'play'; state: GameState }

export function App() {
  const [flow, setFlow] = useState<Flow>({ screen: 'home' })
  const [notice, setNotice] = useState<string | null>(null)
  const [canContinue, setCanContinue] = useState(() => hasSave(catalog))

  useEffect(() => {
    if (flow.screen !== 'play') return
    if (flow.state.phase === 'victory' || flow.state.phase === 'gameover') {
      clearGame()
      setCanContinue(false)
      return
    }
    saveGame(flow.state)
    setCanContinue(true)
  }, [flow])

  const playState = flow.screen === 'play' ? flow.state : null
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [flow.screen, playState?.currentRoomId, playState?.phase])

  function startDraft(classId: CharacterClass, kept?: Partial<Draft>): Draft {
    const rolled = rollCharacter(classId, catalog)
    return {
      classId,
      attributes: rolled.attributes,
      maxHp: rolled.maxHp,
      maxMagicPoints: rolled.maxMagicPoints,
      rerollUsed: false,
      ageGroup: kept?.ageGroup ?? '8-9',
      difficulty: kept?.difficulty ?? 'normal',
      adventureLength: kept?.adventureLength ?? 'short',
    }
  }

  function playAgain(state: GameState) {
    setNotice(null)
    setFlow({
      screen: 'sheet',
      draft: startDraft(state.character.classId, {
        ageGroup: state.ageGroup,
        difficulty: state.difficulty,
        adventureLength: state.adventureLength,
      }),
    })
  }

  if (flow.screen === 'home') {
    return (
      <HomeScreen
        canContinue={canContinue}
        notice={notice}
        onNewGame={() => {
          setNotice(null)
          setFlow({ screen: 'character' })
        }}
        onContinue={() => {
          const saved = loadGame(catalog)
          if (!saved) {
            setCanContinue(false)
            setNotice('לא נמצאה הרפתקה שמורה.')
            return
          }
          setNotice(null)
          setFlow({ screen: 'play', state: saved })
        }}
      />
    )
  }

  if (flow.screen === 'character') {
    return (
      <CharacterSelectScreen
        onBack={() => setFlow({ screen: 'home' })}
        onPick={(classId) => setFlow({ screen: 'sheet', draft: startDraft(classId) })}
      />
    )
  }

  if (flow.screen === 'sheet') {
    const { draft } = flow
    return (
      <CharacterSheetScreen
        draft={draft}
        onBack={() => setFlow({ screen: 'character' })}
        onAccept={() => setFlow({ screen: 'weapon', draft })}
        onReroll={() => {
          if (draft.rerollUsed) return
          const rolled = rollCharacter(draft.classId, catalog)
          setFlow({
            screen: 'sheet',
            draft: {
              ...draft,
              attributes: rolled.attributes,
              maxHp: rolled.maxHp,
              maxMagicPoints: rolled.maxMagicPoints,
              rerollUsed: true,
            },
          })
        }}
      />
    )
  }

  if (flow.screen === 'weapon') {
    return (
      <WeaponScreen
        draft={flow.draft}
        onBack={() => setFlow({ screen: 'sheet', draft: flow.draft })}
        onPick={(weaponId) => setFlow({ screen: 'setup', draft: { ...flow.draft, weaponId } })}
      />
    )
  }

  if (flow.screen === 'setup') {
    return (
      <SetupScreen
        draft={flow.draft}
        onBack={() => setFlow({ screen: 'weapon', draft: flow.draft })}
        onChange={(patch) => setFlow({ screen: 'setup', draft: { ...flow.draft, ...patch } })}
        onStart={() => {
          if (!flow.draft.weaponId) return
          const state = createNewGame(
            {
              classId: flow.draft.classId,
              attributes: flow.draft.attributes,
              weaponId: flow.draft.weaponId,
              ageGroup: flow.draft.ageGroup,
              difficulty: flow.draft.difficulty,
              adventureLength: flow.draft.adventureLength,
            },
            catalog,
          )
          setFlow({ screen: 'intro', state })
        }}
      />
    )
  }

  if (flow.screen === 'intro') {
    return <IntroScreen state={flow.state} onEnter={() => setFlow({ screen: 'play', state: flow.state })} />
  }

  if (flow.state.phase === 'victory' || flow.state.phase === 'gameover') {
    return (
      <EndingScreen
        state={flow.state}
        onHome={() => setFlow({ screen: 'home' })}
        onNewCharacter={() => setFlow({ screen: 'character' })}
        onRetry={() => playAgain(flow.state)}
      />
    )
  }

  if (flow.state.phase === 'feedback') {
    return (
      <FeedbackScreen
        state={flow.state}
        onContinue={() => setFlow({ screen: 'play', state: acknowledgeFeedback(flow.state) })}
        onSaveExit={() => {
          saveGame(flow.state)
          setNotice('ההרפתקה נשמרה. אפשר להמשיך אחר כך.')
          setCanContinue(true)
          setFlow({ screen: 'home' })
        }}
      />
    )
  }

  return (
    <AdventureScreen
      state={flow.state}
      onChoose={(choiceId) => setFlow({ screen: 'play', state: resolveChoice(flow.state, choiceId, catalog) })}
      onCombat={(action: CombatAction) => setFlow({ screen: 'play', state: combatAction(flow.state, action, catalog) })}
      onSaveExit={() => {
        saveGame(flow.state)
        setNotice('ההרפתקה נשמרה. אפשר להמשיך אחר כך.')
        setCanContinue(true)
        setFlow({ screen: 'home' })
      }}
    />
  )
}
