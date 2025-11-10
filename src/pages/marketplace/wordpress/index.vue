<template>
  <div class="wordpress-landing">
    <!-- Loading State -->
    <LoadingSpinner
      v-if="loadingPlans && !apiError"
      icon="mdi-wordpress"
      :icon-size="56"
      :title="t('pages.marketplace.wordpress.loadingTitle')"
    />

    <!-- Maintenance Mode -->
    <MaintenanceCard
      v-else-if="apiError"
      :title="t('pages.marketplace.wordpress.maintenanceTitle')"
      :subtitle="t('pages.marketplace.wordpress.maintenanceSubtitle')"
      :description="t('pages.marketplace.wordpress.maintenanceDescription')"
      :loading="loadingPlans"
      @retry="loadPlans"
    />

    <!-- Content -->
    <div v-else class="landing-content">
      <!-- Breadcrumb Navigation -->
      <nav class="breadcrumb-nav" aria-label="Breadcrumb">
        <ol class="breadcrumb-list">
          <li class="breadcrumb-item">
            <RouterLink to="/" class="breadcrumb-link">Home</RouterLink>
            <VIcon class="breadcrumb-separator">mdi-chevron-right</VIcon>
          </li>
          <li class="breadcrumb-item">
            <RouterLink to="/marketplace" class="breadcrumb-link">Marketplace</RouterLink>
            <VIcon class="breadcrumb-separator">mdi-chevron-right</VIcon>
          </li>
          <li class="breadcrumb-item breadcrumb-current" aria-current="page">
            <span>WordPress Hosting</span>
          </li>
        </ol>
      </nav>

      <!-- Hero Section -->
      <div class="hero-section" role="banner">
        <div class="hero-icon-top-right" role="img" aria-label="WordPress Logo">
          <VIcon icon="mdi-wordpress" size="80" color="white" aria-hidden="true" />
        </div>
        <div class="hero-content">
          <h1 class="hero-title">{{ t('pages.marketplace.wordpress.landing.title') }}</h1>
          <p class="hero-subtitle">{{ t('pages.marketplace.wordpress.landing.subtitle') }}</p>
        </div>
      </div>

      <!-- Plans Section -->
      <div class="plans-section">
        <h2 class="section-title">{{ t('pages.marketplace.wordpress.landing.plans.title') }}</h2>
        <p class="section-subtitle">{{ t('pages.marketplace.wordpress.landing.plans.subtitle') }}</p>

        <div class="plans-grid">
          <div
            v-for="plan in plans"
            :key="plan.name"
            class="plan-card"
            :class="{ 'recommended': plan.isDefault }"
          >
            <div v-if="plan.isDefault" class="recommended-badge">
              {{ t('pages.marketplace.wordpress.landing.plans.recommended') }}
            </div>

            <div class="plan-price-badge">
              <span class="price-amount">${{ plan.usd.toFixed(2) }}</span>
              <span class="price-period">{{ t('pages.marketplace.wordpress.landing.plans.perMonth') }}</span>
            </div>

            <div class="plan-header">
              <h3 class="plan-name">{{ plan.name }}</h3>
              <p class="plan-description">{{ translateDescription(plan) }}</p>
            </div>

            <div class="plan-resources">
              <div class="resource-row">
                <VIcon class="resource-icon cpu-icon">mdi-speedometer</VIcon>
                <span class="resource-label">{{ t('pages.marketplace.wordpress.landing.plans.cpu') }}</span>
                <span class="resource-value">{{ (plan.cpu[0] + plan.cpu[1]).toFixed(1) }} Cores</span>
              </div>
              <div class="resource-row">
                <VIcon class="resource-icon ram-icon">mdi-memory</VIcon>
                <span class="resource-label">{{ t('pages.marketplace.wordpress.landing.plans.ram') }}</span>
                <span class="resource-value">{{ ((plan.ram[0] + plan.ram[1]) / 1000).toFixed(1) }} GB</span>
              </div>
              <div class="resource-row">
                <VIcon class="resource-icon ssd-icon">mdi-harddisk</VIcon>
                <span class="resource-label">{{ t('pages.marketplace.wordpress.landing.plans.storage') }}</span>
                <span class="resource-value">{{ (plan.ssd[0] + plan.ssd[1]).toFixed(0) }} GB SSD</span>
              </div>
              <div class="resource-row">
                <VIcon class="resource-icon instances-icon">mdi-server-network</VIcon>
                <span class="resource-label">{{ t('pages.marketplace.wordpress.landing.plans.instances') }}</span>
                <span class="resource-value">{{ plan.instances }} {{ getInstancesLabel(plan.instances) }}</span>
              </div>
            </div>

            <VBtn
              block
              color="primary"
              size="large"
              variant="elevated"
              class="plan-btn"
              @click="selectPlan(plan)"
              :aria-label="`Get started with ${plan.name} plan`"
            >
              <VIcon start aria-hidden="true">mdi-cart</VIcon>
              {{ t('pages.marketplace.wordpress.landing.plans.getStarted') }}
            </VBtn>
          </div>
        </div>
      </div>

      <!-- Description Section -->
      <VCard class="section-card description-section">
        <VCardTitle class="section-title">
          {{ t('pages.marketplace.wordpress.landing.description.title') }}
        </VCardTitle>
        <VCardText class="section-text">
          <p>{{ t('pages.marketplace.wordpress.landing.description.content') }}</p>

          <div class="highlights">
            <div
              v-for="(highlight, index) in highlights"
              :key="index"
              class="highlight-item"
            >
              <VIcon :icon="highlight.icon" size="24" :color="highlight.color" />
              <span>{{ highlight.text }}</span>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Trustpilot Reviews Section -->
      <VCard class="section-card trustpilot-section">
        <VCardText class="pa-8">
          <div class="trustpilot-header text-center mb-6">
            <h2 class="text-h4 mb-3 font-weight-bold">{{ t('common.trustpilot.title') }}</h2>
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
        </VCardText>
      </VCard>

      <!-- Global Server Network Section -->
      <VCard class="section-card server-locations-section" role="region" aria-labelledby="server-network-title">
        <VCardText>
          <h2 id="server-network-title" class="locations-title">{{ t('pages.marketplace.wordpress.landing.serverNetwork.title') }}</h2>
          <p class="locations-subtitle">{{ t('pages.marketplace.wordpress.landing.serverNetwork.subtitle') }}</p>

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
              {{ t('pages.marketplace.wordpress.landing.serverNetwork.noData') }}
            </div>
          </div>

          <!-- Stats -->
          <div v-if="fluxNodeCount > 0" class="stats-container">
            <div class="stat-item">
              <VIcon icon="mdi-server-network" size="32" color="primary" />
              <div class="stat-content">
                <div class="stat-value">{{ fluxNodeCount.toLocaleString() }}+</div>
                <div class="stat-label">{{ t('pages.marketplace.wordpress.landing.serverNetwork.activeServers') }}</div>
              </div>
            </div>
            <div class="stat-item">
              <VIcon icon="mdi-earth" size="32" color="primary" />
              <div class="stat-content">
                <div class="stat-value">{{ countryCount }}+</div>
                <div class="stat-label">{{ t('pages.marketplace.wordpress.landing.serverNetwork.countries') }}</div>
              </div>
            </div>
            <div class="stat-item">
              <VIcon icon="mdi-web" size="32" color="primary" />
              <div class="stat-content">
                <div class="stat-value">{{ t('pages.marketplace.wordpress.landing.serverNetwork.global') }}</div>
                <div class="stat-label">{{ t('pages.marketplace.wordpress.landing.serverNetwork.coverage') }}</div>
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Features Section -->
      <VCard class="section-card features-section">
        <VCardTitle class="section-title">
          {{ t('pages.marketplace.wordpress.landing.features.title') }}
        </VCardTitle>
        <VCardText>
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
            {{ t('pages.marketplace.wordpress.faq.title') }}
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

      <!-- Related Links Section -->
      <VCard class="section-card related-links-section">
        <VCardTitle class="section-title">
          Explore More on FluxCloud
        </VCardTitle>
        <VCardText>
          <div class="related-links-grid">
            <RouterLink to="/marketplace" class="related-link-card">
              <VIcon class="related-link-icon" color="primary">mdi-storefront</VIcon>
              <h3 class="related-link-title">Marketplace</h3>
              <p class="related-link-description">Browse all available applications</p>
            </RouterLink>
            <RouterLink to="/marketplace/games" class="related-link-card">
              <VIcon class="related-link-icon" color="success">mdi-gamepad-variant</VIcon>
              <h3 class="related-link-title">Game Servers</h3>
              <p class="related-link-description">Host your favorite game servers</p>
            </RouterLink>
            <RouterLink to="/flux-drive" class="related-link-card">
              <VIcon class="related-link-icon" color="info">mdi-cloud</VIcon>
              <h3 class="related-link-title">FluxDrive</h3>
              <p class="related-link-description">Decentralized file storage</p>
            </RouterLink>
            <RouterLink to="/cost-calculator" class="related-link-card">
              <VIcon class="related-link-icon" color="warning">mdi-calculator</VIcon>
              <h3 class="related-link-title">Cost Calculator</h3>
              <p class="related-link-description">Estimate your hosting costs</p>
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
import { useWordPress } from '@/composables/useWordPress'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import MaintenanceCard from '@/components/Marketplace/MaintenanceCard.vue'
import MapComponent from '@core/components/MapComponent.vue'
import DashboardService from '@/services/DashboardService'

