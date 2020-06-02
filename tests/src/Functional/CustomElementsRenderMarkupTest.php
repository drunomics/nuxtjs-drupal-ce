<?php

namespace Drupal\Tests\custom_elements\Functional;

use Drupal\custom_elements\CustomElement;
use Drupal\custom_elements\CustomElementGeneratorTrait;
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
   * {@inheritdoc}
   */
  protected function setUp() {
    parent::setUp();
    $this->node = Node::create([
      'type' => 'article',
      'title' => 'test'
    ]);
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
    $this->doTestTextParagaph();

  }

  /**
   * @covers \Drupal\custom_elements_thunder\Processor\ParagraphTextProcessor
   */
  public function doTestTextParagaph() {
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
  <h3 slot="title">
    The title
  </h3>
  <div slot="content">
    <p><strong>some</strong> example text</p>

  </div>
</pg-text>
EOF;
    Assert::assertXmlStringEqualsXmlString($expected_markup, $markup);
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
<node class="custom-element" created="{$this->node->created->value}" title="test" type="article" uid="0" view-mode="full">
</node>
EOF;
    Assert::assertXmlStringEqualsXmlString($expected_markup, $markup);
  }

}
