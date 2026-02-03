import { useStorage } from '@vueuse/core'
import { useTheme } from 'vuetify'
import { useConfigStore } from '@core/stores/config'
import { cookieRef, namespaceConfig } from '@layouts/stores/config'
import { themeConfig } from '@themeConfig'

const _syncAppRtl = () => {
  const configStore = useConfigStore()
  const storedLang = cookieRef('language', null)
  const storedManualRtl = cookieRef('manualRtlOverride', null)
  const { locale } = useI18n({ useScope: 'global' })

  // Helper function to get RTL value for a language
  const getLangRtl = langCode => {
    if (themeConfig.app.i18n.langConfig && themeConfig.app.i18n.langConfig.length) {
      const lang = themeConfig.app.i18n.langConfig.find(l => l.i18nLang === langCode)
      
      return lang?.isRTL ?? false
    }
    
    return false
  }

  // TODO: Handle case where i18n can't read persisted value
  if (locale.value !== storedLang.value && storedLang.value)
    locale.value = storedLang.value

  // Initialize RTL based on current language if no manual override exists
  if (storedManualRtl.value === null && locale.value) {
    configStore.isAppRTL = getLangRtl(locale.value)
  }

  // watch and change lang attribute of html on language change
  watch(locale, val => {
    // Update lang attribute of html tag
    if (typeof document !== 'undefined')
      document.documentElement.setAttribute('lang', val)

    // Store selected language in cookie
    storedLang.value = val

    // Only auto-update RTL if there's no manual override
    // When user changes language, clear manual override and sync with language's RTL
    const rtlValue = getLangRtl(val)
    console.log(`[RTL Sync] Language changed to: ${val}, RTL should be: ${rtlValue}`)
    storedManualRtl.value = null
    configStore.isAppRTL = rtlValue
    console.log(`[RTL Sync] Set isAppRTL to: ${configStore.isAppRTL}`)
  }, { immediate: true })
}

const _handleSkinChanges = () => {
  const { themes } = useTheme()
  const configStore = useConfigStore()


  // Create skin default color so that we can revert back to original (default skin) color when switch to default skin from bordered skin
  Object.values(themes.value).forEach(t => {
    t.colors['skin-default-background'] = t.colors.background
    t.colors['skin-default-surface'] = t.colors.surface
  })
  watch(() => configStore.skin, val => {
    Object.values(themes.value).forEach(t => {
      t.colors.background = t.colors[`skin-${val}-background`]
      t.colors.surface = t.colors[`skin-${val}-surface`]
    })
  }, { immediate: true })
}


/*
    ℹ️ Set current theme's surface color in localStorage

    Why? Because when initial loader is shown (before vue is ready) we need to what's the current theme's surface color.
    We will use color stored in localStorage to set the initial loader's background color.

    With this we will be able to show correct background color for the initial loader even before vue identify the current theme.
  */
const _syncInitialLoaderTheme = () => {
  const vuetifyTheme = useTheme()

  watch(() => useConfigStore().theme, () => {
    // ℹ️ We are not using theme.current.colors.surface because watcher is independent and when this watcher is ran `theme` computed is not updated
    useStorage(namespaceConfig('initial-loader-bg'), null).value = vuetifyTheme.current.value.colors.surface
    useStorage(namespaceConfig('initial-loader-color'), null).value = vuetifyTheme.current.value.colors.primary
  }, { immediate: true })
}

const initCore = () => {
  _syncInitialLoaderTheme()
  _handleSkinChanges()

  // ℹ️ We don't want to trigger i18n in SK
  if (themeConfig.app.i18n.enable)
    _syncAppRtl()
}

export default initCore
