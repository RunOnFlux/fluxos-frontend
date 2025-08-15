<template>
  <div v-if="component">
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

    <ListEntry
      v-for="(resource, rIndex) in buildResources(component)"
      :key="rIndex"
      :title-icon="resource.icon"
      title-icon-scale="1.2"
      :title="resource.label"
    >
      <template #default>
        <div
          v-if="component?.tiered"
          class="tiered-inline"
        >
          <kbd
            v-for="(value, name) in resource.tiers"
            :key="name"
            class="alert alert-success resource-kbd"
          >
            {{ name }}: {{ value }}
          </kbd>
        </div>
        <div v-else>
          <kbd class="alert alert-success resource-kbd">{{ resource.flat }}</kbd>
        </div>
      </template>
    </ListEntry>
  </div>
</template>

<script setup>
const props = defineProps({
  component: Object,
  index: Number,
  appName: String,
})

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

  return [
    {
      label: "CPU",
      icon: "mdi-speedometer",
      flat: pluralize(component.cpu, "Core", "Cores"),
      tiers: {
        Cumulus: pluralize(component.cpubasic, "Core", "Cores"),
        Nimbus: pluralize(component.cpusuper, "Core", "Cores"),
        Stratus: pluralize(component.cpubamf, "Core", "Cores"),
      },
    },
    {
      label: "RAM",
      icon: "mdi-memory",
      flat: `${component.ram} MB`,
      tiers: {
        Cumulus: `${component.rambasic} MB`,
        Nimbus: `${component.ramsuper} MB`,
        Stratus: `${component.rambamf} MB`,
      },
    },
    {
      label: "SSD",
      icon: "mdi-harddisk",
      flat: `${component.hdd} GB`,
      tiers: {
        Cumulus: `${component.hddbasic} GB`,
        Nimbus: `${component.hddsuper} GB`,
        Stratus: `${component.hddbamf} GB`,
      },
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
