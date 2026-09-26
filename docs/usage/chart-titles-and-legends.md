# Chart Titles and Legends

A chart's title says what it shows, and its legend says which colour is which series.

## Title

`title` is written above the chart. There is no title by default.

```ts
new ChartRun({
    type: "column",
    title: "Sales by quarter",
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [{ name: "Sales", values: [120, 135, 150, 170] }],
});
```

Each line of the text is a line of the title, so `"Sales by quarter\n2024"` is a title of two lines.

To give the title a font of its own, give `title` its `text` and a `font`:

```ts
title: { text: "Sales by quarter", font: { size: 18, bold: true, color: "1F4E79" } },
```

The title is 14 point text by default. See [Chart Fonts and Fills](usage/chart-fonts-and-fills.md).

## Legend

The legend is below the chart by default. It shows each series' name, or on a pie or doughnut chart, each category's.

`legend` moves it, with a `position`:

| `position`           | Where the legend is              |
| -------------------- | -------------------------------- |
| `"bottom"` (default) | Below the chart                  |
| `"top"`              | Above the chart, below its title |
| `"left"`             | To the left of the chart         |
| `"right"`            | To the right of the chart        |
| `"topRight"`         | In the top right corner          |

```ts
legend: { position: "right" },
```

The legend takes a `font` too, such as `legend: { position: "right", font: { size: 10 } }`. Its text is 9 point by default.

`legend: false` leaves out the legend. A chart with one series often doesn't need one, as its title can say what the series is:

```ts
new ChartRun({
    type: "column",
    title: "Orders",
    categories: ["Mon", "Tue", "Wed"],
    series: [{ name: "Orders", values: [8, 12, 9] }],
    legend: false,
});
```

## Options

| Property | Type                     | Notes    | Description                                                                           |
| -------- | ------------------------ | -------- | ------------------------------------------------------------------------------------- |
| `title`  | `string` \| `ChartTitle` | Optional | The title, above the chart, or `{ text, font? }`. Each line is a line of the title    |
| `legend` | `false` \| `ChartLegend` | Optional | `{ position?, font? }`, or `false` for no legend. Default is a legend below the chart |
