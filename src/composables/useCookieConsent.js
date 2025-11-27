/**
 * Cookie Consent Management Composable
 * GDPR-compliant consent management for analytics and cookies
 */

const CONSENT_KEY = 'flux_cookie_consent'
const CONSENT_VERSION = '1.0'

/**
 * Get user's cookie consent preferences
 * @returns {object|null} Consent object or null if not set
 */
export function getConsent() {
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) return null

    const consent = JSON.parse(stored)

    // Validate consent version
    if (consent.version !== CONSENT_VERSION) {
      return null
    }

    return consent
  } catch (error) {
    console.error('Error reading consent:', error)
    
    return null
  }
}

/**
 * Save user's cookie consent preferences
 * @param {object} preferences - Consent preferences
 */
export function saveConsent(preferences) {
  try {
    const consent = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      necessary: true, // Always true
      analytics: preferences.analytics || false,
    }

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))

    // Emit custom event for analytics to listen to
    window.dispatchEvent(new CustomEvent('consentUpdate', {
      detail: consent,
    }))
  } catch (error) {
    console.error('Error saving consent:', error)
  }
}

/**
 * Check if user has made a consent choice
 * @returns {boolean}
 */
export function hasConsent() {
  return getConsent() !== null
}

/**
 * Check if user has consented to analytics
 * @returns {boolean}
 */
export function hasAnalyticsConsent() {
  const consent = getConsent()
  
  return consent?.analytics === true
}

/**
 * Clear all consent data (for user data deletion requests)
 */
export function clearConsent() {
  try {
    localStorage.removeItem(CONSENT_KEY)

    // Disable analytics
    disableAnalytics()

    // Emit event
    window.dispatchEvent(new CustomEvent('consentCleared'))
  } catch (error) {
    console.error('Error clearing consent:', error)
  }
}

/**
 * Enable Google Analytics tracking
 */
export function enableAnalytics() {
  if (!window.gtag) {
    console.warn('Google Analytics not loaded')
    
    return
  }

  // Update consent mode
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
  })

  if (import.meta.env.DEV) {
    console.log('✅ Analytics enabled')
  }
}

/**
 * Disable Google Analytics tracking
 */
export function disableAnalytics() {
  if (!window.gtag) {
    return
  }

  // Update consent mode
  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
  })

  // Clear GA cookies
  clearGACookies()

  if (import.meta.env.DEV) {
    console.log('🔒 Analytics disabled')
  }
}

/**
 * Clear Google Analytics cookies
 */
function clearGACookies() {
  const cookies = document.cookie.split(';')

  for (let cookie of cookies) {
    const [name] = cookie.split('=')
    const trimmedName = name.trim()

    // Clear GA cookies
    if (trimmedName.startsWith('_ga') || trimmedName.startsWith('_gid')) {
      document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  }
}

/**
 * Export composable
 */
export function useCookieConsent() {
  return {
    getConsent,
    saveConsent,
    hasConsent,
    hasAnalyticsConsent,
    clearConsent,
    enableAnalytics,
    disableAnalytics,
  }
}
