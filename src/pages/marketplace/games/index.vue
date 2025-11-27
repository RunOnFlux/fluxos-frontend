<template>
  <div class="games-container">
    <div class="games-layout">
      <!-- Loading State -->
      <div v-if="loading" style="margin-top: 100px;">
        <LoadingSpinner
          icon="mdi-gamepad-variant"
          :icon-size="56"
          :title="t('pages.marketplace.games.index.loading')"
        />
      </div>

      <!-- Maintenance State -->
      <MaintenanceCard
        v-else-if="!games.length"
        :title="t('pages.marketplace.games.index.maintenanceTitle')"
        :subtitle="t('pages.marketplace.games.index.maintenanceSubtitle')"
        :loading="loading"
        margin-top="100px"
        @retry="fetchGames"
      />

      <!-- Main Content -->
      <template v-else>
        <!-- Hero Section with Background -->
        <HeroSection
          :title="t('pages.marketplace.games.index.hero.title')"
          background-image="/banner/FluxPlay.webp"
          overlay-color="rgba(0, 0, 0, 0.4)"
          min-height="300px"
        />

        <!-- Games Grid Section -->
        <div id="games-grid" class="games-grid-section">
          <h2 class="games-section-title">{{ t('pages.marketplace.games.index.gamesTitle') }}</h2>
          <p class="games-section-subtitle">{{ t('pages.marketplace.games.index.gamesSubtitle') }}</p>

          <div class="games-grid">
            <GameCard
              v-for="game in games"
              :key="game.uuid || game.name"
              :game="game"
            />
          </div>
        </div>

        <!-- SEO Content Section -->
        <VCard class="section-card seo-content-section">
          <VCardText>
            <h2 class="content-title">{{ t('pages.marketplace.games.index.content.title') }}</h2>
            <p class="content-intro">{{ t('pages.marketplace.games.index.content.intro') }}</p>

            <div class="content-features">
              <div class="content-feature">
                <div class="content-feature-icon">
                  <VIcon icon="mdi-server-network" size="32" color="primary" />
                </div>
                <div class="content-feature-text">
                  <h3 class="content-feature-title">{{ t('pages.marketplace.games.index.content.features.decentralized.title') }}</h3>
                  <p class="content-feature-desc">{{ t('pages.marketplace.games.index.content.features.decentralized.description') }}</p>
                </div>
              </div>

              <div class="content-feature">
                <div class="content-feature-icon">
                  <VIcon icon="mdi-shield-check" size="32" color="success" />
                </div>
                <div class="content-feature-text">
                  <h3 class="content-feature-title">{{ t('pages.marketplace.games.index.content.features.security.title') }}</h3>
                  <p class="content-feature-desc">{{ t('pages.marketplace.games.index.content.features.security.description') }}</p>
                </div>
              </div>

              <div class="content-feature">
                <div class="content-feature-icon">
                  <VIcon icon="mdi-rocket-launch" size="32" color="info" />
                </div>
                <div class="content-feature-text">
                  <h3 class="content-feature-title">{{ t('pages.marketplace.games.index.content.features.deployment.title') }}</h3>
                  <p class="content-feature-desc">{{ t('pages.marketplace.games.index.content.features.deployment.description') }}</p>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Global Server Network Section -->
        <ServerLocationsPanel
          :panel="serverLocationsPanel"
          :app="{ name: 'gaming' }"
        />

        <!-- Feature Highlights Section -->
        <FeatureShowcase
          :title="t('pages.marketplace.games.index.features.title')"
          :items="translatedFeatures"
          grid-min-width="300px"
        />

        <!-- Why FluxPlay Comparison Section -->
        <VCard class="section-card comparison-section">
          <VCardText>
            <h2 class="comparison-title">{{ t('pages.marketplace.games.index.comparison.title') }}</h2>
            <div class="comparison-table">
              <div class="comparison-header">
                <div class="comparison-feature-header">{{ t('pages.marketplace.games.index.comparison.feature') }}</div>
                <div class="comparison-column-header fluxplay-header">
                  <VIcon icon="mdi-crown" size="24" class="crown-icon" />
                  {{ t('pages.marketplace.games.index.comparison.fluxplay') }}
                </div>
                <div class="comparison-column-header">{{ t('pages.marketplace.games.index.comparison.traditional') }}</div>
              </div>

              <div
                v-for="(row, index) in comparisonRows"
                :key="index"
                class="comparison-row"
              >
                <div class="comparison-feature">{{ t(row.feature) }}</div>
                <div class="comparison-value fluxplay-value">
                  <VIcon v-if="row.fluxplay === true" icon="mdi-check-circle" color="success" size="24" />
                  <span v-else>{{ row.fluxplay.includes('countries') ? row.fluxplay : t(row.fluxplay) }}</span>
                </div>
                <div class="comparison-value">
                  <VIcon v-if="row.traditional === false" icon="mdi-close-circle" color="error" size="24" />
                  <VIcon v-else-if="row.traditional === true" icon="mdi-check-circle" color="success" size="24" />
                  <span v-else>{{ t(row.traditional) }}</span>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- FAQ Section -->
        <FAQPanel :panel="faqPanel" :app="{ name: 'gaming' }" :faqs="faqs" :title="t('pages.marketplace.games.index.faq.title')" />

        <!-- Trustpilot Section -->
        <TrustpilotPanel :star-size="32" show-rating-label use-live-data />

        <!-- CTA Section -->
        <CtaSection
          :title="t('pages.marketplace.games.index.cta.title')"
          :subtitle="t('pages.marketplace.games.index.cta.subtitle')"
          :button-text="t('pages.marketplace.games.index.cta.button')"
          card-color="primary"
          card-variant="flat"
          icon="mdi-rocket-launch-outline"
          icon-color="white"
          button-color="white"
          button-icon="mdi-arrow-right"
          button-icon-position="end"
          @button-click="scrollToGames"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSEO, generateOrganizationSchema, generateBreadcrumbSchema, generateFAQSchema, generateArticleSchema } from '@/composables/useSEO'
