# Chart Colours

Charts are drawn in the colours of the document's [theme](usage/themes.md), as in Word. This page shows the colours a chart takes, and how to choose your own.

## The Theme's Colours

Each series takes the next of the theme's six accent colours. In the theme `docx` writes, Office's, they are:

| Series | Theme colour | Colour |
| ------ | ------------ | ------ |
| 1      | `accent1`    | Blue   |
| 2      | `accent2`    | Orange |
| 3      | `accent3`    | Grey   |
| 4      | `accent4`    | Gold   |
| 5      | `accent5`    | Blue   |
| 6      | `accent6`    | Green  |

After the sixth series, the six colours come round again in darker and lighter shades, as in Word.

The slices of a pie or doughnut chart take the accent colours in the same way, one for each category.

Colours from the theme change when the document's theme does, as they do in Word. Give the document a theme of its own to change every chart's colours at once. See [Themes](usage/themes.md).

## A Colour of Your Own

Give a series a `color` of its own:

- a 6-digit hex colour, such as `"1F4E79"`;
- or one of the theme's colours, lighter or darker if you like, as Word's colour menus offer them: `{ theme: "accent2", lighter: 40 }` is "Orange, Accent 2, Lighter 40%".

```ts
series: [
    { name: "Planned", values: [30, 80, 40], color: "1F4E79" },
    { name: "Extra", values: [5, 20, 15], color: { theme: "accent2", lighter: 40 } },
],
```

The colour is the colour of the series' bars, line, area, points or bubbles. Bubbles are drawn in it a quarter see-through, as Office draws them. A line can have a colour of its own too, apart from its markers: see [Lines](usage/chart-line-and-area.md#lines).

## Bar Colours

A series of bars takes `colors`, with a colour for single bars, in the order of the categories:

```ts
series: [{ name: "Tickets", values: [42, 57, 38, 71], colors: [undefined, undefined, undefined, "70AD47"] }],
```

A bar without a colour, or with `undefined`, keeps the series' colour. See [Column and Bar Charts](usage/chart-column-and-bar.md#bar-colours).

## Slice Colours

A pie or doughnut series takes `colors`, with a colour for each slice, in the order of the categories:

```ts
series: [{ name: "Share", values: [40, 25, 20, 15], colors: ["1F4E79", "2E75B6", undefined, { theme: "accent6" }] }],
```

A slice without a colour, or with `undefined`, keeps the theme's colour. See [Pie and Doughnut Charts](usage/chart-pie-and-doughnut.md#slice-colours).

## The Rest of the Chart

The chart's background, text, axes and gridlines are in the look Word gives a new chart: a white background, dark grey text and light grey lines, from the theme's `light1` and `dark1` colours. [Chart Fonts and Fills](usage/chart-fonts-and-fills.md) shows how to give the text, the background and the border colours of their own.
