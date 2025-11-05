<template>
  <VCard flat>
    <!-- Title -->
    <VRow class="align-center justify-space-between mb-2">
      <VCol cols="12" class="d-flex align-center">
        <div class="d-flex w-100 align-center justify-space-between border-frame">
          <div class="d-flex align-center">
            <VAvatar
              size="35"
              color="success"
              variant="tonal"
              rounded="sm"
              class="mr-2 ml-1"
            >
              <VIcon size="26">{{ props.newApp ? 'mdi-package-variant-plus' : 'mdi-account-cog' }}</VIcon>
            </VAvatar>
            <span class="border-frame-title">{{ props.newApp ? t('core.subscriptionManager.registerNewApplication') : t('core.subscriptionManager.title') }}</span>
          </div>

          <!-- Right side buttons -->
          <div class="d-flex align-center gap-4">
            <!-- Upgrade to Latest Application Specification Button (only for V3-V7 apps, shown for redeploy) -->
            <VTooltip v-if="props.isRedeploy && specVersion >= 3 && specVersion < LATEST_SPEC_VERSION" location="top">
              <template #activator="{ props: tooltipProps }">
                <VBtn
                  v-bind="tooltipProps"
                  icon
                  color="warning"
                  variant="tonal"
                  density="comfortable"
                  class="import-glow-btn border-frame-btn"
                  @click="openConversionDialog"
                  :loading="isConverting"
                  :disabled="isConverting"
                >
                  <VIcon size="26">mdi-upload</VIcon>
                </VBtn>
              </template>
              <span>{{ t('core.subscriptionManager.upgradeToLatest') }}</span>
            </VTooltip>

            <!-- Import Spec Button (only for new apps) -->
            <VTooltip v-if="props.newApp" location="top">
              <template #activator="{ props: tooltipProps }">
                <VBtn
                  v-bind="tooltipProps"
                  icon
                  color="success"
                  variant="tonal"
                  density="comfortable"
                  class="import-glow-btn border-frame-btn"
                  @click="showSpecImportDialog = true"
                >
                  <VIcon size="22">mdi-file-import</VIcon>
                </VBtn>
              </template>
              <span>{{ t('core.subscriptionManager.importSpec') }}</span>
            </VTooltip>
          </div>
        </div>
      </VCol>
    </VRow>

    <!-- Management Action Selector (only for existing apps) -->
    <div v-if="!props.newApp && tab !== 99 && tab !== 100" class="mb-2" style="margin-top: -8px;">
      <VBtnToggle
        v-model="managementAction"
        mandatory
        rounded="lg"
        color="primary"
        variant="flat"
        divided
        density="compact"
        class="d-flex flex-wrap ga-1"
      >
        <VBtn value="renewal" class="flex-grow-1" size="large">
          <VIcon start size="22">mdi-refresh</VIcon>
          {{ t('core.subscriptionManager.renewalAction') }}
        </VBtn>
        <VBtn value="update" class="flex-grow-1" size="large">
          <VIcon start size="22">mdi-pencil</VIcon>
          {{ t('core.subscriptionManager.updateAction') }}
        </VBtn>
        <VBtn v-if="versionFlags.supportsExpire" value="cancel" class="flex-grow-1" size="large">
          <VIcon start size="22">mdi-cancel</VIcon>
          {{ t('core.subscriptionManager.cancelAction') }}
        </VBtn>
      </VBtnToggle>
    </div>

    <!-- Tabs -->
    <div v-if="props.newApp || managementAction === 'update'" class="d-flex align-center justify-space-between flex-wrap gap-4 tabs-container-overflow mt-6">
      <!-- Tabs with Validate button inside on mobile -->
      <div class="d-flex flex-grow-1 min-w-0 align-center tabs-inner-overflow" :class="$vuetify.display.xs ? 'gap-1' : ''">
        <VTabs
          v-model="tab"
          start
          density="comfortable"
          class="v-tabs-pill mobile-scrollable-tabs"
        >
          <VTab
            v-for="(item, index) in tabItems"
            :key="index"
            :value="item.value"
            class="mobile-circle-tab mx-1"
          >
            <VTooltip v-if="$vuetify.display.xs" location="top" activator="parent">
              {{ item.label }}
            </VTooltip>
            <div class="d-flex align-center tab-content">
              <VIcon
                :style="{
                  fontSize: '22px !important',
                  height: '22px !important',
                  width: '22px !important',
                  marginRight: $vuetify.display.xs ? '0' : '4px'
                }"
              >
                {{ item.icon }}
              </VIcon>
              <span class="d-none d-sm-inline">{{ item.label }}</span>
            </div>
          </VTab>

          <!-- Validate & Register Button - Inside tabs row on mobile -->
          <VTooltip v-if="$vuetify.display.xs" location="top">
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                icon
                color="success"
                variant="tonal"
                class="mobile-circle-tab review-glow-btn mx-1"
                style="width: 44px !important; height: 44px !important;"
                @click="tab = 99"
                :disabled="tab !== 2"
              >
                <VIcon
                  :style="{
                    fontSize: '22px !important',
                    height: '22px !important',
                    width: '22px !important'
                  }"
                >
                  mdi-check-decagram
                </VIcon>
              </VBtn>
            </template>
            <span v-if="props.newApp">{{ t('core.subscriptionManager.reviewAndSign') }}</span>
            <span v-else-if="managementAction === 'renewal'">{{ t('core.subscriptionManager.reviewAndSign') }}</span>
            <span v-else-if="managementAction === 'update'">{{ t('core.subscriptionManager.updateAction') }}</span>
          </VTooltip>
        </VTabs>
      </div>

      <!-- Button: opens its own VWindowItem - Desktop only -->
      <VTooltip location="top" max-width="200">
        <template #activator="{ props: tooltipProps }">
          <VBtn
            v-bind="tooltipProps"
            v-if="!$vuetify.display.xs"
            color="success"
            variant="tonal"
            class="ml-2 review-glow-btn"
            style="margin-right: 12px;"
            @click="tab = 99"
            :disabled="tab !== 3"
          >
            <VIcon size="24" class="mr-1">mdi-check-decagram</VIcon>
            <span v-if="props.newApp">{{ t('core.subscriptionManager.review') }}</span>
            <span v-else-if="managementAction === 'renewal'">{{ t('core.subscriptionManager.review') }}</span>
            <span v-else-if="managementAction === 'update'">{{ t('core.subscriptionManager.updateAction') }}</span>
          </VBtn>
        </template>
        <span>{{ t('core.subscriptionManager.reviewTooltip') }}</span>
      </VTooltip>
    </div>

    <!-- Shared VWindow Content -->
    <!-- Simplified Renewal UI (only for existing apps in renewal mode) -->
    <div v-if="!props.newApp && managementAction === 'renewal' && tab !== 99 && tab !== 100" class="mt-4">
      <VCard elevation="2" class="pa-4" border>
        <!-- Loading block height -->
        <LoadingSpinner
          v-if="!currentBlockHeight"
          icon="mdi-database-clock"
          :icon-size="40"
          :title="t('common.messages.loadingData')"
        />

        <!-- Renewal Period Section -->
        <div v-else class="pa-3">
          <!-- For V6+: Show period slider -->
          <div v-if="versionFlags.supportsExpire" class="px-3">
            <div class="d-flex flex-column gap-2 mb-3">
              <VChip color="default" variant="tonal" label style="font-size: 14px;">
                <VIcon size="22" class="mr-2">mdi-calendar-check</VIcon>
                <span class="mr-2">{{ t('core.subscriptionManager.currentSubscriptionUntil') }}</span>
                <strong>{{ new Date(appRunningTill.current).toLocaleString('en-GB', timeOptions.shortDate) }}</strong>
              </VChip>
              <VChip :color="timeRemainingColor" variant="tonal" label style="font-size: 14px;">
                <VIcon size="22" class="mr-2">mdi-clock-outline</VIcon>
                <span class="mr-2">{{ t('core.subscriptionManager.timeLeft') }}</span>
                <strong>{{ timeRemaining }}</strong>
              </VChip>
            </div>
            <div class="d-flex flex-column gap-2">
              <VChip color="info" variant="tonal" label style="font-size: 14px;">
                <VIcon size="22" class="mr-2">mdi-update</VIcon>
                <span class="mr-2">{{ t('core.subscriptionManager.renewalPeriod') }}</span>
                <strong>{{ renewalLabels[appDetails.renewalIndex] }}</strong>
              </VChip>
              <div style="height: 32px; display: flex; align-items: center;">
                <VSlider
                  v-model="appDetails.renewalIndex"
                  :min="0"
                  :max="(renewalOptions.value?.length ?? 6) - 1"
                  step="1"
                  hide-details
                  :thumb-label="false"
                  :thumb-size="18"
                  track-size="4"
                />
              </div>
              <VChip color="success" variant="tonal" label style="font-size: 14px;">
                <VIcon size="22" class="mr-2">mdi-calendar-arrow-right</VIcon>
                <span class="mr-2">{{ t('core.subscriptionManager.afterRenewalSubscriptionUntil') }}</span>
                <strong>{{ new Date(appRunningTill.new).toLocaleString('en-GB', timeOptions.shortDate) }}</strong>
              </VChip>
            </div>
            <div v-if="appRunningTill.new < appRunningTill.current">
              <VAlert
                type="warning"
                color="error"
                variant="tonal"
                density="compact"
                size="small"
                class="mt-3"
              >
                {{ t('core.subscriptionManager.subscriptionPeriodDecreaseWarning') }}
              </VAlert>
            </div>
          </div>

          <!-- For < V6: Fixed 1 month renewal -->
          <div v-else class="px-3">
            <div class="d-flex flex-column gap-2 mb-3">
              <VChip color="default" variant="tonal" label style="font-size: 14px;">
                <VIcon size="22" class="mr-2">mdi-calendar-check</VIcon>
                <span class="mr-2">{{ t('core.subscriptionManager.currentSubscriptionUntil') }}</span>
                <strong>{{ new Date(appRunningTill.current).toLocaleString('en-GB', timeOptions.shortDate) }}</strong>
              </VChip>
              <VChip :color="timeRemainingColor" variant="tonal" label style="font-size: 14px;">
                <VIcon size="22" class="mr-2">mdi-clock-outline</VIcon>
                <span class="mr-2">{{ t('core.subscriptionManager.timeLeft') }}</span>
                <strong>{{ timeRemaining }}</strong>
              </VChip>
            </div>
            <div class="d-flex flex-column gap-2">
              <VChip color="info" variant="tonal" label style="font-size: 14px;">
                <VIcon size="22" class="mr-2">mdi-update</VIcon>
                <span class="mr-2">{{ t('core.subscriptionManager.renewalPeriod') }}</span>
                <strong>{{ t('core.subscriptionManager.renewal1Month') }}</strong>
              </VChip>
              <VChip color="success" variant="tonal" label style="font-size: 14px;">
                <VIcon size="22" class="mr-2">mdi-calendar-arrow-right</VIcon>
                <span class="mr-2">{{ t('core.subscriptionManager.afterRenewalSubscriptionUntil') }}</span>
                <strong>{{ new Date(Date.now() + 88000 * 0.5 * 60 * 1000).toLocaleString('en-GB', timeOptions.shortDate) }}</strong>
              </VChip>
            </div>
          </div>

          <!-- Renewal Action Button -->
          <div class="mt-4 px-3">
            <VBtn
              color="primary"
              variant="flat"
              size="large"
              density="compact"
              block
              class="renewal-action-btn"
              @click="tab = 99"
            >
              <VIcon size="22" class="mr-2">mdi-refresh</VIcon>
              <span>{{ t('core.subscriptionManager.renewalAction') }}</span>
            </VBtn>
          </div>
        </div>
      </VCard>
    </div>

    <!-- Cancel Subscription UI (only for existing apps in cancel mode) -->
    <div v-if="!props.newApp && managementAction === 'cancel' && tab !== 99 && tab !== 100" class="mt-4">
      <VCard elevation="2" class="pa-4" border>
        <VAlert type="warning" variant="tonal" class="mb-4">
          {{ t('core.subscriptionManager.cancelWarning') }}
        </VAlert>

        <ul style="list-style: none; padding: 0; padding-left: 16px;">
          <li class="d-flex align-start mb-3">
            <VIcon size="20" class="mr-2 mt-1" color="default">mdi-calendar-check</VIcon>
            <span>{{ t('core.subscriptionManager.currentlySubscribedUntil') }} <b>{{ new Date(appRunningTill.current).toLocaleString('en-GB', timeOptions.shortDate) }}</b></span>
          </li>
          <li class="d-flex align-start mb-3">
            <VIcon size="20" class="mr-2 mt-1" color="warning">mdi-clock-alert</VIcon>
            <span>{{ t('core.subscriptionManager.afterCancellationExpire') }} <b>{{ new Date(Date.now() + 100 * (currentBlockHeight >= 2020000 ? 0.5 : 2) * 60 * 1000).toLocaleString('en-GB', timeOptions.shortDate) }}</b> (100 {{ t('core.subscriptionManager.blocksFromNow') }}).</span>
          </li>
          <li class="d-flex align-start mb-4">
            <VIcon size="20" class="mr-2 mt-1" color="error">mdi-alert-circle</VIcon>
            <span>{{ t('core.subscriptionManager.afterExpirationNotAccessible') }}</span>
          </li>
        </ul>

        <VBtn color="error" variant="flat" size="large" density="compact" block class="mt-4" @click="cancelSubscription">
          <VIcon size="22" class="mr-2">mdi-cancel</VIcon>
          <span>{{ t('core.subscriptionManager.cancelSubscription') }}</span>
        </VBtn>
      </VCard>
    </div>

    <!-- Shared VWindow Content (for new apps or update mode) -->
    <VWindow v-if="props.newApp || managementAction === 'update' || tab === 99 || tab === 100" v-model="tab" class="mt-4">
      <VWindowItem :value="0">
        <div class="pa-4">
          <VForm>
            <VTextField
              v-model="appDetails.name"
              :label="t('core.subscriptionManager.name')"
              prepend-inner-icon="mdi-rename-box"
              variant="outlined"
              density="comfortable"
              :disabled="isNameLocked"
              class="mb-3"
            >
              <template #append-inner>
                <VTooltip location="top">
                  <template #activator="{ props }">
                    <VIcon v-bind="props" size="20" color="grey">mdi-information-outline</VIcon>
                  </template>
                  <span>{{ t('core.subscriptionManager.nameTooltip') }}</span>
                </VTooltip>
              </template>
            </VTextField>

            <VTextarea
              v-model="appDetails.description"
              :label="t('core.subscriptionManager.description')"
              prepend-inner-icon="mdi-text"
              auto-grow
              rows="1"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            >
              <template #append-inner>
                <VTooltip location="top">
                  <template #activator="{ props }">
                    <VIcon v-bind="props" size="20" color="grey">mdi-information-outline</VIcon>
                  </template>
                  <span>{{ t('core.subscriptionManager.descriptionTooltip') }}</span>
                </VTooltip>
              </template>
            </VTextarea>

            <VTextField
              v-model="appDetails.owner"
              :label="t('core.subscriptionManager.owner')"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            >
              <template #append-inner>
                <VTooltip location="top">
                  <template #activator="{ props }">
                    <VIcon v-bind="props" size="20" color="grey">mdi-information-outline</VIcon>
                  </template>
                  <span>{{ t('core.subscriptionManager.ownerTooltip') }}</span>
                </VTooltip>
              </template>
            </VTextField>

            <!-- Specification Version (shown for update and redeploy, not for new registration) -->
            <VTextField
              v-if="!props.newApp"
              :model-value="specVersion"
              :label="t('core.subscriptionManager.specVersion')"
              prepend-inner-icon="mdi-tag"
              variant="outlined"
              density="comfortable"
              readonly
              class="mb-3"
            >
              <template #append-inner>
                <VTooltip location="top" max-width="300">
                  <template #activator="{ props: tooltipProps }">
                    <VIcon
                      v-bind="tooltipProps"
                      size="20"
                      :color="specVersion >= LATEST_SPEC_VERSION ? 'success' : 'warning'"
                      class="mr-2"
                    >
                      {{ specVersion >= LATEST_SPEC_VERSION ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                    </VIcon>
                  </template>
                  <span v-if="specVersion >= LATEST_SPEC_VERSION">{{ t('core.subscriptionManager.usingLatestSpec') }}</span>
                  <span v-else>{{ t('core.subscriptionManager.olderSpecWarning') }}</span>
                </VTooltip>
                <VTooltip location="top">
                  <template #activator="{ props: tooltipProps }">
                    <VIcon v-bind="tooltipProps" size="20" color="grey">mdi-information-outline</VIcon>
                  </template>
                  <span>{{ t('core.subscriptionManager.currentSpecVersion') }}</span>
                </VTooltip>
              </template>
            </VTextField>

            <!--
              <VCombobox
              v-model="appDetails.contacts"
              label="Contact"
              prepend-inner-icon="mdi-email"
              multiple
              outlined
              dense
              class="mb-3"
              :items="[]"
              hide-no-data
              hide-details
              menu-icon=""
              @change="removeDuplicates"
              >
              <template #selection="{ item, index }">
              <VChip
              class="ma-1"
              closable
              @click:close="appDetails.contacts.splice(index, 1)"
              >
              {{ item.value }}
              </VChip>
              </template>
              </VCombobox> 
            -->
          
          
            <div v-if="versionFlags.supportsContacts" class="d-flex align-center mb-3">
              <VCombobox
                v-model="appDetails.contacts"
                :label="t('core.subscriptionManager.contact')"
                prepend-inner-icon="mdi-email"
                multiple
                variant="outlined"
                density="comfortable"
                :items="[]"
                hide-no-data
                hide-details
                menu-icon=""
                class="flex-grow-1"
                @change="removeDuplicates"
              >
                <template #selection="{ item, index }">
                  <VChip
                    v-if="item.value && item.value.trim()"
                    class="ma-1"
                    closable
                    @click:close="appDetails.contacts.splice(index, 1)"
                  >
                    {{ item.value }}
                  </VChip>
                </template>
                <template #append-inner>
                  <VTooltip location="top">
                    <template #activator="{ props }">
                      <VIcon v-bind="props" size="20" color="grey">mdi-information-outline</VIcon>
                    </template>
                    <span>{{ t('core.subscriptionManager.contactTooltip') }}</span>
                  </VTooltip>
                </template>
              </VCombobox>

              <VTooltip :text="t('core.subscriptionManager.uploadContactsTooltip')" location="top">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon
                    variant="flat"
                    color="primary"
                    class="ml-2"
                    :disabled="appDetails?.contacts?.length === 0 || isUploadingContacts"
                    @click="uploadContactsToFluxStorage"
                  >
                    <VIcon size="24">mdi-cloud-upload</VIcon>
                  </VBtn>
                </template>
              </VTooltip>
            </div>
          </VForm>
          <!-- Instances Section -->
          <div class="border rounded pa-3">
            <div>
              <div class="d-flex align-center justify-space-between mb-2">
                <VChip color="default" variant="tonal" class="mr-2" style="width: 110px" label>
                  <VIcon class="mr-1">mdi-laptop</VIcon>
                  {{ t('core.subscriptionManager.instances') }}
                </VChip>
                <VChip color="success" variant="tonal" size="small">
                  {{ t('core.subscriptionManager.instancesCount', appDetails.instances, { count: appDetails.instances }) }}
                </VChip>
              </div>
              <VSlider
                v-model="appDetails.instances"
                :min="3"
                :max="100"
                step="1"
                hide-details
                :thumb-label="false"
                :thumb-size="18"
                track-size="4"
              />
            </div>

            <!-- Renewal Period Section (Only for V6+ apps) -->
            <div v-if="versionFlags.supportsExpire" class="mb-2 mt-2">
              <div class="d-flex align-center justify-space-between mb-1">
                <div class="d-flex align-center">
                  <VChip color="default" variant="tonal" class="mr-2" style="width: 110px" label>
                    <VIcon class="mr-1">mdi-calendar-clock</VIcon>
                    {{ t('core.subscriptionManager.period') }}
                  </VChip>
                </div>
                <VSwitch
                  v-if="!newApp"
                  v-model="renewalEnabled"
                  inset
                  hide-details
                  class="ma-0"
                  :label="t('core.subscriptionManager.renewal')"
                />
              </div>

              <VSlider
                v-model="appDetails.renewalIndex"
                :min="0"
                :max="(renewalOptions.value?.length ?? 6) - 1"
                step="1"
                class="flex-grow-1"
                hide-details
                :thumb-label="false"
                :thumb-size="18"
                track-size="4"
                :disabled="!renewalEnabled && !newApp"
              />
              <span class="mb-5">
                <div class="d-flex justify-space-between align-center px-3">
                  <!-- left -->
                  <span style="line-height: 1.25; font-size: 0.875rem;">
                    <template v-if="newApp">
                      {{ t('core.subscriptionManager.yourApplicationWillBeSubscribedUntil') }}
                      <b>{{ new Date(appRunningTill.new).toLocaleString('en-GB', timeOptions.shortDate) }}</b>.
                    </template>
                    <template v-else>
                      {{ t('core.subscriptionManager.currentlyYourApplicationIsSubscribedUntil') }}
                      <b>{{ new Date(appRunningTill.current).toLocaleString('en-GB', timeOptions.shortDate) }}</b>.
                    </template>
                  </span>
                  <!-- right -->
                  <span class="text-caption grey--text" style="line-height: 1.25; white-space: nowrap;">
                    {{ renewalLabels[appDetails.renewalIndex] }}
                  </span>
                </div>
                <span v-if="renewalEnabled && !newApp" class="px-3" style="font-size: 0.8125rem;">
                  {{ t('core.subscriptionManager.yourNewAdjustedSubscriptionEndsOn') }}
                  <b>{{ new Date(appRunningTill.new).toLocaleString('en-GB', timeOptions.shortDate) }}</b>.
                </span>
                <div v-if="!renewalEnabled && !newApp" class="d-flex align-center px-3" style="font-size: 0.875rem; color: #ff9800;">
                  <VIcon size="18" color="warning" class="mr-2">mdi-information</VIcon>
                  <span>{{ t('core.subscriptionManager.subscriptionNotExtended') }}</span>
                </div>
                <span v-if="appRunningTill.new < appRunningTill.current && renewalEnabled" style="color: red">
                  <VAlert
                    type="warning"
                    color="error"
                    variant="tonal"
                    density="compact"
                    size="small"
                    class="mt-1 mx-3"
                  >
                    {{ t('core.subscriptionManager.subscriptionPeriodDecreaseWarning') }}
                  </VAlert>
                </span>
              </span>
            </div>
            <!-- Additional Options Section (V7+) -->
            <div v-if="versionFlags.supportsStaticIp" class="d-flex align-center mb-1 mt-4">
              <VChip color="default" variant="tonal" class="mr-2"  label>
                <VIcon class="mr-1">mdi-cog-box</VIcon>
                {{ t('core.subscriptionManager.additionalOptions') }}
              </VChip>
            </div>
            <div v-if="versionFlags.supportsStaticIp" class="d-flex flex-wrap gap-4 mt-1 pa-2">
              <!-- Static IP Switch -->
              <div class="d-flex align-center pa-2 switch-container">
                <VSwitch
                  v-model="appDetails.staticip"
                  inset
                  hide-details
                  class="ma-0"
                  density="compact"
                  :label="t('core.subscriptionManager.staticIp')"
                />
                <VTooltip location="top" max-width="300">
                  <template #activator="{ props }">
                    <VIcon v-bind="props" size="20" color="grey" class="ml-2" style="vertical-align: middle;">mdi-information-outline</VIcon>
                  </template>
                  <span>{{ t('core.subscriptionManager.staticIpTooltip') }}</span>
                </VTooltip>
              </div>

              <!-- Enterprise Switch -->
              <div class="d-flex align-center pa-2 switch-container">
                <VSwitch
                  v-model="isPrivateApp"
                  inset
                  hide-details
                  class="ma-0"
                  density="compact"
                  :label="t('core.subscriptionManager.enterprise')"
                />
                <VTooltip location="top" max-width="300">
                  <template #activator="{ props }">
                    <VIcon v-bind="props" size="20" color="grey" class="ml-2" style="vertical-align: middle;">mdi-information-outline</VIcon>
                  </template>
                  <span>{{ t('core.subscriptionManager.enterpriseTooltip') }}</span>
                </VTooltip>
              </div>
            </div>

          </div>


        </div>
      </VWindowItem>

      <VWindowItem :value="1">
        <div class="pa-4">
          <VRow>
            <!-- Allowed Geolocation -->
            <VCol cols="12" md="6">
              <!-- <h3 class="text-center">Allowed Geolocation</h3> -->

              <div class="text-center">
                <h4 class="d-flex align-center justify-center flex-wrap gap-1">
                  <VIcon color="success">mdi-earth</VIcon>
                  {{ t('core.subscriptionManager.allowedGeolocation') }}
                </h4>
              </div>
              <!-- Continent Selector -->
              <VSelect
                v-model="selectedAllowed.continent"
                :items="getContinents(false)"
                :label="t('core.subscriptionManager.continent')"
                item-title="text"
                item-value="value"
                outlined
                dense
                class="mb-4 mt-4"
              />
              <!-- Country Selector -->
              <VSelect
                v-model="selectedAllowed.country"
                :items="getCountries(selectedAllowed.continent, false)"
                :label="t('core.subscriptionManager.country')"
                item-title="text"
                item-value="value"
                outlined 
                dense 
                class="mb-4"
                :disabled="!selectedAllowed.continent || selectedAllowed.continent === 'ALL'"
              />
              <!-- Region Selector -->
              <VSelect
                v-model="selectedAllowed.region"
                :items="getRegions(selectedAllowed.continent, selectedAllowed.country, false)"
                :label="t('core.subscriptionManager.region')"
                item-title="text"
                item-value="value"
                outlined
                dense
                class="mb-4"
                :disabled="!selectedAllowed.country || selectedAllowed.country === 'ALL'"
              />

              <!-- Add Button -->
              <div class="d-flex justify-center mt-2 mb-2">
                <VTooltip :text="t('core.subscriptionManager.addAllowed')" location="top">
                  <template #activator="{ props }">
                    <VBtn
                      v-bind="props"
                      @click="addAllowed"
                      icon
                      color="success"
                      density="compact"
                    >
                      <VIcon>mdi-plus</VIcon>
                    </VBtn>
                  </template>
                </VTooltip>
              </div>

              <!-- Resulting Chips -->
              <div class="mt-2">
                <VChip
                  v-for="(loc, i) in allowedGeolocations"
                  :key="loc"
                  color="success"
                  class="ma-1"
                  closable
                  @click:close="removeAllowed(i)"
                  label
                >
                  {{ getGeolocationLabel(loc) }}
                </VChip>
              </div>
            </VCol>

            <!-- Forbidden Geolocation -->
            <VCol cols="12" md="6">
              <div class="text-center">
                <h4 class="d-flex align-center justify-center flex-wrap gap-1">
                  <VIcon color="error">mdi-earth-off</VIcon>
                  {{ t('core.subscriptionManager.forbiddenGeolocation') }}
                </h4>
              </div>

              <!-- Continent Selector -->
              <VSelect
                v-model="selectedForbidden.continent"
                :items="getContinents(true)"
                :label="t('core.subscriptionManager.continent')"
                item-title="text"
                item-value="value"
                outlined
                dense
                class="mb-4 mt-4"
              />

              <!-- Country Selector -->
              <VSelect
                v-model="selectedForbidden.country"
                :items="getCountries(selectedForbidden.continent, true)"
                :label="t('core.subscriptionManager.country')"
                item-title="text"
                item-value="value"
                outlined
                dense 
                class="mb-4"
                :disabled="!selectedForbidden.continent || selectedForbidden.continent === 'NONE'"
              />

              <!-- Region Selector -->
              <VSelect
                v-model="selectedForbidden.region"
                :items="getRegions(selectedForbidden.continent, selectedForbidden.country, true)"
                :label="t('core.subscriptionManager.region')"
                item-title="text"
                item-value="value"
                outlined
                dense
                class="mb-4"
                :disabled="!selectedForbidden.country || selectedForbidden.country === 'ALL'"
              />

              <!-- Add Button -->
              <div class="d-flex justify-center mt-2 mb-2">
                <VTooltip :text="t('core.subscriptionManager.addForbidden')" location="top">
                  <template #activator="{ props }">
                    <VBtn
                      v-bind="props"
                      @click="addForbidden"
                      icon
                      color="error"
                      density="compact"
                    >
                      <VIcon>mdi-plus</VIcon>
                    </VBtn>
                  </template>
                </VTooltip>
              </div>
              <!-- Resulting Chips -->
              <div class="mt-2">
                <VChip
                  v-for="(loc, i) in forbiddenGeolocations"
                  :key="loc"
                  color="error"
                  class="ma-1"
                  closable
                  label
                  @click:close="removeForbidden(i)"
                >
                  {{ getGeolocationLabel(loc) }}
                </VChip>
              </div>
            </VCol>
          </VRow>
        </div>
      </VWindowItem>

      <!-- Updated component section (Tab 3) - moved after Priority Nodes -->
      <VWindowItem :value="3">
        <div class="pa-4">
          <div class="d-flex justify-space-between align-center mb-3">
            <!-- Component Tabs -->
            <VTabs
              v-model="componentTab"
              start
              density="comfortable"
              class="v-tabs-pill"
            >
              <VTab
                v-for="(component, componentIndex) in props.appSpec?.compose || []"
                :key="`component-${componentIndex}`"
                :value="`component-${componentIndex}`"
              >
                <VTooltip v-if="$vuetify.display.xs" location="top" activator="parent">
                  {{ component.name || `${t('core.subscriptionManager.component')} ${componentIndex + 1}` }}
                </VTooltip>
                <div class="d-flex align-center tab-content">
                  <VIcon class="mr-1" style="font-size: 22px !important; height: 22px !important; width: 22px !important;">
                    mdi-cube-outline
                  </VIcon>
                  <span class="d-none d-sm-inline">{{ component.name || `${t('core.subscriptionManager.component')} ${componentIndex + 1}` }}</span>
                  <VBtn
                    v-if="props.newApp"
                    icon
                    variant="flat"
                    color="error"
                    class="ml-3"
                    style="width: 16px !important; height: 16px !important; min-width: 16px !important; padding: 0 !important;"
                    @click.stop="removeComposeComponent(componentIndex)"
                  >
                    <VIcon style="font-size: 12px !important; width: 12px !important; height: 12px !important;">mdi-close</VIcon>
                  </VBtn>
                </div>
              </VTab>
            </VTabs>

            <!-- Add Component Button -->
            <VBtn v-if="props.newApp" icon color="primary" @click="addComposeComponent">
              <VIcon>mdi-plus</VIcon>
            </VBtn>
          </div>

          <!-- Dynamic VWindow for components -->
          <VWindow v-model="componentTab">
            <VWindowItem
              v-for="(component, componentIndex) in props.appSpec?.compose || []"
              :key="`component-${componentIndex}`"
              :value="`component-${componentIndex}`"
            >
              <div class="d-flex align-center mb-1 mt-2 px-2">
                <VChip color="default" variant="tonal" style="width: 100%;" label>
                  <VIcon class="mr-1">mdi-information-box</VIcon>
                  {{ t('core.subscriptionManager.general') }}
                </VChip>
              </div>
              <div class="pa-2">
                <VTextField
                  v-model="component.name"
                  :label="t('core.subscriptionManager.componentName')"
                  prepend-inner-icon="mdi-tag"
                  density="comfortable"
                  variant="outlined"
                  class="mb-3"
                  :disabled="!props.newApp"
                >
                  <template #append-inner>
                    <VTooltip location="top">
                      <template #activator="{ props }">
                        <VIcon v-bind="props" size="20" color="grey">mdi-information-outline</VIcon>
                      </template>
                      <span>{{ t('core.subscriptionManager.componentNameTooltip') }}</span>
                    </VTooltip>
                  </template>
                </VTextField>

                <VTextField
                  v-model="component.description"
                  :label="t('core.subscriptionManager.componentDescription')"
                  prepend-inner-icon="mdi-text"
                  density="comfortable"
                  variant="outlined"
                  class="mb-3"
                >
                  <template #append-inner>
                    <VTooltip location="top">
                      <template #activator="{ props }">
                        <VIcon v-bind="props" size="20" color="grey">mdi-information-outline</VIcon>
                      </template>
                      <span>{{ t('core.subscriptionManager.componentDescriptionTooltip') }}</span>
                    </VTooltip>
                  </template>
                </VTextField>

                <VTextField
                  v-model="component.repotag"
                  :label="t('core.subscriptionManager.repositoryTag')"
                  prepend-inner-icon="mdi-docker"
                  density="comfortable"
                  variant="outlined"
                  class="mb-3"
                  :readonly="!props.newApp"
                >
                  <template #append-inner>
                    <VTooltip location="top">
                      <template #activator="{ props }">
                        <VIcon v-bind="props" size="20" color="grey">mdi-information-outline</VIcon>
                      </template>
                      <span v-if="props.newApp">{{ t('core.subscriptionManager.repositoryTagTooltipNew') }}</span>
                      <span v-else>{{ t('core.subscriptionManager.repositoryTagTooltipUpdate') }}</span>
                    </VTooltip>
                  </template>
                </VTextField>

                <!-- Repository Auth for Enterprise Apps (v7+) -->
                <VTextField
                  v-if="versionFlags.supportsRepoAuth"
                  v-model="component.repoauth"
                  :label="t('core.subscriptionManager.repositoryAuthentication')"
                  :placeholder="t('core.subscriptionManager.dockerAuthPlaceholder')"
                  prepend-inner-icon="mdi-lock"
                  density="comfortable"
                  variant="outlined"
                  class="mb-3"
                  :hint="!isPrivateApp ? t('core.subscriptionManager.enableEnterpriseHint') : ''"
                  persistent-hint
                  :disabled="!isPrivateApp"
                >
                  <template #append-inner>
                    <VTooltip location="top">
                      <template #activator="{ props }">
                        <VIcon v-bind="props" size="20" color="grey">mdi-information-outline</VIcon>
                      </template>
                      <span v-if="!isPrivateApp">{{ t('core.subscriptionManager.enterpriseFeatureTooltip') }}</span>
                      <span v-else>{{ t('core.subscriptionManager.dockerRegistryCredentialsTooltip') }}</span>
                    </VTooltip>
                  </template>
                </VTextField>

                <!-- Secrets for Enterprise Apps (v7) -->
                <VTextField
                  v-if="props.appSpec?.version === 7 && isPrivateApp"
                  v-model="component.secrets"
                  :label="t('core.subscriptionManager.secrets')"
                  :placeholder="t('core.subscriptionManager.secretsPlaceholder')"
                  prepend-inner-icon="mdi-key"
                  density="comfortable"
                  variant="outlined"
                  class="mb-3"
                  persistent-hint
                >
                  <template #append-inner>
                    <VTooltip location="top">
                      <template #activator="{ props }">
                        <VIcon v-bind="props" size="20" color="grey">mdi-information-outline</VIcon>
                      </template>
                      <span>{{ t('core.subscriptionManager.secretsTooltip') }}</span>
                    </VTooltip>
                  </template>
                </VTextField>

                <div class="d-flex align-center mb-3 mt-2">
                  <VChip
                    color="default"
                    variant="tonal"
                    style="width: 100%;"
                    label
                    class="d-flex align-center"
                  >
                    <VIcon size="20" class="mr-2">mdi-folder-plus</VIcon>
                    <span class="text-subtitle-2">{{ t('core.subscriptionManager.dataPathBuilder') }}</span>
                  </VChip>
                </div>

                <VolumePathBuilder
                  :componentIndex="componentIndex"
                  :newApp="props.newApp"
                  v-model="appSpec.compose[componentIndex].containerData"
                />

                <VTextField
                  v-model="component.containerData"
                  :label="t('core.subscriptionManager.containerDataPath')"
                  prepend-inner-icon="mdi-folder"
                  density="comfortable"
                  variant="outlined"
                  class="mb-3 mt-4"
                  readonly
                />

                <div class="d-flex align-center mb-3 mt-2">
                  <VChip
                    color="default"
                    variant="tonal"
                    style="width: 100%;"
                    label
                    class="d-flex align-center"
                  >
                    <VIcon size="20" class="mr-2">mdi-alpha-e-box</VIcon>
                    <span class="text-subtitle-2">{{ t('core.subscriptionManager.environment') }}</span>
                  </VChip>
                </div>

                <div class="d-flex flex-wrap gap-2 env-buttons-container">
                  <VBadge
                    class="env-button-wrapper"
                    :model-value="component.environmentParameters?.length > 0"
                    :content="component.environmentParameters.length"
                    color="primary"
                    offset-x="10"
                    offset-y="6"
                  >
                    <VBtn
                      class="env-button"
                      variant="outlined"
                      prepend-icon="mdi-format-list-bulleted"
                      color="grey"
                      block
                      @click="openEnvDialog(componentIndex)"
                    >
                      <span class="env-btn-text">{{ t('core.subscriptionManager.environmentVariables') }}</span>
                      <VSpacer />
                      <VTooltip location="top">
                        <template #activator="{ props }">
                          <VIcon v-bind="props" size="18" color="grey" class="env-info-icon ml-2">mdi-information-outline</VIcon>
                        </template>
                        <span>{{ t('core.subscriptionManager.environmentVariablesTooltip') }}</span>
                      </VTooltip>
                    </VBtn>
                  </VBadge>

                  <VBadge
                    class="env-button-wrapper"
                    :model-value="component.commands?.length > 0"
                    :content="component.commands.length"
                    color="primary"
                    offset-x="10"
                    offset-y="6"
                  >
                    <VBtn
                      class="env-button"
                      variant="outlined"
                      prepend-icon="mdi-console"
                      color="grey"
                      block
                      @click="openCommandsDialog(componentIndex)"
                    >
                      <span class="env-btn-text">{{ t('core.subscriptionManager.commands') }}</span>
                      <VSpacer />
                      <VTooltip location="top" max-width="420">
                        <template #activator="{ props }">
                          <VIcon v-bind="props" size="18" color="grey" class="env-info-icon ml-2">mdi-information-outline</VIcon>
                        </template>
                        <div class="text-left pa-2">
                          <div class="text-caption mb-2" style="color: inherit !important;">{{ t('core.subscriptionManager.commandsTooltip1') }}</div>
                          <div class="text-caption mb-2" style="color: inherit !important;">{{ t('core.subscriptionManager.commandsTooltip2') }}</div>
                          <div class="text-caption" style="color: #ff9800 !important;">
                            <VIcon size="22" class="mr-1" style="vertical-align: middle; color: #ff9800 !important;">mdi-alert-circle</VIcon>
                            {{ t('core.subscriptionManager.commandsTooltipWarning') }}
                          </div>
                        </div>
                      </VTooltip>
                    </VBtn>
                  </VBadge>
                </div>
                <div class="mb-3">
                  <div class="d-flex align-center mb-3">
                    <VChip color="default" variant="tonal" style="width: 100%;" label>
                      <VIcon class="mr-1">mdi-connection</VIcon>
                      {{ t('core.subscriptionManager.portBindings') }}
                    </VChip>
                  </div>

                  <div class="border rounded d-flex flex-column justify-center" style="min-height: 60px;">
                    <!-- Add new ports -->
                    <div class="d-flex align-center gap-2 px-2" v-if="newPorts[componentIndex]" :class="component.ports && component.ports.length > 0 ? 'py-2' : ''">
                      <VTextField
                        v-model.number="newPorts[componentIndex].exposed"
                        type="number"
                        :label="t('core.subscriptionManager.exposedPort')"
                        density="comfortable"
                        variant="outlined"
                        hide-details
                        style="max-width: 180px;"
                        @input="handleExposedPortInput(componentIndex)"
                      >
                        <template #append-inner>
                          <VTooltip location="top">
                            <template #activator="{ props }">
                              <VIcon v-bind="props" size="18" color="grey">mdi-information-outline</VIcon>
                            </template>
                            <span>{{ t('core.subscriptionManager.exposedPortTooltip') }}</span>
                          </VTooltip>
                        </template>
                      </VTextField>
                      <VTextField
                        v-model.number="newPorts[componentIndex].container"
                        type="number"
                        :label="t('core.subscriptionManager.containerPort')"
                        density="comfortable"
                        variant="outlined"
                        hide-details
                        style="max-width: 180px;"
                      >
                        <template #append-inner>
                          <VTooltip location="top">
                            <template #activator="{ props }">
                              <VIcon v-bind="props" size="18" color="grey">mdi-information-outline</VIcon>
                            </template>
                            <span>{{ t('core.subscriptionManager.containerPortTooltip') }}</span>
                          </VTooltip>
                        </template>
                      </VTextField>
                      <VBtn icon color="primary" density="compact" @click="addPortPair(componentIndex)">
                        <VIcon size="18">mdi-plus</VIcon>
                      </VBtn>
                    </div>
                    <!-- Editable Chip List -->
                    <div class="d-flex flex-wrap align-center gap-1 px-2 pb-2" v-if="component.ports && component.ports.length > 0">
                      <div
                        v-for="(port, idx) in component.ports"
                        :key="'port-pair-' + idx"
                        class="d-flex align-center pa-1"
                      >
                        <!-- Read Mode -->
                        <div
                          v-if="editIndex !== idx || currentEditComponentIndex !== componentIndex"
                          @click="startEdit(component, componentIndex, idx)"
                        >
                          <VChip
                            class="mr-1"
                            color="success"
                            size="small"
                            label
                            rounded
                            style="font-size: 12px; cursor: pointer;"
                            :aria-label="`Edit port pair ${port} : ${component.containerPorts[idx] || '-'}`"
                          >
                            {{ port }} : {{ component.containerPorts[idx] || '-' }}
                          </VChip>
                        </div>
                        <!-- Edit Mode -->
                        <div
                          v-else
                          class="d-flex align-center"
                          style="gap: 4px;"
                          :ref="el => setEditWrapper(idx, el)"
                        >
                          <VTextField
                            :ref="el => setExposedInput(idx, el)"
                            v-model.number="component.ports[idx]"
                            hide-details
                            density="compact"
                            type="number"
                            style="max-width: 120px; font-size: 12px;"
                            variant="outlined"
                            @focus="handleFocus(idx, 'exposed')"
                            @blur="handleBlur(idx, 'exposed')"
                            @keydown.enter="saveAndExitEdit(component, componentIndex, idx)"
                            @input="validatePort(component, componentIndex, idx, 'exposed')"
                          />
                          <VTextField
                            v-model.number="component.containerPorts[idx]"
                            hide-details
                            density="compact"
                            type="number"
                            style="max-width: 120px; font-size: 12px;"
                            variant="outlined"
                            @focus="handleFocus(idx, 'container')"
                            @blur="handleBlur(idx, 'container')"
                            @keydown.enter="saveAndExitEdit(component, componentIndex, idx)"
                            @input="validatePort(component, componentIndex, idx, 'container')"
                          />
                        </div>
                        <!-- Remove Button -->
                        <VBtn
                          icon
                          size="x-small"
                          color="error"
                          variant="text"
                          @click="removePortPair(component, idx)"
                        >
                          <VIcon size="14">mdi-close</VIcon>
                        </VBtn>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Domains per Port Section (One entry per port) -->
                <div v-if="component.ports.length > 0" class="mt-2">
                  <div class="d-flex align-center mb-2">
                    <VChip color="default" variant="tonal" style="width: 100%;" label>
                      <VIcon class="mr-1">mdi-domain</VIcon>
                      {{ t('core.subscriptionManager.customDomains') }}
                    </VChip>
                  </div>
                  <VSheet border rounded class="mt-2 mb-3" style="max-height: 400px;">
                    <VTable dense class="rounded domain-table" :style="{ '--v-table-header-height': '40px' }">
                      <thead>
                        <tr>
                          <th>{{ t('core.subscriptionManager.portDomainConfiguration') }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(port, portIndex) in component.ports"
                          :key="`domain-port-${portIndex}`"
                        >
                          <td>
                            <div class="d-flex align-center gap-2">
                              <VChip size="small" color="success" variant="tonal" label style="flex: 0 0 auto;">
                                <VIcon class="mr-1">mdi-connection</VIcon>
                                {{ port }}
                              </VChip>
                              <VTextField
                                v-model="component.domains[portIndex]"
                                density="compact"
                                hide-details
                                :placeholder="t('core.subscriptionManager.enterDomainForPort')"
                                persistent-placeholder
                                class="small-text-field flex-grow-1"
                              />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </VTable>
                  </VSheet>
                </div>
                <VDialog
                  v-model="envDialog.show"
                  max-width="80%"
                  :key="envDialog.componentIndex"
                  class="pa-4"
                >
                  <VCard>
                    <!-- Header -->
                    <VCardTitle class="bg-primary">
                      <div class="d-flex align-center justify-space-between w-100">
                        <span class="text-h5 text-white">{{ t('core.subscriptionManager.environmentVariables') }}</span>
                        <VTooltip location="top">
                          <template #activator="{ props }">
                            <VBtn
                              v-bind="props"
                              icon
                              color="white"
                              variant="outlined"
                              size="small"
                              class="import-glow-btn"
                              @click="showEnvImportDialog = true"
                            >
                              <VIcon size="22">mdi-file-import</VIcon>
                            </VBtn>
                          </template>
                          <span>{{ t('core.subscriptionManager.importFromJson') }}</span>
                        </VTooltip>
                      </div>
                    </VCardTitle>

                    <!-- Body -->
                    <VCardText>
                      <!-- Add entry row -->
                      <div class="d-flex mb-4 align-center" style="gap: 8px;">
                        <VTextField
                          v-model="envDialog.newKey"
                          :label="t('core.subscriptionManager.key')"
                          density="compact"
                          hide-details
                        />
                        <VTextField
                          v-model="envDialog.newValue"
                          :label="t('core.subscriptionManager.value')"
                          density="compact"
                          hide-details
                        />
                        <VBtn
                          icon
                          color="primary"
                          density="comfortable"
                          @click="addEnvEntry"
                          :disabled="!envDialog.newKey || !envDialog.newValue"
                        >
                          <VIcon>mdi-plus</VIcon>
                        </VBtn>
                      </div>

                      <!-- Table -->
                      <VSheet
                        v-if="envDialog.entries.length > 0"
                        border
                        rounded
                        class="mt-2"
                        style="max-height: 400px; overflow: auto;"
                      >
                        <VTable dense>
                          <thead class="bg-primary">
                            <tr>
                              <th class="text-white" style="height: 40px; line-height: 40px; font-weight: 500; text-align: left;">
                                Key
                              </th>
                              <th class="text-white" style="height: 40px; line-height: 40px; font-weight: 500; text-align: left;">
                                Value
                              </th>
                              <th style="width: 56px; height: 40px; text-align: right; padding-right: 8px;"
                              >
                                <!-- Upload button in table header (right) -->
                                <VTooltip text="Upload environment variables to Flux Storage" location="top">
                                  <template #activator="{ props }">
                                    <VBtn
                                      v-bind="props"
                                      icon
                                      variant="text"
                                      size="small"
                                      color="white"
                                      :disabled="envDialog.entries.length === 0 || isUploadingEnv"
                                      @click="uploadEnvToFluxStorage(envDialog.componentIndex)"
                                    >
                                      <VIcon size="22" style="line-height: 1;">mdi-cloud-upload</VIcon>
                                    </VBtn>
                                  </template>
                                </VTooltip>
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr v-for="(entry, i) in envDialog.entries" :key="i">
                              <td>
                                <VTextField
                                  v-model="entry.key"
                                  density="compact"
                                  hide-details
                                  :placeholder="t('core.subscriptionManager.keyPlaceholder')"
                                />
                              </td>
                              <td>
                                <VTextField
                                  v-model="entry.value"
                                  density="compact"
                                  hide-details
                                  :placeholder="t('core.subscriptionManager.valuePlaceholder')"
                                />
                              </td>
                              <td class="text-right">
                                <VBtn icon variant="text" color="error" @click="removeEnvEntry(i)">
                                  <VIcon>mdi-delete</VIcon>
                                </VBtn>
                              </td>
                            </tr>
                          </tbody>
                        </VTable>
                      </VSheet>
                    </VCardText>

                    <!-- Actions -->
                    <VCardActions>
                      <VSpacer />
                      <VBtn color="error" variant="tonal" size="small" @click="envDialog.show = false">
                        Cancel
                      </VBtn>
                      <VBtn
                        color="success"
                        variant="tonal"
                        size="small"
                        :disabled="envDialog.entries.length === 0"
                        @click="saveEnvChanges"
                      >
                        Save
                      </VBtn>
                    </VCardActions>
                  </VCard>
                </VDialog>
                <VDialog
                  v-model="commandsDialog.show"
                  max-width="80%"
                  :key="commandsDialog.componentIndex"
                  class="pa-4"
                >
                  <VCard>
                    <VCardTitle class="bg-primary">
                      <div class="d-flex align-center justify-space-between w-100">
                        <span class="text-h5 text-white">{{ t('core.subscriptionManager.containerCommands') }}</span>
                        <VTooltip location="top">
                          <template #activator="{ props }">
                            <VBtn
                              v-bind="props"
                              icon
                              color="white"
                              variant="outlined"
                              size="small"
                              class="import-glow-btn"
                              @click="showCommandsImportDialog = true"
                            >
                              <VIcon size="22">mdi-file-import</VIcon>
                            </VBtn>
                          </template>
                          <span>{{ t('core.subscriptionManager.importFromJson') }}</span>
                        </VTooltip>
                      </div>
                    </VCardTitle>

                    <VCardText>
                      <!-- Add Command -->
                      <div class="d-flex mb-4 align-center gap-2">
                        <VTextField
                          v-model="commandsDialog.newCommand"
                          :label="t('core.subscriptionManager.newCommand')"
                          density="compact"
                          dense
                          hide-details
                          class="flex-grow-1"
                        />
                        <VBtn
                          icon
                          color="primary"
                          density="compact"
                          @click="addCommandEntry"
                          :disabled="!commandsDialog.newCommand"
                        >
                          <VIcon>mdi-plus</VIcon>
                        </VBtn>
                      </div>

                      <!-- Editable Table -->
                      <VSheet v-if="commandsDialog.entries.length > 0" border rounded class="mt-2">
                        <VTable dense class="rounded" style="--v-table-header-height: 40px">
                          <thead class="bg-primary">
                            <tr>
                              <th class="text-white">{{ t('core.subscriptionManager.command') }}</th>
                              <th style="width: 40px; text-align: right; padding-right: 8px;">
                                <!-- Upload button in table header -->
                                <VTooltip :text="t('core.subscriptionManager.uploadCmdToFluxStorage')" location="top">
                                  <template #activator="{ props }">
                                    <VBtn
                                      v-bind="props"
                                      icon
                                      variant="text"
                                      size="small"
                                      color="white"
                                      :disabled="commandsDialog.entries.length === 0 || isUploadingCmd"
                                      @click="uploadCmdToFluxStorage(commandsDialog.componentIndex)"
                                    >
                                      <VIcon size="22" style="line-height: 1;">mdi-cloud-upload</VIcon>
                                    </VBtn>
                                  </template>
                                </VTooltip>
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr v-for="(cmd, i) in commandsDialog.entries" :key="i">
                              <td>
                                <VTextField
                                  v-model="commandsDialog.entries[i]"
                                  :placeholder="t('core.subscriptionManager.enterCommand')"
                                  density="compact"
                                  dense
                                  hide-details
                                  class="ma-0"
                                />
                              </td>
                              <td>
                                <VBtn icon variant="text" color="error" @click="removeCommandEntry(i)">
                                  <VIcon>mdi-delete</VIcon>
                                </VBtn>
                              </td>
                            </tr>
                          </tbody>
                        </VTable>
                      </VSheet>
                    </VCardText>

                    <VCardActions>
                      <VSpacer />
                      <VBtn color="error" variant="tonal" size="small" @click="commandsDialog.show = false">
                        Cancel
                      </VBtn>
                      <VBtn
                        color="success"
                        variant="tonal"
                        size="small"
                        :disabled="commandsDialog.entries.length === 0"
                        @click="saveCommandChanges"
                      >
                        Save
                      </VBtn>
                    </VCardActions>
                  </VCard>
                </VDialog>

                <div class="d-flex align-center mb-3">
                  <VChip color="default" variant="tonal" style="width: 100%;" label>
                    <VIcon class="mr-1">mdi-progress-wrench</VIcon>
                    {{ t('core.subscriptionManager.hardwareResource') }}
                  </VChip>
                </div>
                <div class="border rounded pa-2">
                  <VRow dense>
                    <!-- CPU -->
                    <VCol cols="12">
                      <div class="hardware-item">
                        <div class="hardware-label-box">
                          <VIcon size="26" class="hardware-icon">mdi-speedometer</VIcon>
                          <div class="hardware-label-text">
                            <span class="hardware-name">{{ t('core.subscriptionManager.cpu') }}</span>
                            <span class="hardware-unit">{{ t('core.subscriptionManager.vCore') }}</span>
                          </div>
                        </div>
                        <VSlider
                          v-model="component.cpu"
                          :min="0.1"
                          :max="15"
                          :step="0.1"
                          :thumb-label="false"
                          :thumb-size="18"
                          hide-details
                          class="flex-grow-1 hardware-slider"
                        />
                        <VTextField
                          v-model.number="component.cpu"
                          type="number"
                          step="0.1"
                          hide-details
                          density="compact"
                          variant="outlined"
                          class="text-field-fixed"
                        />
                      </div>
                    </VCol>
                    <!-- RAM -->
                    <VCol cols="12">
                      <div class="hardware-item">
                        <div class="hardware-label-box">
                          <VIcon size="26" class="hardware-icon">mdi-memory</VIcon>
                          <div class="hardware-label-text">
                            <span class="hardware-name">{{ t('core.subscriptionManager.ram') }}</span>
                            <span class="hardware-unit">{{ t('core.subscriptionManager.mb') }}</span>
                          </div>
                        </div>
                        <VSlider
                          v-model="component.ram"
                          :min="100"
                          :max="65536"
                          :step="100"
                          :thumb-label="false"
                          :thumb-size="18"
                          hide-details
                          class="flex-grow-1 hardware-slider"
                        />
                        <VTextField
                          v-model.number="component.ram"
                          type="number"
                          dense
                          hide-details
                          density="compact"
                          variant="outlined"
                          class="text-field-fixed"
                        />
                      </div>
                    </VCol>
                    <!-- SSD -->
                    <VCol cols="12">
                      <div class="hardware-item">
                        <div class="hardware-label-box">
                          <VIcon size="26" class="hardware-icon">mdi-harddisk</VIcon>
                          <div class="hardware-label-text">
                            <span class="hardware-name">{{ t('core.subscriptionManager.ssd') }}</span>
                            <span class="hardware-unit">{{ t('core.subscriptionManager.gb') }}</span>
                          </div>
                        </div>
                        <VSlider
                          v-model="component.hdd"
                          :min="1"
                          :max="820"
                          :step="1"
                          :thumb-label="false"
                          :thumb-size="18"
                          hide-details
                          class="flex-grow-1 hardware-slider"
                        />
                        <VTextField
                          v-model.number="component.hdd"
                          type="number"
                          dense
                          hide-details
                          density="compact"
                          variant="outlined"
                          class="text-field-fixed"
                        />
                      </div>
                    </VCol>
                  </VRow>
                </div>
              </div>
            </VWindowItem>
          </VWindow>
        </div>
      </VWindowItem>
      
      <!-- Priority Nodes Tab (value=2) - moved before Components -->
      <VWindowItem :value="2">
        <div class="pa-4">
          <div v-if="props.appSpec?.version >= 7">
            <VAlert
              type="info"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              <template v-if="props.appSpec?.version === 7">
                <strong>{{ t('core.subscriptionManager.enterpriseNodesLabel') }}</strong> {{ t('core.subscriptionManager.enterpriseNodesTabDescription') }}
              </template>
              <template v-else-if="props.appSpec?.version >= 8">
                <strong>{{ t('core.subscriptionManager.priorityNodesLabel') }}</strong> {{ t('core.subscriptionManager.priorityNodesTabDescription') }}
              </template>
            </VAlert>
            
            <!-- Node Selection Table -->
            <VCard flat bordered>
              <VCardTitle class="d-flex justify-space-between align-center">
                <span>{{ props.appSpec?.version === 7 ? t('core.subscriptionManager.tabEnterpriseNodes') : t('core.subscriptionManager.tabPriorityNodes') }}</span>
                <div class="d-flex gap-2">
                  <VBtn
                    v-if="props.appSpec?.version === 7"
                    color="success"
                    variant="outlined"
                    size="small"
                    @click="autoSelectNodes"
                    :disabled="isLoadingNodes"
                  >
                    <VIcon class="mr-1">mdi-auto-fix</VIcon>
                    {{ t('core.subscriptionManager.autoSelect') }}
                  </VBtn>
                  <VBtn
                    color="primary"
                    variant="flat"
                    size="small"
                    @click="openNodeSelectionDialog"
                  >
                    <VIcon class="mr-1">mdi-plus</VIcon>
                    {{ props.appSpec?.version === 7 ? t('core.subscriptionManager.chooseEnterpriseNodes') : t('core.subscriptionManager.choosePriorityNodes') }}
                  </VBtn>
                </div>
              </VCardTitle>
              
              <!-- Filter and Items per page selector for selected nodes -->
              <div class="px-4 pt-3 pb-2">
                <div class="d-flex gap-2 align-center">
                  <VTextField
                    v-model="selectedNodesFilter"
                    :label="t('core.subscriptionManager.searchNodes')"
                    :placeholder="t('core.subscriptionManager.searchNodesPlaceholder')"
                    clearable
                    hide-details
                    density="compact"
                    variant="outlined"
                    style="flex: 3;"
                  >
                    <template #prepend-inner>
                      <VIcon size="20">mdi-magnify</VIcon>
                    </template>
                  </VTextField>

                  <VSelect
                    v-model="selectedNodesPerPage"
                    :items="[5, 10, 25, 50]"
                    :label="t('core.subscriptionManager.perPage')"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="flex: 1; min-width: 100px;"
                  />
                </div>
              </div>
              
              <VSheet border rounded class="mx-4 mb-2">
                <VDataTable
                  :headers="nodeTableHeaders"
                  :items="paginatedSelectedNodes"
                  :items-per-page="-1"
                  hide-default-footer
                  class="elevation-1"
                  item-value="ip"
                  v-model:expanded="expandedRows"
                  show-expand
                >
                
                  <template #item.tier="{ item }">
                    <VChip
                      :color="item.tier === 'CUMULUS' ? 'success' : item.tier === 'NIMBUS' ? 'warning' : 'error'"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.tier }}
                    </VChip>
                  </template>
                
                  <template #item.score="{ item }">
                    <div class="d-flex align-center mb-2">
                      <!--
                        <VRating
                        :model-value="Math.min(item.score / 20, 5)"
                        size="small"
                        readonly
                        density="compact"
                        /> 
                      -->
                      <span class="ml-1">{{ item.score }}</span>
                    </div>
                  </template>
                
                  <template #item.actions="{ item }">
                    <div class="actions-cell">
                      <VBtn
                        icon
                        size="small"
                        variant="text"
                        color="error"
                        @click="removeNode(item)"
                      >
                        <VIcon>mdi-delete</VIcon>
                        <VTooltip activator="parent" location="top">
                          {{ t('core.subscriptionManager.removeNode') }}
                        </VTooltip>
                      </VBtn>
                      <VBtn
                        icon
                        size="small"
                        variant="text"
                        color="primary"
                        @click="visitFluxNode(item.ip)"
                      >
                        <VIcon>mdi-open-in-new</VIcon>
                        <VTooltip activator="parent" location="top">
                          {{ t('core.subscriptionManager.visitFluxNode') }}
                        </VTooltip>
                      </VBtn>
                    </div>
                  </template>
                
                  <template #expanded-row="{ item, columns }">
                    <td :colspan="columns.length">
                      <VCard flat class="ma-2">
                        <VCardText>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.ipAddressLabel') }}</strong>
                            <span>{{ item.ip }}</span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.publicKeyLabel') }}</strong>
                            <span class="text-break">
                              {{ item.pubkey || 'N/A' }}
                            </span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.nodeAddressLabel') }}</strong>
                            <span class="text-break">
                              {{ item.payment_address }}
                            </span>
                          </div>
                          <div v-if="item.txhash && item.outidx" class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.collateralLabel') }}</strong>
                            <span class="text-break">
                              {{ item.txhash }}:{{ item.outidx }}
                            </span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.tierLabel') }}</strong>
                            {{ item.tier }}
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.overallScore') }}</strong>
                            <span>{{ item.score }}</span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.collateralScoreLabel') }}</strong>
                            <span>{{ item.collateralPoints }}</span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.maturityScore') }}</strong>
                            <span>{{ item.maturityPoints }}</span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.publicKeyScoreLabel') }}</strong>
                            <span>{{ item.pubKeyPoints }}</span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.appsAssigned') }}</strong>
                            <span>{{ item.enterpriseApps }}</span>
                          </div>
                          <div v-if="item.status" class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.statusLabel') }}</strong>
                            {{ item.status || 'confirmed' }}
                          </div>
                        </VCardText>
                      </VCard>
                    </td>
                  </template>
                
                  <template #no-data>
                    <div class="text-center pa-4">
                      <VIcon size="48" color="grey">mdi-server-network-off</VIcon>
                      <p class="mt-2 text-grey">{{ t('core.subscriptionManager.noNodesSelected') }}</p>
                    </div>
                  </template>
                </VDataTable>
              </VSheet>
              
              <!-- Custom Pagination -->
              <div v-if="filteredSelectedNodes.length > 0" class="d-flex justify-center align-center pa-3">
                <VBtn
                  icon="mdi-chevron-left"
                  size="small"
                  variant="text"
                  :disabled="selectedNodesCurrentPage === 1"
                  @click="selectedNodesCurrentPage--"
                />
                <span class="mx-3">
                  {{ t('core.subscriptionManager.pageOf', { current: selectedNodesCurrentPage, total: selectedNodesTotalPages }) }}
                </span>
                <VBtn
                  icon="mdi-chevron-right"
                  size="small"
                  variant="text"
                  :disabled="selectedNodesCurrentPage === selectedNodesTotalPages"
                  @click="selectedNodesCurrentPage++"
                />
              </div>
              
            </VCard>
          </div>
          <div v-else>
            <VAlert type="warning" variant="tonal">
              {{ t('core.subscriptionManager.priorityNodesVersionWarning') }}
            </VAlert>
          </div>
        </div>
      </VWindowItem>
      
      <VWindowItem :value="99">
        <div class="px-1 pt-1">
          <div class="d-flex align-center justify-space-between pa-1 mb-4 review-header">
            <div class="d-flex align-center">
              <VIcon class="ml-1 mr-2" color="success" size="24">mdi-check-decagram</VIcon>
              <h2 class="text-h6 mb-0">{{ t('core.subscriptionManager.reviewAndValidate') }}</h2>
            </div>
            <VBtn
              v-if="!props.newApp && (managementAction === 'renewal' || managementAction === 'update' || managementAction === 'cancel')"
              icon
              variant="text"
              color="default"
              @click="tab = 0"
            >
              <VIcon>mdi-arrow-left-circle</VIcon>
            </VBtn>
          </div>
          <!-- Spec Validation -->
          <div class="spec-row">
            <div class="label-cell">{{ t('core.subscriptionManager.validateAppSpec') }}</div>
            <div class="value-cell d-flex align-center justify-end pr-4">
              <div v-if="isVeryfitying" class="d-flex justify-center">
                <VProgressCircular indeterminate color="primary" size="24" />
              </div>
              <div v-else-if="hasValidatedSpec && verifyAppSpecResponse === true" class="d-flex justify-center">
                <VIcon color="success" size="22">mdi-check-circle</VIcon>
              </div>
              <div v-else-if="hasValidatedSpec && verifyAppSpecResponse === false" class="d-flex justify-center">
                <VIcon color="error" size="22">mdi-close-circle</VIcon>
              </div>
            </div>
          </div>

          <!-- Show error message if validation failed -->
          <div v-if="hasValidatedSpec && verifyAppSpecResponse === false && verifyAppSpecError" class="mt-3">
            <VAlert
              type="error"
              variant="tonal"
              density="compact"
              class="mx-3"
            >
              <strong>{{ t('core.subscriptionManager.validationError') }}</strong> {{ verifyAppSpecError }}
            </VAlert>
          </div>

          <!-- Only show other sections if spec is valid -->
          <template v-if="!hasValidatedSpec || verifyAppSpecResponse === true">
            <!-- Total Cost -->
            <div class="spec-row mt-2">
              <div class="label-cell">{{ t('core.subscriptionManager.totalCost') }}</div>
              <div class="value-cell d-flex align-center justify-end pr-4">
                <template v-if="hasCalculatedPrice && appSpecPrice?.flux === 0">
                  <span class="mr-1">{{ t('core.subscriptionManager.freeUpdate') }}</span>
                  <VIcon size="22" color="success">mdi-check-circle</VIcon>
                </template>

                <template v-else-if="hasCalculatedPrice && appSpecPrice?.flux">
                  <div class="d-flex align-center flex-wrap gap-1 mr-1">
                    <span class="price-display">
                      <span class="d-none d-sm-inline" style="white-space: nowrap;">${{ appSpecPrice.usd }} USD</span>
                      <span class="d-inline d-sm-none" style="white-space: nowrap; font-size: 11px;">${{ appSpecPrice.usd }} USD</span>
                    </span>
                    <span style="opacity: 0.5;">|</span>
                    <div class="d-flex align-center gap-1">
                      <span class="price-display">
                        <span class="d-none d-sm-inline" style="white-space: nowrap;">{{ appSpecPrice.flux }} FLUX</span>
                        <span class="d-inline d-sm-none" style="white-space: nowrap; font-size: 11px;">{{ appSpecPrice.flux }} FLUX</span>
                      </span>
                      <VChip
                        v-if="appSpecPrice?.fluxDiscount > 0"
                        color="success"
                        size="x-small"
                        class="discount-chip"
                        label
                      >
                        -{{ appSpecPrice.fluxDiscount }}%
                      </VChip>
                    </div>
                  </div>
                  <VIcon size="22" color="success">mdi-check-circle</VIcon>
                </template>

                <template v-else-if="hasCalculatedPrice && !appSpecPrice?.flux">
                  <span class="mr-1">{{ t('core.subscriptionManager.failedToCalculatePrice') }}</span>
                  <VIcon size="22" color="error">mdi-alert-circle</VIcon>
                </template>
              </div>
            </div>

            <!-- Expiry -->
            <div class="spec-row mt-2">
              <div class="label-cell">{{ t('core.subscriptionManager.expiry') }}</div>
              <div class="value-cell d-flex align-center justify-end pr-4">
                <span class="mr-1">
                  <template v-if="hasCheckedExpiry">
                    <template v-if="props.newApp">
                      <!-- For new apps, show subscription period -->
                      <template v-if="blockHeight">
                        {{ t('core.subscriptionManager.subscription') }} {{ expiryLabel }}
                      </template>
                      <template v-else>
                        {{ t('core.subscriptionManager.subscription') }} {{ expiryLabel }}
                      </template>
                    </template>
                    <template v-else-if="blockHeight && props.appSpec?.height">
                      <!-- For existing apps, show validation status -->
                      <template v-if="isExpiryValid">
                        {{ expiryLabel }}
                      </template>
                      <template v-else>
                        {{ t('core.subscriptionManager.expiresInUnderWeek') }}
                      </template>
                    </template>
                    <template v-else>
                      {{ t('core.subscriptionManager.notAvailable') }}
                    </template>
                  </template>
                </span>
                <VIcon
                  v-if="hasCheckedExpiry && (props.newApp || (blockHeight && props.appSpec?.height))"
                  size="22"
                  :color="isExpiryValid ? 'success' : 'error'"
                >
                  {{ isExpiryValid ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                </VIcon>
              </div>
            </div>

            <!-- Signature -->
            <div class="spec-row mt-2">
              <div class="label-cell">{{ t('core.subscriptionManager.signature') }}</div>
              <div class="value-cell d-flex align-center justify-end pr-4">

                <VIcon
                  v-if="signature"
                  size="22"
                  color="success"
                >
                  mdi-check-circle
                </VIcon>
              </div>
            </div>

            <!-- Registered -->
            <div class="spec-row mt-2">
              <div class="label-cell">{{ t('core.subscriptionManager.registered') }}</div>
              <div class="value-cell d-flex align-center justify-end pr-4">
                <div v-if="isPropagating" class="d-flex justify-center">
                  <VProgressCircular indeterminate color="primary" size="24" />
                </div>
                <div v-else-if="registrationHash" class="d-flex justify-center">
                  <VIcon color="success" size="22">mdi-check-circle</VIcon>
                </div>
              </div>
            </div>

            <div class="d-flex justify-center align-center mt-4">
              <!-- Sign Message Button (only for non-SSO logins) -->
              <VBtn
                v-if="hasCalculatedPrice && !signature && !isSigning && !signingFailed && loginType !== 'sso' && !(hasValidatedSpec && verifyAppSpecResponse === false) && !(hasCalculatedPrice && !appSpecPrice?.flux && appSpecPrice?.flux !== 0) && !(hasCheckedExpiry && !isExpiryValid && !newApp)"
                variant="flat"
                style="width: 100%"
                @click="dataSign()"
              >
                <VIcon start size="24">mdi-file-sign</VIcon> {{ t('core.subscriptionManager.signMessage') }}
              </VBtn>

              <!-- Retry Signing Button (when signing or registration failed) -->
              <VBtn
                v-else-if="signingFailed && !signature"
                variant="flat"
                color="warning"
                style="width: 100%"
                @click="dataSign()"
              >
                <VIcon start size="20">mdi-refresh</VIcon> {{ t('core.subscriptionManager.retrySigning') }}
              </VBtn>

              <!-- Cancel Signing button (only for non-SSO logins during signing) -->
              <VBtn
                v-else-if="isSigning && !signature && loginType !== 'sso'"
                variant="outlined"
                color="error"
                style="width: 100%"
                @click="cancelSigning()"
              >
                <VIcon start size="20">mdi-close-circle</VIcon> {{ t('core.subscriptionManager.cancelSigning') }}
              </VBtn>
            </div>
          </template>
        </div>
      </VWindowItem>
      
      <!-- Test & Pay Tab -->
      <VWindowItem :value="100">
        <div 
          class="pa-4" 
          :style="{
            backgroundColor: theme.global.name.value === 'dark' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(76, 175, 80, 0.03)',
            borderRadius: '8px',
            border: theme.global.name.value === 'dark' ? '1px solid rgba(76, 175, 80, 0.1)' : '1px solid rgba(76, 175, 80, 0.08)'
          }"
        >
          <!-- Test Installation Section -->
          <VCard class="mb-4" v-if="!testFinished && specsHaveChanged && (props.newApp || appSpecPrice?.flux !== 0) && !paymentProcessing && !paymentConfirmed">
            <VCardTitle class="bg-primary text-white">
              <VIcon class="mr-2">mdi-test-tube</VIcon>
              {{ t('core.subscriptionManager.testApplicationInstallation') }}
            </VCardTitle>
            <VCardText class="mt-4">
              <p class="mb-4">
                {{ t('core.subscriptionManager.testInstallationDescription') }}
              </p>

              <VAlert v-if="testError" type="error" variant="tonal" class="mb-4">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <strong>{{ t('core.subscriptionManager.warningLabel') }}</strong> {{ t('core.subscriptionManager.testFailedWarning') }}
                  </div>
                  <div class="d-flex gap-2">
                    <VBtn
                      icon
                      size="small"
                      color="primary"
                      variant="outlined"
                      @click="testAppInstall"
                      :loading="testRunning"
                    >
                      <VIcon size="20">mdi-restart</VIcon>
                    </VBtn>
                    <VBtn
                      size="small"
                      color="warning"
                      variant="outlined"
                      @click="forceEnablePayment"
                    >
                      {{ t('core.subscriptionManager.enablePaymentAnyway') }}
                    </VBtn>
                  </div>
                </div>
              </VAlert>

              <VBtn
                color="success"
                variant="flat"
                :loading="testRunning"
                @click="testAppInstall"
                :disabled="testFinished && !testError"
              >
                <VIcon class="mr-2">mdi-play</VIcon>
                {{ testFinished && !testError ? t('core.subscriptionManager.testCompleted') : t('core.subscriptionManager.testInstallation') }}
              </VBtn>
            </VCardText>
          </VCard>

          <!-- Test Output -->
          <VCard v-if="testOutput.length > 0 && !paymentProcessing && !paymentConfirmed" class="mb-4">
            <VCardTitle 
              class="bg-secondary text-white d-flex align-center justify-space-between"
              style="cursor: pointer;"
              @click="logsExpanded = !logsExpanded"
            >
              <div class="d-flex align-center">
                <VIcon class="mr-2">mdi-console</VIcon>
                <span v-if="testFinished && !testError">{{ t('core.subscriptionManager.testCompletedSuccessfully') }}</span>
                <span v-else-if="testFinished && testError">{{ t('core.subscriptionManager.testFailedCheckLogs') }}</span>
                <span v-else-if="testRunning">{{ t('core.subscriptionManager.installationProgress') }}</span>
                <span v-else>{{ t('core.subscriptionManager.installationProgress') }}</span>
              </div>
              <VBtn
                icon
                variant="text"
                size="small"
                class="text-white"
                @click.stop="logsExpanded = !logsExpanded"
              >
                <VIcon>{{ logsExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</VIcon>
              </VBtn>
            </VCardTitle>
            
            <VExpandTransition>
              <VCardText v-show="logsExpanded" class="mt-3">
                <VList class="pa-0">
                  <VListItem 
                    v-for="(output, index) in testOutput" 
                    :key="index"
                    class="installation-step"
                    :class="{
                      'text-success': output.status === 'success',
                      'text-error': output.status === 'error',
                      'text-warning': output.status === 'warning',
                      'text-info': output.status === 'info'
                    }"
                  >
                    <template #prepend>
                      <VIcon 
                        :color="getStatusColor(output.status)"
                        :icon="getStatusIcon(output.status)"
                        class="mr-2"
                      />
                    </template>
                    <VListItemTitle>
                      <pre class="installation-output">{{ formatOutput(output) }}</pre>
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VCardText>
            </VExpandTransition>
          </VCard>

          <!-- Network Error Alert -->
          <VAlert
            v-if="testError && testFinished"
            color="error"
            density="compact"
            class="mt-4 mb-0 pa-3"
          >
            <template #default>
              <div class="d-flex align-center justify-start w-100">
                <VIcon icon="mdi-alert-decagram" class="mr-3" size="28" />
                <div class="flex-grow-1">
                  {{ t('core.subscriptionManager.testFailedCheckLogsRetry') }}
                </div>
                <VBtn
                  icon="mdi-refresh"
                  color="white"
                  variant="text"
                  size="default"
                  :loading="testRunning"
                  @click="testAppInstall"
                  class="ml-2"
                >
                  <VIcon size="24">mdi-refresh</VIcon>
                </VBtn>
              </div>
            </template>
          </VAlert>

          <!-- Payment Section -->
          <div v-if="(testFinished && !testError) || (!props.newApp && renewalEnabled && !specsHaveChanged) || (!props.newApp && registrationHash && appSpecPrice?.flux === 0) || paymentProcessing || paymentConfirmed">
            <!-- Warning Alert if test had warnings -->
            <VAlert 
              v-if="hasTestWarnings" 
              type="warning" 
              variant="tonal" 
              class="mb-4"
              icon="mdi-alert-triangle"
            >
              <strong>{{ t('core.subscriptionManager.testWarningsTitle') }}</strong> {{ t('core.subscriptionManager.testWarningsMessage') }}
            </VAlert>
            <VRow v-if="!paymentProcessing && !paymentConfirmed" class="mb-4">
              <VCol cols="12" class="pb-0">
                <VCard class="payment-info-card" elevation="2">
                  <VCardTitle 
                    class="d-flex align-center"
                    :style="{
                      backgroundColor: theme.global.name.value === 'dark' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)',
                      color: theme.global.name.value === 'dark' ? 'rgba(165, 214, 167, 1)' : 'rgba(27, 94, 32, 1)',
                      borderBottom: theme.global.name.value === 'dark' ? '2px solid rgba(76, 175, 80, 0.3)' : '2px solid rgba(76, 175, 80, 0.4)'
                    }"
                  >
                    <VIcon 
                      class="mr-3" 
                      size="24" 
                      :style="{
                        color: theme.global.name.value === 'dark' ? 'rgba(165, 214, 167, 1)' : 'rgba(27, 94, 32, 1)'
                      }"
                    >mdi-check-circle</VIcon>
                    <div>
                      <div
                        class="text-h6" :style="{
                          color: theme.global.name.value === 'dark' ? 'rgba(165, 214, 167, 1)' : 'rgba(27, 94, 32, 1)'
                        }">{{ t('core.subscriptionManager.registrationSuccessful') }}</div>
                      <div
                        class="text-subtitle-2"
                        :style="{
                          color: theme.global.name.value === 'dark' ? 'rgba(129, 199, 132, 0.9)' : 'rgba(46, 125, 50, 0.9)',
                          opacity: 0.9
                        }"
                      >{{ t('core.subscriptionManager.appReadyForDeployment') }}</div>
                    </div>
                  </VCardTitle>
                  <VCardText class="px-4 pt-4 pb-2">
                    <VList class="bg-transparent payment-info-list">
                      <VListItem class="px-0 py-1">
                        <template #prepend>
                          <VIcon color="success" class="mr-3">mdi-clock-check</VIcon>
                        </template>
                        <VListItemTitle class="text-body-1">
                          <strong>{{ t('core.subscriptionManager.paymentWindow') }}</strong> {{ t('core.subscriptionManager.paymentWindowTime') }}
                        </VListItemTitle>
                      </VListItem>

                      <VListItem class="px-0 py-1">
                        <template #prepend>
                          <VIcon color="primary" class="mr-3">mdi-calendar-end</VIcon>
                        </template>
                        <VListItemTitle class="text-body-1">
                          <strong>{{ t('core.subscriptionManager.subscriptionUntil') }}</strong> {{ subscribedTill }}
                        </VListItemTitle>
                      </VListItem>

                      <VListItem class="px-0 py-1">
                        <template #prepend>
                          <VIcon color="warning" class="mr-3">mdi-rocket-launch</VIcon>
                        </template>
                        <VListItemTitle class="text-body-1">
                          <strong>{{ t('core.subscriptionManager.deploymentTime') }}</strong> {{ t('core.subscriptionManager.deploymentTimeEstimate') }}
                        </VListItemTitle>
                      </VListItem>
                    </VList>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>

            <!-- Deployment Success -->
            <div v-if="paymentConfirmed && !paymentProcessing" class="payment-monitoring-container">
              <VRow no-gutters class="justify-center">
                <VCol cols="12" class="pa-3">
                  <VCard elevation="2" class="deployment-success-card">
                    <VCardText class="pa-8 text-center">
                      <VIcon icon="mdi-check-circle" size="80" color="success" class="mb-4" />
                      <h2 class="text-h4 font-weight-bold mb-3 text-success">
                        {{ props.newApp ? t('core.subscriptionManager.deploymentSuccessful') : t('core.subscriptionManager.updateSuccessful') }}
                      </h2>
                      <p class="text-body-1 mb-6 text-medium-emphasis">
                        {{ props.newApp
                          ? t('core.subscriptionManager.deploymentSuccessMessage')
                          : t('core.subscriptionManager.updateSuccessMessage')
                        }}
                      </p>
                      <VBtn
                        v-if="props.newApp"
                        color="primary"
                        size="large"
                        :to="`/apps/manage/${appDetails.name}`"
                      >
                        <VIcon start>mdi-cog</VIcon>
                        {{ t('core.subscriptionManager.manageApplication') }}
                      </VBtn>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </div>

            <!-- Payment Monitoring Spinner (MOVED OUTSIDE PAYMENT SECTION - separate from payment cards) -->
            {{ console.log('🎬 MONITORING SECTION RENDER:', {
              paymentProcessing: paymentProcessing,
              paymentConfirmed: paymentConfirmed,
              shouldShow: paymentProcessing && !paymentConfirmed
            }) }}
            <div v-if="paymentProcessing && !paymentConfirmed" class="payment-monitoring-container">
              <VRow no-gutters class="justify-center">
                <VCol cols="12" class="pa-3">
                  <VCard elevation="2" class="payment-monitoring-card">
                    <VCardText class="pa-6">
                      <LoadingSpinner
                        icon="mdi-rocket-launch"
                        :icon-size="48"
                        :title="t('core.subscriptionManager.waitingForDeployment')"
                        message=""
                      />
                      <div class="d-flex justify-center">
                        <div class="deployment-monitoring-wrapper">
                          <div class="deployment-message-box">
                            <div class="d-flex align-center">
                              <VIcon color="success" size="20" class="mr-2">mdi-check-circle</VIcon>
                              <span v-if="props.newApp || props.isRedeploy">{{ t('core.subscriptionManager.autoDetectDeployment') }}</span>
                              <span v-else-if="appSpecPrice?.flux === 0">{{ t('core.subscriptionManager.autoDetectUpdate') }}</span>
                              <span v-else>{{ t('core.subscriptionManager.autoDetectPaymentUpdate') }}</span>
                            </div>
                            <div class="d-flex align-center">
                              <VIcon color="warning" size="20" class="mr-2">mdi-clock-alert</VIcon>
                              <span>{{ t('core.subscriptionManager.detectionTimeEstimate') }}</span>
                            </div>
                          </div>
                          <VBtn
                            variant="outlined"
                            color="error"
                            class="mt-4"
                            block
                            @click="cancelPaymentMonitoring"
                          >
                            <VIcon start size="20">mdi-close-circle</VIcon>
                            {{ t('core.subscriptionManager.cancelMonitoring') }}
                          </VBtn>
                        </div>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </div>

            <!-- Payment Method Selection Label -->
            <div v-if="!paymentProcessing && !paymentConfirmed" class="payment-methods-container" style="margin-top: 0;">
              <VRow no-gutters class="justify-center">
                <VCol cols="12" sm="12" md="12" lg="10" xl="8" class="px-3 pb-3 pt-1">
                  <div class="payment-method-selection-label">
                    <VAvatar size="48" color="primary" variant="flat" class="mr-3">
                      <VIcon size="28" color="white">mdi-credit-card-outline</VIcon>
                    </VAvatar>
                    <span>{{ t('core.subscriptionManager.selectPaymentMethod') }}</span>
                  </div>
                </VCol>
              </VRow>
            </div>

            <!-- Payment Methods -->
            <div v-if="!paymentProcessing && !paymentConfirmed" class="payment-methods-container">
              <VRow no-gutters class="justify-center">
                <!-- Fiat Payment -->
                <VCol cols="12" sm="6" md="6" lg="5" xl="4" class="pa-3">
                  <VCard 
                    class="payment-method-card h-100" 
                    elevation="0"
                    variant="outlined"
                    :class="{ 'card-disabled': !stripeEnabled && !paypalEnabled }"
                  >
                    <VCardTitle class="payment-header bg-gradient-primary">
                      <div class="d-flex align-center">
                        <VAvatar size="40" color="white" variant="tonal" class="me-3">
                          <VIcon color="primary" size="24">mdi-credit-card</VIcon>
                        </VAvatar>
                        <div class="text-white">
                          <div class="text-h6 font-weight-bold">{{ t('core.subscriptionManager.payWithCard') }}</div>
                          <div class="text-subtitle-2 opacity-90">{{ t('core.subscriptionManager.secureInstantPayment') }}</div>
                        </div>
                      </div>
                    </VCardTitle>

                    <VCardText class="pa-6">
                      <div class="text-center">
                        <!-- Payment Icons -->
                        <div class="payment-icons-grid mb-4">
                          <VCard
                            v-if="stripeEnabled"
                            variant="outlined"
                            class="payment-icon-card"
                            @click="() => initStripePay(registrationHash, appDetails.name, appSpecPrice?.usd, appDetails.description)"
                            hover
                          >
                            <VCardText class="d-flex align-center justify-center pa-6">
                              <img
                                class="payment-brand-icon-small"
                                :src="StripeImg"
                                alt="Stripe"
                              />
                            </VCardText>
                          </VCard>

                          <VCard
                            v-if="paypalEnabled"
                            variant="outlined"
                            class="payment-icon-card"
                            @click="() => initPaypalPay(registrationHash, appDetails.name, appSpecPrice?.usd, appDetails.description)"
                            hover
                          >
                            <VCardText class="d-flex align-center justify-center pa-6">
                              <img
                                class="payment-brand-icon-small"
                                :src="PayPalThemeImg"
                                alt="PayPal"
                              />
                            </VCardText>
                          </VCard>
                        </div>
                        
                        <!-- USD Price Display -->
                        <div v-if="stripeEnabled || paypalEnabled" class="mt-4 mb-4">
                          <VChip color="success" variant="flat" size="large">
                            ${{ appSpecPrice?.usd || 0 }} USD + VAT
                          </VChip>
                        </div>

                        <!-- Payment Advantages -->
                        <div v-if="stripeEnabled || paypalEnabled" class="mb-4">
                          <div class="payment-field-container mb-2">
                            <div class="payment-field-label">
                              <VIcon color="success">mdi-shield-check</VIcon>
                            </div>
                            <div class="payment-field-value">
                              {{ t('core.subscriptionManager.securePaymentProcessing') }}
                            </div>
                          </div>
                          <div class="payment-field-container mb-2">
                            <div class="payment-field-label">
                              <VIcon color="success">mdi-clock-fast</VIcon>
                            </div>
                            <div class="payment-field-value">
                              {{ t('core.subscriptionManager.instantPaymentConfirmation') }}
                            </div>
                          </div>
                          <div class="payment-field-container">
                            <div class="payment-field-label">
                              <VIcon color="success">mdi-currency-usd</VIcon>
                            </div>
                            <div class="payment-field-value">
                              {{ t('core.subscriptionManager.multipleCurrencySupport') }}
                            </div>
                          </div>
                        </div>

                        <!-- Warning -->
                        <VAlert
                          v-if="!stripeEnabled && !paypalEnabled"
                          type="warning"
                          variant="tonal"
                          class="mb-0"
                          icon="mdi-alert-circle"
                        >
                          {{ t('core.subscriptionManager.fiatGatewaysUnavailable') }}
                        </VAlert>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>

                <!-- Crypto Payment -->
                <VCol cols="12" sm="6" md="6" lg="5" xl="4" class="pa-3">
                  <VCard 
                    class="payment-method-card h-100" 
                    elevation="0"
                    variant="outlined"
                  >
                    <VCardTitle class="payment-header bg-gradient-warning">
                      <div class="d-flex align-center">
                        <VAvatar size="40" color="white" variant="tonal" class="me-3">
                          <VIcon color="warning" size="24">mdi-lightning-bolt</VIcon>
                        </VAvatar>
                        <div class="text-white">
                          <div class="text-h6 font-weight-bold">{{ t('core.subscriptionManager.payWithFlux') }}</div>
                          <div class="text-subtitle-2 opacity-90">{{ t('core.subscriptionManager.cryptocurrencyPayment') }}</div>
                        </div>
                      </div>
                    </VCardTitle>
                    
                    <VCardText class="pa-6">
                      <!-- Wallet Options -->
                      <div class="text-center">
                        <div class="wallet-icons-grid mb-4">
                          <VCard
                            variant="outlined"
                            class="wallet-icon-card"
                            @click="initZelcorePay"
                            hover
                          >
                            <VCardText class="d-flex align-center justify-center pa-6">
                              <img
                                class="wallet-brand-icon mr-3"
                                :src="FluxIDImg"
                                alt="Zelcore"
                              />
                              <span class="text-h6 font-weight-medium">Zelcore</span>
                            </VCardText>
                          </VCard>

                          <VCard
                            variant="outlined"
                            class="wallet-icon-card"
                            @click="initSSPPay"
                            hover
                          >
                            <VCardText class="d-flex align-center justify-center pa-6">
                              <img
                                class="wallet-brand-icon mr-3"
                                :src="SSPLogoThemeImg"
                                alt="SSP"
                              />
                              <span class="text-h6 font-weight-medium">SSP</span>
                            </VCardText>
                          </VCard>
                        </div>

                        <!-- FLUX Price Display -->
                        <div class="text-center mb-4">
                          <VChip color="primary" variant="flat" size="large">
                            <VIcon start size="16">mdi-lightning-bolt</VIcon>
                            {{ appSpecPrice?.flux || 0 }} FLUX
                            <VChip
                              v-if="appSpecPrice?.fluxDiscount > 0"
                              color="success"
                              variant="flat"
                              size="x-small"
                              class="ml-2"
                            >
                              -{{ appSpecPrice.fluxDiscount }}%
                            </VChip>
                          </VChip>
                        </div>

                        <!-- Payment Details -->
                        <VCard variant="flat">
                          <VCardText class="pa-4">
                            <!-- Address Field -->
                            <div class="mb-3">
                              <div class="payment-field-container">
                                <div class="payment-field-label">
                                  <VIcon size="16" class="mr-1">mdi-wallet</VIcon>
                                  {{ t('core.subscriptionManager.sendTo') }}
                                </div>
                                <div class="payment-field-value">
                                  {{ deploymentAddress || t('common.status.loading') }}
                                </div>
                                <VBtn
                                  icon
                                  variant="plain"
                                  size="small"
                                  class="copy-btn payment-field-copy"
                                  :data-clipboard-text="deploymentAddress"
                                  :disabled="!deploymentAddress"
                                >
                                  <VIcon size="20" color="grey">mdi-content-copy</VIcon>
                                  <VTooltip activator="parent" location="top">
                                    {{ t('core.subscriptionManager.copyAddress') }}
                                  </VTooltip>
                                </VBtn>
                              </div>
                            </div>

                            <!-- Message Field -->
                            <div>
                              <div class="payment-field-container">
                                <div class="payment-field-label">
                                  <VIcon size="16" class="mr-1">mdi-message-text</VIcon>
                                  {{ t('core.subscriptionManager.message') }}
                                </div>
                                <div class="payment-field-value">
                                  {{ registrationHash || t('common.status.loading') }}
                                </div>
                                <VBtn
                                  icon
                                  variant="plain"
                                  size="small"
                                  class="copy-btn payment-field-copy"
                                  :data-clipboard-text="registrationHash"
                                  :disabled="!registrationHash"
                                >
                                  <VIcon size="20" color="grey">mdi-content-copy</VIcon>
                                  <VTooltip activator="parent" location="top">
                                    {{ t('core.subscriptionManager.copyMessage') }}
                                  </VTooltip>
                                </VBtn>
                              </div>
                            </div>
                          </VCardText>
                        </VCard>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </div>
          </div>
        </div>
      </VWindowItem>
    </VWindow>
  </VCard>

  <VSnackbar
    v-model="snackbar.model"
    :timeout="snackbar.timeout"
    :color="snackbar.color"
    location="top"
    :elevation="4"
    variant="flat"
    class="mb-2"
  >
    <div class="d-flex align-center">
      <VIcon
        v-if="snackbar.icon"
        :icon="snackbar.icon"
        class="me-2"
      />
      <span>{{ snackbar.text }}</span>
    </div>
  </VSnackbar>
  
  <!-- Node Selection Dialog -->
  <VDialog
    v-model="showNodeSelectionDialog"
    max-width="90%"
    persistent
  >
    <VCard rounded="xl">
      <VCardTitle class="d-flex justify-space-between align-center bg-primary">
        <div class="d-flex align-center">
          <VIcon class="ml-3 mr-2" color="white">mdi-server-network</VIcon>
          <span class="text-h5 text-white">{{ props.appSpec?.version === 7 ? t('core.subscriptionManager.selectEnterpriseNodes') : t('core.subscriptionManager.selectPriorityNodes') }}</span>
        </div>
        <VBtn
          icon="mdi-close"
          variant="text"
          color="white"
          size="small"
          class="mr-3 close-btn-hover"
          @click="showNodeSelectionDialog = false"
        />
      </VCardTitle>

      <VCardText>
        <VAlert
          v-if="props.appSpec?.version === 7"
          type="info"
          variant="tonal"
          class="mb-4"
        >
          <strong>{{ t('core.subscriptionManager.enterpriseNodesLabel') }}</strong> {{ t('core.subscriptionManager.enterpriseNodesDescription') }}
        </VAlert>
        <VAlert
          v-else
          type="info"
          variant="tonal"
          class="mb-4"
        >
          <strong>{{ t('core.subscriptionManager.priorityNodesLabel') }}</strong> {{ t('core.subscriptionManager.priorityNodesDescription') }}
        </VAlert>

        <!-- Search and Filter Controls -->
        <VRow class="mb-4">
          <VCol cols="12" md="6">
            <VTextField
              v-model="nodeFilter"
              :label="t('core.subscriptionManager.searchNodes')"
              clearable
              hide-details
              density="compact"
            >
              <template #prepend-inner>
                <VIcon size="20">mdi-magnify</VIcon>
              </template>
            </VTextField>
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="nodePerPage"
              :items="[5, 10, 25, 50]"
              :label="t('core.subscriptionManager.perPage')"
              hide-details
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="3" class="d-flex align-center">
            <VChip color="primary" variant="tonal">
              <VIcon class="mr-1">mdi-check-circle</VIcon>
              {{ t('core.subscriptionManager.nodesSelected', { count: selectedNodes.length }) }}
            </VChip>
          </VCol>
        </VRow>
        <VSheet border rounded class="mt-2 mb-3">
          <!-- Nodes Table -->
          <VDataTable
            :headers="nodeSelectionHeaders"
            :items="paginatedFilteredNodes"
            :items-per-page="-1"
            hide-default-footer
            :loading="isLoadingNodes"
            class="elevation-1"
            item-value="ip"
            v-model:expanded="expandedDialogRows"
            show-expand
          >
            <template #item.select="{ item }">
              <VCheckbox
                :model-value="item.isSelected"
                @update:model-value="toggleNodeSelection(item)"
                hide-details
              />
            </template>
          
            <template #expanded-row="{ item, columns }">
              <td :colspan="columns.length">
                <VCard flat class="ma-2">
                  <VCardText>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.ipAddressLabel') }}</strong>
                      <span>{{ item.ip }}</span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.publicKeyLabel') }}</strong>
                      <span class="text-break">
                        {{ item.pubkey || 'N/A' }}
                      </span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.nodeAddressLabel') }}</strong>
                      <span class="text-break">
                        {{ item.payment_address }}
                      </span>
                    </div>
                    <div v-if="item.txhash && item.outidx" class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.collateralLabel') }}</strong>
                      <span class="text-break">
                        {{ item.txhash }}:{{ item.outidx }}
                      </span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.tierLabel') }}</strong>
                      {{ item.tier }}
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.overallScore') }}</strong>
                      <span>{{ item.score }}</span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.collateralScoreLabel') }}</strong>
                      <span>{{ item.collateralPoints }}</span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.maturityScore') }}</strong>
                      <span>{{ item.maturityPoints }}</span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.publicKeyScoreLabel') }}</strong>
                      <span>{{ item.pubKeyPoints }}</span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.appsAssigned') }}</strong>
                      <span>{{ item.enterpriseApps }}</span>
                    </div>
                    <div v-if="item.status" class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">{{ t('core.subscriptionManager.statusLabel') }}</strong>
                      {{ item.status || 'confirmed' }}
                    </div>
                    <div class="mt-3">
                      <VBtn
                        size="small"
                        color="primary"
                        @click="visitFluxNode(item.ip)"
                      >
                        {{ t('core.subscriptionManager.visitFluxNode') }}
                      </VBtn>
                    </div>
                  </VCardText>
                </VCard>
              </td>
            </template>
          
            <template #item.tier="{ item }">
              <VChip
                :color="item.tier === 'CUMULUS' ? 'success' : item.tier === 'NIMBUS' ? 'warning' : 'error'"
                size="small"
                variant="tonal"
              >
                {{ item.tier }}
              </VChip>
            </template>
          
            <template #item.score="{ item }">
              <span class="ml-1">{{ item.score }}</span>
            </template>
          
            <template #item.status="{ item }">
              <VChip
                :color="item.status === 'confirmed' ? 'success' : 'warning'"
                size="small"
                variant="tonal"
              >
                {{ item.status || 'confirmed' }}
              </VChip>
            </template>
          
            <template #loading>
              <VSkeletonLoader type="table-row@10" />
            </template>
          
            <template #no-data>
              <div class="text-center pa-4">
                <VIcon size="48" color="grey">mdi-server-network-off</VIcon>
                <p class="mt-2 text-grey">
                  {{ nodeFilter ? t('core.subscriptionManager.noNodesMatch') : t('core.subscriptionManager.noNodesAvailable') }}
                </p>
              </div>
            </template>
          </VDataTable>
        </VSheet>
        
        <!-- Custom Pagination for Dialog -->
        <div v-if="filteredNodes.length > 0" class="d-flex justify-center align-center pa-3">
          <VBtn
            icon="mdi-chevron-left"
            size="small"
            variant="text"
            :disabled="dialogCurrentPage === 1"
            @click="dialogCurrentPage--"
          />
          <span class="mx-3">
            {{ t('core.subscriptionManager.pageOf', { current: dialogCurrentPage, total: dialogTotalPages }) }}
          </span>
          <VBtn
            icon="mdi-chevron-right"
            size="small"
            variant="text"
            :disabled="dialogCurrentPage === dialogTotalPages"
            @click="dialogCurrentPage++"
          />
        </div>
      </VCardText>
      
      <VCardActions class="px-6 pb-4 pt-0">
        <VBtn
          variant="flat"
          color="error"
          size="small"
          class="ml-3"
          @click="showNodeSelectionDialog = false"
        >
          {{ t('common.buttons.cancel') }}
        </VBtn>
        <VSpacer />
        <VBtn
          variant="flat"
          color="primary"
          size="small"
          class="mr-3"
          @click="saveNodeSelection"
          :disabled="selectedNodes.length === 0"
        >
          <VIcon class="mr-1">mdi-check</VIcon>
          {{ t('core.subscriptionManager.saveSelection', { count: selectedNodes.length }) }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Import JSON Dialogs -->
  <ImportJsonDialog
    v-model="showEnvImportDialog"
    type="env"
    @import="handleEnvImport"
  />
  <ImportJsonDialog
    v-model="showCommandsImportDialog"
    type="commands"
    @import="handleCommandsImport"
  />
  <ImportSpecDialog
    v-model="showSpecImportDialog"
    @import="handleSpecImport"
  />

  <!-- Upgrade Spec Dialog -->
  <UpgradeSpecDialog
    v-model="showUpgradeDialog"
    :current-version="specVersion"
    :target-version="LATEST_SPEC_VERSION"
    @confirm="convertToLatestSpec"
  />

  <!-- Popup Blocked Dialog -->
  <VDialog v-model="popupBlockedDialog" max-width="500">
    <VCard rounded="xl" class="overflow-hidden">
      <VCardTitle class="d-flex align-center gap-3 bg-primary text-white" style="height: 52px; padding-inline: 16px;">
        <VIcon icon="mdi-alert-circle" color="orange" size="28" />
        <span class="text-h6">{{ t('core.subscriptionManager.popupBlocked') }}</span>
      </VCardTitle>
      <VCardText class="py-8 px-6 text-center">
        <VIcon icon="mdi-block-helper" color="orange" size="64" class="mb-4" />
        <p class="text-body-1 mb-3">
          {{ t('core.subscriptionManager.popupBlockedMessage', { type: blockedPaymentType }) }}
        </p>
        <p class="text-body-2 text-medium-emphasis">
          {{ t('core.subscriptionManager.popupBlockedInstruction') }}
        </p>
      </VCardText>
      <VCardActions class="pa-0 d-flex ga-0">
        <VBtn
          color="error"
          variant="flat"
          size="large"
          class="rounded-0 rounded-bl-xl popup-dialog-btn"
          style="flex: 1; max-width: 50%;"
          @click="() => { popupBlockedDialog = false; cancelPaymentMonitoring(); }"
        >
          <VIcon start icon="mdi-close-circle" />
          {{ t('common.buttons.cancel') }}
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          size="large"
          class="rounded-0 rounded-br-xl popup-dialog-btn"
          style="flex: 1; max-width: 50%;"
          @click="openBlockedPayment"
        >
          <VIcon start icon="mdi-open-in-new" />
          {{ t('core.subscriptionManager.openPayment') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Manual Signing Dialog -->
  <ManualSignDialog
    v-model="showManualSignDialog"
    :message="manualSignMessage"
    @submit="submitManualSignature"
    @cancel="cancelManualSign"
    @copy="showToast('success', t('core.subscriptionManager.copiedToClipboard'))"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

const props = defineProps({
  appSpec: Object,
  newApp: Boolean,
  executeLocalCommand: Function,
  resetTrigger: Number, // Timestamp to trigger internal tab reset when subscription tab becomes active
  isRedeploy: Boolean, // Flag to indicate if this is a redeploy operation
  instanceReady: Boolean, // Flag to indicate if instance/location is loaded (for existing apps)
})

// Define emits
defineEmits(['specConverted'])
const { t } = useI18n()
import geolocations from '@/utils/geolocation'
import qs from 'qs'
import { signWithWalletConnect, getConnectedAccount, payWithSSP, payWithZelcore, signWithSSP, signWithZelcore } from '@/utils/walletService'
import { getUser } from '@/utils/firebase'
import { getDetectedBackendURL } from "@/utils/backend"
import { paymentBridge } from '@/utils/fiatGateways'
import AppsService from "@/services/AppsService"
import ExplorerService from '@/services/ExplorerService'
import { storeToRefs } from "pinia"
import ManualSignDialog from '@/@core/components/ManualSignDialog.vue'
import { useFluxStore } from "@/stores/flux"
import { useTheme, useDisplay } from 'vuetify'
import ImportJsonDialog from '@/components/dialogs/ImportJsonDialog.vue'
import ImportSpecDialog from '@/components/dialogs/ImportSpecDialog.vue'
import UpgradeSpecDialog from '@/components/dialogs/UpgradeSpecDialog.vue'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import ClipboardJS from 'clipboard'
import {
  importRsaPublicKey,
  encryptAesKeyWithRsaKey,
  encryptEnterpriseWithAes,
  encryptMessage,
  getEnterprisePGPKeys,
  isWebCryptoAvailable,
} from '@/utils/enterpriseCrypto'
import { convertToLatestVersion, LATEST_SPEC_VERSION as SPEC_LATEST_VERSION } from '@/utils/specConverter'

// Import payment images
import StripeImg from '@images/Stripe.svg?url'
import PayPalImg from '@images/PayPal.png?url'
import FluxIDImg from '@images/FluxID.svg?url'
import SSPLogoBlackImg from '@images/ssp-logo-black.svg?url'
import SSPLogoWhiteImg from '@images/ssp-logo-white.svg?url'

// Spec version constants
const LATEST_SPEC_VERSION = SPEC_LATEST_VERSION
const specVersion = computed(() => props.appSpec?.version || LATEST_SPEC_VERSION)

// Version feature flags - control UI visibility based on spec version
const versionFlags = computed(() => ({
  supportsInstances: specVersion.value >= 3,      // V3+: instances field
  supportsCompose: specVersion.value >= 4,        // V4+: compose array (multi-component)
  supportsContacts: specVersion.value >= 5,       // V5+: contacts array
  supportsGeolocation: specVersion.value >= 5,    // V5+: geolocation array
  supportsExpire: specVersion.value >= 6,         // V6+: expire field
  supportsNodes: specVersion.value >= 7,          // V7+: nodes array
  supportsStaticIp: specVersion.value >= 7,       // V7+: staticip field
  supportsRepoAuth: specVersion.value >= 7,       // V7+: repoauth per component
}))

const signature = ref('')
const timestamp = ref(Date.now())
const updatetype = computed(() => props.newApp ? 'fluxappregister' : 'fluxappupdate')
const version = 1
const signClient = ref(null)
const websocket = ref(null)
const loginType  = ref(localStorage.getItem('loginType'))
const isSigning = ref(false) // Track if signing is in progress
const signingFailed = ref(false) // Track if signing failed
const clipboardInstance = ref(null) // ClipboardJS instance for proper cleanup
const tab = ref(0)
const renewalEnabled = ref(false)
const managementAction = ref('renewal') // Management action: 'renewal', 'update', 'cancel'
const isNameLocked = ref(false)
const isUploadingCmd = ref(false)
const isUploadingEnv = ref(false)
const isUploadingContacts = ref(false)
const fiatCheckoutURL = ref('')
const checkoutLoading = ref(false)
const logsExpanded = ref(true)
const paymentCompleted = ref(false)
const paymentMethod = ref('')
const paymentAmount = ref(0)
const paymentMonitoringInterval = ref(null)
const paymentMonitoringTimeout = ref(null)
const paymentConfirmed = ref(false)
const paymentProcessing = ref(false)
const popupBlockedDialog = ref(false)
const blockedPaymentUrl = ref('')
const blockedPaymentType = ref('')

// Spec version upgrade
const availableVersions = [3, 4, 5, 6, 7, 8]
const isConverting = ref(false)
const showUpgradeDialog = ref(false)

// Helper function to check if payment method is crypto
function isCryptoPayment(method) {
  return ['Zelcore', 'SSP'].includes(method)
}

// Check for payment success on page load
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const paymentSuccess = urlParams.get('payment_success')
  const paymentMethod = urlParams.get('payment_method')
  const amount = urlParams.get('amount')
  
  if (paymentSuccess === 'true') {
    // Only handle URL parameter success for card payments (Stripe/PayPal)
    const methodFromUrl = urlParams.get('payment_method')
    if (methodFromUrl && !isCryptoPayment(methodFromUrl)) {
      paymentCompleted.value = true
      paymentMethod.value = methodFromUrl
      if (amount) paymentAmount.value = parseFloat(amount)
      showToast('success', t('core.subscriptionManager.cardPaymentCompletedSuccessfully'))
      
      // Clean up URL parameters
      const newUrl = window.location.pathname
      window.history.replaceState(null, '', newUrl)
    }
  }
})

// Theme-aware images
const theme = useTheme()
const display = useDisplay()
const PayPalThemeImg = computed(() => {
  return PayPalImg // Use the main PayPal.png file for both themes
})
const SSPLogoThemeImg = computed(() => {
  return theme.global.name.value === 'dark' ? SSPLogoWhiteImg : SSPLogoBlackImg
})

const allowedGeolocations = ref([])
const forbiddenGeolocations = ref([])

const selectedAllowed = ref({ continent: 'ALL', country: 'ALL', region: 'ALL' })
const selectedForbidden = ref({ continent: 'NONE', country: 'ALL', region: 'ALL' })

const possibleLocations = ref([])

// Computed tab items based on app version
const tabItems = computed(() => {
  const baseItems = [
    { label: t('core.subscriptionManager.tabGeneral'), icon: 'mdi-application', value: 0 },
  ]

  // Only show Geolocation tab for V5+
  if (versionFlags.value.supportsGeolocation) {
    baseItems.push({ label: t('core.subscriptionManager.tabGeolocation'), icon: 'mdi-earth', value: 1 })
  }

  // Only show Priority/Enterprise Nodes tab for v7+ private apps (before Components tab)
  if (props.appSpec?.version >= 7 && isPrivateApp.value) {
    baseItems.push({
      label: props.appSpec?.version === 7
        ? t('core.subscriptionManager.tabEnterpriseNodes')
        : t('core.subscriptionManager.tabPriorityNodes'),
      icon: 'mdi-server-network',
      value: 2,
    })
  }

  // Components tab always shown
  baseItems.push({ label: t('core.subscriptionManager.tabComponents'), icon: 'mdi-cube', value: 3 })

  return baseItems
})

const appDetails = ref({
  name: '',
  description: '',
  owner: '',
  contacts: '',
  instances: 3,
  staticip: false,
  enterprise: '',
  nodes: '',
  renewalIndex: 0, // UI only
})

const isPrivateApp = ref(false)

const marketPlaceApps = ref([])
const generalMultiplier = ref(10)
const isMarketplaceApp = ref(false)

// Computed property to check if current app is marketplace app
const currentAppIsMarketplace = computed(() => {
  const appName = props.appSpec?.name || appDetails.value.name
  console.log('Checking marketplace status for:', appName)
  console.log('Marketplace apps count:', marketPlaceApps.value.length)

  if (!appName || !marketPlaceApps.value.length) {
    console.log('Not marketplace - no app name or no marketplace data')

    return false
  }

  const appNameLower = appName.toLowerCase()

  // Log ALL marketplace app names for debugging
  console.log('All marketplace apps:', marketPlaceApps.value.map(a => a.name))

  const isMarketplace = marketPlaceApps.value.some(app => {
    const marketplaceNameLower = app.name.toLowerCase()
    const matches = appNameLower.startsWith(marketplaceNameLower)
    if (matches) {
      console.log('Marketplace app matched:', app.name)
    }

    return matches
  })

  console.log('Is marketplace app:', isMarketplace)

  return isMarketplace
})

// Priority/Enterprise Nodes
const selectedNodes = ref([])
const showNodeSelectionDialog = ref(false)
const enterpriseNodes = ref([])
const availableNodes = ref([])
const nodeFilter = ref('')
const selectedNodesFilter = ref('')
const nodePerPage = ref(5)
const selectedNodesCurrentPage = ref(1)
const selectedNodesPerPage = ref(10)
const dialogCurrentPage = ref(1)
const isLoadingNodes = ref(false)
const maximumEnterpriseNodes = 120
const expandedRows = ref([])
const expandedDialogRows = ref([])

const nodeTableHeaders = computed(() => [
  { title: '', key: 'data-table-expand', sortable: false, width: '50px' },
  { title: t('core.subscriptionManager.ipAddress'), key: 'ip' },
  { title: t('core.subscriptionManager.nodeAddress'), key: 'payment_address' },
  { title: t('core.subscriptionManager.tier'), key: 'tier' },
  { title: t('core.subscriptionManager.overallScore'), key: 'score' },
  { title: '', key: 'actions', sortable: false },
])

const nodeSelectionHeaders = computed(() => [
  { title: t('core.subscriptionManager.select'), key: 'select', sortable: false },
  { title: t('core.subscriptionManager.ipAddress'), key: 'ip' },
  { title: t('core.subscriptionManager.nodeAddress'), key: 'payment_address' },
  { title: t('core.subscriptionManager.tier'), key: 'tier' },
  { title: t('core.subscriptionManager.overallScore'), key: 'score' },
  { title: t('core.subscriptionManager.status'), key: 'status' },
])


const commandsDialog = reactive({
  show: false,
  componentIndex: null,
  entries: [],
  newCommand: '',
})

function openCommandsDialog(index) {
  const component = props.appSpec.compose[index]
  commandsDialog.show = false

  requestAnimationFrame(() => {
    commandsDialog.componentIndex = index
    commandsDialog.entries = [...(component.commands || [])]
    commandsDialog.newCommand = ''
    commandsDialog.show = true
  })
}

function addCommandEntry() {
  const cmd = commandsDialog.newCommand.trim()
  if (!cmd) return showToast('error', 'Command cannot be empty.')
  commandsDialog.entries.push(cmd)
  commandsDialog.newCommand = ''
}

function removeCommandEntry(i) {
  commandsDialog.entries.splice(i, 1)
}

function handleCommandsImport(commands) {
  commandsDialog.entries.push(...commands)
  showToast('success', `Imported ${commands.length} command(s)`)
}

function handleSpecImport(spec) {
  try {
    // Map imported spec to appSpec and appDetails
    if (spec.name) {
      props.appSpec.name = spec.name
      appDetails.value.name = spec.name
    }
    if (spec.description) {
      props.appSpec.description = spec.description
      appDetails.value.description = spec.description
    }
    if (spec.owner) {
      props.appSpec.owner = spec.owner
      appDetails.value.owner = spec.owner
    }
    if (spec.repotag) props.appSpec.repotag = spec.repotag
    if (spec.port) props.appSpec.port = spec.port
    if (spec.domains) props.appSpec.domains = spec.domains
    if (spec.tiered !== undefined) props.appSpec.tiered = spec.tiered
    if (spec.version) props.appSpec.version = spec.version

    // Contacts - required field, provide default if missing
    props.appSpec.contacts = spec.contacts || []
    appDetails.value.contacts = Array.isArray(spec.contacts) ? spec.contacts.join(', ') : (spec.contacts || '')

    // Geolocation - required field, provide default if missing
    props.appSpec.geolocation = spec.geolocation || []

    if (spec.expire) props.appSpec.expire = spec.expire
    if (spec.nodes) {
      props.appSpec.nodes = spec.nodes || []
      appDetails.value.nodes = Array.isArray(spec.nodes) ? spec.nodes.join(', ') : spec.nodes
    }
    if (spec.instances !== undefined) {
      props.appSpec.instances = spec.instances
      appDetails.value.instances = spec.instances
    }
    if (spec.staticip !== undefined) {
      props.appSpec.staticip = spec.staticip
      appDetails.value.staticip = spec.staticip
    }
    if (spec.enterprise !== undefined) {
      props.appSpec.enterprise = spec.enterprise
      appDetails.value.enterprise = spec.enterprise
    }

    // Handle compose/components - preserve as-is from imported spec
    if (spec.compose && Array.isArray(spec.compose)) {
      props.appSpec.compose = spec.compose
    }

    // Handle legacy single component specs
    if (!spec.compose && spec.cpu !== undefined) {
      const component = {
        name: spec.name || '',
        description: spec.description || '',
        repotag: spec.repotag || '',
        ports: spec.ports || [],
        domains: spec.domains || [],
        environmentParameters: spec.environmentParameters || [],
        commands: spec.commands || [],
        containerPorts: spec.containerPorts || [],
        containerData: spec.containerData || '',
        cpu: spec.cpu || 0.1,
        ram: spec.ram || 100,
        hdd: spec.hdd || 1,
      }

      // Only add tiered if it exists in original spec
      if (spec.tiered !== undefined) component.tiered = spec.tiered
      props.appSpec.compose = [component]
    }

    // If currently on Validate & Register tab, trigger re-validation
    if (tab.value === 99) {
      // Force re-trigger by switching tabs and back
      const currentTab = tab.value
      tab.value = 0
      nextTick(() => {
        tab.value = currentTab
      })
    }

    showToast('success', 'Application specification imported successfully')
  } catch (error) {
    console.error('Error importing specification:', error)
    showToast('error', `Failed to import specification: ${error.message}`)
  }
}

function saveCommandChanges() {
  const index = commandsDialog.componentIndex
  if (index === null) return
  props.appSpec.compose[index].commands = [...commandsDialog.entries]
  commandsDialog.show = false
}

// Upgrade spec to latest version
function openConversionDialog() {
  if (!props.isRedeploy || specVersion.value >= LATEST_SPEC_VERSION) return
  showUpgradeDialog.value = true
}

function convertToLatestSpec() {
  isConverting.value = true

  try {
    const spec = props.appSpec

    // If already latest version, nothing to do
    if (spec.version >= LATEST_SPEC_VERSION) {
      showToast('info', 'Application is already using latest specification format')
      isConverting.value = false
      
      return
    }

    // Use the specConverter utility to convert
    const convertedSpec = convertToLatestVersion(spec)

    // Update props.appSpec with converted spec (keep the reference, just update properties)
    Object.keys(spec).forEach(key => delete spec[key])
    Object.assign(spec, convertedSpec)

    showToast('success', `Application upgraded from V${specVersion.value} to V${LATEST_SPEC_VERSION} successfully`)
  } catch (error) {
    console.error('Error converting specification:', error)
    showToast('error', `Failed to upgrade specification: ${error.message}`)
  } finally {
    isConverting.value = false
  }
}

// PON (proof of nodes) Fork configuration - block height where chain speed increases 4x
const FORK_BLOCK_HEIGHT = 2020000

// Base period: 1 month = 88000 blocks (post-fork, 30-second blocks)
// All renewal options use post-fork values since renewals happen NOW (post-fork)
const BLOCKS_PER_MONTH = 88000

// Renewal options (always post-fork values since we're renewing NOW)
const renewalOptions = ref([
  { value: Math.round(BLOCKS_PER_MONTH * (1/4)), label: t('core.subscriptionManager.renewal1Week') },     // ~1 week (22,000 blocks)
  { value: Math.round(BLOCKS_PER_MONTH * (1/2)), label: t('core.subscriptionManager.renewal2Weeks') },    // ~2 weeks (44,000 blocks)
  { value: BLOCKS_PER_MONTH, label: t('core.subscriptionManager.renewal1Month') },                         // 1 month (88,000 blocks)
  { value: BLOCKS_PER_MONTH * 3, label: t('core.subscriptionManager.renewal3Months') },                    // 3 months (264,000 blocks)
  { value: BLOCKS_PER_MONTH * 6, label: t('core.subscriptionManager.renewal6Months') },                    // 6 months (528,000 blocks)
  { value: BLOCKS_PER_MONTH * 12, label: t('core.subscriptionManager.renewal1Year') },                     // 1 year (1,056,000 blocks)
])

const timeOptions = { shortDate: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' } }

// State
const isVeryfitying = ref(false)
const verifyAppSpecResponse = ref(null)
const verifyAppSpecError = ref(null)
const appSpecPrice = ref(null)
const blockHeight = ref(null)
const isExpiryValid = ref(false)
const appSpecFormated = ref(null)
const blocksToExpire = ref(null)
const registrationHash = ref(null)
const isPropagating = ref(false)
const testError = ref(false)
const testFinished = ref(false)
const testRunning = ref(false)
const testOutput = ref([])
const showTestLogs = ref(false)
const deploymentAddress = ref(null)
const applicationPrice = ref(null)
const applicationPriceFluxDiscount = ref(0)
const stripeEnabled = ref(true)
const paypalEnabled = ref(true)
const subscribedTill = computed(() => {
  const now = new Date()
  now.setDate(now.getDate() + 30) // Default 30 days
  
  return now.toLocaleString('en-GB', timeOptions.shortDate)
})

// Section visibility flags
const hasValidatedSpec = ref(false)
const hasCalculatedPrice = ref(false)
const hasCheckedExpiry = ref(false)

const renewalLabels = computed(() => renewalOptions.value.map(opt => opt.label))

// Check if test output contains warnings
const hasTestWarnings = computed(() => {
  return testOutput.value.some(output => output.status === 'warning')
})

const snackbar = ref({
  model: false,
  text: '',
  color: 'info',
  icon: 'mdi-information',
  timeout: 4000,
})

let snackbarTimeout = null

function showToast(type, message, icon = null, timeout = 4000) {
  if (snackbarTimeout) clearTimeout(snackbarTimeout)

  snackbar.value.text = message
  snackbar.value.icon = icon || {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
    danger: 'mdi-alert-circle',
  }[type] || 'mdi-information'
  snackbar.value.color = type === 'danger' ? 'error' : type
  snackbar.value.timeout = timeout

  // Show the snackbar
  snackbar.value.model = true

  // Optional: auto-hide after timeout
  snackbarTimeout = setTimeout(() => {
    snackbar.value.model = false
  }, timeout)
}

// Cancel subscription function
function cancelSubscription() {
  // For V6+ apps, set expire to 100 blocks (~3.3 hours) to cancel subscription
  if (versionFlags.value.supportsExpire) {
    props.appSpec.expire = 100
    console.log('Canceling subscription - set expire to 100 blocks')

    // Navigate to Review & Validate tab
    tab.value = 99
  } else {
    showToast('error', 'Cancel subscription is only available for V6+ applications')
  }
}

// Watch for changes in appSpec to update appDetails
watch(() => props.appSpec, (newSpec, oldSpec) => {
  console.log('SubscriptionManager: appSpec changed:', newSpec)
  
  // Guard against unnecessary updates by checking if the spec actually changed
  if (newSpec && newSpec !== oldSpec) {
    console.log('SubscriptionManager: updating appDetails with owner:', newSpec.owner)
    
    // Only update if values are actually different to prevent circular updates
    if (newSpec.name !== appDetails.value.name) {
      appDetails.value.name = newSpec.name || ''
    }
    if (newSpec.description !== appDetails.value.description) {
      appDetails.value.description = newSpec.description || ''
    }

    // Always set owner if it exists in the spec or if current is empty
    if (newSpec.owner && newSpec.owner !== appDetails.value.owner) {
      appDetails.value.owner = newSpec.owner
    } else if (!appDetails.value.owner && newSpec.owner) {
      appDetails.value.owner = newSpec.owner
    }
    if (newSpec.contacts !== appDetails.value.contacts) {
      appDetails.value.contacts = newSpec.contacts || ''
    }
    if (newSpec.instances !== appDetails.value.instances) {
      appDetails.value.instances = newSpec.instances ?? 3
    }
    if (newSpec.staticip !== appDetails.value.staticip) {
      appDetails.value.staticip = newSpec.staticip ?? false
    }
    
    console.log('SubscriptionManager: appDetails.owner after update:', appDetails.value.owner)
    
    // Determine if this is a private app based on existing data
    // For v7: check if nodes exist
    // For v8+: check if enterprise field has encrypted content
    if (newSpec.version === 7 && newSpec.nodes && newSpec.nodes.length > 0) {
      isPrivateApp.value = true
    } else if (newSpec.version >= 8 && newSpec.enterprise && newSpec.enterprise !== '') {
      isPrivateApp.value = true
    } else {
      isPrivateApp.value = false
    }
    
    appDetails.value.nodes = newSpec.nodes ? newSpec.nodes.join(', ') : ''

    // Initialize selected nodes from appSpec
    if (newSpec.nodes && Array.isArray(newSpec.nodes)) {
      selectedNodes.value = newSpec.nodes.map(nodeIp => ({
        ip: nodeIp,
         
        payment_address: 'Loading...',
        tier: 'Loading...',
        score: 0,
      }))
    }

    // Set up renewal settings
    // Fork-aware default: if app was registered after fork, use 88000; otherwise 22000
    const defaultExpire = (newSpec.height && newSpec.height >= FORK_BLOCK_HEIGHT) ? 88000 : 22000
    let expire = newSpec.expire ?? defaultExpire

    // Convert pre-fork expire values to post-fork equivalent for renewalIndex matching
    // Pre-fork: 22,000 blocks = 1 month (at 2 min/block)
    // Post-fork: 88,000 blocks = 1 month (at 0.5 min/block)
    // Renewals always use post-fork values, so convert for display purposes
    if (newSpec.height && newSpec.height < FORK_BLOCK_HEIGHT) {
      expire = expire * 4  // Convert pre-fork to post-fork equivalent
    }

    const foundIndex = renewalOptions.value.findIndex(opt => opt.value === expire)
    appDetails.value.renewalIndex = foundIndex !== -1 ? foundIndex : 2
    
    // Handle enterprise nodes if applicable
    if (newSpec.nodes && Array.isArray(newSpec.nodes) && newSpec.nodes.length > 0) {
      // Try to get enterprise nodes to populate with real data
      getEnterpriseNodes()
    } else if (isPrivateApp.value && newSpec.version >= 7) {
      // Enterprise is enabled but no nodes yet - auto fetch nodes
      getEnterpriseNodes()
    }
  }
}, { immediate: true })

// Owner changes are already handled in the main appSpec watcher above
// No need for a separate owner watcher

onMounted(() => {
  console.log('SubscriptionManager onMounted - props.appSpec:', props.appSpec)
  console.log('SubscriptionManager onMounted - props.appSpec.owner:', props.appSpec?.owner)
  
  // Set default owner from logged-in user's zelid if not already set
  if (!appDetails.value.owner) {
    const zelidauth = localStorage.getItem('zelidauth')
    if (zelidauth) {
      try {
        const auth = qs.parse(zelidauth)
        if (auth.zelid) {
          appDetails.value.owner = auth.zelid
          console.log('SubscriptionManager: Set default owner to:', auth.zelid ? 'Present' : 'Missing')
        }
      } catch (error) {
        console.error('Failed to parse zelidauth for default owner:', error)
      }
    }
  }
  
  getGeolocationData()

  if (!props.appSpec?.compose) {
    props.appSpec.compose = []
  } else {
    // Ensure all compose components have repoauth and secrets fields
    props.appSpec.compose.forEach(component => {
      if (!component.hasOwnProperty('repoauth')) {
        component.repoauth = ''
      }
      if (!component.hasOwnProperty('secrets')) {
        component.secrets = ''
      }
    })
  }
  
  // Set default expire if not set (fork-aware)
  if (props.appSpec && props.appSpec.expire === undefined) {
    // Use 88000 for apps registered after fork, otherwise 22000
    const defaultExpire = (props.appSpec.height && props.appSpec.height >= FORK_BLOCK_HEIGHT) ? 88000 : 22000
    props.appSpec.expire = defaultExpire
  }

  // Lock name only when updating existing app, not for new apps
  if (!props.newApp && props.appSpec?.name) {
    isNameLocked.value = true
  }
})

const currentBlockHeight = ref(null)

async function getMarketPlace() {
  try {
    const { data } = await axios.get('https://stats.runonflux.io/marketplace/listapps')
    if (data.status === 'success') {
      marketPlaceApps.value = data.data
    }
  } catch (err) {
    console.error(err)
  }
}

async function getMultiplier() {
  try {
    const { data } = await axios.get('https://stats.runonflux.io/apps/multiplier')
    if (data.status === 'success' && typeof data.data === 'number' && data.data >= 1) {
      generalMultiplier.value = data.data
    }
  } catch (err) {
    console.error(err)
    generalMultiplier.value = 10   // fallback on any error
  }
}

async function fetchCurrentBlockHeight() {
  // Try daemon first (more accurate, real-time) - but only if instance is ready
  if (props.executeLocalCommand && !props.newApp && props.appSpec?.name && props.instanceReady) {
    try {
      const res = await props.executeLocalCommand('/daemon/getblockcount')
      if (res?.data?.status === 'success' && typeof res.data?.data === 'number') {
        currentBlockHeight.value = res.data.data

        return
      }
    } catch (error) {
      console.log("Daemon block height not available, falling back to explorer:", error)
    }
  }

  try {
    // Fallback to explorer (always works, doesn't require instance)
    const explorerResult = await ExplorerService.getScannedHeight()
    if (explorerResult.data.status === "success") {
      currentBlockHeight.value = explorerResult.data.data.generalScannedHeight

      return
    }
  } catch (error) {
    console.error("Error fetching block height from both sources:", error)
  }

  currentBlockHeight.value = null
}


onMounted(async () => {
  Promise.all([getMarketPlace(), getMultiplier()])
  await fetchCurrentBlockHeight()

  // Initialize clipboard.js for copy buttons
  clipboardInstance.value = new ClipboardJS('.copy-btn')

  clipboardInstance.value.on('success', e => {
    showToast('success', t('common.messages.copiedToClipboard'))
    e.clearSelection()
  })

  clipboardInstance.value.on('error', e => {
    showToast('error', t('common.messages.failedToCopy'))
    console.error('Copy error:', e)
  })
})


// --- Running-till timestamps ----------------------------------------
// Helper function to get fork-aware block time in milliseconds
function getBlockTimeMs(blockHeight) {
  // Post-fork (block >= 2,020,000): 30 seconds per block
  // Pre-fork (block < 2,020,000): 2 minutes per block
  return blockHeight >= FORK_BLOCK_HEIGHT ? 0.5 * 60 * 1000 : 2 * 60 * 1000
}

// 1️⃣  Clone once (on mount) – never overwritten
const originalExpireSnapshot = ref(null)
const originalAppSpecSnapshot = ref(null)

onMounted(() => {
  // Fork-aware default for original expire snapshot
  const defaultExpire = (props.appSpec?.height && props.appSpec.height >= FORK_BLOCK_HEIGHT) ? 88000 : 22000
  originalExpireSnapshot.value = props.appSpec?.expire ?? defaultExpire

  // Store original app spec for comparison (excluding expire field)
  if (!props.newApp && props.appSpec) {
    const specCopy = JSON.parse(JSON.stringify(props.appSpec))
    delete specCopy.expire
    originalAppSpecSnapshot.value = specCopy
  }

  // For new apps, enable renewal by default (which means setting the period)
  if (props.newApp) {
    renewalEnabled.value = true
  }
})

// Check if specs have changed (excluding expire field)
const specsHaveChanged = computed(() => {
  if (props.newApp) return true // New apps always need testing
  if (!originalAppSpecSnapshot.value) return true // No snapshot means we need to test
  if (!props.appSpec) return true // No spec means we need to test

  // Compare current spec (without expire) to original snapshot
  try {
    const currentSpecCopy = JSON.parse(JSON.stringify(props.appSpec))
    delete currentSpecCopy.expire

    const hasChanged = JSON.stringify(currentSpecCopy) !== JSON.stringify(originalAppSpecSnapshot.value)

    if (hasChanged) {
      console.log('⚠️ Spec changes detected')
    } else {
      console.log('✅ No spec changes detected')
    }

    return hasChanged
  } catch (error) {
    console.error('Error comparing specs:', error)
    
    return true // If comparison fails, assume specs changed
  }
})

// Watch for spec changes and clear registration if user modifies specs after signing
// This ensures that if user signs, then changes specs, they need to sign again
// We store what was actually signed (appSpecFormated) and compare against it
let signedSpecState = ref(null)

watch(() => props.appSpec, newSpec => {
  if (!newSpec || props.newApp) return // Skip for new apps
  if (!registrationHash.value) return // No hash to clear
  if (!signedSpecState.value) return // No signed spec to compare against

  // If user changes props.appSpec after signing, the old signature is invalid
  try {
    const currentSpecCopy = JSON.parse(JSON.stringify(newSpec))
    delete currentSpecCopy.expire

    const currentStr = JSON.stringify(currentSpecCopy)
    const signedStr = JSON.stringify(signedSpecState.value)

    // Compare current spec to what was actually signed (appSpecFormated at time of signing)
    if (currentStr !== signedStr) {
      console.log('⚠️ Spec changed after signing - clearing registration hash')

      registrationHash.value = null
      signature.value = null
      testFinished.value = false
      testError.value = false
      signedSpecState.value = null
    }
  } catch (error) {
    console.error('Error checking spec changes:', error)
  }
}, { deep: true })

// Store what was actually signed when signature is created
watch(signature, newSignature => {
  if (newSignature && appSpecFormated.value) {
    try {
      // Store the FORMATTED spec that was actually signed
      const signedCopy = JSON.parse(JSON.stringify(appSpecFormated.value))
      delete signedCopy.expire
      signedSpecState.value = signedCopy
      console.log('📸 Stored signed spec state (appSpecFormated):', signedCopy)
    } catch (error) {
      console.error('Error storing signed spec state:', error)
    }
  } else if (!newSignature) {
    signedSpecState.value = null
  }
})

// 2️⃣  current remaining blocks based on the *original* value
// FORK-AWARE: Calculate adjusted expiry block height accounting for fork transition
const originalExpireBlocks = computed(() => {
  if (!currentBlockHeight.value || typeof props.appSpec?.height !== 'number') return null
  if (!originalExpireSnapshot.value) return null

  const registrationHeight = props.appSpec.height
  const expireIn = originalExpireSnapshot.value

  // Calculate naive expiry (registration + expire blocks)
  const naiveExpiry = registrationHeight + expireIn

  let adjustedExpiryBlock = naiveExpiry

  // If app was registered before fork and naive expiry is after fork,
  // we need to adjust to maintain the intended duration
  if (registrationHeight < FORK_BLOCK_HEIGHT && naiveExpiry > FORK_BLOCK_HEIGHT) {
    // Calculate intended subscription duration based on registration time
    const blockTimeAtRegistration = 2 // Pre-fork: 2 min/block
    const subscriptionDurationMinutes = expireIn * blockTimeAtRegistration

    // Calculate pre-fork time consumed
    const preForkBlocks = FORK_BLOCK_HEIGHT - registrationHeight
    const preForkMinutes = preForkBlocks * 2

    // Calculate remaining time that needs to be in post-fork blocks
    const remainingMinutes = subscriptionDurationMinutes - preForkMinutes

    // Convert remaining minutes to post-fork blocks
    const postForkBlocks = remainingMinutes / 0.5

    // Actual expiry block accounting for fork transition
    adjustedExpiryBlock = FORK_BLOCK_HEIGHT + postForkBlocks
  }

  // Return remaining blocks: adjusted expiry - current block
  return adjustedExpiryBlock - currentBlockHeight.value
})

// 3️⃣  timestamps shown in the UI (fork-aware calculation)
// Renewal is calculated from NOW, not from current expiry
const appRunningTill = computed(() => {
  const now = Date.now()
  const currentBlocksRemaining = originalExpireBlocks.value ?? 0
  const chosenRenewalBlocks = (renewalEnabled.value || managementAction.value === 'renewal')
    ? renewalOptions.value[appDetails.value.renewalIndex]?.value ?? 0
    : 0

  // Helper: Calculate milliseconds from blocks remaining (fork-aware with split calculation)
  // This handles apps registered before fork but expiring after fork
  function blocksToMs(blocksRemaining, isCurrentExpiry = false) {
    if (!currentBlockHeight.value || blocksRemaining <= 0) {
      // Fallback: assume post-fork if we don't have current height
      return blocksRemaining * getBlockTimeMs(FORK_BLOCK_HEIGHT)
    }

    let totalMinutes = 0

    if (isCurrentExpiry && typeof props.appSpec?.height === 'number' && originalExpireSnapshot.value) {
      // For current expiry, calculate based on subscription duration from registration
      // This accounts for apps registered before fork that should maintain their intended duration

      // Calculate intended subscription duration based on registration time
      const blockTimeAtRegistration = props.appSpec.height < FORK_BLOCK_HEIGHT ? 2 : 0.5
      const subscriptionDurationMinutes = originalExpireSnapshot.value * blockTimeAtRegistration

      // Calculate elapsed time from registration to now
      let elapsedMinutes = 0
      if (props.appSpec.height < FORK_BLOCK_HEIGHT) {
        if (currentBlockHeight.value <= FORK_BLOCK_HEIGHT) {
          // Both registration and current are before fork
          const blocksPassed = currentBlockHeight.value - props.appSpec.height
          elapsedMinutes = blocksPassed * 2
        } else {
          // Registration before fork, current after fork
          const blocksBeforeFork = FORK_BLOCK_HEIGHT - props.appSpec.height
          const blocksAfterFork = currentBlockHeight.value - FORK_BLOCK_HEIGHT
          elapsedMinutes = (blocksBeforeFork * 2) + (blocksAfterFork * 0.5)
        }
      } else {
        // Registration after fork
        const blocksPassed = currentBlockHeight.value - props.appSpec.height
        elapsedMinutes = blocksPassed * 0.5
      }

      // Remaining time
      totalMinutes = subscriptionDurationMinutes - elapsedMinutes
    } else {
      // For renewals (future blocks), assume they're all post-fork since we're already past fork
      if (currentBlockHeight.value >= FORK_BLOCK_HEIGHT) {
        totalMinutes = blocksRemaining * 0.5 // Post-fork: 30 seconds per block
      } else {
        totalMinutes = blocksRemaining * 2 // Pre-fork: 2 minutes per block
      }
    }

    return totalMinutes * 60 * 1000 // Convert minutes to milliseconds
  }

  const currentExpiry = blocksToMs(currentBlocksRemaining, true) + now
  const renewalTime = blocksToMs(chosenRenewalBlocks, false)
  const newExpiry = now + renewalTime

  console.log('Renewal calculation:', {
    now: new Date(now).toLocaleString(),
    currentExpiry: new Date(currentExpiry).toLocaleString(),
    renewalIndex: appDetails.value.renewalIndex,
    renewalOptions: renewalOptions.value,
    chosenRenewalBlocks,
    renewalTimeMs: renewalTime,
    renewalTimeDays: renewalTime / (24 * 60 * 60 * 1000),
    newExpiry: new Date(newExpiry).toLocaleString(),
  })

  return {
    current: currentExpiry,  // Current expiry time
    new: newExpiry,  // Renewal extends from day of renewal (NOW)
  }
})

// Calculate time remaining until subscription expires
const timeRemaining = computed(() => {
  const now = Date.now()
  const expireTime = appRunningTill.value.current
  const diffMs = expireTime - now

  if (diffMs <= 0) {
    return t('core.subscriptionManager.expired')
  }

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)

  return parts.join(' ')
})

// Color for time remaining chip based on how much time is left
const timeRemainingColor = computed(() => {
  const now = Date.now()
  const expireTime = appRunningTill.value.current
  const diffMs = expireTime - now

  if (diffMs <= 0) {
    return 'error' // Red - Expired
  }

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  if (days < 3) {
    return 'error' // Red - Less than 3 days
  } else if (days <= 4) {
    return 'warning' // Orange - 3 to 4 days
  } else {
    return 'success' // Green - More than 4 days
  }
})

watch(appDetails, val => {
  if (!props.appSpec) return

  if (!isNameLocked.value) {
    props.appSpec.name = val.name
  }

  props.appSpec.description = val.description
  props.appSpec.owner = val.owner
  props.appSpec.contacts = val.contacts
  props.appSpec.instances = val.instances
  props.appSpec.staticip = val.staticip
  props.appSpec.enterprise = val.enterprise
  props.appSpec.nodes = val.nodes ? val.nodes.split(',').map(n => n.trim()).filter(n => n) : []

  // Note: repoauth is handled per component, not globally

  if (renewalEnabled.value || props.newApp || managementAction.value === 'renewal') {
    const selectedExpire = renewalOptions.value[val.renewalIndex]?.value
    props.appSpec.expire = selectedExpire
  } else {
    props.appSpec.expire = originalExpireSnapshot.value
  }
}, { deep: true })

watch(renewalEnabled, val => {
  // Update expire when renewal is toggled
  if (val || props.newApp || managementAction.value === 'renewal') {
    const selectedExpire = renewalOptions.value[appDetails.value.renewalIndex]?.value
    props.appSpec.expire = selectedExpire
  } else {
    props.appSpec.expire = originalExpireSnapshot.value
  }
})

// Watch renewalIndex changes separately to ensure it updates
watch(() => appDetails.value.renewalIndex, newIndex => {
  if (renewalEnabled.value || props.newApp || managementAction.value === 'renewal') {
    const selectedExpire = renewalOptions.value[newIndex]?.value
    props.appSpec.expire = selectedExpire
  }
})

// Watch signature - auto-register when signature is set
watch(signature, async newSignature => {
  if (newSignature && isSigning.value && !registrationHash.value) {
    isSigning.value = false
    await propagateSignedMessage()
  }
})

// Watch hasCalculatedPrice changes
watch(hasCalculatedPrice, (newValue, oldValue) => {
  console.log('💰 hasCalculatedPrice changed:', {
    oldValue,
    newValue,
    appSpecPrice: appSpecPrice?.value,
  })
})

// Watch managementAction to restore/apply correct expire when switching modes
watch(managementAction, (newValue, oldValue) => {
  if (!props.newApp && originalExpireSnapshot.value !== null && props.appSpec) {
    console.log(`Management action changed: ${oldValue} → ${newValue}`)

    // Determine the correct expire value for the new mode
    if (newValue === 'renewal') {
      // Switching TO renewal mode: apply selected renewal period (with fallback to 88000)
      const selectedExpire = renewalOptions.value[appDetails.value.renewalIndex]?.value || 88000
      props.appSpec.expire = selectedExpire
      console.log('Applied renewal period:', selectedExpire)
    } else if (newValue === 'update') {
      // Switching TO update mode: check if renewal is enabled
      if (renewalEnabled.value) {
        // Renewal enabled: apply selected renewal period
        const selectedExpire = renewalOptions.value[appDetails.value.renewalIndex]?.value
        if (selectedExpire) {
          props.appSpec.expire = selectedExpire
          console.log('Applied renewal period for update with renewal:', selectedExpire)
        }
      } else {
        // Renewal disabled: restore original
        props.appSpec.expire = originalExpireSnapshot.value
        console.log('Restored original expire for update without renewal:', originalExpireSnapshot.value)
      }
    } else if (newValue === 'cancel') {
      // Switching TO cancel mode: will be set to 100 by cancelSubscription() function
      // Don't modify here
      console.log('Switching to cancel mode - expire will be set by cancelSubscription()')
    } else {
      // Any other mode: restore original
      props.appSpec.expire = originalExpireSnapshot.value
      console.log('Restored original expire:', originalExpireSnapshot.value)
    }
  }
})

// Geolocation helpers (keep existing)
function decodeGeolocation(existingGeolocation) {
  let updatedNewSpecGeo = existingGeolocation
  let isOldSpecs = false

  existingGeolocation.forEach(location => {
    if (location.startsWith('b') || (!location.startsWith('ac') && !location.startsWith('a!c'))) {
      isOldSpecs = true
    }
  })

  if (isOldSpecs) {
    const continentEncoded = existingGeolocation.find(location =>
      location.startsWith('a') && !location.startsWith('ac') && !location.startsWith('a!c'))
    const countryEncoded = existingGeolocation.find(location => location.startsWith('b'))
    let newSpecLocation = `ac${continentEncoded?.slice(1) || ''}`
    if (countryEncoded) newSpecLocation += `_${countryEncoded.slice(1)}`
    updatedNewSpecGeo = [newSpecLocation]
  }

  allowedGeolocations.value = updatedNewSpecGeo.filter(l => l.startsWith('ac'))
  forbiddenGeolocations.value = updatedNewSpecGeo.filter(l => l.startsWith('a!c'))
}

function generateGeolocations() {
  const allowed = allowedGeolocations.value.includes('acALL') ? [] : allowedGeolocations.value
  
  return [...allowed, ...forbiddenGeolocations.value]
}

function hasConflict(geo, isAllowed) {
  const targetParts = geo.replace(/^a!?c/, '').split('_')
  const oppositeList = isAllowed
    ? forbiddenGeolocations.value
    : (allowedGeolocations.value.includes('acALL') ? [] : allowedGeolocations.value)

  return oppositeList.some(existing => {
    const existingParts = existing.replace(/^a!?c/, '').split('_')
    
    return isAllowed
      ? existingParts.every((val, i) => val === targetParts[i])
      : targetParts.every((val, i) => val === existingParts[i])
  })
}

function isRedundant(geo, list) {
  const parts = geo.replace(/^a!?c/, '').split('_')
  
  return list.some(existing => {
    const existingParts = existing.replace(/^a!?c/, '').split('_')
    
    return existingParts.every((val, i) => val === parts[i]) && existingParts.length < parts.length
  })
}

function cleanChildren(parentGeo, listRef) {
  const parentParts = parentGeo.replace(/^a!?c/, '').split('_')
  listRef.value = listRef.value.filter(entry => {
    const entryParts = entry.replace(/^a!?c/, '').split('_')
    
    return !(entryParts.length > parentParts.length && parentParts.every((val, i) => val === entryParts[i]))
  })
}

function buildGeoCode(prefix, selection) {
  let geo = `${prefix}${selection.continent}`
  if (selection.country && selection.country !== 'ALL') {
    geo += `_${selection.country}`
    if (selection.region && selection.region !== 'ALL') {
      geo += `_${selection.region}`
    }
  }
  
  return geo
}

function addAllowed() {
  if (!selectedAllowed.value.continent || selectedAllowed.value.continent === 'NONE') return
  const geo = buildGeoCode('ac', selectedAllowed.value)
  if (!geo || geo === 'acALL') return

  if (
    !allowedGeolocations.value.includes(geo) &&
    !hasConflict(geo, true) &&
    !forbiddenGeolocations.value.includes('a!cNONE') &&
    !isRedundant(geo, allowedGeolocations.value)
  ) {
    cleanChildren(geo, allowedGeolocations)
    allowedGeolocations.value.push(geo)
  }
}

function addForbidden() {
  if (!selectedForbidden.value.continent || selectedForbidden.value.continent === 'ALL') return
  const geo = buildGeoCode('a!c', selectedForbidden.value)
  if (!geo || geo === 'a!cNONE') return

  if (
    !forbiddenGeolocations.value.includes(geo) &&
    !isRedundant(geo, forbiddenGeolocations.value)
  ) {
    // 1. Remove equivalent and child entries from allowedGeolocations
    const base = geo.replace(/^a!c/, '')
    allowedGeolocations.value = allowedGeolocations.value.filter(allowed => {
      const allowedBase = allowed.replace(/^ac/, '')
      
      return !(allowedBase === base || allowedBase.startsWith(base + '_'))
    })

    // 2. Clean children from forbidden list (already implemented)
    cleanChildren(geo, forbiddenGeolocations)

    // 3. Add new forbidden entry
    forbiddenGeolocations.value.push(geo)

    // 4. Update spec
    props.appSpec.geolocation = generateGeolocations()
  }
}

function removeAllowed(index) {
  allowedGeolocations.value.splice(index, 1)
  allowedGeolocations.value = [...allowedGeolocations.value]
  props.appSpec.geolocation = generateGeolocations()
}

function removeForbidden(index) {
  forbiddenGeolocations.value.splice(index, 1)
  forbiddenGeolocations.value = [...forbiddenGeolocations.value]
  props.appSpec.geolocation = generateGeolocations()
}

async function getGeolocationData() {
  let locations = []
  try {
    const response = await axios.get('https://stats.runonflux.io/fluxinfo?projection=geo')
    if (response.data.status === 'success') {
      const geoData = response.data.data
      if (geoData.length > 5000) {
        locations = []
        geoData.forEach(flux => {
          if (flux.geolocation?.continentCode && flux.geolocation?.countryCode && flux.geolocation?.regionName) {
            const cont = flux.geolocation.continentCode
            const count = flux.geolocation.countryCode
            const reg = flux.geolocation.regionName

            const continentLoc = cont
            const countryLoc = `${cont}_${count}`
            const regionLoc = `${countryLoc}_${reg}`

            const updateCount = val => {
              const exists = locations.find(l => l.value === val)
              if (exists) exists.instances++
              else locations.push({ value: val, instances: 1 })
            }

            updateCount(continentLoc)
            updateCount(countryLoc)
            updateCount(regionLoc)
          }
        })
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Flux geolocation stats.')
  }
  possibleLocations.value = locations

  if (props.appSpec?.geolocation) {
    decodeGeolocation(props.appSpec.geolocation)
  }
}

function getContinents(isForbidden = false) {
  const defaultLabel = isForbidden ? 'NONE' : 'ALL'
  const defaultText = isForbidden ? 'None' : 'Global'
  const options = [{ value: defaultLabel, text: defaultText }]

  const seen = new Set()
  possibleLocations.value.forEach(loc => {
    const cont = loc.value.split('_')[0]
    if (!seen.has(cont)) {
      seen.add(cont)
      const name = geolocations.continents.find(c => c.code === cont)?.name || cont
      options.push({ value: cont, text: name })
    }
  })

  return options
}

function getCountries(continentCode) {
  if (!continentCode || continentCode === 'ALL' || continentCode === 'NONE') return [{ value: 'ALL', text: 'All Countries' }]
  const seen = new Set()
  const countries = [{ value: 'ALL', text: 'All Countries' }]
  possibleLocations.value.forEach(loc => {
    const [cont, count] = loc.value.split('_')
    if (cont === continentCode && count && !seen.has(count)) {
      seen.add(count)
      const name = geolocations.countries.find(c => c.code === count)?.name || count
      countries.push({ value: count, text: name })
    }
  })
  
  return countries
}

function getRegions(continentCode, countryCode) {
  if (!continentCode || !countryCode || countryCode === 'ALL') return [{ value: 'ALL', text: 'All Regions' }]
  const regions = new Set()
  possibleLocations.value.forEach(loc => {
    const [cont, count, region] = loc.value.split('_')
    if (cont === continentCode && count === countryCode && region) {
      regions.add(region)
    }
  })
  
  return [{ value: 'ALL', text: 'All Regions' }, ...[...regions].map(r => ({ value: r, text: r }))]  
}

function getGeolocationLabel(code) {
  const raw = code.replace(/^a!?c/, '')
  const [cont, count, region] = raw.split('_')
  const contName = geolocations.continents.find(c => c.code === cont)?.name || cont
  const countName = count ? geolocations.countries.find(c => c.code === count)?.name || count : ''
  const regionName = region || ''
  if (regionName) return `${contName} / ${countName} / ${regionName}`
  if (countName) return `${contName} / ${countName}`
  
  return `${contName}`
}

function removeDuplicates() {
  if (appDetails.value.contacts) {
    appDetails.value.contacts = [...new Set(appDetails.value.contacts.filter(v => v && v.trim()).map(v => v.trim()))]
  }
}

// Node management functions
function removeNode(node) {
  const index = selectedNodes.value.findIndex(n => n.ip === node.ip)
  if (index > -1) {
    selectedNodes.value.splice(index, 1)
    updateNodesInAppSpec()
  }
}

function updateNodesInAppSpec() {
  if (props.appSpec) {
    props.appSpec.nodes = selectedNodes.value.map(n => n.ip)
  }
}

// Visit FluxNode function
function visitFluxNode(ip) {
  if (ip) {
    const [nodeIp, port] = ip.includes(':') ? ip.split(':') : [ip, null]
    const finalPort = port ? parseInt(port) - 1 : 16126
    const url = `http://${nodeIp}:${finalPort}`
    window.open(url, '_blank')
  } else {
    showToast('error', 'Unable to open FluxNode - invalid IP')
  }
}

// Vuetify handles expansion automatically with v-model:expanded

// Enterprise nodes fetching
async function getEnterpriseNodes() {
  const enterpriseList = sessionStorage.getItem('flux_enterprise_nodes')
  if (enterpriseList) {
    enterpriseNodes.value = JSON.parse(enterpriseList)
    updateAvailableNodes()
  }
  
  try {
    isLoadingNodes.value = true
    const response = await AppsService.getEnterpriseNodes()
    if (response.data.status === 'error') {
      showToast('error', response.data.data.message || response.data.data)
    } else {
      enterpriseNodes.value = response.data.data
      sessionStorage.setItem('flux_enterprise_nodes', JSON.stringify(enterpriseNodes.value))
      updateAvailableNodes()
    }
  } catch (error) {
    console.error('Error fetching enterprise nodes:', error)
    showToast('error', 'Failed to fetch enterprise nodes')
  } finally {
    isLoadingNodes.value = false
  }
}

function updateAvailableNodes() {
  availableNodes.value = enterpriseNodes.value.map(node => ({
    ...node,
    isSelected: selectedNodes.value.some(selected => selected.ip === node.ip),
  }))
  
  // Update selected nodes with real data from enterprise nodes
  // Also remove nodes that no longer exist in the fetched enterprise nodes
  const validSelectedNodes = []
  selectedNodes.value.forEach(selected => {
    const enterpriseNode = enterpriseNodes.value.find(node => node.ip === selected.ip)
    if (enterpriseNode) {
      validSelectedNodes.push({
        ...enterpriseNode, // Copy all fields from enterprise node
      })
    }
  })
  
  // Check if any nodes were removed
  const removedCount = selectedNodes.value.length - validSelectedNodes.length
  if (removedCount > 0) {
    showToast('warning', `${removedCount} node(s) removed as they are no longer available`)
  }
  
  selectedNodes.value = validSelectedNodes
  updateNodesInAppSpec()
}

function toggleNodeSelection(node) {
  const isCurrentlySelected = selectedNodes.value.some(selected => selected.ip === node.ip)
  
  if (isCurrentlySelected) {
    // Remove from selected
    const index = selectedNodes.value.findIndex(selected => selected.ip === node.ip)
    if (index > -1) {
      selectedNodes.value.splice(index, 1)
    }
  } else {
    // Check maximum nodes limit
    if (selectedNodes.value.length >= maximumEnterpriseNodes) {
      showToast('error', `Maximum of ${maximumEnterpriseNodes} nodes allowed`)
      
      return
    }
    
    // Add to selected with all node data
    selectedNodes.value.push({
      ...node, // Copy all fields from the node
    })
  }
  
  updateAvailableNodes()
  updateNodesInAppSpec()
}

function openNodeSelectionDialog() {
  showNodeSelectionDialog.value = true
  if (enterpriseNodes.value.length === 0) {
    getEnterpriseNodes()
  } else {
    updateAvailableNodes()
  }
}

function saveNodeSelection() {
  showNodeSelectionDialog.value = false
  showToast('success', `Selected ${selectedNodes.value.length} nodes`)
}

// Auto-select nodes algorithm (for v7 Enterprise nodes)
async function autoSelectNodes() {
  try {
    // Ensure we have enterprise nodes loaded
    if (enterpriseNodes.value.length === 0) {
      await getEnterpriseNodes()
    }
    
    const instances = props.appSpec?.instances ?? 3
    const maxSamePubKeyNodes = instances + 3
    const maxNumberOfNodes = instances + Math.ceil(Math.max(7, instances * 0.15))
    
    // Get nodes not currently selected
    const notSelectedEnterpriseNodes = enterpriseNodes.value.filter(
      node => !selectedNodes.value.some(selected => selected.ip === node.ip),
    )
    
    // Filter for KYC nodes (high quality nodes)
    const kycNodes = notSelectedEnterpriseNodes.filter(
      node => (node.enterprisePoints > 0 || node.score > 1000),
    )
    
    if (kycNodes.length === 0) {
      throw new Error('No high-quality nodes available for auto-selection')
    }
    
    const nodesToSelect = []
    
    for (let i = 0; i < kycNodes.length; i++) {
      const node = kycNodes[i]
      
      // Check if we haven't exceeded the max same pubkey limit
      const alreadySelectedPubKeyOccurances = selectedNodes.value.filter(
        selected => selected.pubkey === node.pubkey,
      ).length
      
      const toSelectPubKeyOccurances = nodesToSelect.filter(
        toSelect => toSelect.pubkey === node.pubkey,
      ).length
      
      if (alreadySelectedPubKeyOccurances + toSelectPubKeyOccurances < maxSamePubKeyNodes) {
        nodesToSelect.push(node)
      }
      
      if (nodesToSelect.length + selectedNodes.value.length >= maxNumberOfNodes) {
        break
      }
    }
    
    if (nodesToSelect.length + selectedNodes.value.length < maxNumberOfNodes) {
      throw new Error('Not enough high-quality nodes available to run your enterprise app')
    }
    
    // Add selected nodes to our list
    nodesToSelect.forEach(node => {
      selectedNodes.value.push({
        ip: node.ip,
         
        payment_address: node.payment_address,
        tier: node.tier,
        score: node.score,
        pubkey: node.pubkey,
        enterprisePoints: node.enterprisePoints,
      })
    })
    
    updateAvailableNodes()
    updateNodesInAppSpec()
    
    showToast('success', t('core.subscriptionManager.autoSelectedNodes', { count: nodesToSelect.length }))
    
  } catch (error) {
    console.error('Auto-select error:', error)
    showToast('error', error.message || 'Failed to auto-select nodes')
  }
}

// Computed for filtered nodes
const filteredNodes = computed(() => {
  if (!nodeFilter.value) return availableNodes.value
  const filter = nodeFilter.value.toLowerCase()
  
  return availableNodes.value.filter(node => 
    node.ip.toLowerCase().includes(filter) ||
    node.payment_address.toLowerCase().includes(filter) ||
    node.tier.toLowerCase().includes(filter),
  )
})

// Computed for filtered selected nodes
const filteredSelectedNodes = computed(() => {
  if (!selectedNodesFilter.value) return selectedNodes.value
  const filter = selectedNodesFilter.value.toLowerCase()
  
  return selectedNodes.value.filter(node => 
    node.ip.toLowerCase().includes(filter) ||
    node.payment_address.toLowerCase().includes(filter) ||
    node.tier.toLowerCase().includes(filter),
  )
})

// Computed for pagination - Selected Nodes Table
const selectedNodesTotalPages = computed(() => {
  return Math.ceil(filteredSelectedNodes.value.length / selectedNodesPerPage.value) || 1
})

const paginatedSelectedNodes = computed(() => {
  const start = (selectedNodesCurrentPage.value - 1) * selectedNodesPerPage.value
  const end = start + selectedNodesPerPage.value
  
  return filteredSelectedNodes.value.slice(start, end)
})

// Computed for pagination - Dialog Table
const dialogTotalPages = computed(() => {
  return Math.ceil(filteredNodes.value.length / nodePerPage.value) || 1
})

const paginatedFilteredNodes = computed(() => {
  const start = (dialogCurrentPage.value - 1) * nodePerPage.value
  const end = start + nodePerPage.value
  
  return filteredNodes.value.slice(start, end)
})

// Reset page when filter changes
watch(nodeFilter, () => {
  dialogCurrentPage.value = 1
})

// Reset page when items per page changes
watch(nodePerPage, () => {
  dialogCurrentPage.value = 1
})

// Reset page when selected nodes items per page changes
watch(selectedNodesPerPage, () => {
  selectedNodesCurrentPage.value = 1
})

// Reset page when selected nodes filter changes
watch(selectedNodesFilter, () => {
  selectedNodesCurrentPage.value = 1
})

watch(() => selectedAllowed.value.continent, () => {
  selectedAllowed.value.country = 'ALL'
  selectedAllowed.value.region = 'ALL'
})

watch(() => selectedAllowed.value.country, () => {
  selectedAllowed.value.region = 'ALL'
})

watch(() => selectedForbidden.value.continent, () => {
  selectedForbidden.value.country = 'ALL'
  selectedForbidden.value.region = 'ALL'
})

watch(() => selectedForbidden.value.country, () => {
  selectedForbidden.value.region = 'ALL'
})

watch([allowedGeolocations, forbiddenGeolocations], () => {
  if (props.appSpec) {
    props.appSpec.geolocation = generateGeolocations()
  }
}, { deep: true })

// Watch for enterprise mode changes
watch(() => isPrivateApp.value, async (newValue, oldValue) => {
  if (props.appSpec && props.appSpec.version >= 7) {
    if (newValue && !oldValue) {
      // Enterprise mode enabled - auto fetch nodes
      if (enterpriseNodes.value.length === 0) {
        await getEnterpriseNodes()
      }
      
      // Auto-select existing nodes from appSpec if any
      if (props.appSpec.nodes && props.appSpec.nodes.length > 0 && selectedNodes.value.length === 0) {
        props.appSpec.nodes.forEach(nodeIp => {
          const enterpriseNode = enterpriseNodes.value.find(node => node.ip === nodeIp)
          if (enterpriseNode) {
            selectedNodes.value.push({
              ip: enterpriseNode.ip,
               
              payment_address: enterpriseNode.payment_address,
              tier: enterpriseNode.tier,
              score: enterpriseNode.score,
            })
          }
        })
        updateNodesInAppSpec()
      }
      
      isPrivateApp.value = true
      showToast('info', 'Enterprise mode enabled - nodes loaded')
    } else if (!newValue && oldValue) {
      // Enterprise mode disabled - clear nodes and settings
      selectedNodes.value = []
      props.appSpec.nodes = []
      
      // Clear repository auth and secrets for all versions
      if (props.appSpec.compose) {
        props.appSpec.compose.forEach(component => {
          component.repoauth = ''
          component.secrets = ''
        })
      }
      
      isPrivateApp.value = false
      showToast('info', 'Enterprise settings cleared')
    }
  }
})

const composeTabs = computed(() => {
  return props.appSpec?.compose?.map((component, index) => ({
    label: component.name || `${t('core.subscriptionManager.component')} ${index + 1}`,
    icon: 'mdi-cube-outline',
    value: `component-${index}`,
  })) || []
})

const componentTab = ref('component-0')

const allTabs = computed(() => [
  ...tabItems,
  ...composeTabs.value,
])

function addComposeComponent() {
  if (!props.appSpec.compose) props.appSpec.compose = []
  const index = props.appSpec.compose.push({
    name: '',
    description: '',
    repotag: '',
    ports: [],
    domains: [],
    environmentParameters: [],
    commands: [],
    containerPorts: [],
    containerData: '',
    cpu: 1,
    ram: 1024,
    hdd: 10,
    tiered: false,
    repoauth: '',
    secrets: '',
  }) - 1

  // The watch function will automatically generate the random port
  componentTab.value = `component-${index}`
}

/////

const editIndex = ref(null)
const exposedInput = ref([])
const editWrapper = ref([])
const newPorts = ref([])
const focusState = ref({})
const previousPorts = ref([])
const currentEditComponentIndex = ref(null)

// Set input and wrapper refs dynamically
function setExposedInput(idx, el) {
  exposedInput.value[idx] = el
}

function setEditWrapper(idx, el) {
  editWrapper.value[idx] = el
}

function cleanupEdit(idx) {
  editIndex.value = null
  currentEditComponentIndex.value = null
  delete focusState.value[idx]
  document.removeEventListener('click', handleOutsideClick)
}

// Start editing a port pair
function startEdit(component, componentIndex, idx, event) {
  event?.stopPropagation()

  // ✅ Cleanup previous edit state first
  if (editIndex.value !== null && currentEditComponentIndex.value !== null) {
    cleanupEdit(editIndex.value)
  }

  previousPorts.value[idx] = {
    exposed: component.ports[idx],
    container: component.containerPorts[idx],
  }

  editIndex.value = idx
  currentEditComponentIndex.value = componentIndex
  focusState.value[idx] = { exposed: false, container: false }

  nextTick(() => {
    if (exposedInput.value[idx]?.focus) {
      exposedInput.value[idx].focus()
    }
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick)
    }, 0)
  })
}

