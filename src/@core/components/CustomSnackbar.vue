<template>
  <VSnackbar
    v-model="snackbar.show"
    :color="snackbarColor"
    :location="snackbarLocation"
    variant="flat"
    timeout="4000"
  >
    <VIcon left>
      {{ icon }}
    </VIcon>
    {{ snackbar.text }}
    <template #action="{ attrs }">
      <VBtn
        text
        v-bind="attrs"
        @click="snackbar.show = false"
      >
        Close
      </VBtn>
    </template>
  </VSnackbar>
</template>

<script>
import { computed, ref, watch } from "vue"

export default {
  name: "CustomSnackbar",
  props: {
    variant: {
      type: String,
      default: "success",
    },
    text: {
      type: String,
      default: "",
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
    top: {
      type: Boolean,
      default: false,
    },
    bottom: {
      type: Boolean,
      default: false,
    },
    left: {
      type: Boolean,
      default: false,
    },
    right: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const snackbar = ref({
      show: props.modelValue,
      text: props.text,
    })

    // Sync prop changes to local state
    watch(
      () => props.modelValue,
      val => (snackbar.value.show = val),
    )
    watch(
      () => props.text,
      val => (snackbar.value.text = val),
    )
    watch(
      () => snackbar.value.show,
      val => emit("update:modelValue", val),
    )

    // Icon based on variant
    const icon = computed(() => {
      switch (props.variant) {
      case "success":
        return "mdi-check-circle"
      case "error":
        return "mdi-alert-circle"
      case "info":
        return "mdi-information"
      case "warning":
        return "mdi-alert"
      default:
        return "mdi-check-circle"
      }
    })

    // Theme color based on variant
    const snackbarColor = computed(() => {
      switch (props.variant) {
      case "success":
        return "success"
      case "error":
        return "error"
      case "info":
        return "info"
      case "warning":
        return "warning"
      default:
        return "primary"
      }
    })

    const snackbarLocation = computed(() => {
      if (props.top && props.right) return "top right"
      if (props.top && props.left) return "top left"
      if (props.bottom && props.right) return "bottom right"
      if (props.bottom && props.left) return "bottom left"
      if (props.top) return "top"
      if (props.bottom) return "bottom"

      return "bottom"
    })

    return {
      snackbar,
      icon,
      snackbarColor,
      snackbarLocation,
    }
  },
}
</script>

<style scoped>
/* Optional styling */
</style>
