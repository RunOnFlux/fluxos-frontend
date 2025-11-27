<template>
  <div
    class="map"
    :class="{ 'dark-theme': theme.value === 'dark' }"
  >
    <!-- Introduction Section -->
    <VRow class="mb-3">
      <VCol cols="12">
        <VCard class="locations-intro-card">
          <VCardText>
            <div class="d-flex align-center mb-3">
              <VAvatar
                size="48"
                color="primary"
                variant="tonal"
                class="mr-3"
              >
                <VIcon size="28">mdi-earth</VIcon>
              </VAvatar>
              <div>
                <h2 class="text-h4 mb-1">{{ t('pages.dashboard.locations.intro.title') }}</h2>
                <p class="text-body-2 mb-0 text-medium-emphasis">{{ t('pages.dashboard.locations.intro.subtitle') }}</p>
              </div>
            </div>
            <p class="text-body-1 mb-0">
              {{ t('pages.dashboard.locations.intro.description') }}
            </p>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <MapComponent
      v-if="fluxList.length > 0"
      :nodes="fluxList"
      class="mb-6"
    />
    <VRow>
      <VCol
        md="6"
        sm="12"
        cols="12"
      >
        <div class="location-card-wrapper">
          <div class="location-card-header">
            <VAvatar
              size="48"
              color="secondary"
              variant="tonal"
              class="mr-3"
            >
              <VIcon size="24">
                mdi-map-marker
              </VIcon>
            </VAvatar>
            <h3 class="text-h5 mb-0">
              {{ t('pages.dashboard.locations.geographicTitle') }}
            </h3>
            <VSpacer />
            <VChip
              color="success"
              size="small"
            >
              {{ getLocationCount() }}
            </VChip>
          </div>
          <VCard style="overflow: visible !important; clip-path: none !important; min-height: 400px; padding-top: 30px !important;" class="location-card-content">
            <VOverlay
              v-model="isLoading"
              contained
              persistent
              scroll-strategy="none"
              class="align-center justify-center overlay"
            >
              <VProgressCircular indeterminate />
            </VOverlay>

            <template v-if="geographicData.series.length > 0">
              <VueApexCharts
                ref="geoChart"
                type="donut"
                height="400"
                width="100%"
                :options="geographicData.chartOptions"
                :series="geographicData.series"
              />
            </template>
            <template v-else>
              <div class="no-data">
                {{ t('pages.dashboard.locations.noGeographicData') }}
              </div>
            </template>
          </VCard>
        </div>
      </VCol>

      <VCol
        md="6"
        sm="12"
        cols="12"
      >
        <div class="location-card-wrapper">
          <div class="location-card-header">
            <VAvatar
              size="48"
              color="secondary"
              variant="tonal"
              class="mr-3"
            >
              <VIcon size="24">
                mdi-server-network
              </VIcon>
            </VAvatar>
            <h3 class="text-h5 mb-0">
              {{ t('pages.dashboard.locations.providersTitle') }}
            </h3>
            <VSpacer />
            <VChip
              color="success"
              size="small"
            >
              {{ getProviderCount() }}
            </VChip>
          </div>
          <VCard style="overflow: visible !important; clip-path: none !important; min-height: 400px; padding-top: 30px !important;" class="location-card-content">
            <VOverlay
              v-model="isLoading"
              contained
              persistent
              scroll-strategy="none"
              class="align-center justify-center overlay"
            >
              <VProgressCircular indeterminate />
            </VOverlay>

            <template v-if="providerData.series.length > 0">
              <VueApexCharts
                ref="providerChart"
                type="donut"
                height="400"
                width="100%"
                :options="providerData.chartOptions"
                :series="providerData.series"
              />
            </template>
            <template v-else>
              <div class="no-data">
                {{ t('pages.dashboard.locations.noProviderData') }}
              </div>
            </template>
          </VCard>
        </div>
      </VCol>
    </VRow>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from "vue"
import { useI18n } from "vue-i18n"
import axios from "axios"
import DashboardService from "@/services/DashboardService"
import { useConfigStore } from "@core/stores/config"
import { storeToRefs } from "pinia"
import { useSEO, generateOrganizationSchema, generateBreadcrumbSchema } from '@/composables/useSEO'

// Initialize i18n
const { t } = useI18n()

// SEO configuration
useSEO({
  title: 'Flux Node Locations - Global Network Map | FluxCloud',
  description: 'Explore the global distribution of 8,000+ FluxNodes. Interactive map showing node locations across 70+ countries. View network decentralization and geographic spread of Flux infrastructure worldwide.',
  url: 'https://cloud.runonflux.com/dashboards/locations',
  keywords: 'flux node map, node locations, global network, geographic distribution, flux nodes worldwide, decentralized network map, node distribution, blockchain network map',
  structuredData: [
    generateOrganizationSchema(),
    generateBreadcrumbSchema([
      { name: 'Home', url: 'https://cloud.runonflux.com' },
      { name: 'Flux Network', url: 'https://cloud.runonflux.com/dashboards/overview' },
      { name: 'Locations', url: 'https://cloud.runonflux.com/dashboards/locations' },
    ]),
  ],
})

