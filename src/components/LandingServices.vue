<template>
  <div class="landing-page">
    <!-- Hero Section with Auto-Rotating Banners -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-banner">
          <div class="puzzle-container">
            <div
              v-for="(piece, index) in puzzlePieces"
              :key="`${currentIndex}-${index}`"
              class="puzzle-piece"
              :style="getPuzzlePieceStyle(piece, index)"
            ></div>
          </div>
        </div>

        <!-- Progress Indicators -->
        <div class="banner-indicators">
          <span
            v-for="(banner, index) in allBanners"
            :key="index"
            class="indicator"
            :class="{ active: index === currentIndex }"
            @click="goToSlide(index)"
          ></span>
        </div>
      </div>
    </section>

    <!-- Features Grid Section -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">{{ t('landingServices.title') }}</h2>
        <div class="features-grid">
          <div
            v-for="(banner, index) in allBanners"
            :key="index"
            class="feature-card"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="feature-image-wrapper">
              <img
                :src="banner.image"
                :alt="banner.name"
                class="feature-image"
              />
            </div>
            <div class="feature-content">
              <div class="feature-header">
                <VIcon class="feature-icon" size="x-large">
                  {{ getIcon(banner) }}
                </VIcon>
                <VChip
                  class="feature-chip"
                  color="success"
                  variant="tonal"
                  size="small"
                  rounded="pill"
                >
                  {{ getChipLabel(banner) }}
                </VChip>
              </div>
              <div class="feature-body">
                <h3 class="feature-title">{{ banner.name }}</h3>
                <p class="feature-description">{{ getDescription(banner) }}</p>
              </div>
              <div class="feature-footer">
                <VChip
                  class="explore-chip"
                  variant="tonal"
                  size="small"
                  rounded="pill"
                  @click="exploreBanner(banner)"
                >
                  <span>{{ t('landingServices.explore') }}</span>
                  <VIcon size="x-small" class="explore-arrow">mdi-arrow-right</VIcon>
                </VChip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// All available banners
const allBanners = computed(() => [
  { file: 'FluxCloud.png', key: 'fluxCloud' },
  { file: 'FluxAI.png', key: 'fluxAI' },
  { file: 'FluxDrive.png', key: 'fluxDrive' },
  { file: 'FluxEdge.png', key: 'fluxEdge' },
  { file: 'FluxMarketplace.png', key: 'fluxMarketplace' },
  { file: 'WordPressonFluxCloud.png', key: 'wordPressOnFlux' },
].map(item => ({
  image: `/banner/${item.file}`,
  key: item.key,
  name: t(`landingServices.services.${item.key}.name`),
})))

const currentIndex = ref(0)
let rotationInterval = null

// Current banner for hero section
const currentBanner = computed(() => allBanners.value[currentIndex.value])

// Puzzle grid configuration
const gridSize = 4 // 4x4 grid = 16 pieces
const puzzlePieces = ref([])

// Initialize puzzle pieces
const initializePuzzle = () => {
  puzzlePieces.value = []
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      puzzlePieces.value.push({
        row,
        col,
      })
    }
  }
}

// Get style for each puzzle piece
const getPuzzlePieceStyle = (piece, index) => {
  const delay = index * 0.03 // Staggered animation

  // Calculate exact background position for this piece
  const xPercent = piece.col === 0 ? 0 : (piece.col / (gridSize - 1)) * 100
  const yPercent = piece.row === 0 ? 0 : (piece.row / (gridSize - 1)) * 100

  return {
    gridRow: piece.row + 1,
    gridColumn: piece.col + 1,
    animationDelay: `${delay}s`,
    backgroundImage: `url(${currentBanner.value.image})`,
    backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
    backgroundPosition: `${xPercent}% ${yPercent}%`,
    backgroundRepeat: 'no-repeat',
    filter: 'brightness(0.9)',
  }
}

// Get description based on service key
const getDescription = banner => {
  return t(`landingServices.services.${banner.key}.description`)
}

// Get icon based on service key
const getIcon = banner => {
  const icons = {
    fluxCloud: 'mdi-cloud',
    fluxAI: 'mdi-brain',
    fluxDrive: 'mdi-harddisk',
    fluxEdge: 'mdi-network',
    fluxMarketplace: 'mdi-store',
    wordPressOnFlux: 'mdi-wordpress',
  }
  
  return icons[banner.key] || 'mdi-application'
}

// Get chip label based on service key
const getChipLabel = banner => {
  return t(`landingServices.services.${banner.key}.category`)
}

const rotateBanners = () => {
  currentIndex.value = (currentIndex.value + 1) % allBanners.value.length
}

