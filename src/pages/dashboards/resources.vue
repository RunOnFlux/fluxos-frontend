<template>
  <div>
    <VRow>
      <VCol
        cols="12"
        sm="12"
        md="6"
        lg="3"
      >
        <VCard>
          <VOverlay
            v-model="fluxListLoading"
            contained
            persistent
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <VCardText class="mr-2">
            <VAvatar
              size="48"
              color="success lighten-4"
              variant="tonal"
            >
              <VIcon size="24">
                mdi-memory
              </VIcon>
            </VAvatar>
            <h2 class="mt-2 text-h4">
              Total Cores: {{ beautifyValue(totalCores, 0) }}
            </h2>
            <VueApexCharts
              ref="chart1"
              type="bar"
              height="400"
              :options="cpuData.chartOptions"
              :series="cpuData.series"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="12"
        md="6"
        lg="3"
      >
        <VCard>
          <VOverlay
            v-model="fluxListLoading"
            contained
            persistent
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <VCardText class="mr-2">
            <VAvatar
              size="48"
              color="success lighten-4"
              variant="tonal"
            >
              <VIcon size="24">
                mdi-database-outline
              </VIcon>
            </VAvatar>
            <h2 class="mt-2 text-h4">
              Total RAM: {{ beautifyValue(totalRAM / 1024, 2) }} TB
            </h2>
            <VueApexCharts
              ref="chart2"
              type="bar"
              height="400"
              :options="ramData.chartOptions"
              :series="ramData.series"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="12"
        md="6"
        lg="3"
      >
        <VCard>
          <VOverlay
            v-model="fluxListLoading"
            contained
            persistent
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <VCardText class="mr-2">
            <VAvatar
              size="48"
              color="success lighten-4"
              variant="tonal"
            >
              <VIcon size="24">
                tabler-server
              </VIcon>
            </VAvatar>
            <h2 class="mt-2 text-h4">
              Total SSD: {{ beautifyValue(totalSSD / 1000000, 2) }} PB
            </h2>
            <VueApexCharts
              ref="chart3"
              type="bar"
              height="400"
              :options="ssdData.chartOptions"
              :series="ssdData.series"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="12"
        md="6"
        lg="3"
      >
        <VCard>
          <VOverlay
            v-model="fluxListLoading"
            contained
            persistent
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <VCardText class="mr-2">
            <VAvatar
              size="48"
              color="success lighten-4"
              variant="tonal"
            >
              <VIcon size="24">
                mdi-harddisk
              </VIcon>
            </VAvatar>
            <h2 class="mt-2 text-h4">
              Total HDD: {{ beautifyValue(totalHDD / 1000, 2) }} TB
            </h2>
            <VueApexCharts
              ref="chart4"
              type="bar"
              height="400"
              :options="hddData.chartOptions"
              :series="hddData.series"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <VRow>
      <VCol
        cols="12"
        sm="12"
        md="12"
        lg="4"
      >
        <VCard>
          <VOverlay
            v-model="historyStatsLoading"
            contained
            persistent
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <VCardText class="mr-2">
            <VAvatar
              size="48"
              color="success lighten-4"
              variant="tonal"
            >
              <VIcon size="24">
                mdi-memory
              </VIcon>
            </VAvatar>
            <h2 class="mt-2 text-h4">
              CPU History
            </h2>
          </VCardText>
          <VueApexCharts
            ref="chart5"
            type="area"
            height="200"
            width="100%"
            :options="cpuHistoryData.chartOptions"
            :series="cpuHistoryData.series"
          />
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="12"
        md="6"
        lg="4"
      >
        <VCard>
          <VOverlay
            v-model="historyStatsLoading"
            contained
            persistent
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <VCardText class="mr-2">
            <VAvatar
              size="48"
              color="success lighten-4"
              variant="tonal"
            >
              <VIcon size="24">
                mdi-database-outline
              </VIcon>
            </VAvatar>
            <h2 class="mt-2 text-h4">
              RAM History
            </h2>
          </VCardText>
          <VueApexCharts
            ref="chart6"
            type="area"
            height="200"
            width="100%"
            :options="ramHistoryData.chartOptions"
            :series="ramHistoryData.series"
          />
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="12"
        md="6"
        lg="4"
      >
        <VCard>
          <VOverlay
            v-model="historyStatsLoading"
            contained
            persistent
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <VCardText class="mr-2">
            <VAvatar
              size="48"
              color="success lighten-4"
              variant="tonal"
            >
              <VIcon size="24">
                mdi-harddisk
              </VIcon>
            </VAvatar>
            <h2 class="mt-2 text-h4">
              Storage History
            </h2>
          </VCardText>
          <VueApexCharts
            ref="chart7"
            type="area"
            height="200"
            width="100%"
            :options="ssdHistoryData.chartOptions"
            :series="ssdHistoryData.series"
          />
        </VCard>
      </VCol>
    </VRow>

    <!-- Snackbar for error notifications -->
    <VSnackbar
      v-model="showError"
      color="error"
      timeout="3000"
    >
      Unable to fetch history stats
      <template #actions>
        <VBtn
          color="white"
          @click="showError = false"
        >
          Close
        </VBtn>
      </template>
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from "vue"
import axios from "axios"
import tierColors from "@/utils/colors"
import { storeToRefs } from "pinia"
import { useConfigStore } from "@core/stores/config"

