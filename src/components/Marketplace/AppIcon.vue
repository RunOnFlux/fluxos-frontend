<template>
  <div class="app-icon-wrapper" :style="wrapperStyle">
    <!-- Base64 image -->
    <VImg
      v-if="isBase64Image"
      :src="parsedIcon"
      :alt="`${app.displayName || app.name} icon`"
      :width="size"
      :height="size"
      :aspect-ratio="1"
      contain
      class="app-icon-image"
    >
      <template #error>
        <div class="fallback-icon" :style="fallbackIconStyle">
          <VIcon
            :size="sponsored ? size * 0.85 : size * 0.6"
            :color="sponsored ? starColor : 'white'"
          >
            {{ sponsored ? 'mdi-star-outline' : 'mdi-apps' }}
          </VIcon>
        </div>
      </template>
    </VImg>

    <!-- Network image -->
    <VImg
      v-else-if="isNetworkImage"
      :src="proxyImageUrl"
      :alt="`${app.displayName || app.name} icon`"
      :width="size"
      :height="size"
      :aspect-ratio="1"
      contain
      class="app-icon-image"
    >
      <template #placeholder>
        <div class="icon-loading">
          <VProgressCircular
            indeterminate
            :size="size / 3"
            :width="2"
            color="primary"
          />
        </div>
      </template>
      <template #error>
        <div class="fallback-icon" :style="fallbackIconStyle">
          <VIcon
            :size="sponsored ? size * 0.85 : size * 0.6"
            :color="sponsored ? starColor : 'white'"
          >
            {{ sponsored ? 'mdi-star-outline' : 'mdi-apps' }}
          </VIcon>
        </div>
      </template>
    </VImg>

    <!-- SVG icon -->
    <VIcon
      v-else-if="isSvgIcon"
      :size="size"
      :color="iconColor"
    >
      {{ parsedIcon }}
    </VIcon>

    <!-- Material Design Icon -->
    <VIcon
      v-else-if="isMdiIcon"
      :size="size"
      :color="iconColor"
    >
      {{ parsedIcon || 'mdi-application' }}
    </VIcon>

    <!-- Fallback with grey background and icon -->
    <div
      v-else
      class="fallback-icon"
      :style="fallbackIconStyle"
    >
      <VIcon
        :size="sponsored ? size * 0.85 : size * 0.6"
        :color="sponsored ? starColor : 'white'"
      >
        {{ sponsored ? 'mdi-star-outline' : 'mdi-apps' }}
      </VIcon>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameUtils } from '@/composables/useGameUtils'

const props = defineProps({
  app: {
    type: Object,
    required: true,
  },
  size: {
    type: Number,
    default: 48,
  },
  sponsored: {
    type: Boolean,
    default: false,
  },
  starIndex: {
    type: Number,
    default: 0,
  },
})

const { parseLandingImage } = useGameUtils()

// Parse icon URL to handle asset:// protocol
const parsedIcon = computed(() => parseLandingImage(props.app.icon))

// Determine icon type
const isBase64Image = computed(() => {
  return parsedIcon.value?.startsWith('data:image/')
})

const isNetworkImage = computed(() => {
  return parsedIcon.value?.startsWith('http://') ||
         parsedIcon.value?.startsWith('https://') ||
         parsedIcon.value?.startsWith('//')
})

const isSvgIcon = computed(() => {
  return parsedIcon.value?.endsWith('.svg')
})

const isMdiIcon = computed(() => {
  return parsedIcon.value?.startsWith('mdi-')
})

// Proxy HTTP images through HTTPS
const proxyImageUrl = computed(() => {
  if (!isNetworkImage.value) return parsedIcon.value || ''

  let url = parsedIcon.value

  // Handle protocol-relative URLs
  if (url.startsWith('//')) {
    url = 'https:' + url
  }

  // Proxy HTTP images through a secure proxy if needed
  if (url.startsWith('http://')) {
    // In production, you'd use a proper proxy service
    // For now, we'll try to use HTTPS instead
    url = url.replace('http://', 'https://')
  }

  return url
})

// Generate app initials for fallback
const appInitials = computed(() => {
  const name = props.app.displayName || props.app.name || 'App'
  const words = name.split(/\s+/)
  
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  
  return name.substring(0, 2).toUpperCase()
})

// Generate a consistent color for the app
const appColor = computed(() => {
  const name = props.app.displayName || props.app.name || ''
  const colors = [
    '#F44336', // Red
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#03A9F4', // Light Blue
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#4CAF50', // Green
    '#8BC34A', // Light Green
    '#FF9800', // Orange
    '#FF5722', // Deep Orange
    '#795548', // Brown
    '#607D8B', // Blue Grey
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
})

// Icon color for MDI icons
const iconColor = computed(() => {
  return props.app.iconColor || 'primary'
})

// Star colors for sponsored apps
const starColors = ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#20B2AA']
const starColor = computed(() => {
  if (!props.sponsored) return 'white'
  
  return starColors[props.starIndex % starColors.length]
})

// Wrapper styles
const wrapperStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: '12px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent', // Transparent background
}))

// Fallback icon styles (grey background)
const fallbackIconStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#9e9e9e', // Grey background
  borderRadius: '12px',
  userSelect: 'none',
}))
</script>

<style scoped>
.app-icon-wrapper {
  position: relative;
  flex-shrink: 0;
  background: transparent; /* Transparent background */
}

.app-icon-image {
  border-radius: 12px;
  background: transparent; /* Transparent image background */
}

.icon-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

.icon-fallback {
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--app-color, #2196F3) 0%, var(--app-color-dark, #1976D2) 100%);
}
</style>