<template>
  <VCard :class="{ 'dark-theme': theme.value === 'dark' }">
    <div class="v-map-wrapper">
      <div
        ref="mapContainer"
        style="height: 450px; width: 100%"
      />
      <div
        v-if="!loading && tierDisplay"
        class="tier-label"
      >
        {{ tierDisplay }}
      </div>

      <Transition name="fade">
        <div
          v-if="loading"
          class="v-loader"
        >
          <div class="v-loader-inner">
            <div class="v-loader-content">
              <VProgressCircular
                indeterminate
                size="40"
              />
              <div class="loading-text">
                Loading...
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </VCard>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, onUnmounted, computed } from "vue"
import * as L from "leaflet"
import { MarkerClusterGroup } from "leaflet.markercluster"
import axios from "axios"
import { useConfigStore } from "@core/stores/config"
import { storeToRefs } from "pinia"

import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import iconUrl from "leaflet/dist/images/marker-icon.png"
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import shadowUrl from "leaflet/dist/images/marker-shadow.png"

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  showAll: { type: Boolean, default: true },
  filterNodes: { type: Array, default: () => [] },
})

const { theme } = storeToRefs(useConfigStore())

const mapContainer = ref(null)
const fluxList = ref([])
const fallbackNodes = ref([])
const loading = ref(true)
const initialized = ref(false)

let leafletMap = null
let markerClusterGroup = null

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function nodeHttpsUrlFromEndpoint(endpoint, options = {}) {
  const scheme = "https://"
  const domain = "node.api.runonflux.io"
  const portMap = { api: 0, home: -1 }
  const urlType = options.urlType || "api"

  const [ip, apiPort] = endpoint.includes(":")
    ? endpoint.split(":")
    : [endpoint, "16127"]

  const port = +apiPort + portMap[urlType]
  const ipAsName = ip.replace(/\./g, "-")

  return `${scheme}${ipAsName}-${port}.${domain}`
}

function stripPort(ip) {
  return ip.includes(':') ? ip.split(':')[0] : ip
}

async function getGeoFromIp(ip) {
  try {
    const plainIp = stripPort(ip) 
    const res = await axios.get(`https://ipapi.co/${plainIp}/json/`)
    if (res.status === 200) {
      return {
        lat: res.data.latitude,
        lon: res.data.longitude,
        org: res.data.org || "Unknown",
      }
    }
  } catch (err) {
    console.error("🔴 GeoIP lookup failed for", ip, err)
  }

  return null
}

async function getNodesViaApi() {
  const url = "https://stats.runonflux.io/fluxinfo?projection=geolocation,ip,tier"
  try {
    const res = await axios.get(url)
    if (res.status === 200 && res.data.status === "success") {
      console.log("🟢 Nodes fetched via API:", res.data.data.length)

      return res.data.data
    }
  } catch (error) {
    console.error("🔴 Error fetching nodes:", error)
  }

  return []
}

function getNodeTierUrl(ip) {
  if (ip.includes(':')) {
    return `http://${ip}/flux/nodetier`
  }
  
  return `http://${ip}:16127/flux/nodetier`
}

function parseTierResponse(data) {
  if (typeof data !== 'string') return 'UNKNOWN'
  const base = data.includes('_') ? data.split('_')[0] : data
  
  return base.toUpperCase()
}

async function getFilteredWithFallback() {
  const initialNodes = fluxList.value
  let filtered = props.showAll
    ? [...initialNodes, ...fallbackNodes.value]
    : initialNodes.filter(n => props.filterNodes.includes(n.ip))

  let missingIps = props.showAll
    ? []
    : props.filterNodes.filter(ip => !filtered.some(n => n.ip === ip))

  if (!props.showAll && missingIps.length === 0 && filtered.length === 0) {
    missingIps = props.filterNodes
  }

  console.log("🟡 Filtered nodes:", filtered.length)
  if (missingIps.length) {
    console.log("🟠 Missing IPs needing fallback:", missingIps)
  }

  if (missingIps.length > 0) {
    for (const ip of missingIps) {
      if (
        initialNodes.some(n => n.ip === ip) ||
        fallbackNodes.value.some(n => n.ip === ip)
      )
        continue

      const url = `${nodeHttpsUrlFromEndpoint(ip)}/flux/info`
      try {
        const res = await axios.get(url, { timeout: 5000 })
        if (res.data.status === "success" && res.data.data?.node) {
          const nodeData = res.data.data

          if (!nodeData.geolocation) {
            console.warn(`⚠️ No geolocation from node, trying GeoIP for ${ip}`)

            const geoFallback = await getGeoFromIp(ip)
            if (geoFallback) {
              nodeData.geolocation = {
                lat: geoFallback.lat,
                lon: geoFallback.lon,
                org: geoFallback.org,
              }
            }
          }

          if (nodeData.geolocation) {
            const newNode = {
              ip: nodeData.node.status.ip,
              tier: nodeData.node.status.tier,
              geolocation: nodeData.geolocation,
            }

            fallbackNodes.value.push(newNode)
            filtered.push(newNode)
          } else {
            console.warn(`⚠️ Still no geolocation for IP: ${ip}`)
          }
        }
      } catch (err) {
        // Parallel fallback: GeoIP and nodetier
        const [geoFallback, tierFallback] = await Promise.allSettled([
          getGeoFromIp(ip),
          axios.get(getNodeTierUrl(ip), { timeout: 5000 }),
        ])

        const geoData = geoFallback.status === "fulfilled" ? geoFallback.value : null

        const parsedTier = tierFallback.status === "fulfilled"
          ? parseTierResponse(tierFallback.value.data?.data)
          : "UNKNOWN"

        if (geoData) {
          const newNode = {
            ip,
            tier: parsedTier,
            geolocation: {
              lat: geoData.lat,
              lon: geoData.lon,
              org: geoData.org,
            },
          }

          fallbackNodes.value.push(newNode)
          filtered.push(newNode)
        } else {
          console.warn(`⚠️ GeoIP fallback also failed for IP: ${ip}`)
        }
      }
    }
  }

  return props.showAll ? [...initialNodes, ...fallbackNodes.value] : filtered
}

