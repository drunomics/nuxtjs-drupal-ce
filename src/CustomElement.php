<?php

namespace Drupal\custom_elements;

use Drupal\Component\Render\MarkupInterface;
use Drupal\Core\Cache\CacheableDependencyInterface;
use Drupal\Core\Cache\RefinableCacheableDependencyTrait;
use Drupal\Core\Render\Markup;

/**
 * Custom element data model.
 */
class CustomElement implements CacheableDependencyInterface {

  use RefinableCacheableDependencyTrait;

  /**
   * Whether Drupal's "field-" prefixes should be removed.
   *
   * This is a global settings and can be set early in the bootstrap, e.g. from
   * settings.php.
   *
   * @var bool
   */
  public static $removeFieldPrefix = TRUE;

  /**
   * List of no-end tags.
   *
   * @var array
   */
  protected static $noEndTags = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ];

  /**
   * Custom element tag prefix.
   *
   * Used for prefixing a bunch of custom elements the same way.
   *
   * @var string
   */
  protected $tagPrefix;

  /**
   * Custom element tag name.
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
   * Array of slots, represented as array of nested custom elements.
   *
   * @var array[][]
   *   Array of slots, keyed slot name and entry index. Each entry is an array
   *   with the following keys:
   *   - key: Slot name
   *   - weight: Slot weight
   *   - content: Slot markup (MarkupInterface) or element (CustomElement)
   *     object.
   */
  protected $slots = [];

  /**
   * Creates a new custom element.
   *
   * @param string $tag
   *   The element tag name.
   *
   * @return static
   *   The created custom element.
   */
  public static function create($tag = 'div') {
    $element = new static();
    $element->setTag($tag);
    return $element;
  }

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
   * Sets the slots of the element.
   *
   * @param array[] $slots
   *   The slots as returned by getSlots().
   */
  public function setSlots(array $slots) {
    $this->slots = $slots;
  }

  /**
   * Gets the element slots, keyed by slot name and entry index.
   *
   * @return array[][]
   *   Array of slots, keyed slot name and entry index. Each entry is an array
   *   with the following keys:
   *   - key: Slot name
   *   - weight: Slot weight
   *   - content: Slot markup (MarkupInterface) or element (CustomElement)
   *     object.
   */
  public function getSlots() {
    return $this->slots;
  }

  /**
   * Gets a sorted and flattened list of slots.
   *
   * @return \Drupal\custom_elements\CustomElement|\Drupal\Core\Render\Markup[]
   *   A numerically indexed and sorted array of slot arrays as defined
   *   by ::getSlot().
   */
  public function getSortedSlots() {
    $slots = $this->getSlots();
    // Flatten the array.
    $slot_entries = [];
    foreach ($slots as $entries) {
      foreach ($entries as $slot_entry) {
        $slot_entries[] = $slot_entry;
      }
    }
    usort($slot_entries, 'Drupal\Component\Utility\SortArray::sortByWeightElement');
    return $slot_entries;
  }

  /**
   * Gets a slot entry from a the given slot key and index.
   *
   * @param string $key
   *   Name of the slot to get.
   * @param int $index
   *   (optional) The index of the slot entry to retrieve.
   *
   * @return array[][]
   *   Array of slots, keyed slot name and entry index. Each entry is an array
   *   with the following keys:
   *   - key: Slot name
   *   - weight: Slot weight
   *   - content: Slot markup (MarkupInterface) or element (CustomElement)
   *     object.
   */
  public function getSlot($key, $index = 0) {
    return $this->slots[$key][$index] ?? NULL;
  }

  /**
   * Sets a value for the given slot.
   *
   * @param string $key
   *   Name of the slot to set value for.
   * @param \Drupal\Core\Render\MarkupInterface|string $value
   *   Slot value or markup.
   * @param string $tag
   *   (optional) The element tag to use for the slot.
   * @param array $attributes
   *   (optional) Attributes to add to the slot tag.
   * @param int $index
   *   (optional) The index of the slot entry to set. By default, always the
   *   first entry is set. Defaults to 0.
   * @param int $weight
   *   (optional) A weight for ordering output slots. Defaults to 0.
   *
   * @return $this
   */
  public function setSlot($key, $value, $tag = 'div', $attributes = [], $index = 0, $weight = 0) {
    if (in_array($tag, static::$noEndTags) && !empty($value)) {
      throw new \LogicException(sprintf('Tag %s is no-end tag and should not have a content.', $tag));
    }

    // For BC support passing in render arrays as well.
    // @TODO Fix all setSlot calls so that we don't have to handle render
    // arrays and re-enable the following line:
    // throw new \InvalidArgumentException('Setting slot value to an array is not supported. Provide a CustomElement, MarkupInterface or a markup string.');
    if (is_array($value)) {
      $value = render($value);
    }

    $key = $this->fixSlotKey($key);

    if ($value instanceof CustomElement) {
      $this->setSlotFromCustomElement($key, $value, $index, $weight);
      return $this;
    }

    if ($value && !$value instanceof MarkupInterface) {
      $value = Markup::create((string) $value);
    }

    // If markup and attributes are given, we need to wrap the content in another custom element.
    if ($value && ($attributes || $tag != 'div')) {
      $slot = CustomElement::create($tag)
        ->setAttributes($attributes)
        ->addSlot('default', $value);
    }
    // If just markup is given, we can use it directly as slot.
    elseif ($value) {
      $slot = $value;
    }
    // If no value is given, simply create a nested custom element.
    else {
      $slot = CustomElement::create($tag)
        ->setAttributes($attributes);
    }

    $this->slots[$key][$index] = [
      'weight' => $weight,
      'key' => $key,
      'content' => $slot
    ];

    return $this;
  }

  /**
   * Adds a value for the given slot by appending to any pre-existing ones.
   *
   * @param string $key
   *   Name of the slot to set value for.
   * @param \Drupal\Core\Render\Markup|string $value
   *   Slot markup.
   * @param string $tag
   *   (optional) The tag to use for the slot.
   * @param array $attributes
   *   (optional) Attributes to add to the slot tag.
   * @param int $weight
   *   (optional) A weight for ordering output slots. Defaults to 0.
   *
   * @return $this
   */
  public function addSlot($key, $value, $tag = 'div', $attributes = [], $weight = 0) {
    return $this->setSlot($key, $value, $tag, $attributes, $this->getIndexForNewSlotEntry($key), $weight);
  }

  /**
   * Gets the index to use for a new slot entry.
   *
   * @param string $key
   *   The slot key.
   *
   * @return int
   */
  private function getIndexForNewSlotEntry($key) {
    // Determine last index.
    if (isset($this->slots[$key])) {
      // Determine array index by appending a new one. ::setSlot() will
      //  overwrite the array with the right slot array afterwards.
      $this->slots[$key][] = [];
      end($this->slots[$key]);
      return key($this->slots[$key]);
    }
    else {
      return 0;
    }
  }

  /**
   * Sets the slot with a single custom element on a certain index
   *
   * Note: This is overwriting possibly already existing slots.
   *
   * This method avoids a wrapper div as necessary by the helper for multiple
   * elements.
   *
   * @param $key
   *   Name of the slot to set value for.
   * @param \Drupal\custom_elements\CustomElement $nestedElement
   *   The nested custom element.
   * @param int $index
   *   (optional) The index of the slot entry to set. By default, always the
   *   first entry is set. Defaults to 0.
   * @param int $weight
   *   (optional) A weight for ordering output slots. Defaults to 0.
   *
   * @return $this
   *
   * @see ::addSlotFromCustomElement()
   */
  public function setSlotFromCustomElement($key, CustomElement $nestedElement, $index = 0, $weight = 0) {
    $key = $this->fixSlotKey($key);
    $this->slots[$key][$index] = [
      'weight' => $weight,
      'key' => $key,
      'content' => $nestedElement,
    ];
    return $this;
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
   * @param int $weight
   *   (optional) A weight for ordering output slots. Defaults to 0.
   *
   * @return $this
   */
  public function addSlotFromCustomElement($key, CustomElement $nestedElement, $weight = 0) {
    return $this->setSlotFromCustomElement($key, $nestedElement, $this->getIndexForNewSlotEntry($key), $weight);
  }

  /**
   * Sets the slot content from multiple nested custom elements.
   *
   * Note: This is overwriting possibly already existing slots.
   *
   * @param $key
   *   Name of the slot to set value for.
   * @param \Drupal\custom_elements\CustomElement[] $nestedElements
   *   The nested custom element.
   * @param string $tag
   *   (optional) The tag to use for the slot.
   * @param array $attributes
   *   (optional) Attributes to add to the slot tag.
   * @param int $index
   *   (optional) The index of the slot entry to set. By default, always the
   *   first entry is set. Defaults to 0.
   * @param int $weight
   *   (optional) A weight for ordering output slots. Defaults to 0.
   *
   * @return $this
   *
   * @see ::addSlotFromNestedElements()
   */
  public function setSlotFromNestedElements($key, array $nestedElements, $tag = 'div', $attributes = [], $index = 0, $weight = 0) {
    $element = CustomElement::create($tag)
      ->setAttributes($attributes);
    foreach ($nestedElements as $delta => $nestedElement) {
      $element->addSlotFromCustomElement('default', $nestedElement);
    }

    $key = $this->fixSlotKey($key);

    $this->slots[$key][$index] = [
      'weight' => $weight,
      'key' => $key,
      'content' => $element,
    ];
    return $this;
  }

  /**
   * Adds the slot content from multiple nested custom elements.
   *
   * @param $key
   *   Name of the slot to set value for.
   * @param \Drupal\custom_elements\CustomElement[] $nestedElements
   *   The nested custom element.
   * @param string $tag
   *   (optional) The tag to use for the slot.
   * @param array $attributes
   *   (optional) Attributes to add to the slot tag.
   * @param int $weight
   *   (optional) A weight for ordering output slots. Defaults to 0.
   *
   * @return $this
   */
  public function addSlotFromNestedElements($key, array $nestedElements, $tag = 'div', $attributes = [], $index = 0, $weight = 0) {
    return $this->setSlotFromNestedElements($key, $nestedElements, $tag, $attributes, $this->getIndexForNewSlotEntry($key), $weight);
  }

  /**
   * Fix slot key and remove prefix if set via static::$removeFieldPrefix.
   *
   * @param string $key
   *   The slot key.
   *
   * @return string
   *   The fixed slot key.
   */
  protected function fixSlotKey($key) {
    $key = str_replace('_', '-', $key);
    if (static::$removeFieldPrefix && strpos($key, 'field-') === 0) {
      $key = substr($key, strlen('field-'));
    }
    return $key;
  }

  /**
   * Gets html tags which don't have an end-tag.
   *
   * @return string[]
   */
  public static function getNoEndTags() {
    return static::$noEndTags;
  }

  /**
   * Gets the custom element tag name.
   *
   * @return string
   */
  public function getTag() {
    return $this->tag;
  }

  /**
   * Sets the custom element tag name.
   *
   * @param string $tag
   *   The element tag name.
   *
   * @return $this
   */
  public function setTag($tag) {
    $tag = str_replace('_', '-', $tag);
    $this->tag = $tag;
    return $this;
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
   * @param string|null $value
   *   Attribute value or NULL to unset the attribute.
   *
   * @return $this
   */
  public function setAttribute($key, $value = NULL) {
    $key = str_replace('_', '-', $key);
    if (static::$removeFieldPrefix && strpos($key, 'field-') === 0) {
      $key = substr($key, strlen('field-'));
    }
    if (isset($value)) {
      $this->attributes[$key] = $this->sanitizeAttribute($value);
    }
    else {
      unset($this->attributes[$key]);
    }
    return $this;
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
   *
   * @return $this
   */
  public function setAttributes(array $attributes) {
    $this->attributes = $attributes;
    return $this;
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
   *   The tag prefix.
   *
   * @return $this
   */
  public function setTagPrefix($tagPrefix) {
    $tagPrefix = str_replace('_', '-', $tagPrefix);
    $this->tagPrefix = $tagPrefix;
    return $this;
  }

  /**
   * Returns the tag including tag-prefix.
   *
   * @return string
   */
  public function getPrefixedTag() {
    return $this->tagPrefix . $this->tag;
  }

  /**
   * Gets a render array for rendering the custom element into markup.
   *
   * @return array
   */
  public function toRenderArray() {
    return [
      '#theme' => 'custom_element',
      '#custom_element' => $this,
    ];
  }

}