// Handle focus event
function handleFocus(idx, type) {
  focusState.value[idx] = focusState.value[idx] || { exposed: false, container: false }
  focusState.value[idx][type] = true
}

// Handle blur event
function handleBlur(idx, type) {
  focusState.value[idx] = focusState.value[idx] || { exposed: false, container: false }
  focusState.value[idx][type] = false
}

function revertPortEdit(component, portIndex) {
  component.ports[portIndex] = previousPorts.value[portIndex].exposed
  component.containerPorts[portIndex] = previousPorts.value[portIndex].container
  cleanupEdit(portIndex)
}

function isValidAndUniquePortPair(component, componentIndex, idx) {
  const exposed = component.ports[idx]
  const container = component.containerPorts[idx]

  // 1. Check if both are valid numbers
  if (!isValidPort(exposed) || !isValidPort(container)) return false

  // 2. Check global exposed port duplication (excluding self)
  const allExposedPorts = props.appSpec.compose.flatMap((c, i) =>
    i === componentIndex ? c.ports.filter((_, pIdx) => pIdx !== idx) : c.ports || [],
  )

  if (allExposedPorts.includes(exposed)) {
    showToast('error', `Exposed port ${exposed} is already used.`)
    
    return false
  }

  return true
}

// Handle clicks outside the edit area
function handleOutsideClick(event) {
  const portIdx = editIndex.value
  const componentIdx = currentEditComponentIndex.value

  if (portIdx === null || componentIdx === null) return

  const wrapper = editWrapper.value[portIdx]
  const component = props.appSpec.compose[componentIdx]

  if (wrapper && !wrapper.contains(event.target)) {
    if (component && isValidAndUniquePortPair(component, componentIdx, portIdx)) {
      cleanupEdit(portIdx)
    } else {
      revertPortEdit(component, portIdx)
    }
  }
}

