# Bullets and Numbering

!> Bullets and Numbering requires an understanding of [Sections](usage/sections.md) and [Paragraphs](usage/paragraph.md).

`docx` is quite flexible in its bullets and numbering system, allowing
the user great freedom in how bullets and numbers are to be styled and
displayed. E.g., numbers can be shown using Arabic numerals, roman
numerals, or even ordinal words ("one", "two", "three", ...). The
format also supports re-using bullets/numbering styles throughout the
document, so that different lists using the same style need not
redefine them.

## Configuration

Numbering is configured by adding config into `Document`:

```ts
new Document({
    numbering: {
        config: [...]
    }
})
```

Each `config` entry includes the following properties:

. Each level includes the following properties:

| Property  | Type              | Notes    | Possible Values                                                                                                                                                        |
| --------- | ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reference | `string`          | Required | A unique `string`                                                                                                                                                      |
| levels    | `ILevelOptions[]` | Required | a series of _levels_ which form a sequence starting at 0 indicating the top-level list look and increasing from there to describe the sublists, then sub-sublists, etc |

### Level Options

Levels define the numbering definition itself, what it looks like, the indention, the alignment and the style. The reason why it is an array is because it allows the ability to create sub-lists. A sub list will have a different configuration because you may want the sub-list to have a different indentation or different bullet.

