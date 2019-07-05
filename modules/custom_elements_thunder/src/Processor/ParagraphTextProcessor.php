<?php

namespace Drupal\custom_elements_thunder\Processor;

use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\CustomElementGeneratorTrait;
use Drupal\custom_elements\Processor\CustomElementProcessorInterface;
use Drupal\paragraphs\ParagraphInterface;

/**
 * Processor for thunder text paragraphs.
 */
class ParagraphTextProcessor implements CustomElementProcessorInterface {

  use CustomElementGeneratorTrait;

  /**
   * {@inheritdoc}
   */
  public function supports($data, $viewMode) {
    if ($data instanceof ParagraphInterface) {
      return $data->getEntityTypeId() == 'paragraph' &&
        $data->bundle() == 'text';
    }
    else {
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function addtoElement($paragraph, CustomElement $element, $viewMode) {
    assert($paragraph instanceof ParagraphInterface);

    // Generally add a title as slot if field_title is there.
    if (isset($paragraph->field_title)) {
      $element->setSlot('title', $paragraph->field_title->value, 'h3');
    }

    $element->setSlot('content', $paragraph->field_text->processed, 'div');
  }

}
