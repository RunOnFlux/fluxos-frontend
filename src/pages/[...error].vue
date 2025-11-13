<script setup>
import { useI18n } from 'vue-i18n'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import { useSEONoIndex } from '@/composables/useSEO'
import misc404 from '@images/pages/404.png'
import miscMaskDark from '@images/pages/misc-mask-dark.png'
import miscMaskLight from '@images/pages/misc-mask-light.png'

const { t } = useI18n()
const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)

// Prevent indexing of 404 error pages
useSEONoIndex()

definePage({
  alias: '/pages/misc/not-found/:error(.*)',
  meta: {
    layout: 'blank',
    public: true,
  },
})
</script>

<template>
  <div class="misc-wrapper">
    <ErrorHeader
      status-code="404"
      :title="t('pages.error.pageNotFoundTitle')"
      :description="t('pages.error.pageNotFoundDescription')"
    />

    <VBtn
      to="/"
      class="mb-11"
    >
      {{ t('pages.error.backToHome') }}
    </VBtn>

    <!-- 👉 Image -->
    <div class="misc-avatar w-100 text-center">
      <VImg
        :src="misc404"
        :alt="t('pages.error.error404Alt')"
        :max-height="$vuetify.display.smAndDown ? 350 : 500"
        class="mx-auto"
      />
    </div>

    <img
      class="misc-footer-img d-none d-md-block"
      :src="authThemeMask"
      :alt="t('pages.error.footerImageAlt')"
      height="320"
      loading="lazy"
    >
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/misc.scss";
</style>
