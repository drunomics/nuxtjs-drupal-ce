<?php

namespace Drupal\custom_elements;

use Drupal\Component\Render\MarkupInterface;
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
      return array_map([$this, 'normalizeSlotContent'], $content);
    }
    return $content;
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
