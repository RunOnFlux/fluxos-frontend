<template>
  <div class="orbit-registration">
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardText>
            <!-- Check if user is logged in -->
            <div v-if="!isLoggedIn">
              <VRow>
                <VCol cols="12" md="8" lg="6" class="mx-auto">
                  <div class="text-center py-8">
                    <!-- Icon Container -->
                    <div class="d-flex justify-center mb-3">
                      <VAvatar
                        size="120"
                        color="primary"
                        variant="tonal"
                        class="elevation-3 auth-icon-container"
                      >
                        <VIcon size="60" color="primary" class="auth-icon">
                          mdi-rocket-launch
                        </VIcon>
                      </VAvatar>
                    </div>

                    <h1 class="text-h4 font-weight-bold mb-3">
                      {{ t('menu.application.signInRequired') }}
                    </h1>

                    <p class="text-body-1 text-medium-emphasis mb-8 px-4">
                      {{ t('pages.apps.register.orbit.signIn.description') }}
                    </p>

                    <!-- Features List -->
                    <div class="d-flex justify-center mb-8">
                      <div style="display: inline-block;">
                        <div class="d-sm-flex">
                          <div class="mr-sm-8">
                            <div class="d-flex align-center mb-2">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">{{ t('pages.apps.register.orbit.signIn.noDockerNeeded') }}</span>
                            </div>
                            <div class="d-flex align-center mb-2">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">{{ t('pages.apps.register.orbit.signIn.frameworksSupported') }}</span>
                            </div>
                          </div>
                          <div>
                            <div class="d-flex align-center mb-2">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">{{ t('pages.apps.register.orbit.signIn.builtInCicd') }}</span>
                            </div>
                            <div class="d-flex align-center">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">{{ t('pages.apps.register.orbit.signIn.freeTierAvailable') }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="d-flex flex-column flex-sm-row justify-center gap-2">
                      <VBtn
                        color="primary"
                        variant="flat"
                        @click="openLoginBottomSheet"
                      >
                        <VIcon size="22" class="mr-2">mdi-login-variant</VIcon>
                        {{ t('menu.application.signIn') }}
                      </VBtn>
                      <VBtn
                        variant="flat"
                        :to="{ name: 'apps-register' }"
                      >
                        <VIcon size="22" class="mr-2">mdi-arrow-left</VIcon>
                        {{ t('pages.apps.register.orbit.signIn.backToOptions') }}
                      </VBtn>
                    </div>
                  </div>
                </VCol>
              </VRow>
            </div>

            <!-- Show Orbit setup form if logged in -->
            <div v-else class="orbit-setup">
              <!-- Header -->
              <div class="orbit-header">
                <VBtn
                  variant="text"
                  size="small"
                  :to="{ name: 'apps-register' }"
                  class="back-btn"
                >
                  <VIcon start>mdi-arrow-left</VIcon>
                  {{ t('pages.apps.register.orbit.header.backToDeploymentOptions') }}
                </VBtn>
                <div class="orbit-header-content">
                  <VIcon size="32" color="primary" class="mr-3">mdi-rocket-launch</VIcon>
                  <div>
                    <h1 class="orbit-title">{{ t('pages.apps.register.orbit.header.deployWithOrbit') }}</h1>
                    <p class="orbit-subtitle">{{ t('pages.apps.register.orbit.header.connectAndDeploy') }}</p>
                  </div>
                </div>
              </div>

              <!-- Stepper -->
              <VStepper
                v-model="currentStep"
                :items="stepItems"
                alt-labels
                class="orbit-stepper"
              >
                <!-- Step 2: Repository -->
                <template #item.2>
                  <div class="step-content">
                    <h3 class="step-title">{{ t('pages.apps.register.orbit.repository.stepTitle') }}</h3>
                    <p class="step-description">
                      {{ t('pages.apps.register.orbit.repository.stepDescription') }}
                    </p>

                    <VForm ref="repoForm" @submit.prevent="nextStep">
                      <VTextField
                        v-model="repoUrl"
                        :label="t('pages.apps.register.orbit.repository.repoUrlLabel')"
                        :placeholder="t('pages.apps.register.orbit.repository.repoUrlPlaceholder')"
                        prepend-inner-icon="mdi-github"
                        :rules="[rules.required, rules.validRepoUrl]"
                        variant="outlined"
                        class="mb-2"
                        :hint="t('pages.apps.register.orbit.repository.repoUrlHint')"
                        persistent-hint
                        :loading="repoCheckStatus === 'checking'"
                      />

                      <!-- Repository Status Badges -->
                      <div v-if="repoCheckStatus !== 'idle'" class="repo-status-badges mb-4">
                        <!-- Checking -->
                        <VChip v-if="repoCheckStatus === 'checking'" color="info" variant="tonal" size="small">
                          <VProgressCircular indeterminate size="14" width="2" class="mr-2" />
                          {{ t('pages.apps.register.orbit.repository.checkingRepository') }}
                        </VChip>

                        <!-- Public repo -->
                        <VChip v-else-if="repoCheckStatus === 'public'" color="success" variant="tonal" size="small">
                          <VIcon start size="16">mdi-lock-open</VIcon>
                          {{ t('pages.apps.register.orbit.repository.publicRepository') }}
                        </VChip>

                        <!-- Private repo -->
                        <VChip v-else-if="repoCheckStatus === 'private'" color="warning" variant="tonal" size="small">
                          <VIcon start size="16">mdi-lock</VIcon>
                          {{ t('pages.apps.register.orbit.repository.privateRepoAuth') }}
                        </VChip>

                        <!-- Error -->
                        <VChip v-else-if="repoCheckStatus === 'error'" color="error" variant="tonal" size="small">
                          <VIcon start size="16">mdi-alert-circle</VIcon>
                          {{ repoCheckError || t('pages.apps.register.orbit.repository.errorCheckingRepo') }}
                        </VChip>

                        <!-- Provider badge -->
                        <VChip v-if="detectedProvider && repoCheckStatus !== 'checking'" :color="providerColor" variant="tonal" size="small" class="ml-2">
                          <VIcon start :icon="providerIcon" size="16" />
                          {{ detectedProvider }}
                        </VChip>

                        <!-- Framework detected badge -->
                        <VChip v-if="detectedFramework" color="primary" variant="tonal" size="small" class="ml-2">
                          <VIcon start size="16">mdi-auto-fix</VIcon>
                          {{ detectedFramework }} {{ t('pages.apps.register.orbit.repository.detected') }}
                        </VChip>
                      </div>

                      <!-- Private Repository Authentication (only shown when needed) -->
                      <VExpandTransition>
                        <div v-if="repoCheckStatus === 'private'" class="private-repo-auth mb-4">
                          <VAlert type="warning" variant="tonal" density="compact" class="mb-4">
                            <template #prepend>
                              <VIcon>mdi-lock</VIcon>
                            </template>
                            <div>
                              <strong>{{ t('pages.apps.register.orbit.repository.privateRepoDetected') }}</strong>
                              <p class="text-body-2 mb-0 mt-1">
                                {{ t('pages.apps.register.orbit.repository.privateRepoMessage') }}
                              </p>
                            </div>
                          </VAlert>

                          <!-- Enterprise Features Info -->
                          <VCard variant="outlined" class="mb-4 enterprise-info-card">
                            <VCardText class="py-3">
                              <div class="d-flex align-center mb-2">
                                <VIcon color="warning" class="mr-2">mdi-shield-lock</VIcon>
                                <span class="text-subtitle-2 font-weight-medium">{{ t('pages.apps.register.orbit.repository.enterpriseFeatures') }}</span>
                              </div>
                              <ul class="text-body-2 text-medium-emphasis enterprise-features-list mb-3">
                                <li>
                                  <VIcon size="14" color="success" class="mr-1">mdi-check</VIcon>
                                  {{ t('pages.apps.register.orbit.repository.enterpriseFeature1') }}
                                </li>
                                <li>
                                  <VIcon size="14" color="success" class="mr-1">mdi-check</VIcon>
                                  {{ t('pages.apps.register.orbit.repository.enterpriseFeature2') }}
                                </li>
                                <li>
                                  <VIcon size="14" color="success" class="mr-1">mdi-check</VIcon>
                                  {{ t('pages.apps.register.orbit.repository.enterpriseFeature3') }}
                                </li>
                              </ul>
                              <VDivider class="mb-3" />
                              <div class="d-flex align-center">
                                <VIcon size="16" color="info" class="mr-2">mdi-information</VIcon>
                                <span class="text-caption text-medium-emphasis">
                                  {{ t('pages.apps.register.orbit.repository.enterprisePricing') }}
                                </span>
                              </div>
                            </VCardText>
                          </VCard>

                          <VTextField
                            v-model="repoUsername"
                            :label="t('pages.apps.register.orbit.repository.usernameLabel')"
                            :placeholder="t('pages.apps.register.orbit.repository.usernamePlaceholder')"
                            prepend-inner-icon="mdi-account"
                            variant="outlined"
                            class="mb-3"
                            :hint="t('pages.apps.register.orbit.repository.usernameHint')"
                            persistent-hint
                          />
                          <VTextField
                            v-model="repoToken"
                            :label="t('pages.apps.register.orbit.repository.tokenLabel')"
                            :placeholder="t('pages.apps.register.orbit.repository.tokenPlaceholder')"
                            prepend-inner-icon="mdi-key"
                            :type="showToken ? 'text' : 'password'"
                            :append-inner-icon="showToken ? 'mdi-eye-off' : 'mdi-eye'"
                            variant="outlined"
                            :rules="repoCheckStatus === 'private' ? [rules.required] : []"
                            :hint="t('pages.apps.register.orbit.repository.tokenHint')"
                            persistent-hint
                            @click:append-inner="showToken = !showToken"
                          />

                          <!-- Test Connection Button -->
                          <div class="test-connection-section mt-4">
                            <VBtn
                              color="primary"
                              variant="outlined"
                              :loading="authTestStatus === 'testing'"
                              :disabled="!repoToken"
                              :class="{ 'test-connection-highlight': showTestConnectionHighlight }"
                              @click="testAuthConnection"
                            >
                              <VIcon start>mdi-connection</VIcon>
                              {{ t('pages.apps.register.orbit.repository.testConnection') }}
                            </VBtn>

                            <!-- Auth test status -->
                            <div v-if="authTestStatus === 'success'" class="auth-test-result mt-3">
                              <VAlert type="success" variant="tonal" density="compact">
                                <template #prepend>
                                  <VIcon>mdi-check-circle</VIcon>
                                </template>
                                <strong>{{ t('pages.apps.register.orbit.repository.connectionSuccess') }}</strong> {{ t('pages.apps.register.orbit.repository.connectionVerified') }}
                              </VAlert>
                            </div>

                            <div v-else-if="authTestStatus === 'error'" class="auth-test-result mt-3">
                              <VAlert type="error" variant="tonal" density="compact">
                                <template #prepend>
                                  <VIcon>mdi-alert-circle</VIcon>
                                </template>
                                {{ authTestError }}
                              </VAlert>
                            </div>
                          </div>
                        </div>
                      </VExpandTransition>

                      <!-- Branch Selection & Project Path - Only shown after repo data is collected -->
                      <VExpandTransition>
                        <div v-if="showBranchAndProjectFields">
                          <!-- Branch & Project Path in two-column layout (when not monorepo) -->
                          <VRow v-if="!detectingMonorepo && !(isMonorepo && monorepoProjects.length > 0)">
                            <VCol cols="12" md="6">
                              <!-- Branch Selection -->
                              <VAutocomplete
                                v-model="branch"
                                :items="branchItems"
                                item-title="title"
                                item-value="value"
                                :label="t('pages.apps.register.orbit.repository.branchLabel')"
                                :placeholder="t('pages.apps.register.orbit.repository.branchPlaceholder')"
                                prepend-inner-icon="mdi-source-branch"
                                variant="outlined"
                                :loading="branchesLoading"
                                :no-data-text="branchesLoading ? t('pages.apps.register.orbit.repository.loadingBranches') : t('pages.apps.register.orbit.repository.noBranchesFound')"
                                clearable
                                auto-select-first
                              >
                                <template #item="{ props: itemProps, item }">
                                  <VListItem v-bind="itemProps">
                                    <template #prepend>
                                      <VIcon
                                        :color="item.raw.isDefault ? 'primary' : 'default'"
                                        size="small"
                                      >
                                        {{ item.raw.isDefault ? 'mdi-star' : 'mdi-source-branch' }}
                                      </VIcon>
                                    </template>
                                    <template #append>
                                      <VChip
                                        v-if="item.raw.isDefault"
                                        size="x-small"
                                        color="primary"
                                        variant="tonal"
                                      >
                                        {{ t('pages.apps.register.orbit.repository.default') }}
                                      </VChip>
                                    </template>
                                  </VListItem>
                                </template>
                                <template #details>
                                  <div class="d-flex align-center flex-wrap gap-2">
                                    <span v-if="branches.length > 0" class="text-caption">
                                      {{ branches.length }} {{ t('pages.apps.register.orbit.repository.branchesAvailable') }}
                                    </span>
                                    <span v-else class="text-caption">
                                      {{ t('pages.apps.register.orbit.repository.defaultMain') }}
                                    </span>
                                  </div>
                                </template>
                              </VAutocomplete>
                            </VCol>
                            <VCol cols="12" md="6">
                              <!-- Project Path -->
                              <VTextField
                                v-model="projectPath"
                                :label="t('pages.apps.register.orbit.repository.projectPathLabel')"
                                :placeholder="t('pages.apps.register.orbit.repository.projectPathPlaceholder')"
                                prepend-inner-icon="mdi-folder"
                                :hint="t('pages.apps.register.orbit.repository.projectPathHint')"
                                persistent-hint
                                variant="outlined"
                              />
                            </VCol>
                          </VRow>

                          <!-- Monorepo Detection & Project Selection -->
                          <div v-else class="monorepo-section mb-4">
                            <!-- Loading state -->
                            <div v-if="detectingMonorepo" class="monorepo-loading">
                              <VProgressCircular indeterminate size="20" width="2" class="mr-2" />
                              <span class="text-body-2">{{ t('pages.apps.register.orbit.repository.detectingMonorepo') }}</span>
                            </div>

                            <!-- Monorepo detected with projects -->
                            <div v-else-if="isMonorepo && monorepoProjects.length > 0">
                              <!-- Branch Selection (full width when monorepo) -->
                              <VAutocomplete
                                v-model="branch"
                                :items="branchItems"
                                item-title="title"
                                item-value="value"
                                :label="t('pages.apps.register.orbit.repository.branchLabel')"
                                :placeholder="t('pages.apps.register.orbit.repository.branchPlaceholder')"
                                prepend-inner-icon="mdi-source-branch"
                                variant="outlined"
                                class="mb-4"
                                :loading="branchesLoading"
                                :no-data-text="branchesLoading ? t('pages.apps.register.orbit.repository.loadingBranches') : t('pages.apps.register.orbit.repository.noBranchesFound')"
                                clearable
                                auto-select-first
                              >
                                <template #item="{ props: itemProps, item }">
                                  <VListItem v-bind="itemProps">
                                    <template #prepend>
                                      <VIcon
                                        :color="item.raw.isDefault ? 'primary' : 'default'"
                                        size="small"
                                      >
                                        {{ item.raw.isDefault ? 'mdi-star' : 'mdi-source-branch' }}
                                      </VIcon>
                                    </template>
                                    <template #append>
                                      <VChip
                                        v-if="item.raw.isDefault"
                                        size="x-small"
                                        color="primary"
                                        variant="tonal"
                                      >
                                        {{ t('pages.apps.register.orbit.repository.default') }}
                                      </VChip>
                                    </template>
                                  </VListItem>
                                </template>
                                <template #details>
                                  <div class="d-flex align-center flex-wrap gap-2">
                                    <span v-if="branches.length > 0" class="text-caption">
                                      {{ branches.length }} {{ t('pages.apps.register.orbit.repository.branchesAvailable') }}
                                    </span>
                                    <span v-else class="text-caption">
                                      {{ t('pages.apps.register.orbit.repository.defaultMain') }}
                                    </span>
                                  </div>
                                </template>
                              </VAutocomplete>

                              <VAlert type="info" variant="tonal" density="compact" class="mb-3">
                                <template #prepend>
                                  <VIcon>mdi-folder-multiple</VIcon>
                                </template>
                                <div class="d-flex align-center flex-wrap gap-2">
                                  <span><strong>{{ t('pages.apps.register.orbit.repository.monorepoDetected') }}</strong></span>
                                  <VChip size="x-small" color="primary" variant="flat">
                                    {{ monorepoType }}
                                  </VChip>
                                  <span class="text-body-2">{{ monorepoProjects.length }} {{ t('pages.apps.register.orbit.repository.projectsFound') }}</span>
                                </div>
                              </VAlert>

                              <p class="text-body-2 mb-2">{{ t('pages.apps.register.orbit.repository.selectProject') }}</p>

                              <div class="monorepo-projects">
                                <div
                                  v-for="project in monorepoProjects"
                                  :key="project.path"
                                  class="monorepo-project-card"
                                  :class="{ 'selected': projectPath === project.path }"
                                  @click="selectMonorepoProject(project)"
                                >
                                  <div class="project-header">
                                    <VRadio
                                      :model-value="projectPath"
                                      :value="project.path"
                                      hide-details
                                      density="compact"
                                      @click.stop="selectMonorepoProject(project)"
                                    />
                                    <div class="project-info">
                                      <div class="project-name">
                                        {{ project.name || project.path }}
                                        <VChip v-if="project.framework" size="x-small" color="primary" variant="tonal" class="ml-2">
                                          {{ project.framework }}
                                        </VChip>
                                      </div>
                                      <div class="project-path text-caption text-medium-emphasis">
                                        {{ project.path }}
                                      </div>
                                    </div>
                                  </div>
                                  <div v-if="project.description" class="project-description text-body-2 text-medium-emphasis">
                                    {{ project.description }}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </VExpandTransition>
                    </VForm>
                  </div>
                </template>

                <!-- Step 3: Configuration -->
                <template #item.3>
                  <div class="step-content">
                    <h3 class="step-title">{{ t('pages.apps.register.orbit.config.stepTitle') }}</h3>
                    <p class="step-description">
                      {{ t('pages.apps.register.orbit.config.stepDescription') }}
                    </p>

                    <VForm ref="configForm">
                      <VRow class="mb-4">
                        <VCol cols="12" md="6">
                          <VTextField
                            v-model="appName"
                            :label="t('pages.apps.register.orbit.config.appNameLabel')"
                            :placeholder="t('pages.apps.register.orbit.config.appNamePlaceholder')"
                            prepend-inner-icon="mdi-application"
                            :rules="[rules.required, rules.appName]"
                            variant="outlined"
                            :hint="t('pages.apps.register.orbit.config.appNameHint')"
                            persistent-hint
                          />
                        </VCol>
                        <VCol cols="12" md="6">
                          <VTextField
                            v-model="contactEmail"
                            :label="t('pages.apps.register.orbit.config.contactEmailLabel')"
                            :placeholder="t('pages.apps.register.orbit.config.contactEmailPlaceholder')"
                            prepend-inner-icon="mdi-email"
                            type="email"
                            :rules="[rules.required, rules.email]"
                            variant="outlined"
                            :hint="t('pages.apps.register.orbit.config.contactEmailHint')"
                            persistent-hint
                          />
                        </VCol>
                      </VRow>

                      <VRow class="mb-4">
                        <VCol cols="12" md="6">
                          <VTextField
                            v-model="appPort"
                            :label="t('pages.apps.register.orbit.config.appPortLabel')"
                            :placeholder="t('pages.apps.register.orbit.config.appPortPlaceholder')"
                            prepend-inner-icon="mdi-lan-connect"
                            type="number"
                            :rules="[rules.required, rules.port]"
                            variant="outlined"
                            :hint="t('pages.apps.register.orbit.config.portListensOn')"
                            persistent-hint
                          />
                        </VCol>
                        <VCol cols="12" md="6">
                          <VTextField
                            v-model="customDomain"
                            :label="`${t('pages.apps.register.orbit.config.customDomainLabel')} (${t('common.labels.optional')})`"
                            :placeholder="t('pages.apps.register.orbit.config.customDomainPlaceholder')"
                            prepend-inner-icon="mdi-web"
                            variant="outlined"
                            :hint="t('pages.apps.register.orbit.config.customDomainHint')"
                            persistent-hint
                          />
                        </VCol>
                      </VRow>

                      <!-- Custom Plan Resources Configuration -->
                      <div v-if="selectedPlan === 'custom'" class="custom-resources-section mb-4">
                        <VCard variant="outlined" class="custom-resources-card">
                          <VCardTitle class="d-flex align-center gap-2">
                            <VIcon color="info">mdi-tune-variant</VIcon>
                            {{ t('pages.apps.register.orbit.config.customResourcesTitle') }}
                          </VCardTitle>
                          <VCardText>
                            <VAlert type="info" variant="tonal" density="compact" class="mb-4">
                              {{ t('pages.apps.register.orbit.config.customResourcesInfo') }}
                            </VAlert>

                            <!-- CPU Slider -->
                            <div class="resource-config-row mb-4">
                              <div class="resource-config-header">
                                <VIcon class="resource-icon" size="20" color="primary">mdi-speedometer</VIcon>
                                <span class="resource-config-label">{{ t('pages.apps.register.orbit.config.cpuLabel') }}</span>
                                <VChip size="small" color="primary" variant="flat" class="resource-config-value">
                                  {{ customPlanResources.cpu }} vCores
                                </VChip>
                              </div>
                              <VSlider
                                v-model="customPlanResources.cpu"
                                :min="0.1"
                                :max="15"
                                :step="0.1"
                                hide-details
                                color="primary"
                                class="resource-slider"
                              />
                            </div>

                            <!-- RAM Slider -->
                            <div class="resource-config-row mb-4">
                              <div class="resource-config-header">
                                <VIcon class="resource-icon" size="20" color="success">mdi-memory</VIcon>
                                <span class="resource-config-label">{{ t('pages.apps.register.orbit.config.ramLabel') }}</span>
                                <VChip size="small" color="success" variant="flat" class="resource-config-value">
                                  {{ customPlanResources.ram }} MB
                                </VChip>
                              </div>
                              <VSlider
                                v-model="customPlanResources.ram"
                                :min="100"
                                :max="59000"
                                :step="100"
                                hide-details
                                color="success"
                                class="resource-slider"
                              />
                            </div>

                            <!-- Storage Slider -->
                            <div class="resource-config-row mb-4">
                              <div class="resource-config-header">
                                <VIcon class="resource-icon" size="20" color="warning">mdi-harddisk</VIcon>
                                <span class="resource-config-label">{{ t('pages.apps.register.orbit.config.storageLabel') }}</span>
                                <VChip size="small" color="warning" variant="flat" class="resource-config-value">
                                  {{ customPlanResources.storage }} GB
                                </VChip>
                              </div>
                              <VSlider
                                v-model="customPlanResources.storage"
                                :min="1"
                                :max="820"
                                :step="1"
                                hide-details
                                color="warning"
                                class="resource-slider"
                              />
                            </div>

                            <!-- Instances Slider -->
                            <div class="resource-config-row mb-4">
                              <div class="resource-config-header">
                                <VIcon class="resource-icon" size="20" color="info">mdi-server-network</VIcon>
                                <span class="resource-config-label">{{ t('pages.apps.register.orbit.config.instancesLabel') }}</span>
                                <VChip size="small" color="info" variant="flat" class="resource-config-value">
                                  {{ customPlanResources.instances }} {{ customPlanResources.instances === 1 ? 'instance' : 'instances' }}
                                </VChip>
                              </div>
                              <VSlider
                                v-model="customPlanResources.instances"
                                :min="1"
                                :max="3"
                                :step="1"
                                hide-details
                                color="info"
                                class="resource-slider"
                              />
                            </div>

                            <!-- Price Display -->
                            <div class="custom-price-display">
                              <div v-if="customPlanPriceLoading" class="price-loading">
                                <VProgressCircular indeterminate size="20" width="2" class="mr-2" />
                                {{ t('pages.costCalculator.calculating') }}
                              </div>
                              <div v-else-if="customPlanPrice?.usd" class="price-result">
                                <div class="price-after-free">
                                  <VIcon size="18" color="success" class="mr-1">mdi-gift-outline</VIcon>
                                  {{ t('pages.apps.register.orbit.pricing.priceAfterFirstMonth') }}
                                </div>
                                <div class="price-amount-large">
                                  ${{ customPlanMonthlyPrice }}
                                  <span class="price-period-small">/ {{ t('common.labels.monthly') }}</span>
                                </div>
                                <div v-if="customPlanPrice.flux" class="price-flux">
                                  {{ customPlanPrice.flux }} FLUX
                                  <VChip v-if="customPlanPrice.fluxDiscount > 0" size="x-small" color="success" class="ml-1">
                                    -{{ customPlanPrice.fluxDiscount }}%
                                  </VChip>
                                </div>
                              </div>
                              <div v-else-if="customPlanPriceError" class="price-error">
                                <VIcon size="18" color="error" class="mr-1">mdi-alert-circle</VIcon>
                                {{ customPlanPriceError }}
                              </div>
                            </div>
                          </VCardText>
                        </VCard>
                      </div>

                      <!-- Advanced Options Toggle -->
                      <div class="advanced-options-toggle mb-4">
                        <VCheckbox
                          v-model="showAdvancedOptions"
                          :label="t('pages.apps.register.orbit.config.showAdvancedOptions')"
                          hide-details
                          density="compact"
                        >
                          <template #label>
                            <span class="d-flex align-center">
                              <VIcon start size="18">mdi-cog-outline</VIcon>
                              {{ t('pages.apps.register.orbit.config.showAdvancedOptions') }}
                            </span>
                          </template>
                        </VCheckbox>
                      </div>

                      <!-- Advanced Options Section -->
                      <div v-show="showAdvancedOptions" class="advanced-options-section">
                        <VSelect
                          v-model="pollingInterval"
                          :items="pollingIntervalOptions"
                          :label="t('pages.apps.register.orbit.config.pollingIntervalLabel')"
                          prepend-inner-icon="mdi-update"
                          variant="outlined"
                          class="mb-4"
                          :hint="t('pages.apps.register.orbit.config.pollingIntervalHint')"
                          persistent-hint
                        />

                        <!-- Runtime Version Selection -->
                        <VExpansionPanels class="mb-4">
                          <VExpansionPanel>
                            <VExpansionPanelTitle>
                              <VIcon start size="20">mdi-cog</VIcon>
                              {{ t('pages.apps.register.orbit.config.runtimeVersionTitle') }}
                            </VExpansionPanelTitle>
                            <VExpansionPanelText>
                              <VAlert type="info" variant="tonal" density="compact" class="mb-4">
                                {{ t('pages.apps.register.orbit.config.runtimeAutoDetect') }}
                              </VAlert>

                              <VSelect
                                v-model="selectedRuntime"
                                :items="runtimeOptions"
                                :label="t('pages.apps.register.orbit.config.runtimeLabel')"
                                prepend-inner-icon="mdi-code-tags"
                                variant="outlined"
                                class="mb-3"
                                clearable
                              />

                              <VTextField
                                v-if="selectedRuntime"
                                v-model="runtimeVersion"
                                :label="`${selectedRuntime} Version`"
                                :placeholder="runtimePlaceholder"
                                prepend-inner-icon="mdi-tag"
                                variant="outlined"
                                :hint="runtimeHint"
                                persistent-hint
                              />
                            </VExpansionPanelText>
                          </VExpansionPanel>
                        </VExpansionPanels>

                        <!-- Custom Environment Variables -->
                        <VExpansionPanels class="mb-4">
                          <VExpansionPanel>
                            <VExpansionPanelTitle>
                              <VIcon start size="20">mdi-variable</VIcon>
                              {{ t('pages.apps.register.orbit.config.envVariablesTitle') }}
                              <span class="text-medium-emphasis text-body-2 ml-1">({{ t('common.labels.optional') }})</span>
                              <VChip v-if="customEnvVars.length > 0" size="x-small" color="primary" class="ml-2">
                                {{ customEnvVars.length }}
                              </VChip>
                            </VExpansionPanelTitle>
                            <VExpansionPanelText>
                              <VAlert type="info" variant="tonal" density="compact" class="mb-4">
                                {{ t('pages.apps.register.orbit.config.envVariablesInfo') }}
                              </VAlert>

                              <!-- Available Orbit Environment Variables -->
                              <div class="orbit-env-vars mb-4">
                                <p class="text-subtitle-2 font-weight-medium mb-2">{{ t('pages.apps.register.orbit.config.availableOrbitVars') }}</p>
                                <div class="orbit-env-list">
                                  <div
                                    v-for="orbitVar in availableOrbitEnvVars"
                                    :key="orbitVar.key"
                                    class="orbit-env-item"
                                    :class="{ 'added': isEnvVarAdded(orbitVar.key) }"
                                    @click="addOrbitEnvVar(orbitVar)"
                                  >
                                    <div class="orbit-env-header">
                                      <code class="orbit-env-key">{{ orbitVar.key }}</code>
                                      <VChip
                                        v-if="isEnvVarAdded(orbitVar.key)"
                                        size="x-small"
                                        color="success"
                                        variant="flat"
                                      >
                                        <VIcon start size="12">mdi-check</VIcon>
                                        {{ t('pages.apps.register.orbit.config.added') }}
                                      </VChip>
                                      <VBtn
                                        v-else
                                        size="x-small"
                                        color="primary"
                                        variant="tonal"
                                        @click.stop="addOrbitEnvVar(orbitVar)"
                                      >
                                        <VIcon start size="14">mdi-plus</VIcon>
                                        {{ t('pages.apps.register.orbit.config.add') }}
                                      </VBtn>
                                    </div>
                                    <p class="orbit-env-description text-caption text-medium-emphasis mb-0">
                                      {{ orbitVar.description }}
                                    </p>
                                    <p v-if="orbitVar.autoValue" class="orbit-env-auto text-caption mb-0">
                                      <VIcon size="12" color="success" class="mr-1">mdi-auto-fix</VIcon>
                                      <span class="text-success font-weight-medium">{{ t('pages.apps.register.orbit.config.ifNotSet') }}</span>
                                      {{ orbitVar.autoValue }}
                                    </p>
                                    <p v-if="orbitVar.example" class="orbit-env-example text-caption mb-0">
                                      {{ t('pages.apps.register.orbit.config.example') }} <code>{{ orbitVar.example }}</code>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <VDivider class="my-4" />

                              <!-- Added Environment Variables -->
                              <p class="text-subtitle-2 font-weight-medium mb-2">
                                {{ t('pages.apps.register.orbit.config.yourEnvVariables') }}
                                <span v-if="customEnvVars.length === 0" class="text-caption text-medium-emphasis">
                                  {{ t('pages.apps.register.orbit.config.noneAddedYet') }}
                                </span>
                              </p>

                              <div v-for="(envVar, index) in customEnvVars" :key="index" class="env-var-row mb-3">
                                <VTextField
                                  v-model="envVar.key"
                                  :label="t('pages.apps.register.orbit.config.keyLabel')"
                                  placeholder="API_KEY"
                                  variant="outlined"
                                  density="compact"
                                  class="env-key"
                                  :readonly="envVar.isOrbitVar"
                                />
                                <VTextField
                                  v-model="envVar.value"
                                  :label="t('pages.apps.register.orbit.config.valueLabel')"
                                  :placeholder="envVar.placeholder || 'your-value'"
                                  variant="outlined"
                                  density="compact"
                                  class="env-value"
                                />
                                <VBtn
                                  icon
                                  variant="text"
                                  color="error"
                                  size="small"
                                  @click="removeEnvVar(index)"
                                >
                                  <VIcon>mdi-delete</VIcon>
                                </VBtn>
                              </div>

                              <VBtn
                                variant="tonal"
                                color="primary"
                                size="small"
                                @click="addEnvVar"
                              >
                                <VIcon start>mdi-plus</VIcon>
                                {{ t('pages.apps.register.orbit.config.addCustomVariable') }}
                              </VBtn>
                            </VExpansionPanelText>
                          </VExpansionPanel>
                        </VExpansionPanels>

                        <!-- Deployment Settings (Geolocation & Custom Domain) -->
                        <VExpansionPanels class="mb-4">
                          <VExpansionPanel>
                            <VExpansionPanelTitle>
                              <VIcon start size="20">mdi-earth</VIcon>
                              {{ t('pages.apps.register.orbit.config.deploymentLocationTitle') }}
                              <span class="text-medium-emphasis text-body-2 ml-1">({{ t('common.labels.optional') }})</span>
                              <VChip
                                v-if="selectedGeo.continent !== 'ALL'"
                                size="x-small"
                                color="primary"
                                class="ml-2"
                              >
                                1
                              </VChip>
                            </VExpansionPanelTitle>
                            <VExpansionPanelText>
                              <VAlert type="info" variant="tonal" density="compact" class="mb-4">
                                {{ t('pages.apps.register.orbit.config.deploymentLocationInfo') }}
                              </VAlert>

                              <!-- Geolocation Selection -->
                              <div class="mb-4">
                                <p class="text-subtitle-2 font-weight-medium mb-2">
                                  <VIcon start size="18">mdi-map-marker</VIcon>
                                  {{ t('pages.apps.register.orbit.config.serverLocation') }}
                                </p>

                                <VRow>
                                  <!-- Allowed Geolocation -->
                                  <VCol cols="12" md="6">
                                    <VCard variant="outlined" class="pa-4">
                                      <h6 class="text-subtitle-2 mb-4 d-flex align-center">
                                        <VIcon icon="mdi-check-circle" color="success" class="mr-2" size="20" />
                                        {{ t('pages.apps.register.orbit.config.allowedLocations') }}
                                      </h6>

                                      <VSelect
                                        v-model="geolocation.allowedContinent"
                                        :items="getContinents().filter(c => c.value !== 'ALL')"
                                        item-title="text"
                                        item-value="value"
                                        :label="t('pages.apps.register.orbit.config.continentLabel')"
                                        prepend-inner-icon="mdi-earth"
                                        variant="outlined"
                                        density="compact"
                                        clearable
                                        class="mb-3"
                                        @update:model-value="geolocation.allowedCountry = null; geolocation.allowedRegion = null"
                                      >
                                        <template #item="{ props, item }">
                                          <VListItem v-bind="props">
                                            <template v-if="item.raw.instances" #append>
                                              <VChip size="x-small" color="success" variant="tonal">
                                                {{ item.raw.instances }}
                                              </VChip>
                                            </template>
                                          </VListItem>
                                        </template>
                                      </VSelect>

                                      <VSelect
                                        v-model="geolocation.allowedCountry"
                                        :items="getAllowedCountries(geolocation.allowedContinent)"
                                        item-title="text"
                                        item-value="value"
                                        :label="t('pages.apps.register.orbit.config.countryLabel')"
                                        prepend-inner-icon="mdi-flag"
                                        variant="outlined"
                                        density="compact"
                                        clearable
                                        :disabled="!geolocation.allowedContinent"
                                        class="mb-3"
                                        @update:model-value="geolocation.allowedRegion = null"
                                      >
                                        <template #item="{ props, item }">
                                          <VListItem v-bind="props">
                                            <template v-if="item.raw.instances" #append>
                                              <VChip size="x-small" color="success" variant="tonal">
                                                {{ item.raw.instances }}
                                              </VChip>
                                            </template>
                                          </VListItem>
                                        </template>
                                      </VSelect>

                                      <VSelect
                                        v-model="geolocation.allowedRegion"
                                        :items="getAllowedRegions(geolocation.allowedContinent, geolocation.allowedCountry)"
                                        item-title="text"
                                        item-value="value"
                                        :label="t('pages.apps.register.orbit.config.regionLabel')"
                                        prepend-inner-icon="mdi-map-marker-radius"
                                        variant="outlined"
                                        density="compact"
                                        clearable
                                        :disabled="!geolocation.allowedCountry"
                                        class="mb-3"
                                      >
                                        <template #item="{ props, item }">
                                          <VListItem v-bind="props">
                                            <template v-if="item.raw.instances" #append>
                                              <VChip size="x-small" color="success" variant="tonal">
                                                {{ item.raw.instances }}
                                              </VChip>
                                            </template>
                                          </VListItem>
                                        </template>
                                      </VSelect>

                                      <div class="d-flex justify-center">
                                        <VBtn
                                          color="success"
                                          variant="outlined"
                                          size="small"
                                          :disabled="!geolocation.allowedContinent"
                                          @click="addAllowedGeolocation"
                                        >
                                          <VIcon icon="mdi-plus" size="16" class="mr-1" />
                                          {{ t('pages.apps.register.orbit.config.addAllowed') }}
                                        </VBtn>
                                      </div>
                                    </VCard>
                                  </VCol>

                                  <!-- Forbidden Geolocation -->
                                  <VCol cols="12" md="6">
                                    <VCard variant="outlined" class="pa-4">
                                      <h6 class="text-subtitle-2 mb-4 d-flex align-center">
                                        <VIcon icon="mdi-close-circle" color="error" class="mr-2" size="20" />
                                        {{ t('pages.apps.register.orbit.config.forbiddenLocations') }}
                                      </h6>

                                      <VSelect
                                        v-model="geolocation.forbiddenContinent"
                                        :items="getContinents().filter(c => c.value !== 'ALL')"
                                        item-title="text"
                                        item-value="value"
                                        :label="t('pages.apps.register.orbit.config.continentLabel')"
                                        prepend-inner-icon="mdi-earth"
                                        variant="outlined"
                                        density="compact"
                                        clearable
                                        class="mb-3"
                                        @update:model-value="geolocation.forbiddenCountry = null; geolocation.forbiddenRegion = null"
                                      >
                                        <template #item="{ props, item }">
                                          <VListItem v-bind="props">
                                            <template v-if="item.raw.instances" #append>
                                              <VChip size="x-small" color="error" variant="tonal">
                                                {{ item.raw.instances }}
                                              </VChip>
                                            </template>
                                          </VListItem>
                                        </template>
                                      </VSelect>

                                      <VSelect
                                        v-model="geolocation.forbiddenCountry"
                                        :items="getForbiddenCountries(geolocation.forbiddenContinent)"
                                        item-title="text"
                                        item-value="value"
                                        :label="t('pages.apps.register.orbit.config.countryLabel')"
                                        prepend-inner-icon="mdi-flag"
                                        variant="outlined"
                                        density="compact"
                                        clearable
                                        :disabled="!geolocation.forbiddenContinent"
                                        class="mb-3"
                                        @update:model-value="geolocation.forbiddenRegion = null"
                                      >
                                        <template #item="{ props, item }">
                                          <VListItem v-bind="props">
                                            <template v-if="item.raw.instances" #append>
                                              <VChip size="x-small" color="error" variant="tonal">
                                                {{ item.raw.instances }}
                                              </VChip>
                                            </template>
                                          </VListItem>
                                        </template>
                                      </VSelect>

                                      <VSelect
                                        v-model="geolocation.forbiddenRegion"
                                        :items="getForbiddenRegions(geolocation.forbiddenContinent, geolocation.forbiddenCountry)"
                                        item-title="text"
                                        item-value="value"
                                        :label="t('pages.apps.register.orbit.config.regionLabel')"
                                        prepend-inner-icon="mdi-map-marker-radius"
                                        variant="outlined"
                                        density="compact"
                                        clearable
                                        :disabled="!geolocation.forbiddenCountry"
                                        class="mb-3"
                                      >
                                        <template #item="{ props, item }">
                                          <VListItem v-bind="props">
                                            <template v-if="item.raw.instances" #append>
                                              <VChip size="x-small" color="error" variant="tonal">
                                                {{ item.raw.instances }}
                                              </VChip>
                                            </template>
                                          </VListItem>
                                        </template>
                                      </VSelect>

                                      <div class="d-flex justify-center">
                                        <VBtn
                                          color="error"
                                          variant="outlined"
                                          size="small"
                                          :disabled="!geolocation.forbiddenContinent"
                                          @click="addForbiddenGeolocation"
                                        >
                                          <VIcon icon="mdi-plus" size="16" class="mr-1" />
                                          {{ t('pages.apps.register.orbit.config.addForbidden') }}
                                        </VBtn>
                                      </div>
                                    </VCard>
                                  </VCol>
                                </VRow>

                                <!-- Current Geolocation Rules -->
                                <div v-if="allowedGeolocations.length > 0 || forbiddenGeolocations.length > 0" class="mt-4">
                                  <h6 class="text-subtitle-2 mb-3 d-flex align-center">
                                    <VIcon icon="mdi-format-list-bulleted" size="18" class="mr-2" />
                                    {{ t('pages.apps.register.orbit.config.currentRules') }}
                                  </h6>

                                  <!-- Allowed Rules -->
                                  <div v-if="allowedGeolocations.length > 0" class="mb-3">
                                    <p class="text-caption text-success mb-2 d-flex align-center">
                                      <VIcon icon="mdi-check-circle" size="16" class="mr-1" />
                                      {{ t('pages.apps.register.orbit.config.allowedLocationsColon') }}
                                    </p>
                                    <div class="d-flex flex-wrap gap-2">
                                      <VChip
                                        v-for="(geo, index) in allowedGeolocations"
                                        :key="'allowed-' + index"
                                        color="success"
                                        variant="tonal"
                                        closable
                                        size="small"
                                        @click:close="removeAllowedGeolocation(index)"
                                      >
                                        <VIcon icon="mdi-check-circle" size="14" class="mr-1" />
                                        {{ formatGeolocationLabel(geo) }}
                                      </VChip>
                                    </div>
                                  </div>

                                  <!-- Forbidden Rules -->
                                  <div v-if="forbiddenGeolocations.length > 0">
                                    <p class="text-caption text-error mb-2 d-flex align-center">
                                      <VIcon icon="mdi-close-circle" size="16" class="mr-1" />
                                      {{ t('pages.apps.register.orbit.config.forbiddenLocationsColon') }}
                                    </p>
                                    <div class="d-flex flex-wrap gap-2">
                                      <VChip
                                        v-for="(geo, index) in forbiddenGeolocations"
                                        :key="'forbidden-' + index"
                                        color="error"
                                        variant="tonal"
                                        closable
                                        size="small"
                                        @click:close="removeForbiddenGeolocation(index)"
                                      >
                                        <VIcon icon="mdi-close-circle" size="14" class="mr-1" />
                                        {{ formatGeolocationLabel(geo) }}
                                      </VChip>
                                    </div>
                                  </div>
                                </div>

                                <p class="text-caption text-medium-emphasis mt-3">
                                  <VIcon size="14" class="mr-1">mdi-information-outline</VIcon>
                                  {{ t('pages.apps.register.orbit.config.selectRegionInfo') }}
                                </p>
                              </div>

                            </VExpansionPanelText>
                          </VExpansionPanel>
                        </VExpansionPanels>
                      </div>
                    </VForm>
                  </div>
                </template>

                <!-- Step 1: Plan Selection -->
                <template #item.1>
                  <div class="step-content">
                    <h3 class="step-title">{{ t('pages.apps.register.orbit.pricing.stepTitle') }}</h3>
                    <p class="step-description">
                      {{ t('pages.apps.register.orbit.pricing.stepDescription') }}
                    </p>

                    <div class="plans-grid">
                      <!-- Free Plan -->
                      <div
                        class="plan-card"
                        :class="{ 'selected': selectedPlan === 'free' }"
                        @click="selectPlanAndContinue('free')"
                      >
                        <div class="plan-price-badge">
                          <span class="price-amount">$0<span class="price-asterisk">*</span></span>
                          <span class="price-period">{{ t('pages.apps.register.orbit.pricing.perMonth') }}</span>
                        </div>

                        <div class="first-month-free-badge">
                          <VIcon size="14">mdi-gift-outline</VIcon>
                          {{ t('pages.apps.register.orbit.pricing.firstMonthFree') }}
                        </div>

                        <div class="plan-header">
                          <h3 class="plan-name">{{ t('pages.apps.register.orbit.pricing.free') }}</h3>
                          <p class="plan-description">{{ t('pages.apps.register.orbit.pricing.freePriceDetail') }}</p>
                        </div>

                        <div class="plan-resources">
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-speedometer</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.cpuLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.freeFeatures.cpu') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-memory</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.ramLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.freeFeatures.ram') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-harddisk</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.storageLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.freeFeatures.storage') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-server-network</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.instancesLabel') }}</span>
                            <span class="resource-value">1</span>
                          </div>
                        </div>

                        <div class="plan-btn-wrapper">
                          <VBtn
                            block
                            :color="selectedPlan === 'free' ? 'success' : 'primary'"
                            size="large"
                            variant="elevated"
                            class="plan-btn"
                            @click.stop="selectPlanAndContinue('free')"
                          >
                            <VIcon start>mdi-rocket-launch</VIcon>
                            {{ t('pages.apps.register.orbit.pricing.startDeploying') }}
                          </VBtn>
                        </div>
                      </div>

                      <!-- Developer Plan -->
                      <div
                        class="plan-card recommended"
                        :class="{ 'selected': selectedPlan === 'developer' }"
                        @click="selectPlanAndContinue('developer')"
                      >
                        <div class="recommended-badge">
                          {{ t('pages.apps.register.orbit.pricing.mostPopular') }}
                        </div>

                        <div class="plan-price-badge">
                          <span class="price-amount">$2.49</span>
                          <span class="price-period">{{ t('pages.apps.register.orbit.pricing.perMonth') }}</span>
                        </div>

                        <div class="first-month-free-badge">
                          <VIcon size="14">mdi-gift-outline</VIcon>
                          {{ t('pages.apps.register.orbit.pricing.firstMonthFree') }}
                        </div>

                        <div class="plan-header">
                          <h3 class="plan-name">{{ t('pages.apps.register.orbit.pricing.developer') }}</h3>
                          <p class="plan-description">{{ t('pages.apps.register.orbit.pricing.developerPriceDetail') }}</p>
                        </div>

                        <div class="plan-resources">
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-speedometer</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.cpuLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.developerFeatures.cpu') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-memory</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.ramLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.developerFeatures.ram') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-harddisk</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.storageLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.developerFeatures.storage') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-server-network</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.instancesLabel') }}</span>
                            <span class="resource-value">2</span>
                          </div>
                        </div>

                        <div class="plan-btn-wrapper">
                          <VBtn
                            block
                            :color="selectedPlan === 'developer' ? 'success' : 'primary'"
                            size="large"
                            variant="elevated"
                            class="plan-btn"
                            @click.stop="selectPlanAndContinue('developer')"
                          >
                            <VIcon start>mdi-gift-outline</VIcon>
                            {{ t('pages.apps.register.orbit.pricing.startFreeTrial') }}
                          </VBtn>
                        </div>
                      </div>

                      <!-- Pro Plan -->
                      <div
                        class="plan-card"
                        :class="{ 'selected': selectedPlan === 'pro' }"
                        @click="selectPlanAndContinue('pro')"
                      >
                        <div class="plan-price-badge">
                          <span class="price-amount">$3.99</span>
                          <span class="price-period">{{ t('pages.apps.register.orbit.pricing.perMonth') }}</span>
                        </div>

                        <div class="first-month-free-badge">
                          <VIcon size="14">mdi-gift-outline</VIcon>
                          {{ t('pages.apps.register.orbit.pricing.firstMonthFree') }}
                        </div>

                        <div class="plan-header">
                          <h3 class="plan-name">{{ t('pages.apps.register.orbit.pricing.pro') }}</h3>
                          <p class="plan-description">{{ t('pages.apps.register.orbit.pricing.proPriceDetail') }}</p>
                        </div>

                        <div class="plan-resources">
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-speedometer</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.cpuLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.proFeatures.cpu') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-memory</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.ramLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.proFeatures.ram') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-harddisk</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.storageLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.proFeatures.storage') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-server-network</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.instancesLabel') }}</span>
                            <span class="resource-value">2</span>
                          </div>
                        </div>

                        <div class="plan-btn-wrapper">
                          <VBtn
                            block
                            :color="selectedPlan === 'pro' ? 'success' : 'primary'"
                            size="large"
                            variant="elevated"
                            class="plan-btn"
                            @click.stop="selectPlanAndContinue('pro')"
                          >
                            <VIcon start>mdi-gift-outline</VIcon>
                            {{ t('pages.apps.register.orbit.pricing.startFreeTrial') }}
                          </VBtn>
                        </div>
                      </div>

                      <!-- Custom Plan -->
                      <div
                        class="plan-card custom-plan"
                        :class="{ 'selected': selectedPlan === 'custom' }"
                        @click="selectPlanAndContinue('custom')"
                      >
                        <div class="custom-badge">
                          {{ t('pages.apps.register.orbit.pricing.customizable') }}
                        </div>

                        <div class="plan-price-badge custom-price-badge">
                          <span class="price-amount price-starting">{{ t('pages.apps.register.orbit.pricing.startingAt') }} $0.99</span>
                          <span class="price-period">{{ t('pages.apps.register.orbit.pricing.perMonth') }}</span>
                        </div>

                        <div class="first-month-free-badge">
                          <VIcon size="14">mdi-gift-outline</VIcon>
                          {{ t('pages.apps.register.orbit.pricing.firstMonthFree') }}
                        </div>

                        <div class="plan-header">
                          <h3 class="plan-name">{{ t('pages.apps.register.orbit.pricing.custom') }}</h3>
                          <p class="plan-description">{{ t('pages.apps.register.orbit.pricing.customPriceDetail') }}</p>
                        </div>

                        <div class="plan-resources">
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-speedometer</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.cpuLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.customFeatures.cpu') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-memory</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.ramLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.customFeatures.ram') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-harddisk</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.storageLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.customFeatures.storage') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-server-network</VIcon>
                            <span class="resource-label">{{ t('pages.apps.register.orbit.config.instancesLabel') }}</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.customFeatures.instances') }}</span>
                          </div>
                        </div>

                        <div class="plan-btn-wrapper">
                          <VBtn
                            block
                            :color="selectedPlan === 'custom' ? 'success' : 'primary'"
                            size="large"
                            variant="elevated"
                            class="plan-btn"
                            @click.stop="selectPlanAndContinue('custom')"
                          >
                            <VIcon start>mdi-gift-outline</VIcon>
                            {{ t('pages.apps.register.orbit.pricing.startFreeTrial') }}
                          </VBtn>
                        </div>
                      </div>
                    </div>

                    <!-- Beginner Plan Disclaimer -->
                    <div class="plan-disclaimer">
                      <p class="disclaimer-text">
                        <span class="disclaimer-asterisk">*</span>
                        {{ t('pages.apps.register.orbit.pricing.freeTrialDisclaimer') }}
                      </p>
                      <p class="disclaimer-text">
                        <span class="disclaimer-asterisk">*</span>
                        {{ t('pages.apps.register.orbit.pricing.beginnerDisclaimer') }}
                      </p>
                      <p class="disclaimer-text disclaimer-note">
                        <VIcon size="16" class="disclaimer-icon">mdi-information-outline</VIcon>
                        {{ t('pages.apps.register.orbit.pricing.beginnerDowntimeNote') }}
                      </p>
                      <p class="disclaimer-text disclaimer-note">
                        <VIcon size="16" class="disclaimer-icon">mdi-github</VIcon>
                        {{ t('pages.apps.register.orbit.pricing.privateRepoDisclaimer') }}
                      </p>
                    </div>
                  </div>
                </template>

                <!-- Step 4: Review -->
                <template #item.4>
                  <div class="step-content">
                    <!-- Loading spinner while checking eligibility -->
                    <div v-if="duplicateGitRepoCheckStatus === 'checking'" class="text-center py-8">
                      <VProgressCircular indeterminate color="primary" size="48" />
                      <p class="text-body-1 mt-4">{{ t('pages.apps.register.orbit.review.checkingEligibility') }}</p>
                    </div>

                    <template v-else>
                      <h3 class="step-title">{{ t('pages.apps.register.orbit.review.stepTitle') }}</h3>
                      <p class="step-description">
                        {{ t('pages.apps.register.orbit.review.stepDescription') }}
                      </p>

                      <!-- Warning: Not eligible for first month free -->
                      <VAlert
                        v-if="hasDuplicateGitRepo"
                        type="warning"
                        variant="tonal"
                        class="mb-4"
                        icon="mdi-alert-circle"
                      >
                        <strong>{{ t('pages.apps.register.orbit.review.notEligibleTitle') }}</strong>
                        <p class="mb-0 mt-1">
                          {{ t('pages.apps.register.orbit.review.notEligibleDescription', { appName: existingOrbitAppName }) }}
                        </p>
                      </VAlert>

                      <div class="review-summary">
                        <!-- Repository Section -->
                        <div class="review-section">
                          <h4 class="review-section-title">
                            <VIcon start size="20">mdi-source-repository</VIcon>
                            {{ t('pages.apps.register.orbit.review.repository') }}
                          </h4>
                          <div class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.url') }}:</span>
                            <span class="review-value">
                              <VChip :color="providerColor" size="x-small" class="mr-1">
                                <VIcon start :icon="providerIcon" size="12" />
                                {{ detectedProvider || 'Git' }}
                              </VChip>
                              {{ repoUrl }}
                            </span>
                          </div>
                          <div v-if="projectPath && projectPath !== '/'" class="review-item-row">
                            <div class="review-item">
                              <span class="review-label">{{ t('pages.apps.register.orbit.review.branch') }}:</span>
                              <span class="review-value">{{ branch || 'main' }}</span>
                            </div>
                            <div class="review-item">
                              <span class="review-label">{{ t('pages.apps.register.orbit.review.projectPath') }}:</span>
                              <span class="review-value">{{ projectPath }}</span>
                            </div>
                          </div>
                          <div v-else class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.branch') }}:</span>
                            <span class="review-value">{{ branch || 'main' }}</span>
                          </div>
                          <div v-if="repoToken" class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.accessToken') }}:</span>
                            <span class="review-value">
                              <VChip size="x-small" color="success">
                                <VIcon start size="12">mdi-lock</VIcon>
                                {{ t('pages.apps.register.orbit.review.configured') }}
                              </VChip>
                            </span>
                          </div>
                          <div v-if="isEnterpriseApp" class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.appType') }}:</span>
                            <span class="review-value">
                              <VChip size="x-small" color="warning">
                                <VIcon start size="12">mdi-shield-lock</VIcon>
                                {{ t('pages.apps.register.orbit.review.enterprisePrivate') }}
                              </VChip>
                            </span>
                          </div>
                        </div>

                        <!-- Configuration Section -->
                        <div class="review-section">
                          <h4 class="review-section-title">
                            <VIcon start size="20">mdi-cog</VIcon>
                            {{ t('pages.apps.register.orbit.review.configuration') }}
                          </h4>
                          <div class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.appName') }}:</span>
                            <span class="review-value"><code>{{ appName }}</code></span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.appPort') }}:</span>
                            <span class="review-value">{{ appPort }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.exposedPort') }}:</span>
                            <span class="review-value">{{ exposedPort }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.contact') }}:</span>
                            <span class="review-value">{{ contactEmail }}</span>
                          </div>
                          <div v-if="selectedRuntime" class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.runtime') }}:</span>
                            <span class="review-value">{{ selectedRuntime }} {{ runtimeVersion }}</span>
                          </div>
                          <div v-if="customEnvVars.length > 0" class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.envVariables') }}:</span>
                            <span class="review-value">{{ customEnvVars.length }} {{ t('pages.apps.register.orbit.review.configured') }}</span>
                          </div>
                        </div>

                        <!-- Plan Section -->
                        <div class="review-section">
                          <h4 class="review-section-title">
                            <VIcon start size="20">mdi-tag</VIcon>
                            {{ t('pages.apps.register.orbit.review.planAndResources') }}
                          </h4>
                          <div class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.plan') }}:</span>
                            <span class="review-value">
                              <VChip color="primary" size="small">
                                {{ selectedPlanDisplayName }}
                              </VChip>
                            </span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.resources') }}:</span>
                            <span class="review-value">
                              {{ planResources.cpu }} vCPU, {{ planResources.ram }} GB RAM, {{ planResources.storage }} GB Storage
                            </span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.config.instancesLabel') }}:</span>
                            <span class="review-value">
                              {{ planResources.instances }} {{ planResources.instances === 1 ? 'instance' : 'instances' }}
                            </span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.activeDeployments') }}:</span>
                            <span class="review-value">
                              {{ t('pages.apps.register.orbit.review.unlimited') }}
                            </span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.builds') }}:</span>
                            <span class="review-value">
                              {{ t('pages.apps.register.orbit.review.unlimited') }}
                            </span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.branchPreviews') }}:</span>
                            <span class="review-value">{{ t('pages.apps.register.orbit.review.enabled') }}</span>
                          </div>
                          <div v-if="allowedGeolocations.length > 0" class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.config.allowedLocations') }}:</span>
                            <span class="review-value">
                              <VChip
                                v-for="(geo, index) in allowedGeolocations"
                                :key="'review-allowed-' + index"
                                size="x-small"
                                color="success"
                                class="mr-1 mb-1"
                                label
                              >
                                <VIcon start size="12">mdi-map-marker</VIcon>
                                {{ getGeolocationLabel(geo) }}
                              </VChip>
                            </span>
                          </div>
                          <div v-if="forbiddenGeolocations.length > 0" class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.config.forbiddenLocations') }}:</span>
                            <span class="review-value">
                              <VChip
                                v-for="(geo, index) in forbiddenGeolocations"
                                :key="'review-forbidden-' + index"
                                size="x-small"
                                color="error"
                                class="mr-1 mb-1"
                                label
                              >
                                <VIcon start size="12">mdi-map-marker-off</VIcon>
                                {{ getGeolocationLabel(geo) }}
                              </VChip>
                            </span>
                          </div>
                          <div v-if="customDomain" class="review-item">
                            <span class="review-label">{{ t('pages.apps.register.orbit.config.customDomainLabel') }}:</span>
                            <span class="review-value">
                              <VChip
                                size="x-small"
                                color="primary"
                                label
                              >
                                <VIcon start size="12">mdi-web</VIcon>
                                {{ customDomain }}
                              </VChip>
                            </span>
                          </div>
                          <div class="review-item highlight-price">
                            <span class="review-label">{{ t('pages.apps.register.orbit.review.totalPrice') }}:</span>
                            <span class="review-value price">
                              <VChip v-if="eligibleForFirstMonthFree" color="success" size="small" variant="flat" class="mr-2">
                                <VIcon start size="14">mdi-gift-outline</VIcon>
                                {{ t('pages.apps.register.orbit.pricing.firstMonthFree') }}
                              </VChip>
                              <template v-if="!eligibleForFirstMonthFree && calculatedAppPriceLoading">
                                <VProgressCircular indeterminate size="16" width="2" class="mr-2" />
                                Calculating...
                              </template>
                              <template v-else-if="!eligibleForFirstMonthFree && calculatedAppPrice">
                                ${{ calculatedAppPrice.usd.toFixed(2) }}/month
                              </template>
                              <template v-else>
                                {{ formattedTotalPrice }}
                              </template>
                            </span>
                          </div>
                        </div>

                        <!-- Generated Spec Preview -->
                        <VExpansionPanels class="mt-4">
                          <VExpansionPanel>
                            <VExpansionPanelTitle>
                              <VIcon start size="20">mdi-code-json</VIcon>
                              {{ t('pages.apps.register.orbit.review.generatedSpec') }}
                            </VExpansionPanelTitle>
                            <VExpansionPanelText>
                              <pre class="spec-preview">{{ JSON.stringify(generatedAppSpec, null, 2) }}</pre>
                            </VExpansionPanelText>
                          </VExpansionPanel>
                        </VExpansionPanels>
                      </div>

                      <!-- Terms acceptance -->
                      <div class="terms-section mt-6">
                        <VCheckbox
                          v-model="acceptedTerms"
                          :rules="[rules.required]"
                        >
                          <template #label>
                            <span class="text-body-2">
                              {{ t('pages.apps.register.orbit.review.termsLabel') }}
                              <a href="https://cdn.runonflux.io/Flux_Terms_of_Service.pdf" target="_blank" rel="noopener noreferrer" class="text-primary">
                                {{ t('pages.apps.register.orbit.review.termsOfService') }}
                              </a>
                            </span>
                          </template>
                        </VCheckbox>
                      </div>
                    </template>
                  </div>
                </template>

                <!-- Step 5: Register -->
                <template #item.5>
                  <div class="step-content register-step">
                    <!-- Registration Phase -->
                    <div v-if="!registrationHash" class="registration-phase">
                      <h3 class="step-title">{{ t('pages.apps.register.orbit.deploy.registering') }}</h3>
                      <p class="step-description">
                        {{ t('pages.apps.register.orbit.deploy.signMessage') }}
                      </p>

                      <div class="registration-progress">
                        <LoadingSpinner
                          :message="registrationMessage"
                          :loading="isPropagating || isSigning"
                        />

                        <!-- Cancel Signing Button -->
                        <div v-if="isSigning && !isPropagating && !registrationError" class="d-flex justify-center mt-4">
                          <VBtn
                            variant="outlined"
                            color="error"
                            @click="cancelSigning"
                          >
                            <VIcon start size="20">mdi-close-circle</VIcon>
                            {{ t('core.subscriptionManager.cancelSigning') }}
                          </VBtn>
                        </div>

                        <VAlert
                          v-if="registrationError"
                          type="error"
                          variant="tonal"
                          class="mt-4"
                        >
                          <strong>{{ t('pages.apps.register.orbit.deploy.registrationFailed') }}:</strong> {{ registrationError }}
                          <template #append>
                            <VBtn
                              color="primary"
                              variant="flat"
                              size="small"
                              @click="goBackToConfigureStep"
                            >
                              <VIcon start size="16">mdi-pencil</VIcon>
                              {{ t('pages.apps.register.orbit.deploy.editConfiguration') }}
                            </VBtn>
                          </template>
                        </VAlert>
                      </div>
                    </div>

                    <!-- Registration Success -->
                    <div v-else-if="testFinished" class="registration-success">
                      <div class="text-center">
                        <VIcon size="48" color="success" class="mb-2">mdi-check-circle</VIcon>
                        <h3 class="text-h5 font-weight-bold mb-1">{{ t('pages.apps.register.orbit.register.registrationComplete') }}</h3>
                        <p class="text-body-2 text-medium-emphasis mb-2">
                          {{ t('pages.apps.register.orbit.register.registrationCompleteMessage') }}
                        </p>
                      </div>

                      <div class="text-center mt-3">
                        <p class="text-body-2 text-medium-emphasis">{{ t('pages.apps.register.orbit.register.proceedingToPayment') }}</p>
                        <VProgressLinear indeterminate color="primary" class="mt-2" style="max-width: 200px; margin: 0 auto;" />
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Step 6: Payment -->
                <template #item.6>
                  <div class="step-content payment-step">

                    <!-- Deployment Success -->
                    <div v-if="paymentConfirmed" class="payment-monitoring-container">
                      <VRow no-gutters class="justify-center">
                        <VCol cols="12" class="pa-3">
                          <VCard elevation="2" class="deployment-success-card">
                            <VCardText class="pa-8 text-center">
                              <VIcon icon="mdi-check-circle" size="80" color="success" class="mb-4" />
                              <h2 class="text-h4 font-weight-bold mb-3 text-success">
                                {{ t('pages.apps.register.orbit.deploy.registrationCompleteTitle') }}
                              </h2>
                              <p class="text-body-1 mb-6 text-medium-emphasis">
                                {{ t('pages.apps.register.orbit.deploy.registrationCompleteDescription') }}
                              </p>

                              <!-- Orbit-specific Access Information -->
                              <VCard variant="outlined" class="mb-4 text-left">
                                <VCardText>
                                  <div class="d-flex align-center justify-center gap-2 mb-2">
                                    <VIcon color="primary">mdi-application</VIcon>
                                    <span class="text-h6">{{ appName }}</span>
                                  </div>
                                  <VDivider class="my-3" />
                                  <p class="text-subtitle-2 font-weight-medium mb-2">
                                    <VIcon size="18" class="mr-1">mdi-information-outline</VIcon>
                                    {{ t('pages.apps.register.orbit.register.firstInstallInfo') }}
                                  </p>
                                  <div class="access-info-list">
                                    <div class="d-flex align-center gap-2 mb-2">
                                      <VIcon size="16" color="primary">mdi-web</VIcon>
                                      <span class="text-body-2">
                                        <strong>{{ t('pages.apps.register.orbit.register.appUrl') }}</strong>
                                        <a
                                          :href="`https://${appName}.app.runonflux.io`"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          class="ml-1"
                                        >
                                          https://{{ appName }}.app.runonflux.io
                                          <VIcon size="12" class="ml-1">mdi-open-in-new</VIcon>
                                        </a>
                                      </span>
                                    </div>
                                    <div class="d-flex align-center gap-2 mb-2">
                                      <VIcon size="16" color="success">mdi-api</VIcon>
                                      <span class="text-body-2">
                                        <strong>{{ t('pages.apps.register.orbit.register.orbitApi') }}</strong>
                                        <a
                                          :href="`https://${appName}_${orbitManagementPort}.app.runonflux.io`"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          class="ml-1"
                                        >
                                          https://{{ appName }}_{{ orbitManagementPort }}.app.runonflux.io
                                          <VIcon size="12" class="ml-1">mdi-open-in-new</VIcon>
                                        </a>
                                      </span>
                                    </div>
                                    <div class="d-flex align-center gap-2">
                                      <VIcon size="16" color="info">mdi-book-open-variant</VIcon>
                                      <span class="text-body-2">
                                        <strong>{{ t('pages.apps.register.orbit.register.orbitDocumentation') }}</strong>
                                        <a
                                          href="https://orbit.app.runonflux.io/docs/intro"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          class="ml-1"
                                        >
                                          https://orbit.app.runonflux.io/docs/intro
                                          <VIcon size="12" class="ml-1">mdi-open-in-new</VIcon>
                                        </a>
                                      </span>
                                    </div>
                                  </div>
                                </VCardText>
                              </VCard>

                              <VBtn
                                color="primary"
                                size="large"
                                :to="`/apps/manage/${appName}`"
                              >
                                <VIcon start>mdi-cog</VIcon>
                                {{ t('pages.apps.register.orbit.deploy.manageApplication') }}
                              </VBtn>
                            </VCardText>
                          </VCard>
                        </VCol>
                      </VRow>
                    </div>

                    <!-- Payment Options - for users not eligible for first month free -->
                    <div v-if="!paymentConfirmed && !eligibleForFirstMonthFree && !fiatPaymentInitiated" class="payment-options-container">
                      <!-- Warning about not eligible -->
                      <VAlert
                        type="info"
                        variant="tonal"
                        class="mb-4"
                        icon="mdi-information"
                      >
                        {{ t('pages.apps.register.orbit.payment.notEligibleInfo') }}
                      </VAlert>

                      <!-- Payment Method Selection Label -->
                      <div class="payment-method-selection-label mb-4">
                        <VAvatar size="48" color="primary" variant="flat" class="mr-3">
                          <VIcon size="28" color="white">mdi-credit-card-outline</VIcon>
                        </VAvatar>
                        <span class="text-h6">{{ t('pages.apps.register.orbit.payment.selectPaymentMethod') }}</span>
                      </div>

                      <VRow no-gutters class="justify-center">
                        <!-- Fiat Payment -->
                        <VCol cols="12" md="6" class="pa-3">
                          <VCard
                            class="payment-method-card h-100"
                            elevation="0"
                            variant="outlined"
                          >
                            <VCardText class="pa-4">
                              <!-- Header -->
                              <div class="d-flex align-center mb-4">
                                <VAvatar size="36" color="primary" variant="tonal" class="me-3">
                                  <VIcon color="primary" size="20">mdi-credit-card</VIcon>
                                </VAvatar>
                                <div>
                                  <div class="text-subtitle-1 font-weight-bold">{{ t('pages.apps.register.orbit.payment.payWithCard') }}</div>
                                  <div class="text-caption text-medium-emphasis">{{ t('pages.apps.register.orbit.payment.securePayment') }}</div>
                                </div>
                              </div>

                              <!-- Payment Icons - Horizontal Grid -->
                              <div class="payment-icons-row mb-4">
                                <VCard
                                  variant="outlined"
                                  class="payment-icon-card-horizontal"
                                  @click="initStripePay"
                                  :loading="checkoutLoading && paymentMethod === 'stripe'"
                                  hover
                                >
                                  <VCardText class="d-flex align-center justify-center pa-4">
                                    <img
                                      class="payment-brand-icon-small"
                                      :src="StripeImg"
                                      alt="Stripe"
                                    />
                                  </VCardText>
                                </VCard>

                                <VCard
                                  variant="outlined"
                                  class="payment-icon-card-horizontal"
                                  @click="initPaypalPay"
                                  :loading="checkoutLoading && paymentMethod === 'paypal'"
                                  hover
                                >
                                  <VCardText class="d-flex align-center justify-center pa-4">
                                    <img
                                      class="payment-brand-icon-small"
                                      :src="PayPalImg"
                                      alt="PayPal"
                                    />
                                  </VCardText>
                                </VCard>
                              </div>

                              <!-- USD Price Display -->
                              <div class="text-center mb-4">
                                <VChip v-if="calculatedAppPriceLoading" color="grey" variant="flat" size="large">
                                  <VProgressCircular indeterminate size="16" width="2" class="mr-2" />
                                  Calculating...
                                </VChip>
                                <VChip v-else-if="calculatedAppPrice" color="success" variant="flat" size="large">
                                  ${{ calculatedAppPrice.usd.toFixed(2) }} USD + VAT
                                </VChip>
                                <VChip v-else color="success" variant="flat" size="large">
                                  {{ formattedTotalPrice }} + VAT
                                </VChip>
                              </div>

                              <!-- Payment Advantages -->
                              <div class="payment-advantages">
                                <div class="payment-advantage-row">
                                  <VIcon color="success" size="18">mdi-shield-check</VIcon>
                                  <span>{{ t('pages.apps.register.orbit.payment.secureProcessing') }}</span>
                                </div>
                                <div class="payment-advantage-row">
                                  <VIcon color="success" size="18">mdi-clock-fast</VIcon>
                                  <span>{{ t('pages.apps.register.orbit.payment.instantConfirmation') }}</span>
                                </div>
                                <div class="payment-advantage-row">
                                  <VIcon color="success" size="18">mdi-currency-usd</VIcon>
                                  <span>{{ t('pages.apps.register.orbit.payment.multipleCurrency') }}</span>
                                </div>
                              </div>
                            </VCardText>
                          </VCard>
                        </VCol>

                        <!-- Crypto Payment -->
                        <VCol cols="12" md="6" class="pa-3">
                          <VCard
                            class="payment-method-card h-100"
                            elevation="0"
                            variant="outlined"
                          >
                            <VCardText class="pa-4">
                              <!-- Header -->
                              <div class="d-flex align-center mb-4">
                                <VAvatar size="36" color="warning" variant="tonal" class="me-3">
                                  <VIcon color="warning" size="20">mdi-lightning-bolt</VIcon>
                                </VAvatar>
                                <div>
                                  <div class="text-subtitle-1 font-weight-bold">{{ t('pages.apps.register.orbit.payment.payWithFlux') }}</div>
                                  <div class="text-caption text-medium-emphasis">{{ t('pages.apps.register.orbit.payment.cryptoPayment') }}</div>
                                </div>
                              </div>

                              <!-- Wallet Options - Horizontal Grid -->
                              <div class="payment-icons-row mb-4">
                                <VCard
                                  variant="outlined"
                                  class="payment-icon-card-horizontal"
                                  @click="initZelcorePay"
                                  :loading="checkoutLoading && paymentMethod === 'zelcore'"
                                  hover
                                >
                                  <VCardText class="d-flex align-center justify-center pa-4">
                                    <img
                                      class="wallet-brand-icon mr-2"
                                      :src="FluxIDImg"
                                      alt="Zelcore"
                                    />
                                    <span class="text-subtitle-2 font-weight-medium">Zelcore</span>
                                  </VCardText>
                                </VCard>

                                <VCard
                                  variant="outlined"
                                  class="payment-icon-card-horizontal"
                                  @click="initSSPPay"
                                  :loading="checkoutLoading && paymentMethod === 'ssp'"
                                  hover
                                >
                                  <VCardText class="d-flex align-center justify-center pa-4">
                                    <img
                                      class="wallet-brand-icon mr-2"
                                      :src="SSPLogoThemeImg"
                                      alt="SSP"
                                    />
                                    <span class="text-subtitle-2 font-weight-medium">SSP</span>
                                  </VCardText>
                                </VCard>
                              </div>

                              <!-- FLUX Price Display -->
                              <div class="text-center mb-4">
                                <VChip v-if="calculatedAppPriceLoading" color="grey" variant="flat" size="large">
                                  <VProgressCircular indeterminate size="16" width="2" class="mr-2" />
                                  Calculating...
                                </VChip>
                                <template v-else-if="calculatedAppPrice">
                                  <VChip color="primary" variant="flat" size="large">
                                    <VIcon start size="16">mdi-lightning-bolt</VIcon>
                                    {{ calculatedAppPrice.flux.toFixed(2) }} FLUX
                                  </VChip>
                                  <VChip
                                    v-if="calculatedAppPrice.fluxDiscount > 0"
                                    color="success"
                                    variant="flat"
                                    size="small"
                                    class="ml-2"
                                  >
                                    -{{ calculatedAppPrice.fluxDiscount }}%
                                  </VChip>
                                </template>
                                <VChip v-else color="primary" variant="flat" size="large">
                                  <VIcon start size="16">mdi-lightning-bolt</VIcon>
                                  {{ customPlanPrice?.flux || monthlyPriceDisplay * 10 }} FLUX
                                </VChip>
                              </div>

                              <!-- Payment Details -->
                              <VCard variant="flat" class="crypto-payment-details">
                                <VCardText class="pa-3">
                                  <!-- Address Field -->
                                  <div class="crypto-detail-row mb-2">
                                    <div class="crypto-detail-label">
                                      <VIcon size="16" class="mr-1">mdi-wallet</VIcon>
                                      {{ t('pages.apps.register.orbit.payment.sendTo') }}
                                    </div>
                                    <div class="crypto-detail-value">
                                      {{ deploymentAddress || t('common.status.loading') }}
                                    </div>
                                    <VBtn
                                      icon
                                      variant="text"
                                      size="x-small"
                                      class="crypto-copy-btn"
                                      @click="copyToClipboard(deploymentAddress)"
                                    >
                                      <VIcon size="14">mdi-content-copy</VIcon>
                                    </VBtn>
                                  </div>
                                  <!-- Message Field -->
                                  <div class="crypto-detail-row">
                                    <div class="crypto-detail-label">
                                      <VIcon size="16" class="mr-1">mdi-message-text</VIcon>
                                      {{ t('pages.apps.register.orbit.payment.message') }}
                                    </div>
                                    <div class="crypto-detail-value">
                                      {{ registrationHash || t('common.status.loading') }}
                                    </div>
                                    <VBtn
                                      icon
                                      variant="text"
                                      size="x-small"
                                      class="crypto-copy-btn"
                                      @click="copyToClipboard(registrationHash)"
                                    >
                                      <VIcon size="14">mdi-content-copy</VIcon>
                                    </VBtn>
                                  </div>
                                </VCardText>
                              </VCard>
                            </VCardText>
                          </VCard>
                        </VCol>
                      </VRow>
                    </div>

                    <!-- Payment Monitoring Spinner -->
                    <div v-if="!paymentConfirmed && (eligibleForFirstMonthFree || fiatPaymentInitiated)" class="payment-monitoring-container">
                      <VRow no-gutters class="justify-center">
                        <VCol cols="12" class="pa-3">
                          <VCard elevation="2" class="payment-monitoring-card">
                            <VCardText class="pa-6">
                              <LoadingSpinner
                                :icon="paymentMonitoringPhase === 'blockchain' ? 'mdi-cube-outline' : 'mdi-rocket-launch'"
                                :icon-size="48"
                                :title="paymentMonitoringPhase === 'blockchain'
                                  ? t('pages.apps.register.orbit.deploy.checkingRegistration')
                                  : t('pages.apps.register.orbit.deploy.waitingForInstance')"
                                message=""
                              />
                              <!-- First month sponsor message - only show when eligible -->
                              <div v-if="eligibleForFirstMonthFree" class="text-center mb-3">
                                <VChip color="success" variant="tonal" size="small">
                                  <VIcon size="16" class="mr-1">mdi-gift-outline</VIcon>
                                  {{ t('pages.apps.register.orbit.deploy.firstMonthSponsoredBy') }}
                                </VChip>
                              </div>
                              <div class="d-flex justify-center">
                                <div class="deployment-monitoring-wrapper">
                                  <div class="deployment-message-box">
                                    <!-- Phase 1: Blockchain confirmation -->
                                    <template v-if="paymentMonitoringPhase === 'blockchain'">
                                      <div class="d-flex align-center">
                                        <VIcon color="info" size="20" class="mr-2">mdi-magnify</VIcon>
                                        <span>{{ t('pages.apps.register.orbit.deploy.checkingPaymentOnBlockchain') }}</span>
                                      </div>
                                      <div class="d-flex align-center">
                                        <VIcon color="warning" size="20" class="mr-2">mdi-clock-alert</VIcon>
                                        <span>{{ t('pages.apps.register.orbit.deploy.blockchainConfirmationTime') }}</span>
                                      </div>
                                    </template>
                                    <!-- Phase 2: Node deployment -->
                                    <template v-else>
                                      <div class="d-flex align-center">
                                        <VIcon color="success" size="20" class="mr-2">mdi-check-circle</VIcon>
                                        <span>{{ t('pages.apps.register.orbit.deploy.paymentConfirmedWaitingNodes') }}</span>
                                      </div>
                                      <div class="d-flex align-center">
                                        <VIcon color="info" size="20" class="mr-2">mdi-server</VIcon>
                                        <span>{{ t('pages.apps.register.orbit.deploy.waitingForNodesPickup') }}</span>
                                      </div>
                                      <div class="d-flex align-center">
                                        <VIcon color="warning" size="20" class="mr-2">mdi-clock-alert</VIcon>
                                        <span>{{ t('pages.apps.register.orbit.deploy.nodeDeploymentTime') }}</span>
                                      </div>
                                    </template>
                                  </div>
                                </div>
                              </div>
                            </VCardText>
                          </VCard>
                        </VCol>
                      </VRow>
                    </div>
                  </div>
                </template>

                <!-- Actions -->
                <template #actions>
                  <div class="step-content stepper-actions-wrapper">
                    <!-- Hint for disabled Continue button -->
                    <div v-if="continueButtonDisabledReason" class="continue-button-hint">
                      <VIcon size="16" color="warning" class="mr-2">mdi-information</VIcon>
                      <span>{{ continueButtonDisabledReason.message }}</span>
                    </div>
                    <div class="stepper-actions">
                      <VBtn
                        v-if="currentStep > 1 && currentStep <= 4"
                        variant="text"
                        @click="currentStep--"
                        :disabled="deploying"
                      >
                        <VIcon start>mdi-arrow-left</VIcon>
                        {{ t('pages.apps.register.orbit.navigation.back') }}
                      </VBtn>
                      <VSpacer />
                      <VBtn
                        v-if="currentStep > 1 && currentStep < 4"
                        color="primary"
                        :disabled="currentStep === 2 && repoCheckStatus === 'private' && authTestStatus !== 'success'"
                        @click="nextStep"
                      >
                        {{ t('pages.apps.register.orbit.navigation.continue') }}
                        <VIcon end>mdi-arrow-right</VIcon>
                      </VBtn>
                      <VBtn
                        v-else-if="currentStep === 4"
                        color="primary"
                        :loading="deploying"
                        :disabled="!acceptedTerms"
                        @click="proceedToPayment"
                      >
                        <VIcon start>mdi-rocket-launch</VIcon>
                        {{ t('pages.apps.register.orbit.config.registerApplication') }}
                      </VBtn>
                    <!-- No action buttons on steps 5 and 6 - handled within the step content -->
                    </div>
                  </div>
                </template>
              </VStepper>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useFluxStore } from '@/stores/flux'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import { useLoginSheet } from '@/composables/useLoginSheet'
import axios from 'axios'
import Api from '@/services/ApiClient'
import geolocations from '@/utils/geolocation'
import AppsService from '@/services/AppsService'
import StripeImg from '@images/Stripe.svg?url'
import PayPalImg from '@images/PayPal.png?url'
import FluxIDImg from '@images/FluxID.svg?url'
import SSPLogoBlackImg from '@images/ssp-logo-black.svg?url'
import SSPLogoWhiteImg from '@images/ssp-logo-white.svg?url'
import StorageService from '@/services/StorageService'
import { useTheme } from 'vuetify'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import { signWithSSP, signWithZelcore, signWithWalletConnect, getConnectedAccount, payWithSSP, payWithZelcore } from '@/utils/walletService'
import { getDetectedBackendURL } from '@/utils/backend'
import {
  encryptAesKeyWithRsaKey,
  encryptEnterpriseWithAes,
  importRsaPublicKey,
  isWebCryptoAvailable,
} from '@/utils/enterpriseCrypto'
import qs from 'qs'
import { getUser } from '@/utils/firebase'

const { t } = useI18n()

// SEO meta tags
useHead({
  title: 'Deploy with Git - Git-based Deployment on FluxCloud',
  meta: [
    {
      name: 'description',
      content: 'Deploy your Git repositories directly to FluxCloud. No Docker knowledge required. Support for React, Vue, Next.js, Node.js, and more frameworks with built-in CI/CD.',
    },
    {
      name: 'keywords',
      content: 'flux git, git deployment, ci/cd, react deployment, vue deployment, next.js hosting, node.js deployment, decentralized hosting, web3 deployment',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      name: 'author',
      content: 'FluxCloud',
    },
    {
      property: 'og:title',
      content: 'Deploy with Git - Git-based Deployment on FluxCloud',
    },
    {
      property: 'og:description',
      content: 'Deploy your Git repositories directly to FluxCloud. No Docker knowledge required. Built-in CI/CD with support for popular frameworks.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: 'https://cloud.runonflux.com/apps/register/orbit',
    },
    {
      property: 'og:image',
      content: 'https://cloud.runonflux.com/banner/FluxDeploy.webp',
    },
    {
      property: 'og:image:width',
      content: '1200',
    },
    {
      property: 'og:image:height',
      content: '630',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: 'Deploy with Git - Git-based Deployment on FluxCloud',
    },
    {
      name: 'twitter:description',
      content: 'Deploy your Git repositories directly to FluxCloud. No Docker knowledge required. Built-in CI/CD with support for popular frameworks.',
    },
    {
      name: 'twitter:image',
      content: 'https://cloud.runonflux.com/banner/FluxDeploy.webp',
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: 'https://cloud.runonflux.com/apps/register/orbit',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Deploy with Git - Git-based Deployment on FluxCloud',
        'description': 'Deploy your Git repositories directly to FluxCloud. No Docker knowledge required. Support for React, Vue, Next.js, Node.js, and more frameworks with built-in CI/CD.',
        'url': 'https://cloud.runonflux.com/apps/register/orbit',
        'image': 'https://cloud.runonflux.com/banner/FluxDeploy.webp',
        'publisher': {
          '@type': 'Organization',
          'name': 'FluxCloud',
          'url': 'https://cloud.runonflux.com',
        },
      }),
    },
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://cloud.runonflux.com/',
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Deploy App',
            'item': 'https://cloud.runonflux.com/apps/register',
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': 'Deploy with Git',
            'item': 'https://cloud.runonflux.com/apps/register/orbit',
          },
        ],
      }),
    },
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'Flux Git',
        'applicationCategory': 'DeveloperApplication',
        'operatingSystem': 'Web',
        'description': 'Git-based deployment platform for FluxCloud. Deploy React, Vue, Next.js, Node.js and more without Docker knowledge.',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'description': 'Free tier available',
        },
        'featureList': [
          'Git repository deployment',
          'Built-in CI/CD',
          'React, Vue, Next.js support',
          'Node.js backend support',
          'Automatic builds',
          'No Docker knowledge required',
        ],
      }),
    },
  ],
})
const router = useRouter()
const { openLoginBottomSheet, closeLoginBottomSheet } = useLoginSheet()

