<template>
  <VContainer>

    <!-- Result message -->
    <VAlert
      v-if="resultMessage"
      :type="getAlertType(resultMessage)"
      class="mb-6"
      v-html="resultMessage"
    />

    <!-- Pricing Plans -->
    <div class="text-center mb-8">
      <h3 class="text-h3 mb-2">
        {{ t('components.fluxDrive.pricingPlans.title') }}
      </h3>
      <p class="text-body-1 mb-6">
        {{ t('components.fluxDrive.pricingPlans.subtitle') }}
      </p>
    </div>

    <VRow class="justify-center pricing-grid d-flex justify-center" no-gutters>
      <VCol
        v-for="plan in fluxDrivePlans"
        :key="plan.id"
        cols="12"
        sm="6"
        md="6"
        lg="3"
        xl="3"
        class="d-flex pricing-col"
      >
        <div class="pricing-card-wrapper position-relative">
          <!-- Badge -->
          <div v-if="plan.badge" class="position-absolute top-badge">
            <VChip
              color="primary"
              text-color="white"
              size="small"
              variant="flat"
              class="font-weight-medium"
            >
              {{ plan.badge }}
            </VChip>
          </div>

          <VCard
            flat
            class="pricing-card h-100 w-100 d-flex flex-column rounded-lg elevation-8"
            :class="[
              plan.popular ? 'pricing-card--popular' : 'pricing-card--standard',
              getPlanStatus(plan.id) === 'current' ? 'pricing-card--current' : '',
              getPlanStatus(plan.id) === 'downgrade' || getPlanStatus(plan.id) === 'downgrade-blocked' ? 'pricing-card--downgrade' : ''
            ]"
            color="surface"
            variant="elevated"
            :disabled="(getPlanStatus(plan.id) === 'downgrade' && hasActiveSubscription) || getPlanStatus(plan.id) === 'downgrade-blocked'"
          >

            <VCardText class="text-center pa-8 d-flex flex-column flex-grow-1">
              <!-- Plan name -->
              <h3 class="text-h5 mb-4 font-weight-bold">
                {{ plan.name }}
              </h3>

              <!-- Plan price -->
              <div class="mb-6 price-section">
                <div v-if="plan.price && plan.price.trim()">
                  <!-- Daily pricing chip -->
                  <div class="d-flex justify-center mb-2">
                    <VChip
                      color="surface-variant"
                      variant="tonal"
                      size="default"
                      class="pricing-chip-small text-body-2 font-weight-medium"
                    >
                      $0.0017 GB {{ t('components.fluxDrive.pricingPlans.perDay') }}
                    </VChip>
                  </div>

                  <!-- Separator -->
                  <VDivider class="my-2 pricing-divider" />

                  <!-- Monthly pricing chip -->
                  <div class="d-flex justify-center">
                    <VChip
                      color="primary"
                      variant="flat"
                      size="default"
                      class="pricing-chip-large text-h6 font-weight-bold text-white"
                    >
                      {{ plan.price }} {{ t('components.fluxDrive.pricingPlans.perMonth') }}
                    </VChip>
                  </div>
                </div>
                <div v-else>
                  <div class="d-flex justify-center">
                    <VChip
                      color="surface-variant"
                      variant="tonal"
                      size="default"
                      class="pricing-chip-large text-body-1"
                    >
                      {{ t('components.fluxDrive.pricingPlans.billedMonthly') }}
                    </VChip>
                  </div>
                </div>
              </div>

              <!-- Storage amount -->
              <div class="mb-6 text-center">
                <span class="text-h6 font-weight-medium text-medium-emphasis">
                  {{ plan.storage }}
                </span>
                <div class="text-body-2 mt-1 text-medium-emphasis">
                  {{ t('components.fluxDrive.pricingPlans.storage') }}
                </div>
              </div>

              <!-- Plan features -->
              <div class="mb-6 flex-grow-1 features-container">
                <div
                  v-for="feature in plan.features"
                  :key="feature"
                  class="d-flex align-center justify-start py-2"
                >
                  <VIcon
                    size="16"
                    icon="mdi-check-circle"
                    color="success"
                    class="me-3"
                  />
                  <span class="text-body-2">{{ feature }}</span>
                </div>
              </div>

              <!-- Plan actions -->
              <!-- Show Cancel button for current plan (only for Crypto.com subscriptions) -->
              <VBtn
                v-if="getPlanStatus(plan.id) === 'current' && paymentGateway === 'cryptocom'"
                block
                color="error"
                variant="outlined"
                size="small"
                class="pricing-btn mt-auto"
                @click="$emit('cancel-subscription')"
              >
                {{ t('pages.fluxDrive.cancel') }}
              </VBtn>
              <!-- Show disabled Current Plan button for FluxPay users -->
              <VBtn
                v-else-if="getPlanStatus(plan.id) === 'current'"
                block
                color="success"
                variant="flat"
                size="small"
                class="pricing-btn mt-auto"
                disabled
              >
                {{ t('components.fluxDrive.pricingPlans.current') }}
              </VBtn>
              <!-- Show regular button for non-current plans -->
              <VBtn
                v-else
                block
                :color="getButtonConfig(plan).color"
                :variant="getButtonConfig(plan).variant"
                :loading="subscribing && selectedPlan === plan.id"
                :disabled="subscribing || getButtonConfig(plan).disabled"
                size="large"
                height="48"
                class="pricing-btn mt-auto"
                @click="handleSelectPlan(plan.id)"
              >
                {{ getButtonConfig(plan).text }}
              </VBtn>
            </VCardText>
          </VCard>
        </div>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFluxDrive } from '@/composables/useFluxDrive'

