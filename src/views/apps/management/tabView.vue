<template>
  <div class="myapps-table-wrapper">
    <VCard class="pa-4">
      <VRow>
        <VCol cols="4">
          <VSelect
            v-model="tableOptions.perPage"
            :label="t('pages.apps.table.perPage')"
            density="compact"
            :items="tableOptions.pageOptions"
          />
        </VCol>
        <VCol
          cols="8"
          class="d-flex align-center justify-start"
        >
          <VTextField
            v-model="tableOptions.filter"
            :label="t('pages.apps.table.filter')"
            density="compact"
            variant="outlined"
            :placeholder="t('pages.apps.table.filterPlaceholder')"
            :clearable="tableOptions.filter?.length > 0"
            class="mr-1"
          >
            <template #append-inner>
              <VIcon size="20">
                tabler-search
              </VIcon>
            </template>
          </VTextField>
          <VMenu v-if="privilege !== 'none'" :close-on-content-click="false">
            <template #activator="{ props: activatorPropsMenu }">
              <VTooltip location="top">
                <template #activator="{ props: tooltipActivatorProps }">
                  <VBtn
                    icon="mdi-filter-cog"
                    density="compact"
                    variant="text"
                    color="default"
                    v-bind="{
                      ...activatorPropsMenu,
                      ...tooltipActivatorProps
                    }"
                  />
                </template>
                <span>{{ t('pages.apps.table.advancedFilterTooltip') }}</span>
              </VTooltip>
            </template>

            <VList style="min-width: 300px" class="my-2" @keydown.enter.stop>
              <!-- Mode Filter (Marketplace, etc.) -->
              <VListItem>
                <VSelect
                  v-model="selectedMode"
                  :items="modeOptions"
                  item-title="text"
                  item-value="value"
                  :label="t('pages.apps.table.appType')"
                  density="compact"
                  hide-details
                  class="mt-1"
                >
                  <template #prepend-inner>
                    <VIcon class="mr-1" size="18">mdi-filter</VIcon>
                  </template>
                </VSelect>
              </VListItem>

              <!-- Version Filter -->
              <VListItem>
                <VSelect
                  v-model="tableOptions.version"
                  :items="versionOptions"
                  item-title="text"
                  item-value="value"
                  :label="t('pages.apps.table.version')"
                  density="compact"
                  hide-details
                  class="mt-1"
                >
                  <template #prepend-inner>
                    <VIcon class="mr-1" size="18">mdi-tag</VIcon>
                  </template>
                </VSelect>
              </VListItem>

              <!-- Min HDD -->
              <VListItem>
                <VTextField
                  v-model.number="tableOptions.minHdd"
                  :label="t('pages.apps.table.minHdd')"
                  type="number"
                  min="1"
                  step="1"
                  density="compact"
                  hide-details
                  class="mt-1"
                >
                  <template #prepend-inner>
                    <VIcon class="mr-1" size="18">mdi-harddisk</VIcon>
                  </template>
                </VTextField>
              </VListItem>

              <VListItem>
                <VTextField
                  v-model.number="tableOptions.minRam"
                  :label="t('pages.apps.table.minRam')"
                  type="number"
                  min="100"
                  step="100"
                  density="compact"
                  hide-details
                  class="mt-1"
                >
                  <template #prepend-inner>
                    <VIcon class="mr-1" size="18">mdi-memory</VIcon>
                  </template>
                </VTextField>
              </VListItem>

              <VListItem>
                <VTextField
                  v-model.number="tableOptions.minCpu"
                  :label="t('pages.apps.table.minCpu')"
                  type="number"
                  min="0.1"
                  step="0.1"
                  density="compact"
                  hide-details
                  class="mt-1"
                >
                  <template #prepend-inner>
                    <VIcon class="mr-1" size="18">mdi-speedometer</VIcon>
                  </template>
                </VTextField>
              </VListItem>

              <!-- Min Instances -->
              <VListItem>
                <VTextField
                  v-model.number="tableOptions.minInstances"
                  :label="t('pages.apps.table.minInstances')"
                  type="number"
                  density="compact"
                  min="3"
                  step="1"
                  hide-details
                  class="mt-1"
                >
                  <template #prepend-inner>
                    <VIcon class="mr-1" size="18">mdi-map-marker</VIcon>
                  </template>
                </VTextField>
              </VListItem>
              <VListItem>
                <VTextField
                  v-model="inputTag"
                  :label="t('pages.apps.table.repotags')"
                  density="compact"
                  hide-details
                  clearable
                  :placeholder="t('pages.apps.table.repotagsPlaceholder')"
                  class="mt-1"
                  @keydown.enter.prevent="addRepotag"
                >
                  <template #prepend-inner>
                    <VIcon class="mr-1" size="18">mdi-tag</VIcon>
                  </template>
                </VTextField>
                <div v-if="tableOptions.repotags.length > 0" class="small-checkbox">
                  <VCheckbox
                    v-model="tableOptions.matchAllRepotags"
                    :label="t('pages.apps.table.matchAllTags')"
                    density="compact"
                    class="pa-0 ml-1"
                    hide-details
                  />
                </div>
                
                <div class="chip-group mt-1">
                  <VChip
                    v-for="(tag, index) in tableOptions.repotags"
                    :key="index"
                    closable
                    class="ma-1"
                    size="small"
                    color="success"
                    @click:close="removeRepotag(index)"
                  >
                    {{ tag }}
                  </VChip>
                </div>
              </VListItem>
              <VListItem v-if="hasActiveFilters">
                <VBtn
                  block
                  variant="tonal"
                  color="error"
                  density="compact"
                  @click="resetFilters"
                >
                  <VIcon start>mdi-filter-off</VIcon>
                  {{ t('pages.apps.table.clearFilters') }}
                </VBtn>
              </VListItem>
            </VList>
          </VMenu>
        </VCol>
      </VRow>

      <VSheet
        border
        rounded
        class="mt-4 table-sheet"
        style="max-height: none;"
      >
        <VDataTable
          v-model:page="tableOptions.currentPage"
          v-model:sort-by="tableOptions.sortBy"
          v-model:sort-desc="tableOptions.sortDesc"
          v-model:expanded="expanded"
          :items="filteredApps"
          :headers="mergedFields"
          :items-per-page="tableOptions.perPage"
          item-value="name"
          class="myapps-table"
          show-expand
          hide-default-footer
        >
          <template #no-data>
            <div class="text-center py-10 fade-in">
              <div
                v-if="loading"
                class="d-flex align-center justify-center"
              >
                <VProgressCircular
                  indeterminate
                  class="mr-1"
                  size="25"
                />
                <div>{{ t('pages.apps.table.loading') }}</div>
              </div>
              <div
                v-else-if="!loggedIn && manage"
                class="d-flex flex-column align-center justify-center "
              >
                <VRow>
                  <VCol cols="12" md="8" lg="6" class="mx-auto">
                    <div class="text-center">
                      <!-- Icon Container with gradient background -->
                      <div class="d-flex justify-center mb-4">
                        <VAvatar
                          size="120"
                          color="primary"
                          variant="tonal"
                          class="elevation-3 auth-icon-container"
                        >
                          <VIcon size="60" color="primary" class="auth-icon">
                            mdi-shield-lock-outline
                          </VIcon>
                        </VAvatar>
                      </div>
                      
                      <!-- Title and Description -->
                      <h1 class="text-h4 font-weight-bold mb-3">
                        {{ t('pages.apps.table.signInRequired') }}
                      </h1>
                      
                      <p class="text-body-1 text-medium-emphasis mb-8 px-4">
                        {{ t('pages.apps.table.signInDescription') }}
                      </p>
                      
                      <!-- Features List -->
                      <div class="d-flex justify-center mb-8">
                        <div style="display: inline-block;">
                          <div class="d-sm-flex gap-8">
                            <div>
                              <div class="d-flex align-center mb-2">
                                <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                                <span class="text-body-2 text-no-wrap">{{ t('pages.apps.table.features.viewApps') }}</span>
                              </div>
                              <div class="d-flex align-center mb-2">
                                <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                                <span class="text-body-2 text-no-wrap">{{ t('pages.apps.table.features.manageResources') }}</span>
                              </div>
                            </div>
                            <div>
                              <div class="d-flex align-center mb-2">
                                <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                                <span class="text-body-2 text-no-wrap">{{ t('pages.apps.table.features.monitorPerformance') }}</span>
                              </div>
                              <div class="d-flex align-center">
                                <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                                <span class="text-body-2 text-no-wrap">{{ t('pages.apps.table.features.controlDeployments') }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Action Buttons -->
                      <div class="d-flex flex-column flex-sm-row justify-center gap-2">
                        <VBtn
                          color="primary"
                          variant="flat"
                          @click="openLoginBottomSheet"
                        >
                          <VIcon size="22" class="mr-2">mdi-login-variant</VIcon>
                          {{ t('pages.apps.table.signIn') }}
                        </VBtn>
                        <VBtn
                          variant="flat"
                          href="https://runonflux.io"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <VIcon size="22" class="mr-2">mdi-information-outline</VIcon>
                          {{ t('pages.apps.table.learnMore') }}
                        </VBtn>
                      </div>
                    </div>
                  </VCol>
                </VRow>
              </div>
              <div
                v-else-if="appsDataRaw.length > 0 && filteredApps.length === 0"
                class="d-flex align-center justify-center"
              >
                <VIcon
                  icon="mdi-magnify"
                  class="mr-2"
                />
                <div>{{ t('pages.apps.table.noMatchingApps') }}</div>
              </div>
              <div
                v-else-if="apiError"
                class="d-flex align-center justify-center"
              >
                <VIcon
                  icon="tabler-wifi-off"
                  class="mr-2"
                  size="24"
                  color="error"
                />
                <div class="text-error">
                  {{ t('pages.apps.table.connectionError') }}
                </div>
              </div>
              <div v-else>
                <VIcon
                  icon="tabler-search-off"
                  class="mr-2"
                />
                <div>{{ t('pages.apps.table.noApps') }}</div>
              </div>
            </div>
          </template>

          <template #headers="{ columns }">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                class="text-start"
              >
                {{ column.title }}
              </th>
            </tr>
          </template>

          <template #item.data-table-expand="{ internalItem, isExpanded }">
            <VBtn
              :icon="isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              size="small"
              variant="text"
              @click.stop.prevent="handleExpandClick(internalItem)"
            />
          </template>

          <template #item.name="{ item }">
            <div class="col-name text-left">
              <VChip
                color="info"
                class="mr-1 mb-1"
                density="comfortable"
                size="small"
                rounded="pill"
                style="margin-top: 5px"
              >
                <VIcon
                  start
                  icon="mdi-square-rounded-badge-outline"
                  size="16"
                />
                {{ item.name }}
              </VChip>
              <UsageChips
                :items="[
                  { icon: 'mdi-speedometer', value: getServiceUsageValue(1, item.name, item), color: 'success' },
                  { icon: 'mdi-memory', value: getServiceUsageValue(0, item.name, item), color: 'success' },
                  { icon: 'mdi-harddisk', value: getServiceUsageValue(2, item.name, item), color: 'success' },
                  { icon: 'mdi-map-marker', value: item.instances | 3, color: 'warning' }
                ].filter(chip => chip.value > 0)"
              />
              <small style="font-size: 12px">
                <ExpiryLabel
                  v-if="activeAppsTab"
                  :expire-time="labelForExpire(item.expire, item.height)"
                  class="mb-1"
                />
                <div
                  v-else
                  class="mb-1"
                />
              </small>
            </div>
          </template>

          <template #item.status="{ item }">
            <VChip
              :color="getAppStatusColor(item.name)"
              size="small"
              rounded="pill"
            >
              {{ appStatusMap.get(item.name) || t('pages.apps.table.checking') }}
            </VChip>
          </template>

          <template #item.description="{ item }">
            <div class="col-description text-secondary">
              {{ item.description }}
            </div>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr
              class="expanded-row"
              :data-name="item.name"
            >
              <td :colspan="columns.length">
                <div class="pa-0 expanded-content-wrapper">
                  <AppDetailsCard
                    :app="item"
                    :active-apps-tab="activeAppsTab"
                    :is-marketplace="isMarketplace"
                    show-general-section
                    :get-new-expire-label="labelForExpire(item.expire, item.height)"
                    class="mt-4"
                  />

                  <div  v-if="normalizeComponents(item).length > 0">
                    <h3 class="d-flex align-center justify-start mb-3 mt-3">
                      <VChip
                        color="info"
                        variant="tonal"
                        class="composition-chip"
                      >
                        <VIcon
                          size="22"
                          class="ml-1"
                        >
                          mdi-hexagon-multiple
                        </VIcon>
                        <span class="ml-1">{{ t('pages.apps.table.composition') }}</span>
                      </VChip>
                    </h3>

                    <VTabs
                      v-model="activeTabLocalIndexSpec"
                      align-tabs="start"
                      background-color="transparent"
                      color="primary"
                      height="30"
                      hide-slider
                      class="mb-4 tabs-no-slider"
                    >
                      <VTab
                        v-for="(component, index) in normalizeComponents(item)"
                        :key="index"
                        :value="index"
                        class="tab-chip"
                        variant="flat"
                      >
                        <VIcon
                          size="18"
                          class="mr-1"
                        >
                          mdi-cube
                        </VIcon>
                        {{ component.name }}
                      </VTab>
                    </VTabs>

                    <VWindow
                      v-model="activeTabLocalIndexSpec"
                      class="px-4 window-content"
                      :touch="false"
                    >
                      <VWindowItem
                        v-for="(component, index) in normalizeComponents(item)"
                        :key="index"
                        :value="index"
                      >
                        <VSlideYTransition mode="out-in">
                          <div>
                            <ComponentDetails
                              :component="component"
                              :app-name="item.name || ''"
                              :index="index"
                            />
                          </div>
                        </VSlideYTransition>
                      </VWindowItem>
                    </VWindow>
                  </div>
                  <div class="locations-wrapper">
                    <h3
                      v-if="
                        activeAppsTab &&
                          appLocationsMap[item.name] &&
                          appLocationsMap[item.name].length
                      "
                      class="d-flex align-center justify-start mb-4 mt-4"
                    >
                      <VChip
                        color="info"
                        variant="tonal"
                        class="composition-chip"
                      >
                        <VIcon
                          size="22"
                          class="ml-1"
                        >
                          mdi-map-marker-radius
                        </VIcon>
                        <span class="ml-2">{{ t('pages.apps.table.locations') }}</span>
                      </VChip>
                    </h3>
                    <Locations
                      v-if="
                        activeAppsTab &&
                          appLocationsMap[item.name] &&
                          appLocationsMap[item.name].length
                      "
                      :app-locations="appLocationsMap[item.name] || []"
                      :expanded="expanded.includes(item.name)"
                      :app-spec="item"
                    />
                  </div>
                </div>
              </td>
            </tr>
          </template>


          <template #item.actions="{ item }">
            <Manage
              v-if="activeAppsTab"
              :row="{ item }"
              :show-manage="manage"
              :show-install="showInstall"
              :show-control="showControl"
              @openAppManagement="openAppManagement"
            />
            <Redeploy
              v-else
              :row="{ item }"
            />
          </template>
        </VDataTable>
      </VSheet>

      <div v-if="loggedIn || !manage">
        <VRow
          class="mt-3 mb-1"
          justify="center"
        >
          <VPagination
            v-model="tableOptions.currentPage"
            :length="pageCount"
            rounded
            size="small"
            total-visible="5"
          />
        </VRow>
      </div>
    </VCard>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useLoginSheet } from '@/composables/useLoginSheet'