const goToSlide = index => {
  currentIndex.value = index
  resetAutoRotation()
}

const exploreBanner = banner => {
  // Map each service to its correct route or external page (verified from project structure)
  const routes = {
    fluxCloud: '/apps/register',
    fluxAI: 'https://ai.runonflux.com/',
    fluxDrive: '/flux-drive',
    fluxEdge: 'https://runonflux.com/fluxedge/',
    fluxMarketplace: '/marketplace',
    wordPressOnFlux: '/marketplace/wordpress',
  }

  const url = routes[banner.key]
  if (url) {
    // Check if it's an external URL
    if (url.startsWith('http')) {
      window.open(url, '_blank')
    } else {
      // Internal route navigation using Vue Router (no page reload)
      router.push(url)
    }
  }
}

const startAutoRotation = () => {
  rotationInterval = setInterval(() => {
    rotateBanners()
  }, 6000) // Rotate every 6 seconds
}

const resetAutoRotation = () => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
  }
  startAutoRotation()
}

onMounted(() => {
  initializePuzzle()
  startAutoRotation()
})

onUnmounted(() => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
  }
})
</script>

<style scoped>
/* Landing Page Container */
.landing-page {
  width: 100%;
  overflow-x: hidden;
  margin-top: -0.5rem;
}

/* Hero Section */
.hero-section {
  position: relative;
  width: 100%;
  min-height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: 0;
}

.hero-content {
  position: relative;
  width: 100%;
  max-width: 1600px;
  height: auto;
  background: transparent;
}

.hero-banner {
  position: relative;
  width: 100%;
  height: auto;
  display: block;
  border-radius: clamp(16px, 3vw, 32px);
  overflow: hidden;
  background: transparent;
}

.puzzle-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  width: 100%;
  aspect-ratio: 16 / 9;
  gap: 0;
  outline: 1px solid transparent;
}

.puzzle-piece {
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.95);
  animation: puzzleFadeIn 0.6s ease-out forwards;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  will-change: transform, opacity;
  margin: -0.5px;
}

@keyframes puzzleFadeIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}


/* Banner Indicators */
.banner-indicators {
  position: absolute;
  bottom: clamp(1rem, 3vh, 1.5rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  z-index: 10;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.indicator:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: scale(1.2);
}

.indicator.active {
  background: white;
  width: 40px;
  border-radius: 6px;
}

/* Features Section */
.features-section {
  padding: 1.5rem 2rem 1rem 2rem;
  background: rgb(var(--v-theme-background));
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.section-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  text-align: center;
  margin-bottom: 2.5rem;
  color: rgb(var(--v-theme-on-background));
  position: relative;
}

.section-title::after {
  content: '';
  display: block;
  width: 100px;
  height: 5px;
  background: rgb(var(--v-theme-primary));
  margin: 1.5rem auto 0;
  border-radius: 10px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
  margin-top: 0.5rem;
  perspective: 1500px;
}

.feature-card {
  background: rgb(var(--v-theme-surface));
  border-radius: clamp(16px, 3vw, 32px);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.4s ease;
  animation: fadeInUp 0.6s ease-out forwards;
  border: 2px solid rgba(128, 128, 128, 0.3);
  display: flex;
  flex-direction: column;
  transform: translateY(0) scale(1);
}

.feature-card:hover {
  transform: translateY(-12px) scale(1.03);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  border: 2px solid #3b82f6;
}

.feature-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  padding: 0;
}

.feature-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.4s ease;
}

.feature-card:hover .feature-image {
  transform: scale(1.05);
}

.feature-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.feature-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.feature-icon {
  opacity: 0.6;
  color: rgb(var(--v-theme-on-surface));
}

.feature-chip {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.feature-body {
  flex: 1;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: rgb(var(--v-theme-on-surface));
}

.feature-description {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 1.5rem;
}

.feature-footer {
  margin-top: auto;
}

.explore-chip {
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.explore-chip:hover {
  gap: 0.75rem;
}

.explore-arrow {
  transition: transform 0.3s ease;
  font-size: 14px !important;
  margin-left: 0.25rem;
}

.explore-chip:hover .explore-arrow {
  transform: translateX(4px);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade Transition for Hero Banner */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .features-section {
    padding: 1.5rem 1.5rem 2rem 1.5rem;
  }

  .banner-indicators {
    gap: 0.7rem;
  }

  .indicator {
    width: 10px;
    height: 10px;
  }

  .indicator.active {
    width: 30px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* High Resolution Displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .hero-image,
  .feature-image {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}
</style>
