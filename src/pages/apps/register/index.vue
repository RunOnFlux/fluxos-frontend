<template>
  <div class="app-register-landing">
    <!-- Content -->
    <div class="landing-content">
      <!-- Breadcrumb Navigation -->
      <BreadcrumbNav
        :items="[
          { text: 'Home', to: '/' },
          { text: 'Applications', to: '/apps/management' },
          { text: 'Deploy New App' }
        ]"
      />

      <!-- Hero Section -->
      <HeroSection
        :title="t('pages.apps.register.landing.title')"
        :subtitle="heroSubtitle"
        background-image="/banner/FluxDeploy.png"
        overlay-gradient="linear-gradient(135deg, rgba(var(--v-theme-primary), 0.5) 0%, rgba(var(--v-theme-secondary), 0.5) 100%)"
        icon="mdi-cloud-upload"
        icon-aria-label="Flux Cloud Logo"
        show-cta
        :cta-text="t('pages.apps.register.landing.getStarted')"
        cta-icon="mdi-rocket-launch"
        :cta-to="{ name: 'apps-register-configure' }"
      />

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
      <FeatureShowcase
        :title="t('pages.apps.register.landing.benefits.title')"
        :items="benefits"
        grid-min-width="300px"
      />

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
                <div class="comparison-cell">Instances</div>
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
                <div class="comparison-cell">{{ provider.instances }}</div>
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
      <TrustpilotPanel :stars="4.5" :star-size="32" :show-rating-label="true" />

      <!-- Global Server Network Section -->
      <ServerLocationsPanel
        :panel="serverLocationsPanel"
        :app="{ name: 'apps-register' }"
      />

      <!-- Features Section -->
      <FeatureShowcase
        :title="t('pages.apps.register.landing.features.title')"
        :items="features"
        grid-min-width="300px"
      />

      <!-- FAQ Section -->
      <FAQPanel :panel="faqPanel" :app="null" :faqs="faqs" :title="t('pages.apps.register.landing.faq.title')" />

      <!-- CTA Section -->
      <CtaSection
        :title="t('pages.apps.register.landing.cta.title')"
        :subtitle="t('pages.apps.register.landing.cta.subtitle')"
        :button-text="t('pages.apps.register.landing.cta.button')"
        icon="mdi-rocket-launch-outline"
        icon-color="primary"
        button-icon="mdi-plus-circle"
        button-icon-position="start"
        :button-to="{ name: 'apps-register-configure' }"
        padding-class="text-center"
      />

      <!-- Related Links Section -->
      <RelatedLinksGrid
        :title="t('pages.apps.register.landing.relatedLinks.title')"
        :links="relatedLinks"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import ServerLocationsPanel from '@/components/Marketplace/Panels/ServerLocationsPanel.vue'
import TrustpilotPanel from '@/components/Marketplace/Panels/TrustpilotPanel.vue'
import FAQPanel from '@/components/Marketplace/Panels/FAQPanel.vue'
import FeatureShowcase from '@/components/FeatureShowcase.vue'
import RelatedLinksGrid from '@/components/RelatedLinksGrid.vue'
import HeroSection from '@/components/HeroSection.vue'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'
import CtaSection from '@/components/CtaSection.vue'

const { t } = useI18n()

// Server Locations Panel Configuration
const serverLocationsPanel = {
  enabled: true,
  title: 'i18n:pages.apps.register.landing.serverNetwork.title',
  subtitle: 'i18n:pages.apps.register.landing.serverNetwork.subtitle',
}

// FAQ Panel Configuration
const faqPanel = {
  enabled: true,
  title: '',
  subtitle: '',
  questions: [],
}

// FluxCloud pricing data
const fluxCloudPrice = ref('$8.99') // Default fallback price
const fluxCloudPriceLoading = ref(true)

// Hero subtitle
const heroSubtitle = 'Experience the power of truly decentralized cloud computing. Deploy Docker containers, web apps, APIs, and microservices on our global decentralized network.'

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
  {
    icon: 'mdi-domain',
    color: 'info',
    title: t('pages.apps.register.landing.benefits.freeDomain.title'),
    description: t('pages.apps.register.landing.benefits.freeDomain.description'),
  },
  {
    icon: 'mdi-swap-horizontal',
    color: 'primary',
    title: t('pages.apps.register.landing.benefits.loadBalancer.title'),
    description: t('pages.apps.register.landing.benefits.loadBalancer.description'),
  },
])

