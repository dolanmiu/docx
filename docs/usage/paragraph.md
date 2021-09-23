# Paragraph

> Everything (text, images, graphs etc) in OpenXML is organized in paragraphs.

!> Paragraphs requires an understanding of [Sections](usage/sections.md).

You can create `Paragraphs` in the following ways:

### Shorthand

```ts
import { Paragraph } from "docx";

const paragraph = new Paragraph("Short hand Hello World");
```

### Children Method

This method is useful for adding different [text](usage/text.md) with different styles, [symbols](usage/symbols.md), or adding [images](usage/images.md) inline.

```ts
const paragraph = new Paragraph({
    children: [new TextRun("Lorem Ipsum Foo Bar"), new TextRun("Hello World"), new SymbolRun("F071")],
});
```

### Explicit

```ts
const paragraph = new Paragraph({
    text: "Short hand notation for adding text.",
});
```

After you create the paragraph, you must add the paragraph into a `section`:

```ts
const doc = new Document({
    sections: [{
        children: [paragraph],
    }];
});
```

Or the preferred convention, define the paragraph inside the section and remove the usage of variables:

```ts
const doc = new Document({
    sections: [{
        children: [
            new Paragraph({
                children: [new TextRun("Lorem Ipsum Foo Bar"), new TextRun("Hello World")],
            }),
        ],
    }];
});
```

## Options

This is the list of options for a paragraph. A detailed explanation is below:

