<?php

namespace Drupal\custom_elements;

use Drupal\Core\Cache\CacheableDependencyInterface;
use Drupal\Core\Cache\RefinableCacheableDependencyTrait;
use Drupal\Core\Render\Markup;
use Drupal\Core\Site\Settings;
use Drupal\Core\Template\Attribute;

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
   *   Array of slots, keyed slot name and entry index. Each entry has the keys
   *   'tag' and 'content'.
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
   * @return \Drupal\Core\Render\Markup[]|string[]
   *   Array of slots, keyed by slot name and entry index.
   */
  public function getSlots() {
    return $this->slots;
  }

  /**
   * Gets a sorted and flattened list of slots.
   *
   * @return array[]
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
   * @return array
   *   An array with the following entries:
   *   - key: The slot name, e.g. 'default'.
   *   - tag: The tag to use for rendering the slot.
   *   - attributes: The slot attributes.
   *   - content (\Drupal\Core\Render\Markup|string): The string to output.
   *   - weight: Optionally, a weight assigned to the slot entry.
   */
  public function getSlot($key, $index = 0) {
    return $this->slots[$key][$index] ?? NULL;
  }

  /**
   * Sets a value for the given slot.
   *
   * @param string $key
   *   Name of the slot to set value for.
   * @param \Drupal\Core\Render\Markup|string $value
   *   Slot markup.
   * @param string $tag
   *   (optional) The tag to use for the slot.
   * @param array $attributes
   *   (optional) Attributes to add to the slot tag.
   * @param int $index
   *   (optional) The index of the slot entry to set. By default, always the
   *   first entry is set. Defaults to 0.
   * @param int $weight
   *   (optional) A weight for ordering output slots. Defaults to 0.
   */
  public function setSlot($key, $value, $tag = 'div', $attributes = [], $index = 0, $weight = 0) {
    if (in_array($tag, static::$noEndTags) && !empty($value)) {
      throw new \LogicException(sprintf('Tag %s is no-end tag and should not have a content.', $tag));
    }

    $key = str_replace('_', '-', $key);
    if (static::$removeFieldPrefix && strpos($key, 'field-') === 0) {
      $key = substr($key, strlen('field-'));
    }
    $this->slots[$key][$index] = [
      'key' => $key,
      'tag' => $tag,
      'content' => $value,
      'attributes' => new Attribute($attributes),
      'weight' => $weight,
    ];
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
   */
  public function addSlot($key, $value, $tag = 'div', $attributes = [], $weight = 0) {
    $this->setSlot($key, $value, $tag, $attributes, $this->getIndexForNewSlotEntry($key), $weight);
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
   * Sets the slot with a single custom element.
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
   */
  public function setSlotFromCustomElement($key, CustomElement $nestedElement, $index = 0, $weight = 0) {
    // Bubble up cache metadata.
    $this->addCacheableDependency($nestedElement);

    $ce_json_enabled = Settings::get('lupus_ce_renderer_format_json');
    // Json output will be transformed via normalizer.
    // @see CustomElementNormalizer::normalizeSlots()
    if ($ce_json_enabled) {
      $slot_content = [
        '#theme' => 'custom_element',
        '#custom_element' => $nestedElement,
      ];
      $this->setSlot($key, $slot_content, $nestedElement->getPrefixedTag(), $nestedElement->getAttributes(), $index, $weight);
      return;
    }

    // Render slots without wrapping tag.
    $content = [];
    foreach ($nestedElement->getSortedSlots() as $i => $slot) {
      // Mimic what custom-elements.html.twig does by default.
      $slot['attributes']->setAttribute('slot', $slot['key']);

      if (is_array($slot['content']) && empty($slot['content'])) {
        $slot['content'] = '';
      }
      $render_key = is_array($slot['content']) ? 'content' : '#markup';

      if (in_array($slot['tag'], static::$noEndTags)) {
        $content[$i][] = [
          '#prefix' => Markup::create('<' . $slot['tag'] . $slot['attributes'] . '>'),
        ];
      }
      else {
        $content[$i][] = [
          '#prefix' => Markup::create('<' . $slot['tag'] . $slot['attributes'] . '>'),
          $render_key => $slot['content'],
          '#suffix' => Markup::create('</' . $slot['tag'] . '>'),
        ];
      }
    }

    // Do not add a default slot tag if this is the only content.
    $slots = $nestedElement->getSlots();
    if (count($content) == 1 && isset($slots['default'][0]) && !in_array($slots['default'][0]['tag'], static::$noEndTags)) {
      // Ensure no other attribute besides 'slot' has been added.
      // If so, we can forward the slot content as content without slot tag.
      if (array_keys($slots['default'][0]['attributes']->storage()) == ['slot']) {
        $content = $slots['default'][0]['content'];
      }
    }
    $this->setSlot($key, $content, $nestedElement->getPrefixedTag(), $nestedElement->getAttributes(), $index, $weight);
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
   */
  public function addSlotFromCustomElement($key, CustomElement $nestedElement, $weight = 0) {
    $this->setSlotFromCustomElement($key, $nestedElement, $this->getIndexForNewSlotEntry($key), $weight);
  }

  /**
   * Sets the slot content from multiple nested custom elements.
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
   */
  public function setSlotFromNestedElements($key, array $nestedElements, $tag = 'div', $attributes = [], $index = 0, $weight = 0) {
    $content = [];
    foreach ($nestedElements as $delta => $nestedElement) {
      $content[$delta] = [
        '#theme' => 'custom_element',
        '#custom_element' => $nestedElement,
      ];
      // Bubble up cache metadata.
      $this->addCacheableDependency($nestedElement);
    }
    $this->setSlot($key, $content, $tag, $attributes, $index, $weight);
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
   */
  public function addSlotFromNestedElements($key, array $nestedElements, $tag = 'div', $attributes = [], $index = 0, $weight = 0) {
    $this->setSlotFromNestedElements($key, $nestedElements, $tag, $attributes, $this->getIndexForNewSlotEntry($key), $weight);
  }

  /**
   * Gets tags which don't have an end-tag.
   *
   * @return string[]
   */
  public static function getNoEndTags() {
    return static::$noEndTags;
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
  public function setTag($tag) {
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
   * @param string|null $value
   *   Attribute value or NULL to unset the attribute.
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
   *   The tag prefix.
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
