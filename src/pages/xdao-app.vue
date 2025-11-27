<template>
  <div>
    <!-- Introduction Section -->
    <VRow>
      <VCol cols="12">
        <VCard class="xdao-intro-card">
          <VCardText>
            <div class="d-flex align-center mb-3">
              <VAvatar
                size="48"
                color="primary"
                variant="tonal"
                class="mr-3"
              >
                <VIcon size="28">mdi-account-group</VIcon>
              </VAvatar>
              <div>
                <h2 class="text-h4 mb-1">{{ t('pages.xdao.title') }}</h2>
                <p class="text-body-2 mb-0 text-medium-emphasis">{{ t('pages.xdao.subtitle') }}</p>
              </div>
            </div>
            <p class="text-body-1 mb-0">
              {{ t('pages.xdao.description') }}
            </p>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow>
      <!-- Mobile Sidebar Toggle -->
      <VCol cols="12" class="d-md-none">
        <VCard>
          <VCardText class="pa-4">
            <VBtn
              variant="outlined"
              color="secondary"
              @click="showMobileFilters = !showMobileFilters"
            >
              <VIcon icon="mdi-filter-variant" class="me-2" />
              {{ t('pages.xdao.filters') }}
            </VBtn>
        
            <div v-if="showMobileFilters" class="mt-4">
              <div
                class="filter-grid"
                :class="{ 'grid-full-width': proposalFilters.length % 2 === 1 }"
              >
                <VChip
                  v-for="(filter, index) in proposalFilters"
                  :key="filter.value"
                  :value="index"
                  :variant="activeFilter === filter.value ? 'flat' : 'outlined'"
                  :color="activeFilter === filter.value ? 'primary' : 'default'"
                  size="default"
                  class="px-3 py-2 d-flex align-center filter-chip"
                  :class="{ 'last-full-width': index === proposalFilters.length - 1 && proposalFilters.length % 2 === 1 }"
                  @click="setFilter(filter.value)"
                >
                  <div class="d-flex align-center">
                    <VIcon :icon="filter.icon" class="me-1" size="18" />
                    <span>{{ filter.title }}</span>
                  </div>
                  <VBadge
                    v-if="filter.count > 0"
                    :content="filter.count"
                    :color="activeFilter === filter.value ? 'white' : 'primary'"
                    inline
                    density="compact"
                    class="badge-xs ml-1"
                  />
                  <div v-else style="width: 20px;"></div>
                </VChip>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Desktop Sidebar -->
      <VCol
        cols="12"
        md="4"
        lg="3"
        class="d-none d-md-block"
      >
        <VCard>
          <VCardText class="pa-6">
            <VList class="pa-0 sidebar-list compact-sidebar">
              <VListItem
                :active="activeTab === 1"
                prepend-icon="mdi-plus-circle-outline"
                rounded="xl"
                class="mb-1 compact-list-item add-proposal-item"
                @click="openAddProposal"
              >
                <VListItemTitle class="text-body-2 font-weight-medium">
                  {{ t('pages.xdao.addProposal') }}
                </VListItemTitle>
              </VListItem>
          
              <VDivider class="my-3" />

              <VListSubheader class="text-medium-emphasis px-0 mb-2 text-body-2">
                {{ t('pages.xdao.filterProposals') }}
              </VListSubheader>
              <VListItem
                v-for="filter in proposalFilters"
                :key="filter.title"
                :active="activeFilter === filter.value && activeTab === 0"
                :prepend-icon="filter.icon"
                rounded="xl"
                class="mb-1 compact-list-item"
                @click="setFilter(filter.value)"
              >
                <VListItemTitle class="text-body-2">
                  {{ filter.title }}
                  <VChip
                    v-if="filter.count > 0"
                    :color="activeFilter === filter.value && activeTab === 0 ? 'success' : 'default'"
                    variant="tonal"
                    size="x-small"
                    class="ml-2"
                  >
                    {{ filter.count }}
                  </VChip>
                </VListItemTitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Main Content - Tab switching only affects this column -->
      <VCol
        cols="12"
        md="8"
        lg="9"
      >
        <!-- Proposals List View -->
        <div v-if="activeTab === 0">
          <!-- Search and Controls -->
          <VCard class="mb-4">
            <VCardText class="pa-4">
              <VRow align="center">
                <VCol
                  cols="12"
                  md="8"
                >
                  <VTextField
                    v-model="searchQuery"
                    :placeholder="t('pages.xdao.searchProposals')"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="4"
                >
                  <VSelect
                    v-model="sortBy"
                    :items="sortOptions"
                    :label="t('pages.xdao.sortBy')"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Proposals List -->
          <VCard v-if="loading" class="text-center pa-8">
            <VCardText>
              <VProgressCircular
                indeterminate
                color="primary"
                size="48"
              />
              <div class="mt-4 text-body-1">{{ t('pages.xdao.loadingProposals') }}</div>
            </VCardText>
          </VCard>

          <!-- Error State -->
          <VCard v-else-if="error" class="text-center pa-8">
            <VCardText>
              <VIcon
                icon="mdi-alert-circle-outline"
                size="64"
                color="error"
                class="mb-4"
              />
              <h3 class="text-h5 mb-2">{{ t('pages.xdao.failedToLoad') }}</h3>
              <p class="text-body-1 text-medium-emphasis mb-4">
                {{ error }}
              </p>
              <VBtn
                color="primary"
                variant="elevated"
                @click="fetchProposals"
              >
                <VIcon icon="mdi-refresh" class="me-2" />
                {{ t('pages.xdao.tryAgain') }}
              </VBtn>
            </VCardText>
          </VCard>

          <!-- No Proposals State -->
          <VCard v-else-if="filteredProposals.length === 0" class="text-center pa-8">
            <VCardText>
              <VIcon
                icon="mdi-clipboard-outline"
                size="64"
                color="grey-lighten-1"
                class="mb-4"
              />
              <h3 class="text-h5 mb-2">{{ getEmptyStateTitle() }}</h3>
              <p class="text-body-1 text-medium-emphasis">
                {{ getEmptyStateMessage() }}
              </p>
            </VCardText>
          </VCard>

          <VCard
            v-for="proposal in filteredProposals"
            :key="proposal.hash"
            class="mb-4 proposal-card"
            @click="openProposal(proposal)"
          >
            <VCardText class="pa-4 pa-sm-6">
              <!-- Mobile Layout -->
              <div class="d-block d-sm-none">
                <!-- Status and Title -->
                <div class="d-flex justify-space-between align-start mb-3">
                  <h3 class="text-h6 font-weight-bold flex-grow-1 me-3">{{ stripFormatting(proposal.topic) }}</h3>
                  <VChip
                    :color="getStatusColor(proposal.status)"
                    variant="elevated"
                    size="small"
                    class="flex-shrink-0"
                  >
                    {{ formatStatus(proposal.status) }}
                  </VChip>
                </div>

                <!-- Author and Date -->
                <div class="d-flex flex-column gap-2 mb-3">
                  <div class="d-flex align-center">
                    <VAvatar
                      v-if="proposal.nickName"
                      size="20"
                      :color="getStatusColor(proposal.status)"
                      variant="tonal"
                      class="me-2"
                    >
                      <span class="text-caption">{{ getAvatarText(proposal.nickName) }}</span>
                    </VAvatar>
                    <VIcon v-else icon="mdi-account" size="20" class="me-2 text-medium-emphasis" />
                    <span class="text-body-2">{{ proposal.nickName || t('pages.xdao.anonymous') }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ t('pages.xdao.end') }}: {{ formatDate(proposal.voteEndDate) }}
                  </div>
                </div>
              </div>

              <!-- Desktop Layout -->
              <div class="d-none d-sm-block">
                <div class="d-flex justify-space-between align-start mb-3">
                  <div class="flex-grow-1 me-4">
                    <h3 class="text-h6 font-weight-bold mb-0">{{ stripFormatting(proposal.topic) }}</h3>
                  </div>
                  <VChip
                    :color="getStatusColor(proposal.status)"
                    variant="elevated"
                    size="small"
                    class="flex-shrink-0"
                  >
                    {{ formatStatus(proposal.status) }}
                  </VChip>
                </div>

                <div class="d-flex justify-space-between align-center mb-3">
                  <div class="d-flex align-center">
                    <VAvatar
                      v-if="proposal.nickName"
                      size="24"
                      :color="getStatusColor(proposal.status)"
                      variant="tonal"
                      class="me-2"
                    >
                      <span class="text-caption">{{ getAvatarText(proposal.nickName) }}</span>
                    </VAvatar>
                    <VIcon v-else icon="mdi-account" size="24" class="me-2 text-medium-emphasis" />
                    <span class="text-body-2">{{ proposal.nickName || t('pages.xdao.anonymous') }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ t('pages.xdao.end') }}: {{ formatDate(proposal.voteEndDate) }}
                  </div>
                </div>
              </div>

              <!-- Voting Progress -->
              <div class="voting-progress pt-3">
                <div class="d-flex justify-space-between text-caption mb-2">
                  <span>{{ t('pages.xdao.required') }}: {{ Number(proposal.votesRequired).toLocaleString() }}</span>
                  <span>{{ t('pages.xdao.total') }}: {{ Number(proposal.votesYes + proposal.votesNo).toLocaleString() }}</span>
                </div>
              
                <VProgressLinear
                  :model-value="(proposal.votesYes + proposal.votesNo) / proposal.votesRequired * 100"
                  color="primary"
                  height="20"
                  rounded
                >
                  <template #default>
                    <div class="progress-segments">
                      <div 
                        class="progress-yes"
                        :style="{ width: `${(proposal.votesYes / proposal.votesRequired) * 100}%` }"
                        v-if="proposal.votesYes > 0"
                      >
                      </div>
                      <div 
                        class="progress-no"
                        :style="{ 
                          width: `${(proposal.votesNo / proposal.votesRequired) * 100}%`,
                          left: `${(proposal.votesYes / proposal.votesRequired) * 100}%`
                        }"
                        v-if="proposal.votesNo > 0"
                      >
                      </div>
                    </div>
                  </template>
                </VProgressLinear>

                <div class="d-flex justify-space-between text-caption mt-2">
                  <span class="text-success">{{ t('pages.xdao.yes') }}: {{ Number(proposal.votesYes).toLocaleString() }}</span>
                  <VChip
                    variant="tonal"
                    size="x-small"
                    :color="getPercentageColor(proposal)"
                    class="percentage-chip"
                  >
                    {{ Math.round(((proposal.votesYes + proposal.votesNo) / proposal.votesRequired) * 100) }}%
                  </VChip>
                  <span class="text-error">{{ t('pages.xdao.no') }}: {{ Number(proposal.votesNo).toLocaleString() }}</span>
                </div>
              </div>
            </VCardText>
          </VCard>
        </div>

        <!-- Add Proposal View -->
        <div v-if="activeTab === 1">
          <AddProposalTab @proposalAdded="onProposalAdded" />
        </div>
      </VCol>
    </VRow>


    <!-- Proposal Detail Dialog -->
    <ProposalDetailDialog
      v-model="showProposalDetail"
      :proposal="selectedProposal"
      :zelid="userZelid"
      @showLogin="openLoginBottomSheet"
    />

    <!-- Debug Info -->
    <div v-if="$route.query.debug" class="debug-info pa-4 ma-4 bg-surface rounded">
      <h4>{{ t('pages.xdao.debugInfo') }}</h4>
      <p>showAddProposal: {{ showAddProposal }}</p>
      <p>showProposalDetail: {{ showProposalDetail }}</p>
      <p>proposals.length: {{ proposals.length }}</p>
      <p>activeFilter: {{ activeFilter }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSEO, generateOrganizationSchema, generateBreadcrumbSchema } from '@/composables/useSEO'
