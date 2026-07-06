<template>
  <div class="simple-deploy">
    <!-- Header + mode toggle -->
    <div class="sd-topbar">
      <div class="sd-brand">
        <div class="sd-badge">
          <VIcon size="22">mdi-rocket-launch-outline</VIcon>
        </div>
        <div>
          <h1 class="sd-title">{{ t('core.simpleDeploy.title') }}</h1>
          <p class="sd-subtitle">{{ t('core.simpleDeploy.subtitle') }}</p>
        </div>
      </div>
      <div class="sd-seg" role="tablist" :aria-label="t('core.simpleDeploy.mode')">
        <button type="button" class="on" role="tab" :aria-selected="true">{{ t('core.simpleDeploy.simple') }}</button>
        <button type="button" role="tab" :aria-selected="false" @click="$emit('advanced')">{{ t('core.simpleDeploy.advanced') }}</button>
      </div>
    </div>

    <p class="sd-import-line">
      {{ t('core.simpleDeploy.haveCompose') }}
      <a href="#" @click.prevent="$emit('import')">{{ t('core.simpleDeploy.importIt') }} →</a>
    </p>

    <!-- Container -->
    <section class="sd-card">
      <div class="sd-card-head">
        <VIcon class="sd-card-ic" size="18">mdi-package-variant-closed</VIcon>
        <h2>{{ t('core.simpleDeploy.container') }}</h2>
      </div>

      <div class="sd-field">
        <label class="sd-lbl" for="sd-image">{{ t('core.simpleDeploy.dockerImage') }}<span class="sd-req" :aria-label="t('core.simpleDeploy.required')">*</span></label>
        <VTextField
          id="sd-image"
          v-model="image"
          class="sd-mono"
          density="comfortable"
          variant="outlined"
          hide-details
          placeholder="ghcr.io/acme/web-api:latest"
          spellcheck="false"
        />
        <div class="sd-hint">{{ t('core.simpleDeploy.dockerImageHint') }}</div>
      </div>

      <div class="sd-toggle-row">
        <div class="sd-toggle-txt">
          <b>{{ t('core.simpleDeploy.privateImage') }}</b>
          <span>{{ t('core.simpleDeploy.privateImageHint') }}</span>
        </div>
        <VSwitch v-model="isPrivate" color="primary" hide-details density="compact" inset />
      </div>

      <VExpandTransition>
        <div v-if="isPrivate" class="sd-creds">
          <VTextField
            v-model="repoauth"
            class="sd-mono"
            density="comfortable"
            variant="outlined"
            hide-details
            :label="t('core.subscriptionManager.repositoryAuthentication')"
            :placeholder="t('core.subscriptionManager.dockerAuthPlaceholder')"
            spellcheck="false"
          >
            <template #prepend-inner>
              <VMenu open-on-hover :close-on-content-click="false" location="bottom start" offset="6" max-width="400">
                <template #activator="{ props: menuProps }">
                  <VIcon v-bind="menuProps" size="20" color="grey" style="cursor: help">mdi-lock-question</VIcon>
                </template>
                <VCard class="repoauth-help pa-3">
                  <div class="text-caption mb-2">{{ t('core.simpleDeploy.repoauthTooltipBasic') }}</div>
                  <div class="repoauth-ex mb-3">
                    <code>username:password</code>
                    <VBtn icon size="x-small" variant="text" :aria-label="t('core.simpleDeploy.copy')" @click="copyText('username:password')">
                      <VIcon size="15">{{ copied === 'username:password' ? 'mdi-check' : 'mdi-content-copy' }}</VIcon>
                    </VBtn>
                  </div>
                  <div class="text-caption mb-2">{{ t('core.simpleDeploy.repoauthTooltipCloud') }}</div>
                  <div class="repoauth-ex">
                    <code>{{ awsExample }}</code>
                    <VBtn icon size="x-small" variant="text" :aria-label="t('core.simpleDeploy.copy')" @click="copyText(awsExample)">
                      <VIcon size="15">{{ copied === awsExample ? 'mdi-check' : 'mdi-content-copy' }}</VIcon>
                    </VBtn>
                  </div>
                </VCard>
              </VMenu>
            </template>
          </VTextField>
        </div>
      </VExpandTransition>

      <!-- Private image → app registered as Enterprise (encrypted) -->
      <VAlert
        v-if="isPrivate"
        type="warning"
        variant="tonal"
        density="comfortable"
        icon="mdi-shield-lock"
        class="sd-enterprise-alert"
      >
        {{ t('core.simpleDeploy.privateImageEnterprise') }}
      </VAlert>

      <div class="sd-field sd-mt">
        <label class="sd-lbl" for="sd-name">{{ t('core.simpleDeploy.appName') }}<span class="sd-req" :aria-label="t('core.simpleDeploy.required')">*</span></label>
        <VTextField
          id="sd-name"
          v-model="appName"
          density="comfortable"
          variant="outlined"
          hide-details
          :placeholder="t('core.simpleDeploy.appNamePlaceholder')"
        />
        <div class="sd-hint">
          {{ t('core.simpleDeploy.appNameHint') }}
          <div v-if="freeDomain" class="sd-domain">
            <VIcon size="14">mdi-web</VIcon> https://{{ freeDomain }}
          </div>
        </div>
      </div>

      <div class="sd-field sd-mt">
        <label class="sd-lbl" for="sd-contact">{{ t('core.simpleDeploy.contactEmail') }}<span class="sd-req" :aria-label="t('core.simpleDeploy.required')">*</span></label>
        <VTextField
          id="sd-contact"
          v-model="contactEmail"
          density="comfortable"
          variant="outlined"
          hide-details
          type="email"
          :disabled="isSso"
          :append-inner-icon="isSso ? 'mdi-lock-outline' : undefined"
        />
        <div class="sd-hint">{{ isSso ? t('core.simpleDeploy.contactSsoHint') : t('core.simpleDeploy.contactHint') }}</div>
      </div>
    </section>

    <!-- Networking -->
    <section class="sd-card">
      <div class="sd-card-head">
        <VIcon class="sd-card-ic" size="18">mdi-web</VIcon>
        <h2>{{ t('core.simpleDeploy.networking') }}</h2>
      </div>
      <div class="sd-field">
        <label class="sd-lbl" for="sd-port">{{ t('core.simpleDeploy.appPort') }}<span class="sd-req" :aria-label="t('core.simpleDeploy.required')">*</span></label>
        <VTextField
          id="sd-port"
          v-model.number="port"
          density="comfortable"
          variant="outlined"
          hide-details
          type="number"
          inputmode="numeric"
          style="max-width: 180px"
        />
        <div class="sd-hint">{{ t('core.simpleDeploy.appPortHint') }}</div>
      </div>
    </section>

    <!-- Environment variables -->
    <section class="sd-card">
      <div class="sd-card-head">
        <VIcon class="sd-card-ic" size="18">mdi-application-variable-outline</VIcon>
        <h2>{{ t('core.simpleDeploy.envVars') }}</h2>
        <span class="sd-tag">{{ t('core.simpleDeploy.optional') }}</span>
      </div>

      <div v-if="envRows.length" class="sd-env-list">
        <div v-for="(row, i) in envRows" :key="i" class="sd-env-row">
          <VTextField
            v-model="row.key"
            density="comfortable"
            variant="outlined"
            hide-details
            :placeholder="t('core.simpleDeploy.envKeyPlaceholder')"
            class="sd-env-key"
            spellcheck="false"
          />
          <span class="sd-env-eq">=</span>
          <VTextField
            v-model="row.value"
            density="comfortable"
            variant="outlined"
            hide-details
            :placeholder="t('core.simpleDeploy.envValuePlaceholder')"
            class="sd-env-val"
            spellcheck="false"
          />
          <VBtn icon variant="text" size="small" color="error" :aria-label="t('core.simpleDeploy.remove')" @click="removeEnvRow(i)">
            <VIcon size="18">mdi-close</VIcon>
          </VBtn>
        </div>
      </div>

      <VBtn variant="tonal" size="small" prepend-icon="mdi-plus" @click="addEnvRow">
        {{ t('core.simpleDeploy.addVariable') }}
      </VBtn>

      <!-- Secret-looking env vars → app registered as Enterprise (encrypted) -->
      <VAlert
        v-if="hasSecrets"
        type="warning"
        variant="tonal"
        density="comfortable"
        icon="mdi-shield-lock"
        class="sd-enterprise-alert"
      >
        {{ t('core.simpleDeploy.secretsDetected', { keys: secretKeys.join(', ') }) }}
      </VAlert>
    </section>

    <!-- Power -->
    <section class="sd-card">
      <div class="sd-card-head">
        <VIcon class="sd-card-ic" size="18">mdi-chart-bar</VIcon>
        <h2>{{ t('core.simpleDeploy.power') }}</h2>
        <span class="sd-tag">{{ t('core.simpleDeploy.perCopy') }}</span>
      </div>

      <div class="sd-res">
        <div class="sd-res-meta">
          <div class="sd-res-name">{{ t('core.simpleDeploy.cpu') }}</div>
          <div class="sd-res-anchor">{{ t('core.simpleDeploy.cpuAnchor') }}</div>
        </div>
        <VSlider v-model="cpu" :min="0.5" :max="15" :step="0.5" hide-details color="primary" class="sd-slider" />
        <div class="sd-res-val">{{ cpu }} {{ t('core.simpleDeploy.vcpu') }}</div>
      </div>

      <div class="sd-res">
        <div class="sd-res-meta">
          <div class="sd-res-name">{{ t('core.simpleDeploy.memory') }}</div>
          <div class="sd-res-anchor">{{ t('core.simpleDeploy.memoryAnchor') }}</div>
        </div>
        <VSlider v-model="ramMb" :min="500" :max="59000" :step="500" hide-details color="primary" class="sd-slider" />
        <div class="sd-res-val">{{ ramGb }} {{ t('core.simpleDeploy.gb') }}</div>
      </div>

      <div class="sd-res">
        <div class="sd-res-meta">
          <div class="sd-res-name">{{ t('core.simpleDeploy.disk') }}</div>
          <div class="sd-res-anchor">{{ t('core.simpleDeploy.diskAnchor') }}</div>
        </div>
        <VSlider v-model="hdd" :min="1" :max="820" :step="1" hide-details color="primary" class="sd-slider" />
        <div class="sd-res-val">{{ hdd }} {{ t('core.simpleDeploy.gb') }}</div>
      </div>

      <div class="sd-res-foot">
        <span class="sd-dot"></span>
        <span>{{ powerAnchor }}</span>
      </div>
    </section>

    <!-- Persistent storage -->
    <section class="sd-card">
      <div class="sd-card-head">
        <VIcon class="sd-card-ic" size="18">mdi-database-outline</VIcon>
        <h2>{{ t('core.simpleDeploy.storage') }}</h2>
      </div>

      <div class="sd-toggle-row">
        <div class="sd-toggle-txt">
          <b>{{ t('core.simpleDeploy.storeData') }}</b>
          <span>{{ t('core.simpleDeploy.storeDataHint') }}</span>
        </div>
        <VSwitch v-model="storeData" color="primary" hide-details density="compact" inset />
      </div>

      <VExpandTransition>
        <div v-if="storeData">
          <div class="sd-field sd-mt">
            <label class="sd-lbl" for="sd-datapath">{{ t('core.simpleDeploy.dataPath') }}<span class="sd-req" :aria-label="t('core.simpleDeploy.required')">*</span></label>
            <VTextField
              id="sd-datapath"
              v-model="dataPath"
              class="sd-mono"
              density="comfortable"
              variant="outlined"
              hide-details
              placeholder="/data"
              prepend-inner-icon="mdi-folder-outline"
              spellcheck="false"
            />
            <div class="sd-hint">{{ t('core.simpleDeploy.dataPathHint') }}</div>
          </div>

          <div class="sd-toggle-row sd-mt">
            <div class="sd-toggle-txt">
              <b>{{ t('core.simpleDeploy.replicate') }}</b>
              <span>{{ t('core.simpleDeploy.replicateHint') }}</span>
            </div>
            <VSwitch v-model="replicate" color="primary" hide-details density="compact" inset />
          </div>

          <VAlert v-if="replicate" type="info" variant="tonal" density="comfortable" icon="mdi-content-copy" class="sd-mt">
            {{ t('core.simpleDeploy.replicateNote', { count: Math.max(2, instances) }) }}
          </VAlert>
        </div>
      </VExpandTransition>
    </section>

    <!-- Reliability -->
    <section class="sd-card">
      <div class="sd-card-head">
        <VIcon class="sd-card-ic" size="18">mdi-shield-check-outline</VIcon>
        <h2>{{ t('core.simpleDeploy.reliability') }}</h2>
      </div>
      <div class="sd-reliability">
        <div class="sd-reliability-txt">
          <div class="sd-reliability-name">{{ t('core.simpleDeploy.copies') }}</div>
          <div class="sd-hint sd-mt-xs">{{ reliabilityNote }}</div>
        </div>
        <div class="sd-stepper">
          <VBtn variant="text" size="small" icon :disabled="instances <= minInstances" :aria-label="t('core.simpleDeploy.fewer')" @click="stepInstances(-1)">
            <VIcon>mdi-minus</VIcon>
          </VBtn>
          <div class="sd-stepper-n">{{ instances }}</div>
          <VBtn variant="text" size="small" icon :aria-label="t('core.simpleDeploy.more')" @click="stepInstances(1)">
            <VIcon>mdi-plus</VIcon>
          </VBtn>
        </div>
      </div>
    </section>

    <!-- Location -->
    <section class="sd-card">
      <div class="sd-card-head">
        <VIcon class="sd-card-ic" size="18">mdi-earth</VIcon>
        <h2>{{ t('core.simpleDeploy.location') }}</h2>
        <span class="sd-tag">{{ t('core.simpleDeploy.optional') }}</span>
      </div>

      <VAlert v-if="geoComplex" type="info" variant="tonal" density="comfortable" icon="mdi-tune">
        {{ t('core.simpleDeploy.geoComplex') }}
      </VAlert>

      <template v-else>
        <div class="sd-toggle-row">
          <div class="sd-toggle-txt">
            <b>{{ t('core.simpleDeploy.restrictLocation') }}</b>
            <span>{{ t('core.simpleDeploy.restrictLocationHint') }}</span>
          </div>
          <VSwitch v-model="restrictLocation" color="primary" hide-details density="compact" inset />
        </div>

        <VExpandTransition>
          <div v-if="restrictLocation" class="sd-mt">
            <div class="sd-continents">
              <button
                v-for="c in CONTINENTS"
                :key="c.code"
                type="button"
                class="sd-cont-btn"
                :class="{ on: selectedContinents.includes(c.code) }"
                @click="toggleContinent(c.code)"
              >
                {{ c.name }}
              </button>
            </div>
            <div class="sd-hint sd-mt-xs">{{ t('core.simpleDeploy.restrictNote') }}</div>
          </div>
        </VExpandTransition>
      </template>
    </section>

    <!-- Checkout -->
    <section class="sd-checkout">
      <!-- Subscription period -->
      <div class="sd-period">
        <div class="sd-period-lbl">{{ t('core.simpleDeploy.period') }}</div>
        <div class="sd-period-opts">
          <button
            v-for="p in PERIODS"
            :key="p.blocks"
            type="button"
            class="sd-period-btn"
            :class="{ on: period === p.blocks }"
            @click="period = p.blocks"
          >
            {{ t('core.subscriptionManager.' + p.labelKey) }}
            <span v-if="p.discount" class="sd-period-disc">−{{ p.discount }}%</span>
          </button>
        </div>
      </div>

      <div class="sd-price-row">
        <div>
          <div class="sd-price-lbl">{{ t('core.simpleDeploy.estimatedCost') }}</div>
          <div class="sd-price-num">
            <template v-if="priceEstimate">${{ priceEstimate.usd }} <small>{{ t('core.simpleDeploy.perPeriod') }}</small></template>
            <template v-else-if="priceEstimating">{{ t('core.simpleDeploy.estimating') }}</template>
            <template v-else><span class="sd-price-dash">—</span></template>
          </div>
          <div class="sd-price-sub">{{ priceSub }}</div>
        </div>
        <div v-if="priceEstimate || priceEstimating" class="sd-price-chip">
          <span class="sd-dot"></span> {{ t('core.simpleDeploy.liveEstimate') }}
        </div>
      </div>

      <VCheckbox v-model="tosAccepted" hide-details density="compact" class="sd-tos">
        <template #label>
          <span class="sd-tos-lbl">
            {{ t('core.simpleDeploy.tosPrefix') }}
            <a href="#" @click.stop.prevent="showTos = true">{{ t('core.simpleDeploy.tosLink') }}</a>
          </span>
        </template>
      </VCheckbox>

      <VBtn
        class="sd-deploy"
        block
        size="large"
        :disabled="!canDeploy"
        append-icon="mdi-arrow-right"
        @click="onDeploy"
      >
        {{ t('core.simpleDeploy.reviewDeploy') }}
      </VBtn>

      <div class="sd-advanced">
        {{ t('core.simpleDeploy.advancedNeeds') }}
        <a href="#" @click.prevent="$emit('advanced')">{{ t('core.simpleDeploy.openAdvanced') }}</a>
      </div>
    </section>

    <!-- Same Terms of Service dialog used by Advanced mode -->
    <TosDialog
      v-model="showTos"
      :title="t('core.subscriptionManager.tos.dialogTitle')"
      :agree-text="t('core.subscriptionManager.tos.agree')"
      :disagree-text="t('core.subscriptionManager.tos.disagree')"
      @agree="onAgreeTos"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getUser } from '@/utils/firebase'
