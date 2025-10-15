<template>
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
              Total Nodes: {{ totalNodes }}
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
                    Version Breakdown
                  </VChip>
                </h4>
                <ul style="font-size: 14px">
                  <li
                    v-for="(count, version) in versionLog"
                    :key="version"
                  >
                    <strong>{{ version }}:</strong> {{ count }}
                  </li>
                </ul>
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
            Node History
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
              Locked Supply: {{ beautifyValue(lockedSupply, 0) }}
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
        <VueApexCharts
          type="donut"
          height="280"
          :options="lockedSupplyData.chartOptions"
          :series="lockedSupplyData.series"
          class="mb-2"
        />
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
            FLUX Supply
          </h2>
        </VCardTitle>
        <VCardText class="py-1 mr-2">
          Max Supply
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
          Circulating Supply
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
          Locked Supply
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
import axios from "axios"
import tierColors from "@/utils/colors"
import DashboardService from "@/services/DashboardService"
import { useConfigStore } from "@core/stores/config"
import { storeToRefs } from "pinia"

// Data properties
const isLoading = ref(true) // Unified loading state
const totalNodes = ref(0)
const maxSupply = ref(440000000)
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
      y: { formatter: value => beautifyValue(value, 0) }
    },
  },
  series: [],
})

const nodeData = ref({
  chartOptions: {
    chart: { toolbar: { show: false } },
    dataLabels: { enabled: true },
    labels: ["Cumulus", "Nimbus", "Stratus"],
    legend: { show: false },
    stroke: { width: 0 },
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    tooltip: {
      followCursor: true,
      y: { formatter: value => beautifyValue(value, 0) }
    },
  },
  series: [],
})

const nodeHistoryData = ref({
  chartOptions: {
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    labels: ["Cumulus", "Nimbus", "Stratus"],
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
    labels: ["Cumulus", "Nimbus", "Stratus"],
    legend: { show: false },
    stroke: { width: 0 },
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    tooltip: {
      followCursor: true,
      y: { formatter: value => beautifyValue(value, 0) }
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
      { name: "Cumulus", data: cumulusHistory },
      { name: "Nimbus", data: nimbusHistory },
      { name: "Stratus", data: stratusHistory },
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
.overlay {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
</style>
