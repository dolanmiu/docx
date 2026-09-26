# Line and Area Charts

A line chart draws a line through each series' values, and an area chart fills the space below each line. Use them to show a trend, such as a value over days, months or years. The categories are the points along the bottom.

[Charts](usage/charts.md) shows how to import `ChartRun` and add a chart to a document.

## A Line Chart

```ts
new ChartRun({
    type: "line",
    title: "Temperature",
    categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    series: [
        { name: "High", values: [21, 23, 25, 24, 22] },
        { name: "Low", values: [12, 13, 15, 14, 13] },
    ],
});
```

A `null` value leaves a gap in its line.

## Markers and Smooth Lines

A line chart can mark each point, and draw its lines as curves:

- `markers: true` draws a circle at each point, as Word's "Line with Markers" does.
- `smooth: true` draws each line as a smooth curve through its points.

Both are `false` by default.

```ts
new ChartRun({
    type: "line",
    categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    series: [{ name: "High", values: [21, 23, 25, 24, 22] }],
    markers: true,
    smooth: true,
});
```

## An Area Chart

An area chart takes the same options as a line chart, with `type: "area"` and without `markers` and `smooth`:

```ts
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
});
```

Each area reaches both sides of the chart, as in Word's and Excel's area charts. Areas that aren't stacked can hide each other, so stacking often makes an area chart clearer.

## Stacking

`stacking` adds each series to the ones before it, as Word's "Stacked" and "100% Stacked" charts do:

| `stacking`         | Draws                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `"none"` (default) | Each series at its own values                                                             |
| `"stacked"`        | Each series on top of the ones before it, so the top line is the total                    |
| `"percent"`        | Each series on top of the ones before it, as percentages of the total, so the top is 100% |

On a 100% stacked chart, the value axis is labelled as percentages. See [Chart Axes](usage/chart-axes.md#charts-stacked-to-100).

## Options

These are all the options of a line or area chart. Each links to the page that explains it.

| Property         | Type                                   | Notes    | Description                                                                                                 |
| ---------------- | -------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `type`           | `"line"` \| `"area"`                   | Required | Lines, or filled areas                                                                                      |
| `categories`     | `(string \| number)[]`                 | Required | The categories, in order. See [Chart Data](usage/chart-data.md)                                             |
| `series`         | `ChartSeries[]`                        | Required | `{ name, values, color? }`, with a value or `null` for each category. See [Chart Data](usage/chart-data.md) |
| `stacking`       | `"none"` \| `"stacked"` \| `"percent"` | Optional | See [Stacking](#stacking). Default `"none"`                                                                 |
| `markers`        | `boolean`                              | Optional | Line charts: a circle at each point. Default `false`                                                        |
| `smooth`         | `boolean`                              | Optional | Line charts: curved lines. Default `false`                                                                  |
| `title`          | `string`                               | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                           |
| `legend`         | `false` \| `ChartLegend`               | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                           |
| `categoryAxis`   | `ChartAxis`                            | Optional | The axis of categories. See [Chart Axes](usage/chart-axes.md)                                               |
| `valueAxis`      | `ChartValueAxis`                       | Optional | The axis of values. See [Chart Axes](usage/chart-axes.md)                                                   |
| `dataLabels`     | `ChartDataLabels`                      | Optional | See [Chart Data Labels](usage/chart-data-labels.md)                                                         |
| `transformation` | `{ width, height }`                    | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                             |
| `floating`       | `IFloating`                            | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                             |
| `altText`        | `DocPropertiesOptions`                 | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                             |
