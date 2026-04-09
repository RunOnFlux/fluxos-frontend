<template>
  <div
    class="game-card"
    @click="navigateToGame"
    :style="{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none' }"
  >
    <!-- Price Chip -->
    <VChip
      class="price-chip"
      color="success"
      size="large"
      variant="flat"
    >
      {{ t('components.marketplace.gameCard.startingAt', { price: getMinimumPrice(game) }) }}
    </VChip>

    <!-- Content -->
    <div class="game-card-content">
      <!-- Logo Section -->
      <div class="logo-section">
        <VImg
          v-if="game.icon"
          :src="parseLandingImage(game.icon)"
          class="game-logo"
          max-height="200"
          contain
        />
      </div>

      <!-- Action Button -->
      <VBtn
        color="primary"
        size="small"
        rounded="pill"
        class="view-details-btn"
        @click.stop="navigateToGame"
      >
        <VIcon size="18" class="mr-1">mdi-eye</VIcon>
        {{ t('components.marketplace.gameCard.viewDetails') }}
      </VBtn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGameUtils } from '@/composables/useGameUtils'

const props = defineProps({
  game: {
    type: Object,
    required: true,
  },
})

const { t } = useI18n()

const router = useRouter()
const { getMinimumPrice, parseLandingImage } = useGameUtils()

const backgroundImageUrl = computed(() => {
  if (!props.game.landingImage) return ''
  const parsed = parseLandingImage(props.game.landingImage)
  console.log('🎨 Game:', props.game.name, 'Landing image:', props.game.landingImage, '→', parsed)

  return parsed
})

const navigateToGame = () => {
  if (props.game.redirectUrl) {
    window.open(props.game.redirectUrl, '_blank', 'noopener,noreferrer')

    return
  }

  const gameName = props.game.name.toLowerCase()
  console.log('🎮 Navigating to game:', gameName)
  console.log('🔗 Full path:', `/marketplace/games/${gameName}`)
  router.push(`/marketplace/games/${gameName}`)
}
</script>

<style scoped>
.game-card {
  --logo-max-height: 200px;
  height: 500px;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.game-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(var(--v-theme-primary), 0.25);
}

.price-chip {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  font-weight: 600;
  border-radius: 0 24px 0 20px;
  opacity: 0.8;
}

.game-card-content {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  padding: 32px;
}

.logo-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
}

.game-logo {
  max-height: var(--logo-max-height);
  max-width: 90%;
  height: var(--logo-max-height);
  width: auto;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.8));
}

.game-logo :deep(.v-responsive) {
  max-height: var(--logo-max-height) !important;
  height: var(--logo-max-height) !important;
  max-width: 100% !important;
  width: auto !important;
}

.game-logo :deep(.v-responsive__sizer) {
  padding-bottom: 0 !important;
}

.game-logo :deep(.v-responsive__content) {
  max-height: var(--logo-max-height) !important;
  height: 100% !important;
  max-width: 100% !important;
}

.game-logo :deep(.v-img__img) {
  object-fit: contain !important;
  position: relative !important;
  max-height: var(--logo-max-height) !important;
  max-width: 100% !important;
}

.game-logo :deep(img) {
  max-width: 100% !important;
  max-height: var(--logo-max-height) !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}

.view-details-btn {
  height: 44px;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.view-details-btn :deep(.v-icon) {
  font-size: 18px;
}

.view-details-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(var(--v-theme-primary), 0.3);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .game-card {
    --logo-max-height: 100px;
    height: 500px;
  }

  .game-card-content {
    padding: 16px;
  }

  .logo-section {
    padding: 0 10px;
  }

  .game-logo {
    max-width: 85% !important;
  }

  .view-details-btn {
    height: 50px;
    font-size: 16px;
  }

  .pricing-text {
    font-size: 14px;
  }

  .price-chip {
    font-size: 12px;
  }
}

/* Extra small screens */
@media (max-width: 400px) {
  .game-card {
    --logo-max-height: 70px;
  }

  .game-card-content {
    padding: 12px;
  }

  .logo-section {
    padding: 0 8px;
  }

  .game-logo {
    max-width: 80% !important;
  }

  .price-chip {
    font-size: 11px;
    padding: 4px 8px;
  }
}
</style>
