<template>
  <div class="app-register-landing">
    <!-- Content -->
    <div class="landing-content">
      <!-- Breadcrumb Navigation -->
      <nav class="breadcrumb-nav" aria-label="Breadcrumb">
        <ol class="breadcrumb-list">
          <li class="breadcrumb-item">
            <RouterLink to="/" class="breadcrumb-link">Home</RouterLink>
            <VIcon class="breadcrumb-separator">mdi-chevron-right</VIcon>
          </li>
          <li class="breadcrumb-item">
            <RouterLink to="/apps/management" class="breadcrumb-link">Applications</RouterLink>
            <VIcon class="breadcrumb-separator">mdi-chevron-right</VIcon>
          </li>
          <li class="breadcrumb-item breadcrumb-current" aria-current="page">
            <span>Deploy New App</span>
          </li>
        </ol>
      </nav>

      <!-- Hero Section -->
      <div class="hero-section" role="banner">
        <div class="hero-icon-top-right" role="img" aria-label="Flux Cloud Logo">
          <VIcon icon="mdi-cloud-upload" size="80" color="white" aria-hidden="true" />
        </div>
        <div class="hero-content">
          <h1 class="hero-title">{{ t('pages.apps.register.landing.title') }}</h1>
          <p class="hero-subtitle">{{ heroSubtitle }}</p>
          <div class="hero-actions">
            <VBtn
              color="white"
              size="x-large"
              variant="elevated"
              class="hero-btn"
              :to="{ name: 'apps-register-configure' }"
            >
              <VIcon start>mdi-rocket-launch</VIcon>
              {{ t('pages.apps.register.landing.getStarted') }}
            </VBtn>
          </div>
        </div>
      </div>

      <!-- App Types Section -->
      <VCard class="section-card app-types-section">
        <VCardText>
          <h2 class="section-title">
            {{ t('pages.apps.register.landing.appTypes.title') }}
          </h2>
          <p class="section-subtitle">{{ t('pages.apps.register.landing.appTypes.subtitle') }}</p>
          <div class="app-types-grid">
            <div
              v-for="(appType, index) in appTypes"
              :key="index"
              class="app-type-card"
            >
              <div class="app-type-icon">
                <VIcon :icon="appType.icon" size="48" :color="appType.color" />
              </div>
              <h4 class="app-type-title">{{ appType.title }}</h4>
              <p class="app-type-text">{{ appType.description }}</p>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Benefits Section -->
      <VCard class="section-card benefits-section">
        <VCardText>
          <h2 class="section-title">
            {{ t('pages.apps.register.landing.benefits.title') }}
          </h2>
          <div class="benefits-grid">
            <div
              v-for="(benefit, index) in benefits"
              :key="index"
              class="benefit-item"
            >
              <div class="benefit-icon">
                <VIcon :icon="benefit.icon" size="40" :color="benefit.color" />
              </div>
              <h4 class="benefit-title">{{ benefit.title }}</h4>
              <p class="benefit-text">{{ benefit.description }}</p>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Pricing Comparison Section -->
      <VCard class="section-card pricing-section">
        <VCardText>
          <h2 class="section-title">
            {{ t('pages.apps.register.landing.pricing.title') }}
          </h2>
          <p class="section-subtitle">{{ t('pages.apps.register.landing.pricing.subtitle') }}</p>

          <div class="pricing-comparison">
            <div class="comparison-table">
              <div class="comparison-row comparison-header">
                <div class="comparison-cell">{{ t('pages.apps.register.landing.pricing.provider') }}</div>
                <div class="comparison-cell">{{ t('pages.apps.register.landing.pricing.cpu') }}</div>
                <div class="comparison-cell">{{ t('pages.apps.register.landing.pricing.ram') }}</div>
                <div class="comparison-cell">{{ t('pages.apps.register.landing.pricing.storage') }}</div>
                <div class="comparison-cell">{{ t('pages.apps.register.landing.pricing.pricePerMonth') }}</div>
              </div>
              <div
                v-for="(provider, index) in pricingComparison"
                :key="index"
                class="comparison-row"
                :class="{ 'highlighted': provider.highlighted }"
              >
                <div class="comparison-cell provider-cell">
                  <VIcon v-if="provider.highlighted" icon="mdi-star" color="warning" size="20" class="mr-2" />
                  <strong>{{ provider.name }}</strong>
                </div>
                <div class="comparison-cell">{{ provider.cpu }}</div>
                <div class="comparison-cell">{{ provider.ram }}</div>
                <div class="comparison-cell">{{ provider.storage }}</div>
                <div class="comparison-cell price-cell">
                  <span :class="{ 'best-price': provider.highlighted }">{{ provider.price }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pricing-note">
            <VIcon icon="mdi-information" color="info" size="20" />
            <span>{{ t('pages.apps.register.landing.pricing.note') }}</span>
          </div>
        </VCardText>
      </VCard>

      <!-- Trustpilot Reviews Section -->
      <VCard class="section-card trustpilot-section">
        <VCardText class="pa-8">
          <div class="trustpilot-header text-center mb-6">
            <h2 class="text-h4 mb-3 font-weight-bold">{{ t('common.trustpilot.title') }}</h2>
            <a
              :href="t('common.trustpilot.profileUrl')"
              target="_blank"
              rel="noopener noreferrer"
              class="trustpilot-link"
            >
              <div class="trustpilot-rating-container">
                <div class="trustpilot-logo mb-3">
                  <VIcon icon="mdi-star" size="32" color="#00b67a" />
                  <span class="text-h6 font-weight-bold ml-2" style="color: #00b67a;">Trustpilot</span>
                </div>
                <div class="rating-stars mb-2">
                  <VIcon v-for="i in 4" :key="i" icon="mdi-star" size="32" color="#00b67a" />
                  <VIcon icon="mdi-star-half-full" size="32" color="#00b67a" />
                </div>
                <div class="rating-text">
                  <span class="text-h5 font-weight-bold">{{ t('common.trustpilot.ratingLabel') }}</span>
                  <span class="text-h6 ml-2 text-medium-emphasis">{{ t('common.trustpilot.score') }} {{ t('common.trustpilot.outOf') }}</span>
                </div>
                <div class="reviews-count text-body-2 text-medium-emphasis mt-1">
                  {{ t('common.trustpilot.basedOn', { count: t('common.trustpilot.reviewsCount') }) }}
                </div>
              </div>
            </a>
          </div>

          <div class="trustpilot-reviews">
            <VRow>
              <VCol v-for="(review, key) in ['review1', 'review2', 'review3']" :key="key" cols="12" md="4">
                <VCard variant="outlined" class="review-card pa-4">
                  <div class="review-stars mb-2">
                    <VIcon v-for="i in parseInt(t(`common.trustpilot.sampleReviews.${review}.rating`))" :key="i" icon="mdi-star" size="20" color="#00b67a" />
                  </div>
                  <p class="review-text text-body-2 mb-3">
                    "{{ t(`common.trustpilot.sampleReviews.${review}.text`) }}"
                  </p>
                  <div class="review-author text-caption text-medium-emphasis">
                    <VIcon icon="mdi-check-circle" size="14" color="success" class="mr-1" />
                    {{ t(`common.trustpilot.sampleReviews.${review}.author`) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ t('common.trustpilot.verifiedCustomer') }}
                  </div>
                </VCard>
              </VCol>
            </VRow>
          </div>

          <div class="text-center mt-6">
            <VBtn
              :href="t('common.trustpilot.profileUrl')"
              target="_blank"
              rel="noopener noreferrer"
              color="success"
              variant="outlined"
              size="large"
            >
              <VIcon start>mdi-open-in-new</VIcon>
              {{ t('common.trustpilot.viewAllReviews') }}
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Global Server Network Section -->
      <VCard class="section-card server-locations-section" role="region" aria-labelledby="server-network-title">
        <VCardText>
          <h2 id="server-network-title" class="locations-title">{{ t('pages.apps.register.landing.serverNetwork.title') }}</h2>
          <p class="locations-subtitle">{{ t('pages.apps.register.landing.serverNetwork.subtitle') }}</p>

          <!-- Stats -->
          <div v-if="fluxNodeCount > 0" class="stats-container">
            <div class="stat-item">
              <VIcon icon="mdi-server-network" size="32" color="primary" />
              <div class="stat-content">
                <div class="stat-value">{{ fluxNodeCount.toLocaleString() }}+</div>
                <div class="stat-label">{{ t('pages.apps.register.landing.serverNetwork.activeServers') }}</div>
              </div>
            </div>
            <div class="stat-item">
              <VIcon icon="mdi-earth" size="32" color="primary" />
              <div class="stat-content">
                <div class="stat-value">{{ countryCount }}+</div>
                <div class="stat-label">{{ t('pages.apps.register.landing.serverNetwork.countries') }}</div>
              </div>
            </div>
            <div class="stat-item">
              <VIcon icon="mdi-web" size="32" color="primary" />
              <div class="stat-content">
                <div class="stat-value">{{ t('pages.apps.register.landing.serverNetwork.global') }}</div>
                <div class="stat-label">{{ t('pages.apps.register.landing.serverNetwork.coverage') }}</div>
              </div>
            </div>
          </div>

          <!-- Map Component -->
          <div class="map-container" role="img" aria-label="Interactive map showing FluxCloud server locations worldwide">
            <VOverlay
              v-model="isLoadingMap"
              contained
              scroll-strategy="none"
              class="align-center justify-center"
            >
              <VProgressCircular indeterminate color="primary" aria-label="Loading server map" />
            </VOverlay>

            <MapComponent
              v-if="fluxList.length > 0"
              :nodes="fluxList"
              :show-tier-display="false"
              class="server-map"
            />

            <div v-if="!isLoadingMap && fluxList.length === 0" class="no-data">
              {{ t('pages.apps.register.landing.serverNetwork.noData') }}
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Features Section -->
      <VCard class="section-card features-section">
        <VCardText>
          <h2 class="section-title">
            {{ t('pages.apps.register.landing.features.title') }}
          </h2>
          <div class="features-grid">
            <div
              v-for="(feature, index) in features"
              :key="index"
              class="feature-item"
            >
              <div class="feature-icon">
                <VIcon :icon="feature.icon" size="40" :color="feature.color" />
              </div>
              <h4 class="feature-title">{{ feature.title }}</h4>
              <p class="feature-text">{{ feature.description }}</p>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- FAQ Section -->
      <VCard class="section-card faq-section" role="region" aria-labelledby="faq-title">
        <VCardText>
          <h2 id="faq-title" class="faq-title">
            {{ t('pages.apps.register.landing.faq.title') }}
          </h2>

          <VExpansionPanels class="faq-expansion-panels" multiple>
            <VExpansionPanel
              v-for="(faq, index) in faqs"
              :key="index"
              class="faq-expansion-panel"
              elevation="0"
            >
              <VExpansionPanelTitle class="faq-question">
                <div class="question-wrapper">
                  <VIcon icon="mdi-help-circle" color="primary" size="24" class="question-icon" />
                  <h3 class="question-text">{{ faq.question }}</h3>
                </div>
              </VExpansionPanelTitle>
              <VExpansionPanelText class="faq-answer">
                <div v-html="faq.answer"></div>
              </VExpansionPanelText>
            </VExpansionPanel>
          </VExpansionPanels>
        </VCardText>
      </VCard>

      <!-- CTA Section -->
      <VCard class="section-card cta-section">
        <VCardText class="text-center">
          <div class="cta-icon">
            <VIcon icon="mdi-rocket-launch-outline" size="64" color="primary" />
          </div>
          <h2 class="cta-title">{{ t('pages.apps.register.landing.cta.title') }}</h2>
          <p class="cta-subtitle">{{ t('pages.apps.register.landing.cta.subtitle') }}</p>
          <VBtn
            color="primary"
            size="x-large"
            variant="elevated"
            class="cta-btn"
            :to="{ name: 'apps-register-configure' }"
          >
            <VIcon start>mdi-plus-circle</VIcon>
            {{ t('pages.apps.register.landing.cta.button') }}
          </VBtn>
        </VCardText>
      </VCard>

      <!-- Related Links Section -->
      <VCard class="section-card related-links-section">
        <VCardText>
          <h2 class="section-title">
            {{ t('pages.apps.register.landing.relatedLinks.title') }}
          </h2>
          <div class="related-links-grid">
            <RouterLink to="/marketplace" class="related-link-card">
              <VIcon class="related-link-icon" color="primary">mdi-storefront</VIcon>
              <h3 class="related-link-title">{{ t('pages.apps.register.landing.relatedLinks.marketplace') }}</h3>
              <p class="related-link-description">{{ t('pages.apps.register.landing.relatedLinks.marketplaceDesc') }}</p>
            </RouterLink>
            <RouterLink to="/marketplace/wordpress" class="related-link-card">
              <VIcon class="related-link-icon" color="info">mdi-wordpress</VIcon>
              <h3 class="related-link-title">{{ t('pages.apps.register.landing.relatedLinks.wordpress') }}</h3>
              <p class="related-link-description">{{ t('pages.apps.register.landing.relatedLinks.wordpressDesc') }}</p>
            </RouterLink>
            <RouterLink to="/marketplace/games" class="related-link-card">
              <VIcon class="related-link-icon" color="success">mdi-gamepad-variant</VIcon>
              <h3 class="related-link-title">{{ t('pages.apps.register.landing.relatedLinks.gaming') }}</h3>
              <p class="related-link-description">{{ t('pages.apps.register.landing.relatedLinks.gamingDesc') }}</p>
            </RouterLink>
            <RouterLink to="/cost-calculator" class="related-link-card">
              <VIcon class="related-link-icon" color="warning">mdi-calculator</VIcon>
              <h3 class="related-link-title">{{ t('pages.apps.register.landing.relatedLinks.calculator') }}</h3>
              <p class="related-link-description">{{ t('pages.apps.register.landing.relatedLinks.calculatorDesc') }}</p>
            </RouterLink>
          </div>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import axios from 'axios'
import MapComponent from '@core/components/MapComponent.vue'
import DashboardService from '@/services/DashboardService'

const { t } = useI18n()
const router = useRouter()

// Server locations data
const fluxList = ref([])
const fluxNodeCount = ref(0)
const isLoadingMap = ref(true)

// Computed country count from flux list
const countryCount = computed(() => {
  const countries = new Set()
  fluxList.value.forEach(flux => {
    if (flux.geolocation?.country) {
      countries.add(flux.geolocation.country)
    }
  })

  return countries.size
})

// Dynamic hero subtitle with real data
const heroSubtitle = computed(() => {
  if (fluxNodeCount.value > 0 && countryCount.value > 0) {
    return `Experience the power of truly decentralized cloud computing. Deploy Docker containers, web apps, APIs, and microservices on our global network of ${fluxNodeCount.value.toLocaleString()}+ servers across ${countryCount.value}+ countries.`
  }

  // Fallback while loading
  return 'Experience the power of truly decentralized cloud computing. Deploy Docker containers, web apps, APIs, and microservices on our global decentralized network.'
})

// App types data
const appTypes = computed(() => [
  {
    icon: 'mdi-web',
    color: 'primary',
    title: t('pages.apps.register.landing.appTypes.web.title'),
    description: t('pages.apps.register.landing.appTypes.web.description'),
  },
  {
    icon: 'mdi-api',
    color: 'success',
    title: t('pages.apps.register.landing.appTypes.api.title'),
    description: t('pages.apps.register.landing.appTypes.api.description'),
  },
  {
    icon: 'mdi-database',
    color: 'info',
    title: t('pages.apps.register.landing.appTypes.database.title'),
    description: t('pages.apps.register.landing.appTypes.database.description'),
  },
  {
    icon: 'mdi-currency-btc',
    color: 'warning',
    title: t('pages.apps.register.landing.appTypes.blockchain.title'),
    description: t('pages.apps.register.landing.appTypes.blockchain.description'),
  },
  {
    icon: 'mdi-application-cog',
    color: 'error',
    title: t('pages.apps.register.landing.appTypes.custom.title'),
    description: t('pages.apps.register.landing.appTypes.custom.description'),
  },
  {
    icon: 'mdi-docker',
    color: 'primary',
    title: t('pages.apps.register.landing.appTypes.docker.title'),
    description: t('pages.apps.register.landing.appTypes.docker.description'),
  },
])

// Benefits data
const benefits = computed(() => [
  {
    icon: 'mdi-shield-check',
    color: 'success',
    title: t('pages.apps.register.landing.benefits.decentralized.title'),
    description: t('pages.apps.register.landing.benefits.decentralized.description'),
  },
  {
    icon: 'mdi-currency-usd-off',
    color: 'warning',
    title: t('pages.apps.register.landing.benefits.affordable.title'),
    description: t('pages.apps.register.landing.benefits.affordable.description'),
  },
  {
    icon: 'mdi-web',
    color: 'info',
    title: t('pages.apps.register.landing.benefits.global.title'),
    description: t('pages.apps.register.landing.benefits.global.description'),
  },
  {
    icon: 'mdi-scale-balance',
    color: 'primary',
    title: t('pages.apps.register.landing.benefits.censorship.title'),
    description: t('pages.apps.register.landing.benefits.censorship.description'),
  },
  {
    icon: 'mdi-chart-line',
    color: 'success',
    title: t('pages.apps.register.landing.benefits.scalable.title'),
    description: t('pages.apps.register.landing.benefits.scalable.description'),
  },
  {
    icon: 'mdi-lock-open',
    color: 'error',
    title: t('pages.apps.register.landing.benefits.noVendor.title'),
    description: t('pages.apps.register.landing.benefits.noVendor.description'),
  },
  {
    icon: 'mdi-cash-refund',
    color: 'success',
    title: t('pages.apps.register.landing.benefits.guarantee.title'),
    description: t('pages.apps.register.landing.benefits.guarantee.description'),
  },
])

// Pricing comparison data
const pricingComparison = computed(() => [
  {
    name: 'FluxCloud',
    cpu: '2 vCPU',
    ram: '4 GB',
    storage: '20 GB SSD',
    price: '$8.99',
    highlighted: true,
  },
  {
    name: 'AWS EC2',
    cpu: '2 vCPU',
    ram: '4 GB',
    storage: '20 GB SSD',
    price: '$33.12',
    highlighted: false,
  },
  {
    name: 'Google Cloud',
    cpu: '2 vCPU',
    ram: '4 GB',
    storage: '20 GB SSD',
    price: '$29.80',
    highlighted: false,
  },
  {
    name: 'Azure',
    cpu: '2 vCPU',
    ram: '4 GB',
    storage: '20 GB SSD',
    price: '$31.39',
    highlighted: false,
  },
  {
    name: 'DigitalOcean',
    cpu: '2 vCPU',
    ram: '4 GB',
    storage: '20 GB SSD',
    price: '$24.00',
    highlighted: false,
  },
])

// Features data
const features = computed(() => [
  {
    icon: 'mdi-speedometer',
    color: 'success',
    title: t('pages.apps.register.landing.features.performance.title'),
    description: t('pages.apps.register.landing.features.performance.description'),
  },
  {
    icon: 'mdi-shield-lock',
    color: 'error',
    title: t('pages.apps.register.landing.features.security.title'),
    description: t('pages.apps.register.landing.features.security.description'),
  },
  {
    icon: 'mdi-sync',
    color: 'info',
    title: t('pages.apps.register.landing.features.redundancy.title'),
    description: t('pages.apps.register.landing.features.redundancy.description'),
  },
  {
    icon: 'mdi-monitor-dashboard',
    color: 'primary',
    title: t('pages.apps.register.landing.features.monitoring.title'),
    description: t('pages.apps.register.landing.features.monitoring.description'),
  },
  {
    icon: 'mdi-update',
    color: 'warning',
    title: t('pages.apps.register.landing.features.updates.title'),
    description: t('pages.apps.register.landing.features.updates.description'),
  },
  {
    icon: 'mdi-lifebuoy',
    color: 'success',
    title: t('pages.apps.register.landing.features.support.title'),
    description: t('pages.apps.register.landing.features.support.description'),
  },
])

// FAQ data
const faqs = computed(() => [
  {
    question: t('pages.apps.register.landing.faq.questions.whatIsFlux.question'),
    answer: t('pages.apps.register.landing.faq.questions.whatIsFlux.answer'),
  },
  {
    question: t('pages.apps.register.landing.faq.questions.howToDeploy.question'),
    answer: t('pages.apps.register.landing.faq.questions.howToDeploy.answer'),
  },
  {
    question: t('pages.apps.register.landing.faq.questions.pricing.question'),
    answer: t('pages.apps.register.landing.faq.questions.pricing.answer'),
  },
  {
    question: t('pages.apps.register.landing.faq.questions.support.question'),
    answer: t('pages.apps.register.landing.faq.questions.support.answer'),
  },
  {
    question: t('pages.apps.register.landing.faq.questions.requirements.question'),
    answer: t('pages.apps.register.landing.faq.questions.requirements.answer'),
  },
  {
    question: t('pages.apps.register.landing.faq.questions.security.question'),
    answer: t('pages.apps.register.landing.faq.questions.security.answer'),
  },
])

// Structured Data (JSON-LD)
const breadcrumbSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': 'https://home.runonflux.io/',
    },
    {
      '@type': 'ListItem',
      'position': 2,
      'name': 'Applications',
      'item': 'https://home.runonflux.io/apps/management',
    },
    {
      '@type': 'ListItem',
      'position': 3,
      'name': 'Deploy New App',
      'item': 'https://home.runonflux.io/apps/register',
    },
  ],
}))

const faqSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': faqs.value.map(faq => ({
    '@type': 'Question',
    'name': faq.question,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': faq.answer.replace(/<[^>]*>/g, ''), // Strip HTML tags
    },
  })),
}))

const webPageSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  'name': 'Deploy Your App on FluxCloud - Decentralized Cloud Computing',
  'description': 'Deploy your applications on FluxCloud\'s decentralized network. Affordable, secure, and globally distributed cloud computing with no vendor lock-in.',
  'url': 'https://home.runonflux.io/apps/register',
  'image': 'https://home.runonflux.io/banner/FluxDeploy.png',
  'publisher': {
    '@type': 'Organization',
    'name': 'FluxCloud',
    'url': 'https://home.runonflux.io',
  },
}))

const offerSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Offer',
  'name': 'FluxCloud Hosting',
  'description': 'Decentralized cloud computing platform',
  'price': '8.99',
  'priceCurrency': 'USD',
  'availability': 'https://schema.org/InStock',
  'url': 'https://home.runonflux.io/apps/register',
  'seller': {
    '@type': 'Organization',
    'name': 'FluxCloud',
  },
}))

// Load flux nodes for the map
const getFluxList = async () => {
  try {
    const resLoc = await axios.get(
      'https://stats.runonflux.io/fluxinfo?projection=geolocation,ip,tier',
    )

    fluxList.value = resLoc.data.data || []

    const resList = await DashboardService.fluxnodeCount()
    fluxNodeCount.value = resList.data.data.total || 0
  } catch (error) {
    console.error('Error fetching flux list:', error)
    fluxList.value = []
    fluxNodeCount.value = 0
  }
}

