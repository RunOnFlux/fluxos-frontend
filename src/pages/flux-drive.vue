<template>
  <div class="fluxdrive-page">
    <!-- Loading state while checking subscription -->
    <LoadingSpinner
      v-if="!subscriptionChecked"
      icon="mdi-cloud"
      :icon-size="56"
      :title="t('pages.fluxDrive.loading')"
    />

    <!-- Content - only show after subscription check is complete -->
    <template v-else>
      <!-- Hero Section - Only show for users without subscription history -->
      <HeroSection
        v-if="!hasOrHadSubscription"
        :title="t('pages.fluxDrive.intro.title')"
        :subtitle="t('pages.fluxDrive.intro.subtitle')"
        background-image="/banner/FluxDrive2.webp"
        icon="mdi-cloud-upload"
        icon-aria-label="FluxDrive Cloud Storage"
        min-height="300px"
      />

      <!-- Show pricing plans only for users who have never had a subscription -->
      <div v-if="!hasOrHadSubscription" class="plans-container">
        <PricingPlans @selectPlan="(planId, actionType) => handlePlanSelection(planId, actionType)"
        />

        <!-- Features Section -->
        <FeatureShowcase
          :title="t('pages.fluxDrive.features.title')"
          :items="features"
          grid-min-width="300px"
        />

        <!-- Benefits Section -->
        <BenefitsGrid
          :title="t('pages.fluxDrive.benefits.title')"
          :items="benefits"
          grid-template-columns="repeat(2, 1fr)"
        />

        <!-- Trustpilot Reviews Section -->
        <TrustpilotPanel use-live-data :star-size="32" show-rating-label />
      </div>

      <!-- Show actual FluxDrive interface for subscribers or users with subscription history -->
      <div v-else>
        <FileManager
          ref="fileManagerRef"
          @selectPlan="handlePlanSelection"
        />
        <StorageInfo />
      </div>
    </template>


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
import { useSEO, generateOrganizationSchema, generateBreadcrumbSchema, generateFAQSchema } from '@/composables/useSEO'
import { useFluxDrive } from '@/composables/useFluxDrive'
import { useAnalytics } from '@/plugins/analytics/composables/useAnalytics'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import PricingPlans from '@/components/FluxDrive/PricingPlans.vue'
import FileManager from '@/components/FluxDrive/FileManager.vue'
import StorageInfo from '@/components/FluxDrive/StorageInfo.vue'
import CheckoutContent from '@/components/CheckoutContent.vue'
import FeatureShowcase from '@/components/FeatureShowcase.vue'
import TrustpilotPanel from '@/components/Marketplace/Panels/TrustpilotPanel.vue'
import BenefitsGrid from '@/components/BenefitsGrid.vue'
import HeroSection from '@/components/HeroSection.vue'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'

const { t } = useI18n()
const analytics = useAnalytics()

// SEO meta tags and structured data
const pageUrl = 'https://cloud.runonflux.com/flux-drive'
const title = 'FluxDrive - Decentralized IPFS Cloud Storage | Flux Network'
const description = 'Secure IPFS cloud storage on Flux network. Store files across distributed FluxNodes with encryption, redundancy & censorship resistance. Decentralized.'
const imageUrl = 'https://cloud.runonflux.com/banner/FluxDriveBanner.png'

// SoftwareApplication structured data
const softwareApplicationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  'name': 'FluxDrive',
  'applicationCategory': 'BusinessApplication',
  'operatingSystem': 'Web',
  'offers': {
    '@type': 'AggregateOffer',
    'priceCurrency': 'USD',
    'lowPrice': '5',
    'highPrice': '50',
    'offerCount': '4',
  },
  'description': 'Decentralized cloud storage solution built on IPFS and the Flux network. Encrypted, distributed file storage with censorship resistance.',
  'url': pageUrl,
  'image': imageUrl,
  'provider': {
    '@type': 'Organization',
    'name': 'Flux Network',
    'url': 'https://runonflux.com',
  },
  'featureList': [
    'IPFS-based decentralized storage',
    'End-to-end encryption',
    'Distributed across FluxNodes',
    'Censorship resistant',
    'No centralized providers',
    'Permanent file availability',
    'Redundant storage',
  ],
}

// FAQ items for structured data
const faqItems = [
  {
    question: 'What is FluxDrive?',
    answer: 'FluxDrive is a decentralized cloud storage solution built on IPFS and the Flux network. It provides secure, encrypted file storage distributed across thousands of FluxNodes worldwide, ensuring censorship resistance and permanent file availability.',
  },
  {
    question: 'How much does FluxDrive cost?',
    answer: 'FluxDrive offers flexible pricing starting from $5/month for 100GB of storage. Plans range up to $50/month for 1000GB, with a daily rate of $0.0017 per GB. Enterprise custom plans are also available.',
  },
  {
    question: 'Is my data encrypted on FluxDrive?',
    answer: 'Yes, all files uploaded to FluxDrive are encrypted end-to-end. Your data is secured with strong encryption and distributed across multiple FluxNodes, ensuring privacy and security.',
  },
  {
    question: 'How is FluxDrive different from traditional cloud storage?',
    answer: 'Unlike traditional centralized cloud storage, FluxDrive is completely decentralized. Your files are stored across a global network of FluxNodes using IPFS technology, making them censorship-resistant with no single point of failure. There are no centralized providers that can access or control your data.',
  },
  {
    question: 'What happens if I cancel my FluxDrive subscription?',
    answer: 'If you cancel your subscription, you will retain access to your files until the end of your billing period. After that, your files will be removed from the network. We recommend downloading your files before cancellation.',
  },
]

