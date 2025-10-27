<template>
  <VContainer>
    <!-- Clean Header -->
    <div class="mb-6">
      <!-- Title Bar -->
      <div class="d-flex align-center mb-4">
        <div class="d-flex align-center">
          <VIcon icon="mdi-cloud-outline" size="28" color="primary" class="me-2" />
          <div>
            <h1 class="text-h5 font-weight-bold text-primary mb-0">{{ t('components.fluxDrive.fileManager.title') }}</h1>
            <div class="text-caption text-medium-emphasis">
              {{ t('components.fluxDrive.fileManager.subtitle') }}
            </div>
          </div>
        </div>
        <VSpacer />
        <VBtn
          v-if="hasActiveSubscription"
          color="success"
          variant="flat"
          size="small"
          prepend-icon="mdi-cog"
          @click="showUpgradeDialog = true"
        >
          {{ t('components.fluxDrive.fileManager.manageSubscription') }}
        </VBtn>
      </div>

      <!-- Subscription Status Section - Only show when expired or expiring soon -->
      <VCard
        v-if="subscriptionChecked && !hasActiveSubscription"
        :color="subscriptionDaysLeft <= 0 ? 'error' : 'warning'"
        variant="tonal"
        class="mb-4"
      >
        <VCardText class="d-flex align-center pa-3">
          <VIcon
            :icon="subscriptionDaysLeft <= 0 ? 'mdi-alert-circle' : subscriptionDaysLeft <= 7 ? 'mdi-clock-alert' : 'mdi-check-circle'"
            size="32"
            class="me-3"
          />
          <div class="flex-grow-1">
            <div class="text-subtitle-2 font-weight-bold">
              <template v-if="subscriptionDaysLeft < 0">
                {{ t('components.fluxDrive.fileManager.subscriptionExpired') }}
              </template>
              <template v-else-if="subscriptionDaysLeft === 0">
                {{ t('components.fluxDrive.fileManager.subscriptionExpiresToday') }}
              </template>
              <template v-else-if="subscriptionDaysLeft <= 7">
                {{ t('components.fluxDrive.fileManager.subscriptionExpiringSoon') }}
              </template>
              <template v-else>
                {{ t('components.fluxDrive.fileManager.subscriptionActive') }}
              </template>
            </div>
            <div class="text-caption">
              {{ subscriptionExpiryMessage }}
            </div>
            <div v-if="subscriptionDaysLeft <= 0" class="text-caption text-error mt-1">
              {{ t('components.fluxDrive.fileManager.filesDeleteWarning') }}
            </div>
          </div>
          <VBtn
            v-if="subscriptionDaysLeft <= 0"
            color="error"
            variant="flat"
            size="small"
            @click="showUpgradeDialog = true"
          >
            {{ t('components.fluxDrive.fileManager.renewNow') }}
          </VBtn>
          <VBtn
            v-else-if="subscriptionDaysLeft <= 7"
            color="warning"
            variant="flat"
            size="small"
            @click="showUpgradeDialog = true"
          >
            {{ t('components.fluxDrive.fileManager.extend') }}
          </VBtn>
        </VCardText>
      </VCard>

      <!-- Manage Subscription Card (only for Crypto.com subscriptions) -->
      <VCard
        v-if="subscriptionChecked && hasActiveSubscription && isCryptoComSubscription"
        variant="outlined"
        class="mb-4"
      >
        <VCardText class="pa-3">
          <div class="text-subtitle-2 font-weight-bold mb-2">
            <VIcon icon="mdi-information" size="20" class="me-1" />
            {{ t('components.fluxDrive.fileManager.manageSubscriptionTitle') }}
          </div>
          <div class="text-caption mb-3">
            {{ t('components.fluxDrive.fileManager.manageSubscriptionInfo') }}
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <!-- Cancel Subscription button -->
            <VBtn
              color="error"
              variant="outlined"
              size="small"
              @click="showCancelDialog = true"
            >
              <VIcon icon="mdi-cancel" class="me-1" size="18" />
              {{ t('components.fluxDrive.fileManager.cancelSubscription') }}
            </VBtn>

            <!-- Manage on Crypto.com button -->
            <VBtn
              color="primary"
              variant="outlined"
              size="small"
              href="https://crypto.com/settings/subscriptions"
              target="_blank"
              rel="noopener noreferrer"
            >
              <VIcon icon="mdi-open-in-new" class="me-1" size="18" />
              {{ t('components.fluxDrive.fileManager.manageCryptoCom') }}
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Actions Bar -->
      <VCard variant="outlined" class="pa-3">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3">
          <!-- Left: Search -->
          <div class="flex-grow-1" style="min-width: 280px; max-width: 400px;">
            <VTextField
              v-model="searchQuery"
              :placeholder="t('components.fluxDrive.fileManager.searchPlaceholder')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              :loading="searching"
              :disabled="!hasActiveSubscription"
              @keyup.enter="searchFile"
            />
          </div>

          <!-- Right: Actions -->
          <div class="d-flex align-center ga-3 flex-shrink-0">
            <!-- Modern View Toggle -->
            <div class="view-toggle-modern">
              <VBtn
                :variant="viewType === 'list' ? 'flat' : 'text'"
                :color="viewType === 'list' ? 'primary' : 'default'"
                size="small"
                height="32"
                width="32"
                class="view-toggle-btn"
                @click="viewType = 'list'"
              >
                <VIcon
                  icon="mdi-view-list"
                  size="18"
                />
                <VTooltip activator="parent" location="bottom">{{ t('components.fluxDrive.fileManager.listView') }}</VTooltip>
              </VBtn>

              <VBtn
                :variant="viewType === 'grid' ? 'flat' : 'text'"
                :color="viewType === 'grid' ? 'primary' : 'default'"
                size="small"
                height="32"
                width="32"
                class="view-toggle-btn"
                @click="viewType = 'grid'"
              >
                <VIcon
                  icon="mdi-view-grid"
                  size="18"
                />
                <VTooltip activator="parent" location="bottom">{{ t('components.fluxDrive.fileManager.gridView') }}</VTooltip>
              </VBtn>
            </div>

            <!-- Action Buttons - Disabled when subscription expired -->
            <VBtn
              color="primary"
              variant="tonal"
              size="small"
              height="32"
              prepend-icon="mdi-folder-plus"
              :disabled="!hasActiveSubscription"
              @click="createFolder"
            >
              {{ t('components.fluxDrive.fileManager.newFolder') }}
            </VBtn>

            <VMenu :disabled="!hasActiveSubscription">
              <template #activator="{ props }">
                <VBtn
                  color="primary"
                  size="small"
                  height="32"
                  prepend-icon="mdi-upload"
                  append-icon="mdi-chevron-down"
                  :disabled="!hasActiveSubscription"
                  v-bind="props"
                >
                  {{ t('components.fluxDrive.fileManager.upload') }}
                </VBtn>
              </template>
              <VList>
                <VListItem @click="$refs.fileInput?.click()"
                >
                  <template #prepend>
                    <VIcon icon="mdi-file-upload" size="20" />
                  </template>
                  <VListItemTitle>{{ t('components.fluxDrive.fileManager.uploadFiles') }}</VListItemTitle>
                </VListItem>
                <VListItem @click="$refs.folderInput?.click()"
                >
                  <template #prepend>
                    <VIcon icon="mdi-folder-upload" size="20" />
                  </template>
                  <VListItemTitle>{{ t('components.fluxDrive.fileManager.uploadFolder') }}</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>

          </div>
        </div>
      </VCard>
    </div>

    <!-- Main FluxDrive Interface -->
    <VCard :disabled="!hasActiveSubscription">
      <VCardText class="pa-6">
        <!-- Hidden File Input -->
        <input
          ref="fileInput"
          type="file"
          multiple
          style="display: none"
          @change="handleLocalFileSelect"
        >

        <!-- Hidden Folder Input -->
        <input
          ref="folderInput"
          type="file"
          webkitdirectory
          multiple
          style="display: none"
          @change="handleFolderSelect"
          @click.stop
        >

        <!-- Modern Breadcrumb Navigation -->
        <div class="modern-breadcrumb mb-4">
          <div class="breadcrumb-container d-flex align-center">
            <VBtn
              icon
              variant="text"
              size="x-small"
              @click="navigateToRoot"
              class="breadcrumb-home"
            >
              <VIcon icon="mdi-home" size="18" class="text-medium-emphasis" />
              <VTooltip activator="parent" location="bottom">{{ t('components.fluxDrive.fileManager.goToRoot') }}</VTooltip>
            </VBtn>

            <template v-for="(item, index) in breadcrumbs" :key="item.path">
              <VIcon
                v-if="index > 0 || item.path !== '/'"
                icon="mdi-chevron-right"
                size="18"
                class="mx-1 text-medium-emphasis"
              />
              <VBtn
                v-if="item.path !== '/'"
                variant="text"
                size="x-small"
                class="breadcrumb-item"
                :class="{ 'breadcrumb-current': index === breadcrumbs.length - 1 }"
                @click="handleNavigateToFolder(item)"
              >
                <VIcon
                  v-if="index === breadcrumbs.length - 1"
                  icon="mdi-folder-open"
                  size="16"
                  class="me-1 text-medium-emphasis"
                />
                <span class="text-medium-emphasis">{{ item.title }}</span>
              </VBtn>
            </template>
          </div>
        </div>

        <!-- Renewal/Upgrade Status Chip -->
        <div v-if="isRenewing" class="d-flex justify-center mb-4">
          <VChip
            color="primary"
            variant="flat"
            size="large"
            class="renewal-chip d-flex align-center"
          >
            <VIcon
              icon="mdi-loading"
              class="mr-2 rotating-icon"
              size="18"
            />
            {{ renewalMessage }}
          </VChip>
        </div>

        <!-- Recovery Mode Button - TEMPORARILY DISABLED -->
        <!-- <VAlert
          v-if="usedStorage > 0 && currentFolder === '/' && files.length === 0 && allFiles.length === 0 && !loading && !searchQuery.trim() && !localMessage"
          type="warning"
          variant="tonal"
          class="my-4"
        >
          <template #title>{{ t('components.fluxDrive.fileManager.filesMissing') }}</template>
          <div class="text-body-2 mb-3">
            {{ t('components.fluxDrive.fileManager.filesMissingDescription', { storage: bytesConversion(usedStorage) }) }}
          </div>
          <div class="d-flex gap-2">
            <VBtn
              v-if="!isRecoveryMode"
              color="warning"
              variant="flat"
              size="small"
              @click="loadFiles(false, true)"
            >
              <VIcon icon="mdi-file-search" class="me-2" />
              {{ t('components.fluxDrive.fileManager.showAllFilesRecovery') }}
            </VBtn>
            <VBtn
              v-if="isRecoveryMode"
              color="primary"
              variant="flat"
              size="small"
              @click="loadFiles(false, false)"
            >
              <VIcon icon="mdi-arrow-left" class="me-2" />
              {{ t('components.fluxDrive.fileManager.backToNormalMode') }}
            </VBtn>
          </div>
        </VAlert> -->

        <!-- Debug Info (temporary) -->
        <VAlert
          v-if="$route.query.debug"
          type="info"
          variant="tonal"
          class="my-4"
        >
          <div class="text-caption">
            <div><strong>Debug Info:</strong></div>
            <div>Files array length: {{ files.length }}</div>
            <div>Loading: {{ loading }}</div>
            <div>Current folder: {{ currentFolder }}</div>
            <div>Has active subscription: {{ hasActiveSubscription }}</div>
            <div>View type: {{ viewType }}</div>
            <div>Files array: {{ JSON.stringify(files.slice(0,1), null, 2) }}</div>
            <div>Files type: {{ typeof files }}</div>
            <div>Files is array: {{ Array.isArray(files) }}</div>
            <div>Show loading condition: {{ loading && files.length === 0 }}</div>
            <div>Show empty condition: {{ !loading && files.length === 0 }}</div>
            <div>Show files condition: {{ !loading && files.length > 0 }}</div>
            <div>Show list condition: {{ viewType === 'list' }}</div>
          </div>
        </VAlert>

        <!-- Unified Local Message System -->
        <VAlert
          v-if="localMessage"
          :type="localMessageType"
          variant="tonal"
          density="compact"
          class="my-4 local-message-alert"
        >
          <template #prepend>
            <VIcon :icon="localMessageIcon" />
          </template>
          {{ localMessage }}
        </VAlert>

        <!-- New Error Management System -->
        <VAlert
          v-if="hasError"
          :type="errorType"
          class="my-4"
          closable
          @click:close="clearError"
        >
          {{ errorMessage }}
        </VAlert>

        <!-- Initial Loading State - only when no files exist and no stable files -->
        <div v-if="loading && files.length === 0 && stableFiles.length === 0" class="d-flex justify-center align-center" style="min-height: 300px;">
          <VProgressCircular
            indeterminate
            color="primary"
            :size="40"
            :width="3"
          />
        </div>


        <!-- Debug Info for Display Logic -->
        <VAlert
          v-if="$route.query.debug"
          type="info"
          class="my-4"
        >
          <div><strong>Display Logic Debug:</strong></div>
          <div>loading: {{ loading }}</div>
          <div>files.length: {{ files?.length || 0 }}</div>
          <div>resultMessage: {{ !!resultMessage }}</div>
          <div>hasError: {{ hasError }}</div>
          <div>Show loading: {{ loading && files.length === 0 }}</div>
          <div>Show empty state: {{ !loading && (!files || files.length === 0) && !resultMessage && !hasError }}</div>
          <div>Show files: {{ !loading && files && files.length > 0 }}</div>
        </VAlert>

        <!-- Empty State -->
        <div
          v-else-if="!loading && (!files || files.length === 0) && !resultMessage && !hasError"
          class="file-upload-area text-center py-12"
          :class="{ 'drag-over': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleLocalDrop"
        >
          <VIcon
            :icon="searchQuery.trim() ? 'mdi-file-search-outline' : 'mdi-folder-open-outline'"
            size="80"
            class="mb-4 text-medium-emphasis"
          />
          <h3 class="text-h6 mb-2">
            {{ searchQuery.trim() ? t('components.fluxDrive.fileManager.noFilesFound') : t('components.fluxDrive.fileManager.folderEmpty') }}
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ searchQuery.trim() ? t('components.fluxDrive.fileManager.noFilesMatch', { query: searchQuery.trim() }) : t('components.fluxDrive.fileManager.dropFilesHere') }}
          </p>
          <VBtn
            v-if="!searchQuery.trim()"
            color="primary"
            prepend-icon="mdi-upload"
            @click="$refs.fileInput?.click()"
          >
            {{ t('components.fluxDrive.fileManager.uploadFiles') }}
          </VBtn>
        </div>

        <!-- File Display Area -->
        <div v-if="stableFiles && stableFiles.length > 0" class="mb-4 position-relative" :key="`stable-files-${stableFiles?.length || 0}`">
          <!-- Loading Overlay for Navigation -->
          <div v-if="loading" class="loading-overlay">
            <VProgressCircular
              indeterminate
              color="primary"
              :size="60"
              :width="4"
            />
          </div>
          <!-- List View -->
          <div v-if="viewType === 'list'">
            <VDataTable
              :headers="fileHeaders"
              :items="paginatedFiles"
              :loading="false"
              hover
              density="comfortable"
              item-key="id"
              class="file-list-table"
              :no-data-text="t('components.fluxDrive.fileManager.noFilesOrFolders')"
              :key="`table-${files.length}`"
              hide-default-footer
            >
              <template #item.preview="{ item }">
                <div class="d-flex align-center justify-center" style="width: 60px;">
                  <VBtn
                    v-if="item.isFolder && !item.isGoBack"
                    icon
                    variant="text"
                    size="small"
                    @click="handleOpenFolder(item)"
                  >
                    <VIcon
                      icon="mdi-folder"
                      size="24"
                      class="text-medium-emphasis"
                    />
                  </VBtn>
                  <VBtn
                    v-else-if="isImageFile(item.mimetype)"
                    icon
                    variant="text"
                    size="small"
                    @click="previewFile(item)"
                  >
                    <VIcon
                      :icon="getFileIcon(item.type)"
                      size="24"
                      class="text-medium-emphasis"
                    />
                  </VBtn>
                  <VIcon
                    v-else-if="item.isGoBack"
                    icon="mdi-folder-arrow-up"
                    size="24"
                    class="text-medium-emphasis"
                  />
                  <VIcon
                    v-else
                    :icon="getFileIcon(item.type)"
                    size="24"
                    class="text-medium-emphasis"
                  />
                </div>
              </template>

              <template #item.name="{ item }">
                <div
                  class="text-truncate text-no-wrap"
                  style="max-width: 300px;"
                  :title="item.isGoBack ? t('components.fluxDrive.fileManager.goBackToParent') : item.name"
                  :class="{ 'cursor-pointer': item.isFolder || item.isGoBack }"
                  @click="(item.isFolder || item.isGoBack) ? handleOpenFolder(item) : null"
                >
                  {{ item.name_abbr || item.name }}
                </div>
              </template>

              <template #item.timestamp="{ item }">
                <span class="text-no-wrap">
                  {{ item.isGoBack ? '-' : (item.added_date || formatDate(item.timestamp)) }}
                </span>
              </template>

              <template #item.size="{ item }">
                <span class="text-no-wrap">{{ item.isFolder ? '-' : convertSize(item.size) }}</span>
              </template>


              <template #item.actions="{ item }">
                <VMenu v-if="!item.isGoBack">
                  <template #activator="{ props }">
                    <VBtn
                      icon
                      size="small"
                      variant="text"
                      v-bind="props"
                      class="text-medium-emphasis"
                    >
                      <VIcon icon="mdi-dots-vertical" size="20" class="text-medium-emphasis" />
                    </VBtn>
                  </template>
                  <VList density="compact">
                    <!-- File-specific options -->
                    <template v-if="!item.isFolder">
                      <VListItem @click="previewFile(item)"
                      >
                        <template #prepend>
                          <VIcon icon="mdi-eye" size="20" />
                        </template>
                        <VListItemTitle>{{ t('components.fluxDrive.fileManager.preview') }}</VListItemTitle>
                      </VListItem>

                      <VListItem @click="downloadFile(item)"
                      >
                        <template #prepend>
                          <VIcon icon="mdi-download" size="20" />
                        </template>
                        <VListItemTitle>{{ t('components.fluxDrive.fileManager.download') }}</VListItemTitle>
                      </VListItem>

                      <VListItem
                        v-if="!item.isFolder"
                        @click="addVersion(item)"
                      >
                        <template #prepend>
                          <VIcon icon="mdi-file-plus" size="20" />
                        </template>
                        <VListItemTitle>{{ t('components.fluxDrive.fileManager.addVersion') }}</VListItemTitle>
                      </VListItem>

                      <VListItem
                        v-if="!item.isFolder && item.versions?.length > 0"
                        @click="viewVersions(item)"
                      >
                        <template #prepend>
                          <VIcon icon="mdi-history" size="20" />
                        </template>
                        <VListItemTitle>{{ t('components.fluxDrive.fileManager.viewVersions') }}</VListItemTitle>
                      </VListItem>

                    </template>

                    <!-- Common options for files and folders (except go back entry) -->
                    <template v-if="!item.isGoBack">
                      <VListItem @click="renameItem(item)"
                      >
                        <template #prepend>
                          <VIcon icon="mdi-pencil" size="20" />
                        </template>
                        <VListItemTitle>{{ t('components.fluxDrive.fileManager.rename') }}</VListItemTitle>
                      </VListItem>

                      <VListItem @click="moveItem(item)"
                      >
                        <template #prepend>
                          <VIcon icon="mdi-folder-move" size="20" />
                        </template>
                        <VListItemTitle>{{ t('components.fluxDrive.fileManager.moveTo') }}</VListItemTitle>
                      </VListItem>

                      <VListItem
                        v-if="!item.isFolder"
                        @click="handleCopyLink(item)"
                      >
                        <template #prepend>
                          <VIcon icon="mdi-link" size="20" />
                        </template>
                        <VListItemTitle>{{ t('components.fluxDrive.fileManager.copyLink') }}</VListItemTitle>
                      </VListItem>

                      <VListItem
                        @click="deleteFile(item)"
                        class="text-error"
                      >
                        <template #prepend>
                          <VIcon icon="mdi-delete" size="20" color="error" />
                        </template>
                        <VListItemTitle>{{ t('components.fluxDrive.fileManager.delete') }}</VListItemTitle>
                      </VListItem>
                    </template>
                  </VList>
                </VMenu>
              </template>
            </VDataTable>
          </div>

          <!-- Grid View -->
          <div v-else-if="viewType === 'grid'" class="pa-2">
            <VRow>
              <VCol
                v-for="item in paginatedFiles"
                :key="item.id"
                cols="6"
                sm="4"
                md="3"
                lg="2"
              >
                <VCard
                  :elevation="1"
                  class="text-center pa-3 file-grid-item d-flex flex-column justify-center position-relative"
                  style="border-radius: 20px; min-height: 140px;"
                  hover
                  @click.stop="item.isFolder || item.isGoBack ? handleOpenFolder(item) : previewFile(item)"
                  @contextmenu.prevent="!item.isGoBack && showContextMenu($event, item)"
                  @touchstart="!item.isGoBack && handleTouchStart($event, item)"
                  @touchend="!item.isGoBack && handleTouchEnd($event, item)"
                  @touchmove="handleTouchMove"
                >
                  <!-- Three-dot menu button (top-right corner) -->
                  <VBtn
                    v-if="!item.isGoBack"
                    icon="mdi-dots-vertical"
                    size="small"
                    variant="text"
                    class="context-menu-btn text-medium-emphasis"
                    style="position: absolute; top: 4px; right: 4px; z-index: 1;"
                    @click.stop="showContextMenu($event, item)"
                  />

                  <!-- File Icon / Thumbnail -->
                  <div class="mb-2">
                    <!-- Image thumbnail -->
                    <VImg
                      v-if="isImageFile(item.mimetype) && item.thumbnail"
                      :src="`${ipfsHost}/ipfs/${item.thumbnail}`"
                      :width="48"
                      :height="48"
                      class="rounded mx-auto"
                      cover
                    />
                    <!-- Video thumbnail -->
                    <VImg
                      v-else-if="isVideoFile(item) && videoThumbnails[item.hash]"
                      :src="videoThumbnails[item.hash]"
                      :width="48"
                      :height="48"
                      class="rounded mx-auto"
                      cover
                    >
                      <div class="video-thumbnail-overlay">
                        <VIcon icon="mdi-play-circle" size="20" color="white" />
                      </div>
                    </VImg>
                    <!-- Other file icons (including videos without thumbnails) -->
                    <VIcon
                      v-else
                      :icon="item.isGoBack ? 'mdi-folder-arrow-up' : (item.isFolder ? 'mdi-folder' : getFileIcon(item.type))"
                      :size="48"
                      :class="[item.isFolder || item.isGoBack ? 'text-medium-emphasis' : '']"
                    />
                  </div>

                  <!-- File/Folder Name -->
                  <div class="text-caption font-weight-medium text-truncate mb-1 px-1" :title="item.name">
                    {{ item.name_abbr || item.name }}
                  </div>

                  <!-- File Info (Size + Date) -->
                  <template v-if="!item.isFolder && !item.isGoBack">
                    <div class="text-caption text-medium-emphasis mb-1" style="font-size: 13px !important;">
                      {{ convertSize(item.size) }}
                    </div>
                    <div class="text-caption text-medium-emphasis" style="font-size: 12px !important;">
                      {{ item.added_date || formatDate(item.timestamp) || '-' }}
                    </div>
                  </template>

                  <!-- Folder Date -->
                  <template v-else-if="item.isFolder && !item.isGoBack">
                    <div class="text-caption text-medium-emphasis" style="font-size: 12px !important;">
                      {{ item.added_date || formatDate(item.timestamp) || '-' }}
                    </div>
                  </template>

                  <!-- Version Badge (if file has versions) -->
                  <div
                    v-if="!item.isFolder && !item.isGoBack && item.versions?.length > 0"
                    class="position-absolute version-badge"
                    style="top: 8px; right: 8px;"
                  >
                    <VChip
                      size="x-small"
                      color="primary"
                      variant="flat"
                    >
                      {{ item.versions.length }}
                    </VChip>
                  </div>
                </VCard>
              </VCol>
            </VRow>
          </div>

          <!-- Modern Circle Pagination Footer -->
          <div v-if="stableFiles.length > 5" class="modern-pagination mt-4">
            <!-- Show full pagination if more than current limit -->
            <div v-if="stableFiles.length > filesPerPage" class="d-flex align-center justify-space-between w-100">
              <!-- Left: File count info -->
              <VChip
                variant="tonal"
                size="small"
                class="text-caption pagination-info-chip"
                color="success"
              >
                <VIcon icon="mdi-file-multiple-outline" size="14" class="me-1" />
                {{ t('components.fluxDrive.fileManager.paginationInfo', {
                  start: (currentPage - 1) * filesPerPage + 1,
                  end: Math.min(currentPage * filesPerPage, stableFiles.length),
                  total: stableFiles.length
                }) }}
              </VChip>

              <!-- Center: Pagination controls -->
              <div class="d-flex align-center justify-center ga-1">
                <!-- Previous Button -->
                <VBtn
                  icon
                  variant="flat"
                  size="28"
                  class="pagination-circle"
                  :disabled="currentPage === 1"
                  @click="currentPage--"
                >
                  <VIcon icon="mdi-chevron-left" />
                </VBtn>

                <!-- Page Numbers -->
                <div class="d-flex align-center ga-1">
                  <template v-for="page in paginationRange" :key="page">
                    <VBtn
                      v-if="page !== '...'"
                      :variant="currentPage === page ? 'tonal' : 'text'"
                      :color="currentPage === page ? 'primary' : ''"
                      size="28"
                      class="pagination-circle"
                      :class="{ 'active': currentPage === page }"
                      @click="currentPage = page"
                    >
                      {{ page }}
                    </VBtn>
                    <div v-else class="pagination-dots">
                      <VIcon icon="mdi-dots-horizontal" size="20" class="text-medium-emphasis" />
                    </div>
                  </template>
                </div>

                <!-- Next Button -->
                <VBtn
                  icon
                  variant="flat"
                  size="28"
                  class="pagination-circle"
                  :disabled="currentPage === Math.ceil(stableFiles.length / filesPerPage)"
                  @click="currentPage++"
                >
                  <VIcon icon="mdi-chevron-right" />
                </VBtn>
              </div>

              <!-- Right: Items per page selector -->
              <div class="d-flex align-center pagination-selector-container">
                <VIcon icon="mdi-format-list-numbered" size="16" class="text-medium-emphasis me-2" />
                <VSelect
                  v-model="filesPerPage"
                  :items="[5, 10, 25, 50, 100]"
                  variant="solo"
                  density="compact"
                  class="pagination-selector"
                  hide-details
                  @update:model-value="currentPage = 1"
                >
                  <template #selection="{ item }">
                    <span class="text-caption font-weight-medium">{{ item.value }}</span>
                  </template>
                </VSelect>
              </div>
            </div>

            <!-- Show only limiter when items <= current limit -->
            <div v-else class="d-flex align-center justify-end w-100">
              <div class="d-flex align-center pagination-selector-container">
                <VIcon icon="mdi-format-list-numbered" size="16" class="text-medium-emphasis me-2" />
                <VSelect
                  v-model="filesPerPage"
                  :items="[5, 10, 25, 50, 100]"
                  variant="solo"
                  density="compact"
                  class="pagination-selector"
                  hide-details
                  @update:model-value="currentPage = 1"
                >
                  <template #selection="{ item }">
                    <span class="text-caption font-weight-medium">{{ item.value }}</span>
                  </template>
                </VSelect>
              </div>
            </div>
          </div>
        </div>

      </VCardText>
    </VCard>

    <!-- File Preview Dialog -->
    <VDialog
      v-model="showFileModal"
      fullscreen
      transition="dialog-bottom-transition"
      content-class="elevation-10 preview-dialog"
    >
      <VCard v-if="previewingFile" class="preview-card d-flex flex-column" style="height: 100vh;">
        <!-- Preview Header with Actions -->
        <div class="preview-header d-flex align-center pa-2 flex-shrink-0">
          <!-- Close button on the left -->
          <VBtn
            icon="mdi-close"
            variant="text"
            color="grey"
            @click="closeModal"
          />

          <!-- File name in the center -->
          <div class="flex-grow-1 text-center px-4">
            <span class="text-body-1 text-truncate d-inline-block" style="max-width: 400px;">
              {{ previewingFile.name }}
            </span>
          </div>

          <!-- Action buttons on the right -->
          <div class="d-flex gap-1">
            <!-- Edit button for text files -->
            <VBtn
              v-if="isTextFile(previewingFile.mimetype, previewingFile.name)"
              icon="mdi-pencil"
              variant="text"
              color="grey"
              @click="openEditor(previewingFile)"
            >
              <VIcon icon="mdi-pencil" />
              <VTooltip activator="parent" location="bottom">{{ t('components.fluxDrive.fileManager.edit') }}</VTooltip>
            </VBtn>

            <VBtn
              icon="mdi-download"
              variant="text"
              color="grey"
              @click="downloadFile(previewingFile)"
            >
              <VIcon icon="mdi-download" />
              <VTooltip activator="parent" location="bottom">{{ t('components.fluxDrive.fileManager.download') }}</VTooltip>
            </VBtn>

            <VMenu>
              <template #activator="{ props }">
                <VBtn
                  icon="mdi-dots-vertical"
                  variant="text"
                  color="grey"
                  v-bind="props"
                >
                  <VIcon icon="mdi-dots-vertical" />
                </VBtn>
              </template>
              <VList density="compact">
                <VListItem @click="handlePreviewMenuAction('rename', previewingFile)">
                  <template #prepend>
                    <VIcon icon="mdi-pencil" size="20" />
                  </template>
                  <VListItemTitle>{{ t('components.fluxDrive.fileManager.rename') }}</VListItemTitle>
                </VListItem>
                <VListItem @click="handlePreviewMenuAction('move', previewingFile)">
                  <template #prepend>
                    <VIcon icon="mdi-folder-move" size="20" />
                  </template>
                  <VListItemTitle>{{ t('components.fluxDrive.fileManager.moveTo') }}</VListItemTitle>
                </VListItem>
                <VListItem v-if="!previewingFile?.isFolder" @click="handlePreviewMenuAction('copy', previewingFile)">
                  <template #prepend>
                    <VIcon icon="mdi-link" size="20" />
                  </template>
                  <VListItemTitle>{{ t('components.fluxDrive.fileManager.copyLink') }}</VListItemTitle>
                </VListItem>
                <VListItem @click="handlePreviewMenuAction('delete', previewingFile)" class="text-error">
                  <template #prepend>
                    <VIcon icon="mdi-delete" size="20" color="error" />
                  </template>
                  <VListItemTitle>{{ t('components.fluxDrive.fileManager.delete') }}</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </div>
        </div>

        <VDivider />

        <VCardText class="preview-content pa-0 flex-grow-1 d-flex flex-column">
          <div v-if="isImageFile(previewingFile.mimetype)" class="preview-container flex-grow-1 d-flex align-center justify-center bg-black">
            <VImg
              :src="`${ipfsHost}/ipfs/${previewingFile.hash}`"
              contain
              :alt="previewingFile.name"
              style="width: 100%; height: 100%;"
            />
          </div>
          <div v-else-if="isVideoFile(previewingFile)" class="preview-container flex-grow-1 d-flex align-center justify-center bg-black">
            <video
              :src="`${ipfsHost}/ipfs/${previewingFile.hash}`"
              controls
              autoplay
              style="width: 100%; height: 100%; object-fit: contain;"
              :poster="previewingFile.thumbnail"
            >
              {{ t('components.fluxDrive.fileManager.browserNoVideoSupport') }}
            </video>
          </div>
          <div v-else-if="isAudioFile(previewingFile)" class="preview-container d-flex align-center justify-center" style="min-height: 300px;">
            <div class="text-center">
              <VIcon
                icon="mdi-music-note"
                size="64"
                class="mb-4 text-medium-emphasis"
              />
              <audio
                :src="`${ipfsHost}/ipfs/${previewingFile.hash}`"
                controls
                autoplay
                style="width: 300px; display: block;"
              >
                {{ t('components.fluxDrive.fileManager.browserNoAudioSupport') }}
              </audio>
            </div>
          </div>
          <div v-else-if="isPdfFile(previewingFile)" class="preview-container flex-grow-1 d-flex flex-column bg-black">
            <iframe
              :src="`${ipfsHost}/ipfs/${previewingFile.hash}`"
              style="width: 100%; height: 100%; border: none;"
              type="application/pdf"
            />
          </div>
          <div v-else class="preview-container d-flex align-center justify-center" style="min-height: 400px;">
            <div class="text-center">
              <VIcon
                :icon="getFileIcon(previewingFile.type)"
                size="64"
                class="mb-4 text-medium-emphasis"
              />
              <p class="text-body-1 text-medium-emphasis">{{ t('components.fluxDrive.fileManager.previewNotAvailable') }}</p>
              <VBtn
                color="primary"
                variant="flat"
                class="mt-4"
                :href="`${ipfsHost}/ipfs/${previewingFile.hash}`"
                target="_blank"
                rel="noopener noreferrer"
                prepend-icon="mdi-download"
              >
                {{ t('components.fluxDrive.fileManager.downloadFile') }}
              </VBtn>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Upload Progress Dialog -->
    <VDialog
      v-model="uploading"
      persistent
      max-width="420"
      attach
    >
      <VCard class="modern-upload-card" elevation="24">
        <VCardText class="pa-8">
          <div class="d-flex flex-column align-center">
            <!-- Upload Icon & Animation -->
            <div class="upload-icon-container mb-4">
              <VIcon
                icon="mdi-cloud-upload"
                size="48"
                color="primary"
                class="upload-icon"
              />
              <VProgressCircular
                indeterminate
                size="72"
                width="3"
                color="primary"
                class="upload-spinner"
              />
            </div>

            <!-- Upload Text -->
            <div class="text-center mb-4">
              <h3 class="text-h6 font-weight-bold text-primary mb-1">
                {{ totalFilesToUpload > 1 ? t('components.fluxDrive.fileManager.uploadingFiles', { current: currentUploadIndex + 1, total: totalFilesToUpload }) : t('components.fluxDrive.fileManager.uploadingFile') }}
              </h3>
              <p class="text-body-2 text-medium-emphasis mb-1">
                {{ currentFileName || t('components.fluxDrive.fileManager.uploadWait') }}
              </p>
              <p v-if="currentFileSize > 0" class="text-caption text-medium-emphasis mb-2">
                {{ formatFileSize(currentFileSize) }}
              </p>
            </div>

            <!-- Progress Bar -->
            <div class="upload-progress-container">
              <VProgressLinear
                :model-value="localUploadProgress"
                color="primary"
                height="6"
                rounded
                class="mb-3"
                bg-color="surface-variant"
              />
              <div class="text-center">
                <span class="text-caption text-medium-emphasis">
                  {{ t('components.fluxDrive.fileManager.uploadProgress', { progress: localUploadProgress }) }}
                  <span v-if="totalFilesToUpload > 1">
                    • {{ t('components.fluxDrive.fileManager.fileOfTotal', { current: currentUploadIndex + 1, total: totalFilesToUpload }) }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Download Progress Dialog -->
    <VDialog
      v-model="downloading"
      persistent
      max-width="400"
      attach
    >
      <VCard>
        <VCardText class="text-center pa-8">
          <VProgressCircular
            indeterminate
            size="64"
            width="4"
            color="success"
            class="mb-4"
          />
          <h3 class="text-h5 mb-2">{{ t('components.fluxDrive.fileManager.downloading') }}</h3>
          <p class="text-body-1 mb-3">{{ downloadingFile }}</p>
          <VProgressLinear
            :model-value="downloadProgress"
            color="success"
            height="8"
            rounded
            class="mb-2"
          />
          <p class="text-body-2">{{ t('components.fluxDrive.fileManager.downloadProgress', { progress: downloadProgress }) }}</p>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog
      v-model="showDeleteDialog"
      max-width="400"
      attach
    >
      <VCard>
        <VCardTitle class="d-flex align-center px-3 py-1 bg-primary text-white">
          <VIcon icon="mdi-delete" class="me-3" style="color: rgba(255,255,255,0.9);" />
          <h3 class="text-subtitle-1 text-white">{{ t('components.fluxDrive.fileManager.confirmDelete') }}</h3>
        </VCardTitle>
        <VCardText class="pa-6 pt-4">
          <p class="text-body-1 mb-4">
            {{ t('components.fluxDrive.fileManager.confirmDeleteMessage', { type: itemToDelete?.isFolder ? t('components.fluxDrive.fileManager.folder') : t('components.fluxDrive.fileManager.file') }) }}
          </p>
          <VCard
            variant="outlined"
            class="pa-3 bg-grey-lighten-4"
            density="compact"
          >
            <div class="d-flex align-center">
              <VIcon
                :icon="itemToDelete?.isFolder ? 'mdi-folder' : 'mdi-file-document'"
                class="me-2"
                :color="itemToDelete?.isFolder ? 'amber' : 'blue'"
              />
              <span class="text-subtitle-1 font-weight-medium">
                {{ itemToDelete?.name }}
              </span>
            </div>
          </VCard>
        </VCardText>
        <VCardActions class="pa-6 pt-0">
          <VSpacer />
          <VBtn
            variant="flat"
            color="primary"
            density="compact"
            class="text-caption"
            @click="cancelDelete"
          >
            {{ t('components.fluxDrive.fileManager.cancel') }}
          </VBtn>
          <VBtn
            variant="flat"
            color="error"
            density="compact"
            class="text-caption"
            @click="confirmDelete"
          >
            {{ t('components.fluxDrive.fileManager.delete') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Cancel Subscription Confirmation Dialog -->
    <VDialog
      v-model="showCancelDialog"
      max-width="500"
      attach
    >
      <VCard>
        <VCardTitle class="d-flex align-center px-4 py-3 bg-error text-white">
          <VIcon icon="mdi-alert" class="me-3" size="28" style="color: rgba(255,255,255,0.9);" />
          <h3 class="text-h6 text-white">{{ t('components.fluxDrive.fileManager.cancelSubscriptionTitle') }}</h3>
        </VCardTitle>
        <VCardText class="pa-6 pt-4">
          <p class="text-body-1 mb-4">
            {{ t('components.fluxDrive.fileManager.cancelSubscriptionMessage') }}
          </p>
          <VAlert
            type="info"
            variant="tonal"
            density="compact"
          >
            <div class="text-caption">
              {{ t('components.fluxDrive.fileManager.cancelSubscriptionNote') }}
            </div>
          </VAlert>
        </VCardText>
        <VCardActions class="pa-6 pt-0">
          <VSpacer />
          <VBtn
            variant="flat"
            color="primary"
            size="default"
            :disabled="cancelingSubscription"
            @click="showCancelDialog = false"
          >
            {{ t('components.fluxDrive.fileManager.cancelSubscriptionCancel') }}
          </VBtn>
          <VBtn
            variant="flat"
            color="error"
            size="default"
            :loading="cancelingSubscription"
            @click="handleCancelSubscription"
          >
            {{ t('components.fluxDrive.fileManager.cancelSubscriptionConfirm') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Upgrade Plan Dialog -->
    <VDialog
      v-model="showUpgradeDialog"
      max-width="900"
      scrollable
      attach
    >
      <VCard>
        <VCardTitle class="d-flex align-center px-4 py-2 bg-primary text-white">
          <VIcon icon="mdi-rocket-launch" class="me-2" size="24" style="color: rgba(255,255,255,0.9);" />
          <h3 class="text-h5 text-white">{{ t('components.fluxDrive.fileManager.manageSubscription') }}</h3>
          <VSpacer />
          <VBtn
            icon="mdi-close"
            variant="text"
            color="white"
            @click="showUpgradeDialog = false"
          />
        </VCardTitle>
        <VCardText class="pa-6 pt-0">
          <!-- Show pricing plans component here -->
          <PricingPlans
            @selectPlan="handleUpgradePlan"
            @cancel-subscription="showCancelDialog = true; showUpgradeDialog = false"
          />
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Rename Dialog -->
    <VDialog
      v-model="showRenameDialog"
      max-width="500"
      persistent
      attach
    >
      <VCard>
        <VCardTitle class="d-flex align-center px-3 py-1 bg-primary text-white">
          <VIcon icon="mdi-rename-box" class="me-2" style="color: rgba(255,255,255,0.9);" />
          <h3 class="text-subtitle-1 text-white">{{ t('components.fluxDrive.fileManager.renameItem', { type: itemToRename?.isFolder ? t('components.fluxDrive.fileManager.folder') : t('components.fluxDrive.fileManager.file') }) }}</h3>
          <VSpacer />
          <VBtn
            icon="mdi-close"
            variant="text"
            color="white"
            @click="showRenameDialog = false"
          />
        </VCardTitle>
        <VCardText class="pa-6 pt-4">
          <VTextField
            v-model="renameText"
            :label="t('components.fluxDrive.fileManager.newName')"
            variant="outlined"
            density="compact"
            autofocus
            :error="!renameValidation.isValid && !!renameText?.trim()"
            :error-messages="!renameValidation.isValid && renameText?.trim() ? renameValidation.hint : ''"
            @keyup.enter="renameValidation.isValid ? confirmRename() : null"
          />
        </VCardText>
        <VCardActions class="pa-6 pt-0">
          <VSpacer />
          <VBtn
            variant="flat"
            color="error"
            density="compact"
            class="text-caption"
            @click="showRenameDialog = false"
          >
            {{ t('components.fluxDrive.fileManager.cancel') }}
          </VBtn>
          <VBtn
            variant="flat"
            color="primary"
            density="compact"
            class="text-caption"
            :disabled="!renameValidation.isValid"
            @click="confirmRename"
          >
            {{ t('components.fluxDrive.fileManager.rename') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Move Dialog -->
    <VDialog
      v-model="showMoveDialog"
      max-width="500"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center px-3 py-1 bg-primary text-white">
          <VIcon icon="mdi-folder-move" class="me-2" style="color: rgba(255,255,255,0.9);" />
          <h3 class="text-subtitle-1 text-white">{{ t('components.fluxDrive.fileManager.moveItem', { type: itemToMove?.isFolder ? t('components.fluxDrive.fileManager.folder') : t('components.fluxDrive.fileManager.file') }) }}</h3>
          <VSpacer />
          <VBtn
            icon="mdi-close"
            variant="text"
            color="white"
            @click="showMoveDialog = false"
          />
        </VCardTitle>
        <VCardText class="pa-6 pt-4">
          <VCard
            variant="outlined"
            class="pa-3 bg-grey-lighten-4 mb-4"
            density="compact"
          >
            <div class="d-flex align-center">
              <VIcon
                :icon="itemToMove?.isFolder ? 'mdi-folder' : 'mdi-file-document'"
                class="me-2"
                :color="itemToMove?.isFolder ? 'amber' : 'blue'"
              />
              <span class="text-subtitle-1 font-weight-medium">
                {{ itemToMove?.name }}
              </span>
            </div>
          </VCard>
          <VTextField
            v-model="moveDestination"
            :label="t('components.fluxDrive.fileManager.destinationFolder')"
            :placeholder="t('components.fluxDrive.fileManager.destinationPlaceholder')"
            variant="outlined"
            density="compact"
            autofocus
            @keyup.enter="confirmMove"
          />
        </VCardText>
        <VCardActions class="pa-6 pt-0">
          <VSpacer />
          <VBtn
            variant="flat"
            color="error"
            density="compact"
            class="text-caption"
            @click="showMoveDialog = false"
          >
            {{ t('components.fluxDrive.fileManager.cancel') }}
          </VBtn>
          <VBtn
            variant="flat"
            color="primary"
            density="compact"
            class="text-caption"
            @click="confirmMove"
          >
            {{ t('components.fluxDrive.fileManager.move') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Versions Dialog -->
    <VDialog
      v-model="showVersionsDialog"
      max-width="800"
      persistent
      scrollable
    >
      <VCard>
        <VCardTitle class="d-flex align-center px-3 py-1 bg-primary text-white">
          <VIcon icon="mdi-history" class="me-2" style="color: rgba(255,255,255,0.9);" />
          <h3 class="text-subtitle-1 text-white">{{ t('components.fluxDrive.fileManager.fileVersionsTitle', { name: fileForVersions?.name }) }}</h3>
          <VSpacer />
          <VBtn
            icon="mdi-close"
            variant="text"
            color="white"
            @click="showVersionsDialog = false"
          />
        </VCardTitle>
        <VCardText class="pa-6 pt-0">
          <div v-if="fileForVersions?.versions?.length > 0">
            <p class="text-body-2 mb-4">
              {{ t('components.fluxDrive.fileManager.fileVersionsDescription', { count: fileForVersions.versions.length }) }}
            </p>

            <VList>
              <!-- Current version -->
              <VListItem>
                <template #prepend>
                  <VIcon icon="mdi-star" color="primary" />
                </template>
                <VListItemTitle>
                  {{ t('components.fluxDrive.fileManager.currentVersion') }}
                  <VChip size="x-small" color="success" class="ml-2">{{ t('components.fluxDrive.fileManager.latest') }}</VChip>
                </VListItemTitle>
                <VListItemSubtitle>
                  Size: {{ convertSize(fileForVersions.size) }} •
                  Hash: {{ fileForVersions.hash_abbr }}
                </VListItemSubtitle>
                <template #append>
                  <VBtn
                    icon="mdi-download"
                    size="small"
                    variant="text"
                    @click="downloadFileVersion(fileForVersions)"
                  />
                  <VBtn
                    icon="mdi-open-in-new"
                    size="small"
                    variant="text"
                    @click="openFileVersion(fileForVersions)"
                  />
                </template>
              </VListItem>

              <VDivider class="my-2" />

              <!-- Previous versions -->
              <VListItem
                v-for="(version, index) in fileForVersions.versions"
                :key="version.hash || index"
              >
                <template #prepend>
                  <VIcon icon="mdi-clock-outline" />
                </template>
                <VListItemTitle>
                  {{ t('components.fluxDrive.fileManager.versionNumber', { number: fileForVersions.versions.length - index }) }}
                </VListItemTitle>
                <VListItemSubtitle>
                  Size: {{ convertSize(version.size || 0) }} •
                  Hash: {{ version.hash?.substring(0, 8) }}...
                  <span v-if="version.timestamp">
                    • {{ new Date(version.timestamp * 1000).toLocaleString() }}
                  </span>
                </VListItemSubtitle>
                <template #append>
                  <VBtn
                    icon="mdi-download"
                    size="small"
                    variant="text"
                    @click="downloadFileVersion(version)"
                  />
                  <VBtn
                    icon="mdi-open-in-new"
                    size="small"
                    variant="text"
                    @click="openFileVersion(version)"
                  />
                </template>
              </VListItem>
            </VList>
          </div>
          <div v-else>
            <p class="text-body-1">{{ t('components.fluxDrive.fileManager.noPreviousVersions') }}</p>
          </div>
        </VCardText>
        <VCardActions class="pa-6 pt-0">
          <VSpacer />
          <VBtn
            variant="flat"
            color="error"
            density="compact"
            class="text-caption"
            @click="showVersionsDialog = false"
          >
            {{ t('components.fluxDrive.fileManager.close') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Create Folder Dialog -->
    <VDialog
      v-model="showCreateFolderDialog"
      max-width="500"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center px-3 py-1 bg-primary text-white">
          <VIcon icon="mdi-folder-plus" class="me-2" style="color: rgba(255,255,255,0.9);" />
          <h3 class="text-subtitle-1 text-white">{{ t('components.fluxDrive.fileManager.createNewFolder') }}</h3>
          <VSpacer />
          <VBtn
            icon="mdi-close"
            variant="text"
            color="white"
            @click="showCreateFolderDialog = false"
          />
        </VCardTitle>
        <VCardText class="pa-6 pt-4">
          <VTextField
            v-model="newFolderName"
            :label="t('components.fluxDrive.fileManager.folderName')"
            variant="outlined"
            density="compact"
            autofocus
            @keyup.enter="confirmCreateFolder"
          />
        </VCardText>
        <VCardActions class="pa-6 pt-0">
          <VSpacer />
          <VBtn
            variant="flat"
            color="error"
            density="compact"
            class="text-caption"
            @click="showCreateFolderDialog = false"
          >
            {{ t('components.fluxDrive.fileManager.cancel') }}
          </VBtn>
          <VBtn
            variant="flat"
            color="primary"
            density="compact"
            class="text-caption"
            :disabled="!newFolderName?.trim()"
            @click="confirmCreateFolder"
          >
            {{ t('components.fluxDrive.fileManager.createFolder') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Grid Context Menu -->
    <VMenu
      v-model="showGridContextMenu"
      :style="{ position: 'fixed', left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      absolute
      offset-y
    >
      <VList v-if="contextMenuItem" density="compact">
        <!-- File-specific options -->
        <template v-if="!contextMenuItem.isFolder">
          <VListItem @click="handleContextMenuAction('preview')">
            <template #prepend>
              <VIcon icon="mdi-eye" size="20" />
            </template>
            <VListItemTitle>Preview</VListItemTitle>
          </VListItem>

          <VListItem @click="handleContextMenuAction('download')">
            <template #prepend>
              <VIcon icon="mdi-download" size="20" />
            </template>
            <VListItemTitle>{{ t('components.fluxDrive.fileManager.download') }}</VListItemTitle>
          </VListItem>

          <VListItem @click="handleContextMenuAction('addVersion')">
            <template #prepend>
              <VIcon icon="mdi-file-plus" size="20" />
            </template>
            <VListItemTitle>{{ t('components.fluxDrive.fileManager.addVersion') }}</VListItemTitle>
          </VListItem>

          <VListItem
            v-if="contextMenuItem.versions?.length > 0"
            @click="handleContextMenuAction('versions')"
          >
            <template #prepend>
              <VIcon icon="mdi-history" size="20" />
            </template>
            <VListItemTitle>{{ t('components.fluxDrive.fileManager.viewVersions') }}</VListItemTitle>
          </VListItem>

        </template>

        <!-- Common options for files and folders -->
        <VListItem @click="handleContextMenuAction('rename')">
          <template #prepend>
            <VIcon icon="mdi-pencil" size="20" />
          </template>
          <VListItemTitle>{{ t('components.fluxDrive.fileManager.rename') }}</VListItemTitle>
        </VListItem>

        <VListItem @click="handleContextMenuAction('move')">
          <template #prepend>
            <VIcon icon="mdi-folder-move" size="20" />
          </template>
          <VListItemTitle>{{ t('components.fluxDrive.fileManager.moveTo') }}</VListItemTitle>
        </VListItem>

        <VListItem v-if="!contextMenuItem.isFolder" @click="handleContextMenuAction('copy')">
          <template #prepend>
            <VIcon icon="mdi-link" size="20" />
          </template>
          <VListItemTitle>{{ t('components.fluxDrive.fileManager.copyLink') }}</VListItemTitle>
        </VListItem>

        <VListItem @click="handleContextMenuAction('delete')" class="text-error">
          <template #prepend>
            <VIcon icon="mdi-delete" size="20" color="error" />
          </template>
          <VListItemTitle>{{ t('components.fluxDrive.fileManager.delete') }}</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>

    <!-- Versions Dialog -->
    <VersionsDialog
      v-model="showVersionsDialog"
      :file="fileForVersions"
      @showMessage="handleVersionsMessage"
      @previewFile="handlePreviewFile"
    />

    <!-- Add Version Dialog (like FluxCloud) -->
    <VDialog
      v-model="showAddVersionDialog"
      max-width="600"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center px-3 py-1 bg-primary text-white">
          <VIcon icon="mdi-plus-circle" class="me-2" style="color: rgba(255,255,255,0.9);" />
          <h3 class="text-subtitle-1 text-white">{{ t('components.fluxDrive.fileManager.addVersion') }}</h3>
          <VSpacer />
          <VBtn
            icon="mdi-close"
            variant="text"
            color="white"
            @click="showAddVersionDialog = false"
          />
        </VCardTitle>

        <VCardText class="pa-4">
          <!-- File selection -->
          <VFileInput
            ref="versionFileInput"
            :label="t('components.fluxDrive.fileManager.selectFileToUpload')"
            accept="*/*"
            prepend-icon="mdi-file-upload"
            class="no-wrap-filename"
            @change="handleVersionFileSelect"
          >
            <template v-if="selectedVersionFile" #append-inner>
              <VChip
                size="small"
                color="surface-variant"
                variant="tonal"
                class="ml-2"
              >
                {{ formatFileSize(selectedVersionFile.size) }}
              </VChip>
            </template>
          </VFileInput>

          <!-- Comment field -->
          <VTextField
            v-model="versionComment"
            :label="t('components.fluxDrive.fileManager.versionComment')"
            placeholder="e.g., Bug fixes, new features..."
            prepend-icon="mdi-comment-text"
            :counter="100"
            :rules="[(v) => !v || v.length <= 100 || 'Comment must be less than 100 characters']"
            class="mt-4"
          />

          <div class="text-caption text-medium-emphasis mt-2">
            {{ t('components.fluxDrive.fileManager.addVersionDescription', { fileName: fileForAddVersion?.name }) }}
          </div>
        </VCardText>

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            variant="flat"
            color="error"
            size="small"
            @click="showAddVersionDialog = false"
          >
            {{ t('components.fluxDrive.fileManager.cancel') }}
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            size="small"
            :loading="uploading"
            :disabled="!selectedVersionFile"
            @click="uploadVersion"
          >
            <VIcon icon="mdi-upload" class="mr-2" />
            {{ t('components.fluxDrive.fileManager.addVersion') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Text Editor Dialog -->
    <VDialog
      v-model="showEditorDialog"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <VCard>
        <VToolbar color="primary" dark density="compact">
          <VBtn
            icon
            size="small"
            @click="showEditorDialog = false"
          >
            <VIcon>mdi-close</VIcon>
          </VBtn>
          <VToolbarTitle class="text-subtitle-1">
            <div class="d-flex align-center">
              <VIcon icon="mdi-file-edit" size="20" class="me-2" />
              {{ editingFile?.name || 'Edit File' }}
            </div>
          </VToolbarTitle>
          <VSpacer />
          <VBtn
            variant="flat"
            color="error"
            size="small"
            class="me-2"
            @click="showEditorDialog = false"
          >
            <VIcon icon="mdi-close" size="18" class="me-1" />
            Cancel
          </VBtn>
          <VBtn
            variant="flat"
            color="success"
            size="small"
            class="me-4"
            :loading="savingFile"
            :disabled="!hasContentChanged || loadingContent"
            @click="saveEditedFile"
          >
            <VIcon icon="mdi-content-save" size="18" class="me-1" />
            Save
          </VBtn>
        </VToolbar>

        <VCardText class="pa-0" style="height: calc(100vh - 48px); position: relative;">
          <!-- Monaco editor for code/text files -->
          <VueMonacoEditor
            v-model:value="fileContent"
            :language="getFileLanguage(editingFile?.name)"
            theme="vs-dark"
            :options="{
              automaticLayout: true,
              fontSize: 14,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
            }"
            style="height: 100%;"
            @mount="editorMounted = true"
          />

          <!-- Loader overlay -->
          <div v-show="loadingContent || !editorMounted" class="fluxdrive-editor-loader">
            <LoadingSpinner
              icon="mdi-file-document-edit"
              :icon-size="50"
              :title="t('components.fluxDrive.fileManager.loadingFileContent')"
              message=""
            />
          </div>
        </VCardText>
      </VCard>
    </VDialog>


  </VContainer>

  <!-- High Z-Index Toast Messages (Above Dialogs) -->
  <VSnackbar
    v-model="showToast"
    :color="toastType"
    :timeout="toastDuration"
    location="top center"
    :style="{ zIndex: 10000 }"
  >
    <div class="d-flex align-center">
      <VIcon :icon="toastIcon" class="me-2" />
      {{ toastMessage }}
    </div>
  </VSnackbar>
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFluxDrive } from '@/composables/useFluxDrive'
import PricingPlans from '@/components/FluxDrive/PricingPlans.vue'
import VersionsDialog from '@/components/FluxDrive/VersionsDialog.vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import ClipboardJS from 'clipboard'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'

// Define emit for FileManager
const emit = defineEmits(['select-plan', 'selectPlan'])

// Initialize i18n
const { t } = useI18n()

// Local state with persistence
const viewType = ref(localStorage.getItem('fluxdrive-view-type') || 'list') // 'list' or 'grid'

// Watch viewType changes to persist to localStorage
watch(viewType, newValue => {
  localStorage.setItem('fluxdrive-view-type', newValue)
  console.log('🔄 View type changed to:', newValue)
})

// Get payment gateway from API (via useFluxDrive composable)
const { paymentGateway, cancelSubscription } = useFluxDrive()
const isCryptoComSubscription = computed(() => paymentGateway.value === 'cryptocom')

const showUpgradeDialog = ref(false)
const downloading = ref(false)
const downloadProgress = ref(0)
const downloadingFile = ref('')

// Dialog states
const showDeleteDialog = ref(false)
const itemToDelete = ref(null)

const showRenameDialog = ref(false)
const itemToRename = ref(null)

const showVersionsDialog = ref(false)

// Cancel subscription dialog state
const showCancelDialog = ref(false)
const cancelingSubscription = ref(false)
const fileForVersions = ref(null)

const showAddVersionDialog = ref(false)
const fileForAddVersion = ref(null)
const versionComment = ref('')

const renameText = ref('')

// Editor dialog states
const showEditorDialog = ref(false)
const editingFile = ref(null)
const fileContent = ref('')
const originalFileContent = ref('')
const loadingContent = ref(false)
const savingFile = ref(false)
const editorMounted = ref(false)

// Check if file content has changed
const hasContentChanged = computed(() => {
  return fileContent.value !== originalFileContent.value
})


// Local upload progress tracking
const currentUploadIndex = ref(0)
const totalFilesToUpload = ref(0)
const currentFileName = ref('')
const currentFileSize = ref(0)
const localUploadProgress = ref(0)

// High z-index toast system for messages above dialogs
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const toastIcon = ref('mdi-check-circle')
const toastDuration = ref(5000)

// Computed validation for rename
const renameValidation = computed(() => {
  if (!renameText.value?.trim()) {
    return { isValid: false, hint: 'Please enter a name' }
  }
  if (itemToRename.value && renameText.value.trim() === itemToRename.value.name) {
    return { isValid: false, hint: 'Name is the same as current name' }
  }
  
  return { isValid: true, hint: '' }
})

const showMoveDialog = ref(false)
const itemToMove = ref(null)
const moveDestination = ref('')

const showCreateFolderDialog = ref(false)
const newFolderName = ref('')

// Keep stable files data during loading to prevent jumping
const previousFiles = ref([])
const stableFiles = computed(() => {
  // Always return current files, don't try to be smart about loading states
  // This prevents empty page issues during refresh operations
  return files.value || []
})

// Unified local message system (independent of composable)
const localMessage = ref('')
const localMessageType = ref('success') // 'success', 'error', 'warning', 'info'
const localMessageIcon = ref('mdi-check-circle')

// Helper function to show local messages
const showLocalMessage = (message, type = 'success', icon = 'mdi-check-circle', duration = 5000) => {
  localMessage.value = message
  localMessageType.value = type
  localMessageIcon.value = icon

  // Clear message after duration
  setTimeout(() => {
    localMessage.value = ''
  }, duration)
}

// Helper function to show toast messages above dialogs
const showToastMessage = (message, type = 'success', icon = 'mdi-check-circle', duration = 5000) => {
  toastMessage.value = message
  toastType.value = type
  toastIcon.value = icon
  toastDuration.value = duration
  showToast.value = true
}

// Handle messages from VersionsDialog
const handleVersionsMessage = ({ message, type }) => {
  const iconMap = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
  }
  showToastMessage(message, type, iconMap[type] || 'mdi-check-circle')
}

// Handle file preview requests from VersionsDialog
const handlePreviewFile = file => {
  console.log('🔍 FileManager received preview-file event:', file.name, file.hash)
  previewFile(file)
}

// Local copy link function with success message (files only)
const handleCopyLink = item => {
  try {
    let linkUrl = ''

    // Use the link property if available (FluxCloud format)
    if (item.link) {
      linkUrl = item.link
    } else if (item.hash) {
      // Fall back to constructing URL from hash
      linkUrl = `${ipfsHost}/ipfs/${item.hash}`
    } else {
      throw new Error('No link or hash available for this file')
    }

    // Create temporary button for ClipboardJS
    const button = document.createElement('button')
    button.setAttribute('data-clipboard-text', linkUrl)
    document.body.appendChild(button)

    // Initialize ClipboardJS
    const clipboard = new ClipboardJS(button)

    clipboard.on('success', () => {
      showLocalMessage(
        `Link for "${item.name}" copied to clipboard`,
        'success',
        'mdi-link',
      )
      clipboard.destroy()
      document.body.removeChild(button)
    })

    clipboard.on('error', err => {
      console.error('ClipboardJS error:', err)
      showLocalMessage(
        `Failed to copy link for "${item.name}"`,
        'error',
        'mdi-link-off',
      )
      clipboard.destroy()
      document.body.removeChild(button)
    })

    // Trigger the click programmatically
    button.click()
  } catch (error) {
    console.error('Copy link error:', error)
    showLocalMessage(
      `Failed to copy link for "${item.name}": ${error.message}`,
      'error',
      'mdi-link-off',
    )
  }
}

// View versions function
const viewVersions = item => {
  console.log('🔍 Viewing versions for:', item.name)
  console.log('🔍 File data:', JSON.stringify(item, null, 2))
  console.log('🔍 File versions array:', item.versions)
  console.log('🔍 Versions length:', item.versions?.length || 0)
  fileForVersions.value = item
  showVersionsDialog.value = true
}

// Add version function (like FluxCloud)
const addVersion = item => {
  console.log('➕ Adding version for:', item.name)
  fileForAddVersion.value = item
  versionComment.value = ''
  selectedVersionFile.value = null
  showAddVersionDialog.value = true
}

// Version file selection handler
const selectedVersionFile = ref(null)

const handleVersionFileSelect = event => {
  const files = event.target.files
  if (files && files.length > 0) {
    selectedVersionFile.value = files[0]
    console.log('📁 Version file selected:', selectedVersionFile.value.name)
  } else {
    selectedVersionFile.value = null
  }
}

// Upload version function (like FluxCloud uploadVersion)
const uploadVersion = async () => {
  if (!selectedVersionFile.value || !fileForAddVersion.value) {
    showLocalMessage('Please select a file first', 'error')
    
    return
  }

  const fileSize = formatFileSize(selectedVersionFile.value.size)
  const fileSizeInMB = selectedVersionFile.value.size / (1024 * 1024)

  if (fileSizeInMB > 100) {
    showToastMessage(`File too large! Upload limit is 100.00 MB (${fileSize} provided)`, 'error', 'mdi-file-alert')
    
    return
  }

  try {
    uploading.value = true
    currentFileName.value = selectedVersionFile.value.name
    currentFileSize.value = selectedVersionFile.value.size
    localUploadProgress.value = 0

    // Close the add version dialog now that upload started
    showAddVersionDialog.value = false

    // Use FluxCloud's uploadVersion API with existingFile parameter
    const existingFileHash = fileForAddVersion.value.hash
    const comment = versionComment.value || `Version created on ${new Date().toLocaleDateString()}`

    // Create a polling mechanism to sync global progress to local progress during version upload
    const progressInterval = setInterval(() => {
      localUploadProgress.value = uploadProgress.value
    }, 100)

    try {
      await uploadVersionToFluxCloud(existingFileHash, fileForAddVersion.value.name, selectedVersionFile.value, comment)
    } finally {
      clearInterval(progressInterval)
    }

    showAddVersionDialog.value = false
    selectedVersionFile.value = null
    versionComment.value = ''

    // Refresh files to show updated version
    await loadFiles(false)
    showLocalMessage(
      `New version of "${fileForAddVersion.value.name}" added successfully`,
      'success',
      'mdi-upload',
    )

  } catch (error) {
    console.error('Failed to upload version:', error)
    showLocalMessage(`Failed to add version: ${error.message}`, 'error', 'mdi-upload-off')
  } finally {
    uploading.value = false
    currentFileName.value = ''
    currentFileSize.value = 0
    localUploadProgress.value = 0
  }
}

// Custom upload function with progress tracking
const uploadFileWithProgress = async file => {
  try {
    // Get authentication details
    const zelidauth = localStorage.getItem('zelidauth')
    const authData = zelidauth ?
      (zelidauth.includes('zelid=') ?
        Object.fromEntries(new URLSearchParams(zelidauth)) :
        JSON.parse(zelidauth)) : {}

    if (!authData.zelid || !authData.loginPhrase || !authData.signature) {
      throw new Error('Authentication required. Please log in again.')
    }

    // Create FormData for file upload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('zelid', authData.zelid)
    formData.append('signature', authData.signature)
    formData.append('loginPhrase', authData.loginPhrase)

    // Add folder parameter
    const folderPath = currentFolder.value === '/' ? '' : currentFolder.value.replace(/^\//, '')
    if (currentFolder.value === '/') {
      formData.append('currentFolder', '/')
    } else if (sharedState.currentFolderUuid.value) {
      formData.append('currentFolder', sharedState.currentFolderUuid.value)
    } else if (folderPath) {
      formData.append('currentFolder', folderPath)
    }

    // Upload file using XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          localUploadProgress.value = Math.round((e.loaded / e.total) * 100)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText)
            resolve(result)
          } catch (e) {
            resolve(xhr.responseText)
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }

      xhr.onerror = () => reject(new Error('Upload failed'))

      const bridgeURL = localStorage.getItem('bridgeURL') || 'https://jetpackbridge.runonflux.io'
      xhr.open('POST', `${bridgeURL}/api/v1/ipfs/write`)
      xhr.send(formData)
    })
  } catch (error) {
    console.error('❌ Upload error:', error)
    throw error
  }
}

// Format file size to match Windows File Explorer (uses base 1024 with 2 decimal precision)
const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)

  // Use 2 decimal places for precision like Windows
  if (i === 0) return Math.round(value) + ' ' + sizes[i]
  
  return parseFloat(value.toFixed(2)) + ' ' + sizes[i]
}

// Local upload handlers with proper error handling
const handleLocalFileSelect = async e => {
  const files = Array.from(e.target.files)
  console.log(`📤 Selected ${files.length} file(s) for upload`)

  // Start batch upload - set uploading state for entire operation
  uploading.value = true
  totalFilesToUpload.value = files.length
  currentUploadIndex.value = 0
  const uploadResults = []

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      currentUploadIndex.value = i
      currentFileName.value = file.name
      currentFileSize.value = file.size
      localUploadProgress.value = 0

      // File size validation with toast message (appears above dialogs)
      const fileSize = formatFileSize(file.size)
      const fileSizeInMB = file.size / (1024 * 1024)

      if (fileSizeInMB > 100) {
        showToastMessage(
          `File "${file.name}" is too large! Upload limit is 100.00 MB (${fileSize} provided)`,
          'error',
          'mdi-file-alert',
        )
        continue
      }

      try {
        await uploadFileWithProgress(file)
        uploadResults.push({ file: file.name, success: true })
      } catch (error) {
        console.error('Upload error:', error)
        uploadResults.push({ file: file.name, success: false, error: error.message })
      }
    }
  } finally {
    // End batch upload - only set uploading to false after all files are done
    uploading.value = false
    currentFileName.value = ''
    currentFileSize.value = 0
    localUploadProgress.value = 0

    // Single refresh at the end of all uploads
    await loadFiles(false)

    // Show summary message after all uploads are complete
    const successCount = uploadResults.filter(r => r.success).length
    const failCount = uploadResults.filter(r => !r.success).length

    if (uploadResults.length === 1) {
      // Single file upload
      if (uploadResults[0].success) {
        showLocalMessage(
          `File "${uploadResults[0].file}" uploaded successfully`,
          'success',
          'mdi-upload',
        )
      } else {
        showLocalMessage(
          `Failed to upload "${uploadResults[0].file}": ${uploadResults[0].error}`,
          'error',
          'mdi-upload-off',
        )
      }
    } else if (uploadResults.length > 1) {
      // Multiple files upload
      if (failCount === 0) {
        // All succeeded
        showLocalMessage(
          `All ${successCount} files uploaded successfully`,
          'success',
          'mdi-upload-multiple',
        )
      } else if (successCount === 0) {
        // All failed
        showLocalMessage(
          `Failed to upload all ${failCount} files`,
          'error',
          'mdi-upload-off',
        )
      } else {
        // Mixed results
        showLocalMessage(
          `Uploaded ${successCount} of ${uploadResults.length} files (${failCount} failed)`,
          'warning',
          'mdi-upload-multiple',
        )
      }
    }

    console.log(`📤 Upload batch completed: ${successCount}/${uploadResults.length} successful`)
  }
}


const handleLocalDrop = async e => {
  const files = Array.from(e.dataTransfer.files)
  console.log(`📤 Dropped ${files.length} file(s) for upload`)

  // Start batch upload - set uploading state for entire operation
  uploading.value = true
  totalFilesToUpload.value = files.length
  currentUploadIndex.value = 0
  const uploadResults = []

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      currentUploadIndex.value = i
      currentFileName.value = file.name
      currentFileSize.value = file.size
      localUploadProgress.value = 0

      // File size validation with toast message (appears above dialogs)
      const fileSize = formatFileSize(file.size)
      const fileSizeInMB = file.size / (1024 * 1024)

      if (fileSizeInMB > 100) {
        showToastMessage(
          `File "${file.name}" is too large! Upload limit is 100.00 MB (${fileSize} provided)`,
          'error',
          'mdi-file-alert',
        )
        continue
      }

      try {
        await uploadFileWithProgress(file)
        uploadResults.push({ file: file.name, success: true })
      } catch (error) {
        console.error('Upload error:', error)
        uploadResults.push({ file: file.name, success: false, error: error.message })
      }
    }
  } finally {
    // End batch upload - only set uploading to false after all files are done
    uploading.value = false
    currentFileName.value = ''
    currentFileSize.value = 0
    localUploadProgress.value = 0

    // Single refresh at the end of all uploads
    await loadFiles(false)

    // Show summary message after all uploads are complete
    const successCount = uploadResults.filter(r => r.success).length
    const failCount = uploadResults.filter(r => !r.success).length

    if (uploadResults.length === 1) {
      // Single file upload
      if (uploadResults[0].success) {
        showLocalMessage(
          `File "${uploadResults[0].file}" uploaded successfully`,
          'success',
          'mdi-upload',
        )
      } else {
        showLocalMessage(
          `Failed to upload "${uploadResults[0].file}": ${uploadResults[0].error}`,
          'error',
          'mdi-upload-off',
        )
      }
    } else if (uploadResults.length > 1) {
      // Multiple files upload
      if (failCount === 0) {
        // All succeeded
        showLocalMessage(
          `All ${successCount} files uploaded successfully`,
          'success',
          'mdi-upload-multiple',
        )
      } else if (successCount === 0) {
        // All failed
        showLocalMessage(
          `Failed to upload all ${failCount} files`,
          'error',
          'mdi-upload-off',
        )
      } else {
        // Mixed results
        showLocalMessage(
          `Uploaded ${successCount} of ${uploadResults.length} files (${failCount} failed)`,
          'warning',
          'mdi-upload-multiple',
        )
      }
    }

    console.log(`📤 Drop upload completed: ${successCount}/${uploadResults.length} successful`)
  }
}

// Context menu functions
const hideContextMenu = () => {
  showGridContextMenu.value = false
  contextMenuItem.value = null
}

const handleContextMenuAction = action => {
  if (!contextMenuItem.value) {
    console.warn('No context menu item selected')
    
    return
  }

  const item = contextMenuItem.value
  console.log('Context menu action:', action, 'for item:', item.name)
  hideContextMenu()

  switch (action) {
  case 'preview':
    previewFile(item)
    break
  case 'download':
    downloadFile(item)
    break
  case 'addVersion':
    addVersion(item)
    break
  case 'versions':
    viewVersions(item)
    break
  case 'rename':
    console.log('Calling renameItem with:', item)
    renameItem(item)
    break
  case 'move':
    moveItem(item)
    break
  case 'copy':
    handleCopyLink(item)
    break
  case 'delete':
    deleteFile(item)
    break
  default:
    console.warn('Unknown context menu action:', action)
  }
}

// Context menu state
const showGridContextMenu = ref(false)
const contextMenuItem = ref(null)
const contextMenuX = ref(0)
const contextMenuY = ref(0)

const showContextMenu = (event, item) => {
  console.log('Right-click context menu for:', item.name)
  event.preventDefault()

  contextMenuItem.value = item
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  showGridContextMenu.value = true
}

// Touch event handling for mobile context menu
let touchTimer = null
let touchStartPos = { x: 0, y: 0 }
let hasMoved = false

const handleTouchStart = (event, item) => {
  if (!event.touches || event.touches.length !== 1) return

  const touch = event.touches[0]
  touchStartPos = { x: touch.clientX, y: touch.clientY }
  hasMoved = false

  // Start long press timer (500ms)
  touchTimer = setTimeout(() => {
    if (!hasMoved) {
      // Show context menu at touch position
      const contextEvent = {
        clientX: touchStartPos.x,
        clientY: touchStartPos.y,
        preventDefault: () => {},
      }
      showContextMenu(contextEvent, item)

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }
  }, 500)
}

const handleTouchMove = event => {
  if (!event.touches || event.touches.length !== 1) return

  const touch = event.touches[0]
  const deltaX = Math.abs(touch.clientX - touchStartPos.x)
  const deltaY = Math.abs(touch.clientY - touchStartPos.y)

  // If user moved more than 10px, cancel long press
  if (deltaX > 10 || deltaY > 10) {
    hasMoved = true
    if (touchTimer) {
      clearTimeout(touchTimer)
      touchTimer = null
    }
  }
}

const handleTouchEnd = (event, item) => {
  if (touchTimer) {
    clearTimeout(touchTimer)
    touchTimer = null
  }
}

// Use the composable
const {
  loading,
  searching,
  files: allFiles,
  searchQuery,
  currentPage,
  filesPerPage,
  totalFiles,
  currentFolder,
  breadcrumbs,
  hasActiveSubscription,
  subscriptionChecked,
  formattedSubscriptionEndDate,
  formattedSubscriptionEndDateTime,
  subscriptionPeriodEnd,
  isDragOver,
  uploading,
  uploadProgress,
  showFileModal,
  previewingFile,
  resultMessage,
  uploadMessage,
  ipfsHost,
  bridgeURL,
  getAlertType,
  loadFiles,
  isRecoveryMode,
  searchFile,
  getPlanStatus,
  handleDrop,
  handleFileSelect,
  handleFolderSelect,
  uploadData,
  uploadDataWithoutStateManagement,
  copyLink,
  previewFile: previewFileFromComposable,
  closeModal,
  openFolder,
  navigateToFolder,
  createFolder: createFolderFromComposable,
  deleteFile: deleteFileFromComposable,
  getFileIcon,
  isImageFile,
  isTextFile,
  convertSize,
  formatDate,
  bytesConversion,
  usedStorage,
  totalStorage,

  // Error management
  hasError,
  errorMessage,
  errorType,
  setError,
  clearError,
  uploadVersionToFluxCloud,
} = useFluxDrive()

// Calculate days left until subscription expires
const subscriptionDaysLeft = computed(() => {
  if (!subscriptionPeriodEnd.value) return 0

  const now = Date.now()
  const expiryTimestamp = subscriptionPeriodEnd.value * 1000

  // If expiration time has already passed (even if today), consider it expired
  if (now >= expiryTimestamp) {
    return -1 // Expired
  }

  const expiryDate = new Date(expiryTimestamp)

  // Set both dates to midnight to compare full days only
  const todayMidnight = new Date(now)
  todayMidnight.setHours(0, 0, 0, 0)

  const expiryMidnight = new Date(expiryDate)
  expiryMidnight.setHours(0, 0, 0, 0)

  const timeDiff = expiryMidnight - todayMidnight
  const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

  return daysLeft
})

// Helper to get human-readable expiry message
const subscriptionExpiryMessage = computed(() => {
  // If no period_end, show generic message for canceled subscriptions
  if (!subscriptionPeriodEnd.value) {
    return 'Subscription inactive'
  }

  const days = subscriptionDaysLeft.value

  if (days === 0) {
    // When expires today, show date with TIME
    return formattedSubscriptionEndDateTime.value
  } else if (days < 0) {
    // When expired, show date with TIME
    return formattedSubscriptionEndDateTime.value
  } else if (days === 1) {
    return `1 day remaining • Expires ${formattedSubscriptionEndDateTime.value}`
  } else {
    return `${days} days remaining • Expires ${formattedSubscriptionEndDateTime.value}`
  }
})

// Override fileHeaders with translated versions
const fileHeaders = computed(() => [
  { title: '', key: 'preview', sortable: false, width: 60 },
  { title: t('components.fluxDrive.fileManager.columnName'), key: 'name', sortable: true },
  { title: t('components.fluxDrive.fileManager.columnUpdated'), key: 'timestamp', sortable: true, width: 160 },
  { title: t('components.fluxDrive.fileManager.columnSize'), key: 'size', sortable: true, width: 90 },
  { title: '', key: 'actions', sortable: false, width: 40 },
])

// Override previewFile to automatically open editor for text files
const previewFile = file => {
  // Check if file is a text file
  if (isTextFile(file.mimetype, file.name)) {
    // Open in editor directly
    openEditor(file)
  } else {
    // Use original preview for non-text files
    previewFileFromComposable(file)
  }
}

// Note: Upload success messages are handled in local upload handlers

// Filter files based on search query
const files = computed(() => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    return allFiles.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  
  return allFiles.value.filter(file =>
    file.name.toLowerCase().includes(query) ||
    (file.type && file.type.toLowerCase().includes(query)),
  )
})

// Paginated files for display
const paginatedFiles = computed(() => {
  const start = (currentPage.value - 1) * filesPerPage.value
  const end = start + filesPerPage.value
  const result = stableFiles.value.slice(start, end)

  // Debug logging
  if (stableFiles.value.length > 0 && result.length === 0) {
    console.warn('🐛 Empty pagination result:', {
      currentPage: currentPage.value,
      filesPerPage: filesPerPage.value,
      totalFiles: stableFiles.value.length,
      start,
      end,
      stableFilesLength: stableFiles.value.length,
    })
  }

  return result
})

// Watch for files changes - no auto page reset, let user stay on same page

// Pagination range for modern pagination
const paginationRange = computed(() => {
  const totalPages = Math.ceil(stableFiles.value.length / filesPerPage.value)
  const current = currentPage.value
  const delta = 2 // Pages to show on each side of current page
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    }
  }

  range.forEach(i => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  })

  return rangeWithDots
})

