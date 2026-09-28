# Paragraph

> Everything (text, images, graphs etc) in OpenXML is organized in paragraphs.

!> Paragraphs requires an understanding of [Sections](usage/sections.md).

You can create `Paragraphs` in the following ways:

### Shorthand

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [new Paragraph("Short hand Hello World")],
        },
    ],
});
```

### Children Method

This method is useful for adding different [text](usage/text.md) with different styles, [symbols](usage/symbols.md), or adding [images](usage/images.md) inline.

```ts live
import { Document, Paragraph, SymbolRun, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new TextRun("Lorem Ipsum Foo Bar"), new TextRun("Hello World"), new SymbolRun("F071")],
                }),
            ],
        },
    ],
});
```

### Explicit

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Short hand notation for adding text.",
                }),
            ],
        },
    ],
});
```

After you create the paragraph, you must add the paragraph into a `section`:

```ts live
import { Document, Paragraph } from "docx";

const paragraph = new Paragraph("Hello World");

const doc = new Document({
    sections: [
        {
            children: [paragraph],
        },
    ],
});
```

Or the preferred convention, define the paragraph inside the section and remove the usage of variables:

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new TextRun("Lorem Ipsum Foo Bar"), new TextRun("Hello World")],
                }),
            ],
        },
    ],
});
```

## Options

This is the list of options for a paragraph. A detailed explanation is below:

| Property                       | Type                                                                                                                | Mandatory? | Possible Values                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [text](#text)                  | `string`                                                                                                            | Optional   |                                                                                                                                                             |
| [heading](#heading)            | `HeadingLevel`                                                                                                      | Optional   | `HEADING_1`, `HEADING_2`, `HEADING_3`, `HEADING_4`, `HEADING_5`, `HEADING_6`, `TITLE`                                                                       |
| [border](#border)              | `IBorderOptions`                                                                                                    | Optional   | `top`, `bottom`, `left`, `right`, `between`. Each of these are of type IBorderPropertyOptions. Click here for Example                                       |
| [spacing](#spacing)            | `ISpacingProperties`                                                                                                | Optional   | See below for ISpacingProperties                                                                                                                            |
| [outlineLevel](#outline-level) | `number`                                                                                                            | Optional   |                                                                                                                                                             |
| alignment                      | `AlignmentType`                                                                                                     | Optional   | `START`, `CENTER`, `END`, `BOTH`, `MEDIUM_KASHIDA`, `DISTRIBUTE`, `NUM_TAB`, `HIGH_KASHIDA`, `LOW_KASHIDA`, `THAI_DISTRIBUTE`, `LEFT`, `RIGHT`, `JUSTIFIED` |
| heading                        | `HeadingLevel`                                                                                                      | Optional   |                                                                                                                                                             |
| bidirectional                  | `boolean`                                                                                                           | Optional   |                                                                                                                                                             |
| thematicBreak                  | `boolean`                                                                                                           | Optional   |                                                                                                                                                             |
| pageBreakBefore                | `boolean`                                                                                                           | Optional   |                                                                                                                                                             |
| contextualSpacing              | `boolean`                                                                                                           | Optional   |                                                                                                                                                             |
| indent                         | `IIndentAttributesProperties`                                                                                       | Optional   |                                                                                                                                                             |
| keepLines                      | `boolean`                                                                                                           | Optional   |                                                                                                                                                             |
| keepNext                       | `boolean`                                                                                                           | Optional   |                                                                                                                                                             |
| children                       | `(TextRun or ImageRun or Hyperlink)[]`                                                                              | Optional   |                                                                                                                                                             |
| style                          | `string`                                                                                                            | Optional   |                                                                                                                                                             |
| [tabStop](usage/tab-stops)     | `{ left?: ITabStopOptions; right?: ITabStopOptions; maxRight?: { leader: LeaderType; }; center?: ITabStopOptions }` | Optional   |                                                                                                                                                             |
| [bullet](usage/bullet-points)  | `{ level: number }`                                                                                                 | Optional   |                                                                                                                                                             |
| [numbering](usage/numbering)   | `{ num: ConcreteNumbering; level: number; custom?: boolean }`                                                       | Optional   |                                                                                                                                                             |
| [widowControl](#widow-control) | `boolean`                                                                                                           | Optional   |                                                                                                                                                             |
| [frame](usage/text-frames.md)  | `IFrameOptions`                                                                                                     | Optional   |                                                                                                                                                             |

## Text

This is the text in a paragraph. You can also add text by using the `Paragraph` shorthand (mentioned above) or adding `children`.

**Example:**

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Hello World",
                }),
            ],
        },
    ],
});
```