// SEO meta tags
useHead({
  title: 'Deploy Your App on FluxCloud - Decentralized Cloud Computing',
  meta: [
    {
      name: 'description',
      content: 'Deploy your applications on FluxCloud\'s decentralized network. Affordable, secure, and globally distributed cloud computing with no vendor lock-in.',
    },
    {
      name: 'keywords',
      content: 'flux, cloud computing, decentralized hosting, docker deployment, blockchain, web3, dapp hosting',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      name: 'author',
      content: 'FluxCloud',
    },
    {
      property: 'og:title',
      content: 'Deploy Your App on FluxCloud - Decentralized Cloud Computing',
    },
    {
      property: 'og:description',
      content: 'Deploy your applications on FluxCloud\'s decentralized network. Affordable, secure, and globally distributed cloud computing.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: 'https://home.runonflux.io/apps/register',
    },
    {
      property: 'og:image',
      content: 'https://home.runonflux.io/banner/FluxDeploy.png',
    },
    {
      property: 'og:image:width',
      content: '1200',
    },
    {
      property: 'og:image:height',
      content: '630',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: 'Deploy Your App on FluxCloud - Decentralized Cloud Computing',
    },
    {
      name: 'twitter:description',
      content: 'Deploy your applications on FluxCloud\'s decentralized network. Affordable, secure, and globally distributed cloud computing with no vendor lock-in.',
    },
    {
      name: 'twitter:image',
      content: 'https://home.runonflux.io/banner/FluxDeploy.png',
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: 'https://home.runonflux.io/apps/register',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(breadcrumbSchema.value),
    },
    {
      type: 'application/ld+json',
      children: JSON.stringify(faqSchema.value),
    },
    {
      type: 'application/ld+json',
      children: JSON.stringify(webPageSchema.value),
    },
    {
      type: 'application/ld+json',
      children: JSON.stringify(offerSchema.value),
    },
  ],
})

