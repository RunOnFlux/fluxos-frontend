<template>
  <div>
    <!-- Page Header -->
    <div class="mb-3">
      <div class="d-flex align-center mb-2">
        <VAvatar color="primary" variant="flat" size="48" class="mr-3">
          <VIcon icon="mdi-cog" size="32" color="white" />
        </VAvatar>
        <div>
          <h2 class="text-h5 font-weight-bold">{{ t('pages.administration.manageFlux.title') }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ t('pages.administration.manageFlux.subtitle') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <VCard class="mb-3" elevation="2">
      <VTabs v-model="currentTab" bg-color="surface" color="primary">
        <VTab value="settings">
          <VIcon icon="mdi-cog" size="22" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">{{ t('pages.administration.manageFlux.tabs.settings') }}</span>
        </VTab>
        <VTab value="logs">
          <VIcon icon="mdi-text-box-multiple" size="22" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">{{ t('pages.administration.manageFlux.tabs.logs') }}</span>
        </VTab>
        <VTab value="daemon">
          <VIcon icon="mdi-server" size="22" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">{{ t('pages.administration.manageFlux.tabs.daemon') }}</span>
        </VTab>
        <VTab value="benchmark">
          <VIcon icon="mdi-speedometer" size="22" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">{{ t('pages.administration.manageFlux.tabs.benchmark') }}</span>
        </VTab>
      </VTabs>
    </VCard>

    <VWindow v-model="currentTab">
      <!-- Settings Tab -->
      <VWindowItem value="settings">
        <!-- System Updates Section -->
        <VCard class="mb-3" elevation="1">
          <VCardTitle class="d-flex align-center pa-4 bg-surface">
            <VAvatar color="primary" variant="flat" size="28" class="mr-2">
              <VIcon icon="mdi-update" size="18" color="white" />
            </VAvatar>
            <span class="text-body-1">{{ t('pages.administration.manageFlux.sections.systemUpdates.title') }}</span>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-3">
            <VCard variant="tonal" color="primary">
              <VCardText class="pa-3">
                <div class="d-flex align-center mb-3">
                  <VAvatar color="primary" variant="flat" size="36" class="mr-2">
                    <VIcon icon="mdi-cloud-sync" size="22" />
                  </VAvatar>
                  <div>
                    <h3 class="text-body-1 mb-1">{{ t('pages.administration.manageFlux.sections.systemUpdates.fluxUpdate.title') }}</h3>
                    <p class="text-body-2 text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.sections.systemUpdates.fluxUpdate.process') }}</p>
                  </div>
                </div>
                <p class="text-body-2 mb-3">
                  {{ t('pages.administration.manageFlux.sections.systemUpdates.fluxUpdate.description') }}
                </p>
                <VBtn
                  block
                  color="primary"
                  variant="flat"
                  size="default"
                  @click="updateFluxDialog = true"
                >
                  <VIcon icon="mdi-download" size="20" class="mr-2" />
                  {{ t('pages.administration.manageFlux.sections.systemUpdates.fluxUpdate.button') }}
                </VBtn>
              </VCardText>
            </VCard>
          </VCardText>
        </VCard>

        <!-- Node Configuration Section -->
        <VCard class="mb-3" elevation="1">
          <VCardTitle class="d-flex align-center pa-4 bg-surface">
            <VAvatar color="primary" variant="flat" size="28" class="mr-2">
              <VIcon icon="mdi-cog-outline" size="18" color="white" />
            </VAvatar>
            <span class="text-body-1">{{ t('pages.administration.manageFlux.sections.nodeConfiguration.title') }}</span>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-3">
            <VRow>
              <!-- Router IP -->
              <VCol cols="12" lg="6">
                <VCard variant="outlined" class="h-100">
                  <VCardText class="pa-3">
                    <div class="d-flex align-center mb-4">
                      <VAvatar color="primary" variant="flat" size="28" class="mr-2">
                        <VIcon icon="mdi-router-wireless" size="18" color="white" />
                      </VAvatar>
                      <div class="flex-grow-1">
                        <h3 class="text-body-1 font-weight-bold">{{ t('pages.administration.manageFlux.sections.nodeConfiguration.routerIp.title') }}</h3>
                        <p class="text-caption text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.sections.nodeConfiguration.routerIp.subtitle') }}</p>
                      </div>
                      <VTooltip location="top">
                        <template #activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-information-outline" size="20" color="grey" />
                        </template>
                        <span>{{ t('pages.administration.manageFlux.sections.nodeConfiguration.routerIp.tooltip') }}</span>
                      </VTooltip>
                    </div>
                    <VTextField
                      v-model="routerIPInput"
                      :label="t('pages.administration.manageFlux.labels.routerIpAddress')"
                      prepend-inner-icon="mdi-ip-network"
                      variant="outlined"
                      density="comfortable"
                      class="mb-3"
                      :hint="t('pages.administration.manageFlux.sections.nodeConfiguration.routerIp.hint')"
                      persistent-hint
                      :placeholder="t('pages.administration.manageFlux.placeholders.routerIpPlaceholder')"
                    />
                    <VBtn
                      block
                      color="info"
                      variant="flat"
                      size="default"
                      @click="adjustRouterIPDialog = true"
                    >
                      <VIcon icon="mdi-check-circle" size="20" class="mr-2" />
                      {{ t('pages.administration.manageFlux.sections.nodeConfiguration.routerIp.button') }}
                    </VBtn>
                  </VCardText>
                </VCard>
              </VCol>

              <!-- API Port -->
              <VCol cols="12" lg="6">
                <VCard variant="outlined" class="h-100">
                  <VCardText class="pa-3">
                    <div class="d-flex align-center mb-4">
                      <VAvatar color="primary" variant="flat" size="28" class="mr-2">
                        <VIcon icon="mdi-ethernet" size="18" color="white" />
                      </VAvatar>
                      <div class="flex-grow-1">
                        <h3 class="text-body-1 font-weight-bold">{{ t('pages.administration.manageFlux.sections.nodeConfiguration.apiPort.title') }}</h3>
                        <p class="text-caption text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.sections.nodeConfiguration.apiPort.subtitle') }}</p>
                      </div>
                      <VTooltip location="top">
                        <template #activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-information-outline" size="20" color="grey" />
                        </template>
                        <span>{{ t('pages.administration.manageFlux.sections.nodeConfiguration.apiPort.tooltip') }}</span>
                      </VTooltip>
                    </div>
                    <VTextField
                      v-model.number="apiPortInput"
                      :label="t('pages.administration.manageFlux.labels.apiPort')"
                      prepend-inner-icon="mdi-ethernet"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                      class="mb-3"
                      :hint="t('pages.administration.manageFlux.sections.nodeConfiguration.apiPort.hint')"
                      persistent-hint
                    />
                    <VBtn
                      block
                      color="secondary"
                      variant="flat"
                      size="default"
                      @click="adjustAPIPortDialog = true"
                    >
                      <VIcon icon="mdi-check-circle" size="20" class="mr-2" />
                      {{ t('pages.administration.manageFlux.sections.nodeConfiguration.apiPort.button') }}
                    </VBtn>
                  </VCardText>
                </VCard>
              </VCol>

              <!-- FluxOS Restart -->
              <VCol cols="12" lg="6">
                <VCard variant="outlined" class="h-100">
                  <VCardText class="pa-3">
                    <div class="d-flex align-center mb-4">
                      <VAvatar color="primary" variant="flat" size="28" class="mr-2">
                        <VIcon icon="mdi-restart" size="18" color="white" />
                      </VAvatar>
                      <div>
                        <h3 class="text-body-1 font-weight-bold">{{ t('pages.administration.manageFlux.sections.nodeConfiguration.restartFluxOs.title') }}</h3>
                        <p class="text-caption text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.sections.nodeConfiguration.restartFluxOs.subtitle') }}</p>
                      </div>
                    </div>
                    <VAlert type="info" variant="tonal" class="mb-3" density="compact">
                      <div class="text-caption">
                        {{ t('pages.administration.manageFlux.sections.nodeConfiguration.restartFluxOs.warning') }}
                      </div>
                    </VAlert>
                    <VBtn
                      block
                      color="error"
                      variant="flat"
                      size="default"
                      @click="restartFluxOSDialog = true"
                    >
                      <VIcon icon="mdi-restart" size="20" class="mr-2" />
                      {{ t('pages.administration.manageFlux.sections.nodeConfiguration.restartFluxOs.button') }}
                    </VBtn>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Security & Access Control Section -->
        <VCard class="mb-3" elevation="1">
          <VCardTitle class="d-flex align-center pa-4 bg-surface">
            <VAvatar color="primary" variant="flat" size="28" class="mr-2">
              <VIcon icon="mdi-shield-lock" size="18" color="white" />
            </VAvatar>
            <span class="text-body-1">{{ t('pages.administration.manageFlux.sections.securityAccess.title') }}</span>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-3">
            <VRow>
              <!-- Blocked Ports -->
              <VCol cols="12" lg="6">
                <VCard variant="outlined" class="h-100">
                  <VCardText class="pa-3">
                    <div class="d-flex align-center mb-4">
                      <VAvatar color="primary" variant="flat" size="28" class="mr-2">
                        <VIcon icon="mdi-shield-lock-outline" size="18" color="white" />
                      </VAvatar>
                      <div class="flex-grow-1">
                        <h3 class="text-body-1 font-weight-bold">{{ t('pages.administration.manageFlux.sections.securityAccess.blockedPorts.title') }}</h3>
                        <p class="text-caption text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.sections.securityAccess.blockedPorts.subtitle') }}</p>
                      </div>
                      <VTooltip location="top">
                        <template #activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-information-outline" size="20" color="grey" />
                        </template>
                        <span>{{ t('pages.administration.manageFlux.sections.securityAccess.blockedPorts.tooltip') }}</span>
                      </VTooltip>
                    </div>
                    <VCombobox
                      v-model="blockedPortsInput"
                      :label="t('pages.administration.manageFlux.labels.blockedPorts')"
                      prepend-inner-icon="mdi-lock"
                      variant="outlined"
                      chips
                      multiple
                      closable-chips
                      class="mb-3"
                      :hint="t('pages.administration.manageFlux.sections.securityAccess.blockedPorts.hint')"
                      persistent-hint
                      :placeholder="t('pages.administration.manageFlux.placeholders.portPlaceholder')"
                    />
                    <VBtn
                      block
                      color="primary"
                      variant="flat"
                      size="default"
                      @click="adjustBlockedPortsDialog = true"
                    >
                      <VIcon icon="mdi-shield-lock" size="20" class="mr-2" />
                      {{ t('pages.administration.manageFlux.sections.securityAccess.blockedPorts.button') }}
                    </VBtn>
                  </VCardText>
                </VCard>
              </VCol>

              <!-- Blocked Repositories -->
              <VCol cols="12" lg="6">
                <VCard variant="outlined" class="h-100">
                  <VCardText class="pa-3">
                    <div class="d-flex align-center mb-4">
                      <VAvatar color="primary" variant="flat" size="28" class="mr-2">
                        <VIcon icon="mdi-docker" size="18" color="white" />
                      </VAvatar>
                      <div class="flex-grow-1">
                        <h3 class="text-body-1 font-weight-bold">{{ t('pages.administration.manageFlux.sections.securityAccess.blockedRepos.title') }}</h3>
                        <p class="text-caption text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.sections.securityAccess.blockedRepos.subtitle') }}</p>
                      </div>
                      <VTooltip location="top">
                        <template #activator="{ props }">
                          <VIcon v-bind="props" icon="mdi-information-outline" size="20" color="grey" />
                        </template>
                        <span>{{ t('pages.administration.manageFlux.sections.securityAccess.blockedRepos.tooltip') }}</span>
                      </VTooltip>
                    </div>
                    <VCombobox
                      v-model="blockedRepositoriesInput"
                      :label="t('pages.administration.manageFlux.labels.blockedRepositories')"
                      prepend-inner-icon="mdi-docker"
                      variant="outlined"
                      chips
                      multiple
                      closable-chips
                      class="mb-3"
                      :hint="t('pages.administration.manageFlux.sections.securityAccess.blockedRepos.hint')"
                      persistent-hint
                      :placeholder="t('pages.administration.manageFlux.placeholders.repositoryPlaceholder')"
                    />
                    <VBtn
                      block
                      color="primary"
                      variant="flat"
                      size="default"
                      @click="adjustBlockedRepositoriesDialog = true"
                    >
                      <VIcon icon="mdi-docker" size="20" class="mr-2" />
                      {{ t('pages.administration.manageFlux.sections.securityAccess.blockedRepos.button') }}
                    </VBtn>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Logs Tab -->
      <VWindowItem value="logs">
        <VCard elevation="1">
          <VCardTitle class="d-flex align-center pa-3 bg-surface">
            <div class="d-flex ga-2">
              <VChip
                :variant="logsTab === 'flux' ? 'flat' : 'outlined'"
                :color="logsTab === 'flux' ? 'info' : 'default'"
                prepend-icon="mdi-text-box-multiple"
                @click="logsTab = 'flux'"
                style="cursor: pointer;"
              >
                {{ t('pages.administration.manageFlux.logs.flux') }}
              </VChip>
              <VChip
                :variant="logsTab === 'daemon' ? 'flat' : 'outlined'"
                :color="logsTab === 'daemon' ? 'success' : 'default'"
                prepend-icon="mdi-server"
                @click="logsTab = 'daemon'"
                style="cursor: pointer;"
              >
                {{ t('pages.administration.manageFlux.logs.daemon') }}
              </VChip>
              <VChip
                :variant="logsTab === 'benchmark' ? 'flat' : 'outlined'"
                :color="logsTab === 'benchmark' ? 'warning' : 'default'"
                prepend-icon="mdi-speedometer"
                @click="logsTab = 'benchmark'"
                style="cursor: pointer;"
              >
                {{ t('pages.administration.manageFlux.logs.benchmark') }}
              </VChip>
            </div>
          </VCardTitle>
          <VDivider />

          <VWindow v-model="logsTab">
            <!-- Flux Logs Tab -->
            <VWindowItem value="flux">
              <VCardTitle class="d-flex align-center pa-3 bg-surface">
                <VSelect
                  v-model="selectedFluxLogType"
                  :items="fluxLogTypeOptions"
                  :label="t('pages.administration.manageFlux.labels.type')"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="max-width: 200px;"
                  @update:model-value="fetchFluxLogs"
                />
                <VSpacer />
                <VBtn
                  size="small"
                  variant="tonal"
                  color="success"
                  prepend-icon="mdi-download"
                  class="mr-2"
                  @click="downloadFullLogFile('flux')"
                >
                  {{ t('pages.administration.manageFlux.logs.download') }}
                </VBtn>
                <VBtn
                  size="small"
                  variant="flat"
                  color="primary"
                  prepend-icon="mdi-refresh"
                  @click="fetchFluxLogs"
                >
                  {{ t('pages.administration.manageFlux.logs.refresh') }}
                </VBtn>
              </VCardTitle>
              <VDivider />
              <VCardText class="pa-0">
                <div v-if="fluxLogsLoading" class="text-center pa-6">
                  <VProgressCircular indeterminate color="primary" />
                  <p class="text-body-2 text-medium-emphasis mt-3 mb-0">{{ t('pages.administration.manageFlux.logs.loading') }}</p>
                </div>
                <div v-else-if="fluxLogs" style="height: 600px;">
                  <VueMonacoEditor
                    v-model:value="fluxLogs"
                    language="plaintext"
                    :theme="editorTheme"
                    :options="{ readOnly: true, automaticLayout: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on', fontSize: 12, disableMonospaceOptimizations: true, fontLigatures: false, find: { addExtraSpaceOnTop: false, autoFindInSelection: 'never', seedSearchStringFromSelection: 'never' } }"
                  />
                </div>
              </VCardText>
            </VWindowItem>

            <!-- Daemon Logs Tab -->
            <VWindowItem value="daemon">
              <VCardTitle class="d-flex align-center pa-3 bg-surface">
                <VSpacer />
                <VBtn
                  size="small"
                  variant="tonal"
                  color="success"
                  prepend-icon="mdi-download"
                  class="mr-2"
                  @click="downloadFullLogFile('daemon')"
                >
                  {{ t('pages.administration.manageFlux.logs.download') }}
                </VBtn>
                <VBtn
                  size="small"
                  variant="flat"
                  color="primary"
                  prepend-icon="mdi-refresh"
                  @click="fetchDaemonLogs"
                >
                  {{ t('pages.administration.manageFlux.logs.refresh') }}
                </VBtn>
              </VCardTitle>
              <VDivider />
              <VCardText class="pa-0">
                <div v-if="daemonLogsLoading" class="text-center pa-6">
                  <VProgressCircular indeterminate color="primary" />
                  <p class="text-body-2 text-medium-emphasis mt-3 mb-0">{{ t('pages.administration.manageFlux.logs.loading') }}</p>
                </div>
                <div v-else-if="daemonLogs" style="height: 600px;">
                  <VueMonacoEditor
                    v-model:value="daemonLogs"
                    language="plaintext"
                    :theme="editorTheme"
                    :options="{ readOnly: true, automaticLayout: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on', fontSize: 12, disableMonospaceOptimizations: true, fontLigatures: false, find: { addExtraSpaceOnTop: false, autoFindInSelection: 'never', seedSearchStringFromSelection: 'never' } }"
                  />
                </div>
              </VCardText>
            </VWindowItem>

            <!-- Benchmark Logs Tab -->
            <VWindowItem value="benchmark">
              <VCardTitle class="d-flex align-center pa-3 bg-surface">
                <VSpacer />
                <VBtn
                  size="small"
                  variant="tonal"
                  color="success"
                  prepend-icon="mdi-download"
                  class="mr-2"
                  @click="downloadFullLogFile('benchmark')"
                >
                  {{ t('pages.administration.manageFlux.logs.download') }}
                </VBtn>
                <VBtn
                  size="small"
                  variant="flat"
                  color="primary"
                  prepend-icon="mdi-refresh"
                  @click="fetchBenchmarkLogs"
                >
                  {{ t('pages.administration.manageFlux.logs.refresh') }}
                </VBtn>
              </VCardTitle>
              <VDivider />
              <VCardText class="pa-0">
                <div v-if="benchmarkLogsLoading" class="text-center pa-6">
                  <VProgressCircular indeterminate color="primary" />
                  <p class="text-body-2 text-medium-emphasis mt-3 mb-0">{{ t('pages.administration.manageFlux.logs.loading') }}</p>
                </div>
                <div v-else-if="benchmarkLogs" style="height: 600px;">
                  <VueMonacoEditor
                    v-model:value="benchmarkLogs"
                    language="plaintext"
                    :theme="editorTheme"
                    :options="{ readOnly: true, automaticLayout: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on', fontSize: 12, find: { addExtraSpaceOnTop: false, autoFindInSelection: 'never', seedSearchStringFromSelection: 'never' } }"
                  />
                </div>
              </VCardText>
            </VWindowItem>
          </VWindow>
        </VCard>
      </VWindowItem>

      <!-- Daemon Tab -->
      <VWindowItem value="daemon">
        <VCard elevation="1">
          <VCardTitle class="d-flex align-center pa-4 bg-surface">
            <VIcon icon="mdi-server" size="24" color="grey" class="mr-2" />
            <span class="text-h6">{{ t('pages.administration.manageFlux.daemon.control.title') }}</span>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-3">
            <VRow>
              <VCol cols="12" md="4">
                <VCard variant="outlined" class="h-100">
                  <VCardText class="pa-3">
                    <div class="d-flex align-center mb-3">
                      <VAvatar color="success" variant="tonal" size="36" class="mr-2">
                        <VIcon icon="mdi-play" size="22" />
                      </VAvatar>
                      <div>
                        <h3 class="text-body-1 font-weight-bold">{{ t('pages.administration.manageFlux.daemon.control.start.title') }}</h3>
                        <p class="text-caption text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.daemon.control.start.subtitle') }}</p>
                      </div>
                    </div>
                    <VBtn
                      block
                      color="success"
                      variant="flat"
                      size="default"
                      @click="startDaemonDialog = true"
                    >
                      <VIcon icon="mdi-play" size="20" class="mr-2" />
                      {{ t('pages.administration.manageFlux.daemon.control.start.button') }}
                    </VBtn>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol cols="12" md="4">
                <VCard variant="outlined" class="h-100">
                  <VCardText class="pa-3">
                    <div class="d-flex align-center mb-3">
                      <VAvatar color="warning" variant="tonal" size="36" class="mr-2">
                        <VIcon icon="mdi-restart" size="22" />
                      </VAvatar>
                      <div>
                        <h3 class="text-body-1 font-weight-bold">{{ t('pages.administration.manageFlux.daemon.control.restart.title') }}</h3>
                        <p class="text-caption text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.daemon.control.restart.subtitle') }}</p>
                      </div>
                    </div>
                    <VBtn
                      block
                      color="warning"
                      variant="flat"
                      size="default"
                      @click="restartDaemonDialog = true"
                    >
                      <VIcon icon="mdi-restart" size="20" class="mr-2" />
                      {{ t('pages.administration.manageFlux.daemon.control.restart.button') }}
                    </VBtn>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol cols="12" md="4">
                <VCard variant="outlined" class="h-100">
                  <VCardText class="pa-3">
                    <div class="d-flex align-center mb-3">
                      <VAvatar color="error" variant="tonal" size="36" class="mr-2">
                        <VIcon icon="mdi-stop" size="22" />
                      </VAvatar>
                      <div>
                        <h3 class="text-body-1 font-weight-bold">{{ t('pages.administration.manageFlux.daemon.control.stop.title') }}</h3>
                        <p class="text-caption text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.daemon.control.stop.subtitle') }}</p>
                      </div>
                    </div>
                    <VBtn
                      block
                      color="error"
                      variant="flat"
                      size="default"
                      @click="stopDaemonDialog = true"
                    >
                      <VIcon icon="mdi-stop" size="20" class="mr-2" />
                      {{ t('pages.administration.manageFlux.daemon.control.stop.button') }}
                    </VBtn>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <VCard elevation="1" class="mt-3">
          <VCardTitle class="d-flex align-center pa-3 bg-surface">
            <VIcon icon="mdi-information-outline" size="24" color="grey" class="mr-2" />
            <span class="text-h6">{{ t('pages.administration.manageFlux.daemon.info.title') }}</span>
            <VSpacer />
            <VBtn
              size="small"
              variant="flat"
              color="primary"
              prepend-icon="mdi-refresh"
              @click="fetchDaemonInfo"
            >
              {{ t('pages.administration.manageFlux.daemon.info.refresh') }}
            </VBtn>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-3">
            <div v-if="daemonInfoLoading" class="text-center pa-6">
              <VProgressCircular indeterminate color="primary" />
              <p class="text-body-2 text-medium-emphasis mt-3 mb-0">{{ t('pages.administration.manageFlux.daemon.info.loadingMessage') }}</p>
            </div>
            <div v-else-if="daemonInfoParsed">
              <!-- Version Information -->
              <VCard variant="outlined" class="mb-2">
                <VCardTitle class="text-body-2 pa-2 bg-surface">
                  <VAvatar color="info" variant="flat" size="32" class="mr-2">
                    <VIcon icon="mdi-information" size="18" color="white" />
                  </VAvatar>
                  {{ t('pages.administration.manageFlux.daemon.info.versionInfo') }}
                </VCardTitle>
                <VDivider />
                <VCardText class="pa-2">
                  <div class="d-flex flex-wrap ga-2">
                    <VChip v-if="daemonInfoParsed.version" prepend-icon="mdi-numeric" size="small" color="info" variant="tonal">
                      <span class="font-weight-medium">Version: {{ formatValue(daemonInfoParsed.version) }}</span>
                    </VChip>
                    <VChip v-if="daemonInfoParsed.protocolversion" prepend-icon="mdi-shield-check" size="small" color="success" variant="tonal">
                      <span class="font-weight-medium">Protocol: {{ formatValue(daemonInfoParsed.protocolversion) }}</span>
                    </VChip>
                    <VChip v-if="daemonInfoParsed.walletversion" prepend-icon="mdi-wallet" size="small" color="teal" variant="tonal">
                      <span class="font-weight-medium">Wallet: {{ formatValue(daemonInfoParsed.walletversion) }}</span>
                    </VChip>
                  </div>
                </VCardText>
              </VCard>

              <!-- Network Status -->
              <VCard variant="outlined" class="mb-2">
                <VCardTitle class="text-body-2 pa-2 bg-surface">
                  <VAvatar color="success" variant="flat" size="32" class="mr-2">
                    <VIcon icon="mdi-lan" size="18" color="white" />
                  </VAvatar>
                  {{ t('pages.administration.manageFlux.daemon.info.networkStatus') }}
                </VCardTitle>
                <VDivider />
                <VCardText class="pa-2">
                  <div class="d-flex flex-wrap ga-2">
                    <VChip v-if="daemonInfoParsed.connections" prepend-icon="mdi-lan" size="small" color="success" variant="tonal">
                      <span class="font-weight-medium">Connections: {{ formatValue(daemonInfoParsed.connections) }}</span>
                    </VChip>
                    <VChip v-if="daemonInfoParsed.blocks" prepend-icon="mdi-cube-outline" size="small" color="info" variant="tonal">
                      <span class="font-weight-medium">Blocks: {{ formatValue(daemonInfoParsed.blocks) }}</span>
                    </VChip>
                    <VChip v-if="daemonInfoParsed.difficulty" prepend-icon="mdi-chart-line" size="small" color="cyan" variant="tonal">
                      <span class="font-weight-medium">Difficulty: {{ formatValue(daemonInfoParsed.difficulty) }}</span>
                    </VChip>
                    <VChip v-if="daemonInfoParsed.timeoffset !== undefined" prepend-icon="mdi-clock-outline" size="small" color="secondary" variant="tonal">
                      <span class="font-weight-medium">Time Offset: {{ formatValue(daemonInfoParsed.timeoffset) }}</span>
                    </VChip>
                    <VChip v-if="daemonInfoParsed.testnet !== undefined" prepend-icon="mdi-test-tube" size="small" color="teal" variant="tonal">
                      <span class="font-weight-medium">Testnet: {{ formatValue(daemonInfoParsed.testnet) }}</span>
                    </VChip>
                  </div>
                </VCardText>
              </VCard>

              <!-- Wallet Information -->
              <VCard variant="outlined" class="mb-2">
                <VCardTitle class="text-body-2 pa-2 bg-surface">
                  <VAvatar color="teal" variant="flat" size="32" class="mr-2">
                    <VIcon icon="mdi-wallet" size="18" color="white" />
                  </VAvatar>
                  {{ t('pages.administration.manageFlux.daemon.info.walletInfo') }}
                </VCardTitle>
                <VDivider />
                <VCardText class="pa-2">
                  <div class="d-flex flex-wrap ga-2">
                    <VChip v-if="daemonInfoParsed.balance !== undefined" prepend-icon="mdi-cash" size="small" color="success" variant="tonal">
                      <span class="font-weight-medium">Balance: {{ formatValue(daemonInfoParsed.balance) }}</span>
                    </VChip>
                    <VChip v-if="daemonInfoParsed.keypoolsize" prepend-icon="mdi-key-chain" size="small" color="info" variant="tonal">
                      <span class="font-weight-medium">Key Pool Size: {{ formatValue(daemonInfoParsed.keypoolsize) }}</span>
                    </VChip>
                    <VChip v-if="daemonInfoParsed.keypoololdest" prepend-icon="mdi-key" size="small" color="cyan" variant="tonal">
                      <span class="font-weight-medium">Key Pool Oldest: {{ formatValue(daemonInfoParsed.keypoololdest) }}</span>
                    </VChip>
                    <VChip v-if="daemonInfoParsed.paytxfee !== undefined" prepend-icon="mdi-currency-usd" size="small" color="teal" variant="tonal">
                      <span class="font-weight-medium">Pay TX Fee: {{ formatValue(daemonInfoParsed.paytxfee) }}</span>
                    </VChip>
                    <VChip v-if="daemonInfoParsed.relayfee !== undefined" prepend-icon="mdi-swap-horizontal" size="small" color="secondary" variant="tonal">
                      <span class="font-weight-medium">Relay Fee: {{ formatValue(daemonInfoParsed.relayfee) }}</span>
                    </VChip>
                  </div>
                </VCardText>
              </VCard>

              <!-- Error Status -->
              <VCard v-if="daemonInfoParsed.errors !== undefined" variant="outlined" class="mb-2">
                <VCardTitle class="text-body-2 pa-2 bg-surface">
                  <VAvatar :color="daemonInfoParsed.errors ? 'error' : 'success'" variant="flat" size="32" class="mr-2">
                    <VIcon :icon="daemonInfoParsed.errors ? 'mdi-alert-circle' : 'mdi-check-circle'" size="18" color="white" />
                  </VAvatar>
                  {{ t('pages.administration.manageFlux.daemon.info.errorStatus') }}
                </VCardTitle>
                <VDivider />
                <VCardText class="pa-2">
                  <VAlert v-if="daemonInfoParsed.errors" type="error" variant="tonal" density="comfortable">
                    {{ daemonInfoParsed.errors }}
                  </VAlert>
                  <VAlert v-else type="success" variant="tonal" density="comfortable">
                    {{ t('pages.administration.manageFlux.daemon.info.noErrors') }}
                  </VAlert>
                </VCardText>
              </VCard>

            </div>
            <div v-else class="text-center pa-6">
              <VIcon icon="mdi-information-outline" size="48" color="grey" class="mb-3" />
              <p class="text-body-2 text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.daemon.info.noInfoLoaded') }}</p>
            </div>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Benchmark Tab -->
      <VWindowItem value="benchmark">
        <VCard elevation="1">
          <VCardTitle class="d-flex align-center pa-4 bg-surface">
            <VIcon icon="mdi-speedometer" size="24" color="grey" class="mr-2" />
            <span class="text-h6">{{ t('pages.administration.manageFlux.benchmark.control.title') }}</span>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-3">
            <VRow>
              <VCol cols="12" md="4">
                <VCard variant="outlined" class="h-100">
                  <VCardText class="pa-3">
                    <div class="d-flex align-center mb-3">
                      <VAvatar color="success" variant="tonal" size="36" class="mr-2">
                        <VIcon icon="mdi-play" size="22" />
                      </VAvatar>
                      <div>
                        <h3 class="text-body-1 font-weight-bold">{{ t('pages.administration.manageFlux.benchmark.control.start.title') }}</h3>
                        <p class="text-caption text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.benchmark.control.start.subtitle') }}</p>
                      </div>
                    </div>
                    <VBtn
                      block
                      color="success"
                      variant="flat"
                      size="default"
                      @click="startBenchmarkDialog = true"
                    >
                      <VIcon icon="mdi-play" size="20" class="mr-2" />
                      {{ t('pages.administration.manageFlux.benchmark.control.start.button') }}
                    </VBtn>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol cols="12" md="4">
                <VCard variant="outlined" class="h-100">
                  <VCardText class="pa-3">
                    <div class="d-flex align-center mb-3">
                      <VAvatar color="warning" variant="tonal" size="36" class="mr-2">
                        <VIcon icon="mdi-restart" size="22" />
                      </VAvatar>
                      <div>
                        <h3 class="text-body-1 font-weight-bold">{{ t('pages.administration.manageFlux.benchmark.control.restart.title') }}</h3>
                        <p class="text-caption text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.benchmark.control.restart.subtitle') }}</p>
                      </div>
                    </div>
                    <VBtn
                      block
                      color="warning"
                      variant="flat"
                      size="default"
                      @click="restartBenchmarkDialog = true"
                    >
                      <VIcon icon="mdi-restart" size="20" class="mr-2" />
                      {{ t('pages.administration.manageFlux.benchmark.control.restart.button') }}
                    </VBtn>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol cols="12" md="4">
                <VCard variant="outlined" class="h-100">
                  <VCardText class="pa-3">
                    <div class="d-flex align-center mb-3">
                      <VAvatar color="error" variant="tonal" size="36" class="mr-2">
                        <VIcon icon="mdi-stop" size="22" />
                      </VAvatar>
                      <div>
                        <h3 class="text-body-1 font-weight-bold">{{ t('pages.administration.manageFlux.benchmark.control.stop.title') }}</h3>
                        <p class="text-caption text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.benchmark.control.stop.subtitle') }}</p>
                      </div>
                    </div>
                    <VBtn
                      block
                      color="error"
                      variant="flat"
                      size="default"
                      @click="stopBenchmarkDialog = true"
                    >
                      <VIcon icon="mdi-stop" size="20" class="mr-2" />
                      {{ t('pages.administration.manageFlux.benchmark.control.stop.button') }}
                    </VBtn>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <VCard elevation="1" class="mt-3">
          <VCardTitle class="d-flex align-center pa-3 bg-surface">
            <VIcon icon="mdi-chart-box-outline" size="24" color="grey" class="mr-2" />
            <span class="text-h6">{{ t('pages.administration.manageFlux.benchmark.info.title') }}</span>
            <VSpacer />
            <VBtn
              size="small"
              variant="flat"
              color="primary"
              prepend-icon="mdi-refresh"
              @click="fetchBenchmarkInfo"
            >
              {{ t('pages.administration.manageFlux.benchmark.info.refresh') }}
            </VBtn>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-3">
            <div v-if="benchmarkInfoLoading" class="text-center pa-6">
              <VProgressCircular indeterminate color="primary" />
              <p class="text-body-2 text-medium-emphasis mt-3 mb-0">{{ t('pages.administration.manageFlux.benchmark.info.loadingMessage') }}</p>
            </div>
            <div v-else-if="benchmarkInfoParsed">
              <!-- Status Badge -->
              <VCard v-if="benchmarkInfoParsed.status" variant="tonal" :color="getStatusColor(benchmarkInfoParsed.status)" class="mb-2">
                <VCardText class="pa-2">
                  <div class="d-flex align-center">
                    <VAvatar :color="getStatusColor(benchmarkInfoParsed.status)" variant="flat" size="36" class="mr-2">
                      <VIcon :icon="benchmarkInfoParsed.status === 'failed' || benchmarkInfoParsed.status === 'running' ? 'mdi-alert-circle' : 'mdi-server-network'" size="20" color="white" />
                    </VAvatar>
                    <div>
                      <VChip :color="benchmarkInfoParsed.status === 'failed' ? 'error' : getStatusColor(benchmarkInfoParsed.status)" size="small">
                        {{ benchmarkInfoParsed.status.toUpperCase() }}
                      </VChip>
                    </div>
                    <VSpacer />
                    <VChip v-if="benchmarkInfoParsed.thunder" color="amber" variant="tonal" size="small" prepend-icon="mdi-weather-lightning">
                      {{ t('pages.administration.manageFlux.benchmark.info.thunder') }}
                    </VChip>
                  </div>
                </VCardText>
              </VCard>

              <!-- Running Warning -->
              <VAlert v-if="benchmarkInfoParsed.status === 'running'" type="warning" variant="tonal" density="compact" class="mb-2" border="start">
                {{ t('pages.administration.manageFlux.benchmark.info.runningWarning') }}
              </VAlert>

              <!-- Hardware Specs -->
              <VCard variant="outlined" class="mb-2">
                <VCardTitle class="text-body-2 pa-2 bg-surface">
                  <VAvatar color="info" variant="flat" size="32" class="mr-2">
                    <VIcon icon="mdi-chip" size="18" color="white" />
                  </VAvatar>
                  {{ t('pages.administration.manageFlux.benchmark.info.hardwareSpecs') }}
                </VCardTitle>
                <VDivider />
                <VCardText class="pa-2">
                  <div class="d-flex flex-wrap ga-2">
                    <VChip prepend-icon="mdi-memory" size="small" color="info" variant="tonal">
                      <span class="font-weight-medium">{{ benchmarkInfoParsed.ram }} GB RAM</span>
                    </VChip>
                    <VChip prepend-icon="mdi-cpu-64-bit" size="small" color="success" variant="tonal">
                      <span class="font-weight-medium">{{ benchmarkInfoParsed.cores }} vCores</span>
                    </VChip>
                    <VChip prepend-icon="mdi-chart-pie" size="small" color="teal" variant="tonal">
                      <span class="font-weight-medium">{{ benchmarkInfoParsed.totalstorage }} GB</span>
                    </VChip>
                    <VChip v-if="benchmarkInfoParsed.ssd" prepend-icon="mdi-harddisk" size="small" color="cyan" variant="tonal">
                      <span class="font-weight-medium">SSD: {{ benchmarkInfoParsed.ssd }} GB</span>
                    </VChip>
                    <VChip v-if="benchmarkInfoParsed.hdd" prepend-icon="mdi-harddisk-plus" size="small" color="secondary" variant="tonal">
                      <span class="font-weight-medium">HDD: {{ benchmarkInfoParsed.hdd }} GB</span>
                    </VChip>
                  </div>
                </VCardText>
              </VCard>

              <!-- Performance Metrics -->
              <VCard variant="outlined" class="mb-2">
                <VCardTitle class="text-body-2 pa-2 bg-surface">
                  <VAvatar color="warning" variant="flat" size="32" class="mr-2">
                    <VIcon icon="mdi-speedometer" size="18" color="white" />
                  </VAvatar>
                  {{ t('pages.administration.manageFlux.benchmark.info.performanceMetrics') }}
                </VCardTitle>
                <VDivider />
                <VCardText class="pa-2">
                  <div class="d-flex flex-wrap ga-2">
                    <VChip prepend-icon="mdi-lightning-bolt" size="small" color="amber" variant="tonal">
                      <span class="font-weight-medium">CPU: {{ benchmarkInfoParsed.eps?.toFixed(2) }} EPS</span>
                    </VChip>
                    <VChip prepend-icon="mdi-speedometer" size="small" color="deep-orange" variant="tonal">
                      <span class="font-weight-medium">DD Write: {{ benchmarkInfoParsed.ddwrite?.toFixed(2) }} MB/s</span>
                    </VChip>
                  </div>
                </VCardText>
              </VCard>

              <!-- Network Speed -->
              <VCard variant="outlined" class="mb-2">
                <VCardTitle class="text-body-2 pa-2 bg-surface">
                  <VAvatar color="success" variant="flat" size="32" class="mr-2">
                    <VIcon icon="mdi-download-network" size="18" color="white" />
                  </VAvatar>
                  {{ t('pages.administration.manageFlux.benchmark.info.networkSpeed') }}
                </VCardTitle>
                <VDivider />
                <VCardText class="pa-2">
                  <div class="d-flex flex-wrap ga-2">
                    <VChip prepend-icon="mdi-arrow-down-bold" size="small" color="success" variant="tonal">
                      <span class="font-weight-medium">{{ benchmarkInfoParsed.download_speed?.toFixed(2) }} Mbps</span>
                    </VChip>
                    <VChip prepend-icon="mdi-arrow-up-bold" size="small" color="info" variant="tonal">
                      <span class="font-weight-medium">{{ benchmarkInfoParsed.upload_speed?.toFixed(2) }} Mbps</span>
                    </VChip>
                    <VChip prepend-icon="mdi-clock-outline" size="small" color="warning" variant="tonal">
                      <span class="font-weight-medium">Ping: {{ benchmarkInfoParsed.ping }} ms</span>
                    </VChip>
                  </div>
                </VCardText>
              </VCard>

              <!-- System Info -->
              <VCard variant="outlined">
                <VCardTitle class="text-body-2 pa-2 bg-surface">
                  <VAvatar color="secondary" variant="flat" size="32" class="mr-2">
                    <VIcon icon="mdi-information-outline" size="18" color="white" />
                  </VAvatar>
                  {{ t('pages.administration.manageFlux.benchmark.info.systemInfo') }}
                </VCardTitle>
                <VDivider />
                <VCardText class="pa-2">
                  <div class="d-flex flex-wrap ga-2">
                    <VChip prepend-icon="mdi-ip" size="small" color="secondary" variant="tonal">
                      <span class="font-weight-medium">{{ benchmarkInfoParsed.ipaddress }}</span>
                    </VChip>
                    <VChip prepend-icon="mdi-cpu-64-bit" size="small" color="secondary" variant="tonal">
                      <span class="font-weight-medium">{{ benchmarkInfoParsed.architecture }}</span>
                    </VChip>
                    <VChip :prepend-icon="benchmarkInfoParsed.systemsecure ? 'mdi-shield-check' : 'mdi-shield-off'" size="small" :color="benchmarkInfoParsed.systemsecure ? 'success' : 'error'" variant="tonal">
                      <span class="font-weight-medium">{{ benchmarkInfoParsed.systemsecure ? 'Secure' : 'Not Secure' }}</span>
                    </VChip>
                    <VChip v-if="benchmarkInfoParsed.bench_version" prepend-icon="mdi-tag-outline" size="small" color="info" variant="tonal">
                      <span class="font-weight-medium">Bench: {{ benchmarkInfoParsed.bench_version }}</span>
                    </VChip>
                    <VChip v-if="benchmarkInfoParsed.speed_version" prepend-icon="mdi-speedometer" size="small" color="success" variant="tonal">
                      <span class="font-weight-medium">Speed: {{ benchmarkInfoParsed.speed_version }}</span>
                    </VChip>
                    <VChip v-if="benchmarkInfoParsed.time" prepend-icon="mdi-clock-outline" size="small" color="warning" variant="tonal">
                      <span class="font-weight-medium">{{ formatTimestamp(benchmarkInfoParsed.time) }}</span>
                    </VChip>
                  </div>
                </VCardText>
              </VCard>

              <!-- Error Display -->
              <VAlert v-if="benchmarkInfoParsed.error" type="error" variant="tonal" density="compact" class="mt-2">
                {{ benchmarkInfoParsed.error }}
              </VAlert>
            </div>
            <div v-else class="text-center pa-6">
              <VIcon icon="mdi-chart-box-outline" size="48" color="grey" class="mb-3" />
              <p class="text-body-2 text-medium-emphasis mb-0">{{ t('pages.administration.manageFlux.benchmark.info.noInfoLoaded') }}</p>
            </div>
          </VCardText>
        </VCard>
      </VWindowItem>

    </VWindow>

    <!-- Confirmation Dialogs -->
    <VDialog v-model="updateFluxDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-3 bg-primary">
          <VIcon icon="mdi-cloud-sync" size="28" color="white" class="mr-2" />
          <span class="text-white">{{ t('pages.administration.manageFlux.dialogs.updateFlux.title') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          <VAlert type="info" variant="tonal" class="mb-2">
            {{ t('pages.administration.manageFlux.dialogs.updateFlux.message') }}
          </VAlert>
          {{ t('pages.administration.manageFlux.dialogs.confirmProceed') }}
        </VCardText>
        <VCardActions class="pa-3 pt-0">
          <VSpacer />
          <VBtn color="error" variant="flat" size="small" @click="updateFluxDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="primary" variant="flat" size="small" @click="updateFlux">{{ t('pages.administration.manageFlux.dialogs.updateFlux.button') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="adjustRouterIPDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-3 bg-primary">
          <VIcon icon="mdi-router-wireless" size="28" color="white" class="mr-2" />
          <span class="text-white">{{ t('pages.administration.manageFlux.dialogs.updateRouterIp.title') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          {{ t('pages.administration.manageFlux.dialogs.updateRouterIp.confirm') }}
        </VCardText>
        <VCardActions class="pa-3 pt-0">
          <VSpacer />
          <VBtn color="error" variant="flat" size="small" @click="adjustRouterIPDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="primary" variant="flat" size="small" @click="adjustRouterIP">{{ t('pages.administration.manageFlux.dialogs.update') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="adjustBlockedPortsDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-3 bg-primary">
          <VIcon icon="mdi-shield-lock-outline" size="28" color="white" class="mr-2" />
          <span class="text-white">{{ t('pages.administration.manageFlux.dialogs.updateBlockedPorts.title') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          {{ t('pages.administration.manageFlux.dialogs.updateBlockedPorts.message') }}
        </VCardText>
        <VCardActions class="pa-3 pt-0">
          <VSpacer />
          <VBtn color="error" variant="flat" size="small" @click="adjustBlockedPortsDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="primary" variant="flat" size="small" @click="adjustBlockedPorts">{{ t('pages.administration.manageFlux.dialogs.update') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="adjustAPIPortDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-3 bg-primary">
          <VIcon icon="mdi-ethernet" size="28" color="white" class="mr-2" />
          <span class="text-white">{{ t('pages.administration.manageFlux.dialogs.updateApiPort.title') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          {{ t('pages.administration.manageFlux.dialogs.updateApiPort.message') }}
        </VCardText>
        <VCardActions class="pa-3 pt-0">
          <VSpacer />
          <VBtn color="error" variant="flat" size="small" @click="adjustAPIPortDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="primary" variant="flat" size="small" @click="adjustAPIPort">{{ t('pages.administration.manageFlux.dialogs.update') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="adjustBlockedRepositoriesDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-3 bg-primary">
          <VIcon icon="mdi-docker" size="28" color="white" class="mr-2" />
          <span class="text-white">{{ t('pages.administration.manageFlux.dialogs.updateBlockedRepos.title') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          {{ t('pages.administration.manageFlux.dialogs.updateBlockedRepos.message') }}
        </VCardText>
        <VCardActions class="pa-3 pt-0">
          <VSpacer />
          <VBtn color="error" variant="flat" size="small" @click="adjustBlockedRepositoriesDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="primary" variant="flat" size="small" @click="adjustBlockedRepositories">{{ t('pages.administration.manageFlux.dialogs.update') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="restartFluxOSDialog" max-width="550">
      <VCard>
        <VCardTitle class="d-flex align-center pa-3 bg-primary">
          <VIcon icon="mdi-restart" size="28" color="white" class="mr-2" />
          <span class="text-white">{{ t('pages.administration.manageFlux.dialogs.restartFluxOs.title') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          <VAlert type="error" variant="tonal" class="mb-2">
            {{ t('pages.administration.manageFlux.dialogs.restartFluxOs.warning') }}
          </VAlert>
          {{ t('pages.administration.manageFlux.dialogs.confirmProceed') }}
        </VCardText>
        <VCardActions class="pa-3 pt-0">
          <VSpacer />
          <VBtn color="error" variant="flat" size="small" @click="restartFluxOSDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="primary" variant="flat" size="small" @click="restartFluxOS">{{ t('pages.administration.manageFlux.dialogs.restart') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Update Progress Dialog -->
    <VDialog v-model="updateProgressDialog" persistent max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-4">
          <VIcon icon="mdi-cloud-download" color="primary" class="mr-2" />
          {{ t('pages.administration.manageFlux.dialogs.updateProgress.title') }}
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          <div class="text-center mb-4">
            <VProgressCircular
              :model-value="updateProgress"
              :size="120"
              :width="12"
              color="primary"
            >
              <span class="text-h5 font-weight-bold">{{ updateProgress }}%</span>
            </VProgressCircular>
          </div>
          <VProgressLinear
            :model-value="updateProgress"
            color="primary"
            height="8"
            rounded
            striped
          />
          <p class="text-center text-body-2 text-medium-emphasis mt-4 mb-0">
            {{ t('pages.administration.manageFlux.dialogs.updateProgress.message') }}
          </p>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Daemon Control Dialogs -->
    <VDialog v-model="startDaemonDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-4">
          <VIcon icon="mdi-play" color="success" class="mr-2" />
          {{ t('pages.administration.manageFlux.dialogs.startDaemon.title') }}
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          {{ t('pages.administration.manageFlux.dialogs.startDaemon.confirm') }}
        </VCardText>
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn variant="text" @click="startDaemonDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="success" variant="flat" size="default" @click="startDaemon">{{ t('pages.administration.manageFlux.dialogs.start') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="restartDaemonDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-4">
          <VIcon icon="mdi-restart" color="warning" class="mr-2" />
          {{ t('pages.administration.manageFlux.dialogs.restartDaemon.title') }}
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          {{ t('pages.administration.manageFlux.dialogs.restartDaemon.confirm') }}
        </VCardText>
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn variant="text" @click="restartDaemonDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="warning" variant="flat" size="default" @click="restartDaemon">{{ t('pages.administration.manageFlux.dialogs.restart') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="stopDaemonDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-4">
          <VIcon icon="mdi-stop" color="error" class="mr-2" />
          {{ t('pages.administration.manageFlux.dialogs.stopDaemon.title') }}
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          <VAlert type="warning" variant="tonal" class="mb-2">
            {{ t('pages.administration.manageFlux.dialogs.stopDaemon.warning') }}
          </VAlert>
          {{ t('pages.administration.manageFlux.dialogs.confirmProceed') }}
        </VCardText>
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn variant="text" @click="stopDaemonDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="error" variant="flat" size="default" @click="stopDaemon">{{ t('pages.administration.manageFlux.dialogs.stop') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Benchmark Control Dialogs -->
    <VDialog v-model="startBenchmarkDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-4">
          <VIcon icon="mdi-play" color="success" class="mr-2" />
          {{ t('pages.administration.manageFlux.dialogs.startBenchmark.title') }}
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          {{ t('pages.administration.manageFlux.dialogs.startBenchmark.confirm') }}
        </VCardText>
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn variant="text" @click="startBenchmarkDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="success" variant="flat" size="default" @click="startBenchmark">{{ t('pages.administration.manageFlux.dialogs.start') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="restartBenchmarkDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-4">
          <VIcon icon="mdi-restart" color="warning" class="mr-2" />
          {{ t('pages.administration.manageFlux.dialogs.restartBenchmark.title') }}
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          {{ t('pages.administration.manageFlux.dialogs.restartBenchmark.confirm') }}
        </VCardText>
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn variant="text" @click="restartBenchmarkDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="warning" variant="flat" size="default" @click="restartBenchmark">{{ t('pages.administration.manageFlux.dialogs.restart') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="stopBenchmarkDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center pa-4">
          <VIcon icon="mdi-stop" color="error" class="mr-2" />
          {{ t('pages.administration.manageFlux.dialogs.stopBenchmark.title') }}
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          <VAlert type="warning" variant="tonal" class="mb-2">
            {{ t('pages.administration.manageFlux.dialogs.stopBenchmark.warning') }}
          </VAlert>
          {{ t('pages.administration.manageFlux.dialogs.confirmProceed') }}
        </VCardText>
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn variant="text" @click="stopBenchmarkDialog = false">{{ t('pages.administration.manageFlux.dialogs.cancel') }}</VBtn>
          <VBtn color="error" variant="flat" size="default" @click="stopBenchmark">{{ t('pages.administration.manageFlux.dialogs.stop') }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Download Progress Dialog -->
    <VDialog v-model="downloadDialog" max-width="440" persistent>
      <VCard>
        <VCardTitle class="d-flex align-center pa-3 bg-primary">
          <VIcon
            icon="mdi-file-search"
            color="white"
            size="28"
            class="mr-3"
          />
          <span class="text-white">{{ downloadProgress === 100 ? t('pages.administration.manageFlux.dialogs.downloadProgress.complete') : t('pages.administration.manageFlux.dialogs.downloadProgress.downloading') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-4 pa-sm-5">
          <template v-if="downloadProgress < 100">
            <div class="text-center mb-4">
              <VAvatar color="info" size="80" variant="tonal" class="download-progress-avatar">
                <VIcon icon="mdi-cloud-download" size="48" />
              </VAvatar>
            </div>

            <VCard variant="outlined" class="mb-4">
              <VCardText class="pa-3 d-flex justify-center">
                <VChip
                  variant="tonal"
                  color="info"
                  size="default"
                  prepend-icon="mdi-file-document"
                  style="max-width: 100%; overflow: hidden;"
                >
                  <span class="text-truncate" style="display: block;">{{ downloadFileName }}</span>
                </VChip>
              </VCardText>
            </VCard>

            <div v-if="downloadSpeed > 0" class="mb-3 d-flex justify-center">
              <VChip variant="flat" color="primary" size="small" prepend-icon="mdi-speedometer">
                {{ formatFileSize(downloadSpeed) }}/s
              </VChip>
            </div>

            <VProgressLinear
              :model-value="downloadProgress"
              color="info"
              height="6"
              rounded
              :indeterminate="downloadIndeterminate"
              class="mb-2"
            />
            <div class="d-flex justify-space-between text-caption text-medium-emphasis">
              <span v-if="!downloadIndeterminate">{{ downloadProgress }}%</span>
              <span v-else>{{ t('pages.administration.manageFlux.dialogs.downloadProgress.downloading') }}</span>
              <span>{{ formatFileSize(downloadedBytes) }}<template v-if="downloadSize > 0"> / {{ formatFileSize(downloadSize) }}</template></span>
            </div>
          </template>

          <template v-else>
            <div class="text-center mb-4">
              <VAvatar color="success" size="80" variant="tonal" class="download-complete-icon">
                <VIcon icon="mdi-file-document-outline" size="48" />
              </VAvatar>
            </div>

            <VCard variant="outlined" class="mb-3">
              <VCardText class="pa-3 d-flex justify-center">
                <VChip
                  variant="tonal"
                  color="info"
                  size="default"
                  prepend-icon="mdi-file-document"
                  style="max-width: 100%; overflow: hidden;"
                >
                  <span class="text-truncate" style="display: block;">{{ downloadFileName }}</span>
                </VChip>
              </VCardText>
            </VCard>

            <VCard variant="outlined" class="mb-4">
              <VCardText class="pa-3">
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center">
                    <VIcon icon="mdi-database" size="20" class="mr-2" />
                    <span class="text-body-2">{{ t('pages.administration.manageFlux.dialogs.downloadProgress.fileSize') }}</span>
                  </div>
                  <VChip variant="tonal" color="success" size="small">
                    {{ formatFileSize(downloadSize) }}
                  </VChip>
                </div>
              </VCardText>
            </VCard>

            <VBtn
              color="info"
              variant="flat"
              block
              @click="downloadDialog = false"
            >
              {{ t('pages.administration.manageFlux.dialogs.downloadProgress.done') }}
            </VBtn>
          </template>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/composables/useSnackbar'
import axios from 'axios'
import { useFluxStore } from '@/stores/flux'
import { getDetectedBackendURL } from '@/utils/backend'
// Lazy-load Monaco Editor to reduce main bundle size
const VueMonacoEditor = defineAsyncComponent(() =>
  import('@guolao/vue-monaco-editor').then(m => m.VueMonacoEditor)
)
import { useTheme } from 'vuetify'

const { t } = useI18n()

const fluxStore = useFluxStore()
const { showSnackbar } = useSnackbar()
const theme = useTheme()

const editorTheme = computed(() => {
  return theme.global.name.value === 'dark' ? 'vs-dark' : 'vs'
})

// Tab state
const currentTab = ref('settings')
const logsTab = ref('flux')

// Logs state
const fluxLogs = ref('')
const fluxLogsLoading = ref(false)
const selectedFluxLogType = ref('debug')
const selectedFluxLogLines = ref(50)

const daemonLogs = ref('')
const daemonLogsLoading = ref(false)
const selectedDaemonLogLines = ref(50)

const benchmarkLogs = ref('')
const benchmarkLogsLoading = ref(false)
const selectedBenchmarkLogLines = ref(50)

const fluxLogTypeOptions = [
  { title: 'Debug', value: 'debug' },
  { title: 'Error', value: 'error' },
  { title: 'Info', value: 'info' },
  { title: 'Warn', value: 'warn' },
]

const logLineOptions = [
  { title: '50 lines', value: 50 },
  { title: '100 lines', value: 100 },
  { title: '200 lines', value: 200 },
  { title: '500 lines', value: 500 },
  { title: '1000 lines', value: 1000 },
]

// Info state
const daemonInfo = ref(null)
const daemonInfoLoading = ref(false)
const daemonInfoParsed = ref(null)

const benchmarkInfo = ref(null)
const benchmarkInfoLoading = ref(false)
const benchmarkInfoParsed = ref(null)

// Form inputs
const routerIPInput = ref('')
const blockedPortsInput = ref([])
const apiPortInput = ref(16127)
const blockedRepositoriesInput = ref([])

// Dialog states
const updateFluxDialog = ref(false)
const adjustRouterIPDialog = ref(false)
const adjustBlockedPortsDialog = ref(false)
const adjustAPIPortDialog = ref(false)
const adjustBlockedRepositoriesDialog = ref(false)
const restartFluxOSDialog = ref(false)
const updateProgressDialog = ref(false)
const updateProgress = ref(0)

// Daemon control dialogs
const startDaemonDialog = ref(false)
const restartDaemonDialog = ref(false)
const stopDaemonDialog = ref(false)

// Benchmark control dialogs
const startBenchmarkDialog = ref(false)
const restartBenchmarkDialog = ref(false)
const stopBenchmarkDialog = ref(false)

// Download progress dialog
const downloadDialog = ref(false)
const downloadProgress = ref(0)
const downloadFileName = ref('')
const downloadSize = ref(0)
const downloadedBytes = ref(0)
const downloadSpeed = ref(0)
const downloadIndeterminate = ref(false)

// Get backend URL
const getBackendURL = () => {
  return localStorage.getItem('backendURL') || getDetectedBackendURL()
}

// Get zelidauth header
const getZelidAuth = () => {
  const zelidauth = localStorage.getItem('zelidauth')
  if (!zelidauth)
    return null

  return zelidauth
}

// API calls
const callAPI = async (endpoint, method = 'GET', data = null) => {
  const baseURL = getBackendURL()
  const zelidauth = getZelidAuth()

  if (!zelidauth) {
    showSnackbar(t('pages.administration.manageFlux.messages.notAuthenticated'), 'error')

    return null
  }

  const config = {
    method,
    url: `${baseURL}${endpoint}`,
    headers: {
      'zelidauth': zelidauth,
      'x-apicache-bypass': true,
    },
  }

  if (data && method === 'POST') {
    config.data = data
    config.headers['Content-Type'] = 'application/json'
  }

  try {
    const response = await axios(config)

    return response.data
  }
  catch (error) {
    console.error('API Error:', error)
    showSnackbar(error.message || 'API request failed', 'error')

    return null
  }
}

// Load initial data
const getRouterIP = async () => {
  const response = await callAPI('/flux/routerip')
  if (response?.status === 'success' && response.data)
    routerIPInput.value = response.data
}

const getBlockedPorts = async () => {
  const response = await callAPI('/flux/blockedports')
  if (response?.status === 'success' && response.data)
    blockedPortsInput.value = Array.isArray(response.data) ? response.data : []
}

const getAPIPort = async () => {
  const response = await callAPI('/flux/apiport')
  if (response?.status === 'success' && response.data)
    apiPortInput.value = response.data
}

const getBlockedRepositories = async () => {
  const response = await callAPI('/flux/blockedrepositories')
  if (response?.status === 'success' && response.data)
    blockedRepositoriesInput.value = Array.isArray(response.data) ? response.data : []
}

// Action methods
const updateFlux = async () => {
  updateFluxDialog.value = false
  showSnackbar(t('pages.administration.manageFlux.messages.checkingForFluxUpdates'), 'info')

  try {
    const versionResponse = await axios.get('https://raw.githubusercontent.com/runonflux/flux/master/package.json')
    const latestVersion = versionResponse.data.version
    const currentVersion = fluxStore.fluxVersion

    if (latestVersion !== currentVersion) {
      showSnackbar(t('pages.administration.manageFlux.messages.fluxUpdatingInBackground'), 'warning')
      updateProgressDialog.value = true
      updateProgress.value = 5

      const interval = setInterval(() => {
        if (updateProgress.value === 99) {
          updateProgress.value += 1
        }
        else {
          updateProgress.value += 2
        }

        if (updateProgress.value >= 100) {
          clearInterval(interval)
          showSnackbar(t('pages.administration.manageFlux.messages.updateCompletedFluxWillReload'), 'success')
          setTimeout(() => {
            if (updateProgressDialog.value)
              window.location.reload()
          }, 5000)
        }

        if (!updateProgressDialog.value) {
          clearInterval(interval)
          updateProgress.value = 0
        }
      }, 1000)

      const response = await callAPI('/flux/softupdatefluxinstall')
      if (response?.status === 'error') {
        showSnackbar(response.data.message || response.data, 'error')
        updateProgressDialog.value = false
        updateProgress.value = 0
      }
    }
    else {
      showSnackbar(t('pages.administration.manageFlux.messages.fluxAlreadyUpToDate'), 'success')
    }
  }
  catch (error) {
    showSnackbar(t('pages.administration.manageFlux.messages.errorCheckingFluxVersion'), 'error')
    console.error(error)
  }
}

const adjustRouterIP = async () => {
  adjustRouterIPDialog.value = false
  const routerIP = routerIPInput.value
  const response = await callAPI(`/flux/adjustrouterip/${routerIP}`)
  if (response?.status === 'error')
    showSnackbar(response.data.message || response.data, 'error', 3000, 'mdi-alert-circle')
  else
    showSnackbar(response.data.message || response.data, 'success', 3000, 'mdi-check-circle')
}

const adjustBlockedPorts = async () => {
  adjustBlockedPortsDialog.value = false
  const blockedPorts = blockedPortsInput.value.map(port => Number(port)).filter(port => !isNaN(port))
  const response = await callAPI('/flux/adjustblockedports', 'POST', { blockedPorts })
  if (response?.status === 'error')
    showSnackbar(response.data.message || response.data, 'error', 3000, 'mdi-alert-circle')
  else
    showSnackbar(response.data.message || response.data, 'success', 3000, 'mdi-check-circle')
}

const adjustAPIPort = async () => {
  adjustAPIPortDialog.value = false
  const apiPort = apiPortInput.value
  const allowedAPIPorts = [16127, 16137, 16147, 16157, 16167, 16177, 16187, 16197]

  if (!allowedAPIPorts.includes(Number(apiPort))) {
    showSnackbar(t('pages.administration.manageFlux.messages.apiPortNotValid'), 'error')

    return
  }

  const response = await callAPI(`/flux/adjustapiport/${apiPort}`)
  if (response?.status === 'error')
    showSnackbar(response.data.message || response.data, 'error', 3000, 'mdi-alert-circle')
  else
    showSnackbar(response.data.message || response.data, 'success', 3000, 'mdi-check-circle')
}

const adjustBlockedRepositories = async () => {
  adjustBlockedRepositoriesDialog.value = false
  const blockedRepositories = blockedRepositoriesInput.value.filter(repo => repo && typeof repo === 'string')
  const response = await callAPI('/flux/adjustblockedrepositories', 'POST', { blockedRepositories })
  if (response?.status === 'error')
    showSnackbar(response.data.message || response.data, 'error', 3000, 'mdi-alert-circle')
  else
    showSnackbar(response.data.message || response.data, 'success', 3000, 'mdi-check-circle')
}

const restartFluxOS = async () => {
  restartFluxOSDialog.value = false
  const response = await callAPI('/flux/restart')
  if (response?.status === 'error')
    showSnackbar(response.data.message || response.data, 'error', 3000, 'mdi-alert-circle')
  else
    showSnackbar(response.data.message || response.data, 'success', 3000, 'mdi-check-circle')
}

// Log functions
const fetchFluxLogs = async () => {
  fluxLogsLoading.value = true
  fluxLogs.value = ''

  try {
    const logType = selectedFluxLogType.value
    const response = await callAPI(`/flux/tail${logType}log`)

    if (response?.status === 'success' && response.data) {
      // Handle both string and object responses
      fluxLogs.value = typeof response.data === 'string' ? response.data : (response.data.message || JSON.stringify(response.data, null, 2))
    } else if (response?.status === 'error') {
      showSnackbar(response.data?.message || 'Failed to load Flux logs', 'error', 3000, 'mdi-alert-circle')
    } else {
      fluxLogs.value = 'No logs available'
    }
  } catch (error) {
    showSnackbar(t('pages.administration.manageFlux.messages.errorLoadingFluxLogs'), 'error', 3000, 'mdi-alert-circle')
    console.error('Flux log fetch error:', error)
  } finally {
    fluxLogsLoading.value = false
  }
}

const fetchDaemonLogs = async () => {
  daemonLogsLoading.value = true
  daemonLogs.value = ''

  try {
    const response = await callAPI('/flux/taildaemondebug')

    if (response?.status === 'success' && response.data) {
      // Handle both string and object responses
      daemonLogs.value = typeof response.data === 'string' ? response.data : (response.data.message || JSON.stringify(response.data, null, 2))
    } else if (response?.status === 'error') {
      showSnackbar(response.data?.message || 'Failed to load Daemon logs', 'error', 3000, 'mdi-alert-circle')
    } else {
      daemonLogs.value = 'No logs available'
    }
  } catch (error) {
    showSnackbar(t('pages.administration.manageFlux.messages.errorLoadingDaemonLogs'), 'error', 3000, 'mdi-alert-circle')
    console.error('Daemon log fetch error:', error)
  } finally {
    daemonLogsLoading.value = false
  }
}

const fetchBenchmarkLogs = async () => {
  benchmarkLogsLoading.value = true
  benchmarkLogs.value = ''

  try {
    const response = await callAPI('/flux/tailbenchmarkdebug')

    if (response?.status === 'success' && response.data) {
      // Handle both string and object responses
      benchmarkLogs.value = typeof response.data === 'string' ? response.data : (response.data.message || JSON.stringify(response.data, null, 2))
    } else if (response?.status === 'error') {
      showSnackbar(response.data?.message || 'Failed to load Benchmark logs', 'error', 3000, 'mdi-alert-circle')
    } else {
      benchmarkLogs.value = 'No logs available'
    }
  } catch (error) {
    showSnackbar(t('pages.administration.manageFlux.messages.errorLoadingBenchmarkLogs'), 'error', 3000, 'mdi-alert-circle')
    console.error('Benchmark log fetch error:', error)
  } finally {
    benchmarkLogsLoading.value = false
  }
}

const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const downloadFullLogFile = async type => {
  try {
    // Reset all progress values first
    downloadProgress.value = 0
    downloadFileName.value = ''
    downloadSize.value = 0
    downloadedBytes.value = 0

    let endpoint = ''
    let filename = ''

    // Generate timestamp
    const now = new Date()
    const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '').replace('T', '_')

    if (type === 'flux') {
      // Use the selected log type for flux logs
      const logTypeMap = {
        'error': '/flux/errorlog',
        'warn': '/flux/warnlog',
        'info': '/flux/infolog',
        'debug': '/flux/debuglog',
      }
      endpoint = logTypeMap[selectedFluxLogType.value] || '/flux/debuglog'
      filename = `flux-${selectedFluxLogType.value}_${timestamp}.log`
    } else if (type === 'daemon') {
      endpoint = '/flux/daemondebug'
      filename = `daemon-debug_${timestamp}.log`
    } else if (type === 'benchmark') {
      endpoint = '/flux/benchmarkdebug'
      filename = `benchmark-debug_${timestamp}.log`
    }

    // Reset and set filename
    downloadFileName.value = filename
    downloadProgress.value = 0
    downloadSize.value = 0
    downloadedBytes.value = 0
    downloadSpeed.value = 0
    downloadIndeterminate.value = false
    downloadDialog.value = true

    // Build full URL with backend
    const backendURL = getBackendURL()
    const fullURL = `${backendURL}${endpoint}`

    // Get auth header
    const zelidauth = getZelidAuth()
    const headers = zelidauth ? { zelidauth } : {}

    // Track download start time for speed calculation
    const startTime = Date.now()
    let lastUpdateTime = startTime
    let lastBytes = 0

    // Download using axios with progress tracking
    const response = await axios.get(fullURL, {
      responseType: 'blob',
      headers,
      onDownloadProgress: progressEvent => {
        const currentTime = Date.now()
        const timeDiff = (currentTime - lastUpdateTime) / 1000 // seconds

        downloadedBytes.value = progressEvent.loaded

        // Calculate download speed with smoothing
        if (timeDiff >= 0.2) { // Update speed every 200ms for stability
          const bytesDiff = progressEvent.loaded - lastBytes
          const instantSpeed = bytesDiff / timeDiff

          // Smooth the speed using exponential moving average
          if (downloadSpeed.value === 0) {
            downloadSpeed.value = Math.round(instantSpeed)
          } else {
            downloadSpeed.value = Math.round(downloadSpeed.value * 0.7 + instantSpeed * 0.3)
          }
          lastUpdateTime = currentTime
          lastBytes = progressEvent.loaded
        }

        // Check if server sent Content-Length header
        const total = progressEvent.total
        if (total && total > 0 && progressEvent.lengthComputable) {
          downloadSize.value = total
          downloadProgress.value = Math.round((progressEvent.loaded * 100) / total)
          downloadIndeterminate.value = false
        } else {
          // Server didn't send Content-Length - use indeterminate mode
          downloadIndeterminate.value = true

          // Show a pulsing progress to indicate activity
          downloadProgress.value = 0
        }
      },
    })

    // Create blob and trigger download
    const blob = new Blob([response.data], { type: 'text/plain' })

    // Set final size and progress (now we know the actual size)
    downloadSize.value = blob.size
    downloadedBytes.value = blob.size
    downloadProgress.value = 100
    downloadIndeterminate.value = false
    downloadSpeed.value = 0

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Keep dialog open - user will close it manually
  } catch (error) {
    downloadDialog.value = false
    showSnackbar(t('pages.administration.manageFlux.messages.failedToDownloadLogFile'), 'error', 3000, 'mdi-alert-circle')
  }
}

// Daemon control functions
const startDaemon = async () => {
  startDaemonDialog.value = false
  const response = await callAPI('/daemon/start')
  if (response?.status === 'error')
    showSnackbar(response.data?.message || response.data || 'Failed to start daemon', 'error', 3000, 'mdi-alert-circle')
  else
    showSnackbar(response.data?.message || response.data || 'Daemon started successfully', 'success', 3000, 'mdi-check-circle')
}

const restartDaemon = async () => {
  restartDaemonDialog.value = false
  const response = await callAPI('/daemon/restart')
  if (response?.status === 'error')
    showSnackbar(response.data?.message || response.data || 'Failed to restart daemon', 'error', 3000, 'mdi-alert-circle')
  else
    showSnackbar(response.data?.message || response.data || 'Daemon restarted successfully', 'success', 3000, 'mdi-check-circle')
}

const stopDaemon = async () => {
  stopDaemonDialog.value = false
  const response = await callAPI('/daemon/stop')
  if (response?.status === 'error')
    showSnackbar(response.data?.message || response.data || 'Failed to stop daemon', 'error', 3000, 'mdi-alert-circle')
  else
    showSnackbar(response.data?.message || response.data || 'Daemon stopped successfully', 'success', 3000, 'mdi-check-circle')
}

// Benchmark control functions
const startBenchmark = async () => {
  startBenchmarkDialog.value = false
  const response = await callAPI('/benchmark/start')
  if (response?.status === 'error')
    showSnackbar(response.data?.message || response.data || 'Failed to start benchmark', 'error', 3000, 'mdi-alert-circle')
  else
    showSnackbar(response.data?.message || response.data || 'Benchmark started successfully', 'success', 3000, 'mdi-check-circle')
}

const restartBenchmark = async () => {
  restartBenchmarkDialog.value = false
  const response = await callAPI('/benchmark/restart')
  if (response?.status === 'error')
    showSnackbar(response.data?.message || response.data || 'Failed to restart benchmark', 'error', 3000, 'mdi-alert-circle')
  else
    showSnackbar(response.data?.message || response.data || 'Benchmark restarted successfully', 'success', 3000, 'mdi-check-circle')
}

const stopBenchmark = async () => {
  stopBenchmarkDialog.value = false
  const response = await callAPI('/benchmark/stop')
  if (response?.status === 'error')
    showSnackbar(response.data?.message || response.data || 'Failed to stop benchmark', 'error', 3000, 'mdi-alert-circle')
  else
    showSnackbar(response.data?.message || response.data || 'Benchmark stopped successfully', 'success', 3000, 'mdi-check-circle')
}

// Helper functions for formatting
const formatKey = key => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatValue = value => {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'number') {
    // For very small numbers, preserve precision
    if (value > 0 && value < 0.01) {
      return value.toString()
    }
    
    return value.toLocaleString()
  }
  
  return String(value)
}

const getDaemonIcon = key => {
  const iconMap = {
    version: 'mdi-numeric',
    protocolversion: 'mdi-shield-check',
    walletversion: 'mdi-wallet',
    balance: 'mdi-cash',
    blocks: 'mdi-cube-outline',
    timeoffset: 'mdi-clock-outline',
    connections: 'mdi-lan',
    proxy: 'mdi-shield-network',
    difficulty: 'mdi-chart-line',
    testnet: 'mdi-test-tube',
    keypoololdest: 'mdi-key',
    keypoolsize: 'mdi-key-chain',
    paytxfee: 'mdi-currency-usd',
    relayfee: 'mdi-swap-horizontal',
    errors: 'mdi-alert-circle',
  }
  
  return iconMap[key.toLowerCase()] || 'mdi-information'
}

const getDaemonChipColor = key => {
  const colorMap = {
    version: 'info',
    protocolversion: 'success',
    walletversion: 'teal',
    balance: 'cyan',
    blocks: 'secondary',
    timeoffset: 'info',
    connections: 'success',
    proxy: 'teal',
    difficulty: 'cyan',
    testnet: 'secondary',
    keypoololdest: 'info',
    keypoolsize: 'success',
    paytxfee: 'teal',
    relayfee: 'cyan',
    errors: 'error',
  }
  
  return colorMap[key.toLowerCase()] || 'secondary'
}

const getOtherDaemonFields = () => {
  if (!daemonInfoParsed.value) return []

  const knownFields = [
    'version',
    'protocolversion',
    'walletversion',
    'connections',
    'blocks',
    'difficulty',
    'timeoffset',
    'testnet',
    'balance',
    'keypoolsize',
    'keypoololdest',
    'paytxfee',
    'relayfee',
    'errors',
    'proxy',
  ]

  return Object.entries(daemonInfoParsed.value)
    .filter(([key]) => !knownFields.includes(key.toLowerCase()))
    .map(([key, value]) => ({ key, value }))
}

const getBenchmarkIcon = key => {
  const iconMap = {
    status: 'mdi-check-circle',
    benchmarking: 'mdi-timer-sand',
    flux: 'mdi-flash',
    zelback: 'mdi-server',
    cores: 'mdi-cpu-64-bit',
    ram: 'mdi-memory',
    ssd: 'mdi-harddisk',
    totalstorage: 'mdi-database',
    hdd: 'mdi-harddisk',
    ddwrite: 'mdi-file-download',
    time: 'mdi-clock',
    speed: 'mdi-speedometer',
    error: 'mdi-alert',
    eps: 'mdi-flash-circle',
  }
  
  return iconMap[key.toLowerCase()] || 'mdi-chart-box'
}

const getStatusColor = status => {
  const statusColors = {
    'CUMULUS': 'info',
    'NIMBUS': 'success',
    'STRATUS': 'warning',
    'OFFLINE': 'error',
    'FAILED': 'error',
  }
  
  return statusColors[status?.toUpperCase()] || 'grey'
}

const formatTimestamp = timestamp => {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp * 1000)
  
  return date.toLocaleString()
}

// Info fetch functions
const fetchDaemonInfo = async () => {
  daemonInfoLoading.value = true
  try {
    const response = await callAPI('/daemon/getinfo')
    if (response?.status === 'success' && response.data) {
      daemonInfo.value = response.data
      daemonInfoParsed.value = response.data
    } else if (response?.status === 'error') {
      showSnackbar(response.data?.message || 'Failed to load daemon info', 'error', 3000, 'mdi-alert-circle')
      daemonInfo.value = null
      daemonInfoParsed.value = null
    } else {
      daemonInfo.value = null
      daemonInfoParsed.value = null
    }
  } catch (error) {
    showSnackbar(t('pages.administration.manageFlux.messages.errorLoadingDaemonInfo'), 'error', 3000, 'mdi-alert-circle')
    console.error('Daemon info fetch error:', error)
    daemonInfo.value = null
    daemonInfoParsed.value = null
  } finally {
    daemonInfoLoading.value = false
  }
}

const fetchBenchmarkInfo = async () => {
  benchmarkInfoLoading.value = true
  try {
    const response = await callAPI('/benchmark/getbenchmarks')
    if (response?.status === 'success' && response.data) {
      benchmarkInfo.value = response.data
      benchmarkInfoParsed.value = response.data
    } else if (response?.status === 'error') {
      showSnackbar(response.data?.message || 'Failed to load benchmark info', 'error', 3000, 'mdi-alert-circle')
      benchmarkInfo.value = null
      benchmarkInfoParsed.value = null
    } else {
      benchmarkInfo.value = null
      benchmarkInfoParsed.value = null
    }
  } catch (error) {
    showSnackbar(t('pages.administration.manageFlux.messages.errorLoadingBenchmarkInfo'), 'error', 3000, 'mdi-alert-circle')
    console.error('Benchmark info fetch error:', error)
    benchmarkInfo.value = null
    benchmarkInfoParsed.value = null
  } finally {
    benchmarkInfoLoading.value = false
  }
}

// Watch for main tab changes to load logs when logs tab is opened
watch(currentTab, newTab => {
  if (newTab === 'logs') {
    // Auto-load logs based on current logs sub-tab
    if (logsTab.value === 'flux' && !fluxLogs.value) {
      fetchFluxLogs()
    } else if (logsTab.value === 'daemon' && !daemonLogs.value) {
      fetchDaemonLogs()
    } else if (logsTab.value === 'benchmark' && !benchmarkLogs.value) {
      fetchBenchmarkLogs()
    }
  }
})

// Watch for logs sub-tab changes
watch(logsTab, newTab => {
  if (currentTab.value === 'logs') {
    if (newTab === 'flux' && !fluxLogs.value) {
      fetchFluxLogs()
    } else if (newTab === 'daemon' && !daemonLogs.value) {
      fetchDaemonLogs()
    } else if (newTab === 'benchmark' && !benchmarkLogs.value) {
      fetchBenchmarkLogs()
    }
  }
})

onMounted(() => {
  getRouterIP()
  getBlockedPorts()
  getAPIPort()
  getBlockedRepositories()
  fetchDaemonInfo()
  fetchBenchmarkInfo()
})
</script>

<route lang="yaml">
meta:
  privilege:
    - admin
    - fluxteam
</route>

<style scoped>
.log-container {
  max-height: 600px;
  overflow-y: auto;
  background-color: rgb(var(--v-theme-surface));
}

.log-content {
  margin: 0;
  padding: 12px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

.info-container {
  max-height: 500px;
  overflow-y: auto;
  background-color: rgb(var(--v-theme-surface));
}

.info-content {
  margin: 0;
  padding: 12px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

/* Download dialog animations */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.4), 0 0 40px rgba(76, 175, 80, 0.2);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 30px rgba(76, 175, 80, 0.6), 0 0 60px rgba(76, 175, 80, 0.4);
    transform: scale(1.05);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes downloadBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(4px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes downloadGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(33, 150, 243, 0.4), 0 0 40px rgba(33, 150, 243, 0.2);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 30px rgba(33, 150, 243, 0.6), 0 0 60px rgba(33, 150, 243, 0.4);
    transform: scale(1.05);
  }
}

@keyframes downloadFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

.download-main-icon.mdi-cloud-download {
  animation: bounce 2s ease-in-out infinite;
}

.download-main-icon.mdi-check-circle {
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.download-complete-icon {
  animation: glow 2s ease-in-out infinite, float 3s ease-in-out infinite;
}

.download-progress-icon {
  animation: downloadBounce 1.5s ease-in-out infinite, pulse 2s ease-in-out infinite;
}

.download-complete-title-icon {
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.download-progress-avatar {
  animation: downloadGlow 2s ease-in-out infinite, downloadFloat 3s ease-in-out infinite;
}
</style>
