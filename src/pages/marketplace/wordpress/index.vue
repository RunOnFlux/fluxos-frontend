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
      <BreadcrumbNav
        :items="[
          { text: 'Home', to: '/' },
          { text: 'Marketplace', to: '/marketplace' },
          { text: 'WordPress Hosting' }
        ]"
      />

      <!-- Hero Section -->
      <HeroSection
        :title="t('pages.marketplace.wordpress.landing.title')"
        :subtitle="t('pages.marketplace.wordpress.landing.subtitle')"
        background-image="/banner/FluxWPMarketplace.png"
        icon="mdi-wordpress"
        icon-aria-label="WordPress Logo"
      />

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
        </VCardText>
      </VCard>

      <!-- Highlights Section -->
      <BenefitsGrid
        :items="highlights"
        :elevation="0"
        padding="24px"
      />

      <!-- Trustpilot Reviews Section -->
      <TrustpilotPanel :stars="4.5" :star-size="32" :show-rating-label="true" />

      <!-- Global Server Network Section -->
      <ServerLocationsPanel
        :panel="serverLocationsPanel"
        :app="{ name: 'wordpress' }"
      />

      <!-- Features Section -->
      <FeatureShowcase
        :title="t('pages.marketplace.wordpress.landing.features.title')"
        :items="features"
        grid-min-width="280px"
      />

      <!-- FAQ Section -->
      <FAQPanel :panel="faqPanel" :app="null" :faqs="faqs" :title="t('pages.marketplace.wordpress.faq.title')" />

      <!-- Related Links Section -->
      <RelatedLinksGrid
        title="Explore More on FluxCloud"
        :links="relatedLinks"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import { useWordPress } from '@/composables/useWordPress'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import MaintenanceCard from '@/components/Marketplace/MaintenanceCard.vue'
import ServerLocationsPanel from '@/components/Marketplace/Panels/ServerLocationsPanel.vue'
import TrustpilotPanel from '@/components/Marketplace/Panels/TrustpilotPanel.vue'
import FAQPanel from '@/components/Marketplace/Panels/FAQPanel.vue'
import FeatureShowcase from '@/components/FeatureShowcase.vue'
import BenefitsGrid from '@/components/BenefitsGrid.vue'
import RelatedLinksGrid from '@/components/RelatedLinksGrid.vue'
import HeroSection from '@/components/HeroSection.vue'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'

const { t, tm, locale, te } = useI18n()
const router = useRouter()
const { fetchPlans } = useWordPress()

const plans = ref([])
const loadingPlans = ref(false)
const apiError = ref(false)

// Server Locations Panel Configuration
const serverLocationsPanel = {
  enabled: true,
  title: 'i18n:pages.marketplace.wordpress.landing.serverNetwork.title',
  subtitle: 'i18n:pages.marketplace.wordpress.landing.serverNetwork.subtitle',
}

// FAQ Panel Configuration
const faqPanel = {
  enabled: true,
  title: '',
  subtitle: '',
  questions: [],
}

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

// Related links
const relatedLinks = [
  {
    to: '/marketplace',
    icon: 'mdi-storefront',
    color: 'primary',
    title: 'Marketplace',
    description: 'Browse all available applications',
  },
  {
    to: '/marketplace/games',
    icon: 'mdi-gamepad-variant',
    color: 'success',
    title: 'Game Servers',
    description: 'Host your favorite game servers',
  },
  {
    to: '/flux-drive',
    icon: 'mdi-cloud',
    color: 'info',
    title: 'FluxDrive',
    description: 'Decentralized file storage',
  },
  {
    to: '/cost-calculator',
    icon: 'mdi-calculator',
    color: 'warning',
    title: 'Cost Calculator',
    description: 'Estimate your hosting costs',
  },
]

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

onMounted(() => {
  loadPlans()
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

/* Responsive */
@media (max-width: 960px) {
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

  .plans-grid {
    grid-template-columns: 1fr;
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
