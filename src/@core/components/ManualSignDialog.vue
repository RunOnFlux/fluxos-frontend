<template>
  <VDialog v-model="isOpen" max-width="700" persistent>
    <VCard rounded="xl">
      <VCardTitle class="text-h5 bg-primary d-flex align-center">
        <VIcon class="mr-2" color="white">mdi-draw-pen</VIcon>
        <span class="text-white">{{ t('core.manualSignDialog.title') }}</span>
        <VSpacer />
        <VBtn icon="mdi-close" variant="text" color="white" size="small" @click="handleCancel" />
      </VCardTitle>
      <VCardText class="pa-4">
        <VAlert type="info" variant="tonal" density="compact" class="mb-4">
          {{ t('core.manualSignDialog.instructions') }}
        </VAlert>
        <div class="mb-3">
          <div class="text-subtitle-2 mb-2">{{ t('core.manualSignDialog.messageToSign') }}</div>
          <VTextField
            :model-value="message"
            readonly
            variant="outlined"
            density="compact"
            hide-details
            style="font-family: monospace; font-size: 11px;"
          >
            <template #append-inner>
              <VBtn
                icon="mdi-content-copy"
                size="x-small"
                variant="text"
                color="grey"
                @click="copyMessage"
              />
            </template>
          </VTextField>
        </div>
        <div>
          <div class="text-subtitle-2 mb-2">{{ t('core.manualSignDialog.pasteSignature') }}</div>
          <VTextField
            v-model="localSignature"
            variant="outlined"
            density="compact"
            hide-details
            :placeholder="t('core.manualSignDialog.signaturePlaceholder')"
            style="font-family: monospace; font-size: 11px;"
          />
        </div>
      </VCardText>
      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn variant="flat" color="error" size="small" @click="handleCancel">
          {{ t('core.manualSignDialog.cancel') }}
        </VBtn>
        <VBtn variant="elevated" color="primary" size="small" class="mr-3" @click="handleSubmit">
          {{ t('core.manualSignDialog.submit') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'submit', 'cancel', 'copy'])

const { t } = useI18n()

const isOpen = ref(props.modelValue)
const localSignature = ref('')

watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal
  if (!newVal) {
    // Reset signature when dialog closes
    localSignature.value = ''
  }
})

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
})

function copyMessage() {
  navigator.clipboard.writeText(props.message)
  emit('copy')
}

function handleSubmit() {
  if (!localSignature.value || !localSignature.value.trim()) {
    // Note: validation error handling should be done by parent
    return
  }
  emit('submit', localSignature.value.trim())
  isOpen.value = false
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>
