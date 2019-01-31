<?php

/**
 * @file
 * Hooks specific to the module.
 */

/**
 * Allows altering custom elements before they are rendered.
 *
 * @param \Drupal\custom_elements\CustomElement $element
 *   The custom element to be rendered.
 */
function hook_custom_element_alter(\Drupal\custom_elements\CustomElement $element) {
  $element->setTagPrefix('myVendor');
}