function buildGeoJsonLayer(nodes) {
  const features = nodes
    .map(n => {
      const lat = parseFloat(n.geolocation?.lat)
      const lon = parseFloat(n.geolocation?.lon)

      if (isNaN(lat) || isNaN(lon)) {
        console.warn(`⚠️ Skipping node with invalid geolocation: ${n.ip}`, n.geolocation)

        return null
      }

      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon, lat] },
        properties: {
          ip: n.ip || "Unknown",
          tier: n.tier || "Unknown",
          org: n.geolocation?.org || "Unknown",
        },
      }
    })
    .filter(Boolean)

  return L.geoJSON(
    { type: "FeatureCollection", features },
    {
      pointToLayer: (feature, latlng) => L.marker(latlng, { icon: DefaultIcon }),
      onEachFeature: (feature, layer) => {
        const { ip, tier, org } = feature.properties

        layer.bindPopup(`IP: ${ip}<br>Tier: ${tier}<br>ISP: ${org}`)
      },
    },
  )
}

async function renderMarkers() {
  if (!leafletMap || !markerClusterGroup) return

  const allNodes = await getFilteredWithFallback()
  const geoJsonLayer = buildGeoJsonLayer(allNodes)

  markerClusterGroup.clearLayers()
  markerClusterGroup.addLayer(geoJsonLayer)

  const bounds = geoJsonLayer.getBounds()
  if (bounds.isValid()) {
    leafletMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 })
  }
}

function applyTheme() {
  if (leafletMap) {
    leafletMap.getContainer().classList.toggle("leaflet-dark", theme.value === "dark")
  }
}

function initMap() {
  if (!mapContainer.value) return

  leafletMap = L.map(mapContainer.value, {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 18,
  })

  const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 18,
    detectRetina: true,
  })

  tileLayer.addTo(leafletMap)

  markerClusterGroup = new MarkerClusterGroup({
    chunkedLoading: true,
    chunkDelay: 50,
    maxClusterRadius: 80,
    spiderfyOnMaxZoom: true,
  })

  leafletMap.addLayer(markerClusterGroup)
  applyTheme()

  leafletMap.invalidateSize()
}

onMounted(async () => {
  console.log("🟢 Map initialization...")

  if (!fluxList.value.length) {
    if (props.nodes.length > 0) {
      fluxList.value = props.nodes
      console.log("🟢 Using passed nodes:", fluxList.value.length)
    } else {
      fluxList.value = await getNodesViaApi()
    }
  } else {
    console.log("🟡 FluxList already filled, skipping load.")
  }

  await nextTick()
  initMap()
  await renderMarkers()

  setTimeout(() => {
    loading.value = false
  }, 200)

  initialized.value = true
})

watch(theme, () => {
  applyTheme()
})

const tierDisplay = computed(() => {
  const tierCounts = {}

  const nodesToUse = props.showAll
    ? [...fluxList.value, ...fallbackNodes.value]
    : [...fluxList.value, ...fallbackNodes.value].filter(n => props.filterNodes.includes(n.ip))

  for (const node of nodesToUse) {
    if (node.tier) {
      tierCounts[node.tier] = (tierCounts[node.tier] || 0) + 1
    }
  }

  if (!Object.keys(tierCounts).length) return ''

  return Object.entries(tierCounts)
    .map(([tier, count]) => `${tier}: ${count}`)
    .join(', ')
})

onUnmounted(() => {
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
  if (markerClusterGroup) {
    markerClusterGroup.clearLayers()
    markerClusterGroup = null
  }
})
</script>

<style scoped>
.v-map-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}
.v-map-wrapper > div {
  width: 100%;
  height: 450px;
}
.v-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgb(var(--v-theme-surface));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.v-loader-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}
.v-loader-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-direction: row;
}
.loading-text {
  font-size: 1.2rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.leaflet-dark {
  filter: invert(90%) hue-rotate(180deg);
}
@media (max-width: 600px) {
  .v-map-wrapper > div {
    height: 300px;
  }
}
.tier-label {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(33, 150, 243, 0.85);
  color: #fff;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 500;
  border-radius: 16px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 25px !important;
  width: auto !important;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 500;
  pointer-events: none;
}
</style>