import { useAnalytics } from '@/plugins/analytics/composables/useAnalytics'
import axios from 'axios'
import { useFluxStore } from '@/stores/flux'
import { storeToRefs } from 'pinia'
import { useLoginSheet } from '@/composables/useLoginSheet'

// Import components
import ProposalDetailDialog from '@/components/xdao/ProposalDetailDialog.vue'
import AddProposalTab from '@/components/xdao/AddProposalTab.vue'

// Analytics
const analytics = useAnalytics()

// SEO for FluxDAO governance page
useSEO({
  title: 'FluxDAO - Decentralized Governance | Flux Network',
  description: 'Participate in FluxDAO governance. Vote on proposals, submit ideas, and shape the future of Flux decentralized cloud. Community-driven decisions.',
  url: 'https://cloud.runonflux.com/xdao-app',
  keywords: 'FluxDAO, DAO, decentralized governance, voting, proposals, blockchain governance, community governance, flux governance, DAO voting',
  structuredData: [
    generateOrganizationSchema(),
    generateBreadcrumbSchema([
      { name: 'Home', url: 'https://cloud.runonflux.com' },
      { name: 'FluxDAO', url: 'https://cloud.runonflux.com/xdao-app' },
    ]),
  ],
})

const { t } = useI18n()
const { openLoginBottomSheet, closeLoginBottomSheet } = useLoginSheet()

