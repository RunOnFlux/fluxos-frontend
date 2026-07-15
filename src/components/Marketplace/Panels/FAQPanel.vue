<template>
  <div class="faq-panel" :style="panelStyle">
    <VCard class="faq-card" elevation="0">
      <VCardText>
        <h2 v-if="titleText" class="faq-title">{{ titleText }}</h2>
        <p v-if="subtitleText" class="faq-subtitle">{{ subtitleText }}</p>

        <VExpansionPanels
          v-if="questionsList && questionsList.length"
          class="faq-expansion-panels"
          multiple
        >
          <VExpansionPanel
            v-for="(faq, index) in questionsList"
            :key="index"
            class="faq-expansion-panel"
            elevation="0"
          >
            <VExpansionPanelTitle class="faq-question">
              <div class="question-wrapper">
                <VIcon icon="mdi-help-circle" color="primary" size="24" class="question-icon" />
                <h3 class="question-text">{{ faq.q || faq.question }}</h3>
              </div>
            </VExpansionPanelTitle>
            <!--
              eager: render the answer into the DOM even while the panel is
              collapsed (Vuetify then hides it with v-show, not v-if). This
              keeps the answer text in the prerendered/indexable HTML for
              crawlers and AI bots that read the visible DOM rather than the
              FAQPage JSON-LD. UX is unchanged — the panel still opens/closes. 
            -->
            <VExpansionPanelText class="faq-answer" eager>
              <div v-html="sanitizeAnswer(faq.a || faq.answer)"></div>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
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
    default: null,
  },

  // Optional: Direct FAQs array (for non-panel usage)
  faqs: {
    type: Array,
    default: null,
  },

  // Optional: Title override
  title: {
    type: String,
    default: null,
  },

  // Optional: Subtitle override
  subtitle: {
    type: String,
    default: null,
  },
})

const i18n = useI18n()
const { t, te, tm } = i18n

const { getMinimumPrice } = useGameUtils()

// Helper function to extract string from compiled i18n message objects
const extractString = obj => {
  // If it's already a string, check if it's JSON-encoded
  if (typeof obj === 'string') {
    try {
      const parsed = JSON.parse(obj)

      // If parsed successfully, try to extract the string from the structure
      if (parsed && typeof parsed === 'object' && parsed.b && parsed.b.s) {
        return parsed.b.s
      }
      
      return obj
    } catch {
      return obj
    }
  }

  if (obj && typeof obj === 'object') {
    // Try to get the actual string from compiled message object
    // Structure: {t: 0, b: {t: 2, i: [...], s: "actual text"}}
    if (obj.b && obj.b.s) {
      return obj.b.s
    }
    
    return obj.body?.static || obj.loc?.source || obj.static || JSON.stringify(obj)
  }

  return String(obj)
}

// Calculate minimum price from app configurations (only if app is provided)
const minimumPrice = computed(() => {
  if (!props.app) return '0.00'
  
  return getMinimumPrice(props.app)
})

// Helper function to check if a string is an i18n key
const isI18nKey = str => {
  return str && typeof str === 'string' && str.startsWith('i18n:')
}

// Get translated or raw title
const titleText = computed(() => {
  // Use title prop override if provided
  if (props.title) return props.title

  if (!props.panel.title) return ''

  if (isI18nKey(props.panel.title)) {
    const key = props.panel.title.replace('i18n:', '')

    return te(key) ? t(key) : props.panel.title
  }

  return props.panel.title
})

// Get translated or raw subtitle
const subtitleText = computed(() => {
  // Use subtitle prop override if provided
  if (props.subtitle) return props.subtitle

  if (!props.panel.subtitle) return ''

  if (isI18nKey(props.panel.subtitle)) {
    const key = props.panel.subtitle.replace('i18n:', '')

    return te(key) ? t(key) : props.panel.subtitle
  }

  return props.panel.subtitle
})

