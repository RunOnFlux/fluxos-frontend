
<template>
  <div>
    <div class="d-flex justify-space-between align-center">
      <div class="d-flex align-center mr-1">
        <VBtn
          variant="outlined"
          icon="mdi-arrow-left-circle"
          density="compact"
          class="mr-1"
          color="secondary"
          @click="goBack"
        />
        <VChip
          class="current-task-chip"
          variant="tonal"
          rounded="pill"
        >
          <template #prepend>
            <VIcon
              size="24"
              class="mr-1"
            >
              mdi-progress-tag
            </VIcon>
          </template>
          <span style="font-size: 12px;">
            {{ appName }}
          </span>
        </VChip>
      </div>
      <VRow
        class="d-flex align-center my-1"
        style="max-width: 255px; flex-wrap: nowrap"
        no-gutters
      >
        <!-- IP Selector with laptop icon -->
        <VSelect
          v-if="selectedIp"
          v-model="selectedIp"
          :items="instances.data.map((i) => i.ip)"
          variant="outlined"
          density="compact"
          hide-details
          class="flex-grow-1"
          style="min-width: 0"
          @update:model-value="async (value) => {
            try {
              selectedIp = value
              await getInstalledApplicationSpecifics()
              if (currentTab === '4') {
                initCharts()
                startPollingStats()
              }
              await getApplicationManagementAndStatus(false)
            } catch (error) {
              console.error('Error in IP select handler:', error)
            }
          }"
        >
          <template #prepend-inner>
            <VIcon
              icon="mdi-laptop"
              size="20"
              class="mr-1"
            />
          </template>
        </VSelect>

        <!-- Refresh Icon -->
        <VBtn
          v-if="selectedIp"
          icon
          color="success"
          density="compact"
          variant="tonal"
          class="ml-1"
          :class="{ 'v-icon--disabled': isDisabled }"
          :loading="isDisabled"
          @click="!isDisabled && refreshInfo()"
        >
          <VIcon size="20">
            mdi-refresh
          </VIcon>
        </VBtn>
      </VRow>
    </div>
    <VCard
      v-if="applicationManagementAndStatus.length > 0"
      color="surface"
      class="mt-2"
      elevation="2"
    >
      <div class="app-header d-flex align-center">
        <!-- App list -->
        <div class="d-flex flex-wrap gap-4 ml-4 mb-3 mt-2">
          <div
            v-for="(app, index) in applicationManagementAndStatus"
            :key="index"
            class="d-flex align-center"
          >
            <VTooltip location="top">
              <template #activator="{ props }">
                <div
                  v-bind="props"
                  class="app-item d-flex align-center"
                  style="cursor: pointer"
                >
                  <VIcon
                    icon="mdi-heart-pulse"
                    :color="getIconColor(app.state, app.status)"
                    size="28"
                    class="mr-1"
                  />
                  <div class="app-details">
                    <VChip
                      color="info"
                      variant="tonal"
                      size="x-small"
                      rounded="pill"
                      class="mb-1"
                    >
                      {{ app.name }}
                    </VChip>
                    <VChip
                      :color="getIconColor(app.state, app.status)"
                      variant="tonal"
                      destiny="comfort"
                      size="x-small"
                      rounded="pill"
                      class="d-flex align-center justify-center"
                    >
                      {{ app.state }}
                    </VChip>
                  </div>
                </div>
              </template>

              <div>
                <div class="d-flex align-center mb-1">
                  <VIcon
                    icon="mdi-information"
                    class="mr-1"
                    size="16"
                  />
                  <strong>Image:&nbsp;</strong> {{ app.image }}
                </div>
                <div class="d-flex align-center">
                  <VIcon
                    icon="mdi-clock"
                    class="mr-1"
                    size="16"
                  />
                  <strong>Status:&nbsp;</strong> {{ app.status }}
                  <span v-if="masterSlaveApp && !app.status?.includes('running') && !app.status?.includes('healthy')"> (standby mode)</span>
                </div>
              </div>
            </VTooltip>
          </div>
        </div>
      </div>
    </VCard>
  </div>

  <VTabs
    v-model="currentTab"
    show-arrows
    class="v-tabs-pill"
    style="margin-top: 1px; margin-bottom: 1px"
  >
    <VTab
      v-for="tab in tabs"
      :key="tab.value"
      :value="tab.value"
    >
      {{ tab.label }}
    </VTab>
  </VTabs>
  <VCard>
    <VCardText>
      <VWindow v-model="currentTab">
        <VWindowItem
          v-for="tab in tabs"
          :key="tab.value"
          :value="tab.value"
        >
          <div
            v-if="appSpecification && tab.value === '1'"
            class="pa-0"
          >
            <SmartChip
              v-model="status"
              icon="mdi-cube-outline"
              text-on="Local Specyfication"
              text-off="Global Specyfication"
              icon-after-true="mdi-wifi"
              icon-after-false="mdi-wifi-off"
              color="info"
              variant="tonal"
              rounded="md"
              :icon-state="isSynced"
            />
            {{ isOwnerZelidauth }}
            <AppDetailsCard
              :app="appSpecification"
              :get-new-expire-label="labelForExpire(appSpecification.expire, appSpecification.height)"
              class="mt-2 px-4"
            />
            <div>
              <div class="d-flex align-center justify-start my-3">
                <VChip
                  color="info"
                  variant="tonal"
                  class="composition-chip w-100"
                >
                  <VIcon
                    size="22"
                    class="ml-1"
                  >
                    mdi-hexagon-multiple
                  </VIcon>
                  <span
                    class="ml-1"
                    style="font-size: 18px"
                  >Composition</span>
                </VChip>
              </div>

              <VTabs
                v-model="activeTabLocalIndexSpec"
                align-tabs="start"
                background-color="transparent"
                color="primary"
                hide-slider
                density="comfortable"
                class="v-tabs-pill"
              >
                <VTab
                  v-for="(component, index) in normalizeComponents(appSpecification)"
                  :key="index"
                  :value="index"
                  class="v-tabs-pill text-no-transform"
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
                class="pa-4"
                :touch="false"
              >
                <VWindowItem
                  v-for="(component, index) in normalizeComponents(appSpecification)"
                  :key="index"
                  :value="index"
                >
                  <VSlideYTransition mode="out-in">
                    <div>
                      <ComponentDetails
                        :component="component"
                        :app-name="appSpecification.name || ''"
                        :index="index"
                      />
                    </div>
                  </VSlideYTransition>
                </VWindowItem>
              </VWindow>
            </div>
          </div>

          <div v-else-if="appSpecification && tab.value === '2'">
            <JsonViewer
              v-if="inspectResult.length > 0"
              :data="inspectResult"
              title="Inspect Details"
            />
            <VProgressLinear
              v-else-if="!apiError && inspectResult.length === 0"
              indeterminate
              color="primary"
            />
            <VAlert
              v-if="apiError"
              color="error"
              icon="$error"
              :text="alertMessageText"
            />
          </div>

          <div v-else-if="appSpecification && tab.value === '3'">
            <JsonViewer
              v-if="changesResult.length > 0"
              :data="changesResult"
              title="File Changes"
              icon="mdi-file-arrow-left-right-outline"
              message="File changes inside Docker container (Kind: 0 = Modified, Kind: 1 = Added, Kind: 2 = Deleted)"
            />
            <VProgressLinear
              v-else-if="!apiError && changesResult.length === 0"
              indeterminate
              color="primary"
            />
            <VAlert
              v-if="apiError"
              color="error"
              icon="$error"
              :text="alertMessageText"
            />
          </div>

          <div v-else-if="appSpecification && tab.value === '4'">
            <!-- Header -->
            <VRow class="mb-2">
              <VCol
                cols="12"
                class="d-flex align-center"
              >
                <div class="d-flex align-center justify-space-between mb-2 w-100 border-frame">
                  <div class="d-flex align-center">
                    <VAvatar
                      size="35"
                      color="success"
                      variant="tonal"
                      rounded="sm"
                      class="mr-2 ml-1"
                    >
                      <VIcon size="28">
                        mdi-chart-bar
                      </VIcon>
                    </VAvatar>
                    <span class="text-h5">{{ overviewTitle }}</span>
                  </div>

                  <div>
                    <VSwitch
                      v-model="enableHistoryStatistics"
                      class="mr-1"
                      label="History Statistics"
                      inset
                      @change="enableHistoryStatisticsChange"
                    />
                  </div>
                </div>
              </VCol>
            </VRow>
            <VAlert
              v-if="apiError"
              color="error"
              icon="$error"
              :text="alertMessageText"
              class="mb-8"
            />
            <!-- Controls -->
            <VRow
              class="d-flex align-center mb-4 flex-nowrap"
              no-gutters
            >
              <!-- Left Component Selector -->
              <VCol
                class="d-flex align-center gap-2 flex-nowrap"
                style="width: 100%;"
              >
                <template v-if="appSpecification">
                  <VSelect
                    v-model="selectedContainerMonitoring"
                    :items="appSpecification.compose?.map((c) => c.name)"
                    :label="selectedContainerMonitoring ? 'Component' : 'Select component'"
                    density="comfortable"
                    style="max-width: 320px;"
                    :disabled="isComposeSingle"
                    class="centered-select"
                  >
                    <template #prepend-inner>
                      <VIcon
                        icon="mdi-docker"
                        size="20"
                      />
                    </template>
                  </VSelect>
                </template>
                <VBtn
                  v-if="enableHistoryStatistics"
                  icon
                  color="success"
                  density="comfortable"
                  variant="tonal"
                  @click="fetchStats"
                >
                  <VIcon size="24">
                    mdi-refresh
                  </VIcon>
                </VBtn>

                <VBtn
                  v-if="!enableHistoryStatistics && buttonStats === true"
                  icon
                  color="success"
                  density="comfortable"
                  variant="tonal"
                  @click="startPollingStats(true)"
                >
                  <VIcon size="24">
                    mdi-refresh
                  </VIcon>
                </VBtn>
              </VCol>

              <!-- Right Controls -->
              <VCol class="d-flex flex-wrap align-center justify-end gap-4">
                <!-- Points Selector -->
                <VSelect
                  v-if="!enableHistoryStatistics"
                  v-model="selectedPoints"
                  :items="pointsOptions"
                  label="Points"
                  density="comfortable"
                  style="max-width: 110px;"
                >
                  <template #prepend-inner>
                    <VIcon
                      icon="mdi-file-chart"
                      size="16"
                    />
                  </template>
                </VSelect>

                <!-- Refresh Rate Selector -->
                <VSelect
                  v-if="!enableHistoryStatistics"
                  v-model="refreshRateMonitoring"
                  :items="refreshOptions"
                  label="Refresh Rate"
                  density="comfortable"
                  style="max-width: 110px;"
                >
                  <template #prepend-inner>
                    <VIcon
                      icon="mdi-clock-time-eight-outline"
                      size="16"
                    />
                  </template>
                </VSelect>

                <!-- Time Range Selector -->
                <VSelect
                  v-if="enableHistoryStatistics"
                  v-model="selectedTimeRange"
                  :items="timeOptions"
                  label="Time Range"
                  density="comfortable"
                  style="max-width: 140px;"
                  @update:model-value="fetchStats"
                />
              </VCol>
            </VRow>
            <!-- Charts Grid -->
            <VRow dense>
              <VCol
                cols="12"
                md="6"
                class="pa-2"
              >
                <VCard class="pa-3 mb-2">
                  <div class="d-flex align-center mb-2">
                    <VIcon
                      class="mr-2"
                      size="26"
                    >
                      mdi-chart-line
                    </VIcon>
                    <span class="text-h6">CPU usage</span>
                    <VTooltip bottom>
                      <template #activator="{ props }">
                        <VIcon
                          size="18"
                          class="ml-2"
                          v-bind="props"
                        >
                          mdi-information
                        </VIcon>
                      </template>
                      Displays CPU usage over time. Helps identify high load periods and
                      performance bottlenecks.
                    </VTooltip>
                  </div>
                  <canvas id="cpuChart" />
                </VCard>
              </VCol>
              <VCol
                cols="12"
                md="6"
                class="pa-2"
              >
                <VCard class="pa-3 mb-2">
                  <div class="d-flex align-center mb-2">
                    <VIcon
                      class="mr-2"
                      size="26"
                    >
                      mdi-chart-line
                    </VIcon>
                    <span class="text-h6">Memory usage</span>
                    <VTooltip bottom>
                      <template #activator="{ props }">
                        <VIcon
                          size="18"
                          class="ml-2"
                          v-bind="props"
                        >
                          mdi-information
                        </VIcon>
                      </template>
                      Displays memory usage over time. Helps identify memory leaks and
                      optimize performance.
                    </VTooltip>
                  </div>
                  <canvas id="memoryChart" />
                </VCard>
              </VCol>
              <VCol
                cols="12"
                md="6"
                class="pa-2"
              >
                <VCard class="pa-3 mb-2">
                  <div class="d-flex align-center mb-2">
                    <VIcon
                      class="mr-2"
                      size="26"
                    >
                      mdi-chart-line
                    </VIcon>
                    <span class="text-h6">Network usage (aggregate)</span>
                    <VTooltip bottom>
                      <template #activator="{ props }">
                        <VIcon
                          size="18"
                          class="ml-2"
                          v-bind="props"
                        >
                          mdi-information
                        </VIcon>
                      </template>
                      TX = Transmit, RX = Receive. Useful for spotting bottlenecks and
                      measuring bandwidth.
                    </VTooltip>
                  </div>
                  <canvas id="networkChart" />
                </VCard>
              </VCol>

              <VCol
                cols="12"
                md="6"
                class="pa-2"
              >
                <VCard class="pa-3 mb-2">
                  <div class="d-flex align-center mb-2">
                    <VIcon
                      class="mr-2"
                      size="26"
                    >
                      mdi-chart-line
                    </VIcon>
                    <span class="text-h6">I/O usage (aggregate)</span>
                    <VTooltip bottom>
                      <template #activator="{ props }">
                        <VIcon
                          size="18"
                          class="ml-2"
                          v-bind="props"
                        >
                          mdi-information
                        </VIcon>
                      </template>
                      Displays read/write disk activity. Useful for detecting performance
                      bottlenecks.
                    </VTooltip>
                  </div>
                  <canvas id="ioChart" />
                </VCard>
              </VCol>

              <VCol
                cols="12"
                md="6"
                class="pa-2"
              >
                <VCard class="pa-3 mb-2">
                  <div class="d-flex align-center mb-2">
                    <VIcon
                      class="mr-2"
                      size="25"
                    >
                      mdi-chart-line
                    </VIcon>
                    <span class="text-h6">Persistent Storage</span>
                    <VTooltip bottom>
                      <template #activator="{ props }">
                        <VIcon
                          size="18"
                          class="ml-2"
                          v-bind="props"
                        >
                          mdi-information
                        </VIcon>
                      </template>
                      Tracks storage that persists across container restarts. Prevents
                      disk overuse.
                    </VTooltip>
                  </div>
                  <canvas id="diskPersistentChart" />
                </VCard>
              </VCol>

              <VCol
                cols="12"
                md="6"
                class="pa-2"
              >
                <VCard class="pa-3 mb-2">
                  <div class="d-flex align-center mb-2">
                    <VIcon
                      class="mr-2"
                      size="26"
                    >
                      mdi-chart-line
                    </VIcon>
                    <span class="text-h6">Root Filesystem (rootfs)</span>
                    <VTooltip bottom>
                      <template #activator="{ props }">
                        <VIcon
                          size="18"
                          class="ml-2"
                          v-bind="props"
                        >
                          mdi-information
                        </VIcon>
                      </template>
                      Temporary container storage. Monitoring rootfs helps avoid space
                      issues.
                    </VTooltip>
                  </div>
                  <canvas id="diskFileSystemChart" />
                </VCard>
              </VCol>

              <VCol
                v-if="!enableHistoryStatistics"
                cols="12"
                class="pa-2"
              >
                <VCard class="pa-3 mb-2">
                  <div class="d-flex align-center mb-2">
                    <VIcon
                      class="mr-2"
                      size="26"
                    >
                      mdi-format-list-bulleted
                    </VIcon>
                    <span class="text-h6">Processes</span>
                    <VTooltip bottom>
                      <template #activator="{ props }">
                        <VIcon
                          size="18"
                          class="ml-2"
                          v-bind="props"
                        >
                          mdi-information
                        </VIcon>
                      </template>
                      List of running processes in container.
                    </VTooltip>
                  </div>
                  <VTextField
                    v-model="search"
                    placeholder="Search processes..."
                    class="mb-2"
                  >
                    <template #append-inner>
                      <VIcon size="20">
                        tabler-search
                      </VIcon>
                    </template>
                  </VTextField>
                  <VSheet
                    border
                    rounded
                    class="mt-4"
                    style="max-height: none; overflow: visible"
                  >
                    <VDataTable
                      :items="paginatedProcesses"
                      :headers="titles"
                      dense
                      class="table-monitoring"
                      :items-per-page="perPage"
                      hide-default-footer
                      no-data-text="No records available."
                    />
                  </VSheet>
                  <VRow class="align-center justify-space-between mt-2">
                    <VCol cols="auto">
                      <VPagination
                        v-if="filteredProcesses.length"
                        v-model="currentPage"
                        :length="Math.ceil(filteredProcesses.length / perPage)"
                        total-visible="5"
                        size="small"
                        @input="scrollToPagination"
                      />
                    </VCol>
                    <VCol
                      cols="auto"
                      class="d-flex align-center"
                    >
                      <span class="mr-2">Items per page:</span>
                      <VSelect
                        v-model="perPage"
                        :items="perPageOptions"
                        density="compact"
                        hide-details
                        style="max-width: 100px"
                        @change="scrollToPagination"
                      />
                    </VCol>
                  </VRow>
                </VCard>
              </VCol>
            </VRow>
          </div>

          <div v-else-if="appSpecification && tab.value === '5'">
            <LogViewer
              :app-specification="appSpecification"
              :execute-local-command="executeLocalCommand"
            />
          </div>

          <div v-else-if="appSpecification && tab.value === '6'">
            <Terminal
              :app-spec="appSpecification"
              :selected-ip="selectedIp"
            />
            <VolumeBrowser
              :app-spec="appSpecification"
              :is-compose-single="isComposeSingle"
              :execute-local-command="executeLocalCommand"
              :ip-access="ipAccess"
              :selected-ip="selectedIp"
            />
          </div>

          <div v-else-if="appSpecification && tab.value === '7'">
            <AppControl 
              :app-spec="appSpecification"
              :execute-local-command="executeLocalCommand"
              :instances="instances.data.map((i) => i.ip)"
              :current-instance-ip="selectedIp"
              :ip-access="ipAccess"
              :is-compose-single="isComposeSingle"
              :logout="logout"
            />
          </div>

          <div v-else-if="appSpecification?.compose && tab.value === '8' && privilege !== 'fluxteam'">
            <BackupAndRestore
              :key="currentTab" 
              :app-spec="appSpecification"
              :execute-local-command="executeLocalCommand"
              :ip-access="ipAccess"
              :is-compose-single="isComposeSingle"
              :current-instance-ip="selectedIp" 
            />
          </div>

          <div v-else-if="appSpecification && tab.value === '9'">
            <RunningInstances
              :key="runningInstancesKey" 
              :master-slave-app="masterSlaveApp"
              :master-ip="masterIP"
              :instances="instances"
              :app-specs="appSpecification"
              :selected-node="selectedIp"
            />
          </div>

          <div v-else-if="appSpecificationGlobal && tab.value === '10'">
            <SubscriptionManager :app-spec="appSpecificationGlobal" :new-app="false" :execute-local-command="executeLocalCommand" />
          </div>

          
          


          <div v-else-if="InstalledLoading">
            <VProgressLinear
              indeterminate
              color="primary"
            />
          </div>
          <VAlert
            v-if="apiError"
            color="error"
            density="comfortable"
            class="pa-3"
          >
            <template #default>
              <div class="d-flex align-center justify-start w-100">
                <VIcon
                  icon="mdi-alert-decagram"
                  class="mr-2"
                  size="34"
                />
                <div class="flex-grow-1">{{ alertMessageText }}</div>
                <VBtn
                  icon="mdi-refresh"
                  color="white"
                  variant="text"
                  :class="{ 'v-icon--disabled': isDisabled }"
                  :loading="isDisabled"
                  @click="!isDisabled && refreshInfo()"
                  class="ml-2"
                />
              </div>
            </template>
          </VAlert>
        </VWindowItem>
      </VWindow>
    </VCardText>
  </VCard>
  <VSnackbar
    v-model="snackbar"
    :color="snackbarColor"
    timeout="4000"
    location="top"
    elevation="4"
  >
    {{ snackbarMessage }}
  </VSnackbar>
