<script setup>
import { PerfectScrollbar } from "vue3-perfect-scrollbar"
import { useFluxStore } from "@/stores/flux"
import IDService from "@/services/IDService"
import qs from "qs"
import { useRoute, useRouter } from "vue-router"
import { eventBus } from "@/utils/eventBus"
import { disconnectWalletConnect } from "@/utils/walletService"

const route = useRoute()
const router = useRouter()
const fluxStore = useFluxStore()
const { privilege, zelid } = storeToRefs(fluxStore)

const auth = computed(() => {
  // Force reactivity by accessing zelid from store
  // When zelid changes in store, this will re-evaluate
  const currentZelid = zelid.value

  const zelidauth = localStorage.getItem("zelidauth")

  if (zelidauth) {
    try {
      return qs.parse(zelidauth)
    } catch (error) {
      return {}
    }
  }

  return {}
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
  if (snackbarTimeout) clearTimeout(snackbarTimeout)

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

  requestAnimationFrame(() => {
    snackbar.value.model = true
  })

  snackbarTimeout = setTimeout(() => {
    snackbar.value.model = false
  }, timeout)
}

// TODO: Get type from backend
const userData = {
  id: 1,
  fullName: "John Doe",
  username: "johndoe",
  password: "admin",
  avatar: `${import.meta.env.BASE_URL ?? "/"}images/logo.png`,
  email: "admin@demo.com",
}

async function logout() {
  const zelidauth = localStorage.getItem("zelidauth")
  const loginType = localStorage.getItem("loginType")

  // Clear auth data
  localStorage.removeItem("zelidauth")
  localStorage.removeItem("loginType")
  fluxStore.setPrivilege("none")
  fluxStore.setZelid("")

  // Logout from backend session
  try {
    await IDService.logoutCurrentSession(zelidauth)
  } catch (error) {
    console.error("API error during logout:", error)
  }

  // Logout from the specific authentication provider
  if (loginType === 'sso') {
    // Only logout from Firebase if logged in via SSO (Google/Apple)
    try {
      await firebase.auth().signOut()
      console.log("Firebase logged out successfully")
    } catch (error) {
      console.error("Error during Firebase logout:", error)
    }
  } else if (loginType === 'walletconnect') {
    // Don't disconnect WalletConnect - keep session active for future logins
    // The session will be reused on next login without needing to reconnect
    console.log("WalletConnect session kept active for future logins")
  }
  // For other login types (zelcore, ssp, metamask), no additional cleanup needed

  showToast('success', 'Logged out successfully')
  if (route.path === "/") {
    eventBus.emit("getZelIdLoginPhrase")
  } else {
    await router.push("/")
  }
}

const userProfileList = [
  { type: "divider" },

  // {
  //   type: "navItem",
  //   icon: "tabler-user",
  //   title: "Profile",
  // },
  // {
  //   type: "navItem",
  //   icon: "tabler-settings",
  //   title: "Settings",
  // },
  // {
  //   type: "navItem",
  //   icon: "tabler-file-dollar",
  //   title: "Billing Plan",
  //   badgeProps: {
  //     color: "error",
  //     content: "4",
  //   },
  // },
  // { type: "divider" },

  // {
  //   type: "navItem",
  //   icon: "tabler-currency-dollar",
  //   title: "Pricing",
  // },
  // {
  //   type: "navItem",
  //   icon: "tabler-question-mark",
  //   title: "FAQ",
  // },
]
</script>

<template>
  <VBadge
    v-if="privilege !== 'none'"
    dot
    bordered
    location="bottom right"
    offset-x="1"
    offset-y="2"
    color="success"
  >
    <VAvatar
      size="38"
      class="cursor-pointer"
      :color="!(userData && userData.avatar) ? 'primary' : undefined"
      :variant="!(userData && userData.avatar) ? 'tonal' : undefined"
    >
      <VImg
        v-if="userData && userData.avatar"
        :src="userData.avatar"
      />
      <VIcon
        v-else
        icon="tabler-user"
      />

      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        width="240"
        location="bottom end"
        offset="12px"
      >
        <VList>
          <VListItem>
            <div class="d-flex gap-2 align-center">
              <VListItemAction>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                  bordered
                >
                  <VAvatar
                    :color="!(userData && userData.avatar) ? 'primary' : undefined"
                    :variant="!(userData && userData.avatar) ? 'tonal' : undefined"
                  >
                    <VImg
                      v-if="userData && userData.avatar"
                      :src="userData.avatar"
                    />
                    <VIcon
                      v-else
                      icon="tabler-user"
                    />
                  </VAvatar>
                </VBadge>
              </VListItemAction>

              <div>
                <div class="text-h6 font-weight-medium">
                  {{ (auth?.zelid ?? "").slice(0, 14) + (auth?.zelid ? "..." : "") }}
                </div>
                <VListItemSubtitle class="text-capitalize text-disabled">
                  {{ privilege }}
                </VListItemSubtitle>
              </div>
            </div>
          </VListItem>

          <PerfectScrollbar :options="{ wheelPropagation: false }">
            <template
              v-for="item in userProfileList"
              :key="item.title"
            >
              <VListItem
                v-if="item.type === 'navItem'"
                :to="item.to"
              >
                <template #prepend>
                  <VIcon
                    :icon="item.icon"
                    size="22"
                  />
                </template>

                <VListItemTitle>{{ item.title }}</VListItemTitle>

                <template
                  v-if="item.badgeProps"
                  #append
                >
                  <VBadge
                    rounded="sm"
                    class="me-3"
                    v-bind="item.badgeProps"
                  />
                </template>
              </VListItem>

              <VDivider
                v-else
                class="my-2"
              />
            </template>

            <div class="px-4 py-2">
              <VBtn
                block
                size="small"
                color="error"
                append-icon="tabler-logout"
                @click="logout"
              >
                Logout
              </VBtn>
            </div>
          </PerfectScrollbar>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>

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