## Heading

**Example:**

Setting a Heading 1 paragraph with "Hello World" as it's text:

```ts live
import { Document, HeadingLevel, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Hello World",
                    heading: HeadingLevel.HEADING_1,
                }),
            ],
        },
    ],
});
```

## Border

Add borders to a `Paragraph`. Good for making the `Paragraph` stand out. Border top and border bottom can be used as a horizontal rule (also known as horizontal line).

#### IBorderPropertyOptions

`top`, `bottom`, `left`, `right`, `between` of the border

| Property | Type                   | Notes    |
| -------- | ---------------------- | -------- |
| color    | `string \| ThemeColor` | Required |
| space    | `number`               | Required |
| style    | `string`               | Required |
| size     | `number`               | Required |

**Example:**

Add border on the top and the bottom of the paragraph

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "I have borders on my top and bottom sides!",
                    border: {
                        top: {
                            color: "auto",
                            space: 1,
                            style: "single",
                            size: 6,
                        },
                        bottom: {
                            color: "auto",
                            space: 1,
                            style: "single",
                            size: 6,
                        },
                    },
                }),
            ],
        },
    ],
});
```

Colors of borders and shading can be hex values, or colors of the document's theme, such as `{ theme: "accent1", lighter: 40 }`. See [Themes](usage/themes.md#text-tables-and-borders-in-the-themes-colors).

## Shading

Add color to an entire paragraph block

```ts live
import { Document, Paragraph, ShadingType } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "shading",
                    shading: {
                        type: ShadingType.REVERSE_DIAGONAL_STRIPE,
                        color: "00FFFF",
                        fill: "FF0000",
                    },
                }),
            ],
        },
    ],
});
```

## Widow Control

Allow First/Last Line to Display on a Separate Page

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "widow control",
                    widowControl: true,
                }),
            ],
        },
    ],
});
```

## Spacing

Adding spacing between paragraphs

### ISpacingProperties

| Property | Type           | Notes    | Possible Values                        |
| -------- | -------------- | -------- | -------------------------------------- |
| after    | `number`       | Optional |                                        |
| before   | `number`       | Optional |                                        |
| line     | `number`       | Optional |                                        |
| lineRule | `LineRuleType` | Optional | `AT_LEAST`, `EXACTLY`, `EXACT`, `AUTO` |

Note: The `lineRule` property has different values depending on the version of Word you are using. The `EXACTLY` value is only available in Word 2016 and above. Use `EXACT` for greater support, including LibreOffice etc. Read this issue for more information: https://github.com/dolanmiu/docx/issues/1773.

**Example:**

Add spacing before the paragraph:

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("Paragraph without spacing"),
                new Paragraph({
                    text: "Paragraph with spacing before",
                    spacing: {
                        before: 200,
                    },
                }),
            ],
        },
    ],
});
```

## Indentation

Set paragraph indentation from the page margins using the `indent` property.

### IIndentAttributesProperties

| Property       | Type                                 | Notes    | Description                                                                 |
| -------------- | ------------------------------------ | -------- | --------------------------------------------------------------------------- |
| start          | `number \| UniversalMeasure`         | Optional | Indentation from the leading edge (left in LTR, right in RTL), in twips     |
| end            | `number \| UniversalMeasure`         | Optional | Indentation from the trailing edge (right in LTR, left in RTL), in twips    |
| left           | `number \| UniversalMeasure`         | Optional | Indentation from the left margin, in twips                                  |
| right          | `number \| UniversalMeasure`         | Optional | Indentation from the right margin, in twips                                 |
| hanging        | `number \| PositiveUniversalMeasure` | Optional | Hanging indent removed from the first line, in twips                        |
| firstLine      | `number \| PositiveUniversalMeasure` | Optional | Additional first-line indent, in twips                                      |
| firstLineChars | `number`                             | Optional | First-line indent in hundredths of a character width (e.g. `200` = 2 chars) |

> `start`/`end` are the bidi-aware equivalents of `left`/`right`. Prefer `start`/`end` for documents that may be rendered in RTL languages.

**Example — first-line indent in twips:**

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Indented first line. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vehicula nec nulla vitae efficitur. Ut interdum mauris eu ipsum rhoncus, nec pharetra velit placerat.",
                    indent: {
                        firstLine: 720, // 720 twips = 0.5 inch
                    },
                }),
            ],
        },
    ],
});
```

