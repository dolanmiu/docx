# Chart Data Labels

Data labels write the numbers on a chart: a label on each bar, point or slice. There are no labels by default.

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
                            series: [{ name: "Sales", values: [120, 135, 150, 170] }],
                            dataLabels: { value: true },
                        }),
                    ],
                }),
            ],
        },
    ],
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
                            type: "pie",
                            categories: ["North", "South", "East", "West"],
                            series: [{ name: "Share", values: [40, 25, 20, 15] }],
                            dataLabels: { category: true, percentage: true },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

## Where the Labels Go

By default, the labels go where Office puts them. `position` puts them somewhere else:

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
                            series: [{ name: "Sales", values: [120, 135, 150, 170] }],
                            dataLabels: { value: true, position: "insideEnd" },
                        }),
                    ],
                }),
            ],
        },
    ],
});
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
                            series: [{ name: "Sales", values: [12000, 13500, 15000, 17000] }],
                            dataLabels: { value: true, numberFormat: "#,##0" },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

On a pie or doughnut chart, it is how the percentages are written too: `"0.0%"` writes 12.5%.

## Font

Labels are 9 point text in dark grey. `font` changes it, such as white bold labels inside dark bars:

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
                            series: [{ name: "Sales", values: [120, 135, 150, 170] }],
                            dataLabels: { value: true, position: "insideEnd", font: { color: "FFFFFF", bold: true } },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

See [Chart Fonts and Fills](usage/chart-fonts-and-fills.md).

## Each Series' Labels

A series' own `dataLabels` replace the chart's for that series, and `dataLabels: false` gives it none:

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
                                { name: "2024", values: [120, 135, 150, 170], dataLabels: false },
                                { name: "2025", values: [140, 150, 165, 180] },
                            ],
                            dataLabels: { value: true },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

Here only the 2025 columns have labels.

## Labels of Single Points

A series' `pointLabels` give single bars, points or slices labels of their own, such as to mark the highest point, in the order of the categories, or of a scatter or bubble chart's points:

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
                            type: "line",
                            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                            series: [
                                {
                                    name: "Visitors",
                                    values: [320, 410, 380, 380, 460, 610, 580],
                                    pointLabels: [
                                        undefined,
                                        undefined,
                                        undefined,
                                        undefined,
                                        undefined,
                                        { text: "Record", position: "above" },
                                    ],
                                },
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

Each point's label is one of:

- `undefined`: the series' own labels, if it has any;
- `false`: no label, even when the series has labels;
- a label's options: what it shows, or `text` of its own, over the series' labels.

A point's label has the options of the series' labels, and each it leaves out is the series' label's:

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
                                {
                                    name: "Sales",
                                    values: [120, 135, 150, 170],
                                    // Only the last column has a label, with its value
                                    pointLabels: [undefined, undefined, undefined, { value: true }],
                                },
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ChartRun({
                            type: "column",
                            categories: ["Q1", "Q2", "Q3", "Q4"],
                            // Every column shows its value, and the first shows it inside, in bold
                            dataLabels: { value: true },
                            series: [
                                {
                                    name: "Sales",
                                    values: [120, 135, 150, 170],
                                    pointLabels: [{ position: "insideEnd", font: { bold: true } }],
                                },
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

`text` replaces what the label shows with text of its own, a line of the label for each line of the text. A label with text shows nothing else, so it has no `value`, `category`, `seriesName`, `percentage`, `bubbleSize` or `numberFormat`.

A series can't have more point labels than it has points. Pages doesn't show a label's own text. See [Chart Compatibility](usage/chart-compatibility.md).

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

A point's label, in `pointLabels`, has these options too, and `text`:

| Property | Type     | Notes    | Description                                               |
| -------- | -------- | -------- | --------------------------------------------------------- |
| `text`   | `string` | Optional | Text of its own, shown in place of anything else it shows |
