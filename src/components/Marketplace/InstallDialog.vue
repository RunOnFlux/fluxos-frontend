<template>
  <VDialog
    v-model="isOpen"
    max-width="800"
    persistent
    scrollable
    class="install-dialog"
    style="height: 90vh;"
  >
    <VCard class="install-card">
      <!-- Primary Title Header -->
      <VCardTitle class="install-header">
        <div class="header-content">
          <div class="app-info">
            <VAvatar size="36" color="primary" variant="flat">
              <VIcon v-if="isWordPress || isGame || !appIcon || imageError" :icon="isWordPress ? 'mdi-wordpress' : (isGame ? 'mdi-gamepad-variant' : 'mdi-apps')" size="36" color="white" />
              <VImg v-else :src="appIcon" :alt="app.displayName || app.name" @error="imageError = true" cover>
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <VIcon icon="mdi-apps" size="36" color="white" />
                  </div>
                </template>
              </VImg>
            </VAvatar>
            <div class="app-details">
              <h3 class="app-name">
                <template v-if="isWordPress && app.planName">
                  WordPress {{ app.planName }}
                </template>
                <template v-else>
                  {{ app.displayName || app.name }}
                </template>
              </h3>
            </div>
          </div>
          <VBtn
            icon="mdi-close"
            variant="text"
            size="default"
            @click="closeDialog"
            class="close-btn"
          />
        </div>
      </VCardTitle>

      <!-- Separate Step Progress Section -->
      <div class="step-progress-section">
        <div class="steps-container">
          <div
            v-for="(step, index) in stepItems"
            :key="index"
            class="step-item"
            :class="{
              'active': index === currentStep,
              'completed': index < currentStep,
              'upcoming': index > currentStep
            }"
          >
            <div class="step-circle">
              <VIcon
                v-if="index < currentStep"
                icon="mdi-check"
                size="20"
                color="white"
              />
              <VIcon
                v-else
                :icon="step.icon"
                size="20"
                :color="index === currentStep ? 'primary' : 'grey'"
              />
            </div>
            <div class="step-label">{{ step.label }}</div>
            <div v-if="index < totalSteps - 1" class="step-connector"></div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <VCardText class="install-content">
        <VWindow v-model="currentStep" class="install-wizard">
          <!-- Step 0: Configuration (hidden for WordPress) -->
          <VWindowItem v-if="!isWordPress" :value="0">
            <div class="step-container">

              <!-- Terms Acceptance Alert -->
              <VAlert
                v-if="!termsAccepted"
                type="warning"
                variant="tonal"
                prominent
                border="start"
                class="mb-4"
              >
                <template #prepend>
                  <VIcon icon="mdi-alert-circle" size="32" />
                </template>
                <div class="d-flex flex-column">
                  <span class="text-subtitle-1 font-weight-medium mb-1">{{ t('components.marketplace.installDialog.termsAcceptanceRequired') }}</span>
                  <span class="text-body-2">{{ t('components.marketplace.installDialog.pleaseScrollAndAccept') }}</span>
                </div>
              </VAlert>

              <!-- Selected Configuration Display (for games) -->
              <div v-if="selectedConfig && appIcon && !imageError" class="selected-config-logo-container">
                <img :src="appIcon" :alt="app.displayName || app.name" class="selected-config-logo" @error="imageError = true" />
              </div>

              <div class="config-section modern-section hardware-section">
                <div class="section-header">
                  <VAvatar size="32" color="primary" variant="flat">
                    <VIcon icon="mdi-memory" size="18" color="white" />
                  </VAvatar>
                  <h5>{{ t('components.marketplace.installDialog.hardwareRequirements') }}</h5>
                </div>

                <div class="hardware-grid">
                  <div class="hardware-card" style="position: relative;" :class="{ 'hardware-card--disabled': isCpuLocked }">
                    <VIcon v-if="isCpuLocked" icon="mdi-lock" size="16" color="warning" style="position: absolute; top: 8px; right: 8px; z-index: 1;" />
                    <VAvatar size="36" color="success" variant="tonal">
                      <VIcon icon="mdi-cpu-64-bit" size="20" />
                    </VAvatar>
                    <div class="hardware-details">
                      <span class="hardware-label">{{ t('components.marketplace.installDialog.cpuCores') }}</span>
                      <div class="hardware-control">
                        <VBtn
                          v-if="!isCpuLocked"
                          icon="mdi-minus"
                          size="x-small"
                          variant="tonal"
                          color="success"
                          class="control-btn"
                          @click="config.cpu = Math.max((app.compose?.[0]?.cpu || 1), (parseFloat(config.cpu) - 0.1)).toFixed(1)"
                        />
                        <div class="hardware-value-display">
                          <input
                            v-model="config.cpu"
                            type="text"
                            class="hardware-custom-input"
                            :disabled="isCpuLocked"
                            @input="config.cpu = $event.target.value"
                          />
                        </div>
                        <VBtn
                          v-if="!isCpuLocked"
                          icon="mdi-plus"
                          size="x-small"
                          variant="tonal"
                          color="success"
                          class="control-btn"
                          @click="config.cpu = (parseFloat(config.cpu) + 0.1).toFixed(1)"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="hardware-card" style="position: relative;" :class="{ 'hardware-card--disabled': isRamLocked }">
                    <VIcon v-if="isRamLocked" icon="mdi-lock" size="16" color="warning" style="position: absolute; top: 8px; right: 8px; z-index: 1;" />
                    <VAvatar size="36" color="info" variant="tonal">
                      <VIcon icon="mdi-memory" size="20" />
                    </VAvatar>
                    <div class="hardware-details">
                      <span class="hardware-label">{{ t('components.marketplace.installDialog.memoryMb') }}</span>
                      <div class="hardware-control">
                        <VBtn
                          v-if="!isRamLocked"
                          icon="mdi-minus"
                          size="x-small"
                          variant="tonal"
                          color="info"
                          class="control-btn"
                          @click="config.ram = Math.max((app.compose?.[0]?.ram || 512), config.ram - 100)"
                        />
                        <div class="hardware-value-display">
                          <input
                            v-model="config.ram"
                            type="text"
                            class="hardware-custom-input"
                            :disabled="isRamLocked"
                            @input="config.ram = $event.target.value"
                          />
                        </div>
                        <VBtn
                          v-if="!isRamLocked"
                          icon="mdi-plus"
                          size="x-small"
                          variant="tonal"
                          color="info"
                          class="control-btn"
                          @click="config.ram = parseInt(config.ram) + 100"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="hardware-card" style="position: relative;" :class="{ 'hardware-card--disabled': isStorageLocked }">
                    <VIcon v-if="isStorageLocked" icon="mdi-lock" size="16" color="warning" style="position: absolute; top: 8px; right: 8px; z-index: 1;" />
                    <VAvatar size="36" color="warning" variant="tonal">
                      <VIcon icon="mdi-harddisk" size="20" />
                    </VAvatar>
                    <div class="hardware-details">
                      <span class="hardware-label">{{ t('components.marketplace.installDialog.storageGb') }}</span>
                      <div class="hardware-control">
                        <VBtn
                          v-if="!isStorageLocked"
                          icon="mdi-minus"
                          size="x-small"
                          variant="tonal"
                          color="warning"
                          class="control-btn"
                          @click="config.storage = Math.max((app.compose?.[0]?.hdd || 1), config.storage - 1)"
                        />
                        <div class="hardware-value-display">
                          <input
                            v-model="config.storage"
                            type="text"
                            class="hardware-custom-input"
                            :disabled="isStorageLocked"
                            @input="config.storage = $event.target.value"
                          />
                        </div>
                        <VBtn
                          v-if="!isStorageLocked"
                          icon="mdi-plus"
                          size="x-small"
                          variant="tonal"
                          color="warning"
                          class="control-btn"
                          @click="config.storage = parseInt(config.storage) + 1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="config-section modern-section">
                <div class="section-header">
                  <VAvatar size="32" color="warning" variant="flat">
                    <VIcon icon="mdi-calendar-clock" size="18" color="white" />
                  </VAvatar>
                  <h5>{{ t('components.marketplace.installDialog.subscriptionDuration') }}</h5>
                </div>

                <div class="subscription-duration">
                  <VChipGroup
                    v-model="config.subscriptionMonths"
                    selected-class="text-primary"
                    mandatory
                    class="duration-chips"
                  >
                    <VChip
                      v-for="option in subscriptionOptions"
                      :key="option.months"
                      :value="option.months"
                      variant="outlined"
                      size="default"
                      color="primary"
                      class="duration-chip"
                    >
                      {{ option.label }}
                    </VChip>
                  </VChipGroup>
                </div>
              </div>

              <div class="config-section modern-section">
                <div class="section-header">
                  <VAvatar size="32" color="primary" variant="flat">
                    <VIcon icon="mdi-layers-triple" size="18" color="white" />
                  </VAvatar>
                  <h5>{{ t('components.marketplace.installDialog.deploymentOptions') }}</h5>
                </div>

                <div class="deployment-slider-container">
                  <div class="slider-header">
                    <VChip
                      color="success"
                      variant="tonal"
                      size="small"
                      class="instances-chip"
                    >
                      <VIcon start icon="mdi-layers" size="14" />
                      {{ t('components.marketplace.installDialog.instances', { count: config.instances }) }}
                      <VIcon v-if="isInstancesLocked" icon="mdi-lock" size="14" color="warning" class="ml-1" />
                    </VChip>
                  </div>

                  <div class="slider-wrapper">
                    <VSlider
                      v-model="config.instances"
                      :min="3"
                      :max="100"
                      :step="1"
                      :thumb-label="false"
                      :disabled="isInstancesLocked"
                      color="primary"
                      track-color="primary"
                      class="deployment-slider"
                      hide-details
                    />
                  </div>
                </div>
              </div>

              <div class="pricing-info modern-section">
                <div class="section-header">
                  <VAvatar size="32" color="primary" variant="flat">
                    <VIcon icon="mdi-calculator" size="18" color="white" />
                  </VAvatar>
                  <h5>{{ t('components.marketplace.installDialog.estimatedPricing') }}</h5>
                </div>
                <div class="pricing-chips">
                  <VChip
                    color="success"
                    variant="elevated"
                    size="large"
                    class="price-chip usd-chip"
                  >
                    {{ totalCost }}
                  </VChip>
                  <div class="position-relative">
                    <VChip
                      color="primary"
                      variant="elevated"
                      size="large"
                      class="price-chip flux-chip"
                    >
                      <VIcon start icon="mdi-lightning-bolt" size="16" />
                      <span v-if="loadingPricing">{{ t('components.marketplace.installDialog.loading') }}</span>
                      <span v-else>{{ totalFluxPrice }} FLUX</span>
                    </VChip>
                    <VBadge
                      v-if="!loadingPricing && fluxDiscount > 0"
                      :content="`-${fluxDiscount}%`"
                      color="success"
                      class="position-absolute"
                      style="top: 4px; right: 4px; pointer-events: none;"
                    />
                  </div>
                </div>
              </div>

              <!-- Terms of Use Agreement -->
              <div class="config-section modern-section">
                <VCheckbox
                  v-model="termsAccepted"
                  color="primary"
                  hide-details
                >
                  <template #label>
                    <span class="text-body-2" v-html="t('components.marketplace.installDialog.agreeToTerms')"></span>
                  </template>
                </VCheckbox>
              </div>
            </div>
          </VWindowItem>

          <!-- Step 1: Environment Parameters (hidden for WordPress) -->
          <VWindowItem v-if="!isWordPress" :value="1">
            <div class="step-container">

              <div v-if="getEnvironmentParameters().length" class="params-section">
                <!-- Show Advanced Toggle (only for FluxCloud games with advanced params) -->
                <div v-if="isFluxCloudGame && getEnvironmentParameters().some(p => p.advanced)" class="advanced-toggle" style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
                  <VSwitch
                    v-model="showAdvanced"
                    :label="t('components.marketplace.installDialog.showAdvanced')"
                    color="primary"
                    hide-details
                    density="compact"
                  />
                </div>

                <div
                  v-for="param in getEnvironmentParameters().filter(p => !p.advanced || showAdvanced)"
                  :key="param.name"
                  class="param-item modern-section"
                >
                  <div class="section-header">
                    <VAvatar size="28" color="primary" variant="flat">
                      <VIcon icon="mdi-cog" size="16" color="white" />
                    </VAvatar>
                    <h5>{{ param.name }}</h5>
                  </div>

                  <!-- Dropdown for parameters with options -->
                  <VSelect
                    v-if="param.options && param.options.length"
                    v-model="config.parameters[param.name]"
                    :items="param.options"
                    :placeholder="param.placeholder"
                    :required="!param.optional"
                    variant="solo"
                    density="comfortable"
                    hide-details
                    class="modern-input"
                    color="primary"
                    attach
                    :menu-props="{ contentClass: 'install-dialog-select-menu' }"
                  >
                    <template #append-inner>
                      <VTooltip location="top">
                        <template #activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-help-circle" size="16" />
                        </template>
                        {{ param.description || t('components.marketplace.installDialog.configurationParameter') }}
                      </VTooltip>
                    </template>
                  </VSelect>

                  <!-- Text field for parameters without options -->
                  <VTextField
                    v-else
                    v-model="config.parameters[param.name]"
                    :placeholder="param.placeholder"
                    :required="!param.optional"
                    variant="solo"
                    density="comfortable"
                    hide-details
                    class="modern-input"
                    color="primary"
                  >
                    <template #append-inner>
                      <VTooltip location="top">
                        <template #activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-help-circle" size="16" />
                        </template>
                        {{ param.description || t('components.marketplace.installDialog.configurationParameter') }}
                      </VTooltip>
                    </template>
                  </VTextField>
                </div>
              </div>

              <div v-else class="no-params">
                <div class="no-params-icon">
                  <VIcon icon="mdi-check-circle" size="48" color="success" />
                </div>
                <div class="no-params-text">
                  <h5>{{ t('components.marketplace.installDialog.allSet') }}</h5>
                  <p>{{ t('components.marketplace.installDialog.noAdditionalConfig') }}</p>
                </div>
              </div>
            </div>
          </VWindowItem>

          <!-- Step 2: Geolocation (hidden for WordPress) -->
          <VWindowItem v-if="!isWordPress" :value="2">
            <div class="step-container geolocation-step">
              <div class="geolocation-section">
                <div class="section-header mb-3">
                  <VAvatar size="32" color="primary" variant="flat">
                    <VIcon icon="mdi-earth" size="20" color="white" />
                  </VAvatar>
                  <h5 class="deployment-title">{{ t('components.marketplace.installDialog.deploymentLocation') }}</h5>
                </div>

                <div class="geolocation-content">
                  <VRow>
                    <!-- Allowed Geolocation -->
                    <VCol cols="12" :md="isFluxCloudGame ? 12 : 6">
                      <div class="geolocation-card">
                        <h6 class="geolocation-title mb-4">
                          <VIcon icon="mdi-check-circle" color="success" class="mr-2" />
                          {{ t('components.marketplace.installDialog.allowedLocations') }}
                        </h6>

                        <div class="geolocation-controls">
                          <div class="control-group mb-3">
                            <label class="control-label">{{ t('components.marketplace.installDialog.continent') }}:</label>
                            <VSelect
                              v-model="geolocation.allowedContinent"
                              :items="[{name: t('components.marketplace.installDialog.global'), code: '', totalInstances: null}, ...availableContinents]"
                              item-title="name"
                              item-value="code"
                              :placeholder="t('components.marketplace.installDialog.globalAllContinents')"
                              variant="outlined"
                              density="compact"
                              class="geolocation-select"
                              @update:model-value="onContinentChange('allowed', $event)"
                            >
                              <template #prepend-inner>
                                <VIcon icon="mdi-earth" size="20" />
                              </template>
                              <template #item="{ props, item }">
                                <VListItem v-bind="props" class="geolocation-dropdown-item">
                                  <template #append v-if="item.raw.totalInstances">
                                    <VChip
                                      size="x-small"
                                      color="success"
                                      variant="tonal"
                                      class="node-count-chip"
                                    >
                                      {{ item.raw.totalInstances }}
                                    </VChip>
                                  </template>
                                </VListItem>
                              </template>
                            </VSelect>
                          </div>

                          <div class="control-group">
                            <label class="control-label">{{ t('components.marketplace.installDialog.country') }}:</label>
                            <VSelect
                              v-model="geolocation.allowedCountry"
                              :items="geolocation.allowedContinent ? [{name: t('components.marketplace.installDialog.allCountries'), code: '', instances: null}, ...allowedCountries] : []"
                              item-title="name"
                              item-value="code"
                              :placeholder="t('components.marketplace.installDialog.allCountries')"
                              variant="outlined"
                              density="compact"
                              :disabled="!geolocation.allowedContinent"
                              class="geolocation-select"
                              @update:model-value="onCountryChange('allowed', $event)"
                            >
                              <template #prepend-inner>
                                <VIcon icon="mdi-flag" size="20" />
                              </template>
                              <template #item="{ props, item }">
                                <VListItem v-bind="props" class="geolocation-dropdown-item">
                                  <template #append v-if="item.raw.instances">
                                    <VChip
                                      size="x-small"
                                      color="success"
                                      variant="tonal"
                                      class="node-count-chip"
                                    >
                                      {{ item.raw.instances }}
                                    </VChip>
                                  </template>
                                </VListItem>
                              </template>
                            </VSelect>
                          </div>

                          <!-- Add Button inside card -->
                          <div class="mt-3 d-flex justify-center">
                            <VBtn
                              color="success"
                              variant="outlined"
                              size="small"
                              @click="addAllowedGeolocation"
                              :disabled="!geolocation.allowedContinent"
                            >
                              <VIcon icon="mdi-plus" size="16" class="mr-1" />
                              {{ t('components.marketplace.installDialog.addAllowed') }}
                            </VBtn>
                          </div>
                        </div>
                      </div>
                    </VCol>

                    <!-- Forbidden Geolocation - Hidden for Games -->
                    <VCol v-if="!isFluxCloudGame" cols="12" md="6">
                      <div class="geolocation-card">
                        <h6 class="geolocation-title mb-4">
                          <VIcon icon="mdi-close-circle" color="error" class="mr-2" />
                          {{ t('components.marketplace.installDialog.forbiddenLocations') }}
                        </h6>

                        <div class="geolocation-controls">
                          <div class="control-group mb-3">
                            <label class="control-label">{{ t('components.marketplace.installDialog.continent') }}:</label>
                            <VSelect
                              v-model="geolocation.forbiddenContinent"
                              :items="[{name: t('components.marketplace.installDialog.noContinentsForbidden'), code: '', totalInstances: null}, ...availableContinents]"
                              item-title="name"
                              item-value="code"
                              :placeholder="t('components.marketplace.installDialog.noneNoRestrictions')"
                              variant="outlined"
                              density="compact"
                              class="geolocation-select"
                              @update:model-value="onContinentChange('forbidden', $event)"
                            >
                              <template #prepend-inner>
                                <VIcon icon="mdi-earth" size="20" />
                              </template>
                              <template #item="{ props, item }">
                                <VListItem v-bind="props" class="geolocation-dropdown-item">
                                  <template #append v-if="item.raw.totalInstances">
                                    <VChip
                                      size="x-small"
                                      color="error"
                                      variant="tonal"
                                      class="node-count-chip"
                                    >
                                      {{ item.raw.totalInstances }}
                                    </VChip>
                                  </template>
                                </VListItem>
                              </template>
                            </VSelect>
                          </div>

                          <div class="control-group">
                            <label class="control-label">{{ t('components.marketplace.installDialog.country') }}:</label>
                            <VSelect
                              v-model="geolocation.forbiddenCountry"
                              :items="geolocation.forbiddenContinent ? [{name: t('components.marketplace.installDialog.noCountriesForbidden'), code: '', instances: null}, ...forbiddenCountries] : []"
                              item-title="name"
                              item-value="code"
                              :placeholder="t('components.marketplace.installDialog.allCountries')"
                              variant="outlined"
                              density="compact"
                              :disabled="!geolocation.forbiddenContinent"
                              class="geolocation-select"
                              @update:model-value="onCountryChange('forbidden', $event)"
                            >
                              <template #prepend-inner>
                                <VIcon icon="mdi-flag" size="20" />
                              </template>
                              <template #item="{ props, item }">
                                <VListItem v-bind="props" class="geolocation-dropdown-item">
                                  <template #append v-if="item.raw.instances">
                                    <VChip
                                      size="x-small"
                                      color="error"
                                      variant="tonal"
                                      class="node-count-chip"
                                    >
                                      {{ item.raw.instances }}
                                    </VChip>
                                  </template>
                                </VListItem>
                              </template>
                            </VSelect>
                          </div>

                          <!-- Add Button inside card -->
                          <div class="mt-3 d-flex justify-center">
                            <VBtn
                              color="error"
                              variant="outlined"
                              size="small"
                              @click="addForbiddenGeolocation"
                              :disabled="!geolocation.forbiddenContinent"
                            >
                              <VIcon icon="mdi-plus" size="16" class="mr-1" />
                              {{ t('components.marketplace.installDialog.addForbidden') }}
                            </VBtn>
                          </div>
                        </div>
                      </div>
                    </VCol>
                  </VRow>

                  <!-- Current Geolocation Rules -->
                  <div v-if="allowedGeolocations.length > 0 || forbiddenGeolocations.length > 0" class="mt-4">
                    <h4 class="mb-3 current-rules-title">
                      <VIcon icon="mdi-format-list-bulleted" size="20" class="mr-2" />
                      {{ t('components.marketplace.installDialog.currentRules') }}
                    </h4>

                    <!-- Allowed Rules -->
                    <div v-if="allowedGeolocations.length > 0" class="mb-4">
                      <h5 class="text-success mb-2 d-flex align-center">
                        <VIcon icon="mdi-check-circle" size="20" class="mr-1" />
                        {{ t('components.marketplace.installDialog.allowedLocationsColon') }}
                      </h5>
                      <div class="d-flex flex-wrap gap-2">
                        <VChip
                          v-for="(geo, index) in allowedGeolocations"
                          :key="index"
                          color="success"
                          variant="tonal"
                          closable
                          @click:close="removeAllowedGeolocation(index)"
                        >
                          <VIcon icon="mdi-check-circle" size="14" class="mr-1" />
                          {{ formatGeolocationLabel(geo) }}
                        </VChip>
                      </div>
                    </div>

                    <!-- Forbidden Rules - Hidden for Games -->
                    <div v-if="!isFluxCloudGame && forbiddenGeolocations.length > 0">
                      <h5 class="text-error mb-2 d-flex align-center">
                        <VIcon icon="mdi-close-circle" size="20" class="mr-1" />
                        {{ t('components.marketplace.installDialog.forbiddenLocationsColon') }}
                      </h5>
                      <div class="d-flex flex-wrap gap-2">
                        <VChip
                          v-for="(geo, index) in forbiddenGeolocations"
                          :key="index"
                          color="error"
                          variant="tonal"
                          closable
                          @click:close="removeForbiddenGeolocation(index)"
                        >
                          <VIcon icon="mdi-close-circle" size="14" class="mr-1" />
                          {{ formatGeolocationLabel(geo) }}
                        </VChip>
                      </div>
                    </div>
                  </div>

                  <VAlert
                    type="info"
                    variant="tonal"
                    class="mt-4"
                    icon="mdi-information"
                  >
                    <div class="alert-content">
                      <ul class="alert-list">
                        <li><strong>{{ t('components.marketplace.installDialog.allowedColon') }}</strong> {{ t('components.marketplace.installDialog.allowedGeoInfo') }}</li>
                        <li v-if="!isFluxCloudGame"><strong>{{ t('components.marketplace.installDialog.forbiddenColon') }}</strong> {{ t('components.marketplace.installDialog.forbiddenGeoInfo') }}</li>
                        <li><strong>{{ t('components.marketplace.installDialog.globalColon') }}</strong> {{ t('components.marketplace.installDialog.globalGeoInfo') }}</li>
                      </ul>
                    </div>
                  </VAlert>
                </div>
              </div>
            </div>
          </VWindowItem>

          <!-- Step 3: Email Alerts (hidden for WordPress) -->
          <VWindowItem v-if="!isWordPress" :value="3">
            <div class="step-container email-step">
              <div class="email-section">
                <div class="section-header mb-3">
                  <VAvatar size="32" color="warning" variant="flat">
                    <VIcon icon="mdi-email-alert" size="18" color="white" />
                  </VAvatar>
                  <h5 class="email-title">{{ t('components.marketplace.installDialog.emailNotifications') }}</h5>
                </div>

                <div class="email-content">
                  <VRow justify="center">
                    <VCol cols="12" md="8">
                      <div class="email-card">
                        <h6 class="notification-subtitle">
                          <VIcon icon="mdi-bell-ring" color="warning" class="mr-2" />
                          {{ t('components.marketplace.installDialog.notificationSettings') }}
                        </h6>

                        <div class="email-control">
                          <VTextField
                            v-model="emailNotifications.email"
                            :label="t('components.marketplace.installDialog.emailAddress')"
                            :placeholder="t('components.marketplace.installDialog.enterEmailOptional')"
                            variant="outlined"
                            density="comfortable"
                            type="email"
                            :rules="emailRules"
                            class="email-input"
                            @input="validateEmail"
                          >
                            <template #prepend-inner>
                              <VIcon icon="mdi-email" size="20" />
                            </template>
                          </VTextField>
                        </div>

                        <div class="notification-info mt-4">
                          <div class="info-item">
                            <VIcon icon="mdi-information" color="info" class="mr-3" />
                            <span>{{ t('components.marketplace.installDialog.notificationInfo1') }}</span>
                          </div>
                          <div class="info-item">
                            <VIcon icon="mdi-information" color="info" class="mr-3" />
                            <span>{{ t('components.marketplace.installDialog.notificationInfo2') }}</span>
                          </div>
                          <div class="info-item">
                            <VIcon icon="mdi-information" color="info" class="mr-3" />
                            <span>{{ t('components.marketplace.installDialog.notificationInfo3') }}</span>
                          </div>
                        </div>
                      </div>
                    </VCol>
                  </VRow>
                </div>
              </div>
            </div>
          </VWindowItem>

          <!-- Step 4: Signing (All Users - Auto-Detection) / WordPress Step 0 -->
          <VWindowItem :value="isWordPress ? 0 : 4">
            <div class="step-container">
              <div class="signing-section">
                <div class="text-center mb-6">
                  <div class="d-flex align-center justify-center mb-4">
                    <VAvatar size="40" color="primary" variant="flat" class="mr-3">
                      <VIcon icon="mdi-rocket-launch" size="24" color="white" />
                    </VAvatar>
                    <div class="text-h4">{{ t('components.marketplace.installDialog.launchingApplication') }}</div>
                  </div>
                  <div class="text-body-1 mb-4">
                    {{ t('components.marketplace.installDialog.applicationNeedsSignature') }}
                  </div>

                  <!-- Status Chips -->
                  <div class="d-flex justify-center gap-2 mb-6">
                    <VChip color="info" variant="tonal" size="small">
                      <VIcon start icon="mdi-security" size="16" />
                      {{ t('components.marketplace.installDialog.secureSigning') }}
                    </VChip>
                    <VChip color="success" variant="tonal" size="small">
                      <VIcon start icon="mdi-cloud-check" size="16" />
                      {{ t('components.marketplace.installDialog.networkRegistration') }}
                    </VChip>
                  </div>

                  <!-- Auto-Detected Method Icon -->
                  <div v-if="!signStepCompleted[1] && detectedSigningMethod" class="text-center mb-4">
                    <div class="detected-method-display">
                      <a class="wallet-link" :title="detectedSigningMethod">
                        <!-- SSO - Use @ icon instead of image -->
                        <div
                          v-if="detectedSigningMethod === 'SSO'"
                          class="sso-icon-wrapper"
                        >
                          <VIcon icon="mdi-at" size="40" color="white" />
                        </div>
                        <img
                          v-else-if="detectedSigningMethod.includes('ZelCore')"
                          :src="fluxIDLogo"
                          alt="Flux ID (ZelCore)"
                          class="walletIcon"
                        />
                        <img
                          v-else-if="detectedSigningMethod === 'SSP'"
                          :src="theme.global.name.value === 'dark' ? sspLogoWhite : sspLogoBlack"
                          alt="SSP"
                          class="walletIcon"
                        />
                        <img
                          v-else-if="detectedSigningMethod === 'MetaMask'"
                          :src="metamaskLogo"
                          alt="MetaMask"
                          class="walletIcon"
                        />
                        <img
                          v-else-if="detectedSigningMethod === 'WalletConnect'"
                          :src="walletConnectLogo"
                          alt="WalletConnect"
                          class="walletIcon"
                        />
                        <!-- Manual - Use pen/signature icon -->
                        <div
                          v-else-if="detectedSigningMethod === 'Manual'"
                          class="sso-icon-wrapper"
                        >
                          <VIcon icon="mdi-draw-pen" size="40" color="white" />
                        </div>
                      </a>
                    </div>
                  </div>

                  <!-- Sign and Register Button -->
                  <VBtn
                    v-if="!signingProgress.signing && !signingProgress.registering && !signStepCompleted[1]"
                    color="primary"
                    class="launch-app-btn"
                    @click="signApplicationMessage"
                    :disabled="availableWallets.length === 0"
                  >
                    <VIcon start icon="mdi-draw-pen" size="24" />
                    {{ t('components.marketplace.installDialog.signAndRegister') }}
                  </VBtn>


                  <!-- No Wallets Warning -->
                  <VAlert
                    v-if="availableWallets.length === 0 && !signingProgress.signing && !signingProgress.registering"
                    type="warning"
                    variant="tonal"
                    class="mt-4"
                  >
                    <div class="text-body-2">
                      {{ t('components.marketplace.installDialog.noCompatibleWallets') }}
                    </div>
                  </VAlert>

                  <!-- Progress Section -->
                  <div v-if="signingProgress.signing || signingProgress.registering" class="progress-section">
                    <!-- Progress Steps -->
                    <div class="progress-steps mt-6">
                      <div class="d-flex justify-center align-center gap-6">
                        <div class="progress-step">
                          <div class="d-flex align-center">
                            <div class="progress-icon mr-3">
                              <VIcon v-if="signStepCompleted[0]" icon="mdi-check-circle" color="success" size="24" />
                              <VProgressCircular v-else-if="signingProgress.signing" indeterminate size="24" width="3" color="primary" />
                              <VIcon v-else icon="mdi-circle-outline" color="grey" size="24" />
                            </div>
                            <span class="progress-text">{{ t('components.marketplace.installDialog.signingApp') }}</span>
                          </div>
                        </div>

                        <div class="progress-step">
                          <div class="d-flex align-center">
                            <div class="progress-icon mr-3">
                              <VIcon v-if="signStepCompleted[1]" icon="mdi-check-circle" color="success" size="24" />
                              <VProgressCircular v-else-if="signingProgress.registering" indeterminate size="24" width="3" color="primary" />
                              <VIcon v-else icon="mdi-circle-outline" color="grey" size="24" />
                            </div>
                            <span class="progress-text">{{ t('components.marketplace.installDialog.registeringApp') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Cancel Button (hidden for SSO since it's automatic) -->
                    <div v-if="!signStepCompleted[0] && detectedSigningMethod !== 'SSO'" class="d-flex justify-center mt-5">
                      <VBtn
                        variant="outlined"
                        color="error"
                        @click="resetSigningState"
                        class="cancel-signing-btn"
                        style="min-width: 300px;"
                      >
                        <VIcon start icon="mdi-close" size="24" />
                        {{ t('components.marketplace.installDialog.cancel') }}
                      </VBtn>
                    </div>
                  </div>

                  <!-- Success Message -->
                  <div v-if="signStepCompleted[0] && signStepCompleted[1]" class="success-section">
                    <VIcon icon="mdi-check-circle" size="64" color="success" class="mb-3" />
                    <div class="text-h5 text-success mb-2">{{ t('components.marketplace.installDialog.signingAndRegistrationComplete') }}</div>
                    <div class="text-caption mt-2">
                      <span v-if="redirectCountdown > 0">{{ t('components.marketplace.installDialog.redirectIn', { seconds: redirectCountdown }) }}</span>
                      <span v-else>{{ t('components.marketplace.installDialog.proceedToNextStep') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </VWindowItem>

          <!-- Step 5: Payment (both SSO and wallet) / WordPress Step 1 -->
          <VWindowItem :value="isWordPress ? 1 : 5">
            <div class="step-container">

              <div class="payment-section">
                <!-- Payment Information Text (FluxCloud style) -->
                <div class="payment-info-section modern-section">
                  <div class="section-header">
                    <VAvatar size="32" color="info" variant="flat">
                      <VIcon icon="mdi-information" size="18" color="white" />
                    </VAvatar>
                    <h5>{{ t('components.marketplace.installDialog.paymentInformation') }}</h5>
                  </div>
                  <div class="payment-info-content">
                    <div class="d-flex align-center mb-3">
                      <VIcon icon="mdi-check-circle" color="success" size="22" class="mr-2 flex-shrink-0" />
                      <div class="text-body-1 text-high-emphasis" v-html="t('components.marketplace.installDialog.paymentLinksValid')">
                      </div>
                    </div>
                    <div class="d-flex align-center mb-3">
                      <VIcon icon="mdi-calendar-clock" color="orange" size="22" class="mr-2 flex-shrink-0" />
                      <div class="text-body-1 text-high-emphasis" v-html="t('components.marketplace.installDialog.subscribedUntil', { date: subscriptionEndDate })">
                      </div>
                    </div>
                    <div class="d-flex align-center">
                      <VIcon icon="mdi-information" color="info" size="22" class="mr-2 flex-shrink-0" />
                      <div class="text-body-1 text-high-emphasis" v-html="t('components.marketplace.installDialog.finishRegistrationInfo')">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Payment Method Selection with Prices -->
                <div class="payment-method-section modern-section">
                  <div class="section-header">
                    <VAvatar size="32" color="primary" variant="flat">
                      <VIcon icon="mdi-wallet" size="18" color="white" />
                    </VAvatar>
                    <h5>{{ t('components.marketplace.installDialog.choosePaymentMethod') }}</h5>
                  </div>

                  <VRadioGroup v-model="paymentMethod" class="payment-methods-compact">
                    <VCard
                      v-for="method in paymentMethods"
                      :key="method.id"
                      class="payment-method-card-compact" :class="[{ 'selected': paymentMethod === method.id }]"
                      @click="paymentMethod = method.id"
                      :elevation="paymentMethod === method.id ? 2 : 0"
                      :variant="paymentMethod === method.id ? 'elevated' : 'flat'"
                    >
                      <VCardText class="payment-method-content pa-2">
                        <div class="payment-method-row">
                          <div class="payment-method-info">
                            <VRadio
                              :value="method.id"
                              hide-details
                              color="primary"
                            />
                            <img :src="method.image" :alt="method.name" class="payment-method-logo-compact" style="margin-left: -16px;" />
                            <div class="payment-method-text">
                              <div class="text-body-2 font-weight-medium">{{ method.name }}</div>
                              <div class="text-caption text-medium-emphasis">{{ method.description }}</div>
                            </div>
                          </div>
                          <div class="payment-method-price">
                            <div v-if="method.id === 'flux' || method.id === 'ssp'" class="text-body-2 font-weight-bold text-success">
                              <span v-if="loadingPricing">{{ t('components.marketplace.installDialog.loading') }}</span>
                              <span v-else>{{ totalFluxPrice }} FLUX</span>
                              <VChip v-if="!loadingPricing && fluxDiscount > 0" size="x-small" color="success" class="ml-1">-{{ fluxDiscount }}%</VChip>
                            </div>
                            <div v-else class="text-body-2 font-weight-bold">
                              {{ totalCost }} + {{ t('components.marketplace.installDialog.vat') }}
                            </div>
                          </div>
                        </div>
                      </VCardText>
                    </VCard>
                  </VRadioGroup>
                </div>

                <!-- FLUX Payment (ZelCore/SSP) -->
                <VExpandTransition>
                  <div v-if="paymentMethod === 'flux' || paymentMethod === 'ssp'" class="crypto-payment-section modern-section">
                    <div class="section-header">
                      <VAvatar size="48" color="white" variant="flat">
                        <img
                          :src="paymentMethod === 'flux' ? fluxIDLogo : (theme.global.name.value === 'dark' ? sspLogoWhite : sspLogoBlack)"
                          :alt="paymentMethod === 'flux' ? 'ZelCore' : 'SSP'"
                          style="width: 44px; height: 44px; object-fit: contain;"
                        />
                      </VAvatar>
                      <h5>{{ paymentMethod === 'flux' ? t('components.marketplace.installDialog.paymentInstructionsZelCore') : t('components.marketplace.installDialog.paymentInstructionsSSP') }}</h5>
                    </div>

                    <!-- Payment Details (hidden during monitoring) -->
                    <div v-if="!paymentProcessing" class="payment-details-content">
                      <VCard style="background: rgba(var(--v-theme-surface), 0.6);" class="mb-2">
                        <VCardText class="pa-2">
                          <div class="d-flex align-center mb-1">
                            <VIcon icon="mdi-wallet-outline" size="18" class="mr-2" />
                            <div class="text-caption font-weight-medium">{{ t('components.marketplace.installDialog.paymentAddress') }}</div>
                          </div>
                          <div class="d-flex align-center ga-2">
                            <code class="text-caption flex-grow-1 text-truncate pa-1 rounded" style="background: rgba(0,0,0,0.1);">{{ fluxPaymentAddress }}</code>
                            <VBtn
                              size="x-small"
                              variant="text"
                              icon
                              color="grey"
                              @click="copyToClipboard(fluxPaymentAddress, t('components.marketplace.installDialog.copiedToClipboard'))"
                            >
                              <VIcon icon="mdi-content-copy" size="16" />
                            </VBtn>
                          </div>
                        </VCardText>
                      </VCard>

                      <VCard style="background: rgba(var(--v-theme-surface), 0.6);" class="mb-2">
                        <VCardText class="pa-2">
                          <div class="d-flex align-center mb-1">
                            <VIcon icon="mdi-message-text-outline" size="18" class="mr-2" />
                            <div class="text-caption font-weight-medium">{{ t('components.marketplace.installDialog.paymentMessage') }}</div>
                          </div>
                          <div class="d-flex align-center ga-2">
                            <code class="text-caption flex-grow-1 text-truncate pa-1 rounded" style="background: rgba(0,0,0,0.1);">{{ paymentHash || t('components.marketplace.installDialog.generating') }}</code>
                            <VBtn
                              size="x-small"
                              variant="text"
                              icon
                              color="grey"
                              @click="copyToClipboard(paymentHash, t('components.marketplace.installDialog.copiedToClipboard'))"
                              :disabled="!paymentHash"
                            >
                              <VIcon icon="mdi-content-copy" size="16" />
                            </VBtn>
                          </div>
                        </VCardText>
                      </VCard>

                      <VBtn
                        color="primary"
                        size="default"
                        block
                        @click="paymentMethod === 'flux' ? processFluxPayment() : processSSPPayment()"
                        class="text-none"
                        elevation="2"
                      >
                        <VIcon start icon="mdi-wallet" size="18" />
                        {{ t('components.marketplace.installDialog.openWallet', { wallet: paymentMethod === 'flux' ? 'ZelCore' : 'SSP' }) }}
                      </VBtn>
                    </div>

                    <!-- Payment Monitoring (shown during monitoring) -->
                    <div v-else class="payment-monitoring-content">
                      <div class="d-flex flex-column align-center justify-center pa-6">
                        <VProgressCircular
                          v-if="!paymentConfirmed"
                          indeterminate
                          color="primary"
                          size="64"
                          width="6"
                          class="mb-4"
                        />
                        <VIcon v-else icon="mdi-check-circle" size="64" color="success" class="mb-4" />
                        <div class="text-h6 mb-2">{{ paymentConfirmed ? t('components.marketplace.installDialog.paymentConfirmed') : t('components.marketplace.installDialog.waitingForPayment') }}</div>
                        <div class="text-body-2 text-center mb-4 text-medium-emphasis">
                          <span v-if="!paymentConfirmed" v-html="t('components.marketplace.installDialog.completePaymentInWallet', { wallet: paymentMethod === 'flux' ? 'ZelCore' : 'SSP' })">
                          </span>
                          <span v-else-if="redirectCountdown > 0" class="text-success">
                            {{ t('components.marketplace.installDialog.advancingToDeployment', { seconds: redirectCountdown }) }}
                          </span>
                        </div>
                        <VBtn
                          v-if="!paymentConfirmed"
                          variant="outlined"
                          color="error"
                          @click="cancelPaymentMonitoring"
                          class="text-none"
                        >
                          <VIcon start icon="mdi-close" />
                          {{ t('components.marketplace.installDialog.cancelMonitoring') }}
                        </VBtn>
                      </div>
                    </div>
                  </div>
                </VExpandTransition>

                <!-- Stripe/PayPal Payment -->
                <VExpandTransition>
                  <div v-if="paymentMethod === 'stripe' || paymentMethod === 'paypal'" class="fiat-payment-section modern-section">
                    <div class="section-header">
                      <VAvatar size="48" color="white" variant="flat">
                        <img
                          :src="paymentMethod === 'stripe' ? stripeIcon : paypalLogo"
                          :alt="paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'"
                          style="width: 48px; height: 48px; object-fit: contain;"
                        />
                      </VAvatar>
                      <h5>{{ paymentMethod === 'stripe' ? 'Stripe' : 'PayPal' }} Payment</h5>
                    </div>

                    <!-- Maintenance UI (shown when payment bridge has errors) -->
                    <div v-if="paymentBridgeMaintenance" class="maintenance-content">
                      <div class="d-flex flex-column align-center justify-center pa-6">
                        <VIcon icon="mdi-wrench" size="64" color="warning" class="mb-4" />
                        <div class="text-h6 mb-2">{{ t('components.marketplace.installDialog.paymentServiceMaintenance') }}</div>
                        <div class="text-body-2 text-center mb-4 text-medium-emphasis">
                          {{ t('components.marketplace.installDialog.maintenanceMessage') }}
                        </div>
                        <VBtn
                          variant="flat"
                          color="primary"
                          @click="paymentBridgeMaintenance = false"
                          class="text-none"
                        >
                          <VIcon start icon="mdi-refresh" size="24" />
                          {{ t('components.marketplace.installDialog.tryAgain') }}
                        </VBtn>
                      </div>
                    </div>

                    <!-- Payment Details (hidden during monitoring or maintenance) -->
                    <div v-else-if="!paymentProcessing" class="payment-details-content">
                      <VCard class="mb-3" variant="tonal" color="primary">
                        <VCardText class="d-flex align-center pa-3">
                          <VIcon :icon="paymentMethod === 'stripe' ? 'mdi-shield-check' : 'mdi-security'" size="20" class="mr-2" />
                          <div class="text-body-2">
                            {{ t('components.marketplace.installDialog.secureCheckout', { provider: paymentMethod === 'stripe' ? 'Stripe' : 'PayPal' }) }}
                          </div>
                        </VCardText>
                      </VCard>

                      <VBtn
                        color="primary"
                        size="large"
                        block
                        @click="paymentMethod === 'stripe' ? processStripePayment() : processPayPalPayment()"
                        class="text-none"
                        elevation="2"
                      >
                        <VIcon start :icon="paymentMethod === 'stripe' ? 'mdi-credit-card' : 'mdi-paypal'" size="20" />
                        {{ t('components.marketplace.installDialog.continueTo', { provider: paymentMethod === 'stripe' ? 'Stripe' : 'PayPal' }) }}
                      </VBtn>
                    </div>

                    <!-- Payment Monitoring (shown during monitoring) -->
                    <div v-else class="payment-monitoring-content">
                      <div class="d-flex flex-column align-center justify-center pa-6">
                        <VProgressCircular
                          indeterminate
                          :color="paymentMethod === 'stripe' ? 'primary' : 'info'"
                          size="64"
                          width="6"
                          class="mb-4"
                        />
                        <div class="text-h6 mb-2">{{ t('components.marketplace.installDialog.waitingForPayment') }}</div>
                        <div class="text-body-2 text-center mb-4 text-medium-emphasis" v-html="t('components.marketplace.installDialog.completePaymentInCheckout', { provider: paymentMethod === 'stripe' ? 'Stripe' : 'PayPal' })">
                        </div>
                        <VBtn
                          variant="outlined"
                          color="error"
                          @click="cancelPaymentMonitoring"
                          class="text-none"
                        >
                          <VIcon start icon="mdi-close" />
                          Cancel Monitoring
                        </VBtn>
                      </div>
                    </div>
                  </div>
                </VExpandTransition>
              </div>
            </div>
          </VWindowItem>

          <!-- Final Step: Deployment -->
          <VWindowItem :value="totalSteps - 1">
            <div class="step-container d-flex align-center justify-center" style="min-height: 400px;">

              <div class="deployment-summary modern-section" style="max-width: 800px; margin: 0 auto;">
                <div class="section-header">
                  <VAvatar size="32" color="success" variant="flat">
                    <VIcon icon="mdi-check-circle" size="18" color="white" />
                  </VAvatar>
                  <h5>{{ t('components.marketplace.installDialog.deploymentSummary') }}</h5>
                </div>

                <div class="text-center mb-4">
                  <div class="d-flex align-center justify-center gap-2 text-h5 text-success mb-2">
                    <VIcon icon="mdi-party-popper" size="32" color="success" />
                    {{ t('components.marketplace.installDialog.paymentConfirmedExclaim') }}
                    <VIcon icon="mdi-rocket-launch" size="32" color="success" />
                  </div>
                  <div class="text-body-2 text-medium-emphasis">{{ t('components.marketplace.installDialog.applicationActiveAndRunning') }}</div>
                </div>

                <div class="mb-4">
                  <div class="d-flex justify-center mb-3">
                    <VChip variant="tonal" size="default" class="summary-chip">
                      <VIcon start icon="mdi-application" size="16" />
                      <template v-if="isWordPress && app.planName">
                        WordPress {{ app.planName }}
                      </template>
                      <template v-else>
                        {{ app.displayName || app.name }}
                      </template>
                    </VChip>
                  </div>
                  <div class="d-flex justify-center align-center flex-wrap gap-2">
                    <VChip color="warning" variant="tonal" size="small" class="summary-chip">
                      <VIcon start icon="mdi-cpu-64-bit" size="14" />
                      {{ t('components.marketplace.installDialog.coresCount', { count: config.cpu }) }}
                    </VChip>
                    <VChip color="success" variant="tonal" size="small" class="summary-chip">
                      <VIcon start icon="mdi-memory" size="14" />
                      {{ config.ram }} MB
                    </VChip>
                    <VChip color="purple" variant="tonal" size="small" class="summary-chip">
                      <VIcon start icon="mdi-harddisk" size="14" />
                      {{ config.storage }} GB
                    </VChip>
                    <VChip color="orange" variant="tonal" size="small" class="summary-chip">
                      <VIcon start icon="mdi-layers" size="14" />
                      {{ t('components.marketplace.installDialog.instances', { count: config.instances }) }}
                    </VChip>
                  </div>

                  <!-- Component versions list -->
                  <div v-if="componentVersions.length > 0" class="mt-3">
                    <VList density="compact" class="pa-0" style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 8px;">
                      <VListItem v-for="(comp, index) in componentVersions" :key="comp.name" :class="{ 'border-b': index < componentVersions.length - 1 }">
                        <template v-slot:prepend>
                          <VIcon icon="mdi-docker" size="20" color="info" />
                        </template>
                        <VListItemTitle class="text-body-2">
                          <span class="font-weight-medium">{{ comp.name }}</span>
                        </VListItemTitle>
                        <template v-slot:append>
                          <VChip size="x-small" variant="tonal" color="info">
                            {{ comp.version }}
                          </VChip>
                        </template>
                      </VListItem>
                    </VList>
                  </div>
                </div>

                <VDivider class="my-4" />

                <div class="payment-summary">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-body-2 text-medium-emphasis">{{ t('components.marketplace.installDialog.paymentType') }}:</span>
                    <VChip size="small" variant="tonal" :color="(paymentMethod === 'flux' || paymentMethod === 'ssp') ? 'success' : 'info'">
                      <VIcon start :icon="(paymentMethod === 'flux' || paymentMethod === 'ssp') ? 'mdi-bitcoin' : 'mdi-credit-card'" size="16" />
                      {{ (paymentMethod === 'flux' || paymentMethod === 'ssp') ? t('components.marketplace.installDialog.crypto') : t('components.marketplace.installDialog.fiat') }}
                    </VChip>
                  </div>
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-body-2 text-medium-emphasis">{{ t('components.marketplace.installDialog.paymentMethod') }}:</span>
                    <VChip size="small" variant="tonal" color="info">
                      <VIcon start :icon="paymentMethod === 'flux' ? 'mdi-wallet' : paymentMethod === 'ssp' ? 'mdi-wallet' : paymentMethod === 'stripe' ? 'mdi-credit-card' : 'mdi-paypal'" size="16" />
                      {{ paymentMethod === 'flux' ? 'ZelCore' : paymentMethod === 'ssp' ? 'SSP' : paymentMethod === 'stripe' ? 'Stripe' : 'PayPal' }}
                    </VChip>
                  </div>
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-body-2 text-medium-emphasis">{{ t('components.marketplace.installDialog.totalPaid') }}:</span>
                    <VChip size="small" variant="tonal" color="success">
                      <VIcon start :icon="(paymentMethod === 'flux' || paymentMethod === 'ssp') ? 'mdi-lightning-bolt' : 'mdi-check-circle'" size="18" />
                      {{ (paymentMethod === 'flux' || paymentMethod === 'ssp') ? `${totalFluxPrice} FLUX` : totalCost }}
                    </VChip>
                  </div>
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-body-2 text-medium-emphasis">{{ t('components.marketplace.installDialog.subscriptionValidUntil') }}:</span>
                    <VChip size="small" variant="tonal">
                      <VIcon start icon="mdi-calendar-check" size="16" />
                      {{ subscriptionEndDate }}
                    </VChip>
                  </div>
                </div>

                <VDivider class="mt-4 mb-2" />

                <div class="d-flex justify-center mb-3">
                  <VBtn
                    color="primary"
                    variant="flat"
                    size="default"
                    :to="`/apps/manage/${encodeURIComponent(deployedAppName)}`"
                  >
                    <VIcon start icon="mdi-cog" size="20" />
                    {{ t('components.marketplace.installDialog.manageApplication') }}
                  </VBtn>
                </div>

              </div>

              <div v-if="deploying" class="deployment-progress">
                <VProgressCircular indeterminate color="primary" size="48" />
                <p>{{ t('components.marketplace.installDialog.deployingYourApplication') }}</p>
              </div>
            </div>
          </VWindowItem>
        </VWindow>
      </VCardText>

      <!-- Actions (hidden on deployment step) -->
      <VCardActions v-if="currentStep < totalSteps - 1" class="install-actions">
        <VBtn
          v-if="currentStep > 0"
          variant="flat"
          icon="mdi-arrow-left-circle"
          @click="handlePreviousStep"
          :disabled="deploying"
        />
        <VSpacer />
        <VBtn
          color="primary"
          variant="flat"
          icon="mdi-arrow-right-circle"
          @click="nextStep"
          :disabled="!canProceed"
        />
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Popup Blocked Dialog -->
  <VDialog v-model="popupBlockedDialog" max-width="500">
    <VCard rounded="xl" class="overflow-hidden">
      <VCardTitle class="d-flex align-center gap-3 bg-primary text-white" style="height: 52px; padding-inline: 16px;">
        <VIcon icon="mdi-alert-circle" color="orange" size="28" />
        <span class="text-h6">{{ t('components.marketplace.installDialog.popupBlocked') }}</span>
      </VCardTitle>
      <VCardText class="py-8 px-6 text-center">
        <VIcon icon="mdi-block-helper" color="orange" size="64" class="mb-4" />
        <p class="text-body-1 mb-3">
          {{ t('components.marketplace.installDialog.browserBlockedCheckout', { type: blockedPaymentType }) }}
        </p>
        <p class="text-body-2 text-medium-emphasis">
          {{ t('components.marketplace.installDialog.clickButtonToOpenPayment') }}
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
          {{ t('components.marketplace.installDialog.cancel') }}
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
          {{ t('components.marketplace.installDialog.openPaymentType', { type: blockedPaymentType }) }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Manual Signing Dialog -->
  <ManualSignDialog
    v-model="manualSignDialogVisible"
    :message="manualSignDialogMessage"
    @submit="handleManualSignSubmit"
    @cancel="handleManualSignCancel"
    @copy="showSnackbar(t('common.messages.copiedToClipboard'), 'success', 3000, 'mdi-clipboard-check')"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLoginSheet } from '@/composables/useLoginSheet'
import { storeToRefs } from 'pinia'
import { useTheme } from 'vuetify'
import { useMarketplace } from '@/composables/useMarketplace'
import { useGameUtils } from '@/composables/useGameUtils'
import { useSnackbar } from '@/composables/useSnackbar'
import AppsService from '@/services/AppsService'
import IDService from '@/services/IDService'
import StorageService from '@/services/StorageService'
import { useFluxStore } from '@/stores/flux'
import { getDetectedBackendURL } from '@/utils/backend'
import geolocationData from '@/utils/geolocation'
import { paymentBridge } from '@/utils/fiatGateways'
import { getUser } from '@/utils/firebase'
import { importRsaPublicKey, encryptAesKeyWithRsaKey, encryptEnterpriseWithAes, isWebCryptoAvailable } from '@/utils/enterpriseCrypto'
import { payWithZelcore, payWithSSP, isSSPAvailable, isZelcoreAvailable, isBrowserMetaMaskAvailable, getConnectedAccount, hasWalletConnectSession, signWithWalletConnect as walletServiceSignWithWalletConnect, watchWalletAccount, signWithSSP as walletServiceSignWithSSP, signWithZelcore as walletServiceSignWithZelcore } from '@/utils/walletService'
import axios from 'axios'
import qs from 'query-string'
import ManualSignDialog from '@/@core/components/ManualSignDialog.vue'

// Import wallet logos
import metamaskLogo from '@images/metamask.svg?url'
import sspLogoBlack from '@images/ssp-logo-black.svg?url'
import sspLogoWhite from '@images/ssp-logo-white.svg?url'
import walletConnectLogo from '@images/walletconnect.svg?url'
import fluxIDLogo from '@images/FluxID.svg?url'
import stripeLogo from '@images/Stripe.svg?url'
import stripeIcon from '@images/stripe-icon.svg?url'
import paypalLogo from '@images/PayPal.png?url'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  app: {
    type: Object,
    required: true,
  },
  selectedConfig: {
    type: Object,
    default: null,
  },
  isWordPress: {
    type: Boolean,
    default: false,
  },
  isGame: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['update:modelValue', 'deployed', 'installed'])

// i18n
const { t } = useI18n()

// Login sheet
const { openLoginBottomSheet, closeLoginBottomSheet } = useLoginSheet()

// Theme detection for logos
const theme = useTheme()
const { showSnackbar } = useSnackbar()

const { deployApp: deployAppService } = useMarketplace()
const { parseLandingImage, getConfigResources } = useGameUtils()

// WordPress detection
const isWordPress = computed(() => props.isWordPress === true)

// Parse app icon to handle asset:// protocol
const appIcon = computed(() => parseLandingImage(props.app?.icon))

// Parse component versions from app spec (for both WordPress and regular apps)
const componentVersions = computed(() => {
  // If WordPress provides componentVersions directly, use those
  if (props.app?.componentVersions && props.app.componentVersions.length > 0) {
    return props.app.componentVersions
  }

  // Otherwise, parse from compose array for regular apps
  const compose = detailedApp.value?.compose || props.app?.compose || []
  if (compose.length === 0) return []

  return compose.map(comp => ({
    name: comp.name,
    version: comp.repotag ? (comp.repotag.split(':')[1] || 'latest') : 'latest',
    repotag: comp.repotag || '',
  }))
})

// Dialog state
const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Check if user is logged in - using privilege from flux store (reactive)
const isLoggedIn = computed(() => privilege.value !== 'none')

// Compute the full deployed app name with timestamp
const deployedAppName = computed(() => {
  if (deploymentTimestamp.value) {
    return `${props.app.name}${deploymentTimestamp.value}`
  }
  
  return props.app.name
})

// Wizard state
const currentStep = ref(0)
const totalSteps = computed(() => {
  // WordPress has only 3 steps: Sign/Registry -> Payment -> Deploy
  if (isWordPress.value) {
    return 3
  }

  // Regular apps: Both SSO and wallet now have 7 steps (SSO auto-signs on step 4)
  return 7
})
const deploying = ref(false)
const paymentProcessing = ref(false)
const signing = ref(false) // Deprecated - kept for compatibility
const signatureCompleted = ref(false) // Deprecated - kept for compatibility
const termsAccepted = ref(false)
const signatureError = ref('') // Deprecated - kept for compatibility

// New signing state management (FluxCloud style)
const signStepCompleted = ref([false, false]) // [signing, registration]
const signingProgress = ref({
  signing: false,
  registering: false,
})
const signingErrors = ref({
  signing: '',
  registering: '',
})
const redirectCountdown = ref(3)
const redirectCountdownInterval = ref(null)
const imageError = ref(false)

// Manual signing dialog state
const manualSignDialogVisible = ref(false)
const manualSignDialogMessage = ref('')
let manualSignDialogResolve = null
let manualSignDialogReject = null

// PON Fork support - use 88,000 blocks after fork (block 2,020,000 already happened)
const defaultExpireBlocks = 88000

const canStartSigning = computed(() => !signingProgress.value.signing && !signingProgress.value.registering)

const signingProgressPercent = computed(() => {
  if (signStepCompleted.value[1]) return 100
  if (signStepCompleted.value[0]) return 50
  if (signingProgress.value.signing) return 25
  
  return 0
})

const signingProgressText = computed(() => {
  if (signingProgress.value.signing) return t('components.marketplace.installDialog.signingApplicationMessage')
  if (signingProgress.value.registering) return t('components.marketplace.installDialog.registeringApplication')
  if (signStepCompleted.value[1]) return t('components.marketplace.installDialog.applicationReadyForPayment')

  return t('components.marketplace.installDialog.waitingToStart')
})

// Initialize authentication check
const checkAuthentication = () => {
  try {
    zelidauth.value = localStorage.getItem('zelidauth')

    // Check both variations due to inconsistency in the codebase
    const storedLoginType = localStorage.getItem('loginType') || localStorage.getItem('logintype')

    // Use loginType from localStorage (already lowercase)
    if (storedLoginType) {
      // Check if user is using any wallet-based auth (not SSO)
      // WalletConnect, ZelCore, MetaMask, and SSP all need signing step
      isWalletUser.value = storedLoginType !== 'sso'
    } else {
      // Legacy detection method
      isWalletUser.value = zelidauth.value && zelidauth.value.includes('zelid=')
    }

  } catch (error) {
    console.error('Authentication check failed:', error)
    isWalletUser.value = false
  }
}

// Helper function to detect WalletConnect provider
const isWalletConnectProvider = provider => {
  if (!provider) return false

  // WalletConnect v2 detection
  if (provider.isWalletConnect) return true

  // Check for WalletConnect bridge URL or connection method
  if (provider.bridge || provider.wc) return true

  // Check for WalletConnect specific methods
  if (provider.connector && provider.connector.bridge) return true

  // Check provider info - WalletConnect usually doesn't have isMetaMask flag
  if (provider.isConnected && !provider.isMetaMask && !provider.isFrame && provider.request) {
    return true
  }

  return false
}

// Auto-detect available wallets and current signing method
// Reactive trigger to force recalculation after login
const walletDetectionTrigger = ref(0)

const availableWallets = computed(() => {
  // Create dependency on trigger to force recalculation
  const trigger = walletDetectionTrigger.value

  const wallets = []
  const storedLoginType = (localStorage.getItem('loginType') || '').toLowerCase()
  console.log('[InstallDialog] Detecting wallets, loginType:', storedLoginType)

  // Check wallet availability based on logintype
  if (storedLoginType === 'ssp' && isSSPAvailable()) {
    wallets.push('SSP')
  }

  if (storedLoginType === 'metamask' && isBrowserMetaMaskAvailable()) {
    wallets.push('MetaMask')
  }

  if (storedLoginType === 'walletconnect') {
    // Trust loginType - don't check localStorage or initialize AppKit
    // AppKit will only initialize when user clicks sign button
    wallets.push('WalletConnect')
  }

  // ZelCore: check extension availability, otherwise assume app available
  if (storedLoginType === 'zelcore') {
    if (isZelcoreAvailable()) {
      wallets.push('ZelCore Extension')
    } else {
      wallets.push('ZelCore App')
    }
  }

  // Add SSO if loginType is SSO and user has auth
  if (storedLoginType === 'sso' && localStorage.getItem('zelidauth')) {
    wallets.push('SSO')
  }

  // Add Manual if loginType is manual and user has auth
  if (storedLoginType === 'manual' && localStorage.getItem('zelidauth')) {
    wallets.push('Manual')
  }

  return wallets
})

const detectedSigningMethod = computed(() => {
  // Create dependency on trigger to force recalculation
  const trigger = walletDetectionTrigger.value

  // Use stored loginType from localStorage
  const storedLoginType = localStorage.getItem('loginType')
  let detectedMethod = null

  console.log('[InstallDialog] Detecting signing method, loginType:', storedLoginType)

  // If we have a stored login type, use it and determine extension vs app
  if (storedLoginType) {
    const loginType = storedLoginType.toLowerCase()

    if (loginType === 'zelcore') {
      detectedMethod = isZelcoreAvailable() ? 'ZelCore Extension' : 'ZelCore App'
    } else if (loginType === 'ssp') {
      detectedMethod = 'SSP'
    } else if (loginType === 'metamask') {
      detectedMethod = 'MetaMask'
    } else if (loginType === 'walletconnect') {
      detectedMethod = 'WalletConnect'
    } else if (loginType === 'sso') {
      detectedMethod = 'SSO'
    } else if (loginType === 'manual') {
      detectedMethod = 'Manual'
    }
  }

  // Fallback: If no stored method, prefer SSO if user has auth and Firebase user exists
  if (!detectedMethod) {
    const hasAuth = localStorage.getItem('zelidauth')
    const firebaseUser = getUser()
    if (hasAuth && firebaseUser) {
      console.log('[InstallDialog] No loginType found, but Firebase user exists - using SSO')
      detectedMethod = 'SSO'
    }
  }

  // Last resort: first available wallet
  if (!detectedMethod) {
    detectedMethod = availableWallets.value[0] || null
  }

  console.log('[InstallDialog] Detected signing method:', detectedMethod)

  return detectedMethod
})

const currentSigningMethod = ref('')

// Update current signing method when detected method changes
watch(detectedSigningMethod, (newMethod, oldMethod) => {
  if (newMethod && newMethod !== oldMethod) {
    currentSigningMethod.value = newMethod

    // Only log significant changes, not initial setup
    if (oldMethod) {
    }
  }
}, { immediate: true })

// Check authentication when component mounts
onMounted(async () => {
  checkAuthentication()
  fetchDeploymentInfo()

  // No automatic polling or AppKit initialization on page load
  // AppKit will only initialize when user clicks sign button
  // This prevents stale relay errors from appearing on page load
  console.log('[InstallDialog] Lazy AppKit initialization enabled - will init only on sign button click')

  // Fetch live geolocation data for instance availability checking
  try {
    await fetchLiveGeolocationData()
  } catch (error) {
    console.error('Failed to load geolocation data:', error)

    // Clear all geolocation rules to ensure global deployment
    allowedGeolocations.value = []
    forbiddenGeolocations.value = []

    // Reset geolocation selectors to default state
    geolocation.value.allowedContinent = null
    geolocation.value.allowedCountry = null
    geolocation.value.forbiddenContinent = null
    geolocation.value.forbiddenCountry = null
    showSnackbar(t('components.marketplace.installDialog.messages.usingGlobalDeployment'), 'warning')
  }
})
const paymentMethod = ref('stripe') // Will be updated when authentication is determined
const creditCard = ref({
  number: '',
  expiry: '',
  cvv: '',
})

// Marketplace subscription duration options (from FluxCloud marketplace)
const subscriptionOptionsDiscounts = ref([0, 0, 0, 0]) // Store discounts separately

const subscriptionOptions = computed(() => [
  {
    months: 1,
    label: t('components.marketplace.installDialog.oneMonth'),
    discount: subscriptionOptionsDiscounts.value[0],
  },
  {
    months: 3,
    label: t('components.marketplace.installDialog.threeMonths'),
    discount: subscriptionOptionsDiscounts.value[1], // Will be fetched from app.discounts.threeMonths
  },
  {
    months: 6,
    label: t('components.marketplace.installDialog.sixMonths'),
    discount: subscriptionOptionsDiscounts.value[2], // Will be fetched from app.discounts.sixMonths
  },
  {
    months: 12,
    label: t('components.marketplace.installDialog.twelveMonths'),
    discount: subscriptionOptionsDiscounts.value[3], // Will be fetched from app.discounts.twelveMonths
  },
])

// Initialize subscription discounts from app data
const initializeDiscounts = () => {
  if (props.app.discounts) {
    // Use app-specific discounts if available
    subscriptionOptionsDiscounts.value[1] = props.app.discounts.threeMonths || 0
    subscriptionOptionsDiscounts.value[2] = props.app.discounts.sixMonths || 0
    subscriptionOptionsDiscounts.value[3] = props.app.discounts.twelveMonths || 0
  } else {
    // Fallback to typical marketplace discounts if app doesn't specify
    subscriptionOptionsDiscounts.value[1] = 5  // 3 months: 5% discount
    subscriptionOptionsDiscounts.value[2] = 10 // 6 months: 10% discount
    subscriptionOptionsDiscounts.value[3] = 20 // 12 months: 20% discount
  }
}

// Configuration
const config = ref({
  cpu: 1,
  ram: 512,
  storage: 1,
  instances: 3, // Minimum 3 instances as per FluxCloud requirements
  subscriptionMonths: 1,
  parameters: {},
})

// Show advanced parameters toggle
const showAdvanced = ref(false)

// Initialize config from selectedConfig if provided (for game configurations)
watch(() => props.selectedConfig, selectedConfig => {
  if (selectedConfig) {
    const resources = getConfigResources(selectedConfig)
    if (resources.cpu !== undefined && resources.cpu !== null) config.value.cpu = Number(resources.cpu)
    if (resources.ram !== undefined && resources.ram !== null) config.value.ram = Number(resources.ram)
    if (resources.hdd !== undefined && resources.hdd !== null) config.value.storage = Number(resources.hdd)
    if (selectedConfig.instances !== undefined && selectedConfig.instances !== null) config.value.instances = Number(selectedConfig.instances)

    console.log('📋 Setting config from selectedConfig:', {
      selectedConfig,
      resources,
      finalConfig: config.value,
    })
  }
}, { immediate: true })

// Geolocation configuration
const geolocation = ref({
  allowedContinent: null,
  allowedCountry: null,
  forbiddenContinent: null,
  forbiddenCountry: null,
})

// Arrays to store multiple geolocation rules
const allowedGeolocations = ref([])
const forbiddenGeolocations = ref([])

// Email notifications configuration
const emailNotifications = ref({
  email: '',
})

// Live geolocation data based on actual node availability
const availableContinents = ref([])
const availableLocations = ref([]) // Stores locations with instance counts

const availableCountries = ref([
  // North America
  { name: 'Canada', code: 'CA', continent: 'NA' },
  { name: 'United States', code: 'US', continent: 'NA' },
  { name: 'Mexico', code: 'MX', continent: 'NA' },
  { name: 'Guatemala', code: 'GT', continent: 'NA' },
  { name: 'Bahamas', code: 'BS', continent: 'NA' },
  { name: 'Cuba', code: 'CU', continent: 'NA' },
  { name: 'Jamaica', code: 'JM', continent: 'NA' },
  { name: 'Costa Rica', code: 'CR', continent: 'NA' },
  { name: 'Panama', code: 'PA', continent: 'NA' },

  // Europe
  { name: 'Germany', code: 'DE', continent: 'EU' },
  { name: 'France', code: 'FR', continent: 'EU' },
  { name: 'United Kingdom', code: 'GB', continent: 'EU' },
  { name: 'Netherlands', code: 'NL', continent: 'EU' },
  { name: 'Finland', code: 'FI', continent: 'EU' },
  { name: 'Lithuania', code: 'LT', continent: 'EU' },
  { name: 'Poland', code: 'PL', continent: 'EU' },
  { name: 'Portugal', code: 'PT', continent: 'EU' },
  { name: 'Russia', code: 'RU', continent: 'EU' },
  { name: 'Slovenia', code: 'SI', continent: 'EU' },
  { name: 'Spain', code: 'ES', continent: 'EU' },
  { name: 'Switzerland', code: 'CH', continent: 'EU' },
  { name: 'Austria', code: 'AT', continent: 'EU' },
  { name: 'Belgium', code: 'BE', continent: 'EU' },
  { name: 'Denmark', code: 'DK', continent: 'EU' },
  { name: 'Norway', code: 'NO', continent: 'EU' },
  { name: 'Sweden', code: 'SE', continent: 'EU' },
  { name: 'Italy', code: 'IT', continent: 'EU' },
  { name: 'Czech Republic', code: 'CZ', continent: 'EU' },
  { name: 'Hungary', code: 'HU', continent: 'EU' },
  { name: 'Romania', code: 'RO', continent: 'EU' },
  { name: 'Bulgaria', code: 'BG', continent: 'EU' },
  { name: 'Croatia', code: 'HR', continent: 'EU' },
  { name: 'Greece', code: 'GR', continent: 'EU' },
  { name: 'Ireland', code: 'IE', continent: 'EU' },
  { name: 'Estonia', code: 'EE', continent: 'EU' },
  { name: 'Latvia', code: 'LV', continent: 'EU' },
  { name: 'Slovakia', code: 'SK', continent: 'EU' },
  { name: 'Ukraine', code: 'UA', continent: 'EU' },

  // Asia
  { name: 'China', code: 'CN', continent: 'AS' },
  { name: 'Japan', code: 'JP', continent: 'AS' },
  { name: 'South Korea', code: 'KR', continent: 'AS' },
  { name: 'Singapore', code: 'SG', continent: 'AS' },
  { name: 'India', code: 'IN', continent: 'AS' },
  { name: 'Thailand', code: 'TH', continent: 'AS' },
  { name: 'Malaysia', code: 'MY', continent: 'AS' },
  { name: 'Indonesia', code: 'ID', continent: 'AS' },
  { name: 'Philippines', code: 'PH', continent: 'AS' },
  { name: 'Vietnam', code: 'VN', continent: 'AS' },
  { name: 'Hong Kong', code: 'HK', continent: 'AS' },
  { name: 'Taiwan', code: 'TW', continent: 'AS' },
  { name: 'Israel', code: 'IL', continent: 'AS' },
  { name: 'United Arab Emirates', code: 'AE', continent: 'AS' },
  { name: 'Saudi Arabia', code: 'SA', continent: 'AS' },
  { name: 'Turkey', code: 'TR', continent: 'AS' },

  // Oceania
  { name: 'Australia', code: 'AU', continent: 'OC' },
  { name: 'New Zealand', code: 'NZ', continent: 'OC' },
  { name: 'Fiji Islands', code: 'FJ', continent: 'OC' },
  { name: 'Papua New Guinea', code: 'PG', continent: 'OC' },
  { name: 'Marshall Islands', code: 'MH', continent: 'OC' },
  { name: 'Palau', code: 'PW', continent: 'OC' },
  { name: 'Tonga', code: 'TO', continent: 'OC' },
  { name: 'Samoa', code: 'WS', continent: 'OC' },
  { name: 'Vanuatu', code: 'VU', continent: 'OC' },

  // South America
  { name: 'Brazil', code: 'BR', continent: 'SA' },
  { name: 'Argentina', code: 'AR', continent: 'SA' },
  { name: 'Chile', code: 'CL', continent: 'SA' },
  { name: 'Colombia', code: 'CO', continent: 'SA' },
  { name: 'Peru', code: 'PE', continent: 'SA' },
  { name: 'Ecuador', code: 'EC', continent: 'SA' },
  { name: 'Uruguay', code: 'UY', continent: 'SA' },
  { name: 'Paraguay', code: 'PY', continent: 'SA' },
  { name: 'Venezuela', code: 'VE', continent: 'SA' },
  { name: 'Bolivia', code: 'BO', continent: 'SA' },
  { name: 'Guyana', code: 'GY', continent: 'SA' },
  { name: 'Suriname', code: 'SR', continent: 'SA' },

  // Africa
  { name: 'South Africa', code: 'ZA', continent: 'AF' },
  { name: 'Egypt', code: 'EG', continent: 'AF' },
  { name: 'Nigeria', code: 'NG', continent: 'AF' },
  { name: 'Morocco', code: 'MA', continent: 'AF' },
  { name: 'Kenya', code: 'KE', continent: 'AF' },
  { name: 'Ghana', code: 'GH', continent: 'AF' },
  { name: 'Ethiopia', code: 'ET', continent: 'AF' },
  { name: 'Algeria', code: 'DZ', continent: 'AF' },
  { name: 'Tunisia', code: 'TN', continent: 'AF' },
  { name: 'Libya', code: 'LY', continent: 'AF' },
  { name: 'Sudan', code: 'SD', continent: 'AF' },
  { name: 'Chad', code: 'TD', continent: 'AF' },
  { name: 'Mali', code: 'ML', continent: 'AF' },
  { name: 'Niger', code: 'NE', continent: 'AF' },
  { name: 'Burkina Faso', code: 'BF', continent: 'AF' },
  { name: 'Senegal', code: 'SN', continent: 'AF' },
  { name: 'Guinea', code: 'GN', continent: 'AF' },
  { name: 'Sierra Leone', code: 'SL', continent: 'AF' },
  { name: 'Liberia', code: 'LR', continent: 'AF' },
  { name: 'Ivory Coast', code: 'CI', continent: 'AF' },
  { name: 'Cameroon', code: 'CM', continent: 'AF' },
  { name: 'Central African Republic', code: 'CF', continent: 'AF' },
  { name: 'Democratic Republic of Congo', code: 'CD', continent: 'AF' },
  { name: 'Republic of Congo', code: 'CG', continent: 'AF' },
  { name: 'Gabon', code: 'GA', continent: 'AF' },
  { name: 'Equatorial Guinea', code: 'GQ', continent: 'AF' },
  { name: 'Angola', code: 'AO', continent: 'AF' },
  { name: 'Zambia', code: 'ZM', continent: 'AF' },
  { name: 'Zimbabwe', code: 'ZW', continent: 'AF' },
  { name: 'Botswana', code: 'BW', continent: 'AF' },
  { name: 'Namibia', code: 'NA', continent: 'AF' },
  { name: 'Lesotho', code: 'LS', continent: 'AF' },
  { name: 'Swaziland', code: 'SZ', continent: 'AF' },
  { name: 'Mozambique', code: 'MZ', continent: 'AF' },
  { name: 'Madagascar', code: 'MG', continent: 'AF' },
  { name: 'Mauritius', code: 'MU', continent: 'AF' },
  { name: 'Seychelles', code: 'SC', continent: 'AF' },

  // Antarctica
  { name: 'Antarctica', code: 'AQ', continent: 'AN' },
])

// Computed properties for country filtering based on live data
const allowedCountries = computed(() => {
  if (!geolocation.value.allowedContinent) return []

  const minInstances = config.value?.instances || 5
  const countriesWithInstances = []
  const continentCode = geolocation.value.allowedContinent

  // Group locations by country and calculate total instances per country
  const countryInstanceMap = new Map()

  availableLocations.value.forEach(location => {
    const parts = location.value.split('_')
    if (parts.length >= 2 && parts[0] === continentCode) {
      const countryCode = parts[1]

      if (!countryInstanceMap.has(countryCode)) {
        countryInstanceMap.set(countryCode, 0)
      }
      countryInstanceMap.set(countryCode, countryInstanceMap.get(countryCode) + location.instances)
    }
  })

  // Only include countries with sufficient instances
  countryInstanceMap.forEach((totalInstances, countryCode) => {
    if (totalInstances >= minInstances) {
      const countryName = getCountryName(countryCode)
      countriesWithInstances.push({
        name: countryName,
        code: countryCode,
        instances: totalInstances,
      })
    }
  })

  // Sort by instance count (highest first)
  return countriesWithInstances.sort((a, b) => b.instances - a.instances)
})

const forbiddenCountries = computed(() => {
  if (!geolocation.value.forbiddenContinent) return []

  const minInstances = config.value?.instances || 5
  const countriesWithInstances = []
  const continentCode = geolocation.value.forbiddenContinent

  // Group locations by country and calculate total instances per country
  const countryInstanceMap = new Map()

  availableLocations.value.forEach(location => {
    const parts = location.value.split('_')
    if (parts.length >= 2 && parts[0] === continentCode) {
      const countryCode = parts[1]

      if (!countryInstanceMap.has(countryCode)) {
        countryInstanceMap.set(countryCode, 0)
      }
      countryInstanceMap.set(countryCode, countryInstanceMap.get(countryCode) + location.instances)
    }
  })

  // Only include countries with sufficient instances
  countryInstanceMap.forEach((totalInstances, countryCode) => {
    if (totalInstances >= minInstances) {
      const countryName = getCountryName(countryCode)
      countriesWithInstances.push({
        name: countryName,
        code: countryCode,
        instances: totalInstances,
      })
    }
  })

  return countriesWithInstances.sort((a, b) => b.instances - a.instances)
})

// Email validation rules (optional with format validation)
const emailRules = computed(() => [
  v => !v || /.+@.+\..+/.test(v) || t('components.marketplace.installDialog.emailMustBeValid'),
])

// Locked values functionality - check if configuration values are locked by the app
const isValueLocked = valueName => {
  return props.app?.lockedValues?.includes(valueName) || false
}

// Computed properties for locked states
// Marketplace apps: lock hardware (CPU/RAM/HDD) but allow instances changes
const isInstancesLocked = computed(() => !!props.selectedConfig || isValueLocked('instances'))
const isCpuLocked = computed(() => true) // Always lock CPU for marketplace apps
const isRamLocked = computed(() => true) // Always lock RAM for marketplace apps
const isStorageLocked = computed(() => true) // Always lock storage for marketplace apps

// Initialize config values when app prop is available (only if no selectedConfig)
watch(() => props.app, newApp => {
  if (newApp && newApp.compose && newApp.compose.length > 0 && !props.selectedConfig) {
    config.value.cpu = newApp.compose[0].cpu || 1
    config.value.ram = newApp.compose[0].ram || 512
    config.value.storage = newApp.compose[0].hdd || 1
    config.value.instances = newApp.instances || 3

    // For WordPress, initialize subscription months from app
    if (isWordPress.value && newApp.subscriptionMonths) {
      config.value.subscriptionMonths = newApp.subscriptionMonths
    }
  }
}, { immediate: true })

// Check authentication type using flux store
const fluxStore = useFluxStore()
const { privilege } = storeToRefs(fluxStore)
const zelidauth = ref(null)
const isWalletUser = ref(false)

// Payment methods - 2 fiat + 2 crypto options for all users
const paymentMethods = computed(() => {
  return [
    {
      id: 'stripe',
      name: 'Stripe',
      description: t('components.marketplace.installDialog.payWithCreditCard'),
      image: stripeLogo,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: t('components.marketplace.installDialog.payWithPayPal'),
      image: paypalLogo,
    },
    {
      id: 'flux',
      name: 'ZelCore',
      description: t('components.marketplace.installDialog.payWithFlux'),
      image: fluxIDLogo,
    },
    {
      id: 'ssp',
      name: 'SSP',
      description: t('components.marketplace.installDialog.payWithFlux'),
      image: theme.global.name.value === 'dark' ? sspLogoWhite : sspLogoBlack,
    },
  ]
})

// Mock user balance (in real app, fetch from API)
const userFluxBalance = ref(1000)
const fluxToUsdRate = ref(0) // Real FLUX to USD rate from Flux Explorer API
const loadingRate = ref(false)
const loadingPricing = ref(false) // Loading state for pricing API

// API pricing response with fiat, flux, and discount info
const apiPricing = ref({
  usd: 0,
  flux: 0,
  fluxDiscount: 0,
})

// Fetch pricing from API with fiat, flux, and discount info (same as FluxCloud)
const fetchPricingFromAPI = async () => {
  loadingPricing.value = true
  try {
    // Get compose array - for games it's in detailedApp, for regular apps in props.app
    const composeArray = detailedApp.value.compose || props.app.compose || []

    if (!composeArray.length) {
      console.warn('No compose array found for pricing calculation')
      loadingPricing.value = false

      return
    }

    // For WordPress, use plan's USD price and calculate sum of all components for API call
    let monthlyPrice = 0
    let appSpecCompose = []

    if (isWordPress.value) {
      // WordPress: Use plan's fixed USD price, but sum all components for API
      monthlyPrice = props.app.price || 0 // Plan's monthly USD price

      // Sum all WordPress components (wp + mysql + operator) for API call
      const totalCpu = composeArray.reduce((sum, c) => sum + (c.cpu || 0), 0)
      const totalRam = composeArray.reduce((sum, c) => sum + (c.ram || 0), 0)
      const totalHdd = composeArray.reduce((sum, c) => sum + (c.hdd || 0), 0)

      appSpecCompose = [{
        name: 'wordpress',
        description: 'WordPress on Flux',
        repotag: 'runonflux/wp-nginx:latest',
        ports: [80],
        containerPorts: [80],
        domains: [''],
        environmentParameters: [''],
        commands: [''],
        containerData: '/tmp',
        cpu: totalCpu,
        ram: totalRam,
        hdd: totalHdd,
        tiered: false,
      }]
    } else {
      // Regular apps/games: Use API price from app spec
      monthlyPrice = props.app.price || 0
      appSpecCompose = [{
        ...composeArray[0],
        cpu: parseFloat(config.value.cpu),
        ram: parseInt(config.value.ram),
        hdd: parseInt(config.value.storage),
      }]
    }

    const totalPriceUSD = monthlyPrice * config.value.subscriptionMonths

    const appSpec = {
      version: 8,
      name: props.app.name || props.app.displayName,
      description: props.app.description || props.app.displayName || 'Marketplace App',
      owner: props.app.owner || 'marketplace',
      compose: appSpecCompose,
      instances: config.value.instances,
      expire: defaultExpireBlocks * config.value.subscriptionMonths,
      contacts: props.app.contacts || [],
      geolocation: isWordPress.value ? (props.app.geolocation || []) : (getGeolocationCodes() || []),
      nodes: props.app.nodes || [],
      staticip: typeof props.app.staticip === 'boolean' ? props.app.staticip : false,
      enterprise: props.app.enterprise || '',
    }

    const response = await AppsService.appPriceUSDandFlux(appSpec)

    if (response.data && response.data.status === 'success') {
      // Get the API's USD and FLUX prices (based on the resources sent)
      const apiCalculatedUsd = response.data.data.usd || 0
      const apiFlux = response.data.data.flux || 0

      // Calculate the ratio/multiplier from API (how much FLUX per 1 USD)
      const fluxPerUsd = apiCalculatedUsd > 0 ? (apiFlux / apiCalculatedUsd) : 0

      // Store the FLUX ratio for later use
      apiPricing.value = {
        usd: apiCalculatedUsd, // Store backend calculated price for reference
        flux: apiFlux, // Store backend calculated flux
        fluxDiscount: response.data.data.fluxDiscount || 0,
        fluxPerUsd: fluxPerUsd, // Store the ratio for calculating FLUX from USD
      }
    } else {
      console.error('API pricing request failed:', response.data)

      // Fallback for WordPress
      if (isWordPress.value) {
        apiPricing.value = {
          usd: props.app.price || 0,
          flux: props.app.fluxPrice || 0,
          fluxDiscount: props.app.fluxDiscount || 0,
        }
      }
    }
  } catch (error) {
    console.error('Error fetching API pricing:', error)
  } finally {
    loadingPricing.value = false
  }
}

// Fetch deployment info (payment address, etc.)
const fetchDeploymentInfo = async () => {
  try {
    const response = await AppsService.appsDeploymentInformation()
    if (response.data && response.data.status === 'success') {
      deploymentInfo.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching deployment info:', error)
  }
}

const estimatedFluxPrice = computed(() => {
  // Calculate FLUX using the ratio and the computed monthlyPrice (with instance multiplier)
  if (apiPricing.value.fluxPerUsd > 0) {
    const usdPrice = monthlyPrice.value || 0
    const fluxPrice = usdPrice * apiPricing.value.fluxPerUsd
    const months = config.value.subscriptionMonths || 1
    const totalFlux = fluxPrice * months

    return totalFlux.toFixed(2)
  }

  // Fallback: if API hasn't responded yet
  return '0.00'
})

// Total FLUX price for entire subscription period
const totalFluxPrice = computed(() => {
  // estimatedFluxPrice already returns the total
  return estimatedFluxPrice.value
})
const insufficientBalance = computed(() => {
  return userFluxBalance.value < parseFloat(estimatedFluxPrice.value)
})

// Get current subscription discount
const currentDiscount = computed(() => {
  const selectedOption = subscriptionOptions.value.find(option => option.months === config.value.subscriptionMonths)
  
  return selectedOption ? selectedOption.discount : 0
})

// Remove old infrastructureCost - now using marketplace pricing calculation

// FluxCloud marketplace pricing calculation (EXACT FluxCloud formula)
const calculateMarketplacePrice = computed(() => {
  // Check if we have the app data
  if (!props.app) {
    return 0
  }

  // Get app composition (first component defines base resources)
  const compose = props.app.compose || []
  if (compose.length === 0) {
    return 0
  }

  // Get base resources from first compose entry
  const baseCompose = compose[0]
  const appCores = baseCompose.cpu || 1
  const appRam = baseCompose.ram || 1000
  const appHdd = baseCompose.hdd || 10

  // Get current user-selected resources
  const currentCores = config.value.cpu || appCores
  const currentRam = config.value.ram || appRam
  const currentHdd = config.value.storage || appHdd
  const instances = config.value.instances || 3

  // If using default resources and 3 instances, return API price directly (price for 1 month)
  const usingDefaults = currentCores === appCores && currentRam === appRam && currentHdd === appHdd && instances === 3
  if (usingDefaults) {
    return props.app.price || 0
  }

  // Get base price (monthly price for default configuration)
  const basePrice = props.app.price || 10

  // Calculate base proportions (how much each resource contributes to price)
  const totalResourceUnits = appCores + (appRam / 1000) + (appHdd / 10)
  const baseCores = appCores / totalResourceUnits
  const baseRam = (appRam / 1000) / totalResourceUnits
  const baseHdd = (appHdd / 10) / totalResourceUnits

  // EXACT FluxCloud formula from app_price.dart
  // var newCoresPrice = app.baseCores * (cores / app.cores) * app.price;
  // var newRAMPrice = app.baseRam * (ramMB / app.ram) * app.price;
  // var newHDDPrice = app.baseHdd * (storageGB / app.hdd) * app.price;
  const newCoresPrice = baseCores * (currentCores / appCores) * basePrice
  const newRAMPrice = baseRam * (currentRam / appRam) * basePrice
  const newHDDPrice = baseHdd * (currentHdd / appHdd) * basePrice

  // var priceForXInstances = ((newCoresPrice + newRAMPrice + newHDDPrice) / 3) * instances;
  const priceForXInstances = ((newCoresPrice + newRAMPrice + newHDDPrice) / 3) * instances

  // Round up to nearest cent (FluxCloud: ((priceForXMonths * 100).ceil() / 100))
  const monthlyPrice = Math.ceil(priceForXInstances * 100) / 100

  return monthlyPrice
})

// Monthly price (USD - no discounts for fiat payments)
const monthlyPrice = computed(() => {
  // Games: use fixed config price
  if (props.selectedConfig && props.selectedConfig.price) {
    return props.selectedConfig.price
  }

  // WordPress: use fixed price (no instance multiplier)
  if (isWordPress.value) {
    return props.app.price || 0
  }

  // Marketplace apps only: config price is for default instances (3)
  // Calculate price per instance, then multiply by current instances
  const configPrice = props.app.price || 0
  const defaultInstances = 3
  const currentInstances = config.value.instances || 3
  const pricePerInstance = configPrice / defaultInstances
  const totalPrice = Number((pricePerInstance * currentInstances).toFixed(2))

  console.log('💰 Price calculation:', {
    configPrice,
    currentInstances,
    pricePerInstance,
    totalPrice
  })

  return totalPrice
})

// USD pricing - NO DISCOUNTS for fiat payments
const estimatedCost = computed(() => {
  const baseMonthlyPrice = monthlyPrice.value || 0
  if (isNaN(baseMonthlyPrice)) {
    console.warn('Monthly price is NaN:', monthlyPrice.value)
    
    return '0'
  }
  
  return baseMonthlyPrice.toFixed(2)
})

// Total USD cost for the entire subscription period
const totalCost = computed(() => {
  // Use computed monthlyPrice which includes instance multiplier
  const monthly = parseFloat(estimatedCost.value) || 0
  const months = config.value.subscriptionMonths || 1
  const total = monthly * months

  if (isNaN(total)) {
    return '$0.00'
  }

  // Ensure we always return a properly formatted price string
  const formattedTotal = total.toFixed(2)

  return `$${formattedTotal}`
})

// Payment information (FluxCloud-style)
const fluxDiscount = computed(() => {
  return apiPricing.value.fluxDiscount || 0
})

const deploymentInfo = ref(null)
const fluxPaymentAddress = computed(() => {
  return deploymentInfo.value?.address || 't1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
})
const paymentHash = ref('') // Will be generated after signing/registration

// Payment monitoring
const paymentMonitoringInterval = ref(null)
const paymentMonitoringTimeout = ref(null)
const paymentConfirmed = ref(false)
const paymentBridgeMaintenance = ref(false)
const popupBlockedDialog = ref(false)
const blockedPaymentUrl = ref('')
const blockedPaymentType = ref('')

const subscriptionEndDate = computed(() => {
  const now = new Date()
  const months = config.value.subscriptionMonths || 1
  const endDate = new Date(now.setMonth(now.getMonth() + months))

  // Format as numeric date and time: DD/MM/YYYY HH:MM
  const day = String(endDate.getDate()).padStart(2, '0')
  const month = String(endDate.getMonth() + 1).padStart(2, '0')
  const year = endDate.getFullYear()
  const hours = String(endDate.getHours()).padStart(2, '0')
  const minutes = String(endDate.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
})

const paymentDeadline = computed(() => {
  const now = new Date()
  const deadline = new Date(now.getTime() + 30 * 60000) // 30 minutes from now
  
  return deadline.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

// Copy to clipboard helper
const copyToClipboard = async (text, successMessage) => {
  try {
    await navigator.clipboard.writeText(text)
    showSnackbar(successMessage, 'success', 3000, 'mdi-content-copy')
  } catch (err) {
    console.error('Failed to copy:', err)
    showSnackbar(t('components.marketplace.installDialog.messages.failedToCopyToClipboard'), 'error')
  }
}

// Create a reactive copy of the app with detailed specifications
const detailedApp = ref({ ...props.app })

// Filter parameters to show only user-configurable ones (like FluxCloud)
const shouldShowParameter = (name, defaultValue) => {
  // Hide port parameters that have numeric defaults
  if (name.toLowerCase().includes('port') && /^\d+$/.test(defaultValue)) {
    return false
  }

  // Hide internal configuration parameters
  const hiddenParams = ['WORKDIR', 'EXPOSE', 'CMD', 'ENTRYPOINT']
  if (hiddenParams.includes(name.toUpperCase())) {
    return false
  }

  // Show parameters that need user input (empty default or non-port)
  return true
}

// Check if app is FluxCloud game (has configs with components structure)
const isFluxCloudGame = computed(() => {
  const configs = detailedApp.value.configs || props.app.configs
  
  return !!configs && configs.length > 0
})

// Extract environment parameters exactly like FluxCloud
const getEnvironmentParameters = () => {
  const params = []

  // For FluxCloud games, parameters come from compose section (not configs)
  // For regular apps, also check compose section
  if (detailedApp.value.compose) {
    for (const component of detailedApp.value.compose) {
      if (component.userEnvironmentParameters) {
        for (const param of component.userEnvironmentParameters) {
          const paramObj = {
            name: param.name,
            description: param.description || param.name,
            placeholder: param.placeholder || '',
            optional: param.optional || false,
            advanced: param.advanced || false,
            options: param.parameterConfig?.values || null,
            defaultValue: param.parameterConfig?.defaultValue || param.defaultValue || '',
            source: 'compose.userEnvironmentParameters',
          }
          params.push(paramObj)
        }
      }
    }
  }

  return params
}

// Fetch app details from marketplace API
const fetchAppDetails = async () => {
  try {

    // Import MarketplaceService
    const { default: MarketplaceService } = await import('@/services/MarketplaceService')

    // Use the app's UUID or name for marketplace API
    const appId = props.app.uuid || props.app.name

    const response = await MarketplaceService.getAppDetails(appId)

    if (response.data) {
      // Update the reactive app object with marketplace data
      detailedApp.value = { ...props.app, ...response.data }
    }
  } catch (error) {
    console.error('Error fetching marketplace app details:', error)

    // Fallback to original app data
    detailedApp.value = { ...props.app }
  }
}

// Initialize discounts on component mount
onMounted(() => {
  initializeDiscounts()

  // Add delay to ensure all reactive data is ready
  setTimeout(() => {
    fetchPricingFromAPI()
  }, 1000)
})

// Watch for configuration changes to update pricing
// Only refetch pricing when hardware changes, not subscription months (we calculate months client-side)
watch([() => config.value.instances, () => config.value.cpu, () => config.value.ram, () => config.value.storage], () => {
  fetchPricingFromAPI()
}, { deep: true })

// Refetch pricing when reaching payment step to ensure accuracy
watch(() => currentStep.value, (newStep, oldStep) => {
  // Auto-trigger signing for WordPress with SSO when landing on signing step
  if (isWordPress.value && newStep === 0 && detectedSigningMethod.value === 'SSO' && !signStepCompleted.value[0]) {
    // Automatically start signing process for SSO users
    signApplicationMessage()
  }

  // Regular apps: Auto-trigger signing for SSO when landing on signing step
  if (!isWordPress.value && newStep === 4 && detectedSigningMethod.value === 'SSO' && !signStepCompleted.value[0]) {
    // Automatically start signing process for SSO users
    signApplicationMessage()
  }

  // For WordPress: payment is step 1, for regular apps: payment is step 5 (for both SSO and wallet)
  const paymentStepIndex = isWordPress.value ? 1 : 5
  if (newStep === paymentStepIndex && oldStep !== paymentStepIndex) {
    fetchPricingFromAPI()
  }
})

const canProceed = computed(() => {
  // WordPress signing step (step 0)
  if (isWordPress.value && currentStep.value === 0) {
    // Signing step - block until both signing and registry are completed (for both SSO and wallet)
    // SSO will auto-trigger signing, wallet requires manual button click
    return signStepCompleted.value[0] && signStepCompleted.value[1]
  }

  // WordPress payment step (step 1)
  if (isWordPress.value && currentStep.value === 1) {
    // Must have valid pricing from API
    if (apiPricing.value.flux <= 0 || apiPricing.value.usd <= 0) return false

    // Must have payment method selected
    if (!paymentMethod.value) return false

    // Block until payment is confirmed
    return paymentConfirmed.value
  }

  // Regular app steps below
  if (currentStep.value === 0) {
    // Configuration step - basic validation + terms acceptance
    return config.value.cpu > 0 && config.value.ram > 0 && config.value.storage > 0 && config.value.instances > 0 && termsAccepted.value
  }
  if (currentStep.value === 1) {
    // Check required parameters
    const envParams = getEnvironmentParameters()

    return !envParams.some(param =>
      !param.optional && !config.value.parameters[param.name],
    )
  }
  if (currentStep.value === 2) {
    // Geolocation step - always allow proceeding (global deployment if nothing selected)
    return true
  }
  if (currentStep.value === 3) {
    // Email step - always allow proceeding (email is optional)
    return true
  }
  if (currentStep.value === 4) {
    // Signing step - block until both signing and registry are completed (for both SSO and wallet)
    // SSO will auto-trigger signing, wallet requires manual button click
    return signStepCompleted.value[0] && signStepCompleted.value[1]
  }
  if (currentStep.value === 5) {
    // Payment step (same for both SSO and wallet now)
    if (!paymentMethod.value) return false

    // Must have valid pricing from API
    if (apiPricing.value.flux <= 0 || apiPricing.value.usd <= 0) return false

    // Block next button until payment is confirmed
    return paymentConfirmed.value
  }
  
  return true
})

const canDeploy = computed(() => {
  return !deploying.value && canProceed.value
})

// Current step display info
const currentStepIcon = computed(() => {
  // Same step icons for both SSO and wallet users
  const stepIcons = ['mdi-tune-variant', 'mdi-code-tags', 'mdi-earth', 'mdi-email-alert', 'mdi-shield-key', 'mdi-credit-card-outline', 'mdi-rocket-launch-outline']

  return stepIcons[currentStep.value] || 'mdi-cog'
})

const currentStepTitle = computed(() => {
  // WordPress has only 3 steps
  if (isWordPress.value) {
    const wpStepTitles = ['Signing', 'Payment', 'Deploy']

    return wpStepTitles[currentStep.value] || 'Setup'
  }

  // Regular apps - both SSO and wallet have same steps, SSO auto-completes signing
  const stepTitles = ['Configuration', 'Parameters', 'Location', 'Alerts', 'Signing', 'Payment', 'Deploy']

  return stepTitles[currentStep.value] || 'Setup'
})

// Step items for progress bar
const stepItems = computed(() => {
  // WordPress has only 3 steps
  if (isWordPress.value) {
    return [
      { label: t('components.marketplace.installDialog.signing'), icon: 'mdi-shield-key' },
      { label: t('components.marketplace.installDialog.payment'), icon: 'mdi-credit-card-outline' },
      { label: t('components.marketplace.installDialog.deploy'), icon: 'mdi-rocket-launch-outline' },
    ]
  }

  // Regular apps - both SSO and wallet have same steps
  return [
    { label: t('components.marketplace.installDialog.config'), icon: 'mdi-tune-variant' },
    { label: t('components.marketplace.installDialog.params'), icon: 'mdi-code-tags' },
    { label: t('components.marketplace.installDialog.location'), icon: 'mdi-earth' },
    { label: t('components.marketplace.installDialog.alerts'), icon: 'mdi-email-alert' },
    { label: t('components.marketplace.installDialog.sign'), icon: 'mdi-shield-key' },
    { label: t('components.marketplace.installDialog.payment'), icon: 'mdi-credit-card-outline' },
    { label: t('components.marketplace.installDialog.deploy'), icon: 'mdi-rocket-launch-outline' },
  ]
})

// Methods
const nextStep = () => {
  // Clear any countdown intervals when manually advancing
  if (redirectCountdownInterval.value) {
    clearInterval(redirectCountdownInterval.value)
    redirectCountdownInterval.value = null
    redirectCountdown.value = 3
  }

  if (currentStep.value < totalSteps.value - 1) {
    let nextStepIndex = currentStep.value + 1

    // WordPress: Simple sequential navigation (0 → 1 → 2)
    if (isWordPress.value) {
      currentStep.value = nextStepIndex
      
      return
    }

    // Regular apps: Skip logic for certain steps
    // Skip environment parameters step if no parameters are needed
    if (nextStepIndex === 1 && getEnvironmentParameters().length === 0) {
      nextStepIndex = 2 // Skip to geolocation step
    }

    // No longer skip signing step for SSO - show the step with auto-signing

    currentStep.value = nextStepIndex
  } else {
  }
}

const closeDialog = () => {
  console.log('[InstallDialog] closeDialog() called, deploying:', deploying.value)
  if (!deploying.value) {
    console.log('[InstallDialog] Setting isOpen to false and resetting dialog')
    isOpen.value = false
    resetDialog()
  }
}

const closeLoginDialog = () => {
  closeLoginBottomSheet()

  // If user cancels login and is still not logged in, close the install dialog too
  if (!isLoggedIn.value) {
    isOpen.value = false
  }
}


const handleLoginSuccess = () => {
  // Close login dialog
  closeLoginBottomSheet()

  // Open install dialog after successful login
  isOpen.value = true

  // Force wallet detection to recalculate by incrementing trigger
  nextTick(() => {
    walletDetectionTrigger.value++
    checkAuthentication()
  })
}

// Handle going back to previous step
const handlePreviousStep = () => {
  // Clear any countdown intervals to prevent auto-advance
  if (redirectCountdownInterval.value) {
    clearInterval(redirectCountdownInterval.value)
    redirectCountdownInterval.value = null
    redirectCountdown.value = 3
  }

  // WordPress navigation (3 steps: 0=Signing, 1=Payment, 2=Deploy)
  if (isWordPress.value) {
    if (currentStep.value > 0) {
      // Reset signing/payment state when going backwards
      if (currentStep.value === 1) {
        // Going back from Payment to Signing - reset signing state
        signStepCompleted.value = [false, false]
        signingProgress.value = {
          signing: false,
          registering: false,
        }
        signingErrors.value = {
          signing: '',
          registering: '',
        }
        deploymentSignature.value = null
        deploymentTimestamp.value = null
        deploymentAppSpec.value = null
      } else if (currentStep.value === 2) {
        // Going back from Deploy to Payment - reset payment state
        paymentHash.value = ''
        paymentConfirmed.value = false
        paymentBridgeMaintenance.value = false
      }

      currentStep.value = currentStep.value - 1
    }
    
    return
  }

  // Regular app navigation
  const signingStepIndex = isWalletUser.value ? 4 : -1 // Signing is step 4 for wallet users, non-existent for SSO users

  // If going back FROM signing/payment/deployment step, reset signing state
  if (currentStep.value >= signingStepIndex) {

    // Reset all signing state
    signStepCompleted.value = [false, false]
    signingProgress.value = {
      signing: false,
      registering: false,
    }
    signingErrors.value = {
      signing: '',
      registering: '',
    }
    deploymentSignature.value = null
    deploymentTimestamp.value = null
    deploymentAppSpec.value = null
    paymentHash.value = ''
    redirectCountdown.value = 3
  }

  // Go to previous step with proper navigation logic
  if (currentStep.value > 0) {
    let prevStepIndex = currentStep.value - 1

    // Skip environment parameters step if no parameters are needed (going backwards)
    if (prevStepIndex === 1 && getEnvironmentParameters().length === 0) {
      prevStepIndex = 0 // Skip back to config step
    }

    // For non-wallet users (SSO), skip the signing step when going backwards (step 4)
    if (!isWalletUser.value && currentStep.value === 5 && prevStepIndex === 4) {
      prevStepIndex = 3 // Skip back to email alerts step
    }

    currentStep.value = prevStepIndex
  }
}

// Reset only the signing state when wallet doesn't respond
const resetSigningState = () => {
  // Cancel any pending wallet operations
  signingCancelled = true

  if (zelcoreSigningInProgress) {
    zelcoreSigningInProgress = false
  }

  if (sspSigningInProgress) {
    sspSigningInProgress = false
  }

  if (metamaskSigningInProgress) {
    metamaskSigningInProgress = false
  }

  if (walletConnectSigningInProgress) {
    walletConnectSigningInProgress = false
  }

  // Reset signing progress
  signingProgress.value = {
    signing: false,
    registering: false,
  }

  // Reset signing completion status
  signStepCompleted.value = [false, false]

  // Clear any signing errors
  signingErrors.value = {
    signing: '',
    registering: '',
  }

  // Reset legacy signing state for compatibility
  signing.value = false
  signatureCompleted.value = false
  signatureError.value = ''

  // Clear any pending timeouts or intervals
  if (deploymentTimestamp.value) {
    deploymentTimestamp.value = null
  }
  if (deploymentAppSpec.value) {
    deploymentAppSpec.value = null
  }

  // Cancel payment monitoring
  if (paymentMonitoringInterval.value) {
    clearInterval(paymentMonitoringInterval.value)
    paymentMonitoringInterval.value = null
  }
  if (paymentMonitoringTimeout.value) {
    clearTimeout(paymentMonitoringTimeout.value)
    paymentMonitoringTimeout.value = null
  }

  // Reset payment state
  paymentProcessing.value = false
  paymentConfirmed.value = false
  paymentBridgeMaintenance.value = false
}

// FluxOS-compatible signing methods using existing signing infrastructure
const signApplicationMessage = async () => {
  // Reset cancellation flag for new signing attempt
  signingCancelled = false
  signingProgress.value.signing = true
  signingErrors.value.signing = ''

  try {
    // Generate deployment message (would be actual app deployment data)
    const deploymentMessage = await generateDeploymentMessage()

    // Use the auto-detected signing method
    const signingMethod = detectedSigningMethod.value
    currentSigningMethod.value = signingMethod


    // Execute the appropriate signing method
    switch (signingMethod) {
    case 'Zelcore':
    case 'ZelCore Extension':
    case 'ZelCore App':
      await signWithZelCore(deploymentMessage)
      break
    case 'SSP':
      await signWithSSP(deploymentMessage)
      break
    case 'MetaMask':
      await signWithMetaMask(deploymentMessage)
      break
    case 'WalletConnect':
      await signWithWalletConnect(deploymentMessage)
      break
    case 'SSO':
      await signWithSSO(deploymentMessage)
      break
    case 'Manual':
      await signWithManual(deploymentMessage)
      break
    default:
      console.error('[InstallDialog] Unknown signing method:', signingMethod)
      console.error('[InstallDialog] loginType from localStorage:', localStorage.getItem('loginType'))
      throw new Error(`No compatible signing method found: "${signingMethod}". ${t('components.marketplace.installDialog.noCompatibleWallets')}`)
    }

    // Check if signing was cancelled during the process
    if (signingCancelled) {
      signingProgress.value.signing = false
      
      return
    }

    // Mark signing step as completed
    signStepCompleted.value[0] = true

    // Don't set signing to false yet - keep progress indicator during delay
    // Wait for smooth animation before starting registration
    setTimeout(async () => {
      if (signStepCompleted.value[0] && !signStepCompleted.value[1]) {
        // Start registration first (sets registering = true)
        await registerApplication()
      }

      // Now we can set signing to false after registration has started
      signingProgress.value.signing = false
    }, 3000)

  } catch (error) {
    const errorMessage = 'Failed to sign message: ' + error.message
    signingErrors.value.signing = errorMessage
    signingProgress.value.signing = false
    showSnackbar(errorMessage, 'error', 6000)
  }
}

// Store timestamp and app spec for WebSocket connection and registration
const deploymentTimestamp = ref(null)
const deploymentAppSpec = ref(null)

// Watch for configuration changes and reset signature
watch([() => config.value.cpu, () => config.value.ram, () => config.value.storage, () => config.value.instances, () => config.value.subscriptionMonths, () => config.value.parameters], () => {
  // Skip for WordPress - config is fixed by plan and shouldn't trigger reset
  if (isWordPress.value) {
    return
  }

  // If configuration changes after signing OR during signing, reset the signature
  const isSigningInProgress = signingProgress.value.signing || signingProgress.value.registering
  const hasSigningCompleted = signStepCompleted.value[0] || signStepCompleted.value[1]

  if (hasSigningCompleted || isSigningInProgress) {

    // Reset all signing state
    signStepCompleted.value = [false, false]
    signingProgress.value = {
      signing: false,
      registering: false,
    }
    signingErrors.value = {
      signing: '',
      registering: '',
    }
    deploymentSignature.value = null
    deploymentTimestamp.value = null
    deploymentAppSpec.value = null
    paymentHash.value = ''
    redirectCountdown.value = 3

    // If user was on signing step or later, keep them on signing step to re-sign
    if (currentStep.value >= (isWalletUser.value ? 2 : 1)) {
      currentStep.value = isWalletUser.value ? 2 : 1
    }
  }
}, { deep: true })

// Email upload to Flux Storage (matching FluxCloud implementation)
const uploadEmailToStorage = async () => {
  const email = emailNotifications.value.email

  if (!email || !email.trim()) {
    return []
  }

  if (!validateEmail()) {
    throw new Error('Invalid email address format')
  }

  try {

    // Generate unique contacts ID (matching FluxCloud's approach)
    const contactsId = StorageService.generateContactsId()

    // Prepare contacts data for upload
    const contactsData = {
      contactsid: contactsId,
      contacts: [email],
    }

    // Upload to Flux Storage API
    await StorageService.uploadContacts(contactsData)

    // Create storage reference (matching FluxCloud format)
    const storageReference = StorageService.getContactsStorageReference(contactsId)


    // Return contacts array with storage reference
    return [storageReference]

  } catch (error) {
    console.error('Failed to upload email to Flux Storage:', error)
    throw new Error(`Uploading contacts to Flux Storage failed: ${error.message}`)
  }
}

const generateDeploymentMessage = async () => {
  // Validate instance availability before generating deployment message
  const availabilityCheck = validateInstanceAvailability()
  if (!availabilityCheck.valid) {
    throw new Error(`⚠️ Instance Availability Error: ${availabilityCheck.message}`)
  }


  // Upload email/contacts to Flux Storage and get contacts reference
  let contacts = []

  // For WordPress, upload contacts from props.app.contacts
  if (isWordPress.value && props.app.contacts && props.app.contacts.length > 0) {
    try {
      const contactsId = StorageService.generateContactsId()
      const contactsData = {
        contactsid: contactsId,
        contacts: props.app.contacts,
      }
      await StorageService.uploadContacts(contactsData)
      const storageReference = StorageService.getContactsStorageReference(contactsId)
      contacts = [storageReference]
      console.log('✅ WordPress contacts uploaded to storage:', storageReference)
    } catch (error) {
      console.error('❌ Failed to upload WordPress contacts to Flux Storage:', error)
      throw new Error(`Uploading WordPress contacts to Flux Storage failed: ${error.message}`)
    }
  } else {
    // For regular apps, use email from email notifications step
    contacts = await uploadEmailToStorage()
  }

  // Generate FluxCloud-compatible deployment message
  const timestamp = Date.now()
  deploymentTimestamp.value = timestamp // Store for WebSocket
  const appName = `${props.app.name}${timestamp}`

  // Get owner from zelidauth
  let owner = ''
  try {
    const zelidauth = localStorage.getItem('zelidauth')
    if (zelidauth) {
      const authData = zelidauth.includes('zelid=')
        ? Object.fromEntries(new URLSearchParams(zelidauth))
        : JSON.parse(zelidauth)
      owner = authData.zelid || authData.ZelID || ''
    }
  } catch (e) {
    console.warn('Could not parse zelidauth for owner:', e)
  }

  // Validate owner is not empty
  if (!owner) {
    throw new Error('Owner (zelid) is required for deployment. Please ensure you are logged in.')
  }

  // Build app specification matching FluxCloud approach
  // For WordPress, use props.app.compose directly (not detailedApp) to preserve whitelist IPs
  const baseComponents = isWordPress.value ? (props.app.compose || []) : (detailedApp.value.compose || props.app.compose || [])

  // For WordPress, update ENV variables to use the final app name with timestamp
  if (isWordPress.value) {
    const finalAppName = appName
    for (const component of baseComponents) {
      if (component.environmentParameters) {
        component.environmentParameters = component.environmentParameters.map(env => {
          return env
            .replace(/fluxoperator_wordpress(?![\d])/g, `fluxoperator_${finalAppName}`)
            .replace(/fluxmysql_wordpress(?![\d])/g, `fluxmysql_${finalAppName}`)
            .replace(/CLIENT_APPNAME=wordpress(?![\d])/g, `CLIENT_APPNAME=${finalAppName}`)
            .replace(/DB_APPNAME=wordpress(?![\d])/g, `DB_APPNAME=${finalAppName}`)
        })
      }
    }
  }

  // Upload environment variables to Flux Storage for WordPress (matching FluxCloud)
  if (isWordPress.value && props.app.uploadEnvToStorage) {
    for (const component of baseComponents) {
      if (component.environmentParameters && component.environmentParameters.length > 0) {
        const envId = StorageService.generateEnvId()
        const envData = {
          envid: envId,
          env: component.environmentParameters,
        }

        try {
          await StorageService.uploadEnv(envData)

          // Replace environment parameters with storage reference (matching FluxCloud)
          component.environmentParameters = [StorageService.getEnvStorageReference(envId)]
          console.log(`✅ Uploaded env for component ${component.name}, reference: ${component.environmentParameters[0]}`)
        } catch (error) {
          console.error(`❌ Failed to upload env for component ${component.name}:`, error)
          throw new Error(`Failed to upload environment variables for ${component.name}`)
        }
      }
    }
  }

  // Calculate hardware multipliers (like FluxCloud does)
  // For WordPress, don't apply multipliers - use resources exactly as specified in the plan
  const appCPU = baseComponents.reduce((sum, c) => sum + (c.cpu || 0), 0)
  const appRAM = baseComponents.reduce((sum, c) => sum + (c.ram || 0), 0)
  const appSSD = baseComponents.reduce((sum, c) => sum + (c.hdd || 0), 0)

  const coresMultiplier = isWordPress.value ? 1.0 : (appCPU > 0 ? config.value.cpu / appCPU : 1.0)
  const ramMultiplier = isWordPress.value ? 1.0 : (appRAM > 0 ? config.value.ram / appRAM : 1.0)
  const ssdMultiplier = isWordPress.value ? 1.0 : (appSSD > 0 ? config.value.storage / appSSD : 1.0)

  const globalAppSpec = {
    version: 8,
    name: appName,
    description: detailedApp.value.description || props.app.description || detailedApp.value.displayName || props.app.displayName,
    owner: owner,
    compose: baseComponents.map(component => {
      // Build environmentParameters like FluxCloud
      // Note: API returns 'environmentParameters' but FluxOS expects 'enviromentParameters' (typo)
      const environmentParameters = [
        ...(component.environmentParameters || component.enviromentParameters || []),
      ]

      // Add user-configured parameters
      for (const [key, value] of Object.entries(config.value.parameters)) {
        if (value) {
          environmentParameters.push(`${key}=${value}`)
        }
      }

      // Create new component with scaled hardware
      const scaledCPU = parseFloat((component.cpu * coresMultiplier).toFixed(1))
      const scaledRAM = Math.round(component.ram * ramMultiplier)
      const scaledHDD = Math.round(component.hdd * ssdMultiplier)

      // Auto-generate ports from portSpecs if available (matches FluxCloud deployment_mixin.dart:99-119)
      let componentPorts = component.ports || []
      if (component.portSpecs && component.portSpecs.length > 0) {
        const generatedPorts = []
        for (const portSpec of component.portSpecs) {
          const parts = portSpec.split('-')
          const minPort = parseInt(parts[0])
          const maxPort = parseInt(parts[1])

          if (!isNaN(minPort) && !isNaN(maxPort)) {
            // Generate random port within range
            const randomPort = Math.floor(Math.random() * (maxPort - minPort + 1) + minPort)
            generatedPorts.push(randomPort)
          }
        }

        // Use generated ports if we successfully generated them
        if (generatedPorts.length > 0) {
          componentPorts = generatedPorts
        }
      }

      // Match exact structure from FluxCloud AppComponent (lines 150-176)
      const appComponent = {
        name: component.name,
        description: component.description,
        repotag: component.repotag,
        ports: componentPorts,
        domains: component.domains.map(d => d.replace(/"/g, '"')),
        environmentParameters: environmentParameters, // Version 4+ uses correct spelling
        commands: component.commands.map(c => c.replace(/"/g, '"')),
        containerPorts: component.containerPorts,
        containerData: component.containerData,
        tiered: component.tiered,
        cpu: scaledCPU,
        ram: scaledRAM,
        hdd: scaledHDD,
        secrets: component.secrets ?? '',
        repoauth: '',
        envFluxStorage: component.envFluxStorage,
      }

      // Only add tiered fields if tiered is true
      if (component.tiered) {
        appComponent.cpubasic = scaledCPU
        appComponent.cpusuper = scaledCPU
        appComponent.cpubamf = scaledCPU
        appComponent.rambasic = scaledRAM
        appComponent.ramsuper = scaledRAM
        appComponent.rambamf = scaledRAM
        appComponent.hddbasic = scaledHDD
        appComponent.hddsuper = scaledHDD
        appComponent.hddbamf = scaledHDD
      }

      return appComponent
    }),
    instances: config.value.instances,
    contacts: contacts, // Already contains storage reference for both WordPress and regular apps
    geolocation: isWordPress.value ? (props.app.geolocation || []) : getGeolocationCodes(),
    expire: defaultExpireBlocks * config.value.subscriptionMonths,
    nodes: props.app.nodes || [],
    staticip: props.app.staticip || false,
    enterprise: '', // v8 enterprise support - will be populated if isAutoEnterprise is true
  }

  // Upload environmentParameters to Flux Storage for components with envFluxStorage flag (matches FluxCloud deployment_mixin.dart:198-213)
  // This handles games and regular apps. WordPress uses app-level uploadEnvToStorage flag above.
  for (const component of globalAppSpec.compose) {
    if (component.envFluxStorage && component.environmentParameters && component.environmentParameters.length > 0) {
      // Check if already uploaded (e.g., by WordPress uploadEnvToStorage logic)
      const alreadyUploaded = component.environmentParameters.some(param => param.startsWith('F_S_ENV='))

      if (!alreadyUploaded) {
        try {
          const envid = StorageService.generateContactsId() // Use same generator as FluxCloud
          await StorageService.uploadEnv({
            envid,
            env: component.environmentParameters,
          })

          // Replace environmentParameters with storage reference
          component.environmentParameters = [StorageService.getEnvStorageReference(envid)]
          console.log(`✅ Uploaded env for component ${component.name}, reference: ${component.environmentParameters[0]}`)
        } catch (error) {
          console.error('Flux Storage upload failed:', error)
          throw new Error(`Failed to upload environment parameters to Flux Storage: ${error.message}`)
        }
      }
    }
  }

  // Handle v8 enterprise encryption if isAutoEnterprise is enabled
  if (globalAppSpec.version >= 8 && props.app.isAutoEnterprise) {
    try {
      // Check if WebCrypto is available
      if (!isWebCryptoAvailable()) {
        throw new Error('WebCrypto not available for enterprise encryption')
      }

      // Get owner's public key for encryption
      const zelidauth = localStorage.getItem('zelidauth')
      const pubKeyResponse = await AppsService.getAppPublicKey(zelidauth, {
        name: globalAppSpec.name,
        owner: globalAppSpec.owner,
      })

      if (pubKeyResponse.data.status !== 'success') {
        throw new Error('Failed to get public key for enterprise encryption')
      }

      const pubKeyB64 = pubKeyResponse.data.data.trim().replace(/\s+/g, '')
      const rsaPubKey = await importRsaPublicKey(pubKeyB64)
      const aesKey = crypto.getRandomValues(new Uint8Array(32))
      const encryptedEnterpriseKey = await encryptAesKeyWithRsaKey(aesKey, rsaPubKey)

      // Prepare enterprise data for encryption (contacts and compose)
      const enterpriseSpecs = {
        contacts: globalAppSpec.contacts,
        compose: globalAppSpec.compose,
      }

      // Encrypt the enterprise data
      const encryptedEnterprise = await encryptEnterpriseWithAes(
        JSON.stringify(enterpriseSpecs),
        aesKey,
        encryptedEnterpriseKey,
      )

      // Update the spec with encrypted data
      globalAppSpec.enterprise = encryptedEnterprise
      globalAppSpec.contacts = []
      globalAppSpec.compose = []

    } catch (error) {
      console.error('Enterprise encryption failed:', error)
      throw new Error(`Enterprise encryption failed: ${error.message}`)
    }
  }

  // Verify app specification with FluxOS backend to get the correct format
  const verifiedAppSpec = await AppsService.appRegistrationVerificaiton(globalAppSpec)

  // Check if verification was successful
  if (verifiedAppSpec.data.status === 'error') {
    console.error('Verification failed:', verifiedAppSpec.data)

    const errorMessage = verifiedAppSpec.data.data?.message || verifiedAppSpec.data.data || 'App specification verification failed'

    // Check for geolocation-specific errors
    if (errorMessage.toLowerCase().includes('geolocation') ||
        errorMessage.toLowerCase().includes('instance') ||
        errorMessage.toLowerCase().includes('available') ||
        errorMessage.toLowerCase().includes('node')) {
      throw new Error(`⚠️ Instance Availability Issue: ${errorMessage}`)
    }

    throw new Error(errorMessage)
  }

  // Store the verified app spec as a plain object (not Proxy) for later use in registration
  // Use JSON.parse(JSON.stringify()) to create a non-reactive copy
  deploymentAppSpec.value = JSON.parse(JSON.stringify(verifiedAppSpec.data.data || globalAppSpec))


  // FluxOS message format: registrationType + version + appSpec + timestamp
  const registrationType = 'fluxappregister'
  const version = '1'
  const appSpecJson = JSON.stringify(deploymentAppSpec.value)
  const message = `${registrationType}${version}${appSpecJson}${timestamp}`


  return message
}

const signWithSSP = async message => {
  if (sspSigningInProgress) {
    return Promise.reject(new Error('SSP signing already in progress'))
  }

  try {
    sspSigningInProgress = true
    const result = await walletServiceSignWithSSP(message)

    deploymentSignature.value = {
      signature: result.signature,
      address: result.address,
      method: 'SSP',
    }
    sspSigningInProgress = false
  } catch (error) {
    sspSigningInProgress = false
    throw new Error('SSP signing failed: ' + error.message)
  }
}

// Global signing state flags for cancellation support
let zelcoreSigningInProgress = false
let sspSigningInProgress = false
let metamaskSigningInProgress = false
let walletConnectSigningInProgress = false
let signingCancelled = false

const signWithZelCore = async message => {
  if (zelcoreSigningInProgress) {
    return Promise.reject(new Error('ZelCore signing already in progress'))
  }

  return new Promise(async (resolve, reject) => {
    try {
      zelcoreSigningInProgress = true

      // Get the user's ZelID from localStorage for the address
      const zelidauth = localStorage.getItem('zelidauth')
      if (!zelidauth) {
        zelcoreSigningInProgress = false
        reject(new Error('ZelCore user not logged in'))

        return
      }

      let zelid
      try {
        const authData = zelidauth.includes('zelid=')
          ? Object.fromEntries(new URLSearchParams(zelidauth))
          : JSON.parse(zelidauth)
        zelid = authData.zelid
        if (!zelid) {
          zelcoreSigningInProgress = false
          reject(new Error('ZelID not found in authentication data'))

          return
        }
      } catch (e) {
        zelcoreSigningInProgress = false
        reject(new Error('Could not parse zelidauth data'))

        return
      }

      // Check if we need custom WebSocket callback for desktop app
      const hasExtension = window.zelcore && typeof window.zelcore.sign === 'function'
      const hasProtocol = window.zelcore && typeof window.zelcore.protocol === 'function'
      const isExternalApp = !window.zelcore

      // If extension, use shared function directly
      if (hasExtension) {
        try {
          const result = await walletServiceSignWithZelcore(message, zelid)
          deploymentSignature.value = {
            signature: result.signature,
            address: result.address,
            method: 'ZelCore Extension',
          }
          zelcoreSigningInProgress = false
          resolve()
        } catch (error) {
          zelcoreSigningInProgress = false
          reject(error)
        }

        return
      }

      // For desktop app, need custom WebSocket with query-string parsing
      if (hasProtocol || isExternalApp) {
        const backendURL = getDetectedBackendURL()
        const timestamp = deploymentTimestamp.value
        if (!timestamp) {
          zelcoreSigningInProgress = false
          reject(new Error('Message timestamp not available'))

          return
        }

        const wsBackendURL = backendURL.replace('https://', 'wss://').replace('http://', 'ws://')
        const sigMessage = `${zelid}${timestamp}`
        const wsUri = `${wsBackendURL}/ws/sign/${sigMessage}`

        try {
          const ws = new WebSocket(wsUri)

          const timeoutId = setTimeout(() => {
            ws.close()
            zelcoreSigningInProgress = false
            reject(new Error('ZelCore signing timeout'))
          }, 60000)

          ws.onmessage = event => {
            try {
              const parsed = qs.parse(event.data)
              if (parsed.status === 'success' && parsed['data[signature]']) {
                clearTimeout(timeoutId)
                ws.close()
                zelcoreSigningInProgress = false
                deploymentSignature.value = {
                  signature: parsed['data[signature]'],
                  address: zelid,
                  method: 'ZelCore App',
                }
                resolve()
              } else {
                clearTimeout(timeoutId)
                ws.close()
                zelcoreSigningInProgress = false
                reject(new Error('ZelCore signing failed: ' + (parsed.message || 'No signature in response')))
              }
            } catch (error) {
              clearTimeout(timeoutId)
              ws.close()
              zelcoreSigningInProgress = false
              reject(new Error('Failed to parse ZelCore response: ' + error.message))
            }
          }

          ws.onerror = error => {
            clearTimeout(timeoutId)
            zelcoreSigningInProgress = false
            reject(new Error('WebSocket connection failed'))
          }
        } catch (error) {
          zelcoreSigningInProgress = false
          reject(new Error('Failed to establish WebSocket connection: ' + error.message))

          return
        }

        // Use shared function to trigger protocol (with skipWebSocket flag so caller handles WebSocket)
        const callbackURL = `${backendURL}/id/providesign`
        try {
          await walletServiceSignWithZelcore(message, zelid, callbackURL, undefined, true) // skipWebSocket = true
          // Don't resolve here - custom WebSocket above handles that
        } catch (error) {
          zelcoreSigningInProgress = false
          reject(error)
        }

        return
      }

      // ZelCore not available, but user was logged in via ZelCore
      // Use existing authentication credentials for signing
      // Use the existing signature from login for deployment
      const authData = zelidauth.includes('zelid=')
        ? Object.fromEntries(new URLSearchParams(zelidauth))
        : JSON.parse(zelidauth)

      deploymentSignature.value = {
        signature: authData.signature,
        address: zelid,
        method: 'ZelCore (Existing Auth)',
        loginPhrase: authData.loginPhrase,
      }

      zelcoreSigningInProgress = false
      resolve()
    } catch (error) {
      console.error('ZelCore signing error:', error)
      zelcoreSigningInProgress = false
      reject(error)
    }
  })
}

const signWithMetaMask = async message => {
  if (!window.ethereum || !window.ethereum.isMetaMask) {
    throw new Error('MetaMask not installed')
  }

  if (metamaskSigningInProgress) {
    return Promise.reject(new Error('MetaMask signing already in progress'))
  }

  try {
    metamaskSigningInProgress = true

    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = accounts[0]

    // Sign the message
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, account],
    })

    deploymentSignature.value = {
      signature: signature,
      address: account,
      method: 'MetaMask',
    }
    metamaskSigningInProgress = false
  } catch (error) {
    metamaskSigningInProgress = false
    throw new Error('MetaMask signing failed: ' + error.message)
  }
}

const signWithWalletConnect = async message => {
  console.log('[InstallDialog] Starting WalletConnect signing...')

  if (walletConnectSigningInProgress) {
    console.warn('[InstallDialog] WalletConnect signing already in progress')
    
    return Promise.reject(new Error('WalletConnect signing already in progress'))
  }

  try {
    walletConnectSigningInProgress = true
    console.log('[InstallDialog] Calling walletService sign function...')

    // Use the walletService signing function which handles Reown AppKit
    const signature = await walletServiceSignWithWalletConnect(message)
    console.log('[InstallDialog] Sign function returned, signature:', signature?.substring(0, 20) + '...')

    const connectedAccount = getConnectedAccount()
    console.log('[InstallDialog] Connected account:', connectedAccount)

    if (!connectedAccount?.address) {
      throw new Error('No connected account found')
    }

    console.log('[InstallDialog] ✅ Setting deploymentSignature with:', {
      signatureLength: signature.length,
      address: connectedAccount.address.toLowerCase(),
      method: 'WalletConnect',
    })

    deploymentSignature.value = {
      signature: signature,
      address: connectedAccount.address.toLowerCase(), // Backend expects lowercase
      method: 'WalletConnect',
    }

    console.log('[InstallDialog] ✅ deploymentSignature set:', deploymentSignature.value)
    walletConnectSigningInProgress = false
    console.log('[InstallDialog] ✅ WalletConnect signing complete')
  } catch (error) {
    console.error('[InstallDialog] WalletConnect signing failed:', error)
    walletConnectSigningInProgress = false
    throw new Error('WalletConnect signing failed: ' + error.message)
  }
}

const signWithSSO = async message => {
  try {

    // Check if user is logged in with Firebase
    const firebaseUser = getUser()
    if (!firebaseUser) {
      throw new Error('SSO authentication required. Please log in with Google or Apple.')
    }

    // Get Firebase ID token (not accessToken)
    const token = await firebaseUser.getIdToken()
    if (!token) {
      throw new Error('Unable to get Firebase authentication token')
    }

    console.log('✅ Firebase token obtained for SSO signing')


    // Call FluxCore signing service (same service as login but for app spec)
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }

    const result = await axios.post(
      'https://service.fluxcore.ai/api/signMessage',
      { message },
      { headers },
    )

    if (result.data?.status !== 'success' || !result.data.signature) {
      throw new Error(result.data?.message || 'Failed to sign application message')
    }

    console.log('✅ SSO signature obtained')

    // Get zelid from zelidauth
    const zelidauth = localStorage.getItem('zelidauth')
    const authData = qs.parse(zelidauth)

    deploymentSignature.value = {
      signature: result.data.signature,
      address: authData.zelid || result.data.public_address,
      method: 'SSO',
    }

  } catch (error) {
    console.error('SSO Signing failed:', error)
    throw new Error('SSO signing failed: ' + (error.response?.data?.message || error.message))
  }
}

const signWithManual = async message => {
  return new Promise((resolve, reject) => {
    try {
      const zelidauth = localStorage.getItem('zelidauth')
      if (!zelidauth) {
        reject(new Error('No login credentials found'))
        
        return
      }

      // Parse zelidauth to get zelid
      const authData = zelidauth.includes('zelid=')
        ? Object.fromEntries(new URLSearchParams(zelidauth))
        : JSON.parse(zelidauth)

      const zelid = authData.zelid

      // Message to sign = message ONLY (no loginPhrase for app signing)
      // loginPhrase is only used for login verification, not app deployment signing
      manualSignDialogMessage.value = message
      manualSignDialogVisible.value = true

      // Set up handlers for dialog
      manualSignDialogResolve = signature => {
        deploymentSignature.value = {
          signature,
          address: zelid,
          method: 'Manual',
        }
        resolve()
      }

      manualSignDialogReject = reject
    } catch (error) {
      console.error('Manual signing setup failed:', error)
      reject(new Error('Manual signing setup failed: ' + error.message))
    }
  })
}

// Manual sign dialog handlers
function handleManualSignSubmit(signature) {
  if (manualSignDialogResolve) {
    manualSignDialogResolve(signature)
    manualSignDialogResolve = null
    manualSignDialogReject = null
  }
}

function handleManualSignCancel() {
  if (manualSignDialogReject) {
    manualSignDialogReject(new Error(t('components.marketplace.installDialog.manualSigningCancelled')))
    manualSignDialogResolve = null
    manualSignDialogReject = null
  }
}

// Store the signature for use in registration
const deploymentSignature = ref(null)

const registerApplication = async () => {
  signingProgress.value.registering = true
  signingErrors.value.registering = ''

  try {
    if (!deploymentSignature.value) {
      throw new Error('No signature available. Please sign the application message first.')
    }

    // Use the SAME timestamp and app spec that was used for signing
    const timestamp = deploymentTimestamp.value
    if (!timestamp) {
      throw new Error('Deployment timestamp not available. Please sign the message first.')
    }

    const globalAppSpec = deploymentAppSpec.value
    if (!globalAppSpec) {
      throw new Error('App specification not available. Please sign the message first.')
    }

    // Prepare registration data matching the expected format (same as SubscriptionManager)
    // Remove Vue Proxy by serializing to plain object
    const registrationData = {
      type: 'fluxappregister',
      version: 1,
      appSpecification: JSON.parse(JSON.stringify(globalAppSpec)),
      timestamp: timestamp,
      signature: deploymentSignature.value.signature,
    }

    // Use FluxOS AppsService to register the application
    const zelidauth = localStorage.getItem('zelidauth')
    if (!zelidauth) {
      throw new Error('Authentication required. Please log in to FluxOS.')
    }


    // Call the actual FluxOS registration API
    const response = await AppsService.registerApp(zelidauth, registrationData)

    if (response.data && response.data.status === 'success') {

      // Store payment hash from registration response
      // Based on FluxCloud: response.data.data is the hash string directly
      if (response.data.data && typeof response.data.data === 'string') {
        paymentHash.value = response.data.data
      } else {
        console.error('Invalid payment hash in response:', response.data)
        throw new Error('Registration succeeded but no valid payment hash was returned')
      }

      // Mark registration step as completed
      signStepCompleted.value[1] = true

      // Clear any existing countdown before starting new one
      if (redirectCountdownInterval.value) {
        clearInterval(redirectCountdownInterval.value)
        redirectCountdownInterval.value = null
      }

      // Start countdown and auto-advance to payment step
      redirectCountdown.value = 3
      redirectCountdownInterval.value = setInterval(() => {
        redirectCountdown.value--
        if (redirectCountdown.value <= 0) {
          clearInterval(redirectCountdownInterval.value)
          redirectCountdownInterval.value = null
          if (signStepCompleted.value[0] && signStepCompleted.value[1]) {
            if (currentStep.value < totalSteps.value - 1) {
              currentStep.value++
            }
          }
        }
      }, 1000)
    } else {
      throw new Error(response.data?.data?.message || 'Registration failed')
    }

  } catch (error) {
    console.error('Registration error:', error)
    const errorMessage = 'Failed to register application: ' + error.message
    signingErrors.value.registering = errorMessage
    showSnackbar(errorMessage, 'error', 6000)

    // If signature is missing, reset signing state so user can re-sign
    if (error.message.includes('No signature available')) {
      signStepCompleted.value = [false, false]
      signingProgress.value.signing = false
      signingErrors.value.signing = ''
      deploymentSignature.value = null
      deploymentTimestamp.value = null
      deploymentAppSpec.value = null
    }
  } finally {
    signingProgress.value.registering = false
  }
}

// Legacy signing method (kept for backwards compatibility)
const signDeploymentMessage = async () => {
  // Redirect to new FluxCloud-style signing
  await signApplicationMessage()
}

const resetDialog = () => {
  currentStep.value = 0
  deploying.value = false
  signing.value = false
  signatureCompleted.value = false
  signatureError.value = ''
  paymentProcessing.value = false
  paymentConfirmed.value = false
  paymentBridgeMaintenance.value = false
  paymentMethod.value = isWalletUser.value ? 'flux' : 'stripe'
  closeLoginBottomSheet() // Reset login dialog state

  // Cancel any running countdown
  cancelRedirectCountdown()

  // Cancel payment monitoring
  if (paymentMonitoringInterval.value) {
    clearInterval(paymentMonitoringInterval.value)
    paymentMonitoringInterval.value = null
  }
  if (paymentMonitoringTimeout.value) {
    clearTimeout(paymentMonitoringTimeout.value)
    paymentMonitoringTimeout.value = null
  }

  // Reset FluxCloud-style signing state
  signStepCompleted.value = [false, false]
  signingProgress.value = {
    signing: false,
    registering: false,
  }
  signingErrors.value = {
    signing: '',
    registering: '',
  }
  deploymentSignature.value = null
  deploymentTimestamp.value = null
  deploymentAppSpec.value = null
  paymentHash.value = ''

  config.value = {
    cpu: props.app.compose?.[0]?.cpu || 1,
    ram: props.app.compose?.[0]?.ram || 512,
    storage: props.app.compose?.[0]?.hdd || 1,
    instances: props.app.instances || 3, // Use app's instances or default to 3
    subscriptionMonths: props.app.subscriptionMonths || 1, // Use app's subscription months or default to 1
    parameters: {},
  }

  // Reset geolocation configuration
  geolocation.value = {
    allowedContinent: null,
    allowedCountry: null,
    forbiddenContinent: null,
    forbiddenCountry: null,
  }

  // Reset email notifications
  emailNotifications.value = {
    email: '',
  }
}

// Payment monitoring function
const startPaymentMonitoring = async () => {

  // Clear any existing monitoring
  if (paymentMonitoringInterval.value) {
    clearInterval(paymentMonitoringInterval.value)
  }
  if (paymentMonitoringTimeout.value) {
    clearTimeout(paymentMonitoringTimeout.value)
  }

  // Set a 30-minute timeout (payment validity period)
  paymentMonitoringTimeout.value = setTimeout(() => {
    if (paymentMonitoringInterval.value) {
      clearInterval(paymentMonitoringInterval.value)
      paymentMonitoringInterval.value = null
    }
    if (!paymentConfirmed.value) {
      showSnackbar(t('components.marketplace.installDialog.messages.paymentMonitoringTimedOut'), 'warning', 8000)
      paymentProcessing.value = false
    }
  }, 30 * 60 * 1000) // 30 minutes

  // Poll for payment status every 2 minutes (crypto payments)
  paymentMonitoringInterval.value = setInterval(async () => {
    try {
      // Check if app is deployed on the Flux network by getting its location
      // getAppLocation returns the nodes where the app is running
      // The app name includes the timestamp from deployment
      const deployedAppName = deploymentTimestamp.value ?
        `${props.app.name}${deploymentTimestamp.value}` :
        props.app.name


      const response = await AppsService.getAppLocation(deployedAppName)

      if (response.data && response.data.status === 'success') {
        const appLocation = response.data.data

        // If app location exists and has running instances, deployment was successful!
        if (appLocation && appLocation.length > 0) {

          // Clear monitoring
          clearInterval(paymentMonitoringInterval.value)
          clearTimeout(paymentMonitoringTimeout.value)
          paymentMonitoringInterval.value = null
          paymentMonitoringTimeout.value = null
          paymentConfirmed.value = true
          paymentProcessing.value = false

          // Show success message
          showSnackbar(t('components.marketplace.installDialog.messages.paymentConfirmedActive'), 'success', 8000)

          // Clear any existing countdown before starting new one
          if (redirectCountdownInterval.value) {
            clearInterval(redirectCountdownInterval.value)
            redirectCountdownInterval.value = null
          }

          // Start countdown and auto-advance to deployment step
          redirectCountdown.value = 5
          redirectCountdownInterval.value = setInterval(() => {
            redirectCountdown.value--
            if (redirectCountdown.value <= 0) {
              clearInterval(redirectCountdownInterval.value)
              redirectCountdownInterval.value = null
              currentStep.value = totalSteps.value - 1
            }
          }, 1000)
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
  }, 240000) // Check every 4 minutes (240 seconds)
}

const processFluxPayment = async () => {
  paymentProcessing.value = true

  try {
    // Use walletService to initiate Zelcore payment
    await payWithZelcore({
      address: fluxPaymentAddress.value,
      amount: totalFluxPrice.value,
      message: paymentHash.value,
      coin: 'flux',
    })

    // Start monitoring for payment
    await startPaymentMonitoring()

    showSnackbar(t('components.marketplace.installDialog.messages.openingZelCoreWallet'), 'info', 5000)
  } catch (error) {
    console.error('Flux payment failed:', error)
    paymentProcessing.value = false
    showSnackbar(t('components.marketplace.installDialog.messages.failedToOpenZelCoreWallet'), 'error')
  }
}

const processStripePayment = async () => {
  paymentProcessing.value = true

  try {
    // Check authentication from localStorage
    const zelidauthData = localStorage.getItem('zelidauth')
    if (!zelidauthData) {
      showSnackbar(t('components.marketplace.installDialog.messages.pleaseLoginToMakePayments'), 'error')
      paymentProcessing.value = false
      
      return
    }

    // Parse authentication data using qs.parse (handles both formats)
    const authData = qs.parse(zelidauthData)

    // Validate required authentication fields
    if (!authData.zelid || !authData.signature || !authData.loginPhrase) {
      showSnackbar(t('components.marketplace.installDialog.messages.invalidAuthenticationData'), 'error')
      paymentProcessing.value = false
      
      return
    }

    // Create Stripe checkout session with backend
    const data = {
      zelid: authData.zelid,
      signature: authData.signature,
      loginPhrase: authData.loginPhrase,
      details: {
        name: props.app.name,
        description: props.app.description,
        hash: paymentHash.value,
        price: parseFloat(estimatedCost.value),
        productName: props.app.name,
        success_url: `${window.location.origin}/successcheckout`,
        cancel_url: `${window.location.origin}/marketplace`,
        kpi: {
          origin: 'FluxOS',
          marketplace: true,
          registration: true,
        },
      },
    }


    const checkoutURL = await axios.post(`${paymentBridge}/api/v1/stripe/checkout/create`, data)


    if (checkoutURL.data.status === 'error') {
      throw new Error(checkoutURL.data.message || checkoutURL.data.data || 'Failed to create Stripe checkout')
    }


    // Start monitoring before opening window
    await startPaymentMonitoring()

    // Open Stripe checkout in popup window
    const win = window.open(checkoutURL.data.data, '_blank', 'width=600,height=800,resizable=yes,scrollbars=yes')

    if (!win || win.closed || typeof win.closed === 'undefined') {
      // Popup blocked - show dialog
      popupBlockedDialog.value = true
      blockedPaymentUrl.value = checkoutURL.data.data
      blockedPaymentType.value = 'Stripe'
    } else {
      win.focus()
      showSnackbar(t('components.marketplace.installDialog.messages.stripeCheckoutOpened'), 'info', 5000)
    }
  } catch (error) {
    console.error('Stripe payment failed:', error)

    // Check if it's a payment bridge error (HTTP error, network error, or timeout)
    if (error.response?.status >= 400 || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      // Stop monitoring and show maintenance UI
      cancelPaymentMonitoring()
      paymentBridgeMaintenance.value = true
      paymentProcessing.value = false
      console.log('🔧 Payment bridge maintenance mode activated')
    } else {
      paymentProcessing.value = false
      const errorMsg = error.response?.data?.message || error.response?.data?.data || error.message || 'Failed to initialize Stripe payment'
      showSnackbar(errorMsg, 'error')
    }
  }
}

const processPayPalPayment = async () => {
  paymentProcessing.value = true

  try {
    // Check authentication from localStorage
    const zelidauthData = localStorage.getItem('zelidauth')
    if (!zelidauthData) {
      showSnackbar('Please login to FluxOS to make payments', 'error')
      paymentProcessing.value = false
      
      return
    }

    // Parse authentication data using qs.parse (handles both formats)
    const authData = qs.parse(zelidauthData)

    // Validate required authentication fields
    if (!authData.zelid || !authData.signature || !authData.loginPhrase) {
      showSnackbar('Invalid authentication data - please login again', 'error')
      paymentProcessing.value = false
      
      return
    }

    // Create PayPal order with backend
    const data = {
      zelid: authData.zelid,
      signature: authData.signature,
      loginPhrase: authData.loginPhrase,
      details: {
        name: props.app.name,
        description: props.app.description,
        hash: paymentHash.value,
        price: parseFloat(estimatedCost.value),
        productName: props.app.name,
        return_url: `${window.location.origin}/successcheckout`,
        cancel_url: `${window.location.origin}/marketplace`,
        kpi: {
          origin: 'FluxOS',
          marketplace: true,
          registration: true,
        },
      },
    }

    const checkoutURL = await axios.post(`${paymentBridge}/api/v1/paypal/checkout/create`, data)


    if (checkoutURL.data.status === 'error') {
      throw new Error(checkoutURL.data.message || checkoutURL.data.data || 'Failed to create PayPal order')
    }


    // Start monitoring before opening window
    await startPaymentMonitoring()

    // Open PayPal checkout in popup window
    const win = window.open(checkoutURL.data.data, '_blank', 'width=600,height=800,resizable=yes,scrollbars=yes')

    if (!win || win.closed || typeof win.closed === 'undefined') {
      // Popup blocked - show dialog
      popupBlockedDialog.value = true
      blockedPaymentUrl.value = checkoutURL.data.data
      blockedPaymentType.value = 'PayPal'
    } else {
      win.focus()
      showSnackbar(t('components.marketplace.installDialog.messages.payPalCheckoutOpened'), 'info', 5000)
    }
  } catch (error) {
    console.error('PayPal payment failed:', error)

    // Check if it's a payment bridge error (HTTP error, network error, or timeout)
    if (error.response?.status >= 400 || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      // Stop monitoring and show maintenance UI
      cancelPaymentMonitoring()
      paymentBridgeMaintenance.value = true
      paymentProcessing.value = false
      console.log('🔧 Payment bridge maintenance mode activated')
    } else {
      paymentProcessing.value = false
      const errorMsg = error.response?.data?.message || error.response?.data?.data || error.message || 'Failed to initialize PayPal payment'
      showSnackbar(errorMsg, 'error')
    }
  }
}

const processSSPPayment = async () => {
  paymentProcessing.value = true

  try {
    // Check if SSP wallet is installed
    if (!isSSPAvailable()) {
      showSnackbar(t('components.marketplace.installDialog.messages.sspWalletNotInstalled'), 'error')
      paymentProcessing.value = false

      return
    }

    // Use walletService to initiate SSP payment
    const response = await payWithSSP({
      message: paymentHash.value,
      amount: totalFluxPrice.value.toString(),
      address: fluxPaymentAddress.value,
      chain: 'flux',
    })

    showSnackbar(`SSP payment initiated: ${response.txid}`, 'success', 5000)

    // Start monitoring for payment
    await startPaymentMonitoring()
  } catch (error) {
    console.error('SSP payment failed:', error)
    paymentProcessing.value = false
    showSnackbar(error.message || 'Failed to initiate SSP payment', 'error')
  }
}

const openBlockedPayment = () => {
  if (blockedPaymentUrl.value) {
    window.open(blockedPaymentUrl.value, '_blank')
    popupBlockedDialog.value = false
  }
}

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

  // Also cancel any redirect countdown
  cancelRedirectCountdown()

  // Reset payment state
  paymentProcessing.value = false
  paymentConfirmed.value = false
  paymentBridgeMaintenance.value = false

  showSnackbar(t('components.marketplace.installDialog.messages.paymentMonitoringCancelled'), 'info')
}

const cancelRedirectCountdown = () => {
  if (redirectCountdownInterval.value) {
    clearInterval(redirectCountdownInterval.value)
    redirectCountdownInterval.value = null
  }
  redirectCountdown.value = 3
}

const deployApp = async () => {
  deploying.value = true

  try {
    // Deploy the app with collected configuration
    const deploymentConfig = {
      ...config.value.parameters,
      cpu: config.value.cpu,
      ram: config.value.ram,
      storage: config.value.storage,
      instances: config.value.instances,
      paymentMethod: paymentMethod.value,
      totalCost: totalCost.value,
      isWalletUser: isWalletUser,
      signatureCompleted: signatureCompleted.value,
    }

    await deployAppService(props.app.name, deploymentConfig)

    emit('deployed', props.app)

    // Auto-close after successful deployment
    setTimeout(() => {
      isOpen.value = false
      resetDialog()
    }, 2000)

  } catch (error) {
    console.error('Deployment failed:', error)

    // Handle error - could show error step or notification
  } finally {
    deploying.value = false
  }
}

// Geolocation methods
const onContinentChange = (type, continentCode) => {
  if (type === 'allowed') {
    geolocation.value.allowedContinent = continentCode
    geolocation.value.allowedCountry = null // Reset country when continent changes
  } else {
    geolocation.value.forbiddenContinent = continentCode
    geolocation.value.forbiddenCountry = null // Reset country when continent changes
  }
  updateGeolocationConfiguration()
}

const onCountryChange = (type, countryCode) => {
  if (type === 'allowed') {
    geolocation.value.allowedCountry = countryCode
  } else {
    geolocation.value.forbiddenCountry = countryCode
  }
  updateGeolocationConfiguration()
}

const updateGeolocationConfiguration = () => {
  // Generate geolocation codes from multiple arrays
  const geolocationCodes = []

  // Add all allowed geolocations
  geolocationCodes.push(...allowedGeolocations.value)

  // Add all forbidden geolocations (these override allowed ones in FluxOS)
  geolocationCodes.push(...forbiddenGeolocations.value)

  return geolocationCodes
}

const getGeolocationCodes = () => {
  return updateGeolocationConfiguration()
}

// Functions for managing multiple geolocation entries
const addAllowedGeolocation = () => {
  if (!geolocation.value.allowedContinent) return

  let geoCode = `ac${geolocation.value.allowedContinent}`
  if (geolocation.value.allowedCountry) {
    geoCode += `_${geolocation.value.allowedCountry}`
  }

  // Check for conflicts with forbidden geolocations
  const conflictCheck = checkGeolocationConflicts(geoCode, 'allowed')
  if (conflictCheck.hasConflict) {
    showSnackbar(conflictCheck.message, 'error', 3000, 'mdi-alert-circle')
    
    return
  }

  // Check if this geolocation already exists
  if (!allowedGeolocations.value.includes(geoCode)) {
    allowedGeolocations.value.push(geoCode)
    showSnackbar(`Added allowed location: ${formatGeolocationLabel(geoCode)}`, 'success', 3000, 'mdi-check-circle')
  } else {
    showSnackbar(t('components.marketplace.installDialog.messages.locationAlreadyInAllowedList'), 'warning', 3000, 'mdi-alert')
    
    return
  }

  // Reset the form
  geolocation.value.allowedContinent = null
  geolocation.value.allowedCountry = null
}

const addForbiddenGeolocation = () => {
  if (!geolocation.value.forbiddenContinent) return

  let geoCode = `a!c${geolocation.value.forbiddenContinent}`
  if (geolocation.value.forbiddenCountry) {
    geoCode += `_${geolocation.value.forbiddenCountry}`
  }

  // Check for conflicts with allowed geolocations
  const conflictCheck = checkGeolocationConflicts(geoCode, 'forbidden')
  if (conflictCheck.hasConflict) {
    showSnackbar(conflictCheck.message, 'error', 3000, 'mdi-alert-circle')
    
    return
  }

  // Check if this geolocation already exists
  if (!forbiddenGeolocations.value.includes(geoCode)) {
    forbiddenGeolocations.value.push(geoCode)
    showSnackbar(`Added forbidden location: ${formatGeolocationLabel(geoCode)}`, 'success', 3000, 'mdi-check-circle')
  } else {
    showSnackbar(t('components.marketplace.installDialog.messages.locationAlreadyInForbiddenList'), 'warning', 3000, 'mdi-alert')
    
    return
  }

  // Reset the form
  geolocation.value.forbiddenContinent = null
  geolocation.value.forbiddenCountry = null
}

const removeAllowedGeolocation = index => {
  const removed = allowedGeolocations.value.splice(index, 1)
  showSnackbar(`Removed allowed location: ${formatGeolocationLabel(removed[0])}`, 'info', 3000, 'mdi-delete')
}

const removeForbiddenGeolocation = index => {
  const removed = forbiddenGeolocations.value.splice(index, 1)
  showSnackbar(`Removed forbidden location: ${formatGeolocationLabel(removed[0])}`, 'info', 3000, 'mdi-delete')
}

const clearAllGeolocations = () => {
  const totalRemoved = allowedGeolocations.value.length + forbiddenGeolocations.value.length
  allowedGeolocations.value = []
  forbiddenGeolocations.value = []
  showSnackbar(`Cleared ${totalRemoved} geolocation rules`, 'success', 3000, 'mdi-delete-sweep')
}

const formatGeolocationLabel = geoCode => {
  const isAllowed = geoCode.startsWith('ac')
  const isForbidden = geoCode.startsWith('a!c')

  let locationCode
  if (isAllowed) {
    locationCode = geoCode.slice(2) // Remove 'ac'
  } else if (isForbidden) {
    locationCode = geoCode.slice(3) // Remove 'a!c'
  } else {
    return geoCode
  }

  const parts = locationCode.split('_')
  const continentCode = parts[0]
  const countryCode = parts[1]

  const continentName = getContinentName(continentCode) || continentCode
  const countryName = countryCode ? getCountryName(countryCode) : 'All Countries'

  if (countryCode) {
    return `${continentName}, ${countryName}`
  }
  
  return continentName
}

// Check for geolocation conflicts that would exclude each other
const checkGeolocationConflicts = (newGeoCode, type) => {
  const newLocationCode = newGeoCode.startsWith('a!c') ? newGeoCode.slice(3) : newGeoCode.slice(2)
  const newParts = newLocationCode.split('_')
  const newContinent = newParts[0]
  const newCountry = newParts[1]

  if (type === 'allowed') {
    // Check conflicts with forbidden geolocations
    for (const forbiddenGeo of forbiddenGeolocations.value) {
      const forbiddenLocation = forbiddenGeo.slice(3) // Remove 'a!c'
      const forbiddenParts = forbiddenLocation.split('_')
      const forbiddenContinent = forbiddenParts[0]
      const forbiddenCountry = forbiddenParts[1]

      // Exact match conflict
      if (forbiddenLocation === newLocationCode) {
        return {
          hasConflict: true,
          message: `Cannot allow "${formatGeolocationLabel(newGeoCode)}" because it's already forbidden`,
        }
      }

      // Parent-child conflicts
      if (newCountry && forbiddenContinent === newContinent && !forbiddenCountry) {
        return {
          hasConflict: true,
          message: `Cannot allow "${formatGeolocationLabel(newGeoCode)}" because entire continent is forbidden`,
        }
      }

      if (!newCountry && forbiddenContinent === newContinent && forbiddenCountry) {
        return {
          hasConflict: true,
          message: `Cannot allow entire continent because "${getContinentName(forbiddenContinent)} → ${getCountryName(forbiddenCountry)}" is already forbidden`,
        }
      }
    }
  } else {
    // For forbidden geolocations: auto-remove conflicting allowed rules (forbidden wins)
    const conflictsToRemove = []

    for (let i = 0; i < allowedGeolocations.value.length; i++) {
      const allowedGeo = allowedGeolocations.value[i]
      const allowedLocation = allowedGeo.slice(2) // Remove 'ac'
      const allowedParts = allowedLocation.split('_')
      const allowedContinent = allowedParts[0]
      const allowedCountry = allowedParts[1]

      // Exact match conflict - remove the allowed rule
      if (allowedLocation === newLocationCode) {
        conflictsToRemove.push({
          index: i,
          geo: allowedGeo,
          reason: 'exact match',
        })
      }

      // Parent-child conflicts - remove conflicting allowed rules
      if (newCountry && allowedContinent === newContinent && !allowedCountry) {
        conflictsToRemove.push({
          index: i,
          geo: allowedGeo,
          reason: 'continent already allowed',
        })
      }

      if (!newCountry && allowedContinent === newContinent && allowedCountry) {
        conflictsToRemove.push({
          index: i,
          geo: allowedGeo,
          reason: 'country conflicts with continent',
        })
      }
    }

    // Remove conflicts (in reverse order to maintain indices)
    conflictsToRemove.reverse().forEach(conflict => {
      allowedGeolocations.value.splice(conflict.index, 1)
    })
  }

  return { hasConflict: false }
}

// FluxOS-style live geolocation data fetching
const fetchLiveGeolocationData = async () => {

  try {
    const response = await fetch('https://stats.runonflux.io/fluxinfo?projection=geo')
    const result = await response.json()

    if (result.status === 'success' && result.data && result.data.length > 5000) {
      const locations = []
      const continents = new Map()

      result.data.forEach(flux => {
        if (flux.geolocation?.continentCode && flux.geolocation?.countryCode && flux.geolocation?.regionName) {
          const cont = flux.geolocation.continentCode
          const count = flux.geolocation.countryCode
          const reg = flux.geolocation.regionName

          const continentLoc = cont
          const countryLoc = `${cont}_${count}`
          const regionLoc = `${countryLoc}_${reg}`

          const updateCount = val => {
            const exists = locations.find(l => l.value === val)
            if (exists) {
              exists.instances++
            } else {
              locations.push({ value: val, instances: 1 })
            }
          }

          updateCount(continentLoc)
          updateCount(countryLoc)
          updateCount(regionLoc)

          // Track continent names for dropdown
          if (!continents.has(cont)) {
            const continentName = getContinentName(cont)
            if (continentName) {
              continents.set(cont, continentName)
            }
          }
        }
      })

      availableLocations.value = locations

      // Update available continents based on actual data
      // Only include continents that have sufficient total instances
      const minInstances = config.value?.instances || 5
      const filteredContinents = []

      continents.forEach((name, code) => {
        // Calculate total instances for this continent
        const continentInstances = locations
          .filter(loc => loc.value.startsWith(code))
          .reduce((total, loc) => total + loc.instances, 0)

        if (continentInstances >= minInstances) {
          filteredContinents.push({ name, code, totalInstances: continentInstances })
        }
      })

      availableContinents.value = filteredContinents.sort((a, b) => b.totalInstances - a.totalInstances)

    } else {
      console.warn('Insufficient node data or invalid response from stats API')
      throw new Error('Unable to fetch sufficient node data for geolocation validation')
    }
  } catch (error) {
    console.error('Failed to fetch live geolocation data:', error)

    // Don't throw error - let the caller handle fallback to global
    throw error
  }
}

// Helper function to get continent name from code
const getContinentName = code => {
  const continentNames = {
    'AF': 'Africa',
    'AN': 'Antarctica',
    'AS': 'Asia',
    'EU': 'Europe',
    'NA': 'North America',
    'OC': 'Oceania',
    'SA': 'South America',
  }
  
  return continentNames[code] || null
}

// Helper function to get country name from code using complete geolocation data
const getCountryName = code => {
  // Use the complete countries list from geolocation.js
  const country = geolocationData.countries.find(c => c.code === code)

  if (country) {
    return country.name
  }

  // If country code not found, log it for debugging and return uppercase code as fallback
  console.warn(`Missing country name mapping for code: "${code}"`)
  
  return code.toUpperCase()
}

// Instance availability validation
const validateInstanceAvailability = () => {
  const requiredInstances = config.value.instances
  const geolocationCodes = getGeolocationCodes()

  if (geolocationCodes.length === 0) {
    // No geolocation restrictions - global deployment
    return { valid: true, message: 'Global deployment allowed' }
  }

  // Check allowed geolocations
  const allowedGeos = geolocationCodes.filter(code => code.startsWith('ac'))
  if (allowedGeos.length > 0) {
    let totalAvailableInstances = 0

    allowedGeos.forEach(geoCode => {
      const locationCode = geoCode.slice(2) // Remove 'ac' prefix
      const location = availableLocations.value.find(loc =>
        loc.value === locationCode ||
        loc.value.startsWith(locationCode + '_'),
      )

      if (location) {
        totalAvailableInstances += location.instances
      }
    })

    if (totalAvailableInstances < requiredInstances) {
      return {
        valid: false,
        message: `Insufficient nodes available. Required: ${requiredInstances}, Available: ${totalAvailableInstances} in selected regions.`,
      }
    }
  }

  return { valid: true, message: 'Sufficient instances available' }
}

// Email validation method
const validateEmail = () => {
  const email = emailNotifications.value.email
  if (!email) return false

  const emailRegex = /.+@.+\..+/
  const isValid = emailRegex.test(email)


  return isValid
}

// Watch for authentication changes
watch(isWalletUser, isZelCore => {
  paymentMethod.value = isZelCore ? 'flux' : 'stripe'
}, { immediate: true })

// Watch dialog close - cancel monitoring and countdown
watch(isOpen, newValue => {
  if (!newValue) {
    if (paymentProcessing.value) {
      cancelPaymentMonitoring()
    }
    cancelRedirectCountdown()
  } else {
    // Dialog just opened - auto-trigger signing for WordPress SSO at step 0
    nextTick(() => {
      if (isWordPress.value && currentStep.value === 0 && detectedSigningMethod.value === 'SSO' && !signStepCompleted.value[0]) {
        console.log('[InstallDialog] Auto-triggering WordPress SSO signing on dialog open')
        signApplicationMessage()
      }
    })
  }
})

// Watch config changes - cancel monitoring if specs change
watch([() => config.value.cpu, () => config.value.ram, () => config.value.storage, () => config.value.instances], () => {
  if (paymentProcessing.value) {
    cancelPaymentMonitoring()
    cancelRedirectCountdown()
    showSnackbar(t('components.marketplace.installDialog.messages.configurationChanged'), 'warning')
  }
})

// Cleanup on component unmount
onBeforeUnmount(() => {
  // Clear payment monitoring intervals
  if (paymentMonitoringInterval.value) {
    clearInterval(paymentMonitoringInterval.value)
    paymentMonitoringInterval.value = null
  }
  if (paymentMonitoringTimeout.value) {
    clearTimeout(paymentMonitoringTimeout.value)
    paymentMonitoringTimeout.value = null
  }

  // Clear redirect countdown interval
  if (redirectCountdownInterval.value) {
    clearInterval(redirectCountdownInterval.value)
    redirectCountdownInterval.value = null
  }
})

// Watch for dialog open/close to reset state
watch(() => props.modelValue, (newValue, oldValue) => {
  // If dialog is closing (going from true to false)
  if (oldValue === true && newValue === false) {
    resetDialog()
  }

  // If dialog is opening (going from false to true)
  if (oldValue === false && newValue === true) {
    // Reset state when opening
    resetDialog()

    // Re-fetch deployment info
    fetchDeploymentInfo()
  }
})

// Initialize parameters when app changes
watch(() => props.app, newApp => {
  if (newApp) {
    const params = getEnvironmentParameters()
    params.forEach(param => {
      if (!config.value.parameters[param.name]) {
        // Initialize with defaultValue if available, otherwise placeholder or empty
        config.value.parameters[param.name] = param.defaultValue || param.placeholder || ''
      }
    })
  }
}, { immediate: true })


// Watch for login status - handled by handleLoginSuccess event now
// This watch is kept for backwards compatibility but the event handler is preferred

// Check login status when dialog opens
watch(() => props.modelValue, newValue => {
  if (newValue === true) {
    // Dialog is opening - check if user is logged in
    if (!isLoggedIn.value) {
      // User not logged in - close install dialog and show only login dialog
      isOpen.value = false
      nextTick(() => {
        openLoginBottomSheet()
      })
    } else {
      // User is logged in - ensure login dialog is hidden
      closeLoginBottomSheet()
    }
  }
}, { immediate: true })

// Watch for login status changes to handle successful login
watch(isLoggedIn, (newValue, oldValue) => {
  // Only handle when user logs in (changes from false to true)
  // Don't check props.modelValue - dialog was closed to show login sheet
  // We want to reopen it automatically after successful login
  if (newValue && !oldValue) {
    handleLoginSuccess()
  }
})
</script>


<style scoped>
/* Login Dialog Enhanced 3D Effect */
.login-dialog-card {
  box-shadow: 
    0 30px 90px rgba(0, 0, 0, 0.5),
    0 20px 50px rgba(0, 0, 0, 0.4),
    0 10px 25px rgba(0, 0, 0, 0.35),
    0 5px 10px rgba(0, 0, 0, 0.25) !important;
  transform: translateZ(50px);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.login-dialog-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  transition: background 0.2s ease;
}

.install-dialog :deep(.v-card-text)::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.install-dialog .v-overlay__content {
  margin: 24px;
}

.install-card {
  border-radius: 24px !important;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.install-header {
  background: linear-gradient(135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgba(var(--v-theme-primary), 0.9) 100%);
  backdrop-filter: blur(10px);
  border-radius: 24px 24px 0 0;
  padding: 8px 12px;
  border-bottom: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-avatar {
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
}

.app-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.1;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.app-subtitle {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 500;
  line-height: 1.1;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.close-btn {
  color: rgba(255, 255, 255, 0.9) !important;
}

.close-btn:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.1) !important;
}


/* Separate Step Progress Section */
.step-progress-section {
  padding: 12px 12px 8px 12px;
  background: linear-gradient(180deg,
    rgba(var(--v-theme-primary), 0.9) 0%,
    rgba(var(--v-theme-primary), 1) 100%);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.8);
  backdrop-filter: blur(5px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.1);
  color: white;
}

.steps-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-circle {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
}

.step-item.completed .step-circle {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4);
}

.step-item.completed .step-circle .v-icon {
  color: rgb(var(--v-theme-success)) !important;
}

.step-item.active .step-circle {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}

.step-item.active .step-circle .v-icon {
  color: rgb(var(--v-theme-primary)) !important;
}

.step-item.upcoming .step-circle {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.step-item.upcoming .step-circle .v-icon {
  color: rgba(255, 255, 255, 0.6) !important;
}

.step-label {
  font-size: 0.7rem;
  font-weight: 500;
  margin-top: 4px;
  text-align: center;
  opacity: 0.8;
  transition: opacity 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.step-item.active .step-label {
  opacity: 1;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.step-connector {
  position: absolute;
  top: 16px;
  left: calc(50% + 18px);
  width: calc(100% - 36px);
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  z-index: 0;
}

.step-item.completed .step-connector {
  background: rgba(255, 255, 255, 0.5);
}

.step-indicator {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.9;
  font-weight: 500;
}

.step-title {
  font-size: 0.75rem;
  opacity: 0.7;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.step-icon {
  flex-shrink: 0;
}

.install-content {
  flex: 1;
  overflow-y: auto;
}

.install-wizard {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.step-container {
  padding: 2px 16px 12px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}




.config-section, .params-section {
  display: flex;
  flex-direction: column;
}

.modern-section {
  background: linear-gradient(135deg,
    rgba(var(--v-theme-surface), 0.95) 0%,
    rgba(var(--v-theme-primary), 0.08) 50%,
    rgba(var(--v-theme-secondary), 0.06) 100%);
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 4px 12px rgba(var(--v-theme-primary), 0.1),
    0 2px 6px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.modern-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(var(--v-theme-primary), 0.05),
    transparent);
  transition: left 0.5s ease;
}

.modern-section:hover::after {
  left: 100%;
}


/* Dark theme improvements */
.v-theme--dark .modern-section {
  background: linear-gradient(135deg,
    rgba(var(--v-theme-surface), 0.8) 0%,
    rgba(var(--v-theme-primary), 0.15) 50%,
    rgba(var(--v-theme-secondary), 0.12) 100%);
  border: 1px solid rgba(var(--v-theme-primary), 0.4);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 4px 16px rgba(var(--v-theme-primary), 0.15),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.v-theme--dark .step-progress-section {
  background: linear-gradient(180deg,
    rgba(var(--v-theme-primary), 0.85) 0%,
    rgba(var(--v-theme-primary), 1) 100%);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.7);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.15);
  color: white;
}

.v-theme--dark .step-circle {
  border: 2px solid rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-surface-variant), 0.8);
}

.v-theme--dark .step-item.upcoming .step-circle {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-color: rgba(var(--v-theme-outline), 0.4);
}

.v-theme--dark .step-connector {
  background: rgba(var(--v-theme-outline), 0.3);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.hardware-chips, .deployment-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.hardware-chip {
  font-size: 0.75rem !important;
  height: 24px !important;
  font-weight: 500 !important;
}

.config-section h5, .deployment-summary h5, .section-header h5 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
}

.pricing-info {
  margin-top: 0;
}


.pricing-chips {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.price-chip {
  font-size: 0.85rem !important;
  font-weight: 600 !important;
  height: 32px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.usd-chip {
  background: rgb(var(--v-theme-success)) !important;
  color: white !important;
}

.flux-chip {
  background: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}

.usd-chip .v-icon {
  color: white !important;
}

.flux-chip .v-icon {
  color: white !important;
}

.pricing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pricing-row:last-child {
  margin-bottom: 0;
}

.price {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.flux-price {
  font-weight: 600;
  color: rgb(var(--v-theme-secondary));
}

.param-item {
  margin-bottom: 12px;
}

.no-params {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  background: linear-gradient(135deg,
    rgba(var(--v-theme-surface), 0.95) 0%,
    rgba(var(--v-theme-success), 0.08) 100%);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-success), 0.25);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 2px 8px rgba(var(--v-theme-success), 0.1),
    0 1px 4px rgba(0, 0, 0, 0.05);
  position: relative;
}

.no-params-icon {
  flex-shrink: 0;
}

.no-params-text {
  flex: 1;
}

.no-params-text h5 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-success));
}

.no-params-text p {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.8;
}

.deployment-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.summary-item:last-child {
  border-bottom: none;
}

.deployment-progress {
  text-align: center;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.install-actions {
  padding: 8px 16px;
  border-top: 1px solid rgba(var(--v-theme-primary), 0.1);
  background: linear-gradient(180deg,
    rgba(var(--v-theme-surface), 0.98) 0%,
    rgba(var(--v-theme-primary), 0.02) 100%);
  flex-shrink: 0;
}

.action-btn {
  height: 28px !important;
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  text-transform: none !important;
  padding: 0 10px !important;
  min-width: auto !important;
}

.next-btn {
  background: rgb(var(--v-theme-primary)) !important;
  box-shadow: none !important;
  transition: all 0.2s ease !important;
}

.next-btn:hover {
  background: rgba(var(--v-theme-primary), 0.9) !important;
}

.deploy-btn {
  background: rgb(var(--v-theme-success)) !important;
  box-shadow: none !important;
}

.deploy-btn:hover {
  background: rgba(var(--v-theme-success), 0.9) !important;
}

/* Payment Section */
.payment-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-summary-section, .payment-method-section {
  margin-bottom: 12px;
}

.payment-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.payment-chip {
  font-size: 0.75rem !important;
  height: 24px !important;
  font-weight: 500 !important;
}

.total-chip {
  font-size: 0.8rem !important;
  height: 28px !important;
  font-weight: 600 !important;
  margin-left: 8px;
}

.summary-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-chip {
  font-size: 0.75rem !important;
  height: 24px !important;
  font-weight: 500 !important;
  margin-bottom: 4px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.payment-row.total {
  padding-top: 12px;
  color: rgb(var(--v-theme-primary));
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-method-card {
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}

.payment-method-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-primary), 0.05);
}

.payment-method-card.selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
}

/* FluxCloud-style deployment steps */
.deployment-steps {
  max-width: 600px;
  margin: 0 auto;
}

.deployment-step {
  position: relative;
}

/* Duplicate step-circle rules removed - using global step-circle styles from above */

.step-content {
  min-height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.step-title {
  font-weight: 600;
  font-size: 16px;
  line-height: 1.2;
}

.step-status {
  margin-top: 2px;
  line-height: 1.2;
}

/* Launch App Button Styling */
.launch-app-btn {
  min-width: 160px !important;
  min-height: 44px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  text-transform: none !important;
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.3) !important;
  transition: all 0.3s ease !important;
}

.launch-app-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(var(--v-theme-primary), 0.4) !important;
}

.launch-app-btn:disabled {
  transform: none !important;
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.2) !important;
}

/* SSO Progress Section Styling */
.progress-section {
  max-width: 400px;
  margin: 0 auto;
}

.progress-steps {
  margin-top: 24px;
}

.progress-step {
  min-width: 150px;
}

.progress-icon {
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-text {
  font-size: 14px;
  font-weight: 500;
}

.success-section {
  margin-top: 32px;
}

/* Detected Method Display */
.detected-method-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.walletIcon {
  height: 90px;
  width: 90px;
  padding: 10px;
  object-fit: contain;
  transition: all 0.05s ease-in-out;
}

.wallet-link {
  display: inline-block;
  cursor: default;
  pointer-events: none;
}

/* SSO Icon with Glow Animation */
.sso-icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  border-radius: 50%;
  margin: 0 auto;
  animation: ssoGlow 2s ease-in-out infinite;
  position: relative;
}

@keyframes ssoGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(var(--v-theme-primary), 0.4),
                0 0 40px rgba(var(--v-theme-primary), 0.2),
                0 0 60px rgba(var(--v-theme-primary), 0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(var(--v-theme-primary), 0.6),
                0 0 60px rgba(var(--v-theme-primary), 0.4),
                0 0 90px rgba(var(--v-theme-primary), 0.2);
  }
}

/* Payment Method Logo Styling */
.payment-method-logo {
  height: 40px;
  width: 60px;
  object-fit: contain;
}

/* Payment Section - Compact Styles */
.payment-info-section .payment-info-content,
.payment-method-section .payment-methods-compact,
.crypto-payment-section .payment-details-content,
.fiat-payment-section .payment-details-content {
  padding: 12px;
  margin-top: 8px;
}

.crypto-payment-section .payment-details-content .v-btn {
  color: rgb(var(--v-theme-grey)) !important;
}

.crypto-payment-section .payment-details-content .v-btn .v-icon {
  color: rgb(var(--v-theme-grey)) !important;
}

.payment-methods-compact {
  display: grid;
  gap: 8px;
}

.payment-method-card-compact {
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(255, 255, 255, 0.05) !important;
}

.payment-method-card-compact:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.payment-method-card-compact.selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px;
  background: rgba(var(--v-theme-primary), 0.02) !important;
}

.payment-method-content {
  padding: 8px 12px !important;
}

.payment-method-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.payment-method-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 4px;
}

.payment-method-text {
  flex: 1;
  min-width: 0;
}

.payment-method-price {
  flex-shrink: 0;
  text-align: right;
  margin-left: 8px;
}

.payment-method-logo-compact {
  height: 32px;
  width: 50px;
  object-fit: contain;
}

/* Payment Details - Compact */
.payment-details-card-compact {
  border-left: 3px solid rgb(var(--v-theme-success)) !important;
}

.payment-field-compact code {
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
  color: rgb(var(--v-theme-on-surface));
  word-break: break-all;
  line-height: 1.4;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.payment-processing {
  text-align: center;
  padding: 24px;
}

.modern-alert {
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-info), 0.3);
}

.v-theme--dark .modern-alert {
  border: 1px solid rgba(var(--v-theme-info), 0.4);
  background: rgba(var(--v-theme-info), 0.08) !important;
}

/* Modern Input Styling */
.modern-input {
  border-radius: 12px !important;
  margin-bottom: 12px;
}

.modern-input .v-field {
  border-radius: 12px !important;
  background: linear-gradient(145deg,
    rgba(var(--v-theme-surface), 0.95) 0%,
    rgba(var(--v-theme-primary), 0.03) 100%) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.2) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.modern-input .v-field:hover {
  border-color: rgba(var(--v-theme-primary), 0.4) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(var(--v-theme-primary), 0.1) !important;
}

.modern-input .v-field--focused {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(var(--v-theme-primary), 0.2),
    0 2px 8px rgba(var(--v-theme-primary), 0.15) !important;
}

.modern-input .v-field__prepend-inner {
  padding-inline-start: 12px !important;
  opacity: 0.7;
}

.modern-input .v-field--focused .v-field__prepend-inner {
  opacity: 1;
  color: rgb(var(--v-theme-primary)) !important;
}

.modern-input .v-field__input {
  padding-inline-start: 8px !important;
  font-weight: 500;
}

.modern-input .v-label {
  font-weight: 500 !important;
  opacity: 0.8;
}

.modern-input .v-field--focused .v-label {
  color: rgb(var(--v-theme-primary)) !important;
  opacity: 1;
}

/* Dark theme input improvements */
.v-theme--dark .modern-input .v-field {
  background: linear-gradient(145deg,
    rgba(var(--v-theme-surface), 0.85) 0%,
    rgba(var(--v-theme-primary), 0.06) 100%) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.25) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

.v-theme--dark .modern-input .v-field:hover {
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.2),
    0 2px 4px rgba(var(--v-theme-primary), 0.15) !important;
}