**Example — character-based first-line indent:**

Use `firstLineChars` when you want Word to calculate the indent relative to the font's character width rather than a fixed measurement. The value is in hundredths of a character, so `200` means two characters.

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "First line indented by two characters. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vehicula nec nulla vitae efficitur. Ut interdum mauris eu ipsum rhoncus, nec pharetra velit placerat.",
                    indent: {
                        firstLineChars: 200,
                    },
                }),
            ],
        },
    ],
});
```

**Example — left and hanging indent:**

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Hanging indent paragraph. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vehicula nec nulla vitae efficitur. Ut interdum mauris eu ipsum rhoncus, nec pharetra velit placerat.",
                    indent: {
                        left: 720,
                        hanging: 360, // first line hangs back 360 twips from the left indent
                    },
                }),
            ],
        },
    ],
});
```

## Outline Level

**Example:**

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Hello World",
                    outlineLevel: 0,
                }),
            ],
        },
    ],
});
```

## Styles

To create styles, please refer to the [styling documentation](usage/styling-with-js)

### Headings and titles

```ts live
import { Document, HeadingLevel, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Hello World",
                    heading: HeadingLevel.TITLE,
                }),
            ],
        },
    ],
});
```

## Text Alignment

To change the text alignment of a paragraph, add an `AlignmentType` option on the paragraph.for center, left, right or justified:

**Example:**

```ts live
import { AlignmentType, Document, HeadingLevel, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Hello World",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                }),
            ],
        },
    ],
});
```

The above will create a `heading 1` which is `centered`.

### Justified text with breaks

When a paragraph is justified, incomplete lines ending in a soft line break are stretched to fill the full width by default. To prevent this, enable `doNotExpandShiftReturn` in the document's compatibility options:

```ts live
import { AlignmentType, Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    compatibility: {
        doNotExpandShiftReturn: true,
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new TextRun("This justified paragraph won't stretch"), new TextRun({ text: "soft line breaks.", break: 1 })],
                    alignment: AlignmentType.JUSTIFIED,
                }),
            ],
        },
    ],
});
```

## Thematic Break

To add a thematic break in the `Paragraph`:

```ts live
import { Document, HeadingLevel, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Amazing Heading",
                    heading: HeadingLevel.HEADING_1,
                    thematicBreak: true,
                }),
            ],
        },
    ],
});
```

The above example will create a heading with a horizontal line directly under it.

## Page Break

To move to a new page (insert a page break):

```ts live
import { Document, PageBreak, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new TextRun("Amazing Heading"), new PageBreak()],
                }),
                new Paragraph("This text starts on the new page"),
            ],
        },
    ],
});
```

The above example will create a heading and start a new page immediately afterwards.

### Page break before:

This option (available in word) will make sure that the paragraph will start on a new page (if it's not already on a new page).

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("Hello World"),
                new Paragraph({
                    text: "Hello World on another page",
                    pageBreakBefore: true,
                }),
            ],
        },
    ],
});
```

![Page Break Before in Word](https://user-images.githubusercontent.com/34742290/40176503-df3a8398-59db-11e8-8b9c-d719f13aa8b4.png)

Example: https://github.com/dolanmiu/docx/blob/master/demo/paragraphs/page-break-before.ts

## Page break control

Paragraphs have `keepLines` and `keepNext` properties that allow restricting page breaks within and between paragraphs. See [this Microsoft article](https://support.microsoft.com/en-us/office/keep-text-together-in-word-af94e5b8-3a5a-4cb0-9c53-dea56b43d96d) for more details.

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Stay on the same page",
                    keepLines: true,
                    keepNext: true,
                }),
            ],
        },
    ],
});
```
