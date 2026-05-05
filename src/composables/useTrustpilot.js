// src/composables/useTrustpilot.js
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFluxStore } from '@/stores/flux'
import { storeToRefs } from 'pinia'

/**
 * Composable for managing TrustPilot data from Pinia store
 *
 * Features:
 * - Reads TrustPilot data from centralized Pinia store
 * - Data is fetched once on app load in App.vue
 * - Falls back to i18n predefined data if fetch fails
 * - Shared across all component instances via store
 */
export function useTrustpilot() {
  const { t } = useI18n()
  const fluxStore = useFluxStore()
  const { trustpilot } = storeToRefs(fluxStore)

  /**
   * Get predefined fallback data from i18n
   */
  const getFallbackData = () => ({
    rating: parseFloat(t('common.trustpilot.score')) || 4.6,
    reviewCount: parseInt(t('common.trustpilot.reviewsCount')) || 21,
    ratingText: t('common.trustpilot.rating'),
    reviewsText: t('common.trustpilot.reviews'),
    profileUrl: t('common.trustpilot.profileUrl'),
    ratingLabel: t('common.trustpilot.ratingLabel'),
    title: t('common.trustpilot.title'),
    sampleReviews: [
      {
        text: t('common.trustpilot.sampleReviews.review1.text'),
        author: t('common.trustpilot.sampleReviews.review1.author'),
        rating: parseInt(t('common.trustpilot.sampleReviews.review1.rating')),
      },
      {
        text: t('common.trustpilot.sampleReviews.review2.text'),
        author: t('common.trustpilot.sampleReviews.review2.author'),
        rating: parseInt(t('common.trustpilot.sampleReviews.review2.rating')),
      },
      {
        text: t('common.trustpilot.sampleReviews.review3.text'),
        author: t('common.trustpilot.sampleReviews.review3.author'),
        rating: parseInt(t('common.trustpilot.sampleReviews.review3.rating')),
      },
    ],
    source: 'fallback',
    fetchedAt: null,
  })

  // Computed properties for easy access - read from store
  const trustpilotData = computed(() => trustpilot.value.data || getFallbackData())
  const rating = computed(() => trustpilotData.value?.rating || parseFloat(t('common.trustpilot.score')) || 4.6)
  const reviewCount = computed(() => trustpilotData.value?.reviewCount || parseInt(t('common.trustpilot.reviewsCount')) || 21)
  const ratingText = computed(() => trustpilotData.value?.ratingText || t('common.trustpilot.rating'))
  const reviewsText = computed(() => trustpilotData.value?.reviewsText || t('common.trustpilot.reviews'))
  const sampleReviews = computed(() => trustpilotData.value?.sampleReviews || getFallbackData().sampleReviews)
  const isUsingLiveData = computed(() => trustpilotData.value?.source === 'live')

  /**
   * Force refresh data (bypass cache)
   */
  const refresh = async () => {
    fluxStore.clearTrustpilotCache()
    await fluxStore.fetchTrustpilot()
  }

  /**
   * Clear cache
   */
  const clearCache = () => {
    fluxStore.clearTrustpilotCache()
  }

  return {
    // Data
    trustpilotData,
    rating,
    reviewCount,
    ratingText,
    reviewsText,
    sampleReviews,

    // State
    isLoading: computed(() => trustpilot.value.isLoading),
    isFetched: computed(() => trustpilot.value.isFetched),
    isUsingLiveData,
    fetchError: computed(() => trustpilot.value.fetchError),

    // Methods
    refresh,
    clearCache,
  }
}
