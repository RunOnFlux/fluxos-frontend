<template>
  <VRow class="align-center justify-space-between mb-1">
    <VCol
      cols="12"
      class="d-flex align-center pb-0"
    >
      <div class="d-flex w-100 align-center justify-space-between border-frame">
        <!-- Left side: icon and label -->
        <div class="d-flex align-center">
          <VAvatar
            size="35"
            color="success"
            variant="tonal"
            rounded="sm"
            class="mr-2 ml-1"
          >
            <VIcon size="26">
              mdi-controller
            </VIcon>
          </VAvatar>
          <span class="text-h5">Application Control</span>
        </div>
      </div>
    </VCol>
  </VRow>
  <VRadioGroup
    v-model="modeType"
    inline
  >
    <VRadio
      label="Manual"
      value="1"
    />
    <VRadio
      v-if="!props.isComposeSingle"
      label="Component"
      value="2"
    />
    <VRadio
      label="Local"
      value="3"
    />
    <VRadio
      label="Global"
      value="4"
    />
  </VRadioGroup>
  <VCard
    v-if="modeType === '1'"
    class="card-height-2 mx-1 mt-1 mb-6"
  >
    <VCardTitle class="mb-4 bg-primary">
      <VAvatar
        size="34"
        variant="tonal"
        color="lighten-4"
        class="mr-1"
      >
        <VIcon size="24">
          mdi-selection-marker
        </VIcon>
      </VAvatar> Manual Selection
    </VCardTitle>
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="5"
        >
          <div
            class="ml-2"
            style="font-size: 16px; font-weight: 800;"
          >
            Available
          </div>
          <div class="listbox-wrapper">
            <VList
              :key="refreshList"
              class="listbox"
              density="compact"
            >
              <VListItem
                v-for="item in availableItems"
                :key="item"
                :value="item"
                @click="toggleAvailable(item)"
              >
                <template #prepend>
                  <VCheckbox
                    :model-value="selectedAvailable.includes(item)"
                    density="compact"
                    :ripple="false"
                    class="tiny-checkbox"
                    @update:model-value="toggleAvailable(item)"
                  />
                </template>
                <span class="tiny-label">{{ item }}</span>
              </VListItem>
            </VList>
          </div>
        </VCol>
        <VCol
          cols="12"
          md="2"
          class="d-flex flex-md-column flex-row align-center justify-center my-2"
          style="gap: 8px;"
        >
          <VTooltip
            location="top"
            text="Add selected items"
          >
            <template #activator="{ props: addProps }">
              <VBtn
                v-bind="addProps"
                icon
                variant="text"
                color="default"
                :disabled="selectedAvailable.length === 0"
                @click="moveToSelected"
              >
                <VIcon>mdi-plus-box</VIcon>
              </VBtn>
            </template>
          </VTooltip>


          <VTooltip
            location="top"
            text="Add all items"
          >
            <template #activator="{ props: addAllProps }">
              <VBtn
                v-bind="addAllProps"
                icon
                variant="text"
                color="success"
                :disabled="availableItems.length === 0"
                @click="moveAllToSelected"
              >
                <VIcon>mdi-plus-box-multiple</VIcon>
              </VBtn>
            </template>
          </VTooltip>

          <VTooltip
            location="top"
            text="Remove selected items"
          >
            <template #activator="{ props: removeAllProps }">
              <VBtn
                v-bind="removeAllProps"
                icon
                variant="text"
                color="error"
                :disabled="selectedItems.length === 0"
                @click="removeAllSelected"
              >
                <VIcon>mdi-delete-sweep</VIcon>
              </VBtn>
            </template>
          </VTooltip>

          <VTooltip
            location="top"
            text="Refresh available items"
          >
            <template #activator="{ props: refreshProps }">
              <VBtn
                v-bind="refreshProps"
                icon
                variant="text"
                color="success"
                :disabled="isRefreshing"
                @click="refreshAvailableList"
              >
                <VIcon size="24">
                  mdi-refresh-circle
                </VIcon>
              </VBtn>
            </template>
          </VTooltip>
        </VCol>
        <VCol
          cols="12"
          md="5"
        >
          <div
            class="ml-2"
            style="font-size: 16px; font-weight: 800;"
          >
            Selected
          </div>
          <div class="listbox-wrapper">
            <VList
              class="listbox"
              density="compact"
            >
              <VListItem
                v-for="item in selectedItems"
                :key="item"
                :value="item"
              >
                <span class="tiny-label">{{ item }}</span>
                <template #append>
                  <VBtn
                    icon="mdi-trash-can"
                    size="small"
                    color="error"
                    variant="text"
                    density="compact"
                    @click="removeFromSelected(item)"
                  />
                </template>
              </VListItem>
            </VList>
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>

  <VTabs
    v-if="modeType === '2'"
    v-model="activeTabLocalIndexSpec"
    align-tabs="start"
    background-color="transparent"
    color="primary"
    hide-slider
    density="comfortable"
    class="v-tabs-pill"
    style="margin-top: 1px;"
  >
    <VTab
      v-for="(component, index) in normalizeComponents(props.appSpec)"
      :key="index"
      :value="index"
      class="v-tabs-pill text-no-transform"
    >
      <VIcon
        size="18"
        class="mr-1"
      >
        mdi-cube
      </VIcon>
      {{ component.name }}
    </VTab>
  </VTabs>

  <VWindow
    v-if="modeType === '2'"
    v-model="activeTabLocalIndexSpec"
    class="pa-4"
    :touch="false"
  >
    <VWindowItem
      v-for="(component, index) in normalizeComponents(props.appSpec)"
      :key="index"
      :value="index"
    >
      <VSlideYTransition mode="out-in">
        <VRow class="pa-1">
          <VCol
            xs="12"
            :md="modeType === '4' ? 12 : 6"
            sm="12"
            class="d-flex flex-wrap justify-start"
          >
            <VCard
              class="card-height"
              style="width: 100%;"
            >
              <VCardTitle class="mb-8 bg-primary d-flex justify-space-between align-center">
                <div>
                  <VAvatar
                    size="34"
                    color="lighten-4"
                    variant="tonal"
                    class="mr-1"
                  >
                    <VIcon size="24">
                      mdi-gamepad-down
                    </VIcon>
                  </VAvatar> Control
                </div>
                <VChip
                  size="small"
                  variant="flat"
                  color="info"
                  class="ml-2 mr-4"
                  rounded="pill"
                >
                  {{ component.name }}
                </VChip>
              </VCardTitle>
              <VCardText class="text-center">
                <VRow class="d-flex flex-wrap justify-center">
                  <VCol
                    class="d-flex justify-center"
                    cols="6"
                    sm="6"
                    md="6"
                    lg="6"
                  >
                    <VBtn
                      :id="`start-app-${index}`"
                      v-ripple
                      variant="outlined"
                      color="dark"
                      class="mx-1 my-1"
                      style="width: 100%; font-size: 13px"
                      :style="modeType === '4' ? 'min-width: 180px' : 'width: 100%'"
                    >
                      <VIcon
                        left
                        size="20"
                        class="mr-1"
                      >
                        mdi-play-circle
                      </VIcon>
                      Start Component
                    </VBtn>
                    <ConfirmCustomDialog
                      target="start-app"
                      confirm-button="Start Component"
                      @confirm="handleOperation('start', index)"
                    />
                  </VCol>
                  <VCol
                    class="d-flex justify-center"
                    cols="6"
                  >
                    <VBtn
                      :id="`stop-app-${index}`"
                      v-ripple
                      variant="outlined"
                      color="dark"
                      class="mx-1 my-1"
                      style="width: 100%; font-size: 13px"
                      :style="modeType === '4' ? 'min-width: 180px' : 'width: 100%'"
                    >
                      <VIcon
                        left
                        size="20"
                        class="mr-1"
                      >
                        mdi-stop-circle
                      </VIcon>
                      Stop Component
                    </VBtn>
                    <ConfirmCustomDialog
                      :target="`stop-app-${index}`"
                      confirm-button="Stop Component"
                      @confirm="handleOperation('stop', index)"
                    />
                  </VCol>
                  <VCol
                    class="d-flex justify-center"
                    cols="6"
                  >
                    <VBtn
                      :id="`restart-app-${index}`"
                      v-ripple
                      variant="outlined"
                      color="dark"
                      class="mx-1 my-1"
                      style="width: 100%; font-size: 13px"
                      :style="modeType === '4' ? 'min-width: 180px' : 'width: 100%'"
                    >
                      <VIcon
                        left
                        size="20"
                        class="mr-1"
                      >
                        mdi-restart
                      </VIcon>
                      Restart Component
                    </VBtn>
                    <ConfirmCustomDialog
                      :target="`restart-app-${index}`"
                      confirm-button="Restart Component"
                      @confirm="handleOperation('restart', index)"
                    />
                  </VCol>
                  <VCol
                    class="d-flex justify-center"
                    cols="6"
                  >
                    <VBtn
                      :id="`pause-app-${index}`"
                      v-ripple
                      variant="outlined"
                      color="dark"
                      class="mx-1 my-1"
                      style="width: 100%; font-size: 13px"
                      :style="modeType === '4' ? 'min-width: 180px' : 'width: 100%'"
                    >
                      <VIcon
                        left
                        size="20"
                        class="mr-1"
                      >
                        mdi-pause-circle
                      </VIcon>
                      Pause Component
                    </VBtn>
                    <ConfirmCustomDialog
                      :target="`pause-app-${index}`"
                      confirm-button="Pause Component"
                      @confirm="handleOperation('pause', index)"
                    />
                  </VCol>
                  <VCol
                    class="d-flex justify-center"
                    cols="12"
                  > 
                    <VBtn
                      :id="`unpause-app-${index}`"
                      v-ripple
                      variant="outlined"
                      color="dark"
                      class="mx-1 my-1"
                      style="width: 100%; font-size: 13px"
                      :style="modeType === '4' ? 'min-width: 180px' : 'width: 100%'"
                    >
                      <VIcon
                        left
                        size="20"
                        class="mr-1"
                      >
                        mdi-motion-play-outline
                      </VIcon>
                      Unpause Component
                    </VBtn>
                    <ConfirmCustomDialog
                      :target="`unpause-app-${index}`"
                      confirm-button="Unpause Component"
                      @confirm="handleOperation('unpause', index)"
                    />
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>
          <VCol
            v-if="modeType !== '4'"
            xs="12"
            md="6"
            sm="12"
            class="d-flex flex-wrap justify-start"
          >
            <VCard
              class="card-height"
              style="width: 100%;"
            >
              <VCardTitle class="mb-8 bg-primary d-flex justify-space-between align-center">
                <div>
                  <VAvatar
                    size="34"
                    color="lighten-4"
                    variant="tonal"
                    class="mr-1"
                  >
                    <VIcon size="24">
                      mdi-cctv
                    </VIcon>
                  </VAvatar> Monitoring
                </div>
                <VChip
                  size="small"
                  variant="flat"
                  color="info"
                  class="ml-2 mr-4"
                  rounded="pill"
                >
                  {{ component.name }}
                </VChip>
              </VCardTitle>
              <VCardText class="text-center">
                <div class="d-flex flex-column align-center justify-center">
                  <VBtn
                    :id="`start-monitoring-${index}`"
                    v-ripple
                    variant="outlined"
                    color="dark"
                    class="mx-1 my-1 d-block"
                    style="width: 50%; font-size: 13px"
                  >
                    <VIcon
                      left
                      size="20"
                      class="mr-2"
                    >
                      mdi-play-circle
                    </VIcon>
                    Start Monitoring
                  </VBtn>
                  <ConfirmCustomDialog
                    :target="`start-monitoring-${index}`"
                    confirm-button="Start Monitoring"
                    @confirm="handleOperation('start-monitoring', index)"
                  />
                  <VBtn
                    :id="`stop-monitoring-${index}`"
                    v-ripple
                    variant="outlined"
                    color="dark"
                    class="mx-1 my-6 d-block"
                    style="width: 50%; font-size: 13px"
                  >
                    <VIcon
                      left
                      size="20"
                      class="mr-2"
                    >
                      mdi-stop-circle
                    </VIcon>
                    Stop Monitoring
                  </VBtn>
                  <ConfirmCustomDialog
                    :target="`stop-monitoring-${index}`"
                    confirm-button="Stop Monitoring"
                    @confirm="handleOperation('stop-monitoring', index)"
                  />
                  <VBtn
                    :id="`stop-monitoring-delete-${index}`"
                    v-ripple
                    variant="outlined"
                    color="dark"
                    class="mx-1 my-1 d-block"
                    style="width: 50%; font-size: 13px"
                  >
                    <VIcon
                      left
                      size="20"
                      class="mr-2"
                    >
                      mdi-trash-can
                    </VIcon>
                    Stop & Delete Data
                  </VBtn>
                  <ConfirmCustomDialog
                    :target="`stop-monitoring-delete-${index}`"
                    confirm-button="Stop Monitoring & Delete Data"
                    @confirm="handleOperation('stop-and-del-monitoring', index)"
                  />
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VSlideYTransition>
    </VWindowItem>
  </VWindow>


  <VRow
    v-if="modeType !== '2'"
    class="pa-1"
  >
    <VCol
      xs="12"
      :md="modeType === '4' ? 12 : 6"
      sm="12"
      class="d-flex flex-wrap justify-start"
    >
      <VCard
        class="card-height"
        style="width: 100%;"
      >
        <VCardTitle class="mb-8 bg-primary">
          <VAvatar
            size="34"
            variant="tonal"
            color="lighten-4"
            class="mr-1"
          >
            <VIcon size="24">
              mdi-gamepad-down
            </VIcon>
          </VAvatar> Control
        </VCardTitle>
        <VCardText class="text-center">
          <VRow class="d-flex flex-wrap justify-center">
            <VCol
              class="d-flex justify-center"
              cols="6"
              sm="6"
              md="6"
              lg="6"
            >
              <VBtn
                id="start-app"
                v-ripple
                variant="outlined"
                color="dark"
                class="mx-1 my-1"
                style="width: 100%; font-size: 13px"
                :style="modeType === '4' ? 'min-width: 180px; max-width: 500px' : 'width: 100%'"
              >
                <VIcon
                  left
                  size="20"
                  class="mr-1"
                >
                  mdi-play-circle
                </VIcon>
                Start Application
              </VBtn>
              <ConfirmCustomDialog
                target="start-app"
                confirm-button="Start Application"
                @confirm="handleOperation('start')"
              />
            </VCol>
            <VCol
              class="d-flex justify-center"
              cols="6"
            >
              <VBtn
                id="stop-app"
                v-ripple
                variant="outlined"
                color="dark"
                class="mx-1 my-1"
                style="width: 100%; font-size: 13px"
                :style="modeType === '4' ? 'min-width: 180px; max-width: 500px' : 'width: 100%'"
              >
                <VIcon
                  left
                  size="20"
                  class="mr-1"
                >
                  mdi-stop-circle
                </VIcon>
                Stop Application
              </VBtn>
              <ConfirmCustomDialog
                target="stop-app"
                confirm-button="Stop Application"
                @confirm="handleOperation('stop')"
              />
            </VCol>
            <VCol
              class="d-flex justify-center"
              cols="6"
            >
              <VBtn
                id="restart-app"
                v-ripple
                variant="outlined"
                color="dark"
                class="mx-1 my-1"
                style="width: 100%; font-size: 13px"
                :style="modeType === '4' ? 'min-width: 180px; max-width: 500px' : 'width: 100%'"
              >
                <VIcon
                  left
                  size="20"
                  class="mr-1"
                >
                  mdi-restart
                </VIcon>
                Restart Application
              </VBtn>
              <ConfirmCustomDialog
                target="restart-app"
                confirm-button="Restart Application"
                @confirm="handleOperation('restart')"
              />
            </VCol>
            <VCol
              class="d-flex justify-center"
              cols="6"
            >
              <VBtn
                id="pause-app"
                v-ripple
                variant="outlined"
                color="dark"
                class="mx-1 my-1"
                style="width: 100%; font-size: 13px"
                :style="modeType === '4' ? 'min-width: 180px; max-width: 500px' : 'width: 100%'"
              >
                <VIcon
                  left
                  size="20"
                  class="mr-1"
                >
                  mdi-pause-circle
                </VIcon>
                Pause Application
              </VBtn>
              <ConfirmCustomDialog
                target="pause-app"
                confirm-button="Pause Application"
                @confirm="handleOperation('pause')"
              />
            </VCol>
            <VCol
              class="d-flex justify-center"
              cols="6"
            >
              <VBtn
                id="unpause-app"
                v-ripple
                variant="outlined"
                color="dark"
                class="mx-1 my-1"
                style="width: 100%; font-size: 13px"
                :style="modeType === '4' ? 'min-width: 180px; max-width: 500px' : 'width: 100%'"
              >
                <VIcon
                  left
                  size="20"
                  class="mr-1"
                >
                  mdi-motion-play-outline
                </VIcon>
                Unpause Application
              </VBtn>
              <ConfirmCustomDialog
                target="unpause-app"
                confirm-button="Unpause Application"
                @confirm="handleOperation('unpause')"
              />
            </VCol>
            <VCol
              class="d-flex justify-center"
              cols="6"
            >
              <VBtn
                id="remove-app"
                v-ripple
                variant="outlined"
                color="dark"
                class="mx-1 my-1"
                style="width: 100%; font-size: 13px"
                :style="modeType === '4' ? 'min-width: 180px; max-width: 500px' : 'width: 100%'"
              >
                <VIcon
                  left
                  size="20"
                  class="mr-1"
                >
                  mdi-trash-can
                </VIcon>
                Remove Application
              </VBtn>
              <ConfirmCustomDialog
                target="remove-app"
                confirm-button="Remove Application"
                @confirm="handleOperation('remove')"
              />
            </VCol>
            <VCol
              class="d-flex justify-center"
              cols="6"
            >
              <VBtn
                id="redeploy-app-soft"
                v-ripple
                variant="outlined"
                color="dark"
                class="mx-1 my-1"
                style="width: 100%; font-size: 13px"
                :style="modeType === '4' ? 'min-width: 180px; max-width: 500px' : 'width: 100%'"
              >
                <VIcon
                  left
                  size="20"
                  class="mr-1"
                >
                  mdi-backup-restore
                </VIcon>
                Soft Reinstall
              </VBtn>
              <ConfirmCustomDialog
                target="redeploy-app-soft"
                confirm-button="Soft Reinstall Application"
                @confirm="handleOperation('reinstall-soft')"
              />
            </VCol>
            <VCol
              class="d-flex justify-center"
              cols="6"
            >
              <VBtn
                id="redeploy-app-hard"
                v-ripple
                variant="outlined"
                color="dark"
                class="mx-1 my-1"
                style="width: 100%; font-size: 13px"
                :style="modeType === '4' ? 'min-width: 180px; max-width: 500px' : 'width: 100%'"
              >
                <VIcon
                  left
                  size="22"
                  class="mr-1"
                >
                  mdi-delete-restore
                </VIcon>
                Hard Reinstall
              </VBtn>
              <ConfirmCustomDialog
                target="redeploy-app-hard"
                confirm-button="Hard Reinstall Application"
                @confirm="handleOperation('reinstall-hard')"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      v-if="modeType !== '4'"
      xs="12"
      md="6"
      sm="12"
      class="d-flex flex-wrap justify-start"
    >
      <VCard
        class="card-height"
        style="width: 100%;"
      >
        <VCardTitle class="mb-8 bg-primary">
          <VAvatar
            size="34"
            color="lighten-4"
            variant="tonal"
            class="mr-1"
          >
            <VIcon size="24">
              mdi-cctv
            </VIcon>
          </VAvatar> Monitoring
        </VCardTitle>
        <VCardText class="text-center">
          <div class="d-flex flex-column align-center justify-center">
            <VBtn
              id="start-monitoring"
              v-ripple
              variant="outlined"
              color="dark"
              class="mx-1 my-1 d-block"
              style="width: 50%; font-size: 13px"
            >
              <VIcon
                left
                size="20"
                class="mr-2"
              >
                mdi-play-circle
              </VIcon>
              Start Monitoring
            </VBtn>
            <ConfirmCustomDialog
              target="start-monitoring"
              confirm-button="Start Monitoring"
              @confirm="handleOperation('start-monitoring')"
            />
            <VBtn
              id="stop-monitoring"
              v-ripple
              variant="outlined"
              color="dark"
              class="mx-1 my-6 d-block"
              style="width: 50%; font-size: 13px"
            >
              <VIcon
                left
                size="20"
                class="mr-2"
              >
                mdi-stop-circle
              </VIcon>
              Stop Monitoring
            </VBtn>
            <ConfirmCustomDialog
              target="stop-monitoring"
              confirm-button="Stop Monitoring"
              @confirm="handleOperation('stop-monitoring')"
            />
            <VBtn
              id="stop-monitoring-delete"
              v-ripple
              variant="outlined"
              color="dark"
              class="mx-1 my-1 d-block"
              style="width: 50%; font-size: 13px"
            >
              <VIcon
                left
                size="20"
                class="mr-2"
              >
                mdi-trash-can
              </VIcon>
              Stop & Delete Data
            </VBtn>
            <ConfirmCustomDialog
              target="stop-monitoring-delete"
              confirm-button="Stop Monitoring & Delete Data"
              @confirm="handleOperation('stop-and-del-monitoring')"
            />
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VDialog
    v-model="progressVisible.show"
    persistent
    width="500"
  >
    <VCard>
      <VCardTitle class="bg-primary dialog-title d-flex justify-space-between align-center">
        {{ progressVisible.title }}
        <VChip
          size="small"
          variant="flat"
          color="info"
          class="ml-2 mr-4"
          rounded="pill"
        >
          {{ progressVisible.name }}
        </VChip>
      </VCardTitle>

      <VCardText
        class="d-flex flex-column align-center justify-center"
        style="min-height: 100px;"
      >
        <div class="align-center">
          <VAlert
            type="info"
            variant="outlined"
            class="text-center text-caption font-weight-bold px-4 py-2"
            style="border-radius: 12px; max-width: 100%;"
          >
            {{ infoMessage }}
          </VAlert>
          <VProgressLinear
            indeterminate
            color="info"
            class="mt-2"
          />
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <VDialog
    v-model="taskDialog.show"
    max-width="900"
    persistent
  >
    <VCard>
      <VCardTitle class="bg-primary dialog-title d-flex justify-space-between align-center">
        {{ taskDialog.title }}
        <VChip
          size="small"
          variant="flat"
          color="info"
          class="ml-2 mr-4"
          rounded="pill"
        >
          {{ taskDialog.name }}
        </VChip>
      </VCardTitle>
      <VCardText>
        <div class="action-center">
          <!-- Current Task under title -->
          <div v-if="operationTask">
            <h3 class="mb-2 d-flex align-center">
              <VIcon
                icon="mdi-progress-tag"
                class="mr-1"
              />
              Current Task:
            </h3>
            <VChip
              class="current-task-chip"
              :color="taskColor"
              variant="tonal"
              rounded="pill"
            >
              <template #prepend>
                <VIcon
                  size="24"
                  class="mr-1"
                >
                  mdi-progress-wrench
                </VIcon>
              </template>
              {{ operationTask }}
            </VChip>
          </div>
          <div v-else>
            <VProgressLinear
              indeterminate
              color="primary"
            />
          </div>
          <!-- Overall Progress Section -->
          <div
            v-if="aggregateProgress.total > 0"
            class="mt-4"
          >
            <h3 class="mb-2 d-flex align-center">
              <VIcon
                icon="mdi-progress-download"
                class="mr-1"
              />
              Overall Progress
            </h3>
            <VProgressLinear
              :model-value="(aggregateProgress.current / aggregateProgress.total) * 100"
              height="16"
              color="success"
              rounded
            />
          </div>

          <!-- Full Logs Section -->
          <div
            v-show="output.length > 1"
            class="mt-4"
          >
            <h3 class="mb-2 d-flex align-center">
              <VIcon
                icon="mdi-text-box-outline"
                class="mr-1"
              />
              Full Logs
            </h3>
            <VBtn
              size="small"
              variant="text"
              color="primary"
              @click="showLogs = !showLogs"
            >
              <VIcon
                :icon="showLogs ? 'mdi-eye-off' : 'mdi-eye'"
                start
                class="mr-1"
              />
              {{ showLogs ? 'Hide Logs' : 'Show Logs' }}
            </VBtn>
            <VExpandTransition>
              <div
                v-show="showLogs"
                class="mt-2"
              >
                <div
                  ref="logContainer"
                  class="log-output log-html"
                >
                  <div v-sanitize-html="fullLogOutput()" />
                </div>
              </div>
            </VExpandTransition>
          </div>
        </div>
      </VCardText>

      <VCardActions
        v-if="operationTask"
        class="justify-end px-7"
      >
        <VBtn
          color="error"
          size="small"
          variant="flat"
          @click="() => { taskDialog.show = false; eventBus.emit('updateInstalledApp') }"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <VDialog
    v-model="progressVisibleMulti.show"
    persistent
    width="600"
  >
    <VCard>
      <VCardTitle class="bg-primary dialog-title d-flex justify-space-between align-center">
        {{ progressVisibleMulti.title }}
        <VChip
          size="small"
          variant="flat"
          color="info"
          class="ml-2 mr-4"
          rounded="pill"
        >
          {{ progressVisibleMulti.name }}
        </VChip>
      </VCardTitle>
      <VCardText class="d-flex flex-column align-center justify-center pt-4 pb-2">
        <VAlert
          v-if="!operationComplited"
          type="info"
          variant="outlined"
          class="text-caption font-weight-bold mb-4"
          style="border-radius: 12px; width: 400px;"
        >
          {{ infoMessage }}
        </VAlert>

        <VAlert
          v-if="operationComplited"
          type="success"
          variant="outlined"
          class="text-caption font-weight-bold mb-4"
          style="border-radius: 12px; width: 400px;"
        >
          Great! The operation is complete.
        </VAlert>

        <!--
          <VProgressLinear
          indeterminate
          color="info"
          class="mb-4"
          /> 
        -->

        <PerfectScrollbar
          ref="scrollRef"
          style="
            max-height: 100px;
            overflow-x: hidden;
            overflow-y: auto;
          "
          class="d-flex flex-column align-center w-75"
        >
          <div
            v-for="(task, ip) in tasks"
            :key="ip"
            class="d-flex justify-space-between align-center text-body-2"
            style="width: 100%; padding: 3px 0;"
          >
            <div class="d-flex align-center ml-4">
              <VIcon
                size="18"
                class="mr-2"
              >
                mdi-laptop
              </VIcon>
              {{ ip }}
            </div>

            <VTooltip
              v-if="task.message"
              location="top"
            >
              <template #activator="{ props: messageProps }">
                <VChip
                  v-bind="messageProps"
                  :color="getStatusColor(task.status)"
                  size="x-small"
                  variant="tonal"
                  class="ml-2 mr-4"
                  style="width: 70px"
                >
                  {{ task.status }}
                </VChip>
              </template>
              <span>{{ task.message }}</span>
            </VTooltip>

            <VChip
              v-else
              :color="getStatusColor(task.status)"
              size="x-small"
              variant="tonal"
              class="ml-2 mr-4"
              style="width: 70px"
            >
              {{ task.status }}
            </VChip>
          </div>
        </PerfectScrollbar>
      </VCardText>

      <VCardActions class="justify-end px-6 pb-4">
        <VBtn
          color="error"
          variant="flat"
          size="small"
          :disabled="operationComplited === false"
          @click="() => { progressVisibleMulti.show = false; resetIpStatusMap(); eventBus.emit('updateInstalledApp') }"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <VDialog
    v-model="taskDialogMulti.show"
    max-width="900"
    persistent
  >
    <VCard>
      <VCardTitle class="bg-primary dialog-title d-flex justify-space-between align-center">
        {{ taskDialogMulti.title }}
        <VChip
          size="small"
          variant="flat"
          color="info"
          class="ml-2 mr-4"
          rounded="pill"
        >
          {{ taskDialogMulti.name }}
        </VChip>
      </VCardTitle>

      <VCardText>
        <div class="action-center">
          <!-- Success Alert -->
          <div class="d-flex align-center justify-center">
            <VAlert
              v-if="operationComplited"
              type="success"
              variant="outlined"
              class="text-caption font-weight-bold mb-4"
              style="border-radius: 12px; width: 400px;"
            >
              Great! The operation is complete.
            </VAlert>
          </div>

          <!-- Current Task -->
          <div v-if="operationTask">
            <h3 class="mb-2 d-flex align-center">
              <VIcon
                icon="mdi-progress-tag"
                class="mr-1"
              />
              Current Task:
            </h3>
            <VChip
              class="current-task-chip"
              :color="taskColor"
              variant="tonal"
              rounded="pill"
            >
              <template #prepend>
                <VIcon
                  size="24"
                  class="mr-1"
                >
                  mdi-progress-wrench
                </VIcon>
              </template>
              {{ operationTask }}
            </VChip>
          </div>
          <div v-else>
            <VProgressLinear
              indeterminate
              color="primary"
            />
          </div>

          <!-- Overall Progress -->
          <div
            v-if="aggregateProgress.total > 0"
            class="mt-4"
          >
            <h3 class="mb-2 d-flex align-center">
              <VIcon
                icon="mdi-progress-download"
                class="mr-1"
              />
              Overall Progress
            </h3>
            <VProgressLinear
              :model-value="(aggregateProgress.current / aggregateProgress.total) * 100"
              height="16"
              color="success"
              rounded
            />
          </div>

          <!-- Per-IP Status -->
          <div
            v-if="Object.keys(ipStatusMap).length > 0"
            class="mt-4"
          >
            <h3 class="mb-2 d-flex align-center">
              <VIcon
                icon="mdi-lan-connect"
                class="mr-1"
              />
              Node Status
            </h3>
            <PerfectScrollbar
              ref="scrollRef"
              style="max-height: 80px; overflow-x: hidden; overflow-y: auto;"
              class="d-flex flex-column align-center w-100"
            >
              <div
                v-for="(status, ip) in ipStatusMap"
                :key="ip"
                class="d-flex justify-space-between align-center text-body-2"
                style="width: 100%; padding: 4px 12px;"
              >
                <div class="d-flex align-center">
                  <VIcon
                    size="18"
                    class="mr-2"
                  >
                    mdi-laptop
                  </VIcon>
                  {{ ip }}
                </div>

                <VTooltip location="top">
                  <template #activator="{ props: messagePropsMulti }">
                    <VChip
                      v-bind="messagePropsMulti"
                      :color="getStatusColor(status.status)"
                      size="x-small"
                      variant="tonal"
                      class="ml-2 mr-4"
                      style="width: 80px"
                    >
                      {{ status.status }}
                      <template v-if="status.count > 0">
                        ({{ status.count }})
                      </template>
                    </VChip>
                  </template>
                  <span>{{ tasks[ip]?.message || 'waiting for response...' }}</span>
                </VTooltip>
              </div>
            </PerfectScrollbar>
          </div>

          <!-- Full Logs -->
          <div
            v-if="Object.keys(outputs).some(ip => outputs[ip])"
            class="mt-4"
          >
            <h3 class="mb-2 d-flex align-center">
              <VIcon
                icon="mdi-text-box-outline"
                class="mr-1"
              />
              Full Logs
            </h3>
            <VBtn
              size="small"
              variant="text"
              color="primary"
              @click="showLogs = !showLogs"
            >
              <VIcon
                :icon="showLogs ? 'mdi-eye-off' : 'mdi-eye'"
                start
                class="mr-1"
              />
              {{ showLogs ? 'Hide Logs' : 'Show Logs' }}
            </VBtn>
            <VExpandTransition>
              <div
                v-show="showLogs"
                class="mt-2"
              >
                <div
                  ref="logContainer"
                  class="log-output log-html"
                >
                  <div v-sanitize-html="fullLogOutput()" />
                </div>
              </div>
            </VExpandTransition>
          </div>
        </div>
      </VCardText>

      <VCardActions
        v-if="operationTask"
        class="justify-end px-7"
      >
        <VBtn
          color="error"
          size="small"
          variant="flat"
          @click="() => { taskDialogMulti.show = false; resetIpStatusMap(); eventBus.emit('updateInstalledApp') }"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

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
import { eventBus } from "@/utils/eventBus"
import axios from 'axios'
import { PerfectScrollbar } from "vue3-perfect-scrollbar"
import qs from "qs"
import AppsService from "@/services/AppsService"

