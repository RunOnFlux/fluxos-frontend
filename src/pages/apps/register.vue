<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardText>
            <!-- Check if user is logged in -->
            <div v-if="!isLoggedIn">
              <VRow>
                <VCol cols="12" md="8" lg="6" class="mx-auto">
                  <div class="text-center py-8">
                    <!-- Icon Container with gradient background -->
                    <div class="d-flex justify-center mb-3">
                      <VAvatar
                        size="120"
                        color="primary"
                        variant="tonal"
                        class="elevation-3 auth-icon-container"
                      >
                        <VIcon size="60" color="primary" class="auth-icon">
                          mdi-shield-lock-outline
                        </VIcon>
                      </VAvatar>
                    </div>
                  
                    <!-- Title and Description -->
                    <h1 class="text-h4 font-weight-bold mb-3">
                      Sign In Required
                    </h1>
                  
                    <p class="text-body-1 text-medium-emphasis mb-8 px-4">
                      To register and deploy applications on the Flux network, you need to authenticate with your Flux identity.
                    </p>
                  
                    <!-- Features List -->
                    <div class="d-flex justify-center mb-8">
                      <div style="display: inline-block;">
                        <div class="d-sm-flex">
                          <div class="mr-sm-8">
                            <div class="d-flex align-center mb-2">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">Deploy distributed apps</span>
                            </div>
                            <div class="d-flex align-center mb-2">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">Manage resources</span>
                            </div>
                          </div>
                          <div>
                            <div class="d-flex align-center mb-2">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">Monitor performance</span>
                            </div>
                            <div class="d-flex align-center">
                              <VIcon color="success" size="20" class="mr-2 flex-shrink-0">mdi-check-circle</VIcon>
                              <span class="text-body-2 text-no-wrap">Scale globally</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  
                    <!-- Action Buttons -->
                    <div class="d-flex flex-column flex-sm-row justify-center gap-2">
                      <VBtn
                        color="primary"
                        variant="flat"
                        @click="showLogin = true"
                      >
                        <VIcon size="22" class="mr-2">mdi-login-variant</VIcon>
                        Sign In
                      </VBtn>
                      <VBtn
                        variant="flat"
                        href="https://runonflux.io"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <VIcon size="22" class="mr-2">mdi-information-outline</VIcon>
                        Learn More
                      </VBtn>
                    </div>

                    <!-- Help Text -->
                    <p class="text-caption text-medium-emphasis mt-6">
                      New to Flux?
                      <a href="https://docs.runonflux.io" target="_blank" rel="noopener noreferrer" class="text-primary text-decoration-none">
                        Check our documentation
                      </a>
                      to get started.
                    </p>
                  </div>
                </VCol>
              </VRow>
            </div>

            <!-- Show registration form if logged in -->
            <SubscriptionManager
              v-else
              :app-spec="adaptedAppSpec"
              new-app
              :is-redeploy="isRedeploy"
              :execute-local-command="executeLocalCommand"
              @spec-converted="handleSpecConverted"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Login Dialog -->
    <LoginDialog
      v-model="showLogin"
      title="Login Required"
      @loginSuccess="showLogin = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useFluxStore } from '@/stores/flux'
import { storeToRefs } from 'pinia'
import axios from 'axios'
import { getDetectedBackendURL } from '@/utils/backend'
import LoginDialog from '@/components/shared/LoginDialog.vue'

// Initialize flux store
const fluxStore = useFluxStore()
const { privilege } = storeToRefs(fluxStore)

// Check if user is logged in - using privilege from flux store (reactive)
const isLoggedIn = computed(() => privilege.value !== 'none')

// Create a new app specification with default values
// Login dialog state
const showLogin = ref(false)
const isRedeploy = ref(false)

const newAppSpec = ref({
  version: 8, // Use latest version
  name: '',
  description: '',
  owner: '',
  contacts: [],
  instances: 3,
  staticip: false,
  enterprise: '', // Empty for public apps, encrypted content for private apps
  nodes: [], // Empty for public apps, node IPs for v7 private apps
  geolocation: [],
  expire: 22000, // Default expiration
  compose: [
    {
      name: '',
      description: '',
      repotag: '',
      ports: [], // Empty ports array
      containerPorts: [], // Add containerPorts array
      domains: [],
      environmentParameters: [],
      commands: [],
      containerData: '',
      cpu: 0.1,
      ram: 128,
      hdd: 1,
      repoauth: '',
    },
  ],
})

