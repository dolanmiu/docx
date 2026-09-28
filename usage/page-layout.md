# Page Layout

!> Page Layout requires an understanding of [Sections](usage/sections.md).

Page layout options control the physical appearance of your document pages, including size, margins, orientation, and borders.

## Page Size

Set custom page dimensions:

```ts live
import { Document, Paragraph, convertMillimetersToTwip } from "docx";

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

```ts live
import { Document, PageOrientation, Paragraph, convertMillimetersToTwip } from "docx";

// Landscape A4
// Note: For landscape, give the portrait width and height; docx swaps them so the larger dimension becomes the width
const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.LANDSCAPE,
                        width: convertMillimetersToTwip(210), // A4 width becomes landscape height
                        height: convertMillimetersToTwip(297), // A4 height becomes landscape width
                    },
                },
            },
            children: [new Paragraph("Landscape page")],
        },
    ],
});
```

?> When switching to landscape, give the page's portrait width and height: with `orientation: PageOrientation.LANDSCAPE`, docx swaps them for you, so don't swap them yourself. Without a `width` and `height`, the page is A4 turned on its side.

## Printer Paper Code

Use the `code` property to specify a printer-specific paper code. This tells the printer which paper tray or paper type to use when the specified dimensions could match multiple paper types. Common codes include `1` (Letter), `5` (Legal), `8` (A3), and `9` (A4).

```ts live
import { Document, Paragraph, convertMillimetersToTwip } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    size: {
                        width: convertMillimetersToTwip(210),
                        height: convertMillimetersToTwip(297),
                        code: 9, // A4 paper code
                    },
                },
            },
            children: [new Paragraph("Page with A4 printer paper code")],
        },
    ],
});
```

### Common Printer Paper Codes

| Code | Paper Size          |
| ---- | ------------------- |
| 1    | Letter (8.5" x 11") |
| 5    | Legal (8.5" x 14")  |
| 8    | A3 (297 x 420mm)    |
| 9    | A4 (210 x 297mm)    |
| 11   | A5 (148 x 210mm)    |

?> The `code` value is passed directly to the printer and is not interpreted by the library. Refer to your printer's documentation for supported codes.

## Page Margins

Set margins for the page:

```ts live
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

```ts live
import { BorderStyle, Document, Paragraph } from "docx";

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

| Property | Type                   | Description                                          |
| -------- | ---------------------- | ---------------------------------------------------- |
| style    | `BorderStyle`          | Border style                                         |
| size     | `number`               | Border width in 1/8 points (e.g., 8 = 1pt, 16 = 2pt) |
| color    | `string \| ThemeColor` | Hex color code, or a color of the document's theme   |
| space    | `number`               | Space from text (points)                             |

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

```ts live
import { BorderStyle, Document, PageBorderDisplay, PageBorderOffsetFrom, PageBorderZOrder, Paragraph } from "docx";

const border = { style: BorderStyle.SINGLE, size: 8, color: "000000" };

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    borders: {
                        pageBorders: {
                            display: PageBorderDisplay.ALL_PAGES, // or FIRST_PAGE, NOT_FIRST_PAGE
                            offsetFrom: PageBorderOffsetFrom.TEXT, // or PAGE
                            zOrder: PageBorderZOrder.FRONT, // or BACK
                        },
                        // individual border definitions
                        pageBorderTop: border,
                        pageBorderRight: border,
                        pageBorderBottom: border,
                        pageBorderLeft: border,
                    },
                },
            },
            children: [new Paragraph("Page with borders measured from the text")],
        },
    ],
});
```

## Complete Example

Combining multiple layout options:

```ts live
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

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/page-layout/page-border-styles.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/page-layout/page-border-styles.ts_

### Page Sizes

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/page-layout/page-sizes.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/page-layout/page-sizes.ts_

### Landscape Orientation

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/page-layout/landscape.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/page-layout/landscape.ts_