import Manage from "@/views/apps/management/manage.vue"
import Redeploy from "@/views/apps/management/redeploy.vue"
import AppsService from "@/services/AppsService"

const props = defineProps({
  apps: Array,
  loading: Boolean,
  loggedIn: Boolean,
  currentBlockHeight: Number,
  activeAppsTab: Boolean,
  isMarketplace: {
    type: Boolean,
    default: false,
  },
  manage: {
    type: Boolean,
    default: false,
  },
  apiError: Boolean,
  showStatus: {
    type: Boolean,
    default: false,
  },
  showInstall: {
    type: [Boolean, Function],
    default: false,
  },
  showControl: {
    type: [Boolean, Function],
    default: false,
  },
  privilege: {
    type: String,
    default: '',
  },
})
const emit = defineEmits(["openAppManagement"])
const { t } = useI18n()
const { openLoginBottomSheet, closeLoginBottomSheet } = useLoginSheet()

const activeTabLocalIndexSpec = ref(0)

const tableOptions = ref({
  perPage: 10,
  pageOptions: [5, 10, 25, 50, 100],
  currentPage: 1,
  sortBy: [],
  sortDesc: false,
  filter: "",
  repotags: [],
  matchAllRepotags: false,
  version: 'all',
})

const inputTag = ref('')

