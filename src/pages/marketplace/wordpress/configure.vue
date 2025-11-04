<template>
  <div class="wordpress-marketplace" style="padding: 8px 24px;">
    <!-- Loading State -->
    <LoadingSpinner
      v-if="loadingPlans && !apiError"
      icon="mdi-wordpress"
      :icon-size="56"
      :title="t('pages.marketplace.wordpress.loadingTitle')"
    />

    <!-- Maintenance Mode -->
    <MaintenanceCard
      v-else-if="apiError"
      :title="t('pages.marketplace.wordpress.maintenanceTitle')"
      :subtitle="t('pages.marketplace.wordpress.maintenanceSubtitle')"
      :description="t('pages.marketplace.wordpress.maintenanceDescription')"
      :loading="loadingPlans"
      @retry="loadPlans"
    />

    <VRow v-else class="ma-0">
      <!-- Left Column - Configuration Form -->
      <VCol cols="12" lg="7">
        <VCard>
          <VCardTitle class="d-flex align-center gap-3 bg-primary text-white px-4 py-3">
            <VIcon icon="mdi-wordpress" size="32" />
            <span class="text-h5" style="color: white;">{{ t('pages.marketplace.wordpress.pageTitle') }}</span>
          </VCardTitle>

          <VCardText class="px-6 pt-4 pb-6">
            <!-- DApp Name and Email -->
            <VRow class="mb-n3">
              <VCol cols="12" md="6">
                <label class="text-body-1 font-weight-medium mb-2 d-flex align-center">
                  <VIcon icon="mdi-application-outline" size="20" color="grey" class="mr-2" />
                  <span>{{ t('pages.marketplace.wordpress.form.dappName') }}</span>
                  <VTooltip location="top">
                    <template #activator="{ props }">
                      <VIcon v-bind="props" icon="mdi-information-outline" size="16" color="grey-lighten-1" class="ml-1" />
                    </template>
                    <span>{{ t('pages.marketplace.wordpress.form.dappNameTooltip') }}</span>
                  </VTooltip>
                </label>
                <VTextField
                  v-model="formData.appName"
                  :placeholder="t('pages.marketplace.wordpress.form.dappNamePlaceholder')"
                  density="compact"
                  variant="outlined"
                  :error-messages="errors.appName"
                  @input="errors.appName = ''"
                />
              </VCol>
              <VCol cols="12" md="6">
                <label class="text-body-1 font-weight-medium mb-2 d-flex align-center">
                  <VIcon icon="mdi-email-outline" size="20" color="grey" class="mr-2" />
                  <span>{{ t('pages.marketplace.wordpress.form.email') }}</span>
                  <VTooltip location="top">
                    <template #activator="{ props }">
                      <VIcon v-bind="props" icon="mdi-information-outline" size="16" color="grey-lighten-1" class="ml-1" />
                    </template>
                    <span>{{ t('pages.marketplace.wordpress.form.emailTooltip') }}</span>
                  </VTooltip>
                </label>
                <VTextField
                  v-model="formData.email"
                  :placeholder="t('pages.marketplace.wordpress.form.emailPlaceholder')"
                  density="compact"
                  variant="outlined"
                  type="email"
                  :error-messages="errors.email"
                  @input="errors.email = ''"
                />
              </VCol>
            </VRow>

            <!-- Domain Name and Payment Length -->
            <VRow class="mb-n3">
              <VCol cols="12" md="6">
                <label class="text-body-1 font-weight-medium mb-2 d-flex align-center">
                  <VIcon icon="mdi-web" size="20" color="grey" class="mr-2" />
                  <span>{{ t('pages.marketplace.wordpress.form.domainName') }}</span>
                  <VTooltip location="top">
                    <template #activator="{ props }">
                      <VIcon v-bind="props" icon="mdi-information-outline" size="16" color="grey-lighten-1" class="ml-1" />
                    </template>
                    <span>{{ t('pages.marketplace.wordpress.form.domainNameTooltip') }}</span>
                  </VTooltip>
                </label>
                <VTextField
                  v-model="formData.domainName"
                  :placeholder="t('pages.marketplace.wordpress.form.domainNamePlaceholder')"
                  density="compact"
                  variant="outlined"
                  :error-messages="errors.domainName"
                  @input="errors.domainName = ''"
                />
              </VCol>
              <VCol cols="12" md="6">
                <label class="text-body-1 font-weight-medium mb-2 d-flex align-center">
                  <VIcon icon="mdi-calendar-clock" size="20" color="grey" class="mr-2" />
                  <span>{{ t('pages.marketplace.wordpress.form.subscription') }}</span>
                  <VTooltip location="top">
                    <template #activator="{ props }">
                      <VIcon v-bind="props" icon="mdi-information-outline" size="16" color="grey-lighten-1" class="ml-1" />
                    </template>
                    <span>{{ t('pages.marketplace.wordpress.form.subscriptionTooltip') }}</span>
                  </VTooltip>
                </label>
                <VSelect
                  v-model="formData.paymentDuration"
                  :items="paymentDurations"
                  item-title="title"
                  item-value="months"
                  density="compact"
                  variant="outlined"
                  @update:model-value="updatePrice"
                />
              </VCol>
            </VRow>

            <!-- Whitelist IP Control -->
            <VRow class="mb-n3">
              <VCol cols="12">
                <label class="text-body-1 font-weight-medium mb-2 d-flex align-center">
                  <VIcon icon="mdi-shield-lock-outline" size="20" color="grey" class="mr-2" />
                  <span>{{ t('pages.marketplace.wordpress.form.whitelistIp') }}</span>
                  <VTooltip location="top">
                    <template #activator="{ props }">
                      <VIcon v-bind="props" icon="mdi-information-outline" size="16" color="grey-lighten-1" class="ml-1" />
                    </template>
                    <span>{{ t('pages.marketplace.wordpress.form.whitelistIpLabel') }}</span>
                  </VTooltip>
                </label>
                <div class="d-flex gap-2 align-center">
                  <VTextField
                    v-model="newWhitelistIP"
                    :placeholder="t('pages.marketplace.wordpress.form.whitelistIpPlaceholder')"
                    density="compact"
                    variant="outlined"
                    @keyup.enter="addWhitelistIP"
                  />
                  <VBtn
                    color="primary"
                    size="small"
                    @click="addWhitelistIP"
                  >
                    {{ t('pages.marketplace.wordpress.actions.add') }}
                  </VBtn>
                </div>
                <div v-if="formData.whitelist.length > 0" class="mt-1">
                  <VChip
                    v-for="(ip, index) in formData.whitelist"
                    :key="index"
                    closable
                    class="ma-1"
                    @click:close="removeWhitelistIP(index)"
                  >
                    {{ ip }}
                  </VChip>
                </div>
              </VCol>
            </VRow>

            <!-- Performance Plan -->
            <VRow class="mb-n3">
              <VCol cols="12">
                <label class="text-body-1 font-weight-medium mb-2 d-flex align-center">
                  <VIcon icon="mdi-server" size="20" color="grey" class="mr-2" />
                  <span>{{ t('pages.marketplace.wordpress.form.performancePlan') }}</span>
                  <VTooltip location="top">
                    <template #activator="{ props }">
                      <VIcon v-bind="props" icon="mdi-information-outline" size="16" color="grey-lighten-1" class="ml-1" />
                    </template>
                    <span>{{ t('pages.marketplace.wordpress.form.performancePlanTooltip') }}</span>
                  </VTooltip>
                </label>
                <VSelect
                  v-model="formData.selectedPlan"
                  :items="plans"
                  :loading="loadingPlans"
                  item-title="name"
                  item-value="name"
                  density="compact"
                  variant="outlined"
                  return-object
                  :menu-props="{ maxHeight: 400 }"
                  @update:model-value="updatePrice"
                >
                  <template #item="{ item, props }">
                    <VListItem v-bind="props" class="py-3 plan-item" :title="null">
                      <template #prepend>
                        <VAvatar color="#6366f1" variant="flat" size="48">
                          <VIcon icon="mdi-server" size="28" color="white" />
                        </VAvatar>
                      </template>
                      <VListItemTitle class="font-weight-bold mb-1">
                        {{ item.raw.name }}
                        <VChip size="x-small" color="success" class="ml-2">
                          {{ item.raw.instances }} {{ getInstancesLabel(item.raw.instances) }}
                        </VChip>
                      </VListItemTitle>
                      <VListItemSubtitle class="d-flex align-center gap-3 mb-1">
                        <span class="d-flex align-center gap-1">
                          <VIcon icon="mdi-speedometer" size="16" class="icon-cpu" />
                          {{ (item.raw.cpu[0] + item.raw.cpu[1]).toFixed(1) }} vCPU
                        </span>
                        <span class="d-flex align-center gap-1">
                          <VIcon icon="mdi-memory" size="16" class="icon-ram" />
                          {{ ((item.raw.ram[0] + item.raw.ram[1]) / 1000).toFixed(1) }} GB RAM
                        </span>
                        <span class="d-flex align-center gap-1">
                          <VIcon icon="mdi-harddisk" size="16" class="icon-ssd" />
                          {{ (item.raw.ssd[0] + item.raw.ssd[1]).toFixed(0) }} GB SSD
                        </span>
                      </VListItemSubtitle>
                      <VListItemSubtitle class="text-caption text-medium-emphasis">
                        {{ translateDescription(item.raw) }}
                      </VListItemSubtitle>
                      <template #append>
                        <div class="text-h6 font-weight-bold" style="color: #10b981;">
                          ${{ item.raw.usd.toFixed(2) }}
                          <div class="text-caption text-medium-emphasis font-weight-regular">{{ t('pages.marketplace.wordpress.form.perMonth') }}</div>
                        </div>
                      </template>
                    </VListItem>
                  </template>
                  <template #selection="{ item }">
                    <div class="d-flex align-center gap-1 flex-nowrap text-no-wrap" style="overflow: hidden;">
                      <span class="font-weight-medium text-truncate mr-2">{{ item.raw.name }}</span>
                      <span class="d-flex align-center gap-1 flex-shrink-0">
                        <VIcon icon="mdi-speedometer" size="16" class="icon-cpu" />
                        <span class="text-caption">{{ (item.raw.cpu[0] + item.raw.cpu[1]).toFixed(1) }} vCPU</span>
                      </span>
                      <span class="d-flex align-center gap-1 flex-shrink-0">
                        <VIcon icon="mdi-memory" size="16" class="icon-ram" />
                        <span class="text-caption">{{ ((item.raw.ram[0] + item.raw.ram[1]) / 1000).toFixed(1) }} GB</span>
                      </span>
                      <span class="d-flex align-center gap-1 flex-shrink-0">
                        <VIcon icon="mdi-harddisk" size="16" class="icon-ssd" />
                        <span class="text-caption">{{ (item.raw.ssd[0] + item.raw.ssd[1]).toFixed(0) }} GB</span>
                      </span>
                    </div>
                  </template>
                </VSelect>
              </VCol>
            </VRow>

            <!-- Deployment Location -->
            <VRow class="mb-n3">
              <VCol cols="12">
                <label class="text-body-1 font-weight-medium mb-2 d-flex align-center">
                  <VIcon icon="mdi-map-marker-outline" size="20" color="grey" class="mr-2" />
                  <span>{{ t('pages.marketplace.wordpress.form.deploymentLocation') }}</span>
                  <VTooltip location="top">
                    <template #activator="{ props }">
                      <VIcon v-bind="props" icon="mdi-information-outline" size="16" color="grey-lighten-1" class="ml-1" />
                    </template>
                    <span>{{ t('pages.marketplace.wordpress.form.deploymentLocationTooltip') }}</span>
                  </VTooltip>
                </label>
                <VChipGroup
                  v-model="formData.deploymentLocation"
                  selected-class="location-chip-selected"
                  mandatory
                  column
                >
                  <VChip
                    v-for="location in deploymentLocations"
                    :key="location.continentCode"
                    :value="location.continentCode"
                    variant="outlined"
                    class="location-chip"
                    filter
                  >
                    <VIcon :icon="location.icon" size="18" class="mr-1" />
                    {{ location.title }}
                  </VChip>
                </VChipGroup>
              </VCol>
            </VRow>

            <!-- Information Links -->
            <VRow class="mb-n3">
              <VCol cols="12">
                <div class="d-flex gap-3">
                  <VBtn variant="flat" size="small" color="primary" rounded="lg" @click="showBestPracticesDialog = true">
                    <VIcon start icon="mdi-lightbulb-outline" />
                    Best Practices
                  </VBtn>
                  <VBtn variant="flat" size="small" color="primary" rounded="lg" @click="showFaqDialog = true">
                    <VIcon start icon="mdi-help-circle-outline" />
                    FAQ
                  </VBtn>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Right Column - Order Summary -->
      <VCol cols="12" lg="5">
        <VCard>
          <VCardTitle class="pa-4">
            <span class="text-h6">{{ t('pages.marketplace.wordpress.summary.title') }}</span>
          </VCardTitle>

          <VDivider />

          <VCardText class="pa-6">
            <!-- App Price -->
            <div class="text-center mb-6">
              <div class="text-h4 font-weight-bold mb-2">
                {{ formattedPrice }}
              </div>
              <div v-if="pricing.flux && !loadingPricing" class="d-flex align-center justify-center gap-2">
                <VChip color="primary" variant="flat" size="small">
                  <VIcon start icon="mdi-lightning-bolt" size="16" />
                  {{ pricing.flux.toFixed(2) }} FLUX
                </VChip>
                <VChip v-if="pricing.fluxDiscount > 0" color="success" variant="tonal" size="small">
                  <VIcon start icon="mdi-tag" size="14" />
                  -{{ pricing.fluxDiscount }}%
                </VChip>
              </div>
              <div v-if="loadingPricing" class="text-body-2 text-medium-emphasis">
                {{ t('pages.marketplace.wordpress.actions.calculatingPricing') }}
              </div>
            </div>

            <VDivider class="my-4" />

            <!-- Terms of Service -->
            <VCheckbox
              v-model="acceptedTerms"
              density="compact"
            >
              <template #label>
                <span class="text-body-2">
                  {{ t('pages.marketplace.wordpress.termsOfService.agreement') }}
                  <a href="#" style="text-decoration: underline; color: inherit;" @click.prevent="showTermsDialog = true">
                    {{ t('pages.marketplace.wordpress.termsOfService.link') }}
                  </a>
                </span>
              </template>
            </VCheckbox>

            <!-- Install Button -->
            <VBtn
              block
              color="primary"
              size="large"
              class="mt-4"
              :disabled="!canLaunch"
              @click="openInstallDialog"
            >
              <VIcon start icon="mdi-rocket-launch" />
              {{ t('pages.marketplace.wordpress.summary.install') }}
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Terms Dialog -->
    <VDialog v-model="showTermsDialog" max-width="750" scrollable>
      <VCard style="border-radius: 32px;" id="tos-dialog">
        <VCardTitle class="d-flex align-center justify-space-between px-4 py-2 bg-primary">
          <div class="d-flex align-center gap-2">
            <VIcon icon="mdi-file-document-outline" size="28" color="white" />
            <span class="text-h5" style="color: white;">{{ t('pages.marketplace.wordpress.termsOfService.title') }}</span>
          </div>
          <VBtn
            icon="mdi-close"
            variant="text"
            size="small"
            color="white"
            @click="showTermsDialog = false"
          />
        </VCardTitle>

        <VDivider />

        <VCardText class="px-8 py-4 tos-scroll-area" style="max-height: calc(80vh - 200px); overflow-y: auto;">
          <div class="tos-content" v-html="tosHtmlContent"></div>
        </VCardText>

        <VCardActions class="pa-6 pt-4 justify-center">
          <VBtn
            color="primary"
            variant="flat"
            size="default"
            min-width="100"
            @click="acceptTerms"
          >
            I AGREE
          </VBtn>
          <VBtn
            color="grey"
            variant="flat"
            size="default"
            min-width="100"
            class="ml-4"
            @click="showTermsDialog = false"
          >
            I DISAGREE
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Best Practices Dialog -->
    <VDialog v-model="showBestPracticesDialog" max-width="700" scrollable>
      <VCard style="border-radius: 32px;">
        <VCardTitle class="d-flex align-center justify-space-between px-4 py-2 bg-primary">
          <div class="d-flex align-center gap-2">
            <VIcon icon="mdi-lightbulb-outline" size="28" color="white" />
            <span class="text-h5" style="color: white;">{{ t('pages.marketplace.wordpress.bestPractices.title') }}</span>
          </div>
          <VBtn
            icon="mdi-close"
            variant="text"
            size="small"
            color="white"
            @click="showBestPracticesDialog = false"
          />
        </VCardTitle>

        <VDivider />

        <VCardText class="px-4 px-sm-8 py-6">
          <VList density="comfortable">
            <VListItem class="px-0 mb-2">
              <template #prepend>
                <VIcon icon="mdi-clock-outline" color="info" class="mr-3" />
              </template>
              <VListItemTitle class="text-wrap">{{ t('pages.marketplace.wordpress.setup.stepPropagation') }}</VListItemTitle>
            </VListItem>

            <VListItem class="px-0 mb-2">
              <template #prepend>
                <VIcon icon="mdi-play-circle-outline" color="success" class="mr-3" />
              </template>
              <VListItemTitle class="text-wrap">{{ t('pages.marketplace.wordpress.setup.stepInstall') }}</VListItemTitle>
            </VListItem>

            <VListItem class="px-0 mb-2">
              <template #prepend>
                <VIcon icon="mdi-web" color="info" class="mr-3" />
              </template>
              <VListItemTitle class="text-wrap">{{ t('pages.marketplace.wordpress.setup.stepDomain') }}</VListItemTitle>
            </VListItem>

            <VListItem class="px-0 mb-2">
              <template #prepend>
                <VIcon icon="mdi-shield-off-outline" color="warning" class="mr-3" />
              </template>
              <VListItemTitle class="text-wrap">{{ t('pages.marketplace.wordpress.setup.stepDnsProxy') }}</VListItemTitle>
            </VListItem>

            <VListItem class="px-0 mb-2">
              <template #prepend>
                <VIcon icon="mdi-rocket-launch-outline" color="success" class="mr-3" />
              </template>
              <VListItemTitle class="text-wrap">{{ t('pages.marketplace.wordpress.setup.stepCaching') }}</VListItemTitle>
            </VListItem>

            <VListItem class="px-0 mb-2">
              <template #prepend>
                <VIcon icon="mdi-shield-alert-outline" color="error" class="mr-3" />
              </template>
              <VListItemTitle class="text-wrap">{{ t('pages.marketplace.wordpress.setup.stepSecurity') }}</VListItemTitle>
            </VListItem>

            <VListItem class="px-0 mb-2">
              <template #prepend>
                <VIcon icon="mdi-calendar-refresh" color="warning" class="mr-3" />
              </template>
              <VListItemTitle class="text-wrap">Renew every billing period to prevent data loss</VListItemTitle>
            </VListItem>

            <VListItem class="px-0">
              <template #prepend>
                <VIcon icon="mdi-lock-outline" color="success" class="mr-3" />
              </template>
              <VListItemTitle class="text-wrap">Use strong passwords. Do not use admin/admin or root/password</VListItemTitle>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- FAQ Dialog -->
    <VDialog v-model="showFaqDialog" max-width="850" scrollable>
      <VCard style="border-radius: 32px;">
        <VCardTitle class="d-flex align-center justify-space-between px-4 py-2 bg-primary">
          <div class="d-flex align-center gap-2">
            <VIcon icon="mdi-help-circle-outline" size="28" color="white" />
            <span class="text-h5" style="color: white;">{{ t('pages.marketplace.wordpress.faq.title') }}</span>
          </div>
          <VBtn
            icon="mdi-close"
            variant="text"
            size="small"
            color="white"
            @click="showFaqDialog = false"
          />
        </VCardTitle>

        <VDivider />

        <VCardText class="px-4 px-sm-8 py-6">
          <VList density="comfortable" class="faq-list">
            <VListItem class="px-0 mb-4 align-start">
              <template #prepend>
                <VIcon icon="mdi-application-outline" color="info" size="20" class="mr-2 mr-sm-3 mt-1" />
              </template>
              <div class="d-flex flex-column">
                <VListItemTitle class="font-weight-bold mb-1 text-body-1">{{ t('pages.marketplace.wordpress.summary.dappNameTitle') }}</VListItemTitle>
                <VListItemSubtitle class="text-wrap text-body-2">{{ t('pages.marketplace.wordpress.summary.dappNameHelp') }}</VListItemSubtitle>
              </div>
            </VListItem>

            <VListItem class="px-0 mb-4 align-start">
              <template #prepend>
                <VIcon icon="mdi-email-outline" color="warning" size="20" class="mr-2 mr-sm-3 mt-1" />
              </template>
              <div class="d-flex flex-column">
                <VListItemTitle class="font-weight-bold mb-1 text-body-1">{{ t('pages.marketplace.wordpress.summary.emailTitle') }}</VListItemTitle>
                <VListItemSubtitle class="text-wrap text-body-2">{{ t('pages.marketplace.wordpress.summary.emailHelp') }}</VListItemSubtitle>
              </div>
            </VListItem>

            <VListItem class="px-0 mb-4 align-start">
              <template #prepend>
                <VIcon icon="mdi-web" color="info" size="20" class="mr-2 mr-sm-3 mt-1" />
              </template>
              <div class="d-flex flex-column">
                <VListItemTitle class="font-weight-bold mb-1 text-body-1">{{ t('pages.marketplace.wordpress.summary.domainTitle') }}</VListItemTitle>
                <VListItemSubtitle class="text-wrap text-body-2">{{ t('pages.marketplace.wordpress.summary.domainHelp') }}</VListItemSubtitle>
              </div>
            </VListItem>

            <VListItem class="px-0 mb-4 align-start">
              <template #prepend>
                <VIcon icon="mdi-ip-network" color="warning" size="20" class="mr-2 mr-sm-3 mt-1" />
              </template>
              <div class="d-flex flex-column">
                <VListItemTitle class="font-weight-bold mb-1 text-body-1">{{ t('pages.marketplace.wordpress.summary.whitelistIpTitle') }}</VListItemTitle>
                <VListItemSubtitle class="text-wrap text-body-2">{{ t('pages.marketplace.wordpress.summary.whitelistIpHelp') }}</VListItemSubtitle>
              </div>
            </VListItem>

            <VListItem class="px-0 mb-4 align-start">
              <template #prepend>
                <VIcon icon="mdi-speedometer" color="success" size="20" class="mr-2 mr-sm-3 mt-1" />
              </template>
              <div class="d-flex flex-column">
                <VListItemTitle class="font-weight-bold mb-1 text-body-1">{{ t('pages.marketplace.wordpress.summary.performanceTitle') }}</VListItemTitle>
                <VListItemSubtitle class="text-wrap text-body-2">{{ t('pages.marketplace.wordpress.summary.performanceHelp') }}</VListItemSubtitle>
              </div>
            </VListItem>

            <VListItem class="px-0 align-start">
              <template #prepend>
                <VIcon icon="mdi-map-marker-outline" color="info" size="20" class="mr-2 mr-sm-3 mt-1" />
              </template>
              <div class="d-flex flex-column">
                <VListItemTitle class="font-weight-bold mb-1 text-body-1">{{ t('pages.marketplace.wordpress.summary.deploymentLocationTitle') }}</VListItemTitle>
                <VListItemSubtitle class="text-wrap text-body-2">{{ t('pages.marketplace.wordpress.summary.deploymentLocationHelp') }}</VListItemSubtitle>
              </div>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Install Dialog -->
    <InstallDialog
      v-if="wordpressApp"
      v-model="showInstallDialog"
      :app="wordpressApp"
      :selected-config="selectedConfig"
      is-word-press
      @installed="handleInstalled"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFluxStore } from '@/stores/flux'
