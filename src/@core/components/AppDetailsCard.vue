<template>
  <div v-if="app" class="app-details-wrapper">
    <!-- General Section Header -->
    <h3 v-if="showGeneralSection" class="d-flex align-center justify-start mb-3 general-header">
      <VChip
        color="info"
        variant="tonal"
        class="general-chip"
      >
        <VIcon
          size="22"
          class="ml-1"
        >
          mdi-information-outline
        </VIcon>
        <span class="ml-1">{{ t('core.appDetailsCard.general') }}</span>
      </VChip>

      <!-- Copy Specification Button -->
      <VBtn
        v-if="activeAppsTab && !isMarketplace && !isMarketplaceApp(app.name)"
        icon
        variant="text"
        color="info"
        size="x-small"
        class="export-btn-icon"
        @click="exportSpec"
      >
        <VIcon size="16">mdi-content-copy</VIcon>
        <VTooltip activator="parent" location="left">
          {{ t('core.appDetailsCard.copySpecification') }}
        </VTooltip>
      </VBtn>
    </h3>

    <!-- Snackbar for notifications -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top"
    >
      {{ snackbar.message }}
    </VSnackbar>
    <ListEntry
      :title="t('core.appDetailsCard.name')"
      :data="app.name"
      title-icon="mdi-package-variant"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    />
    <ListEntry
      :title="t('core.appDetailsCard.description')"
      :data="app.description"
      title-icon="mdi-text-box-outline"
      title-icon-scale="1.3"
      kbd-variant="secondary"
      hide-if-empty
    />
    <ListEntry
      :title="t('core.appDetailsCard.owner')"
      :data="app.owner"
      title-icon="mdi-account"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    />
    <ListEntry
      :title="t('core.appDetailsCard.hash')"
      :data="app.hash"
      title-icon="mdi-pound-box"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    />
    <ListEntry
      v-if="app?.contacts && app.contacts.length > 0"
      :title="t('core.appDetailsCard.contacts')"
      :data="sanitized(app.contacts)"
      :title-icon="contactIcon(sanitized(app.contacts))"
      title-icon-scale="1.3"
      kbd-variant="secondary"
      hide-if-empty
    />
    <ListEntry
      :title="t('core.appDetailsCard.geolocation')"
      title-icon="mdi-earth"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    >
      <template #default>
        <div class="kbd-list">
          <div
            v-for="(location, index) in app?.geolocation && app.geolocation.length > 0
              ? app.geolocation
              : [t('core.appDetailsCard.worldwide')]"
            :key="index"
            class="d-inline-block"
            style="margin-right: 5px"
          >
            <kbd
              class="resource-kbd"
              :class="[
                {
                  'alert-info': getGeolocation(location)
                    .toLowerCase()
                    .includes('allowed'),
                  'alert-danger': getGeolocation(location)
                    .toLowerCase()
                    .includes('forbidden'),
                  'alert-secondary': !['allowed', 'forbidden'].some((keyword) =>
                    getGeolocation(location).toLowerCase().includes(keyword)
                  ),
                },
              ]"
            >
              {{ getGeolocation(location) }}
            </kbd>
          </div>
        </div>
      </template>
    </ListEntry>
    <ListEntry
      :title="t('core.appDetailsCard.instances')"
      :data="app?.instances || 3"
      title-icon="mdi-map-marker"
      title-icon-scale="1.3"
      kbd-variant="success"
    />
    <ListEntry
      :title="t('core.appDetailsCard.specificationsVersion')"
      :data="app.version"
      title-icon="mdi-file-code"
      title-icon-scale="1.3"
      kbd-variant="success"
    />
    <ListEntry
      :title="t('core.appDetailsCard.registeredOnBlockheight')"
      :data="app.height"
      title-icon="mdi-calendar-check"
      title-icon-scale="1.2"
      kbd-variant="success"
    />
    <ListEntry
      v-if="app.hash && app.hash.length === 64 && adjustedExpiryBlockHeight"
      :title="t('core.appDetailsCard.expiresOnBlockheight')"
      :data="adjustedExpiryBlockHeight"
      title-icon="mdi-hourglass"
      title-icon-scale="1.2"
      kbd-variant="success"
    />
    <ListEntry
      :title="t('core.appDetailsCard.expiresIn')"
      :data="expiresInLabel"
      title-icon="mdi-clock-outline"
      title-icon-scale="1.2"
      :kbd-variant="getExpiryColorVariant(expiresInLabel)"
    />
    <ListEntry
      :title="t('core.appDetailsCard.enterpriseNodes')"
      :data="app?.nodes && app?.nodes.length > 0 ? app.nodes.join(', ') : t('core.appDetailsCard.notScoped')"
      title-icon="mdi-server-network"
      title-icon-scale="1.2"
      kbd-variant="secondary"
    />
    <ListEntry
      :title="t('core.appDetailsCard.staticIp')"
      :data="
        app.staticip ? t('core.appDetailsCard.staticIpYes') : t('core.appDetailsCard.staticIpNo')
      "
      title-icon="mdi-map-marker-radius"
      title-icon-scale="1.2"
      kbd-variant="secondary"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import geolocations from "@/utils/geolocation"
