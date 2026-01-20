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

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              // New service worker activated, reload the page to avoid init errors
              console.log('🔄 New version available, reloading...')
              window.location.reload()
            }
          })
        })

        // Handle controller change (when skipWaiting is used)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Service Worker controller changed, reloading...')
          window.location.reload()
        })
      }).catch(error => {
        console.error('❌ Service Worker registration failed:', error)
      })
    })
  }
}
