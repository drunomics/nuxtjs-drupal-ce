<?php


namespace Drupal\custom_elements\Processor;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\Entity\EntityViewDisplay;
use Drupal\Core\Entity\EntityDisplayRepository;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\CustomElementGeneratorTrait;

/**
 * Default processor for field item lists.
 */
class DefaultContentEntityProcessor implements CustomElementProcessorInterface {

  use CustomElementGeneratorTrait;

  /**
   * {@inheritdoc}
   */
  public function supports($data) {
    return $data instanceof ContentEntityInterface;
  }

  /**
   * {@inheritdoc}
   */
  public function addtoElement($data, CustomElement $custom_element, $viewMode) {
    assert($data instanceof ContentEntityInterface);
    $entity = $data;

    // Process all fields enabled in the view mode by default.
    $displays = EntityViewDisplay::collectRenderDisplays([$entity], $viewMode);
    $display = reset($displays);

    foreach ($display->getComponents() as $field_name => $options) {
      if (isset($entity->{$field_name})) {
        $this->customElementGenerator->process($entity->get($field_name), $custom_element, $viewMode);
      }
    }
  }

}