import { useFluxStore } from '@/stores/flux'
import { useMarketplace } from '@/composables/useMarketplace'
import { useGameUtils } from '@/composables/useGameUtils'
import { useAnalytics } from '@/plugins/analytics/composables/useAnalytics'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import MaintenanceCard from '@/components/Marketplace/MaintenanceCard.vue'
import GameCard from '@/components/Marketplace/GameCard.vue'
import ServerLocationsPanel from '@/components/Marketplace/Panels/ServerLocationsPanel.vue'
import TrustpilotPanel from '@/components/Marketplace/Panels/TrustpilotPanel.vue'
import FAQPanel from '@/components/Marketplace/Panels/FAQPanel.vue'
import FeatureShowcase from '@/components/FeatureShowcase.vue'
import HeroSection from '@/components/HeroSection.vue'
import CtaSection from '@/components/CtaSection.vue'

const { t } = useI18n()
const analytics = useAnalytics()

const { games, loading, fetchGames } = useMarketplace()
const { getMinimumPrice } = useGameUtils()

// Server location data
const fluxList = ref([])
const isLoadingLocations = ref(true)

// Count unique countries from flux nodes
const countryCount = computed(() => {
  const countries = new Set()
  fluxList.value.forEach(flux => {
    if (flux.geolocation?.country) {
      countries.add(flux.geolocation.country)
    }
  })
  
  return countries.size
})

// Server Locations Panel Configuration
const serverLocationsPanel = {
  enabled: true,
  title: 'i18n:pages.marketplace.games.index.serverLocations.title',
  subtitle: 'i18n:pages.marketplace.games.index.serverLocations.subtitle',
}

// FAQ Panel Configuration
const faqPanel = {
  enabled: true,
  title: '',
  subtitle: '',
  questions: [],
}