</template>


<script setup>
import { useRouter, useRoute } from "vue-router"
import { eventBus } from "@/utils/eventBus"
import axios from "axios"
import { decryptEnterpriseWithAes, encryptAesKeyWithRsaKey, importRsaPublicKey } from "@/utils/enterpriseCrypto"
import AppsService from "@/services/AppsService"
import { useFluxStore } from "@/stores/flux"
import IDService from "@/services/IDService"
import firebase from "firebase/compat/app"
import "firebase/compat/auth"
import qs from "qs"
import DaemonService from "@/services/DaemonService"
import { storeToRefs } from "pinia"
import { useConfigStore } from "@core/stores/config"
import {
  Chart, LineController, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Title, Filler,
} from 'chart.js'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
)


const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)

const logoutTrigger = ref(false)
const commandExecutingInspect = ref(false)
const commandExecutingChanges = ref(false)
const inspectResult = ref([])
const changesResult = ref([])
const route = useRoute()
const fluxStore = useFluxStore()
const currentTab = ref("0")
const router = useRouter()
const appName = ref(useRoute().params.appName)
const selectedIp = ref('')
const masterIP = ref(null)
const isDisabled = ref(false)
const masterSlaveApp = ref(false)
const ipAccess = ref(false)
const ipAddress = ref("")
const globalZelidAuthorized = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref("")
const snackbarColor = ref("success")
const appSpecification = ref(null)
const appSpecificationGlobal = ref(null)
const applicationManagementAndStatus = ref([])
const currentBlockHeight = ref(-1)
const activeTabLocalIndexSpec = ref(0)
const status = ref(true)
const InstalledLoading = ref(false)
const InstalledApiError = ref(false)
const apiError = ref(false)
const runningInstancesKey = ref(0)
const { privilege } = storeToRefs(fluxStore)
const alertMessageText = ref("We couldn't retrieve the data. Please try again later or switch to a different backend instance.")

