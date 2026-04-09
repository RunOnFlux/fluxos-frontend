<template>
  <div
    ref="cardRef"
    class="app-card-wrapper"
    :class="{ 'hovered': hovered, 'is-visible': isVisible }"
    :style="{ '--animation-order': animationOrder }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @click="viewDetails"
  >
    <VCard
      class="app-card"
      elevation="0"
    >
      <div class="card-content">
        <!-- Top section: Icon + Name (87px height) -->
        <div class="app-top-section">
          <div class="app-icon-container">
            <AppIcon :app="app" :size="60" />
          </div>

          <div class="app-name-section">
            <div class="app-name-row">
              <h3 class="app-name">{{ parsedAppName.cleanName }}</h3>
              <VChip
                v-for="(tag, index) in parsedAppName.networkTags"
                :key="index"
                size="x-small"
                color="warning"
                variant="tonal"
                class="network-chip"
              >
                {{ tag }}
              </VChip>
            </div>
            <div class="app-tags">
              <VChip
                size="x-small"
                color="grey"
                variant="outlined"
                class="category-chip"
              >
                {{ categoryName }}
              </VChip>
              <VChip
                v-for="(tag, index) in parsedAppName.hardwareTags"
                :key="index"
                size="x-small"
                color="info"
                variant="tonal"
                class="hardware-chip"
              >
                {{ tag }}
              </VChip>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <VDivider class="card-divider" />

        <!-- Stats section (35px height) -->
        <div class="app-stats-section">
          <div class="stats-row">
            <!-- Install count chip -->
            <VChip
              size="small"
              color="info"
              variant="tonal"
              class="stat-chip"
            >
              <VIcon icon="mdi-download" size="14" />
              {{ formatNumber(app.installCount || 0) }}
            </VChip>

            <!-- Price chip -->
            <VChip
              size="small"
              color="success"
              variant="tonal"
              class="price-chip"
            >
              ${{ formatPrice(app.price) }}
            </VChip>
          </div>
        </div>

        <!-- Description section (flexible height) -->
        <div class="app-description-section">
          <p class="app-description">
            {{ app.description || t('components.marketplace.appCard.noDescription') }}
          </p>
        </div>

        <!-- Action button -->
        <div class="app-action-section">
          <VBtn
            color="primary"
            variant="flat"
            size="x-small"
            rounded="pill"
            class="view-details-btn"
            @click.stop="viewDetails"
          >
            <VIcon start size="14">mdi-eye</VIcon>
            {{ t('components.marketplace.appCard.viewDetails') }}
          </VBtn>
        </div>
      </div>
    </VCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/Marketplace/AppIcon.vue'
import { useMarketplaceUtils } from '@/composables/useMarketplaceUtils'

const props = defineProps({
  app: {
    type: Object,
    required: true,
  },
  marketplaceCategories: {
    type: Array,
    default: () => [],
  },
  animationOrder: {
    type: Number,
    default: 0,
  },
})

const { t } = useI18n()

const router = useRouter()
const { formatNumber, formatPrice } = useMarketplaceUtils()

const hovered = ref(false)
const cardRef = ref(null)
const isVisible = ref(false)

const categoryName = computed(() => {
  if (!props.app.category) return t('components.marketplace.appCard.defaultCategory')

  // Find category by UUID
  const category = props.marketplaceCategories.find(cat => cat.uuid === props.app.category)

  return category ? category.name : t('components.marketplace.appCard.defaultCategory')
})

