<template>
  <div class="fluxdrive-page">
    <!-- Breadcrumb Navigation -->
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li class="breadcrumb-item">
          <RouterLink to="/" class="breadcrumb-link">Home</RouterLink>
          <VIcon class="breadcrumb-separator">mdi-chevron-right</VIcon>
        </li>
        <li class="breadcrumb-item breadcrumb-current" aria-current="page">
          <span>FluxDrive</span>
        </li>
      </ol>
    </nav>

    <!-- Hero Section -->
    <div class="hero-section" role="banner">
      <div class="hero-icon-top-right" role="img" aria-label="FluxDrive Cloud Storage">
        <VIcon icon="mdi-cloud-upload" size="80" color="white" aria-hidden="true" />
      </div>
      <div class="hero-content">
        <h1 class="hero-title">{{ t('pages.fluxDrive.intro.title') }}</h1>
        <p class="hero-subtitle">{{ t('pages.fluxDrive.intro.subtitle') }}</p>
      </div>
    </div>

    <!-- Loading state while checking subscription -->
    <LoadingSpinner
      v-if="!subscriptionChecked"
      icon="mdi-cloud"
      :icon-size="56"
      :title="t('pages.fluxDrive.loading')"
    />

    <!-- Show pricing plans only for users who have never had a subscription -->
    <div v-if="!hasOrHadSubscription">
      <PricingPlans @selectPlan="(planId, actionType) => handlePlanSelection(planId, actionType)"
      />

      <!-- Features Section -->
      <VCard class="section-card features-section ma-4">
        <VCardTitle class="section-title">
          {{ t('pages.fluxDrive.features.title') }}
        </VCardTitle>
        <VCardText>
          <div class="features-grid">
            <div
              v-for="(feature, index) in features"
              :key="index"
              class="feature-item"
            >
              <div class="feature-icon-wrapper">
                <VIcon :icon="feature.icon" size="40" :color="feature.color" />
              </div>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-description">{{ feature.description }}</p>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Benefits Section -->
      <VCard class="section-card benefits-section ma-4">
        <VCardTitle class="section-title">
          {{ t('pages.fluxDrive.benefits.title') }}
        </VCardTitle>
        <VCardText class="section-text">
          <div class="benefits">
            <div
              v-for="(benefit, index) in benefits"
              :key="index"
              class="benefit-item"
            >
              <VIcon :icon="benefit.icon" size="24" :color="benefit.color" />
              <span>{{ benefit.text }}</span>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Trustpilot Reviews Section -->
      <VCard class="section-card trustpilot-section ma-4">
        <VCardText class="pa-8">
          <div class="trustpilot-header text-center mb-6">
            <h2 class="text-h4 mb-3 font-weight-bold">{{ t('common.trustpilot.title') }}</h2>
            <div class="trustpilot-rating-container">
              <div class="trustpilot-logo mb-3">
                <VIcon icon="mdi-star" size="32" color="#00b67a" />
                <span class="text-h6 font-weight-bold ml-2" style="color: #00b67a;">Trustpilot</span>
              </div>
              <div class="rating-stars mb-2">
                <VIcon v-for="i in 4" :key="i" icon="mdi-star" size="32" color="#00b67a" />
                <VIcon icon="mdi-star-half-full" size="32" color="#00b67a" />
              </div>
              <div class="rating-text">
                <span class="text-h5 font-weight-bold">{{ t('common.trustpilot.ratingLabel') }}</span>
                <span class="text-h6 ml-2 text-medium-emphasis">{{ t('common.trustpilot.score') }} {{ t('common.trustpilot.outOf') }}</span>
              </div>
              <div class="reviews-count text-body-2 text-medium-emphasis mt-1">
                {{ t('common.trustpilot.basedOn', { count: t('common.trustpilot.reviewsCount') }) }}
              </div>
            </div>
          </div>

          <div class="trustpilot-reviews">
            <VRow>
              <VCol v-for="(review, key) in ['review1', 'review2', 'review3']" :key="key" cols="12" md="4">
                <VCard variant="outlined" class="review-card pa-4">
                  <div class="review-stars mb-2">
                    <VIcon v-for="i in parseInt(t(`common.trustpilot.sampleReviews.${review}.rating`))" :key="i" icon="mdi-star" size="20" color="#00b67a" />
                  </div>
                  <p class="review-text text-body-2 mb-3">
                    "{{ t(`common.trustpilot.sampleReviews.${review}.text`) }}"
                  </p>
                  <div class="review-author text-caption text-medium-emphasis">
                    <VIcon icon="mdi-check-circle" size="14" color="success" class="mr-1" />
                    {{ t(`common.trustpilot.sampleReviews.${review}.author`) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ t('common.trustpilot.verifiedCustomer') }}
                  </div>
                </VCard>
              </VCol>
            </VRow>
          </div>
        </VCardText>
      </VCard>
    </div>

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
import { useHead } from '@vueuse/head'
import { useFluxDrive } from '@/composables/useFluxDrive'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import PricingPlans from '@/components/FluxDrive/PricingPlans.vue'
import FileManager from '@/components/FluxDrive/FileManager.vue'
import StorageInfo from '@/components/FluxDrive/StorageInfo.vue'
import CheckoutContent from '@/components/CheckoutContent.vue'

