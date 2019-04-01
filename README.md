# Custom elements

Custom elements modules allows to render content entities as custom elements.
 
## Overview

Renders entities into custom elements markup that can be picked up for client-side rendering. It renders the data of all
visible fields either as attribute to the custom element tag, or as nested tag with a slot attribute.

Custom element attributes may be picked up as property during client-side rendering.

Slots are a useful way for content distribution in [Vue.js - thus the rendered slots can be used directly by the Vue.js
[slot implementation](https://vuejs.org/v2/guide/components.html#Content-Distribution-with-Slots). But the concept can
be used with out client-side libraries as well, e.g. see https://github.com/dschnare/react-slot for a React based
solution.

## How it works

The module takes over render for all view-modes that are prefixed with `custom_elements` - thus to render content
entity as custom elements you just need to introduce custom view mode with `custom_elements` prefix. Every entity render
with such a view mode is then automatically processed.

In order to make client-side rendering possible, the necessary client libraries may be added to the
custom_elements/main library, which the module is attaching to custom element markup.

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