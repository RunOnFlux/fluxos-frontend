<template>
  <div>
    <!-- Debug info (remove after debugging) -->
    <div v-if="$route.query.debug" class="ma-4 pa-4 bg-grey-lighten-4 rounded">
      <div>🔍 Debug Info:</div>
      <div>isLoggedIn: {{ isLoggedIn }}</div>
      <div>hasActiveSubscription: {{ hasActiveSubscription }}</div>
      <div>showLogin: {{ showLogin }}</div>
    </div>

    <!-- Loading state while checking subscription -->
    <div v-if="!subscriptionChecked" class="d-flex justify-center align-center" style="min-height: 400px;">
      <VProgressCircular
        indeterminate
        color="primary"
        :size="60"
        :width="4"
      />
    </div>

    <!-- Show pricing plans for non-subscribers -->
    <PricingPlans
      v-else-if="!hasActiveSubscription"
      @select-plan="(planId, actionType) => handlePlanSelection(planId, actionType)"
    />

    <!-- Show actual FluxDrive interface for subscribers -->
    <div v-else>
      <FileManager
        ref="fileManagerRef"
        @select-plan="handlePlanSelection"
      />
      <StorageInfo />
    </div>

    <!-- Login Dialog -->
    <VDialog
      v-model="showLogin"
      :max-width="$vuetify.display.xs ? '95vw' : '900'"
      :width="$vuetify.display.xs ? '95vw' : '90vw'"
      :fullscreen="$vuetify.display.xs"
      persistent
      scrollable
    >
      <VCard>
        <VCardText class="pt-6">
          <Login
            :hide-manual-login="true"
            :xdao-open="0"
            @login-success="handleLoginSuccess"
          />
        </VCardText>
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn
            variant="outlined"
            color="error"
            @click="showLogin = false"
          >
            Cancel
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
    <!-- Checkout Dialog -->
    <VDialog
      v-model="showCheckout"
      :max-width="$vuetify.display.xs ? '95vw' : '1200'"
      :width="$vuetify.display.xs ? '95vw' : '90vw'"
      :fullscreen="$vuetify.display.xs"
      persistent
      scrollable
    >
      <VCard>
        <VCardTitle class="d-flex align-center" :class="(selectedActionType === 'upgrade' || selectedActionType === 'renew') ? 'pa-2' : 'pa-6'" :style="(selectedActionType === 'upgrade' || selectedActionType === 'renew') ? 'background-color: rgb(var(--v-theme-primary)); color: white;' : ''">
          <h3 class="text-h5" :style="(selectedActionType === 'upgrade' || selectedActionType === 'renew') ? 'color: white;' : ''">
            FluxDrive {{ selectedActionType === 'renew' ? 'Renewal' : selectedActionType === 'upgrade' ? 'Upgrade' : 'Checkout' }}
          </h3>
          <VSpacer />
          <VBtn
            icon="mdi-close"
            variant="text"
            :color="(selectedActionType === 'upgrade' || selectedActionType === 'renew') ? 'white' : ''"
            @click="closeCheckoutDialog"
          />
        </VCardTitle>
        <VCardText :class="(selectedActionType === 'upgrade' || selectedActionType === 'renew') ? 'pa-6 pt-4' : 'pa-6 pt-0'">
          <CheckoutContent
            ref="checkoutContentRef"
            :plan-id="selectedCheckoutPlan"
            :action-type="selectedActionType"
            :gateway="'fluxpay'"
            @payment-success="handlePaymentSuccess"
            @payment-error="handlePaymentError"
          />
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useFluxDrive } from '@/composables/useFluxDrive'
import Login from '@/@core/components/Login.vue'
import PricingPlans from '@/components/FluxDrive/PricingPlans.vue'
import FileManager from '@/components/FluxDrive/FileManager.vue'
import StorageInfo from '@/components/FluxDrive/StorageInfo.vue'
import CheckoutContent from '@/components/CheckoutContent.vue'

// Use the composable
const {
  isLoggedIn,
  hasActiveSubscription,
  subscriptionChecked,
  showLogin,
  loadFiles,
  selectPlan,
  checkSubscriptionStatus,
  initializeFluxDrive,
  handlePostLogin,
  getPlanStatus,
  renewSubscription,
  upgradeSubscription
} = useFluxDrive()

// Import flux store to refresh user data after login
import { useFluxStore } from '@/stores/flux'
const fluxStore = useFluxStore()

