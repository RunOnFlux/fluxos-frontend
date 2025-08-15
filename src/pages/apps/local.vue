<template>
  <div>
    <VTabs
      v-model="activeTab"
      background-color="transparent"
      class="tabs-no-slider"
      grow
      hide-slider
    >
      <VTab class="tab-chip">
        Installed Apps
        <VBadge
          v-if="installedApps.length"
          :content="installedApps.length"
          color="success"
          offset-x="-5"
          offset-y="8"
          class="ml-2"
          floating
          rounded
          size="small"
          density="default"
        />
      </VTab>
      <VTab class="tab-chip">
        Available Apps
        <VBadge
          v-if="availableApps.length"
          :content="availableApps.length"
          color="success"
          offset-x="-5"
          offset-y="8"
          class="ml-2"
          floating
          rounded
          size="small"
          density="default"
        />
      </VTab>
    </VTabs>
  
    <VWindow
      v-model="activeTab"
      class="mt-4"
      :touch="false"
    >
      <VWindowItem value="0">
        <div>
          <MyAppsTab
            :apps="installedApps"
            :loading="loading"
            :logged-in="loggedIn"
            :current-block-height="daemonBlockCount"
            active-apps-tab
            :api-error="apiError"
            show-status
            :show-control="isFluxAdminLoggedIn"
            privilege="none"
          />
        </div>
      </VWindowItem>
  
      <VWindowItem value="1">
        <div>
          <MyAppsTab
            :apps="availableApps"
            :loading="loading"
            :logged-in="loggedIn"
            :current-block-height="daemonBlockCount"
            active-apps-tab
            :api-error="apiError"
            :show-install="isFluxAdminLoggedIn"
            privilege="none"
          />
        </div>
      </VWindowItem>
    </VWindow>
  </div>
</template>
  
<script setup>
import { ref, watch } from 'vue'
import MyAppsTab from "@/views/apps/management/tabView.vue"
import AppsService from "@/services/AppsService"
import DaemonService from "@/services/DaemonService"
import qs from "qs"
import { eventBus } from "@/utils/eventBus"
import { storeToRefs } from "pinia"
import { useFluxStore } from "@/stores/flux"

const fluxStore = useFluxStore()
const { privilege } = storeToRefs(fluxStore)
  
const activeTab = ref(0)
const apiError = ref(false)
const loading = ref(true)
const loggedIn = ref(true) // or get from store
const daemonBlockCount = ref(-1)
  
const availableApps = ref([])
const installedApps = ref([])
const activeAppTab = ref([])
  
async function loadInstalledApps() {
  console.log("Load tiggered..")
  loading.value = true
  try {
    const response = await AppsService.installedApps()
    if (response.data.status === 'success') {
      installedApps.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch installed apps:', error)
    apiError.value = true
  }
  loading.value = false
}

async function loadApps() {
  loading.value = true
  apiError.value = false // reset before trying
  try {
    const response = await AppsService.globalAppSpecifications()
    if (response?.data?.data) {
      availableApps.value = response.data.data
    }
  } catch (error) {
    console.error('Error loading apps:', error)
    apiError.value = true
  }
  loading.value = false
}

async function getDaemonBlockCount() {
  try {
    const response = await DaemonService.getBlockCount()
    if (response.data.status === "success") {
      daemonBlockCount.value = response.data.data
      console.log("Daemon block count set:", daemonBlockCount.value)
    } else {
      console.warn("Daemon block count fetch failed:", response.data)
      daemonBlockCount.value = -1
    }
  } catch (error) {
    console.error("Error fetching daemon block count:", error.message)
    daemonBlockCount.value = -1
  } 
}

function setLoginStatus() {
  const zelidauth = localStorage.getItem("zelidauth")
  const auth = qs.parse(zelidauth || "")

  loggedIn.value = Boolean(auth.zelid)
  console.log("setLoginStatus:", loggedIn.value)
}

function updateInstalledApp() {
  loadInstalledApps()
}

onMounted(async () => {
  eventBus.on('updateInstalledApp', updateInstalledApp)
  eventBus.on('backendURLChanged', () => {
    const backendURL = localStorage.getItem("backendURL")

    console.log(backendURL)
    loadInstalledApps()
  })
  setLoginStatus()
  await getDaemonBlockCount()
  await loadInstalledApps()
  await loadApps()
  console.log("Initial data fetching complete")
})

const isFluxAdminLoggedIn = computed(() => privilege.value === 'fluxteam')

onBeforeUnmount(() => {
  eventBus.off('backendURLChanged', loadInstalledApps)
  eventBus.off('updateInstalledApp', updateInstalledApp)
})
</script>

<style scoped>
.v-tab {
  text-transform: none;
}
.v-tabs {
  max-width: 100%;
}
.tab-chip {
  min-height: 36px;
  height: 40px;
  padding: 0 16px;
  border-radius: 20px;
  font-size: 16px;
  font-family: monospace;
}

/* ACTIVE tab */
.tab-chip[aria-selected="true"] {
  background-color: rgba(0, 123, 255, 0.1);
  padding: 0 16px;
  border-radius: 20px;
}

/* HOVER */
.tab-chip:hover {
  transform: scale(1.03);
}

/* REMOVE BORDER CORRECTLY */
.tabs-no-slider.v-tabs {
  border-block-end: none !important;
}

@media (max-width: 600px) {
  .tab-chip {
    font-size: 12px !important;
    padding: 0 8px !important;
    min-height: 28px !important;
    height: 32px !important;
    line-height: 1 !important;
  }

  @media (max-width: 600px) {
  /* Deeper selector to target badge bubble */
  ::v-deep(.v-badge__badge) {
    font-size: 11px !important;
    height: 16px !important;
    min-width: 30px !important;
    top: -15px !important;
    right: -28px !important;
    left: auto !important;
  }
}

  /* Optional: reduce spacing from badge's offset */
  .v-badge.floating {
    transform: translate(4px, -4px) !important;
  }

  /* Optional: reduce tab spacing on mobile */
  .v-tabs {
    gap: 4px !important;
  }

  /* Optional: reduce tab content padding */
  .v-tab {
    padding: 0 6px !important;
  }
}
</style>
