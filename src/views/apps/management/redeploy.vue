<template>
  <div class="d-flex flex-nowrap align-end justify-end">
    <VTooltip :text="t('pages.apps.redeploy.tooltip')">
      <template #activator="{ props: redeployBtnProps }">
        <VBtn
          v-bind="redeployBtnProps"
          :id="`redeploy-installed-app-${row.item.name}`"
          size="small"
          variant="tonal"
          rounded="true"
          color="default"
          icon
        >
          <VIcon size="22">
            mdi-cloud-refresh-variant
          </VIcon>
        </VBtn>
      </template>
    </VTooltip>

    <ConfirmCustomDialog
      :target="`redeploy-installed-app-${row.item.name}`"
      :confirm-button="t('pages.apps.redeploy.confirmButton')"
      @confirm="() => redeployApp(row.item)"
    />
  </div>
</template>

<script setup>
import { useRouter } from "vue-router"
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import qs from "qs"

const props = defineProps({
  row: {
    type: Object,
    required: true,
  },
})

const { t } = useI18n()

const router = useRouter()

function redeployApp(appSpecs, isFromActive = false) {
  console.log('🚀 [REDEPLOY] Starting redeploy with appSpecs:', appSpecs)
  console.log('🚀 [REDEPLOY] Full structure:', JSON.stringify(appSpecs, null, 2))

  const specs = { ...appSpecs }

  const zelidauth = localStorage.getItem("zelidauth")
  const auth = qs.parse(zelidauth)

  if (auth) {
    specs.owner = auth.zelid
  } else if (isFromActive) {
    specs.owner = ""
  }

  console.log('🚀 [REDEPLOY] Processed specs to store:', JSON.stringify(specs, null, 2))

  // Store in sessionStorage temporarily then navigate
  sessionStorage.setItem('redeploySpecs', JSON.stringify({
    appspecs: specs,
    isRedeploy: true,
  }))

  console.log('🚀 [REDEPLOY] Stored in sessionStorage, navigating to apps-register-configure')

  //Navigate to register page
  router.push({ name: 'apps-register-configure' })
}
</script>
