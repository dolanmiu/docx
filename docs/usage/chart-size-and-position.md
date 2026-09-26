# Chart Size and Position

A chart is a run in a paragraph, like an image. It sits in the line of text, where the paragraph puts it, unless you make it float.

## Size

`transformation` is the chart's size in pixels, at 96 pixels to an inch:

```ts
new ChartRun({
    type: "column",
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [{ name: "Sales", values: [120, 135, 150, 170] }],
    transformation: { width: 400, height: 250 },
});
```

The default is 576 by 336 pixels, 6 by 3.5 inches, the size Word inserts a chart at. The chart's title, legend and axes are drawn at the same size whatever the chart's size, so the plot gets the space that is left.

As in Word, a chart can be made wider without being made taller: its aspect ratio isn't locked.

## Small Charts

A chart with no title, legend or axes can be as small as a word, such as a trend beside a heading:

```ts
new Paragraph({
    children: [
        new TextRun("Visitors this year "),
        new ChartRun({
            type: "line",
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            series: [{ name: "Visitors", values: [12, 15, 14, 18, 22, 21] }],
            legend: false,
            categoryAxis: { visible: false },
            valueAxis: { visible: false, gridlines: false },
            transformation: { width: 144, height: 48 },
        }),
    ],
});
```

Apple Pages doesn't draw a chart less than about half an inch (48 pixels) tall.

## Floating

Add `floating` to position the chart on the page instead of in the line of text, with text wrapping around it. The options are the same as for [floating images](usage/images.md#floating), and the positions and wrapping types come from `docx`:

```ts
new Paragraph({
    children: [
        new ChartRun({
            type: "column",
            categories: ["Mon", "Tue", "Wed"],
            series: [{ name: "Orders", values: [8, 12, 9] }],
            transformation: { width: 260, height: 180 },
            floating: {
                horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.RIGHT },
                verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT },
            },
        }),
        new TextRun("This text wraps around the chart, which is at the right margin."),
    ],
});
```

## Where Charts Can Go

A chart can go in any paragraph: in the body, a table cell, a header, a footer or a footnote.

To put two charts side by side, put each in a cell of a table, and make each narrower than its cell:

```ts
const cell = (chart: ChartRun): TableCell => new TableCell({ children: [new Paragraph({ children: [chart] })] });

new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        new TableRow({
            children: [
                cell(
                    new ChartRun({
                        type: "pie",
                        categories: ["North", "South", "East"],
                        series: [{ name: "Share", values: [50, 30, 20] }],
                        transformation: { width: 290, height: 260 },
                    }),
                ),
                cell(
                    new ChartRun({
                        type: "column",
                        categories: ["North", "South", "East"],
                        series: [{ name: "Sales", values: [120, 70, 45] }],
                        transformation: { width: 290, height: 260 },
                    }),
                ),
            ],
        }),
    ],
});
```

?> `patchDocument` can't add charts yet: a chart in a patch throws an error. Add charts to a new `Document`.

## Alternative Text

Give a chart `altText` so screen readers can describe it:

```ts
altText: {
    name: "Sales by quarter",
    description: "Sales rose each quarter, from 120 units in Q1 to 170 in Q4",
},
```

`name` is required, and `description` and `title` are optional. The description is what a screen reader reads, so say what the chart shows.

## Options

| Property         | Type                   | Notes    | Description                                                       |
| ---------------- | ---------------------- | -------- | ----------------------------------------------------------------- |
| `transformation` | `{ width, height }`    | Optional | Size in pixels. Default is 576 by 336                             |
| `floating`       | `IFloating`            | Optional | Floats the chart. See [floating images](usage/images.md#floating) |
| `altText`        | `DocPropertiesOptions` | Optional | `{ name, description?, title? }` for screen readers               |
