import Vue from 'vue'

// Filter for temporarily fix a Vue bug with special HTML characters
// Source: https://github.com/vuejs/vue/blob/v2.6.14/src/compiler/parser/entity-decoder.js
let decoder

Vue.filter('decodeSpecialChars', (value) => {
  decoder = decoder || document.createElement('div')
  decoder.innerHTML = value
  return decoder.textContent
})

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
      page_layout: 'default',
      settings: {}
    },
    messages: [],
    menus: {}
  }),
  getters: {},
  mutations: {
    // eslint-disable-next-line camelcase
    page (state, { statusCode, title, content, breadcrumbs, metatags, local_tasks, page_layout, settings }) {
      const page = {
        statusCode,
        title,
        content,
        breadcrumbs: Array.isArray(breadcrumbs) ? breadcrumbs : [],
        metatags,
        // eslint-disable-next-line camelcase
        localTasks: local_tasks,
        // eslint-disable-next-line camelcase
        page_layout,
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
      state.page = { ...page }
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
      // Update the menu in a way it works well with Vue's reactivity.
      // See https://vuex.vuejs.org/guide/mutations.html#mutations-follow-vue-s-reactivity-rules
      state.menus = { ...state.menus, [name]: data }
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
        // Ensure the response looks valid. Either title or content keys
        // must be set, or it's a redirect.
        if (!(data.title || data.content) && !data.redirect) {
          return context.error({
            statusCode: 422,
            message: 'Malformed API response. Please make sure to install Custom Elements renderer: https://www.drupal.org/project/lupus_ce_renderer'
          })
        }
        if (data.redirect) {
          // If the URL is external OR the page is rendered server-side,
          // then redirect without adding the base URL.
          if (data.redirect.external || process.server) {
            // Redirect to the absolute URL.
            context.redirect(data.redirect.statusCode, data.redirect.url)
          } else {
            context.app.router.replace(data.redirect.url).catch((error) => {
              // Ignore error when we are redirected to the current page, there
              // is nothing to do in this case.
              if (error.name !== 'NavigationDuplicated') {
                throw error
              }
            })
          }
        } else {
          data.statusCode = status
          commit('page', data)
          commit('messages', data.messages)
        }
      } catch (error) {
        if (error.response) {
          // Request made and server responded. If we get a proper Drupal error
          // page, apply it and propagate the error code.
          if (error.response.data && error.response.data.title && error.response.data.content) {
            error.response.data.statusCode = error.response.status
            // Set the statusCode for the error
            if (process.server && context.res.statusCode) {
              context.res.statusCode = error.response.data.statusCode
            }
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
  context.store.registerModule('drupalCe', storeModule)

  const { $config, $axios } = context
  const options = JSON.parse('<%= JSON.stringify(options) %>')

  // Make sure to apply the baseURL from runtime-config if set.
  const runtimeConfig = $config['drupal-ce'] || {}
  options.baseURL = runtimeConfig.baseURL || options.baseURL

  if (!$axios) {
    // eslint-disable-next-line no-console
    console.error('Error: Axios not found. Remove @nuxtjs/axios from your Nuxt modules or make sure it\'s listed before nuxtjs-drupal-ce.')
    return
  }

  // Create a custom axios instance, optionally having custom options.
  const $axiosDrupal = $axios.create(options.axios)
  options.baseURL = process.browser && options.axios.browserBaseURL ? options.axios.browserBaseURL : options.baseURL
  $axiosDrupal.setBaseURL(options.baseURL)

  const drupal = new DrupalCe($axiosDrupal, context, options)

  inject('drupal', drupal)
}
