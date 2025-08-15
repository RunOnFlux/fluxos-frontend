<template>
  <VCard flat>
    <VTabs
      v-model="tab"
      grow
      density="comfortable"
      class="v-tabs-pill"
    >
      <VTab
        :value="0"
        class="mx-1"
      >
        <div class="d-flex align-center tab-content">
          <VIcon
            class="mr-2"
            style="font-size: 22px !important; height: 22px !important; width: 22px !important;"
          >
            mdi-database-arrow-up
          </VIcon>
          <span>Backup</span>
        </div>
      </VTab>

      <VTab
        :value="1"
        class="mx-1"
      >
        <div class="d-flex align-center tab-content">
          <VIcon
            class="mr-2"
            style="font-size: 22px !important; height: 22px !important; width: 22px !important;"
          >
            mdi-database-arrow-down
          </VIcon>
          <span>Restore</span>
        </div>
      </VTab>
    </VTabs>

    <VWindow v-model="tab">
      <!-- Backup Tab -->
      <VWindowItem :value="0">
        <div class="mx-8 mt-6">
          <!-- Section Header -->
          <VRow class="align-center justify-space-between mb-3">
            <VCol
              cols="12"
              class="d-flex align-center pb-0"
            >
              <div class="d-flex w-100 align-center border-frame">
                <div class="d-flex align-center">
                  <VAvatar
                    size="35"
                    color="success"
                    variant="tonal"
                    rounded="sm"
                    class="mr-2 ml-1"
                  >
                    <VIcon size="26">
                      mdi-database-arrow-up
                    </VIcon>
                  </VAvatar>
                  <span class="text-h5">Backup Container Data</span>
                </div>
              </div>
            </VCol>
          </VRow>

          <!-- Component Selector -->
          <VAutocomplete
            v-model="selectedBackupComponents"
            :items="componentAvailableOptions"
            multiple
            chips
            closable-chips
            placeholder="Select component(s) to backup"
            hide-selected
            hide-no-data
            class="mb-4 red-hover"
            clearable
            rounded
          />

          <!-- Action Buttons -->
          <div class="d-flex mb-4 gap-2">
            <VBtn
              variant="outlined"
              color="primary"
              density="comfortable"
              @click="addAllTags"
            >
              <VIcon
                start
                size="19"
              >
                mdi-checkbox-multiple-marked
              </VIcon>
              Select all
            </VBtn>

            <VBtn
              variant="outlined"
              color="primary"
              density="comfortable"
              :disabled="selectedBackupComponents.length === 0 || backupProgress"
              @click="createBackup(selectedBackupComponents)"
            >
              <VIcon
                start
                size="19"
              >
                mdi-database-arrow-up
              </VIcon>
              Create Backup
            </VBtn>
          </div>

          <!-- Progress Section -->
          <Transition name="fade">
            <div
              v-if="backupProgress || showProgressBar"
              class="pa-4 border rounded"
            >
              <div class="d-flex align-center justify-center">
                <VProgressCircular
                  indeterminate
                  size="20"
                  class="mr-2"
                />
                <span style="font-size: 15px">{{ tarProgress }}</span>
              </div>

              <div
                v-if="showProgressBar"
                class="mb-2"
              />

              <div
                v-for="(item, index) in computedFileProgress"
                :key="index"
              >
                <VProgressLinear
                  :model-value="item.progress"
                  height="16"
                  class="mb-2"
                  color="success"
                >
                  <template #default>
                    <div class="text-white text-caption px-2">
                      {{ item.fileName }} - {{ item.progress.toFixed(2) }}%
                    </div>
                  </template>
                </VProgressLinear>
              </div>
            </div>
          </Transition>
          <!-- Backup Table Section -->
          <div
            v-if="backupList.length > 0 && !showProgressBar && !backupProgress"
            class="mt-6"
          >
            <div class="d-flex justify-space-between align-center mb-2">
              <VChip
                class="current-task-chip"
                variant="tonal"
                rounded="pill"
              >
                <template #prepend>
                  <VIcon
                    size="24"
                    class="mr-1"
                  >
                    mdi-lifebuoy
                  </VIcon>
                </template>
                <span style="font-size: 16px;">Available Local Backups</span>
              </VChip>
           
              <!-- Action Buttons -->
              <div
                class="d-flex align-center"
                style="gap: 8px;"
              >
                <!-- Download Menu -->
                <VMenu>
                  <template #activator="{ props: btnProps }">
                    <VBtn
                      v-bind="btnProps"
                      icon
                      color="primary"
                      density="compact"
                    >
                      <VIcon>
                        mdi-download
                      </VIcon>
                    </VBtn>
                  </template>
                  <VList>
                    <VListItem
                      :disabled="selectedBackup?.length === 0"
                      @click="downloadAllBackupFiles(selectedBackup)"
                    >
                      <VListItemTitle>
                        <VIcon
                          start
                          size="20"
                        >
                          mdi-progress-check
                        </VIcon>
                        Download selected
                      </VListItemTitle>
                    </VListItem>
                    <VListItem @click="downloadAllBackupFiles(backupList)">
                      <VListItemTitle>
                        <VIcon
                          start
                          size="20"
                        >
                          mdi-download-circle-outline
                        </VIcon>
                        Download all
                      </VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>

                <!-- Remove All Button -->
                <VBtn
                  id="remove-all"
                  v-tooltip.bottom="'Remove all backup files'"
                  class="mr-2"
                  icon
                  color="error"
                  density="compact"
                >
                  <VIcon>
                    mdi-trash-can-outline
                  </VIcon>
                </VBtn>
                <ConfirmCustomDialog
                  target="remove-all"
                  confirm-button="Remove all backup files"
                  @confirm="deleteLocalBackup(null, backupList)"
                />
              </div>
            </div>

            <!-- Backup Table -->
            <VSheet
              border
              rounded
              class="mt-2"
              style="max-height: 400px;"
            >
              <VDataTable
                v-model="selectedBackup"
                :items="backupList"
                :headers="backupTableHeaders"
                class="elevation-1 overflow-hidden"
                show-select
                hide-default-footer
                return-object
                density="compact"
                item-value="file"
                :row-props="getRowProps"
              >
                <template #top>
                  <div class="px-4 pt-2 pb-2 text-center top-header">
                    <div class="text-subtitle-1 font-weight-medium">
                      List of available backups on the local machine (backups are automatically deleted 24 hours after creation)
                    </div>
                  </div>
                  <VDivider />
                </template>
                <template #item.component="{ item }">
                  <div class="d-flex justify-space-between align-center">
                    <VChip
                      class="current-task-chip"
                      variant="tonal"
                      size="small"
                      color="success"
                      rounded="pill"
                    >
                      <template #prepend>
                        <VIcon
                          size="20"
                          class="mr-1"
                        >
                          mdi-cube
                        </VIcon>
                      </template>
                      <span style="font-size: 14px;">                  
                        {{ item.component }}
                      </span>
                    </VChip>
                  </div>
                </template>
                <template #item.file_size="{ item }">
                  <span style="white-space: nowrap;">{{ addAndConvertFileSizes(item.file_size) }}</span>
                </template>
                <template #item.create="{ item }">
                  <VChip
                    class="current-task-chip"
                    variant="tonal"
                    size="small"
                    color="warning"
                    rounded="pill"
                  >
                    <template #prepend>
                      <VIcon
                        size="20"
                        class="mr-1"
                      >
                        mdi-timer-cog
                      </VIcon>
                    </template>
                    <span style="white-space: nowrap; font-size: 14px">{{ formatDateTime(item.create) }}</span>
                  </VChip>
                </template>
                <template #item.expire="{ item }">
                  <VChip
                    class="current-task-chip"
                    variant="tonal"
                    size="small"
                    color="error"
                    rounded="pill"
                  >
                    <template #prepend>
                      <VIcon
                        size="20"
                        class="mr-1"
                      >
                        mdi-timer-remove
                      </VIcon>
                    </template>
                    <span style="white-space: nowrap; font-size: 14px">{{ formatDateTime(item.create, true) }}</span>
                  </VChip>
                </template>
                <template #item.actions="{ item }">
                  <div class="d-flex gap-2">
                    <VBtn
                      v-tooltip.bottom="'Download backup file'"
                      icon
                      density="compact"
                      variant="tonal"
                      @click="downloadAllBackupFiles([{ component: item.component, file: item.file }])"
                    >
                      <VIcon size="19">
                        mdi-cloud-download
                      </VIcon>
                    </VBtn>
                    <VBtn
                      :id="`remove-${item.component}`"
                      v-tooltip.bottom="'Remove backup file'"
                      icon
                      color="error"
                      variant="tonal"
                      density="compact"
                    >
                      <VIcon size="19">
                        mdi-trash-can-outline
                      </VIcon>
                    </VBtn>
                    <ConfirmCustomDialog
                      :target="`remove-${item.component}`"
                      confirm-button="Remove backup file"
                      @confirm="deleteLocalBackup(item.component, backupList, item.file)"
                    />
                  </div>
                </template>
              </VDataTable>
            </VSheet>
            <span
              class="ml-2"
              style="font-size: 0.9rem;"
            >Select application component(s) you would like to upload</span>
          </div>
          <div v-if="backupList.length > 0 && !showProgressBar && !backupProgress">
            <VRow class="align-center justify-space-between mt-2">
              <VCol
                cols="12"
                class="d-flex align-center pb-0"
              >
                <div class="d-flex w-100 align-center border-frame">
                  <div class="d-flex align-center">
                    <VAvatar
                      size="35"
                      color="success"
                      variant="tonal"
                      rounded="sm"
                      class="mr-2 ml-1"
                    >
                      <VIcon size="26">
                        mdi-server
                      </VIcon>
                    </VAvatar>
                    <span class="text-h5">Choose your storage method</span>
                  </div>
                </div>
              </VCol>
              <VBtnToggle
                v-model="selectedStorageMethod"
                mandatory
                color="primary"
                class="ml-2"
                style="border: none;"
                group
              >
                <VBtn
                  v-for="method in storageMethod"
                  :key="method.value"
                  :value="method.value"
                  :disabled="method.disabled"
                  style="min-width: 150px; max-width: 200px;"
                  class="mr-2"
                  variant="tonal"
                  size="small"
                  density="compact"
                >               
                  {{ method.text }}
                </VBtn>
              </VBtnToggle>
            </VRow>
          </div>
          <div
            v-if="selectedStorageMethod === 'flux' && backupList.length > 0 && !showProgressBar && !backupProgress"
            style="font-size: 0.9rem;"
          >
            <div>
              <ul
                class="mt-2 ml-8"
                style="font-size: 0.9rem; text-align: left;"
              >
                <li>Free FluxDrive backups! Up to 10GB total to use per user</li>
                <li>FluxDrive backups can be downloaded on Restore page</li>
              </ul>
            </div>


            <div v-if="computedFileProgressFD.length > 0">
              <div class="mt-1">
                <div class="mb-3 mt-3 w-100 pa-4 border rounded">
                  <h5 style="font-size: 16px; margin-bottom: 8px;">
                    <span class="d-flex align-center justify-center">
                      <VProgressCircular
                        indeterminate
                        size="20"
                        class="mr-2"
                      /> {{ fluxDriveUploadStatus }}
                    </span>
                  </h5>

                  <VProgressLinear
                    v-for="(item, index) in computedFileProgressFD"
                    :key="index"
                    :model-value="item.progress"
                    class="mt-1"
                    style="height: 16px;"
                    :max="100"
                    color="success"
                  >
                    <template #default="{ value }">
                      <span
                        class="text-white text-caption"
                        style="font-size: 0.85rem;"
                      >
                        {{ `${item.fileName} - ${value.toFixed(2)}%` }}
                      </span>
                    </template>
                  </VProgressLinear>
                </div>
              </div>
            </div>
            <div class="text-center">
              <VBtn
                class="mt-4"
                :disabled="selectedBackup.length === 0 && uploadProgress === false"
                style="width: 100%"
                variant="flat"
                color="primary"
                @click="uploadToFluxDrive"
              >
                <VIcon
                  class="mr-1"
                  size="1.5rem"
                >
                  mdi-cloud-upload
                </VIcon>
                Upload Selected Components
              </VBtn>
            </div>
          </div>
        </div>
      </VWindowItem>

      <!-- Restore Tab -->
      <VWindowItem :value="1">
        <VCardText>
          <VRow class="align-center justify-space-between mb-3">
            <VCol
              cols="12"
              class="d-flex align-center pb-0"
            >
              <div class="d-flex w-100 align-center border-frame">
                <div class="d-flex align-center">
                  <VAvatar
                    size="35"
                    color="success"
                    variant="tonal"
                    rounded="sm"
                    class="mr-2 ml-1"
                  >
                    <VIcon size="26">
                      mdi-cloud-download
                    </VIcon>
                  </VAvatar>
                  <span class="text-h5">Select Restore Method</span>
                </div>
              </div>
            </VCol>
          </VRow>

          <VRadioGroup
            v-model="selectedRestoreOption"
            inline
            class="mb-2 fit-to-content-with-border"
            color="primary"
          >
            <VRadio
              label="FluxDrive"
              value="FluxDrive"
            />
            <VRadio
              label="Upload File"
              value="Upload File"
            />
            <VRadio
              label="Remote URL"
              value="Remote URL"
              class="mr-2"
            />
          </VRadioGroup>

          <div v-if="selectedRestoreOption === 'FluxDrive'">
            <VSheet
              class="mt-2 overflow-hidden"
              border
              rounded
            >
              <VDataTable
                v-model:expanded="expanded"
                :items="checkpoints"
                :headers="fluxDriveHeaders"
                item-value="timestamp"
                class="elevation-1"
                hide-default-footer
                :hide-default-header="checkpoints.length === 0"
                density="compact"
                :row-props="uniformRowProps"
              >
                <template #top>
                  <div class="d-flex px-4 pt-2 pb-2 justify-center align-center top-header">
                    <VIcon
                      size="22"
                      class="mr-1"
                    >
                      mdi-archive-sync
                    </VIcon>
                    <div class="text-subtitle-1 font-weight-medium">
                      <b>Backups Inventory</b>
                    </div>
                  </div>
                  <VDivider />
                </template>
                <template #item.actions="{ item }">
                  <div class="d-flex justify-end align-center">
                    <!-- Delete Button -->
                    <VBtn
                      :id="`remove-checkpoint-${item.timestamp}`"
                      v-tooltip.bottom="'Remove Backup'"
                      icon
                      variant="text"
                      :color="theme === 'dark' ? 'error' : 'rgba(211, 47, 47, 0.85)'"
                      class="mr-1"
                      size="small"
                    >
                      <VIcon size="19">
                        mdi-delete
                      </VIcon>
                    </VBtn>

                    <!-- Confirm Dialog for Delete -->
                    <ConfirmCustomDialog
                      :target="`remove-checkpoint-${item.timestamp}`"
                      confirm-button="Remove Backup"
                      @confirm="deleteRestoreBackup(checkpoints, item.timestamp)"
                    />

                    <!-- Add to Restore List Button -->
                    <VBtn
                      v-tooltip.bottom="'Add all to Restore List'"
                      icon
                      variant="text"
                      :color="theme === 'dark' ? 'success' : 'rgba(1, 87, 72, 0.75)'"
                      size="small"
                      @click="addAllBackupComponents(item.timestamp)"
                    >
                      <VIcon size="19">
                        mdi-plus-box-multiple
                      </VIcon>
                    </VBtn>
                  </div>
                </template>

                <template #item.timestamp="{ item: timestampItem, column }">
                  <div>
                    <div v-if="column.title === 'Name'">
                      <div class="d-flex justify-space-between align-center">
                        <VChip
                          class="current-task-chip"
                          variant="flat"
                          size="small"
                          color="success"
                          rounded="pill"
                        >
                          <template #prepend>
                            <VIcon
                              size="20"
                              class="mr-1"
                            >
                              mdi-archive-cog
                            </VIcon>
                          </template>
                          <span style="font-size: 14px;">backup_{{ timestampItem.timestamp }}</span>
                        </VChip>
                      </div>
                    </div>

                    <div v-if="column.title === 'Time'">
                      <VChip
                        class="current-task-chip"
                        variant="flat"
                        size="small"
                        color="info"
                        rounded="pill"
                      >
                        <template #prepend>
                          <VIcon
                            size="20"
                            class="mr-1"
                          >
                            mdi-timer-cog
                          </VIcon>
                        </template>
                        <span style="white-space: nowrap; font-size: 14px">{{ formatDateTime(timestampItem.timestamp) }}</span>
                      </VChip>
                    </div>
                  </div>
                </template>

                <template #expanded-row="{ columns, item: itemRow }">
                  <tr>
                    <td
                      :colspan="columns.length"
                      style="padding: 0px !important;"
                    >
                      <VDataTable
                        :items="itemRow.components"
                        :headers="nestedHeaders"
                        hide-default-footer
                        item-value="component"
                        density="compact"
                        hide-default-header
                      >
                        <template #item.component="{ item }">
                          <div class="d-flex justify-space-between align-center">
                            <VChip
                              class="current-task-chip"
                              variant="tonal"
                              size="small"
                              color="success"
                              rounded="pill"
                            >
                              <template #prepend>
                                <VIcon
                                  size="20"
                                  class="mr-1"
                                >
                                  mdi-cube
                                </VIcon>
                              </template>
                              <span style="font-size: 14px;">                  
                                {{ item.component }}
                              </span>
                            </VChip>
                          </div>
                        </template>
                        <template #item.file_url="{ item }">
                          <div class="d-flex justify-space-between align-center">
                            <VChip
                              class="current-task-chip"
                              variant="tonal"
                              size="small"
                              color="#0091EA"
                              rounded="pill"
                            >
                              <template #prepend>
                                <VIcon
                                  size="20"
                                  class="mr-1"
                                >
                                  mdi-link-box-variant
                                </VIcon>
                              </template>
                              <span style="font-size: 14px;">                  
                                <a
                                  :href="item.file_url"
                                  class="truncate-text"
                                >{{ item.file_url }}</a></span>
                            </VChip>
                          </div>
                        </template>
                        <template #item.file_size="{ item }">
                          <span style="white-space: nowrap;">{{ addAndConvertFileSizes(item.file_size) }}</span>
                        </template>

                        <template #item.actions="{ item }">
                          <div class="d-flex justify-end align-center">
                            <!-- Add to Restore List Button -->
                            <VBtn
                              v-tooltip.bottom="'Add to Restore List'"
                              icon
                              variant="text"
                              :color="theme === 'dark' ? 'success' : 'rgba(1, 87, 72, 0.75)'"
                              size="small"
                              @click="addComponent(item, itemRow.timestamp)"
                            >
                              <VIcon size="19">
                                mdi-plus-box
                              </VIcon>
                            </VBtn>
                          </div>
                        </template>
                      </VDataTable>
                    </td>
                  </tr>
                </template>

                <template #no-data>
                  <div class="py-2">
                    <p
                      class="my-0"
                      style="color: orange"
                    >
                      No backup records available
                    </p> 
                  </div>
                </template>
              </VDataTable>
            </VSheet>
            <VSheet
              v-if="newComponents.length > 0"
              class="mt-6 overflow-hidden"
              border
              rounded
            >
              <VDataTable
                :items="newComponents"
                :headers="restoreHeaders"
                item-key="component"
                density="compact"
                hide-default-footer
              >
                <template #top>
                  <div class="d-flex px-4 pt-2 pb-2 justify-center align-center top-header">
                    <VIcon
                      size="22"
                      class="mr-1"
                    >
                      mdi-lifebuoy
                    </VIcon>
                    <div class="text-subtitle-1 font-weight-medium">
                      <b>Restore Overview</b>
                    </div>
                  </div>
                  <VDivider />
                </template>


                <template #item.component="{ item }">
                  <div class="d-flex justify-space-between align-center">
                    <VChip
                      class="current-task-chip"
                      variant="tonal"
                      size="small"
                      color="success"
                      rounded="pill"
                    >
                      <template #prepend>
                        <VIcon
                          size="20"
                          class="mr-1"
                        >
                          mdi-cube
                        </VIcon>
                      </template>
                      <span style="font-size: 14px;">                  
                        {{ item.component }}
                      </span>
                    </VChip>
                  </div>
                </template>
                <template #item.timestamp="{ item }">
                  <div class="d-flex justify-space-between align-center">
                    <VChip
                      class="current-task-chip"
                      variant="tonal"
                      size="small"
                      color="warning"
                      rounded="pill"
                    >
                      <template #prepend>
                        <VIcon
                          size="20"
                          class="mr-1"
                        >
                          mdi-archive-clock
                        </VIcon>
                      </template>
                      <span style="font-size: 14px;">{{ item.timestamp }}</span>
                    </VChip>
                  </div>
                </template>

                <template #item.file_url="{ item }">
                  <div class="d-flex justify-space-between align-center">
                    <VChip
                      class="current-task-chip"
                      variant="tonal"
                      size="small"
                      color="#0091EA"
                      rounded="pill"
                    >
                      <template #prepend>
                        <VIcon
                          size="20"
                          class="mr-1"
                        >
                          mdi-link-box-variant
                        </VIcon>
                      </template>
                      <span style="font-size: 14px;">                  
                        <a
                          :href="item.file_url"
                          class="truncate-text"
                        >{{ item.file_url }}</a></span>
                    </VChip>
                  </div>
                </template>

                <template #item.file_size="{ item }">
                  <span style="white-space: nowrap;">{{ addAndConvertFileSizes(item.file_size) }}</span>
                </template>

                <template #item.actions="{ index }">
                  <div class="d-flex align-center justify-end">
                    <VBtn
                      v-tooltip.bottom="'Remove restore job'"
                      icon
                      variant="text"
                      color="error"
                      size="small"
                      @click="deleteItem(index, newComponents)"
                    >
                      <VIcon>mdi-delete</VIcon>
                    </VBtn>
                  </div>
                </template>

                <template #bottom>
                  <VDivider />
                  <th class="top-header">
                    <div class="text-center d-flex align-center justify-end mr-2 my-1">
                      <VIcon class="mr-2">
                        mdi-equal-box
                      </VIcon>
                      {{ addAndConvertFileSizes(totalArchiveFileSize(newComponents)) }}
                    </div>
                  </th>
                </template>
              </VDataTable>
            </VSheet>
            <div
              v-if="restoringFromFluxDrive"
              class="mb-2 mt-4 w-100 d-flex justify-center align-center pa-4 border rounded"
            >
              <h5
                class="text-center"
                style="font-size: 16px;"
              >
                <span v-if="restoringFromFluxDrive">
                  <VProgressCircular
                    indeterminate
                    size="20"
                    class="mr-2"
                  />
                  {{ truncateString(restoreFromFluxDriveStatus, 50) }}
                </span>
              </h5>
            </div>
            <VBtn
              v-if="newComponents.length > 0"
              :disabled="restoringFromFluxDrive"
              class="mt-4"
              block
              variant="flat"
              color="primary"
              @click="restoreFromFluxDrive(newComponents)"
            >
              <VIcon
                start
                size="22"
              >
                mdi-rotate-left
              </VIcon>
              Restore
            </VBtn>
          </div>
          <div v-if="selectedRestoreOption === 'Upload File'">
            <div class="d-flex align-center mt-2">
              <VSelect
                v-model="restoreRemoteFile"
                :items="componentAvailableOptions"
                placeholder="Select component"
                prepend-inner-icon="mdi-cube-outline"
                prepend-icon=""
                clearable
              />
              <VBtn
                icon
                color="primary"
                :disabled="!restoreRemoteFile"
                class="ml-2"
                @click="selectFiles"
              >
                <VIcon size="24">
                  mdi-cloud-upload
                </VIcon>
              </VBtn>
              <VFileInput
                id="file-selector"
                ref="fileselector"
                v-model="fileselector"
                type="file"
                accept=".tar.gz"
                style="display: none;"
                @change="handleFiles"
              />
            </div>
            <VSheet
              v-if="files.length > 0"
              class="mt-4 overflow-hidden"
              border
              rounded
            >
              <VDataTable
                :items="files"
                :headers="restoreHeadersLocal"
                item-key="component"
                density="compact"
                hide-default-footer
              >
                <template #top>
                  <div class="d-flex px-4 pt-2 pb-2 justify-center align-center top-header">
                    <VIcon
                      size="22"
                      class="mr-1"
                    >
                      mdi-lifebuoy
                    </VIcon>
                    <div class="text-subtitle-1 font-weight-medium">
                      <b>Restore Overview</b>
                    </div>
                  </div>
                  <VDivider />
                </template>

                <template #item.component="{ item }">
                  <div class="d-flex justify-space-between align-center">
                    <VChip
                      class="current-task-chip"
                      variant="tonal"
                      size="small"
                      color="success"
                      rounded="pill"
                    >
                      <template #prepend>
                        <VIcon
                          size="20"
                          class="mr-1"
                        >
                          mdi-cube
                        </VIcon>
                      </template>
                      <span style="font-size: 14px;">                  
                        {{ item.component }}
                      </span>
                    </VChip>
                  </div>
                </template>

                <template #item.file_name="{ item }">
                  <div class="d-flex justify-space-between align-center">
                    <VChip
                      class="current-task-chip"
                      variant="tonal"
                      size="small"
                      color="#0091EA"
                      rounded="pill"
                    >
                      <template #prepend>
                        <VIcon
                          size="20"
                          class="mr-1"
                        >
                          mdi-zip-box
                        </VIcon>
                      </template>
                      <span style="font-size: 14px;">                  
                        {{ item.file_name }}
                      </span>
                    </VChip>
                  </div>
                </template>

                <template #item.file_size="{ item }">
                  <span style="white-space: nowrap;">{{ addAndConvertFileSizes(item.file_size) }}</span>
                </template>

                <template #item.actions="{ item }">
                  <div class="d-flex align-center justify-end">
                    <VBtn
                      v-tooltip.top="'Remove restore job'"
                      icon
                      variant="text"
                      color="error"
                      size="small"
                      @click="removeFile(item)"
                    >
                      <VIcon>mdi-delete</VIcon>
                    </VBtn>
                  </div>
                </template>

                <template #bottom>
                  <VDivider />
                  <th class="top-header">
                    <div class="text-center d-flex align-center justify-end mr-2 my-1">
                      <VIcon class="mr-2">
                        mdi-equal-box
                      </VIcon>
                      <span style="font-size: 14px;">{{ addAndConvertFileSizes(totalArchiveFileSize(files)) }}</span>
                    </div>
                  </th>
                </template>
              </VDataTable>
            </VSheet>

            <div
              v-if="restoreFromUpload"
              class="mb-2 mt-4 w-100 pa-4 border rounded"
            >
              <h5
                class="text-center"
                style="font-size: 16px;"
              >
                <span
                  v-if="restoreFromUpload"
                  class="d-flex justify-center align-center"
                  :class="[
                    { 'mb-2': uploadingFiles.length > 0 }
                  ]"
                >
                  <VProgressCircular
                    indeterminate
                    size="20"
                    class="mr-2"
                  />
                  {{ truncateString(restoreFromUploadStatus, 50) }}
                </span>
              </h5>
              <div
                v-for="file in uploadingFiles"
                :key="file.file_name"
                class="upload-item mb-1 w-100"
              >
                <VProgressLinear
                  v-if="file.uploading"
                  :model-value="file.progress"
                  max="100"
                  height="16"
                  color="success"
                >
                  <template #default="{ value }">
                    <span
                      class="text-white text-caption"
                      style="font-size: 0.85rem;"
                    >
                      {{ `${file.file_name} - ${value.toFixed(2)}%` }}
                    </span>
                  </template>
                </VProgressLinear>
              </div>
            </div>

            <VBtn
              v-if="files.length > 0"
              class="mt-4"
              block
              color="primary"
              :disabled="restoreFromUpload"
              @click="restoreFromLocalFile"
            >
              <VIcon
                start
                size="22"
              >
                mdi-rotate-left
              </VIcon>
              Restore
            </VBtn>
          </div>
          <div v-if="selectedRestoreOption === 'Remote URL'">
            <VTextField
              v-model="restoreRemoteUrl"
              placeholder="Enter the URL for your remote backup archive"
              class="mb-4 mt-2"
              prepend-inner-icon="mdi-web"
              prepend-icon=""
              type="url"
              clearable
              :rules="urlValidationRules"
            />

            <div class="d-flex justify-space-between align-center">
              <VSelect
                v-model="restoreRemoteComponent"
                :items="componentAvailableOptions"
                placeholder="Select component"
                prepend-inner-icon="mdi-cube-outline"
                prepend-icon=""
                clearable
              />
              <VBtn
                v-tooltip.top="'Add to Restore List'"
                icon
                variant="flat"
                class="ml-2"
                color="primary"
                :disabled="!restoreRemoteUrl || !restoreRemoteComponent"
                @click="addRemoteUrlItem(props.appSpec.name, restoreRemoteComponent)"
              >
                <VIcon>
                  mdi-plus
                </VIcon>
              </VBtn>
            </div>

            <VSheet
              v-if="restoreRemoteUrlItems.length > 0"
              class="mt-4 overflow-hidden"
              border
              rounded
            >
              <VDataTable
                :items="restoreRemoteUrlItems"
                :headers="restoreHeadersRemote"
                item-key="component"
                density="compact"
                hide-default-footer
              >
                <template #top>
                  <div class="d-flex px-4 pt-2 pb-2 justify-center align-center top-header">
                    <VIcon
                      size="22"
                      class="mr-1"
                    >
                      mdi-lifebuoy
                    </VIcon>
                    <div class="text-subtitle-1 font-weight-medium">
                      <b>Restore Overview</b>
                    </div>
                  </div>
                  <VDivider />
                </template>

                <template #item.timestamp="{ item }">
                  <div class="d-flex justify-space-between align-center">
                    <VChip
                      class="current-task-chip"
                      variant="tonal"
                      size="small"
                      color="warning"
                      rounded="pill"
                    >
                      <template #prepend>
                        <VIcon
                          size="20"
                          class="mr-1"
                        >
                          mdi-archive-clock
                        </VIcon>
                      </template>
                      <span style="font-size: 14px;">{{ item.timestamp }}</span>
                    </VChip>
                  </div>
                </template>

                <template #item.component="{ item }">
                  <div class="d-flex justify-space-between align-center">
                    <VChip
                      class="current-task-chip"
                      variant="tonal"
                      size="small"
                      color="success"
                      rounded="pill"
                    >
                      <template #prepend>
                        <VIcon
                          size="20"
                          class="mr-1"
                        >
                          mdi-cube
                        </VIcon>
                      </template>
                      <span style="font-size: 14px;">                  
                        {{ item.component }}
                      </span>
                    </VChip>
                  </div>
                </template>

                <template #item.url="{ item }">
                  <div class="d-flex justify-space-between align-center">
                    <VChip
                      class="current-task-chip"
                      variant="tonal"
                      size="small"
                      color="#0091EA"
                      rounded="pill"
                    >
                      <template #prepend>
                        <VIcon
                          size="20"
                          class="mr-1"
                        >
                          mdi-link-box-variant
                        </VIcon>
                      </template>
                      <span style="font-size: 14px;">                  
                        <a
                          :href="item.url"
                          class="truncate-text"
                        >{{ item.url }}</a></span>
                    </VChip>
                  </div>
                </template>

                <template #item.file_size="{ item }">
                  <span style="white-space: nowrap;">{{ addAndConvertFileSizes(item.file_size) }}</span>
                </template>

                <template #item.actions="{ index }">
                  <div class="d-flex align-center justify-end">
                    <VBtn
                      v-tooltip.top="'Remove restore job'"
                      icon
                      variant="text"
                      color="error"
                      size="small"
                      @click="deleteItem(index, restoreRemoteUrlItems)"
                    >
                      <VIcon>mdi-delete</VIcon>
                    </VBtn>
                  </div>
                </template>

                <template #bottom>
                  <VDivider />
                  <th class="top-header">
                    <div class="text-center d-flex align-center justify-end mr-2 my-1">
                      <VIcon class="mr-2">
                        mdi-equal-box
                      </VIcon>
                      <span style="font-size: 14px;">{{ addAndConvertFileSizes(totalArchiveFileSize(restoreRemoteUrlItems)) }}</span>
                    </div>
                  </th>
                </template>
              </VDataTable>
            </VSheet>

            <div
              v-if="downloadingFromUrl"
              class="mb-2 mt-4 w-100 d-flex justify-center align-center pa-4 border rounded"
            >
              <h5
                class="text-center"
                style="font-size: 16px;"
              >
                <span v-if="downloadingFromUrl">
                  <VProgressCircular
                    indeterminate
                    size="20"
                    class="mr-2"
                  />
                  {{ truncateString(restoreFromRemoteURLStatus, 50) }}
                </span>
              </h5>
            </div>

            <VBtn
              v-if="restoreRemoteUrlItems.length > 0"
              class="mt-4"
              block
              color="primary"
              :disabled="!restoreRemoteUrl || !restoreRemoteComponent || downloadingFromUrl"
              @click="restoreFromRemoteFile"
            >
              <VIcon
                start
                size="22"
              >
                mdi-rotate-left
              </VIcon>
              Restore
            </VBtn>
          </div>
        </VCardText>
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
</template>