const { t, tm, locale, te } = useI18n()
const router = useRouter()
const { fetchPlans } = useWordPress()

const plans = ref([])
const loadingPlans = ref(false)
const apiError = ref(false)

// Server locations data
const fluxList = ref([])
const fluxNodeCount = ref(0)
const isLoadingMap = ref(true)

// Helper function to get correct Polish plural form for instances
const getInstancesLabel = count => {
  if (locale.value !== 'pl') {
    return t('pages.marketplace.wordpress.form.instances')
  }

  if (count === 1) {
    return t('pages.marketplace.wordpress.form.instance')
  } else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return t('pages.marketplace.wordpress.form.instancesPlural')
  } else {
    return t('pages.marketplace.wordpress.form.instances')
  }
}

// Helper function to translate plan descriptions
const translateDescription = plan => {
  if (!plan || !plan.name) return plan?.description || ''

  const key = `pages.marketplace.wordpress.form.planDescriptions.${plan.name}`
  
  return te(key) ? t(key) : plan.description
}

// Highlights
const highlights = computed(() => [
  {
    icon: 'mdi-shield-check',
    color: 'success',
    text: t('pages.marketplace.wordpress.landing.description.highlights.security'),
  },
  {
    icon: 'mdi-speedometer',
    color: 'info',
    text: t('pages.marketplace.wordpress.landing.description.highlights.performance'),
  },
  {
    icon: 'mdi-cloud-sync',
    color: 'primary',
    text: t('pages.marketplace.wordpress.landing.description.highlights.updates'),
  },
  {
    icon: 'mdi-server-network',
    color: 'warning',
    text: t('pages.marketplace.wordpress.landing.description.highlights.decentralized'),
  },
])

