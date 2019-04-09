<?php


namespace Drupal\custom_elements\Processor;

use Drupal\Core\Field\FieldItemInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\TypedData\PrimitiveInterface;
use Drupal\custom_elements\CustomElement;

/**
 * Default processor for field items.
 */
class DefaultFieldItemProcessor implements CustomElementProcessorInterface {

  /**
   * {@inheritdoc}
   */
  public function supports($data) {
    return $data instanceof FieldItemInterface;
  }

  /**
   * {@inheritdoc}
   */
  public function addtoElement($data, CustomElement $element, $viewMode) {
    assert($data instanceof FieldItemInterface);
    $field_item = $data;

    // Add all primitive properties by default. We cannot generically add
    // non-primitives since we do not know how to render them. This is not
    // really an issue as non-scalar fields are by default already rendered on
    // the field item list level, thus never get here.
    foreach ($field_item->getProperties() as $name => $property) {
      if ($property instanceof PrimitiveInterface) {
        $element->setAttribute($name, $property->getValue());
      }
    }
  }

}