useSEO({
  title,
  description,
  url: pageUrl,
  image: imageUrl,
  imageAlt: 'FluxDrive - Decentralized IPFS Cloud Storage',
  keywords: 'decentralized storage, IPFS storage, cloud storage, blockchain storage, distributed storage, encrypted storage, Flux network, censorship resistant storage, Web3 storage, decentralized cloud, permanent storage, IPFS, FluxDrive, file storage, secure storage, private cloud',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  structuredData: [
    softwareApplicationStructuredData,
    generateOrganizationSchema(),
    generateBreadcrumbSchema([
      { name: 'Home', url: 'https://cloud.runonflux.com' },
      { name: 'FluxDrive', url: pageUrl },
    ]),
    generateFAQSchema(faqItems),
  ],
})

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

// Features data for landing page
const features = [
  {
    icon: 'mdi-lock-outline',
    color: 'primary',
    title: t('pages.fluxDrive.features.encryption.title'),
    description: t('pages.fluxDrive.features.encryption.description'),
  },
  {
    icon: 'mdi-server-network',
    color: 'success',
    title: t('pages.fluxDrive.features.distributed.title'),
    description: t('pages.fluxDrive.features.distributed.description'),
  },
  {
    icon: 'mdi-shield-check',
    color: 'warning',
    title: t('pages.fluxDrive.features.censorship.title'),
    description: t('pages.fluxDrive.features.censorship.description'),
  },
  {
    icon: 'mdi-cloud-check',
    color: 'info',
    title: t('pages.fluxDrive.features.ipfs.title'),
    description: t('pages.fluxDrive.features.ipfs.description'),
  },
  {
    icon: 'mdi-check-decagram',
    color: 'success',
    title: t('pages.fluxDrive.features.permanent.title'),
    description: t('pages.fluxDrive.features.permanent.description'),
  },
  {
    icon: 'mdi-lightning-bolt',
    color: 'error',
    title: t('pages.fluxDrive.features.fast.title'),
    description: t('pages.fluxDrive.features.fast.description'),
  },
  {
    icon: 'mdi-cash-refund',
    color: 'success',
    title: t('pages.fluxDrive.features.guarantee.title'),
    description: t('pages.fluxDrive.features.guarantee.description'),
  },
]

// Benefits data for landing page
const benefits = [
  {
    icon: 'mdi-shield-check',
    color: 'primary',
    text: t('pages.fluxDrive.benefits.noCentralized'),
  },
  {
    icon: 'mdi-key',
    color: 'success',
    text: t('pages.fluxDrive.benefits.fullControl'),
  },
  {
    icon: 'mdi-earth',
    color: 'info',
    text: t('pages.fluxDrive.benefits.globalRedundancy'),
  },
  {
    icon: 'mdi-currency-usd',
    color: 'warning',
    text: t('pages.fluxDrive.benefits.transparentPricing'),
  },
  {
    icon: 'mdi-lock-open-variant',
    color: 'error',
    text: t('pages.fluxDrive.benefits.noVendorLock'),
  },
  {
    icon: 'mdi-code-braces',
    color: 'secondary',
    text: t('pages.fluxDrive.benefits.openSource'),
  },
]

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

  // Track plan selection
  analytics.trackFluxDrive('plan_selected', {
    plan_id: planId,
    action_type: actionType || 'browse',
  })

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
  // Track successful payment
  analytics.trackFluxDrive('payment_success', {
    plan_id: selectedCheckoutPlan.value,
    action_type: selectedActionType.value,
  })

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

  // Track FluxDrive page view
  analytics.trackFluxDrive('page_view', {
    page: 'fluxdrive',
    has_subscription: hasActiveSubscription.value,
    is_logged_in: isLoggedIn.value,
  })

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

.fluxdrive-page {
  padding: 0;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 100px);
}

.fluxdrive-page :deep(.hero-section) {
  margin-bottom: 2rem !important;
}

/* Section Cards */
.section-card {
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: 32px !important;
}

/* Trustpilot Section */
.trustpilot-section {
  padding: 0 !important;
  border-radius: 16px !important;
  box-shadow: none !important;
}

.section-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 24px;
  text-align: center;
}

.section-text {
  font-size: 1.1rem;
  line-height: 1.8;
}


/* Mobile Responsive */
@media (max-width: 960px) {
  .fluxdrive-page {
    padding: 0;
  }

  .section-card {
    padding: 24px 16px;
  }

  .section-title {
    font-size: 1.75rem;
  }
}

@media (max-width: 600px) {
  .fluxdrive-page {
    padding: 0 !important;
  }
}

/* Trustpilot Section */
.trustpilot-link {
  text-decoration: none;
  color: inherit;
  display: inline-block;
  transition: all 0.3s ease;
}

.trustpilot-link:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.trustpilot-link .trustpilot-rating-container {
  cursor: pointer;
}

@media (max-width: 600px) {
  .fluxdrive-page {
    padding: 8px 16px;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .breadcrumb-nav {
    margin-bottom: 12px;
  }
}
</style>