// Reactive state
const fluxList = ref([])
const fluxNodeCount = ref(0)
const geoChart = ref(null)
const providerChart = ref(null)
const isLoading = ref(true)

const providerData = reactive({
  series: [],
  chartOptions: {
    chart: { toolbar: { show: false } },
    dataLabels: { enabled: true },
    legend: {
      show: true,
      position: "bottom",
      height: 100,
    },
    stroke: { width: 0 },
    plotOptions: { pie: { donut: { size: "40%" } } },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: { height: 400 },
          legend: {
            show: true,
            position: "bottom",
            height: 80,
            fontSize: "10px",
          },
          dataLabels: { enabled: true },
        },
      },
    ],
  },
})

const geographicData = reactive({
  series: [],
  chartOptions: {
    chart: { toolbar: { show: false } },
    dataLabels: { enabled: true },
    legend: {
      show: true,
      position: "bottom",
      height: 100,
    },
    stroke: { width: 0 },
    plotOptions: { pie: { donut: { size: "40%" } } },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: { height: 400 },
          legend: {
            show: true,
            position: "bottom",
            height: 80,
            fontSize: "10px",
          },
          dataLabels: { enabled: true },
        },
      },
    ],
  },
})

const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)

const getFluxList = async () => {
  try {
    const resLoc = await axios.get(
      "https://stats.runonflux.io/fluxinfo?projection=geolocation,ip,tier",
    )

    fluxList.value = resLoc.data.data || []
    console.log("fluxList length:", fluxList.value.length)

    const resList = await DashboardService.fluxnodeCount()

    fluxNodeCount.value = resList.data.data.total || 0
    console.log("fluxNodeCount:", fluxNodeCount.value)
  } catch (error) {
    console.error("Error fetching flux list:", error)
    fluxList.value = []
    fluxNodeCount.value = 0
  }
}

const generateGeographicPie = async () => {
  try {
    const labels = []
    const data = []
    const nodeData = []

    fluxList.value.forEach(flux => {
      const country = flux.geolocation?.country || t('pages.dashboard.locations.unknown')
      const existingPoint = nodeData.find(node => node.country === country)
      if (existingPoint) {
        existingPoint.amount += 1
      } else {
        nodeData.push({ country, amount: 1 })
      }
    })

    for (let i = 0; i < fluxNodeCount.value - fluxList.value.length; i++) {
      const unknownLabel = t('pages.dashboard.locations.unknown')
      const existingPoint = nodeData.find(node => node.country === unknownLabel)
      if (existingPoint) {
        existingPoint.amount += 1
      } else {
        nodeData.push({ country: unknownLabel, amount: 1 })
      }
    }

    nodeData.sort((a, b) => b.amount - a.amount)
    nodeData.forEach(node => {
      labels.push(`${node.country} (${node.amount})`)
      data.push(node.amount)
    })

    geographicData.series = data
    geographicData.chartOptions = {
      ...geographicData.chartOptions,
      labels,
    }
  } catch (error) {
    console.error("Error generating geographic pie:", error)
    geographicData.series = []
  }
}

const generateProviderPie = async () => {
  try {
    const labels = []
    const data = []
    const nodeData = []

    fluxList.value.forEach(flux => {
      const org = flux.geolocation?.org || t('pages.dashboard.locations.unknown')
      const existingPoint = nodeData.find(node => node.org === org)
      if (existingPoint) {
        existingPoint.amount += 1
      } else {
        nodeData.push({ org, amount: 1 })
      }
    })

    for (let i = 0; i < fluxNodeCount.value - fluxList.value.length; i++) {
      const unknownLabel = t('pages.dashboard.locations.unknown')
      const existingPoint = nodeData.find(node => node.org === unknownLabel)
      if (existingPoint) {
        existingPoint.amount += 1
      } else {
        nodeData.push({ org: unknownLabel, amount: 1 })
      }
    }

    nodeData.sort((a, b) => b.amount - a.amount)
    nodeData.forEach(node => {
      labels.push(`${node.org} (${node.amount})`)
      data.push(node.amount)
    })

    providerData.series = data
    providerData.chartOptions = {
      ...providerData.chartOptions,
      labels,
    }
  } catch (error) {
    console.error("Error generating provider pie:", error)
    providerData.series = []
  }
}

const getLocationCount = () =>
  geographicData.series.length > 0 ? geographicData.series.length : 0

const getProviderCount = () =>
  providerData.series.length > 0 ? providerData.series.length : 0

const ensureThemeClass = () => {
  const mapDiv = document.querySelector(".map")
  if (theme.value === "dark" && !mapDiv.classList.contains("dark-theme")) {
    console.log("Forcing dark-theme class on mount")
    mapDiv.classList.add("dark-theme")
  } else if (theme.value !== "dark" && mapDiv.classList.contains("dark-theme")) {
    console.log("Forcing removal of dark-theme class on mount")
    mapDiv.classList.remove("dark-theme")
  }
}

