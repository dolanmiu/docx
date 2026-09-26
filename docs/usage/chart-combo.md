# Combo Charts

A combo chart draws some series one way and some another, such as sales as columns and a target as a line. A series can also be drawn against a second value axis, on the right, when its numbers are on another scale, such as a percentage beside a number of units. Word calls these charts "Combo" charts.

[Charts](usage/charts.md) shows how to import `ChartRun` and add a chart to a document.

## Columns and a Line

Give a series a `type` to draw it as `"column"`, `"line"` or `"area"`, whatever the chart's own `type`:

```ts
new ChartRun({
    type: "column",
    title: "Sales and target",
    categories: ["Jan", "Feb", "Mar", "Apr"],
    series: [
        { name: "Sales", values: [120, 135, 150, 170] },
        { name: "Target", values: [130, 140, 150, 160], type: "line" },
    ],
});
```

- Series without a `type` are drawn as the chart's `type`.
- Areas are drawn behind columns, and lines in front of both, whatever the order of the series. Series on the secondary axis are drawn in front of those on the primary axis.
- Column, line and area charts can have series of each type. A bar chart's series are all bars, as its bars run the other way.

The options of each way of drawing a series work as they do on its own chart. A line series takes `markers`, `smooth` and `line`, as on a [line chart](usage/chart-line-and-area.md), and a column series takes `colors`, as on a [column chart](usage/chart-column-and-bar.md#bar-colours). The chart's `gapWidth` and `overlap` are for its columns when its `type` is `"column"`, and its `markers` and `smooth` are for its lines when its `type` is `"line"`.

## A Secondary Axis

`axis: "secondary"` draws a series against a second value axis, on the right side of the chart:

```ts
new ChartRun({
    type: "column",
    title: "Sales and growth",
    categories: ["Jan", "Feb", "Mar", "Apr"],
    series: [
        { name: "Sales", values: [120, 135, 150, 170] },
        { name: "Growth", values: [4, 12.5, 11.1, 13.3], type: "line", axis: "secondary" },
    ],
    valueAxis: { title: "Units" },
    secondaryValueAxis: { title: "Growth (%)" },
});
```

- `secondaryValueAxis` takes the same options as `valueAxis`, such as a title, a range and a number format. See [Chart Axes](usage/chart-axes.md).
- The secondary axis has no gridlines by default, so they don't cross the primary axis' gridlines.
- At least one series has to be on the primary axis.
- A bar chart's secondary axis runs along the top.
- The secondary axis stays on the other side from the primary one when the categories are in [reverse order](usage/chart-axes.md#reverse-order).

A series drawn as columns on the secondary axis is drawn in front of those on the primary axis, in the same place, so the columns cover each other. Draw series on the secondary axis as lines, as in the example above.

## Labels

A chart's `dataLabels` are on every series, but their `position` is for the series drawn as the chart's `type`, as each way of drawing a series has positions of its own. The others keep Office's positions, unless their own `dataLabels` give one:

```ts
dataLabels: { value: true, position: "insideEnd" },
series: [
    { name: "Sales", values: [120, 135, 150, 170] },
    { name: "Target", values: [130, 140, 150, 160], type: "line", dataLabels: { value: true, position: "above" } },
],
```

See [Where the Labels Go](usage/chart-data-labels.md#where-the-labels-go).

## Stacking

`stacking` stacks the series drawn as the chart's `type`. The others aren't stacked, so a line can show the total of stacked columns:

```ts
new ChartRun({
    type: "column",
    categories: ["Q1", "Q2", "Q3"],
    series: [
        { name: "North", values: [40, 45, 50] },
        { name: "South", values: [30, 35, 30] },
        { name: "Total", values: [70, 80, 80], type: "line" },
    ],
    stacking: "stacked",
});
```

## Options

| Property             | Type                                   | Notes    | Description                                                                   |
| -------------------- | -------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| `series[].type`      | `"column"` \| `"line"` \| `"area"`     | Optional | How the series is drawn. Default is the chart's `type`. Not on bar charts     |
| `series[].axis`      | `"primary"` \| `"secondary"`           | Optional | The value axis the series is drawn against. Default `"primary"`               |
| `secondaryValueAxis` | `ChartValueAxis`                       | Optional | The secondary value axis, on the right. See [Chart Axes](usage/chart-axes.md) |
| `stacking`           | `"none"` \| `"stacked"` \| `"percent"` | Optional | Stacks the series drawn as the chart's `type`. Default `"none"`               |
