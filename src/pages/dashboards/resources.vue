<template>
  <div>
    <!-- Introduction Section -->
    <VRow class="mb-6">
      <VCol cols="12">
        <VCard flat class="resources-intro-card">
          <VCardText>
            <div class="d-flex align-center mb-3">
              <VAvatar
                size="48"
                color="primary"
                variant="tonal"
                class="mr-3"
              >
                <VIcon size="28">mdi-server-network</VIcon>
              </VAvatar>
              <div>
                <h2 class="text-h4 mb-1">{{ t('pages.dashboard.resources.intro.title') }}</h2>
                <p class="text-body-2 mb-0 text-medium-emphasis">{{ t('pages.dashboard.resources.intro.subtitle') }}</p>
              </div>
            </div>
            <p class="text-body-1 mb-0">
              {{ t('pages.dashboard.resources.intro.description') }}
            </p>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow v-if="hasValidData">
      <VCol
        cols="12"
        sm="12"
        md="6"
        lg="4"
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
              {{ t('pages.dashboard.resources.vCores') }}
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
        lg="4"
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
              {{ t('pages.dashboard.resources.ram') }}
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
        lg="4"
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
              {{ t('pages.dashboard.resources.ssd') }}
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
              {{ t('pages.dashboard.resources.cpuHistory') }}
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
              {{ t('pages.dashboard.resources.ramHistory') }}
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
              {{ t('pages.dashboard.resources.storageHistory') }}
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
      {{ t('pages.dashboard.resources.errorFetchHistory') }}
      <template #actions>
        <VBtn
          color="white"
          @click="showError = false"
        >
          {{ t('pages.dashboard.resources.close') }}
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
import { useI18n } from 'vue-i18n'

ChartJS.register(ArcElement, Tooltip, Legend)

const { t } = useI18n()

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
const hasValidData = ref(true)
const fluxList = ref([])
// Computed totals from most recent history entry
const totalCores = computed(() => {
  if (!fluxHistoryStats.value || Object.keys(fluxHistoryStats.value).length === 0) {
    return 0
  }

  const timePoints = Object.keys(fluxHistoryStats.value).map(Number)
  const mostRecentTime = Math.max(...timePoints)
  const stats = fluxHistoryStats.value[mostRecentTime]

  // CPU values per tier (using halved values as current standard)
  const cumulusCpu = 4
  const nimbusCpu = 8
  const stratusCpu = 16

  return (stats.cumulus * cumulusCpu) + (stats.nimbus * nimbusCpu) + (stats.stratus * stratusCpu)
})

const totalRAM = computed(() => {
  if (!fluxHistoryStats.value || Object.keys(fluxHistoryStats.value).length === 0) {
    return 0
  }

  const timePoints = Object.keys(fluxHistoryStats.value).map(Number)
  const mostRecentTime = Math.max(...timePoints)
  const stats = fluxHistoryStats.value[mostRecentTime]

  // RAM values per tier in GB (using halved values as current standard)
  const cumulusRam = 8   // 8 GB
  const nimbusRam = 32   // 32 GB
  const stratusRam = 64  // 64 GB

  return (stats.cumulus * cumulusRam) + (stats.nimbus * nimbusRam) + (stats.stratus * stratusRam)
})

const totalSSD = computed(() => {
  if (!fluxHistoryStats.value || Object.keys(fluxHistoryStats.value).length === 0) {
    return 0
  }

  const timePoints = Object.keys(fluxHistoryStats.value).map(Number)
  const mostRecentTime = Math.max(...timePoints)
  const stats = fluxHistoryStats.value[mostRecentTime]

  // SSD values per tier in GB (using halved values as current standard)
  const cumulusSsd = 220
  const nimbusSsd = 440
  const stratusSsd = 880

  return (stats.cumulus * cumulusSsd) + (stats.nimbus * nimbusSsd) + (stats.stratus * stratusSsd)
})

const totalHDD = computed(() => {
  if (!fluxHistoryStats.value || Object.keys(fluxHistoryStats.value).length === 0) {
    return 0
  }

  // HDD storage calculation - returning 0 as SSD is the primary storage type now
  return 0
})
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
  hdd: null,
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
  },
}

// Center text plugin for Chart.js
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { ctx, width, height } = chart

    // Get the actual center from the chart's dataset metadata
    const meta = chart.getDatasetMeta(0)
    if (!meta || !meta.data || meta.data.length === 0) return

    const firstArc = meta.data[0]
    const centerX = firstArc.x
    const centerY = firstArc.y

    // Clear the center area to prevent text overlap
    const radius = 80
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()

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
        labelText = t('pages.dashboard.resources.totalVCores')
      } else if (chartType === 'ram') {
        valueText = `${beautifyValue(totalRAM.value / 1024, 2)} TB`
        labelText = t('pages.dashboard.resources.totalRam')
      } else if (chartType === 'ssd') {
        valueText = `${beautifyValue(totalSSD.value / 1000000, 2)} PB`
        labelText = t('pages.dashboard.resources.totalSsd')
      } else if (chartType === 'hdd') {
        valueText = `${beautifyValue(totalHDD.value / 1000, 2)} TB`
        labelText = t('pages.dashboard.resources.totalHdd')
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
  },
}

// Create base chart options
const createChartOptions = chartType => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  layout: {
    padding: {
      top: 25,
      bottom: 25,
      left: 25,
      right: 25,
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
    },
    segmentGlow: {},
    centerText: {},
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
    intersect: true,
  },
})

