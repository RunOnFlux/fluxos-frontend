<template>
  <div>
    <!-- Loading state -->
    <div v-if="!selectedPlan && loading" class="text-center py-8">
      <VProgressCircular
        indeterminate
        size="64"
        width="4"
        color="primary"
        class="mb-4"
      />
      <h3 class="text-h5 mb-2">{{ t('components.checkoutContent.loadingPlanDetails') }}</h3>
    </div>

    <!-- Error state -->
    <div v-else-if="!selectedPlan && !loading" class="text-center py-8">
      <VIcon
        icon="mdi-alert-circle"
        size="64"
        color="error"
        class="mb-4"
      />
      <h3 class="text-h5 mb-2">{{ t('components.checkoutContent.unableToLoadPlan') }}</h3>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ t('components.checkoutContent.tryAgainOrContactSupport') }}
      </p>
      <VBtn
        color="primary"
        @click="loadPlanDetails"
      >
        {{ t('components.checkoutContent.tryAgain') }}
      </VBtn>
    </div>

    <!-- Main checkout content -->
    <div v-else-if="selectedPlan" class="checkout-content">
      <VRow>
        <!-- Order Summary -->
        <VCol cols="12" md="4">
          <VCard variant="outlined" class="h-100">
            <VCardTitle>
              <VIcon
                :icon="props.actionType === 'renew' ? 'mdi-refresh' : props.actionType === 'upgrade' ? 'mdi-arrow-up-bold' : props.actionType === 'downgrade' ? 'mdi-arrow-down-bold' : 'mdi-receipt'"
                class="me-2"
              />
              {{ props.actionType === 'renew' ? t('components.checkoutContent.renewal') : props.actionType === 'upgrade' ? t('components.checkoutContent.upgrade') : props.actionType === 'downgrade' ? t('components.checkoutContent.downgrade') : t('components.checkoutContent.order') }} {{ t('components.checkoutContent.summary') }}
            </VCardTitle>
            <VCardText>
              <div class="plan-summary">
                <!-- Full Plan Comparison for Upgrades/Downgrades -->
                <div v-if="props.actionType === 'upgrade' || props.actionType === 'downgrade'" class="mb-3">
                  <div class="text-body-2 mb-3 text-center font-weight-medium">{{ t('components.checkoutContent.planComparison') }}</div>

                  <!-- Current Plan Card -->
                  <VCard variant="outlined" class="mb-2" style="border-color: rgb(var(--v-theme-info));">
                    <VCardText class="pa-3">
                      <div class="d-flex align-center mb-2">
                        <VIcon icon="mdi-account-check" size="16" class="me-2 text-info" />
                        <span class="text-body-2 font-weight-medium text-info">{{ t('components.checkoutContent.yourCurrentPlan') }}</span>
                      </div>
                      <div class="d-flex justify-space-between align-center mb-1">
                        <span class="text-body-1 font-weight-bold">{{ getDisplayPlanName(getCurrentPlanName()) }}</span>
                        <VChip color="info" variant="flat" size="small">
                          ${{ getCurrentPlanPrice() }}/mo
                        </VChip>
                      </div>
                      <div class="text-body-2 text-medium-emphasis">
                        <div>{{ getCurrentPlanStorage() }} {{ t('components.checkoutContent.storage') }}</div>
                      </div>
                    </VCardText>
                  </VCard>

                  <!-- Transition Arrow with Details -->
                  <div class="text-center mb-2">
                    <div class="d-flex align-center justify-center mb-1">
                      <VIcon icon="mdi-arrow-down" size="20" :class="props.actionType === 'downgrade' ? 'text-warning' : 'text-success'" class="me-1" />
                      <span class="text-body-2 font-weight-medium" :class="props.actionType === 'downgrade' ? 'text-warning' : 'text-success'">
                        {{ props.actionType === 'downgrade' ? t('components.checkoutContent.downgradeTo') : t('components.checkoutContent.upgradeTo') }}
                      </span>
                    </div>
                  </div>

                  <!-- New Plan Card -->
                  <VCard variant="outlined" class="mb-2" :style="`border-color: rgb(var(--v-theme-${props.actionType === 'downgrade' ? 'warning' : 'success'}));`">
                    <VCardText class="pa-3">
                      <div class="d-flex align-center mb-2">
                        <VIcon :icon="props.actionType === 'downgrade' ? 'mdi-arrow-down-bold' : 'mdi-star'" size="16" class="me-2" :class="props.actionType === 'downgrade' ? 'text-warning' : 'text-success'" />
                        <span class="text-body-2 font-weight-medium" :class="props.actionType === 'downgrade' ? 'text-warning' : 'text-success'">{{ t('components.checkoutContent.newPlan') }}</span>
                      </div>
                      <div class="d-flex justify-space-between align-center mb-1">
                        <span class="text-body-1 font-weight-bold">{{ getDisplayPlanName(getNewPlanName()) }}</span>
                        <VChip :color="props.actionType === 'downgrade' ? 'warning' : 'success'" variant="flat" size="small">
                          ${{ getPlanPrice() }}/mo
                        </VChip>
                      </div>
                      <div class="text-body-2 text-medium-emphasis">
                        <div>{{ getStorageDisplay() }} {{ t('components.checkoutContent.storage') }}</div>
                      </div>
                    </VCardText>
                  </VCard>

                  <!-- Price Comparison Summary -->
                  <VCard class="mt-3" variant="tonal" :color="props.actionType === 'downgrade' ? 'warning' : 'success'">
                    <VCardText class="pa-3">
                      <div class="d-flex justify-space-between align-center">
                        <span class="text-body-2">
                          {{ props.actionType === 'downgrade' ? t('components.checkoutContent.youWillSave') : t('components.checkoutContent.priceDifference') }}
                        </span>
                        <span class="text-body-1 font-weight-bold">
                          ${{ Math.abs(getPlanPrice() - getCurrentPlanPrice()).toFixed(2) }}/month
                        </span>
                      </div>
                    </VCardText>
                  </VCard>
                </div>

                <!-- Regular Plan Details for Renew/New/Downgrade -->
                <div v-else class="plan-details">
                  <div class="d-flex justify-space-between align-center mb-3">
                    <span>{{ t('components.checkoutContent.plan') }}:</span>
                    <VChip color="primary" variant="flat" size="small">
                      {{ getDisplayPlanName(selectedPlan.plan_name) }}
                    </VChip>
                  </div>
                  <div class="d-flex justify-space-between align-center mb-3">
                    <span>{{ t('components.checkoutContent.storage') }}:</span>
                    <VChip color="success" variant="tonal" size="small">
                      {{ getStorageDisplay() }}
                    </VChip>
                  </div>
                  <div class="d-flex justify-space-between align-center mb-3">
                    <span>{{ t('components.checkoutContent.duration') }}:</span>
                    <VChip color="info" variant="tonal" size="small">
                      {{ t('components.checkoutContent.oneMonth') }}
                    </VChip>
                  </div>
                </div>

                <VDivider class="my-3" />

                <!-- Action-specific messaging -->
                <div class="d-flex justify-center mb-3">
                  <VChip
                    v-if="props.actionType === 'renew'"
                    color="primary"
                    variant="flat"
                    size="small"
                    class="action-chip"
                  >
                    <VIcon icon="mdi-refresh" size="14" class="me-1" />
                    {{ t('components.checkoutContent.renewingYourCurrentPlan') }}
                  </VChip>
                  <VChip
                    v-else-if="props.actionType === 'upgrade'"
                    color="secondary"
                    variant="flat"
                    size="small"
                    class="action-chip"
                  >
                    <VIcon icon="mdi-arrow-up" size="14" class="me-1" />
                    {{ t('components.checkoutContent.upgradingToHigherPlan') }}
                  </VChip>
                  <VChip
                    v-else-if="props.actionType === 'downgrade'"
                    color="warning"
                    variant="flat"
                    size="small"
                    class="action-chip"
                  >
                    <VIcon icon="mdi-arrow-down" size="14" class="me-1" />
                    {{ t('components.checkoutContent.downgradingToLowerPlan') }}
                  </VChip>
                  <VChip
                    v-else-if="props.actionType === 'signup' || !props.actionType"
                    color="success"
                    variant="flat"
                    size="small"
                    class="action-chip"
                  >
                    <VIcon icon="mdi-plus" size="14" class="me-1" />
                    {{ t('components.checkoutContent.newSubscription') }}
                  </VChip>
                </div>

                <div class="d-flex justify-space-between">
                  <span class="text-h6">{{ t('components.checkoutContent.total') }}:</span>
                  <span class="text-h6 font-weight-bold">${{ getPlanPrice() }}</span>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Payment Methods -->
        <VCol cols="12" md="8">
          <VCard variant="outlined">
            <VCardTitle>
              <VIcon icon="mdi-credit-card" class="me-2" />
              {{ t('components.checkoutContent.paymentMethod') }}
            </VCardTitle>
            <VCardText>
              <!-- Payment Method Tabs -->
              <VTabs v-model="activePaymentMethod" color="primary" class="mb-4">
                <VTab value="fluxpay">
                  <VIcon icon="mdi-wallet" class="me-2" />
                  {{ t('components.checkoutContent.fluxPay') }}
                </VTab>
                <VTab value="cryptocom">
                  <VIcon icon="mdi-credit-card-multiple" class="me-2" />
                  {{ t('components.checkoutContent.cryptoCom') }}
                </VTab>
              </VTabs>

              <!-- Payment Method Content -->
              <VWindow v-model="activePaymentMethod">
                <!-- Flux Pay Panel -->
                <VWindowItem value="fluxpay">
                  <VCard variant="outlined">
                    <VCardText class="pa-6">
                      <div class="text-center">
                        <div class="payment-icon mb-4">
                          <div class="circular-icon">
                            <VImg
                              src="/img/ZelCore_symbol_blue_white.svg"
                              max-width="100"
                              class="mx-auto"
                            />
                          </div>
                        </div>

                        <!-- Payment Details -->
                        <div class="mb-6">
                          <!-- USD Price and FLUX Amount in one line with chip style -->
                          <div class="d-flex justify-center align-center gap-3 mb-3">
                            <VChip color="success" variant="flat" size="default">
                              ${{ getPlanPrice() }} USD
                            </VChip>
                            <VChip v-if="fluxPayment && fluxPayment.amount" color="primary" variant="flat" size="default">
                              {{ parseFloat(fluxPayment.amount).toFixed(2) }} FLUX *
                            </VChip>
                            <VChip v-else-if="estimatedFluxAmount" color="primary" variant="flat" size="default">
                              {{ parseFloat(estimatedFluxAmount).toFixed(2) }} FLUX *
                            </VChip>
                            <VChip v-else color="info" variant="tonal" size="default">
                              {{ t('components.checkoutContent.calculatingFlux') }}
                            </VChip>
                          </div>

                          <!-- Subscription Dates for Renewals/Upgrades/Downgrades -->
                          <div v-if="props.actionType === 'renew' || props.actionType === 'upgrade' || props.actionType === 'downgrade'" class="subscription-dates mb-3">
                            <VCard elevation="12" class="pa-3" :style="`box-shadow: 0 12px 24px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1); border: 1px solid rgba(var(--v-theme-${props.actionType === 'downgrade' ? 'warning' : 'success'}), 0.3); background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.05));`">
                              <div class="d-flex align-center justify-space-between">
                                <!-- Current Subscription -->
                                <div class="flex-grow-1 text-center">
                                  <div class="d-flex justify-center mb-1" style="align-items: center; height: 1.2em;">
                                    <VIcon icon="mdi-calendar-clock" size="16" class="text-info" style="display: flex; align-items: center; margin-right: 6px;" />
                                    <span class="text-caption font-weight-medium text-info" style="display: flex; align-items: center;">{{ t('components.checkoutContent.currentEnds') }}:</span>
                                  </div>
                                  <div class="text-body-2 font-weight-medium">{{ formatEndDate(getCurrentSubscriptionEndDate()) }}</div>
                                </div>

                                <!-- Arrow Separator -->
                                <div class="px-3">
                                  <VIcon icon="mdi-arrow-right" size="16" class="text-medium-emphasis" />
                                </div>

                                <!-- New Subscription -->
                                <div class="flex-grow-1 text-center">
                                  <div class="d-flex justify-center mb-1" style="align-items: center; height: 1.2em;">
                                    <VIcon icon="mdi-calendar-plus" size="16" :class="props.actionType === 'downgrade' ? 'text-warning' : 'text-success'" style="display: flex; align-items: center; margin-right: 6px;" />
                                    <span class="text-caption font-weight-medium" :class="props.actionType === 'downgrade' ? 'text-warning' : 'text-success'" style="display: flex; align-items: center;">
                                      {{ props.actionType === 'renew' ? t('components.checkoutContent.renewal') : props.actionType === 'upgrade' ? t('components.checkoutContent.upgrade') : t('components.checkoutContent.downgrade') }} {{ t('components.checkoutContent.ends') }}:
                                    </span>
                                  </div>
                                  <div class="text-body-2 font-weight-medium">{{ formatEndDate(getEndDate()) }}</div>
                                </div>
                              </div>
                            </VCard>
                          </div>

                          <!-- Manual Payment Details - Always visible, collapsed by default -->
                          <div class="mb-3">
                            <VExpansionPanels variant="accordion">
                              <VExpansionPanel>
                                <VExpansionPanelTitle class="py-2 px-3">
                                  <div class="d-flex align-center text-caption">
                                    <VIcon size="18" class="me-2">mdi-wallet-outline</VIcon>
                                    <span>{{ t('components.checkoutContent.manualPaymentDetails') }}</span>
                                  </div>
                                </VExpansionPanelTitle>
                                <VExpansionPanelText class="pt-2">
                                  <template v-if="fluxPayment && fluxPayment.paymentAddr">
                                    <!-- Address -->
                                    <div class="d-flex align-center justify-space-between mb-1 px-2 py-1" style="background: rgba(var(--v-theme-on-surface), 0.05); border-radius: 4px;">
                                      <div style="flex: 1; min-width: 0; overflow: hidden;">
                                        <div class="text-caption" style="font-size: 0.65rem; opacity: 0.7;">{{ t('components.checkoutContent.address') }}</div>
                                        <code class="text-caption" style="font-size: 0.7rem; word-break: break-all;">{{ fluxPayment.paymentAddr }}</code>
                                      </div>
                                      <VBtn
                                        size="x-small"
                                        variant="text"
                                        color="secondary"
                                        icon="mdi-content-copy"
                                        class="copy-btn"
                                        :data-clipboard-text="fluxPayment.paymentAddr"
                                        style="flex-shrink: 0; margin-left: 4px;"
                                      />
                                    </div>

                                    <!-- Amount & Message in one row -->
                                    <div class="d-flex gap-1">
                                      <!-- Amount -->
                                      <div class="d-flex align-center justify-space-between mb-1 px-2 py-1" style="background: rgba(var(--v-theme-on-surface), 0.05); border-radius: 4px; flex: 1;">
                                        <div>
                                          <div class="text-caption" style="font-size: 0.65rem; opacity: 0.7;">{{ t('components.checkoutContent.amount') }}</div>
                                          <code class="text-caption" style="font-size: 0.7rem;">{{ fluxPayment.amount }} FLUX</code>
                                        </div>
                                        <VBtn
                                          size="x-small"
                                          variant="text"
                                          color="secondary"
                                          icon="mdi-content-copy"
                                          class="copy-btn"
                                          :data-clipboard-text="fluxPayment.amount"
                                          style="margin-left: 4px;"
                                        />
                                      </div>

                                      <!-- Message -->
                                      <div class="d-flex align-center justify-space-between mb-1 px-2 py-1" style="background: rgba(var(--v-theme-on-surface), 0.05); border-radius: 4px; flex: 1;">
                                        <div style="flex: 1; min-width: 0; overflow: hidden;">
                                          <div class="text-caption" style="font-size: 0.65rem; opacity: 0.7;">{{ t('components.checkoutContent.message') }}</div>
                                          <code class="text-caption" style="font-size: 0.7rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">FLUXDRIVE{{ fluxPayment.subId }}</code>
                                        </div>
                                        <VBtn
                                          size="x-small"
                                          variant="text"
                                          color="secondary"
                                          icon="mdi-content-copy"
                                          class="copy-btn"
                                          :data-clipboard-text="'FLUXDRIVE' + fluxPayment.subId"
                                          style="flex-shrink: 0; margin-left: 4px;"
                                        />
                                      </div>
                                    </div>
                                  </template>
                                  <template v-else>
                                    <!-- Loading state -->
                                    <div class="text-center text-caption text-medium-emphasis py-2">
                                      <VProgressCircular
                                        v-if="loading"
                                        indeterminate
                                        size="20"
                                        width="2"
                                        color="primary"
                                        class="me-2"
                                      />
                                      {{ loading ? t('components.checkoutContent.loadingPaymentDetails') : t('components.checkoutContent.paymentDetailsWillAppear') }}
                                    </div>
                                  </template>
                                </VExpansionPanelText>
                              </VExpansionPanel>
                            </VExpansionPanels>
                          </div>


                        </div>

                        <!-- Payment Monitoring Spinner -->
                        <div v-if="fluxPaymentProcessing" class="mb-4">
                          <VCard variant="tonal" color="info" class="pa-4">
                            <div class="d-flex flex-column align-center">
                              <VProgressCircular
                                indeterminate
                                size="48"
                                width="4"
                                color="info"
                                class="mb-3"
                              />
                              <div class="text-h6 mb-2 text-center">{{ t('components.checkoutContent.monitoringPayment') }}</div>
                              <div class="text-body-2 text-center text-medium-emphasis mb-3">
                                {{ t('components.checkoutContent.waitingForPaymentConfirmation') }}
                              </div>
                              <div class="d-flex align-center text-caption text-medium-emphasis">
                                <VIcon color="warning" size="16" class="me-2">mdi-clock-alert</VIcon>
                                <span>{{ t('components.checkoutContent.canTakeUpTo20Minutes') }}</span>
                              </div>
                            </div>
                          </VCard>
                        </div>

                        <!-- Payment Actions -->
                        <div v-if="!fluxPaymentProcessing">
                          <!-- Wallet Icons Grid -->
                          <div class="wallet-icons-grid mb-4">
                            <VCard
                              variant="outlined"
                              class="wallet-icon-card"
                              @click="initZelcorePay"
                              hover
                            >
                              <VCardText class="d-flex align-center justify-center pa-6">
                                <img
                                  class="wallet-brand-icon mr-3"
                                  :src="FluxIDImg"
                                  :alt="t('components.checkoutContent.zelcore')"
                                />
                                <span class="text-h6 font-weight-medium">{{ t('components.checkoutContent.zelcore') }}</span>
                              </VCardText>
                            </VCard>

                            <VCard
                              variant="outlined"
                              class="wallet-icon-card"
                              @click="initSSPPay"
                              hover
                            >
                              <VCardText class="d-flex align-center justify-center pa-6">
                                <img
                                  class="wallet-brand-icon mr-3"
                                  :src="SSPLogoThemeImg"
                                  :alt="t('components.checkoutContent.ssp')"
                                />
                                <span class="text-h6 font-weight-medium">{{ t('components.checkoutContent.ssp') }}</span>
                              </VCardText>
                            </VCard>
                          </div>
                        </div>

                        <!-- Cancel Monitoring Button -->
                        <div v-if="fluxPaymentProcessing">
                          <VBtn
                            variant="outlined"
                            color="error"
                            size="default"
                            block
                            @click="cancelFluxPayment"
                          >
                            <VIcon icon="mdi-close-circle" class="me-2" />
                            {{ t('components.checkoutContent.cancelMonitoring') }}
                          </VBtn>
                        </div>

                        <!-- Subscription Note -->
                        <div class="text-caption text-medium-emphasis mt-4 text-center">
                          {{ t('components.checkoutContent.fluxPriceEstimated') }}
                        </div>
                      </div>
                    </VCardText>
                  </VCard>
                </VWindowItem>

                <!-- Crypto.com Panel -->
                <VWindowItem value="cryptocom">
                  <VCard variant="outlined">
                    <VCardText class="pa-6">
                      <div class="text-center">
                        <div class="payment-icon mb-4">
                          <div class="circular-icon">
                            <VImg
                              src="/img/cdc_logo.png"
                              max-width="100"
                              class="mx-auto"
                            />
                          </div>
                        </div>

                        <!-- Payment Details -->
                        <div class="mb-4">
                          <div class="text-h6 mb-2">
                            ${{ getPlanPrice() }} USD / Month
                          </div>
                          <div class="text-body-2 text-medium-emphasis mb-2">
                            {{ t('components.checkoutContent.nextAutomaticSubscription') }}:<br />{{ formatEndDate(getEndDate()) }}
                          </div>
                        </div>

                        <div class="d-flex flex-column gap-3">
                          <VBtn
                            v-if="!cryptoPaymentProcessing"
                            color="primary"
                            size="default"
                            block
                            :loading="initializingCryptoPayment"
                            @click="initializeCryptoComPayment"
                          >
                            <VIcon icon="mdi-credit-card" class="me-2" />
                            {{ t('components.checkoutContent.generateSubscription') }}
                          </VBtn>

                          <VBtn
                            v-if="cryptoPaymentProcessing"
                            variant="outlined"
                            color="warning"
                            size="default"
                            block
                          >
                            <VIcon icon="mdi-clock-outline" class="me-2" />
                            {{ t('components.checkoutContent.pendingPayment') }}
                          </VBtn>

                          <VBtn
                            v-if="cryptoPaymentProcessing"
                            variant="outlined"
                            color="error"
                            size="default"
                            block
                            @click="cancelCryptoPayment"
                          >
                            {{ t('components.checkoutContent.cancel') }}
                          </VBtn>

                        </div>

                        <!-- Subscription Note -->
                        <div class="text-caption text-medium-emphasis mt-4">
                          {{ t('components.checkoutContent.subscriptionsChargedMonthly') }}
                        </div>
                      </div>
                    </VCardText>
                  </VCard>
                </VWindowItem>
              </VWindow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Alert Messages -->
      <VAlert
        v-if="alertMessage"
        :type="alertType"
        class="mt-4"
        v-html="alertMessage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useFluxStore } from '@/stores/flux'
