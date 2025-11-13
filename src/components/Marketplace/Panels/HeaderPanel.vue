<template>
  <div class="header-panel" :style="panelStyle">
    <VCarousel
      v-if="carouselImages.length"
      cycle
      hide-delimiters
      show-arrows="hover"
      height="400"
      class="game-carousel"
    >
      <VCarouselItem
        v-for="(image, index) in carouselImages"
        :key="index"
        :src="image"
        :alt="`${app.displayName || app.name} server gameplay screenshot ${index + 1}`"
        cover
      >
        <!-- Game Icon Overlay -->
        <div v-if="gameIcon" class="game-icon-overlay">
          <VImg
            :src="gameIcon"
            :alt="`${app.displayName || app.name} game icon`"
            width="120"
            height="120"
            contain
            class="icon-image"
          />
        </div>
      </VCarouselItem>
    </VCarousel>

    <!-- Fallback if no images -->
    <div v-else class="header-content-fallback">
      <h1 class="game-title">
        {{ t('components.marketplace.panels.headerPanel.serverHosting', { name: app.uiName || app.displayName || app.name }) }}
      </h1>
      <p v-if="app.detailHeaderText" class="header-description">
        {{ app.detailHeaderText }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGameUtils } from '@/composables/useGameUtils'

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

const { t } = useI18n()
const { parseLandingImage } = useGameUtils()

// Get game icon
const gameIcon = computed(() => {
  return parseLandingImage(props.app.icon || props.app.logo)
})

// Get carousel images from screenshots (same source as ScreenshotsPanel)
const carouselImages = computed(() => {
  const images = []

  // Get screenshots directly from app.screenshots (same as ScreenshotsPanel)
  if (props.app.screenshots && props.app.screenshots.length) {
    props.app.screenshots.forEach(screenshot => {
      const img = parseLandingImage(screenshot)
      if (img) images.push(img)
    })
  }

  // Fallback to detail header image
  if (images.length === 0 && props.app.detailHeaderImage) {
    const img = parseLandingImage(props.app.detailHeaderImage)
    if (img) images.push(img)
  }

  // Fallback to landing image
  if (images.length === 0 && props.app.landingImage) {
    const img = parseLandingImage(props.app.landingImage)
    if (img) images.push(img)
  }

  return images
})

const panelStyle = computed(() => ({
  padding: props.panel.padding
    ? `${props.panel.padding.top}px ${props.panel.padding.right}px ${props.panel.padding.bottom}px ${props.panel.padding.left}px`
    : '0',
  background: props.panel.background || 'transparent',
  borderRadius: props.panel.cornerRadius ? `${props.panel.cornerRadius}px` : '0',
  marginBottom: '15px',
}))
</script>

<style scoped>
.header-panel {
  margin-bottom: 8px;
  margin-top: 48px;
}

.game-carousel {
  border-radius: 16px;
  overflow: hidden;
}

.game-icon-overlay {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.icon-image {
  display: block;
  border-radius: 8px;
}

/* Fallback styling */
.header-content-fallback {
  padding: 48px 32px;
  text-align: center;
}

.game-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 24px;
  line-height: 1.2;
}

.header-description {
  font-size: 1.25rem;
  opacity: 0.9;
  line-height: 1.6;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .game-carousel {
    height: 300px !important;
  }

  .game-icon-overlay {
    top: 16px;
    left: 16px;
    padding: 10px;
  }

  .icon-image {
    width: 100px !important;
    height: 100px !important;
  }

  .game-title {
    font-size: 2.5rem;
  }

  .header-description {
    font-size: 1.1rem;
  }
}

@media (max-width: 600px) {
  .game-carousel {
    height: 250px !important;
  }

  .game-icon-overlay {
    top: 12px;
    left: 12px;
    padding: 8px;
  }

  .icon-image {
    width: 70px !important;
    height: 70px !important;
  }

  .game-title {
    font-size: 2rem;
  }

  .header-description {
    font-size: 1rem;
  }
}
</style>