// Stores
const fluxStore = useFluxStore()
const { privilege, zelid } = storeToRefs(fluxStore)

// Reactive data
const proposals = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const activeFilter = ref('open')
const sortBy = ref('latest')
const showAddProposal = ref(false)
const showProposalDetail = ref(false)
const selectedProposal = ref(null)
const showMobileFilters = ref(false)
const activeFilterIndex = ref(0)
const activeTab = ref(0)

// Authentication computed values
const isLoggedIn = computed(() => privilege.value !== 'none')
const userZelid = computed(() => zelid.value)

// Proposal filters with counts
const proposalFilters = computed(() => {
  const getCount = filterValue => {
    return proposals.value.filter(proposal => {
      if (filterValue === 'open') return proposal.status === 'Open'
      if (filterValue === 'passed') return proposal.status === 'Passed'
      if (filterValue === 'unpaid') {
        return proposal.status === 'Unpaid' ||
               (proposal.status.includes('Unpaid') && !proposal.status.includes('Rejected') && !proposal.status.includes('Not Enough Votes'))
      }
      if (filterValue === 'rejected') {
        return (proposal.status.includes('Rejected') || proposal.status === 'Rejected')
      }

      return false
    }).length
  }

  return [
    { title: t('pages.xdao.open'), icon: 'mdi-clock-outline', value: 'open', count: getCount('open') },
    { title: t('pages.xdao.passed'), icon: 'mdi-check-circle-outline', value: 'passed', count: getCount('passed') },
    { title: t('pages.xdao.rejected'), icon: 'mdi-close-circle-outline', value: 'rejected', count: getCount('rejected') },
    { title: t('pages.xdao.unpaid'), icon: 'mdi-currency-usd-off', value: 'unpaid', count: getCount('unpaid') },
  ]
})

