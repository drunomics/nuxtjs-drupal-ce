import Vue from 'vue'

class DrupalCe {

  constructor(axios, context, options) {
    this.options = options
    this.context = context
    /**
     * The axios instance for communicating with Drupal.
     */
    this.$axios = axios
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
      const { data, status } = await this.$axios.get(path, config)
      if (!data.title || !data.content) {
        return this.context.error({
          statusCode: 422,
          message: 'Malformed API response. Please make sure to install Custom Elements renderer: https://www.drupal.org/project/lupus_ce_renderer'})
      }
      data.statusCode = status
      this.context.store.dispatch('drupalCe/processPageResponse', data)
    } catch (error) {
      if (error.response) {
        // Request made and server responded. If we get a proper Drupal error
        // page, apply it and propagate the error code.
        if (error.response.data && error.response.data.title && error.response.data.content) {
          error.response.data.statusCode = error.response.status
          this.context.store.dispatch('drupalCe/processPageResponse', error.response.data)
        } else {
          this.context.error({ statusCode: error.response.status, message: error.message })
        }
      } else if (error.request) {
        // The request was made but no response was received. Usually this
        // means a network error.
        this.context.error({ statusCode: 503, message: error.message })
      } else {
        // Some other error happened, so be verbose about it.
        this.context.error({ statusCode: 400, message: error.message })
      }
    }
  }

  /**
   * Creates Drupal content component
   */
  contentComponent (content) {
    return { name: 'DrupalContent', template: `<div>${content}</div>` }
  }
}

const storeModule = {
  namespaced: true,
  state: () => ({
    page: {
      title: null,
      statusCode: null,
      metadata: {
        meta: [],
        link: []
      },
      content: 'No content loaded.',
      breadcrumbs: [],
      localTasks: null,
      settings: {}
    },
    messages: []
  }),
  getters: {},
  mutations: {
    page (state, page) {
      const { meta = [], link = [] } = page.metatags
      page.metatags.meta = [...meta].map((metaObject) => {
        // Simply take the first key as hid, e.g. 'name'.
        const firstKey = Object.keys(metaObject)[0]
        metaObject.hid = firstKey === 'property' ? metaObject[firstKey] : `${firstKey}:${metaObject[firstKey]}`
        return metaObject
      })
      page.metatags.link = [...link].map((linkObject) => {
        // Simply take the first key as hid, e.g. 'name'.
        const firstKey = Object.keys(linkObject)[0]
        linkObject.hid = `${firstKey}:${linkObject[firstKey]}`
        return linkObject
      })
      state.page = page
    },
    messages (state, messages) {
      state.messages = messages
    },
    removeMessage (state, id) {
      state.messages.splice(id, 1)
    },
    addMessage (state, message) {
      state.messages.push(message)
    }
  },
  actions: {
    /**
     * Updates store based upon response data.
     */
    processPageResponse ({ commit }, { statusCode, title, content, breadcrumbs, metatags, messages, local_tasks, settings }) {
      const page = {
        statusCode,
        title,
        content,
        breadcrumbs: Array.isArray(breadcrumbs) ? breadcrumbs : [],
        metatags,
        localTasks: local_tasks,
        settings
      }
      commit('page', page)
      commit('messages', messages)
    },
    removeMessage ({ commit }, id) {
      commit('removeMessage', id)
    },
    addMessage ({ commit }, message) {
      commit('addMessage', message)
    }
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

  context.store.registerModule('drupalCe', storeModule)

  // Create a custom axios instance, optionally having custom options.
  const $axiosDrupal = $axios.create(options.axios)
  $axiosDrupal.setBaseURL(options.baseURL)

  const drupal = new DrupalCe($axiosDrupal, context, options)

  inject('drupal', drupal)
}
