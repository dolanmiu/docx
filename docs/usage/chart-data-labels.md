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

| Option       | Shows                                | Charts           |
| ------------ | ------------------------------------ | ---------------- |
| `value`      | The value                            | All              |
| `category`   | The category, or a scatter point's x | All              |
| `seriesName` | The series' name                     | All              |
| `percentage` | The slice's percentage of the whole  | Pie and doughnut |

Turn on more than one to show them all in each label:

```ts
dataLabels: { category: true, percentage: true },
```

## Where the Labels Go

The labels go where Office puts them:

| Chart            | Labels                                                              |
| ---------------- | ------------------------------------------------------------------- |
| Column and bar   | Just past the end of each bar, or in its middle when stacked        |
| Line and scatter | To the right of each point                                          |
| Area             | Where the application puts them                                     |
| Pie              | Where they fit best, with a line to a slice they're moved away from |
| Doughnut         | On each slice of each ring                                          |

## Options

| Property     | Type      | Notes    | Description                                                      |
| ------------ | --------- | -------- | ---------------------------------------------------------------- |
| `value`      | `boolean` | Optional | The value. Default `false`                                       |
| `category`   | `boolean` | Optional | The category, or a scatter point's x. Default `false`            |
| `seriesName` | `boolean` | Optional | The series' name. Default `false`                                |
| `percentage` | `boolean` | Optional | Pie and doughnut charts: the slice's percentage. Default `false` |
