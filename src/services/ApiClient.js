import { getDetectedBackendURL } from '@/utils/backend'
import {
  isRoundRobinBackend,
  getStickyBackendDNS,
  setStickyBackendDNS,
  clearStickyBackendDNS,
  isAuthenticated,
  extractNodeIPFromResponse,
  ipToDNSFormat,
} from '@/utils/stickyBackend'
import axios from 'axios'


const sourceCancelToken = axios.CancelToken.source()
export { sourceCancelToken }

/**
 * Creates an axios instance with sticky backend support
 *
 * Sticky Backend Strategy:
 * - When using round-robin DNS (api.runonflux.io) and user is authenticated,
 *   all requests are routed to the same backend node that generated the loginPhrase
 * - This prevents authentication failures caused by loginPhrase being stored on a specific node
 * - Sticky backend is stored in sessionStorage (per-tab, survives refresh)
 *
 * See: STICKY_BACKEND_IMPLEMENTATION_PLAN.md
 */
export default function Api() {
  let baseURL = localStorage.getItem('backendURL') || getDetectedBackendURL()

  // Apply sticky backend if conditions are met
  if (isAuthenticated() && isRoundRobinBackend(baseURL)) {
    const stickyBackend = getStickyBackendDNS()
    if (stickyBackend) {
      baseURL = stickyBackend
      console.log('[ApiClient] Using sticky backend:', baseURL)
    }
  }

  const instance = axios.create({
    baseURL,
  })

  // Response interceptor: Capture node IP from loginphrase response
  instance.interceptors.response.use(
    response => {
      // Check if this is a loginphrase response AND we're using round-robin backend
      if (response.config.url && response.config.url.includes('/id/loginphrase') && isRoundRobinBackend(baseURL)) {
        const nodeIP = extractNodeIPFromResponse(response)
        if (nodeIP) {
          const dnsFormat = ipToDNSFormat(nodeIP)
          if (dnsFormat) {
            setStickyBackendDNS(dnsFormat)
            console.log('[ApiClient] Set sticky backend:', dnsFormat)
          } else {
            console.warn('[ApiClient] Could not convert node IP to DNS format:', nodeIP)
          }
        } else {
          console.warn('[ApiClient] Could not extract node IP from loginphrase response')
        }
      }
      return response
    },
    error => {
      // Error interceptor: Handle sticky backend failures
      if (error.config && getStickyBackendDNS()) {
        const isNetworkError = !error.response
        const is5xxError = error.response && error.response.status >= 500

        if (isNetworkError || is5xxError) {
          console.warn('[ApiClient] Sticky backend failed, clearing and retrying with round-robin')
          clearStickyBackendDNS()

          // Prevent infinite retry loop
          if (error.config.__isRetryAfterSticky) {
            console.error('[ApiClient] Retry after unstick also failed')
            return Promise.reject(error)
          }

          // Retry the request with round-robin backend
          const roundRobinURL = localStorage.getItem('backendURL') || getDetectedBackendURL()
          error.config.baseURL = roundRobinURL
          error.config.__isRetryAfterSticky = true

          console.log('[ApiClient] Retrying request with backend:', roundRobinURL)
          return axios.request(error.config)
        }
      }
      return Promise.reject(error)
    },
  )

  return instance
}