// Define emit with proper signature
const emit = defineEmits(['select-plan', 'selectPlan', 'cancel-subscription'])

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
      disabled: hasActiveSubscription.value, // Only enabled when subscription expired
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
      variant: 'flat',
      disabled: hasActiveSubscription.value, // Only enabled when subscription expired
      action: 'downgrade',
    }
  case 'downgrade-blocked':
    return {
      text: t('components.fluxDrive.pricingPlans.downgrade'),
      color: 'grey',
      variant: 'outlined',
      disabled: true, // Always disabled - files exceed capacity
      action: 'downgrade-blocked',
    }
  case 'signup':
  default:
    return {
      text: t('components.fluxDrive.pricingPlans.signUp'),
      color: 'primary',
      variant: 'flat',
      disabled: false,
      action: 'signup',
    }
  }
}

// Handle plan selection and emit to parent
const handleSelectPlan = planId => {
  const config = getButtonConfig({ id: planId })

  // Handle Contact Us action differently
  if (config.action === 'contact') {
    // Open support URL like FluxCloud does
    const supportUrl = 'https://support.runonflux.io'
    window.open(supportUrl, '_blank', 'noopener,noreferrer')
    
    return
  }

  // For signin action, just trigger login without plan selection
  if (config.action === 'signin') {
    // Emit without planId to just trigger login
    emit('selectPlan', null, 'signin')

    return
  }

  // For all other actions, emit to parent with action type
  emit('selectPlan', planId, config.action)
}
</script>

<style scoped>
.card-list {
  --v-card-list-gap: 0.75rem;
}

.h-100 {
  height: 100%;
}

.pricing-grid {
  row-gap: 40px;
  column-gap: 8px;
  justify-content: center !important;
  display: flex !important;
  flex-wrap: wrap !important;
}

.pricing-card-wrapper {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

.pricing-card-wrapper:hover {
  transform: translateY(-8px) scale(1.02);
}

.pricing-card {
  background: linear-gradient(145deg,
    rgb(var(--v-theme-surface)) 0%,
    color-mix(in srgb, rgb(var(--v-theme-surface)) 95%, rgb(var(--v-theme-on-surface)) 5%) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.pricing-card-wrapper:hover .pricing-card {
  box-shadow:
    0 20px 40px rgba(var(--v-theme-shadow), 0.15),
    0 10px 20px rgba(var(--v-theme-shadow), 0.1),
    inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.1);
}

.pricing-card--popular {
  background: linear-gradient(145deg,
    rgb(var(--v-theme-surface)) 0%,
    color-mix(in srgb, rgb(var(--v-theme-surface)) 98%, rgb(var(--v-theme-on-surface)) 2%) 100%);
  box-shadow:
    0 15px 35px rgba(var(--v-theme-primary), 0.2),
    0 8px 15px rgba(var(--v-theme-shadow), 0.1),
    inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.05);
  border: 2px solid rgb(var(--v-theme-primary));
}

.pricing-card-wrapper:hover .pricing-card--popular {
  box-shadow:
    0 25px 50px rgba(var(--v-theme-primary), 0.3),
    0 15px 25px rgba(var(--v-theme-shadow), 0.15),
    inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.08);
  border: 2px solid rgb(var(--v-theme-primary));
}

.pricing-card-wrapper:has(.pricing-card--popular):hover {
  transform: translateY(-12px) scale(1.03);
}

.pricing-card--standard {
  background: linear-gradient(145deg,
    rgb(var(--v-theme-surface)) 0%,
    color-mix(in srgb, rgb(var(--v-theme-surface)) 98%, rgb(var(--v-theme-on-surface)) 2%) 100%);
  box-shadow:
    0 10px 25px rgba(var(--v-theme-shadow), 0.08),
    0 5px 10px rgba(var(--v-theme-shadow), 0.04),
    inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-outline), 0.08);
}

.pricing-card-wrapper:hover .pricing-card--standard {
  background: linear-gradient(145deg,
    rgb(var(--v-theme-surface)) 0%,
    color-mix(in srgb, rgb(var(--v-theme-surface)) 96%, rgb(var(--v-theme-on-surface)) 4%) 100%);
  box-shadow:
    0 20px 40px rgba(var(--v-theme-shadow), 0.12),
    0 10px 20px rgba(var(--v-theme-shadow), 0.08),
    inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.08);
}