import { useSnackbar } from '@/composables/useSnackbar'
import ClipboardJS from 'clipboard'
import qs from 'qs'
import { payWithSSP, payWithZelcore } from '@/utils/walletService'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'

// Helper function to sanitize auth data for logging
const sanitizeAuthData = (data) => {
  if (!data || typeof data !== 'object') return data

  const sanitized = { ...data }

  // Hide sensitive fields
  if (sanitized.zelid) {
    sanitized.zelid = sanitized.zelid.substring(0, 8) + '...'
  }
  if (sanitized.signature) {
    sanitized.signature = '***hidden***'
  }
  if (sanitized.loginPhrase) {
    sanitized.loginPhrase = '***hidden***'
  }

  return sanitized
}

// Import payment images
import FluxIDImg from '@images/FluxID.svg?url'
import SSPLogoBlackImg from '@images/ssp-logo-black.svg?url'
import SSPLogoWhiteImg from '@images/ssp-logo-white.svg?url'

// Props
const props = defineProps({
  planId: {
    type: String,
    required: true,
  },
  actionType: {
    type: String,
    default: 'signup',
  },
  gateway: {
    type: String,
    default: 'fluxpay',
  },
})

// Emits
const emit = defineEmits(['close', 'success'])

// Expose cleanup method for parent component
const cleanupPaymentMonitoring = () => {
  console.log('🧹 Cleaning up payment monitoring from parent')
  if (paymentMonitoringInterval) {
    clearInterval(paymentMonitoringInterval)
    paymentMonitoringInterval = null
  }
  if (paymentMonitoringTimeout) {
    clearTimeout(paymentMonitoringTimeout)
    paymentMonitoringTimeout = null
  }
  fluxPaymentProcessing.value = false
  cryptoPaymentProcessing.value = false

  // Clear payment data so new sub_id is generated on re-open
  fluxPayment.value = null
  console.log('🧹 Cleared payment data - new sub_id will be generated on re-open')

  // Hide any active payment-related snackbars
  hideSnackbar()
  console.log('🧹 Cleared payment-related snackbar notifications')
}

