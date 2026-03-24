<template>
  <div>
    <VRow class="align-center justify-space-between mb-1">
      <VCol cols="12" class="d-flex align-center pb-0">
        <div class="d-flex w-100 align-center justify-space-between border-frame">
          <div class="d-flex align-center">
            <VAvatar size="35" color="warning" variant="tonal" rounded="sm" class="mr-2 ml-1">
              <VIcon size="26">mdi-shield-search</VIcon>
            </VAvatar>
            <span class="text-h5">{{ t('core.auditViewer.title') }}</span>
            <VChip
              size="x-small"
              :color="sseConnected ? 'success' : 'error'"
              variant="tonal"
              rounded="md"
              class="ml-2"
            >
              <VIcon size="8" class="mr-1">{{ sseConnected ? 'mdi-circle' : 'mdi-circle-off-outline' }}</VIcon>
              {{ sseConnected ? t('core.auditViewer.live') : t('core.auditViewer.offline') }}
            </VChip>
          </div>
          <div class="d-flex align-center ga-2 mr-1">
            <VBtn
              size="small"
              variant="tonal"
              color="info"
              @click="$emit('open-stats')"
            >
              <VIcon class="mr-1">mdi-chart-line</VIcon>
              {{ t('core.auditStats.title') }}
            </VBtn>
            <VBtn
              size="small"
              variant="flat"
              color="primary"
              :loading="loading"
              @click="fetchEvents"
            >
              <VIcon class="mr-1">mdi-refresh</VIcon>
              {{ t('core.auditViewer.refresh') }}
            </VBtn>
          </div>
        </div>
      </VCol>
    </VRow>

    <!-- Filters -->
    <VRow dense class="mt-3 mb-1">
      <VCol cols="6" sm="4" md="2">
        <VSelect
          v-model="filters.period"
          :items="periodOptions"
          :label="t('core.auditViewer.filters.period')"
          density="compact"
          variant="outlined"
          hide-details
        />
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VSelect
          v-model="filters.category"
          :items="categoryOptions"
          :label="t('core.auditViewer.filters.category')"
          density="compact"
          variant="outlined"
          clearable
          hide-details
        />
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VSelect
          v-model="filters.eventType"
          :items="eventTypeOptions"
          :label="t('core.auditViewer.filters.eventType')"
          density="compact"
          variant="outlined"
          clearable
          hide-details
        >
          <template #item="{ item, props: itemProps }">
            <VListItem v-if="item.raw.isSection" disabled :style="{ minHeight: '32px' }">
              <VListItemTitle class="text-caption text-medium-emphasis d-flex align-center" style="gap: 6px;">
                <VIcon size="16">{{ item.raw.icon }}</VIcon>
                {{ item.raw.title }}
              </VListItemTitle>
            </VListItem>
            <VListItem v-else v-bind="itemProps" class="font-weight-medium" />
          </template>
        </VSelect>
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VSelect
          v-model="filters.responseStatus"
          :items="statusOptions"
          :label="t('core.auditViewer.filters.status')"
          density="compact"
          variant="outlined"
          clearable
          hide-details
        />
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VAutocomplete
          v-model="filters.component"
          :items="uniqueComponents"
          label="Component"
          density="compact"
          variant="outlined"
          clearable
          hide-details
        />
      </VCol>
      <VCol cols="6" sm="4" md="2">
        <VAutocomplete
          v-model="filters.nodeIp"
          :items="uniqueNodeIps"
          :label="t('core.auditViewer.filters.nodeIp')"
          density="compact"
          variant="outlined"
          clearable
          hide-details
        />
      </VCol>
    </VRow>
    <VRow dense class="mb-3">
      <VCol cols="12" sm="4" md="3">
        <VAutocomplete
          v-model="filters.zelid"
          :items="uniqueZelids"
          :label="t('core.auditViewer.filters.zelid')"
          density="compact"
          variant="outlined"
          clearable
          hide-details
        />
      </VCol>
      <VCol cols="8" sm="4" md="3">
        <VTextField
          v-model="filters.search"
          :label="t('core.auditViewer.filters.search')"
          density="compact"
          variant="outlined"
          clearable
          hide-details
          :placeholder="t('core.auditViewer.filters.searchPlaceholder')"
          @keyup.enter="fetchEvents"
        />
      </VCol>
      <VCol cols="4" sm="4" md="2" class="d-flex align-center">
        <VBtn color="primary" variant="flat" density="compact" block @click="fetchEvents">
          <VIcon class="mr-1">mdi-magnify</VIcon>
          {{ t('core.auditViewer.search') }}
        </VBtn>
      </VCol>
    </VRow>

    <!-- Results -->
    <VCard variant="outlined" class="mt-2">
      <div v-if="loading" class="d-flex justify-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <div v-else-if="error" class="pa-4 text-center">
        <VIcon color="error" size="48" class="mb-2">mdi-alert-circle</VIcon>
        <div class="text-body-1">{{ error }}</div>
        <VBtn class="mt-2" variant="tonal" size="small" @click="fetchEvents">
          {{ t('core.auditViewer.retry') }}
        </VBtn>
      </div>

      <div v-else-if="events.length === 0" class="pa-6 text-center text-medium-emphasis">
        <VIcon size="48" class="mb-2">mdi-database-off</VIcon>
        <div>{{ t('core.auditViewer.noEvents') }}</div>
      </div>

      <template v-else>
        <!-- Mobile: Card view -->
        <div v-if="mobile" class="audit-cards pa-2">
          <VCard
            v-for="event in events"
            :key="event.id"
            variant="outlined"
            class="audit-card mb-2"
            :class="{ 'audit-card--expanded': expandedEvent === event.id }"
            @click="expandedEvent = expandedEvent === event.id ? null : event.id"
          >
            <div class="pa-3">
              <!-- Row 1: Event type + Status -->
              <div class="d-flex align-center justify-space-between mb-2">
                <VChip size="small" :color="getEventStyle(event.event_type).color" variant="tonal" label>
                  <VIcon size="18" start>{{ getEventStyle(event.event_type).icon }}</VIcon>
                  {{ event.event_type }}
                </VChip>
                <div class="d-flex align-center ga-1">
                  <VChip
                    size="small"
                    :color="getStatusColor(event.response_status, event.response_code)"
                    variant="tonal"
                    label
                  >
                    <VIcon size="14" start>{{ getStatusIcon(event.response_status, event.response_code) }}</VIcon>
                    {{ event.response_code || event.response_status }}
                  </VChip>
                  <VIcon size="16" class="expand-icon" :class="{ 'expand-icon--open': expandedEvent === event.id }">
                    mdi-chevron-down
                  </VIcon>
                </div>
              </div>

              <!-- Row 2: Time + Duration -->
              <div class="d-flex align-center flex-wrap ga-1 mb-2">
                <VChip size="x-small" variant="outlined" label>
                  <VIcon size="12" start>mdi-clock-outline</VIcon>
                  {{ formatTime(event.timestamp) }}
                </VChip>
                <VChip
                  v-if="event.response_time_ms"
                  size="x-small"
                  :color="getDurationColor(event.response_time_ms)"
                  variant="tonal"
                  label
                >
                  <VIcon size="12" start>mdi-timer-outline</VIcon>
                  {{ event.response_time_ms }}ms
                </VChip>
              </div>

              <!-- Row 3: User + App + Node -->
              <div class="d-flex align-center flex-wrap ga-1">
                <div class="d-inline-flex align-center ga-1">
                  <VChip size="x-small" variant="outlined" label :title="event.zelid">
                    <VIcon size="12" start>mdi-account</VIcon>
                    {{ shortZelid(event.zelid) }}
                  </VChip>
                  <VBtn
                    size="x-small"
                    variant="text"
                    density="compact"
                    :color="copiedEventId === event.id ? 'success' : 'grey'"
                    icon
                    class="copy-zelid-btn"
                    :data-clipboard-text="event.zelid"
                    :data-event-id="event.id"
                    @click.stop
                  >
                    <VIcon size="12">
                      {{ copiedEventId === event.id ? 'mdi-check-circle' : 'mdi-content-copy' }}
                    </VIcon>
                  </VBtn>
                </div>
                <VChip v-if="event.app_name" size="x-small" variant="outlined" label>
                  <VIcon size="12" start>mdi-application</VIcon>
                  {{ event.app_name.toLowerCase() }}
                </VChip>
                <VChip v-if="event.component && event.component !== 'null'" size="x-small" variant="tonal" color="info" label>
                  {{ event.component }}
                </VChip>
                <VChip v-if="event.node_ip" size="x-small" variant="outlined" label>
                  <VIcon size="12" start>mdi-server-network</VIcon>
                  {{ event.node_ip }}
                </VChip>
              </div>
            </div>

            <!-- Expanded detail -->
            <div v-if="expandedEvent === event.id" class="audit-detail pa-3">
              <div class="d-flex align-center flex-wrap ga-2 mb-3">
                <VChip size="small" :color="event.category === 'administration' ? 'warning' : 'info'" variant="tonal" label>
                  <VIcon size="14" start>{{ event.category === 'administration' ? 'mdi-cog' : 'mdi-apps' }}</VIcon>
                  {{ event.category }}
                </VChip>
                <VChip size="small" variant="outlined" label class="audit-endpoint-chip">
                  <VIcon size="14" start>mdi-api</VIcon>
                  <span class="font-weight-medium">{{ event.http_method }}</span>&nbsp;{{ event.api_endpoint }}
                </VChip>
              </div>

              <div class="d-flex flex-wrap ga-1 mb-3">
                <VChip v-if="event.zelid" size="x-small" variant="outlined" prepend-icon="mdi-account" label>
                  <code class="text-caption">{{ event.zelid }}</code>
                </VChip>
                <VChip v-if="event.ip_address" size="x-small" variant="outlined" prepend-icon="mdi-earth" label>
                  {{ event.ip_address }}
                </VChip>
              </div>

              <div v-if="event.error_message">
                <div class="audit-detail__label text-error">
                  <VIcon size="14" class="mr-1" color="error">mdi-alert-circle</VIcon>
                  {{ t('core.auditViewer.detail.error') }}
                </div>
                <pre class="audit-detail__json audit-detail__json--error">{{ event.error_message }}</pre>
              </div>
            </div>
          </VCard>
        </div>

        <!-- Desktop: Table view -->
        <VTable v-else density="compact" hover class="audit-table">
          <thead>
            <tr>
              <th style="width: 0; padding: 0;"></th>
              <th>{{ t('core.auditViewer.columns.time') }}</th>
              <th>{{ t('core.auditViewer.columns.user') }}</th>
              <th>{{ t('core.auditViewer.columns.event') }}</th>
              <th>{{ t('core.auditViewer.columns.app') }}</th>
              <th>{{ t('core.auditViewer.columns.node') }}</th>
              <th>{{ t('core.auditViewer.columns.status') }}</th>
              <th>{{ t('core.auditViewer.columns.time_ms') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="event in events" :key="event.id">
              <tr
                class="audit-row"
                :class="{ 'audit-row--expanded': expandedEvent === event.id }"
                @click="expandedEvent = expandedEvent === event.id ? null : event.id"
              >
                <td style="padding: 0; width: 0;">
                  <VIcon size="16" class="expand-icon" :class="{ 'expand-icon--open': expandedEvent === event.id }">
                    mdi-chevron-down
                  </VIcon>
                </td>
                <td>
                  <VChip size="small" variant="outlined" label>
                    <VIcon size="14" start>mdi-clock-outline</VIcon>
                    {{ formatTime(event.timestamp) }}
                  </VChip>
                </td>
                <td>
                  <div class="d-inline-flex align-center ga-1">
                    <VChip size="small" variant="outlined" label :title="event.zelid">
                      <VIcon size="14" start>mdi-account</VIcon>
                      {{ shortZelid(event.zelid) }}
                    </VChip>
                    <VBtn
                      size="x-small"
                      variant="text"
                      density="compact"
                      :color="copiedEventId === event.id ? 'success' : 'grey'"
                      icon
                      class="copy-zelid-btn"
                      :data-clipboard-text="event.zelid"
                      :data-event-id="event.id"
                      @click.stop
                    >
                      <VIcon size="14">
                        {{ copiedEventId === event.id ? 'mdi-check-circle' : 'mdi-content-copy' }}
                      </VIcon>
                    </VBtn>
                  </div>
                </td>
                <td>
                  <VChip size="small" :color="getEventStyle(event.event_type).color" variant="tonal" label>
                    <VIcon size="18" start>{{ getEventStyle(event.event_type).icon }}</VIcon>
                    {{ event.event_type }}
                  </VChip>
                </td>
                <td>
                  <div v-if="event.app_name" class="d-flex align-center ga-1 flex-wrap">
                    <VChip size="small" variant="outlined" label>
                      <VIcon size="14" start>mdi-application</VIcon>
                      {{ event.app_name.toLowerCase() }}
                    </VChip>
                    <VChip v-if="event.component && event.component !== 'null'" size="small" variant="tonal" color="info" label>
                      {{ event.component }}
                    </VChip>
                  </div>
                  <span v-else class="text-disabled text-caption">-</span>
                </td>
                <td>
                  <VChip v-if="event.node_ip" size="small" variant="outlined" label>
                    <VIcon size="14" start>mdi-server-network</VIcon>
                    {{ event.node_ip }}
                  </VChip>
                  <span v-else class="text-disabled text-caption">-</span>
                </td>
                <td>
                  <VChip
                    size="small"
                    :color="getStatusColor(event.response_status, event.response_code)"
                    variant="tonal"
                    label
                  >
                    <VIcon size="14" start>{{ getStatusIcon(event.response_status, event.response_code) }}</VIcon>
                    {{ event.response_code || event.response_status }}
                  </VChip>
                </td>
                <td>
                  <VChip
                    v-if="event.response_time_ms"
                    size="small"
                    :color="getDurationColor(event.response_time_ms)"
                    variant="tonal"
                    label
                  >
                    <VIcon size="14" start>mdi-timer-outline</VIcon>
                    {{ event.response_time_ms }}ms
                  </VChip>
                  <span v-else class="text-disabled text-caption d-block text-center">-</span>
                </td>
              </tr>
              <tr v-if="expandedEvent === event.id" :key="'detail-' + event.id" class="audit-detail-row">
                <td colspan="8" class="pa-0">
                  <div class="audit-detail pa-3">
                    <!-- Category + Endpoint -->
                    <div class="d-flex align-center flex-wrap ga-2 mb-3">
                      <VChip size="small" :color="event.category === 'administration' ? 'warning' : 'info'" variant="tonal" label>
                        <VIcon size="14" start>{{ event.category === 'administration' ? 'mdi-cog' : 'mdi-apps' }}</VIcon>
                        {{ event.category }}
                      </VChip>
                      <VChip size="small" variant="outlined" label class="audit-endpoint-chip">
                        <VIcon size="14" start>mdi-api</VIcon>
                        <span class="font-weight-medium">{{ event.http_method }}</span>&nbsp;{{ event.api_endpoint }}
                      </VChip>
                    </div>

                    <!-- Metadata row -->
                    <div class="d-flex flex-wrap ga-2 mb-3">
                      <VChip v-if="event.zelid" size="small" variant="outlined" prepend-icon="mdi-account" label>
                        <code class="text-caption">{{ event.zelid }}</code>
                      </VChip>
                      <VChip v-if="event.ip_address" size="small" variant="outlined" prepend-icon="mdi-earth" label>
                        {{ event.ip_address }}
                      </VChip>
                    </div>

                    <!-- Error -->
                    <VRow dense>
                      <VCol v-if="event.error_message" cols="12">
                        <div class="audit-detail__label text-error">
                          <VIcon size="14" class="mr-1" color="error">mdi-alert-circle</VIcon>
                          {{ t('core.auditViewer.detail.error') }}
                        </div>
                        <pre class="audit-detail__json audit-detail__json--error">{{ event.error_message }}</pre>
                      </VCol>
                    </VRow>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </VTable>

        <!-- Pagination -->
        <VCardActions class="justify-space-between align-center pa-3">
          <div class="d-flex align-center ga-3">
            <div class="text-caption text-medium-emphasis">
              {{ t('core.auditViewer.showing', { from: (page - 1) * limit + 1, to: Math.min(page * limit, totalCount), total: totalCount }) }}
            </div>
            <VSelect
              v-model="limit"
              :items="limitOptions"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 80px;"
              @update:model-value="page = 1; fetchEvents()"
            />
          </div>
          <VPagination
            v-model="page"
            :length="Math.ceil(totalCount / limit)"
            :total-visible="mobile ? 3 : 5"
            density="compact"
            @update:model-value="fetchEvents"
          />
        </VCardActions>
      </template>
    </VCard>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import ClipboardJS from 'clipboard'
import { EVENT_STYLES, getEventStyle } from '@/@core/utils/eventStyles'

const { t } = useI18n()
const { mobile } = useDisplay()

const props = defineProps({
  auditUrl: {
    type: String,
    required: true,
  },
  appName: {
    type: String,
    default: null,
  },
})

defineEmits(['open-stats'])

const loading = ref(false)
const error = ref(null)
const events = ref([])
const totalCount = ref(0)
const sseConnected = ref(false)
let sseAbortController = null
const page = ref(1)
const limit = ref(10)
const limitOptions = [10, 25, 50, 100]
const expandedEvent = ref(null)
const copiedEventId = ref(null)
let clipboardInstance = null

const uniqueZelids = computed(() => [...new Set(events.value.map(e => e.zelid).filter(Boolean))])
const uniqueNodeIps = computed(() => [...new Set(events.value.map(e => e.node_ip).filter(Boolean))])
const uniqueComponents = computed(() => [...new Set(events.value.map(e => e.component).filter(Boolean))])

const filters = ref({
  zelid: '',
  category: null,
  eventType: null,
  nodeIp: '',
  component: '',
  responseStatus: null,
  period: '24h',
  search: '',
})

const s = (key) => t(`core.auditStats.eventSections.${key}`)
const e = (key) => t(`core.auditStats.eventLabels.${key}`, key)

const eventTypeOptions = computed(() => [
  { title: s('allEvents'), value: null },
  { title: s('appLifecycle'), value: '_s1', isSection: true, icon: 'mdi-play-circle' },
  { title: e('app.start'), value: 'app.start' },
  { title: e('app.stop'), value: 'app.stop' },
  { title: e('app.pause'), value: 'app.pause' },
  { title: e('app.unpause'), value: 'app.unpause' },
  { title: e('app.restart'), value: 'app.restart' },
  { title: e('app.remove'), value: 'app.remove' },
  { title: e('app.register'), value: 'app.register' },
  { title: e('app.update'), value: 'app.update' },
  { title: s('appDiagnostics'), value: '_s2', isSection: true, icon: 'mdi-magnify' },
  { title: e('app.inspect'), value: 'app.inspect' },
  { title: e('app.logs'), value: 'app.logs' },
  { title: e('app.top'), value: 'app.top' },
  { title: e('app.stats'), value: 'app.stats' },
  { title: e('app.changes'), value: 'app.changes' },
  { title: e('app.exec'), value: 'app.exec' },
  { title: s('appDeployment'), value: '_s3', isSection: true, icon: 'mdi-rocket-launch' },
  { title: e('app.redeploy'), value: 'app.redeploy' },
  { title: e('app.testInstall'), value: 'app.testInstall' },
  { title: s('monitoring'), value: '_s4', isSection: true, icon: 'mdi-eye' },
  { title: e('app.monitor.start'), value: 'app.monitor.start' },
  { title: e('app.monitor.stop'), value: 'app.monitor.stop' },
  { title: e('app.monitor.status'), value: 'app.monitor.status' },
  { title: s('volumeBrowser'), value: '_s5', isSection: true, icon: 'mdi-folder-open' },
  { title: e('app.volume.browse'), value: 'app.volume.browse' },
  { title: e('app.volume.createFolder'), value: 'app.volume.createFolder' },
  { title: e('app.volume.rename'), value: 'app.volume.rename' },
  { title: e('app.volume.remove'), value: 'app.volume.remove' },
  { title: e('app.volume.upload'), value: 'app.volume.upload' },
  { title: e('app.volume.downloadFile'), value: 'app.volume.downloadFile' },
  { title: e('app.volume.downloadFolder'), value: 'app.volume.downloadFolder' },
  { title: s('backupRestore'), value: '_s6', isSection: true, icon: 'mdi-backup-restore' },
  { title: e('backup.create'), value: 'backup.create' },
  { title: e('backup.restore'), value: 'backup.restore' },
  { title: e('backup.delete'), value: 'backup.delete' },
  { title: e('backup.volumeInfo'), value: 'backup.volumeInfo' },
  { title: e('backup.listLocal'), value: 'backup.listLocal' },
  { title: s('administration'), value: '_s7', isSection: true, icon: 'mdi-cog' },
  { title: e('flux.update'), value: 'flux.update' },
  { title: e('flux.restart'), value: 'flux.restart' },
  { title: e('daemon.start'), value: 'daemon.start' },
  { title: e('daemon.stop'), value: 'daemon.stop' },
  { title: e('daemon.restart'), value: 'daemon.restart' },
  { title: e('benchmark.start'), value: 'benchmark.start' },
  { title: e('benchmark.restart'), value: 'benchmark.restart' },
])

const categoryOptions = computed(() => [
  { title: t('core.auditStats.categories.all'), value: null },
  { title: t('core.auditStats.categories.app_management'), value: 'app_management' },
  { title: t('core.auditStats.categories.administration'), value: 'administration' },
])

const statusOptions = computed(() => [
  { title: t('core.auditStats.statuses.all'), value: null },
  { title: t('core.auditStats.statuses.success'), value: 'success' },
  { title: t('core.auditStats.statuses.error'), value: 'error' },
])

const periodKeys = ['1h', '6h', '24h', '7d', '30d', '60d', '90d', '180d', '365d', 'all']
const periodOptions = computed(() =>
  periodKeys.map(k => ({ title: t(`core.auditStats.periods.${k}`), value: k }))
)

function getPeriodFrom(period) {
  if (period === 'all') return new Date(0).toISOString()
  const now = Date.now()
  const days = parseInt(period)
  const ms = period.endsWith('h')
    ? { '1h': 3600000, '6h': 21600000, '24h': 86400000 }[period]
    : days * 86400000

  return new Date(now - (ms || 86400000)).toISOString()
}

async function fetchEvents() {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams()
    params.set('page', page.value)
    params.set('limit', limit.value)
    params.set('sort', 'desc')
    params.set('from', getPeriodFrom(filters.value.period))

    if (props.appName) params.set('appName', props.appName)
    if (filters.value.zelid) params.set('zelid', filters.value.zelid)
    if (filters.value.category) params.set('category', filters.value.category)
    if (filters.value.eventType) params.set('eventType', filters.value.eventType)
    if (filters.value.nodeIp) params.set('nodeIp', filters.value.nodeIp)
    if (filters.value.component) params.set('component', filters.value.component)
    if (filters.value.responseStatus) params.set('responseStatus', filters.value.responseStatus)
    if (filters.value.search) params.set('search', filters.value.search)

    const zelidauth = localStorage.getItem('zelidauth')
    const response = await fetch(`${props.auditUrl}/api/v1/events?${params}`, {
      headers: {
        ...(zelidauth ? { Authorization: `zelidauth ${zelidauth}` } : {}),
      },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    events.value = data.data || []
    totalCount.value = data.pagination?.total || 0
  } catch (err) {
    error.value = err.message
    events.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
    await nextTick()
    initClipboard()
  }
}

async function connectSSE() {
  disconnectSSE()

  const zelidauth = localStorage.getItem('zelidauth')
  if (!zelidauth || !props.auditUrl) return

  sseAbortController = new AbortController()

  try {
    const response = await fetch(`${props.auditUrl}/api/v1/stream`, {
      headers: { Authorization: `zelidauth ${zelidauth}` },
      signal: sseAbortController.signal,
    })

    if (!response.ok || !response.body) {
      console.warn('[AuditViewer] SSE connection failed:', response.status, response.statusText)
      if (response.status !== 401 && response.status !== 403) scheduleReconnect()
      return
    }

    sseConnected.value = true
    resetReconnectDelay()
    // Refetch to catch events that arrived between initial fetch and SSE connection
    fetchEvents().catch(() => {})
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let currentEvent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          if (currentEvent === 'analytics_event') {
            try {
              const event = JSON.parse(line.slice(6))

              if (props.appName && event.app_name?.toLowerCase() !== props.appName.toLowerCase()) continue

              if (page.value === 1) {
                if (!event.id) event.id = `sse-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
                events.value.unshift(event)
                totalCount.value++

                if (events.value.length > limit.value) {
                  events.value.pop()
                }

                nextTick(() => initClipboard())
              }
            } catch { /* ignore parse errors */ }
          }
          currentEvent = ''
        } else if (line === '') {
          currentEvent = ''
        }
      }
    }

    // Stream ended cleanly — reconnect
    sseConnected.value = false
    scheduleReconnect()
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('[AuditViewer] SSE error:', err.message)
      sseConnected.value = false
      scheduleReconnect()
    }
  }
}

let reconnectTimer = null
let reconnectDelay = 3000

function scheduleReconnect() {
  if (reconnectTimer) return
  const zelidauth = localStorage.getItem('zelidauth')
  if (!zelidauth) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    reconnectDelay = Math.min(reconnectDelay * 2, 60000)
    connectSSE()
  }, reconnectDelay)
}

function resetReconnectDelay() {
  reconnectDelay = 3000
}

function disconnectSSE() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (sseAbortController) {
    sseAbortController.abort()
    sseAbortController = null
    sseConnected.value = false
  }
}

function formatTime(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')

  return `${dd}/${mm}/${yy} ${hh}:${mi}:${ss}`
}

function shortZelid(zelid) {
  if (!zelid) return '-'
  if (zelid.length <= 12) return zelid

  return `${zelid.slice(0, 6)}...${zelid.slice(-4)}`
}

function initClipboard() {
  if (clipboardInstance) {
    clipboardInstance.destroy()
    clipboardInstance = null
  }
  const elements = document.querySelectorAll('.copy-zelid-btn')
  clipboardInstance = new ClipboardJS(elements)
  clipboardInstance.on('success', (e) => {
    const eventId = e.trigger.getAttribute('data-event-id')
    copiedEventId.value = eventId
    setTimeout(() => { copiedEventId.value = null }, 3000)
    e.clearSelection()
  })
  clipboardInstance.on('error', (e) => {
    console.error('[AuditViewer] Copy error:', e)
  })
}

function getStatusColor(status, code) {
  if (status === 'error' || (code && code >= 500)) return 'error'
  if (code && code >= 400) return 'warning'
  return 'success'
}

function getStatusIcon(status, code) {
  if (status === 'error' || (code && code >= 500)) return 'mdi-close-circle'
  if (code && code >= 400) return 'mdi-alert-circle'
  return 'mdi-check-circle'
}

function getDurationColor(ms) {
  if (ms > 5000) return 'error'
  if (ms > 2000) return 'warning'
  if (ms > 500) return 'secondary'
  return 'success'
}


onMounted(() => {
  fetchEvents()
  connectSSE()
})

onBeforeUnmount(() => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  disconnectSSE()
  if (clipboardInstance) {
    clipboardInstance.destroy()
    clipboardInstance = null
  }
})

watch(() => filters.value.category, () => { page.value = 1; fetchEvents() })
watch(() => filters.value.eventType, () => { page.value = 1; fetchEvents() })
watch(() => filters.value.responseStatus, () => { page.value = 1; fetchEvents() })
watch(() => filters.value.period, () => { page.value = 1; fetchEvents() })
</script>

<style scoped>
.border-frame {
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 5px;
  padding: 6px;
  height: 54px;
}

.audit-table :deep(th) {
  font-size: 0.7rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.6;
  font-weight: 600;
}

.audit-table :deep(td) {
  padding-block: 6px !important;
  vertical-align: middle;
}

.audit-table :deep(td:first-child),
.audit-table :deep(th:first-child) {
  padding: 0 2px 0 8px !important;
  width: 16px !important;
  min-width: 16px !important;
  max-width: 16px !important;
  text-align: center;
}

.audit-row {
  cursor: pointer;
  transition: background-color 0.15s;
}

.audit-row:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.audit-row--expanded {
  background-color: rgba(var(--v-theme-primary), 0.05) !important;
}

.audit-detail-row td {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}

.audit-detail {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 8px;
  margin: 4px 8px 8px;
}

.audit-detail :deep(.v-window) {
  margin-top: 0 !important;
}

.audit-detail :deep(.json-pretty-wrapper) {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 6px;
}

.audit-detail :deep(.json-pretty-inner) {
  padding: 4px 0;
}

.audit-endpoint-chip {
  font-family: monospace;
  font-size: 0.75rem;
}

.audit-detail__label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  opacity: 0.6;
  display: flex;
  align-items: center;
}

.audit-detail__json {
  font-size: 0.75rem;
  font-family: monospace;
  line-height: 1.5;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 6px;
  padding: 10px 14px;
  max-height: 220px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.audit-detail__json--error {
  background: rgba(var(--v-theme-error), 0.05);
  border-color: rgba(var(--v-theme-error), 0.15);
  color: rgb(var(--v-theme-error));
}

.expand-icon {
  transition: transform 0.2s;
  opacity: 0.3;
}

.expand-icon--open {
  transform: rotate(180deg);
  opacity: 1;
  color: rgb(var(--v-theme-primary));
}

/* Mobile card view */
.audit-card {
  cursor: pointer;
  transition: border-color 0.15s;
}

.audit-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.audit-card--expanded {
  border-color: rgba(var(--v-theme-primary), 0.4) !important;
}

</style>