const props = defineProps({
  appSpec: {
    type: Object,
    required: true,
  },
  executeLocalCommand: {
    type: Function,
    required: true,
  },
  instances: {
    type: Array,
    default: () => [],
  },
  currentInstanceIp: {
    type: String,
    required: true,
  },
  logout: {
    type: Function,
    required: true,
  },
  ipAccess: {
    type: Boolean,
    required: true,
  },
  isComposeSingle: {
    type: Boolean,
    required: true,
  },
})


const output = ref([])
const optionalInfoMessage = ref('')
const operationTask = ref('')
const progressVisible = ref({ show: false, title: '', name: '' })
const taskDialog = ref({ show: false, title: '', name: '' })
const taskDialogMulti = ref({ show: false, title: '', name: '' })
const downloadOutput = ref({})
const logContainer = ref(null)
const showLogs = ref(false)
const operationTaskStatus = ref('')
const outputs = ref({})
const tasks = ref({})
const progressVisibleMulti = ref({ show: false, title: '', name: '' })
const allItems = computed(() => props.instances)
const currentIP = ref('')
const scrollRef = ref(null)
const noInstanceAvailable = ref(false)
const refreshList = ref(0)
const selectedItems = ref([])
const operationComplited = ref(false)
const selectedAvailable = ref([])
const modeType = ref("3")
const ipStatusMap = ref({})
const globalZelidAuthorized = ref('')
const isRefreshing = ref(false)
const activeTabLocalIndexSpec = ref('')


