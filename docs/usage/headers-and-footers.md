# Headers and Footers

!> Headers and Footers require an understanding of [Sections](usage/sections.md).

Every section has headers and footers that appear on each page within that section.

## Basic Headers and Footers

```ts live
import { Document, Footer, Header, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            headers: {
                default: new Header({
                    children: [new Paragraph("Header text")],
                }),
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph("Footer text")],
                }),
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

## Header/Footer Types

| Type      | Description                                         | Requires                           |
| --------- | --------------------------------------------------- | ---------------------------------- |
| `default` | Standard header/footer on every page (or odd pages) | -                                  |
| `first`   | Header/footer on the first page only                | `titlePage: true`                  |
| `even`    | Header/footer on even pages                         | `evenAndOddHeaderAndFooters: true` |

## Different First Page

To have a different header/footer on the first page:

```ts live
import { Document, Footer, Header, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                titlePage: true, // Enable different first page
            },
            headers: {
                default: new Header({
                    children: [new Paragraph("Header on all pages except first")],
                }),
                first: new Header({
                    children: [new Paragraph("Special first page header")],
                }),
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph("Footer on all pages except first")],
                }),
                first: new Footer({
                    children: [], // No footer on first page
                }),
            },
            children: [
                new Paragraph("First page"),
                new Paragraph({
                    text: "Second page",
                    pageBreakBefore: true,
                }),
            ],
        },
    ],
});
```

## Different Odd and Even Pages

For documents like books with different left/right pages:

```ts live
import { AlignmentType, Document, Header, Paragraph } from "docx";

const doc = new Document({
    evenAndOddHeaderAndFooters: true, // Enable at document level
    sections: [
        {
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            text: "Chapter Title",
                            alignment: AlignmentType.RIGHT, // Right on odd pages
                        }),
                    ],
                }),
                even: new Header({
                    children: [
                        new Paragraph({
                            text: "Book Title",
                            alignment: AlignmentType.LEFT, // Left on even pages
                        }),
                    ],
                }),
            },
            children: [
                new Paragraph("Page 1"),
                new Paragraph({ text: "Page 2", pageBreakBefore: true }),
                new Paragraph({ text: "Page 3", pageBreakBefore: true }),
            ],
        },
    ],
});
```

## Page Numbers in Headers/Footers

Add page numbers using the `PageNumber` class:

```ts live
import { AlignmentType, Document, Footer, PageNumber, Paragraph, TextRun } from "docx";

const footer = new Footer({
    children: [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun("Page "),
                new TextRun({
                    children: [PageNumber.CURRENT],
                }),
                new TextRun(" of "),
                new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                }),
            ],
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            footers: {
                default: footer,
            },
            children: [new Paragraph("First page"), new Paragraph({ text: "Second page", pageBreakBefore: true })],
        },
    ],
});
```

### Common Page Number Patterns

**Centered page number:**

```ts live
import { AlignmentType, Document, Footer, PageNumber, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ children: [PageNumber.CURRENT] })],
                        }),
                    ],
                }),
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

**Right-aligned page number:**

```ts live
import { AlignmentType, Document, Footer, PageNumber, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [new TextRun("Page "), new TextRun({ children: [PageNumber.CURRENT] })],
                        }),
                    ],
                }),
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

## Numbered Lists in Headers/Footers

Headers and footers can contain numbered or bulleted lists:

```ts live
import { AlignmentType, convertInchesToTwip, Document, Footer, LevelFormat, Paragraph } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "footer-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
                            },
                        },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            text: "First item",
                            numbering: { reference: "footer-numbering", level: 0 },
                        }),
                        new Paragraph({
                            text: "Second item",
                            numbering: { reference: "footer-numbering", level: 0 },
                        }),
                    ],
                }),
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

## Images in Headers/Footers

Add logos or images:

```ts live
import { Document, Header, ImageRun, Paragraph } from "docx";
import * as fs from "fs";

const header = new Header({
    children: [
        new Paragraph({
            children: [
                new ImageRun({
                    type: "png",
                    data: fs.readFileSync("./demo/assets/images/linux-png.png"),
                    transformation: {
                        width: 50,
                        height: 60,
                    },
                }),
            ],
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            headers: {
                default: header,
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

## Watermarks

Watermarks are placed in headers so that they repeat on every page:

```ts live
import { Document, Header, Paragraph } from "docx";
import { TextWatermark } from "docx/watermarks";

