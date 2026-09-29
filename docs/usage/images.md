# Images

!> Images requires an understanding of [Sections](usage/sections.md) and [Paragraphs](usage/paragraph.md).

?> To draw rectangles, lines, arrows and other shapes instead of pictures, see [Shapes](usage/shapes.md).

## Common Use Cases

| I want to...                           | Use                     | Example                      |
| -------------------------------------- | ----------------------- | ---------------------------- |
| Insert an image inline with text       | Inline (default)        | Logo next to company name    |
| Position image at specific coordinates | Floating with offset    | Letterhead logo at top-right |
| Have text wrap around an image         | Floating with wrap      | Magazine-style layout        |
| Put an image in a table cell           | Inline in TableCell     | Product catalog              |
| Add image to header/footer             | Inline in Header/Footer | Company letterhead           |
| Trim edges off an image                | `crop` option           | Removing unwanted borders    |

## Inline vs Floating: When to Use Which

**Use Inline when:**

- Image should flow with text
- Image is part of content (diagrams, screenshots)
- Image goes inside tables
- Image in headers/footers

**Use Floating when:**

- Image needs precise positioning
- Text should wrap around image
- Image overlays content (watermarks)
- Complex page layouts

---

To create a `floating` image on top of text:

```ts live
import { Document, ImageRun, Paragraph, TextRun } from "docx";
import * as fs from "fs";

const image = new ImageRun({
    type: "gif",
    data: fs.readFileSync("./demo/assets/images/pizza.gif"),
    transformation: {
        width: 200,
        height: 200,
    },
    floating: {
        horizontalPosition: {
            offset: 1014400,
        },
        verticalPosition: {
            offset: 1014400,
        },
    },
});

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [image, new TextRun("The image floats on top of this text, instead of making room for it in the line.")],
                }),
            ],
        },
    ],
});
```

By default with no arguments, its an `inline` image. Add it into the document by adding the image into a paragraph:

```ts live
import { Document, ImageRun, Paragraph } from "docx";
import * as fs from "fs";

const image = new ImageRun({
    type: "gif",
    data: fs.readFileSync("./demo/assets/images/pizza.gif"),
    transformation: {
        width: 100,
        height: 100,
    },
});

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [image],
                }),
            ],
        },
    ],
});
```

## Intro

Adding images can be easily done by creating an instance of `ImageRun`. This can be added in a `Paragraph` or `Hyperlink`:

```ts live
import { Document, ImageRun, Paragraph } from "docx";
import * as fs from "fs";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "png",
                            data: fs.readFileSync("./demo/assets/images/dog.png"),
                            transformation: {
                                width: 166,
                                height: 150,
                            },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

`docx` supports `jpeg`, `jpg`, `bmp`, `gif` and `png`

The `width` and `height` in `transformation` are in pixels, at 96 to the inch, so `width: 528` is 5.5 inches wide. They aren't in EMUs, which floating offsets use. Word won't open a document with an image more than 225457 pixels wide or tall, so `docx` throws an error for one, such as an image sized in EMUs by mistake.

## Positioning

> Positioning is the method on how to place the image on the document

![Word Image Positioning](https://user-images.githubusercontent.com/34742290/41765548-b0946302-7604-11e8-96f9-166a9f0b8f39.png)

Two types of image positioning are supported:

- Floating
- Inline

By default, images are exported as `Inline` elements.

### Usage

To float an image, give the `ImageRun` a `floating` option, as the examples below do.

## Floating

To change the position the image to be on top of the text, simply add the `floating` property to the last argument. By default, the offsets are relative to the top left corner of the `page`. Offset units are in [emus](https://startbigthinksmall.wordpress.com/2010/01/04/points-inches-and-emus-measuring-units-in-office-open-xml/):

```ts live
import { Document, ImageRun, Paragraph, TextRun } from "docx";
import * as fs from "fs";

const image = new ImageRun({
    type: "png",
    data: fs.readFileSync("./demo/assets/images/linux-png.png"),
    transformation: {
        width: 200,
        height: 240,
    },
    floating: {
        horizontalPosition: {
            offset: 1014400, // relative: HorizontalPositionRelativeFrom.PAGE by default
        },
        verticalPosition: {
            offset: 1014400, // relative: VerticalPositionRelativeFrom.PAGE by default
        },
    },
});

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        image,
                        new TextRun("The image is placed 1014400 EMUs from the top left corner of the page, on top of this text."),
                    ],
                }),
            ],
        },
    ],
});
```

```ts live
import { Document, HorizontalPositionRelativeFrom, ImageRun, Paragraph, TextRun, VerticalPositionRelativeFrom } from "docx";
import * as fs from "fs";

