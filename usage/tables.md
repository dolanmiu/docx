# Tables

!> Paragraphs requires an understanding of [Sections](usage/sections.md).

## Intro

- `Tables` contain a list of `Rows`
- `Rows` contain a list of `TableCells`
- `TableCells` contain a list of `Paragraphs` and/or `Tables`. You can add `Tables` as tables can be nested inside each other

Create a simple table, then add the table in the `section`:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const table = new Table({
    rows: [
        new TableRow({
            children: [new TableCell({ children: [new Paragraph("Name")] }), new TableCell({ children: [new Paragraph("Age")] })],
        }),
        new TableRow({
            children: [new TableCell({ children: [new Paragraph("Alice")] }), new TableCell({ children: [new Paragraph("32")] })],
        }),
        new TableRow({
            children: [new TableCell({ children: [new Paragraph("Bob")] }), new TableCell({ children: [new Paragraph("27")] })],
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            children: [table],
        },
    ],
});
```

## Table

### Set Width

```ts
const table = new Table({
    ...,
    width: {
        size: [TABLE_WIDTH],
        type: WidthType,
    }
});
```

For example:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow, WidthType } from "docx";

const table = new Table({
    rows: [
        new TableRow({
            children: [new TableCell({ children: [new Paragraph("Hello")] }), new TableCell({ children: [new Paragraph("World")] })],
        }),
    ],
    width: {
        size: 4535,
        type: WidthType.DXA,
    },
});

const doc = new Document({
    sections: [
        {
            children: [table],
        },
    ],
});
```

### Column Widths

A table's columns are defined by its grid (`w:tblGrid`), whose widths are always in twips (twentieths of a point). You can set them explicitly with `columnWidths`:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph("3505 twips wide")] }),
                new TableCell({ children: [new Paragraph("5505 twips wide")] }),
            ],
        }),
    ],
    columnWidths: [3505, 5505],
});

const doc = new Document({
    sections: [
        {
            children: [table],
        },
    ],
});
```

Word lays a table out from its cells' widths, and sizes the columns of cells without one to their text, whatever the grid says. So `docx` gives each cell without a `width` of its own the width of the columns it spans, and Word keeps the widths you asked for. When the table's `width` is wider than its columns add up to, the cells' widths are scaled up to fill it, as Word and LibreOffice lay the columns out, so `columnWidths: [20, 80]` in a table 100% wide gives columns of 20% and 80% there. The grid is written as given, though, and readers that go by the grid alone take those as 20 and 80 twips. Without a `width`, a table is as wide as its columns.

When `columnWidths` is omitted, `docx` derives the grid for you from the table's `width` and the cells' `width`s. Percentages are resolved against the actual page size and margins of the section the table is in (or the parent cell for nested tables) when the document is packed, and columns without a width share whatever is left equally. So a 100% wide table with 90% / 10% cells on a default A4 page gets a grid of `[8123, 903]`, and a table with no widths at all gets equal, full-width columns.

!> Microsoft Word lays tables out from the `width`s and only treats the grid as a hint, but Google Docs, Apple Pages, QuickLook and many other readers lay tables out from the grid alone and ignore percentage widths. Earlier versions of `docx` wrote a placeholder grid of 100 twips per column, which made every table with percentage widths collapse to one character per column in those readers. If you set `columnWidths` yourself, make sure the values are real twips that match your intended widths.

### Cell Margins

Cells have the margins Word gives the tables it makes: 0.075 inches (108 twips) on the left and right, and none above or below. They come from Normal Table, the default table style `docx` writes. Without it, Word gives cells no margins, and their text touches the borders. Set `margins` on a table, or on a cell, to give them others. Styles from `externalStyles` with a Normal Table of their own use theirs.

### Set Indent

```ts live
import { Document, Paragraph, Table, TableCell, TableRow, WidthType } from "docx";

const table = new Table({
    rows: [
        new TableRow({
            children: [new TableCell({ children: [new Paragraph("Hello")] }), new TableCell({ children: [new Paragraph("World")] })],
        }),
    ],
    indent: {
        size: 600,
        type: WidthType.DXA,
    },
});

