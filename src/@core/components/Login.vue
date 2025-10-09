<template>
  <div>
    {{ infoMessage }}
    <div style="min-width: 360px">
      <VCard
        v-if="privilege === 'none'"
        class="mb-3 rounded-xl elevation-4 pa-4"
      >
        <VCardTitle class="mt-2">
          <VAvatar
            variant="tonal"
            color="success"
            rounded
            size="35"
            class="text-primary mr-1"
          >
            <VIcon
              icon="mdi-account-lock-open-outline"
              size="25"
            />
          </VAvatar>
          {{ t("login.automatedLogin") }}
        </VCardTitle>

        <VRow>
          <VCol
            cols="12"
            md="1"
            class="d-flex d-none"
          />
          <VCol
            cols="12"
            md="4"
          >
            <div class="d-flex justify-center">
              <div class="d-flex gap-3 mb-4 mt-4">
                <VBtn
                  :variant="currentTab === 'one' ? 'elevated' : 'outlined'"
                  :color="currentTab === 'one' ? 'primary' : 'default'"
                  size="small"
                  @click="currentTab = 'one'"
                >
                  <VIcon icon="mdi-wallet" class="me-1" size="16" />
                  {{ t("login.thirdPartyLogin") }}
                </VBtn>
                <VBtn
                  :variant="currentTab === 'two' ? 'elevated' : 'outlined'"
                  :color="currentTab === 'two' ? 'primary' : 'default'"
                  size="small"
                  @click="currentTab = 'two'"
                >
                  <VIcon icon="mdi-email" class="me-1" size="16" />
                  {{ t("login.emailPassword") }}
                </VBtn>
              </div>
            </div>

            <VTabsWindow
              v-model="currentTab"
              style="min-height: 210px"
            >
              <!-- 3rd Party -->
              <VTabsWindowItem
                value="one"
                class="pt-0 m-0"
              >
                <div class="ssoLogin mt-0">
                  <div v-if="showSsoLoggedIn">
                    <VProgressCircular
                      indeterminate
                      color="primary"
                    />
                    <div>{{ t("login.finishingLogin") }}</div>
                  </div>
                  <div v-if="showSsoVerify">
                    <VBtn
                      class="mb-2"
                      color="primary"
                      @click="cancelVerification"
                    >
                      {{ t("login.cancelVerification") }}
                    </VBtn>
                    <div>
                      <VProgressCircular
                        indeterminate
                        color="primary"
                      />
                      <div>{{ t("login.finishingVerification") }}</div>
                      <div>
                        <i>{{ t("login.checkEmail") }}</i>
                      </div>
                    </div>
                  </div>
                  <div v-if="!showSsoLoggedIn && !showSsoVerify">
                    <div class="d-flex flex-column align-center mt-4">
                      <VBtn
                        color="#ffffff"
                        class="mb-3 text-black justify-start"
                        style="min-width: 210px"
                        @click="loginWithGoogleBtn"
                      >
                        <img
                          :src="googleIcon"
                          alt="Google"
                          width="18"
                          height="18"
                          class="google-icon"
                          start
                        >
                        <span
                          class="ml-2"
                          style="font-size: 14px"
                        >{{
                          t("login.googleLogin")
                        }}</span>
                      </VBtn>

                      <VBtn
                        color="#000000"
                        class="text-white justify-start"
                        style="min-width: 210px"
                        @click="loginWithAppleBtn"
                      >
                        <VIcon
                          size="20"
                          class="mr-2"
                          start
                        >
                          mdi-apple
                        </VIcon>
                        <span style="font-size: 14px">{{ t("login.appleLogin") }}</span>
                      </VBtn>
                      <p
                        class="sso-tos normal-case mt-2 mb-0"
                        style="color: #757575"
                      >
                        {{ t("login.bySigningIn") }}
                      </p>
                      <p class="sso-tos normal-case">
                        <a
                          :href="tosLink"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {{ t("login.termsOfService") }}
                        </a>
                        <span style="color: #757575">
                          &nbsp;{{ t("login.and") }}&nbsp;
                        </span>
                        <a
                          :href="privacyLink"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>
                            {{ t("login.privacyPolicy")
                            }}<span style="color: #757575">.</span>
                          </span>
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </VTabsWindowItem>

              <!-- Email Login -->
              <VTabsWindowItem
                value="two"
                class="px-4"
              >
                <VForm
                  ref="emailLoginFormRef"
                  @submit.prevent="emailLogin"
                >
                  <VRow class="mb-2 mt-2">
                    <VCol
                      cols="12"
                      class="pb-2"
                    >
                      <VTextField
                        v-model="emailForm.email"
                        :label="t('login.email')"
                        type="email"
                        :rules="emailRules"
                        validate-on="blur submit"
                        required
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        v-model="emailForm.password"
                        :label="t('login.password')"
                        type="password"
                        :rules="passwordRules"
                        validate-on="blur submit"
                        required
                      />
                    </VCol>
                    <VCol cols="6">
                      <VBtn
                        color="primary"
                        class="w-100"
                        @click="emailLogin"
                      >
                        <div v-if="showEmailLoginProcessing">
                          <VProgressCircular
                            indeterminate
                            color="secondary"
                            small
                          />
                        </div>
                        <div v-else>
                          {{ t("login.login") }}
                        </div>
                      </VBtn>
                    </VCol>
                    <VCol cols="6">
                      <VBtn
                        color="secondary"
                        class="w-100"
                        @click="createAccount"
                      >
                        {{ t("login.signUp") }}
                      </VBtn>
                    </VCol>
                  </VRow>
                </VForm>

                <div
                  v-if="showEmailVerify"
                  class="mt-4 text-center"
                >
                  <div class="pb-4 px-4">
                    <VBtn
                      color="error"
                      class="mb-4"
                      variant="flat"
                      @click="cancelVerification"
                    >
                      <VIcon start>
                        mdi-close-circle
                      </VIcon>
                      {{ t("login.cancelVerification") }}
                    </VBtn>
                    <div class="text-body-2">
                      <VProgressCircular
                        indeterminate
                        color="primary"
                        size="24"
                        class="mb-2"
                      />
                      <div>{{ t("login.finishingVerification") }}</div>
                      <div>
                        <i>{{ t("login.checkEmail") }}</i>
                      </div>
                    </div>
                  </div>
                </div>
              </VTabsWindowItem>
            </VTabsWindow>
          </VCol>

          <!-- OR -->
          <VCol
            cols="12"
            md="2"
            class="d-none d-md-flex align-center justify-center pa-0"
          >
            <div
              class="d-none d-md-flex flex-column align-center justify-center"
              style="height: 80%"
            >
              <VDivider
                vertical
                class="mx-auto"
              />
              <VAvatar
                size="32"
                color="rgba(var(--v-theme-on-surface), var(--v-hover-opacity))"
                class="my-2"
              >
                <div class="text-overline text-disabled">
                  OR
                </div>
              </VAvatar>
              <VDivider
                vertical
                class="mx-auto"
              />
            </div>
          </VCol>
          <VCol
            cols="12"
            class="d-flex d-md-none align-center justify-center"
          >
            <div
              class="d-flex align-center"
              style="position: relative; width: 95%"
            >
              <VDivider />
              <VAvatar
                size="32"
                class="mx-4"
                color="rgba(var(--v-theme-on-surface), var(--v-hover-opacity))"
                style="z-index: 1"
              >
                <div class="text-overline text-disabled">
                  OR
                </div>
              </VAvatar>
              <VDivider />
            </div>
          </VCol>

          <!-- Decentralized Login -->
          <VCol
            cols="12"
            md="4"
            class="pb-8 pt-0"
          >
            <div
              class="text-center pa-4 mb-4"
              color="blue-grey darken-3"
              dark
              elevation="2"
              style="border-radius: 12px"
            >
              <div class="justify-center align-center text-h5 text-md-h5 font-weight-medium">
                <VIcon
                  icon="mdi-spider-web"
                  size="24"
                />
                {{ t("login.decentralizedLogin") }}
              </div>
              <div class="text-body-2">
                {{ t("login.walletLoginInfo") }}
              </div>
            </div>

            <div class="d-flex flex-wrap justify-center mb-4">
              <a
                title="Login with Zelcore"
                @click="initiateLoginWS"
              >
                <img
                  class="walletIcon"
                  :src="fluxIDLogo"
                  alt="Flux ID"
                >
              </a>
              <a
                title="Login with SSP"
                @click="initSSP"
              >
                <img
                  class="walletIcon"
                  :src="theme === 'dark' ? sspLogoWhite : sspLogoBlack"
                  alt="SSP"
                >
              </a>
              <a
                title="Login with WalletConnect"
                @click="initWalletConnect"
              >
                <img
                  class="walletIcon"
                  :src="walletConnectLogo"
                  alt="WalletConnect"
                >
              </a>
              <a
                title="Login with Metamask"
                @click="initMetamask"
              >
                <img
                  class="walletIcon"
                  :src="metamaskLogo"
                  alt="Metamask"
                >
              </a>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="1"
          />
        </VRow>
      </VCard>

      <!-- Manual Login -->
      <VCard
        v-if="privilege === 'none' && !hideManualLogin"
        class="mt-6 rounded-xl elevation-4 pa-4"
      >
        <VCardTitle class="mt-2">
          <VAvatar
            variant="tonal"
            color="success"
            rounded
            size="35"
            class="text-primary mr-1"
          >
            <VIcon
              icon="mdi-shield-lock-open-outline"
              size="25"
            />
          </VAvatar>
          {{ t("login.manualLogin") }}
        </VCardTitle>
        <VCardText class="text-center">
          {{ t("login.signWithWallet") }}
        </VCardText>
        <div class="pa-3">
          <VForm
            class="mx-2"
            @submit.prevent="login"
          >
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="loginForm.loginPhrase"
                  :label="t('login.message')"
                  :placeholder="t('login.insertMessage')"
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="loginForm.zelid"
                  :label="t('login.address')"
                  :placeholder="t('login.insertAddress')"
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="loginForm.signature"
                  :label="t('login.signature')"
                  :placeholder="t('login.insertSignature')"
                />
              </VCol>
              <VCol cols="12">
                <VBtn
                  color="primary"
                  class="w-100 mb-4"
                  @click="login"
                >
                  {{ t("login.login") }}
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </div>
      </VCard>

      <!-- Create Accont Dialog -->
      <VDialog
        v-model="modalShow"
        persistent
        max-width="500px"
      >
        <VCard>
          <VCardTitle class="bg-primary modal-title">
            {{ t("login.createSSO") }}
          </VCardTitle>
          <VCardText>
            <VForm
              ref="createSSOFormRef"
              @submit.prevent="handleSubmit"
            >
              <VTextField
                v-model="createSSOForm.email"
                :label="t('login.email')"
                type="email"
                :rules="emailRules"
                validate-on="blur submit"
                required
                class="mb-3"
              />
              <VTextField
                v-model="createSSOForm.pw1"
                :label="t('login.password')"
                type="password"
                :rules="passwordRules"
                validate-on="blur submit"
                required
                class="mb-3"
              />
              <VTextField
                v-model="createSSOForm.pw2"
                :label="t('login.confirmPassword')"
                type="password"
                :rules="passwordRulesMatch"
                validate-on="blur submit"
                required
                class="mb-3"
              />
            </VForm>
            <p
              class="sso-tos normal-case mt-2 mb-0"
              style="color: #757575"
            >
              {{ t("login.bySigningIn") }}
            </p>
            <p class="sso-tos normal-case mb-0">
              <a
                :href="tosLink"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ t("login.termsOfService") }}
              </a>
              <span style="color: #757575"> &nbsp;{{ t("login.and") }}&nbsp; </span>
              <a
                :href="privacyLink"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>
                  {{ t("login.privacyPolicy") }}<span style="color: #757575">.</span>
                </span>
              </a>
            </p>
          </VCardText>
          <VCardActions>
            <VBtn
              color="secondary"
              variant="flat"
              @click="cancelModal"
            >
              {{ t("login.cancel") }}
            </VBtn>
            <VBtn
              color="primary"
              variant="flat"
              @click="handleSubmit"
            >
              {{ t("login.ok") }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
      <CustomSnackbar
        v-model="toast.show"
        :text="toast.text"
        :variant="toast.variant"
        top
      />
    </div>
  </div>
</template>

<script setup>
import IDService from "@/services/IDService"
import { useFluxStore } from "@/stores/flux"
import { getDetectedBackendURL } from "@/utils/backend"
import {
  createEmailSSO,
  getUser,
  loginWithApple,
  loginWithEmail,
  loginWithGoogle,
} from "@/utils/firebase"
import { useConfigStore } from "@core/stores/config"
import fluxIDLogo from "@images/FluxID.svg?url"
import googleIcon from "@images/icons/brands/google.png"
import metamaskLogo from "@images/metamask.svg?url"
import sspLogoBlack from "@images/ssp-logo-black.svg?url"
import sspLogoWhite from "@images/ssp-logo-white.svg?url"
import walletConnectLogo from "@images/walletconnect.svg?url"
import { openWalletConnect, signWithWalletConnect, closeWalletConnect, signWithMetaMask, disconnectWalletConnect, appKit, isMetaMaskLocked } from '@/utils/walletService'
import axios from "axios"

import { storeToRefs } from "pinia"
import qs from "qs"
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { eventBus } from "@/utils/eventBus"

// Props
const props = defineProps({
  hideManualLogin: {
    type: Boolean,
    default: false,
  },
  xdaoOpen: {
    type: Number,
    default: 0,
  },
})

// Declare emitted events
const emit = defineEmits(['loginSuccess'])

const tosLink = "https://cdn.runonflux.io/Flux_Terms_of_Service.pdf"
const privacyLink = "https://runonflux.io/privacyPolicy"

const { t } = useI18n()
const fluxStore = useFluxStore()
const { privilege } = storeToRefs(fluxStore)
const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)

