<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import miscMaskDark from '@images/pages/misc-mask-dark.png'
import miscMaskLight from '@images/pages/misc-mask-light.png'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

const { t } = useI18n()
const router = useRouter()

definePage({
  alias: '/pages/misc/not-authorized',
  meta: {
    layout: 'blank',
    public: true,
  },
})

const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="misc-wrapper">
    <ErrorHeader
      status-code="401"
      :title="t('pages.unauthorized.title')"
      :description="t('pages.unauthorized.description')"
    />

    <VBtn
      class="mb-11"
      style="z-index: 9999; position: relative; pointer-events: auto;"
      @click="goHome"
    >
      {{ t('pages.unauthorized.backToHome') }}
    </VBtn>

    <!-- 👉 Image -->
    <!--
      <div class="misc-avatar w-100 text-center">
      <VImg
      :src="pages401"
      alt="not autorized"
      :max-height="$vuetify.display.smAndDown ? 350 : 500"
      class="mx-auto"
      />
      </div>
    -->

    <img
      class="misc-footer-img d-none d-md-block"
      :src="authThemeMask"
      alt="misc-footer-img"
      height="320"
    >
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/misc.scss";
</style>
