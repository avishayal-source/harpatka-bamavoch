import { useEffect, useState } from 'react'
import { copyrightLine, privacyLine } from '../content/uiText'
import { applyOwnerParam, countVisit, isSkippingCount, readVisits } from '../storage/visits'

const REFRESH_MS = 30_000

export function SiteFooter() {
  const [visits, setVisits] = useState<number | null>(null)
  const [skipping, setSkipping] = useState(false)

  useEffect(() => {
    applyOwnerParam()
    setSkipping(isSkippingCount())
    countVisit().then(setVisits)

    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      readVisits().then((total) => {
        if (total !== null) setVisits(total)
      })
    }
    const timer = window.setInterval(refresh, REFRESH_MS)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  return (
    <footer className="site-footer">
      {visits !== null ? (
        <p>
          👣 {visits.toLocaleString('he-IL')} כניסות לאתר
          {skipping ? ' (הכניסות מהמכשיר הזה לא נספרות)' : ''}
        </p>
      ) : null}
      <p>{privacyLine}</p>
      <p>{copyrightLine}</p>
    </footer>
  )
}
