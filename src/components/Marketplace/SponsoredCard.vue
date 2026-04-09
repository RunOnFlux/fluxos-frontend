<template>
  <VCard class="sponsored-card" elevation="3">
    <VCardText class="card-content">
      <div v-if="isInitialLoad" class="loading-container">
        <div class="modern-loader">
          <div class="loader-ring"></div>
          <div class="loader-ring"></div>
          <div class="loader-ring"></div>
        </div>
      </div>

      <div v-else-if="!displayApps.length" class="empty-container">
        <VIcon size="80" color="grey-lighten-1">mdi-star-outline</VIcon>
        <p class="text-h6 mt-3 font-weight-medium">{{ labels.noSponsoredApps }}</p>
      </div>

      <div v-else class="carousel-wrapper">
        <VWindow
          v-model="currentSlide"
          class="sponsored-window"
          eager
          :touch="false"
        >
          <VWindowItem
            v-for="(slideApps, slideIndex) in appSlides"
            :key="slideIndex"
          >
            <div class="sponsored-grid" :style="{ gridTemplateColumns: `repeat(${itemsPerSlide}, 1fr)` }">
              <VCard
                v-for="(app, index) in slideApps"
                :key="app.uuid || app.name"
                class="sponsored-app"
                variant="outlined"
              >
                <div class="sponsored-badge">
                  <div :style="badgeStyle">
                    <VIcon size="12" class="star-icon" :style="starStyle">mdi-star</VIcon>
                    {{ labels.sponsored }}
                  </div>
                </div>

                <div class="app-body">
                  <div class="app-content">
                    <div class="icon-section">
                      <AppIcon :app="app" :size="48" sponsored :star-index="index" />
                    </div>
                    <div class="app-info">
                      <h3 class="app-name">{{ cleanAppName(app) }}</h3>

                      <!-- Stats row -->
                      <div class="app-stats">
                        <!-- Install count -->
                        <div v-if="app.installCount" class="stat-item">
                          <VIcon icon="mdi-download" size="13" color="grey-darken-1" />
                          <span class="stat-value">{{ formatInstallCount(app.installCount) }}</span>
                        </div>

                        <!-- Price -->
                        <VChip
                          :color="app.price > 0 ? 'success' : 'primary'"
                          size="x-small"
                          variant="tonal"
                          class="price-chip"
                        >
                          {{ app.price > 0 ? `$${app.price}` : labels.free }}
                        </VChip>
                      </div>
                    </div>
                  </div>
                  <div class="sponsored-action">
                    <VBtn
                      color="primary"
                      variant="flat"
                      size="x-small"
                      rounded="pill"
                      class="sponsored-view-btn"
                      @click.stop="navigateToApp(app)"
                    >
                      <VIcon start size="13">mdi-eye</VIcon>
                      {{ labels.viewDetails }}
                    </VBtn>
                  </div>
                </div>
              </VCard>
            </div>
          </VWindowItem>
        </VWindow>
      </div>
    </VCardText>
  </VCard>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/Marketplace/AppIcon.vue'
import { useMarketplaceUtils } from '@/composables/useMarketplaceUtils'