// Flux store
const fluxStore = useFluxStore()
const { privilege, zelid } = storeToRefs(fluxStore)

// Theme for SSP logo
const theme = useTheme()
const SSPLogoThemeImg = computed(() => {
  return theme.global.name.value === 'dark' ? SSPLogoWhiteImg : SSPLogoBlackImg
})

// Auth state
const isLoggedIn = computed(() => privilege.value !== 'none')

// Watch for login
watch(isLoggedIn, newValue => {
  if (newValue) {
    closeLoginBottomSheet()
  }
})

// Stepper
const currentStep = ref(1)
const stepItems = computed(() => [
  { title: t('pages.apps.register.orbit.stepper.plan'), value: 1 },
  { title: t('pages.apps.register.orbit.stepper.repository'), value: 2 },
  { title: t('pages.apps.register.orbit.stepper.configure'), value: 3 },
  { title: t('pages.apps.register.orbit.stepper.review'), value: 4 },
  { title: t('pages.apps.register.orbit.stepper.register'), value: 5 },
  { title: t('pages.apps.register.orbit.stepper.payment'), value: 6 },
])

// Scroll to top when step changes
watch(currentStep, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

// Form refs
const repoForm = ref(null)
const configForm = ref(null)

// Step 3: Repository
const repoUrl = ref('')
const branch = ref('main')
const projectPath = ref('/')
const repoUsername = ref('')
const repoToken = ref('')
const showToken = ref(false)

// Repository detection state
const repoCheckStatus = ref('idle') // idle, checking, public, private, error
const repoCheckError = ref('')
const detectedPort = ref(null)
const detectedFramework = ref(null)
const isEnterpriseApp = computed(() => repoCheckStatus.value === 'private' && repoToken.value)

// Auth test state
const authTestStatus = ref('idle') // idle, testing, success, error
const authTestError = ref('')

// Branch selection state
const branches = ref([])
const branchesLoading = ref(false)
const branchesError = ref('')

// Computed branch items for VAutocomplete
const branchItems = computed(() => {
  if (branches.value.length === 0) {
    // Return default options if no branches loaded
    return [
      { title: 'main', value: 'main', isDefault: true },
      { title: 'master', value: 'master', isDefault: true },
    ]
  }
  
  return branches.value.map(b => ({
    title: b.name,
    value: b.name,
    isDefault: b.isDefault,
  }))
})

// Computed: Show branch and project fields only after repo data is collected
const showBranchAndProjectFields = computed(() => {
  // For public repos: show when repo check passed
  if (repoCheckStatus.value === 'public') {
    return true
  }

  // For private repos: show only after successful connection test
  if (repoCheckStatus.value === 'private' && authTestStatus.value === 'success') {
    return true
  }

  return false
})

// Computed: Reason why Continue button is disabled on step 2 (for user guidance)
const continueButtonDisabledReason = computed(() => {
  if (currentStep.value !== 2) return null
  if (repoCheckStatus.value !== 'private') return null
  if (authTestStatus.value === 'success') return null

  // Private repo detected, need to test connection
  if (!repoUsername.value && !repoToken.value) {
    return {
      message: t('pages.apps.register.orbit.repository.enterCredentialsHint'),
      action: 'credentials',
    }
  }

  if (!repoToken.value) {
    return {
      message: t('pages.apps.register.orbit.repository.enterTokenHint'),
      action: 'token',
    }
  }

  if (authTestStatus.value === 'idle' || authTestStatus.value === 'error') {
    return {
      message: t('pages.apps.register.orbit.repository.testConnectionHint'),
      action: 'test',
    }
  }

  if (authTestStatus.value === 'testing') {
    return {
      message: t('pages.apps.register.orbit.repository.testingConnectionHint'),
      action: 'testing',
    }
  }

  return null
})

// Computed: Whether to highlight the Test Connection button
const showTestConnectionHighlight = computed(() => {
  return repoCheckStatus.value === 'private'
    && repoToken.value
    && authTestStatus.value === 'idle'
})

// Monorepo detection
const isMonorepo = ref(false)
const monorepoType = ref(null) // 'pnpm', 'npm', 'yarn', 'lerna', 'nx', 'turbo', 'rush'
const monorepoProjects = ref([]) // List of detected projects/workspaces
const detectingMonorepo = ref(false)

// Step 4: Configuration
const appName = ref('')
const appDescription = ref('')
const appPort = ref('3000')
const portAutoDetected = ref(false)
const contactEmail = ref('')
const pollingInterval = ref('86400') // Default: 24 hours in seconds
const showAdvancedOptions = ref(false)

// Polling interval options (value in seconds, 'disabled' to not add env var)
const pollingIntervalOptions = [
  { title: 'Disabled', value: 'disabled' },
  { title: '1 hour', value: '3600' },
  { title: '2 hours', value: '7200' },
  { title: '6 hours', value: '21600' },
  { title: '12 hours', value: '43200' },
  { title: '24 hours (default)', value: '86400' },
]

const selectedRuntime = ref(null)
const runtimeVersion = ref('')
const customEnvVars = ref([])

// Parse repo URL to get owner and repo name
const parseRepoUrl = url => {
  if (!url) return null

  try {
    const match = url.match(/^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/)
    if (match) {
      return {
        provider: match[1],
        owner: match[2],
        repo: match[3],
      }
    }
  } catch {
    return null
  }
  
  return null
}

// Check if repository is public or private
const checkRepoAccess = async () => {
  const parsed = parseRepoUrl(repoUrl.value)
  if (!parsed) return

  repoCheckStatus.value = 'checking'
  repoCheckError.value = ''
  detectedPort.value = null
  detectedFramework.value = null

  try {
    let apiUrl = ''

    if (parsed.provider === 'github.com') {
      apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`
    } else if (parsed.provider === 'gitlab.com') {
      apiUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${parsed.owner}/${parsed.repo}`)}`
    } else if (parsed.provider === 'bitbucket.org') {
      apiUrl = `https://api.bitbucket.org/2.0/repositories/${parsed.owner}/${parsed.repo}`
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      repoCheckStatus.value = 'public'

      // Repo is public, fetch branches and detect monorepo structure and port
      await fetchBranches(parsed)
      await detectMonorepoStructure(parsed)
      await detectPortFromRepo(parsed)
    } else if (response.status === 404 || response.status === 403) {
      repoCheckStatus.value = 'private'
    } else {
      repoCheckStatus.value = 'error'
      repoCheckError.value = `Failed to check repository (HTTP ${response.status})`
    }
  } catch (error) {
    console.error('Error checking repo:', error)
    repoCheckStatus.value = 'error'
    repoCheckError.value = 'Network error while checking repository'
  }
}

