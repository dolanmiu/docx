# Text Box

Similar to `Text Frames`, but the difference being that it is `VML` `Shape` based.

!> `Text Boxes` require an understanding of [Paragraphs](usage/paragraph.md).

> `Text boxes` are paragraphs of text in a document which are positioned in a separate region or frame in the document, and can be positioned with a specific size and position relative to non-frame paragraphs in the current document.

## Basic Text Box

Create a text box with basic content:

```ts live
import { Document, Paragraph, TextRun, Textbox } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Textbox({
                    children: [
                        new Paragraph({
                            children: [new TextRun("Hello from a textbox!")],
                        }),
                    ],
                    style: {
                        width: "200pt",
                        height: "100pt",
                    },
                }),
            ],
        },
    ],
});
```

## Textbox Options

| Property  | Type            | Notes    | Description                  |
| --------- | --------------- | -------- | ---------------------------- |
| children  | `Paragraph[]`   | Required | Content inside the textbox   |
| style     | `ITextboxStyle` | Optional | Positioning and size options |
| alignment | `string`        | Optional | Horizontal alignment         |

## Sizing

`width` sets a text box's width, so give every text box a `style` with one. Without a `style`, Word draws the box 50pt wide and LibreOffice gives it no width at all.

Word, WPS Office, LibreOffice and Pages make a text box as tall as its text, whatever its `height`, which is how tall applications that don't, such as the preview on this page, draw it. A `style` without a `height`, or with `"auto"`, is written 1 inch tall, as WPS Office makes a box of auto height too short, cutting off its last line.

```ts live
import { Document, Paragraph, Textbox } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Textbox({
                    children: [new Paragraph("As tall as its text")],
                    style: {
                        width: "200pt",
                        height: "auto",
                    },
                }),
            ],
        },
    ],
});
```

## Alignment

Align the textbox horizontally:

```ts live
import { Document, Paragraph, Textbox } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Textbox({
                    alignment: "center",
                    children: [new Paragraph("Centered textbox")],
                    style: {
                        width: "200pt",
                        height: "auto",
                    },
                }),
            ],
        },
    ],
});
```

Available alignment values:

- `"left"` - Align to left margin
- `"center"` - Center on page
- `"right"` - Align to right margin

## In a Paragraph

A text box can also be one of a paragraph's children, such as after some text. It is then part of that paragraph, and its own paragraph options, such as `alignment`, don't apply:

```ts live
import { Document, Paragraph, TextRun, Textbox } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("See the note: "),
                        new Textbox({
                            children: [new Paragraph("A note")],
                            style: {
                                width: "200pt",
                                height: "auto",
                            },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

## Multiple Paragraphs

Text boxes can contain multiple paragraphs:

```ts live
import { Document, HeadingLevel, Paragraph, Textbox } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Textbox({
                    children: [
                        new Paragraph({
                            text: "Title",
                            heading: HeadingLevel.HEADING_2,
                        }),
                        new Paragraph("First paragraph of content."),
                        new Paragraph("Second paragraph of content."),
                    ],
                    style: {
                        width: "300pt",
                        height: "auto",
                    },
                }),
            ],
        },
    ],
});
```

## Styled Content

Apply formatting to text within the textbox:

```ts live
import { AlignmentType, Document, Paragraph, TextRun, Textbox } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Textbox({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "Important Notice",
                                    bold: true,
                                    size: 28,
                                }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun("This is highlighted information")],
                        }),
                    ],
                    style: {
                        width: "250pt",
                        height: "auto",
                    },
                }),
            ],
        },
    ],
});
```

## Complete Example

Sidebar callout box:

```ts live
import { AlignmentType, Document, Packer, Paragraph, TextRun, Textbox } from "docx";
import * as fs from "fs";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("Main document content goes here..."),
                new Textbox({
                    alignment: "right",
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "Did You Know?",
                                    bold: true,
                                    color: "2F5496",
                                }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "docx can generate Word documents in both Node.js and browsers!",
                                    italics: true,
                                }),
                            ],
                        }),
                    ],
                    style: {
                        width: "180pt",
                        height: "auto",
                    },
                }),
                new Paragraph("More document content continues..."),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("document.docx", buffer);
});
```

## Text Box vs Text Frame

| Feature       | Text Box (`Textbox`) | Text Frame (`frame`) | Shape (`ShapeRun`)  |
| ------------- | -------------------- | -------------------- | ------------------- |
| Based on      | VML shape            | Paragraph framing    | DrawingML shape     |
| Fill, outline | No                   | Paragraph borders    | Yes                 |
| Compatibility | All Word versions    | All Word versions    | Word 2010 and later |

For new documents, use a [`ShapeRun`](usage/shapes.md#text-in-shapes) from `docx/shapes`, with paragraphs in `children`. It is the text box Word makes when you insert one, and the one other applications such as Google Docs and LibreOffice expect. See [Text Frames](usage/text-frames.md#text-frames-or-text-boxes) for when to use a text frame instead.

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/text-boxes/text-box.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/text-boxes/text-box.ts_
