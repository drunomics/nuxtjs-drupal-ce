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
      metadata: {
        meta: [],
        link: []
      },
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
   * @param path
   *   The path of the page to fetch, relative to the configured base url.
   * @param {AxiosRequestConfig} config
   *
   * @returns {Promise<void>}
   */
  async fetchPage(path, config= null) {
    try {
      config = config ?? {}
      config.params = config.params ?? {}
      if (this.options.addRequestFormat) {
        config.params._format = config.params._format ?? 'custom_elements'
      }
      if (this.options.addRequestContentFormat) {
        config.params._content_format = config.params._content_format ?? this.options.addRequestContentFormat
      }
      const data = await this.$axios.get(path, config).then(res => res.data)
      if (!data.title || !data.content) {
        return this.context.error({
          statusCode: 422,
          message: 'Malformed API response. Please make sure to install Custom Elements renderer: https://www.drupal.org/project/lupus_ce_renderer'})
      }
      this.$currentPage.title = data.title
      this.$currentPage.metadata = this.processMetaData(data.metatags)
      this.$currentPage.content = data.content
      this.$currentPage.breadcrumbs = Array.isArray(data.breadcrumbs) ? data.breadcrumbs : [],
      this.$currentPage.messages = this.processMessages(data.messages)
      this.$currentPage.localTasks = data.local_tasks
      this.$currentPage.settings = data.settings
      return this.$currentPage
    } catch (err) {
      this.context.error(err)
      return err
    }
  }

  /**
   * Generates `hid` keys for metatags and links.
   */
  processMetaData(metadata) {
    const { meta = [], link = [] } = metadata;
    metadata.meta = [...meta].map((metaObject) => {
      // Simply take the first key as hid, e.g. 'name'.
      const firstKey = Object.keys(metaObject)[0]
      metaObject.hid = firstKey == 'property' ? metaObject[firstKey] : `${firstKey}:${metaObject[firstKey]}`
      return metaObject
    })
    metadata.link = [...link].map((linkObject) => {
      // Simply take the first key as hid, e.g. 'name'.
      const firstKey = Object.keys(linkObject)[0]
      linkObject.hid = `${firstKey}:${linkObject[firstKey]}`
      return linkObject
    })
    return metadata
  }

  /**
   * Make messages be flat array with message type.
   */
  processMessages(messages) {
    // Set messages.
    messages = Object.assign({ success: [], error: [] }, messages);
    messages = [
      ...messages.error.map(message => ({ type: 'error', message })),
      ...messages.success.map(message => ({ type: 'success', message }))
    ]
    return messages
  }

  /**
   * Creates Drupal content component
   */
  contentComponent () {
    return { name: 'DrupalContent', template: '<div>' + this.$currentPage.content + '</div>' }
  }
}

export default async function (context, inject) {
  const { $config, $axios } = context

  const runtimeConfig = $config['drupal-ce'] || {}
  const options = JSON.parse(`<%= JSON.stringify(options) %>`)
  options.baseURL = runtimeConfig.baseURL || options.baseURL

  if (!$axios) {
    console.error('Error: Axios not found. Remove @nuxtjs/axios from your Nuxt modules or make sure it\'s listed before nuxtjs-drupal-ce.')
    return
  }

  // Create a custom axios instance, optionally having custom options.
  const $axiosDrupal = $axios.create(options.axios)
  $axiosDrupal.setBaseURL(options.baseURL)

  const drupal = new DrupalCe($axiosDrupal, context, options)

  const { nuxtState = {} } = context || {}

  if (process.client && !nuxtState.drupal) {
    await drupal.fetchPage(context.route.path)
  }

  inject('drupal', drupal)
}
