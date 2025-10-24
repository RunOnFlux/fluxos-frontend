<template>
  <VDialog
    v-model="dialogVisible"
    :max-width="$vuetify.display.xs ? '95vw' : '900'"
    :fullscreen="$vuetify.display.xs"
    scrollable
  >
    <VCard v-if="proposal">
      <VCardTitle class="bg-primary pa-4" style="color: white !important;">
        <div class="d-flex align-center">
          <VIcon icon="mdi-clipboard-text-outline" class="me-3" color="white" />
          <span class="text-h5" style="color: white !important;">{{ t('components.xdao.proposalDetail.title') }}</span>
        </div>
      </VCardTitle>

      <VCardText class="pa-4 pa-sm-6">
        <!-- Proposal Header -->
        <div class="mb-6">
          <div class="d-flex justify-space-between align-start mb-3">
            <div class="flex-grow-1">
              <h2 class="text-h5 font-weight-bold mb-3" v-sanitize-html="formatDescription(proposal.topic)"></h2>
            </div>
            <VChip
              :color="getStatusColor(proposal.status)"
              variant="elevated"
              size="large"
            >
              {{ formatStatus(proposal.status) }}
            </VChip>
          </div>

          <div class="d-flex flex-wrap gap-4 mb-4">
            <div class="d-flex align-center">
              <VIcon icon="mdi-account" class="me-2 text-medium-emphasis" />
              <span class="text-body-1">{{ proposal.nickName || t('components.xdao.proposalDetail.anonymous') }}</span>
            </div>
            <div class="d-flex align-center">
              <VIcon icon="mdi-calendar" class="me-2 text-medium-emphasis" />
              <span class="text-body-1">{{ t('components.xdao.proposalDetail.submitted') }}: {{ formatDate(proposal.submitDate) }}</span>
            </div>
            <div class="d-flex align-center">
              <VIcon icon="mdi-calendar-end" class="me-2 text-medium-emphasis" />
              <span class="text-body-1">{{ t('components.xdao.proposalDetail.endDate') }}: {{ formatDate(proposal.voteEndDate) }}</span>
            </div>
          </div>
        </div>


        <!-- Voting Charts -->
        <VRow class="mb-6">
          <VCol cols="12" md="6">
            <VCard class="modern-chart-card simple-payment-card h-100" variant="outlined">
              <VCardTitle class="d-flex align-center justify-space-between pa-4 pb-2">
                <div class="d-flex align-center">
                  <VIcon icon="mdi-chart-donut" class="me-2" color="primary" size="20" />
                  <span class="text-h6 font-weight-bold">{{ t('components.xdao.proposalDetail.charts.voteProgress') }}</span>
                </div>
                <VChip
                  :color="getProgressColor(proposal)"
                  variant="tonal"
                  size="small"
                  class="font-weight-bold"
                >
                  {{ getProgressText(proposal) }}
                </VChip>
              </VCardTitle>
              <VCardText class="pa-4 pt-0 pb-6">
                <div class="chart-container mb-4 position-relative">
                  <VueApexCharts
                    type="radialBar"
                    height="250"
                    :options="voteOverviewOptions"
                    :series="voteOverviewSeries"
                  />
                  <div class="chart-status-chip">
                    <VChip
                      :color="getProgressColor(proposal)"
                      variant="flat"
                      size="x-small"
                      class="font-weight-bold"
                    >
                      {{ getChartStatusText(proposal) }}
                    </VChip>
                  </div>
                </div>
                <div class="modern-stats-grid">
                  <VCard variant="tonal" color="primary" class="stat-card">
                    <VCardText class="pa-2 text-center">
                      <VIcon icon="mdi-target" size="16" class="mb-1" />
                      <div class="text-caption text-medium-emphasis">{{ t('components.xdao.proposalDetail.charts.required') }}</div>
                      <div class="text-subtitle-1 font-weight-bold">
                        {{ Number(proposal.votesRequired).toLocaleString() }}
                      </div>
                    </VCardText>
                  </VCard>
                  <VCard variant="tonal" color="success" class="stat-card">
                    <VCardText class="pa-2 text-center">
                      <VIcon icon="mdi-check-circle" size="16" class="mb-1" />
                      <div class="text-caption text-medium-emphasis">{{ t('components.xdao.proposalDetail.charts.received') }}</div>
                      <div class="text-subtitle-1 font-weight-bold">
                        {{ useSimulationData ? Math.floor(proposal.votesRequired * 0.655).toLocaleString() : totalVotes.toLocaleString() }}
                      </div>
                    </VCardText>
                  </VCard>
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol cols="12" md="6">
            <VCard class="modern-chart-card simple-payment-card h-100" variant="outlined">
              <VCardTitle class="d-flex align-center justify-space-between pa-4 pb-2">
                <div class="d-flex align-center">
                  <VIcon icon="mdi-chart-pie" class="me-2" color="success" size="20" />
                  <span class="text-h6 font-weight-bold">{{ t('components.xdao.proposalDetail.charts.voteSplit') }}</span>
                </div>
                <VChip
                  :color="voteBreakdownSeries[0] >= 50 ? 'success' : 'error'"
                  variant="tonal"
                  size="small"
                  class="font-weight-bold"
                >
                  <VIcon :icon="voteBreakdownSeries[0] >= 50 ? 'mdi-thumb-up' : 'mdi-thumb-down'" size="14" class="me-1" />
                  {{ voteBreakdownSeries[0] }}% Yes
                </VChip>
              </VCardTitle>
              <VCardText class="pa-4 pt-0 pb-6">
                <div class="chart-container mb-4">
                  <VueApexCharts
                    type="radialBar"
                    height="250"
                    :options="voteBreakdownOptions"
                    :series="voteBreakdownSeries"
                  />
                </div>
                <div class="modern-stats-grid">
                  <VCard variant="tonal" color="success" class="stat-card">
                    <VCardText class="pa-2 text-center">
                      <VIcon icon="mdi-thumb-up" size="16" class="mb-1" />
                      <div class="text-caption text-medium-emphasis">{{ t('components.xdao.proposalDetail.charts.yesVotes') }}</div>
                      <div class="text-subtitle-1 font-weight-bold text-success">
                        {{ useSimulationData ? Math.floor(proposal.votesRequired * 0.474).toLocaleString() : Number(proposal.votesYes).toLocaleString() }}
                      </div>
                    </VCardText>
                  </VCard>
                  <VCard variant="tonal" color="error" class="stat-card">
                    <VCardText class="pa-2 text-center">
                      <VIcon icon="mdi-thumb-down" size="16" class="mb-1" />
                      <div class="text-caption text-medium-emphasis">{{ t('components.xdao.proposalDetail.charts.noVotes') }}</div>
                      <div class="text-subtitle-1 font-weight-bold text-error">
                        {{ useSimulationData ? Math.floor(proposal.votesRequired * 0.181).toLocaleString() : Number(proposal.votesNo).toLocaleString() }}
                      </div>
                    </VCardText>
                  </VCard>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <!-- Voting Section for Open Proposals -->
        <VCard
          v-if="proposal.status === 'Open'"
          class="simple-payment-card mb-6"
          variant="outlined"
        >
          <VCardTitle class="d-flex align-center pa-4 pb-3">
            <VAvatar
              size="36"
              color="primary"
              variant="tonal"
              class="me-3"
            >
              <VIcon icon="mdi-vote" size="20" />
            </VAvatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ t('components.xdao.proposalDetail.voting.castYourVote') }}</div>
              <div class="text-caption text-medium-emphasis">{{ t('components.xdao.proposalDetail.voting.makeYourVoiceHeard') }}</div>
            </div>
          </VCardTitle>
          <VCardText class="pa-4 pt-2">
            <!-- Login Required Message -->
            <div v-if="!isLoggedIn" class="text-center py-6">
              <h3 class="text-h6 mb-3">{{ t('components.xdao.proposalDetail.voting.loginRequired') }}</h3>
              <p class="text-body-2 text-medium-emphasis">
                {{ t('components.xdao.proposalDetail.voting.loginRequiredMessage') }}
              </p>
            </div>

            <!-- Voting Interface for Logged In Users -->
            <div v-else-if="isLoggedIn && !hasVoted" class="modern-voting-container">
              <!-- Modern Glass Card Container -->
              <VCard
                class="modern-voting-card pa-6"
                variant="tonal"
                color="surface"
              >
                <!-- Voting Warning -->
                <VAlert
                  type="info"
                  variant="tonal"
                  class="mb-6 modern-alert"
                  density="comfortable"
                >
                  {{ t('components.xdao.proposalDetail.voting.voteWarning') }}
                </VAlert>

                <!-- Modern Vote Power Display -->
                <div class="text-center mb-6">
                  <div class="vote-power-container">
                    <VAvatar
                      size="48"
                      color="primary"
                      variant="tonal"
                      class="mb-3 vote-power-avatar"
                    >
                      <VIcon icon="mdi-vote" size="28" />
                    </VAvatar>
                    <div class="text-caption text-medium-emphasis mb-1">{{ t('components.xdao.proposalDetail.voting.yourVotingPower') }}</div>
                    <div class="text-h5 font-weight-bold text-primary">{{ myNumberOfVotes }}</div>
                    <div class="text-body-2 text-medium-emphasis">{{ t('components.xdao.proposalDetail.voting.votesAvailable') }}</div>
                  </div>
                </div>

                <!-- Compact Vote Buttons -->
                <div class="d-flex justify-center gap-3 flex-wrap">
                  <VBtn
                    color="success"
                    variant="flat"
                    size="large"
                    class="vote-button vote-yes"
                    min-width="110"
                    min-height="50"
                    @click="castVote('yes')"
                    :loading="isVoting"
                    :disabled="hasVoted || isVoting"
                  >
                    <VIcon icon="mdi-thumb-up" class="me-2" size="16" />
                    {{ t('components.xdao.proposalDetail.voting.voteYes') }}
                  </VBtn>
                  <VBtn
                    color="error"
                    variant="flat"
                    size="large"
                    class="vote-button vote-no"
                    min-width="110"
                    min-height="50"
                    @click="castVote('no')"
                    :loading="isVoting"
                    :disabled="hasVoted || isVoting"
                  >
                    <VIcon icon="mdi-thumb-down" class="me-2" size="16" />
                    {{ t('components.xdao.proposalDetail.voting.voteNo') }}
                  </VBtn>
                </div>
              </VCard>

            </div>

            <VAlert
              v-if="hasVoted"
              type="success"
              variant="tonal"
              class="mt-4"
            >
              <div class="d-flex align-center justify-space-between">
                <div>
                  {{ t('components.xdao.proposalDetail.voting.youHaveVoted') }}: <strong class="ms-1">{{ userVote === 'yes' ? t('components.xdao.proposalDetail.voting.yes') : t('components.xdao.proposalDetail.voting.no') }}</strong>
                </div>
                <VChip
                  :color="userVote === 'yes' ? 'success' : 'error'"
                  variant="flat"
                  size="small"
                  class="font-weight-bold"
                >
                  {{ t('components.xdao.proposalDetail.voting.voteCount', { count: myNumberOfVotes }) }}
                </VChip>
              </div>
            </VAlert>

            <div class="text-center mt-4 text-caption text-medium-emphasis">
              {{ t('components.xdao.proposalDetail.voting.votingEnds') }}: {{ formatDate(proposal.voteEndDate) }}
            </div>

            <VProgressLinear
              v-if="isLoadingVoteData"
              indeterminate
              color="primary"
              class="mt-4"
            />
          </VCardText>
        </VCard>

        <!-- Grant Information -->
        <VCard
          v-if="proposal.grantValue && proposal.grantValue > 0"
          variant="outlined"
          class="grant-main-card simple-payment-card mb-6"
        >
          <VCardTitle class="d-flex align-center pa-4 pb-3">
            <VAvatar
              size="36"
              color="success"
              variant="tonal"
              class="me-3"
            >
              <VIcon icon="mdi-cash-multiple" size="20" />
            </VAvatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ t('components.xdao.proposalDetail.grant.title') }}</div>
              <div class="text-caption text-medium-emphasis">{{ t('components.xdao.proposalDetail.grant.fundingDetails') }}</div>
            </div>
          </VCardTitle>
          <VCardText class="pa-4 pt-2">
            <div class="grant-info-grid">
              <VCard variant="tonal" color="primary" class="grant-inner-card simple-payment-card">
                <VCardText class="pa-3">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <VIcon icon="mdi-cash" color="primary" size="32" />
                    <VChip
                      color="primary"
                      variant="flat"
                      size="x-small"
                      class="font-weight-bold"
                    >
                      FLUX
                    </VChip>
                  </div>
                  <div class="text-caption text-medium-emphasis mb-1">{{ t('components.xdao.proposalDetail.grant.grantAmount') }}</div>
                  <div class="text-h5 font-weight-bold">
                    {{ Number(proposal.grantValue).toLocaleString() }}
                  </div>
                </VCardText>
              </VCard>

              <VCard variant="outlined" class="grant-inner-card simple-payment-card">
                <VCardText class="pa-3">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <VIcon icon="mdi-wallet-outline" color="primary" size="24" />
                    <VBtn
                      icon
                      variant="text"
                      size="x-small"
                      color="primary"
                      @click="copyToClipboard(proposal.grantAddress)"
                    >
                      <VIcon icon="mdi-content-copy" size="16" />
                    </VBtn>
                  </div>
                  <div class="text-caption text-medium-emphasis mb-1">{{ t('components.xdao.proposalDetail.grant.recipientAddress') }}</div>
                  <div class="text-body-2 font-mono text-truncate">
                    {{ proposal.grantAddress }}
                  </div>
                  <VBtn
                    color="primary"
                    variant="text"
                    size="small"
                    class="mt-2 pa-0"
                    :href="`https://explorer.runonflux.io/address/${proposal.grantAddress}`"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <VIcon icon="mdi-open-in-new" size="14" class="me-1" />
                    {{ t('components.xdao.proposalDetail.grant.viewOnExplorer') }}
                  </VBtn>
                </VCardText>
              </VCard>
            </div>
          </VCardText>
        </VCard>

        <!-- Description -->
        <VCard variant="outlined" class="mb-6">
          <VCardTitle class="text-h6 pa-4 pb-2">
            <VIcon icon="mdi-text" class="me-2" />
            {{ t('components.xdao.proposalDetail.description') }}
          </VCardTitle>
          <VCardText class="pa-4 pt-2">
            <div class="text-body-1 line-height-relaxed description-text">
              <div class="description-content" v-sanitize-html="formatDescription(proposal.description)"></div>
            </div>
          </VCardText>
        </VCard>

        <!-- Technical Details -->
        <VExpansionPanels variant="accordion">
          <VExpansionPanel>
            <VExpansionPanelTitle>
              <VIcon icon="mdi-information-outline" class="me-2" />
              {{ t('components.xdao.proposalDetail.technicalDetails.title') }}
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <VRow>
                <VCol cols="12" md="6">
                  <div class="mb-3">
                    <div class="text-body-2 text-medium-emphasis mb-1">{{ t('components.xdao.proposalDetail.technicalDetails.proposalHash') }}</div>
                    <div class="text-body-1 font-mono">{{ proposal.hash }}</div>
                    <VBtn
                      size="small"
                      variant="text"
                      @click="copyToClipboard(proposal.hash)"
                    >
                      <VIcon icon="mdi-content-copy" class="me-1" size="16" />
                      {{ t('components.xdao.proposalDetail.technicalDetails.copy') }}
                    </VBtn>
                  </div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-3">
                    <div class="text-body-2 text-medium-emphasis mb-1">{{ t('components.xdao.proposalDetail.technicalDetails.submitDate') }}</div>
                    <div class="text-body-1">{{ formatFullDate(proposal.submitDate) }}</div>
                  </div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-3">
                    <div class="text-body-2 text-medium-emphasis mb-1">{{ t('components.xdao.proposalDetail.technicalDetails.voteEndDate') }}</div>
                    <div class="text-body-1">{{ formatFullDate(proposal.voteEndDate) }}</div>
                  </div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-3">
                    <div class="text-body-2 text-medium-emphasis mb-1">{{ t('components.xdao.proposalDetail.technicalDetails.currentStatus') }}</div>
                    <VChip
                      :color="getStatusColor(proposal.status)"
                      variant="tonal"
                      size="small"
                    >
                      {{ formatStatus(proposal.status) }}
                    </VChip>
                  </div>
                </VCol>
              </VRow>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </VCardText>

      <VCardActions class="pa-4 pa-sm-6 pt-0">
        <VSpacer />
        <VBtn
          color="error"
          variant="flat"
          @click="dialogVisible = false"
        >
          {{ t('common.buttons.close') }}
        </VBtn>
        <VBtn
          v-if="proposal.grantAddress"
          color="primary"
          variant="elevated"
          :href="`https://explorer.runonflux.io/address/${proposal.grantAddress}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <VIcon icon="mdi-open-in-new" class="me-2" />
          {{ t('components.xdao.proposalDetail.viewAddressOnExplorer') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { useFluxStore } from '@/stores/flux'
import { storeToRefs } from 'pinia'
import axios from 'axios'
import { useSnackbar } from '@/composables/useSnackbar'
import { signWithSSP, signWithZelcore } from '@/utils/walletService'

// Props and Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  proposal: {
    type: Object,
    default: null,
  },
  zelid: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'showLogin'])

