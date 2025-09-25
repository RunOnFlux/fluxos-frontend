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
      <h3 class="text-h5 mb-2">Loading plan details...</h3>
    </div>

    <!-- Error state -->
    <div v-else-if="!selectedPlan && !loading" class="text-center py-8">
      <VIcon
        icon="mdi-alert-circle"
        size="64"
        color="error"
        class="mb-4"
      />
      <h3 class="text-h5 mb-2">Unable to load plan details</h3>
      <p class="text-body-1 text-medium-emphasis mb-4">
        Please try again or contact support if the problem persists.
      </p>
      <VBtn
        color="primary"
        @click="loadPlanDetails"
      >
        Try Again
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
                :icon="props.actionType === 'renew' ? 'mdi-refresh' : props.actionType === 'upgrade' ? 'mdi-arrow-up-bold' : 'mdi-receipt'"
                class="me-2"
              />
              {{ props.actionType === 'renew' ? 'Renewal' : props.actionType === 'upgrade' ? 'Upgrade' : 'Order' }} Summary
            </VCardTitle>
            <VCardText>
              <div class="plan-summary">
                <!-- Full Plan Comparison for Upgrades -->
                <div v-if="props.actionType === 'upgrade'" class="mb-3">
                  <div class="text-body-2 mb-3 text-center font-weight-medium">Plan Comparison</div>

                  <!-- Current Plan Card -->
                  <VCard variant="outlined" class="mb-2" style="border-color: rgb(var(--v-theme-info));">
                    <VCardText class="pa-3">
                      <div class="d-flex align-center mb-2">
                        <VIcon icon="mdi-account-check" size="16" class="me-2 text-info" />
                        <span class="text-body-2 font-weight-medium text-info">Your Current Plan</span>
                      </div>
                      <div class="d-flex justify-space-between align-center mb-1">
                        <span class="text-body-1 font-weight-bold">{{ getDisplayPlanName(getCurrentPlanName()) }}</span>
                        <VChip color="info" variant="flat" size="small">
                          ${{ getCurrentPlanPrice() }}/mo
                        </VChip>
                      </div>
                      <div class="text-body-2 text-medium-emphasis">
                        {{ getCurrentPlanStorage() }} Storage
                      </div>
                    </VCardText>
                  </VCard>

                  <!-- Upgrade Arrow -->
                  <div class="text-center mb-2">
                    <div class="d-flex align-center justify-center">
                      <VIcon icon="mdi-arrow-down" size="20" class="text-success me-1" />
                      <span class="text-body-2 font-weight-medium text-success">Upgrade</span>
                    </div>
                  </div>

                  <!-- New Plan Card -->
                  <VCard variant="outlined" class="mb-2" style="border-color: rgb(var(--v-theme-success));">
                    <VCardText class="pa-3">
                      <div class="d-flex align-center mb-2">
                        <VIcon icon="mdi-star" size="16" class="me-2 text-success" />
                        <span class="text-body-2 font-weight-medium text-success">New Plan</span>
                      </div>
                      <div class="d-flex justify-space-between align-center mb-1">
                        <span class="text-body-1 font-weight-bold">{{ getDisplayPlanName(getNewPlanName()) }}</span>
                        <VChip color="success" variant="flat" size="small">
                          ${{ getPlanPrice() }}/mo
                        </VChip>
                      </div>
                      <div class="text-body-2 text-medium-emphasis">
                        {{ getStorageDisplay() }} Storage
                      </div>
                    </VCardText>
                  </VCard>
                </div>

                <!-- Regular Plan Details for Renew/New -->
                <div v-else class="plan-details">
                  <div class="d-flex justify-space-between align-center mb-3">
                    <span>Plan:</span>
                    <VChip color="primary" variant="flat" size="small">
                      {{ getDisplayPlanName(selectedPlan.plan_name) }}
                    </VChip>
                  </div>
                  <div class="d-flex justify-space-between align-center mb-3">
                    <span>Storage:</span>
                    <VChip color="success" variant="tonal" size="small">
                      {{ getStorageDisplay() }}
                    </VChip>
                  </div>
                  <div class="d-flex justify-space-between align-center mb-3">
                    <span>Duration:</span>
                    <VChip color="info" variant="tonal" size="small">
                      1 Month
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
                      Renewing your current plan
                    </VChip>
                    <VChip
                      v-else-if="props.actionType === 'upgrade'"
                      color="secondary"
                      variant="flat"
                      size="small"
                      class="action-chip"
                    >
                      <VIcon icon="mdi-arrow-up" size="14" class="me-1" />
                      Upgrading to a higher plan
                    </VChip>
                    <VChip
                      v-else
                      color="success"
                      variant="flat"
                      size="small"
                      class="action-chip"
                    >
                      <VIcon icon="mdi-plus" size="14" class="me-1" />
                      New subscription
                    </VChip>
                </div>

                <div class="d-flex justify-space-between">
                    <span class="text-h6">Total:</span>
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
              Payment Method
            </VCardTitle>
            <VCardText>
              <!-- Payment Method Tabs -->
              <VTabs v-model="activePaymentMethod" color="primary" class="mb-4">
                <VTab value="fluxpay">
                  <VIcon icon="mdi-wallet" class="me-2" />
                  Flux Pay
                </VTab>
                <VTab value="cryptocom">
                  <VIcon icon="mdi-credit-card-multiple" class="me-2" />
                  Crypto.com
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
                              Calculating FLUX...
                            </VChip>
                          </div>

                          <!-- Subscription Dates for Renewals/Upgrades -->
                          <div v-if="props.actionType === 'renew' || props.actionType === 'upgrade'" class="subscription-dates mb-3">
                            <VCard elevation="12" class="pa-3" style="box-shadow: 0 12px 24px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1); border: 1px solid rgba(var(--v-theme-success), 0.3); background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.05));">
                              <div class="d-flex align-center justify-space-between">
                                <!-- Current Subscription -->
                                <div class="flex-grow-1 text-center">
                                  <div class="d-flex justify-center mb-1" style="align-items: center; height: 1.2em;">
                                    <VIcon icon="mdi-calendar-clock" size="16" class="text-info" style="display: flex; align-items: center; margin-right: 6px;" />
                                    <span class="text-caption font-weight-medium text-info" style="display: flex; align-items: center;">Current ends:</span>
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
                                    <VIcon icon="mdi-calendar-plus" size="16" class="text-success" style="display: flex; align-items: center; margin-right: 6px;" />
                                    <span class="text-caption font-weight-medium text-success" style="display: flex; align-items: center;">
                                      {{ props.actionType === 'renew' ? 'Renewal' : 'Upgrade' }} ends:
                                    </span>
                                  </div>
                                  <div class="text-body-2 font-weight-medium">{{ formatEndDate(getEndDate()) }}</div>
                                </div>
                              </div>
                            </VCard>
                          </div>

                          <!-- Payment Address (when available) -->
                          <div v-if="fluxPayment && fluxPayment.paymentAddr" class="mb-4">
                            <VCard variant="outlined" class="pa-3">
                              <div class="text-body-2 font-weight-medium mb-2">Payment Address:</div>
                              <code class="text-caption text-primary">{{ fluxPayment.paymentAddr }}</code>
                              <VBtn
                                size="x-small"
                                variant="text"
                                icon="mdi-content-copy"
                                @click="copyToClipboard(fluxPayment.paymentAddr)"
                                class="ml-2"
                              />
                            </VCard>
                          </div>


                        </div>

                        <!-- Payment Actions -->
                        <div class="d-flex flex-column gap-3">
                          <VBtn
                            v-if="!fluxPaymentProcessing"
                            color="primary"
                            size="large"
                            block
                            :loading="initializingFluxPayment"
                            @click="initializeFluxPayment"
                          >
                            <VIcon icon="mdi-wallet" class="me-2" />
                            Open ZelCore
                          </VBtn>

                          <VBtn
                            v-else
                            color="success"
                            size="large"
                            block
                            loading
                          >
                            <VIcon icon="mdi-clock-outline" class="me-2" />
                            Pending Payment
                          </VBtn>

                          <VBtn
                            v-if="fluxPaymentProcessing"
                            variant="outlined"
                            color="error"
                            size="large"
                            block
                            @click="cancelFluxPayment"
                          >
                            Cancel
                          </VBtn>
                        </div>

                        <!-- Subscription Note -->
                        <div class="text-caption text-medium-emphasis mt-4 text-center">
                          *FLUX price is estimated and will be finalized in ZelCore
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
                            Next Automatic Subscription:<br />{{ formatEndDate(getEndDate()) }}
                          </div>
                        </div>

                        <div class="d-flex flex-column gap-3">
                          <VBtn
                            v-if="!cryptoPaymentProcessing"
                            color="primary"
                            size="large"
                            block
                            :loading="initializingCryptoPayment"
                            @click="initializeCryptoComPayment"
                          >
                            <VIcon icon="mdi-credit-card" class="me-2" />
                            Generate Subscription
                          </VBtn>

                          <VBtn
                            v-if="cryptoPaymentProcessing"
                            variant="outlined"
                            color="warning"
                            size="large"
                            block
                          >
                            <VIcon icon="mdi-clock-outline" class="me-2" />
                            Pending Payment
                          </VBtn>

                          <VBtn
                            v-if="cryptoPaymentProcessing"
                            variant="outlined"
                            color="error"
                            size="large"
                            block
                            @click="cancelCryptoPayment"
                          >
                            Cancel
                          </VBtn>

                        </div>

                        <!-- Subscription Note -->
                        <div class="text-caption text-medium-emphasis mt-4">
                          Subscriptions will be charged monthly
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
import { ref, computed, onMounted, watch } from 'vue'
import { useFluxStore } from '@/stores/flux'
import { useSnackbar } from '@/composables/useSnackbar'
import axios from 'axios'
import qs from 'qs'

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

  // Hide any active payment-related snackbars
  hideSnackbar()
  console.log('🧹 Cleared payment-related snackbar notifications')
}

