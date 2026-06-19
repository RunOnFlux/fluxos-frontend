<template>
  <div class="landing-page">
    <!--
      SEO/GEO hero: single semantic <h1> with intent keywords. Static i18n
      content so it is captured by the prerender snapshot and visible to
      crawlers that do not execute JavaScript. 
    -->
    <header class="landing-hero">
      <h1 class="hero-heading">{{ t('landingServices.heroTitle') }}</h1>
      <p class="hero-subheading">{{ t('landingServices.heroSubtitle') }}</p>
    </header>

    <!-- Features Grid Section -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">{{ t('landingServices.title') }}</h2>
        <div class="features-grid">
          <div
            v-for="(banner, index) in allBanners"
            :key="index"
            class="feature-card"
            :class="{ 'card-visible': showCards }"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="feature-image-wrapper">
              <img
                :src="banner.image"
                :alt="banner.name"
                class="feature-image"
                loading="lazy"
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
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const showCards = ref(false)

onMounted(() => {
  // Check if the initial loader is still present
  const loader = document.getElementById('loading-bg')

  if (loader) {
    // Initial page load - loader is present
    // Wait for the loader to start fading out (2000ms from app-ready event)
    // Then trigger animation slightly before loader fade
    setTimeout(() => {
      showCards.value = true
    }, 1800)
  } else {
    // Navigation - loader already removed
    // Trigger animation immediately with small delay
    requestAnimationFrame(() => {
      setTimeout(() => {
        showCards.value = true
      }, 150)
    })
  }
})

// All available services
const allBanners = computed(() => [
  { file: 'FluxCloud.webp', key: 'fluxCloud' },
  { file: 'FluxAI.webp', key: 'fluxAI' },
  { file: 'FluxDrive.webp', key: 'fluxDrive' },
  { file: 'FluxEdge.webp', key: 'fluxEdge' },
  { file: 'FluxMarketplace.webp', key: 'fluxMarketplace' },
  { file: 'WordPressonFluxCloud.webp', key: 'wordPressOnFlux' },
].map(item => ({
  image: `/banner/${item.file}`,
  key: item.key,
  name: t(`landingServices.services.${item.key}.name`),
})))

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
</script>

<style scoped>
/* Landing Page Container */
.landing-page {
  width: 100%;
  overflow-x: hidden;
  margin-top: -0.5rem;
}

/* SEO/GEO hero */
.landing-hero {
  text-align: center;
  padding: 1.5rem 1rem 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.hero-heading {
  font-size: clamp(1.9rem, 4.5vw, 2.75rem);
  font-weight: 800;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-background));
  margin-bottom: 0.75rem;
}

.hero-subheading {
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.6;
  color: rgba(var(--v-theme-on-background), 0.75);
  margin: 0 auto;
  max-width: 720px;
  text-wrap: balance;
}

/* Features Section */
.features-section {
  padding: 0;
  background: rgb(var(--v-theme-background));
}

.container {
  width: 100%;
  margin: 0 auto;
  padding: 0;
}

.section-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  text-align: center;
  margin-bottom: 0.5rem;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-background));
  position: relative;
}

.section-title::after {
  content: '';
  display: block;
  width: 150px;
  height: 4px;
  background: rgb(var(--v-theme-on-background));
  margin: 0.5rem auto 0;
  border-radius: 10px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  perspective: 1500px;
}

.feature-card {
  background: rgb(var(--v-theme-surface));
  border-radius: clamp(16px, 3vw, 32px);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  opacity: 0;
}

.feature-card.card-visible {
  animation: fadeInUp 0.6s ease-out forwards;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06);
  border: 2px solid rgb(var(--v-theme-primary));
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
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
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
    padding: 0;
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