const emailForm = ref({ email: "", password: "" })
const loginForm = ref({ zelid: "", signature: "", loginPhrase: "" })
const createSSOForm = ref({ email: "", pw1: "", pw2: "" })
const createSSOFormRef = ref(null)
const emailLoginFormRef = ref(null)

const modalShow = ref(false)
const ssoVerification = ref(false)
const loginPhrase = ref("")
const currentTab = ref("one")
const websocket = ref(null)

const toast = ref({ show: false, text: "", variant: "success" })

const showToast = (variant, text) => {
  toast.value.variant = variant
  toast.value.text = text
  toast.value.show = true
}

const showSsoVerify = ref(false)
const showEmailVerify = ref(false)
const showSsoLoggedIn = ref(false)
const showEmailLoginProcessing = ref(false)

const infoMessage = ref("")

watch(currentTab, _ => {
  emailLoginFormRef.value?.reset()
})

const emailRules = [
  v => !!v || t("login.emailRequired"),
  v => /^[\w.-]+@[\w.-]+\.\w{2,}$/.test(v) || t("login.emailInvalid"),
]

const passwordRules = [
  v => !!v || t("login.passwordRequired"),
  v => v.length >= 8 || t("login.passwordTooShort"),
]

const passwordRulesMatch = computed(() => [
  v => !!v || t("login.passwordConfirmRequired"),
  v => v === createSSOForm.value.pw1 || t("login.passwordMismatch"),
])