const image = new ImageRun({
    type: "png",
    data: fs.readFileSync("./demo/assets/images/linux-png.png"),
    transformation: {
        width: 60,
        height: 72,
    },
    floating: {
        horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.RIGHT_MARGIN,
            offset: 182880,
        },
        verticalPosition: {
            relative: VerticalPositionRelativeFrom.BOTTOM_MARGIN,
            offset: 182880,
        },
    },
});

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [image, new TextRun("The image is placed in the bottom right corner, in the right and bottom margins.")],
                }),
            ],
        },
    ],
});
```

### Options

Full options you can pass into `floating` are:

| Property           | Type                        | Notes    |
| ------------------ | --------------------------- | -------- |
| horizontalPosition | `HorizontalPositionOptions` | Required |
| verticalPosition   | `VerticalPositionOptions`   | Required |
| allowOverlap       | `boolean`                   | Optional |
| lockAnchor         | `boolean`                   | Optional |
| behindDocument     | `boolean`                   | Optional |
| layoutInCell       | `boolean`                   | Optional |
| zIndex             | `number`                    | Optional |

`HorizontalPositionOptions` are:

| Property | Type                             | Notes                                             | Possible Values                                                                                           |
| -------- | -------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| relative | `HorizontalPositionRelativeFrom` | Required                                          | `CHARACTER`, `COLUMN`, `INSIDE_MARGIN`, `LEFT_MARGIN`, `MARGIN`, `OUTSIDE_MARGIN`, `PAGE`, `RIGHT_MARGIN` |
| align    | `HorizontalPositionAlign`        | You can either have `align` or `offset`, not both | `CENTER`, `INSIDE`, `LEFT`, `OUTSIDE`, `RIGHT`                                                            |
| offset   | `number`                         | You can either have `align` or `offset`, not both | `0` to `Infinity`                                                                                         |

`VerticalPositionOptions` are:

| Property | Type                           | Notes                                             | Possible Values                                                                                         |
| -------- | ------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| relative | `VerticalPositionRelativeFrom` | Required                                          | `BOTTOM_MARGIN`, `INSIDE_MARGIN`, `LINE`, `MARGIN`, `OUTSIDE_MARGIN`, `PAGE`, `PARAGRAPH`, `TOP_MARGIN` |
| align    | `VerticalPositionAlign`        | You can either have `align` or `offset`, not both | `BOTTOM`, `CENTER`, `INSIDE`, `OUTSIDE`, `TOP`                                                          |
| offset   | `number`                       | You can either have `align` or `offset`, not both | `0` to `Infinity`                                                                                       |

## Wrap text

Wrapping only works for floating elements. Text will "wrap" around the floating `image`.

Add `wrap` options inside the `floating` options:

```ts
wrap: {
    type: [TextWrappingType],
    side: [TextWrappingSide],
},
```

For example:

```ts live
import { Document, ImageRun, Paragraph, TextRun, TextWrappingSide, TextWrappingType } from "docx";
import * as fs from "fs";

const image = new ImageRun({
    type: "gif",
    data: fs.readFileSync("./demo/assets/images/pizza.gif"),
    transformation: {
        width: 200,
        height: 200,
    },
    floating: {
        horizontalPosition: {
            offset: 2014400,
        },
        verticalPosition: {
            offset: 2014400,
        },
        wrap: {
            type: TextWrappingType.SQUARE,
            side: TextWrappingSide.BOTH_SIDES,
        },
    },
});

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [image, new TextRun("This text wraps around both sides of the image. ".repeat(40))],
                }),
            ],
        },
    ],
});
```

Wrap options have the following properties are:

| Property | Type               | Notes    | Possible Values                                        |
| -------- | ------------------ | -------- | ------------------------------------------------------ |
| type     | `TextWrappingType` | Optional | `NONE`, `SQUARE`, `TIGHT`, `THROUGH`, `TOP_AND_BOTTOM` |
| side     | `TextWrappingSide` | Optional | `BOTH_SIDES`, `LEFT`, `RIGHT`, `LARGEST`               |

## Margins

Margins give some space between the text and the image. Margins [only work for floating elements](http://officeopenxml.com/drwPicInline.php). Additionally, the image must also be in wrap mode (see above).

?> Be sure to also set `wrap` in your options!

To use, add the `margins` options inside the `floating` options:

```ts
margins: {
    top: number,
    bottom: number,
    left: number,
    right: number
},
```

For example:

```ts live
import { Document, ImageRun, Paragraph, TextRun, TextWrappingSide, TextWrappingType } from "docx";
import * as fs from "fs";

const image = new ImageRun({
    type: "gif",
    data: fs.readFileSync("./demo/assets/images/pizza.gif"),
    transformation: {
        width: 200,
        height: 200,
    },
    floating: {
        horizontalPosition: {
            offset: 2014400,
        },
        verticalPosition: {
            offset: 2014400,
        },
        wrap: {
            type: TextWrappingType.SQUARE,
            side: TextWrappingSide.BOTH_SIDES,
        },
        margins: {
            top: 201440,
            bottom: 201440,
        },
    },
});

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [image, new TextRun("The margins keep this text further from the top and bottom of the image. ".repeat(40))],
                }),
            ],
        },
    ],
});
```

## Run Formatting

Use `run` to format the run the image is in, with the same options as a `TextRun`'s formatting. `position` raises or lowers an inline image from the text's baseline, by a signed length such as `"2pt"` or `"-2pt"`:

```ts live
import { Document, ImageRun, Paragraph, TextRun } from "docx";
import * as fs from "fs";