// Parse hardware info from app name
const parsedAppName = computed(() => {
  const fullName = props.app.displayName || props.app.name || ''

  console.log('🔍 Parsing app name:', fullName)

  const hardwareTags = []
  const networkTags = []
  let cleanName = fullName

  // Pattern 1: Match hardware in brackets/parentheses like (4CPU, 8GB RAM), [2 vCPU, 4GB]
  const bracketPattern = /[\[(]([^)\]]*(?:cpu|ram|gb|mb|vcpu|core)[^)\]]*)[\])]/gi
  const bracketMatches = fullName.match(bracketPattern)

  if (bracketMatches) {
    console.log('📊 Found hardware in brackets:', bracketMatches)
    cleanName = cleanName.replace(bracketPattern, '').trim()

    bracketMatches.forEach(match => {
      const content = match.replace(/[\[\]()]/g, '').trim()
      const specs = content.split(/[,;]/).map(s => s.trim()).filter(s => s)
      hardwareTags.push(...specs)
    })
  }

  // Pattern 2: Match hardware directly in name like "16GB RAM", "24GB", "4 vCPU", "8 CPU"
  // This matches: number + optional space + (GB|MB|CPU|vCPU|Core) + optional "RAM"
  const directPattern = /\b(\d+(?:\.\d+)?\s*(?:GB|MB|CPU|vCPU|Cores?|GHz)(?:\s+RAM)?)\b/gi
  const directMatches = cleanName.match(directPattern)

  if (directMatches) {
    console.log('📊 Found hardware directly in name:', directMatches)

    directMatches.forEach(match => {
      cleanName = cleanName.replace(match, '').trim()
      hardwareTags.push(match.trim())
    })
  }

  // Pattern 3: Match network types like "Testnet", "Mainnet", "Test"
  const networkPattern = /\b(Testnet|Mainnet|Test)\b/gi
  const networkMatches = cleanName.match(networkPattern)

  if (networkMatches) {
    console.log('🌐 Found network type in name:', networkMatches)

    networkMatches.forEach(match => {
      cleanName = cleanName.replace(match, '').trim()
      networkTags.push(match.trim())
    })
  }

  // Clean up any double spaces
  cleanName = cleanName.replace(/\s+/g, ' ').trim()

  console.log('✅ Parsed result:', { cleanName, hardwareTags, networkTags })

  return {
    cleanName,
    hardwareTags,
    networkTags,
  }
})

const navigateToApp = () => {
  if (props.app.redirectUrl) {
    window.open(props.app.redirectUrl, '_blank', 'noopener,noreferrer')

    return
  }

  // FluxCloud uses app.name.toLowerCase() for navigation
  const appIdentifier = props.app.name?.toLowerCase() || props.app.uuid
  router.push(`/marketplace/${appIdentifier}`)
}

const viewDetails = () => {
  navigateToApp()
}

// Intersection Observer for scroll-based animation
let observer = null

onMounted(() => {
  if (!cardRef.value) return

  observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isVisible.value) {
          isVisible.value = true
        }
      })
    },
    {
      threshold: 0.1,
      rootMargin: '200px', // Load cards 200px before they enter viewport
    },
  )

  observer.observe(cardRef.value)
})

onUnmounted(() => {
  if (observer && cardRef.value) {
    observer.unobserve(cardRef.value)
  }
})
</script>

<style scoped>
.app-card-wrapper {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 250px;
  width: 100%;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  /* Initial state - hidden */
  opacity: 0;
  transform: translateY(30px);
}

/* Scroll reveal animation - triggers when card becomes visible */
.app-card-wrapper.is-visible {
  animation: fadeInUp 0.4s ease-out forwards;
  /* Smart stagger: cap at 750ms max delay (15 cards * 0.05s) */
  animation-delay: calc(min(var(--animation-order), 15) * 0.05s);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(25px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.app-card-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12),
              0 2px 4px rgba(0, 0, 0, 0.08),
              0 1px 2px rgba(0, 0, 0, 0.06);
  z-index: -1;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.app-card-wrapper.hovered::before,
.app-card-wrapper:hover::before {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18),
              0 8px 20px rgba(0, 0, 0, 0.12),
              0 4px 8px rgba(0, 0, 0, 0.08),
              0 1px 3px rgba(0, 0, 0, 0.04);
}

.app-card {
  height: 100%;
  border-radius: 12px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  background-color: rgb(var(--v-theme-surface));
  box-shadow: inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.05);
  overflow: hidden;
}