const modeOptions = computed(() => [
  { text: t('pages.apps.table.modeOptions.all'), value: 'all', icon: 'mdi-apps-box' },
  { text: t('pages.apps.table.modeOptions.marketplace'), value: 'marketplace', icon: 'mdi-basket' },
  { text: t('pages.apps.table.modeOptions.marketplaceExcluded'), value: 'marketplaceExcluded', icon: 'mdi-basket-off' },
])

const versionOptions = computed(() => [
  { text: t('pages.apps.table.versionOptions.all'), value: 'all', icon: 'mdi-tag-multiple' },
  { text: t('pages.apps.table.versionOptions.v3'), value: 3, icon: 'mdi-numeric-3-circle' },
  { text: t('pages.apps.table.versionOptions.v4'), value: 4, icon: 'mdi-numeric-4-circle' },
  { text: t('pages.apps.table.versionOptions.v5'), value: 5, icon: 'mdi-numeric-5-circle' },
  { text: t('pages.apps.table.versionOptions.v6'), value: 6, icon: 'mdi-numeric-6-circle' },
  { text: t('pages.apps.table.versionOptions.v7'), value: 7, icon: 'mdi-numeric-7-circle' },
  { text: t('pages.apps.table.versionOptions.v8'), value: 8, icon: 'mdi-numeric-8-circle' },
])

