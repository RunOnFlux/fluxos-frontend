<template>
  <div class="login-modal-container">
    <div class="login-content">
      <!-- FluxCloud-style Logo -->
      <div class="logo-container">
        <Logo icon-only :icon-size="96" />
      </div>

      <!-- Main Login Card -->
      <VCard
        v-if="privilege === 'none'"
        class="login-card"
        elevation="8"
      >
        <!-- SSO Login Processing State -->
        <div
          v-if="showSsoLoggedIn"
          class="processing-state"
        >
          <div class="modern-spinner-container">
            <VProgressCircular
              indeterminate
              color="primary"
              size="56"
              width="2.5"
              class="modern-spinner-outer"
            />
            <VProgressCircular
              indeterminate
              color="primary"
              size="38"
              width="2.5"
              class="modern-spinner-inner"
            />
          </div>
          <div class="text-center mt-4">
            <div class="text-h6 font-weight-medium mb-2">
              {{ t("core.login.finishingLogin") }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ t("core.login.pleaseWait") }}
            </div>
          </div>
        </div>

        <!-- SSO Verification State -->
        <div
          v-else-if="showSsoVerify"
          class="processing-state"
        >
          <VProgressCircular
            indeterminate
            color="primary"
            size="32"
            class="mb-2"
          />
          <div class="text-body-2">
            {{ t("core.login.finishingVerification") }}
          </div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            <i>{{ t("core.login.checkEmail") }}</i>
          </div>
          <VBtn
            color="error"
            variant="flat"
            @click="cancelVerification"
          >
            <VIcon start>
              mdi-close-circle
            </VIcon>
            {{ t("core.login.cancelVerification") }}
          </VBtn>
        </div>

        <!-- Main Login UI -->
        <div v-else>
          <!-- Methods View (default) -->
          <div v-if="currentView === 'methods'">
            <!-- All Login Method Buttons (before OR) -->
            <div class="login-methods-container">
              <VBtn
                color="#ffffff"
                class="login-method-button google-button"
                elevation="2"
                @click="loginWithGoogleBtn"
              >
                <img
                  :src="googleIcon"
                  alt="Google"
                  width="18"
                  height="18"
                  class="button-icon"
                >
                <span class="button-text">{{ t("core.login.googleLogin") }}</span>
              </VBtn>

              <VBtn
                color="#000000"
                class="login-method-button apple-button"
                elevation="2"
                @click="loginWithAppleBtn"
              >
                <VIcon
                  size="20"
                  class="button-icon"
                >
                  mdi-apple
                </VIcon>
                <span class="button-text">{{ t("core.login.appleLogin") }}</span>
              </VBtn>

              <VBtn
                color="secondary"
                variant="outlined"
                class="login-method-button"
                @click="showView('wallet')"
              >
                <VIcon
                  size="20"
                  class="button-icon"
                >
                  mdi-wallet
                </VIcon>
                <span class="button-text">{{ t("core.login.decentralizedWallets") }}</span>
              </VBtn>

              <VBtn
                v-if="!hideManualLogin"
                color="secondary"
                variant="outlined"
                class="login-method-button"
                @click="showView('manual')"
              >
                <VIcon
                  size="20"
                  class="button-icon"
                >
                  mdi-account-key
                </VIcon>
                <span class="button-text">{{ t("core.login.manualLogin") }}</span>
              </VBtn>
            </div>

            <!-- OR Divider -->
            <div class="or-divider">
              <VDivider />
              <span class="or-text">OR</span>
              <VDivider />
            </div>

            <!-- Email/Password Login Form (always visible in methods view) -->
            <VForm
              ref="emailLoginFormRef"
              @submit.prevent="emailLogin"
            >
              <VTextField
                v-model="emailForm.email"
                :label="t('core.login.email')"
                type="email"
                :rules="emailRules"
                validate-on="blur submit"
                required
                class="mb-3"
              />
              <VTextField
                v-model="emailForm.password"
                :label="t('core.login.password')"
                type="password"
                :rules="passwordRules"
                validate-on="blur submit"
                required
                class="mb-4"
              />

              <!-- Email Verification State -->
              <div
                v-if="showEmailVerify"
                class="text-center mb-4"
              >
                <VBtn
                  color="error"
                  variant="flat"
                  class="mb-3"
                  @click="cancelVerification"
                >
                  <VIcon start>
                    mdi-close-circle
                  </VIcon>
                  {{ t("core.login.cancelVerification") }}
                </VBtn>
                <div class="text-body-2">
                  <VProgressCircular
                    indeterminate
                    color="primary"
                    size="24"
                    class="mb-2"
                  />
                  <div>{{ t("core.login.finishingVerification") }}</div>
                  <div class="text-medium-emphasis">
                    <i>{{ t("core.login.checkEmail") }}</i>
                  </div>
                </div>
              </div>

              <div v-else>
                <VBtn
                  color="primary"
                  variant="flat"
                  block
                  class="mb-3"
                  @click="emailLogin"
                >
                  <VProgressCircular
                    v-if="showEmailLoginProcessing"
                    indeterminate
                    color="white"
                    size="20"
                  />
                  <span v-else>{{ t("core.login.login") }}</span>
                </VBtn>

                <!-- Sign Up Text Link -->
                <div class="text-center signup-text">
                  <span class="text-body-2">{{ t("core.login.dontHaveAccount") }}</span>
                  <a
                    href="#"
                    class="signup-link"
                    @click.prevent="createAccount"
                  >
                    {{ t("core.login.signUp") }}
                  </a>
                </div>
              </div>
            </VForm>
          </div>

          <!-- Decentralized Wallets View -->
          <div v-if="currentView === 'wallet'">
            <div class="wallet-header">
              <VBtn
                icon="mdi-arrow-left"
                variant="flat"
                color="secondary"
                class="back-button"
                @click="goBack"
              >
                <VIcon>mdi-arrow-left</VIcon>
              </VBtn>
              <div class="wallet-login-info">
                {{ t("core.login.walletLoginInfo") }}
              </div>
            </div>
            <div class="wallet-icons-grid">
              <div
                class="wallet-item"
                @click="initiateLoginWS"
              >
                <img
                  :src="fluxIDLogo"
                  alt="ZelCore"
                  class="wallet-icon"
                  :title="t('core.login.loginWithZelcore')"
                >
                <div class="wallet-label">
                  ZelCore
                </div>
              </div>
              <div
                class="wallet-item"
                @click="initSSP"
              >
                <img
                  :src="theme === 'dark' ? sspLogoWhite : sspLogoBlack"
                  alt="SSP"
                  class="wallet-icon"
                  :title="t('core.login.loginWithSSP')"
                >
                <div class="wallet-label">
                  SSP
                </div>
              </div>
              <div
                class="wallet-item"
                @click="initWalletConnect"
              >
                <img
                  :src="walletConnectLogo"
                  alt="WalletConnect"
                  class="wallet-icon"
                  :title="t('core.login.loginWithWalletConnect')"
                >
                <div class="wallet-label">
                  WalletConnect
                </div>
              </div>
              <div
                class="wallet-item"
                @click="initMetamask"
              >
                <img
                  :src="metamaskLogo"
                  alt="MetaMask"
                  class="wallet-icon"
                  :title="t('core.login.loginWithMetamask')"
                >
                <div class="wallet-label">
                  MetaMask
                </div>
              </div>
            </div>
          </div>

          <!-- Manual Login View -->
          <div v-if="currentView === 'manual' && !hideManualLogin">
            <div class="wallet-header">
              <VBtn
                icon="mdi-arrow-left"
                variant="flat"
                color="secondary"
                class="back-button"
                @click="goBack"
              >
                <VIcon>mdi-arrow-left</VIcon>
              </VBtn>
              <div class="manual-login-info">
                {{ t("core.login.signWithWallet") }}
              </div>
            </div>
            <VForm @submit.prevent="login">
              <VTextField
                v-model="loginForm.loginPhrase"
                :label="t('core.login.message')"
                :placeholder="t('core.login.clickToGetMessage')"
                readonly
                class="mb-3"
              >
                <template #append-inner>
                  <VBtn
                    icon="mdi-refresh"
                    size="x-small"
                    variant="text"
                    color="grey"
                    @click="getZelIdLoginPhrase"
                    :title="t('core.login.getNewLoginPhrase')"
                  />
                  <VBtn
                    v-if="loginForm.loginPhrase"
                    ref="copyLoginPhraseBtn"
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="text"
                    color="grey"
                    @click="copyLoginPhrase"
                    :title="t('core.login.copyLoginPhrase')"
                  />
                </template>
              </VTextField>
              <VTextField
                v-model="loginForm.zelid"
                :label="t('core.login.address')"
                :placeholder="t('core.login.insertAddress')"
                class="mb-3"
              />
              <VTextField
                v-model="loginForm.signature"
                :label="t('core.login.signature')"
                :placeholder="t('core.login.insertSignature')"
                class="mb-4"
              />
              <VBtn
                color="primary"
                variant="flat"
                block
                @click="login"
              >
                {{ t("core.login.login") }}
              </VBtn>
            </VForm>
          </div>
        </div>
      </VCard>

      <!-- Create Account Dialog -->
      <VDialog
        v-model="modalShow"
        persistent
        max-width="500px"
      >
        <VCard class="signup-dialog">
          <VCardTitle class="bg-primary text-white signup-title">
            <VIcon class="mr-2 ml-4">mdi-account-plus</VIcon>
            {{ t("core.login.createSSO") }}
          </VCardTitle>
          <VCardText class="pt-4">
            <VForm
              ref="createSSOFormRef"
              @submit.prevent="handleSubmit"
            >
              <VTextField
                v-model="createSSOForm.email"
                :label="t('core.login.email')"
                type="email"
                :rules="emailRules"
                validate-on="blur submit"
                required
                class="mb-3"
              />
              <VTextField
                v-model="createSSOForm.pw1"
                :label="t('core.login.password')"
                type="password"
                :rules="passwordRules"
                validate-on="blur submit"
                required
                class="mb-3"
              />
              <VTextField
                v-model="createSSOForm.pw2"
                :label="t('core.login.confirmPassword')"
                type="password"
                :rules="passwordRulesMatch"
                validate-on="blur submit"
                required
                class="mb-3"
              />
            </VForm>
            <p class="tos-text mb-0">
              {{ t("core.login.bySigningIn") }}
              <a
                :href="tosLink"
                target="_blank"
                rel="noopener noreferrer"
              >{{ t("core.login.termsOfService") }}</a>
              {{ t("core.login.and") }}
              <a
                :href="privacyLink"
                target="_blank"
                rel="noopener noreferrer"
              >{{ t("core.login.privacyPolicy") }}</a>.
            </p>
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn
              color="error"
              variant="flat"
              density="comfortable"
              @click="cancelModal"
            >
              {{ t("core.login.cancel") }}
            </VBtn>
            <VBtn
              color="primary"
              variant="flat"
              density="comfortable"
              class="mr-4"
              @click="handleSubmit"
            >
              {{ t("core.login.ok") }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>

      <!-- Toast Notification -->
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
import Logo from "@core/components/Logo.vue"
import fluxIDLogo from "@images/FluxID.svg?url"
import googleIcon from "@images/icons/brands/google.png"
import metamaskLogo from "@images/metamask.svg?url"
import sspLogoBlack from "@images/ssp-logo-black.svg?url"
import sspLogoWhite from "@images/ssp-logo-white.svg?url"
import walletConnectLogo from "@images/walletconnect.svg?url"
import { openWalletConnect, signWithWalletConnect, closeWalletConnect, signWithMetaMask, disconnectWalletConnect, appKit } from '@/utils/walletService'
import axios from "axios"
import { storeToRefs } from "pinia"
import qs from "qs"
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { eventBus } from "@/utils/eventBus"
import CustomSnackbar from "@core/components/CustomSnackbar.vue"
import ClipboardJS from 'clipboard'

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
const websocket = ref(null)
const copyLoginPhraseBtn = ref(null)
let clipboardInstance = null

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
const currentView = ref('methods') // 'methods', 'email', 'wallet', 'manual'

const showView = view => {
  currentView.value = view
  // Auto-fetch loginPhrase when showing manual login
  if (view === 'manual') {
    getZelIdLoginPhrase()
  }
}

const goBack = () => {
  currentView.value = 'methods'
}

const emailRules = [
  v => !!v || t("core.login.emailRequired"),
  v => /^[\w.-]+@[\w.-]+\.\w{2,}$/.test(v) || t("core.login.emailInvalid"),
]

const passwordRules = [
  v => !!v || t("core.login.passwordRequired"),
  v => v.length >= 8 || t("core.login.passwordTooShort"),
]

const passwordRulesMatch = computed(() => [
  v => !!v || t("core.login.passwordConfirmRequired"),
  v => v === createSSOForm.value.pw1 || t("core.login.passwordMismatch"),
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
    showToast("error", t("core.login.googleError") || e.message)
  }
}

const loginWithAppleBtn = async () => {
  try {
    const result = await loginWithApple()
    handleSignInSuccessWithAuthResult(result)
  } catch (e) {
    showToast("error", t("core.login.appleError") || e.message)
  }
}

const isMMSDKInitialized = ref(false)

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
        localStorage.setItem("loginType", "manual")
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

      // Use getIdToken() instead of accessing accessToken directly
      const token = await user.getIdToken()

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
        throw new Error(t("core.login.loginFailed"))

      const authLogin = {
        zelid: fluxLogin.data.public_address,
        signature: fluxLogin.data.signature,
        loginPhrase: loginPhrase.value,
      }

      const response = await IDService.verifyLogin(authLogin)

      if (response.data.status === "success") {
        fluxStore.setPrivilege(response.data.data.privilage)
        fluxStore.setZelid(authLogin.zelid)
        localStorage.setItem('loginType', 'sso')
        localStorage.setItem("zelidauth", qs.stringify(authLogin))
        showSsoLoggedIn.value = false
        emit('loginSuccess')
        showToast("success", response.data.data.message)
      } else {
        showToast("error", response.data.data.message || response.data.data)
        resetLoginUI()
      }
    } else {
      await user.sendEmailVerification()
      modalShow.value = false
      showSsoVerify.value = true
      ssoVerification.value = true
      await nextTick()
      await checkVerification()
    }
  } catch (error) {
    showToast("error", t("core.login.loginFailed"))
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
        showToast("info", t("core.login.emailVerified"))
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
    showToast("warning", t("core.login.emailVerificationFailed"))
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
  modalShow.value = false
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

    const checkUser = await loginWithEmail({
      email: emailForm.value.email.trim(),
      password: emailForm.value.password,
    })

    if (!checkUser) {
      throw new Error(t("core.login.loginFailed"))
    }

    handleSignInSuccessWithAuthResult(checkUser)
  } catch (error) {
    showEmailLoginProcessing.value = false
    await nextTick()

    // Provide specific error messages based on Firebase error codes
    let errorMessage = "core.login.loginFailed"

    const errorCode = error.code
    const errorMsg = error.message

    if (errorCode === 'auth/invalid-credential' || errorMsg === 'INVALID_LOGIN_CREDENTIALS') {
      errorMessage = "core.login.invalidCredential"
    } else if (errorCode === 'auth/user-not-found' || errorMsg === 'EMAIL_NOT_FOUND') {
      errorMessage = "core.login.userNotFound"
    } else if (errorCode === 'auth/wrong-password' || errorMsg === 'INVALID_PASSWORD') {
      errorMessage = "core.login.wrongPassword"
    } else if (errorCode === 'auth/invalid-email' || errorMsg === 'INVALID_EMAIL') {
      errorMessage = "core.login.emailInvalid"
    } else if (errorCode === 'auth/user-disabled') {
      errorMessage = "core.login.userDisabled"
    } else if (errorCode === 'auth/too-many-requests' || errorMsg === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
      errorMessage = "core.login.tooManyRequests"
    } else if (errorCode === 'auth/network-request-failed') {
      errorMessage = "core.login.networkError"
    }

    showToast("error", t(errorMessage))
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
      email: createSSOForm.value.email.trim(),
      password: createSSOForm.value.pw1,
    })

    if (!createUser) {
      throw new Error(t("core.login.accountCreationFailed"))
    }

    handleSignInSuccessWithAuthResult(createUser)
  } catch (error) {
    // Don't call resetLoginUI() here - keep the dialog open so user can fix and try again
    // Only clear the password fields for security
    createSSOForm.value.pw1 = ""
    createSSOForm.value.pw2 = ""

    // Provide specific error messages based on Firebase error codes
    let errorMessage = "core.login.accountCreationFailed"

    // Check both error.code and error.message for Firebase errors
    const errorCode = error.code
    const errorMsg = error.message

    if (errorCode === 'auth/email-already-in-use' || errorMsg === 'EMAIL_EXISTS') {
      errorMessage = "core.login.emailAlreadyInUse"
    } else if (errorCode === 'auth/weak-password' || errorMsg === 'WEAK_PASSWORD') {
      errorMessage = "core.login.weakPassword"
    } else if (errorCode === 'auth/invalid-email' || errorMsg === 'INVALID_EMAIL') {
      errorMessage = "core.login.emailInvalid"
    } else if (errorCode === 'auth/operation-not-allowed' || errorMsg === 'OPERATION_NOT_ALLOWED') {
      errorMessage = "core.login.operationNotAllowed"
    } else if (errorCode === 'auth/network-request-failed') {
      errorMessage = "core.login.networkError"
    } else if (errorCode === 'auth/too-many-requests' || errorMsg === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
      errorMessage = "core.login.tooManyRequests"
    }

    showToast("error", t(errorMessage))
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

const copyLoginPhrase = () => {
  if (!loginForm.value.loginPhrase) {
    showToast("error", t("core.login.noLoginPhraseToDownload"))
    return
  }
  // ClipboardJS will handle the actual copy via initClipboard()
}

const initClipboard = () => {
  nextTick(() => {
    // Clean up existing clipboard instance and its event listeners
    if (clipboardInstance) {
      clipboardInstance.destroy()
      clipboardInstance = null
    }

    const el = copyLoginPhraseBtn.value?.$el
    if (!el) return

    // Create new clipboard instance
    clipboardInstance = new ClipboardJS(el, {
      text: () => loginForm.value.loginPhrase
    })

    clipboardInstance.on('success', () => {
      showToast('success', t('core.login.copiedToClipboard'))
    })

    clipboardInstance.on('error', (e) => {
      console.error('ClipboardJS failed:', e)
      showToast('error', t('common.messages.failedToCopy'))
    })
  })
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
    console.log('[Login] Starting WalletConnect login flow...')

    await getZelIdLoginPhrase()
    console.log('[Login] Login phrase obtained:', loginPhrase.value ? loginPhrase.value.substring(0, 20) + '...' : 'none')

    console.log('[Login] Opening WalletConnect...')
    const address = await openWalletConnect()
    console.log('[Login] Connected with address:', address)
    appKitAccount.value = { address }

    console.log('[Login] Requesting signature for message:', loginPhrase.value ? loginPhrase.value.substring(0, 20) + '...' : 'none')
    try {
      var signature = await signWithWalletConnect(loginPhrase.value)
      console.log('[Login] Signature received:', signature?.substring(0, 20) + '...')
    } catch (signError) {
      console.log('[Login] Signature error:', signError.message)

      if (signError.message && signError.message.includes('Session expired')) {
        try {
          await disconnectWalletConnect()
        } catch (e) {
          // Silent fail - expected if already disconnected
        }

        const newAddress = await openWalletConnect()
        appKitAccount.value = { address: newAddress }

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

        signature = await signWithWalletConnect(loginPhrase.value)
      } else {
        throw signError
      }
    }

    console.log('[Login] Preparing login verification...')
    const walletConnectInfo = {
      zelid: address.toLowerCase(),
      signature: signature,
      loginPhrase: loginPhrase.value,
    }
    console.log('[Login] Login info:', {
      zelid: walletConnectInfo.zelid,
      signatureLength: walletConnectInfo.signature?.length,
      loginPhraseLength: walletConnectInfo.loginPhrase?.length,
    })

    console.log('[Login] Calling verifyLogin API...')
    const response = await IDService.verifyLogin(walletConnectInfo)
    console.log('[Login] verifyLogin response:', response.data)

    if (response.data.status === "success") {
      console.log('[Login] Login successful!')
      fluxStore.setPrivilege(response.data.data.privilage)
      fluxStore.setZelid(walletConnectInfo.zelid)
      localStorage.setItem('loginType', 'walletconnect')
      localStorage.setItem("zelidauth", qs.stringify(walletConnectInfo))
      emit('loginSuccess')
      showToast("success", response.data.data.message)
    } else {
      console.log('[Login] Login failed:', response.data.data.message || response.data.data)
      showToast(response.data.status, response.data.data.message || response.data.data)
    }
  } catch (error) {
    console.log('[Login] Login error:', error)
    showToast("error", error.message || t("core.login.walletConnectError"))
  }
}