// Features
const features = computed(() => [
  {
    icon: 'mdi-flash',
    color: 'primary',
    title: t('pages.marketplace.wordpress.landing.features.items.quickDeploy.title'),
    description: t('pages.marketplace.wordpress.landing.features.items.quickDeploy.description'),
  },
  {
    icon: 'mdi-database',
    color: 'success',
    title: t('pages.marketplace.wordpress.landing.features.items.mysql.title'),
    description: t('pages.marketplace.wordpress.landing.features.items.mysql.description'),
  },
  {
    icon: 'mdi-lock',
    color: 'warning',
    title: t('pages.marketplace.wordpress.landing.features.items.ssl.title'),
    description: t('pages.marketplace.wordpress.landing.features.items.ssl.description'),
  },
  {
    icon: 'mdi-chart-line',
    color: 'info',
    title: t('pages.marketplace.wordpress.landing.features.items.scalable.title'),
    description: t('pages.marketplace.wordpress.landing.features.items.scalable.description'),
  },
  {
    icon: 'mdi-backup-restore',
    color: 'error',
    title: t('pages.marketplace.wordpress.landing.features.items.backup.title'),
    description: t('pages.marketplace.wordpress.landing.features.items.backup.description'),
  },
  {
    icon: 'mdi-currency-usd-off',
    color: 'success',
    title: t('pages.marketplace.wordpress.landing.features.items.pricing.title'),
    description: t('pages.marketplace.wordpress.landing.features.items.pricing.description'),
  },
  {
    icon: 'mdi-cash-refund',
    color: 'success',
    title: t('pages.marketplace.wordpress.landing.features.items.guarantee.title'),
    description: t('pages.marketplace.wordpress.landing.features.items.guarantee.description'),
  },
])