onMounted(async () => {
  // Load server locations
  isLoadingMap.value = true
  try {
    await getFluxList()
  } catch (error) {
    console.error('Error loading server locations:', error)
  } finally {
    isLoadingMap.value = false
  }
})
</script>

<style scoped>
.app-register-landing {
  width: 100%;
  padding: 0;
  margin: 0;
}

.landing-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

/* Breadcrumb Styles */
.breadcrumb-nav {
  margin-bottom: 1.5rem;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.breadcrumb-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  transition: opacity 0.2s;
}

.breadcrumb-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.breadcrumb-separator {
  margin: 0 0.25rem;
  font-size: 1rem;
  opacity: 0.6;
}

.breadcrumb-current {
  opacity: 0.7;
}

/* Hero Section */
.hero-section {
  position: relative;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.5) 0%, rgba(var(--v-theme-secondary), 0.5) 100%), url('/banner/FluxDeploy.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 24px;
  padding: 4rem 2rem;
  margin-bottom: 3rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.hero-icon-top-right {
  position: absolute;
  top: 2rem;
  right: 2rem;
  opacity: 0.15;
  transform: rotate(15deg);
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.hero-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.hero-btn-secondary {
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  color: white !important;
  border-color: white !important;
}

/* Section Cards */
.section-card {
  margin-bottom: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: rgb(var(--v-theme-primary));
}

.section-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 2rem;
  opacity: 0.8;
}

/* App Types Grid */
.app-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.app-type-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.app-type-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.app-type-icon {
  margin-bottom: 1rem;
}

.app-type-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.app-type-text {
  font-size: 0.875rem;
  opacity: 0.8;
  line-height: 1.5;
}

/* Benefits Grid */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.benefit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
}

