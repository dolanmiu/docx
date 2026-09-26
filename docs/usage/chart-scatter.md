# Scatter Charts

A scatter chart plots points, each with its own x and y. Use it to show how two numbers relate, such as people's heights and weights.

[Charts](usage/charts.md) shows how to import `ChartRun` and add a chart to a document.

## A Scatter Chart

```ts
new ChartRun({
    type: "scatter",
    title: "Height and weight",
    series: [
        {
            name: "Group A",
            points: [
                { x: 150, y: 50 },
                { x: 165, y: 61 },
                { x: 180, y: 75 },
            ],
        },
        {
            name: "Group B",
            points: [
                { x: 155, y: 58 },
                { x: 170, y: 72 },
            ],
        },
    ],
    xAxis: { title: "Height (cm)" },
    yAxis: { title: "Weight (kg)" },
});
```

A scatter chart has no categories. Instead, each series has its own `points`, and each point is an `{ x, y }` pair. Series can have different numbers of points.

## Markers and Lines

A scatter chart draws a circle at each point, and doesn't join them:

- `markers: false` leaves out the circles.
- `lines` joins each series' points, in order: `"none"` (the default), `"straight"` or `"smooth"`.

A smooth line without markers draws a curve, such as a graph of a formula:

```ts
new ChartRun({
    type: "scatter",
    series: [{ name: "y = x²", points: [-2, -1, 0, 1, 2].map((x) => ({ x, y: x * x })) }],
    markers: false,
    lines: "smooth",
});
```

## Axes

A scatter chart has two value axes: `xAxis` along the bottom and `yAxis` up the left side. Each takes a title, a range and a number format, as a value axis does. See [Chart Axes](usage/chart-axes.md).

## Options

These are all the options of a scatter chart. Each links to the page that explains it.

| Property         | Type                                   | Notes    | Description                                                                                    |
| ---------------- | -------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `type`           | `"scatter"`                            | Required |                                                                                                |
| `series`         | `ScatterChartSeries[]`                 | Required | `{ name, points, color? }`, where a point is `{ x, y }`. See [Chart Data](usage/chart-data.md) |
| `markers`        | `boolean`                              | Optional | A circle at each point. Default `true`                                                         |
| `lines`          | `"none"` \| `"straight"` \| `"smooth"` | Optional | How the points are joined. Default `"none"`                                                    |
| `xAxis`          | `ChartValueAxis`                       | Optional | The horizontal axis. See [Chart Axes](usage/chart-axes.md)                                     |
| `yAxis`          | `ChartValueAxis`                       | Optional | The vertical axis. See [Chart Axes](usage/chart-axes.md)                                       |
| `dataLabels`     | `ChartDataLabels`                      | Optional | See [Chart Data Labels](usage/chart-data-labels.md)                                            |
| `title`          | `string`                               | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                              |
| `legend`         | `false` \| `ChartLegend`               | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                              |
| `transformation` | `{ width, height }`                    | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                |
| `floating`       | `IFloating`                            | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                |
| `altText`        | `DocPropertiesOptions`                 | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                |
