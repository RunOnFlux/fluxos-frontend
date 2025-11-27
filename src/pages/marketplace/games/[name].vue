<template>
  <div class="game-details-container">
    <!-- Loading State -->
    <LoadingSpinner
      v-if="loading"
      icon="mdi-gamepad-variant"
      :icon-size="56"
      :title="t('pages.marketplace.games.detail.loadingTitle')"
    />

    <!-- Error State -->
    <VAlert v-else-if="error" type="error" class="error-alert">
      {{ error }}
      <template #append>
        <VBtn variant="text" @click="router.push('/marketplace/games')">
          {{ t('pages.marketplace.games.detail.backToGames') }}
        </VBtn>
      </template>
    </VAlert>

    <!-- Game Details -->
    <div v-else-if="game" class="game-details">
      <!-- Back Button -->
      <VBtn
        icon="mdi-arrow-left"
        variant="tonal"
        color="grey-darken-2"
        class="back-btn"
        @click="router.push('/marketplace/games')"
      />

      <!-- Dynamic Panels -->
      <div v-if="game.panels && game.panels.length" class="panels-container">
        <PanelRenderer
          v-for="(panel, index) in orderedPanels"
          :key="`${game.name}-${panel.type}-${index}`"
          :panel="panel"
          :app="game"
          @install="handleInstall"
        />
      </div>

      <!-- Fallback: No Panels - Show Basic Info -->
      <div v-else class="basic-game-info">
        <VCard class="info-card" elevation="3">
          <VCardTitle>
            <div class="game-header">
              <VImg
                v-if="gameIcon"
                :src="gameIcon"
                max-width="80"
                max-height="80"
                class="game-icon"
              />
              <h1>{{ game.displayName || game.name }}</h1>
            </div>
          </VCardTitle>

          <VCardText>
            <p v-if="game.description" class="game-description">
              {{ game.description }}
            </p>

            <!-- Configurations -->
            <div v-if="game.useConfig && game.configs && game.configs.length" class="configs-section">
              <h2>{{ t('pages.marketplace.games.detail.availableConfigurations') }}</h2>
              <div class="configs-grid">
                <AppConfigCard
                  v-for="(config, index) in game.configs"
                  :key="config.id"
                  :config="getConfigWithPopular(config, index, game.configs.length)"
                  :app="game"
                  @install="handleInstall"
                />
              </div>
            </div>

            <!-- Single Install Button (no configs) -->
            <div v-else class="single-install">
              <VBtn
                color="primary"
                size="large"
                @click="handleInstall({ app: game, config: null })"
              >
                {{ t('pages.marketplace.games.detail.installGame', { name: game.displayName || game.name }) }}
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </div>

      <!-- Trustpilot Reviews Section -->
      <TrustpilotPanel v-if="game" use-live-data :star-size="32" show-rating-label />
    </div>

    <!-- Install Dialog -->
    <InstallDialog
      v-if="selectedApp"
      v-model="showInstallDialog"
      :app="selectedApp"
      :selected-config="selectedConfig"
      is-game
      @deployed="handleDeployed"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSEO, generateSoftwareApplicationSchema, generateBreadcrumbSchema } from '@/composables/useSEO'
import { useMarketplace } from '@/composables/useMarketplace'
import { useGameUtils } from '@/composables/useGameUtils'
import { useFluxStore } from '@/stores/flux'
import { useAnalytics } from '@/plugins/analytics/composables/useAnalytics'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import PanelRenderer from '@/components/Marketplace/PanelRenderer.vue'
import AppConfigCard from '@/components/Marketplace/AppConfigCard.vue'
import InstallDialog from '@/components/Marketplace/InstallDialog.vue'
import TrustpilotPanel from '@/components/Marketplace/Panels/TrustpilotPanel.vue'

const { t, tm, te } = useI18n()
const analytics = useAnalytics()

const route = useRoute()
const router = useRouter()
const { games, fetchGames } = useMarketplace()
const { parseLandingImage, getMinimumPrice } = useGameUtils()

const game = ref(null)
const loading = ref(true)
const error = ref(null)
const showInstallDialog = ref(false)
const selectedApp = ref(null)
const selectedConfig = ref(null)

// Network data
const nodeCount = ref(8000) // Default fallback

// Parse game icon to handle asset:// protocol
const gameIcon = computed(() => parseLandingImage(game.value?.icon))

// Get minimum price for meta description
const minPrice = computed(() => {
  if (!game.value) return '0'
  
  return getMinimumPrice(game.value)
})

