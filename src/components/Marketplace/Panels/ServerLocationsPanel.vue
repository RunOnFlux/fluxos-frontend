<template>
  <div class="server-locations-panel" :style="panelStyle">
    <VCard class="locations-card" elevation="0">
      <VCardText>
        <h2 v-if="titleText" class="locations-title">{{ titleText }}</h2>
        <p v-if="subtitleText" class="locations-subtitle">{{ subtitleText }}</p>

        <!-- Map Component -->
        <div class="map-container">
          <VOverlay
            v-model="isLoading"
            contained
            scroll-strategy="none"
            class="align-center justify-center"
          >
            <VProgressCircular indeterminate color="primary" />
          </VOverlay>

          <MapComponent
            v-if="fluxList.length > 0"
            :nodes="fluxList"
            :show-tier-display="false"
            class="server-map"
          />

          <div v-if="!isLoading && fluxList.length === 0" class="no-data">
            {{ t('components.marketplace.panels.serverLocationsPanel.noData') }}
          </div>
        </div>

        <!-- Stats -->
        <div v-if="fluxNodeCount > 0" class="stats-container">
          <div class="stat-item">
            <VIcon icon="mdi-server-network" size="32" color="primary" />
            <div class="stat-content">
              <div class="stat-value">{{ fluxNodeCount.toLocaleString() }}+</div>
              <div class="stat-label">{{ t('components.marketplace.panels.serverLocationsPanel.activeServers') }}</div>
            </div>
          </div>
          <div class="stat-item">
            <VIcon icon="mdi-earth" size="32" color="primary" />
            <div class="stat-content">
              <div class="stat-value">{{ countryCount }}+</div>
              <div class="stat-label">{{ t('components.marketplace.panels.serverLocationsPanel.countries') }}</div>
            </div>
          </div>
          <div class="stat-item">
            <VIcon icon="mdi-web" size="32" color="primary" />
            <div class="stat-content">
              <div class="stat-value">{{ t('components.marketplace.panels.serverLocationsPanel.global') }}</div>
              <div class="stat-label">{{ t('components.marketplace.panels.serverLocationsPanel.coverage') }}</div>
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import MapComponent from '@core/components/MapComponent.vue'
import DashboardService from '@/services/DashboardService'

const props = defineProps({
  panel: {
    type: Object,
    required: true,
  },
  app: {
    type: Object,
    required: true,
  },
})

const { t, te } = useI18n()

const fluxList = ref([])
const fluxNodeCount = ref(0)
const isLoading = ref(true)

// Helper function to check if a string is an i18n key
const isI18nKey = str => {
  return str && typeof str === 'string' && str.startsWith('i18n:')
}

// Get translated or raw title
const titleText = computed(() => {
  if (!props.panel.title) return ''

  if (isI18nKey(props.panel.title)) {
    const key = props.panel.title.replace('i18n:', '')
    
    return te(key) ? t(key) : props.panel.title
  }

  return props.panel.title
})

// Get translated or raw subtitle
const subtitleText = computed(() => {
  if (!props.panel.subtitle) return ''

  if (isI18nKey(props.panel.subtitle)) {
    const key = props.panel.subtitle.replace('i18n:', '')
    
    return te(key) ? t(key) : props.panel.subtitle
  }

  return props.panel.subtitle
})

// Count unique countries
const countryCount = computed(() => {
  const countries = new Set()
  fluxList.value.forEach(flux => {
    if (flux.geolocation?.country) {
      countries.add(flux.geolocation.country)
    }
  })
  
  return countries.size
})

const panelStyle = computed(() => ({
  padding: props.panel.padding
    ? `${props.panel.padding.top}px ${props.panel.padding.right}px ${props.panel.padding.bottom}px ${props.panel.padding.left}px`
    : '8px 24px',
  background: props.panel.background || 'transparent',
  borderRadius: props.panel.cornerRadius ? `${props.panel.cornerRadius}px` : '0',
  marginBottom: '15px',
}))

const getFluxList = async () => {
  try {
    const resLoc = await axios.get(
      'https://stats.runonflux.io/fluxinfo?projection=geolocation,ip,tier',
    )

    fluxList.value = resLoc.data.data || []

    const resList = await DashboardService.fluxnodeCount()
    fluxNodeCount.value = resList.data.data.total || 0
  } catch (error) {
    console.error('Error fetching flux list:', error)
    fluxList.value = []
    fluxNodeCount.value = 0
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    await getFluxList()
  } catch (error) {
    console.error('Error loading server locations:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.server-locations-panel {
  margin-bottom: 8px;
}

.locations-card {
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.6);
  backdrop-filter: blur(10px);
}

.locations-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
  color: rgb(var(--v-theme-primary));
}

.locations-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 32px;
  opacity: 0.9;
  line-height: 1.6;
}

.map-container {
  position: relative;
  min-height: 400px;
  margin-bottom: 32px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--v-theme-surface), 0.4);
}

.server-map {
  border-radius: 12px;
}

.no-data {
  text-align: center;
  font-size: 18px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  padding: 60px 20px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.2);
  transform: translateY(-2px);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .locations-title {
    font-size: 1.75rem;
  }

  .locations-subtitle {
    font-size: 1rem;
  }

  .stats-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 600px) {
  .server-locations-panel {
    padding: 8px 16px !important;
  }

  .locations-title {
    font-size: 1.5rem;
  }

  .locations-subtitle {
    font-size: 0.9375rem;
    margin-bottom: 24px;
  }

  .map-container {
    min-height: 300px;
  }

  .stat-item {
    padding: 16px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }
}
</style>