// Spec adapter for SubscriptionManager - creates a mutable reactive copy
// For V3: converts flat format to compose format for UI compatibility
const adaptedAppSpec = ref(null)

// Watch newAppSpec and adapt specs as needed
watch(newAppSpec, spec => {
  console.log('[Spec Adapter] Input spec:', spec)

  if (!spec) {
    console.log('[Spec Adapter] No spec available')
    adaptedAppSpec.value = null
    
    return
  }

  console.log('[Spec Adapter] Spec version:', spec.version)
  console.log('[Spec Adapter] Has compose?', !!spec.compose)
  console.log('[Spec Adapter] Root name:', spec.name)
  console.log('[Spec Adapter] Root description:', spec.description)
  console.log('[Spec Adapter] Root owner:', spec.owner)

  if (spec.version === 3 && !spec.compose) {
    console.log('[Spec Adapter] Converting V3 flat to compose format')
    console.log('[Spec Adapter] Original V3 spec:', JSON.parse(JSON.stringify(spec)))

    // Create a deep mutable copy for SubscriptionManager to modify
    adaptedAppSpec.value = {
      ...JSON.parse(JSON.stringify(spec)),
      compose: [{
        name: spec.name,
        description: spec.description,
        repotag: spec.repotag,
        ports: spec.ports?.map(p => parseInt(p, 10)) || [],
        containerPorts: spec.containerPorts?.map(p => parseInt(p, 10)) || [],
        domains: spec.domains || [],
        environmentParameters: spec.enviromentParameters || [], // V3 typo: enviromentParameters
        commands: spec.commands || [],
        containerData: spec.containerData || '',
        cpu: spec.cpu || 0.1,
        ram: spec.ram || 100,
        hdd: spec.hdd || 1,
        tiered: false,
        repoauth: spec.repoauth || '', // Preserve repository authentication
      }],
      _isV3Original: true,
    }

    console.log('[Spec Adapter] Adapted spec - root name:', adaptedAppSpec.value.name)
    console.log('[Spec Adapter] Adapted spec - root description:', adaptedAppSpec.value.description)
    console.log('[Spec Adapter] Adapted spec - root owner:', adaptedAppSpec.value.owner)
    console.log('[Spec Adapter] Adapted spec - compose[0].name:', adaptedAppSpec.value.compose[0].name)
    console.log('[Spec Adapter] Adapted spec with compose:', JSON.parse(JSON.stringify(adaptedAppSpec.value)))
  } else {
    console.log('[Spec Adapter] Returning deep copy of spec (not V3 or already has compose)')

    // Create a deep copy for other versions too so SubscriptionManager can mutate it
    adaptedAppSpec.value = JSON.parse(JSON.stringify(spec))
  }
}, { immediate: true, deep: true })

// Handle spec conversion from SubscriptionManager
function handleSpecConverted(convertedSpec) {
  console.log('[handleSpecConverted] Received converted spec:', convertedSpec)
  console.log('[handleSpecConverted] Original version:', newAppSpec.value?.version)
  console.log('[handleSpecConverted] New version:', convertedSpec.version)

  // Create a deep reactive copy and remove any adapter flags
  const cleanSpec = JSON.parse(JSON.stringify(convertedSpec))
  delete cleanSpec._isV3Original

  console.log('[handleSpecConverted] Clean spec without flags:', cleanSpec)

  // Update the app spec with the converted version
  newAppSpec.value = cleanSpec

  // The computed adapter will automatically re-run and update adaptedAppSpec
  console.log('[handleSpecConverted] App specification updated to V' + convertedSpec.version)
  console.log('[handleSpecConverted] Fields should now be editable')
}