// Reorder panels: Header > Groups > Description > Features > ServerLocations > Screenshots > FAQ > RelatedGames
const orderedPanels = computed(() => {
  if (!game.value?.panels) return []

  const panels = [...game.value.panels]
  const panelOrder = ['Header', 'Groups', 'Description', 'Features', 'ServerLocations', 'Screenshots', 'FAQ', 'RelatedGames', 'NodeMap', 'Subscription']

  return panels.sort((a, b) => {
    const aIndex = panelOrder.indexOf(a.type)
    const bIndex = panelOrder.indexOf(b.type)

    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
  })
})

// Dynamic SEO meta tags and structured data using computed
const seoTitle = computed(() => {
  if (!game.value) return 'FluxPlay - Game Server Hosting'
  const gameName = game.value.displayName || game.value.name
  
  return `${gameName} Server Hosting - FluxPlay on Flux Network`
})

const seoDescription = computed(() => {
  if (!game.value) return 'Deploy game servers on the decentralized Flux network. Affordable, reliable game hosting with instant deployment and DDoS protection.'
  const gameName = game.value.displayName || game.value.name
  let desc = game.value.detailHeaderText || game.value.description || `Deploy ${gameName} servers on FluxCloud. Affordable, reliable hosting with instant deployment & DDoS protection.`

  // Truncate to 155 characters for optimal SEO
  if (desc.length > 155) {
    desc = desc.substring(0, 152).trim() + '...'
  }
  
  return desc
})

const seoImage = computed(() => {
  if (!game.value) return 'https://cloud.runonflux.com/images/games/FluxPlay_white.svg'
  
  return gameIcon.value || 'https://cloud.runonflux.com/images/games/FluxPlay_white.svg'
})

const seoUrl = computed(() => `https://cloud.runonflux.com/marketplace/games/${route.params.name}`)

const seoKeywords = computed(() => {
  if (!game.value) return 'game server hosting, decentralized hosting, flux network, affordable game hosting'
  const gameName = game.value.displayName || game.value.name
  
  return `${gameName} hosting, ${gameName} server, game server hosting, decentralized hosting, flux network, affordable game hosting`
})

// Structured data as computed refs
const structuredData = computed(() => {
  if (!game.value) return []

  const gameName = game.value.displayName || game.value.name
  const description = seoDescription.value
  const pageUrl = seoUrl.value
  const imageUrl = seoImage.value
  const price = minPrice.value

  // Build FAQ structured data if FAQ panel exists
  const faqPanel = game.value.panels?.find(p => p.type === 'FAQ' && p.enabled)
  let faqStructuredData = null

  if (faqPanel?.questions) {
    let questionsArray = faqPanel.questions

    // If questions is an i18n key, resolve it using t() for each item
    if (typeof questionsArray === 'string' && questionsArray.startsWith('i18n:')) {
      const key = questionsArray.replace('i18n:', '')
      if (te(key)) {
        const questions = tm(key)
        const length = Array.isArray(questions) ? questions.length : (typeof questions === 'object' ? Object.keys(questions).length : 0)

        questionsArray = []
        for (let i = 0; i < length; i++) {
          const qKey = `${key}.${i}.q`
          const aKey = `${key}.${i}.a`

          if (te(qKey) && te(aKey)) {
            questionsArray.push({
              q: t(qKey),
              a: t(aKey),
            })
          }
        }
      }
    }

    // Only generate structured data if we have a valid array
    if (Array.isArray(questionsArray) && questionsArray.length > 0) {
      faqStructuredData = {
        '@type': 'FAQPage',
        'mainEntity': questionsArray.map(faq => ({
          '@type': 'Question',
          'name': faq.q || faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.a || faq.answer,
          },
        })),
      }
    }
  }

  // SoftwareApplication structured data for game server hosting
  const productStructuredData = generateSoftwareApplicationSchema({
    name: `${gameName} Server Hosting`,
    description,
    url: pageUrl,
    image: imageUrl,
    applicationCategory: 'GameServer',
    operatingSystem: 'Linux',
    offers: {
      price: price.replace(/[^\d.]/g, ''), // Extract numeric value
      currency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    features: [
      'One-click deployment',
      'Auto-scaling',
      `Global distribution across ${nodeCount.value.toLocaleString()}+ nodes`,
      'Built-in DDoS protection',
      '24/7 automated monitoring',
      'Automatic backups',
      '99.9% uptime guarantee',
      'Pay-as-you-go pricing',
    ],
    aggregateRating: {
      ratingValue: '4.8',
      reviewCount: '127',
      bestRating: '5',
    },
  })

  // Breadcrumb structured data
  const breadcrumbStructuredData = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://cloud.runonflux.com' },
    { name: 'Games', url: 'https://cloud.runonflux.com/marketplace/games' },
    { name: gameName, url: pageUrl },
  ])

  // Combine structured data
  const schemas = [productStructuredData, breadcrumbStructuredData]
  if (faqStructuredData) {
    schemas.push({ '@context': 'https://schema.org', ...faqStructuredData })
  }

  return schemas
})

