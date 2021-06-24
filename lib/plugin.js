class DrupalCe {
  constructor (axios, context, options) {
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
  async fetchPage (path, config = {}) {
    await this.context.store.dispatch('drupalCe/getPage', { path, config, context: this.context, options: this.options, axios: this.$axios })
  }

  /**
   * Fetches a menu.
   *
   * @param name
   *   The name of the menu to fetch.
   * @param {AxiosRequestConfig} config
   *
   * @returns {Promise<void>}
   */
  async fetchMenu (name, config = {}) {
    await this.context.store.dispatch('drupalCe/getMenu', { name, config, context: this.context, options: this.options, axios: this.$axios })
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
    messages: [],
    menus: {
      main: [],
      footer: []
    }
  }),
  getters: {},
  mutations: {
    // eslint-disable-next-line camelcase
    page (state, { statusCode, title, content, breadcrumbs, metatags, local_tasks, settings }) {
      const page = {
        statusCode,
        title,
        content,
        breadcrumbs: Array.isArray(breadcrumbs) ? breadcrumbs : [],
        metatags,
        localTasks: local_tasks,
        settings
      }
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
      // Make messages be flat array with message type.
      messages = Object.assign({ success: [], error: [] }, messages)
      state.messages = [
        ...messages.error.map(message => ({ type: 'error', message })),
        ...messages.success.map(message => ({ type: 'success', message }))
      ]
    },
    removeMessage (state, id) {
      state.messages.splice(id, 1)
    },
    addMessage (state, message) {
      state.messages.push(message)
    },
    setMenu (state, { name, data }) {
      state.menus[name] = data
    }
  },
  actions: {
    /**
     * Updates store based upon response data.
     */

    removeMessage ({ commit }, id) {
      commit('removeMessage', id)
    },
    addMessage ({ commit }, message) {
      commit('addMessage', message)
    },
    async getMenu ({ commit }, { name, config, context, options, axios }) {
      config.params = config.params ?? {}
      const path = options.menuEndpoint.replace('$$$NAME$$$', name)
      try {
        const { data } = await axios.get(path, config)
        commit('setMenu', { name, data })
      } catch (error) {
        // Ignore the error and only log it, so the site stays functional.
        // eslint-disable-next-line no-console
        console.log(error)
      }
    },
    async getPage ({ commit }, { path, config, context, options, axios }) {
      try {
        config.params = config.params ?? {}
        if (options.addRequestFormat) {
          config.params._format = config.params._format ?? 'custom_elements'
        }
        if (options.addRequestContentFormat) {
          config.params._content_format = config.params._content_format ?? this.options.addRequestContentFormat
        }

        const { data, status } = await axios.get(path, config)
        if (!data.title || !data.content) {
          return context.error({
            statusCode: 422,
            message: 'Malformed API response. Please make sure to install Custom Elements renderer: https://www.drupal.org/project/lupus_ce_renderer'
          })
        }
        data.statusCode = status
        commit('page', data)
        commit('messages', data.messages)
      } catch (error) {
        if (error.response) {
          // Request made and server responded. If we get a proper Drupal error
          // page, apply it and propagate the error code.
          if (error.response.data && error.response.data.title && error.response.data.content) {
            error.response.data.statusCode = error.response.status
            commit('page', error.response.data)
            commit('messages', error.response.data.messages)
          } else {
            context.error({ statusCode: error.response.status, message: error.message })
          }
        } else if (error.request) {
          // The request was made but no response was received. Usually this
          // means a network error.
          context.error({ statusCode: 503, message: error.message })
        } else {
          // Some other error happened, so be verbose about it.
          context.error({ statusCode: 400, message: error.message })
        }
      }
    }
  }
}

export default function (context, inject) {
  const { $config, $axios } = context
  const options = JSON.parse('<%= JSON.stringify(options) %>')

  // Support overriding the baseURL on runtime. This is used by tests.
  // Else, one would just configure the baseURL using env vars in nuxt config.
  const runtimeConfig = $config['drupal-ce'] || {}
  options.baseURL = runtimeConfig.baseURL || options.baseURL

  if (!$axios) {
    // eslint-disable-next-line no-console
    console.error('Error: Axios not found. Remove @nuxtjs/axios from your Nuxt modules or make sure it\'s listed before nuxtjs-drupal-ce.')
    return
  }

  context.store.registerModule('drupalCe', storeModule)

  // Create a custom axios instance, optionally having custom options.
  const $axiosDrupal = $axios.create(options.axios)
  options.baseURL = process.browser && options.axios.browserBaseURL ? options.axios.browserBaseURL : options.baseURL
  $axiosDrupal.setBaseURL(options.baseURL)

  const drupal = new DrupalCe($axiosDrupal, context, options)

  inject('drupal', drupal)
}