const { t } = useI18n()

// SEO meta tags and structured data
const pageUrl = 'https://home.runonflux.io/flux-drive'
const title = 'FluxDrive - Decentralized IPFS Cloud Storage | Flux Network'
const description = 'Secure decentralized cloud storage powered by IPFS on the Flux network. Store files across distributed FluxNodes with encryption, redundancy, and censorship resistance. No centralized providers needed.'
const imageUrl = 'https://home.runonflux.io/banner/FluxDriveBanner.png'

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

// Organization structured data
const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Flux Network',
  'url': 'https://home.runonflux.io',
  'logo': 'https://home.runonflux.io/logo.png',
  'description': 'Decentralized Web3 cloud infrastructure powered by FluxNodes worldwide',
  'sameAs': [
    'https://twitter.com/RunOnFlux',
    'https://github.com/RunOnFlux',
  ],
}

// Breadcrumb structured data
const breadcrumbStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': 'https://home.runonflux.io',
    },
    {
      '@type': 'ListItem',
      'position': 2,
      'name': 'FluxDrive',
      'item': pageUrl,
    },
  ],
}

// FAQPage structured data for better SEO
const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'What is FluxDrive?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'FluxDrive is a decentralized cloud storage solution built on IPFS and the Flux network. It provides secure, encrypted file storage distributed across thousands of FluxNodes worldwide, ensuring censorship resistance and permanent file availability.',
      },
    },
    {
      '@type': 'Question',
      'name': 'How much does FluxDrive cost?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'FluxDrive offers flexible pricing starting from $5/month for 100GB of storage. Plans range up to $50/month for 1000GB, with a daily rate of $0.0017 per GB. Enterprise custom plans are also available.',
      },
    },
    {
      '@type': 'Question',
      'name': 'Is my data encrypted on FluxDrive?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Yes, all files uploaded to FluxDrive are encrypted end-to-end. Your data is secured with strong encryption and distributed across multiple FluxNodes, ensuring privacy and security.',
      },
    },
    {
      '@type': 'Question',
      'name': 'How is FluxDrive different from traditional cloud storage?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Unlike traditional centralized cloud storage, FluxDrive is completely decentralized. Your files are stored across a global network of FluxNodes using IPFS technology, making them censorship-resistant with no single point of failure. There are no centralized providers that can access or control your data.',
      },
    },
    {
      '@type': 'Question',
      'name': 'What happens if I cancel my FluxDrive subscription?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'If you cancel your subscription, you will retain access to your files until the end of your billing period. After that, your files will be removed from the network. We recommend downloading your files before cancellation.',
      },
    },
  ],
}

