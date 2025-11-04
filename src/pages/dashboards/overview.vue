<template>
  <!-- Introduction Section -->
  <VRow class="mb-6">
    <VCol cols="12">
      <VCard flat class="intro-card">
        <VCardTitle class="text-h4 mb-4">
          {{ t('pages.dashboard.overview.intro.title') }}
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <a
                href="https://runonflux.com"
                target="_blank"
                rel="noopener noreferrer"
                class="info-link"
              >
                <div class="info-section">
                  <div class="d-flex align-center mb-3">
                    <VAvatar
                      size="40"
                      color="primary"
                      variant="tonal"
                      class="mr-3"
                    >
                      <VIcon size="24">mdi-cube-outline</VIcon>
                    </VAvatar>
                    <h3 class="text-h5">{{ t('pages.dashboard.overview.intro.blockchain.title') }}</h3>
                  </div>
                  <p class="text-body-1">
                    {{ t('pages.dashboard.overview.intro.blockchain.description') }}
                  </p>
                  <div class="learn-more">
                    <VIcon size="18" class="mr-1">mdi-open-in-new</VIcon>
                    {{ t('pages.dashboard.overview.intro.learnMore') }}
                  </div>
                </div>
              </a>
            </VCol>
            <VCol cols="12" md="6">
              <a
                href="https://runonflux.com"
                target="_blank"
                rel="noopener noreferrer"
                class="info-link"
              >
                <div class="info-section">
                  <div class="d-flex align-center mb-3">
                    <VAvatar
                      size="40"
                      color="success"
                      variant="tonal"
                      class="mr-3"
                    >
                      <VIcon size="24">mdi-cloud-outline</VIcon>
                    </VAvatar>
                    <h3 class="text-h5">{{ t('pages.dashboard.overview.intro.cloud.title') }}</h3>
                  </div>
                  <p class="text-body-1">
                    {{ t('pages.dashboard.overview.intro.cloud.description', { nodes: beautifyValue(totalNodes, 0) }) }}
                  </p>
                  <div class="learn-more">
                    <VIcon size="18" class="mr-1">mdi-open-in-new</VIcon>
                    {{ t('pages.dashboard.overview.intro.learnMore') }}
                  </div>
                </div>
              </a>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VRow class="match-height">
    <!-- Card 1: Total Nodes -->
    <VCol
      cols="12"
      lg="6"
      xxl="4"
    >
      <VCard
        flat
        style="position: relative; min-height: 320px"
      >
        <VCardTitle class="d-flex justify-space-between align-center">
          <div>
            <h2 class="mt-0 truncate text-h4">
              {{ t('pages.dashboard.overview.totalNodes') }}: {{ totalNodes }}
            </h2>
          </div>
          <VAvatar
            size="48"
            color="success"
            variant="tonal"
          >
            <VIcon size="24">
              mdi-server
            </VIcon>
          </VAvatar>
        </VCardTitle>
        <VCardText>
          <VRow>
            <!-- Chart on the left, taking 2/3 width -->
            <VCol
              cols="12"
              sm="8"
            >
              <VueApexCharts
                type="donut"
                height="280"
                width="100%"
                :options="nodeData.chartOptions"
                :series="nodeData.series"
              />
            </VCol>

            <!-- Version list on the right, taking 1/3 width -->
            <VCol
              cols="12"
              sm="4"
            >
              <div class="px-2 pt-2">
                <h4 class="mb-2">
                  <VChip
                    color="success"
                    size="small"
                  >
                    {{ t('pages.dashboard.overview.versionBreakdown') }}
                  </VChip>
                </h4>
                <div
                  v-if="Object.keys(versionLog).length > 0"
                  class="d-flex flex-column"
                  style="gap: 6px"
                >
                  <VCard
                    v-for="(count, version, index) in versionLog"
                    :key="version"
                    variant="outlined"
                    class="pa-2 version-card"
                    style="border-left: 3px solid; position: relative"
                    :style="{ borderLeftColor: getVersionColor(version, index) }"
                  >
                    <div class="text-body-2 font-weight-medium">
                      {{ version === 'legacy' ? t('pages.dashboard.overview.legacy') : version }}
                    </div>
                    <div class="text-body-2 font-weight-bold">
                      {{ count }} <span class="text-caption text-medium-emphasis">{{ t('pages.dashboard.overview.nodes', count) }}</span>
                    </div>
                    <VChip
                      v-if="version !== 'legacy'"
                      class="arcane-label"
                      :class="theme === 'dark' ? 'arcane-glow-dark' : 'arcane-glow-light'"
                      size="x-small"
                      :color="theme === 'dark' ? 'white' : 'primary'"
                    >
                      Arcane OS
                    </VChip>
                  </VCard>
                </div>
              </div>
            </VCol>
          </VRow>
        </VCardText>
        <VOverlay
          v-model="isLoading"
          contained
          persistent
          scroll-strategy="none"
          class="align-center justify-center overlay"
        >
          <VProgressCircular indeterminate />
        </VOverlay>
      </VCard>
    </VCol>

    <!-- Card 2: Node History -->
    <VCol
      cols="12"
      lg="6"
      xxl="8"
    >
      <VCard
        flat
        class="d-flex flex-column justify-space-between"
        style="position: relative; min-height: 320px; height: 100%"
      >
        <VCardTitle class="d-flex justify-space-between align-center">
          <h2 class="mt-2 truncate text-h4">
            {{ t('pages.dashboard.overview.nodeHistory') }}
          </h2>
        </VCardTitle>
        <VueApexCharts
          ref="history"
          type="area"
          height="280"
          width="100%"
          :options="nodeHistoryData.chartOptions"
          :series="nodeHistoryData.series"
        />
        <VOverlay
          v-model="isLoading"
          contained
          persistent
          scroll-strategy="none"
          class="align-center justify-center overlay"
        >
          <VProgressCircular indeterminate />
        </VOverlay>
      </VCard>
    </VCol>
  </VRow>

  <VRow class="match-height">
    <!-- Card 3: Locked Supply -->
    <VCol
      cols="12"
      lg="6"
      xxl="4"
    >
      <VCard
        flat
        style="position: relative; min-height: 320px"
      >
        <VOverlay
          v-model="isLoading"
          contained
          persistent
          scroll-strategy="none"
          class="align-center justify-center overlay"
        >
          <VProgressCircular indeterminate />
        </VOverlay>
        <VCardTitle class="d-flex justify-space-between align-center justify-center">
          <div>
            <h2 class="mt-0 truncate text-h4">
              {{ t('pages.dashboard.overview.lockedSupply') }}: {{ beautifyValue(lockedSupply, 0) }}
            </h2>
          </div>
          <VAvatar
            size="48"
            color="success"
            variant="tonal"
          >
            <VIcon size="24">
              mdi-lock
            </VIcon>
          </VAvatar>
        </VCardTitle>
        <VCardText>
          <VRow>
            <!-- Chart on the left, taking 2/3 width -->
            <VCol
              cols="12"
              sm="8"
            >
              <VueApexCharts
                type="donut"
                height="280"
                width="100%"
                :options="lockedSupplyData.chartOptions"
                :series="lockedSupplyData.series"
              />
            </VCol>

            <!-- Legend on the right, taking 1/3 width -->
            <VCol
              cols="12"
              sm="4"
            >
              <div class="px-2 pt-2">
                <h4 class="mb-2">
                  <VChip
                    color="success"
                    size="small"
                  >
                    {{ t('pages.dashboard.overview.tierBreakdown') }}
                  </VChip>
                </h4>
                <div
                  v-if="lockedSupplyData.series.length > 0"
                  class="d-flex flex-column"
                  style="gap: 6px"
                >
                  <VCard
                    variant="outlined"
                    class="pa-2"
                    style="border-left: 3px solid"
                    :style="{ borderLeftColor: lockedSupplyData.chartOptions.colors[0] }"
                  >
                    <div class="text-body-2 font-weight-medium">
                      {{ t('pages.dashboard.overview.cumulus') }}
                    </div>
                    <div class="text-body-2 font-weight-bold">
                      {{ beautifyValue(lockedSupplyData.series[0] || 0, 0) }} <span class="text-caption text-medium-emphasis">FLUX</span>
                    </div>
                  </VCard>

                  <VCard
                    variant="outlined"
                    class="pa-2"
                    style="border-left: 3px solid"
                    :style="{ borderLeftColor: lockedSupplyData.chartOptions.colors[1] }"
                  >
                    <div class="text-body-2 font-weight-medium">
                      {{ t('pages.dashboard.overview.nimbus') }}
                    </div>
                    <div class="text-body-2 font-weight-bold">
                      {{ beautifyValue(lockedSupplyData.series[1] || 0, 0) }} <span class="text-caption text-medium-emphasis">FLUX</span>
                    </div>
                  </VCard>

                  <VCard
                    variant="outlined"
                    class="pa-2"
                    style="border-left: 3px solid"
                    :style="{ borderLeftColor: lockedSupplyData.chartOptions.colors[2] }"
                  >
                    <div class="text-body-2 font-weight-medium">
                      {{ t('pages.dashboard.overview.stratus') }}
                    </div>
                    <div class="text-body-2 font-weight-bold">
                      {{ beautifyValue(lockedSupplyData.series[2] || 0, 0) }} <span class="text-caption text-medium-emphasis">FLUX</span>
                    </div>
                  </VCard>
                </div>
              </div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Card 4: FLUX Supply -->
    <VCol
      cols="12"
      lg="6"
      xxl="8"
    >
      <VCard
        flat
        style="position: relative; min-height: 320px"
      >
        <VOverlay
          v-model="isLoading"
          contained
          persistent
          scroll-strategy="none"
          class="align-center justify-center overlay"
        >
          <VProgressCircular indeterminate />
        </VOverlay>
        <VCardTitle>
          <h2 class="mt-0 truncate text-h4">
            {{ t('pages.dashboard.overview.fluxSupply') }}
          </h2>
        </VCardTitle>
        <VCardText class="py-1 mr-2">
          {{ t('pages.dashboard.overview.maxSupply') }}
        </VCardText>
        <VRow class="px-6">
          <VCol
            cols="12"
            md="6"
            xl="4"
          >
            <h3>{{ beautifyValue(maxSupply, 0) }} FLUX</h3>
          </VCol>
        </VRow>
        <VDivider class="mx-4 my-1" />
        <VCardText class="py-1">
          {{ t('pages.dashboard.overview.circulatingSupply') }}
        </VCardText>
        <VRow class="px-6">
          <VCol
            cols="12"
            md="6"
            xl="4"
          >
            <h3>{{ beautifyValue(circulatingSupply, 0) }} FLUX</h3>
          </VCol>
          <VCol
            cols="12"
            md="6"
            xl="8"
            class="pt-0"
          >
            <div class="d-flex align-items-center gap-2">
              <VProgressLinear
                :model-value="progressPercentageSupply"
                color="success"
                height="10"
                class="mt-1 mb-2 mr-1 flex-grow-1"
              />
              <span class="text-body-2 font-weight-medium text-success">
                {{ beautifyValue(progressPercentageSupply, 2) }}%
              </span>
            </div>
          </VCol>
        </VRow>
        <VDivider class="mx-4 my-1" />
        <VCardText class="py-1">
          {{ t('pages.dashboard.overview.lockedSupply') }}
        </VCardText>
        <VRow class="px-6">
          <VCol
            cols="12"
            md="6"
            xl="4"
          >
            <h3>{{ beautifyValue(lockedSupply, 0) }} FLUX</h3>
          </VCol>
          <VCol
            cols="12"
            md="6"
            xl="8"
            class="pt-0 mb-6"
          >
            <div class="d-flex align-items-center gap-2">
              <VProgressLinear
                :model-value="progressPercentageLocked"
                color="success"
                height="10"
                class="mt-1 mb-2 mr-1 flex-grow-1"
              />
              <span class="text-body-2 font-weight-medium text-success">
                {{ beautifyValue(progressPercentageLocked, 2) }}%
              </span>
            </div>
          </VCol>
        </VRow>
      </VCard>
    </VCol>
  </VRow>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue"