const zelidauthOwner = ref([])

const getAllAppsResponse = ref({
  status: null,
  data: null,
})

const currentPage = ref(1)
const perPage = ref(5)
const search = ref('')
const selectedTimeRange = ref(1 * 24 * 60 * 60 * 1000)

const titles = [
  { key: 'uid', title: 'UID' },
  { key: 'pid', title: 'PID' },
  { key: 'ppid', title: 'PPID' },
  { key: 'c', title: 'C' },
  { key: 'stime', title: 'STIME' },
  { key: 'tty', title: 'TTY' },
  { key: 'time', title: 'TIME' },
  { key: 'cmd', title: 'CMD' },
]

const perPageOptions = [
  { value: 5, title: "5" },
  { value: 10, title: "10" },
  { value: 20, title: "20" },
  { value: 50, title: "50" },
]

const refreshOptions = [
  { value: 5000, title: "5s" },
  { value: 10000, title: "10s" },
  { value: 30000, title: "30s" },
]

const timeOptions = [
  { value: 15 * 60 * 1000, title: "Last 15 Minutes" },
  { value: 30 * 60 * 1000, title: "Last 30 Minutes" },
  { value: 1 * 60 * 60 * 1000, title: "Last 1 Hour" },
  { value: 2 * 60 * 60 * 1000, title: "Last 2 Hours" },
  { value: 3 * 60 * 60 * 1000, title: "Last 3 Hours" },
  { value: 5 * 60 * 60 * 1000, title: "Last 5 Hours" },
  { value: 1 * 24 * 60 * 60 * 1000, title: "Last 1 Day" },
  { value: 2 * 24 * 60 * 60 * 1000, title: "Last 2 Days" },
  { value: 3 * 24 * 60 * 60 * 1000, title: "Last 3 Days" },
  { value: 7 * 24 * 60 * 60 * 1000, title: "Last 7 Days" },
]

const noInstanceAvailable = ref(false)
const selectedPoints = ref(500)
const pointsOptions = [5, 10, 25, 50, 100, 200, 300, 400, 500]

const filteredProcesses = computed(() => {
  if (search.value) {
    const term = search.value.toLowerCase()
    
    return processes.value.filter(process =>
      Object.values(process).some(value =>
        String(value).toLowerCase().includes(term),
      ),
    )
  }
  
  return processes.value
})

const paginatedProcesses = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  const end = start + perPage.value

  return filteredProcesses.value.slice(start, end)
})

const isComposeApp = computed(() =>
  Array.isArray(appSpecification.value?.compose),
)

const isOwnerZelidauth = computed(() => zelidauthOwner.value.includes(appSpecificationGlobal.value?.owner))

const tabs = computed(() => [
  { label: "Specifications", value: "1" },
  { label: "Information", value: "2" },
  { label: "File Changes", value: "3" },
  { label: "Monitoring", value: "4" },
  { label: "Logs", value: "5" },
  { label: "Terminal", value: "6" },
  { label: "Control", value: "7" },
  (privilege.value !== 'fluxteam' && isComposeApp.value) && {
    label: "Backup/Restore",
    value: "8",
  },
  { label: "Instances", value: "9" },
  { label: "Subscription", value: "10" },
].filter(Boolean)) // removes `false` if condition fails

const callResponse = ref({ status: null, data: null })
const callBResponse = ref({ status: null, data: null })

// State variables
const buttonStats = ref(false)
const noData = ref(false)
const timerStats = ref(null)
const memoryLimit = ref(0)
const cpuSet = ref(1)
const diskBindLimit = ref(0)
const diskUsagePercentage = ref(0)
const additionalMessage = ref("")
const processes = ref([])
const selectedContainerMonitoring = ref(null)
const refreshRateMonitoring = ref(5000)
const enableHistoryStatistics = ref(false)

const instances = ref({
  data: [],
})


// Chart references
const diskPersistentChart = shallowRef(null)
const diskFileSystemChart = shallowRef(null)
const memoryChart = shallowRef(null)
const cpuChart = shallowRef(null)
const networkChart = shallowRef(null)
const ioChart = shallowRef(null)

let pollingInProgress = false

// Computed Section
const overviewTitle = computed(() =>
  enableHistoryStatistics.value ? "History Stats Overview" : "Stats & Processes Overview",
)

const isSynced = computed(() => {
  return callResponse.value?.data?.hash === callBResponse.value?.data?.hash
})

const isComposeSingle = computed(() => {
  if (appSpecification.value.version <= 3) {
    return true
  }

  return appSpecification.value.compose?.length === 1
})

//Watch Section
watchEffect(() => {
  try {
    if (appSpecification.value && appSpecification.value.version <= 3) {
      selectedContainerMonitoring.value = appSpecification.value.name
    } else if (
      appSpecification.value &&
      Array.isArray(appSpecification.value.compose) &&
      appSpecification.value.compose.length === 1
    ) {
      selectedContainerMonitoring.value = appSpecification.value.compose[0].name
    }
  } catch (err) {
    console.error('watchEffect error (selectedContainerMonitoring):', err)
  }
})

watch(currentTab, newVal => {
  if (newVal === '9') {
    runningInstancesKey.value++
  }
})

watch(selectedContainerMonitoring, async newValue => {
  try {
    if (newValue) {
      buttonStats.value = false
      if (!enableHistoryStatistics.value) {
        if (timerStats.value) stopPollingStats()
        if (selectedContainerMonitoring.value !== null) startPollingStats()
        clearCharts()
      } else {
        stopPollingStats()
        await fetchStats()
      }
    }
  } catch (err) {
    console.error('Error watching selectedContainerMonitoring:', err)
  }
})

watch(refreshRateMonitoring, () => {
  try {
    if (!enableHistoryStatistics.value) {
      if (timerStats.value) stopPollingStats()
      startPollingStats()
    } else {
      stopPollingStats()
    }
  } catch (err) {
    console.error('Error watching refreshRateMonitoring:', err)
  }
})

watch(status, () => {
  try {
    appSpecification.value = status.value
      ? callResponse.value.data
      : callBResponse.value.data
  } catch (err) {
    console.error('Error watching status:', err)
  }
})

//Tab Control
watch(currentTab, async newVal => {
  try {
    if (newVal === '1') {
      appSpecification.value = null
      await getInstalledApplicationSpecifics()
      await getGlobalApplicationSpecifics()
    } else if (newVal === '2') {
      inspectResult.value = []
      await getApplicationData()
    } else if (newVal === '3') {
      changesResult.value = []
      await getApplicationData("changes")
    } else if (newVal === '4') {
      processes.value = []
      await nextTick()
      initCharts()
      setTimeout(() => {
        try {
          startPollingStats()
        } catch (err) {
          console.error('Polling stats error (delayed):', err)
        }
      }, 2000)
    }
  } catch (err) {
    console.error('Error watching currentTab:', err)
  }
})

//Helper Section
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getAlertColor(state, status) {
  if (!state) return "primary"
  const normalizedState = state.toLowerCase()

  if (normalizedState === "running") {
    return status?.toLowerCase().includes("unhealthy") ? "warning" : "success"
  } else if (normalizedState === "restarting") {
    return "warning"
  } else if (normalizedState === "exited" && !masterSlaveApp.value) {
    return "error"
  }

  return "primary"
}

function getIconColor(state, status) {
  return getAlertColor(state, status)
}

function getComponentInfo(apps, appName) {
  if (!Array.isArray(apps)) return false

  const match = apps.find(
    app => app.Names?.[0] === getAppDockerNameIdentifier(appName),
  )

  if (!match) return false

  return {
    name: appName.includes("_")
      ? appName.substring(0, appName.lastIndexOf("_"))
      : appName,
    state: match.State ?? "N/A",
    status: match.Status?.toLowerCase() ?? "N/A",
    image: match.Image ?? "N/A",
  }
}

function normalizeComponents(data) {
  if (!data) return []

  return data.version >= 4 ? data.compose : [{ ...data, repoauth: false }]
}