// Count unique countries
const countryCount = computed(() => {
  const countries = new Set()
  fluxList.value.forEach(flux => {
    if (flux.geolocation?.country) {
      countries.add(flux.geolocation.country)
    }
  })
  
  return countries.size
})

// Helper function to extract string from compiled i18n message objects
const extractString = obj => {
  if (typeof obj === 'string') return obj
  if (obj && typeof obj === 'object') {
    // Try to get the actual string from compiled message object
    return obj.body?.static || obj.loc?.source || obj.static || JSON.stringify(obj)
  }
  
  return String(obj)
}

// FAQs - Use common marketplace FAQ questions
const faqs = computed(() => {
  const faqData = tm('pages.marketplace.common.genericFAQ.questions')

  // Convert to array if it's an object, and map to our format
  if (faqData && typeof faqData === 'object') {
    let faqArray = Array.isArray(faqData) ? faqData : Object.values(faqData)

    // Deep clone to unwrap all proxies
    faqArray = JSON.parse(JSON.stringify(faqArray))

    return faqArray.map(faq => ({
      question: extractString(faq.q || faq.question),
      answer: extractString(faq.a || faq.answer),
    }))
  }

  return []
})

// Generate JSON-LD structured data
const structuredData = computed(() => {
  const schemas = []

  // Organization Schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FluxCloud',
    url: 'https://home.runonflux.io',
    logo: 'https://home.runonflux.io/banner/FluxCloud.png',
    description: 'Decentralized cloud infrastructure powered by Flux',
    sameAs: [
      'https://twitter.com/RunOnFlux',
      'https://github.com/RunOnFlux',
    ],
  })

  // BreadcrumbList Schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://home.runonflux.io',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Marketplace',
        item: 'https://home.runonflux.io/marketplace',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'WordPress Hosting',
        item: 'https://home.runonflux.io/marketplace/wordpress',
      },
    ],
  })

  // Product/Service Schema with offers
  if (plans.value.length > 0) {
    const offers = plans.value.map(plan => ({
      '@type': 'Offer',
      name: `${plan.name} Plan`,
      price: plan.usd.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: 'https://home.runonflux.io/marketplace/wordpress/configure',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: plan.usd.toFixed(2),
        priceCurrency: 'USD',
        unitText: 'MONTH',
      },
    }))

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'WordPress Hosting on FluxCloud',
      description: 'Deploy WordPress websites on the decentralized FluxCloud network with MySQL, SSL, and automatic backups',
      brand: {
        '@type': 'Brand',
        name: 'FluxCloud',
      },
      offers: offers,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '127',
      },
    })
  }

  // FAQPage Schema
  if (faqs.value.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.value.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    })
  }

  return schemas
})

// Load plans
const loadPlans = async () => {
  loadingPlans.value = true
  apiError.value = false
  try {
    const response = await fetchPlans()
    plans.value = response
  } catch (error) {
    console.error('Failed to load plans:', error)
    apiError.value = true
  } finally {
    loadingPlans.value = false
  }
}

// Navigate to configure page with selected plan
const selectPlan = plan => {
  router.push({
    path: '/marketplace/wordpress/configure',
    query: { plan: plan.name },
  })
}

// Fetch server locations data
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

