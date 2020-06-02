<?php

namespace Drupal\Tests\custom_elements\Functional;

use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\CustomElementGeneratorTrait;
use Drupal\file\Entity\File;
use Drupal\media\Entity\Media;
use Drupal\node\Entity\Node;
use Drupal\paragraphs\Entity\Paragraph;
use Drupal\Tests\BrowserTestBase;
use PHPUnit\Framework\Assert;

/**
 * Test rendering custom elements into markup using the thunder module.
 *
 * @group custom_elements
 */
class CustomElementsRenderMarkupTest extends BrowserTestBase {

  use CustomElementGeneratorTrait;

  /**
   * {@inheritdoc}
   */
  public static $modules = [
    'custom_elements_test_paragraphs',
    'custom_elements_everywhere',
    'custom_elements_thunder',
  ];

  /**
   * {@inheritdoc}
   */
  protected $strictConfigSchema = FALSE;

  /**
   * The node to use for testing.
   *
   * @var \Drupal\node\NodeInterface
   */
  protected $node;

  /**
   * The image used for testing.
   *
   * @var \Drupal\file\FileInterface
   */
  protected $image;

  /**
   * {@inheritdoc}
   */
  protected function setUp() {
    parent::setUp();
    $this->node = Node::create([
      'type' => 'article',
      'title' => 'test'
    ]);
    \Drupal::service('file_system')->copy($this->root . '/core/misc/druplicon.png', 'public://example.jpg');
    $this->image = File::create([
      'uri' => 'public://example.jpg',
    ]);
    $this->image->save();
  }

  /**
   * Helper to render a custom element into markup.
   *
   * @param \Drupal\custom_elements\CustomElement $element
   *   The element
   *
   * @return string
   *   The rendered markup.
   */
  private function renderCustomElement(CustomElement $element) {
    $render = [
      '#theme' => 'custom_element',
      '#custom_element' => $element,
    ];
    return (string) $this->container->get('renderer')->renderPlain($render);
  }

  /**
   * Tests paragraphs.
   */
  public function testParagraphs() {
    // We test all paragraph types from a single test method so the setup()
    // routine is only run once for all of them - saves time.
    $this->doTestTextParagraph();
    $this->doTestQuoteParagraph();
    $this->doTestLinkParagraph();
    $this->doTestTwitterParagraph();
    $this->doTestVideoParagraph();
    $this->doTestImageParagraph();
    $this->doTestGalleryParagraph();
  }

  /**
   * @covers \Drupal\custom_elements_thunder\Processor\ParagraphTextProcessor
   */
  public function doTestTextParagraph() {
    $paragraph = Paragraph::create([
      'type' => 'text',
      'field_title' => 'The title',
      'field_text' => [
        'value' => '<strong>Some</strong> example text',
        'format' => 'restricted_html',
      ],
    ]);
    $this->node->field_paragraphs = [
      0 => ['entity' => $paragraph],
    ];

    $custom_element = $this->getCustomElementGenerator()
      ->generate($paragraph, 'full');
    $markup = $this->renderCustomElement($custom_element);
    $expected_markup = <<<EOF
<pg-text type="text" view-mode="full" class="custom-element">
  <h3 slot="title">the title</h3>
  <div slot="content">
    <p><strong>some</strong> example text</p>

  </div>
</pg-text>
EOF;
    Assert::assertXmlStringEqualsXmlString($expected_markup, $markup);
  }

  /**
   * @covers \Drupal\custom_elements_thunder\Processor\ParagraphQuoteProcessor
   */
  public function doTestQuoteParagraph() {
    $paragraph = Paragraph::create([
      'type' => 'quote',
      'field_text' => [
        'value' => '<strong>Some</strong> example text',
        'format' => 'restricted_html',
      ],
    ]);
    $this->node->field_paragraphs = [
      0 => ['entity' => $paragraph],
    ];

    $custom_element = $this->getCustomElementGenerator()
      ->generate($paragraph, 'full');
    $markup = $this->renderCustomElement($custom_element);
    $expected_markup = <<<EOF
<pg-quote type="quote" view-mode="full" class="custom-element">
  <div slot="quote">
    <p><strong>some</strong> example text</p>
  </div>
</pg-quote>
EOF;
    Assert::assertXmlStringEqualsXmlString($expected_markup, $markup);
  }

  /**
   * @covers \Drupal\custom_elements_thunder\Processor\ParagraphLinkProcessor
   */
  public function doTestLinkParagraph() {
    $paragraph = Paragraph::create([
      'type' => 'link',
      'field_link' => [
        'uri' => 'http://example.com',
        'title' => 'Example site',
      ],
    ]);
    $this->node->field_paragraphs = [
      0 => ['entity' => $paragraph],
    ];

    $custom_element = $this->getCustomElementGenerator()
      ->generate($paragraph, 'full');
    $markup = $this->renderCustomElement($custom_element);
    $expected_markup = <<<EOF
<pg-link class="custom-element" type="link" view-mode="full">
  <a href="http://example.com" slot="link">example site</a>
</pg-link>
EOF;
    Assert::assertXmlStringEqualsXmlString($expected_markup, $markup);
  }