const availableItems = computed(() =>
  allItems.value.filter(item => !selectedItems.value.includes(item)),
)

watch(
  () => props.instances,
  newInstances => {
    const validIPs = new Set(newInstances)

    // Find which IPs were removed
    const removedIPs = selectedItems.value.filter(ip => !validIPs.has(ip))

    // Log each removal
    removedIPs.forEach(ip => {
      console.log(`[Removed] IP ${ip} no longer exists in available instances list`)
    })

    // Clean up selectedItems
    selectedItems.value = selectedItems.value.filter(ip =>
      validIPs.has(ip),
    )
  },
  { immediate: true },
)

watch(
  () => tasks,
  async () => {
    await nextTick()

    const el = scrollRef.value?.$el || scrollRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  },
  { deep: true },
)

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getStatusColor(status) {
  switch (status) {
  case 'success': return 'success'
  case 'error': return 'error'
  case 'pending': return 'warning'
  case 'initial': return 'secondary'
  default: return 'default'
  }
}

function toggleAvailable(item) {
  if (selectedAvailable.value.includes(item)) {
    selectedAvailable.value = selectedAvailable.value.filter(i => i !== item)
  } else {
    selectedAvailable.value.push(item)
  }
}

function moveToSelected() {
  selectedAvailable.value.forEach(item => {
    if (!selectedItems.value.includes(item)) {
      selectedItems.value.push(item)
    }
  })
  selectedAvailable.value = []
}

