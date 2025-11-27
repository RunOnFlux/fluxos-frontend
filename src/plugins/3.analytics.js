import { setupAnalytics } from './analytics/setup'
import { hasAnalyticsConsent, enableAnalytics, disableAnalytics } from '@/composables/useCookieConsent'

/**
 * Google Analytics Plugin
 * Load order: 3 (after router and pinia)
 *
 * Features:
 * - GDPR-compliant with consent management
 * - Single page view tracking (no duplication)
 * - Automatic route change tracking
 * - Development mode support (no data sent)
 * - IP anonymization enabled
 * - Custom dimensions for device/browser tracking
 * - Global error tracking
 * - User engagement/time-on-page tracking
 * - Dynamic consent updates via event listener
 *
 * Note: Router is accessed dynamically to avoid circular dependencies
 */

// Cleanup functions stored per app instance to avoid memory leaks
// Using WeakMap ensures cleanup references don't prevent garbage collection
const appCleanupMap = new WeakMap()

/**
 * Setup global error handler for tracking unhandled errors
 * @param {object} app - Vue app instance
 */
function setupGlobalErrorHandler(app) {
  // Vue error handler for component errors
  const originalErrorHandler = app.config.errorHandler
  app.config.errorHandler = (err, instance, info) => {
    // Track the error
    trackError('vue_error', err?.message || 'Unknown error', info || 'unknown')

    // Call original handler if exists
    if (originalErrorHandler) {
      originalErrorHandler(err, instance, info)
    } else {
      console.error('Vue Error:', err)
    }
  }

  // Global unhandled promise rejection handler
  const unhandledRejectionHandler = event => {
    const error = event.reason
    trackError(
      'unhandled_promise_rejection',
      error?.message || String(error) || 'Unknown rejection',
      'global',
    )
  }
  window.addEventListener('unhandledrejection', unhandledRejectionHandler)

  // Global error handler for uncaught errors (excluding chunk load errors handled in main.js)
  const globalErrorHandler = event => {
    // Skip chunk load errors - they're handled in main.js
    if (event.message?.includes('dynamically imported module') ||
        event.message?.includes('module script failed')) {
      return
    }

    trackError(
      'uncaught_error',
      event.message || 'Unknown error',
      event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : 'unknown',
    )
  }
  window.addEventListener('error', globalErrorHandler)

  // Return cleanup function
  return () => {
    window.removeEventListener('unhandledrejection', unhandledRejectionHandler)
    window.removeEventListener('error', globalErrorHandler)
  }
}

/**
 * Track error to analytics
 */
