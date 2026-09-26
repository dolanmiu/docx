# Column and Bar Charts

A column chart draws a vertical bar for each value, and a bar chart a horizontal one. Use them to compare values across categories. A bar chart suits long category names, which have room to the left of the bars.

[Charts](usage/charts.md) shows how to import `ChartRun` and add a chart to a document.

## A Column Chart

```ts
new ChartRun({
    type: "column",
    title: "Sales by quarter",
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [
        { name: "2024", values: [120, 135, 150, 170] },
        { name: "2025", values: [140, 150, 165, null] },
    ],
});
```

Each category has a group of columns, one for each series, side by side. The first series is on the left of each group.

## A Bar Chart

A bar chart takes the same options, with `type: "bar"`:

```ts
new ChartRun({
    type: "bar",
    categories: ["Design", "Build", "Test"],
    series: [{ name: "Hours", values: [30, 80, 40] }],
});
```

The categories run up the left side, so the first category is at the bottom, as in Word. The values run along the bottom.

## Stacking

`stacking` puts each group's bars on top of each other, as Word's "Stacked" and "100% Stacked" charts do:

| `stacking`         | Draws                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `"none"` (default) | The bars side by side                                                                        |
| `"stacked"`        | The bars on top of each other, so each stack is as long as the category's total              |
| `"percent"`        | The bars on top of each other, as percentages of the category's total, so each stack is 100% |

```ts
new ChartRun({
    type: "bar",
    title: "Hours by team",
    categories: ["Design", "Build", "Test"],
    series: [
        { name: "Planned", values: [30, 80, 40] },
        { name: "Extra", values: [5, 20, 15] },
    ],
    stacking: "stacked",
});
```

On a 100% stacked chart, the value axis is labelled as percentages. See [Chart Axes](usage/chart-axes.md#charts-stacked-to-100).

## Spacing

`gapWidth` is the space between groups of bars, and `overlap` is how much the bars in a group overlap. Both are percentages of a bar's width.

- `gapWidth` goes from `0` (no space between groups) to `500` (five bars' width). A smaller gap makes the bars wider.
- `overlap` goes from `-100` (a bar's width apart) to `100` (each bar on top of the one before). `0` puts them side by side, touching.

```ts
new ChartRun({
    type: "column",
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [
        { name: "2024", values: [120, 135, 150, 170] },
        { name: "2025", values: [140, 150, 165, 180] },
    ],
    gapWidth: 50,
    overlap: 0,
});
```

The defaults are Office's:

|            | Column chart | Bar chart | Stacked                 |
| ---------- | ------------ | --------- | ----------------------- |
| `gapWidth` | `219`        | `182`     | `150`                   |
| `overlap`  | `-27`        | `0`       | `100`, and can't change |

## Bar Colours

Each series' bars take its colour. `colors` gives single bars colours of their own, in the order of the categories, such as to pick out the best result:

```ts
new ChartRun({
    type: "column",
    title: "Tickets closed",
    categories: ["Ana", "Ben", "Cai", "Dee"],
    series: [{ name: "Tickets", values: [42, 57, 38, 71], colors: [undefined, undefined, undefined, "70AD47"] }],
});
```

A bar without a colour, or with `undefined`, keeps the series' colour. [Chart Colours](usage/chart-colors.md) explains the colours a chart can take.

## Lines on a Column Chart

A column chart's series can be drawn as lines or areas too, such as a target line over the columns, and against a second value axis. See [Combo Charts](usage/chart-combo.md).

## Options

These are all the options of a column or bar chart. Each links to the page that explains it.

| Property             | Type                                   | Notes    | Description                                                                                      |
| -------------------- | -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `type`               | `"column"` \| `"bar"`                  | Required | Vertical or horizontal bars                                                                      |
| `categories`         | `(string \| number \| Date)[]`         | Required | The categories, in order. See [Chart Data](usage/chart-data.md)                                  |
| `series`             | `ChartSeries[]`                        | Required | `{ name, values, color?, ... }`, with a value or `null` for each category. See [Series](#series) |
| `stacking`           | `"none"` \| `"stacked"` \| `"percent"` | Optional | See [Stacking](#stacking). Default `"none"`                                                      |
| `gapWidth`           | `number`                               | Optional | The space between groups of bars, from 0 to 500. See [Spacing](#spacing)                         |
| `overlap`            | `number`                               | Optional | How much the bars in a group overlap, from -100 to 100. See [Spacing](#spacing)                  |
| `title`              | `string` \| `ChartTitle`               | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                |
| `legend`             | `false` \| `ChartLegend`               | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                |
| `categoryAxis`       | `ChartAxis`                            | Optional | The axis of categories. See [Chart Axes](usage/chart-axes.md)                                    |
| `valueAxis`          | `ChartValueAxis`                       | Optional | The axis of values. See [Chart Axes](usage/chart-axes.md)                                        |
| `secondaryValueAxis` | `ChartValueAxis`                       | Optional | A second axis of values. See [Combo Charts](usage/chart-combo.md#a-secondary-axis)               |
| `dataLabels`         | `ChartDataLabels`                      | Optional | See [Chart Data Labels](usage/chart-data-labels.md)                                              |
| `font`               | `ChartFont`                            | Optional | See [Chart Fonts and Fills](usage/chart-fonts-and-fills.md)                                      |
| `chartArea`          | `ChartAreaStyle`                       | Optional | See [Chart Fonts and Fills](usage/chart-fonts-and-fills.md)                                      |
| `plotArea`           | `ChartAreaStyle`                       | Optional | See [Chart Fonts and Fills](usage/chart-fonts-and-fills.md)                                      |
| `transformation`     | `{ width, height }`                    | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                  |
| `floating`           | `IFloating`                            | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                  |
| `altText`            | `DocPropertiesOptions`                 | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                  |
| `decorative`         | `boolean`                              | Optional | See [Chart Size and Position](usage/chart-size-and-position.md#alternative-text)                 |

### Series

| Property     | Type                                    | Notes    | Description                                                                                    |
| ------------ | --------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `name`       | `string`                                | Required | The series' name, shown in the legend                                                          |
| `values`     | `(number \| null)[]`                    | Required | A value for each category, or `null` for a gap                                                 |
| `color`      | `string` \| `ThemeColor`                | Optional | See [Chart Colours](usage/chart-colors.md)                                                     |
| `colors`     | `(string \| ThemeColor \| undefined)[]` | Optional | A colour for each bar. See [Bar Colours](#bar-colours)                                         |
| `dataLabels` | `false` \| `ChartDataLabels`            | Optional | The series' own labels. See [Chart Data Labels](usage/chart-data-labels.md#each-series-labels) |
| `type`       | `"column"` \| `"line"` \| `"area"`      | Optional | Column charts: draws the series another way. See [Combo Charts](usage/chart-combo.md)          |
| `axis`       | `"primary"` \| `"secondary"`            | Optional | See [Combo Charts](usage/chart-combo.md#a-secondary-axis)                                      |
