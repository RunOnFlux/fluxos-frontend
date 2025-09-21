<template>
  <VCard>
    <VCardTitle class="bg-primary text-white pa-4">
      <div class="d-flex align-center">
        <VIcon icon="mdi-plus-circle-outline" class="me-2" />
        Add New Proposal
      </div>
    </VCardTitle>

    <VCardText class="pa-4 pa-sm-6">
      <VForm
        ref="form"
        v-model="valid"
      >
        <VRow>
          <!-- Proposal Topic -->
          <VCol cols="12">
            <VTextField
              v-model="formData.topic"
              label="Proposal Topic"
              :rules="[rules.required, rules.minLength(3)]"
              variant="outlined"
              placeholder="Enter a clear and descriptive proposal title"
            />
          </VCol>

          <!-- Proposal Description -->
          <VCol cols="12">
            <VTextarea
              v-model="formData.description"
              label="Proposal Description"
              :rules="[rules.required, rules.minLength(50)]"
              rows="6"
              variant="outlined"
              placeholder="Provide a detailed description of your proposal (minimum 50 characters)"
            />
          </VCol>

          <!-- Optional Grant Section -->
          <VCol cols="12">
            <VExpansionPanels variant="accordion">
              <VExpansionPanel>
                <VExpansionPanelTitle>
                  <VAvatar
                    variant="tonal"
                    color="success"
                    size="32"
                    class="me-2"
                  >
                    <VIcon icon="mdi-currency-usd" size="16" />
                  </VAvatar>
                  Grant Information 
                </VExpansionPanelTitle>
                <VExpansionPanelText>
                  <VRow>
                    <VCol cols="12" md="6">
                      <VTextField
                        v-model="formData.grantValue"
                        label="Grant Amount (FLUX)"
                        type="number"
                        variant="outlined"
                        placeholder="0"
                        :rules="grantRules"
                      />
                    </VCol>

                    <VCol cols="12" md="6">
                      <VTextField
                        v-model="formData.grantAddress"
                        label="Grant Pay to Address"
                        variant="outlined"
                        placeholder="Flux address to receive grant"
                        :rules="grantAddressRules"
                        :disabled="!formData.grantValue || formData.grantValue <= 0"
                      />
                    </VCol>
                  </VRow>
                </VExpansionPanelText>
              </VExpansionPanel>
            </VExpansionPanels>
          </VCol>

          <!-- Nickname -->
          <VCol cols="12" md="6">
            <VTextField
              v-model="formData.nickName"
              label="Name/Nickname"
              variant="outlined"
              placeholder="Your name or nickname (optional)"
            />
          </VCol>

          <!-- Validation Status -->
          <VCol cols="12" md="6">
            <VCard
              variant="outlined"
              :color="validationStatus.color"
              class="pa-4 text-center"
            >
              <VBtn
                :disabled="!canValidate || validating"
                :loading="validating"
                :color="validationStatus.color"
                variant="elevated"
                @click="validateProposal"
              >
                <VIcon icon="mdi-check-circle-outline" class="me-2" />
                {{ validationStatus.text }}
              </VBtn>
            </VCard>
          </VCol>
        </VRow>

        <!-- Preview Payment Button -->

        <!-- Proposal Price and Registration -->
        <VExpandTransition>
          <VCard
            v-if="proposalValidated"
            variant="tonal"
            color="success"
            class="mt-6"
          >
            <VCardText class="pa-6">
              <div class="text-center">
                <h3 class="text-h5 mb-4">Proposal Validated Successfully!</h3>
                <p class="text-h6 mb-4">
                  Proposal Registration Fee: <strong>{{ proposalPrice }} FLUX</strong>
                </p>
                
                <VBtn
                  :loading="registering"
                  :disabled="registering"
                  color="primary"
                  variant="elevated"
                  size="large"
                  @click="registerProposal"
                >
                  <VIcon icon="mdi-clipboard-check-outline" class="me-2" />
                  Register Flux XDAO Proposal
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VExpandTransition>

        <!-- Payment Instructions -->
        <VExpandTransition>
          <VCard
            v-if="registrationHash"
            variant="outlined"
            class="mt-6"
          >
            <VCardText class="pa-6">
              <div class="text-center mb-6">
                <h2 class="text-h4 mb-3 font-weight-bold">Complete Payment</h2>
                <div class="payment-info-card mx-auto mb-4">
                  <div class="text-body-1 mb-1">Payment Required</div>
                  <div class="d-flex align-center justify-center">
                    <VChip 
                      variant="flat" 
                      color="success" 
                      size="large" 
                      class="payment-chip"
                    >
                      <VIcon icon="mdi-currency-usd" class="me-2" size="20" />
                      {{ proposalPrice }} FLUX
                    </VChip>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">To complete your proposal registration</div>
                </div>
                
                <VRow class="mt-4">
                  <VCol cols="12" md="6">
                    <VCard class="simple-payment-card h-100" variant="outlined">
                      <VCardText class="text-center">
                        <div class="text-h6 mb-3">Wallet Payment</div>
                        <div class="text-body-2 text-medium-emphasis mb-3">Choose your preferred wallet</div>
                        <div class="wallet-options">
                          <div
                            class="wallet-image-container"
                            @click="payWithZelcore"
                          >
                            <img
                              :src="FluxIDImg"
                              alt="Zelcore"
                              class="wallet-image"
                            />
                            <div class="text-caption mt-2">Zelcore</div>
                          </div>
                          <div
                            class="wallet-image-container"
                            @click="payWithSSP"
                          >
                            <img
                              :src="SSPLogoThemeImg"
                              alt="SSP"
                              class="wallet-image"
                            />
                            <div class="text-caption mt-2">SSP</div>
                          </div>
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>

                  <VCol cols="12" md="6">
                    <VCard class="simple-payment-card h-100" variant="outlined">
                      <VCardText>
                        <div class="text-h6 mb-3">Manual Payment</div>

                        <div class="mb-3">
                          <div class="text-caption mb-1">Foundation Address</div>
                          <div class="copy-container">
                            <input
                              readonly
                              :value="foundationAddress"
                              class="copy-input"
                            />
                            <VBtn
                              icon="mdi-content-copy"
                              size="small"
                              variant="text"
                              @click="copyToClipboard(foundationAddress)"
                            />
                          </div>
                        </div>

                        <div class="mb-3">
                          <div class="text-caption mb-1">Transaction Message</div>
                          <div class="copy-container">
                            <input
                              readonly
                              :value="registrationHash"
                              class="copy-input"
                            />
                            <VBtn
                              icon="mdi-content-copy"
                              size="small"
                              variant="text"
                              @click="copyToClipboard(registrationHash)"
                            />
                          </div>
                        </div>

                        <VBtn
                          variant="text"
                          size="small"
                          :href="`https://explorer.runonflux.io/address/${foundationAddress}`"
                          target="_blank"
                        >
                          <VIcon icon="mdi-open-in-new" size="14" class="me-1" />
                          View on Explorer
                        </VBtn>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </div>
            </VCardText>
          </VCard>
        </VExpandTransition>
      </VForm>
    </VCardText>
  </VCard>

  <!-- Success Snackbar -->
  <VSnackbar
    v-model="showSuccessMessage"
    color="success"
    timeout="5000"
    location="top"
  >
    <div class="d-flex align-center">
      <VIcon icon="mdi-check-circle" class="me-2" />
      {{ successMessage }}
    </div>
  </VSnackbar>

  <!-- Error Snackbar -->
  <VSnackbar
    v-model="showErrorMessage"
    color="error"
    timeout="5000"
    location="top"
  >
    <div class="d-flex align-center">
      <VIcon icon="mdi-alert-circle" class="me-2" />
      {{ errorMessage }}
    </div>
  </VSnackbar>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import axios from 'axios'
