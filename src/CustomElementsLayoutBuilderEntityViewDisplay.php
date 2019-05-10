<?php

namespace Drupal\custom_elements;

use Drupal\layout_builder\Entity\LayoutBuilderEntityViewDisplay;

/**
 * Customized entity display to take over entity rendering from layout builder.
 */
class CustomElementsLayoutBuilderEntityViewDisplay extends LayoutBuilderEntityViewDisplay {

  use CustomElementsEntityViewDisplayTrait;

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
    $this->buildMultipleViaCustomElements($build_list, $entities);
    return $build_list;
  }

}
