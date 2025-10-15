<template>
  <div>
    <VRow>
      <VCol
        cols="12"
        sm="12"
        md="6"
        lg="3"
        style="overflow: visible !important;"
      >
        <VCard style="overflow: visible !important; clip-path: none !important; height: 300px; position: relative;">
          <VOverlay
            v-model="fluxListLoading"
            contained
            persistent
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <div class="d-flex align-center pa-4" style="position: absolute; top: 0; left: 0; z-index: 1;">
            <VAvatar
              size="48"
              color="success lighten-4"
              variant="tonal"
            >
              <VIcon size="24">
                mdi-memory
              </VIcon>
            </VAvatar>
            <h2 class="text-h5 ml-2">
              vCores
            </h2>
          </div>
          <VCardText class="pa-4" style="overflow: visible !important; height: 100%;">
            <div class="chart-container">
              <Doughnut
                :key="`cpu-${theme}`"
                :data="cpuChartData"
                :options="cpuChartOptions"
                :plugins="[centerTextPlugin]"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="12"
        md="6"
        lg="3"
        style="overflow: visible !important;"
      >
        <VCard style="overflow: visible !important; clip-path: none !important; height: 300px; position: relative;">
          <VOverlay
            v-model="fluxListLoading"
            contained
            persistent
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <div class="d-flex align-center pa-4" style="position: absolute; top: 0; left: 0; z-index: 1;">
            <VAvatar
              size="48"
              color="success lighten-4"
              variant="tonal"
            >
              <VIcon size="24">
                mdi-database-outline
              </VIcon>
            </VAvatar>
            <h2 class="text-h5 ml-2">
              RAM
            </h2>
          </div>
          <VCardText class="pa-4" style="overflow: visible !important; height: 100%;">
            <div class="chart-container">
              <Doughnut
                :key="`ram-${theme}`"
                :data="ramChartData"
                :options="ramChartOptions"
                :plugins="[centerTextPlugin]"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="12"
        md="6"
        lg="3"
        style="overflow: visible !important;"
      >
        <VCard style="overflow: visible !important; clip-path: none !important; height: 300px; position: relative;">
          <VOverlay
            v-model="fluxListLoading"
            contained
            persistent
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <div class="d-flex align-center pa-4" style="position: absolute; top: 0; left: 0; z-index: 1;">
            <VAvatar
              size="48"
              color="success lighten-4"
              variant="tonal"
            >
              <VIcon size="24">
                tabler-server
              </VIcon>
            </VAvatar>
            <h2 class="text-h5 ml-2">
              SSD
            </h2>
          </div>
          <VCardText class="pa-4" style="overflow: visible !important; height: 100%;">
            <div class="chart-container">
              <Doughnut
                :key="`ssd-${theme}`"
                :data="ssdChartData"
                :options="ssdChartOptions"
                :plugins="[centerTextPlugin]"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="12"
        md="6"
        lg="3"
        style="overflow: visible !important;"
      >
        <VCard style="overflow: visible !important; clip-path: none !important; height: 300px; position: relative;">
          <VOverlay
            v-model="fluxListLoading"
            contained
            persistent
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <div class="d-flex align-center pa-4" style="position: absolute; top: 0; left: 0; z-index: 1;">
            <VAvatar
              size="48"
              color="success lighten-4"
              variant="tonal"
            >
              <VIcon size="24">
                mdi-harddisk
              </VIcon>
            </VAvatar>
            <h2 class="text-h5 ml-2">
              HDD
            </h2>
          </div>
          <VCardText class="pa-4" style="overflow: visible !important; height: 100%;">
            <div class="chart-container">
              <Doughnut
                :key="`hdd-${theme}`"
                :data="hddChartData"
                :options="hddChartOptions"
                :plugins="[centerTextPlugin]"
              />
            </div>
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
            <h2 class="mt-2 text-h5 d-inline-block ml-2">
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
            <h2 class="mt-2 text-h5 d-inline-block ml-2">
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
            <h2 class="mt-2 text-h5 d-inline-block ml-2">
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
import { ref, nextTick, watch, computed, onMounted, onUnmounted } from "vue"
import axios from "axios"
import tierColors from "@/utils/colors"
import { storeToRefs } from "pinia"
import { useConfigStore } from "@core/stores/config"
import { useDisplay, useTheme } from 'vuetify'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)
const vuetifyTheme = useTheme()