<script setup>
import axios from "axios"
import { storeToRefs } from "pinia"
import { useConfigStore } from "@core/stores/config"

const props = defineProps({
  appSpec: { 
    type: Object, 
    required: true, 
  },
  executeLocalCommand: { 
    type: Function, 
    required: true, 
  },
  isComposeSingle: { 
    type: Boolean, 
    required: true,
  },
  ipAccess: {
    type: Boolean, 
    required: true,
  },
  currentInstanceIp: { 
    type: String,
    required: true,
  },
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
  // Clear previous timeout if any
  if (snackbarTimeout) clearTimeout(snackbarTimeout)

  // Update snackbar content
  snackbar.value = {
    model: false, // force reset
    text: message,
    icon: icon || {
      success: 'mdi-check-circle',
      error: 'mdi-alert-circle',
      warning: 'mdi-alert',
      info: 'mdi-information',
      danger: 'mdi-alert-circle',
    }[type] || 'mdi-information',
    color: type === 'danger' ? 'error' : type,
    timeout,
  }

  // Show it slightly delayed to retrigger animation if needed
  requestAnimationFrame(() => {
    snackbar.value.model = true
  })

  // Auto-close
  snackbarTimeout = setTimeout(() => {
    snackbar.value.model = false
  }, timeout)
}

function truncateString(str, limit) {
  if (str.length > limit) {
    return str.slice(0, limit) + '...'
  }
  
  return str
}

const tab = ref(0)
const selectedBackupComponents = ref([])

const selectedBackup = ref([])

const componentAvailableOptions = computed(() => {
  return (props.appSpec.compose || []).map(c => c.name)
})

const zelidHeader = computed(() => {
  const zelidauth = localStorage.getItem('zelidauth')

  return {
    zelidauth,
  }
})

const backupTableHeaders = [
  { title: 'Component', key: 'component' },
  { title: 'Size', key: 'file_size' },
  { title: 'Created', key: 'create' },
  { title: 'Expires', key: 'expire' },
  { title: 'Actions', key: 'actions' },
]

const fileProgressFD = ref([])
const restoringFromFluxDrive = ref(false)
const checkpoints  = ref ([])
const expanded = computed(() => checkpoints.value.map(item => item.timestamp))
const backupList = ref([])
const fluxDriveBackups = ref([])
const fileProgress = ref([])
const computedFileProgress = computed(() => fileProgress.value)
const fluxDriveUploadTask = ref([])
const fluxDriveEndPoint = ref('https://mws.fluxdrive.runonflux.io')
const restoreComponents = ref([])
const newComponents = ref([])
const uploadProgress = ref(false)
const showFluxDriveProgressBar = ref(false)
const fluxDriveUploadStatus = ref(false)
const fileselector = ref(null)
const files = ref([])
const restoreRemoteFile = ref(null)
const downloadingFromUrl = ref(false)
const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)

