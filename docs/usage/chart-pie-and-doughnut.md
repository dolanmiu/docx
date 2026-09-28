# Pie and Doughnut Charts

A pie chart shows the parts of one whole as slices of a circle. A doughnut chart shows the parts of several wholes as rings, one inside the other, so they can be compared. A pie of pie or bar of pie chart takes the smallest slices out of a pie, and draws them again beside it, so they can be read.

[Charts](usage/charts.md) shows how to import `ChartRun` and add a chart to a document.

## A Pie Chart

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
                            title: "Market share",
                            categories: ["North", "South", "East", "West"],
                            series: [{ name: "Share", values: [40, 25, 20, 15] }],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

- Each category is a slice, and the legend shows the categories.
- A pie chart has one series. Its values are the slices' sizes, in the order of the categories.
- Values can't be negative. `null` leaves a slice out.

The values don't need to add up to 100: each slice is its value's share of the total.

## A Doughnut Chart

A doughnut chart has a ring for each series. The first series is the inside ring.

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
                            type: "doughnut",
                            title: "Budget and spend",
                            categories: ["Staff", "Rent", "Other"],
                            series: [
                                { name: "Budget", values: [60, 25, 15] },
                                { name: "Spend", values: [65, 25, 10] },
                            ],
                            holeSize: 40,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

`holeSize` is the size of the hole, as a percentage of the doughnut's width, from `10` to `90`. The default is `50`.

## Slice Colours

Each slice takes the next of the theme's accent colours. `colors` gives the slices colours of their own, in the order of the categories:

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
                            series: [{ name: "Share", values: [40, 25, 20, 15], colors: ["1F4E79", "2E75B6", "9DC3E6", "BDD7EE"] }],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

A slice without a colour, or with `undefined`, keeps the theme's colour. A category has the same colour in each ring of a doughnut, so give each ring the same `colors`. [Chart Colours](usage/chart-colors.md) explains the colours a chart can take.

## Percentages on the Slices

`dataLabels` puts a label on each slice. On a pie or doughnut chart, a label can show the slice's percentage of the whole:

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
                            dataLabels: { percentage: true },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

[Chart Data Labels](usage/chart-data-labels.md) shows what else a label can show, and where labels can go. Each ring of a doughnut can have labels of its own, with its series' own `dataLabels`.

## Pulling Out Slices

`explosion` pulls slices out from the centre, as Word's "Pie Explosion" and "Point Explosion" do, by a percentage of the radius, from `0` to `400`. One number pulls out every slice:

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
                            series: [{ name: "Share", values: [40, 25, 20, 15], explosion: 10 }],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

A list pulls out each slice by its own amount, in the order of the categories. `undefined` leaves a slice in, so this pulls out only the last:

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
                            series: [{ name: "Share", values: [40, 25, 20, 15], explosion: [undefined, undefined, undefined, 25] }],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

A slice pulled out on its own is often labelled on its own too. See [Labels of Single Points](usage/chart-data-labels.md#labels-of-single-points).

## The First Slice

The first slice starts at 12 o'clock, and the slices go clockwise. `firstSliceAngle` turns the chart, so the first slice starts that many degrees clockwise from 12 o'clock, from `0` to `360`. `firstSliceAngle: 90` starts it at 3 o'clock.

## Pie of Pie and Bar of Pie

A pie of pie chart takes some slices out of the pie, and draws them as a second, smaller pie beside it. The pie has one slice in their place, joined to the second pie by lines. A bar of pie chart draws them as a stacked bar instead. They are Word's "Pie of Pie" and "Bar of Pie" charts:

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
                            type: "pieOfPie",
                            title: "Spending",
                            categories: ["Rent", "Food", "Travel", "Books", "Games", "Music"],
                            series: [{ name: "Spending", values: [1200, 450, 180, 60, 45, 30] }],
                            split: { by: "position", count: 3 },
                            dataLabels: { percentage: true },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

`split` picks the slices that go to the second plot:

| `split`                                        | Picks                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `{ by: "position", count: 3 }`                 | The last 3 categories                                             |
| `{ by: "value", lessThan: 100 }`               | The slices whose values are less than 100                         |
| `{ by: "percentage", lessThan: 5 }`            | The slices less than 5% of the whole                              |
| `{ by: "categories", categories: ["A", "B"] }` | The slices of the categories named, wherever they are in the list |

Without `split`, the last third of the categories go to the second plot, rounded up: 2 of 6, or 3 of 7. Put the categories in order of size, largest first, to split off the smallest by position. The split is written even when it is the default, so every application splits the pie the same way.

`secondPlotSize` is the second plot's size, as a percentage of the pie's, from `5` to `200`, and is `75` unless given. `gapWidth` is the gap between them, as a percentage of the second plot's width, from `0` to `500`, and is `100` unless given. `seriesLines` is the colour, width and dashes of the lines joining them.

A pie of pie or bar of pie chart has one series, and its first slice always starts at 12 o'clock, so it has no `firstSliceAngle`. Its slices can be pulled out, as a pie's can.

LibreOffice splits a pie only by position, and Pages draws a plain pie. See [Chart Compatibility](usage/chart-compatibility.md).

## Options

These are all the options of a pie, doughnut, pie of pie or bar of pie chart. Each links to the page that explains it.

| Property          | Type                                                    | Notes    | Description                                                                                                                       |
| ----------------- | ------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `type`            | `"pie"` \| `"doughnut"` \| `"pieOfPie"` \| `"barOfPie"` | Required | A pie, rings, or a pie with a second plot                                                                                         |
| `categories`      | `(string \| number)[]`                                  | Required | The slices, in order. See [Chart Data](usage/chart-data.md)                                                                       |
| `series`          | `PieChartSeries[]`                                      | Required | `{ name, values, colors?, explosion?, dataLabels?, pointLabels? }`. A doughnut chart has a ring for each, and the others have one |
| `holeSize`        | `number`                                                | Optional | Doughnut charts: the hole, as a percentage of the doughnut's width, from 10 to 90. Default `50`                                   |
| `firstSliceAngle` | `number`                                                | Optional | Pie and doughnut charts: degrees clockwise from 12 o'clock, from 0 to 360. Default `0`                                            |
| `split`           | `PieChartSplit`                                         | Optional | Pie of pie and bar of pie charts: the slices of the second plot. Default the last third of the categories                         |
| `secondPlotSize`  | `number`                                                | Optional | Pie of pie and bar of pie charts: a percentage of the pie's size, from 5 to 200. Default `75`                                     |
| `gapWidth`        | `number`                                                | Optional | Pie of pie and bar of pie charts: a percentage of the second plot's width, from 0 to 500. Default `100`                           |
| `seriesLines`     | `ChartLine`                                             | Optional | Pie of pie and bar of pie charts: the lines joining the pie to the second plot                                                    |
| `dataLabels`      | `PieChartDataLabels`                                    | Optional | `{ value?, category?, seriesName?, percentage? }`. See [Chart Data Labels](usage/chart-data-labels.md)                            |
| `title`           | `string` \| `ChartTitle`                                | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                                                 |
| `legend`          | `false` \| `ChartLegend`                                | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md). Its entries are the categories                                 |
| `transformation`  | `{ width, height }`                                     | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                                                   |
| `floating`        | `IFloating`                                             | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                                                   |
| `altText`         | `DocPropertiesOptions`                                  | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                                                   |

These charts have no axes. [Chart Fonts and Fills](usage/chart-fonts-and-fills.md) shows the options every chart has for its text, background and border.