// Use snackbar
// Removed showSnackbar - using unified local message system

// Store for generated video thumbnails
const videoThumbnails = ref({})

// Helper function to check if file is a video
const isVideoFile = file => {
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v', 'flv', 'wmv']
  const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/x-flv', 'video/x-ms-wmv']

  // Check by file extension
  if (file.name) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension && videoExtensions.includes(extension)) {
      return true
    }
  }

  // Check by mime type
  if (file.mimetype && videoMimeTypes.some(type => file.mimetype.startsWith(type))) {
    return true
  }

  // Check by type field
  if (file.type && file.type.toLowerCase().includes('video')) {
    return true
  }

  return false
}

// Generate thumbnail from video
const generateVideoThumbnail = async item => {
  if (!item.hash || videoThumbnails.value[item.hash]) {
    return videoThumbnails.value[item.hash]
  }

  return new Promise(resolve => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.src = `${ipfsHost}/ipfs/${item.hash}`
    video.currentTime = 1 // Capture frame at 1 second

    video.addEventListener('loadeddata', () => {
      const canvas = document.createElement('canvas')
      canvas.width = 48
      canvas.height = 48

      const ctx = canvas.getContext('2d')
      const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight)
      const x = (canvas.width / 2) - (video.videoWidth / 2) * scale
      const y = (canvas.height / 2) - (video.videoHeight / 2) * scale

      ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale)

      const thumbnail = canvas.toDataURL('image/jpeg', 0.7)
      videoThumbnails.value[item.hash] = thumbnail
      resolve(thumbnail)

      video.remove()
    })

    video.addEventListener('error', () => {
      resolve(null)
      video.remove()
    })
  })
}