const props = defineProps({
  apps: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  mobile: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

const router = useRouter()
const { width } = useDisplay()
const { formatNumber } = useMarketplaceUtils()

const labels = computed(() => ({
  sponsored: t('components.marketplace.sponsoredCard.sponsored'),
  noSponsoredApps: t('components.marketplace.sponsoredCard.noSponsoredApps'),
  viewDetails: t('components.marketplace.sponsoredCard.viewDetails'),
  free: t('components.marketplace.sponsoredCard.free'),
}))

// Badge styling - inline to ensure it overrides everything
const badgeStyle = computed(() => ({
  background: 'rgb(var(--v-theme-primary))',
  color: '#ffffff',
  fontWeight: '600',
}))

const starStyle = computed(() => ({
  color: '#FFD700 !important',
}))

// Auto-sliding carousel state
const currentSlide = ref(0)
const autoSlideTimer = ref(null)

const isInitialLoad = ref(true)

// Watch for when apps arrive or loading stops to disable initial loading
watch([() => props.apps, () => props.loading], ([newApps, isLoading]) => {
  if (isLoading) {
    // Show loading spinner when loading is true (handles refresh too)
    isInitialLoad.value = true
  } else if (!isLoading) {
    // Only hide loading when loading is complete (regardless of data)
    isInitialLoad.value = false
  }
}, { immediate: true })
const displayApps = computed(() => {
  return [...props.apps]
    .filter(app => app.visible !== false && app.enabled !== false)
})

// Dynamic items per slide based on minimum card width
const itemsPerSlide = computed(() => {
  const minCardWidth3 = 280 // Minimum for 3 items
  const minCardWidth2 = 200 // Minimum for 2 items (allow 2 on mobile)
  const minCardWidth1 = 180 // Minimum for 1 item
  const gapSize = 12 // Gap between cards
  const containerPadding = 32 // Left + right padding

  // Calculate available width accounting for padding
  const availableWidth = width.value - containerPadding

  // Test 3 items first
  const totalGapWidth3 = 2 * gapSize // 2 gaps for 3 items
  const availableForCards3 = availableWidth - totalGapWidth3
  const cardWidth3 = availableForCards3 / 3

  if (cardWidth3 >= minCardWidth3) {
    return 3
  }

  // Test 2 items
  const totalGapWidth2 = 1 * gapSize // 1 gap for 2 items
  const availableForCards2 = availableWidth - totalGapWidth2
  const cardWidth2 = availableForCards2 / 2

  if (cardWidth2 >= minCardWidth2) {
    return 2
  }

  // Fallback to 1 item
  return 1
})

// Create slides based on FluxCloud logic
const appSlides = computed(() => {
  if (displayApps.value.length === 0) return []

  const totalApps = displayApps.value.length
  const itemsCount = itemsPerSlide.value

  // If all apps fit in one slide, return single slide
  if (totalApps <= itemsCount) {
    return [displayApps.value]
  }

  // Create infinite sliding by repeating apps
  const slides = []
  for (let i = 0; i < totalApps; i++) {
    const slideApps = []
    for (let j = 0; j < itemsCount; j++) {
      const appIndex = (i + j) % totalApps
      slideApps.push(displayApps.value[appIndex])
    }
    slides.push(slideApps)
  }

  return slides
})

const truncateText = (text, length) => {
  if (!text) return 'Discover amazing decentralized applications on Flux'
  
  return text.length > length ? text.substring(0, length) + '...' : text
}

const formatCount = count => {
  if (!count || count === 0) return '0'
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  
  return count.toString()
}

const navigateToApp = app => {
  if (app.redirectUrl) {
    window.open(app.redirectUrl, '_blank', 'noopener,noreferrer')

    return
  }

  router.push(`/marketplace/${app.uuid || app.name}`)
}

// Parse and clean app name (remove hardware and network info)
const cleanAppName = app => {
  const fullName = app.displayName || app.name || ''
  let cleanName = fullName

  // Remove hardware in brackets/parentheses
  cleanName = cleanName.replace(/[\[(]([^)\]]*(?:cpu|ram|gb|mb|vcpu|core)[^)\]]*)[\])]/gi, '').trim()

  // Remove inline hardware specs
  cleanName = cleanName.replace(/\b(\d+(?:\.\d+)?\s*(?:GB|MB|CPU|vCPU|Cores?|GHz)(?:\s+RAM)?)\b/gi, '').trim()

  // Remove network types
  cleanName = cleanName.replace(/\b(Testnet|Mainnet|Test)\b/gi, '').trim()

  // Clean up double spaces
  cleanName = cleanName.replace(/\s+/g, ' ').trim()

  return cleanName
}

// Format install count for display
const formatInstallCount = count => {
  if (!count) return '0'
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K'
  }

  return count.toString()
}

// FluxCloud auto-sliding functionality
const startAutoSlide = () => {
  // Clear existing timer first
  stopAutoSlide()

  // Only auto-slide if there are more apps than can fit on one slide
  if (appSlides.value.length <= 1) return

  autoSlideTimer.value = setInterval(() => {
    const totalSlides = appSlides.value.length
    if (totalSlides > 1) {
      currentSlide.value = (currentSlide.value + 1) % totalSlides
    }
  }, 5000) // FluxCloud uses 5 seconds
}

const stopAutoSlide = () => {
  if (autoSlideTimer.value) {
    clearInterval(autoSlideTimer.value)
    autoSlideTimer.value = null
  }
}

// Watch for data changes to restart slider
watch([displayApps, itemsPerSlide], () => {
  // Reset current slide to 0 when layout changes to prevent out-of-bounds
  currentSlide.value = 0

  // Restart auto-slide when data or layout changes
  setTimeout(startAutoSlide, 500)
}, { immediate: false })

// Start auto-sliding when component mounts
onMounted(() => {
  // Delay start to allow data to load
  setTimeout(startAutoSlide, 2000)
})

onUnmounted(() => {
  stopAutoSlide()
})
</script>

