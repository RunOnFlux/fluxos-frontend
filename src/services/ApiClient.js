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
 * Fix malformed backendURL in localStorage (remove surrounding quotes)
 * This runs once on module load to clean up any stringified values
 */
(function cleanupBackendURL() {
  try {
    const backendURL = localStorage.getItem('backendURL')
    if (backendURL && typeof backendURL === 'string') {
      const cleaned = backendURL.replace(/^["']|["']$/g, '')
      if (cleaned !== backendURL) {
        console.warn('[ApiClient] Fixing malformed backendURL in localStorage:', backendURL, '->', cleaned)
        localStorage.setItem('backendURL', cleaned)
      }
    }
  } catch (error) {
    console.error('[ApiClient] Failed to cleanup backendURL:', error)
  }
})()

/**
 * APIs that should BYPASS sticky backend and use round-robin load balancing
 *
 * This list matches the backend's roundrobinEndpointsAcl configuration.
 * Add URL patterns here to exclude specific endpoints from sticky session logic.
 * This is useful for:
 * - Read-only verification endpoints that don't require session state
 * - Public APIs that should distribute load across all backend nodes
 * - Price calculation endpoints (stateless operations)
 * - App registration/update/test endpoints (zelidauth-based authentication)
 * - Location endpoints
 *
 * Backend reference: roundrobinEndpointsAcl in flux backend
 *
 * Note: '/apps/temporarymessages' is in backend ACL but not currently used in frontend
 */
const STICKY_BACKEND_EXCLUSIONS = [
  '/apps/calculatefiatandfluxprice',
  '/apps/verifyappregistrationspecifications',
  '/apps/verifyappupdatespecifications',
  '/apps/appregister',
  '/apps/appupdate',
  '/apps/temporarymessages',  // Not currently used in frontend, matches backend ACL
  '/apps/location',
  '/apps/testappinstall',
  '/apps/getpublickey',
]

/**
 * Check if a URL should bypass sticky backend logic
 * @param {string} url - The request URL to check
 * @returns {boolean} - True if URL should bypass sticky backend
 */
function shouldBypassStickyBackend(url) {
  if (!url) return false
  
  return STICKY_BACKEND_EXCLUSIONS.some(pattern => url.includes(pattern))
}

/**
 * Requests that must reach the node holding the session even before a session
 * exists in storage: /id/loginphrase mints the phrase (and the pin), and
 * /id/verifylogin has to be answered by that same node for the session to be
 * created where the pin points.
 */
const LOGIN_FLOW_ENDPOINTS = ['/id/loginphrase', '/id/emergencyphrase', '/id/verifylogin', '/id/checkprivilege']

function isLoginFlowEndpoint(url) {
  if (!url) return false

  return LOGIN_FLOW_ENDPOINTS.some(pattern => url.includes(pattern))
}

/**
 * Endpoints that mint a loginPhrase, and therefore identify the node that will
 * hold the resulting session.
 */
function isPhraseEndpoint(url) {
  if (!url) return false

  return url.includes('/id/loginphrase') || url.includes('/id/emergencyphrase')
}

/**
 * A single blip is not proof the pinned node is gone. Dropping the pin on the
 * first timeout stranded the session — nothing re-pins it, so every later
 * request round-robins onto nodes that never heard of the session and the user
 * has to log out and back in. Only give the pin up once a node has failed us
 * twice in a row.
 */
const STICKY_FAILURE_LIMIT = 2
let stickyFailures = 0

/**
 * Creates an axios instance with sticky backend support
 *
 * Sticky Backend Strategy:
 * - When using round-robin DNS (api.runonflux.io), requests belonging to a
 *   session are routed to the same backend node that generated the loginPhrase
 * - This prevents authentication failures caused by loginPhrase being stored on a specific node
 * - The pin lives in localStorage for as long as the session it belongs to
 * - Some APIs can be excluded from sticky backend via STICKY_BACKEND_EXCLUSIONS
 *
 * See: STICKY_BACKEND_IMPLEMENTATION_PLAN.md
 */
export default function Api() {
  const roundRobinURL = localStorage.getItem('backendURL') || getDetectedBackendURL()

  const instance = axios.create({
    baseURL: roundRobinURL,
  })

  // Request interceptor: route each request to the pinned node or round-robin
  instance.interceptors.request.use(
    config => {
      if (!isRoundRobinBackend(roundRobinURL)) return config

      // Stateless / deliberately load-balanced endpoints always round-robin.
      if (shouldBypassStickyBackend(config.url)) {
        console.log('[ApiClient] Bypassing sticky backend for:', config.url, '- Using round-robin:', roundRobinURL)

        return config
      }

      const stickyBackend = getStickyBackendDNS()
      if (stickyBackend && (isAuthenticated() || isLoginFlowEndpoint(config.url))) {
        config.baseURL = stickyBackend
        console.log('[ApiClient] Using sticky backend:', stickyBackend)
      }

      return config
    },
    error => Promise.reject(error),
  )

  instance.interceptors.response.use(
    response => {
      const url = response.config?.url
      if (!isRoundRobinBackend(roundRobinURL)) return response

      // Only an answer from the pinned node itself clears its failure streak.
      if (response.config?.baseURL && response.config.baseURL === getStickyBackendDNS()) {
        stickyFailures = 0
      }

      // A phrase response identifies the node that will hold the session.
      if (isPhraseEndpoint(url)) {
        const phrase = typeof response.data?.data === 'string' ? response.data.data : undefined

        pinNodeFromResponse(response, phrase)
      }

      // Self-heal: a checkprivilege that comes back with a real privilege proves
      // this node holds the session, so re-pin to it if the pin was lost.
      if (url?.includes('/id/checkprivilege') && !getStickyBackendDNS()) {
        const privilege = response.data?.data?.message
        if (privilege && privilege !== 'none') {
          pinNodeFromResponse(response)
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
          stickyFailures += 1

          // Prevent infinite retry loop
          if (error.config.__isRetryAfterSticky) {
            console.error('[ApiClient] Retry after unstick also failed')

            return Promise.reject(error)
          }

          if (stickyFailures >= STICKY_FAILURE_LIMIT) {
            console.warn('[ApiClient] Sticky backend failed repeatedly, clearing and retrying with round-robin')
            clearStickyBackendDNS()
          } else {
            console.warn('[ApiClient] Sticky backend request failed, retrying with round-robin (pin kept)')
          }

          // Retry the request with round-robin backend
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

/**
 * Pins the node that answered a response, when it can be identified.
 * @param {AxiosResponse} response
 * @param {string} [loginPhrase] - phrase this node minted, when the response carries one
 */
function pinNodeFromResponse(response, loginPhrase) {
  const nodeIP = extractNodeIPFromResponse(response)
  if (!nodeIP) {
    console.warn('[ApiClient] Could not extract node IP from response:', response.config?.url)

    return
  }

  const dnsFormat = ipToDNSFormat(nodeIP)
  if (!dnsFormat) {
    console.warn('[ApiClient] Could not convert node IP to DNS format:', nodeIP)

    return
  }

  setStickyBackendDNS(dnsFormat, loginPhrase)
}
