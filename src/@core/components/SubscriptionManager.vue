<template>
  <VCard flat>
    <!-- Title -->
    <VRow class="align-center justify-space-between mb-2">
      <VCol cols="12" class="d-flex align-center">
        <div class="d-flex w-100 align-center border-frame">
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
        <span class="d-none d-sm-inline">Validate & Pay</span>
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
                :disabled="!renewalEnabled"
              />
              <span class="mb-5">
                <div class="d-flex justify-space-between align-center px-3">
                  <!-- left -->
                  <span style="line-height: 1.25;">
                    Currently your application is subscribed until
                    <b>{{ new Date(appRunningTill.current).toLocaleString('en-GB', timeOptions.shortDate) }}</b>.
                  </span>
                  <!-- right -->
                  <span class="text-caption grey--text" style="line-height: 1.25; white-space: nowrap;">
                    {{ renewalLabels[appDetails.renewalIndex] }}
                  </span>
                </div>
                <span v-if="renewalEnabled" class="px-3">
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
                    color="primary"
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
                    color="primary"
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
                      <span class="text-h5 text-white">Container Commands</span>
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
                          <span>CPU (vCore)</span>
                        </div>
                        <VSlider
                          v-model="component.cpu"
                          :min="0.1"
                          :max="15"
                          :step="0.1"
                          :thumb-label="false"
                          hide-details
                          class="flex-grow-1 mr-5"
                        />
                        <VTextField
                          v-model.number="component.cpu"
                          type="number"
                          dense
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
                          class="flex-grow-1 mr-5"
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
                          class="flex-grow-1 mr-5"
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
                  <template v-if="blockHeight && props.appSpec?.height">
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
                v-if="hasCheckedExpiry && blockHeight && props.appSpec?.height"
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

            </div>
          </div>
          <div class="d-flex justify-center align-center mt-4">
            <VBtn v-if="hasCalculatedPrice" variant="flat"  style="width: 100%" @click="dataSign()">
              <VIcon start size="24">mdi-file-sign</VIcon> Sign Message
            </VBtn>
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
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import geolocations from '@/utils/geolocation'
import qs from 'qs'
import { SignClient } from '@walletconnect/sign-client'
import { getUser } from '@/utils/firebase'
import { getDetectedBackendURL } from "@/utils/backend"
import AppsService from "@/services/AppsService"
import { storeToRefs } from "pinia"
import { useFluxStore } from "@/stores/flux"
import { 
  importRsaPublicKey, 
  encryptAesKeyWithRsaKey, 
  encryptEnterpriseWithAes,
  encryptMessage,
  getEnterprisePGPKeys,
} from '@/utils/enterpriseCrypto'

const props = defineProps({
  appSpec: Object,
  newApp: Boolean,
  executeLocalCommand: Function,
})

const signature = ref('')
const timestamp = ref(Date.now())
const updatetype = 'fluxappupdate'
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
const appSpecPrice = ref(null)
const blockHeight = ref(null)
const isExpiryValid = ref(false)
const appSpecFormated = ref(null)
const blocksToExpire = ref(null)

// Section visibility flags
const hasValidatedSpec = ref(false)
const hasCalculatedPrice = ref(false)
const hasCheckedExpiry = ref(false)

const renewalLabels = computed(() => renewalOptions.map(opt => opt.label))

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

