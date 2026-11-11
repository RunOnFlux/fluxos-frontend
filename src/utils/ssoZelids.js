import axios from "axios"

// Email/Google logins sign through the Flux SSO signer (repo flux-sso). After the November 2026 key
// rotation an account gets a new ZelID once its live apps have moved to it; expired apps cannot change
// owner and stay under the previous one, so the app history is read for both.
export const SSO_BASE = "https://sso.runonflux.com"
export const SSO_SIGN_IN_URL = `${SSO_BASE}/api/signInOrUp`
export const SSO_SIGN_MESSAGE_URL = `${SSO_BASE}/api/signMessage`

const PREVIOUS_KEY = "ssoPreviousZelid"

/** Asks flux-sso for the account's previous ZelID and remembers it for this session. Never throws. */
export async function rememberSsoPreviousZelid(firebaseIdToken) {
  try {
    const { data } = await axios.get(`${SSO_BASE}/api/zelids`, {
      headers: { Authorization: `Bearer ${firebaseIdToken}` },
    })
    const previous = data?.status === "success" ? data.data?.previous : null
    if (previous) localStorage.setItem(PREVIOUS_KEY, previous)
    else localStorage.removeItem(PREVIOUS_KEY)
  } catch {
    localStorage.removeItem(PREVIOUS_KEY)
  }
}

export function forgetSsoPreviousZelid() {
  localStorage.removeItem(PREVIOUS_KEY)
}

/** The ZelIDs whose app history belongs to the signed-in user: theirs, plus the previous SSO one. */
export function historyOwners(zelid) {
  const previous = localStorage.getItem("loginType") === "sso" ? localStorage.getItem(PREVIOUS_KEY) : null

  return [zelid, ...(previous && previous !== zelid ? [previous] : [])].filter(Boolean)
}
