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

| Property | Type                     | Notes    | Description                                                                    |
| -------- | ------------------------ | -------- | ------------------------------------------------------------------------------ |
| `title`  | `string`                 | Optional | The title, above the chart. Each line is a line of the title. Default none     |
| `legend` | `false` \| `ChartLegend` | Optional | `{ position? }`, or `false` for no legend. Default is a legend below the chart |
