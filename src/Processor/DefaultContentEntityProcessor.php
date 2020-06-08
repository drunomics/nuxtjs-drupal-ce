<?php


namespace Drupal\custom_elements\Processor;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\Entity\EntityViewDisplay;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Render\BubbleableMetadata;
use Drupal\Core\Render\Element;
use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\CustomElementGeneratorTrait;
use Drupal\custom_elements\CustomElementsLayoutBuilderEntityViewDisplay;
use Drupal\views\Plugin\views\field\Custom;
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

    if ($display->getThirdPartySetting('layout_builder', 'enabled')) {
      // Skip processing of the fields and let the layoutbuilder render it all.
      $this->addLayoutBuilderContent($entity, $custom_element, $display);
    }
    else {
      foreach ($display->getComponents() as $field_name => $options) {
        if (isset($entity->{$field_name})) {
          $this->getCustomElementGenerator()->process($entity->get($field_name), $custom_element, $viewMode);
        }
      }
    }
  }

  /**
   * Add content of layout builder to the element.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The entity.
   * @param \Drupal\custom_elements\CustomElement $custom_element
   *   The custom element.
   * @param \Drupal\custom_elements\CustomElementsLayoutBuilderEntityViewDisplay $display
   *   The view display of the current view mode.
   */
  protected function addLayoutBuilderContent(EntityInterface $entity, CustomElement $custom_element, CustomElementsLayoutBuilderEntityViewDisplay $display) {
    $section_elements = [];
    $build = $display->buildLayoutSections($entity);

    // Loop over sections and convert render array back to custom elements
    // if blocks render into custom elements.
    foreach (Element::children($build, TRUE) as $key) {
      $section_element = CustomElement::create('layout-section');
      $section_build = $build[$key];
      /** @var \Drupal\Core\Layout\LayoutDefinition $layout */
      $layout = $section_build['#layout'];
      $section_element->setAttribute('layout', $layout->id());
      foreach ($layout->getRegions() as $region_name => $region) {
        if (!empty($section_build[$region_name])) {
          $elements = $this->getElementsFromBlockContentRenderArray($section_build[$region_name], $section_element);
          $section_element->addSlotFromNestedElements($region_name, $elements);
        }
      }
      $section_element->setAttribute('settings', $section_build['#settings']);
      $section_elements[] = $section_element;
    }

    $custom_element->setSlotFromNestedElements('sections', $section_elements);
    $custom_element->addCacheableDependency(BubbleableMetadata::createFromRenderArray($build));
  }

  /**
   * Converts the block content render array into custom elements.
   *
   * @param array $build
   *   The render array.
   * @param \Drupal\custom_elements\CustomElement $parent_element
   *   The parent custom element to which content will be added.
   *
   * @return CustomElement[]
   *   The list of generated custom elements.
   */
  protected function getElementsFromBlockContentRenderArray(array $build, CustomElement $parent_element) {
    $elements = [];

    foreach (Element::children($build, TRUE) as $key) {
      if (isset($build[$key]['#cache'])) {
        $parent_element->addCacheableDependency(BubbleableMetadata::createFromRenderArray($build[$key]));
      }
      // Handle empty cache-only entries.
      if (isset($build[$key]['#cache']) && count($build[$key]) == 1) {
        continue;
      }

      if (isset($build[$key]['content']['#custom_element'])) {
        $block_element = $build[$key]['content']['#custom_element'];
      }
      else {
        // Un-clear render item, just forward through in a drupal-block tag.
        $block_element = CustomElement::create('drupal-markup');
        $block_element->setSlotFromRenderArray('default', $build[$key]);
      }
      $elements[] = $block_element;
    }
    return $elements;
  }

}