// i18n
const { t } = useI18n()

// Theme and stores
const theme = useTheme()
const fluxStore = useFluxStore()
const { privilege, zelid } = storeToRefs(fluxStore)

// Composables
const { snackbar, showSnackbar } = useSnackbar()

// Authentication state
const isLoggedIn = computed(() => privilege.value !== 'none')
const currentUserZelid = computed(() => zelid.value)

// Computed values for charts
const totalVotes = computed(() => {
  return props.proposal ? Number(props.proposal.votesYes) + Number(props.proposal.votesNo) : 0
})

// Simulation data for testing (remove this in production)
const useSimulationData = computed(() => {
  return props.proposal && props.proposal.status === 'Open' && totalVotes.value === 0
})

const voteOverviewSeries = computed(() => {
  if (!props.proposal) return [0]

  // Use simulation data for open proposals with no votes
  if (useSimulationData.value) {
    return [65.5] // 65.5% of required votes received
  }

  const percentage = (totalVotes.value / props.proposal.votesRequired) * 100
  
  return [Math.min(percentage, 100).toFixed(1)]
})

const voteBreakdownSeries = computed(() => {
  if (!props.proposal) return [0]

  // Use simulation data for open proposals with no votes
  if (useSimulationData.value) {
    return [72.3] // 72.3% Yes votes
  }

  if (totalVotes.value === 0) return [0]
  const yesPercentage = (props.proposal.votesYes / totalVotes.value) * 100
  
  return [yesPercentage.toFixed(1)]
})