import { storeToRefs } from 'pinia'
import { useWordPress } from '@/composables/useWordPress'
import AppsService from '@/services/AppsService'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import MaintenanceCard from '@/components/Marketplace/MaintenanceCard.vue'
import InstallDialog from '@/components/Marketplace/InstallDialog.vue'

const { t, locale, te } = useI18n()
const route = useRoute()

// Helper function to get correct Polish plural form for instances
const getInstancesLabel = count => {
  if (locale.value !== 'pl') {
    return t('pages.marketplace.wordpress.form.instances')
  }

  if (count === 1) {
    return t('pages.marketplace.wordpress.form.instance')
  } else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return t('pages.marketplace.wordpress.form.instancesPlural')
  } else {
    return t('pages.marketplace.wordpress.form.instances')
  }
}

// Helper function to translate plan descriptions
const translateDescription = plan => {
  if (!plan || !plan.name) return plan?.description || ''

  // Use the plan name as the translation key
  const key = `pages.marketplace.wordpress.form.planDescriptions.${plan.name}`

  // Check if translation exists, if not return original description
  return te(key) ? t(key) : plan.description
}

const { fetchPlans, fetchConfig } = useWordPress()

// Initialize flux store for privilege check
const fluxStore = useFluxStore()
const { privilege } = storeToRefs(fluxStore)