// Sort options
const sortOptions = computed(() => [
  { title: t('pages.xdao.latest'), value: 'latest' },
  { title: t('pages.xdao.titleAsc'), value: 'title-asc' },
  { title: t('pages.xdao.titleDesc'), value: 'title-desc' },
  { title: t('pages.xdao.endDate'), value: 'end-date' },
])

// Computed properties
const filteredProposals = computed(() => {
  let filtered = proposals.value

  // Apply filter
  filtered = filtered.filter(proposal => {
    console.log('Filtering proposal:', proposal.topic, 'Status:', proposal.status, 'Filter:', activeFilter.value)

    if (activeFilter.value === 'open') {
      return proposal.status === 'Open'
    }
    if (activeFilter.value === 'passed') {
      return proposal.status === 'Passed'
    }
    if (activeFilter.value === 'unpaid') {
      // Check for unpaid variations (excluding rejected ones)
      return proposal.status === 'Unpaid' ||
             (proposal.status.includes('Unpaid') && !proposal.status.includes('Rejected') && !proposal.status.includes('Not Enough Votes'))
    }
    if (activeFilter.value === 'rejected') {
      // Check for all rejected variations (including "Rejected Unpaid")
      return (proposal.status.includes('Rejected') || proposal.status === 'Rejected')
    }

    return false
  })

  console.log('Filtered results for', activeFilter.value, ':', filtered.length, 'proposals')

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(proposal => 
      proposal.topic.toLowerCase().includes(query) ||
      proposal.description.toLowerCase().includes(query) ||
      (proposal.nickName && proposal.nickName.toLowerCase().includes(query)),
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    if (sortBy.value === 'title-asc') return a.topic.localeCompare(b.topic)
    if (sortBy.value === 'title-desc') return b.topic.localeCompare(a.topic)
    if (sortBy.value === 'end-date') return a.voteEndDate - b.voteEndDate
    
    return b.submitDate - a.submitDate // latest by default
  })

  return filtered
})