<style scoped>
.sponsored-card {
  border-radius: 12px;
  height: 163px;
  min-height: 163px;
  max-height: 163px;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.card-title {
  padding: 12px 16px 6px 16px;
  font-size: 1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.carousel-dots {
  display: flex;
  gap: 4px;
}

.card-content {
  padding: 14px 16px 12px 16px;
  flex: 1;
  overflow: visible;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 100px;
}

.modern-loader {
  position: relative;
  width: 50px;
  height: 50px;
}

.loader-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid rgba(59, 130, 246, 0.1);
  border-top: 3px solid #3B82F6;
  border-radius: 50%;
  animation: modern-spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}

.loader-ring:nth-child(2) {
  animation-delay: 0.2s;
  border-top-color: #60A5FA;
  border-color: rgba(96, 165, 250, 0.1);
  transform: scale(0.8);
}

.loader-ring:nth-child(3) {
  animation-delay: 0.4s;
  border-top-color: #93C5FD;
  border-color: rgba(147, 197, 253, 0.1);
  transform: scale(0.6);
}

@keyframes modern-spin {
  0% {
    transform: rotate(0deg) scale(var(--scale, 1));
  }
  50% {
    transform: rotate(180deg) scale(calc(var(--scale, 1) * 1.1));
  }
  100% {
    transform: rotate(360deg) scale(var(--scale, 1));
  }
}

.carousel-wrapper {
  position: relative;
  flex: 1;
  height: 100%;
  overflow-x: clip;
  overflow-y: visible;
  width: 100%;
}

.sponsored-window {
  border-radius: 8px;
  height: 100%;
  overflow-x: clip;
  overflow-y: visible;
}

.sponsored-window .v-window__container {
  transition: transform 750ms cubic-bezier(0.4, 0.0, 0.2, 1) !important;
}

.sponsored-window .v-window-item {
  transition: all 750ms cubic-bezier(0.4, 0.0, 0.2, 1) !important;
  display: flex;
  align-items: center;
  height: 100%;
}

.sponsored-grid {
  display: grid !important;
  gap: 12px;
  padding: 12px 8px 12px 8px;
  width: 100%;
  box-sizing: border-box;
  justify-content: center;
  justify-items: center;
  align-items: center;
  place-items: center;
  overflow-y: visible;
  /* grid-template-columns set by JavaScript inline style */
}

/* Ensure no CSS media queries override the JavaScript grid columns */
@media (max-width: 600px) {
  .sponsored-grid {
    /* Let JavaScript control columns even on mobile */
  }
}

.sponsored-app {
  position: relative;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
  height: 115px;
  min-height: 115px;
  max-height: 115px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.sponsored-app:hover {
  transform: translateY(-3px);
  border-color: #bdbdbd;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.sponsored-app:hover .sponsored-badge > div {
  transform: scale(1.02);
  box-shadow: 0 3px 10px rgba(var(--v-theme-primary), 0.4);
}

.sponsored-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  z-index: 2;
}

/* Light theme - Blue background with white text - Enhanced visibility */
.sponsored-badge > div {
  background: rgb(var(--v-theme-primary));
  color: #ffffff;
  border: 2px solid rgba(var(--v-theme-primary), 1);
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 3px 12px rgba(var(--v-theme-primary), 0.5),
              0 1px 4px rgba(0, 0, 0, 0.15);
  line-height: 1.3;
  height: 20px;
}

/* Star icon styling - Light theme */
.sponsored-badge .star-icon {
  color: #FFD700;
}

/* Dark theme adjustments */
.v-theme--dark .sponsored-badge > div {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  color: #e0e0e0;
  border-color: #e0e0e0;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
}

.v-theme--dark .sponsored-badge .star-icon {
  color: #FFD700;
}

.v-theme--dark .sponsored-app:hover .sponsored-badge > div {
  border-color: #bdbdbd;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.6),
              inset 0 1px 0 rgba(255, 255, 255, 0.7);
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.9);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
}

.app-body {
  padding: 8px; /* FluxCloud padding */
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.app-content {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
  gap: 8px;
  flex: 1;
}

.sponsored-action {
  padding: 2px 8px 0 8px;
  display: flex;
  justify-content: center;
}

.sponsored-view-btn {
  height: 22px !important;
  min-width: 100px !important;
  font-size: 0.65rem !important;
  font-weight: 600 !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  padding: 0 12px !important;
}

.sponsored-view-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(var(--v-theme-primary), 0.3);
}

.icon-section {
  width: 48px;
  flex-shrink: 0;
}

.app-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
}

.app-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  max-width: 100%;
}

.app-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.stat-value {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.price-chip {
  height: 20px !important;
  font-size: 0.7rem !important;
  font-weight: 600 !important;
}

.spacer {
  width: 16px;
  flex-shrink: 0;
}


/* Compact mode adjustments */
@media (max-width: 600px) {
  .card-title {
    padding: 12px 16px 6px 16px;
    font-size: 1rem;
  }

  .card-content {
    padding: 6px 16px 16px 16px;
  }

  .sponsored-grid {
    padding: 16px 8px 18px 8px !important;
  }

  .sponsored-app {
    height: 120px;
  }

  .app-body {
    padding: 10px;
  }

  .app-content {
    justify-content: flex-start;
  }

  .app-info {
    align-items: flex-start;
    text-align: left;
  }

  .app-name {
    font-size: 0.8rem;
  }

  .app-desc {
    -webkit-line-clamp: 1;
  }

  .sponsored-action {
    justify-content: center;
    padding-right: 0;
  }

  .nav-btn {
    display: none;
  }
}
</style>
