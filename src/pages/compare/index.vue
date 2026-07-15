<template>
  <div class="compare-index">
    <div class="compare-index-head">
      <BreadcrumbNav :items="breadcrumbItems" class="compare-index-breadcrumb" />
      <h1 class="compare-index-h1">Cloud hosting comparisons</h1>
      <p class="compare-index-lead">
        See how FluxCloud’s decentralized cloud compares to the major providers on price,
        resilience and lock-in — the same instance, priced live — plus plain-English guides
        to decentralized and Web3 hosting.
      </p>
    </div>

    <ComparisonLinks />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'
import ComparisonLinks from '@/components/ComparisonLinks.vue'
import { useSEO, generateBreadcrumbSchema } from '@/composables/useSEO'
import { comparisonList } from '@/content/comparisons'

const SITE = 'https://cloud.runonflux.com'
const pageUrl = `${SITE}/compare`

const breadcrumbItems = [
  { text: 'Home', to: '/' },
  { text: 'Compare' },
]

// ItemList of the comparison/guide pages so the hub advertises its collection.
const itemListSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  'name': 'Cloud hosting comparisons',
  'itemListElement': comparisonList.map((c, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': c.linkLabel,
    'url': `${SITE}/compare/${c.slug}`,
  })),
}))

useSEO({
  title: 'Cloud Hosting Comparisons — FluxCloud vs AWS, Google Cloud, Azure & More',
  description:
    'Compare FluxCloud’s decentralized cloud to AWS, Google Cloud, Azure, DigitalOcean, Vultr, Linode and Akash on price, resilience and lock-in — plus guides to decentralized and Web3 hosting.',
  url: pageUrl,
  type: 'website',
  structuredData: computed(() => [
    generateBreadcrumbSchema([
      { name: 'Home', url: `${SITE}/` },
      { name: 'Compare', url: pageUrl },
    ]),
    itemListSchema.value,
  ]),
})
</script>

<style scoped>
.compare-index {
  width: 100%;
}

.compare-index-head {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 0;
}

.compare-index-breadcrumb {
  margin-bottom: 1rem;
}

.compare-index-h1 {
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 0.75rem;
  color: rgb(var(--v-theme-on-surface));
}

.compare-index-lead {
  font-size: 1.15rem;
  line-height: 1.7;
  opacity: 0.9;
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .compare-index-h1 {
    font-size: 1.75rem;
  }
}
</style>