// Check if owner has already registered an orbit app with the same git repo
const checkDuplicateGitRepo = async () => {
  if (!zelid.value || !repoUrl.value) {
    duplicateGitRepoCheckStatus.value = 'checked'
    
    return
  }

  duplicateGitRepoCheckStatus.value = 'checking'
  hasDuplicateGitRepo.value = false
  existingOrbitAppName.value = null

  try {
    // Fetch permanent messages for the app owner
    const url = `https://api.runonflux.io/apps/permanentmessages?appowner=${zelid.value}`
    const response = await axios.get(url, { timeout: 30000 })

    if (response.data.status !== 'success' || !Array.isArray(response.data.data)) {
      console.warn('[orbit] Failed to fetch permanent messages for owner:', zelid.value)
      duplicateGitRepoCheckStatus.value = 'checked'
      
      return
    }

    const permanentMessages = response.data.data
    const registerMessages = permanentMessages.filter(message => message.type === 'fluxappregister')

    // Check fluxappregister messages for duplicate git repos
    for (const message of registerMessages) {
      const appSpecs = message.appSpecifications
      if (!appSpecs) continue

      // Only check orbit apps (repotag must be runonflux/orbit:latest)
      if (!appSpecs.compose || !Array.isArray(appSpecs.compose) || appSpecs.compose.length === 0) continue
      const component = appSpecs.compose[0]
      if (!component.repotag || component.repotag !== 'runonflux/orbit:latest') continue

      // Extract GIT_REPO_URL from environment parameters
      if (component.environmentParameters && Array.isArray(component.environmentParameters)) {
        for (const envParam of component.environmentParameters) {
          if (typeof envParam === 'string' && envParam.startsWith('GIT_REPO_URL=')) {
            const existingRepoUrl = envParam.substring('GIT_REPO_URL='.length)
            if (existingRepoUrl === repoUrl.value) {
              hasDuplicateGitRepo.value = true
              existingOrbitAppName.value = appSpecs.name
              duplicateGitRepoCheckStatus.value = 'checked'
              
              return
            }
          }
        }
      }
    }

    duplicateGitRepoCheckStatus.value = 'checked'
  } catch (error) {
    console.error('[orbit] Error checking owner git repos:', error)

    // On error, allow the flow to proceed (fail open)
    duplicateGitRepoCheckStatus.value = 'checked'
  }
}

