// src/composables/useTrustpilot.js
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Shared state across all instances (singleton pattern)
const trustpilotData = ref(null)
const isLoading = ref(false)
const isFetched = ref(false)
const fetchError = ref(null)

// Cache duration (12 hours)
const CACHE_DURATION = 12 * 60 * 60 * 1000
const CACHE_KEY = 'trustpilot_cache'

/**
 * Composable for managing TrustPilot data with background fetching and fallback
 *
 * Features:
 * - Fetches live TrustPilot data in background on first page load
 * - Caches data in memory and localStorage
 * - Falls back to i18n predefined data if fetch fails
 * - Shared across all component instances
 */
export function useTrustpilot() {
  const { t } = useI18n()

  /**
   * Get predefined fallback data from i18n
   */
  const getFallbackData = () => ({
    rating: parseFloat(t('common.trustpilot.score')) || 4.4,
    reviewCount: parseInt(t('common.trustpilot.reviewsCount')) || 10,
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

  /**
   * Load cached data from localStorage
   */
  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const data = JSON.parse(cached)
      const age = Date.now() - data.fetchedAt

      // Check if cache is still valid
      if (age < CACHE_DURATION) {
        console.log('✅ TrustPilot: Loaded from cache', { age: Math.round(age / 1000 / 60) + ' minutes' })
        return data
      } else {
        console.log('⏰ TrustPilot: Cache expired', { age: Math.round(age / 1000 / 60) + ' minutes' })
        localStorage.removeItem(CACHE_KEY)
        return null
      }
    } catch (error) {
      console.warn('⚠️ TrustPilot: Failed to load cache', error)
      return null
    }
  }

  /**
   * Save data to localStorage cache
   */
  const saveToCache = (data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      console.log('💾 TrustPilot: Saved to cache')
    } catch (error) {
      console.warn('⚠️ TrustPilot: Failed to save cache', error)
    }
  }

  /**
   * Fetch live TrustPilot data from API
   *
   * Note: TrustPilot requires API credentials for direct access.
   * You'll need to:
   * 1. Create a TrustPilot Business account
   * 2. Get API credentials
   * 3. Create a backend endpoint to proxy the request (recommended)
   *
   * Alternative: Use TrustPilot's public embed/widget data endpoint
   */
  const fetchLiveData = async () => {
    // Extract business unit ID from profile URL
    // Example: https://www.trustpilot.com/review/runonflux.com -> runonflux.com
    const profileUrl = t('common.trustpilot.profileUrl')
    const businessUnitMatch = profileUrl.match(/trustpilot\.com\/review\/([^/?]+)/)
    const businessUnit = businessUnitMatch ? businessUnitMatch[1] : 'runonflux.com'

    try {
      // Option 1: Use TrustPilot's public business-units API
      // Note: This might be blocked by CORS. If so, you need a backend proxy.
      const apiUrl = `https://api.trustpilot.com/v1/business-units/find?name=${businessUnit}`

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`TrustPilot API error: ${response.status}`)
      }

      const businessData = await response.json()

      // Fetch reviews
      const reviewsUrl = `https://api.trustpilot.com/v1/business-units/${businessData.id}/reviews?perPage=3&stars=5`
      const reviewsResponse = await fetch(reviewsUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })

      let reviews = []
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json()
        reviews = reviewsData.reviews?.slice(0, 3).map(review => ({
          text: review.text || review.title,
          author: review.consumer?.displayName || 'Anonymous',
          rating: review.stars || 5,
        })) || []
      }

      const liveData = {
        rating: businessData.score?.trustScore || parseFloat(t('common.trustpilot.score')),
        reviewCount: businessData.numberOfReviews?.total || parseInt(t('common.trustpilot.reviewsCount')),
        ratingText: `${businessData.score?.trustScore?.toFixed(1) || '4.4'} out of 5`,
        reviewsText: `Based on ${businessData.numberOfReviews?.total || 10} reviews`,
        profileUrl: profileUrl,
        ratingLabel: businessData.score?.stars >= 4 ? 'Excellent' : 'Great',
        title: t('common.trustpilot.title'),
        sampleReviews: reviews.length > 0 ? reviews : getFallbackData().sampleReviews,
        source: 'live',
        fetchedAt: Date.now(),
      }

      console.log('✅ TrustPilot: Live data fetched successfully', liveData)
      return liveData
    } catch (error) {
      console.warn('⚠️ TrustPilot: Failed to fetch live data, will use fallback', error.message)

      // If CORS error, log helpful message
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        console.info('💡 TrustPilot: To fetch live data, create a backend proxy endpoint')
      }

      throw error
    }
  }

  /**
   * Initialize TrustPilot data (fetch or use cache/fallback)
   */
  const initialize = async () => {
    // If already fetched this session, don't fetch again
    if (isFetched.value) {
      return trustpilotData.value
    }

    // Try to load from cache first
    const cached = loadFromCache()
    if (cached) {
      trustpilotData.value = cached
      isFetched.value = true
      return cached
    }

    // Start with fallback data immediately (for instant display)
    trustpilotData.value = getFallbackData()

    // Fetch live data in background
    if (!isLoading.value) {
      isLoading.value = true

      try {
        const liveData = await fetchLiveData()
        trustpilotData.value = liveData
        saveToCache(liveData)
        fetchError.value = null
      } catch (error) {
        // Keep using fallback data
        fetchError.value = error
        console.log('ℹ️ TrustPilot: Using fallback data from i18n')
      } finally {
        isLoading.value = false
        isFetched.value = true
      }
    }

    return trustpilotData.value
  }

  /**
   * Force refresh data (bypass cache)
   */
  const refresh = async () => {
    isFetched.value = false
    localStorage.removeItem(CACHE_KEY)
    return initialize()
  }

  /**
   * Clear cache
   */
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY)
    trustpilotData.value = null
    isFetched.value = false
    fetchError.value = null
    console.log('🗑️ TrustPilot: Cache cleared')
  }

  // Computed properties for easy access
  const rating = computed(() => trustpilotData.value?.rating || 4.4)
  const reviewCount = computed(() => trustpilotData.value?.reviewCount || 10)
  const ratingText = computed(() => trustpilotData.value?.ratingText || '4.4 out of 5')
  const reviewsText = computed(() => trustpilotData.value?.reviewsText || 'Based on 10 reviews')
  const sampleReviews = computed(() => trustpilotData.value?.sampleReviews || getFallbackData().sampleReviews)
  const isUsingLiveData = computed(() => trustpilotData.value?.source === 'live')

  // Auto-initialize on first use
  if (!isFetched.value && !isLoading.value) {
    initialize()
  }

  return {
    // Data
    trustpilotData: computed(() => trustpilotData.value),
    rating,
    reviewCount,
    ratingText,
    reviewsText,
    sampleReviews,

    // State
    isLoading: computed(() => isLoading.value),
    isFetched: computed(() => isFetched.value),
    isUsingLiveData,
    fetchError: computed(() => fetchError.value),

    // Methods
    initialize,
    refresh,
    clearCache,
  }
}