import FluxIDImg from '@/assets/images/FluxID.svg?url'
import SSPLogoBlackImg from '@/assets/images/ssp-logo-black.svg?url'
import SSPLogoWhiteImg from '@/assets/images/ssp-logo-white.svg?url'

// Props and Emits
const emit = defineEmits(['proposal-added'])

// Theme
const theme = useTheme()

// Computed SSP logo based on theme
const SSPLogoThemeImg = computed(() => {
  return theme.global.name.value === 'dark' ? SSPLogoWhiteImg : SSPLogoBlackImg
})

// Reactive data
const form = ref(null)
const valid = ref(false)
const validating = ref(false)
const registering = ref(false)
const proposalValidated = ref(false)
const proposalPrice = ref(null)
const registrationHash = ref('')
const foundationAddress = ref('')
const validTill = ref(0)
const showSuccessMessage = ref(false)
const showErrorMessage = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Form data
const formData = ref({
  topic: '',
  description: '',
  grantValue: '',
  grantAddress: '',
  nickName: '',
})

// Computed properties
const canValidate = computed(() => {
  return formData.value.topic.length >= 3 && 
         formData.value.description.length >= 50 &&
         (!formData.value.grantValue || !formData.value.grantAddress || 
          (formData.value.grantValue > 0 && formData.value.grantAddress.length > 0))
})

