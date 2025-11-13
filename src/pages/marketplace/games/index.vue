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
          background-image="/banner/FluxPlay.png"
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
            <div class="content-text" v-html="t('pages.marketplace.games.index.content.body')"></div>
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
          <VCardTitle class="section-title">
            {{ t('pages.marketplace.games.index.comparison.title') }}
          </VCardTitle>
          <VCardText>
            <div class="comparison-table">
              <div class="comparison-header">
                <div class="comparison-feature-header">{{ t('pages.marketplace.games.index.comparison.feature') }}</div>
                <div class="comparison-column-header fluxplay-header">
                  <VIcon icon="mdi-crown" size="24" color="primary" />
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
        <TrustpilotPanel :show-reviews="false" :stars="5" />

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
import { useHead } from '@vueuse/head'
import axios from 'axios'
import { useMarketplace } from '@/composables/useMarketplace'
import { useGameUtils } from '@/composables/useGameUtils'
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

// Fetch server location data
const fetchFluxLocations = async () => {
  try {
    isLoadingLocations.value = true
    const response = await axios.get(
      'https://stats.runonflux.io/fluxinfo?projection=geolocation,ip,tier',
    )
    fluxList.value = response.data.data || []
    console.log(`✅ Loaded ${fluxList.value.length} flux nodes across ${countryCount.value} countries`)
  } catch (error) {
    console.error('Error fetching flux locations:', error)
    fluxList.value = []
  } finally {
    isLoadingLocations.value = false
  }
}

// SEO meta tags and structured data
watch(games, loadedGames => {
  if (!loadedGames || loadedGames.length === 0) return

  const pageUrl = 'https://home.runonflux.io/marketplace/games'
  const title = 'Game Server Hosting - FluxPlay on FluxCloud'
  const description = 'Premium game hosting with global servers, lightning-fast connections, and flexible plans. Host Minecraft, Palworld, Factorio, Satisfactory, and Enshrouded servers on FluxCloud with instant deployment and DDoS protection.'
  const imageUrl = 'https://home.runonflux.io/images/games/FluxPlay_white.svg'

  // ItemList structured data for game listings
  const itemListStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': loadedGames.map((game, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Product',
        'name': `${game.displayName || game.name} Server Hosting`,
        'url': `https://home.runonflux.io/marketplace/games/${game.name.toLowerCase()}`,
        'image': game.icon || game.logo || imageUrl,
        'description': game.description || `Host your own ${game.displayName || game.name} server on FluxCloud`,
      },
    })),
  }

  // Organization structured data
  const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'FluxPlay',
    'url': 'https://home.runonflux.io',
    'logo': imageUrl,
    'description': 'Decentralized game server hosting on FluxCloud',
  }

  // Breadcrumb structured data
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://home.runonflux.io',
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Games',
        'item': pageUrl,
      },
    ],
  }

  // FAQ structured data
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.value.map(faq => ({
      '@type': 'Question',
      'name': t(faq.question),
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer.replace(/<[^>]*>/g, ''), // Strip HTML tags for schema
      },
    })),
  }

  useHead({
    title,
    meta: [
      {
        name: 'description',
        content: description,
      },
      {
        name: 'keywords',
        content: 'game server hosting, minecraft hosting, palworld hosting, factorio hosting, satisfactory hosting, enshrouded hosting, decentralized hosting, flux network, dedicated game servers, affordable hosting, ddos protection, blockchain hosting, pay-as-you-go gaming',
      },

      // Open Graph
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: imageUrl },
      { property: 'og:url', content: pageUrl },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'FluxPlay' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl },

      // Additional SEO
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Flux Network' },
    ],
    link: [
      { rel: 'canonical', href: pageUrl },
    ],
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify([itemListStructuredData, organizationStructuredData, breadcrumbStructuredData, faqStructuredData]),
      },
    ],
  })
}, { immediate: true })

// Load games and flux locations on mount
onMounted(async () => {
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
  padding: 8px 24px 32px 24px;
  min-height: 100vh;
}

.games-layout {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Section Cards */
.section-card {
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  padding: 24px 24px 0 24px;
}


/* SEO Content Section */
.seo-content-section {
  background: rgba(var(--v-theme-surface), 0.4);
}

.content-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.content-text {
  font-size: 1rem;
  line-height: 1.8;
  opacity: 0.9;
}

.content-text :deep(p) {
  margin-bottom: 16px;
}

.content-text :deep(strong) {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

/* Games Grid Section */
.games-grid-section {
  margin-top: 16px;
}

.games-section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
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
.comparison-table {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
  overflow: hidden;
}

.comparison-header,
.comparison-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1px;
  background: transparent;
}

.comparison-header > div {
  padding: 16px;
  background: rgba(var(--v-theme-primary), 0.1);
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.comparison-feature-header {
  justify-content: flex-start !important;
}

.fluxplay-header {
  background: rgba(var(--v-theme-primary), 0.15) !important;
}

.comparison-row > div {
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  display: flex;
  align-items: center;
  justify-content: center;
}

.comparison-feature {
  justify-content: flex-start !important;
  font-weight: 500;
}

.fluxplay-value {
  background: rgba(var(--v-theme-primary), 0.05) !important;
  font-weight: 600;
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

/* Responsive adjustments */
@media (max-width: 960px) {
  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .comparison-header,
  .comparison-row {
    grid-template-columns: 1.5fr 1fr 1fr;
  }

  .comparison-header > div,
  .comparison-row > div {
    padding: 12px;
    font-size: 0.9rem;
  }
}

@media (max-width: 600px) {
  .games-container {
    padding: 16px;
  }

  .games-layout {
    gap: 24px;
  }

  .section-title {
    font-size: 1.5rem;
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
  }

  .comparison-header,
  .comparison-row {
    grid-template-columns: 1fr;
  }

  .comparison-header > div,
  .comparison-row > div {
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  }

  .comparison-header > div:last-child,
  .comparison-row > div:last-child {
    border-bottom: none;
  }

  .question-text {
    font-size: 1rem;
  }
}
</style>
