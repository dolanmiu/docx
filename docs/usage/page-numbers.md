# Page Numbers

> This feature allows you to set page numbers on each page

?> **Note:** This feature only works on Headers and Footers

```ts
new Paragraph({
    children: [
        new TextRun({
            children: ["Page #: ", PageNumber.CURRENT],
        }),
    ],
});
```

## Current page number

```ts
PageNumber.CURRENT;
```

For example:

```ts
new Paragraph({
    children: [
        new TextRun({
            children: ["Page Number ", PageNumber.CURRENT],
        }),
    ],
});
```

## Total number of pages

```ts
PageNumber.TOTAL_PAGES;
```

For example:

```ts
new Paragraph({
    children: [
        new TextRun({
            children: ["Total Pages Number: ", PageNumber.TOTAL_PAGES],
        }),
    ],
});
```

## Both

You can combine the two to get "Page 2 of 10" effect:

```ts
new Paragraph({
    children: [
        new TextRun("My awesome text here for my university dissertation. "),
        new TextRun({
            children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
        }),
    ],
});
```

## Restart Page Numbering

When a document has multiple sections, you can restart page numbering for each section using `pageNumbers.start` in the section properties:

```ts
const doc = new Document({
    sections: [
        {
            children: [new Paragraph("Section 1 content")],
        },
        {
            properties: {
                page: {
                    pageNumbers: {
                        start: 1, // Restart from page 1
                    },
                },
            },
            children: [new Paragraph("Section 2 — page numbering restarts here")],
        },
    ],
});
```

### Page Number Separator

You can also set the chapter number separator style using the `separator` property:

```ts
import { PageNumberSeparator } from "docx";

pageNumbers: {
    start: 1,
    separator: PageNumberSeparator.EM_DASH, // e.g. "1—1"
}
```

Available separators: `COLON`, `EM_DASH`, `EN_DASH`, `HYPHEN`, `PERIOD`.

## Examples

### Simple Example

Adding page numbers to Header and Footer

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/39-page-numbers.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/39-page-numbers.ts_

### Restart Page Numbers

Restarting page numbering in a new section

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/42-restart-page-numbers.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/42-restart-page-numbers.ts_
