# Text Box

Similar `Text Frames`, but the difference being that it is `VML` `Shape` based.

!> `Text Boxes` requires an understanding of [Paragraphs](usage/paragraph.md).

> `Text boxes` are paragraphs of text in a document which are positioned in a separate region or frame in the document, and can be positioned with a specific size and position relative to non-frame paragraphs in the current document.

## Intro

To make a `Text Box`, simply create a `Textbox` object inside the `Document`:

```ts
new Textbox({
    alignment: "center",
    children: [
        new Paragraph({
            children: [new TextRun("Hi i'm a textbox!")],
        }),
    ],
    style: {
        width: "200pt",
        height: "auto",
    },
});
```