// Calculate minimum price across all games
const minimumGamePrice = computed(() => {
  if (!games.value || games.value.length === 0) return '10'

  const prices = games.value
    .map(game => parseFloat(getMinimumPrice(game)))
    .filter(price => !isNaN(price) && price > 0)

  if (prices.length === 0) return '10'

  const minPrice = Math.min(...prices)

  // Format to 2 decimal places and remove trailing zeros
  return minPrice.toFixed(2).replace(/\.00$/, '')
})

// Features Data
const features = [
  {
    icon: 'mdi-rocket-launch',
    color: 'primary',
    title: 'pages.marketplace.games.index.features.items.instant.title',
    description: 'pages.marketplace.games.index.features.items.instant.description',
  },
  {
    icon: 'mdi-shield-check',
    color: 'success',
    title: 'pages.marketplace.games.index.features.items.ddos.title',
    description: 'pages.marketplace.games.index.features.items.ddos.description',
  },
  {
    icon: 'mdi-map-marker-radius',
    color: 'info',
    title: 'pages.marketplace.games.index.features.items.global.title',
    description: 'pages.marketplace.games.index.features.items.global.description',
  },
  {
    icon: 'mdi-clock-fast',
    color: 'warning',
    title: 'pages.marketplace.games.index.features.items.monitoring.title',
    description: 'pages.marketplace.games.index.features.items.monitoring.description',
  },
  {
    icon: 'mdi-currency-usd',
    color: 'success',
    title: 'pages.marketplace.games.index.features.items.paygo.title',
    description: 'pages.marketplace.games.index.features.items.paygo.description',
  },
  {
    icon: 'mdi-cube-outline',
    color: 'secondary',
    title: 'pages.marketplace.games.index.features.items.blockchain.title',
    description: 'pages.marketplace.games.index.features.items.blockchain.description',
  },
  {
    icon: 'mdi-shield-check-outline',
    color: 'success',
    title: 'pages.marketplace.games.index.features.items.uptime.title',
    description: 'pages.marketplace.games.index.features.items.uptime.description',
  },
  {
    icon: 'mdi-cash-refund',
    color: 'primary',
    title: 'pages.marketplace.games.index.features.items.moneyback.title',
    description: 'pages.marketplace.games.index.features.items.moneyback.description',
  },
]

// Translated features for FeatureShowcase component
const translatedFeatures = computed(() => features.map(feature => ({
  icon: feature.icon,
  color: feature.color,
  title: t(feature.title),
  description: t(feature.description),
})))

// Comparison Data - computed to include dynamic country count
const comparisonRows = computed(() => [
  {
    feature: 'pages.marketplace.games.index.comparison.rows.setup',
    fluxplay: 'pages.marketplace.games.index.comparison.values.instant',
    traditional: 'pages.marketplace.games.index.comparison.values.hours',
  },
  {
    feature: 'pages.marketplace.games.index.comparison.rows.pricing',
    fluxplay: 'pages.marketplace.games.index.comparison.values.transparent',
    traditional: 'pages.marketplace.games.index.comparison.values.hidden',
  },
  {
    feature: 'pages.marketplace.games.index.comparison.rows.ddos',
    fluxplay: true,
    traditional: 'pages.marketplace.games.index.comparison.values.extra',
  },
  {
    feature: 'pages.marketplace.games.index.comparison.rows.decentralized',
    fluxplay: true,
    traditional: false,
  },
  {
    feature: 'pages.marketplace.games.index.comparison.rows.locations',
    fluxplay: countryCount.value > 0 ? `${countryCount.value}+ countries` : 'pages.marketplace.games.index.comparison.values.countries',
    traditional: 'pages.marketplace.games.index.comparison.values.limited',
  },
  {
    feature: 'pages.marketplace.games.index.comparison.rows.scaling',
    fluxplay: 'pages.marketplace.games.index.comparison.values.instant',
    traditional: 'pages.marketplace.games.index.comparison.values.slow',
  },
])

