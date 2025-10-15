<template>
  <div v-if="component" class="component-details-root">
    <ListEntry
      title="Name"
      :data="component.name"
      title-icon="mdi-cube-scan"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    />
    <ListEntry
      title="Description"
      :data="component.description"
      title-icon="mdi-text-box"
      title-icon-scale="1.3"
      kbd-variant="secondary"
      hide-if-empty
    />

    <ListEntry
      title="Repository"
      title-icon="mdi-docker"
      title-icon-scale="1.5"
    >
      <template #default>
        <a
          :href="getRepositoryLink(component.repotag)"
          target="_blank"
          rel="noopener noreferrer"
          class="mr-1 d-inline-block"
          :class="{ 'resource-kbd-disabled': component.repoauth }"
        >
          <kbd
            class="alert-danger resource-kbd"
            :class="[{ 'animated-link': !component.repoauth }]"
          >
            {{ component.repotag }}
          </kbd>
        </a>
      </template>
    </ListEntry>

    <ListEntry
      title="Repository Authentication"
      title-icon="mdi-lock"
      title-icon-scale="1.4"
    >
      <template #default>
        <kbd class="alert-secondary resource-kbd">
          <VIcon size="18">{{ component?.repoauth ? "mdi-eye-off" : "mdi-eye" }}</VIcon>
          {{ component?.repoauth ? "Private" : "Public" }}
        </kbd>
      </template>
    </ListEntry>

    <ListEntry
      title="Custom Domains"
      :data="sanitized(component?.domains) || ''"
      hide-if-empty
      title-icon="mdi-link"
      title-icon-scale="1.3"
    >
      <template #default>
        <div class="kbd-list">
          <a
            v-for="(domain, dIndex) in sanitized(component?.domains)"
            :key="dIndex"
            :href="`https://${domain}`"
            target="_blank"
            rel="noopener noreferrer"
            class="d-inline-block"
          >
            <kbd class="alert-info resource-kbd animated-link">{{ domain }}</kbd>
          </a>
        </div>
      </template>
    </ListEntry>

    <ListEntry
      title="Automatic Domains"
      :data="constructAutomaticDomains(component?.ports, appName, index)"
      title-icon="mdi-earth"
      title-icon-scale="1.2"
      hide-if-empty
    >
      <template #default>
        <div class="kbd-list">
          <a
            v-for="(domain, aIndex) in constructAutomaticDomains(
              component?.ports,
              appName,
              index
            )"
            :key="aIndex"
            :href="`https://${domain}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            <kbd class="alert-info resource-kbd animated-link">{{ domain }}</kbd>
          </a>
        </div>
      </template>
    </ListEntry>

    <ListEntry
      title="Ports"
      :data="sanitized(component?.ports)"
      hide-if-empty
      title-icon="mdi-power-plug"
      title-icon-scale="1.3"
    >
      <template #default>
        <div class="kbd-list">
          <kbd
            v-for="(port, pIndex) in sanitized(component?.ports)"
            :key="pIndex"
            class="alert-success resource-kbd"
          >
            {{ port }}
          </kbd>
        </div>
      </template>
    </ListEntry>

    <ListEntry
      title="Container Ports"
      :data="sanitized(component?.containerPorts)"
      hide-if-empty
      title-icon="mdi-power-plug-outline"
      title-icon-scale="1.3"
    >
      <template #default>
        <div class="kbd-list">
          <kbd
            v-for="(port, cIndex) in sanitized(component?.containerPorts)"
            :key="cIndex"
            class="alert-success resource-kbd"
          >
            {{ port }}
          </kbd>
        </div>
      </template>
    </ListEntry>

    <ListEntry
      title="Container Data"
      :data="component?.containerData"
      title-icon="mdi-folder"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    >
      <template #default>
        <kbd
          class="alert-secondary resource-kbd d-flex align-items-center"
          style="width: fit-content;"
        >
          <VIcon
            v-if="/s:|r:|g:/i.test(component?.containerData)"
            size="20"
            color="info"
            class="mr-1"
          >mdi-folder-sync</VIcon>
          {{ component?.containerData }}
        </kbd>
      </template>
    </ListEntry>

    <ListEntry
      title="Environment Parameters"
      :data="
        Array.isArray(component?.environmentParameters)
          ? component.environmentParameters.join(', ')
          : ''
      "
      hide-if-empty
      title-icon="mdi-cog-outline"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    />

    <ListEntry
      title="Commands"
      :data="Array.isArray(component?.commands) ? component.commands.join(', ') : ''"
      hide-if-empty
      title-icon="mdi-console"
      title-icon-scale="1.2"
      kbd-variant="secondary"
    />

    <ListEntry
      v-if="component?.secrets"
      title="Secrets"
      title-icon="mdi-shield-lock"
      title-icon-scale="1.3"
      kbd-variant="secondary"
    >
      <template #default>
        <kbd class="alert-secondary resource-kbd d-inline-flex align-items-center">
          Content Encrypted
        </kbd>
      </template>
    </ListEntry>

    <div class="d-flex align-center justify-start my-3">
      <VChip
        color="surface"
        variant="tonal"
        class="hardware-chip w-100"
      >
        <VIcon
          size="22"
          class="ml-1"
          color="success"
        >
          mdi-chart-box-outline
        </VIcon>
        <span
          class="ml-1 hardware-chip-text"
        >Hardware Resources</span>
      </VChip>
    </div>
    <div class="hardware-resources-grid">
      <VCard
        v-for="(resource, rIndex) in buildResources(component)"
        :key="rIndex"
        border
        class="hardware-card"
      >
        <VCardText class="pa-3 position-relative d-flex align-center justify-center">
          <div class="resource-label">
            <VIcon :icon="resource.icon" size="24" color="grey" class="mr-2" />
            <span class="text-subtitle-1 font-weight-medium">{{ resource.label }}</span>
          </div>
          <div class="circular-progress-wrapper">
            <svg class="circular-progress" viewBox="0 0 100 100" style="overflow: visible;">
              <defs>
                <filter :id="`progress-glow-${rIndex}`" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <!-- Background track -->
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(var(--v-theme-on-surface), 0.12)"
                stroke-width="8"
                stroke-dasharray="none"
              />
              <!-- Progress arc with glow -->
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                :stroke="getColorHex(resource.color)"
                stroke-width="8"
                stroke-linecap="butt"
                :stroke-dasharray="`${2 * Math.PI * 42}`"
                :stroke-dashoffset="`${2 * Math.PI * 42 - (2 * Math.PI * 42 * resource.visualPercentage / 100)}`"
                :filter="`url(#progress-glow-${rIndex})`"
                transform="rotate(-90 50 50)"
              />
              <!-- Radial separators -->
              <line
                v-for="separator in 30"
                :key="`sep-${separator}`"
                x1="50"
                y1="0"
                x2="50"
                y2="100"
                stroke="rgb(var(--v-theme-surface))"
                stroke-width="2"
                :transform="`rotate(${-90 + (separator - 0.5) * (360 / 30)} 50 50)`"
              />
            </svg>
            <div class="circular-content">
              <VChip :color="resource.color" variant="tonal" size="small" rounded="xl">{{ resource.value }}</VChip>
              <div class="text-caption font-weight-bold mt-1" :style="{ color: getColorHex(resource.color) }">{{ resource.percentage }}%</div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  component: Object,
  index: Number,
  appName: String,
})

