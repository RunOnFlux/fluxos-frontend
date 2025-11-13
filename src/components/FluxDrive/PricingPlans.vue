<template>
  <div class="pricing-plans-container">
    <!-- Result message -->
    <VAlert
      v-if="resultMessage"
      :type="getAlertType(resultMessage)"
      class="mb-6"
      v-html="resultMessage"
    />

    <!-- Title Section -->
    <div class="plans-section">
      <h2 class="section-title">{{ t('components.fluxDrive.pricingPlans.title') }}</h2>
      <p class="section-subtitle">{{ t('components.fluxDrive.pricingPlans.subtitle') }}</p>

      <!-- Plans Grid -->
      <div class="plans-grid">
        <div
          v-for="plan in fluxDrivePlans"
          :key="plan.id"
          class="plan-card"
          :class="{
            'recommended': plan.popular,
            'current-plan': getPlanStatus(plan.id) === 'current',
            'disabled-plan': (getPlanStatus(plan.id) === 'downgrade' && hasActiveSubscription) || getPlanStatus(plan.id) === 'downgrade-blocked'
          }"
        >
          <!-- Recommended Badge -->
          <div v-if="plan.popular" class="recommended-badge">
            {{ plan.badge || t('components.fluxDrive.pricingPlans.popular') }}
          </div>

          <!-- Price Badge -->
          <div class="plan-price-badge">
            <span v-if="plan.price && plan.price.trim()" class="price-amount">{{ plan.price }}</span>
            <span v-else class="price-amount">{{ t('components.fluxDrive.pricingPlans.customPricing') }}</span>
            <span class="price-period">{{ plan.price ? t('components.fluxDrive.pricingPlans.perMonth') : t('components.fluxDrive.pricingPlans.pricing') }}</span>
          </div>

          <!-- Plan Header -->
          <div class="plan-header">
            <h3 class="plan-name">{{ plan.name }}</h3>
            <p v-if="getPlanStatus(plan.id) === 'current'" class="plan-status-badge current">
              {{ t('components.fluxDrive.pricingPlans.currentPlan') }}
            </p>
          </div>

          <!-- Plan Resources -->
          <div class="plan-resources">
            <!-- Storage -->
            <div class="resource-row">
              <VIcon class="resource-icon storage-icon">mdi-database</VIcon>
              <span class="resource-label">{{ t('components.fluxDrive.pricingPlans.storage') }}</span>
              <span class="resource-value">{{ plan.storage }}</span>
            </div>

            <!-- Daily Cost -->
            <div v-if="plan.price && plan.price.trim()" class="resource-row">
              <VIcon class="resource-icon cost-icon">mdi-calendar-today</VIcon>
              <span class="resource-label">{{ t('components.fluxDrive.pricingPlans.dailyCost') }}</span>
              <span class="resource-value">{{ t('components.fluxDrive.pricingPlans.dailyCostValue') }}</span>
            </div>

            <!-- Features as Resource Rows -->
            <div
              v-for="(feature, index) in plan.features.slice(0, 3)"
              :key="index"
              class="resource-row"
            >
              <VIcon class="resource-icon feature-icon">mdi-check-circle</VIcon>
              <span class="resource-label" style="grid-column: 2 / 4;">{{ feature }}</span>
            </div>
          </div>

          <!-- Action Button -->
          <VBtn
            v-if="getPlanStatus(plan.id) === 'current' && paymentGateway === 'cryptocom'"
            block
            color="error"
            variant="outlined"
            size="large"
            class="plan-btn"
            @click="$emit('cancelSubscription')"
          >
            <VIcon start>mdi-cancel</VIcon>
            {{ t('pages.fluxDrive.cancel') }}
          </VBtn>
          <VBtn
            v-else-if="getPlanStatus(plan.id) === 'current'"
            block
            color="success"
            variant="flat"
            size="large"
            class="plan-btn"
            disabled
          >
            <VIcon start>mdi-check</VIcon>
            {{ t('components.fluxDrive.pricingPlans.current') }}
          </VBtn>
          <VBtn
            v-else
            block
            :color="getButtonConfig(plan).color"
            :variant="getButtonConfig(plan).variant"
            :loading="subscribing && selectedPlan === plan.id"
            :disabled="subscribing || getButtonConfig(plan).disabled"
            size="large"
            class="plan-btn"
            @click="handleSelectPlan(plan.id)"
          >
            <VIcon start>{{ getButtonIcon(plan) }}</VIcon>
            {{ getButtonConfig(plan).text }}
          </VBtn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFluxDrive } from '@/composables/useFluxDrive'

