<template>
  <div class="cost-calculator-page">
    <!-- Page Header -->
    <VCard 
      class="mb-6"
      variant="tonal"
      color="primary"
      elevation="2"
    >
      <VCardText class="pa-8">
        <div class="d-flex align-center">
          <VAvatar
            size="64"
            color="primary"
            variant="tonal"
            class="me-4"
          >
            <VIcon 
              icon="tabler-calculator" 
              size="32"
            />
          </VAvatar>
          <div>
            <h1 class="text-h3 font-weight-bold mb-2">
              App Cost Calculator
            </h1>
            <p class="text-h6 text-medium-emphasis mb-0">
              Calculate deployment costs for your Flux applications
            </p>
          </div>
        </div>
      </VCardText>
    </VCard>

    <VRow>
      <!-- Calculator Form -->
      <VCol 
        cols="12" 
        md="6"
      >
        <VCard>
          <VCardTitle class="bg-primary text-white">Configuration</VCardTitle>
          <VCardText class="pt-6">
            <!-- Instances -->
            <div class="mb-6">
              <div class="d-flex align-start mb-2">
                <VIcon icon="mdi-server-network" color="primary" size="28" class="mr-3" />
                <div>
                  <div class="text-h6 font-weight-bold">
                    How many instances will you be running?
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-0 mt-1">
                    (min 3 / max 100) 1 Instance = 1 Node
                  </p>
                </div>
              </div>
              <VTextField
                v-model.number="formData.instances"
                type="number"
                :min="3"
                :max="100"
                :rules="[
                  v => !!v || 'Instances is required',
                  v => v >= 3 || 'Minimum 3 instances required',
                  v => v <= 100 || 'Maximum 100 instances allowed'
                ]"
                placeholder="3"
                @input="calculateCost"
              />
            </div>

            <!-- Renewal Period -->
            <div class="mb-6">
              <div class="d-flex align-start mb-2">
                <VIcon icon="mdi-calendar-clock" color="primary" size="28" class="mr-3" />
                <div>
                  <div class="text-h6 font-weight-bold">
                    Renewal period
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-0 mt-1">
                    (Manual renewal required)
                  </p>
                </div>
              </div>
              <VSelect
                v-model="formData.expire"
                :items="renewalOptions"
                @update:model-value="calculateCost"
              />
            </div>

            <VDivider class="my-6" />

            <!-- Hardware Resources Section -->
            <div class="mb-6">
              <div class="d-flex align-center mb-4">
                <VIcon icon="mdi-memory" color="primary" size="32" class="mr-3" />
                <h4 class="text-h5 font-weight-bold mb-0">
                  Hardware Resources
                </h4>
              </div>
              
              <!-- CPU Cores -->
              <div class="mb-4 ml-2">
                  <div class="text-h6 font-weight-bold">
                    How many cores do you require?
                  </div>
                <div class="text-body-2 text-medium-emphasis">
                  (min 0.1 / max 15.0)
                </div>
              <div class="d-flex justify-end" style="transform: translateY(-8px);">
                <VChip
                  color="success"
                  variant="tonal"
                  size="small"
                  rounded
                  class="mr-2"
                >
                  {{ formData.cpu }} vCores
                </VChip>
              </div>
              <VSlider
                v-model="formData.cpu"
                :min="0.1"
                :max="15.0"
                :step="0.1"
                color="primary"
                :thumb-label="false"
                @update:model-value="calculateCost"
              />
            </div>

            <!-- Memory -->
            <div class="mb-4 ml-2">
              <div class="text-h6 font-weight-bold">
                How much memory will your app need?
              </div>
              <div class="text-body-2 text-medium-emphasis">
                (min 100 MB / max 59000 MB)
              </div>
              <div class="d-flex justify-end" style="transform: translateY(-8px);">
                <VChip
                  color="success"
                  variant="tonal"
                  size="small"
                  rounded
                  class="mr-2"
                >
                  {{ formData.memory }} MB
                </VChip>
              </div>
              <VSlider
                v-model="formData.memory"
                :min="100"
                :max="59000"
                :step="100"
                color="primary"
                :thumb-label="false"
                @update:model-value="calculateCost"
              />
            </div>

            <!-- Storage -->
            <div class="mb-4 ml-2">
              <div class="text-h6 font-weight-bold">
                How much storage would you like?
              </div>
              <div class="text-body-2 text-medium-emphasis">
                (min 1 GB / max 820 GB)
              </div>
              <div class="d-flex justify-end" style="transform: translateY(-8px);">
                <VChip
                  color="success"
                  variant="tonal"
                  size="small"
                  rounded
                  class="mr-2"
                >
                  {{ formData.storage }} GB
                </VChip>
              </div>
              <VSlider
                v-model="formData.storage"
                :min="1"
                :max="820"
                :step="1"
                color="primary"
                :thumb-label="false"
                @update:model-value="calculateCost"
              />
            </div>
            </div>

            <VDivider class="my-6" />

            <!-- Enterprise Options -->
            <div class="mb-6">
              <div class="d-flex align-center mb-4">
                <VIcon icon="mdi-tune-variant" color="primary" size="32" class="mr-3" />
                <h4 class="text-h5 font-weight-bold mb-0">
                  Additional Options
                </h4>
              </div>
              
              <!-- Enterprise App -->
              <div class="mb-4">
                <VCheckbox
                  :model-value="formData.enterprise === 'enterprise'"
                  :disabled="!isEnterpriseAvailable"
                  label="Enterprise Application"
                  @update:model-value="(val) => { formData.enterprise = val ? 'enterprise' : ''; console.log('Enterprise changed:', val, 'to:', formData.enterprise); calculateCost(); }"
                />
                <p class="text-body-2 text-medium-emphasis ml-8">
                  <template v-if="isEnterpriseAvailable">
                    Enterprise applications run on Arcane OS with enhanced privacy protection, encrypted data handling, and priority deployment on specialized nodes
                  </template>
                  <template v-else-if="!isWebCryptoAvailable()">
                    Enterprise applications require HTTPS or localhost. Please use a secure connection to access enterprise features.
                  </template>
                  <template v-else>
                    Enterprise applications require authentication. Please log in to access enterprise features.
                  </template>
                </p>
              </div>

              <!-- Static IP -->
              <div class="mb-4">
                <VCheckbox
                  v-model="formData.staticip"
                  label="Static IP Address"
                  @change="() => { console.log('Static IP changed:', formData.staticip); calculateCost(); }"
                />
                <p class="text-body-2 text-medium-emphasis ml-8">
                  Assign a dedicated static IP address to your application
                </p>
              </div>

              <div class="mb-4">
                <VCheckbox
                  v-model="syncEnabled"
                  label="Synchronize data across instances"
                  @change="calculateCost"
                />
                <p class="text-body-2 text-medium-emphasis ml-8">
                  Enable data sync using Phased Master-Master (r) or Master-Slave (g) modes with shared storage. When disabled, each instance uses its own isolated persistent storage
                </p>
              </div>
            </div>

            <!-- Cost Display -->
            <VCard 
              variant="tonal" 
              color="primary"
              class="mb-6"
            >
              <VCardText>
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <h3 class="text-h6 font-weight-bold">
                      Estimated Deployment Cost
                    </h3>
                  </div>
                  <div class="text-end">
                    <div class="text-h5 font-weight-bold text-success">
                      <template v-if="calculating">
                        <div class="d-flex align-center justify-end">
                          <VIcon icon="tabler-loader" class="spinning-icon me-1" size="24" />
                          Calculating...
                        </div>
                      </template>
                      <template v-else>
                        {{ costResult.usd ? `$${costResult.usd} USD` : 'Calculating...' }}
                      </template>
                    </div>
                    <div v-if="!calculating" class="text-body-2">
                      {{ costResult.flux ? `${costResult.flux} FLUX` : '' }}
                      {{ costResult.discount ? `with ${costResult.discount}% discount` : '' }}
                    </div>
                    <!-- Retry button for errors -->
                    <div 
                      v-if="(typeof costResult.flux === 'string' && (costResult.flux.includes('unavailable') || costResult.flux.includes('error')))"
                      class="mt-2"
                    >
                      <VBtn
                        size="small"
                        variant="outlined"
                        color="primary"
                        :loading="calculating"
                        @click="calculateCost(0)"
                      >
                        <VIcon icon="tabler-refresh" class="me-1" />
                        Retry
                      </VBtn>
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <!-- Help Section -->
            <VCard variant="outlined">
              <VCardTitle>
                <VIcon 
                  icon="tabler-help" 
                  class="me-2" 
                />
                Help
              </VCardTitle>
              <VCardText>
                <VList class="pa-0">
                  <VListItem
                    v-for="helpItem in helpItems"
                    :key="helpItem.question"
                    class="px-0"
                  >
                    <VListItemTitle>
                      <a 
                        class="text-primary cursor-pointer"
                        @click="openHelpDialog(helpItem)"
                      >
                        {{ helpItem.question }}
                      </a>
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VCardText>
            </VCard>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Presets -->
      <VCol 
        cols="12" 
        md="6"
      >
        <VCard>
          <VCardTitle class="bg-primary text-white">Preset Configurations</VCardTitle>
          <VCardText class="pt-6">
            <VTable 
              class="preset-table border"
              density="compact"
              hover
            >
              <thead>
                <tr>
                  <th class="text-no-wrap">Nodes</th>
                  <th class="text-no-wrap">CPU</th>
                  <th class="text-no-wrap">RAM</th>
                  <th class="text-no-wrap">SSD</th>
                  <th class="text-no-wrap">Cost</th>
                  <th class="text-no-wrap"></th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="preset in presets"
                  :key="preset.id"
                >
                  <td class="text-no-wrap">{{ preset.nodes }}</td>
                  <td class="text-no-wrap">{{ preset.cpu }}</td>
                  <td class="text-no-wrap">{{ preset.ram }}GB</td>
                  <td class="text-no-wrap">{{ preset.ssd }}GB</td>
                  <td class="text-no-wrap">
                    <div class="text-body-2 text-primary">
                      <template v-if="preset.flux === '...'">...</template>
                      <template v-else>{{ preset.flux }} FLUX</template>
                    </div>
                    <div 
                      v-if="preset.usd && typeof preset.usd === 'number'"
                      class="text-caption text-medium-emphasis text-success"
                    >
                      ${{ preset.usd.toFixed(2) }} USD
                    </div>
                  </td>
                  <td class="text-no-wrap">
                    <VBtn
                      variant="flat"
                      size="x-small"
                      @click="selectPreset(preset)"
                    >
                      Select
                    </VBtn>
                  </td>
                </tr>
              </tbody>
            </VTable>

            <div 
              v-if="fluxUsdRate"
              class="mt-4 text-caption text-medium-emphasis"
            >
              *Estimated 1 Flux = ${{ fluxUsdRate.toFixed(2) }} USD
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Help Dialog -->
    <VDialog 
      v-model="helpDialog.show"
      max-width="650"
      :scrim="false"
    >
      <VCard
        elevation="12"
        rounded="xl"
        class="help-dialog"
      >
        <!-- Header with icon and close button -->
        <VCardTitle class="d-flex align-center pa-6 pb-4">
          <VAvatar
            size="40"
            color="primary"
            variant="tonal"
            class="me-3"
          >
            <VIcon 
              icon="tabler-help-circle" 
              size="24"
            />
          </VAvatar>
          <div class="flex-grow-1">
            <div class="text-h5 font-weight-bold text-primary">
              {{ helpDialog.item?.question }}
            </div>
          </div>
          <VBtn
            icon
            variant="text"
            size="small"
            @click="helpDialog.show = false"
          >
            <VIcon 
              icon="tabler-x" 
              size="20"
            />
          </VBtn>
        </VCardTitle>

        <!-- Content -->
        <VCardText class="px-6 pb-6">
          <div 
            class="text-body-1 line-height-relaxed"
            v-html="helpDialog.item?.answer" 
          />
        </VCardText>

        <!-- Footer with action button -->
        <VCardActions class="px-6 pb-6 pt-2">
          <VSpacer />
          <VBtn
            color="primary"
            variant="elevated"
            rounded
            @click="helpDialog.show = false"
          >
            <VIcon 
              icon="tabler-check" 
              size="16" 
              class="me-2"
            />
            Got it
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Toast Snackbar -->
    <VSnackbar
      v-model="snackbar"
      :timeout="5000"
      :color="snackbarColor"
      location="top center"
    >
      <div class="d-flex align-center">
        <VIcon 
          icon="mdi-alert" 
          class="mr-3" 
          size="32"
        />
        {{ snackbarMessage }}
      </div>
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import Api from '@/services/ApiClient'
import axios from 'axios'
import { encryptEnterpriseWithAes, encryptAesKeyWithRsaKey, importRsaPublicKey, isWebCryptoAvailable } from '@/utils/enterpriseCrypto'
import AppsService from '@/services/AppsService'