  /**
   * @covers \Drupal\custom_elements_thunder\Processor\ParagraphTwitterProcessor
   */
  public function doTestTwitterParagraph() {
    $paragraph = Paragraph::create([
      'type' => 'twitter',
      'field_media' => [
        Media::create([
          'bundle' => 'twitter',
          'field_url' => 'https://twitter.com/the_real_fago/status/1189191210709049344',
        ])
      ],
    ]);
    $this->node->field_paragraphs = [
      0 => ['entity' => $paragraph],
    ];

    $custom_element = $this->getCustomElementGenerator()
      ->generate($paragraph, 'full');
    $markup = $this->renderCustomElement($custom_element);
    $expected_markup = <<<EOF
<pg-twitter class="custom-element" src="https://twitter.com/the_real_fago/status/1189191210709049344" type="twitter" view-mode="full"/>
EOF;
    Assert::assertXmlStringEqualsXmlString($expected_markup, $markup);
  }

  /**
   * @covers \Drupal\custom_elements_thunder\Processor\ParagraphVideoProcessor
   */
  public function doTestVideoParagraph() {
    $paragraph = Paragraph::create([
      'type' => 'video',
      'field_video' => [
        Media::create([
          'bundle' => 'video',
          'field_media_video_embed_field' => 'https://www.youtube.com/watch?v=IPR36uraNwc',
        ])
      ],
    ]);
    $this->node->field_paragraphs = [
      0 => ['entity' => $paragraph],
    ];

    $custom_element = $this->getCustomElementGenerator()
      ->generate($paragraph, 'full');
    $markup = $this->renderCustomElement($custom_element);
    $expected_markup = <<<EOF
<pg-video class="custom-element" type="video" view-mode="full">
  <iframe slot="video" src="https://www.youtube.com/embed/ipr36uranwc"/>
  <img slot="thumbnail" src="http://img.youtube.com/vi/ipr36uranwc/maxresdefault.jpg"/>
</pg-video>
EOF;
    Assert::assertXmlStringEqualsXmlString($expected_markup, $markup);
  }

  /**
   * @covers \Drupal\custom_elements_thunder\Processor\ParagraphImageProcessor
   */
  public function doTestImageParagraph() {
    $paragraph = Paragraph::create([
      'type' => 'image',
      'field_image' => [
        Media::create([
          'bundle' => 'image',
          'field_image' => [
            'target_id' => $this->image->id(),
          ],
        ])
      ],
    ]);
    $this->node->field_paragraphs = [
      0 => ['entity' => $paragraph],
    ];

    $custom_element = $this->getCustomElementGenerator()
      ->generate($paragraph, 'full');
    $markup = $this->renderCustomElement($custom_element);
    $expected_markup = <<<EOF
<pg-image class="custom-element" type="image" view-mode="full">
  <img slot="img" src="{$this->image->uri->url}"/>
</pg-image>
EOF;
    Assert::assertXmlStringEqualsXmlString($expected_markup, $markup);
  }

  /**
   * @covers \Drupal\custom_elements_thunder\Processor\ParagraphGalleryProcessor
   */
  public function doTestGalleryParagraph() {
    $media_image = Media::create([
      'bundle' => 'image',
      'thumbnail' => [
        'target_id' => $this->image->id(),
      ],
      'field_image' => [
        'target_id' => $this->image->id(),
      ],
    ]);
    $paragraph = Paragraph::create([
      'type' => 'gallery',
      'field_media' => [
        Media::create([
          'bundle' => 'gallery',
          'field_media_images' => [
            0 => ['entity' => $media_image],
            1 => ['entity' => $media_image],
          ],
        ])
      ],
    ]);
    $this->node->field_paragraphs = [
      0 => ['entity' => $paragraph],
    ];

    $custom_element = $this->getCustomElementGenerator()
      ->generate($paragraph, 'full');
    $markup = $this->renderCustomElement($custom_element);
    $image_url = $this->image->uri->url;
    $expected_json = htmlspecialchars(json_encode([
      [
        'url' => $image_url,
        'thumbnail-url' => $image_url,
        'alt' => '',
        'copyright' => NULL,
        'source' => NULL,
        'description' => NULL,
      ],
      [
        'url' => $image_url,
        'thumbnail-url' => $image_url,
        'alt' => '',
        'copyright' => NULL,
        'source' => NULL,
        'description' => NULL,
      ],
    ]));
    $expected_markup = <<<EOF
<pg-gallery :sources="$expected_json" class="custom-element" type="gallery" view-mode="full">
  <h3 slot="title"></h3>
</pg-gallery>
EOF;
    // Editors strip trailing spaces, so do so for the generated markup.
    Assert::assertXmlStringEqualsXmlString($expected_markup, str_replace("    \n", "\n", $markup));
  }

  /**
   * @covers \Drupal\custom_elements\Processor\DefaultContentEntityProcessor
   */
  public function testNodeRendering() {
    $paragraph = Paragraph::create([
      'title' => 'Title',
      'type' => 'text',
      'field_text' => [
        'value' => '<p>Some example text</p>',
      ],
    ]);
    $this->node->field_paragraphs = [
      0 => ['entity' => $paragraph],
    ];

    $custom_element = $this->getCustomElementGenerator()
      ->generate($this->node, 'full');
    $markup = $this->renderCustomElement($custom_element);
    $expected_markup = <<<EOF
<node class="custom-element" created="{$this->node->created->value}" title="test" type="article" uid="0" view-mode="full"/>
EOF;
    Assert::assertXmlStringEqualsXmlString($expected_markup, $markup);
  }

}
