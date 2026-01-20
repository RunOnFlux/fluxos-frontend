/**
 * PWA Service Worker Registration with Auto-Reload
 *
 * Handles service worker updates by automatically reloading the page
 * when a new version is available. This prevents initialization errors
 * caused by mixing cached and fresh modules.
 */

export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('✅ Service Worker registered:', registration)

        // Check for updates every hour
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)

        // Handle controller change (when skipWaiting is used)
        // This ensures we reload IMMEDIATELY when new SW takes control
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return
          refreshing = true
          console.log('🔄 Service Worker updated, reloading to prevent version conflicts...')

          // Reload immediately to prevent any lazy-loaded chunks from mixing versions
          window.location.reload()
        })
      }).catch(error => {
        console.error('❌ Service Worker registration failed:', error)
      })
    })
  }
}
