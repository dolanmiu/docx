# Tables

You can create tables with `docx`. More information can be found [here](http://officeopenxml.com/WPtable.php).

## Create Table

To create a table, simply create one with `new Table()`, then add it to the document: `doc.add()`.

```ts
const table = doc.add(new Table({
    rows: [NUMBER OF ROWS],
    columns: [NUMBER OF COLUMNS]
});
```

Alternatively, you can create a table object directly, and then add it in the `document`

```ts
const table = new Table(4, 4);
doc.add(table);
```

The snippet below creates a table of 2 rows and 4 columns.

```ts
const table = new Table({
    rows: 2,
    columns: 4,
});
doc.add(table);
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

To access the cell, use the `getCell()` method.

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

Once you have got the cell, you can add data to it with the `add()` method.

```ts
cell.add(new Paragraph("Hello"));
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

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo4.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo4.ts_

### Custom borders

Example showing how to add colourful borders to tables

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo20.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo20.ts_

### Adding images

Example showing how to add images to tables

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo24.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo24.ts_

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo36.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo36.ts_

### Alignment of text in a cell

Example showing how align text in a table cell

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo31.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo31.ts_

### Merging rows

Example showing merging of `rows`

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo32.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo32.ts_

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo41.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo41.ts_

### Merging columns

Example showing merging of `columns`

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo43.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo43.ts_

### Floating tables

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo34.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo34.ts_