// Define emit with proper signature
const emit = defineEmits(['select-plan', 'selectPlan', 'cancelSubscription'])

// i18n
const { t } = useI18n()

// Use the composable
const {
  isLoggedIn,
  subscribing,
  selectedPlan,
  fluxDrivePlans,
  resultMessage,
  getAlertType,
  hasActiveSubscription,
  currentPlan,
  getPlanStatus,
  paymentGateway,
} = useFluxDrive()

// Get button configuration based on plan status
const getButtonConfig = plan => {
  // Enterprise plan always shows Contact Us
  if (plan.id === 'enterprise') {
    return {
      text: t('components.fluxDrive.pricingPlans.contactUs'),
      color: 'primary',
      variant: 'flat',
      disabled: false,
      action: 'contact',
    }
  }

  // If not logged in, show Sign In
  if (!isLoggedIn.value) {
    return {
      text: t('components.fluxDrive.pricingPlans.signIn'),
      color: 'primary',
      variant: 'flat',
      disabled: false,
      action: 'signin',
    }
  }

  // Get plan status for authenticated users
  const status = getPlanStatus(plan.id)

  switch (status) {
  case 'current':
    return {
      text: t('components.fluxDrive.pricingPlans.current'),
      color: 'success',
      variant: 'flat',
      disabled: true,
      action: 'current',
    }
  case 'renew':
    return {
      text: t('components.fluxDrive.pricingPlans.renew'),
      color: 'error',
      variant: 'flat',
      disabled: false,
      action: 'renew',
    }
  case 'upgrade':
    return {
      text: t('components.fluxDrive.pricingPlans.upgrade'),
      color: 'primary',
      variant: 'flat',
      disabled: false,
      action: 'upgrade',
    }
  case 'downgrade':
    return {
      text: t('components.fluxDrive.pricingPlans.downgrade'),
      color: 'warning',
      variant: 'outlined',
      disabled: hasActiveSubscription.value,
      action: 'downgrade',
    }
  case 'downgrade-blocked':
    return {
      text: t('components.fluxDrive.pricingPlans.downgradeBlocked'),
      color: 'error',
      variant: 'outlined',
      disabled: true,
      action: 'downgrade-blocked',
    }
  default:
    return {
      text: t('components.fluxDrive.pricingPlans.getStarted'),
      color: 'primary',
      variant: 'flat',
      disabled: false,
      action: 'subscribe',
    }
  }
}

// Get button icon based on plan
const getButtonIcon = plan => {
  if (plan.id === 'enterprise') return 'mdi-email'
  if (!isLoggedIn.value) return 'mdi-login'

  const status = getPlanStatus(plan.id)
  switch (status) {
  case 'current':
    return 'mdi-check'
  case 'renew':
    return 'mdi-refresh'
  case 'upgrade':
    return 'mdi-arrow-up-bold'
  case 'downgrade':
    return 'mdi-arrow-down-bold'
  default:
    return 'mdi-cart'
  }
}

