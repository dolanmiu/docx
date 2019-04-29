# Paragraph

> Everything (text, images, graphs etc) in OpenXML is organised in paragraphs.

## Example

You can add more text to the paragraph by doing this:

```js
var paragraph = new docx.Paragraph(),
```

```js
var text = new docx.TextRun("Lorem Ipsum Foo Bar");
var paragraph = new docx.Paragraph();
paragraph.addRun(text);
```

```js
var paragraph = new docx.Paragraph("Short hand notation for adding text.");
```

After you create the paragraph, you must add the paragraph into the `document`:

```js
doc.addParagraph(paragraph);
```

## Styles

To create styles, please refer to the styling Wiki: https://github.com/dolanmiu/docx/wiki/Styling

![Word 2013 Styles menu](http://content.gcflearnfree.org/topics/233/style_apply_choose.png "Word 2013 Styles menu")

### Heading1 - Heading5

```js
paragraph.heading1();
paragraph.heading2();
paragraph.heading3();
paragraph.heading4();
paragraph.heading5();
```

### Title

```js
paragraph.title();
```

## Text Alignment

To change the text alignment of a paragraph, for center, left, right or justified:

```js
paragraph.center();
```

```js
paragraph.left();
```

```js
paragraph.right();
```

```js
paragraph.justified();
```

### Example

```js
paragraph.heading1().center();
```

The above will create a `heading 1` which is `centered`.

### Justified text with breaks

When a paragraph is justified, you may want to not justify the contents of incomplete lines, which end in a soft line break.

![Justified line before](https://user-images.githubusercontent.com/7989576/53820338-e060c680-3f6b-11e9-817c-ecb43271951e.png)

This is possible to achieve using:

```ts
this.doc.Settings.addCompatibility().doNotExpandShiftReturn();
```

The result is:

![Justified line after](https://user-images.githubusercontent.com/7989576/53820344-e2c32080-3f6b-11e9-9afe-24a2ed6e0d78.png)

## Thematic Break

To add a break in the page, simply add `.thematicBreak()` on a paragraph:

```js
var paragraph = new docx.Paragraph("Amazing Heading").heading1().thematicBreak();
```

The above example will create a heading with a page break directly under it.

## Page Break

To move to a new page (insert a page break), simply add `.pageBreak()` on a paragraph:

```js
var paragraph = new docx.Paragraph("Amazing Heading").heading1().pageBreak();
```

The above example will create a heading and start a new page immediately afterwards.

### Page break before:

This option (available in word) will make sure that the paragraph will start on a new page (if it's not already on a new page).

```js
var paragraph = new docx.Paragraph("Hello World on another page").pageBreakBefore();
```

![Page Break Before in Word](https://user-images.githubusercontent.com/34742290/40176503-df3a8398-59db-11e8-8b9c-d719f13aa8b4.png)

Example: https://github.com/dolanmiu/docx/blob/master/demo/demo15.ts

## Page break control

Paragraphs have `.keepLines()` and `.keepNext()` methods that allow restricting page breaks within and between paragraphs. See [this Microsoft article](https://support.office.com/en-us/article/Keep-lines-and-paragraphs-together-d72af534-926f-4c4b-830a-abfc2daa3bfa) for more details)
