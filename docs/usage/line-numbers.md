# Line Numbers

!> Line Numbers require an understanding of [Sections](usage/sections.md).

Line numbers are useful for legal documents, code listings, scripts, and any document where referencing specific lines is important.

## Basic Line Numbers

Add line numbers to a section:

```ts
import { Document, LineNumberRestartFormat, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                lineNumbers: {
                    countBy: 1,
                    restart: LineNumberRestartFormat.CONTINUOUS,
                },
            },
            children: [new Paragraph("Line 1"), new Paragraph("Line 2"), new Paragraph("Line 3")],
        },
    ],
});
```

## Line Number Options

| Property | Type                      | Notes    | Description                |
| -------- | ------------------------- | -------- | -------------------------- |
| countBy  | `number`                  | Optional | Show number every N lines  |
| start    | `number`                  | Optional | Starting line number       |
| restart  | `LineNumberRestartFormat` | Optional | When to restart numbering  |
| distance | `number`                  | Optional | Distance from text (twips) |

## Restart Options

Control when line numbers restart:

```ts
import { LineNumberRestartFormat } from "docx";

// Continuous - numbers continue throughout document
lineNumbers: {
    countBy: 1,
    restart: LineNumberRestartFormat.CONTINUOUS,
}

// Restart each page
lineNumbers: {
    countBy: 1,
    restart: LineNumberRestartFormat.NEW_PAGE,
}

// Restart each section
lineNumbers: {
    countBy: 1,
    restart: LineNumberRestartFormat.NEW_SECTION,
}
```

## Count Interval

Show line numbers at specific intervals:

```ts
// Show every 5th line number (5, 10, 15...)
lineNumbers: {
    countBy: 5,
    restart: LineNumberRestartFormat.CONTINUOUS,
}
```

## Starting Number

Start from a specific line number:

```ts
lineNumbers: {
    countBy: 1,
    start: 100,  // First line is 100
    restart: LineNumberRestartFormat.CONTINUOUS,
}
```

## Suppressing Line Numbers

Suppress line numbers for specific paragraphs:

```ts
new Paragraph({
    text: "This paragraph will not have a line number",
    suppressLineNumbers: true,
});
```

This is useful for headings, titles, or any content that shouldn't be numbered.

## Complete Example

Legal document with line numbers:

```ts
import { Document, HeadingLevel, LineNumberRestartFormat, Packer, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                lineNumbers: {
                    countBy: 1,
                    restart: LineNumberRestartFormat.NEW_PAGE,
                },
            },
            children: [
                new Paragraph({
                    text: "AGREEMENT",
                    heading: HeadingLevel.HEADING_1,
                    suppressLineNumbers: true, // Don't number the title
                }),
                new Paragraph("This Agreement is entered into as of the date last signed below."),
                new Paragraph("WHEREAS, Party A desires to engage Party B for services;"),
                new Paragraph("WHEREAS, Party B has the expertise to provide such services;"),
                new Paragraph({
                    text: "TERMS AND CONDITIONS",
                    heading: HeadingLevel.HEADING_2,
                    suppressLineNumbers: true, // Don't number section headers
                }),
                new Paragraph("1. Party B shall provide consulting services as requested by Party A."),
                new Paragraph("2. Payment shall be made within 30 days of invoice receipt."),
                new Paragraph("3. This agreement may be terminated by either party with 30 days notice."),
            ],
        },
    ],
});
```

## Multiple Sections with Different Settings

```ts
import { Document, LineNumberRestartFormat, Paragraph, SectionType } from "docx";

const doc = new Document({
    sections: [
        // First section - no line numbers
        {
            children: [new Paragraph("Introduction without line numbers...")],
        },
        // Second section - numbered lines
        {
            properties: {
                type: SectionType.NEXT_PAGE,
                lineNumbers: {
                    countBy: 1,
                    restart: LineNumberRestartFormat.CONTINUOUS,
                },
            },
            children: [new Paragraph("This section has line numbers...")],
        },
    ],
});
```

## Demos

### Basic Line Numbers

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/40-line-numbers.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/40-line-numbers.ts_

### Line Number Suppression

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/70-line-numbers-suppression.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/70-line-numbers-suppression.ts_