// Save and exit edit mode
function saveAndExitEdit(component, componentIndex, portIndex) {
  if (isValidAndUniquePortPair(component, componentIndex, portIndex)) {
    cleanupEdit(portIndex)
  } else {
    revertPortEdit(component, portIndex)
  }
}

// Validate port input
function validatePort(component, idx, type) {
  const value = type === 'exposed' ? component.ports[idx] : component.containerPorts[idx]

  if (!isValidPort(value)) {
    showToast('error', 'Port must be a number between 1 and 65535.')
    if (type === 'exposed') component.ports[idx] = null
    else component.containerPorts[idx] = null
    
    return
  }

  if (type === 'exposed') {
    const allExposedPorts = props.appSpec.compose.flatMap(c => c.ports || [])
    const currentIndex = allExposedPorts.findIndex(p => p === value)
    const duplicate = allExposedPorts.filter(p => p === value).length > 1

    if (duplicate || (currentIndex !== -1 && component.ports[idx] !== value)) {
      showToast('error', `Port ${value} is already in use.`)
      component.ports[idx] = null
    }
  }
}

// Copy text to clipboard
async function copyToClipboard(text) {
  if (!text) {
    showToast('warning', 'Nothing to copy')
    
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    showToast('success', t('common.messages.copiedToClipboard'))
  } catch (err) {
    showToast('error', t('common.messages.failedToCopy'))
    console.error('Failed to copy:', err)
  }
}