const doc = new Document({
    sections: [
        {
            children: [new Paragraph("This paragraph starts at the margin, and the table below is indented from it."), table],
        },
    ],
});
```

## Table Row

A table consists of multiple `table rows`. Table rows have a list of `children` which accepts a list of `table cells` explained below. You can create a simple `table row` like so:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const tableRow = new TableRow({
    children: [
        new TableCell({
            children: [new Paragraph("hello")],
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            children: [new Table({ rows: [tableRow] })],
        },
    ],
});
```

Or preferably, add the tableRow directly into the `table` without declaring a variable:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("hello")],
                }),
            ],
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            children: [table],
        },
    ],
});
```

### Options

Here is a list of options you can add to the `table row`:

| Property    | Type                                  | Notes    |
| ----------- | ------------------------------------- | -------- |
| children    | `Array<TableCell>`                    | Required |
| cantSplit   | `boolean`                             | Optional |
| tableHeader | `boolean`                             | Optional |
| height      | `{ value: number, rule: HeightRule }` | Optional |

### Repeat row

If a table is paginated on multiple pages, it is possible to repeat a row at the top of each new page by setting `tableHeader` to `true`:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const row = new TableRow({
    children: [new TableCell({ children: [new Paragraph("Item")] }), new TableCell({ children: [new Paragraph("Quantity")] })],
    tableHeader: true,
});

const doc = new Document({
    sections: [
        {
            children: [
                new Table({
                    rows: [
                        row,
                        // Enough rows to run onto a second page, where the header row repeats
                        ...Array.from(
                            { length: 60 },
                            (_, index) =>
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph(`Item ${index + 1}`)] }),
                                        new TableCell({ children: [new Paragraph(`${index + 1}`)] }),
                                    ],
                                }),
                        ),
                    ],
                }),
            ],
        },
    ],
});
```

### Pagination

#### Prevent row pagination

To prevent breaking contents of a row across multiple pages, call `cantSplit`:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const row = new TableRow({
    children: [
        new TableCell({
            children: [
                new Paragraph("The lines of this row stay together."),
                new Paragraph("If the row doesn't fit at the bottom of a page,"),
                new Paragraph("the whole row moves to the next page."),
            ],
        }),
    ],
    cantSplit: true,
});

const doc = new Document({
    sections: [
        {
            children: [new Table({ rows: [row] })],
        },
    ],
});
```

## Table Cells

Cells need to be added in the `table row`, you can create a table cell like:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const tableCell = new TableCell({
    children: [new Paragraph("hello")],
});

const doc = new Document({
    sections: [
        {
            children: [new Table({ rows: [new TableRow({ children: [tableCell] })] })],
        },
    ],
});
```

