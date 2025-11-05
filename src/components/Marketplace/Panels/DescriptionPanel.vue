<template>
  <div class="description-panel" :style="panelStyle">
    <VCard class="description-card" elevation="0">
      <VCardText>
        <!-- Main Description -->
        <div v-if="contentText" class="main-description">
          <h2 v-if="titleText" class="section-title">{{ titleText }}</h2>
          <div class="description-content" v-html="sanitizedContent"></div>
        </div>

        <!-- Highlights/Key Features -->
        <div v-if="highlightsList && highlightsList.length" class="highlights-section">
          <h3 class="highlights-title">{{ t('components.marketplace.panels.descriptionPanel.keyFeatures') }}</h3>
          <div class="highlights-grid">
            <div
              v-for="(highlight, index) in highlightsList"
              :key="index"
              class="highlight-item"
            >
              <VIcon color="primary" size="24" class="highlight-icon">
                mdi-check-circle
              </VIcon>
              <span class="highlight-text">{{ highlight }}</span>
            </div>
          </div>
        </div>

        <!-- Additional Sections (for more text content) -->
        <div v-if="panel.sections && panel.sections.length" class="additional-sections">
          <div
            v-for="(section, index) in panel.sections"
            :key="index"
            class="content-section"
          >
            <h3 class="section-subtitle">{{ section.title }}</h3>
            <div class="section-text" v-html="sanitizeHtml(section.content)"></div>
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DOMPurify from 'dompurify'
import { useGameUtils } from '@/composables/useGameUtils'

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
const { t, te, tm } = i18n

const { getMinimumPrice } = useGameUtils()

// Calculate minimum price from app configurations
const minimumPrice = computed(() => {
  return getMinimumPrice(props.app)
})

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

// Get translated or raw content
const contentText = computed(() => {
  if (!props.panel.content) return ''

  let content = ''
  if (isI18nKey(props.panel.content)) {
    const key = props.panel.content.replace('i18n:', '')
    content = te(key) ? t(key) : props.panel.content
  } else {
    content = props.panel.content
  }

  // Replace price placeholder with actual minimum price
  // Use $$ to escape the dollar sign in the replacement string
  const price = minimumPrice.value || '0.00'
  
  return content.replace(/\[\[minPrice\]\]/g, `$$${price}`)
})

// Get translated or raw highlights
const highlightsList = computed(() => {
  if (!props.panel.highlights) return []

  if (isI18nKey(props.panel.highlights)) {
    const key = props.panel.highlights.replace('i18n:', '')

    if (te(key)) {
      // Try multiple methods to get the array
      let highlights = null

      // Method 1: Try tm()
      try {
        highlights = tm(key)
      } catch (e) {
        // Silently handle error
      }

      // Method 2: Try direct access via locale
      if (!highlights || (typeof highlights === 'object' && Object.keys(highlights).length === 0)) {
        try {
          const locale = i18n.locale.value
          const parts = key.split('.')
          let value = i18n.messages.value[locale]

          for (const part of parts) {
            if (value && typeof value === 'object') {
              value = value[part]
            }
          }

          highlights = value
        } catch (e) {
          // Silently handle error
        }
      }

      // Convert to array and unwrap proxy objects
      if (highlights && typeof highlights === 'object') {
        let highlightsArray = Array.isArray(highlights) ? highlights : Object.values(highlights)

        // Deep clone to unwrap all proxies
        highlightsArray = JSON.parse(JSON.stringify(highlightsArray))

        // Extract actual string values from compiled i18n message objects
        highlightsArray = highlightsArray.map(item => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object') {
            // Try to get the actual string from compiled message object
            return item.body?.static || item.loc?.source || item.static || String(item)
          }
          
          return String(item)
        })

        return highlightsArray
      }
      
      return []
    }
    
    return []
  }

  return props.panel.highlights
})

const sanitizedContent = computed(() => {
  if (!contentText.value) return ''
  
  return DOMPurify.sanitize(contentText.value, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h3', 'h4', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
})

const sanitizeHtml = html => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

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
.description-panel {
  margin-bottom: 8px;
}

.description-card {
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.6);
  backdrop-filter: blur(10px);
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 24px;
  color: rgb(var(--v-theme-primary));
}

.main-description {
  margin-bottom: 32px;
}

.description-content {
  font-size: 1.125rem;
  line-height: 1.8;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.description-content :deep(p) {
  margin-bottom: 16px;
}

.description-content :deep(strong) {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.description-content :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.description-content :deep(a:hover) {
  text-decoration: underline;
}

.highlights-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.highlights-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 24px;
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.highlight-item:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  transform: translateX(4px);
}

.highlight-icon {
  flex-shrink: 0;
}

.highlight-text {
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 500;
}

.additional-sections {
  margin-top: 32px;
}

.content-section {
  margin-bottom: 32px;
}

.content-section:last-child {
  margin-bottom: 0;
}

.section-subtitle {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: rgb(var(--v-theme-on-surface));
}

.section-text {
  font-size: 1.0625rem;
  line-height: 1.7;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

.section-text :deep(p) {
  margin-bottom: 12px;
}

.section-text :deep(ul),
.section-text :deep(ol) {
  margin-left: 24px;
  margin-bottom: 12px;
}

.section-text :deep(li) {
  margin-bottom: 8px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .section-title {
    font-size: 1.75rem;
  }

  .description-content {
    font-size: 1rem;
  }

  .highlights-grid {
    grid-template-columns: 1fr;
  }

  .section-subtitle {
    font-size: 1.25rem;
  }

  .section-text {
    font-size: 1rem;
  }
}

@media (max-width: 600px) {
  .description-panel {
    padding: 8px 16px !important;
  }

  .section-title {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }

  .description-content {
    font-size: 0.9375rem;
  }

  .highlights-title {
    font-size: 1.25rem;
  }

  .highlight-item {
    padding: 10px 12px;
  }

  .highlight-text {
    font-size: 0.9375rem;
  }
}
</style>
