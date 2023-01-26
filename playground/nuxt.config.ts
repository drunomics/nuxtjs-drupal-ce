import { defineNuxtConfig } from 'nuxt/config'
import DrupalCe from '..'

export default defineNuxtConfig({
  modules: [
    DrupalCe
  ],
  drupalCe: {
    baseURL: process.env.DRUPAL_BASE_URL || 'https://8080-drunomics-lupusdecouple-xxxxxxxxxx.ws-euxx.gitpod.io/ce-api'
  }
})