import { detectSecretEnvVars } from '@/utils/detectSecrets'

const props = defineProps({
  // The shared, mutable app specification (version 8, compose format).
  spec: { type: Object, required: true },
})

const emit = defineEmits(['deploy', 'advanced', 'import'])

const { t } = useI18n()

// --- Live price estimate (reuses the shared composable) ------------------
const {
  estimate: priceEstimate,
  estimating: priceEstimating,
  requestEstimate: requestPriceEstimate,
} = usePriceEstimate()

// Convenience accessor for the (single) primary component.
function comp() {
  if (!props.spec.compose) props.spec.compose = [{}]
  if (!props.spec.compose[0]) props.spec.compose[0] = {}

  return props.spec.compose[0]
}

// --- Field bindings (mapped to the real spec) ----------------------------
const image = computed({
  get: () => comp().repotag || '',
  set: v => { comp().repotag = v },
})

// App name drives both the app-level name and the component name (single-component
// apps). It is user-provided, must be unique, and is used to build the free
// access domain. We keep it URL-safe (lowercase alphanumeric).
function slugify(v) {
  return (v || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

const appName = computed({
  get: () => props.spec.name || '',
  set: v => {
    const slug = slugify(v)
    props.spec.name = slug
    comp().name = slug
  },
})

// Preview of the free domain the app will be reachable at.
const freeDomain = computed(() => (appName.value ? `${appName.value}.app.runonflux.io` : ''))

const port = computed({
  get: () => comp().ports?.[0] ?? null,
  set: v => {
    const c = comp()
    if (v === '' || v === null || v === undefined || Number.isNaN(Number(v))) {
      c.ports = []
      c.containerPorts = []
      c.domains = []

      return
    }
    const p = Number(v)
    c.ports = [p]
    c.containerPorts = [p]
    c.domains = [c.domains?.[0] || '']
  },
})

const cpu = computed({
  get: () => comp().cpu ?? 1,
  set: v => { comp().cpu = v },
})

// The RAM slider works in MB (same min/max as Advanced mode; the backend caps
// an app at 59000 MB = the largest node tier's RAM available for apps) and
// displays GB. Flux uses 1 GB = 1000 MB (same convention as the cost calculator),
// so 2500 MB shows as 2.5 GB.
const ramMb = computed({
  get: () => comp().ram ?? 2000,
  set: v => { comp().ram = v },
})
const ramGb = computed(() => Math.round(((comp().ram ?? 2000) / 1000) * 10) / 10)

const hdd = computed({
  get: () => comp().hdd ?? 5,
  set: v => { comp().hdd = v },
})

const instances = computed({
  get: () => props.spec.instances ?? 1,
  set: v => { props.spec.instances = v },
})

// --- Persistent storage --------------------------------------------------
// containerData is always a persistent volume (sized by disk); here we let the
// user place it. "Replicate" uses the r: sync mode (the recommended one), which
// requires at least 2 instances. No store → mounted at /tmp (scratch, valid).
const storeData = ref(false)
const dataPath = ref('/data')
const replicate = ref(false)

const minInstances = computed(() => (replicate.value ? 2 : 1))

function loadStorage() {
  const cd = comp().containerData || ''
  const flagged = cd.match(/^([rgs]+):(.+)$/)
  if (cd && cd !== '/tmp') {
    storeData.value = true
    if (flagged) {
      replicate.value = true
      dataPath.value = flagged[2]
    } else {
      replicate.value = false
      dataPath.value = cd
    }
  } else {
    storeData.value = false
    comp().containerData = '/tmp'
  }
}

// Reflect the storage choices back into containerData.
watch([storeData, dataPath, replicate], () => {
  if (!storeData.value) {
    comp().containerData = '/tmp'

    return
  }
  const path = dataPath.value.trim() || '/data'
  comp().containerData = replicate.value ? `r:${path}` : path
})

// Replicated storage needs at least 2 instances (syncthing minimum).
watch(replicate, on => {
  if (on && (instances.value || 1) < 2) instances.value = 2
})

// --- Contact email (required; auto-filled & locked for SSO users) ---------
const loginType = ref(localStorage.getItem('loginType'))
const isSso = computed(() => loginType.value === 'sso')

const contactEmail = computed({
  get: () => props.spec.contacts?.[0] || '',
  set: v => { props.spec.contacts = v ? [v] : [] },
})

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '')
}