// Add a new port pair
function addPortPair(index) {
  const component = props.appSpec.compose[index]
  const ports = newPorts.value[index]

  if (!ports) return

  const isDuplicateLocal = component.ports.includes(ports.exposed)
  const allExposedPorts = props.appSpec.compose.flatMap((c, i) =>
    i === index ? [] : c.ports || [],
  )
  const isDuplicateGlobal = allExposedPorts.includes(ports.exposed)

  if (
    isValidPort(ports.exposed) &&
    isValidPort(ports.container) &&
    !isDuplicateLocal &&
    !isDuplicateGlobal
  ) {
    component.ports.push(ports.exposed)
    component.containerPorts.push(ports.container)

    // Auto-increment exposed port by +1, clear container port
    const nextExposed = ports.exposed + 1
    newPorts.value[index] = {
      exposed: nextExposed,
      container: null,
    }
  } else {
    showToast("error",
      isDuplicateGlobal
        ? `Port ${ports.exposed} is already used in another component.`
        : 'Invalid or duplicate port values.',
    )
  }
}

// Handle exposed port input - auto-suggest container port (enabled for all modes)
function handleExposedPortInput(componentIndex) {
  const ports = newPorts.value[componentIndex]
  if (!ports) return

  // Only auto-fill container port if it's empty
  if (ports.exposed && !ports.container) {
    newPorts.value[componentIndex].container = ports.exposed
  }
}

