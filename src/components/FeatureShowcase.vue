<template>
  <VCard :class="['feature-showcase', { 'has-background': backgroundColor }]" :elevation="elevation">
    <VCardText :style="containerStyle">
      <h2 v-if="resolvedTitle" class="showcase-title">{{ resolvedTitle }}</h2>
      <p v-if="resolvedSubtitle" class="showcase-subtitle">{{ resolvedSubtitle }}</p>

      <div class="features-grid" :style="gridStyle">
        <div
          v-for="(item, index) in resolvedItems"
          :key="index"
          class="feature-item"
        >
          <div class="feature-icon-wrapper" :style="getIconWrapperStyle(item)">
            <VIcon :icon="item.icon || 'mdi-check-circle'" :size="iconSize" :color="item.color || iconColor" />
          </div>
          <h3 class="feature-title">{{ item.title }}</h3>
          <p class="feature-description">{{ item.description }}</p>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  // Header content
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },

  // Feature items - can be array of objects or i18n key string
  items: {
    type: [Array, String],
    required: true,
  },

  // Styling customization
  gridMinWidth: {
    type: String,
    default: '280px',
  },
  iconSize: {
    type: Number,
    default: 40,
  },
  iconColor: {
    type: String,
    default: 'primary',
  },
  backgroundColor: {
    type: String,
    default: '',
  },
  padding: {
    type: String,
    default: '32px',
  },
  elevation: {
    type: Number,
    default: 0,
  },
  // Gradient options for icon wrapper
  gradientStart: {
    type: String,
    default: 'rgba(var(--v-theme-primary), 0.15)',
  },
  gradientEnd: {
    type: String,
    default: 'rgba(var(--v-theme-success), 0.1)',
  },
})

const { t, te, locale, messages } = useI18n()

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

// Helper to get deeply nested i18n value
const getNestedI18nValue = key => {
  try {
    const parts = key.split('.')
    let value = messages.value[locale.value]

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part]
      } else {
        break
      }
    }

    return value
  } catch (e) {
    return null
  }
}

// Resolve title
const resolvedTitle = computed(() => resolveI18nValue(props.title))

// Resolve subtitle
const resolvedSubtitle = computed(() => resolveI18nValue(props.subtitle))

// Resolve items
const resolvedItems = computed(() => {
  // If items is a string (i18n key), fetch from i18n
  if (typeof props.items === 'string' && isI18nKey(props.items)) {
    const key = props.items.replace('i18n:', '')
    const items = getNestedI18nValue(key)

    if (items && typeof items === 'object') {
      let itemsArray = Array.isArray(items) ? items : Object.values(items)

      // Deep clone to unwrap proxies
      itemsArray = JSON.parse(JSON.stringify(itemsArray))

      // Extract actual string values from compiled i18n message objects
      return itemsArray.map(item => {
        const extractString = obj => {
          if (typeof obj === 'string') return obj
          if (obj && typeof obj === 'object') {
            return obj.body?.static || obj.loc?.source || obj.static || JSON.stringify(obj)
          }
          return String(obj)
        }

        return {
          icon: extractString(item.icon),
          title: extractString(item.title),
          description: extractString(item.description),
          color: item.color ? extractString(item.color) : undefined,
        }
      })
    }

    return []
  }

  // If items is an array, resolve any i18n keys in individual items
  if (Array.isArray(props.items)) {
    return props.items.map(item => ({
      icon: resolveI18nValue(item.icon) || item.icon,
      title: resolveI18nValue(item.title) || item.title,
      description: resolveI18nValue(item.description) || item.description,
      color: item.color,
    }))
  }

  return []
})

// Container style
const containerStyle = computed(() => ({
  padding: props.padding,
  background: props.backgroundColor || 'transparent',
}))

// Grid style
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(auto-fit, minmax(${props.gridMinWidth}, 1fr))`,
}))

// Icon wrapper style
const getIconWrapperStyle = item => {
  // If item has custom color, use it for gradient
  if (item.color) {
    return {
      background: `linear-gradient(135deg, rgba(var(--v-theme-${item.color}), 0.15) 0%, rgba(var(--v-theme-${item.color}), 0.1) 100%)`,
    }
  }

  // Use default gradient from props
  return {
    background: `linear-gradient(135deg, ${props.gradientStart} 0%, ${props.gradientEnd} 100%)`,
  }
}
</script>

<style scoped>
.feature-showcase {
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
}

.feature-showcase.has-background {
  background: rgba(var(--v-theme-surface), 0.8);
}

.showcase-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
  color: rgb(var(--v-theme-primary));
}

.showcase-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
}

.features-grid {
  display: grid;
  gap: 24px;
  margin-top: 32px;
}

.feature-item {
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

.feature-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.15);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.feature-icon-wrapper {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.feature-item:hover .feature-icon-wrapper {
  transform: scale(1.1);
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: rgb(var(--v-theme-on-surface));
}

.feature-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgba(var(--v-theme-on-surface), 0.8);
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
    gap: 20px;
  }

  .showcase-title {
    font-size: 1.75rem;
  }

  .showcase-subtitle {
    font-size: 1rem;
    margin-bottom: 32px;
  }

  .feature-item {
    padding: 24px 20px;
  }
}

@media (max-width: 600px) {
  .features-grid {
    grid-template-columns: 1fr !important;
    gap: 16px;
  }

  .showcase-title {
    font-size: 1.5rem;
  }

  .showcase-subtitle {
    font-size: 0.9375rem;
    margin-bottom: 24px;
  }

  .feature-item {
    padding: 20px 16px;
  }

  .feature-icon-wrapper {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }

  .feature-icon-wrapper :deep(.v-icon) {
    font-size: 32px !important;
  }

  .feature-title {
    font-size: 1.125rem;
  }

  .feature-description {
    font-size: 0.875rem;
  }
}
</style>
