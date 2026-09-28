# Line and Area Charts

A line chart draws a line through each series' values, and an area chart fills the space below each line. Use them to show a trend, such as a value over days, months or years. The categories are the points along the bottom.

[Charts](usage/charts.md) shows how to import `ChartRun` and add a chart to a document.

## A Line Chart

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "line",
                            title: "Temperature",
                            categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                            series: [
                                { name: "High", values: [21, 23, 25, 24, 22] },
                                { name: "Low", values: [12, 13, 15, 14, 13] },
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

A `null` value leaves a gap in its line.

## Empty Values

`emptyValues` says how a `null` value is drawn, as Word's "Hidden and Empty Cells" does:

| `emptyValues`     | Draws a `null` as                                                    |
| ----------------- | -------------------------------------------------------------------- |
| `"gap"` (default) | A gap: a break in the line, or no column                             |
| `"zero"`          | Zero                                                                 |
| `"connect"`       | Nothing, with the line joined from the point before to the one after |

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "line",
                            categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                            series: [{ name: "Visitors", values: [320, 410, null, 380, 460] }],
                            emptyValues: "connect",
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

Column, bar, line, area, radar and stock charts take `emptyValues`. Only lines are joined: a column chart's `"connect"` is a gap. Pages draws every empty value as a gap. See [Chart Compatibility](usage/chart-compatibility.md).

## Markers

`markers: true` draws a circle at each point, as Word's "Line with Markers" does. There are no markers by default.

Markers can have a shape and size of their own. Give `markers` a `shape`, a `size` in points, or both:

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "line",
                            categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                            series: [{ name: "High", values: [21, 23, 25, 24, 22] }],
                            markers: { shape: "diamond", size: 8 },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

| `shape`              | Draws                  |
| -------------------- | ---------------------- |
| `"circle"` (default) | A circle               |
| `"square"`           | A square               |
| `"diamond"`          | A diamond              |
| `"triangle"`         | A triangle             |
| `"x"`                | An ×                   |
| `"plus"`             | A +                    |
| `"star"`             | An asterisk            |
| `"dash"`             | A short horizontal bar |
| `"dot"`              | A small dot            |

`size` goes from `2` to `72`. The default is `5`.

## Lines

`smooth: true` draws each line as a smooth curve through its points. Lines are straight by default.

A series' `line` gives its line a colour, width or dash pattern of its own, such as a dashed line for a target:

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "line",
                            categories: ["Q1", "Q2", "Q3", "Q4"],
                            series: [
                                { name: "Sales", values: [120, 135, 150, 170] },
                                { name: "Target", values: [130, 140, 150, 160], line: { dash: "dash", width: 1.5 } },
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

- `width` is in points, from `0` to `1584`. Lines are 2.25 points wide by default.
- `color` is the line's colour. By default it is the series' `color`, which its markers keep.
- `dash` is one of the patterns shapes' lines have: `"solid"` (the default), `"dot"`, `"dash"`, `"longDash"`, `"dashDot"`, `"longDashDot"`, `"longDashDotDot"`, `"shortDash"`, `"shortDot"`, `"shortDashDot"` and `"shortDashDotDot"`.

## Each Series' Own Markers and Lines

A series' own `markers` and `smooth` replace the chart's, so one series can be different:

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "line",
                            categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                            series: [
                                { name: "High", values: [21, 23, 25, 24, 22] },
                                { name: "Low", values: [12, 13, 15, 14, 13], markers: { shape: "square" }, smooth: true },
                            ],
                            markers: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

Here the highs have circles and straight lines, and the lows squares and a smooth line.

## An Area Chart

An area chart takes the same options as a line chart, with `type: "area"` and without markers or lines:

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "area",
                            title: "Energy mix",
                            categories: [2021, 2022, 2023, 2024, 2025],
                            series: [
                                { name: "Wind", values: [20, 24, 28, 31, 35] },
                                { name: "Solar", values: [10, 13, 17, 21, 26] },
                                { name: "Gas", values: [45, 40, 35, 30, 25] },
                            ],
                            stacking: "stacked",
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

Each area reaches both sides of the chart, as in Word's and Excel's area charts. When some series are drawn as columns or lines, as in a [combo chart](usage/chart-combo.md), the areas stop at the middle of the first and last categories, so the categories line up with the columns. Areas that aren't stacked can hide each other, so stacking often makes an area chart clearer.

## Stacking

`stacking` adds each series to the ones before it, as Word's "Stacked" and "100% Stacked" charts do:

| `stacking`         | Draws                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `"none"` (default) | Each series at its own values                                                             |
| `"stacked"`        | Each series on top of the ones before it, so the top line is the total                    |
| `"percent"`        | Each series on top of the ones before it, as percentages of the total, so the top is 100% |

On a 100% stacked chart, the value axis is labelled as percentages. See [Chart Axes](usage/chart-axes.md#charts-stacked-to-100).

A line or area chart's series can be drawn as columns too, and against a second value axis. See [Combo Charts](usage/chart-combo.md).

## Options

These are all the options of a line or area chart. Each links to the page that explains it.

| Property             | Type                                                     | Notes    | Description                                                                                                               |
| -------------------- | -------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `type`               | `"line"` \| `"area"`                                     | Required | Lines, or filled areas                                                                                                    |
| `categories`         | `(string \| number \| Date)[]` \| `ChartCategoryGroup[]` | Required | The categories, in order, or [in groups](usage/chart-data.md#categories-in-groups). See [Chart Data](usage/chart-data.md) |
| `series`             | `ChartSeries[]`                                          | Required | `{ name, values, color?, ... }`, with a value or `null` for each category. See [Series](#series)                          |
| `stacking`           | `"none"` \| `"stacked"` \| `"percent"`                   | Optional | See [Stacking](#stacking). Default `"none"`                                                                               |
| `markers`            | `boolean` \| `ChartMarker`                               | Optional | Line charts: a marker at each point. Default `false`. See [Markers](#markers)                                             |
| `smooth`             | `boolean`                                                | Optional | Line charts: curved lines. Default `false`                                                                                |
| `title`              | `string` \| `ChartTitle`                                 | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                                         |
| `legend`             | `false` \| `ChartLegend`                                 | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                                         |
| `categoryAxis`       | `ChartAxis`                                              | Optional | The axis of categories. See [Chart Axes](usage/chart-axes.md)                                                             |
| `valueAxis`          | `ChartValueAxis`                                         | Optional | The axis of values. See [Chart Axes](usage/chart-axes.md)                                                                 |
| `secondaryValueAxis` | `ChartValueAxis`                                         | Optional | A second axis of values, on the right. See [Combo Charts](usage/chart-combo.md#a-secondary-axis)                          |
| `dataLabels`         | `ChartDataLabels`                                        | Optional | See [Chart Data Labels](usage/chart-data-labels.md)                                                                       |
| `emptyValues`        | `"gap"` \| `"zero"` \| `"connect"`                       | Optional | How `null` is drawn. Default `"gap"`. See [Empty Values](#empty-values)                                                   |
| `dataTable`          | `boolean` \| `ChartDataTable`                            | Optional | A table of the data. See [Chart Titles and Legends](usage/chart-titles-and-legends.md#a-data-table)                       |
| `font`               | `ChartFont`                                              | Optional | See [Chart Fonts and Fills](usage/chart-fonts-and-fills.md)                                                               |
| `chartArea`          | `ChartAreaStyle`                                         | Optional | See [Chart Fonts and Fills](usage/chart-fonts-and-fills.md)                                                               |
| `plotArea`           | `ChartAreaStyle`                                         | Optional | See [Chart Fonts and Fills](usage/chart-fonts-and-fills.md)                                                               |
| `transformation`     | `{ width, height }`                                      | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                                           |
| `floating`           | `IFloating`                                              | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                                           |
| `altText`            | `DocPropertiesOptions`                                   | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                                           |
| `decorative`         | `boolean`                                                | Optional | See [Chart Size and Position](usage/chart-size-and-position.md#alternative-text)                                          |

### Series

| Property      | Type                                        | Notes    | Description                                                                                          |
| ------------- | ------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `name`        | `string`                                    | Required | The series' name, shown in the legend                                                                |
| `values`      | `(number \| null)[]`                        | Required | A value for each category, or `null` for a gap                                                       |
| `color`       | `string` \| `ThemeColor`                    | Optional | See [Chart Colours](usage/chart-colors.md)                                                           |
| `markers`     | `boolean` \| `ChartMarker`                  | Optional | The series' own markers. See [Markers](#markers)                                                     |
| `smooth`      | `boolean`                                   | Optional | The series' own curved line                                                                          |
| `line`        | `ChartLine`                                 | Optional | `{ color?, width?, dash? }` of the series' line. See [Lines](#lines)                                 |
| `dataLabels`  | `false` \| `ChartDataLabels`                | Optional | The series' own labels. See [Chart Data Labels](usage/chart-data-labels.md#each-series-labels)       |
| `type`        | `"column"` \| `"line"` \| `"area"`          | Optional | Draws the series another way. See [Combo Charts](usage/chart-combo.md)                               |
| `axis`        | `"primary"` \| `"secondary"`                | Optional | See [Combo Charts](usage/chart-combo.md#a-secondary-axis)                                            |
| `pointLabels` | `(false \| ChartPointLabel \| undefined)[]` | Optional | Labels of single points. See [Chart Data Labels](usage/chart-data-labels.md#labels-of-single-points) |
| `trendlines`  | `ChartTrendline[]`                          | Optional | See [Chart Trendlines and Error Bars](usage/chart-trendlines-and-error-bars.md)                      |
| `errorBars`   | `ChartErrorBars`                            | Optional | See [Chart Trendlines and Error Bars](usage/chart-trendlines-and-error-bars.md#error-bars)           |
