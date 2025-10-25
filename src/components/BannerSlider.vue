<template>
  <div class="banner-slider-container mb-6">
    <div class="carousel-wrapper">
      <div
        v-for="(banner, index) in banners"
        :key="index"
        class="carousel-slide" :class="[{ active: currentSlide === index, prev: prevSlide === index }]"
      >
        <div
          class="puzzle-grid"
          :style="{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`
          }"
        >
          <div
            v-for="i in puzzlePieces"
            :key="i"
            class="puzzle-piece"
            :style="getPuzzleStyle(i, banner.image)"
          />
        </div>
      </div>

      <div class="carousel-controls">
        <button class="carousel-arrow carousel-arrow-prev" @click="prevSlideAction">
          <VIcon>mdi-chevron-left</VIcon>
        </button>
        <button class="carousel-arrow carousel-arrow-next" @click="nextSlideAction">
          <VIcon>mdi-chevron-right</VIcon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const currentSlide = ref(0)
const prevSlide = ref(null)
const forceUpdate = ref(0)
let autoPlayInterval = null
let resizeTimeout = null

// Compute puzzle pieces based on screen size with more granular breakpoints
const puzzlePieces = computed(() => {
  forceUpdate.value // trigger reactivity
  const width = window.innerWidth

  // Progressive grid size based on screen width
  if (width <= 480) return 25      // 5x5 for small mobile
  if (width <= 768) return 36      // 6x6 for mobile/tablet portrait
  if (width <= 1024) return 49     // 7x7 for tablet landscape
  if (width <= 1440) return 64     // 8x8 for desktop
  
  return 81                        // 9x9 for large/ultra-wide screens
})

const gridSize = computed(() => {
  forceUpdate.value // trigger reactivity
  const width = window.innerWidth

  if (width <= 480) return 5
  if (width <= 768) return 6
  if (width <= 1024) return 7
  if (width <= 1440) return 8
  
  return 9
})

// Dynamically load all banners from public/banner directory
const banners = ref([])

const loadBanners = () => {
  const bannerFiles = [
    'FluxCloud.png',
    'FluxAI.png',
    'FluxDrive.png',
    'FluxEdge.png',
    'FluxMarketplace.png',
    'WordPressonFluxCloud.png',
  ]

  banners.value = bannerFiles.map(file => ({
    image: `/banner/${file}`,
  }))
}

const getPuzzleStyle = (index, imageUrl) => {
  const cols = gridSize.value
  const rows = gridSize.value
  const pieceIndex = index - 1
  const row = Math.floor(pieceIndex / cols)
  const col = pieceIndex % cols

  // For a puzzle grid, each piece needs to show exactly its portion of the image
  // If we have N columns, each piece is 1/N wide
  // The background position for piece at column C should be at C/(N-1) * 100%
  // This ensures first piece is at 0% and last piece is at 100%
  const xPercent = cols > 1 ? (col / (cols - 1)) * 100 : 0
  const yPercent = rows > 1 ? (row / (rows - 1)) * 100 : 0

  // Calculate background-size based on grid size
  // For an NxN grid, background needs to be N*100% in each direction
  const backgroundSizePercent = `${cols * 100}% ${rows * 100}%`

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundPosition: `${xPercent}% ${yPercent}%`,
    backgroundSize: backgroundSizePercent,
    transitionDelay: `${Math.random() * 0.6}s`,
  }
}

const nextSlideAction = () => {
  prevSlide.value = currentSlide.value
  currentSlide.value = (currentSlide.value + 1) % banners.value.length
  setTimeout(() => {
    prevSlide.value = null
  }, 1200)
}

const prevSlideAction = () => {
  prevSlide.value = currentSlide.value
  currentSlide.value = currentSlide.value === 0 ? banners.value.length - 1 : currentSlide.value - 1
  setTimeout(() => {
    prevSlide.value = null
  }, 1200)
}

const startAutoPlay = () => {
  autoPlayInterval = setInterval(() => {
    nextSlideAction()
  }, 6000)
}

const handleResize = () => {
  // Clear existing timeout
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }

  // Debounce resize to avoid too many recalculations
  resizeTimeout = setTimeout(() => {
    forceUpdate.value++
  }, 200)
}

onMounted(() => {
  loadBanners()
  startAutoPlay()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval)
  }
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.banner-slider-container {
  overflow: hidden;
  border-radius: clamp(8px, 1.5vw, 16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
  position: relative;
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
  /* Viewport-based width constraint - fluid but limited */
  width: min(100%, 1800px);
  margin-left: auto;
  margin-right: auto;
}

.banner-slider-container:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18);
}

.carousel-wrapper {
  position: relative;
  width: 100%;
  /* Use aspect-ratio for natural responsive scaling */
  aspect-ratio: 16 / 9;
  /* Constrain to available viewport height (accounting for navbar, footer, etc.) */
  /* Using calc to reserve space: 100vh - navbar (~64px) - footer (~60px) - margins (~40px) */
  max-height: min(70vh, calc(100vh - 164px));
  min-height: 250px;
  overflow: hidden;
  border-radius: clamp(8px, 1.5vw, 16px);
}

.carousel-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
}

.carousel-slide.active {
  opacity: 1;
  z-index: 2;
  pointer-events: auto;
}

.carousel-slide.prev {
  opacity: 1;
  z-index: 1;
}

.puzzle-grid {
  display: grid;
  /* Dynamic grid columns - will be overridden by media queries */
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: 100%;
  height: 100%;
}

.puzzle-piece {
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  /* background-size is set dynamically via inline style */
  opacity: 0;
  transform: scale(0.8) rotate(45deg);
  transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-slide.active .puzzle-piece {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

.carousel-slide.prev .puzzle-piece {
  opacity: 0;
  transform: scale(1.2) rotate(-45deg);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Carousel Controls */
.carousel-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 clamp(12px, 2vw, 20px);
  z-index: 10;
  pointer-events: none;
}

.carousel-arrow {
  /* Fluid button size */
  width: clamp(40px, 5vw, 56px);
  height: clamp(40px, 5vw, 56px);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  opacity: 0.6;
  pointer-events: auto;
}

.carousel-arrow:hover {
  background: rgba(255, 255, 255, 0.35);
  opacity: 1;
  transform: scale(1.15);
}

.carousel-arrow :deep(.v-icon) {
  font-size: clamp(24px, 3vw, 32px);
}

/* Responsive breakpoints - Mobile First Approach */

/* Extra small devices (phones, less than 480px) */
@media (max-width: 479.98px) {
  .carousel-wrapper {
    aspect-ratio: 16 / 10; /* Slightly taller on small phones */
  }

  .carousel-controls {
    display: none; /* Hide arrows on very small screens */
  }
}

/* Landscape orientation on small screens */
@media (max-height: 500px) and (orientation: landscape) {
  .carousel-wrapper {
    min-height: 200px;
  }

  .carousel-arrow {
    width: 36px;
    height: 36px;
  }

  .carousel-arrow :deep(.v-icon) {
    font-size: 20px;
  }
}

/* High resolution displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .carousel-wrapper,
  .banner-slider-container {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}
</style>
