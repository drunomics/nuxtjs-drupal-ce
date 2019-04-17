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
   * Sets the slots of th element.
   *
   * @param array[] $slots
   *   The slots as returned by getSlots().
   */
  public function setSlots(array $slots) {
    $this->slots = $slots;
  }

  /**
   * Gets the element slots, keyed by slot name.
   *
   * @return \Drupal\Core\Render\Markup[]|string[]
   *   Array of slots, keyed by slot name.
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
   * Sets the slot with a single custom element.
   *
   * This method avoids a wrapper div as necessary by the helper for multiple
   * elements.
   *
   * @param $key
   *   Name of the slot to set value for.
   * @param \Drupal\custom_elements\CustomElement $nestedElement
   *   The nested custom element.
   */
  public function setSlotFromCustomElement($key, CustomElement $nestedElement) {
    // Render slots without wrapping tag.
    $content = [];
    foreach ($nestedElement->getSlots() as $key => $slot) {
      // Mimic what custom-elements.html.twig does by default.
      $slot['attributes']->setAttribute('slot', $key);
      $render_key = is_array($slot['content']) ? 'content' : '#markup';

      $content[$key][] = [
        '#prefix' => '<' . $slot['tag'] . $slot['attributes'] . '>',
        $render_key => $slot['content'],
        '#suffix' => '</' . $slot['tag'] . '>',
      ];

    }
    $this->setSlot($key, $content,  $nestedElement->getPrefixedTag(), $nestedElement->getAttributes());
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
    foreach ($nestedElements as $delta => $nestedElement) {
      $content[$delta] = [
        '#theme' => 'custom_element',
        '#custom_element' => $nestedElement,
      ];
    }
    $this->setSlot($key, $content, $tag, $attributes);
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
    $tag = str_replace('_', '-', $tag);
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
   *   The attributes.
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
   *   The tag prfeix.
   */
  public function setTagPrefix($tagPrefix) {
    $tagPrefix = str_replace('_', '-', $tagPrefix);
    $this->tagPrefix = $tagPrefix;
  }

  /**
   * Returns the tag including tag-prefix.
   *
   * @return string
   */
  public function getPrefixedTag() {
    return $this->tagPrefix . $this->tag;
  }

}
