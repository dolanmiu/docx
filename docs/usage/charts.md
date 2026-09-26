# Charts

!> Charts require an understanding of [Paragraphs](usage/paragraph.md).

Charts are native Word charts. Word draws each one from its data, in the document's theme, just as it draws a chart made with **Insert > Chart**. **Edit Data** in Word opens the chart's data in Excel.

Like an image, a chart is a run inside a `Paragraph`.

## Your First Chart

```ts
import * as fs from "fs";
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

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
```

This draws a column chart with a column for each year in each month, and a legend below it:

- `type` is the kind of chart. See [Chart Types](#chart-types).
- `categories` are the labels along the bottom: one group of columns for each.
- `series` are the sets of values. Each has a `name`, which the legend shows, and one value for each category, in order.
- `null` leaves a gap, so there is no 2025 column for March.

Every chart needs a `type` and its `series`, and every type but a scatter chart needs `categories`. All the other options are optional.

## Chart Types

`type` is the name Word gives the chart in **Insert > Chart**. Each page shows a chart type's own options, such as stacking for column charts and markers for line charts.

| Type         | Draws                                    | Use it to                               | Page                                                       |
| ------------ | ---------------------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `"column"`   | Vertical bars                            | Compare values across categories        | [Column and Bar Charts](usage/chart-column-and-bar.md)     |
| `"bar"`      | Horizontal bars                          | Compare values with long category names | [Column and Bar Charts](usage/chart-column-and-bar.md)     |
| `"line"`     | A line for each series                   | Show a trend over time                  | [Line and Area Charts](usage/chart-line-and-area.md)       |
| `"area"`     | A filled area for each series            | Show a trend, and how the parts add up  | [Line and Area Charts](usage/chart-line-and-area.md)       |
| `"pie"`      | Slices of a circle                       | Show the parts of one whole             | [Pie and Doughnut Charts](usage/chart-pie-and-doughnut.md) |
| `"doughnut"` | A ring of slices for each series         | Compare the parts of several wholes     | [Pie and Doughnut Charts](usage/chart-pie-and-doughnut.md) |
| `"radar"`    | A line round a spoke for each category   | Compare several qualities at once       | [Radar Charts](usage/chart-radar.md)                       |
| `"scatter"`  | Points, each with its own x and y        | Show how two numbers relate             | [Scatter Charts](usage/chart-scatter.md)                   |
| `"bubble"`   | Bubbles, each with its own x, y and size | Show how three numbers relate           | [Bubble Charts](usage/chart-bubble.md)                     |

Columns, lines and areas can be drawn together in one chart, with a second value axis on the right. See [Combo Charts](usage/chart-combo.md).

## Common Use Cases

| I want to...                                 | Use                                            | Page                                                                         |
| -------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Give a chart its data                        | `categories` and `series`                      | [Chart Data](usage/chart-data.md)                                            |
| Show dates along the bottom                  | `Date`s as the categories                      | [Chart Axes](usage/chart-axes.md#dates)                                      |
| Draw a line over columns                     | A series' `type`                               | [Combo Charts](usage/chart-combo.md)                                         |
| Show numbers on another scale on the right   | A series' `axis: "secondary"`                  | [Combo Charts](usage/chart-combo.md#a-secondary-axis)                        |
| Change a series' colour                      | `color`, such as `"1F4E79"` or a theme colour  | [Chart Colours](usage/chart-colors.md)                                       |
| Pick out one bar in another colour           | A series' `colors`                             | [Column and Bar Charts](usage/chart-column-and-bar.md#bar-colours)           |
| Draw a dashed line, or change the markers    | A series' `line` and `markers`                 | [Line and Area Charts](usage/chart-line-and-area.md#markers)                 |
| Add a title, or move or hide the legend      | `title` and `legend`                           | [Chart Titles and Legends](usage/chart-titles-and-legends.md)                |
| Change the font or the background            | `font`, `chartArea` and `plotArea`             | [Chart Fonts and Fills](usage/chart-fonts-and-fills.md)                      |
| Name an axis, or set its range or its format | `categoryAxis` and `valueAxis`                 | [Chart Axes](usage/chart-axes.md)                                            |
| Use a logarithmic scale, or thousands        | `logarithmicBase` and `displayUnits`           | [Chart Axes](usage/chart-axes.md#logarithmic-scale)                          |
| Show the numbers on the chart                | `dataLabels`                                   | [Chart Data Labels](usage/chart-data-labels.md)                              |
| Make a chart bigger or smaller               | `transformation`                               | [Chart Size and Position](usage/chart-size-and-position.md)                  |
| Float a chart beside its text                | `floating`                                     | [Chart Size and Position](usage/chart-size-and-position.md)                  |
| Put a chart in a table, header or footer     | A `Paragraph` with the chart in it             | [Chart Size and Position](usage/chart-size-and-position.md)                  |
| Describe a chart for screen readers          | `altText`, or nothing: it is described for you | [Chart Size and Position](usage/chart-size-and-position.md#alternative-text) |
| Know how a chart looks in other applications |                                                | [Chart Compatibility](usage/chart-compatibility.md)                          |

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

## Mistakes

`new ChartRun(...)` throws an error when an option is wrong, such as a series with more values than there are categories. The error says what is wrong, and it is thrown where the chart is made, not when the document is opened. [Chart Data](usage/chart-data.md#mistakes) lists the mistakes.

## Examples

### Charts

A chart of each of the first types, with a small chart in the header, two charts in a table and one floating beside its text.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/121-charts.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/121-charts.ts_

### Chart Options

A combo chart with a secondary axis, dates, axes in reverse and on a logarithmic scale, labels and colours, fonts and fills, and radar and bubble charts.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/122-chart-options.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/122-chart-options.ts_