// FAQ Data with computed answers
const faqs = computed(() => {
  const pricingAnswer = t('pages.marketplace.games.index.faq.items.pricing.answer')
  const replacedAnswer = pricingAnswer.replace(/__MIN_PRICE__/g, minimumGamePrice.value)

  return [
    {
      question: t('pages.marketplace.games.index.faq.items.what.question'),
      answer: t('pages.marketplace.games.index.faq.items.what.answer'),
    },
    {
      question: t('pages.marketplace.games.index.faq.items.different.question'),
      answer: t('pages.marketplace.games.index.faq.items.different.answer'),
    },
    {
      question: t('pages.marketplace.games.index.faq.items.games.question'),
      answer: t('pages.marketplace.games.index.faq.items.games.answer'),
    },
    {
      question: t('pages.marketplace.games.index.faq.items.deploy.question'),
      answer: t('pages.marketplace.games.index.faq.items.deploy.answer'),
    },
    {
      question: t('pages.marketplace.games.index.faq.items.ddosProtection.question'),
      answer: t('pages.marketplace.games.index.faq.items.ddosProtection.answer'),
    },
    {
      question: t('pages.marketplace.games.index.faq.items.pricing.question'),
      answer: replacedAnswer,
    },
    {
      question: t('pages.marketplace.games.index.faq.items.support.question'),
      answer: t('pages.marketplace.games.index.faq.items.support.answer'),
    },
    {
      question: t('pages.marketplace.games.index.faq.items.blockchain.question'),
      answer: t('pages.marketplace.games.index.faq.items.blockchain.answer'),
    },
  ]
})

// Scroll to games function
function scrollToGames() {
  const element = document.getElementById('games-grid')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Fetch server location data from Pinia store (no API call needed)
const fetchFluxLocations = async () => {
  try {
    isLoadingLocations.value = true

    // Get data from Pinia store (already fetched in App.vue)
    const fluxStore = useFluxStore()
    const { serverLocations } = fluxStore

    // Wait for store to populate if needed
    if (serverLocations.fluxList.length === 0 && !serverLocations.lastFetched) {
      await new Promise(resolve => {
        const unwatch = watch(
          () => serverLocations.fluxList.length,
          length => {
            if (length > 0) {
              unwatch()
              resolve()
            }
          },
          { immediate: true },
        )
        setTimeout(() => {
          unwatch()
          resolve()
        }, 5000)
      })
    }

    // Use data from store
    fluxList.value = serverLocations.fluxList
    console.log(`✅ Loaded ${fluxList.value.length} flux nodes from store across ${countryCount.value} countries`)
  } catch (error) {
    console.error('Error loading flux locations from store:', error)
    fluxList.value = []
  } finally {
    isLoadingLocations.value = false
  }
}

// SEO meta tags and structured data
const pageUrl = 'https://cloud.runonflux.com/marketplace/games'
const title = 'Game Server Hosting - FluxPlay on FluxCloud'
const description = 'Host Minecraft, Palworld, Factorio, Satisfactory & Enshrouded servers on FluxCloud. Global servers, instant deployment, DDoS protection. Flexible plans.'
const imageUrl = 'https://cloud.runonflux.com/images/games/FluxPlay_white.svg'

// Article timestamps for SEO (static dates for this landing page)
const datePublished = '2024-02-01T00:00:00Z' // Initial launch date
const dateModified = '2025-01-20T00:00:00Z'  // Last significant update

// FluxPlay Organization schema (custom for this page)
const fluxPlayOrganizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'FluxPlay',
  'url': 'https://cloud.runonflux.com',
  'logo': imageUrl,
  'description': 'Decentralized game server hosting on FluxCloud',
}

