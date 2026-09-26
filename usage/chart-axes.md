# Chart Axes

The axes are the lines along the sides of a chart, with the labels that say what each position means.

## Which Axes a Chart Has

| Chart                 | Axes                                                                        |
| --------------------- | --------------------------------------------------------------------------- |
| Column, line and area | `categoryAxis` along the bottom, and `valueAxis` up the left side           |
| Bar                   | `categoryAxis` up the left side, and `valueAxis` along the bottom           |
| Scatter and bubble    | `xAxis` along the bottom, and `yAxis` up the left side. Both are value axes |
| Radar                 | `categoryAxis` round the outside, and `valueAxis` up the first spoke        |
| Pie and doughnut      | None                                                                        |

A category axis shows the categories. A value axis shows numbers, and takes a range and a scale too. A column, bar, line or area chart can have a second value axis, `secondaryValueAxis`, on the right: see [Combo Charts](usage/chart-combo.md#a-secondary-axis).

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

The title of an axis up the left side reads from bottom to top. To give it a font of its own, give `title` its `text` and a `font`, such as `valueAxis: { title: { text: "Units", font: { italics: true } } }`.

## Range and Interval

By default, the application chooses a value axis' range from the values. To choose it yourself:

- `minimum` is the lowest value on the axis;
- `maximum` is the highest;
- `interval` is the step between its labels and gridlines.

```ts
valueAxis: { minimum: 0, maximum: 200, interval: 50 },
```

This labels the axis 0, 50, 100, 150 and 200. Give any of the three, and the application chooses the others. The `minimum` has to be less than the `maximum`, and the `interval` more than 0.

## Logarithmic Scale

`logarithmicBase` makes a value axis' scale logarithmic: each gridline is the one before it times the base. It suits values that grow many times over, such as 12, 95, 610 and 4,800:

```ts
valueAxis: { logarithmicBase: 10, minimum: 1 },
```

With base 10, the axis is labelled 1, 10, 100, 1,000 and so on. The base goes from `2` to `1000`. Values of 0 or less can't be shown on a logarithmic scale, so its `minimum` and `maximum` have to be above 0.

## Number Format

`numberFormat` is how an axis' labels are written, as an Excel number format:

| `numberFormat` | Value  | Label    |
| -------------- | ------ | -------- |
| `"#,##0"`      | 1234.5 | 1,235    |
| `"#,##0.00"`   | 1234.5 | 1,234.50 |
| `"$#,##0"`     | 1234.5 | $1,235   |
| `"0%"`         | 0.25   | 25%      |
| `"0.0%"`       | 0.125  | 12.5%    |

A percentage format multiplies by 100, as in Excel, so it suits values such as `0.25` for 25%. By default, labels are written as the values are. A category axis takes a number format too, for categories that are numbers or [dates](#dates).

## Display Units

`displayUnits` writes a value axis' labels in thousands, millions and so on, and names the units beside the axis:

```ts
valueAxis: { displayUnits: "thousands" },
```

This labels 25,000 as 25, and the axis "Thousands". The units are `"hundreds"`, `"thousands"`, `"tenThousands"`, `"hundredThousands"`, `"millions"`, `"tenMillions"`, `"hundredMillions"`, `"billions"` and `"trillions"`.

## Dates

When the categories are all `Date`s, the category axis is a date axis, as in Excel: it spaces the dates by how far apart they are, so a missing month leaves a gap.

```ts
new ChartRun({
    type: "line",
    categories: [new Date("2025-01-01"), new Date("2025-02-01"), new Date("2025-05-01")],
    series: [{ name: "Sign-ups", values: [320, 410, 520] }],
});
```

The dates are spaced by days, months or years, as Excel chooses:

| The dates are all  | Spaced by | Labelled, by default |
| ------------------ | --------- | -------------------- |
| The 1st of January | Years     | `2025`               |
| The 1st of a month | Months    | `Jan 2025`           |
| Any other day      | Days      | `31 Jan 2025`        |

`numberFormat` labels them in another format, such as `categoryAxis: { numberFormat: "mmm" }` for Jan, Feb and so on.

Dates are read in UTC, as `docx` writes every date, so `new Date("2025-01-31")` is 31 January 2025. Use `new Date(Date.UTC(2025, 0, 31))` to make a date from its year, month and day.

## Reverse Order

`reverseOrder: true` puts an axis' categories or values the other way round, as Word's "Categories in reverse order" does. A bar chart's first category is at the bottom, as in Word, so this puts it at the top:

```ts
categoryAxis: { reverseOrder: true },
valueAxis: { crossesAt: "maximum" },
```

Reversing the categories moves the value axis to the other side too, as it crosses the category axis at its first category. `crossesAt: "maximum"` moves it back: see the next section.

## Where the Axes Cross

Each axis crosses the other one. By default, it crosses where the other axis is 0, or at its minimum when 0 isn't on it, so the value axis is on the left and the category axis at the bottom. `crossesAt` moves an axis:

| `crossesAt`        | The axis crosses the other one                                                           |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `"auto"` (default) | At 0, or at its minimum                                                                  |
| `"minimum"`        | At its minimum                                                                           |
| `"maximum"`        | At its maximum                                                                           |
| A number           | At that value, or on a value axis crossing categories, at that category's number, from 1 |
| A `Date`           | On a value axis crossing categories that are dates, at that date                         |

```ts
valueAxis: { crossesAt: "maximum" }, // The value axis on the right
categoryAxis: { crossesAt: 50 }, // The category axis at 50, so the bars grow up or down from 50
```

## Label Rotation

`labelRotation` turns an axis' labels, in degrees clockwise, from `-90` to `90`. `-45` slants them up to the right, which suits long category names:

```ts
categoryAxis: { labelRotation: -45 },
```

By default, the application turns the labels when they don't fit.

## Fonts

An axis' labels are 9 point text in dark grey, and its title 10 point. `font` changes the labels' font, and the title takes a font of its own:

```ts
categoryAxis: { font: { size: 11, bold: true } },
```

See [Chart Fonts and Fills](usage/chart-fonts-and-fills.md).

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

`categoryAxis` takes a `ChartAxis`, and `valueAxis`, `secondaryValueAxis`, `xAxis` and `yAxis` take a `ChartValueAxis`.

| Property          | Type                                                         | Axes       | Description                                                                                    |
| ----------------- | ------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `title`           | `string` \| `ChartTitle`                                     | All        | The axis' title, or `{ text, font? }`. Default none                                            |
| `visible`         | `boolean`                                                    | All        | Whether the axis and its labels are shown. Default `true`                                      |
| `gridlines`       | `boolean`                                                    | All        | Lines across the chart at each label. Default `true` for value axes, `false` for category axes |
| `numberFormat`    | `string`                                                     | All        | An Excel number format, such as `"#,##0"`. Default is the values as they are                   |
| `reverseOrder`    | `boolean`                                                    | All        | Puts the categories or values the other way round. Default `false`                             |
| `crossesAt`       | `"auto"` \| `"minimum"` \| `"maximum"` \| `number` \| `Date` | All        | Where the axis crosses the other one. Default `"auto"`                                         |
| `labelRotation`   | `number`                                                     | All        | Turns the labels, in degrees clockwise, from -90 to 90. Default is the application's choice    |
| `font`            | `ChartFont`                                                  | All        | The labels' font. Default 9 points                                                             |
| `minimum`         | `number`                                                     | Value axes | The lowest value on the axis. Default is chosen from the values                                |
| `maximum`         | `number`                                                     | Value axes | The highest value on the axis. Default is chosen from the values                               |
| `interval`        | `number`                                                     | Value axes | The step between labels and gridlines. Default is chosen from the values                       |
| `logarithmicBase` | `number`                                                     | Value axes | Makes the scale logarithmic, with this base, from 2 to 1000. Default is a linear scale         |
| `displayUnits`    | `ChartDisplayUnits`                                          | Value axes | Writes the labels in thousands, millions and so on. Default is the values as they are          |
