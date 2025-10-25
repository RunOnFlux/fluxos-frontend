<!-- ConfirmDialog.vue -->
<template>
  <VDialog
    v-model="isDialogOpen"
    :activator="`#${target}`"
    :width="message ? '500' : '400'"
  >
    <VCard>
      <VCardTitle class="text-h5 bg-primary d-flex align-center">
        <VIcon class="mr-2" color="white">mdi-help-circle-outline</VIcon>
        {{ title || t('core.confirmCustomDialog.confirmation') }}
      </VCardTitle>
      <VCardText class="pa-4">
        <VAlert
          v-if="message"
          :type="alertType"
          variant="tonal"
          density="compact"
        >
          {{ message }}
        </VAlert>
        <div v-else>
          {{ t('core.confirmCustomDialog.areYouSure') }}
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          variant="text"
          color="grey"
          size="small"
          @click="isDialogOpen = false"
        >
          {{ t('core.confirmCustomDialog.cancel') }}
        </VBtn>
        <VBtn
          variant="elevated"
          color="primary"
          size="small"
          @click="confirm"
        >
          {{ confirmButton || t('core.confirmCustomDialog.confirm') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, watch } from "vue"
import { useI18n } from 'vue-i18n'

const props = defineProps({
  target: String,
  confirmButton: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
  alertType: {
    type: String,
    default: "info",
    validator: value => ['info', 'warning', 'error', 'success'].includes(value),
  },
})

const emit = defineEmits(["confirm"])

const { t } = useI18n()

const isDialogOpen = ref(false)

// optional external control via event or store
watch(
  () => props.target,
  () => {
    isDialogOpen.value = false
  },
)

function confirm() {
  isDialogOpen.value = false
  emit("confirm")
}
</script>
