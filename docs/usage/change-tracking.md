# Change Tracking

> Instead of adding a `TextRun` into a `Paragraph`, you can also add an `InsertedTextRun` or `DeletedTextRun` where you need to supply an `id`, `author` and `date` for the change.

```ts
import { Paragraph, TextRun, InsertedTextRun, DeletedTextRun } from "docx";

const paragraph = new Paragraph({
    children: [
        new TextRun("This is a simple demo "),
        new TextRun({
            text: "on how to "
        }),
        new InsertedTextRun({
            text: "mark a text as an insertion ",
            id: 0,
            author: "Firstname Lastname",
            date: "2020-10-06T09:00:00Z",
        }),
        new DeletedTextRun({
            text: "or a deletion.",
            id: 1,
            author: "Firstname Lastname",
            date: "2020-10-06T09:00:00Z",
        })
    ],
});
```

Note that for a `InsertedTextRun` and `DeletedTextRun`, it is not possible to simply call it with only a text as in `new TextRun("some text")`, since the additional fields for change tracking need to be provided. Similar to a normal `TextRun` you can add additional text properties.

```ts
import { Paragraph, TextRun, InsertedTextRun, DeletedTextRun } from "docx";

const paragraph = new Paragraph({
    children: [
        new TextRun("This is a simple demo"),
        new DeletedTextRun({
            text: "with a deletion.",
            color: "ff0000",
            bold: true,
            size: 24,
            id: 0,
            author: "Firstname Lastname",
            date: "2020-10-06T09:00:00Z",
        })
    ],
});
```

In addition to marking text as inserted or deleted, change tracking can also be added via the document settings. This will enable new changes to be tracked as well.

```ts
import { Document } from "docx";

const doc = new Document({
    features: {
        trackRevisions: true,
    },
});
```

If you want to express a style changes, you can add a `revision` to a `TextRun` which need to include all previous style attributes.

```ts
new TextRun({
    bold: true,
    text: "This text is now bold and was previously not",
    revision: {
        id: 1,
        author: "Firstname Lastname",
        date: "2020-10-06T09:05:00Z",
        bold: false,
    }
}).break()
```

## Paragraph Properties Revisions

You can track changes to paragraph properties (such as alignment, spacing, indentation, borders, heading level, etc.) by adding a `revision` property directly to the `Paragraph` options. The revision must include all previous property values.

```ts
import { Paragraph, AlignmentType, HeadingLevel } from "docx";

const paragraph = new Paragraph({
    text: "This paragraph has changed alignment and heading",
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.RIGHT,
    spacing: {
        before: 400,
    },
    revision: {
        id: 8,
        author: "Firstname Lastname",
        date: "2020-10-06T09:00:00Z",
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.LEFT,
        spacing: {
            before: 200,
        },
    },
});
```

## Section Properties Revisions

You can track changes to section properties (such as page size, margins, text direction, columns, vertical alignment, title page, etc.) by adding a `revision` property to the section `properties` object. The revision must include all previous property values.

```ts
import { Document, Paragraph, TextRun, PageTextDirectionType } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    textDirection: PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT,
                    margin: {
                        top: 2000,
                        right: 1440,
                        bottom: 1440,
                        left: 1440,
                    },
                },
                revision: {
                    id: 11,
                    author: "Firstname Lastname",
                    date: "2020-10-06T09:00:00Z",
                    page: {
                        textDirection: PageTextDirectionType.LEFT_TO_RIGHT_TOP_TO_BOTTOM,
                        margin: {
                            top: 1440,
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                        },
                    },
                },
            },
            children: [
                new Paragraph({
                    children: [new TextRun("Section with changed text direction")],
                }),
            ],
        },
    ],
});
```

## Table Revisions

### Table Properties Revisions

You can track changes to table properties (such as alignment, borders, width, etc.) by adding a `revision` property to the `Table` options. The revision must include all previous property values.

```ts
import { Table, TableRow, TableCell, Paragraph, AlignmentType } from "docx";

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Cell 1")],
                }),
            ],
        }),
    ],
    alignment: AlignmentType.CENTER,
    revision: {
        id: 1,
        author: "Firstname Lastname",
        date: "2020-10-06T09:00:00Z",
        alignment: AlignmentType.RIGHT,
    },
});
```

### Table Column Widths Revisions

You can track changes to table column widths by providing a `columnWidthsRevision` property. This tracks changes to the grid column widths.

```ts
import { Table, TableRow, TableCell, Paragraph } from "docx";

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Cell 1")],
                }),
                new TableCell({
                    children: [new Paragraph("Cell 2")],
                }),
            ],
        }),
    ],
    columnWidths: [1234, 321],
    columnWidthsRevision: {
        id: 1,
        columnWidths: [1000, 555],
    },
});
```

## Table Row Revisions

### Inserted Table Rows

