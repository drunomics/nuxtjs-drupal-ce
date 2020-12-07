// const fs = require('fs')

// const fileContent = `
// <template>
//   <main role="main" class="page">
//     <drupal-tabs v-if="page.localTasks" :tabs="page.localTasks" />
//     <component :is="$drupal.contentComponent()" />
//   </main>
// </template>

// <script>
// import { DrupalTabs } from 'components/Drupal'
// import { WithAnalytics } from '@lupus/mixins/LupusPages'
// import alterInternalLinks from '~/mixins/alterInternalLinks'

// export default {
//   name: 'PageDefault',
//   components: {
//     DrupalTabs
//   },
//   mixins: [
//     WithAnalytics,
//     alterInternalLinks
//   ],
//   async asyncData ({ route, $drupal }) {
//     const page = await $drupal.fetchPage(route.path)
//     return { page }
//   },
//   head () {
//     return {
//       title: this.page.title,
//       meta: this.page.metadata.meta,
//       link: this.page.metadata.link
//     }
//   }
// }
// </script>
// `

// // The absolute path of the new file with its name
// const filepath = '../../pages/_.vue'

// fs.writeFile(filepath, fileContent, (err) => {
//   if (err) { throw err }
// })

console.log('I ran')