// Reactive structured data that updates when games load
const structuredDataSchemas = computed(() => {
  // FAQ schema with HTML tags stripped
  const faqSchema = generateFAQSchema(faqs.value.map(faq => ({
    question: faq.question,
    answer: faq.answer.replace(/<[^>]*>/g, ''), // Strip HTML tags for schema
  })))

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://cloud.runonflux.com' },
    { name: 'Games', url: pageUrl },
  ])

  // Article schema with timestamps
  const articleSchema = generateArticleSchema({
    headline: title,
    description,
    url: pageUrl,
    image: imageUrl,
    datePublished,
    dateModified,
  })

  if (!games.value || games.value.length === 0) {
    // Return only Organization, Breadcrumb, Article, and FAQ when games haven't loaded yet
    return [fluxPlayOrganizationSchema, breadcrumbSchema, articleSchema, faqSchema]
  }

  // When games are loaded, include ItemList
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': games.value.map((game, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Product',
        'name': `${game.displayName || game.name} Server Hosting`,
        'url': `https://cloud.runonflux.com/marketplace/games/${game.name.toLowerCase()}`,
        'image': game.icon || game.logo || imageUrl,
        'description': game.description || `Host your own ${game.displayName || game.name} server on FluxCloud`,
      },
    })),
  }

  return [itemListSchema, fluxPlayOrganizationSchema, breadcrumbSchema, articleSchema, faqSchema]
})

// useSEO with reactive structured data
useSEO({
  title,
  description,
  url: pageUrl,
  image: imageUrl,
  imageAlt: 'FluxPlay - Game Server Hosting on FluxCloud',
  keywords: 'game server hosting, minecraft hosting, palworld hosting, factorio hosting, satisfactory hosting, enshrouded hosting, decentralized hosting, flux network, dedicated game servers, affordable hosting, ddos protection, blockchain hosting, pay-as-you-go gaming',
  structuredData: structuredDataSchemas,
  meta: [
    { property: 'og:site_name', content: 'FluxPlay' },
  ],
})

// Load games and flux locations on mount
onMounted(async () => {
  // Track games page view
  analytics.trackMarketplace('page_view', {
    page: 'games',
  })

  try {
    await Promise.all([
      fetchGames(),
      fetchFluxLocations(),
    ])
  } catch (err) {
    console.error('Failed to load data:', err)
  }
})
</script>

<style scoped>
.games-container {
  width: 100%;
  padding: 0;
  margin: 0;
  min-height: 100vh;
}

.games-layout {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}

/* Hero section margins - must come first */
.games-layout > :deep(.hero-section) {
  margin: 0 !important;
}

/* Add spacing after hero section via the parent layout */
.games-layout > :first-child {
  margin-bottom: 0.7rem !important;
}

/* Consistent spacing between all sections */
.games-layout > * {
  margin-bottom: 2rem;
}

/* Remove bottom margin from last child */
.games-layout > *:last-child {
  margin-bottom: 0;
}

/* Section Cards */
.section-card {
  margin-bottom: 2rem;
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

/* SEO Content Section */
.seo-content-section {
  max-width: 100%;
  background: rgb(var(--v-theme-surface)) !important;
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
  margin-bottom: 2rem !important;
}

.seo-content-section :deep(.v-card-text) {
  padding: 24px !important;
}

.trustpilot-section {
  padding: 0 !important;
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  background: rgb(var(--v-theme-surface)) !important;
  box-shadow: none !important;
}

.content-title {
  font-size: 28px;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 16px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.3;
}

.content-intro {
  font-size: 1.125rem;
  line-height: 1.8;
  text-align: center;
  margin-bottom: 32px;
  opacity: 0.9;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.content-features {
  display: grid;
  gap: 24px;
  margin-top: 32px;
}

.content-feature {
  display: flex;
  gap: 20px;
  padding: 24px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: all 0.3s ease;
}

.content-feature:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-color: rgba(var(--v-theme-on-surface), 0.16);
  transform: translateX(4px);
}

.content-feature-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 12px;
}

