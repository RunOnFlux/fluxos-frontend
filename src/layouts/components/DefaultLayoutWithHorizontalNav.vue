<script setup>
import navItems from "@/navigation/horizontal"
import { themeConfig } from "@themeConfig"

// Components
import BackendSelector from "@/@core/components/BackendSelector.vue"
import Footer from "@/layouts/components/Footer.vue"
import NavBarNotifications from "@/layouts/components/NavBarNotifications.vue"
import NavbarThemeSwitcher from "@/layouts/components/NavbarThemeSwitcher.vue"
import UserProfile from "@/layouts/components/UserProfile.vue"
import FluxAIToggler from "@/layouts/components/FluxAIToggler.vue"
import NavBarI18n from "@core/components/I18n.vue"
import LoginModal from "@/@core/components/LoginModal.vue"
import { HorizontalNavLayout } from "@layouts"
import { VNodeRenderer } from "@layouts/components/VNodeRenderer"
import { useSnackbar } from '@/composables/useSnackbar'
import { useLoginSheet } from '@/composables/useLoginSheet'
import { useFluxStore } from "@/stores/flux"
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"
import { ref } from "vue"

// Global snackbar
const { snackbar } = useSnackbar()

// Global login sheet
const { showLoginSheet, openLoginBottomSheet, closeLoginBottomSheet } = useLoginSheet()

// i18n
const { t } = useI18n()

// Flux store
const fluxStore = useFluxStore()
const { privilege } = storeToRefs(fluxStore)

// Customizer ref to open from navbar
const customizerRef = ref(null)

const openCustomizer = event => {
  if (customizerRef.value && customizerRef.value.openNavDrawer) {
    customizerRef.value.openNavDrawer(event)
  }
}

const handleLoginSuccess = () => {
  closeLoginBottomSheet()
}
</script>

<template>
  <HorizontalNavLayout :nav-items="navItems">
    <!-- 👉 navbar -->
    <template #navbar>
      <RouterLink
        to="/"
        class="app-logo d-flex align-center"
      >
        <div class="logo-wrapper">
          <VNodeRenderer :nodes="themeConfig.app.logo.value" />
        </div>
      </RouterLink>

      <VDivider vertical class="navbar-divider" />
      <BackendSelector />
      <FluxAIToggler class="ml-2 mr-2" />
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
      <!-- <NavbarShortcuts /> -->
      <NavBarNotifications v-show="privilege === 'admin' || privilege === 'fluxteam'" class="mr-3" />
      <UserProfile />
    </template>

    <!-- Login button in horizontal nav menu -->
    <template #after-horizontal-nav-items>
      <li v-if="privilege === 'none'" class="horizontal-nav-login-item">
        <VBtn
          color="primary"
          size="small"
          @click="openLoginBottomSheet"
        >
          <VIcon icon="mdi-login" size="20" class="mr-2" />
          {{ t('common.buttons.login') }}
        </VBtn>
      </li>
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
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
  </HorizontalNavLayout>
</template>

<style lang="scss" scoped>
.app-logo {
  display: flex;
  align-items: center;
  column-gap: 0.75rem;

  .app-logo-title {
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: 0.25px;
    line-height: 1.5rem;
    text-transform: capitalize;
  }
}

.logo-wrapper {
  max-height: 60px;
  max-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  margin-left: -0.5rem;

  svg {
    height: auto;
    width: 100%;
    display: block;
    object-fit: contain;
  }
}

.navbar-divider {
  height: 80% !important;
  align-self: center;
  margin-left: 1rem !important;
  margin-right: 1rem !important;
}

.horizontal-nav-login-item {
  display: flex;
  align-items: center;
  margin-left: auto;
  padding-left: 1rem;
}

/* Login Modal Styles */
.login-modal-wrapper {
  height: 100vh;
  overflow: hidden;
}

.login-split-layout {
  height: 100vh;
}

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

:deep(.v-theme--light) .login-background-image {
  background-image: url('/images/backgrounds/home_bg_light.jpg');
}

.login-background-content {
  position: relative;
  z-index: 2;
  height: 100%;
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
  color: white;
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

@media (max-width: 959px) {
  .login-background-side {
    display: none;
  }
  .login-form-side {
    height: 100vh;
  }
}
</style>