// Expose the cleanup method
defineExpose({
  cleanupPaymentMonitoring,
})

// Composables
const fluxStore = useFluxStore()
const { showSnackbar, hideSnackbar } = useSnackbar()
const theme = useTheme()
const { t } = useI18n()

// Theme-aware SSP logo
const SSPLogoThemeImg = computed(() => {
  return theme.global.name.value === 'dark' ? SSPLogoWhiteImg : SSPLogoBlackImg
})

// State
const loading = ref(true)
const selectedPlan = ref(null)
const activePaymentMethod = ref(props.gateway)

// Separate loading states for each payment method
const initializingFluxPayment = ref(false)
const initializingCryptoPayment = ref(false)
const fluxPaymentProcessing = ref(false)
const cryptoPaymentProcessing = ref(false)

const fluxPayment = ref(null)
const subscriptionData = ref(null) // Store full subscription data from API
const currentSubscriptionData = ref(null) // Store current subscription data for upgrades
const alertMessage = ref('')
const alertType = ref('info')
const estimatedFluxAmount = ref(null)

// Track active monitoring interval for cleanup
let paymentMonitoringInterval = null
let paymentMonitoringTimeout = null

// Computed
const isLoggedIn = computed(() => {
  const zelidauth = localStorage.getItem('zelidauth')
  if (!zelidauth) return false

  try {
    const auth = qs.parse(zelidauth)
    
    return !!(auth.zelid && (auth.signature || auth.zelidauth))
  } catch {
    return false
  }
})

// Methods
const showAlert = (message, type = 'error') => {
  alertMessage.value = message
  alertType.value = type

  // Auto-clear alert after 8 seconds
  setTimeout(() => {
    alertMessage.value = ''
    alertType.value = 'info'
  }, 8000)
}

const getFluxPriceForPlan = async () => {
  try {
    // Get current FLUX price from explorer API
    const response = await fetch('https://explorer.runonflux.io/api/currency')
    const currencyData = await response.json()

    console.log('FLUX currency data:', currencyData)

    if (currencyData && currencyData.status === 200 && currencyData.data && currencyData.data.rate) {
      const fluxPriceUSD = parseFloat(currencyData.data.rate)
      const planPriceUSD = parseFloat(getPlanPrice())

      console.log(`FLUX price from API: $${fluxPriceUSD} USD`)
      console.log(`Plan price: $${planPriceUSD} USD`)

      if (fluxPriceUSD > 0 && planPriceUSD > 0) {
        const fluxAmount = planPriceUSD / fluxPriceUSD
        console.log(`FLUX calculation: $${planPriceUSD} USD / $${fluxPriceUSD} per FLUX = ${fluxAmount.toFixed(2)} FLUX`)
        
        return fluxAmount.toFixed(2)
      } else {
        console.error('Invalid price values:', { fluxPriceUSD, planPriceUSD })
        
        return null
      }
    } else {
      console.error('Invalid FLUX price data structure from explorer:', currencyData)
      
      return null
    }
  } catch (error) {
    console.error('Error getting FLUX price from explorer:', error)
    
    return null
  }
}


const loadCurrentSubscription = async () => {
  if (props.actionType !== 'upgrade' && props.actionType !== 'downgrade') {
    return // Only needed for upgrades and downgrades
  }

  try {
    console.log('🔍 Loading current subscription for', props.actionType, 'comparison')

    const auth = getAuthFromStorage()
    if (!auth.zelid) {
      console.error('No ZelID available for subscription lookup')
      
      return
    }

    const payload = {
      action: 'READ',
      action_type: 'current', // Read current subscription
      zelid: auth.zelid,
      signature: auth.signature,
      loginPhrase: auth.loginPhrase,
    }

    console.log('📋 Fetching current subscription:', sanitizeAuthData(payload))

    const response = await fetch('https://jetpackbridge.runonflux.io/api/v1/subscriptions.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(payload),
    })

    const result = await response.json()
    console.log('📋 Current subscription response:', result)

    // Store current subscription data separately
    if (result && !result.error) {
      currentSubscriptionData.value = result
      console.log('✅ Current subscription data loaded:', result)

      // Capture payment gateway from current subscription
      if (result.gateway) {
        console.log('💳 Current subscription gateway:', result.gateway)
        // Also store in localStorage for consistency
        localStorage.setItem('fluxdrive_gateway', result.gateway)
      }
    } else {
      console.log('⚠️ Could not load current subscription:', result.error || 'Unknown error')
    }
  } catch (error) {
    console.error('❌ Error loading current subscription:', error)
  }
}

const loadPlanDetails = async () => {
  try {
    loading.value = true
    alertMessage.value = ''

    // For upgrades and downgrades, load current subscription data first
    console.log('📋 About to check if we need to load current subscription')
    console.log('📋 Action type:', props.actionType)
    console.log('📋 Should load?', props.actionType === 'upgrade' || props.actionType === 'downgrade')

    await loadCurrentSubscription()

    console.log('Loading plan details for planId:', props.planId)
    console.log('Gateway:', props.gateway)
    console.log('Action type:', props.actionType)

    // Check authentication
    if (!isLoggedIn.value) {
      showAlert(t('components.checkoutContent.pleaseLoginToContinue'))
      emit('close')

      return
    }

    // Log auth details for debugging
    const authCheck = getAuthFromStorage()
    console.log('Auth check:', {
      zelid: authCheck.zelid ? authCheck.zelid.substring(0, 8) + '...' : 'none',
      hasSignature: !!authCheck.signature,
      hasLoginPhrase: !!authCheck.loginPhrase,
    })

    // For FluxDrive plans, we still need to call the API to get price_id
    // But we can use predefined display data
    const fluxDriveDisplayData = {
      'starter': {
        plan_name: 'starter',
        price: 0.50,
        storage: 10737418240, // 10GB in bytes
        storage_gb: 10,
        period: 'month',
        cycle: 'monthly',
      },
      'standard': {
        plan_name: 'standard',
        price: 2.50,
        storage: 53687091200, // 50GB in bytes
        storage_gb: 50,
        period: 'month',
        cycle: 'monthly',
      },
      'pro': {
        plan_name: 'pro',
        price: 5.00,
        storage: 107374182400, // 100GB in bytes
        storage_gb: 100,
        period: 'month',
        cycle: 'monthly',
      },
    }

    const auth = getAuthFromStorage()
    if (!auth.zelid || !auth.signature || !auth.loginPhrase) {
      showAlert(t('components.checkoutContent.invalidAuthenticationData'))
      emit('close')

      return
    }

    // For FluxDrive plans, use display data but still call API for price_id
    if (fluxDriveDisplayData[props.planId]) {
      selectedPlan.value = fluxDriveDisplayData[props.planId]

      // Calculate estimated FLUX amount for FluxDrive plans
      estimatedFluxAmount.value = await getFluxPriceForPlan()
      console.log('Estimated FLUX amount:', estimatedFluxAmount.value)

      // NOTE: Don't pre-initialize payment here - we need price_id from API first
    }

    // Always call API to get price_id (required for payments)
    let apiPayload = {
      action: 'READ',
      plan_name: props.planId,
      action_type: props.actionType,  // Include action type for proper handling
      gateway: props.gateway,
      zelid: auth.zelid || fluxStore.zelid,
      signature: auth.signature,
      loginPhrase: auth.loginPhrase,
    }

    console.log('Reading subscription details from API')
    console.log('API payload being sent (READ):', sanitizeAuthData(apiPayload))

    let response = await fetch('https://jetpackbridge.runonflux.io/api/v1/subscriptions.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(apiPayload),
    })

    let result = await response.json()
    console.log('📋 Subscription API response (CREATE):', result)
    console.log('📋 CREATE result.new_plan:', result.new_plan)
    console.log('📋 CREATE result.plan:', result.plan)
    console.log('📋 CREATE full response keys:', Object.keys(result))
    console.log('📋 CREATE result has sub_id?:', !!(result.new_plan?.sub_id || result.plan?.sub_id))

    // Store full subscription data for renewal date display
    subscriptionData.value = result

    // If CREATE still doesn't work, check if sub_id is elsewhere in response
    if (result.sub_id) {
      console.log('📋 Found sub_id in root response:', result.sub_id)
    }

    if (result.error) {
      console.error('API Error:', result.error)
      showAlert(result.error)
      
      return
    }

    if (result.new_plan || result.plan) {
      const apiPlan = result.new_plan || result.plan

      // Merge API data (including price_id) with our display data
      if (fluxDriveDisplayData[props.planId]) {
        selectedPlan.value = {
          ...fluxDriveDisplayData[props.planId],
          price_id: apiPlan.price_id,  // Get price_id from API
          sub_id: apiPlan.sub_id,       // Get sub_id if available
        }
        console.log('Merged FluxDrive plan with API price_id:', selectedPlan.value.price_id)

        // Wait for FLUX amount to be calculated before pre-initializing payment
        if (!estimatedFluxAmount.value) {
          console.log('⏳ Waiting for FLUX amount calculation...')

          // Wait a moment for the FLUX price calculation to complete
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // NOW pre-initialize payment data for manual section (after we have price_id AND FLUX amount)
        if (estimatedFluxAmount.value) {
          await preInitializeManualPaymentData()
        } else {
          console.log('⚠️ FLUX amount still not available, skipping pre-initialization')
        }
      } else {
        selectedPlan.value = apiPlan

        // Load estimated FLUX amount for non-FluxDrive plans (already loaded for FluxDrive)
        if (!estimatedFluxAmount.value) {
          estimatedFluxAmount.value = await getFluxPriceForPlan()
        }
      }

      console.log('=== SUBSCRIPTION API RESPONSE ===')
      console.log('Selected plan data:', selectedPlan.value)
      console.log('Price_id from API:', selectedPlan.value.price_id)
    } else {
      showAlert(t('components.checkoutContent.planNotFoundOrInvalidResponse'))
    }
  } catch (error) {
    console.error('Error loading plan:', error)
    showAlert(t('components.checkoutContent.failedToLoadPlanDetails'))
  } finally {
    loading.value = false
  }
}

