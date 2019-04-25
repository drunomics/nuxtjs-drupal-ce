<?php


namespace Drupal\custom_elements_thunder\Processor;

use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\Processor\CustomElementProcessorInterface;
use Drupal\paragraphs\ParagraphInterface;

/**
 * Default processor for thunder image paragraph.
 */
class ParagraphImageProcessor implements CustomElementProcessorInterface {

  /**
   * {@inheritdoc}
   */
  public function supports($data, $viewMode) {
    if ($data instanceof ParagraphInterface) {
      return $data->getEntityTypeId() == 'paragraph' &&
        $data->bundle() == 'image';
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
    $media_entity = $paragraph->field_image->entity;
    $element->setSlot('img', '', 'img', ['src' => $media_entity->field_image->entity->uri->url]);
    $element->setSlot('copyright', $media_entity->field_copyright->value, 'p');
    $element->setSlot('source', $media_entity->field_source->value, 'p');
    $element->setSlot('caption', $media_entity->field_description->value, 'p');
  }

}
