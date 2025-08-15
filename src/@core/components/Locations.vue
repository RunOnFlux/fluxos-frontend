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
            label="Per page"
            :items="appLocationOptions.pageOptions"
            density="compact"
            class="flex-grow-1"
          />
        </VCol>
  
        <VCol cols="8">
          <VTextField
            v-model="appLocationOptions.filter"
            label="Filter"
            density="compact"
            variant="outlined"
            placeholder="Type to Search"
            clearable
            class="flex-grow-1"
          >
            <template #prepend-inner>
              <VIcon size="20">
                tabler-search
              </VIcon>
            </template>
            <template #append-inner>
              <VTooltip text="Select active instance">
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
          :items="paginatedLocations"
          :items-per-page="appLocationOptions.perPage"
          :page="appLocationOptions.currentPage"
          class="locations-table"
          hide-default-footer
          hide-headers
          fixed-header
          density="compact"
          no-data-text="No instances found..."
        >
          <template #headers />
  
          <template #item.ip="{ item }">
            <div class="d-flex align-center text-no-wrap">
              <VChip
                color="info"
                size="small"
                class="mr-2"
              >
                <VIcon
                  icon="mdi-laptop"
                  size="18"
                />
              </VChip>
              <VChip
                color="success"
                label
                size="small"
                class="text-no-wrap"
                style="border-radius: 15px"
              >
                <strong>{{ item.ip }}</strong>
              </VChip>
            </div>
          </template>
  
          <template #item.osUptime="{ item }">
            <span
              v-bind="props"
              class="text-no-wrap"
            >
              <VTooltip text="System uptime since last reboot">
                <template #activator="{ props: tooltipProps }">
                  <VChip
                    color="info"
                    size="small"
                    class="mr-2 ml-2 text-no-wrap"
                    v-bind="tooltipProps"
                  >
                    <VIcon
                      icon="mdi-home-clock"
                      size="18"
                    />
                  </VChip>
                </template>
              </VTooltip>

              <VChip
                color="success"
                label
                size="small"
                class="text-no-wrap"
                style="border-radius: 15px"
              >
                <strong>{{ formatUptime(item.osUptime) }}</strong>
              </VChip>
            </span>
          </template>

          <template #item.running="{ item }">
            <span
              v-bind="props"
              class="text-no-wrap"
            >
              <VTooltip text="Time elapsed since installation">
                <template #activator="{ props: tooltipProps }">
                  <VChip
                    color="info"
                    size="small"
                    class="mr-2 ml-2 text-no-wrap"
                    v-bind="tooltipProps"
                  >
                    <VIcon
                      icon="mdi-clock-fast"
                      size="20"
                    />
                  </VChip>
                </template>
              </VTooltip>

              <VChip
                color="success"
                label
                size="small"
                class="text-no-wrap"
                style="border-radius: 15px"
              >
                <strong>{{ timeElapsed(item.runningSince) }}</strong>
              </VChip>
            </span>
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
              <VTooltip text="Visit App">
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
  
              <VTooltip text="Visit FluxNode">
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
  
// Reactive state
const mapVisible = ref(props.expanded)
  
const appLocationOptions = ref({
  perPage: 5,
  pageOptions: [5, 10, 25, 50, 100],
  currentPage: 1,
  filter: "",
})

const defaultFields = [
  { key: "ip", title: "IP Address",   cellClass: 'column-ip', headerProps: { class: 'column-ip' } },
  { key: "osUptime", title: "Uptime",  cellClass: 'column-uptime', headerProps: { class: 'column-uptime' } },
  { key: "running", title: "Running",  cellClass: 'column-running', headerProps: { class: 'column-running' } },
  ...(props.showLocation
    ? [{ key: "continent", title: "Continent", sortable: false, cellClass: 'column-continent', headerProps: { class: 'column-continent' } }]
    : []),
  ...(props.showLocation
    ? [{ key: "country", title: "Country", sortable: false, cellClass: 'column-country', headerProps: { class: 'column-country' } }]
    : []),
  ...(props.showLocation
    ? [{ key: "region", title: "Region", sortable: false, cellClass: 'column-region', headerProps: { class: 'column-region' } }]
    : []),
  { key: "visit", title: "" },
]

const appLocationFields = computed(() => defaultFields)



  
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
  if (!seconds || isNaN(seconds)) return "N/A"
  
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
  .table-wrapper-location {
    width: 100%;
    min-width: 400px;
    max-width: 100%;
    margin: auto;
  }
  .map-wrapper {
    width: 100%;
    overflow-x: auto;
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
::v-deep(.locations-table td.v-data-table__td:nth-child(1)),
::v-deep(.locations-table th.v-data-table__th:nth-child(1)) {
  padding: 0px 16px 0px 24px !important;
  min-width: 230px !important;
  max-width: 255px !important;
  white-space: nowrap;
}

::v-deep(.locations-table td.v-data-table__td:nth-child(2)),
::v-deep(.locations-table th.v-data-table__th:nth-child(2)),
::v-deep(.locations-table td.v-data-table__td:nth-child(3)),
::v-deep(.locations-table th.v-data-table__th:nth-child(3)) {
  padding: 0 !important;
  min-width: 155px !important;
  max-width: 175px !important;
  white-space: nowrap;
}
  </style>
  