// --- Environment variables -----------------------------------------------
// Edited as key/value rows, stored in the spec as "KEY=value" strings.
const envRows = ref([])

function loadEnvRows() {
  const params = comp().environmentParameters || []
  envRows.value = params
    .filter(p => typeof p === 'string' && p.length > 0)
    .map(p => {
      const eq = p.indexOf('=')

      return { key: eq >= 0 ? p.slice(0, eq) : p, value: eq >= 0 ? p.slice(eq + 1) : '' }
    })
}

function serializeEnvRows() {
  comp().environmentParameters = envRows.value
    .filter(r => r.key.trim())
    .map(r => `${r.key.trim()}=${r.value}`)
}

function addEnvRow() {
  envRows.value.push({ key: '', value: '' })
}

function removeEnvRow(i) {
  envRows.value.splice(i, 1)
  serializeEnvRows()
}

watch(envRows, serializeEnvRows, { deep: true })

// --- Secret detection → Enterprise (encrypted) ---------------------------
// Same heuristic as Advanced mode: if any env var key looks like a secret, the
// app is registered as Enterprise so its configuration is encrypted, not public.
const secretKeys = computed(() => {
  const matches = detectSecretEnvVars(props.spec.compose)

  return [...new Set(matches.map(m => m.key))]
})
const hasSecrets = computed(() => secretKeys.value.length > 0)

