# Footnotes

!> Footnotes require an understanding of [Sections](usage/sections.md).

Footnotes allow you to add references that appear at the bottom of each page. They are useful for explanations, comments, or citations without interrupting the flow of the main text.

?> For references that appear at the end of the document, see [Endnotes](usage/endnotes.md).

## Example

```ts
import { Document, FootnoteReferenceRun, Paragraph, TextRun } from "docx";

const doc = new Document({
    footnotes: {
        1: { children: [new Paragraph("Foo"), new Paragraph("Bar")] },
        2: { children: [new Paragraph("Test")] },
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            children: ["Hello"],
                        }),
                        new FootnoteReferenceRun(1),
                        new TextRun({
                            children: [" World!"],
                        }),
                        new FootnoteReferenceRun(2),
                    ],
                }),
            ],
        },
    ],
});
```

## Usage

### Document Configuration

Add footnotes to the `footnotes` property in the `Document` constructor:

- Keys are reference numbers (as strings)
- Values are objects with `children` array of `Paragraph` objects
- Footnotes can contain multiple paragraphs

### FootnoteReferenceRun

Insert `FootnoteReferenceRun` in paragraphs to create reference markers:

- Takes a single `id` parameter matching the footnote key
- Automatically styled as superscript
- References the corresponding footnote content

## Images in Footnotes

Footnotes can contain images using `ImageRun`:

```ts
import { Document, FootnoteReferenceRun, ImageRun, Packer, Paragraph, TextRun } from "docx";
import * as fs from "fs";

const doc = new Document({
    footnotes: {
        1: {
            children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "jpg",
                            data: fs.readFileSync("./image.jpg"),
                            transformation: {
                                width: 100,
                                height: 100,
                            },
                        }),
                        new TextRun("Caption for the image"),
                    ],
                }),
            ],
        },
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new TextRun("See the image"), new FootnoteReferenceRun(1)],
                }),
            ],
        },
    ],
});
```

## Numbered Lists in Footnotes

Footnotes support numbered and bulleted lists:

```ts
import { AlignmentType, convertInchesToTwip, Document, FootnoteReferenceRun, LevelFormat, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "footnote-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
                            },
                        },
                    },
                ],
            },
        ],
    },
    footnotes: {
        1: {
            children: [
                new Paragraph("This footnote contains a list:"),
                new Paragraph({
                    text: "First item",
                    numbering: { reference: "footnote-numbering", level: 0 },
                }),
                new Paragraph({
                    text: "Second item",
                    numbering: { reference: "footnote-numbering", level: 0 },
                }),
            ],
        },
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new TextRun("See the list"), new FootnoteReferenceRun(1)],
                }),
            ],
        },
    ],
});
```

## Options

| Property  | Type                                        | Notes    | Description                                    |
| --------- | ------------------------------------------- | -------- | ---------------------------------------------- |
| footnotes | `Record<string, { children: Paragraph[] }>` | Optional | Footnote definitions keyed by reference number |
