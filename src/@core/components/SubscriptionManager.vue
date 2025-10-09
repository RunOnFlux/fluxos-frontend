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
            <span class="text-h5">{{ props.newApp ? 'Register New Application' : 'Subscription Management' }}</span>
          </div>
          <VTooltip v-if="props.newApp" location="top">
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                icon
                color="success"
                variant="tonal"
                size="small"
                class="import-glow-btn mr-2"
                @click="showSpecImportDialog = true"
              >
                <VIcon size="22">mdi-file-import</VIcon>
              </VBtn>
            </template>
            <span>Import Specification</span>
          </VTooltip>
        </div>
      </VCol>
    </VRow>
    <!-- Tabs + Button -->
    <div class="d-flex align-center justify-space-between flex-nowrap">
      <!-- Tabs -->
      <div class="d-flex flex-grow-1 min-w-0 align-center">
        <VTabs
          v-model="tab"
          start
          density="comfortable"
          class="v-tabs-pill"
        >
          <VTab
            v-for="(item, index) in tabItems"
            :key="index"
            :value="item.value"
            class="mx-1"
          >
            <div class="d-flex align-center tab-content">
              <VIcon
                class="mr-1"
                style="font-size: 22px !important; height: 22px !important; width: 22px !important;"
              >
                {{ item.icon }}
              </VIcon>
              <span class="d-none d-sm-inline">{{ item.label }}</span>
            </div>
          </VTab>
        </VTabs>
      </div>
      

      <!-- Button: opens its own VWindowItem -->
      <VBtn
        color="primary"
        class="ml-2"
        @click="tab = 99"
      >
        <VIcon size="24" class="mr-1">mdi-check-decagram</VIcon>
        <span class="d-none d-sm-inline">Validate & Register</span>
      </VBtn>
      
    </div>

    <!-- Shared VWindow Content -->
    <VWindow v-model="tab" class="mt-4">
      <VWindowItem :value="0">
        <div class="pa-4">
          <VForm>
            <VTextField
              v-model="appDetails.name"
              label="Name"
              prepend-inner-icon="mdi-rename-box"
              outlined
              dense
              :disabled="isNameLocked"
              class="mb-3"
            />

            <VTextarea
              v-model="appDetails.description"
              label="Description"
              prepend-inner-icon="mdi-text"
              auto-grow
              rows="1"
              outlined
              dense
              class="mb-3"
            />

            <VTextField
              v-model="appDetails.owner"
              label="Owner"
              prepend-inner-icon="mdi-account"
              outlined
              dense
              class="mb-3"
            />

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
          
          
            <div class="d-flex align-center mb-3">
              <VCombobox
                v-model="appDetails.contacts"
                label="Contact"
                prepend-inner-icon="mdi-email"
                multiple
                outlined
                dense
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
              </VCombobox>

              <VTooltip text="Upload contacts to Flux Storage" location="top">
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
              <div class="d-flex align-center mb-2">
                <VChip color="default" variant="tonal" class="mr-2" style="width: 110px" label>
                  <VIcon class="mr-1">mdi-laptop</VIcon>
                  Instances
                </VChip>
              </div>
              <VSlider
                v-model="appDetails.instances"
                :min="3"
                :max="100"
                step="1"
                class="flex-grow-1"
                hide-details
                :thumb-label="false"
                track-size="4"
              />
              <div class="text-right text-caption grey--text mr-3">
                {{ appDetails.instances }} Instances (Nodes)
              </div>
            </div>

            <!-- Renewal Period Section -->
            <div class="mb-2 mt-2">
              <div class="d-flex align-center justify-space-between mb-1">
                <div class="d-flex align-center">
                  <VChip color="default" variant="tonal" class="mr-2" style="width: 110px" label>
                    <VIcon class="mr-1">mdi-calendar-clock</VIcon>
                    Period
                  </VChip>
                </div>
                <VSwitch
                  v-if="!newApp"
                  v-model="renewalEnabled"
                  inset
                  hide-details
                  class="ma-0"
                  label="Renewal"
                />
              </div>

              <VSlider
                v-model="appDetails.renewalIndex"
                :min="0"
                :max="renewalOptions.length - 1"
                step="1"
                class="flex-grow-1"
                hide-details
                :thumb-label="false"
                track-size="4"
                :disabled="!renewalEnabled && !newApp"
              />
              <span class="mb-5">
                <div class="d-flex justify-space-between align-center px-3">
                  <!-- left -->
                  <span style="line-height: 1.25;">
                    <template v-if="newApp">

                    </template>
                    <template v-else>
                      Currently your application is subscribed until
                      <b>{{ new Date(appRunningTill.current).toLocaleString('en-GB', timeOptions.shortDate) }}</b>.
                    </template>
                  </span>
                  <!-- right -->
                  <span class="text-caption grey--text" style="line-height: 1.25; white-space: nowrap;">
                    {{ renewalLabels[appDetails.renewalIndex] }}
                  </span>
                </div>
                <span v-if="renewalEnabled && !newApp" class="px-3">
                  Your new adjusted subscription ends on
                  <b>{{ new Date(appRunningTill.new).toLocaleString('en-GB', timeOptions.shortDate) }}</b>.
                </span>
                <span v-if="appRunningTill.new < appRunningTill.current && renewalEnabled" style="color: red">
                  <VAlert
                    type="warning"
                    color="error"
                    variant="tonal"
                    density="compact"
                    size="small"
                    class="mt-1 mx-3"
                  >
                    Your selected subscription period will decrease the current subscription time!
                  </VAlert>
                </span>
              </span>
            </div>
            <div class="d-flex align-center mb-1 mt-4">
              <VChip color="default" variant="tonal" class="mr-2"  label>
                <VIcon class="mr-1">mdi-cog-box</VIcon>
                Additional Options
              </VChip>
            </div>
            <div class="d-flex flex-wrap gap-4 mt-1 pa-2">
              <!-- Static IP Switch -->
              <VSwitch
                v-model="appDetails.staticip"
                inset
                hide-details
                class="ma-0"
                density="compact"
                label="Static IP"
              />

              <!-- Enterprise Switch -->
              <VSwitch
                v-model="isPrivateApp"
                inset
                hide-details
                class="ma-0"
                density="compact"
                label="Enterprise"
              />
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
                  Allowed Geolocation
                </h4>
              </div>
              <!-- Continent Selector -->
              <VSelect
                v-model="selectedAllowed.continent"
                :items="getContinents(false)"
                label="Continent"
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
                label="Country"
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
                label="Region"
                item-title="text"
                item-value="value"
                outlined 
                dense 
                class="mb-4"
                :disabled="!selectedAllowed.country || selectedAllowed.country === 'ALL'"
              />

              <!-- Add Button -->
              <div class="d-flex justify-center mt-2 mb-2">
                <VTooltip text="Add Allowed" location="top">
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
                  Forbidden Geolocation
                </h4>
              </div>

              <!-- Continent Selector -->
              <VSelect
                v-model="selectedForbidden.continent"
                :items="getContinents(true)"
                label="Continent"
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
                label="Country"
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
                label="Region"
                item-title="text"
                item-value="value"
                outlined 
                dense 
                class="mb-4"
                :disabled="!selectedForbidden.country || selectedForbidden.country === 'ALL'"
              />

              <!-- Add Button -->
              <div class="d-flex justify-center mt-2 mb-2">
                <VTooltip text="Add Forbidden" location="top">
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

      <!-- Updated component section (Tab 2) to fix tab separation and dynamic switching -->
      <VWindowItem :value="2">
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
                <div class="d-flex align-center tab-content">
                  <VIcon class="mr-1" style="font-size: 22px !important; height: 22px !important; width: 22px !important;">
                    mdi-cube-outline
                  </VIcon>
                  <span class="d-none d-sm-inline">{{ component.name || `Component ${componentIndex + 1}` }}</span>
                  <VBtn
                    v-if="props.newApp"
                    icon
                    size="x-small"
                    variant="flat"
                    density="compact"
                    color="error"
                    class="ml-2"
                    style="font-size: 18px !important; height: 18px !important; width: 18px !important;"
                    @click.stop="removeComposeComponent(componentIndex)"
                  >
                    <VIcon style="font-size: 14px !important; height: 14px !important; width: 14px !important;">mdi-close</VIcon>
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
                  General
                </VChip>
              </div>
              <div class="pa-2">
                <VTextField
                  v-model="component.name"
                  label="Name"
                  prepend-inner-icon="mdi-tag"
                  outlined dense class="mb-3"
                  :disabled="!props.newApp"
                />

                <VTextField
                  v-model="component.description"
                  label="Description"
                  prepend-inner-icon="mdi-text"
                  outlined dense class="mb-3"
                />

                <VTextField
                  v-model="component.repotag"
                  label="Repository Tag"
                  prepend-inner-icon="mdi-docker"
                  outlined dense class="mb-3"
                />

                <!-- Repository Auth for Enterprise Apps (v7+) -->
                <VTextField
                  v-if="props.appSpec?.version >= 7 && isPrivateApp"
                  v-model="component.repoauth"
                  label="Repository Authentication"
                  placeholder="Docker authentication username:apikey"
                  prepend-inner-icon="mdi-lock"
                  density="compact"
                  variant="outlined"
                  class="mb-4"
                  persistent-hint
                />

                <!-- Secrets for Enterprise Apps (v7) -->
                <VTextField
                  v-if="props.appSpec?.version === 7 && isPrivateApp"
                  v-model="component.secrets"
                  label="Secrets"
                  placeholder="Enter secrets (will be encrypted)"
                  prepend-inner-icon="mdi-key"
                  density="compact"
                  variant="outlined"
                  class="mb-4"
                  persistent-hint
                />

                <div class="d-flex align-center mb-2 mt-2">
                  <VChip
                    color="default"
                    variant="tonal"
                    style="width: 100%;"
                    label
                    class="d-flex align-center"
                  >
                    <VIcon size="20" class="mr-2">mdi-folder-plus</VIcon>
                    <span class="text-subtitle-2">Data Path Builder</span>
                  </VChip>
                </div>

                <VolumePathBuilder
                  :componentIndex="componentIndex"
                  :newApp="props.newApp"
                  v-model="appSpec.compose[componentIndex].containerData"
                />

                <VTextField
                  v-model="component.containerData"
                  label="Container Data Path"
                  prepend-inner-icon="mdi-folder"
                  outlined dense class="mb-3 mt-4"
                  readonly
                />

                <div class="d-flex align-center mb-2 mt-2">
                  <VChip
                    color="default"
                    variant="tonal"
                    style="width: 100%;"
                    label
                    class="d-flex align-center"
                  >
                    <VIcon size="20" class="mr-2">mdi-alpha-e-box</VIcon>
                    <span class="text-subtitle-2">Environment</span>
                  </VChip>
                </div>

                <VBadge
                  class="d-inline-flex"
                  :model-value="component.environmentParameters?.length > 0"
                  :content="component.environmentParameters.length"
                  color="primary"
                  offset-x="15"
                  offset-y="6"
                >
                  <VBtn
                    class="mb-3 mr-2"
                    variant="outlined"
                    prepend-icon="mdi-format-list-bulleted"
                    color="grey"
                    @click="openEnvDialog(componentIndex)"
                  >
                    Environment Variables
                  </VBtn>
                </VBadge>

                <VBadge
                  class="d-inline-flex"
                  :model-value="component.commands?.length > 0"
                  :content="component.commands.length"
                  color="primary"
                  offset-x="15"
                  offset-y="6"
                >
                  <VBtn
                    class="mb-3 mr-2"
                    variant="outlined"
                    prepend-icon="mdi-console"
                    color="grey"
                    @click="openCommandsDialog(componentIndex)"
                  >
                    Commands
                  </VBtn>
                </VBadge>
                <div class="mb-3">
                  <div class="d-flex align-center mb-2">
                    <VChip color="default" variant="tonal" style="width: 100%;" label>
                      <VIcon class="mr-1">mdi-connection</VIcon>
                      Port Bindings
                    </VChip>
                  </div>
                 
                  <div class="border rounded pa-2">
                    <!-- Add new ports -->
                    <div class="d-flex align-center gap-2" v-if="newPorts[componentIndex]">
                      <VTextField
                        v-model.number="newPorts[componentIndex].exposed"
                        type="number"
                        label="Exposed Port"
                        density="compact"
                        hide-details
                        dense
                        style="max-width: 140px;"
                      />
                      <VTextField
                        v-model.number="newPorts[componentIndex].container"
                        type="number"
                        label="Container Port"
                        density="compact"
                        hide-details
                        dense
                        style="max-width: 140px;"
                      />
                      <VBtn icon color="primary" density="compact" @click="addPortPair(componentIndex)">
                        <VIcon size="18">mdi-plus</VIcon>
                      </VBtn>
                    </div>
                    <!-- Editable Chip List -->
                    <div class="d-flex flex-wrap align-center gap-1 mt-2">
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
                            dense
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
                            dense
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
                      Custom Domains
                    </VChip>
                  </div>
                  <VSheet border rounded class="mt-2 mb-3" style="max-height: 400px;">
                    <VTable dense class="rounded domain-table" :style="{ '--v-table-header-height': '40px' }">
                      <thead>
                        <tr>
                          <th>Port & Domain Configuration</th>
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
                                placeholder="Enter domain for this port"
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
                        <span class="text-h5 text-white">Environment Variables</span>
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
                          <span>Import from JSON</span>
                        </VTooltip>
                      </div>
                    </VCardTitle>

                    <!-- Body -->
                    <VCardText>
                      <!-- Add entry row -->
                      <div class="d-flex mb-4 align-center" style="gap: 8px;">
                        <VTextField
                          v-model="envDialog.newKey"
                          label="Key"
                          density="compact"
                          hide-details
                        />
                        <VTextField
                          v-model="envDialog.newValue"
                          label="Value"
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
                                  placeholder="KEY"
                                />
                              </td>
                              <td>
                                <VTextField
                                  v-model="entry.value"
                                  density="compact"
                                  hide-details
                                  placeholder="VALUE"
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
                        <span class="text-h5 text-white">Container Commands</span>
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
                          <span>Import from JSON</span>
                        </VTooltip>
                      </div>
                    </VCardTitle>

                    <VCardText>
                      <!-- Add Command -->
                      <div class="d-flex mb-4 align-center gap-2">
                        <VTextField
                          v-model="commandsDialog.newCommand"
                          label="New Command"
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
                              <th class="text-white">Command</th>
                              <th style="width: 40px; text-align: right; padding-right: 8px;">
                                <!-- Upload button in table header -->
                                <VTooltip text="Upload commands to Flux Storage" location="top">
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
                                  placeholder="Enter command"
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

                <div class="d-flex align-center mb-2">
                  <VChip color="default" variant="tonal" style="width: 100%;" label>
                    <VIcon class="mr-1">mdi-progress-wrench</VIcon>
                    Hardware Resource
                  </VChip>
                </div>
                <div class="border rounded pa-2">
                  <VRow dense>
                    <!-- CPU -->
                    <VCol cols="12">
                      <div class="d-flex align-center">
                        <div class="d-flex align-center label-column">
                          <VIcon size="20" class="mr-1">mdi-speedometer</VIcon>
                          <span>CPU (vCore) </span>
                        </div>
                        <VSlider
                          v-model="component.cpu"
                          :min="0.1"
                          :max="15"
                          :step="0.1"
                          :thumb-label="false"
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
                      <div class="d-flex align-center">
                        <div class="d-flex align-center label-column">
                          <VIcon size="20" class="mr-1">mdi-memory</VIcon>
                          <span>RAM (MB)</span>
                        </div>
                        <VSlider
                          v-model="component.ram"
                          :min="100"
                          :max="65536"
                          :step="100"
                          :thumb-label="false"
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
                    <!-- HDD -->
                    <VCol cols="12">
                      <div class="d-flex align-center">
                        <div class="d-flex align-center label-column">
                          <VIcon size="20" class="mr-1">mdi-harddisk</VIcon>
                          <span>HDD (GB)</span>
                        </div>
                        <VSlider
                          v-model="component.hdd"
                          :min="1"
                          :max="820"
                          :step="1"
                          :thumb-label="false"
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
      
      <!-- Priority Nodes Tab (value=3) -->
      <VWindowItem :value="3">
        <div class="pa-4">
          <div v-if="props.appSpec?.version >= 7">
            <VAlert
              type="info"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              <template v-if="props.appSpec?.version === 7">
                <strong>Enterprise Nodes:</strong> Only selected enterprise nodes will be able to run your application. These nodes are used for encryption and can access your private images and secrets.
              </template>
              <template v-else-if="props.appSpec?.version >= 8">
                <strong>Priority Nodes:</strong> Select priority nodes if needed. Your app will preferentially deploy on these nodes but can still run on other nodes in the network.
              </template>
            </VAlert>
            
            <!-- Node Selection Table -->
            <VCard flat bordered>
              <VCardTitle class="d-flex justify-space-between align-center">
                <span>{{ props.appSpec?.version === 7 ? 'Enterprise Nodes' : 'Priority Nodes' }}</span>
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
                    Auto Select
                  </VBtn>
                  <VBtn
                    color="primary"
                    variant="outlined"
                    size="small"
                    @click="openNodeSelectionDialog"
                  >
                    <VIcon class="mr-1">mdi-plus</VIcon>
                    {{ props.appSpec?.version === 7 ? 'Choose Enterprise Nodes' : 'Choose Priority Nodes' }}
                  </VBtn>
                </div>
              </VCardTitle>
              
              <!-- Filter and Items per page selector for selected nodes -->
              <div class="px-4 pt-3 pb-2">
                <div class="d-flex gap-2 align-center">
                  <VTextField
                    v-model="selectedNodesFilter"
                    label="Search nodes"
                    placeholder="IP, address, tier..."
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
                    label="Per page"
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
                          Remove Node
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
                          Visit FluxNode
                        </VTooltip>
                      </VBtn>
                    </div>
                  </template>
                
                  <template #expanded-row="{ item, columns }">
                    <td :colspan="columns.length">
                      <VCard flat class="ma-2">
                        <VCardText>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">IP Address:</strong>
                            <span>{{ item.ip }}</span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">Public Key:</strong>
                            <span class="text-break">
                              {{ item.pubkey || 'N/A' }}
                            </span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">Node Address:</strong>
                            <span class="text-break">
                              {{ item.payment_address }}
                            </span>
                          </div>
                          <div v-if="item.txhash && item.outidx" class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">Collateral:</strong>
                            <span class="text-break">
                              {{ item.txhash }}:{{ item.outidx }}
                            </span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">Tier:</strong>
                            {{ item.tier }}
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">Overall Score:</strong>
                            <span>{{ item.score }}</span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">Collateral Score:</strong>
                            <span>{{ item.collateralPoints }}</span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">Maturity Score:</strong>
                            <span>{{ item.maturityPoints }}</span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">Public Key Score:</strong>
                            <span>{{ item.pubKeyPoints }}</span>
                          </div>
                          <div class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">Apps Assigned:</strong>
                            <span>{{ item.enterpriseApps }}</span>
                          </div>
                          <div v-if="item.status" class="d-flex align-center mb-2">
                            <strong class="mr-2" style="min-width: 180px;">Status:</strong>
                            {{ item.status || 'confirmed' }}
                          </div>
                        </VCardText>
                      </VCard>
                    </td>
                  </template>
                
                  <template #no-data>
                    <div class="text-center pa-4">
                      <VIcon size="48" color="grey">mdi-server-network-off</VIcon>
                      <p class="mt-2 text-grey">No nodes selected</p>
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
                  Page {{ selectedNodesCurrentPage }} of {{ selectedNodesTotalPages }}
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
              Priority nodes are only available for applications with version 7 or higher.
            </VAlert>
          </div>
        </div>
      </VWindowItem>
      
      <VWindowItem :value="99">
        <div class="pa-4">
          <div class="d-flex align-center pa-3 mb-4 review-header">
            <VIcon class="mr-2" color="success" size="24">mdi-check-decagram</VIcon>
            <h2 class="text-h6 mb-0">Review & Validate</h2>
          </div>
          <!-- Spec Validation -->
          <div class="spec-row">
            <div class="label-cell">Validate App Spec</div>
            <div class="value-cell d-flex align-center justify-end pr-4">
              <div v-if="isVeryfitying" class="d-flex justify-center">
                <VProgressCircular indeterminate color="primary" size="24" />
              </div>
              <div v-else-if="hasValidatedSpec && verifyAppSpecResponse === true" class="d-flex justify-center">
                <VIcon color="success" size="24">mdi-check-circle</VIcon>
              </div>
              <div v-else-if="hasValidatedSpec && verifyAppSpecResponse === false" class="d-flex justify-center">
                <VIcon color="error" size="24">mdi-close-circle</VIcon>
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
              <strong>Validation Error:</strong> {{ verifyAppSpecError }}
            </VAlert>
          </div>

          <!-- Only show other sections if spec is valid -->
          <template v-if="!hasValidatedSpec || verifyAppSpecResponse === true">
            <!-- Total Cost -->
            <div class="spec-row mt-2">
              <div class="label-cell">Total Cost</div>
              <div class="value-cell d-flex align-center justify-end pr-4">
                <template v-if="hasCalculatedPrice && appSpecPrice?.flux === 0">
                  <span class="mr-1">Free update</span>
                  <VIcon size="22" color="success">mdi-check-circle</VIcon>
                </template>

                <template v-else-if="hasCalculatedPrice && appSpecPrice?.flux">
                  <span class="mr-1">
                    ${{ appSpecPrice.usd }} USD ({{ appSpecPrice.flux }} FLUX with {{ appSpecPrice.fluxDiscount }}% discount)
                  </span>
                  <VIcon size="22" color="success">mdi-check-circle</VIcon>
                </template>

                <template v-else-if="hasCalculatedPrice && !appSpecPrice?.flux">
                  <span class="mr-1">Failed to calculate price</span>
                  <VIcon size="22" color="error">mdi-alert-circle</VIcon>
                </template>
              </div>
            </div>

            <!-- Expiry -->
            <div class="spec-row mt-2">
              <div class="label-cell">Expiry</div>
              <div class="value-cell d-flex align-center justify-end pr-4">
                <span class="mr-1">
                  <template v-if="hasCheckedExpiry">
                    <template v-if="props.newApp">
                      <!-- For new apps, show subscription period -->
                      <template v-if="blockHeight">
                        Subscription: {{ expiryLabel }}
                      </template>
                      <template v-else>
                        Subscription: {{ expiryLabel }}
                      </template>
                    </template>
                    <template v-else-if="blockHeight && props.appSpec?.height">
                      <!-- For existing apps, show validation status -->
                      <template v-if="isExpiryValid">
                        Validated ({{ expiryLabel }})
                      </template>
                      <template v-else>
                        Application expires in under a week. Extend the subscription to update specs.
                      </template>
                    </template>
                    <template v-else>
                      Not Available
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
              <div class="label-cell">Signature</div>
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
              <div class="label-cell">Registered</div>
              <div class="value-cell d-flex align-center justify-end pr-4">
                <div v-if="isPropagating" class="d-flex justify-center">
                  <VProgressCircular indeterminate color="primary" size="24" />
                </div>
                <div v-else-if="registrationHash" class="d-flex justify-center">
                  <VIcon color="success" size="24">mdi-check-circle</VIcon>
                </div>
              </div>
            </div>
            
            <div class="d-flex justify-center align-center mt-4">
              <!-- Sign Message Button -->
              <VBtn v-if="hasCalculatedPrice && !signature" variant="flat" style="width: 100%" @click="dataSign()">
                <VIcon start size="24">mdi-file-sign</VIcon> Sign Message
              </VBtn>
              
              <!-- Register Application Button -->
              <VBtn v-else-if="signature && !registrationHash" variant="flat" color="success" style="width: 100%" :loading="isPropagating" @click="propagateSignedMessage()">
                <VIcon start size="24">mdi-send</VIcon> Register Application
              </VBtn>
              
              <!-- Registration Success - Go to Test & Pay -->
              <div v-else-if="registrationHash" class="w-100">
                <VAlert 
                  type="success" 
                  variant="tonal" 
                  class="mb-4 registration-success-alert" 
                  icon="mdi-check-circle"
                  :style="{
                    backgroundColor: theme.global.name.value === 'dark' ? 'rgba(76, 175, 80, 0.12)' : 'rgba(76, 175, 80, 0.08)',
                    borderColor: theme.global.name.value === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.6)',
                    color: theme.global.name.value === 'dark' ? 'rgba(129, 199, 132, 1)' : 'rgba(46, 125, 50, 1)'
                  }"
                >
                  <div class="text-center">
                    <div
                      class="font-weight-bold mb-2" :style="{
                        color: theme.global.name.value === 'dark' ? 'rgba(165, 214, 167, 1)' : 'rgba(27, 94, 32, 1)'
                      }">🎉 Registration Successful!</div>
                    <div
                      class="text-body-2 mb-3" :style="{
                        color: theme.global.name.value === 'dark' ? 'rgba(129, 199, 132, 0.8)' : 'rgba(46, 125, 50, 0.8)'
                      }">Your app has been registered to the Flux network.</div>
                    <VBtn 
                      variant="flat" 
                      color="primary" 
                      @click="tab = 100"
                    >
                      <VIcon start size="20">mdi-test-tube</VIcon> 
                      Proceed to Test & Payment
                      <VIcon end size="16">mdi-arrow-right</VIcon>
                    </VBtn>
                  </div>
                </VAlert>

                <!-- Payment Status Alert -->
                <VAlert 
                  v-if="paymentCompleted" 
                  type="success" 
                  variant="tonal" 
                  class="mb-4 payment-success-alert" 
                  :icon="isCryptoPayment(paymentMethod) ? 'mdi-check-circle' : 'mdi-credit-card-check'"
                  :style="{
                    backgroundColor: theme.global.name.value === 'dark' ? 'rgba(76, 175, 80, 0.12)' : 'rgba(76, 175, 80, 0.08)',
                    borderColor: theme.global.name.value === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.6)'
                  }"
                >
                  <div class="text-center">
                    <div
                      class="font-weight-bold mb-2" :style="{
                        color: theme.global.name.value === 'dark' ? 'rgba(165, 214, 167, 1)' : 'rgba(27, 94, 32, 1)'
                      }">
                      <span v-if="isCryptoPayment(paymentMethod)">₿ Crypto Payment Completed!</span>
                      <span v-else>💳 Payment Completed!</span>
                    </div>
                    <div
                      class="text-body-2" :style="{
                        color: theme.global.name.value === 'dark' ? 'rgba(129, 199, 132, 0.9)' : 'rgba(46, 125, 50, 0.9)'
                      }">
                      <span v-if="isCryptoPayment(paymentMethod)">
                        Successfully paid {{ paymentAmount }} FLUX via {{ paymentMethod }}
                      </span>
                      <span v-else>
                        Successfully paid ${{ paymentAmount }} USD via {{ paymentMethod }}
                      </span>
                    </div>
                  </div>
                </VAlert>

                <!-- Payment Pending Alert -->
                <VAlert 
                  v-else-if="paymentMethod && !paymentCompleted" 
                  type="info" 
                  variant="tonal" 
                  class="mb-4 payment-pending-alert" 
                  :icon="isCryptoPayment(paymentMethod) ? 'mdi-currency-usd' : 'mdi-credit-card-clock'"
                  :style="{
                    backgroundColor: theme.global.name.value === 'dark' ? 'rgba(33, 150, 243, 0.12)' : 'rgba(33, 150, 243, 0.08)',
                    borderColor: theme.global.name.value === 'dark' ? 'rgba(33, 150, 243, 0.4)' : 'rgba(33, 150, 243, 0.6)'
                  }"
                >
                  <div class="text-center">
                    <div
                      class="font-weight-bold mb-2" :style="{
                        color: theme.global.name.value === 'dark' ? 'rgba(144, 202, 249, 1)' : 'rgba(13, 71, 161, 1)'
                      }">
                      <span v-if="isCryptoPayment(paymentMethod)">₿ Crypto Payment Initiated</span>
                      <span v-else>⏳ Payment Processing</span>
                    </div>
                    <div
                      class="text-body-2" :style="{
                        color: theme.global.name.value === 'dark' ? 'rgba(100, 181, 246, 0.9)' : 'rgba(25, 118, 210, 0.9)'
                      }">
                      <span v-if="isCryptoPayment(paymentMethod)">
                        {{ paymentMethod }} payment initiated for {{ paymentAmount }} FLUX. Complete payment in your wallet.
                      </span>
                      <span v-else>
                        Waiting for {{ paymentMethod }} payment confirmation (${{ paymentAmount }} USD)
                      </span>
                    </div>
                    <div v-if="!isCryptoPayment(paymentMethod)" class="mt-3">
                      <VBtn 
                        size="small" 
                        variant="outlined" 
                        @click="paymentCompleted = true"
                      >
                        Mark as Paid (Test)
                      </VBtn>
                    </div>
                  </div>
                </VAlert>
              </div>
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
          <VCard class="mb-4" v-if="!testFinished">
            <VCardTitle class="bg-primary text-white">
              <VIcon class="mr-2">mdi-test-tube</VIcon>
              Test Application Installation
            </VCardTitle>
            <VCardText class="mt-4">
              <p class="mb-4">
                Test your application install/launch to ensure your specifications work correctly.
                The installation log will appear below once completed.
              </p>
              
              <VAlert v-if="testError" type="error" variant="tonal" class="mb-4">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <strong>WARNING:</strong> Test failed! Check logs below and fix your specifications before paying.
                  </div>
                  <VBtn 
                    size="small" 
                    color="warning" 
                    variant="outlined"
                    @click="forceEnablePayment"
                  >
                    Enable Payment Anyway
                  </VBtn>
                </div>
              </VAlert>

              <VBtn
                color="success"
                variant="flat"
                :loading="testRunning"
                @click="testAppInstall"
                :disabled="testFinished"
              >
                <VIcon class="mr-2">mdi-play</VIcon>
                Test Installation
              </VBtn>
            </VCardText>
          </VCard>

          <!-- Test Output -->
          <VCard v-if="testOutput.length > 0" class="mb-4">
            <VCardTitle 
              class="bg-secondary text-white d-flex align-center justify-space-between"
              style="cursor: pointer;"
              @click="logsExpanded = !logsExpanded"
            >
              <div class="d-flex align-center">
                <VIcon class="mr-2">mdi-console</VIcon>
                <span v-if="testFinished && !testError">Test Completed Successfully</span>
                <span v-else-if="testFinished && testError">Test Failed - Check Logs</span>
                <span v-else-if="testRunning">Installation Progress</span>
                <span v-else>Installation Progress</span>
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

          <!-- Payment Section -->
          <div v-if="testFinished && !testError">
            <!-- Warning Alert if test had warnings -->
            <VAlert 
              v-if="hasTestWarnings" 
              type="warning" 
              variant="tonal" 
              class="mb-4"
              icon="mdi-alert-triangle"
            >
              <strong>Test Warnings:</strong> Your app test completed with some warnings. 
              Please review the installation logs above. You can still proceed with payment, 
              but consider addressing these warnings for optimal performance.
            </VAlert>
            <VRow class="mb-4">
              <VCol cols="12">
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
                        }">Registration Successful!</div>
                      <div 
                        class="text-subtitle-2" 
                        :style="{
                          color: theme.global.name.value === 'dark' ? 'rgba(129, 199, 132, 0.9)' : 'rgba(46, 125, 50, 0.9)',
                          opacity: 0.9
                        }"
                      >Your app is ready for deployment</div>
                    </div>
                  </VCardTitle>
                  <VCardText class="pa-6">
                    <VList class="bg-transparent">
                      <VListItem class="px-0">
                        <template #prepend>
                          <VIcon color="success" class="mr-3">mdi-clock-check</VIcon>
                        </template>
                        <VListItemTitle class="text-body-1">
                          <strong>Payment window:</strong> 30 minutes remaining
                        </VListItemTitle>
                      </VListItem>
                      
                      <VListItem class="px-0">
                        <template #prepend>
                          <VIcon color="primary" class="mr-3">mdi-calendar-end</VIcon>
                        </template>
                        <VListItemTitle class="text-body-1">
                          <strong>Subscription until:</strong> {{ subscribedTill }}
                        </VListItemTitle>
                      </VListItem>
                      
                      <VListItem class="px-0">
                        <template #prepend>
                          <VIcon color="info" class="mr-3">mdi-information</VIcon>
                        </template>
                        <VListItemTitle class="text-body-1">
                          Choose your preferred payment method below
                        </VListItemTitle>
                      </VListItem>
                    </VList>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>

            <!-- Payment Methods -->
            <div class="payment-methods-container">
              <VRow no-gutters class="justify-center">
                <!-- Fiat Payment -->
                <VCol cols="12" md="6" lg="5" xl="4" class="pa-3">
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
                          <div class="text-h6 font-weight-bold">Pay with Card</div>
                          <div class="text-subtitle-2 opacity-90">Secure & instant payment</div>
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
                            :style="{
                              border: theme.global.name.value === 'dark' ? '2px solid rgba(144, 202, 249, 0.3)' : '2px solid rgba(25, 118, 210, 0.3)',
                              backgroundColor: theme.global.name.value === 'dark' ? 'rgba(33, 150, 243, 0.05)' : 'rgba(33, 150, 243, 0.02)'
                            }"
                          >
                            <VCardText class="d-flex align-center justify-center pa-6">
                              <img
                                class="payment-brand-icon"
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
                            :style="{
                              border: theme.global.name.value === 'dark' ? '2px solid rgba(144, 202, 249, 0.3)' : '2px solid rgba(25, 118, 210, 0.3)',
                              backgroundColor: theme.global.name.value === 'dark' ? 'rgba(33, 150, 243, 0.05)' : 'rgba(33, 150, 243, 0.02)'
                            }"
                          >
                            <VCardText class="d-flex align-center justify-center pa-6">
                              <img
                                class="payment-brand-icon"
                                :src="PayPalThemeImg"
                                alt="PayPal"
                              />
                            </VCardText>
                          </VCard>
                        </div>
                        
                        <!-- USD Price Display -->
                        <div v-if="stripeEnabled || paypalEnabled" class="mt-4">
                          <VChip color="success" variant="flat" size="large">
                            ${{ appSpecPrice?.usd || 0 }} USD
                          </VChip>
                        </div>
                        
                        <!-- Warning -->
                        <VAlert 
                          v-if="!stripeEnabled && !paypalEnabled" 
                          type="warning" 
                          variant="tonal"
                          class="mb-0"
                          icon="mdi-alert-circle"
                        >
                          Fiat payment gateways are temporarily unavailable
                        </VAlert>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>

                <!-- Crypto Payment -->
                <VCol cols="12" md="6" lg="5" xl="4" class="pa-3">
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
                          <div class="text-h6 font-weight-bold">Pay with FLUX</div>
                          <div class="text-subtitle-2 opacity-90">Cryptocurrency payment</div>
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
                            <VCardText class="d-flex flex-column align-center justify-center pa-6">
                              <img
                                class="wallet-brand-icon mb-3"
                                :src="FluxIDImg"
                                alt="Zelcore"
                              />
                              <span class="text-body-2 font-weight-medium">Zelcore</span>
                            </VCardText>
                          </VCard>
                          
                          <VCard 
                            variant="outlined" 
                            class="wallet-icon-card"
                            @click="initSSPPay"
                            hover
                          >
                            <VCardText class="d-flex flex-column align-center justify-center pa-6">
                              <img
                                class="wallet-brand-icon mb-3"
                                :src="SSPLogoThemeImg"
                                alt="SSP"
                              />
                              <span class="text-body-2 font-weight-medium">SSP</span>
                            </VCardText>
                          </VCard>
                        </div>
                        
                        <!-- Payment Details -->
                        <VCard variant="tonal" color="surface" class="mt-4">
                          <VCardText class="pa-4">
                            <div class="text-center mb-3">
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
                            
                            <div class="text-caption text-medium-emphasis">
                              <div class="mb-2 text-center">
                                <strong>Send to:</strong><br>
                                <code class="text-caption">{{ deploymentAddress || 'Loading...' }}</code>
                              </div>
                              <div class="text-center">
                                <strong>Message:</strong><br>
                                <code class="text-caption">{{ registrationHash }}</code>
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
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center bg-primary">
        <span class="text-h5 text-white">{{ props.appSpec?.version === 7 ? 'Select Enterprise Nodes' : 'Select Priority Nodes' }}</span>
        <VBtn
          icon
          variant="text"
          @click="showNodeSelectionDialog = false"
        >
          <VIcon>mdi-close</VIcon>
        </VBtn>
      </VCardTitle>
      
      <VCardText>
        <VAlert 
          v-if="props.appSpec?.version === 7"
          type="info" 
          variant="tonal" 
          class="mb-4"
        >
          <strong>Enterprise Nodes:</strong> Only selected nodes will be able to run your application and access private data. 
          Changing nodes after encryption will require re-setting secrets and repository authentication.
        </VAlert>
        <VAlert 
          v-else
          type="info" 
          variant="tonal" 
          class="mb-4"
        >
          <strong>Priority Nodes:</strong> Your app will preferentially deploy on selected nodes but can still run on other network nodes.
        </VAlert>

        <!-- Search and Filter Controls -->
        <VRow class="mb-4">
          <VCol cols="12" md="6">
            <VTextField
              v-model="nodeFilter"
              label="Search nodes (IP, address, tier)"
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
              label="Per page"
              hide-details
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="3" class="d-flex align-center">
            <VChip color="primary" variant="tonal">
              <VIcon class="mr-1">mdi-check-circle</VIcon>
              {{ selectedNodes.length }} selected
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
                      <strong class="mr-2" style="min-width: 180px;">IP Address:</strong>
                      <span>{{ item.ip }}</span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">Public Key:</strong>
                      <span class="text-break">
                        {{ item.pubkey || 'N/A' }}
                      </span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">Node Address:</strong>
                      <span class="text-break">
                        {{ item.payment_address }}
                      </span>
                    </div>
                    <div v-if="item.txhash && item.outidx" class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">Collateral:</strong>
                      <span class="text-break">
                        {{ item.txhash }}:{{ item.outidx }}
                      </span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">Tier:</strong>
                      {{ item.tier }}
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">Overall Score:</strong>
                      <span>{{ item.score }}</span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">Collateral Score:</strong>
                      <span>{{ item.collateralPoints }}</span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">Maturity Score:</strong>
                      <span>{{ item.maturityPoints }}</span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">Public Key Score:</strong>
                      <span>{{ item.pubKeyPoints }}</span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">Apps Assigned:</strong>
                      <span>{{ item.enterpriseApps }}</span>
                    </div>
                    <div v-if="item.status" class="d-flex align-center mb-2">
                      <strong class="mr-2" style="min-width: 180px;">Status:</strong>
                      {{ item.status || 'confirmed' }}
                    </div>
                    <div class="mt-3">
                      <VBtn
                        size="small"
                        color="primary"
                        @click="visitFluxNode(item.ip)"
                      >
                        Visit FluxNode
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
                  {{ nodeFilter ? 'No nodes match your search' : 'No nodes available' }}
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
            Page {{ dialogCurrentPage }} of {{ dialogTotalPages }}
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
      
      <VCardActions class="px-6 pb-4">
        <VBtn
          variant="flat"
          color="error"
          @click="showNodeSelectionDialog = false"
        >
          Cancel
        </VBtn>
        <VSpacer />
        <VBtn
          variant="flat"
          color="primary"
          @click="saveNodeSelection"
          :disabled="selectedNodes.length === 0"
        >
          <VIcon class="mr-1">mdi-check</VIcon>
          Save Selection ({{ selectedNodes.length }})
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
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import axios from 'axios'
import geolocations from '@/utils/geolocation'
import qs from 'qs'
import { signWithWalletConnect, getConnectedAccount, payWithSSP, payWithZelcore, signWithSSP, signWithZelcore } from '@/utils/walletService'
import { getUser } from '@/utils/firebase'
import { getDetectedBackendURL } from "@/utils/backend"
import { paymentBridge } from '@/utils/fiatGateways'
import AppsService from "@/services/AppsService"
import { storeToRefs } from "pinia"
import { useFluxStore } from "@/stores/flux"
import { useTheme } from 'vuetify'
import ImportJsonDialog from '@/components/dialogs/ImportJsonDialog.vue'
import ImportSpecDialog from '@/components/dialogs/ImportSpecDialog.vue'
import { 
  importRsaPublicKey, 
  encryptAesKeyWithRsaKey, 
  encryptEnterpriseWithAes,
  encryptMessage,
  getEnterprisePGPKeys,
  isWebCryptoAvailable,
} from '@/utils/enterpriseCrypto'