.content-feature-text {
  flex: 1;
}

.content-feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: rgb(var(--v-theme-on-surface));
}

.content-feature-desc {
  font-size: 1rem;
  line-height: 1.7;
  margin: 0;
  opacity: 0.85;
}

/* Games Grid Section */
.games-grid-section {
  margin-top: 16px;
}

.games-section-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 0;
  text-align: center;
  line-height: 1.3;
}

.games-section-subtitle {
  font-size: 1.1rem;
  opacity: 0.8;
  margin-bottom: 32px;
  text-align: center;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  padding: 0;
  width: 100%;
}

/* Comparison Section */
.comparison-section {
  max-width: 100%;
  background: rgb(var(--v-theme-surface)) !important;
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
  margin-bottom: 2rem !important;
}

.comparison-section :deep(.v-card-text) {
  padding: 24px !important;
}

.comparison-title {
  font-size: 28px;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
}

.comparison-table {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.comparison-header,
.comparison-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.2fr;
  background: transparent;
}

.comparison-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08) 0%, rgba(var(--v-theme-primary), 0.12) 100%);
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.2);
}

.comparison-header > div {
  padding: 20px 16px;
  font-weight: 700;
  font-size: 1.0625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgb(var(--v-theme-on-surface));
  text-align: center;
}

.comparison-feature-header {
  justify-content: flex-start !important;
  padding-left: 24px !important;
  text-align: left;
}

.fluxplay-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgba(var(--v-theme-primary), 0.85));
  color: white !important;
  font-weight: 800;
  font-size: 1.125rem !important;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3);
  position: relative;
}

.fluxplay-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: rgb(var(--v-theme-primary));
}

.crown-icon {
  color: #FFD700 !important;
  filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.4));
}

.comparison-row {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: all 0.2s ease;
}

.comparison-row:last-child {
  border-bottom: none;
}

.comparison-row:hover {
  background: rgba(var(--v-theme-primary), 0.02);
}

.comparison-row > div {
  padding: 18px 16px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9375rem;
}

.comparison-feature {
  justify-content: flex-start !important;
  font-weight: 600;
  padding-left: 24px !important;
  color: rgb(var(--v-theme-on-surface));
}

.fluxplay-value {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.12) 0%, rgba(var(--v-theme-primary), 0.08) 100%);
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  border-left: 3px solid rgb(var(--v-theme-primary));
  border-right: 3px solid rgb(var(--v-theme-primary));
  font-size: 1rem;
  position: relative;
}

.fluxplay-value::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--v-theme-primary), 0.3), transparent);
}

.comparison-row:last-child .fluxplay-value {
  border-bottom: 3px solid rgb(var(--v-theme-primary));
}

.comparison-row:last-child .fluxplay-value::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--v-theme-primary), 0.3), transparent);
}

.comparison-value {
  color: rgba(var(--v-theme-on-surface), 0.85);
}

/* FAQ Section */
.faq-expansion-panels {
  margin-top: 24px;
}