function isMarketplaceApp(name) {
  if (name.length >= 14) {
    const possibleDateString = name.substring(name.length - 13)
    const possibleDate = Number(possibleDateString)
    
    return !isNaN(possibleDate)
  }
  
  return false
}

const mergedActivatorProps = computed(() => ({
  ...activatorPropsMenu,
  ...tooltipActivatorProps,
}))

const selectedMode = ref('all')

const expanded = ref([])
const appLocationsMap = ref({})

const appsDataRaw = computed(() => (Array.isArray(props.apps) ? props.apps : []))

// Filter the apps based on mode and search filter
const filteredApps = computed(() => {
  let filtered = appsDataRaw.value

  // 1. Filter by app type mode
  if (selectedMode.value === 'marketplace') {
    filtered = filtered.filter(app => isMarketplaceApp(app.name))
  } else if (selectedMode.value === 'marketplaceExcluded') {
    filtered = filtered.filter(app => !isMarketplaceApp(app.name))
  }

  // 2. Filter by version
  if (tableOptions.value.version && tableOptions.value.version !== 'all') {
    filtered = filtered.filter(app => app.version === tableOptions.value.version)
  }

  // 3. Filter by search keyword
  const keyword = tableOptions.value.filter?.toLowerCase()
  if (keyword) {
    filtered = filtered.filter(app =>
      app.name?.toLowerCase().includes(keyword) ||
      app.description?.toLowerCase().includes(keyword),
    )
  }

  // 4. Filter by repotags
  const inputTags = (tableOptions.value.repotags || []).map(tag => tag.toLowerCase().trim())

  if (inputTags.length > 0) {
    filtered = filtered.filter(app => {
      const rawTags = [
        ...(app.repotag || []),
        ...(Array.isArray(app.compose) ? app.compose.flatMap(c => c.repotag || []) : []),
      ]
      const appTags = rawTags.map(t => t.toLowerCase())

      return tableOptions.value.matchAllRepotags
        ? inputTags.every(tag => appTags.some(appTag => appTag.includes(tag)))
        : inputTags.some(tag => appTags.some(appTag => appTag.includes(tag)))
    })
  }

  // 5. Filter by minimum HDD
  if (tableOptions.value.minHdd > 0) {
    filtered = filtered.filter(app => {
      const hdd = Array.isArray(app.compose)
        ? getServiceUsageValue(2, app.name, app)
        : +app.hdd
      
      return hdd >= tableOptions.value.minHdd
    })
  }

  // 6. Filter by minimum RAM
  if (tableOptions.value.minRam > 0) {
    filtered = filtered.filter(app => {
      const ram = Array.isArray(app.compose)
        ? getServiceUsageValue(0, app.name, app)
        : +app.ram
      
      return ram >= tableOptions.value.minRam
    })
  }

  // 7. Filter by minimum CPU
  if (tableOptions.value.minCpu > 0) {
    filtered = filtered.filter(app => {
      const cpu = Array.isArray(app.compose)
        ? +getServiceUsageValue(1, app.name, app)
        : +app.cpu
      
      return cpu >= tableOptions.value.minCpu
    })
  }

  // 8. Filter by minimum instances
  if (tableOptions.value.minInstances > 0) {
    filtered = filtered.filter(app => {
      const instanceCount = typeof app.instances === 'number' ? app.instances : 3
      
      return instanceCount >= tableOptions.value.minInstances
    })
  }

  return filtered
})

