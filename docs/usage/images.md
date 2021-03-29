# Images

!> Images requires an understanding of [Sections](usage/sections.md) and [Paragraphs](usage/paragraph.md).

To create a `floating` image on top of text:

```ts
const image = new ImageRun({
    data: fs.readFileSync("./demo/images/pizza.gif"),
    transformation: {
        width: 200,
        height: 200,
    }
    floating: {
        horizontalPosition: {
            offset: 1014400,
        },
        verticalPosition: {
            offset: 1014400,
        },
    },
});
```

By default with no arguments, its an `inline` image:

```ts
const image = new ImageRun({
    data: fs.readFileSync("./demo/images/pizza.gif"),
    transformation: {
        width: 100,
        height: 100,
    },
});
```

Add it into the document by adding the image into a paragraph:

```ts
const doc = new Document({
    sections: [{
        children: [
            new Paragraph({
                children: [image],
            }),
        ],
    }];
});
```

## Intro

Adding images can be easily done by creating an instance of `ImageRun`. This can be added in a `Paragraph` or `Hyperlink`:

```ts
const doc = new Document({
    sections: [{
        children: [
            new Paragraph({
                children: [
                    new ImageRun({
                        data: [IMAGE_BUFFER],
                        transformation: {
                            width: [IMAGE_SIZE],
                            height: [IMAGE_SIZE],
                        },
                    }),
                ],
            }),
        ],
    }];
});
```

`docx` supports `jpeg`, `jpg`, `bmp`, `gif` and `png`

## Positioning

> Positioning is the method on how to place the image on the document

![Word Image Positioning](https://user-images.githubusercontent.com/34742290/41765548-b0946302-7604-11e8-96f9-166a9f0b8f39.png)

Three types of image positioning is supported:

-   Floating
-   Inline

By default, images are exported as `Inline` elements.

### Usage

Pass `options` into the `[POSITION_OPTIONS]` mentioned in the [Intro above](#Intro).

## Floating

To change the position the image to be on top of the text, simply add the `floating` property to the last argument. By default, the offsets are relative to the top left corner of the `page`. Offset units are in [emus](https://startbigthinksmall.wordpress.com/2010/01/04/points-inches-and-emus-measuring-units-in-office-open-xml/):

```ts
const image = new ImageRun({
    data: buffer,
    transformation: {
        width: 903,
        height: 1149,
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
```

```ts
const image = new ImageRun({
    data: buffer,
    transformation: {
        width: 903,
        height: 1149,
    },
    floating: {
        horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.RIGHT_MARGIN,
            offset: 1014400,
        },
        verticalPosition: {
            relative: VerticalPositionRelativeFrom.BOTTOM_MARGIN,
            offset: 1014400,
        },
    },
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

```ts
const image = new ImageRun({
    data: fs.readFileSync("./demo/images/pizza.gif"),
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
```

Wrap options have the following properties are:

| Property | Type               | Notes    | Possible Values                             |
| -------- | ------------------ | -------- | ------------------------------------------- |
| type     | `TextWrappingType` | Optional | `NONE`, `SQUARE`, `TIGHT`, `TOP_AND_BOTTOM` |
| side     | `TextWrappingSide` | Optional | `BOTH_SIDES`, `LEFT`, `RIGHT`, `LARGEST`    |

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

```ts
const image = new ImageRun({
    data: fs.readFileSync("./demo/images/pizza.gif"),
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
```

## Examples

### Add image to the document

Importing Images from file system path

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/5-images.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/5-images.ts_

### Add images to header and footer

Example showing how to add image to headers and footers

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/9-images-in-header-and-footer.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/9-images-in-header-and-footer.ts_

### Floating images

Example showing how to float images on top of text and optimally give a `margin`

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/38-text-wrapping.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/38-text-wrapping.ts_