// Helper function to check if file is a PDF
const isPdfFile = file => {
  const pdfExtensions = ['pdf']
  const pdfMimeTypes = ['application/pdf']

  // Check by file extension
  if (file.name) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension && pdfExtensions.includes(extension)) {
      return true
    }
  }

  // Check by mime type
  if (file.mimetype && pdfMimeTypes.includes(file.mimetype)) {
    return true
  }

  // Check by type field
  if (file.type && file.type.toLowerCase() === 'pdf') {
    return true
  }

  return false
}

// Helper function to check if file is audio
const isAudioFile = file => {
  const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma']
  const audioMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac', 'audio/aac', 'audio/x-ms-wma']

  // Check by file extension
  if (file.name) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension && audioExtensions.includes(extension)) {
      return true
    }
  }

  // Check by mime type
  if (file.mimetype && audioMimeTypes.some(type => file.mimetype.startsWith(type))) {
    return true
  }

  // Check by type field
  if (file.type && file.type.toLowerCase().includes('audio')) {
    return true
  }

  return false
}

// Debug: Watch files array changes
watch(files, newFiles => {
  console.log('🔍 FileManager: Files changed:', {
    length: newFiles?.length || 0,
    files: newFiles?.slice(0, 5), // Show more files
    isArray: Array.isArray(newFiles),
    allFiles: newFiles, // Show complete array
  })
  console.log('🔍 FileManager: View type:', viewType.value)
  console.log('🔍 FileManager: Has active subscription:', hasActiveSubscription.value)

  // Generate video thumbnails automatically for grid view
  if (viewType.value === 'grid' && Array.isArray(newFiles)) {
    newFiles.forEach(file => {
      if (isVideoFile(file) && file.hash && !videoThumbnails.value[file.hash]) {
        // Generate thumbnail in background
        generateVideoThumbnail(file)
      }
    })
  }
}, { immediate: true, deep: true })

