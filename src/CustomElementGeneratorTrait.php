<?php

namespace Drupal\custom_elements;

/**
 * Allows setter injection and simple usage of the service.
 */
trait CustomElementGeneratorTrait {

  /**
   * Custom element generator.
   *
   * @var \Drupal\custom_elements\CustomElementGenerator
   */
  protected $customElementGenerator;
  /**
   * Sets custom element generator.
   *
   * @param \Drupal\custom_elements\CustomElementGenerator $custom_element_generator
   *   Custom element generator.
   *
   * @return $this
   */
  public function setCustomElementGenerat(CustomElementGenerator $custom_element_generator) {
    $this->customElementGenerator = $custom_element_generator;
    return $this;
  }
  /**
   * Gets custom element generator.
   *
   * @return \Drupal\custom_elements\CustomElementGenerator
   *   Custom element generator.
   */
  public function getCustomElementGenerator() {
    if (empty($this->customElementGenerator)) {
      $this->customElementGenerator = \Drupal::service('custom_elements.generator');
    }
    return $this->customElementGenerator;
  }

}