const getAuthFromStorage = () => {
  const zelidauth = localStorage.getItem('zelidauth')
  if (!zelidauth) {
    return { zelid: null, signature: null, loginPhrase: null }
  }

  try {
    // Parse URL-encoded format: zelid=...&signature=...&loginPhrase=...
    const auth = qs.parse(zelidauth)

    // Extract zelid - it should be in the zelidauth object
    const zelid = auth.zelid || fluxStore.zelid

    return {
      zelid: zelid,
      signature: auth.signature || auth.zelidauth || zelidauth,  // Use full zelidauth as signature if needed
      loginPhrase: auth.loginPhrase,
    }
  } catch (error) {
    console.error('Failed to parse zelidauth:', error)
    
    return { zelid: null, signature: null, loginPhrase: null }
  }
}

const preInitializeManualPaymentData = async () => {
  // Pre-initialize payment data without opening wallet - just for displaying manual payment info
  try {
    const auth = getAuthFromStorage()
    if (!auth.zelid || !auth.signature) {
      console.log('⚠️ Cannot pre-initialize payment data - missing auth')
      console.log('Auth check:', { hasZelid: !!auth.zelid, hasSignature: !!auth.signature, hasLoginPhrase: !!auth.loginPhrase })
      
      return
    }

    if (!estimatedFluxAmount.value) {
      console.log('⚠️ Cannot pre-initialize payment data - missing FLUX amount')
      
      return
    }

    // Build payment payload
    const paymentPayload = {
      action: 'INITIALIZE',
      plan_name: props.planId,
      action_type: props.actionType,
      zelid: auth.zelid || fluxStore.zelid,
      signature: auth.signature,
      loginPhrase: auth.loginPhrase,
    }

    console.log('🔄 Pre-initialization payload check:', {
      hasZelid: !!paymentPayload.zelid,
      hasSignature: !!paymentPayload.signature,
      hasLoginPhrase: !!paymentPayload.loginPhrase,
      planName: paymentPayload.plan_name,
      actionType: paymentPayload.action_type,
    })

    // Generate sub_id
    const generateSubId = (length, lowerOnly) => {
      const characters = lowerOnly
        ? "abcdefghijklmnopqrstuvwxyz0123456789"
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
      let result = ""
      for (let i = 0; i < length; i++) {
        result += characters[Math.floor(Math.random() * characters.length)]
      }
      
      return result
    }

    paymentPayload.sub_id = generateSubId(24, true)

    // Add price_id from subscription
    if (selectedPlan.value?.price_id) {
      paymentPayload.price_id = selectedPlan.value.price_id
    }

    // Calculate total_flux
    if (estimatedFluxAmount.value) {
      paymentPayload.total_flux = parseFloat(estimatedFluxAmount.value)
    }

    // Add payment address
    paymentPayload.payment_addr = 't3NryfAQLGeFs9jEoeqsxmBN2QLRaRKFLUX'

    console.log('🔄 Pre-initializing payment data for manual section:', sanitizeAuthData(paymentPayload))

    const response = await fetch('https://jetpackbridge.runonflux.io/api/v1/fluxpay.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(paymentPayload),
    })

    console.log('📡 Response status:', response.status, response.statusText)

    const result = await response.json()
    console.log('📡 API response:', result)

    if (result.success) {
      console.log('✅ Payment data pre-initialized successfully!')

      // Store payment details for manual section display
      fluxPayment.value = {
        amount: estimatedFluxAmount.value,
        usdValue: getPlanPrice(),
        subId: result.sub_id,
        endDate: result.enddate,
        paymentAddr: paymentPayload.payment_addr,
      }

      console.log('✅ Manual payment section now has data:', fluxPayment.value)
    } else {
      console.log('⚠️ Failed to pre-initialize payment data:', result.error || result)
    }
  } catch (error) {
    console.error('❌ Error pre-initializing payment data:', error)
  }
}

const initZelcorePay = async () => {
  // Initialize Flux payment with Zelcore wallet
  await initializeFluxPayment('zelcore')
}

const initSSPPay = async () => {
  // Initialize Flux payment with SSP wallet
  await initializeFluxPayment('ssp')
}

const initializeFluxPayment = async (walletType = 'zelcore') => {
  try {
    initializingFluxPayment.value = true
    alertMessage.value = ''

    // If we already have payment data from pre-initialization, reuse it
    if (fluxPayment.value && fluxPayment.value.subId) {
      console.log('✅ Reusing existing payment data from pre-initialization')
      console.log('   - sub_id:', fluxPayment.value.subId)
      console.log('   - amount:', fluxPayment.value.amount)
      console.log('   - address:', fluxPayment.value.paymentAddr)

      // Open wallet directly with existing data
      const amount = parseFloat(fluxPayment.value.amount).toFixed(2)
      const message = `FLUXDRIVE${fluxPayment.value.subId}`

      if (walletType === 'ssp') {
        // Use SSP wallet
        console.log('Opening SSP wallet for payment')
        try {
          await payWithSSP({
            message: message,
            amount: amount,
            address: fluxPayment.value.paymentAddr,
            chain: 'flux',
          })

          // Set payment processing state and start monitoring
          fluxPaymentProcessing.value = true
          showSnackbar(t('components.checkoutContent.sspPaymentInitiated'), 'info', 8000)

          // Start monitoring payment status
          monitorPayment(null, fluxPayment.value.subId, fluxPayment.value.paymentAddr, 'flux')
        } catch (error) {
          console.error('SSP payment error:', error)
          showAlert(t('components.checkoutContent.sspPaymentFailed', { error: error.message }))
        }
      } else {
        // Use Zelcore wallet
        console.log('Opening Zelcore wallet for payment')
        try {
          await payWithZelcore({
            address: fluxPayment.value.paymentAddr,
            amount: amount,
            message: message,
            coin: 'flux',
          })

          // Set payment processing state and start monitoring
          fluxPaymentProcessing.value = true
          showSnackbar(t('components.checkoutContent.openingZelcoreWallet'), 'info', 8000)

          // Start monitoring payment status
          monitorPayment(null, fluxPayment.value.subId, fluxPayment.value.paymentAddr, 'flux')
        } catch (error) {
          console.error('Zelcore payment error:', error)
          showAlert(t('components.checkoutContent.zelcorePaymentFailed', { error: error.message }))
        }
      }

      initializingFluxPayment.value = false
      
      return
    }

    // No pre-initialized data, initialize new payment
    console.log('⚠️ No pre-initialized payment data, creating new payment...')

    const auth = getAuthFromStorage()
    if (!auth.zelid || !auth.signature || !auth.loginPhrase) {
      showAlert(t('components.checkoutContent.authenticationRequired'))

      return
    }

    // The FLUX amount will be calculated and returned by the FluxPay API

    // Build payment payload - include sub_id if we have it from subscription
    const paymentPayload = {
      action: 'INITIALIZE',
      plan_name: props.planId,
      action_type: props.actionType,  // Include action type for proper handling
      zelid: auth.zelid || fluxStore.zelid,  // Use auth.zelid first
      signature: auth.signature,
      loginPhrase: auth.loginPhrase,
    }

    // Generate sub_id exactly like FluxCloud does (makeID function)
    const generateSubId = (length, lowerOnly) => {
      const characters = lowerOnly
        ? "abcdefghijklmnopqrstuvwxyz0123456789"
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
      let result = ""
      for (let i = 0; i < length; i++) {
        result += characters[Math.floor(Math.random() * characters.length)]
      }

      return result
    }

    // Generate 24-character lowercase sub_id like FluxCloud
    paymentPayload.sub_id = generateSubId(24, true)
    console.log('✅ Generated sub_id like FluxCloud:', paymentPayload.sub_id)

    // Add price_id from subscription
    if (selectedPlan.value?.price_id) {
      paymentPayload.price_id = selectedPlan.value.price_id
      console.log('✅ Including price_id:', selectedPlan.value.price_id)
    }

    // Calculate total_flux like FluxCloud: (planPrice / 100) / fluxPriceUSD
    if (estimatedFluxAmount.value) {
      paymentPayload.total_flux = parseFloat(estimatedFluxAmount.value)
      console.log('✅ Including total_flux:', paymentPayload.total_flux)
    }

    // Add payment address (FluxDrive uses a fixed address)
    paymentPayload.payment_addr = 't3NryfAQLGeFs9jEoeqsxmBN2QLRaRKFLUX'
    console.log('✅ Including payment_addr:', paymentPayload.payment_addr)

    console.log('=== PAYMENT PAYLOAD WITH SUB_ID ===')
    console.log('Final payload:', sanitizeAuthData(paymentPayload))

    console.log('=== FLUXPAY PAYMENT INITIALIZATION ===')
    console.log('Plan ID:', props.planId)
    console.log('Selected plan data:', selectedPlan.value)
    console.log('Payment payload:', sanitizeAuthData(paymentPayload))

    // Log the exact URL-encoded body being sent
    const bodyParams = new URLSearchParams(paymentPayload)
    console.log('URL-encoded body:', bodyParams.toString())

    const response = await fetch('https://jetpackbridge.runonflux.io/api/v1/fluxpay.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams,
    })

    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    console.log('Response headers:', [...response.headers.entries()])

    const result = await response.json()
    console.log('FluxPay initialization result:', result)
    console.log('Result keys:', Object.keys(result))
    console.log('Result.error:', result.error)
    console.log('Result.success:', result.success)

    if (result.success) {
      console.log('✅ Payment initialized successfully!')
      console.log('Response format:', result)

      // Store payment details for monitoring
      fluxPayment.value = {
        amount: estimatedFluxAmount.value,
        usdValue: getPlanPrice(),
        subId: result.sub_id,
        endDate: result.enddate,
        paymentAddr: paymentPayload.payment_addr,
      }

      // Open wallet based on type (Zelcore or SSP)
      const amount = parseFloat(estimatedFluxAmount.value).toFixed(2)
      const message = `FLUXDRIVE${result.sub_id}`

      if (walletType === 'ssp') {
        // Use SSP wallet
        console.log('Opening SSP wallet for payment')
        try {
          await payWithSSP({
            message: message,
            amount: amount,
            address: paymentPayload.payment_addr,
            chain: 'flux',
          })

          // Set payment processing state and start monitoring
          fluxPaymentProcessing.value = true
          showSnackbar(t('components.checkoutContent.sspPaymentInitiated'), 'info', 8000)

          // Start monitoring payment status
          monitorPayment(null, result.sub_id, paymentPayload.payment_addr, 'flux')
        } catch (error) {
          console.error('SSP payment error:', error)
          showAlert(t('components.checkoutContent.sspPaymentFailed', { error: error.message }))
        }
      } else {
        // Use Zelcore wallet
        console.log('Opening Zelcore wallet for payment')
        try {
          await payWithZelcore({
            address: paymentPayload.payment_addr,
            amount: amount,
            message: message,
            coin: 'flux',
          })

          // Set payment processing state and start monitoring
          fluxPaymentProcessing.value = true
          showSnackbar(t('components.checkoutContent.openingZelcoreWallet'), 'info', 8000)

          // Start monitoring payment status
          monitorPayment(null, result.sub_id, paymentPayload.payment_addr, 'flux')
        } catch (error) {
          console.error('Zelcore payment error:', error)
          showAlert(t('components.checkoutContent.zelcorePaymentFailed', { error: error.message }))
        }
      }
    } else {
      showAlert(result.error || t('components.checkoutContent.failedToInitializePayment'))
    }
  } catch (error) {
    console.error('Error initializing payment:', error)
    showAlert(t('components.checkoutContent.failedToInitializePaymentTryAgain'))
  } finally {
    initializingFluxPayment.value = false
  }
}