const appKitAccount = ref(null)

const backendURL = ref(localStorage.getItem("backendURL") || getDetectedBackendURL())

const callbackValue = computed(() => encodeURI(`${backendURL.value}/id/verifylogin`))

const handleSignInSuccessWithAuthResult = authResult => {
  if (authResult.user) handleSignedInUser(authResult.user)

  return false
}

const loginWithGoogleBtn = async () => {
  try {
    const result = await loginWithGoogle()

    handleSignInSuccessWithAuthResult(result)
  } catch (e) {
    showToast("error", t("login.googleError") || e.message)
  }
}

const loginWithAppleBtn = async () => {
  try {
    const result = await loginWithApple()

    handleSignInSuccessWithAuthResult(result)
  } catch (e) {
    showToast("error", t("login.appleError") || e.message)
  }
}

const isMMSDKInitialized = ref(false)

// const initMMSDK = async () => {
//   if (isMMSDKInitialized.value) return
//   try {
//     // await MMSDK.init()
//     isMMSDKInitialized.value = true
//     console.log("MetaMask SDK initialized")
//   } catch (error) {
//     console.error("MetaMask SDK init error", error)
//     showToast("error", "MetaMask setup failed")
//   }
// }

const login = () => {
  IDService.verifyLogin(loginForm.value)
    .then(response => {
      if (response.data.status === "success") {
        const zelidauth = {
          zelid: loginForm.value.zelid,
          signature: loginForm.value.signature,
          loginPhrase: loginForm.value.loginPhrase,
        }

        fluxStore.setPrivilege(response.data.data.privilage)
        fluxStore.setZelid(zelidauth.zelid)
        localStorage.setItem("zelidauth", qs.stringify(zelidauth))
        emit('loginSuccess')
        showToast("success", response.data.data.message)
      } else {
        showToast(response.data.status, response.data.data.message || response.data.data)
      }
    })
    .catch(e => {
      showToast("error", e.toString())
    })
}

