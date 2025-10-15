<template>
  <div>
    <!-- Loading State -->
    <LoadingSpinner
      v-if="loading"
      icon="mdi-information-outline"
      title="Loading System Information..."
    />

    <!-- Maintenance/Error State -->
    <MaintenanceCard
      v-else-if="error"
      title="System Information
Unavailable"
      subtitle="Unable to load system information at this time."
      description="The system is currently unavailable or experiencing connectivity issues. Please check your connection and try again in a few moments. If the problem persists, contact your system administrator."
      :loading="loading"
      margin-top="-50px"
      @retry="fetchSystemInfo"
    />

    <!-- Content -->
    <div v-else>
      <!-- Page Header -->
      <div class="mb-3">
        <div class="d-flex align-center mb-2">
          <VAvatar color="primary" variant="flat" size="48" class="mr-3">
            <VIcon icon="mdi-information-outline" size="32" color="white" />
          </VAvatar>
          <div>
            <h2 class="text-h5 font-weight-bold">System Information</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              View system resources and component versions
            </p>
          </div>
        </div>
      </div>

      <!-- System Resources -->
      <VCard class="mb-3" elevation="1">
        <VCardTitle class="d-flex align-center pa-3 bg-surface">
          <VIcon icon="mdi-server" size="24" class="mr-2" />
          <span class="text-body-1 font-weight-medium">Resources Allocated</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          <VRow>
          <!-- Storage Usage -->
          <VCol cols="12" md="4" lg="4">
            <VCard variant="tonal" color="info">
              <VCardText class="pa-3">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="d-flex align-center mb-2">
                      <VAvatar color="info" variant="flat" size="32" class="mr-2">
                        <VIcon icon="mdi-harddisk" size="18" color="white" />
                      </VAvatar>
                      <span class="text-body-2 font-weight-medium">Storage</span>
                    </div>
                    <div class="text-h5 font-weight-bold">{{ systemInfo.storage.used }} GB</div>
                    <div class="text-body-2 text-medium-emphasis">of {{ systemInfo.storage.total }} GB</div>
                  </div>
                  <VProgressCircular
                    :model-value="(systemInfo.storage.used / systemInfo.storage.total) * 100"
                    :size="80"
                    :width="8"
                    color="info"
                  >
                    <span class="text-caption font-weight-bold">{{ Math.round((systemInfo.storage.used / systemInfo.storage.total) * 100) }}%</span>
                  </VProgressCircular>
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <!-- CPU Usage -->
          <VCol cols="12" md="4" lg="4">
            <VCard variant="tonal" color="success">
              <VCardText class="pa-3">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="d-flex align-center mb-2">
                      <VAvatar color="success" variant="flat" size="32" class="mr-2">
                        <VIcon icon="mdi-cpu-64-bit" size="18" color="white" />
                      </VAvatar>
                      <span class="text-body-2 font-weight-medium">vCPU</span>
                    </div>
                    <div class="text-h5 font-weight-bold">{{ systemInfo.cpu.used }} vCores</div>
                    <div class="text-body-2 text-medium-emphasis">of {{ systemInfo.cpu.cores }} vCores</div>
                  </div>
                  <VProgressCircular
                    :model-value="systemInfo.cpu.usage"
                    :size="80"
                    :width="8"
                    color="success"
                  >
                    <span class="text-caption font-weight-bold">{{ systemInfo.cpu.usage }}%</span>
                  </VProgressCircular>
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <!-- RAM Usage -->
          <VCol cols="12" md="4" lg="4">
            <VCard variant="tonal" color="warning">
              <VCardText class="pa-3">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="d-flex align-center mb-2">
                      <VAvatar color="warning" variant="flat" size="32" class="mr-2">
                        <VIcon icon="mdi-memory" size="18" color="white" />
                      </VAvatar>
                      <span class="text-body-2 font-weight-medium">RAM</span>
                    </div>
                    <div class="text-h5 font-weight-bold">{{ systemInfo.ram.used }} GB</div>
                    <div class="text-body-2 text-medium-emphasis">of {{ systemInfo.ram.total }} GB</div>
                  </div>
                  <VProgressCircular
                    :model-value="(systemInfo.ram.used / systemInfo.ram.total) * 100"
                    :size="80"
                    :width="8"
                    color="warning"
                  >
                    <span class="text-caption font-weight-bold">{{ Math.round((systemInfo.ram.used / systemInfo.ram.total) * 100) }}%</span>
                  </VProgressCircular>
                </div>
              </VCardText>
            </VCard>
          </VCol>

        </VRow>
      </VCardText>
    </VCard>

    <!-- Applications -->
    <VCard class="mb-3" elevation="1">
      <VCardTitle class="d-flex align-center pa-3 bg-surface">
        <VIcon icon="mdi-apps" size="24" class="mr-2" />
        <span class="text-body-1 font-weight-medium">Applications</span>
      </VCardTitle>
      <VDivider />
      <VCardText class="pa-3">
        <VRow>
          <!-- Installed Apps -->
          <VCol cols="12" md="6" lg="6">
            <VCard variant="tonal" color="primary" class="h-100">
              <VCardText class="pa-3">
                <div class="d-flex align-center justify-space-between" style="min-height: 96px;">
                  <div>
                    <div class="d-flex align-center mb-2">
                      <VAvatar color="primary" variant="flat" size="32" class="mr-2">
                        <VIcon icon="mdi-apps" size="18" color="white" />
                      </VAvatar>
                      <span class="text-body-2 font-weight-medium">Installed Apps</span>
                    </div>
                    <div class="text-h5 font-weight-bold">{{ installedApps.length }} application(s)</div>
                  </div>
                  <VProgressCircular
                    :model-value="installedApps.length > 0 ? 100 : 0"
                    :size="80"
                    :width="8"
                    color="primary"
                  >
                    <VIcon icon="mdi-apps" size="32" color="primary" />
                  </VProgressCircular>
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Apps Hashes -->
          <VCol cols="12" md="6" lg="6">
            <VCard variant="tonal" color="info" class="h-100">
              <VCardText class="pa-3">
                <div class="d-flex align-center justify-space-between" style="min-height: 96px;">
                  <div>
                    <div class="d-flex align-center mb-2">
                      <VAvatar color="info" variant="flat" size="32" class="mr-2">
                        <VIcon icon="mdi-database-check" size="18" color="white" />
                      </VAvatar>
                      <span class="text-body-2 font-weight-medium">Apps Hashes</span>
                    </div>
                    <div class="text-h5 font-weight-bold">{{ systemInfo.hashesPresent }} / {{ systemInfo.appsHashesTotal }}</div>
                    <VChip size="small" variant="flat" color="warning" class="mt-1">
                      <VIcon icon="mdi-alert-circle-outline" size="16" class="mr-1" />
                      {{ systemInfo.appsHashesTotal - systemInfo.hashesPresent }} not synced
                    </VChip>
                  </div>
                  <VProgressCircular
                    :model-value="systemInfo.appsHashesTotal > 0 ? (systemInfo.hashesPresent / systemInfo.appsHashesTotal) * 100 : 0"
                    :size="80"
                    :width="8"
                    color="info"
                  >
                    <span class="text-caption font-weight-bold">{{ systemInfo.appsHashesTotal > 0 ? ((systemInfo.hashesPresent / systemInfo.appsHashesTotal) * 100).toFixed(1) : 0 }}%</span>
                  </VProgressCircular>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Component Versions -->
    <VCard class="mb-3" elevation="1">
      <VCardTitle class="d-flex align-center pa-3 bg-surface">
        <VIcon icon="mdi-package-variant" size="24" class="mr-2" />
        <span class="text-body-1 font-weight-medium">Component Versions</span>
      </VCardTitle>
      <VDivider />
      <VCardText class="pa-3">
        <VRow>
          <VCol
            v-for="component in componentVersions"
            :key="component.name"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <VCard variant="flat" style="background-color: rgba(0, 0, 0, 0.08);" class="border">
              <VCardText class="pa-3">
                <div class="d-flex align-center">
                  <div v-if="component.isImage" class="mr-3" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                    <VImg :src="component.icon" width="40" height="40" contain />
                  </div>
                  <VAvatar v-else :color="component.color" variant="flat" size="40" class="mr-3">
                    <VIcon :icon="component.icon" size="28" color="white" />
                  </VAvatar>
                  <div>
                    <div class="text-body-2 font-weight-medium">{{ component.name }}</div>
                    <VChip size="small" variant="tonal" :color="component.color" class="mt-1">
                      {{ formatVersion(component.version) }}
                    </VChip>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'
