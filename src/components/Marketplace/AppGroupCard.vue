<template>
  <div class="group-card" :style="groupStyle">
    <div v-if="backgroundImage" class="group-background">
      <VImg :src="backgroundImage" cover />
    </div>

    <div class="group-content">
      <h2 v-if="group.title" class="group-title" :style="{ color: group.color }">
        {{ group.title }}
      </h2>
      <p v-if="group.description" class="group-description">
        {{ group.description }}
      </p>

      <div class="configs-grid">
        <AppConfigCard
          v-for="(config, index) in configs"
          :key="config.id"
          :config="getConfigWithPopular(config, index, configs.length)"
          :app="app"
          @install="handleInstall"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameUtils } from '@/composables/useGameUtils'
import AppConfigCard from './AppConfigCard.vue'

const props = defineProps({
  group: {
    type: Object,
    required: true,
  },
  configs: {
    type: Array,
    required: true,
  },
  app: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['install'])

const { parseLandingImage } = useGameUtils()

const backgroundImage = computed(() => parseLandingImage(props.group.backgroundImage))

const groupStyle = computed(() => ({
  backgroundColor: props.group.backgroundColor || 'transparent',
  borderRadius: '16px',
  padding: '12px 32px 32px 32px',
  position: 'relative',
  overflow: 'hidden',
}))

// 🎯 CONFIGURE "MOST POPULAR" BADGE HERE
// Change this number to mark a different config as popular:
// - 0 = first config (cheapest)
// - Math.floor(total / 2) = middle config (recommended)
// - total - 1 = last config (most expensive)
const POPULAR_CONFIG_INDEX = total => Math.floor(total / 2) // Middle option

const getConfigWithPopular = (config, index, totalConfigs) => {
  return {
    ...config,
    isPopular: index === POPULAR_CONFIG_INDEX(totalConfigs),
  }
}

const handleInstall = data => {
  emit('install', data)
}
</script>

<style scoped>
.group-card {
  margin-bottom: 24px;
}

.group-background {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  z-index: 0;
  width: 100%;
  height: 100%;
}

.group-background :deep(.v-img) {
  width: 100%;
  height: 100%;
}

.group-background :deep(.v-img__img) {
  width: 100%;
  height: 100%;
}

.group-content {
  position: relative;
  z-index: 1;
}

.group-title {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 12px;
}

.group-description {
  text-align: center;
  margin-bottom: 24px;
  font-size: 1.1rem;
  opacity: 0.9;
}

.configs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .group-card {
    padding: 20px;
  }

  .group-title {
    font-size: 1.5rem;
    margin-bottom: 14px;
  }

  .configs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