const handleSignedInUser = async user => {
  try {
    if (user.emailVerified) {
      showSsoLoggedIn.value = true

      await getZelIdLoginPhrase()
      await nextTick()

      const token = user.auth.currentUser.accessToken

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }

      const fluxLogin = await axios.post(
        "https://service.fluxcore.ai/api/signInOrUp",
        { message: loginPhrase.value },
        { headers },
      )

      if (fluxLogin.data?.status !== "success")
        throw new Error("Login Failed, please try again.")

      const authLogin = {
        zelid: fluxLogin.data.public_address,
        signature: fluxLogin.data.signature,
        loginPhrase: loginPhrase.value,
      }

      const response = await IDService.verifyLogin(authLogin)

      infoMessage.value = response
      if (response.data.status === "success") {
        fluxStore.setPrivilege(response.data.data.privilage)
        fluxStore.setZelid(authLogin.zelid)
        localStorage.setItem('loginType', 'sso')
        localStorage.setItem("zelidauth", qs.stringify(authLogin))
        emit('loginSuccess')
        showToast("success", response.data.data.message)
      } else {
        showToast("error", response.data.data.message || response.data.data)
        resetLoginUI()
      }
    } else {
      await user.sendEmailVerification()
      if (currentTab.value === "two") {
        showEmailVerify.value = true
      } else {
        showSsoVerify.value = true
      }
      ssoVerification.value = true
      await nextTick()
      await checkVerification()
    }
  } catch (error) {
    showToast("error", "Login Failed, please try again.")
    resetLoginUI()
  }
}