// Navigate to root helper
const navigateToRoot = () => {
  currentPage.value = 1 // Reset to first page when navigating
  navigateToFolder({ path: '/' })
}

// Wrapper functions to reset page before navigation
const handleOpenFolder = item => {
  currentPage.value = 1 // Reset to first page when navigating
  openFolder(item)
}

const handleNavigateToFolder = item => {
  currentPage.value = 1 // Reset to first page when navigating
  navigateToFolder(item)
}

// Item actions
const openFile = item => {
  // Open file in new tab
  window.open(`${ipfsHost}/ipfs/${item.hash}`, '_blank')
}

const downloadFile = async item => {
  console.log('📥 Starting download:', item.name, 'from hash:', item.hash)

  try {
    // Show download progress dialog
    const originalName = item.name || item.name_abbr || `file_${item.hash}`
    downloading.value = true
    downloadProgress.value = 0
    downloadingFile.value = originalName

    // Fetch the file with progress tracking
    const response = await fetch(`${ipfsHost}/ipfs/${item.hash}`, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Get content length for progress calculation
    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    // Read the response as stream for progress tracking
    const reader = response.body?.getReader()
    let receivedLength = 0
    const chunks = []

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        chunks.push(value)
        receivedLength += value.length

        // Update progress
        if (total > 0) {
          downloadProgress.value = Math.round((receivedLength / total) * 100)
        }
      }
    }

    // Combine chunks into blob
    const blob = new Blob(chunks)

    // Create download link with proper filename
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = originalName

    // Trigger download
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Hide progress dialog
    downloading.value = false
    showLocalMessage(`${originalName} downloaded successfully`, 'success', 'mdi-download')

  } catch (error) {
    console.error('📥 Download error:', error)
    downloading.value = false
    showLocalMessage(`Failed to download ${item.name}: ${error.message}`, 'error', 'mdi-download-off')
  }
}

