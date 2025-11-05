<template>
  <div class="groups-panel" :style="panelStyle">
    <!-- Only show panel title when NOT using groups (groups have their own titles) -->
    <h2 v-if="panel.title && (!app.groups || !app.groups.length)" class="panel-title">{{ panel.title }}</h2>

    <div v-if="!app.groups || !app.groups.length" class="single-group">
      <!-- No groups defined - show all configs in single grid -->
      <div class="configs-grid">
        <AppConfigCard
          v-for="(config, index) in app.configs"
          :key="config.id"
          :config="getConfigWithPopular(config, index, app.configs.length)"
          :app="app"
          @install="handleInstall"
        />
      </div>
    </div>

    <div v-else class="groups-container">
      <!-- Render each group with its configs -->
      <AppGroupCard
        v-for="group in normalizedGroups"
        :key="group.title"
        :group="group"
        :configs="getConfigsByGroup(group.title)"
        :app="app"
        @install="handleInstall"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGameUtils } from '@/composables/useGameUtils'
import AppConfigCard from '../AppConfigCard.vue'
import AppGroupCard from '../AppGroupCard.vue'

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

const emit = defineEmits(['install'])

const { t } = useI18n()
const gameUtils = useGameUtils()

// Normalize group titles and deduplicate
const normalizedGroups = computed(() => {
  if (!props.app.groups) return []

  const seen = new Map()
  props.app.groups.forEach(group => {
    const normalized = group.title?.replace(/-+$/, '') || '' // Remove trailing dashes
    if (!seen.has(normalized)) {
      seen.set(normalized, {
        ...group,
        title: normalized,
        originalTitle: group.title,
      })
    }
  })
  
  return Array.from(seen.values())
})

// Create a wrapper that matches configs by normalized group titles
const getConfigsByGroup = groupTitle => {
  if (!props.app.configs) return []

  // Match configs whose group (with trailing dashes removed) equals the group title
  return props.app.configs.filter(config => {
    const normalizedConfigGroup = config.group?.replace(/-+$/, '') || ''
    
    return normalizedConfigGroup === groupTitle
  })
}

const panelStyle = computed(() => {
  const style = {
    padding: props.panel.padding ?
      `${props.panel.padding.top}px ${props.panel.padding.right}px ${props.panel.padding.bottom}px ${props.panel.padding.left}px`
      : '8px 24px',
  }
  console.log('🎨 GroupsPanel style:', style, 'Panel config:', props.panel)
  
  return style
})

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
.groups-panel {
  margin-bottom: 8px;
}

.panel-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 24px;
  margin-top: 0;
}

.single-group {
  width: 100%;
}

.configs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
  justify-content: center;
}

.groups-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .configs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
