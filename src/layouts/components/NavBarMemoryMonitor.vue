<template>
  <IconBtn @click="dialog = true">
    <VBadge
      :color="statusColor"
      dot
      :model-value="showBadge"
    >
      <VIcon icon="mdi-gauge" />
    </VBadge>
  </IconBtn>

  <VDialog
    v-model="dialog"
    max-width="500"
  >
    <VCard rounded="xl">
      <VCardTitle class="d-flex align-center justify-space-between bg-primary">
        <div class="d-flex align-center">
          <VIcon
            color="white"
            class="ml-3 mr-2"
          >
            mdi-gauge
          </VIcon>
          <span>{{ $t('memoryMonitor.title') }}</span>
        </div>
        <VBtn
          icon="mdi-close"
          variant="flat"
          size="small"
          @click="dialog = false"
        />
      </VCardTitle>

      <VCardText>
        <div v-if="!memoryAvailable">
          <VAlert
            type="warning"
            variant="tonal"
          >
            {{ $t('memoryMonitor.notAvailable') }}
            <br>
            <small>{{ $t('memoryMonitor.notAvailableHint') }}</small>
          </VAlert>
        </div>

        <div v-else-if="memoryData">
          <!-- Current Usage -->
          <div class="mb-4">
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-2">{{ $t('memoryMonitor.currentUsage') }}</span>
              <span class="text-body-2 font-weight-bold">{{ (memoryData.usageRatio * 100).toFixed(1) }}%</span>
            </div>
            <VProgressLinear
              :model-value="memoryData.usageRatio * 100"
              :color="statusColor"
              height="12"
              rounded
            />
            <div class="d-flex justify-space-between mt-1">
              <span class="text-caption text-disabled">{{ memoryData.used.toFixed(1) }} MB {{ $t('memoryMonitor.used') }}</span>
              <span class="text-caption text-disabled">{{ memoryData.limit.toFixed(0) }} MB {{ $t('memoryMonitor.limit') }}</span>
            </div>
          </div>

          <!-- Statistics -->
          <VCard
            v-if="stats"
            variant="tonal"
            class="mb-4"
          >
            <VCardText>
              <div class="text-subtitle-2 mb-2">
                {{ $t('memoryMonitor.statistics') }}
              </div>
              <VRow dense>
                <VCol
                  cols="6"
                  class="d-flex justify-space-between"
                >
                  <span class="text-caption text-disabled">{{ $t('memoryMonitor.minimum') }}:</span>
                  <span class="text-caption">{{ stats.min.toFixed(1) }} MB</span>
                </VCol>
                <VCol
                  cols="6"
                  class="d-flex justify-space-between"
                >
                  <span class="text-caption text-disabled">{{ $t('memoryMonitor.maximum') }}:</span>
                  <span class="text-caption">{{ stats.max.toFixed(1) }} MB</span>
                </VCol>
                <VCol
                  cols="6"
                  class="d-flex justify-space-between"
                >
                  <span class="text-caption text-disabled">{{ $t('memoryMonitor.average') }}:</span>
                  <span class="text-caption">{{ stats.avg.toFixed(1) }} MB</span>
                </VCol>
                <VCol
                  cols="6"
                  class="d-flex justify-space-between"
                >
                  <span class="text-caption text-disabled">{{ $t('memoryMonitor.samples') }}:</span>
                  <span class="text-caption">{{ stats.samples }}</span>
                </VCol>
              </VRow>
              <VDivider class="my-2" />
              <div class="d-flex justify-space-between">
                <span class="text-caption text-disabled">{{ $t('memoryMonitor.trend') }}:</span>
                <span
                  class="text-caption font-weight-bold"
                  :class="stats.trend > 0 ? 'text-warning' : 'text-success'"
                >
                  {{ stats.trend > 0 ? '+' : '' }}{{ stats.trend.toFixed(1) }} MB
                </span>
              </div>
            </VCardText>
          </VCard>

          <!-- Status Message -->
          <VAlert
            :type="alertType"
            variant="tonal"
            density="compact"
            class="mb-4"
            :icon="alertIcon"
          >
            {{ statusMessage }}
          </VAlert>

          <!-- Memory Breakdown -->
          <VExpansionPanels
            v-if="breakdown"
            class="mb-4"
          >
            <VExpansionPanel>
              <VExpansionPanelTitle>
                <VIcon
                  start
                  size="20"
                >
                  mdi-chart-pie
                </VIcon>
                {{ $t('memoryMonitor.breakdown') }}
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <div
                  v-for="(category, index) in breakdown.categories"
                  :key="index"
                  class="mb-3"
                >
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-caption">{{ $t(category.nameKey) }}</span>
                    <span class="text-caption font-weight-bold">{{ category.size.toFixed(1) }} MB ({{ category.percentage.toFixed(1) }}%)</span>
                  </div>
                  <VProgressLinear
                    :model-value="category.percentage"
                    :color="category.percentage > 50 ? 'warning' : 'primary'"
                    height="6"
                    rounded
                  />
                  <div class="text-caption text-disabled mt-1">
                    {{ $t(category.descriptionKey, { count: category.count || 0 }) }}
                  </div>
                </div>
              </VExpansionPanelText>
            </VExpansionPanel>
          </VExpansionPanels>

          <!-- Actions -->
          <div class="d-flex gap-2">
            <VBtn
              variant="flat"
              color="primary"
              size="small"
              @click="refresh"
            >
              <VIcon
                start
                size="18"
              >
                mdi-refresh
              </VIcon>
              {{ $t('memoryMonitor.refresh') }}
            </VBtn>
            <VBtn
              v-if="canForceGC"
              variant="flat"
              color="secondary"
              size="small"
              @click="forceGC"
            >
              <VIcon
                start
                size="18"
              >
                mdi-delete-sweep
              </VIcon>
              {{ $t('memoryMonitor.forceGC') }}
            </VBtn>
            <VSpacer />
            <VBtn
              variant="flat"
              color="error"
              size="small"
              @click="clearHistory"
            >
              {{ $t('memoryMonitor.clearHistory') }}
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import memoryMonitor from '@/utils/memoryMonitor'

