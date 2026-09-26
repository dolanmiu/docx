# Pie and Doughnut Charts

A pie chart shows the parts of one whole as slices of a circle. A doughnut chart shows the parts of several wholes as rings, one inside the other, so they can be compared.

[Charts](usage/charts.md) shows how to import `ChartRun` and add a chart to a document.

## A Pie Chart

```ts
new ChartRun({
    type: "pie",
    title: "Market share",
    categories: ["North", "South", "East", "West"],
    series: [{ name: "Share", values: [40, 25, 20, 15] }],
});
```

- Each category is a slice, and the legend shows the categories.
- A pie chart has one series. Its values are the slices' sizes, in the order of the categories.
- Values can't be negative. `null` leaves a slice out.

The values don't need to add up to 100: each slice is its value's share of the total.

## A Doughnut Chart

A doughnut chart has a ring for each series. The first series is the inside ring.

```ts
new ChartRun({
    type: "doughnut",
    title: "Budget and spend",
    categories: ["Staff", "Rent", "Other"],
    series: [
        { name: "Budget", values: [60, 25, 15] },
        { name: "Spend", values: [65, 25, 10] },
    ],
    holeSize: 40,
});
```

`holeSize` is the size of the hole, as a percentage of the doughnut's width, from `10` to `90`. The default is `50`.

## Slice Colours

Each slice takes the next of the theme's accent colours. `colors` gives the slices colours of their own, in the order of the categories:

```ts
series: [{ name: "Share", values: [40, 25, 20, 15], colors: ["1F4E79", "2E75B6", "9DC3E6", "BDD7EE"] }],
```

A slice without a colour, or with `undefined`, keeps the theme's colour. A category has the same colour in each ring of a doughnut, so give each ring the same `colors`. [Chart Colours](usage/chart-colors.md) explains the colours a chart can take.

## Percentages on the Slices

`dataLabels` puts a label on each slice. On a pie or doughnut chart, a label can show the slice's percentage of the whole:

```ts
dataLabels: { percentage: true },
```

[Chart Data Labels](usage/chart-data-labels.md) shows what else a label can show.

## The First Slice

The first slice starts at 12 o'clock, and the slices go clockwise. `firstSliceAngle` turns the chart, so the first slice starts that many degrees clockwise from 12 o'clock, from `0` to `360`. `firstSliceAngle: 90` starts it at 3 o'clock.

## Options

These are all the options of a pie or doughnut chart. Each links to the page that explains it.

| Property          | Type                     | Notes    | Description                                                                                            |
| ----------------- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------ |
| `type`            | `"pie"` \| `"doughnut"`  | Required | A pie, or rings                                                                                        |
| `categories`      | `(string \| number)[]`   | Required | The slices, in order. See [Chart Data](usage/chart-data.md)                                            |
| `series`          | `PieChartSeries[]`       | Required | `{ name, values, colors? }`. A pie chart has one, and a doughnut chart a ring for each                 |
| `holeSize`        | `number`                 | Optional | Doughnut charts: the hole, as a percentage of the doughnut's width, from 10 to 90. Default `50`        |
| `firstSliceAngle` | `number`                 | Optional | Degrees clockwise from 12 o'clock, from 0 to 360. Default `0`                                          |
| `dataLabels`      | `PieChartDataLabels`     | Optional | `{ value?, category?, seriesName?, percentage? }`. See [Chart Data Labels](usage/chart-data-labels.md) |
| `title`           | `string`                 | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                      |
| `legend`          | `false` \| `ChartLegend` | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                      |
| `transformation`  | `{ width, height }`      | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                        |
| `floating`        | `IFloating`              | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                        |
| `altText`         | `DocPropertiesOptions`   | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                        |

Pie and doughnut charts have no axes.
