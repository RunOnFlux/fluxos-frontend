<template>
  <VContainer>
    <VCard variant="outlined" class="mt-2">
      <VCardText>
        <div class="d-flex align-center justify-space-between mb-1 flex-wrap gap-2">
          <div class="d-flex align-center">
            <h4 class="text-h6">{{ t('components.fluxDrive.apiKeys.title') }}</h4>
            <VProgressCircular
              v-if="apiKeysLoading"
              indeterminate
              size="20"
              width="2"
              class="ms-3"
            />
          </div>
          <VBtn
            color="primary"
            size="small"
            prepend-icon="tabler-plus"
            :disabled="!hasActiveSubscription || atKeyLimit || apiKeysLoading"
            @click="openCreateDialog"
          >
            {{ t('components.fluxDrive.apiKeys.create') }}
          </VBtn>
        </div>

        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ t('components.fluxDrive.apiKeys.description') }}
          <a href="https://docs.runonflux.com/fluxcloud/fluxdrive/api-reference/" target="_blank" rel="noopener noreferrer">
            {{ t('components.fluxDrive.apiKeys.viewDocs') }}
          </a>
        </p>

        <!--
          This panel also renders for lapsed subscribers (the page shows it for anyone who has
          ever subscribed), so say plainly why creation is unavailable rather than letting the
          bridge reject the attempt with a bare 402. 
        -->
        <VAlert
          v-if="!hasActiveSubscription"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ t('components.fluxDrive.apiKeys.inactiveSubscription') }}
        </VAlert>

        <VAlert
          v-if="loadError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
          closable
          @click:close="loadError = ''"
        >
          {{ loadError }}
        </VAlert>

        <!-- Keys minted by the old CLI have no metadata; offer a single rotate-away action. -->
        <VAlert
          v-if="apiKeysLegacyCount > 0"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <template #title>{{ t('components.fluxDrive.apiKeys.legacyTitle') }}</template>
          <div class="d-flex align-center justify-space-between flex-wrap gap-2">
            <span>{{ t('components.fluxDrive.apiKeys.legacyMessage', { count: apiKeysLegacyCount }) }}</span>
            <VBtn
              size="small"
              variant="tonal"
              color="warning"
              :loading="revokingLegacy"
              @click="confirmRevokeLegacy"
            >
              {{ t('components.fluxDrive.apiKeys.legacyRevoke') }}
            </VBtn>
          </div>
        </VAlert>

        <VAlert
          v-if="atKeyLimit && hasActiveSubscription"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ t('components.fluxDrive.apiKeys.limitReached', { max: apiKeysMax }) }}
        </VAlert>

        <div v-if="!apiKeysLoading && apiKeys.length === 0" class="text-center py-6">
          <VIcon icon="tabler-key-off" size="40" class="text-disabled mb-2" />
          <div class="text-body-2 text-medium-emphasis">
            {{ t('components.fluxDrive.apiKeys.empty') }}
          </div>
        </div>

        <VTable v-else-if="apiKeys.length > 0" density="compact">
          <thead>
            <tr>
              <th>{{ t('components.fluxDrive.apiKeys.colName') }}</th>
              <th>{{ t('components.fluxDrive.apiKeys.colKey') }}</th>
              <th>{{ t('components.fluxDrive.apiKeys.colScopes') }}</th>
              <th>{{ t('components.fluxDrive.apiKeys.colCreated') }}</th>
              <th>{{ t('components.fluxDrive.apiKeys.colLastUsed') }}</th>
              <th class="text-end">{{ t('components.fluxDrive.apiKeys.colActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in apiKeys" :key="key.id">
              <td>{{ key.name }}</td>
              <td><code>{{ key.prefix }}&hellip;</code></td>
              <td>
                <span v-if="isFullAccess(key)" class="text-medium-emphasis">{{ t('components.fluxDrive.apiKeys.fullAccess') }}</span>
                <template v-else>
                  <VChip
                    v-for="scope in key.scopes"
                    :key="scope"
                    size="x-small"
                    label
                    class="me-1"
                  >
                    {{ t(`components.fluxDrive.apiKeys.scope_${scope}`) }}
                  </VChip>
                </template>
              </td>
              <td>{{ formatDate(key.createdAt) }}</td>
              <td>
                <span v-if="key.lastUsedAt">{{ formatDate(key.lastUsedAt) }}</span>
                <span v-else class="text-medium-emphasis">{{ t('components.fluxDrive.apiKeys.never') }}</span>
              </td>
              <td class="text-end">
                <VBtn
                  icon="tabler-trash"
                  size="x-small"
                  variant="text"
                  color="error"
                  :loading="revokingId === key.id"
                  @click="confirmRevoke(key)"
                />
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>

    <!-- Create dialog -->
    <VDialog v-model="showCreateDialog" max-width="480" persistent>
      <VCard>
        <VCardTitle>{{ t('components.fluxDrive.apiKeys.createTitle') }}</VCardTitle>
        <VCardText>
          <VTextField
            v-model="newKeyName"
            :label="t('components.fluxDrive.apiKeys.nameLabel')"
            :hint="t('components.fluxDrive.apiKeys.nameHint')"
            :error-messages="createError"
            maxlength="64"
            counter
            persistent-hint
            autofocus
            @keyup.enter="submitCreate"
          />

          <!-- Granular permissions; hidden against a bridge that doesn't enforce scopes yet. -->
          <div v-if="scopesSupported" class="mt-6">
            <div class="text-body-2 mb-1">{{ t('components.fluxDrive.apiKeys.scopesLabel') }}</div>
            <div class="text-caption text-medium-emphasis mb-1">{{ t('components.fluxDrive.apiKeys.scopesHint') }}</div>
            <VCheckbox
              v-for="scope in ALL_SCOPES"
              :key="scope"
              v-model="newKeyScopes"
              :value="scope"
              :label="t(`components.fluxDrive.apiKeys.scopeDesc_${scope}`)"
              density="compact"
              hide-details
            />
            <div v-if="newKeyScopes.length === 0" class="text-caption text-error mt-1">
              {{ t('components.fluxDrive.apiKeys.scopesRequired') }}
            </div>
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" :disabled="apiKeysCreating" @click="showCreateDialog = false">
            {{ t('components.fluxDrive.apiKeys.cancel') }}
          </VBtn>
          <VBtn color="primary" :loading="apiKeysCreating" @click="submitCreate">
            {{ t('components.fluxDrive.apiKeys.generate') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- One-time reveal. Closing this dialog discards the plaintext permanently. -->
    <VDialog v-model="showRevealDialog" max-width="640" persistent>
      <VCard>
        <VCardTitle>{{ t('components.fluxDrive.apiKeys.revealTitle') }}</VCardTitle>
        <VCardText>
          <VAlert type="warning" variant="tonal" density="compact" class="mb-4">
            {{ t('components.fluxDrive.apiKeys.revealWarning') }}
          </VAlert>

          <div class="text-body-2 text-medium-emphasis mb-1">{{ t('components.fluxDrive.apiKeys.colKey') }}</div>
          <div class="d-flex align-center gap-2 mb-4">
            <code class="reveal-code flex-grow-1">{{ createdKey?.key }}</code>
            <VBtn
              icon="tabler-copy"
              size="small"
              variant="tonal"
              :title="t('components.fluxDrive.apiKeys.copy')"
              @click="copyToClipboard(createdKey?.key)"
            />
          </div>

          <div class="text-body-2 text-medium-emphasis mb-1">{{ t('components.fluxDrive.apiKeys.exampleTitle') }}</div>
          <div class="d-flex align-center gap-2">
            <code class="reveal-code flex-grow-1">{{ curlExample }}</code>
            <VBtn
              icon="tabler-copy"
              size="small"
              variant="tonal"
              :title="t('components.fluxDrive.apiKeys.copy')"
              @click="copyToClipboard(curlExample)"
            />
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="primary" @click="dismissReveal">
            {{ t('components.fluxDrive.apiKeys.savedIt') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Revoke confirmation -->
    <VDialog v-model="showRevokeDialog" max-width="480">
      <VCard>
        <VCardTitle>{{ t('components.fluxDrive.apiKeys.revokeTitle') }}</VCardTitle>
        <VCardText>
          {{ revokeTarget === 'legacy'
            ? t('components.fluxDrive.apiKeys.revokeLegacyConfirm', { count: apiKeysLegacyCount })
            : t('components.fluxDrive.apiKeys.revokeConfirm', { name: revokeTarget?.name ?? '' }) }}
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showRevokeDialog = false">
            {{ t('components.fluxDrive.apiKeys.cancel') }}
          </VBtn>
          <VBtn color="error" :loading="revokingId !== '' || revokingLegacy" @click="performRevoke">
            {{ t('components.fluxDrive.apiKeys.revoke') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VContainer>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFluxDrive } from '@/composables/useFluxDrive'
import { useSnackbar } from '@/composables/useSnackbar'

const { t } = useI18n()
const { showSnackbar } = useSnackbar()

const {
  apiKeys,
  apiKeysLoading,
  apiKeysCreating,
  apiKeysLegacyCount,
  apiKeysMax,
  hasActiveSubscription,
  config,
  fetchApiKeys,
  createApiKey,
  revokeApiKey,
  revokeLegacyApiKeys,
} = useFluxDrive()

// Canonical scope order, mirroring the bridge (helpers/apiKeys.js).
const ALL_SCOPES = ['read', 'write', 'list', 'delete']

const showCreateDialog = ref(false)
const showRevealDialog = ref(false)
const showRevokeDialog = ref(false)
const newKeyName = ref('')
const newKeyScopes = ref([...ALL_SCOPES])
const createdKey = ref(null)
const createError = ref('')
const loadError = ref('')
const revokingId = ref('')
const revokingLegacy = ref(false)
const revokeTarget = ref(null)

// Legacy plaintext keys count against the same cap the bridge enforces.
const atKeyLimit = computed(() => apiKeys.value.length + apiKeysLegacyCount.value >= apiKeysMax.value)

// Only offer scope selection against a bridge that actually enforces scopes; an older bridge
// would silently ignore them and mint a full-access key labelled as restricted.
const scopesSupported = computed(() => Boolean(config.value?.features?.apiKeyScopes))

// Keys minted before scopes existed have no scopes field; the bridge also reports them as
// holding every scope. Either way the honest label is "full access", not four chips.
const isFullAccess = key => !Array.isArray(key.scopes) || ALL_SCOPES.every(s => key.scopes.includes(s))

// The bridge returns a ready-made `Basic` header; recover the FluxID from it so the example
// command is copy-paste runnable rather than a placeholder the user has to edit.
const zelidForExample = computed(() => {
  const header = createdKey.value?.authorizationHeader ?? ''
  try {
    const decoded = atob(header.replace(/^Basic /, ''))
    const sep = decoded.indexOf(':')

    return sep > 0 ? decoded.slice(0, sep) : '<YOUR_FLUXID>'
  } catch {
    return '<YOUR_FLUXID>'
  }
})

const curlExample = computed(() => {
  if (!createdKey.value) return ''

  return `curl -u "${zelidForExample.value}:${createdKey.value.key}" -X POST https://api.fluxdrive.runonflux.io/api/v0/status`
})

const formatDate = ms => {
  if (!ms) return '—'

  return new Date(ms).toLocaleString()
}

const openCreateDialog = () => {
  newKeyName.value = ''
  newKeyScopes.value = [...ALL_SCOPES]
  createError.value = ''
  showCreateDialog.value = true
}

const submitCreate = async () => {
  createError.value = ''
  if (scopesSupported.value && newKeyScopes.value.length === 0) return
  try {
    const result = await createApiKey(newKeyName.value.trim(), scopesSupported.value ? newKeyScopes.value : undefined)

    createdKey.value = result
    showCreateDialog.value = false
    showRevealDialog.value = true
  } catch (error) {
    createError.value = error.message
  }
}

// Drops the plaintext from memory once the user confirms they've stored it.
const dismissReveal = () => {
  createdKey.value = null
  showRevealDialog.value = false
}

const confirmRevoke = key => {
  revokeTarget.value = key
  showRevokeDialog.value = true
}

const confirmRevokeLegacy = () => {
  revokeTarget.value = 'legacy'
  showRevokeDialog.value = true
}

const performRevoke = async () => {
  const target = revokeTarget.value
  try {
    if (target === 'legacy') {
      revokingLegacy.value = true
      await revokeLegacyApiKeys()
    } else {
      revokingId.value = target.id
      await revokeApiKey(target.id)
    }
    showSnackbar(t('components.fluxDrive.apiKeys.revoked'), 'success')
  } catch (error) {
    showSnackbar(error.message, 'error')
  } finally {
    revokingId.value = ''
    revokingLegacy.value = false
    showRevokeDialog.value = false
    revokeTarget.value = null
  }
}

const copyToClipboard = async text => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    showSnackbar(t('components.fluxDrive.apiKeys.copied'), 'success')
  } catch {
    showSnackbar(t('components.fluxDrive.apiKeys.copyFailed'), 'error')
  }
}

// Listing does not require an active subscription, so lapsed users can still review and revoke
// keys they created earlier. Only creation is gated.
onMounted(async () => {
  try {
    await fetchApiKeys()
  } catch (error) {
    loadError.value = error.message
  }
})
</script>

<style scoped>
.reveal-code {
  display: block;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  font-size: 0.8rem;
  word-break: break-all;
}
</style>