const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)

const timeoptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}

const fluxListLoading = ref(true)
const historyStatsLoading = ref(true)
const showError = ref(false)
const fluxList = ref([])
const totalCores = ref(0)
const totalRAM = ref(0)
const totalSSD = ref(0)
const totalHDD = ref(0)
const cumulusCpuValue = ref(0)
const nimbusCpuValue = ref(0)
const stratusCpuValue = ref(0)
const cumulusRamValue = ref(0)
const nimbusRamValue = ref(0)
const stratusRamValue = ref(0)
const cumulusSSDStorageValue = ref(0)
const cumulusHDDStorageValue = ref(0)
const nimbusSSDStorageValue = ref(0)
const nimbusHDDStorageValue = ref(0)
const stratusSSDStorageValue = ref(0)
const stratusHDDStorageValue = ref(0)
const fluxHistoryStats = ref([])
const chart1 = ref(null)
const chart2 = ref(null)
const chart3 = ref(null)
const chart4 = ref(null)
const chart5 = ref(null)
const chart6 = ref(null)
const chart7 = ref(null)

// Chart data
const cpuData = ref({
  series: [],
  chartOptions: {
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    plotOptions: {
      bar: {
        columnWidth: "85%",
        distributed: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      labels: {
        categories: ["Cumulus", "Nimbus", "Stratus"],
        style: {
          colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
          fontSize: "14px",
          fontFamily: "Montserrat",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#888",
          fontSize: "14px",
          fontFamily: "Montserrat",
        },
        formatter: value => beautifyValue(value, 0),
      },
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Cumulus", "Nimbus", "Stratus"],
    tooltip: {
      y: {
        formatter: value => beautifyValue(value, 0),
      },
      theme: theme.value,
    },
  },
})

const cpuHistoryData = ref({
  series: [],
  chartOptions: {
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
      },
    },
    chart: {
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2.5,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.9,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 80, 100],
      },
    },
    xaxis: {
      type: "numeric",
      lines: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      labels: { show: false },
    },
    yaxis: [
      {
        y: 0,
        offsetX: 0,
        offsetY: 0,
        padding: {
          left: 0,
          right: 0,
        },
      },
    ],
    tooltip: {
      x: {
        formatter: value => new Date(value).toLocaleString("en-GB", timeoptions),
      },
      y: {
        formatter: value => beautifyValue(value, 0),
      },
      theme: theme.value,
    },
  },
})

const ramData = ref({
  series: [],
  chartOptions: {
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    plotOptions: {
      bar: {
        columnWidth: "85%",
        distributed: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      labels: {
        categories: ["Cumulus", "Nimbus", "Stratus"],
        style: {
          colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
          fontSize: "14px",
          fontFamily: "Montserrat",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#888",
          fontSize: "14px",
          fontFamily: "Montserrat",
        },
        formatter: value => `${beautifyValue(value / 1024, 0)}`,
      },
    },
    tooltip: {
      y: {
        formatter: value => `${beautifyValue(value / 1024, 2)} TB`,
      },
      theme: theme.value,
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Cumulus", "Nimbus", "Stratus"],
  },
})

const ramHistoryData = ref({
  series: [],
  chartOptions: {
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
      },
    },
    chart: {
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2.5,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.9,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 80, 100],
      },
    },
    xaxis: {
      type: "numeric",
      lines: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      labels: { show: false },
    },
    yaxis: [
      {
        y: 0,
        offsetX: 0,
        offsetY: 0,
        padding: {
          left: 0,
          right: 0,
        },
      },
    ],
    tooltip: {
      followCursor: true,
      custom: undefined,
      x: {
        formatter: value => new Date(value).toLocaleString("en-GB", timeoptions),
      },
      y: {
        formatter: value => `${beautifyValue(value / 1024, 2)} TB`,
      },
      theme: theme.value,
    },
  },
})

