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
        Active Apps
        <VBadge
          v-if="activeApps.length"
          :content="activeApps.length"
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
        Marketplace Apps
        <VBadge
          v-if="marketplaceApps.length"
          :content="marketplaceApps.length"
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
            :apps="activeApps"
            :loading="loading"
            :logged-in="loggedIn"
            :current-block-height="daemonBlockCount"
            active-apps-tab
            :api-error="apiError"
            privilege="none"
          />
        </div>
      </VWindowItem>
  
      <VWindowItem value="1">
        <div>
          <MyAppsTab
            :apps="marketplaceApps"
            :loading="loading"
            :logged-in="loggedIn"
            :current-block-height="daemonBlockCount"
            active-apps-tab
            :api-error="apiError"
            privilege="none"
          />
        </div>
      </VWindowItem>
    </VWindow>
  </div>
</template>
  
<script setup>
import { ref } from 'vue'
import MyAppsTab from "@/views/apps/management/tabView.vue"
import AppsService from "@/services/AppsService"
import DaemonService from "@/services/DaemonService"

  
const activeTab = ref(0)
const apiError = ref(false)
const loading = ref(true)
const loggedIn = ref(true) // or get from store
const daemonBlockCount = ref(-1)
  
const activeApps = ref([])
const marketplaceApps = ref([])
  
async function loadApps() {
  loading.value = true
  apiError.value = false // reset before trying
  try {
    const response = await AppsService.globalAppSpecifications()
    if (response?.data?.data) {
      const allApps = response.data.data

      activeApps.value = allApps.filter(app => !isMarketplaceApp(app.name))
      marketplaceApps.value = allApps.filter(app => isMarketplaceApp(app.name))
    }
  } catch (error) {
    console.error('Error loading apps:', error)
    apiError.value = true
  }
  loading.value = false
}

function isMarketplaceApp(name) {
  if (name.length >= 14) {
    const possibleDateString = name.substring(name.length - 13)
    const possibleDate = Number(possibleDateString)
    
    return !isNaN(possibleDate)
  }
  
  return false
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

onMounted(async () => {
  await getDaemonBlockCount()
  await loadApps()
  console.log("Initial data fetching complete")
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