// Get surface and text colors based on theme
const getSurfaceColor = () => {
  // Use actual Vuetify surface color for dark theme, white for light
  return theme.value === 'dark' ? vuetifyTheme.current.value.colors.surface : '#FFFFFF'
}

const getTextColor = () => {
  // Use light text for dark theme, dark text for light theme
  return theme.value === 'dark' ? '#E7E3FCDE' : '#4B465C'
}

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
const chart5 = ref(null)
const chart6 = ref(null)
const chart7 = ref(null)

// Hover state for center label
const hoveredSegment = ref({
  cpu: null,
  ram: null,
  ssd: null,
  hdd: null
})

// Segment glow plugin for Chart.js - draws glow only on hovered segment
const segmentGlowPlugin = {
  id: 'segmentGlow',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    if (!chart.config._config.data.datasets[0]._chartType) return

    const chartType = chart.config._config.data.datasets[0]._chartType
    const hoverIndex = hoveredSegment.value[chartType]

    if (hoverIndex !== null && hoverIndex !== undefined) {
      const meta = chart.getDatasetMeta(0)
      const arc = meta.data[hoverIndex]

      if (!arc) return

      ctx.save()

      // White glow for dark theme, dark glow for light theme
      const glowColor = theme.value === 'dark' ? '#ffffff' : '#000000'

      // Draw glow behind the hovered segment
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 25
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Redraw only the hovered segment with glow
      ctx.beginPath()
      ctx.arc(arc.x, arc.y, arc.outerRadius, arc.startAngle, arc.endAngle)
      ctx.arc(arc.x, arc.y, arc.innerRadius, arc.endAngle, arc.startAngle, true)
      ctx.closePath()

      ctx.fillStyle = chart.config._config.data.datasets[0].backgroundColor[hoverIndex]
      ctx.fill()

      ctx.restore()
    }
  }
}

// Center text plugin for Chart.js
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { ctx } = chart

    // Get the actual center from the chart's dataset metadata
    const meta = chart.getDatasetMeta(0)
    if (!meta || !meta.data || meta.data.length === 0) return

    const firstArc = meta.data[0]
    const centerX = firstArc.x
    const centerY = firstArc.y

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Get the chart type from metadata
    const chartType = chart.config._config.data.datasets[0]._chartType
    const hoverIndex = hoveredSegment.value[chartType]

    if (hoverIndex !== null && hoverIndex !== undefined) {
      // HOVER STATE: Show hovered segment data (tier name, value, percentage on 3 lines)
      const value = chart.config._config.data.datasets[0].data[hoverIndex]
      const total = chart.config._config.data.datasets[0].data.reduce((a, b) => a + b, 0)
      const percent = ((value / total) * 100).toFixed(1)
      const labels = chart.config._config.data.labels
      const tierText = labels[hoverIndex]

      let valueText = ''
      if (chartType === 'cpu') {
        valueText = beautifyValue(value, 0)
      } else if (chartType === 'ram') {
        valueText = `${beautifyValue(value / 1024, 2)} TB`
      } else if (chartType === 'ssd') {
        valueText = `${beautifyValue(value / 1000, 2)} TB`
      } else if (chartType === 'hdd') {
        valueText = `${beautifyValue(value / 1000, 2)} TB`
      }
      const percentText = `${percent}%`

      // Draw tier name
      ctx.font = `700 18px sans-serif`
      ctx.fillStyle = getTextColor()
      ctx.fillText(tierText, centerX, centerY - 25)

      // Draw value
      ctx.font = `700 20px sans-serif`
      ctx.fillStyle = getTextColor()
      ctx.fillText(valueText, centerX, centerY)

      // Draw percentage
      ctx.font = `600 14px sans-serif`
      ctx.fillStyle = getTextColor()
      ctx.fillText(percentText, centerX, centerY + 20)
    } else {
      // NORMAL STATE: Show total label and total value (2 lines)
      let valueText = ''
      let labelText = ''

      if (chartType === 'cpu') {
        valueText = beautifyValue(totalCores.value, 0)
        labelText = 'Total vCores'
      } else if (chartType === 'ram') {
        valueText = `${beautifyValue(totalRAM.value / 1024, 2)} TB`
        labelText = 'Total RAM'
      } else if (chartType === 'ssd') {
        valueText = `${beautifyValue(totalSSD.value / 1000000, 2)} PB`
        labelText = 'Total SSD'
      } else if (chartType === 'hdd') {
        valueText = `${beautifyValue(totalHDD.value / 1000, 2)} TB`
        labelText = 'Total HDD'
      }

      // Draw total label (smaller font, top)
      ctx.font = `600 14px sans-serif`
      ctx.fillStyle = getTextColor()
      ctx.fillText(labelText, centerX, centerY - 10)

      // Draw total value (larger font, bottom)
      ctx.font = `700 22px sans-serif`
      ctx.fillStyle = getTextColor()
      ctx.fillText(valueText, centerX, centerY + 15)
    }

    ctx.restore()
  }
}