.faq-expansion-panel {
  margin-bottom: 12px;
  border-radius: 12px !important;
  overflow: hidden;
  background: rgba(var(--v-theme-surface), 0.8) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.faq-expansion-panel:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

.faq-expansion-panel:last-child {
  margin-bottom: 0;
}

.faq-question {
  font-weight: 600;
  padding: 20px 24px;
}

.question-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.question-icon {
  flex-shrink: 0;
}

.question-text {
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.faq-answer {
  padding: 0 24px 20px 24px !important;
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

.faq-answer :deep(p) {
  margin-bottom: 12px;
}

.faq-answer :deep(p:last-child) {
  margin-bottom: 0;
}

.faq-answer :deep(strong) {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.faq-answer :deep(ul),
.faq-answer :deep(ol) {
  margin-left: 24px;
  margin-bottom: 12px;
}

.faq-answer :deep(li) {
  margin-bottom: 8px;
}

.faq-answer :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.faq-answer :deep(a:hover) {
  text-decoration: underline;
}

.faq-answer :deep(code) {
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

/* Trustpilot Section */
.trustpilot-section {
  background: linear-gradient(135deg, rgba(0, 182, 122, 0.05) 0%, rgba(0, 182, 122, 0.02) 100%);
}

.trustpilot-link {
  text-decoration: none;
  color: inherit;
}

.trustpilot-rating-container {
  display: inline-block;
}

.trustpilot-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.trustpilot-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #00b67a;
}

.trustpilot-stars {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.trustpilot-rating-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rating-score {
  font-size: 1.25rem;
  font-weight: 700;
}

.rating-reviews {
  font-size: 0.95rem;
  opacity: 0.7;
}

/* CTA Section - Force button styling */
:deep(.cta-section .v-btn) {
  background-color: white !important;
  color: rgb(var(--v-theme-primary)) !important;
}

:deep(.cta-section .v-btn .v-icon) {
  color: rgb(var(--v-theme-primary)) !important;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .content-intro {
    font-size: 1rem;
  }

  .content-feature-title {
    font-size: 1.125rem;
  }

  .content-feature-desc {
    font-size: 0.9375rem;
  }

  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .comparison-header,
  .comparison-row {
    grid-template-columns: 1.5fr 1fr 1fr;
  }

  .comparison-header > div,
  .comparison-row > div {
    padding: 16px 12px;
    font-size: 0.875rem;
  }

  .comparison-feature-header,
  .comparison-feature {
    padding-left: 16px !important;
  }
}

@media (max-width: 600px) {
  .games-container {
    padding: 0;
  }

  .games-layout {
    gap: 0;
  }

  /* Ensure all direct children have consistent width and spacing */
  .games-layout > * {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    margin-bottom: 2rem !important;
  }

  .games-layout > :last-child {
    margin-bottom: 0 !important;
  }

  /* Override hero spacing */
  .games-layout > :first-child {
    margin-bottom: 0.7rem !important;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .content-intro {
    font-size: 0.9375rem;
  }

  .content-feature {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px;
    align-items: flex-start;
  }

  .content-feature-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 0;
  }

  .content-feature-icon :deep(.v-icon) {
    font-size: 24px !important;
  }

  .content-feature-text {
    flex: 1;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .content-feature-title {
    font-size: 1.0625rem;
    text-align: left;
    margin: 0;
  }

  .content-feature-desc {
    font-size: 0.875rem;
    text-align: left;
    width: calc(100% + 52px);
    margin-left: -52px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .games-section-title {
    font-size: 1.5rem;
  }

  .games-section-subtitle {
    font-size: 1rem;
  }

  .games-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .comparison-header,
  .comparison-row {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .comparison-header > div,
  .comparison-row > div {
    padding: 12px 8px;
    font-size: 0.75rem;
    justify-content: center !important;
    text-align: center;
  }

  .comparison-feature-header {
    padding-left: 12px !important;
    justify-content: flex-start !important;
    text-align: left;
  }

  .comparison-feature {
    padding-left: 12px !important;
    font-size: 0.8125rem;
    justify-content: flex-start !important;
    text-align: left;
  }

  .fluxplay-header {
    font-size: 0.875rem !important;
    padding: 12px 8px;
  }

  .fluxplay-value {
    font-size: 0.75rem;
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.12) 0%, rgba(var(--v-theme-primary), 0.08) 100%) !important;
    font-weight: 700;
    border-left: 2px solid rgb(var(--v-theme-primary)) !important;
    border-right: 2px solid rgb(var(--v-theme-primary)) !important;
  }

  .comparison-row:last-child .fluxplay-value {
    border-bottom: 2px solid rgb(var(--v-theme-primary)) !important;
  }

  .crown-icon {
    font-size: 16px !important;
  }

  .question-text {
    font-size: 1rem;
  }
}
</style>
