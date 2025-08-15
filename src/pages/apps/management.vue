<template>
  <div>
    <VTabs
      v-model="tabIndex"
      grow
      hide-slider
      class="tabs-no-slider mb-4"
    >
      <VTab class="tab-chip">
        {{ activeAppsLabel }}
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
      <VTab
        v-if="privilege !== 'fluxteam'"
        class="tab-chip"
      >
        My Expired Apps
        <VBadge
          v-if="expiredApps.length"
          :content="expiredApps.length"
          color="error"
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

    <div v-if="!managedApplication">
      <VWindow v-model="tabIndex">
        <VWindowItem value="0">
          <div v-if="!loading.blockCount">
            <MyAppsTab
              ref="activeAppsRef"
              :apps="activeApps"
              :loading="loading.active"
              :logged-in="loggedIn"
              :current-block-height="daemonBlockCount"
              active-apps-tab
              manage
              :api-error="apiError"
              :privilege="privilege"
            />
          </div>
        </VWindowItem>

        <VWindowItem value="1">
          <div v-if="!loading.blockCount">
            <MyAppsTab
              ref="expiredAppsRef"
              :apps="expiredApps"
              :loading="loading.expired"
              :logged-in="loggedIn"
              :current-block-height="daemonBlockCount"
              :active-apps-tab="false"
              :api-error="apiError"
              :privilege="privilege"
            />
          </div>
        </VWindowItem>
      </VWindow>
    </div>

    <Management
      v-if="managedApplication"
      :app-name="managedApplication"
      global
      :installed-apps="[]"
      @back="clearManagedApplication"
    />

    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="4000"
    >
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import qs from "qs"
import Management from "@/views/apps/management/manage.vue"
import MyAppsTab from "@/views/apps/management/tabView.vue"
import AppsService from "@/services/AppsService"
import DaemonService from "@/services/DaemonService"
import { decryptEnterpriseWithAes, encryptAesKeyWithRsaKey, importRsaPublicKey } from "@/utils/enterpriseCrypto"

import { storeToRefs } from "pinia"
import { useFluxStore } from "@/stores/flux"

const fluxStore = useFluxStore()
const { privilege } = storeToRefs(fluxStore)

const activeApps = ref([])
const expiredApps = ref([])
const managedApplication = ref("")
const daemonBlockCount = ref(-1)
const loading = ref({ active: true, expired: true, blockCount: true })
const loggedIn = ref(false)
const apiError = ref(false)
const snackbar = ref({ show: false, message: "", color: "error" })
const tabIndex = ref(0)
const activeAppsRef = ref(null)
const expiredAppsRef = ref(null)

function showSnackbar(message, color = "error") {
  snackbar.value = { show: true, message, color }
}

function setLoginStatus() {
  const zelidauth = localStorage.getItem("zelidauth")
  const auth = qs.parse(zelidauth || "")
  loggedIn.value = Boolean(auth.zelid)
  console.log("setLoginStatus:", loggedIn.value)
}

const activeAppsLabel = computed(() => {
  if (privilege.value === 'fluxteam') {
    return 'Active Apps'
  }
  
  return 'My Active Apps'
})

// --- 🟦 Enterprise Decryption Helper ---
async function decryptIfEnterprise(spec, idx = 0) {
  const tag = `[${idx}:${spec.name}]`
  if (!(spec.version >= 8 && spec.enterprise)) return spec

  try {
    // --- Get owner ---
    const ownerRes = await AppsService.getAppOriginalOwner(spec.name)
    if (ownerRes.data.status !== 'success') {
      console.warn(`${tag} ⚠️ owner fail`, ownerRes.data)
      
      return spec
    }
    const owner = ownerRes.data.data

    // --- Get pubkey ---
    const zelidauth = localStorage.getItem('zelidauth')
    const pubRes = await AppsService.getAppPublicKey(zelidauth, {
      name: spec.name,
      owner,
    })
    if (pubRes.data.status !== 'success') {
      console.warn(`${tag} ⚠️ pubkey fail`, pubRes.data)
      
      return spec
    }
    const pubKeyB64 = pubRes.data.data.trim().replace(/\s+/g, '')
    const rsaPubKey = await importRsaPublicKey(pubKeyB64)

    // --- Generate AES key ---
    const aesKey = crypto.getRandomValues(new Uint8Array(32))
    const encryptedEnterpriseKey = await encryptAesKeyWithRsaKey(aesKey, rsaPubKey)

    // --- Fetch encrypted payload ---
    let encryptedRes
    try {
      encryptedRes = await AppsService.getAppEncryptedSpecifics(
        spec.name,
        zelidauth,
        encryptedEnterpriseKey,
      )
    } catch (fetchErr) {
      console.warn(`${tag} ⚠️ encrypted fetch fail`, fetchErr)
      
      return spec
    }
    if (encryptedRes.data.status !== 'success') {
      console.warn(`${tag} ⚠️ encrypted fetch bad status`, encryptedRes.data)
      
      return spec
    }

    const encryptedPayload = encryptedRes.data.data?.enterprise
    if (!encryptedPayload) {
      console.warn(`${tag} ⚠️ missing encrypted payload`)
      
      return spec
    }

    let plain = null
    try {
      plain = await decryptEnterpriseWithAes(encryptedPayload, aesKey)
    } catch (decryptErr) {
      console.warn(`${tag} ⚠️ decrypt failed`, decryptErr)
      
      return spec
    }

    let extraFields = {}
    try {
      extraFields = JSON.parse(plain)
    } catch (parseErr) {
      console.warn(`${tag} ⚠️ parse fail`, parseErr)
      
      return spec
    }
    console.log(`${tag} ✅ decrypted`)
    
    return { ...spec, ...extraFields, enterprise: null }
  } catch (e) {
    console.error(`${tag} 💥 decrypt failed`, e)
    
    return spec
  }
}