// Checkout dialog state
const showCheckout = ref(false)
const selectedCheckoutPlan = ref('')
const selectedActionType = ref('')

// FileManager reference
const fileManagerRef = ref(null)

// CheckoutContent reference
const checkoutContentRef = ref(null)

// Handle plan selection from PricingPlans component
const handlePlanSelection = async (planId, actionType = null) => {
  console.log('🎯 Plan selected:', planId, 'Action:', actionType)

  // Handle signin action - just show login dialog without saving plan
  if (actionType === 'signin') {
    console.log('🔐 Sign in action - showing login dialog without plan selection')
    showLogin.value = true
    return
  }

  console.log('🔍 Current subscription status:', {
    isLoggedIn: isLoggedIn.value,
    hasActiveSubscription: hasActiveSubscription.value,
    planStatus: planId ? getPlanStatus(planId) : 'N/A'
  })

  // For enterprise plan, redirect to support
  if (planId === 'enterprise') {
    const supportUrl = 'https://support.runonflux.io'
    window.open(supportUrl, '_blank', 'noopener,noreferrer')
    return
  }

  // Determine action type if not provided
  if (!actionType && hasActiveSubscription.value) {
    const planStatus = getPlanStatus(planId)
    console.log('🔍 Plan status for', planId, ':', planStatus)
    if (planStatus === 'current') {
      actionType = 'renew'
    } else if (planStatus === 'upgrade') {
      actionType = 'upgrade'
    }
  } else if (!actionType) {
    actionType = 'signup'
  }

  console.log('✅ Final determined action type:', actionType)

  // Check if user is logged in
  const zelidauth = localStorage.getItem('zelidauth')
  const zelid = (() => {
    if (zelidauth) {
      try {
        const authData = zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)
        return authData.zelid || fluxStore.zelid
      } catch {
        return fluxStore.zelid
      }
    }
    return fluxStore.zelid
  })()

  if (!zelidauth || !zelid) {
    // Show login dialog if not logged in
    console.log('🔐 User not logged in - saving plan selection for after login:', planId)
    showLogin.value = true
    selectedCheckoutPlan.value = planId // Save plan for after login
    return
  }

  // Handle renewal and upgrade actions directly via API
  if (actionType === 'renew') {
    try {
      console.log('🔄 Processing renewal for plan:', planId)
      const result = await renewSubscription(planId)

      console.log('🔍 Renewal result analysis:')
      console.log('  - Has checkout_url:', !!result.checkout_url)
      console.log('  - Has new_plan:', !!result.new_plan)
      console.log('  - Has subscription:', !!result.subscription)
      console.log('  - Result keys:', Object.keys(result))

      if (result.checkout_url || result.new_plan) {
        console.log('💳 Payment required - opening checkout dialog')
        selectedCheckoutPlan.value = planId
        selectedActionType.value = actionType
        showCheckout.value = true
      } else if (result.subscription) {
        console.log('✅ Renewal completed successfully')
        await checkSubscriptionStatus()
        // Show success message to user
        alert('Subscription renewed successfully!')
      } else {
        console.log('⚠️ Unexpected response - opening checkout as fallback')
        selectedCheckoutPlan.value = planId
        selectedActionType.value = actionType
        showCheckout.value = true
      }

      // Clear renewal state in FileManager
      if (fileManagerRef.value?.clearRenewalState) {
        fileManagerRef.value.clearRenewalState()
      }
    } catch (error) {
      console.error('❌ Renewal failed:', error)
      alert('Renewal failed: ' + error.message)
      // Fallback to checkout dialog
      selectedCheckoutPlan.value = planId
      selectedActionType.value = actionType
      showCheckout.value = true

      // Clear renewal state in FileManager
      if (fileManagerRef.value?.clearRenewalState) {
        fileManagerRef.value.clearRenewalState()
      }
    }
    return
  }

  if (actionType === 'upgrade') {
    try {
      console.log('🔄 Processing upgrade for plan:', planId)
      const result = await upgradeSubscription(planId)

      if (result.checkout_url || result.new_plan) {
        // Open checkout dialog with the result
        selectedCheckoutPlan.value = planId
        selectedActionType.value = actionType
        showCheckout.value = true
      } else {
        console.log('✅ Upgrade completed successfully')
        await checkSubscriptionStatus()
      }

      // Clear renewal state in FileManager
      if (fileManagerRef.value?.clearRenewalState) {
        fileManagerRef.value.clearRenewalState()
      }
    } catch (error) {
      console.error('❌ Upgrade failed:', error)
      // Fallback to checkout dialog
      selectedCheckoutPlan.value = planId
      selectedActionType.value = actionType
      showCheckout.value = true

      // Clear renewal state in FileManager
      if (fileManagerRef.value?.clearRenewalState) {
        fileManagerRef.value.clearRenewalState()
      }
    }
    return
  }

  // For signup and signin actions, open checkout dialog
  selectedCheckoutPlan.value = planId
  selectedActionType.value = actionType
  showCheckout.value = true
}