import { useI18n } from "vue-i18n"
import axios from "axios"
import tierColors from "@/utils/colors"
import DashboardService from "@/services/DashboardService"
import { useConfigStore } from "@core/stores/config"
import { storeToRefs } from "pinia"

const { t } = useI18n()

// Data properties
const isLoading = ref(true) // Unified loading state
const totalNodes = ref(0)
const maxSupply = ref(560000000)
const lockedSupply = ref(0)
const circulatingSupply = ref(0)
const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)
const history = ref(null)

const versionChart = ref({
  chartOptions: {
    chart: { toolbar: { show: false } },
    dataLabels: { enabled: true },
    legend: { show: true, position: "bottom" },
    stroke: { width: 0 },
    labels: [],
    tooltip: {
      followCursor: true,
      y: { formatter: value => beautifyValue(value, 0) },
    },
  },
  series: [],
})

const nodeData = ref({
  chartOptions: {
    chart: { toolbar: { show: false } },
    dataLabels: { enabled: true },
    labels: [
      t('pages.dashboard.overview.cumulus'),
      t('pages.dashboard.overview.nimbus'),
      t('pages.dashboard.overview.stratus'),
    ],
    legend: { show: false },
    stroke: { width: 0 },
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    tooltip: {
      followCursor: true,
      y: { formatter: value => beautifyValue(value, 0) },
    },
  },
  series: [],
})

