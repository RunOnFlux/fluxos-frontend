import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { createApp } from 'vue'
import sanitizeHtml from '@/utils/sanitizeHtml'
import { router } from '@/plugins/1.router/index.js'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'

// Fonts
import '@fontsource/montserrat/700.css' // Bold
import '@fontsource/montserrat/600.css' // Semi-bold

import process from 'process'
import { Buffer as BufferPolyfill } from 'buffer'
import { EventEmitter2 } from 'eventemitter2'

// Create a Buffer wrapper that supports the old Buffer(data) syntax for backward compatibility
// Some libraries still use the deprecated Buffer() constructor syntax
const BufferWrapper = function(data, encoding) {
  if (!(this instanceof BufferWrapper)) {
    // Called without 'new' - use Buffer.from() for backward compatibility
    if (typeof data === 'number') {
      return BufferPolyfill.alloc(data)
    }
    return BufferPolyfill.from(data, encoding)
  }
  // Called with 'new'
  return BufferPolyfill.from(data, encoding)
}

// Copy all static methods from Buffer to our wrapper
Object.setPrototypeOf(BufferWrapper, BufferPolyfill)
BufferWrapper.prototype = BufferPolyfill.prototype

// Copy all static properties
Object.getOwnPropertyNames(BufferPolyfill).forEach(prop => {
  if (prop !== 'prototype' && prop !== 'length' && prop !== 'name') {
    BufferWrapper[prop] = BufferPolyfill[prop]
  }
})

// Handle backend URL parameter from FluxOS redirect
// This allows FluxOS instances to redirect users to cloud.runonflux.com
// while maintaining connection to their specific FluxOS backend
try {
  const urlParams = new URLSearchParams(window.location.search)
  const backendParam = urlParams.get('backend')

  if (backendParam) {
    const backendUrl = decodeURIComponent(backendParam)

    // Basic validation: should be http:// or https:// followed by IP/domain:port
    // Supports: http://192.168.1.1:16127, https://myflux.com:16127, http://localhost:16127
    const urlPattern = /^https?:\/\/([\w.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/

    if (urlPattern.test(backendUrl)) {
      // Store in localStorage for ApiClient to use
      localStorage.setItem('backendURL', backendUrl)
      console.log('✅ Backend URL set from redirect:', backendUrl)
      // URL cleanup happens after Vue Router is ready (see bottom of file)
    } else {
      console.warn('⚠️ Invalid backend URL format:', backendUrl)
    }
  }
} catch (error) {
  console.error('❌ Error handling backend parameter:', error)
}

window.process = process
window.Buffer = BufferWrapper
window.global = window.global || window

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

// Clean up backend parameter from URL after Vue Router is ready
// Vue Router navigation happens after mount, so we wait for it to be ready
router.isReady().then(() => {
  if (window.location.search.includes('backend=')) {
    // Use router.replace to ensure Vue Router updates its internal state
    // Preserve other query parameters, only remove 'backend'
    const currentRoute = router.currentRoute.value
    const cleanQuery = { ...currentRoute.query }
    delete cleanQuery.backend

    router.replace({
      path: currentRoute.path,
      query: cleanQuery,
      hash: currentRoute.hash
    })
    console.log('✅ Backend parameter removed from URL')
  }
})
