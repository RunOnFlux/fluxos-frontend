<script setup>
import navItems from "@/navigation/vertical"
import { themeConfig } from "@themeConfig"

import Footer from "@/layouts/components/Footer.vue"
import NavBarNotifications from "@/layouts/components/NavBarNotifications.vue"
import NavbarThemeSwitcher from "@/layouts/components/NavbarThemeSwitcher.vue"
import UserProfile from "@/layouts/components/UserProfile.vue"
import NavBarI18n from "@core/components/I18n.vue"
import { VerticalNavLayout } from "@layouts"

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
        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <NavbarThemeSwitcher />
        <NavBarNotifications class="mr-3" />
        <UserProfile />
      </div>
    </template>

    <slot />

    <template #footer>
      <Footer />
    </template>

    <TheCustomizer />
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
</style>