// Reactive form data
const formData = reactive({
  instances: 3,
  expire: 30,
  cpu: 0.1,
  memory: 100,
  storage: 1,
  enterprise: '',
  staticip: false,
})

// Synchronization switch
const syncEnabled = ref(false)


// Generate compose array with single component using formData
const generateComposeArray = () => {
  return [{
    name: "componentName1",
    description: "componentDesc1",
    repotag: "runonflux/jetpack2:latest",
    ports: "[33333]",
    domains: [""],
    environmentParameters: [""],
    commands: [""],
    containerPorts: [80],
    containerData: syncEnabled.value ? "g:/data" : "/tmp",
    cpu: formData.cpu.toString(),
    ram: formData.memory.toString(),
    hdd: formData.storage.toString(),
    tiered: false
  }]
}

// Cost calculation result
const costResult = reactive({
  flux: '',
  usd: '',
  discount: '',
})

// Other reactive data
const fluxUsdRate = ref(0)
const calculating = ref(false)
const helpDialog = reactive({
  show: false,
  item: null,
})

// Snackbar for toast notifications
const snackbar = ref(false)
const snackbarMessage = ref("")
const snackbarColor = ref("success")
const snackbarIcon = ref("mdi-check-circle")

// WebCrypto availability check for enterprise features
const isEnterpriseAvailable = computed(() => {
  const hasWebCrypto = isWebCryptoAvailable()
  const hasAuth = !!localStorage.getItem('zelidauth')
  return hasWebCrypto && hasAuth
})