// Apply SEO using useSEO composable (called once during setup, handles reactivity)
useSEO({
  title: seoTitle,
  description: seoDescription,
  url: seoUrl,
  image: seoImage,
  keywords: seoKeywords,
  structuredData, // Computed ref - useSEO will handle reactivity
})

const loadGameDetails = async () => {
  loading.value = true
  error.value = null

  try {
    const gameName = route.params.name
    console.log('🔍 Loading game details for:', gameName)
    console.log('📦 Current games.value.length:', games.value.length)

    // Fetch all games if not loaded
    if (!games.value.length) {
      console.log('⏳ Fetching games...')
      await fetchGames()
      console.log('✅ Games fetched, count:', games.value.length)
    }

    // Debug: List all game names
    console.log('📋 All game names:', games.value.map(game => game.name))

    // Find game by name (case-insensitive like FluxCloud)
    const foundGame = games.value.find(app =>
      app.name?.toLowerCase() === gameName.toLowerCase(),
    )

    console.log('🎮 Found game:', foundGame ? foundGame.name : 'NOT FOUND')

    if (!foundGame) {
      error.value = t('pages.marketplace.games.detail.gameNotFound')
      console.error('❌ Game not found:', gameName)

      return
    }

    // Verify it's available (visible && enabled)
    if (!foundGame.visible || !foundGame.enabled) {
      error.value = t('pages.marketplace.games.detail.gameNotAvailable')
      console.error('❌ Game not available. visible:', foundGame.visible, 'enabled:', foundGame.enabled)

      return
    }

    console.log('✅ Game loaded successfully:', foundGame.name)
    console.log('🎮 Game data:', {
      name: foundGame.name,
      hasConfigs: !!foundGame.configs,
      configsLength: foundGame.configs?.length || 0,
      hasGroups: !!foundGame.groups,
      groupsLength: foundGame.groups?.length || 0,
      hasPanels: !!foundGame.panels,
      panelsLength: foundGame.panels?.length || 0,
      useConfig: foundGame.useConfig,
    })

    // 🧪 TEMPORARY TEST: Add SEO panels to ALL games for testing
    // TODO: Remove this and get panel data from backend
    const gameNameLower = foundGame.name.toLowerCase()

    // Map game names to i18n keys (handle variations like MinecraftServer -> minecraft)
    const gameI18nMap = {
      'palworld': 'palworld',
      'minecraftserver': 'minecraft',
      'minecraft': 'minecraft',
      'factorio': 'factorio',
      'satisfactory': 'satisfactory',
      'enshrouded': 'enshrouded',
    }

    const i18nKey = gameI18nMap[gameNameLower]

    if (i18nKey) {
      const existingPanels = foundGame.panels || []

      foundGame.panels = [
        // Keep existing Header panel or create one
        existingPanels.find(p => p.type === 'Header') || {
          type: 'Header',
          enabled: true,
        },

        // NEW: Description Panel (using i18n)
        {
          type: 'Description',
          enabled: true,
          title: `i18n:pages.marketplace.games.${i18nKey}.description.title`,
          content: `i18n:pages.marketplace.games.${i18nKey}.description.content`,
          highlights: `i18n:pages.marketplace.games.${i18nKey}.description.highlights`,
        },

        // NEW: Features Panel (using i18n)
        {
          type: 'Features',
          enabled: true,
          title: `i18n:pages.marketplace.games.${i18nKey}.features.title`,
          subtitle: `i18n:pages.marketplace.games.${i18nKey}.features.subtitle`,
          features: `i18n:pages.marketplace.games.${i18nKey}.features.items`,
        },

        // NEW: Server Locations Panel (using i18n)
        {
          type: 'ServerLocations',
          enabled: true,
          title: `i18n:pages.marketplace.games.${i18nKey}.serverLocations.title`,
          subtitle: `i18n:pages.marketplace.games.${i18nKey}.serverLocations.subtitle`,
        },

        // Keep existing Screenshots panel if it exists
        ...existingPanels.filter(p => p.type === 'Screenshots'),

        // Keep existing Groups panel
        ...existingPanels.filter(p => p.type === 'Groups'),

        // NEW: FAQ Panel (using i18n) - Game-specific FAQs
        {
          type: 'FAQ',
          enabled: true,
          title: `i18n:pages.marketplace.games.${i18nKey}.faq.title`,
          subtitle: `i18n:pages.marketplace.games.${i18nKey}.faq.subtitle`,
          questions: `i18n:pages.marketplace.games.${i18nKey}.faq.questions`,
        },

        // NEW: Related Games Panel (internal linking for SEO)
        {
          type: 'RelatedGames',
          enabled: true,
        },
      ]
    }

    game.value = foundGame

    // Track game detail view with game name
    analytics.trackMarketplace('game_view', {
      page: 'game_detail',
      game_name: foundGame.displayName || foundGame.name,
      game_id: foundGame.name,
    })
  } catch (err) {
    console.error('Failed to load game details:', err)
    error.value = err.message || t('pages.marketplace.games.detail.failedToLoad')
  } finally {
    loading.value = false
  }
}

