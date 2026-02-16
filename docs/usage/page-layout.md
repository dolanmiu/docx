# Page Layout

!> Page Layout requires an understanding of [Sections](usage/sections.md).

Page layout options control the physical appearance of your document pages, including size, margins, orientation, and borders.

## Page Size

Set custom page dimensions:

```ts
import { Document, PageOrientation, Paragraph, convertMillimetersToTwip } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    size: {
                        width: convertMillimetersToTwip(210), // A4 width
                        height: convertMillimetersToTwip(297), // A4 height
                    },
                },
            },
            children: [new Paragraph("A4 sized page")],
        },
    ],
});
```

### Common Page Sizes

| Size   | Width (mm) | Height (mm) |
| ------ | ---------- | ----------- |
| Letter | 216        | 279         |
| Legal  | 216        | 356         |
| A4     | 210        | 297         |
| A3     | 297        | 420         |
| A5     | 148        | 210         |

## Page Orientation

Set portrait or landscape orientation:

```ts
import { Document, PageOrientation, Paragraph, convertMillimetersToTwip } from "docx";

// Landscape A4
// Note: For landscape, swap width and height values so the larger dimension becomes the width
const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.LANDSCAPE,
                        width: convertMillimetersToTwip(297), // A4 height becomes landscape width
                        height: convertMillimetersToTwip(210), // A4 width becomes landscape height
                    },
                },
            },
            children: [new Paragraph("Landscape page")],
        },
    ],
});
```

?> When switching to landscape, you must manually swap the width and height values. The `orientation` property alone only tells Word how to display the page - you still need to provide the correct dimensions.

## Page Margins

Set margins for the page:

```ts
import { Document, Paragraph, convertInchesToTwip } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1.5), // Extra for binding
                    },
                },
            },
            children: [new Paragraph("Page with custom margins")],
        },
    ],
});
```

### Margin Options

| Property | Type     | Description                                                      |
| -------- | -------- | ---------------------------------------------------------------- |
| top      | `number` | Top margin (twips)                                               |
| right    | `number` | Right margin                                                     |
| bottom   | `number` | Bottom margin                                                    |
| left     | `number` | Left margin                                                      |
| header   | `number` | Header margin                                                    |
| footer   | `number` | Footer margin                                                    |
| gutter   | `number` | Gutter margin (extra space for binding in double-sided printing) |

## Page Borders

Add borders around pages:

```ts
import { BorderStyle, Document, PageBorderDisplay, PageBorderOffsetFrom, Paragraph } from "docx";

// Note: Border size is measured in 1/8 points (so size: 8 = 1pt, size: 16 = 2pt)
const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    borders: {
                        pageBorderTop: {
                            style: BorderStyle.SINGLE,
                            size: 8, // 1pt (8 eighths of a point)
                            color: "000000",
                        },
                        pageBorderRight: {
                            style: BorderStyle.SINGLE,
                            size: 8,
                            color: "000000",
                        },
                        pageBorderBottom: {
                            style: BorderStyle.DOUBLE,
                            size: 16, // 2pt
                            color: "FF0000",
                        },
                        pageBorderLeft: {
                            style: BorderStyle.SINGLE,
                            size: 8,
                            color: "000000",
                        },
                    },
                },
            },
            children: [new Paragraph("Page with borders")],
        },
    ],
});
```

### Border Options

| Property | Type          | Description                                          |
| -------- | ------------- | ---------------------------------------------------- |
| style    | `BorderStyle` | Border style                                         |
| size     | `number`      | Border width in 1/8 points (e.g., 8 = 1pt, 16 = 2pt) |
| color    | `string`      | Hex color code                                       |
| space    | `number`      | Space from text (points)                             |

### Border Styles

Common border styles include:

- `BorderStyle.SINGLE` - Single line
- `BorderStyle.DOUBLE` - Double line
- `BorderStyle.DASHED` - Dashed line
- `BorderStyle.DOTTED` - Dotted line
- `BorderStyle.THICK` - Thick line
- `BorderStyle.WAVE` - Wavy line

### Page Border Display Options

Control when and how borders appear:

```ts
import { PageBorderDisplay, PageBorderOffsetFrom, PageBorderZOrder } from "docx";

page: {
    borders: {
        pageBorders: {
            display: PageBorderDisplay.ALL_PAGES,      // or FIRST_PAGE, NOT_FIRST_PAGE
            offsetFrom: PageBorderOffsetFrom.TEXT,     // or PAGE
            zOrder: PageBorderZOrder.FRONT,            // or BACK
        },
        // ... individual border definitions
    },
}
```

## Complete Example

Combining multiple layout options:

```ts
import { BorderStyle, Document, PageBorderDisplay, PageOrientation, Paragraph, convertInchesToTwip, convertMillimetersToTwip } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.PORTRAIT,
                        width: convertMillimetersToTwip(210),
                        height: convertMillimetersToTwip(297),
                    },
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1.25),
                    },
                    borders: {
                        pageBorderTop: {
                            style: BorderStyle.SINGLE,
                            size: 8,
                            color: "4472C4",
                        },
                        pageBorderRight: {
                            style: BorderStyle.SINGLE,
                            size: 8,
                            color: "4472C4",
                        },
                        pageBorderBottom: {
                            style: BorderStyle.SINGLE,
                            size: 8,
                            color: "4472C4",
                        },
                        pageBorderLeft: {
                            style: BorderStyle.SINGLE,
                            size: 8,
                            color: "4472C4",
                        },
                        pageBorders: {
                            display: PageBorderDisplay.ALL_PAGES,
                        },
                    },
                },
            },
            children: [new Paragraph("This page has A4 size, 1-inch margins, and blue borders.")],
        },
    ],
});
```

## Demos

### Page Borders

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/71-page-borders-2.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/71-page-borders-2.ts_

### Page Sizes

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/65-page-sizes.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/65-page-sizes.ts_

### Landscape Orientation

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/7-landscape.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/7-landscape.ts_