// The app is Enterprise (encrypted, private) if it contains secret-like env
// vars OR pulls from a private registry (its credentials must stay private).
const isEnterprise = computed(() => hasSecrets.value || isPrivate.value)

function stepInstances(delta) {
  instances.value = Math.max(minInstances.value, Math.min(100, (instances.value || 1) + delta))
}

// --- Private registry (manual) -------------------------------------------
// A single repoauth string, exactly as the backend expects and Advanced mode
// uses: "username:password" (basic) or "provider://..." (AWS ECR / GCP GAR /…).
const isPrivate = ref(!!comp().repoauth)

const repoauth = computed({
  get: () => comp().repoauth || '',
  set: v => { comp().repoauth = v },
})

// Clear credentials when the image is switched back to public.
watch(isPrivate, v => {
  if (!v) comp().repoauth = ''
})

// Copyable examples shown in the repoauth help popover.
const awsExample = 'aws://region=us-east-1&accessKeyId=YOUR_KEY&secretAccessKey=YOUR_SECRET'
const copied = ref('')

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = text
    setTimeout(() => { if (copied.value === text) copied.value = '' }, 1500)
  } catch (error) {
    // Clipboard unavailable (e.g. non-secure context) — ignore.
  }
}

// --- Terms of service ----------------------------------------------------
const tosAccepted = ref(sessionStorage.getItem('flux-tos-accepted') === 'true')
const showTos = ref(false)

