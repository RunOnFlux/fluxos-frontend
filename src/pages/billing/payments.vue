<route lang="yaml">
meta:
  privilege:
    - user
    - admin
    - fluxteam
</route>

<template>
  <div>
    <!-- Loading State -->
    <LoadingSpinner
      v-if="loading"
      icon="tabler-credit-card"
      :icon-size="56"
      :rotate-icon="true"
      :title="$t('pages.billing.loading')"
      :message="$t('pages.billing.fetchingPaymentHistory')"
    />

    <!-- Page Header -->
    <div v-else class="mb-8">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">
            {{ $t('pages.billing.title') }}
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            {{ $t('pages.billing.subtitle') }}
          </p>
        </div>
        <VBtn
          v-if="totalPaid > 0"
          variant="flat"
          color="primary"
          prepend-icon="tabler-download"
          @click="exportDialogOpen = true"
        >
          <template #prepend>
            <VIcon icon="tabler-download" size="20" />
          </template>
          {{ $t('pages.billing.export') }}
        </VBtn>
      </div>
    </div>

    <!-- No Data State -->
    <VCard v-if="!loading && totalPaid === 0">
      <VCardText class="text-center py-12">
        <VIcon
          icon="tabler-receipt-off"
          size="64"
          color="disabled"
          class="mb-4"
        />
        <h2 class="text-h5 mb-2">
          {{ $t('pages.billing.noPaymentHistory') }}
        </h2>
        <p class="text-body-1 text-medium-emphasis">
          {{ $t('pages.billing.noPaymentsYet') }}
        </p>
      </VCardText>
    </VCard>

    <!-- Billing Data -->
    <template v-if="!loading && totalPaid > 0">
      <!-- Payment Summary Stats -->
      <VRow class="mb-6">
        <!-- Total Paid Card -->
        <VCol cols="12" sm="6" lg="3">
          <VCard elevation="2" border hover class="h-100">
                <VCardText class="pa-5">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <VAvatar size="42" color="success" variant="tonal">
                      <VIcon icon="tabler-coin" size="24" />
                    </VAvatar>
                    <VChip color="success" variant="flat" size="x-small">
                      <VIcon icon="tabler-trending-up" size="12" start />
                      100%
                    </VChip>
                  </div>
                  <div class="text-caption text-uppercase text-medium-emphasis mb-1" style="letter-spacing: 0.5px;">
                    {{ $t('pages.billing.totalPaid') }}
                  </div>
                  <div class="d-flex align-baseline mb-1">
                    <h2 class="text-h4 font-weight-bold">
                      {{ totalPaid.toFixed(2) }} FLUX
                    </h2>
                  </div>
                  <div class="text-caption text-medium-emphasis mb-3">
                    {{ registrations }} {{ $t('pages.billing.applications') }}
                  </div>
                  <VDivider class="mb-3" />
                  <div class="mb-2">
                    <div class="text-caption text-medium-emphasis mb-1" style="font-size: 0.7rem;">
                      {{ $t('pages.billing.firstTransaction') }}
                    </div>
                    <VChip color="success" variant="tonal" size="small" style="font-size: 0.75rem;">
                      <VIcon icon="tabler-clock-play" size="12" start />
                      {{ firstTransaction ? formatDate(firstTransaction.timestamp) : '-' }}
                    </VChip>
                  </div>
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1" style="font-size: 0.7rem;">
                      {{ $t('pages.billing.lastTransaction') }}
                    </div>
                    <VChip color="info" variant="tonal" size="small" style="font-size: 0.75rem;">
                      <VIcon icon="tabler-clock-stop" size="12" start />
                      {{ lastTransaction ? formatDate(lastTransaction.timestamp) : '-' }}
                    </VChip>
                  </div>
                </VCardText>
          </VCard>
        </VCol>

        <!-- Transactions Card -->
        <VCol cols="12" sm="6" lg="3">
          <VCard elevation="2" border hover class="h-100">
                <VCardText class="pa-5">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <VAvatar size="42" color="info" variant="tonal">
                      <VIcon icon="tabler-receipt" size="24" />
                    </VAvatar>
                    <VChip color="info" variant="flat" size="x-small">
                      <VIcon icon="tabler-list" size="12" start />
                      Total
                    </VChip>
                  </div>
                  <div class="text-caption text-uppercase text-medium-emphasis mb-1" style="letter-spacing: 0.5px;">
                    {{ $t('pages.billing.stats.transactions') }}
                  </div>
                  <div class="d-flex align-baseline mb-2">
                    <h2 class="text-h4 font-weight-bold">
                      {{ totalTransactions }}
                    </h2>
                  </div>
                  <div class="text-caption text-medium-emphasis d-flex justify-space-between mb-3">
                    <span class="d-flex align-center gap-2">
                      <VAvatar size="20" color="success" variant="tonal">
                        <VIcon icon="tabler-plus" size="12" />
                      </VAvatar>
                      {{ totalTransactions > 0 ? ((registrations / totalTransactions) * 100).toFixed(1) : 0 }}%
                    </span>
                    <span class="d-flex align-center gap-2">
                      <VAvatar size="20" color="warning" variant="tonal">
                        <VIcon icon="tabler-refresh" size="12" />
                      </VAvatar>
                      {{ totalTransactions > 0 ? ((updates / totalTransactions) * 100).toFixed(1) : 0 }}%
                    </span>
                  </div>
                  <VDivider class="mb-3" />
                  <div class="d-flex flex-column gap-2">
                    <div>
                      <div class="text-caption text-medium-emphasis mb-1" style="font-size: 0.7rem;">
                        {{ $t('pages.billing.stats.averageCost') }}
                      </div>
                      <VChip color="info" variant="tonal" size="small" style="font-size: 0.75rem; width: 100%;">
                        <VIcon icon="tabler-chart-line" size="12" start />
                        {{ avgTransactionCost.toFixed(2) }} FLUX
                      </VChip>
                    </div>
                    <div>
                      <div class="text-caption text-medium-emphasis mb-1" style="font-size: 0.7rem;">
                        {{ $t('pages.billing.stats.highestPayment') }}
                      </div>
                      <VChip color="success" variant="tonal" size="small" style="font-size: 0.75rem; width: 100%;">
                        <VIcon icon="tabler-arrow-up" size="12" start />
                        {{ highestTransaction.toFixed(2) }} FLUX
                      </VChip>
                    </div>
                  </div>
                </VCardText>
          </VCard>
        </VCol>

        <!-- Registrations Card -->
        <VCol cols="12" sm="6" lg="3">
          <VCard elevation="2" border hover class="h-100">
                <VCardText class="pa-5">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <VAvatar size="42" color="success" variant="tonal">
                      <VIcon icon="tabler-square-rounded-plus" size="24" />
                    </VAvatar>
                    <VChip color="success" variant="flat" size="x-small">
                      <VIcon icon="tabler-percentage" size="12" start />
                      {{ ((registrations / totalTransactions) * 100).toFixed(0) }}%
                    </VChip>
                  </div>
                  <div class="text-caption text-uppercase text-medium-emphasis mb-1" style="letter-spacing: 0.5px;">
                    {{ $t('pages.billing.types.appregister') }}
                  </div>
                  <div class="d-flex align-baseline mb-2">
                    <h2 class="text-h4 font-weight-bold">
                      {{ registrations }}
                    </h2>
                  </div>
                  <div class="text-caption text-medium-emphasis mb-3">
                    {{ registrationPaid.toFixed(2) }} FLUX
                  </div>
                  <VDivider class="mb-3" />
                  <div class="d-flex flex-column gap-2">
                    <div>
                      <div class="text-caption text-medium-emphasis mb-1" style="font-size: 0.7rem;">
                        {{ $t('pages.billing.stats.averageCost') }}
                      </div>
                      <VChip color="success" variant="tonal" size="small" style="font-size: 0.75rem; width: 100%;">
                        <VIcon icon="tabler-chart-line" size="12" start />
                        {{ avgRegistrationCost.toFixed(2) }} FLUX
                      </VChip>
                    </div>
                    <div>
                      <div class="text-caption text-medium-emphasis mb-1" style="font-size: 0.7rem;">
                        Share of Total
                      </div>
                      <VChip color="success" variant="tonal" size="small" style="font-size: 0.75rem; width: 100%;">
                        <VIcon icon="tabler-percentage" size="12" start />
                        {{ ((registrationPaid / totalPaid) * 100).toFixed(1) }}%
                      </VChip>
                    </div>
                  </div>
                </VCardText>
          </VCard>
        </VCol>

        <!-- Updates Card -->
        <VCol cols="12" sm="6" lg="3">
          <VCard elevation="2" border hover class="h-100">
                <VCardText class="pa-5">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <VAvatar size="42" color="warning" variant="tonal">
                      <VIcon icon="tabler-refresh" size="24" />
                    </VAvatar>
                    <VChip color="warning" variant="flat" size="x-small">
                      <VIcon icon="tabler-percentage" size="12" start />
                      {{ ((updates / totalTransactions) * 100).toFixed(0) }}%
                    </VChip>
                  </div>
                  <div class="text-caption text-uppercase text-medium-emphasis mb-1" style="letter-spacing: 0.5px;">
                    {{ $t('pages.billing.types.appupdate') }}
                  </div>
                  <div class="d-flex align-baseline mb-2">
                    <h2 class="text-h4 font-weight-bold">
                      {{ updates }}
                    </h2>
                  </div>
                  <div class="text-caption text-medium-emphasis mb-3">
                    {{ updatePaid.toFixed(2) }} FLUX
                  </div>
                  <VDivider class="mb-3" />
                  <div class="d-flex flex-column gap-2">
                    <div>
                      <div class="text-caption text-medium-emphasis mb-1" style="font-size: 0.7rem;">
                        {{ $t('pages.billing.stats.averageCost') }}
                      </div>
                      <VChip color="warning" variant="tonal" size="small" style="font-size: 0.75rem; width: 100%;">
                        <VIcon icon="tabler-chart-line" size="12" start />
                        {{ avgUpdateCost.toFixed(2) }} FLUX
                      </VChip>
                    </div>
                    <div>
                      <div class="text-caption text-medium-emphasis mb-1" style="font-size: 0.7rem;">
                        Share of Total
                      </div>
                      <VChip color="warning" variant="tonal" size="small" style="font-size: 0.75rem; width: 100%;">
                        <VIcon icon="tabler-percentage" size="12" start />
                        {{ ((updatePaid / totalPaid) * 100).toFixed(1) }}%
                      </VChip>
                    </div>
                  </div>
                </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Currently Running Apps Section -->
      <VRow v-if="myApps.length > 0" class="mb-6">
        <VCol cols="12">
          <VCard>
            <VCardTitle class="d-flex align-center pa-5">
              <VIcon icon="tabler-apps" class="me-2" />
              {{ $t('pages.billing.currentlyRunningApps') }}
              <VSpacer />
              <VChip color="info" variant="tonal" size="small">
                <VIcon icon="tabler-server" size="16" start />
                {{ myApps.length }} Active
              </VChip>
            </VCardTitle>

            <VDivider />

            <VCardText class="pa-0">
              <VVirtualScroll
                :items="myApps"
                :height="400"
                item-height="80"
                class="custom-scroll"
              >
                <template v-slot:default="{ item }">
                  <VListItem class="py-1">
                    <template v-slot:prepend>
                      <VAvatar color="info" variant="tonal" size="32">
                        <VIcon icon="tabler-brand-docker" size="18" />
                      </VAvatar>
                    </template>

                    <VListItemTitle class="text-body-2 font-weight-medium d-flex align-center justify-space-between">
                      <VChip size="small" variant="tonal" color="success">
                        {{ item.name }}
                      </VChip>
                      <VChip size="x-small" variant="tonal" color="secondary">
                        <VIcon icon="tabler-apps" size="12" start />
                        {{ item.instances || (item.compose ? item.compose.length : 3) }} {{ $t('pages.billing.instances') }}
                      </VChip>
                    </VListItemTitle>
                  </VListItem>
                  <VDivider />
                </template>
              </VVirtualScroll>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Payment Trends Chart -->
      <VCard elevation="2" class="mb-6 billing-chart-container terminal-border">
        <VCardText class="pa-6">
          <!-- Chart Header -->
          <div class="mb-4">
            <h2 class="text-h5 font-weight-bold mb-1">
              {{ $t('pages.billing.chart.title') }}
            </h2>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ selectedMetric === 'cumulative' ? $t('pages.billing.chart.cumulativeTotalPayments') : `${aggregationLabels.value[selectedAggregation]} ${$t('pages.billing.chart.spendingBreakdown')}` }}
            </p>
          </div>

          <!-- Chart Controls -->
          <VRow dense class="mb-4">
            <VCol cols="12" sm="6" md="3">
              <VChip size="x-small" variant="tonal" color="info" class="mb-2">
                <VIcon icon="tabler-apps" size="14" start />
                {{ $t('pages.billing.chart.appLabel') }}
              </VChip>
              <VSelect
                v-model="chartAppFilter"
                :items="uniqueApps"
                density="compact"
                variant="outlined"
                hide-details
                clearable
                :placeholder="$t('pages.billing.chart.filterByApp')"
                prepend-inner-icon="tabler-search"
                :menu-props="{ maxHeight: 300 }"
                @update:menu="appFilterMenuOpen = $event"
              >
                <template #prepend-item>
                  <div class="pa-2">
                    <VTextField
                      v-model="appSearchQuery"
                      density="compact"
                      variant="outlined"
                      :placeholder="$t('pages.billing.chart.searchApps')"
                      hide-details
                      clearable
                      prepend-inner-icon="tabler-search"
                      class="mb-2"
                      @click.stop
                      @keydown.stop
                      @input.stop
                      @mousedown.stop
                    />
                  </div>
                </template>
              </VSelect>
            </VCol>

            <VCol cols="12" sm="6" md="3">
              <VChip size="x-small" variant="tonal" color="info" class="mb-2">
                <VIcon icon="tabler-eye" size="14" start />
                {{ $t('pages.billing.chart.viewLabel') }}
              </VChip>
              <VSelect
                v-model="selectedAggregation"
                :items="aggregationItems"
                density="compact"
                variant="outlined"
                hide-details
              />
            </VCol>

            <VCol cols="12" sm="6" md="3">
              <VChip size="x-small" variant="tonal" color="info" class="mb-2">
                <VIcon icon="tabler-calendar" size="14" start />
                {{ $t('pages.billing.chart.periodLabel') }}
              </VChip>
              <VSelect
                v-model="selectedTimeRange"
                :items="timeRangeItems"
                density="compact"
                variant="outlined"
                hide-details
              />
            </VCol>

            <VCol cols="12" sm="6" md="3">
              <VChip size="x-small" variant="tonal" color="info" class="mb-2">
                <VIcon icon="tabler-chart-line" size="14" start />
                {{ $t('pages.billing.chart.metricLabel') }}
              </VChip>
              <VSelect
                v-model="selectedMetric"
                :items="displayModeItems"
                density="compact"
                variant="outlined"
                hide-details
              />
            </VCol>
          </VRow>

          <!-- Category Pills -->
          <div class="billing-category-pills">
            <button
              class="billing-category-pill"
              :class="{ active: showRegistrations && !showUpdates }"
              :style="{ '--category-color': 'rgb(40, 199, 111)' }"
              @click="toggleCategory('registrations')"
            >
              <span v-if="!smAndDown" class="billing-category-icon">
                <VIcon icon="tabler-square-rounded-plus" size="16" />
              </span>
              <span class="billing-category-label">{{ $t('pages.billing.types.appregister') }}</span>
            </button>
            <button
              class="billing-category-pill"
              :class="{ active: showUpdates && !showRegistrations }"
              :style="{ '--category-color': 'rgb(255, 159, 67)' }"
              @click="toggleCategory('updates')"
            >
              <span v-if="!smAndDown" class="billing-category-icon">
                <VIcon icon="tabler-refresh" size="16" />
              </span>
              <span class="billing-category-label">{{ $t('pages.billing.types.appupdate') }}</span>
            </button>
            <button
              class="billing-category-pill"
              :class="{ active: showRegistrations && showUpdates }"
              :style="{ '--category-color': 'rgb(0, 200, 255)' }"
              @click="toggleCategory('total')"
            >
              <span v-if="!smAndDown" class="billing-category-icon">
                <VIcon icon="tabler-chart-line" size="16" />
              </span>
              <span class="billing-category-label">{{ $t('pages.billing.totalPaid') }}</span>
            </button>
          </div>

          <!-- Chart Area -->
          <div class="billing-chart-wrapper">
            <Line :data="filteredLineChartData" :options="lineChartOptions" />
          </div>
        </VCardText>
      </VCard>

      <!-- Payment History Table -->
      <VCard elevation="2">
        <VCardText class="pa-8">
          <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-3">
            <div>
              <h2 class="text-h5 font-weight-bold mb-1 text-no-wrap">
                {{ $t('pages.billing.paymentHistory') }}
              </h2>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ $t('pages.billing.paymentSummary') }}
              </p>
            </div>
            <div class="d-flex align-center gap-2 flex-wrap">
              <VChip
                color="success"
                variant="tonal"
                size="small"
              >
                <VIcon icon="tabler-apps" size="14" start />
                {{ filteredAppPayments.length }} {{ searchQuery ? 'Found' : 'Apps' }}
              </VChip>
              <VChip
                v-if="searchQuery && filteredAppPayments.length !== appPayments.length"
                color="info"
                variant="tonal"
                size="small"
              >
                of {{ appPayments.length }} total
              </VChip>
            </div>
          </div>

          <div class="d-flex align-center gap-2 mb-4">
            <VTextField
              v-model="searchQuery"
              prepend-inner-icon="tabler-search"
              :placeholder="$t('pages.billing.searchByName')"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
              class="flex-grow-1"
            />
            <VSelect
              v-model="itemsPerPage"
              :items="[10, 20, 50, 100, 200]"
              density="comfortable"
              variant="outlined"
              color="grey"
              bg-color="grey"
              hide-details
              style="min-width: 120px; max-width: 120px; flex-shrink: 0;"
              prepend-inner-icon="tabler-list"
            />
          </div>

          <VDataTable
            :items="filteredAppPayments"
            :headers="headers"
            :loading="loading"
            v-model:page="currentPage"
            v-model:sort-by="sortBy"
            :items-per-page="itemsPerPage"
            density="comfortable"
            hover
            class="bordered-table"
            hide-default-footer
            must-sort
            :header-props="{ class: 'text-no-wrap' }"
          >
            <template #item.appName="{ item, value, index, internalItem }">
              <VChip
                size="small"
                variant="tonal"
                color="info"
                prepend-icon="tabler-brand-docker"
                class="cursor-pointer"
                @click="console.log('CLICK:', { item, value, index, internalItem, raw: item?.raw, keys: Object.keys(item || {}) }); filterChartByApp(item?.raw?.appName || item?.appName || value)"
              >
                {{ (() => {
                  console.log('RENDER appName FULL:', {
                    index,
                    value,
                    'typeof value': typeof value,
                    'item': JSON.parse(JSON.stringify(item)),
                    'item.raw': item?.raw,
                    'item.appName': item?.appName,
                    'internalItem': internalItem ? JSON.parse(JSON.stringify(internalItem)) : null,
                    'itemKeys': item ? Object.keys(item) : [],
                    'itemValues': item ? Object.values(item) : [],
                    'sortBy': sortBy
                  });
                  return item?.raw?.appName || item?.appName || value || 'ERROR';
                })() }}
              </VChip>
            </template>

            <template #item.totalPaid="{ item }">
              <VChip
                size="small"
                variant="tonal"
                color="#FF6B35"
                prepend-icon="tabler-coin"
              >
                {{ item.totalPaid.toFixed(4) }} FLUX
              </VChip>
            </template>

            <template #item.count="{ item }">
              <div class="d-flex align-center gap-2">
                <VIcon icon="tabler-receipt-2" size="16" color="secondary" />
                <span class="text-secondary font-weight-medium text-body-2">{{ item.count }}</span>
              </div>
            </template>

            <template #item.avgPayment="{ item }">
              <VChip
                size="small"
                variant="tonal"
                color="success"
                prepend-icon="tabler-chart-line"
              >
                {{ item.avgPayment.toFixed(4) }} FLUX
              </VChip>
            </template>

            <template #item.lastPayment="{ item }">
              <VChip
                size="small"
                variant="tonal"
                color="grey"
                prepend-icon="tabler-clock"
              >
                {{ formatDate(item.lastPayment) }}
              </VChip>
            </template>

            <template #item.actions="{ item }">
              <VBtn
                size="small"
                variant="tonal"
                color="grey"
                prepend-icon="tabler-eye"
                @click="viewTransactions(item)"
              >
                {{ $t('pages.billing.table.details') }}
              </VBtn>
            </template>

            <!-- Custom pagination footer -->
            <template #bottom>
              <div class="d-flex align-center justify-space-between pa-4 border-t flex-wrap ga-2">
                <!-- Showing info - left side -->
                <VChip
                  color="default"
                  variant="tonal"
                  size="small"
                >
                  <VIcon icon="tabler-list-numbers" size="14" start />
                  {{ $t('pages.billing.table.showing', { start: startItem, end: endItem, total: filteredAppPayments.length }) }}
                </VChip>

                <!-- Pagination controls - right side -->
                <div class="d-flex align-center gap-1">
                  <VBtn
                    icon
                    variant="tonal"
                    color="grey"
                    size="x-small"
                    :disabled="currentPage === 1"
                    @click="currentPage = 1"
                    class="d-none d-sm-inline-flex"
                  >
                    <VIcon icon="tabler-chevrons-left" size="18" />
                  </VBtn>
                  <VBtn
                    icon
                    variant="tonal"
                    color="grey"
                    size="x-small"
                    :disabled="currentPage === 1"
                    @click="currentPage--"
                  >
                    <VIcon icon="tabler-chevron-left" size="18" />
                  </VBtn>

                  <div class="d-flex align-center gap-1">
                    <template v-for="page in visiblePages" :key="page">
                      <VBtn
                        v-if="page !== '...'"
                        :variant="currentPage === page ? 'flat' : 'tonal'"
                        :color="currentPage === page ? 'primary' : 'grey'"
                        size="x-small"
                        min-width="32"
                        @click="currentPage = page"
                      >
                        {{ page }}
                      </VBtn>
                      <span v-else class="px-1 text-caption">...</span>
                    </template>
                  </div>

                  <VBtn
                    icon
                    variant="tonal"
                    color="grey"
                    size="x-small"
                    :disabled="currentPage === totalPages"
                    @click="currentPage++"
                  >
                    <VIcon icon="tabler-chevron-right" size="18" />
                  </VBtn>
                  <VBtn
                    icon
                    variant="tonal"
                    color="grey"
                    size="x-small"
                    :disabled="currentPage === totalPages"
                    @click="currentPage = totalPages"
                    class="d-none d-sm-inline-flex"
                  >
                    <VIcon icon="tabler-chevrons-right" size="18" />
                  </VBtn>
                </div>
              </div>
            </template>
          </VDataTable>
        </VCardText>
      </VCard>

      <!-- Transaction Details Dialog -->
      <VDialog
        v-model="showTransactionDialog"
        max-width="1000"
      >
        <VCard v-if="selectedApp">
          <VCardTitle class="d-flex align-center justify-space-between pa-4 bg-primary" style="color: white !important;">
            <div class="d-flex align-center gap-3">
              <VIcon icon="tabler-apps" size="28" color="white" />
              <div>
                <div class="text-h6 font-weight-bold" style="color: white !important;">
                  {{ selectedApp.appName }}
                </div>
                <div class="text-body-2" style="color: white !important; opacity: 0.9">
                  {{ $t('pages.billing.paymentSummary') }}
                </div>
              </div>
            </div>
            <VBtn
              icon="tabler-x"
              variant="text"
              size="small"
              color="white"
              @click="showTransactionDialog = false"
            />
          </VCardTitle>

          <VDivider />

          <!-- App Summary -->
          <VCardText class="pa-4">
            <VRow dense>
              <VCol cols="6" md="3">
                <VCard variant="flat" class="pa-3 stat-card stat-card--secondary">
                  <div class="d-flex align-center gap-3">
                    <VAvatar size="36" color="secondary" variant="tonal">
                      <VIcon icon="tabler-coin" size="20" />
                    </VAvatar>
                    <div>
                      <div class="text-caption text-medium-emphasis">{{ $t('pages.billing.totalPaid') }}</div>
                      <div class="text-body-2 font-weight-bold">{{ selectedApp.totalPaid.toFixed(2) }} FLUX</div>
                    </div>
                  </div>
                </VCard>
              </VCol>
              <VCol cols="6" md="3">
                <VCard variant="flat" class="pa-3 stat-card stat-card--info">
                  <div class="d-flex align-center gap-3">
                    <VAvatar size="36" color="info" variant="tonal">
                      <VIcon icon="tabler-receipt" size="20" />
                    </VAvatar>
                    <div>
                      <div class="text-caption text-medium-emphasis">{{ $t('pages.billing.table.payments') }}</div>
                      <div class="text-body-2 font-weight-bold">{{ selectedApp.count }}</div>
                    </div>
                  </div>
                </VCard>
              </VCol>
              <VCol cols="6" md="3">
                <VCard variant="flat" class="pa-3 stat-card stat-card--success">
                  <div class="d-flex align-center gap-3">
                    <VAvatar size="36" color="success" variant="tonal">
                      <VIcon icon="tabler-chart-bar" size="20" />
                    </VAvatar>
                    <div>
                      <div class="text-caption text-medium-emphasis">{{ $t('pages.billing.table.avgPayment') }}</div>
                      <div class="text-body-2 font-weight-bold">{{ selectedApp.avgPayment.toFixed(2) }} FLUX</div>
                    </div>
                  </div>
                </VCard>
              </VCol>
              <VCol cols="6" md="3">
                <VCard variant="flat" class="pa-3 stat-card stat-card--warning">
                  <div class="d-flex align-center gap-3">
                    <VAvatar size="36" color="warning" variant="tonal">
                      <VIcon icon="tabler-calendar" size="20" />
                    </VAvatar>
                    <div>
                      <div class="text-caption text-medium-emphasis">{{ $t('pages.billing.lastTransaction') }}</div>
                      <div class="text-body-2 font-weight-bold">{{ formatDate(selectedApp.lastPayment).split(',')[0] }}</div>
                    </div>
                  </div>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>

          <VDivider />

          <VCardText class="pa-6">
            <VDataTable
              :items="selectedApp.transactions"
              :headers="transactionHeaders"
              :items-per-page="dialogItemsPerPage"
              v-model:page="dialogPage"
              density="comfortable"
              class="bordered-table"
            >
              <template #item.type="{ item }">
                <VChip
                  :color="item.type === 'register' ? 'success' : item.type === 'renewal' ? 'info' : 'warning'"
                  size="small"
                  variant="tonal"
                >
                  <VIcon
                    :icon="item.type === 'register' ? 'tabler-square-rounded-plus' : item.type === 'renewal' ? 'tabler-refresh' : 'tabler-edit'"
                    size="14"
                    start
                  />
                  {{ $t(`pages.billing.transactionTable.types.${item.type}`) }}
                </VChip>
              </template>

              <template #item.amount="{ item }">
                <div class="d-flex align-center gap-2">
                  <VIcon v-if="item.amount !== 0.02" icon="tabler-coin" size="16" color="success" />
                  <span v-if="item.amount !== 0.02" class="text-body-2">
                    {{ parseFloat(item.amount.toFixed(8)) }} FLUX
                  </span>
                  <VChip
                    v-if="item.amount === 0.02"
                    color="info"
                    size="small"
                    variant="tonal"
                  >
                    {{ $t('pages.billing.transactionTable.free') }}
                  </VChip>
                </div>
              </template>

              <template #item.timestamp="{ item }">
                <div class="d-flex align-center gap-2">
                  <VIcon icon="tabler-clock" size="16" color="default" />
                  <span class="text-body-2 text-medium-emphasis">
                    {{ formatDate(item.timestamp) }}
                  </span>
                </div>
              </template>

              <template #item.height="{ item }">
                <div class="d-flex align-center gap-2">
                  <VIcon icon="tabler-stack" size="16" color="default" />
                  <span class="text-body-2 text-medium-emphasis">
                    {{ item.height }}
                  </span>
                </div>
              </template>

              <template #item.txid="{ item }">
                <VBtn
                  :href="`https://explorer.runonflux.io/tx/${item.txid}`"
                  target="_blank"
                  variant="text"
                  size="small"
                  color="default"
                  prepend-icon="tabler-external-link"
                >
                  {{ item.txid.substring(0, 12) }}...
                </VBtn>
              </template>

              <!-- Custom pagination footer -->
              <template #bottom>
                <div class="d-flex align-center justify-space-between pa-4 border-t flex-wrap ga-2">
                  <VChip color="default" variant="tonal" size="small">
                    <VIcon icon="tabler-list-numbers" size="14" start />
                    {{ $t('pages.billing.table.showing', { start: dialogStartItem, end: dialogEndItem, total: selectedApp.transactions.length }) }}
                  </VChip>

                  <div class="d-flex align-center gap-1">
                    <VBtn
                      icon variant="tonal" color="grey" size="x-small"
                      :disabled="dialogPage === 1"
                      @click="dialogPage = 1"
                      class="d-none d-sm-inline-flex"
                    >
                      <VIcon icon="tabler-chevrons-left" size="18" />
                    </VBtn>
                    <VBtn
                      icon variant="tonal" color="grey" size="x-small"
                      :disabled="dialogPage === 1"
                      @click="dialogPage--"
                    >
                      <VIcon icon="tabler-chevron-left" size="18" />
                    </VBtn>

                    <div class="d-flex align-center gap-1">
                      <template v-for="page in dialogVisiblePages" :key="page">
                        <VBtn
                          v-if="page !== '...'"
                          :variant="dialogPage === page ? 'flat' : 'tonal'"
                          :color="dialogPage === page ? 'primary' : 'grey'"
                          size="x-small"
                          min-width="32"
                          @click="dialogPage = page"
                        >
                          {{ page }}
                        </VBtn>
                        <span v-else class="px-1 text-caption">...</span>
                      </template>
                    </div>

                    <VBtn
                      icon variant="tonal" color="grey" size="x-small"
                      :disabled="dialogPage === dialogTotalPages"
                      @click="dialogPage++"
                    >
                      <VIcon icon="tabler-chevron-right" size="18" />
                    </VBtn>
                    <VBtn
                      icon variant="tonal" color="grey" size="x-small"
                      :disabled="dialogPage === dialogTotalPages"
                      @click="dialogPage = dialogTotalPages"
                      class="d-none d-sm-inline-flex"
                    >
                      <VIcon icon="tabler-chevrons-right" size="18" />
                    </VBtn>
                  </div>
                </div>
              </template>
            </VDataTable>
          </VCardText>
        </VCard>
      </VDialog>
    </template>

    <!-- Export Dialog -->
    <VDialog
      v-model="exportDialogOpen"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="d-flex align-center gap-2 pa-3 bg-primary text-white">
          <VIcon icon="tabler-download" size="22" color="white" />
          <span>{{ $t('pages.billing.exportDialog.title') }}</span>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-5">
          <p class="text-body-1 text-medium-emphasis mb-4">
            {{ $t('pages.billing.exportDialog.dateRange') }}
          </p>

          <div
            class="pa-4 rounded"
            style="background-color: rgba(var(--v-theme-on-surface), 0.04); border: 1px solid rgba(var(--v-theme-on-surface), 0.12)"
          >
            <VRadioGroup
              v-model="exportPeriod"
              color="primary"
              class="export-radio-group"
              hide-details
            >
              <VRadio
                value="all"
                :label="$t('pages.billing.exportDialog.allTime')"
              />
              <VRadio
                value="7d"
                :label="$t('pages.billing.chart.last7Days')"
              />
              <VRadio
                value="30d"
                :label="$t('pages.billing.exportDialog.last30Days')"
              />
              <VRadio
                value="90d"
                :label="$t('pages.billing.exportDialog.last90Days')"
              />
              <VRadio
                value="365d"
                :label="$t('pages.billing.exportDialog.lastYear')"
              />
              <VRadio
                value="custom"
                :label="$t('pages.billing.exportDialog.customRange')"
              />
            </VRadioGroup>
          </div>

          <!-- Custom Date Range -->
          <div
            v-if="exportPeriod === 'custom'"
            class="mt-4 pa-4 rounded"
            style="background-color: rgba(var(--v-theme-on-surface), 0.04); border: 1px solid rgba(var(--v-theme-on-surface), 0.12)"
          >
            <VRow>
              <VCol cols="12" sm="6">
                <label class="text-caption text-medium-emphasis mb-2 d-block">{{ $t('pages.billing.exportDialog.startDate') }}</label>
                <flat-pickr
                  v-model="exportCustomStartDate"
                  :config="flatpickrConfig"
                  class="flatpickr-input"
                  :placeholder="$t('pages.billing.exportDialog.startDate')"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <label class="text-caption text-medium-emphasis mb-2 d-block">{{ $t('pages.billing.exportDialog.endDate') }}</label>
                <flat-pickr
                  v-model="exportCustomEndDate"
                  :config="flatpickrConfig"
                  class="flatpickr-input"
                  :placeholder="$t('pages.billing.exportDialog.endDate')"
                />
              </VCol>
            </VRow>

            <!-- Validation Error Alert -->
            <VAlert
              v-if="exportValidationError"
              type="error"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              {{ exportValidationError }}
            </VAlert>
          </div>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            variant="text"
            color="error"
            size="small"
            @click="exportDialogOpen = false"
          >
            {{ $t('pages.billing.exportDialog.cancel') }}
          </VBtn>
          <VBtn
            variant="flat"
            color="primary"
            size="small"
            prepend-icon="tabler-download"
            @click="exportCSV"
          >
            {{ $t('pages.billing.exportDialog.export') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFluxStore } from '@/stores/flux'
import { storeToRefs } from 'pinia'
import { useSEO } from '@/composables/useSEO'
import { useI18n } from 'vue-i18n'
import BillingService from '@/services/BillingService'
import { Doughnut, Line } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler } from 'chart.js'
import { useTheme, useDisplay } from 'vuetify'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

