# Tables

!> Paragraphs requires an understanding of [Sections](usage/sections.md).

## Intro

-   `Tables` contain a list of `Rows`
-   `Rows` contain a list of `TableCells`
-   `TableCells` contain a list of `Paragraphs` and/or `Tables`. You can add `Tables` as tables can be nested inside each other

Create a simple table like so:

```ts
const table = new Table({
    rows: [Array of `TableRow`s]
});
```

Then add the table in the `section`

```ts
const doc = new Document({
    sections: [{
        children: [table],
    }];
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

```ts

const table = new Table({
    ...,
    width: {
        size: 4535,
        type: WidthType.DXA,
    }
});
```

### Set Indent

```ts
const table = new Table({
    ...,
    indent: {
        size: 600,
        type: WidthType.DXA,
    }
});
```

## Table Row

A table consists of multiple `table rows`. Table rows have a list of `children` which accepts a list of `table cells` explained below. You can create a simple `table row` like so:

```ts
const tableRow = new TableRow({
    children: [
        new TableCell({
            children: [new Paragraph("hello")],
        }),
    ],
});
```

Or preferably, add the tableRow directly into the `table` without declaring a variable:

```ts
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
```

### Options

Here is a list of options you can add to the `table row`:

| Property    | Type                                   | Notes    |
| ----------- | -------------------------------------- | -------- |
| children    | `Array<TableCell>`                     | Required |
| cantSplit   | `boolean`                              | Optional |
| tableHeader | `boolean`                              | Optional |
| height      | `{ height: number, rule: HeightRule }` | Optional |

### Repeat row

If a table is paginated on multiple pages, it is possible to repeat a row at the top of each new page by setting `tableHeader` to `true`:

```ts
const row = new TableRow({
    ...,
    tableHeader: true,
});
```

### Pagination

#### Prevent row pagination

To prevent breaking contents of a row across multiple pages, call `cantSplit`:

```ts
const row = new Row({
    ...,
    cantSplit: true,
});
```

## Table Cells

Cells need to be added in the `table row`, you can create a table cell like:

```ts
const tableCell = new TableCell({
    children: [new Paragraph("hello")],
});
```

Or preferably, add the tableRow directly into the `table row` without declaring a variable:

```ts
const tableRow = new TableRow({
    children: [
        new TableCell({
            children: [new Paragraph("hello")],
        }),
    ],
});
```

### Options

| Property      | Type                                | Notes                                                       |
| ------------- | ----------------------------------- | ----------------------------------------------------------- |
| children      | `Array<Paragraph or Table>`         | Required. You can nest tables by adding a table into a cell |
| shading       | `IShadingAttributesProperties`      | Optional                                                    |
| margins       | `ITableCellMarginOptions`           | Optional                                                    |
| verticalAlign | `VerticalAlign`                     | Optional                                                    |
| columnSpan    | `number`                            | Optional                                                    |
| rowSpan       | `number`                            | Optional                                                    |
| borders       | `BorderOptions`                     | Optional                                                    |
| width         | `{ size: number type: WidthType }`  | Optional                                                    |

#### Border Options

| Property | Type                                                  | Notes    |
| -------- | ----------------------------------------------------- | -------- |
| top      | `{ style: BorderStyle, size: number, color: string }` | Optional |
| bottom   | `{ style: BorderStyle, size: number, color: string }` | Optional |
| left     | `{ style: BorderStyle, size: number, color: string }` | Optional |
| right    | `{ style: BorderStyle, size: number, color: string }` | Optional |

##### Example

```ts
const cell = new TableCell({
    ...,
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
```

##### Google DOCS

Google DOCS does not support start and end borders, instead they use left and right borders. So to set left and right borders for Google DOCS you should use:

```ts
const cell = new TableCell({
    ...,
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
```

### Add paragraph to a cell

Once you have got the cell, you can add data to it:

```ts
const cell = new TableCell({
    children: [new Paragraph("Hello")],
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

```ts
const cell = new TableCell({
    children: [new Table(...)],
});
```

### Vertical Align

Sets the vertical alignment of the contents of the cell

```ts
const cell = new TableCell({
    ...,
    verticalAlign: VerticalAlign,
});
```

`VerticalAlign` values can be:

| Property | Notes                                      |
| -------- | ------------------------------------------ |
| BOTTOM   | Align the contents on the bottom           |
| CENTER   | Align the contents on the center           |
| TOP      | Align the contents on the top. The default |

For example, to center align a cell:

```ts
const cell = new TableCell({
    verticalAlign: VerticalAlign.CENTER,
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

```ts
const cell = new TableCell({
    ...,
    rowSpan: 3,
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

```ts
const cell = new TableCell({
    ...,
    columnSpan: 3,
});
```

### Visual Right to Left Table

It is possible to reverse how the cells of the table are displayed. The table direction. More info here: https://superuser.com/questions/996912/how-to-change-a-table-direction-in-microsoft-word

```ts
const table = new Table({
    visuallyRightToLeft: true,
});
```

## Examples

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/4-basic-table.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/4-basic-table.ts_

### Custom borders

Example showing how to add colorful borders to tables

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/20-table-cell-borders.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/20-table-cell-borders.ts_

### Adding images

Example showing how to add images to tables

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/24-images-to-table-cell.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/24-images-to-table-cell.ts_

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/36-image-to-table-cell.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/36-image-to-table-cell.ts_

### Alignment of text in a cell

Example showing how align text in a table cell

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/31-tables.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/31-tables.ts_

### Shading

Example showing merging of columns and rows and shading

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/32-merge-and-shade-table-cells.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/32-merge-and-shade-table-cells.ts_

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/41-merge-table-cells-2.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/41-merge-table-cells-2.ts_

### Merging columns

Example showing merging of columns and rows

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/43-images-to-table-cell-2.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/43-images-to-table-cell-2.ts_

### Floating tables

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/34-floating-tables.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/34-floating-tables.ts_
