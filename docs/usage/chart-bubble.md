# Bubble Charts

A bubble chart is a scatter chart whose points are bubbles of different sizes, so it shows three numbers for each point: where it is across, where it is up, and how big it is.

[Charts](usage/charts.md) shows how to import `ChartRun` and add a chart to a document.

## A Bubble Chart

```ts
new ChartRun({
    type: "bubble",
    title: "Markets",
    series: [
        {
            name: "Europe",
            points: [
                { x: 12, y: 4.5, size: 740 },
                { x: 18, y: 3.1, size: 330 },
            ],
        },
        { name: "Asia", points: [{ x: 24, y: 6.8, size: 1400 }] },
    ],
    xAxis: { title: "Market share (%)" },
    yAxis: { title: "Growth (%)" },
});
```

- Like a [scatter chart](usage/chart-scatter.md), a bubble chart has no categories. Each series has `points`, and each point has an `x`, a `y` and a `size`.
- Sizes are compared with each other: the biggest bubble is drawn at Office's largest size, and the others in proportion. They can't be negative.
- Bubbles are drawn in their series' colour, a quarter see-through, so bubbles behind them show.

## Bubble Sizes

- `bubbleScale` makes every bubble bigger or smaller, as a percentage of Office's size, from `0` to `300`. The default is `100`.
- `sizeRepresents` says whether a point's `size` is the bubble's area (`"area"`, the default) or its width (`"width"`). By area, a bubble of size 4 looks twice as wide as one of size 1; by width, four times as wide.

```ts
bubbleScale: 60,
sizeRepresents: "width",
```

## Labels

A bubble's label can show its size, as well as what any label shows:

```ts
dataLabels: { bubbleSize: true },
```

See [Chart Data Labels](usage/chart-data-labels.md).

## Options

| Property         | Type                     | Notes    | Description                                                                                                 |
| ---------------- | ------------------------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| `type`           | `"bubble"`               | Required |                                                                                                             |
| `series`         | `BubbleChartSeries[]`    | Required | `{ name, points, color?, dataLabels? }`, where a point is `{ x, y, size }`                                  |
| `bubbleScale`    | `number`                 | Optional | The bubbles' size, as a percentage of Office's, from 0 to 300. Default `100`                                |
| `sizeRepresents` | `"area"` \| `"width"`    | Optional | Whether a size is a bubble's area or width. Default `"area"`                                                |
| `xAxis`          | `ChartValueAxis`         | Optional | The horizontal axis. See [Chart Axes](usage/chart-axes.md)                                                  |
| `yAxis`          | `ChartValueAxis`         | Optional | The vertical axis. See [Chart Axes](usage/chart-axes.md)                                                    |
| `dataLabels`     | `BubbleChartDataLabels`  | Optional | `{ value?, category?, seriesName?, bubbleSize?, ... }`. See [Chart Data Labels](usage/chart-data-labels.md) |
| `title`          | `string` \| `ChartTitle` | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                           |
| `legend`         | `false` \| `ChartLegend` | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                           |
| `transformation` | `{ width, height }`      | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                             |
| `floating`       | `IFloating`              | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                             |
| `altText`        | `DocPropertiesOptions`   | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                             |

[Chart Fonts and Fills](usage/chart-fonts-and-fills.md) shows the options every chart has for its text, background and border.
