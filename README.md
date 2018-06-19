# Custom elements

Custom elements modules allows to render content entities as custom elements.
 
## Overview

Custom elements module was developed as part of [contentpool](https://github.com/drunomics/contentpool)
distribution where it's inevitable to have a flixible way of content re-using
across any independent client. It's basically providing Content-Embed API where
content from main instance (aka contentpool) can be rendered on client sites.
Any content entity may be rendered with custom elements where simple (scalar)
field types are rendered as data attributes and more complex fields as specific
html tags.

## How it works

To render content entity as custom elements you just need to introduce custom
view mode with `custom_elements` prefix. Every entity render with such a view
mode is then automatically processed.

## Example

Example of rendered paragraph entity of bundle `text` containing four fields:


`field_list_integer` integer list field type (simple/scalar field)

`field_float` float field type (simple/scalar field)

`field_link` link field type (complex field)

`field_text` formatted text field type (complex field)

Output:
```
<pg-text type="text" data-field_list_integer="value-1" data-field_float="1.123">
    <section name="field_link">
        <div class="field field--name-field-link field--type-link field--label-above">
            <div class="field__label">link</div>
            <div class="field__item"><a href="http://google.sk">link text</a></div>
        </div>
    </section>
    <section name="field_text">
        <div class="clearfix text-formatted field field--name-field-text field--type-text-long field--label-above">
            <div class="field__label">Text</div>
            <div class="field__item"><p>test text</p></div>
        </div>
    </section>
</pg-text>
```

## Field types considered as simple/scalar

The following list contains field types which are considered simple (or scalar)
and are processed as data attributes:

General fields:
```
Boolean - boolean
Date - datetime
Email - email
Timestamp - timestamp
```
Text fields:
```
Text (plain) - string
List (text) - list_string
Text (plain, long) - string_long
```
Numeric fields:
```
Number (float) - float
List (integer) - list_integer
List (float) - list_float
Number (decimal) - decimal
Number (integer) - integer
```

Other field types as considered as complex fields and are rendered within
`<section>` tag.

## Credits

 - [Österreichischer Wirtschaftsverlag GmbH](https://www.drupal.org/%C3%B6sterreichischer-wirtschaftsverlag-gmbh): Initiator, Sponsor
 - [drunomics GmbH](https://www.drupal.org/drunomics): Concept, Development, Maintenance