| Property                       | Type                                                                                                                | Mandatory? | Possible Values                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| [text](#text)                  | `string`                                                                                                            | Optional   |                                                                                                            |
| [heading](#heading)            | `HeadingLevel`                                                                                                      | Optional   | `HEADING_1`, `HEADING_2`, `HEADING_3`, `HEADING_4`, `HEADING_5`, `HEADING_6`, `TITLE`                      |
| [border](#border)              | `IBorderOptions`                                                                                                    | Optional   | `top`, `bottom`, `left`, `right`. Each of these are of type IBorderPropertyOptions. Click here for Example |
| [spacing](#spacing)            | `ISpacingProperties`                                                                                                | Optional   | See below for ISpacingProperties                                                                           |
| [outlineLevel](#outline-level) | `number`                                                                                                            | Optional   |                                                                                                            |
| alignment                      | `AlignmentType`                                                                                                     | Optional   |                                                                                                            |
| heading                        | `HeadingLevel`                                                                                                      | Optional   |                                                                                                            |
| bidirectional                  | `boolean`                                                                                                           | Optional   |                                                                                                            |
| thematicBreak                  | `boolean`                                                                                                           | Optional   |                                                                                                            |
| pageBreakBefore                | `boolean`                                                                                                           | Optional   |                                                                                                            |
| contextualSpacing              | `boolean`                                                                                                           | Optional   |                                                                                                            |
| indent                         | `IIndentAttributesProperties`                                                                                       | Optional   |                                                                                                            |
| keepLines                      | `boolean`                                                                                                           | Optional   |                                                                                                            |
| keepNext                       | `boolean`                                                                                                           | Optional   |                                                                                                            |
| children                       | `(TextRun or ImageRun or Hyperlink)[]`                                                                            | Optional   |                                                                                                            |
| style                          | `string`                                                                                                            | Optional   |                                                                                                            |
| [tabStop](usage/tab-stops)     | `{ left?: ITabStopOptions; right?: ITabStopOptions; maxRight?: { leader: LeaderType; }; center?: ITabStopOptions }` | Optional   |                                                                                                            |
| [bullet](usage/bullet-points)  | `{ level: number }`                                                                                                 | Optional   |                                                                                                            |
| [numbering](usage/numbering)   | `{ num: ConcreteNumbering; level: number; custom?: boolean }`                                                       | Optional   |                                                                                                            |
| [widowControl](#widow-control) | `boolean`                                                                                                           | Optional   |                                                                                                            |
| [frame](usage/text-frames.md)  | `IFrameOptions`                                                                                                     | Optional   |                                                                                                            |

## Text

This is the text in a paragraph. You can also add text by using the `Paragraph` shorthand (mentioned above) or adding `children`.

**Example:**

```ts
const paragraph = new Paragraph({
    text: "Hello World",
});
```

## Heading

**Example:**

Setting a Heading 1 paragraph with "Hello World" as it's text:

```ts
const paragraph = new Paragraph({
    text: "Hello World",
    heading: HeadingLevel.HEADING_1,
});
```

## Border

Add borders to a `Paragraph`. Good for making the `Paragraph` stand out

#### IBorderPropertyOptions

`top`, `bottom`, `left`, `right` of the border

| Property | Type     | Notes    |
| -------- | -------- | -------- |
| color    | `string` | Required |
| space    | `number` | Required |
| value    | `string` | Required |
| size     | `number` | Required |

**Example:**

Add border on the top and the bottom of the paragraph

```ts
const paragraph = new Paragraph({
    text: "I have borders on my top and bottom sides!",
    border: {
        top: {
            color: "auto",
            space: 1,
            value: "single",
            size: 6,
        },
        bottom: {
            color: "auto",
            space: 1,
            value: "single",
            size: 6,
        },
    },
});
```

## Shading

Add color to an entire paragraph block

```ts
const paragraph = new Paragraph({
    text: "shading",
    shading: {
        type: ShadingType.REVERSE_DIAGONAL_STRIPE,
        color: "00FFFF",
        fill: "FF0000",
    },
});
```

## Widow Control

Allow First/Last Line to Display on a Separate Page

```ts
const paragraph = new Paragraph({
    text: "shading",
    widowControl: true,
});
```

## Spacing

Adding spacing between paragraphs

### ISpacingProperties

| Property | Type           | Notes    | Possible Values               |
| -------- | -------------- | -------- | ----------------------------- |
| after    | `number`       | Optional |                               |
| before   | `number`       | Optional |                               |
| line     | `number`       | Optional |                               |
| lineRule | `LineRuleType` | Optional | `AT_LEAST`, `EXACTLY`, `AUTO` |

**Example:**

Add spacing before the paragraph:

```ts
const paragraph = new Paragraph({
    text: "Paragraph with spacing before",
    spacing: {
        before: 200,
    },
});
```

## Outline Level

**Example:**

```ts
const paragraph = new Paragraph({
    outlineLevel: 0,
});
```

## Styles

To create styles, please refer to the [styling documentation](usage/styling-with-js)

![Word 2013 Styles menu](http://content.gcflearnfree.org/topics/233/style_apply_choose.png "Word 2013 Styles menu")

### Headings and titles

```ts
import { HeadingLevel, Paragraph } from "docx";

const paragraph = new Paragraph({
    text: "Hello World",
    heading: HeadingLevel.TITLE,
});
```

## Text Alignment

To change the text alignment of a paragraph, add an `AlignmentType` option on the paragraph.for center, left, right or justified:

**Example:**

```ts
const paragraph = new Paragraph({
    text: "Hello World",
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
});
```

The above will create a `heading 1` which is `centered`.

### Justified text with breaks

When a paragraph is justified, you may want to not justify the contents of incomplete lines, which end in a soft line break.

![Justified line before](https://user-images.githubusercontent.com/7989576/53820338-e060c680-3f6b-11e9-817c-ecb43271951e.png)

This is possible to achieve using:

```ts
this.doc.Settings.addCompatibility().doNotExpandShiftReturn();
```

The result is:

![Justified line after](https://user-images.githubusercontent.com/7989576/53820344-e2c32080-3f6b-11e9-9afe-24a2ed6e0d78.png)

## Thematic Break

To add a thematic break in the `Paragraph`:

```ts
const paragraph = new docx.Paragraph("Amazing Heading");
const paragraph = new Paragraph({
    text: "Amazing Heading",
    heading: HeadingLevel.HEADING_1,
    thematicBreak: true,
});
```

The above example will create a heading with a page break directly under it.

## Page Break

To move to a new page (insert a page break):

```ts
const paragraph = new docx.Paragraph({
    children: [new TextRun("Amazing Heading"), new PageBreak()],
});
```

The above example will create a heading and start a new page immediately afterwards.

### Page break before:

This option (available in word) will make sure that the paragraph will start on a new page (if it's not already on a new page).

```ts
const paragraph = new Paragraph({
    text: "Hello World on another page",
    pageBreakBefore: true,
});
```

![Page Break Before in Word](https://user-images.githubusercontent.com/34742290/40176503-df3a8398-59db-11e8-8b9c-d719f13aa8b4.png)

Example: https://github.com/dolanmiu/docx/blob/master/demo/15-page-break-before.ts

## Page break control

Paragraphs have `.keepLines()` and `.keepNext()` methods that allow restricting page breaks within and between paragraphs. See [this Microsoft article](https://support.office.com/en-us/article/Keep-lines-and-paragraphs-together-d72af534-926f-4c4b-830a-abfc2daa3bfa) for more details)
