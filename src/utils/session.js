/**
 * Session helpers
 *
 * A FluxOS login is a `zelidauth` triplet (zelid + signature + loginPhrase) kept
 * in localStorage. The loginPhrase carries its own mint time in its first 13
 * characters, so the expiry is knowable client-side without asking a node.
 *
 * How long the network accepts it, from FluxOS:
 *   - the node that minted it stores a loggedUsers record with a 14 day TTL
 *     (serviceManager.js, ensureIndexes on loggedUsers)
 *   - every other node has no record and falls back to accepting any phrase
 *     minted within 16 hours, provided the signature checks out
 *     (verificationHelperUtils.js, verifyUserSession)
 *
 * Requests are spread across nodes, so 16 hours is the number that holds
 * everywhere and the only safe one to plan around.
 *
 * Knowing it client-side matters: a long deploy form can outlive the session,
 * and the wallet will happily sign a message that the node then refuses. Signing
 * again cannot fix that — only a fresh login can — so the flows that sign check
 * here first rather than looping on "Retry Signing".
 */

import qs from 'qs'

/**
 * How long we treat a login as usable.
 *
 * An hour short of the network's 16 hour limit: we would rather end the session
 * ourselves, with a clear prompt, than have a node reject it mid-deploy. The
 * margin also absorbs clock skew, since the mint time comes from a node's clock
 * and the comparison happens against the browser's.
 */
export const SESSION_MAX_AGE_MS = 15 * 60 * 60 * 1000

/**
 * Treat a session that is about to expire as already expired when we are about
 * to sign: signing plus propagation takes a wallet round-trip, and a session
 * that dies in between produces exactly the confusing "signed OK, then not OK"
 * failure this margin exists to avoid.
 */
export const SESSION_SIGNING_MARGIN_MS = 2 * 60 * 1000

/**
 * Reads and parses the stored zelidauth.
 * @returns {{zelid: string, signature: string, loginPhrase: string}|null}
 */
export function getStoredAuth() {
  try {
    const zelidauth = localStorage.getItem('zelidauth')
    if (!zelidauth) return null

    const auth = qs.parse(zelidauth)
    if (!auth?.zelid || !auth?.signature || !auth?.loginPhrase) return null

    return auth
  } catch (error) {
    console.error('[Session] Failed to read zelidauth:', error)

    return null
  }
}

/**
 * Millisecond timestamp at which the node stops accepting this session,
 * or null when there is no session or its loginPhrase carries no usable time.
 * @param {object} [auth] - parsed zelidauth; read from storage when omitted
 * @returns {number|null}
 */
export function getSessionExpiry(auth = getStoredAuth()) {
  const mintedAt = Number(auth?.loginPhrase?.substring(0, 13))
  if (!mintedAt || Number.isNaN(mintedAt)) return null

  return mintedAt + SESSION_MAX_AGE_MS
}

/**
 * Milliseconds left on the session; 0 when expired, unknown or absent.
 * @param {object} [auth]
 * @returns {number}
 */
export function getSessionRemainingMs(auth = getStoredAuth()) {
  const expiry = getSessionExpiry(auth)
  if (!expiry) return 0

  return Math.max(0, expiry - Date.now())
}

/**
 * True when there is no usable session — missing, malformed, or past expiry.
 * @param {object} [auth]
 * @returns {boolean}
 */
export function isSessionExpired(auth = getStoredAuth()) {
  if (!auth) return true

  return getSessionRemainingMs(auth) <= 0
}

/**
 * True when the session has less than `marginMs` left. Use before starting an
 * action that has to survive a wallet round-trip.
 * @param {number} [marginMs]
 * @param {object} [auth]
 * @returns {boolean}
 */
export function isSessionExpiringSoon(marginMs = SESSION_SIGNING_MARGIN_MS, auth = getStoredAuth()) {
  if (!auth) return true

  return getSessionRemainingMs(auth) <= marginMs
}

const AUTH_ERROR_PATTERNS = [
  'unauthorized',
  'access denied',
  'not logged in',
  'login required',
  'session expired',
  'invalid signature',
]

/**
 * True when an API failure means "your session is no longer accepted" rather
 * than "something went wrong" — the distinction between needing a fresh login
 * and being able to simply retry.
 * @param {unknown} error - an axios error, or a response body already unwrapped
 * @returns {boolean}
 */
export function isAuthError(error) {
  const status = error?.response?.status
  if (status === 401 || status === 403) return true

  const body = error?.response?.data ?? error?.data ?? error
  const message = body?.data?.message ?? body?.message ?? error?.message

  if (typeof message !== 'string') return false

  const normalized = message.toLowerCase()

  return AUTH_ERROR_PATTERNS.some(pattern => normalized.includes(pattern))
}
