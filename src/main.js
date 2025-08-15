import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { createApp } from 'vue'
import sanitizeHtml from '@/utils/sanitizeHtml'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'

import process from 'process'
import { Buffer } from 'buffer'
import { EventEmitter2 } from 'eventemitter2'

window.process = process
window.Buffer = Buffer

// Create vue app
const app = createApp(App)

registerPlugins(app)
app.directive('sanitize-html', sanitizeHtml)

// Mount vue app
app.mount('#app')