// Open file in editor
const openEditor = async file => {
  console.log('📝 Opening editor for:', file.name)
  editingFile.value = file
  loadingContent.value = true
  editorMounted.value = false
  showEditorDialog.value = true

  try {
    // Fetch file content from IPFS
    const response = await fetch(`${ipfsHost}/ipfs/${file.hash}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`)
    }

    // Handle plain text files
    const text = await response.text()
    fileContent.value = text
    originalFileContent.value = text
    console.log('✅ File content loaded, length:', text.length)
  } catch (error) {
    console.error('❌ Error loading file content:', error)
    showToastMessage(`Failed to load file: ${error.message}`, 'error', 'mdi-file-alert')
    showEditorDialog.value = false
  } finally {
    loadingContent.value = false
  }
}

// Get file language for Monaco editor syntax highlighting
const getFileLanguage = filename => {
  if (!filename) return 'plaintext'

  const ext = filename.split('.').pop()?.toLowerCase()
  const languageMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    md: 'markdown',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    sql: 'sql',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    sh: 'shell',
    bash: 'shell',
    vue: 'html',
    txt: 'plaintext',
  }

  return languageMap[ext] || 'plaintext'
}

// Save edited file
const saveEditedFile = async () => {
  if (!editingFile.value || !fileContent.value) return

  console.log('💾 Saving edited file as new version:', editingFile.value.name)
  savingFile.value = true

  try {
    // Plain text file
    const blob = new Blob([fileContent.value], { type: editingFile.value.mimetype || 'text/plain' })
    const file = new File([blob], editingFile.value.name, { type: editingFile.value.mimetype || 'text/plain' })

    // Upload as new version using the file's hash
    const existingFileHash = editingFile.value.hash
    const comment = `Edited via FluxDrive editor on ${new Date().toLocaleString()}`

    await uploadVersionToFluxCloud(existingFileHash, editingFile.value.name, file, comment)

    showToastMessage(`${editingFile.value.name} saved as new version`, 'success', 'mdi-content-save')
    showEditorDialog.value = false
    editingFile.value = null
    fileContent.value = ''
    originalFileContent.value = ''

    // Refresh file list to show updated file
    await loadFiles(false)
  } catch (error) {
    console.error('❌ Error saving file:', error)
    showToastMessage(`Failed to save file: ${error.message}`, 'error', 'mdi-content-save-alert')
  } finally {
    savingFile.value = false
  }
}

