# Chart Titles and Legends

A chart's title says what it shows, and its legend says which colour is which series.

## Title

`title` is written above the chart. There is no title by default.

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            title: "Sales by quarter",
                            categories: ["Q1", "Q2", "Q3", "Q4"],
                            series: [{ name: "Sales", values: [120, 135, 150, 170] }],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

Each line of the text is a line of the title, so `"Sales by quarter\n2024"` is a title of two lines.

To give the title a font of its own, give `title` its `text` and a `font`:

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            title: { text: "Sales by quarter", font: { size: 18, bold: true, color: "1F4E79" } },
                            categories: ["Q1", "Q2", "Q3", "Q4"],
                            series: [{ name: "Sales", values: [120, 135, 150, 170] }],
                        }),
                    ],
                }),
            ],
        },
    ],
});
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

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            categories: ["Q1", "Q2", "Q3", "Q4"],
                            series: [
                                { name: "2024", values: [120, 135, 150, 170] },
                                { name: "2025", values: [140, 150, 165, 180] },
                            ],
                            legend: { position: "right" },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

The legend takes a `font` too, such as `legend: { position: "right", font: { size: 10 } }`. Its text is 9 point by default.

`legend: false` leaves out the legend. A chart with one series often doesn't need one, as its title can say what the series is:

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            title: "Orders",
                            categories: ["Mon", "Tue", "Wed"],
                            series: [{ name: "Orders", values: [8, 12, 9] }],
                            legend: false,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### Hiding Legend Entries

`hiddenEntries` leaves entries out of the legend, by their text, such as a target line everyone knows:

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            categories: ["Q1", "Q2", "Q3", "Q4"],
                            series: [
                                { name: "Sales", values: [120, 135, 150, 170] },
                                { name: "Target", values: [140, 140, 140, 140], type: "line" },
                            ],
                            legend: { hiddenEntries: ["Target"] },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

An entry is a series' name, a [trendline's](usage/chart-trendlines-and-error-bars.md) name, such as "Linear (Sales)", or on a pie or doughnut chart, a category. The series stays in the chart. `new ChartRun(...)` throws for text that isn't an entry's, and lists the entries.

Pages shows every entry. See [Chart Compatibility](usage/chart-compatibility.md).

## A Data Table

`dataTable: true` puts a table of the chart's data under its plot, as Word's "Data Table" does: a row for each series, with its key from the legend, and a column for each category. It is often used in place of labels, or of the legend:

```ts live
import { Document, Paragraph } from "docx";
import { ChartRun } from "docx/charts";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            title: "Rainfall (mm)",
                            categories: ["Jan", "Feb", "Mar"],
                            series: [
                                { name: "2024", values: [78, 52, 61] },
                                { name: "2025", values: [83, 60, 49] },
                            ],
                            dataTable: true,
                            legend: false,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

`dataTable` takes options too:

| Option              | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `legendKeys`        | `false` leaves out each series' key              |
| `horizontalBorders` | `false` leaves out the lines between the rows    |
| `verticalBorders`   | `false` leaves out the lines between the columns |
| `outline`           | `false` leaves out the line around the table     |
| `font`              | The table's font. Its text is 9 point by default |

Column, bar, line, area and stock charts have a data table. Pages doesn't draw it. See [Chart Compatibility](usage/chart-compatibility.md).

## Options

| Property    | Type                          | Notes    | Description                                                                                           |
| ----------- | ----------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `title`     | `string` \| `ChartTitle`      | Optional | The title, above the chart, or `{ text, font? }`. Each line is a line of the title                    |
| `legend`    | `false` \| `ChartLegend`      | Optional | `{ position?, font?, hiddenEntries? }`, or `false` for no legend. Default is a legend below the chart |
| `dataTable` | `boolean` \| `ChartDataTable` | Optional | `{ legendKeys?, horizontalBorders?, verticalBorders?, outline?, font? }`, or `true`. Default is none  |
