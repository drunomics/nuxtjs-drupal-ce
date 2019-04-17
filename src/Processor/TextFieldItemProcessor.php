<?php


namespace Drupal\custom_elements\Processor;

use Drupal\Core\Field\FieldItemInterface;
use Drupal\custom_elements\CustomElement;
use Drupal\text\Plugin\Field\FieldType\TextItemBase;

/**
 * Default processor for text field items.
 */
class TextFieldItemProcessor implements CustomElementProcessorInterface {

  /**
   * {@inheritdoc}
   */
  public function supports($data, $viewMode) {
    return $data instanceof FieldItemInterface && $data instanceof TextItemBase;
  }

  /**
   * {@inheritdoc}
   */
  public function addtoElement($data, CustomElement $element, $viewMode) {
    assert($data instanceof FieldItemInterface);
    $field_item = $data;

    $element->setSlot('default', $field_item->processed);
    if (!empty($field_item->summary_processed)) {
      $element->setSlot('summary', $field_item->summary_processed);
    }
  }

}
