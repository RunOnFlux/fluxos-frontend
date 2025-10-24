<template>
  <VCard
    icon="mdi-server"
    class="rounded-xl elevation-4 mb-6 pa-2"
    style="width: 100%;"
  >
    <div
      class="d-flex align-center justify-center px-2"
      :style="{
        gap: windowWidth >= 600 ? '48px' : '24px',
        whiteSpace: 'nowrap',
        fontSize: 'clamp(9.2px, 2vw, 14px)',
        overflow: 'visible',
        width: '100%',
      }"
    >
      <!-- Backend -->
      <div
        v-if="fluxVersion"
        class="d-inline-flex align-center"
      >
        <VTooltip location="top">
          <template #activator="{ props }">
            <span
              class="d-inline-flex align-center"
              style="position: relative"
              v-bind="props"
            >
              <VBadge
                dot
                bordered
                :color="isNewBackendVersion ? 'warning' : 'success'"
                location="top start"
                offset-x="-1"
                offset-y="2"
              >
                <template #badge>
                  <span
                    class="v-badge__dot"
                    style="background-color: #ff7043"
                  />
                </template>
                <VIcon
                  size="20"
                  class="me-2"
                >tabler-settings</VIcon>
              </VBadge>
            </span>
          </template>
          <span>{{
            isNewBackendVersion ? t("core.statusBar.updateAvailable") : t("core.statusBar.upToDate")
          }}</span>
        </VTooltip>
        <span>{{ t("core.statusBar.backend") }}: {{ fluxVersion }}</span>
      </div>

      <!-- Frontend -->
      <div class="d-inline-flex align-center">
        <VTooltip location="top">
          <template #activator="{ props }">
            <span
              class="d-inline-flex align-center"
              style="position: relative"
              v-bind="props"
            >
              <VBadge
                dot
                bordered
                location="top start"
                :color="isNewFrontendVersion ? 'warning' : 'success'"
                offset-x="-1"
                offset-y="1"
              >
                <template #badge>
                  <span
                    class="v-badge__dot"
                    style="background-color: #ff7043"
                  />
                </template>
                <VIcon
                  size="20"
                  class="me-2"
                >mdi-view-dashboard-outline</VIcon>
              </VBadge>
            </span>
          </template>
          <span>{{
            isNewFrontendVersion ? t("core.statusBar.updateAvailable") : t("core.statusBar.upToDate")
          }}</span>
        </VTooltip>
        <span>{{ t("core.statusBar.frontend") }}: {{ frontendVersion }}</span>
      </div>

      <!-- Node Status -->
      <div class="d-inline-flex align-center">
        <VTooltip location="top">
          <template #activator="{ props }">
            <span
              class="d-inline-flex align-center"
              style="position: relative"
              v-bind="props"
            >
              <VBadge
                dot
                bordered
                location="top start"
                :color="getNodeStatusResponse.class"
                offset-x="-1"
                offset-y="1"
              >
                <template #badge>
                  <span
                    class="v-badge__dot"
                    style="background-color: #ff7043"
                  />
                </template>
                <VIcon
                  size="20"
                  class="me-2"
                >tabler-heartbeat</VIcon>
              </VBadge>
            </span>
          </template>
          <span>{{ getNodeStatusResponse.message }}</span>
        </VTooltip>
        <span class="d-inline-flex align-center">
          {{ t("core.statusBar.statusMessage") }}:
          <VProgressCircular
            v-if="getNodeStatusResponse.nodeStatus === t('core.statusBar.checkingStatus')"
            color="primary"
            :size="14"
            :width="2"
            indeterminate
            class="ml-1"
          />
          <span :class="`ml-1 text-${getNodeStatusResponse.class}`">
            {{ getNodeStatusResponse.nodeStatus }}
          </span>
        </span>
      </div>
    </div>
  </VCard>
</template>