// Expose the cleanup method
defineExpose({
  cleanupPaymentMonitoring
})

// Composables
const fluxStore = useFluxStore()
const { showSnackbar, hideSnackbar } = useSnackbar()

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
  if (props.actionType !== 'upgrade') {
    return // Only needed for upgrades
  }

  try {
    console.log('🔍 Loading current subscription for upgrade comparison')

    const auth = await getAuth()
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

    console.log('📋 Fetching current subscription:', payload)

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

    // For upgrades, load current subscription data first
    await loadCurrentSubscription()

    console.log('Loading plan details for planId:', props.planId)
    console.log('Gateway:', props.gateway)

    // Check authentication
    if (!isLoggedIn.value) {
      showAlert('Please login to continue with your purchase')
      emit('close')

      return
    }

    // Log auth details for debugging
    const authCheck = getAuthFromStorage()
    console.log('Auth check - zelid:', authCheck.zelid)
    console.log('Auth check - has signature:', !!authCheck.signature)
    console.log('Auth check - loginPhrase:', authCheck.loginPhrase)

    // For FluxDrive plans, we still need to call the API to get price_id
    // But we can use predefined display data
    const fluxDriveDisplayData = {
      'starter': {
        plan_name: 'starter',
        price: 0.50,
        storage: 10737418240, // 10GB in bytes
        storage_gb: 10,
        period: 'month',
        cycle: 'monthly'
      },
      'standard': {
        plan_name: 'standard',
        price: 2.50,
        storage: 53687091200, // 50GB in bytes
        storage_gb: 50,
        period: 'month',
        cycle: 'monthly'
      },
      'pro': {
        plan_name: 'pro',
        price: 5.00,
        storage: 107374182400, // 100GB in bytes
        storage_gb: 100,
        period: 'month',
        cycle: 'monthly'
      }
    }

    const auth = getAuthFromStorage()
    if (!auth.zelid || !auth.signature || !auth.loginPhrase) {
      showAlert('Invalid authentication data')
      emit('close')

      return
    }

    // For FluxDrive plans, use display data but still call API for price_id
    if (fluxDriveDisplayData[props.planId]) {
      selectedPlan.value = fluxDriveDisplayData[props.planId]

      // Calculate estimated FLUX amount for FluxDrive plans
      estimatedFluxAmount.value = await getFluxPriceForPlan()
      console.log('Estimated FLUX amount:', estimatedFluxAmount.value)
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
    console.log('API payload being sent (READ):', apiPayload)

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
          sub_id: apiPlan.sub_id       // Get sub_id if available
        }
        console.log('Merged FluxDrive plan with API price_id:', selectedPlan.value.price_id)
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
      showAlert('Plan not found or invalid response from server')
    }
  } catch (error) {
    console.error('Error loading plan:', error)
    showAlert('Failed to load plan details. Please try again.')
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
      loginPhrase: auth.loginPhrase || 'FluxDrive Subscription',
    }
  } catch (error) {
    console.error('Failed to parse zelidauth:', error)
    
    return { zelid: null, signature: null, loginPhrase: null }
  }
}