function showToast(type, message) {
  snackbarMessage.value = message
  snackbarColor.value = type === "danger" ? "error" : type
  snackbar.value = true
}

function labelForExpire(expire, height) {
  if (!height) return "Application Expired"
  if (currentBlockHeight.value === -1) return "Not possible to calculate expiration"
  const expires = expire || 22000
  const blocksToExpire = height + expires - currentBlockHeight.value
  if (blocksToExpire < 1) return "Application Expired"
  const minutes = blocksToExpire * 2
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

async function executeLocalCommand(
  command,
  postObject = null,
  axiosConfigAux = null,
  skipCache = false,
) {
  try {
    const zelidauth = localStorage.getItem("zelidauth")

    const axiosConfig = axiosConfigAux || {
      headers: {
        zelidauth,
        ...(skipCache && { "x-apicache-bypass": "true" }),
      },
      timeout: 60000,
    }
    
    apiError.value = false
    getZelidAuthority()
    if (!globalZelidAuthorized.value) return

    const [host, port = 16127] = selectedIp.value?.split(":") || []

    if (!host) {
      alertMessageText.value = 'Instance not found. It may be initializing. Please refresh or try again later.'
      throw new Error("Instance not found with deployed application.")
    } else {
      alertMessageText.value = "We couldn't retrieve the data. Please try again later or switch to a different backend instance."
    }

    const queryHost = host.replace(/\./g, "-")
    let queryUrl = `https://${queryHost}-${port}.node.api.runonflux.io${command}`

    if (ipAccess.value) {
      queryUrl = `http://${host}:${port}${command}`
    }

    return postObject
      ? await axios.post(queryUrl, postObject, axiosConfig)
      : await axios.get(queryUrl, axiosConfig)
  } catch (error) {
    apiError.value = true
    console.error("executeLocalCommand error:", error)
    throw error
  }
}

function getAppIdentifier(appName) {
  if (!appName) return ""

  if (appName.startsWith("zel") || appName.startsWith("flux")) {
    return appName
  }

  if (appName === "KadenaChainWebNode" || appName === "FoldingAtHomeB") {
    return `zel${appName}`
  }

  return `flux${appName}`
}

function getAppDockerNameIdentifier(appName) {
  const name = getAppIdentifier(appName)

  return name.startsWith("/") ? name : `/${name}`
}

//Navigation
function goBack() {
  router.push("/apps/management")
}

//Instance Switch 
async function getInstancesForDropDown() {
  const response = await AppsService.getAppLocation(appName.value)

  selectedIp.value = ''

  if (response.data.status === "error") {
    // showToast("danger", response.data.data.message || response.data.data)

    return
  }

  masterIP.value = null
  instances.value.data = response.data.data

  if (masterSlaveApp.value) {
    const url = `https://${appName.value}.app.runonflux.io/fluxstatistics?scope=${appName.value}apprunonfluxio;json;norefresh`
    let errorFdm = false

    let fdmData = await axios.get(url).catch(error => {
      errorFdm = true
      masterIP.value = "Failed to Check"
      console.error(`UImasterSlave: Failed to reach FDM:`, error)
    })

    if (!errorFdm && fdmData?.data?.length) {
      for (const fdmServer of fdmData.data) {
        const serviceName = fdmServer.find(
          el =>
            el.id === 1 &&
            el.objType === "Server" &&
            el.field.name === "pxname" &&
            el.value.value
              .toLowerCase()
              .startsWith(`${appName.value.toLowerCase()}apprunonfluxio`),
        )

        if (serviceName) {
          const ipElement = fdmServer.find(
            el => el.id === 1 && el.objType === "Server" && el.field.name === "svname",
          )

          if (ipElement) {
            const [ip, port] = ipElement.value.value.split(":")

            masterIP.value = ip
            selectedIp.value = port === "16127" ? ip : ipElement.value.value
            break
          }
        }
      }
    }

    if (!masterIP.value) masterIP.value = "Defining New Primary In Progress"
    if (!selectedIp.value) selectedIp.value = instances.value.data[0]?.ip
  } else if (!selectedIp.value) {
    selectedIp.value = instances.value.data[0]?.ip
  }

  // IP access logic
  if (ipAccess.value) {
    const withoutProtocol = ipAddress.value.replace("http://", "")

    const desiredIP =
      config.apiPort === 16127 ? withoutProtocol : `${withoutProtocol}:${config.apiPort}`

    const match = instances.value.data.find(instance => instance.ip === desiredIP)
    if (match) selectedIp.value = desiredIP
  } else {
    const regex = /https:\/\/(\d+-\d+-\d+-\d+)-(\d+)/
    const match = ipAddress.value.match(regex)
    if (match) {
      const ip = match[1].replace(/-/g, ".")
      const desiredIP = config.apiPort === 16127 ? ip : `${ip}:${config.apiPort}`
      const match = instances.value.data.find(instance => instance.ip === desiredIP)
      if (match) selectedIp.value = desiredIP
    }
  }

  instances.value.totalRows = instances.value.data.length
}

async function refreshInfo() {
  isDisabled.value = true
  await new Promise(resolve => setTimeout(resolve, 3000))
  await getInstancesForDropDown()
  await getApplicationManagementAndStatus(false)
  isDisabled.value = false
}

//Auth Sectiom
async function getZelidAuthority() {
  const zelidauth = localStorage.getItem("zelidauth")
  const auth = qs.parse(zelidauth || "")

  const timestamp = Date.now()
  const maxTime = 1.5 * 60 * 60 * 1000 // 1.5 hours
  const mesTime = auth?.loginPhrase?.substring(0, 13) || 0
  const expiryTime = +mesTime + maxTime

  if (+mesTime > 0 && timestamp < expiryTime) {
    globalZelidAuthorized.value = true
  } else {
    globalZelidAuthorized.value = false
    await delay(1000)
    await logout()
  }
}

async function logout() {
  if (logoutTrigger.value) return
  logoutTrigger.value = true

  const zelidauth = localStorage.getItem("zelidauth")

  localStorage.removeItem("zelidauth")
  localStorage.removeItem("loginType")
  fluxStore.setPrivilege("none")
  fluxStore.setZelid("")

  try {
    await IDService.logoutCurrentSession(zelidauth)
  } catch (e) {
    console.log(e)
  }

  console.log("Session expired, logging out...")
  showToast("warning", "Session expired, logging out...")

  try {
    await firebase.auth().signOut()
  } catch (error) {
    console.log(error)
  }

  if (route.path === "/") {
    window.location.reload()
  } else {
    await router.push("/")
  }
}

//Specyfication Section
async function getApplicationManagementAndStatus(skip = false) {
  if (!globalZelidAuthorized.value || !selectedIp.value) return

  if (!skip) {
    await appsGetListAllApps()
  }
  if (!appSpecification.value?.name) {
    await getInstalledApplicationSpecifics(true)

    if (!appSpecification.value?.name) {
      applicationManagementAndStatus.value = []
      await nextTick()

      return
    }
  }

  const appInfoArray = []

  if (
    appSpecification.value?.version >= 4 &&
    Array.isArray(appSpecification.value.compose)
  ) {
    for (const component of appSpecification.value.compose) {
      // console.log(`${component.name}_${appSpecification.value.name}`)

      const infoObject = getComponentInfo(
        getAllAppsResponse.value.data,
        `${component.name}_${appSpecification.value.name}`,
      )

      if (infoObject) appInfoArray.push(infoObject)
    }
  } else {
    const infoObject = getComponentInfo(
      getAllAppsResponse.value.data,
      appSpecification.value.name,
    )

    if (infoObject) appInfoArray.push(infoObject)
  }

  applicationManagementAndStatus.value = appInfoArray
  await nextTick()
}

// ------------------------------------------
// async version – drop into <script setup>
// ------------------------------------------
async function getInstalledApplicationSpecifics(silent = false) {
  appSpecification.value = null
  await delay(1000)
  InstalledLoading.value = true
  InstalledApiError.value = false

  try {
    const response = await executeLocalCommand(
      `/apps/installedapps/${appName.value}`,
      null,
      null,
      true,
    )

    if (!response) {
      InstalledApiError.value = true
      
      return
    }

    const { status, data: appSpecs } = response.data
    if (status !== 'success' || !appSpecs?.length) {
      if (!silent) showToast('danger', 'Unable to get installed app spec')
      InstalledApiError.value = true
      
      return
    }

    let spec = { ...appSpecs[0] } // clone so we can mutate safely

    const isEnterprise = spec.version >= 8 && spec.enterprise

    // same comparison as original
    const sameEnterpriseSpec =
      isEnterprise && spec.enterprise === callBResponse.value.data?.enterprise

    if (isEnterprise && sameEnterpriseSpec) {
      // reuse already-decrypted global spec
      spec.contacts = callBResponse.value.data.contacts
      spec.compose  = callBResponse.value.data.compose
    } else if (isEnterprise && !sameEnterpriseSpec) {
      // decrypt locally
      const decrypted = await getDecryptedEnterpriseFields({ local: true })
      if (!decrypted) {
        if (!silent) showToast('danger', 'Unable to get decrypted app spec')
        InstalledApiError.value = true
        
        return
      }
      spec.contacts = decrypted.contacts
      spec.compose  = decrypted.compose
    }

    // final assignment (mirrors original)
    callResponse.value.status = status
    callResponse.value.data   = spec
    appSpecification.value    = spec
  } catch (error) {
    InstalledApiError.value = true
  } finally {
    InstalledLoading.value = false
  }
}

async function getDecryptedEnterpriseFields(options = {}) {
  const local = options.local ?? false

  /* 1. original owner */
  const ownerRes = await AppsService.getAppOriginalOwner(appName.value)
  const { status: ownerStatus, data: originalOwner } = ownerRes.data
  if (ownerStatus !== 'success') {
    showToast('error', 'Unable to get app owner')

    return null
  }

  /* 2. RSA public key */
  const zelidauth = localStorage.getItem('zelidauth')
  const pubkeyRes = await AppsService.getAppPublicKey(
    zelidauth,
    { name: appName.value, owner: originalOwner },
  )
  const { status: pubkeyStatus, data: pubkey } = pubkeyRes.data
  if (pubkeyStatus !== 'success') {
    showToast('error', 'Unable to get encryption pubkey')

    return null
  }

  const rsaPubKey = await importRsaPublicKey(pubkey)

  /* 3. AES key + wrap */
  const aesKey = crypto.getRandomValues(new Uint8Array(32))
  const encryptedEnterpriseKey = await encryptAesKeyWithRsaKey(aesKey, rsaPubKey)
  console.log('Encrypted Enterprise key:', encryptedEnterpriseKey)

  /* 4. fetch encrypted payload */
  const axiosConfig = {
    headers: { zelidauth, 'enterprise-key': encryptedEnterpriseKey },
  }
  const endpoint = `/apps/appspecifications/${appName.value}/true`

  const encryptedRes = local
    ? await executeLocalCommand(endpoint, null, axiosConfig)
    : await AppsService.getAppEncryptedSpecifics(
      appName.value,
      zelidauth,
      encryptedEnterpriseKey,
    )

  const fetchType = local ? 'local' : 'global'
  console.log(`Get ${fetchType} encrypted fields`, encryptedRes)

  const { status: encryptedStatus, data: specs } = encryptedRes.data
  if (encryptedStatus !== 'success') {
    showToast('error', 'Unable to get encrypted app data')
    callBResponse.value.status = encryptedStatus
    
    return null
  }

  /* 5. decrypt & parse */
  const enterpriseDecrypted = await decryptEnterpriseWithAes(specs.enterprise, aesKey)
    .catch(err => {
      console.log('Error found:', err)
      
      return null
    })

  if (!enterpriseDecrypted) {
    showToast('error', 'Unable to decrypt app specs')
    
    return null
  }

  return JSON.parse(enterpriseDecrypted)
}


async function getGlobalApplicationSpecifics(silent = false) {
  const response = await AppsService.getAppSpecifics(appName.value)

  if (!response) return

  const { status, data: appSpec, message } = response.data || {}

  if (status !== 'success') {
    if (!silent) showToast('error', message || 'Unable to get global app spec')
    callBResponse.value.status = status

    return
  }

  const isEnterprise = appSpec.version >= 8 && appSpec.enterprise
  if (isEnterprise && typeof getDecryptedEnterpriseFields === 'function') {
    const decrypted = await getDecryptedEnterpriseFields()
    if (!decrypted) return
    Object.assign(appSpec, decrypted)
  }

  callBResponse.value.status = status
  callBResponse.value.data   = appSpec
  appSpecificationGlobal.value = appSpec
  masterSlaveApp.value = appSpec.version > 3 && Array.isArray(appSpec.compose) && appSpec.compose.some(c => c.containerData?.includes('g:'))

}

async function appsGetListAllApps() {
  const response = await executeLocalCommand("/apps/listallapps", null, null, true)

  getAllAppsResponse.value.status = response?.data?.status
  getAllAppsResponse.value.data = response?.data?.data

  await getApplicationManagementAndStatus(true)
  await nextTick()
}

async function getDaemonBlockCount() {
  try {
    const response = await DaemonService.getBlockCount()
    if (response.data.status === "success") {
      currentBlockHeight.value = response.data.data
      console.log("Daemon block count set:", currentBlockHeight.value)
    } else {
      console.warn("Daemon block count fetch failed:", response.data)
      currentBlockHeight.value = -1
    }
  } catch (error) {
    console.error("Error fetching daemon block count:", error.message)
    currentBlockHeight.value = -1
  }
}

//Docker Information Section
const getApplicationData = async (mode = "inspect") => {
  const isInspect = mode === "inspect"

  const callData = []
  const executingFlag = isInspect ? commandExecutingInspect : commandExecutingChanges

  executingFlag.value = true

  try {
    if (appSpecification.value?.version >= 4) {
      for (const component of appSpecification.value.compose) {
        const url = `/apps/app${mode}/${component.name}_${appSpecification.value.name}`
        const response = await executeLocalCommand(url)

        if (response.data.status === "error") {
          // showToast("danger", response.data.data.message || response.data.data)
        } else {
          callData.push({
            name: component.name,
            callData: response.data.data,
          })
        }
      }
    } else {
      const url = `/apps/app${mode}/${appName.value}`
      const response = await executeLocalCommand(url)

      if (response.data.status === "error") {
        // showToast("danger", response.data.data.message || response.data.data)
      } else {
        callData.push({
          name: appSpecification.value.name,
          callData: response.data.data,
        })
      }

      if (!isInspect) {
        console.log(response)
      }
    }

    if (isInspect) {
      inspectResult.value = [...callData]
    } else {
      changesResult.value = [...callData]
    }
  } catch (error) {
    // showToast("danger", error.message || `Fetching ${mode} failed.`)
  } finally {
    executingFlag.value = false
  }
}

// Monitoring Section
function enableHistoryStatisticsChange() {
  buttonStats.value = false
  noData.value = false
  if (enableHistoryStatistics.value) {
    stopPollingStats()
    clearCharts()
    fetchStats()
  } else {
    clearCharts()
    startPollingStats()
  }
}

function LimitChartItems(chart) {
  const datasetLength = chart.data.datasets[0].data.length
  if (datasetLength > selectedPoints.value) {
    const excess = datasetLength - selectedPoints.value

    chart.data.labels = chart.data.labels.slice(excess)
    chart.data.datasets.forEach(dataset => {
      dataset.data = dataset.data.slice(excess)
    })
    chart.update({
      duration: 800,
      lazy: false,
      easing: "easeOutBounce",
    })
  }
}

async function scrollToPagination() {
  await nextTick()
  window.scrollTo(0, document.body.scrollHeight)
}

function getHddByName(applications, appName) {
  if (applications?.compose) {
    const app = applications.compose.find(application => application.name === appName)

    return app.hdd
     
  } else {
    return applications.hdd
  }
}

function getCpuByName(applications, appName) {
  if (applications?.compose) {
    const app = applications.compose.find(application => application.name === appName)

    return app.cpu
     
  } else {
    return applications.cpu
  }
}

function processStatsData(statsData, timeStamp = null) {
  const memoryLimitBytes = statsData.memory_stats.limit

  memoryLimit.value = memoryLimitBytes

  const memoryUsageBytes = statsData.memory_stats?.usage ?? null
  const memoryUsageMB = memoryUsageBytes
  const memoryUsagePercentage = ((memoryUsageBytes / memoryLimitBytes) * 100).toFixed(1)

  const cpuUsage =
    statsData.cpu_stats.cpu_usage.total_usage -
    statsData.precpu_stats.cpu_usage.total_usage

  const systemCpuUsage =
    statsData.cpu_stats.system_cpu_usage - statsData.precpu_stats.system_cpu_usage

  const onlineCpus = statsData.cpu_stats.online_cpus
  const { nanoCpus } = statsData
  let cpuCores

  if (!appSpecification.value) {
    return
  }

  if (appSpecification.value.version >= 4) {
    cpuCores = getCpuByName(appSpecification.value, selectedContainerMonitoring.value)
  } else {
    cpuCores = appSpecification.value.cpu
  }
  const rawCpu = ((cpuUsage / systemCpuUsage) * onlineCpus).toFixed(2) || 0
   
  const cpuSize = (((rawCpu / (nanoCpus / cpuCores / 1e9)) * 100) / 100).toFixed(2)

   
  const cpuPercent = (((rawCpu / (nanoCpus / cpuCores / 1e9)) * 100) / cpuCores).toFixed(
    2,
  )

  cpuSet.value = cpuCores

  const ioReadBytes = statsData.blkio_stats.io_service_bytes_recursive
    ? statsData.blkio_stats.io_service_bytes_recursive.find(
      i => i.op.toLowerCase() === "read",
    )?.value || 0
    : null

  const ioWriteBytes = statsData.blkio_stats.io_service_bytes_recursive
    ? statsData.blkio_stats.io_service_bytes_recursive.find(
      i => i.op.toLowerCase() === "write",
    )?.value || 0
    : null

  const networkRxBytes = statsData.networks?.eth0?.rx_bytes ?? null
  const networkTxBytes = statsData.networks?.eth0?.tx_bytes ?? null
  let diskUsageMounts = statsData.disk_stats?.bind ?? null
  let hddSize
  if (appSpecification.value?.version >= 4) {
    hddSize = getHddByName(
      appSpecification.value,
      selectedContainerMonitoring.value,
    )
  } else {
    hddSize = appSpecification.value.hdd
  }
  diskBindLimit.value = Number(hddSize) * 1024 * 1024 * 1024
  diskUsagePercentage.value = (diskUsageMounts / diskBindLimit.value) * 100

  let diskUsageDocker = statsData.disk_stats?.volume ?? null
  let diskUsageRootFs = statsData.disk_stats?.rootfs ?? null

  if (statsData.disk_stats?.status === 'error') {
    diskUsageMounts = null
    diskUsageDocker = null
    diskUsageRootFs= null
  }

  console.log("Resource Metrics:", {
    "CPU Size": cpuSize,
    "CPU Percent": cpuPercent,
    "Memory Usage (MB)": memoryUsageMB,
    "Memory Usage (%)": memoryUsagePercentage,
    "Network RX Bytes": networkRxBytes,
    "Network TX Bytes": networkTxBytes,
    "I/O Read Bytes": ioReadBytes,
    "I/O Write Bytes": ioWriteBytes,
    "Disk Usage Mounts": diskUsageMounts,
    "Disk Usage Volume": diskUsageDocker,
    "Disk Usage RootFS": diskUsageRootFs,
  })

  insertChartData(
    cpuPercent,
    memoryUsageMB,
    memoryUsagePercentage,
    networkRxBytes,
    networkTxBytes,
    ioReadBytes,
    ioWriteBytes,
    diskUsageMounts,
    diskUsageDocker,
    diskUsageRootFs,
    cpuSize,
    timeStamp,
  )
}

async function fetchStats() {
  try {
    if (!appSpecification.value) return

    if (appSpecification.value?.version >= 4 && !selectedContainerMonitoring.value) {
      if (timerStats.value) stopPollingStats()

      return
    }
    if (currentTab.value !== "4") {
      return
    }
    if (enableHistoryStatistics.value) {
      clearCharts()
    }

    const containerName = selectedContainerMonitoring.value
    const sourceIP = selectedIp.value

    const appname = appSpecification.value?.version >= 4 
      ? `${selectedContainerMonitoring.value}_${appSpecification.value?.name}`
      : appSpecification.value?.name

    let statsResponse
    let inspectResponse
    additionalMessage.value = ""
    if (enableHistoryStatistics.value) {
      statsResponse = await executeLocalCommand(
        `/apps/appmonitor/${appname}/${selectedTimeRange.value}`,
      )
    } else {
      statsResponse = await executeLocalCommand(`/apps/appstats/${appname}`)
    }
    inspectResponse = await executeLocalCommand(`/apps/appinspect/${appname}`)
    if (statsResponse.data.status === "error") {
      showToast("danger", statsResponse.data.data.message || statsResponse.data.data)
    } else if (inspectResponse.data.status === "error") {
      showToast("danger", inspectResponse.data.data.message || inspectResponse.data.data)
    } else {
      if (!enableHistoryStatistics.value) {
        fetchProcesses(appname, containerName, sourceIP)
      }
      const configData = inspectResponse.data
      const status = configData.data?.State?.Status
      if (status !== "running" && !enableHistoryStatistics.value) {
        noData.value = true
        if (status === "exited") {
          additionalMessage.value = "(Container marked as stand by)"
        } else {
          additionalMessage.value = "(Container not running)"
        }
        stopPollingStats(true)

        return
      }
      let statsData
      if (statsResponse.data?.data?.lastDay) {
        statsData = statsResponse.data.data.lastDay.reverse()
      } else {
        statsData = statsResponse.data.data
      }
      if (Array.isArray(statsData)) {
        statsData.forEach(stats => {
          processStatsData(stats.data, stats.timestamp)
        })
      } else {
        processStatsData(statsData)
      }
      if (containerName === selectedContainerMonitoring.value && sourceIP === selectedIp.value) {
        updateCharts()
      } else {
        clearCharts()
      }
    }
  } catch (error) {
    console.error("Error fetching container data:", error)
    stopPollingStats(true)
  }
}

function updateAxes() {
  // Update Y-axis for memory chart
  if (
    memoryChart.value &&
    memoryChart.value.data.labels.length === 1 &&
    memoryChart.value.options?.scales?.y &&
    memoryChart.value.options?.scales?.y1
  ) {
    memoryChart.value.options.scales.y.max = memoryLimit.value * 1.2
    memoryChart.value.options.scales.y1.max = 120
  }

  // Update Y-axis for CPU chart
  if (
    cpuChart.value &&
    cpuChart.value.data.labels.length === 1 &&
    cpuChart.value.options?.scales?.y &&
    cpuChart.value.options?.scales?.y1
  ) {
    cpuChart.value.options.scales.y.max = Number((cpuSet.value * 1.35).toFixed(1))
    cpuChart.value.options.scales.y1.max = 135
  }
}

function insertChartData(
  cpuPercent,
  memoryUsageMB,
  memoryUsagePercentage,
  networkRxBytes,
  networkTxBytes,
  ioReadBytes,
  ioWriteBytes,
  diskUsageMounts,
  diskUsageDocker,
  diskUsageRootFs,
  cpuSize,
  timeStamp = null,
) {
  const timeLabel =
    timeStamp === null
      ? new Date().toLocaleTimeString()
      : new Date(timeStamp).toLocaleTimeString()

  // Update memory chart
  if (memoryUsageMB !== null) {
    LimitChartItems(memoryChart.value)
    memoryChart.value.data.labels.push(timeLabel)
    memoryChart.value.data.datasets[0].data.push(memoryUsageMB)
    memoryChart.value.data.datasets[1].data.push(memoryUsagePercentage)
  }

  // Update CPU chart
  if (!Number.isNaN(Number(cpuSize)) && !Number.isNaN(Number(cpuPercent))) {
    LimitChartItems(cpuChart.value)
    cpuChart.value.data.labels.push(timeLabel)
    cpuChart.value.data.datasets[0].data.push(cpuSize)
    cpuChart.value.data.datasets[1].data.push(cpuPercent)
  }

  // Update Network chart
  if (networkRxBytes !== null && networkTxBytes !== null) {
    LimitChartItems(networkChart.value)
    networkChart.value.data.labels.push(timeLabel)
    networkChart.value.data.datasets[0].data.push(networkRxBytes)
    networkChart.value.data.datasets[1].data.push(networkTxBytes)
  }

  // Update I/O chart
  if (ioReadBytes !== null && ioWriteBytes !== null) {
    LimitChartItems(ioChart.value)
    ioChart.value.data.labels.push(timeLabel)
    ioChart.value.data.datasets[0].data.push(ioReadBytes)
    ioChart.value.data.datasets[1].data.push(ioWriteBytes)
  }

  // Update Persistent Storage chart
  if (diskUsageMounts !== null) {
    LimitChartItems(diskPersistentChart.value)
    diskPersistentChart.value.data.labels.push(timeLabel)
    diskPersistentChart.value.data.datasets[0].data.push(diskUsageMounts)
  }
  if (diskUsageDocker !== null) {
    diskPersistentChart.value.data.datasets[1].data.push(diskUsageDocker)
  }
  if (diskPersistentChart.value.data?.datasets[1]?.data) {
    const hasValuesGreaterThanZero =
      Array.isArray(diskPersistentChart.value.data.datasets[1].data) &&
      diskPersistentChart.value.data.datasets[1].data.some(value => value > 0)

    if (hasValuesGreaterThanZero) {
      diskPersistentChart.value.data.datasets[1].hidden = false
    } else {
      diskPersistentChart.value.data.datasets[1].hidden = true
    }
  }

  // Update File System chart
  if (diskUsageRootFs !== null) {
    LimitChartItems(diskFileSystemChart.value)
    diskFileSystemChart.value.data.labels.push(timeLabel)
    diskFileSystemChart.value.data.datasets[0].data.push(diskUsageRootFs)
  }
  noData.value = true
  updateAxes()
}

function updateCharts() {
  memoryChart.value?.update()
  cpuChart.value?.update()
  networkChart.value?.update()
  ioChart.value?.update()
  diskPersistentChart.value?.update()
  diskFileSystemChart.value?.update()
}

function formatDataSize(bytes, options = { base: 10, round: 1 }) {
  if (bytes <= 5) {
    return `${bytes} B`
  }
  const base = options.base === 10 ? 1000 : 1024 // Base 10 for SI, Base 2 for binary

  const labels =
    options.base === 10 ? ["B", "KB", "MB", "GB"] : ["B", "KiB", "MiB", "GiB"]

  if (bytes === 0) return "0 B"
  let size = bytes
  let index = 0
  while (size >= base && index < labels.length - 1) {
    size /= base
     
    index++
  }

  return `${parseFloat(size.toFixed(options.round)).toString()} ${labels[index]}`
}

async function fetchProcesses(appname, continer, ip) {
  try {
    const response = await executeLocalCommand(`/apps/apptop/${appname}`)
    if (response.data.status === "error") {
      showToast("danger", response.data.data.message || response.data.data)
      stopPollingStats(true)

      return
    }

    if (selectedContainerMonitoring.value === continer && selectedIp.value === ip) {
      processes.value = (response.data?.data?.Processes || []).map(proc => ({
        uid: proc[0],
        pid: proc[1],
        ppid: proc[2],
        c: proc[3],
        stime: proc[4],
        tty: proc[5],
        time: proc[6],
        cmd: proc[7],
      }))
    } else {
      processes.value = []
      console.error("Selected container has changed. Proccess list discarded.")
    }
  } catch (error) {
    console.error("Error fetching processes:", error)
  }
}

function initCharts() {
  if (memoryChart.value) {
    memoryChart.value.destroy()
    cpuChart.value.destroy()
    networkChart.value.destroy()
    ioChart.value.destroy()
    diskPersistentChart.value.destroy()
    diskFileSystemChart.value.destroy()
  }
  const memoryCtx = document.getElementById("memoryChart").getContext("2d")
  const cpuCtx = document.getElementById("cpuChart").getContext("2d")
  const networkCtx = document.getElementById("networkChart").getContext("2d")
  const ioCtx = document.getElementById("ioChart").getContext("2d")

  const diskPersistentCtx = document
    .getElementById("diskPersistentChart")
    .getContext("2d")

  const diskFileSystemCtx = document
    .getElementById("diskFileSystemChart")
    .getContext("2d")

  const noDataPlugin = {
    id: 'noDataPlugin',
    beforeDraw: chart => {
      if (!chart || !chart.data || !chart.data.datasets) return
      if (
        chart.data.datasets.every(dataset => dataset.data.length === 0) &&
      noData.value === true
      ) {
        const { ctx, width, height } = chart

        ctx.save()

        const fontSize = Math.min(width, height) / 14

        ctx.font = `400 ${fontSize}px Arial`
        if (theme.value === 'dark') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        }
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.translate(width / 2, height / 2)
        ctx.fillText('No Data Available', 0, 0)

        // Defensive check for additionalMessage
        const additionalMessageValue = additionalMessage?.value || ''
        const additionalFontSize = fontSize * 0.7

        ctx.font = `400 ${additionalFontSize}px Arial`
        ctx.fillText(additionalMessageValue, 0, fontSize)
        ctx.restore()
      }
    },
  }

  diskPersistentChart.value = new Chart(diskPersistentCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Bind",
          data: [],
          fill: true,
          backgroundColor: "rgba(119,255,132,0.3)",
          borderColor: "rgba(119,255,132,0.6)",
          tension: 0.4,
        },
        {
          label: "Volume",
          data: [],
          borderColor: "rgba(155,99,132,1)",
          borderDash: [5, 5],
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.5,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "" } },
        y: {
          title: { display: true, text: "" },
          beginAtZero: true,
          ticks: { callback: value => formatDataSize(value, { base: 2, round: 0 }) },
        },
      },
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: tooltipItem => {
              const datasetLabel = tooltipItem.dataset.label
              const dataValue = tooltipItem.raw

              return `${datasetLabel}: ${formatDataSize(dataValue, {
                base: 2,
                round: 1,
              })}`
            },
            footer: () => [
              `Available Bind Size: ${formatDataSize(diskBindLimit.value, {
                base: 2,
                round: 1,
              })}`,
              `Bind Usage (%): ${diskUsagePercentage.value.toFixed(2)}%`,
            ],
          },
        },
        legend: {
          display: true,
          labels: {
            filter: item => {
              // Check if diskPersistentChart is null
              if (!diskPersistentChart.value) return true // If null, do not display any labels
              if (item.datasetIndex === 1) {
                const datasetData =
                  diskPersistentChart.value.data.datasets[item.datasetIndex]?.data // Get the data for dataset index 1

                // Check if dataset exists and has values greater than zero
                return (
                  Array.isArray(datasetData) && datasetData.some(value => value > 0)
                ) // Return true to keep in legend
              }

              return true
            },
          },
        },
      },
       
    },
    plugins: [noDataPlugin],
  })

  diskFileSystemChart.value = new Chart(diskFileSystemCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "File System (RootFS)",
          data: [],
          fill: true,
          backgroundColor: "rgba(159,155,132,0.3)",
          borderColor: "rgba(159,155,132,0.6)",
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "" } },
        y: {
          title: { display: true, text: "" },
          beginAtZero: true,
          ticks: { callback: value => formatDataSize(value, { base: 2, round: 0 }) },
        },
      },
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: tooltipItem => {
              const datasetLabel = tooltipItem.dataset.label
              const dataValue = tooltipItem.raw

              return `${datasetLabel}: ${formatDataSize(dataValue, {
                base: 2,
                round: 1,
              })}`
            },
          },
        },
      },
    },
    plugins: [noDataPlugin],
  })

  memoryChart.value = new Chart(memoryCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Memory Allocated",
          data: [],
          fill: true,
          backgroundColor: "rgba(151,187,205,0.4)",
          borderColor: "rgba(151,187,205,0.6)",
          yAxisID: "y",
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.4,
        },
        {
          label: "Memory Utilization (%)",
          data: [],
          fill: false,
          borderColor: "rgba(255,99,132,1)",
          borderDash: [5, 5],
          yAxisID: "y1",
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true } },
        y: {
          id: "y",
          title: { display: true },
          beginAtZero: true,
          precision: 0,
          ticks: {
            callback: value => formatDataSize(value, { base: 2, round: 1 }),
          },
        },
        y1: {
          id: "y1",
          title: {
            display: true,
          },
          beginAtZero: true,
          position: "right",
          grid: {
            display: false,
          },
          ticks: {
            callback: value => `${value}%`,
          },
        },
      },
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: tooltipItem => {
              const datasetLabel = tooltipItem.dataset.label
              const dataValue = tooltipItem.raw
              if (datasetLabel.includes("%")) {
                return `Memory Utilization: ${dataValue}%`
              }

              return `${datasetLabel}: ${formatDataSize(dataValue, {
                base: 2,
                round: 1,
              })}`
            },
            footer: () =>
              `Available Memory: ${formatDataSize(memoryLimit.value, {
                base: 2,
                round: 1,
              })}`,
          },
        },
      },
    },
    plugins: [noDataPlugin],
  })

  cpuChart.value = new Chart(cpuCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "CPU Allocated",
          data: [],
          fill: true,
          backgroundColor: "rgba(255,99,132,0.4)",
          borderColor: "rgba(255,99,132,0.6)",
          tension: 0.4,
        },
        {
          label: "CPU Utilization (%)",
          fill: false,
          borderColor: "rgba(255,99,132,1)",
          borderDash: [5, 5],
          yAxisID: "y1",
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true } },
        y: {
          id: "y",
          title: { display: true },
          beginAtZero: true,
          ticks: { callback: value => `${value} CPU` },
        },
        y1: {
          id: "y1",
          title: {
            display: true,
          },
          beginAtZero: true,
          position: "right",
          grid: {
            display: false,
          },
          ticks: {
            callback: value => `${value}%`,
          },
        },
      },
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: tooltipItem => {
              const datasetLabel = tooltipItem.dataset.label
              const dataValue = tooltipItem.raw
              if (datasetLabel.includes("%")) {
                return `CPU Utilization: ${dataValue}%`
              }

              return `CPU Allocated: ${dataValue} CPU`
            },
            footer: () => `Available CPU Core(s): ${cpuSet.value}`,
          },
        },
      },
    },
    plugins: [noDataPlugin],
  })

  networkChart.value = new Chart(networkCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "RX on eth0",
          data: [],
          fill: true,
          backgroundColor: "rgba(99,255,132,0.4)",
          borderColor: "rgba(99,255,132,0.6)",
          tension: 0.4,
        },
        {
          label: "TX on eth0",
          data: [],
          fill: false,
          borderColor: "rgba(132,99,255,1)",
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "" } },
        y: {
          title: { display: true, text: "" },
          beginAtZero: true,
          ticks: { callback: value => formatDataSize(value, { base: 10, round: 0 }) },
        },
      },
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: tooltipItem => {
              const datasetLabel = tooltipItem.dataset.label
              const dataValue = tooltipItem.raw

              return `${datasetLabel}: ${formatDataSize(dataValue)}`
            },
          },
        },
      },
    },
    plugins: [noDataPlugin],
  })

  ioChart.value = new Chart(ioCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Read",
          data: [],
          fill: false,
          borderColor: "rgba(99,132,255,0.6)",
          tension: 0.4,
        },
        {
          label: "Write",
          data: [],
          fill: true,
          backgroundColor: "rgba(255,132,99,0.4)",
          borderColor: "rgba(255,132,99,0.6)",
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true } },
        y: {
          title: { display: true },
          beginAtZero: true,
          ticks: { callback: value => formatDataSize(value, { base: 10, round: 0 }) },
        },
      },
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: tooltipItem => {
              const datasetLabel = tooltipItem.dataset.label
              const dataValue = tooltipItem.raw

              return `${datasetLabel}: ${formatDataSize(dataValue)}`
            },
          },
        },
      },
    },
    plugins: [noDataPlugin],
  })
  updateAxes()
}