const nodeHistoryData = ref({
  chartOptions: {
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    labels: [
      t('pages.dashboard.overview.cumulus'),
      t('pages.dashboard.overview.nimbus'),
      t('pages.dashboard.overview.stratus'),
    ],
    grid: { show: false, padding: { left: 0, right: 0 } },
    chart: { toolbar: { show: false }, sparkline: { enabled: true }, stacked: true },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.9,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 80, 100],
      },
    },
    xaxis: {
      type: "numeric",
      lines: { show: false },
      axisBorder: { show: false },
      labels: { show: false },
    },
    tooltip: {
      followCursor: true,
      x: { formatter: value => new Date(value).toLocaleString("en-GB") },
      theme: theme.value,
    },
  },
  series: [],
})

const lockedSupplyData = ref({
  chartOptions: {
    chart: { toolbar: { show: false } },
    dataLabels: { enabled: true },
    labels: [
      t('pages.dashboard.overview.cumulus'),
      t('pages.dashboard.overview.nimbus'),
      t('pages.dashboard.overview.stratus'),
    ],
    legend: { show: false },
    stroke: { width: 0 },
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    tooltip: {
      followCursor: true,
      y: { formatter: value => beautifyValue(value, 0) },
    },
  },
  series: [],
})

watch(theme, newTheme => {
  if (history.value) {
    history.value.updateOptions(
      {
        tooltip: {
          followCursor: true,
          theme: newTheme,
        },
      },
      false,
      false,
    )
  }
})

