<template>
  <LandingServices />
</template>

<script setup>
import LandingServices from "@/components/LandingServices.vue"
import { useI18n } from "vue-i18n"
import { useHead } from '@vueuse/head'

const { t } = useI18n()

// SEO meta tags
const title = 'FluxCloud - Decentralized Web3 Cloud Infrastructure'
const description = 'Deploy applications on FluxCloud\'s decentralized Web3 infrastructure. Host games, WordPress sites, and custom apps on a network of 8,000+ FluxNodes worldwide. Starting at $0.99/month.'
const pageUrl = 'https://home.runonflux.io/'
const imageUrl = 'https://home.runonflux.io/images/logo.png'

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
