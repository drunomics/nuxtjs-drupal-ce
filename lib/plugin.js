import Vue from 'vue'

class DrupalCe {

  constructor(axios, context, options) {
    this.options = options;
    this.context = context

    /**
     * The axios instance for communicating with Drupal.
     */
    this.$axios = axios

    /**
     * The data of the current Page (reactive).
     */
    this.$currentPage = Vue.observable({
      title: null,
      metadata: [],
      content: 'No content loaded.',
      breadcrumbs: [],
      messages: [],
      localTasks: null,
      settings: {},
    })

    /**
     * Returns an object for rendering as Vue component.
     */
    this.$currentPage.contentComponent = () => {
      return { name: 'DrupalContent', template: this.$currentPage.content }
    }
  }

  /**
   * Fetches a new page.
   *
   * @param url
   *   The url of the page to fetch, relative to the configured base url.
   *
   * @returns {Promise<void>}
   */
  async fetchPage(url) {
    await this.$axios
      .get(url)
      .then(({ data }) => {
        if (!data.title || !data.content) {
          return this.context.error({ statusCode: 422, message: 'Malformed API response. Please make sure to install Custom Elements renderer: https://www.drupal.org/project/lupus_ce_renderer'})
        }
        this.$currentPage.title = data.title
        this.$currentPage.metadata = data.metadata
        this.$currentPage.content = data.content
        this.$currentPage.breadcrumbs = data.breadcrumbs
        this.$currentPage.messages = data.messages
        this.$currentPage.localTasks = data.localTasks
        this.$currentPage.settings = data.settings
        return this.$currentPage
      })
      .catch((err) => {
        this.context.error(err)
        return err
      })
  }
}

export default async function (context, inject) {
  const { $config, $axios } = context

  const runtimeConfig = $config['drupal-ce'] || {}
  const options = JSON.parse(`<%= JSON.stringify(options) %>`)
  options.baseURL = runtimeConfig.baseURL || options.baseURL

  if (!$axios) {
    console.error('Error: Axios not found. Remove nuxtjs/axios from your Nuxt modules or make sure it\'s listed before @nuxtjs/drupal-ce.')
    return
  }

  // Create a custom axios instance, optionally having custom options.
  const $axiosDrupal = $axios.create(options.axios)
  $axiosDrupal.setBaseURL(options.baseURL)

  const drupal = new DrupalCe($axiosDrupal, context, options)
  inject('drupal', drupal)
}