// Methods
const fetchProposals = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching proposals from API...')
    
    // Always use direct URL for now to ensure it works
    const apiUrl = 'https://stats.runonflux.io/proposals/listProposals'
    
    console.log('API URL:', apiUrl)
    
    const response = await axios.get(apiUrl, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })
    
    console.log('API Response:', response.data)
    
    if (response.data && response.data.status === 'success') {
      console.log('Proposals received:', response.data.data.length)
      proposals.value = response.data.data || []
      error.value = null
      
      // Debug: Show all unique status values
      const statuses = [...new Set(proposals.value.map(p => p.status))]
      console.log('Unique status values found:', statuses)
    } else {
      console.error('API returned error:', response.data)
      proposals.value = []
      error.value = t('pages.xdao.errors.loadProposalsServer')
    }
  } catch (err) {
    console.error('Error fetching proposals:', err)
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      response: err.response?.data,
      status: err.response?.status,
    })
    proposals.value = []

    // Set user-friendly error message
    if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
      error.value = t('pages.xdao.errors.networkFailed')
    } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      error.value = t('pages.xdao.errors.timeout')
    } else if (err.response?.status >= 500) {
      error.value = t('pages.xdao.errors.serverError')
    } else if (err.response?.status === 404) {
      error.value = t('pages.xdao.errors.serviceNotFound')
    } else {
      error.value = t('pages.xdao.errors.loadProposalsGeneric')
    }
  } finally {
    loading.value = false
    console.log('Final proposals count:', proposals.value.length)
  }
}

const setFilter = filter => {
  activeFilter.value = filter
  activeTab.value = 0 // Switch back to proposals view
  // Update the index for mobile chip group
  const index = proposalFilters.value.findIndex(f => f.value === filter)
  if (index !== -1) {
    activeFilterIndex.value = index
  }

  // Keep filters visible after selection for better UX
  // Don't close mobile filters when a filter is selected
}

// Switch to Add Proposal tab
const openAddProposal = () => {
  activeTab.value = 1
}

const openProposal = proposal => {
  selectedProposal.value = proposal
  showProposalDetail.value = true

  // Track proposal view
  analytics.trackXDAO('view_proposal', {
    proposal_hash: proposal.hash,
    proposal_status: proposal.status,
    proposal_topic: proposal.topic?.substring(0, 100),
  })
}


const onProposalAdded = () => {
  // Track proposal creation
  analytics.trackXDAO('create_proposal', {
    success: true,
  })

  fetchProposals() // Refresh proposals list
  activeTab.value = 0 // Switch back to view proposals tab
}

const getStatusColor = status => {
  if (status === 'Open') return 'warning'
  if (status === 'Passed') return 'success'

  // Regular unpaid proposals should be info color
  if (status === 'Unpaid' || (status.includes('Unpaid') && !status.includes('Rejected'))) return 'info'

  // All rejected proposals (including "Rejected Unpaid") should be error color
  if (status.includes('Rejected') || status === 'Rejected') return 'error'

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
  if (progress >= 0.75) return 'warning'
  
  return 'info'
}