| Property              | Type          | Notes    | Possible Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| level                 | `number`      | Required | The list level this definition is for. `0` is for the root level, `1` is for a sub list, `2` is for a sub-sub-list etc.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| format                | `LevelFormat` | Optional | `DECIMAL`, `UPPER_ROMAN`, `LOWER_ROMAN`, `UPPER_LETTER`, `LOWER_LETTER`, `ORDINAL`, `CARDINAL_TEXT`, `ORDINAL_TEXT`, `HEX`, `CHICAGO`, `IDEOGRAPH__DIGITAL`, `JAPANESE_COUNTING`, `AIUEO`, `IROHA`, `DECIMAL_FULL_WIDTH`, `DECIMAL_HALF_WIDTH`, `JAPANESE_LEGAL`, `JAPANESE_DIGITAL_TEN_THOUSAND`, `DECIMAL_ENCLOSED_CIRCLE`, `DECIMAL_FULL_WIDTH2`, `AIUEO_FULL_WIDTH`, `IROHA_FULL_WIDTH`, `DECIMAL_ZERO`, `BULLET`, `GANADA`, `CHOSUNG`, `DECIMAL_ENCLOSED_FULLSTOP`, `DECIMAL_ENCLOSED_PARENTHESES`, `DECIMAL_ENCLOSED_CIRCLE_CHINESE`, `IDEOGRAPH_ENCLOSED_CIRCLE`, `IDEOGRAPH_TRADITIONAL`, `IDEOGRAPH_ZODIAC`, `IDEOGRAPH_ZODIAC_TRADITIONAL`, `TAIWANESE_COUNTING`, `IDEOGRAPH_LEGAL_TRADITIONAL`, `TAIWANESE_COUNTING_THOUSAND`, `TAIWANESE_DIGITAL`, `CHINESE_COUNTING`, `CHINESE_LEGAL_SIMPLIFIED`, `CHINESE_COUNTING_THOUSAND`, `KOREAN_DIGITAL`, `KOREAN_COUNTING`, `KOREAN_LEGAL`, `KOREAN_DIGITAL2`, `VIETNAMESE_COUNTING`, `RUSSIAN_LOWER`, `RUSSIAN_UPPER`, `NONE`, `NUMBER_IN_DASH`, `HEBREW1`, `HEBREW2`, `ARABIC_ALPHA`, `ARABIC_ABJAD`, `HINDI_VOWELS`, `HINDI_CONSONANTS`, `HINDI_NUMBERS`, `HINDI_COUNTING`, `THAI_LETTERS`, `THAI_NUMBERS`, `THAI_COUNTING`, `BAHT_TEXT`, `DOLLAR_TEXT`, `CUSTOM` |
| text                  | `string`      | Optional | A unique `string` to describe the shape of the bullet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| alignment             | `string`      | Required | `START`, `CENTER`, `END`, `BOTH`, `MEDIUM_KASHIDA`, `DISTRIBUTE`, `NUM_TAB`, `HIGH_KASHIDA`, `LOW_KASHIDA`, `THAI_DISTRIBUTE`, `LEFT`, `RIGHT`, `JUSTIFIED`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| isLegalNumberingStyle | `boolean`     | Optional | Whether every number in the level's `text`, the levels above's too, is a decimal number. See [Legal style numbering](#legal-style-numbering)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| style                 | `object`      | Optional | An object containing `run`, `paragraph`, and `style` sub-properties (see below)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

#### Style sub-properties

| Property  | Type     | Notes    | Description                                                                                                                                                                                                                |
| --------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| run       | `object` | Optional | Run style properties for the numbering text (font, size, bold, etc.)                                                                                                                                                       |
| paragraph | `object` | Optional | Paragraph style properties for the level (indent, spacing, etc.)                                                                                                                                                           |
| style     | `string` | Optional | A paragraph style ID to associate with the level. Paragraphs using that style will automatically adopt this numbering level. See [Associating a level with a paragraph style](#associating-a-level-with-a-paragraph-style) |

## Using ordered lists in `docx`

Add a `numbering` section to the `Document` to numbering style, define your levels. Use `LevelFormat.UPPER_ROMAN` for the `format` in `levels`. And then on a `Paragraph`, we can use the numbering created:

```ts live
import { AlignmentType, Document, LevelFormat, Paragraph } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "my-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.UPPER_ROMAN,
                        text: "%1",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: 720, hanging: 360 },
                            },
                        },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Hey you!",
                    numbering: {
                        reference: "my-numbering",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "Hey you again!",
                    numbering: {
                        reference: "my-numbering",
                        level: 0,
                    },
                }),
            ],
        },
    ],
});
```

### Styling the numbers

A level's `style.run` formats the numbers or bullets at that level: their font, size, colour, bold and so on, with a `TextRun`'s formatting options, except `highlight`, `math` and `revision`, which a level doesn't write. It leaves the text after them as it is.

```ts live
import { AlignmentType, Document, LevelFormat, Paragraph } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "styled-numbers",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1)",
                        alignment: AlignmentType.START,
                        style: {
                            // The numbers at this level are 14 pt bold red Arial
                            run: { font: "Arial", size: 28, bold: true, color: "C00000" },
                            paragraph: { indent: { left: 720, hanging: 360 } },
                        },
                    },
                    {
                        level: 1,
                        format: LevelFormat.LOWER_LETTER,
                        text: "%2.",
                        alignment: AlignmentType.START,
                        style: {
                            // The letters at this level are 12 pt Courier New
                            run: { font: "Courier New", size: 24 },
                            paragraph: { indent: { left: 1440, hanging: 360 } },
                        },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({ text: "Fruit", numbering: { reference: "styled-numbers", level: 0 } }),
                new Paragraph({ text: "Apples", numbering: { reference: "styled-numbers", level: 1 } }),
                new Paragraph({ text: "Pears", numbering: { reference: "styled-numbers", level: 1 } }),
                new Paragraph({ text: "Vegetables", numbering: { reference: "styled-numbers", level: 0 } }),
            ],
        },
    ],
});
```

What a level's `run` doesn't set, Word takes from the paragraph's mark, which a `Paragraph`'s `run` option formats, and not from the paragraph's text. So in a paragraph whose `TextRun`s have a bigger `size`, the number stays the size of the paragraph's style, unless the level sets a `size`, or the paragraph has the same `run: { size }` as its text.

### Legal style numbering

A level's `text` can show the numbers of the levels above it, such as `"%1.%2"`, and each is written in its own level's `format`. So under a level in Chinese counting (一、二、), a level whose `text` is `"%1.%2"` is numbered 一.1. With `isLegalNumberingStyle: true`, a level writes every number in its `text` as a decimal number, as Word's **Legal style numbering** does, so it's numbered 1.1:

```ts live
import { AlignmentType, Document, LevelFormat, Paragraph } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "chapters",
                levels: [
                    { level: 0, format: LevelFormat.CHINESE_COUNTING, text: "%1、", alignment: AlignmentType.START },
                    {
                        level: 1,
                        format: LevelFormat.DECIMAL,
                        text: "%1.%2",
                        alignment: AlignmentType.START,
                        // 1.1, 1.2 and 2.1, not 一.1, 一.2 and 二.1
                        isLegalNumberingStyle: true,
                        style: { paragraph: { indent: { left: 720, hanging: 720 } } },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({ text: "General provisions", numbering: { reference: "chapters", level: 0 } }),
                new Paragraph({ text: "Scope", numbering: { reference: "chapters", level: 1 } }),
                new Paragraph({ text: "Definitions", numbering: { reference: "chapters", level: 1 } }),
                new Paragraph({ text: "Obligations", numbering: { reference: "chapters", level: 0 } }),
                new Paragraph({ text: "Payment", numbering: { reference: "chapters", level: 1 } }),
            ],
        },
    ],
});
```

### Lists that bring their own definition

A paragraph's `numbering` can give its list's definition, its `reference` and its `levels`, rather than the reference of one in the document's `numbering` option. The definition is added to the document's numbering when the paragraph is written, unless the document already has a list with its reference. It is how content made before the document it goes in, such as by a function that returns paragraphs, brings its lists with it.

```ts live
import { AlignmentType, Document, LevelFormat, Paragraph } from "docx";

const steps = {
    reference: "steps",
    levels: [
        {
            level: 0,
            format: LevelFormat.UPPER_ROMAN,
            text: "Step %1.",
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 1080, hanging: 1080 } } },
        },
    ],
};

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ text: "Measure the flour", numbering: { reference: steps, level: 0 } }),
                new Paragraph({ text: "Mix in the water", numbering: { reference: steps, level: 0 } }),
            ],
        },
    ],
});
```

### Numbering options

Along with `reference` and `level`, the `numbering` object supports the optional `restart` and `instance` properties:

| Property  | Type      | Notes                                                                                                                                                                                                                                            |
| --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| reference | `string`  | The numbering style reference, must match a defined config                                                                                                                                                                                       |
| level     | `number`  | The list level (0 = top-level, 1 = sub-list, etc.)                                                                                                                                                                                               |
| restart   | `boolean` | _(Optional)_ Starts the list again at this paragraph, at every level's `start` (`1` by default). The paragraphs after it continue the restarted list, until another paragraph restarts it.                                                       |
| instance  | `number`  | _(Optional)_ Identifies the instance of the list. Paragraphs with the same `instance` continue numbering across paragraphs, and a new `instance` value starts a new list, at every level's `start`. With an `instance`, `restart` has no effect. |

### Restarting a list

Paragraphs that use the same `reference` are numbered as one list, even with other paragraphs, such as headings, between them. To count from 1 again, give the first paragraph of the new list `restart: true`. The paragraphs after it carry on from it:

```ts live
import { AlignmentType, Document, HeadingLevel, LevelFormat, Paragraph } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "my-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: 720, hanging: 260 },
                            },
                        },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({ text: "Ingredients", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "Flour", numbering: { reference: "my-numbering", level: 0 } }),
                new Paragraph({ text: "Water", numbering: { reference: "my-numbering", level: 0 } }),
                new Paragraph({ text: "Method", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({
                    text: "Mix the flour and water, numbered 1 again",
                    numbering: { reference: "my-numbering", level: 0, restart: true },
                }),
                new Paragraph({ text: "Knead the dough, numbered 2", numbering: { reference: "my-numbering", level: 0 } }),
            ],
        },
    ],
});
```

### Lists by instance

To say which list each paragraph is in, rather than where a list starts again, give the paragraphs an `instance`. Paragraphs with the same `instance` are one list, wherever they are in the document:

```ts live
import { AlignmentType, Document, LevelFormat, Paragraph } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "my-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: 720, hanging: 260 },
                            },
                        },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "First list item",
                    numbering: { reference: "my-numbering", level: 0, instance: 1 },
                }),
                new Paragraph({
                    text: "Second list item",
                    numbering: { reference: "my-numbering", level: 0, instance: 1 },
                }),
                new Paragraph({
                    text: "New list, starts again at 1",
                    numbering: { reference: "my-numbering", level: 0, instance: 2 },
                }),
            ],
        },
    ],
});
```

## Un-ordered lists / Bullet points

Add a `numbering` section to the `Document` to numbering style, define your levels. Use `LevelFormat.BULLET` for the `format` in `levels`. And then on a `Paragraph`, we can use the numbering created:

```ts live
import { AlignmentType, convertInchesToTwip, Document, LevelFormat, Paragraph } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "my-bullet-points",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.BULLET,
                        text: "\u2022",
                        alignment: AlignmentType.LEFT,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                            },
                        },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Hey you!",
                    numbering: {
                        reference: "my-bullet-points",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "Hey you again!",
                    numbering: {
                        reference: "my-bullet-points",
                        level: 0,
                    },
                }),
            ],
        },
    ],
});
```

## Disabling numbering inherited from paragraph style

If the numbering is set on a paragraph style, you may wish to disable it for a specific paragraph:

```ts live
import { AlignmentType, convertInchesToTwip, Document, LevelFormat, Paragraph } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "my-bullet-points",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.BULLET,
                        text: "\u2022",
                        alignment: AlignmentType.LEFT,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                            },
                        },
                    },
                ],
            },
        ],
    },
    styles: {
        paragraphStyles: [
            {
                id: "bullet",
                name: "Bullet",
                basedOn: "Normal",
                next: "Normal",
                run: {},
                paragraph: {
                    numbering: {
                        reference: "my-bullet-points",
                        level: 0,
                    },
                },
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "A bullet point from the style",
                    style: "bullet",
                }),
                new Paragraph({
                    text: "No bullet points!",
                    style: "bullet",
                    numbering: false,
                }),
            ],
        },
    ],
});
```

## Associating a level with a paragraph style

You can link a numbering level to a paragraph style using `style.style`. Any paragraph that uses the associated style will automatically adopt the numbering level without needing to specify `numbering` on each paragraph individually.

This is useful for creating reusable list styles — define the numbering once and apply it via the paragraph style:

```ts live
import { AlignmentType, Document, LevelFormat, Paragraph } from "docx";

const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "numberedListParagraph",
                name: "Numbered List Paragraph",
                paragraph: {
                    numbering: {
                        reference: "styled-numbering",
                        level: 0,
                    },
                    spacing: { after: 120 },
                },
            },
        ],
    },
    numbering: {
        config: [
            {
                reference: "styled-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: {
                            style: "numberedListParagraph",
                            paragraph: {
                                indent: { left: 720, hanging: 260 },
                            },
                        },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "First styled list item",
                    style: "numberedListParagraph",
                }),
                new Paragraph({
                    text: "Second styled list item",
                    style: "numberedListParagraph",
                }),
            ],
        },
    ],
});
```

The `style.style` value must match the `id` of a paragraph style defined in `styles.paragraphStyles`. This creates a `<w:pStyle>` element inside the numbering level definition, linking the two.

## Lists in templates

`patchDocument` takes the same `numbering` option, for the lists that the paragraphs in patches use. See [Lists](usage/templates.md#lists).

## Examples

### Numbering and Bullet Points

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/lists/numbering-and-bullet-points.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/lists/numbering-and-bullet-points.ts_

### Numbering with Paragraph Styles

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/lists/numbering-level-paragraph-style.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/lists/numbering-level-paragraph-style.ts_