const handleInstall = ({ app, config }) => {
  selectedApp.value = app
  selectedConfig.value = config
  showInstallDialog.value = true
}

const handleDeployed = () => {
  // Handle successful deployment
  console.log('Game deployed successfully')
}

// 🎯 CONFIGURE "MOST POPULAR" BADGE HERE
// Change this number to mark a different config as popular:
// - 0 = first config (cheapest)
// - Math.floor(total / 2) = middle config (recommended)
// - total - 1 = last config (most expensive)
const POPULAR_CONFIG_INDEX = total => Math.floor(total / 2) // Middle option

const getConfigWithPopular = (config, index, totalConfigs) => {
  return {
    ...config,
    isPopular: index === POPULAR_CONFIG_INDEX(totalConfigs),
  }
}

// Fetch network data from Pinia store (no API call needed)
const fetchNetworkData = async () => {
  try {
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
      console.log('✅ Network data loaded from store:', {
        nodeCount: nodeCount.value,
      })
    }
  } catch (error) {
    console.error('Error loading network data from store:', error)

    // Keep default fallback values on error
  }
}

// Watch for route changes to reload game details
watch(() => route.params.name, () => {
  // Scroll to top when navigating to a different game
  window.scrollTo({ top: 0, behavior: 'smooth' })
  loadGameDetails()
}, { immediate: false })

onMounted(async () => {
  await Promise.all([
    loadGameDetails(),
    fetchNetworkData(),
  ])
})
</script>

<style scoped>
.game-details-container {
  padding: 0;
  max-width: 1400px;
  margin: -16px auto 0 auto;
  min-height: calc(100vh - 100px);
  position: relative;
}

.error-alert {
  margin: 24px 0;
}

.back-btn {
  margin-bottom: 15px;
  position: absolute;
  top: 8px;
  left: 20px;
  z-index: 10;
  background-color: rgba(100, 100, 100, 0.4) !important;
  backdrop-filter: blur(10px);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.back-btn:hover {
  background-color: rgba(120, 120, 120, 0.5) !important;
  transform: scale(1.1);
}

.back-btn :deep(.v-icon) {
  color: rgba(255, 255, 255, 0.9);
}

.game-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panels-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 20px;
}

/* Fallback Basic Info Styling */
.basic-game-info {
  margin-top: 24px;
}

.info-card {
  border-radius: 16px;
  padding: 24px;
}

.game-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.game-header h1 {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0;
}

.game-icon {
  border-radius: 12px;
}

.game-description {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 32px;
}

.configs-section {
  margin-top: 32px;
}

.configs-section h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 24px;
}

.configs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.single-install {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

/* Trustpilot Section */
.trustpilot-section {
  margin-top: 24px;
}

.trustpilot-link {
  text-decoration: none;
  color: inherit;
  display: inline-block;
  transition: all 0.3s ease;
}

.trustpilot-link:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.trustpilot-link .trustpilot-rating-container {
  cursor: pointer;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .game-header h1 {
    font-size: 2rem;
  }

  .configs-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 600px) {
  .game-details-container {
    padding: 0;
  }

  .game-header {
    flex-direction: column;
    text-align: center;
  }

  .game-header h1 {
    font-size: 1.8rem;
  }

  .configs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
