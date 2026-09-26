# Chart Compatibility

This page says how charts are saved in a document, and how each application draws them.

## How Charts Are Saved

Charts are saved as Word 2016 saves them: as DrawingML charts, in the look Office 2013 and later give a new chart.

- Each chart is a part of its own in the document, such as `word/charts/chart1.xml`, with its data in it.
- Each chart's data is also in an Excel workbook inside the document, such as `word/embeddings/Microsoft_Excel_Worksheet1.xlsx`, which Word's **Edit Data** opens. See [Editing the Data in Word](usage/chart-data.md#editing-the-data-in-word).

Applications draw a chart from the data in the chart part, so they don't need to open the workbook.

## Checks

?> Word itself hasn't been checked yet. The charts and their workbooks pass the Open XML SDK validator, Microsoft's own check, for every version of Office since 2010, and are drawn as intended by LibreOffice and Apple Pages, apart from the differences below.

## LibreOffice

LibreOffice (checked with version 26.8) draws every chart as intended, and opens the workbooks in Calc, but:

- It doesn't write an axis' labels in its `displayUnits`, or name the units beside it.
- It draws a logarithmic axis in base 10, whatever its `logarithmicBase`.
- It draws bubbles' sizes as their areas, even with `sizeRepresents: "width"`.
- It doesn't show a bubble's size in its label.

## Apple Pages

Apple Pages (checked with version 15.1) draws the charts, but:

- It doesn't draw a chart less than about half an inch tall: 48 pixels tall is drawn, 32 pixels isn't.
- It draws only the first series of a doughnut chart, as one ring.
- It draws stacked lines at their own values, not stacked.
- It puts the last series in front in an area chart that isn't stacked, where LibreOffice puts the first.
- It divides a value axis into four equal steps, such as 0, 43, 85, 128 and 170, unless it has an `interval`.
- It narrows a pie or doughnut chart to the pie, so a floating one moves away from the right margin. Word does this with its own pie charts too.
- It spaces dates evenly, as it does other categories, and labels them in their own format, not the axis' `numberFormat`.
- It doesn't draw bars' own `colors`: each bar is its series' colour.
- It keeps the axes where they are by default, whatever their `crossesAt`.
- It reverses the order of categories, but not of values.
- It draws a logarithmic axis in base 10, whatever its `logarithmicBase`.
- It names an axis' `displayUnits`, but writes its labels in them only when the axis has a `numberFormat` other than `"General"`, such as `"#,##0"`.
- It draws `"x"`, `"star"`, `"plus"`, `"dash"` and `"dot"` markers as circles.

## Patching

`patchDocument` can't add charts yet: a chart in a patch throws an error. Add charts to a new `Document`.