// Remove a port pair
function removePortPair(component, index) {
  component.ports.splice(index, 1)
  component.containerPorts.splice(index, 1)
  component.domains.splice(index, 1)
  editIndex.value = null
  delete focusState.value[index]
  document.removeEventListener('click', handleOutsideClick)
}

// Validate port number
function isValidPort(value) {
  return Number.isInteger(value) && value > 0 && value <= 65535
}

// Clean up global event listener on component unmount
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)

  // Clean up ClipboardJS instance to prevent memory leaks
  if (clipboardInstance.value) {
    clipboardInstance.value.destroy()
    clipboardInstance.value = null
  }

  // Clean up payment monitoring intervals
  if (paymentMonitoringInterval.value) {
    clearInterval(paymentMonitoringInterval.value)
    paymentMonitoringInterval.value = null
  }
  if (paymentMonitoringTimeout.value) {
    clearTimeout(paymentMonitoringTimeout.value)
    paymentMonitoringTimeout.value = null
  }

  // Clean up signing state
  isSigning.value = false
  if (websocket.value) {
    websocket.value.close()
    websocket.value = null
  }

  // Reset payment states
  paymentProcessing.value = false
  paymentConfirmed.value = false
  paymentCompleted.value = false
  paymentMethod.value = ''
  paymentAmount.value = 0
})

// Watch for tab changes - clear state when leaving Test & Pay tab
watch(tab, (newTab, oldTab) => {
  console.log('🔀 TAB CHANGED', {
    oldTab,
    newTab,
    isEnteringTestPay: newTab === 100,
    isLeavingTestPay: oldTab === 100 && newTab !== 100,
  })

  // Log all payment-related states when entering Test & Pay tab
  if (newTab === 100) {
    console.log('💳 ENTERING TEST & PAY - Payment UI States:', {
      paymentProcessing: paymentProcessing?.value,
      paymentConfirmed: paymentConfirmed?.value,
      paymentCompleted: paymentCompleted?.value,
      registrationHash: registrationHash?.value,
      deploymentAddress: deploymentAddress?.value,
      signature: signature?.value,
      hasCalculatedPrice: hasCalculatedPrice?.value,
      appSpecPrice: appSpecPrice?.value,
      paymentMonitoringInterval: paymentMonitoringInterval?.value,
      paymentMonitoringTimeout: paymentMonitoringTimeout?.value,

      // Payment card visibility conditions:
      testFinished: testFinished?.value,
      testError: testError?.value,
      renewalEnabled: renewalEnabled?.value,
      specsHaveChanged: specsHaveChanged?.value,
      newApp: props?.newApp,
    })

    // If there's a registrationHash, determine what to show based on app type and price
    if (registrationHash?.value && !paymentConfirmed?.value && !paymentMonitoringInterval?.value) {
      // For free apps/updates, auto-start monitoring (no payment needed)
      if (appSpecPrice?.value?.flux === 0) {
        console.log('🆓 FREE APP/UPDATE DETECTED - Auto-starting deployment monitoring')

        // Set testFinished to hide test section for free updates
        testFinished.value = true
        testError.value = false

        startPaymentMonitoring()
      }

      // For paid apps/updates with unchanged specs, skip test and show payment section
      else if (!props.newApp && !specsHaveChanged.value) {
        console.log('💰 PAID UPDATE (unchanged specs) - Skipping test, showing payment section')
        testFinished.value = true
        testError.value = false
      }

      // For new apps or updates with changed specs, don't force testFinished
      // Let the test section show so user can run the test
      else {
        console.log('💰 NEW APP or CHANGED SPECS - Test section should be visible')

        // Don't set testFinished - let user run the test
      }
    }
  }

  // If leaving the Test & Pay tab (100)
  if (oldTab === 100 && newTab !== 100) {
    console.log('🚪 LEAVING TEST & PAY - Clearing payment states', {
      hadSuccessfulDeployment: paymentConfirmed.value,
    })

    // Check if deployment was successful BEFORE clearing payment states
    const wasSuccessful = paymentConfirmed.value || paymentCompleted.value

    // Clear monitoring intervals
    if (paymentMonitoringInterval.value) {
      clearInterval(paymentMonitoringInterval.value)
      paymentMonitoringInterval.value = null
    }
    if (paymentMonitoringTimeout.value) {
      clearTimeout(paymentMonitoringTimeout.value)
      paymentMonitoringTimeout.value = null
    }

    // Reset payment states
    paymentProcessing.value = false
    paymentConfirmed.value = false
    paymentCompleted.value = false
    paymentMethod.value = ''
    paymentAmount.value = 0

    // Clear registration states if deployment was successful
    // This allows user to register again if they change specs later
    if (wasSuccessful) {
      registrationHash.value = null
      signature.value = null
      deploymentAddress.value = null
      console.log('🧹 Cleared registration states after leaving successful deployment screen')
    }

    console.log('✅ Payment states cleared')
  }
})

// onMounted - always reset to first tab when component mounts
// This handles the case when user navigates away and back to subscription tab
onMounted(() => {
  console.log('🚀 COMPONENT MOUNTED - Initial States:', {
    tab: tab?.value,
    signature: signature?.value,
    registrationHash: registrationHash?.value,
    paymentProcessing: paymentProcessing?.value,
    paymentConfirmed: paymentConfirmed?.value,
    deploymentAddress: deploymentAddress?.value,
    hasCalculatedPrice: hasCalculatedPrice?.value,
    appSpecPrice: appSpecPrice?.value,
    newApp: props?.newApp,
  })

  tab.value = 0

  console.log('✅ Tab reset to 0 on mount')
})

// Watch resetTrigger - reset to first tab and disable renewal whenever it changes (skip initial value)
watch(() => props.resetTrigger, (newTrigger, oldTrigger) => {
  console.log('🔄 RESET TRIGGER FIRED', {
    newTrigger,
    oldTrigger,
    willReset: oldTrigger && newTrigger && newTrigger !== oldTrigger,
  })

  // Only reset if this is NOT the first time (oldTrigger exists)
  if (oldTrigger && newTrigger && newTrigger !== oldTrigger) {
    console.log('📊 STATE BEFORE RESET:', {
      tab: tab?.value,
      signature: signature?.value,
      registrationHash: registrationHash?.value,
      paymentProcessing: paymentProcessing?.value,
      paymentConfirmed: paymentConfirmed?.value,
      deploymentAddress: deploymentAddress?.value,
      isSigning: isSigning?.value,
      signingFailed: signingFailed?.value,
      isPropagating: isPropagating?.value,
      hasCalculatedPrice: hasCalculatedPrice?.value,
      appSpecPrice: appSpecPrice?.value,
    })

    tab.value = 0

    // Disable renewal when revisiting subscription tab
    if (!props.newApp) {
      renewalEnabled.value = false
    }

    console.log('📊 STATE AFTER RESET (tab changed to 0):', {
      tab: tab?.value,
      signature: signature?.value,
      registrationHash: registrationHash?.value,
      paymentProcessing: paymentProcessing?.value,
      paymentConfirmed: paymentConfirmed?.value,
      renewalEnabled: renewalEnabled?.value,
    })
  }
})

// Generate a random port between min and max
function generateRandomPort(min = 30000, max = 39999) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Watch for compose length changes
watch(() => props.appSpec?.compose?.length, newLength => {
  // Generate random port for each component (enabled for all modes)
  if (newLength > 0) {
    // Only initialize ports for new components that don't have ports yet
    if (!newPorts.value) {
      newPorts.value = []
    }

    // Ensure the array has the right length and preserve existing values
    while (newPorts.value.length < newLength) {
      // Generate random port for each new component
      newPorts.value.push({ exposed: generateRandomPort(), container: null })
    }

    // Trim if needed (in case components were removed)
    if (newPorts.value.length > newLength) {
      newPorts.value = newPorts.value.slice(0, newLength)
    }
  } else {
    newPorts.value = []
  }
}, { immediate: true })

// Reset editIndex and focusState when removing a component
function removeComposeComponent(index) {
  if (!props.appSpec.compose || index < 0 || index >= props.appSpec.compose.length) return
  props.appSpec.compose.splice(index, 1)
  editIndex.value = null
  newPorts.value.splice(index, 1)
  delete focusState.value[index]
  document.removeEventListener('click', handleOutsideClick)

  if (props.appSpec.compose.length > 0) {
    componentTab.value = `component-${Math.max(0, index - 1)}`
  } else {
    componentTab.value = ''
  }
}

////
const envDialog = reactive({
  show: false,
  componentIndex: null,
  entries: [],
  newKey: '',
  newValue: '',
})