const router = useRouter()
const fluxStore = useFluxStore()
const { zelid } = storeToRefs(fluxStore)
const theme = useTheme()
const { t } = useI18n()
const { smAndDown } = useDisplay()

// SEO configuration - exclude from search engines and robots
useSEO({
  title: 'Billing & Payments',
  description: 'Private billing and payment history page',
  robots: 'noindex, nofollow',
})

// Dynamically load flatpickr theme based on current theme
const loadFlatpickrTheme = () => {
  // Remove existing flatpickr theme styles
  const existingStyles = document.querySelectorAll('style[data-flatpickr-theme]')
  existingStyles.forEach(style => style.remove())

  // Dynamically import theme CSS
  if (theme.global.current.value.dark) {
    import('flatpickr/dist/themes/dark.css')
  } else {
    import('flatpickr/dist/themes/light.css')
  }
}

// Watch for theme changes
watch(() => theme.global.current.value.dark, () => {
  loadFlatpickrTheme()
}, { immediate: true })

const loading = ref(false)
const transactions = ref([])
const myApps = ref([])
const showTransactionDialog = ref(false)
const selectedApp = ref(null)
const searchQuery = ref('')
const appSearchQuery = ref('')

// Pagination state
const itemsPerPage = ref(10)
const currentPage = ref(1)
const sortBy = ref([{ key: 'totalPaid', order: 'desc' }])