// Check if user is logged in using privilege
const isLoggedIn = computed(() => privilege.value !== 'none')

// WordPress configuration from API
const wpConfig = ref(null)

// TOS HTML content
const tosHtmlContent = ref('')

// Generate timestamp once for consistent app naming (not in computed to avoid regeneration)
const appTimestamp = ref(Date.now())

// Generate random password and ports once (not in computed to avoid regeneration)
const generateRandomPassword = (length = 14) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return password
}

const generateRandomPort = () => {
  return 31000 + Math.floor(Math.random() * 9000)
}

const dbPassword = ref(generateRandomPassword(14))
const randomPorts = ref([
  generateRandomPort(),
  generateRandomPort(),
  generateRandomPort(),
  generateRandomPort(),
])

// Form data
const formData = ref({
  appName: '',
  email: '',
  domainName: '',
  paymentDuration: 1,
  whitelist: [],
  selectedPlan: null,
  deploymentLocation: '',
})

// UI state
const errors = ref({
  appName: '',
  email: '',
  domainName: '',
})

const newWhitelistIP = ref('')
const acceptedTerms = ref(false)
const showTermsDialog = ref(false)
const showBestPracticesDialog = ref(false)
const showFaqDialog = ref(false)
const showInstallDialog = ref(false)
const launching = ref(false)
const loadingPlans = ref(false)
const loadingPricing = ref(false)

