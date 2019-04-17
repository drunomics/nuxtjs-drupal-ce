<?php


namespace Drupal\custom_elements\Processor;

use Drupal\Core\Field\FieldItemInterface;
use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\CustomElementGeneratorTrait;
use Drupal\text\Plugin\Field\FieldType\TextItemBase;

/**
 * Default processor for paragraph field items.
 */
class ParagraphFieldItemProcessor implements CustomElementProcessorInterface {

  use CustomElementGeneratorTrait;

  /**
   * {@inheritdoc}
   */
  public function supports($data, $viewMode) {
    if ($data instanceof FieldItemInterface) {
      $field_definition = $data->getFieldDefinition();
      return $field_definition->getType() == 'entity_reference_revisions' &&
        $field_definition->getFieldStorageDefinition()->getSetting('target_type') == 'paragraph';
    }
    else {
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function addtoElement($data, CustomElement $element, $viewMode) {
    assert($data instanceof FieldItemInterface);
    $field_item = $data;

    if ($paragraph = $field_item->entity) {
      $paragraph_element = $this->getCustomElementGenerator()->generate($paragraph, $viewMode);
      // Set element content from paragraph element.
      $element->setTag($paragraph_element->getTag());
      $element->setTagPrefix($paragraph_element->getTagPrefix());
      $element->setAttributes($paragraph_element->getAttributes());
      $element->setSlots($paragraph_element->getSlots());
      $element->addCacheableDependency($paragraph_element);
    }
  }

}