.pricing-btn {
  min-height: 48px !important;
  height: 48px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  border-radius: 12px !important;
}

.top-badge {
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.top-badge .v-chip {
  position: relative;
}

.top-badge .v-chip::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgb(var(--v-theme-primary));
}

.price-section {
  min-height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pricing-chip-small {
  height: 32px !important;
  min-width: 160px !important;
  border-radius: 4px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.pricing-chip-large {
  height: 40px !important;
  min-width: 160px !important;
  border-radius: 4px !important;
  padding: 0 16px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .pricing-grid {
    row-gap: 32px !important;
    justify-content: center !important;
    padding-bottom: 40px !important;
  }

  .pricing-col {
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }

  .pricing-col:last-child {
    margin-bottom: 0 !important;
  }

  .pricing-card-wrapper {
    margin-bottom: 0 !important;
    max-width: 340px !important;
    width: 100% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    will-change: transform;
    backface-visibility: hidden;
  }

  .pricing-chip-small,
  .pricing-chip-large {
    min-width: 180px !important;
    max-width: 220px !important;
    font-size: 0.875rem !important;
  }

  .price-section {
    min-height: 80px;
  }

  .top-badge {
    top: -8px;
  }

  .top-badge .v-chip {
    font-size: 0.75rem !important;
  }

  .pricing-btn {
    font-size: 1rem !important;
    min-height: 52px !important;
    height: 52px !important;
  }

  .pricing-card .v-card-text {
    padding: 24px 16px !important;
  }

  .pricing-card .features-container {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    width: 100% !important;
    justify-content: center !important;
    text-align: center !important;
  }

  .pricing-card .features-container .d-flex {
    width: 200px !important;
    justify-content: flex-start !important;
    align-items: center !important;
    margin: 0 auto !important;
    position: relative !important;
    transform: translateX(15px) !important;
  }

  .pricing-card .v-card-text {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
  }

  .pricing-divider {
    max-width: 60% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    opacity: 0.2 !important;
  }
}

/* Extra small screens - wider cards */
@media (max-width: 400px) {
  .pricing-card-wrapper {
    max-width: 85% !important;
  }
}

@media (max-width: 960px) and (min-width: 601px) {
  .pricing-col {
    display: flex !important;
    justify-content: center !important;
  }
}

/* Ensure proper spacing and centering for all screen sizes */
.pricing-col {
  display: flex !important;
  justify-content: center !important;
}

/* 2-card layout optimization */
@media (min-width: 600px) and (max-width: 1199px) {
  .pricing-grid {
    column-gap: 40px !important;
    max-width: 840px !important;
    margin: 0 auto !important;
  }

  .pricing-col {
    flex: 0 0 calc(50% - 20px) !important;
    max-width: 400px !important;
    margin: 0 !important;
  }

  .pricing-card-wrapper {
    max-width: 100% !important;
    width: 100% !important;
  }
}

/* 4-card layout optimization for large screens */
@media (min-width: 1200px) {
  .pricing-col {
    flex: 1 1 24% !important;
    max-width: 260px !important;
    margin: 0 !important;
  }
}

/* Reset mobile styles on larger screens */
@media (min-width: 601px) {
  .pricing-card .features-container {
    display: block !important;
    text-align: left !important;
  }

  .pricing-card .features-container .d-flex {
    width: auto !important;
    margin: 0 !important;
    transform: none !important;
  }

  .pricing-card .v-card-text {
    display: block !important;
  }
}

/* FluxCloud-style plan states */
.pricing-card--current {
  border: 2px solid rgb(var(--v-theme-success)) !important;
  background: linear-gradient(145deg,
    color-mix(in srgb, rgb(var(--v-theme-success)) 3%, rgb(var(--v-theme-surface)) 97%) 0%,
    color-mix(in srgb, rgb(var(--v-theme-success)) 1%, rgb(var(--v-theme-surface)) 99%) 100%);
  box-shadow:
    0 15px 35px rgba(var(--v-theme-success), 0.15),
    0 8px 15px rgba(var(--v-theme-shadow), 0.08),
    inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.05);
}

.pricing-card--downgrade {
  opacity: 0.85;
  border: 1px solid rgba(var(--v-theme-warning), 0.3) !important;
  background: linear-gradient(145deg,
    color-mix(in srgb, rgb(var(--v-theme-surface)) 95%, rgb(var(--v-theme-outline)) 5%) 0%,
    color-mix(in srgb, rgb(var(--v-theme-surface)) 98%, rgb(var(--v-theme-outline)) 2%) 100%);
}

.pricing-card-wrapper:hover .pricing-card--current {
  box-shadow:
    0 25px 50px rgba(var(--v-theme-success), 0.25),
    0 15px 25px rgba(var(--v-theme-shadow), 0.12),
    inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.08);
}

.pricing-card-wrapper:has(.pricing-card--downgrade):hover {
  transform: translateY(-4px) scale(1.02);
}

.pricing-card--downgrade:hover {
  opacity: 1;
  border-color: rgba(var(--v-theme-warning), 0.5) !important;
}
</style>