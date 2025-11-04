<template>
  <div class="config-card-wrapper">
    <div class="config-card" :style="cardStyle">
      <!-- Most Popular Badge -->
      <div v-if="config.isPopular" class="most-popular-badge">
        {{ labels.mostPopular }}
      </div>

      <div class="config-price-badge">
        <span class="price-amount">${{ config.price.toFixed(2) }}</span><span class="price-period">{{ labels.perMonth }}</span>
      </div>
      <div class="card-header">
        <h3 class="config-name">{{ displayName }}</h3>
      </div>

      <div class="config-resources">
        <div v-if="resources.cpu" class="resource-row">
          <VIcon class="resource-icon cpu-icon">mdi-speedometer</VIcon>
          <span class="resource-label">{{ labels.cpu }}</span>
          <span class="resource-value">{{ Number(resources.cpu.toFixed(2)) }} {{ resources.cpu > 1 ? labels.cores : labels.core }}</span>
        </div>
        <div v-if="resources.ram" class="resource-row">
          <VIcon class="resource-icon ram-icon">mdi-memory</VIcon>
          <span class="resource-label">{{ labels.ram }}</span>
          <span class="resource-value">{{ Number(resources.ram.toFixed(0)) }} MB</span>
        </div>
        <div v-if="resources.hdd" class="resource-row">
          <VIcon class="resource-icon hdd-icon">mdi-harddisk</VIcon>
          <span class="resource-label">{{ labels.storage }}</span>
          <span class="resource-value">{{ Number(resources.hdd.toFixed(0)) }} GB</span>
        </div>
      </div>

      <VBtn
        block
        color="primary"
        size="default"
        variant="elevated"
        class="install-btn"
        @click="handleInstall"
      >
        <VIcon start>mdi-download</VIcon>
        {{ labels.installNow }}
      </VBtn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGameUtils } from '@/composables/useGameUtils'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  app: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['install'])

const { t } = useI18n()

const { getConfigResources, getPlayerBasedConfigName } = useGameUtils()

const resources = computed(() => getConfigResources(props.config))

const displayName = computed(() => {
  // Use player-based naming for gaming apps
  const gameName = props.app.name || props.app.displayName || ''
  return getPlayerBasedConfigName(gameName, props.config)
})

const cardStyle = computed(() => ({
  borderColor: props.config.highlight || 'rgba(255, 255, 255, 0.1)',
  borderWidth: '2px',
  borderStyle: 'solid',
}))

const handleInstall = () => {
  emit('install', { app: props.app, config: props.config })
}

const labels = computed(() => ({
  cpu: t('components.marketplace.appConfigCard.cpu'),
  ram: t('components.marketplace.appConfigCard.ram'),
  storage: t('components.marketplace.appConfigCard.storage'),
  installNow: t('components.marketplace.appConfigCard.installNow'),
  perMonth: t('components.marketplace.appConfigCard.perMonth'),
  core: t('components.marketplace.appConfigCard.core'),
  cores: t('components.marketplace.appConfigCard.cores'),
  mostPopular: t('components.marketplace.appConfigCard.mostPopular'),
}))
</script>

<style scoped>
.config-card-wrapper {
  height: 100%;
  position: relative;
}

.most-popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  color: white;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.4);
  z-index: 10;
  white-space: nowrap;
}

.config-card {
  height: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: rgba(var(--v-theme-surface), 1);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-top: 3px solid rgba(var(--v-theme-on-surface), 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: visible;
}

.config-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(33, 150, 243, 0.4), 0 0 60px rgba(33, 150, 243, 0.2);
  border-color: rgba(33, 150, 243, 0.5) !important;
  border-top: 3px solid #2196F3 !important;
  filter: drop-shadow(0 -4px 12px rgba(33, 150, 243, 0.6));
}

.config-card:hover .config-price-badge {
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.3) 0%, rgba(var(--v-theme-success), 0.2) 100%);
  border-color: rgba(var(--v-theme-success), 0.5);
}

.config-price-badge {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.2) 0%, rgba(var(--v-theme-success), 0.1) 100%);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-success), 0.3);
  transition: all 0.3s ease;
}

.card-header {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  text-align: center;
}

.config-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: visible;
  text-align: center;
}

.price-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-success));
  line-height: 1;
}

.price-period {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.7;
}

.config-resources {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 120px;
}

.resource-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.resource-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  transform: translateX(4px);
}

.resource-icon {
  font-size: 22px;
  opacity: 0.9;
}

.cpu-icon {
  color: #f97316;
}

.ram-icon {
  color: #06b6d4;
}

.hdd-icon {
  color: #eab308;
}

.resource-label {
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgb(var(--v-theme-on-surface));
}

.resource-value {
  font-size: 0.95rem;
  font-weight: 600;
  text-align: right;
  color: rgb(var(--v-theme-on-surface));
}

.install-btn {
  margin-top: auto;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  font-size: 1rem;
  height: 40px !important;
  min-height: 40px !important;
  max-height: 40px !important;
  padding: 0 16px !important;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.install-btn :deep(.v-btn__content) {
  height: 40px !important;
}

.install-btn :deep(.v-btn__overlay) {
  height: 40px !important;
}

.install-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.install-btn:hover {
  box-shadow: 0 8px 24px rgba(33, 150, 243, 0.5), 0 0 40px rgba(33, 150, 243, 0.3);
  transform: translateY(-2px);
}

.install-btn:hover::before {
  width: 300px;
  height: 300px;
}

.install-btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .config-card {
    height: 400px;
  }

  .price-amount {
    font-size: 2rem;
  }

  .price-period {
    font-size: 0.875rem;
  }

  .config-price-badge {
    padding: 14px;
  }
}

@media (max-width: 600px) {
  .config-card {
    height: 380px;
  }

  .price-amount {
    font-size: 1.75rem;
  }

  .price-period {
    font-size: 0.8rem;
  }

  .config-price-badge {
    padding: 12px;
    gap: 4px;
  }

  .config-name {
    font-size: 1.1rem;
  }
}
</style>
