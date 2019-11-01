# Tab Stops

> Tab stops are useful, if you are unclear of what they are, [here is a link explaining](https://en.wikipedia.org/wiki/Tab_stop). It enables side by side text which is nicely laid out without the need for tables, or constantly pressing space bar.

!> **Note**: The unit of measurement for a tab stop is in [DXA](https://stackoverflow.com/questions/14360183/default-wordml-unit-measurement-pixel-or-point-or-inches)

![Word 2013 Tabs](http://www.teachucomp.com/wp-content/uploads/blog-4-22-2015-UsingTabStopsInWord-1024x577.png "Word 2013 Tab Stops")

Simply call the relevant methods on the paragraph listed below. Then just add a `tab()` method call to a text object. Adding multiple `tabStops` will mean you would have to chain `tab()` until the desired `tabStop` is selected. Example is shown below.

## Example

```ts
const paragraph = new Paragraph({
    children: [new TextRun("Hey everyone").bold(), new TextRun("11th November 1999").tab()],
    tabStops: [
        {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
        },
    ],
});
```

The example above will create a left aligned text, and a right aligned text on the same line. The laymans approach to this problem would be to either use text boxes or tables. Not ideal!

```ts
const paragraph = new Paragraph({
    children: [new TextRun("Second tab stop here I come!").tab().tab()],
    tabStops: [
        {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
        },
        {
            type: TabStopType.LEFT,
            position: 1000,
        },
    ],
});
```

The above shows the use of two tab stops, and how to select/use it.

You can add multiple tab stops of the same `type` too.

```ts
const paragraph = new Paragraph({
    children: [new TextRun("Multiple tab stops!").tab().tab()],
    tabStops: [
        {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
        },
        {
            type: TabStopType.RIGHT,
            position: 1000,
        },
    ],
});
```

## Left Tab Stop

```ts
const paragraph = new Paragraph({
    tabStops: [
        {
            type: TabStopType.LEFT,
            position: 2268,
        },
    ],
});
```

2268 is the distance from the left side.

## Center Tab Stop

```ts
const paragraph = new Paragraph({
    tabStops: [
        {
            type: TabStopType.CENTER,
            position: 2268,
        },
    ],
});
```

2268 is the distance from the center.

## Right Tab Stop

```ts
const paragraph = new Paragraph({
    tabStops: [
        {
            type: TabStopType.RIGHT,
            position: 2268,
        },
    ],
});
```

2268 is the distance fro0oum the left side.

## Max Right Tab Stop

```ts
const paragraph = new Paragraph({
    tabStops: [
        {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
        },
    ],
});
```

This will create a tab stop on the very edge of the right hand side. Handy for right aligning and left aligning text on the same line.
