<?php

namespace Drupal\custom_elements;

/**
 * Allows setter injection and simple usage of the service.
 */
trait CustomElementNormalizerTrait {

  /**
   * The custom element normalizer.
   *
   * @var \Drupal\custom_elements\CustomElementNormalizer
   */
  protected $customElementNormalizer;

  /**
   * Sets the custom element normalizer.
   *
   * @param \Drupal\custom_elements\CustomElementNormalizer $custom_element_normalizer
   *   Custom element normalizer.
   *
   * @return $this
   */
  public function setCustomElementNormalizer(CustomElementNormalizer $custom_element_normalizer) {
    $this->customElementNormalizer = $custom_element_normalizer;
    return $this;
  }

  /**
   * Gets the custom element normalizer.
   *
   * @return \Drupal\custom_elements\CustomElementNormalizer
   *   Custom element normalizer.
   */
  public function getCustomElementNormalizer() {
    if (empty($this->customElementNormalizer)) {
      $this->customElementNormalizer = \Drupal::service('custom_elements.normalizer');
    }
    return $this->customElementNormalizer;
  }

}
