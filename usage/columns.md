# Columns

!> Columns require an understanding of [Sections](usage/sections.md).

Create multi-column layouts like newspapers or newsletters by configuring columns in your section properties.

## Basic Columns

Create equal-width columns:

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                column: {
                    count: 2,
                    space: 708, // Space between columns (~0.5 inches in twips; 1440 twips = 1 inch)
                },
            },
            children: [
                new Paragraph(
                    "This text will flow across two columns. When it reaches the bottom of the first column, it carries on at the top of the second, the way the text of a newspaper or a newsletter does. Add more text to see it flow from one column into the next.",
                ),
            ],
        },
    ],
});
```

## Column Options

| Property   | Type       | Notes    | Description                      |
| ---------- | ---------- | -------- | -------------------------------- |
| count      | `number`   | Required | Number of columns                |
| space      | `number`   | Optional | Space between columns (twips)    |
| separate   | `boolean`  | Optional | Draw a line between columns      |
| equalWidth | `boolean`  | Optional | Whether columns have equal width |
| children   | `Column[]` | Optional | Individual column definitions    |

## Column Separator

Add a vertical line between columns:

```ts live
import { ColumnBreak, Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                column: {
                    count: 2,
                    space: 708,
                    separate: true, // Adds a line between columns
                },
            },
            children: [
                new Paragraph({
                    children: [new TextRun("This text is in column 1."), new ColumnBreak(), new TextRun("This text is in column 2.")],
                }),
            ],
        },
    ],
});
```

## Different Width Columns

Create columns with custom widths:

```ts live
import { Column, Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                column: {
                    count: 2,
                    space: 720,
                    equalWidth: false,
                    children: [
                        new Column({ width: 2880, space: 720 }), // Narrow column
                        new Column({ width: 5760 }), // Wide column
                    ],
                },
            },
            children: [
                new Paragraph(
                    "Content flows through unequal columns. The first column is two inches wide, with half an inch of space after it, and the second column is four inches wide, so the text fills a narrow column and then a wide one.",
                ),
            ],
        },
    ],
});
```

### Column Class Options

| Property | Type     | Notes    | Description             |
| -------- | -------- | -------- | ----------------------- |
| width    | `number` | Required | Column width (twips)    |
| space    | `number` | Optional | Space after this column |

## Column Breaks

Force content to the next column using `ColumnBreak`:

```ts live
import { ColumnBreak, Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                column: {
                    count: 2,
                    space: 708,
                },
            },
            children: [
                new Paragraph({
                    children: [new TextRun("This text is in column 1."), new ColumnBreak(), new TextRun("This text is in column 2.")],
                }),
            ],
        },
    ],
});
```

## Three Columns

```ts live
import { Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                column: {
                    count: 3,
                    space: 708,
                },
            },
            children: [
                new Paragraph(
                    "This text flows across three columns. Three narrow columns suit lists, glossaries and short news items, where each line holds only a few words. The text fills the first column, then the second, and then the third.",
                ),
            ],
        },
    ],
});
```

## Mixing Column Layouts

Use multiple sections to mix column layouts:

```ts live
import { Document, Paragraph, SectionType } from "docx";

const doc = new Document({
    sections: [
        // Single column section
        {
            children: [new Paragraph("This is a full-width introduction paragraph.")],
        },
        // Two column section
        {
            properties: {
                type: SectionType.CONTINUOUS, // Don't start new page
                column: {
                    count: 2,
                    space: 708,
                },
            },
            children: [
                new Paragraph(
                    "This content flows in two columns. The continuous section breaks before and after it keep the columns on the same page as the full-width paragraphs above and below them.",
                ),
            ],
        },
        // Back to single column
        {
            properties: {
                type: SectionType.CONTINUOUS,
            },
            children: [new Paragraph("This is a full-width conclusion.")],
        },
    ],
});
```

## Complete Example

Newsletter-style layout with unequal columns:

```ts live
import { Column, ColumnBreak, Document, HeadingLevel, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                column: {
                    count: 2,
                    space: 720, // 0.5 inches between columns (1440 twips = 1 inch)
                    separate: true,
                    equalWidth: false,
                    children: [
                        new Column({ width: 3600, space: 720 }), // Narrow column (~2.5 inches)
                        new Column({ width: 5040 }), // Wide column (~3.5 inches)
                    ],
                },
            },
            children: [
                new Paragraph({
                    text: "Newsletter Title",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    children: [
                        new TextRun("First column content goes here. "),
                        new TextRun("It will flow naturally within the column width. "),
                        new TextRun("Add more content as needed."),
                    ],
                }),
                new Paragraph({
                    children: [new ColumnBreak()],
                }),
                new Paragraph({
                    children: [new TextRun("Second column content starts here. "), new TextRun("This appears in the right column.")],
                }),
            ],
        },
    ],
});
```

## Demos

### Multiple Columns

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/page-layout/multiple-columns.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/page-layout/multiple-columns.ts_

### Column Break

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/page-layout/column-break.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/page-layout/column-break.ts_

### Different Width Columns

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/page-layout/different-width-columns.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/page-layout/different-width-columns.ts_
