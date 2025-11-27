/**
 * Google Analytics 4 Integration
 * GDPR-compliant analytics with consent management
 */

/**
 * Detect device type with consistent logic
 * @returns {string} Device type: mobile, tablet, or desktop
 */
export function detectDeviceType() {
  try {
    const userAgent = navigator.userAgent.toLowerCase()
    const width = window.innerWidth

    // Check for mobile devices first
    const isMobileDevice = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)

    // Check for tablets (including iPads)
    const isTabletDevice = /ipad|android(?!.*mobile)|tablet/i.test(userAgent)

    // Combine device detection with screen size for accuracy
    if (isTabletDevice || (isMobileDevice && width >= 768 && width <= 1024)) {
      return 'tablet'
    }

    if (isMobileDevice || width <= 768) {
      return 'mobile'
    }

    return 'desktop'
  } catch (error) {
    console.error('Error detecting device type:', error)
    
    return 'desktop' // Safe fallback
  }
}

/**
 * Get browser information
 * Detects major browsers including privacy-focused and alternative browsers
 * @returns {object} Browser name and version
 */
export function getBrowserInfo() {
  try {
    const userAgent = navigator.userAgent
    let browserName = 'Unknown'
    let browserVersion = 'Unknown'

    // Brave (check first - uses Chrome UA but has Brave property)
    // Note: Brave may block this detection in some configurations
    if (navigator.brave?.isBrave) {
      browserName = 'Brave'
      browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
    }

    // Samsung Internet (check before Chrome - uses Chrome engine)
    else if (userAgent.includes('SamsungBrowser')) {
      browserName = 'Samsung Internet'
      browserVersion = userAgent.match(/SamsungBrowser\/(\d+)/)?.[1] || 'Unknown'
    }

    // Opera GX and Opera (check before Chrome - uses Chrome engine)
    else if (userAgent.includes('OPR') || userAgent.includes('Opera')) {
      // Opera GX includes "OPR" but we can't reliably distinguish from regular Opera
      browserName = 'Opera'
      browserVersion = userAgent.match(/OPR\/(\d+)/)?.[1] || userAgent.match(/Opera\/(\d+)/)?.[1] || 'Unknown'
    }

    // Vivaldi (check before Chrome - uses Chrome engine)
    else if (userAgent.includes('Vivaldi')) {
      browserName = 'Vivaldi'
      browserVersion = userAgent.match(/Vivaldi\/(\d+)/)?.[1] || 'Unknown'
    }

    // Arc (check before Chrome - uses Chrome engine, identified by presence of Arc in UA)
    // Note: Arc browser detection is limited as it may not always identify itself
    else if (userAgent.includes('Arc')) {
      browserName = 'Arc'
      browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
    }

    // Edge (check before Chrome - uses Chromium)
    else if (userAgent.includes('Edg')) {
      browserName = 'Edge'
      browserVersion = userAgent.match(/Edg\/(\d+)/)?.[1] || 'Unknown'
    }

    // Chrome (check before Safari)
    else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserName = 'Chrome'
      browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
    }

    // Firefox
    else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox'
      browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
    }

    // Safari (must be last Chrome-based check)
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari'
      browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown'
    }

    return { browserName, browserVersion }
  } catch (error) {
    console.error('Error getting browser info:', error)

    return { browserName: 'Unknown', browserVersion: 'Unknown' }
  }
}

/**
 * Get screen resolution category
 * @returns {string} Resolution category
 */
export function getResolutionCategory() {
  try {
    const width = window.screen.width

    if (width <= 768) return 'small' // Mobile
    if (width <= 1024) return 'medium' // Tablet
    if (width <= 1920) return 'large' // Desktop HD
    
    return 'xlarge' // 2K/4K
  } catch (error) {
    console.error('Error getting resolution category:', error)
    
    return 'medium' // Safe fallback
  }
}

/**
 * Initialize Google Analytics 4
 * @param {object} app - Vue app instance
 */
export function setupAnalytics(app) {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
  const analyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
  const isProduction = import.meta.env.PROD
  const isDevelopment = import.meta.env.DEV

  // Don't initialize if no measurement ID
  if (!measurementId) {
    if (isDevelopment) {
      console.warn('⚠️ Google Analytics: VITE_GA_MEASUREMENT_ID not configured')
    }

    return
  }

  // Don't send analytics in development to avoid polluting production data
  if (isDevelopment) {
    console.log('📊 Analytics: Development mode - tracking disabled')

    // Create mock gtag for development (silent - avoids duplicate logging with main plugin)
    window.gtag = function() {}

    return
  }

  // Check if analytics is explicitly enabled (production safety check)
  if (!analyticsEnabled) {
    console.log('📊 Analytics: Disabled (VITE_ENABLE_ANALYTICS=false)')

    // Create mock gtag for disabled state (silent)
    window.gtag = function() {}

    return
  }

  // Initialize gtag function early so tracking calls don't fail during script load
  window.dataLayer = window.dataLayer || []
  window.gtag = function() {
    window.dataLayer.push(arguments)
  }

  // Set default consent to denied (GDPR compliance) before script loads
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    wait_for_update: 500,
  })

  try {
    // Load gtag.js script with error handling and timeout
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`

    // Script load timeout (10 seconds)
    const loadTimeout = 10000
    let timeoutId = null

    const handleScriptLoad = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      // Configure Google Analytics after script loads
      window.gtag('js', new Date())
      window.gtag('config', measurementId, {
        send_page_view: false, // We handle page views manually
        anonymize_ip: true, // GDPR: Anonymize IP addresses
        cookie_flags: 'SameSite=None;Secure', // Modern cookie settings
        app_version: import.meta.env.VITE_APP_VERSION || 'unknown',
      })

      // Get device info for custom dimensions (single call)
      const deviceType = detectDeviceType()
      const deviceCategory = deviceType === 'desktop' ? 'desktop' : 'mobile'
      const { browserName, browserVersion } = getBrowserInfo()
      const resolutionCategory = getResolutionCategory()

      // Set custom user properties (these persist across events)
      window.gtag('set', 'user_properties', {
        device_category: deviceCategory,
        device_type: deviceType,
        browser_name: browserName,
        browser_version: browserVersion,
        resolution_category: resolutionCategory,
      })
    }

    const handleScriptError = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      console.warn('⚠️ Google Analytics: Failed to load gtag.js script')

      // gtag function already exists as a no-op, so tracking calls won't throw
    }

    script.onload = handleScriptLoad
    script.onerror = handleScriptError

    // Set timeout for slow networks
    timeoutId = setTimeout(() => {
      if (!script.onload) return // Already handled
      console.warn('⚠️ Google Analytics: Script load timed out')
      script.onload = null
      script.onerror = null
    }, loadTimeout)

    document.head.appendChild(script)
  } catch (error) {
    console.error('Error initializing Google Analytics:', error)
  }
}
