<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between bg-primary">
        <div class="d-flex align-center">
          <VIcon color="white" size="24" class="mr-2">mdi-file-import-outline</VIcon>
          <span class="text-h6 text-white">Import {{ type === 'env' ? 'Environment Variables' : 'Commands' }} from JSON</span>
        </div>
        <VBtn
          icon="mdi-close"
          variant="text"
          size="small"
          color="white"
          @click="closeDialog"
        />
      </VCardTitle>

      <VCardText class="pt-6">
        <VAlert
          type="info"
          variant="tonal"
          class="mb-4"
          density="compact"
        >
          <div class="text-body-2">
            <strong>Format:</strong> Paste a JSON array or drag & drop a file
            <template v-if="type === 'env'">
              <br>Example: <code>["KEY=value", "FOO=bar", "PORT=3000"]</code>
            </template>
            <template v-else>
              <br>Example: <code>["npm install", "npm run build", "node server.js"]</code>
            </template>
          </div>
        </VAlert>

        <div
          class="drop-zone"
          :class="{ 'drop-zone-active': isDragging }"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <VTextarea
            v-model="jsonInput"
            placeholder="Paste your JSON array here or drag & drop a file..."
            rows="8"
            variant="outlined"
            density="comfortable"
            color="primary"
            auto-grow
            persistent-placeholder
            :error-messages="errorMessage"
          />
          <div v-if="isDragging" class="drop-overlay">
            <VIcon size="48" color="primary">mdi-file-upload</VIcon>
            <div class="text-h6 mt-2">Drop JSON file here</div>
          </div>
        </div>

        <div class="d-flex align-center justify-center mt-3">
          <VBtn
            variant="outlined"
            color="grey"
            density="comfortable"
            @click="triggerFileInput"
            class="text-none"
          >
            <VIcon size="20" class="mr-2">mdi-folder-open-outline</VIcon>
            Browse
          </VBtn>
          <input
            ref="fileInput"
            type="file"
            accept=".json,.txt,text/plain,application/json"
            style="display: none"
            @change="handleFileSelect"
          />
        </div>
      </VCardText>

      <VCardActions class="px-6 pb-6">
        <VSpacer />
        <VBtn
          color="error"
          variant="tonal"
          density="comfortable"
          @click="closeDialog"
          min-width="100"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          density="comfortable"
          :disabled="!jsonInput.trim()"
          @click="handleImport"
          min-width="100"
        >
          Import
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  type: {
    type: String,
    required: true,
    validator: value => ['env', 'commands'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue', 'import'])

const jsonInput = ref('')
const errorMessage = ref('')
const isDragging = ref(false)
const fileInput = ref(null)

watch(() => props.modelValue, newValue => {
  if (newValue) {
    // Reset on open
    jsonInput.value = ''
    errorMessage.value = ''
    isDragging.value = false
  }
})

const handleDragOver = e => {
  isDragging.value = true
}

const handleDragLeave = e => {
  isDragging.value = false
}

const handleDrop = async e => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    await readFile(files[0])
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async e => {
  const files = e.target.files
  if (files.length > 0) {
    await readFile(files[0])
  }
}

const readFile = async file => {
  if (!file.name.endsWith('.json') && !file.name.endsWith('.txt')) {
    errorMessage.value = 'Please select a valid file'
    
    return
  }

  try {
    const text = await file.text()
    jsonInput.value = text
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = 'Failed to read file: ' + error.message
  }
}

const closeDialog = () => {
  emit('update:modelValue', false)
}

const handleImport = () => {
  errorMessage.value = ''

  try {
    const parsed = JSON.parse(jsonInput.value)

    if (!Array.isArray(parsed)) {
      errorMessage.value = 'Invalid JSON: Expected an array'
      
      return
    }

    if (parsed.length === 0) {
      errorMessage.value = 'Array is empty'
      
      return
    }

    if (props.type === 'env') {
      // Validate environment variables format
      const validEntries = []
      for (const item of parsed) {
        if (typeof item !== 'string' || !item.includes('=')) {
          errorMessage.value = `Invalid format: "${item}" - Expected "KEY=value" format`
          
          return
        }
        const [key, ...rest] = item.split('=')
        const value = rest.join('=')
        if (!key || !value) {
          errorMessage.value = `Invalid entry: "${item}" - Key and value are required`
          
          return
        }
        validEntries.push({ key, value })
      }
      emit('import', validEntries)
    } else {
      // Validate commands
      const validCommands = parsed.filter(cmd => typeof cmd === 'string' && cmd.trim())
      if (validCommands.length === 0) {
        errorMessage.value = 'No valid commands found'
        
        return
      }
      emit('import', validCommands)
    }

    closeDialog()
  } catch (error) {
    errorMessage.value = 'Invalid JSON format: ' + error.message
  }
}
</script>

<style scoped>
.drop-zone {
  position: relative;
}

.drop-zone-active .v-textarea {
  opacity: 0.5;
}

.drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-surface), 0.95);
  border: 2px dashed rgb(var(--v-theme-primary));
  border-radius: 8px;
  pointer-events: none;
}
</style>