const getAvatarText = name => {
  return name?.charAt(0).toUpperCase() || '?'
}

const formatDate = timestamp => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getEmptyStateTitle = () => {
  const filterLabels = {
    'open': t('pages.xdao.noOpenProposals'),
    'passed': t('pages.xdao.noPassedProposals'),
    'unpaid': t('pages.xdao.noUnpaidProposals'),
    'rejected': t('pages.xdao.noRejectedProposals'),
  }

  return filterLabels[activeFilter.value] || t('pages.xdao.noProposalsFound')
}

const getEmptyStateMessage = () => {
  const messages = {
    'open': t('pages.xdao.noOpenProposalsMessage'),
    'passed': t('pages.xdao.noPassedProposalsMessage'),
    'unpaid': t('pages.xdao.noUnpaidProposalsMessage'),
    'rejected': t('pages.xdao.noRejectedProposalsMessage'),
  }

  return messages[activeFilter.value] || t('pages.xdao.tryDifferentFilter')
}

const formatDescription = text => {
  if (!text) return ''
  
  // For titles in list view, keep it simple (no tables)
  let formatted = text

    // Escape basic HTML
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    
    // Convert **bold** text
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    
    // Convert list items (lines starting with * followed by space)
    .replace(/^(\s*)\*\s+(.+)$/gm, '$1• $2')
    
    // Convert newlines to line breaks
    .replace(/\n/g, '<br>')
    
    // Convert tabs to spaces
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
    
    // Preserve multiple spaces
    .replace(/  /g, '&nbsp;&nbsp;')
  
  return formatted
}

const stripFormatting = text => {
  if (!text) return ''
  
  // Strip all formatting to show clean text
  let stripped = text

    // Remove bold markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    
    // Remove single asterisks (list markers)
    .replace(/^\s*\*\s+/gm, '')
    
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    
    // Trim
    .trim()
  
  return stripped
}

const getPercentageColor = proposal => {
  if (proposal.status === 'Passed') return 'success'  // Green - passed
  if (proposal.status === 'Open') return 'primary'    // Blue - in progress
  
  return 'error' // Red - not passed (rejected, unpaid, etc.)
}

// Watch for debugging
watch(showAddProposal, (newValue, oldValue) => {
  console.log('showAddProposal changed from', oldValue, 'to', newValue)
})

// Lifecycle
// Watch for login status changes
watch(isLoggedIn, newValue => {
  if (newValue) {
    closeLoginBottomSheet()
  }
})

