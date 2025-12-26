<template>
  <VCard class="orbit-pricing-card">
    <VCardText>
      <h2 class="section-title">
        {{ t('pages.apps.register.orbit.pricing.title') }}
      </h2>
      <p class="section-subtitle">
        {{ t('pages.apps.register.orbit.pricing.subtitle') }}
      </p>

      <div class="pricing-plans three-plans">
        <!-- Free Plan (Coming Soon) -->
        <div class="plan-card free-plan disabled-plan">
          <div class="coming-soon-badge">
            <VChip color="grey" size="small" variant="flat">
              {{ t('pages.apps.register.orbit.pricing.comingSoon') }}
            </VChip>
          </div>

          <div class="plan-header">
            <h3 class="plan-name">{{ t('pages.apps.register.orbit.pricing.free') }}</h3>
            <div class="plan-price">
              <span class="price-amount">$0</span>
              <span class="price-period">{{ t('pages.apps.register.orbit.pricing.perMonth') }}</span>
            </div>
            <p class="plan-tagline">{{ t('pages.apps.register.orbit.pricing.freePriceDetail') }}</p>
          </div>

          <div class="plan-features">
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.freeFeatures.builds') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.freeFeatures.cpu') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.freeFeatures.ram') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.freeFeatures.storage') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.freeFeatures.frameworks') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.freeFeatures.support') }}</span>
            </div>
          </div>

          <VBtn
            v-if="showButtons"
            color="grey"
            variant="outlined"
            block
            disabled
            class="plan-cta"
          >
            {{ t('pages.apps.register.orbit.pricing.comingSoon') }}
          </VBtn>
        </div>

        <!-- Beta Plan (Active) -->
        <div
          class="plan-card beta-plan"
          :class="{ 'selected': selectedPlan === 'beta' }"
          @click="selectPlan('beta')"
        >
          <div class="recommended-badge">
            <VChip color="success" size="small" variant="flat">
              {{ t('pages.apps.register.orbit.pricing.beta') }}
            </VChip>
          </div>

          <div class="plan-header">
            <h3 class="plan-name">{{ t('pages.apps.register.orbit.pricing.beta') }}</h3>
            <div class="plan-price">
              <span class="price-amount beta-price">$0</span>
              <span class="price-period">{{ t('pages.apps.register.orbit.pricing.perMonth') }}</span>
            </div>
            <p class="plan-tagline">{{ t('pages.apps.register.orbit.pricing.betaPriceDetail') }}</p>
          </div>

          <div class="plan-features">
            <div class="feature-item highlight">
              <VIcon size="18" color="success">mdi-infinity</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.betaFeatures.deployments') }}</span>
            </div>
            <div class="feature-item highlight">
              <VIcon size="18" color="success">mdi-infinity</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.betaFeatures.builds') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.betaFeatures.cpu') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.betaFeatures.ram') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.betaFeatures.storage') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.betaFeatures.frameworks') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.betaFeatures.support') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.betaFeatures.customDomain') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.betaFeatures.geolocation') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.betaFeatures.cicd') }}</span>
            </div>
          </div>

          <VBtn
            v-if="showButtons"
            color="success"
            variant="flat"
            block
            class="plan-cta"
            @click.stop="$emit('selectPlan', 'beta')"
          >
            {{ t('pages.apps.register.orbit.pricing.selectPlan') }}
          </VBtn>
        </div>

        <!-- Pro Plan (Coming Soon) -->
        <div class="plan-card pro-plan disabled-plan">
          <div class="coming-soon-badge">
            <VChip color="grey" size="small" variant="flat">
              {{ t('pages.apps.register.orbit.pricing.comingSoon') }}
            </VChip>
          </div>

          <div class="plan-header">
            <h3 class="plan-name">{{ t('pages.apps.register.orbit.pricing.pro') }}</h3>
            <div class="plan-price">
              <span class="price-amount">$15</span>
              <span class="price-period">{{ t('pages.apps.register.orbit.pricing.perMonth') }}</span>
            </div>
            <p class="plan-tagline">{{ t('pages.apps.register.orbit.pricing.proPriceDetail') }}</p>
          </div>

          <div class="plan-features">
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-infinity</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.proFeatures.builds') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.proFeatures.cpu') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.proFeatures.ram') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.proFeatures.storage') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.proFeatures.frameworks') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.proFeatures.support') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.proFeatures.customDomain') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.proFeatures.geolocation') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="grey">mdi-check</VIcon>
              <span>{{ t('pages.apps.register.orbit.pricing.proFeatures.cicd') }}</span>
            </div>
          </div>

          <VBtn
            v-if="showButtons"
            color="grey"
            variant="outlined"
            block
            disabled
            class="plan-cta"
          >
            {{ t('pages.apps.register.orbit.pricing.comingSoon') }}
          </VBtn>
        </div>
      </div>

      <!-- Resource Comparison Table -->
      <div class="resource-comparison">
        <h4 class="comparison-title">Resource Comparison</h4>
        <div class="comparison-table">
          <div class="comparison-row header">
            <div class="comparison-cell">Resource</div>
            <div class="comparison-cell">Free</div>
            <div class="comparison-cell">Beta</div>
            <div class="comparison-cell">Pro</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell">Active Deployments</div>
            <div class="comparison-cell">1</div>
            <div class="comparison-cell highlight">Unlimited</div>
            <div class="comparison-cell">5 (+$3/extra)</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell">CPU</div>
            <div class="comparison-cell">1 vCPU</div>
            <div class="comparison-cell highlight">2 vCPU</div>
            <div class="comparison-cell">2 vCPU</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell">RAM</div>
            <div class="comparison-cell">2 GB</div>
            <div class="comparison-cell highlight">6 GB</div>
            <div class="comparison-cell">6 GB</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell">Storage</div>
            <div class="comparison-cell">10 GB</div>
            <div class="comparison-cell highlight">40 GB</div>
            <div class="comparison-cell">40 GB</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell">Builds/Month</div>
            <div class="comparison-cell">50</div>
            <div class="comparison-cell highlight">Unlimited</div>
            <div class="comparison-cell">Unlimited</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell">Branch Previews</div>
            <div class="comparison-cell">-</div>
            <div class="comparison-cell highlight">Yes</div>
            <div class="comparison-cell">Yes</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell">Custom Domain</div>
            <div class="comparison-cell">-</div>
            <div class="comparison-cell highlight">Yes</div>
            <div class="comparison-cell">Yes</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell">Geolocation</div>
            <div class="comparison-cell">-</div>
            <div class="comparison-cell highlight">Yes</div>
            <div class="comparison-cell">Yes</div>
          </div>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  showButtons: {
    type: Boolean,
    default: true,
  },
  showBillingOptions: {
    type: Boolean,
    default: true,
  },
  initialPlan: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['selectPlan'])