function startPollingStats(action = false) {
  console.log(`⏱ startPollingStats...`)

  stopPollingStats()

  timerStats.value = setInterval(async () => {
    if (pollingInProgress) return
    pollingInProgress = true
    await fetchStats()
    pollingInProgress = false
  }, refreshRateMonitoring.value)

  if (action === true) {
    buttonStats.value = false
  }
}

function stopPollingStats(action = false) {
  clearInterval(timerStats.value)
  timerStats.value = null
  if (action === true) {
    buttonStats.value = true
  } else {
    noData.value = false
  }
}

function clearCharts() {
  if (!memoryChart.value) {
    return
  }

  // Clear memory chart data
  noData.value = false
  memoryChart.value.data.labels = []
  memoryChart.value.data.datasets.forEach(dataset => {
    dataset.data = []
  })
  memoryChart.value.options.scales.y.max = 1.2
  memoryChart.value.options.scales.y1.max = 120
  memoryChart.value.update()

  // Clear CPU chart data
  cpuChart.value.data.labels = []
  cpuChart.value.data.datasets.forEach(dataset => {
    dataset.data = []
  })
  cpuChart.value.options.scales.y.max = 1.2
  cpuChart.value.options.scales.y1.max = 120
  cpuChart.value.update()

  // Clear Network chart data
  networkChart.value.data.labels = []
  networkChart.value.data.datasets.forEach(dataset => {
    dataset.data = []
  })
  networkChart.value.update()

  // Clear I/O chart data
  ioChart.value.data.labels = []
  ioChart.value.data.datasets.forEach(dataset => {
    dataset.data = []
  })
  ioChart.value.update()
  diskPersistentChart.value.data.labels = []
  diskPersistentChart.value.data.datasets.forEach(dataset => {
    dataset.data = []
  })
  diskPersistentChart.value.update()
  diskFileSystemChart.value.data.labels = []
  diskFileSystemChart.value.data.datasets.forEach(dataset => {
    dataset.data = []
  })
  diskFileSystemChart.value.update()
  processes.value = []
}