const initializeFluxPayment = async () => {
  try {
    initializingFluxPayment.value = true
    alertMessage.value = ''

    const auth = getAuthFromStorage()
    if (!auth.zelid || !auth.signature || !auth.loginPhrase) {
      showAlert('Authentication required. Please login again.')
      
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
    console.log('Final payload:', paymentPayload)

    console.log('=== FLUXPAY PAYMENT INITIALIZATION ===')
    console.log('Plan ID:', props.planId)
    console.log('Selected plan data:', selectedPlan.value)
    console.log('Payment payload:', paymentPayload)

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

      // Open ZelCore wallet like FluxCloud does
      const zelCoreAmount = parseFloat(estimatedFluxAmount.value).toFixed(2)
      const zelCoreMessage = `FLUXDRIVE${result.sub_id}`
      const zelCoreUrl = `zel:?action=pay&coin=flux&address=${paymentPayload.payment_addr}&amount=${zelCoreAmount}&message=${zelCoreMessage}`

      console.log('Opening ZelCore with URL:', zelCoreUrl)

      // Try to open ZelCore
      try {
        window.location.href = zelCoreUrl
      } catch (error) {
        console.log('Direct URL failed, trying window.open')
        window.open(zelCoreUrl, '_self')
      }

      // Set payment processing state and start monitoring
      fluxPaymentProcessing.value = true
      showSnackbar('Opening ZelCore wallet for payment...', 'info', 8000)

      // Start monitoring payment status
      monitorPayment(null, result.sub_id, paymentPayload.payment_addr, 'flux')
    } else {
      showAlert(result.error || 'Failed to initialize payment')
    }
  } catch (error) {
    console.error('Error initializing payment:', error)
    showAlert('Failed to initialize payment. Please try again.')
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
      showAlert('Authentication required. Please login again.')
      
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
    console.log('Payment payload:', paymentPayload)

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
        showAlert('Redirected to Crypto.com for payment. Complete the payment and return here.', 'info')
        cryptoPaymentProcessing.value = true

        // Start monitoring for Crypto.com payment as well
        monitorPayment(result.payment_id, result.sub_id, result.payment_addr, 'crypto')
      } else {
        console.error('❌ No checkout_url or subscription_url in successful response!')
        console.error('This means the backend returned success=true but no payment URL')
        showAlert('Payment was initialized but no checkout URL received. Please contact support.', 'warning')
      }
    } else {
      // Provide more helpful error messages based on common issues
      let errorMessage = result.error || 'Failed to initialize Crypto.com payment'

      if (response.status === 500) {
        errorMessage += '. Server error - please contact support.'
      } else if (response.status === 404) {
        errorMessage += '. Payment service not found - please contact support.'
      } else if (result.error && result.error.includes('environment') || result.error && result.error.includes('config')) {
        errorMessage += '. Payment service not properly configured - please contact support.'
      }

      showAlert(errorMessage)
    }
  } catch (error) {
    console.error('Error initializing Crypto.com payment:', error)
    showAlert('Failed to initialize Crypto.com payment. Please try again.')
  } finally {
    initializingCryptoPayment.value = false
  }
}