// SEO
useHead({
  title: 'WordPress Hosting on FluxCloud - Decentralized & Scalable',
  meta: [
    {
      name: 'description',
      content: 'Deploy WordPress websites on the decentralized FluxCloud network. Choose from multiple performance plans with MySQL, SSL, and automatic backups. Affordable pricing starting from $25/month.',
    },

    // Open Graph
    { property: 'og:title', content: 'WordPress Hosting on FluxCloud - Decentralized & Scalable' },
    { property: 'og:description', content: 'Deploy WordPress websites on the decentralized FluxCloud network with multiple performance plans. MySQL, SSL, automatic backups included.' },
    { property: 'og:type', content: 'product' },
    { property: 'og:url', content: 'https://home.runonflux.io/marketplace/wordpress' },
    { property: 'og:image', content: 'https://home.runonflux.io/banner/FluxWPMarketplace.png' },
    { property: 'og:image:secure_url', content: 'https://home.runonflux.io/banner/FluxWPMarketplace.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'WordPress Hosting on FluxCloud - Decentralized Infrastructure' },
    { property: 'og:site_name', content: 'FluxCloud' },
    { property: 'og:locale', content: 'en_US' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'WordPress Hosting on FluxCloud - Decentralized & Scalable' },
    { name: 'twitter:description', content: 'Deploy WordPress websites on the decentralized FluxCloud network with MySQL, SSL, and automatic backups.' },
    { name: 'twitter:image', content: 'https://home.runonflux.io/banner/FluxWPMarketplace.png' },
    { name: 'twitter:image:alt', content: 'WordPress Hosting on FluxCloud' },
    { name: 'twitter:site', content: '@RunOnFlux' },

    // Additional SEO
    { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
    { name: 'author', content: 'FluxCloud' },
  ],
  link: [
    { rel: 'canonical', href: 'https://home.runonflux.io/marketplace/wordpress' },
  ],
  script: computed(() =>
    structuredData.value.map(schema => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(schema),
    })),
  ),
})

onMounted(async () => {
  loadPlans()

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
.wordpress-landing {
  padding: 8px 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 100px);
}

.landing-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Breadcrumb Navigation */
.breadcrumb-nav {
  margin-bottom: 16px;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
  gap: 4px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.breadcrumb-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.breadcrumb-link:hover {
  opacity: 0.7;
  text-decoration: underline;
}

.breadcrumb-current {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-weight: 500;
}

.breadcrumb-separator {
  font-size: 16px;
  margin: 0 4px;
  opacity: 0.5;
}

/* Hero Section */
.hero-section {
  background-image: url('/banner/FluxWPMarketplace.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 24px;
  padding: 64px 32px;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 0;
}

.hero-icon-top-right {
  position: absolute;
  top: 32px;
  right: 32px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 90px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  max-width: 800px;
  margin: 0 auto;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.3);
}

/* Section Cards */
.section-card {
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
}

.section-subtitle {
  font-size: 1.1rem;
  text-align: center;
  opacity: 0.7;
  margin-bottom: 32px;
}

.section-text {
  font-size: 1.1rem;
  line-height: 1.8;
}

/* Highlights */
.highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
  border-left: 3px solid rgb(var(--v-theme-primary));
  transition: all 0.3s ease;
}

.highlight-item:hover {
  transform: translateX(8px);
  background: rgba(var(--v-theme-primary), 0.1);
}

/* Plans Section */
.plans-section {
  padding: 32px 0;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

.plan-card {
  position: relative;
  background: rgba(var(--v-theme-surface), 1);
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.plan-card.recommended {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 8px 32px rgba(var(--v-theme-primary), 0.3);
}

.plan-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(33, 150, 243, 0.4);
  border-color: rgba(33, 150, 243, 0.5);
}

.recommended-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  color: white;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.4);
}

.plan-price-badge {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.2) 0%, rgba(var(--v-theme-success), 0.1) 100%);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-success), 0.3);
}

.price-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-success));
  line-height: 1;
}

.price-period {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.7;
}

