# Charts in Templates

!> Charts in templates require an understanding of the [Patcher](usage/patcher.md) and [Chart Data](usage/chart-data.md).

`patchDocument` fills in a template's charts two ways:

- **New data for the template's charts.** A chart made and styled in Word gets new data, and keeps its look. This page shows how.
- **New charts.** A `ChartRun` goes where a placeholder is in the template's text, as an image does. See [Chart Size and Position](usage/chart-size-and-position.md#in-templates).

## New Data for a Template's Charts

1. In Word, insert the chart and style it as the document needs: its type, title, colours, fonts, labels, axes and legend. Its data can be anything.
2. Right-click the chart, choose **Edit Alt Text**, and type a placeholder as its description, such as `{{sales}}`.
3. Patch the template with a `ChartDataPatch` for the placeholder's key:

```ts
import * as fs from "fs";
import { patchDocument } from "docx";
import { ChartDataPatch } from "docx/charts";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("Template.docx"),
    patches: {
        sales: new ChartDataPatch({
            categories: ["Q1", "Q2", "Q3", "Q4"],
            series: [
                { name: "2024", values: [120, 135, 150, 170] },
                { name: "2025", values: [140, 160, 155, 190] },
            ],
        }),
    },
});
```

Text patches, new charts and `ChartDataPatch`es go in the same `patches`. A `ChartDataPatch` only looks in charts' alt text, and a text patch only in text, so `{{sales}}` typed in the document's text stays as it is.

Every chart whose alt text holds the placeholder gets the data, wherever it is: in the document, a table, a header, a footer or a footnote. `patchDetector` lists the placeholders in charts' alt text along with those in text.

## The Data

The data is given as it is to [`ChartRun`](usage/chart-data.md), without the chart's `type`, which is the template's:

```ts
// A column, bar, line, area, pie, doughnut or radar chart
new ChartDataPatch({
    categories: ["Jan", "Feb", "Mar"],
    series: [{ name: "Visitors", values: [320, 410, null] }],
});

// A scatter chart, or with each point's size, a bubble chart
new ChartDataPatch({
    series: [
        {
            name: "Stores",
            points: [
                { x: 12, y: 340, size: 4 },
                { x: 30, y: 510, size: 9 },
            ],
        },
    ],
});

// A stock chart: its prices, and its opening prices and volumes if it has them
new ChartDataPatch({
    categories: [new Date("2025-01-06"), new Date("2025-01-07")],
    high: [103.1, 104.8],
    low: [100.4, 101.9],
    close: [102.4, 104.2],
});
```

| Option                                | Type                                                          | Notes                                                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| categories                            | `(string \| number \| Date)[]` \| `ChartCategoryGroup[]`      | For a chart with categories. Dates, and [groups](usage/chart-data.md#categories-in-groups), are for column, bar, line and area charts                               |
| series                                | `{ name, values }[]` with categories, or `{ name, points }[]` | Each series' name, and a value for each category (`null` for a gap), or its points. A bubble chart's points each need a `size`, and a scatter chart's leave it out  |
| high, low, close, open, volume, names | `(number \| null)[]`, `StockChartSeriesNames`                 | For a stock chart, in place of `series`, as for a [stock chart](usage/chart-stock.md). It takes `open` and `volume` if the template's chart has them, and only then |
| description                           | `string`                                                      | The chart's alt text description. Default is a description of the new data, such as "Column chart, Sales. 2024: Q1 120, Q2 135." An empty one removes it            |

The data is checked when the patch is made, as a `ChartRun`'s is, and then against the template's chart: a pie chart has one series, pie and doughnut charts have no negative values, a scatter or bubble chart's series have points, and a stock chart has opening prices and volumes if the template's has them.

## What Changes, and What Stays

The chart keeps its look. Its type, title, colours, fonts, labels, axes, legend and size are the template's. Its data changes like this:

- **The series.** Each series' name and data are replaced in the order the series are plotted, which is their order in Word's **Select Data**.
- **More series.** New series copy the look of the template's last series, such as its line, markers and labels, in their own colour: the next of the theme's accent colours, as `ChartRun` colours them. In a combo chart, they are drawn the way the last series is.
- **Fewer series.** The template's other series are removed, with any axes only they used, such as a secondary axis.
- **More points.** When each point has its own colour, as the slices of a pie do, new points take the next of the theme's accent colours. Otherwise they take their series' colour.
- **Fewer points.** The colours and labels of points past the new data are removed, and so are a pie of pie's split slices past it.
- **Slices pulled out.** New slices are pulled out as far as the template's, if every slice of the template is pulled out as far. A slice pulled out on its own is that slice's.
- **Trendlines, error bars and data tables** stay, and are drawn for the new data. A trendline that can't be fitted to the new values, such as a moving average over more points than there are, isn't drawn, as when a chart's data is edited in Word. New series don't copy the template's last series' trendlines or error bars.
- **Number formats.** Values keep the chart's number format, such as `0%`. So do categories, when they and the template's are both dates or both numbers.
- **Dates.** Dates on a date axis are spaced by days, months or years, as the new dates need. Categories that aren't dates make it a text axis.
- **The workbook.** The chart gets a new embedded workbook holding the new data, so Word's **Edit Data** opens it. The template's workbook is removed, so its data doesn't stay in the document.
- **The alt text.** The description is replaced with a description of the new data, or the patch's `description`. A decorative chart gets none. The placeholder is taken out of the alt text's title.

## What Can't Be Patched

`patchDocument` throws an error that names the chart's placeholder and says what to do, for a chart it can't patch:

- **Drawings that aren't charts**, such as pictures and shapes. In a group of drawings, put the placeholder in the alt text of the chart itself, unless it is the group's only chart.
- **Office 2016's chart types**: waterfall, histogram, box and whisker, treemap, sunburst, funnel and map charts.
- **Surface and pivot charts.**
- **A stock chart combined with a chart other than its volumes' columns.**
- **Charts with something else in their workbook's cells**: data labels from cells (Word's "Value From Cells"), series hidden with Word's chart filters, error bars with custom values from cells, and titles or labels linked to cells. The new data replaces the workbook, so these would lose their cells.
- **Data that isn't the chart's kind**, such as points for a column chart or two series for a pie chart.
- **Two charts' placeholders** in one chart's alt text.

The template's charts without a placeholder are left as they are, whatever they are.

## Other Drawings

`ChartDataPatch` is a `DrawingPatch` from `docx`: a patch for a drawing whose alt text holds the placeholder, which changes the drawing and the parts of the document it refers to. `patchDocument` applies drawing patches before text patches, so they only see the template's own drawings.

## Example

_Source: https://github.com/dolanmiu/docx/blob/master/demo/124-chart-data-in-templates.ts_

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/124-chart-data-in-templates.ts ":include :type=code typescript")