// CPU Chart Data
const cpuChartData = computed(() => ({
  labels: [t('pages.dashboard.resources.tierCumulus'), t('pages.dashboard.resources.tierNimbus'), t('pages.dashboard.resources.tierStratus')],
  datasets: [{
    data: [cumulusCpuValue.value, nimbusCpuValue.value, stratusCpuValue.value],
    backgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    hoverBackgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    borderColor: getSurfaceColor(),
    borderWidth: 2,
    hoverBorderWidth: 0,
    hoverOffset: 0,
    _chartType: 'cpu',
  }],
}))

const cpuChartOptions = computed(() => createChartOptions('cpu'))

// RAM Chart Data
const ramChartData = computed(() => ({
  labels: [t('pages.dashboard.resources.tierCumulus'), t('pages.dashboard.resources.tierNimbus'), t('pages.dashboard.resources.tierStratus')],
  datasets: [{
    data: [cumulusRamValue.value, nimbusRamValue.value, stratusRamValue.value],
    backgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    hoverBackgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    borderColor: getSurfaceColor(),
    borderWidth: 2,
    hoverBorderWidth: 0,
    hoverOffset: 0,
    _chartType: 'ram',
  }],
}))

const ramChartOptions = computed(() => createChartOptions('ram'))

// SSD Chart Data
const ssdChartData = computed(() => ({
  labels: [t('pages.dashboard.resources.tierCumulus'), t('pages.dashboard.resources.tierNimbus'), t('pages.dashboard.resources.tierStratus')],
  datasets: [{
    data: [cumulusSSDStorageValue.value, nimbusSSDStorageValue.value, stratusSSDStorageValue.value],
    backgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    hoverBackgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    borderColor: getSurfaceColor(),
    borderWidth: 2,
    hoverBorderWidth: 0,
    hoverOffset: 0,
    _chartType: 'ssd',
  }],
}))

const ssdChartOptions = computed(() => createChartOptions('ssd'))

// HDD Chart Data
const hddChartData = computed(() => ({
  labels: [t('pages.dashboard.resources.tierCumulus'), t('pages.dashboard.resources.tierNimbus'), t('pages.dashboard.resources.tierStratus')],
  datasets: [{
    data: [cumulusHDDStorageValue.value, nimbusHDDStorageValue.value, stratusHDDStorageValue.value],
    backgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    hoverBackgroundColor: [tierColors.cumulus, tierColors.nimbus, tierColors.stratus],
    borderColor: getSurfaceColor(),
    borderWidth: 2,
    hoverBorderWidth: 0,
    hoverOffset: 0,
    _chartType: 'hdd',
  }],
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
    { name: t('pages.dashboard.resources.tierCumulus'), data: cumulusData },
    { name: t('pages.dashboard.resources.tierNimbus'), data: nimbusData },
    { name: t('pages.dashboard.resources.tierStratus'), data: stratusData },
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

    // Reset all values to 0
    cumulusCpuValue.value = 0
    nimbusCpuValue.value = 0
    stratusCpuValue.value = 0
    cumulusRamValue.value = 0
    nimbusRamValue.value = 0
    stratusRamValue.value = 0
    cumulusSSDStorageValue.value = 0
    cumulusHDDStorageValue.value = 0
    nimbusSSDStorageValue.value = 0
    nimbusHDDStorageValue.value = 0
    stratusSSDStorageValue.value = 0
    stratusHDDStorageValue.value = 0

    const fluxTierBench = await axios.get(
      "https://stats.runonflux.io/fluxinfo?projection=tier,benchmark",
    )

    // Check if API returned an error response
    if (fluxTierBench.data.status === 'error') {
      console.error('API returned error:', fluxTierBench.data.data)
      hasValidData.value = false
      fluxListLoading.value = false
      
      return
    }

    const fluxTierBenchList = fluxTierBench.data.data

    // Check if fluxTierBenchList is an array before using forEach
    if (!Array.isArray(fluxTierBenchList)) {
      console.error('fluxTierBenchList is not an array:', fluxTierBenchList)
      console.log('Full API response:', fluxTierBench.data)
      hasValidData.value = false
      fluxListLoading.value = false
      
      return
    }

    // If we got here, data is valid
    hasValidData.value = true

    console.log('Number of nodes in fluxTierBenchList:', fluxTierBenchList.length)

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

    fluxListLoading.value = false
  } catch (error) {
    console.error(error)
    hasValidData.value = false
    fluxListLoading.value = false
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
watch(theme, newTheme => {
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
    hdd: null,
  }
}

onMounted(async () => {
  // Always re-register custom Chart.js plugins to ensure they work after navigation
  // First unregister if they exist
  if (ChartJS.defaults.plugins.segmentGlow) {
    ChartJS.unregister(segmentGlowPlugin)
  }
  if (ChartJS.defaults.plugins.centerText) {
    ChartJS.unregister(centerTextPlugin)
  }

  // Then register them fresh
  ChartJS.register(segmentGlowPlugin)
  ChartJS.register(centerTextPlugin)

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

  // Unregister plugins to prevent memory leaks
  if (ChartJS.defaults.plugins.segmentGlow) {
    ChartJS.unregister(segmentGlowPlugin)
  }
  if (ChartJS.defaults.plugins.centerText) {
    ChartJS.unregister(centerTextPlugin)
  }
})
</script>

<style scoped>
.resources-intro-card {
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-success), 0.05) 100%);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.resources-intro-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.1);
}

.summary-card {
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 1);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.resource-summary-item {
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.5) 0%, rgba(var(--v-theme-primary), 0.03) 100%);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.resource-summary-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.12);
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.6) 0%, rgba(var(--v-theme-primary), 0.06) 100%);
}

.resource-summary-value {
  font-size: 2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 8px;
  line-height: 1.2;
}

.resource-summary-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

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