const showEnvImportDialog = ref(false)
const showCommandsImportDialog = ref(false)
const showSpecImportDialog = ref(false)

watch(() => envDialog.show, val => {
  if (!val) {
    envDialog.componentIndex = null
    envDialog.entries = []
    envDialog.newKey = ''
    envDialog.newValue = ''
  }
})

function openEnvDialog(index) {
  const component = props.appSpec.compose[index]
  envDialog.show = false // force reset (optional)

  // Delay dialog open to avoid rendering stale data
  requestAnimationFrame(() => {
    envDialog.componentIndex = index
    envDialog.entries = (component.environmentParameters || []).map(str => {
      const [key, ...rest] = str.split('=')
      
      return { key, value: rest.join('=') }
    })
    envDialog.newKey = ''
    envDialog.newValue = ''
    envDialog.show = true
  })
}

function addEnvEntry() {
  const key = envDialog.newKey.trim()
  const value = envDialog.newValue.trim()

  if (!key || !value) return showToast('error', 'Key and value are required.')

  if (envDialog.entries.some(e => e.key === key)) {
    return showToast('error', `Duplicate key "${key}"`)
  }

  envDialog.entries.push({ key, value })
  envDialog.newKey = ''
  envDialog.newValue = ''
}

function removeEnvEntry(index) {
  envDialog.entries.splice(index, 1)
}

function handleEnvImport(entries) {
  let importedCount = 0
  let skippedCount = 0
  for (const entry of entries) {
    // Skip if key already exists
    if (envDialog.entries.some(e => e.key === entry.key)) {
      skippedCount++
      continue
    }
    envDialog.entries.push(entry)
    importedCount++
  }

  if (skippedCount > 0) {
    showToast('success', `Imported ${importedCount} environment variable(s), skipped ${skippedCount} duplicate(s)`)
  } else {
    showToast('success', `Imported ${importedCount} environment variable(s)`)
  }
}

function saveEnvChanges() {
  const index = envDialog.componentIndex
  if (index === null) return

  const component = props.appSpec.compose[index]
  component.environmentParameters = envDialog.entries.map(e => `${e.key}=${e.value}`)

  envDialog.show = false
}

watch(
  () => props.appSpec.compose,
  compose => {
    if (!Array.isArray(compose)) return

    compose.forEach(component => {
      if (!Array.isArray(component.ports)) component.ports = []
      if (!Array.isArray(component.containerPorts)) component.containerPorts = []
      if (!Array.isArray(component.domains)) component.domains = []

      // Ensure one domain entry per port
      component.ports.forEach((_, index) => {
        if (typeof component.domains[index] !== 'string') {
          component.domains[index] = ''
        }

        // Ensure containerPorts has matching entries
        if (typeof component.containerPorts[index] === 'undefined') {
          component.containerPorts[index] = null
        }
      })

      // Optional: remove extra domains if ports were removed
      if (component.domains.length > component.ports.length) {
        component.domains.length = component.ports.length
      }

      // Also sync containerPorts length
      if (component.containerPorts.length > component.ports.length) {
        component.containerPorts.length = component.ports.length
      }
    })
  },
  { deep: true, immediate: true },
)



// Watch for `compose` mutations and normalize domains
watch(
  () => props.appSpec.compose,
  compose => {
    if (!Array.isArray(compose)) return

    compose.forEach(component => {
      if (!Array.isArray(component.ports)) component.ports = []
      if (!Array.isArray(component.containerPorts)) component.containerPorts = []
      if (!Array.isArray(component.domains)) component.domains = []

      component.ports.forEach((_, index) => {
        if (typeof component.domains[index] !== 'string') {
          component.domains[index] = ''
        }

        // Ensure containerPorts has matching entries
        if (typeof component.containerPorts[index] === 'undefined') {
          component.containerPorts[index] = null
        }
      })

      if (component.domains.length > component.ports.length) {
        component.domains.length = component.ports.length
      }

      // Also sync containerPorts length
      if (component.containerPorts.length > component.ports.length) {
        component.containerPorts.length = component.ports.length
      }
    })
  },
  { deep: true, immediate: true },
)

const expiryLabel = computed(() => {
  // For renewal mode with existing apps
  if (!props.newApp && managementAction.value === 'renewal') {
    // Get the renewal period in blocks
    let renewalBlocks
    if (versionFlags.value.supportsExpire) {
      // V6+: use selected renewal period
      renewalBlocks = renewalOptions.value[appDetails.value.renewalIndex]?.value ?? 0
    } else {
      // < V6: fixed 1 month = 88000 blocks (post-fork value)
      renewalBlocks = 88000
    }

    // Convert blocks to human-readable time (fork-aware)
    const minutesPerBlock = blockHeight.value >= FORK_BLOCK_HEIGHT ? 0.5 : 2
    const totalMinutes = renewalBlocks * minutesPerBlock
    const days = Math.floor(totalMinutes / 1440)
    const hours = Math.floor((totalMinutes % 1440) / 60)
    const minutes = totalMinutes % 60

    const parts = []
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)

    return parts.join(', ')
  }

  // For new apps, use the selected renewal option directly
  // For existing apps, use the original expire value (unless canceling or renewal enabled)
  let expire
  if (props.newApp) {
    expire = renewalOptions.value[appDetails.value.renewalIndex]?.value ?? 88000
  } else {
    // Spec < 6 ALWAYS uses fixed 88000 blocks (1 month) regardless of mode
    if (!versionFlags.value.supportsExpire && managementAction.value !== 'cancel') {
      expire = 88000
    } else if (managementAction.value === 'cancel' || renewalEnabled.value) {
      // For cancel mode or renewal enabled, use the actual expire, not the snapshot
      expire = props.appSpec?.expire ?? 100
    } else {
      // Use original expire snapshot for existing apps when renewal is disabled
      // Fork-aware fallback: check app registration height
      const defaultExpire = (props.appSpec?.height && props.appSpec.height >= FORK_BLOCK_HEIGHT) ? 88000 : 22000
      expire = originalExpireSnapshot.value ?? props.appSpec?.expire ?? defaultExpire
    }
  }

  // For new apps, renewal enabled, cancel mode, or spec < 6 (which always uses fixed 88000 blocks)
  if (props.newApp || renewalEnabled.value || managementAction.value === 'cancel' || !versionFlags.value.supportsExpire) {
    // If blockHeight not loaded yet, default to post-fork rate
    if (!blockHeight.value) {
      // Default: assume post-fork, use 88000 blocks at 0.5 min/block
      const totalMinutes = 88000 * 0.5
      const days = Math.floor(totalMinutes / 1440)
      const hours = Math.floor((totalMinutes % 1440) / 60)
      const minutes = totalMinutes % 60

      const parts = []
      if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
      if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
      if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)

      return parts.join(', ')
    }

    // Block time: 2 minutes before fork, 30 seconds (0.5 minutes) after fork
    const minutesPerBlock = blockHeight.value >= FORK_BLOCK_HEIGHT ? 0.5 : 2
    const totalMinutes = expire * minutesPerBlock
    const days = Math.floor(totalMinutes / 1440)
    const hours = Math.floor((totalMinutes % 1440) / 60)
    const minutes = totalMinutes % 60

    const parts = []
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)

    return parts.join(', ')
  }

  // For existing apps without renewal - show remaining time
  const current = blockHeight.value
  const height = props.appSpec.height

  if (!current || !height) return ''

  // For cancel mode, expire is absolute (100 blocks from now), not relative to registration height
  // For UPDATE mode spec v6+ without renewal: use fork-aware blocksToExpire if available
  let blocksToExpireLocal
  if (managementAction.value === 'cancel') {
    blocksToExpireLocal = expire
  } else if (managementAction.value === 'update' && !renewalEnabled.value && versionFlags.value.supportsExpire && blocksToExpire.value !== null) {
    // Use the fork-aware blocksToExpire calculated in fetchBlockHeight
    blocksToExpireLocal = blocksToExpire.value
  } else {
    // Naive calculation for other cases
    blocksToExpireLocal = height + expire - current
  }

  if (blocksToExpireLocal < 1) return ''

  // Fork-aware calculation: Apps registered before fork need split calculation
  let totalMinutes = 0

  // If we're using pre-calculated fork-aware blocksToExpire (UPDATE mode v6+ without renewal)
  // then blocksToExpireLocal is already in post-fork blocks, so just convert directly
  if (managementAction.value === 'update' && !renewalEnabled.value && versionFlags.value.supportsExpire && blocksToExpire.value !== null) {
    // blocksToExpireLocal is already fork-aware remaining blocks at current rate
    const minutesPerBlock = current >= FORK_BLOCK_HEIGHT ? 0.5 : 2
    totalMinutes = blocksToExpireLocal * minutesPerBlock
  } else if (height < FORK_BLOCK_HEIGHT && current >= FORK_BLOCK_HEIGHT) {
    // App registered before fork, currently after fork
    // Need to calculate: intended duration - elapsed time

    // Calculate intended subscription duration based on registration time
    const blockTimeAtRegistration = 2 // Pre-fork: 2 minutes per block
    const subscriptionDurationMinutes = expire * blockTimeAtRegistration

    // Calculate elapsed time from registration to now
    const blocksBeforeFork = FORK_BLOCK_HEIGHT - height
    const blocksAfterFork = current - FORK_BLOCK_HEIGHT
    const elapsedMinutes = (blocksBeforeFork * 2) + (blocksAfterFork * 0.5)

    // Remaining time
    totalMinutes = subscriptionDurationMinutes - elapsedMinutes
  } else {
    // Simple case: both registration and current are on same side of fork
    const minutesPerBlock = current >= FORK_BLOCK_HEIGHT ? 0.5 : 2
    totalMinutes = blocksToExpireLocal * minutesPerBlock
  }

  if (totalMinutes < 0) return ''

  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = Math.floor(totalMinutes % 60)

  const parts = []
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)

  return parts.length > 0 ? parts.join(', ') : '0 minutes'
})

// Auto-trigger logic when switching to tab 99
watch(tab, async newVal => {
  if (newVal === 99) {
    console.log('📝 ENTERING REVIEW & VALIDATE TAB', {
      hasRegistrationHash: !!registrationHash.value,
      hasAppSpecPrice: !!appSpecPrice.value,
      hasCalculatedPrice: hasCalculatedPrice.value,
      specsHaveChanged: specsHaveChanged.value,
      isNewApp: props.newApp,
    })

    // If already registered, don't reset states - just show what we have
    // Once you have a registrationHash, it means you signed the current spec state
    // We preserve it regardless of whether specs changed from the snapshot
    if (registrationHash.value) {
      console.log('✅ Already registered - keeping existing states', {
        hasHash: !!registrationHash.value,
        specsHaveChanged: specsHaveChanged.value,
        testFinished: testFinished.value,
        testError: testError.value,
      })
      isVeryfitying.value = false

      // For new apps, only set testFinished if test hasn't been attempted yet
      // This preserves test failure states
      if (props.newApp && !testFinished.value) {
        // Test not run yet - allow payment section to show (user can pay without testing)
        testFinished.value = true
        testError.value = false
      }

      // For updates with unchanged specs, always set testFinished (skip testing)
      else if (!props.newApp && !specsHaveChanged.value) {
        testFinished.value = true
        testError.value = false
      }

      // Otherwise, preserve existing test states (including failures)

      // Auto-navigate to Test & Pay tab after 1 second
      setTimeout(() => {
        if (tab.value === 99) { // Only navigate if still on tab 99
          tab.value = 100
        }
      }, 1000)

      return
    }

    // Spinner on
    isVeryfitying.value = true

    // Reset all public state
    // Only clear signature/hash if they don't exist
    appSpecFormated.value = null
    signature.value = null
    registrationHash.value = null
    verifyAppSpecResponse.value = null
    verifyAppSpecError.value = null
    appSpecPrice.value = null
    blockHeight.value = null
    isExpiryValid.value = false
    blocksToExpire.value = null
    isPropagating.value = false
    testError.value = false
    testFinished.value = false
    testRunning.value = false
    testOutput.value = []

    hasValidatedSpec.value = false
    hasCheckedExpiry.value = false
    hasCalculatedPrice.value = false

    // Local tracking
    let validated = false
    let checkedExpiry = false
    let calculatedPrice = false

    // FIX: Ensure expire is set correctly before validation
    console.log('🔄 Tab 99 - Before expire fix:', {
      managementAction: managementAction.value,
      renewalEnabled: renewalEnabled.value,
      currentExpire: props.appSpec?.expire,
      supportsExpire: versionFlags.value.supportsExpire,
      newApp: props.newApp
    })

    if (!props.newApp) {
      if (managementAction.value === 'renewal') {
        // RENEWAL mode: use selected renewal period
        const selectedExpire = renewalOptions.value[appDetails.value.renewalIndex]?.value || 88000
        props.appSpec.expire = selectedExpire
        console.log('🔄 Tab 99 - Set expire for renewal mode:', selectedExpire)
      } else if (managementAction.value === 'update') {
        // UPDATE mode
        if (renewalEnabled.value) {
          // Renewal enabled: use selected renewal period
          const selectedExpire = renewalOptions.value[appDetails.value.renewalIndex]?.value || 88000
          props.appSpec.expire = selectedExpire
          console.log('🔄 Tab 99 - Set expire for update with renewal:', selectedExpire)
        } else {
          // Renewal disabled: For v6+, check and fix negative expire
          console.log('🔄 Tab 99 - Update without renewal, checking expire:', props.appSpec.expire)
          if (versionFlags.value.supportsExpire && props.appSpec.expire < 0) {
            props.appSpec.expire = 88000
            console.log('🔄 Tab 99 - Fixed negative expire for update without renewal:', 88000)
          } else {
            console.log('🔄 Tab 99 - Keeping current expire (not negative or not v6+):', props.appSpec.expire)
          }
        }
      }
    }

    console.log('🔄 Tab 99 - After expire fix:', props.appSpec?.expire)

    await fetchBlockHeight()
    checkedExpiry = true

    // --- STEP 1: Validate Spec ---
    const specOK = await verifyAppSpec()
    verifyAppSpecResponse.value = specOK
    validated = true

    if (!specOK) {
      // Stop now, but delay UI update until after spinner
      isVeryfitying.value = false
      hasValidatedSpec.value = validated
      hasCheckedExpiry.value = checkedExpiry
      
      return
    }

    // --- STEP 2: Expiry ---


    // --- STEP 3: Price ---
    await priceForAppSpec()
    calculatedPrice = true


    // Spinner done → now update flags all at once
    isVeryfitying.value = false

    hasValidatedSpec.value = validated
    hasCheckedExpiry.value = checkedExpiry
    hasCalculatedPrice.value = calculatedPrice

    // Auto-sign for SSO users after validation completes
    if (loginType.value === 'sso' && calculatedPrice) {
      await dataSign()
    }
  }
})

// Auto-run test when entering Test & Pay tab (tab 100)
watch(tab, async (newVal, oldVal) => {
  if (newVal === 100 && oldVal !== 100) {
    console.log('📋 ENTERING TEST & PAY TAB', {
      hasRegistrationHash: !!registrationHash.value,
      testFinished: testFinished.value,
      testError: testError.value,
      testRunning: testRunning.value,
      specsHaveChanged: specsHaveChanged.value,
      isNewApp: props.newApp,
      appSpecPrice: appSpecPrice.value?.flux,
    })

    // Auto-run test ONLY if test section is visible (same conditions as v-if in template)
    // Test section shows when: !testFinished && specsHaveChanged && (newApp || paid update) && !paymentProcessing && !paymentConfirmed
    const testSectionVisible =
      !testFinished.value &&
      specsHaveChanged.value &&
      (props.newApp || appSpecPrice.value?.flux !== 0) &&
      !paymentProcessing.value &&
      !paymentConfirmed.value

    const shouldAutoTest =
      testSectionVisible &&
      registrationHash.value &&
      !testRunning.value

    if (shouldAutoTest) {
      console.log('🚀 AUTO-TRIGGERING TEST INSTALLATION')

      // Small delay to ensure UI is ready
      await nextTick()
      setTimeout(() => {
        testAppInstall()
      }, 500)
    } else {
      console.log('⏭️ Skipping auto-test:', {
        reason: !testSectionVisible ? 'Test section not visible (test not required)' :
          !registrationHash.value ? 'No registration hash' :
            testRunning.value ? 'Test already running' :
              'Unknown',
      })
    }
  }
})

async function uploadEnvToFluxStorage(componentIndex) {
  try {
    isUploadingEnv.value = true

    // Build array from TABLE rows -> ["KEY=VALUE", ...]
    const envArray = (envDialog.entries || [])
      .map(e => {
        const k = String(e?.key ?? '').trim()
        const v = String(e?.value ?? '').trim()
        
        return k && v ? `${k}=${v}` : ''
      })
      .filter(Boolean)

    if (!envArray.length) {
      showToast('warning', 'No environment variables to upload')
      
      return
    }

    // Skip if table already contains a pointer
    if (envArray.some(line => line.includes('F_S_ENV='))) {
      showToast('warning', 'Environment parameters are already in Flux Storage')
      
      return
    }

    const envid = Math.floor(Math.random() * 999999999999999).toString()
    const { data } = await axios.post('https://storage.runonflux.io/v1/env', { envid, env: envArray })

    if (data?.status === 'error') {
      showToast('danger', data?.message || 'Upload failed')
      
      return
    }

    const pointer = `F_S_ENV=https://storage.runonflux.io/v1/env/${envid}`
    showToast('success', 'Successful upload of Environment to Flux Storage')

    // Clear the table and add a single "normal" entry with the upload link
    envDialog.entries.splice(0, envDialog.entries.length, {
      key: 'F_S_ENV',
      value: `https://storage.runonflux.io/v1/env/${envid}`,
    })

  } catch (err) {
    showToast('danger', err?.message || String(err))
  } finally {
    isUploadingEnv.value = false
  }
}

async function uploadCmdToFluxStorage(componentIndex) {
  try {
    isUploadingCmd.value = true

    // Build array from table rows
    const cmdArray = (commandsDialog.entries || [])
      .map(v => (typeof v === 'string' ? v.trim() : String(v || '').trim()))
      .filter(v => v.length > 0)

    if (!cmdArray.length) {
      showToast('warning', 'No commands to upload')
      
      return
    }

    // Skip if pointer already exists
    if (cmdArray.some(e => e.includes('F_S_CMD='))) {
      showToast('warning', 'Commands are already in Flux Storage')
      
      return
    }

    const cmdid = Math.floor(Math.random() * 999999999999999).toString()
    const { data } = await axios.post('https://storage.runonflux.io/v1/cmd', { cmdid, cmd: cmdArray })

    if (data?.status === 'error') {
      showToast('danger', data?.message || 'Upload failed')
      
      return
    }

    const pointer = `F_S_CMD=https://storage.runonflux.io/v1/cmd/${cmdid}`

    showToast('success', 'Successful upload of Commands to Flux Storage')

    // Clear table and add single pointer entry
    commandsDialog.entries.splice(0, commandsDialog.entries.length, pointer)

  } catch (err) {
    showToast('danger', err?.message || String(err))
  } finally {
    isUploadingCmd.value = false
  }
}

function normalizeContacts(list) {
  return (list || [])
    .map(item => {
      if (typeof item === 'string') return item.trim()

      // Vue/Vuetify often uses objects for selections
      const val = item?.value ?? item?.title ?? item?.text ?? ''
      
      return String(val).trim()
    })
    .filter(Boolean)
}

async function uploadContactsToFluxStorage() {
  try {
    isUploadingContacts.value = true

    // Normalize from VCombobox (strings or objects)
    const contactsArray = appDetails.value.contacts
    console.log(contactsArray)

    if (contactsArray.length === 0) {
      showToast('warning', 'No contacts to upload')
      
      return
    }

    if (contactsArray.some(e => e.includes('F_S_CONTACTS='))) {
      showToast('warning', 'Contacts are already in Flux Storage')
      
      return
    }

    const contactsid = Math.floor(Math.random() * 999999999999999).toString()
    const { data } = await axios.post('https://storage.runonflux.io/v1/contacts', {
      contactsid,
      contacts: contactsArray,
    })

    if (data?.status === 'error') {
      showToast('danger', data?.message || 'Upload failed')
      
      return
    }

    const pointerUrl = `https://storage.runonflux.io/v1/contacts/${contactsid}`
    const pointer = `F_S_CONTACTS=${pointerUrl}`
    showToast('success', 'Successful upload of Contacts to Flux Storage')

    // Replace chips with a single pointer entry (leave appSpec update to your Save)
    appDetails.value.contacts.splice(0, appDetails.value.contacts.length, pointer)
  } catch (err) {
    showToast('danger', err?.message || String(err))
  } finally {
    isUploadingContacts.value = false
  }
}

async function verifyAppSpec() {
  appSpecFormated.value = null
  try {
    const appSpecTemp = JSON.parse(JSON.stringify(props.appSpec))

    // ========================================================================
    // MARKETPLACE APP REPOTAG CHECK (only for new app registration)
    // ========================================================================
    if (props.newApp && marketPlaceApps.value.length > 0 && appSpecTemp.compose) {
      // Check if any component uses a marketplace-restricted repotag
      for (const component of appSpecTemp.compose) {
        if (component.repotag) {
          const repotagLower = component.repotag.toLowerCase()

          // Check against all marketplace apps
          for (const marketApp of marketPlaceApps.value) {
            if (marketApp.compose && Array.isArray(marketApp.compose)) {
              for (const marketComponent of marketApp.compose) {
                if (marketComponent.repotag) {
                  const marketRepotagLower = marketComponent.repotag.toLowerCase()

                  // Check if repotag matches
                  if (repotagLower === marketRepotagLower || repotagLower.includes(marketRepotagLower.split(':')[0])) {
                    throw new Error(t('core.subscriptionManager.marketplaceAppRestricted', { repotag: component.repotag }))
                  }
                }
              }
            }
          }
        }
      }
    }

    // ========================================================================
    // VERSION-SPECIFIC STRUCTURE CLEANUP AND SYNC
    // ========================================================================

    console.log('[verifyAppSpec] Original appSpecTemp:', {
      version: appSpecTemp.version,
      _isV3Original: appSpecTemp._isV3Original,
      hasCompose: !!appSpecTemp.compose,
      composePath: appSpecTemp.compose?.[0],
      flatPorts: appSpecTemp.ports,
      flatContainerPorts: appSpecTemp.containerPorts,
      flatEnvParams: appSpecTemp.enviromentParameters,
    })

    // V3: Sync compose → flat fields and convert to V3 format
    if (appSpecTemp._isV3Original && appSpecTemp.compose && appSpecTemp.compose[0]) {
      console.log('[V3 Sync] BEFORE sync - compose[0] data:', {
        name: appSpecTemp.compose[0].name,
        ports: appSpecTemp.compose[0].ports,
        portsType: typeof appSpecTemp.compose[0].ports[0],
        containerPorts: appSpecTemp.compose[0].containerPorts,
        environmentParameters: appSpecTemp.compose[0].environmentParameters,
        repotag: appSpecTemp.compose[0].repotag,
      })
      console.log('[V3 Sync] BEFORE sync - flat fields:', {
        name: appSpecTemp.name,
        ports: appSpecTemp.ports,
        portsType: appSpecTemp.ports ? typeof appSpecTemp.ports[0] : 'undefined',
        containerPorts: appSpecTemp.containerPorts,
        enviromentParameters: appSpecTemp.enviromentParameters,
        repotag: appSpecTemp.repotag,
      })

      const component = appSpecTemp.compose[0]

      // Sync component fields to flat structure
      appSpecTemp.name = component.name
      appSpecTemp.description = component.description
      appSpecTemp.repotag = component.repotag
      appSpecTemp.containerData = component.containerData
      appSpecTemp.cpu = component.cpu
      appSpecTemp.ram = component.ram
      appSpecTemp.hdd = component.hdd

      // CRITICAL: Convert ports back to STRINGS (V3 requirement)
      const portsBeforeConversion = component.ports
      const containerPortsBeforeConversion = component.containerPorts
      appSpecTemp.ports = component.ports.map(p => String(p))
      appSpecTemp.containerPorts = component.containerPorts.map(p => String(p))
      console.log('[V3 Sync] Port conversion:', {
        portsFrom: portsBeforeConversion,
        portsTo: appSpecTemp.ports,
        containerPortsFrom: containerPortsBeforeConversion,
        containerPortsTo: appSpecTemp.containerPorts,
      })

      // CRITICAL: Revert typo fix back to V3 format (enviromentParameters with typo)
      appSpecTemp.enviromentParameters = component.environmentParameters
      console.log('[V3 Sync] Environment parameters sync:', {
        from: 'environmentParameters (no typo)',
        to: 'enviromentParameters (with typo)',
        value: appSpecTemp.enviromentParameters,
      })

      // Sync array fields
      appSpecTemp.commands = component.commands || []
      appSpecTemp.domains = component.domains || []

      // Force tiered = false (V3 requires boolean field)
      appSpecTemp.tiered = false
      console.log('[V3 Sync] Forced tiered = false (V3 requires boolean)')

      // Remove V3-unsupported fields
      const fieldsToDelete = ['compose', '_isV3Original', 'contacts', 'geolocation', 'expire', 'nodes', 'staticip', 'enterprise', 'repoauth']
      console.log('[V3 Sync] Deleting unsupported fields:', fieldsToDelete)
      delete appSpecTemp.compose  // V3 doesn't support compose field
      delete appSpecTemp._isV3Original  // Remove adapter flag
      delete appSpecTemp.contacts  // V5+
      delete appSpecTemp.geolocation  // V5+
      delete appSpecTemp.expire  // V6+
      delete appSpecTemp.nodes  // V7+
      delete appSpecTemp.staticip  // V7+
      delete appSpecTemp.enterprise  // V8
      delete appSpecTemp.repoauth  // Not at root level for V3

      console.log('[V3 Sync] AFTER sync - Clean V3 flat structure:', {
        version: appSpecTemp.version,
        name: appSpecTemp.name,
        ports: appSpecTemp.ports,
        portsType: typeof appSpecTemp.ports[0],
        containerPorts: appSpecTemp.containerPorts,
        enviromentParameters: appSpecTemp.enviromentParameters,
        tiered: appSpecTemp.tiered,
        hasCompose: !!appSpecTemp.compose,
        has_isV3Original: !!appSpecTemp._isV3Original,
      })
      console.log('[V3 Sync] Complete V3 spec for validation:', JSON.stringify(appSpecTemp, null, 2))
    }

    // NOTE: V4-V7 specs keep their tiered fields and secrets when validating as-is
    // These fields are only removed during spec version conversion (handled separately)

    // V8: Ensure tiered fields don't exist in components
    if (appSpecTemp.version >= 8) {
      console.log('[V8 Cleanup] Ensuring no tiered fields in components')
      if (appSpecTemp.compose && Array.isArray(appSpecTemp.compose)) {
        const fieldsToCheck = ['tiered', 'cpubasic', 'rambasic', 'hddbasic', 'cpusuper', 'ramsuper', 'hddsuper', 'cpubamf', 'rambamf', 'hddbamf']

        appSpecTemp.compose.forEach((component, index) => {
          const foundTieredFields = fieldsToCheck.filter(field => component[field] !== undefined)
          if (foundTieredFields.length > 0) {
            console.log(`[V8 Cleanup] Component[${index}] found tiered fields (removing):`, foundTieredFields)
          }

          delete component.tiered
          delete component.cpubasic
          delete component.rambasic
          delete component.hddbasic
          delete component.cpusuper
          delete component.ramsuper
          delete component.hddsuper
          delete component.cpubamf
          delete component.rambamf
          delete component.hddbamf
        })
      }
    }

    console.log('[verifyAppSpec] After version-specific cleanup:', {
      version: appSpecTemp.version,
      hasCompose: !!appSpecTemp.compose,
      composeLength: appSpecTemp.compose?.length,
      hasTiered: appSpecTemp.tiered !== undefined,
      has_isV3Original: !!appSpecTemp._isV3Original,
    })

    // ========================================================================
    // END VERSION-SPECIFIC CLEANUP
    // ========================================================================

    // Ensure required fields exist for version >= 5
    if (appSpecTemp.version >= 5) {
      if (!appSpecTemp.contacts) appSpecTemp.contacts = []
      if (!appSpecTemp.geolocation) appSpecTemp.geolocation = []
    }

    // For UPDATE without renewal: Send fork-aware remaining blocks
    // This represents the time remaining on the current subscription
    // Backend should recognize this as maintaining current expiry (not extending)
    if (blocksToExpire.value !== null && !renewalEnabled.value && appSpecTemp.version >= 6 && managementAction.value === 'update'){
      // Only set expire to blocksToExpire if it's positive (valid remaining blocks)
      if (blocksToExpire.value > 0) {
        appSpecTemp.expire = blocksToExpire.value
        console.log(`[V${appSpecTemp.version}] UPDATE without renewal - sending fork-aware remaining blocks:`, blocksToExpire.value)
      } else {
        // If expired/negative, keep original positive value
        console.log(`[V${appSpecTemp.version}] App expired - keeping original expire:`, appSpecTemp.expire)
      }
    }

    // Check if this is a marketplace app (for tracking/display purposes only)
    // Like Flux Home UI: marketplace info used ONLY for UI, NOT for pricing
    const appName = appSpecTemp.name
    const marketPlaceApp = marketPlaceApps.value.find(app => appName?.toLowerCase().startsWith(app.name.toLowerCase()))

    if (marketPlaceApp) {
      console.log('Marketplace app detected:', marketPlaceApp.name)
      if (marketPlaceApp.multiplier > 1) {
        console.log('Marketplace multiplier:', marketPlaceApp.multiplier, '× General:', generalMultiplier.value, '= Combined:', marketPlaceApp.multiplier * generalMultiplier.value)
      }
    }

    delete appSpecTemp.priceUSD
    if (appSpecTemp.version >= 8) {
      console.log('Version 8+ app - checking enterprise mode')
      console.log('UI isPrivateApp state:', isPrivateApp.value)
      console.log('AppSpec enterprise field:', appSpecTemp.enterprise)

      // For v8+: Use UI state (isPrivateApp.value) to determine if encryption should happen
      // The UI state is set based on the enterprise checkbox or existing enterprise data
      if (isPrivateApp.value) {
        console.log('Enterprise v8+ encryption process starting...')
        console.log('Original appSpecTemp before encryption:', JSON.stringify(appSpecTemp, null, 2))
        
        const zelidauth = localStorage.getItem('zelidauth')
        console.log('Using current owner for encryption:', appSpecTemp.owner)

        // call api to get RSA public key
        const appPubKeyData = {
          name: appSpecTemp.name,
          owner: appSpecTemp.owner,
        }
        const responseGetPublicKey = await AppsService.getAppPublicKey(zelidauth, appPubKeyData)
        console.log('getAppPublicKey response:', responseGetPublicKey.data)
        if (responseGetPublicKey.data.status === 'error') {
          const errorData = responseGetPublicKey.data.data
          let errorMsg = 'Failed to get app public key'
          if (errorData) {
            if (typeof errorData === 'string') {
              errorMsg = errorData
            } else if (errorData.message) {
              errorMsg = errorData.message
            } else {
              errorMsg = JSON.stringify(errorData)
            }
          }
          throw new Error(errorMsg)
        }
        const pubkey = responseGetPublicKey.data.data
        console.log('Retrieved public key length:', pubkey.length)

        // Check if WebCrypto is available before proceeding
        if (!isWebCryptoAvailable()) {
          console.warn('WebCrypto not available, cannot use enterprise features')
          
          // Show user-friendly toast instead of blocking error
          showToast('warning', 'Enterprise features require HTTPS or localhost. Please access this application using a secure connection.', 'mdi-alert-triangle', 6000)
          
          // Reset enterprise mode and return gracefully
          appSpec.value.enterprise = ''
          
          return
        }

        const rsaPubKey = await importRsaPublicKey(pubkey)
        const aesKey = crypto.getRandomValues(new Uint8Array(32))

        const encryptedEnterpriseKey = await encryptAesKeyWithRsaKey(
          aesKey,
          rsaPubKey,
        )
        const enterpriseSpecs = {
          contacts: appSpecTemp.contacts,
          compose: appSpecTemp.compose,
        }
        console.log('Enterprise specs to encrypt:', JSON.stringify(enterpriseSpecs, null, 2))
        
        const encryptedEnterprise = await encryptEnterpriseWithAes(
          JSON.stringify(enterpriseSpecs),
          aesKey,
          encryptedEnterpriseKey,
        )
        console.log('Encrypted enterprise data length:', encryptedEnterprise.length)
        
        appSpecTemp.enterprise = encryptedEnterprise
        appSpecTemp.contacts = []
        appSpecTemp.compose = []
        
        console.log('AppSpecTemp after encryption:', JSON.stringify(appSpecTemp, null, 2))
      }
    } else if (appSpecTemp.version === 7) {
      // Handle v7 encryption
      if (isPrivateApp.value) {
        
        // Ensure we have selected nodes
        if (!selectedNodes.value || selectedNodes.value.length === 0) {
          throw new Error('Please select enterprise nodes for your private application')
        }
        
        // Fetch PGP keys for selected nodes
        const fetchedKeys = await getEnterprisePGPKeys(selectedNodes.value)
        
        // Encrypt secrets and repoauth for each component
        let secretsPresent = false
        for (const component of appSpecTemp.compose || []) {
          if (component.secrets && !component.secrets.startsWith('-----BEGIN PGP MESSAGE')) {
            // Encrypt secrets
            const encryptedSecrets = await encryptMessage(component.secrets, fetchedKeys)
            component.secrets = encryptedSecrets
            secretsPresent = true
          }
          
          if (component.repoauth && !component.repoauth.startsWith('-----BEGIN PGP MESSAGE')) {
            // Encrypt repoauth
            const encryptedRepoAuth = await encryptMessage(component.repoauth, fetchedKeys)
            component.repoauth = encryptedRepoAuth
            secretsPresent = true
          }
        }
        
        // Set nodes in appSpec
        appSpecTemp.nodes = selectedNodes.value.map(node => node.ip)
        
        if (!secretsPresent && appSpecTemp.nodes.length === 0) {
          showToast('warning', 'No secrets or repository authentication to encrypt, but nodes have been set')
        }
      }
    }

    console.log('Sending appSpec for validation:', appSpecTemp)
    
    // Additional validation before sending to API
    if (isPrivateApp.value && appSpecTemp.version === 7 && (!appSpecTemp.nodes || appSpecTemp.nodes.length === 0)) {
      throw new Error('Enterprise app requires selected nodes')
    }
    
    // For version 8+ enterprise apps, ensure all required fields are present
    if (appSpecTemp.version >= 8 && isPrivateApp.value) {
      console.log('Enterprise app validation - checking required fields')
      if (!appSpecTemp.enterprise || appSpecTemp.enterprise.length === 0) {
        throw new Error('Enterprise encryption failed - no encrypted data')
      }
      if (!appSpecTemp.name || !appSpecTemp.owner) {
        throw new Error('Enterprise app missing required fields: name or owner')
      }

      // Ensure contacts and compose are arrays (even if empty for encrypted apps)
      if (!Array.isArray(appSpecTemp.contacts)) {
        appSpecTemp.contacts = []
      }
      if (!Array.isArray(appSpecTemp.compose)) {
        appSpecTemp.compose = []
      }
    }
    
    // Use appropriate endpoint based on whether it's a new app or update
    const verifyEndpoint = props.newApp 
      ? '/apps/verifyappregistrationspecifications'
      : '/apps/verifyappupdatespecifications'
    
    const response = await props.executeLocalCommand(
      verifyEndpoint,
      JSON.stringify(appSpecTemp),
      null,
      true,
    )

    if (response.data?.status !== 'success') {
      console.error('Validation failed. Full response:', response.data)
      console.error('Request that failed:', JSON.stringify(appSpecTemp, null, 2))
      
      let errorMsg = 'Validation failed'
      if (response.data?.data) {
        if (typeof response.data.data === 'string') {
          errorMsg = response.data.data
        } else if (response.data.data.message) {
          errorMsg = response.data.data.message
        } else {
          errorMsg = JSON.stringify(response.data.data)
        }
        
        // Handle specific enterprise-related errors
        if (errorMsg.includes('appSpecifications')) {
          errorMsg = 'Enterprise validation error: Backend expects different data format. Please check that all required fields are present.'
        }
      } else if (response.data?.message) {
        errorMsg = response.data.message
      }
      
      verifyAppSpecError.value = errorMsg
      showToast('error', errorMsg)
      
      return false
    }
    appSpecFormated.value = response.data.data

    return true
  } catch (error) {
    console.error('Validation error caught:', error)
    console.error('Error response:', error.response?.data)
    
    let errorMsg = error.message || error.toString() || 'Unknown error'
    
    // Handle specific enterprise encryption errors
    if (errorMsg.includes('appSpecifications') || 
        (error.response?.data && JSON.stringify(error.response.data).includes('appSpecifications'))) {
      errorMsg = 'Enterprise validation failed: Data structure mismatch. This may be due to encryption process issues.'
    }
    
    // Handle missing enterprise nodes
    if (errorMsg.includes('select enterprise nodes')) {
      errorMsg = t('core.subscriptionManager.enterpriseNodesRequired')
    }
    
    verifyAppSpecError.value = errorMsg
    showToast('error', errorMsg)
    
    return false
  }
}