Or preferably, add the tableRow directly into the `table row` without declaring a variable:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const tableRow = new TableRow({
    children: [
        new TableCell({
            children: [new Paragraph("hello")],
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            children: [new Table({ rows: [tableRow] })],
        },
    ],
});
```

### Options

| Property      | Type                               | Notes                                                       |
| ------------- | ---------------------------------- | ----------------------------------------------------------- |
| children      | `Array<Paragraph or Table>`        | Required. You can nest tables by adding a table into a cell |
| shading       | `IShadingAttributesProperties`     | Optional                                                    |
| margins       | `ITableCellMarginOptions`          | Optional                                                    |
| verticalAlign | `VerticalAlignTable`               | Optional                                                    |
| columnSpan    | `number`                           | Optional                                                    |
| rowSpan       | `number`                           | Optional                                                    |
| borders       | `BorderOptions`                    | Optional                                                    |
| width         | `{ size: number type: WidthType }` | Optional                                                    |

#### Border Options

| Property | Type                                                                | Notes    |
| -------- | ------------------------------------------------------------------- | -------- |
| top      | `{ style: BorderStyle, size: number, color: string \| ThemeColor }` | Optional |
| bottom   | `{ style: BorderStyle, size: number, color: string \| ThemeColor }` | Optional |
| left     | `{ style: BorderStyle, size: number, color: string \| ThemeColor }` | Optional |
| right    | `{ style: BorderStyle, size: number, color: string \| ThemeColor }` | Optional |

##### Example

```ts live
import { BorderStyle, Document, Paragraph, Table, TableCell, TableRow } from "docx";

const cell = new TableCell({
    children: [new Paragraph("Hello")],
    borders: {
        top: {
            style: BorderStyle.DASH_DOT_STROKED,
            size: 1,
            color: "ff0000",
        },
        bottom: {
            style: BorderStyle.THICK_THIN_MEDIUM_GAP,
            size: 5,
            color: "889900",
        },
    },
});

const doc = new Document({
    sections: [
        {
            children: [new Table({ rows: [new TableRow({ children: [cell] })] })],
        },
    ],
});
```

##### Google DOCS

Google DOCS does not support start and end borders, instead they use left and right borders. So to set left and right borders for Google DOCS you should use:

```ts live
import { BorderStyle, Document, Paragraph, Table, TableCell, TableRow } from "docx";

const cell = new TableCell({
    children: [new Paragraph("Hello")],
    borders: {
        left: {
            style: BorderStyle.DOT_DOT_DASH,
            size: 3,
            color: "00FF00",
        },
        right: {
            style: BorderStyle.DOT_DOT_DASH,
            size: 3,
            color: "ff8000",
        },
    },
});

const doc = new Document({
    sections: [
        {
            children: [new Table({ rows: [new TableRow({ children: [cell] })] })],
        },
    ],
});
```

### Add paragraph to a cell

Once you have got the cell, you can add data to it:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const cell = new TableCell({
    children: [new Paragraph("Hello")],
});

const doc = new Document({
    sections: [
        {
            children: [new Table({ rows: [new TableRow({ children: [cell] })] })],
        },
    ],
});
```

### Set width of a cell

You can specify the width of a cell using:

```ts
const cell = new TableCell({
    ...,
    width: {
        size: number,
        type: WidthType,
    },
});
```

`WidthType` values can be:

| Property   | Notes                             |
| ---------- | --------------------------------- |
| AUTO       |                                   |
| DXA        | Value is in twentieths of a point |
| NIL        | Is considered as zero             |
| PERCENTAGE | Percent of table width            |

### Nested Tables

To have a table within a table, simply add it in the `children` block of a `table cell`:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const cell = new TableCell({
    children: [
        new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph("Inner cell 1")] }),
                        new TableCell({ children: [new Paragraph("Inner cell 2")] }),
                    ],
                }),
            ],
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            children: [
                new Table({
                    rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph("Outer cell")] }), cell] })],
                }),
            ],
        },
    ],
});
```

### Vertical Align

Sets the vertical alignment of the contents of the cell

```ts
const cell = new TableCell({
    ...,
    verticalAlign: VerticalAlignTable,
});
```

`VerticalAlign` values can be:

| Property | Notes                                      |
| -------- | ------------------------------------------ |
| BOTTOM   | Align the contents on the bottom           |
| CENTER   | Align the contents on the center           |
| TOP      | Align the contents on the top. The default |

For example, to center align a cell:

```ts live
import { Document, Paragraph, Table, TableCell, TableRow, VerticalAlignTable } from "docx";

const cell = new TableCell({
    children: [new Paragraph("Centered")],
    verticalAlign: VerticalAlignTable.CENTER,
});

