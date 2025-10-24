<script setup>
import navItems from "@/navigation/vertical"
import { themeConfig } from "@themeConfig"

import Footer from "@/layouts/components/Footer.vue"
import NavBarNotifications from "@/layouts/components/NavBarNotifications.vue"
import NavbarThemeSwitcher from "@/layouts/components/NavbarThemeSwitcher.vue"
import NavBarMemoryMonitor from "@/layouts/components/NavBarMemoryMonitor.vue"
import UserProfile from "@/layouts/components/UserProfile.vue"
import NavBarI18n from "@core/components/I18n.vue"
import { VerticalNavLayout } from "@layouts"
import { useSnackbar } from '@/composables/useSnackbar'
import { useLoginSheet } from '@/composables/useLoginSheet'
import { useFluxStore } from "@/stores/flux"
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"
import { ref, computed } from "vue"
import LoginModal from "@/@core/components/LoginModal.vue"
import { useConfigStore } from "@core/stores/config"
import { useLayoutConfigStore } from "@layouts/stores/config"
import fluxCloudLogoDark from "@images/fluxcloud_logo_dark.svg?url"
import fluxCloudLogoLight from "@images/fluxcloud_logo_light.svg?url"

// Global snackbar
const { snackbar } = useSnackbar()

// Global login sheet
const { showLoginSheet, openLoginBottomSheet, closeLoginBottomSheet } = useLoginSheet()

// i18n and store
const { t } = useI18n()
const fluxStore = useFluxStore()
const { privilege } = storeToRefs(fluxStore)
const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)
const layoutConfigStore = useLayoutConfigStore()
const { isVerticalNavCollapsed, isLessThanOverlayNavBreakpoint } = storeToRefs(layoutConfigStore)

// Function to determine if login text should be hidden
// This will be called from the template with the isHovered slot prop
const shouldHideLoginText = isHovered => {
  const result = isVerticalNavCollapsed.value &&
    !isHovered &&
    !isLessThanOverlayNavBreakpoint.value

  console.log('Login button shouldHideLoginText:', {
    isVerticalNavCollapsed: isVerticalNavCollapsed.value,
    isHovered: isHovered,
    isLessThanOverlayNavBreakpoint: isLessThanOverlayNavBreakpoint.value,
    result: result,
  })

  return result
}

// Theme-aware FluxCloud logo (dark logo = black text for light backgrounds, light logo = white text for dark backgrounds)
const fluxLogo = computed(() => theme.value === 'dark' ? fluxCloudLogoLight : fluxCloudLogoDark)

// Customizer ref to open from navbar
const customizerRef = ref(null)

const openCustomizer = (event) => {
  if (customizerRef.value && customizerRef.value.openNavDrawer) {
    customizerRef.value.openNavDrawer(event)
  }
}

const handleLoginSuccess = () => {
  closeLoginBottomSheet()
}

// const dropdownOpen = ref(false)
// const customBackend = ref("")
// const backendURL = ref("")
// const customBackendHistory = ref([])
// const showHistory = ref(false)

// const STORAGE_KEY = "backendURL"
// const HISTORY_KEY = "customBackendHistory"

 
// const backendRegex = /^(https?:\/\/(localhost|((\d{1,3}\.){3}\d{1,3})|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d+)?)(\/.*)?$/
// const isValidBackendUrl = url => backendRegex.test(url)

// onMounted(() => {
//   const saved = localStorage.getItem(STORAGE_KEY)
//   if (saved) backendURL.value = saved

//   const history = localStorage.getItem(HISTORY_KEY)
//   if (history) {
//     try {
//       customBackendHistory.value = JSON.parse(history)
//     } catch {
//       customBackendHistory.value = []
//     }
//   }
// })

// const saveBackend = input => {
//   const finalUrl = typeof input === "string" ? input.trim() : ""

//   console.log("💾 saveBackend received:", finalUrl)

//   if (!finalUrl) {
//     console.warn("⚠️ Input is empty.")

//     return
//   }

//   if (!isValidBackendUrl(finalUrl)) {
//     console.warn("❌ Invalid URL format:", finalUrl)

//     return
//   }