const pageCount = computed(() =>
  Math.ceil(filteredApps.value.length / tableOptions.value.perPage),
)

const isMobile = ref(false)

const defaultFields = computed(() => [
  { key: "data-table-expand", title: "", sortable: false, class: "col-expand" },
  { key: "name", title: t('pages.apps.table.headers.name'), sortable: true, class: "col-name" },
  ...(props.showStatus
    ? [{ key: "status", title: t('pages.apps.table.headers.status'), sortable: false, class: "col-status" }]
    : []),
  { key: "description", title: t('pages.apps.table.headers.description'), sortable: false, class: "col-description" },
  { key: "actions", title: "", sortable: false, align: "end", class: "col-actions" },
])

const mobileFields = computed(() => [
  { key: "data-table-expand", title: "", sortable: false, class: "col-expand" },
  { key: "name", title: t('pages.apps.table.headers.name'), sortable: true, class: "col-name-mobile" },
  { key: "actions", title: "", sortable: false, align: "end", class: "col-actions" },
])

const mergedFields = computed(() => isMobile.value ? mobileFields.value : defaultFields.value)

function openAppManagement(name) {
  emit("openAppManagement", name)
}

async function handleExpandClick(internalItem) {
  const name = internalItem.raw?.name
  if (!name) return
  if (expanded.value.includes(name)) expanded.value = []
  else {
    expanded.value = [name]
    nextTick(() => scrollToExpandedRow(name))
    await loadLocations(name)
  }
}

function scrollToExpandedRow(name) {
  setTimeout(() => {
    const parentRow = Array.from(
      document.querySelectorAll("tr.v-data-table__tr"),
    ).find(row => row.textContent.includes(name))

    if (parentRow) parentRow.scrollIntoView({ behavior: "auto", block: "center" })
  }, 100)
}

async function loadLocations(name) {
  if (appLocationsMap.value[name]) return // already fetched
  try {
    appLocationsMap.value[name] = [] // ⬅️ preload empty to prevent multiple clicks double fetch

    const response = await AppsService.getAppLocation(name)
    if (response.data.status === "success") {
      appLocationsMap.value[name] = response.data.data
    }
  } catch (error) {
    console.error(`Error loading locations for ${name}:`, error.message)
  }
}

function getServiceUsageValue(index, name, app) {
  if (Array.isArray(app.compose)) {
    const usage = getServiceUsage(name, app.compose)

    return usage[index]
  }

  return [
    +app.ram,
    +app.cpu.toFixed(1),
    +app.hdd,
  ][index]
}

