const SKIP_KEY = 'even-haesh-skip-visit-count'
const OWNER_PARAM = 'me'

let counted: Promise<number | null> | null = null

/**
 * Opening the site with ?me stops counting this device; ?me=off counts it again.
 * The parameter is removed from the address afterwards.
 */
export function applyOwnerParam(): void {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(OWNER_PARAM)) return
  try {
    if (url.searchParams.get(OWNER_PARAM) === 'off') localStorage.removeItem(SKIP_KEY)
    else localStorage.setItem(SKIP_KEY, '1')
  } catch {
    // Storage blocked: the visit is simply counted.
  }
  url.searchParams.delete(OWNER_PARAM)
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
}

export function isSkippingCount(): boolean {
  try {
    return localStorage.getItem(SKIP_KEY) === '1'
  } catch {
    return false
  }
}

/** Counts this page load once (unless this device is skipped) and returns the total, or null if unreachable. */
export function countVisit(): Promise<number | null> {
  counted ??= request(isSkippingCount() ? 'GET' : 'POST')
  return counted
}

/** Reads the total without counting. */
export function readVisits(): Promise<number | null> {
  return request('GET')
}

function request(method: 'GET' | 'POST'): Promise<number | null> {
  return fetch('/api/visits', { method, cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : null))
    .then((body: { visits?: unknown } | null) => (typeof body?.visits === 'number' ? body.visits : null))
    .catch(() => null)
}