function moveAllToSelected() {
  const newItems = availableItems.value.filter(item => !selectedItems.value.includes(item))

  selectedItems.value.push(...newItems)
  selectedAvailable.value = []
}

function removeFromSelected(item) {
  selectedItems.value = selectedItems.value.filter(i => i !== item)
}

function removeAllSelected() {
  selectedItems.value = []
}

const aggregateProgress = computed(() => {
  const entries = Object.values(downloadOutput.value).filter(d => d?.detail)
  if (!entries.length) return { current: 0, total: 0 }

  const total = entries.reduce((sum, d) => sum + d.detail.total, 0)
  const current = entries.reduce((sum, d) => sum + d.detail.current, 0)

  return { current, total }
})

const infoMessage = computed(() => {
  const defaultMessage = 'Waiting for the operation to be completed...'
  
  return optionalInfoMessage.value.trim()
    ? optionalInfoMessage.value
    : defaultMessage
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

async function handleAppOperation(app, title, endpoint, delay = 0) {
  output.value = []
  operationTask.value = ''
  progressVisible.value.show = true
  progressVisible.value.title = `${title}...`
  progressVisible.value.name = `${app}`

  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  try {
    const response = await props.executeLocalCommand(endpoint)

    const message = response.data?.data?.message || response.data?.data

    if (response.data?.status === 'success') {
      showToast('success', message)
      eventBus.emit("updateAppStatus")
      if (title === 'Removing') {
        eventBus.emit("updateInstanceList")
        refreshList.value += 1
      }
    } else {
      showToast('error', message)
    }

    console.log(response)

  } catch (err) {
    showToast('error', 'Operation failed.')
    console.error(err)
  } finally {
    progressVisible.value.show = false
  }
}

const stopApp = app => handleAppOperation(app, 'Stopping', `/apps/appstop/${app}`, 2000)
const startApp = app => handleAppOperation(app, 'Starting', `/apps/appstart/${app}`, 3000)
const restartApp = app => handleAppOperation(app, 'Restarting', `/apps/apprestart/${app}`, 3000)
const pauseApp = app => handleAppOperation(app, 'Pausing', `/apps/apppause/${app}`, 3000)
const unpauseApp = app => handleAppOperation(app, 'Unpausing', `/apps/appunpause/${app}`, 3000)

const startMonitoring = app => handleAppOperation(app, 'Starting Monitoring', `/apps/startmonitoring/${app}`, 3000)
const stopMonitoring = app => handleAppOperation(app, 'Stopping Monitoring', `/apps/stopmonitoring/${app}`, 3000)
const stopMonitoringAndDelete = app => handleAppOperation(app, 'Stopping Monitoring & Deleting Data', `/apps/stopmonitoring/${app}/true`, 3000)

async function handleAppOperationWithOutput(appName, title, endpoint) {
  output.value = []
  outputs.value = []
  downloadOutput.value = {}
  operationTask.value = ''
  operationTaskStatus.value = ''
  
  taskDialog.value.title = `${title}...`
  taskDialog.value.name = `${appName}`
  taskDialog.value.show = true
  showLogs.value = false

  const zelidauth = localStorage.getItem('zelidauth')
  try {
    const axiosConfig = {
      headers: { zelidauth },
      onDownloadProgress(progressEvent) {
        const raw = progressEvent.event?.target?.response
        const parsed = JSON.parse(`[${raw.replace(/\}\{/g, '},{')}]`)

        output.value = parsed

        const latest = parsed.at(-1)

        operationTask.value = latest?.data?.message || latest?.data || latest?.status
      },
    }

    const response = await props.executeLocalCommand(endpoint, null, axiosConfig)
    const rawData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const finalParsed = JSON.parse(`[${rawData.replace(/\}\{/g, '},{')}]`)

    output.value = finalParsed

    const last = finalParsed.at(-1)

    operationTask.value = last?.data?.message || last?.data || last?.status
    operationTaskStatus.value = last?.status
    
    if (title === 'Removing') {
      eventBus.emit("updateInstanceList")
      refreshLis.value += 1
    } else {
      eventBus.emit("updateAppStatus")
    }
  } catch (error) {
    showToast('error', error.message || error)
  }
}

const removeApp = app => handleAppOperationWithOutput(app, 'Removing', `/apps/appremove/${app}`)
const redeployAppSoft = app => handleAppOperationWithOutput(app, 'Soft Reinstalling', `/apps/redeploy/${app}/false`)
const redeployAppHard = app => handleAppOperationWithOutput(app, 'Hard Reinstalling', `/apps/redeploy/${app}/true`)

watch([output, outputs], () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })

  const allEntries = []

  if (Array.isArray(output.value)) {
    allEntries.push(...output.value.map(entry => ({ ...entry, __source: 'output' })))
  }

  if (typeof outputs.value === 'object') {
    for (const [ip, entries] of Object.entries(outputs.value)) {
      if (Array.isArray(entries)) {
        allEntries.push(...entries.map(entry => ({ ...entry, ip, __source: 'outputs' })))
      }
    }
  }

  allEntries.forEach(entry => {
    if (!entry?.status) return

    if (entry.__source === 'outputs' && entry.ip !== currentIP.value) return

    const id = entry.status
    const progress = entry.progressDetail

    if (entry.status === 'Downloading' || entry.status === 'Extracting') {
      if (!downloadOutput.value[id]) {
        downloadOutput.value[id] = {
          id,
          detail: { current: 0, total: 1 },
          variant: entry.status === 'Downloading' ? 'error' : 'primary',
        }
      }

      if (progress && progress.total > 0) {
        downloadOutput.value[id].detail = {
          current: progress.current,
          total: progress.total,
        }
      }
    }

    if ((entry.status === 'Download complete' || entry.status === 'Pull complete') && downloadOutput.value[id]) {
      downloadOutput.value[id].detail = { current: 1, total: 1 }
      downloadOutput.value[id].variant = 'success'
    }

    if (!downloadOutput.value[id] && progress) {
      downloadOutput.value[id] = {
        id,
        detail: { current: 1, total: 1 },
        variant: 'primary',
      }
    }
  })
}, { deep: true })

