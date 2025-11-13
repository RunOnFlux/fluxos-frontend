<template>
  <div
    class="d-flex align-center w-100 footer-wrapper"
    :class="{ 'statusbar-hidden': isStatusBarHidden }"
    :style="{
      height: isStatusBarHidden ? '0px' : '100%',
      minHeight: isStatusBarHidden ? '0px' : 'auto',
      paddingBottom: isStatusBarHidden ? '1rem' : '0'
    }"
  >
    <StatusBar style="width: 100%;" />
  </div>
</template>

<script setup>
import StatusBar from "@core/components/StatusBar.vue"
import { ref, onMounted, onBeforeUnmount, watch } from "vue"

const isStatusBarHidden = ref(localStorage.getItem('statusBarHidden') === 'true')

const handleStatusBarToggle = (event) => {
  isStatusBarHidden.value = event.detail.hidden
}

// Apply class to parent footer element and update page content padding
const updateFooterClass = () => {
  const footer = document.querySelector('.layout-footer')
  const pageContent = document.querySelector('.layout-page-content')

  if (footer) {
    if (isStatusBarHidden.value) {
      footer.classList.add('statusbar-hidden')
      if (pageContent) {
        pageContent.style.paddingBlockEnd = '0.25rem'
      }
    } else {
      footer.classList.remove('statusbar-hidden')
      if (pageContent) {
        pageContent.style.paddingBlockEnd = '0.5rem'
      }
    }
  }
}

watch(isStatusBarHidden, updateFooterClass)

onMounted(() => {
  window.addEventListener('statusbar-toggle', handleStatusBarToggle)
  updateFooterClass()
})

onBeforeUnmount(() => {
  window.removeEventListener('statusbar-toggle', handleStatusBarToggle)
})
</script>

<style scoped>
:deep(.layout-footer.statusbar-hidden) {
  padding: 0 !important;
  min-height: 0 !important;
  height: 0 !important;
}
</style>
