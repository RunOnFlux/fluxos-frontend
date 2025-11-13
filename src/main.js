import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
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

// Handle chunk load failures (stale cache after deployment)
window.addEventListener('error', event => {
  const isChunkLoadError =
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Importing a module script failed') ||
    (event.target?.tagName === 'LINK' && event.target?.rel === 'stylesheet') ||
    (event.target?.tagName === 'SCRIPT')

  if (isChunkLoadError) {
    const hasReloaded = sessionStorage.getItem('chunk-reload-attempted')

    if (!hasReloaded) {
      console.log('Detected stale cache after deployment, reloading...')
      sessionStorage.setItem('chunk-reload-attempted', 'true')
      window.location.reload()
    } else {
      // Prevent infinite reload loop
      console.error('Chunk load failed even after reload, clearing cache marker')
      sessionStorage.removeItem('chunk-reload-attempted')
    }
  }
}, true)

// Clear reload marker on successful load
window.addEventListener('load', () => {
  sessionStorage.removeItem('chunk-reload-attempted')
})

// Create vue app
const app = createApp(App)

// Create and install head management
const head = createHead()
app.use(head)

registerPlugins(app)
app.directive('sanitize-html', sanitizeHtml)

// Mount vue app
app.mount('#app')