// Import payment images
import StripeImg from '@images/Stripe.svg?url'
import PayPalImg from '@images/PayPal.png?url'
import FluxIDImg from '@images/FluxID.svg?url'
import SSPLogoBlackImg from '@images/ssp-logo-black.svg?url'
import SSPLogoWhiteImg from '@images/ssp-logo-white.svg?url'

const props = defineProps({
  appSpec: Object,
  newApp: Boolean,
  executeLocalCommand: Function,
})

const signature = ref('')
const timestamp = ref(Date.now())
const updatetype = computed(() => props.newApp ? 'fluxappregister' : 'fluxappupdate')
const version = 1
const signClient = ref(null)
const websocket = ref(null)
const loginType  = ref(localStorage.getItem('loginType'))
const tab = ref(0)
const renewalEnabled = ref(false)
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
      showToast('success', 'Card payment completed successfully!')
      
      // Clean up URL parameters
      const newUrl = window.location.pathname
      window.history.replaceState(null, '', newUrl)
    }
  }
})

// Theme-aware images
const theme = useTheme()
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
    { label: 'General', icon: 'mdi-application', value: 0 },
    { label: 'Geolocation', icon: 'mdi-earth', value: 1 },
    { label: 'Components', icon: 'mdi-cube', value: 2 },
  ]
  
  // Only show Priority/Enterprise Nodes tab for v7+ private apps
  if (props.appSpec?.version >= 7 && isPrivateApp.value) {
    baseItems.push({
      label: props.appSpec?.version === 7 ? 'Enterprise Nodes' : 'Priority Nodes',
      icon: 'mdi-server-network',
      value: 3,
    })
  }
  
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

