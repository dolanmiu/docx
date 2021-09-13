# Hyperlinks

!> Hyperlinks require an understanding of [Paragraphs](usage/paragraph.md) and [Text](usage/text.md).

There are two types of hyperlinks: internal (pointing to a bookmark inside the document) and external (pointing to an external url).

## Internal

To create an internal hyperlink you need first to create a `Bookmark`, which contains the content that will be the destination of the hyperlink.

A bookmark is composed of an anchor (an identifier) and the text displayed. After creating a bookmark just add it to a paragraph. For example, creating a bookmarked heading:

```ts
const chapter1 = new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [
        new Bookmark({
            id: "anchorForChapter1",
            children: [
                new TextRun("Chapter 1"),
            ],
        }),
    ],
})
```

Then you can create an hyperlink pointing to that bookmark with an `InternalHyperLink`:

```ts
const link = new InternalHyperlink({
    children: [
        new TextRun({
            text: "See Chapter 1",
            style: "Hyperlink",
        }),
    ],
    anchor: "anchorForChapter1",
})
```

You can also get the page number of the bookmark by creating a page reference to it:

```ts
const paragraph = new Paragraph({
    children: [
        new TextRun("Chapter 1 can be seen on page "),
        new PageReference("anchorForChapter1"),
    ],
});
```

## External

To create an external hyperlink you just need to specify the url and the text of the link, then add it to a paragraph:

```ts
const paragraph = new Paragraph({
    children: [
        new ExternalHyperlink({
            children: [
                new TextRun({
                    text: "This is an external link!",
                    style: "Hyperlink",
                }),
            ],
            link: "https://docx.js.org",
        }),
    ],
});
```


## Styling hyperlinks

It is possible to set the style of the text of both internal and external hyperlinks. This can be done applying run formatting on any of the `TextRun` children of the hyperlink. Use the `style: "Hyperlink"` property to show the default link styles, which can be combined with any other style.

Example:

```ts
const styledLink = new ExternalHyperlink({
    children: [
        new TextRun({
            text: "This is a ",
            style: "Hyperlink",
        }),
        new TextRun({
            text: "bold",
            bold: true,
            style: "Hyperlink",
        }),
        new TextRun({
            text: " link!",
            style: "Hyperlink",
        }),
    ],
    link: "https://docx.js.org",
});
```
