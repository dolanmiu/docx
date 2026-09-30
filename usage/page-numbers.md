# Page Numbers

> This feature allows you to set page numbers on each page

?> **Note:** This feature only works on Headers and Footers

```ts live
import { Document, Footer, PageNumber, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    children: ["Page #: ", PageNumber.CURRENT],
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

## Current page number

```ts
PageNumber.CURRENT;
```

For example:

```ts live
import { Document, Footer, PageNumber, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    children: ["Page Number ", PageNumber.CURRENT],
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

## Total number of pages

```ts
PageNumber.TOTAL_PAGES;
```

For example:

```ts live
import { Document, Footer, PageNumber, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    children: ["Total Pages Number: ", PageNumber.TOTAL_PAGES],
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

Word and LibreOffice work out the number of pages when they lay the document out. It is written blank, for applications that show it as it is written, unless the document is given `pageNumbers: estimatePageNumbers` from `docx/layout`, which works it out when the document is written. See [Layout](usage/layout.md).

## Total number of pages in a section

```ts
PageNumber.TOTAL_PAGES_IN_SECTION;
```

It counts only the pages of the section it is in. To leave pages out of the count, such as a cover page and a table of contents, put them in a section of their own, and start the page numbers of the next section at 1:

```ts live
import { AlignmentType, Document, Footer, PageNumber, Paragraph, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const doc = new Document({
    // Works out the number of pages in each section, which LibreOffice leaves blank
    pageNumbers: estimatePageNumbers,
    sections: [
        {
            // The cover and contents have no footer, and aren't counted
            children: [new Paragraph("Cover page"), new Paragraph({ text: "Contents", pageBreakBefore: true })],
        },
        {
            properties: {
                page: {
                    pageNumbers: {
                        start: 1,
                    },
                },
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    // "1 / 3" on the first page of this section
                                    children: [PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES_IN_SECTION],
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                new Paragraph("Chapter 1"),
                new Paragraph({ text: "Chapter 2", pageBreakBefore: true }),
                new Paragraph({ text: "Chapter 3", pageBreakBefore: true }),
            ],
        },
    ],
});
```

Word works out the number of pages in a section when it lays the document out, but LibreOffice doesn't. It shows the number as it is written, which is blank unless the document is given `pageNumbers: estimatePageNumbers` from `docx/layout`. See [Layout](usage/layout.md).

## Both

You can combine the two to get "Page 2 of 10" effect:

```ts live
import { Document, Footer, PageNumber, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun("My awesome text here for my university dissertation. "),
                                new TextRun({
                                    children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
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

## Restart Page Numbering

When a document has multiple sections, you can restart page numbering for each section using `pageNumbers.start` in the section properties:

```ts live
import { Document, Footer, PageNumber, Paragraph, TextRun } from "docx";

const footer = new Footer({
    children: [new Paragraph({ children: [new TextRun({ children: ["Page ", PageNumber.CURRENT] })] })],
});

const doc = new Document({
    sections: [
        {
            footers: { default: footer },
            children: [new Paragraph("Section 1 content"), new Paragraph({ text: "More of section 1", pageBreakBefore: true })],
        },
        {
            properties: {
                page: {
                    pageNumbers: {
                        start: 1, // Restart from page 1
                    },
                },
            },
            footers: { default: footer },
            children: [new Paragraph("Section 2 — page numbering restarts here")],
        },
    ],
});
```

### Page Number Separator

You can also set the chapter number separator style using the `separator` property:

```ts live
import { Document, Footer, PageNumber, PageNumberSeparator, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    pageNumbers: {
                        start: 1,
                        separator: PageNumberSeparator.EM_DASH, // e.g. "1—1"
                    },
                },
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({ children: [new TextRun({ children: ["Page ", PageNumber.CURRENT] })] })],
                }),
            },
            children: [new Paragraph("Document content")],
        },
    ],
});
```

Available separators: `COLON`, `EM_DASH`, `EN_DASH`, `HYPHEN`, `PERIOD`.

## Examples

### Simple Example

Adding page numbers to Header and Footer

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/page-numbers/page-number-format.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/page-numbers/page-number-format.ts_

### Restart Page Numbers

Restarting page numbering in a new section

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/page-numbers/restart-page-numbers.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/page-numbers/restart-page-numbers.ts_

### Total Pages in Each Section

Showing the number of pages in each section in its header

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/page-numbers/total-pages-in-section.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/page-numbers/total-pages-in-section.ts_