import BenchmarkService from '@/services/BenchmarkService'
import FluxService from '@/services/FluxService'
import AppsService from '@/services/AppsService'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import MaintenanceCard from '@/components/Marketplace/MaintenanceCard.vue'
import fluxLogo from '/images/logo.png?url'
import syncthingLogo from '/images/syncthing-logo.png?url'

const { showSnackbar } = useSnackbar()
const loading = ref(true)
const showContent = ref(false)
const error = ref(null)

// System information state
const systemInfo = ref({
  storage: { used: 0, total: 0 },
  cpu: { used: 0, cores: 0, usage: 0 },
  ram: { used: 0, total: 0 },
  appsHashesTotal: 0,
  hashesPresent: 0
})
const installedApps = ref([])
const componentVersions = ref([])

// Preload images
const preloadImages = () => {
  const images = ['/images/logo.png', '/images/syncthing-logo.png']
  return Promise.all(
    images.map(src => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => resolve(img) // Resolve anyway to not block loading
        img.src = src
      })
    })
  )
}

// Fetch system information
const fetchSystemInfo = async () => {
  loading.value = true
  error.value = null

  // Start loading data, images, and 2s timer in parallel
  const dataPromise = (async () => {
    try {
      // Fetch flux info - it has all the data we need
      const fluxInfoResponse = await FluxService.getFluxInfo()
      console.log('Flux info response:', fluxInfoResponse)

      // Check for error status
      if (fluxInfoResponse?.data?.status === 'error') {
        error.value = fluxInfoResponse.data.data || { message: 'An error occurred while loading system information' }
        return
      }

      if (fluxInfoResponse?.data?.status === 'success' && fluxInfoResponse?.data?.data) {
        const fluxData = fluxInfoResponse.data.data

      // Get system resources from apps.fluxusage
      if (fluxData.apps?.fluxusage) {
        const usage = fluxData.apps.fluxusage
        console.log('Flux usage data:', usage)

        // Get actual system specs from nodeSpecs
        const nodeSpecs = usage.nodeSpecs || {}

        // Get apps locked resources
        const appsResources = fluxData.apps?.resources || {}
        const appsCpuLocked = appsResources.appsCpusLocked || 0
        const appsRamLocked = appsResources.appsRamLocked || 0 // in MB
        const appsHddLocked = appsResources.appsHddLocked || 0 // in GB
        console.log('Apps locked:', { cpu: appsCpuLocked, ram: appsRamLocked, hdd: appsHddLocked })

        // Storage - total from nodeSpecs, locked is what apps are using
        const storageTotalGB = nodeSpecs.ssdStorage || 0
        systemInfo.value.storage.total = Math.round(storageTotalGB)
        systemInfo.value.storage.used = Math.round(appsHddLocked)

        // CPU - total from nodeSpecs, locked is what apps are using
        const totalCores = nodeSpecs.cpuCores || 0
        systemInfo.value.cpu.cores = totalCores
        systemInfo.value.cpu.used = appsCpuLocked
        systemInfo.value.cpu.usage = totalCores > 0 ? Math.round((appsCpuLocked / totalCores) * 100) : 0

        // RAM - total from nodeSpecs, locked is what apps are using
        const ramTotalMB = nodeSpecs.ram || 0
        const ramTotalGB = ramTotalMB / 1024
        const ramLockedGB = appsRamLocked / 1024
        systemInfo.value.ram.total = Math.round(ramTotalGB)
        systemInfo.value.ram.used = Math.round(ramLockedGB)

        // Apps hashes information
        systemInfo.value.appsHashesTotal = fluxData.appsHashesTotal || 0
        systemInfo.value.hashesPresent = fluxData.hashesPresent || 0
      }

      const fluxInfo = fluxData.flux

      const iconMap = {
        version: fluxLogo,
        dockerversion: 'mdi-docker',
        syncthingversion: syncthingLogo,
        nodejsversion: 'mdi-nodejs',
        osversion: 'mdi-linux',
        osprettyname: 'mdi-linux',
        arcaneversion: 'mdi-package-variant',
        arcanehumanversion: 'mdi-package-variant-closed'
      }

      const nameMap = {
        version: 'Flux',
        dockerversion: 'Docker',
        syncthingversion: 'Syncthing',
        nodejsversion: 'Node.js',
        osversion: 'OS Version',
        osprettyname: 'OS',
        arcaneversion: 'Arcane',
        arcanehumanversion: 'Arcane Human'
      }

      const colorMap = {
        version: 'info',
        dockerversion: 'blue',
        syncthingversion: 'secondary',
        nodejsversion: 'success',
        osprettyname: 'warning',
        arcaneversion: 'purple',
        arcanehumanversion: 'indigo'
      }

      componentVersions.value = Object.keys(fluxInfo)
        .filter(key => {
          const keyLower = key.toLowerCase()
          // Include version fields but exclude osversion (keep only osprettyname)
          if (keyLower === 'osversion') return false
          return keyLower.includes('version') || keyLower === 'osprettyname'
        })
        .map(field => {
          const icon = iconMap[field.toLowerCase()] || 'mdi-package-variant'
          return {
            name: nameMap[field.toLowerCase()] || field.replace('version', '').replace(/([A-Z])/g, ' $1').trim()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
            version: fluxInfo[field],
            icon: icon,
            isImage: icon.startsWith('/') || icon.startsWith('http'),
            color: colorMap[field.toLowerCase()] || 'grey'
          }
        })
        .filter(c => c.version && typeof c.version === 'string')

      console.log('Component versions:', componentVersions.value)
    }
    } catch (err) {
      console.error('Error fetching system info:', err)
      error.value = {
        name: 'Connection Error',
        message: 'Unable to connect to the system. Please check your connection and try again.'
      }
    }
  })()

  // Wait for data loading, image preloading, and 2s delay
  const delayPromise = new Promise(resolve => setTimeout(resolve, 2000))
  const imagesPromise = preloadImages()

  await Promise.all([dataPromise, delayPromise, imagesPromise])
  loading.value = false
}

// Fetch installed apps
const fetchInstalledApps = async () => {
  try {
    const appsResponse = await AppsService.installedApps()
    if (appsResponse?.data?.status === 'success' && appsResponse?.data?.data) {
      installedApps.value = appsResponse.data.data.map(app => ({
        name: app.name || app
      }))
    }
  } catch (error) {
    console.error('Error fetching installed apps:', error)
  }
}

// Format version - remove 'v' prefix
const formatVersion = (version) => {
  if (!version) return 'N/A'
  return version.toString().replace(/^v/i, '')
}

onMounted(() => {
  fetchSystemInfo()
  fetchInstalledApps()
})
</script>

<style scoped>
.version-chip {
  height: 34px !important;
}
</style>

<route lang="yaml">
meta:
  privilege:
    - admin
    - fluxteam
</route>
