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
            <VExpansionPanelText class="faq-answer">
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
    required: true,
  },
})

const i18n = useI18n()
const { t, te, tm, messages } = i18n

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

// Get translated or raw subtitle
const subtitleText = computed(() => {
  if (!props.panel.subtitle) return ''

  if (isI18nKey(props.panel.subtitle)) {
    const key = props.panel.subtitle.replace('i18n:', '')
    
    return te(key) ? t(key) : props.panel.subtitle
  }

  return props.panel.subtitle
})

// Get translated or raw questions
const questionsList = computed(() => {
  if (!props.panel.questions) {
    return []
  }

  if (isI18nKey(props.panel.questions)) {
    const key = props.panel.questions.replace('i18n:', '')

    // Try to access the value directly without te() check
    let questions = null

    // Try direct access via locale messages
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

      questions = value
    } catch (e) {
      // Silently handle error
    }

    // Convert to array and unwrap proxy objects
    if (questions && typeof questions === 'object') {
      let questionsArray = Array.isArray(questions) ? questions : Object.values(questions)

      // Deep clone to unwrap all proxies
      questionsArray = JSON.parse(JSON.stringify(questionsArray))

      // Extract actual string values from compiled i18n message objects
      questionsArray = questionsArray.map(faq => {
        const extractString = obj => {
          if (typeof obj === 'string') return obj
          if (obj && typeof obj === 'object') {
            // Try to get the actual string from compiled message object
            return obj.body?.static || obj.loc?.source || obj.static || JSON.stringify(obj)
          }
          
          return String(obj)
        }

        // Replace price placeholder with actual minimum price
        // Use $$ to escape the dollar sign in the replacement string
        const replacePricePlaceholder = text => {
          if (!text) return text
          const price = minimumPrice.value || '0.00'
          
          return text.replace(/\[\[minPrice\]\]/g, `$$${price}`)
        }

        return {
          q: extractString(faq.q),
          a: replacePricePlaceholder(extractString(faq.a)),
          question: extractString(faq.q),
          answer: replacePricePlaceholder(extractString(faq.a)),
        }
      })

      return questionsArray
    }

    return []
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
    : '8px 24px',
  background: props.panel.background || 'transparent',
  borderRadius: props.panel.cornerRadius ? `${props.panel.cornerRadius}px` : '0',
  marginBottom: '15px',
}))
</script>

<style scoped>
.faq-panel {
  margin-bottom: 8px;
}

.faq-card {
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.6);
  backdrop-filter: blur(10px);
}

.faq-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
  color: rgb(var(--v-theme-primary));
}

.faq-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 32px;
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
  background: rgba(var(--v-theme-surface), 0.8) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
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
  color: rgb(var(--v-theme-primary));
}

.faq-answer :deep(ul),
.faq-answer :deep(ol) {
  margin-left: 24px;
  margin-bottom: 12px;
}

.faq-answer :deep(li) {
  margin-bottom: 8px;
}

.faq-answer :deep(a) {
  color: rgb(var(--v-theme-primary));
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
    padding: 8px 16px !important;
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