.plan-header {
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.plan-description {
  font-size: 0.95rem;
  opacity: 0.7;
  margin: 0;
  min-height: 3em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plan-resources {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.resource-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.resource-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  transform: translateX(4px);
}

.resource-icon {
  font-size: 22px;
}

.cpu-icon {
  color: #f97316;
}

.ram-icon {
  color: #06b6d4;
}

.ssd-icon {
  color: #eab308;
}

.instances-icon {
  color: #8b5cf6;
}

.resource-label {
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.resource-value {
  font-size: 0.95rem;
  font-weight: 600;
  text-align: right;
}

.plan-btn {
  margin-top: auto;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  font-size: 1rem;
  min-height: 48px;
  max-height: 48px;
  height: 48px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.plan-btn:hover {
  box-shadow: 0 8px 24px rgba(33, 150, 243, 0.5);
  transform: translateY(-2px);
}

/* Features Section */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.feature-item {
  text-align: center;
  padding: 24px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
  transform: translateY(-4px);
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 50%;
}

.feature-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.feature-text {
  font-size: 0.95rem;
  opacity: 0.7;
  margin: 0;
  line-height: 1.6;
}

/* Server Locations Section */
.server-locations-section .locations-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
  color: rgb(var(--v-theme-primary));
}

.server-locations-section .locations-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 32px;
  opacity: 0.9;
  line-height: 1.6;
}

.map-container {
  position: relative;
  min-height: 400px;
  margin-bottom: 32px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--v-theme-surface), 0.4);
}

.server-map {
  border-radius: 12px;
}

.no-data {
  text-align: center;
  font-size: 18px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  padding: 60px 20px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.2);
  transform: translateY(-2px);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Related Links Section */
.related-links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.related-link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
}

.related-link-card:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-color: rgba(var(--v-theme-primary), 0.3);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.15);
}

.related-link-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.related-link-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.related-link-description {
  font-size: 0.875rem;
  opacity: 0.7;
  margin: 0;
}

/* FAQ Section */
.faq-section .faq-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
  color: rgb(var(--v-theme-primary));
}

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

.faq-answer :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.faq-answer :deep(a:hover) {
  text-decoration: underline;
}

.faq-answer :deep(strong) {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

/* Responsive */
@media (max-width: 960px) {
  .hero-section {
    min-height: 350px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-icon-top-right {
    width: 80px;
    height: 80px;
    top: 20px;
    right: 20px;
  }

  .hero-icon-top-right :deep(.v-icon) {
    font-size: 60px;
  }

  .plans-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  .server-locations-section .locations-title {
    font-size: 1.75rem;
  }

  .server-locations-section .locations-subtitle {
    font-size: 1rem;
  }

  .stats-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .faq-section .faq-title {
    font-size: 1.75rem;
  }

  .question-text {
    font-size: 1rem;
  }

  .faq-answer {
    font-size: 0.9375rem;
  }
}

@media (max-width: 600px) {
  .wordpress-landing {
    padding: 8px 16px;
  }

  .breadcrumb-nav {
    margin-bottom: 12px;
  }

  .breadcrumb-item {
    font-size: 0.75rem;
  }

  .breadcrumb-separator {
    font-size: 14px;
    margin: 0 2px;
  }

  .hero-section {
    padding: 48px 24px;
    min-height: 300px;
  }

  .hero-icon-top-right {
    width: 60px;
    height: 60px;
    top: 16px;
    right: 16px;
  }

  .hero-icon-top-right :deep(.v-icon) {
    font-size: 40px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .highlights {
    grid-template-columns: 1fr;
  }

  .related-links-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .related-link-card {
    padding: 20px;
  }

  .related-link-icon {
    font-size: 40px;
  }

  .server-locations-section .locations-title {
    font-size: 1.5rem;
  }

  .server-locations-section .locations-subtitle {
    font-size: 0.9375rem;
    margin-bottom: 24px;
  }

  .map-container {
    min-height: 300px;
  }

  .stat-item {
    padding: 16px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .faq-section .faq-title {
    font-size: 1.5rem;
  }

  .faq-question {
    padding: 16px;
  }

  .question-wrapper {
    gap: 12px;
  }

  .question-icon {
    font-size: 20px !important;
  }

  .question-text {
    font-size: 0.9375rem;
  }

  .faq-answer {
    padding: 0 16px 16px 16px !important;
    font-size: 0.875rem;
  }
}
</style>
