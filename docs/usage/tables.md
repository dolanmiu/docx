# Tables

You can create tables with `docx`. More information can be found [here](http://officeopenxml.com/WPtable.php).

## Create Table

To create a table, simply use the `createTable()` method on a `document`.

```ts
const table = doc.createTable([NUMBER OF ROWS], [NUMBER OF COLUMNS]);
```

Alternatively, you can create a table object directly, and then add it in the `document`

```ts
const table = new Table(4, 4);
doc.addTable(table);
```

The snippet below creates a table of 2 rows and 4 columns.

```ts
const table = doc.createTable(2, 4);

// Or

const table = new Table(2, 4);
doc.addTable(table);
```

## Rows and Columns

You can get a row or a column from a table like so, where `index` is a number:

### Get Row

```ts
const row = doc.getRow(index);
```

With this, you can merge a row by using the `mergeCells()` method, where `startIndex` is the row number you want to merge from, and `endIndex` is where you want it to merge to:

```ts
row.mergeCells(startIndex, endIndex);
```

You can get a cell from a `row` by using the `getCell()` method, where `index` is the row index:

```ts
row.getCell(index);
```

### Get Column

```ts
const column = doc.getColumn(index);
```

Again, you can merge a row by using the `mergeCells()` method, where `startIndex` is the row number you want to merge from, and `endIndex` is where you want it to merge to:

```ts
column.mergeCells(startIndex, endIndex);
```

You can get a cell from a `column` by using the `getCell()` method, where `index` is the column index:

```ts
column.getCell(index);
```

## Cells

The `createTable()` method created a table with cells. To access the cell, use the `getCell()` method.

```ts
const cell = table.getCell([ROW INDEX], [COLUMN INDEX]);
```

You can also get a cell from a `column` or a `row` with `getCell()`, mentioned previously.

For example:

```ts
const cell = table.getCell(0, 2);

const cell = row.getCell(0);

const cell = column.getCell(2);
```

### Add paragraph to a cell

Once you have got the cell, you can add data to it with the `addParagraph()` method.

```ts
cell.addParagraph(new Paragraph("Hello"));
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
cell.Borders.addStartBorder(BorderStyle.DOT_DOT_DASH, 3, "#ff8000");
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
cell.addTable(new Table(1, 1));
```

## Examples

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo4.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo4.ts_