watch(currentIP, (newIP, oldIP) => {
  if (oldIP && newIP !== oldIP && ipStatusMap.value[oldIP]) {
    const entry = ipStatusMap.value[oldIP]

    if (entry.status === 'pending') {
      entry.status = entry.count > 0 ? 'error' : 'success'
    }
  }
})

function fullLogOutput() {
  const componentColors = {}
  const ipColors = {}

  const hashColor = input => {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      hash = input.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    const saturation = 65
    const lightness = 45
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  const logs = []
  const entriesByIP = []

  // Gather all IPs and log arrays
  if (Array.isArray(output.value) && output.value.length > 0) {
    entriesByIP.push(['', output.value]) // legacy format
  } else if (typeof outputs.value === 'object') {
    for (const [ip, entries] of Object.entries(outputs.value)) {
      if (Array.isArray(entries)) {
        entriesByIP.push([ip, entries])
      }
    }
  }

  for (const [ip, entries] of entriesByIP) {
    let buffer = []
    let currentComponent = 'General'
    let appNameFallback = null
    let errorCount = 0

    // Initialize IP status if not already set
    if (!ipStatusMap.value[ip]) {
      ipStatusMap.value[ip] = { count: 0, status: 'initial' }
    }

    // Move from "initial" to "pending" if applicable
    if (ipStatusMap.value[ip].status === 'initial') {
      ipStatusMap.value[ip].status = 'pending'
    }

    const flushBufferTo = comp => {
      const finalComp = comp || appNameFallback || 'General'

      buffer.forEach(({ text, phase }) => {
        logs.push({ ip, component: finalComp, phase, text })
        if (phase === 'Error') {
          errorCount++
        }
      })
      buffer = []
    }

    for (const entry of entries) {
      const raw = entry?.data?.message || entry?.data || entry?.status
      const text = typeof raw === 'string' ? raw : JSON.stringify(raw)
      const lcText = text.toLowerCase()

      const appMatch = /Flux App (\w[\w-]*)/.exec(text)
      if (appMatch && !text.includes('component')) {
        appNameFallback = appMatch[1]
      }

      const isNewPull = /^Pulling from /i.test(text)
      const pullingComponent = /Pulling component (\w[\w-]*) of Flux App/.exec(text)
      const pullingGlobalApp = /Pulling global Flux App (\w[\w-]*) was successful/i.exec(text)
      const creatingComponent = /Creating component (\w[\w-]*) of Flux App/.exec(text)
      const startingComponent = /Starting component (\w[\w-]*) of Flux App/.exec(text)
      const creatingApp = /Creating Flux App (\w[\w-]*)/.exec(text)
      const startingApp = /Starting Flux App (\w[\w-]*)/.exec(text)
      const stoppingApp = /Stopping Flux App (\w[\w-]*)/.exec(text)
      const genericComponentAction = /(?:Stopping|Removing|Cleaning|Flux App component)\s+(?:Flux App\s+)?component\s+(\w[\w-]*)/i.exec(text)

      let phase = 'Finalizing'
      if (/error|fail|aborting|http code|unauthorized/.test(lcText)) {
        phase = 'Error'
      } else if (/warning/.test(lcText)) {
        phase = 'Warning'
      } else if (/initial|connecting|checking|allocating|creating|adjusting|searching|mounting|making|ports...|removing|stopping|starting|initiating|denying|unmounting|clearing|cleaning/.test(lcText)) {
        phase = 'Setup'
      } else if (/pull|download|digest|waiting|extract|verify|already exists/.test(lcText)) {
        phase = 'Pulling'
      }

      if (genericComponentAction) {
        flushBufferTo(genericComponentAction[1])
        currentComponent = genericComponentAction[1]
        logs.push({ ip, component: currentComponent, phase, text })
        if (phase === 'Error') errorCount++
        continue
      }

      if (isNewPull) {
        flushBufferTo(currentComponent)
        buffer.push({ text, phase })
        continue
      }

      if (pullingComponent) {
        flushBufferTo(pullingComponent[1])
        currentComponent = pullingComponent[1]
        logs.push({ ip, component: currentComponent, phase, text })
        if (phase === 'Error') errorCount++
        continue
      }

      if (pullingGlobalApp) {
        flushBufferTo(pullingGlobalApp[1])
        currentComponent = pullingGlobalApp[1]
        logs.push({ ip, component: currentComponent, phase, text })
        if (phase === 'Error') errorCount++
        continue
      }

      if (creatingComponent || startingComponent) {
        const comp = (creatingComponent || startingComponent)[1]

        flushBufferTo(comp)
        currentComponent = comp
        logs.push({ ip, component: currentComponent, phase, text })
        if (phase === 'Error') errorCount++
        continue
      }

      if (creatingApp || startingApp || stoppingApp) {
        const fallbackComp = (creatingApp || startingApp || stoppingApp)[1]

        appNameFallback = fallbackComp
        currentComponent = fallbackComp
      }

      if (logs.length === 0 && buffer.length === 0) {
        logs.push({ ip, component: currentComponent, phase, text })
        if (phase === 'Error') errorCount++
      } else {
        buffer.push({ text, phase })
      }
    }

    flushBufferTo(currentComponent)

    // Update global status
    ipStatusMap.value[ip].count = errorCount

    // ipStatusMap.value[ip].status = errorCount > 0 ? 'error' : 'success'
  }

  return logs.map(({ ip, component, phase, text }) => {
    if (!componentColors[component]) {
      componentColors[component] = hashColor(component)
    }
    if (ip && !ipColors[ip]) {
      ipColors[ip] = hashColor(ip)
    }

    const ipTag = ip
      ? `<span class="tag tag-ip" style="background-color:${ipColors[ip]};color:#fff;">${ip}</span>`
      : ''

    const compTag = `<span class="tag tag-component" style="background-color:${componentColors[component]};color:#fff;">${component}</span>`
    const phaseTag = `<span class="tag tag-${phase.toLowerCase()}">${phase}</span>`

    return `${ipTag}${compTag}${phaseTag}&nbsp;${text}`
  }).join('<br>')
}

function resetIpStatusMap() {
  setTimeout(() => {
    ipStatusMap.value = {}
  }, 3000)
}

const taskColor = computed(() => {
  const ip = currentIP.value
  const entries = []

  // Legacy output (used when no IP-specific output is available)
  if (!ip && Array.isArray(output.value)) {
    entries.push(...output.value)
  }

  // Multi-IP output
  if (ip && typeof outputs.value === 'object' && Array.isArray(outputs.value[ip])) {
    entries.push(...outputs.value[ip])
  }

  const hasError = entries.some(entry => {
    const msg = entry?.data?.message || entry?.data || entry?.status || ''
    
    return /error/i.test(msg)
  })

  if (hasError) {
    return 'error'
  }

  if (/error|aborting|http code/i.test(operationTask.value) || /error/i.test(operationTaskStatus.value)) {
    return 'error'
  }

  if (/success/i.test(operationTaskStatus.value)) {
    return 'success'
  }

  if (/warning/i.test(operationTaskStatus.value)) {
    return 'warning'
  }

  return 'primary'
})

async function sendRequestsSequentially({
  ipList,
  method = 'GET',
  endpoint = '',
  payload = null,
  headers = {},
  timeout = 25000,
  useDownloadProgress = false,
}) {
  outputs.value = {}
  tasks.value = {}

  console.log('[sendRequestsSequentially] Starting with IP list:', ipList)

  for (const ip of ipList) {
    currentIP.value = ip
    downloadOutput.value = {}

    // Extract IP and port safely
    const [ipAddressRaw, portRaw] = ip.split(':')
    const ipAddress = ipAddressRaw?.trim()
    const urlPort = portRaw?.trim() || '16127'

     
    if (!ipAddress || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ipAddress)) {
      console.error(`[${ip}] Invalid IP format. Skipping.`)
      continue
    }

    // Build domain URL and fallback IP URL
    let domainURL = `https://${ipAddress.replace(/\./g, '-')}-${urlPort}.node.api.runonflux.io${endpoint}`
    const fallbackURL = `http://${ipAddress}:${urlPort}${endpoint}`

    if (props.ipAccess) {
      domainURL = fallbackURL // Force IP access mode if enabled
    }

    // console.log(`[${ip}] Initial URL:`, domainURL)

    tasks.value[ip] = { status: 'pending', message: '' }
    outputs.value[ip] = null

    const config = {
      method,
      url: domainURL,
      headers,
      ...(payload ? { data: payload } : {}),
      ...(!useDownloadProgress ? { timeout } : {}),
    }

    if (useDownloadProgress) {
      config.onDownloadProgress = progressEvent => {
        const raw = progressEvent.event?.target?.response
        if (raw) {
          try {
            const parsed = JSON.parse(`[${raw.replace(/\}\{/g, '},{')}]`)

            outputs.value[ip] = parsed

            const latest = parsed.at(-1)

            operationTask.value = latest?.data?.message || latest?.data || latest?.status
            operationTaskStatus.value = latest?.status
            tasks.value[ip].message = latest?.data?.message || latest?.data || latest?.status
            tasks.value[ip].status = latest?.status

            // console.log(`[${ip}] onDownloadProgress - Latest entry:`, latest)
          } catch (err) {
            // Ignore parsing errors
          }
        }
      }
    }

    try {
      console.log(`[${ip}] Sending request to domain URL...`)

      const response = await axios(config)
      const rawData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
      const finalParsed = JSON.parse(`[${rawData.replace(/\}\{/g, '},{')}]`)
      const last = finalParsed.at(-1)

      operationTask.value = last?.data?.message || last?.data || last?.status
      operationTaskStatus.value = last?.status
      tasks.value[ip].message = last?.data?.message || last?.data || last?.status
      tasks.value[ip].status = last?.status
    } catch (error) {
      console.warn(`[${ip}] Domain request failed: ${error?.message || error}. Retrying with fallback...`)

      // Retry with fallback URL
      try {
        config.url = fallbackURL
        console.log(`[${ip}] Fallback URL:`, fallbackURL)

        const response = await axios(config)
        const rawData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
        const finalParsed = JSON.parse(`[${rawData.replace(/\}\{/g, '},{')}]`)
        const last = finalParsed.at(-1)

        operationTask.value = last?.data?.message || last?.data || last?.status
        operationTaskStatus.value = last?.status
        tasks.value[ip].message = last?.data?.message || last?.data || last?.status
        tasks.value[ip].status = last?.status
      } catch (fallbackError) {
        console.error(`[${ip}] Fallback request failed:`, fallbackError?.message)
        tasks.value[ip].status = 'error'
        tasks.value[ip].message = `Requests failed: ${fallbackError?.message} - check node accessibility.`

        if (!Array.isArray(outputs.value[ip])) {
          outputs.value[ip] = []
        }

        outputs.value[ip].push({
          data: { message: `Requests failed: ${fallbackError?.message} - check node accessibility.` },
          status: 'error',
        })

        if (!ipStatusMap.value[ip]) {
          ipStatusMap.value[ip] = { count: 1, status: 'error' }
        }

        operationTask.value = `Requests failed: ${fallbackError?.message} - check node accessibility.`
      }
    }

    await nextTick()
    console.log(`[${ip}] Finished processing.`)
  }

  downloadOutput.value = {}
  currentIP.value = ''
  console.log('[sendRequestsSequentially] All IPs processed.')
}



