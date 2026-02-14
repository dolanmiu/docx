# Footnotes and Endnotes

!> Footnotes and endnotes require an understanding of [Sections](usage/sections.md).

Use footnotes and endnotes to explain, comment on, or provide references to something in a document. Footnotes appear at the bottom of the page, while endnotes appear at the end of the document.

## Footnotes Example

```ts
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

## Endnotes Example

```ts
const doc = new Document({
    endnotes: {
        1: { children: [new Paragraph("This is the first endnote with some detailed explanation.")] },
        2: { children: [new Paragraph("Second endnote"), new Paragraph("With multiple paragraphs for more complex content.")] },
        3: { children: [new Paragraph("Third endnote referencing important source material.")] },
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
    ],
});
```

## Usage

### Footnotes

Footnotes require an entry in the `footnotes` object in the `Document` constructor, and a `FootnoteReferenceRun` in the `Paragraph` constructor.

`footnotes` is an object of number to `Footnote` objects. The number is the reference number, and the `Footnote` object is the content of the footnote. The `Footnote` object has a `children` property, which is an array of `Paragraph` objects.

`FootnoteReferenceRun` is a `Run` object, which are added to `Paragraph`s. It takes a number as a parameter, which is the reference number of the footnote.

### Endnotes

Endnotes require an entry in the `endnotes` object in the `Document` constructor, and an `EndnoteReferenceRun` in the `Paragraph` constructor.

`endnotes` is an object of number to `Endnote` objects. The number is the reference number, and the `Endnote` object is the content of the endnote. The `Endnote` object has a `children` property, which is an array of `Paragraph` objects.

`EndnoteReferenceRun` is a `Run` object, which are added to `Paragraph`s. It takes a number as a parameter, which is the reference number of the endnote.

### Key Differences

- **Footnotes** appear at the bottom of each page where they are referenced
- **Endnotes** appear at the end of the entire document
- Both footnote and endnote references automatically appear as superscript in the document
- Endnotes are ideal for academic papers, research documents, and lengthy citations that would otherwise clutter the page