const isSigning = ref(false)

const initMetamask = async () => {
  try {
    if (isSigning.value) {
      showToast("warning", t("core.login.metamaskPendingRequest"))
      
      return
    }

    isSigning.value = true

    await getZelIdLoginPhrase()

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
    showToast("error", error.message || t("core.login.metamaskError"))
  } finally {
    isSigning.value = false
  }
}

const initSSP = async () => {
  try {
    if (!window.ssp) return showToast("error", t("core.login.sspNotInstalled"))
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
    showToast("warning", t("core.login.signMessageFailed"))
  }
}

const handleBackendChange = () => {
  console.log("backendURLChanged triggered")
  backendURL.value = localStorage.getItem("backendURL") || getDetectedBackendURL()
}

watch(emailLoginFormRef, _ => {
  emailLoginFormRef.value?.reset()
})

watch(() => loginForm.value.loginPhrase, () => {
  initClipboard()
})

onMounted(async () => {
  eventBus.on("backendURLChanged", handleBackendChange)
  getZelIdLoginPhrase()
  initClipboard()
})

onUnmounted(() => {
  if (clipboardInstance) {
    clipboardInstance.destroy()
  }
  if (websocket.value) websocket.value.close()
  eventBus.off("backendURLChanged", handleBackendChange)
})
</script>