function onAgreeTos() {
  tosAccepted.value = true
  showTos.value = false
}

watch(tosAccepted, val => {
  if (val) sessionStorage.setItem('flux-tos-accepted', 'true')
  else sessionStorage.removeItem('flux-tos-accepted')
})

// --- Human-language anchors ---------------------------------------------
const powerAnchor = computed(() => {
  if (cpu.value <= 1 && ramGb.value <= 2) return t('core.simpleDeploy.anchorSmall')
  if (cpu.value <= 3 && ramGb.value <= 6) return t('core.simpleDeploy.anchorMedium')

  return t('core.simpleDeploy.anchorLarge')
})

const reliabilityNote = computed(() => (instances.value === 1
  ? t('core.simpleDeploy.reliabilityOne')
  : t('core.simpleDeploy.reliabilityMany', { count: instances.value })))

const priceSub = computed(() => {
  const base = t('core.simpleDeploy.priceSub', { count: instances.value })

  return isEnterprise.value ? `${t('core.simpleDeploy.enterpriseTag')} · ${base}` : base
})

// --- Subscription period (expire, in blocks) -----------------------------
// Longer periods get a discount, matching the Advanced renewal options.
const PERIODS = [
  { blocks: 88000, labelKey: 'renewal1Month', discount: 0 },
  { blocks: 264000, labelKey: 'renewal3Months', discount: 3 },
  { blocks: 528000, labelKey: 'renewal6Months', discount: 6 },
  { blocks: 1056000, labelKey: 'renewal1Year', discount: 12 },
]

