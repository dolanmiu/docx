# Tables

!> Paragraphs requires an understanding of [Sections](usage/sections.md).

## Intro

Create a simple table like so:

```ts
const table = new Table({
    rows: [Array of `TableRow`s]
});
```

Then add the table in the `section`

```ts
doc.addSection({
    children: [table],
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

| Property    | Type                                  | Notes    |
| ----------- | ------------------------------------- | -------- |
| children    | `Array<TableCell>`                    | Required |
| cantSplit   | `boolean`                             | Optional |
| tableHeader | `boolean`                             | Optional |
| height      | `{ value: number, rule: HeightRule }` | Optional |

## Cells

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

| Property    | Type                                  | Notes    |
| ----------- | ------------------------------------- | -------- |
| children    | `Array<TableCell>`                    | Required |
| cantSplit   | `boolean`                             | Optional |
| tableHeader | `boolean`                             | Optional |
| height      | `{ value: number, rule: HeightRule }` | Optional |

### Options

 readonly shading?: ITableShadingAttributesProperties;
    readonly margins?: ITableCellMarginOptions;
    readonly verticalAlign?: VerticalAlign;
    readonly verticalMerge?: VMergeType;
    readonly columnSpan?: number;
    readonly borders?: {
        readonly top?: {
            readonly style: BorderStyle;
            readonly size: number;
            readonly color: string;
        };
        readonly bottom?: {
            readonly style: BorderStyle;
            readonly size: number;
            readonly color: string;
        };
        readonly left?: {
            readonly style: BorderStyle;
            readonly size: number;
            readonly color: string;
        };
        readonly right?: {
            readonly style: BorderStyle;
            readonly size: number;
            readonly color: string;
        };
    };
    readonly children: Array<Paragraph | Table>;



### Add paragraph to a cell

Once you have got the cell, you can add data to it with the `add()` method.

```ts
new TableCell({
    children: [new Paragraph("Hello")],
}),
```

### Set width of a cell

You can specify the width of a cell using:

`cell.Properties.setWidth(width, format)`

format can be:

-   WidthType.AUTO
-   WidthType.DXA: value is in twentieths of a point
-   WidthType.NIL: is considered as zero
-   WidthType.PCT: percent of table width

### Example

```ts
cell.Properties.setWidth(100, WidthType.DXA);
```

```ts
cell.Properties.setWidth("50%", WidthType.PCT);
```

## Borders

BorderStyle can be imported from `docx`. Size determines the thickness. HTML color can be a hex code or alias such as `red`.

```ts
cell.Borders.addTopBorder([BorderStyle], [SIZE], [HTML COLOR]);
```

```ts
cell.Borders.addBottomBorder([BorderStyle], [SIZE], [HTML COLOR]);
```

```ts
cell.Borders.addStartBorder([[BorderStyle]], [SIZE], [HTML COLOR]);
```

```ts
cell.Borders.addEndBorder([BorderStyle], [SIZE], [HTML COLOR]);
```

### Example

```ts
import { BorderStyle } from "docx";

cell.Borders.addStartBorder(BorderStyle.DOT_DOT_DASH, 3, "green");
cell.Borders.addEndBorder(BorderStyle.DOT_DOT_DASH, 3, "#ff8000");
```

### Google DOCS

Google DOCS does not support start and end borders, instead they use left and right borders. So to set left and right borders for Google DOCS you should use:

```ts
import { BorderStyle } from "docx";

cell.Borders.addLeftBorder(BorderStyle.DOT_DOT_DASH, 3, "green");
cell.Borders.addRightBorder(BorderStyle.DOT_DOT_DASH, 3, "#ff8000");
```

## Set Width

```ts
import { WidthType } from "docx";

table.setWidth([WIDTH], [OPTIONAL WidthType. Defaults to DXA]);
```

For example:

```ts
table.setWidth(4535, WidthType.DXA);
```

## Vertical Align

Sets the vertical alignment of the contents of the cell

```ts
import { VerticalAlign } from "docx";

cell.setVerticalAlign([VerticalAlign TYPE]);
```

For example, to center align a cell:

```ts
cell.setVerticalAlign(VerticalAlign.CENTER);
```

## Rows

To get a row, use the `getRow` method on a `table`. There are a handful of methods which you can apply to a row which will be explained below.

```ts
table.getRow([ROW INDEX]);
```

## Merge cells together

### Merging on a row

First obtain the row, and call `mergeCells()`. The first argument is where the merge should start. The second argument is where the merge should end.

```ts
table.getRow(0).mergeCells([FROM INDEX], [TO INDEX]);
```

#### Example

This will merge 3 cells together starting from index `0`:

```ts
table.getRow(0).mergeCells(0, 2);
```

### Merging on a column

It has not been implemented yet, but it will follow a similar structure as merging a row.

## Nested Tables

To have a table within a table

```ts
cell.add(new Table(1, 1));
```

## Pagination

###Prevent row pagination
To prevent breaking contents of a row across multiple pages, call `cantSplit()`:

```ts
table.getRow(0).setCantSplit();
```

###Repeat row
If a table is paginated on multiple pages, it is possible to repeat a row at the top of each new page calling `setTableHeader()`:

```ts
table.getRow(0).setTableHeader();
```

## Examples

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/4-basic-table.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/4-basic-table.ts_

### Custom borders

Example showing how to add colourful borders to tables

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

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/32-merge-table-cells.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/32-merge-table-cells.ts_

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/41-merge-table-cells-2.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/41-merge-table-cells-2.ts_

### Merging columns

Example showing merging of columns and rows

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/43-images-to-table-cell-2.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/43-images-to-table-cell-2.ts_

### Floating tables

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/34-floating-tables.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/34-floating-tables.ts_