<style scoped>
.login-modal-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  padding: 24px;
}

.login-content {
  width: 100%;
  min-width: 400px;
  max-width: 600px;
}

/* FluxCloud-style Logo */
.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  animation: logo-float 3s ease-in-out infinite, logo-glow 2s ease-in-out infinite;
}

@keyframes logo-float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes logo-glow {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(43, 97, 209, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 40px rgba(43, 97, 209, 1));
  }
}

/* Main Login Card */
.login-card {
  border-radius: 24px !important;
  padding: 40px;
}

/* Processing State */
.processing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 300px;
}

/* Login Method Buttons */
.login-methods-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.login-method-button {
  height: 35px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  padding: 0 12px !important;
  min-width: auto !important;
  width: 100%;
}

/* OR Divider */
.or-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
}

.or-text {
  color: #9e9e9e;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* Email Login Button */
.email-login-button {
  height: 44px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  font-size: 15px !important;
  font-weight: 500 !important;
  margin-bottom: 16px !important;
}

/* Other Methods Container */
.other-methods-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
}

.other-method-button {
  height: 36px !important;
  border-radius: 6px !important;
  text-transform: none !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  padding: 0 12px !important;
  min-width: auto !important;
}

.google-button {
  color: #1f1f1f !important;
}

.apple-button {
  color: #ffffff !important;
}

