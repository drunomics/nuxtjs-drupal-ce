<?php

namespace Drupal\custom_elements;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\custom_elements\Processor\CustomElementProcessorInterface;
use Drupal\media_entity\Entity\Media;

/**
 * Service to preprocess template variables for custom elements.
 */
class CustomElementGenerator {

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

}
