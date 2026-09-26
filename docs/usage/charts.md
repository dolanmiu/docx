# Charts

!> Charts require an understanding of [Paragraphs](usage/paragraph.md).

Charts are native Word charts: column, bar, line, area, pie, doughnut and scatter charts that Word draws from their data, in the document's theme, as it draws a chart made with **Insert > Chart**. The data is also written to a workbook embedded in the document, so **Edit Data** in Word opens it in Excel.

Like an image, a chart is a run inside a `Paragraph`. It sits in the line of text unless you make it `floating`, and it can go in a table cell, a header, a footer or a footnote.

## Common Use Cases

| I want to...                           | Use                                                  | Example                     |
| -------------------------------------- | ---------------------------------------------------- | --------------------------- |
| Compare values across categories       | `type: "column"`, or `"bar"` for long category names | Sales by quarter            |
| Show parts of a whole in each category | `stacking: "stacked"`, or `"percent"` for 100%       | Hours by team, energy mix   |
| Show a trend over time                 | `type: "line"` or `"area"`                           | Temperature by day          |
| Show parts of one whole                | `type: "pie"`, or `"doughnut"` to compare two wholes | Market share                |
| Plot pairs of numbers                  | `type: "scatter"` with `points`                      | Height and weight           |
| Show the numbers on the chart          | `dataLabels: { value: true }`                        | A value above each bar      |
| Draw a small chart in a line of text   | `legend: false` and hidden axes                      | A trend next to a heading   |
| Match the document's colours           | A theme colour, such as `{ theme: "accent2" }`       | Series in the brand colours |

## Importing

Charts come with the `docx` package. Import them from `docx/charts`, and everything else, such as the document and its paragraphs, from `docx`:

```ts
import { Document, Packer, Paragraph } from "docx";
import { ChartRun } from "docx/charts";
```

Types such as `ChartRunOptions` and `ChartSeries` come from `docx/charts` too.

In a page without a bundler, load the charts after `docx`: `dist/charts.umd.cjs` after `dist/index.umd.cjs`, or `dist/charts.iife.js` after `dist/index.iife.js`. They add a `docxCharts` global next to the `docx` one:

```html
<script src="node_modules/docx/dist/index.umd.cjs"></script>
<script src="node_modules/docx/dist/charts.umd.cjs"></script>
<script>
    const chart = new docxCharts.ChartRun({ type: "pie", categories: ["A", "B"], series: [{ name: "Share", values: [60, 40] }] });
</script>
```

## Basic Usage

