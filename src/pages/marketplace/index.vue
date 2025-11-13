<template>
  <div class="marketplace-container">
    <!-- Initial Loading State -->
    <LoadingSpinner
      v-if="isInitialLoading"
      icon="mdi-store"
      :icon-size="56"
      :title="t('pages.marketplace.loading')"
    />

    <!-- Maintenance Mode -->
    <MaintenanceCard
      v-else-if="error || (!isInitialLoading && apps.length === 0)"
      :title="t('pages.marketplace.maintenanceTitle')"
      :subtitle="t('pages.marketplace.maintenanceSubtitle')"
      :loading="loading"
      @retry="handleRefresh"
    />

    <!-- Dynamic Layout based on FluxCloud responsive breakpoints -->
    <div v-else-if="isLargeScreen && isLargeHeight" class="layout-large-large">
      <!-- Top Row: Discover + New Listed -->
      <div class="top-row">
        <div class="discover-section">
          <DiscoverCard :height="150" />
        </div>
        <div class="new-listed-section">
          <NewListedCard :apps="newApps" :loading="loading" />
        </div>
      </div>
      <!-- Second Row: Sponsored Apps -->
      <div class="sponsored-row">
        <SponsoredCard :apps="sponsoredApps" :loading="loading" />
      </div>
      <!-- Third Row: Main Apps Grid -->
      <div class="apps-grid-section">
        <AppsGrid
          :apps="filteredApps"
          :loading="loading"
          :search-query="searchQuery"
          :selected-category="selectedCategory"
          :sort-by="sortBy"
          :categories="categories"
          :marketplace-categories="marketplaceCategories"
          @update:search="searchQuery = $event"
          @update:category="selectedCategory = $event"
          @update:sort="sortBy = $event"
          @deploy="handleDeploy"
          @refresh="handleRefresh"
        />
      </div>
    </div>

    <div v-else-if="isLargeScreen && !isLargeHeight" class="layout-large-small">
      <!-- Top Row: Discover + New Listed -->
      <div class="compact-top-row">
        <div class="discover-section compact">
          <DiscoverCard :height="150" />
        </div>
        <div class="new-listed-section compact">
          <NewListedCard :apps="newApps" :loading="loading" compact />
        </div>
      </div>
      <!-- Second Row: Sponsored Apps -->
      <div class="sponsored-row compact">
        <SponsoredCard :apps="sponsoredApps" :loading="loading" compact />
      </div>
      <!-- Third Row: Main Apps Grid -->
      <div class="apps-grid-section">
        <AppsGrid
          :apps="filteredApps"
          :loading="loading"
          compact
          :search-query="searchQuery"
          :selected-category="selectedCategory"
          :sort-by="sortBy"
          :categories="categories"
          :marketplace-categories="marketplaceCategories"
          @update:search="searchQuery = $event"
          @update:category="selectedCategory = $event"
          @update:sort="sortBy = $event"
          @deploy="handleDeploy"
          @refresh="handleRefresh"
        />
      </div>
    </div>

    <div v-else-if="!isLargeScreen && isLargeHeight" class="layout-small-large">
      <DiscoverCard />
      <NewListedCard :apps="newApps" :loading="loading" />
      <SponsoredCard :apps="sponsoredApps" :loading="loading" />
      <AppsGrid
        :apps="filteredApps"
        :loading="loading"
        mobile
        :search-query="searchQuery"
        :selected-category="selectedCategory"
        :sort-by="sortBy"
        :categories="categories"
        :marketplace-categories="marketplaceCategories"
        @update:search="searchQuery = $event"
        @update:category="selectedCategory = $event"
        @update:sort="sortBy = $event"
        @deploy="handleDeploy"
        @refresh="handleRefresh"
      />
    </div>

    <div v-else class="layout-small-small">
      <!-- Each section on its own line for mobile -->
      <div class="discover-section mobile">
        <DiscoverCard :height="150" />
      </div>
      <div class="new-listed-section mobile">
        <NewListedCard :apps="newApps" :loading="loading" mobile />
      </div>
      <div class="sponsored-row mobile">
        <SponsoredCard :apps="sponsoredApps" :loading="loading" mobile />
      </div>
      <div class="apps-grid-section mobile">
        <AppsGrid
          :apps="filteredApps"
          :loading="loading"
          mobile
          :search-query="searchQuery"
          :selected-category="selectedCategory"
          :sort-by="sortBy"
          :categories="categories"
          :marketplace-categories="marketplaceCategories"
          @update:search="searchQuery = $event"
          @update:category="selectedCategory = $event"
          @update:sort="sortBy = $event"
          @deploy="handleDeploy"
          @refresh="handleRefresh"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { useMarketplace } from '@/composables/useMarketplace'

