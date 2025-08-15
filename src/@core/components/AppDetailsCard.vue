<template>
  <div v-if="app">
    <ListEntry
      title="Name"
      :data="app.name"
      title-icon="mdi-package-variant"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    />
    <ListEntry
      title="Description"
      :data="app.description"
      title-icon="mdi-text-box-outline"
      title-icon-scale="1.3"
      kbd-variant="secondary"
      hide-if-empty
    />
    <ListEntry
      title="Owner"
      :data="app.owner"
      title-icon="mdi-account"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    />
    <ListEntry
      title="Hash"
      :data="app.hash"
      title-icon="mdi-pound-box"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    />
    <ListEntry
      v-if="app?.contacts && app.contacts.length > 0"
      title="Contacts"
      :data="sanitized(app.contacts)"
      :title-icon="contactIcon(sanitized(app.contacts))"
      title-icon-scale="1.3"
      kbd-variant="secondary"
      hide-if-empty
    />
    <ListEntry
      title="Geolocation"
      title-icon="mdi-earth"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    >
      <template #default>
        <div class="kbd-list">
          <div
            v-for="(location, index) in app?.geolocation && app.geolocation.length > 0
              ? app.geolocation
              : ['Worldwide']"
            :key="index"
            class="d-inline-block"
            style="margin-right: 5px"
          >
            <kbd
              class="resource-kbd"
              :class="[
                {
                  'alert-info': getGeolocation(location)
                    .toLowerCase()
                    .includes('allowed'),
                  'alert-danger': getGeolocation(location)
                    .toLowerCase()
                    .includes('forbidden'),
                  'alert-secondary': !['allowed', 'forbidden'].some((keyword) =>
                    getGeolocation(location).toLowerCase().includes(keyword)
                  ),
                },
              ]"
            >
              {{ getGeolocation(location) }}
            </kbd>
          </div>
        </div>
      </template>
    </ListEntry>
    <ListEntry
      title="Instances"
      :data="app?.instances || 3"
      title-icon="mdi-map-marker"
      title-icon-scale="1.3"
      kbd-variant="success"
    />
    <ListEntry
      title="Specifications version"
      :data="app.version"
      title-icon="mdi-file-code"
      title-icon-scale="1.3"
      kbd-variant="success"
    />
    <ListEntry
      title="Registered on Blockheight"
      :data="app.height"
      title-icon="mdi-calendar-check"
      title-icon-scale="1.2"
      kbd-variant="success"
    />
    <ListEntry
      v-if="app.hash && app.hash.length === 64"
      title="Expires on Blockheight"
      :data="app.height + (app.expire || 22000)"
      title-icon="mdi-hourglass"
      title-icon-scale="1.2"
      kbd-variant="success"
    />
    <ListEntry
      title="Expires in"
      :data="getNewExpireLabel"
      title-icon="mdi-clock-outline"
      title-icon-scale="1.2"
      :kbd-variant="isExpiringSoon(getNewExpireLabel) ? 'danger' : 'success'"
    />
    <ListEntry
      title="Enterprise Nodes"
      :data="app?.nodes && app?.nodes.length > 0 ? app.nodes.join(', ') : 'Not scoped'"
      title-icon="mdi-server-network"
      title-icon-scale="1.2"
      kbd-variant="secondary"
    />
    <ListEntry
      title="Static IP"
      :data="
        app.staticip ? 'Yes, Running only on Static IP nodes' : 'No, Running on all nodes'
      "
      title-icon="mdi-map-marker-radius"
      title-icon-scale="1.2"
      kbd-variant="secondary"
    />
  </div>
</template>

<script setup>
import geolocations from "@/utils/geolocation"

const props = defineProps({
  app: Object,
  getNewExpireLabel: [String, Number, Function],
})

function getGeolocation(geo) {
  if (!geo) return "Worldwide"

  if (geo.startsWith("a") && !geo.startsWith("ac") && !geo.startsWith("a!c")) {
    // Specific continent
    const continentCode = geo.slice(1)

    const continentExists = geolocations.continents.find(
      c => c.code === continentCode,
    ) || { name: "Unknown" }

    
    return `Continent: ${continentExists.name}`
  }

  if (geo.startsWith("b")) {
    // Specific country
    const countryCode = geo.slice(1)

    const countryExists = geolocations.countries.find(c => c.code === countryCode) || {
      name: "Unknown",
    }

    
    return `Country: ${countryExists.name}`
  }

  if (geo.startsWith("ac")) {
    // Allowed location
    const specifiedLocation = geo.slice(2)
    const [continentCode, countryCode, regionName] = specifiedLocation.split("_")

    const continentExists = geolocations.continents.find(
      c => c.code === continentCode,
    ) || { name: "Unknown" }

    const countryExists = geolocations.countries.find(c => c.code === countryCode) || {
      name: "Unknown",
    }

    let locationString = `Allowed: Continent: ${continentExists.name}`
    if (countryCode) locationString += `, Country: ${countryExists.name}`
    if (regionName) locationString += `, Region: ${regionName}`
    
    return locationString
  }

  if (geo.startsWith("a!c")) {
    // Forbidden location
    const specifiedLocation = geo.slice(3)
    const [continentCode, countryCode, regionName] = specifiedLocation.split("_")

    const continentExists = geolocations.continents.find(
      c => c.code === continentCode,
    ) || { name: "Unknown" }

    const countryExists = geolocations.countries.find(c => c.code === countryCode) || {
      name: "Unknown",
    }

    let locationString = `Forbidden: Continent: ${continentExists.name}`
    if (countryCode) locationString += `, Country: ${countryExists.name}`
    if (regionName) locationString += `, Region: ${regionName}`
    
    return locationString
  }

  return "Worldwide"
}

function sanitized(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .flatMap(item =>
        typeof item === "string" ? item.split(",").map(i => i.trim()) : [item],
      )
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map(i => i.trim())
      .filter(Boolean)
  }

  return []
}

function contactIcon(value) {
  return value.some(v => typeof v === "string" && v.includes("@"))
    ? "mdi-email-outline"
    : "mdi-email-lock"
}

function isExpiringSoon(label) {
  const timeParts =
    typeof label === "string" ? label.match(/\d+\s*(day|hour|minute)/gi) : null

  if (!timeParts) return false

  const totalMinutes = timeParts.reduce((sum, part) => {
    const [num, unit] = part.match(/\d+|\D+/g).map(s => s.trim())
    const value = parseInt(num, 10)
    if (unit.startsWith("day")) return sum + value * 1440
    if (unit.startsWith("hour")) return sum + value * 60
    if (unit.startsWith("minute")) return sum + value

    return sum
  }, 0)

  return totalMinutes < 2880
}
</script>

<style scoped>
.kbd-list kbd {
  display: inline-block;
  margin-bottom: 0.25rem;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
}

.alert-primary {
  background-color: rgba(13, 110, 253, 0.1);
  color: #0d6efd !important;
}

.alert-secondary {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d !important;
}

.alert-success {
  background-color: rgba(25, 135, 84, 0.1);
  color: rgb(var(--v-theme-success)) !important;
}

.alert-danger {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545 !important;
}

.alert-warning {
  background-color: rgba(255, 193, 7, 0.1);
  color: #ffc107 !important;
}

.alert-info {
  background-color: rgba(13, 202, 240, 0.1);
  color: #0dcaf0 !important;
}

.resource-kbd {
  display: inline-block;
  max-width: 100%;
  padding: 4px  8px !important;
  margin-bottom: 4px;
  border-radius: 15px;
  font-family: monospace;
  font-size: 14px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
}
</style>