const renameItem = item => {
  console.log('🏷️ renameItem called with:', item)
  console.log('🏷️ Setting up rename dialog...')

  itemToRename.value = item
  renameText.value = item.name
  showRenameDialog.value = true

  console.log('🏷️ Rename dialog should be visible now:', {
    showRenameDialog: showRenameDialog.value,
    itemToRename: itemToRename.value?.name,
    renameText: renameText.value,
  })
}

const confirmRename = async () => {
  if (!renameValidation.value.isValid) {
    return
  }

  const oldName = itemToRename.value.name
  const newName = renameText.value.trim()
  const isFolder = itemToRename.value.isFolder

  // Close dialog immediately
  showRenameDialog.value = false
  const itemToProcess = itemToRename.value
  itemToRename.value = null
  renameText.value = ''

  try {
    const zelidauth = localStorage.getItem('zelidauth')
    if (!zelidauth) {
      showLocalMessage('Authentication required. Please log in.', 'error', 'mdi-account-alert')
      
      return
    }

    const authData = zelidauth.includes('zelid=') ?
      Object.fromEntries(new URLSearchParams(zelidauth)) :
      JSON.parse(zelidauth)

    console.log('🔐 Auth data check:', {
      hasZelid: !!authData.zelid,
      hasSignature: !!authData.signature,
      hasLoginPhrase: !!authData.loginPhrase,
    })

    if (!authData.zelid || !authData.signature || !authData.loginPhrase) {
      showLocalMessage('Authentication incomplete. Please log in again.', 'error', 'mdi-account-alert')
      
      return
    }

    const apiEndpoint = isFolder ?
      `${bridgeURL}/api/v1/ipfs/renamefolder` :
      `${bridgeURL}/api/v1/ipfs/rename`

    const requestBody = {
      zelid: authData.zelid,
      signature: authData.signature,
      loginPhrase: authData.loginPhrase,
    }

    if (isFolder) {
      // For folders, use FluxCloud's exact parameters
      requestBody.uuid = itemToProcess.uuid
      requestBody.filename = newName
    } else {
      // For files, use FluxCloud's exact parameters
      requestBody.hash = itemToProcess.hash
      requestBody.filename = newName
    }

    console.log(`🔄 Renaming ${isFolder ? 'folder' : 'file'}:`, oldName, '→', newName)

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(requestBody),
    })

    console.log('📡 Rename API response status:', response.status)
    const responseText = await response.text()
    console.log('📡 Rename API response text:', responseText)

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error('❌ Failed to parse rename response JSON:', e)
      throw new Error('Invalid response from server')
    }
    console.log('📡 Rename API parsed result:', result)

    if (response.ok && (result.status === 'success' || result.name)) {
      console.log(`✅ ${isFolder ? 'Folder' : 'File'} renamed successfully`)

      // Update the item in the files array immediately for instant UI update
      if (allFiles?.value) {
        allFiles.value.forEach(file => {
          if (file.hash === itemToProcess.hash || file.uuid === itemToProcess.uuid) {
            file.name = newName
            file.name_abbr = newName
          }
        })
      }

      // Refresh the file list
      await loadFiles(false)

      // Show rename success message after refresh
      showLocalMessage(
        `${isFolder ? 'Folder' : 'File'} "${newName}" renamed successfully`,
        'success',
        'mdi-rename-box',
      )
    } else {
      const errorMessage = result.error || result.message || 'Failed to rename item'
      console.error('❌ Rename failed:', errorMessage)
      showLocalMessage(`Failed to rename: ${errorMessage}`, 'error', 'mdi-rename-box-off')
    }
  } catch (error) {
    console.error('❌ Rename error:', error)
    showLocalMessage(`Failed to rename: ${error.message}`, 'error', 'mdi-rename-box-off')
  }
}

