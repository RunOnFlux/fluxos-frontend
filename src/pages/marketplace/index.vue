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

      <!-- Revenue Sharing Banner -->
      <VCard class="section-card revenue-banner">
        <VCardText class="d-flex align-center pa-5">
          <VAvatar size="64" class="revenue-banner-avatar me-4 flex-shrink-0">
            <VIcon icon="mdi-handshake" size="36" />
          </VAvatar>
          <div>
            <h3 class="revenue-banner-title">{{ t('pages.marketplace.revenueBanner.title') }}</h3>
            <p class="revenue-banner-desc">
              {{ t('pages.marketplace.revenueBanner.description') }}
              <a href="mailto:info@runonflux.com" class="revenue-banner-email">info@runonflux.com</a>
              {{ t('pages.marketplace.revenueBanner.cta') }}
            </p>
          </div>
        </VCardText>
      </VCard>

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
  usePrerenderReady,
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
const title = 'Flux Marketplace - One-Click App Deployment | FluxCloud'
const description = 'Deploy WordPress, game servers, databases, and more in one click on FluxCloud. Pay-as-you-go hosting on thousands of nodes across 50+ countries.'
const imageUrl = 'https://cloud.runonflux.com/images/logo.png'

// Generate structured data
const organizationSchema = generateOrganizationSchema()
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://cloud.runonflux.com' },
  { name: 'Marketplace', url: pageUrl },
])

// Generate dynamic ItemList schema for marketplace apps
const itemListSchema = computed(() => {
  if (apps.value.length === 0) return null

  // Take top 20 apps for structured data
  const topApps = apps.value.slice(0, 20).map(app => ({
    name: app.displayName || app.name || 'Unknown App',
    url: `https://cloud.runonflux.com/marketplace/${app.uuid || app.name}`,
    description: app.description || `Deploy ${app.displayName || app.name} on Flux decentralized cloud`,
    price: app.price || 0,
  }))

  return generateItemListSchema(topApps, 'FluxCloud Marketplace Applications')
})

// Create reactive structured data that updates when itemListSchema changes
const structuredData = computed(() => {
  const baseSchemas = [organizationSchema, breadcrumbSchema]

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

// Hold the SEO prerenderer until the marketplace apps have loaded, so the
// prerendered HTML carries the ItemList structured data.
const { markReady } = usePrerenderReady()
watch(loading, isLoading => {
  if (!isLoading) markReady()
}, { flush: 'post' })

// Initial loading state
const isInitialLoading = ref(true)

// Network data
const nodeCount = ref(7000) // Default fallback (replaced by live API count when available)
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
    if (app.redirectUrl) {
      window.open(app.redirectUrl, '_blank', 'noopener,noreferrer')

      return
    }

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

/* Section Cards - shared styling */
.section-card {
  margin-bottom: 2rem;
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

/* CSS Custom Property for rotation */
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

/* Revenue Sharing Banner */
.revenue-banner {
  --angle: 0deg;
  border: 3px solid transparent !important;
  position: relative;
  transition: transform 0.3s ease;
  background:
    linear-gradient(
      rgba(var(--v-theme-surface), 1),
      rgba(var(--v-theme-surface), 1)
    ) padding-box,
    conic-gradient(
      from var(--angle),
      rgb(var(--v-theme-primary)),
      rgba(var(--v-theme-primary), 0.95) 60deg,
      rgba(var(--v-theme-primary), 0.9) 120deg,
      rgba(var(--v-theme-primary), 0.85) 180deg,
      rgba(var(--v-theme-primary), 0.75) 240deg,
      rgba(var(--v-theme-primary), 0.6) 300deg,
      rgba(var(--v-theme-primary), 0.3) 340deg,
      rgb(var(--v-theme-primary)) 360deg
    ) border-box;
  filter: drop-shadow(0 0 8px rgba(var(--v-theme-primary), 0.3));
}

/* Apply the gradient background over the solid background */
.revenue-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-primary), 0.04) 50%,
    transparent 100%);
  border-radius: 12px;
  pointer-events: none;
  z-index: 0;
}

.revenue-banner :deep(.v-card-text) {
  position: relative;
  z-index: 1;
}

@keyframes rotateBorder {
  to {
    --angle: 360deg;
  }
}

.revenue-banner:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  box-shadow: 0 4px 20px rgba(var(--v-theme-primary), 0.15) !important;
  transform: translateY(-2px);
}

.revenue-banner-avatar {
  background: linear-gradient(135deg,
    rgba(var(--v-theme-on-surface), 0.12),
    rgba(var(--v-theme-on-surface), 0.06)) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(var(--v-theme-on-surface), 0.15);
}

.revenue-banner-avatar :deep(.v-icon) {
  color: rgb(var(--v-theme-on-surface)) !important;
  opacity: 0.9;
}

.revenue-banner-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.4;
}

.revenue-banner-desc {
  font-size: 1.0625rem;
  line-height: 1.7;
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.revenue-banner-email {
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  text-decoration: underline;
  transition: opacity 0.2s ease;
}

.revenue-banner-email:hover {
  opacity: 0.7;
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
