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
                      Sign in to deploy your application from Git using Orbit.
                    </p>

                    <!-- Features List -->
                    <div class="d-flex justify-center mb-8">
                      <div style="display: inline-block;">
                        <div class="d-sm-flex">
                          <div class="mr-sm-8">
                            <div class="d-flex align-center mb-2">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">No Docker knowledge needed</span>
                            </div>
                            <div class="d-flex align-center mb-2">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">100+ frameworks supported</span>
                            </div>
                          </div>
                          <div>
                            <div class="d-flex align-center mb-2">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">Built-in CI/CD</span>
                            </div>
                            <div class="d-flex align-center">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">Free tier available</span>
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
                        Back to Options
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
                  Back to deployment options
                </VBtn>
                <div class="orbit-header-content">
                  <VIcon size="32" color="primary" class="mr-3">mdi-rocket-launch</VIcon>
                  <div>
                    <h1 class="orbit-title">Deploy with Orbit</h1>
                    <p class="orbit-subtitle">Connect your Git repository and deploy in minutes</p>
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
                    <h3 class="step-title">Connect Your Repository</h3>
                    <p class="step-description">
                      Enter your Git repository URL. We support GitHub, GitLab, and Bitbucket.
                    </p>

                    <VForm ref="repoForm" @submit.prevent="nextStep">
                      <VTextField
                        v-model="repoUrl"
                        label="Repository URL *"
                        placeholder="https://github.com/username/repo"
                        prepend-inner-icon="mdi-github"
                        :rules="[rules.required, rules.validRepoUrl]"
                        variant="outlined"
                        class="mb-2"
                        hint="Public or private repository URL"
                        persistent-hint
                        :loading="repoCheckStatus === 'checking'"
                      />

                      <!-- Repository Status Badges -->
                      <div v-if="repoCheckStatus !== 'idle'" class="repo-status-badges mb-4">
                        <!-- Checking -->
                        <VChip v-if="repoCheckStatus === 'checking'" color="info" variant="tonal" size="small">
                          <VProgressCircular indeterminate size="14" width="2" class="mr-2" />
                          Checking repository...
                        </VChip>

                        <!-- Public repo -->
                        <VChip v-else-if="repoCheckStatus === 'public'" color="success" variant="tonal" size="small">
                          <VIcon start size="16">mdi-lock-open</VIcon>
                          Public Repository
                        </VChip>

                        <!-- Private repo -->
                        <VChip v-else-if="repoCheckStatus === 'private'" color="warning" variant="tonal" size="small">
                          <VIcon start size="16">mdi-lock</VIcon>
                          Private Repository - Authentication Required
                        </VChip>

                        <!-- Error -->
                        <VChip v-else-if="repoCheckStatus === 'error'" color="error" variant="tonal" size="small">
                          <VIcon start size="16">mdi-alert-circle</VIcon>
                          {{ repoCheckError || 'Error checking repository' }}
                        </VChip>

                        <!-- Provider badge -->
                        <VChip v-if="detectedProvider && repoCheckStatus !== 'checking'" :color="providerColor" variant="tonal" size="small" class="ml-2">
                          <VIcon start :icon="providerIcon" size="16" />
                          {{ detectedProvider }}
                        </VChip>

                        <!-- Framework detected badge -->
                        <VChip v-if="detectedFramework" color="primary" variant="tonal" size="small" class="ml-2">
                          <VIcon start size="16">mdi-auto-fix</VIcon>
                          {{ detectedFramework }} detected
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
                              <strong>Private Repository Detected</strong>
                              <p class="text-body-2 mb-0 mt-1">
                                This repository requires authentication. Your app will be registered as an enterprise application.
                              </p>
                            </div>
                          </VAlert>

                          <VTextField
                            v-model="repoUsername"
                            label="Username / Token Name"
                            placeholder="github-username or token"
                            prepend-inner-icon="mdi-account"
                            variant="outlined"
                            class="mb-3"
                            hint="For GitHub, use your username or 'token'"
                            persistent-hint
                          />
                          <VTextField
                            v-model="repoToken"
                            label="Personal Access Token *"
                            placeholder="ghp_xxxxxxxxxxxx"
                            prepend-inner-icon="mdi-key"
                            :type="showToken ? 'text' : 'password'"
                            :append-inner-icon="showToken ? 'mdi-eye-off' : 'mdi-eye'"
                            variant="outlined"
                            :rules="repoCheckStatus === 'private' ? [rules.required] : []"
                            hint="Generate a token with repo access from your Git provider settings"
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
                              @click="testAuthConnection"
                            >
                              <VIcon start>mdi-connection</VIcon>
                              Test Connection
                            </VBtn>

                            <!-- Auth test status -->
                            <div v-if="authTestStatus === 'success'" class="auth-test-result mt-3">
                              <VAlert type="success" variant="tonal" density="compact">
                                <template #prepend>
                                  <VIcon>mdi-check-circle</VIcon>
                                </template>
                                <strong>Connection successful!</strong> Repository access verified.
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
                          <!-- Branch Selection -->
                          <VAutocomplete
                            v-model="branch"
                            :items="branchItems"
                            item-title="title"
                            item-value="value"
                            label="Branch"
                            placeholder="Select a branch"
                            prepend-inner-icon="mdi-source-branch"
                            variant="outlined"
                            class="mb-4"
                            :loading="branchesLoading"
                            :no-data-text="branchesLoading ? 'Loading branches...' : 'No branches found'"
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
                                    Default
                                  </VChip>
                                </template>
                              </VListItem>
                            </template>
                            <template #details>
                              <div class="d-flex align-center flex-wrap gap-2">
                                <span v-if="branches.length > 0" class="text-caption">
                                  {{ branches.length }} branches available
                                </span>
                                <span v-else class="text-caption">
                                  Default: main
                                </span>
                              </div>
                            </template>
                          </VAutocomplete>

                          <!-- Monorepo Detection & Project Selection -->
                          <div class="monorepo-section mb-4">
                            <!-- Loading state -->
                            <div v-if="detectingMonorepo" class="monorepo-loading">
                              <VProgressCircular indeterminate size="20" width="2" class="mr-2" />
                              <span class="text-body-2">Detecting monorepo structure...</span>
                            </div>

                            <!-- Monorepo detected with projects -->
                            <div v-else-if="isMonorepo && monorepoProjects.length > 0">
                              <VAlert type="info" variant="tonal" density="compact" class="mb-3">
                                <template #prepend>
                                  <VIcon>mdi-folder-multiple</VIcon>
                                </template>
                                <div class="d-flex align-center flex-wrap gap-2">
                                  <span><strong>Monorepo detected!</strong></span>
                                  <VChip size="x-small" color="primary" variant="flat">
                                    {{ monorepoType }}
                                  </VChip>
                                  <span class="text-body-2">{{ monorepoProjects.length }} projects found</span>
                                </div>
                              </VAlert>

                              <p class="text-body-2 mb-2">Select the project to deploy:</p>

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

                            <!-- Not a monorepo or manual input -->
                            <div v-else>
                              <VTextField
                                v-model="projectPath"
                                label="Project Path (Monorepo)"
                                placeholder="/"
                                prepend-inner-icon="mdi-folder"
                                hint="For monorepos, specify the folder containing your app (e.g., /apps/frontend)"
                                persistent-hint
                                variant="outlined"
                              />
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
                    <h3 class="step-title">Application Configuration</h3>
                    <p class="step-description">
                      Configure your application settings. Orbit will auto-detect your framework.
                    </p>

                    <VForm ref="configForm">
                      <VTextField
                        v-model="appName"
                        label="Application Name *"
                        placeholder="my-awesome-app"
                        prepend-inner-icon="mdi-application"
                        :rules="[rules.required, rules.appName]"
                        variant="outlined"
                        class="mb-4"
                        hint="Lowercase letters, numbers, and hyphens only (3-32 chars)"
                        persistent-hint
                      />

                      <VTextField
                        v-model="appPort"
                        label="Application Port *"
                        placeholder="3000"
                        prepend-inner-icon="mdi-lan-connect"
                        type="number"
                        :rules="[rules.required, rules.port]"
                        variant="outlined"
                        class="mb-4"
                        persistent-hint
                      >
                        <template #details>
                          <div class="d-flex align-center flex-wrap gap-2">
                            <span class="text-caption">The port your application listens on</span>
                            <VChip v-if="portAutoDetected" color="success" size="x-small" variant="flat">
                              <VIcon start size="12">mdi-auto-fix</VIcon>
                              Auto-detected{{ detectedFramework ? ` from ${detectedFramework}` : '' }}
                            </VChip>
                          </div>
                        </template>
                      </VTextField>

                      <VTextField
                        v-model="contactEmail"
                        label="Contact Email *"
                        placeholder="you@example.com"
                        prepend-inner-icon="mdi-email"
                        type="email"
                        :rules="[rules.required, rules.email]"
                        variant="outlined"
                        class="mb-4"
                        hint="For deployment notifications and alerts"
                        persistent-hint
                      />

                      <!-- Runtime Version Selection -->
                      <VExpansionPanels class="mb-4">
                        <VExpansionPanel>
                          <VExpansionPanelTitle>
                            <VIcon start size="20">mdi-cog</VIcon>
                            Runtime Version (Optional)
                          </VExpansionPanelTitle>
                          <VExpansionPanelText>
                            <VAlert type="info" variant="tonal" density="compact" class="mb-4">
                              Orbit auto-detects your runtime. Only specify if you need a specific version.
                            </VAlert>

                            <VSelect
                              v-model="selectedRuntime"
                              :items="runtimeOptions"
                              label="Runtime"
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
                            Environment Variables
                            <VChip v-if="customEnvVars.length > 0" size="x-small" color="primary" class="ml-2">
                              {{ customEnvVars.length }}
                            </VChip>
                          </VExpansionPanelTitle>
                          <VExpansionPanelText>
                            <VAlert type="info" variant="tonal" density="compact" class="mb-4">
                              Configure environment variables for your application. Click on any Orbit variable below to add it.
                            </VAlert>

                            <!-- Available Orbit Environment Variables -->
                            <div class="orbit-env-vars mb-4">
                              <p class="text-subtitle-2 font-weight-medium mb-2">Available Orbit Variables</p>
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
                                      Added
                                    </VChip>
                                    <VBtn
                                      v-else
                                      size="x-small"
                                      color="primary"
                                      variant="tonal"
                                      @click.stop="addOrbitEnvVar(orbitVar)"
                                    >
                                      <VIcon start size="14">mdi-plus</VIcon>
                                      Add
                                    </VBtn>
                                  </div>
                                  <p class="orbit-env-description text-caption text-medium-emphasis mb-0">
                                    {{ orbitVar.description }}
                                  </p>
                                  <p v-if="orbitVar.autoValue" class="orbit-env-auto text-caption mb-0">
                                    <VIcon size="12" color="success" class="mr-1">mdi-auto-fix</VIcon>
                                    <span class="text-success font-weight-medium">If not set:</span>
                                    {{ orbitVar.autoValue }}
                                  </p>
                                  <p v-if="orbitVar.example" class="orbit-env-example text-caption mb-0">
                                    Example: <code>{{ orbitVar.example }}</code>
                                  </p>
                                </div>
                              </div>
                            </div>

                            <VDivider class="my-4" />

                            <!-- Added Environment Variables -->
                            <p class="text-subtitle-2 font-weight-medium mb-2">
                              Your Environment Variables
                              <span v-if="customEnvVars.length === 0" class="text-caption text-medium-emphasis">
                                (none added yet)
                              </span>
                            </p>

                            <div v-for="(envVar, index) in customEnvVars" :key="index" class="env-var-row mb-3">
                              <VTextField
                                v-model="envVar.key"
                                label="Key"
                                placeholder="API_KEY"
                                variant="outlined"
                                density="compact"
                                class="env-key"
                                :readonly="envVar.isOrbitVar"
                              />
                              <VTextField
                                v-model="envVar.value"
                                label="Value"
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
                              Add Custom Variable
                            </VBtn>
                          </VExpansionPanelText>
                        </VExpansionPanel>
                      </VExpansionPanels>

                      <!-- Deployment Settings (Geolocation & Custom Domain) -->
                      <VExpansionPanels class="mb-4">
                        <VExpansionPanel>
                          <VExpansionPanelTitle>
                            <VIcon start size="20">mdi-earth</VIcon>
                            Deployment Location & Domain
                            <VChip
                              v-if="selectedGeo.continent !== 'ALL' || customDomain"
                              size="x-small"
                              color="primary"
                              class="ml-2"
                            >
                              {{ (selectedGeo.continent !== 'ALL' ? 1 : 0) + (customDomain ? 1 : 0) }}
                            </VChip>
                          </VExpansionPanelTitle>
                          <VExpansionPanelText>
                            <VAlert type="info" variant="tonal" density="compact" class="mb-4">
                              Choose where your application will be deployed and optionally set a custom domain.
                            </VAlert>

                            <!-- Geolocation Selection -->
                            <div class="mb-4">
                              <p class="text-subtitle-2 font-weight-medium mb-2">
                                <VIcon start size="18">mdi-map-marker</VIcon>
                                Server Location
                              </p>

                              <VRow>
                                <VCol cols="12" sm="6">
                                  <VSelect
                                    v-model="selectedGeo.continent"
                                    :items="getContinents()"
                                    item-title="text"
                                    item-value="value"
                                    label="Continent"
                                    prepend-inner-icon="mdi-earth"
                                    variant="outlined"
                                    density="compact"
                                  />
                                </VCol>
                                <VCol cols="12" sm="6">
                                  <VSelect
                                    v-model="selectedGeo.country"
                                    :items="getCountries(selectedGeo.continent)"
                                    item-title="text"
                                    item-value="value"
                                    label="Country"
                                    prepend-inner-icon="mdi-flag"
                                    variant="outlined"
                                    density="compact"
                                    :disabled="selectedGeo.continent === 'ALL'"
                                  />
                                </VCol>
                              </VRow>

                              <p class="text-caption text-medium-emphasis mt-2">
                                <VIcon size="14" class="mr-1">mdi-information-outline</VIcon>
                                Select a region to deploy your application closer to your users.
                              </p>
                            </div>

                            <VDivider class="my-4" />

                            <!-- Custom Domain -->
                            <div>
                              <p class="text-subtitle-2 font-weight-medium mb-2">
                                <VIcon start size="18">mdi-web</VIcon>
                                Custom Domain
                              </p>

                              <VTextField
                                v-model="customDomain"
                                label="Custom Domain"
                                placeholder="myapp.example.com"
                                prepend-inner-icon="mdi-link-variant"
                                variant="outlined"
                                density="compact"
                                hint="Enter your custom domain (you'll need to configure DNS separately)"
                                persistent-hint
                              />
                            </div>
                          </VExpansionPanelText>
                        </VExpansionPanel>
                      </VExpansionPanels>

                      <!-- Framework auto-detection notice -->
                      <VAlert
                        type="success"
                        variant="tonal"
                        class="mb-4"
                      >
                        <template #prepend>
                          <VIcon>mdi-auto-fix</VIcon>
                        </template>
                        <div>
                          <strong>Auto-Detection Enabled</strong>
                          <p class="text-body-2 mb-0 mt-1">
                            Orbit automatically detects your framework (Next.js, Django, Rails, Spring Boot, etc.)
                            and configures the build process. No Dockerfile needed!
                          </p>
                        </div>
                      </VAlert>
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

                    <!-- Shared Features Card -->
                    <div class="shared-features-card">
                      <div class="shared-features-header">
                        <div class="shared-features-title">
                          <VIcon class="orbit-icon">mdi-orbit</VIcon>
                          <h4>{{ t('pages.apps.register.orbit.pricing.sharedFeatures.title') }}</h4>
                        </div>
                        <p class="shared-features-subtitle">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.subtitle') }}</p>
                      </div>

                      <div class="shared-features-grid">
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-infinity</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.unlimitedBuilds') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.unlimitedBuildsDetail') }}</span>
                          </div>
                        </div>
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-memory</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.dedicatedResources') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.dedicatedResourcesDetail') }}</span>
                          </div>
                        </div>
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-code-tags</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.frameworks') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.frameworksDetail') }}</span>
                          </div>
                        </div>
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-auto-fix</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.zeroConfig') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.zeroConfigDetail') }}</span>
                          </div>
                        </div>
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-pipe</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.cicd') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.cicdDetail') }}</span>
                          </div>
                        </div>
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-web</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.customDomain') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.customDomainDetail') }}</span>
                          </div>
                        </div>
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-earth</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.geolocation') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.geolocationDetail') }}</span>
                          </div>
                        </div>
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-source-branch</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.branchPreviews') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.branchPreviewsDetail') }}</span>
                          </div>
                        </div>
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-backup-restore</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.autoRollback') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.autoRollbackDetail') }}</span>
                          </div>
                        </div>
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-folder-multiple</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.monorepo') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.monorepoDetail') }}</span>
                          </div>
                        </div>
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-heart-pulse</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.healthChecks') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.healthChecksDetail') }}</span>
                          </div>
                        </div>
                        <div class="shared-feature-item">
                          <VIcon color="success">mdi-shield-check</VIcon>
                          <div class="feature-text">
                            <span class="feature-name">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.security') }}</span>
                            <span class="feature-detail">{{ t('pages.apps.register.orbit.pricing.sharedFeatures.securityDetail') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <h4 class="plans-section-title">{{ t('pages.apps.register.orbit.pricing.allPlansInclude') }}</h4>

                    <div class="plans-grid">
                      <!-- Free Plan -->
                      <div
                        class="plan-card"
                        :class="{ 'selected': selectedPlan === 'free' }"
                        @click="selectedPlan = 'free'"
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
                            <span class="resource-label">CPU</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.freeFeatures.cpu') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-memory</VIcon>
                            <span class="resource-label">RAM</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.freeFeatures.ram') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-harddisk</VIcon>
                            <span class="resource-label">Storage</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.freeFeatures.storage') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-server-network</VIcon>
                            <span class="resource-label">Instances</span>
                            <span class="resource-value">1</span>
                          </div>
                        </div>

                        <div class="plan-btn-wrapper">
                          <VBtn
                            block
                            color="primary"
                            size="large"
                            variant="elevated"
                            class="plan-btn"
                            @click.stop="selectedPlan = 'free'"
                          >
                            <VIcon start>mdi-check-circle</VIcon>
                            {{ selectedPlan === 'free' ? 'Selected' : 'Select Plan' }}
                          </VBtn>
                        </div>
                      </div>

                      <!-- Developer Plan -->
                      <div
                        class="plan-card recommended"
                        :class="{ 'selected': selectedPlan === 'developer' }"
                        @click="selectedPlan = 'developer'"
                      >
                        <div class="recommended-badge">
                          {{ t('pages.apps.register.orbit.pricing.mostPopular') }}
                        </div>

                        <div class="plan-price-badge">
                          <span class="price-amount">$2.38</span>
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
                            <span class="resource-label">CPU</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.developerFeatures.cpu') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-memory</VIcon>
                            <span class="resource-label">RAM</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.developerFeatures.ram') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-harddisk</VIcon>
                            <span class="resource-label">Storage</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.developerFeatures.storage') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-server-network</VIcon>
                            <span class="resource-label">Instances</span>
                            <span class="resource-value">2</span>
                          </div>
                        </div>

                        <div class="plan-btn-wrapper">
                          <VBtn
                            block
                            color="primary"
                            size="large"
                            variant="elevated"
                            class="plan-btn"
                            @click.stop="selectedPlan = 'developer'"
                          >
                            <VIcon start>mdi-check-circle</VIcon>
                            {{ selectedPlan === 'developer' ? 'Selected' : 'Select Plan' }}
                          </VBtn>
                        </div>
                      </div>

                      <!-- Pro Plan -->
                      <div
                        class="plan-card"
                        :class="{ 'selected': selectedPlan === 'pro' }"
                        @click="selectedPlan = 'pro'"
                      >
                        <div class="plan-price-badge">
                          <span class="price-amount">$3.80</span>
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
                            <span class="resource-label">CPU</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.proFeatures.cpu') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-memory</VIcon>
                            <span class="resource-label">RAM</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.proFeatures.ram') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-harddisk</VIcon>
                            <span class="resource-label">Storage</span>
                            <span class="resource-value">{{ t('pages.apps.register.orbit.pricing.proFeatures.storage') }}</span>
                          </div>
                          <div class="resource-row">
                            <VIcon class="resource-icon">mdi-server-network</VIcon>
                            <span class="resource-label">Instances</span>
                            <span class="resource-value">2</span>
                          </div>
                        </div>

                        <div class="plan-btn-wrapper">
                          <VBtn
                            block
                            color="primary"
                            size="large"
                            variant="elevated"
                            class="plan-btn"
                            @click.stop="selectedPlan = 'pro'"
                          >
                            <VIcon start>mdi-check-circle</VIcon>
                            {{ selectedPlan === 'pro' ? 'Selected' : 'Select Plan' }}
                          </VBtn>
                        </div>
                      </div>
                    </div>

                    <!-- Beginner Plan Disclaimer -->
                    <div class="plan-disclaimer">
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
                    <h3 class="step-title">{{ t('pages.apps.register.orbit.review.stepTitle') }}</h3>
                    <p class="step-description">
                      {{ t('pages.apps.register.orbit.review.stepDescription') }}
                    </p>

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
                        <div class="review-item">
                          <span class="review-label">{{ t('pages.apps.register.orbit.review.branch') }}:</span>
                          <span class="review-value">{{ branch || 'main' }}</span>
                        </div>
                        <div v-if="projectPath && projectPath !== '/'" class="review-item">
                          <span class="review-label">{{ t('pages.apps.register.orbit.review.projectPath') }}:</span>
                          <span class="review-value">{{ projectPath }}</span>
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
                            <VChip color="success" size="small">
                              {{ t('pages.apps.register.orbit.pricing.beta') }}
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
                        <div v-if="selectedGeo.continent !== 'ALL'" class="review-item">
                          <span class="review-label">{{ t('pages.apps.register.orbit.review.geolocation') }}:</span>
                          <span class="review-value">
                            <VChip
                              size="x-small"
                              color="success"
                              class="mr-1"
                              label
                            >
                              <VIcon start size="12">mdi-map-marker</VIcon>
                              {{ getGeolocationLabel(buildGeoCode(selectedGeo)) }}
                            </VChip>
                          </span>
                        </div>
                        <div v-if="customDomain" class="review-item">
                          <span class="review-label">Custom Domain:</span>
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
                          <span class="review-value price">{{ formattedTotalPrice }}</span>
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

                        <VAlert
                          v-if="registrationError"
                          type="error"
                          variant="tonal"
                          class="mt-4"
                        >
                          <strong>{{ t('pages.apps.register.orbit.deploy.registrationFailed') }}:</strong> {{ registrationError }}
                          <template #append>
                            <VBtn
                              color="error"
                              variant="text"
                              size="small"
                              @click="retryRegistration"
                            >
                              {{ t('pages.apps.register.orbit.deploy.retry') }}
                            </VBtn>
                          </template>
                        </VAlert>
                      </div>
                    </div>

                    <!-- Registration Success -->
                    <div v-else-if="testFinished" class="registration-success">
                      <div class="text-center">
                        <VIcon size="48" color="success" class="mb-2">mdi-check-circle</VIcon>
                        <h3 class="text-h5 font-weight-bold mb-1">Registration Complete</h3>
                        <p class="text-body-2 text-medium-emphasis mb-2">
                          Your application has been successfully registered on the Flux network.
                        </p>
                      </div>

                      <div class="text-center mt-3">
                        <p class="text-body-2 text-medium-emphasis">Proceeding to payment...</p>
                        <VProgressLinear indeterminate color="primary" class="mt-2" style="max-width: 200px; margin: 0 auto;" />
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Step 6: Payment -->
                <template #item.6>
                  <div class="step-content payment-step">

                    <!-- Payment Processing Phase -->
                    <div v-if="!paymentConfirmed" class="payment-phase">
                      <!-- Free Month Info -->
                      <div class="text-center mb-6">
                        <VAvatar size="80" color="success" variant="tonal" class="mb-4">
                          <VIcon size="48">mdi-gift-outline</VIcon>
                        </VAvatar>
                        <h3 class="text-h4 font-weight-bold mb-2">{{ t('pages.apps.register.orbit.deploy.freeMonthTitle') }}</h3>
                        <p class="text-body-1 text-medium-emphasis mb-2">
                          {{ t('pages.apps.register.orbit.deploy.freeMonthDescription') }}
                        </p>
                        <VChip color="primary" variant="tonal" size="small">
                          <VIcon start size="16">mdi-domain</VIcon>
                          {{ t('pages.apps.register.orbit.deploy.sponsoredBy') }}
                        </VChip>
                      </div>

                      <!-- Payment Submission Info -->
                      <VCard variant="outlined" class="mb-6">
                        <VCardText class="text-center py-4">
                          <VIcon color="info" size="24" class="mb-2">mdi-information-outline</VIcon>
                          <p class="text-body-2 text-medium-emphasis mb-0">
                            {{ t('pages.apps.register.orbit.deploy.paymentSubmissionInfo') }}
                          </p>
                        </VCardText>
                      </VCard>

                      <!-- System Checking -->
                      <div class="payment-monitoring">
                        <LoadingSpinner
                          :message="t('pages.apps.register.orbit.deploy.checkingRegistration')"
                          loading
                        />
                        <p class="text-body-2 text-medium-emphasis text-center mt-4">
                          {{ t('pages.apps.register.orbit.deploy.checkingDescription') }}
                        </p>
                      </div>
                    </div>

                    <!-- Deployment Success -->
                    <div v-else class="deployment-success">
                      <div class="text-center">
                        <VIcon size="80" color="success" class="mb-4">mdi-check-circle</VIcon>
                        <h3 class="text-h4 font-weight-bold mb-2">{{ t('pages.apps.register.orbit.deploy.registrationCompleteTitle') }}</h3>
                        <p class="text-body-1 text-medium-emphasis mb-4">
                          {{ t('pages.apps.register.orbit.deploy.registrationCompleteDescription') }}
                        </p>

                        <VCard variant="outlined" class="mb-4">
                          <VCardText>
                            <div class="d-flex align-center justify-center gap-2 mb-2">
                              <VIcon color="primary">mdi-application</VIcon>
                              <span class="text-h6">{{ appName }}</span>
                            </div>
                            <VDivider class="my-3" />
                            <div class="d-flex align-center justify-center gap-2">
                              <VIcon color="info" size="20">mdi-server</VIcon>
                              <p class="text-body-2 text-medium-emphasis mb-0">
                                {{ t('pages.apps.register.orbit.deploy.nodesSpawning') }}
                              </p>
                            </div>
                          </VCardText>
                        </VCard>

                        <div class="d-flex flex-column flex-sm-row justify-center gap-3">
                          <VBtn
                            color="primary"
                            size="large"
                            :to="{ name: 'apps-management' }"
                          >
                            <VIcon start>mdi-view-dashboard</VIcon>
                            {{ t('pages.apps.register.orbit.deploy.viewDashboard') }}
                          </VBtn>
                          <VBtn
                            variant="outlined"
                            size="large"
                            :to="{ name: 'apps-register-orbit' }"
                            @click="resetForm"
                          >
                            <VIcon start>mdi-plus</VIcon>
                            {{ t('pages.apps.register.orbit.deploy.deployAnother') }}
                          </VBtn>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Actions -->
                <template #actions>
                  <div class="stepper-actions">
                    <VBtn
                      v-if="currentStep > 1 && currentStep < 5"
                      variant="text"
                      @click="currentStep--"
                      :disabled="deploying"
                    >
                      <VIcon start>mdi-arrow-left</VIcon>
                      {{ t('pages.apps.register.orbit.navigation.back') }}
                    </VBtn>
                    <VSpacer />
                    <VBtn
                      v-if="currentStep < 4"
                      color="primary"
                      @click="nextStep"
                    >
                      {{ t('pages.apps.register.orbit.navigation.continue') }}
                      <VIcon end>mdi-arrow-right</VIcon>
                    </VBtn>
                    <VBtn
                      v-else-if="currentStep === 4"
                      color="primary"
                      size="large"
                      :loading="deploying"
                      :disabled="!acceptedTerms"
                      @click="proceedToPayment"
                    >
                      <VIcon start>mdi-rocket-launch</VIcon>
                      Register Application
                    </VBtn>
                    <!-- No action buttons on steps 5 and 6 - handled within the step content -->
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
import { useSEONoIndex } from '@/composables/useSEO'
import { useLoginSheet } from '@/composables/useLoginSheet'
import axios from 'axios'
import geolocations from '@/utils/geolocation'
import AppsService from '@/services/AppsService'
import StorageService from '@/services/StorageService'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import { signWithSSP, signWithZelcore } from '@/utils/walletService'
import { getDetectedBackendURL } from '@/utils/backend'
import qs from 'qs'

// Prevent indexing
useSEONoIndex()

const { t } = useI18n()
const router = useRouter()
const { openLoginBottomSheet, closeLoginBottomSheet } = useLoginSheet()

// Flux store
const fluxStore = useFluxStore()
const { privilege, zelid } = storeToRefs(fluxStore)

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
const stepItems = [
  { title: 'Plan', value: 1 },
  { title: 'Repository', value: 2 },
  { title: 'Configure', value: 3 },
  { title: 'Review', value: 4 },
  { title: 'Register', value: 5 },
  { title: 'Payment', value: 6 },
]

// Scroll to top when step changes
watch(currentStep, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

// Form refs
const repoForm = ref(null)
const configForm = ref(null)

// Step 1: Repository
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

// Monorepo detection
const isMonorepo = ref(false)
const monorepoType = ref(null) // 'pnpm', 'npm', 'yarn', 'lerna', 'nx', 'turbo', 'rush'
const monorepoProjects = ref([]) // List of detected projects/workspaces
const detectingMonorepo = ref(false)

// Step 2: Configuration
const appName = ref('')
const appDescription = ref('')
const appPort = ref('3000')
const portAutoDetected = ref(false)
const contactEmail = ref('')
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

// Step 3: Plan
const selectedPlan = ref(null)
const billingPeriod = ref('1')

// Pro plan features
const customDomain = ref('')

// Geolocation state
const possibleLocations = ref([])
const selectedGeo = ref({ continent: 'ALL', country: 'ALL', region: 'ALL' })

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

// Get continents from available locations
const getContinents = () => {
  const options = [{ value: 'ALL', text: 'Global (Any Location)' }]
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

// Get countries for selected continent
const getCountries = continentCode => {
  if (!continentCode || continentCode === 'ALL') return [{ value: 'ALL', text: 'All Countries' }]

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

// Get regions for selected country
const getRegions = (continentCode, countryCode) => {
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

// Generate random exposed port between 20000-65535
const generateRandomPort = () => {
  return Math.floor(Math.random() * (65535 - 20000 + 1)) + 20000
}

// Random exposed port (generated once on mount)
const exposedPort = ref(generateRandomPort())

// Step 4: Terms
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
const checkoutLoading = ref(false)
const showFiatOptions = ref(false)
const showCryptoOptions = ref(false)

// Plan resources
const planResources = computed(() => {
  if (selectedPlan.value === 'free') {
    return { cpu: 1, ram: 2, storage: 10, instances: 1 }
  }

  if (selectedPlan.value === 'developer') {
    return { cpu: 1.5, ram: 4, storage: 15, instances: 2 }
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
  const monthlyPrice = selectedPlan.value === 'developer' ? 2.38 : 3.80
  const basePrice = monthlyPrice * paidMonths
  const discount = basePrice * (discountPercentage.value / 100)

  return basePrice - discount
})

const formattedTotalPrice = computed(() => {
  if (selectedPlan.value === 'free') return '$0 (Beginner)'

  return `$${totalPrice.value.toFixed(2)} (${billingPeriodLabel.value})`
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
    key: 'POLLING_INTERVAL',
    description: 'Interval in seconds for auto-update checks (polls your repo for new commits)',
    example: '300',
    placeholder: '300',
    autoValue: 'Disabled (no auto-polling). Set to enable automatic updates',
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

  // Generate a unique enterprise identifier for private repos
  const enterpriseId = isEnterpriseApp.value
    ? `orbit_${appName.value || 'app'}_${Date.now().toString(36)}`
    : ''

  // Build domains array - include custom domain for all plans
  const domains = customDomain.value
    ? [customDomain.value]
    : ['']

  // Build geolocation array - available for all plans
  // Use selectedGeo to build the geolocation code (same format as games section)
  let geolocation = []
  if (selectedGeo.value.continent && selectedGeo.value.continent !== 'ALL') {
    const geoCode = buildGeoCode(selectedGeo.value)
    geolocation = [geoCode]
  }

  return {
    version: 8,
    name: appName.value || 'orbit-app',
    description: appDescription.value || `Orbit deployment from ${detectedProvider.value || 'Git'}`,
    owner: zelid.value || '',
    contacts: [contactEmail.value],
    instances: planResources.value.instances,
    staticip: false,
    enterprise: enterpriseId, // Set enterprise flag for private repos
    nodes: [],
    geolocation,
    expire: billingPeriod.value === '1' ? 88000 : parseInt(billingPeriod.value, 10) * 88000,
    compose: [
      {
        name: appName.value || 'orbit-app',
        description: appDescription.value || 'Orbit deployment',
        repotag: 'runonflux/orbit:latest',
        ports: [exposePort], // Random external port between 20000-65535
        containerPorts: [containerPort], // Internal app port
        domains,
        environmentParameters: buildEnvironmentParameters(),
        commands: [],
        containerData: '/app/data',
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

// Step navigation
const nextStep = async () => {
  // Step 1: Plan Selection - no validation needed
  if (currentStep.value === 2) {
    // Step 2: Repository - validate repo form
    const { valid } = await repoForm.value.validate()
    if (!valid) return
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

// Detect login type from zelidauth
const detectLoginType = () => {
  const zelidauth = localStorage.getItem('zelidauth')
  if (!zelidauth) return 'manual'

  try {
    // Check for SSP
    const sspSession = localStorage.getItem('sspWalletSession')
    if (sspSession) return 'ssp'

    // Default to zelcore
    return 'zelcore'
  } catch {
    return 'zelcore'
  }
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
    const specWithContacts = {
      ...originalSpec,
      contacts: uploadedContacts,
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
    registrationMessage.value = 'Waiting for signature from wallet...'

    if (loginType.value === 'ssp') {
      // SSP signing
      const signResult = await signWithSSP(dataToSign.value)
      signature.value = signResult.signature
    } else {
      // Zelcore signing - set up WebSocket first
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

// Retry registration
const retryRegistration = async () => {
  registrationHash.value = null
  registrationError.value = ''
  await startRegistration()
}

// Payment monitoring - checks if app specification is registered on the network
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

  // Poll every 10 seconds - check if app specification exists on the network
  paymentMonitoringInterval.value = setInterval(async () => {
    try {
      const response = await AppsService.getAppSpecifics(appName.value)

      if (response.data.status === 'success' && response.data.data) {
        // App specification is now registered on the network!
        clearInterval(paymentMonitoringInterval.value)
        clearTimeout(paymentMonitoringTimeout.value)
        paymentMonitoringInterval.value = null
        paymentMonitoringTimeout.value = null
        paymentConfirmed.value = true
        paymentProcessing.value = false

        // Refresh user apps to show "My applications" menu item
        await fluxStore.checkUserApps()
      }
    } catch {
      // Silently ignore - app not yet registered
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
  checkoutLoading.value = true
  paymentMethod.value = 'zelcore'

  try {
    const zelidauth = localStorage.getItem('zelidauth')

    // Get payment info
    const response = await AppsService.getAppPaymentInfo(registrationHash.value, zelidauth)

    if (response.data.status === 'error') {
      throw new Error(response.data.data?.message || 'Failed to get payment info')
    }

    const paymentInfo = response.data.data

    // Open Zelcore
    const zelcoreUrl = `zel:?action=pay&coin=flux&address=${paymentInfo.address}&amount=${paymentInfo.amount}&message=${encodeURIComponent('Orbit Pro Plan')}`
    window.location.href = zelcoreUrl

    // Start payment monitoring
    startPaymentMonitoring()
  } catch (error) {
    console.error('Zelcore payment error:', error)
  } finally {
    checkoutLoading.value = false
  }
}

// Initialize SSP payment
const initSSPPay = async () => {
  checkoutLoading.value = true
  paymentMethod.value = 'ssp'

  try {
    const zelidauth = localStorage.getItem('zelidauth')

    // Get payment info
    const response = await AppsService.getAppPaymentInfo(registrationHash.value, zelidauth)

    if (response.data.status === 'error') {
      throw new Error(response.data.data?.message || 'Failed to get payment info')
    }

    const paymentInfo = response.data.data

    // Use SSP wallet - this is handled by the signMessage function
    const sspResult = await fluxStore.signPaymentSSP({
      address: paymentInfo.address,
      amount: paymentInfo.amount,
      message: 'Orbit Pro Plan',
    })

    if (sspResult.status === 'success') {
      // Start payment monitoring
      startPaymentMonitoring()
    } else {
      throw new Error(sspResult.message || 'SSP payment failed')
    }
  } catch (error) {
    console.error('SSP payment error:', error)
  } finally {
    checkoutLoading.value = false
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

// Watch geolocation selections for cascading reset
watch(() => selectedGeo.value.continent, () => {
  selectedGeo.value.country = 'ALL'
  selectedGeo.value.region = 'ALL'
})

watch(() => selectedGeo.value.country, () => {
  selectedGeo.value.region = 'ALL'
})

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
  align-items: center;
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
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-success)) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
}

.orbit-stepper :deep(.v-stepper-header) {
  box-shadow: none;
}

.orbit-stepper :deep(.v-stepper-item) {
  padding: 0.5rem;
}

.step-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
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
  margin-bottom: 1rem;
  font-size: 0.875rem;
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
  background: rgba(var(--v-theme-primary), 0.08);
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
  opacity: 0.7;
}

.orbit-env-example code {
  font-size: 0.75rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
}

/* Shared Features Card */
.shared-features-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08) 0%, rgba(var(--v-theme-success), 0.08) 100%);
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
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

.plan-card.recommended {
  border-color: rgb(var(--v-theme-success));
  box-shadow: 0 8px 32px rgba(var(--v-theme-success), 0.3);
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

.recommended-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgb(var(--v-theme-success)) 0%, rgb(var(--v-theme-primary)) 100%);
  color: white;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-success), 0.4);
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
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.2) 0%, rgba(var(--v-theme-success), 0.1) 100%);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-success), 0.3);
}

.plan-price-badge.disabled {
  background: linear-gradient(135deg, rgba(var(--v-theme-on-surface), 0.1) 0%, rgba(var(--v-theme-on-surface), 0.05) 100%);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
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
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.15) 0%, rgba(var(--v-theme-success), 0.08) 100%);
  border: 1px solid rgba(var(--v-theme-success), 0.3);
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

.review-item.highlight-price {
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 2px solid rgba(var(--v-theme-primary), 0.2);
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
.stepper-actions {
  display: flex;
  align-items: center;
  padding: 1rem;
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
  .orbit-header {
    flex-direction: column;
    padding-top: 2.5rem;
  }

  .orbit-header-content {
    flex-direction: column;
    text-align: center;
  }

  .orbit-header-content .v-icon {
    margin-right: 0 !important;
    margin-bottom: 0.5rem;
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

  .plan-specs,
  .plan-tagline,
  .billing-period {
    padding-left: 0;
  }

  .review-item {
    flex-direction: column;
    gap: 0.25rem;
  }

  .review-value {
    text-align: left;
  }

  .env-var-row {
    flex-wrap: wrap;
  }

  .env-key,
  .env-value {
    flex: 1 1 100%;
  }
}
</style>