const ssdData = ref({
  series: [],
  chartOptions: {
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    plotOptions: {
      bar: {
        columnWidth: "85%",
        distributed: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      labels: {
        categories: ["Cumulus", "Nimbus", "Stratus"],
        style: {
          colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
          fontSize: "14px",
          fontFamily: "Montserrat",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#888",
          fontSize: "14px",
          fontFamily: "Montserrat",
        },
        formatter: value => `${beautifyValue(value / 1000, 0)}`,
      },
    },
    tooltip: {
      y: {
        formatter: value => `${beautifyValue(value / 1000, 2)} TB`,
      },
      theme: theme.value,
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Cumulus", "Nimbus", "Stratus"],
  },
})

const ssdHistoryData = ref({
  series: [],
  chartOptions: {
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
      },
    },
    chart: {
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2.5,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.9,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 80, 100],
      },
    },
    xaxis: {
      type: "numeric",
      lines: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      labels: { show: false },
    },
    yaxis: [
      {
        y: 0,
        offsetX: 0,
        offsetY: 0,
        padding: {
          left: 0,
          right: 0,
        },
      },
    ],
    tooltip: {
      x: {
        formatter: value => new Date(value).toLocaleString("en-GB", timeoptions),
      },
      y: {
        formatter: value => `${beautifyValue(value / 1000, 2)} TB`,
      },
      theme: theme.value,
    },
  },
})