const initializeCryptoComPayment = async () => {
  try {
    initializingCryptoPayment.value = true
    alertMessage.value = ''

    const auth = getAuthFromStorage()
    if (!auth.zelid || !auth.signature || !auth.loginPhrase) {
      showAlert(t('components.checkoutContent.authenticationRequired'))

      return
    }

    // Build payment payload exactly like original FluxCloud (lines 517-522 in checkout page)
    const paymentPayload = {
      action: 'INITIALIZE',
      plan_name: props.planId,
      action_type: props.actionType,  // Include action type for proper handling
      zelid: auth.zelid || fluxStore.zelid,  // Use auth.zelid first
      signature: auth.signature,
      loginPhrase: auth.loginPhrase,
    }

    console.log('=== FLUXCLOUD PATTERN CRYPTO.COM PAYLOAD ===')
    console.log('Using original FluxCloud pattern - no price_id or sub_id needed')

    console.log('=== CRYPTO.COM PAYMENT INITIALIZATION ===')
    console.log('Plan ID:', props.planId)
    console.log('Selected plan data:', selectedPlan.value)
    console.log('Payment payload:', sanitizeAuthData(paymentPayload))

    const response = await fetch('https://jetpackbridge.runonflux.io/api/v1/cryptocom.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(paymentPayload),
    })

    console.log('Crypto.com response status:', response.status, response.statusText)

    const result = await response.json()
    console.log('Crypto.com initialization result:', result)

    // Enhanced error logging
    if (!result.success) {
      console.error('❌ Crypto.com Payment Failed:')
      console.error('  - Error message:', result.error)
      console.error('  - Response status:', response.status)
      console.error('  - Full result:', result)
      console.error('  - Sent payload:', paymentPayload)
    }

    if (result.success) {
      console.log('✅ Crypto.com payment initialized successfully')
      console.log('🔍 Checking response fields:')
      console.log('  - payment_id:', result.payment_id)
      console.log('  - payment_addr:', result.payment_addr)
      console.log('  - sub_id:', result.sub_id)
      console.log('  - price_id:', result.price_id)
      console.log('  - checkout_url:', result.checkout_url)
      console.log('  - subscription_url:', result.subscription_url)
      console.log('  - checkout_url type:', typeof result.checkout_url)
      console.log('  - subscription_url type:', typeof result.subscription_url)

      // Store payment details for tracking
      fluxPayment.value = {
        amount: null,
        usdValue: getPlanPrice(),
        paymentId: result.payment_id,
        paymentAddr: result.payment_addr,
        subId: result.sub_id,
        priceId: result.price_id,
        checkoutUrl: result.checkout_url || result.subscription_url,
      }

      // Redirect to Crypto.com checkout - try checkout_url first, then subscription_url
      const redirectUrl = result.checkout_url || result.subscription_url
      if (redirectUrl) {
        console.log('🚀 Redirecting to Crypto.com:', redirectUrl)
        window.open(redirectUrl, '_blank')
        showAlert(t('components.checkoutContent.redirectedToCryptoCom'), 'info')
        cryptoPaymentProcessing.value = true

        // Start monitoring for Crypto.com payment as well
        monitorPayment(result.payment_id, result.sub_id, result.payment_addr, 'crypto')
      } else {
        console.error('❌ No checkout_url or subscription_url in successful response!')
        console.error('This means the backend returned success=true but no payment URL')
        showAlert(t('components.checkoutContent.paymentInitializedNoUrl'), 'warning')
      }
    } else {
      // Provide more helpful error messages based on common issues
      let errorMessage = result.error || t('components.checkoutContent.failedToInitializeCryptoCom')

      if (response.status === 500) {
        errorMessage += '. ' + t('components.checkoutContent.serverErrorContactSupport')
      } else if (response.status === 404) {
        errorMessage += '. ' + t('components.checkoutContent.paymentServiceNotFound')
      } else if (result.error && result.error.includes('environment') || result.error && result.error.includes('config')) {
        errorMessage += '. ' + t('components.checkoutContent.paymentServiceNotConfigured')
      }

      showAlert(errorMessage)
    }
  } catch (error) {
    console.error('Error initializing Crypto.com payment:', error)
    showAlert(t('components.checkoutContent.failedToInitializeCryptoComTryAgain'))
  } finally {
    initializingCryptoPayment.value = false
  }
}