// Renewal period options
const renewalOptions = [
  { title: '1 Week', value: 7 },
  { title: '2 Weeks', value: 14 },
  { title: '1 Month', value: 30 },
  { title: '3 Months', value: 90 },
  { title: '6 Months', value: 180 },
  { title: '12 Months', value: 360 },
]

// Preset configurations
const presets = ref([
  {
    id: 1,
    nodes: 3,
    cpu: 0.1,
    ram: 0.1,
    ssd: 1,
    flux: '...',
  },
  {
    id: 3,
    nodes: 3,
    cpu: 5,
    ram: 5,
    ssd: 50,
    flux: '...',
  },
  {
    id: 5,
    nodes: 3,
    cpu: 15,
    ram: 59,
    ssd: 840,
    flux: '...',
  },
  {
    id: 6,
    nodes: 10,
    cpu: 10,
    ram: 10,
    ssd: 100,
    flux: '...',
  },
  {
    id: 7,
    nodes: 50,
    cpu: 5,
    ram: 10,
    ssd: 100,
    flux: '...',
  },
  {
    id: 10,
    nodes: 100,
    cpu: 10,
    ram: 40,
    ssd: 500,
    flux: '...',
  },
  {
    id: 11,
    nodes: 100,
    cpu: 15,
    ram: 59,
    ssd: 840,
    flux: '...',
  },
])

