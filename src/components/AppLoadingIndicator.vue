<script setup>
import { useI18n } from 'vue-i18n'
import { onBeforeUnmount } from 'vue'

const { t } = useI18n()

const bufferValue = ref(20)
const progressValue = ref(10)
const isFallbackState = ref(false)
const interval = ref()
const showProgress = ref(false)

watch([progressValue, isFallbackState], () => {
  if (progressValue.value > 80 && isFallbackState.value) progressValue.value = 82
  startBuffer()
})
function startBuffer() {
  clearInterval(interval.value)
  interval.value = setInterval(() => {
    progressValue.value += Math.random() * (15 - 5) + 5
    bufferValue.value += Math.random() * (15 - 5) + 6
  }, 800)
}

const fallbackHandle = () => {
  showProgress.value = true
  progressValue.value = 10
  isFallbackState.value = true
  startBuffer()
}

const resolveHandle = () => {
  isFallbackState.value = false
  progressValue.value = 100
  setTimeout(() => {
    clearInterval(interval.value)
    progressValue.value = 0
    bufferValue.value = 20
    showProgress.value = false
  }, 300)
}

// Cleanup on unmount to prevent memory leaks
onBeforeUnmount(() => {
  if (interval.value) {
    clearInterval(interval.value)
    interval.value = null
  }
})

defineExpose({
  fallbackHandle,
  resolveHandle,
})
</script>

<template>
  <!-- loading state via #fallback slote -->
  <div
    v-if="showProgress"
    class="position-fixed"
    style="z-index: 9999; inset-block-start: 0; inset-inline: 0 0"
  >
    <VProgressLinear
      v-model="progressValue"
      :buffer-value="bufferValue"
      color="primary"
      height="2"
      bg-color="background"
    />
  </div>
</template>