// Chart options
const voteOverviewOptions = computed(() => ({
  chart: {
    height: 250,
    type: 'radialBar',
    sparkline: {
      enabled: false,
    },
    background: 'transparent',
    offsetY: 0,
    offsetX: 0,
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
  },
  colors: ['#3B82F6'],
  plotOptions: {
    radialBar: {
      offsetY: 0,
      startAngle: 0,
      endAngle: 360,
      hollow: {
        size: '65%',
        background: 'transparent',
      },
      track: {
        background: theme.current.value.dark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
        strokeWidth: '100%',
        margin: 8,
        dropShadow: {
          enabled: true,
          top: 0,
          left: 0,
          blur: 4,
          opacity: 0.15,
        },
      },
      dataLabels: {
        name: {
          show: false,
        },
        value: {
          color: theme.current.value.dark ? '#fff' : '#2D3748',
          fontSize: '2.2rem',
          fontWeight: '700',
          fontFamily: 'Inter, sans-serif',
          formatter: val => `${val}%`,
          offsetY: 15,
        },
      },
    },
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'diagonal1',
      shadeIntensity: 0.5,
      gradientToColors: ['#8B5CF6', '#3B82F6'],
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 50, 100],
      colorStops: [
        {
          offset: 0,
          color: '#3B82F6',
          opacity: 1,
        },
        {
          offset: 100,
          color: '#8B5CF6',
          opacity: 1,
        },
      ],
    },
  },
  stroke: {
    lineCap: 'round',
    width: 2,
  },
}))

