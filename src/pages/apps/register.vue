<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardText>
          <SubscriptionManager 
            :app-spec="newAppSpec" 
            new-app
            :execute-local-command="executeLocalCommand" 
          />
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFluxStore } from '@/stores/flux'

// Initialize flux store
const fluxStore = useFluxStore()

// Generate a random port between min and max
function generateRandomPort(min = 30000, max = 39999) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Create a new app specification with default values
const newAppSpec = ref({
  version: 8, // Use latest version
  name: '',
  description: '',
  owner: '',
  contacts: '',
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
      ports: [generateRandomPort()], // Start with one random port
      domains: [],
      environmentParameters: '',
      commands: [],
      containerPort: 80,
      containerData: '',
      cpu: 0.1,
      ram: 128,
      hdd: 1,
      tiered: false,
      repoauth: '',
      secrets: '',
    },
  ],
})

// Execute local command function
async function executeLocalCommand(endpoint, data = null, headers = null, isPost = false) {
  try {
    const result = await fluxStore.executeCommand(endpoint, data, headers, isPost)
    
    return result
  } catch (error) {
    console.error('Command execution failed:', error)
    throw error
  }
}

onMounted(() => {
  // Set default owner from current user if available
  const zelidauth = localStorage.getItem('zelidauth')
  if (zelidauth) {
    try {
      const auth = JSON.parse(zelidauth)
      newAppSpec.value.owner = auth.zelid || ''
    } catch (error) {
      console.warn('Failed to parse zelidauth:', error)
    }
  }
})
</script>

<style scoped>
/* Add any custom styles here if needed */
</style>