.v-theme--dark .modern-input .v-field--focused {
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.2),
    0 0 0 2px rgba(var(--v-theme-primary), 0.3),
    0 2px 8px rgba(var(--v-theme-primary), 0.2) !important;
}

/* Selected Configuration Logo */
.selected-config-logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
  width: 100%;
  padding: 24px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.selected-config-logo {
  width: 300px;
  height: auto;
  max-height: 180px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(var(--v-theme-on-surface), 0.2));
}

/* Hardware Section Styling */
.hardware-section {
  background: linear-gradient(135deg,
    rgba(var(--v-theme-surface), 0.95) 0%,
    rgba(var(--v-theme-primary), 0.08) 50%,
    rgba(var(--v-theme-secondary), 0.06) 100%) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.25) !important;
  border-radius: 16px !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 4px 12px rgba(var(--v-theme-primary), 0.1),
    0 2px 6px rgba(0, 0, 0, 0.08) !important;
  position: relative;
  overflow: hidden;
  padding: 8px !important;
  margin-bottom: 12px !important;
}

.hardware-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(var(--v-theme-primary), 0.05),
    transparent);
  transition: left 0.5s ease;
}

.hardware-section:hover::after {
  left: 100%;
}

.section-avatar {
  box-shadow: 0 2px 6px rgba(var(--v-theme-primary), 0.3) !important;
}