const period = computed({
  get: () => props.spec.expire || 88000,
  set: v => { props.spec.expire = v },
})

// --- Location (allowed continents only) ----------------------------------
// Each allowed continent is an "ac<CODE>" geolocation string (e.g. acEU).
// Empty = run anywhere. Countries/regions/exclusions are Advanced-only.
const CONTINENTS = [
  { code: 'EU', name: 'Europe' },
  { code: 'NA', name: 'North America' },
  { code: 'SA', name: 'South America' },
  { code: 'AS', name: 'Asia' },
  { code: 'AF', name: 'Africa' },
  { code: 'OC', name: 'Oceania' },
]

const restrictLocation = ref(false)
const selectedContinents = ref([])
const geoComplex = ref(false) // spec has country/region/forbidden rules → Advanced

function loadGeolocation() {
  const geo = props.spec.geolocation || []
  if (!geo.length) return
  if (geo.every(g => /^ac[A-Z]{2}$/.test(g))) {
    restrictLocation.value = true
    selectedContinents.value = geo.map(g => g.slice(2))
  } else {
    geoComplex.value = true
  }
}

function toggleContinent(code) {
  const i = selectedContinents.value.indexOf(code)
  if (i >= 0) selectedContinents.value.splice(i, 1)
  else selectedContinents.value.push(code)
}

watch([restrictLocation, selectedContinents], () => {
  if (geoComplex.value) return
  props.spec.geolocation = restrictLocation.value && selectedContinents.value.length
    ? selectedContinents.value.map(c => `ac${c}`)
    : []
}, { deep: true })

// --- Validation ----------------------------------------------------------
const canDeploy = computed(() =>
  !!comp().repotag?.trim()
  && !!appName.value
  && Number(port.value) > 0
  && isValidEmail(contactEmail.value)
  && (!storeData.value || !!dataPath.value.trim())
  && tosAccepted.value)

function onDeploy() {
  if (!canDeploy.value) return

  // Populate the required spec fields the simple form doesn't expose, so the
  // backend verification (which needs name, description, owner and per-component
  // name/description/data path) passes.
  const c = comp()
  if (!props.spec.description) props.spec.description = appName.value
  if (!c.description) c.description = appName.value
  if (!c.containerData) c.containerData = '/tmp'
  if (!props.spec.owner) {
    const auth = localStorage.getItem('zelidauth')
    const zelid = auth ? new URLSearchParams(auth).get('zelid') : ''
    if (zelid) props.spec.owner = zelid
  }

  // Secrets or a private image → register as Enterprise (encrypted) on handoff.
  emit('deploy', isEnterprise.value)
}

