import axios from 'axios'

/**
 * Talks to the Console API (NOT a Flux node) — so it deliberately bypasses the
 * sticky-backend ApiClient, which is scoped to api.runonflux.io. Used only by
 * the SSO handoff: exchange a one-time token from the Console for a zelidauth.
 */
const baseURL = import.meta.env.VITE_CONSOLE_API_URL

export default {
  exchangeHandoff(token) {
    return axios.post(`${baseURL}/flux-login-handoff/exchange`, { token }, { timeout: 10000 })
  },
}
