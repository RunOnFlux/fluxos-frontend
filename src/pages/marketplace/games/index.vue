<template>
  <div class="games-container">
    <div class="games-layout">
      <!-- Modern Compact Header - Hidden during loading and maintenance -->
      <div v-if="!loading && games.length > 0" class="games-header">
        <div class="header-modern">
          <div class="logo-badge">
            <img
              :src="fluxPlayLogo"
              alt="FluxPlay"
              class="fluxplay-logo-compact"
            />
          </div>
          <div class="text-compact">
            <h1 class="title-modern">{{ t('pages.marketplace.games.index.title') }}</h1>
            <p class="subtitle-modern">
              {{ t('pages.marketplace.games.index.subtitle') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Games Grid Section -->
      <div class="games-grid-section">
        <div v-if="loading" style="margin-top: -100px;">
          <LoadingSpinner
            icon="mdi-gamepad-variant"
            :icon-size="56"
            :title="t('pages.marketplace.games.index.loading')"
          />
        </div>

        <MaintenanceCard
          v-else-if="!games.length"
          :title="t('pages.marketplace.games.index.maintenanceTitle')"
          :subtitle="t('pages.marketplace.games.index.maintenanceSubtitle')"
          :loading="loading"
          margin-top="-150px"
          @retry="fetchGames"
        />

        <div v-else class="games-grid">
          <GameCard
            v-for="game in games"
            :key="game.uuid || game.name"
            :game="game"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import { useMarketplace } from '@/composables/useMarketplace'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import MaintenanceCard from '@/components/Marketplace/MaintenanceCard.vue'
import GameCard from '@/components/Marketplace/GameCard.vue'

const { t } = useI18n()

const theme = useTheme()
const { games, loading, fetchGames } = useMarketplace()

// Theme-aware FluxPlay logo
const fluxPlayLogo = computed(() => {
  return theme.current.value.dark
    ? '/images/games/FluxPlay_white.svg'
    : '/images/games/FluxPlay_black.svg'
})

// SEO meta tags and structured data
watch(games, loadedGames => {
  if (!loadedGames || loadedGames.length === 0) return

  const pageUrl = 'https://home.runonflux.io/marketplace/games'
  const title = 'Game Server Hosting - FluxPlay on Flux Network'
  const description = 'Premium game hosting with global servers, lightning-fast connections, and flexible plans. Host Minecraft, Palworld, Factorio, Satisfactory, and Enshrouded servers on the decentralized Flux network with instant deployment and DDoS protection.'
  const imageUrl = 'https://home.runonflux.io/images/games/FluxPlay_white.svg'

  // ItemList structured data for game listings
  const itemListStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': loadedGames.map((game, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Product',
        'name': `${game.displayName || game.name} Server Hosting`,
        'url': `https://home.runonflux.io/marketplace/games/${game.name.toLowerCase()}`,
        'image': game.icon || game.logo || imageUrl,
        'description': game.description || `Host your own ${game.displayName || game.name} server on the Flux network`,
      },
    })),
  }

  // Organization structured data
  const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'FluxPlay',
    'url': 'https://home.runonflux.io',
    'logo': imageUrl,
    'description': 'Decentralized game server hosting on the Flux network',
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
        'item': pageUrl,
      },
    ],
  }

  useHead({
    title,
    meta: [
      {
        name: 'description',
        content: description,
      },
      {
        name: 'keywords',
        content: 'game server hosting, minecraft hosting, palworld hosting, factorio hosting, satisfactory hosting, enshrouded hosting, decentralized hosting, flux network, dedicated game servers, affordable hosting',
      },

      // Open Graph
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: imageUrl },
      { property: 'og:url', content: pageUrl },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'FluxPlay' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
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
        children: JSON.stringify([itemListStructuredData, organizationStructuredData, breadcrumbStructuredData]),
      },
    ],
  })
}, { immediate: true })

// Load games on mount
onMounted(async () => {
  try {
    await fetchGames()
    console.log('✅ Games loaded successfully')
  } catch (err) {
    console.error('Failed to load games:', err)
  }
})
</script>

<style scoped>
.games-container {
  padding: 8px 24px 8px 24px;
  min-height: 100vh;
}

.games-layout {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Modern Compact Header */
.games-header {
  width: 100%;
  margin-bottom: 12px;
}

.header-modern {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-secondary), 0.05) 100%);
  border-radius: 20px;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  margin-bottom: 16px;
}

.logo-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: logoGlow 2s ease-in-out infinite;
  min-width: 112px;
  min-height: 112px;
}

.fluxplay-logo-compact {
  height: 80px;
  width: auto;
  object-fit: contain;
}

@keyframes logoGlow {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1),
                0 0 20px rgba(0, 191, 255, 0.3),
                0 0 30px rgba(0, 191, 255, 0.2);
  }
  50% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1),
                0 0 30px rgba(0, 191, 255, 0.5),
                0 0 40px rgba(0, 191, 255, 0.3);
  }
}

.text-compact {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-modern {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.subtitle-modern {
  font-size: 1.125rem;
  line-height: 1.6;
  margin: 0;
  opacity: 0.85;
}

/* Games Grid Section */
.games-grid-section {
  flex: 1;
  margin-top: 0;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  padding: 0;
  width: 100%;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .header-modern {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .logo-badge {
    margin: 0 auto;
  }

  .title-modern {
    font-size: 2rem;
  }

  .subtitle-modern {
    font-size: 1rem;
  }

  .games-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 600px) {
  .games-container {
    padding: 16px;
  }

  .games-layout {
    gap: 16px;
  }

  .header-modern {
    padding: 16px;
  }

  .logo-badge {
    min-width: 90px;
    min-height: 90px;
    padding: 12px;
  }

  .fluxplay-logo-compact {
    height: 60px;
  }

  .title-modern {
    font-size: 1.75rem;
  }

  .subtitle-modern {
    font-size: 0.95rem;
  }

  .games-grid {
    grid-template-columns: 1fr;
    padding: 0;
  }
}
</style>