const checkVerification = async () => {
  try {
    let user = getUser()
    if (user && ssoVerification.value) {
      await user.reload()
      user = getUser()
      if (user.emailVerified) {
        showToast("info", "Email verified")
        showSsoVerify.value = false
        showEmailVerify.value = false
        ssoVerification.value = false
        await nextTick()
        handleSignedInUser(user)
      } else {
        setTimeout(checkVerification, 5000)
      }
    }
  } catch (error) {
    showToast("warning", "Email verification failed")
    resetLoginUI()
  }
}

const resetLoginUI = async () => {
  showSsoVerify.value = false
  showEmailVerify.value = false
  showSsoLoggedIn.value = false
  showEmailLoginProcessing.value = false
  emailForm.value.email = ""
  emailForm.value.password = ""
  ssoVerification.value = false
  resetModal()
  await nextTick()
}

const cancelVerification = () => resetLoginUI()

const emailLogin = async () => {
  const result = await emailLoginFormRef.value?.validate()
  if (!result.valid) return

  try {
    showEmailLoginProcessing.value = true
    await nextTick()

    const checkUser = await loginWithEmail(emailForm.value)

    handleSignInSuccessWithAuthResult(checkUser)
  } catch (error) {
    showEmailLoginProcessing.value = false
    await nextTick()
    showToast("error", "Login failed, please try again")
  }
}

