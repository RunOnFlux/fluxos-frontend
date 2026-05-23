<template>
  <VCard
    :href="app.redirectUrl || undefined"
    :to="!app.redirectUrl ? `/marketplace/${app.name?.toLowerCase() || app.uuid}` : undefined"
    :target="app.redirectUrl ? '_blank' : undefined"
    :rel="app.redirectUrl ? 'noopener' : undefined"
    class="marketplace-card"
    elevation="2"
  >
    <!-- Uniform Square Image -->
    <div class="image-section">
      <div v-if="!app.icon" class="placeholder-image">
        <VIcon icon="mdi-application" size="24" color="white" />
      </div>
      <VImg
        v-else
        :src="app.icon"
        :alt="app.displayName || app.name"
        class="app-icon"
        cover
      >
        <template #placeholder>
          <div class="placeholder-image">
            <VIcon icon="mdi-image" size="24" color="grey-lighten-3" />
          </div>
        </template>
        <template #error>
          <div class="placeholder-image">
            <VIcon icon="mdi-application" size="24" color="grey-lighten-3" />
          </div>
        </template>
      </VImg>
    </div>

    <!-- Card Content -->
    <VCardText class="content-section">
      <!-- App Title -->
      <div class="app-title">
        {{ app.displayName || app.name }}
      </div>

      <!-- Developer -->
      <div class="app-developer">
        {{ app.developer || t('components.marketplace.marketplaceAppCard.unknown') }}
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat">
          <VIcon icon="mdi-download" size="12" />
          <span>{{ formatNumber(app.installCount) }}</span>
        </div>
        <div class="stat">
          <VIcon icon="mdi-star" color="warning" size="12" />
          <span>{{ app.rating || '0' }}</span>
        </div>
      </div>

      <!-- Category -->
      <div v-if="app.category" class="category-section">
        <VChip
          :color="getCategoryColor(app.category)"
          size="x-small"
          variant="tonal"
          class="category-tag"
        >
          {{ getCategoryName(app.category) }}
        </VChip>
      </div>
    </VCardText>

    <!-- Fixed Price Position -->
    <div class="price-section">
      <VChip
        :color="app.price ? 'success' : 'primary'"
        size="small"
        variant="flat"
        class="price-tag"
      >
        {{ app.price ? `$${app.price}` : t('components.marketplace.marketplaceAppCard.free') }}
      </VChip>
    </div>

    <!-- Action Button -->
    <VCardActions class="action-section">
      <VBtn
        color="primary"
        variant="flat"
        block
        size="small"
        @click.stop="$emit('deploy', app)"
      >
        <VIcon icon="mdi-rocket-launch" size="16" class="me-1" />
        {{ t('components.marketplace.marketplaceAppCard.install') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMarketplace } from '@/composables/useMarketplace'
import { useMarketplaceUtils } from '@/composables/useMarketplaceUtils'

const props = defineProps({
  app: {
    type: Object,
    required: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['deploy'])

const { t } = useI18n()

const router = useRouter()
const { categoryMap } = useMarketplace()
const { formatNumber, getCategoryColor } = useMarketplaceUtils()

const truncatedDescription = computed(() => {
  if (!props.app.description) return t('components.marketplace.marketplaceAppCard.noDescription')

  return props.app.description.length > 100
    ? props.app.description.substring(0, 100) + '...'
    : props.app.description
})

const getCategoryName = categoryUuid => {
  return categoryMap.value.get(categoryUuid) || t('components.marketplace.marketplaceAppCard.other')
}

const getAppColor = app => {
  const appName = app.displayName || app.name || 'Unknown'
  const colors = ['primary', 'secondary', 'info', 'warning', 'error', 'success', 'purple', 'pink', 'indigo', 'teal', 'orange']
  let hash = 0
  for (let i = 0; i < appName.length; i++) {
    hash = appName.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

const getAppInitials = app => {
  const name = app.displayName || app.name || 'Unknown'
  const words = name.split(' ')
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  
  return name.substring(0, 2).toUpperCase()
}
</script>

<style scoped>
/* Card Structure */
.marketplace-card {
  height: 280px !important;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.marketplace-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Image Section - Fixed Square */
.image-section {
  height: 100px;
  position: relative;
  overflow: hidden;
  background: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 12px 12px 0 0;
}

.app-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 16px;
}

.placeholder-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
}

/* Content Section */
.content-section {
  flex-grow: 1;
  padding: 12px !important;
  padding-bottom: 8px !important;
  display: flex;
  flex-direction: column;
}

.app-title {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(var(--v-theme-primary));
}

.app-developer {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-info));
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Stats Row */
.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  align-items: center;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: rgb(var(--v-theme-secondary));
}

/* Category */
.category-section {
  margin-top: auto;
}

.category-tag {
  font-size: 0.7rem !important;
  height: 20px !important;
  font-weight: 500 !important;
}

/* Fixed Price Position */
.price-section {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.price-tag {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  color: white !important;
}

/* Action Section */
.action-section {
  padding: 8px 12px 12px 12px !important;
  margin-top: 0;
}

.action-section .v-btn {
  height: 32px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: none;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .marketplace-card {
    height: 260px !important;
  }

  .image-section {
    height: 80px;
  }

  .app-icon {
    padding: 8px;
  }
}
</style>