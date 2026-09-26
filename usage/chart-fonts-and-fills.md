# Chart Fonts and Fills

A chart's text is in the theme's body font, in dark grey, and the chart has a white background with a thin grey border, as Word draws a new chart. This page shows how to change them.

## The Chart's Font

`font` sets the font of all the chart's text: its title, legend, axes and labels.

```ts
new ChartRun({
    type: "column",
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [{ name: "Sales", values: [120, 135, 150, 170] }],
    font: { name: "Georgia", color: "404040" },
});
```

| Property  | Type                     | Description                                                                            |
| --------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `name`    | `string`                 | The typeface, such as `"Arial"`. Default is the theme's body font                      |
| `bold`    | `boolean`                | Bold text. Default `false`                                                             |
| `italics` | `boolean`                | Italic text. Default `false`                                                           |
| `color`   | `string` \| `ThemeColor` | A hex colour, or a theme colour such as `{ theme: "dark1" }`. Default is dark grey     |
| `size`    | `number`                 | Size in points. Not on the chart's `font`, as each piece of text has a size of its own |

## A Font for Each Piece of Text

The title, the legend, each axis and the labels take a `font` of their own, with a `size` too. It is applied over the chart's `font`, so give only what is different:

| Text        | Option                                          | Default size |
| ----------- | ----------------------------------------------- | ------------ |
| Title       | `title: { text, font }`                         | 14 points    |
| Legend      | `legend: { font }`                              | 9 points     |
| Axis labels | `categoryAxis: { font }`, `valueAxis: { font }` | 9 points     |
| Axis titles | `valueAxis: { title: { text, font } }`          | 10 points    |
| Data labels | `dataLabels: { font }`                          | 9 points     |

```ts
new ChartRun({
    type: "line",
    title: { text: "Rainfall", font: { size: 18, bold: true } },
    categories: ["Jan", "Feb", "Mar"],
    series: [{ name: "2025", values: [78, 62, 55] }],
    font: { name: "Georgia" },
    legend: { position: "top", font: { italics: true } },
    valueAxis: { title: { text: "mm", font: { italics: true } }, font: { size: 8 } },
});
```

Here every piece of text is in Georgia, the title is 18 point bold, and the value axis' labels are 8 point.

## The Chart Area and the Plot Area

The chart area is the whole chart, and the plot area is the part inside the axes. `chartArea` and `plotArea` give each a `fill` and a `border`:

```ts
chartArea: { fill: "F7F9FC", border: { color: { theme: "accent1" }, width: 1.5 } },
plotArea: { fill: "FFFFFF" },
```

- `fill` is a hex colour, a theme colour, or `"none"` for no fill.
- `border` is `{ color?, width?, dash? }`, with its width in points, or `"none"` for no border. A dash is a pattern such as `"dash"`: see [Lines](usage/chart-line-and-area.md#lines).

| Area        | Default fill | Default border                  |
| ----------- | ------------ | ------------------------------- |
| `chartArea` | White        | A 0.75 point line in light grey |
| `plotArea`  | None         | None                            |

`chartArea: { fill: "none", border: "none" }` leaves only the chart, on the page behind it.

## Options

| Property    | Type                        | Notes    | Description                                                                |
| ----------- | --------------------------- | -------- | -------------------------------------------------------------------------- |
| `font`      | `ChartFont`, without `size` | Optional | The font of all the chart's text                                           |
| `chartArea` | `ChartAreaStyle`            | Optional | `{ fill?, border? }` of the whole chart. Default a white fill, grey border |
| `plotArea`  | `ChartAreaStyle`            | Optional | `{ fill?, border? }` of the plot. Default neither                          |
