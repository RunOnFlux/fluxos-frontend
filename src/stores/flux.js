// src/stores/flux.js
import { defineStore } from "pinia"
import Api from "@/services/ApiClient"

export const useFluxStore = defineStore("flux", {
  state: () => ({
    userconfig: {
      zelid: "",
      externalip: "",
    },
    config: {
      fluxTeamFluxID: "",
      fluxSupportTeamFluxID: "",
      apiPort: "",
    },
    privilege: "none",
    zelid: "",
    fluxVersion: "",
    loginType: "",
    xdaoOpen: 0,
  }),

  getters: {
    isXdaoOpen: state => state.xdaoOpen,
  },

  actions: {
    async fetchFluxIDs() {
      try {
        const response = await Api().get("/flux/fluxids")
    
        if (!response?.data?.data) {
          console.warn("⚠️ Unexpected API structure:", response.data)
          
          return
        }
    
        const { fluxTeamFluxID, fluxSupportTeamFluxID } = response.data.data

        console.log("📦 Extracted IDs:", fluxTeamFluxID, fluxSupportTeamFluxID)
    
        this.setFluxTeamFluxID(fluxTeamFluxID)
        this.setFluxSupportTeamFluxID(fluxSupportTeamFluxID)
      } catch (error) {
        console.error("❌ Failed to fetch Flux IDs:", error)
      }
    },    

    setPrivilege(privilege) {
      this.privilege = privilege
    },

    setZelid(zelid) {
      this.zelid = zelid
    },

    setFluxVersion(version) {
      this.fluxVersion = version
    },

    setUserZelid(zelid) {
      this.userconfig.zelid = zelid
    },

    setUserIp(ip) {
      this.userconfig.externalip = ip
    },

    setFluxPort(port) {
      this.config.apiPort = port
    },

    setXDAOOpen(open) {
      this.xdaoOpen = open
    },

    setFluxTeamFluxID(id) {
      this.config.fluxTeamFluxID = id
    },

    setFluxSupportTeamFluxID(id) {
      this.config.fluxSupportTeamFluxID = id
    },
    setLoginType(type) {
      this.loginType = type
    },
  },
})
