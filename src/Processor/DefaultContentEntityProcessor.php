<?php


namespace Drupal\custom_elements\Processor;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\Entity\EntityViewDisplay;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\EventSubscriber\MainContentViewSubscriber;
use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\CustomElementGeneratorTrait;
use Symfony\Component\HttpFoundation\RequestStack;

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
   * The request stack.
   *
   * @var \Symfony\Component\HttpFoundation\RequestStack
   */
  protected $requestStack;

  /**
   * DefaultContentEntityProcessor constructor.
   *
   * @param \Symfony\Component\HttpFoundation\RequestStack $request_stack
   *   The request stack.
   */
  public function __construct(RequestStack $request_stack) {
    $this->requestStack = $request_stack;
  }

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

    // If layout builder is enabled, skip adding components for markup output.
    $wrapper_format = $this->requestStack->getCurrentRequest()->query->get(MainContentViewSubscriber::WRAPPER_FORMAT);
    if (!((bool) $display->getThirdPartySetting('layout_builder', 'enabled') && $wrapper_format == 'custom_elements')) {
      foreach ($display->getComponents() as $field_name => $options) {
        if (isset($entity->{$field_name})) {
          $this->getCustomElementGenerator()->process($entity->get($field_name), $custom_element, $viewMode);
        }
      }
    }
  }

}
