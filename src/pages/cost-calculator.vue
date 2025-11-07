<template>
  <div class="cost-calculator-page">
    <!-- Page Header -->
    <VCard 
      class="mb-6"
      variant="tonal"
      color="primary"
      elevation="2"
    >
      <VCardText class="pa-6 pa-sm-8">
        <div class="d-flex align-center flex-column flex-sm-row text-center text-sm-start">
          <VAvatar
            size="72"
            color="primary"
            variant="tonal"
            class="mb-4 mb-sm-0 me-sm-4"
          >
            <VIcon 
              icon="tabler-calculator" 
              size="40"
            />
          </VAvatar>
          <div>
            <h1 class="text-h4 text-sm-h3 font-weight-bold mb-2">
              {{ t('pages.costCalculator.title') }}
            </h1>
            <p class="text-body-1 text-sm-h6 text-medium-emphasis mb-0">
              {{ t('pages.costCalculator.subtitle') }}
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
          <VCardTitle class="bg-primary text-white">{{ t('pages.costCalculator.configuration') }}</VCardTitle>
          <VCardText class="pt-6">
            <!-- Instances -->
            <div class="mb-6">
              <div class="d-flex align-start mb-2">
                <VIcon icon="mdi-server-network" color="primary" size="28" class="mr-3" />
                <div>
                  <div class="text-h6 font-weight-bold">
                    {{ t('pages.costCalculator.instancesQuestion') }}
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-0 mt-1">
                    {{ t('pages.costCalculator.instancesHint') }}
                  </p>
                </div>
              </div>
              <VTextField
                v-model.number="formData.instances"
                type="number"
                :min="3"
                :max="100"
                :rules="[
                  v => !!v || t('pages.costCalculator.validation.instancesRequired'),
                  v => v >= 3 || t('pages.costCalculator.validation.instancesMin'),
                  v => v <= 100 || t('pages.costCalculator.validation.instancesMax')
                ]"
                :placeholder="t('pages.costCalculator.instancesPlaceholder')"
                @input="calculateCost"
              />
            </div>

            <!-- Renewal Period -->
            <div class="mb-6">
              <div class="d-flex align-start mb-2">
                <VIcon icon="mdi-calendar-clock" color="primary" size="28" class="mr-3" />
                <div>
                  <div class="text-h6 font-weight-bold">
                    {{ t('pages.costCalculator.renewalPeriod') }}
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-0 mt-1">
                    {{ t('pages.costCalculator.renewalHint') }}
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
                  {{ t('pages.costCalculator.hardwareResources') }}
                </h4>
              </div>
              
              <!-- CPU Cores -->
              <div class="mb-4 ml-2">
                <div class="text-h6 font-weight-bold">
                  {{ t('pages.costCalculator.cpuQuestion') }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ t('pages.costCalculator.cpuRange') }}
                </div>
                <div class="d-flex justify-end" style="transform: translateY(-8px);">
                  <VChip
                    color="success"
                    variant="tonal"
                    size="small"
                    rounded
                    style="width: 85px; justify-content: center;"
                  >
                    {{ formData.cpu }} vCores
                  </VChip>
                </div>
                <div class="d-flex align-center gap-3">
                  <VSlider
                    v-model="formData.cpu"
                    :min="0.1"
                    :max="15.0"
                    :step="0.1"
                    color="primary"
                    :thumb-label="false"
                    class="flex-grow-1"
                    @update:model-value="calculateCost"
                  />
                  <VTextField
                    v-model.number="formData.cpu"
                    type="number"
                    :min="0.1"
                    :max="15.0"
                    :step="0.1"
                    density="compact"
                    hide-details
                    style="max-width: 85px;"
                    @update:model-value="calculateCost"
                  />
                </div>
              </div>

              <!-- Memory -->
              <div class="mb-4 ml-2">
                <div class="text-h6 font-weight-bold">
                  {{ t('pages.costCalculator.memoryQuestion') }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ t('pages.costCalculator.memoryRange') }}
                </div>
                <div class="d-flex justify-end" style="transform: translateY(-8px);">
                  <VChip
                    color="success"
                    variant="tonal"
                    size="small"
                    rounded
                    style="width: 85px; justify-content: center;"
                  >
                    {{ formData.memory }} MB
                  </VChip>
                </div>
                <div class="d-flex align-center gap-3">
                  <VSlider
                    v-model="formData.memory"
                    :min="100"
                    :max="59000"
                    :step="100"
                    color="primary"
                    :thumb-label="false"
                    class="flex-grow-1"
                    @update:model-value="calculateCost"
                  />
                  <VTextField
                    v-model.number="formData.memory"
                    type="number"
                    :min="100"
                    :max="59000"
                    :step="100"
                    density="compact"
                    hide-details
                    style="max-width: 85px;"
                    @update:model-value="calculateCost"
                  />
                </div>
              </div>

              <!-- Storage -->
              <div class="mb-4 ml-2">
                <div class="text-h6 font-weight-bold">
                  {{ t('pages.costCalculator.storageQuestion') }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ t('pages.costCalculator.storageRange') }}
                </div>
                <div class="d-flex justify-end" style="transform: translateY(-8px);">
                  <VChip
                    color="success"
                    variant="tonal"
                    size="small"
                    rounded
                    style="width: 85px; justify-content: center;"
                  >
                    {{ formData.storage }} GB
                  </VChip>
                </div>
                <div class="d-flex align-center gap-3">
                  <VSlider
                    v-model="formData.storage"
                    :min="1"
                    :max="820"
                    :step="1"
                    color="primary"
                    :thumb-label="false"
                    class="flex-grow-1"
                    @update:model-value="calculateCost"
                  />
                  <VTextField
                    v-model.number="formData.storage"
                    type="number"
                    :min="1"
                    :max="820"
                    :step="1"
                    density="compact"
                    hide-details
                    style="max-width: 85px;"
                    @update:model-value="calculateCost"
                  />
                </div>
              </div>
            </div>


            <VDivider class="my-6" />

            <!-- Application Ports Section -->
            <div class="mb-6">
              <div class="d-flex align-center mb-4">
                <VIcon icon="mdi-ethernet" color="primary" size="32" class="mr-3" />
                <h4 class="text-h5 font-weight-bold mb-0">
                  {{ t('pages.costCalculator.exposedPorts') }}
                </h4>
              </div>

              <div class="mb-4 ml-2">
                <VTextField
                  v-model="newPortInput"
                  :label="t('pages.costCalculator.addExposedPort')"
                  :placeholder="t('pages.costCalculator.portPlaceholder')"
                  @keypress="handlePortInputKeypress"
                  clearable
                  class="mb-3 no-spinners"
                />
                
                <div v-if="parsedPorts.length > 0" class="mb-3">
                  <div class="d-flex flex-wrap gap-2">
                    <VChip
                      v-for="port in parsedPorts"
                      :key="port"
                      :color="isPortEnterprise(port) ? 'warning' : 'success'"
                      :variant="isPortEnterprise(port) ? 'elevated' : 'tonal'"
                      size="small"
                      rounded
                      closable
                      @click:close="removePort(port)"
                    >
                      <VIcon 
                        v-if="isPortEnterprise(port)" 
                        icon="mdi-alert" 
                        size="14" 
                        class="mr-1"
                      />
                      {{ port }}
                      <span v-if="isPortEnterprise(port)" class="ml-1 text-caption">{{ t('pages.costCalculator.portFee') }}</span>
                    </VChip>
                  </div>
                </div>

                <p class="text-body-2 text-medium-emphasis">
                  <template v-if="enterprisePortCount > 0">
                    <span class="text-warning font-weight-medium">{{ enterprisePortCount }} {{ t('pages.costCalculator.enterprisePort', enterprisePortCount) }}</span> {{ t('pages.costCalculator.enterprisePortDetected') }}<br>
                    {{ t('pages.costCalculator.enterprisePortInfo') }}
                  </template>
                  <template v-else-if="parsedPorts.length > 0">
                    {{ t('pages.costCalculator.standardPorts') }}
                  </template>
                  <template v-else>
                    {{ t('pages.costCalculator.addPortsHint') }}
                  </template>
                </p>
              </div>
            </div>

            <VDivider class="my-6" />

            <!-- Additional Options -->
            <div class="mb-6">
              <div class="d-flex align-center mb-4">
                <VIcon icon="mdi-tune-variant" color="primary" size="32" class="mr-3" />
                <h4 class="text-h5 font-weight-bold mb-0">
                  {{ t('pages.costCalculator.additionalOptions') }}
                </h4>
              </div>
              
              <!-- Enterprise App -->
              <div class="mb-4">
                <VCheckbox
                  :model-value="formData.enterprise === 'enterprise'"
                  :disabled="!isEnterpriseAvailable"
                  :label="t('pages.costCalculator.enterpriseApplication')"
                  @update:model-value="(val) => { formData.enterprise = val ? 'enterprise' : ''; console.log('Enterprise changed:', val, 'to:', formData.enterprise); calculateCost(); }"
                />
                <p class="text-body-2 ml-8" :class="isEnterpriseAvailable ? 'text-medium-emphasis' : 'text-error'">
                  <template v-if="isEnterpriseAvailable">
                    {{ t('pages.costCalculator.enterpriseDescription') }}
                  </template>
                  <template v-else-if="!isWebCryptoAvailable()">
                    {{ t('pages.costCalculator.enterpriseHttpsRequired') }}
                  </template>
                  <template v-else>
                    {{ t('pages.costCalculator.enterpriseAuthRequired') }}
                  </template>
                </p>
              </div>

              <!-- Static IP -->
              <div class="mb-4">
                <VCheckbox
                  v-model="formData.staticip"
                  :label="t('pages.costCalculator.staticIp')"
                  @change="() => { console.log('Static IP changed:', formData.staticip); calculateCost(); }"
                />
                <p class="text-body-2 text-medium-emphasis ml-8">
                  {{ t('pages.costCalculator.staticIpDescription') }}
                </p>
              </div>

              <!-- Data Synchronization -->
              <div class="mb-4">
                <VCheckbox
                  v-model="syncEnabled"
                  :label="t('pages.costCalculator.syncData')"
                  @change="calculateCost"
                />
                <p class="text-body-2 text-medium-emphasis ml-8">
                  {{ t('pages.costCalculator.syncDataDescription') }}
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
                      {{ t('pages.costCalculator.estimatedCost') }}
                    </h3>
                  </div>
                  <div class="text-end">
                    <div class="text-h5 font-weight-bold text-success">
                      <template v-if="calculating">
                        <div class="d-flex align-center justify-end">
                          <VIcon icon="tabler-loader" class="spinning-icon me-1" size="24" />
                          {{ t('pages.costCalculator.calculating') }}
                        </div>
                      </template>
                      <template v-else>
                        {{ costResult.usd ? `$${costResult.usd} USD` : t('pages.costCalculator.calculating') }}
                      </template>
                    </div>
                    <div v-if="!calculating" class="text-body-2">
                      {{ costResult.flux ? `${costResult.flux} FLUX` : '' }}
                      {{ costResult.discount ? t('pages.costCalculator.withDiscount', { discount: costResult.discount }) : '' }}
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
                        {{ t('pages.costCalculator.retry') }}
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
                {{ t('pages.costCalculator.helpTitle') }}
              </VCardTitle>
              <VCardText>
                <VList class="pa-0">
                  <VListItem
                    v-for="helpItem in helpItems"
                    :key="helpItem.question"
                    class="help-link-item"
                    @click="openHelpDialog(helpItem)"
                  >
                    <VListItemTitle class="text-grey cursor-pointer font-weight-medium">
                      {{ helpItem.question }}
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
          <VCardTitle class="bg-primary text-white">{{ t('pages.costCalculator.presetConfigurations') }}</VCardTitle>
          <VCardText class="pt-6">
            <VTable 
              class="preset-table border"
              density="compact"
              hover
            >
              <thead>
                <tr>
                  <th class="text-no-wrap">{{ t('pages.costCalculator.nodes') }}</th>
                  <th class="text-no-wrap">{{ t('pages.costCalculator.cpu') }}</th>
                  <th class="text-no-wrap">{{ t('pages.costCalculator.ram') }}</th>
                  <th class="text-no-wrap">{{ t('pages.costCalculator.ssd') }}</th>
                  <th class="text-no-wrap d-none d-sm-table-cell">{{ t('pages.costCalculator.cost') }}</th>
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
                  <td class="text-no-wrap d-none d-sm-table-cell">
                    <div class="text-caption text-primary">
                      <template v-if="preset.flux === '...'">...</template>
                      <template v-else>
                        {{ typeof preset.flux === 'number'
                          ? preset.flux.toFixed(2)
                          : preset.flux
                        }} FLUX
                      </template>
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
                      {{ t('pages.costCalculator.select') }}
                    </VBtn>
                  </td>
                </tr>
              </tbody>
            </VTable>

            <div
              v-if="fluxUsdRate"
              class="mt-4 text-caption text-medium-emphasis"
            >
              {{ t('pages.costCalculator.estimatedRate', { rate: fluxUsdRate.toFixed(2) }) }}
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
        <VCardTitle class="d-flex align-center pa-3 bg-primary text-white">
          <VAvatar
            size="36"
            color="rgba(255, 255, 255, 0.2)"
            class="ms-3 me-2"
          >
            <VIcon
              icon="tabler-help-circle"
              size="24"
              color="white"
            />
          </VAvatar>
          <div class="flex-grow-1">
            <div class="text-h5 font-weight-bold" style="color: white !important;">
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
              color="white"
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
            {{ t('pages.costCalculator.gotIt') }}
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
import { useI18n } from 'vue-i18n'
import Api from '@/services/ApiClient'
import axios from 'axios'
import { encryptEnterpriseWithAes, encryptAesKeyWithRsaKey, importRsaPublicKey, isWebCryptoAvailable } from '@/utils/enterpriseCrypto'
import AppsService from '@/services/AppsService'

