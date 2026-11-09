let counted: Promise<number | null> | null = null

/** Counts this page load once and returns the site's total, or null when the counter isn't reachable. */
export function countVisit(): Promise<number | null> {
  counted ??= fetch('/api/visits', { method: 'POST' })
    .then((response) => (response.ok ? response.json() : null))
    .then((body: { visits?: unknown } | null) => (typeof body?.visits === 'number' ? body.visits : null))
    .catch(() => null)
  return counted
}
