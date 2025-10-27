<template>
  <div>
    <!-- Loading state while checking subscription -->
    <LoadingSpinner
      v-if="!subscriptionChecked"
      icon="mdi-cloud"
      :icon-size="56"
      :title="t('pages.fluxDrive.loading')"
    />

    <!-- Show pricing plans only for users who have never had a subscription -->
    <PricingPlans
      v-else-if="!hasOrHadSubscription"
      @selectPlan="(planId, actionType) => handlePlanSelection(planId, actionType)"
    />

    <!-- Show actual FluxDrive interface for subscribers or users with subscription history -->
    <div v-else>
      <FileManager
        ref="fileManagerRef"
        @selectPlan="handlePlanSelection"
      />
      <StorageInfo />
    </div>


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
        <VCardTitle class="d-flex align-center pa-2" style="background-color: rgb(var(--v-theme-primary)); color: white;">
          <h3 class="text-h5 d-flex align-center" style="color: white;">
            <VIcon
              :icon="selectedActionType === 'renew' ? 'mdi-refresh' : selectedActionType === 'upgrade' ? 'mdi-arrow-up-bold' : selectedActionType === 'downgrade' ? 'mdi-arrow-down-bold' : 'mdi-plus'"
              class="me-2"
              style="color: white;"
            />
            FluxDrive {{ checkoutTitle }}
          </h3>
          <VSpacer />
          <VBtn
            icon="mdi-close"
            variant="text"
            color="white"
            @click="closeCheckoutDialog"
          />
        </VCardTitle>
        <VCardText class="pa-6 pt-4">
          <CheckoutContent
            ref="checkoutContentRef"
            :plan-id="selectedCheckoutPlan"
            :action-type="selectedActionType"
            gateway="fluxpay"
            @success="handlePaymentSuccess"
            @close="handlePaymentError"
          />
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFluxDrive } from '@/composables/useFluxDrive'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import PricingPlans from '@/components/FluxDrive/PricingPlans.vue'
import FileManager from '@/components/FluxDrive/FileManager.vue'
import StorageInfo from '@/components/FluxDrive/StorageInfo.vue'
import CheckoutContent from '@/components/CheckoutContent.vue'

const { t } = useI18n()

// Use the composable
const {
  isLoggedIn,
  hasActiveSubscription,
  subscriptionChecked,
  subscriptionPeriodEnd,
  openLoginBottomSheet,
  loadFiles,
  selectPlan,
  checkSubscriptionStatus,
  initializeFluxDrive,
  handlePostLogin,
  getPlanStatus,
  renewSubscription,
  upgradeSubscription,
  usedStorage,
  resetFluxDriveState,
} = useFluxDrive()

// Import flux store to refresh user data after login
import { useFluxStore } from '@/stores/flux'
import { computed } from 'vue'

const fluxStore = useFluxStore()

// Check if user has existing files (based on storage usage)
const hasExistingFiles = computed(() => {
  return usedStorage.value > 0
})

// Check if user has or had a subscription (including expired)
const hasOrHadSubscription = computed(() => {
  return hasActiveSubscription.value ||
         hasExistingFiles.value ||
         subscriptionPeriodEnd.value !== null
})

// Checkout dialog state
const showCheckout = ref(false)
const selectedCheckoutPlan = ref('')
const selectedActionType = ref('')

// Computed title for checkout dialog
const checkoutTitle = computed(() => {
  const actionType = selectedActionType.value
  if (actionType === 'renew') return t('pages.fluxDrive.renewal')
  if (actionType === 'upgrade') return t('pages.fluxDrive.upgrade')
  if (actionType === 'downgrade') return t('pages.fluxDrive.downgrade')

  return t('pages.fluxDrive.checkout')
})

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
    openLoginBottomSheet()

    return
  }

  console.log('🔍 Current subscription status:', {
    isLoggedIn: isLoggedIn.value,
    hasActiveSubscription: hasActiveSubscription.value,
    planStatus: planId ? getPlanStatus(planId) : 'N/A',
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
    } else if (planStatus === 'downgrade') {
      actionType = 'downgrade'
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
    openLoginBottomSheet()
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
        alert(t('pages.fluxDrive.renewalSuccess'))
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
      alert(t('pages.fluxDrive.renewalFailed') + error.message)

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

  if (actionType === 'downgrade') {
    console.log('🔄 Processing downgrade for plan:', planId)
    console.log('📊 Setting checkout values:')
    console.log('  - selectedCheckoutPlan:', planId)
    console.log('  - selectedActionType:', actionType)

    // Downgrades always require payment confirmation, open checkout dialog
    selectedCheckoutPlan.value = planId
    selectedActionType.value = actionType
    showCheckout.value = true
    console.log('✅ Checkout dialog should open with downgrade action')
    
    return
  }

  // For signup and signin actions, open checkout dialog
  selectedCheckoutPlan.value = planId
  selectedActionType.value = actionType
  showCheckout.value = true
}

// Watch for login status changes
watch(isLoggedIn, async (newValue, oldValue) => {
  // Only handle when user logs in (changes from false to true)
  if (newValue && !oldValue) {
    console.log('Login successful - processing...')

    // Use the composable's post-login handler (which closes the login dialog)
    await handlePostLogin()

    // If there was a pending plan selection, open checkout
    if (selectedCheckoutPlan.value) {
      console.log('🎯 Found pending plan selection:', selectedCheckoutPlan.value)

      // Determine action type for the selected plan after login
      if (!selectedActionType.value) {
        if (hasActiveSubscription.value) {
          const planStatus = getPlanStatus(selectedCheckoutPlan.value)
          selectedActionType.value = planStatus === 'current' ? 'renew' :
            planStatus === 'downgrade' ? 'downgrade' : 'upgrade'
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
})

// Handle payment success
const handlePaymentSuccess = async () => {
  showCheckout.value = false
  selectedCheckoutPlan.value = ''
  selectedActionType.value = ''

  console.log('🎉 Payment successful - refreshing FluxDrive data...')

  // Clear renewal state in FileManager
  if (fileManagerRef.value?.clearRenewalState) {
    fileManagerRef.value.clearRenewalState()
  }

  // Small delay to ensure backend has processed the upgrade
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Note: Flux store mainly handles configuration data, user subscription data is handled by checkSubscriptionStatus

  // Refresh subscription status and storage capacity
  await checkSubscriptionStatus()

  // Force reload files to refresh storage usage stats
  await loadFiles(true) // Clear messages and force refresh

  console.log('✅ FluxDrive data refreshed after payment success')
}

// Handle payment error
const handlePaymentError = error => {
  console.error('Payment error:', error)
}

// Handle closing checkout dialog with cleanup
const closeCheckoutDialog = () => {
  console.log('🚪 Closing checkout dialog and cleaning up payment monitoring')

  // Cleanup payment monitoring if component exists
  if (checkoutContentRef.value && checkoutContentRef.value.cleanupPaymentMonitoring) {
    checkoutContentRef.value.cleanupPaymentMonitoring()
  }

  // Clear renewal state in FileManager to remove spinner
  if (fileManagerRef.value?.clearRenewalState) {
    fileManagerRef.value.clearRenewalState()
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

// Watch privilege changes to handle logout
watch(() => fluxStore.privilege, (newPrivilege, oldPrivilege) => {
  console.log('🔄 Privilege changed:', { oldPrivilege, newPrivilege })
  if (newPrivilege === 'none' && oldPrivilege !== 'none') {
    console.log('🚪 User logged out - clearing FluxDrive state')
    resetFluxDriveState()
  }
})

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
@import '@styles/flux-drive.scss';
</style>