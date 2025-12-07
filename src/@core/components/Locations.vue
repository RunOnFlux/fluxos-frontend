<template>
  <div class="table-wrapper">
    <!-- MAP on top -->
    <div
      v-if="mapVisible && mapLocations.length"
      class="map-wrapper d-flex justify-center"
    >
      <div class="map-inner">
        <MapComponent
          :key="mapKey"
          class="mb-0"
          :show-all="false"
          :filter-nodes="mapLocations"
        />
      </div>
    </div>
  
    <!-- Controls and Table under Map -->
    <div class="table-wrapper-location mt-4">
      <VRow class="align-center">
        <!-- Controls -->
        <VCol cols="4">
          <VSelect
            v-model="appLocationOptions.perPage"
            :label="t('core.locations.perPage')"
            :items="appLocationOptions.pageOptions"
            density="compact"
            class="flex-grow-1"
          />
        </VCol>
  
        <VCol cols="8">
          <VTextField
            v-model="appLocationOptions.filter"
            :label="t('core.locations.filter')"
            density="compact"
            variant="outlined"
            :placeholder="t('core.locations.typeToSearch')"
            clearable
            class="flex-grow-1"
          >
            <template #prepend-inner>
              <VIcon size="20">
                tabler-search
              </VIcon>
            </template>
            <template #append-inner>
              <VTooltip :text="t('core.locations.selectActiveInstance')">
                <template #activator="{ props: instanceProps }">
                  <VIcon
                    v-if="selectedNode"
                    v-bind="instanceProps"
                    icon="mdi-map-marker-radius-outline"
                    size="20"
                    class="mx-1"
                    @click="appLocationOptions.filter = selectedNode"
                  />
                </template>
              </VTooltip>
            </template>
          </VTextField>
        </VCol>
      </VRow>
  
      <!-- Data Table -->
      <VSheet
        border
        rounded
        :class="filteredLocations.length >= 5 ? 'mb-2 mt-4' : 'mb-4 mt-4'"
        style="max-height: none; overflow: visible"
      >
        <VDataTable
          :headers="appLocationFields"
          :items="filteredLocations"
          :items-per-page="appLocationOptions.perPage"
          v-model:page="appLocationOptions.currentPage"
          v-model:sort-by="appLocationOptions.sortBy"
          must-sort
          class="locations-table"
          hide-default-footer
          fixed-header
          density="compact"
          :no-data-text="t('core.locations.noInstancesFound')"
        >
          <template #header.ip>
            <div class="d-flex align-center">
              <VIcon :icon="headerIcons.ip" size="18" class="mr-2" />
              <span>{{ t('core.locations.ipAddress') }}</span>
            </div>
          </template>

          <template #header.osUptime>
            <div class="d-flex align-center">
              <VIcon :icon="headerIcons.osUptime" size="18" class="mr-2" />
              <span>{{ t('core.locations.uptime') }}</span>
            </div>
          </template>

          <template #header.runningSince>
            <div class="d-flex align-center">
              <VIcon :icon="headerIcons.running" size="18" class="mr-2" />
              <span>{{ t('core.locations.running') }}</span>
            </div>
          </template>

          <template #item.ip="{ item }">
            <VChip
              color="success"
              label
              size="small"
              class="text-no-wrap"
              style="border-radius: 15px"
            >
              <strong>{{ item.ip }}</strong>
            </VChip>
          </template>
  
          <template #item.osUptime="{ item }">
            <VChip
              color="success"
              label
              size="small"
              class="text-no-wrap"
              style="border-radius: 15px"
            >
              <strong>{{ formatUptime(item.osUptime) }}</strong>
            </VChip>
          </template>

          <template #item.runningSince="{ item }">
            <VChip
              color="success"
              label
              size="small"
              class="text-no-wrap"
              style="border-radius: 15px"
            >
              <strong>{{ timeElapsed(item.runningSince) }}</strong>
            </VChip>
          </template>

          <template #header.continent>
            <div class="d-flex align-center">
              <VIcon :icon="headerIcons.continent" size="18" class="mr-2" />
              <span>{{ t('core.locations.continent') }}</span>
            </div>
          </template>

          <template #header.country>
            <div class="d-flex align-center">
              <VIcon :icon="headerIcons.country" size="18" class="mr-2" />
              <span>{{ t('core.locations.country') }}</span>
            </div>
          </template>

          <template #header.region>
            <div class="d-flex align-center">
              <VIcon :icon="headerIcons.region" size="18" class="mr-2" />
              <span>{{ t('core.locations.region') }}</span>
            </div>
          </template>

          <template #item.continent="{ item }">
            <div
              v-if="showLocation"
              class="d-flex align-center text-no-wrap"
            >
              <VChip
                v-if="item.continent"
                color="success"
                label
                size="small"
                class="text-no-wrap"
                style="border-radius: 15px"
              >
                <strong>{{ item.continent }}</strong>
              </VChip>
            </div>
          </template>

          <template #item.country="{ item }">
            <div
              v-if="showLocation"
              class="d-flex align-center text-no-wrap"
            >
              <VChip
                v-if="item.country"
                color="success"
                label
                size="small"
                class="text-no-wrap"
                style="border-radius: 15px"
              >
                <strong>{{ item.country }}</strong>
              </VChip>
            </div>
          </template>

          <template #item.region="{ item }">
            <div
              v-if="showLocation"
              class="d-flex align-center text-no-wrap"
            >
              <VChip
                v-if="item.region"
                color="success"
                label
                size="small"
                class="text-no-wrap"
                style="border-radius: 15px"
              >
                <strong>{{ item.region }}</strong>
              </VChip>
            </div>
          </template>
  
          <template #item.visit="{ item }">
            <div class="d-flex justify-end">
              <VTooltip :text="t('core.locations.visitApp')">
                <template #activator="{ props: btnProps }">
                  <VBtn
                    v-bind="btnProps"
                    size="x-small"
                    color="primary"
                    class="mr-2"
                    rounded="pill"
                    @click="openApp(item.name, item.ip.split(':')[0], getProperPort(appSpec))"
                  >
                    <VIcon
                      size="18"
                      icon="mdi-door-open"
                    />
                  </VBtn>
                </template>
              </VTooltip>

              <VTooltip :text="t('core.locations.visitFluxNode')">
                <template #activator="{ props: btnProps }">
                  <VBtn
                    v-bind="btnProps"
                    size="x-small"
                    color="primary"
                    rounded="pill"
                    @click="
                      openNodeFluxOS(
                        item.ip.split(':')[0],
                        item.ip.split(':')[1] ? +item.ip.split(':')[1] - 1 : 16126
                      )
                    "
                  >
                    <VIcon
                      size="18"
                      icon="mdi-home"
                    />
                  </VBtn>
                </template>
              </VTooltip>
            </div>
          </template>
        </VDataTable>
      </VSheet>
      <!-- Pagination -->
      <div>
        <VPagination
          v-if="filteredLocations.length > 5"
          v-model="appLocationOptions.currentPage"
          :length="Math.ceil(filteredLocations.length / appLocationOptions.perPage)"
          density="compact"
          rounded
          size="small"
          total-visible="5"
          class="justify-center mb-2"
        />
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, computed, watch } from "vue"
import axios from 'axios'
import { useI18n } from 'vue-i18n'

