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
          :key="index"
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
import { useHead } from '@vueuse/head'
import { useMarketplace } from '@/composables/useMarketplace'
import { useGameUtils } from '@/composables/useGameUtils'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import PanelRenderer from '@/components/Marketplace/PanelRenderer.vue'
import AppConfigCard from '@/components/Marketplace/AppConfigCard.vue'
import InstallDialog from '@/components/Marketplace/InstallDialog.vue'

const { t, tm, te } = useI18n()

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

// Dynamic SEO meta tags and structured data
watch(game, newGame => {
  if (!newGame) return

  const gameName = newGame.displayName || newGame.name
  const description = newGame.detailHeaderText || newGame.description || `Deploy ${gameName} servers on the decentralized Flux network. Affordable, reliable game hosting with instant deployment and DDoS protection.`
  const pageUrl = `https://home.runonflux.io/marketplace/games/${route.params.name}`
  const imageUrl = gameIcon.value || 'https://home.runonflux.io/images/games/FluxPlay_white.svg'
  const price = minPrice.value

  // Build FAQ structured data if FAQ panel exists
  const faqPanel = newGame.panels?.find(p => p.type === 'FAQ' && p.enabled)
  let faqStructuredData = null

  if (faqPanel?.questions) {
    let questionsArray = faqPanel.questions

    // If questions is an i18n key, resolve it
    if (typeof questionsArray === 'string' && questionsArray.startsWith('i18n:')) {
      const key = questionsArray.replace('i18n:', '')
      if (te(key)) {
        questionsArray = tm(key)
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

  // Product structured data
  const productStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': `${gameName} Server Hosting`,
    'description': description,
    'image': imageUrl,
    'brand': {
      '@type': 'Organization',
      'name': 'Flux Network',
      'url': 'https://runonflux.io',
    },
    'offers': {
      '@type': 'AggregateOffer',
      'lowPrice': price.replace(/[^\d.]/g, ''), // Extract numeric value
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock',
      'url': pageUrl,
    },
  }

  // Breadcrumb structured data
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://home.runonflux.io',
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Games',
        'item': 'https://home.runonflux.io/marketplace/games',
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': gameName,
        'item': pageUrl,
      },
    ],
  }

  // Combine structured data
  const structuredData = [productStructuredData, breadcrumbStructuredData]
  if (faqStructuredData) {
    structuredData.push({ '@context': 'https://schema.org', ...faqStructuredData })
  }

  useHead({
    title: `${gameName} Server Hosting - FluxPlay on Flux Network`,
    meta: [
      {
        name: 'description',
        content: description.substring(0, 160), // Limit to 160 chars for SEO
      },
      {
        name: 'keywords',
        content: `${gameName} hosting, ${gameName} server, game server hosting, decentralized hosting, flux network, affordable game hosting`,
      },

      // Open Graph
      { property: 'og:title', content: `${gameName} Server Hosting - FluxPlay` },
      { property: 'og:description', content: description.substring(0, 160) },
      { property: 'og:image', content: imageUrl },
      { property: 'og:url', content: pageUrl },
      { property: 'og:type', content: 'product' },
      { property: 'og:site_name', content: 'FluxPlay' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: `${gameName} Server Hosting - FluxPlay` },
      { name: 'twitter:description', content: description.substring(0, 160) },
      { name: 'twitter:image', content: imageUrl },

      // Additional SEO
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Flux Network' },
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
}, { immediate: true })

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

// Watch for route changes to reload game details
watch(() => route.params.name, () => {
  // Scroll to top when navigating to a different game
  window.scrollTo({ top: 0, behavior: 'smooth' })
  loadGameDetails()
}, { immediate: false })

onMounted(loadGameDetails)
</script>

<style scoped>
.game-details-container {
  padding: 0 24px 0 24px;
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
  gap: 8px;
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
    padding: 16px;
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