// Plans
const plans = ref([])

// Payment durations
const paymentDurations = computed(() => [
  { title: t('pages.marketplace.wordpress.durations.oneMonth'), months: 1 },
  { title: t('pages.marketplace.wordpress.durations.twoMonths'), months: 2 },
  { title: t('pages.marketplace.wordpress.durations.threeMonths'), months: 3 },
  { title: t('pages.marketplace.wordpress.durations.sixMonths'), months: 6 },
  { title: t('pages.marketplace.wordpress.durations.twelveMonths'), months: 12 },
])

// Deployment locations
const deploymentLocations = computed(() => [
  { title: t('pages.marketplace.wordpress.locations.global'), continentCode: '', icon: 'mdi-earth' },
  { title: t('pages.marketplace.wordpress.locations.northAmerica'), continentCode: 'NA', icon: 'mdi-map-marker' },
  { title: t('pages.marketplace.wordpress.locations.europe'), continentCode: 'EU', icon: 'mdi-map-marker' },
  { title: t('pages.marketplace.wordpress.locations.asia'), continentCode: 'AS', icon: 'mdi-map-marker' },
  { title: t('pages.marketplace.wordpress.locations.oceania'), continentCode: 'OC', icon: 'mdi-map-marker' },
  { title: t('pages.marketplace.wordpress.locations.southAmerica'), continentCode: 'SA', icon: 'mdi-map-marker' },
  { title: t('pages.marketplace.wordpress.locations.africa'), continentCode: 'AF', icon: 'mdi-map-marker' },
])

