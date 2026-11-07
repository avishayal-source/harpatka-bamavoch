import { copyrightLine, privacyLine } from '../content/uiText'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>{privacyLine}</p>
      <p>{copyrightLine}</p>
    </footer>
  )
}