onMounted(() => {
  // Default to a single instance unless the spec already sets one.
  if (!props.spec.instances || props.spec.instances < 1) props.spec.instances = 1

  // Contact email is mandatory. For SSO users it's their account email,
  // auto-filled and locked; other login types must provide one.
  if (isSso.value && !contactEmail.value) {
    const user = getUser()
    if (user?.email) contactEmail.value = user.email
  }

  loadEnvRows()
  loadStorage()
  loadGeolocation()
})

// --- Trigger the live estimate on any pricing-relevant change ------------
watch(
  () => JSON.stringify([comp().repotag, cpu.value, comp().ram, hdd.value, instances.value, props.spec.expire, isEnterprise.value]),
  () => requestPriceEstimate(() => props.spec, { enterprise: isEnterprise.value }),
  { immediate: true },
)
</script>

<style scoped>
.simple-deploy {
  max-width: 640px;
  margin: 0 auto;
}

/* Topbar */
.sd-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 6px; }
.sd-brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
.sd-badge {
  width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; flex: none; color: #fff;
  background: linear-gradient(150deg, rgb(var(--v-theme-primary)), rgba(var(--v-theme-primary), 0.7));
}
.sd-title { font-size: 20px; font-weight: 650; margin: 0; letter-spacing: -0.01em; line-height: 1.2; }
.sd-subtitle { margin: 1px 0 0; font-size: 12.5px; opacity: 0.62; }

.sd-seg { display: inline-flex; background: rgba(var(--v-theme-on-surface), 0.05); border: 1px solid rgba(var(--v-theme-on-surface), 0.12); border-radius: 9px; padding: 3px; gap: 2px; flex: none; }
.sd-seg button { font: inherit; font-size: 13px; font-weight: 550; border: 0; cursor: pointer; padding: 5px 13px; border-radius: 6px; background: transparent; color: rgba(var(--v-theme-on-surface), 0.6); }
.sd-seg button.on { background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14); }

.sd-import-line { font-size: 13px; opacity: 0.72; margin: 14px 0 22px; }
.sd-import-line a { color: rgb(var(--v-theme-primary)); text-decoration: none; font-weight: 550; }
.sd-import-line a:hover { text-decoration: underline; }

/* Cards */
.sd-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 14px; padding: 18px 18px 20px; margin-bottom: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 6px 20px rgba(0, 0, 0, 0.05);
}
.sd-card-head { display: flex; align-items: center; gap: 9px; margin-bottom: 15px; }
.sd-card-ic { color: rgb(var(--v-theme-primary)); }
.sd-card-head h2 { font-size: 14.5px; font-weight: 620; margin: 0; letter-spacing: -0.005em; }
.sd-tag { margin-left: auto; font-size: 11px; opacity: 0.5; font-weight: 500; }

