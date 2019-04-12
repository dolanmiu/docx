# Hyperlinks

There are two types of hyperlinks: internal (pointing to a bookmark inside the document) and external (pointing to an external url).

## Internal

To create an internal hyperlink you need first to create a bookmark (the paragraph that will be the destination of the hyperlink) with `doc.createBookmark(anchor, text)`.

A bookmark is composed of an anchor (an identifier) and the text displayed. After creating a bookmark just add it to a paragraph with `paragraph.addBookmark(bookmark)`

For example:

```ts
const paragraph = this.doc.createParagraph();
const bookmark = this.doc.createBookmark('anchorForChapter1', 'This is chapter1');
paragraph.addBookmark(bookmark);
```

Then you can create an hyperlink pointing to that bookmark with `doc.createInternalHyperLink(anchor,text)`:

```ts
const paragraph = this.doc.createParagraph();
const link = this.doc.createInternalHyperLink('anchorForChapter1', 'This is a link to chapter1');
paragraph.addHyperLink(link);
```

## External

To create an external hyperlink you just need to specify the url and the text of the link, then add it to a paragraph with `doc.createHyperlink(url, text)`:

```ts
const paragraph = this.doc.createParagraph();
const link = this.doc.createHyperlink('https://docx.js.org', 'This is an external link');
paragraph.addHyperLink(link);
```


## Styling an hyperlink

It is possible to set the style of the text of an hyperlink. This can be done applying run formatting on `TextRun` property of the hyperlink.

Example:

```ts
const link = this.doc.createHyperlink('https://docx.js.org', 'This is an external link');
link.TextRun.bold().italics()
```