```ts
import { Document, Packer, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            title: "Sales",
                            categories: ["Jan", "Feb", "Mar"],
                            series: [
                                { name: "2024", values: [10, 20, 30] },
                                { name: "2025", values: [15, 25, null] },
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

This draws a column chart 6 inches wide and 3.5 inches tall, the size Word inserts a chart at, with a column for each series in each month, and a legend below. `null` leaves a gap: there is no 2025 column for March.

## Chart Types

`type` is the name Word gives the chart in **Insert > Chart**:

<!-- cspell:disable -->

| Type         | Draws                                                                 | Written as                         |
| ------------ | --------------------------------------------------------------------- | ---------------------------------- |
| `"column"`   | Vertical bars                                                         | `c:barChart` with `c:barDir="col"` |
| `"bar"`      | Horizontal bars. The first category is at the bottom, as in Word      | `c:barChart` with `c:barDir="bar"` |
| `"line"`     | A line for each series                                                | `c:lineChart`                      |
| `"area"`     | A filled area for each series                                         | `c:areaChart`                      |
| `"pie"`      | One series as slices of a circle                                      | `c:pieChart`                       |
| `"doughnut"` | A ring for each series, the first on the inside                       | `c:doughnutChart`                  |
| `"scatter"`  | Points, each with its own x and y, with or without lines between them | `c:scatterChart`                   |

<!-- cspell:enable -->

Each type has its own options, so your editor only suggests the ones that go with it.

### Column and bar charts

```ts
new ChartRun({
    type: "bar",
    categories: ["Design", "Build", "Test"],
    series: [
        { name: "Planned", values: [30, 80, 40] },
        { name: "Extra", values: [5, 20, 15] },
    ],
    stacking: "stacked",
});
```

`stacking` is `"none"` (the default, bars side by side), `"stacked"` (on top of each other) or `"percent"` (on top of each other, as a percentage of the category's total), as Word's "Stacked" and "100% Stacked" charts are.

`gapWidth` is the space between groups of bars, as a percentage of a bar's width, from 0 to 500, and `overlap` is how much the bars in a group overlap, from -100 (a bar's width apart) to 100. The defaults are Office's: a gap of 219 and an overlap of -27 for column charts, 182 and 0 for bar charts, and a gap of 150 when stacked. Stacked bars always overlap fully.

### Line and area charts

```ts
new ChartRun({
    type: "line",
    categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    series: [{ name: "High", values: [21, 23, 25, 24, 22] }],
    markers: true,
    smooth: true,
});
```

`markers` draws a circle at each point, as Word's "Line with Markers" does, and `smooth` draws the lines as curves. Both are off by default. Line and area charts can be stacked, as column charts can.

An area reaches both sides of the plot, as in Word's and Excel's area charts.

### Pie and doughnut charts

```ts
new ChartRun({
    type: "pie",
    categories: ["North", "South", "East", "West"],
    series: [{ name: "Share", values: [40, 25, 20, 15], colors: ["1F4E79", "2E75B6", "9DC3E6", "DEEBF7"] }],
    dataLabels: { percentage: true },
    firstSliceAngle: 90,
});
```

A pie chart has one series, and a doughnut chart a ring for each series. Each slice is a category, and the legend shows the categories. Values can't be negative.

- `colors` gives each slice its colour. A slice without one takes the next of the theme's accent colours. A slice has the same colour in each ring of a doughnut.
- `firstSliceAngle` is where the first slice starts, in degrees clockwise from 12 o'clock. Default `0`.
- `holeSize` is a doughnut's hole, as a percentage of its diameter, from 10 to 90. Default `50`.

### Scatter charts

```ts
new ChartRun({
    type: "scatter",
    series: [
        {
            name: "Group A",
            points: [
                { x: 150, y: 50 },
                { x: 165, y: 61 },
                { x: 180, y: 75 },
            ],
        },
    ],
    lines: "straight",
    xAxis: { title: "Height (cm)", minimum: 140 },
    yAxis: { title: "Weight (kg)" },
});
```

A scatter chart has no categories: each series has its own `points`. `markers` draws a circle at each point (default `true`), and `lines` joins the points: `"none"` (the default), `"straight"` or `"smooth"`. Its two axes are both value axes, `xAxis` and `yAxis`.

## Series and Colours

A series of a column, bar, line or area chart has a `name`, shown in the legend, and one value for each category, in order. `null` leaves a gap, and a series can have fewer values than there are categories. Categories are text, or numbers such as years: if they are all numbers, they are written as numbers.

Each series takes the next of the theme's accent colours, as in Word, and after the sixth, the six again, darker and lighter. Give a series a `color` of its own as a hex colour, or as a colour of the document's [theme](usage/themes.md), lighter or darker as in Word's colour menus:

```ts
series: [
    { name: "Planned", values: [30, 80, 40], color: "1F4E79" },
    { name: "Extra", values: [5, 20, 15], color: { theme: "accent2", lighter: 40 } },
],
```

Colours from the theme change when the document's theme does, as they do in Word.

## Titles, Legends and Axes

- `title` is written above the plot. Each line of the text is a line of the title. There is no title by default.
- `legend` is below the plot by default. Set `position` to `"top"`, `"bottom"`, `"left"`, `"right"` or `"topRight"`, or `legend: false` to leave it out.
- `categoryAxis` and `valueAxis`, and a scatter chart's `xAxis` and `yAxis`, take a `title`, `visible: false` to hide the axis and its labels, and `gridlines` (on by default for value axes, off for category axes).
- A value axis also takes `minimum`, `maximum` and `interval` (the step between its labels and gridlines), which are chosen from the values by default, and `numberFormat`, an Excel number format such as `"#,##0"`, `"0.0%"` or `"$#,##0"`.

On a 100% stacked chart, the value axis is labelled as percentages, and its `minimum`, `maximum` and `interval` are percentages too: `maximum: 50` is 50%.

```ts
new ChartRun({
    type: "column",
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [{ name: "Sales", values: [120, 135, 150, 170] }],
    title: "Sales by quarter",
    legend: { position: "right" },
    categoryAxis: { title: "Quarter" },
    valueAxis: { title: "Units", minimum: 0, interval: 50, numberFormat: "#,##0" },
});
```

A chart with no title, legend or axes can be as small as a word:

```ts
new ChartRun({
    type: "line",
    categories: months,
    series: [{ name: "Visitors", values: visitors }],
    legend: false,
    categoryAxis: { visible: false },
    valueAxis: { visible: false, gridlines: false },
    transformation: { width: 144, height: 48 },
});
```

## Data Labels

`dataLabels` puts a label on each bar, point or slice, showing its `value`, its `category` (a scatter point's x) or its `seriesName`, and on a pie or doughnut chart, its `percentage` of the whole. There are no labels by default.

```ts
dataLabels: { value: true },
```

The labels go where Office puts them: outside the end of a bar, in the middle of a stacked bar, to the right of a point, and where they fit best on a pie.

## Size, Floating and Alternative Text

`transformation` is the chart's size in pixels, `{ width, height }`. The default is 576 by 336 pixels, 6 by 3.5 inches, the size Word inserts a chart at. As in Word, a chart's aspect ratio isn't locked, so it can be made wider without being made taller.

Add `floating` to position the chart on the page instead of in the line of text. The options are the same as for [floating images](usage/images.md#floating):

```ts
new ChartRun({
    type: "column",
    categories: ["Mon", "Tue", "Wed"],
    series: [{ name: "Orders", values: [8, 12, 9] }],
    transformation: { width: 260, height: 180 },
    floating: {
        horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.RIGHT },
        verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
        wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT },
    },
});
```

Give a chart `altText` so screen readers can describe it: `{ name, description, title }`.

## The Workbook

Each chart's data is written twice: in the chart, which is what applications draw it from, and in a workbook embedded in the document (`word/embeddings/Microsoft_Excel_Worksheet1.xlsx`), which is what Word's **Edit Data** opens. The workbook has one sheet, laid out as Word lays out a new chart's data:

- for a chart with categories, the series' names in row 1 from column B, the categories in column A from row 2, and each series' values below its name;
- for a scatter chart, two columns for each series: `X` above its x values, and its name above its y values.

An empty cell is a gap. Each chart is written as a part of its own (`word/charts/chart1.xml`), with relationships to it from the part it is in, and to its workbook from it.

## Mistakes

`new ChartRun(...)` throws when an option is wrong, so the mistake shows up where the chart is made:

- there are no series, or no categories;
- a value isn't a finite number or `null`, or a series has more values than there are categories;
- a pie chart has more than one series, or a pie or doughnut chart a negative value;
- a scatter series has no points, or a point isn't two finite numbers;
- an option is outside its range, such as `gapWidth: 600`, or a value axis' `minimum` isn't less than its `maximum`.

## Options

### Every chart

| Property         | Type                     | Notes    | Description                                                                   |
| ---------------- | ------------------------ | -------- | ----------------------------------------------------------------------------- |
| `type`           | `ChartType`              | Required | `"column"`, `"bar"`, `"line"`, `"area"`, `"pie"`, `"doughnut"` or `"scatter"` |
| `title`          | `string`                 | Optional | The chart's title. Default is none                                            |
| `legend`         | `false` \| `ChartLegend` | Optional | `{ position }`, or `false` for none. Default is below the plot                |
| `transformation` | `{ width, height }`      | Optional | Size in pixels. Default is 576 by 336                                         |
| `floating`       | `IFloating`              | Optional | See [floating images](usage/images.md#floating)                               |
| `altText`        | `DocPropertiesOptions`   | Optional | `name`, `description` and `title` for screen readers                          |

### Column, bar, line and area charts

| Property       | Type                                   | Notes    | Description                                                                                              |
| -------------- | -------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `categories`   | `(string \| number)[]`                 | Required | The categories, in order                                                                                 |
| `series`       | `ChartSeries[]`                        | Required | `{ name, values, color? }`, with a value or `null` for each category                                     |
| `stacking`     | `"none"` \| `"stacked"` \| `"percent"` | Optional | Default `"none"`                                                                                         |
| `categoryAxis` | `ChartAxis`                            | Optional | `{ title?, visible?, gridlines? }`                                                                       |
| `valueAxis`    | `ChartValueAxis`                       | Optional | As `categoryAxis`, with `minimum?`, `maximum?`, `interval?` and `numberFormat?`                          |
| `dataLabels`   | `ChartDataLabels`                      | Optional | `{ value?, category?, seriesName? }`                                                                     |
| `gapWidth`     | `number`                               | Optional | Column and bar charts: the space between groups of bars, as a percentage of a bar's width, from 0 to 500 |
| `overlap`      | `number`                               | Optional | Column and bar charts: how much the bars in a group overlap, from -100 to 100                            |
| `markers`      | `boolean`                              | Optional | Line charts: a circle at each point. Default `false`                                                     |
| `smooth`       | `boolean`                              | Optional | Line charts: curved lines. Default `false`                                                               |

### Pie and doughnut charts

| Property          | Type                   | Notes    | Description                                                                             |
| ----------------- | ---------------------- | -------- | --------------------------------------------------------------------------------------- |
| `categories`      | `(string \| number)[]` | Required | The slices, in order                                                                    |
| `series`          | `PieChartSeries[]`     | Required | `{ name, values, colors? }`. A pie chart has one, a doughnut a ring for each            |
| `dataLabels`      | `PieChartDataLabels`   | Optional | `{ value?, category?, seriesName?, percentage? }`                                       |
| `firstSliceAngle` | `number`               | Optional | Degrees clockwise from 12 o'clock, from 0 to 360. Default `0`                           |
| `holeSize`        | `number`               | Optional | Doughnut charts: the hole, as a percentage of the diameter, from 10 to 90. Default `50` |

### Scatter charts

| Property     | Type                                   | Notes    | Description                                             |
| ------------ | -------------------------------------- | -------- | ------------------------------------------------------- |
| `series`     | `ScatterChartSeries[]`                 | Required | `{ name, points, color? }`, where a point is `{ x, y }` |
| `markers`    | `boolean`                              | Optional | A circle at each point. Default `true`                  |
| `lines`      | `"none"` \| `"straight"` \| `"smooth"` | Optional | How the points are joined. Default `"none"`             |
| `xAxis`      | `ChartValueAxis`                       | Optional | The horizontal axis                                     |
| `yAxis`      | `ChartValueAxis`                       | Optional | The vertical axis                                       |
| `dataLabels` | `ChartDataLabels`                      | Optional | `{ value?, category?, seriesName? }`                    |

## Compatibility

Charts are written as DrawingML charts (`c:chartSpace`) in the look Office 2013 and later give a new chart, with their data in an embedded workbook, as Word 2016 writes them. Applications draw a chart from the data in the chart part, so they don't need to open the workbook.

?> Word itself hasn't been checked yet. The charts and their workbooks pass the Open XML SDK validator, Microsoft's own check, for every version of Office since 2010, and are drawn as intended by LibreOffice and Apple Pages.

LibreOffice (checked with version 26.8) draws every chart as intended, and opens the workbooks in Calc.

Apple Pages (checked with version 15.1) draws the charts, but:

- It doesn't draw a chart less than about half an inch tall: 48 pixels tall is drawn, 32 pixels isn't.
- It draws only the first series of a doughnut chart, as one ring.
- It draws stacked lines at their own values, not stacked.
- It puts the last series in front in an area chart that isn't stacked, where LibreOffice puts the first.
- It divides a value axis into four equal steps, such as 0, 43, 85, 128 and 170, unless it has an `interval`.
- It narrows a pie or doughnut chart to the pie, so a floating one moves away from the right margin. Word does this with its own pie charts too.

## Examples

### Charts

One chart of each type, with a small chart in the header, two charts in a table and one floating beside its text.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/121-charts.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/121-charts.ts_
