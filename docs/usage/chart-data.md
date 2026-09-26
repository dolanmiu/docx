# Chart Data

A chart's data is its categories and its series, or for a scatter chart, its points. This page shows how to give it, and how it is saved in the document.

## Categories and Series

Column, bar, line, area, pie and doughnut charts take their data as a table: a row for each category, and a column for each series.

```ts
new ChartRun({
    type: "column",
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [
        { name: "2024", values: [120, 135, 150, 170] },
        { name: "2025", values: [140, 150, 165, null] },
    ],
});
```

is this table:

|        | 2024 | 2025 |
| ------ | ---- | ---- |
| **Q1** | 120  | 140  |
| **Q2** | 135  | 150  |
| **Q3** | 150  | 165  |
| **Q4** | 170  |      |

- `categories` are the labels along the category axis, or the slices of a pie. They are text, or numbers such as years.
- Each series has a `name`, which the legend shows, and `values`: one value for each category, in the same order.
- `null` is an empty cell, which leaves a gap: no bar, a break in a line, or no slice.
- A series can have fewer values than there are categories. The categories after its last value are gaps.

Each series can also have a `color`. See [Chart Colours](usage/chart-colors.md).

## Points

A [scatter chart](usage/chart-scatter.md) has no categories. Each of its series has `points`, and each point has its own `x` and `y`:

```ts
series: [
    {
        name: "Group A",
        points: [
            { x: 150, y: 50 },
            { x: 165, y: 61 },
        ],
    },
],
```

## Editing the Data in Word

Each chart's data is saved twice: in the chart, which Word draws it from, and in an Excel workbook inside the document. **Edit Data** in Word opens the workbook in Excel, and Word redraws the chart when the data changes.

The workbook has one sheet, laid out as Word lays out a new chart's data:

- For a chart with categories, the sheet is the table above: the series' names in row 1 from column B, the categories in column A from row 2, and each series' values below its name.
- For a scatter chart, each series has two columns: `X` above its x values, and its name above its y values.

## Mistakes

`new ChartRun(...)` throws an error when an option is wrong, so the mistake shows up where the chart is made. It throws when:

- a chart has no series, or no categories;
- a category isn't text or a finite number;
- a value isn't a finite number or `null`;
- a series has more values than there are categories;
- a pie chart has more than one series;
- a pie or doughnut chart has a negative value, or a series more `colors` than there are categories;
- a scatter series has no points, or a point's `x` or `y` isn't a finite number;
- an option is outside its range, such as `gapWidth: 600`, or a value axis' `minimum` isn't less than its `maximum`;
- the chart's width or height isn't a positive number.

The error says what is wrong, such as `Series "2025" has 5 values, but there are 4 categories`.