const nodeTableHeaders = [
  { title: '', key: 'data-table-expand', sortable: false, width: '50px' },
  { title: 'IP Address', key: 'ip' },
  { title: 'Node Address', key: 'payment_address' },
  { title: 'Tier', key: 'tier' },
  { title: 'Score', key: 'score' },
  { title: '', key: 'actions', sortable: false },
]

const nodeSelectionHeaders = [
  { title: 'Select', key: 'select', sortable: false },
  { title: 'IP Address', key: 'ip' },
  { title: 'Node Address', key: 'payment_address' },
  { title: 'Tier', key: 'tier' },
  { title: 'Score', key: 'score' },
  { title: 'Status', key: 'status' },
]


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

const renewalOptions = [
  { value: 5000, label: '1 week' },
  { value: 11000, label: '2 weeks' },
  { value: 22000, label: '1 month' },
  { value: 66000, label: '3 months' },
  { value: 132000, label: '6 months' },
  { value: 264000, label: '1 year' },
  
]

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

const renewalLabels = computed(() => renewalOptions.map(opt => opt.label))

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
    const expire = newSpec.expire ?? 22000
    const foundIndex = renewalOptions.findIndex(opt => opt.value === expire)
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
  
  // Set default expire if not set
  if (props.appSpec && props.appSpec.expire === undefined) {
    props.appSpec.expire = 22000
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
  try {
    const res = await props.executeLocalCommand('/daemon/getblockcount')
    if (res?.data?.status === 'success' && typeof res.data?.data === 'number') {
      currentBlockHeight.value = res.data.data
    } else {
      currentBlockHeight.value = null
    }
  } catch {
    currentBlockHeight.value = null
  }
}