const voteBreakdownOptions = computed(() => ({
  chart: {
    height: 250,
    type: 'radialBar',
    sparkline: {
      enabled: false,
    },
    background: 'transparent',
    offsetY: 0,
    offsetX: 0,
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
  },
  colors: ['#10B981'],
  labels: ['Yes Votes'],
  plotOptions: {
    radialBar: {
      offsetY: 0,
      startAngle: 0,
      endAngle: 360,
      hollow: {
        size: '65%',
        background: 'transparent',
      },
      track: {
        background: theme.current.value.dark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
        strokeWidth: '100%',
        margin: 8,
        dropShadow: {
          enabled: true,
          top: 0,
          left: 0,
          blur: 4,
          opacity: 0.15,
        },
      },
      dataLabels: {
        name: {
          offsetY: -10,
          color: theme.current.value.dark ? 'rgba(255,255,255,0.8)' : 'rgba(45,55,72,0.8)',
          fontSize: '1rem',
          fontWeight: '500',
          fontFamily: 'Inter, sans-serif',
        },
        value: {
          offsetY: 5,
          color: theme.current.value.dark ? '#fff' : '#2D3748',
          fontSize: '2.2rem',
          fontWeight: '700',
          fontFamily: 'Inter, sans-serif',
          formatter: val => `${val}%`,
        },
      },
    },
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'diagonal1',
      shadeIntensity: 0.5,
      gradientToColors: ['#34D399', '#10B981'],
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 50, 100],
      colorStops: [
        {
          offset: 0,
          color: '#10B981',
          opacity: 1,
        },
        {
          offset: 100,
          color: '#34D399',
          opacity: 1,
        },
      ],
    },
  },
  stroke: {
    lineCap: 'round',
    width: 2,
  },
}))