.hardware-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hardware-card {
  flex: 1;
  min-width: 140px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.6);
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  transition: all 0.2s ease;
}

.hardware-card:hover {
  background: rgba(var(--v-theme-surface-variant), 1);
  border-color: rgba(var(--v-theme-primary), 0.8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.2);
}

.hardware-card--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* Dark theme - original styling */
.v-theme--dark .hardware-card--disabled {
  border-color: rgba(var(--v-theme-outline), 0.2) !important;
  background: rgba(0, 0, 0, 0.3) !important;
}

/* Light theme - more contrast */
.v-theme--light .hardware-card--disabled {
  border: 2px solid rgba(0, 0, 0, 0.3) !important;
  background: rgba(0, 0, 0, 0.04) !important;
}

.hardware-card--disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}

.hardware-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.hardware-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hardware-input {
  font-weight: 600;
}

.hardware-input .v-field {
  border-radius: 8px !important;
  font-size: 0.9rem;
}

.hardware-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-right: 46px;
}

.control-btn {
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
}

.hardware-input-compact {
  flex: 1;
  max-width: 70px;
}

.hardware-input-compact .v-field {
  border-radius: 8px !important;
  height: 32px !important;
  min-height: 32px !important;
}

.hardware-input-compact .v-field__input {
  height: 32px !important;
  min-height: 32px !important;
  padding: 0 4px !important;
  display: grid !important;
  place-items: center !important;
}