const progressPercentageSupply = computed(() => {
  return maxSupply.value ? (circulatingSupply.value / maxSupply.value) * 100 : 0
})

const progressPercentageLocked = computed(() => {
  return circulatingSupply.value
    ? (lockedSupply.value / circulatingSupply.value) * 100
    : 0
})

const beautifyValue = (value, places = 2) => {
  const fixedValue = value.toFixed(places)

  return fixedValue.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

const getCircSupply = async () => {
  try {
    console.log("Fetching circulating supply...")

    const result = await axios.get(
      "https://explorer.runonflux.io/api/statistics/circulating-supply",
    )

    circulatingSupply.value = result.data
    console.log("Circulating supply:", circulatingSupply.value)
  } catch (error) {
    console.error("Error fetching circulating supply:", error)
  }
}

const getHistoryStats = async () => {
  try {
    console.log("Fetching history stats...")

    const result = await axios.get("https://stats.runonflux.io/fluxhistorystats")
    const fluxHistoryStats = result.data.data
    const timePoints = Object.keys(fluxHistoryStats)
    const cumulusHistory = []
    const nimbusHistory = []
    const stratusHistory = []

    timePoints.forEach(time => {
      cumulusHistory.push([Number(time), fluxHistoryStats[time].cumulus])
      nimbusHistory.push([Number(time), fluxHistoryStats[time].nimbus])
      stratusHistory.push([Number(time), fluxHistoryStats[time].stratus])
    })

    nodeHistoryData.value.series = [
      { name: t('pages.dashboard.overview.cumulus'), data: cumulusHistory },
      { name: t('pages.dashboard.overview.nimbus'), data: nimbusHistory },
      { name: t('pages.dashboard.overview.stratus'), data: stratusHistory },
    ]
  } catch (error) {
    console.error("Error fetching history stats:", error)
  }
}

const getFluxNodeCount = async () => {
  try {
    console.log("Fetching flux node count...")

    const resCount = await DashboardService.fluxnodeCount()
    const counts = resCount.data.data
    const stratuses = counts["stratus-enabled"]
    let nimbuses = counts["nimbus-enabled"]
    let cumuluses = counts["cumulus-enabled"]
    if (counts["cumulus-enabled"] < counts["nimbus-enabled"]) {
      nimbuses = counts["cumulus-enabled"]
      cumuluses = counts["nimbus-enabled"]
    }
    const supply = stratuses * 40000 + nimbuses * 12500 + cumuluses * 1000

    lockedSupplyData.value.series = [
      cumuluses * 1000,
      nimbuses * 12500,
      stratuses * 40000,
    ]
    lockedSupply.value = supply
    totalNodes.value = cumuluses + nimbuses + stratuses
    nodeData.value.series = [cumuluses, nimbuses, stratuses]
    console.log("Flux node count:", { stratuses, nimbuses, cumuluses, supply })
  } catch (error) {
    console.error("Error fetching flux node count:", error)
  }
}

const versionLog = ref({})

const getFluxVersionData = async () => {
  try {
    const res = await axios.get("https://stats.runonflux.io/fluxinfo")
    const nodes = res.data?.data || []
    const versionMap = new Map()
    for (const node of nodes) {
      const version = node?.flux?.arcaneHumanVersion || "legacy"

      versionMap.set(version, (versionMap.get(version) || 0) + 1)
    }
    const sorted = [...versionMap.entries()].sort((a, b) => b[1] - a[1])

    versionChart.value.chartOptions.labels = sorted.map(([version]) => version)
    console.log(versionChart.value.chartOptions.labels)
    versionChart.value.series = sorted.map(([, count]) => count)
    console.log(versionChart.value.series)

    versionLog.value = Object.fromEntries(sorted)
    console.log(versionLog.value)
  } catch (error) {
    console.error("Error fetching version data:", error)
  }
}

const getVersionColor = (version, index) => {
  const colors = ['#6c757d', '#7c3aed', '#ec4899', '#f59e0b']
  if (version === 'legacy') {
    return colors[0] // Gray for legacy
  }

  // Assign purple, pink, or amber for ArcaneOS versions
  return colors[(index % 3) + 1]
}

const fetchAllData = async () => {
  isLoading.value = true
  await nextTick()
  try {
    await Promise.all([
      getFluxVersionData(),
      getHistoryStats(),
      getCircSupply().then(getFluxNodeCount),
    ])
  } catch (error) {
    console.error("Error fetching data:", error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await nextTick()
  await fetchAllData()
})
</script>

<style scoped>
.intro-card {
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-success), 0.05) 100%);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.info-link {
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
}

.info-section {
  height: 100%;
  padding: 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 0.6);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.info-section:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.15);
}

.learn-more {
  display: flex;
  align-items: center;
  margin-top: 12px;
  color: rgb(var(--v-theme-primary));
  font-size: 0.875rem;
  font-weight: 600;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.info-section:hover .learn-more {
  opacity: 1;
}

.overlay {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.version-card {
  overflow: visible;
}

.arcane-label {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 7px !important;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 2px !important;
  height: auto !important;
  border-radius: 0 4px 4px 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arcane-glow-dark {
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.3),
              0 0 8px rgba(255, 255, 255, 0.2) !important;
}

.arcane-glow-light {
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3),
              0 0 8px rgba(0, 0, 0, 0.15) !important;
}
</style>