// Calculate actual app price for non-eligible users
const calculateAppPrice = async () => {
  calculatedAppPriceLoading.value = true
  calculatedAppPriceError.value = null
  calculatedAppPrice.value = null

  try {
    const containerPort = parseInt(appPort.value, 10) || 3000

    // Build compose array for price calculation
    const composeArray = [{
      name: 'cloudgit',
      description: 'cloudgit',
      repotag: 'runonflux/orbit:latest',
      ports: [30000],
      containerPorts: [containerPort],
      domains: [''],
      environmentParameters: [''],
      commands: [],
      containerData: '/app',
      cpu: Number(planResources.value.cpu).toString(),
      ram: (Number(planResources.value.ram) * 1000).toString(), // Convert GB to MB
      hdd: Number(planResources.value.storage).toString(),
      tiered: false,
    }]

    let enterpriseValue = ''
    let composeData = composeArray
    let contactsData = ['']

    // Handle enterprise encryption for private repos (like cost calculator)
    if (isEnterpriseApp.value) {
      try {
        // Get the RSA public key for enterprise encryption
        const zelidauth = localStorage.getItem('zelidauth')
        const pubKeyResponse = await AppsService.getAppPublicKey(zelidauth, {
          name: appName.value || 'orbit-price-calc',
          owner: zelid.value || '176iuPFBqD4yg3Fd7oPVhB3d4NXWxvQyxx',
        })

        if (pubKeyResponse.data.status === 'success') {
          const pubKeyB64 = pubKeyResponse.data.data.trim().replace(/\s+/g, '')
          const rsaPubKey = await importRsaPublicKey(pubKeyB64)

          // Generate AES key and encrypt enterprise data
          const aesKey = crypto.getRandomValues(new Uint8Array(32))
          const encryptedAesKey = await encryptAesKeyWithRsaKey(aesKey, rsaPubKey)

          // Create enterprise specs (contacts + compose to be encrypted)
          const enterpriseSpecs = {
            contacts: [''],
            compose: composeArray,
          }

          enterpriseValue = await encryptEnterpriseWithAes(
            JSON.stringify(enterpriseSpecs),
            aesKey,
            encryptedAesKey,
          )

          // For enterprise, compose and contacts are empty in payload (encrypted in enterprise field)
          composeData = []
          contactsData = []
        } else {
          console.warn('[orbit] Failed to get public key for enterprise pricing, using standard pricing')
        }
      } catch (encryptError) {
        console.warn('[orbit] Enterprise encryption failed for price calc, using standard pricing:', encryptError.message)

        // Continue with standard pricing if encryption fails
      }
    }

    // Build the app spec payload for price calculation
    const payloadObj = {
      version: 8,
      name: appName.value || 'orbit-app',
      description: 'Price calculation',
      owner: zelid.value || '176iuPFBqD4yg3Fd7oPVhB3d4NXWxvQyxx',
      compose: composeData,
      instances: planResources.value.instances,
      nodes: [],
      contacts: contactsData,
      geolocation: [''],
      expire: 88000, // 1 month
      enterprise: enterpriseValue,
      staticip: false,
    }

    const response = await Api().post(
      '/apps/calculatefiatandfluxprice',
      JSON.stringify(payloadObj),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      },
    )

    if (response.data.status !== 'error' && response.data.data) {
      calculatedAppPrice.value = {
        usd: parseFloat(response.data.data.usd) || 0,
        flux: parseFloat(response.data.data.flux) || 0,
        fluxDiscount: response.data.data.fluxDiscount || 0,
      }
    } else {
      calculatedAppPriceError.value = 'Failed to calculate price'
    }
  } catch (error) {
    console.error('[orbit] Error calculating app price:', error)
    calculatedAppPriceError.value = 'Error calculating price'
  } finally {
    calculatedAppPriceLoading.value = false
  }
}

// Detect port from repository files
const detectPortFromRepo = async parsed => {
  if (!parsed) return

  const branchName = branch.value || 'main'
  const basePath = projectPath.value && projectPath.value !== '/' ? projectPath.value.replace(/^\//, '') + '/' : ''

  // Files to check and their port detection patterns
  const fileChecks = [
    {
      path: `${basePath}package.json`,
      detect: detectPortFromPackageJson,
    },
    {
      path: `${basePath}Dockerfile`,
      detect: detectPortFromDockerfile,
    },
    {
      path: `${basePath}docker-compose.yml`,
      detect: detectPortFromDockerCompose,
    },
    {
      path: `${basePath}.env.example`,
      detect: detectPortFromEnvFile,
    },
    {
      path: `${basePath}.env.sample`,
      detect: detectPortFromEnvFile,
    },
  ]

  for (const check of fileChecks) {
    try {
      let rawUrl = ''

      if (parsed.provider === 'github.com') {
        rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branchName}/${check.path}`
      } else if (parsed.provider === 'gitlab.com') {
        rawUrl = `https://gitlab.com/${parsed.owner}/${parsed.repo}/-/raw/${branchName}/${check.path}`
      } else if (parsed.provider === 'bitbucket.org') {
        rawUrl = `https://bitbucket.org/${parsed.owner}/${parsed.repo}/raw/${branchName}/${check.path}`
      }

      const response = await fetch(rawUrl)
      if (response.ok) {
        const content = await response.text()
        const result = check.detect(content)
        if (result.port) {
          detectedPort.value = result.port
          detectedFramework.value = result.framework || null
          appPort.value = result.port.toString()
          portAutoDetected.value = true
          console.log(`Auto-detected port ${result.port} from ${check.path}`, result.framework ? `(${result.framework})` : '')
          
          return
        }
      }
    } catch (error) {
      // File not found or error, continue to next
      console.debug(`Could not fetch ${check.path}:`, error.message)
    }
  }
}

// Detect port from package.json
const detectPortFromPackageJson = content => {
  try {
    const pkg = JSON.parse(content)

    // Check for known frameworks and their default ports
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }

    // Helper to check scripts for custom port
    const findPortInScripts = (scriptNames = ['start', 'dev', 'serve', 'preview']) => {
      for (const name of scriptNames) {
        const script = pkg.scripts?.[name] || ''
        const portMatch = script.match(/-p\s*(\d+)|--port[=\s]+(\d+)|PORT=(\d+)/)
        if (portMatch) {
          return parseInt(portMatch[1] || portMatch[2] || portMatch[3], 10)
        }
      }

      return null
    }

    // ==========================================
    // 1. Full-stack/SSR frameworks (have their own server)
    // ==========================================

    // Next.js
    if (deps['next']) {
      const customPort = findPortInScripts(['dev', 'start'])
      if (customPort) return { port: customPort, framework: 'Next.js' }

      return { port: 3000, framework: 'Next.js' }
    }

    // Nuxt
    if (deps['nuxt'] || deps['nuxt3']) {
      const customPort = findPortInScripts(['dev', 'start', 'preview'])
      if (customPort) return { port: customPort, framework: 'Nuxt' }

      return { port: 3000, framework: 'Nuxt' }
    }

    // Remix
    if (deps['@remix-run/node'] || deps['@remix-run/react']) {
      const customPort = findPortInScripts(['dev', 'start'])
      if (customPort) return { port: customPort, framework: 'Remix' }

      return { port: 3000, framework: 'Remix' }
    }

    // SvelteKit (has its own server in production)
    if (deps['@sveltejs/kit']) {
      const customPort = findPortInScripts(['dev', 'preview', 'start'])
      if (customPort) return { port: customPort, framework: 'SvelteKit' }

      return { port: 3000, framework: 'SvelteKit' }
    }

    // Astro (can be SSR or static)
    if (deps['astro']) {
      const customPort = findPortInScripts(['dev', 'preview', 'start'])
      if (customPort) return { port: customPort, framework: 'Astro' }

      return { port: 4321, framework: 'Astro' }
    }

    // ==========================================
    // 2. Backend frameworks (have their own server)
    // ==========================================

    // Express
    if (deps['express']) {
      const customPort = findPortInScripts(['start', 'dev', 'serve'])
      if (customPort) return { port: customPort, framework: 'Express' }

      return { port: 3000, framework: 'Express' }
    }

    // NestJS
    if (deps['@nestjs/core']) {
      const customPort = findPortInScripts(['start', 'start:dev', 'start:prod'])
      if (customPort) return { port: customPort, framework: 'NestJS' }

      return { port: 3000, framework: 'NestJS' }
    }

    // Fastify
    if (deps['fastify']) {
      const customPort = findPortInScripts(['start', 'dev'])
      if (customPort) return { port: customPort, framework: 'Fastify' }

      return { port: 3000, framework: 'Fastify' }
    }

    // Hono
    if (deps['hono']) {
      const customPort = findPortInScripts(['start', 'dev'])
      if (customPort) return { port: customPort, framework: 'Hono' }

      return { port: 3000, framework: 'Hono' }
    }

    // Koa
    if (deps['koa']) {
      const customPort = findPortInScripts(['start', 'dev'])
      if (customPort) return { port: customPort, framework: 'Koa' }

      return { port: 3000, framework: 'Koa' }
    }

    // ==========================================
    // 3. Frontend frameworks (need static server in production)
    // These use build tools like Vite/Webpack but run on port 3000 in production
    // ==========================================

    // Vue.js (often uses Vite, but production runs on 3000)
    // Don't check 'preview' or 'dev' - those are dev server ports, not production
    if (deps['vue']) {
      const customPort = findPortInScripts(['start', 'serve'])
      if (customPort) return { port: customPort, framework: 'Vue' }

      // Production static servers default to 3000
      return { port: 3000, framework: 'Vue' }
    }

    // React (often uses Vite/CRA, but production runs on 3000)
    if (deps['react']) {
      const customPort = findPortInScripts(['start', 'serve'])
      if (customPort) return { port: customPort, framework: 'React' }

      // Production static servers default to 3000
      return { port: 3000, framework: 'React' }
    }

    // Svelte (not SvelteKit - plain Svelte apps)
    if (deps['svelte'] && !deps['@sveltejs/kit']) {
      const customPort = findPortInScripts(['start', 'serve'])
      if (customPort) return { port: customPort, framework: 'Svelte' }

      return { port: 3000, framework: 'Svelte' }
    }

    // Angular
    if (deps['@angular/core']) {
      const customPort = findPortInScripts(['start', 'serve'])
      if (customPort) return { port: customPort, framework: 'Angular' }

      return { port: 4200, framework: 'Angular' }
    }

    // Preact
    if (deps['preact']) {
      const customPort = findPortInScripts(['start', 'serve'])
      if (customPort) return { port: customPort, framework: 'Preact' }

      return { port: 3000, framework: 'Preact' }
    }

    // Solid.js
    if (deps['solid-js']) {
      const customPort = findPortInScripts(['start', 'serve'])
      if (customPort) return { port: customPort, framework: 'Solid' }

      return { port: 3000, framework: 'Solid' }
    }

    // Qwik
    if (deps['@builder.io/qwik']) {
      const customPort = findPortInScripts(['start', 'serve'])
      if (customPort) return { port: customPort, framework: 'Qwik' }

      return { port: 3000, framework: 'Qwik' }
    }

    // ==========================================
    // 4. Build tools (lowest priority - only if no framework detected)
    // For production deployment, these typically use serve/http-server on port 3000
    // ==========================================

    // Vite (build tool - production uses static server on 3000)
    // Don't check 'dev' or 'preview' - those are Vite dev server ports
    // In production, Vite apps are served by static servers (serve, http-server, nginx)
    if (deps['vite']) {
      const customPort = findPortInScripts(['start', 'serve'])
      if (customPort) return { port: customPort, framework: 'Vite' }

      // For production, Vite apps are served by static servers (default 3000)
      return { port: 3000, framework: 'Vite' }
    }

    // Webpack (build tool)
    if (deps['webpack'] || deps['webpack-cli']) {
      const customPort = findPortInScripts(['start', 'serve'])
      if (customPort) return { port: customPort, framework: 'Webpack' }

      return { port: 3000, framework: 'Webpack' }
    }

    // Parcel (build tool)
    if (deps['parcel'] || deps['parcel-bundler']) {
      const customPort = findPortInScripts(['start', 'serve', 'dev'])
      if (customPort) return { port: customPort, framework: 'Parcel' }

      return { port: 1234, framework: 'Parcel' }
    }

    // esbuild (build tool)
    if (deps['esbuild']) {
      const customPort = findPortInScripts(['start', 'serve', 'dev'])
      if (customPort) return { port: customPort, framework: 'esbuild' }

      return { port: 3000, framework: 'esbuild' }
    }

    // ==========================================
    // 5. Check production scripts for explicit PORT pattern
    // Only check start/serve scripts, not dev/preview which are for development
    // ==========================================
    const productionScripts = ['start', 'serve', 'production', 'prod']
    for (const scriptName of productionScripts) {
      const script = pkg.scripts?.[scriptName] || ''
      const portMatch = script.match(/PORT=(\d+)|--port[=\s]+(\d+)|-p\s*(\d+)/)
      if (portMatch) {
        return { port: parseInt(portMatch[1] || portMatch[2] || portMatch[3], 10), framework: null }
      }
    }

    // ==========================================
    // 6. Default for Node.js projects
    // ==========================================
    if (deps || pkg.main || pkg.scripts?.start) {
      return { port: 3000, framework: 'Node.js' }
    }
  } catch {
    // Invalid JSON
  }

  return { port: null }
}

