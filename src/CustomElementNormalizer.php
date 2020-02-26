<?php

namespace Drupal\custom_elements;

use Drupal\Component\Render\MarkupInterface;
use Drupal\Core\Layout\LayoutDefinition;
use Drupal\Core\Render\Markup;
use Drupal\Core\Template\Attribute;
use \Symfony\Component\Serializer\Normalizer\NormalizerInterface;

/**
 * Formats a custom element structure into an array.
 */
class CustomElementNormalizer implements NormalizerInterface {

  /**
   * @inheritDoc
   */
  public function normalize($object, $format = NULL, array $context = []) {
    $result = $this->normalizeCustomElement($object);
    return $this->convertKeysToCamelCase($result);
  }

  /**
   * @inheritDoc
   */
  public function supportsNormalization($data, $format = NULL) {
    return $data instanceof CustomElement;
  }

  /**
   * Normalize custom element.
   *
   * @param \Drupal\custom_elements\CustomElement $element
   *
   * @return array
   */
  protected function normalizeCustomElement(CustomElement $element) {
    $result = ['element' => $element->getPrefixedTag()];
    $result = array_merge($result, $element->getAttributes());
    unset($result['slot']);

    $normalized_slots = $this->normalizeSlots($element->getSortedSlots());
    $result = array_merge($result, $normalized_slots);

    return $result;
  }

  /**
   * Normalize slots.
   *
   * @param array $slots
   *
   * @return array
   */
  protected function normalizeSlots(array $slots) {
    $result = [];
    foreach ($slots as $slot) {
      $slot_result = [];
      $slot_key = $slot['key'];

      if (is_array($slot['content']) && !empty($slot['content']['#custom_element'])) {
        // In this case the custom element is the slot and not content.
        // @see CustomElement::setSlotFromCustomElement()
        $slot_result = $this->normalizeCustomElement($slot['content']['#custom_element']);
        if ($element_slot_key = $slot['content']['#custom_element']->getAttribute('slot')) {
          $slot_key = $element_slot_key;
        }
      }
      elseif ($normalized_content = $this->normalizeSlotContent($slot['content'])) {
        $slot_result['content'] = $normalized_content;
        if (!empty($slot['attributes']) && $slot['attributes'] instanceof Attribute) {
          $slot_result = array_merge($slot_result, $slot['attributes']->toArray());
        }
      }
      elseif (empty($slot['content'])) {
        $slot_result['content'] = (string) Markup::create('<' . $slot['tag'] . $slot['attributes'] . '>');
        if (!in_array($slot['tag'], CustomElement::getNoEndTags())) {
          $slot_result['content'] .= (string) Markup::create('</' . $slot['tag'] . '>');
        }
      }

      unset($slot_result['slot']);

      if (!empty($slot_result['content']) && is_array($slot_result['content'])) {
        $slot_result['content'] = static::filterRenderVars($slot_result['content']);
      }

      if ($slot_key == 'default') {
        $result['content'][] = $slot_result;
      }
      else {
        $result[$slot_key][] = $slot_result;
      }
    }

    // If content is the one and only result, assign the value on the top level.
    foreach ($result as $key => &$item) {
      if (count($item) == 1) {
        if (!empty($item[0]['content']) && count($item[0]) == 1) {
          $result[$key] = $item[0]['content'];
        }
      }
    }

    return $result;
  }

  /**
   * Normalize slot content.
   *
   * @param mixed $content
   *   Any data.
   *
   * @return mixed
   */
  protected function normalizeSlotContent($content) {
    if ($content instanceof CustomElement) {
      return $this->normalizeCustomElement($content);
    }
    elseif ($content instanceof MarkupInterface) {
      return (string) $content;
    }
    elseif (is_array($content)) {
      if (!empty($content['#custom_element']) && $content['#custom_element'] instanceof CustomElement) {
        return $this->normalizeCustomElement($content['#custom_element']);
      }
      if (!empty($content['#layout']) && $content['#layout'] instanceof LayoutDefinition) {
        return $this->normalizeLayout($content);
      }
      if (!empty($content['#theme']) && $content['#theme'] == 'block') {
        return $this->normalizeBlock($content);
      }
      elseif (!empty($content['#theme'])) {
        $result = \Drupal::service('renderer')->renderRoot($content);
        $result = (string) $result;
        return $result;
      }
      return array_map([$this, 'normalizeSlotContent'], $content);
    }
    return $content;
  }

  /**
   * Normalize drupal layout render array.
   *
   * @param array $content
   *   Layout render array.
   *
   * @return array
   */
  protected function normalizeLayout(array $content) {
    $layout_content = [];
    foreach ($content['content'] as $item) {
      if (empty($item['#theme'])) {
        continue;
      }
      $layout_content[] = $item;
    }
    $layout_content = static::filterRenderVars($layout_content);

    $result = [
      'element' => 'layout',
      'type' => $content['#layout']->id(),
      'settings' => !empty($content['#configuration']) ? $content['#configuration'] : [],
      'content' => $this->normalizeSlotContent($layout_content),
    ];

    return $result;
  }

  /**
   * Normalize drupal block render array.
   *
   * @param array $content
   *
   * @return array
   */
  protected function normalizeBlock(array $content) {
    $normalized_content = $this->normalizeSlotContent($content['content']);
    $result = [
      'element' => 'block',
      'type' => $content['#plugin_id'],
      'title' => !empty($content['#configuration']['label']) ? $content['#configuration']['label'] : '',
      'content' => !empty($normalized_content['element']) ? [$normalized_content] : $normalized_content,
    ];

    return $result;
  }

  /**
   * Removes render variables.
   *
   * @param array $array
   *   Drupal render array.
   *
   * @return array
   */
  protected static function filterRenderVars(array $array) {
    $matches = preg_grep('/^#/', array_keys($array));
    return array_diff_key($array, array_flip($matches));
  }

  /**
   * Converts keys to camel case.
   *
   * @param array $array
   *
   * @return array
   */
  protected function convertKeysToCamelCase(array $array) {
    $keys = array_map(function ($key) use (&$array) {
      if (is_array($array[$key])) {
        $array[$key] = $this->convertKeysToCamelCase($array[$key]);
      }
      return preg_replace_callback('/[_-]([a-z])/', function ($matches) {
        return strtoupper($matches[1]);
      }, $key);
    }, array_keys($array));

    return array_combine($keys, $array);
  }

}