function getServiceUsage(serviceName, spec) {
  let totalRAM = 0
  let totalCPU = 0
  let totalHDD = 0

  spec.forEach(obj => {
    totalRAM += obj.ram
    totalCPU += obj.cpu
    totalHDD += obj.hdd
  })

  return [totalRAM, totalCPU.toFixed(1), totalHDD]
}

function labelForExpire(expire, height) {
  if (!height) return t('pages.apps.table.applicationExpired')
  if (props.currentBlockHeight === -1) return t('pages.apps.table.cannotCalculateExpiration')

  // Fork-aware default: if app was registered after fork, use 88000; otherwise 22000
  const forkBlock = 2020000
  const defaultExpire = height >= forkBlock ? 88000 : 22000
  const expires = expire || defaultExpire
  const effectiveExpiry = height + expires

  // Expiry block height is always: registration + expire blocks (no adjustment)
  const blocksToExpire = effectiveExpiry - props.currentBlockHeight
  if (blocksToExpire < 1) return t('pages.apps.table.applicationExpired')

  // Fork-aware time calculation: account for blocks before/after fork
  let minutes = 0

  if (props.currentBlockHeight < forkBlock) {
    // Currently before fork
    if (effectiveExpiry <= forkBlock) {
      // Expiry also before fork - simple calculation
      minutes = blocksToExpire * 2
    } else {
      // Expiry after fork - split calculation
      const blocksUntilFork = forkBlock - props.currentBlockHeight
      const blocksAfterFork = effectiveExpiry - forkBlock
      minutes = (blocksUntilFork * 2) + (blocksAfterFork * 0.5)
    }
  } else {
    // Currently after fork - all remaining blocks at post-fork speed
    minutes = blocksToExpire * 0.5
  }
  const units = { day: 1440, hour: 60, minute: 1 }
  const result = []
  let value = minutes
  for (const unit in units) {
    const p = Math.floor(value / units[unit])
    if (p > 0) result.push(`${p} ${unit}${p > 1 ? "s" : ""}`)
    value %= units[unit]
  }

  return result.slice(0, 3).join(", ")
}

function normalizeComponents(data) {
  if (!data) return []

  return data.version >= 4 ? data.compose : [{ ...data, repoauth: false }]
}

const appStatusMap = ref(new Map())

async function appsGetListRunningApps(timeout = 0) {
  setTimeout(async () => {
    try {
      const response = await AppsService.listRunningApps()
      const apps = response.data.data || []

      const defaultStatusMap = new Map()

      // Step 1: Set all installed apps as "stopped" by default
      for (const app of appsDataRaw.value) {
        if (app?.name) {
          defaultStatusMap.set(app.name, "exited")
        }
      }

      // Step 2: Overwrite with actual running states
      for (const app of apps) {
        const rawName = app.Names?.[0] || ""
        const namePart = rawName.startsWith("/flux") ? rawName.slice(5) : rawName.slice(4)
        const appName = namePart.includes("_") ? namePart.split("_")[1] : namePart

        if (!namePart.includes("watchtower") && appName) {
          defaultStatusMap.set(appName, app.State)
        }
      }

      appStatusMap.value = defaultStatusMap
    } catch (error) {
      console.error("Failed to load running apps:", error)
      appStatusMap.value = new Map()
    }
  }, timeout)
}

function getAppStatusColor(name) {
  const state = appStatusMap.value.get(name)

  switch (state) {
  case "running":
    return "success"
  case "restarting":
    return "warning"
  case "created":
  case "paused":
    return "blue-darken-4"
  case "exited":
    return "error"
  case "removing":
  case "dead":
  default:
    return "grey-darken-4"
  }
}
watch(
  () => props.apps,
  () => {
    if (props.showStatus) {
      appsGetListRunningApps()
    }
  },
)

// Watch for login status changes to close dialog when logged in
watch(() => props.loggedIn, newValue => {
  if (newValue) {
    closeLoginBottomSheet()
  }
})

function addRepotag() {
  const tag = inputTag.value.trim()
  if (!tag) return

  // Prevent duplicates (case-insensitive)
  const exists = tableOptions.value.repotags.some(
    t => t.toLowerCase() === tag.toLowerCase(),
  )
  if (!exists) {
    tableOptions.value.repotags.push(tag)
  }
  inputTag.value = ''
}

function removeRepotag(index) {
  tableOptions.value.repotags.splice(index, 1)
}

function resetFilters() {
  tableOptions.value.filter = ''
  tableOptions.value.version = 'all'
  tableOptions.value.minHdd = null
  tableOptions.value.minRam = null
  tableOptions.value.minCpu = null
  tableOptions.value.minInstances = null
  tableOptions.value.repotags = []
  tableOptions.value.matchAllRepotags = false
}

