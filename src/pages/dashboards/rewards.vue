<template>
  <div>
    <!-- Introduction Section -->
    <VRow class="mb-6">
      <VCol cols="12">
        <VCard flat class="rewards-intro-card">
          <VCardText>
            <div class="d-flex align-center mb-3">
              <VAvatar
                size="48"
                color="primary"
                variant="tonal"
                class="mr-3"
              >
                <VIcon size="28">mdi-cash-multiple</VIcon>
              </VAvatar>
              <div>
                <h2 class="text-h4 mb-1">{{ t('pages.dashboard.rewards.intro.title') }}</h2>
                <p class="text-body-2 mb-0 text-medium-emphasis">{{ t('pages.dashboard.rewards.intro.subtitle') }}</p>
              </div>
            </div>
            <p class="text-body-1 mb-3">
              {{ t('pages.dashboard.rewards.intro.description') }}
            </p>
            <a
              href="https://runonflux.com"
              target="_blank"
              rel="noopener noreferrer"
              class="learn-more-link"
            >
              <VBtn
                color="primary"
                variant="tonal"
                prepend-icon="mdi-open-in-new"
                size="small"
              >
                {{ t('pages.dashboard.rewards.intro.learnMore') }}
              </VBtn>
            </a>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow>
      <VCol
        v-for="(card, index) in rewardCards"
        :key="index"
        cols="12"
        :md="
          rewardCards.length % 2 === 1 && index === rewardCards.length - 1 ? '12' : '6'
        "
        lg="4"
        class="py-0 mt-2"
      >
        <VCard
          :title="card.title"
          elevation="2"
        >
          <VOverlay
            v-model="isLoading"
            contained
            scroll-strategy="none"
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
          <VCardText>
            <div class="mb-4">
              {{ card.collateral.toLocaleString() }} {{ t('pages.dashboard.rewards.fluxCollateral') }}
            </div>

            <VTimeline
              side="end"
              align="start"
              truncate-line="both"
              density="comfortable"
              line-thickness="10"
              class="mt-2"
            >
              <VTimelineItem
                v-for="(period, idx) in rewardPeriods"
                :key="idx"
                :dot-color="card.dotColor"
                size="x-small"
              >
                <div class="d-flex justify-space-between align-center gap-2 flex-wrap mb-2">
                  <div class="d-flex flex-column">
                    <span class="app-timeline-title">
                      {{ beautifyValue(card.rewards[period.label]) }} FLUX
                    </span>
                    <VChip
                      color="success"
                      size="small"
                    >
                      ~${{
                        beautifyValue(card.rewards[period.label] * getFiatRate("FLUX"))
                      }}
                      {{ t('pages.dashboard.rewards.usd') }}
                    </VChip>
                  </div>
                  <span class="app-timeline-meta">{{ period.label }}</span>
                </div>
                <div class="mb-3" />
              </VTimelineItem>
            </VTimeline>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        class="py-0 mt-2"
        cols="12"
        md="12"
        lg="12"
      >
        <VCard
          :title="t('pages.dashboard.rewards.historicalPriceChart')"
          elevation="2"
          height="350"
          class="py-0"
        >
          <VueApexCharts
            ref="historyPrice"
            type="area"
            height="300"
            width="100%"
            :options="lineChart.chartOptions"
            :series="lineChart.series"
          />
          <VOverlay
            :model-value="loadingPrice"
            contained
            class="align-center justify-center overlay"
          >
            <VProgressCircular indeterminate />
          </VOverlay>
        </VCard>
      </VCol>
    </VRow>

    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
    >
      {{ snackbar.message }}
      <template #actions>
        <VBtn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          {{ t('pages.dashboard.rewards.close') }}
        </VBtn>
      </template>
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from "vue"
import DashboardService from "@/services/DashboardService"
import ExplorerService from "@/services/ExplorerService"
import axios from "axios"
import axiosRetry from "axios-retry"
import { useConfigStore } from "@core/stores/config"
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"

const { t } = useI18n()

const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)
const isLoading = ref(true)

axiosRetry(axios, {
  retries: 3,
  retryDelay: retryCount => retryCount * 1000,
  onRetry: retryCount => {
    console.log(`Retry attempt #${retryCount}`)
  },
})

const themeColors = {
  primary: "#7367F0",
  warning: "#FF9F43",
  error: "#EA5455",
}

const snackbar = ref({
  show: false,
  message: "",
  color: "error",
})

const loadingPrice = ref(true)
const historicalPrices = ref([])