// API pricing response with fiat, flux, and discount info
const apiPricing = ref({
  usd: 0,
  flux: 0,
  fluxDiscount: 0,
})

// Computed pricing values
const pricing = computed(() => {
  const monthlyUSD = apiPricing.value.usd || 0
  const monthlyFlux = apiPricing.value.flux || 0
  const totalUSD = monthlyUSD * formData.value.paymentDuration
  const totalFlux = monthlyFlux * formData.value.paymentDuration

  return {
    usd: totalUSD,
    flux: totalFlux,
    fluxDiscount: apiPricing.value.fluxDiscount || 0,
  }
})

const formattedPrice = computed(() => {
  if (!pricing.value.usd) return t('pages.marketplace.wordpress.summary.selectPlan')

  return `$${pricing.value.usd.toFixed(2)} USD`
})

const canLaunch = computed(() => {
  return (
    acceptedTerms.value &&
    formData.value.appName &&
    formData.value.email &&
    formData.value.selectedPlan
  )
})

// Methods
const addWhitelistIP = () => {
  if (newWhitelistIP.value && !formData.value.whitelist.includes(newWhitelistIP.value)) {
    formData.value.whitelist.push(newWhitelistIP.value)
    newWhitelistIP.value = ''
  }
}

const removeWhitelistIP = index => {
  formData.value.whitelist.splice(index, 1)
}