const hasActiveFilters = computed(() => {
  return (
    tableOptions.value.filter?.trim() ||
    (tableOptions.value.version && tableOptions.value.version !== 'all') ||
    (Array.isArray(tableOptions.value.repotags) && tableOptions.value.repotags.length > 0) ||
    (tableOptions.value.minRam ?? 0) > 0 ||
    (tableOptions.value.minCpu ?? 0) > 0 ||
    (tableOptions.value.minHdd ?? 0) > 0 ||
    (tableOptions.value.minInstances ?? 0) > 0 ||
    tableOptions.value.matchAllRepotags
  )
})


function checkMobile() {
  isMobile.value = window.innerWidth <= 960
}

onMounted(() => {
  if (props.showStatus) {
    appsGetListRunningApps()
  }

  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.text-center {
  text-align: center;
}
.py-10 {
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}
.my-4 {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
.mt-2 {
  margin-top: 0.5rem;
}
.text-medium-emphasis {
  color: rgba(0, 0, 0, 0.6);
  font-size: 18px;
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Avatar container animation */
.auth-icon-container {
  animation: float 3s ease-in-out infinite;
  transition: transform 0.3s ease;
  position: relative;
}

.auth-icon-container:hover {
  transform: scale(1.1);
}

/* Icon pulse animation */
.auth-icon {
  animation: pulse 2s ease-in-out infinite;
}

/* Float animation */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Pulse animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(0.95);
  }
}

/* Glow effect animation */
.auth-icon-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.4) 0%, transparent 70%);
  animation: glow 3s ease-in-out infinite;
  z-index: -1;
}

@keyframes glow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

/* Your extra table styles */
.myapps-table .v-data-table__wrapper {
  overflow-x: auto;
}

@media (max-width: 960px) {
  .myapps-table .v-data-table__wrapper {
    overflow-x: hidden !important;
  }
}
.myapps-table .col-expand {
  width: 35px;
  min-width: 35px;
  max-width: 35px;
  padding: 0px;
}
.myapps-table .col-name {
  min-width: 240px;
  max-width: 280px;
}
.myapps-table .col-description {
  min-width: 200px;
}
.myapps-table .col-actions {
  width: 120px;
  min-width: 120px;
  max-width: 120px;
  text-align: center;
}
.composition-chip {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: 8px 16px;
  border-radius: 15px;
  font-family: monospace;
  font-size: 18px;
}

.v-sheet {
  overflow-x: auto; /* Add horizontal scroll if needed */
}

@media (max-width: 960px) {
  .v-sheet {
    overflow-x: hidden !important;
  }
}

.v-data-table {
  min-width: 100%;
  max-width: 100%;
}

@media (max-width: 960px) {
  .v-data-table {
    overflow-x: hidden !important;
  }

  .v-data-table .v-table__wrapper {
    overflow-x: hidden !important;
  }
}

/* Optional: Control specific column sizes */
.myapps-table .col-expand {
  width: 30px;
  min-width: 30px;
  max-width: 30px;
}

/* Target the first column of MyAppsTable */
::v-deep(.myapps-table td.v-data-table__td:nth-child(1)),
::v-deep(.myapps-table th.v-data-table__th:nth-child(1)) {
  width: 55px;
  min-width: 55px;
  max-width: 55px;
  padding: 0px 0px 0px 10px !important;
}

/* Target the second column of MyAppsTable */
::v-deep(.myapps-table td.v-data-table__td:nth-child(2)),
::v-deep(.myapps-table th.v-data-table__th:nth-child(2)) {
  padding: 0px 10px 0px 0px !important;
  width: 240px;
  min-width: 240px;
  max-width: 290px;
}

.myapps-table .col-actions {
  width: 120px;
  min-width: 120px;
  max-width: 120px;
  text-align: center;
}

/* Scrollable wrapper inside table */
.myapps-table .v-data-table__wrapper {
  overflow-x: auto;
}