const hddData = ref({
  series: [],
  chartOptions: {
    colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    plotOptions: {
      bar: {
        columnWidth: "85%",
        distributed: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      labels: {
        categories: ["Cumulus", "Nimbus", "Stratus"],
        style: {
          colors: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
          fontSize: "14px",
          fontFamily: "Montserrat",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#888",
          fontSize: "14px",
          fontFamily: "Montserrat",
        },
        formatter: value => `${beautifyValue(value / 1000, 0)}`,
      },
    },
    tooltip: {
      y: {
        formatter: value => `${beautifyValue(value / 1000, 2)} TB`,
      },
      theme: theme.value,
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Cumulus", "Nimbus", "Stratus"],
  },
})

// Methods
const beautifyValue = (value, places = 2) => {
  const fixedValue = value.toFixed(places)

  return fixedValue.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

const generateHistory = async (
  cumulus,
  halvedCumulus,
  nimbus,
  halvedNimbus,
  stratus,
  halvedStratus,
) => {
  const cumulusData = []
  const nimbusData = []
  const stratusData = []

  const timePoints = Object.keys(fluxHistoryStats.value).map(Number)
  const cumulusThreshold = 1647197215000
  const nimbusThreshold = 1647831196000
  const stratusThreshold = 2000000000000

  // Process in chunks to avoid blocking the main thread
  const chunkSize = 1000 // Adjust based on dataset size
  for (let i = 0; i < timePoints.length; i += chunkSize) {
    const chunk = timePoints.slice(i, i + chunkSize)

    chunk.forEach(time => {
      const stats = fluxHistoryStats.value[time]

      cumulusData.push([
        time,
        stats.cumulus * (time < cumulusThreshold ? cumulus : halvedCumulus),
      ])
      nimbusData.push([
        time,
        stats.nimbus * (time < nimbusThreshold ? nimbus : halvedNimbus),
      ])
      stratusData.push([
        time,
        stats.stratus * (time < stratusThreshold ? stratus : halvedStratus),
      ])
    })

    // Yield to the browser to allow rendering
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  return [
    { name: "Cumulus", data: cumulusData },
    { name: "Nimbus", data: nimbusData },
    { name: "Stratus", data: stratusData },
  ]
}

const generateCPUHistory = async () => {
  cpuHistoryData.value.series = await generateHistory(2, 4, 4, 8, 8, 16)
}

const generateRAMHistory = async () => {
  ramHistoryData.value.series = await generateHistory(4, 8, 8, 32, 32, 64)
}

const generateSSDHistory = async () => {
  ssdHistoryData.value.series = await generateHistory(40, 220, 150, 440, 600, 880)
}

const generateResources = async () => {
  try {
    fluxListLoading.value = true

    const fluxTierBench = await axios.get(
      "https://stats.runonflux.io/fluxinfo?projection=tier,benchmark",
    )

    const fluxTierBenchList = fluxTierBench.data.data

    fluxTierBenchList.forEach(node => {
      if (node.tier === "CUMULUS" && node.benchmark && node.benchmark.bench) {
        cumulusCpuValue.value +=
          node.benchmark.bench.cores === 0 ? 4 : node.benchmark.bench.cores
        cumulusRamValue.value +=
          node.benchmark.bench.ram < 8 ? 8 : Math.round(node.benchmark.bench.ram)
        cumulusSSDStorageValue.value += node.benchmark.bench.ssd
        cumulusHDDStorageValue.value += node.benchmark.bench.hdd
      } else if (node.tier === "CUMULUS") {
        cumulusCpuValue.value += 4
        cumulusRamValue.value += 8
        cumulusHDDStorageValue.value += 220
      } else if (node.tier === "NIMBUS" && node.benchmark && node.benchmark.bench) {
        nimbusCpuValue.value +=
          node.benchmark.bench.cores === 0 ? 8 : node.benchmark.bench.cores
        nimbusRamValue.value +=
          node.benchmark.bench.ram < 32 ? 32 : Math.round(node.benchmark.bench.ram)
        nimbusSSDStorageValue.value += node.benchmark.bench.ssd
        nimbusHDDStorageValue.value += node.benchmark.bench.hdd
      } else if (node.tier === "NIMBUS") {
        nimbusCpuValue.value += 8
        nimbusRamValue.value += 32
        nimbusSSDStorageValue.value += 440
      } else if (node.tier === "STRATUS" && node.benchmark && node.benchmark.bench) {
        stratusCpuValue.value +=
          node.benchmark.bench.cores === 0 ? 16 : node.benchmark.bench.cores
        stratusRamValue.value +=
          node.benchmark.bench.ram < 64 ? 64 : Math.round(node.benchmark.bench.ram)
        stratusSSDStorageValue.value += node.benchmark.bench.ssd
        stratusHDDStorageValue.value += node.benchmark.bench.hdd
      } else if (node.tier === "STRATUS") {
        stratusCpuValue.value += 16
        stratusRamValue.value += 64
        stratusSSDStorageValue.value += 880
      }
    })

    totalCores.value =
      cumulusCpuValue.value + nimbusCpuValue.value + stratusCpuValue.value
    cpuData.value.series = [
      {
        name: "CPU Cores",
        data: [cumulusCpuValue.value, nimbusCpuValue.value, stratusCpuValue.value],
      },
    ]

    totalRAM.value = cumulusRamValue.value + nimbusRamValue.value + stratusRamValue.value
    ramData.value.series = [
      {
        name: "RAM",
        data: [cumulusRamValue.value, nimbusRamValue.value, stratusRamValue.value],
      },
    ]

    totalSSD.value =
      cumulusSSDStorageValue.value +
      nimbusSSDStorageValue.value +
      stratusSSDStorageValue.value
    ssdData.value.series = [
      {
        name: "SSD",
        data: [
          cumulusSSDStorageValue.value,
          nimbusSSDStorageValue.value,
          stratusSSDStorageValue.value,
        ],
      },
    ]

    totalHDD.value =
      cumulusHDDStorageValue.value +
      nimbusHDDStorageValue.value +
      stratusHDDStorageValue.value
    hddData.value.series = [
      {
        name: "HDD",
        data: [
          cumulusHDDStorageValue.value,
          nimbusHDDStorageValue.value,
          stratusHDDStorageValue.value,
        ],
      },
    ]

    fluxListLoading.value = false
  } catch (error) {
    console.error(error)
  }
}

const getHistoryStats = async () => {
  try {
    historyStatsLoading.value = true

    await nextTick()

    const result = await axios.get("https://stats.runonflux.io/fluxhistorystats")
    if (result.data.data) {
      fluxHistoryStats.value = result.data.data
      await generateCPUHistory()
      await generateRAMHistory()
      await generateSSDHistory()
      await nextTick()
      historyStatsLoading.value = false
    } else {
      showError.value = true
    }
  } catch (error) {
    console.error(error)
    showError.value = true
  }
}

watch(theme, newTheme => {
  [chart1, chart2, chart3, chart4, chart5, chart6, chart7].forEach(chartRef => {
    const chart = chartRef.value && chartRef.value.chart

    if (chart) {
      chart.updateOptions(
        {
          tooltip: {
            theme: newTheme,
          },
        },
        false,
        false,
      )
    }
  })
})

onMounted(async () => {
  await generateResources()
  await getHistoryStats()
})
</script>

<style scoped>
.overlay {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
</style>
