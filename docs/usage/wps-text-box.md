# WPS Text Box

WPS (WordProcessing Shape) text boxes are the modern, DrawingML-based alternative to [VML Text Boxes](usage/text-box.md). They support background fills, outlines, rotation, and precise floating positioning.

!> `WPS Text Boxes` require an understanding of [Paragraphs](usage/paragraph.md).

## When to Use WPS vs VML Text Boxes

| Feature            | WPS Text Box (`WpsShapeRun`) | VML Text Box (`Textbox`) |
| ------------------ | ---------------------------- | ------------------------ |
| Based on           | DrawingML (modern OOXML)     | VML (legacy)             |
| Background fill    | Yes (RGB and scheme colors)  | No                       |
| Border / outline   | Yes (with full styling)      | No                       |
| Rotation           | Yes                          | No                       |
| Floating position  | Yes                          | No                       |
| Vertical alignment | Yes (top, center, bottom)    | No                       |
| Compatibility      | Word 2010+                   | All Word versions        |

Use `WpsShapeRun` when you need fills, outlines, rotation, or precise positioning. Use `Textbox` for simple inline text boxes with maximum backward compatibility.

## Basic Usage

A `WpsShapeRun` is added as a child of a `Paragraph`, similar to `ImageRun`:

```ts
import { Document, Paragraph, TextRun, WpsShapeRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new WpsShapeRun({
                            type: "wps",
                            children: [new Paragraph("Hello from a WPS text box!")],
                            transformation: {
                                width: 200,
                                height: 100,
                            },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

## Options

| Property       | Type                     | Notes    | Description                                |
| -------------- | ------------------------ | -------- | ------------------------------------------ |
| type           | `"wps"`                  | Required | Identifies the run as a WPS shape          |
| children       | `Paragraph[]`            | Required | Content inside the text box                |
| transformation | `IMediaTransformation`   | Required | Size, position, rotation, and flip         |
| floating       | `IFloating`              | Optional | Floating position (anchor mode)            |
| solidFill      | `SolidFillOptions`       | Optional | Background fill color                      |
| outline        | `OutlineOptions`         | Optional | Border / outline styling                   |
| bodyProperties | `IBodyPropertiesOptions` | Optional | Internal margins, vertical anchor, autofit |
| altText        | `DocPropertiesOptions`   | Optional | Accessibility text (title, description)    |

## Transformation

Controls the size, offset, rotation, and flip of the text box. Dimensions are in **pixels** (converted to EMUs internally at 1px = 9525 EMUs).

```ts
new WpsShapeRun({
    type: "wps",
    children: [new Paragraph("Rotated text box")],
    transformation: {
        width: 300,
        height: 150,
        rotation: 45, // degrees
    },
});
```

| Property | Type                                           | Notes    | Description               |
| -------- | ---------------------------------------------- | -------- | ------------------------- |
| width    | `number`                                       | Required | Width in pixels           |
| height   | `number`                                       | Required | Height in pixels          |
| offset   | `{ top?: number, left?: number }`              | Optional | Offset in pixels          |
| rotation | `number`                                       | Optional | Rotation angle in degrees |
| flip     | `{ vertical?: boolean, horizontal?: boolean }` | Optional | Flip transformations      |

## Floating Position

By default, a `WpsShapeRun` is rendered inline. Add the `floating` property to anchor it at a specific position on the page. Offset values are in EMUs (1 inch = 914400 EMUs).

```ts
new WpsShapeRun({
    type: "wps",
    children: [new Paragraph("Floating text box")],
    transformation: {
        width: 200,
        height: 100,
    },
    floating: {
        zIndex: 10,
        horizontalPosition: {
            offset: 1014400,
        },
        verticalPosition: {
            offset: 1014400,
        },
    },
});
```

The `floating` options are the same as for [Images](usage/images.md#floating), including `horizontalPosition`, `verticalPosition`, `wrap`, `margins`, `zIndex`, `behindDocument`, `lockAnchor`, `layoutInCell`, and `allowOverlap`.

## Background Fill

Set a background color using `solidFill`:

### RGB Color

```ts
new WpsShapeRun({
    type: "wps",
    children: [new Paragraph("Red background")],
    transformation: { width: 200, height: 100 },
    solidFill: {
        type: "rgb",
        value: "FF0000", // hex color
    },
});
```

### Scheme Color

Use theme colors instead of hardcoded values:

```ts
import { SchemeColor } from "docx";

