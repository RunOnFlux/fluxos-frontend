<template>
  <LandingServices />
</template>

<script setup>
import { onMounted, computed } from 'vue'
import LandingServices from "@/components/LandingServices.vue"
import { useI18n } from "vue-i18n"
import { useHead } from '@vueuse/head'
import { useAnalytics } from '@/plugins/analytics/composables/useAnalytics'

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
const description = 'Deploy apps on FluxCloud\'s decentralized Web3 infrastructure. Host games, WordPress, custom apps on 8,000+ FluxNodes worldwide. From $0.99/month.'
const pageUrl = 'https://cloud.runonflux.com/'
const imageUrl = 'https://cloud.runonflux.com/images/logo.png'

// Structured data schemas
const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Flux Network',
    url: 'https://cloud.runonflux.com',
    logo: 'https://cloud.runonflux.com/images/logo.png',
    description: 'Decentralized Web3 cloud infrastructure powered by FluxNodes worldwide',
    sameAs: [
      'https://twitter.com/RunOnFlux',
      'https://github.com/RunOnFlux',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FluxCloud',
    url: 'https://cloud.runonflux.com',
    description: description,
    publisher: {
      '@type': 'Organization',
      name: 'Flux Network',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cloud.runonflux.com/images/logo.png',
      },
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Cloud Hosting',
    provider: {
      '@type': 'Organization',
      name: 'Flux Network',
    },
    areaServed: 'Worldwide',
    description: 'Decentralized cloud hosting for games, WordPress, and custom applications',
    offers: {
      '@type': 'Offer',
      price: '0.99',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '0.99',
        priceCurrency: 'USD',
        unitText: 'monthly',
      },
    },
  },
]

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
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(structuredData),
    },
  ],
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
