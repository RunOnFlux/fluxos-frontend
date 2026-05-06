<template>
  <div>
    <VContainer class="py-8">
      <!-- Header Section -->
      <div class="text-center mb-8">
        <h1 class="text-h3 font-weight-bold mb-4">
          <span class="text-primary">{{ t('pages.checkout.header.title') }}</span> {{ t('pages.checkout.title') }}
        </h1>
        <p class="text-h6 text-medium-emphasis">
          {{ t('pages.checkout.header.subtitle') }}
        </p>
      </div>

      <!-- Main Checkout Content -->
      <VRow>
        <!-- Plan Summary Sidebar -->
        <VCol cols="12" md="4">
          <VCard class="h-100">
            <VCardTitle class="text-h5 pa-6 pb-4">
              {{ t('pages.checkout.orderSummary.title') }}
            </VCardTitle>

            <VCardText class="pa-6 pt-0">
              <!-- Selected Plan -->
              <div v-if="selectedPlan" class="mb-6">
                <div class="d-flex align-center mb-4">
                  <VAvatar
                    size="60"
                    color="primary"
                    variant="tonal"
                    class="me-4"
                  >
                    <VIcon
                      icon="mdi-cloud-upload-outline"
                      size="30"
                    />
                  </VAvatar>
                  <div>
                    <h3 class="text-h5">{{ selectedPlan.name }}</h3>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      {{ selectedPlan.storage }} {{ t('common.labels.storage') }}
                    </p>
                  </div>
                </div>

                <VDivider class="mb-4" />

                <div class="d-flex justify-space-between mb-2">
                  <span>{{ t('pages.checkout.orderSummary.plan') }}</span>
                  <span class="font-weight-medium">{{ selectedPlan.name }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span>{{ t('pages.checkout.orderSummary.storage') }}</span>
                  <span>{{ selectedPlan.storage }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span>{{ t('pages.checkout.orderSummary.billing') }}</span>
                  <span>{{ t('pages.checkout.orderSummary.monthly') }}</span>
                </div>

                <VDivider class="my-4" />

                <div class="d-flex justify-space-between text-h6 font-weight-bold">
                  <span>{{ t('pages.checkout.orderSummary.total') }}</span>
                  <span class="text-primary">{{ selectedPlan.pricePerMonth }}</span>
                </div>
              </div>

              <!-- Current Subscription (if exists) -->
              <div v-if="currentSubscription && currentSubscription.plan_name" class="mt-6">
                <VDivider class="mb-4" />
                <h4 class="text-h6 mb-3">{{ t('pages.checkout.orderSummary.currentPlan') }}</h4>
                <div class="d-flex justify-space-between mb-2">
                  <span>{{ t('pages.checkout.orderSummary.plan') }}</span>
                  <span>{{ currentSubscription.plan_name }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span>{{ t('pages.checkout.orderSummary.storage') }}</span>
                  <span>{{ currentSubscription.storage }} {{ t('common.units.gb') }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span>{{ t('pages.checkout.orderSummary.status') }}</span>
                  <VChip
                    :color="currentSubscription.payment_status === 'active' ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ currentSubscription.payment_status }}
                  </VChip>
                </div>
              </div>

              <!-- Loading state (only show if no plan is selected yet) -->
              <div v-if="!selectedPlan && loading" class="text-center py-8">
                <VProgressCircular
                  indeterminate
                  size="40"
                  width="3"
                  color="primary"
                />
                <p class="text-body-2 mt-3">{{ t('pages.checkout.loading.planDetails') }}</p>
              </div>

              <!-- No plan data (only show if not loading and no plan) -->
              <div v-else-if="!selectedPlan && !loading" class="text-center py-8">
                <VIcon icon="mdi-alert-circle-outline" size="48" class="mb-3 text-warning" />
                <p class="text-body-1">{{ t('pages.checkout.loading.unableToLoad') }}</p>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Payment Methods -->
        <VCol cols="12" md="8">
          <VCard>
            <VCardTitle class="text-h5 pa-6 pb-4">
              {{ t('pages.checkout.paymentMethod.title') }}
            </VCardTitle>

            <VCardText class="pa-6 pt-0">
              <!-- Alert Messages -->
              <VAlert
                v-if="alertMessage"
                :type="alertType"
                class="mb-6"
                dismissible
                @click:close="clearAlert"
              >
                {{ alertMessage }}
              </VAlert>

              <!-- Payment Tabs -->
              <VTabs
                v-model="activePaymentMethod"
                class="mb-6"
                color="primary"
                slider-color="primary"
              >
                <VTab value="fluxpay">
                  <VImg
                    :src="$vuetify.theme.current.dark ? '/img/flux_white_logo.png' : '/img/flux-symbol.png'"
                    max-width="20"
                    max-height="20"
                    class="me-2"
                  />
                  {{ t('pages.checkout.paymentMethod.fluxPay') }}
                </VTab>
                <VTab value="cryptocom">
                  <VIcon icon="mdi-credit-card" class="me-2" />
                  {{ t('pages.checkout.paymentMethod.cryptoCom') }}
                </VTab>
              </VTabs>

              <!-- Payment Method Content -->
              <VWindow v-model="activePaymentMethod">
                <!-- Flux Pay Panel -->
                <VWindowItem value="fluxpay">
                  <VCard variant="outlined">
                    <VCardText class="pa-6">
                      <div class="text-center">
                        <VImg
                          src="/img/zelcore-login.jpg"
                          max-width="200"
                          class="mx-auto mb-4 rounded"
                        />

                        <h3 class="text-h5 mb-2">{{ t('pages.checkout.fluxPay.title') }}</h3>
                        <p class="text-body-1 text-medium-emphasis mb-6">
                          {{ t('pages.checkout.fluxPay.subtitle') }}
                        </p>

                        <!-- Payment Details -->
                        <div v-if="fluxPayment" class="mb-6">
                          <VAlert type="info" class="mb-4 text-start">
                            <div class="d-flex justify-space-between">
                              <span>{{ t('pages.checkout.fluxPay.amount') }}</span>
                              <span class="font-weight-bold">{{ fluxPayment.amount }} FLUX</span>
                            </div>
                            <div class="d-flex justify-space-between">
                              <span>{{ t('pages.checkout.fluxPay.usdValue') }}</span>
                              <span>${{ fluxPayment.usdValue }}</span>
                            </div>
                          </VAlert>
                        </div>

                        <!-- Payment Actions -->
                        <div class="d-flex flex-column gap-3">
                          <VBtn
                            v-if="!paymentProcessing"
                            color="primary"
                            size="large"
                            block
                            :loading="initializingPayment"
                            @click="initializeFluxPayment"
                          >
                            <VIcon icon="mdi-wallet" class="me-2" />
                            {{ t('pages.checkout.fluxPay.openWallet') }}
                          </VBtn>

                          <VBtn
                            v-else
                            color="success"
                            size="large"
                            block
                            loading
                          >
                            <VIcon icon="mdi-clock-outline" class="me-2" />
                            {{ t('pages.checkout.fluxPay.waitingForPayment') }}
                          </VBtn>

                          <VBtn
                            v-if="paymentProcessing"
                            variant="outlined"
                            color="error"
                            size="large"
                            block
                            @click="cancelPayment"
                          >
                            {{ t('pages.checkout.fluxPay.cancelPayment') }}
                          </VBtn>
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
                        <VImg
                          src="/img/crypto-com.png"
                          max-width="200"
                          class="mx-auto mb-4"
                        />

                        <h3 class="text-h5 mb-2">{{ t('pages.checkout.cryptoCom.title') }}</h3>
                        <p class="text-body-1 text-medium-emphasis mb-6">
                          {{ t('pages.checkout.cryptoCom.subtitle') }}
                        </p>

                        <VBtn
                          color="primary"
                          size="large"
                          block
                          :loading="initializingPayment"
                          @click="initializeCryptoComPayment"
                        >
                          <VIcon icon="mdi-credit-card" class="me-2" />
                          {{ t('pages.checkout.cryptoCom.continue') }}
                        </VBtn>
                      </div>
                    </VCardText>
                  </VCard>
                </VWindowItem>

              </VWindow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Security Notice -->
      <VCard variant="outlined" class="mt-8">
        <VCardText class="pa-6">
          <div class="d-flex align-center">
            <VIcon icon="mdi-shield-check" color="success" class="me-3" size="24" />
            <div>
              <h4 class="text-h6 mb-1">{{ t('pages.checkout.security.title') }}</h4>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ t('pages.checkout.security.message') }}
              </p>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VContainer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFluxStore } from '@/stores/flux'
import { useSnackbar } from '@/composables/useSnackbar'
import { useSEONoIndex } from '@/composables/useSEO'
import qs from 'qs'

// Prevent indexing of checkout/payment pages (security best practice)
useSEONoIndex()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const fluxStore = useFluxStore()
const { showSnackbar } = useSnackbar()

// Config
const bridgeURL = 'api.fluxdrive.runonflux.io'

// Route params
const gateway = computed(() => route.params.gateway)
const planId = computed(() => route.params.plan)

// State
const selectedPlan = ref(null)
const currentSubscription = ref(null)
const subscriptionData = ref(null)
const loading = ref(true)
const activePaymentMethod = ref('fluxpay')
const initializingPayment = ref(false)
const paymentProcessing = ref(false)
const alertMessage = ref('')
const alertType = ref('info')
const fluxPayment = ref(null)

// Authentication - make sure this matches FluxDrive logic exactly
const isLoggedIn = computed(() => {
  const zelidauth = localStorage.getItem('zelidauth')
  const hasZelid = fluxStore.zelid && fluxStore.zelid.length > 0
  const hasAuth = zelidauth && zelidauth.length > 0

  console.log('isLoggedIn computed - zelidauth:', !!zelidauth)
  console.log('isLoggedIn computed - fluxStore.zelid:', fluxStore.zelid)
  console.log('isLoggedIn computed - result:', !!(zelidauth && hasZelid))

  return !!(zelidauth && hasZelid)
})

// Load subscription data from API
const loadSubscriptionData = async () => {
  if (!isLoggedIn.value) {
    loading.value = false
    
    return
  }

  try {
    const zelidauth = localStorage.getItem('zelidauth')
    if (!zelidauth) {
      showAlert(t('pages.checkout.messages.authenticationRequired'))

      return
    }

    // Parse zelidauth using qs.parse (same as other FluxOS components)
    const auth = qs.parse(zelidauth)
    console.log('LoadSubscriptionData - Parsed auth:', {
      hasZelid: !!auth.zelid,
      zelid: auth.zelid ? auth.zelid.substring(0, 8) + '...' : 'none',
      hasSignature: !!auth.signature,
      hasLoginPhrase: !!auth.loginPhrase,
    })

    if (!auth.zelid || !auth.signature || !auth.loginPhrase) {
      console.error('LoadSubscriptionData - Missing auth fields')
      showAlert(t('pages.checkout.messages.invalidAuthData'))

      return
    }

    const signature = auth.signature
    const loginPhrase = auth.loginPhrase

    console.log('LoadSubscriptionData - Auth fields present:', {
      hasSignature: !!signature,
      hasLoginPhrase: !!loginPhrase,
    })

    const response = await fetch(`https://${bridgeURL}/api/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action: 'READ',
        plan_name: planId.value,
        gateway: gateway.value,
        zelid: fluxStore.zelid,
        signature: signature,
        loginPhrase: loginPhrase,
      }),
    })

    const result = await response.json()
    console.log('Subscription API response:', result)

    if (result.error) {
      console.error('API Error:', result.error)
      showAlert(result.error)
      
      return
    }

    if (result.warning) {
      console.warn('API Warning:', result.warning)
      showAlert(result.warning, 'warning')
      
      return
    }

    subscriptionData.value = result
    currentSubscription.value = result

    // Extract new plan data from API response
    if (result.new_plan) {
      console.log('New plan data:', result.new_plan)
      selectedPlan.value = {
        id: result.new_plan.plan_name,
        name: result.new_plan.plan_name.charAt(0).toUpperCase() + result.new_plan.plan_name.slice(1),
        storage: `${result.new_plan.storage} GB`,
        pricePerMonth: `$${(result.new_plan.price / 100).toFixed(2)}`,
        priceInCents: result.new_plan.price,
        gateway: result.new_plan.gateway,
        gatewayName: result.new_plan.gateway_name || 'Flux Pay',
      }

      // Clear any previous error
      clearAlert()
      console.log('Selected plan set:', selectedPlan.value)
    } else {
      console.warn('No new_plan in response, full response:', result)
      showAlert(t('pages.checkout.messages.planDetailsNotAvailable'))
    }

  } catch (error) {
    console.error('Subscription load error:', error)
    showAlert(`${t('pages.checkout.messages.subscriptionLoadFailed')}: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// Methods
const clearAlert = () => {
  alertMessage.value = ''
  alertType.value = 'info'
}

const showAlert = (message, type = 'error') => {
  alertMessage.value = message
  alertType.value = type
}

const initializeFluxPayment = async () => {
  if (!isLoggedIn.value) {
    showAlert(t('pages.checkout.messages.pleaseLoginFirst'), 'warning')

    return
  }

  initializingPayment.value = true

  try {
    const zelidauth = localStorage.getItem('zelidauth')
    if (!zelidauth) {
      showAlert(t('pages.checkout.messages.authenticationRequired'))

      return
    }

    const auth = qs.parse(zelidauth)
    if (!auth.zelid || !auth.signature || !auth.loginPhrase) {
      showAlert(t('pages.checkout.messages.invalidAuth'))

      return
    }

    const response = await fetch(`https://${bridgeURL}/api/v1/fluxpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action: 'INITIALIZE',
        plan_name: planId.value,
        zelid: fluxStore.zelid,
        signature: auth.signature,
        loginPhrase: auth.loginPhrase,
      }),
    })

    const result = await response.json()

    if (result.success) {
      fluxPayment.value = {
        amount: result.flux_amount,
        usdValue: (selectedPlan.value.priceInCents / 100).toFixed(2),
        paymentId: result.payment_id,
      }
      paymentProcessing.value = true

      // Open Zelcore wallet
      if (result.zelcore_url) {
        window.open(result.zelcore_url, '_blank')
      }

      // Start monitoring payment
      monitorPayment(result.payment_id)
    } else {
      showAlert(result.error || t('pages.checkout.messages.paymentFailed'))
    }
  } catch (error) {
    showAlert(t('pages.checkout.messages.paymentInitFailed'))
    console.error('Payment error:', error)
  } finally {
    initializingPayment.value = false
  }
}

const initializeCryptoComPayment = async () => {
  if (!isLoggedIn.value) {
    showAlert(t('pages.checkout.messages.pleaseLoginFirst'), 'warning')

    return
  }

  initializingPayment.value = true

  try {
    const zelidauth = localStorage.getItem('zelidauth')
    if (!zelidauth) {
      showAlert(t('pages.checkout.messages.authenticationRequired'))

      return
    }

    const auth = qs.parse(zelidauth)
    if (!auth.zelid || !auth.signature || !auth.loginPhrase) {
      showAlert(t('pages.checkout.messages.invalidAuth'))

      return
    }

    const response = await fetch(`https://${bridgeURL}/api/v1/cryptocom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action: 'INITIALIZE',
        plan_name: planId.value,
        zelid: fluxStore.zelid,
        signature: auth.signature,
        loginPhrase: auth.loginPhrase,
      }),
    })

    const result = await response.json()

    if (result.success && result.checkout_url) {
      // Redirect to Crypto.com checkout
      window.location.href = result.checkout_url
    } else {
      showAlert(result.error || t('pages.checkout.messages.cryptoComPaymentFailed'))
    }
  } catch (error) {
    showAlert(t('pages.checkout.messages.cryptoComInitFailed'))
    console.error('Crypto.com error:', error)
  } finally {
    initializingPayment.value = false
  }
}

const monitorPayment = async paymentId => {
  const checkPayment = async () => {
    try {
      const response = await fetch(`https://${bridgeURL}/api/v1/fluxpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'STATUS',
          payment_id: paymentId,
          zelid: fluxStore.zelid,
        }),
      })

      const result = await response.json()

      if (result.status === 'completed') {
        paymentProcessing.value = false
        showSnackbar(t('pages.checkout.messages.paymentSuccessfulRedirecting'), 'success')

        // Refresh user data and redirect to FluxDrive
        await fluxStore.refreshUserData()
        setTimeout(() => {
          router.push('/flux-drive')
        }, 2000)
      } else if (result.status === 'failed') {
        paymentProcessing.value = false
        showAlert(t('pages.checkout.messages.paymentFailedRetry'))
      } else if (paymentProcessing.value) {
        // Continue monitoring
        setTimeout(checkPayment, 3000)
      }
    } catch (error) {
      console.error('Payment status check failed:', error)
      if (paymentProcessing.value) {
        setTimeout(checkPayment, 5000)
      }
    }
  }

  checkPayment()
}

const cancelPayment = () => {
  paymentProcessing.value = false
  fluxPayment.value = null
  clearAlert()
}

// Watch for login state changes
watch(isLoggedIn, newValue => {
  console.log('Checkout - login state changed:', newValue)
  if (newValue) {
    // User logged in - clear warning and load data
    clearAlert()
    loadSubscriptionData()
  } else {
    // User logged out - show warning
    showAlert(t('pages.checkout.messages.pleaseLoginToContinue'), 'warning')
    loading.value = false
  }
})

// Initialize component
onMounted(async () => {
  // Set the payment method from route - only fluxpay and cryptocom are supported
  if (gateway.value && ['fluxpay', 'cryptocom'].includes(gateway.value)) {
    activePaymentMethod.value = gateway.value
  } else {
    // Default to fluxpay if invalid gateway
    activePaymentMethod.value = 'fluxpay'
  }

  // Track payment system selection
  const analytics = useAnalytics()
  analytics.trackPaymentSystemSelected(activePaymentMethod.value, {
    plan: planId.value,
    plan_name: selectedPlan.value?.name,
    price: selectedPlan.value?.pricePerMonth,
  })

  // Check if user is logged in and restore zelid if needed
  const zelidauth = localStorage.getItem('zelidauth')

  if (zelidauth) {
    // Parse the zelidauth to get the zelid
    const auth = qs.parse(zelidauth)

    // If we have auth but fluxStore.zelid is not set, set it
    if (auth.zelid && !fluxStore.zelid) {
      console.log('Restoring zelid from localStorage:', auth.zelid.substring(0, 8) + '...')
      fluxStore.setZelid(auth.zelid)

      // Also set privilege if it's 'none' (user was logged in before)
      if (fluxStore.privilege === 'none') {
        // Set a basic privilege level for logged in users
        fluxStore.setPrivilege('user')
      }
    }
  }

  // Wait a moment for store to update
  await new Promise(resolve => setTimeout(resolve, 100))

  const hasZelid = fluxStore.zelid && fluxStore.zelid.length > 0

  console.log('Checkout - isLoggedIn computed:', isLoggedIn.value)
  console.log('Checkout - fluxStore.zelid:', fluxStore.zelid)
  console.log('Checkout - zelidauth exists:', !!zelidauth)
  console.log('Checkout - hasZelid:', hasZelid)

  // Load data if we have authentication
  if (zelidauth && hasZelid) {
    console.log('Loading subscription data')
    loadSubscriptionData()
  } else if (!zelidauth) {
    showAlert(t('pages.checkout.messages.pleaseLoginToContinue'), 'warning')
    loading.value = false
  } else {
    // We have zelidauth but no zelid - shouldn't happen but handle it
    showAlert(t('pages.checkout.messages.sessionExpired'), 'warning')
    loading.value = false
  }
})

// Track when user manually switches payment method
let initialPaymentMethodSet = false
watch(activePaymentMethod, (newMethod, oldMethod) => {
  // Skip the first watch trigger (from onMounted)
  if (!initialPaymentMethodSet) {
    initialPaymentMethodSet = true
    
    return
  }

  // Only track if user actually changed it (not initial load)
  if (oldMethod && newMethod !== oldMethod) {
    const analytics = useAnalytics()
    analytics.trackPaymentSystemSelected(newMethod, {
      plan: planId.value,
      plan_name: selectedPlan.value?.name,
      price: selectedPlan.value?.pricePerMonth,
      previous_method: oldMethod,
      user_changed: true,
    })
  }
})
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}
</style>