<?php

namespace Drupal\custom_elements;

use Drupal\layout_builder\Entity\LayoutBuilderEntityViewDisplay;

/**
 * Customized entity display to take over entity rendering.
 */
class CustomElementsEntityViewDisplay extends LayoutBuilderEntityViewDisplay {

  /**
   * Returns whether the entity is rendered via custom elements.
   *
   * @return bool
   */
  public function isCustomElementsEnabled() {
    return (bool) $this->getThirdPartySetting('custom_elements', 'enabled', 0);
  }

  /**
   * {@inheritDoc}
   */
  public function buildMultiple(array $entities) {
    if (!$this->isCustomElementsEnabled()) {
      return parent::buildMultiple($entities);
    }

    $build_list = [];
    if ($this->isLayoutBuilderEnabled()) {
      $build_list = parent::buildMultiple($entities);
    }

    foreach ($entities as $id => $entity) {
      /** @var \Drupal\Core\Entity\EntityInterface $entity */
      // We cannot do much here, since we cannot override existing build
      // defaults. Because of that, we do the real work in
      // custom_elements_entity_view_display_alter() later on.
      $build = &$build_list[$id];
      $build['#custom_elements_enabled'] = TRUE;
      $build['#entity_type_id'] = $entity->getEntityTypeId();
      // This is already there by default, but write again to enforce it.
      $build['#' . $entity->getEntityTypeId()] = $entity;
      $build['#view_mode'] = $this->originalMode;

      /** @var \Drupal\custom_elements\CustomElementGenerator $generator */
      $generator = \Drupal::service('custom_elements.generator');
      $build['#custom_element'] = $generator->generate($entity, $build['#view_mode']);

      // Add layout build sections unless already done so.
      if (isset($build['_layout_builder']) && empty($build['#custom_element']->getSlot('sections'))) {
        $build['#custom_element']->setSlot('sections', $build['_layout_builder']);
      }
    }
    return $build_list;
  }

}
