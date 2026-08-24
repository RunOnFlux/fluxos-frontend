<template>
  <VCard class="related-links-card" :class="[{ 'has-background': backgroundColor }]" :elevation="elevation">
    <VCardText :style="containerStyle">
      <h2 v-if="resolvedTitle" class="links-title">{{ resolvedTitle }}</h2>
      <p v-if="resolvedSubtitle" class="links-subtitle">{{ resolvedSubtitle }}</p>

      <div class="links-grid" :style="gridStyle">
        <component
          :is="isExternal(link.to) ? 'a' : RouterLink"
          v-for="(link, index) in resolvedLinks"
          :key="index"
          v-bind="isExternal(link.to)
            ? { href: link.to, target: '_blank', rel: 'noopener noreferrer' }
            : { to: link.to }"
          class="link-card"
        >
          <VIcon :icon="link.icon || 'mdi-link'" :size="iconSize" :color="link.color || iconColor" class="link-icon" />
          <h3 class="link-title">{{ link.title }}</h3>
          <p class="link-description">{{ link.description }}</p>
        </component>
      </div>
    </VCardText>
  </VCard>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

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

const { t, te, tm, locale, messages } = useI18n()

// Links to the dedicated sites (wordpress.runonflux.com, orbit.runonflux.com, ...)
// are absolute URLs — RouterLink cannot resolve those, so render a plain anchor.
const isExternal = to => typeof to === 'string' && /^https?:\/\//i.test(to)

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
    console.log('🔍 RelatedLinksGrid - i18n key:', key)

    // Check if key exists
    if (!te(key)) {
      console.log('❌ RelatedLinksGrid - key does not exist:', key)
      
      return []
    }

    const links = tm(key)
    console.log('📦 RelatedLinksGrid - tm() result:', links)
    console.log('📦 RelatedLinksGrid - tm() type:', typeof links)
    console.log('📦 RelatedLinksGrid - tm() isArray:', Array.isArray(links))

    // Helper function to get count of array/object items
    const getLength = obj => {
      if (Array.isArray(obj)) return obj.length
      if (typeof obj === 'object' && obj !== null) return Object.keys(obj).length
      
      return 0
    }

    const length = getLength(links)
    console.log('📊 RelatedLinksGrid - array length:', length)
    if (length === 0) return []

    // Build array by directly translating each index
    const result = []
    for (let i = 0; i < length; i++) {
      const toKey = `${key}.${i}.to`
      const iconKey = `${key}.${i}.icon`
      const titleKey = `${key}.${i}.title`
      const descKey = `${key}.${i}.description`
      const colorKey = `${key}.${i}.color`
      console.log(`🔑 RelatedLinksGrid - checking keys for item ${i}: to=${toKey}, title=${titleKey}`)

      // Use t() to get the actual translated strings
      if (te(toKey) && te(titleKey)) {
        const to = t(toKey)
        const title = t(titleKey)
        const description = te(descKey) ? t(descKey) : ''
        console.log(`✅ RelatedLinksGrid - translated[${i}]:`, {
          to: typeof to,
          title: typeof title,
          description: typeof description,
        })
        console.log(`📝 RelatedLinksGrid - to value:`, to)
        console.log(`📝 RelatedLinksGrid - title value:`, title)
        console.log(`📝 RelatedLinksGrid - description value:`, description)

        result.push({
          to,
          icon: te(iconKey) ? t(iconKey) : 'mdi-link',
          title,
          description,
          color: te(colorKey) ? t(colorKey) : undefined,
        })
      } else {
        console.log(`❌ RelatedLinksGrid - keys not found: toExists=${te(toKey)}, titleExists=${te(titleKey)}`)
      }
    }

    console.log('🎯 RelatedLinksGrid - final result:', result)
    
    return result
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
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.related-links-card :deep(.v-card-text) {
  padding: 24px !important;
}

.related-links-card.has-background {
  background: rgba(var(--v-theme-surface), 0.8);
}

.links-title {
  font-size: 28px;
  font-weight: 700;
  margin-top: 0.5rem;
  margin-bottom: 12px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.3;
}

.links-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 16px;
  opacity: 0.9;
  line-height: 1.6;
}

.links-grid {
  display: grid;
  gap: 24px;
  margin-top: 32px;
}

.link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 24px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  min-height: fit-content;
  height: auto;
}

.link-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(var(--v-theme-on-surface), 0.24);
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
  max-height: none;
  height: auto;
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
