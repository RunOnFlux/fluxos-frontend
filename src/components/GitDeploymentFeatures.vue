<template>
  <VCard class="git-features-section">
    <VCardText>
      <!-- Git Deployment Features -->
      <div class="shared-features-card">
        <div class="shared-features-header">
          <div class="shared-features-title">
            <VIcon class="orbit-icon" color="primary">mdi-rocket-launch</VIcon>
            <h2>{{ t('pages.apps.register.orbit.pricing.sharedFeatures.title') }}</h2>
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

      <!-- Git Deployment Comparison Table -->
      <div class="orbit-comparison-card">
        <h3 class="comparison-title">
          <VIcon size="22" color="primary" class="mr-2">mdi-chart-bar</VIcon>
          {{ t('pages.apps.register.orbit.comparison.title') }}
        </h3>
        <p class="comparison-subtitle">{{ t('pages.apps.register.orbit.comparison.subtitle') }}</p>

        <div class="orbit-comparison-table-wrapper">
          <table class="orbit-comparison-table">
            <thead>
              <tr>
                <th class="provider-col">{{ t('pages.apps.register.orbit.comparison.provider') }}</th>
                <th class="plan-col">{{ t('pages.apps.register.orbit.comparison.plan') }}</th>
                <th class="price-col">{{ t('pages.apps.register.orbit.comparison.price') }}</th>
                <th class="cpu-col">{{ t('pages.apps.register.orbit.comparison.cpu') }}</th>
                <th class="ram-col">{{ t('pages.apps.register.orbit.comparison.ram') }}</th>
                <th class="builds-col">{{ t('pages.apps.register.orbit.comparison.builds') }}</th>
              </tr>
            </thead>
            <tbody>
              <!-- Orbit Row - Highlighted -->
              <tr class="orbit-row highlight-row">
                <td class="provider-col">
                  <div class="provider-cell-inner">
                    <VIcon size="20" color="primary">mdi-rocket-launch</VIcon>
                    <span class="provider-name">FluxCloud Git</span>
                    <VChip size="x-small" color="success" variant="flat" class="ml-1">{{ t('pages.apps.register.orbit.comparison.best') }}</VChip>
                  </div>
                </td>
                <td class="plan-col">Standard</td>
                <td class="price-col highlight-price">$2.49/{{ t('common.labels.monthly') }}</td>
                <td class="cpu-col">1.5 {{ t('pages.apps.register.orbit.comparison.cores') }}</td>
                <td class="ram-col">4 GB</td>
                <td class="builds-col">
                  <VIcon size="16" color="success" class="mr-1">mdi-infinity</VIcon>
                  {{ t('pages.apps.register.orbit.comparison.unlimited') }}
                </td>
              </tr>
              <!-- Vercel Row -->
              <tr>
                <td class="provider-col">
                  <div class="provider-cell-inner">
                    <VIcon size="20">mdi-triangle</VIcon>
                    <span class="provider-name">Vercel</span>
                  </div>
                </td>
                <td class="plan-col">Pro</td>
                <td class="price-col competitor-price">$20/{{ t('common.labels.monthly') }}</td>
                <td class="cpu-col">{{ t('pages.apps.register.orbit.comparison.shared') }}</td>
                <td class="ram-col">{{ t('pages.apps.register.orbit.comparison.shared') }}</td>
                <td class="builds-col">{{ t('pages.apps.register.orbit.comparison.limited') }}</td>
              </tr>
              <!-- Netlify Row -->
              <tr>
                <td class="provider-col">
                  <div class="provider-cell-inner">
                    <VIcon size="20">mdi-web</VIcon>
                    <span class="provider-name">Netlify</span>
                  </div>
                </td>
                <td class="plan-col">Pro</td>
                <td class="price-col competitor-price">$19/{{ t('common.labels.monthly') }}</td>
                <td class="cpu-col">{{ t('pages.apps.register.orbit.comparison.shared') }}</td>
                <td class="ram-col">{{ t('pages.apps.register.orbit.comparison.shared') }}</td>
                <td class="builds-col">{{ t('pages.apps.register.orbit.comparison.creditBased') }}</td>
              </tr>
              <!-- Render Row -->
              <tr>
                <td class="provider-col">
                  <div class="provider-cell-inner">
                    <VIcon size="20">mdi-server</VIcon>
                    <span class="provider-name">Render</span>
                  </div>
                </td>
                <td class="plan-col">Standard</td>
                <td class="price-col competitor-price">$25/{{ t('common.labels.monthly') }}</td>
                <td class="cpu-col">1 {{ t('pages.apps.register.orbit.comparison.core') }}</td>
                <td class="ram-col">2 GB</td>
                <td class="builds-col">500 {{ t('pages.apps.register.orbit.comparison.minutes') }}</td>
              </tr>
              <!-- Railway Row -->
              <tr>
                <td class="provider-col">
                  <div class="provider-cell-inner">
                    <VIcon size="20">mdi-train</VIcon>
                    <span class="provider-name">Railway</span>
                  </div>
                </td>
                <td class="plan-col">Hobby</td>
                <td class="price-col competitor-price">$5/{{ t('common.labels.monthly') }}</td>
                <td class="cpu-col">{{ t('pages.apps.register.orbit.comparison.usageBased') }}</td>
                <td class="ram-col">{{ t('pages.apps.register.orbit.comparison.usageBased') }}</td>
                <td class="builds-col">{{ t('pages.apps.register.orbit.comparison.usageBased') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="orbit-comparison-hint">
          <VIcon size="18" color="primary" class="mr-2">mdi-information-outline</VIcon>
          <span>{{ t('pages.apps.register.orbit.choice.comparisonHint') }}</span>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.git-features-section {
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

.shared-features-card {
  margin-bottom: 2rem;
}

.shared-features-header {
  text-align: center;
  margin-bottom: 2rem;
}

.shared-features-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.shared-features-title h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}

.orbit-icon {
  font-size: 2rem;
}

.shared-features-subtitle {
  font-size: 1rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0;
}

.shared-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.shared-feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.shared-feature-item .v-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.feature-name {
  font-weight: 600;
  font-size: 0.9375rem;
}

.feature-detail {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  line-height: 1.4;
}

/* Comparison Card */
.orbit-comparison-card {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.comparison-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.comparison-subtitle {
  text-align: center;
  font-size: 0.9375rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 1.5rem;
}

.orbit-comparison-table-wrapper {
  overflow-x: auto;
  margin-bottom: 1rem;
}

.orbit-comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.orbit-comparison-table th,
.orbit-comparison-table td {
  padding: 0.75rem 1rem;
  text-align: center;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.orbit-comparison-table th {
  background: rgba(var(--v-theme-primary), 0.1);
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.orbit-comparison-table .provider-col {
  text-align: left;
}

.provider-cell-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.provider-name {
  font-weight: 500;
}

.highlight-row {
  background: rgba(var(--v-theme-primary), 0.08);
}

.highlight-price {
  color: rgb(var(--v-theme-success));
  font-weight: 700;
}

.competitor-price {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.orbit-comparison-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  padding-top: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .shared-features-title h2 {
    font-size: 1.5rem;
  }

  .shared-features-grid {
    grid-template-columns: 1fr;
  }

  .orbit-comparison-table {
    font-size: 0.8125rem;
  }

  .orbit-comparison-table th,
  .orbit-comparison-table td {
    padding: 0.5rem;
  }
}
</style>