// Import components
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import MaintenanceCard from '@/components/Marketplace/MaintenanceCard.vue'
import DiscoverCard from '@/components/Marketplace/DiscoverCard.vue'
import NewListedCard from '@/components/Marketplace/NewListedCard.vue'
import SponsoredCard from '@/components/Marketplace/SponsoredCard.vue'
import AppsGrid from '@/components/Marketplace/AppsGrid.vue'

// SEO composable
import {
  useSEO,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateItemListSchema,
} from '@/composables/useSEO'

const { t } = useI18n()
const router = useRouter()
const { width, height } = useDisplay()

// Marketplace composable
const {
  apps,
  featuredApps,
  newApps,
  sponsoredApps,
  categories: marketplaceCategories,
  loading,
  error,
  fetchApps,
  fetchFeaturedApps,
  fetchNewApps,
  fetchSponsoredApps,
  fetchCategories,
} = useMarketplace()

const pageUrl = 'https://home.runonflux.io/marketplace'
const title = 'Marketplace - Deploy Decentralized Apps on Flux | FluxCloud'
const description = 'Browse and deploy decentralized applications on Flux\'s Web3 cloud infrastructure. Discover Docker containers, web apps, APIs, and services running on 8,000+ FluxNodes worldwide. One-click deployment with transparent pricing.'
const imageUrl = 'https://home.runonflux.io/images/logo.png'

// Generate structured data
const organizationSchema = generateOrganizationSchema()
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://home.runonflux.io' },
  { name: 'Marketplace', url: pageUrl },
])

// Generate dynamic ItemList schema for marketplace apps
const itemListSchema = computed(() => {
  if (apps.value.length === 0) return null

  // Take top 20 apps for structured data
  const topApps = apps.value.slice(0, 20).map(app => ({
    name: app.displayName || app.name || 'Unknown App',
    url: `https://home.runonflux.io/marketplace/${app.uuid || app.name}`,
    description: app.description || `Deploy ${app.displayName || app.name} on Flux decentralized cloud`,
  }))

  return generateItemListSchema(topApps, 'FluxCloud Marketplace Applications')
})

// Watch for apps changes and update SEO
watch(itemListSchema, newSchema => {
  if (newSchema) {
    useSEO({
      title,
      description,
      url: pageUrl,
      image: imageUrl,
      keywords: 'decentralized marketplace, Web3 apps, docker hosting, decentralized cloud, blockchain apps, flux marketplace, deploy applications, container hosting, API hosting, microservices, flux apps, one-click deployment',
      structuredData: [organizationSchema, breadcrumbSchema, newSchema],
    })
  }
}, { immediate: false })

// Initial SEO (before apps are loaded)
useSEO({
  title,
  description,
  url: pageUrl,
  image: imageUrl,
  keywords: 'decentralized marketplace, Web3 apps, docker hosting, decentralized cloud, blockchain apps, flux marketplace, deploy applications, container hosting, API hosting, microservices, flux apps, one-click deployment',
  structuredData: [organizationSchema, breadcrumbSchema],
})

