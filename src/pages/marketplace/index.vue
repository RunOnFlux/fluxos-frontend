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

    <!-- New Layout -->
    <div v-else class="marketplace-layout">
      <!-- Hero Section -->
      <HeroSection
        :title="t('pages.marketplace.hero.title')"
        :subtitle="heroSubtitle"
        background-image="/banner/FluxAppsMarketplace.webp"
        icon="mdi-store"
        icon-aria-label="Marketplace Logo"
      />

      <!-- Sponsored Apps Section -->
      <div class="sponsored-section">
        <SponsoredCard :apps="sponsoredApps" :loading="loading" />
      </div>

      <!-- Apps Grid Section -->
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMarketplace } from '@/composables/useMarketplace'
import { useFluxStore } from '@/stores/flux'

// Import components
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import MaintenanceCard from '@/components/Marketplace/MaintenanceCard.vue'
import SponsoredCard from '@/components/Marketplace/SponsoredCard.vue'
import AppsGrid from '@/components/Marketplace/AppsGrid.vue'
import HeroSection from '@/components/HeroSection.vue'

// SEO composable
import {
  useSEO,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateItemListSchema,
  generateArticleSchema,
} from '@/composables/useSEO'

const { t } = useI18n()
const router = useRouter()

// Marketplace composable
const {
  apps,
  newApps,
  sponsoredApps,
  categories: marketplaceCategories,
  loading,
  error,
  fetchApps,
  fetchNewApps,
  fetchSponsoredApps,
  fetchCategories,
} = useMarketplace()

const pageUrl = 'https://cloud.runonflux.com/marketplace'
const title = 'Marketplace - Deploy Decentralized Apps on Flux | FluxCloud'
const description = 'Deploy decentralized apps on Flux\'s Web3 cloud. Docker containers, web apps, APIs on 8,000+ FluxNodes worldwide. One-click deployment, transparent pricing.'
const imageUrl = 'https://cloud.runonflux.com/images/logo.png'

// Article timestamps for SEO (static dates for this landing page)
const datePublished = '2023-06-01T00:00:00Z' // Initial launch date
const dateModified = '2025-01-20T00:00:00Z'  // Last significant update

// Generate structured data
const organizationSchema = generateOrganizationSchema()
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://cloud.runonflux.com' },
  { name: 'Marketplace', url: pageUrl },
])
const articleSchema = generateArticleSchema({
  headline: title,
  description,
  url: pageUrl,
  image: imageUrl,
  datePublished,
  dateModified,
})

// Generate dynamic ItemList schema for marketplace apps
const itemListSchema = computed(() => {
  if (apps.value.length === 0) return null

  // Take top 20 apps for structured data
  const topApps = apps.value.slice(0, 20).map(app => ({
    name: app.displayName || app.name || 'Unknown App',
    url: `https://cloud.runonflux.com/marketplace/${app.uuid || app.name}`,
    description: app.description || `Deploy ${app.displayName || app.name} on Flux decentralized cloud`,
  }))

  return generateItemListSchema(topApps, 'FluxCloud Marketplace Applications')
})

// Create reactive structured data that updates when itemListSchema changes
const structuredData = computed(() => {
  const baseSchemas = [organizationSchema, breadcrumbSchema, articleSchema]

  return itemListSchema.value ? [...baseSchemas, itemListSchema.value] : baseSchemas
})

// SEO setup with reactive structured data (called once during setup)
// useHead accepts reactive values, so this will update automatically when structuredData changes
useSEO({
  title,
  description,
  url: pageUrl,
  image: imageUrl,
  keywords: 'decentralized marketplace, Web3 apps, docker hosting, decentralized cloud, blockchain apps, flux marketplace, deploy applications, container hosting, API hosting, microservices, flux apps, one-click deployment',
  structuredData, // This is a computed ref that updates when apps load
})

// Initial loading state
const isInitialLoading = ref(true)

// Network data
const nodeCount = ref(8000) // Default fallback
const networkDataLoading = ref(true)

// Hero subtitle with dynamic node count
const heroSubtitle = computed(() =>
  t('pages.marketplace.hero.subtitle', {
    nodeCount: nodeCount.value.toLocaleString(),
  }),
)

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

// Fetch network data from Pinia store (no API call needed)
const fetchNetworkData = async () => {
  try {
    networkDataLoading.value = true

    // Get data from Pinia store (already fetched in App.vue)
    const fluxStore = useFluxStore()
    const { serverLocations } = fluxStore

    // Wait a bit for store to populate if needed
    if (serverLocations.fluxList.length === 0 && !serverLocations.lastFetched) {
      // Store hasn't loaded yet, wait for it
      await new Promise(resolve => {
        const unwatch = watch(
          () => serverLocations.fluxList.length,
          length => {
            if (length > 0) {
              unwatch()
              resolve()
            }
          },
          { immediate: true },
        )

        // Timeout after 5 seconds
        setTimeout(() => {
          unwatch()
          resolve()
        }, 5000)
      })
    }

    // Update node count from store
    if (serverLocations.fluxNodeCount > 0) {
      nodeCount.value = serverLocations.fluxNodeCount
    }

    console.log('✅ Network data loaded from store:', {
      nodeCount: nodeCount.value,
    })
  } catch (error) {
    console.error('Error loading network data from store:', error)

    // Keep default fallback values on error
  } finally {
    networkDataLoading.value = false
  }
}

// Handle refresh
const handleRefresh = async () => {
  isInitialLoading.value = true
  try {
    console.log("🔄 Refreshing marketplace data...")
    await Promise.all([
      fetchApps(),
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

    // Track marketplace page view
    const analytics = useAnalytics()
    analytics.trackMarketplace('page_view', {
      page: 'marketplace',
    })
    await Promise.all([
      fetchApps(),
      fetchNewApps(),
      fetchSponsoredApps(),
      fetchCategories(),
      fetchNetworkData(),
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
  padding: 0;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 100px);
}

.marketplace-layout {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Hero section margins */
.marketplace-layout > :deep(.hero-section) {
  margin: 0 !important;
}

/* Add spacing after hero section via the parent layout */
.marketplace-layout > :first-child {
  margin-bottom: 2rem !important;
}

/* Consistent spacing between all sections */
.marketplace-layout > * {
  margin-bottom: 2rem;
}

/* Remove bottom margin from last child */
.marketplace-layout > *:last-child {
  margin-bottom: 0;
}

.sponsored-section {
  width: 100%;
  height: auto;
  margin-bottom: 2rem !important;
}

.apps-grid-section {
  flex: 1;
  min-height: 500px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .marketplace-container {
    padding: 0 8px;
  }

  .apps-grid-section {
    min-height: 400px;
  }
}

@media (max-width: 600px) {
  .marketplace-container {
    padding: 0;
  }

  .marketplace-layout > * {
    margin-bottom: 1.5rem;
  }

  .sponsored-section {
    height: auto;
    margin-bottom: 1.5rem !important;
  }

  .apps-grid-section {
    min-height: 450px;
  }
}

/* Theme adjustments for dark mode */
:deep(.v-theme--dark) {
  .marketplace-container {
    background: rgb(var(--v-theme-background));
  }
}
</style>