const lineChart = ref({
  series: [],
  chartOptions: {
    colors: [themeColors.primary],
    labels: [t("pages.dashboard.rewards.price")],
    grid: { show: false },
    chart: { toolbar: { show: false }, sparkline: { enabled: true }, stacked: true },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 0.9, opacityFrom: 0.7, opacityTo: 0.0 },
    },
    xaxis: {
      type: "numeric",
      lines: { show: false },
      axisBorder: { show: false },
      labels: { show: false },
    },
    yaxis: [{ y: 0 }],
    tooltip: {
      x: { formatter: value => new Date(value).toLocaleString("en-GB") },
      y: { formatter: value => `$${beautifyValue(value, 2)} ${t("pages.dashboard.rewards.usd")}` },
      theme: theme.value,
    },
  },
})

const cumulusWeek = ref(0)
const nimbusWeek = ref(0)
const stratusWeek = ref(0)
const cumulusCollateral = ref(0)
const nimbusCollateral = ref(0)
const stratusCollateral = ref(0)
const rates = ref([])
const historyPrice = ref(null)

const rewardCards = reactive([
  {
    title: t("pages.dashboard.rewards.cumulusTotalRewards"),
    collateral: 0,
    type: "cumulus",
    dotColor: "primary",
    rewards: {},
  },
  {
    title: t("pages.dashboard.rewards.nimbusTotalRewards"),
    collateral: 0,
    type: "nimbus",
    dotColor: "warning",
    rewards: {},
  },
  {
    title: t("pages.dashboard.rewards.stratusTotalRewards"),
    collateral: 0,
    type: "stratus",
    dotColor: "error",
    rewards: {},
  },
])

const rewardPeriods = [
  { label: t("pages.dashboard.rewards.perDay"), factor: 0.14285714 },
  { label: t("pages.dashboard.rewards.perWeek"), factor: 1 },
  { label: t("pages.dashboard.rewards.perMonth"), factor: 4.34812141 },
]

watch(theme, newTheme => {
  if (historyPrice.value) {
    historyPrice.value.updateOptions({ tooltip: { theme: newTheme } }, false, false)
  }
})

const beautifyValue = (value, decimals = 2) => {
  const numericValue = typeof value === "number" && !isNaN(value) ? value : 0
  const fixedValue = numericValue.toFixed(decimals)

  return fixedValue.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

function getFiatRate(coin) {
  const coinRateToUse = "USD"
  let rateObj = rates.value[0]?.find(rate => rate.code === coinRateToUse)
  if (!rateObj) rateObj = { rate: 0 }

  let btcRateForCoin = rates.value[1]?.[coin]
  if (btcRateForCoin === undefined) btcRateForCoin = 0

  return rateObj.rate * btcRateForCoin
}

const calculateReward = (period, weekValue) => weekValue * period.factor

const showError = message => {
  snackbar.value.message = message
  snackbar.value.color = "error"
  snackbar.value.show = true
}

const updateRewardCards = () => {
  rewardCards[0].collateral = cumulusCollateral.value
  rewardCards[1].collateral = nimbusCollateral.value
  rewardCards[2].collateral = stratusCollateral.value
}

const calculateAllRewards = () => {
  rewardCards.forEach(card => {
    const weekValue =
      card.type === "cumulus"
        ? cumulusWeek.value
        : card.type === "nimbus"
          ? nimbusWeek.value
          : stratusWeek.value

    rewardPeriods.forEach(period => {
      card.rewards[period.label] = calculateReward(period, weekValue)
    })
  })
}

let dataInterval = null

onMounted(() => {
  getData()
  dataInterval = setInterval(() => getData(), 1000 * 60 * 10)
})

onBeforeUnmount(() => {
  if (dataInterval) {
    clearInterval(dataInterval)
  }
})

const getBlockHeight = async () => {
  try {
    const result = await ExplorerService.getScannedHeight()
    if (result.data.status === "success") {
      return result.data.data.generalScannedHeight
    }
    
    return 0
  } catch (error) {
    console.error("Error fetching block height:", error)
    
    return 0
  }
}

const getData = async () => {
  try {
    const result = await ExplorerService.getScannedHeight()
    if (result.data.status === "success") {
      const blockHeight = result.data.data.generalScannedHeight

      cumulusCollateral.value = blockHeight < 1076532 ? 10000 : 1000
      nimbusCollateral.value = blockHeight < 1081572 ? 25000 : 12500
      stratusCollateral.value = blockHeight < 1087332 ? 100000 : 40000
    }
    updateRewardCards()
    await Promise.all([getRates(), getPriceData(), getFluxNodeCount()])
    calculateAllRewards()
    isLoading.value = false
    nextTick(() => console.log("UI has been updated after calculations."))
  } catch (error) {
    isLoading.value = false
    console.error("Error fetching data:", error)
    showError(t("pages.dashboard.rewards.errors.failedToFetchData"))
  }
}

const getRates = async () => {
  try {
    const result = await axios.get("https://vipdrates.zelcore.io/rates")

    rates.value = result.data
  } catch (error) {
    console.error("Error fetching rates:", error)
    showError(t("pages.dashboard.rewards.errors.failedToFetchRates"))
  }
}

const getPriceData = async () => {
  loadingPrice.value = true
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/coins/zelcash/market_chart?vs_currency=USD&days=30",
    )

    historicalPrices.value = res.data.prices.filter(a => a[0] > 1483232400000)

    const priceData = historicalPrices.value.filter((_, i) => i % 3 === 0)

    lineChart.value.series = [{ name: t("pages.dashboard.rewards.price"), data: priceData }]
  } catch (error) {
    console.error("Error fetching price data:", error)
    showError(t("pages.dashboard.rewards.errors.failedToFetchPriceData"))
  } finally {
    loadingPrice.value = false
  }
}

