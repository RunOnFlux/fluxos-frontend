/**
 * This is helper function to register plugins like a nuxt
 * To register a plugin just export a const function `defineVuePlugin` that takes `app` as argument and call `app.use`
 * For Scanning plugins it will include all files in `src/plugins` and `src/plugins/**\/index.ts`
 *
 *
 * @param {App} app Vue app instance
 *
 * @example
 * ```ts
 * // File: src/plugins/vuetify/index.ts
 *
 * import type { App } from 'vue'
 * import { createVuetify } from 'vuetify'
 *
 * const vuetify = createVuetify({ ... })
 *
 * export default function (app: App) {
 *   app.use(vuetify)
 * }
 * ```
 *
 * All you have to do is use this helper function in `main.ts` file like below:
 * ```ts
 * // File: src/main.ts
 * import { registerPlugins } from '@core/utils/plugins'
 * import { createApp } from 'vue'
 * import App from '@/App.vue'
 *
 * // Create vue app
 * const app = createApp(App)
 *
 * // Register plugins
 * registerPlugins(app) // [!code focus]
 *
 * // Mount vue app
 * app.mount('#app')
 * ```
 */
export const registerPlugins = async app => {
  // Dynamically import all plugin files
  const imports = import.meta.glob(['../../plugins/*.{ts,js}', '../../plugins/*/index.{ts,js}'], { eager: true })

  // Sort and log import paths for debugging
  const importPaths = Object.keys(imports).sort()

  console.log('Registering plugins from paths:', importPaths)

  for (const path of importPaths) {
    const pluginImportModule = imports[path]

    try {
      // If the plugin has a default export that is a function, call it with the app instance
      if (pluginImportModule.default) {
        console.log(`Initializing plugin: ${path}`)
        await pluginImportModule.default(app)
      } else {
        console.warn(`Plugin at ${path} does not have a default export`)
      }
    } catch (error) {
      console.error(`Error initializing plugin at ${path}:`, error)
    }
  }
}