const moveItem = item => {
  itemToMove.value = item
  moveDestination.value = ''
  showMoveDialog.value = true
}

const confirmMove = async () => {
  if (moveDestination.value !== null) {
    // Normalize destination format
    let destination
    let destinationUuid = null
    const rawDestination = moveDestination.value

    if (!rawDestination || rawDestination.trim() === '') {
      destination = '/'
      destinationUuid = '' // Root has no UUID
    } else {
      // Ensure destination starts with / if it's not root
      destination = rawDestination.trim().startsWith('/') ? rawDestination.trim() : `/${rawDestination.trim()}`

      // Try to find the destination folder's UUID if it's a known folder
      // Look for the folder in the current files list
      const trimmedDestination = rawDestination.trim().replace(/^\/+/, '') // Remove leading slashes
      const destinationFolder = files.value.find(f =>
        f.isFolder && f.name === trimmedDestination,
      )
      if (destinationFolder) {
        destinationUuid = destinationFolder.uuid || destinationFolder.id
        console.log('📁 Found destination folder UUID:', destinationUuid, 'for', destination)
      } else {
        // If we can't find the folder UUID, we should warn the user
        console.warn('⚠️ Could not find UUID for destination folder:', trimmedDestination)
        console.log('Available folders:', files.value.filter(f => f.isFolder).map(f => ({ name: f.name, uuid: f.uuid })))
      }
    }

    try {
      // Get authentication details
      const zelidauth = localStorage.getItem('zelidauth')
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      console.log('🔍 Move item debug:', {
        item: itemToMove.value,
        rawDestination: rawDestination,
        normalizedDestination: destination,
        currentFolder: currentFolder.value,
        authData: { ...authData, signature: '[HIDDEN]', loginPhrase: '[HIDDEN]' },
      })

      if (!authData.zelid || !authData.loginPhrase || !authData.signature) {
        showLocalMessage('Authentication required. Please log in again.', 'error', 'mdi-account-alert')
        
        return
      }

      // Use FluxCloud's approach - different endpoints for files vs folders
      console.log('🚀 Attempting move API call (FluxCloud format)...')

      let apiEndpoint, apiParams

      if (itemToMove.value.isFolder) {
        // Move folder using FluxCloud approach
        apiEndpoint = `${bridgeURL}/api/v1/ipfs/movefolder`
        apiParams = {
          zelid: authData.zelid,
          signature: authData.signature,
          loginPhrase: authData.loginPhrase,
          uuid: itemToMove.value.uuid,

          // Use UUID if available, otherwise use path
          destination: destinationUuid || destination,
        }
      } else {
        // Move file using FluxCloud approach
        apiEndpoint = `${bridgeURL}/api/v1/ipfs/move`
        apiParams = {
          zelid: authData.zelid,
          signature: authData.signature,
          loginPhrase: authData.loginPhrase,
          hash: itemToMove.value.hash,

          // Use UUID if available, otherwise use path
          destination: destinationUuid || destination,
        }
      }

      console.log('📡 Move API details:', {
        endpoint: apiEndpoint,
        itemType: itemToMove.value.isFolder ? 'folder' : 'file',
        identifier: itemToMove.value.isFolder ? itemToMove.value.uuid : itemToMove.value.hash,
        destination: destination,
        destinationUuid: destinationUuid,
        actualDestinationSent: destinationUuid || destination,
      })

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(apiParams),
      })

      console.log('📡 Move API response status:', response.status)
      const responseText = await response.text()
      console.log('📡 Move API response text:', responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        console.error('❌ Failed to parse JSON response:', e)
        showLocalMessage('Invalid response from server', 'error', 'mdi-server-network-off')
        
        return
      }

      console.log('📡 Move API result:', result)

      if (response.status === 404) {
        showLocalMessage('Move functionality is not available on this server', 'warning', 'mdi-folder-move-outline')
        
        return
      }

      if (!result.error && !result.warning && response.ok) {
        const destinationText = destination === '/' ? 'root folder' : `${destination} folder`

        // Store the item name before resetting
        const movedItemName = itemToMove.value.name

        // Refresh the current folder to remove the moved item first
        await loadFiles(false)

        // Then show move success message
        showLocalMessage(
          `"${movedItemName}" moved successfully to ${destinationText}`,
          'success',
          'mdi-folder-move',
        )

        console.log(`✅ Move successful: ${movedItemName} → ${destination}`)
        console.log('📂 User should navigate to', destination, 'to see the moved file')

        // Guide user to find their moved file
        if (destination === '/') {
          setTimeout(() => {
            showLocalMessage(`${movedItemName} is now in the root folder. Click "Home" to view it.`, 'info', 'mdi-information')
          }, 2000)
        } else {
          setTimeout(() => {
            showLocalMessage(`${movedItemName} is now in "${destination}". Navigate to that folder to view it.`, 'info', 'mdi-information')
          }, 2000)
        }

        // Close dialog and reset
        showMoveDialog.value = false
        itemToMove.value = null
        moveDestination.value = ''
      } else if (result.warning && result.warning.includes('login')) {
        // API suggests authentication issue, but we are logged in
        console.error('❌ Move API authentication error despite valid login')
        showLocalMessage('Move functionality may not be available in your current plan or the API endpoint may not exist', 'warning', 'mdi-folder-move-outline')
      } else {
        const errorMessage = result.error || result.warning || result.message || 'Failed to move item'
        console.error('❌ Move failed:', errorMessage)

        // Clean up HTML from error message
        const cleanError = errorMessage.replace(/<[^>]*>/g, '')
        showLocalMessage(cleanError, 'error', 'mdi-folder-move-outline')
      }
    } catch (error) {
      console.error('❌ Move error:', error)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showLocalMessage('Network error - could not connect to server', 'error', 'mdi-server-network-off')
      } else {
        showLocalMessage('Failed to move item: ' + error.message, 'error', 'mdi-folder-move-outline')
      }
    }

    // Always close dialog and reset
    showMoveDialog.value = false
    itemToMove.value = null
    moveDestination.value = ''
  }
}


// Handle preview menu actions - closes modal first, then performs action
const handlePreviewMenuAction = (action, item) => {
  console.log('📋 Preview menu action:', action, 'for item:', item.name)

  // Close the preview modal first
  showFileModal.value = false

  // Small delay to ensure modal closes before opening new dialogs
  setTimeout(() => {
    switch (action) {
    case 'rename':
      renameItem(item)
      break
    case 'move':
      moveItem(item)
      break
    case 'copy':
      handleCopyLink(item)
      break
    case 'delete':
      deleteFile(item)
      break
    default:
      console.warn('Unknown preview menu action:', action)
    }
  }, 100)
}


const downloadFileVersion = async version => {
  const hash = version.hash || version.id
  const name = version.name || fileForVersions.value?.name || 'file'

  if (!hash) {
    showLocalMessage('Cannot download: No hash available for this version', 'error', 'mdi-download-off')
    
    return
  }

  console.log('📥 Downloading version:', name, 'from hash:', hash)

  try {
    const response = await fetch(`${ipfsHost}/ipfs/${hash}`)
    if (!response.ok) throw new Error('Failed to fetch file')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    showLocalMessage(`${name} downloaded successfully`, 'success', 'mdi-download')
  } catch (error) {
    console.error('Download error:', error)
    showLocalMessage(`Failed to download ${name}: ${error.message}`, 'error', 'mdi-download-off')
  }
}

const openFileVersion = version => {
  const hash = version.hash || version.id
  if (!hash) {
    showLocalMessage('Cannot open: No hash available for this version', 'error', 'mdi-open-in-new')
    
    return
  }

  window.open(`${ipfsHost}/ipfs/${hash}`, '_blank')
}


// Local dialog handlers
const createFolder = () => {
  newFolderName.value = ''
  showCreateFolderDialog.value = true
}

const confirmCreateFolder = async () => {
  if (newFolderName.value?.trim()) {
    const folderName = newFolderName.value.trim()

    // Check if folder with same name already exists at the same level
    const existingFolder = allFiles.value.find(file =>
      file.isFolder && file.name.toLowerCase() === folderName.toLowerCase(),
    )

    if (existingFolder) {
      showCreateFolderDialog.value = false // Close dialog so user can see error
      showLocalMessage(
        `Folder "${folderName}" already exists`,
        'error',
        'mdi-folder-alert',
        5000, // Show error for 5 seconds
      )
      newFolderName.value = '' // Clear input after error
      
      return
    }

    showCreateFolderDialog.value = false

    try {
      // Step 1: Create the folder
      await createFolderFromComposable(folderName)

      // Step 2: Refresh to show new folder
      await loadFiles(false)

      // Step 3: Show success message after refresh
      showLocalMessage(
        `Folder "${folderName}" created successfully`,
        'success',
        'mdi-folder-plus',
      )

    } catch (error) {
      console.error('Create folder error:', error)
      showLocalMessage(
        `Failed to create folder "${folderName}": ${error.message}`,
        'error',
        'mdi-folder-alert',
      )
    }

    newFolderName.value = ''
  }
}

// Delete file with dialog confirmation
const deleteFile = item => {
  itemToDelete.value = item
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (itemToDelete.value) {
    const itemName = itemToDelete.value.name
    const isFolder = itemToDelete.value.isFolder
    showDeleteDialog.value = false

    try {
      await deleteFileFromComposable(itemToDelete.value, true) // Skip confirm dialog

      // Refresh file list to update UI and storage stats
      await loadFiles(false)

      // Check if current page is now empty and move to previous page if needed
      const totalPages = Math.ceil(allFiles.value.length / filesPerPage.value)
      if (currentPage.value > totalPages && totalPages > 0) {
        currentPage.value = totalPages
      }

      // Show delete success message
      showLocalMessage(
        `${isFolder ? 'Folder' : 'File'} "${itemName}" deleted successfully`,
        'success',
        'mdi-delete',
      )

    } catch (error) {
      console.error('Delete error:', error)
      showLocalMessage(
        `Failed to delete "${itemName}": ${error.message}`,
        'error',
        'mdi-delete-alert',
      )
    }

    itemToDelete.value = null
  }
}

const cancelDelete = () => {
  showDeleteDialog.value = false
  itemToDelete.value = null
}

// Load files on mount if we have an active subscription
onMounted(() => {
  console.log('📂 FileManager mounted')
  console.log('📂 hasActiveSubscription:', hasActiveSubscription.value)
  console.log('📂 Initial files:', files.value)
  console.log('📂 loading:', loading.value)

  // Try loading files if subscription is active, files haven't been loaded yet, and not already loading
  if (hasActiveSubscription.value && files.value.length === 0 && !loading.value) {
    console.log('📂 Calling loadFiles from FileManager...')
    loadFiles()
  } else if (loading.value) {
    console.log('📂 Files are already being loaded, skipping loadFiles call')
  } else if (hasActiveSubscription.value && files.value.length > 0) {
    console.log('📂 Files already loaded, skipping loadFiles call')
  }
})

// Renewal state
const isRenewing = ref(false)
const renewalMessage = ref('')

// Clear renewal state
const clearRenewalState = () => {
  isRenewing.value = false
  renewalMessage.value = ''
}

// Handle subscription cancellation
const handleCancelSubscription = async () => {
  cancelingSubscription.value = true
  try {
    console.log('🚫 Canceling subscription...')
    const result = await cancelSubscription()
    console.log('✅ Subscription canceled:', result)

    // Close dialog
    showCancelDialog.value = false

    // Refresh subscription status
    await checkSubscriptionStatus()

    // Show success message
    alert(t('components.fluxDrive.fileManager.cancelSubscriptionSuccess'))
  } catch (error) {
    console.error('❌ Failed to cancel subscription:', error)
    alert(t('components.fluxDrive.fileManager.cancelSubscriptionError') + ': ' + error.message)
  } finally {
    cancelingSubscription.value = false
  }
}