const { t } = useI18n()

// Reactive form data
const formData = reactive({
  instances: 3,
  expire: 30,
  cpu: 0.1,
  memory: 100,
  storage: 1,
  enterprise: '',
  staticip: false,
  ports: [], // No default ports
})

// Synchronization switch
const syncEnabled = ref(false)

// Port input for adding new ports
const newPortInput = ref('')


// Generate compose array with single component using formData
const generateComposeArray = () => {
  return [{
    name: "componentName1",
    description: "componentDesc1",
    repotag: "runonflux/jetpack2:latest",
    ports: parsedPorts.value.length > 0 ? parsedPorts.value : [3000], // Use user-defined ports or default to 3000
    domains: [""],
    environmentParameters: [""],
    commands: [""],
    containerPorts: parsedPorts.value.length > 0 ? parsedPorts.value : [3000], // Match ports with containerPorts
    containerData: syncEnabled.value ? "g:/data" : "/tmp",
    cpu: formData.cpu.toString(),
    ram: formData.memory.toString(),
    hdd: formData.storage.toString(),
    tiered: false,
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

// Enterprise port detection logic (from backend config)
const enterprisePortRanges = ['0-1023', 8080, 8081, 8443, 6667]

const isPortEnterprise = port => {
  const portNum = parseInt(port)
  if (isNaN(portNum)) return false
  
  return enterprisePortRanges.some(range => {
    if (typeof range === 'string' && range.includes('-')) {
      const [min, max] = range.split('-').map(p => parseInt(p))
      
      return portNum >= min && portNum <= max
    } else {
      return portNum === parseInt(range)
    }
  })
}

const parsedPorts = computed(() => {
  if (!Array.isArray(formData.ports)) return []
  
  return formData.ports.filter(p => p > 0 && p <= 65535)
})

const enterprisePorts = computed(() => {
  return parsedPorts.value.filter(port => isPortEnterprise(port))
})

const enterprisePortCount = computed(() => enterprisePorts.value.length)

// Port management functions
const addPort = () => {
  const portValue = newPortInput.value.trim()
  if (!portValue) return
  
  const port = parseInt(portValue)
  if (isNaN(port) || port <= 0 || port > 65535) {
    newPortInput.value = ''
    
    return
  }
  
  // Prevent duplicates
  if (formData.ports.includes(port)) {
    newPortInput.value = ''
    
    return
  }
  
  formData.ports.push(port)
  formData.ports.sort((a, b) => a - b) // Keep ports sorted
  newPortInput.value = ''
  calculateCost()
}

const removePort = port => {
  const index = formData.ports.indexOf(port)
  if (index > -1) {
    formData.ports.splice(index, 1)
    calculateCost()
  }
}

const handlePortInputKeypress = event => {
  // Only allow numbers and Enter key
  if (event.key === 'Enter') {
    event.preventDefault()
    addPort()
  } else if (!/^\d$/.test(event.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
    event.preventDefault()
  }
}

// Renewal period options
const renewalOptions = computed(() => [
  { title: t('pages.costCalculator.renewalOptions.oneWeek'), value: 7 },
  { title: t('pages.costCalculator.renewalOptions.twoWeeks'), value: 14 },
  { title: t('pages.costCalculator.renewalOptions.oneMonth'), value: 30 },
  { title: t('pages.costCalculator.renewalOptions.threeMonths'), value: 90 },
  { title: t('pages.costCalculator.renewalOptions.sixMonths'), value: 180 },
  { title: t('pages.costCalculator.renewalOptions.twelveMonths'), value: 360 },
])

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
const helpItems = computed(() => [
  {
    question: t('pages.costCalculator.help.instanceQuestion'),
    answer: t('pages.costCalculator.help.instanceAnswer'),
  },
  {
    question: t('pages.costCalculator.help.changeSpecsQuestion'),
    answer: t('pages.costCalculator.help.changeSpecsAnswer'),
  },
  {
    question: t('pages.costCalculator.help.componentQuestion'),
    answer: t('pages.costCalculator.help.componentAnswer'),
  },
  {
    question: t('pages.costCalculator.help.syncDataQuestion'),
    answer: t('pages.costCalculator.help.syncDataAnswer'),
  },
  {
    question: t('pages.costCalculator.help.portsQuestion'),
    answer: t('pages.costCalculator.help.portsAnswer'),
  },
])

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
  costResult.flux = t('pages.costCalculator.calculating')
  costResult.usd = ''
  costResult.discount = ''

  try {
    // Post-fork: 88000 blocks = 1 month (30 days)
    const expire = Math.round(((formData.expire / 30) * 88000) / 1000) * 1000

    let enterpriseValue = formData.enterprise

    // If enterprise is enabled, prepare enterprise data for v8+
    if (formData.enterprise === 'enterprise') {
      if (!isWebCryptoAvailable()) {
        // Gracefully disable enterprise mode and show warning instead of blocking
        console.warn('WebCrypto API is not available. Enterprise mode disabled. Please use HTTPS or localhost for enterprise applications.')

        // Show user-friendly toast instead of error in cost display
        showToast('warning', t('pages.costCalculator.messages.enterpriseHttpsWarning'))

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
          compose: generateComposeArray(),
        }
        
        console.log('Enterprise specs to encrypt:', enterpriseSpecs)
        
        enterpriseValue = await encryptEnterpriseWithAes(
          JSON.stringify(enterpriseSpecs),
          aesKey,
          encryptedAesKey,
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
      staticip: formData.staticip,
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
      },
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
        costResult.flux = t('pages.costCalculator.messages.retrying', { count: retryCount + 1 })
        calculating.value = false
        setTimeout(() => calculateCost(retryCount + 1), 2000) // Retry after 2 seconds

        return
      } else {
        showToast('error', t('pages.costCalculator.messages.apiUnavailable'))
      }
    } else if (error.response?.status === 400) {
      showToast('warning', t('pages.costCalculator.messages.invalidConfig'))
    } else {
      showToast('error', t('pages.costCalculator.messages.calculationError'))
    }

    // Keep previous values or show empty if no previous calculation
    if (!costResult.flux || costResult.flux === t('pages.costCalculator.calculating')) {
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

  // Reset ports to empty array
  formData.ports = []

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

      // Post-fork: 88000 blocks = 1 month (30 days)
      const expire = Math.round(((tempFormData.expire / 30) * 88000) / 1000) * 1000

      // Generate compose array for this preset (use default port 3000 to match post-selection)
      const composeData = [{
        name: "componentName1",
        description: "componentDesc1",
        repotag: "runonflux/jetpack2:latest",
        ports: [3000], // Default port to match post-selection behavior
        domains: [""],
        environmentParameters: [""],
        commands: [""],
        containerPorts: [3000],
        containerData: "/tmp",
        cpu: tempFormData.cpu.toString(),
        ram: tempFormData.memory.toString(),
        hdd: tempFormData.storage.toString(),
        tiered: false,
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
        staticip: tempFormData.staticip,
      }

      const response = await Api().post(
        '/apps/calculatefiatandfluxprice',
        JSON.stringify(payloadObj),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 15000,
        },
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
        showToast('warning', t('pages.costCalculator.messages.httpsWarning'))
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
/* Hide number input spinners */
.no-spinners :deep(input[type="number"]::-webkit-inner-spin-button),
.no-spinners :deep(input[type="number"]::-webkit-outer-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.no-spinners :deep(input[type="number"]) {
  -moz-appearance: textfield;
}

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

/* Ensure help links stay blue even when truncated */
.v-list-item-title.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}

.v-list-item-title.text-primary:hover {
  text-decoration: underline;
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

/* Help link hover effect - full width chip style */
.help-link-item {
  border-radius: 8px !important;
  transition: background-color 0.2s ease;
  min-height: 36px !important;
  padding: 6px 12px !important;
  margin: 0 !important;
}

.help-link-item .v-list-item__overlay {
  border-radius: 8px !important;
}

.help-link-item .v-list-item__content {
  padding: 0 !important;
}

.help-link-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
}

.help-link-item:hover .v-list-item__overlay {
  opacity: 0 !important;
}
</style>