// Create base chart options
const createChartOptions = (chartType) => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  layout: {
    padding: {
      top: 25,
      bottom: 25,
      left: 25,
      right: 25
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: false
    },
    segmentGlow: {},
    centerText: {}
  },
  events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
  onHover: (event, activeElements, chart) => {
    // Only update if mouse is actually over the chart canvas
    if (!event || !event.native) {
      if (hoveredSegment.value[chartType] !== null) {
        hoveredSegment.value[chartType] = null
        chart.update('none')
      }
      return
    }

    const newIndex = activeElements.length > 0 ? activeElements[0].index : null

    // Clear all other charts' hover states when this one is hovered
    if (newIndex !== null) {
      Object.keys(hoveredSegment.value).forEach(key => {
        if (key !== chartType && hoveredSegment.value[key] !== null) {
          hoveredSegment.value[key] = null
        }
      })
    }

    if (hoveredSegment.value[chartType] !== newIndex) {
      hoveredSegment.value[chartType] = newIndex
      chart.update('none')
    }
    if (event.native && event.native.target) {
      event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default'
    }
  },
  interaction: {
    mode: 'nearest',
    intersect: true
  }
})

// CPU Chart Data
const cpuChartData = computed(() => ({
  labels: ['Cumulus', 'Nimbus', 'Stratus'],
  datasets: [{
    data: [cumulusCpuValue.value, nimbusCpuValue.value, stratusCpuValue.value],
    backgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    hoverBackgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    borderColor: getSurfaceColor(),
    borderWidth: 2,
    hoverBorderWidth: 0,
    hoverOffset: 0,
    _chartType: 'cpu'
  }]
}))

const cpuChartOptions = computed(() => createChartOptions('cpu'))

// RAM Chart Data
const ramChartData = computed(() => ({
  labels: ['Cumulus', 'Nimbus', 'Stratus'],
  datasets: [{
    data: [cumulusRamValue.value, nimbusRamValue.value, stratusRamValue.value],
    backgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    hoverBackgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    borderColor: getSurfaceColor(),
    borderWidth: 2,
    hoverBorderWidth: 0,
    hoverOffset: 0,
    _chartType: 'ram'
  }]
}))

const ramChartOptions = computed(() => createChartOptions('ram'))

// SSD Chart Data
const ssdChartData = computed(() => ({
  labels: ['Cumulus', 'Nimbus', 'Stratus'],
  datasets: [{
    data: [cumulusSSDStorageValue.value, nimbusSSDStorageValue.value, stratusSSDStorageValue.value],
    backgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    hoverBackgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    borderColor: getSurfaceColor(),
    borderWidth: 2,
    hoverBorderWidth: 0,
    hoverOffset: 0,
    _chartType: 'ssd'
  }]
}))

const ssdChartOptions = computed(() => createChartOptions('ssd'))

