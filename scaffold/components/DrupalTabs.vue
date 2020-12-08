<template>
  <div class="drupal-tabs">
    <ul
      v-if="tabs.primary"
      class="tabs primary"
    >
      <li v-for="tab in tabs.primary" :key="tab.url">
        <a
          :href="tab.url"
          tabindex="-1"
          :class="{'is-active': tab.active}"
        >
          {{ tab.label }}
          <span v-if="tab.active" class="visually-hidden">
            (active tab)
          </span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'DrupalTabs',
  props: {
    tabs: {
      type: [Object, Array],
      required: true
    }
  }
}
</script>

<style lang="css" scoped>
.drupal-tabs {
  margin: 0 auto;
  width: 100%;
  padding: 1em;
}

.tabs {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
  border-bottom: 1px solid #dedede;
}

a {
  display: inline-block;
  text-transform: uppercase;
  padding: 0.3em 0.8em;
  text-decoration: none;
  color: #888;
  border: 1px solid transparent;
}

a:hover {
 border-bottom-color: #444;
}

.visually-hidden {
  position: absolute;
  overflow: hidden;
  clip: rect(0 0 0 0);
  height: 1px;
  width: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
}

</style>