const createAccount = () => {
  modalShow.value = true
}

const resetModal = () => {
  createSSOForm.value.email = ""
  createSSOForm.value.pw1 = ""
  createSSOForm.value.pw2 = ""
}

const cancelModal = () => {
  resetModal()
  modalShow.value = false
}

const handleSubmit = async () => {
  const result = await createSSOFormRef.value?.validate()
  if (!result.valid) return

  try {
    const createUser = await createEmailSSO({
      email: createSSOForm.value.email,
      password: createSSOForm.value.pw1,
    })

    handleSignInSuccessWithAuthResult(createUser)
    modalShow.value = false
  } catch (error) {
    resetLoginUI()
    showToast("error", "Account creation failed, try again")
  }
}

const getZelIdLoginPhrase = async () => {
  try {
    const response = await IDService.loginPhrase()

    if (response.data.status === "error") {
      getEmergencyLoginPhrase()
    } else {
      loginPhrase.value = response.data.data
      loginForm.value.loginPhrase = response.data.data
    }
  } catch (error) {
    showToast("error", error)
  }
}

const getEmergencyLoginPhrase = () => {
  IDService.emergencyLoginPhrase()
    .then(response => {
      if (response.data.status === "error")
        showToast("error", response.data.data.message)
      else {
        loginPhrase.value = response.data.data
        loginForm.value.loginPhrase = response.data.data
      }
    })
    .catch(error => showToast("error", error))
}

const initiateLoginWS = async () => {
  await getZelIdLoginPhrase()
  initZelcore()
  let backend = backendURL.value
  backend = backend.replace("https://", "wss://").replace("http://", "ws://")

  const wsuri = `${backend}/ws/id/${loginPhrase.value}`

  websocket.value = new WebSocket(wsuri)
  websocket.value.onopen = evt => console.log("WebSocket open", evt)
  websocket.value.onclose = evt => console.log("WebSocket closed", evt)
  websocket.value.onmessage = evt => {
    const data = qs.parse(evt.data)
    if (data.status === "success" && data.data) {
      const zelidauth = {
        zelid: data.data.zelid,
        signature: data.data.signature,
        loginPhrase: data.data.loginPhrase,
      }

      fluxStore.setPrivilege(data.data.privilage)
      fluxStore.setZelid(zelidauth.zelid)
      localStorage.setItem('loginType', 'zelcore')
      localStorage.setItem("zelidauth", qs.stringify(zelidauth))
      emit('loginSuccess')
      showToast("success", data.data.message)
    }
  }
  websocket.value.onerror = evt => console.log("WebSocket error", evt)
}