// Responsive breakpoints (matching FluxCloud)
const isLargeScreen = computed(() => width.value > 600)
const isLargeHeight = computed(() => height.value > 750)

// Initial loading state
const isInitialLoading = ref(true)

// Search and filter state
const searchQuery = ref('')
const selectedCategory = ref(null)
const sortBy = ref(null)

// Categories for filter (exclude games categories and empty categories from Applications marketplace)
const categories = computed(() => {
  const gamesCategoryNames = ['games', 'newgames', 'gaming', 'game']

  return marketplaceCategories.value
    .filter(cat => {
      // Exclude games categories
      const isGameCategory = gamesCategoryNames.some(gameName =>
        cat.name.toLowerCase().includes(gameName.toLowerCase()),
      )
      if (isGameCategory) return false

      // Exclude empty categories (categories with no apps)
      const hasApps = apps.value.some(app =>
        app.category === cat.uuid &&
        app.visible !== false &&
        app.enabled !== false,
      )
      
      return hasApps
    })
    .map(cat => ({
      title: cat.name,
      value: cat.uuid,
    }))
})

// Filtered apps based on search and filters
const filteredApps = computed(() => {
  let filtered = [...apps.value]

  // Only show visible and enabled apps
  filtered = filtered.filter(app =>
    app.visible !== false && app.enabled !== false,
  )

  // Exclude games categories from Applications marketplace
  const gamesCategoryNames = ['games', 'newgames', 'gaming', 'game']
  const gamesCategories = marketplaceCategories.value.filter(cat =>
    gamesCategoryNames.some(gameName =>
      cat.name.toLowerCase().includes(gameName.toLowerCase()),
    ),
  )
  const gamesCategoryUuids = gamesCategories.map(cat => cat.uuid)

  // Filter out apps that belong to games categories
  filtered = filtered.filter(app => !gamesCategoryUuids.includes(app.category))

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(app =>
      app.name?.toLowerCase().includes(query) ||
      app.displayName?.toLowerCase().includes(query) ||
      app.description?.toLowerCase().includes(query) ||
      app.developer?.toLowerCase().includes(query) ||
      app.tags?.some(tag => tag.toLowerCase().includes(query)),
    )
  }

  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter(app => app.category === selectedCategory.value)
  }

  // Sort apps (matching FluxCloud)
  filtered.sort((a, b) => {
    switch (sortBy.value) {
    case 'date':
      // FluxCloud: newest first (timestampB.compareTo(timestampA))
      return (b.timestamp || 0) - (a.timestamp || 0)
    case 'name':
      // FluxCloud: alphabetical A-Z (a.name.compareTo(b.name))
      return (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '')
    default:
      // No sorting - natural order from API (like FluxCloud default)
      return 0
    }
  })

  return filtered
})

// Handle app deployment
const handleDeploy = async app => {
  try {
    router.push(`/marketplace/${app.uuid || app.name}`)
  } catch (err) {
    console.error("Failed to navigate to app:", err)
  }
}

// Handle refresh
const handleRefresh = async () => {
  isInitialLoading.value = true
  try {
    console.log("🔄 Refreshing marketplace data...")
    await Promise.all([
      fetchApps(),
      fetchFeaturedApps(),
      fetchNewApps(),
      fetchSponsoredApps(),
      fetchCategories(),
    ])
    console.log("✅ Marketplace data refreshed successfully")
  } catch (err) {
    console.error("❌ Failed to refresh marketplace:", err)
  } finally {
    isInitialLoading.value = false
  }
}

// Load marketplace data
onMounted(async () => {
  try {
    console.log('🚀 Starting marketplace data load...')
    await Promise.all([
      fetchApps(),
      fetchFeaturedApps(),
      fetchNewApps(),
      fetchSponsoredApps(),
      fetchCategories(),
    ])
    console.log('✅ Marketplace data loaded successfully')
    console.log('📊 Data summary:', {
      apps: apps.value.length,
      newApps: newApps.value.length,
      sponsoredApps: sponsoredApps.value.length,
      categories: marketplaceCategories.value.length,
    })
  } catch (err) {
    console.error('❌ Failed to load marketplace:', err)
  } finally {
    isInitialLoading.value = false
  }
})
</script>