onMounted(() => {
  // Track xDAO page view
  analytics.trackXDAO('page_view', {
    page: 'xdao',
    is_logged_in: isLoggedIn.value,
  })

  fetchProposals()
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
/* Apply border and border-radius to all cards */
:deep(.v-card) {
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

.xdao-intro-card {
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

.xdao-intro-card h2 {
  line-height: 1.2;
  word-break: keep-all;
}

/* Mobile responsive adjustments */
@media (max-width: 599px) {
  .xdao-intro-card h2 {
    font-size: 1.5rem !important;
  }

  .xdao-intro-card .v-avatar {
    width: 48px !important;
    height: 48px !important;
  }

  .xdao-intro-card .v-icon {
    font-size: 24px !important;
  }

  .xdao-intro-card .v-card-text {
    padding: 16px !important;
  }
}

.proposal-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.proposal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.15);
  border-color: rgba(var(--v-theme-primary), 0.25);
}

.proposal-card:active {
  transform: translateY(-2px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

/* Ensure formatted content in description preview doesn't break layout */
.line-clamp-2 b {
  font-weight: 600;
}

.line-clamp-2 br {
  display: none; /* Hide line breaks in preview */
}

/* Voting Progress */
.voting-progress {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.progress-segments {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  overflow: hidden;
}

.progress-yes {
  position: absolute;
  top: 0;
  left: 0;
  background-color: rgb(var(--v-theme-success)) !important;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

.progress-no {
  position: absolute;
  top: 0;
  background-color: rgb(var(--v-theme-error)) !important;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

.progress-yes {
  position: absolute;
  top: 0;
  left: 0;
  background-color: #4CAF50;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 3px,
    rgba(255, 255, 255, 0.4) 3px,
    rgba(255, 255, 255, 0.4) 6px
  );
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  animation: progress-bar-stripes 1.5s linear infinite;
}

.progress-no {
  position: absolute;
  top: 0;
  background-color: #f44336;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 3px,
    rgba(255, 255, 255, 0.4) 3px,
    rgba(255, 255, 255, 0.4) 6px
  );
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  animation: progress-bar-stripes 1.5s linear infinite;
}

@keyframes progress-bar-stripes {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 6px 0;
  }
}

/* Override Vuetify progress bar styles */
.v-progress-linear__content {
  overflow: hidden;
}

.v-progress-linear__determinate {
  display: none !important;
}

/* Improved mobile spacing */
@media (max-width: 767px) {
  .xdao-app {
    padding: 12px;
  }
  
  .proposal-card .v-card-text {
    padding: 16px !important;
  }
}


/* Better focus states for accessibility */
.proposal-card:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* Smooth animations for filter chips */
.v-chip {
  transition: all 0.2s ease;
}

.v-chip:hover {
  transform: translateY(-1px);
}

/* Enhanced progress bar styling */
.v-progress-linear {
  border-radius: 8px !important;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Better button hover states */
.v-btn {
  transition: all 0.2s ease;
}

.v-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.25);
}

/* Improved list item styling */
.v-list-item {
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.v-list-item--active {
  background-color: rgba(var(--v-theme-secondary), 0.12) !important;
  color: rgb(var(--v-theme-secondary)) !important;
}

/* Compact sidebar styling */
.compact-sidebar {
  font-size: 0.875rem;
}

.compact-sidebar .v-list-subheader {
  font-size: 0.75rem;
  font-weight: 600;
  padding-top: 8px;
  padding-bottom: 8px;
}

.compact-list-item {
  min-height: 36px !important;
  padding: 4px 8px !important;
}

.compact-list-item .v-list-item__content {
  padding: 4px 0 !important;
}

.compact-list-item .v-list-item-title {
  font-size: 0.875rem !important;
  line-height: 1.2 !important;
}

.compact-list-item .v-icon {
  font-size: 18px !important;
}

/* Fix sidebar scroll behavior - always visible scroll */
.sidebar-list {
  overflow-y: auto;
  max-height: 400px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.3) transparent;
}

.sidebar-list::-webkit-scrollbar {
  width: 4px;
}

.sidebar-list::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-list::-webkit-scrollbar-thumb {
  background-color: rgba(var(--v-theme-primary), 0.3);
  border-radius: 2px;
}

.sidebar-list::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--v-theme-primary), 0.5);
}

/* Ensure cards don't overflow */
.v-card {
  max-width: 100%;
  box-sizing: border-box;
}

/* Add Proposal Button Styling */
.add-proposal-btn {
  min-width: 120px;
  font-weight: 600;
}

@media (max-width: 767px) {
  .add-proposal-btn {
    width: 100%;
    margin-top: 8px;
  }
  
  /* On mobile, stack the controls vertically */
  .search-controls .v-col {
    padding-bottom: 8px;
  }

  /* Compact badges on mobile */
  .badge-xs :deep(.v-badge__badge) {
    font-size: 11px !important;
    height: 16px !important;
    min-width: 16px !important;
    padding: 0 4px !important;
  }
}

/* Filter grid styles */
.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  align-items: start;
}

.filter-chip {
  justify-content: space-between !important;
  min-height: 36px;
  width: 100%;
}

/* When there are fewer chips, let them expand */
@media (max-width: 479px) {
  .filter-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

@media (min-width: 480px) and (max-width: 599px) {
  .filter-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
}

/* Make last chip full width when it's alone on the last row */
.last-full-width {
  grid-column: 1 / -1;
  justify-content: center !important;
}
</style>