const monitorPayment = async (paymentId, subId, paymentAddr, paymentType = 'flux') => {
  // Monitor payment completion by checking subscription status
  console.log('🔍 PAYMENT MONITORING STARTED')
  console.log('  - paymentId:', paymentId)
  console.log('  - subId:', subId)
  console.log('  - paymentAddr:', paymentAddr)
  console.log('  - paymentType:', paymentType)
  console.log('  - actionType:', props.actionType)
  console.log('  - Stack trace:', new Error().stack)

  // Validate that we have proper identifiers to monitor
  if (!paymentId && !subId) {
    console.error('❌ CRITICAL: Payment monitoring started without payment ID or subscription ID!')
    console.error('This should not happen - monitoring requires valid payment identifiers')
    console.error('Preventing false positive payment confirmation')
    return // Exit without starting monitoring
  }

  // Store initial subscription state to detect new payments
  let initialSubscriptionState = null

  // For renewals and upgrades, capture initial subscription state for comparison
  if (props.actionType === 'renew' || props.actionType === 'upgrade') {
    try {
      const auth = getAuthFromStorage()
      const initialPayload = {
        zelid: auth.zelid || fluxStore.zelid,
        signature: auth.signature,
        loginPhrase: auth.loginPhrase,
      }

      console.log('📸 Capturing initial storage state for renewal monitoring...')
      console.log('📸 Initial payload:', { zelid: initialPayload.zelid })

      const initialResponse = await fetch('https://jetpackbridge.runonflux.io/api/v1/ipfs/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(initialPayload),
      })

      console.log('📸 Initial response status:', initialResponse.status)

      const initialResult = await initialResponse.json()
      console.log('📸 Initial storage state:', initialResult)

      if (initialResult.active !== undefined) {
        initialSubscriptionState = initialResult
        console.log('📸 Initial storage state captured - Active:', initialResult.active, 'Capacity:', initialResult.capacity)
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

        console.log('Checking Crypto.com payment status with payload:', checkPayload)

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
          clearInterval(paymentMonitoringInterval)
          clearTimeout(paymentMonitoringTimeout)
          paymentMonitoringInterval = null
          paymentMonitoringTimeout = null
          cryptoPaymentProcessing.value = false
          showSnackbar('Payment confirmed! Your subscription is now active.', 'success', 8000)
          emit('success')
        } else if (result.error) {
          console.warn('Payment check error:', result.error)
        }
      } else if (subId) {
        // For FluxPay payments with sub_id - check specific subscription status
        const subPayload = {
          action: 'READ',
          sub_id: subId,
          zelid: auth.zelid || fluxStore.zelid,
          signature: auth.signature,
          loginPhrase: auth.loginPhrase,
        }

        console.log('Checking subscription status via storage endpoint (FluxCloud method)')
        console.log('Payload:', { zelid: auth.zelid || fluxStore.zelid })

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
        console.log('Storage endpoint result:', result)
        console.log('Subscription active:', result.active)

        // Check if user now has active subscription (payment completed)
        if (result.active === true) {
          console.log('✅ Subscription is now active - payment completed!')

          // Compare with initial state for renewals and upgrades
          if ((props.actionType === 'renew' || props.actionType === 'upgrade') && initialSubscriptionState) {
            // For renewals and upgrades, check if storage capacity changed
            const capacityChanged = result.capacity !== initialSubscriptionState.capacity
            const hasIncreasedCapacity = result.capacity > (initialSubscriptionState.capacity || 10737418240) // Default 10GB

            if (capacityChanged || hasIncreasedCapacity) {
              console.log(`✅ ${props.actionType === 'upgrade' ? 'Upgrade' : 'Renewal'} detected - storage capacity changed!`)
              console.log('Previous capacity:', initialSubscriptionState.capacity)
              console.log('New capacity:', result.capacity)
            }
          }

          clearInterval(paymentMonitoringInterval)
          clearTimeout(paymentMonitoringTimeout)
          paymentMonitoringInterval = null
          paymentMonitoringTimeout = null
          fluxPaymentProcessing.value = false

          const message = props.actionType === 'renew'
            ? 'Payment confirmed! Your subscription has been renewed.'
            : props.actionType === 'upgrade'
            ? 'Payment confirmed! Your subscription has been upgraded.'
            : 'Payment confirmed! Your subscription is now active.'

          showSnackbar(message, 'success', 8000)
          emit('success')
        } else if (result.error) {
          console.log('Storage check error:', result.error)
        } else {
          console.log('⏳ Subscription not yet active - continuing to monitor...', result)
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
  }, 120000)

  // Stop monitoring after 10 minutes
  paymentMonitoringTimeout = setTimeout(() => {
    clearInterval(paymentMonitoringInterval)
    paymentMonitoringInterval = null
    paymentMonitoringTimeout = null

    if (paymentType === 'crypto' && cryptoPaymentProcessing.value) {
      cryptoPaymentProcessing.value = false
      showAlert('Crypto.com payment monitoring timeout. Please check your subscription status manually.', 'warning')
    } else if (paymentType === 'flux' && fluxPaymentProcessing.value) {
      fluxPaymentProcessing.value = false
      showAlert('FluxPay payment monitoring timeout. Please check your subscription status manually.', 'warning')
    }
  }, 600000)
}