// Detect port from Dockerfile
const detectPortFromDockerfile = content => {
  // Look for EXPOSE directive
  const exposeMatch = content.match(/^EXPOSE\s+(\d+)/m)
  if (exposeMatch) {
    return { port: parseInt(exposeMatch[1], 10), framework: 'Docker' }
  }

  // Look for ENV PORT
  const envPortMatch = content.match(/^ENV\s+(?:PORT|APP_PORT)[=\s]+(\d+)/m)
  if (envPortMatch) {
    return { port: parseInt(envPortMatch[1], 10), framework: 'Docker' }
  }

  return { port: null }
}

// Detect port from docker-compose.yml
const detectPortFromDockerCompose = content => {
  // Simple regex for ports mapping
  const portsMatch = content.match(/ports:\s*\n\s*-\s*["']?(\d+):(\d+)["']?/)
  if (portsMatch) {
    return { port: parseInt(portsMatch[2], 10), framework: 'Docker Compose' }
  }
  
  return { port: null }
}

// Detect port from .env file
const detectPortFromEnvFile = content => {
  const portMatch = content.match(/^(?:PORT|APP_PORT|SERVER_PORT)=(\d+)/m)
  if (portMatch) {
    return { port: parseInt(portMatch[1], 10), framework: null }
  }
  
  return { port: null }
}

// Detect monorepo structure
const detectMonorepoStructure = async parsed => {
  if (!parsed) return

  detectingMonorepo.value = true
  isMonorepo.value = false
  monorepoType.value = null
  monorepoProjects.value = []

  const branchName = branch.value || 'main'

  // Monorepo config files to check
  const monorepoConfigs = [
    { file: 'pnpm-workspace.yaml', type: 'pnpm', parser: parsePnpmWorkspace },
    { file: 'turbo.json', type: 'turbo', parser: parseTurboConfig },
    { file: 'lerna.json', type: 'lerna', parser: parseLernaConfig },
    { file: 'nx.json', type: 'nx', parser: parseNxConfig },
    { file: 'rush.json', type: 'rush', parser: parseRushConfig },
    { file: 'package.json', type: 'npm/yarn', parser: parsePackageJsonWorkspaces },
  ]

  for (const config of monorepoConfigs) {
    try {
      let rawUrl = ''

      if (parsed.provider === 'github.com') {
        rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branchName}/${config.file}`
      } else if (parsed.provider === 'gitlab.com') {
        rawUrl = `https://gitlab.com/${parsed.owner}/${parsed.repo}/-/raw/${branchName}/${config.file}`
      } else if (parsed.provider === 'bitbucket.org') {
        rawUrl = `https://bitbucket.org/${parsed.owner}/${parsed.repo}/raw/${branchName}/${config.file}`
      }

      // Use HEAD request first to check if file exists (avoids 404 errors in console)
      const headResponse = await fetch(rawUrl, { method: 'HEAD' })
      if (!headResponse.ok) {
        continue // File doesn't exist, skip to next config
      }

      // File exists, fetch the content
      const response = await fetch(rawUrl)
      if (response.ok) {
        const content = await response.text()
        const result = config.parser(content)

        if (result.isMonorepo && result.workspaces.length > 0) {
          isMonorepo.value = true
          monorepoType.value = config.type

          // Expand glob patterns to actual directories
          const projects = await expandWorkspacePatterns(parsed, branchName, result.workspaces)
          monorepoProjects.value = projects

          console.log(`Detected ${config.type} monorepo with ${projects.length} projects:`, projects)
          break
        }
      }
    } catch (error) {
      console.debug(`Could not fetch ${config.file}:`, error.message)
    }
  }

  detectingMonorepo.value = false
}

// Parse pnpm-workspace.yaml
const parsePnpmWorkspace = content => {
  try {
    // Simple YAML parsing for packages array
    const packagesMatch = content.match(/packages:\s*\n((?:\s*-\s*.+\n?)+)/)
    if (packagesMatch) {
      const packages = packagesMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*-\s*['"]?([^'"]+)['"]?\s*$/, '$1').trim())
        .filter(p => p && !p.startsWith('#'))

      return { isMonorepo: true, workspaces: packages }
    }
  } catch {
    // Parse error
  }
  
  return { isMonorepo: false, workspaces: [] }
}

// Parse package.json workspaces (npm/yarn)
const parsePackageJsonWorkspaces = content => {
  try {
    const pkg = JSON.parse(content)

    // Check for workspaces field (npm/yarn)
    if (pkg.workspaces) {
      const workspaces = Array.isArray(pkg.workspaces)
        ? pkg.workspaces
        : pkg.workspaces.packages || []

      if (workspaces.length > 0) {
        return { isMonorepo: true, workspaces }
      }
    }
  } catch {
    // Parse error
  }
  
  return { isMonorepo: false, workspaces: [] }
}

// Parse turbo.json
const parseTurboConfig = content => {
  try {
    // Turbo.json itself doesn't define workspaces, but its presence indicates monorepo
    // We'll need to check package.json separately
    JSON.parse(content) // Validate it's valid JSON
    
    return { isMonorepo: true, workspaces: ['apps/*', 'packages/*'] } // Common turbo patterns
  } catch {
    // Parse error
  }
  
  return { isMonorepo: false, workspaces: [] }
}

// Parse lerna.json
const parseLernaConfig = content => {
  try {
    const config = JSON.parse(content)
    const packages = config.packages || ['packages/*']
    
    return { isMonorepo: true, workspaces: packages }
  } catch {
    // Parse error
  }
  
  return { isMonorepo: false, workspaces: [] }
}

// Parse nx.json
const parseNxConfig = content => {
  try {
    JSON.parse(content) // Validate it's valid JSON
    // Nx projects are typically in apps/ and libs/

    return { isMonorepo: true, workspaces: ['apps/*', 'libs/*', 'packages/*'] }
  } catch {
    // Parse error
  }
  
  return { isMonorepo: false, workspaces: [] }
}

// Parse rush.json
const parseRushConfig = content => {
  try {
    const config = JSON.parse(content)
    if (config.projects && Array.isArray(config.projects)) {
      const workspaces = config.projects.map(p => p.projectFolder)
      
      return { isMonorepo: true, workspaces }
    }
  } catch {
    // Parse error
  }
  
  return { isMonorepo: false, workspaces: [] }
}

// Expand workspace glob patterns to actual directories
const expandWorkspacePatterns = async (parsed, branchName, patterns) => {
  const projects = []

  for (const pattern of patterns) {
    // Handle glob patterns like "apps/*" or "packages/*"
    if (pattern.includes('*')) {
      const basePath = pattern.replace(/\/?\*.*$/, '')
      const directories = await listDirectories(parsed, branchName, basePath)

      for (const dir of directories) {
        const fullPath = `${basePath}/${dir}`
        const hasPackageJson = await checkFileExists(parsed, branchName, `${fullPath}/package.json`)

        if (hasPackageJson) {
          const projectInfo = await getProjectInfo(parsed, branchName, fullPath)
          projects.push({
            path: `/${fullPath}`,
            name: projectInfo.name || dir,
            description: projectInfo.description || '',
            framework: projectInfo.framework || null,
          })
        }
      }
    } else {
      // Direct path without glob
      const hasPackageJson = await checkFileExists(parsed, branchName, `${pattern}/package.json`)
      if (hasPackageJson) {
        const projectInfo = await getProjectInfo(parsed, branchName, pattern)
        projects.push({
          path: `/${pattern}`,
          name: projectInfo.name || pattern.split('/').pop(),
          description: projectInfo.description || '',
          framework: projectInfo.framework || null,
        })
      }
    }
  }

  return projects
}

// List directories in a path using GitHub API
const listDirectories = async (parsed, branchName, path) => {
  try {
    if (parsed.provider === 'github.com') {
      const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${path}?ref=${branchName}`
      const response = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
      })

      if (response.ok) {
        const items = await response.json()
        
        return items
          .filter(item => item.type === 'dir')
          .map(item => item.name)
      }
    } else if (parsed.provider === 'gitlab.com') {
      const apiUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${parsed.owner}/${parsed.repo}`)}/repository/tree?path=${path}&ref=${branchName}`
      const response = await fetch(apiUrl)

      if (response.ok) {
        const items = await response.json()
        
        return items
          .filter(item => item.type === 'tree')
          .map(item => item.name)
      }
    }
  } catch (error) {
    console.debug(`Could not list directories in ${path}:`, error.message)
  }
  
  return []
}

// Check if a file exists
const checkFileExists = async (parsed, branchName, filePath) => {
  try {
    let rawUrl = ''

    if (parsed.provider === 'github.com') {
      rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branchName}/${filePath}`
    } else if (parsed.provider === 'gitlab.com') {
      rawUrl = `https://gitlab.com/${parsed.owner}/${parsed.repo}/-/raw/${branchName}/${filePath}`
    } else if (parsed.provider === 'bitbucket.org') {
      rawUrl = `https://bitbucket.org/${parsed.owner}/${parsed.repo}/raw/${branchName}/${filePath}`
    }

    const response = await fetch(rawUrl, { method: 'HEAD' })
    
    return response.ok
  } catch {
    return false
  }
}

// Get project info from package.json
const getProjectInfo = async (parsed, branchName, projectPath) => {
  try {
    let rawUrl = ''
    const pkgPath = `${projectPath}/package.json`

    if (parsed.provider === 'github.com') {
      rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branchName}/${pkgPath}`
    } else if (parsed.provider === 'gitlab.com') {
      rawUrl = `https://gitlab.com/${parsed.owner}/${parsed.repo}/-/raw/${branchName}/${pkgPath}`
    } else if (parsed.provider === 'bitbucket.org') {
      rawUrl = `https://bitbucket.org/${parsed.owner}/${parsed.repo}/raw/${branchName}/${pkgPath}`
    }

    const response = await fetch(rawUrl)
    if (response.ok) {
      const content = await response.text()
      const pkg = JSON.parse(content)
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }

      // Detect framework
      let framework = null
      if (deps['next']) framework = 'Next.js'
      else if (deps['nuxt'] || deps['nuxt3']) framework = 'Nuxt'
      else if (deps['@remix-run/react']) framework = 'Remix'
      else if (deps['astro']) framework = 'Astro'
      else if (deps['@sveltejs/kit']) framework = 'SvelteKit'
      else if (deps['vite']) framework = 'Vite'
      else if (deps['express']) framework = 'Express'
      else if (deps['@nestjs/core']) framework = 'NestJS'
      else if (deps['fastify']) framework = 'Fastify'

      return {
        name: pkg.name || '',
        description: pkg.description || '',
        framework,
      }
    }
  } catch (error) {
    console.debug(`Could not get project info for ${projectPath}:`, error.message)
  }
  
  return { name: '', description: '', framework: null }
}

// Handle project selection from monorepo
const selectMonorepoProject = project => {
  projectPath.value = project.path

  // Auto-fill app name from project name if empty
  if (!appName.value && project.name) {
    // Convert scoped package name to valid app name
    appName.value = project.name
      .replace(/^@[^/]+\//, '') // Remove scope
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 32)
  }

  // Update description if empty
  if (!appDescription.value && project.description) {
    appDescription.value = project.description
  }

  // Trigger port detection for the selected project
  const parsed = parseRepoUrl(repoUrl.value)
  if (parsed) {
    detectPortFromRepo(parsed)
  }
}

// Re-check repo when authenticated (for private repos)
const recheckPrivateRepo = async () => {
  if (!repoToken.value) return

  const parsed = parseRepoUrl(repoUrl.value)
  if (!parsed) return

  repoCheckStatus.value = 'checking'

  try {
    let apiUrl = ''
    const headers = { 'Accept': 'application/json' }

    if (parsed.provider === 'github.com') {
      apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`
      headers['Authorization'] = `token ${repoToken.value}`
    } else if (parsed.provider === 'gitlab.com') {
      apiUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${parsed.owner}/${parsed.repo}`)}`
      headers['PRIVATE-TOKEN'] = repoToken.value
    } else if (parsed.provider === 'bitbucket.org') {
      apiUrl = `https://api.bitbucket.org/2.0/repositories/${parsed.owner}/${parsed.repo}`
      headers['Authorization'] = `Bearer ${repoToken.value}`
    }

    const response = await fetch(apiUrl, { method: 'GET', headers })

    if (response.ok) {
      // Auth successful, try to detect port from private repo
      await detectPortFromPrivateRepo(parsed)
    } else {
      repoCheckError.value = 'Authentication failed. Please check your credentials.'
    }
  } catch (error) {
    console.error('Error checking private repo:', error)
    repoCheckError.value = 'Error verifying repository access'
  }
}

// Detect port from private repository
const detectPortFromPrivateRepo = async parsed => {
  if (!parsed || !repoToken.value) return

  const branchName = branch.value || 'main'
  const basePath = projectPath.value && projectPath.value !== '/' ? projectPath.value.replace(/^\//, '') + '/' : ''

  // Try to fetch package.json from private repo using API
  try {
    let apiUrl = ''
    const headers = { 'Accept': 'application/vnd.github.v3.raw' }

    if (parsed.provider === 'github.com') {
      apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${basePath}package.json?ref=${branchName}`
      headers['Authorization'] = `token ${repoToken.value}`

      const response = await fetch(apiUrl, { method: 'GET', headers })
      if (response.ok) {
        const content = await response.text()
        const result = detectPortFromPackageJson(content)
        if (result.port) {
          detectedPort.value = result.port
          detectedFramework.value = result.framework || null
          appPort.value = result.port.toString()
          portAutoDetected.value = true
          console.log(`Auto-detected port ${result.port} from private repo`, result.framework ? `(${result.framework})` : '')
        }
      }
    }
  } catch (error) {
    console.debug('Could not detect port from private repo:', error.message)
  }
}

// Test authentication connection for private repos
const testAuthConnection = async () => {
  const parsed = parseRepoUrl(repoUrl.value)
  if (!parsed || !repoToken.value) return

  authTestStatus.value = 'testing'
  authTestError.value = ''

  try {
    let apiUrl = ''
    const headers = { 'Accept': 'application/json' }

    if (parsed.provider === 'github.com') {
      apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`
      headers['Authorization'] = `token ${repoToken.value}`
    } else if (parsed.provider === 'gitlab.com') {
      apiUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${parsed.owner}/${parsed.repo}`)}`
      headers['PRIVATE-TOKEN'] = repoToken.value
    } else if (parsed.provider === 'bitbucket.org') {
      apiUrl = `https://api.bitbucket.org/2.0/repositories/${parsed.owner}/${parsed.repo}`
      headers['Authorization'] = `Bearer ${repoToken.value}`
    }

    const response = await fetch(apiUrl, { method: 'GET', headers })

    if (response.ok) {
      authTestStatus.value = 'success'

      // Fetch branches after successful auth test
      await fetchBranches(parsed, headers)

      // Also detect monorepo and port
      await detectMonorepoStructureWithAuth(parsed)
      await detectPortFromPrivateRepo(parsed)
    } else {
      authTestStatus.value = 'error'
      if (response.status === 401) {
        authTestError.value = 'Invalid token. Please check your credentials.'
      } else if (response.status === 403) {
        authTestError.value = 'Access denied. Token may lack required permissions.'
      } else if (response.status === 404) {
        authTestError.value = 'Repository not found. Check URL and permissions.'
      } else {
        authTestError.value = `Authentication failed (HTTP ${response.status})`
      }
    }
  } catch (error) {
    console.error('Auth test error:', error)
    authTestStatus.value = 'error'
    authTestError.value = 'Network error. Please try again.'
  }
}

// Fetch branches from repository
const fetchBranches = async (parsed, authHeaders = {}) => {
  if (!parsed) return

  branchesLoading.value = true
  branchesError.value = ''
  branches.value = []

  try {
    let apiUrl = ''
    const headers = { 'Accept': 'application/json', ...authHeaders }

    if (parsed.provider === 'github.com') {
      apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches?per_page=100`
    } else if (parsed.provider === 'gitlab.com') {
      apiUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${parsed.owner}/${parsed.repo}`)}/repository/branches?per_page=100`
    } else if (parsed.provider === 'bitbucket.org') {
      apiUrl = `https://api.bitbucket.org/2.0/repositories/${parsed.owner}/${parsed.repo}/refs/branches?pagelen=100`
    }

    const response = await fetch(apiUrl, { method: 'GET', headers })

    if (response.ok) {
      const data = await response.json()
      let branchList = []

      if (parsed.provider === 'github.com') {
        branchList = data.map(b => ({
          name: b.name,
          isDefault: b.name === 'main' || b.name === 'master',
        }))
      } else if (parsed.provider === 'gitlab.com') {
        branchList = data.map(b => ({
          name: b.name,
          isDefault: b.default || b.name === 'main' || b.name === 'master',
        }))
      } else if (parsed.provider === 'bitbucket.org') {
        branchList = (data.values || []).map(b => ({
          name: b.name,
          isDefault: b.name === 'main' || b.name === 'master',
        }))
      }

      // Sort branches: default branches first, then alphabetically
      branchList.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1
        if (!a.isDefault && b.isDefault) return 1
        
        return a.name.localeCompare(b.name)
      })

      branches.value = branchList

      // Auto-select main or master if available and no branch is selected yet
      if (!branch.value || branch.value === 'main') {
        const mainBranch = branchList.find(b => b.name === 'main')
        const masterBranch = branchList.find(b => b.name === 'master')
        if (mainBranch) {
          branch.value = 'main'
        } else if (masterBranch) {
          branch.value = 'master'
        } else if (branchList.length > 0) {
          branch.value = branchList[0].name
        }
      }

      console.log(`Fetched ${branchList.length} branches, selected: ${branch.value}`)
    } else {
      branchesError.value = 'Could not fetch branches'
      console.warn('Failed to fetch branches:', response.status)
    }
  } catch (error) {
    console.error('Error fetching branches:', error)
    branchesError.value = 'Error loading branches'
  } finally {
    branchesLoading.value = false
  }
}

// Detect monorepo structure with authentication
const detectMonorepoStructureWithAuth = async parsed => {
  if (!parsed || !repoToken.value) return

  detectingMonorepo.value = true
  isMonorepo.value = false
  monorepoType.value = null
  monorepoProjects.value = []

  const branchName = branch.value || 'main'
  const headers = { 'Accept': 'application/vnd.github.v3.raw' }

  if (parsed.provider === 'github.com') {
    headers['Authorization'] = `token ${repoToken.value}`
  } else if (parsed.provider === 'gitlab.com') {
    headers['PRIVATE-TOKEN'] = repoToken.value
  } else if (parsed.provider === 'bitbucket.org') {
    headers['Authorization'] = `Bearer ${repoToken.value}`
  }

  // Check for common monorepo config files
  const monorepoConfigs = [
    { file: 'pnpm-workspace.yaml', type: 'pnpm', parser: parsePnpmWorkspace },
    { file: 'package.json', type: 'npm/yarn', parser: parsePackageJsonWorkspaces },
  ]

  for (const config of monorepoConfigs) {
    try {
      let apiUrl = ''

      if (parsed.provider === 'github.com') {
        apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${config.file}?ref=${branchName}`
      }

      // Use HEAD request first to check if file exists (avoids 404 errors in console)
      const headResponse = await fetch(apiUrl, { method: 'HEAD', headers })
      if (!headResponse.ok) {
        continue // File doesn't exist, skip to next config
      }

      // File exists, fetch the content
      const response = await fetch(apiUrl, { method: 'GET', headers })
      if (response.ok) {
        const content = await response.text()
        const result = config.parser(content)

        if (result.isMonorepo && result.workspaces.length > 0) {
          isMonorepo.value = true
          monorepoType.value = config.type

          // For private repos, use API to expand workspaces
          const projects = await expandWorkspacePatternsWithAuth(parsed, branchName, result.workspaces, headers)
          monorepoProjects.value = projects

          console.log(`Detected ${config.type} monorepo with ${projects.length} projects`)
          break
        }
      }
    } catch (error) {
      console.debug(`Could not fetch ${config.file}:`, error.message)
    }
  }

  detectingMonorepo.value = false
}

// Expand workspace patterns with authentication
const expandWorkspacePatternsWithAuth = async (parsed, branchName, patterns, headers) => {
  const projects = []

  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const basePath = pattern.replace(/\/?\*.*$/, '')

      try {
        if (parsed.provider === 'github.com') {
          const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${basePath}?ref=${branchName}`
          const response = await fetch(apiUrl, { method: 'GET', headers: { ...headers, 'Accept': 'application/json' } })

          if (response.ok) {
            const items = await response.json()
            const directories = items.filter(item => item.type === 'dir')

            for (const dir of directories) {
              const fullPath = `${basePath}/${dir.name}`
              const projectInfo = await getProjectInfoWithAuth(parsed, branchName, fullPath, headers)

              if (projectInfo.hasPackageJson) {
                projects.push({
                  path: `/${fullPath}`,
                  name: projectInfo.name || dir.name,
                  description: projectInfo.description || '',
                  framework: projectInfo.framework || null,
                })
              }
            }
          }
        }
      } catch (error) {
        console.debug(`Could not expand pattern ${pattern}:`, error.message)
      }
    }
  }

  return projects
}

