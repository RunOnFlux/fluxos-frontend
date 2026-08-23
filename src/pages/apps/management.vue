<template>
  <div>
    <!-- FluxCloud Info Card -->
    <VCard class="mb-4 management-intro-card">
      <VCardText>
        <div class="d-flex align-center mb-3">
          <VAvatar
            size="48"
            color="primary"
            variant="tonal"
            class="mr-3"
          >
            <VIcon size="28">mdi-cloud-check-outline</VIcon>
          </VAvatar>
          <div>
            <h2 class="text-h4 mb-1">{{ t('myApps.fluxCloudTitle') }}</h2>
            <p class="text-body-2 mb-0 text-medium-emphasis">{{ t('myApps.fluxCloudSubtitle') }}</p>
          </div>
        </div>
        <p class="text-body-1 mb-0">
          {{ t('myApps.fluxCloudDescription') }}
        </p>
      </VCardText>
    </VCard>

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
        {{ t('menu.application.myExpiredApps') }}
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
        <VWindowItem>
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
              :subscriptions="userSubscriptions"
            />
          </div>
        </VWindowItem>

        <VWindowItem>
          <div v-if="!loading.blockCount">
            <MyAppsTab
              ref="expiredAppsRef"
              :apps="expiredApps"
              :loading="loading.expired"
              :logged-in="loggedIn"
              :current-block-height="daemonBlockCount"
              :active-apps-tab="false"
              manage
              :api-error="apiError"
              :privilege="privilege"
              :subscriptions="userSubscriptions"
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
import { useI18n } from 'vue-i18n'
import qs from "qs"
import axios from "axios"
import Management from "@/views/apps/management/manage.vue"
import MyAppsTab from "@/views/apps/management/tabView.vue"
import AppsService from "@/services/AppsService"
import DaemonService from "@/services/DaemonService"
import { decryptEnterpriseWithAes, encryptAesKeyWithRsaKey, importRsaPublicKey, isWebCryptoAvailable } from "@/utils/enterpriseCrypto"
import { paymentBridge } from "@/utils/fiatGateways"

import { storeToRefs } from "pinia"
import { useFluxStore } from "@/stores/flux"

// SEO
import { useSEO, generateOrganizationSchema, generateBreadcrumbSchema } from '@/composables/useSEO'

const { t } = useI18n()

// SEO configuration
useSEO({
  title: 'My Applications - Manage FluxCloud Apps | FluxCloud',
  description: 'Manage your deployed applications on Flux decentralized cloud. View app status, monitor performance, update configurations, and manage your FluxCloud deployments from a unified dashboard.',
  url: 'https://cloud.runonflux.com/apps/management',
  keywords: 'manage apps, FluxCloud dashboard, app management, deployed apps, monitor apps, app status, flux applications, container management, cloud dashboard',
  structuredData: [
    generateOrganizationSchema(),
    generateBreadcrumbSchema([
      { name: 'Home', url: 'https://cloud.runonflux.com' },
      { name: 'My Applications', url: 'https://cloud.runonflux.com/apps/management' },
    ]),
  ],
})

const fluxStore = useFluxStore()
const { privilege } = storeToRefs(fluxStore)

const activeApps = ref([])
const expiredApps = ref([])
const managedApplication = ref("")
const daemonBlockCount = ref(-1)
const loading = ref({ active: true, expired: true, blockCount: true })
const loggedIn = computed(() => privilege.value !== 'none')
const apiError = ref(false)
const snackbar = ref({ show: false, message: "", color: "error" })
const tabIndex = ref(0)
const activeAppsRef = ref(null)
const expiredAppsRef = ref(null)
const userSubscriptions = ref([])

function showSnackbar(message, color = "error") {
  snackbar.value = { show: true, message, color }
}

async function fetchUserSubscriptions() {
  try {
    const zelidauth = localStorage.getItem("zelidauth")
    if (!zelidauth) return
    const auth = qs.parse(zelidauth)
    if (!auth?.zelid) return

    const response = await axios.post(`${paymentBridge}/api/v1/stripe/subscription/list`, {
      zelid: auth.zelid,
      signature: auth.signature,
      loginPhrase: auth.loginPhrase,
    })
    if (response.data.status === 'success' && Array.isArray(response.data.data)) {
      userSubscriptions.value = response.data.data
    }
  } catch (error) {
    console.warn('Failed to fetch subscriptions:', error.message)
  }
}


const activeAppsLabel = computed(() => {
  if (privilege.value === 'fluxteam') {
    return t('menu.application.activeApps')
  }

  return t('menu.application.myActiveApps')
})

// --- 🟦 Enterprise Decryption Helper ---
async function attemptEnterpriseDecrypt(spec, tag, owner) {
  const zelidauth = localStorage.getItem('zelidauth')

  const pubRes = await AppsService.getAppPublicKey(zelidauth, {
    name: spec.name,
    owner,
  })
  if (pubRes.data.status !== 'success') {
    console.warn(`${tag} ⚠️ pubkey fail`, pubRes.data)
    
    return { ok: false }
  }

  const pubKeyB64 = pubRes.data.data.trim().replace(/\s+/g, '')
  const rsaPubKey = await importRsaPublicKey(pubKeyB64)

  const aesKey = crypto.getRandomValues(new Uint8Array(32))
  const encryptedEnterpriseKey = await encryptAesKeyWithRsaKey(aesKey, rsaPubKey)

  const encryptedRes = await AppsService.getAppEncryptedSpecifics(
    spec.name,
    zelidauth,
    encryptedEnterpriseKey,
  )

  if (encryptedRes.data.status !== 'success') {
    const msg = encryptedRes.data.data?.message
    if (msg === 'Application not found') {
      return { ok: false, notFound: true }
    }
    
    return { ok: false, data: encryptedRes.data }
  }

  const encryptedPayload = encryptedRes.data.data?.enterprise
  if (!encryptedPayload) return { ok: false, noPayload: true }

  const plain = await decryptEnterpriseWithAes(encryptedPayload, aesKey)
  const extraFields = JSON.parse(plain)
  
  return { ok: true, extraFields }
}