// Props
const props = defineProps({
  appLocations: {
    type: Array,
    default: () => [],
  },
  expanded: {
    type: Boolean,
    default: false,
  },
  appSpec: {
    type: Object,
    required: true,
  },
  showLocation: {
    type: Boolean,
    default: false,
  },
  selectedNode: {
    type: String,
    default: '',
  },
})
  
const { t } = useI18n()
  
// Reactive state
const mapVisible = ref(props.expanded)
  
const appLocationOptions = ref({
  perPage: 5,
  pageOptions: [5, 10, 25, 50, 100],
  currentPage: 1,
  filter: "",
  sortBy: [],
})

const appLocationFields = computed(() => [
  { key: "ip", title: t('core.locations.ipAddress'), sortable: true, cellClass: 'column-ip', headerProps: { class: 'column-ip' } },
  { key: "osUptime", title: t('core.locations.uptime'), sortable: true, cellClass: 'column-uptime', headerProps: { class: 'column-uptime' } },
  {
    key: "runningSince",
    value: "runningSince",
    title: t('core.locations.running'),
    sortable: true,
    cellClass: 'column-running',
    headerProps: { class: 'column-running' }
  },
  ...(props.showLocation
    ? [{ key: "continent", title: t('core.locations.continent'), sortable: true, cellClass: 'column-continent', headerProps: { class: 'column-continent' } }]
    : []),
  ...(props.showLocation
    ? [{ key: "country", title: t('core.locations.country'), sortable: true, cellClass: 'column-country', headerProps: { class: 'column-country' } }]
    : []),
  ...(props.showLocation
    ? [{ key: "region", title: t('core.locations.region'), sortable: true, cellClass: 'column-region', headerProps: { class: 'column-region' } }]
    : []),
  { key: "visit", title: "", sortable: false },
])

const headerIcons = {
  ip: 'mdi-laptop',
  osUptime: 'mdi-home-clock',
  running: 'mdi-clock-fast',
  continent: 'mdi-earth',
  country: 'mdi-flag',
  region: 'mdi-map-marker',
}



  
// Computed
const mapLocations = computed(() => {
  return filteredLocations.value.map(l => l.ip)
})

const mapKey = computed(() => {
  return mapLocations.value.map(loc => typeof loc === 'string' ? loc : loc.ip).join(',')
})
  
