<script setup>
import { loadLocale } from '@/plugins/i18n'
import { useConfigStore } from '@core/stores/config'
import { themeConfig } from '@themeConfig'

const props = defineProps({
  languages: {
    type: Array,
    required: true,
  },
  location: {
    type: null,
    required: false,
    default: 'bottom end',
  },
})

const { locale } = useI18n({ useScope: 'global' })
const configStore = useConfigStore()

// Load locale on language change
const changeLocale = async (newLocale) => {
  await loadLocale(newLocale)
  locale.value = newLocale

  // Sync RTL with language
  const langConfig = themeConfig.app.i18n.langConfig.find(l => l.i18nLang === newLocale)
  if (langConfig) {
    console.log(`[I18n] Changing language to: ${newLocale}, RTL: ${langConfig.isRTL}`)
    configStore.isAppRTL = langConfig.isRTL
  }
}

// Map language codes to flag icons
const getFlagIcon = (i18nLang) => {
  const flagMap = {
    'en': 'flag:us-4x3',
    'zh-CN': 'flag:cn-4x3',
    'hi': 'flag:in-4x3',
    'es': 'flag:es-4x3',
    'ar': 'flag:sa-4x3',
    'fr': 'flag:fr-4x3',
    'bn': 'flag:bd-4x3',
    'pt': 'flag:pt-4x3',
    'ru': 'flag:ru-4x3',
    'id': 'flag:id-4x3',
    'pa': 'flag:in-4x3',
    'de': 'flag:de-4x3',
    'ja': 'flag:jp-4x3',
    'jv': 'flag:id-4x3',
    'mr': 'flag:in-4x3',
    'te': 'flag:in-4x3',
    'tr': 'flag:tr-4x3',
    'vi': 'flag:vn-4x3',
    'ko': 'flag:kr-4x3',
    'ta': 'flag:in-4x3',
    'it': 'flag:it-4x3',
    'pl': 'flag:pl-4x3',
  }
  return flagMap[i18nLang] || 'flag:un-4x3'
}
</script>

<template>
  <IconBtn aria-label="Change language">
    <VIcon icon="tabler-language" />

    <!-- Menu -->
    <VMenu
      activator="parent"
      :location="props.location"
      offset="12px"
      width="175"
    >
      <!-- List -->
      <VList
        :selected="[locale]"
        color="primary"
      >
        <!-- List item -->
        <VListItem
          v-for="lang in props.languages"
          :key="lang.i18nLang"
          :value="lang.i18nLang"
          @click="changeLocale(lang.i18nLang)"
        >
          <template #prepend>
            <VIcon
              :icon="getFlagIcon(lang.i18nLang)"
              size="20"
              class="flag-icon mr-2"
            />
          </template>
          <!-- Language label -->
          <VListItemTitle>
            {{ lang.label }}
          </VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </IconBtn>
</template>

<style scoped>
.flag-icon {
  border-radius: 2px;
}

/* Modern tiny scrollbar */
:deep(.v-list) {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-on-surface), 0.2) transparent;
}

:deep(.v-list)::-webkit-scrollbar {
  width: 6px;
}

:deep(.v-list)::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.v-list)::-webkit-scrollbar-thumb {
  background-color: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 3px;
  transition: background-color 0.2s;
}

:deep(.v-list)::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.3);
}
</style>
