# Radar Charts

A radar chart has a spoke for each category, and draws each series as a line around the spokes. Use it to compare several qualities at once, such as a team's skills.

[Charts](usage/charts.md) shows how to import `ChartRun` and add a chart to a document.

## A Radar Chart

```ts
new ChartRun({
    type: "radar",
    title: "Skills",
    categories: ["Speed", "Strength", "Range", "Stamina", "Skill"],
    series: [
        { name: "Alice", values: [4, 3, 5, 2, 4] },
        { name: "Bob", values: [3, 5, 2, 4, 3] },
    ],
    valueAxis: { minimum: 0, maximum: 5, interval: 1 },
});
```

- The first category's spoke points up, and the others go round clockwise.
- Each value is a point on its category's spoke: the further out, the bigger the value. The rings are the value axis' gridlines.
- A `null` value leaves a gap in its line.

## Markers and Filled Radar Charts

- `markers: true` draws a circle at each point, as Word's "Radar with Markers" does. Markers can have a shape and size of their own. See [Markers](usage/chart-line-and-area.md#markers).
- `filled: true` fills the area inside each series' line, as Word's "Filled Radar" does. A filled radar chart has no markers, and its series no lines.

```ts
new ChartRun({
    type: "radar",
    categories: ["Speed", "Strength", "Range", "Stamina", "Skill"],
    series: [{ name: "Alice", values: [4, 3, 5, 2, 4] }],
    filled: true,
});
```

## Axes

- `categoryAxis` is the labels at the end of the spokes, and the spokes themselves, which are its gridlines.
- `valueAxis` runs up the first spoke. Its gridlines are the rings, and it takes a range and a number format as any value axis does.

See [Chart Axes](usage/chart-axes.md).

## Options

| Property         | Type                       | Notes    | Description                                                                                        |
| ---------------- | -------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `type`           | `"radar"`                  | Required |                                                                                                    |
| `categories`     | `(string \| number)[]`     | Required | The spokes, in order. See [Chart Data](usage/chart-data.md)                                        |
| `series`         | `RadarChartSeries[]`       | Required | `{ name, values, color?, markers?, line?, dataLabels? }`, with a value or `null` for each category |
| `markers`        | `boolean` \| `ChartMarker` | Optional | A marker at each point. Default `false`. See [Markers](usage/chart-line-and-area.md#markers)       |
| `filled`         | `boolean`                  | Optional | Fills each series' area. Default `false`                                                           |
| `categoryAxis`   | `ChartAxis`                | Optional | The spokes and their labels. See [Chart Axes](usage/chart-axes.md)                                 |
| `valueAxis`      | `ChartValueAxis`           | Optional | The axis up the first spoke. See [Chart Axes](usage/chart-axes.md)                                 |
| `dataLabels`     | `ChartDataLabels`          | Optional | See [Chart Data Labels](usage/chart-data-labels.md). A radar chart's labels have no `position`     |
| `title`          | `string` \| `ChartTitle`   | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                  |
| `legend`         | `false` \| `ChartLegend`   | Optional | See [Chart Titles and Legends](usage/chart-titles-and-legends.md)                                  |
| `transformation` | `{ width, height }`        | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                    |
| `floating`       | `IFloating`                | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                    |
| `altText`        | `DocPropertiesOptions`     | Optional | See [Chart Size and Position](usage/chart-size-and-position.md)                                    |

[Chart Fonts and Fills](usage/chart-fonts-and-fills.md) shows the options every chart has for its text, background and border.