// Reactive data
const hasVoted = ref(false)
const userVote = ref(null)
const myNumberOfVotes = ref(0)
const dataToSign = ref('')
const signature = ref('')
const userZelid = ref('')
const isVoting = ref(false)
const isLoadingVoteData = ref(false)

// Computed properties
const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Methods
const getStatusColor = status => {
  if (status === 'Open') return 'warning'
  if (status === 'Passed') return 'success'
  if (status === 'Unpaid') return 'info'
  if (status.includes('Rejected')) return 'error'

  return 'primary'
}

// Format status with translation - handles compound statuses like "Rejected Unpaid" or "Rejected <reason>"
const formatStatus = status => {
  if (!status) return ''

  // Define translation map
  const statusMap = {
    'Open': t('components.xdao.proposalDetail.charts.status.open'),
    'Passed': t('components.xdao.proposalDetail.charts.status.passed'),
    'Unpaid': t('components.xdao.proposalDetail.charts.status.unpaid'),
    'Rejected': t('components.xdao.proposalDetail.charts.status.rejected'),
    'Not Enough Votes': t('components.xdao.proposalDetail.charts.status.notEnoughVotes'),
  }

  // Handle "Not Enough Votes" as a single phrase
  if (status.includes('Not Enough Votes')) {
    return status.replace('Not Enough Votes', statusMap['Not Enough Votes'])
      .replace('Rejected', statusMap['Rejected'])
  }

  // Handle compound status like "Rejected Unpaid" or "Rejected <reason>"
  if (status.includes(' ')) {
    const parts = status.split(' ')
    const translatedParts = parts.map(part => statusMap[part] || part)
    
    return translatedParts.join(' ')
  }

  // Single word status
  return statusMap[status] || status
}

const getProgressColor = proposal => {
  const totalVotes = proposal.votesYes + proposal.votesNo
  const progress = totalVotes / proposal.votesRequired
  
  if (progress >= 1) {
    return proposal.votesYes > proposal.votesNo ? 'success' : 'error'
  }
  
  return 'warning'
}

const getProgressText = proposal => {
  const totalVotes = proposal.votesYes + proposal.votesNo
  const progress = totalVotes / proposal.votesRequired
  const percentage = Math.round(progress * 100)

  if (progress >= 1) {
    return proposal.votesYes > proposal.votesNo ? t('components.xdao.proposalDetail.charts.votingCompletePassed') : t('components.xdao.proposalDetail.charts.votingCompleteRejected')
  }

  return t('components.xdao.proposalDetail.charts.percentageOfVotesReceived', { percentage })
}

const formatDate = timestamp => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatFullDate = timestamp => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

