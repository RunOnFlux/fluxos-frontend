import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { createApp } from 'vue'
import sanitizeHtml from '@/utils/sanitizeHtml'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'

// Fonts
import '@fontsource/montserrat/700.css' // Bold
import '@fontsource/montserrat/600.css' // Semi-bold

import process from 'process'
import { Buffer } from 'buffer'
import { EventEmitter2 } from 'eventemitter2'

window.process = process
window.Buffer = Buffer

// Handle chunk load failures after deployment (stale cache)
window.addEventListener('error', event => {
  const RELOAD_MARKER = 'chunk-reload-attempted'

  // Helper: Check if URL is from same origin (our app)
  const isSameOriginResource = url => {
    if (!url) return false

    // Match same origin (e.g., https://cloud.runonflux.io)
    // This excludes third-party scripts like kapa.ai
    return url.startsWith(window.location.origin)
  }

  // Helper: Check if error is from our app's resources
  const isOwnResourceError = () => {
    const { target } = event

    if (!target) return false

    if (target.tagName === 'SCRIPT' && target.src) {
      return isSameOriginResource(target.src)
    }

    if (target.tagName === 'LINK' && target.rel === 'stylesheet' && target.href) {
      return isSameOriginResource(target.href)
    }

    return false
  }

  // Helper: Check if error is from dynamic import (code splitting)
  const isDynamicImportError = () => {
    if (event.target) return false

    const chunkErrorPatterns = [
      'Failed to fetch dynamically imported module',
      'Importing a module script failed'
    ]

    return chunkErrorPatterns.some(pattern => event.message?.includes(pattern))
  }

  // Determine if this is our app's chunk load error
  const isAppChunkError = isDynamicImportError() || isOwnResourceError()

  // Debug logging
  if (import.meta.env.DEV || sessionStorage.getItem('debug-errors')) {
    console.log('[Error Handler]', {
      isAppChunkError,
      message: event.message,
      target: event.target?.tagName,
      src: event.target?.src || event.target?.href
    })
  }

  // Handle reload logic for app errors only
  if (isAppChunkError) {
    const hasReloaded = sessionStorage.getItem(RELOAD_MARKER)

    if (!hasReloaded) {
      console.log('🔄 Stale cache detected, reloading page...')
      sessionStorage.setItem(RELOAD_MARKER, 'true')
      window.location.reload()
    } else {
      // Already reloaded once - prevent infinite loop
      console.error('❌ Chunk load failed after reload. Clearing reload marker.')
      sessionStorage.removeItem(RELOAD_MARKER)

      // Show user-friendly error message
      const errorDiv = document.createElement('div')
      errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #f44336;
        color: white;
        padding: 24px 32px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 999999;
        text-align: center;
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 90%;
      `
      errorDiv.innerHTML = `
        <h3 style="margin: 0 0 12px 0; font-size: 18px;">Failed to Load Application</h3>
        <p style="margin: 0 0 16px 0; font-size: 14px;">
          There was a problem loading the application resources.<br>
          Please try clearing your browser cache or contact support.
        </p>
        <button onclick="window.location.reload()" style="
          background: white;
          color: #f44336;
          border: none;
          padding: 8px 24px;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Try Again</button>
      `
      document.body.appendChild(errorDiv)
    }
  }
}, true)

// Clear reload marker on successful load
window.addEventListener('load', () => {
  sessionStorage.removeItem('chunk-reload-attempted')
})

// Create vue app
const app = createApp(App)

registerPlugins(app)
app.directive('sanitize-html', sanitizeHtml)

// Mount vue app
app.mount('#app')