const monitorPayment = async (paymentId, subId, paymentAddr, paymentType = 'flux') => {
  // Monitor payment completion by checking subscription status
  console.log('🔍 Payment monitoring started:', { paymentId, subId, actionType: props.actionType })

  // Validate that we have proper identifiers to monitor
  if (!paymentId && !subId) {
    console.error('❌ CRITICAL: Payment monitoring started without payment ID or subscription ID!')
    console.error('This should not happen - monitoring requires valid payment identifiers')
    console.error('Preventing false positive payment confirmation')
    
    return // Exit without starting monitoring
  }

  // Store initial subscription state to detect new payments
  let initialSubscriptionState = null
  let initialReadState = null

  // For renewals, capture initial /read state to detect error+period_end disappearing
  if (props.actionType === 'renew') {
    try {
      const auth = getAuthFromStorage()
      const initialPayload = {
        zelid: auth.zelid || fluxStore.zelid,
        signature: auth.signature,
        loginPhrase: auth.loginPhrase,
        page: '1',
        size: '0', // Just check subscription status, don't load files to avoid rate limiting
      }

      console.log('📸 Capturing initial /read state for renewal monitoring...')

      const initialReadResponse = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(initialPayload),
      })

      const initialReadResult = await initialReadResponse.json()

      // Check if subscription expired/canceled error exists (has BOTH error and period_end AND specific error message)
      const hasSubscriptionExpired = !!(
        initialReadResult.error &&
        initialReadResult.period_end &&
        (initialReadResult.error.indexOf("Subscription Expired") > -1 ||
         initialReadResult.error.indexOf("Subscription Canceled") > -1)
      )

      initialReadState = {
        hasError: !!initialReadResult.error,
        hasPeriodEnd: !!initialReadResult.period_end,
        hasSubscriptionExpired: hasSubscriptionExpired,
        periodEnd: initialReadResult.period_end,
      }

      console.log('📸 Initial /read state captured:', {
        hasError: initialReadState.hasError,
        hasPeriodEnd: initialReadState.hasPeriodEnd,
        hasSubscriptionExpired: initialReadState.hasSubscriptionExpired,
        periodEnd: initialReadState.periodEnd,
      })
    } catch (error) {
      console.warn('⚠️ Failed to capture initial /read state:', error)
    }
  }

  // For new signups, capture initial storage state to detect actual activation (not returning user)
  if (props.actionType === 'signup') {
    try {
      const auth = getAuthFromStorage()
      const initialPayload = {
        zelid: auth.zelid || fluxStore.zelid,
        signature: auth.signature,
        loginPhrase: auth.loginPhrase,
      }

      console.log('📸 Capturing initial storage state for signup monitoring...')

      const initialResponse = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(initialPayload),
      })

      const initialResult = await initialResponse.json()

      if (initialResult.active !== undefined) {
        initialSubscriptionState = {
          wasActive: initialResult.active,
          initialCapacity: initialResult.capacity,
        }
        console.log('📸 Initial signup state captured - Was Active:', initialResult.active, 'Capacity:', (initialResult.capacity_gb || Math.round(initialResult.capacity / 1024 / 1024 / 1024)) + 'GB')
      } else {
        console.warn('⚠️ Failed to get initial storage state:', initialResult.error || 'Unknown error')
      }
    } catch (error) {
      console.warn('⚠️ Failed to capture initial signup state:', error)
    }
  }

  // For upgrades and downgrades, capture initial storage state for comparison
  if (props.actionType === 'upgrade' || props.actionType === 'downgrade') {
    try {
      const auth = getAuthFromStorage()
      const initialPayload = {
        zelid: auth.zelid || fluxStore.zelid,
        signature: auth.signature,
        loginPhrase: auth.loginPhrase,
      }

      console.log('📸 Capturing initial storage state for', props.actionType, 'monitoring...')

      const initialResponse = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(initialPayload),
      })

      const initialResult = await initialResponse.json()

      if (initialResult.active !== undefined) {
        initialSubscriptionState = initialResult
        console.log('📸 Initial state captured - Active:', initialResult.active, 'Capacity:', (initialResult.capacity_gb || Math.round(initialResult.capacity / 1024 / 1024 / 1024)) + 'GB')
      } else {
        console.warn('⚠️ Failed to get initial storage state:', initialResult.error || 'Unknown error')
      }
    } catch (error) {
      console.warn('⚠️ Failed to capture initial storage state:', error)
    }
  }

  // Clear any existing monitoring
  if (paymentMonitoringInterval) {
    console.log('🧹 Clearing existing payment monitoring')
    clearInterval(paymentMonitoringInterval)
  }
  if (paymentMonitoringTimeout) {
    clearTimeout(paymentMonitoringTimeout)
  }

  paymentMonitoringInterval = setInterval(async () => {
    try {
      const auth = getAuthFromStorage()

      if (paymentId && subId) {
        // For Crypto.com payments with payment_id - check specific payment status
        const checkPayload = {
          action: 'CHECK',
          payment_id: paymentId,
          sub_id: subId,
          zelid: auth.zelid || fluxStore.zelid,
          signature: auth.signature,
          loginPhrase: auth.loginPhrase,
        }

        if (paymentAddr) {
          checkPayload.payment_addr = paymentAddr
        }

        console.log('Checking Crypto.com payment status with payload:', sanitizeAuthData(checkPayload))

        const response = await fetch('https://jetpackbridge.runonflux.io/api/v1/cryptocom.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(checkPayload),
        })

        const result = await response.json()
        console.log('Crypto.com payment status check result:', result)

        if (result.success && (result.status === 'completed' || result.payment_status === 'completed' || result.payment_status === 'active')) {
          // Payment confirmed via Crypto.com - now verify based on action type
          let verificationPassed = false
          let successMessage = ''

          if (props.actionType === 'renew') {
            // For renewals, verify error disappeared
            console.log('✅ Crypto.com payment completed - verifying renewal...')
            try {
              const readResponse = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/read', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  zelid: auth.zelid || fluxStore.zelid,
                  signature: auth.signature,
                  loginPhrase: auth.loginPhrase,
                  page: '1',
                  size: '0',
                }),
              })

              const readResult = await readResponse.json()
              const hasSubscriptionExpiredNow = !!(readResult.error && readResult.period_end && (
                readResult.error.indexOf("Subscription Expired") > -1 ||
                readResult.error.indexOf("Subscription Canceled") > -1
              ))

              if (!hasSubscriptionExpiredNow) {
                console.log('✅ Renewal verified - no subscription error')
                verificationPassed = true
                successMessage = t('components.checkoutContent.paymentConfirmedRenewed')
              } else {
                console.log('⏳ Payment completed but subscription still has error - will retry verification')
              }
            } catch (error) {
              console.warn('⚠️ Could not verify renewal, assuming payment success:', error)
              verificationPassed = true
              successMessage = t('components.checkoutContent.paymentConfirmedRenewed')
            }
          } else if (props.actionType === 'upgrade' || props.actionType === 'downgrade') {
            // For upgrades/downgrades, verify capacity changed
            console.log(`✅ Crypto.com payment completed - verifying ${props.actionType}...`)
            try {
              const storageResponse = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/storage', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  zelid: auth.zelid || fluxStore.zelid,
                  signature: auth.signature,
                  loginPhrase: auth.loginPhrase,
                }),
              })

              const storageResult = await storageResponse.json()
              const expectedCapacity = props.planId === 'pro' ? 107374182400 :
                props.planId === 'standard' ? 53687091200 :
                  props.planId === 'starter' ? 10737418240 : 53687091200

              if (initialSubscriptionState && storageResult.capacity === expectedCapacity) {
                console.log(`✅ ${props.actionType} verified - capacity changed to expected value`)
                verificationPassed = true
                successMessage = props.actionType === 'upgrade'
                  ? t('components.checkoutContent.paymentConfirmedUpgraded')
                  : t('components.checkoutContent.paymentConfirmedDowngraded')
              } else {
                console.log(`⏳ Payment completed but capacity not yet updated - will retry verification`)
              }
            } catch (error) {
              console.warn(`⚠️ Could not verify ${props.actionType}, assuming payment success:`, error)
              verificationPassed = true
              successMessage = props.actionType === 'upgrade'
                ? t('components.checkoutContent.paymentConfirmedUpgraded')
                : t('components.checkoutContent.paymentConfirmedDowngraded')
            }
          } else {
            // For new signups, verify subscription is active and no errors
            console.log('✅ Crypto.com payment completed - verifying signup...')
            try {
              const storageResponse = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/storage', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  zelid: auth.zelid || fluxStore.zelid,
                  signature: auth.signature,
                  loginPhrase: auth.loginPhrase,
                }),
              })

              const storageResult = await storageResponse.json()

              if (storageResult.active === true) {
                // Also verify with /read if was already active before
                if (initialSubscriptionState && initialSubscriptionState.wasActive === true) {
                  const readResponse = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/read', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                      zelid: auth.zelid || fluxStore.zelid,
                      signature: auth.signature,
                      loginPhrase: auth.loginPhrase,
                      page: '1',
                      size: '0',
                    }),
                  })

                  const readResult = await readResponse.json()
                  const hasSubscriptionError = readResult.error && (
                    readResult.error.indexOf("Subscription Expired") > -1 ||
                    readResult.error.indexOf("Subscription Canceled") > -1
                  )

                  if (!hasSubscriptionError) {
                    console.log('✅ Signup verified - active with no errors')
                    verificationPassed = true
                    successMessage = t('components.checkoutContent.paymentConfirmedSubscriptionActive')
                  } else {
                    console.log('⏳ Payment completed but subscription still has error - will retry verification')
                  }
                } else {
                  console.log('✅ Signup verified - subscription active')
                  verificationPassed = true
                  successMessage = t('components.checkoutContent.paymentConfirmedSubscriptionActive')
                }
              } else {
                console.log('⏳ Payment completed but subscription not yet active - will retry verification')
              }
            } catch (error) {
              console.warn('⚠️ Could not verify signup, assuming payment success:', error)
              verificationPassed = true
              successMessage = t('components.checkoutContent.paymentConfirmedSubscriptionActive')
            }
          }

          if (verificationPassed) {
            clearInterval(paymentMonitoringInterval)
            clearTimeout(paymentMonitoringTimeout)
            paymentMonitoringInterval = null
            paymentMonitoringTimeout = null
            cryptoPaymentProcessing.value = false

            // Store payment gateway in localStorage for subscription management
            localStorage.setItem('fluxdrive_gateway', props.gateway)
            console.log('💾 Stored payment gateway:', props.gateway)

            showSnackbar(successMessage, 'success', 8000)
            emit('success')
          }
          // If verification failed, continue monitoring
        } else if (result.error) {
          console.warn('Payment check error:', result.error)
        }
      } else if (subId) {
        // For FluxPay payments - check subscription status based on action type

        // Check subscription status based on action type
        if (props.actionType === 'renew') {
          // For renewals, check /read endpoint for error+period_end disappearing
          try {
            const readResponse = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/read', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                zelid: auth.zelid || fluxStore.zelid,
                signature: auth.signature,
                loginPhrase: auth.loginPhrase,
                page: '1',
                size: '0', // Just check subscription status, don't load files to avoid rate limiting
              }),
            })

            if (!readResponse.ok) {
              console.warn('⚠️ /read endpoint returned error status:', readResponse.status)
              console.log('⏳ Waiting for renewal - API returned error status, will retry...')

              return // Continue monitoring, will retry in next interval
            }

            const readResult = await readResponse.json()

            // Check if subscription expired error exists (has BOTH error and period_end)
            const hasSubscriptionExpiredNow = !!(readResult.error && readResult.period_end)

            // Check for other types of errors (not subscription expiration)
            const hasOtherError = readResult.error && !readResult.period_end

            if (hasOtherError) {
              // Different error (session expired, auth error, etc.) - not subscription expiration
              console.warn('⚠️ /read endpoint returned different error:', readResult.error)
              console.log('⏳ Waiting for renewal - non-subscription error detected, will retry...')

              return // Continue monitoring, will retry in next interval
            }

            if (initialReadState && initialReadState.hasSubscriptionExpired && !hasSubscriptionExpiredNow) {
              // Success: Had subscription expired error before, now it's gone (renewed)
              console.log('✅ Renewal confirmed - subscription expired error with period_end disappeared!')
              console.log('Previous state: error =', initialReadState.hasError, ', period_end =', initialReadState.periodEnd)
              console.log('Current state: error =', !!readResult.error, ', period_end =', readResult.period_end || 'none')

              clearInterval(paymentMonitoringInterval)
              clearTimeout(paymentMonitoringTimeout)
              paymentMonitoringInterval = null
              paymentMonitoringTimeout = null
              fluxPaymentProcessing.value = false

              // Store payment gateway in localStorage for subscription management
              localStorage.setItem('fluxdrive_gateway', props.gateway)
              console.log('💾 Stored payment gateway:', props.gateway)

              showSnackbar(t('components.checkoutContent.paymentConfirmedRenewed'), 'success', 8000)
              emit('success')
            } else if (hasSubscriptionExpiredNow) {
              // Still expired: Still has error with period_end
              console.log('⏳ Waiting for renewal to process - still has subscription expired error with period_end:', readResult.period_end)
            } else if (!initialReadState) {
              console.log('⏳ Waiting for renewal - no initial state captured')
            } else {
              console.log('⏳ Waiting for renewal - checking read endpoint state...')
            }
          } catch (error) {
            // Network error, timeout, or JSON parse error
            console.warn('⚠️ Failed to check /read endpoint for renewal:', error.message)
            console.log('⏳ Waiting for renewal - network/timeout error, will retry...')
            // Continue monitoring, will retry in next interval
          }
        } else if (props.actionType === 'upgrade' || props.actionType === 'downgrade') {
          // For upgrades and downgrades, check /storage endpoint for capacity change
          const response = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/storage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              zelid: auth.zelid || fluxStore.zelid,
              signature: auth.signature,
              loginPhrase: auth.loginPhrase,
            }),
          })

          const result = await response.json()

          if (initialSubscriptionState && result.active === true) {
            const capacityChanged = result.capacity !== initialSubscriptionState.capacity
            const expectedCapacity = props.planId === 'pro' ? 107374182400 :
              props.planId === 'standard' ? 53687091200 :
                props.planId === 'starter' ? 10737418240 : 53687091200 // 100GB for pro, 50GB for standard, 10GB for starter

            if (capacityChanged && result.capacity === expectedCapacity) {
              const actionText = props.actionType === 'upgrade' ? 'Upgrade' : 'Downgrade'

              console.log(`✅ ${actionText} confirmed - storage capacity changed!`)
              console.log('Previous capacity:', (initialSubscriptionState.capacity_gb || Math.round(initialSubscriptionState.capacity / 1024 / 1024 / 1024)) + 'GB')
              console.log('New capacity:', (result.capacity_gb || Math.round(result.capacity / 1024 / 1024 / 1024)) + 'GB')

              clearInterval(paymentMonitoringInterval)
              clearTimeout(paymentMonitoringTimeout)
              paymentMonitoringInterval = null
              paymentMonitoringTimeout = null
              fluxPaymentProcessing.value = false

              // Store payment gateway in localStorage for subscription management
              localStorage.setItem('fluxdrive_gateway', props.gateway)
              console.log('💾 Stored payment gateway:', props.gateway)

              const message = props.actionType === 'upgrade'
                ? t('components.checkoutContent.paymentConfirmedUpgraded')
                : t('components.checkoutContent.paymentConfirmedDowngraded')

              showSnackbar(message, 'success', 8000)
              emit('success')
            } else {
              const actionText = props.actionType === 'downgrade' ? 'downgrade' : 'upgrade'
              console.log(`⏳ Waiting for ${actionText} to process - current capacity:`, (result.capacity_gb || Math.round(result.capacity / 1024 / 1024 / 1024)) + 'GB')
            }
          } else {
            console.log('⏳ Waiting for subscription data...')
          }
        } else {
          // For new subscriptions, check /storage if active AND verify with /read
          const response = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/storage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              zelid: auth.zelid || fluxStore.zelid,
              signature: auth.signature,
              loginPhrase: auth.loginPhrase,
            }),
          })

          const result = await response.json()

          if (result.active === true) {
            // If we have initial state and was already active, need to verify this is NEW activation
            if (initialSubscriptionState && initialSubscriptionState.wasActive === true) {
              // Was already active before payment - verify /read shows no errors (actual new subscription)
              try {
                const readResponse = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/read', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    zelid: auth.zelid || fluxStore.zelid,
                    signature: auth.signature,
                    loginPhrase: auth.loginPhrase,
                    page: '1',
                    size: '0', // Just check status
                  }),
                })

                const readResult = await readResponse.json()

                const hasSubscriptionError = readResult.error && (
                  readResult.error.indexOf("Subscription Expired") > -1 ||
                  readResult.error.indexOf("Subscription Canceled") > -1
                )

                if (hasSubscriptionError) {
                  // Still has subscription error - payment not processed yet
                  console.log('⏳ Subscription still inactive (has error) - continuing to monitor...')

                  return
                }

                // No error - subscription is truly active now
                console.log('✅ New subscription is now active (verified via /read) - payment completed!')
              } catch (readError) {
                console.warn('⚠️ Could not verify with /read, assuming storage result is correct')
              }
            } else {
              // Was not active before, now is - definitely new subscription
              console.log('✅ New subscription is now active - payment completed!')
            }

            clearInterval(paymentMonitoringInterval)
            clearTimeout(paymentMonitoringTimeout)
            paymentMonitoringInterval = null
            paymentMonitoringTimeout = null
            fluxPaymentProcessing.value = false

            // Store payment gateway in localStorage for subscription management
            localStorage.setItem('fluxdrive_gateway', props.gateway)
            console.log('💾 Stored payment gateway:', props.gateway)

            showSnackbar(t('components.checkoutContent.paymentConfirmedSubscriptionActive'), 'success', 8000)
            emit('success')
          } else {
            console.log('⏳ Subscription not yet active - continuing to monitor...', result)
          }
        }
      } else {
        console.warn('No payment_id or sub_id provided for monitoring - stopping')
        clearInterval(paymentMonitoringInterval)
        clearTimeout(paymentMonitoringTimeout)
        paymentMonitoringInterval = null
        paymentMonitoringTimeout = null
        if (paymentType === 'crypto') {
          cryptoPaymentProcessing.value = false
        } else {
          fluxPaymentProcessing.value = false
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
  }, 120000) // Check every 2 minutes (Flux blockchain block time)

  // Stop monitoring after 10 minutes
  paymentMonitoringTimeout = setTimeout(() => {
    clearInterval(paymentMonitoringInterval)
    paymentMonitoringInterval = null
    paymentMonitoringTimeout = null

    if (paymentType === 'crypto' && cryptoPaymentProcessing.value) {
      cryptoPaymentProcessing.value = false
      showAlert(t('components.checkoutContent.cryptoComTimeoutCheckManually'), 'warning')
    } else if (paymentType === 'flux' && fluxPaymentProcessing.value) {
      fluxPaymentProcessing.value = false
      showAlert(t('components.checkoutContent.fluxPayTimeoutCheckManually'), 'warning')
    }
  }, 600000)
}

