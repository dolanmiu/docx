# Text Box

Similar to `Text Frames`, but the difference being that it is `VML` `Shape` based.

!> `Text Boxes` require an understanding of [Paragraphs](usage/paragraph.md).

> `Text boxes` are paragraphs of text in a document which are positioned in a separate region or frame in the document, and can be positioned with a specific size and position relative to non-frame paragraphs in the current document.

## Basic Text Box

Create a text box with basic content:

```ts
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

### Fixed Size

```ts
new Textbox({
    children: [new Paragraph("Fixed size textbox")],
    style: {
        width: "200pt",
        height: "100pt",
    },
});
```

### Auto Height

```ts
new Textbox({
    children: [new Paragraph("Auto height based on content")],
    style: {
        width: "200pt",
        height: "auto",
    },
});
```

## Alignment

Align the textbox horizontally:

```ts
new Textbox({
    alignment: "center",
    children: [new Paragraph("Centered textbox")],
    style: {
        width: "200pt",
        height: "auto",
    },
});
```

Available alignment values:

- `"left"` - Align to left margin
- `"center"` - Center on page
- `"right"` - Align to right margin

## Multiple Paragraphs

Text boxes can contain multiple paragraphs:

```ts
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
});
```

## Styled Content

Apply formatting to text within the textbox:

```ts
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
});
```

## Complete Example

Sidebar callout box:

```ts
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun, Textbox } from "docx";
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

| Feature       | Text Box            | Text Frame        |
| ------------- | ------------------- | ----------------- |
| Based on      | VML Shape           | Paragraph framing |
| Positioning   | More flexible       | Limited           |
| Compatibility | Older Word versions | Modern Word       |

For most use cases, **Text Frames** are recommended. See [Text Frames](usage/text-frames.md) for more information.

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/94-texbox.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/94-texbox.ts_
