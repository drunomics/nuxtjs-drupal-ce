<?php


namespace Drupal\custom_elements_thunder\Processor;

use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\Processor\CustomElementProcessorInterface;
use Drupal\paragraphs\ParagraphInterface;

/**
 * Default processor for thunder instagram, pintereset and twitter paragraphs.
 */
class ParagraphTwitterProcessor implements CustomElementProcessorInterface {

  /**
   * {@inheritdoc}
   */
  public function supports($data, $viewMode) {
    if ($data instanceof ParagraphInterface) {
      return $data->getEntityTypeId() == 'paragraph' &&
        $data->bundle() =='twitter';
    }
    else {
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function addtoElement($paragraph, CustomElement $element, $viewMode) {
    assert($paragraph instanceof ParagraphInterface);

    // Generally add a title as slot if field_title is there.
    if (isset($paragraph->field_title)) {
      $element->setSlot('title', $paragraph->field_title, 'h3');
    }

    /** @var \Drupal\media_entity\Entity\Media $media_entity */
    $media_entity = $paragraph->field_media->entity;
    $element->setAttribute('src', $media_entity->field_url->uri);
  }

}
