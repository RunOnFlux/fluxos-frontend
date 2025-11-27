<template>
  <!-- Introduction Section -->
  <VRow>
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
      <VCard style="position: relative; min-height: 320px"
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
            <!-- Chart on the left, taking slightly less than 2/3 width -->
            <VCol
              cols="12"
              sm="7"
            >
              <VueApexCharts
                type="donut"
                height="280"
                width="100%"
                :options="nodeData.chartOptions"
                :series="nodeData.series"
              />

              <!-- Legacy vs ArcaneOS Progress Chart -->
              <div class="px-4 mt-2">
                <div class="d-flex justify-space-between align-center mb-2">
                  <VChip
                    size="x-small"
                    color="grey"
                    variant="flat"
                    class="legacy-chip"
                    style="background-color: #6c757d; color: white;"
                  >
                    Legacy
                  </VChip>
                  <VChip
                    size="x-small"
                    color="primary"
                    variant="flat"
                    class="arcane-chip"
                  >
                    ArcaneOS
                  </VChip>
                </div>
                <div class="legacy-arcane-bar">
                  <div
                    class="legacy-segment"
                    :style="{ width: legacyPercentage + '%' }"
                  >
                    <span class="segment-label">{{ legacyPercentage.toFixed(1) }}%</span>
                  </div>
                  <div
                    class="arcane-segment"
                    :style="{ width: arcanePercentage + '%' }"
                  >
                    <span class="segment-label">{{ arcanePercentage.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </VCol>

            <!-- Version list on the right, taking slightly more than 1/3 width -->
            <VCol
              cols="12"
              sm="5"
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
                      ArcaneOS
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
      <VCard style="position: relative; min-height: 320px; height: 100%; overflow: hidden;"
      >
        <VCardTitle class="d-flex justify-space-between align-center">
          <h2 class="mt-2 truncate text-h4">
            {{ t('pages.dashboard.overview.nodeHistory') }}
          </h2>
        </VCardTitle>
        <div style="position: absolute; bottom: -1px; left: 0; right: 0; top: 72px;">
          <VueApexCharts
            ref="history"
            type="area"
            height="100%"
            width="100%"
            :options="nodeHistoryData.chartOptions"
            :series="nodeHistoryData.series"
          />
        </div>
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
      <VCard style="position: relative; min-height: 320px"
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
            <!-- Chart on the left, taking slightly less than 2/3 width -->
            <VCol
              cols="12"
              sm="7"
            >
              <VueApexCharts
                type="donut"
                height="280"
                width="100%"
                :options="lockedSupplyData.chartOptions"
                :series="lockedSupplyData.series"
              />
            </VCol>

            <!-- Legend on the right, taking slightly more than 1/3 width -->
            <VCol
              cols="12"
              sm="5"
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
                    class="pa-2 tier-card"
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
                    class="pa-2 tier-card"
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
                    class="pa-2 tier-card"
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
      <VCard style="position: relative; min-height: 320px"
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
import { useHead } from '@vueuse/head'
import axios from "axios"
import tierColors from "@/utils/colors"
import DashboardService from "@/services/DashboardService"
import { useConfigStore } from "@core/stores/config"
import { storeToRefs } from "pinia"

const { t } = useI18n()

// SEO meta tags
const title = 'Flux Network Overview - Real-Time Node Statistics | FluxCloud'
const description = 'View real-time statistics of the Flux decentralized network. Track 8,000+ active FluxNodes across Cumulus, Nimbus, and Stratus tiers. Monitor network health, supply, and node distribution worldwide.'
const pageUrl = 'https://cloud.runonflux.com/dashboards/overview'
const imageUrl = 'https://cloud.runonflux.com/images/logo.png'

// Structured data schemas
const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Flux Network',
    url: 'https://cloud.runonflux.com',
    logo: 'https://cloud.runonflux.com/images/logo.png',
    description: 'Decentralized Web3 cloud infrastructure powered by FluxNodes worldwide',
    sameAs: [
      'https://twitter.com/RunOnFlux',
      'https://github.com/RunOnFlux',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://cloud.runonflux.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Dashboards',
        item: 'https://cloud.runonflux.com/dashboards/overview',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Network Overview',
        item: 'https://cloud.runonflux.com/dashboards/overview',
      },
    ],
  },
]

useHead({
  title,
  meta: [
    { name: 'description', content: description },
    { name: 'keywords', content: 'Flux network, FluxNodes, node statistics, blockchain network, decentralized infrastructure, Cumulus, Nimbus, Stratus, network monitoring, node tiers' },

    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: imageUrl },
    { property: 'og:url', content: pageUrl },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'FluxCloud' },

    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:site', content: '@RunOnFlux' },
  ],
  link: [
    { rel: 'canonical', href: pageUrl },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(structuredData),
    },
  ],
})

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

// Computed properties for Legacy vs Arcane OS percentages
const legacyPercentage = computed(() => {
  const legacyCount = versionLog.value['legacy'] || 0
  const total = Object.values(versionLog.value).reduce((sum, count) => sum + count, 0)
  
  return total > 0 ? (legacyCount / total) * 100 : 0
})

const arcanePercentage = computed(() => {
  const legacyCount = versionLog.value['legacy'] || 0
  const total = Object.values(versionLog.value).reduce((sum, count) => sum + count, 0)
  const arcaneCount = total - legacyCount
  
  return total > 0 ? (arcaneCount / total) * 100 : 0
})

const getFluxVersionData = async () => {
  try {
    const res = await axios.get("https://stats.runonflux.io/fluxinfo")
    const nodes = res.data?.data || []
    const versionMap = new Map()
    for (const node of nodes) {
      const version = node?.flux?.arcaneHumanVersion || "legacy"

      versionMap.set(version, (versionMap.get(version) || 0) + 1)
    }
    const sorted = [...versionMap.entries()].sort((a, b) => {
      // Put legacy first
      if (a[0] === 'legacy') return -1
      if (b[0] === 'legacy') return 1

      // Then sort by count descending
      return b[1] - a[1]
    })

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
  if (version === 'legacy') {
    return '#6c757d' // Gray for legacy (same as legacy segment)
  }

  // Use primary color for all ArcaneOS versions (same as arcane segment)
  // Using rgb(var(--v-theme-primary)) to match the theme
  return 'rgb(var(--v-theme-primary))'
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
/* Apply border and border-radius to all cards except version-card and tier-card */
:deep(.v-card:not(.version-card):not(.tier-card)) {
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

/* Exception for version and tier cards - keep their colored left borders */
:deep(.version-card),
:deep(.tier-card) {
  border-radius: 16px !important;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
  /* border-left is set via inline styles to preserve the colored borders */
}

.intro-card {
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

.intro-card :deep(.v-card-title) {
  padding-top: 20px;
  text-align: center;
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
  background: rgb(var(--v-theme-surface));
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.info-section:hover {
  transform: translateY(-4px);
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

.learn-more {
  display: flex;
  align-items: center;
  margin-top: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.875rem;
  font-weight: 600;
  transition: color 0.2s ease;
}

.info-section:hover .learn-more {
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.overlay {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.version-card {
  overflow: visible;
  width: 100%;
}

.tier-card {
  width: 100%;
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
  border-radius: 0 16px 16px 0 !important;
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

.legacy-chip,
.arcane-chip {
  border-radius: 12px !important;
}

.legacy-arcane-bar {
  display: flex;
  height: 20px;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.legacy-segment {
  background: #6c757d;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.arcane-segment {
  background: rgb(var(--v-theme-primary));
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.segment-label {
  color: white;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
