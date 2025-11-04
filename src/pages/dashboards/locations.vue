<template>
  <div
    class="map"
    :class="{ 'dark-theme': theme.value === 'dark' }"
  >
    <!-- Introduction Section -->
    <VRow class="mb-6">
      <VCol cols="12">
        <VCard flat class="locations-intro-card">
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
        <VCard
          elevation="2"
          class="pa-4"
        >
          <VOverlay
            v-model="isLoading"
            contained
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>

          <h3>{{ t('pages.dashboard.locations.geographicTitle', { count: getLocationCount() }) }}</h3>

          <template v-if="geographicData.series.length > 0">
            <VueApexCharts
              ref="geoChart"
              type="donut"
              height="600"
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
      </VCol>

      <VCol
        md="6"
        sm="12"
        cols="12"
      >
        <VCard
          elevation="2"
          class="pa-4"
        >
          <VOverlay
            v-model="isLoading"
            contained
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>

          <h3>{{ t('pages.dashboard.locations.providersTitle', { count: getProviderCount() }) }}</h3>

          <template v-if="providerData.series.length > 0">
            <VueApexCharts
              ref="providerChart"
              type="donut"
              height="600"
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

// Initialize i18n
const { t } = useI18n()

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
          chart: { height: 350 },
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
          chart: { height: 350 },
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

<style lang="scss">
.locations-intro-card {
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-success), 0.05) 100%);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.locations-intro-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.1);
}

.map {
  .apexcharts-legend {
    display: block !important;
    overflow-y: auto;
    max-height: 100px;
    padding: 5px 0;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-track {
      background: #2a2a2a;
      border-radius: 10px;
    }
    &::-webkit-scrollbar-thumb {
      background: #888888;
      border-radius: 10px;
    }
    .apexcharts-legend-series {
      display: inline-block;
      margin: 2px 4px !important;
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
      font-size: 10px !important;
    }
    .apexcharts-canvas {
      height: 350px !important;
    }
    .v-card {
      padding: 16px !important;
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

.overlay {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.no-data {
  text-align: center;
  font-size: 18px;
  color: #999;
  margin-top: 30px;
}
</style>