const cancelFluxPayment = () => {
  console.log('🛑 Cancelling FluxPay payment monitoring (keeping payment data)')

  // Stop payment monitoring
  if (paymentMonitoringInterval) {
    clearInterval(paymentMonitoringInterval)
    paymentMonitoringInterval = null
  }
  if (paymentMonitoringTimeout) {
    clearTimeout(paymentMonitoringTimeout)
    paymentMonitoringTimeout = null
  }

  // Hide payment-related snackbars
  hideSnackbar()

  fluxPaymentProcessing.value = false

  // DON'T clear fluxPayment.value - keep manual payment data visible
  showAlert(t('components.checkoutContent.paymentMonitoringCancelledCanPayManually'), 'info')
}

const cancelCryptoPayment = () => {
  console.log('🛑 Cancelling Crypto.com payment and stopping monitoring')

  // Stop payment monitoring
  if (paymentMonitoringInterval) {
    clearInterval(paymentMonitoringInterval)
    paymentMonitoringInterval = null
  }
  if (paymentMonitoringTimeout) {
    clearTimeout(paymentMonitoringTimeout)
    paymentMonitoringTimeout = null
  }

  // Hide payment-related snackbars
  hideSnackbar()

  cryptoPaymentProcessing.value = false
  showAlert(t('components.checkoutContent.cryptoComPaymentCancelled'), 'info')
}

const formatEndDate = endTime => {
  if (!endTime) return 'N/A'
  const date = new Date(endTime)

  // Always show both date and time
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const getCurrentSubscriptionEndDate = () => {
  // For upgrades and downgrades, use currentSubscriptionData instead of subscriptionData
  if ((props.actionType === 'upgrade' || props.actionType === 'downgrade') && currentSubscriptionData.value) {
    console.log('🔍 Getting current subscription end date for', props.actionType, '(from currentSubscriptionData)...')
    console.log('📊 Full currentSubscriptionData.value:', JSON.stringify(currentSubscriptionData.value, null, 2))

    const data = currentSubscriptionData.value

    // Check for period_end first
    if (data.period_end) {
      console.log('📅 Found period_end:', data.period_end, '(type:', typeof data.period_end, ')')
      const date = new Date(data.period_end * 1000)
      console.log('📅 Converted to date:', date.toISOString())
      if (date.getFullYear() > 2000) {
        return date
      }
    }

    // Check for endtime as fallback
    if (data.endtime) {
      console.log('📅 Found endtime:', data.endtime, '(type:', typeof data.endtime, ')')
      const date = new Date(data.endtime * 1000)
      console.log('📅 Converted endtime to date:', date.toISOString())
      if (date.getFullYear() > 2000) {
        return date
      }
    }

    console.log('⚠️ period_end/endtime not found or invalid in:', Object.keys(data))
    
    return null // Return null for upgrades/downgrades if no valid date found
  }

  // For other action types, use original logic
  console.log('🔍 Getting current subscription end date (FluxCloud method)...')
  console.log('📊 Full subscriptionData.value:', JSON.stringify(subscriptionData.value, null, 2))

  if (subscriptionData.value) {
    const data = subscriptionData.value

    // FluxCloud uses period_end for current subscription end date
    if (data.period_end) {
      console.log('📅 Found period_end:', data.period_end, '(type:', typeof data.period_end, ')')

      // FluxCloud treats this as timestamp in seconds
      const date = new Date(data.period_end * 1000)
      console.log('📅 Converted to date:', date.toISOString())
      if (date.getFullYear() > 2000) {
        return date
      }
    }

    console.log('⚠️ period_end not found or invalid in:', Object.keys(data))
  }

  console.log('⚠️ Using current date as fallback')
  
  return new Date() // Return current date as fallback
}

const getEndDate = () => {
  // FluxCloud method: Use new_plan.endtime for new subscription end date
  console.log('🔍 Getting new subscription end date (FluxCloud method)...')

  if (subscriptionData.value) {
    const data = subscriptionData.value
    const newPlan = data.new_plan || data.plan

    if (newPlan && newPlan.endtime) {
      console.log('📅 Raw new_plan.endtime:', newPlan.endtime, typeof newPlan.endtime)

      // FluxCloud treats this as timestamp in seconds
      const date = new Date(newPlan.endtime * 1000)
      console.log('📅 Parsed new plan end date:', date)
      if (date.getFullYear() > 2000) return date
    }

    if (newPlan && newPlan.enddate) {
      console.log('📅 Raw new_plan.enddate:', newPlan.enddate)
      const date = new Date(newPlan.enddate)
      console.log('📅 Parsed new plan end date from enddate:', date)
      if (date.getFullYear() > 2000) return date
    }
  }

  console.log('⚠️ No new_plan endtime found, calculating +1 month from now')

  // Fallback: calculate as 1 month from current time (now)
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 1)
  
  return endDate
}

