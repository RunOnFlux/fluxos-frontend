<template>
  <LandingServices />
</template>

<script setup>
import LandingServices from "@/components/LandingServices.vue"
import { useI18n } from "vue-i18n"
import { computed } from "vue"

const { t } = useI18n()

const sections = computed(() => [
  {
    title: t("sections.dashboard.title"),
    icon: "tabler-device-desktop",
    description: t("sections.dashboard.description"),
  },
  {
    title: t("sections.application.title"),
    icon: "mdi-apps",
    description: t("sections.application.description"),
  },
  {
    title: t("sections.administration.title"),
    icon: "mdi-shield-account",
    description: t("sections.administration.description"),
  },
  {
    title: t("sections.fluxXdao.title"),
    icon: "mdi-account-group",
    description: t("sections.fluxXdao.description"),
  },
])
</script>

<style scoped>
/* Adjust card size */
.responsive-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  height: 100%;
}
</style>