.expanded-content-wrapper {
  min-width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

.tab-chip {
  min-height: 30px !important;
  padding: 0 10px !important;
  border-radius: 30px !important;
  font-size: 16px !important;
  font-family: monospace;
  text-transform: none;
  margin-bottom: 8px !important;
}

/* ACTIVE tab */
.tab-chip[aria-selected="true"] {
  background-color: rgba(0, 123, 255, 0.1);
  padding: 0 10px !important;
  border-radius: 30px !important;
}

/* HOVER */
.tab-chip:hover {
  transform: scale(1.03);
}

/* REMOVE BORDER CORRECTLY */
.tabs-no-slider.v-tabs {
  border-block-end: none !important;
}

/* Mobile fixes for table content */
@media (max-width: 960px) {
  .window-content {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  /* Constrain VTabs and VWindow */
  .myapps-table .v-tabs {
    max-width: 100% !important;
    overflow-x: auto !important;
  }

  .myapps-table .v-window {
    max-width: 100% !important;
    overflow: hidden !important;
  }

  .myapps-table .v-window-item {
    max-width: 100% !important;
    overflow: hidden !important;
  }

  /* Prevent table from allowing horizontal scroll */
  .table-sheet {
    overflow: hidden !important;
    max-width: 100% !important;
    width: 100% !important;
  }

  .myapps-table-wrapper {
    overflow: hidden !important;
    max-width: 100% !important;
  }

  .myapps-table-wrapper .v-sheet {
    overflow: hidden !important;
    max-width: 100% !important;
  }

  .myapps-table {
    overflow: hidden !important;
    max-width: 100% !important;
    width: 100% !important;
  }

  .myapps-table .v-table__wrapper {
    overflow: hidden !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .myapps-table table {
    table-layout: fixed !important;
    width: 100% !important;
    max-width: 100% !important;
    border-spacing: 0 !important;
    border-collapse: collapse !important;
  }

  .myapps-table .v-data-table__wrapper {
    overflow: hidden !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* Use colgroup to absolutely force column widths */
  .myapps-table colgroup {
    display: table-column-group !important;
  }

  .myapps-table colgroup col:first-child {
    width: 55px !important;
    min-width: 55px !important;
    max-width: 55px !important;
  }

  .myapps-table colgroup col:nth-child(2) {
    width: calc(100% - 135px) !important;
    min-width: calc(100% - 135px) !important;
    max-width: calc(100% - 135px) !important;
  }

  .myapps-table colgroup col:nth-child(3) {
    width: 80px !important;
    min-width: 80px !important;
    max-width: 80px !important;
  }

  /* Lock expand column at 55px - target all Vuetify expand column classes */
  .myapps-table tbody > tr:not(.expanded-row) > td:first-child,
  .myapps-table thead > tr > th:first-child,
  .myapps-table tbody > tr > td.v-data-table__td--expanded-row,
  .myapps-table thead > tr > th.v-data-table-column--no-padding,
  .myapps-table .v-data-table__td--expanded-row,
  .myapps-table .v-data-table-column--no-padding {
    width: 55px !important;
    min-width: 55px !important;
    max-width: 55px !important;
    padding: 0px 0px 0px 10px !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  /* Lock actions column */
  .myapps-table tbody > tr:not(.expanded-row) > td:nth-child(3),
  .myapps-table thead > tr > th:nth-child(3) {
    width: 80px !important;
    min-width: 80px !important;
    max-width: 80px !important;
    padding: 0px 8px !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  /* Lock name column */
  .myapps-table tbody > tr:not(.expanded-row) > td:nth-child(2),
  .myapps-table thead > tr > th:nth-child(2) {
    width: calc(100% - 135px) !important;
    min-width: calc(100% - 135px) !important;
    max-width: calc(100% - 135px) !important;
    padding: 0px !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  /* Force content inside second column to respect width */
  .myapps-table tbody > tr:not(.expanded-row) > td:nth-child(2) > *,
  .myapps-table tbody > tr:not(.expanded-row) > td:nth-child(2) .col-name {
    max-width: 100% !important;
    width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  .myapps-table .col-name .usage-row {
    flex-wrap: wrap !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }

  /* Expanded row must match table width exactly */
  .myapps-table .expanded-row {
    display: table-row !important;
  }

  .myapps-table .expanded-row > td {
    display: table-cell !important;
    padding: 0 !important;
    white-space: normal !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    max-width: 100% !important;
  }

  /* Constrain expanded content wrapper - use max-width trick */
  .myapps-table .expanded-content-wrapper {
    display: block !important;
    width: 0 !important;
    min-width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    padding: 12px 16px !important;
  }

  /* Force all content inside wrapper to respect container width */
  .myapps-table .expanded-content-wrapper > *:not(.locations-wrapper) {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  /* Locations wrapper needs actual width for Leaflet to calculate properly */
  .myapps-table .expanded-content-wrapper > .locations-wrapper {
    width: 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }

  /* Ensure ALL content respects width - aggressive approach - EXCEPT leaflet internals */
  .myapps-table .expanded-row *:not(svg):not(path):not(circle):not(line):not(defs):not(filter):not(.leaflet-pane):not(.leaflet-pane *):not(.leaflet-tile):not(.leaflet-tile-pane):not(.leaflet-tile-container):not(.leaflet-map-pane):not(.leaflet-overlay-pane):not(.leaflet-shadow-pane):not(.leaflet-marker-pane) {
    max-width: 100% !important;
    box-sizing: border-box !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
  }

  /* Target specific elements that commonly overflow */
  .myapps-table .expanded-row kbd,
  .myapps-table .expanded-row .resource-kbd,
  .myapps-table .expanded-row a,
  .myapps-table .expanded-row pre,
  .myapps-table .expanded-row code {
    max-width: 100% !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    word-break: break-all !important;
  }

  .myapps-table td:not(.expanded-row td),
  .myapps-table th {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
}

::v-deep(.small-checkbox .v-label) {
  font-size: 12px !important;
}
</style>