const getProgressChipColor = percentage => {
  if (percentage >= 75) return 'success'
  if (percentage >= 50) return 'warning'
  if (percentage >= 25) return 'error'
  
  return 'grey'
}

const getProgressIcon = percentage => {
  if (percentage >= 75) return 'mdi-check-circle'
  if (percentage >= 50) return 'mdi-alert-circle'
  if (percentage >= 25) return 'mdi-minus-circle'
  
  return 'mdi-clock-outline'
}

const getChartStatusText = proposal => {
  if (!proposal) return ''

  // Check the actual status first
  if (proposal.status === 'Passed') return t('components.xdao.proposalDetail.charts.status.passed')
  if (proposal.status === 'Rejected' || proposal.status.includes('Rejected')) return t('components.xdao.proposalDetail.charts.status.rejected')
  if (proposal.status === 'Unpaid') return t('components.xdao.proposalDetail.charts.status.unpaid')

  // For Open status, check if voting is complete
  const totalVotes = Number(proposal.votesYes) + Number(proposal.votesNo)
  const progress = totalVotes / proposal.votesRequired
  if (progress >= 1) {
    return proposal.votesYes > proposal.votesNo ? t('components.xdao.proposalDetail.charts.status.passed') : t('components.xdao.proposalDetail.charts.status.rejected')
  }

  return t('components.xdao.proposalDetail.charts.status.voting')
}