// Handle plan selection
const handleSelectPlan = planId => {
  const plan = fluxDrivePlans.value.find(p => p.id === planId)
  if (!plan) return

  const buttonConfig = getButtonConfig(plan)

  // Handle enterprise/contact plans
  if (buttonConfig.action === 'contact') {
    window.location.href = 'mailto:support@runonflux.io?subject=FluxDrive%20Enterprise%20Plan%20Inquiry'

    return
  }

  // Handle sign in
  if (buttonConfig.action === 'signin') {
    // Trigger sign in modal or redirect
    // This should be handled by parent component
    emit('selectPlan', planId, 'subscribe')

    return
  }

  // Emit event with action type for other cases
  const actionType = buttonConfig.action === 'subscribe' ? 'subscribe' : buttonConfig.action
  emit('selectPlan', planId, actionType)
}
</script>

<style scoped>
.pricing-plans-container {
  padding: 24px 0;
  margin: 0 auto;
}

/* Section Styling */
.plans-section {
  padding: 32px 0;
}

.section-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
}

.section-subtitle {
  font-size: 1.1rem;
  text-align: center;
  opacity: 0.7;
  margin-bottom: 48px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

/* Plans Grid */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin: 0 auto;
}

/* Plan Card */
.plan-card {
  position: relative;
  background: rgba(var(--v-theme-surface), 1);
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.plan-card.recommended {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 8px 32px rgba(var(--v-theme-primary), 0.3);
}

.plan-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(33, 150, 243, 0.4);
  border-color: rgba(33, 150, 243, 0.5);
}

.plan-card.current-plan {
  border-color: rgb(var(--v-theme-success));
  box-shadow: 0 8px 32px rgba(var(--v-theme-success), 0.2);
}

.plan-card.disabled-plan {
  opacity: 0.6;
  pointer-events: none;
}

/* Recommended Badge */
.recommended-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  color: white;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.4);
}

/* Price Badge */
.plan-price-badge {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.2) 0%, rgba(var(--v-theme-success), 0.1) 100%);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-success), 0.3);
}

.price-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-success));
  line-height: 1;
}

.price-period {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.7;
}

/* Plan Header */
.plan-header {
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.plan-status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 8px;
}

.plan-status-badge.current {
  background: rgba(var(--v-theme-success), 0.2);
  color: rgb(var(--v-theme-success));
  border: 1px solid rgba(var(--v-theme-success), 0.3);
}

/* Plan Resources */
.plan-resources {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.resource-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.resource-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  transform: translateX(4px);
}

.resource-icon {
  font-size: 22px;
}

.storage-icon {
  color: #2196F3;
}

.cost-icon {
  color: #4CAF50;
}

.feature-icon {
  color: rgb(var(--v-theme-success));
  font-size: 18px;
}

.resource-label {
  font-size: 0.95rem;
  font-weight: 500;
}

.resource-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  text-align: right;
}

/* Plan Button */
.plan-btn {
  margin-top: auto;
  min-height: 48px !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
  transition: all 0.3s ease;
}

.plan-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(var(--v-theme-primary), 0.4);
}

/* Mobile Responsive */
@media (max-width: 960px) {
  .plans-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }

  .price-amount {
    font-size: 2rem;
  }
}

@media (max-width: 600px) {
  .pricing-plans-container {
    padding: 16px 0;
  }

  .plans-section {
    padding: 24px 0;
  }

  .plans-grid {
    grid-template-columns: 1fr;
    gap: 24px;
    max-width: 400px;
  }

  .plan-card {
    padding: 20px;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .section-subtitle {
    font-size: 0.95rem;
    margin-bottom: 32px;
  }

  .recommended-badge {
    top: -10px;
    font-size: 0.7rem;
    padding: 5px 16px;
  }

  .price-amount {
    font-size: 2.25rem;
  }

  .plan-name {
    font-size: 1.35rem;
  }

  .resource-row {
    padding: 10px;
  }

  .resource-icon {
    font-size: 20px;
  }

  .resource-label,
  .resource-value {
    font-size: 0.9rem;
  }
}
</style>