const validationStatus = computed(() => {
  if (proposalValidated.value) {
    return { color: 'success', text: 'Validated' }
  }
  if (!canValidate.value) {
    return { color: 'grey', text: 'Complete Form to Validate' }
  }
  return { color: 'primary', text: 'Validate Proposal' }
})

// Validation rules
const rules = {
  required: (value) => !!value || 'This field is required',
  minLength: (min) => (value) => 
    (value && value.length >= min) || `Minimum ${min} characters required`,
}

const grantRules = computed(() => {
  const baseRules = []
  if (formData.value.grantValue) {
    baseRules.push((value) => {
      const num = Number(value)
      return (!isNaN(num) && Number.isInteger(num)) || 'Grant amount must be a whole number'
    })
  }
  return baseRules
})

const grantAddressRules = computed(() => {
  if (formData.value.grantValue && formData.value.grantValue > 0) {
    return [
      rules.required,
      (value) => !/\s/.test(value) || 'Address cannot contain spaces',
    ]
  }
  return []
})

// Methods
const validateProposal = async () => {
  try {
    validating.value = true

    // Basic validation
    if (!canValidate.value) {
      showError('Please complete all required fields correctly')
      return
    }

    // Get XDAO price
    const priceUrl = import.meta.env.DEV 
      ? '/api/proposals/price' 
      : 'https://stats.runonflux.io/proposals/price'
    const priceResponse = await axios.get(priceUrl)
    if (priceResponse.data.status === 'success') {
      proposalPrice.value = priceResponse.data.data
      proposalValidated.value = true
      showSuccess('Proposal validated successfully!')
    } else {
      showError(priceResponse.data.data.message || priceResponse.data.data)
    }
  } catch (error) {
    showError('Failed to validate proposal: ' + error.message)
  } finally {
    validating.value = false
  }
}

const registerProposal = async () => {
  try {
    registering.value = true

    const data = {
      topic: formData.value.topic,
      description: formData.value.description,
      grantValue: formData.value.grantValue || 0,
      grantAddress: formData.value.grantAddress || '',
      nickName: formData.value.nickName || '',
    }

    const submitUrl = import.meta.env.DEV 
      ? '/api/proposals/submitproposal' 
      : 'https://stats.runonflux.io/proposals/submitproposal'
      
    const response = await axios.post(
      submitUrl,
      JSON.stringify(data),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data.status === 'success') {
      foundationAddress.value = response.data.data.address
      registrationHash.value = response.data.data.hash
      proposalPrice.value = response.data.data.amount
      validTill.value = response.data.data.paidTillDate
      showSuccess('Proposal registered! Please complete the payment.')
    } else {
      showError(response.data.data.message || response.data.data)
    }
  } catch (error) {
    showError('Failed to register proposal: ' + error.message)
  } finally {
    registering.value = false
  }
}

const payWithZelcore = () => {
  try {
    if (!foundationAddress.value || !proposalPrice.value || !registrationHash.value) {
      showError('Payment details not available. Please try registering again.')
      return
    }

    const protocol = `zel:?action=pay&coin=zelcash&address=${foundationAddress.value}&amount=${proposalPrice.value}&message=${registrationHash.value}`
    
    const a = document.createElement('a')
    a.href = protocol
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    showSuccess('Zelcore payment initiated - please complete payment in Zelcore wallet')
  } catch (error) {
    showError('Failed to open Zelcore')
  }
}



