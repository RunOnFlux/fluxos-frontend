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
            :note="methodologyNote"
            :highlight-competitor="entry.tableCompetitor"
            @price-resolved="markReady"
          />

          <p class="price-sources">
            Competitor prices from each provider’s public pricing pages:
            <template v-for="(s, i) in priceSources" :key="s.name">
              <a :href="s.url" target="_blank" rel="noopener noreferrer nofollow">{{ s.name }}</a><span v-if="i < priceSources.length - 1"> · </span>
            </template>
          </p>
        </VCardText>
      </VCard>

      <!--
        At-a-glance feature comparison (unique per provider — good for scanning
        and for AI/search extraction) 
      -->
      <div v-if="entry.featureRows" class="feature-compare">
        <h2 class="feature-compare-title">At a glance: FluxCloud vs {{ rivalName }}</h2>
        <div class="feature-table">
          <div class="feature-row feature-head">
            <div class="feature-cell">Feature</div>
            <div class="feature-cell feature-flux">FluxCloud</div>
            <div class="feature-cell">{{ rivalName }}</div>
          </div>
          <div
            v-for="row in entry.featureRows"
            :key="row.feature"
            class="feature-row"
          >
            <div class="feature-cell feature-label" data-label="Feature">{{ row.feature }}</div>
            <div class="feature-cell feature-flux" data-label="FluxCloud">
              <VIcon icon="mdi-check-circle" size="16" color="success" class="feature-tick" />{{ row.flux }}
            </div>
            <div class="feature-cell" :data-label="rivalName">{{ row.rival }}</div>
          </div>
        </div>
      </div>

      <div class="compare-body article" v-html="entry.bodyHtml"></div>

      <FAQPanel
        :panel="faqPanel"
        :app="null"
        :faqs="entry.faqs"
        title="Frequently asked questions"
        class="compare-faq"
      />

      <CtaSection
        :title="ctaTitle"
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
        :links="relatedLinks"
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
import { comparisons, comparisonList, METHODOLOGY_NOTE, PRICE_SOURCES } from '@/content/comparisons'

const route = useRoute()

const entry = computed(() => comparisons[route.params.slug])

const SITE = 'https://cloud.runonflux.com'
const pageUrl = computed(() => `${SITE}/compare/${route.params.slug}`)
const methodologyNote = METHODOLOGY_NOTE
const priceSources = PRICE_SOURCES

// Label for the rival column of the feature table — the competitor, or a generic
// stand-in for the roundup/guide pages that don't target a single provider.
const rivalName = computed(() => entry.value?.competitor || 'Traditional clouds')

// CTA heading: an explicit ctaTitle wins; otherwise derive from the competitor,
// falling back to a generic line for roundup pages (competitor: null).
const ctaTitle = computed(() =>
  entry.value?.ctaTitle
  || (entry.value?.competitor
    ? `Ready to try the alternative to ${entry.value.competitor}?`
    : 'Ready to deploy on the decentralized cloud?'),
)

// "Keep exploring": cross-link the other comparison pages (internal-linking for
// SEO) plus the key tools. Stays in sync as comparisons are added.
const TOOL_LINKS = [
  {
    title: 'Cost calculator',
    description: 'Estimate your exact monthly cost by CPU, RAM, storage and instances.',
    to: '/cost-calculator',
    icon: 'mdi-calculator-variant-outline',
  },
  {
    title: 'Deploy an app',
    description: 'Launch a Docker app or a Git repository in about 30 seconds.',
    to: '/apps/register',
    icon: 'mdi-rocket-launch-outline',
  },
]

const relatedLinks = computed(() => {
  const others = comparisonList
    .filter(c => c.slug !== route.params.slug)
    .slice(0, 3)
    .map(c => ({
      title: c.linkLabel,
      description: c.linkDesc,
      to: `/compare/${c.slug}`,
      icon: 'mdi-scale-balance',
    }))

  return [...others, ...TOOL_LINKS]
})

// Hold the prerender snapshot until the live price has settled (released by the
// PricingComparisonTable @price-resolved event). markReady is a no-op if the
// page has no entry (see below).
const { markReady } = usePrerenderReady()

// FAQPanel requires a panel object; the visible FAQ + schema come from entry.faqs.
const faqPanel = { enabled: true, title: '', subtitle: '', questions: [] }

const breadcrumbItems = computed(() => [
  { text: 'Home', to: '/' },
  { text: 'Compare', to: '/compare' },
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
        { name: 'Compare', url: `${SITE}/compare` },
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

.price-sources {
  margin: 1rem 0 0;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.55);
  line-height: 1.6;
}

.price-sources a {
  color: rgba(var(--v-theme-on-surface), 0.75);
  text-decoration: none;
}

.price-sources a:hover {
  text-decoration: underline;
}

/* At-a-glance feature comparison table */
.feature-compare {
  margin: 2rem 0;
}

.feature-compare-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: rgb(var(--v-theme-on-surface));
}

.feature-table {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.feature-row {
  display: grid;
  grid-template-columns: 1.1fr 1.4fr 1.4fr;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  align-items: start;
  font-size: 0.95rem;
}

.feature-head {
  background: rgb(var(--v-theme-primary));
  color: white;
  font-weight: 600;
}

.feature-label {
  font-weight: 600;
}

.feature-flux {
  color: rgb(var(--v-theme-on-surface));
}

.feature-head .feature-flux {
  color: white;
}

.feature-tick {
  margin-right: 0.35rem;
  vertical-align: -0.15rem;
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

  .feature-row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
    padding: 1rem;
  }

  .feature-head {
    display: none;
  }

  .feature-cell::before {
    content: attr(data-label);
    display: block;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-weight: 600;
    color: rgba(var(--v-theme-on-surface), 0.5);
    margin-bottom: 0.1rem;
  }

  .feature-label::before {
    content: none;
  }

  .feature-label {
    font-size: 1.05rem;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    padding-bottom: 0.5rem;
    margin-bottom: 0.35rem;
  }
}
</style>