function trackError(errorType, errorMessage, context) {
  if (!window.gtag) return
  if (!hasAnalyticsConsent() && import.meta.env.PROD) return

  try {
    window.gtag('event', 'error', {
      error_type: errorType,
      error_message: errorMessage?.substring(0, 500), // Limit message length
      error_context: context,
      fatal: false,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    // Silently fail - don't cause more errors trying to track errors
    console.warn('Failed to track error:', e)
  }
}

// Maximum engagement time to track (1 hour in milliseconds)
// Prevents unbounded tracking if tab stays open for days
const MAX_ENGAGEMENT_TIME_MS = 3600 * 1000

/**
 * Setup engagement/time-on-page tracking
 * @param {object} router - Vue router instance
 */
function setupEngagementTracking(router) {
  let pageStartTime = Date.now()
  let currentPath = window.location.pathname
  let visibilityStartTime = Date.now()
  let totalVisibleTime = 0
  let isPageVisible = !document.hidden

  // Track time when page visibility changes
  const visibilityHandler = () => {
    if (document.hidden) {
      // Page became hidden - accumulate visible time
      if (isPageVisible) {
        totalVisibleTime += Date.now() - visibilityStartTime
      }
      isPageVisible = false
    } else {
      // Page became visible - start new visible period
      visibilityStartTime = Date.now()
      isPageVisible = true
    }
  }
  document.addEventListener('visibilitychange', visibilityHandler)

  // Track engagement when navigating away
  const trackEngagement = (path, startTime) => {
    if (!window.gtag) return
    if (!hasAnalyticsConsent() && import.meta.env.PROD) return

    // Calculate total visible time
    let engagementTime = totalVisibleTime
    if (isPageVisible) {
      engagementTime += Date.now() - visibilityStartTime
    }

    // Cap engagement time to prevent unrealistic values from long-open tabs
    engagementTime = Math.min(engagementTime, MAX_ENGAGEMENT_TIME_MS)

    const engagementSeconds = Math.round(engagementTime / 1000)

    // Only track if user spent meaningful time (> 1 second)
    if (engagementSeconds > 1) {
      try {
        window.gtag('event', 'user_engagement', {
          page_path: path,
          engagement_time_seconds: engagementSeconds,
          total_time_seconds: Math.min(
            Math.round((Date.now() - startTime) / 1000),
            MAX_ENGAGEMENT_TIME_MS / 1000,
          ),
        })
      } catch (e) {
        console.warn('Failed to track engagement:', e)
      }
    }
  }

  // Track on route change - use afterEach to avoid race condition
  // beforeEach runs async and navigation may be cancelled/fail
  // afterEach only fires after navigation has successfully completed
  const routeChangeHandler = router.afterEach((to, from) => {
    if (from.path && from.path !== to.path) {
      trackEngagement(from.path, pageStartTime)
    }

    // Reset for new page - safe now because navigation completed
    pageStartTime = Date.now()
    currentPath = to.path
    totalVisibleTime = 0
    visibilityStartTime = Date.now()
    isPageVisible = !document.hidden
  })

  // Track on page unload
  const beforeUnloadHandler = () => {
    trackEngagement(currentPath, pageStartTime)
  }
  window.addEventListener('beforeunload', beforeUnloadHandler)

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', visibilityHandler)
    window.removeEventListener('beforeunload', beforeUnloadHandler)
    routeChangeHandler() // Unsubscribe from router
  }
}

/**
 * Setup consent event listener for dynamic enable/disable
 */
function setupConsentListener() {
  const handler = event => {
    const consent = event.detail
    if (consent?.analytics) {
      enableAnalytics()
      if (import.meta.env.DEV) {
        console.log('✅ Analytics: Consent granted, tracking enabled')
      }
    } else {
      disableAnalytics()
      if (import.meta.env.DEV) {
        console.log('🔒 Analytics: Consent revoked, tracking disabled')
      }
    }
  }

  window.addEventListener('consentUpdate', handler)

  // Also listen for consent cleared event
  const clearedHandler = () => {
    disableAnalytics()
    if (import.meta.env.DEV) {
      console.log('🔒 Analytics: Consent cleared, tracking disabled')
    }
  }
  window.addEventListener('consentCleared', clearedHandler)

  // Return cleanup function
  return () => {
    window.removeEventListener('consentUpdate', handler)
    window.removeEventListener('consentCleared', clearedHandler)
  }
}

/**
 * Cleanup all analytics resources for an app instance
 * @param {object} app - Vue app instance
 */
function cleanupAnalytics(app) {
  const cleanup = appCleanupMap.get(app)
  if (!cleanup) return

  // Call all cleanup functions
  cleanup.forEach(fn => {
    try {
      fn()
    } catch (e) {
      console.warn('Analytics cleanup error:', e)
    }
  })

  // Clear the cleanup array
  appCleanupMap.delete(app)
}

export default function (app) {
  // Prevent double initialization
  if (appCleanupMap.has(app)) {
    console.warn('Analytics plugin already initialized for this app instance')

    return
  }

  // Initialize cleanup array for this app
  const cleanupFunctions = []
  appCleanupMap.set(app, cleanupFunctions)

  // Initialize Google Analytics (handles GDPR consent, dev mode, etc.)
  setupAnalytics(app)

  // Setup consent event listener for dynamic enable/disable
  const cleanupConsentListener = setupConsentListener()
  cleanupFunctions.push(cleanupConsentListener)

  // Setup global error handler
  const cleanupErrorHandler = setupGlobalErrorHandler(app)
  cleanupFunctions.push(cleanupErrorHandler)

  // Setup automatic page view tracking on route changes
  // Access router from app instance to avoid import issues
  const router = app.config.globalProperties.$router

  if (!router) {
    console.error('Analytics: Router not found on app instance')

    return
  }

  // Setup engagement tracking
  const cleanupEngagementTracker = setupEngagementTracking(router)
  cleanupFunctions.push(cleanupEngagementTracker)

  // Track page views on route navigation
  // This is the ONLY place where page views are tracked (no triple tracking)
  const routerUnsubscribe = router.afterEach((to, from) => {
    // Skip if navigation failed or was cancelled
    if (!to.name) return

    // Only track if user has consented and gtag is available
    if (!window.gtag) return

    // Check consent before tracking
    if (!hasAnalyticsConsent() && import.meta.env.PROD) {
      return // Don't track without consent in production
    }

    try {
      const pageTitle = to.meta?.title || to.name || document.title
      const pagePath = to.path

      // Device info is already set as user properties in analytics/setup.js
      // No need to send with page_view - reduces payload size
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_path: pagePath,
        page_location: window.location.href,
      })

      // Track navigation path (if coming from another page)
      if (from.name) {
        window.gtag('event', 'navigation', {
          from_page: from.path,
          to_page: to.path,
          navigation_type: 'route_change',
        })
      }
    } catch (error) {
      console.error('Error tracking page view:', error)
    }
  })
  cleanupFunctions.push(routerUnsubscribe)

  // Register cleanup with Vue's app lifecycle using onUnmounted pattern
  // Store original unmount and wrap it
  const originalUnmount = app.unmount.bind(app)
  app.unmount = function() {
    cleanupAnalytics(app)

    return originalUnmount()
  }

  // Also expose cleanup for manual use if needed
  app.config.globalProperties.$analyticsCleanup = () => cleanupAnalytics(app)
}
