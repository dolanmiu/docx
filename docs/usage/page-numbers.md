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