<style scoped>
.marketplace-container {
  padding: 8px 24px;
  min-height: 100vh;
  overflow-x: auto;
}

/* Large Screen + Large Height Layout */
.layout-large-large {
  display: flex;
  flex-direction: column;
  gap: 4px; /* Consistent 4px spacing between all sections */
  max-width: 1920px;
  margin: 0 auto;
  padding: 0px;
}

.top-row {
  display: flex;
  gap: 16px;
  height: 150px; /* Same height as new listed card */
}

.discover-section {
  flex: 5;
  min-width: 0;
}

.new-listed-section {
  flex: 7;
  min-width: 0;
}

.sponsored-row {
  width: 100%;
  height: 125px;
  margin-top: 16px; /* Increase top spacing before sponsored section */
  margin-bottom: 16px; /* Increase bottom margin to match top visual spacing */
}

.apps-grid-section {
  flex: 1;
  min-height: 500px;
}

/* Large Screen + Small Height Layout */
.layout-large-small {
  display: flex;
  flex-direction: column;
  gap: 4px; /* Consistent 4px spacing between all sections */
  max-width: 1920px;
  margin: 0 auto;
  padding: 8px;
}

.compact-top-row {
  display: flex;
  gap: 16px;
  height: 150px; /* Same height as new listed card */
}

.discover-section.compact {
  flex: 5;
  min-width: 0;
}

.new-listed-section.compact {
  flex: 7;
  min-width: 0;
}

.sponsored-row.compact {
  width: 100%;
  height: 125px;
  margin-top: 16px; /* Increase top spacing before sponsored section */
  margin-bottom: 16px; /* Increase bottom margin to match top visual spacing */
}

/* Small Screen + Large Height Layout */
.layout-small-large {
  display: flex;
  flex-direction: column;
  gap: 4px; /* Consistent 4px spacing between all sections */
  max-width: 100%;
  margin: 0 auto;
  padding: 8px;
}

/* Small Screen + Small Height Layout (Mobile) */
.layout-small-small {
  display: flex;
  flex-direction: column;
  gap: 12px; /* 12px spacing for all sections */
  max-width: 100%;
  margin: 0 auto;
  padding: 8px;
}

.discover-section.mobile {
  width: 100%;
}

.new-listed-section.mobile {
  width: 100%;
}

.sponsored-row.mobile {
  width: 100%;
  height: 125px;
}

.apps-grid-section.mobile {
  flex: 1;
  height: 450px; /* FluxCloud mobile fixed height */
}

/* Ensure consistent spacing for all VCards in mobile layout */
.layout-small-small .v-card {
  margin: 0 !important;
}

.layout-small-small > * {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* Responsive adjustments - align with 600px breakpoint */
@media (max-width: 600px) {
  .top-row {
    flex-direction: column;
    height: auto;
  }

  .discover-section,
  .new-listed-section {
    flex: none;
    min-width: auto;
  }

  .compact-top-row {
    flex-direction: column;
    height: auto;
  }

  .discover-section.compact,
  .new-listed-section.compact {
    flex: none;
    min-width: auto;
  }
}

@media (max-width: 600px) {
  .marketplace-container {
    padding: 8px;
  }

  .layout-large-large,
  .layout-large-small {
    padding: 4px;
  }

  .top-row {
    gap: 12px;
  }

  .sponsored-row {
    height: 125px;
  }
}

/* Theme adjustments for dark mode */
:deep(.v-theme--dark) {
  .marketplace-container {
    background: rgb(var(--v-theme-background));
  }
}
</style>
