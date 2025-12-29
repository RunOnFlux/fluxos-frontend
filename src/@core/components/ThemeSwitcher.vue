<script setup>
import { useConfigStore } from '@core/stores/config'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  themes: {
    type: Array,
    required: true,
  },
})

const configStore = useConfigStore()
const selectedItem = ref([configStore.theme])
const { t } = useI18n()

// Update icon if theme is changed from other sources
watch(() => configStore.theme, () => {
  selectedItem.value = [configStore.theme]
}, { deep: true })
</script>

<template>
  <IconBtn
    color="rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity))"
    :aria-label="t('common.theme.switchTheme')"
  >
    <VIcon :icon="props.themes.find(t => t.name === configStore.theme)?.icon" />
    <VMenu
      activator="parent"
      offset="12px"
      :width="180"
    >
      <VList
        v-model:selected="selectedItem"
        mandatory
      >
        <VListItem
          v-for="{ name, icon } in props.themes"
          :key="name"
          :value="name"
          :prepend-icon="icon"
          color="primary"
          @click="() => { configStore.theme = name }"
        >
          <VListItemTitle class="text-capitalize">
            {{ t(`common.theme.${name}`) }}
          </VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </IconBtn>
</template>
