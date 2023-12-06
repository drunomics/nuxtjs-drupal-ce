import { defineNuxtConfig } from 'nuxt/config'
import DrupalCe from '..'

export default defineNuxtConfig({
  modules: [
    DrupalCe
  ],
  drupalCe: {
    baseURL: process.env.DRUPAL_BASE_URL || 'https://8080-drunomics-lupusdecouple-ih6hr5d3dwc.ws-eu106.gitpod.io/ce-api',
    menuBaseUrl: process.env.DRUPAL_BASE_URL || 'https://8080-drunomics-lupusdecouple-ih6hr5d3dwc.ws-eu106.gitpod.io/ce-api',
  }
})