const filteredLocations = computed(() => {
  const filter = appLocationOptions.value.filter?.toLowerCase()
  
  // If there's no filter text, return all locations
  if (!filter) return props.appLocations

  return props.appLocations.filter(loc => {
    // Check if the filter matches any of the fields (IP, Continent, Country, Region)
    const ipMatch = loc.ip?.toLowerCase().includes(filter)
    const continentMatch = loc.continent?.toLowerCase().includes(filter)
    const countryMatch = loc.country?.toLowerCase().includes(filter)
    const regionMatch = loc.region?.toLowerCase().includes(filter)

    // Return true if any field matches
    return ipMatch || continentMatch || countryMatch || regionMatch
  })
})
  
const paginatedLocations = computed(() => {
  const start = (appLocationOptions.value.currentPage - 1) * appLocationOptions.value.perPage
  const end = start + appLocationOptions.value.perPage
  
  return filteredLocations.value.slice(start, end)
})
  
// Watchers
watch(
  () => props.expanded,
  newVal => {
    mapVisible.value = newVal
  },
)
  
watch(
  () => appLocationOptions.value.filter,
  () => {
    appLocationOptions.value.currentPage = 1
  },
)
  
// Helpers
function formatUptime(seconds) {
  if (!seconds || isNaN(seconds)) return t('core.locations.notAvailable')
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0 || days > 0) parts.push(`${hours}h`)
  parts.push(`${minutes}m`)
  
  return parts.join(" ")
}
  
function getProperPort(appLocation) {
  if (appLocation.port) return appLocation.port
  if (Array.isArray(appLocation.ports) && appLocation.ports.length > 0) {
    return appLocation.ports[0]
  }
  if (Array.isArray(appLocation.compose)) {
    for (const c of appLocation.compose) {
      if (Array.isArray(c.ports) && c.ports.length > 0) {
        return c.ports[0]
      }
    }
  }
  
  return null
}
  
function openSite(url) {
  const win = window.open(url, "_blank")

  win?.focus()
}
  
function openApp(name, ip, port) {
  if (ip && port) {
    openSite(`http://${ip}:${port}`)
  } else {
    console.error("No port provided for App")
  }
}
  
function openNodeFluxOS(ip, port) {
  if (ip && port) {
    openSite(`http://${ip}:${port}`)
  } else {
    console.error("No FluxNode port available")
  }
}

async function runWithConcurrencyLimit(tasks, limit = 5) {
  const results = []
  const executing = []

  for (const task of tasks) {
    const p = task().then(res => {
      executing.splice(executing.indexOf(p), 1)
      
      return res
    })

    results.push(p)
    executing.push(p)

    if (executing.length >= limit) {
      await Promise.race(executing)
    }
  }

  return Promise.all(results)
}

async function fetchLocationsWithGeolocation() {
  try {
    const tasks = props.appLocations.map(node => async () => {
      const ip = node.ip.split(':')[0]
      const port = node.ip.split(':')[1] || 16127
      const url = `http://${ip}:${port}/flux/geolocation`

      try {
        const geoData = await axios.get(url)

        if (geoData.data?.status === 'success') {
          node.continent = geoData.data.data.continent || 'N/A'
          node.country = geoData.data.data.country || 'N/A'
          node.region = geoData.data.data.regionName || 'N/A'
        } else {
          node.continent = 'N/A'
          node.country = 'N/A'
          node.region = 'N/A'
        }
      } catch (error) {
        console.error(`Error fetching geolocation for ${ip}:${port}`, error)
        node.continent = 'N/A'
        node.country = 'N/A'
        node.region = 'N/A'
      }
    })

    await runWithConcurrencyLimit(tasks, 10)
  } catch (error) {
    console.error('Error fetching locations:', error)
  }
}

function timeElapsed(dateString) {
  const givenDate = new Date(dateString)
  const currentDate = new Date()
  const timeDiff = currentDate - givenDate

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))


  // Return formatted time with pluralization
  return `${days}d ${hours}h ${minutes}m`
}

onMounted(async () => {
  if (props.showLocation) {
    await fetchLocationsWithGeolocation()

    // console.log('appLocations after geolocation:', JSON.stringify(props.appLocations, null, 2))
  }
})
</script>
  
  <style scoped>
  .table-wrapper {
    overflow: visible;
  }

  .table-wrapper-location {
    width: 100%;
    max-width: 100%;
    margin: auto;
    padding-top: 4px;
    overflow-x: hidden;
    overflow-y: visible;
  }

  @media (min-width: 961px) {
    .table-wrapper-location {
      min-width: 400px;
    }
  }

  .map-wrapper {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
  }
  .map-wrapper > * {
    width: 100%;
    max-width: 100%;
  }
  .locations-table {
    font-family: monospace;
    border-radius: 8px;
    overflow: hidden;
  }
 

/* Adjust column width and padding for clarity */
::v-deep(.locations-table td.v-data-table__td),
::v-deep(.locations-table th.v-data-table__th) {
  padding: 8px 16px !important;
  white-space: nowrap;
}
  </style>
  