// Help items
const helpItems = [
  {
    question: 'What is an instance?',
    answer: `An instance is a Flux Node, which is like a Docker Container, holding a copy of your application. 
      We deploy to 3 instances minimum on the Flux network to ensure service continuity of your application using load balancing. 
      If one node goes down, another will automatically spin up and replicate your app, seamlessly in the background, 
      without end users noticing any loss of service or change.`,
  },
  {
    question: 'Can I change the specs later?',
    answer: `Yes, you can always increase or decrease any of the parameters as you see fit! This is all managed
      via FluxOS <a href="https://home.runonflux.io" target="_blank">home.runonflux.io</a>`,
  },
  {
    question: 'What is a component?',
    answer: `<p>A component is one Docker image. If your project has two docker images, 
      for example, a front end (node.js, html, css) and a backend (mongodb) that is classed as two components.</p>
      <p>Therefore the estimated component cost should be multiplied by how many docker images your project uses.</p>`,
  },
  {
    question: 'What does "Synchronize data across instances" mean?',
    answer: `<p><strong>"Synchronize data across instances"</strong> enables data synchronization across all instances of your application using either Phased Master-Master (r) or Master-Slave (g) mode.</p>
      <p><strong>When enabled (g:/data):</strong></p>
      <ul>
        <li><strong>Phased Master-Master (r):</strong> Controlled two-way sync that prevents data overwrites during startup</li>
        <li><strong>Master-Slave (g):</strong> One-way sync from master instance to others for consistent read-only data</li>
        <li>Shared persistent storage that survives instance restarts</li>
        <li>Perfect for applications that need shared state, configuration, or file storage</li>
      </ul>
      <br>
      <p><strong>When disabled (/tmp):</strong></p>
      <ul>
        <li>Each instance has its own isolated persistent storage</li>
        <li>No data sharing between instances</li>
        <li>Each node maintains its own independent data that persists across restarts</li>
        <li>Better for applications where instances should operate independently</li>
      </ul>`,
  },
]