.hardware-value-display {
  flex: 1;
  max-width: 70px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  background: rgb(var(--v-theme-surface));
}

.hardware-custom-input {
  width: 100%;
  height: 100%;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0 4px;
  margin: 0;
  border: none;
  outline: none;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  border-radius: 8px;
}

.hardware-custom-input:focus {
  outline: none;
}

/* Dark theme support */
.v-theme--dark .hardware-value-display {
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  background: rgba(var(--v-theme-surface), 0.8);
}

/* Deployment Slider Styling */
.deployment-slider-container {
  padding: 0;
}

.slider-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 4px;
  padding-right: 8px;
}

.instances-chip {
  font-size: 0.8rem !important;
  height: 24px !important;
  border-radius: 12px !important;
  padding: 0 10px !important;
}

.slider-wrapper {
  padding: 0 8px;
  margin: 0;
}

.deployment-slider {
  margin: 0;
}

.deployment-slider .v-slider-track__fill {
  background: rgb(var(--v-theme-primary)) !important;
}

.deployment-slider .v-slider-thumb {
  background: rgb(var(--v-theme-primary)) !important;
  border: 2px solid white !important;
  box-shadow: 0 2px 6px rgba(var(--v-theme-primary), 0.25) !important;
  width: 16px !important;
  height: 16px !important;
}

