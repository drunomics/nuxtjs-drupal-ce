<?php


namespace Drupal\custom_elements_thunder\Processor;

use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\Processor\CustomElementProcessorInterface;
use Drupal\paragraphs\ParagraphInterface;
use Drupal\video_embed_field\ProviderManager;

/**
 * Default processor for thunder video paragraph.
 */
class ParagraphVideoProcessor implements CustomElementProcessorInterface {

  /**
   * Video embed provider manager.
   *
   * @var \Drupal\video_embed_field\ProviderManager
   */
  protected $providerManager;

  /**
   * Constructs the renderer.
   *
   * @param \Drupal\video_embed_field\ProviderManager $provider_manager
   *   Video embed provider manager.
   */
  public function __construct(ProviderManager $provider_manager) {
    $this->providerManager = $provider_manager;
  }

  /**
   * {@inheritdoc}
   */
  public function supports($data, $viewMode) {
    if ($data instanceof ParagraphInterface) {
      return $data->getEntityTypeId() == 'paragraph' &&
        $data->bundle() == 'video';
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
      $element->setSlot('title', $paragraph->field_title, 'h3');
    }

    /** @var \Drupal\media_entity\Entity\Media $media_entity */
    $media_entity = $paragraph->field_video->entity;
    $provider = $this->providerManager->loadProviderFromInput($media_entity->field_media_video_embed_field->value);
    $embed_code = $provider->renderEmbedCode('0', '0', FALSE);

    $video_element = new CustomElement();
    $video_element->addCacheableDependency($media_entity);
    $video_element->setTag('iframe');
    $video_element->setAttributes(['src' => $embed_code['#url']]);

    $element->setSlotFromCustomElement('video', $video_element);
    $element->setSlot('thumbnail', '', 'img', ['src' => $provider->getRemoteThumbnailUrl()]);
  }

}
