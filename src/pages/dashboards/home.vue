<template>
  <LandingServices />
  <HostingServicesLinks />
  <FAQPanel
    :panel="{ enabled: true, padding: { top: 64, right: 0, bottom: 0, left: 0 } }"
    :app="null"
    :faqs="homepageFaqs"
    :title="t('landingServices.faq.title')"
  />
</template>

<script setup>
import { onMounted, computed } from 'vue'
import LandingServices from "@/components/LandingServices.vue"
import HostingServicesLinks from "@/components/HostingServicesLinks.vue"
import FAQPanel from '@/components/Marketplace/Panels/FAQPanel.vue'
import { useI18n } from "vue-i18n"
import { useHead } from '@unhead/vue'
import { generateFAQSchema } from '@/composables/useSEO'
import { useAnalytics } from '@/plugins/metrics/composables/useAnalytics'

const { t } = useI18n()
const analytics = useAnalytics()

// Track home page view on mount
onMounted(() => {
  analytics.trackEvent('page_view', {
    page: 'home',
  })
})

// SEO meta tags
const title = 'FluxCloud - Decentralized Web3 Cloud Infrastructure'
const description = 'Deploy apps on FluxCloud\'s decentralized Web3 infrastructure. Host games, WordPress, custom apps on thousands of FluxNodes across 50+ countries. From $0.99/month.'
const pageUrl = 'https://cloud.runonflux.com/'
const imageUrl = 'https://cloud.runonflux.com/images/logo.png'

// Site-wide Organization / WebSite / Service structured data is declared
// statically in index.html so it is present on every served HTML (prerendered
// snapshot and live SPA shell alike). The homepage-specific SoftwareApplication
// schema below is injected here so it is scoped to '/' only and not leaked onto
// every route — the homepage is prerendered, so the snapshot captures it.
// No aggregateRating is emitted: ratings are never fabricated (see docs/seo.md).
const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  'name': 'FluxCloud',
  'description': 'Decentralized Web3 cloud platform to deploy Docker apps, game servers, WordPress sites and blockchain nodes across thousands of FluxNodes in 50+ countries.',
  'url': pageUrl,
  'image': 'https://cloud.runonflux.com/images/og-image.png',
  'operatingSystem': 'Web',
  'applicationCategory': 'BusinessApplication',
  'offers': {
    '@type': 'Offer',
    'price': '0.99',
    'priceCurrency': 'USD',
    'availability': 'https://schema.org/InStock',
    'url': 'https://cloud.runonflux.com/cost-calculator',
    'description': 'Application hosting from $0.99/month, pay-as-you-go pricing.',
  },
  'featureList': [
    'Docker application deployment',
    'Git-based deployment (Flux Orbit)',
    'Game server hosting',
    'WordPress hosting',
    'Blockchain node hosting',
    'Decentralized IPFS file storage (FluxDrive)',
  ],
  'provider': {
    '@type': 'Organization',
    'name': 'Flux Network',
    'url': 'https://runonflux.com',
  },
}

// Homepage FAQ — the visible content (rendered via FAQPanel) and the matching
// FAQPage structured data are built from the same source so they stay in sync.
// FAQPage schema requires the answers to be visible on the page, which the panel
// provides. Computed so @unhead tracks locale changes.
const homepageFaqs = computed(() => [
  'whatIsFluxCloud',
  'cost',
  'whatCanDeploy',
  'vsTraditional',
  'signIn',
  'security',
].map(key => ({
  question: t(`landingServices.faq.questions.${key}.question`),
  answer: t(`landingServices.faq.questions.${key}.answer`),
})))

const faqSchema = computed(() => generateFAQSchema(homepageFaqs.value))

useHead({
  title,
  meta: [
    { name: 'description', content: description },
    { name: 'keywords', content: 'decentralized cloud, Web3 hosting, blockchain infrastructure, FluxNodes, decentralized apps, game server hosting, WordPress hosting, docker hosting, container hosting, affordable cloud hosting' },

    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: imageUrl },
    { property: 'og:url', content: pageUrl },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'FluxCloud' },
    { property: 'og:locale', content: 'en_US' },

    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:site', content: '@RunOnFlux' },
    { name: 'twitter:creator', content: '@RunOnFlux' },
  ],
  link: [
    { rel: 'canonical', href: pageUrl },
  ],
  script: computed(() => [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(softwareApplicationSchema),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(faqSchema.value),
    },
  ]),
})

const sections = computed(() => [
  {
    title: t("sections.dashboard.title"),
    icon: "tabler-device-desktop",
    description: t("sections.dashboard.description"),
  },
  {
    title: t("sections.application.title"),
    icon: "mdi-apps",
    description: t("sections.application.description"),
  },
  {
    title: t("sections.administration.title"),
    icon: "mdi-shield-account",
    description: t("sections.administration.description"),
  },
  {
    title: t("sections.fluxXdao.title"),
    icon: "mdi-account-group",
    description: t("sections.fluxXdao.description"),
  },
])
</script>

<style scoped>
/* Adjust card size */
.responsive-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  height: 100%;
}
</style>