// Get project info with authentication
const getProjectInfoWithAuth = async (parsed, branchName, projectPath, headers) => {
  try {
    if (parsed.provider === 'github.com') {
      const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${projectPath}/package.json?ref=${branchName}`
      const response = await fetch(apiUrl, { method: 'GET', headers: { ...headers, 'Accept': 'application/vnd.github.v3.raw' } })

      if (response.ok) {
        const content = await response.text()
        const pkg = JSON.parse(content)
        const deps = { ...pkg.dependencies, ...pkg.devDependencies }

        let framework = null
        if (deps['next']) framework = 'Next.js'
        else if (deps['nuxt'] || deps['nuxt3']) framework = 'Nuxt'
        else if (deps['@remix-run/react']) framework = 'Remix'
        else if (deps['astro']) framework = 'Astro'
        else if (deps['@sveltejs/kit']) framework = 'SvelteKit'
        else if (deps['vite']) framework = 'Vite'

        return {
          hasPackageJson: true,
          name: pkg.name || '',
          description: pkg.description || '',
          framework,
        }
      }
    }
  } catch (error) {
    console.debug(`Could not get project info for ${projectPath}:`, error.message)
  }

  return { hasPackageJson: false, name: '', description: '', framework: null }
}

// Debounce helper
let repoCheckTimeout = null
const debouncedRepoCheck = () => {
  if (repoCheckTimeout) clearTimeout(repoCheckTimeout)
  repoCheckTimeout = setTimeout(() => {
    const parsed = parseRepoUrl(repoUrl.value)
    if (parsed) {
      checkRepoAccess()
    } else {
      repoCheckStatus.value = 'idle'
    }
  }, 800)
}

// Watch for repo URL changes
watch(repoUrl, () => {
  portAutoDetected.value = false

  // Reset auth test status and branches when URL changes
  authTestStatus.value = 'idle'
  authTestError.value = ''
  branches.value = []
  branch.value = 'main'
  debouncedRepoCheck()
})

// Sync appDescription with appName
watch(appName, newName => {
  appDescription.value = newName
})

// Watch for branch changes to re-detect port
watch(branch, () => {
  if (repoCheckStatus.value === 'public') {
    const parsed = parseRepoUrl(repoUrl.value)
    if (parsed) {
      detectPortFromRepo(parsed)
    }
  }
})

// Watch for project path changes to re-detect port
watch(projectPath, () => {
  if (repoCheckStatus.value === 'public') {
    const parsed = parseRepoUrl(repoUrl.value)
    if (parsed) {
      detectPortFromRepo(parsed)
    }
  }
})

// Watch for token changes to reset auth test status
watch(repoToken, () => {
  // Reset auth test when token changes so user needs to test again
  if (authTestStatus.value !== 'idle') {
    authTestStatus.value = 'idle'
    authTestError.value = ''
  }
})

// Runtime options
const runtimeOptions = [
  { title: 'Node.js', value: 'Node.js' },
  { title: 'Python', value: 'Python' },
  { title: 'Rust', value: 'Rust' },
  { title: 'Go', value: 'Go' },
  { title: 'Java', value: 'Java' },
  { title: '.NET', value: '.NET' },
  { title: 'Bun', value: 'Bun' },
  { title: 'Ruby', value: 'Ruby' },
  { title: 'PHP', value: 'PHP' },
]

// Runtime version placeholders and hints
const runtimePlaceholder = computed(() => {
  const placeholders = {
    'Node.js': '20',
    'Python': '3.12',
    'Rust': 'stable',
    'Go': '1.22.0',
    'Java': '21',
    '.NET': '8.0',
    'Bun': '1.0.25',
    'Ruby': '3.3',
    'PHP': '8.3',
  }
  
  return placeholders[selectedRuntime.value] || ''
})

const runtimeHint = computed(() => {
  const hints = {
    'Node.js': 'e.g., 18, 20, 22 (LTS versions recommended)',
    'Python': 'e.g., 3.10, 3.11, 3.12',
    'Rust': 'e.g., stable, nightly, 1.75.0',
    'Go': 'e.g., 1.21.0, 1.22.0',
    'Java': 'e.g., 17, 21 (LTS versions)',
    '.NET': 'e.g., 6.0, 7.0, 8.0',
    'Bun': 'e.g., 1.0.0, 1.0.25',
    'Ruby': 'e.g., 3.2, 3.3',
    'PHP': 'e.g., 8.1, 8.2, 8.3',
  }
  
  return hints[selectedRuntime.value] || ''
})

// Runtime environment variable mapping
const runtimeEnvVarMap = {
  'Node.js': 'NODE_VERSION',
  'Python': 'PYTHON_VERSION',
  'Rust': 'RUST_VERSION',
  'Go': 'GO_VERSION',
  'Java': 'JAVA_VERSION',
  '.NET': 'DOTNET_VERSION',
  'Bun': 'BUN_VERSION',
  'Ruby': 'RUBY_VERSION',
  'PHP': 'PHP_VERSION',
}

// Step 2: Plan
const selectedPlan = ref(null)
const billingPeriod = ref('1')

// Custom plan resources (defaults match Pro plan)
const customPlanResources = ref({
  cpu: 2,
  ram: 6000,
  storage: 20,
  instances: 2,
})

// Custom plan price calculation
const customPlanPrice = ref(null)
const customPlanPriceLoading = ref(false)
const customPlanPriceError = ref(null)

// Pro plan features
const customDomain = ref('')

// Geolocation state
const possibleLocations = ref([])
const selectedGeo = ref({ continent: 'ALL', country: 'ALL', region: 'ALL' })

// Multiple geolocation arrays (like Docker app registration)
const geolocation = ref({
  allowedContinent: null,
  allowedCountry: null,
  allowedRegion: null,
  forbiddenContinent: null,
  forbiddenCountry: null,
  forbiddenRegion: null,
})
const allowedGeolocations = ref([])
const forbiddenGeolocations = ref([])

// Fetch geolocation data from Flux network stats
const fetchGeolocationData = async () => {
  try {
    const response = await axios.get('https://stats.runonflux.io/fluxinfo?projection=geo')
    if (response.data.status === 'success') {
      const geoData = response.data.data
      if (geoData.length > 5000) {
        const locations = []
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
        possibleLocations.value = locations
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Flux geolocation stats.')
  }
}

// Get continents from available locations with instance counts
const getContinents = () => {
  const options = [{ value: 'ALL', text: 'Global (Any Location)', instances: null }]
  const continentInstances = {}

  possibleLocations.value.forEach(loc => {
    const parts = loc.value.split('_')

    // Only count continent-level entries (no underscores)
    if (parts.length === 1) {
      const cont = parts[0]
      continentInstances[cont] = (continentInstances[cont] || 0) + loc.instances
    }
  })

  Object.entries(continentInstances).forEach(([cont, instances]) => {
    const name = geolocations.continents.find(c => c.code === cont)?.name || cont
    options.push({ value: cont, text: name, instances })
  })

  return options
}

// Get countries for selected continent with instance counts
const getCountries = continentCode => {
  if (!continentCode || continentCode === 'ALL') return [{ value: 'ALL', text: 'All Countries', instances: null }]

  const countryInstances = {}

  possibleLocations.value.forEach(loc => {
    const parts = loc.value.split('_')

    // Only count country-level entries (exactly 2 parts: continent_country)
    if (parts.length === 2 && parts[0] === continentCode) {
      const count = parts[1]
      countryInstances[count] = (countryInstances[count] || 0) + loc.instances
    }
  })

  const countries = [{ value: 'ALL', text: 'All Countries', instances: null }]
  Object.entries(countryInstances).forEach(([count, instances]) => {
    const name = geolocations.countries.find(c => c.code === count)?.name || count
    countries.push({ value: count, text: name, instances })
  })

  return countries
}

// Get regions for selected country with instance counts
const getRegions = (continentCode, countryCode) => {
  if (!continentCode || !countryCode || countryCode === 'ALL') return [{ value: 'ALL', text: 'All Regions', instances: null }]

  const regionInstances = {}

  possibleLocations.value.forEach(loc => {
    const parts = loc.value.split('_')

    // Only count region-level entries (exactly 3 parts: continent_country_region)
    if (parts.length === 3 && parts[0] === continentCode && parts[1] === countryCode) {
      const region = parts[2]
      regionInstances[region] = (regionInstances[region] || 0) + loc.instances
    }
  })

  const regions = [{ value: 'ALL', text: 'All Regions', instances: null }]
  Object.entries(regionInstances).forEach(([region, instances]) => {
    regions.push({ value: region, text: region, instances })
  })

  return regions
}

// Build geolocation code from selection
const buildGeoCode = selection => {
  if (selection.continent === 'ALL') return 'acALL'

  let code = `ac${selection.continent}`
  if (selection.country && selection.country !== 'ALL') {
    code += `_${selection.country}`
    if (selection.region && selection.region !== 'ALL') {
      code += `_${selection.region}`
    }
  }
  
  return code
}

// Get human-readable label for geolocation code
const getGeolocationLabel = code => {
  const raw = code.replace(/^a!?c/, '')
  if (raw === 'ALL') return 'Global (Any Location)'

  const [cont, count, region] = raw.split('_')
  const contName = geolocations.continents.find(c => c.code === cont)?.name || cont
  const countName = count ? geolocations.countries.find(c => c.code === count)?.name || count : ''
  const regionName = region || ''

  if (regionName) return `${contName} / ${countName} / ${regionName}`
  if (countName) return `${contName} / ${countName}`

  return contName
}

// Get allowed countries for continent
const getAllowedCountries = continentCode => {
  if (!continentCode) return []
  const countryInstances = {}

  possibleLocations.value.forEach(loc => {
    const parts = loc.value.split('_')
    if (parts.length === 2 && parts[0] === continentCode) {
      const count = parts[1]
      countryInstances[count] = (countryInstances[count] || 0) + loc.instances
    }
  })

  return Object.entries(countryInstances).map(([count, instances]) => {
    const name = geolocations.countries.find(c => c.code === count)?.name || count
    
    return { value: count, text: name, instances }
  })
}

// Get allowed regions for country
const getAllowedRegions = (continentCode, countryCode) => {
  if (!continentCode || !countryCode) return []
  const regionInstances = {}

  possibleLocations.value.forEach(loc => {
    const parts = loc.value.split('_')
    if (parts.length === 3 && parts[0] === continentCode && parts[1] === countryCode) {
      const region = parts[2]
      regionInstances[region] = (regionInstances[region] || 0) + loc.instances
    }
  })

  return Object.entries(regionInstances).map(([region, instances]) => ({
    value: region, text: region, instances,
  }))
}

// Get forbidden countries for continent
const getForbiddenCountries = continentCode => getAllowedCountries(continentCode)

// Get forbidden regions for country
const getForbiddenRegions = (continentCode, countryCode) => getAllowedRegions(continentCode, countryCode)

// Build geolocation code from selection (for multi-select)
const buildGeoCodeFromSelection = (continent, country, region, isForbidden = false) => {
  const prefix = isForbidden ? 'a!c' : 'ac'
  let code = `${prefix}${continent}`
  if (country) {
    code += `_${country}`
    if (region) {
      code += `_${region}`
    }
  }
  
  return code
}

// Format geolocation label for chips display
const formatGeolocationLabel = geoCode => {
  const isAllowed = geoCode.startsWith('ac') && !geoCode.startsWith('a!c')
  const isForbidden = geoCode.startsWith('a!c')

  let locationCode
  if (isAllowed) {
    locationCode = geoCode.slice(2) // Remove 'ac'
  } else if (isForbidden) {
    locationCode = geoCode.slice(3) // Remove 'a!c'
  } else {
    return geoCode
  }

  const [cont, count, region] = locationCode.split('_')
  const contName = geolocations.continents.find(c => c.code === cont)?.name || cont
  const countName = count ? geolocations.countries.find(c => c.code === count)?.name || count : null
  const regionName = region || null

  if (regionName) return `${contName} / ${countName} / ${regionName}`
  if (countName) return `${contName} / ${countName}`
  
  return contName
}

// Check for geolocation conflicts
const checkGeolocationConflicts = (newGeoCode, type) => {
  const newLocationCode = newGeoCode.startsWith('a!c') ? newGeoCode.slice(3) : newGeoCode.slice(2)
  const newParts = newLocationCode.split('_')
  const newContinent = newParts[0]
  const newCountry = newParts[1]
  const newRegion = newParts[2]

  if (type === 'allowed') {
    for (const forbiddenGeo of forbiddenGeolocations.value) {
      const forbiddenLocationCode = forbiddenGeo.slice(3)
      const forbiddenParts = forbiddenLocationCode.split('_')
      const forbiddenContinent = forbiddenParts[0]
      const forbiddenCountry = forbiddenParts[1]
      const forbiddenRegion = forbiddenParts[2]

      // Check for exact match or hierarchical conflict
      if (newContinent === forbiddenContinent) {
        if (!newCountry && !forbiddenCountry) {
          return { hasConflict: true, message: `This location conflicts with forbidden: ${formatGeolocationLabel(forbiddenGeo)}` }
        }
        if (newCountry === forbiddenCountry) {
          if (!newRegion && !forbiddenRegion) {
            return { hasConflict: true, message: `This location conflicts with forbidden: ${formatGeolocationLabel(forbiddenGeo)}` }
          }
          if (newRegion === forbiddenRegion) {
            return { hasConflict: true, message: `This location conflicts with forbidden: ${formatGeolocationLabel(forbiddenGeo)}` }
          }
        }
      }
    }
  } else {
    for (const allowedGeo of allowedGeolocations.value) {
      const allowedLocationCode = allowedGeo.slice(2)
      const allowedParts = allowedLocationCode.split('_')
      const allowedContinent = allowedParts[0]
      const allowedCountry = allowedParts[1]
      const allowedRegion = allowedParts[2]

      if (newContinent === allowedContinent) {
        if (!newCountry && !allowedCountry) {
          return { hasConflict: true, message: `This location conflicts with allowed: ${formatGeolocationLabel(allowedGeo)}` }
        }
        if (newCountry === allowedCountry) {
          if (!newRegion && !allowedRegion) {
            return { hasConflict: true, message: `This location conflicts with allowed: ${formatGeolocationLabel(allowedGeo)}` }
          }
          if (newRegion === allowedRegion) {
            return { hasConflict: true, message: `This location conflicts with allowed: ${formatGeolocationLabel(allowedGeo)}` }
          }
        }
      }
    }
  }

  return { hasConflict: false }
}

// Add allowed geolocation
const addAllowedGeolocation = () => {
  if (!geolocation.value.allowedContinent) return

  const geoCode = buildGeoCodeFromSelection(
    geolocation.value.allowedContinent,
    geolocation.value.allowedCountry,
    geolocation.value.allowedRegion,
    false,
  )

  // Check for conflicts with forbidden geolocations
  const conflictCheck = checkGeolocationConflicts(geoCode, 'allowed')
  if (conflictCheck.hasConflict) {
    console.warn(conflictCheck.message)
    
    return
  }

  // Check if this geolocation already exists
  if (!allowedGeolocations.value.includes(geoCode)) {
    allowedGeolocations.value.push(geoCode)
  }

  // Reset the form
  geolocation.value.allowedContinent = null
  geolocation.value.allowedCountry = null
  geolocation.value.allowedRegion = null
}

// Add forbidden geolocation
const addForbiddenGeolocation = () => {
  if (!geolocation.value.forbiddenContinent) return

  const geoCode = buildGeoCodeFromSelection(
    geolocation.value.forbiddenContinent,
    geolocation.value.forbiddenCountry,
    geolocation.value.forbiddenRegion,
    true,
  )

  // Check for conflicts with allowed geolocations
  const conflictCheck = checkGeolocationConflicts(geoCode, 'forbidden')
  if (conflictCheck.hasConflict) {
    console.warn(conflictCheck.message)
    
    return
  }

  // Check if this geolocation already exists
  if (!forbiddenGeolocations.value.includes(geoCode)) {
    forbiddenGeolocations.value.push(geoCode)
  }

  // Reset the form
  geolocation.value.forbiddenContinent = null
  geolocation.value.forbiddenCountry = null
  geolocation.value.forbiddenRegion = null
}

// Remove allowed geolocation
const removeAllowedGeolocation = index => {
  allowedGeolocations.value.splice(index, 1)
}

// Remove forbidden geolocation
const removeForbiddenGeolocation = index => {
  forbiddenGeolocations.value.splice(index, 1)
}

// Clear all geolocations
const clearAllGeolocations = () => {
  allowedGeolocations.value = []
  forbiddenGeolocations.value = []
}

// Get all geolocation codes for app spec
const getGeolocationCodes = () => {
  const codes = []
  codes.push(...allowedGeolocations.value)
  codes.push(...forbiddenGeolocations.value)
  
  return codes
}

// Banned ports from FluxOS config - apps cannot use these ports
// Source: fluxosdev/ZelBack/config/default.js
const BANNED_PORTS = [
  // Port ranges
  { min: 16100, max: 16299 },
  { min: 26100, max: 26299 },
  { min: 30000, max: 30099 },

  // Enterprise/privileged ports (0-1023) - require special permissions
  { min: 0, max: 1023 },

  // Individual banned ports
  8384,   // Syncthing
  27017,  // MongoDB
  22,     // SSH
  23,     // Telnet
  25,     // SMTP
  3389,   // RDP
  5900,   // VNC
  5800,   // VNC HTTP
  5901,   // VNC
  161,    // SNMP
  512,    // rexec
  513,    // rlogin
  3388,   // RDP variant
  4444,   // Common backdoor port
  123,    // NTP
  53,     // DNS
  // Enterprise ports
  8080,   // HTTP alternate
  8081,   // HTTP alternate
  8443,   // HTTPS alternate
  6667,   // IRC
]

// Check if a port is banned
const isPortBanned = port => {
  for (const banned of BANNED_PORTS) {
    if (typeof banned === 'number') {
      if (port === banned) return true
    } else if (banned.min !== undefined && banned.max !== undefined) {
      if (port >= banned.min && port <= banned.max) return true
    }
  }
  
  return false
}

// Generate random exposed port between 20000-65535, avoiding banned ports
const generateRandomPort = (min = 20000, max = 65535) => {
  let port
  let attempts = 0
  const maxAttempts = 100

  do {
    port = Math.floor(Math.random() * (max - min + 1)) + min
    attempts++
  } while (isPortBanned(port) && attempts < maxAttempts)

  return port
}

// Random exposed port (generated once on mount)
const exposedPort = ref(generateRandomPort())

// Random port for Orbit management interface (container port 9001)
// Ensure it's different from the exposed port and not banned
const generateUniqueManagementPort = () => {
  let port = generateRandomPort(10000, 65535)
  let attempts = 0
  const maxAttempts = 100

  while ((port === exposedPort.value || isPortBanned(port)) && attempts < maxAttempts) {
    port = generateRandomPort(10000, 65535)
    attempts++
  }

  return port
}
const orbitManagementPort = ref(generateUniqueManagementPort())

// Step 5: Terms/Review
const acceptedTerms = ref(false)

// Deployment state
const deploying = ref(false)

// Registration state
const registrationHash = ref(null)
const registrationMessage = ref('Preparing registration...')
const registrationError = ref('')
const isSigning = ref(false)
const isPropagating = ref(false)
const signature = ref('')
const dataToSign = ref('')
const timestamp = ref(0)
const deploymentAddress = ref('')
const loginType = ref('zelcore') // Default to zelcore
const websocket = ref(null)
const finalAppSpec = ref(null) // Spec with uploaded contacts

// Registration success state
const testFinished = ref(false)

// Payment state
const paymentProcessing = ref(false)
const paymentConfirmed = ref(false)
const paymentMethod = ref('')
const paymentMonitoringInterval = ref(null)
const paymentMonitoringTimeout = ref(null)
const paymentMonitoringPhase = ref('blockchain') // 'blockchain' or 'deployment'
const checkoutLoading = ref(false)
const showFiatOptions = ref(false)
const showCryptoOptions = ref(false)
const fiatPaymentInitiated = ref(false)

// Duplicate git repo check state
const duplicateGitRepoCheckStatus = ref('idle') // 'idle', 'checking', 'checked'
const hasDuplicateGitRepo = ref(false)
const existingOrbitAppName = ref(null)

// Calculated price for non-eligible users
const calculatedAppPrice = ref(null) // { usd: number, flux: number }
const calculatedAppPriceLoading = ref(false)
const calculatedAppPriceError = ref(null)

// Computed: Whether user is eligible for first month free
const eligibleForFirstMonthFree = computed(() => {
  // Not eligible if they already have an orbit app with same git repo
  if (hasDuplicateGitRepo.value) return false
  
  return true
})

// Calculate price when duplicate check completes and user is not eligible
watch(
  () => [duplicateGitRepoCheckStatus.value, hasDuplicateGitRepo.value, currentStep.value],
  ([checkStatus, hasDuplicate, step]) => {
    // When on step 4 (review) or later, duplicate check is done, and user has duplicate (not eligible)
    if (step >= 4 && checkStatus === 'checked' && hasDuplicate && !calculatedAppPrice.value && !calculatedAppPriceLoading.value) {
      calculateAppPrice()
    }
  },
)

// Plan resources
const planResources = computed(() => {
  if (selectedPlan.value === 'free') {
    return { cpu: 0.5, ram: 1, storage: 5, instances: 1 }
  }

  if (selectedPlan.value === 'developer') {
    return { cpu: 1.5, ram: 4, storage: 15, instances: 2 }
  }

  if (selectedPlan.value === 'custom') {
    return {
      cpu: customPlanResources.value.cpu,
      ram: customPlanResources.value.ram / 1000, // Convert MB to GB for display
      storage: customPlanResources.value.storage,
      instances: customPlanResources.value.instances,
    }
  }

  // Pro plan
  return { cpu: 2, ram: 6, storage: 20, instances: 2 }
})

// Provider detection
const detectedProvider = computed(() => {
  if (!repoUrl.value) return null
  if (repoUrl.value.includes('github.com')) return 'GitHub'
  if (repoUrl.value.includes('gitlab.com')) return 'GitLab'
  if (repoUrl.value.includes('bitbucket.org')) return 'Bitbucket'
  
  return null
})

const providerIcon = computed(() => {
  switch (detectedProvider.value) {
  case 'GitHub': return 'mdi-github'
  case 'GitLab': return 'mdi-gitlab'
  case 'Bitbucket': return 'mdi-bitbucket'
  default: return 'mdi-git'
  }
})

const providerColor = computed(() => {
  switch (detectedProvider.value) {
  case 'GitHub': return 'grey-darken-3'
  case 'GitLab': return 'orange'
  case 'Bitbucket': return 'blue'
  default: return 'primary'
  }
})

// Billing calculations
const billingPeriodLabel = computed(() => {
  const labels = { '1': '1 Month', '3': '3 Months', '6': '6 Months', '12': '12 Months' }
  
  return labels[billingPeriod.value] || '1 Month'
})

const discountPercentage = computed(() => {
  const discounts = { '1': 0, '3': 5, '6': 10, '12': 15 }
  
  return discounts[billingPeriod.value] || 0
})

const totalPrice = computed(() => {
  if (selectedPlan.value === 'free') return 0

  const months = parseInt(billingPeriod.value, 10)

  // First month is free
  const paidMonths = Math.max(0, months - 1)

  let monthlyPrice = 0
  if (selectedPlan.value === 'developer') {
    monthlyPrice = 2.49
  } else if (selectedPlan.value === 'pro') {
    monthlyPrice = 3.99
  } else if (selectedPlan.value === 'custom' && customPlanPrice.value?.usd) {
    monthlyPrice = customPlanPrice.value.usd
  }

  const basePrice = monthlyPrice * paidMonths
  const discount = basePrice * (discountPercentage.value / 100)

  return basePrice - discount
})

// Monthly price for display
const monthlyPriceDisplay = computed(() => {
  if (selectedPlan.value === 'free') return 0
  if (selectedPlan.value === 'developer') return 2.49
  if (selectedPlan.value === 'pro') return 3.99
  if (selectedPlan.value === 'custom' && customPlanPrice.value?.usd) {
    return customPlanPrice.value.usd
  }
  
  return 0
})

const selectedPlanDisplayName = computed(() => {
  const planNames = {
    free: 'Free',
    developer: 'Standard',
    pro: 'Pro',
    custom: 'Custom',
  }
  
  return planNames[selectedPlan.value] || selectedPlan.value
})

const formattedTotalPrice = computed(() => {
  if (selectedPlan.value === 'free') return '$0'

  if (selectedPlan.value === 'custom') {
    if (!customPlanPrice.value?.usd) return 'Calculating...'
  }

  return `$${monthlyPriceDisplay.value.toFixed(2)}/month`
})

// Custom plan price calculation function
const calculateCustomPlanPrice = async () => {
  if (selectedPlan.value !== 'custom') return

  customPlanPriceLoading.value = true
  customPlanPriceError.value = null

  try {
    // Build geolocation code from selection
    const geoCode = buildGeoCode(selectedGeo.value)

    // Convert 1 month to blocks (post-fork: 88000 blocks = 1 month)
    const expire = 88000

    const payload = JSON.stringify({
      version: 8,
      name: 'orbitcustom',
      description: 'Orbit custom plan pricing calculation',
      owner: '176iuPFBqD4yg3Fd7oPVhB3d4NXWxvQyxx',
      compose: [{
        name: 'component',
        description: 'component',
        repotag: 'runonflux/jetpack2:latest',
        ports: [3000],
        domains: [''],
        environmentParameters: [''],
        commands: [''],
        containerPorts: [3000],
        containerData: '/tmp',
        cpu: customPlanResources.value.cpu.toString(),
        ram: customPlanResources.value.ram.toString(),
        hdd: customPlanResources.value.storage.toString(),
        tiered: false,
      }],
      instances: customPlanResources.value.instances,
      nodes: [],
      contacts: [''],
      geolocation: geoCode && geoCode !== 'a' ? [geoCode] : [''],
      expire: expire,
      enterprise: '',
      staticip: false,
    })

    const response = await Api().post(
      '/apps/calculatefiatandfluxprice',
      payload,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      },
    )

    if (response.data?.status === 'success' && response.data.data?.usd) {
      customPlanPrice.value = {
        usd: parseFloat(response.data.data.usd),
        flux: response.data.data.flux,
        fluxDiscount: response.data.data.fluxDiscount || 0,
      }
    } else {
      customPlanPriceError.value = 'Failed to calculate price'
      customPlanPrice.value = null
    }
  } catch (error) {
    console.error('Error calculating custom plan price:', error)
    customPlanPriceError.value = 'Error calculating price'
    customPlanPrice.value = null
  } finally {
    customPlanPriceLoading.value = false
  }
}

// Debounced price calculation for custom plan
let customPriceDebounceTimer = null
const debouncedCalculateCustomPrice = () => {
  if (customPriceDebounceTimer) clearTimeout(customPriceDebounceTimer)
  customPriceDebounceTimer = setTimeout(() => {
    calculateCustomPlanPrice()
  }, 500)
}

// Custom plan monthly price display
const customPlanMonthlyPrice = computed(() => {
  if (!customPlanPrice.value?.usd) return null
  
  return customPlanPrice.value.usd.toFixed(2)
})

// Available Orbit environment variables
const availableOrbitEnvVars = [
  {
    key: 'BUILD_COMMAND',
    description: 'Custom build command if auto-detection fails or you need a specific build script',
    example: 'npm run build:production',
    placeholder: 'npm run build',
    autoValue: 'Auto-detected from package.json scripts (build, build:prod) or framework conventions',
  },
  {
    key: 'RUN_COMMAND',
    description: 'Custom startup command to run your application',
    example: 'npm run start:prod',
    placeholder: 'npm start',
    autoValue: 'Auto-detected from package.json scripts (start, serve) or framework conventions',
  },
  {
    key: 'INSTALL_COMMAND',
    description: 'Custom dependency installation command',
    example: 'pnpm install --frozen-lockfile',
    placeholder: 'npm install',
    autoValue: 'Auto-detected: npm install, yarn install, or pnpm install based on lockfile',
  },
  {
    key: 'WEBHOOK_SECRET',
    description: 'Secret for GitHub webhook deployments (for instant deploys on push)',
    example: 'your-webhook-secret',
    placeholder: 'your-secret-here',
    autoValue: 'Disabled. Set to enable webhook-triggered deployments',
  },
  {
    key: 'NODE_VERSION',
    description: 'Specify Node.js runtime version (overrides auto-detection)',
    example: '20',
    placeholder: '20',
    autoValue: 'Auto-detected from .nvmrc, .node-version, or package.json engines field. Falls back to latest LTS',
  },
  {
    key: 'PYTHON_VERSION',
    description: 'Specify Python runtime version',
    example: '3.12',
    placeholder: '3.12',
    autoValue: 'Auto-detected from runtime.txt, .python-version, or Pipfile. Falls back to latest stable',
  },
  {
    key: 'RUBY_VERSION',
    description: 'Specify Ruby runtime version',
    example: '3.3',
    placeholder: '3.3',
    autoValue: 'Auto-detected from .ruby-version or Gemfile. Falls back to latest stable',
  },
  {
    key: 'GO_VERSION',
    description: 'Specify Go runtime version',
    example: '1.22',
    placeholder: '1.22',
    autoValue: 'Auto-detected from go.mod. Falls back to latest stable',
  },
  {
    key: 'JAVA_VERSION',
    description: 'Specify Java runtime version',
    example: '21',
    placeholder: '21',
    autoValue: 'Auto-detected from pom.xml or build.gradle. Falls back to latest LTS (21)',
  },
]

// Environment variable management
const addEnvVar = () => {
  customEnvVars.value.push({ key: '', value: '', isOrbitVar: false })
}

const removeEnvVar = index => {
  customEnvVars.value.splice(index, 1)
}

// Check if an Orbit env var is already added
const isEnvVarAdded = key => {
  return customEnvVars.value.some(env => env.key === key)
}

// Add an Orbit environment variable
const addOrbitEnvVar = orbitVar => {
  if (isEnvVarAdded(orbitVar.key)) {
    // If already added, scroll to it or highlight it
    return
  }
  customEnvVars.value.push({
    key: orbitVar.key,
    value: '',
    placeholder: orbitVar.placeholder || orbitVar.example || '',
    isOrbitVar: true,
  })
}

// Build Git URL with authentication
const buildGitUrl = () => {
  if (!repoToken.value) return repoUrl.value

  try {
    const url = new URL(repoUrl.value)
    const username = repoUsername.value || 'git'
    url.username = username
    url.password = repoToken.value
    
    return url.toString()
  } catch {
    return repoUrl.value
  }
}

// Build environment parameters for Orbit
const buildEnvironmentParameters = () => {
  const envParams = [
    `GIT_REPO_URL=${buildGitUrl()}`,
    `APP_PORT=${appPort.value}`,
  ]

  // Add branch if not main
  if (branch.value && branch.value !== 'main') {
    envParams.push(`GIT_BRANCH=${branch.value}`)
  }

  // Add project path for monorepos
  if (projectPath.value && projectPath.value !== '/') {
    envParams.push(`PROJECT_PATH=${projectPath.value}`)
  }

  // Add runtime version if specified
  if (selectedRuntime.value && runtimeVersion.value) {
    const envVarName = runtimeEnvVarMap[selectedRuntime.value]
    if (envVarName) {
      envParams.push(`${envVarName}=${runtimeVersion.value}`)
    }
  }

  // Add polling interval if not disabled
  if (pollingInterval.value && pollingInterval.value !== 'disabled') {
    envParams.push(`POLLING_INTERVAL=${pollingInterval.value}`)
  }

  // Add custom environment variables
  customEnvVars.value.forEach(env => {
    if (env.key && env.value) {
      envParams.push(`${env.key}=${env.value}`)
    }
  })

  return envParams
}

// Generate app specification
const generatedAppSpec = computed(() => {
  const containerPort = parseInt(appPort.value, 10) || 3000
  const exposePort = typeof exposedPort.value === 'number' ? exposedPort.value : parseInt(exposedPort.value, 10)
  const mgmtPort = typeof orbitManagementPort.value === 'number' ? orbitManagementPort.value : parseInt(orbitManagementPort.value, 10)

  // Enterprise encryption happens during registration, not here
  // Leave enterprise empty - it will be encrypted in startRegistration if needed

  // Build domains array - first for app port, second for management port (always empty)
  const domains = [customDomain.value || '', '']

  // Build geolocation array - using multi-select allowed/forbidden locations
  const geolocationCodes = getGeolocationCodes()

  return {
    version: 8,
    name: appName.value || 'orbit-app',
    description: appDescription.value || `Orbit deployment from ${detectedProvider.value || 'Git'}`,
    owner: zelid.value || '',
    contacts: [contactEmail.value],
    instances: planResources.value.instances,
    staticip: false,
    enterprise: '', // Encryption happens in startRegistration for enterprise apps
    nodes: [],
    geolocation: geolocationCodes,
    expire: billingPeriod.value === '1' ? 88000 : parseInt(billingPeriod.value, 10) * 88000,
    compose: [
      {
        name: 'cloudgit',
        description: 'cloudgit',
        repotag: 'runonflux/orbit:latest',
        ports: [exposePort, mgmtPort], // Random external ports for app and management
        containerPorts: [containerPort, 9001], // Internal app port and Orbit management port
        domains,
        environmentParameters: buildEnvironmentParameters(),
        commands: [],
        containerData: '/app',
        cpu: Number(planResources.value.cpu),
        ram: Number(planResources.value.ram) * 1000, // Convert GB to MB
        hdd: Number(planResources.value.storage),
        tiered: false,
        repoauth: '',
      },
    ],
  }
})

// Validation rules
const rules = {
  required: v => !!v || 'This field is required',
  validRepoUrl: v => {
    if (!v) return true
    const pattern = /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/.+\/.+/
    
    return pattern.test(v) || 'Please enter a valid GitHub, GitLab, or Bitbucket URL'
  },
  appName: v => {
    if (!v) return true
    const pattern = /^[a-z][a-z0-9-]*[a-z0-9]$/
    if (v.length < 3 || v.length > 32) return 'App name must be 3-32 characters'
    if (!pattern.test(v)) return 'Lowercase letters, numbers, and hyphens only. Must start with letter.'
    
    return true
  },
  port: v => {
    const port = parseInt(v, 10)
    
    return (port >= 1 && port <= 65535) || 'Port must be between 1 and 65535'
  },
  email: v => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    return pattern.test(v) || 'Please enter a valid email address'
  },
}

// Select plan and continue to next step
const selectPlanAndContinue = (plan) => {
  selectedPlan.value = plan
  currentStep.value++
}

// Step navigation
const nextStep = async () => {
  // Step 1: Plan Selection - no validation needed
  if (currentStep.value === 2) {
    // Step 2: Repository - validate repo form
    const { valid } = await repoForm.value.validate()
    if (!valid) return

    // For private repos, require successful auth test before continuing
    if (repoCheckStatus.value === 'private') {
      if (!repoToken.value) {
        // Token is required for private repos
        return
      }
      if (authTestStatus.value !== 'success') {
        // Must test connection successfully before continuing
        return
      }
    }

    // Start background check for duplicate git repo when moving from step 2 to step 3
    checkDuplicateGitRepo()
  } else if (currentStep.value === 3) {
    // Step 3: Configuration - validate config form
    const { valid } = await configForm.value.validate()
    if (!valid) return
  }
  currentStep.value++
}

// Proceed to registration
const proceedToPayment = async () => {
  if (!acceptedTerms.value) {
    return
  }

  deploying.value = true

  try {
    // Go to Step 5 - Register
    currentStep.value = 5

    // Start registration process
    await startRegistration()
  } catch (error) {
    console.error('Failed to prepare deployment:', error)
    registrationError.value = error.message || 'Failed to start registration'
  } finally {
    deploying.value = false
  }
}

// Detect login type from localStorage (same as SubscriptionManager)
const detectLoginType = () => {
  // Read loginType directly from localStorage - this is set during login
  const storedLoginType = localStorage.getItem('loginType')
  if (storedLoginType) {
    return storedLoginType
  }

  // Fallback: check if logged in at all
  const zelidauth = localStorage.getItem('zelidauth')
  if (!zelidauth) return 'manual'

  // Default to zelcore if no loginType is stored
  return 'zelcore'
}

// Get callback URL for WebSocket signing
const getCallbackUrl = () => {
  const backendURL = localStorage.getItem('backendURL') || getDetectedBackendURL()
  const url = `${backendURL}/id/providesign`

  return encodeURI(url)
}

// WebSocket message handler
const onWSMessage = evt => {
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

const onWSError = evt => {
  console.error('WebSocket error:', evt)
  registrationError.value = 'WebSocket connection error. Please try again.'
  isSigning.value = false
}

// Cancel signing process
const cancelSigning = () => {
  isSigning.value = false

  // Close WebSocket if open
  if (websocket.value) {
    websocket.value.close()
    websocket.value = null
  }

  // Reset registration state
  registrationError.value = ''
  registrationMessage.value = ''
  deploying.value = false
  currentStep.value = 4 // Go back to Review step

  showToast('info', 'Signing cancelled')
}

// Upload contacts to Flux Storage
const uploadContactsToStorage = async contacts => {
  // Check if contacts are already storage references
  const hasStorageReference = contacts.some(c => c.startsWith('F_S_CONTACTS='))
  if (hasStorageReference) {
    return contacts
  }

  // Filter valid contacts
  const validContacts = contacts.filter(c => c && c.trim())
  if (validContacts.length === 0) {
    throw new Error('At least one contact email is required')
  }

  const contactsId = StorageService.generateContactsId()
  const contactsData = {
    contactsid: contactsId,
    contacts: validContacts,
  }

  await StorageService.uploadContacts(contactsData)
  const storageReference = StorageService.getContactsStorageReference(contactsId)

  return [storageReference]
}

// Start registration process
const startRegistration = async () => {
  registrationMessage.value = 'Uploading contacts to storage...'
  registrationError.value = ''
  isSigning.value = true

  try {
    // First, upload contacts to storage and get the reference
    const originalSpec = generatedAppSpec.value
    const uploadedContacts = await uploadContactsToStorage(originalSpec.contacts || [contactEmail.value])

    // Create a new spec with the storage reference for contacts
    let specWithContacts = {
      ...originalSpec,
      contacts: uploadedContacts,
    }

    // Handle enterprise encryption for private repos (v8+)
    if (isEnterpriseApp.value && specWithContacts.version >= 8) {
      registrationMessage.value = 'Encrypting enterprise data...'

      // Check WebCrypto availability
      if (!isWebCryptoAvailable()) {
        throw new Error('Enterprise features require HTTPS or localhost. Please access this application using a secure connection.')
      }

      const zelidauth = localStorage.getItem('zelidauth')

      // Get RSA public key for encryption
      const appPubKeyData = {
        name: specWithContacts.name,
        owner: specWithContacts.owner,
      }

      const responseGetPublicKey = await AppsService.getAppPublicKey(zelidauth, appPubKeyData)

      if (responseGetPublicKey.data.status === 'error') {
        const errorData = responseGetPublicKey.data.data
        let errorMsg = 'Failed to get app public key'
        if (errorData) {
          errorMsg = typeof errorData === 'string' ? errorData : (errorData.message || JSON.stringify(errorData))
        }
        throw new Error(errorMsg)
      }

      const pubkey = responseGetPublicKey.data.data

      // Generate AES key
      const aesKey = window.crypto.getRandomValues(new Uint8Array(32))

      // Import RSA public key and encrypt AES key
      const rsaPubKey = await importRsaPublicKey(pubkey)
      const encryptedAesKey = await encryptAesKeyWithRsaKey(aesKey, rsaPubKey)

      // Create enterprise specs (contacts + compose to be encrypted)
      const enterpriseSpecs = {
        contacts: specWithContacts.contacts,
        compose: specWithContacts.compose,
      }

      // Encrypt enterprise data
      const encryptedEnterprise = await encryptEnterpriseWithAes(
        JSON.stringify(enterpriseSpecs),
        aesKey,
        encryptedAesKey,
      )

      // Update spec with encrypted enterprise data
      specWithContacts = {
        ...specWithContacts,
        enterprise: encryptedEnterprise,
        contacts: [],
        compose: [],
      }
    }

    // Verify app specification with FluxOS backend to get the correct format
    // This is crucial - the backend may normalize the spec and we need to sign the normalized version
    registrationMessage.value = 'Verifying application specification...'
    const verifiedAppSpec = await AppsService.appRegistrationVerificaiton(specWithContacts)

    if (verifiedAppSpec.data.status === 'error') {
      const errorMessage = verifiedAppSpec.data.data?.message || verifiedAppSpec.data.data || 'App specification verification failed'
      throw new Error(errorMessage)
    }

    // Use the verified spec (backend-normalized) for signing
    const spec = JSON.parse(JSON.stringify(verifiedAppSpec.data.data || specWithContacts))

    // Store the final spec for propagation
    finalAppSpec.value = spec

    registrationMessage.value = 'Preparing application specification...'

    // Build the data to sign (same format as SubscriptionManager)
    // Format: type + version + JSON.stringify(spec) + timestamp
    timestamp.value = Date.now()
    dataToSign.value = `fluxappregister1${JSON.stringify(spec)}${timestamp.value}`

    // Get zelid from zelidauth
    const zelidauth = localStorage.getItem('zelidauth')
    let currentZelid = zelid.value

    if (zelidauth && !currentZelid) {
      const authData = zelidauth.includes('zelid=')
        ? Object.fromEntries(new URLSearchParams(zelidauth))
        : JSON.parse(zelidauth)
      currentZelid = authData.zelid
    }

    // Detect login type
    loginType.value = detectLoginType()

    // Handle signing based on login type (same as SubscriptionManager)
    switch (loginType.value) {
    case 'sso':
      // SSO signing - automatic via backend API (no user interaction needed)
      registrationMessage.value = 'Signing message...'
      {
        const firebaseUser = getUser()
        if (!firebaseUser) {
          throw new Error('Not logged in as SSO')
        }
        const token = firebaseUser.auth.currentUser.accessToken
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
        const res = await axios.post('https://service.fluxcore.ai/api/signMessage', { message: dataToSign.value }, { headers })
        if (res.data?.status !== 'success' || !res.data?.signature) {
          throw new Error('SSO signing failed')
        }
        signature.value = res.data.signature
      }
      break

    case 'ssp':
      // SSP signing
      registrationMessage.value = 'Waiting for signature from wallet...'
      {
        const signResult = await signWithSSP(dataToSign.value)
        signature.value = signResult.signature
      }
      break

    case 'walletconnect':
      // WalletConnect signing
      registrationMessage.value = 'Waiting for signature from wallet...'
      {
        const account = await getConnectedAccount()
        if (!account) {
          throw new Error('WalletConnect not connected. Please log into FluxOS first.')
        }
        const result = await signWithWalletConnect(dataToSign.value)
        signature.value = result
      }
      break

    case 'metamask':
      // MetaMask signing
      registrationMessage.value = 'Waiting for signature from wallet...'
      {
        const ethereum = window.ethereum
        if (!ethereum) {
          throw new Error('MetaMask not found')
        }
        const account = ethereum.selectedAddress || (await ethereum.request({ method: 'eth_requestAccounts' }))[0]
        const msg = `0x${Buffer.from(dataToSign.value, 'utf8').toString('hex')}`
        const sign = await ethereum.request({
          method: 'personal_sign',
          params: [msg, account],
        })
        signature.value = sign
      }
      break

    case 'zelcore':
    case 'manual':
    default:
      // Zelcore signing - set up WebSocket first
      registrationMessage.value = 'Waiting for signature from wallet...'
      {
        let wsURL = localStorage.getItem('backendURL') || getDetectedBackendURL()
        wsURL = wsURL.replace('https://', 'wss://').replace('http://', 'ws://')

        const sigMsg = `${currentZelid}${timestamp.value}`
        const uri = `${wsURL}/ws/sign/${sigMsg}`

        websocket.value = new WebSocket(uri)

        websocket.value.onerror = onWSError
        websocket.value.onmessage = onWSMessage

        // Now trigger ZelCore signing (skip internal WebSocket since we handle it)
        await signWithZelcore(dataToSign.value, currentZelid, getCallbackUrl(), undefined, true)
      }
      break
    }
  } catch (error) {
    console.error('Registration error:', error)
    registrationError.value = error.message || 'Registration failed'
    isSigning.value = false
  }
}

// Watch for signature changes to propagate
watch(signature, async newSignature => {
  if (newSignature && isSigning.value && !registrationHash.value) {
    isSigning.value = false

    // Close WebSocket
    if (websocket.value) {
      websocket.value.close()
      websocket.value = null
    }

    // Propagate signed message
    await propagateSignedMessage()
  }
})

// Propagate signed message
const propagateSignedMessage = async () => {
  if (!signature.value) {
    registrationError.value = 'No signature found'
    
    return
  }

  isPropagating.value = true
  registrationMessage.value = 'Registering application on Flux network...'

  try {
    const zelidauth = localStorage.getItem('zelidauth')
    const spec = finalAppSpec.value || generatedAppSpec.value

    // Build the registration data (same format as SubscriptionManager)
    const data = {
      type: 'fluxappregister',
      version: 1,
      appSpecification: spec,
      timestamp: timestamp.value,
      signature: signature.value,
    }

    const response = await AppsService.registerApp(zelidauth, data)

    if (response.data.status === 'error') {
      throw new Error(response.data.data?.message || response.data.data || 'Registration failed')
    }

    // The response.data.data is the registration hash
    registrationHash.value = response.data.data

    // Get deployment address
    await getDeploymentInfo()

    isSigning.value = false
    isPropagating.value = false

    // Skip testing phase - go directly to success
    testFinished.value = true

    // Auto-advance to Payment step after a brief delay
    setTimeout(() => {
      currentStep.value = 6

      // Start monitoring for app registration on the network
      startPaymentMonitoring()
    }, 1500)
  } catch (error) {
    console.error('Propagation error:', error)
    registrationError.value = error.message || 'Failed to propagate registration'
    isPropagating.value = false
    isSigning.value = false
  }
}

// Get deployment information for payment
const getDeploymentInfo = async () => {
  try {
    const response = await AppsService.appsDeploymentInformation()

    if (response.data?.status === 'success') {
      deploymentAddress.value = response.data.data.address
    }
  } catch (error) {
    console.error('Failed to get deployment info:', error)
  }
}

// Go back to configure step to edit app name or other settings
const goBackToConfigureStep = () => {
  registrationHash.value = null
  registrationError.value = ''
  deploying.value = false
  currentStep.value = 3 // Configure step
}

// Payment monitoring - Two-phase detection:
// Phase 1 (blockchain): Check if payment/registration is confirmed on the blockchain via getAppSpecifics()
// Phase 2 (deployment): Check if app is running on nodes via getAppLocation()
const startPaymentMonitoring = async () => {
  // Clear any existing intervals
  if (paymentMonitoringInterval.value) {
    clearInterval(paymentMonitoringInterval.value)
  }
  if (paymentMonitoringTimeout.value) {
    clearTimeout(paymentMonitoringTimeout.value)
  }

  paymentProcessing.value = true
  paymentConfirmed.value = false
  paymentMonitoringPhase.value = 'blockchain' // Start with blockchain confirmation phase

  // Set a 30-minute timeout
  paymentMonitoringTimeout.value = setTimeout(() => {
    if (paymentMonitoringInterval.value) {
      clearInterval(paymentMonitoringInterval.value)
      paymentMonitoringInterval.value = null
    }
    if (!paymentConfirmed.value) {
      paymentProcessing.value = false
    }
  }, 30 * 60 * 1000)

  // Poll every 10 seconds - two-phase detection
  paymentMonitoringInterval.value = setInterval(async () => {
    try {
      if (paymentMonitoringPhase.value === 'blockchain') {
        // Phase 1: Check if app spec exists on blockchain (payment confirmed)
        const response = await AppsService.getAppSpecifics(appName.value)

        if (response.data.status === 'success' && response.data.data) {
          const currentAppSpec = response.data.data

          // If app spec exists and hash matches, payment is confirmed on blockchain
          if (currentAppSpec?.hash && registrationHash.value && currentAppSpec.hash === registrationHash.value) {
            // Move to deployment phase
            paymentMonitoringPhase.value = 'deployment'
          }
        }
      } else if (paymentMonitoringPhase.value === 'deployment') {
        // Phase 2: Check if app is running on nodes
        const response = await AppsService.getAppLocation(appName.value)

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

            // Show "My applications" menu item immediately
            fluxStore.setUserHasApps()
          }
        }
      }
    } catch {
      // Silently ignore - app not yet registered or deployed
    }
  }, 10000)
}

// Cancel payment monitoring
const cancelPaymentMonitoring = () => {
  if (paymentMonitoringInterval.value) {
    clearInterval(paymentMonitoringInterval.value)
    paymentMonitoringInterval.value = null
  }
  if (paymentMonitoringTimeout.value) {
    clearTimeout(paymentMonitoringTimeout.value)
    paymentMonitoringTimeout.value = null
  }

  paymentProcessing.value = false
  paymentConfirmed.value = false
  paymentMonitoringPhase.value = 'blockchain'
  paymentMethod.value = ''
}

// Initialize Stripe payment
const initStripePay = async () => {
  checkoutLoading.value = true
  paymentMethod.value = 'stripe'

  try {
    const zelidauth = localStorage.getItem('zelidauth')

    // Open a popup window first (to avoid popup blocker)
    const popup = window.open('about:blank', '_blank', 'width=600,height=700')

    if (!popup) {
      throw new Error('Please allow popups for this site to complete payment')
    }

    // Get Stripe checkout URL
    const response = await AppsService.initiateStripePayment(registrationHash.value, zelidauth)

    if (response.data.status === 'error') {
      popup.close()
      throw new Error(response.data.data?.message || 'Failed to create Stripe checkout')
    }

    // Navigate popup to Stripe checkout URL
    popup.location.href = response.data.data
    popup.focus()

    // Mark fiat payment as initiated to show monitoring spinner
    fiatPaymentInitiated.value = true

    // Start monitoring
    startPaymentMonitoring()
  } catch (error) {
    console.error('Stripe payment error:', error)
  } finally {
    checkoutLoading.value = false
  }
}

// Initialize PayPal payment
const initPaypalPay = async () => {
  checkoutLoading.value = true
  paymentMethod.value = 'paypal'

  try {
    const zelidauth = localStorage.getItem('zelidauth')

    // Open a popup window first
    const popup = window.open('about:blank', '_blank', 'width=600,height=700')

    if (!popup) {
      throw new Error('Please allow popups for this site to complete payment')
    }

    // Get PayPal checkout URL
    const response = await AppsService.initiatePaypalPayment(registrationHash.value, zelidauth)

    if (response.data.status === 'error') {
      popup.close()
      throw new Error(response.data.data?.message || 'Failed to create PayPal checkout')
    }

    // Navigate popup to PayPal checkout URL
    popup.location.href = response.data.data
    popup.focus()

    // Mark fiat payment as initiated to show monitoring spinner
    fiatPaymentInitiated.value = true

    // Start monitoring
    startPaymentMonitoring()
  } catch (error) {
    console.error('PayPal payment error:', error)
  } finally {
    checkoutLoading.value = false
  }
}

// Initialize Zelcore payment
const initZelcorePay = async () => {
  try {
    // Validate price is available and greater than 0
    const amount = calculatedAppPrice.value?.flux
    if (!amount || amount <= 0) {
      console.error('Invalid payment amount. Please wait for price calculation.')
      
      return
    }

    // Validate required fields
    if (!deploymentAddress.value) {
      console.error('Deployment address not available')
      
      return
    }

    if (!registrationHash.value) {
      console.error('Registration hash not available')
      
      return
    }

    // Track payment attempt
    paymentMethod.value = 'zelcore'
    checkoutLoading.value = true

    await payWithZelcore({
      address: deploymentAddress.value,
      amount: amount,
      message: registrationHash.value,
      coin: 'zelcash',
    })

    // Mark payment as initiated to show monitoring spinner
    fiatPaymentInitiated.value = true

    // Start payment monitoring for crypto payment
    startPaymentMonitoring()
  } catch (error) {
    console.error('Zelcore payment error:', error)
  } finally {
    checkoutLoading.value = false
  }
}

// Initialize SSP payment
const initSSPPay = async () => {
  try {
    // Validate price is available and greater than 0
    const amount = calculatedAppPrice.value?.flux
    if (!amount || amount <= 0) {
      console.error('Invalid payment amount. Please wait for price calculation.')
      
      return
    }

    // Validate required fields
    if (!deploymentAddress.value) {
      console.error('Deployment address not available')
      
      return
    }

    if (!registrationHash.value) {
      console.error('Registration hash not available')
      
      return
    }

    // Track payment attempt
    paymentMethod.value = 'ssp'
    checkoutLoading.value = true

    const data = {
      message: registrationHash.value,
      amount: amount.toString(),
      address: deploymentAddress.value,
      chain: 'flux',
    }

    // Wait for user to confirm payment in SSP wallet
    const response = await payWithSSP(data)

    if (response && response.txid) {
      // Mark payment as initiated to show monitoring spinner
      fiatPaymentInitiated.value = true

      // Start payment monitoring
      startPaymentMonitoring()
    }
  } catch (error) {
    console.error('SSP payment error:', error)
  } finally {
    checkoutLoading.value = false
  }
}

// Copy text to clipboard
const copyToClipboard = async text => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

// Reset form for new deployment
const resetForm = () => {
  // Reset step
  currentStep.value = 1

  // Reset repository
  repoUrl.value = ''
  branch.value = 'main'
  projectPath.value = '/'
  repoUsername.value = ''
  repoToken.value = ''
  repoCheckStatus.value = 'idle'
  branches.value = []

  // Reset configuration
  appName.value = ''
  appDescription.value = ''
  appPort.value = '3000'
  contactEmail.value = ''
  selectedRuntime.value = null
  runtimeVersion.value = ''
  customEnvVars.value = []

  // Reset plan
  selectedPlan.value = 'free'
  billingPeriod.value = '1'
  customDomain.value = ''

  // Reset custom plan resources (defaults match Pro plan)
  customPlanResources.value = {
    cpu: 2,
    ram: 6000,
    storage: 20,
    instances: 2,
  }
  customPlanPrice.value = null
  customPlanPriceLoading.value = false
  customPlanPriceError.value = null

  // Reset terms
  acceptedTerms.value = false

  // Reset registration/payment
  registrationHash.value = null
  registrationError.value = ''
  finalAppSpec.value = null
  signature.value = ''
  testFinished.value = false
  paymentConfirmed.value = false
  paymentProcessing.value = false
  paymentMonitoringPhase.value = 'blockchain'
}

// Cleanup on unmount
onUnmounted(() => {
  if (paymentMonitoringInterval.value) {
    clearInterval(paymentMonitoringInterval.value)
  }
  if (paymentMonitoringTimeout.value) {
    clearTimeout(paymentMonitoringTimeout.value)
  }
  if (websocket.value) {
    websocket.value.close()
    websocket.value = null
  }
})


// Watch for custom plan resource changes to recalculate price
watch(customPlanResources, () => {
  if (selectedPlan.value === 'custom') {
    debouncedCalculateCustomPrice()
  }
}, { deep: true })

// Watch for geolocation changes to recalculate custom plan price
watch(selectedGeo, () => {
  if (selectedPlan.value === 'custom') {
    debouncedCalculateCustomPrice()
  }
}, { deep: true })

// Initialize contact email from user if available
onMounted(() => {
  // Fetch geolocation data
  fetchGeolocationData()

  // Try to get email from user session if available
  const zelidauth = localStorage.getItem('zelidauth')
  if (zelidauth) {
    try {
      const params = new URLSearchParams(zelidauth)
      const userZelid = params.get('zelid')
      if (userZelid) {
        fluxStore.setZelid(userZelid)
      }
    } catch (error) {
      console.warn('Failed to parse zelidauth:', error)
    }
  }

  // Auto-fill contact email for SSO users
  const loginType = localStorage.getItem('loginType')
  if (loginType === 'sso') {
    const firebaseUser = getUser()
    if (firebaseUser?.email) {
      contactEmail.value = firebaseUser.email
    }
  }
})
</script>

<style scoped>
.orbit-registration {
  max-width: 1400px;
  margin: 0 auto;
}

/* Auth icon animation */
.auth-icon-container {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Orbit setup */
.orbit-setup {
  padding: 0;
}

.orbit-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  position: relative;
  padding-top: 0.5rem;
}

.orbit-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.orbit-header-content .v-icon {
  margin-right: 0 !important;
  margin-bottom: 0.5rem;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0.5rem;
}

.orbit-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: rgb(var(--v-theme-primary));
  line-height: 1.2;
}

.orbit-subtitle {
  font-size: 0.875rem;
  opacity: 0.7;
  margin: 0;
}

/* Stepper */
.orbit-stepper {
  background: transparent !important;
  box-shadow: none !important;
  max-width: 1400px !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

.orbit-stepper :deep(.v-stepper-header) {
  box-shadow: none;
}

.orbit-stepper :deep(.v-stepper-item) {
  padding: 0.5rem;
}

.orbit-stepper :deep(.v-stepper-item__title) {
  white-space: nowrap;
}

.orbit-stepper :deep(.v-stepper-window),
.orbit-stepper :deep(.v-stepper-actions) {
  max-width: 1400px !important;
  margin-left: auto !important;
  margin-right: auto !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.step-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  padding-bottom: 0.5rem;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  text-align: center;
}

.step-description {
  text-align: center;
  opacity: 0.8;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

/* Ensure proper spacing for form fields with persistent hints */
.step-content :deep(.v-input--has-messages) {
  margin-bottom: 0.5rem;
}

.provider-badge {
  display: flex;
  justify-content: flex-start;
}

/* Repository status badges */
.repo-status-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

/* Private repo auth section */
.private-repo-auth {
  background: rgba(var(--v-theme-warning), 0.04);
  border: 1px solid rgba(var(--v-theme-warning), 0.2);
  border-radius: 12px;
  padding: 1rem;
}

/* Enterprise info card */
.enterprise-info-card {
  background: rgba(var(--v-theme-warning), 0.03);
  border-color: rgba(var(--v-theme-warning), 0.15) !important;
}

.enterprise-features-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.enterprise-features-list li {
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
}

/* Test connection section */
.test-connection-section {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding-top: 1rem;
}

.auth-test-result {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Monorepo section */
.monorepo-section {
  min-height: 60px;
}

.monorepo-loading {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(var(--v-theme-info), 0.04);
  border-radius: 8px;
}

.monorepo-projects {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.monorepo-project-card {
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.monorepo-project-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.02);
}

.monorepo-project-card.selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

.project-header {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.project-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-weight: 600;
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.project-path {
  font-family: monospace;
  font-size: 0.75rem;
}

.project-description {
  margin-top: 0.25rem;
  padding-left: 2rem;
  font-size: 0.8125rem;
  line-height: 1.4;
}

/* Environment variables */
.env-var-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.env-key {
  flex: 1;
}

.env-value {
  flex: 2;
}

/* Orbit environment variables list */
.orbit-env-vars {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 8px;
  padding: 1rem;
}

.orbit-env-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.orbit-env-item {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.orbit-env-item:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-primary), 0.02);
}

.orbit-env-item.added {
  border-color: rgba(var(--v-theme-success), 0.3);
  background: rgba(var(--v-theme-success), 0.04);
  cursor: default;
}

.orbit-env-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.orbit-env-key {
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.15);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.orbit-env-description {
  line-height: 1.4;
  margin-top: 0.25rem;
}

.orbit-env-auto {
  margin-top: 0.375rem;
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  background: rgba(var(--v-theme-success), 0.06);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  line-height: 1.4;
}

.orbit-env-auto .v-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.orbit-env-example {
  margin-top: 0.25rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.orbit-env-example code {
  font-size: 0.75rem;
  background: rgba(var(--v-theme-on-surface), 0.12);
  color: rgba(var(--v-theme-on-surface), 0.87);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
}

/* Shared Features Card */
.shared-features-card {
  background: rgba(var(--v-theme-primary), 0.05);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
}

.shared-features-header {
  text-align: center;
  margin-bottom: 20px;
}

.shared-features-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.shared-features-title .orbit-icon {
  font-size: 32px;
  color: rgb(var(--v-theme-primary));
}

.shared-features-title h4 {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.shared-features-subtitle {
  font-size: 1rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0;
  font-style: italic;
}

.shared-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.shared-feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.shared-feature-item:hover {
  background: rgba(var(--v-theme-surface), 1);
  transform: translateY(-2px);
}

.shared-feature-item .v-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: rgb(var(--v-theme-on-surface));
}

.feature-detail {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  line-height: 1.3;
}

/* Orbit Comparison Card */
.orbit-comparison-card {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.comparison-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.comparison-subtitle {
  text-align: center;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0 0 16px 0;
}

.orbit-comparison-table-wrapper {
  overflow-x: auto;
  margin: 0 0 12px 0;
}

.orbit-comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.orbit-comparison-table th,
.orbit-comparison-table td {
  padding: 0.75rem 0.875rem;
  text-align: left;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.orbit-comparison-table th {
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.orbit-comparison-table tbody tr:hover {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.orbit-comparison-table .highlight-row {
  background: rgba(var(--v-theme-primary), 0.08) !important;
}

.orbit-comparison-table .highlight-row td {
  font-weight: 600;
}

.provider-cell-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.provider-name {
  font-weight: 600;
}

.highlight-price {
  color: rgb(var(--v-theme-success));
  font-weight: 700;
  font-size: 0.95rem;
}

.competitor-price {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.orbit-comparison-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 8px;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.plans-section-title {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.8);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Plans Grid - WordPress style */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

.plan-card {
  position: relative;
  background: rgba(var(--v-theme-surface), 1);
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  cursor: pointer;
}

.plan-btn-wrapper {
  margin-top: auto;
  flex: 0 0 auto;
}

.plan-card.recommended:not(.selected) {
  border-color: rgba(var(--v-theme-success), 0.3);
  box-shadow: 0 4px 16px rgba(var(--v-theme-success), 0.15);
}

.plan-card.selected {
  border-color: rgb(var(--v-theme-success));
  box-shadow: 0 8px 32px rgba(var(--v-theme-success), 0.4);
  background: rgba(var(--v-theme-success), 0.02);
}

.plan-card:not(.disabled-plan):hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(var(--v-theme-success), 0.4);
  border-color: rgba(var(--v-theme-success), 0.5);
}

.plan-card.disabled-plan {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* Custom Plan Styles */
.custom-plan {
  background: rgba(var(--v-theme-info), 0.03);
}

.custom-plan:hover,
.plan-card.custom-plan.selected {
  border-color: rgb(var(--v-theme-info));
  background: rgba(var(--v-theme-info), 0.08);
  box-shadow: 0 8px 32px rgba(var(--v-theme-info), 0.25);
}

.custom-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgb(var(--v-theme-info));
  color: white;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-info), 0.3);
}

.custom-price-badge {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.price-starting {
  font-size: 1.5rem !important;
}

/* Advanced Options */
.advanced-options-toggle {
  padding: 0.75rem 1rem;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.advanced-options-section {
  padding-top: 0.5rem;
}

/* Custom Resources Section in Configure Step */
.custom-resources-section {
  margin-bottom: 1rem;
}

.custom-resources-card {
  border-color: rgba(var(--v-theme-info), 0.3);
  background: rgba(var(--v-theme-info), 0.03);
}

.custom-resources-card .v-card-title {
  font-size: 1rem;
  padding-bottom: 0;
}

.custom-resources-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.resource-config-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-config-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resource-config-label {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
}

.resource-config-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.resource-slider {
  margin-top: -4px;
}

.custom-geolocation-section {
  padding-top: 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.custom-price-display {
  margin-top: 16px;
  padding: 16px;
  background: rgba(var(--v-theme-success), 0.08);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-success), 0.2);
  text-align: center;
}

.price-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.price-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-after-free {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: rgb(var(--v-theme-success));
  font-weight: 500;
}

.price-amount-large {
  font-size: 1.75rem;
  font-weight: 700;
  color: rgb(var(--v-theme-success));
}

.price-period-small {
  font-size: 0.875rem;
  font-weight: 400;
  opacity: 0.7;
}

.price-flux {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.price-error {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-error));
}

.recommended-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgb(var(--v-theme-success));
  color: white;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-success), 0.3);
}

.coming-soon-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(var(--v-theme-on-surface), 0.5);
  color: white;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.plan-price-badge {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  background: rgba(var(--v-theme-success), 0.1);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-success), 0.2);
}

.plan-price-badge.disabled {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.price-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-success));
  line-height: 1;
}

.plan-price-badge.disabled .price-amount {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.price-period {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.7;
}

.price-asterisk {
  font-size: 1.2rem;
  color: rgb(var(--v-theme-warning));
  vertical-align: super;
  margin-left: 2px;
}

.first-month-free-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 12px;
  background: rgba(var(--v-theme-success), 0.1);
  border: 1px solid rgba(var(--v-theme-success), 0.2);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--v-theme-success));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 8px auto 0;
  width: fit-content;
}

.plan-disclaimer {
  margin-top: 2rem;
  padding: 1rem 1.5rem;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.disclaimer-text {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0;
  line-height: 1.6;
}

.disclaimer-text.disclaimer-note {
  margin-top: 0.75rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.disclaimer-asterisk {
  color: rgb(var(--v-theme-warning));
  font-weight: 600;
  font-size: 1rem;
}

.disclaimer-icon {
  color: rgb(var(--v-theme-info));
  flex-shrink: 0;
  margin-top: 2px;
}

.plan-header {
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.plan-description {
  font-size: 0.95rem;
  opacity: 0.7;
  margin: 0;
  min-height: 2.5em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plan-resources {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
}

.resource-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.resource-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  transform: translateX(4px);
}

.resource-icon {
  font-size: 22px;
}

.deployments-icon,
.builds-icon {
  color: rgb(var(--v-theme-success));
}

.cpu-icon {
  color: #f97316;
}

.ram-icon {
  color: #06b6d4;
}

.ssd-icon {
  color: #eab308;
}

.instances-icon {
  color: #8b5cf6;
}

.frameworks-icon {
  color: #a855f7;
}

.branch-icon {
  color: #10b981;
}

.cicd-icon {
  color: #3b82f6;
}

.domain-icon {
  color: #ec4899;
}

.geo-icon {
  color: #14b8a6;
}

.resource-label {
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.resource-value {
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: right;
}

.plan-btn-wrapper :deep(.v-btn) {
  height: 52px !important;
  min-height: 52px !important;
  max-height: 52px !important;
  font-size: 0.9375rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
}

@media (max-width: 960px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }

  .shared-features-card {
    padding: 20px;
  }

  .shared-features-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .shared-features-title h4 {
    font-size: 1.25rem;
  }

  .shared-features-subtitle {
    font-size: 0.875rem;
  }

  .shared-feature-item {
    padding: 10px;
    gap: 10px;
  }

  .feature-name {
    font-size: 0.875rem;
  }

  .feature-detail {
    font-size: 0.75rem;
  }

  .orbit-comparison-card {
    padding: 16px;
  }

  .comparison-title {
    font-size: 1rem;
  }

  .orbit-comparison-table {
    font-size: 0.8rem;
  }

  .orbit-comparison-table th,
  .orbit-comparison-table td {
    padding: 0.5rem 0.625rem;
  }

  .plan-card {
    padding: 20px;
    gap: 14px;
  }

  .plan-name {
    font-size: 1.25rem;
  }

  .plan-description {
    font-size: 0.875rem;
  }

  .price-amount {
    font-size: 2rem;
  }

  .resource-row {
    grid-template-columns: 28px 1fr auto;
    gap: 10px;
    padding: 8px 10px;
  }

  .resource-icon {
    font-size: 20px;
  }

  .resource-label {
    font-size: 0.8rem;
  }

  .resource-value {
    font-size: 0.875rem;
  }
}

.billing-period {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-left: 3rem;
}

.billing-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.billing-toggle {
  flex-wrap: wrap;
}

.billing-toggle :deep(.v-btn) {
  flex: 1 1 auto;
  min-width: fit-content;
}

.billing-total {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-primary));
}

/* Pro feature sections */
.pro-feature-section {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding-top: 1rem;
}

.pro-feature-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

/* Disabled spec items */
.spec-item.disabled {
  opacity: 0.6;
}

/* Review summary */
.review-summary {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-section {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.review-section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgb(var(--v-theme-primary));
}

.review-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  gap: 1rem;
}

.review-item:last-child {
  border-bottom: none;
}

.review-item-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.review-item-row .review-item {
  border-bottom: none;
  padding: 0;
  width: 100%;
}

.review-item.highlight-price {
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-bottom: none;
}

.review-label {
  font-weight: 500;
  opacity: 0.7;
  flex-shrink: 0;
}

.review-value {
  text-align: right;
  word-break: break-word;
}

.review-value code {
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
}

.review-value.price {
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  font-size: 1.25rem;
}

.spec-preview {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.75rem;
  overflow-x: auto;
  font-family: 'Fira Code', 'Consolas', monospace;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
}

.terms-section {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-top: 1.5rem;
}

/* Stepper actions */
.stepper-actions-wrapper {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.stepper-actions {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

/* Payment Step Styles */
.payment-step {
  max-width: 700px;
}

.registration-phase,
.testing-phase,
.payment-phase,
.test-error-phase,
.deployment-success {
  text-align: center;
  padding: 0.5rem 0;
}

.registration-progress,
.test-progress,
.payment-monitoring {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
}

/* Override LoadingSpinner styles for inline use */
.registration-progress :deep(.loading-container),
.test-progress :deep(.loading-container),
.payment-monitoring :deep(.loading-container) {
  min-height: auto;
  margin-top: 0;
  padding: 1rem;
}

.registration-progress :deep(.modern-loader),
.test-progress :deep(.modern-loader),
.payment-monitoring :deep(.modern-loader) {
  width: 100px;
  height: 100px;
  margin-bottom: 0.5rem;
}

.registration-progress :deep(.loader-ring),
.test-progress :deep(.loader-ring),
.payment-monitoring :deep(.loader-ring) {
  width: 80px;
  height: 80px;
}

.registration-progress :deep(.icon-avatar),
.test-progress :deep(.icon-avatar),
.payment-monitoring :deep(.icon-avatar) {
  width: 50px !important;
  height: 50px !important;
}

.registration-progress :deep(.icon-avatar .v-icon),
.test-progress :deep(.icon-avatar .v-icon),
.payment-monitoring :deep(.icon-avatar .v-icon) {
  font-size: 32px !important;
}

.registration-progress :deep(.loading-container h2),
.test-progress :deep(.loading-container h2),
.payment-monitoring :deep(.loading-container h2) {
  font-size: 1.25rem !important;
  margin-bottom: 0.25rem !important;
}

.registration-progress :deep(.loading-container p),
.test-progress :deep(.loading-container p),
.payment-monitoring :deep(.loading-container p) {
  font-size: 0.875rem !important;
  margin-top: 0 !important;
}

.payment-monitoring-card {
  border-radius: 16px !important;
  overflow: hidden;
  border: 2px solid rgba(var(--v-theme-primary), 0.3) !important;
}

/* Fiat payment styles */
.fiat-payment-card {
  border-radius: 16px !important;
  overflow: hidden;
  border: 2px solid rgba(var(--v-theme-primary), 0.3) !important;
}

.fiat-payment-card .payment-header {
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.85) 100%);
}

.payment-icons-grid {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.payment-icon-card {
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.payment-icon-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.payment-brand-icon-small {
  height: 32px;
  width: auto;
}

.payment-field-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.payment-field-label {
  display: flex;
  align-items: center;
}

.payment-field-value {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.bg-gradient-primary {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.85) 100%);
}

.bg-gradient-warning {
  background: linear-gradient(135deg, rgb(var(--v-theme-warning)) 0%, rgba(var(--v-theme-warning), 0.85) 100%);
}

.payment-method-card {
  border-radius: 16px !important;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), 0.1) !important;
}

.payment-method-card .payment-header {
  padding: 1.25rem 1.5rem;
}

.wallet-brand-icon {
  height: 28px;
  width: auto;
}

.payment-detail-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.payment-options-container {
  padding: 0 1rem;
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
  font-size: 1.25rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.95);
  line-height: 1.4;
}

/* Payment Icons Row - Horizontal Layout */
.payment-icons-row {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.payment-icon-card-horizontal {
  flex: 1;
  max-width: 200px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-icon-card-horizontal:hover {
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-2px);
}

/* Payment Advantages */
.payment-advantages {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 12px;
}

.payment-advantage-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.payment-advantage-row span {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

/* Crypto Payment Details */
.crypto-payment-details {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
}

.crypto-detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.crypto-detail-label {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
}

.crypto-detail-value {
  flex: 1;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crypto-copy-btn {
  opacity: 0.6;
  flex-shrink: 0;
}

.crypto-copy-btn:hover {
  opacity: 1;
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
  padding: 1rem 1.5rem;
  border-radius: 8px;
  background: rgba(var(--v-theme-warning), 0.1);
  max-width: 400px;
  margin-top: 0.5rem;
}

.deployment-message-box span {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.9);
  text-align: left;
}

.test-output-card {
  max-height: 400px;
  overflow: hidden;
}

.test-logs {
  max-height: 300px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.875rem;
  padding: 1rem;
  border-radius: 0 0 4px 4px;
}

.log-line {
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.log-line.info {
  color: #64b5f6;
}

.log-line.success {
  color: #81c784;
}

.log-line.error {
  color: #e57373;
}

.log-line.warning {
  color: #ffb74d;
}

.payment-options {
  max-width: 600px;
  margin: 0 auto;
}

.price-summary-card {
  border-radius: 12px;
}

.payment-method-card {
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-method-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  transform: translateY(-2px);
}

.fiat-buttons,
.crypto-buttons {
  animation: fadeIn 0.3s ease;
}

.deployment-success {
  animation: fadeIn 0.5s ease;
}

/* Responsive */
@media (max-width: 600px) {
  .orbit-stepper :deep(.v-stepper-header) {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .orbit-stepper :deep(.v-stepper-item) {
    flex-basis: calc(33.333% - 0.25rem);
    padding: 0.25rem;
  }

  .orbit-stepper :deep(.v-stepper-item__avatar) {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }

  .orbit-stepper :deep(.v-stepper-item__title) {
    font-size: 0.625rem;
    line-height: 1.2;
  }

  .orbit-stepper :deep(.v-divider) {
    display: none;
  }

  .orbit-header {
    flex-direction: column;
    padding-top: 2.5rem;
  }

  .orbit-title {
    font-size: 1.25rem;
  }

  .back-btn {
    position: absolute;
    top: 0;
    left: 0;
  }

  .step-content {
    padding: 0.75rem 0;
  }

  .step-title {
    font-size: 1.1rem;
  }

  .step-description {
    font-size: 0.8rem;
  }

  .shared-features-card {
    padding: 16px;
    border-radius: 16px;
  }

  .shared-features-header {
    margin-bottom: 16px;
  }

  .shared-features-title {
    gap: 8px;
  }

  .shared-features-title .orbit-icon {
    font-size: 24px;
  }

  .shared-features-title h4 {
    font-size: 1.1rem;
  }

  .shared-features-subtitle {
    font-size: 0.8rem;
  }

  .shared-features-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .shared-feature-item {
    padding: 8px 10px;
    gap: 8px;
    border-radius: 10px;
  }

  .shared-feature-item .v-icon {
    font-size: 18px !important;
  }

  .feature-name {
    font-size: 0.825rem;
  }

  .feature-detail {
    font-size: 0.7rem;
  }

  .orbit-comparison-card {
    padding: 12px;
    border-radius: 12px;
  }

  .comparison-title {
    font-size: 0.9rem;
  }

  .comparison-subtitle {
    font-size: 0.75rem;
  }

  .orbit-comparison-table {
    font-size: 0.7rem;
  }

  .orbit-comparison-table th,
  .orbit-comparison-table td {
    padding: 0.4rem 0.5rem;
  }

  .orbit-comparison-hint {
    font-size: 0.7rem;
    padding: 8px 10px;
  }

  .plans-section-title {
    font-size: 0.95rem;
    margin-bottom: 12px;
  }

  .plan-card {
    padding: 16px;
    gap: 12px;
    border-radius: 16px;
  }

  .recommended-badge,
  .coming-soon-badge {
    padding: 4px 14px;
    font-size: 0.65rem;
  }

  .custom-badge {
    padding: 4px 14px;
    font-size: 0.65rem;
  }

  .custom-resources-config {
    padding: 12px;
    gap: 12px;
  }

  .resource-config-label {
    font-size: 0.8rem;
  }

  .resource-config-value {
    font-size: 0.75rem;
    padding: 2px 6px;
  }

  .custom-geolocation-section {
    padding-top: 10px;
  }

  .custom-price-display {
    padding: 12px;
    margin-top: 12px;
  }

  .price-after-free {
    font-size: 0.7rem;
  }

  .price-amount-large {
    font-size: 1.5rem;
  }

  .price-period-small {
    font-size: 0.75rem;
  }

  .price-flux {
    font-size: 0.75rem;
  }

  .plan-header {
    padding-bottom: 12px;
    min-height: 80px;
  }

  .plan-name {
    font-size: 1.1rem;
    margin-bottom: 6px;
  }

  .plan-description {
    font-size: 0.8rem;
    min-height: 2em;
  }

  .plan-price-badge {
    padding: 12px;
    border-radius: 12px;
  }

  .price-amount {
    font-size: 1.75rem;
  }

  .price-period {
    font-size: 0.875rem;
  }

  .first-month-free-badge {
    font-size: 0.65rem;
    padding: 3px 10px;
  }

  .resource-row {
    grid-template-columns: 24px 1fr auto;
    gap: 8px;
    padding: 8px;
    border-radius: 8px;
  }

  .resource-icon {
    font-size: 18px;
  }

  .resource-label {
    font-size: 0.7rem;
  }

  .resource-value {
    font-size: 0.8rem;
  }

  .plan-btn-wrapper :deep(.v-btn) {
    height: 46px !important;
    min-height: 46px !important;
    max-height: 46px !important;
    font-size: 0.85rem !important;
  }

  .plan-disclaimer {
    margin-top: 1.5rem;
    padding: 0.75rem 1rem;
  }

  .disclaimer-text {
    font-size: 0.75rem;
  }

  .plan-specs,
  .plan-tagline,
  .billing-period {
    padding-left: 0;
  }

  .review-section {
    padding: 1rem;
  }

  .review-section-title {
    font-size: 0.9rem;
  }

  .review-item {
    flex-direction: column;
    gap: 0.25rem;
  }

  .review-item-row {
    grid-template-columns: 1fr;
  }

  .review-label {
    font-size: 0.85rem;
  }

  .review-value {
    text-align: left;
    font-size: 0.85rem;
  }

  .review-value.price {
    font-size: 1.1rem;
  }

  .env-var-row {
    flex-wrap: wrap;
  }

  .env-key,
  .env-value {
    flex: 1 1 100%;
  }

  .monorepo-project-card {
    padding: 0.5rem;
  }

  .project-name {
    font-size: 0.85rem;
  }

  .project-path {
    font-size: 0.7rem;
  }

  .project-description {
    font-size: 0.75rem;
    padding-left: 1.5rem;
  }

  .orbit-env-item {
    padding: 0.5rem;
  }

  .orbit-env-key {
    font-size: 0.75rem;
  }

  .orbit-env-description {
    font-size: 0.75rem;
  }
}

/* Continue button hint message */
.continue-button-hint {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-warning));
  animation: fadeSlideIn 0.3s ease;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Test Connection button highlight/pulse animation */
.test-connection-highlight {
  animation: pulseHighlight 2s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.4);
}

@keyframes pulseHighlight {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(var(--v-theme-primary), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0);
  }
}
</style>
