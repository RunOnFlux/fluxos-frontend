<template>
  <VRow class="align-center justify-space-between">
    <VCol
      cols="12"
      class="d-flex align-center pb-0"
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
              mdi-information-variant-circle-outline
            </VIcon>
          </VAvatar>
          <span class="text-h5">Deployed Instances</span>
        </div>
      </div>
    </VCol>
  </VRow>
  <VRow>
    <VCol class="pt-0">
      <div>
        <div v-if="masterSlaveApp && masterIp">
          <VRow
            align="center"
            justify="space-between"
            class="mt-1"
          >
            <VCol>
              <VIcon class="mr-1">
                mdi-server-network
              </VIcon>
              <VChip
                color="success"
                size="small"
              >
                Primary Server IP Address
              </VChip>
            </VCol>
            <VChip
              color="success"
              size="small"
              text-color="white"
              class="mx-2 mr-4"
              style="font-family: monospace; font-size: 13px;"
            >
              {{ masterIp }}
            </VChip>
          </VRow>
        </div>
        <Locations
          v-if="instances.data.length > 0 && localAppSpecs" 
          :app-locations="instances.data"
          expanded
          :app-spec="localAppSpecs"
          show-location
          :selected-node="selectedNode"
          class="mt-3"
        />
      </div>
    </VCol>
  </VRow>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

// Props definition
const props = defineProps({
  masterSlaveApp: {
    type: Boolean,
    required: true,
    default: false,
  },
  masterIp: {
    type: [String, null],
    required: true,
    default: '',
  },
  appSpecs: {
    type: Object,
    required: true,
  },
  instances: {
    type: Object,
    required: true,
  },
  selectedNode: {
    type: String,
    default: '',
  },

})

// Local copies of props to avoid mutating props
const localInstances = reactive({ ...props.instances })
const localAppSpecs = reactive({ ...props.appSpecs })

// Watch for changes to props and sync with localInstances and localAppSpecs
watch(() => props.instances, newVal => {
  Object.assign(localInstances, newVal)
}, { deep: true })

watch(() => props.appSpecs, newVal => {
  Object.assign(localAppSpecs, newVal)
}, { deep: true })
</script>

<style scoped>
.border-frame {
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 5px;
  padding: 6px;
  height: 54px;
}
</style>
