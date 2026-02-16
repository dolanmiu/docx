# Endnotes

!> Endnotes require an understanding of [Sections](usage/sections.md).

Endnotes allow you to add references that appear at the end of the document. They are ideal for academic papers, research documents, and formal publications where lengthy citations would clutter the main text.

?> For references that appear at the bottom of each page, see [Footnotes](usage/footnotes.md).

## Example

```ts
import { Document, EndnoteReferenceRun, Paragraph, TextRun } from "docx";

const doc = new Document({
    endnotes: {
        1: { children: [new Paragraph("This is the first endnote with some detailed explanation.")] },
        2: { children: [new Paragraph("Second endnote"), new Paragraph("With multiple paragraphs for more complex content.")] },
        3: { children: [new Paragraph("Third endnote referencing important source material.")] },
        4: { children: [new Paragraph("Fourth endnote from a different section.")] },
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("This document demonstrates endnotes functionality. "),
                        new TextRun("Here is some text with an endnote reference"),
                        new EndnoteReferenceRun(1),
                        new TextRun(". This allows for detailed citations and references "),
                        new EndnoteReferenceRun(2),
                        new TextRun(" without cluttering the main text flow."),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun("Endnotes appear at the end of the document, "),
                        new TextRun("unlike footnotes which appear at the bottom of each page"),
                        new EndnoteReferenceRun(3),
                        new TextRun(". This makes them ideal for academic papers and formal documents."),
                    ],
                }),
            ],
        },
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("This is content from a different section "),
                        new TextRun("with its own endnote reference"),
                        new EndnoteReferenceRun(4),
                        new TextRun(". Endnotes from all sections appear together at the document end."),
                    ],
                }),
            ],
        },
    ],
});
```

## Usage

### Document Configuration

Add endnotes to the `endnotes` property in the `Document` constructor:

- Keys are reference numbers (as strings)
- Values are objects with `children` array of `Paragraph` objects
- Endnotes can contain multiple paragraphs for complex content

### EndnoteReferenceRun

Insert `EndnoteReferenceRun` in paragraphs to create reference markers:

- Takes a single `id` parameter matching the endnote key
- Automatically styled as superscript
- References the corresponding endnote content

## Options

| Property | Type                                        | Notes    | Description                                   |
| -------- | ------------------------------------------- | -------- | --------------------------------------------- |
| endnotes | `Record<string, { children: Paragraph[] }>` | Optional | Endnote definitions keyed by reference number |

## Demo

_Source: https://github.com/dolanmiu/docx/blob/master/demo/97-endnotes.ts_