useHead({
  title,
  meta: [
    {
      name: 'description',
      content: description,
    },
    {
      name: 'keywords',
      content: 'decentralized storage, IPFS storage, cloud storage, blockchain storage, distributed storage, encrypted storage, Flux network, censorship resistant storage, Web3 storage, decentralized cloud, permanent storage, IPFS, FluxDrive, file storage, secure storage, private cloud',
    },

    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'FluxDrive - Decentralized IPFS Cloud Storage' },
    { property: 'og:url', content: pageUrl },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'FluxCloud' },
    { property: 'og:locale', content: 'en_US' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:image:alt', content: 'FluxDrive - Decentralized IPFS Cloud Storage' },
    { name: 'twitter:site', content: '@RunOnFlux' },
    { name: 'twitter:creator', content: '@RunOnFlux' },

    // Additional SEO
    { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
    { name: 'author', content: 'Flux Network' },
  ],
  link: [
    { rel: 'canonical', href: pageUrl },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify([softwareApplicationStructuredData, organizationStructuredData, breadcrumbStructuredData, faqStructuredData]),
    },
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
    icon: 'mdi-check-circle',
    color: 'success',
    text: t('pages.fluxDrive.benefits.noCentralized'),
  },
  {
    icon: 'mdi-check-circle',
    color: 'success',
    text: t('pages.fluxDrive.benefits.fullControl'),
  },
  {
    icon: 'mdi-check-circle',
    color: 'success',
    text: t('pages.fluxDrive.benefits.globalRedundancy'),
  },
  {
    icon: 'mdi-check-circle',
    color: 'success',
    text: t('pages.fluxDrive.benefits.transparentPricing'),
  },
  {
    icon: 'mdi-check-circle',
    color: 'success',
    text: t('pages.fluxDrive.benefits.noVendorLock'),
  },
  {
    icon: 'mdi-check-circle',
    color: 'success',
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
.fluxdrive-page {
  padding: 8px 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 100px);
}

/* Breadcrumb Navigation */
.breadcrumb-nav {
  padding: 16px 0;
  margin-bottom: 24px;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  transition: opacity 0.2s;
  font-size: 0.95rem;
}

.breadcrumb-link:hover {
  opacity: 0.7;
  text-decoration: underline;
}

.breadcrumb-separator {
  margin: 0 8px;
  opacity: 0.5;
  font-size: 14px;
}

.breadcrumb-current span {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.95rem;
}

/* Hero Section */
.hero-section {
  position: relative;
  border-radius: 24px;
  padding: 64px 32px;
  margin-bottom: 48px;
  text-align: center;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%),
              url('/banner/FluxDrive2.png') center center / cover no-repeat;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 0;
}

.hero-icon-top-right {
  position: absolute;
  top: 32px;
  right: 32px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 90px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  max-width: 800px;
  margin: 0 auto;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.3);
}

/* Section Cards */
.section-card {
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: 32px !important;
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

/* Features Section */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-top: 32px;
}

.feature-item {
  text-align: center;
  padding: 24px;
  border-radius: 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.feature-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.feature-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.1);
  margin-bottom: 20px;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.feature-description {
  font-size: 0.95rem;
  opacity: 0.8;
  margin: 0;
  line-height: 1.6;
}

/* Benefits Section */
.benefits {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
  border-left: 3px solid rgb(var(--v-theme-primary));
  transition: all 0.3s ease;
}

.benefit-item:hover {
  transform: translateX(8px);
  background: rgba(var(--v-theme-primary), 0.1);
}

/* Mobile Responsive */
@media (max-width: 960px) {
  .hero-section {
    padding: 48px 24px;
    min-height: 250px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .hero-icon-top-right {
    top: 16px;
    right: 16px;
    width: 70px;
    height: 70px;
  }

  .hero-icon-top-right .v-icon {
    font-size: 60px !important;
  }

  .section-card {
    padding: 24px 16px;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .benefits {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .fluxdrive-page {
    padding: 8px 16px;
  }

  .hero-section {
    padding: 40px 16px;
    min-height: 220px;
    margin-bottom: 32px;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .feature-icon-wrapper {
    width: 64px;
    height: 64px;
  }

  .breadcrumb-nav {
    margin-bottom: 12px;
  }
}

@import '@styles/flux-drive.scss';
</style>