// Methods
const calculateCost = async (retryCount = 0) => {
  console.log('calculateCost called with retryCount:', retryCount)
  console.log('Current form data:', formData)
  
  if (calculating.value) {
    console.log('Already calculating, returning early')
    return
  }
  
  const startTime = Date.now() // Capture start time for minimum display duration
  
  calculating.value = true
  costResult.flux = 'Calculating...'
  costResult.usd = ''
  costResult.discount = ''

  try {
    const expire = formData.expire <= 30 
      ? Math.round((formData.expire * 720) / 1000) * 1000 
      : (formData.expire / 30) * 22000

    let enterpriseValue = formData.enterprise

    // If enterprise is enabled, prepare enterprise data for v8+
    if (formData.enterprise === 'enterprise') {
      if (!isWebCryptoAvailable()) {
        // Gracefully disable enterprise mode and show warning instead of blocking
        console.warn('WebCrypto API is not available. Enterprise mode disabled. Please use HTTPS or localhost for enterprise applications.')
        
        // Show user-friendly toast instead of error in cost display
        showToast('warning', 'Enterprise features require HTTPS or localhost. Please access this application using a secure connection.')
        
        // Reset enterprise mode and continue with normal calculation
        formData.enterprise = '' // Reset to standard mode
        enterpriseValue = ''
        
        // Small delay to ensure toast is visible before continuing
        await new Promise(resolve => setTimeout(resolve, 100))
        // Don't return - continue with normal calculation
      }
      
      try {
        // For version 8+ new apps, we need to get the RSA public key using getAppPublicKey
        console.log('Getting public key for enterprise encryption...')
        const zelidauth = localStorage.getItem('zelidauth')
        
        const pubKeyResponse = await AppsService.getAppPublicKey(zelidauth, {
          name: 'costcalc',
          owner: '176iuPFBqD4yg3Fd7oPVhB3d4NXWxvQyxx',
        })
        
        console.log('getAppPublicKey response:', pubKeyResponse.data)
        
        if (pubKeyResponse.data.status !== 'success') {
          const errorMsg = typeof pubKeyResponse.data.data === 'object' 
            ? JSON.stringify(pubKeyResponse.data.data) 
            : pubKeyResponse.data.data || pubKeyResponse.data.message || 'Unknown error'
          throw new Error(`Failed to get public key: ${errorMsg}`)
        }
        
        const pubKeyB64 = pubKeyResponse.data.data.trim().replace(/\s+/g, '')
        const rsaPubKey = await importRsaPublicKey(pubKeyB64)
        
        // Generate AES key and encrypt enterprise data
        const aesKey = crypto.getRandomValues(new Uint8Array(32))
        const encryptedAesKey = await encryptAesKeyWithRsaKey(aesKey, rsaPubKey)
        
        // For version 8+, encrypt contacts and compose data (as done in SubscriptionManager)
        const enterpriseSpecs = {
          contacts: [""],
          compose: generateComposeArray()
        }
        
        console.log('Enterprise specs to encrypt:', enterpriseSpecs)
        
        enterpriseValue = await encryptEnterpriseWithAes(
          JSON.stringify(enterpriseSpecs),
          aesKey,
          encryptedAesKey
        )
        
        console.log('Enterprise encryption completed, encrypted length:', enterpriseValue.length)
      } catch (encryptError) {
        console.error('Enterprise encryption failed:', encryptError)
        throw new Error(`Enterprise encryption failed: ${encryptError.message}`)
      }
    }

    // For version 8+, when enterprise is enabled, compose and contacts are encrypted and moved to enterprise field
    const isEnterpriseEnabled = formData.enterprise === 'enterprise'
    const composeData = isEnterpriseEnabled ? [] : generateComposeArray()
    const contactsData = isEnterpriseEnabled ? [] : [""]

    // Create payload object first, then stringify
    const payloadObj = {
      version: 8,
      name: "costcalc",
      description: "costcalc",
      owner: "176iuPFBqD4yg3Fd7oPVhB3d4NXWxvQyxx",
      compose: composeData,
      instances: formData.instances,
      nodes: [],
      contacts: contactsData,
      geolocation: [""],
      expire: expire,
      enterprise: enterpriseValue,
      staticip: formData.staticip
    }
    
    const payload = JSON.stringify(payloadObj)

    // Debug enterprise pricing
    console.log('Enterprise enabled:', formData.enterprise, 'Static IP:', formData.staticip)
    console.log('Enterprise value (encrypted if applicable):', enterpriseValue)
    console.log('Payload object:', payloadObj)
    console.log('Cost calculation payload (JSON):', payload)
    
    const response = await Api().post(
      '/apps/calculatefiatandfluxprice',
      payload,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000, // 15 second timeout
      }
    )

    console.log('Cost calculation response:', response.data)

    if (response.data.status !== 'error') {
      // Add a minimum delay to show the animation
      const minDisplayTime = 1000 
      
      await new Promise(resolve => {
        const elapsed = Date.now() - startTime
        const remainingTime = Math.max(0, minDisplayTime - elapsed)
        setTimeout(resolve, remainingTime)
      })
      
      costResult.flux = response.data.data.flux
      costResult.usd = response.data.data.usd
      costResult.discount = response.data.data.fluxDiscount
    } else {
      throw new Error(response.data.message || 'Failed to calculate cost')
    }
  } catch (error) {
    console.error('Error calculating cost:', error)
    
    // Handle different error types with toast notifications
    if (error.code === 'ERR_NETWORK' || error.response?.status === 504 || error.response?.status >= 500) {
      // Network or server error - try retry
      if (retryCount < 2) {
        costResult.flux = `Retrying... (${retryCount + 1}/3)`
        calculating.value = false
        setTimeout(() => calculateCost(retryCount + 1), 2000) // Retry after 2 seconds
        return
      } else {
        showToast('error', 'API server unavailable. Please try again later.')
      }
    } else if (error.response?.status === 400) {
      showToast('warning', 'Invalid configuration. Please check your settings.')
    } else {
      showToast('error', 'Calculation error. Please try again.')
    }
    
    // Keep previous values or show empty if no previous calculation
    if (!costResult.flux || costResult.flux === 'Calculating...') {
      costResult.flux = '- FLUX'
      costResult.usd = '- USD' 
      costResult.discount = ''
    }
  } finally {
    calculating.value = false
  }
}