const payWithSSP = async () => {
  try {
    if (!window.ssp) {
      showError('SSP Wallet not installed')
      return
    }

    const data = {
      message: registrationHash.value,
      amount: (proposalPrice.value || 0).toString(),
      address: foundationAddress.value,
      chain: 'flux',
    }

    const response = await window.ssp.request('pay', data)
    if (response.status === 'ERROR') {
      throw new Error(response.data || response.result)
    } else {
      showSuccess(`SSP payment initiated`)
    }
  } catch (error) {
    showError('Failed to initiate SSP payment: ' + error.message)
  }
}


const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    showSuccess('Copied to clipboard!')
  } catch (error) {
    showError('Failed to copy to clipboard')
  }
}

const formatDeadline = (timestamp) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resetForm = () => {
  formData.value = {
    topic: '',
    description: '',
    grantValue: '',
    grantAddress: '',
    nickName: '',
  }
  proposalValidated.value = false
  registrationHash.value = ''
  foundationAddress.value = ''
  validTill.value = 0
  proposalPrice.value = null
}

// Fetch current proposal price from API
const fetchProposalPrice = async () => {
  try {
    const priceUrl = import.meta.env.DEV
      ? '/api/proposals/price'
      : 'https://stats.runonflux.io/proposals/price'

    const response = await axios.get(priceUrl)
    if (response.data && response.data.status === 'success') {
      proposalPrice.value = response.data.data
    }
  } catch (error) {
    console.log('Failed to fetch proposal price:', error.message)
    proposalPrice.value = null
  }
}

// Lifecycle
onMounted(() => {
  fetchProposalPrice()
})

const showSuccess = (message) => {
  successMessage.value = message
  showSuccessMessage.value = true
  
  // Only emit when actual payment is completed
  if (message.includes('payment') && registrationHash.value) {
    setTimeout(() => {
      emit('proposal-added')
      resetForm()
    }, 2000)
  }
}

const showError = (message) => {
  errorMessage.value = message
  showErrorMessage.value = true
}
</script>

<style scoped>
/* Enhanced Payment Header */
.payment-info-card {
  max-width: 300px;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 0.8);
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.payment-chip {
  font-weight: 600 !important;
  font-size: 1.1rem !important;
  padding: 8px 16px !important;
  box-shadow: 0 2px 8px rgba(var(--v-theme-success), 0.3) !important;
}

/* Simple Payment Cards */
.simple-payment-card {
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  transition: all 0.3s ease !important;
  transform: translateY(0);
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%) !important;
}

.simple-payment-card:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
}

/* Wallet Options Container */
.wallet-options {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

/* Wallet Image Container */
.wallet-image-container {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 2px solid rgba(var(--v-theme-outline), 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(var(--v-theme-surface-variant), 0.05);
  min-width: 120px;
}

.wallet-image-container:hover {
  transform: scale(1.05);
  border-color: rgba(var(--v-theme-success), 0.4);
  background: rgba(var(--v-theme-success), 0.05);
  box-shadow: 0 4px 16px rgba(var(--v-theme-success), 0.15);
}

.wallet-image {
  height: 80px;
  width: 80px;
  object-fit: contain;
}

/* Copy Container */
.copy-container {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-radius: 6px;
  padding: 4px 8px;
  background: rgba(var(--v-theme-surface-variant), 0.05);
}

.copy-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: monospace;
  font-size: 0.875rem;
  color: inherit;
  padding: 4px;
}

/* Responsive Wallet Grid */
@media (max-width: 768px) {
  .wallet-icons-grid {
    gap: 0.75rem;
  }
  
  .wallet-icon-card {
    min-width: 120px;
  }
  
  .payment-info-card {
    max-width: 280px;
  }
}

@media (max-width: 600px) {
  .wallet-icons-grid {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .payment-info-card {
    max-width: 250px;
    padding: 0.75rem;
  }
}
</style>