const handleMultiAppOperation = async (appName, title, endpoint, ipList, callback = false) => {

  if (ipList.length === 0) {
    showToast('warning', 'You must choose one or more nodes to proceed.')
    
    return
  }

  downloadOutput.value = {}
  output.value = []
  operationTask.value = ''
  operationTaskStatus.value = ''
  showLogs.value = false
  operationComplited.value = false
  outputs.value = {}
  tasks.value = {}
  currentIP.value = ''

  

  if (!callback) {
    progressVisibleMulti.value.title = `${title}...`
    progressVisibleMulti.value.name = `${appName}`
    progressVisibleMulti.value.show = true
  } else {
    taskDialogMulti.value.title = `${title}...`
    taskDialogMulti.value.name = `${appName}`
    taskDialogMulti.value.show = true
  }

  const zelidauth = localStorage.getItem('zelidauth')

  await sendRequestsSequentially({
    ipList,
    method: 'GET',
    endpoint: `${endpoint}`,
    headers: { zelidauth },
    useDownloadProgress: callback,
  })

  operationComplited.value = true
  if (endpoint.includes('appremove') && ipList.includes(props.currentInstanceIp)) {
    eventBus.emit("updateInstanceList")
  } else if (ipList.includes(props.currentInstanceIp))  {
    eventBus.emit("updateAppStatus")
  }
}

