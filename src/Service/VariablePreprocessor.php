<?php

namespace Drupal\custom_elements\Service;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Render\RendererInterface;
use Drupal\custom_elements\EntityValues;
use Drupal\field\Entity\FieldConfig;
use Drupal\media_entity\Entity\Media;

/**
 * Service to preprocess template variables for custom elements.
 */
class VariablePreprocessor {

  /**
   * List of field types considered scalar.
   *
   * @var array
   */
  protected $scalarFieldTypes = [
    // General fields.
    'boolean',
    'datetime',
    'email',
    'timestamp',
    // Text fields.
    'string',
    'list_string',
    'string_long',
    // Numeric fields.
    'float',
    'list_integer',
    'list_float',
    'decimal',
    'integer',
  ];


  /**
   * Array with field names, that need custom processing.
   *
   * @var string[]
   */
  protected $customFields = [
    'field_image',
    'field_media',
    'field_link',
  ];

  /**
   * The renderer service.
   *
   * @var \Drupal\Core\Render\RendererInterface
   */
  protected $renderer;

  /**
   * Constructs a new VariablePreprocessor object.
   *
   * @param \Drupal\Core\Render\RendererInterface $renderer
   *   The renderer service.
   */
  public function __construct(RendererInterface $renderer) {
    $this->renderer = $renderer;
  }

  /**
   * Preprocess entity to extract data attributes and field values.
   *
   * @param \Drupal\Core\Entity\ContentEntityInterface $entity
   *   Entity to preprocess.
   * @param string $viewMode
   *   View mode used for rendering field values.
   *
   * @return \Drupal\custom_elements\EntityValues
   *   Extracted entity values containing data attributes and field values.
   */
  public function preprocessVariables(ContentEntityInterface $entity, $viewMode) {
    $entityValues = new EntityValues();
    /** @var \Drupal\Core\Field\FieldItemListInterface[] $fields */
    $fields = $entity->getFields();
    foreach ($fields as $field) {
      $fieldDefinition = $field->getFieldDefinition();
      // Handle custom fields only.
      if ($fieldDefinition instanceof FieldConfig) {
        $fieldName = $field->getName();
        // Simple fields considered to be data attributes.
        $fieldType = $fieldDefinition->getType();
        if (in_array($fieldType, $this->scalarFieldTypes)) {
          $entityValues->setDataAttribute($fieldName, $field->value);
        }
        // Complex fields with html.
        else {
          $this->preprocessNonScalarField($entityValues, $entity, $fieldName, $viewMode);
        }
      }
    }
    return $entityValues;
  }

  /**
   * Preprocess non-scalar fields.
   *
   * @param \Drupal\custom_elements\EntityValues $entity_values
   *   The EntityValues object.
   * @param \Drupal\Core\Entity\ContentEntityInterface $entity
   *   The entity that is preprocessed.
   * @param string $field_name
   *   The field's name.
   * @param string $view_mode
   *   The entity's view mode.
   */
  protected function preprocessNonScalarField(EntityValues &$entity_values, ContentEntityInterface $entity, $field_name, $view_mode) {
    if (in_array($field_name, $this->customFields)) {
      switch ($field_name) {

        case 'field_image':
          /** @var \Drupal\media_entity\Entity\Media $media_entity */
          $media_entity = $entity->{$field_name}->entity;
          $fieldCopyright = $media_entity->field_copyright->value;
          $fieldDescription = $media_entity->field_description->value;
          $imageSource = file_create_url($media_entity->field_image->entity->getFileUri());
          $entity_values->setDataAttribute('field_copyright', $fieldCopyright);
          $entity_values->setDataAttribute('field_description', $fieldDescription);
          $entity_values->setDataAttribute('img_src', $imageSource);
          break;

        case 'field_media':
          /** @var \Drupal\media_entity\Entity\Media $media_entity */
          $media_entity = $entity->{$field_name}->entity;
          $this->preprocessMediaField($entity_values, $media_entity, $entity->bundle());
          break;

        case 'field_link':
          $links = [];
          foreach ($entity->{$field_name} as $link) {
            $links[] = [
              'uri' => $link->getUrl()->toString(),
              'title' => $link->title,
            ];
          }
          $entity_values->setDataAttribute('links', json_encode($links));
          break;

        default:
          $this->preprocessNonscalarFieldFallback($entity_values, $entity, $field_name, $view_mode);
          break;
      }
    }
    else {
      $this->preprocessNonscalarFieldFallback($entity_values, $entity, $field_name, $view_mode);
    }
  }

  /**
   * Preprocess media fields.
   *
   * @param \Drupal\custom_elements\EntityValues $entity_values
   *   The entity values object.
   * @param \Drupal\media_entity\Entity\Media $media_entity
   *   The media entity.
   * @param string $paragraph_bundle
   *   The field's parent paragraph bundle.
   */
  protected function preprocessMediaField(EntityValues &$entity_values, Media $media_entity, $paragraph_bundle) {
    switch ($paragraph_bundle) {
      case 'instagram':
        $entity_values->setDataAttribute('url', $media_entity->field_url->uri);
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
        $entity_values->setDataAttribute('name', $media_entity->name->value);
        $entity_values->setDataAttribute('images', json_encode($images));
        break;

      case 'pinterest':
        $entity_values->setDataAttribute('url', $media_entity->field_url->uri);
        break;

      case 'twitter':
        $entity_values->setDataAttribute('url', $media_entity->field_url->uri);
        break;
    }

  }

  /**
   * Fallback for non-scalar fields.
   *
   * @param \Drupal\custom_elements\EntityValues $entity_values
   *   The EntityValues object.
   * @param \Drupal\Core\Entity\ContentEntityInterface $entity
   *   The entity that is preprocessed.
   * @param string $field_name
   *   The field's name.
   * @param string $view_mode
   *   The entity's view mode.
   */
  protected function preprocessNonscalarFieldFallback(EntityValues &$entity_values, ContentEntityInterface $entity, $field_name, $view_mode) {
    $field_build = $entity->{$field_name}->view($view_mode);
    $entity_values->setFieldValue($field_name, $field_build);
  }

}