onMounted(async () => {
  Promise.all([getMarketPlace(), getMultiplier()])
  await fetchCurrentBlockHeight()
})


// --- Running-till timestamps ----------------------------------------
const blockTimeMs = 2 * 60 * 1000 // 2 minutes per block

// 1️⃣  Clone once (on mount) – never overwritten
const originalExpireSnapshot = ref(null)

onMounted(() => {
  originalExpireSnapshot.value = props.appSpec?.expire ?? 22000
  
  // For new apps, enable renewal by default (which means setting the period)
  if (props.newApp) {
    renewalEnabled.value = true
  }
})

// 2️⃣  current remaining blocks based on the *original* value
const originalExpireBlocks = computed(() => {
  if (!currentBlockHeight.value || typeof props.appSpec?.height !== 'number') return null
  
  return props.appSpec.height + originalExpireSnapshot.value - currentBlockHeight.value
})

// 3️⃣  timestamps shown in the UI
const appRunningTill = computed(() => {
  const blockTimeMs = 2 * 60 * 1000
  const now = Date.now()
  const current = originalExpireBlocks.value ?? 0
  const chosen = renewalEnabled.value
    ? renewalOptions[appDetails.value.renewalIndex]?.value ?? 0
    : 0
  
  return {
    current: current * blockTimeMs + now,
    new: chosen * blockTimeMs + now,
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

  if (renewalEnabled.value || props.newApp) {
    props.appSpec.expire = renewalOptions[val.renewalIndex]?.value
  } else {
    props.appSpec.expire = originalExpireSnapshot.value
  }
}, { deep: true })

watch(renewalEnabled, val => {


 
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
    
    showToast('success', `Auto-selected ${nodesToSelect.length} high-quality enterprise nodes`)
    
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
    label: component.name || `Component ${index + 1}`,
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
    newPorts.value[index] = { exposed: null, container: null }
  } else {
    showToast("error",
      isDuplicateGlobal
        ? `Port ${ports.exposed} is already used in another component.`
        : 'Invalid or duplicate port values.',
    )
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
})

// Generate a random port between min and max
function generateRandomPort(min = 30000, max = 39999) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Watch for compose length changes
watch(() => props.appSpec?.compose?.length, newLength => {
  // For new apps, generate a random port for each component
  if (props.newApp && newLength > 0) {
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
    newPorts.value = Array.from({ length: newLength }, () => ({ exposed: null, container: null }))
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
  const expire = props.appSpec?.expire ?? 22000
  
  // For new apps, just show the selected period duration
  if (props.newApp) {
    const totalMinutes = expire * 2
    const days = Math.floor(totalMinutes / 1440)
    const hours = Math.floor((totalMinutes % 1440) / 60)
    const minutes = totalMinutes % 60

    const parts = []
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)

    return parts.join(', ')
  }
  
  // For existing apps
  const height = renewalEnabled.value ? blockHeight.value : props.appSpec.height
  const current = blockHeight.value

  if (!height || !current) return ''

  const blocksToExpireLocal = height + expire - current
  if (blocksToExpireLocal < 1) return ''

  const totalMinutes = blocksToExpireLocal * 2
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  const parts = []
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
  parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)

  return parts.join(', ')
})

