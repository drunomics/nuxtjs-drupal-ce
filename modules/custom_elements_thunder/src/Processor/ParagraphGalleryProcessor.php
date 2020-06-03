<?php


namespace Drupal\custom_elements_thunder\Processor;

use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\Processor\CustomElementProcessorInterface;
use Drupal\paragraphs\ParagraphInterface;

/**
 * Default processor for thunder gallery paragraph.
 */
class ParagraphGalleryProcessor implements CustomElementProcessorInterface {

  /**
   * {@inheritdoc}
   */
  public function supports($data, $viewMode) {
    if ($data instanceof ParagraphInterface) {
      return $data->getEntityTypeId() == 'paragraph' &&
        $data->bundle() == 'gallery';
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

    /** @var \Drupal\media_entity\Entity\Media $media_entity */
    $media_entity = $paragraph->field_media->entity;
    $sources = [];
    foreach ($media_entity->field_media_images as $media_reference) {
      $media_image = $media_reference->entity;
      $sources[] = [
        'url' => $media_image->field_image->entity->uri->url,
        'thumbnail-url' => $media_image->thumbnail->entity->uri->url,
        'alt' => $media_image->field_image->alt->value ?? '',
        'copyright' => $media_image->field_copyright->value,
        'source' => $media_image->field_source->value,
        'description' => $media_image->field_description->value,
      ];
    }
    $element->setAttribute(':sources', $sources);
    $element->setSlot('title', $media_entity->name->value, 'h3');
    $element->setSlotNormalizationStyle('title', CustomElement::NORMALIZE_AS_SINGLE_SIMPLE_VALUE);
  }

}