.benefit-icon {
  margin-bottom: 1rem;
}

.benefit-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.benefit-text {
  font-size: 0.875rem;
  opacity: 0.8;
  line-height: 1.6;
}

/* Pricing Comparison */
.pricing-comparison {
  margin: 2rem 0;
}

.comparison-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comparison-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  align-items: center;
}

.comparison-header {
  background: rgb(var(--v-theme-primary));
  color: white;
  font-weight: 600;
}

.comparison-row.highlighted {
  background: rgba(var(--v-theme-primary), 0.08);
  border: 2px solid rgb(var(--v-theme-primary));
}

.comparison-cell {
  text-align: center;
}

.provider-cell {
  text-align: left;
  display: flex;
  align-items: center;
}

.price-cell {
  font-weight: 600;
}

.best-price {
  color: rgb(var(--v-theme-success));
  font-size: 1.125rem;
  font-weight: 700;
}

.pricing-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(var(--v-theme-info), 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
}

/* Server Network Section */
.server-locations-section {
  padding: 2rem;
}

.locations-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: rgb(var(--v-theme-primary));
}

.locations-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 2rem;
  opacity: 0.8;
}

.map-container {
  position: relative;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 2rem;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.server-map {
  width: 100%;
  height: 100%;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 1.125rem;
  opacity: 0.6;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
}

.feature-icon {
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.feature-text {
  font-size: 0.875rem;
  opacity: 0.8;
  line-height: 1.6;
}

/* FAQ Section */
.faq-section {
  padding: 2rem;
}

.faq-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  color: rgb(var(--v-theme-primary));
}

.faq-expansion-panels {
  margin-top: 24px;
}

.faq-expansion-panel {
  margin-bottom: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  border-radius: 12px !important;
  overflow: hidden;
  background: rgba(var(--v-theme-surface), 0.8) !important;
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

/* CTA Section */
.cta-section {
  padding: 3rem 2rem;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-secondary), 0.05) 100%);
}