.deployment-slider .v-slider-track {
  height: 3px !important;
  border-radius: 1.5px !important;
}

.deployment-slider .v-slider-track__background {
  background: rgba(var(--v-theme-outline), 0.2) !important;
}

/* Dark theme for slider */
.v-theme--dark .deployment-slider .v-slider-thumb {
  border: 2px solid rgba(var(--v-theme-surface), 0.9) !important;
  box-shadow: 0 3px 8px rgba(var(--v-theme-primary), 0.4) !important;
}

.v-theme--dark .deployment-slider .v-slider-track__background {
  background: rgba(var(--v-theme-outline), 0.3) !important;
}

/* Subscription Duration Styling */
.subscription-duration {
  margin-top: 12px;
}

.duration-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.duration-chip {
  min-height: 32px;
  font-size: 0.875rem;
  font-weight: 500;
}

.duration-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.15);
}

/* Dark theme support for hardware cards */
.v-theme--dark .hardware-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.v-theme--dark .hardware-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(var(--v-theme-primary), 0.7);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

.v-theme--light .hardware-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.v-theme--light .hardware-card:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(var(--v-theme-primary), 0.5);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.15);
}


/* Compact Number Input Styling */
.compact-number-input {
  border-radius: 8px !important;
}

.compact-number-input .v-field {
  border-radius: 8px !important;
  background: linear-gradient(145deg,
    rgba(var(--v-theme-surface), 0.9) 0%,
    rgba(var(--v-theme-primary), 0.02) 100%) !important;
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.15) !important;
  transition: all 0.2s ease !important;
  height: 32px !important;
  min-height: 32px !important;
}

