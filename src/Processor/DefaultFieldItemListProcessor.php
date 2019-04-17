<?php

namespace Drupal\custom_elements\Processor;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\CustomElementGeneratorTrait;

/**
 * Default processor for field item lists that passes processing on to items.
 */
class DefaultFieldItemListProcessor implements CustomElementProcessorInterface {

  use CustomElementGeneratorTrait;

  /**
   * {@inheritdoc}
   */
  public function supports($data, $viewMode) {
    return $data instanceof FieldItemListInterface;
  }

  /**
   * {@inheritdoc}
   */
  public function addtoElement($data, CustomElement $element, $viewMode) {
    assert($data instanceof FieldItemListInterface);
    $field_item_list = $data;

    foreach ($field_item_list as $field_item) {
      // By default just handle each field item with cardinality 1 on its own.
      if ($field_item_list->getFieldDefinition()->getFieldStorageDefinition()->getCardinality() == 1) {
        $nested_element = new CustomElement();
        $nested_element->setTagPrefix('field-');
        $nested_element->setTag($field_item_list->getFieldDefinition()->getType());
        $this->getCustomElementGenerator()->process($field_item, $nested_element, $viewMode);

        // When the element has only a single attribute, don't create a nested
        // tag.
        if (count($nested_element->getSlots()) == 0 && count($nested_element->getAttributes()) <= 1) {
          if ($attributes = $nested_element->getAttributes()) {
            $key = key($attributes);
            $element->setAttribute($field_item_list->getName(), $attributes[$key]);
          }
        }
        // If the element has a single slot, just add that.
        elseif (count($nested_element->getSlots()) == 1 && count($nested_element->getAttributes()) == 0) {
          $slots = $nested_element->getSlots();
          $slot = reset($slots);
          $element->setSlot($field_item_list->getName(), $slot['content'], $slot['tag'], $slot['attributes']->toArray());
        }
        else {
          $element->setSlotFromCustomElement($field_item_list->getName(), $nested_element);
        }
      }
      // Render multiple fields individual, below another tag.
      else {
        $nested_elements = [];
        foreach ($field_item_list as $field_item) {
          $nested_element = new CustomElement();
          $nested_element->setTagPrefix('field');
          $nested_element->setTag($field_item_list->getFieldDefinition()->getType());
          $this->getCustomElementGenerator()->process($field_item, $nested_element, $viewMode);
          $nested_elements[] = $nested_element;
        }
        $element->setSlotFromNestedElements($field_item_list->getName(), $nested_elements, 'div');
      }
    }
  }

}