const refMap = { backupList, fluxDriveBackups, files }

const uploadingFiles = computed(() => {
  return files.value.filter(file => file.uploading)
})

function addAllTags() {
  selectedBackupComponents.value = [...componentAvailableOptions.value]
}

function uniformRowProps() {
  return {
    style: {
      backgroundColor: 'rgba(55, 71, 79, 0.4)',
    },
  }
}


async function loadBackupList(type = 'local', itemsList = 'backupList') {
  const name = props.appSpec.name
  const resultList = []
  for (const componentItem of componentAvailableOptions.value) {

    let backupItem 
    try {
      const volumeInfo = await props.executeLocalCommand(`/backup/getvolumedataofcomponent/${name}/${componentItem}/B/0/mount`, null, null, true)
      const volumePath = volumeInfo.data?.data
      const backupFile = await props.executeLocalCommand(`/backup/getlocalbackuplist/${encodeURIComponent(`${volumePath.mount}/backup/${type}`)}/B/0/true/${name}`, null, null, true)
      backupItem = backupFile.data?.data
      if (Array.isArray(backupItem)) {
        const BackupItem = {
          component: componentItem,
          create: +backupItem[0].create,
          // eslint-disable-next-line camelcase
          file_size: backupItem[0].size,
          file: `${volumePath.mount}/backup/${type}/${backupItem[0].name}`,
          // eslint-disable-next-line camelcase
          file_name: backupItem[0].name,
        }

        resultList.push(BackupItem)
      }
      refMap[itemsList].value = resultList
    } catch {
      return
    }
  }
}

