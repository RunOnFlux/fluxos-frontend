<script setup>
import { computed, onMounted, ref } from "vue"
import { useI18n } from 'vue-i18n'
import { eventBus } from "@/utils/eventBus"

const { t } = useI18n()

const dropdownOpen = ref(false)
const showHistory = ref(false)
const backendUrl = ref("")
const customBackend = ref("")
const customBackendHistory = ref([])
const detectedURL = ref("")
const ipPortPattern = /^http:\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)$/
const tooltipVisible = ref(false)

const STORAGE_KEY = "backendURL"
const HISTORY_KEY = "customBackendHistory"

const isValidUrl = url => {
   
  const ipWithPort = /^(https?:\/\/(\d{1,3}\.){3}\d{1,3}:\d+)(\/.*)?$/
   
  const domainOrLocalhost = /^(https?:\/\/(localhost|([\w-]+\.)+[a-zA-Z]{2,})(:\d+)?)(\/.*)?$/
  
  return ipWithPort.test(url) || domainOrLocalhost.test(url)
}

const normalizeUrl = url => {
  try {
    const parsed = new URL(url.trim())

    parsed.hostname = parsed.hostname.toLowerCase()

    let result = parsed.toString()
    result = result.replace(/\/+$/, "") // Remove all trailing slashes

    return result
  } catch {
    return url.trim()
  }
}

const transformUrl = url => {
  const match = url.match(ipPortPattern)
  if (match) {
    const ip = match[1] // Extracted IP
    const port = match[2] // Extracted port
    const sanitizedIp = ip.replace(/\./g, '-')

    saveBackend(`https://${sanitizedIp}-${port}.node.api.runonflux.io`)

    return `https://${sanitizedIp}-${port}.node.api.runonflux.io`
  }
  
  return url // Return the original value if no match
}

const toggleUrlFormat = event => {
  event.stopPropagation() // Prevent the event from propagating further
  backendUrl.value = transformUrl(backendUrl.value) // Set the transformed URL
  tooltipVisible.value = false
}

const filteredHistory = computed(() =>
  customBackendHistory.value.filter(
    item =>
      !customBackend.value ||
      normalizeUrl(item).toLowerCase().includes(customBackend.value.toLowerCase()),
  ),
)

const saveBackend = input => {
  const url = typeof input === "string" ? input.trim() : ""
  if (!url || !isValidUrl(url)) return

  const normalizedUrl = normalizeUrl(url)
  const normalizedCurrent = normalizeUrl(backendUrl.value)

  if (normalizedUrl === normalizedCurrent) return

  backendUrl.value = normalizedUrl
  localStorage.setItem(STORAGE_KEY, normalizedUrl)
  eventBus.emit("backendURLChanged", normalizedUrl)

  const isPredefined = ["https://api.runonflux.io", normalizeUrl(detectedURL.value)].includes(normalizedUrl)
  if (!isPredefined) {
    const existingIndex = customBackendHistory.value.findIndex(
      entry => normalizeUrl(entry) === normalizedUrl,
    )

    if (existingIndex !== -1) {
      customBackendHistory.value.splice(existingIndex, 1)
    }

    customBackendHistory.value.unshift(normalizedUrl)

    const uniqueList = [...new Set(customBackendHistory.value)].slice(0, 10)

    customBackendHistory.value = uniqueList
    localStorage.setItem(HISTORY_KEY, JSON.stringify(uniqueList))
  }
}

const handleEnter = () => {
  saveBackend(customBackend.value)
  dropdownOpen.value = false
}

const handleBlur = () => {
  showHistory.value = false
  saveBackend(customBackend.value)
}

onMounted(() => {
  try {
    let mybackend = ""
    const { protocol, hostname, port } = window.location

    mybackend += protocol + "//"

    const regex = /[A-Z]/i

    if (hostname.split("-")[4]) {
      const splitted = hostname.split("-")
      const names = splitted[4].split(".")
      const adjP = +names[0] + 1

      names[0] = adjP.toString()
      names[2] = "api"
      splitted[4] = ""
      mybackend += splitted.join("-") + names.join(".")
    } else if (regex.test(hostname)) {
      const names = hostname.split(".")

      names[0] = "api"
      mybackend += names.join(".")
    } else {
      mybackend += hostname

      const numericPort = parseInt(port, 10)
      if (numericPort > 16100) {
        mybackend += `:${numericPort + 1}`
        detectedURL.value = mybackend
      } else {
        mybackend = "https://api.runonflux.io"
      }
    }

    if (mybackend.endsWith("//api")) {
      mybackend = "https://api.runonflux.io"
    }

    const saved = localStorage.getItem(STORAGE_KEY)

    backendUrl.value = saved || mybackend

    const history = localStorage.getItem(HISTORY_KEY)
    if (history) {
      try {
        customBackendHistory.value = JSON.parse(history)
      } catch {
        customBackendHistory.value = []
      }
    }

    customBackend.value = backendUrl.value
  } catch (e) {
    console.error("❌ Error detecting default backend:", e)
  }
})
</script>

<template>
  <div class="bookmark-wrapper d-flex align-center flex-grow-1 d-none d-md-flex">
    <VMenu
      v-model:open="dropdownOpen"
      offset-y
      close-on-content-click
      open-on-click
      open-on-focus
    >
      <template #activator="{ props: activatorProps }">
        <VBtn
          v-bind="activatorProps"
          variant="outlined"
          color="grey"
          size="small"
        >
          <VIcon
            icon="mdi-server-network"
            size="20"
            class="me-1"
          />
          {{ backendUrl }}

          <VTooltip
            v-model="tooltipVisible"
            bottom
            location="bottom"
          >
            <template #activator="{ props: tooltipActivatorProps }">
              <VIcon
                v-if="ipPortPattern.test(backendUrl)"
                class="ml-1"
                size="20"
                color="warning"
                v-bind="tooltipActivatorProps"
                @click.stop="toggleUrlFormat"
              >
                mdi-wifi-lock
              </VIcon>
            </template>
            <template #default>
              <span>Consider switching to a secure HTTPS connection for better security.</span>
            </template>
          </VTooltip>
        </VBtn>
      </template>

      <VList color="grey">
        <VListItem
          color="grey"
          @click="saveBackend('https://api.runonflux.io')"
        >
          <VListItemTitle>https://api.runonflux.io</VListItemTitle>
        </VListItem>

        <VListItem
          v-if="detectedURL"
          color="grey"
          @click="saveBackend(detectedURL)"
        >
          <VListItemTitle>{{ detectedURL }}</VListItemTitle>
        </VListItem>

        <div class="px-4 py-2">
          <VAutocomplete
            v-model:search="customBackend"
            :items="
              showHistory && filteredHistory.length > 0
                ? filteredHistory.map((url) => ({ title: url, value: url }))
                : []
            "
            item-title="title"
            item-value="value"
            :label="t('core.backendSelector.customBackend')"
            color="grey"
            hide-details
            persistent-placeholder
            density="compact"
            clearable
            :menu="showHistory && filteredHistory.length > 0"
            :menu-props="{ maxHeight: '200px' }"
            allow-new
            hide-no-data
            @focus="() => (showHistory = true)"
            @blur="handleBlur"
            @click.stop
            @keydown.enter.prevent="handleEnter"
          />
        </div>
      </VList>
    </VMenu>
  </div>
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
