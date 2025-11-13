<template>
  <VCard class="section-card trustpilot-section" :class="{ 'ma-4': addMargin }">
    <VCardText class="pa-8">
      <div class="trustpilot-header text-center mb-6">
        <h2 class="text-h4 mb-3 font-weight-bold">{{ t('common.trustpilot.title') }}</h2>
        <a
          :href="t('common.trustpilot.profileUrl')"
          target="_blank"
          rel="noopener noreferrer"
          class="trustpilot-link"
        >
          <div class="trustpilot-rating-container">
            <div class="trustpilot-logo mb-3">
              <VIcon icon="mdi-star" size="32" color="#00b67a" />
              <span class="trustpilot-text">Trustpilot</span>
            </div>
            <div class="trustpilot-stars mb-2">
              <VIcon v-for="i in fullStars" :key="i" icon="mdi-star" size="starSize" color="#00b67a" />
              <VIcon v-if="hasHalfStar" icon="mdi-star-half-full" size="starSize" color="#00b67a" />
            </div>
            <div class="trustpilot-rating-text">
              <span v-if="showRatingLabel" class="rating-label">{{ t('common.trustpilot.ratingLabel') }}</span>
              <span class="rating-score">{{ displayRatingText }}</span>
              <span v-if="showReviewsText" class="rating-reviews">{{ displayReviewsText }}</span>
            </div>
          </div>
        </a>
      </div>

      <!-- Sample Reviews (optional) -->
      <div v-if="showReviews" class="trustpilot-reviews">
        <VRow>
          <VCol v-for="(review, index) in displayReviews" :key="index" cols="12" md="4">
            <VCard variant="outlined" class="review-card pa-4">
              <div class="review-stars mb-2">
                <VIcon
                  v-for="i in review.rating"
                  :key="i"
                  icon="mdi-star"
                  size="20"
                  color="#00b67a"
                />
              </div>
              <p class="review-text text-body-2 mb-3">
                "{{ review.text }}"
              </p>
              <div class="review-author text-caption text-medium-emphasis">
                <VIcon icon="mdi-check-circle" size="14" color="success" class="mr-1" />
                {{ review.author }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ t('common.trustpilot.verifiedCustomer') }}
              </div>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <!-- CTA Button -->
      <div v-if="showButton" class="text-center mt-6">
        <VBtn
          :href="t('common.trustpilot.profileUrl')"
          target="_blank"
          rel="noopener noreferrer"
          color="success"
          variant="outlined"
          size="large"
        >
          <VIcon start>mdi-open-in-new</VIcon>
          {{ t('common.trustpilot.viewAllReviews') }}
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTrustpilot } from '@/composables/useTrustpilot'

const props = defineProps({
  // Show sample reviews section
  showReviews: {
    type: Boolean,
    default: true,
  },
  // Show "View All Reviews" button
  showButton: {
    type: Boolean,
    default: true,
  },
  // Star display configuration (if null, uses live data)
  stars: {
    type: Number,
    default: null, // null = use live data, otherwise use prop value
  },
  // Star size
  starSize: {
    type: [String, Number],
    default: 28,
  },
  // Add margin around card (ma-4)
  addMargin: {
    type: Boolean,
    default: false,
  },
  // Show "Excellent" rating label
  showRatingLabel: {
    type: Boolean,
    default: false,
  },
  // Show reviews text
  showReviewsText: {
    type: Boolean,
    default: true,
  },
  // Use live TrustPilot data (fetched in background)
  useLiveData: {
    type: Boolean,
    default: true,
  },
})

const { t } = useI18n()

// Initialize TrustPilot composable (fetches data in background)
const {
  rating,
  reviewCount,
  ratingText,
  reviewsText,
  sampleReviews,
  isUsingLiveData,
} = useTrustpilot()

// Use live data if enabled, otherwise use props/i18n
const displayRating = computed(() => {
  if (props.useLiveData && props.stars === null) {
    return rating.value
  }
  return props.stars !== null ? props.stars : parseFloat(t('common.trustpilot.score'))
})

const displayRatingText = computed(() => {
  if (props.useLiveData) {
    return ratingText.value
  }
  return t('common.trustpilot.rating')
})

const displayReviewsText = computed(() => {
  if (props.useLiveData) {
    return reviewsText.value
  }
  return t('common.trustpilot.reviews')
})

const displayReviews = computed(() => {
  if (props.useLiveData) {
    return sampleReviews.value
  }
  return [
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
  ]
})

const fullStars = computed(() => Math.floor(displayRating.value))
const hasHalfStar = computed(() => displayRating.value % 1 !== 0)
</script>

<style scoped>
.trustpilot-section {
  background: linear-gradient(135deg, rgba(0, 182, 122, 0.05) 0%, rgba(0, 182, 122, 0.02) 100%);
}

.trustpilot-link {
  text-decoration: none;
  color: inherit;
}

.trustpilot-rating-container {
  display: inline-block;
}

.trustpilot-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.trustpilot-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #00b67a;
}

.trustpilot-stars {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.trustpilot-rating-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rating-label {
  font-size: 1.25rem;
  font-weight: 700;
}

.rating-score {
  font-size: 1.25rem;
  font-weight: 700;
}

.rating-reviews {
  font-size: 0.95rem;
  opacity: 0.7;
}

.trustpilot-reviews {
  margin-top: 2rem;
}

.review-card {
  height: 100%;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 182, 122, 0.2);
}

.review-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 182, 122, 0.15);
}

.review-stars {
  display: flex;
  gap: 2px;
}

.review-text {
  line-height: 1.6;
  font-style: italic;
  min-height: 60px;
}

.review-author {
  display: flex;
  align-items: center;
  font-weight: 600;
  margin-bottom: 4px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .trustpilot-text {
    font-size: 1.25rem;
  }

  .rating-label,
  .rating-score {
    font-size: 1.1rem;
  }
}

@media (max-width: 600px) {
  .trustpilot-logo {
    flex-direction: column;
    gap: 4px;
  }

  .trustpilot-text {
    font-size: 1rem;
  }

  .rating-label,
  .rating-score {
    font-size: 1rem;
  }

  .rating-reviews {
    font-size: 0.85rem;
  }
}
</style>