const acceptTerms = () => {
  acceptedTerms.value = true
  showTermsDialog.value = false
}

// WordPress doesn't use selectedConfig - specs are in compose array
const selectedConfig = computed(() => null)

const wordpressApp = computed(() => {
  const plan = formData.value.selectedPlan

  if (!plan) {
    return null
  }

  // WordPress has 3 components: wp, mysql, operator
  // Plan structure: { cpu: [0.8, 0.2, 0.2], ram: [1000, 1000, 700], ssd: [17, 3, 3] }
  const wpCpu = plan.cpu[0]
  const wpRam = plan.ram[0]
  const wpSsd = plan.ssd[0]

  const mysqlCpu = plan.cpu[1]
  const mysqlRam = plan.ram[1]
  const mysqlSsd = plan.ssd[1]

  const opCpu = plan.cpu[2]
  const opRam = plan.ram[2]
  const opSsd = plan.ssd[2]

  // Use the pre-generated values for consistent app spec across all accesses
  const password = dbPassword.value
  const ports = randomPorts.value

  // Environment parameters for WordPress components (timestamp will be added by InstallDialog)
  const wpENVs = [
    `WORDPRESS_DB_HOST=fluxoperator_wordpress:3307`,
    `WORDPRESS_DB_USER=root`,
    `WORDPRESS_DB_PASSWORD=${password}`,
    `WORDPRESS_DB_NAME=wp`,
  ]

  const mysqlENVs = [
    `MYSQL_ROOT_PASSWORD=${password}`,
    `MYSQL_ROOT_HOST=172.0.0.0/255.0.0.0`,
  ]

  const opENVs = [
    `DB_COMPONENT_NAME=fluxmysql_wordpress`,
    `INIT_DB_NAME=wp`,
    `DB_INIT_PASS=${password}`,
    `CLIENT_APPNAME=wordpress`,
    `DB_APPNAME=wordpress`,
    `API_PORT=${ports[2]}`,
    `DB_PORT=${ports[1]}`,
    ...formData.value.whitelist.map(e => `WHITELIST=${e}`),
  ]

  const compose = [
    {
      name: 'wp',
      description: 'wp',
      repotag: 'runonflux/wp-nginx:latest',
      ports: [ports[0]],
      containerPorts: [80],
      domains: [formData.value.domainName || ''],
      environmentParameters: wpENVs,
      commands: [],
      containerData: 'r:/var/www/html/',
      cpu: wpCpu,
      ram: wpRam,
      hdd: wpSsd,
      tiered: false,
    },
    {
      name: 'mysql',
      description: 'mysql',
      repotag: 'mysql:8.3.0',
      ports: [],
      containerPorts: [],
      domains: [],
      environmentParameters: mysqlENVs,
      commands: ['--disable-log-bin'],
      containerData: '/var/lib/mysql',
      cpu: mysqlCpu,
      ram: mysqlRam,
      hdd: mysqlSsd,
      tiered: false,
    },
    {
      name: 'operator',
      description: 'operator',
      repotag: 'runonflux/shared-db:latest',
      ports: [ports[1], ports[2], ports[3]],
      containerPorts: [3307, 7071, 8008],
      domains: ['', '', ''],
      environmentParameters: opENVs,
      commands: [],
      containerData: 's:/app/dumps',
      cpu: opCpu,
      ram: opRam,
      hdd: opSsd,
      tiered: false,
    },
  ]

  // Extract component versions from repotags for deployment display
  const componentVersions = compose.map(comp => ({
    name: comp.name,
    version: comp.repotag.split(':')[1] || 'latest',
    repotag: comp.repotag,
  }))

  return {
    name: 'wordpress',
    displayName: formData.value.appName || 'WordPress',
    description: 'WordPress on Flux',
    version: 8,
    owner: '1CbErtneaX2QVyUfwU7JGB7VzvPgrgc3uC', // Dummy for now
    compose: compose,
    instances: plan.instances || 3,
    geolocation: formData.value.deploymentLocation ? [`ac${formData.value.deploymentLocation}`] : [],
    tiered: false,
    expire: 88000 * formData.value.paymentDuration, // Expire based on subscription months (post-fork: 88000 blocks/month)
    contacts: formData.value.email ? [formData.value.email] : [],
    price: plan.usd || 0, // Monthly plan price in USD
    subscriptionMonths: formData.value.paymentDuration, // Add subscription months for InstallDialog
    fluxPrice: apiPricing.value.flux || 0, // Monthly Flux price from API
    fluxDiscount: apiPricing.value.fluxDiscount || 0, // Flux discount percentage
    planName: plan.name || 'Standard', // Plan name for header title
    uploadEnvToStorage: true, // Flag to indicate env vars should be uploaded to Flux Storage
    componentVersions: componentVersions, // UI only - component versions for deployment display (not sent to API)
  }
})

const openInstallDialog = () => {
  if (!canLaunch.value) return
  showInstallDialog.value = true
}

const handleInstalled = () => {
  showInstallDialog.value = false
}

const launchWordPress = async () => {
  if (!canLaunch.value) return

  launching.value = true

  try {
    // Build geolocation array
    const geolocation = formData.value.deploymentLocation
      ? [`ac${formData.value.deploymentLocation}`]
      : []

    const payload = {
      name: formData.value.appName,
      email: formData.value.email,
      domain: formData.value.domainName || '',
      plan: formData.value.selectedPlan.name,
      duration: formData.value.paymentDuration,
      whitelist: formData.value.whitelist,
      geolocation: geolocation,
    }

    // TODO: Call the WordPress API endpoint
    // const response = await addWordPressApp(payload)

    // For now, just log the payload
    alert(t('pages.marketplace.wordpress.errors.launchNotImplemented'))

  } catch (error) {
    console.error('Failed to launch WordPress:', error)
    alert(t('pages.marketplace.wordpress.errors.launchFailed'))
  } finally {
    launching.value = false
  }
}

