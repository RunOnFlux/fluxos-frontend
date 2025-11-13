<template>
  <nav class="breadcrumb-nav" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="breadcrumb-item"
      >
        <!-- Link for non-current items -->
        <RouterLink
          v-if="!isCurrent(index)"
          :to="item.to"
          class="breadcrumb-link"
        >
          {{ resolveText(item.text) }}
        </RouterLink>

        <!-- Current item (last item) -->
        <span
          v-else
          class="breadcrumb-current-text"
          :aria-current="isCurrent(index) ? 'page' : undefined"
        >
          {{ resolveText(item.text) }}
        </span>

        <!-- Separator (not shown after last item) -->
        <VIcon
          v-if="!isCurrent(index)"
          class="breadcrumb-separator"
        >
          mdi-chevron-right
        </VIcon>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  // Array of breadcrumb items
  // Each item should have: { text: string, to: string | RouteLocationRaw }
  // The 'text' can be a direct string or an i18n key with 'i18n:' prefix
  items: {
    type: Array,
    required: true,
    validator: value => {
      return value.every(item =>
        item.text && (typeof item.text === 'string') &&
        (!item.to || typeof item.to === 'string' || typeof item.to === 'object'),
      )
    },
  },
})

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

// Resolve text (supports i18n keys)
const resolveText = text => {
  return resolveI18nValue(text)
}

// Check if the item is the current (last) item
const isCurrent = index => {
  return index === props.items.length - 1
}
</script>

<style scoped>
/* Breadcrumb Navigation */
.breadcrumb-nav {
  padding: 16px 0;
  margin-bottom: 24px;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  transition: opacity 0.2s;
  font-size: 0.95rem;
}

.breadcrumb-link:hover {
  opacity: 0.7;
  text-decoration: underline;
}

.breadcrumb-separator {
  margin: 0 8px;
  opacity: 0.5;
  font-size: 14px;
}

.breadcrumb-current-text {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.95rem;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .breadcrumb-nav {
    padding: 12px 0;
    margin-bottom: 16px;
  }

  .breadcrumb-link,
  .breadcrumb-current-text {
    font-size: 0.875rem;
  }

  .breadcrumb-separator {
    margin: 0 6px;
    font-size: 12px;
  }
}
</style>