const getFluxNodeCount = async () => {
  try {
    const response = await DashboardService.fluxnodeCount()
    if (response.data.status === "error") {
      showError(response.data.data.message || response.data.data)

      return
    }

    const fluxNodesData = response.data.data

    const counts = {
      "stratus-enabled": fluxNodesData["stratus-enabled"],
      "nimbus-enabled": fluxNodesData["nimbus-enabled"],
      "cumulus-enabled": fluxNodesData["cumulus-enabled"],
    }

    await generateEconomics(counts)
  } catch (error) {
    console.error("Error fetching node count:", error)
    showError(t("pages.dashboard.rewards.errors.failedToFetchNodeCount"))
  }
}

const generateEconomics = async fluxnodecounts => {
  let perCumulusNode = 2.8125
  let perNimbusNode = 4.6875
  let perStratusNode = 11.25

  // Get block height first to determine which multipliers to use
  const blockHeight = await getBlockHeight()

  // PON Fork at block 2020000: reward multipliers and chain speed change
  // Pre-fork multipliers: Cumulus 0.075, Nimbus 0.125, Stratus 0.3
  // Post-fork multipliers: Cumulus 0.074, Nimbus 0.259, Stratus 0.666
  const isPostFork = blockHeight >= 2020000

  const cumulusMultiplier = isPostFork ? 0.074 : 0.075
  const nimbusMultiplier = isPostFork ? 0.259 : 0.125
  const stratusMultiplier = isPostFork ? 0.666 : 0.3

  try {
    const response = await DashboardService.blockReward()
    if (response.data.status !== "error") {
      perCumulusNode = (response.data.data.miner * cumulusMultiplier).toFixed(4)
      perNimbusNode = (response.data.data.miner * nimbusMultiplier).toFixed(4)
      perStratusNode = (response.data.data.miner * stratusMultiplier).toFixed(4)
    } else {
      showError(response.data.data.message || response.data.data)
    }
  } catch (error) {
    console.error("Error fetching block reward:", error)
    showError(t("pages.dashboard.rewards.errors.failedToFetchBlockReward"))
  }

  const stratuses = fluxnodecounts["stratus-enabled"]
  const nimbuses = fluxnodecounts["nimbus-enabled"]
  const cumuluses = fluxnodecounts["cumulus-enabled"]

  // PON Fork at block 2020000: chain speed increases 4x (2 min -> 30 sec blocks)
  // Pre-fork: 720 blocks/day, Post-fork: 2880 blocks/day
  const speedMultiplier = isPostFork ? 4 : 1
  const blocksPerWeek = 720 * 7 * speedMultiplier

  cumulusWeek.value = ((perCumulusNode * blocksPerWeek) / cumuluses) * 2
  nimbusWeek.value = ((perNimbusNode * blocksPerWeek) / nimbuses) * 2
  stratusWeek.value = ((perStratusNode * blocksPerWeek) / stratuses) * 2
}
</script>

<style scoped>
.rewards-intro-card {
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-success), 0.05) 100%);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.rewards-intro-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.1);
}

.learn-more-link {
  text-decoration: none;
}

.v-card {
  margin-bottom: 1rem;
}
.v-timeline {
  padding-left: 0;
}
.text-muted {
  color: rgba(0, 0, 0, 0.6);
}
.font-weight-bolder {
  font-weight: 700;
}
.overlay {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
</style>