const startMultiApp = async (app, ipList) => {
  return await handleMultiAppOperation(app, 'Starting', `/apps/apprestart/${app}`, ipList)
}

const stopMultiApp = async (app, ipList) => {
  return await handleMultiAppOperation(app, 'Stopping', `/apps/appstop/${app}`, ipList)
}

const restartMultiApp = async (app, ipList) => {
  return await handleMultiAppOperation(app, 'Restarting', `/apps/apprestart/${app}`, ipList)
}

const pauseMultiApp = async (app, ipList) => {
  return await handleMultiAppOperation(app, 'Pausing', `/apps/apppause/${app}`, ipList)
}

const unpauseMultiApp = async (app, ipList) => {
  return await handleMultiAppOperation(app, 'Unpausing', `/apps/appunpause/${app}`, ipList)
}

const removeMultiApp = async (app, ipList) => {
  return await handleMultiAppOperation(app, 'Removing', `/apps/appremove/${app}`, ipList, true)
}

const redeployAppSoftMulti = async (app, ipList) => {
  return await handleMultiAppOperation(app, 'Soft Reinstalling', `/apps/redeploy/${app}/false`, ipList, true)
}

const redeployAppHardMulti = async (app, ipList) => {
  return await handleMultiAppOperation(app, 'Hard Reinstalling', `/apps/redeploy/${app}/true`, ipList, true)
}

const startMultiAppMonitoring = async (app, ipList) => {
  return await handleMultiAppOperation(app, 'Starting Monitoring', `/apps/startmonitoring/${app}`, ipList)
}

const stopMultiAppMonitoring = async (app, ipList) => {
  return await handleMultiAppOperation(app, 'Stopping Monitoring', `/apps/stopmonitoring/${app}`, ipList)
}

const stopAndDelMultiAppMonitoring = async (app, ipList) => {
  return await handleMultiAppOperation(app, 'Stopping Monitoring & Deleting Data', `/apps/stopmonitoring/${app}/true`, ipList)
}

const executeCommand = async (app, command, warningText, parameter) => {
  try {
    const zelidauth = localStorage.getItem('zelidauth')

    const axiosConfig = {
      headers: {
        zelidauth,
      },
    }

    await getZelidAuthority()
    if (!globalZelidAuthorized.value) {
      return
    }

    showToast('warning', warningText)
    await delay(3000)

    let urlPath = `/apps/${command}/${app}`
    if (parameter) {
      urlPath += `/${parameter}`
    }
    urlPath += '/true' // global deploy

    const response = await AppsService.justAPI().get(urlPath, axiosConfig)

    await delay(500)

    if (response.data.status === 'success') {
      showToast('success', response.data.data.message || response.data.data)
    } else {
      showToast('danger', response.data.data.message || response.data.data)
    }
  } catch (error) {
    showToast('danger', error.message || error)
  }
}

