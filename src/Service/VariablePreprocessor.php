<?php

namespace Drupal\custom_elements\Service;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Render\RendererInterface;
use Drupal\custom_elements\EntityValues;
use Drupal\field\Entity\FieldConfig;

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
   * Get html tag based on entity type.
   *
   * @param \Drupal\Core\Entity\ContentEntityInterface $entity
   *   Entity to get tag for.
   *
   * @return string
   *   HTML tag.
   */
  protected function getHtmlTag(ContentEntityInterface $entity) {
    $entityType = $entity->getEntityTypeId();
    switch ($entityType) {
      case 'paragraph':
        return 'pg';
    }
    return $entityType;
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
    $entityValues->setHtmlTag($this->getHtmlTag($entity));
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
        // Complex fields.
        else {
          $fieldBuild = $entity->{$fieldName}->view(['view_mode' => $viewMode]);
          /** @var \Drupal\Core\Render\Markup $fieldRendered */
          $fieldRendered = $this->renderer->renderPlain($fieldBuild);
          $entityValues->setFieldValue($fieldName, $fieldRendered);
        }
      }
    }
    return $entityValues;
  }

}