const image = new ImageRun({
    type: "gif",
    data: fs.readFileSync("./demo/assets/images/pizza.gif"),
    transformation: { width: 100, height: 100 },
    run: { position: "-2pt" },
});

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new TextRun("Text before "), image, new TextRun(" text after")],
                }),
            ],
        },
    ],
});
```

To place an image at page coordinates or control text wrapping, use [`floating`](#floating) instead.

## Alternative Text

Specifies common non-visual DrawingML properties. A name, title and description for a picture can be specified.

```ts live
import { Document, ImageRun, Paragraph } from "docx";
import * as fs from "fs";

const image = new ImageRun({
    type: "gif",
    data: fs.readFileSync("./demo/assets/images/pizza.gif"),
    transformation: { width: 100, height: 100 },
    altText: {
        title: "This is an ultimate title",
        description: "This is an ultimate image",
        name: "My Ultimate Image",
    },
});

const doc = new Document({
    sections: [
        {
            children: [new Paragraph({ children: [image] })],
        },
    ],
});
```

### Options

| Property    | Type     | Notes    | Possible Values                      |
| ----------- | -------- | -------- | ------------------------------------ |
| name        | `string` | Required | `Specimen A`                         |
| title       | `string` | Required | `My awesome title of my image`       |
| description | `string` | Required | `My awesome description of my image` |

## Links and Decorative Images

Give an image a `link` to open a web page when it is clicked (with Ctrl in Word), the same as Word's **Insert > Link** on a picture:

```ts live
import { Document, ImageRun, Paragraph } from "docx";
import * as fs from "fs";

const image = new ImageRun({
    type: "png",
    data: fs.readFileSync("./demo/assets/images/linux-png.png"),
    transformation: { width: 100, height: 120 },
    altText: { name: "Logo", description: "Company logo", title: "Logo" },
    link: "https://example.com",
});

const doc = new Document({
    sections: [
        {
            children: [new Paragraph({ children: [image] })],
        },
    ],
});
```

An image inside an `ExternalHyperlink` links to the hyperlink's address already. If it has a `link` of its own, its own link is used.

Mark an image as `decorative` when it carries no information, such as a border or a flourish, so screen readers skip it. It is the same as Word's **Mark as decorative**, and is used instead of alternative text:

```ts live
import { Document, ImageRun, Paragraph } from "docx";
import * as fs from "fs";

const flourish = new ImageRun({
    type: "jpg",
    data: fs.readFileSync("./demo/assets/images/cat.jpg"),
    transformation: { width: 300, height: 200 },
    decorative: true,
});

const doc = new Document({
    sections: [
        {
            children: [new Paragraph({ children: [flourish] })],
        },
    ],
});
```

Both work for inline and floating images.

### Options

| Property   | Type      | Notes    | Possible Values         |
| ---------- | --------- | -------- | ----------------------- |
| link       | `string`  | Optional | `"https://example.com"` |
| decorative | `boolean` | Optional | `true`                  |

## Cropping

Crop an image by trimming a percentage off each edge before it's stretched to fill its frame. Pass a `crop` property to `ImageRun` with `left`, `top`, `right` and/or `bottom` percentages (`0` to `100`):

```ts live
import { Document, ImageRun, Paragraph } from "docx";
import * as fs from "fs";

const image = new ImageRun({
    type: "gif",
    data: fs.readFileSync("./demo/assets/images/pizza.gif"),
    transformation: {
        width: 200,
        height: 200,
    },
    crop: {
        left: 10,
        top: 5,
        right: 10,
        bottom: 5,
    },
});

const doc = new Document({
    sections: [
        {
            children: [new Paragraph({ children: [image] })],
        },
    ],
});
```

### Options

| Property | Type     | Notes    | Possible Values |
| -------- | -------- | -------- | --------------- |
| left     | `number` | Optional | `0` to `100`    |
| top      | `number` | Optional | `0` to `100`    |
| right    | `number` | Optional | `0` to `100`    |
| bottom   | `number` | Optional | `0` to `100`    |

## Track Changes

Images can be marked as inserted or deleted revisions for change tracking. Pass an `insertion` or `deletion` property to `ImageRun`, or both for an image that was inserted and then deleted, such as by another author:

```ts live
import { Document, ImageRun, Paragraph } from "docx";
import * as fs from "fs";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "png",
                            data: fs.readFileSync("./demo/assets/images/dog.png"),
                            transformation: { width: 120, height: 120 },
                            insertion: {
                                id: 30,
                                author: "Firstname Lastname",
                                date: "2020-10-06T09:00:00Z",
                            },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

See [Change Tracking – Image Revisions](usage/change-tracking.md#image-revisions) for full details and examples.

## Examples

### Add image to the document

Importing Images from file system path

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/images/images.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/images/images.ts_

### Add images to header and footer

Example showing how to add image to headers and footers

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/images/images-in-header-and-footer.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/images/images-in-header-and-footer.ts_

### Floating images

Example showing how to float images on top of text and optimally give a `margin`

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/images/text-wrapping.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/images/text-wrapping.ts_

### Links and decorative images

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/images/image-links.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/images/image-links.ts_