// Chart controls
const selectedMetric = ref('cumulative')  // 'monthly' or 'cumulative'
const selectedAggregation = ref('monthly')  // 'daily', 'weekly', 'monthly'
const selectedTimeRange = ref('all')
const chartAppFilter = ref(null)  // Filter chart by app name (null = all apps)
const appFilterMenuOpen = ref(false)  // Track if app filter dropdown is open
const showRegistrations = ref(true)
const showUpdates = ref(true)

// Export dialog
const exportDialogOpen = ref(false)
const exportPeriod = ref('all')
const exportCustomStartDate = ref('')
const exportCustomEndDate = ref('')
const exportValidationError = ref('')

// Reset export dialog to defaults when closed
watch(exportDialogOpen, (isOpen) => {
  if (!isOpen) {
    // Reset to defaults when dialog closes
    exportPeriod.value = 'all'
    exportCustomStartDate.value = ''
    exportCustomEndDate.value = ''
    exportValidationError.value = ''
  }
})

// Clear validation error when export period or dates change
watch(exportPeriod, () => {
  exportValidationError.value = ''
})

watch([exportCustomStartDate, exportCustomEndDate], () => {
  exportValidationError.value = ''
})

// Flatpickr configuration
const flatpickrConfig = {
  dateFormat: 'Y-m-d',
  allowInput: true,
}

