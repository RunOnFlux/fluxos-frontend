<template>
  <VCard class="deployment-choice-section">
    <VCardText>
      <h2 class="section-title">
        {{ t('pages.apps.register.orbit.choice.title') }}
      </h2>
      <p class="section-subtitle">
        {{ t('pages.apps.register.orbit.choice.subtitle') }}
      </p>

      <div class="deployment-options">
        <!-- Orbit Option -->
        <div
          class="deployment-card orbit-card"
          :class="{ 'selected': selectedMethod === 'orbit' }"
          @click="selectMethod('orbit')"
        >
          <div class="card-badge">
            <VChip color="success" size="small" variant="flat">
              {{ t('pages.apps.register.orbit.choice.newBadge') }}
            </VChip>
            <VChip color="warning" size="small" variant="flat">
              {{ t('pages.apps.register.orbit.choice.betaBadge') }}
            </VChip>
          </div>

          <div class="card-icon">
            <VIcon size="56" color="primary">mdi-rocket-launch</VIcon>
          </div>

          <h3 class="card-title">
            <span class="orbit-logo">Orbit</span>
          </h3>
          <p class="card-subtitle">{{ t('pages.apps.register.orbit.choice.orbitSubtitle') }}</p>

          <p class="card-description">
            {{ t('pages.apps.register.orbit.choice.orbitDescription') }}
          </p>

          <div class="card-features">
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check-circle</VIcon>
              <span>{{ t('pages.apps.register.orbit.choice.orbitFeature1') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check-circle</VIcon>
              <span>{{ t('pages.apps.register.orbit.choice.orbitFeature2') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check-circle</VIcon>
              <span>{{ t('pages.apps.register.orbit.choice.orbitFeature3') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check-circle</VIcon>
              <span>{{ t('pages.apps.register.orbit.choice.orbitFeature4') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check-circle</VIcon>
              <span>{{ t('pages.apps.register.orbit.choice.orbitFeature5') }}</span>
            </div>
          </div>

          <!-- Orbit Pricing Preview -->
          <div class="pricing-preview">
            <div class="pricing-tiers three-tiers">
              <div class="tier free-tier">
                <span class="tier-name">{{ t('pages.apps.register.orbit.pricing.free') }}</span>
                <span class="tier-price">$0<small>/{{ t('common.labels.monthly') }}</small></span>
              </div>
              <div class="tier-divider"></div>
              <div class="tier standard-tier">
                <span class="tier-name">{{ t('pages.apps.register.orbit.pricing.developer') }}</span>
                <span class="tier-price">$2.38<small>/{{ t('common.labels.monthly') }}</small></span>
              </div>
              <div class="tier-divider"></div>
              <div class="tier pro-tier">
                <span class="tier-name">{{ t('pages.apps.register.orbit.pricing.pro') }}</span>
                <span class="tier-price">$3.80<small>/{{ t('common.labels.monthly') }}</small></span>
              </div>
            </div>
          </div>

          <VBtn
            color="primary"
            variant="flat"
            size="large"
            class="card-cta"
            :to="{ name: 'apps-register-orbit' }"
            @click.stop
          >
            <VIcon start>mdi-rocket-launch</VIcon>
            {{ t('pages.apps.register.orbit.choice.orbitCta') }}
          </VBtn>
        </div>

        <!-- Docker Option -->
        <div
          class="deployment-card docker-card"
          :class="{ 'selected': selectedMethod === 'docker' }"
          @click="selectMethod('docker')"
        >
          <div class="card-icon">
            <VIcon size="56" color="info">mdi-docker</VIcon>
          </div>

          <h3 class="card-title">Docker</h3>
          <p class="card-subtitle">{{ t('pages.apps.register.orbit.choice.dockerSubtitle') }}</p>

          <p class="card-description">
            {{ t('pages.apps.register.orbit.choice.dockerDescription') }}
          </p>

          <div class="card-features">
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check-circle</VIcon>
              <span>{{ t('pages.apps.register.orbit.choice.dockerFeature1') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check-circle</VIcon>
              <span>{{ t('pages.apps.register.orbit.choice.dockerFeature2') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check-circle</VIcon>
              <span>{{ t('pages.apps.register.orbit.choice.dockerFeature3') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check-circle</VIcon>
              <span>{{ t('pages.apps.register.orbit.choice.dockerFeature4') }}</span>
            </div>
            <div class="feature-item">
              <VIcon size="18" color="success">mdi-check-circle</VIcon>
              <span>{{ t('pages.apps.register.orbit.choice.dockerFeature5') }}</span>
            </div>
          </div>

          <!-- Docker Pricing Preview -->
          <div class="pricing-preview docker-pricing">
            <div class="docker-price">
              <span class="price-label">{{ t('pages.apps.register.orbit.choice.startingAt') }}</span>
              <span class="price-value">$0.99<small>/{{ t('common.labels.monthly') }}</small></span>
            </div>
          </div>

          <VBtn
            color="info"
            variant="flat"
            size="large"
            class="card-cta"
            :to="{ name: 'apps-register-configure' }"
            @click.stop
          >
            <VIcon start>mdi-docker</VIcon>
            {{ t('pages.apps.register.orbit.choice.dockerCta') }}
          </VBtn>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const selectedMethod = ref(null)

const selectMethod = method => {
  selectedMethod.value = method
}
</script>

<style scoped>
.deployment-choice-section {
  border-radius: 16px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
  overflow: visible;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  color: rgb(var(--v-theme-on-surface));
}

.section-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 2rem;
  opacity: 0.8;
}

.deployment-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.deployment-card {
  position: relative;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.deployment-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.deployment-card.selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.orbit-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.03) 0%, rgba(var(--v-theme-success), 0.03) 100%);
}

.orbit-card:hover,
.orbit-card.selected {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08) 0%, rgba(var(--v-theme-success), 0.08) 100%);
}

.card-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  display: flex;
  gap: 0.5rem;
}

.card-icon {
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 50%;
}

.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: rgb(var(--v-theme-on-surface));
}

.orbit-logo {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-success)) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-subtitle {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 1rem;
}

.card-description {
  font-size: 0.925rem;
  line-height: 1.6;
  color: rgba(var(--v-theme-on-surface), 0.8);
  margin-bottom: 1.5rem;
}

.card-features {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.pricing-preview {
  width: 100%;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.pricing-tiers {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.tier {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 1rem;
}

.tier-divider {
  width: 1px;
  height: 50px;
  background: rgba(var(--v-theme-on-surface), 0.2);
}

.tier-name {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 0.25rem;
}

.tier-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.tier-price small {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.7;
}

.tier-detail {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-top: 0.25rem;
}

.three-tiers {
  gap: 0.5rem;
}

.three-tiers .tier {
  padding: 0.5rem 0.75rem;
}

.free-tier .tier-price {
  color: rgb(var(--v-theme-success));
}

.standard-tier .tier-price {
  color: rgb(var(--v-theme-info));
}

.pro-tier .tier-price {
  color: rgb(var(--v-theme-primary));
}

.docker-pricing {
  text-align: center;
}

.docker-price {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.price-label {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 0.25rem;
}

.price-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-info));
}

.price-value small {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.7;
}

.price-detail {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-top: 0.25rem;
}

.card-cta {
  width: 100%;
  margin-top: auto;
}

/* Responsive */
@media (max-width: 960px) {
  .deployment-options {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .card-title {
    font-size: 1.5rem;
  }

  .deployment-card {
    padding: 1.5rem;
  }

  .pricing-tiers {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .three-tiers {
    flex-direction: column;
    gap: 0.75rem;
  }

  .three-tiers .tier {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    padding: 0.5rem 0;
  }

  .tier-divider {
    display: none;
  }

  .tier-price {
    font-size: 1.25rem;
  }
}

@media (max-width: 600px) {
  .section-title {
    font-size: 1.25rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }

  .deployment-card {
    padding: 1.25rem;
  }

  .card-icon {
    padding: 0.75rem;
  }

  .card-icon .v-icon {
    font-size: 40px !important;
  }

  .card-title {
    font-size: 1.25rem;
  }

  .card-badge {
    right: 12px;
    top: -10px;
  }

  .card-badge .v-chip {
    font-size: 0.65rem;
  }

  .card-description {
    font-size: 0.875rem;
  }

  .feature-item {
    font-size: 0.8rem;
  }

  .feature-item .v-icon {
    font-size: 16px !important;
  }

  .tier-name {
    font-size: 0.7rem;
  }

  .tier-price {
    font-size: 1.125rem;
  }

  .tier-price small {
    font-size: 0.65rem;
  }
}
</style>
