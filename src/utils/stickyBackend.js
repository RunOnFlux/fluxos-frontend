/**
 * Sticky Backend Utility Module
 *
 * Solves DNS round-robin authentication issues by ensuring all authenticated
 * requests go to the same backend node that generated the loginPhrase.
 *
 * See: STICKY_BACKEND_IMPLEMENTATION_PLAN.md for details
 */

/**
 * Transforms IP:PORT to Flux DNS format
 * @param {string} ipPort - "185.209.30.228:16127"
 * @returns {string} - "https://185-209-30-228-16127.node.api.runonflux.io"
 */
export function ipToDNSFormat(ipPort) {
  if (!ipPort) return null

  const match = ipPort.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)$/)
  if (!match) return null

  const ip = match[1]
  const port = match[2]
  const sanitizedIp = ip.replace(/\./g, '-')

  return `https://${sanitizedIp}-${port}.node.api.runonflux.io`
}

/**
 * Extracts node IP:PORT from axios response
 * @param {AxiosResponse} response
 * @returns {string|null} - "185.209.30.228:16127" or null
 */
export function extractNodeIPFromResponse(response) {
  if (!response) return null

  // Try response headers first
  const headers = response.headers || {}

  // PRIORITY 1: Check for fluxnode header
  // Format examples:
  // - "server78_65.109.38.84"
  // - "server78_65.109.38.84:16127"
  // - "server78_65.109.38.84_16127"
  const fluxnode = headers['fluxnode']
  if (fluxnode) {
    // Try to match IP:PORT format (colon separator)
    const ipPortColonMatch = fluxnode.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)/)
    if (ipPortColonMatch) {
      return `${ipPortColonMatch[1]}:${ipPortColonMatch[2]}`
    }

    // Try to match IP_PORT format (underscore separator)
    const ipPortUnderscoreMatch = fluxnode.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})_(\d+)/)
    if (ipPortUnderscoreMatch) {
      return `${ipPortUnderscoreMatch[1]}:${ipPortUnderscoreMatch[2]}`
    }

    // Fallback: match IP only, default to port 16127
    const ipOnlyMatch = fluxnode.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/)
    if (ipOnlyMatch) {
      return `${ipOnlyMatch[1]}:16127`
    }
  }

  // PRIORITY 2: Check other headers
  const forwardedFor = headers['x-forwarded-for']
  const realIp = headers['x-real-ip']
  const fluxNodeIp = headers['x-flux-node-ip']

  // Check each header
  for (const headerValue of [fluxNodeIp, realIp, forwardedFor]) {
    if (headerValue) {
      // Extract first IP if comma-separated
      const ip = headerValue.split(',')[0].trim()
      const match = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
      if (match) {
        // Need to get port - try from baseURL or responseURL, default to 16127
        const port = extractPortFromURL(response.config?.baseURL || response.request?.responseURL) || '16127'
        
        return `${ip}:${port}`
      }
    }
  }

  // Fallback: parse from responseURL or baseURL
  const url = response.request?.responseURL || response.config?.baseURL
  if (url) {
    const match = url.match(/https?:\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)/)
    if (match) {
      return `${match[1]}:${match[2]}`
    }

    // Check for Flux DNS format: https://185-209-30-228-16127.node.api.runonflux.io
    const dnsMatch = url.match(/https?:\/\/(\d{1,3})-(\d{1,3})-(\d{1,3})-(\d{1,3})-(\d+)\.node\.api\.runonflux\.io/)
    if (dnsMatch) {
      const ip = `${dnsMatch[1]}.${dnsMatch[2]}.${dnsMatch[3]}.${dnsMatch[4]}`
      const port = dnsMatch[5]
      
      return `${ip}:${port}`
    }
  }

  return null
}

/**
 * Helper: Extract port from URL
 * @param {string} url
 * @returns {string|null}
 */
function extractPortFromURL(url) {
  if (!url) return null

  // Match explicit port
  const match = url.match(/:(\d+)/)
  if (match) return match[1]

  // Default ports
  if (url.startsWith('https://')) return '443'
  if (url.startsWith('http://')) return '80'

  return null
}

/**
 * Checks if URL is the round-robin DNS endpoint
 * @param {string} url - "https://api.runonflux.io"
 * @returns {boolean}
 */
export function isRoundRobinBackend(url) {
  if (!url) return false
  
  return url === 'https://api.runonflux.io' || url === 'http://api.runonflux.io'
}

/**
 * Retrieves sticky backend from sessionStorage
 * @returns {string|null}
 */
export function getStickyBackendDNS() {
  try {
    return sessionStorage.getItem('stickyBackendDNS')
  } catch (error) {
    console.error('Error reading stickyBackendDNS from sessionStorage:', error)
    
    return null
  }
}

/**
 * Stores sticky backend in sessionStorage
 * @param {string} dnsUrl - "https://185-209-30-228-16127.node.api.runonflux.io"
 */
export function setStickyBackendDNS(dnsUrl) {
  if (!dnsUrl) return

  try {
    sessionStorage.setItem('stickyBackendDNS', dnsUrl)
    console.log('[StickyBackend] Set sticky backend:', dnsUrl)
  } catch (error) {
    console.error('Error saving stickyBackendDNS to sessionStorage:', error)
  }
}

/**
 * Clears sticky backend from sessionStorage
 */
export function clearStickyBackendDNS() {
  try {
    const currentSticky = sessionStorage.getItem('stickyBackendDNS')
    if (currentSticky) {
      sessionStorage.removeItem('stickyBackendDNS')
      console.log('[StickyBackend] Cleared sticky backend:', currentSticky)
    }
  } catch (error) {
    console.error('Error clearing stickyBackendDNS from sessionStorage:', error)
  }
}

/**
 * Checks if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  try {
    const zelidauth = localStorage.getItem('zelidauth')
    
    return zelidauth !== null && zelidauth !== ''
  } catch (error) {
    console.error('Error checking authentication:', error)
    
    return false
  }
}
