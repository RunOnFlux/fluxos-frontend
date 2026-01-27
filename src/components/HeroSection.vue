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
      <!-- Badge -->
      <div v-if="badgeText" class="hero-badge-wrapper mb-3">
        <div class="hero-badge-modern">
          <VIcon class="badge-icon" size="20">mdi-git</VIcon>
          <span class="badge-text">{{ resolvedBadgeText }}</span>
        </div>
      </div>

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

  // Badge
  badgeText: {
    type: String,
    default: '',
  },
  badgeColor: {
    type: String,
    default: 'success',
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
const resolvedBadgeText = computed(() => resolveI18nValue(props.badgeText))

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
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 !important;
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
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-badge-wrapper {
  display: inline-flex;
  position: relative;
  animation: fadeInDown 0.6s ease-out;
}

.hero-badge-wrapper::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50px;
  background: linear-gradient(135deg,
    rgba(74, 222, 128, 0.4),
    rgba(34, 197, 94, 0.4),
    rgba(59, 130, 246, 0.4),
    rgba(139, 92, 246, 0.4)
  );
  background-size: 300% 300%;
  animation: shimmer 3s ease-in-out infinite;
  opacity: 0.6;
  filter: blur(8px);
  z-index: -1;
}

.hero-badge-modern {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  backdrop-filter: blur(16px) saturate(180%);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset,
    0 4px 12px rgba(74, 222, 128, 0.2);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.hero-badge-modern::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transform: rotate(45deg);
  animation: shine 3s ease-in-out infinite;
}

.hero-badge-modern::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50px;
  background: radial-gradient(
    circle at 50% 0%,
    rgba(255, 255, 255, 0.3) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.hero-badge-modern:hover {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.15) 100%
  );
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset,
    0 8px 24px rgba(74, 222, 128, 0.4),
    0 0 30px rgba(74, 222, 128, 0.3);
}

.hero-badge-modern:hover::after {
  opacity: 1;
}

.badge-icon {
  color: #4ade80;
  filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.8));
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes shine {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

@keyframes iconPulse {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(74, 222, 128, 1));
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.badge-text {
  font-size: 13px;
  font-weight: 600;
  color: white;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
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
  margin-bottom: 2.5rem;
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
  transition: all 0.3s ease;
}

.hero-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
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
    margin-bottom: 2rem !important;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    margin-bottom: 3rem;
  }

  .hero-icon-top-right {
    top: 1rem;
    right: 1rem;
    opacity: 0.1;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
    align-items: center;
  }

  .hero-btn {
    width: auto;
    max-width: 280px;
    font-size: 0.9375rem !important;
    height: 48px !important;
    padding: 0 32px !important;
  }

  .hero-btn:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
}
</style>
