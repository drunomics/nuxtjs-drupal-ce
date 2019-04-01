<?php


namespace Drupal\custom_elements\Processor;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\custom_elements\CustomElement;

/**
 * Default processor for field item lists.
 */
class DefaultFieldItemListProcessor implements CustomElementProcessorInterface {

  /**
   * List of field types considered scalar.
   *
   * @var array
   */
  protected $scalarFieldTypes = [
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
  public function addtoElement($key, $data, CustomElement $element, $viewMode) {
    assert($data instanceof FieldItemListInterface);
    $field_item_list = $data;

    // Simple fields considered to be data attributes.
    if (in_array($field_item_list->getFieldDefinition()->getType(), $this->scalarFieldTypes)) {
      $element->setDataAttribute($key, $field_item_list->value);
    }
    // Render complex fields into html and set as slot.
    else {
      $render = $field_item_list->view($viewMode);
      $element->setSlot($key, $render);
    }
  }

}
