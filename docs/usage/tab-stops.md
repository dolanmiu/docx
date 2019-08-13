# Tab Stops

> Tab stops are useful, if you are unclear of what they are, [here is a link explaining](https://en.wikipedia.org/wiki/Tab_stop). It enables side by side text which is nicely laid out without the need for tables, or constantly pressing space bar.

!> **Note**: At the moment, the unit of measurement for a tab stop is counter intuitive for a human. It is using OpenXMLs own measuring system. For example, 2268 roughly translates to 3cm. Therefore in the future, I may consider changing it to percentages or even cm.

![Word 2013 Tabs](http://www.teachucomp.com/wp-content/uploads/blog-4-22-2015-UsingTabStopsInWord-1024x577.png "Word 2013 Tab Stops")

Simply call the relevant methods on the paragraph listed below. Then just add a `tab()` method call to a text object. Adding multiple `tabStops` will mean you would have to chain `tab()` until the desired `tabStop` is selected. Example is shown below.

## Example

```ts
const paragraph = new docx.Paragraph().maxRightTabStop();
const leftText = new docx.TextRun("Hey everyone").bold();
const rightText = new docx.TextRun("11th November 2015").tab();
paragraph.addRun(leftText);
paragraph.addRun(rightText);
```
The example above will create a left aligned text, and a right aligned text on the same line. The laymans approach to this problem would be to either use text boxes or tables. YUK!

```ts
const paragraph = new docx.Paragraph();
paragraph.maxRightTabStop();
paragraph.leftTabStop(1000);
const text = new docx.TextRun("Second tab stop here I come!").tab().tab();
paragraph.addRun(text);
```

The above shows the use of two tab stops, and how to select/use it.

## Left Tab Stop
```ts
paragraph.leftTabStop(2268);
```
2268 is the distance from the left side.

## Center Tab Stop
```ts
paragraph.centerTabStop(2268);
```
2268 is the distance from the left side.

## Right Tab Stop
```ts
paragraph.rightTabStop(2268);
```
2268 is the distance from the left side.

## Max Right Tab Stop
```ts
paragraph.maxRightTabStop();
```
This will create a tab stop on the very edge of the right hand side. Handy for right aligning and left aligning text on the same line.
