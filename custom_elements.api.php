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
 * @param \Drupal\Core\Entity\EntityInterface $entity
 *   The entity for which the custom element is generated.
 */
function hook_custom_element_entity_alter(\Drupal\custom_elements\CustomElement $element, \Drupal\Core\Entity\EntityInterface $entity) {
  $element->setTagPrefix('myVendor');
}