const doc = new Document({
    sections: [
        {
            children: [
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Line 1"), new Paragraph("Line 2"), new Paragraph("Line 3")] }),
                                cell,
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

## Merging cells together

### Row Merge

When cell rows are merged, it counts as multiple rows, so be sure to remove excess cells. It is similar to how HTML's `rowspan` works.
https://www.w3schools.com/tags/att_td_rowspan.asp

```ts
const cell = new TableCell({
    ...,
    rowSpan: [NUMBER_OF_CELLS_TO_MERGE],
});
```

#### Example

The example will merge three rows together.

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const cell = new TableCell({
    children: [new Paragraph("Merged across three rows")],
    rowSpan: 3,
});

const doc = new Document({
    sections: [
        {
            children: [
                new Table({
                    rows: [
                        new TableRow({ children: [cell, new TableCell({ children: [new Paragraph("Row 1")] })] }),
                        // The merged cell takes the first place in the next two rows, so they have one cell each
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Row 2")] })] }),
                        new TableRow({ children: [new TableCell({ children: [new Paragraph("Row 3")] })] }),
                    ],
                }),
            ],
        },
    ],
});
```

### Column Merge

When cell columns are merged, it counts as multiple columns, so be sure to remove excess cells. It is similar to how HTML's `colspan` works.
https://www.w3schools.com/tags/att_td_colspan.asp

```ts
const cell = new TableCell({
    ...,
    columnSpan: [NUMBER_OF_CELLS_TO_MERGE],
});
```

#### Example

The example will merge three columns together.

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const cell = new TableCell({
    children: [new Paragraph("Merged across three columns")],
    columnSpan: 3,
});

const doc = new Document({
    sections: [
        {
            children: [
                new Table({
                    rows: [
                        new TableRow({ children: [cell] }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Column 1")] }),
                                new TableCell({ children: [new Paragraph("Column 2")] }),
                                new TableCell({ children: [new Paragraph("Column 3")] }),
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### Visual Right to Left Table

It is possible to reverse how the cells of the table are displayed. The table direction. More info here: https://superuser.com/questions/996912/how-to-change-a-table-direction-in-microsoft-word

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph("1")] }),
                new TableCell({ children: [new Paragraph("2")] }),
                new TableCell({ children: [new Paragraph("3")] }),
            ],
        }),
    ],
    visuallyRightToLeft: true,
});

const doc = new Document({
    sections: [
        {
            children: [table],
        },
    ],
});
```

### Table Look (Conditional Formatting)

Control which conditional formatting from a table style is applied. Table styles can define special formatting for the first row, first column, etc. Use `tableLook` to toggle these formatting options.

```ts live
import { Document, Paragraph, Table, TableCell, TableRow } from "docx";
import * as fs from "fs";

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph("Header 1")] }),
                new TableCell({ children: [new Paragraph("Header 2")] }),
                new TableCell({ children: [new Paragraph("Header 3")] }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph("Row 1, Col 1")] }),
                new TableCell({ children: [new Paragraph("Row 1, Col 2")] }),
                new TableCell({ children: [new Paragraph("Row 1, Col 3")] }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph("Row 2, Col 1")] }),
                new TableCell({ children: [new Paragraph("Row 2, Col 2")] }),
                new TableCell({ children: [new Paragraph("Row 2, Col 3")] }),
            ],
        }),
    ],
    // A table style from the document's styles, here the ones in demo/assets/custom-styles.xml
    style: "MyCustomTableStyle",
    tableLook: {
        firstRow: true, // Apply first row formatting
        lastRow: false, // Don't apply last row formatting
        firstColumn: true, // Apply first column formatting
        lastColumn: false, // Don't apply last column formatting
        noHBand: false, // Apply horizontal banding (row stripes)
        noVBand: true, // Don't apply vertical banding (column stripes)
    },
});

const doc = new Document({
    externalStyles: fs.readFileSync("./demo/assets/custom-styles.xml", "utf-8"),
    sections: [
        {
            children: [table],
        },
    ],
});
```

**Note**: When `tableLook` is not specified at all, Word applies row and column banding by default, but does not apply first/last row/column formatting.

#### Options

| Property    | Type      | Description                               |
| ----------- | --------- | ----------------------------------------- |
| firstRow    | `boolean` | Apply special formatting to first row     |
| lastRow     | `boolean` | Apply special formatting to last row      |
| firstColumn | `boolean` | Apply special formatting to first column  |
| lastColumn  | `boolean` | Apply special formatting to last column   |
| noHBand     | `boolean` | Disable horizontal banding (row stripes)  |
| noVBand     | `boolean` | Disable vertical banding (column stripes) |

#### Example

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/tables/table-look.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/tables/table-look.ts_

## Examples

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/tables/basic-table.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/tables/basic-table.ts_

### Custom borders

Example showing how to add colorful borders to tables

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/tables/table-cell-borders.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/tables/table-cell-borders.ts_

### Adding images

Example showing how to add images to tables

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/images/image-in-table-cell.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/images/image-in-table-cell.ts_

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/images/image-in-header-table-cell.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/images/image-in-header-table-cell.ts_

### Alignment of text in a cell

Example showing how align text in a table cell

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/tables/cell-alignment-and-text-direction.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/tables/cell-alignment-and-text-direction.ts_

### Shading

Example showing merging of columns and rows and shading

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/tables/merge-and-shade-cells.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/tables/merge-and-shade-cells.ts_

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/tables/merge-many-cells.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/tables/merge-many-cells.ts_

### Merging columns

Example showing merging of columns and rows

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/images/image-in-merged-table-cell.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/images/image-in-merged-table-cell.ts_

### Floating tables

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/tables/floating-tables.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/tables/floating-tables.ts_
