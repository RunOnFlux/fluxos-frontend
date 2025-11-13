<template>
  <div class="hero-section" :style="heroStyle" role="banner">
    <!-- Optional decorative icon -->
    <div
      v-if="icon"
      class="hero-icon-top-right"
      :role="iconAriaLabel ? 'img' : undefined"
      :aria-label="iconAriaLabel"
    >
      <VIcon :icon="icon" :size="iconSize" :color="iconColor" aria-hidden="true" />
    </div>

    <!-- Overlay -->
    <div v-if="showOverlay" class="hero-overlay" :style="overlayStyle"></div>

    <!-- Content -->
    <div class="hero-content">
      <h1 class="hero-title">{{ resolvedTitle }}</h1>
      <p v-if="resolvedSubtitle" class="hero-subtitle">{{ resolvedSubtitle }}</p>

      <!-- CTA Actions -->
      <div v-if="showCta || $slots.actions" class="hero-actions">
        <slot name="actions">
          <VBtn
            v-if="showCta"
            :color="ctaColor"
            :size="ctaSize"
            :variant="ctaVariant"
            :to="ctaTo"
            :href="ctaHref"
            class="hero-btn"
            @click="handleCtaClick"
          >
            <VIcon v-if="ctaIcon" :start="ctaIconPosition === 'start'" :end="ctaIconPosition === 'end'">
              {{ ctaIcon }}
            </VIcon>
            {{ ctaText }}
          </VBtn>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOptimizedImage } from '@/composables/useOptimizedImage'

const props = defineProps({
  // Background
  backgroundImage: {
    type: String,
    default: '',
  },
  backgroundPosition: {
    type: String,
    default: 'center',
  },
  backgroundSize: {
    type: String,
    default: 'cover',
  },
  minHeight: {
    type: String,
    default: '400px',
  },

  // Icon (top-right decorative)
  icon: {
    type: String,
    default: '',
  },
  iconSize: {
    type: [Number, String],
    default: 80,
  },
  iconColor: {
    type: String,
    default: 'white',
  },
  iconAriaLabel: {
    type: String,
    default: '',
  },

  // Content
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },

  // Overlay
  showOverlay: {
    type: Boolean,
    default: true,
  },
  overlayColor: {
    type: String,
    default: 'rgba(0, 0, 0, 0.4)',
  },
  overlayGradient: {
    type: String,
    default: '',
  },

  // CTA Button
  showCta: {
    type: Boolean,
    default: false,
  },
  ctaText: {
    type: String,
    default: '',
  },
  ctaIcon: {
    type: String,
    default: '',
  },
  ctaIconPosition: {
    type: String,
    default: 'start',
    validator: value => ['start', 'end'].includes(value),
  },
  ctaColor: {
    type: String,
    default: 'white',
  },
  ctaSize: {
    type: String,
    default: 'x-large',
  },
  ctaVariant: {
    type: String,
    default: 'elevated',
  },
  ctaTo: {
    type: [String, Object],
    default: undefined,
  },
  ctaHref: {
    type: String,
    default: undefined,
  },
})

const emit = defineEmits(['ctaClick'])

const { t, te } = useI18n()

// Helper function to check if a string is an i18n key
const isI18nKey = str => {
  return str && typeof str === 'string' && str.startsWith('i18n:')
}

// Helper function to resolve i18n keys or return raw value
const resolveI18nValue = value => {
  if (!value) return ''

  if (isI18nKey(value)) {
    const key = value.replace('i18n:', '')
    return te(key) ? t(key) : value
  }

  return value
}

const resolvedTitle = computed(() => resolveI18nValue(props.title))
const resolvedSubtitle = computed(() => resolveI18nValue(props.subtitle))

// Use optimized image (WebP with PNG fallback)
const { url: optimizedBackgroundUrl } = useOptimizedImage(props.backgroundImage)

const heroStyle = computed(() => {
  const style = {
    minHeight: props.minHeight,
  }

  const imageUrl = optimizedBackgroundUrl.value || props.backgroundImage
  if (imageUrl) {
    style.backgroundImage = `url('${imageUrl}')`
    style.backgroundSize = props.backgroundSize
    style.backgroundPosition = props.backgroundPosition
    style.backgroundRepeat = 'no-repeat'
  }

  return style
})

const overlayStyle = computed(() => {
  if (props.overlayGradient) {
    return {
      background: props.overlayGradient,
    }
  }
  return {
    background: props.overlayColor,
  }
})

const handleCtaClick = event => {
  emit('ctaClick', event)
}
</script>

<style scoped>
.hero-section {
  position: relative;
  border-radius: 24px;
  padding: 80px 32px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.hero-overlay {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
}

.hero-icon-top-right {
  position: absolute;
  top: 2rem;
  right: 2rem;
  opacity: 0.15;
  transform: rotate(15deg);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
  line-height: 1.2;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.6);
}

.hero-subtitle {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 2rem;
  line-height: 1.6;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.4);
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.hero-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .hero-section {
    padding: 60px 24px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-icon-top-right {
    top: 1.5rem;
    right: 1.5rem;
  }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 48px 16px;
    border-radius: 16px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .hero-icon-top-right {
    top: 1rem;
    right: 1rem;
    opacity: 0.1;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
  }

  .hero-btn {
    width: 100%;
  }
}
</style>
