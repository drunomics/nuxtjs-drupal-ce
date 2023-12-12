import { defineNuxtConfig } from 'nuxt/config'
import DrupalCe from '..'

export default defineNuxtConfig({
  modules: [
    DrupalCe
  ],
  drupalCe: {
    baseURL: 'https://8080-drunomics-lupusdecouple-ih6hr5d3dwc.ws-eu106.gitpod.io/ce-api',
    menuBaseUrl: 'https://8080-drunomics-lupusdecouple-ih6hr5d3dwc.ws-eu106.gitpod.io/ce-api'
  }
})
