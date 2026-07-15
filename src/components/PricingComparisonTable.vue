<template>
  <div class="pricing-comparison">
    <h2 v-if="title" class="comparison-heading">{{ title }}</h2>
    <p v-if="subtitle" class="comparison-subheading">{{ subtitle }}</p>

    <div class="comparison-table">
      <div class="comparison-row comparison-header">
        <div class="comparison-cell">{{ labels.provider }}</div>
        <div class="comparison-cell">{{ labels.instances }}</div>
        <div class="comparison-cell">{{ labels.cpu }}</div>
        <div class="comparison-cell">{{ labels.ram }}</div>
        <div class="comparison-cell">{{ labels.storage }}</div>
        <div class="comparison-cell">{{ labels.pricePerMonth }}</div>
      </div>
      <div
        v-for="(provider, index) in pricingComparison"
        :key="index"
        class="comparison-row"
        :class="{ highlighted: provider.highlighted }"
      >
        <div class="comparison-cell provider-cell">
          <VIcon v-if="provider.highlighted" icon="mdi-star" color="warning" size="20" class="mr-2" />
          <strong>{{ provider.name }}</strong>
        </div>
        <div class="comparison-cell" :data-label="labels.instances">{{ provider.instances }}</div>
        <div class="comparison-cell" :data-label="labels.cpu">{{ provider.cpu }}</div>
        <div class="comparison-cell" :data-label="labels.ram">{{ provider.ram }}</div>
        <div class="comparison-cell" :data-label="labels.storage">{{ provider.storage }}</div>
        <div class="comparison-cell price-cell" :data-label="labels.pricePerMonth">
          <span :class="{ 'best-price': provider.highlighted }">{{ provider.price }}</span>
          <VProgressCircular
            v-if="provider.loading"
            indeterminate
            size="14"
            width="2"
            color="primary"
            class="ml-2"
          />
        </div>
      </div>
    </div>

    <div v-if="note" class="pricing-note">
      <VIcon icon="mdi-information-outline" color="info" size="24" class="pricing-note-icon" />
      <div class="pricing-note-text">
        <span v-html="note"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { usePricingComparison } from '@/composables/usePricingComparison'

defineProps({
  // Optional heading rendered above the table.
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },

  // Optional footnote (HTML allowed) — e.g. the methodology / capture date.
  note: {
    type: String,
    default: '',
  },

  // Column headers. Defaults to English so comparison pages need no i18n; the
  // register landing passes its translated labels.
  labels: {
    type: Object,
    default: () => ({
      provider: 'Provider',
      instances: 'Instances',
      cpu: 'vCPU',
      ram: 'RAM',
      storage: 'Storage',
      pricePerMonth: 'Price / month',
    }),
  },
})

// Fires once the live FluxCloud price has settled (resolved or fell back to the
// default). Pages use it to release their prerender snapshot.
const emit = defineEmits(['priceResolved'])

const { pricingComparison, calculateFluxCloudPrice } = usePricingComparison()

onMounted(async () => {
  await calculateFluxCloudPrice()
  emit('priceResolved')
})
</script>

<style scoped>
.pricing-comparison {
  margin: 2rem 0;
}

.comparison-heading {
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  color: rgb(var(--v-theme-on-surface));
}

.comparison-subheading {
  text-align: center;
  margin-bottom: 1rem;
  opacity: 0.85;
}

.comparison-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comparison-row {
  display: grid;
  grid-template-columns: 2fr 0.8fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  align-items: center;
}

.comparison-header {
  background: rgb(var(--v-theme-primary));
  color: white;
  font-weight: 600;
}

.comparison-row.highlighted {
  background: rgba(var(--v-theme-primary), 0.08);
  border: 2px solid rgb(var(--v-theme-primary));
}

.comparison-cell {
  text-align: center;
}

.provider-cell {
  text-align: left;
  display: flex;
  align-items: center;
}

.price-cell {
  font-weight: 600;
}

.best-price {
  color: rgb(var(--v-theme-success));
  font-size: 1.125rem;
  font-weight: 700;
}

.pricing-note {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(var(--v-theme-info), 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.6;
}

.pricing-note-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.pricing-note-text {
  flex: 1;
}

@media (max-width: 960px) {
  .comparison-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1.5rem 1rem;
  }

  .comparison-cell {
    text-align: left;
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
  }

  .comparison-cell::before {
    content: attr(data-label);
    font-weight: 600;
    color: rgba(var(--v-theme-on-surface), 0.7);
  }

  .comparison-header {
    display: none;
  }

  .provider-cell {
    font-size: 1.125rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    justify-content: flex-start;
  }

  .provider-cell::before {
    content: none;
  }
}
</style>
