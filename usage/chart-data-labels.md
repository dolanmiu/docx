# Chart Data Labels

Data labels write the numbers on a chart: a label on each bar, point or slice. There are no labels by default.

```ts
new ChartRun({
    type: "column",
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [{ name: "Sales", values: [120, 135, 150, 170] }],
    dataLabels: { value: true },
});
```

This writes each column's value above it.

## What a Label Shows

Turn on what each label shows:

| Option       | Shows                                          | Charts           |
| ------------ | ---------------------------------------------- | ---------------- |
| `value`      | The value                                      | All              |
| `category`   | The category, or a scatter or bubble point's x | All              |
| `seriesName` | The series' name                               | All              |
| `percentage` | The slice's percentage of the whole            | Pie and doughnut |
| `bubbleSize` | The bubble's size                              | Bubble           |

Turn on more than one to show them all in each label:

```ts
dataLabels: { category: true, percentage: true },
```

## Where the Labels Go

By default, the labels go where Office puts them. `position` puts them somewhere else:

```ts
dataLabels: { value: true, position: "insideEnd" },
```

Each type of chart has its own positions, and the first is where Office puts the labels:

| Chart                    | `position`                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Column and bar           | `"outsideEnd"` (just past the end of each bar), `"insideEnd"`, `"center"`, `"insideBase"`                  |
| Column and bar, stacked  | `"center"`, `"insideEnd"`, `"insideBase"`                                                                  |
| Line, scatter and bubble | `"right"`, `"left"`, `"above"`, `"below"`, `"center"`                                                      |
| Pie                      | `"bestFit"` (with a line to a slice a label is moved away from), `"insideEnd"`, `"outsideEnd"`, `"center"` |
| Area, doughnut and radar | None: the application puts them                                                                            |

Word reports a document whose labels are somewhere their chart can't have them as needing repair, so `new ChartRun(...)` throws an error for a position a chart doesn't have. In a [combo chart](usage/chart-combo.md#labels), the chart's `position` is for the series drawn as its `type`, and the others keep Office's positions.

## Number Format

`numberFormat` is how the labels' values are written, as an Excel number format, as for an [axis](usage/chart-axes.md#number-format):

```ts
dataLabels: { value: true, numberFormat: "#,##0" },
```

On a pie or doughnut chart, it is how the percentages are written too: `"0.0%"` writes 12.5%.

## Font

Labels are 9 point text in dark grey. `font` changes it, such as white bold labels inside dark bars:

```ts
dataLabels: { value: true, position: "insideEnd", font: { color: "FFFFFF", bold: true } },
```

See [Chart Fonts and Fills](usage/chart-fonts-and-fills.md).

## Each Series' Labels

A series' own `dataLabels` replace the chart's for that series, and `dataLabels: false` gives it none:

```ts
new ChartRun({
    type: "column",
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [
        { name: "2024", values: [120, 135, 150, 170], dataLabels: false },
        { name: "2025", values: [140, 150, 165, 180] },
    ],
    dataLabels: { value: true },
});
```

Here only the 2025 columns have labels.

## Options

| Property       | Type                     | Notes    | Description                                                           |
| -------------- | ------------------------ | -------- | --------------------------------------------------------------------- |
| `value`        | `boolean`                | Optional | The value. Default `false`                                            |
| `category`     | `boolean`                | Optional | The category, or a scatter or bubble point's x. Default `false`       |
| `seriesName`   | `boolean`                | Optional | The series' name. Default `false`                                     |
| `percentage`   | `boolean`                | Optional | Pie and doughnut charts: the slice's percentage. Default `false`      |
| `bubbleSize`   | `boolean`                | Optional | Bubble charts: the bubble's size. Default `false`                     |
| `position`     | `ChartDataLabelPosition` | Optional | Where the labels go. See [Where the Labels Go](#where-the-labels-go)  |
| `numberFormat` | `string`                 | Optional | An Excel number format, such as `"#,##0"`. Default is the values' own |
| `font`         | `ChartFont`              | Optional | The labels' font. Default 9 points                                    |