onMounted(() => {
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

  if (props.appSpec) {
    appDetails.value.name = props.appSpec.name || ''
    appDetails.value.description = props.appSpec.description || ''
    appDetails.value.owner = props.appSpec.owner || ''
    appDetails.value.contacts = props.appSpec.contacts || ''
    appDetails.value.instances = props.appSpec.instances ?? 3
    appDetails.value.staticip = props.appSpec.staticip ?? false
    
    // Determine if this is a private app based on existing data
    // For v7: check if nodes exist
    // For v8+: check if enterprise field has encrypted content
    if (props.appSpec.version === 7 && props.appSpec.nodes && props.appSpec.nodes.length > 0) {
      isPrivateApp.value = true
    } else if (props.appSpec.version >= 8 && props.appSpec.enterprise && props.appSpec.enterprise !== '') {
      isPrivateApp.value = true
    } else {
      isPrivateApp.value = false
    }
    
    appDetails.value.nodes = props.appSpec.nodes ? props.appSpec.nodes.join(', ') : ''

    // Note: repoauth is stored per component, not globally
    
    // Initialize selected nodes from appSpec
    if (props.appSpec.nodes && Array.isArray(props.appSpec.nodes)) {
      selectedNodes.value = props.appSpec.nodes.map(nodeIp => ({
        ip: nodeIp,
        // eslint-disable-next-line camelcase
        payment_address: 'Loading...',
        tier: 'Loading...',
        score: 'Loading...',
      }))

      // Try to get enterprise nodes to populate with real data
      getEnterpriseNodes()
    } else if (appDetails.value.enterprise && props.appSpec.version >= 7) {
      // Enterprise is enabled but no nodes yet - auto fetch nodes
      getEnterpriseNodes()
    }

    if (props.appSpec.name) {
      isNameLocked.value = true
    }

    const expire = props.appSpec.expire ?? 22000
    const foundIndex = renewalOptions.findIndex(opt => opt.value === expire)
    appDetails.value.renewalIndex = foundIndex !== -1 ? foundIndex : 2
    if (props.appSpec.expire === undefined) {
      props.appSpec.expire = 22000
    }
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

  if (renewalEnabled.value) {
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
        // eslint-disable-next-line camelcase
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
              // eslint-disable-next-line camelcase
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

  newPorts.value[index] = { exposed: null, container: null }
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

// Watch for compose length changes
watch(() => props.appSpec?.compose?.length, newLength => {
  newPorts.value = Array.from({ length: newLength }, () => ({ exposed: null, container: null }))
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
      if (!Array.isArray(component.domains)) component.domains = []

      // Ensure one domain entry per port
      component.ports.forEach((_, index) => {
        if (typeof component.domains[index] !== 'string') {
          component.domains[index] = ''
        }
      })

      // Optional: remove extra domains if ports were removed
      if (component.domains.length > component.ports.length) {
        component.domains.length = component.ports.length
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
      if (!Array.isArray(component.domains)) component.domains = []

      component.ports.forEach((_, index) => {
        if (typeof component.domains[index] !== 'string') {
          component.domains[index] = ''
        }
      })

      if (component.domains.length > component.ports.length) {
        component.domains.length = component.ports.length
      }
    })
  },
  { deep: true, immediate: true },
)

const expiryLabel = computed(() => {
  const expire = props.appSpec?.expire ?? 22000
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
    appSpecPrice.value = null
    blockHeight.value = null
    isExpiryValid.value = false
    blocksToExpire.value = null

    hasValidatedSpec.value = false
    hasCheckedExpiry.value = false
    hasCalculatedPrice.value = false

    // Local tracking
    let validated = false
    let checkedExpiry = false
    let calculatedPrice = false

    await fetchBlockHeight()
    checkedExpiry = true

    if (!isExpiryValid.value) {
      isVeryfitying.value = false
      hasValidatedSpec.value = validated
      hasCheckedExpiry.value = checkedExpiry
      
      return
    }

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
    if (blocksToExpire.value !== 'null' && !renewalEnabled.value){
      appSpecTemp.expire = blocksToExpire.value
    }
    if (appSpecTemp.version >= 8) {

      if (appSpecTemp.enterprise.length > 0) {
        isPrivateApp.value = true
      }

      // construct nodes
      if (isPrivateApp.value) {
        const responseGetOriginalOwner = await AppsService.getAppOriginalOwner(appSpecTemp.name)
        if (responseGetOriginalOwner.data.status === 'error') {
          throw new Error(responseGetOriginalOwner.data.data.message || responseGetOriginalOwner.data.data)
        }
        const zelidauth = localStorage.getItem('zelidauth')

        // call api to get RSA public key
        const appPubKeyData = {
          name: appSpecTemp.name,
          owner: responseGetOriginalOwner.data.data,
        }
        const responseGetPublicKey = await AppsService.getAppPublicKey(zelidauth, appPubKeyData)
        if (responseGetPublicKey.data.status === 'error') {
          throw new Error(responseGetPublicKey.data.data.message || responseGetPublicKey.data.data)
        }
        const pubkey = responseGetPublicKey.data.data

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
        const encryptedEnterprise = await encryptEnterpriseWithAes(
          JSON.stringify(enterpriseSpecs),
          aesKey,
          encryptedEnterpriseKey,
        )
        appSpecTemp.enterprise = encryptedEnterprise
        appSpecTemp.contacts = []
        appSpecTemp.compose = []
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

    console.log(appSpecTemp)
    const response = await props.executeLocalCommand(
      '/apps/verifyappupdatespecifications',
      JSON.stringify(appSpecTemp),
      null,
      true,
    )

    if (response.data?.status !== 'success') {
      showToast('error', response.data?.message || response.data)
      
      return false
    }
    appSpecFormated.value = response.data.data

    return true
  } catch (error) {
    showToast('error', error)
    
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
      const height = renewalEnabled.value ? blockHeight.value : props.appSpec.height

      console.log(expireBlocks)

      if (typeof height === 'number') {
        blocksToExpire.value = height + expireBlocks - blockHeight.value
        console.log(blocksToExpire.value)
        isExpiryValid.value = blocksToExpire.value >= 5000
      } else {
        isExpiryValid.value = false
      }
    } else {
      blockHeight.value = null
      isExpiryValid.value = false
    }
  } catch (err) {
    blockHeight.value = null
    isExpiryValid.value = false
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
  dataToSign.value = `${updatetype}${version}${JSON.stringify(appSpecFormated.value)}${timestamp.value}`
  await signMethod()
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
async function initSignZelcore() {
  try {
    const message = dataToSign.value
    const icon = 'https%3A%2F%2Fraw.githubusercontent.com%2Frunonflux%2Fflux%2Fmaster%2FzelID.svg'
    let protocol = `zel:?action=sign&message=${encodeURIComponent(message)}&icon=${icon}&callback=${callbackValue.value}`

    if (!window.zelcore && message.length > 1800) {
      const publicid = Math.floor(Math.random() * 999999999999999).toString()
      await axios.post('https://storage.runonflux.io/v1/public', {
        publicid,
        public: message,
      })
      protocol = `zel:?action=sign&message=FLUX_URL=https://storage.runonflux.io/v1/public/${publicid}&icon=${icon}&callback=${callbackValue.value}`
    }

    const a = document.createElement('a')
    a.href = protocol
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (error) {
    showToast('error', `Zelcore sign error: ${error}`)
  }
}

async function initiateSignWSUpdate() {
  await initSignZelcore()
  let wsURL = localStorage.getItem("backendURL") || getDetectedBackendURL()
  wsURL = wsURL.replace('https://', 'wss://').replace('http://', 'ws://')

  const sigMsg = `${props.appSpec.owner}${timestamp.value}`

  const uri = `${wsURL}/ws/sign/${sigMsg}`
  console.log(uri)
  websocket.value = new WebSocket(uri)

  websocket.value.onopen = onOpen
  websocket.value.onclose = onClose
  websocket.value.onerror = onError
  websocket.value.onmessage = onMessage
}

function onMessage(evt) {
  const parsed = qs.parse(evt.data)
  console.log(evt)
  if (parsed.status === 'success' && parsed.data?.signature) {
    signature.value = parsed.data.signature
  }
}
function onOpen(evt) { console.log('WS open', evt) }
function onClose(evt) { console.log('WS closed', evt) }
function onError(evt) { console.error('WS error', evt) }

// === WalletConnect ===
async function initSignWalletConnect() {
  try {
    if (!signClient.value) {
      signClient.value = await SignClient.init({
        projectId: 'fluxapp',
        metadata: {
          name: 'Flux App',
          description: 'Flux Login',
          url: window.location.origin,
          icons: [],
        },
      })
    }

    const session = signClient.value.session.getAll().at(-1)
    if (!session) {
      return
    }

    const result = await signClient.value.request({
      topic: session.topic,
      chainId: 'eip155:1',
      request: {
        method: 'personal_sign',
        params: [dataToSig.value, session.namespaces.eip155.accounts[0].split(':')[2]],
      },
    })

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
    if (!window.ssp) {
      showToast('error', 'SSP Wallet not found')
      
      return
    }

    const res = await window.ssp.request('sspwid_sign_message', {
      message: dataToSign.value,
    })

    if (res.status === 'ERROR') throw new Error(res.data || res.result)

    signature.value = res.signature
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
</style>
