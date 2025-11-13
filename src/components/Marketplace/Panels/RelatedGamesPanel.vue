<template>
  <div class="related-games-panel" :style="panelStyle">
    <VCard class="related-games-card" elevation="0">
      <VCardText>
        <h2 class="section-title">{{ t('components.marketplace.panels.relatedGamesPanel.title') }}</h2>
        <p class="section-subtitle">{{ t('components.marketplace.panels.relatedGamesPanel.subtitle') }}</p>

        <div class="games-grid">
          <RouterLink
            v-for="game in relatedGames"
            :key="game.name"
            :to="`/marketplace/games/${game.name.toLowerCase()}`"
            class="game-card"
          >
            <div class="game-card-inner">
              <div class="game-icon">
                <VImg
                  :src="getGameIcon(game)"
                  :alt="`${game.displayName || game.name} server hosting`"
                  height="80"
                  width="80"
                  contain
                />
              </div>
              <h3 class="game-name">{{ game.displayName || game.name }}</h3>
              <p class="game-description">{{ getGameDescription(game) }}</p>
              <div class="game-price">
                <span class="price-label">{{ t('components.marketplace.panels.relatedGamesPanel.startingAt') }}</span>
                <span class="price-value">${{ getMinPrice(game) }}</span>
              </div>
            </div>
          </RouterLink>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMarketplace } from '@/composables/useMarketplace'
import { useGameUtils } from '@/composables/useGameUtils'

const props = defineProps({
  panel: {
    type: Object,
    required: true,
  },
  app: {
    type: Object,
    required: true,
  },
})

const { t } = useI18n()
const { games } = useMarketplace()
const { parseLandingImage, getMinimumPrice } = useGameUtils()

// Get all games except the current one
const relatedGames = computed(() => {
  return games.value
    .filter(game =>
      game.visible &&
      game.enabled &&
      game.name.toLowerCase() !== props.app.name.toLowerCase(),
    )
    .slice(0, 4) // Show max 4 related games
})

const getGameIcon = game => {
  return parseLandingImage(game.icon)
}

const getGameDescription = game => {
  const descriptions = {
    'palworld': 'Monster-catching survival adventure',
    'minecraftserver': 'Creative building & survival',
    'minecraft': 'Creative building & survival',
    'factorio': 'Factory automation & logistics',
    'satisfactory': '3D factory building',
    'enshrouded': 'Survival action RPG',
  }

  return descriptions[game.name.toLowerCase()] || game.description || 'Host your game server'
}

const getMinPrice = game => {
  return getMinimumPrice(game)
}

const panelStyle = computed(() => ({
  padding: props.panel.padding
    ? `${props.panel.padding.top}px ${props.panel.padding.right}px ${props.panel.padding.bottom}px ${props.panel.padding.left}px`
    : '8px 24px',
  background: props.panel.background || 'transparent',
  borderRadius: props.panel.cornerRadius ? `${props.panel.cornerRadius}px` : '0',
  marginBottom: '15px',
}))
</script>

<style scoped>
.related-games-panel {
  margin-bottom: 8px;
}

.related-games-card {
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.6);
  backdrop-filter: blur(10px);
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
  color: rgb(var(--v-theme-primary));
}

.section-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 32px;
  opacity: 0.9;
  line-height: 1.6;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.game-card {
  text-decoration: none;
  color: inherit;
  display: block;
  transition: transform 0.3s ease;
}

.game-card:hover {
  transform: translateY(-4px);
}

.game-card-inner {
  padding: 24px;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-card:hover .game-card-inner {
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.15);
}

.game-icon {
  margin-bottom: 16px;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
  padding: 8px;
}

.game-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface));
}

.game-description {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 16px;
  flex-grow: 1;
}

.game-price {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  width: 100%;
}

.price-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  letter-spacing: 0.5px;
}

.price-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .section-title {
    font-size: 1.75rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }

  .games-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .related-games-panel {
    padding: 8px 16px !important;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .section-subtitle {
    font-size: 0.9375rem;
    margin-bottom: 24px;
  }

  .games-grid {
    grid-template-columns: 1fr;
  }

  .game-card-inner {
    padding: 20px;
  }
}
</style>