import ExplorerService from '@/services/ExplorerService'
import DaemonService from '@/services/DaemonService'

const props = defineProps({
  app: Object,
  getNewExpireLabel: {
    type: [String, Number, Function],
    required: false,
    default: null,
  },
  activeAppsTab: {
    type: Boolean,
    default: false,
  },
  isMarketplace: {
    type: Boolean,
    default: false,
  },
  showGeneralSection: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

// PON Fork configuration - block height where chain speed increases 4x
const FORK_BLOCK_HEIGHT = 2020000
const currentBlockHeight = ref(null)

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000,
})

// Calculate adjusted expiry blockheight accounting for PON Fork
const adjustedExpiryBlockHeight = computed(() => {
  if (!props.app?.height || !props.app?.hash || props.app.hash.length !== 64) {
    return null
  }

  // Default expiration depends on registration height (fork-aware)
  const defaultExpire = props.app.height >= FORK_BLOCK_HEIGHT ? 88000 : 22000
  const expireIn = props.app.expire || defaultExpire
  const originalExpirationHeight = props.app.height + expireIn

  // The blockchain stores the expiry block height directly
  // No adjustment needed - the backend already calculated fork-aware expiry
  // We just need to display the time remaining correctly (done in expiresInLabel below)
  return originalExpirationHeight
})

// Calculate fork-aware expiry time label
const expiresInLabel = computed(() => {
  if (!adjustedExpiryBlockHeight.value || currentBlockHeight.value === null || currentBlockHeight.value < 0) {
    return t('core.appDetailsCard.notAvailable')
  }

  const blocksRemaining = adjustedExpiryBlockHeight.value - currentBlockHeight.value

  if (blocksRemaining < 1) {
    return t('core.appDetailsCard.applicationExpired')
  }

  let totalMinutes = 0

  // Before fork: 2 minutes per block
  // After fork: 0.5 minutes per block (30 seconds)
  if (currentBlockHeight.value < FORK_BLOCK_HEIGHT) {
    // We're currently before the fork
    if (adjustedExpiryBlockHeight.value <= FORK_BLOCK_HEIGHT) {
      // Expiration is before fork - all blocks at 2 min/block
      totalMinutes = blocksRemaining * 2
    } else {
      // Expiration is after fork - split calculation
      const blocksUntilFork = FORK_BLOCK_HEIGHT - currentBlockHeight.value
      const blocksAfterFork = adjustedExpiryBlockHeight.value - FORK_BLOCK_HEIGHT
      totalMinutes = (blocksUntilFork * 2) + (blocksAfterFork * 0.5)
    }
  } else {
    // We're currently after fork - all remaining blocks at 0.5 min/block
    totalMinutes = blocksRemaining * 0.5
  }

  // Convert minutes to human-readable format
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = Math.floor(totalMinutes % 60)

  const parts = []
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)

  return parts.slice(0, 3).join(', ')
})

// Fetch current block height on mount (daemon first, explorer failover)
onMounted(async () => {
  try {
    // Try daemon first (more accurate, real-time)
    const daemonResult = await DaemonService.getBlockCount()
    if (daemonResult?.data?.status === 'success' && typeof daemonResult.data?.data === 'number') {
      currentBlockHeight.value = daemonResult.data.data
      return
    }
  } catch (error) {
    console.log("Daemon block height not available, falling back to explorer:", error)
  }

  try {
    // Fallback to explorer
    const explorerResult = await ExplorerService.getScannedHeight()
    if (explorerResult.data.status === "success") {
      currentBlockHeight.value = explorerResult.data.data.generalScannedHeight
    }
  } catch (error) {
    console.error("Error fetching block height from both sources:", error)
    currentBlockHeight.value = null
  }
})

function isMarketplaceApp(name) {
  if (!name || name.length < 14) return false
  const possibleDateString = name.substring(name.length - 13)
  const possibleDate = Number(possibleDateString)
  
  return !isNaN(possibleDate)
}

async function exportSpec() {
  try {
    // Create a clean JSON specification
    const spec = JSON.stringify(props.app, null, 2)

    // Use native clipboard API
    await navigator.clipboard.writeText(spec)

    snackbar.value.message = t('core.appDetailsCard.specificationCopied')
    snackbar.value.color = 'success'
    snackbar.value.show = true
  } catch (error) {
    console.error('Failed to copy specification:', error)
    snackbar.value.message = t('core.appDetailsCard.specificationCopyFailed')
    snackbar.value.color = 'error'
    snackbar.value.show = true
  }
}