function getColorHex(color) {
  const colors = {
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3'
  }
  return colors[color] || colors.success
}

function getSegmentArc(segment) {
  const totalSegments = 50
  const radius = 42
  const cx = 50
  const cy = 50
  const segmentAngle = 360 / totalSegments
  const gapAngle = 2
  const arcAngle = segmentAngle - gapAngle

  const startAngle = ((segment - 1) * segmentAngle - 90) * (Math.PI / 180)
  const endAngle = ((segment - 1) * segmentAngle + arcAngle - 90) * (Math.PI / 180)

  const x1 = cx + radius * Math.cos(startAngle)
  const y1 = cy + radius * Math.sin(startAngle)
  const x2 = cx + radius * Math.cos(endAngle)
  const y2 = cy + radius * Math.sin(endAngle)

  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`
}


function sanitized(value) {
  const removeProtocol = url => url.replace(/^https?:\/\//, "")
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .flatMap(item =>
        typeof item === "string"
          ? item.split(",").map(i => removeProtocol(i.trim()))
          : [item],
      )
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map(i => removeProtocol(i.trim()))
      .filter(Boolean)
  }

  return []
}

function getRepositoryLink(tag) {
  if (!tag) return null
  const [repo] = tag.split(":")
  if (repo.startsWith("ghcr.io/") || repo.startsWith("registry.gitlab.com/"))
    return `https://${repo}`
  if (repo.startsWith("docker.io/"))
    return `https://hub.docker.com/r/${repo.replace("docker.io/", "")}`
  if (!repo.includes("/")) return `https://hub.docker.com/_/${repo}`

  return `https://hub.docker.com/r/${repo}`
}