function showToast(type, message) {
  snackbarMessage.value = message
  snackbarColor.value = type === "danger" ? "error" : type
  
  // Set appropriate icon based on toast type
  const iconMap = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert-triangle',
    info: 'mdi-information',
    danger: 'mdi-alert-circle',
  }
  snackbarIcon.value = iconMap[type] || 'mdi-information'
  
  snackbar.value = true
}

const selectPreset = preset => {
  formData.instances = preset.nodes
  formData.cpu = preset.cpu
  formData.memory = preset.ram * 1000
  formData.storage = preset.ssd
  // Reset to default 1-month expiration (same as preset calculations)
  formData.expire = 30
  // Reset enterprise options when selecting preset
  formData.enterprise = ''
  formData.staticip = false
  // Reset synchronization to disabled when selecting preset
  syncEnabled.value = false
  calculateCost()
}

const openHelpDialog = item => {
  helpDialog.item = item
  helpDialog.show = true
}


const fetchFluxPrice = async () => {
  try {
    // Always use external API for currency conversion
    const response = await axios.get('https://explorer.runonflux.io/api/currency')
    
    if (response.data?.data?.rate) {
      fluxUsdRate.value = response.data.data.rate
    }
  } catch (error) {
    console.error('Error fetching Flux price:', error)
  }
}

