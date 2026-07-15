<template>
  <!--
    Crawlable internal-link section for the /compare pages. Uses RouterLink
    (renders as real <a href>) with keyword-rich anchor text, on the prerendered
    homepage, so the comparison pages are discoverable by users and crawlers and
    receive internal link equity. Driven by comparisonList so it stays in sync as
    comparisons are added.
  -->
  <section class="comparison-links" aria-labelledby="comparison-links-title">
    <div class="container">
      <h2 id="comparison-links-title" class="section-title">
        FluxCloud vs. the big clouds
      </h2>
      <p class="section-subtitle">
        How decentralized hosting compares to AWS, Google Cloud, Azure, DigitalOcean, Vultr, Linode, Heroku and Akash — on price, resilience and lock-in.
      </p>

      <ul class="links-grid">
        <li
          v-for="item in comparisons"
          :key="item.slug"
          class="link-item"
        >
          <RouterLink :to="`/compare/${item.slug}`" class="comparison-link">
            <VIcon size="24" class="comparison-icon">mdi-scale-balance</VIcon>
            <span class="comparison-text">
              <span class="comparison-name-row">
                <span class="comparison-name">{{ item.linkLabel }}</span>
                <VIcon size="small" class="comparison-arrow">mdi-arrow-top-right</VIcon>
              </span>
              <span class="comparison-desc">{{ item.linkDesc }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>

      <p v-if="guides.length" class="comparison-learn">
        New to this?
        <template v-for="(g, i) in guides" :key="g.slug">
          <RouterLink :to="`/compare/${g.slug}`" class="comparison-learn-link">{{ g.linkLabel }}</RouterLink><span v-if="i < guides.length - 1"> · </span>
        </template>
      </p>
    </div>
  </section>
</template>

<script setup>
import { comparisonList } from '@/content/comparisons'

// "vs X" pages (and the cheapest roundup) render as cards; the explainer guides
// render as a compact "learn" line so the grid stays focused.
const comparisons = comparisonList.filter(c => c.category !== 'guide')
const guides = comparisonList.filter(c => c.category === 'guide')
</script>

<style scoped>
.comparison-links {
  padding: 2rem 1rem 4rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  text-align: center;
  margin: 0 0 0.5rem;
  color: rgb(var(--v-theme-on-surface));
}

.section-subtitle {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0 auto 2.5rem;
  max-width: 680px;
}

.links-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.link-item {
  display: flex;
}

.comparison-link {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  width: 100%;
  padding: 1.1rem 1.2rem;
  border-radius: 14px;
  text-decoration: none;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.comparison-link:hover {
  transform: translateY(-3px);
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.06);
}

.comparison-icon {
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.comparison-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.comparison-name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.comparison-name {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.comparison-desc {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.65);
  line-height: 1.5;
}

.comparison-arrow {
  color: rgba(var(--v-theme-on-surface), 0.4);
  flex-shrink: 0;
}

.comparison-link:hover .comparison-arrow {
  color: rgb(var(--v-theme-primary));
}

.comparison-learn {
  text-align: center;
  margin: 1.75rem 0 0;
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.comparison-learn-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.comparison-learn-link:hover {
  text-decoration: underline;
}
</style>