.sd-field { margin-bottom: 14px; }
.sd-field:last-child { margin-bottom: 0; }
.sd-mt { margin-top: 14px; }
.sd-mt-xs { margin-top: 3px; }
.sd-lbl { display: block; font-size: 12px; font-weight: 600; letter-spacing: .02em; margin-bottom: 6px; }
.sd-hint { font-size: 12.5px; opacity: 0.66; margin-top: 6px; }
.sd-req { color: rgb(var(--v-theme-error)); margin-left: 2px; font-weight: 700; }
.sd-domain { display: inline-flex; align-items: center; gap: 4px; margin-top: 5px; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 12px; color: rgb(var(--v-theme-primary)); opacity: 1; word-break: break-all; }
/* The primary blue (#2B61D1) is hard to read on the dark surface — lighten it. */
.v-theme--dark .sd-domain { color: #7c9dff; }
.sd-mono :deep(input) { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 14px; }

.sd-row2 { display: flex; gap: 12px; }
.sd-row2 > * { flex: 1; }

/* Toggle row */
.sd-toggle-row { display: flex; align-items: center; gap: 12px; padding: 10px 13px; background: rgba(var(--v-theme-on-surface), 0.035); border: 1px solid rgba(var(--v-theme-on-surface), 0.1); border-radius: 10px; }
.sd-toggle-txt { flex: 1; }
.sd-toggle-txt b { font-size: 13.5px; font-weight: 600; }
.sd-toggle-txt span { display: block; font-size: 12.5px; opacity: 0.66; margin-top: 2px; }
.sd-creds { margin-top: 12px; }

/* repoauth help popover */
.repoauth-help { max-width: 400px; }
.repoauth-ex { display: flex; align-items: center; gap: 6px; background: rgba(var(--v-theme-on-surface), 0.06); border: 1px solid rgba(var(--v-theme-on-surface), 0.1); border-radius: 8px; padding: 4px 6px 4px 10px; }
.repoauth-ex code { flex: 1; min-width: 0; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 12px; word-break: break-all; }

/* Environment variables */
.sd-env-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.sd-env-row { display: flex; align-items: center; gap: 6px; }
.sd-env-key { flex: 0 0 38%; }
.sd-env-val { flex: 1; min-width: 0; }
.sd-env-key :deep(input), .sd-env-val :deep(input) { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 13px; }
.sd-env-eq { opacity: 0.45; font-weight: 700; }
.sd-enterprise-alert { margin-top: 12px; }

/* Resources */
.sd-res { display: flex; align-items: center; gap: 14px; padding: 8px 0; }
.sd-res + .sd-res { border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.sd-res-meta { width: 120px; flex: none; }
.sd-res-name { font-size: 13px; font-weight: 600; }
.sd-res-anchor { font-size: 11.5px; opacity: 0.5; margin-top: 1px; }
.sd-slider { flex: 1; }
.sd-res-val { width: 84px; text-align: right; font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; flex: none; }
.sd-res-foot { margin-top: 10px; font-size: 12.5px; opacity: 0.75; display: flex; align-items: center; gap: 7px; }
.sd-dot { width: 6px; height: 6px; border-radius: 50%; background: rgb(var(--v-theme-success)); flex: none; }

/* Reliability */
.sd-reliability { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.sd-reliability-txt { flex: 1; min-width: 200px; }
.sd-reliability-name { font-size: 13.5px; font-weight: 600; }
.sd-stepper { display: inline-flex; align-items: center; border: 1px solid rgba(var(--v-theme-on-surface), 0.14); border-radius: 10px; background: rgba(var(--v-theme-on-surface), 0.035); }
.sd-stepper-n { width: 44px; text-align: center; font-size: 15px; font-weight: 650; font-variant-numeric: tabular-nums; }

/* Checkout */
.sd-checkout {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 14px; padding: 18px; margin-top: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.07);
}
.sd-period { margin-bottom: 16px; }
.sd-period-lbl { font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; opacity: 0.6; margin-bottom: 8px; }
.sd-period-opts { display: flex; flex-wrap: wrap; gap: 8px; }
.sd-period-btn { font: inherit; font-size: 13px; font-weight: 550; cursor: pointer; padding: 7px 12px; border-radius: 9px; background: rgba(var(--v-theme-on-surface), 0.05); border: 1px solid rgba(var(--v-theme-on-surface), 0.12); color: rgb(var(--v-theme-on-surface)); display: inline-flex; align-items: center; gap: 6px; transition: border-color .12s, background .12s; }
.sd-period-btn:hover { border-color: rgb(var(--v-theme-primary)); }
.sd-period-btn.on { border-color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.1); color: rgb(var(--v-theme-primary)); }
.sd-period-disc { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-success)); }

.sd-continents { display: flex; flex-wrap: wrap; gap: 8px; }
.sd-cont-btn { font: inherit; font-size: 13px; font-weight: 550; cursor: pointer; padding: 7px 12px; border-radius: 9px; background: rgba(var(--v-theme-on-surface), 0.05); border: 1px solid rgba(var(--v-theme-on-surface), 0.12); color: rgb(var(--v-theme-on-surface)); transition: border-color .12s, background .12s; }
.sd-cont-btn:hover { border-color: rgb(var(--v-theme-primary)); }
.sd-cont-btn.on { border-color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.1); color: rgb(var(--v-theme-primary)); }

.sd-price-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.sd-price-lbl { font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; opacity: 0.6; }
.sd-price-num { font-size: 32px; font-weight: 720; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; margin-top: 2px; line-height: 1.1; }
.sd-price-num small { font-size: 15px; font-weight: 550; opacity: 0.6; }
.sd-price-dash { opacity: 0.35; }
.sd-price-sub { font-size: 12.5px; opacity: 0.66; margin-top: 3px; }
.sd-price-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: rgb(var(--v-theme-success)); background: rgba(var(--v-theme-success), 0.12); padding: 5px 10px; border-radius: 999px; white-space: nowrap; }

.sd-tos { margin: 10px 0 2px; }
.sd-tos-lbl { font-size: 13px; opacity: 0.85; }
.sd-tos-lbl a { color: rgb(var(--v-theme-primary)); text-decoration: none; font-weight: 600; }
.sd-tos-lbl a:hover { text-decoration: underline; }

.sd-deploy {
  margin-top: 8px; font-weight: 620; letter-spacing: 0.01em; color: #fff !important;
  background: linear-gradient(150deg, rgb(var(--v-theme-primary)), rgba(var(--v-theme-primary), 0.78)) !important;
}
.sd-advanced { text-align: center; margin-top: 16px; font-size: 13px; opacity: 0.72; }
.sd-advanced a { color: rgb(var(--v-theme-primary)); font-weight: 600; text-decoration: none; }
.sd-advanced a:hover { text-decoration: underline; }

@media (max-width: 520px) {
  .sd-res-meta { width: 96px; }
  .sd-res-val { width: 72px; }
  .sd-subtitle { display: none; }
}
</style>
