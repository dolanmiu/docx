# Chart Axes

The axes are the lines along the sides of a chart, with the labels that say what each position means.

## Which Axes a Chart Has

| Chart                 | Axes                                                                        |
| --------------------- | --------------------------------------------------------------------------- |
| Column, line and area | `categoryAxis` along the bottom, and `valueAxis` up the left side           |
| Bar                   | `categoryAxis` up the left side, and `valueAxis` along the bottom           |
| Scatter               | `xAxis` along the bottom, and `yAxis` up the left side. Both are value axes |
| Pie and doughnut      | None                                                                        |

A category axis shows the categories. A value axis shows numbers, and takes a range and a number format too.

## Titles

`title` names an axis. Axes have no titles by default.

```ts
new ChartRun({
    type: "column",
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [{ name: "Sales", values: [120, 135, 150, 170] }],
    categoryAxis: { title: "Quarter" },
    valueAxis: { title: "Units" },
});
```

The title of an axis up the left side reads from bottom to top.

## Range and Interval

By default, the application chooses a value axis' range from the values. To choose it yourself:

- `minimum` is the lowest value on the axis;
- `maximum` is the highest;
- `interval` is the step between its labels and gridlines.

```ts
valueAxis: { minimum: 0, maximum: 200, interval: 50 },
```

This labels the axis 0, 50, 100, 150 and 200. Give any of the three, and the application chooses the others. The `minimum` has to be less than the `maximum`, and the `interval` more than 0.

## Number Format

`numberFormat` is how a value axis' labels are written, as an Excel number format:

| `numberFormat` | Value  | Label    |
| -------------- | ------ | -------- |
| `"#,##0"`      | 1234.5 | 1,235    |
| `"#,##0.00"`   | 1234.5 | 1,234.50 |
| `"$#,##0"`     | 1234.5 | $1,235   |
| `"0%"`         | 0.25   | 25%      |
| `"0.0%"`       | 0.125  | 12.5%    |

A percentage format multiplies by 100, as in Excel, so it suits values such as `0.25` for 25%. By default, labels are written as the values are.

## Gridlines

Gridlines are the lines across the chart at each label of an axis. A value axis has them by default, and a category axis doesn't. `gridlines` turns them on or off:

```ts
categoryAxis: { gridlines: true },
valueAxis: { gridlines: false },
```

## Hiding an Axis

`visible: false` hides an axis and its labels. Its gridlines stay unless you turn them off too:

```ts
categoryAxis: { visible: false },
valueAxis: { visible: false, gridlines: false },
```

A chart with no axes, legend or title can be as small as a word. See [Small Charts](usage/chart-size-and-position.md#small-charts).

## Charts Stacked to 100%

On a chart with `stacking: "percent"`, the value axis is labelled as percentages, from 0% to 100%. Its `minimum`, `maximum` and `interval` are percentages too, so `valueAxis: { maximum: 50, interval: 25 }` labels it 0%, 25% and 50%.

## Options

`categoryAxis` takes a `ChartAxis`, and `valueAxis`, `xAxis` and `yAxis` take a `ChartValueAxis`.

| Property       | Type      | Axes       | Description                                                                                    |
| -------------- | --------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `title`        | `string`  | All        | The axis' title. Default none                                                                  |
| `visible`      | `boolean` | All        | Whether the axis and its labels are shown. Default `true`                                      |
| `gridlines`    | `boolean` | All        | Lines across the chart at each label. Default `true` for value axes, `false` for category axes |
| `minimum`      | `number`  | Value axes | The lowest value on the axis. Default is chosen from the values                                |
| `maximum`      | `number`  | Value axes | The highest value on the axis. Default is chosen from the values                               |
| `interval`     | `number`  | Value axes | The step between labels and gridlines. Default is chosen from the values                       |
| `numberFormat` | `string`  | Value axes | An Excel number format, such as `"#,##0"`. Default is the values as they are                   |
