<?php


namespace Drupal\custom_elements_thunder;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\Processor\CustomElementProcessorInterface;
use Drupal\paragraphs\ParagraphInterface;

/**
 * Thunder processor for paragraphs.
 */
class ThunderParagraphsCustomElementsProcessor implements CustomElementProcessorInterface {

  /**
   * Array with paragraph types, that need custom processing.
   *
   * @var string[]
   */
  static protected $handledTypes = [
    'image',
    'link',
    'gallery',
    'instagram',
    'twitter',
    'pinterest',
  ];

  /**
   * {@inheritdoc}
   */
  public function supports($data) {
    return $data instanceof ParagraphInterface &&
      $data->getEntity()->getEntityTypeId() == 'paragraph' &&
      in_array($data->bundle(), static::$handledTypes
    );
  }

  /**
   * {@inheritdoc}
   */
  public function addtoElement($key, $data, CustomElement $element, $viewMode) {
    assert($data instanceof FieldItemListInterface);
    $field_item_list = $data;
    $paragraph = $field_item_list->getEntity();

    // Generally add a title as slot if field_title is there.
    if (isset($paragraph->field_title)) {
      $element->setSlot('title', $paragraph->field_title, 'h3');
    }

    // Render differently depending on paragraph type.
    switch ($paragraph->bundle()) {
      case 'image':
        /** @var \Drupal\media_entity\Entity\Media $media_entity */
        $media_entity = $paragraph->field_media->entity;
        $element->setSlot('img', '', 'img', ['src' => $media_entity->field_image->entity->uri->url]);
        $element->setSlot('copyright', $media_entity->field_copyright->value, 'p');
        $element->setSlot('source', $media_entity->field_source->value, 'p');
        $element->setSlot('caption', $media_entity->field_description->value, 'caption');
        break;

      case 'link':
        $link_item = $paragraph->field_link->first();
        $element->setSlot('link', $link_item->title, 'a', ['href' => $link_item->getUrl()->toString()]);
        break;

      case 'gallery':
        /** @var \Drupal\media_entity\Entity\Media $media_entity */
        $media_entity = $paragraph->field_media->entity;
        $sources = [];
        foreach ($media_entity->field_media_images as $media_reference) {
          $media_image = $media_reference->entity;
          $sources[] = [
            'url' => $media_image->field_image->entity->uri->url,
            'thumbnail-url' => $media_image->thumbnail->entity->uri->url,
            'alt' => $media_image->field_image->entity->field_image_alt_text->value,
            'copyright' => $media_image->field_copyright->value,
            'source' => $media_image->field_source->value,
            'description' => $media_image->field_description->value,
          ];
        }
        $element->setAttribute('sources', json_encode($sources));
        $element->setSlot('title', $media_entity->name->value, 'h3');
        break;

      case 'instagram':
      case 'twitter':
      case 'pinterest':
        /** @var \Drupal\media_entity\Entity\Media $media_entity */
        $media_entity = $paragraph->field_media->entity;
        $element->setAttribute('url', $media_entity->field_url->uri);
        break;
   }
  }

}