async function priceForAppSpec() {
  try {
    // Check if app is marketplace app
    const appName = appSpecFormated.value?.name
    const marketPlaceApp = marketPlaceApps.value.find(app => appName?.toLowerCase().startsWith(app.name.toLowerCase()))

    console.log('=== Price Calculation Debug ===')
    console.log('App name:', appName)
    console.log('Marketplace apps loaded:', marketPlaceApps.value.length)
    console.log('Is marketplace app:', !!marketPlaceApp)
    if (marketPlaceApp) {
      console.log('Marketplace app details:', marketPlaceApp)
      console.log('Marketplace multiplier:', marketPlaceApp.multiplier)
      if (marketPlaceApp.multiplier > 1) {
        console.log('Combined multiplier (marketplace × general):', marketPlaceApp.multiplier * generalMultiplier.value)
      }
      console.log('Note: Backend will apply multipliers automatically')
    }

    // Clone the app spec for price calculation
    const appSpecForPrice = JSON.parse(JSON.stringify(appSpecFormated.value))
    delete appSpecForPrice.priceUSD

    const response = await props.executeLocalCommand(
      '/apps/calculatefiatandfluxprice',
      JSON.stringify(appSpecForPrice),
      null,
      true,
    )

    console.log('Price calculation response:', response.data)

    if (response.data?.status !== 'success') {
      appSpecPrice.value = null

      return false
    }

    appSpecPrice.value = response.data.data
    console.log('Calculated price:', appSpecPrice.value)

    // Update marketplace app flag for payment tracking
    if (marketPlaceApp) {
      isMarketplaceApp.value = true
    }

    return true
  } catch (error) {
    console.error('Price calculation error:', error)
    appSpecPrice.value = null

    return false
  }
}

function adjustRenewalOptionsForBlockHeight() {
  // After block 2020000, the chain works 4x faster, so expire periods need to be multiplied by 4
  if (blockHeight.value >= FORK_BLOCK_HEIGHT) {
    renewalOptions.value = [
      { value: 20000, label: '1 week' },
      { value: 44000, label: '2 weeks' },
      { value: 88000, label: '1 month' },
      { value: 264000, label: '3 months' },
      { value: 528000, label: '6 months' },
      { value: 1056000, label: '1 year' },
    ]
  }
}

async function fetchBlockHeight() {
  try {
    const res = await props.executeLocalCommand('/daemon/getblockcount')

    if (res?.data?.status === 'success' && typeof res.data?.data === 'number') {
      blockHeight.value = res.data.data

      // Adjust renewal options based on block height
      adjustRenewalOptionsForBlockHeight()

      // Fork-aware default expire
      const defaultExpire = (props.appSpec?.height && props.appSpec.height >= FORK_BLOCK_HEIGHT) ? 88000 : 22000
      const expireBlocks = props.appSpec?.expire ?? defaultExpire

      // For new apps or renewal, use current block height
      // For updates without renewal, use the app's original height
      const height = (renewalEnabled.value || props.newApp) ? blockHeight.value : props.appSpec.height

      console.log('Expire blocks:', expireBlocks)
      console.log('Block height:', blockHeight.value)
      console.log('Is new app:', props.newApp)

      if (typeof height === 'number') {
        blocksToExpire.value = height + expireBlocks - blockHeight.value
        console.log('Blocks to expire (initial):', blocksToExpire.value)

        // For new apps, blocksToExpire equals expireBlocks since we start from current height
        if (props.newApp) {
          blocksToExpire.value = expireBlocks

          // For new apps, always set isExpiryValid to true since they're not expired
          // We just need a valid subscription period (expireBlocks > 0)
          isExpiryValid.value = true
          console.log('New app - blocks to expire:', blocksToExpire.value, 'isExpiryValid:', isExpiryValid.value)
        } else {
          // For existing apps doing update without renewal, check if they have at least 1 week remaining
          // If renewal is enabled or in cancel mode, skip this check
          if (!renewalEnabled.value && managementAction.value !== 'renewal' && managementAction.value !== 'cancel') {
            // Fork-aware validation: Calculate remaining time in minutes, then check against 1 week
            let remainingMinutes = 0

            if (height < FORK_BLOCK_HEIGHT && blockHeight.value >= FORK_BLOCK_HEIGHT) {
              // Pre-fork app, currently post-fork: Use split calculation
              const blockTimeAtRegistration = 2 // Pre-fork: 2 minutes per block
              const subscriptionDurationMinutes = expireBlocks * blockTimeAtRegistration

              // Calculate elapsed time from registration to now
              const blocksBeforeFork = FORK_BLOCK_HEIGHT - height
              const blocksAfterFork = blockHeight.value - FORK_BLOCK_HEIGHT
              const elapsedMinutes = (blocksBeforeFork * 2) + (blocksAfterFork * 0.5)

              // Remaining time in minutes
              remainingMinutes = subscriptionDurationMinutes - elapsedMinutes
            } else {
              // Simple case: both registration and current are on same side of fork
              const minutesPerBlock = blockHeight.value >= FORK_BLOCK_HEIGHT ? 0.5 : 2
              remainingMinutes = blocksToExpire.value * minutesPerBlock
            }

            // 1 week = 7 days = 10,080 minutes
            const minMinutes = 7 * 24 * 60 // 10,080 minutes = 1 week
            isExpiryValid.value = remainingMinutes >= minMinutes

            // FIX: Update blocksToExpire with fork-aware remaining blocks (for spec v6+ free updates)
            // Convert remainingMinutes back to blocks at current (post-fork) rate
            if (blockHeight.value >= FORK_BLOCK_HEIGHT && remainingMinutes > 0) {
              blocksToExpire.value = Math.floor(remainingMinutes / 0.5) // Post-fork: 0.5 min/block
            } else if (remainingMinutes > 0) {
              blocksToExpire.value = Math.floor(remainingMinutes / 2) // Pre-fork: 2 min/block
            }
            // If remainingMinutes <= 0, keep negative blocksToExpire (will be caught by validation)

            console.log('Expiry validation:', {
              height,
              blockHeight: blockHeight.value,
              expireBlocks,
              blocksToExpire: blocksToExpire.value,
              remainingMinutes,
              minMinutes,
              isExpiryValid: isExpiryValid.value,
            })
          } else {
            // Renewal or cancel - always valid
            isExpiryValid.value = true
          }
        }
      } else {
        // For new apps, we still want to proceed even without height
        isExpiryValid.value = props.newApp ? true : false
        console.log('Height is not a number, isExpiryValid:', isExpiryValid.value)
      }
    } else {
      console.log('Failed to get block count, response:', res?.data)
      blockHeight.value = null

      // For new apps, we can proceed without block height
      isExpiryValid.value = props.newApp ? true : false
    }
  } catch (err) {
    console.error('Error fetching block height:', err)
    blockHeight.value = null

    // For new apps, we can proceed without block height
    isExpiryValid.value = props.newApp ? true : false
  }
}

const callbackValue = computed(() => {
  const backendURL = localStorage.getItem("backendURL") || getDetectedBackendURL()
  const url = `${backendURL}/id/providesign`
  
  return encodeURI(url)
})

// === Prepare data to sign ===
const dataToSign = ref('')

async function dataSign() {
  const marketPlaceApp = marketPlaceApps.value.find(app => appSpecFormated.value.name.toLowerCase().startsWith(app.name.toLowerCase()))
  if (marketPlaceApp) {
    isMarketplaceApp.value = true
  }
  isSigning.value = true
  signingFailed.value = false // Reset failed state when starting new sign attempt
  timestamp.value = Date.now()
  dataToSign.value = `${updatetype.value}${version}${JSON.stringify(appSpecFormated.value)}${timestamp.value}`
  await signMethod()
}

// Cancel signing process
function cancelSigning() {
  isSigning.value = false

  // Close websocket if open
  if (websocket.value) {
    websocket.value.close()
    websocket.value = null
  }

  // Disconnect wallet connect if connected
  if (signClient.value) {
    signClient.value = null
  }
  showToast('info', 'Signing cancelled')
}

// Propagate signed message
async function propagateSignedMessage() {
  if (!signature.value) {
    showToast('error', 'No signature found. Please sign the message first.')

    return
  }

  isPropagating.value = true

  try {
    const data = {
      type: updatetype.value,
      version: 1,
      appSpecification: appSpecFormated.value,
      timestamp: timestamp.value,
      signature: signature.value,
    }

    const zelidauth = localStorage.getItem('zelidauth')
    const response = props.newApp
      ? await AppsService.registerApp(zelidauth, data)
      : await AppsService.updateApp(zelidauth, data)

    if (response.data?.status === 'success') {
      registrationHash.value = response.data.data
      showToast('success', 'Application registered successfully! Redirecting to Test & Pay...')

      // Fetch deployment information
      await getDeploymentInfo()

      // Auto-navigate to Test & Pay tab after 2 seconds
      // The tab watcher will handle auto-starting monitoring for free updates
      setTimeout(() => {
        tab.value = 100
      }, 2000)
    } else {
      throw new Error(response.data?.data?.message || response.data?.data || 'Registration failed')
    }
  } catch (error) {
    console.error('Registration error:', error)

    let errorMessage = 'Failed to register application'

    if (error.response?.data?.data?.message) {
      errorMessage = error.response.data.data.message
    } else if (error.response?.data?.data) {
      errorMessage = error.response.data.data
    } else if (error.message) {
      errorMessage = error.message
    }

    showToast('error', errorMessage)

    // Reset signature so user must sign again
    signature.value = ''
    signingFailed.value = true
  } finally {
    isPropagating.value = false
  }
}

// Get deployment information for payment
async function getDeploymentInfo() {
  try {
    const response = await props.executeLocalCommand('/apps/deploymentinformation')
    
    if (response.data?.status === 'success') {
      deploymentAddress.value = response.data.data.address
    }
  } catch (error) {
    console.error('Failed to get deployment info:', error)
  }
}

// Test app installation with live streaming
async function testAppInstall() {
  if (!registrationHash.value) {
    showToast('error', 'Please propagate the signed message first')

    return
  }

  // Reset all test states and UI
  testError.value = false
  testFinished.value = false
  testRunning.value = true

  // Collapse logs first to hide old content
  logsExpanded.value = false

  // Clear the array
  testOutput.value = []

  // Wait for Vue to update the DOM and clear the old logs
  await nextTick()

  // Small additional delay to ensure rendering
  await new Promise(resolve => setTimeout(resolve, 50))

  // Now expand logs for new test
  logsExpanded.value = true

  showToast('info', t('core.subscriptionManager.testStarting'))

  // Add initial status message
  testOutput.value.push({
    status: 'info',
    message: t('core.subscriptionManager.testInitializing'),
    timestamp: new Date().toISOString(),
    step: 'init',
  })

  try {
    const zelidauth = localStorage.getItem('zelidauth')

    // Simulate streaming by breaking the test into phases
    await streamTestPhase(t('core.subscriptionManager.testPreparingEnvironment'), 'info', 500)
    await streamTestPhase(t('core.subscriptionManager.testConnectingNetwork'), 'info', 800)
    await streamTestPhase(t('core.subscriptionManager.testValidatingImage'), 'info', 1000)

    // Use registrationHash for testing - this is the message hash from registration/update
    // The backend test API accepts either app name (for existing apps, requires owner auth)
    // or message hash (for temporary messages, anyone can test)
    console.log('Testing with hash:', registrationHash.value, 'isNewApp:', props.newApp)

    // Use api.runonflux.io which automatically routes to available nodes
    const url = `https://api.runonflux.io/apps/testappinstall/${registrationHash.value}`

    const axiosConfig = {
      headers: {
        zelidauth,
      },
    }

    console.log('Testing on Flux network via api.runonflux.io')

    const response = await axios.get(url, axiosConfig)

    await streamTestPhase(t('core.subscriptionManager.testProcessingResults'), 'info', 300)

    // Check the response status first
    console.log('Test response:', response.data)

    if (response.data?.status === 'error') {
      await streamTestPhase(`Test failed: ${response.data.data?.message || response.data.data || 'Unknown error'}`, 'error', 200)
      testError.value = true
      showToast('error', t('core.subscriptionManager.testInstallationFailed'))

      return
    }

    // Process the actual test results
    if (response.data?.status === 'success' && response.data?.data) {
      await streamTestPhase(t('core.subscriptionManager.testAnalyzingResults'), 'info', 400)
      
      const rawData = response.data.data
      let parsedResults = []
      
      if (typeof rawData === 'string' && rawData.trim().length > 0) {
        try {
          const outputText = rawData.includes('}{') ? rawData.replace(/}{/g, '},{') : rawData
          if (outputText.trim().startsWith('{') || outputText.trim().startsWith('[')) {
            parsedResults = JSON.parse(outputText.startsWith('[') ? outputText : `[${outputText}]`)
          } else {
            parsedResults = [{ status: 'info', message: rawData }]
          }
        } catch (jsonError) {
          console.warn('Failed to parse JSON output:', jsonError)
          parsedResults = [{ status: 'info', message: rawData }]
        }
      }
      
      // Stream the parsed results
      for (const result of parsedResults) {
        await streamTestPhase(
          result.message || t('core.subscriptionManager.testStepCompleted'),
          result.status || 'info',
          200,
          result,
        )
      }
      
      // Helper function to detect errors in message content
      const containsError = message => {
        if (!message || typeof message !== 'string') return false
        const errorPatterns = /ERROR|FAILED|FATAL|Exception|CRASH|ABORT|terminated|exit code [1-9]/i
        
        return errorPatterns.test(message)
      }

      // Helper function to detect warnings in message content
      const containsWarning = message => {
        if (!message || typeof message !== 'string') return false
        const warningPatterns = /WARNING|WARN|deprecated/i
        
        return warningPatterns.test(message)
      }
      
      // Determine final status - check both status field AND message content
      const hasErrors = parsedResults.some(r => 
        r.status === 'error' || containsError(r.message),
      )
      const hasWarnings = parsedResults.some(r => 
        r.status === 'warning' || containsWarning(r.message),
      )
      
      if (hasErrors) {
        await streamTestPhase(t('core.subscriptionManager.testCompletedWithErrors'), 'error', 300)
        testError.value = true
        showToast('error', t('core.subscriptionManager.testFailedCheckInstallationLogs'))
      } else if (hasWarnings) {
        await streamTestPhase(t('core.subscriptionManager.testCompletedWithWarnings'), 'warning', 300)
        testError.value = false
        logsExpanded.value = false
        showToast('warning', t('core.subscriptionManager.testWarningsReviewLogs'))
      } else {
        await streamTestPhase(t('core.subscriptionManager.testInstallationSuccessful'), 'success', 300)
        testError.value = false
        logsExpanded.value = false
        showToast('success', t('core.subscriptionManager.testPassedReady'))
      }
    } else {
      // Handle other success cases
      await streamTestPhase(t('core.subscriptionManager.testInstallationCompletedSuccessfully'), 'success', 300)
      testError.value = false
      logsExpanded.value = false
      showToast('success', t('core.subscriptionManager.testCompletedReady'))
    }
    
  } catch (error) {
    await streamTestPhase(`Test failed: ${error.message || 'Unknown error'}`, 'error', 200)
    testError.value = true
    showToast('error', t('core.subscriptionManager.testInstallationFailed'))
    console.error('Test error:', error)
  } finally {
    testRunning.value = false
    testFinished.value = true

    await streamTestPhase(t('core.subscriptionManager.testProcessCompleted'), 'info', 200)
    
    console.log('Test completed:', {
      testFinished: testFinished.value,
      testError: testError.value,
      testOutput: testOutput.value.length,
      shouldShowPayment: testFinished.value && !testError.value,
    })
  }
}