const copyToClipboard = async text => {
  try {
    await navigator.clipboard.writeText(text)
    showSnackbar(t('components.xdao.proposalDetail.messages.copiedToClipboard'), 'success')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

// API functions from original HomeUI
const getMessagePhrase = async () => {
  try {
    const response = await axios.get('https://stats.runonflux.io/general/messagephrase')
    if (response.data.status === 'success') {
      return response.data.data
    }
    
    return false
  } catch (error) {
    console.error('Error getting message phrase:', error)
    
    return false
  }
}

const loadVoteData = async () => {
  const zelid = currentUserZelid.value || userZelid.value
  console.log('🔍 Loading vote data for zelid:', zelid)

  if (!zelid) {
    console.log('❌ No zelid available')
    myNumberOfVotes.value = 0
    hasVoted.value = false
    
    return
  }

  try {
    // API call with both zelid and hash - API will return vote power AND vote status
    let url = `https://stats.runonflux.io/proposals/votepower?zelid=${zelid}`
    if (props.proposal?.hash) {
      url += `&hash=${props.proposal.hash}`
    }
    console.log('📡 Fetching vote data:', url)

    const response = await axios.get(url)

    if (response.data.status === 'success' && response.data.data) {
      const data = response.data.data

      // Set vote power
      myNumberOfVotes.value = data.power || 0
      console.log('✅ Vote power:', myNumberOfVotes.value)

      // API can tell us if user has already voted for this proposal
      if (data.hasVoted !== undefined) {
        hasVoted.value = data.hasVoted
        userVote.value = data.vote || null
        console.log('✅ Vote status from API - hasVoted:', hasVoted.value, 'vote:', userVote.value)
      } else {
        // Fallback: check vote information separately if API doesn't provide it
        hasVoted.value = false
        console.log('🔄 API did not provide vote status, assuming not voted')
      }
    } else {
      console.log('⚠️ API returned no data')
      myNumberOfVotes.value = 0
      hasVoted.value = false
    }
  } catch (error) {
    console.error('❌ Vote data API error:', error)
    myNumberOfVotes.value = 0
    hasVoted.value = false
  }
}

const getVoteInformation = async () => {
  const zelid = currentUserZelid.value || userZelid.value
  if (!zelid || !props.proposal?.hash) return null

  try {
    const response = await axios.get(`https://stats.runonflux.io/proposals/voteInformation?hash=${props.proposal.hash}&zelid=${zelid}`)
    
    return response.data
  } catch (error) {
    console.error('Error getting vote information:', error)
    
    return null
  }
}

// Simplified - just call the unified loadVoteData function
const loadVotes = async () => {
  await loadVoteData()
}

const initSSP = async () => {
  try {
    const result = await signWithSSP(dataToSign.value)

    signature.value = result.signature
    userZelid.value = result.address

    // Load vote information after getting zelid
    await loadVotes()

    showSnackbar(t('components.xdao.proposalDetail.messages.successfullySignedWithSSP'), 'success')
  } catch (error) {
    console.error('SSP signing error:', error)
    showSnackbar(error.message || t('components.xdao.proposalDetail.messages.failedToSignWithSSP'), 'error')
  }
}

const initZelcore = async () => {
  try {
    // signWithZelcore handles long messages and protocol launching automatically
    // No callback URL means user will manually complete the signing flow
    await signWithZelcore(dataToSign.value, userZelid.value || currentUserZelid.value)

    console.log('Zelcore signing initiated')
  } catch (error) {
    console.error('Zelcore signing error:', error)
    showSnackbar(error.message || t('components.xdao.proposalDetail.messages.failedToInitiateZelcore'), 'error')
  }
}

// Real voting functionality
const castVote = async voteType => {
  // First check if user is logged in
  if (!isLoggedIn.value) {
    showSnackbar(t('components.xdao.proposalDetail.messages.pleaseLogInFirst'), 'warning')

    return
  }

  // Prevent voting if already voted
  if (hasVoted.value) {
    showSnackbar(t('components.xdao.proposalDetail.messages.alreadyVoted'), 'warning')

    return
  }

  if (!props.proposal?.hash) {
    showSnackbar(t('components.xdao.proposalDetail.messages.proposalHashNotAvailable'), 'error')

    return
  }


  // Check if signature is available
  if (!signature.value || !dataToSign.value) {
    showSnackbar(t('components.xdao.proposalDetail.messages.missingSignature'), 'warning')

    // Try to initiate signing
    await initSSP()

    return
  }

  isVoting.value = true

  try {
    const data = {
      hash: props.proposal.hash,
      zelid: userZelid.value || currentUserZelid.value,
      message: dataToSign.value,
      signature: signature.value,
      vote: voteType === 'yes',
    }

    const response = await axios.post('https://stats.runonflux.io/proposals/voteproposal', JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.data.status === 'success') {
      console.log('Vote registered successfully!')
      hasVoted.value = true
      userVote.value = voteType
      showSnackbar(t('components.xdao.proposalDetail.messages.voteRecordedSuccess'), 'success')

      // Update proposal vote counts for immediate UI feedback
      if (voteType === 'yes') {
        props.proposal.votesYes += myNumberOfVotes.value
      } else {
        props.proposal.votesNo += myNumberOfVotes.value
      }
      props.proposal.votesTotal += myNumberOfVotes.value

      // Success message auto-hides via snackbar timeout
    } else {
      throw new Error(response.data.data?.message || response.data.data || t('components.xdao.proposalDetail.messages.voteFailed'))
    }
  } catch (error) {
    console.error('Voting error:', error)
    showSnackbar(error.message || t('components.xdao.proposalDetail.messages.failedToCastVote'), 'error')
  } finally {
    isVoting.value = false
  }
}

// Initialize voting data when component mounts
onMounted(async () => {
  console.log('🔄 Component mounted with proposal:', props.proposal?.status, 'zelid:', props.zelid)
  if (props.proposal?.status === 'Open') {
    dataToSign.value = await getMessagePhrase()
    userZelid.value = props.zelid
    console.log('✅ Got message phrase and set userZelid:', userZelid.value)

    // Load all vote data (power + vote status)
    await loadVoteData()
  }
})

// Watch for proposal changes
watch(() => props.proposal, async newProposal => {
  console.log('🔄 Proposal changed:', newProposal?.hash, 'status:', newProposal?.status)
  if (newProposal) {
    // Reset voting state
    hasVoted.value = false
    userVote.value = ''
    signature.value = ''
    myNumberOfVotes.value = 0
    console.log('🔄 Reset voting state for new proposal')

    if (newProposal.status === 'Open') {
      dataToSign.value = await getMessagePhrase()
      userZelid.value = props.zelid
      console.log('✅ Got message phrase and set userZelid:', userZelid.value)

      // Load all vote data (power + vote status)
      await loadVoteData()
    }
  }
})

// Watch for zelid changes
watch(() => props.zelid, async newZelid => {
  if (newZelid && props.proposal?.status === 'Open') {
    userZelid.value = newZelid
    await loadVoteData()
  }
})

// Watch for login status changes
watch(isLoggedIn, async newValue => {
  console.log('🔄 Login status changed:', newValue)
  if (newValue && props.proposal?.status === 'Open') {
    await loadVoteData()
  }
})

// Watch for currentUserZelid changes
watch(currentUserZelid, async newZelid => {
  console.log('🔄 CurrentUserZelid changed:', newZelid)
  if (newZelid && props.proposal?.status === 'Open') {
    await loadVoteData()
  }
})

const formatDescription = text => {
  if (!text) return ''
  
  // Split into lines for processing
  const lines = text.split('\n')
  let formatted = []
  let inTable = false
  let tableLines = []
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    
    // Check if line is a table row (contains | and has at least 2 columns)
    if (line.includes('|') && line.split('|').length >= 3) {
      if (!inTable) {
        inTable = true
        tableLines = []
      }
      tableLines.push(line)
    } else {
      // If we were in a table, process it
      if (inTable && tableLines.length > 0) {
        formatted.push(formatTable(tableLines))
        inTable = false
        tableLines = []
      }
      
      // Process regular line
      line = line

        // Escape basic HTML
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        
        // Convert **bold** text 
        .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
        
        // Convert list items (lines starting with * followed by space)
        .replace(/^(\s*)\*\s+(.+)$/, '$1• $2')
        
        // Convert tabs to spaces
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
        
        // Preserve multiple spaces
        .replace(/  /g, '&nbsp;&nbsp;')
      
      formatted.push(line)
    }
  }
  
  // Handle table at end if needed
  if (inTable && tableLines.length > 0) {
    formatted.push(formatTable(tableLines))
  }
  
  return formatted.join('<br>')
}

const formatTable = lines => {
  if (lines.length < 2) return lines.join('<br>')
  
  // Parse table rows
  const rows = lines.map(line => 
    line.split('|')
      .map(cell => cell.trim())
      .filter((cell, index, arr) => 

        // Keep cells that are not empty or are between other cells
        index > 0 && index < arr.length - 1 || cell !== '',
      ),
  )
  
  // Check if second row is a separator row (contains dashes)
  const hasSeparator = rows.length > 1 && 
    rows[1].every(cell => /^[-:\s]+$/.test(cell))
  
  let html = '<table class="simple-table">'
  
  // Process header if separator exists
  if (hasSeparator && rows.length > 0) {
    html += '<thead><tr>'
    rows[0].forEach(cell => {
      html += `<th>${cell}</th>`
    })
    html += '</tr></thead>'
    
    // Process body rows (skip separator)
    if (rows.length > 2) {
      html += '<tbody>'
      for (let i = 2; i < rows.length; i++) {
        html += '<tr>'
        rows[i].forEach(cell => {
          html += `<td>${cell}</td>`
        })
        html += '</tr>'
      }
      html += '</tbody>'
    }
  } else {
    // No header, treat all as body rows
    html += '<tbody>'
    rows.forEach(row => {
      html += '<tr>'
      row.forEach(cell => {
        html += `<td>${cell}</td>`
      })
      html += '</tr>'
    })
    html += '</tbody>'
  }
  
  html += '</table>'
  
  return html
}
</script>

<style scoped>
/* Modern Voting Container */
.modern-voting-container {
  max-width: 500px;
  margin: 0 auto;
}

.modern-voting-card {
  border-radius: 24px !important;
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.modern-voting-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--v-theme-primary), 0.5), transparent);
}

