export const actions = {
  async nuxtServerInit ({ dispatch }, context) {
    await context.$drupal.fetchMenu('main')
  }
}