.button-icon {
  margin-right: 6px;
}

.button-text {
  white-space: nowrap;
  font-size: inherit;
}

/* Sign Up Text */
.signup-text {
  margin-top: 8px;
  margin-bottom: 16px;
}

.signup-text .text-body-2 {
  color: rgb(var(--v-theme-on-surface));
  margin-right: 6px;
}

.signup-link {
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
}

.signup-link:hover {
  text-decoration: underline;
  opacity: 0.8;
}

/* Terms of Service */
.tos-text {
  text-align: center;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.tos-text a {
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  font-weight: 600;
}

.tos-text a:hover {
  text-decoration: underline;
  opacity: 0.8;
}

/* Expansion Panels */
.login-panels {
  margin-bottom: 24px;
}

.panel-title {
  display: flex;
  align-items: center;
  font-weight: 500;
}

/* Wallet Header */
.wallet-header {
  position: relative;
  margin-bottom: 24px;
}

.wallet-header .back-button {
  position: absolute;
  left: -12px;
  top: -8px;
}

/* Wallet Login Info */
.wallet-login-info {
  font-size: 18px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  text-align: center;
  padding-top: 40px;
  padding-bottom: 0px;
  margin-bottom: 16px;
}

/* Manual Login Info */
.manual-login-info {
  font-size: 18px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  text-align: center;
  padding-top: 40px;
  padding-bottom: 0px;
  margin-bottom: 16px;
}

/* Sign Up Dialog */
.signup-dialog {
  border-radius: 24px !important;
  overflow: hidden;
}

.signup-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 18px;
  font-weight: 600;
  padding: 12px 20px 12px 0;
  min-height: auto;
}