function getGeolocation(geo) {
  if (!geo) return t('core.appDetailsCard.worldwide')

  if (geo.startsWith("a") && !geo.startsWith("ac") && !geo.startsWith("a!c")) {
    // Specific continent
    const continentCode = geo.slice(1)

    const continentExists = geolocations.continents.find(
      c => c.code === continentCode,
    ) || { name: t('core.appDetailsCard.unknown') }


    return t('core.appDetailsCard.continent', { name: continentExists.name })
  }

  if (geo.startsWith("b")) {
    // Specific country
    const countryCode = geo.slice(1)

    const countryExists = geolocations.countries.find(c => c.code === countryCode) || {
      name: t('core.appDetailsCard.unknown'),
    }


    return t('core.appDetailsCard.country', { name: countryExists.name })
  }

  if (geo.startsWith("ac")) {
    // Allowed location
    const specifiedLocation = geo.slice(2)
    const [continentCode, countryCode, regionName] = specifiedLocation.split("_")

    const continentExists = geolocations.continents.find(
      c => c.code === continentCode,
    ) || { name: t('core.appDetailsCard.unknown') }

    const countryExists = geolocations.countries.find(c => c.code === countryCode) || {
      name: t('core.appDetailsCard.unknown'),
    }

    let locationString = t('core.appDetailsCard.allowedContinent', { name: continentExists.name })
    if (countryCode) locationString += t('core.appDetailsCard.country', { name: countryExists.name })
    if (regionName) locationString += t('core.appDetailsCard.region', { name: regionName })

    return locationString
  }

  if (geo.startsWith("a!c")) {
    // Forbidden location
    const specifiedLocation = geo.slice(3)
    const [continentCode, countryCode, regionName] = specifiedLocation.split("_")

    const continentExists = geolocations.continents.find(
      c => c.code === continentCode,
    ) || { name: t('core.appDetailsCard.unknown') }

    const countryExists = geolocations.countries.find(c => c.code === countryCode) || {
      name: t('core.appDetailsCard.unknown'),
    }

    let locationString = t('core.appDetailsCard.forbiddenContinent', { name: continentExists.name })
    if (countryCode) locationString += t('core.appDetailsCard.country', { name: countryExists.name })
    if (regionName) locationString += t('core.appDetailsCard.region', { name: regionName })

    return locationString
  }

  return t('core.appDetailsCard.worldwide')
}

function sanitized(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .flatMap(item =>
        typeof item === "string" ? item.split(",").map(i => i.trim()) : [item],
      )
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map(i => i.trim())
      .filter(Boolean)
  }

  return []
}

function contactIcon(value) {
  return value.some(v => typeof v === "string" && v.includes("@"))
    ? "mdi-email-outline"
    : "mdi-email-lock"
}

// Get color variant for expiry time (matching SubscriptionManager.vue logic)
function getExpiryColorVariant(label) {
  const timeParts =
    typeof label === "string" ? label.match(/\d+\s*(day|hour|minute)/gi) : null

  if (!timeParts) return 'secondary'

  const totalMinutes = timeParts.reduce((sum, part) => {
    const [num, unit] = part.match(/\d+|\D+/g).map(s => s.trim())
    const value = parseInt(num, 10)
    if (unit.startsWith("day")) return sum + value * 1440
    if (unit.startsWith("hour")) return sum + value * 60
    if (unit.startsWith("minute")) return sum + value

    return sum
  }, 0)

  const days = totalMinutes / 1440

  // Color logic:
  if (days < 3) {
    return 'danger' // Red - Less than 3 days
  } else if (days <= 4) {
    return 'warning' // Orange - 3 to 4 days
  } else {
    return 'success' // Green - More than 4 days
  }
}

// Legacy function for backwards compatibility
function isExpiringSoon(label) {
  const variant = getExpiryColorVariant(label)
  return variant === 'danger'
}
</script>

<style scoped>
.app-details-wrapper {
  overflow: visible !important;
}

.general-header {
  position: relative;
  overflow: visible !important;
}

.general-chip {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: 8px 16px;
  border-radius: 15px;
  font-family: monospace;
  font-size: 18px;
  overflow: visible !important;
}

.export-btn-icon {
  position: absolute !important;
  right: 8px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  height: 24px !important;
  width: 24px !important;
  z-index: 10 !important;
}

.export-btn-icon:hover {
  background-color: rgba(var(--v-theme-info), 0.1) !important;
}

.kbd-list kbd {
  display: inline-block;
  margin-bottom: 0.25rem;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
}

.alert-primary {
  background-color: rgba(13, 110, 253, 0.1);
  color: #0d6efd !important;
}

.alert-secondary {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d !important;
}

.alert-success {
  background-color: rgba(25, 135, 84, 0.1);
  color: rgb(var(--v-theme-success)) !important;
}

.alert-danger {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545 !important;
}

.alert-warning {
  background-color: rgba(255, 193, 7, 0.1);
  color: #ffc107 !important;
}

.alert-info {
  background-color: rgba(13, 202, 240, 0.1);
  color: #0dcaf0 !important;
}

.resource-kbd {
  display: inline-block;
  max-width: 100%;
  padding: 4px  8px !important;
  margin-bottom: 4px;
  border-radius: 15px;
  font-family: monospace;
  font-size: 14px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
}

.app-details-wrapper:has(.general-header) :deep(.grid-row dt) {
  margin-left: 0.75rem;
}
</style>
