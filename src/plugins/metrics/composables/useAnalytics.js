import { hasAnalyticsConsent } from '@/composables/useCookieConsent'

/**
 * Analytics composable for tracking events throughout the application
 * GDPR-compliant with consent checking
 * Auto-imports enabled via vite.config.js
 */
export function useAnalytics() {
  /**
   * Check if analytics tracking is allowed
   * @returns {boolean}
   */
  const canTrack = () => {
    // Always allow in development (logs to console only)
    if (import.meta.env.DEV) return true

    // In production, check consent
    return hasAnalyticsConsent()
  }

  /**
   * Track a custom event
   * @param {string} eventName - Event name (e.g., 'button_click', 'app_deploy')
   * @param {object} params - Event parameters
   */
  const trackEvent = (eventName, params = {}) => {
    // Check consent first
    if (!canTrack()) {
      return
    }

    if (!window.gtag) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Google Analytics not loaded')
      }

      return
    }

    try {
      // Device info is already set as user properties in analytics/index.js
      // No need to send with every event - reduces payload size
      const eventParams = {
        ...params,
        timestamp: new Date().toISOString(),
      }

      window.gtag('event', eventName, eventParams)

      if (import.meta.env.DEV) {
        console.log('📊 Analytics Event:', eventName, eventParams)
      }
    } catch (error) {
      console.error('Error tracking event:', error)
    }
  }

  /**
   * Track user authentication events
   * @param {string} method - Auth method (zelid, firebase, metamask, walletconnect)
   * @param {boolean} success - Whether auth was successful
   */
  const trackAuth = (method, success = true) => {
    trackEvent('user_authentication', {
      auth_method: method,
      auth_status: success ? 'success' : 'failed',
    })
  }

  /**
   * Track application deployment events
   * @param {string} appName - Application name
   * @param {string} action - Action (deploy, update, remove, start, stop)
   * @param {object} metadata - Additional metadata
   */
  const trackAppAction = (appName, action, metadata = {}) => {
    trackEvent('app_action', {
      app_name: appName,
      action_type: action,
      ...metadata,
    })
  }

  /**
   * Track marketplace interactions
   * @param {string} action - Action (view, search, filter, install)
   * @param {object} metadata - Additional metadata
   */
  const trackMarketplace = (action, metadata = {}) => {
    trackEvent('marketplace_interaction', {
      interaction_type: action,
      ...metadata,
    })
  }

  /**
   * Track FluxDrive interactions
   * @param {string} action - Action (upload, download, delete, share)
   * @param {object} metadata - File metadata
   */
  const trackFluxDrive = (action, metadata = {}) => {
    trackEvent('fluxdrive_action', {
      action_type: action,
      ...metadata,
    })
  }

  /**
   * Track xDAO interactions
   * @param {string} action - Action (view_proposal, vote, create_proposal)
   * @param {object} metadata - Proposal metadata
   */
  const trackXDAO = (action, metadata = {}) => {
    trackEvent('xdao_interaction', {
      interaction_type: action,
      ...metadata,
    })
  }

  /**
   * Track node management actions
   * @param {string} action - Action (update, restart, benchmark)
   * @param {object} metadata - Node metadata
   */
  const trackNodeAction = (action, metadata = {}) => {
    trackEvent('node_management', {
      action_type: action,
      ...metadata,
    })
  }

  /**
   * Track errors
   * @param {string} errorType - Error type/category
   * @param {string} errorMessage - Error message
   * @param {string} context - Where the error occurred
   */
  const trackError = (errorType, errorMessage, context = 'unknown') => {
    trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage?.substring(0, 500), // Limit message length (consistent with plugin)
      error_context: context,
      fatal: false,
    })
  }

  /**
   * Track checkout/payment events
   * @param {string} action - Action (begin_checkout, add_payment_info, purchase)
   * @param {object} metadata - Payment metadata
   */
  const trackCheckout = (action, metadata = {}) => {
    trackEvent(action, metadata)
  }

  /**
   * Track payment system selection
   * @param {string} paymentSystem - Payment system selected (fluxpay, cryptocom, zelcore, ssp)
   * @param {object} metadata - Additional context (plan, price, etc.)
   */
  const trackPaymentSystemSelected = (paymentSystem, metadata = {}) => {
    trackEvent('payment_system_selected', {
      payment_system: paymentSystem,
      ...metadata,
    })
  }

  return {
    trackEvent,
    trackAuth,
    trackAppAction,
    trackMarketplace,
    trackFluxDrive,
    trackXDAO,
    trackNodeAction,
    trackError,
    trackCheckout,
    trackPaymentSystemSelected,
  }
}