<script setup>
import DaemonService from "@/services/DaemonService"
import FluxService from "@/services/FluxService"
import { useFluxStore } from "@/stores/flux"
import { onMounted, reactive, ref, watch, getCurrentInstance } from "vue"
import { useI18n } from "vue-i18n"
import { eventBus } from "@/utils/eventBus"

const { t } = useI18n()
const instance = getCurrentInstance()
const i18n = instance.appContext.config.globalProperties.$i18n
const frontendVersion = import.meta.env.VITE_FRONTEND_VERSION
const fluxStore = useFluxStore()
const { fluxVersion } = storeToRefs(fluxStore)
const windowWidth = ref(0)
const isNewBackendVersion = ref(false)
const isNewFrontendVersion = ref(false)

watch(
  () => i18n.locale,
  () => {
    nodeStatus()
  },
)




const getNodeStatusResponse = reactive({
  nodeStatus: t("core.statusBar.checkingStatus"),
  class: "primary",
  message: t("core.statusBar.checkingStatusMessage"),
})

const nodeStatus = async () => {
  const [res, info] = await Promise.all([
    DaemonService.getFluxNodeStatus().catch(() => null),
    DaemonService.getBlockchainInfo().catch(() => null),
  ])

  if (!res || !info) {
    getNodeStatusResponse.nodeStatus = t("core.statusBar.unreachable")
    getNodeStatusResponse.class = "error"
    getNodeStatusResponse.message = t("core.statusBar.unreachable")

    return
  }

  const node = res.data?.data
  const chain = info.data?.data
  const blocksBehind = chain?.headers - chain?.blocks

  getNodeStatusResponse.status = res.data?.status
  getNodeStatusResponse.data = node

  if (chain?.headers > 0 && chain?.blocks > 0 && blocksBehind > 3) {
    getNodeStatusResponse.nodeStatus = t("core.statusBar.notSynced")
    getNodeStatusResponse.class = "warning"
    getNodeStatusResponse.message = t("core.statusBar.notSyncedMessage", {
      blocks: chain?.blocks,
      headers: chain?.headers,
      blocksBehind,
    })
  } else if (node.status === "CONFIRMED" || node.location === "CONFIRMED") {
    getNodeStatusResponse.nodeStatus = t("core.statusBar.connected")
    getNodeStatusResponse.class = "success"
    getNodeStatusResponse.message = t("core.statusBar.connectedMessage")
  } else if (node.status === "STARTED" || node.location === "STARTED") {
    getNodeStatusResponse.nodeStatus = t("core.statusBar.connecting")
    getNodeStatusResponse.class = "warning"
    getNodeStatusResponse.message = t("core.statusBar.connectingMessage")
  } else {
    getNodeStatusResponse.nodeStatus = t("core.statusBar.disconnected")
    getNodeStatusResponse.class = "error"
    getNodeStatusResponse.message = t("core.statusBar.disconnectedMessage")
  }
}

onMounted(() => {
  if (typeof window !== "undefined") {
    windowWidth.value = window.innerWidth

    window.addEventListener("resize", () => {
      windowWidth.value = window.innerWidth
    })
  }

  const fetchFluxVersion = async () => {
    try {
      const response = await FluxService.getFluxVersion()
      const version = response.data?.data

      fluxVersion.value = version
    } catch (error) {
      console.error(error)
    }
  }

  const getLatestFluxVersion = async () => {
    try {
      const response = await axios.get(
        "https://raw.githubusercontent.com/runonflux/flux/master/package.json",
      )

      const latestVersion = response.data?.version

      if (latestVersion && fluxVersion.value && latestVersion !== fluxVersion.value) {
        isNewBackendVersion.value = true
      } else {
        isNewBackendVersion.value = false
      }
    } catch (error) {
      console.error(error)
    }
  }

  nodeStatus()
  eventBus.on("backendURLChanged", nodeStatus)
})

onBeforeUnmount(() => {
  eventBus.off("backendURLChanged", nodeStatus)
})
</script>