//   backendURL.value = finalUrl
//   localStorage.setItem(STORAGE_KEY, finalUrl)
//   console.log("✅ backendURL updated & stored in localStorage:", finalUrl)

//   const isPredefined = ["https://api.runonflux.io"].includes(finalUrl)

//   if (!isPredefined) {
//     const historyBefore = [...customBackendHistory.value]
//     if (!customBackendHistory.value.includes(finalUrl)) {
//       customBackendHistory.value.unshift(finalUrl)
//       customBackendHistory.value = customBackendHistory.value.slice(0, 10)
//       localStorage.setItem(HISTORY_KEY, JSON.stringify(customBackendHistory.value))
//       console.log("📝 History updated and saved:", customBackendHistory.value)
//     } else {
//       console.info("ℹ️ URL already exists in history:", finalUrl)
//     }
//   }
// }

// watch(dropdownOpen, isOpen => {
//   console.log("📂 Dropdown open:", isOpen)
//   if (isOpen) {
//     customBackend.value = backendURL.value
//   } else {
//     nextTick(() => {
//       if (customBackend.value && customBackend.value !== backendURL.value) {
//         console.log("📤 Dropdown closed. Saving customBackend:", customBackend.value)
//         saveBackend(customBackend.value)
//       }
//     })
//   }
// })
</script>

<template>
  <VerticalNavLayout :nav-items="navItems">
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn
          id="vertical-nav-toggle-btn"
          class="ms-n3 d-lg-none mr-1"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon
            size="26"
            icon="tabler-menu-2"
          />
        </IconBtn>
        <div class="d-none d-sm-flex">
          <BackendSelector />
        </div>
        <VSpacer />
        <IconBtn
          class="d-none d-lg-block"
          @click="openCustomizer"
        >
          <VIcon
            size="22"
            icon="tabler-settings"
          />
        </IconBtn>
        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <NavbarThemeSwitcher />
        <NavBarMemoryMonitor />
        <NavBarNotifications class="mr-3" />
        <UserProfile />
      </div>
    </template>

    <!-- Login button in vertical nav -->
    <template #after-vertical-nav-items="{ isHovered }">
      <div v-if="privilege === 'none'" class="vertical-nav-login-button">
        <VBtn
          variant="flat"
          color="primary"
          block
          class="text-none"
          @click="openLoginBottomSheet"
        >
          <VIcon icon="mdi-login" size="20" class="login-icon" />
          <span v-if="!shouldHideLoginText(isHovered)" class="nav-item-title">
            {{ t('common.buttons.login') }}
          </span>
        </VBtn>
      </div>
    </template>

    <slot />

    <template #footer>
      <Footer />
    </template>

    <TheCustomizer ref="customizerRef" hide-toggle-button />

    <!-- Global Snackbar -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top"
    >
      <div class="d-flex align-center gap-2">
        <VIcon v-if="snackbar.icon" :icon="snackbar.icon" />
        <span>{{ snackbar.message }}</span>
      </div>
    </VSnackbar>

    <!-- Login Bottom Sheet - Full Screen -->
    <VDialog
      v-model="showLoginSheet"
      fullscreen
      transition="dialog-bottom-transition"
      scrim="rgba(0, 0, 0, 0.5)"
    >
      <div class="login-modal-wrapper">
        <!-- Split Layout: Background Left, Login Right -->
        <VRow no-gutters class="login-split-layout">
          <!-- LEFT SIDE: Background Image with Content -->
          <VCol cols="12" md="6" class="login-background-side">
            <div class="login-background-image"></div>
            <div class="login-background-content">
              <VContainer fluid class="fill-height">
                <VRow class="fill-height" align="center" justify="center">
                  <VCol cols="11" sm="10">
                    <div class="login-card-content">
                      <h2 class="web3-heading mb-3">
                        Start your Web 3.0 Journey
                      </h2>
                      <div class="gradient-divider mb-4"></div>
                      <h1 class="fluxcloud-text">
                        <span class="flux-white">Flux</span><span class="cloud-gradient">Cloud</span>
                      </h1>
                    </div>
                  </VCol>
                </VRow>
              </VContainer>
            </div>
          </VCol>

          <!-- RIGHT SIDE: Login Form with Overlay -->
          <VCol cols="12" md="6" class="login-form-side">
            <div class="login-modal-content-wrapper">
              <VBtn
                icon="mdi-close"
                variant="text"
                size="small"
                class="close-button"
                @click="closeLoginBottomSheet"
              />
              <div class="login-modal-content pa-6">
                <VContainer>
                  <VRow justify="center">
                    <VCol cols="12">
                      <LoginModal @loginSuccess="handleLoginSuccess" />
                    </VCol>
                  </VRow>
                </VContainer>
              </div>
            </div>
          </VCol>
        </VRow>
      </div>
    </VDialog>
  </VerticalNavLayout>