.modern-alert {
  border-radius: 16px !important;
  border-left: 4px solid rgb(var(--v-theme-info));
}

/* Vote Power Display */
.vote-power-container {
  position: relative;
}

.vote-power-avatar {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
}

.vote-power-avatar:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.3);
}

/* Modern Vote Buttons */
.vote-button {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px !important;
  position: relative;
  overflow: hidden;
  font-weight: 600 !important;
}

.vote-button:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(var(--v-theme-shadow-key-umbra-opacity), 0.3);
}

.vote-button:active {
  transform: translateY(-2px);
}

.vote-yes:hover {
  box-shadow: 0 12px 32px rgba(var(--v-theme-success), 0.4);
}

.vote-no:hover {
  box-shadow: 0 12px 32px rgba(var(--v-theme-error), 0.4);
}

/* Shimmer effect for buttons */
.vote-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.vote-button:hover::before {
  left: 100%;
}

.chart-container {
  overflow: visible;
  margin: 0 -10px;
}

.chart-status-chip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin-top: -35px;
  z-index: 10;
}

.progress-segments {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
}

.progress-yes {
  background-color: rgb(var(--v-theme-success));
  height: 100%;
}

.progress-no {
  background-color: rgb(var(--v-theme-error));
  height: 100%;
}

.vote-legend {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.vote-legend.yes {
  background-color: rgb(var(--v-theme-success));
}

.vote-legend.no {
  background-color: rgb(var(--v-theme-error));
}

.line-height-relaxed {
  line-height: 1.7;
}

.font-mono {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
}

.description-text {
  max-width: 100%;
  overflow-wrap: break-word;
}

.description-content {
  word-wrap: break-word;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.7;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
}

.description-content b {
  font-weight: 700;
  color: inherit;
}

.description-content :deep(.simple-table) {
  border-collapse: collapse;
  margin: 12px 0;
  width: auto;
  max-width: 100%;
}

.description-content :deep(.simple-table th),
.description-content :deep(.simple-table td) {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding: 8px 12px;
  text-align: left;
}

.description-content :deep(.simple-table th) {
  background-color: rgba(var(--v-theme-primary), 0.08);
  font-weight: 600;
}

.description-content :deep(.simple-table tr:nth-child(even)) {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

/* Modern Chart Card Styling */

.modern-chart-card .v-card-title {
  background: rgba(var(--v-theme-primary), 0.08);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.modern-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}


.stat-card {
  border-radius: 12px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  border: 1px solid rgba(var(--v-theme-outline), 0.05);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.grant-info-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}

@media (max-width: 960px) {
  .grant-info-grid {
    grid-template-columns: 1fr;
  }
}

/* Grant card 3D effects */
.grant-main-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08),
              0 2px 8px rgba(0, 0, 0, 0.04) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.grant-main-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12),
              0 4px 16px rgba(0, 0, 0, 0.06) !important;
}

.grant-inner-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06),
              0 1px 4px rgba(0, 0, 0, 0.03) !important;
  transition: all 0.2s ease !important;
}

.grant-inner-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1),
              0 2px 8px rgba(0, 0, 0, 0.05) !important;
}

/* Payment Card Style for Charts */
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
</style>