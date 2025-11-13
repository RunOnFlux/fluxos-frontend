<template>
  <div class="screenshots-panel" :style="panelStyle">
    <div v-if="screenshots.length" class="screenshots-container">
      <div class="screenshots-slider">
        <div
          class="screenshots-track"
          :style="{ transform: `translateX(-${currentSlide * slidePercentage}%)` }"
        >
          <div
            v-for="(screenshot, index) in infiniteScreenshots"
            :key="index"
            class="screenshot-item"
          >
            <VImg
              :src="screenshot"
              :alt="`${app.displayName || app.name} server screenshot ${(index % screenshots.length) + 1}`"
              height="200"
              cover
              class="screenshot-image"
            />
          </div>
        </div>
      </div>
      <div class="slider-controls">
        <VBtn
          icon="mdi-chevron-left"
          variant="text"
          size="small"
          @click="prevSlide"
        />
        <div class="slider-dots">
          <span
            v-for="(_, index) in screenshots.length"
            :key="index"
            class="dot"
            :class="{ active: currentSlide % screenshots.length === index }"
            @click="currentSlide = index"
          />
        </div>
        <VBtn
          icon="mdi-chevron-right"
          variant="text"
          size="small"
          @click="nextSlide"
        />
      </div>
    </div>

    <div v-else class="no-screenshots">
      <VIcon size="64" color="grey">mdi-image-off-outline</VIcon>
      <p>{{ t('components.marketplace.panels.screenshotsPanel.noScreenshots') }}</p>
    </div>

    <!-- Fullscreen Dialog -->
    <VDialog
      v-model="fullscreenImage"
      max-width="90vw"
    >
      <VCard>
        <VImg
          :src="selectedImage"
          :alt="`${app.displayName || app.name} server screenshot fullscreen`"
          contain
          max-height="90vh"
        />
        <VBtn
          icon="mdi-close"
          position="absolute"
          style="top: 16px; right: 16px; z-index: 10;"
          @click="fullscreenImage = false"
        />
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
const { shuffleArray, parseLandingImage } = useGameUtils()

const currentSlide = ref(0)
const fullscreenImage = ref(false)
const selectedImage = ref('')
const isMobile = ref(false)
let autoSlideInterval = null

// Check if mobile screen
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 600
}

// Slide percentage based on screen size
const slidePercentage = computed(() => isMobile.value ? 100 : 50)

const screenshots = computed(() => {
  if (!props.app.screenshots || !props.app.screenshots.length) return []

  // Shuffle screenshots and parse asset:// URLs
  const shuffled = shuffleArray(props.app.screenshots)
  const parsed = shuffled.map(screenshot => parseLandingImage(screenshot))
  console.log('📸 Screenshots loaded:', parsed.length, parsed)
  
  return parsed
})

// Duplicate screenshots for infinite loop effect
const infiniteScreenshots = computed(() => {
  if (screenshots.value.length === 0) return []

  // Duplicate the screenshots to create seamless loop
  return [...screenshots.value, ...screenshots.value]
})

const panelStyle = computed(() => ({
  padding: props.panel.padding ?
    `${props.panel.padding.top}px ${props.panel.padding.right}px ${props.panel.padding.bottom}px ${props.panel.padding.left}px`
    : '24px',
}))

const prevSlide = () => {
  currentSlide.value--

  // When going back before the start, jump to the end of original set
  if (currentSlide.value < 0) {
    setTimeout(() => {
      const track = document.querySelector('.screenshots-track')
      if (track) {
        track.style.transition = 'none'
        currentSlide.value = screenshots.value.length - 1
        track.offsetHeight // Force reflow
        setTimeout(() => {
          track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }, 50)
      }
    }, 500)
  }
}

const nextSlide = () => {
  currentSlide.value++

  // When we reach the duplicated section, reset to start without animation
  if (currentSlide.value >= screenshots.value.length) {
    setTimeout(() => {
      const track = document.querySelector('.screenshots-track')
      if (track) {
        track.style.transition = 'none'
        currentSlide.value = 0
        track.offsetHeight // Force reflow
        setTimeout(() => {
          track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }, 50)
      }
    }, 500)
  }
}

const startAutoSlide = () => {
  autoSlideInterval = setInterval(() => {
    currentSlide.value++

    // When we reach the duplicated section, reset to start without animation
    if (currentSlide.value >= screenshots.value.length) {
      setTimeout(() => {
        const track = document.querySelector('.screenshots-track')
        if (track) {
          track.style.transition = 'none'
          currentSlide.value = 0
          track.offsetHeight // Force reflow
          setTimeout(() => {
            track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }, 50)
        }
      }, 500) // Wait for slide animation to complete
    }
  }, 4000) // Auto-slide every 4 seconds
}

const stopAutoSlide = () => {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval)
    autoSlideInterval = null
  }
}

const openFullscreen = image => {
  selectedImage.value = image
  fullscreenImage.value = true
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  if (screenshots.value.length > 1) {
    startAutoSlide()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  stopAutoSlide()
})
</script>

<style scoped>
.screenshots-panel {
  margin-bottom: 0;
}

.panel-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 24px;
}

.screenshots-container {
  width: 100%;
}

.screenshots-slider {
  overflow: hidden;
  border-radius: 16px;
  margin-bottom: 16px;
}

.screenshots-track {
  display: flex;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.screenshot-item {
  min-width: 50%;
  flex-shrink: 0;
  padding: 0 8px;
}

.screenshot-image {
  border-radius: 12px;
  overflow: hidden;
}

.slider-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.slider-dots {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot:hover {
  background: rgba(255, 255, 255, 0.5);
}

.dot.active {
  width: 24px;
  border-radius: 4px;
  background: rgb(var(--v-theme-primary));
}

.no-screenshots {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .screenshot-item {
    min-width: 100%;
  }
}
</style>
