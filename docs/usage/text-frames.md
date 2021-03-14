# Text Frames

Also known as `Text Boxes`

!> Text Frames requires an understanding of [Paragraphs](usage/paragraph.md).

> Text frames are paragraphs of text in a document which are positioned in a separate region or frame in the document, and can be positioned with a specific size and position relative to non-frame paragraphs in the current document.

## Intro

To make a `Text Frame`, simply add the `frame` property on a paragraph. `Borders` can be applied to frame simply by adding the `border` attribute.

```ts
new Paragraph({
    frame: {
        position: {
            x: 1000,
            y: 3000,
        },
        width: 4000,
        height: 1000,
        anchor: {
            horizontal: FrameAnchorType.MARGIN,
            vertical: FrameAnchorType.MARGIN,
        },
        alignment: {
            x: HorizontalPositionAlign.CENTER,
            y: VerticalPositionAlign.TOP,
        },
    },
    border: {
        top: {
            color: "auto",
            space: 1,
            value: "single",
            size: 6,
        },
        bottom: {
            color: "auto",
            space: 1,
            value: "single",
            size: 6,
        },
        left: {
            color: "auto",
            space: 1,
            value: "single",
            size: 6,
        },
        right: {
            color: "auto",
            space: 1,
            value: "single",
            size: 6,
        },
    },
    children: [
        new TextRun("Hello World"),
        new TextRun({
            text: "Foo Bar",
            bold: true,
        }),
        new TextRun({
            text: "\tGithub is the best",
            bold: true,
        }),
    ],
});
```