// Get translated or raw questions
const questionsList = computed(() => {
  // Use faqs prop override if provided
  if (props.faqs && Array.isArray(props.faqs)) {
    return props.faqs
  }

  if (!props.panel.questions) {
    return []
  }

  if (isI18nKey(props.panel.questions)) {
    const key = props.panel.questions.replace('i18n:', '')

    // Use tm() directly - te() returns false for array paths even when they exist
    const questions = tm(key)

    // Check if tm() returned valid data
    if (!questions || (typeof questions === 'object' && Object.keys(questions).length === 0)) {
      console.log('❌ FAQPanel - tm() returned empty for key:', key)
      
      return []
    }

    // Replace price placeholder with actual minimum price
    const replacePricePlaceholder = text => {
      if (!text) return ''
      const textStr = String(text)
      const price = minimumPrice.value || '0.00'

      return textStr.replace(/\[\[minPrice\]\]/g, `$${price}`)
    }

    // Deep clone to unwrap all proxies and convert to array
    let faqArray = Array.isArray(questions) ? questions : Object.values(questions)
    faqArray = JSON.parse(JSON.stringify(faqArray))

    // Build result array by extracting strings from each FAQ item
    const result = faqArray.map(faq => {
      // Extract q and a, handling both property names
      const qRaw = faq.q || faq.question || ''
      const aRaw = faq.a || faq.answer || ''

      // Use extractString to handle compiled message objects
      const q = extractString(qRaw)
      const a = extractString(aRaw)

      return {
        q,
        a: replacePricePlaceholder(a),
        question: q,
        answer: replacePricePlaceholder(a),
      }
    }).filter(faq => faq.q && faq.a) // Filter out any invalid entries

    return result
  }

  return props.panel.questions
})

const sanitizeAnswer = answer => {
  return DOMPurify.sanitize(answer, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'code'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

const panelStyle = computed(() => ({
  padding: props.panel.padding
    ? `${props.panel.padding.top}px ${props.panel.padding.right}px ${props.panel.padding.bottom}px ${props.panel.padding.left}px`
    : '0',
  background: props.panel.background || 'transparent',
  borderRadius: props.panel.cornerRadius ? `${props.panel.cornerRadius}px` : '0',
}))
</script>

<style scoped>
.faq-panel {
  margin-bottom: 0;
}

.faq-card {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.faq-card :deep(.v-card-text) {
  padding: 24px !important;
}

.faq-title {
  font-size: 28px;
  font-weight: 700;
  margin-top: 0.5rem;
  margin-bottom: 0;
  text-align: center;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.3;
}

.faq-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 16px;
  opacity: 0.9;
  line-height: 1.6;
}

.faq-expansion-panels {
  margin-top: 24px;
}

.faq-expansion-panel {
  margin-bottom: 12px;
  border-radius: 12px !important;
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.05) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  transition: all 0.3s ease;
}

.faq-expansion-panel:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

.faq-expansion-panel:last-child {
  margin-bottom: 0;
}

.faq-question {
  font-weight: 600;
  padding: 20px 24px;
}

.question-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.question-icon {
  flex-shrink: 0;
}

.question-text {
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.faq-answer {
  padding: 0 24px 20px 24px !important;
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

.faq-answer :deep(p) {
  margin-bottom: 12px;
}

.faq-answer :deep(p:last-child) {
  margin-bottom: 0;
}

.faq-answer :deep(strong) {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.faq-answer :deep(ul) {
  list-style-type: disc;
  margin-left: 0;
  padding-left: 24px;
  margin-bottom: 12px;
}

.faq-answer :deep(ol) {
  list-style-type: decimal;
  margin-left: 0;
  padding-left: 24px;
  margin-bottom: 12px;
}

.faq-answer :deep(li) {
  margin-bottom: 8px;
  padding-left: 4px;
}

.faq-answer :deep(a) {
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
}

.faq-answer :deep(a:hover) {
  text-decoration: underline;
}

.faq-answer :deep(code) {
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .faq-title {
    font-size: 1.75rem;
  }

  .faq-subtitle {
    font-size: 1rem;
  }

  .question-text {
    font-size: 1rem;
  }

  .faq-answer {
    font-size: 0.9375rem;
  }
}

@media (max-width: 600px) {
  .faq-panel {
    padding: 0 !important;
  }

  .faq-title {
    font-size: 1.5rem;
  }

  .faq-subtitle {
    font-size: 0.9375rem;
    margin-bottom: 24px;
  }

  .faq-question {
    padding: 16px;
  }

  .question-wrapper {
    gap: 12px;
  }

  .question-icon {
    font-size: 20px !important;
  }

  .question-text {
    font-size: 0.9375rem;
  }

  .faq-answer {
    padding: 0 16px 16px 16px !important;
    font-size: 0.875rem;
  }
}
</style>