// HDD Chart Data
const hddChartData = computed(() => ({
  labels: ['Cumulus', 'Nimbus', 'Stratus'],
  datasets: [{
    data: [cumulusHDDStorageValue.value, nimbusHDDStorageValue.value, stratusHDDStorageValue.value],
    backgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    hoverBackgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    borderColor: getSurfaceColor(),
    borderWidth: 2,
    hoverBorderWidth: 0,
    hoverOffset: 0,
    _chartType: 'hdd'
  }]
}))

const hddChartOptions = computed(() => createChartOptions('hdd'))

// History chart data (UNCHANGED - keeping ApexCharts)
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

// Methods
const beautifyValue = (value, places = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '0'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  const fixedValue = numValue.toFixed(places)

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

    totalRAM.value = cumulusRamValue.value + nimbusRamValue.value + stratusRamValue.value

    totalSSD.value =
      cumulusSSDStorageValue.value +
      nimbusSSDStorageValue.value +
      stratusSSDStorageValue.value

    totalHDD.value =
      cumulusHDDStorageValue.value +
      nimbusHDDStorageValue.value +
      stratusHDDStorageValue.value

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

// Watch theme changes for history charts only (doughnut charts are reactive via computed)
watch(theme, (newTheme) => {
  console.log('Theme watcher triggered, new theme:', newTheme)

  // Update history charts tooltips
  if (cpuHistoryData.value.chartOptions) {
    cpuHistoryData.value.chartOptions = { ...cpuHistoryData.value.chartOptions, tooltip: { ...cpuHistoryData.value.chartOptions.tooltip, theme: newTheme } }
  }
  if (ramHistoryData.value.chartOptions) {
    ramHistoryData.value.chartOptions = { ...ramHistoryData.value.chartOptions, tooltip: { ...ramHistoryData.value.chartOptions.tooltip, theme: newTheme } }
  }
  if (ssdHistoryData.value.chartOptions) {
    ssdHistoryData.value.chartOptions = { ...ssdHistoryData.value.chartOptions, tooltip: { ...ssdHistoryData.value.chartOptions.tooltip, theme: newTheme } }
  }

  console.log('History charts updated')
})


// Clear hover states function
const clearHoverStates = () => {
  hoveredSegment.value = {
    cpu: null,
    ram: null,
    ssd: null,
    hdd: null
  }
}

onMounted(async () => {
  // Register custom Chart.js plugins only once
  if (!ChartJS.defaults.plugins.segmentGlow) {
    ChartJS.register(segmentGlowPlugin)
  }
  if (!ChartJS.defaults.plugins.centerText) {
    ChartJS.register(centerTextPlugin)
  }

  // Initialize hover states to null
  clearHoverStates()

  // Add resize event listener to clear hover states
  window.addEventListener('resize', clearHoverStates)

  await generateResources()
  await getHistoryStats()
})

onUnmounted(() => {
  // Clean up
  clearHoverStates()
  window.removeEventListener('resize', clearHoverStates)
})
</script>

<style scoped>
.overlay {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

/* Chart container for doughnut charts */
.chart-container {
  position: relative;
  overflow: visible !important;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.chart-container canvas {
  overflow: visible !important;
  filter: drop-shadow(0 0 0 transparent);
  transform: translateZ(0);
  width: 100% !important;
  height: 100% !important;
}

/* Allow ApexCharts tooltip to overflow container */
:deep(.apexcharts-tooltip) {
  position: absolute !important;
  pointer-events: none !important;
  white-space: nowrap !important;
}

/* Ensure chart containers don't clip tooltips */
:deep(.v-card) {
  overflow: visible !important;
  clip-path: none !important;
}

:deep(.v-card-text) {
  overflow: visible !important;
  clip-path: none !important;
}

:deep(.v-col) {
  overflow: visible !important;
  clip-path: none !important;
}

/* Ensure the chart wrapper doesn't clip */
:deep(.vue-apexcharts) {
  overflow: unset !important;
}

:deep(.apexcharts-canvas) {
  overflow: unset !important;
}

/* Chart.js doughnut charts */
.chart-container canvas {
  overflow: visible !important;
}
</style>
