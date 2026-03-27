<template>
  <div>
    <!-- Header -->
    <VRow class="align-center justify-space-between mb-1">
      <VCol cols="12" class="d-flex align-center pb-0">
        <div class="d-flex flex-wrap w-100 align-center justify-space-between border-frame">
          <div class="d-flex align-center">
            <VAvatar size="35" color="info" variant="tonal" rounded="sm" class="mr-2 ml-1">
              <VIcon size="26">mdi-chart-line</VIcon>
            </VAvatar>
            <span class="text-h5">{{ t('core.auditStats.title') }}</span>
          </div>
          <div class="d-flex align-center ga-2 mr-1">
            <VBtn
              size="small"
              variant="tonal"
              color="warning"
              @click="$emit('back')"
            >
              <VIcon class="mr-1">mdi-shield-search</VIcon>
              {{ t('core.auditViewer.title') }}
            </VBtn>
            <VSelect
              v-model="period"
              :items="periodOptions"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 140px;"
              :menu-props="{ contentClass: 'audit-stats-select' }"
            />
            <VBtn
              size="small"
              variant="flat"
              color="primary"
              :loading="loading"
              @click="fetchAll"
            >
              <VIcon class="mr-1">mdi-refresh</VIcon>
              {{ t('core.auditStats.refresh') }}
            </VBtn>
          </div>
        </div>
      </VCol>
    </VRow>

    <!-- Loading -->
    <div v-if="loading && !summary" class="d-flex justify-center pa-6">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="pa-4 text-center">
      <VIcon color="error" size="48" class="mb-2">mdi-alert-circle</VIcon>
      <div class="text-body-1">{{ error }}</div>
      <VBtn class="mt-2" variant="flat" color="primary" size="small" min-width="140" @click="fetchAll">
        <VIcon class="mr-1">mdi-refresh</VIcon>
        {{ t('core.auditStats.refresh') }}
      </VBtn>
    </div>

    <template v-else-if="summary">
      <!-- Stat Cards -->
      <VRow dense class="mt-3">
        <VCol v-for="stat in statCards" :key="stat.key" cols="6" sm="4" md class="d-flex">
          <VCard class="stat-card flex-grow-1" :style="{ borderLeft: `3px solid rgb(var(--v-theme-${stat.color}))` }">
            <div class="d-flex align-center ga-3 pa-4">
              <VAvatar size="44" :color="stat.color" variant="tonal" rounded="lg">
                <VIcon size="24">{{ stat.icon }}</VIcon>
              </VAvatar>
              <div class="stat-card__text">
                <div class="text-h5 font-weight-bold text-no-wrap">{{ stat.value }}</div>
                <div class="text-caption text-medium-emphasis text-no-wrap">{{ stat.label }}</div>
              </div>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Timeseries Chart -->
      <VRow v-if="summary.total_events > 0" dense class="mt-4">
        <VCol cols="12">
          <VCard class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-subtitle-1 font-weight-medium">{{ t('core.auditStats.eventsOverTime') }}</div>
            </div>
            <div style="position: relative; height: 300px;">
              <canvas ref="timeseriesCanvas"></canvas>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Top Lists -->
      <VRow dense class="mt-4">
        <VCol v-for="list in topLists" :key="list.key" cols="12" md="4">
          <VCard class="top-card">
            <div class="d-flex align-center ga-2 pa-4 pb-2">
              <VIcon size="20" :color="list.color">{{ list.icon }}</VIcon>
              <div class="text-subtitle-1 font-weight-medium">{{ list.title }}</div>
            </div>
            <VDivider />
            <div class="pa-4 pt-2" style="min-height: 200px;">
              <div v-if="!list.items?.length" class="d-flex flex-column align-center justify-center text-medium-emphasis" style="min-height: 160px;">
                <VIcon size="40" class="mb-2 opacity-30">{{ list.emptyIcon }}</VIcon>
                <div class="text-caption">{{ t('core.auditStats.noData') }}</div>
              </div>
              <div v-else class="top-list">
                <div v-for="(item, i) in list.items" :key="i" class="top-list__item">
                  <div class="d-flex align-center ga-2">
                    <div class="top-list__rank">{{ i + 1 }}</div>
                    <VChip size="small" :color="list.chipColor(item)" :variant="list.chipVariant" label class="top-list__chip" :class="[list.chipTextClass]">
                      <VIcon v-if="list.chipIcon" size="14" start>{{ list.chipIcon(item) }}</VIcon>
                      <span class="top-list__chip-text">{{ list.chipText(item) }}</span>
                    </VChip>
                  </div>
                  <VChip size="small" variant="tonal" :color="list.countColor" label>
                    {{ formatNumber(item.count) }}
                  </VChip>
                </div>
              </div>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Category Breakdown -->
      <VRow v-if="summary.byCategory?.length" dense class="mt-4 mb-2">
        <VCol cols="12">
          <VCard class="pa-4">
            <div class="text-subtitle-1 font-weight-medium mb-3">{{ t('core.auditStats.byCategory') }}</div>
            <div class="d-flex flex-wrap ga-2">
              <VChip
                v-for="cat in summary.byCategory"
                :key="cat.category"
                variant="tonal"
                :color="getCategoryColor(cat.category)"
                label
              >
                <VIcon size="16" start>{{ getCategoryIcon(cat.category) }}</VIcon>
                {{ t(`core.auditStats.categories.${cat.category}`, cat.category) }}
                <VChip size="x-small" variant="tonal" color="success" label class="ml-2">
                  {{ formatNumber(cat.count) }}
                </VChip>
              </VChip>
            </div>
          </VCard>
        </VCol>
      </VRow>
    </template>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import {
  Chart, LineController, LineElement, CategoryScale,
  LinearScale, PointElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { getEventIcon, getEventColor } from '@/@core/utils/eventStyles'

const props = defineProps({
  auditUrl: {
    type: String,
    required: true,
  },
  appName: {
    type: String,
    default: null,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['back'])

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend)

const { t } = useI18n()
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const loading = ref(false)
const error = ref(null)
const summary = ref(null)
const period = ref('1h')
const timeseriesCanvas = ref(null)
const chart = shallowRef(null)
let abortController = null

const periodKeys = ['1h', '6h', '24h', '7d', '30d', '60d', '90d', '180d', '365d', 'all']
const periodOptions = computed(() =>
  periodKeys.map(k => ({ title: t(`core.auditStats.periods.${k}`), value: k })),
)

const BUCKET_FOR_PERIOD = {
  '1h': '5 minutes',
  '6h': '1 hour',
  '24h': '1 hour',
  '7d': '1 day',
  '30d': '1 day',
  '60d': '1 day',
  '90d': '1 day',
  '180d': '1 day',
  '365d': '1 day',
  'all': '1 day',
}

const statCards = computed(() => {
  if (!summary.value) return []
  const s = summary.value
  
  return [
    { key: 'events', icon: 'mdi-chart-bar', color: 'primary', value: formatNumber(s.total_events), label: t('core.auditStats.totalEvents') },
    { key: 'users', icon: 'mdi-account-group', color: 'info', value: formatNumber(s.unique_users), label: t('core.auditStats.uniqueUsers') },
    { key: 'errors', icon: 'mdi-alert-circle', color: 'error', value: `${s.error_rate ?? 0}%`, label: t('core.auditStats.errorRate') },
    { key: 'response', icon: 'mdi-timer-outline', color: 'warning', value: `${s.avg_response_ms ?? 0}ms`, label: t('core.auditStats.avgResponse') },
    { key: 'db', icon: 'mdi-database', color: 'secondary', value: s.db_size, label: t('core.auditStats.dbSize') },
  ]
})

const topLists = computed(() => {
  if (!summary.value) return []
  const s = summary.value
  
  return [
    {
      key: 'events',
      title: t('core.auditStats.topEvents'),
      icon: 'mdi-format-list-bulleted',
      color: 'grey',
      emptyIcon: 'mdi-format-list-bulleted',
      items: s.topEvents,
      chipColor: item => getEventColor(item.event_type),
      chipVariant: 'tonal',
      chipIcon: item => getEventIcon(item.event_type),
      chipText: item => item.event_type,
      countColor: 'success',
    },
    {
      key: 'nodes',
      title: t('core.auditStats.topNodes'),
      icon: 'mdi-server-network',
      color: 'grey',
      emptyIcon: 'mdi-server-network-off',
      items: s.topNodes,
      chipColor: () => 'default',
      chipVariant: 'outlined',
      chipIcon: () => 'mdi-server-network',
      chipText: item => item.node_ip,
      chipTextClass: 'text-grey',
      countColor: 'secondary',
    },
    {
      key: 'users',
      title: t('core.auditStats.topUsers'),
      icon: 'mdi-account-group',
      color: 'grey',
      emptyIcon: 'mdi-account-off',
      items: s.topUsers,
      chipColor: () => 'default',
      chipVariant: 'outlined',
      chipIcon: () => 'mdi-account',
      chipText: item => item.zelid || '-',
      chipTextClass: 'text-grey',
      countColor: 'info',
    },
  ]
})

function getHeaders() {
  const zelidauth = localStorage.getItem('zelidauth')
  
  return zelidauth ? { Authorization: `zelidauth ${zelidauth}` } : {}
}

async function fetchSummary(signal) {
  const params = new URLSearchParams({ period: period.value })
  if (props.appName) params.set('appName', props.appName)

  const res = await fetch(`${props.auditUrl}/api/v1/dashboard/summary?${params}`, {
    headers: getHeaders(),
    signal,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  
  return res.json()
}

async function fetchTimeseries(signal) {
  const bucket = BUCKET_FOR_PERIOD[period.value] || '1 hour'
  const params = new URLSearchParams({ period: period.value, bucket })
  if (props.appName) params.set('appName', props.appName)

  const res = await fetch(`${props.auditUrl}/api/v1/dashboard/timeseries?${params}`, {
    headers: getHeaders(),
    signal,
  })
  if (!res.ok) return { data: [] }
  
  return res.json()
}

async function fetchAll() {
  if (abortController) abortController.abort()
  abortController = new AbortController()

  loading.value = true
  error.value = null

  try {
    const [summaryData, timeseriesData] = await Promise.all([
      fetchSummary(abortController.signal),
      fetchTimeseries(abortController.signal),
    ])
    summary.value = summaryData
    await nextTick()
    renderChart(timeseriesData.data || [])
  } catch (err) {
    if (err.name === 'AbortError') return
    error.value = err.message
    summary.value = null
  } finally {
    loading.value = false
  }
}

function renderChart(data) {
  if (chart.value) {
    chart.value.destroy()
    chart.value = null
  }

  if (!timeseriesCanvas.value || data.length === 0) return

  const ctx = timeseriesCanvas.value.getContext('2d')

  const labels = data.map(d => formatBucketLabel(d.bucket))

  chart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('core.auditStats.totalEvents'),
          data: data.map(d => parseInt(d.event_count) || 0),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
        {
          label: t('core.auditStats.errors'),
          data: data.map(d => parseInt(d.error_count) || 0),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: t('core.auditStats.uniqueUsers'),
          data: data.map(d => parseInt(d.unique_users) || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          fill: false,
          tension: 0.4,
          borderDash: [5, 5],
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      scales: {
        x: {
          grid: { color: 'rgba(128, 128, 128, 0.08)' },
          ticks: { maxRotation: 45, font: { size: 10 }, color: 'rgba(128, 128, 128, 0.6)' },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(128, 128, 128, 0.08)' },
          ticks: {
            precision: 0,
            color: 'rgba(128, 128, 128, 0.6)',
            callback: v => formatNumber(v),
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: isDark.value ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDark.value ? '#fff' : '#000',
          bodyColor: isDark.value ? '#fff' : '#000',
          borderColor: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8,
          usePointStyle: true,
          callbacks: {
            label: ctx => `  ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)}`,
          },
        },
      },
    },
  })
}

function formatBucketLabel(bucket) {
  const d = new Date(bucket)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')

  const p = period.value
  if (p === '1h' || p === '6h' || p === '24h') return `${hh}:${mi}`
  
  return `${dd}/${mm} ${hh}:${mi}`
}

function formatNumber(n) {
  const num = parseInt(n)
  if (!Number.isFinite(num)) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  
  return num.toLocaleString()
}

const CATEGORY_STYLES = {
  app_management: { color: 'success', icon: 'mdi-apps' },
  administration: { color: 'error', icon: 'mdi-cog' },
  monitoring: { color: 'warning', icon: 'mdi-eye' },
  deployment: { color: 'info', icon: 'mdi-rocket-launch' },
}

function getCategoryColor(category) {
  return CATEGORY_STYLES[category]?.color || 'secondary'
}

function getCategoryIcon(category) {
  return CATEGORY_STYLES[category]?.icon || 'mdi-tag'
}

onMounted(() => {
  fetchAll()
})

watch(() => props.active, isActive => {
  if (isActive) fetchAll()
})

onBeforeUnmount(() => {
  if (abortController) abortController.abort()
  if (chart.value) {
    chart.value.destroy()
    chart.value = null
  }
})

watch(period, () => fetchAll())

watch(isDark, dark => {
  if (!chart.value) return
  const tt = chart.value.options.plugins.tooltip
  tt.backgroundColor = dark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  tt.titleColor = dark ? '#fff' : '#000'
  tt.bodyColor = dark ? '#fff' : '#000'
  tt.borderColor = dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  chart.value.update()
})
</script>

<style scoped>
.border-frame {
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 5px;
  padding: 6px;
  min-height: 54px;
  gap: 8px;
}

.stat-card {
  border-radius: 12px !important;
  border: 1px solid rgba(128, 128, 128, 0.25) !important;
  transition: transform 0.15s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.top-card {
  border-radius: 12px !important;
  border: 1px solid rgba(128, 128, 128, 0.25) !important;
  height: 100%;
}

:deep(.v-card) {
  border: 1px solid rgba(128, 128, 128, 0.25) !important;
}

.top-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
}

.top-list__item:last-child {
  border-bottom: none;
}

.top-list__rank {
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.08);
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.top-list__chip {
  max-width: 100%;
  overflow: hidden;
}

.top-list__chip :deep(.v-chip__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.top-list__chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-list__item .d-flex:first-child {
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.stat-card__text {
  min-width: 0;
  overflow: hidden;
}
</style>

<style>
.audit-stats-select {
  scrollbar-width: thin;
}

.audit-stats-select::-webkit-scrollbar {
  width: 4px;
}

.audit-stats-select::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.3);
  border-radius: 4px;
}
</style>