// Handle successful login
const handleLoginSuccess = async () => {
  console.log('Login successful - processing...')

  // Close the login dialog immediately
  showLogin.value = false

  // Use the composable's post-login handler
  await handlePostLogin()

  // If there was a pending plan selection, open checkout
  if (selectedCheckoutPlan.value) {
    console.log('🎯 Found pending plan selection:', selectedCheckoutPlan.value)
    // Determine action type for the selected plan after login
    if (!selectedActionType.value) {
      if (hasActiveSubscription.value) {
        const planStatus = getPlanStatus(selectedCheckoutPlan.value)
        selectedActionType.value = planStatus === 'current' ? 'renew' : 'upgrade'
      } else {
        selectedActionType.value = 'signup'
      }
    }
    console.log('💳 Opening checkout for pending plan:', selectedCheckoutPlan.value, 'Action:', selectedActionType.value)
    showCheckout.value = true
  } else {
    // No pending plan selection - user will see appropriate interface based on subscription status
    // The reactive template will automatically show:
    // - PricingPlans component if !hasActiveSubscription
    // - FileManager + StorageInfo if hasActiveSubscription
    console.log('✅ Login complete - showing appropriate interface based on subscription status')
    console.log('📊 hasActiveSubscription:', hasActiveSubscription.value)
    console.log('📊 subscriptionChecked:', subscriptionChecked.value)

    // Clear any pending checkout selections since we're showing the main interface
    selectedCheckoutPlan.value = ''
    selectedActionType.value = ''
  }
}

// Handle payment success
const handlePaymentSuccess = async () => {
  showCheckout.value = false
  selectedCheckoutPlan.value = ''
  selectedActionType.value = ''

  // Clear renewal state in FileManager
  if (fileManagerRef.value?.clearRenewalState) {
    fileManagerRef.value.clearRenewalState()
  }

  // Refresh subscription status
  await checkSubscriptionStatus()

  // Trigger files reload if subscription is now active
  // loadFiles() has internal logic to prevent duplicate calls
  if (hasActiveSubscription.value) {
    await loadFiles()
  }
}

// Handle payment error
const handlePaymentError = (error) => {
  console.error('Payment error:', error)
}

// Handle closing checkout dialog with cleanup
const closeCheckoutDialog = () => {
  console.log('🚪 Closing checkout dialog and cleaning up payment monitoring')

  // Cleanup payment monitoring if component exists
  if (checkoutContentRef.value && checkoutContentRef.value.cleanupPaymentMonitoring) {
    checkoutContentRef.value.cleanupPaymentMonitoring()
  }

  showCheckout.value = false
}

// Watch subscription status changes
watch(hasActiveSubscription, (newValue, oldValue) => {
  console.log('🔄 Subscription status changed:', { oldValue, newValue })
  if (newValue) {
    console.log('✅ Subscription became active - should show file manager')
  } else {
    console.log('❌ Subscription became inactive - should show pricing plans')
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  console.log('🔄 FluxDrive page mounted')
  console.log('🔍 Initial hasActiveSubscription value:', hasActiveSubscription.value)
  console.log('🔍 Initial isLoggedIn value:', isLoggedIn.value)

  // Clear any stale checkout selections from previous sessions
  // These should only be set when user actively selects a plan
  selectedCheckoutPlan.value = ''
  selectedActionType.value = ''
  showCheckout.value = false
  console.log('🧹 Cleared any stale checkout selections')

  // Initialize FluxDrive and check subscription status
  await initializeFluxDrive()

  console.log('🔍 After initialization hasActiveSubscription value:', hasActiveSubscription.value)

  // FileManager component will handle loading files when it mounts
  if (hasActiveSubscription.value) {
    console.log('✅ Active subscription detected - FileManager will load files')
  } else {
    console.log('📋 Showing pricing plans - no active subscription')
  }
})
</script>

<style scoped>
@import '@/assets/styles/flux-drive.scss';
</style>