const aggregationLabels = computed(() => ({
  daily: t('pages.billing.chart.aggregation.daily'),
  weekly: t('pages.billing.chart.aggregation.weekly'),
  monthly: t('pages.billing.chart.aggregation.monthly'),
}))

const aggregationItems = computed(() => [
  { value: 'daily', title: t('pages.billing.chart.aggregation.daily') },
  { value: 'weekly', title: t('pages.billing.chart.aggregation.weekly') },
  { value: 'monthly', title: t('pages.billing.chart.aggregation.monthly') },
])

const timeRangeItems = computed(() => [
  { value: '7d', title: t('pages.billing.chart.timeRanges.7d') },
  { value: '30d', title: t('pages.billing.chart.timeRanges.30d') },
  { value: '90d', title: t('pages.billing.chart.timeRanges.90d') },
  { value: '1y', title: t('pages.billing.chart.timeRanges.1y') },
  { value: 'all', title: t('pages.billing.chart.timeRanges.all') },
])

const displayModeItems = computed(() => [
  { value: 'monthly', title: t('pages.billing.chart.displayModes.periodTotal') },
  { value: 'cumulative', title: t('pages.billing.chart.displayModes.cumulative') },
])

// Toggle category pills
function toggleCategory(category) {
  if (category === 'registrations') {
    showRegistrations.value = true
    showUpdates.value = false
  } else if (category === 'updates') {
    showRegistrations.value = false
    showUpdates.value = true
  } else if (category === 'total') {
    showRegistrations.value = true
    showUpdates.value = true
  }
}

// Get unique app names from transactions
const uniqueApps = computed(() => {
  const apps = new Set()
  transactions.value.forEach(tx => {
    const appName = tx.appSpecifications?.name || 'Unknown'
    apps.add(appName)
  })

  const allApps = Array.from(apps).sort()

  // Filter by search query if present
  if (appSearchQuery.value) {
    const query = appSearchQuery.value.toLowerCase()
    return allApps
      .filter(app => app.toLowerCase().includes(query))
      .map(app => ({ value: app, title: app }))
  }

  return allApps.map(app => ({ value: app, title: app }))
})


