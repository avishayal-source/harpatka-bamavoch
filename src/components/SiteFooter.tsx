import { useEffect, useState } from 'react'
import { copyrightLine, privacyLine } from '../content/uiText'
import { countVisit } from '../storage/visits'

export function SiteFooter() {
  const [visits, setVisits] = useState<number | null>(null)

  useEffect(() => {
    countVisit().then(setVisits)
  }, [])

  return (
    <footer className="site-footer">
      {visits !== null ? <p>👣 {visits.toLocaleString('he-IL')} כניסות לאתר</p> : null}
      <p>{privacyLine}</p>
      <p>{copyrightLine}</p>
    </footer>
  )
}