// Update pricing - FluxCloud approach: multiplier-based calculation
const updatePrice = async () => {
  if (!formData.value.selectedPlan) {
    apiPricing.value = { usd: 0, flux: 0, fluxDiscount: 0 }
    
    return
  }

  loadingPricing.value = true

  try {
    const plan = formData.value.selectedPlan

    // Get owner from zelidauth (same as Games marketplace)
    // Use dummy zelid for pricing if user not logged in
    let owner = '1CbErtneaX2QVyUfwU7JGB7VzvQ9PWNAIM'
    try {
      const zelidauth = localStorage.getItem('zelidauth')
      if (zelidauth) {
        const authData = zelidauth.includes('zelid=')
          ? Object.fromEntries(new URLSearchParams(zelidauth))
          : JSON.parse(zelidauth)
        owner = authData.zelid || authData.ZelID || '1CbErtneaX2QVyUfwU7JGB7VzvQ9PWNAIM'
      }
    } catch (e) {
      console.warn('Could not parse zelidauth for owner:', e)
    }

    // Generate WordPress app name with timestamp (FluxCloud pattern)
    const timestamp = Date.now()
    const wpName = `wordpress${timestamp}`

    // Simple app spec for pricing calculation (same structure as cost calculator)
    const appSpec = {
      version: 8,
      name: wpName,
      description: 'WordPress on Flux',
      owner: owner,
      compose: [{
        name: 'wp',
        description: 'WordPress',
        repotag: 'runonflux/wp-nginx:latest',
        ports: [80],
        containerPorts: [80],
        domains: [''],
        environmentParameters: [''],
        commands: [''],
        containerData: '/tmp',
        cpu: plan.cpu[0] + plan.cpu[1] + plan.cpu[2],
        ram: plan.ram[0] + plan.ram[1] + plan.ram[2],
        hdd: plan.ssd[0] + plan.ssd[1] + plan.ssd[2],
        tiered: false,
      }],
      instances: plan.instances,
      expire: 88000, // Post-fork: 88000 blocks = 1 month
      contacts: [''],
      geolocation: formData.value.deploymentLocation ? [`ac${formData.value.deploymentLocation}`] : [''],
      nodes: [],
      staticip: false,
      enterprise: '',
    }

    const response = await AppsService.appPriceUSDandFlux(appSpec)

    if (response.data && response.data.status === 'success') {
      // Calculate Flux price based on plan's fixed USD price (matching FluxCloud)
      // FluxCloud: multiplier = plan.usd / apiUsd; flux = apiFlux * multiplier
      const apiCalculatedUsd = response.data.data.usd || 0
      const apiFlux = response.data.data.flux || 0

      // Calculate multiplier to adjust API's Flux to match our fixed USD price
      const multiplier = apiCalculatedUsd > 0 ? (plan.usd / apiCalculatedUsd) : 0

      // Apply multiplier to API's Flux price
      const correctedFlux = apiFlux * multiplier

      apiPricing.value = {
        usd: plan.usd, // Always use plan's fixed USD price
        flux: correctedFlux, // Flux adjusted with multiplier
        fluxDiscount: response.data.data.fluxDiscount || 0,
      }
    } else {
      console.error('API pricing request failed:', response.data)

      // Fallback
      apiPricing.value = {
        usd: plan.usd,
        flux: 0,
        fluxDiscount: 0,
      }
    }
  } catch (error) {
    console.error('Error fetching API pricing:', error)

    // Fallback
    const plan = formData.value.selectedPlan
    apiPricing.value = {
      usd: plan.usd,
      flux: 0,
      fluxDiscount: 0,
    }
  } finally {
    loadingPricing.value = false
  }
}

const apiError = ref(false)

const loadPlans = async () => {
  loadingPlans.value = true
  apiError.value = false
  try {
    const response = await fetchPlans()
    plans.value = response

    // Check for pre-selected plan from query params
    const planNameFromQuery = route.query.plan
    let selectedPlan = null

    if (planNameFromQuery) {
      // Try to find the plan by name from query
      selectedPlan = plans.value.find(p => p.name === planNameFromQuery)
    }

    // If no plan from query or plan not found, select default plan
    if (!selectedPlan) {
      selectedPlan = plans.value.find(p => p.isDefault)
    }

    if (selectedPlan) {
      formData.value.selectedPlan = selectedPlan
      updatePrice()
    }
  } catch (error) {
    console.error('Failed to load plans:', error)
    apiError.value = true
  } finally {
    loadingPlans.value = false
  }
}

// Load TOS HTML content
const loadTOS = async () => {
  try {
    const response = await fetch('/html/wordpress/tos.html')
    let html = await response.text()

    // Replace all "color: black" and "color:black" with current text color
    html = html.replace(/color:\s*black/gi, 'color: inherit')
    html = html.replace(/color:\s*#000000/gi, 'color: inherit')
    html = html.replace(/color:\s*rgb\(0,\s*0,\s*0\)/gi, 'color: inherit')

    tosHtmlContent.value = html
  } catch (error) {
    console.error('Failed to load TOS:', error)
    tosHtmlContent.value = `<p>${t('pages.marketplace.wordpress.errors.tosLoadFailed')} <a href="https://runonflux.io/terms" target="_blank">https://runonflux.io/terms</a></p>`
  }
}

onMounted(() => {
  loadPlans()
  loadTOS()
})
</script>

<style>
/* Global styles for radio buttons - unscoped to ensure they apply */
.v-selection-control-group--inline .v-label {
  font-size: 0.75rem !important;
}

/* Modern location chip styles */
.location-chip {
  font-weight: 500;
  transition: all 0.2s ease;
}

.location-chip-selected {
  background-color: #6366f1 !important;
  color: white !important;
  border-color: #6366f1 !important;
}

.location-chip-selected .v-icon {
  color: white !important;
}

/* TOS content styling - override inline styles with !important */
.tos-content,
.tos-content *,
.tos-content h1,
.tos-content .h1,
.tos-content p,
.tos-content .p,
.tos-content li,
.tos-content .li,
.tos-content span,
.tos-content .s2,
.tos-content div,
.tos-content b,
.tos-content strong,
.tos-content i,
.tos-content em,
.tos-content ol,
.tos-content ul {
  color: rgba(255, 255, 255, 0.95) !important;
}

.tos-content .h1 {
  font-size: 14pt !important;
}

.tos-content a,
.tos-content .a {
  color: #64b5f6 !important;
  text-decoration: underline !important;
}

/* Override list item pseudo-elements colors */
.tos-content li::before {
  color: rgba(255, 255, 255, 0.95) !important;
}

/* Modern scrollbar for TOS dialog - ID selector */
#tos-dialog .tos-scroll-area::-webkit-scrollbar {
  width: 12px !important;
  height: 12px !important;
}

