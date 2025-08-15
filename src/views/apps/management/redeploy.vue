<template>
  <div class="d-flex flex-nowrap align-end justify-end">
    <VTooltip text="Redeploy">
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
      confirm-button="Redeploy"
      @confirm="() => redeployApp(row.item)"
    />
  </div>
</template>

<script setup>
import { useRouter } from "vue-router"
import { ref } from "vue"
import qs from "qs"

const props = defineProps({
  row: {
    type: Object,
    required: true,
  },
})

const router = useRouter()

function redeployApp(appSpecs, isFromActive = false) {
  const specs = { ...appSpecs }

  if (isFromActive) {
    specs.name += "XXX"
    specs.name += Date.now().toString().slice(-5)
  }

  const zelidauth = localStorage.getItem("zelidauth")
  const auth = qs.parse(zelidauth)

  if (auth) {
    specs.owner = auth.zelid
  } else if (isFromActive) {
    specs.owner = ""
  }

  router.replace({
    name: "apps-registerapp",
    params: { appspecs: JSON.stringify(specs) },
  })
}
</script>