const getCurrentPlan = () => {
  // For upgrades and downgrades, use the separate currentSubscriptionData
  if ((props.actionType === 'upgrade' || props.actionType === 'downgrade') && currentSubscriptionData.value) {
    console.log('🔍 Getting current plan from currentSubscriptionData:', currentSubscriptionData.value)
    const data = currentSubscriptionData.value

    // The current subscription API response should contain the current plan info
    if (data.plan) {
      console.log('📋 Using currentSubscriptionData.plan:', data.plan)

      return data.plan
    }

    // If plan info is at root level
    if (data.plan_name || data.storage_gb || data.price) {
      console.log('📋 Using currentSubscriptionData root level data')

      return data
    }

    console.log('⚠️ Current subscription data found but no plan info')
  }

  // For non-upgrades or fallback, use the regular subscriptionData
  if (subscriptionData.value) {
    const data = subscriptionData.value
    console.log('🔍 Getting current plan from subscriptionData:', data)

    // For new signups, data.plan should be the plan being purchased
    if (data.plan && !data.new_plan) {
      console.log('📋 Using data.plan:', data.plan)
      
      return data.plan
    }

    // Check if current plan data is in the root level
    if (data.plan_name || data.storage_gb || data.price) {
      console.log('📋 Using root level data as plan')
      
      return data
    }
  }

  // Try to get from flux store user subscription data as last resort
  if (fluxStore.user && fluxStore.user.fluxdrive_subscription) {
    console.log('📋 Using flux store subscription data:', fluxStore.user.fluxdrive_subscription)
    
    return fluxStore.user.fluxdrive_subscription
  }

  console.log('⚠️ No current plan data found anywhere')
  
  return null
}

const getNewPlan = () => {
  if (subscriptionData.value) {
    const data = subscriptionData.value

    // New plan is in new_plan field
    return data.new_plan || null
  }
  
  return null
}

const getCurrentPlanName = () => {
  const currentPlan = getCurrentPlan()
  console.log('🏷️ Getting current plan name, currentPlan:', currentPlan)

  if (currentPlan) {
    const planName = currentPlan.plan_name || currentPlan.name
    if (planName) {
      console.log('🏷️ Current plan name result:', planName)
      
      return planName
    }
  }

  // If we can't find current plan, for upgrades/downgrades we can show a generic message
  if (props.actionType === 'upgrade' || props.actionType === 'downgrade') {
    console.log('🏷️ Using fallback for upgrade/downgrade - Current Subscription')

    return t('components.checkoutContent.currentSubscription')
  }

  console.log('🏷️ Using fallback - Current Plan')

  return t('components.checkoutContent.currentPlanFallback')
}

const getNewPlanName = () => {
  const newPlan = getNewPlan()
  
  return newPlan?.plan_name || newPlan?.name || selectedPlan.value?.plan_name || 'New Plan'
}

const getCurrentPlanStorage = () => {
  const currentPlan = getCurrentPlan()
  if (currentPlan) {
    if (currentPlan.storage_gb) return `${currentPlan.storage_gb} GB`
    if (currentPlan.storage_limit) return `${currentPlan.storage_limit} GB`
    if (currentPlan.storage) return `${currentPlan.storage} GB`
  }

  // For upgrades and downgrades, show a generic message instead of N/A
  if (props.actionType === 'upgrade' || props.actionType === 'downgrade') {
    return t('components.checkoutContent.currentStorage')
  }

  return 'N/A'
}

const getCurrentPlanPrice = () => {
  const currentPlan = getCurrentPlan()
  if (currentPlan) {
    if (currentPlan.priceInCents && currentPlan.priceInCents > 0) {
      return (currentPlan.priceInCents / 100).toFixed(2)
    }
    if (currentPlan.price && currentPlan.price > 0) {
      if (currentPlan.price > 10) {
        return (currentPlan.price / 100).toFixed(2)
      }
      
      return currentPlan.price.toFixed(2)
    }
    if (currentPlan.cost && currentPlan.cost > 0) {
      return currentPlan.cost.toFixed(2)
    }
  }

  // For upgrades and downgrades, show a placeholder instead of 0.00
  if (props.actionType === 'upgrade' || props.actionType === 'downgrade') {
    return '-.--'
  }
  
  return '0.00'
}

const getPlanPrice = () => {
  if (!selectedPlan.value) return '0.00'

  // Try different price field formats
  if (selectedPlan.value.priceInCents && selectedPlan.value.priceInCents > 0) {
    return (selectedPlan.value.priceInCents / 100).toFixed(2)
  }

  if (selectedPlan.value.price && selectedPlan.value.price > 0) {
    // If price is already in cents (> 10), convert to dollars
    if (selectedPlan.value.price > 10) {
      return (selectedPlan.value.price / 100).toFixed(2)
    }

    // If price is already in dollars (< 10), use as-is
    return selectedPlan.value.price.toFixed(2)
  }

  if (selectedPlan.value.cost && selectedPlan.value.cost > 0) {
    return selectedPlan.value.cost.toFixed(2)
  }

  return '0.00'
}

const getDisplayPlanName = planName => {
  if (!planName) return 'N/A'

  // Map plan names to translated versions
  const lowerPlanName = planName.toLowerCase()

  // Use translation keys for plan names
  const planNameKey = lowerPlanName.replace(/\s+/g, '')
  if (planNameKey === 'starter') return t('components.checkoutContent.planNames.starter')
  if (planNameKey === 'standard') return t('components.checkoutContent.planNames.standard')
  if (planNameKey === 'pro') return t('components.checkoutContent.planNames.pro')
  if (planNameKey === 'enterprise') return t('components.checkoutContent.planNames.enterprise')
  if (planNameKey === 'fluxdrivepro') return t('components.checkoutContent.planNames.fluxDrivePro')

  return planName
}

const getStorageDisplay = () => {
  if (!selectedPlan.value) {
    console.log('No selected plan available')

    return 'N/A'
  }

  console.log('Getting storage display for plan:', selectedPlan.value)

  // Check for storage_gb first (our FluxDrive plans)
  if (selectedPlan.value.storage_gb) {
    return `${selectedPlan.value.storage_gb} GB`
  }

  // Try different storage field formats from API response
  if (selectedPlan.value.storage_limit) {
    console.log('Using storage_limit:', selectedPlan.value.storage_limit)

    return `${selectedPlan.value.storage_limit} GB`
  }

  if (selectedPlan.value.storage) {
    console.log('Using storage field:', selectedPlan.value.storage)

    // If storage is in bytes, convert to GB
    if (selectedPlan.value.storage > 1000000) {
      const gb = Math.round(selectedPlan.value.storage / (1024 * 1024 * 1024))
      
      return `${gb} GB`
    }

    // Remove 'GB' if it's already included in the storage value
    const storage = selectedPlan.value.storage.toString().replace(/\s*GB\s*/i, '')

    return `${storage} GB`
  }

  // Fallback to local plan data based on plan name
  const planMapping = {
    'starter': '10',
    'standard': '50',
    'pro': '100',  // Elite plan uses 'pro' as API ID
    'enterprise': 'Customizable',
    'flux drive pro': 'Customizable',
  }

  const planName = selectedPlan.value.plan_name?.toLowerCase()
  console.log('Plan name for mapping:', planName)
  console.log('Available mappings:', Object.keys(planMapping))

  if (planMapping[planName]) {
    const storage = planMapping[planName] === 'Customizable' ? 'Customizable' : `${planMapping[planName]} GB`
    console.log('Using mapped storage:', storage)
    
    return storage
  }

  console.log('No storage found, returning error GB')
  console.log('Full plan object:', JSON.stringify(selectedPlan.value, null, 2))
  
  return 'error GB'
}

// Clipboard.js instance
let clipboard = null

// Watch for plan ID changes
watch(() => props.planId, newPlanId => {
  if (newPlanId) {
    loadPlanDetails()
  }
}, { immediate: true })

// Load plan details on mount
onMounted(() => {
  console.log('💳 CheckoutContent mounted with props:', {
    planId: props.planId,
    gateway: props.gateway,
    actionType: props.actionType,
  })
  console.log('🔍 Action type is downgrade?', props.actionType === 'downgrade')
  console.log('🔍 Should show plan comparison?', props.actionType === 'upgrade' || props.actionType === 'downgrade')
  console.log('🔍 Will load current subscription?', props.actionType === 'upgrade' || props.actionType === 'downgrade')

  if (props.planId) {
    loadPlanDetails()
  }

  // Initialize Clipboard.js
  clipboard = new ClipboardJS('.copy-btn', {
    text: trigger => {
      return trigger.getAttribute('data-clipboard-text')
    },
  })

  clipboard.on('success', e => {
    showSnackbar(t('components.checkoutContent.copiedToClipboard'), 'success', 2000, 'mdi-check-circle')
    e.clearSelection()
  })

  clipboard.on('error', e => {
    showSnackbar(t('components.checkoutContent.failedToCopy'), 'error', 2000, 'mdi-alert-circle')
  })
})

// Cleanup on unmount
onUnmounted(() => {
  if (clipboard) {
    clipboard.destroy()
    clipboard = null
  }
})
</script>

<style scoped>
.checkout-content {
  min-height: 400px;
}

.plan-summary {
  padding: 1rem 0;
}

.plan-details {
  background: rgba(var(--v-theme-surface-variant), 0.1);
  padding: 1rem;
  border-radius: 8px;
}

.action-chip {
  font-weight: 500;
  padding: 8px 12px !important;
}

.action-chip .v-icon {
  vertical-align: middle;
  margin-top: -1px;
}

.payment-icon {
  display: flex;
  justify-content: center;
  align-items: center;
}

.circular-icon {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.circular-icon:hover {
  transform: scale(0.95);
}

/* Manual Payment Card */
.manual-payment-card {
  border: 1px solid rgba(var(--v-theme-primary), 0.2) !important;
  background: rgba(var(--v-theme-primary), 0.03) !important;
}

/* Wallet Icons Grid */
.wallet-icons-grid {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.wallet-icon-card {
  border-radius: 12px !important;
  transition: all 0.2s ease;
  cursor: pointer;
  flex: 0 1 auto;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.3) !important;
}

.wallet-icon-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-warning), 0.5) !important;
  box-shadow: 0 8px 24px rgba(var(--v-theme-warning), 0.3);
}

.wallet-brand-icon {
  height: 64px;
  width: 64px;
  object-fit: contain;
}

@media (max-width: 768px) {
  .wallet-icons-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .wallet-icon-card {
    width: 100%;
  }

  .wallet-brand-icon {
    height: 48px;
    width: 48px;
  }
}
</style>