// Auto-trigger logic when switching to tab 99
watch(tab, async newVal => {
  if (newVal === 99) {
    // Spinner on
    isVeryfitying.value = true
    appSpecFormated.value = null
    signature.value = null

    // Reset all public state
    verifyAppSpecResponse.value = null
    verifyAppSpecError.value = null
    appSpecPrice.value = null
    blockHeight.value = null
    isExpiryValid.value = false
    blocksToExpire.value = null
    registrationHash.value = null
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

    // Ensure required fields exist for version >= 5
    if (appSpecTemp.version >= 5) {
      if (!appSpecTemp.contacts) appSpecTemp.contacts = []
      if (!appSpecTemp.geolocation) appSpecTemp.geolocation = []
    }

    if (blocksToExpire.value !== 'null' && !renewalEnabled.value){
      appSpecTemp.expire = blocksToExpire.value
    }
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
      errorMsg = 'Enterprise app requires selected priority nodes. Please go to the Priority Nodes tab and select nodes.'
    }
    
    verifyAppSpecError.value = errorMsg
    showToast('error', errorMsg)
    
    return false
  }
}

async function priceForAppSpec() {
  try {

    const response = await props.executeLocalCommand(
      '/apps/calculatefiatandfluxprice',
      JSON.stringify(appSpecFormated.value),
      null,
      true,
    )

    if (response.data?.status !== 'success') {
      appSpecPrice.value = null
      
      return false
    }

    appSpecPrice.value = response.data.data
    
    return true
  } catch (error) {
    appSpecPrice.value = null
    
    return false
  }
}