onMounted(async () => {
  console.log("🟢 onMounted: Starting")
  console.log("Initial theme:", theme.value, "Type:", typeof theme.value)

  ensureThemeClass()
  isLoading.value = true

  try {
    console.log("🔄 Fetching flux list...")
    await getFluxList()
    console.log("✅ Flux list fetched, awaiting DOM update...")
    await nextTick()

    // Wait for UI to paint spinner
    setTimeout(async () => {
      console.log("📊 Starting both pie generations in parallel...")

      const geoPromise = generateGeographicPie()
      const providerPromise = generateProviderPie()

      await Promise.all([geoPromise, providerPromise])

      console.log("✅ Both pie charts generated")
      isLoading.value = false
    }, 1000)
  } catch (error) {
    console.error("❌ Error during initialization:", error)
    isLoading.value = false
  }
})

watch(
  () => theme.value,
  async (newTheme, oldTheme) => {
    console.log("Theme changed from:", oldTheme, "to:", newTheme)
    ensureThemeClass()
    await nextTick()
  },
)
</script>

<style lang="scss" scoped>
/* Apply border and border-radius to all cards */
:deep(.v-card) {
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

.locations-intro-card {
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

.locations-intro-card h2 {
  line-height: 1.2;
  word-break: keep-all;
}

/* Mobile responsive adjustments */
@media (max-width: 599px) {
  .locations-intro-card h2 {
    font-size: 1.5rem !important;
  }

  .locations-intro-card .v-avatar {
    width: 48px !important;
    height: 48px !important;
  }

  .locations-intro-card .v-icon {
    font-size: 24px !important;
  }

  .locations-intro-card .v-card-text {
    padding: 16px !important;
  }
}

.overlay {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-data {
  text-align: center;
  font-size: 18px;
  color: #999;
  margin-top: 30px;
}

/* Location card with external header */
.location-card-wrapper {
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.location-card-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.location-card-content {
  border-radius: 0 0 16px 16px !important;
  border: none !important;
  overflow: hidden !important;
  padding-top: 30px !important;
}

/* Scale chart to compensate for padding on all resolutions except mobile */
@media (min-width: 601px) {
  /* Make chart slightly larger to compensate for padding */
  .location-card-content .apexcharts-canvas {
    transform: scale(1.15);
    transform-origin: center center;
  }
}
</style>

<style lang="scss">
/* Non-scoped styles for ApexCharts */
.map {
  .apexcharts-legend {
    display: block !important;
    overflow-y: auto;
    max-height: 100px;
    padding: 16px;
    direction: ltr;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(var(--v-theme-on-surface), 0.3);
      border-radius: 4px;
    }
    .apexcharts-legend-series {
      display: inline-block;
      margin: 4px !important;
      align-items: center;
    }
    .apexcharts-legend-marker {
      display: inline-block;
      vertical-align: middle;
      margin-right: 4px;
    }
    .apexcharts-legend-text {
      display: inline-block;
      vertical-align: middle;
    }
  }

  @media (max-width: 600px) {
    .apexcharts-legend {
      max-height: 80px;
      padding: 8px 8px 0 16px !important;
      margin-bottom: -16px !important;
      font-size: 11px !important;
      text-align: left;
      width: calc(100% + 32px) !important;
      margin-left: -16px !important;
      margin-right: -16px !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
    }
    .apexcharts-legend-series {
      margin: 3px !important;
      white-space: nowrap;
    }
    .apexcharts-legend-text {
      font-size: 11px !important;
    }
    .apexcharts-canvas {
      height: 400px !important;
    }
    .location-card-content {
      padding-left: 16px !important;
      padding-right: 16px !important;
      /* Keep padding-top: 30px from parent rule */
    }
  }

  &.dark-theme {
    span.apexcharts-legend-text {
      color: #d0d2d6 !important;
    }
    .apexcharts-xaxis-text,
    .apexcharts-yaxis-text,
    .apexcharts-title-text,
    .apexcharts-tooltip-text,
    .apexcharts-tooltip-title,
    .apexcharts-datalabel,
    .apexcharts-datalabel-value,
    .apexcharts-datalabel-label {
      fill: #d0d2d6 !important;
    }
    .apexcharts-canvas {
      ::-webkit-scrollbar-track {
        background-color: #2a2a2a;
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb {
        background-color: #888888;
      }
    }
  }
}

.apexcharts-canvas {
  ::-webkit-scrollbar-track {
    background-color: #888888;
    border-radius: 10px;
  }
}

.map:not(.dark-theme) {
  span.apexcharts-legend-text,
  .apexcharts-xaxis-text,
  .apexcharts-yaxis-text,
  .apexcharts-title-text,
  .apexcharts-tooltip-text,
  .apexcharts-tooltip-title,
  .apexcharts-datalabel,
  .apexcharts-datalabel-value,
  .apexcharts-datalabel-label {
    color: #333333 !important;
    fill: #333333 !important;
  }
}
</style>