// Execute local command function
async function executeLocalCommand(
  command,
  postObject = null,
  axiosConfigAux = null,
  skipCache = false,
) {
  try {
    const zelidauth = localStorage.getItem("zelidauth")
    
    if (!zelidauth) {
      throw new Error('Authentication required. Please log in first.')
    }

    const axiosConfig = {
      headers: {
        zelidauth,
        ...(skipCache && { "x-apicache-bypass": "true" }),
        ...(axiosConfigAux?.headers || {}),
      },
    }
    
    // Add any additional config options except headers and timeout (already handled above)
    if (axiosConfigAux) {
      const { headers, timeout, ...otherConfig } = axiosConfigAux
      Object.assign(axiosConfig, otherConfig)
    }

    // Use the backend URL from localStorage or auto-detect it
    const backendURL = localStorage.getItem("backendURL") || getDetectedBackendURL()
    const queryUrl = `${backendURL}${command}`
    
    console.log('Executing command:', command, 'URL:', queryUrl)
    console.log('Backend URL:', backendURL)
    console.log('From localStorage:', localStorage.getItem("backendURL"))
    console.log('Auto-detected:', getDetectedBackendURL())
    console.log('Using zelidauth:', zelidauth ? 'Present' : 'Missing')

    const result = postObject
      ? await axios.post(queryUrl, postObject, axiosConfig)
      : await axios.get(queryUrl, axiosConfig)
      
    console.log('Command result:', result.data)
    
    return result
  } catch (error) {
    console.error('Command execution failed:', error, 'Command:', command)
    console.error('Full error response:', error.response?.data)
    throw error
  }
}

// Watch for login status changes to close dialog when logged in
watch(isLoggedIn, newValue => {
  if (newValue && showLogin.value) {
    showLogin.value = false
  }
})

onMounted(async () => {
  // First restore authentication state
  const zelidauth = localStorage.getItem('zelidauth')
  console.log('zelidauth from localStorage:', zelidauth ? 'Present' : 'Missing')

  if (zelidauth) {
    try {
      // Parse the zelidauth which is in query string format
      const params = new URLSearchParams(zelidauth)
      const zelid = params.get('zelid')
      const privilege = params.get('privilege')
      const loginType = params.get('logintype')

      console.log('Parsed auth data:', { zelid: zelid ? 'Present' : 'Missing', privilege, loginType })

      if (zelid) {
        // Restore flux store state
        fluxStore.setZelid(zelid)
        if (privilege) fluxStore.setPrivilege(privilege)
        if (loginType) fluxStore.setLoginType(loginType)
      }
    } catch (error) {
      console.warn('Failed to restore authentication state:', error)
    }
  }

  // Then check for app specs passed through sessionStorage (from redeploy)
  const redeployData = sessionStorage.getItem('redeploySpecs')
  if (redeployData) {
    try {
      const parsed = JSON.parse(redeployData)
      console.log('🔄 [REDEPLOY] Loading app spec from sessionStorage:', parsed)
      console.log('🔄 [REDEPLOY] Full appspecs object:', JSON.stringify(parsed.appspecs, null, 2))

      // Use nextTick to ensure the assignment happens after component is fully mounted
      await nextTick()

      // Directly assign the imported spec
      newAppSpec.value = parsed.appspecs

      // Check if this is a redeploy operation
      if (parsed.isRedeploy) {
        isRedeploy.value = true
        console.log('🔄 [REDEPLOY] Redeploy mode enabled')
      }

      // Clear sessionStorage immediately after reading
      sessionStorage.removeItem('redeploySpecs')
      console.log('🔄 [REDEPLOY] App spec loaded and sessionStorage cleared')
      console.log('🔄 [REDEPLOY] newAppSpec after assignment:', JSON.stringify(newAppSpec.value, null, 2))
    } catch (error) {
      console.error('❌ [REDEPLOY] Failed to load app spec:', error)
      sessionStorage.removeItem('redeploySpecs')
    }
  } else {
    // If no redeploy data, set owner from auth
    const zelid = fluxStore.zelid || new URLSearchParams(zelidauth)?.get('zelid')
    if (zelid) {
      newAppSpec.value.owner = zelid
      console.log('Set newAppSpec.owner to:', zelid)
    }
  }

  console.log('Final newAppSpec.owner:', newAppSpec.value.owner)
})
</script>

<style scoped>
/* Avatar container animation */
.auth-icon-container {
  animation: float 3s ease-in-out infinite;
  transition: transform 0.3s ease;
}

.auth-icon-container:hover {
  transform: scale(1.1);
}

/* Icon pulse animation */
.auth-icon {
  animation: pulse 2s ease-in-out infinite;
}

/* Float animation */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Pulse animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(0.95);
  }
}

/* Alternative: Glow effect animation */
.auth-icon-container {
  position: relative;
}

.auth-icon-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.4) 0%, transparent 70%);
  animation: glow 3s ease-in-out infinite;
  z-index: -1;
}

@keyframes glow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}
</style>