async function fetchBlockHeight() {
  try {
    const res = await props.executeLocalCommand('/daemon/getblockcount')

    if (res?.data?.status === 'success' && typeof res.data?.data === 'number') {
      blockHeight.value = res.data.data

      const expireBlocks = props.appSpec?.expire ?? 22000

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
          // For existing apps, check if they have at least 5000 blocks (~1 week) remaining
          isExpiryValid.value = blocksToExpire.value >= 5000
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
  timestamp.value = Date.now()
  dataToSign.value = `${updatetype.value}${version}${JSON.stringify(appSpecFormated.value)}${timestamp.value}`
  await signMethod()
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

    // Log the data being sent for debugging
    console.log('Registration data:', data)
    console.log('Signature present:', !!signature.value)
    console.log('Timestamp:', timestamp.value)
    
    const zelidauth = localStorage.getItem('zelidauth')
    const response = props.newApp 
      ? await AppsService.registerApp(zelidauth, data)
      : await AppsService.updateApp(zelidauth, data)

    if (response.data?.status === 'success') {
      registrationHash.value = response.data.data
      showToast('success', 'Application registered successfully! You can now test and pay for your app.')
      
      // Fetch deployment information
      await getDeploymentInfo()
    } else {
      throw new Error(response.data?.data?.message || response.data?.data || 'Registration failed')
    }
  } catch (error) {
    console.error('Registration error:', error)
    console.error('Error response:', error.response?.data)
    
    let errorMessage = 'Failed to register application'
    
    if (error.response?.data?.data?.message) {
      errorMessage = error.response.data.data.message
    } else if (error.response?.data?.data) {
      errorMessage = error.response.data.data
    } else if (error.message) {
      errorMessage = error.message
    }
    
    showToast('error', errorMessage)
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

  testOutput.value = []
  testError.value = false
  testFinished.value = false
  testRunning.value = true
  
  showToast('info', 'Starting application test installation...')

  // Add initial status message
  testOutput.value.push({
    status: 'info',
    message: 'Initializing test installation...',
    timestamp: new Date().toISOString(),
    step: 'init',
  })

  try {
    const zelidauth = localStorage.getItem('zelidauth')
    
    // Simulate streaming by breaking the test into phases
    await streamTestPhase('Preparing test environment...', 'info', 500)
    await streamTestPhase('Downloading application specification...', 'info', 800)
    await streamTestPhase('Validating Docker image...', 'info', 1000)
    
    const response = await props.executeLocalCommand(
      `/apps/testappinstall/${registrationHash.value}`,
      null,
      {
        headers: {
          zelidauth,
        },
      },
      true,
    )

    await streamTestPhase('Processing test results...', 'info', 300)

    // Check the response status first
    console.log('Test response:', response.data)
    
    if (response.data?.status === 'error') {
      await streamTestPhase(`Test failed: ${response.data.data?.message || response.data.data || 'Unknown error'}`, 'error', 200)
      testError.value = true
      showToast('error', 'Test installation failed')
      
      return
    }
    
    // Process the actual test results
    if (response.data?.status === 'success' && response.data?.data) {
      await streamTestPhase('Analyzing installation results...', 'info', 400)
      
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
          result.message || 'Processing step completed',
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
        await streamTestPhase('Test completed with errors', 'error', 300)
        testError.value = true
        showToast('error', 'Test failed - check installation logs')
      } else if (hasWarnings) {
        await streamTestPhase('Test completed with warnings', 'warning', 300)
        testError.value = false
        logsExpanded.value = false
        showToast('warning', 'Test completed with warnings - review logs but payment is available')
      } else {
        await streamTestPhase('Test installation successful!', 'success', 300)
        testError.value = false
        logsExpanded.value = false
        showToast('success', 'Test passed! Application is ready for deployment.')
      }
    } else {
      // Handle other success cases
      await streamTestPhase('Test installation completed successfully', 'success', 300)
      testError.value = false
      logsExpanded.value = false
      showToast('success', 'Test completed! Application is ready for deployment.')
    }
    
  } catch (error) {
    await streamTestPhase(`Test failed: ${error.message || 'Unknown error'}`, 'error', 200)
    testError.value = true
    showToast('error', 'Test installation failed')
    console.error('Test error:', error)
  } finally {
    testRunning.value = false
    testFinished.value = true
    
    await streamTestPhase('Test process completed', 'info', 200)
    
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
    console.log('Stripe - Parsed auth:', auth)
    
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
          marketplace: false,
          registration: true,
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
    const checkoutURL = await axios.post(`${paymentBridge}/api/v1/stripe/checkout/create`, data)
    console.log('Stripe checkout response:', checkoutURL.data)
    if (checkoutURL.data.status === 'error') {
      console.error('Stripe checkout error:', checkoutURL.data)
      showToast('error', `Stripe checkout failed: ${checkoutURL.data.message || checkoutURL.data.data || 'Unknown error'}`)
      checkoutLoading.value = false
      
      return
    }
    fiatCheckoutURL.value = checkoutURL.data.data
    checkoutLoading.value = false
    
    // Track payment attempt
    paymentMethod.value = 'Stripe'
    paymentAmount.value = finalPrice
    
    try {
      window.open(checkoutURL.data.data, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
    } catch (error) {
      console.log(error)
      showToast('error', 'Failed to open Stripe checkout, pop-up blocked?')
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
    console.log('PayPal - Parsed auth:', auth)
    
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
        return_url: `${window.location.host}/successcheckout`,
        cancel_url: window.location.host,
        kpi: {
          origin: 'FluxOS',
          marketplace: false,
          registration: true,
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
    const checkoutURL = await axios.post(`${paymentBridge}/api/v1/paypal/checkout/create`, data)
    console.log('PayPal checkout response:', checkoutURL.data)
    if (checkoutURL.data.status === 'error') {
      console.error('PayPal checkout error:', checkoutURL.data)
      showToast('error', `PayPal checkout failed: ${checkoutURL.data.message || checkoutURL.data.data || 'Unknown error'}`)
      checkoutLoading.value = false
      
      return
    }
    fiatCheckoutURL.value = checkoutURL.data.data
    checkoutLoading.value = false
    
    // Track payment attempt  
    paymentMethod.value = 'PayPal'
    paymentAmount.value = finalPrice
    
    try {
      window.open(checkoutURL.data.data, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
    } catch (error) {
      console.log(error)
      showToast('error', 'Failed to open PayPal checkout, pop-up blocked?')
    }
  } catch (error) {
    console.error('PayPal checkout network error:', error)
    console.error('PayPal error response:', error.response?.data)
    const errorMessage = error.response?.data?.message || error.response?.data?.data || error.message || 'Connection failed'
    showToast('error', `PayPal checkout error: ${errorMessage}`)
    checkoutLoading.value = false
  }
}

async function initZelcorePay() {
  try {
    // Track payment attempt
    paymentMethod.value = 'Zelcore'
    paymentAmount.value = appSpecPrice.value?.flux || 0

    await payWithZelcore({
      address: deploymentAddress.value,
      amount: appSpecPrice.value?.flux || 0,
      message: registrationHash.value,
      coin: 'zelcash',
    })

    showToast('info', 'Zelcore payment initiated - please complete payment in Zelcore wallet')
  } catch (error) {
    showToast('error', 'Failed to open Zelcore')
  }
}

async function initSSPPay() {
  try {
    // Track payment attempt
    paymentMethod.value = 'SSP'
    paymentAmount.value = appSpecPrice.value?.flux || 0

    const data = {
      message: registrationHash.value,
      amount: (appSpecPrice.value?.flux || 0).toString(),
      address: deploymentAddress.value,
      chain: 'flux',
    }

    const response = await payWithSSP(data)
    showToast('success', `SSP payment initiated: ${response.txid}`)

    // Note: For crypto payments, we show as "processing" since we need to wait for blockchain confirmation
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
      
      return
    }

    signature.value = res.data.signature
  } catch (err) {
    showToast('error', 'SSO error: ' + err.message)
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

      return
    }

    // Sign the message using the wallet service
    const result = await signWithWalletConnect(dataToSign.value)

    signature.value = result
  } catch (err) {
    showToast('error', err.message)
  }
}

// === MetaMask ===
async function initSignMetamask() {
  try {
    const ethereum = window.ethereum
    if (!ethereum) return showToast('danger', 'Metamask not found')

    const account = ethereum.selectedAddress || (await ethereum.request({ method: 'eth_requestAccounts' }))[0]
    const msg = `0x${Buffer.from(dataToSign.value, 'utf8').toString('hex')}`

    const sign = await ethereum.request({
      method: 'personal_sign',
      params: [msg, account],
    })

    signature.value = sign
  } catch (err) {
    showToast('error', err.message)
  }
}

// === SSP ===
async function initSignSSP() {
  try {
    const result = await signWithSSP(dataToSign.value)
    signature.value = result.signature
  } catch (err) {
    showToast('error', err.message)
  }
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
  default:
    showToast('error', `Unknown loginType: ${loginType}`)
  }
}
</script>


<style scoped>
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
  padding: 6px;
  height: 54px;
}
.spec-row {
  display: flex;
  border: 1px solid #25293C; /* blue outline */
  border-radius: 8px;
  overflow: hidden;
  height: 40px;
  background-color: #0e1120; /* dark background */
}

.label-cell {
  background-color: #25293C; /* blue label background */
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
  background-color: #2F3349; /* same as outer */
  font-size: 14px;
}

.label-column {
  width: 110px;
  min-width: 110px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.text-field-fixed {
  width: 85px;
  min-width: 85px;
  max-width: 85px;
}

/* Hardware slider consistent sizing and spacing */
.hardware-slider {
  margin-left: 16px !important;
  margin-right: 20px !important;
  min-width: 150px;
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

.review-header {
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #1e1e2f;
  color: white;
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
  margin-top: 2rem;
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
  border-radius: 16px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  width: 180px;
  height: 120px;
  flex: 0 0 180px;
  position: relative;
  overflow: hidden;
}

.payment-icon-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.payment-icon-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border-width: 3px !important;
}

.payment-icon-card:hover::before {
  left: 100%;
}

.payment-icon-card:active {
  transform: translateY(-2px) scale(1.01);
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
  transform: translateY(-2px);
}

.payment-icon-card:hover .payment-brand-icon {
  transform: translateY(-2px) scale(1.1);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
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
  min-width: 140px;
  min-height: 140px;
  border: 2px solid rgba(var(--v-theme-outline), 0.2);
}

.wallet-icon-card:hover {
  transform: scale(1.05);
  border-color: rgba(var(--v-theme-warning), 0.5);
  box-shadow: 0 8px 24px rgba(var(--v-theme-warning), 0.15);
}

.wallet-brand-icon {
  height: 72px;
  width: 72px;
  object-fit: contain;
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
    width: 160px;
    height: 110px;
    flex: 0 0 160px;
  }
  
  .wallet-icon-card {
    min-width: 120px;
  }
}

@media (max-width: 600px) {
  .payment-header {
    padding: 1rem !important;
  }
  
  .payment-icons-grid,
  .wallet-icons-grid {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .payment-icon-card {
    width: 100%;
    max-width: 280px;
    height: 100px;
    flex: none;
  }
  
  .payment-icon-card .v-card-text {
    padding: 0.75rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 100% !important;
    box-sizing: border-box !important;
  }
  
  .payment-icon-card .payment-brand-icon {
    height: 60px !important;
    max-width: 150px !important;
    transform: translateY(2px) !important;
  }
  
  .wallet-icon-card {
    width: 100%;
    max-width: 200px;
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
</style>