const header = new Header({
    children: [
        new Paragraph({
            children: [new TextWatermark({ text: "DRAFT" })],
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            headers: {
                default: header,
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

See [Watermarks](usage/watermarks.md) for text and image watermark options.

## Header/Footer Margins

Control the distance from the edge of the page:

```ts live
import { Document, Footer, Header, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    margin: {
                        header: 720, // Distance from top edge to header (in twips)
                        footer: 720, // Distance from bottom edge to footer
                    },
                },
            },
            headers: {
                default: new Header({
                    children: [new Paragraph("Header text")],
                }),
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph("Footer text")],
                }),
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

## Full-Page Background Images

A picture behind the text of every page, such as letterhead artwork or a background for a flyer, goes in the header as a floating image behind the text, placed at the page's top left corner and as large as the page. The header repeats it on every page of the section.

The paragraph that holds the picture still has the height of a line. When the header reaches below the top margin, Word and LibreOffice start the text below the header, so small margins leave a gap at the top of each page. A negative top margin is exact: the text starts that far from the top of the page, whatever the header holds. Keep the header's distance from the top of the page (`header`) no larger than that, as LibreOffice doesn't let a header overlap the text. A negative `bottom` margin does the same for the footer, with `footer` no larger.

```ts live
import * as fs from "fs";
import {
    Document,
    Header,
    HorizontalPositionRelativeFrom,
    ImageRun,
    PageOrientation,
    Paragraph,
    TextRun,
    VerticalPositionRelativeFrom,
} from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    size: { orientation: PageOrientation.LANDSCAPE },
                    margin: {
                        // Negative, so the header's paragraph doesn't push the text down: it starts exactly half an inch from the top
                        top: -720,
                        // No more than the top margin, as LibreOffice doesn't let the header overlap the text
                        header: 0,
                    },
                },
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    type: "jpg",
                                    data: fs.readFileSync("./demo/assets/images/image1.jpeg"),
                                    // The size of an A4 page across, in pixels
                                    transformation: { width: 1123, height: 794 },
                                    floating: {
                                        horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
                                        verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
                                        behindDocument: true,
                                    },
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [new Paragraph({ children: [new TextRun({ text: "Penguins", bold: true, size: 72 })] })],
        },
    ],
});
```

To start the text at the very top of the page, give `top` a margin of `-1`, a twentieth of a point, with `header: 0`: `-0` is the same as `0`.

The preview on this page draws the picture where the header is, above the text, so download the document to see it behind the text in Word.

## Multiple Elements in Headers/Footers

Headers and footers can contain multiple paragraphs, tables, and images:

```ts live
import { AlignmentType, Document, Header, ImageRun, Paragraph } from "docx";
import * as fs from "fs";

const header = new Header({
    children: [
        new Paragraph({
            children: [
                new ImageRun({
                    type: "png",
                    data: fs.readFileSync("./demo/assets/images/linux-png.png"),
                    transformation: { width: 40, height: 48 },
                }),
            ],
        }),
        new Paragraph({
            text: "Company Name",
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            text: "Confidential Document",
            alignment: AlignmentType.RIGHT,
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            headers: {
                default: header,
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

## Using Tables for Layout

Create complex header layouts with tables:

```ts live
import { AlignmentType, BorderStyle, Document, Header, Paragraph, Table, TableCell, TableRow, WidthType } from "docx";

// Helper to create invisible borders for layout tables
const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const header = new Header({
    children: [
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph("Left content")],
                            borders: noBorders,
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    text: "Center content",
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                            borders: noBorders,
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    text: "Right content",
                                    alignment: AlignmentType.RIGHT,
                                }),
                            ],
                            borders: noBorders,
                        }),
                    ],
                }),
            ],
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            headers: {
                default: header,
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

## Multiple Sections with Different Headers

Each section can have its own headers and footers:

```ts live
import { Document, Header, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            headers: {
                default: new Header({
                    children: [new Paragraph("Chapter 1")],
                }),
            },
            children: [new Paragraph("Chapter 1 content...")],
        },
        {
            headers: {
                default: new Header({
                    children: [new Paragraph("Chapter 2")],
                }),
            },
            children: [new Paragraph("Chapter 2 content...")],
        },
    ],
});
```

## Complete Example

Professional document with company header:

```ts live
import { AlignmentType, Document, Footer, Header, ImageRun, PageNumber, Packer, Paragraph, TextRun } from "docx";
import * as fs from "fs";

const doc = new Document({
    sections: [
        {
            properties: {
                titlePage: true,
            },
            headers: {
                first: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new ImageRun({
                                    type: "png",
                                    data: fs.readFileSync("./demo/assets/images/linux-png.png"),
                                    transformation: { width: 75, height: 90 },
                                }),
                            ],
                        }),
                    ],
                }),
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Company Name", bold: true }), new TextRun(" | Confidential")],
                        }),
                    ],
                }),
            },
            footers: {
                first: new Footer({
                    children: [], // No footer on cover page
                }),
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun("Page "),
                                new TextRun({ children: [PageNumber.CURRENT] }),
                                new TextRun(" of "),
                                new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
                            ],
                        }),
                    ],
                }),
            },
            children: [new Paragraph("Cover page"), new Paragraph({ text: "Document content...", pageBreakBefore: true })],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("document.docx", buffer);
});
```

## Demos

### Basic Header and Footer

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/headers-and-footers/header-and-footer.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/headers-and-footers/header-and-footer.ts_

### Odd/Even Headers and Footers

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/headers-and-footers/odd-and-even-headers-and-footers.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/headers-and-footers/odd-and-even-headers-and-footers.ts_

### Header and Footer Margins

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/headers-and-footers/header-and-footer-margins.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/headers-and-footers/header-and-footer-margins.ts_

### Full-Page Background Image

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/headers-and-footers/full-page-background-image.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/headers-and-footers/full-page-background-image.ts_

### Images in Header and Footer

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/images/images-in-header-and-footer.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/images/images-in-header-and-footer.ts_
