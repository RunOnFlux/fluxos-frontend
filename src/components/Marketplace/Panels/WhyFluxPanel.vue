<template>
  <div class="why-flux-panel" :style="panelStyle">
    <VCard class="why-flux-card" elevation="0">
      <VCardText>
        <h2 v-if="titleText" class="why-flux-title">{{ titleText }}</h2>
        <p v-if="subtitleText" class="why-flux-subtitle">{{ subtitleText }}</p>

        <div class="benefits-grid">
          <div
            v-for="(benefit, index) in benefitsList"
            :key="index"
            class="benefit-item"
          >
            <div class="benefit-icon-wrapper">
              <VIcon :icon="benefit.icon || 'mdi-check-circle'" size="40" color="primary" />
            </div>
            <h3 class="benefit-title">{{ benefit.title }}</h3>
            <p class="benefit-description">{{ benefit.description }}</p>
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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

const i18n = useI18n()
const { t, te } = i18n

// Helper function to check if a string is an i18n key
const isI18nKey = str => {
  return str && typeof str === 'string' && str.startsWith('i18n:')
}

// Get translated or raw title
const titleText = computed(() => {
  if (!props.panel.title) return ''

  if (isI18nKey(props.panel.title)) {
    const key = props.panel.title.replace('i18n:', '')
    
    return te(key) ? t(key) : props.panel.title
  }

  return props.panel.title
})

// Get translated or raw subtitle
const subtitleText = computed(() => {
  if (!props.panel.subtitle) return ''

  if (isI18nKey(props.panel.subtitle)) {
    const key = props.panel.subtitle.replace('i18n:', '')
    
    return te(key) ? t(key) : props.panel.subtitle
  }

  return props.panel.subtitle
})

// Get translated or raw benefits
const benefitsList = computed(() => {
  if (!props.panel.benefits) return []

  if (isI18nKey(props.panel.benefits)) {
    const key = props.panel.benefits.replace('i18n:', '')

    // Try direct access via locale messages
    let benefits = null
    try {
      const locale = i18n.locale.value
      const parts = key.split('.')
      let value = i18n.messages.value[locale]

      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part]
        } else {
          break
        }
      }

      benefits = value
    } catch (e) {
      // Silently handle error
    }

    // Convert to array and unwrap proxy objects
    if (benefits && typeof benefits === 'object') {
      let benefitsArray = Array.isArray(benefits) ? benefits : Object.values(benefits)

      // Deep clone to unwrap all proxies
      benefitsArray = JSON.parse(JSON.stringify(benefitsArray))

      // Extract actual string values from compiled i18n message objects
      benefitsArray = benefitsArray.map(benefit => {
        const extractString = obj => {
          if (typeof obj === 'string') return obj
          if (obj && typeof obj === 'object') {
            return obj.body?.static || obj.loc?.source || obj.static || JSON.stringify(obj)
          }
          
          return String(obj)
        }

        return {
          icon: extractString(benefit.icon),
          title: extractString(benefit.title),
          description: extractString(benefit.description),
        }
      })

      return benefitsArray
    }

    return []
  }

  return props.panel.benefits
})

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
.why-flux-panel {
  margin-bottom: 8px;
}

.why-flux-card {
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
}

.why-flux-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
  color: rgb(var(--v-theme-primary));
}

.why-flux-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

.benefit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 24px;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.benefit-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.15);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.benefit-icon-wrapper {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.15) 0%, rgba(var(--v-theme-success), 0.1) 100%);
  border-radius: 50%;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.benefit-item:hover .benefit-icon-wrapper {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.25) 0%, rgba(var(--v-theme-success), 0.15) 100%);
  transform: scale(1.1);
}

.benefit-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: rgb(var(--v-theme-on-surface));
}

.benefit-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .benefits-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }

  .why-flux-title {
    font-size: 1.75rem;
  }

  .why-flux-subtitle {
    font-size: 1rem;
    margin-bottom: 32px;
  }

  .benefit-item {
    padding: 24px 20px;
  }
}

@media (max-width: 600px) {
  .why-flux-panel {
    padding: 8px 16px !important;
  }

  .benefits-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .why-flux-title {
    font-size: 1.5rem;
  }

  .why-flux-subtitle {
    font-size: 0.9375rem;
    margin-bottom: 24px;
  }

  .benefit-item {
    padding: 20px 16px;
  }

  .benefit-icon-wrapper {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }

  .benefit-icon-wrapper :deep(.v-icon) {
    font-size: 32px !important;
  }

  .benefit-title {
    font-size: 1.125rem;
  }

  .benefit-description {
    font-size: 0.875rem;
  }
}
</style>