/* Light theme hover - glowing with shadow */
.app-card-wrapper.hovered .app-card,
.app-card-wrapper:hover .app-card {
  border-color: rgba(var(--v-theme-primary), 0.8) !important;
  box-shadow: inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.05),
              0 0 20px rgba(var(--v-theme-primary), 0.6),
              0 0 40px rgba(var(--v-theme-primary), 0.4),
              0 0 60px rgba(var(--v-theme-primary), 0.2),
              inset 0 0 20px rgba(var(--v-theme-primary), 0.1) !important;
}

.app-card-wrapper.hovered::before,
.app-card-wrapper:hover::before {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3),
              0 10px 25px rgba(0, 0, 0, 0.2),
              0 5px 15px rgba(0, 0, 0, 0.15),
              0 0 30px rgba(var(--v-theme-primary), 0.7),
              0 0 60px rgba(var(--v-theme-primary), 0.5),
              0 0 90px rgba(var(--v-theme-primary), 0.3) !important;
}

/* Dark theme hover - glowing with shadow */
.v-theme--dark .app-card-wrapper.hovered .app-card,
.v-theme--dark .app-card-wrapper:hover .app-card {
  border-color: rgba(var(--v-theme-primary), 0.9) !important;
  box-shadow: inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.05),
              0 0 25px rgba(var(--v-theme-primary), 0.8),
              0 0 50px rgba(var(--v-theme-primary), 0.6),
              0 0 75px rgba(var(--v-theme-primary), 0.4),
              inset 0 0 25px rgba(var(--v-theme-primary), 0.15) !important;
}

.v-theme--dark .app-card-wrapper.hovered::before,
.v-theme--dark .app-card-wrapper:hover::before {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5),
              0 10px 25px rgba(0, 0, 0, 0.3),
              0 5px 15px rgba(0, 0, 0, 0.2),
              0 0 40px rgba(var(--v-theme-primary), 0.8),
              0 0 80px rgba(var(--v-theme-primary), 0.6),
              0 0 120px rgba(var(--v-theme-primary), 0.4) !important;
}

.card-content {
  padding: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Top section - Left-aligned layout (87px height) */
.app-top-section {
  height: 87px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 0 16px;
}

.app-icon-container {
  width: 60px;
  flex-shrink: 0;
}

.app-name-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 6px;
  text-align: left;
}

.app-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.app-name {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  text-align: left;
}

.app-tags {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  flex-wrap: wrap;
}

.category-chip {
  font-size: 0.7rem !important;
  height: 18px !important;
  padding: 0 6px !important;
}

.hardware-chip {
  font-size: 0.7rem !important;
  height: 18px !important;
  padding: 0 6px !important;
}

.network-chip {
  font-size: 0.7rem !important;
  height: 18px !important;
  padding: 0 6px !important;
  flex-shrink: 0;
}

.card-divider {
  margin: 0 8px;
  opacity: 0.1;
}

/* Stats section - FluxCloud style (35px height) */
.app-stats-section {
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

/* Stat chips styling */
.stat-chip,
.price-chip {
  font-size: 0.8rem !important;
  height: 24px !important;
  padding: 0 8px !important;
  font-weight: 600 !important;
}

/* Description section - FluxCloud style (flexible height) */
.app-description-section {
  flex: 1;
  padding: 8px 16px 4px 16px;
  display: flex;
  align-items: flex-start;
}

.app-description {
  font-size: 0.85rem;
  line-height: 1.4;
  color: rgba(var(--v-theme-on-surface), 0.8);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

/* Action section */
.app-action-section {
  padding: 4px 16px 8px 16px;
  display: flex;
  justify-content: center;
}

.view-details-btn {
  height: 28px !important;
  min-width: 120px !important;
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  padding: 0 16px !important;
}

.view-details-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(var(--v-theme-primary), 0.3);
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .card-content {
    padding: 12px;
  }

  .app-name {
    font-size: 1rem;
  }

  .app-description {
    font-size: 0.85rem;
  }
}
</style>