async function decryptIfEnterprise(spec, idx = 0) {
  const tag = `[${idx}:${spec.name}]`
  if (!(spec.version >= 8 && spec.enterprise)) return spec

  try {
    if (!isWebCryptoAvailable()) {
      console.warn(`${tag} ⚠️ WebCrypto not available, skipping enterprise decryption`)
      
      return spec
    }

    const ownerRes = await AppsService.getAppOriginalOwner(spec.name)
    if (ownerRes.data.status !== 'success') {
      console.warn(`${tag} ⚠️ owner fail`, ownerRes.data)
      
      return spec
    }
    const owner = ownerRes.data.data

    // Retry up to 3 times — block height can change between pubkey and decrypt calls
    const maxRetries = 3
    let result = null
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      result = await attemptEnterpriseDecrypt(spec, tag, owner).catch(() => ({ ok: false }))
      if (result.ok) { result.attempt = attempt; break }
      if (result.notFound) break
      if (attempt < maxRetries) {
        console.warn(`${tag} ⚠️ attempt ${attempt}/${maxRetries} failed, retrying`)
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    if (result.notFound) {
      console.warn(`${tag} Application not found - will be filtered from list`)
      
      return null
    }

    if (!result.ok) {
      console.warn(`${tag} ⚠️ decrypt failed after ${maxRetries} attempts`, result.data)
      
      return spec
    }

    console.log(`${tag} ✅ decrypted (attempt ${result.attempt || 1}/${maxRetries})`)
    
    return { ...spec, ...result.extraFields, enterprise: null }
  } catch (e) {
    console.error(`${tag} 💥 decrypt failed`, e)
    
    return spec
  }
}

// --- 🟦 Decrypt Array Helper (for active/expired) ---
async function decryptEnterpriseApps(appArray) {
  const concurrency = 120
  const results = []
  for (let i = 0; i < appArray.length; i += concurrency) {
    const batch = appArray.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map((spec, j) => decryptIfEnterprise(spec, i + j)),
    )
    results.push(...batchResults)
  }

  // Filter out null results (apps that were not found)
  return results.filter(spec => spec !== null)
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
      loading.value.active = false
      
      return
    }
    const response = await AppsService.myGlobalAppSpecifications(auth.zelid)
    const appsRaw = Array.isArray(response.data.data) ? response.data.data : []
    activeApps.value = await decryptEnterpriseApps(appsRaw)
  } catch (error) {
    activeApps.value = []
    apiError.value = true
    showSnackbar(t('menu.application.failedToLoadActiveApps'))
  } finally {
    loading.value.active = false
  }
}

// Apps registered after the PON fork default to a longer subscription. Only
// used when a message carries no explicit expire.
const registrationForkBlock = 2020000

function expireOf(msg) {
  const defaultExpire = msg.height >= registrationForkBlock ? 88000 : 22000

  return msg.appSpecifications.expire || defaultExpire
}

// --- 🟥 EXPIRED APPS (user, decrypted if needed) ---
async function getExpiredApps() {
  loading.value.expired = true
  try {
    const zelidauth = localStorage.getItem("zelidauth")
    const auth = qs.parse(zelidauth || "")
    if (!auth?.zelid) {
      expiredApps.value = []
      loading.value.expired = false
      
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

    // Absent from the active list means one of two things, and only one of them
    // belongs here. An app cannot expire before the block its owner paid to, so
    // one that is already gone did not lapse - it left this owner, and an app
    // that is not theirs is not theirs to list. With no block height there is
    // nothing to compare against and the whole set is listed.
    const expired = filtered.filter(msg => daemonBlockCount.value <= 0
      || daemonBlockCount.value >= msg.height + expireOf(msg))

    // Decrypt each expired app as needed
    expiredApps.value = await decryptEnterpriseApps(expired.map(msg => msg.appSpecifications))
  } catch (error) {
    expiredApps.value = []
    showSnackbar(t('menu.application.failedToLoadExpiredApps'))
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
    // Must run sequentially: getExpiredApps filters based on activeApps.value
    await getActiveApps()

    // An active list that failed to load is empty, not authoritative. Running the
    // set difference against it puts every app the user owns into the expired tab.
    if (apiError.value) {
      expiredApps.value = []
      loading.value.expired = false
    } else {
      await getExpiredApps()
    }
  }
}

// --- Watches ---
watch(loggedIn, newValue => {
  if (newValue) getApps()
})

onMounted(async () => {
  await getDaemonBlockCount()

  // Load apps and subscriptions on mount
  await Promise.all([getApps(), fetchUserSubscriptions()])
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

/* Management intro card styling */
.management-intro-card {
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

.management-intro-card h2 {
  line-height: 1.2;
  word-break: keep-all;
}

/* Mobile responsive adjustments */
@media (max-width: 599px) {
  .management-intro-card h2 {
    font-size: 1.5rem !important;
  }

  .management-intro-card .v-avatar {
    width: 48px !important;
    height: 48px !important;
  }

  .management-intro-card .v-icon {
    font-size: 24px !important;
  }

  .management-intro-card .v-card-text {
    padding: 16px !important;
  }
}
</style>
