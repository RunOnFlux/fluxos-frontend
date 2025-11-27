import { createI18n } from 'vue-i18n'
import { cookieRef } from '@layouts/stores/config'
import { themeConfig } from '@themeConfig'

const messages = Object.fromEntries(
  Object.entries(
    import.meta.glob('./locales/*.json', { eager: true }),
  )
    .filter(([key]) => !key.includes('.backup') && !key.includes('-comprehensive'))
    .map(([key, value]) => {
      const locale = key.match(/\.\/locales\/(.+)\.json$/)[1]

      return [locale, value.default]
    }),
)

// Polish pluralization rules
// Returns: 0 for singular, 1 for few (2-4), 2 for many (5+)
const polishPluralizationRule = (choice, choicesLength) => {
  if (choice === 1) {
    return 0 // singular: 1 instancja
  }

  const n = Math.abs(choice)
  const i = Math.floor(n)
  const v10 = i % 10
  const v100 = i % 100

  // few: 2-4, 22-24, 32-34, etc. (excluding teens)
  if (v10 >= 2 && v10 <= 4 && (v100 < 12 || v100 > 14)) {
    return 1 // 2, 3, 4 instancje
  }

  // many: 0, 5-21, 25+
  return 2 // 5, 6, 7... instancji
}

let _i18n = null
export const getI18n = () => {
  if (_i18n === null) {
    _i18n = createI18n({
      legacy: false,
      locale: cookieRef('language', themeConfig.app.i18n.defaultLocale).value,
      fallbackLocale: 'en',
      messages,
      pluralRules: {
        pl: polishPluralizationRule,
      },
      globalInjection: true,
      missingWarn: false,
      fallbackWarn: false,
    })
  }

  return _i18n
}
export default function (app) {
  const i18n = getI18n()
  app.use(i18n)

  // Emit i18n-ready event for index.html Kapa AI widget initialization
  // This prevents 404 errors when trying to fetch locale JSON files directly
  if (typeof window !== 'undefined') {
    // Wait for next tick to ensure i18n is fully initialized
    setTimeout(() => {
      const disclaimer = i18n.global.t('components.fluxAIToggler.disclaimer',
        'Get instant answers about Flux products, deployment, and app management. Powered by AI trained on official docs, whitepapers, and support resources.')

      window.dispatchEvent(new CustomEvent('i18n-ready', {
        detail: { disclaimer },
      }))
    }, 0)
  }
}