.compact-number-input .v-field__input {
  padding: 0 8px !important;
  font-weight: 600 !important;
  font-size: 0.85rem !important;
  text-align: center !important;
}

.compact-number-input .v-field--focused {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(var(--v-theme-primary), 0.3),
    0 2px 4px rgba(var(--v-theme-primary), 0.15) !important;
}

/* Compact Number Input Controls */
.compact-number-input input[type="number"]::-webkit-outer-spin-button,
.compact-number-input input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
  display: none;
}

.compact-number-input input[type="number"] {
  -moz-appearance: textfield;
  appearance: none;
}

/* Hide all input details and arrows */
.compact-number-input .v-input__details {
  display: none !important;
}

.compact-number-input .v-field__append-inner {
  display: none !important;
}

/* Dark theme for compact inputs */
.v-theme--dark .compact-number-input .v-field {
  background: linear-gradient(145deg,
    rgba(var(--v-theme-surface), 0.8) 0%,
    rgba(var(--v-theme-primary), 0.04) 100%) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.2) !important;
}

.v-theme--dark .hardware-section {
  background: linear-gradient(135deg,
    rgba(var(--v-theme-surface), 0.8) 0%,
    rgba(var(--v-theme-primary), 0.15) 50%,
    rgba(var(--v-theme-secondary), 0.12) 100%) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.4) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 4px 16px rgba(var(--v-theme-primary), 0.15),
    0 2px 8px rgba(0, 0, 0, 0.2) !important;
}


.alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.alert-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.alert-text {
  flex: 1;
  line-height: 1.4;
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .install-dialog .v-overlay__content {
    margin: 16px;
  }

  .step-container {
    padding: 2px 12px 12px 12px;
  }

  .install-header {
    padding: 6px 10px;
  }

  .steps-container {
    gap: 4px;
  }

  .step-circle {
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
  }

  .step-circle .v-icon {
    font-size: 18px !important;
    width: 18px !important;
    height: 18px !important;
  }

  .step-label {
    font-size: 0.65rem;
  }

  .step-progress-section {
    padding: 12px 10px 6px 10px;
  }

  .step-connector {
    top: 14px;
    left: calc(50% + 12px);
    width: calc(100% - 24px);
  }

  .hardware-grid {
    flex-direction: column;
  }

  .hardware-card {
    min-width: 100%;
    flex: none;
  }

  .subscription-duration {
    display: flex;
    justify-content: center;
  }

  .duration-chips {
    gap: 6px;
    justify-content: center !important;
  }

  .duration-chip {
    font-size: 0.75rem !important;
    min-height: 28px !important;
    padding: 0 10px !important;
  }

  .install-actions {
    padding: 10px 12px;
  }

  .action-btn {
    height: 28px !important;
    font-size: 0.75rem !important;
  }

  /* Payment method mobile layout */
  .payment-method-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .payment-method-info {
    width: 100%;
  }

  .payment-method-price {
    width: 100%;
    text-align: right;
    margin-left: 0;
    padding-right: 8px;
  }

  .payment-method-content {
    padding: 8px 8px !important;
  }


  .no-params {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .hardware-chips, .deployment-chips, .payment-chips, .summary-chips {
    justify-content: center;
  }

  .modern-section {
    padding: 10px;
  }

  .hardware-section {
    padding: 6px !important;
  }

  .hardware-section .section-header {
    gap: 6px;
    margin-bottom: 4px;
  }

  .hardware-inputs {
    gap: 6px;
  }

  .hardware-display {
    padding: 6px;
  }

  .compact-number-input .v-field {
    height: 28px !important;
    min-height: 28px !important;
  }

  .compact-number-input .v-field__input {
    font-size: 0.8rem !important;
    padding: 0 6px !important;
  }

  .app-name {
    font-size: 0.8rem;
  }

  .app-info {
    gap: 8px;
  }

  .close-btn {
    margin-left: 8px;
  }
}

/* Geolocation section styles */
.geolocation-section {
  padding: 20px;
}

.geolocation-content {
  max-width: 100%;
}

.geolocation-card {
  background: rgba(var(--v-theme-surface), 0.7);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-radius: 12px;
  padding: 20px;
  height: 100%;
  backdrop-filter: blur(10px);
}

.geolocation-title {
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
}

.geolocation-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.geolocation-select {
  min-height: 40px;
}

.geolocation-select :deep(.v-field) {
  align-items: center !important;
}

.geolocation-select :deep(.v-field__field) {
  align-items: center !important;
  height: 40px !important;
  display: flex !important;
}

.geolocation-select :deep(.v-field__input) {
  align-items: center !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 0 !important;
  min-height: 40px !important;
  display: flex !important;
  line-height: 40px !important;
}

.geolocation-select :deep(.v-field__prepend-inner) {
  align-items: center !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 0 !important;
  height: 40px !important;
  display: flex !important;
}

.geolocation-select :deep(.v-input__control) {
  min-height: 40px !important;
  display: flex !important;
  align-items: center !important;
}

.geolocation-select :deep(.v-select__selection) {
  align-items: center !important;
  line-height: 40px !important;
}

.geolocation-select :deep(.v-select__selection-text) {
  align-items: center !important;
  line-height: 40px !important;
  display: flex !important;
}

.geolocation-select :deep(.v-field__overlay) {
  height: 40px !important;
}

.geolocation-select :deep(.v-field__outline) {
  height: 40px !important;
}

.geolocation-select :deep(.v-field__outline__start) {
  height: 40px !important;
}

.geolocation-select :deep(.v-field__outline__end) {
  height: 40px !important;
}

.deployment-title {
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  margin: 0 !important;
  color: rgba(var(--v-theme-on-surface), 0.87) !important;
}

.current-rules-title {
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  color: rgba(var(--v-theme-on-surface), 0.87) !important;
  display: flex !important;
  align-items: center !important;
}

.geolocation-step {
  padding-top: 0px !important;
  margin-top: 0px !important;
}

.geolocation-step .geolocation-section {
  margin-top: 0px !important;
  padding-top: 0px !important;
}

.geolocation-step .section-header {
  margin-top: 0px !important;
  padding-top: 0px !important;
}

.email-step {
  padding-top: 0px !important;
  margin-top: 0px !important;
}

.email-step .email-section {
  margin-top: 0px !important;
  padding-top: 0px !important;
}

.email-step .section-header {
  margin-top: 0px !important;
  padding-top: 0px !important;
}

.email-title {
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  margin: 0 !important;
  color: rgba(var(--v-theme-on-surface), 0.87) !important;
}

.notification-subtitle {
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  margin: 0 0 8px 0 !important;
  color: rgba(var(--v-theme-on-surface), 0.7) !important;
  display: flex !important;
  align-items: center !important;
}

.node-count-chip {
  font-weight: 600 !important;
}

.geolocation-dropdown-item {
  padding: 8px 16px !important;
}

.alert-content p {
  margin-bottom: 8px;
  font-weight: 600;
}

.alert-list {
  margin: 0;
  padding-left: 16px;
}

.alert-list li {
  margin-bottom: 4px;
  line-height: 1.4;
}

/* Email section styles */
.email-section {
  padding: 20px;
}

.email-content {
  max-width: 100%;
}

.email-card {
  background: rgba(var(--v-theme-surface), 0.7);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
}

.email-title {
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
}

.email-control {
  margin-bottom: 16px;
}

.email-input {
  max-width: 100%;
}

.notification-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: rgba(var(--v-theme-info), 0.1);
  border-radius: 8px;
  border-left: 3px solid rgba(var(--v-theme-info), 0.5);
}

.info-item span {
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-size: 0.875rem;
  line-height: 1.4;
}

/* Mobile adjustments for new steps */
@media (max-width: 600px) {
  .geolocation-card,
  .email-card {
    padding: 16px;
  }

  .geolocation-title,
  .email-title {
    font-size: 0.9rem;
  }

  .control-label {
    font-size: 0.8rem;
  }

  .info-item span {
    font-size: 0.8rem;
  }

  .alert-list {
    padding-left: 12px;
  }
}
</style>

<style>
/* Fix VSelect menu z-index in install dialog */
.install-dialog-select-menu {
  z-index: 9999 !important;
}

/* Popup dialog button hover effects */
.popup-dialog-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.popup-dialog-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.popup-dialog-btn:hover::before {
  opacity: 1;
}

.popup-dialog-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>