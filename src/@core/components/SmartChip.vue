<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    default: 'mdi-hexagon-multiple',
  },
  iconAfterTrue: {
    type: String,
    default: 'mdi-check-circle',
  },
  iconAfterFalse: {
    type: String,
    default: 'mdi-alert-circle',
  },
  iconState: {
    type: [Function, Boolean],
    required: true,
  },
  textOn: {
    type: String,
    default: 'Local Specification',
  },
  textOff: {
    type: String,
    default: 'Global Specification',
  },
  toggleTrueLabel: {
    type: String,
    default: 'LOCAL',
  },
  toggleFalseLabel: {
    type: String,
    default: 'GLOBAL',
  },
  color: {
    type: String,
    default: 'info',
  },
  variant: {
    type: String,
    default: 'tonal',
  },
  rounded: {
    type: String,
    default: 'md',
  },
  className: {
    type: String,
    default: '',
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const isToggled = ref(props.modelValue)

watch(isToggled, val => {
  emit('update:modelValue', val)
})

const displayText = computed(() => (isToggled.value ? props.textOn : props.textOff))

const iconStateValue = computed(() =>
  typeof props.iconState === 'function' ? props.iconState() : props.iconState,
)

const trailingIcon = computed(() => {
  if (!isToggled.value) return null
  
  return iconStateValue.value ? props.iconAfterTrue : props.iconAfterFalse
})

const trailingIconColor = computed(() => {
  if (!isToggled.value) return null
  
  return iconStateValue.value ? 'success' : 'error'
})
</script>

<template>
  <VChip
    :color="color"
    :variant="variant"
    :rounded="rounded"
    class="my-3"
    style="width: 100%; padding-inline: 12px; overflow: hidden;"
    :class="className"
  >
    <div class="chip-grid">
      <!-- Left: icon + text + trailing icon with tooltip -->
      <div class="chip-left">
        <VIcon
          size="22"
          class="mr-2"
        >
          {{ icon }}
        </VIcon>
        <span style="font-size: 18px;">{{ displayText }}</span>
        <VTooltip
          v-if="trailingIcon"
          location="top"
        >
          <template #activator="{ props: trailingIconProps }">
            <VIcon
              size="20"
              class="ml-2"
              :color="trailingIconColor"
              v-bind="trailingIconProps"
            >
              {{ trailingIcon }}
            </VIcon>
          </template>
          <span>
            {{ iconStateValue ? 'Application is synced with global network!' : 'Application does not match global specifications!' }}
          </span>
        </VTooltip>
      </div>
      <!-- Right: toggle buttons -->
      <div class="chip-buttons d-flex align-center">
        <VBtn
          size="x-small"
          :variant="isToggled ? 'flat' : 'outlined'"
          color="primary"
          class="toggle-btn mr-2"
          rounded="pill"
          @click="isToggled = true"
        >
          {{ toggleTrueLabel }}
        </VBtn>
        <VBtn
          size="x-small"
          :variant="!isToggled ? 'flat' : 'outlined'"
          color="primary"
          rounded="pill"
          class="toggle-btn"
          @click="isToggled = false"
        >
          {{ toggleFalseLabel }}
        </VBtn>
      </div>
    </div>
  </VChip>
</template>

<style scoped>
.chip-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.chip-left {
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
}

.chip-buttons :deep(.v-btn) {
  text-transform: none;
  font-weight: 500;
  padding: 0 8px;
  justify-content: center;
}

.toggle-btn {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  line-height: normal !important;
  min-height: 22px !important;
  height: 22px !important;
  align-items: center !important;
  display: inline-flex !important;
}

::v-deep(.v-chip__content) {
  width: 100% !important;
}
</style>