const cancelFluxPayment = () => {
  console.log('🛑 Cancelling FluxPay payment and stopping monitoring')

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
  fluxPayment.value = null
  showAlert('FluxPay payment cancelled', 'info')
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
  showAlert('Crypto.com payment cancelled', 'info')
}

const formatEndDate = endTime => {
  if (!endTime) return 'N/A'
  const date = new Date(endTime)

  // Always show both date and time
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const getCurrentSubscriptionEndDate = () => {
  // FluxCloud method: Use period_end for current subscription end date
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
  // For upgrades, use the separate currentSubscriptionData
  if (props.actionType === 'upgrade' && currentSubscriptionData.value) {
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

  // If we can't find current plan, for upgrades we can show a generic message
  if (props.actionType === 'upgrade') {
    console.log('🏷️ Using fallback for upgrade - Current Subscription')
    return 'Current Subscription'
  }

  console.log('🏷️ Using fallback - Current Plan')
  return 'Current Plan'
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

  // For upgrades, show a generic message instead of N/A
  if (props.actionType === 'upgrade') {
    return 'Current Storage'
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

  // For upgrades, show a placeholder instead of 0.00
  if (props.actionType === 'upgrade') {
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

  // Map 'pro' to 'Elite' for display
  const displayNameMap = {
    'starter': 'Starter',
    'standard': 'Standard',
    'pro': 'Elite',  // Show 'Elite' when API returns 'pro'
    'enterprise': 'Flux Drive Pro',
    'flux drive pro': 'Flux Drive Pro',
  }

  const lowerPlanName = planName.toLowerCase()
  
  return displayNameMap[lowerPlanName] || planName
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

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    showSnackbar('Address copied to clipboard', 'success', 8000)
  } catch (err) {
    showSnackbar('Failed to copy address', 'error', 8000)
  }
}

// Watch for plan ID changes
watch(() => props.planId, newPlanId => {
  if (newPlanId) {
    loadPlanDetails()
  }
}, { immediate: true })

// Load plan details on mount
onMounted(() => {
  if (props.planId) {
    loadPlanDetails()
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
</style>