onMounted(async () => {
  const stored = localStorage.getItem('zelidauth')
  if (stored) zelidauthOwner.value = stored
  eventBus.on("updateAppStatus", appsGetListAllApps)
  eventBus.on("updateInstanceList", refreshInfo)

  const { hostname } = window.location
  const regex = /[A-Z]/gi
  if (hostname.match(regex)) {
    ipAccess.value = false
  } else {
    ipAccess.value = true
  }
  await getZelidAuthority()
  await getDaemonBlockCount()
  await getGlobalApplicationSpecifics()
  await getInstancesForDropDown()
  await getInstalledApplicationSpecifics()
  await getApplicationManagementAndStatus()
})

onUnmounted(() => {
  stopPollingStats()
  eventBus.off("updateAppStatus", appsGetListAllApps)
  eventBus.off("updateInstanceList", refreshInfo)
})
</script>

<style>
#updatemessage {
  padding-right: 25px !important;
}
.text-wrap {
  position: relative;
  padding: 0em;
}
.clipboard.icon {
  position: absolute;
  top: 0.4em;
  right: 2em;
  margin-top: 4px;
  margin-left: 4px;
  width: 12px;
  height: 12px;
  border: solid 1px #333333;
  border-top: none;
  border-radius: 1px;
  cursor: pointer;
}
.no-wrap {
  white-space: nowrap !important;
}
.no-wrap-limit {
  white-space: nowrap !important;
  min-width: 150px;
  text-align: center;
}
.custom-button {
  width: 15px !important;
  height: 25px !important;
}
.button-cell {
  display: flex;
  align-items: center;
  min-width: 150px;
}
.xterm {
  padding: 10px;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.spin-icon {
  animation: spin 2s linear infinite;
}
.spin-icon-l {
  animation: spin 2s linear infinite;
  width: 12px !important;
  height: 12px !important;
}
.app-instances-table td:nth-child(1) {
  padding: 0 0 0 5px;
}
.app-instances-table th:nth-child(1) {
  padding: 0 0 0 5px;
}
.app-instances-table td:nth-child(5) {
  width: 105px;
}
.app-instances-table th:nth-child(5) {
  width: 105px;
}
.loginRow {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 10px;
}
.walletIcon {
  height: 90px;
  width: 90px;
  padding: 10px;
}
.walletIcon img {
  -webkit-app-region: no-drag;
  transition: 0.1s;
}
.fluxSSO {
  height: 90px;
  padding: 10px;
  margin-left: 5px;
}
.fluxSSO img {
  -webkit-app-region: no-drag;
  transition: 0.1s;
}
.stripePay {
  margin-left: 5px;
  height: 90px;
  padding: 10px;
}
.stripePay img {
  -webkit-app-region: no-drag;
  transition: 0.1s;
}
.paypalPay {
  margin-left: 5px;
  height: 90px;
  padding: 10px;
}
.paypalPay img {
  -webkit-app-region: no-drag;
  transition: 0.1s;
}

a img {
  transition: all 0.05s ease-in-out;
}

a:hover img {
  filter: opacity(70%);
  transform: scale(1.1);
}

.flex {
  display: flex;
}
</style>

<style lang="scss">
.anchor {
  display: block;
  height: 100px;
  margin-top: -100px;
  visibility: hidden;
}
.v-toast__text {
  font-family: "Roboto", sans-serif !important;
}
.jv-dark {
  background: none;
  white-space: nowrap;
  font-size: 14px;
  font-family: Consolas, Menlo, Courier, monospace;
  margin-bottom: 25px;
}
.jv-button {
  color: #49b3ff !important;
}
.jv-dark .jv-key {
  color: #999 !important;
}
.jv-dark .jv-array {
  color: #999 !important;
}
.jv-boolean {
  color: #fc1e70 !important;
}
.jv-function {
  color: #067bca !important;
}
.jv-number {
  color: #fc1e70 !important;
}
.jv-number-float {
  color: #fc1e70 !important;
}
.jv-number-integer {
  color: #fc1e70 !important;
}
.jv-dark .jv-object {
  color: #999 !important;
}
.jv-undefined {
  color: #e08331 !important;
}
.jv-string {
  color: #42b983 !important;
  word-break: break-word;
  white-space: normal;
}
.card-body {
  padding: 1rem;
}
.table-no-padding > td {
  padding: 0 !important;
}

.backups-table td {
  position: relative;
}
td .ellipsis-wrapper {
  position: absolute;
  max-width: calc(100% - 1rem);
  line-height: calc(3rem - 8px);
  top: 0;
  left: 1rem;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.logs {
  margin: 5px;
  max-height: 392px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
  background-color: #000;
  color: #fff;
  font-size: 12px;
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
}

.input {
  min-width: 150px;
  width: 200px;
}

.input_s {
  min-width: 300px;
  width: 350px;
}

.clear-button {
  height: 100%;
}

.code-container {
  margin: 5px;
  height: 330px;
  max-width: 100vw;
  position: relative;
  background-color: #000;
  user-select: text;
  color: #fff;
  border-radius: 6px;
  border: 1px solid #e1e4e8;
  overflow: auto;
  padding: 16px;
  font-size: 12px;
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  box-sizing: border-box;
  clip-path: inset(0 round 6px);
  word-wrap: break-word;
  word-break: break-all;
}

.log-entry {
  user-select: text;
  white-space: pre-wrap;
}

.line-by-line-mode .log-entry {
  cursor: pointer;
  user-select: none;
}

.line-by-line-mode .log-entry:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.line-by-line-mode .log-entry.selected {
  background-color: rgba(255, 255, 255, 0.3);
  border-left: 5px solid #007bff;
}

.line-by-line-mode .log-entry.selected:hover {
  background-color: rgba(255, 255, 255, 0.5);
}

.log-copy-button {
  position: sticky;
  top: 2px;
  float: right;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background-color: #0366d6;
  color: white;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease;
  z-index: 1000;
}

.log-copy-button:hover {
  background-color: #024b8e;
}

.log-copy-button:disabled {
  background-color: #6c757d;
  color: white;
}

.download-button:disabled {
  background-color: #6c757d;
  color: white;
}

.download-button {
  position: sticky;
  float: right;
  top: 2px;
  right: 8px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background-color: #28a745;
  color: white;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease;
  margin-left: 15px;
}

.search_input {
  min-width: 600px;
}

.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: left;
  flex-wrap: wrap;
}

.download-button:hover {
  background-color: #218838;
}

.download-button:disabled:hover {
  background-color: #6c757d;
}

.icon-tooltip {
  cursor: pointer;
  font-size: 15px;
  margin-right: 10px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  color: #6c757d;
}

.x {
  cursor: pointer;
  font-size: 1.5rem;
  vertical-align: middle;
  color: #ff6666;
  transition: color 0.3s ease;
}

.x:hover {
  color: #cc0000;
}

.r {
  cursor: pointer;
  font-size: 30px;
  vertical-align: middle;
  color: #39ff14;
  transition: color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease,
    opacity 0.6s ease, transform 0.6s ease;
  border: 2px solid #4caf50;
  padding: 4px;
  border-radius: 4px;
  box-sizing: border-box;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.r:hover {
  color: #39ff14;
  border-color: #81c784;
  box-shadow: 0 0 10px 2px rgba(129, 199, 132, 0.7);
}

.button-red:hover {
  color: #ff1414;
  border-color: #ff0000;
  box-shadow: 0 0 10px 2px rgba(211, 9, 9, 0.7);
}

.button-green:not(:disabled):hover {
  color: #39ff14;
  border-color: #81c784;
  box-shadow: 0 0 10px 2px rgba(129, 199, 132, 0.7);
}

.cb:hover {
  color: #39ff14;
  border-color: #81c784;
  box-shadow: 0 0 10px 2px rgba(129, 199, 132, 0.7);
}

.cb {
  min-width: 225px;
}

.r.disabled {
  animation: spin 2s linear infinite;
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  border-radius: 50%;
  padding: 4px;
  width: 30px !important;
  height: 30px !important;
  box-shadow: 0 0 10px 2px rgba(129, 199, 132, 0.7);
  transition: color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease,
    opacity 0.6s ease, transform 0.6s ease;
}

.container {
  max-width: 1500px;
  width: 100%;
  padding: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.flex-container2 {
  height: 50%;
  justify-content: space-between;
  flex-wrap: nowrap;
  padding: 0.5vw;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1vw;
  width: 100%;
  margin: 1vh;
}

.chart-wrapper {
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  min-width: 600px;
  overflow: hidden;
  justify-content: center;
  align-items: center;
}

.chart-title-container {
  align-items: center;
  display: flex;
  margin-right: 10px;
}

.table-responsive {
  overflow-x: auto;
  box-shadow: 0px 6px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
}

.table-monitoring {
  table-layout: auto;
  width: 100%;
}

.table-monitoring th,
.table-monitoring td {
  white-space: nowrap;
  border: none;
  background-color: transparent;
}

.chart-title {
  margin-left: 8px;
  font-size: 18px;
  font-weight: bold;
}

.icon-large {
  font-size: 24px !important;
}

.chart-wrapper canvas {
  max-width: 100%;
  height: 100%;
}

.progress-container {
  width: 150px;
  height: 20px;
  position: relative;
  background-color: #6e6b7b;
  transition: width 0.5s;
  border-radius: 10px;
}

.progress-center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  z-index: 10;
  pointer-events: none;
}

#my-id .tooltip-inner {
  background-color: transparent !important;
  color: #333;
  border: none !important;
  box-shadow: none !important;
  margin-right: 25px;
  margin-top: 4px;
}

#my-id .arrow {
  display: none !important;
}