const stopAppGlobally = async app => {
  executeCommand(app, 'appstop', `Stopping ${app} globally. This will take a while...`)
}

const startAppGlobally = async app => {
  executeCommand(app, 'appstart', `Starting ${app} globally. This will take a while...`)
}

const restartAppGlobally = async app => {
  executeCommand(app, 'apprestart', `Restarting ${app} globally. This will take a while...`)
}

const pauseAppGlobally = async app => {
  executeCommand(app, 'apppause', `Pausing ${app} globally. This will take a while...`)
}

const unpauseAppGlobally = async app => {
  executeCommand(app, 'appunpause', `Unpausing ${app} globally. This will take a while...`)
}

const redeployAppSoftGlobally = async app => {
  executeCommand(app, 'redeploy', `Soft redeploying ${app} globally. This will take a while...`, 'false')
  noInstanceAvailable.value = true
}

const redeployAppHardGlobally = async app => {
  executeCommand(app, 'redeploy', `Hard redeploying ${app} globally. This will take a while...`, 'true')
  noInstanceAvailable.value = true
}

const removeAppGlobally = async app => {
  executeCommand(app, 'appremove', `Reinstalling ${app} globally. This will take a while...`, 'true')
  noInstanceAvailable.value = true
}

const handleOperation = async (operation, index = null) => {
  let app = props.appSpec.name
  if (index !== null) {
    app = `${props.appSpec.compose[index].name}_${props.appSpec.name}`
    console.log(app)
  }
  const mode = modeType.value

  getZelidAuthority()
  if (!globalZelidAuthorized.value) return

  if (!app) {
    showToast('warning', 'App name is missing.')
    
    return
  }

  if (mode === '1') {
    if (!selectedItems.value?.length) {
      showToast('warning', 'Select one or more nodes to proceed.')
      
      return
    }

    switch (operation) {
    case 'start':
      await startMultiApp(app, selectedItems.value)
      break
    case 'stop':
      await stopMultiApp(app, selectedItems.value)
      break
    case 'restart':
      await restartMultiApp(app, selectedItems.value)
      break
    case 'pause':
      await pauseMultiApp(app, selectedItems.value)
      break
    case 'unpause':
      await unpauseMultiApp(app, selectedItems.value)
      break
    case 'remove':
      await removeMultiApp(app, selectedItems.value)
      break
    case 'reinstall-soft':
      await redeployAppSoftMulti(app, selectedItems.value)
      break
    case 'reinstall-hard':
      await redeployAppHardMulti(app, selectedItems.value)
      break
    case 'start-monitoring':
      await startMultiAppMonitoring(app, selectedItems.value)
      break
    case 'stop-monitoring':
      await stopMultiAppMonitoring(app, selectedItems.value)
      break
    case 'stop-and-del-monitoring':
      await stopAndDelMultiAppMonitoring(app, selectedItems.value)
      break
    default:
      showToast('warning', 'Invalid multi-app operation selected.')
    }
  }
  else if (mode === '2' || mode === '3') {
    switch (operation) {
    case 'start':
      await startApp(app)
      break
    case 'stop':
      await stopApp(app)
      break
    case 'restart':
      await restartApp(app)
      break
    case 'pause':
      await pauseApp(app)
      break
    case 'unpause':
      await unpauseApp(app)
      break
    case 'remove':
      await removeApp(app)
      break
    case 'reinstall-soft':
      await redeployAppSoft(app)
      break
    case 'reinstall-hard':
      await redeployAppHard(app)
      break
    case 'start-monitoring':
      await startMonitoring(app)
      break
    case 'stop-monitoring':
      await stopMonitoring(app)
      break
    case 'stop-and-del-monitoring':
      await stopMonitoringAndDelete(app)
      break
    default:
      showToast('warning', 'Invalid multi-app operation selected.')
    }
  }
  else if (mode === '4') {
    switch (operation) {
    case 'start':
      await startAppGlobally(app)
      break
    case 'stop':
      await stopAppGlobally(app)
      break
    case 'restart':
      await restartAppGlobally(app)
      break
    case 'pause':
      await pauseAppGlobally(app)
      break
    case 'unpause':
      await unpauseAppGlobally(app)
      break
    case 'remove':
      await removeAppGlobally(app)
      break
    case 'reinstall-soft':
      await redeployAppSoftGlobally(app)
      break
    case 'reinstall-hard':
      await redeployAppHardGlobally(app)
      break
    default:
      showToast('warning', 'Invalid multi-app operation selected.')
    }
  }
  else {
    showToast('warning', 'Invalid mode selected.')
  }
}

async function getZelidAuthority() {
  const zelidauth = localStorage.getItem("zelidauth")
  const auth = qs.parse(zelidauth || "")

  const timestamp = Date.now()
  const maxTime = 1.5 * 60 * 60 * 1000 // 1.5 hours
  const mesTime = auth?.loginPhrase?.substring(0, 13) || 0
  const expiryTime = +mesTime + maxTime

  if (+mesTime > 0 && timestamp < expiryTime) {
    globalZelidAuthorized.value = true
  } else {
    globalZelidAuthorized.value = false
    await delay(1000)
    await props.logout()
  }
}

async function refreshAvailableList() {
  if (isRefreshing.value) return

  isRefreshing.value = true
  try {
    eventBus.emit("updateInstanceList")
    refreshList.value += 1
    await nextTick()
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 5000)
  }
}

function normalizeComponents(data) {
  if (!data) return []

  return data.version >= 4 ? data.compose : [{ ...data, repoauth: false }]
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
.card-height {
  height: 370px;
  min-width: 300px;
  background-color: var(--v-theme-surface);
  border-radius: 8px;
  box-shadow: 0 4px 8px var(--v-theme-shadow-color, rgba(0, 0, 0, 0.5));
}

.card-height-2 {
  height: 400;
  min-width: 300px;
  background-color: var(--v-theme-surface);
  border-radius: 8px;
  box-shadow: 0 4px 8px var(--v-theme-shadow-color, rgba(0, 0, 0, 0.5));
}
</style>

<style>
.log-output {
  height: 300px;
  overflow-y: auto;
  overflow-x: auto;
  background-color: #201f1f;
  color: #0f0;
  padding: 1rem;
  font-family: monospace;
  font-size: 0.85rem;
  border-radius: 4px;
  border: 1px solid #444;
  white-space: pre;
}
.tag {
  font-weight: bold;
  margin: 2px 2px 2px 0;
  border-radius: 999px;
  padding: 3px 5px;
  font-size: 0.75rem;
  display: inline-block;
  color: white;
  backdrop-filter: brightness(1.1);
  opacity: 0.9;
  white-space: nowrap;
  line-height: 1.1;
}
.tag-setup {
  background-color: rgba(30, 136, 229, 0.2);
  color: #1e88e5;
}
.tag-pulling {
  background-color: rgba(245, 124, 0, 0.2);
  color: #f57c00;
}
.tag-deploying {
  background-color: rgba(67, 160, 71, 0.2);
  color: #43a047;
}
.tag-finalizing {
  background-color: rgba(142, 36, 170, 0.2);
  color: #8e24aa;
}
.tag-cleaning {
  color: #fbc02d;
  background-color: rgba(255, 235, 59, 0.2);
}
.tag-error {
  background-color: rgba(244, 67, 54, 0.2);
  color: #f44336;
}
.tag-warning {
  background-color: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}
.tag-component,
.tag-ip {
  font-weight: 600;
  border-radius: 999px;
  padding: 3px 10px;
  margin-right: 6px;
  display: inline-block;
}
.listbox {
  max-height: 300px;
  overflow-y: auto;
  padding: 0;
}
.listbox-wrapper {
  border: 1px solid #ccc;
  border-radius: 6px;
  overflow: hidden;
}
.ps__rail-x,
.ps__thumb-x {
  display: none !important;
}
.tiny-checkbox .v-selection-control__input {
  transform: scale(0.8);
}

.tiny-checkbox .v-label {
  font-size: 14px;
}

.tiny-label {
  font-size: 14px;
}
</style>