.cta-icon {
  margin-bottom: 1.5rem;
}

.cta-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: rgb(var(--v-theme-primary));
}

.cta-subtitle {
  font-size: 1.125rem;
  opacity: 0.8;
  margin-bottom: 2rem;
}

.cta-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.3);
}

/* Related Links Grid */
.related-links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.related-link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1.5rem;
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.related-link-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.related-link-icon {
  margin-bottom: 1rem;
  font-size: 3rem;
}

.related-link-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.related-link-description {
  font-size: 0.875rem;
  opacity: 0.7;
  line-height: 1.5;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .comparison-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .comparison-cell {
    text-align: left;
    display: flex;
    justify-content: space-between;
  }

  .comparison-cell::before {
    content: attr(data-label);
    font-weight: 600;
  }

  .comparison-header {
    display: none;
  }

  .provider-cell {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
  }
}

/* Trustpilot Section */
.trustpilot-link {
  text-decoration: none;
  color: inherit;
  display: inline-block;
  transition: all 0.3s ease;
}

.trustpilot-link:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.trustpilot-link .trustpilot-rating-container {
  cursor: pointer;
}

@media (max-width: 600px) {
  .hero-section {
    padding: 3rem 1.5rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-btn,
  .hero-btn-secondary {
    width: 100%;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .map-container {
    height: 300px;
  }
}
</style>
