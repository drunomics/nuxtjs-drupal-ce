<?php

namespace Drupal\custom_elements;

use Drupal\Core\Template\Attribute;

/**
 * Custom element data model.
 */
class CustomElement {

  /**
   * HTML tag prefix.
   *
   * Used for prefixing a bunch of custom elements the same way.
   *
   * @var string
   */
  protected $tagPrefix;

  /**
   * HTML tag.
   *
   * @var string
   */
  protected $tag = 'div';

  /**
   * List of other attributes.
   *
   * @var array
   */
  protected $attributes = [];

  /**
   * List of slots.
   *
   * @var \Drupal\Core\Render\Markup[]|array[]
   *   Array of slots, keyed slot name. Each entry has the keys 'tag' and
   *   'content'.
   */
  protected $slots = [];

  /**
   * Sanitizes data attribute value - strip html tags.
   *
   * @param string $value
   *   Data attribute value.
   *
   * @return string
   *   Sanitized data attribute value.
   */
  protected function sanitizeAttribute($value) {
    return strip_tags($value);
  }

  /**
   * Gets the element slots, keyed by slot name.
   *
   * @return \Drupal\Core\Render\Markup[]|string[]
   *   Array of slots, keyed slot name.
   */
  public function getSlots() {
    return $this->slots;
  }

  /**
   * Gets slot markup.
   *
   * @param string $key
   *   Name of the slot to get.
   *
   * @return array
   *   An array with two entries:
   *   - tag: The tag to use for rendering the slot.
   *   - content (\Drupal\Core\Render\Markup|string): The string to output.
   */
  public function getSlot($key) {
    return $this->slots[$key] ?? NULL;
  }

  /**
   * Sets value for given slot.
   *
   * @param string $key
   *   Name of the slot to set value for.
   * @param \Drupal\Core\Render\Markup|string $value
   *   Slot markup.
   * @param string $tag
   *   (optional) The tag to use for the slot.
   * @param array $attributes
   *   (optional) Attributes to add to the slot tag.
   */
  public function setSlot($key, $value, $tag = 'div', $attributes = []) {
    $key = str_replace('_', '-', $key);
    $this->slots[$key] = ['tag' => $tag, 'content' => $value, 'attributes' => new Attribute($attributes)];
  }

  /**
   * Sets the slot content from a nested custom elements.
   *
   * @param $key
   *   Name of the slot to set value for.
   * @param \Drupal\custom_elements\CustomElement[] $nestedElements
   *   The nested custom element.
   * @param string $tag
   *   (optional) The tag to use for the slot.
   * @param array $attributes
   *   (optional) Attributes to add to the slot tag.
   */
  public function setSlotFromNestedElements($key, array $nestedElements, $tag = 'div', $attributes = []) {
    $content = [];
    foreach ($nestedElements as $key => $nestedElement) {
      $content[$key] = [
        '#theme' => 'custom_elements',
        '#attributes' => new Attribute($nestedElement->getAttributes()),
        '#slots' => $nestedElement->getSlots(),
        '#tag_prefix' => $nestedElement->getTagPrefix(),
        '#tag' => $nestedElement->getTag(),
      ];
    }
    $this->setSlot($key, $content, $tag, $attributes);
    // Mark the slot as nested so rendering may optimize the output.
    $this->slots[$key]['nested'] = TRUE;
  }

  /**
   * Gets the tag.
   *
   * @return string
   */
  public function getTag() {
    return $this->tag;
  }

  /**
   * Sets the tag.
   *
   * @param string $tag
   *   The tag.
   */
  public function setTag(string $tag) {
    $this->tag = $tag;
  }

  /**
   * Gets value for given attribute.
   *
   * @param string $key
   *   Name of the attribute to get value for.
   *
   * @return string
   */
  public function getAttribute($key) {
    return $this->attributes[$key] ?? NULL;
  }

  /**
   * Sets value for the given attribute.
   *
   * @param string $key
   *   Name of the attribute to set value for.
   * @param string $value
   *   Attribute value.
   */
  public function setAttribute($key, $value) {
    $key = str_replace('_', '-', $key);
    $this->attributes[$key] = $this->sanitizeAttribute($value);
  }

  /**
   * Gets all attributes.
   *
   * @return array
   */
  public function getAttributes() {
    return $this->attributes;
  }

  /**
   * Sets all attributes.
   *
   * @param array $attributes
   */
  public function setAttributes(array $attributes) {
    $this->attributes = $attributes;
  }

  /**
   * Gets the tag prefix.
   *
   * @return string
   */
  public function getTagPrefix() {
    return $this->tagPrefix;
  }

  /**
   * Sets the tag prefix.
   *
   * @param string $tagPrefix
   */
  public function setTagPrefix($tagPrefix) {
    $this->tagPrefix = $tagPrefix;
  }

}
