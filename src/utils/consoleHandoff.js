import ConsoleHandoffService from '@/services/ConsoleHandoffService'

const FRAGMENT_KEY = 'flux-handoff='

/**
 * SSO handoff entry point. When the Console opens this UI with a
 * `#flux-handoff=<token>` fragment, exchange that single-use token for a
 * zelidauth and store it exactly where a normal login would — so the existing
 * router guard validates it and the user lands authenticated. No-op otherwise.
 *
 * The token is stripped from the URL immediately (before any await) so it never
 * lingers in history; the bearer zelidauth only ever arrives in the POST body.
 *
 * Returns true when a session was established from a handoff.
 */
export async function consumeConsoleHandoff() {
  const hash = window.location.hash || ''
  const at = hash.indexOf(FRAGMENT_KEY)
  if (at === -1) return false

  const token = decodeURIComponent(hash.slice(at + FRAGMENT_KEY.length).split('&')[0])

  // Strip the token from the URL/history right away (synchronously).
  history.replaceState(null, '', window.location.pathname + window.location.search)
  if (!token) return false

  try {
    const { data } = await ConsoleHandoffService.exchangeHandoff(token)
    const zelidauth = data?.zelidauth
    if (zelidauth && zelidauth.includes('zelid=') && zelidauth.includes('signature=')) {
      // Identical shape to a normal login — the guard's checkUserLogged + the
      // sticky-backend logic take over from here.
      localStorage.setItem('zelidauth', zelidauth)

      return true
    }
  } catch (error) {
    console.warn('[consoleHandoff] exchange failed:', error?.message || error)
  }

  return false
}