// Calculate preset prices
const calculatePresetPrices = async () => {
  for (const preset of presets.value) {
    try {
      // Create temporary form data for this preset
      const tempFormData = {
        instances: preset.nodes,
        expire: 30, // Default to 1 month
        cpu: preset.cpu,
        memory: preset.ram * 1000, // Convert GB to MB
        storage: preset.ssd,
        enterprise: '', // Standard pricing
        staticip: false,
      }

      const expire = tempFormData.expire <= 30 
        ? Math.round((tempFormData.expire * 720) / 1000) * 1000 
        : (tempFormData.expire / 30) * 22000

      // Generate compose array for this preset
      const composeData = [{
        name: "componentName1",
        description: "componentDesc1", 
        repotag: "runonflux/jetpack2:latest",
        ports: "[33333]",
        domains: [""],
        environmentParameters: [""],
        commands: [""],
        containerPorts: [80],
        containerData: "/tmp",
        cpu: tempFormData.cpu.toString(),
        ram: tempFormData.memory.toString(),
        hdd: tempFormData.storage.toString(),
        tiered: false
      }]

      const payloadObj = {
        version: 8,
        name: "preset-calc",
        description: "preset-calc",
        owner: "176iuPFBqD4yg3Fd7oPVhB3d4NXWxvQyxx",
        compose: composeData,
        instances: tempFormData.instances,
        nodes: [],
        contacts: [""],
        geolocation: [""],
        expire: expire,
        enterprise: "",
        staticip: tempFormData.staticip
      }

      const response = await Api().post(
        '/apps/calculatefiatandfluxprice',
        JSON.stringify(payloadObj),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 15000,
        }
      )

      if (response.data.status !== 'error' && response.data.data.flux) {
        preset.flux = parseFloat(response.data.data.flux)
        preset.usd = parseFloat(response.data.data.usd) // Store USD from API
      }
    } catch (error) {
      console.error(`Error calculating preset ${preset.id}:`, error)
      preset.flux = 'Error'
    }
  }
}

// Lifecycle
onMounted(async () => {
  // Check WebCrypto availability and inform users about HTTPS requirement for enterprise features
  if (!isWebCryptoAvailable()) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const isHttps = window.location.protocol === 'https:'
    
    if (!isHttps && !isLocalhost) {
      // Show warning toast about enterprise feature limitations on HTTP
      setTimeout(() => {
        showToast('warning', 'Enterprise features require HTTPS. Only standard deployments available on HTTP.')
      }, 1000) // Delay to let page load completely
    }
  }
  
  await fetchFluxPrice()
  await calculateCost()
  await calculatePresetPrices()
})

// Define page meta
definePage({
  meta: {
    layout: 'default',
    requiresAuth: false,
  },
})
</script>

<style scoped>
/* Force white text on primary background for both themes */
.bg-primary.text-white {
  color: white !important;
}

.v-theme--dark .bg-primary.text-white,
.v-theme--light .bg-primary.text-white {
  color: white !important;
}

/* Rounded table with borders */
.preset-table {
  border-radius: 8px !important;
  overflow: hidden;
  width: 100%;
  table-layout: fixed;
}

.preset-table td,
.preset-table th {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-table th:nth-child(5),
.preset-table td:nth-child(5) {
  min-width: 70px;
  max-width: 90px;
}

.preset-table.border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px !important;
}

.cost-calculator-page {
  padding: 5px 24px 24px 24px;
}

.cursor-pointer {
  cursor: pointer;
}

/* Preset table styling */
.preset-table {
  font-size: 0.875rem !important;
}

.preset-table th,
.preset-table td {
  font-size: 0.8rem !important;
  white-space: nowrap !important;
  padding: 8px 12px !important;
}

.preset-table th {
  font-weight: 600 !important;
}

.preset-table tbody tr:hover {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
}

.preset-table .text-body-2 {
  font-size: 0.8rem !important;
  font-weight: 500 !important;
}

.preset-table .text-caption {
  font-size: 0.7rem !important;
}

/* Help dialog styling */
.help-dialog {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.help-dialog .v-card-title {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.line-height-relaxed {
  line-height: 1.6;
}

/* Enhance dialog animation */
.v-dialog > .v-overlay__content {
  animation: dialogSlideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

@keyframes dialogSlideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Spinning animation for loader icon */
.spinning-icon {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>