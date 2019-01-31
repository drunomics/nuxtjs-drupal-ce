<?php

namespace Drupal\custom_elements\Service;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\Processor\CustomElementProcessorInterface;
use Drupal\media_entity\Entity\Media;

/**
 * Service to preprocess template variables for custom elements.
 */
class CustomElementGenerator {

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
   * Array of all processors and their priority.
   *
   * @var array
   */
  protected $processorByPriority = [];

  /**
   * Sorted list of registered processors.
   *
   * @var \Drupal\custom_elements\Processor\CustomElementProcessorInterface[]
   */
  protected $sortedProcessors;

  /**
   * Adds a processor.
   *
   * @param \Drupal\custom_elements\Processor\CustomElementProcessorInterface $processor
   *   The processor to add.
   * @param int $priority
   *   The priority for the processor.
   */
  public function addProcessor(CustomElementProcessorInterface $processor, $priority = 0) {
    $this->processorByPriority[$priority][] = $processor;
    // Force the processors to be re-sorted.
    $this->sortedProcessors = NULL;
  }

  /**
   * Gets an array of processors, sorted by their priority.
   *
   * @return \Drupal\custom_elements\Processor\CustomElementProcessorInterface[]
   */
  public function getSortedProcessors() {
    if (!isset($this->sortedProcessors)) {
      // Sort the processors according to priority.
      krsort($this->processorByPriority);

      // Merge nested processors from $this->processors into $this->sortedProviders.
      $this->sortedProcessors = [];
      foreach ($this->processorByPriority as $processors) {
        $this->sortedProcessors = array_merge($this->sortedProcessors, $processors);
      }
    }

    return $this->sortedProcessors;
  }

  /**
   * Generates a custom element tag for the given entity and view mode.
   *
   * @param \Drupal\Core\Entity\ContentEntityInterface $entity
   *   Entity to process.
   * @param string[] $field_names
   *   Array of field names which should be rendered. Fields not mentioned
   *   won't be included.
   * @param string $viewMode
   *   View mode used for rendering field values into slots.
   *
   * @return \Drupal\custom_elements\CustomElement
   *   Extracted custom elements containing data attributes and slots.
   */
  public function generate(ContentEntityInterface $entity, $field_names, $viewMode) {
    $custom_element = new CustomElement();

    // By default output tags like drupal-node, drupal-comment and for
    // paragraphs pg-text, pg-image etc.
    if ($entity->getEntityTypeId() == 'paragraph') {
      $tag = 'pg-' . $entity->bundle();
      $prefix = '';
    }
    elseif ($entity->getEntityTypeId() == 'node') {
      $tag = 'node';
      $prefix = '';
    }
    else {
      $tag = $entity->getEntityTypeId();
      $prefix = 'drupal';
    }
    $custom_element->setTag($tag);
    $custom_element->setTagPrefix($prefix);

    // Add the bundle as type.
    if ($entity->bundle() != $entity->getEntityTypeId()) {
      $custom_element->setAttribute('type', $entity->bundle());
    }
    // Add the view mode.
    $custom_element->setAttribute('view-mode', $viewMode);

    // Handle given fields only.
    $fields = array_intersect_key($entity->getFields(), array_flip($field_names));

    foreach ($fields as $field_name => $field) {
      foreach ($this->getSortedProcessors() as $processor) {
        if ($processor->supports($field)) {
          $processor->addtoElement($field_name, $field, $custom_element, $viewMode);
          break 1;
        }
      }
    }
    return $custom_element;
  }

  /**
   * Preprocess non-scalar fields.
   *
   * @param \Drupal\custom_elements\CustomElement $entity_values
   *   The EntityValues object.
   * @param \Drupal\Core\Entity\ContentEntityInterface $entity
   *   The entity that is preprocessed.
   * @param string $field_name
   *   The field's name.
   * @param string $view_mode
   *   The entity's view mode.
   */
  protected function preprocessNonScalarField(CustomElement &$entity_values, ContentEntityInterface $entity, $field_name, $view_mode) {
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
   * @param \Drupal\custom_elements\CustomElement $entity_values
   *   The custom elements object.
   * @param \Drupal\media_entity\Entity\Media $media_entity
   *   The media entity.
   * @param string $paragraph_bundle
   *   The field's parent paragraph bundle.
   */
  protected function preprocessMediaField(CustomElement &$entity_values, Media $media_entity, $paragraph_bundle) {
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

}