</template>

<style scoped>
.v-btn,
.v-list-item,
.v-checkbox,
.v-text-field,
.v-autocomplete {
  text-transform: none;
}

/* Vertical Nav Login Button */
.vertical-nav-login-button {
  padding: 16px;
  position: sticky;
  bottom: 0;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  display: flex;
  justify-content: center;
  align-items: center;
}

.vertical-nav-login-button .v-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.vertical-nav-login-button .login-icon {
  margin-inline-end: 8px;
  flex-shrink: 0;
  transition: none;
}

.vertical-nav-login-button .nav-item-title {
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.login-modal-wrapper {
  height: 100vh;
  overflow: hidden;
}

/* Split layout row */
.login-split-layout {
  height: 100vh;
}

/* LEFT SIDE: Background Image with Content Overlay */
.login-background-side {
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.login-background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/backgrounds/home_bg_dark.jpg');
  background-size: cover;
  background-position: center center;
  z-index: 0;
}

/* Add surface color overlay on top of background image */
.login-background-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(var(--v-theme-surface), 0.7);
  z-index: 1;
}

/* Light theme background */
:deep(.v-theme--light) .login-background-image {
  background-image: url('/images/backgrounds/home_bg_light.jpg');
}

/* Content overlay on left side */
.login-background-content {
  position: relative;
  z-index: 2;
  height: 100%;
}

/* Info card with semi-transparent white background - matching FluxCloud */
.login-info-card {
  background: rgba(255, 255, 255, 0.55) !important;
  backdrop-filter: blur(10px);
  border-radius: 16px !important;
}

/* Dark theme: darker card background */
:deep(.v-theme--dark) .login-info-card {
  background: rgba(255, 255, 255, 0.25) !important;
}

.login-card-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.web3-heading {
  color: white;
  font-size: 20px;
  font-weight: 700;
  font-family: Montserrat, 'Segoe UI', system-ui, -apple-system, sans-serif;
  margin: 0;
  line-height: 1.2;
}

.gradient-divider {
  width: 100px;
  height: 3px;
  background: linear-gradient(135deg, #2B61D1 0%, #9c93ff 50%, #2B61D1 100%);
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}

.fluxcloud-text {
  font-size: 80px;
  font-weight: 700;
  font-family: Montserrat, 'Segoe UI', system-ui, -apple-system, sans-serif;
  margin: 0;
  line-height: 1;
  display: flex;
  align-items: baseline;
}

.flux-white {
  color: rgb(var(--v-theme-on-surface));
  display: inline;
  vertical-align: baseline;
}

.cloud-gradient {
  background: linear-gradient(135deg, #2B61D1 0%, #9c93ff 50%, #2B61D1 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 3s ease infinite, text-glow 2s ease-in-out infinite;
  display: inline;
  vertical-align: baseline;
}

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes text-glow {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(43, 97, 209, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 40px rgba(43, 97, 209, 0.8));
  }
}

/* RIGHT SIDE: Login Form with semi-transparent overlay */
.login-form-side {
  height: 100vh;
  overflow: hidden;
}

.login-modal-content-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  position: relative;
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.login-modal-content {
  flex: 1;
  overflow: visible;
}

/* Mobile: hide left side, show only right side */
@media (max-width: 959px) {
  .login-background-side {
    display: none;
  }
  .login-form-side {
    height: 100vh;
  }
}
</style>
