import { defineNuxtConfig } from 'nuxt/config'
import DrupalCe from '..'

export default defineNuxtConfig({
  modules: [
    DrupalCe
  ],
  drupalCe: {
    drupalBaseUrl: 'https://8080-drunomics-lupusdecouple-x5qe3h51r0o.ws-eu110.gitpod.io'
  }
})
