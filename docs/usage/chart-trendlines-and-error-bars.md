# Chart Trendlines and Error Bars

A trendline is a line fitted to a series' values, which shows their trend and can extend it as a forecast. Error bars show how far each value might be off.

[Charts](usage/charts.md) shows how to import `ChartRun` and add a chart to a document.

## Trendlines

A series' `trendlines` fit lines to its values:

```ts
new ChartRun({
    type: "line",
    title: "Visitors",
    categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    series: [
        {
            name: "Visitors",
            values: [320, 410, 380, 460, 610],
            trendlines: [{ type: "linear", forecastForward: 2, equation: true, rSquared: true }],
        },
    ],
});
```

A trendline is a dotted line in its series' colour, and has an entry in the legend, such as "Linear (Visitors)". A series can have more than one. Column, bar, line, area, scatter and bubble charts have trendlines. A stacked series has none, as in Word.

### Types

`type` is the kind of line fitted to the values, as in Word's "Format Trendline":

| `type`            | Word's name    | Fits                                                         | Options  |
| ----------------- | -------------- | ------------------------------------------------------------ | -------- |
| `"linear"`        | Linear         | A straight line                                              |          |
| `"exponential"`   | Exponential    | A curve that rises or falls ever faster. Values above 0 only |          |
| `"logarithmic"`   | Logarithmic    | A curve that rises or falls quickly, then levels out         |          |
| `"polynomial"`    | Polynomial     | A curve with as many bends as its order, less one            | `order`  |
| `"power"`         | Power          | A curve for values that grow at a steady rate. Above 0 only  |          |
| `"movingAverage"` | Moving Average | The average of each point and those before it                | `period` |

- `order` is a polynomial's order, from `2` to `6`, and is `2` unless given.
- `period` is how many points each point of a moving average averages, from `2` to one fewer than the series' values, and is `2` unless given.

A chart with categories numbers them 1, 2, 3 and so on for the fit, as Word does. A scatter or bubble chart fits its points' x and y. An exponential or power trendline can't be fitted to values of 0 or less, or a logarithmic or power trendline to x values of 0 or less, and `new ChartRun(...)` throws for them.

### Forecasts, Intercepts and Equations

| Option             | What it does                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `forecastForward`  | Extends the line past the last point, by that many categories, or along a scatter chart's x axis                |
| `forecastBackward` | Extends it before the first point                                                                               |
| `intercept`        | Where it crosses the vertical axis. Linear, exponential and polynomial trendlines only; above 0 for exponential |
| `equation`         | Shows its equation on the chart, such as "y = 43.98x + 276.77"                                                  |
| `rSquared`         | Shows its R² value, how well it fits, on the chart                                                              |
| `label`            | `{ numberFormat?, font? }` of the equation and R² value, such as `{ numberFormat: "0.00" }`                     |
| `name`             | Its name in the legend. Default is Word's, such as "Linear (Visitors)"                                          |
| `line`             | `{ color?, width?, dash? }`. Default is the series' colour, 1.5 points, in short dots                           |

A moving average has none of these but `name` and `line`.

## Error Bars

A series' `errorBars` draw a line from each point, up and down, or on a bar chart, left and right:

```ts
series: [{ name: "Average", values: [72, 65, 81], errorBars: { type: "percentage", value: 10 } }],
```

`type` is how long the bars are, as in Word's "Format Error Bars":

| Error bars                                      | Word's name        | Each bar is                                                            |
| ----------------------------------------------- | ------------------ | ---------------------------------------------------------------------- |
| `{ type: "fixed", value: 5 }`                   | Fixed value        | 5 long                                                                 |
| `{ type: "percentage", value: 10 }`             | Percentage         | 10% of its point's value                                               |
| `{ type: "standardDeviation", value: 2 }`       | Standard deviation | 2 standard deviations of the series' values. `value` is 1 unless given |
| `{ type: "standardError" }`                     | Standard error     | The standard error of the series' values                               |
| `{ type: "custom", plus: [...], minus: [...] }` | Custom             | Its own length, one for each point                                     |

Error bars take these too:

- `direction`: `"both"` ways, the default, or only towards higher values, `"plus"`, or lower ones, `"minus"`.
- `endCaps`: `false` leaves out the short line across each bar's end.
- `line`: `{ color?, width?, dash? }`. Default is dark grey, 0.75 points.

Column, bar, line, area, scatter and bubble charts have error bars, stacked or not.

### Custom Error Bars

Custom error bars have a length of each point's own, such as a range of uncertainty. `plus` is how far each bar goes towards higher values, and `minus` towards lower ones, in the order of the categories or points:

```ts
errorBars: { type: "custom", plus: [6, 9, 4], minus: [5, 8, 6] },
```

- Give `plus`, `minus` or both. Bars go only the ways given, so custom error bars have no `direction`.
- `null` leaves a point without a bar. Lengths can't be negative.
- The lengths are kept in the chart's workbook, in columns after the series', so Word's **Edit Data** shows them. See [Chart Data](usage/chart-data.md#editing-the-data-in-word).

### Scatter and Bubble Charts

A scatter or bubble chart's points can have error bars both ways: `xErrorBars` go left and right, along the x axis, and `yErrorBars` up and down:

```ts
series: [
    {
        name: "Samples",
        points: [
            { x: 1, y: 2.1 },
            { x: 2, y: 3.9 },
        ],
        xErrorBars: { type: "fixed", value: 0.2 },
        yErrorBars: { type: "standardError" },
    },
],
```

## Compatibility

LibreOffice draws trendlines and error bars on every chart but a bubble chart, and writes an equation's numbers in full. Pages draws them, and gives a trendline an entry in the legend only if it has a `name`. See [Chart Compatibility](usage/chart-compatibility.md).
