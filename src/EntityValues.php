<?php

namespace Drupal\custom_elements;

/**
 * Entity values data model.
 */
class EntityValues {

  /**
   * HTML tag.
   *
   * @var string
   */
  protected $tag;

  /**
   * Prefix for data attribute.
   *
   * @var string
   */
  protected $dataAttributePrefix = 'data-';

  /**
   * List of data attributes.
   *
   * @var array
   */
  protected $dataAttributes = [];

  /**
   * List of field values.
   *
   * @var \Drupal\Core\Render\Markup[]|string[]
   */
  protected $fieldValues = [];

  /**
   * Sanitizes data attribute value - strip html tags.
   *
   * @param string $value
   *   Data attribute value.
   *
   * @return string
   *   Sanitized data attribute value.
   */
  protected function sanitizeDataAttribute($value) {
    return strip_tags($value);
  }

  /**
   * Gets data attributes.
   *
   * @return array
   */
  public function getDataAttributes() {
    return $this->dataAttributes;
  }

  /**
   * Gets value for given data attribute.
   *
   * @param string $key
   *   Name of the data attribute to get value for.
   *
   * @return string
   */
  public function getDataAttribute($key) {
    return $this->dataAttributes[$this->dataAttributePrefix . $key] ?? NULL;
  }

  /**
   * Sets value for given data attribute.
   *
   * @param string $key
   *   Name of the data attribute to set value for.
   * @param string $value
   *   Data attribute value.
   */
  public function setDataAttribute($key, $value) {
    $key = str_replace('_', '-', $key);
    $this->dataAttributes[$this->dataAttributePrefix . $key] = $this->sanitizeDataAttribute($value);
  }

  /**
   * Gets field values.
   *
   * @return \Drupal\Core\Render\Markup[]|string[]
   */
  public function getFieldValues() {
    return $this->fieldValues;
  }

  /**
   * Gets value for given field.
   *
   * @param string $key
   *   Name of the field to get value for.
   *
   * @return \Drupal\Core\Render\Markup|string
   */
  public function getFieldValue($key) {
    return $this->fieldValues[$key] ?? NULL;
  }

  /**
   * Sets value for given field.
   *
   * @param string $key
   *   Name of the field to set value for.
   * @param \Drupal\Core\Render\Markup|string $value
   *   Field value markup.
   */
  public function setFieldValue($key, $value) {
    $key = str_replace('_', '-', $key);
    $this->fieldValues[$key] = $value;
  }

}
