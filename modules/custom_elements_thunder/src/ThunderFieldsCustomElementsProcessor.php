<?php


namespace Drupal\custom_elements_thunder;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\Processor\DefaultFieldItemListProcessor;

/**
 * Thunder processor for field item lists.
 */
class ThunderFieldsCustomElementsProcessor extends DefaultFieldItemListProcessor {

  /**
   * Array with field names, that need custom processing.
   *
   * @var string[]
   */
  static protected $handledFields = [
    'field_image',
    'field_media',
    'field_link',
  ];

  /**
   * {@inheritdoc}
   */
  public function supports($data) {
    return $data instanceof FieldItemListInterface &&
      $data->getEntity()->getEntityTypeId() == 'paragraph' &&
      in_array($data->getFieldDefinition()->getName(), static::$handledFields
    );
  }

  /**
   * {@inheritdoc}
   */
  public function addtoElement($key, $data, CustomElement $element, $viewMode) {
    assert($data instanceof FieldItemListInterface);
    $field_item_list = $data;
    $field_name = $data->getFieldDefinition()->getName();

    if ($field_name == 'field_image') {
      /** @var \Drupal\media_entity\Entity\Media $media_entity */
      $media_entity = $field_item_list->entity;
      $element->setAttribute('field_copyright', $media_entity->field_copyright->value);
      $element->setAttribute('field_description', $media_entity->field_description->value);
      $element->setAttribute('img_src', file_create_url($media_entity->field_image->entity->getFileUri()));
    }
    elseif ($field_name == 'field_link') {
      $links = [];
      foreach ($field_item_list as $link_item) {
        $links[] = [
          'uri' => $link_item->getUrl()->toString(),
          'title' => $link_item->title,
        ];
      }
      $element->setAttribute('links', json_encode($links));
    }
    elseif ($field_name == 'field_media') {
      /** @var \Drupal\media_entity\Entity\Media $media_entity */
      $media_entity = $field_item_list->entity;

      // Render differently depending on paragraph type.
      switch ($field_item_list->getEntity()->bundle()) {
        case 'instagram':
          $element->setAttribute('url', $media_entity->field_url->uri);
          break;

        case 'gallery':
          $images = [];
          foreach ($media_entity->field_media_images as $media_reference) {
            $media_image = $media_reference->entity;
            $images[] = [
              'alt' => $media_image->field_image->entity->field_image_alt_text->value,
              'src' => $media_image->field_image->entity->uri->url,
            ];
          }
          $element->setAttribute('name', $media_entity->name->value);
          $element->setAttribute('images', json_encode($images));
          break;

        case 'pinterest':
          $element->setAttribute('url', $media_entity->field_url->uri);
          break;

        case 'twitter':
          $element->setAttribute('url', $media_entity->field_url->uri);
          break;
      }
    }
  }

}