function addAndConvertFileSizes(size) {
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  while (size > 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  
  return `${size.toFixed(2)} ${units[index]}`
}

function formatDateTime(date, isExpire = false) {
  const d = new Date(date)
  if (isExpire) {
    d.setDate(d.getDate() + 1) // Add 1 day

    const now = new Date()
    const diffMs = d - now

    if (diffMs > 0) {
      const totalSeconds = Math.floor(diffMs / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      const timeLeft = ` (${hours}h ${minutes}m ${seconds}s left)`
      
      return d.toLocaleString() + timeLeft
    } else {
      return d.toLocaleString() + ` (expired)`
    }
  }

  return d.toLocaleString()
}

const selectedRestoreOption = ref('FluxDrive')

const fluxDriveHeaders = [
  { key: 'timestamp', title: 'Name', sortable: false },
  { key: 'timestamp', title: 'Time', sortable: false },
  { title: '', value: 'actions', sortable: false },
]

const deleteRestoreBackup = async (restoreItem, timestamp = 0) => {
  if (timestamp !== 0) {
    newComponents.value = newComponents.value.filter(item => item.timestamp !== timestamp)
    try {
      const zelidauth = localStorage.getItem('zelidauth')

      const axiosConfig = {
        headers: {
          zelidauth,
        },
      }

      const data = {
        appname: props.appSpec.name,
        timestamp,
      }

      const response = await axios.post(`${fluxDriveEndPoint.value}/removeCheckpoint`, data, axiosConfig)

      if (response && response.data && response.data.status === 'success') {
        const backupIndex = restoreItem.findIndex(item => item.timestamp === timestamp)

        restoreItem.splice(backupIndex, 1)
        showToast('success', 'Checkpoint backup removed successfully.')
        
        return true
      }
      showToast('danger', response.data.data.message)
      
      return false
    } catch (error) {
      console.error('Error removing checkpoint', error)
      showToast('danger', 'Error removing checkpoint')
    }
  }
  
  return false
}

const restoreFromLocalFile = async () => {
  showTopUpload.value = false
  restoreFromUpload.value = true
  restoreFromUploadStatus.value = 'Uploading...'

  try {
    // Process the file uploads
    const uploadPromises = files.value.map(f =>
      new Promise(async (resolve, reject) => {
        if (!f.uploaded && !f.uploading && f.selected_file) {
          try {
            await upload(f)
            resolve()
          } catch (error) {
            reject(error)
          }
        } else {
          resolve()
        }
      }),
    )

    await Promise.all(uploadPromises)

    // Reset the file states
    files.value.forEach(entry => {
      entry.uploading = false
      entry.uploaded = false
      entry.progress = 0
    })

    restoreFromUploadStatus.value = 'Initializing restore jobs...'

    const postLayout = buildPostBody('restore', 'upload')
    let postRestoreData

    for (const componentName of files.value) {
      postRestoreData = updateJobStatus(postLayout, componentName.component, 'restore')
    }

    const zelidauth = localStorage.getItem('zelidauth')

    const headers = {
      zelidauth,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      Connection: 'keep-alive',
    }

    const url = props.currentInstanceIp.split(':')[0]
    const urlPort = props.currentInstanceIp.split(':')[1] || 16127
    let queryUrl = `https://${url.replace(/\./g, '-')}-${urlPort}.node.api.runonflux.io/apps/appendrestoretask`

    if (props.ipAccess) {
      queryUrl = `http://${url}:${urlPort}/apps/appendrestoretask`
    }

    const response = await fetch(queryUrl, {
      method: 'POST',
      body: JSON.stringify(postRestoreData),
      headers,
    })

    const reader = response.body.getReader()

    await new Promise((resolve, reject) => {
      const push = () => {
        reader.read().then(async ({ done, value }) => {
          if (done) {
            resolve()
            
            return
          }
          const chunkText = new TextDecoder('utf-8').decode(value)
          const chunks = chunkText.split('\n')

          await processChunks(chunks, 'restore_upload')
          push()
        }).catch(reject)
      }

      push()
    })

    restoreFromUpload.value = false
    restoreFromUploadStatus.value = ''
    loadBackupList('upload', 'files')
    showToast('success', 'Restore completed successfully')
  } catch (error) {
    console.error('Upload failed', error)
    restoreFromUpload.value = false
    restoreFromUploadStatus.value = 'Error during upload'
    showToast('error', 'Restore failed')
  }
}

const restoreRemoteUrl = ref('')
const restoreRemoteComponent = ref(null)

const restoreFromRemoteFile = async () => {
  showTopRemote.value = false
  downloadingFromUrl.value = true
  restoreFromRemoteURLStatus.value = 'Initializing restore jobs...'
  
  const zelidauth = localStorage.getItem('zelidauth')

  try {
    const headers = {
      zelidauth,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      Connection: 'keep-alive',
    }

    const postLayout = buildPostBody('restore', 'remote')
    let postBackupData

    for (const componentName of restoreRemoteUrlItems.value) {
      postBackupData = updateJobStatus(postLayout, componentName.component, 'restore', restoreRemoteUrlItems.value)
    }

    const url = props.currentInstanceIp.split(':')[0]
    const urlPort = props.currentInstanceIp.split(':')[1] || 16127
    let queryUrl = `https://${url.replace(/\./g, '-')}-${urlPort}.node.api.runonflux.io/apps/appendrestoretask`

    if (props.ipAccesse) {
      queryUrl = `http://${url}:${urlPort}/apps/appendrestoretask`
    }

    const response = await fetch(queryUrl, {
      method: 'POST',
      body: JSON.stringify(postBackupData),
      headers,
    })

    const reader = response.body.getReader()

    await new Promise((resolve, reject) => {
      const push = () => {
        reader.read().then(async ({ done, value }) => {
          if (done) {
            resolve()
          
            return
          }

          const chunkText = new TextDecoder('utf-8').decode(value)
          const chunks = chunkText.split('\n')

          await processChunks(chunks, 'restore_remote')
          push()
        }).catch(reject)
      }

      push()
    })

    downloadingFromUrl.value = false
    restoreFromRemoteURLStatus.value = ''
    showToast('success', 'Restore completed successfully')
  } catch (error) {
    console.error('Upload failed', error)
    downloadingFromUrl.value = false
    restoreFromRemoteURLStatus.value = 'Error during upload'
    showToast('error', 'Restore failed')
  }
}

const nestedHeaders = [
  { key: 'component', title: 'Component', sortable: false  },
  { key: 'file_url', title: 'URL', sortable: false  },
  { key: 'file_size', title: 'Size', sortable: false  },
  { key: 'actions', title: '', sortable: false  },
]

const restoreHeaders = [
  { key: 'component', title: 'Component', sortable: false  },
  { key: 'file_url', title: 'URL', sortable: false  },
  { key: 'timestamp', title: 'Timestamp', sortable: false  },
  { key: 'file_size', title: 'Size', sortable: false  },
  { key: 'actions', title: '', sortable: false  },
]

const restoreHeadersRemote = [
  { key: 'component', title: 'Component', sortable: false  },
  { key: 'url', title: 'URL', sortable: false  },
  { key: 'file_size', title: 'Size', sortable: false  },
  { key: 'actions', title: '', sortable: false  },
]

const restoreHeadersLocal = [
  { key: 'component', title: 'Component', sortable: false  },
  { key: 'file_name', title: 'File', sortable: false  },
  { key: 'file_size', title: 'Size', sortable: false  },
  { key: 'actions', title: '', sortable: false  },
]

const restoreFromUploadStatus = ref('')
const restoreFromRemoteURLStatus = ref('')
const restoreFromFluxDriveStatus = ref('')
const tarProgress = ref('')
const alertVariant = ref('')
const alertMessage = ref('')
const showTopUpload = ref(false)
const showTopRemote = ref(false)
const showTopFluxDrive = ref(false)
const restoreRemoteUrlItems = ref([])
const backupProgress = ref(false)
const showProgressBar = ref(false)
const selectedStorageMethod = ref('flux')
const restoreFromUpload = ref(false)

const storageMethod = ref([
  { value: 'flux', disabled: false, text: 'FluxDrive' },
  { value: 'google', disabled: true, text: 'GoogleDrive' },
  { value: 'as3', disabled: true, text: 'AS3Storage' },
])

const alertRefs = {
  showTopUpload,
  showTopRemote,
  showTopFluxDrive,
}

function changeAlert(variant, text, element, state) {
  alertVariant.value = variant
  alertMessage.value = text
  if (alertRefs[element]) {
    alertRefs[element].value = state
  } else {
    console.warn(`Unknown alert element '${element}'`)
  }
}

const isValidUrl = () => {

  const urlRegex = /^(http|https):\/\/\S+$/
  const urlParts = restoreRemoteUrl.value ? restoreRemoteUrl.value.split('?') : []
  const firstPart = urlParts[0] || ''
  
  return restoreRemoteUrl.value === '' || (firstPart.endsWith('.tar.gz') && urlRegex.test(firstPart))
}

const urlValidationRules = computed(() => [
  value => {
    if (!value) return true // Allow empty URL (if needed)
    
    return isValidUrl() || 'Please enter a valid URL ending with .tar.gz' // Validation message if invalid
  },
])

async function processChunks(chunks, type) {
  const typeToRefMap = {
    // eslint-disable-next-line camelcase
    restore_upload: restoreFromUploadStatus,
    // eslint-disable-next-line camelcase
    restore_remote: restoreFromRemoteURLStatus,
    backup: tarProgress,
    // eslint-disable-next-line camelcase
    restore_fluxdrive: restoreFromFluxDriveStatus,
  }

  for (const chunk of chunks) {
    if (chunk !== '') {
      const targetRef = typeToRefMap[type]
      if (targetRef) {
        targetRef.value = chunk

        if (type === 'restore_upload') {
          if (chunk.includes('Error:')) {
            console.log(chunk)
            changeAlert('danger', chunk, 'showTopUpload', true)
          } else if (chunk.includes('Finalizing')) {
            setTimeout(() => {
              changeAlert('success', 'Restore completed successfully', 'showTopUpload', true)
            }, 5000)
          }
        } else if (type === 'restore_remote') {
          if (chunk.includes('Error:')) {
            changeAlert('danger', chunk, 'showTopRemote', true)
          } else if (chunk.includes('Finalizing')) {
            setTimeout(() => {
              changeAlert('success', 'Restore completed successfully', 'showTopRemote', true)
              restoreRemoteUrlItems.value = []
            }, 5000)
          }
        } else if (type === 'restore_fluxdrive') {
          if (chunk.includes('Error:')) {
            changeAlert('danger', chunk, 'showTopFluxDrive', true)
          } else if (chunk.includes('Finalizing')) {
            setTimeout(() => {
              changeAlert('success', 'Restore completed successfully', 'showTopFluxDrive', true)
              restoreRemoteUrlItems.value = []
            }, 5000)
          }
        }
      }
    }
  }
}

function buildPostBody(jobType, restoreType = '') {
  return {
    appname: props.appSpec.name,
    ...(jobType === 'restore' ? { type: restoreType } : {}),
    [jobType]: props.appSpec.compose.map(item => ({
      component: item.name,
      [jobType]: false,
      ...(jobType === 'restore' && restoreType === 'remote' ? { url: '' } : {}),
    })),
  }
}

function updateJobStatus(appConfig, component, jobType, urlInfoArray = []) {
  const targetComponent = appConfig[jobType].find(item => item.component === component)

  if (targetComponent) {
    // Set the jobType status to true for this component
    targetComponent[jobType] = true

    // If the jobType is 'restore' and type is 'remote', find the URL info
    if (jobType === 'restore' && appConfig?.type === 'remote') {
      const urlInfo = urlInfoArray.find(info => info.component === component)

      // If URL info exists, update the URL
      if (urlInfo) {
        targetComponent.url = urlInfo.url 
        console.log(`URL for ${component}: ${urlInfo.url}`)
      } else {
        console.log(`URL info not found for component ${component}.`)
      }
    }

    console.log(`Status for ${component} set to true for ${jobType}.`)
  } else {
    console.log(`Component ${component} not found in the ${jobType} array.`)
  }

  // Returning the updated appConfig object
  return appConfig
}

async function createBackup(selectedBackupComponents) {
  if (!selectedBackupComponents?.length) return

  backupProgress.value = true
  tarProgress.value = 'Initializing backup jobs...'

  const zelidauth = localStorage.getItem('zelidauth')

  const headers = {
    zelidauth,
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    Connection: 'keep-alive',
  }

  const postLayout = buildPostBody('backup')
  let postBackupData

  for (const componentName of selectedBackupComponents) {
    postBackupData = updateJobStatus(postLayout, componentName, 'backup')
  }

  const [url, port = '16127'] = props.currentInstanceIp.split(':')

  const queryUrl = props.ipAccess
    ? `http://${url}:${port}/apps/appendbackuptask`
    : `https://${url.replace(/\./g, '-')}-${port}.node.api.runonflux.io/apps/appendbackuptask`

  const response = await fetch(queryUrl, {
    method: 'POST',
    body: JSON.stringify(postBackupData),
    headers,
  })

  const reader = response.body.getReader()

  await new Promise(resolve => {
    function push() {
      reader.read().then(async ({ done, value }) => {
        if (done) {
          resolve()
          
          return
        }
        const chunkText = new TextDecoder('utf-8').decode(value)
        const chunks = chunkText.split('\n')

        await processChunks(chunks, 'backup')
        push()
      })
    }
    push()
  })

  setTimeout(() => {
    backupProgress.value = false
  }, 5000)

  loadBackupList()
}

function updateFileProgress(fileName, progress, loaded, total, component) {
  const index = fileProgress.value.findIndex(p => p.fileName === fileName)

  if (index !== -1) {
    // Update existing entry
    fileProgress.value[index] = {
      ...fileProgress.value[index],
      progress,
      loaded,
      total,
    }
  } else {
    // Push new entry
    fileProgress.value.push({
      fileName,
      progress,
      loaded,
      total,
      component,
    })
  }
}

async function downloadAllBackupFiles(list) {
  try {
    tarProgress.value = 'Downloading backup files...'
    showProgressBar.value = true

    const zelidauth = localStorage.getItem('zelidauth')

    const axiosConfig = {
      headers: {
        zelidauth,
      },
      responseType: 'blob',
      onDownloadProgress(progressEvent) {
        const { loaded, total, event } = progressEvent

        if (!event?.target?.responseURL) return

        try {
          const decodedUrl = decodeURIComponent(event.target.responseURL)
          const currentFileName = decodedUrl.split('/').slice(-2, -1)[0] // "backup_mongodb.tar.gz"
          const progress = total ? (loaded / total) * 100 : 0

          const match = backupList.value.find(file => file.file.includes(currentFileName))
          if (match) {
            updateFileProgress(currentFileName, progress, loaded, total, match.component)
          } else {
            console.warn('Could not match file for progress tracking:', currentFileName)
          }
        } catch (err) {
          console.warn('Error parsing responseURL in onDownloadProgress:', err)
        }
      },
    }

    const downloadPromises = list.map(async backup => {
      try {
        const file = backup.file
        const fileName = file.split('/').pop()

        const response = await props.executeLocalCommand(
          `/backup/downloadlocalfile/${encodeURIComponent(file)}/${props.appSpec.name}`,
          null,
          axiosConfig,
        )

        const blob = new Blob([response.data])
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        return true
      } catch (err) {
        console.error('Error downloading file:', err)
        
        return false
      }
    })

    const results = await Promise.all(downloadPromises)

    if (results.every(Boolean)) {
      console.log('✅ All downloads completed successfully')
    } else {
      console.warn('⚠️ Some downloads failed. See logs for details.')
    }
  } catch (err) {
    console.error('Error downloading files:', err)
  } finally {
    setTimeout(() => {
      showProgressBar.value = false
      fileProgress.value = []
      tarProgress.value = ''
    }, 5000)
  }
}

async function deleteLocalBackup(name, restoreItem, filepath = 0) {
  if (filepath === 0) {
    for (const fileData of restoreItem) {
      const filePath = fileData.file

      await props.executeLocalCommand(
        `/backup/removebackupfile/${encodeURIComponent(filePath)}/${props.appSpec.name}`,
      )
    }
    backupList.value = []
    selectedBackup.value = []
  } else {
    await props.executeLocalCommand(
      `/backup/removebackupfile/${encodeURIComponent(filepath)}/${props.appSpec.name}`,
    )

    const backupIndex = restoreItem.findIndex(item => item.component === name)
    if (backupIndex !== -1) {
      restoreItem.splice(backupIndex, 1)
    }
  }
  await loadBackupList()
}

const updateFileProgressFD = (currentFileProgress, name) => {
  const currentIndex = fileProgressFD.value.findIndex(entry => entry.fileName === name)
  if (currentIndex !== -1) {
    fileProgressFD.value[currentIndex] = { fileName: name, progress: +currentFileProgress }
  } else {
    fileProgressFD.value.push({ fileName: name, progress: +currentFileProgress })
  }
}

const computedFileProgressFD = computed(() => {
  return fileProgressFD.value.filter(item => item.progress > 0)
})

const checkFluxDriveUploadProgress = async () => {
  const zelidauth = localStorage.getItem('zelidauth')

  const axiosConfig = {
    headers: {
      zelidauth,
    },
  }

  const fluxDriveUploadTaskTmp = []
  let errorInStatusCheck = false
  for (const task of fluxDriveUploadTask.value) {
    try {
      const response = await axios.get(`${fluxDriveEndPoint.value}/gettaskstatus?taskId=${task.taskId}`, axiosConfig)
      if (response && response.data && response.data.status === 'success') {
        task.status = response.data.data.status.state
        if (task.status === 'downloading') {
          task.progress = response.data.data.status.progress / 2
        } else if (task.status === 'uploading') {
          task.progress = 50 + response.data.data.status.progress / 2
        } else {
          task.progress = response.data.data.status.progress
        }
        task.message = response.data.data.status.message
        updateFileProgressFD(task.progress, task.component)
        fluxDriveUploadStatus.value = response.data.data.status.message
        if (task.status === 'finished') {
          showToast('success', `${task.component} backup uploaded to FluxDrive successfully.`)
        } else if (task.status === 'failed') {
          showToast('danger', `Failed to upload ${task.component} backup to FluxDrive. ${fluxDriveUploadStatus.value}`)
        } else {
          fluxDriveUploadTaskTmp.push(task)
        }
      } else {
        errorInStatusCheck = true
      }
    } catch (error) {
      errorInStatusCheck = true
      console.log('error fetching upload status')
    }
  }
  if (!errorInStatusCheck) fluxDriveUploadTask.value = fluxDriveUploadTaskTmp
  if (fluxDriveUploadTask.value.length > 0) {
    setTimeout(() => {
      checkFluxDriveUploadProgress()
    }, 2000)
  } else {
    uploadProgress.value = false
    showFluxDriveProgressBar.value = false
    fluxDriveUploadStatus.value = ''
    fileProgressFD.value = []
  }
}

const uploadToFluxDrive = async () => {
  try {
    uploadProgress.value = true

    const zelidauth = localStorage.getItem('zelidauth')

    const axiosConfig = {
      headers: {
        zelidauth,
      },
    }

    let prevoiusTimestamp = 0

    const uploadPromises = selectedBackup.value.map(async backup => {
      try {
        // eslint-disable-next-line camelcase
        const { file, component, file_size, file_name, create } = backup
        let timestamp = create
        if (Math.abs(timestamp - prevoiusTimestamp) > 1000 * 60 * 60) {
          prevoiusTimestamp = timestamp
        } else {
          timestamp = prevoiusTimestamp
        }

        const url = props.currentInstanceIp.split(':')[0]
        const urlPort = props.currentInstanceIp.split(':')[1] || 16127
        const hostUrl = `https://${url.replace(/\./g, '-')}-${urlPort}.node.api.runonflux.io/backup/downloadlocalfile/${encodeURIComponent(file)}/${props.appSpec.name}`

        const data = {
          appname: props.appSpec.name,
          component,
          // eslint-disable-next-line camelcase
          filename: file_name,
          timestamp,
          host: hostUrl,
          // eslint-disable-next-line camelcase
          filesize: file_size,
        }

        console.log(data)

        const response = await axios.post(`${fluxDriveEndPoint.value}/registerbackupfile`, data, axiosConfig)
        if (response && response.data && response.data.status === 'success') {
          fluxDriveUploadTask.value.push({
            taskId: response.data.data.taskId,
            // eslint-disable-next-line camelcase
            filename: file_name,
            component,
            status: 'in queue',
            progress: 0,
          })
        } else {
          console.error(response.data)
          showToast('danger', response.data.data.message)
          
          return false
        }
        
        return true
      } catch (error) {
        console.error('Error registering file:', error)
        showToast('danger', 'Error registering file(s) for upload.')
        
        return false
      }
    })

    const uploadResults = await Promise.all(uploadPromises)
    if (uploadResults.every(result => result)) {
      console.log('All uploads registered successfully')
      showFluxDriveProgressBar.value = true
    } else {
      console.error('Some uploads failed. Check the console for details.')
    }
  } catch (error) {
    console.error('Error registering files:', error)
    showToast('danger', 'Error registering file(s) for upload.')
  } finally {
    setTimeout(() => {
      checkFluxDriveUploadProgress()
    }, 2000)
  }
}

const getFluxDriveBackupList = async () => {
  try {
    const zelidauth = localStorage.getItem('zelidauth')

    const axiosConfig = {
      headers: {
        zelidauth,
      },
    }

    const response = await axios.get(`${fluxDriveEndPoint.value}/getbackuplist?appname=${props.appSpec.name}`, axiosConfig)

    if (response.data?.status === 'success') {
      console.log(JSON.stringify(response.data.checkpoints))

      const uniqueComponents = new Set()

      response.data.checkpoints.forEach(({ components }) => {
        components.forEach(component => uniqueComponents.add(component.component))
      })

      const restoreComponentsTmp = [{ value: '', text: 'all' }]

      uniqueComponents.forEach(item => {
        restoreComponentsTmp.push({ value: item, text: item })
      })

      restoreComponents.value = restoreComponentsTmp
      checkpoints.value = response.data.checkpoints
    } else if (response.data?.status === 'error') {
      showToast('danger', response.data.data.message)
    }
  } catch (error) {
    console.error('Error receiving FluxDrive backup list', error)
    showToast('danger', 'Error receiving FluxDrive backup list')
  }
}

function addAllBackupComponents(timestamp) {
  const checkpoint = checkpoints.value.find(cp => cp.timestamp === timestamp)
  if (checkpoint) {
    const filteredComponents = checkpoint.components.map(component => ({
      component: component.component,
      // eslint-disable-next-line camelcase
      file_url: component.file_url,
      timestamp: checkpoint.timestamp,
      // eslint-disable-next-line camelcase
      file_size: component.file_size,
    }))

    newComponents.value = filteredComponents
  }
}

function addComponent(selected, timestamp) {
  const existingIndex = newComponents.value.findIndex(item => item.component === selected.component)

  if (existingIndex !== -1) {
    // If the component already exists, update it
    newComponents.value[existingIndex] = {

      component: selected.component,
      // eslint-disable-next-line camelcase
      file_url: selected.file_url,
      timestamp,
      // eslint-disable-next-line camelcase
      file_size: selected.file_size,
    }
  } else {
    // If the component doesn't exist, add it to the array
    newComponents.value.push({
      component: selected.component,
      timestamp,
      // eslint-disable-next-line camelcase
      file_url: selected.file_url,
      // eslint-disable-next-line camelcase
      file_size: selected.file_size,
    })
  }
}

async function restoreFromFluxDrive(newComponents) {
  const restoreItems = newComponents.map(item => ({
    component: item.component,
    // eslint-disable-next-line camelcase
    file_size: item.file_size,
    url: item.file_url,
  }))

  restoringFromFluxDrive.value = true
  restoreFromFluxDriveStatus.value = 'Initializing restore jobs...'

  const zelidauth = localStorage.getItem('zelidauth')

  const headers = {
    zelidauth,
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    Connection: 'keep-alive',
  }

  const postLayout = buildPostBody('restore', 'remote')
  let postBackupData 
  for (const componentName of restoreItems) {
    postBackupData = updateJobStatus(postLayout, componentName.component, 'restore', restoreItems)
  }

  // Construct the URL for the API request
  const [url, urlPort = 16127] = props.currentInstanceIp.split(':')
  let queryUrl = `https://${url.replace(/\./g, '-')}-${urlPort}.node.api.runonflux.io/apps/appendrestoretask`

  if (props.ipAccess) {
    queryUrl = `http://${url}:${urlPort}/apps/appendrestoretask`
  }

  try {
    const response = await fetch(queryUrl, {
      method: 'POST',
      body: JSON.stringify(postBackupData),
      headers,
    })

    const reader = response.body.getReader()

    await new Promise((resolve, reject) => {
      function push() {
        reader.read().then(async ({ done, value }) => {
          if (done) {
            resolve() // Resolve the stream promise when the response stream is complete
            
            return
          }
          const chunkText = new TextDecoder('utf-8').decode(value)
          const chunks = chunkText.split('\n')

          // Process chunks of data
          await processChunks(chunks, 'restore_fluxdrive')
          push() // Recursively continue reading the next chunk
        }).catch(reject) // Handle stream errors
      }

      push()
    })

    // Reset flags after restore is complete
    restoringFromFluxDrive.value = false
    restoreFromFluxDriveStatus.value = ''
    showToast('success', 'Restore completed successfully')
  } catch (error) {
    console.error('Error during restore process:', error)
    restoringFromFluxDrive.value = false
    restoreFromFluxDriveStatus.value = 'Restore failed.'
    showToast('error', 'Restore failed')
  }
}

const totalArchiveFileSize = components => {
  // Implement your logic to calculate total file size
  return components.reduce((sum, comp) => sum + comp.file_size, 0)
}

const deleteItem = (index, components) => {
  components.splice(index, 1)
}

const addRemoteUrlItem = async (appname, component) => {

  if (restoreRemoteUrl.value.trim() !== '' && component !== null) {
    try {
      // Get remote file size
      const remoteFileSizeResponse = await props.executeLocalCommand(`/backup/getremotefilesize/${encodeURIComponent(restoreRemoteUrl.value.trim())}/${'B'}/${0}/${true}/${appname}`)
      
      if (remoteFileSizeResponse.data?.status !== 'success') {
        showToast('danger', remoteFileSizeResponse.data?.data?.message || remoteFileSizeResponse.data?.massage)
        
        return
      }

      // Get volume info
      const volumeInfoResponse = await props.executeLocalCommand(`/backup/getvolumedataofcomponent/${appname}/${component}/${'B'}/${0}/${'size,available,mount'}`)
      
      if (volumeInfoResponse.data?.status !== 'success') {
        showToast('danger', volumeInfoResponse.data?.data?.message || volumeInfoResponse.data?.data)
        
        return
      }

      if (remoteFileSizeResponse.data?.data > volumeInfoResponse.data?.data?.available) {
        showToast('danger', `File is too large (${addAndConvertFileSizes(remoteFileSizeResponse.value.data.data)})...`)
        
        return
      }

      // Check if the URL already exists
      const existingURL = restoreRemoteUrlItems.value.findIndex(item => item.url === restoreRemoteUrl.value)
      if (existingURL !== -1) {
        showToast('warning', `'${restoreRemoteUrl.value}' is already in the download queue for another component.`)
        
        return
      }

      // Check for existing item in the queue for the same component
      const existingItemIndex = restoreRemoteUrlItems.value.findIndex(item => item.component === component)

      if (remoteFileSizeResponse.data?.data === 0 || remoteFileSizeResponse.data?.data === null) {
        return
      }

      // Add or update the item in the queue
      if (existingItemIndex !== -1) {
        restoreRemoteUrlItems.value[existingItemIndex].url = restoreRemoteUrl.value
        // eslint-disable-next-line camelcase
        restoreRemoteUrlItems.value[existingItemIndex].file_size = remoteFileSizeResponse.value.data.data
      } else {
        restoreRemoteUrlItems.value.push({
          url: restoreRemoteUrl.value,
          component,
          // eslint-disable-next-line camelcase
          file_size: remoteFileSizeResponse.data.data,
        })
      }
    } catch (error) {
      showToast('danger', `Error: ${error.message}`)
    }
  }
}

const selectFiles = () => {
  nextTick(() => {
    if (fileselector.value) {
      fileselector.value.value = ''
      fileselector.value.click()
    } else {
      console.error("File input reference not available")
    }
  })
}

const handleFiles = ev => {
  const { files } = ev.target
    
  if (files.length > 0) {
    addFiles([...files])
  } else {
    console.warn("No files selected.")
  }

}

const addFiles = async filesToAdd => {
  for (const f of filesToAdd) {
    const volumeInfo = await props.executeLocalCommand(`/backup/getvolumedataofcomponent/${props.appSpec.name}/${restoreRemoteFile.value}/B/0/mount,available,size`)
    const volumePathValue = volumeInfo.data?.data?.mount
    
    // Check if file is already in the upload queue for a different component
    const existingFile = files.value.findIndex(
      item => item.file_name === f.name && item.component !== restoreRemoteFile.value,
    )

    if (existingFile !== -1) {
      showToast('warning', `'${f.name}' is already in the upload queue for another component.`)
      
      return false
    }

    // Check if the component already exists in the files array
    const existingComponent = files.value.findIndex(
      item => item.component === restoreRemoteFile.value,
    )

    const newFileData = {
      // eslint-disable-next-line camelcase
      selected_file: f,
      uploading: false,
      uploaded: false,
      progress: 0,
      path: `${volumePathValue}/backup/upload`,
      component: restoreRemoteFile.value,
      // eslint-disable-next-line camelcase
      file_name: `backup_${restoreRemoteFile.value.toLowerCase()}.tar.gz`,
      // eslint-disable-next-line camelcase
      file_size: f.size,
    }

    if (existingComponent !== -1) {
      files.value[existingComponent] = newFileData
    } else {
      files.value.push(newFileData)
    }
  }
  
  return true
}

const removeFile = file => {
  files.value = files.value.filter(
    // eslint-disable-next-line camelcase
    selected_file => selected_file.selected_file.name !== file.selected_file.name,
  )
}

function getUploadFolderBackup(saveAs) {
  const ip = props.currentInstanceIp.split(':')[0]
  const port = props.currentInstanceIp.split(':')[1] || 16127
  const filename = encodeURIComponent(saveAs)
  
  if (props.ipAccess) {
    return `http://${ip}:${port}/ioutils/fileupload/backup/${props.appSpec.name}/${restoreRemoteFile.value}/null/${filename}`
  }
  
  return `https://${ip.replace(/\./g, '-')}-${port}.node.api.runonflux.io/ioutils/fileupload/backup/${props.appSpec.name}/${restoreRemoteFile.value}/null/${filename}`
}

async function upload(file, isContentUpload = false) {
  return new Promise((resolve, reject) => {
    if (typeof XMLHttpRequest === 'undefined') {
      reject('XMLHttpRequest is not supported.')
      
      return
    }

    const xhr = new XMLHttpRequest()
    let action
    if (isContentUpload) {
      action = getUploadFolder() // Assume this method exists in your composition
    } else {
      action = getUploadFolderBackup(file.file_name) // Same for this method
    }

    if (xhr.upload) {
      xhr.upload.onprogress = function progress(e) {
        if (e.total > 0) {
          e.percent = (e.loaded / e.total) * 100
        }
        file.progress = e.percent
      }
    }

    const formData = new FormData()
    if (isContentUpload) {
      const blob = new Blob([file.content], { type: 'text/plain' })

      formData.append(file.file_name, blob)
    } else {
      formData.append(file.selected_file.name, file.selected_file)
    }

    file.uploading = true

    xhr.onerror = function error(e) {
      restoreFromUpload.value = false
      restoreFromUploadStatus.value = ''
      files.value.forEach(entry => {
        entry.uploading = false
        entry.uploaded = false
        entry.progress = 0
      })
      showToast('danger', `An error occurred while uploading ${file.selected_file.name}, try to relogin`)
      reject(e)
    }

    xhr.onload = function onload() {
      if (xhr.status < 200 || xhr.status >= 300) {
        console.error(xhr.status)
        restoreFromUpload.value = false
        restoreFromUploadStatus.value = ''
        files.value.forEach(entry => {
          entry.uploading = false
          entry.uploaded = false
          entry.progress = 0
        })
        showToast('danger', `An error occurred while uploading '${file.selected_file.name}' - Status code: ${xhr.status}`)
        reject(xhr.status)
        
        return
      }

      file.uploaded = true
      file.uploading = false
      resolve()
    }

    xhr.open('post', action, true)

    const headers = zelidHeader.value || {}
    const headerKeys = Object.keys(headers)
    for (let i = 0; i < headerKeys.length; i += 1) {
      const item = headerKeys[i]
      if (Object.prototype.hasOwnProperty.call(headers, item) && headers[item] !== null) {
        xhr.setRequestHeader(item, headers[item])
      }
    }

    xhr.setRequestHeader('Access-Control-Allow-Origin', '*')
    xhr.send(formData)
  })
}

watch(tab, async (newTabValue, oldTabValue) => {
  console.log('Tab changed from', oldTabValue, 'to', newTabValue)
  if (newTabValue === 0) {
    await loadBackupList()
  } else if (newTabValue === 1) {
    await getFluxDriveBackupList()
  }
})

const getRowProps = ({ item }) => {
  const isSelected = selectedBackup.value.some(sel => sel.file === item.file)

  return isSelected
    ? {
      style: 'background-color: rgba(var(--v-theme-primary), 0.2) !important;',
    }
    : {}
}

onMounted(async () => {
  await loadBackupList()
  await getFluxDriveBackupList()
})
</script>

<style scoped>
.red-hover :deep(.v-chip:hover):not(:has(.v-chip__close:hover)) {
  background-color: initial !important;
  color: initial !important;
}

.red-hover :deep(.v-chip:has(.v-chip__close:hover)) {
  background-color: rgba(183, 28, 28, 0.1) !important;
  color: #b71c1c !important;
}

.red-hover :deep(.v-chip) {
  border-radius: 9999px !important;
}

.border-frame {
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 5px;
  padding: 6px;
  height: 54px;
}
::v-deep(.v-data-table thead) {
  background-color: rgb(var(--v-theme-background)) !important;
}
.top-header {
  background-color: #97919166 !important;
}
.v-data-table {
  width: 100% !important; /* Make sure the nested table takes the full width */
}
.v-data-table__wrapper {
  width: 100%;
  padding: 0 !important;
}
.fit-to-content-with-border {
  display: inline-flex; /* Ensures the group fits its content */
  width: auto; /* Ensures the width is adjusted to content */
  border: 1px solid; /* Add border, you can change the color */
  border-radius: 8px; /* Adjust for rounded corners */
  padding: 8px; /* Optional padding inside the border */
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