function buildResources(component) {
  const pluralize = (value, singular, plural) => {
    return `${value} ${value === 1 ? singular : plural}`
  }

  // Maximum limits
  const MAX_CPU = 15
  const MAX_RAM = 65536
  const MAX_HDD = 820
  const MIN_VISIBLE_PERCENTAGE = 2 // Minimum 2% to ensure circle is visible

  const cpuValue = component.cpu || 0
  const ramValue = component.ram || 0
  const hddValue = component.hdd || 0

  const calculatePercentages = (value, max) => {
    const actualPercentage = (value / max) * 100
    const visualPercentage = value > 0 ? Math.max(actualPercentage, MIN_VISIBLE_PERCENTAGE) : 0
    return {
      percentage: actualPercentage.toFixed(1),
      visualPercentage: visualPercentage.toFixed(1)
    }
  }

  const cpuPercentages = calculatePercentages(cpuValue, MAX_CPU)
  const ramPercentages = calculatePercentages(ramValue, MAX_RAM)
  const hddPercentages = calculatePercentages(hddValue, MAX_HDD)

  return [
    {
      label: "CPU",
      icon: "mdi-cpu-64-bit",
      color: "success",
      value: pluralize(cpuValue, "vCore", "vCores"),
      percentage: cpuPercentages.percentage,
      visualPercentage: cpuPercentages.visualPercentage,
    },
    {
      label: "RAM",
      icon: "mdi-memory",
      color: "warning",
      value: `${ramValue} MB`,
      percentage: ramPercentages.percentage,
      visualPercentage: ramPercentages.visualPercentage,
    },
    {
      label: "SSD",
      icon: "mdi-harddisk",
      color: "info",
      value: `${hddValue} GB`,
      percentage: hddPercentages.percentage,
      visualPercentage: hddPercentages.visualPercentage,
    },
  ]
}

function constructAutomaticDomains(ports, name, index = 0) {
  if (!Array.isArray(ports) || !name) return []
  const lowerCaseName = name.toLowerCase()
  const domains = []
  if (index === 0) domains.push(`${lowerCaseName}.app.runonflux.io`)
  for (const port of ports) domains.push(`${lowerCaseName}_${port}.app.runonflux.io`)

  return domains
}
</script>

<style scoped>
.hardware-chip {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: 8px 16px !important;
  border-radius: 15px !important;
  font-family: monospace;
  font-size: 18px !important;
  height: 32px !important;
  min-height: 32px !important;
  background-color: rgba(var(--v-theme-on-surface), 0.15) !important;
}

.hardware-chip-text {
  font-size: 18px;
  color: #E1DEF5 !important;
}

.hardware-chip .v-icon {
  color: #E1DEF5 !important;
}

.hardware-resources-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

@media (max-width: 960px) {
  /* Constrain root and all content to prevent overflow */
  .component-details-root {
    max-width: 100% !important;
    width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    padding: 0 8px !important;
  }

  .component-details-root > * {
    max-width: 100% !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }

  .list-entry {
    max-width: 100% !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }

  .hardware-resources-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin: 0 !important;
    padding: 10px 0 0 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  .hardware-chip {
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .hardware-card {
    min-height: auto !important;
    height: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
    overflow: visible;
    position: relative;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
  }

  .hardware-card .v-card-text {
    padding: 0 !important;
    box-sizing: border-box;
    overflow: visible;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .circular-progress-wrapper {
    width: 100% !important;
    max-width: 140px !important;
    max-height: 140px !important;
    padding: 4px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    overflow: visible !important;
    box-sizing: border-box !important;
    margin: 0 auto !important;
  }

  .resource-label {
    font-size: 9px !important;
    position: relative !important;
    top: auto !important;
    left: auto !important;
    transform: none !important;
    background: rgb(var(--v-theme-surface)) !important;
    padding: 2px 6px !important;
    border-radius: 8px !important;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
    z-index: 1 !important;
    white-space: nowrap !important;
    margin-bottom: 6px !important;
  }

  .resource-label .v-icon {
    font-size: 10px !important;
  }

  .circular-content .v-chip {
    font-size: 12px !important;
    padding: 4px 8px !important;
  }

  .circular-content .text-caption {
    font-size: 12px !important;
  }
}

.hardware-card {
  min-height: 85px;
}

.resource-label {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
}

.resource-display-circular {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.circular-progress-wrapper {
  position: relative;
  width: 100%;
  max-width: 140px;
  height: auto;
  aspect-ratio: 1;
  margin: 0 auto;
  overflow: hidden;
  padding: 5px;
}

.circular-progress {
  width: 100%;
  height: 100%;
}

.segment-arc {
  transition: all 0.3s ease;
  stroke-linecap: round;
}

.segment-glow {
  filter: drop-shadow(0 0 3px currentColor);
}

.circular-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.kbd-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
  padding: 4px 12px;
  margin-bottom: 4px;
  border-radius: 15px;
  font-family: monospace;
  font-size: 14px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
}

.tiered-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.animated-link {
  position: relative;
  display: inline-block;
  color: inherit;
  text-decoration: none;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.animated-link:hover {
  transform: scale(1.03);
  filter: brightness(1.1);
}

.animated-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  height: 2px;
  background-color: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.2s ease;
}

.animated-link:hover::after {
  transform: scaleX(1);
}

.resource-kbd-disabled {
  cursor: default;
  pointer-events: none;
}
</style>