/* Wallet Icons */
.wallet-icons-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 8px;
}

.wallet-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  transition: all 0.2s ease;
}

.wallet-item:hover {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-2px);
}

.wallet-icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
  transition: all 0.2s ease;
}

.wallet-item:hover .wallet-icon {
  transform: scale(1.1);
}

.wallet-label {
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

/* Footer Links */
.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  font-size: 14px;
}

.footer-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.footer-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.link-separator {
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Spinner Animation */
.modern-spinner-container {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modern-spinner-outer {
  position: absolute;
  animation: spin-slow 2s linear infinite;
}

.modern-spinner-inner {
  position: absolute;
  animation: spin-fast 1s linear infinite reverse;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin-fast {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 600px) {
  .login-modal-container {
    padding: 16px;
  }

  .login-content {
    min-width: auto;
    max-width: 100%;
  }

  .login-card {
    padding: 24px 20px;
  }

  .login-method-button {
    font-size: 12px !important;
    height: 40px !important;
  }

  .wallet-icons-grid {
    gap: 12px;
  }

  .wallet-icon {
    width: 56px;
    height: 56px;
  }

  .wallet-login-info {
    font-size: 16px;
    padding-top: 32px;
  }

  .manual-login-info {
    font-size: 16px;
    padding-top: 32px;
  }

  .signup-text {
    font-size: 13px;
  }

  .signup-link {
    font-size: 13px;
  }
}
</style>

<style>
/* Global overrides */
.v-btn,
.v-chip,
.v-card-title,
.v-avatar {
  text-transform: none !important;
}

.v-expansion-panel-title {
  font-weight: 500 !important;
}
</style>
