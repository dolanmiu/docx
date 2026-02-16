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

## Options

| Property  | Type                                        | Notes    | Description                                    |
| --------- | ------------------------------------------- | -------- | ---------------------------------------------- |
| footnotes | `Record<string, { children: Paragraph[] }>` | Optional | Footnote definitions keyed by reference number |