const initWalletConnect = async () => {
  try {
    console.log('[Login] 🚀 Starting WalletConnect login flow...')

    // Get login phrase first
    await getZelIdLoginPhrase()
    console.log('[Login] ✅ Login phrase obtained:', loginPhrase.value)

    // Open WalletConnect and wait for connection
    console.log('[Login] 🔗 Opening WalletConnect...')
    const address = await openWalletConnect()
    console.log('[Login] ✅ Connected with address:', address)
    appKitAccount.value = { address }

    // Sign the message (wallet is now connected)
    console.log('[Login] 📝 Requesting signature for message:', loginPhrase.value)
    try {
      var signature = await signWithWalletConnect(loginPhrase.value)
      console.log('[Login] ✅ Signature received:', signature?.substring(0, 20) + '...')
    } catch (signError) {
      console.log('[Login] ❌ Signature error:', signError.message)
      // If session expired, disconnect and reconnect
      if (signError.message && signError.message.includes('Session expired')) {
        // Try to disconnect (may fail if already disconnected)
        try {
          await disconnectWalletConnect()
        } catch (e) {
          // Silent fail - expected if already disconnected
        }

        // Reconnect (openWalletConnect now clears cache)
        const newAddress = await openWalletConnect()
        appKitAccount.value = { address: newAddress }

        // Wait for provider to initialize with namespaces
        let retries = 0
        let providerReady = false

        while (retries < 10 && !providerReady) {
          await new Promise(r => setTimeout(r, 500))
          try {
            const provider = await appKit?.getWalletProvider?.()
            if (provider?.namespaces) {
              providerReady = true
            } else {
              retries++
            }
          } catch (e) {
            retries++
          }
        }

        if (!providerReady) {
          throw new Error('Provider failed to initialize after reconnection')
        }

        // Try signing again
        signature = await signWithWalletConnect(loginPhrase.value)
      } else {
        throw signError
      }
    }

    // Verify login
    console.log('[Login] 🔐 Preparing login verification...')
    const walletConnectInfo = {
      zelid: address.toLowerCase(), // Backend expects lowercase
      signature: signature,
      loginPhrase: loginPhrase.value,
    }
    console.log('[Login] Login info:', {
      zelid: walletConnectInfo.zelid,
      signatureLength: walletConnectInfo.signature?.length,
      loginPhraseLength: walletConnectInfo.loginPhrase?.length,
    })

    console.log('[Login] 📡 Calling verifyLogin API...')
    const response = await IDService.verifyLogin(walletConnectInfo)
    console.log('[Login] 📥 verifyLogin response:', response.data)

    if (response.data.status === "success") {
      console.log('[Login] ✅ Login successful!')
      fluxStore.setPrivilege(response.data.data.privilage)
      fluxStore.setZelid(walletConnectInfo.zelid)
      localStorage.setItem('loginType', 'walletconnect')
      localStorage.setItem("zelidauth", qs.stringify(walletConnectInfo))
      emit('loginSuccess')
      showToast("success", response.data.data.message)
      // Don't close WalletConnect - keep session active for future logins
      // closeWalletConnect()
    } else {
      console.log('[Login] ❌ Login failed:', response.data.data.message || response.data.data)
      showToast(response.data.status, response.data.data.message || response.data.data)
    }
  } catch (error) {
    console.log('[Login] 💥 Login error:', error)
    showToast("error", error.message || "Failed to connect with WalletConnect")
  }
}

const isSigning = ref(false)

const initMetamask = async () => {
  try {
    if (isSigning.value) {
      showToast("warning", "Please complete the previous MetaMask request.")

      return
    }

    isSigning.value = true

    await getZelIdLoginPhrase()

    // Use walletService to sign with MetaMask
    const { address, signature } = await signWithMetaMask(loginPhrase.value)

    const metamaskLogin = {
      zelid: address,
      signature,
      loginPhrase: loginPhrase.value,
    }

    const response = await IDService.verifyLogin(metamaskLogin)
    if (response.data.status === "success") {
      fluxStore.setPrivilege(response.data.data.privilage)
      fluxStore.setZelid(metamaskLogin.zelid)
      localStorage.setItem("loginType", 'metamask')
      localStorage.setItem("zelidauth", qs.stringify(metamaskLogin))
      emit('loginSuccess')
      showToast("success", response.data.data.message)
    } else {
      showToast(response.data.status, response.data.data.message || response.data.data)
    }
  } catch (error) {
    console.error("MetaMask login failed:", error)
    showToast("error", error.message || "MetaMask login failed")
  } finally {
    isSigning.value = false
  }
}

const initSSP = async () => {
  try {
    if (!window.ssp) return showToast("error", "SSP Wallet not installed")
    await getZelIdLoginPhrase()

    const responseData = await window.ssp.request("sspwid_sign_message", {
      message: loginPhrase.value,
    })

    if (responseData.status === "ERROR")
      throw new Error(responseData.data || responseData.result)

    const sspLogin = {
      zelid: responseData.address,
      signature: responseData.signature,
      loginPhrase: loginPhrase.value,
    }

    const response = await IDService.verifyLogin(sspLogin)
    if (response.data.status === "success") {
      fluxStore.setPrivilege(response.data.data.privilage)
      fluxStore.setZelid(sspLogin.zelid)
      localStorage.setItem("logintype", 'ssp')
      localStorage.setItem("zelidauth", qs.stringify(sspLogin))
      emit('loginSuccess')
      showToast("success", response.data.data.message)
    } else {
      showToast(response.data.status, response.data.data.message || response.data.data)
    }
  } catch (error) {
    showToast("error", error.message)
  }
}