const { t } = useI18n()

const dialog = ref(false)
const memoryData = ref(null)
const stats = ref(null)
const breakdown = ref(null)
const memoryAvailable = ref(false)

let updateInterval = null

const statusColor = computed(() => {
  if (!memoryData.value) return 'primary'
  const ratio = memoryData.value.usageRatio
  if (ratio >= 0.9) return 'error'
  if (ratio >= 0.75) return 'warning'
  
  return 'success'
})

const alertType = computed(() => {
  if (!memoryData.value) return 'info'
  const ratio = memoryData.value.usageRatio
  if (ratio >= 0.9) return 'error'
  if (ratio >= 0.75) return 'warning'
  
  return 'success'
})

const statusMessage = computed(() => {
  if (!memoryData.value) return t('memoryMonitor.loading')
  const ratio = memoryData.value.usageRatio
  if (ratio >= 0.9) return t('memoryMonitor.statusHigh')
  if (ratio >= 0.75) return t('memoryMonitor.statusWarning')
  
  return t('memoryMonitor.statusNormal')
})

const showBadge = computed(() => {
  if (!memoryData.value) return false
  
  return memoryData.value.usageRatio >= 0.75
})

const alertIcon = computed(() => {
  if (!memoryData.value) return 'mdi-information'
  const ratio = memoryData.value.usageRatio
  if (ratio >= 0.9) return 'mdi-alert-circle'
  if (ratio >= 0.75) return 'mdi-alert'
  
  return 'mdi-check-circle'
})

const canForceGC = computed(() => {
  return typeof window.gc === 'function'
})

const refresh = () => {
  memoryData.value = memoryMonitor.getSnapshot()
  stats.value = memoryMonitor.getStats()
  breakdown.value = memoryMonitor.analyzeMemoryUsage()
  memoryAvailable.value = memoryData.value !== null
}

const forceGC = () => {
  memoryMonitor.forceGC()
  setTimeout(refresh, 200)
}

const clearHistory = () => {
  memoryMonitor.clearHistory()
  refresh()
}

// Start interval when dialog opens
const startMonitoring = () => {
  if (memoryAvailable.value && !updateInterval) {
    refresh()
    updateInterval = setInterval(refresh, 5000) // Update every 5 seconds
  }
}

// Stop interval when dialog closes
const stopMonitoring = () => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
}

// Watch dialog state to start/stop monitoring
watch(dialog, isOpen => {
  if (isOpen) {
    startMonitoring()
  } else {
    stopMonitoring()
  }
})

onMounted(() => {
  memoryAvailable.value = performance.memory !== undefined
})

onBeforeUnmount(() => {
  stopMonitoring()
})
</script>