// --- 🟦 Decrypt Array Helper (for active/expired) ---
async function decryptEnterpriseApps(appArray) {
  return Promise.all(appArray.map(decryptIfEnterprise))
}

async function getDaemonBlockCount() {
  try {
    const response = await DaemonService.getBlockCount()
    if (response.data.status === "success") {
      daemonBlockCount.value = response.data.data
      console.log("Daemon block count set:", daemonBlockCount.value)
    } else {
      daemonBlockCount.value = -1
    }
  } catch (error) {
    daemonBlockCount.value = -1
  } finally {
    loading.value.blockCount = false
  }
}

// --- 🟩 ACTIVE APPS (user, decrypted if needed) ---
async function getActiveApps() {
  loading.value.active = true
  apiError.value = false
  try {
    const zelidauth = localStorage.getItem("zelidauth")
    const auth = qs.parse(zelidauth || "")
    if (!auth?.zelid) {
      activeApps.value = []
      
      return
    }
    const response = await AppsService.myGlobalAppSpecifications(auth.zelid)
    const appsRaw = Array.isArray(response.data.data) ? response.data.data : []
    activeApps.value = await decryptEnterpriseApps(appsRaw)
  } catch (error) {
    activeApps.value = []
    apiError.value = true
    showSnackbar("Failed to load active apps")
  } finally {
    loading.value.active = false
  }
}

// --- 🟥 EXPIRED APPS (user, decrypted if needed) ---
async function getExpiredApps() {
  loading.value.expired = true
  try {
    const zelidauth = localStorage.getItem("zelidauth")
    const auth = qs.parse(zelidauth || "")
    if (!auth?.zelid) {
      expiredApps.value = []
      
      return
    }

    const response = await AppsService.permanentMessagesOwner(auth.zelid).catch(() => ({
      data: { data: [] },
    }))

    const appMessages = response.data.data || []
    const adjustedPermMessages = []

    appMessages.forEach(msg => {
      const existingIndex = adjustedPermMessages.findIndex(
        existing => existing.appSpecifications.name === msg.appSpecifications.name,
      )
      if (existingIndex === -1) {
        adjustedPermMessages.push(msg)
      } else if (msg.height > adjustedPermMessages[existingIndex].height) {
        adjustedPermMessages[existingIndex] = msg
      }
    })

    const filtered = adjustedPermMessages.filter(
      msg =>
        !activeApps.value.find(
          active =>
            active.name.toLowerCase() === msg.appSpecifications.name.toLowerCase(),
        ),
    )

    // Decrypt each expired app as needed
    expiredApps.value = await decryptEnterpriseApps(filtered.map(msg => msg.appSpecifications))
  } catch (error) {
    expiredApps.value = []
    showSnackbar("Failed to load expired apps")
  } finally {
    loading.value.expired = false
  }
}

// --- 🟦 FLUXTEAM: GLOBAL APPS, DECRYPT ALL ENTERPRISE ---
async function getAllApps() {
  loading.value.active = true
  apiError.value = false

  try {
    console.time('getAllApps')
    const { data } = await AppsService.globalAppSpecifications()
    const rawSpecs = data?.data ?? []
    activeApps.value = await decryptEnterpriseApps(rawSpecs)
    console.timeEnd('getAllApps')
  } catch (outer) {
    apiError.value = true
    activeApps.value = []
  } finally {
    loading.value.active = false
  }
}

// --- Top-level fetch ---
async function getApps() {
  if (privilege.value === 'fluxteam') {
    await getAllApps()
  } else {
    await Promise.all([getActiveApps(), getExpiredApps()])
  }
}

// --- Watches ---
watch(loggedIn, newValue => {
  if (newValue) getApps()
})

onMounted(async () => {
  setLoginStatus()
  await getDaemonBlockCount()
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