const initZelcore = () => {
  try {
    const protocolUrl = `zel:?action=sign&message=${loginPhrase.value}&icon=https%3A%2F%2Fraw.githubusercontent.com%2Frunonflux%2Fflux%2Fmaster%2FzelID.svg&callback=${callbackValue.value}`
    if (window.zelcore) {
      window.zelcore.protocol(protocolUrl)
    } else {
      const hiddenLink = document.createElement("a")

      hiddenLink.href = protocolUrl
      hiddenLink.style.display = "none"
      document.body.appendChild(hiddenLink)
      hiddenLink.click()
      document.body.removeChild(hiddenLink)
    }
  } catch (error) {
    showToast("warning", "Failed to sign message, please try again.")
  }
}

const handleBackendChange = () => {
  console.log("backendURLChanged triggered")
  backendURL.value = localStorage.getItem("backendURL") || getDetectedBackendURL()

  // getZelIdLoginPhrase()
}

onMounted(async () => {

  // const { MetaMaskSDK } = await import('@metamask/sdk')
 
  // MMSDK = new MetaMaskSDK({
  //   enableAnalytics: true,
  //   dappMetadata: {
  //     name: "Flux Cloud",
  //     url: isLocalhost ? window.location.origin : "https://home.runonflux.io",
  //   },
  // })


  eventBus.on("backendURLChanged", handleBackendChange)

  // eventBus.on("getZelIdLoginPhrase", getZelIdLoginPhrase)
  getZelIdLoginPhrase()

  // await initMMSDK()
})

onUnmounted(() => {
  if (websocket.value) websocket.value.close()

  eventBus.off("backendURLChanged", handleBackendChange)

  // eventBus.off("getZelIdLoginPhrase", getZelIdLoginPhrase)
})
</script>

<style scoped>
.loginText {
  color: #2b61d1;
  font-size: 20px;
  font-weight: 500;
}
.loginRow {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin-top: 10px;
  padding-top: 10px;
}
.ssoLogin {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  margin-top: 30px;
  text-align: center;
}
.walletIcon {
  height: 90px;
  width: 90px;
  padding: 10px;
}
.walletIcon img {
  -webkit-app-region: no-drag;
  transition: 0.1s;
}
a img {
  transition: all 0.05s ease-in-out;
}

a:hover img {
  filter: opacity(70%);
  transform: scale(1.1);
}

/* Custom styles for FirebaseUI widget */
.firebaseui-button {
  margin-left: 10px;
  border-radius: 3px;
}

.mdl-textfield.is-focused .mdl-textfield__label:after {
  bottom: 15px !important;
}

.firebaseui-title {
  color: black !important;
}

.sso-tos {
  color: lightgray;
  display: flex;
  justify-content: center;
  text-align: center;
  font-size: 12px;
}

.highlight {
  color: #2b61d1;
}

.modal-title {
  color: white;
}

.v-tabs-bar__content {
  flex-wrap: wrap;
  width: 100%;
}
div.v-tabs-bar {
  height: auto
}

/* Base pill style for each tab */
.pill-tabs .v-tab {
  border-radius: 50px; /* Makes it pill-shaped */
  padding: 8px 16px; /* Adjust padding as needed */
  margin-right: 8px; /* Space between tabs */
}

/* Style for the selected tab */
.pill-tabs .v-tab--selected {
  background-color: inherit;
  color: white !important; /* White text for selected tab */
}
</style>

<style>
/* Remove any border from the slide group container
.v-slide-group,
.v-slide-group__container,
.v-slide-group__content {
  border: none !important;
} */

.v-btn,
.v-chip,
.v-card-title,
.v-avatar {
  text-transform: none !important;
}
</style>