new WpsShapeRun({
    type: "wps",
    children: [new Paragraph("Themed background")],
    transformation: { width: 200, height: 100 },
    solidFill: {
        type: "scheme",
        value: SchemeColor.ACCENT1,
    },
});
```

Available scheme colors: `BG1`, `BG2`, `TX1`, `TX2`, `ACCENT1`-`ACCENT6`, `HLINK`, `FOLHLINK`, `DK1`, `DK2`, `LT1`, `LT2`, `PHCLR`.

## Outline

Add a border/outline to the text box:

### Solid Outline

```ts
new WpsShapeRun({
    type: "wps",
    children: [new Paragraph("Bordered text box")],
    transformation: { width: 200, height: 100 },
    outline: {
        type: "solidFill",
        solidFillType: "rgb",
        value: "0000FF",
        width: 9525, // width in EMUs (9525 = 1px)
        cap: "ROUND",
    },
});
```

### No Outline

```ts
outline: {
    type: "noFill",
},
```

### Outline Options

| Property      | Type                                                                    | Notes                  | Description        |
| ------------- | ----------------------------------------------------------------------- | ---------------------- | ------------------ |
| type          | `"solidFill"` \| `"noFill"`                                             | Required               | Fill type          |
| solidFillType | `"rgb"` \| `"scheme"`                                                   | Required for solidFill | Color type         |
| value         | `string` \| `SchemeColor`                                               | Required for solidFill | Color value        |
| width         | `number`                                                                | Optional               | Line width in EMUs |
| cap           | `"ROUND"` \| `"SQUARE"` \| `"FLAT"`                                     | Optional               | Line cap style     |
| compoundLine  | `"SINGLE"` \| `"DOUBLE"` \| `"THICK_THIN"` \| `"THIN_THICK"` \| `"TRI"` | Optional               | Line pattern       |

## Body Properties

Configure text layout inside the text box:

```ts
import { VerticalAnchor } from "docx";

new WpsShapeRun({
    type: "wps",
    children: [new Paragraph("Centered text")],
    transformation: { width: 200, height: 200 },
    bodyProperties: {
        verticalAnchor: VerticalAnchor.CENTER,
        margins: {
            top: 45720, // in EMUs
            bottom: 45720,
            left: 91440,
            right: 91440,
        },
        noAutoFit: true,
    },
});
```

| Property       | Type                                         | Notes    | Description                    |
| -------------- | -------------------------------------------- | -------- | ------------------------------ |
| verticalAnchor | `VerticalAnchor`                             | Optional | Vertical text alignment        |
| margins        | `{ top?, bottom?, left?, right? }` (numbers) | Optional | Internal padding in EMUs       |
| noAutoFit      | `boolean`                                    | Optional | Disable auto-fit text to shape |

`VerticalAnchor` values: `TOP`, `CENTER`, `BOTTOM`.

## Complete Example

A floating callout box with background fill, outline, and centered text:

```ts
import { AlignmentType, Document, Packer, Paragraph, SchemeColor, TextRun, VerticalAnchor, WpsShapeRun } from "docx";
import * as fs from "fs";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("Main document content goes here..."),
                new Paragraph({
                    children: [
                        new WpsShapeRun({
                            type: "wps",
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            text: "Important Notice",
                                            bold: true,
                                            size: 28,
                                            color: "FFFFFF",
                                        }),
                                    ],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            text: "This callout uses a WPS text box with fill and outline.",
                                            color: "FFFFFF",
                                        }),
                                    ],
                                }),
                            ],
                            transformation: {
                                width: 300,
                                height: 150,
                            },
                            solidFill: {
                                type: "rgb",
                                value: "2F5496",
                            },
                            outline: {
                                type: "solidFill",
                                solidFillType: "rgb",
                                value: "1F3864",
                                width: 19050,
                            },
                            bodyProperties: {
                                verticalAnchor: VerticalAnchor.CENTER,
                            },
                            floating: {
                                zIndex: 10,
                                horizontalPosition: {
                                    offset: 4572000,
                                },
                                verticalPosition: {
                                    offset: 914400,
                                },
                            },
                        }),
                    ],
                }),
                new Paragraph("More document content continues..."),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("document.docx", buffer);
});
```

## WPS Text Box vs Text Frame vs VML Text Box

| Feature           | WPS Text Box       | Text Frame        | VML Text Box   |
| ----------------- | ------------------ | ----------------- | -------------- |
| Based on          | DrawingML shapes   | Paragraph framing | VML shapes     |
| Background fill   | Yes                | No                | No             |
| Border / outline  | Yes                | Yes (limited)     | No             |
| Rotation          | Yes                | No                | No             |
| Floating position | Yes                | Limited           | No             |
| Auto-sizing       | Yes (configurable) | No                | Yes            |
| Compatibility     | Word 2010+         | All versions      | Older versions |

For rich formatting and positioning, use **WPS Text Box**. For simple paragraph framing, use [Text Frames](usage/text-frames.md). For basic legacy text boxes, use [VML Text Box](usage/text-box.md).
