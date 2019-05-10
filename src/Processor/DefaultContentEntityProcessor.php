<?php


namespace Drupal\custom_elements\Processor;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\Entity\EntityViewDisplay;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Entity\EntityViewBuilder;
use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\CustomElementGeneratorTrait;

/**
 * Default processor for content entities.
 */
class DefaultContentEntityProcessor implements CustomElementProcessorInterface {

  use CustomElementGeneratorTrait;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Sets the entity type.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   *
   * @return $this
   */
  public function setEntityTypeManager(EntityTypeManagerInterface $entityTypeManager) {
    $this->entityTypeManager = $entityTypeManager;
    return $this;
  }

  /**
   * Gets the entity type manager.
   *
   * @return \Drupal\Core\Entity\EntityTypeManagerInterface
   *   The entity type manager.
   */
  public function getEntityTypeManager() {
    if (empty($this->entityTypeManager)) {
      $this->entityTypeManager = \Drupal::entityTypeManager();
    }
    return $this->entityTypeManager;
  }

  /**
   * {@inheritdoc}
   */
  public function supports($data, $viewMode) {
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

    // If layout builder is enabled, skip adding components.
    if (!(bool) $display->getThirdPartySetting('layout_builder', 'enabled')) {
      foreach ($display->getComponents() as $field_name => $options) {
        if (isset($entity->{$field_name})) {
          $this->getCustomElementGenerator()->process($entity->get($field_name), $custom_element, $viewMode);
        }
      }
    }
  }

}
