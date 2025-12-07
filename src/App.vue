<script setup>
import ScrollToTop from "@core/components/ScrollToTop.vue"
import initCore from "@core/initCore"
import { initConfigStore, useConfigStore } from "@core/stores/config"
import { hexToRgb } from "@core/utils/colorConverter"
import { logoRef } from "@themeConfig"
import { onMounted, watch } from "vue"
import { useTheme } from "vuetify"
import { useFluxStore } from '@/stores/flux'

const { global } = useTheme()

// Function to disable transitions temporarily during theme change
const disableTransitions = () => {
  document.documentElement.classList.add('theme-transitioning')
}

const enableTransitions = () => {
  // Use a small delay to ensure theme change is complete
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning')
  }, 50)
}

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()
function updateLogoByTheme() {
  const theme = global.current.value

  localStorage.setItem("vuexy-initial-loader-bg", theme.colors.background)
  localStorage.setItem("vuexy-initial-loader-color", theme.colors.primary)

  // Note: logoRef is already set to the Logo component in themeConfig
  // No need to override it here - the Logo component will handle its own styling
}

onMounted(() => {
  updateLogoByTheme()
  window.dispatchEvent(new Event("app-ready"))

  const fluxStore = useFluxStore()

  fluxStore.fetchFluxIDs()

  // Fetch server locations in background on app load
  // This will populate the data once for all pages that use ServerLocationsPanel
  fluxStore.fetchServerLocations()

  // Fetch Trustpilot data in background on app load
  // This will populate the data once for all pages that use TrustpilotPanel
  fluxStore.fetchTrustpilot()
})

watch(
  () => global.current.value.dark,
  val => {
    // Disable transitions during theme change to prevent wave effect
    disableTransitions()
    updateLogoByTheme()

    // Re-enable transitions after theme change is complete
    enableTransitions()
  },
)
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp
      :style="`--v-global-theme-primary: ${hexToRgb(
        global.current.value.colors.primary
      )}`"
    >
      <RouterView />
      <ScrollToTop />
      <CookieConsent />
    </VApp>
  </VLocaleProvider>
</template>

<style>
/* Disable all transitions during theme switching to prevent wave effect */
.theme-transitioning *,
.theme-transitioning *::before,
.theme-transitioning *::after {
  transition: none !important;
  animation: none !important;
}

/*
 * Theme-aware transitions - only apply to elements that need smooth theme changes
 * Using specific selectors instead of * for better performance
 */
html:not(.theme-transitioning) .v-app,
html:not(.theme-transitioning) .v-card,
html:not(.theme-transitioning) .v-btn,
html:not(.theme-transitioning) .v-chip,
html:not(.theme-transitioning) .v-list-item,
html:not(.theme-transitioning) .v-navigation-drawer,
html:not(.theme-transitioning) .v-app-bar,
html:not(.theme-transitioning) .v-toolbar,
html:not(.theme-transitioning) .v-footer,
html:not(.theme-transitioning) .v-dialog,
html:not(.theme-transitioning) .v-menu,
html:not(.theme-transitioning) .v-alert,
html:not(.theme-transitioning) .v-avatar,
html:not(.theme-transitioning) .v-badge,
html:not(.theme-transitioning) .v-table {
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

/* Modern scrollbar for TOS dialog */
.tos-scroll-area::-webkit-scrollbar {
  width: 12px !important;
}

.tos-scroll-area::-webkit-scrollbar-track {
  background: rgba(128, 128, 128, 0.3) !important;
  border-radius: 6px !important;
}

.tos-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.7) !important;
  border-radius: 6px !important;
}

.tos-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.9) !important;
}

.tos-scroll-area {
  scrollbar-width: thin !important;
  scrollbar-color: rgba(128, 128, 128, 0.7) rgba(128, 128, 128, 0.3) !important;
}
</style>
