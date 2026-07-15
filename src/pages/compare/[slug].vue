<template>
  <div v-if="entry" class="compare-page">
    <div class="compare-content">
      <BreadcrumbNav :items="breadcrumbItems" class="compare-breadcrumb" />

      <h1 class="compare-h1">{{ entry.h1 }}</h1>
      <p v-if="entry.heroSubtitle" class="compare-hero-subtitle">{{ entry.heroSubtitle }}</p>

      <!-- Authored, trusted long-form content (not user input) -->
      <div class="compare-intro article" v-html="entry.intro"></div>

      <!-- Live price comparison (single source of truth via usePricingComparison) -->
      <VCard class="section-card" elevation="0">
        <VCardText>
          <PricingComparisonTable
            :title="entry.tableTitle"
            :note="entry.tableNote"
            @price-resolved="markReady"
          />
        </VCardText>
      </VCard>

      <div class="compare-body article" v-html="entry.bodyHtml"></div>

      <FAQPanel
        :panel="faqPanel"
        :app="null"
        :faqs="entry.faqs"
        title="Frequently asked questions"
        class="compare-faq"
      />

      <CtaSection
        :title="`Ready to try the alternative to ${entry.competitor}?`"
        subtitle="Deploy in about 30 seconds across 50+ regions. From $0.99/month — pay-as-you-go, no lock-in."
        button-text="Deploy your app"
        icon="mdi-rocket-launch-outline"
        icon-color="white"
        card-color="primary"
        card-variant="flat"
        button-icon="mdi-plus-circle"
        button-icon-position="start"
        padding-class="text-center"
        button-to="/apps/register"
      />

      <RelatedLinksGrid
        title="Keep exploring"
        :links="entry.related"
      />
    </div>
  </div>

  <!--
    Unknown slug: render a lightweight, noindex not-found instead of silently
    redirecting (an imperative redirect races with route resolution during
    prerender and can bake the homepage into this URL's snapshot). 
  -->
  <div v-else class="compare-page compare-notfound">
    <div class="compare-content">
      <h1 class="compare-h1">Comparison not found</h1>
      <p class="compare-hero-subtitle">
        That comparison doesn’t exist. Explore
        <RouterLink to="/compare/flux-vs-aws">FluxCloud vs AWS</RouterLink> or head back
        <RouterLink to="/">home</RouterLink>.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'
import PricingComparisonTable from '@/components/PricingComparisonTable.vue'
import FAQPanel from '@/components/Marketplace/Panels/FAQPanel.vue'
import CtaSection from '@/components/CtaSection.vue'
import RelatedLinksGrid from '@/components/RelatedLinksGrid.vue'
import {
  useSEO,
  usePrerenderReady,
  generateArticleSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
} from '@/composables/useSEO'
import { comparisons } from '@/content/comparisons'

const route = useRoute()

const entry = computed(() => comparisons[route.params.slug])

const SITE = 'https://cloud.runonflux.com'
const pageUrl = computed(() => `${SITE}/compare/${route.params.slug}`)

// Hold the prerender snapshot until the live price has settled (released by the
// PricingComparisonTable @price-resolved event). markReady is a no-op if the
// page has no entry (see below).
const { markReady } = usePrerenderReady()

// FAQPanel requires a panel object; the visible FAQ + schema come from entry.faqs.
const faqPanel = { enabled: true, title: '', subtitle: '', questions: [] }

const breadcrumbItems = computed(() => [
  { text: 'Home', to: '/' },
  { text: 'Compare', to: '/compare/flux-vs-aws' },
  { text: entry.value?.breadcrumbLabel || 'Compare' },
])

// SEO: only wire meta/schema when the slug resolves to real content. Reactive
// refs so @unhead picks up the resolved values before the prerender snapshot.
useSEO({
  title: computed(() => entry.value?.metaTitle || 'Compare — FluxCloud'),
  description: computed(() => entry.value?.metaDescription || ''),
  url: pageUrl,
  type: 'article',
  robots: computed(() => (entry.value ? 'index, follow' : 'noindex, follow')),
  structuredData: computed(() => {
    if (!entry.value) return []

    return [
      generateArticleSchema({
        headline: entry.value.h1,
        description: entry.value.metaDescription,
        url: pageUrl.value,
        image: `${SITE}/images/og-image.png`,
        datePublished: entry.value.datePublished,
        dateModified: entry.value.dateModified || entry.value.datePublished,
      }),
      generateFAQSchema(entry.value.faqs),
      generateBreadcrumbSchema([
        { name: 'Home', url: `${SITE}/` },
        { name: entry.value.breadcrumbLabel, url: pageUrl.value },
      ]),
    ]
  }),
})

onMounted(async () => {
  // Wait for route resolution to settle before judging the slug — reading entry
  // synchronously here races with the router during prerender. For a valid slug
  // the PricingComparisonTable releases the snapshot via @price-resolved; only an
  // genuinely unknown slug needs to release it here (the not-found has no table).
  await nextTick()
  if (!entry.value) markReady()
})
</script>

<style scoped>
.compare-page {
  width: 100%;
  padding: 1.5rem;
}

.compare-content {
  max-width: 900px;
  margin: 0 auto;
}

.compare-breadcrumb {
  margin-bottom: 1rem;
}

.compare-h1 {
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 0.75rem;
  color: rgb(var(--v-theme-on-surface));
}

.compare-hero-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

/* Shared long-form article typography (intro + body) */
.article {
  font-size: 1.0625rem;
  line-height: 1.75;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.article :deep(.lead) {
  font-size: 1.15rem;
  line-height: 1.7;
}

.article :deep(h2) {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 2.25rem 0 0.75rem;
  color: rgb(var(--v-theme-on-surface));
}

.article :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.5rem;
}

.article :deep(p) {
  margin-bottom: 1rem;
}

.article :deep(ul),
.article :deep(ol) {
  margin: 0 0 1rem 1.25rem;
}

.article :deep(li) {
  margin-bottom: 0.5rem;
}

.article :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.article :deep(a:hover) {
  text-decoration: underline;
}

.section-card {
  margin: 1.5rem 0;
  background: transparent;
}

.compare-faq {
  margin-top: 2.5rem;
}

@media (max-width: 600px) {
  .compare-page {
    padding: 1rem;
  }

  .compare-h1 {
    font-size: 1.75rem;
  }
}
</style>
