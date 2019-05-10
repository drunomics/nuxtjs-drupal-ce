<?php


namespace Drupal\custom_elements;

/**
 * Trait for custom elements view displays.
 */
trait CustomElementsEntityViewDisplayTrait {

  use CustomElementGeneratorTrait;

  /**
   * Builds entities using custom elements.
   *
   * @param array[] $build_list
   *   The build list.
   * @param \Drupal\Core\Entity\EntityInterface[] $entities
   *   The entities.
   */
  public function buildMultipleViaCustomElements(array &$build_list, array $entities) {
    foreach ($entities as $id => $entity) {
      // We cannot do much here, since we cannot override existing build
      // defaults. Because of that, we do the real work in
      // custom_elements_entity_view_display_alter() later on.
      $build = &$build_list[$id];
      $build['#custom_elements_enabled'] = TRUE;
      $build['#entity_type_id'] = $entity->getEntityTypeId();
      // This is already there by default, but write again to enforce it.
      $build['#' . $entity->getEntityTypeId()] = $entity;
      $build['#view_mode'] = $this->originalMode;
      $build['#custom_element'] = $this->getCustomElementGenerator()->generate($entity, $build['#view_mode']);

      // Add layout build sections unless already done so.
      if (isset($build['_layout_builder']) && empty($build['#custom_element']->getSlot('sections'))) {
        $build['#custom_element']->setSlot('sections', $build['_layout_builder']);
      }
    }
  }

}