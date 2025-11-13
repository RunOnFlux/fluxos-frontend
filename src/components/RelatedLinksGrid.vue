<template>
  <VCard :class="['related-links-card', { 'has-background': backgroundColor }]" :elevation="elevation">
    <VCardTitle v-if="resolvedTitle" class="links-title">
      {{ resolvedTitle }}
    </VCardTitle>
    <VCardText :style="containerStyle">
      <p v-if="resolvedSubtitle" class="links-subtitle">{{ resolvedSubtitle }}</p>

      <div class="links-grid" :style="gridStyle">
        <RouterLink
          v-for="(link, index) in resolvedLinks"
          :key="index"
          :to="link.to"
          class="link-card"
        >
          <VIcon :icon="link.icon || 'mdi-link'" :size="iconSize" :color="link.color || iconColor" class="link-icon" />
          <h3 class="link-title">{{ link.title }}</h3>
          <p class="link-description">{{ link.description }}</p>
        </RouterLink>
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

  // Links array - can be array of objects or i18n key string
  links: {
    type: [Array, String],
    required: true,
  },

  // Styling customization
  gridMinWidth: {
    type: String,
    default: '250px',
  },
  iconSize: {
    type: Number,
    default: 48,
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
    default: '24px',
  },
  elevation: {
    type: Number,
    default: 0,
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

// Resolve links
const resolvedLinks = computed(() => {
  // If links is a string (i18n key), fetch from i18n
  if (typeof props.links === 'string' && isI18nKey(props.links)) {
    const key = props.links.replace('i18n:', '')
    const links = getNestedI18nValue(key)

    if (links && typeof links === 'object') {
      let linksArray = Array.isArray(links) ? links : Object.values(links)

      // Deep clone to unwrap proxies
      linksArray = JSON.parse(JSON.stringify(linksArray))

      // Extract actual string values from compiled i18n message objects
      return linksArray.map(link => {
        const extractString = obj => {
          if (typeof obj === 'string') return obj
          if (obj && typeof obj === 'object') {
            return obj.body?.static || obj.loc?.source || obj.static || JSON.stringify(obj)
          }
          return String(obj)
        }

        return {
          to: extractString(link.to),
          icon: extractString(link.icon),
          title: extractString(link.title),
          description: extractString(link.description),
          color: link.color ? extractString(link.color) : undefined,
        }
      })
    }

    return []
  }

  // If links is an array, resolve any i18n keys in individual items
  if (Array.isArray(props.links)) {
    return props.links.map(link => ({
      to: resolveI18nValue(link.to) || link.to,
      icon: resolveI18nValue(link.icon) || link.icon,
      title: resolveI18nValue(link.title) || link.title,
      description: resolveI18nValue(link.description) || link.description,
      color: link.color,
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
</script>

<style scoped>
.related-links-card {
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
}

.related-links-card.has-background {
  background: rgba(var(--v-theme-surface), 0.8);
}

.links-title {
  font-size: 2rem;
  font-weight: 700;
  padding: 24px 24px 8px 24px;
  text-align: center;
  color: rgb(var(--v-theme-primary));
}

.links-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 32px;
  opacity: 0.9;
  line-height: 1.6;
}

.links-grid {
  display: grid;
  gap: 24px;
  margin-top: 24px;
}

.link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 24px;
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.link-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.link-icon {
  margin-bottom: 16px;
}

.link-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface));
}

.link-description {
  font-size: 0.875rem;
  line-height: 1.5;
  opacity: 0.7;
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .links-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
    gap: 20px;
  }

  .links-title {
    font-size: 1.75rem;
  }

  .links-subtitle {
    font-size: 1rem;
    margin-bottom: 24px;
  }

  .link-card {
    padding: 24px 20px;
  }
}

@media (max-width: 600px) {
  .links-grid {
    grid-template-columns: 1fr !important;
    gap: 16px;
  }

  .links-title {
    font-size: 1.5rem;
  }

  .links-subtitle {
    font-size: 0.9375rem;
    margin-bottom: 20px;
  }

  .link-card {
    padding: 20px 16px;
  }

  .link-title {
    font-size: 1.125rem;
  }

  .link-description {
    font-size: 0.8125rem;
  }
}
</style>
