# Stock Charts

<!-- cspell:ignore Haut Clôture -->

A stock chart shows how a price moved over each day, or other period: its highest and lowest price, joined by a line, and where it closed. With opening prices, a bar goes from each open to each close. With volumes, the amount traded is drawn as columns underneath.

[Charts](usage/charts.md) shows how to import `ChartRun` and add a chart to a document.

## A Stock Chart

```ts
new ChartRun({
    type: "stock",
    title: "Share price",
    categories: [new Date("2025-01-06"), new Date("2025-01-07"), new Date("2025-01-08")],
    high: [103.1, 104.8, 105.0],
    low: [100.4, 101.9, 102.6],
    close: [102.4, 104.2, 102.9],
});
```

- `categories` are the days, or other periods, along the bottom: dates, text or numbers.
- `high`, `low` and `close` have a price for each category, in order. `null` leaves a gap.
- A line joins each high to its low, and a short dash across it marks the close. This is Word's "High-Low-Close" chart.

Each high has to be at least its low, and each open and close between them. `new ChartRun(...)` throws otherwise, as the prices would be mixed up.

## Opening Prices

`open` adds each category's opening price. A bar goes from the open to the close: white where the price rose, and dark grey where it fell. This is Word's "Open-High-Low-Close" chart, also known as a candlestick chart:

```ts
open: [101.2, 102.5, 104.1],
upBars: { fill: "70AD47" },
downBars: { fill: "C00000" },
```

`upBars` and `downBars` are the fill and border of the bars where the price rose and fell, as `{ fill, border }`, like the [chart area's](usage/chart-fonts-and-fills.md).

## Volumes

`volume` adds each category's volume traded, as columns against an axis of their own on the left. The prices' axis moves to the right. This is Word's "Volume-High-Low-Close" chart, or with `open`, its "Volume-Open-High-Low-Close" chart:

```ts
volume: [18200, 21500, 26400],
volumeAxis: { displayUnits: "thousands" },
valueAxis: { minimum: 90 },
```

`volumeAxis` is the volumes' axis, and `valueAxis` is always the prices' axis. Volumes can't be negative.

## Dates

A stock chart's dates are spaced evenly, one for each category, rather than by date, so days without trading, such as weekends, leave no gaps. They are labelled as dates, and `categoryAxis: { numberFormat: "d mmm" }` changes how. A value axis' `crossesAt` is a category's number, from 1. See [Chart Axes](usage/chart-axes.md).

## Series Names

The legend shows the series by Word's names: "Volume", "Open", "High", "Low" and "Close". `names` changes them, such as to another language:

```ts
names: { high: "Haut", low: "Bas", close: "Clôture" },
```

Only the volumes, and the closing price when there are no opening prices, have a key in the legend, so a stock chart without volumes often has `legend: false`.

## The High-Low Lines

`highLowLines` is the colour, width and dashes of the lines from each high to each low. They are thin and dark grey unless given.

## Options

| Property         | Type                               | Notes    | Description                                                                                                          |
| ---------------- | ---------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `type`           | `"stock"`                          | Required |                                                                                                                      |
| `categories`     | `(string \| number \| Date)[]`     | Required | The days, or other periods, in order                                                                                 |
| `high`           | `(number \| null)[]`               | Required | Each category's highest price                                                                                        |
| `low`            | `(number \| null)[]`               | Required | Each category's lowest price                                                                                         |
| `close`          | `(number \| null)[]`               | Required | Each category's closing price                                                                                        |
| `open`           | `(number \| null)[]`               | Optional | Each category's opening price, with a bar from it to the close                                                       |
| `volume`         | `(number \| null)[]`               | Optional | Each category's volume traded, as columns                                                                            |
| `names`          | `StockChartSeriesNames`            | Optional | `{ volume?, open?, high?, low?, close? }`, the series' names                                                         |
| `upBars`         | `ChartAreaStyle`                   | Optional | `{ fill?, border? }` of the bars where the price rose. Needs `open`                                                  |
| `downBars`       | `ChartAreaStyle`                   | Optional | `{ fill?, border? }` of the bars where the price fell. Needs `open`                                                  |
| `highLowLines`   | `ChartLine`                        | Optional | `{ color?, width?, dash? }` of the lines from each high to each low                                                  |
| `categoryAxis`   | `ChartAxis`                        | Optional | The axis of categories. See [Chart Axes](usage/chart-axes.md)                                                        |
| `valueAxis`      | `ChartValueAxis`                   | Optional | The axis of prices. See [Chart Axes](usage/chart-axes.md)                                                            |
| `volumeAxis`     | `ChartValueAxis`                   | Optional | The axis of volumes. Needs `volume`                                                                                  |
| `emptyValues`    | `"gap"` \| `"zero"` \| `"connect"` | Optional | How `null` is drawn. Default `"gap"`                                                                                 |
| `dataTable`      | `boolean` \| `ChartDataTable`      | Optional | A table of the prices under the plot. See [Chart Titles and Legends](usage/chart-titles-and-legends.md#a-data-table) |
| `title`          | `string` \| `ChartTitle`           | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                                    |
| `legend`         | `false` \| `ChartLegend`           | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                                    |
| `transformation` | `{ width, height }`                | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                                      |
| `floating`       | `IFloating`                        | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                                      |
| `altText`        | `DocPropertiesOptions`             | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                                      |

[Chart Fonts and Fills](usage/chart-fonts-and-fills.md) shows the options every chart has for its text, background and border.

## Compatibility

LibreOffice draws stock charts, with each close as a tick to the right of its line, and shows only the closing price and volumes in the legend. Pages draws a stock chart's prices as lines, and leaves them out when there are volumes. See [Chart Compatibility](usage/chart-compatibility.md).
