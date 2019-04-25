<?php


namespace Drupal\custom_elements\Processor;

use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Entity\Exception\UndefinedLinkTemplateException;
use Drupal\Core\Field\FieldItemInterface;
use Drupal\Core\TypedData\DataReferenceInterface;
use Drupal\Core\TypedData\PrimitiveInterface;
use Drupal\custom_elements\CustomElement;

/**
 * Default processor for field items.
 */
class DefaultFieldItemProcessor implements CustomElementProcessorInterface {

  /**
   * {@inheritdoc}
   */
  public function supports($data, $viewMode) {
    return $data instanceof FieldItemInterface;
  }

  /**
   * {@inheritdoc}
   */
  public function addtoElement($data, CustomElement $element, $viewMode) {
    assert($data instanceof FieldItemInterface);
    $field_item = $data;

    // Add all primitive properties by default.
    foreach ($field_item->getProperties() as $name => $property) {
      if ($property instanceof PrimitiveInterface) {
        $element->setAttribute($name, $property->getValue());
      }
      elseif ($property instanceof DataReferenceInterface) {
        try {
          // Add links to referenced entities as slot.
          if ($property->getTarget() instanceof EntityInterface && $url = $property->getTarget()->toUrl()) {
            $nested_element = new CustomElement();
            $nested_element->setTag('a');
            $nested_element->setAttribute('href', $url);
            $nested_element->setAttribute('type', $property->getTarget()->getEntityTypeId());
            $nested_element->setAttribute('ref', $property->getTargetIdentifier());
            $nested_element->addCacheableDependency($property->getTarget());
            $element->setSlotFromCustomElement($name, $nested_element);
          }
          // For other references just add the id.
          else {
            $element->setAttribute($name, $property->getTargetIdentifier());
          }
        }
        catch (UndefinedLinkTemplateException $exception) {
          // Skip if no link-template is defined.
        }
      }
      // We cannot generically other other properties since we do not know how
      // to render them and they are not primitive. So they are skipped.
    }

    // Add the main property as default slot if no content would be there else.
    // However, do not do this if this the only attribute, because in that
    // case we rather let the default field item list processor optimize the
    // whole tag into a parent attribute.
    if (count($element->getSlots()) == 0 && count($element->getAttributes()) != 1 && $property = $field_item->getFieldDefinition()->getFieldStorageDefinition()->getMainPropertyName()) {
      if ($field_item->get($property) instanceof PrimitiveInterface) {
        $element->setSlot('default', $field_item->get($property)->getValue());
        $element->setAttribute($property, NULL);
      }
    }

  }

}