// Table headers
const headers = computed(() => [
  { title: t('pages.billing.table.appName'), key: 'appName', sortable: true },
  { title: t('pages.billing.table.totalPaid'), key: 'totalPaid', sortable: true },
  { title: t('pages.billing.table.payments'), key: 'count', sortable: true },
  { title: t('pages.billing.table.avgPayment'), key: 'avgPayment', sortable: true },
  { title: t('pages.billing.lastTransaction'), key: 'lastPayment', sortable: true },
  { title: t('pages.billing.table.actions'), key: 'actions', sortable: false },
])

const transactionHeaders = computed(() => [
  { title: t('pages.billing.transactionTable.type'), key: 'type', sortable: true },
  { title: t('pages.billing.transactionTable.amount'), key: 'amount', sortable: true },
  { title: t('pages.billing.transactionTable.date'), key: 'timestamp', sortable: true },
  { title: t('pages.billing.transactionTable.blockHeight'), key: 'height', sortable: true },
  { title: t('pages.billing.transactionTable.txid'), key: 'txid', sortable: false },
])

// Helper function to check if transaction is a free update (0.02 FLUX)
const isFreeUpdate = (tx) => {
  const amountFlux = (tx.valueSat || 0) / 100000000
  return amountFlux === 0.02
}

// Computed analytics (excluding free updates from calculations)
const totalPaid = computed(() => {
  return transactions.value.reduce((sum, tx) => {
    if (isFreeUpdate(tx)) return sum
    return sum + (tx.valueSat || 0) / 100000000
  }, 0)
})

const totalTransactions = computed(() => transactions.value.length)

const registrations = computed(() => {
  return transactions.value.filter(tx =>
    tx.type === 'zelappregister' || tx.type === 'fluxappregister',
  ).length
})

const registrationPaid = computed(() => {
  return transactions.value
    .filter(tx => tx.type === 'zelappregister' || tx.type === 'fluxappregister')
    .reduce((sum, tx) => {
      if (isFreeUpdate(tx)) return sum
      return sum + (tx.valueSat || 0) / 100000000
    }, 0)
})

const updates = computed(() => {
  return transactions.value.filter(tx =>
    tx.type === 'zelappupdate' || tx.type === 'fluxappupdate',
  ).length
})

const updatePaid = computed(() => {
  return transactions.value
    .filter(tx => tx.type === 'zelappupdate' || tx.type === 'fluxappupdate')
    .reduce((sum, tx) => {
      if (isFreeUpdate(tx)) return sum
      return sum + (tx.valueSat || 0) / 100000000
    }, 0)
})

const firstTransaction = computed(() => {
  if (transactions.value.length === 0) return null
  const sorted = [...transactions.value].sort((a, b) => {
    const aMs = a.timestamp > 10000000000000 ? a.timestamp / 1000 : a.timestamp
    const bMs = b.timestamp > 10000000000000 ? b.timestamp / 1000 : b.timestamp
    return aMs - bMs
  })
  return sorted[0]
})

const lastTransaction = computed(() => {
  if (transactions.value.length === 0) return null
  const sorted = [...transactions.value].sort((a, b) => {
    const aMs = a.timestamp > 10000000000000 ? a.timestamp / 1000 : a.timestamp
    const bMs = b.timestamp > 10000000000000 ? b.timestamp / 1000 : b.timestamp
    return bMs - aMs
  })
  return sorted[0]
})

const appPayments = computed(() => {
  const byApp = {}

  transactions.value.forEach(tx => {
    const appName = tx.appSpecifications?.name || 'Unknown'
    const amountFlux = (tx.valueSat || 0) / 100000000
    const isRegister = tx.type === 'zelappregister' || tx.type === 'fluxappregister'
    const type = isRegister ? 'register' : 'update'

    if (!byApp[appName]) {
      byApp[appName] = {
        appName,
        count: 0,
        totalPaid: 0,
        firstPayment: tx.timestamp,
        lastPayment: tx.timestamp,
      }
    }

    byApp[appName].count++
    // Exclude free updates from totalPaid calculation
    if (!isFreeUpdate(tx)) {
      byApp[appName].totalPaid += amountFlux
    }
    byApp[appName].lastPayment = Math.max(byApp[appName].lastPayment, tx.timestamp)
  })

  return Object.values(byApp).map(app => ({
    ...app,
    avgPayment: app.totalPaid / app.count,
  }))
})

const filteredAppPayments = computed(() => {
  let result
  if (!searchQuery.value) {
    result = [...appPayments.value]
  } else {
    const query = searchQuery.value.toLowerCase()
    result = appPayments.value.filter(app =>
      app.appName.toLowerCase().includes(query)
    )
  }

  // Manual sorting - VDataTable sorting doesn't work properly with custom pagination
  if (sortBy.value && sortBy.value.length > 0) {
    const { key, order } = sortBy.value[0]
    result.sort((a, b) => {
      let aVal = a[key]
      let bVal = b[key]

      // Special handling for appName - use natural sort for numeric strings
      if (key === 'appName') {
        aVal = String(aVal)
        bVal = String(bVal)
        const comparison = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
        return order === 'desc' ? -comparison : comparison
      }

      // Numeric comparison for other fields
      if (aVal < bVal) return order === 'desc' ? 1 : -1
      if (aVal > bVal) return order === 'desc' ? -1 : 1
      return 0
    })
  }

  console.log('filteredAppPayments computed (sorted):', {
    count: result.length,
    first10: result.slice(0, 10).map(app => ({ appName: app.appName, totalPaid: app.totalPaid })),
    sortBy: sortBy.value
  })

  return result
})

// Pagination computeds
const totalPages = computed(() => {
  return Math.ceil(filteredAppPayments.value.length / itemsPerPage.value)
})

const startItem = computed(() => {
  return (currentPage.value - 1) * itemsPerPage.value + 1
})

const endItem = computed(() => {
  return Math.min(currentPage.value * itemsPerPage.value, filteredAppPayments.value.length)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    // Show all pages if 7 or less
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    if (current > 3) {
      pages.push('...')
    }

    // Show pages around current
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push('...')
    }

    // Always show last page
    pages.push(total)
  }

  return pages
})

// Dialog transaction table pagination
const dialogPage = ref(1)
const dialogItemsPerPage = 10

const dialogTotalPages = computed(() => {
  return Math.ceil((selectedApp.value?.transactions?.length || 0) / dialogItemsPerPage)
})

const dialogStartItem = computed(() => {
  return (dialogPage.value - 1) * dialogItemsPerPage + 1
})

const dialogEndItem = computed(() => {
  return Math.min(dialogPage.value * dialogItemsPerPage, selectedApp.value?.transactions?.length || 0)
})

const dialogVisiblePages = computed(() => {
  const pages = []
  const total = dialogTotalPages.value
  const current = dialogPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})

// Reset dialog page when opening a new app
watch(() => selectedApp.value?.appName, () => {
  dialogPage.value = 1
})

const topApps = computed(() => {
  return appPayments.value
    .sort((a, b) => b.totalPaid - a.totalPaid)
    .slice(0, 5)
})

// Additional statistics
const avgTransactionCost = computed(() => {
  return totalTransactions.value > 0 ? totalPaid.value / totalTransactions.value : 0
})

const avgRegistrationCost = computed(() => {
  return registrations.value > 0 ? registrationPaid.value / registrations.value : 0
})

const avgUpdateCost = computed(() => {
  return updates.value > 0 ? updatePaid.value / updates.value : 0
})

const avgUpdatesPerApp = computed(() => {
  return registrations.value > 0 ? updates.value / registrations.value : 0
})

const highestTransaction = computed(() => {
  if (transactions.value.length === 0) return 0
  const highest = transactions.value.reduce((max, tx) => {
    const amount = (tx.valueSat || 0) / 100000000
    return amount > max ? amount : max
  }, 0)
  return highest
})

const lowestTransaction = computed(() => {
  if (transactions.value.length === 0) return 0
  const lowest = transactions.value.reduce((min, tx) => {
    const amount = (tx.valueSat || 0) / 100000000
    return min === 0 || (amount > 0 && amount < min) ? amount : min
  }, 0)
  return lowest
})

// Methods
async function fetchPaymentHistory() {
  loading.value = true
  try {
    const zelidauth = localStorage.getItem('zelidauth')

    // Check if user is authenticated (zelidauth contains zelid)
    if (!zelidauth) {
      console.warn('No authentication found - logging out')
      await router.push('/')
      return
    }

    // Extract zelid from zelidauth (format: zelid=...&signature=...&loginPhrase=...)
    const params = new URLSearchParams(zelidauth)
    const extractedZelid = params.get('zelid')

    // Validate zelid exists and is not empty
    if (!extractedZelid || !extractedZelid.trim()) {
      console.warn('Invalid zelid in zelidauth - logging out')
      await router.push('/')
      return
    }

    console.log('=== FETCH PAYMENT HISTORY DEBUG ===')
    console.log('ZelID:', extractedZelid)
    console.log('ZelidAuth exists:', !!zelidauth)

    const response = await BillingService.getMyPaymentHistory(zelidauth, extractedZelid)
    transactions.value = response.data.data || []

    console.log('Total transactions:', transactions.value.length)

    // Fetch currently running apps
    const appsResponse = await BillingService.getMyApps(zelidauth, extractedZelid)
    myApps.value = appsResponse.data.data || []
    console.log('Total running apps:', myApps.value.length)
    console.log('First 5 transactions app names:', transactions.value.slice(0, 5).map(tx => ({
      type: tx.type,
      appName: tx.appSpecifications?.name,
      fullSpec: tx.appSpecifications
    })))

    // Extract all unique app names
    const allAppNames = [...new Set(transactions.value.map(tx => tx.appSpecifications?.name).filter(Boolean))]
    console.log('All unique app names (first 20):', allAppNames.slice(0, 20))
    console.log('Numeric-only app names:', allAppNames.filter(name => /^\d+$/.test(name)))
  }
  catch (error) {
    console.error('Failed to fetch payment history:', error)
  }
  finally {
    loading.value = false
  }
}

