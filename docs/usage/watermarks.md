# Watermarks

!> Watermarks require an understanding of [Headers and Footers](usage/headers-and-footers.md).

A watermark is faint text or a picture drawn behind the content of every page, such as "DRAFT", "CONFIDENTIAL" or a company logo.

Word stores a watermark as a shape inside the page header, so it repeats on every page of the section. `docx` follows the same approach: place a `TextWatermark` or `ImageWatermark` inside a `Paragraph` in a `Header`. The generated markup matches what Word writes, so Word recognizes the watermark and can remove or replace it through its own **Design > Watermark** menu.

## Text Watermark

```ts
import { Document, Header, Packer, Paragraph, TextWatermark } from "docx";

const doc = new Document({
    sections: [
        {
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [new TextWatermark({ text: "DRAFT" })],
                        }),
                    ],
                }),
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

By default the text is drawn diagonally across the page in semi-transparent silver Calibri, which matches Word's default watermark.

### Text Watermark Options

| Property   | Type                         | Notes    | Description                                                                                                                |
| ---------- | ---------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `text`     | `string`                     | Required | The text to display                                                                                                        |
| `font`     | `string`                     | Optional | Font family. Default is `Calibri`                                                                                          |
| `fontSize` | `number`                     | Optional | Font size in points. When omitted the text is sized automatically to fill the watermark's width and height, as in Word     |
| `bold`     | `boolean`                    | Optional | Bold text                                                                                                                  |
| `italics`  | `boolean`                    | Optional | Italic text                                                                                                                |
| `color`    | `string`                     | Optional | A named colour such as `silver` or a hex value such as `C0C0C0`. Default is `silver`                                       |
| `opacity`  | `number`                     | Optional | From `0` (invisible) to `1` (solid). Default is `0.5`, which is Word's "Semitransparent" setting                           |
| `layout`   | `"diagonal" \| "horizontal"` | Optional | Whether the text runs diagonally across the page or horizontally. Default is `diagonal`                                    |
| `rotation` | `number`                     | Optional | Clockwise rotation in degrees. Overrides the rotation implied by `layout`                                                  |
| `width`    | `number`                     | Optional | Width of the watermark in points. Default is `527.85`, which spans a Letter or A4 page diagonally                          |
| `height`   | `number`                     | Optional | Height of the watermark in points. Defaults to a height that keeps the letters in proportion for the width and text length |

### Customising the Text

```ts
new TextWatermark({
    text: "CONFIDENTIAL",
    font: "Arial",
    color: "FF0000",
    opacity: 0.3,
    bold: true,
});
```

### Horizontal Layout

```ts
new TextWatermark({
    text: "SAMPLE",
    layout: "horizontal",
});
```

### Sizing

Word stretches watermark text to fill the shape, so the shape's width and height control how large the text appears. Because `docx` cannot measure fonts, the default height is estimated from the text length so that the letters keep their proportions. Set `width` and `height` explicitly to take full control:

```ts
new TextWatermark({
    text: "DRAFT",
    width: 400,
    height: 100,
});
```

## Image Watermark

```ts
import * as fs from "fs";
import { Document, Header, ImageWatermark, Packer, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new ImageWatermark({
                                    type: "png",
                                    data: fs.readFileSync("./logo.png"),
                                    transformation: {
                                        width: 400,
                                        height: 400,
                                    },
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

The image is centred on the page and, by default, washed out so that the document text remains readable over it. This matches Word's "Washout" option.

### Image Watermark Options

| Property         | Type                                            | Notes    | Description                                                       |
| ---------------- | ----------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `type`           | `"jpg" \| "png" \| "gif" \| "bmp"`              | Required | The image format. SVG is not supported by VML pictures            |
| `data`           | `Buffer \| string \| Uint8Array \| ArrayBuffer` | Required | The image data, or a base64-encoded data URI                      |
| `transformation` | `{ width: number; height: number }`             | Required | Size at which the image is drawn, in pixels, matching `ImageRun`  |
| `washout`        | `boolean`                                       | Optional | Lightens the image so that text stays readable. Default is `true` |
| `title`          | `string`                                        | Optional | Title of the image, shown by Word as the picture's name           |

### Full-Strength Image

```ts
new ImageWatermark({
    type: "png",
    data: fs.readFileSync("./logo.png"),
    transformation: { width: 300, height: 300 },
    washout: false,
});
```

## Watermarks on Specific Pages

Watermarks live in headers, so they follow the header rules. Use a `first` header to watermark only the cover page, or omit the watermark from the `first` header to leave the cover page clean:

```ts
const doc = new Document({
    sections: [
        {
            properties: {
                titlePage: true,
            },
            headers: {
                first: new Header({
                    children: [new Paragraph("Cover page without a watermark")],
                }),
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [new TextWatermark({ text: "DRAFT" })],
                        }),
                    ],
                }),
            },
            children: [/* ... */],
        },
    ],
});
```

Each section has its own headers, so different sections can carry different watermarks, or none at all.

## Combining with Header Text

The watermark is an inline element, so it can share a paragraph with ordinary header content:

```ts
new Header({
    children: [
        new Paragraph({
            children: [new TextWatermark({ text: "DRAFT" }), new TextRun("Company Name")],
        }),
    ],
});
```

## How It Works

Word draws watermarks with VML (Vector Markup Language), the legacy drawing format still used for objects in headers and footers. A text watermark is a WordArt shape (`v:shape` of type `_x0000_t136`) with a `v:textpath` carrying the text, and an image watermark is a picture frame shape (`_x0000_t75`) with a `v:imagedata` referencing the embedded image. Both are anchored to the centre of the page margins and given a negative z-index so they sit behind the document text.

## Demos

### Text Watermark

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/105-text-watermark.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/105-text-watermark.ts_

### Image Watermark

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/106-image-watermark.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/106-image-watermark.ts_