@media (max-width: 1800px) {
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 2vw;
    margin: 1vh 0;
  }
}

@media (min-width: 1800px) {
  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1vw;
  }

  .charts-grid > .chart-wrapper:nth-last-child(1):nth-child(odd) {
    grid-column: 1 / -1;
    justify-self: center;
    width: 100%;
  }
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: auto;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
  -webkit-appearance: textfield;
  appearance: textfield;
  padding-right: 10px;
  color: grey;
}

.b-table-sort-icon-left {
  padding-left: 20px !important;
}

.editor-container {
  overflow: hidden;
  height: 80vh;
  width: 100%;
  position: relative;
  -webkit-font-smoothing: antialiased;
}

.monaco-editor {
  -webkit-font-smoothing: antialiased;
}

.custom-modal-size {
  max-width: 800px;
}

.modal-backdrop {
  background-color: rgba(0, 0, 0, 1) !important;
}

.custom-modal-title {
  color: #fff !important;
}

.app-item {
  display: flex;
  align-items: center;
  padding: 6px;
  transition: background-color 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 8px var(--v-theme-shadow-color, rgba(0, 0, 0, 0.3));
  border-radius: 8px;
}

.app-list {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-item:hover {
  background-color: var(--v-theme-surface);
  border-radius: 8px;
  box-shadow: 0 4px 8px var(--v-theme-shadow-color, rgba(0, 0, 0, 0.5));
}

.app-icon {
  margin-right: 12px;
  font-size: 1.5em;
}

.hover-icon {
  margin-right: 5px;
  font-size: 1em;
}

.app-details {
  display: flex;
  flex-direction: column;
}

.app-name {
  font-weight: bold;
}
.app-header {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.wrap-text-info {
  white-space: normal !important;
  overflow-wrap: break-word;
  word-break: break-word;
}

.force-mb-0 {
  margin-bottom: 0 !important;
}

.jv-container.boxed {
  border: 1px solid #eee !important;
  border-radius: 6px;
}

.hidden-tab {
  display: none !important;
}

.limited-width {
  max-width: 225px;
  display: inline-block;
  text-align: center;
  word-wrap: break-word;
}

.placeholder-box {
  padding: 30px;
  border: 1px solid #ccc;
  text-align: center;
  border-radius: 8px;
  color: #888;
  margin: 20px;
}

.tab-slide-enter-active,
.tab-slide-leave-active {
  transition: all 1s ease;
}
.tab-slide-enter {
  opacity: 0;
  transform: translateX(100px);
}
.tab-slide-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

.v-tabs-pill {
  flex-wrap: nowrap; /* Prevent tabs from wrapping */
}

.v-tab--full {
  text-transform: none; /* Prevent uppercase transformation */
  text-overflow: unset !important; /* Disable ellipsis */
  white-space: nowrap !important; /* Prevent text wrapping */
  padding: 0 16px; /* Adjust padding for readability */
  text-transform: none !important;
}

.text-no-transform {
  text-transform: none !important;
}
</style>

<style scoped>
  .border-frame {
    border: 1px solid #ccc;
    border-radius: 8px;
    margin-bottom: 5px;
    padding: 6px;
    height: 54px;
  }
</style>
