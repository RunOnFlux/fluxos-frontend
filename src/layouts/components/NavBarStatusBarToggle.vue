<template>
  <IconBtn @click="toggleVisibility">
    <VBadge
      dot
      :color="badgeColor"
      :model-value="showBadge"
    >
      <VIcon
        :icon="isHidden ? 'tabler-eye' : 'tabler-eye-off'"
        size="22"
      />
    </VBadge>
  </IconBtn>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

// StatusBar visibility state with localStorage persistence
const isHidden = ref(localStorage.getItem('statusBarHidden') === 'true')
const hasError = ref(false)

// Badge color logic: red when error, green when no error (independent of visibility)
const badgeColor = computed(() => {
  if (hasError.value) {
    return 'error'
  }
  return 'success'
})

// Show badge always (green for OK, red for hidden/error)
const showBadge = computed(() => true)

const toggleVisibility = () => {
  isHidden.value = !isHidden.value
  localStorage.setItem('statusBarHidden', isHidden.value.toString())

  // Trigger a custom event to notify StatusBar component
  window.dispatchEvent(new CustomEvent('statusbar-toggle', { detail: { hidden: isHidden.value } }))
}

// Listen for changes from StatusBar component
const handleStatusBarToggle = (event) => {
  isHidden.value = event.detail.hidden
  if (event.detail.hasError !== undefined) {
    hasError.value = event.detail.hasError
  }
}

window.addEventListener('statusbar-toggle', handleStatusBarToggle)

// Cleanup event listener on component unmount
onBeforeUnmount(() => {
  window.removeEventListener('statusbar-toggle', handleStatusBarToggle)
})
</script>