#tos-dialog .tos-scroll-area::-webkit-scrollbar-track {
  background: rgba(99, 102, 241, 0.1) !important;
  border-radius: 6px !important;
}

/* Maintenance page styles */
.maintenance-card {
  border-radius: 32px !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12),
              0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  transform-style: preserve-3d;
}

.loader-card {
  border-radius: 32px !important;
  border: none !important;
  box-shadow: none !important;
}

.maintenance-avatar {
  background: rgba(245, 158, 11, 0.15) !important;
  position: relative;
  animation: float-move 3s ease-in-out infinite !important;
}

.maintenance-avatar .v-icon {
  filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.6))
          drop-shadow(0 0 40px rgba(245, 158, 11, 0.4))
          drop-shadow(0 0 60px rgba(245, 158, 11, 0.2));
  animation: icon-glow 2s ease-in-out infinite;
}

@keyframes icon-glow {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.6))
            drop-shadow(0 0 40px rgba(245, 158, 11, 0.4))
            drop-shadow(0 0 60px rgba(245, 158, 11, 0.2));
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(245, 158, 11, 0.8))
            drop-shadow(0 0 60px rgba(245, 158, 11, 0.6))
            drop-shadow(0 0 90px rgba(245, 158, 11, 0.3));
  }
}

@keyframes float-move {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

.maintenance-title {
  letter-spacing: -0.5px;
  line-height: 1.2;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.7));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 20px rgba(255, 255, 255, 0.1);
}

.maintenance-text-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px 32px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.maintenance-text-box-secondary {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px 28px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  backdrop-filter: blur(8px);
}

.maintenance-subtitle {
  opacity: 0.95;
  line-height: 1.6;
  margin: 0;
}

.maintenance-description {
  opacity: 0.75;
  margin: 0;
}

.maintenance-btn {
  border-radius: 12px !important;
  padding: 12px 32px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35),
              0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  transition: all 0.3s ease !important;
}

.maintenance-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.45),
              0 0 0 1px rgba(255, 255, 255, 0.15) inset !important;
}

#tos-dialog .tos-scroll-area::-webkit-scrollbar-thumb {
  background: #9e9e9e !important;
  border-radius: 6px !important;
  border: 2px solid rgba(0, 0, 0, 0.1) !important;
}

#tos-dialog .tos-scroll-area::-webkit-scrollbar-thumb:hover {
  background: #757575 !important;
}

/* Firefox scrollbar */
#tos-dialog .tos-scroll-area {
  scrollbar-width: thin !important;
  scrollbar-color: #9e9e9e rgba(158, 158, 158, 0.1) !important;
}
</style>

<style scoped>
.wordpress-marketplace {
  max-width: 1400px;
  margin: 0 auto;
}

/* Deep selector for scrollbar */
:deep(.tos-scroll-area)::-webkit-scrollbar {
  width: 12px !important;
}

:deep(.tos-scroll-area)::-webkit-scrollbar-track {
  background: rgba(158, 158, 158, 0.1) !important;
  border-radius: 6px !important;
}

:deep(.tos-scroll-area)::-webkit-scrollbar-thumb {
  background: #9e9e9e !important;
  border-radius: 6px !important;
}

:deep(.tos-scroll-area)::-webkit-scrollbar-thumb:hover {
  background: #757575 !important;
}

:deep(.tos-scroll-area) {
  scrollbar-width: thin !important;
  scrollbar-color: #9e9e9e rgba(158, 158, 158, 0.1) !important;
}
</style>

<style>
/* Colorful resource icons */
.icon-cpu {
  color: #f97316 !important; /* Orange */
}

.icon-ram {
  color: #06b6d4 !important; /* Cyan */
}

.icon-ssd {
  color: #eab308 !important; /* Yellow/Amber */
}

/* Override VSelect active item background - darker shade */
.plan-item.v-list-item--active:not(.v-list-item--disabled) {
  background-color: rgba(0, 0, 0, 0.15) !important;
}

.plan-item.v-list-item--active:not(.v-list-item--disabled):hover {
  background-color: rgba(0, 0, 0, 0.18) !important;
}

.plan-item:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

/* Prevent text and icon color change on active - keep same as non-selected */
.plan-item.v-list-item--active .v-list-item-title,
.plan-item.v-list-item--active .v-list-item-subtitle,
.plan-item.v-list-item--active .v-list-item__content,
.plan-item.v-list-item--active .v-list-item-title *,
.plan-item.v-list-item--active .v-list-item-subtitle * {
  color: inherit !important;
}

.plan-item.v-list-item--active .v-icon {
  opacity: 1 !important;
}

/* Ensure active state doesn't add any color overlay */
.plan-item.v-list-item--active::before {
  opacity: 0 !important;
}

/* Force override Vuetify's default active text color */
.v-list-item--active.plan-item > .v-list-item__content > .v-list-item-title {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
}

.v-list-item--active.plan-item > .v-list-item__content > .v-list-item-subtitle {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)) !important;
}

/* Force dropdown menu to open below the select input */
:deep(.v-overlay.v-menu) {
  top: auto !important;
  bottom: auto !important;
}

/* Smaller radio button labels */
.v-radio-group--inline .v-radio {
  font-size: 0.75rem !important;
}

.v-radio-group--inline .v-label {
  font-size: 0.75rem !important;
}
</style>