// Expose methods to parent
defineExpose({
  clearRenewalState,
})

// Handle upgrade plan selection
const handleUpgradePlan = planId => {
  console.log('🔄 FileManager plan selection:', planId)
  showUpgradeDialog.value = false

  // Get the proper action type based on plan status
  const planStatus = getPlanStatus(planId)
  let actionType = 'upgrade' // default

  if (planStatus === 'current') {
    actionType = 'renew'
    isRenewing.value = true
    renewalMessage.value = 'Renewing your current plan'
  } else if (planStatus === 'renew') {
    actionType = 'renew'
    isRenewing.value = true
    renewalMessage.value = 'Renewing your expired subscription'
  } else if (planStatus === 'upgrade') {
    actionType = 'upgrade'
    isRenewing.value = true
    renewalMessage.value = 'Upgrading your plan'
  } else if (planStatus === 'downgrade') {
    actionType = 'downgrade'
    isRenewing.value = true
    renewalMessage.value = 'Downgrading your plan'
  } else {
    actionType = 'signup'
  }

  console.log('🔍 Plan status:', planStatus, '→ Action type:', actionType)

  // Emit to parent component with correct action
  emit('selectPlan', planId, actionType)
}
</script>

<style scoped>
.file-upload-area {
  border: 2px dashed rgb(var(--v-border-color));
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-upload-area:hover,
.file-upload-area.drag-over {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.file-grid-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-grid-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.grid-item-actions {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.file-grid-item:hover .grid-item-actions {
  opacity: 1;
}

.version-badge {
  transition: opacity 0.3s ease;
}

.file-grid-item:hover .version-badge {
  opacity: 0;
}

.file-list-table {
  border-radius: 8px;
}

/* Modern View Toggle - Theme Aware */
.view-toggle-modern {
  display: flex;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
  backdrop-filter: blur(10px);
}

.view-toggle-btn {
  border-radius: 6px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: unset !important;
  position: relative;
}

.view-toggle-btn:not(.v-btn--variant-flat) {
  background: transparent !important;
  color: rgb(var(--v-theme-on-surface-variant)) !important;
}

.view-toggle-btn:not(.v-btn--variant-flat):hover {
  background: rgba(var(--v-theme-on-surface), 0.08) !important;
}

.view-toggle-btn.v-btn--variant-flat {
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  box-shadow:
    0 2px 4px rgba(var(--v-theme-primary), 0.3),
    0 1px 2px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

/* Dark theme adjustments */
.v-theme--dark .view-toggle-modern {
  background: rgba(var(--v-theme-surface-bright), 0.1);
  border-color: rgba(var(--v-theme-outline), 0.3);
}

.v-theme--dark .view-toggle-btn.v-btn--variant-flat {
  box-shadow:
    0 2px 8px rgba(var(--v-theme-primary), 0.4),
    0 1px 3px rgba(0,0,0,0.3);
}

/* Light theme adjustments */
.v-theme--light .view-toggle-modern {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-color: rgba(var(--v-theme-outline), 0.15);
}

.v-theme--light .view-toggle-btn.v-btn--variant-flat {
  box-shadow:
    0 2px 4px rgba(var(--v-theme-primary), 0.25),
    0 1px 2px rgba(0,0,0,0.1);
}

/* Modern Breadcrumb Styles */
.modern-breadcrumb {
  background: rgba(var(--v-theme-surface), 0.5);
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  border-radius: 12px;
  padding: 8px 12px;
  backdrop-filter: blur(10px);
}

.breadcrumb-container {
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
}

.breadcrumb-container::-webkit-scrollbar {
  display: none;
}

.breadcrumb-home {
  flex-shrink: 0;
  margin-right: 8px !important;
  height: 28px !important;
  width: 28px !important;
}

.breadcrumb-item {
  flex-shrink: 0;
  font-size: 0.875rem !important;
  height: 28px !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  font-weight: 500;
}

.breadcrumb-item.breadcrumb-current {
  font-weight: 600;
  pointer-events: none;
}

.breadcrumb-item {
  color: rgb(var(--v-theme-on-surface-variant)) !important;
}

.breadcrumb-home {
  color: rgb(var(--v-theme-on-surface-variant)) !important;
}

/* Theme-specific breadcrumb styling */
.v-theme--dark .modern-breadcrumb {
  background: rgba(var(--v-theme-surface-bright), 0.08);
  border-color: rgba(var(--v-theme-outline), 0.2);
}

.v-theme--light .modern-breadcrumb {
  background: rgba(var(--v-theme-surface), 0.95);
  border-color: rgba(var(--v-theme-outline), 0.1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.v-theme--dark .breadcrumb-item:not(.breadcrumb-current):hover {
  background: rgba(var(--v-theme-on-surface), 0.08) !important;
}

.v-theme--light .breadcrumb-item:not(.breadcrumb-current):hover {
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
}

/* Prevent text wrapping in table */
.file-list-table :deep(.v-data-table__td) {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  vertical-align: middle !important;
}

.file-list-table :deep(.v-data-table__th) {
  white-space: nowrap !important;
}

/* FluxDrive Editor Loader Styles */
.fluxdrive-editor-loader {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(10px);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fluxdrive-editor-loader :deep(.loading-container) {
  min-height: auto !important;
  margin-top: 0 !important;
  padding: 24px !important;
}

.fluxdrive-editor-loader :deep(.modern-loader) {
  width: 100px !important;
  height: 100px !important;
  margin-bottom: 16px !important;
}

.fluxdrive-editor-loader :deep(.loader-ring) {
  width: 80px !important;
  height: 80px !important;
}

.fluxdrive-editor-loader :deep(.icon-avatar) {
  width: 50px !important;
  height: 50px !important;
}

.fluxdrive-editor-loader :deep(h2) {
  font-size: 1rem !important;
  margin-bottom: 0 !important;
}

.file-list-table :deep(.v-data-table-rows-no-data) {
  white-space: nowrap !important;
}

/* Renewal chip styles */
.renewal-chip {
  font-weight: 500;
  letter-spacing: 0.5px;
  padding: 12px 16px !important;
  height: auto !important;
  min-height: 40px;
}

.renewal-chip .v-icon {
  vertical-align: middle;
  margin-top: -2px; /* Fine-tune icon alignment */
}

.rotating-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Video thumbnail styles */
.video-thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: inherit;
}

.video-thumbnail-placeholder {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Preview dialog styles */
.preview-card {
  overflow: hidden;
}

.preview-header {
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.preview-container {
  background: rgba(var(--v-theme-background), 0.5);
  min-height: 200px;
}

.preview-content {
  overflow: hidden;
}

/* Custom dialog animations - slide up from bottom like FluxCloud */
.dialog-bottom-transition-enter-active {
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.dialog-bottom-transition-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.6, 1);
}

.dialog-bottom-transition-enter-from {
  transform: translateY(100vh);
  opacity: 0;
}

.dialog-bottom-transition-leave-to {
  transform: translateY(100vh);
  opacity: 0;
}

.dialog-bottom-transition-enter-to,
.dialog-bottom-transition-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.success-message-no-justify {
  text-align: left !important;
  text-justify: none !important;
}

.success-message-no-justify .v-alert__content {
  text-align: left !important;
  text-justify: none !important;
  justify-content: flex-start !important;
}

.local-message-alert {
  background-color: var(--v-theme-surface-variant) !important;
  color: var(--v-theme-on-surface-variant) !important;
  border: 1px solid var(--v-theme-outline) !important;
}

.local-message-alert.v-alert--type-success {
  background-color: var(--v-theme-success-container) !important;
  color: var(--v-theme-on-success-container) !important;
  border-color: var(--v-theme-success) !important;
}

.local-message-alert.v-alert--type-error {
  background-color: var(--v-theme-error-container) !important;
  color: var(--v-theme-on-error-container) !important;
  border-color: var(--v-theme-error) !important;
}

.local-message-alert.v-alert--type-warning {
  background-color: var(--v-theme-warning-container) !important;
  color: var(--v-theme-on-warning-container) !important;
  border-color: var(--v-theme-warning) !important;
}

.local-message-alert.v-alert--type-info {
  background-color: var(--v-theme-info-container) !important;
  color: var(--v-theme-on-info-container) !important;
  border-color: var(--v-theme-info) !important;
}

.local-message-alert .v-alert__prepend {
  opacity: 1 !important;
}

.local-message-alert .v-icon {
  opacity: 1 !important;
}

/* Modern Refresh Animation */
.modern-refresh-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 2rem;
}

.refresh-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-outline), 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.spinner-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modern-spinner {
  z-index: 2;
  animation: smoothSpin 1.8s linear infinite;
}

.refresh-pulse {
  position: absolute;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.1);
  animation: modernPulse 2s ease-in-out infinite;
  z-index: 1;
}

.refresh-content {
  text-align: center;
  animation: fadeInUp 0.5s ease-out;
}

.refresh-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.01em;
}

.refresh-subtitle {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0;
  font-weight: 400;
}

/* Smooth transitions */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

/* Keyframes */
@keyframes smoothSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes modernPulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark theme */
.v-theme--dark .refresh-card {
  background: rgba(var(--v-theme-surface), 0.9);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Refresh Overlay - positioned over table area */
.refresh-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  z-index: 100;
  min-height: 400px;
}

/* Loading overlay for navigation */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 8px;
}

/* Disabled row animations to prevent bottom-to-top effect during refresh */

/* Modern Upload Dialog */
.modern-upload-card {
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-outline), 0.1);
  border-radius: 24px !important;
}

.upload-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
}

.upload-icon {
  position: absolute;
  z-index: 2;
  animation: uploadPulse 2s ease-in-out infinite;
}

.upload-spinner {
  position: absolute;
  z-index: 1;
}

.upload-progress-container {
  width: 100%;
  max-width: 280px;
}

@keyframes uploadPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Dark theme adjustments for upload dialog */
.v-theme--dark .modern-upload-card {
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
}

/* Modern Circle Pagination Styles */
.modern-pagination {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modern-pagination-container {
  background: rgba(var(--v-theme-surface), 0.8);
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  border-radius: 12px;
  padding: 8px 16px;
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.modern-pagination-container:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.pagination-circle {
  min-width: 28px !important;
  width: 28px !important;
  height: 28px !important;
  border-radius: 50% !important;
  padding: 0 !important;
  font-weight: 500;
  font-size: 12px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}

/* Flat variant (left arrow) */
.pagination-circle.v-btn--variant-flat {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
}

.pagination-circle .v-icon {
  font-size: 14px !important;
}

.pagination-circle.active {
  background-color: rgba(var(--v-theme-primary), 0.12) !important;
  color: rgb(var(--v-theme-primary)) !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.2);
  transform: translateY(-1px);
}

.pagination-circle:not(.active):not(:disabled):hover {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.pagination-circle:disabled {
  opacity: 0.4;
  transform: none !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12) !important;
}

.pagination-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 40px;
}

/* Enhanced pagination chip styling */
.pagination-info-chip {
  font-weight: 500 !important;
  letter-spacing: 0.5px !important;
  border: 1px solid rgba(var(--v-theme-outline), 0.12) !important;
}

/* Modern pagination selector styling */
.pagination-selector-container {
  background: rgba(var(--v-theme-surface), 0.5);
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  border-radius: 8px;
  padding: 4px 8px;
  height: 32px;
  transition: all 0.2s ease;
  align-items: center;
  backdrop-filter: blur(10px);
}

.pagination-selector-container:hover {
  background: rgba(var(--v-theme-surface), 0.7);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.pagination-selector {
  max-width: 50px !important;
  min-width: 50px !important;
}

.pagination-selector :deep(.v-field) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.pagination-selector :deep(.v-field__input) {
  padding: 0 !important;
  min-height: 20px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

.pagination-selector :deep(.v-field__append-inner) {
  padding-left: 4px !important;
}

.pagination-selector :deep(.v-icon) {
  font-size: 14px !important;
  opacity: 0.7;
}

/* Dark theme adjustments for pagination */
.v-theme--dark .modern-pagination-container {
  background: rgba(var(--v-theme-surface-bright), 0.1);
  border-color: rgba(var(--v-theme-outline), 0.2);
}

.v-theme--dark .modern-pagination-container:hover {
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.v-theme--dark .pagination-circle.active {
  box-shadow: 0 2px 12px rgba(var(--v-theme-primary), 0.4);
}

.v-theme--dark .pagination-circle:not(.active):not(:disabled):hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}

/* Light theme adjustments for pagination */
.v-theme--light .modern-pagination-container {
  background: rgba(var(--v-theme-surface), 0.95);
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}

.v-theme--light .modern-pagination-container:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

/* Theme-specific pagination selector styling to match breadcrumb */
.v-theme--dark .pagination-selector-container {
  background: rgba(var(--v-theme-surface-bright), 0.08);
  border-color: rgba(var(--v-theme-outline), 0.2);
}

.v-theme--light .pagination-selector-container {
  background: rgba(var(--v-theme-surface), 0.95);
  border-color: rgba(var(--v-theme-outline), 0.1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

/* Grid items staggered animation */
.grid-item {
  animation: gridItemFadeIn 0.4s ease-out;
  animation-fill-mode: backwards;
}

.grid-item:nth-child(1) { animation-delay: 0.05s; }
.grid-item:nth-child(2) { animation-delay: 0.1s; }
.grid-item:nth-child(3) { animation-delay: 0.15s; }
.grid-item:nth-child(4) { animation-delay: 0.2s; }
.grid-item:nth-child(5) { animation-delay: 0.25s; }
.grid-item:nth-child(6) { animation-delay: 0.3s; }

@keyframes gridItemFadeIn {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Prevent filename wrapping in file input */
.no-wrap-filename :deep(.v-field__input) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-wrap-filename :deep(.v-file-input__text) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Three-dot context menu button styling */
.context-menu-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
  background: rgba(var(--v-theme-surface), 0.8) !important;
  backdrop-filter: blur(4px);
  border-radius: 50%;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

.context-menu-btn .v-icon {
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

/* Show button on hover for desktop */
.file-grid-item:hover .context-menu-btn {
  opacity: 1;
}

/* Always show button on mobile/touch devices */
@media (hover: none) and (pointer: coarse) {
  .context-menu-btn {
    opacity: 0.8 !important;
  }
}

/* On devices that support both touch and hover */
@media (hover: hover) and (pointer: coarse) {
  .context-menu-btn {
    opacity: 0.6;
  }

  .file-grid-item:hover .context-menu-btn {
    opacity: 1;
  }
}

/* Focus and active states */
.context-menu-btn:focus,
.context-menu-btn:active {
  opacity: 1 !important;
}
</style>