# Footnotes

!> Footnotes require an understanding of [Sections](usage/sections.md).

Footnotes allow you to add references that appear at the bottom of each page. They are useful for explanations, comments, or citations without interrupting the flow of the main text.

?> For references that appear at the end of the document, see [Endnotes](usage/endnotes.md). To add footnotes to an existing document, see [Templates](usage/templates.md#footnotes-and-endnotes).

## Example

```ts live
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

- Takes the `id` of one of the footnotes, its key, or the footnote's content (see below)
- Automatically styled as superscript
- References the corresponding footnote content

## Footnotes With Their Content

A `FootnoteReferenceRun` can be given its footnote's content, its `children`, instead of the id of one of the document's `footnotes`. The footnote is added to the document's footnotes when the document is written, with an id none of them has. Content made before the document it goes in, such as paragraphs a function makes, or the paragraphs of [HTML](usage/html.md#footnotes), then brings its footnotes with it:

```ts live
import { Document, FootnoteReferenceRun, Paragraph, TextRun } from "docx";

const sourced = (claim: string, source: string): Paragraph =>
    new Paragraph({
        children: [new TextRun(claim), new FootnoteReferenceRun({ children: [new Paragraph(source)] })],
    });

const doc = new Document({
    footnotes: {
        1: { children: [new Paragraph("A footnote of the document's own.")] },
    },
    sections: [
        {
            children: [
                new Paragraph({ children: [new TextRun("A claim"), new FootnoteReferenceRun(1)] }),
                sourced("Sales were up 12%.", "The quarterly figures, page 4."),
                sourced("Costs fell.", "The annual report."),
            ],
        },
    ],
});
```

Each run has a footnote of its own, so two runs given the same content have a footnote each. Word has footnotes only in a document's body, so a run with its footnote's content is left out of headers, footers, comments and footnotes. It works in [templates](usage/templates.md#footnotes-and-endnotes) too.

## Images in Footnotes

Footnotes can contain images using `ImageRun`:

```ts live
import { Document, FootnoteReferenceRun, ImageRun, Paragraph, TextRun } from "docx";
import * as fs from "fs";

const doc = new Document({
    footnotes: {
        1: {
            children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "jpg",
                            data: fs.readFileSync("./demo/assets/images/cat.jpg"),
                            transformation: {
                                width: 100,
                                height: 67,
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

```ts live
import { AlignmentType, convertInchesToTwip, Document, FootnoteReferenceRun, LevelFormat, Paragraph, TextRun } from "docx";

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

## Position and Numbering

`footnoteProperties` in a section's `properties` sets where the section's footnotes go and how they're numbered. `NumberFormat.CHICAGO` marks them with \*, †, ‡, § and so on instead of numbers:

```ts live
import { Document, FootnoteReferenceRun, NoteNumberRestart, NumberFormat, Paragraph, TextRun } from "docx";

const doc = new Document({
    footnotes: {
        1: { children: [new Paragraph("The first footnote is marked with an asterisk.")] },
        2: { children: [new Paragraph("The second is marked with a dagger.")] },
    },
    sections: [
        {
            properties: {
                footnoteProperties: {
                    numberFormat: { type: NumberFormat.CHICAGO },
                    restart: NoteNumberRestart.EACH_PAGE,
                },
            },
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Symbols instead of numbers"),
                        new FootnoteReferenceRun(1),
                        new TextRun(" for each footnote"),
                        new FootnoteReferenceRun(2),
                        new TextRun("."),
                    ],
                }),
            ],
        },
    ],
});
```

| Property     | Type                                      | Notes                                                                                  |
| ------------ | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| numberFormat | `{ type: NumberFormat; format?: string }` | How the marks are numbered, such as `NumberFormat.DECIMAL`, `LOWER_ROMAN` or `CHICAGO` |
| start        | `number`                                  | The number of the first footnote                                                       |
| restart      | `NoteNumberRestart`                       | `CONTINUOUS`, `EACH_SECTION` or `EACH_PAGE`                                            |
| position     | `FootnotePosition`                        | `PAGE_BOTTOM`, `BENEATH_TEXT`, `SECTION_END` or `DOCUMENT_END`                         |

Endnotes take the same options as `endnoteProperties`, with `EndnotePosition` (`SECTION_END` or `DOCUMENT_END`) for `position`.

## Options

| Property  | Type                                        | Notes    | Description                                    |
| --------- | ------------------------------------------- | -------- | ---------------------------------------------- |
| footnotes | `Record<string, { children: Paragraph[] }>` | Optional | Footnote definitions keyed by reference number |

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/footnotes-and-endnotes/footnotes.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/footnotes-and-endnotes/footnotes.ts_