// Helper function to stream test phases with realistic timing
async function streamTestPhase(message, status, delay, additionalData = {}) {
  // Add the message immediately
  testOutput.value.push({
    status,
    message,
    timestamp: new Date().toISOString(),
    step: additionalData.step || `step-${testOutput.value.length}`,
    ...additionalData,
  })
  
  // Wait for the delay to simulate processing time
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

// Force enable payment (fallback for edge cases)
function forceEnablePayment() {
  testError.value = false
  if (!testFinished.value) {
    testFinished.value = true
  }
  showToast('warning', 'Payment manually enabled. Please proceed with caution and ensure your app specifications are correct.')
  console.log('Payment manually enabled by user')
}

// Format output for display like local app install format
function formatOutput(output) {
  if (!output) return ''
  
  // Format like local app install output (similar to the management tab view)
  let formattedOutput = ''
  
  // Add timestamp (like local install logs)
  if (output.timestamp) {
    const timestamp = new Date(output.timestamp)
    formattedOutput += `[${timestamp.toLocaleTimeString()}] `
  }
  
  // Add status indicator (like local install)
  const status = output.status?.toUpperCase() || 'INFO'
  const statusSymbol = {
    'SUCCESS': '✓',
    'ERROR': '✗', 
    'WARNING': '⚠',
    'INFO': 'ℹ',
  }[status] || 'ℹ'
  
  formattedOutput += `${statusSymbol} ${status}: `
  
  // Add the main message
  if (output.message) {
    formattedOutput += output.message
  }
  
  // Add step information if available
  if (output.step && output.step !== 'init') {
    formattedOutput += ` (${output.step})`
  }
  
  // Add container/app information (like local install shows)
  if (output.containerName || output.appName) {
    formattedOutput += `\n    App: ${output.containerName || output.appName}`
  }
  
  // Add node information (like local install shows)
  if (output.node) {
    formattedOutput += `\n    Node: ${output.node}`
  }
  
  // Add progress if available
  if (output.progress !== undefined) {
    formattedOutput += `\n    Progress: ${output.progress}%`
  }
  
  // Add any additional details from nested data
  if (output.data && typeof output.data === 'object' && output.data !== output) {
    if (output.data.details) {
      formattedOutput += `\n    Details: ${output.data.details}`
    }
    if (output.data.port) {
      formattedOutput += `\n    Port: ${output.data.port}`
    }
    if (output.data.image) {
      formattedOutput += `\n    Image: ${output.data.image}`
    }
  }
  
  return formattedOutput
}

// Get status color for icons
function getStatusColor(status) {
  switch (status) {
  case 'success': return 'success'
  case 'error': return 'error'
  case 'warning': return 'warning'
  case 'info': return 'info'
  default: return 'primary'
  }
}

// Get status icon
function getStatusIcon(status) {
  switch (status) {
  case 'success': return 'mdi-check-circle'
  case 'error': return 'mdi-alert-circle'
  case 'warning': return 'mdi-alert-triangle'
  case 'info': return 'mdi-information'
  default: return 'mdi-circle-outline'
  }
}

// Payment methods
async function initStripePay(hash = null, name = null, price = null, description = null) {
  try {
    fiatCheckoutURL.value = ''
    checkoutLoading.value = true
    const zelidauth = localStorage.getItem('zelidauth')
    console.log('Stripe - zelidauth:', zelidauth ? 'Present' : 'Missing')
    
    if (!zelidauth) {
      showToast('error', 'Authentication required - please login first')
      checkoutLoading.value = false
      
      return
    }
    
    const auth = qs.parse(zelidauth)
    console.log('Stripe - Parsed auth:', {
      hasZelid: !!auth.zelid,
      zelid: auth.zelid ? auth.zelid.substring(0, 8) + '...' : 'none',
      hasSignature: !!auth.signature,
      hasLoginPhrase: !!auth.loginPhrase,
    })
    
    if (!auth.zelid || !auth.signature || !auth.loginPhrase) {
      showToast('error', 'Invalid authentication data - please login again')
      checkoutLoading.value = false
      
      return
    }
    
    const data = {
      zelid: auth.zelid,
      signature: auth.signature,
      loginPhrase: auth.loginPhrase,
      details: {
        name: name || appDetails.name,
        description: description || appDetails.description,
        hash: hash || registrationHash.value,
        price: price || appSpecPrice.value?.usd || 0,
        productName: name || appDetails.name,
        success_url: `${window.location.origin}/successcheckout`,
        cancel_url: window.location.origin,
        kpi: {
          origin: 'FluxOS',
          marketplace: isMarketplaceApp.value,
          registration: props.newApp || props.isRedeploy,
        },
      },
    }
    
    // Get final values to use
    const finalHash = hash || registrationHash.value
    const finalName = name || appDetails.name
    const finalDescription = description || appDetails.description  
    const finalPrice = price || appSpecPrice.value?.usd || 0
    
    // Validate required fields
    if (!finalHash) {
      showToast('error', 'Registration hash required - please register application first')
      checkoutLoading.value = false
      
      return
    }
    
    if (!finalPrice || finalPrice <= 0) {
      showToast('error', 'Invalid price - please calculate price first')
      checkoutLoading.value = false
      
      return
    }
    
    if (!finalName) {
      showToast('error', 'Application name required')
      checkoutLoading.value = false
      
      return
    }
    
    console.log('Stripe checkout request data:', JSON.stringify(data, null, 2))
    console.log('Stripe - appDetails:', appDetails)
    console.log('Stripe - registrationHash:', registrationHash.value)
    console.log('Stripe - appSpecPrice:', appSpecPrice.value)

    // Open popup immediately to avoid blocker (before API call)
    const popup = window.open('about:blank', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')

    // Check if popup was blocked immediately
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.warn('Stripe checkout popup was blocked by browser')
      checkoutLoading.value = false

      // Still make API call to get URL for manual opening
      try {
        const checkoutURL = await axios.post(`${paymentBridge}/api/v1/stripe/checkout/create`, data)
        if (checkoutURL.data.status === 'success') {
          popupBlockedDialog.value = true
          blockedPaymentUrl.value = checkoutURL.data.data
          blockedPaymentType.value = 'Stripe'
        }
      } catch (error) {
        console.error('Stripe checkout error:', error)
      }
      
      return
    }

    // Show loading message in popup while waiting for API
    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('core.subscriptionManager.loadingStripeCheckout')}</title>
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .loader-container { text-align: center; color: white; }
            .spinner { border: 4px solid rgba(255, 255, 255, 0.3); border-top: 4px solid white; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            h2 { margin: 0 0 10px 0; font-weight: 600; }
            p { margin: 0; opacity: 0.9; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="loader-container">
            <div class="spinner"></div>
            <h2>${t('core.subscriptionManager.redirectingToStripe')}</h2>
            <p>${t('core.subscriptionManager.pleaseWaitCheckout')}</p>
          </div>
        </body>
      </html>
    `)

    // Popup opened - now get the checkout URL
    try {
      const checkoutURL = await axios.post(`${paymentBridge}/api/v1/stripe/checkout/create`, data)
      console.log('Stripe checkout response:', checkoutURL.data)

      if (checkoutURL.data.status === 'error') {
        console.error('Stripe checkout error:', checkoutURL.data)
        showToast('error', `Stripe checkout failed: ${checkoutURL.data.message || checkoutURL.data.data || 'Unknown error'}`)
        popup.close() // Close the blank popup
        checkoutLoading.value = false
        
        return
      }

      fiatCheckoutURL.value = checkoutURL.data.data
      checkoutLoading.value = false

      // Track payment attempt
      paymentMethod.value = 'Stripe'
      paymentAmount.value = finalPrice

      // Navigate popup to Stripe checkout URL
      popup.location.href = checkoutURL.data.data
      popup.focus()

      // Start monitoring
      startPaymentMonitoring()
      showToast('info', 'Stripe checkout opened. Complete payment in the new window.')
    } catch (error) {
      console.error('Stripe API error:', error)
      popup.close() // Close the blank popup
      showToast('error', 'Failed to create Stripe checkout session')
      checkoutLoading.value = false
    }
  } catch (error) {
    console.error('Stripe checkout network error:', error)
    console.error('Stripe error response:', error.response?.data)
    const errorMessage = error.response?.data?.message || error.response?.data?.data || error.message || 'Connection failed'
    showToast('error', `Stripe checkout error: ${errorMessage}`)
    checkoutLoading.value = false
  }
}

async function initPaypalPay(hash = null, name = null, price = null, description = null) {
  try {
    fiatCheckoutURL.value = ''
    checkoutLoading.value = true
    let clientIP = null
    let clientIPResponse = await axios.get('https://api.ipify.org?format=json').catch(() => {
      console.log('Error geting clientIp from api.ipify.org from')
    })
    if (clientIPResponse && clientIPResponse.data && clientIPResponse.data.ip) {
      clientIP = clientIPResponse.data.ip
    } else {
      clientIPResponse = await axios.get('https://ipinfo.io').catch(() => {
        console.log('Error geting clientIp from ipinfo.io from')
      })
      if (clientIPResponse && clientIPResponse.data && clientIPResponse.data.ip) {
        clientIP = clientIPResponse.data.ip
      } else {
        clientIPResponse = await axios.get('https://api.ip2location.io').catch(() => {
          console.log('Error geting clientIp from api.ip2location.io from')
        })
        if (clientIPResponse && clientIPResponse.data && clientIPResponse.data.ip) {
          clientIP = clientIPResponse.data.ip
        }
      }
    }
    const zelidauth = localStorage.getItem('zelidauth')
    console.log('PayPal - zelidauth:', zelidauth ? 'Present' : 'Missing')
    
    if (!zelidauth) {
      showToast('error', 'Authentication required - please login first')
      checkoutLoading.value = false
      
      return
    }
    
    const auth = qs.parse(zelidauth)
    console.log('PayPal - Parsed auth:', {
      hasZelid: !!auth.zelid,
      zelid: auth.zelid ? auth.zelid.substring(0, 8) + '...' : 'none',
      hasSignature: !!auth.signature,
      hasLoginPhrase: !!auth.loginPhrase,
    })
    
    if (!auth.zelid || !auth.signature || !auth.loginPhrase) {
      showToast('error', 'Invalid authentication data - please login again')
      checkoutLoading.value = false
      
      return
    }
    
    const data = {
      zelid: auth.zelid,
      signature: auth.signature,
      loginPhrase: auth.loginPhrase,
      details: {
        clientIP,
        name: name || appDetails.name,
        description: description || appDetails.description,
        hash: hash || registrationHash.value,
        price: price || appSpecPrice.value?.usd || 0,
        productName: name || appDetails.name,
        return_url: `${window.location.origin}/successcheckout`,
        cancel_url: window.location.origin,
        kpi: {
          origin: 'FluxOS',
          marketplace: isMarketplaceApp.value,
          registration: props.newApp || props.isRedeploy,
        },
      },
    }
    
    // Get final values to use
    const finalHash = hash || registrationHash.value
    const finalName = name || appDetails.name
    const finalDescription = description || appDetails.description  
    const finalPrice = price || appSpecPrice.value?.usd || 0
    
    // Validate required fields
    if (!finalHash) {
      showToast('error', 'Registration hash required - please register application first')
      checkoutLoading.value = false
      
      return
    }
    
    if (!finalPrice || finalPrice <= 0) {
      showToast('error', 'Invalid price - please calculate price first')
      checkoutLoading.value = false
      
      return
    }
    
    if (!finalName) {
      showToast('error', 'Application name required')
      checkoutLoading.value = false
      
      return
    }
    
    console.log('PayPal checkout request data:', JSON.stringify(data, null, 2))
    console.log('PayPal - appDetails:', appDetails)
    console.log('PayPal - registrationHash:', registrationHash.value)
    console.log('PayPal - appSpecPrice:', appSpecPrice.value)

    // Open popup immediately to avoid blocker (before API call)
    const popup = window.open('about:blank', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')

    // Check if popup was blocked immediately
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.warn('PayPal checkout popup was blocked by browser')
      checkoutLoading.value = false

      // Still make API call to get URL for manual opening
      try {
        const checkoutURL = await axios.post(`${paymentBridge}/api/v1/paypal/checkout/create`, data)
        if (checkoutURL.data.status === 'success') {
          popupBlockedDialog.value = true
          blockedPaymentUrl.value = checkoutURL.data.data
          blockedPaymentType.value = 'PayPal'
        }
      } catch (error) {
        console.error('PayPal checkout error:', error)
      }
      
      return
    }

    // Show loading message in popup while waiting for API
    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('core.subscriptionManager.loadingPayPalCheckout')}</title>
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0070ba 0%, #1546a0 100%); }
            .loader-container { text-align: center; color: white; }
            .spinner { border: 4px solid rgba(255, 255, 255, 0.3); border-top: 4px solid white; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            h2 { margin: 0 0 10px 0; font-weight: 600; }
            p { margin: 0; opacity: 0.9; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="loader-container">
            <div class="spinner"></div>
            <h2>${t('core.subscriptionManager.redirectingToPayPal')}</h2>
            <p>${t('core.subscriptionManager.pleaseWaitCheckout')}</p>
          </div>
        </body>
      </html>
    `)

    // Popup opened - now get the checkout URL
    try {
      const checkoutURL = await axios.post(`${paymentBridge}/api/v1/paypal/checkout/create`, data)
      console.log('PayPal checkout response:', checkoutURL.data)

      if (checkoutURL.data.status === 'error') {
        console.error('PayPal checkout error:', checkoutURL.data)
        showToast('error', `PayPal checkout failed: ${checkoutURL.data.message || checkoutURL.data.data || 'Unknown error'}`)
        popup.close() // Close the blank popup
        checkoutLoading.value = false
        
        return
      }

      fiatCheckoutURL.value = checkoutURL.data.data
      checkoutLoading.value = false

      // Track payment attempt
      paymentMethod.value = 'PayPal'
      paymentAmount.value = finalPrice

      // Navigate popup to PayPal checkout URL
      popup.location.href = checkoutURL.data.data
      popup.focus()

      // Start monitoring
      startPaymentMonitoring()
      showToast('info', 'PayPal checkout opened. Complete payment in the new window.')
    } catch (error) {
      console.error('PayPal API error:', error)
      popup.close() // Close the blank popup
      showToast('error', 'Failed to create PayPal checkout session')
      checkoutLoading.value = false
    }
  } catch (error) {
    console.error('PayPal checkout network error:', error)
    console.error('PayPal error response:', error.response?.data)
    const errorMessage = error.response?.data?.message || error.response?.data?.data || error.message || 'Connection failed'
    showToast('error', `PayPal checkout error: ${errorMessage}`)
    checkoutLoading.value = false
  }
}

// Payment monitoring function
const startPaymentMonitoring = async () => {
  console.log('🚀 START PAYMENT MONITORING', {
    registrationHash: registrationHash.value,
    isFreeUpdate: appSpecPrice.value?.flux === 0,
  })

  // Clear any existing monitoring
  if (paymentMonitoringInterval.value) {
    clearInterval(paymentMonitoringInterval.value)
  }
  if (paymentMonitoringTimeout.value) {
    clearTimeout(paymentMonitoringTimeout.value)
  }

  paymentProcessing.value = true
  paymentConfirmed.value = false

  console.log('✅ paymentProcessing set to true - monitoring UI should now be visible')

  // Set a 30-minute timeout (payment validity period)
  paymentMonitoringTimeout.value = setTimeout(() => {
    if (paymentMonitoringInterval.value) {
      clearInterval(paymentMonitoringInterval.value)
      paymentMonitoringInterval.value = null
    }
    if (!paymentConfirmed.value) {
      showToast('warning', 'Payment monitoring timed out. Please check your application status.')
      paymentProcessing.value = false
    }
  }, 30 * 60 * 1000) // 30 minutes

  // Poll for payment status every 30 seconds
  paymentMonitoringInterval.value = setInterval(async () => {
    // Get app name from correct source: appDetails for new apps, props.appSpec for updates
    const appName = props.newApp ? appDetails.value.name : props.appSpec?.name

    console.log('⏰ MONITORING CHECK - Polling for deployment status...', {
      timestamp: new Date().toLocaleTimeString(),
      appName: appName,
      'appDetails.value.name': appDetails.value.name,
      'props.appSpec?.name': props.appSpec?.name,
      isNewApp: props.newApp,
      registrationHash: registrationHash.value,
    })

    try {
      if (!appName) {
        console.warn('⚠️ No app name available for monitoring')
        
        return
      }

      if (props.newApp) {
        // For new apps: Check if app location exists (app gets deployed)
        const response = await AppsService.getAppLocation(appName)

        if (response.data && response.data.status === 'success') {
          const appLocation = response.data.data

          console.log('🔍 Checking new app deployment:', {
            appLocation: appLocation,
            hasInstances: appLocation && appLocation.length > 0,
          })

          // If app location exists and has running instances, deployment was successful!
          if (appLocation && appLocation.length > 0) {
            console.log('✅ NEW APP DEPLOYMENT DETECTED - App is running!')

            // Clear monitoring
            clearInterval(paymentMonitoringInterval.value)
            clearTimeout(paymentMonitoringTimeout.value)
            paymentMonitoringInterval.value = null
            paymentMonitoringTimeout.value = null
            paymentConfirmed.value = true
            paymentProcessing.value = false
            paymentCompleted.value = true

            // Note: We don't clear registrationHash here to keep the success message visible
            // It will be cleared when user navigates away from the tab
            console.log('✅ Deployment successful - registrationHash kept for UI stability')

            // Show success message
            showToast('success', appSpecPrice.value?.flux === 0 ? t('core.subscriptionManager.deploymentSuccessfulRunning') : t('core.subscriptionManager.paymentConfirmedActive'))
          }
        }
      } else {
        // For updating existing app: Check if app spec hash matches registered hash
        const specResponse = await AppsService.getAppSpecifics(appName)

        if (specResponse.data && specResponse.data.status === 'success') {
          const currentAppSpec = specResponse.data.data

          console.log('🔍 Checking update deployment:', {
            currentHash: currentAppSpec?.hash,
            registeredHash: registrationHash.value,
            hashesMatch: currentAppSpec?.hash === registrationHash.value,
          })

          // Check if the current spec hash matches our registered hash
          if (currentAppSpec?.hash && registrationHash.value && currentAppSpec.hash === registrationHash.value) {
            console.log('✅ UPDATE DETECTED - Hash matches!')

            // Clear monitoring
            clearInterval(paymentMonitoringInterval.value)
            clearTimeout(paymentMonitoringTimeout.value)
            paymentMonitoringInterval.value = null
            paymentMonitoringTimeout.value = null
            paymentConfirmed.value = true
            paymentProcessing.value = false
            paymentCompleted.value = true

            // Update the original spec snapshot to the deployed spec (so future changes can be detected)
            if (props.appSpec) {
              const specCopy = JSON.parse(JSON.stringify(props.appSpec))
              delete specCopy.expire
              originalAppSpecSnapshot.value = specCopy
              console.log('📸 Updated originalAppSpecSnapshot after successful deployment')
            }

            // Note: We don't clear registrationHash here to keep the success message visible
            // It will be cleared when user changes specs or navigates away from the tab
            console.log('✅ Deployment successful - registrationHash kept for UI stability')

            // Show success message
            showToast('success', appSpecPrice.value?.flux === 0 ? t('core.subscriptionManager.updateDeployedSuccessfully') : t('core.subscriptionManager.paymentConfirmedSpecUpdated'))
          }
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
  }, 30000) // Check every 30 seconds
}

// Open blocked payment URL
const openBlockedPayment = () => {
  if (blockedPaymentUrl.value) {
    window.open(blockedPaymentUrl.value, '_blank')
    popupBlockedDialog.value = false

    // Start monitoring after user manually opens payment tab
    startPaymentMonitoring()
    showToast('info', `${blockedPaymentType.value} checkout opened. Complete payment in the new tab.`)
  }
}

// Cancel payment monitoring
const cancelPaymentMonitoring = () => {
  // Clear monitoring intervals
  if (paymentMonitoringInterval.value) {
    clearInterval(paymentMonitoringInterval.value)
    paymentMonitoringInterval.value = null
  }
  if (paymentMonitoringTimeout.value) {
    clearTimeout(paymentMonitoringTimeout.value)
    paymentMonitoringTimeout.value = null
  }

  // Reset payment status
  paymentProcessing.value = false
  paymentConfirmed.value = false
  paymentMethod.value = ''
  paymentAmount.value = 0

  showToast('info', 'Payment monitoring cancelled')
}

// Emulate payment confirmed (for testing)
const emulatePaymentConfirmed = () => {
  // Clear monitoring intervals
  if (paymentMonitoringInterval.value) {
    clearInterval(paymentMonitoringInterval.value)
    paymentMonitoringInterval.value = null
  }
  if (paymentMonitoringTimeout.value) {
    clearTimeout(paymentMonitoringTimeout.value)
    paymentMonitoringTimeout.value = null
  }

  // Set success state
  paymentConfirmed.value = true
  paymentProcessing.value = false
  paymentCompleted.value = true

  showToast('success', t('core.subscriptionManager.testPaymentConfirmed'))
}

async function initZelcorePay() {
  try {
    // Validate price is available and greater than 0
    const amount = appSpecPrice.value?.flux
    if (!amount || amount <= 0) {
      showToast('error', 'Invalid payment amount. Please validate your app specifications first.')
      
      return
    }

    // Validate required fields
    if (!deploymentAddress.value) {
      showToast('error', 'Deployment address not available')
      
      return
    }

    if (!registrationHash.value) {
      showToast('error', 'Registration hash not available')
      
      return
    }

    // Track payment attempt
    paymentMethod.value = 'Zelcore'
    paymentAmount.value = amount

    await payWithZelcore({
      address: deploymentAddress.value,
      amount: amount,
      message: registrationHash.value,
      coin: 'zelcash',
    })

    showToast('info', 'Zelcore payment initiated - please complete payment in Zelcore wallet')

    // Start payment monitoring for crypto payment
    startPaymentMonitoring()
  } catch (error) {
    showToast('error', 'Failed to open Zelcore')
  }
}

async function initSSPPay() {
  try {
    // Validate price is available and greater than 0
    const amount = appSpecPrice.value?.flux
    if (!amount || amount <= 0) {
      showToast('error', 'Invalid payment amount. Please validate your app specifications first.')
      
      return
    }

    // Validate required fields
    if (!deploymentAddress.value) {
      showToast('error', 'Deployment address not available')
      
      return
    }

    if (!registrationHash.value) {
      showToast('error', 'Registration hash not available')
      
      return
    }

    // Track payment attempt
    paymentMethod.value = 'SSP'
    paymentAmount.value = amount

    const data = {
      message: registrationHash.value,
      amount: amount.toString(),
      address: deploymentAddress.value,
      chain: 'flux',
    }

    // Wait for user to confirm payment in SSP wallet (this blocks until user acts)
    const response = await payWithSSP(data)

    // User confirmed payment - show success with both message and txid (matches Home UI)
    showToast('success', `${response.data}: ${response.txid}`)

    // Start payment monitoring to detect blockchain confirmation
    startPaymentMonitoring()
  } catch (error) {
    showToast('error', error.message)

    // Reset payment tracking if payment failed
    paymentMethod.value = ''
    paymentAmount.value = 0
  }
}

async function initWalletConnect() {
  try {
    const account = getConnectedAccount()
    if (!account) {
      showToast('error', 'WalletConnect not connected. Please log into FluxOS first.')

      return
    }

    showToast('success', 'Using existing WalletConnect session for signing')
  } catch (error) {
    console.error(error)
    showToast('error', error.message)
  }
}

async function initMetamask() {
  try {
    if (!window.ethereum) {
      showToast('error', 'Metamask not detected')
      
      return
    }
    const account = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })
    if (account.length === 0) {
      showToast('error', 'No account selected')
      
      return
    }

    // This would be for signing the message
    await siwe(dataToSign.value, account[0])
  } catch (error) {
    showToast('error', error.message)
  }
}

// === Sign with FluxSSO ===
async function initSignFluxSSO() {
  try {
    const message = dataToSign.value
    const firebaseUser = getUser()
    if (!firebaseUser) {
      showToast('error', 'Not logged in as SSO')
      isSigning.value = false
      signingFailed.value = true
      
      return
    }

    const token = firebaseUser.auth.currentUser.accessToken
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }

    const res = await axios.post('https://service.fluxcore.ai/api/signMessage', { message }, { headers })
    if (res.data?.status !== 'success' || !res.data?.signature) {
      showToast('error', 'SSO signing failed')
      isSigning.value = false
      signingFailed.value = true
      
      return
    }

    signature.value = res.data.signature
  } catch (err) {
    showToast('error', 'SSO error: ' + err.message)
    isSigning.value = false
    signingFailed.value = true
  }
}

// === Sign with Zelcore ===
async function initiateSignWSUpdate() {
  try {
    const zelidauth = localStorage.getItem('zelidauth')
    let zelid
    if (zelidauth) {
      const authData = zelidauth.includes('zelid=')
        ? Object.fromEntries(new URLSearchParams(zelidauth))
        : JSON.parse(zelidauth)
      zelid = authData.zelid
    }

    // Create WebSocket BEFORE triggering sign (like InstallDialog does)
    let wsURL = localStorage.getItem("backendURL") || getDetectedBackendURL()
    wsURL = wsURL.replace('https://', 'wss://').replace('http://', 'ws://')

    const sigMsg = `${props.appSpec.owner}${timestamp.value}`
    const uri = `${wsURL}/ws/sign/${sigMsg}`
    console.log('Creating WebSocket:', uri)

    websocket.value = new WebSocket(uri)

    websocket.value.onopen = onOpen
    websocket.value.onclose = onClose
    websocket.value.onerror = onError
    websocket.value.onmessage = onMessage

    // Now trigger ZelCore signing
    // signWithZelcore handles long messages, storage upload, and protocol launching
    // Skip WebSocket in signWithZelcore since we handle it separately above
    await signWithZelcore(dataToSign.value, zelid, callbackValue.value, undefined, true)
  } catch (error) {
    showToast('error', `Zelcore sign error: ${error}`)
    isSigning.value = false
    signingFailed.value = true
  }
}

async function initSignZelcore() {
  // Deprecated - use initiateSignWSUpdate instead
  await initiateSignWSUpdate()
}

function onMessage(evt) {
  const parsed = qs.parse(evt.data)

  // Check for signature in various formats
  if (parsed.status === 'success') {
    if (parsed['data[signature]']) {
      signature.value = parsed['data[signature]']
    } else if (parsed.data && typeof parsed.data === 'object' && parsed.data.signature) {
      signature.value = parsed.data.signature
    } else if (parsed.signature) {
      signature.value = parsed.signature
    }
  }
}
function onOpen(evt) { }
function onClose(evt) { }
function onError(evt) { console.error('WS error', evt) }

// === WalletConnect ===
async function initSignWalletConnect() {
  try {
    const account = getConnectedAccount()
    if (!account) {
      showToast('error', 'WalletConnect not connected. Please log into FluxOS first.')
      isSigning.value = false
      signingFailed.value = true
      
      return
    }

    // Sign the message using the wallet service
    const result = await signWithWalletConnect(dataToSign.value)

    signature.value = result
  } catch (err) {
    showToast('error', err.message)
    isSigning.value = false
    signingFailed.value = true
  }
}

// === MetaMask ===
async function initSignMetamask() {
  try {
    const ethereum = window.ethereum
    if (!ethereum) {
      showToast('danger', 'Metamask not found')
      isSigning.value = false
      signingFailed.value = true
      
      return
    }

    const account = ethereum.selectedAddress || (await ethereum.request({ method: 'eth_requestAccounts' }))[0]
    const msg = `0x${Buffer.from(dataToSign.value, 'utf8').toString('hex')}`

    const sign = await ethereum.request({
      method: 'personal_sign',
      params: [msg, account],
    })

    signature.value = sign
  } catch (err) {
    showToast('error', err.message)
    isSigning.value = false
    signingFailed.value = true
  }
}

// === SSP ===
async function initSignSSP() {
  try {
    const result = await signWithSSP(dataToSign.value)
    signature.value = result.signature
  } catch (err) {
    showToast('error', err.message)
    isSigning.value = false
    signingFailed.value = true
  }
}

// === Manual signing ===
const showManualSignDialog = ref(false)
const manualSignMessage = ref('')

async function initSignManual() {
  try {
    const zelidauth = localStorage.getItem('zelidauth')
    if (!zelidauth) {
      showToast('error', t('core.subscriptionManager.noLoginCredentials'))
      isSigning.value = false
      signingFailed.value = true
      return
    }

    // Parse zelidauth (URL-encoded format: zelid=...&signature=...&loginPhrase=...)
    const authData = zelidauth.includes('zelid=')
      ? Object.fromEntries(new URLSearchParams(zelidauth))
      : JSON.parse(zelidauth)

    // Message to sign = dataToSign ONLY (no loginPhrase for app signing)
    // loginPhrase is only used for login verification, not app deployment signing
    manualSignMessage.value = dataToSign.value
    showManualSignDialog.value = true
  } catch (err) {
    showToast('error', t('core.subscriptionManager.failedToPrepareManualSigning', { error: err.message }))
    isSigning.value = false
    signingFailed.value = true
  }
}

function submitManualSignature(sig) {
  if (!sig || !sig.trim()) {
    showToast('error', t('core.subscriptionManager.pleaseEnterSignature'))
    return
  }
  signature.value = sig.trim()
  showManualSignDialog.value = false
  manualSignMessage.value = ''
  // Don't set isSigning to false here - let the signature watcher handle it
  // The watcher will detect the signature change and automatically call propagateSignedMessage()
}

function cancelManualSign() {
  showManualSignDialog.value = false
  manualSignMessage.value = ''
  isSigning.value = false
  signingFailed.value = true
}

// === SWITCH ===
async function signMethod() {
  switch (loginType.value) {
  case 'sso':
    await initSignFluxSSO()
    break
  case 'zelcore':
    await initiateSignWSUpdate()
    break
  case 'walletconnect':
    await initSignWalletConnect()
    break
  case 'metamask':
    await initSignMetamask()
    break
  case 'ssp':
    await initSignSSP()
    break
  case 'manual':
    await initSignManual()
    break
  default:
    showToast('error', `Unknown loginType: ${loginType}`)
  }
}
</script>


<style scoped>
/* Close button hover effect */
.close-btn-hover:hover {
  color: rgb(var(--v-theme-error)) !important;
}

/* Installation output styling */
.installation-step {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.installation-step:last-child {
  border-bottom: none;
}

.installation-output {
  font-family: 'Roboto Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  margin: 0;
  padding: 8px 0;
}

/* Payment section styling */
.payment-info-card, .price-card, .payment-method-card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.payment-method-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.bg-gradient-info {
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%);
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

.bg-gradient-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.bg-gradient-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.price-display {
  padding: 16px 0;
}

.price-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.price-amount {
  line-height: 1.2;
}

.price-label {
  font-weight: 500;
  letter-spacing: 0.5px;
}

.payment-btn {
  width: 100%;
  justify-content: space-between;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
}

.payment-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.payment-details {
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
}

.card-disabled {
  opacity: 0.7;
  pointer-events: none;
}

.payment-methods {
  gap: 24px;
}

/* Payment brand logos */
.payment-logo {
  height: 20px;
  width: auto;
  max-width: 24px;
  object-fit: contain;
}

/* Specific button styling for brands */
.paypal-btn {
  background: linear-gradient(135deg, #0070ba 0%, #003087 100%) !important;
  color: white !important;
}

.stripe-btn {
  background: linear-gradient(135deg, #635bff 0%, #5469d4 100%) !important;
  color: white !important;
}

.zelcore-btn {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%) !important;
  color: white !important;
}

.ssp-btn {
  background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%) !important;
  color: white !important;
}

.metamask-btn {
  background: linear-gradient(135deg, #f6851b 0%, #e2761b 100%) !important;
  color: white !important;
}

.walletconnect-btn {
  background: linear-gradient(135deg, #3b99fc 0%, #1a73e8 100%) !important;
  color: white !important;
}

/* Button hover effects with brand colors */
.paypal-btn:hover {
  background: linear-gradient(135deg, #005ea6 0%, #002c5f 100%) !important;
}

.stripe-btn:hover {
  background: linear-gradient(135deg, #5a52ff 0%, #4c63d2 100%) !important;
}

.zelcore-btn:hover {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%) !important;
}

.ssp-btn:hover {
  background: linear-gradient(135deg, #8e24aa 0%, #6a1b9a 100%) !important;
}

.metamask-btn:hover {
  background: linear-gradient(135deg, #e2761b 0%, #cd6116 100%) !important;
}

.walletconnect-btn:hover {
  background: linear-gradient(135deg, #1a73e8 0%, #1565c0 100%) !important;
}

/* Discount section styling */
.discount-section {
  animation: discountPulse 2s ease-in-out infinite;
}

/* Payment option styling */
.payment-option {
  display: inline-block;
  margin: 5px;
}

.payment-link {
  cursor: pointer;
  display: block;
  transition: transform 0.2s ease;
}

.payment-link:hover {
  transform: scale(1.05);
}

/* Wallet and payment icon styling matching reference */
.wallet-icon {
  height: 90px;
  width: 90px;
  padding: 10px;
  transition: 0.1s;
}

.payment-icon.stripe-pay {
  margin-left: 5px;
  height: 90px;
  padding: 10px;
  transition: 0.1s;
}

.payment-icon.paypal-pay {
  margin-left: 5px;
  height: 90px;
  padding: 10px;
  transition: 0.1s;
}

.discount-chip {
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@keyframes discountPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.border-frame {
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 5px;
  padding: 8px 12px;
  min-height: 48px;
  height: auto;
  flex-wrap: wrap;
  gap: 8px;
}

.border-frame-title {
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.2;
}

.border-frame-btn {
  height: 38px !important;
  min-height: 38px !important;
}

.border-frame-btn.v-btn--icon {
  width: 38px !important;
}
/* Dark theme (default) */
.spec-row {
  display: flex;
  border: 1px solid #25293C;
  border-radius: 8px;
  overflow: hidden;
  height: 40px;
  background-color: #0e1120;
}

.label-cell {
  background-color: #25293C;
  color: white;
  padding: 0 16px;
  display: flex;
  align-items: center;
  min-width: 150px;
  font-size: 14px;
  font-weight: 500;
}

.value-cell {
  flex: 1;
  color: white;
  background-color: #2F3349;
  font-size: 14px;
}

.value-cell .v-icon {
  margin-left: 6px;
}

.price-display {
  display: inline-block;
  text-align: right;
}

/* Light theme overrides */
.v-theme--light .spec-row {
  border: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.v-theme--light .label-cell {
  background-color: #e3f2fd;
  color: #1a1a1a;
}

.v-theme--light .value-cell {
  color: #1a1a1a;
  background-color: #ffffff;
}

.label-column {
  width: 110px;
  min-width: 110px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.text-field-fixed {
  width: 90px;
  min-width: 90px;
  max-width: 90px;
  flex-shrink: 0;
}

/* Hardware slider consistent sizing and spacing */
.hardware-slider {
  margin-left: 16px !important;
  margin-right: 20px !important;
  min-width: 150px;
  flex-shrink: 1;
}

.hardware-resource-row {
  max-width: 100%;
  overflow: hidden;
}

.hardware-item {
  display: flex;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
}

.hardware-label-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  min-width: 110px;
  flex-shrink: 0;
  background: rgba(var(--v-theme-surface), 0.5);
}

.hardware-icon {
  flex-shrink: 0;
}

.hardware-label-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.hardware-name {
  font-weight: 500;
  font-size: 14px;
}

.hardware-unit {
  font-size: 11px;
  opacity: 0.7;
}

.env-buttons-container {
  margin-bottom: 1rem;
}

.hardware-slider :deep(.v-slider__thumb) {
  margin-left: 8px;
}

.hardware-slider :deep(.v-slider__track-container) {
  margin-left: 8px;
}

:deep(.small-text-field input) {
  padding-top: 4px;
  padding-bottom: 4px;
  font-size: 13px;
}

.v-tab .tab-content span {
  text-transform: none !important;
}

.text-white {
  color: white !important;
}

.test-output {
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 1rem;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.output-error {
  color: #f48771;
}

.output-warning {
  color: #ffcc00;
}

.output-success {
  color: #89d185;
}

/* Dark theme (default) */
.review-header {
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #1e1e2f;
  color: white;
}

/* Light theme overrides */
.v-theme--light .review-header {
  border: 1px solid #e0e0e0;
  background-color: #e3f2fd;
  color: #1a1a1a;
}

/* Set background and height for entire header row */
::v-deep(.v-data-table thead) {
  background-color: rgb(var(--v-theme-background)) !important;
  height: 40px !important; /* Or your desired height */
}

/* Style each header cell */
::v-deep(.v-data-table thead th) {
  background-color: rgb(var(--v-theme-background)) !important;
  color: #b6b4b4 !important;
  font-weight: 600;
  height: 40px !important; /* Match height here as well */
  line-height: 40px !important; /* Centers text vertically */
}

::v-deep(.actions-cell) {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px; /* space between buttons */
  white-space: nowrap; /* prevent wrapping */
}

/* Modern Payment Methods Styling */
.payment-methods-container {
  margin-top: 0;
  padding: 0 1rem;
}

.payment-method-card {
  border-radius: 16px !important;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid #e5e7eb !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.v-theme--dark .payment-method-card {
  border-color: #4b5563 !important;
}

.payment-method-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.payment-monitoring-card {
  border-radius: 16px !important;
  overflow: hidden;
  border: 2px solid rgba(var(--v-theme-primary), 0.3) !important;
}

.deployment-success-card {
  border-radius: 16px !important;
  overflow: hidden;
  border: 2px solid rgba(var(--v-theme-success), 0.5) !important;
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.05) 0%, rgba(var(--v-theme-success), 0.1) 100%);
}

.payment-monitoring-card .loading-container {
  min-height: auto !important;
  padding: 0 24px 24px 24px !important;
  margin-top: 0 !important;
}

.payment-monitoring-card .loading-container h2 {
  white-space: nowrap !important;
  text-align: center !important;
  display: inline-block !important;
  width: 100% !important;
}

.payment-monitoring-card .loading-container h2 span {
  white-space: nowrap !important;
}

.payment-monitoring-card .loading-container p {
  text-align: center !important;
  width: 100% !important;
  margin: 0 auto !important;
}

.deployment-monitoring-wrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.deployment-message-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: -1.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(var(--v-theme-warning), 0.5);
  border-radius: 8px;
  background: rgba(var(--v-theme-warning), 0.1);
}

.deployment-message-box span {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.9);
  text-align: left;
}

.payment-header {
  padding: 1.5rem !important;
  border-radius: 16px 16px 0 0 !important;
  background: linear-gradient(135deg, var(--v-theme-primary) 0%, var(--v-theme-primary-darken-1) 100%) !important;
}

.payment-header.bg-gradient-warning {
  background: linear-gradient(135deg, var(--v-theme-warning) 0%, var(--v-theme-warning-darken-1) 100%) !important;
}

/* Payment Icons Grid */
.payment-icons-grid {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.payment-icon-card {
  border-radius: 12px !important;
  transition: all 0.2s ease;
  cursor: pointer;
  flex: 1;
  position: relative;
  overflow: hidden;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.3) !important;
}

.payment-icon-card .v-card-text {
  min-height: 112px;
}

.payment-icon-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-success), 0.5) !important;
  box-shadow: 0 8px 24px rgba(var(--v-theme-success), 0.3);
}

.payment-brand-icon {
  height: 80px;
  width: auto;
  max-width: 180px;
  object-fit: contain;
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
  display: block;
  margin: 0 auto;
}

.payment-icon-card:hover .payment-brand-icon {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
}

.payment-brand-icon-small {
  height: 60px;
  width: 140px;
  object-fit: contain;
}

/* Wallet Icons Grid */
.wallet-icons-grid {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.wallet-icon-card {
  border-radius: 12px !important;
  transition: all 0.2s ease;
  cursor: pointer;
  flex: 1;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.3) !important;
}

.wallet-icon-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-warning), 0.5) !important;
  box-shadow: 0 8px 24px rgba(var(--v-theme-warning), 0.3);
}

.wallet-brand-icon {
  height: 64px;
  width: 64px;
  object-fit: contain;
}

/* Professional Payment Field Container */
.payment-field-container {
  display: flex;
  align-items: center;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.payment-field-container:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.payment-field-label {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  background: rgba(var(--v-theme-surface), 1);
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), 0.7);
  flex-shrink: 0;
}

.payment-field-label .v-icon {
  font-size: 18px !important;
}

.payment-field-value {
  flex: 1;
  padding: 10px 12px;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.payment-field-copy {
  border-radius: 0 !important;
  height: 100% !important;
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: transparent !important;
  color: grey !important;
  transition: all 0.2s ease;
}

.payment-field-copy:hover {
  background-color: transparent !important;
  color: grey !important;
  filter: drop-shadow(0 0 8px rgba(128, 128, 128, 0.6));
}

.payment-field-copy .v-btn__overlay,
.payment-field-copy::before,
.payment-field-copy::after {
  display: none !important;
}

/* Payment Info List Compact Spacing */
.payment-info-list .v-list-item {
  min-height: 36px !important;
}

.payment-info-list .v-list-item + .v-list-item {
  margin-top: 0 !important;
}

/* Payment Method Selection Label */
.payment-method-selection-label {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
}

.v-theme--dark .payment-method-selection-label {
  border-color: #4b5563;
}

.payment-method-selection-label span {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.95);
  line-height: 1.4;
}

/* Responsive Design */

@media (max-width: 960px) {
  .payment-methods-container {
    padding: 0 0.5rem;
  }

  .payment-method-card {
    margin-bottom: 1rem;
  }

  .payment-icons-grid,
  .wallet-icons-grid {
    gap: 0.75rem;
  }

  .payment-icon-card {
    flex: 1 1 auto;
    min-width: 120px;
  }

  .payment-icon-card .v-card-text {
    height: auto;
  }

  .wallet-icon-card {
    flex: 1 1 auto;
    min-width: 120px;
  }
}

@media (max-width: 600px) {
  .payment-header {
    padding: 1rem !important;
  }

  .payment-icons-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .wallet-icons-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .payment-icon-card {
    width: 100%;
  }

  .payment-icon-card .v-card-text {
    min-height: 64px;
  }

  .payment-icon-card .payment-brand-icon {
    height: 60px !important;
    max-width: 150px !important;
    transform: translateY(2px) !important;
  }

  .wallet-icon-card {
    width: 100%;
  }
}

/* Card disabled state */
.card-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* Import button glowing effect */
.import-glow-btn {
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.6) !important;
  transition: all 0.3s ease !important;
}

.import-glow-btn:hover {
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.9) !important;
  transform: scale(1.05);
}

/* Tooltip text visibility for both themes */
/* Light theme = dark tooltip background, so use white text */
.v-theme--light .tooltip-content {
  color: rgba(255, 255, 255, 0.9);
}

/* Dark theme = light tooltip background, so use dark text */
.v-theme--dark .tooltip-content {
  color: rgba(0, 0, 0, 0.87);
}

/* Warning color - orange for both themes */
.tooltip-warning {
  color: #ff9800 !important;
}

/* Switch container styling */
.switch-container {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  transition: all 0.2s ease;
}

.switch-container:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-on-surface), 0.02);
}

/* ============================================ */
/* Mobile Optimizations */
/* ============================================ */

/* Mobile-specific styles (< 600px) */
@media (max-width: 600px) {
  /* Tab Navigation - Enable horizontal scrolling */
  .mobile-scrollable-tabs .v-tabs__container {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  .mobile-scrollable-tabs .v-tabs__container::-webkit-scrollbar {
    height: 4px;
  }

  .mobile-scrollable-tabs .v-tabs__container::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-primary), 0.5);
    border-radius: 2px;
  }

  /* Touch Targets - Minimum 44x44px */
  .mobile-delete-btn {
    min-width: 44px !important;
    min-height: 44px !important;
    width: 44px !important;
    height: 44px !important;
  }

  /* Hardware Section - Responsive widths */
  .label-column {
    width: 70px;
    min-width: 70px;
  }

  .text-field-fixed {
    width: 75px;
    min-width: 75px;
    max-width: 75px;
  }

  .hardware-slider {
    margin-left: 8px !important;
    margin-right: 12px !important;
    min-width: 100px;
  }

  .hardware-label-box {
    min-width: 85px;
    padding: 6px 10px;
    gap: 6px;
  }

  .hardware-icon {
    font-size: 22px !important;
  }

  .hardware-name {
    font-size: 13px;
  }

  .hardware-unit {
    font-size: 10px;
  }

  /* Environment buttons - Full width on mobile */
  .env-button-wrapper {
    flex: 1 1 100%;
  }

  .env-button {
    width: 100%;
  }

  /* Border Frame - Mobile adjustments */
  .border-frame {
    padding: 6px 8px;
    min-height: 44px;
  }

  .border-frame-title {
    font-size: 1rem;
  }

  .border-frame-btn {
    height: 32px !important;
    min-height: 32px !important;
    font-size: 0.875rem !important;
  }

  .border-frame-btn.v-btn--icon {
    width: 32px !important;
  }

  /* Discount chip - Match mobile font size */
  .discount-chip {
    font-size: 11px !important;
  }

  /* Review & Validate - 10% smaller text */
  .value-cell,
  .value-cell span,
  .label-cell {
    font-size: 0.9em;
  }

  /* Review & Validate - Smaller icons on mobile */
  .value-cell .v-icon {
    font-size: 18px !important;
  }

  /* Component Tab - Touch-friendly delete buttons */
  .component-tab-delete-btn {
    min-width: 44px !important;
    min-height: 44px !important;
  }

  /* Payment methods */
  .payment-method-card {
    margin-bottom: 12px;
  }

  /* Spec row mobile */
  .spec-row {
    height: 40px;
  }

  .label-cell {
    width: 140px;
    min-width: 140px;
    max-width: 140px;
    flex-shrink: 0;
    font-size: 13px;
    padding: 8px 12px;
  }

  .value-cell {
    font-size: 13px;
    padding: 8px 12px;
  }
}

/* Tablet styles (601px - 960px) */
@media (min-width: 601px) and (max-width: 960px) {
  .label-column {
    width: 95px;
    min-width: 95px;
  }

  .text-field-fixed {
    width: 85px;
    min-width: 85px;
    max-width: 85px;
  }

  .hardware-slider {
    margin-left: 12px !important;
    margin-right: 16px !important;
    min-width: 120px;
  }

  .border-frame-btn {
    height: 34px !important;
    min-height: 34px !important;
  }

  .border-frame-btn.v-btn--icon {
    width: 34px !important;
  }

  .border-frame-title {
    font-size: 1.0625rem;
  }
}
</style>

<style>
/* Global tooltip styles (not scoped because tooltips render in portal) */
/* Light theme = dark tooltip background, so use white text */
.v-theme--light .tooltip-content {
  color: rgba(255, 255, 255, 0.9) !important;
}

.v-theme--light .tooltip-content .text-caption {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Dark theme = light tooltip background, so use dark text */
.v-theme--dark .tooltip-content {
  color: rgba(0, 0, 0, 0.87) !important;
}

.v-theme--dark .tooltip-content .text-caption {
  color: rgba(0, 0, 0, 0.87) !important;
}

/* Warning color - orange for both themes */
.tooltip-warning {
  color: #ff9800 !important;
}

/* Popup dialog button styling */
.popup-dialog-btn {
  height: 56px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
}

/* ============================================ */
/* Mobile Optimizations */
/* ============================================ */

/* Mobile-specific styles (< 600px to match Vuetify xs breakpoint) */
@media (max-width: 599px) {
  /* Mobile Circle Tabs - Main tabs as circular icon buttons */
  .mobile-circle-tab {
    min-width: 44px !important;
    max-width: 44px !important;
    width: 44px !important;
    height: 44px !important;
    border-radius: 50% !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  /* Force VTab elements to be circular - Multiple selectors for specificity */
  :deep(.v-tabs-pill .v-tab.mobile-circle-tab),
  :deep(.v-tabs.v-tabs-pill .v-tab.mobile-circle-tab),
  :deep(.mobile-scrollable-tabs .v-tab.mobile-circle-tab),
  :deep(.v-tabs-pill.mobile-scrollable-tabs .v-tab.mobile-circle-tab) {
    border-radius: 50% !important;
    min-width: 44px !important;
    max-width: 44px !important;
    width: 44px !important;
    height: 44px !important;
  }

  .mobile-circle-tab .tab-content {
    justify-content: center !important;
  }

  /* Force circular shape on all tab states and child elements */
  .mobile-circle-tab *,
  .mobile-circle-tab::before,
  .mobile-circle-tab::after,
  .mobile-circle-tab .v-btn__overlay,
  .mobile-circle-tab .v-btn__underlay,
  .mobile-circle-tab .v-ripple__container,
  .mobile-circle-tab .v-tab__slider {
    border-radius: 50% !important;
  }

  /* Override v-tabs-pill selected and hover states with maximum specificity */
  :deep(.v-tabs-pill .mobile-circle-tab.v-tab--selected),
  :deep(.v-tabs-pill .mobile-circle-tab:hover),
  :deep(.v-tabs-pill .mobile-circle-tab:focus),
  :deep(.v-tabs-pill .mobile-circle-tab:active),
  :deep(.v-tabs.v-tabs-pill .v-tab.mobile-circle-tab.v-tab--selected),
  :deep(.v-tabs.v-tabs-pill .v-tab.mobile-circle-tab:hover),
  :deep(.mobile-scrollable-tabs.v-tabs-pill .v-tab.mobile-circle-tab) {
    border-radius: 50% !important;
  }

  /* Force circular shape on hover/focus overlays */
  .mobile-circle-tab:hover *,
  .mobile-circle-tab:focus *,
  .mobile-circle-tab:active *,
  .mobile-circle-tab:hover::before,
  .mobile-circle-tab:hover::after {
    border-radius: 50% !important;
  }
}

/* Allow overflow for glow effect on tabs container only */
.tabs-container-overflow {
  overflow: visible !important;
}

.tabs-inner-overflow {
  overflow: visible !important;
}

/* Allow overflow on VTabs for glow effect */
:deep(.mobile-scrollable-tabs),
:deep(.mobile-scrollable-tabs .v-tabs__container) {
  overflow: visible !important;
}

/* Review button - remove overflow hidden to allow glow effect */
.review-glow-btn.mobile-circle-tab {
  overflow: visible !important;
}

/* Review button glowing effect when active (not disabled) */
.v-btn:not(:disabled).review-glow-btn {
  animation: reviewGlow 2s ease-in-out infinite;
}

@keyframes reviewGlow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(var(--v-theme-success), 0.5),
                0 0 10px rgba(var(--v-theme-success), 0.3),
                0 0 15px rgba(var(--v-theme-success), 0.2);
  }
  50% {
    box-shadow: 0 0 10px rgba(var(--v-theme-success), 0.8),
                0 0 20px rgba(var(--v-theme-success), 0.5),
                0 0 30px rgba(var(--v-theme-success), 0.3);
  }
}

@media (max-width: 599px) {
  /* Environment Buttons - Full width on mobile with aligned icons */
  .env-buttons-container {
    flex-direction: column !important;
    gap: 8px !important;
  }

  .env-button-wrapper {
    width: 100% !important;
  }

  .env-button.v-btn--block {
    justify-content: flex-start !important;
  }

  .env-button.v-btn--block .v-btn__content {
    display: flex !important;
    align-items: center !important;
    width: 100% !important;
    justify-content: flex-start !important;
  }

  .env-button.v-btn--block .v-btn__prepend {
    margin-right: 8px !important;
  }

  .env-button.v-btn--block .env-btn-text {
    flex-grow: 0 !important;
    flex-shrink: 0 !important;
  }

  .env-button.v-btn--block .v-spacer {
    flex-grow: 1 !important;
  }

  .env-button.v-btn--block .env-info-icon {
    flex: 0 0 auto !important;
    margin-left: 0 !important;
  }
}
</style>