function formatDate(timestamp) {
  // Convert microseconds to milliseconds if needed
  const ms = timestamp > 10000000000000 ? timestamp / 1000 : timestamp
  return new Date(ms).toLocaleString()
}

function formatDateShort(timestamp) {
  // Convert microseconds to milliseconds if needed
  const ms = timestamp > 10000000000000 ? timestamp / 1000 : timestamp
  const date = new Date(ms)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

function getTierName(tierlevel) {
  const tierMap = { 0: 'STRATUS', 1: 'NIMBUS', 2: 'CUMULUS' }
  return tierMap[tierlevel] || 'UNKNOWN'
}

function getTierColor(tierlevel) {
  const colorMap = { 0: 'error', 1: 'warning', 2: 'info' }
  return colorMap[tierlevel] || 'default'
}

// Reset page when search or items per page changes
watch([searchQuery, itemsPerPage], () => {
  currentPage.value = 1
})

// Clear app search when dropdown closes
watch(appFilterMenuOpen, (isOpen) => {
  if (!isOpen) {
    appSearchQuery.value = ''
  }
})

function viewTransactions(app) {
  // Dynamically build transactions array for this specific app
  const rawTxs = transactions.value
    .filter(tx => (tx.appSpecifications?.name || 'Unknown') === app.appName)
    .sort((a, b) => a.timestamp - b.timestamp)

  const appTransactions = rawTxs.map((tx, i) => {
    const amountFlux = (tx.valueSat || 0) / 100000000
    const isRegister = tx.type === 'zelappregister' || tx.type === 'fluxappregister'

    let type = 'update'
    if (isRegister) {
      type = 'register'
    } else {
      const currSpec = tx.appSpecifications || {}
      const specVersion = currSpec.version || 0

      // Spec version < 6 had no expire field — every update was a renewal
      if (specVersion < 6) {
        type = 'renewal'
      } else {
        // Spec version >= 6 has expire field — compare with previous tx
        const prevTx = rawTxs[i - 1]
        if (prevTx) {
          const prevSpec = prevTx.appSpecifications || {}
          const expireChanged = prevSpec.expire !== currSpec.expire
          const onlyExpireOrNoChange = Object.keys(currSpec).every(k =>
            k === 'expire' || JSON.stringify(prevSpec[k]) === JSON.stringify(currSpec[k])
          )
          if (expireChanged || onlyExpireOrNoChange) {
            type = 'renewal'
          }
        }
      }
    }

    return {
      txid: tx.txid,
      amount: amountFlux,
      height: tx.height,
      timestamp: tx.timestamp,
      type: type,
    }
  })

  selectedApp.value = {
    ...app,
    transactions: appTransactions,
  }
  showTransactionDialog.value = true
}

function filterChartByApp(appName) {
  chartAppFilter.value = appName
  // Scroll to chart section
  const chartElement = document.querySelector('.billing-chart-container')
  if (chartElement) {
    chartElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// Chart.js configuration
const chartData = computed(() => ({
  labels: ['Registrations', 'Updates'],
  datasets: [{
    data: [registrationPaid.value, updatePaid.value],
    backgroundColor: [
      'rgba(40, 199, 111, 0.3)',  // success color
      'rgba(255, 159, 67, 0.3)',   // warning color
    ],
    borderColor: [
      'rgb(40, 199, 111)',
      'rgb(255, 159, 67)',
    ],
    borderWidth: 2,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 10,
      displayColors: true,
      titleFont: {
        size: 11,
        weight: 'bold',
      },
      bodyFont: {
        size: 10,
      },
      boxWidth: 8,
      boxHeight: 8,
      callbacks: {
        title: function(context) {
          return context[0].label || ''
        },
        label: function(context) {
          const value = context.parsed || 0
          const percentage = ((value / totalPaid.value) * 100).toFixed(1)
          return `${value.toFixed(0)} FLUX (${percentage}%)`
        },
      },
    },
  },
  cutout: '70%',
  hover: {
    mode: 'nearest',
    intersect: true,
  },
}

// Line chart data - Monthly spending trends
const lineChartData = computed(() => {
  // Group transactions by month
  const monthlyData = {}

  transactions.value.forEach(tx => {
    const ms = tx.timestamp > 10000000000000 ? tx.timestamp / 1000 : tx.timestamp
    const date = new Date(ms)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        registrations: 0,
        updates: 0,
      }
    }

    const amount = (tx.valueSat || 0) / 100000000
    const isRegister = tx.type === 'zelappregister' || tx.type === 'fluxappregister'

    if (isRegister) {
      monthlyData[monthKey].registrations += amount
    } else {
      monthlyData[monthKey].updates += amount
    }
  })

  // Sort by month and get labels
  const sortedMonths = Object.keys(monthlyData).sort()
  const labels = sortedMonths.map(month => {
    const [year, monthNum] = month.split('-')
    const date = new Date(year, monthNum - 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  })

  const registrationData = sortedMonths.map(month => monthlyData[month].registrations)
  const updateData = sortedMonths.map(month => monthlyData[month].updates)

  return {
    labels,
    datasets: [
      {
        label: 'Registrations',
        data: registrationData,
        borderColor: 'rgb(40, 199, 111)',
        backgroundColor: 'rgba(40, 199, 111, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(40, 199, 111)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Updates',
        data: updateData,
        borderColor: 'rgb(255, 159, 67)',
        backgroundColor: 'rgba(255, 159, 67, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(255, 159, 67)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }
})

// Filtered chart data based on selected time range, aggregation, and metric type
const filteredLineChartData = computed(() => {
  const now = new Date()
  let cutoffDate

  switch (selectedTimeRange.value) {
    case '7d':
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    case 'all':
      cutoffDate = null
      break
  }

  // Group transactions based on aggregation type
  const aggregatedData = {}

  transactions.value.forEach(tx => {
    const ms = tx.timestamp > 10000000000000 ? tx.timestamp / 1000 : tx.timestamp
    const date = new Date(ms)

    if (cutoffDate && date < cutoffDate) return

    // Filter by app if selected
    const appName = tx.appSpecifications?.name || 'Unknown'
    if (chartAppFilter.value && appName !== chartAppFilter.value) return

    let key
    if (selectedAggregation.value === 'daily') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    } else if (selectedAggregation.value === 'weekly') {
      // Get Monday of the week
      const dayOfWeek = date.getDay()
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const monday = new Date(date.setDate(diff))
      key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
    } else {
      // Monthly
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    if (!aggregatedData[key]) {
      aggregatedData[key] = {
        registrations: 0,
        updates: 0,
        total: 0,
      }
    }

    const amount = (tx.valueSat || 0) / 100000000
    const isRegister = tx.type === 'zelappregister' || tx.type === 'fluxappregister'

    if (isRegister) {
      aggregatedData[key].registrations += amount
    } else {
      aggregatedData[key].updates += amount
    }
    aggregatedData[key].total += amount
  })

  // Sort and create labels
  const sortedKeys = Object.keys(aggregatedData).sort()

  // Create full date labels for tooltip (with year)
  const fullDateLabels = sortedKeys.map(key => {
    if (selectedAggregation.value === 'daily') {
      const [year, month, day] = key.split('-')
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } else if (selectedAggregation.value === 'weekly') {
      const [year, month, day] = key.split('-')
      const date = new Date(year, month - 1, day)
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      const [year, month] = key.split('-')
      const date = new Date(year, month - 1)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
  })

  // Create display labels for chart (shorter version for x-axis)
  const labels = sortedKeys.map(key => {
    if (selectedAggregation.value === 'daily') {
      const [year, month, day] = key.split('-')
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (selectedAggregation.value === 'weekly') {
      const [year, month, day] = key.split('-')
      const date = new Date(year, month - 1, day)
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } else {
      const [year, month] = key.split('-')
      const date = new Date(year, month - 1)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
  })

  // Calculate data based on metric type (period total or cumulative)
  let totalData, registrationData, updateData

  if (selectedMetric.value === 'cumulative') {
    // Cumulative: running total
    let cumulativeTotal = 0
    let cumulativeRegistrations = 0
    let cumulativeUpdates = 0

    totalData = sortedKeys.map(key => {
      cumulativeTotal += aggregatedData[key].total
      return cumulativeTotal
    })

    registrationData = sortedKeys.map(key => {
      cumulativeRegistrations += aggregatedData[key].registrations
      return cumulativeRegistrations
    })

    updateData = sortedKeys.map(key => {
      cumulativeUpdates += aggregatedData[key].updates
      return cumulativeUpdates
    })
  } else {
    // Period total: individual period totals
    totalData = sortedKeys.map(key => aggregatedData[key].total)
    registrationData = sortedKeys.map(key => aggregatedData[key].registrations)
    updateData = sortedKeys.map(key => aggregatedData[key].updates)
  }

  // Build datasets based on category pills
  const datasets = []

  // If both are enabled or both are disabled, show total
  if ((showRegistrations.value && showUpdates.value) || (!showRegistrations.value && !showUpdates.value)) {
    datasets.push({
      label: 'Total Payments',
      data: totalData,
      fullDateLabels,  // Store full dates for tooltip
      borderColor: 'rgb(0, 200, 255)',
      backgroundColor: 'rgba(0, 200, 255, 0.1)',
      tension: 0.4,
      fill: true,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: 'rgb(0, 200, 255)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    })
  } else {
    // Show only the selected category
    if (showRegistrations.value) {
      datasets.push({
        label: 'Registrations',
        data: registrationData,
        fullDateLabels,  // Store full dates for tooltip
        borderColor: 'rgb(40, 199, 111)',
        backgroundColor: 'rgba(40, 199, 111, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(40, 199, 111)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      })
    }

    if (showUpdates.value) {
      datasets.push({
        label: 'Updates',
        data: updateData,
        fullDateLabels,  // Store full dates for tooltip
        borderColor: 'rgb(255, 159, 67)',
        backgroundColor: 'rgba(255, 159, 67, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(255, 159, 67)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      })
    }
  }

  return {
    labels,
    datasets,
  }
})

// Custom HTML Tooltip Handler
const getOrCreateTooltip = (chart) => {
  let tooltipEl = chart.canvas.parentNode.querySelector('div.chartjs-tooltip')

  if (!tooltipEl) {
    tooltipEl = document.createElement('div')
    tooltipEl.classList.add('chartjs-tooltip')
    tooltipEl.style.opacity = '0'
    tooltipEl.style.pointerEvents = 'none'
    tooltipEl.style.position = 'absolute'
    tooltipEl.style.transition = 'all 0.1s ease'
    tooltipEl.style.zIndex = '1000'

    chart.canvas.parentNode.appendChild(tooltipEl)
  }

  return tooltipEl
}

const externalTooltipHandler = (context) => {
  const { chart, tooltip } = context
  const tooltipEl = getOrCreateTooltip(chart)

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0'
    return
  }

  if (tooltip.body) {
    const index = tooltip.dataPoints[0].dataIndex
    const datasetIndex = tooltip.dataPoints[0].datasetIndex
    const dataset = chart.data.datasets[datasetIndex]
    const value = dataset.data[index]

    // Use full date label with year from dataset metadata
    const fullDateLabel = dataset.fullDateLabels ? dataset.fullDateLabels[index] : tooltip.title[0]

    let tooltipContent = ''

    // Title with full date (including year)
    tooltipContent += `<div style="color: rgb(0, 200, 255); font-weight: bold; margin-bottom: 4px;">${fullDateLabel}</div>`

    // Main value
    tooltipContent += `<div style="color: #ffffff; line-height: 1.4;">${value.toFixed(2)} FLUX</div>`

    // Change indicator (for cumulative or if index > 0)
    if (index > 0 && dataset.data[index - 1] !== undefined) {
      const prevValue = dataset.data[index - 1]
      const diff = value - prevValue
      const percentChange = prevValue > 0 ? ((diff / prevValue) * 100) : 0
      const isPositive = diff > 0
      const isNegative = diff < 0
      const color = isPositive ? '#00ff00' : isNegative ? '#ff0000' : '#ffffff'
      const sign = isPositive ? '+' : ''
      tooltipContent += `<div style="color: ${color}; line-height: 1.4;">${sign}${diff.toFixed(2)} FLUX (${sign}${percentChange.toFixed(2)}%)</div>`
    }

    tooltipEl.innerHTML = tooltipContent
  }

  // Apply tooltip styles
  tooltipEl.style.background = 'rgba(10, 14, 23, 0.95)'
  tooltipEl.style.borderRadius = '3px'
  tooltipEl.style.padding = '12px'
  tooltipEl.style.border = '1px solid rgb(0, 200, 255)'
  tooltipEl.style.fontFamily = "'Courier New', monospace"
  tooltipEl.style.fontSize = '12px'
  tooltipEl.style.whiteSpace = 'nowrap'

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas

  // Smart positioning: check if tooltip would overflow on right side
  const chartWidth = chart.width
  const tooltipWidth = tooltipEl.offsetWidth || 200 // fallback width
  const caretX = tooltip.caretX

  let transformX = '-50%' // default: center
  let leftPosition = positionX + caretX

  // If tooltip would overflow right side, align to right edge
  if (caretX + tooltipWidth / 2 > chartWidth) {
    transformX = '-100%' // align right
    leftPosition = positionX + caretX
  }
  // If tooltip would overflow left side, align to left edge
  else if (caretX - tooltipWidth / 2 < 0) {
    transformX = '0%' // align left
    leftPosition = positionX + caretX
  }

  tooltipEl.style.opacity = '1'
  tooltipEl.style.left = leftPosition + 'px'
  tooltipEl.style.top = positionY + tooltip.caretY + 'px'
  tooltipEl.style.transform = `translate(${transformX}, 0)`
}

const lineChartOptions = computed(() => {
  // Get current theme from Vuetify
  const isDark = theme.global.current.value.dark
  const axisColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
      },
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: axisColor,
          font: {
            family: "'Courier New', monospace",
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: axisColor,
          font: {
            family: "'Courier New', monospace",
            size: 11,
          },
          callback: function(value) {
            return value.toFixed(0)
          },
        },
      },
    },
  }
})

function exportCSV() {
  // Clear previous validation errors
  exportValidationError.value = ''

  // Validate zelid exists
  const zelidauth = localStorage.getItem('zelidauth')
  if (!zelidauth) {
    exportValidationError.value = 'Authentication not found'
    return
  }

  const params = new URLSearchParams(zelidauth)
  const extractedZelid = params.get('zelid')

  if (!extractedZelid || !extractedZelid.trim()) {
    exportValidationError.value = 'Invalid authentication data'
    return
  }

  const headers = ['Date', 'App Name', 'Type', 'Amount (FLUX)', 'Transaction ID', 'Block Height']
  const rows = [headers.join(',')]

  // Filter transactions based on selected period
  const now = new Date()
  let cutoffDate
  let endDate

  if (exportPeriod.value === 'custom') {
    // Custom date range
    if (!exportCustomStartDate.value || !exportCustomEndDate.value) {
      exportValidationError.value = 'Please select both start and end dates'
      return
    }
    cutoffDate = new Date(exportCustomStartDate.value)
    endDate = new Date(exportCustomEndDate.value)

    // Validate that start date is before end date
    if (cutoffDate > endDate) {
      exportValidationError.value = 'Start date must be before end date'
      return
    }

    endDate.setHours(23, 59, 59, 999) // Include full end date
  } else {
    switch (exportPeriod.value) {
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '365d':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'all':
      default:
        cutoffDate = null
        break
    }
  }

  // Export directly from transactions array (excluding free updates)
  transactions.value.forEach(tx => {
    const txDate = new Date(tx.timestamp)

    // Skip if transaction is outside the selected period
    if (cutoffDate && txDate < cutoffDate) {
      return
    }

    // For custom range, also check end date
    if (endDate && txDate > endDate) {
      return
    }

    // Skip free updates from export
    if (isFreeUpdate(tx)) {
      return
    }

    const appName = tx.appSpecifications?.name || 'Unknown'
    const amountFlux = (tx.valueSat || 0) / 100000000

    rows.push([
      `"${formatDate(tx.timestamp)}"`,
      `"${appName}"`,
      tx.type,
      amountFlux.toFixed(8),
      tx.txid,
      tx.height,
    ].join(','))
  })

  // Check if there are any transactions to export (only headers means no data)
  if (rows.length === 1) {
    exportValidationError.value = t('pages.billing.noTransactionsFound')
    return
  }

  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const periodLabel = exportPeriod.value === 'custom'
    ? `${exportCustomStartDate.value}_${exportCustomEndDate.value}`
    : exportPeriod.value
  a.download = `billing-export-${extractedZelid}-${periodLabel}-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)

  // Close dialog
  exportDialogOpen.value = false
}

onMounted(() => {
  fetchPaymentHistory()
})

useSEO({
  title: 'App Payments & Billing - FluxCloud',
  description: 'Track your Flux app payments and billing history',
  url: 'https://cloud.runonflux.com/billing/payments',
})
</script>

<style scoped>
/* Card hover effects - Cyberpunk style */
.v-card.v-card--hover {
  transition: all 0.3s ease;
  position: relative;
}

.v-card.v-card--hover:hover {
  transform: translateY(-4px);
  transition: all 0.3s ease;
  box-shadow:
    0 0 20px rgba(0, 255, 255, 0.3),
    0 0 40px rgba(0, 255, 255, 0.2),
    0 8px 24px rgba(0, 0, 0, 0.3) !important;
  border-color: rgb(0, 255, 255) !important;
  border-width: 2px !important;
}

/* Table header backgrounds */
:deep(.v-data-table thead th) {
  background: linear-gradient(135deg, rgba(100, 100, 100, 0.08) 0%, rgba(80, 80, 80, 0.12) 100%) !important;
  backdrop-filter: blur(10px);
}

/* Chart hover effects */
.donut-chart {
  transition: transform 0.3s ease;
  cursor: pointer;
}

.chart-container:hover .donut-chart {
  transform: scale(1.05);
}

.chart-segment {
  transition: opacity 0.3s ease, stroke-width 0.3s ease;
  cursor: pointer;
}

.chart-segment:hover {
  opacity: 0.6 !important;
  stroke-width: 22;
}

.chart-segment-reg:hover ~ circle {
  opacity: 0.15 !important;
}

.chart-segment-upd:hover {
  opacity: 0.6 !important;
  stroke-width: 22;
}

/* Border top utility */
.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Table borders */
.bordered-table {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

:deep(.bordered-table .v-table__wrapper) {
  border-radius: 4px;
  overflow-x: auto;
  /* Custom scrollbar styling - Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-on-surface), 0.5) rgba(var(--v-theme-on-surface), 0.1);
}

/* Webkit scrollbar styling */
:deep(.bordered-table .v-table__wrapper::-webkit-scrollbar) {
  height: 10px;
}

:deep(.bordered-table .v-table__wrapper::-webkit-scrollbar-track) {
  background: rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 5px;
  margin: 0 8px;
}

:deep(.bordered-table .v-table__wrapper::-webkit-scrollbar-thumb) {
  background: rgba(var(--v-theme-on-surface), 0.5) !important;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: default;
}

:deep(.bordered-table .v-table__wrapper::-webkit-scrollbar-thumb:hover) {
  background: rgba(var(--v-theme-on-surface), 0.5) !important;
  border-radius: 5px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  cursor: default !important;
}

:deep(.bordered-table th),
:deep(.bordered-table td) {
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep(.bordered-table th:last-child),
:deep(.bordered-table td:last-child) {
  border-right: none;
}

/* Billing Chart Styles - Terminal FluxTracker theme */
.billing-chart-container.terminal-border {
  background: var(--v-theme-surface);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.billing-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.billing-chart-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.billing-chart-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--v-theme-on-surface);
}

.billing-chart-subtitle {
  font-size: 0.875rem;
  opacity: 0.7;
  margin: 0;
  font-family: 'Courier New', monospace;
  color: var(--v-theme-on-surface);
}

.billing-chart-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.billing-control-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.billing-control-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  opacity: 0.7;
  font-weight: 500;
}

/* Terminal-style VSelect */
.billing-chart-select.terminal-select :deep(.v-field) {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  transition: all 0.2s ease;
}

.billing-chart-select.terminal-select :deep(.v-field__input) {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  padding-top: 2px;
  padding-bottom: 2px;
  min-height: 28px;
}

.billing-chart-select.terminal-select :deep(.v-field:hover) {
  border-color: rgb(var(--v-theme-primary));
}

.billing-chart-select.terminal-select :deep(.v-field--focused) {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 10px rgba(var(--v-theme-primary), 0.2);
}

/* App filter select - wider for app names */
.billing-chart-select.app-filter-select {
  min-width: 200px;
}

.billing-chart-select.app-filter-select :deep(.v-field__clearable) {
  display: flex !important;
  opacity: 1 !important;
}

/* Smaller font in dropdown list */
.billing-chart-select.app-filter-select :deep(.v-list-item-title) {
  font-size: 0.75rem !important;
}

.billing-chart-select.app-filter-select :deep(.v-list-item) {
  min-height: 32px !important;
  padding-block: 4px !important;
}

/* Target the overlay menu directly */
.v-overlay :has(.app-filter-select) .v-list-item-title {
  font-size: 0.75rem !important;
}

.v-overlay :has(.app-filter-select) .v-list-item {
  min-height: 32px !important;
  padding-block: 4px !important;
}

/* Remove autocomplete highlight and suggestion */
.billing-chart-select.app-filter-select :deep(.v-autocomplete__selection-text) {
  display: none !important;
}

.billing-chart-select.app-filter-select :deep(.v-autocomplete__selection) {
  opacity: 0 !important;
  display: none !important;
}

/* Remove text highlighting in dropdown */
.billing-chart-select.app-filter-select :deep(.v-list-item__content mark) {
  background-color: transparent !important;
  color: inherit !important;
  font-weight: normal !important;
}

/* Hide autocomplete suggestion overlay */
.billing-chart-select.app-filter-select :deep(.v-field__overlay) {
  display: none !important;
}

.billing-chart-select.app-filter-select :deep(.v-autocomplete__content) {
  display: none !important;
}

.billing-chart-select.app-filter-select :deep(.v-field__input::placeholder) {
  opacity: 0.7;
}

/* Category Pills - FluxTracker style */
.billing-category-pills {
  display: flex;
  column-gap: 0.5rem;
  row-gap: 0.25rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 599px) {
  .billing-category-pills {
    flex-wrap: nowrap;
  }

  .billing-category-pill {
    flex: 1 1 0;
    min-width: 0;
    justify-content: center;
    padding: 0.25rem 0.25rem;
  }

  .billing-category-label {
    font-size: 0.6rem !important;
    letter-spacing: 0 !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

}

.billing-category-pill {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: var(--v-theme-on-surface);
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.2s ease;
}

.billing-category-pill:hover {
  border-color: var(--category-color);
  background: color-mix(in srgb, var(--category-color) 10%, transparent);
}

.billing-category-pill.active {
  border-color: var(--category-color);
  background: color-mix(in srgb, var(--category-color) 20%, transparent);
  box-shadow: 0 0 10px var(--category-color);
}

.billing-category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.billing-category-pill:hover .billing-category-icon {
  transform: scale(1.05);
}

.billing-category-pill.active .billing-category-icon {
  filter: drop-shadow(0 0 5px var(--category-color));
}

.billing-category-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.billing-chart-wrapper {
  height: 400px;
  position: relative;
  overflow: visible !important;
}

/* Ensure VCard allows overflow for tooltips */
.billing-chart-container :deep(.v-card-text) {
  overflow: visible !important;
}

.billing-chart-container {
  overflow: visible !important;
}

/* Custom Tooltip Styles */
:deep(.chartjs-tooltip) {
  font-family: 'Courier New', monospace !important;
  font-size: 12px !important;
  z-index: 9999 !important;
  pointer-events: none !important;
}

:deep(.chartjs-tooltip div) {
  line-height: 1.4 !important;
}

@media (max-width: 599px) {
  :deep(.bordered-table .v-data-table-footer__items-per-page > span) {
    display: none;
  }
}

@media (max-width: 768px) {
  .billing-chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .billing-chart-controls {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .billing-control-group {
    flex: 1;
    min-width: 120px;
  }

  .billing-chart-select {
    width: 100%;
  }

  .billing-chart-wrapper {
    height: 300px;
  }
}

/* Sticky table header */
:deep(.bordered-table .v-data-table-footer__items-per-page) {
  order: -1;
  margin-right: auto;
  margin-left: 1rem;
}

:deep(.bordered-table thead) {
  position: sticky;
  top: 0;
  z-index: 100;
}

:deep(.bordered-table thead th) {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Flatpickr custom styling */
.flatpickr-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 4px;
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface)) !important;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

/* Ensure selected date text is grey */
.flatpickr-input:not(:placeholder-shown) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.flatpickr-input.active {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.flatpickr-input::placeholder {
  color: rgba(var(--v-theme-on-surface), 0.5) !important;
  font-weight: 400;
}

.flatpickr-input:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.flatpickr-input:focus {
  outline: none;
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.1);
}

/* Stat cards in transaction dialog */
.stat-card {
  border-radius: 8px;
  border: 1px solid;
}

.stat-card--secondary {
  background-color: rgba(var(--v-theme-secondary), 0.06);
  border-color: rgba(var(--v-theme-secondary), 0.2);
}

.stat-card--info {
  background-color: rgba(var(--v-theme-info), 0.06);
  border-color: rgba(var(--v-theme-info), 0.2);
}

.stat-card--success {
  background-color: rgba(var(--v-theme-success), 0.06);
  border-color: rgba(var(--v-theme-success), 0.2);
}

.stat-card--warning {
  background-color: rgba(var(--v-theme-warning), 0.06);
  border-color: rgba(var(--v-theme-warning), 0.2);
}

/* Export dialog radio button styling */
.export-radio-group :deep(.v-label) {
  font-size: 0.8125rem !important;
}
</style>

<style>
/* App filter dropdown - scoped via :has() to avoid affecting other menus */
.v-overlay:has(.app-filter-select) .v-list-item-title {
  font-size: 0.75rem !important;
}

.v-overlay:has(.app-filter-select) .v-list-item {
  min-height: 32px !important;
  padding-block: 4px !important;
}

/* Flatpickr calendar popup theming - Force theme awareness */
.flatpickr-calendar,
.flatpickr-calendar.open,
.flatpickr-calendar.inline {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  font-size: 13px !important;
}

.flatpickr-months,
.flatpickr-months .flatpickr-month {
  background: rgba(var(--v-theme-primary), 0.1) !important;
}

.flatpickr-current-month .flatpickr-monthDropdown-months,
.flatpickr-current-month input.cur-year,
.flatpickr-current-month .numInputWrapper input {
  color: rgb(var(--v-theme-on-surface)) !important;
  font-size: 13px !important;
  background: transparent !important;
}

.flatpickr-weekday {
  color: rgb(var(--v-theme-on-surface)) !important;
  opacity: 0.7;
  font-size: 12px !important;
}

.flatpickr-day {
  color: rgb(var(--v-theme-on-surface)) !important;
  font-size: 13px !important;
  line-height: 32px !important;
  height: 32px !important;
}

.flatpickr-day:hover,
.flatpickr-day:focus {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
}

.flatpickr-day.selected,
.flatpickr-day.selected:hover {
  background: rgb(var(--v-theme-primary)) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}

.flatpickr-day.today {
  border-color: rgb(var(--v-theme-primary)) !important;
}

.flatpickr-day.today:hover {
  background: rgba(var(--v-theme-primary), 0.2) !important;
}

.flatpickr-months .flatpickr-prev-month svg,
.flatpickr-months .flatpickr-next-month svg {
  fill: rgb(var(--v-theme-on-surface)) !important;
}

.flatpickr-months .flatpickr-prev-month:hover svg,
.flatpickr-months .flatpickr-next-month:hover svg {
  fill: rgb(var(--v-theme-primary)) !important;
}

/* Additional overrides for disabled and other states */
.flatpickr-day.disabled,
.flatpickr-day.disabled:hover,
.flatpickr-day.prevMonthDay,
.flatpickr-day.nextMonthDay {
  color: rgba(var(--v-theme-on-surface), 0.3) !important;
}

.flatpickr-day.inRange {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  border-color: rgba(var(--v-theme-primary), 0.1) !important;
  box-shadow: none !important;
}

.flatpickr-day.startRange,
.flatpickr-day.endRange {
  background: rgb(var(--v-theme-primary)) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}

.flatpickr-time {
  background: rgb(var(--v-theme-surface)) !important;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}

.flatpickr-time input {
  color: rgb(var(--v-theme-on-surface)) !important;
  background: transparent !important;
}

/* Custom scrollbar styling for apps list */
.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-on-surface), 0.5) rgba(var(--v-theme-on-surface), 0.1);
}

.custom-scroll::-webkit-scrollbar {
  width: 10px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 5px;
  margin: 0 8px;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.5) !important;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: default;
}

.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.5) !important;
  border-radius: 5px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  cursor: default !important;
}
</style>