// Pricing comparison data
const pricingComparison = computed(() => [
  {
    name: 'FluxCloud',
    instances: '3',
    cpu: '2 vCPU',
    ram: '4 GB',
    storage: '20 GB SSD',
    price: fluxCloudPriceLoading.value ? t('pages.costCalculator.calculating') : fluxCloudPrice.value,
    highlighted: true,
  },
  {
    name: 'AWS EC2',
    instances: '1',
    cpu: '2 vCPU',
    ram: '4 GB',
    storage: '20 GB SSD',
    price: '$33.12',
    highlighted: false,
  },
  {
    name: 'Google Cloud',
    instances: '1',
    cpu: '2 vCPU',
    ram: '4 GB',
    storage: '20 GB SSD',
    price: '$29.80',
    highlighted: false,
  },
  {
    name: 'Azure',
    instances: '1',
    cpu: '2 vCPU',
    ram: '4 GB',
    storage: '20 GB SSD',
    price: '$31.39',
    highlighted: false,
  },
  {
    name: 'DigitalOcean',
    instances: '1',
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

// Related links data
const relatedLinks = computed(() => [
  {
    to: '/marketplace',
    icon: 'mdi-storefront',
    color: 'primary',
    title: t('pages.apps.register.landing.relatedLinks.marketplace'),
    description: t('pages.apps.register.landing.relatedLinks.marketplaceDesc'),
  },
  {
    to: '/marketplace/wordpress',
    icon: 'mdi-wordpress',
    color: 'info',
    title: t('pages.apps.register.landing.relatedLinks.wordpress'),
    description: t('pages.apps.register.landing.relatedLinks.wordpressDesc'),
  },
  {
    to: '/marketplace/games',
    icon: 'mdi-gamepad-variant',
    color: 'success',
    title: t('pages.apps.register.landing.relatedLinks.gaming'),
    description: t('pages.apps.register.landing.relatedLinks.gamingDesc'),
  },
  {
    to: '/cost-calculator',
    icon: 'mdi-calculator',
    color: 'warning',
    title: t('pages.apps.register.landing.relatedLinks.calculator'),
    description: t('pages.apps.register.landing.relatedLinks.calculatorDesc'),
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

// Calculate FluxCloud price from cost calculator API
const calculateFluxCloudPrice = async () => {
  try {
    fluxCloudPriceLoading.value = true

    // Specifications matching the pricing comparison table
    // 2 vCPU, 4 GB RAM, 20 GB SSD, 3 instances (minimum), 1 month
    // Post-fork: 88000 blocks = 1 month (30 days)
    const expire = 88000

    const payload = JSON.stringify({
      version: 8,
      name: "pricingcalc",
      description: "Pricing comparison calculation",
      owner: "176iuPFBqD4yg3Fd7oPVhB3d4NXWxvQyxx",
      compose: [{
        name: "component",
        description: "component",
        repotag: "runonflux/jetpack2:latest",
        ports: [3000],
        domains: [""],
        environmentParameters: [""],
        commands: [""],
        containerPorts: [3000],
        containerData: "/tmp",
        cpu: "2",
        ram: "4000",
        hdd: "20",
        tiered: false,
      }],
      instances: 3,
      nodes: [],
      contacts: [""],
      geolocation: [""],
      expire: expire,
      enterprise: "",
      staticip: false,
    })

    const response = await Api().post(
      '/apps/calculatefiatandfluxprice',
      payload,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      },
    )

    if (response.data.status !== 'error' && response.data.data?.usd) {
      const usdPrice = parseFloat(response.data.data.usd)
      fluxCloudPrice.value = `$${usdPrice.toFixed(2)}`
      console.log('FluxCloud price calculated:', fluxCloudPrice.value)
    } else {
      console.warn('Failed to calculate price, using default:', response.data)
    }
  } catch (error) {
    console.error('Error calculating FluxCloud price:', error)
    // Keep default price on error
  } finally {
    fluxCloudPriceLoading.value = false
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
  // Load pricing data
  try {
    await calculateFluxCloudPrice()
  } catch (error) {
    console.error('Error loading data:', error)
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

/* Section Cards */
.section-card {
  margin-bottom: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}

/* First section card after hero needs top margin */
.app-types-section {
  margin-top: 2rem;
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
  grid-template-columns: 2fr 0.8fr 1fr 1fr 1fr 1fr;
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
  .section-title {
    font-size: 1.5rem;
  }

  .map-container {
    height: 300px;
  }
}
</style>
