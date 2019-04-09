<?php


namespace Drupal\custom_elements\Processor;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\CustomElementGeneratorTrait;

/**
 * Default processor for field item lists.
 */
class DefaultFieldItemListProcessor implements CustomElementProcessorInterface {

  use CustomElementGeneratorTrait;

  /**
   * List of field types considered scalar.
   *
   * @var array
   */
  protected static $scalarFieldTypes = [
    // General fields.
    'boolean',
    'datetime',
    'email',
    'timestamp',
    // Text fields.
    'string',
    'list_string',
    'string_long',
    // Numeric fields.
    'float',
    'list_integer',
    'list_float',
    'decimal',
    'integer',
  ];

  /**
   * {@inheritdoc}
   */
  public function supports($data) {
    return $data instanceof FieldItemListInterface;
  }

  /**
   * {@inheritdoc}
   */
  public function addtoElement($data, CustomElement $element, $viewMode) {
    assert($data instanceof FieldItemListInterface);
    $field_item_list = $data;

    // By default just handle each field item with cardinality 1 on its own.
    // Fields with higher cardinality
    foreach ($field_item_list as $field_item) {
      if ($field_item_list->getFieldDefinition()->getFieldStorageDefinition()->getCardinality() == 1) {
        $this->customElementGenerator->process($field_item, $element, $viewMode);
      }
      // Render non-scalar multiple fields as slot.
      elseif (!in_array($field_item_list->getFieldDefinition()->getType(), static::$scalarFieldTypes)) {
        $element->setSlot($field_item_list->getName(), $field_item_list->view($viewMode));
      }
      // Render scalar multiple fields individual, below another tag.
      else {
        $nested_elements = [];
        foreach ($field_item_list as $field_item) {
          $nested_element = new CustomElement();
          $nested_element->setTagPrefix('field');
          $nested_element->setTag($field_item_list->getFieldDefinition()->getType());
          $this->customElementGenerator->process($field_item, $nested_element, $viewMode);
          $nested_elements[] = $nested_element;
        }
        $element->setSlotFromNestedElements($field_item_list->getName(), $nested_elements, 'div', ['class' => 'nested']);
      }
    }
  }

}
