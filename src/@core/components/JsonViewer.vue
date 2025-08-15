<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, reactive } from "vue"
import { storeToRefs } from "pinia"
import ClipboardJS from "clipboard"
import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"
import { useConfigStore } from "@core/stores/config"

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  message: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'mdi-folder-information-outline',
  },
})

const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)

const activeTab = ref(0)
const copyStates = reactive({})
let clipboard = null

onMounted(() => {
  nextTick(() => {
    clipboard = new ClipboardJS(".copy-json-btn")

    clipboard.on("success", e => {
      const index = e.trigger?.getAttribute("data-index")
      if (index !== null) {
        copyStates[index] = { copied: true, disabled: true }
        setTimeout(() => {
          copyStates[index] = { copied: false, disabled: false }
        }, 2000)
      }
    })

    clipboard.on("error", e => {
      console.error("Copy failed", e)
    })
  })
})

onBeforeUnmount(() => {
  if (clipboard) clipboard.destroy()
})
</script>

<template>
  <VRow class="align-center justify-space-between mb-1">
    <VCol
      cols="12"
      class="d-flex align-center"
    >
      <div class="d-flex w-100 align-center border-frame">
        <div class="d-flex align-center">
          <VAvatar
            size="35"
            color="success"
            variant="tonal"
            rounded="sm"
            class="mr-2 ml-1"
          >
            <VIcon size="26">
              {{ props.icon }}
            </VIcon>
          </VAvatar>
          <span class="text-h5">{{ props.title }}</span>
          <VTooltip
            v-if="message"
            :text="message"
          >
            <template #activator="{ props: infoProps }">
              <VIcon
                v-bind="infoProps"
                size="18"
                class="ml-1"
              >
                mdi-information-outline
              </VIcon>
            </template>
          </VTooltip>
        </div>
      </div>
    </VCol>
  </VRow>



  <VTabs
    v-model="activeTab"
    class="tabs-no-slide-v v-tabs-pill"
    hide-slider
    density="comfortable"
  >
    <VTab
      v-for="(component, index) in data"
      :key="index"
      :value="index"
      class="custom-tab-gap"
    >
      <div class="d-flex align-center">
        <VIcon class="mr-1 custom-tab-icon">
          mdi-docker
        </VIcon>
        <div class="text-no-transform">
          {{ component.name }}
        </div>
      </div>
    </VTab>
  </VTabs>

  <VWindow
    v-model="activeTab"
    class="mt-2"
  >
    <VWindowItem
      v-for="(component, index) in data"
      :key="index"
      :value="index"
    >
      <div class="json-container">
        <VBtn
          icon
          size="small"
          class="copy-json-btn transparent-btn"
          variant="plain"
          color="default"
          :data-index="index"
          :disabled="copyStates[index]?.disabled"
          :data-clipboard-text="JSON.stringify(component.callData, null, 2)"
        >
          <VIcon style="font-size: 18px">
            mdi-content-copy
          </VIcon>
          <span style="font-size: 12px; vertical-align: middle">
            {{ copyStates[index]?.copied ? "Copied!" : "Copy" }}
          </span>
        </VBtn>

        <div class="json-pretty-wrapper">
          <VueJsonPretty
            :data="component.callData"
            :deep="2"
            show-icon
            :show-line="false"
            virtual
            class="json-pretty-inner"
            :theme="theme === 'dark' ? 'dark' : 'light'"
          />
        </div>
      </div>
    </VWindowItem>
  </VWindow>
</template>

<style scoped>
  .json-pretty-wrapper {
    border: 1px solid #e1e4e8;
    border-radius: 8px;
    overflow: hidden;
    box-sizing: border-box;
    padding: 0;
  }
  .json-pretty-inner {
    height: 100%;
    overflow: auto;
    padding: 8px 8px 12px 8px; /* Extra bottom padding for scroll arrow */
    box-sizing: border-box;
    scrollbar-gutter: stable both-edges; /* Helps on modern browsers */
  }
  .custom-tab-icon {
    font-size: 24px !important;
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    min-height: 24px !important;
    line-height: 1 !important;
  }
  .text-no-transform {
    text-transform: none !important;
  }
  .custom-tab-gap {
    padding: 0 5px;
  }
  .chip-style {
    border-radius: 15px !important;
    font-family: monospace !important;
    font-size: 12px !important;
    padding: 0 8px !important;
    height: 24px !important;
    line-height: 1 !important;
  }
  .border-frame {
    border: 1px solid #ccc;
    border-radius: 8px;
    margin-bottom: 5px;
    padding: 6px;
    height: 54px;
    }
</style>

<!-- Apply border to real Vuetify v-tabs root -->
<style>
  .v-tabs.tabs-no-slide-v {
    border-bottom: none !important;
  }
  .json-container {
    position: relative;
  }

  .copy-json-btn {
    position: absolute;
    top: 8px;
    right: 45px;
    z-index: 10;
    transition: color 0.2s ease;
  }
</style>