const { t } = useI18n()

const selectedPlan = ref(props.initialPlan)
const selectedBillingPeriod = ref('1')

const selectPlan = plan => {
  selectedPlan.value = plan
}
</script>

<style scoped>
.orbit-pricing-card {
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  color: rgb(var(--v-theme-on-surface));
}

.section-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 2rem;
  opacity: 0.8;
}

.pricing-plans {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

.pricing-plans.three-plans {
  grid-template-columns: repeat(3, 1fr);
}

.plan-card {
  position: relative;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.plan-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.plan-card.selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.plan-card.disabled-plan {
  opacity: 0.6;
  cursor: not-allowed;
}

.plan-card.disabled-plan:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.12);
  transform: none;
  box-shadow: none;
}

.coming-soon-badge {
  position: absolute;
  top: -12px;
  right: 20px;
}

.beta-plan {
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.05) 0%, rgba(var(--v-theme-primary), 0.05) 100%);
}

.beta-plan:hover,
.beta-plan.selected {
  border-color: rgb(var(--v-theme-success));
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.1) 0%, rgba(var(--v-theme-primary), 0.1) 100%);
}

.beta-plan .feature-item.highlight {
  color: rgb(var(--v-theme-success));
}

.price-amount.beta-price {
  color: rgb(var(--v-theme-success));
}

.pro-plan {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.03) 0%, rgba(var(--v-theme-success), 0.03) 100%);
}

.pro-plan:hover:not(.disabled-plan),
.pro-plan.selected {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08) 0%, rgba(var(--v-theme-success), 0.08) 100%);
}

.recommended-badge {
  position: absolute;
  top: -12px;
  right: 20px;
}

.plan-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.plan-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.price-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.free-plan .price-amount {
  color: rgb(var(--v-theme-success));
}

.price-period {
  font-size: 1rem;
  opacity: 0.7;
}

.plan-tagline {
  font-size: 0.875rem;
  opacity: 0.7;
  margin: 0;
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9375rem;
}

.feature-item.highlight {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.billing-options {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 8px;
}

.billing-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  text-align: center;
}

.billing-options :deep(.v-btn-toggle) {
  width: 100%;
}

.billing-options :deep(.v-btn) {
  flex: 1;
}

.plan-cta {
  margin-top: auto;
}

.build-limit-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(var(--v-theme-warning), 0.08);
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 2rem;
}

.resource-comparison {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 12px;
  padding: 1.5rem;
}

.comparison-title {
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
}

.comparison-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comparison-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  align-items: center;
}

.comparison-row.header {
  background: rgb(var(--v-theme-primary));
  color: white;
  font-weight: 600;
}

.comparison-row:not(.header) {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.comparison-cell {
  text-align: center;
}

.comparison-cell:first-child {
  text-align: left;
  font-weight: 500;
}

.comparison-cell.highlight {
  color: rgb(var(--v-theme-success));
  font-weight: 600;
}

/* Responsive */
@media (max-width: 1024px) {
  .pricing-plans.three-plans {
    grid-template-columns: 1fr;
  }

  .comparison-row {
    grid-template-columns: 2fr 1fr 1fr 1fr;
    font-size: 0.875rem;
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .pricing-plans {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .billing-options :deep(.v-btn-toggle) {
    flex-wrap: wrap;
  }

  .billing-options :deep(.v-btn) {
    flex: 1 1 45%;
  }

  .comparison-row {
    grid-template-columns: 1.5fr 1fr 1fr 1fr;
    font-size: 0.75rem;
    gap: 0.25rem;
    padding: 0.5rem;
  }
}
</style>
