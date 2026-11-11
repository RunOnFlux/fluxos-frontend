// Client-side check for the FluxDrive expiry-reminder address. Mirrors normalizeEmail in
// fluxdrive-api (helpers/expiryNotices.js) so the form rejects what the bridge would reject,
// including the `<zelid>@zel.core` placeholder used to register crypto.com customers.

const EMAIL_MAX_LEN = 254
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/

/** Returns the trimmed address, or null when it is not one the bridge will accept. */
export function normalizeFluxDriveEmail(raw) {
  if (typeof raw !== 'string') return null
  const email = raw.trim()
  if (email.length === 0 || email.length > EMAIL_MAX_LEN) return null
  if (!EMAIL_RE.test(email)) return null
  if (email.toLowerCase().endsWith('@zel.core')) return null

  return email
}