To mark a table row as inserted, use the `insertion` property in the `TableRow` options. In addition, the text content within the row must also be marked as inserted using the paragraph `run.insertion` property (or by using `InsertedTextRun`). Both are required for Microsoft Word to display the insertion correctly.

```ts
import { TableRow, TableCell, Paragraph } from "docx";

const row = new TableRow({
    children: [
        new TableCell({
            children: [
                new Paragraph({
                    children: [new TextRun("Inserted row")],
                    run: {
                        insertion: {
                            id: 1,
                            author: "Firstname Lastname",
                            date: "2020-10-06T09:00:00Z",
                        },
                    },
                })
            ],
        }),
    ],
    insertion: {
        id: 1,
        author: "Firstname Lastname",
        date: "2020-10-06T09:00:00Z",
    },
});
```

### Deleted Table Rows

To mark a table row as deleted, use the `deletion` property in the `TableRow` options. In addition, the text content within the row must also be marked as deleted using the paragraph `run.deletion` property (or by using `DeletedTextRun`). Both are required for Microsoft Word to display the deletion correctly.

```ts
import { TableRow, TableCell, Paragraph } from "docx";

const row = new TableRow({
    children: [
        new TableCell({
            children: [
                new Paragraph({
                    children: [new TextRun("Deleted row")],
                    run: {
                        deletion: {
                            id: 2,
                            author: "Firstname Lastname",
                            date: "2020-10-06T09:00:00Z",
                        },
                    },
                })
            ],
        }),
    ],
    deletion: {
        id: 2,
        author: "Firstname Lastname",
        date: "2020-10-06T09:00:00Z",
    },
});
```

### Table Row Properties Revisions

You can track changes to table row properties (such as height, table header, cant split, etc.) by adding a `revision` property. The revision must include all previous property values.

```ts
import { TableRow, TableCell, Paragraph, HeightRule, CellSpacingType } from "docx";

const row = new TableRow({
    children: [
        new TableCell({
            children: [new Paragraph("Cell content")],
        }),
    ],
    height: {
        value: 200,
        rule: HeightRule.EXACT,
    },
    tableHeader: false,
    revision: {
        id: 3,
        author: "Firstname Lastname",
        date: "2020-10-06T09:00:00Z",
        height: {
            value: 300,
            rule: HeightRule.EXACT,
        },
        tableHeader: true,
    },
});
```

## Table Cell Revisions

### Inserted Table Cells

To mark a table cell as inserted, use the `insertion` property in the `TableCell` options. As with table rows, the text content within the cell must also be marked as inserted using the paragraph `run.insertion` property (or by using `InsertedTextRun`). Both are required for Microsoft Word to display the insertion correctly.

```ts
import { TableCell, Paragraph } from "docx";

const cell = new TableCell({
    children: [new Paragraph({
        children: [new TextRun("Inserted cell")],
        run: {
            insertion: {
                id: 4,
                author: "Firstname Lastname",
                date: "2020-10-06T09:00:00Z",
            },
        },
    })],
    insertion: {
        id: 4,
        author: "Firstname Lastname",
        date: "2020-10-06T09:00:00Z",
    },
});
```

### Deleted Table Cells

To mark a table cell as deleted, use the `deletion` property in the `TableCell` options. As with table rows, the text content within the cell must also be marked as deleted using the paragraph `run.deletion` property (or by using `DeletedTextRun`). Both are required for Microsoft Word to display the deletion correctly.

```ts
import { TableCell, Paragraph } from "docx";

const cell = new TableCell({
    children: [new Paragraph({
        children: [new TextRun("Deleted cell")],
        run: {
            deletion: {
                id: 5,
                author: "Firstname Lastname",
                date: "2020-10-06T09:00:00Z",
            },
        },
    })],
    deletion: {
        id: 5,
        author: "Firstname Lastname",
        date: "2020-10-06T09:00:00Z",
    },
});
```

### Table Cell Properties Revisions

You can track changes to table cell properties (such as vertical alignment, text direction, borders, shading, etc.) by adding a `revision` property. The revision must include all previous property values.

```ts
import { TableCell, Paragraph, VerticalAlignTable, TextDirection } from "docx";

const cell = new TableCell({
    children: [new Paragraph("Cell content")],
    verticalAlign: VerticalAlignTable.CENTER,
    textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
    revision: {
        id: 6,
        author: "Firstname Lastname",
        date: "2020-10-06T09:00:00Z",
        verticalAlign: VerticalAlignTable.TOP,
        textDirection: TextDirection.LEFT_TO_RIGHT_TOP_TO_BOTTOM,
    },
});
```

### Cell Merge Revisions

You can track changes to cell merging (vertical merge) by using the `cellMerge` property.

```ts
import { TableCell, Paragraph } from "docx";

const cell = new TableCell({
    children: [new Paragraph("Merged cell")],
    cellMerge: {
        id: 7,
        author: "Firstname Lastname",
        date: "2020-10-06T09:00:00Z",
        verticalMerge: "cont", // or "restart"
    },
});
```
