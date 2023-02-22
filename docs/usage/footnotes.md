# Footnotes

!> Footnotes requires an understanding of [Sections](usage/sections.md).

Use footnotes and endnotes to explain, comment on, or provide references to something in a document. Usually, footnotes appear at the bottom of the page.

## Example

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

## Usage

Footnotes requires an entry into the `footnotes` array in the `Document` constructor, and a `FootnoteReferenceRun` in the `Paragraph` constructor.

`footnotes` is an object of number to `Footnote` objects. The number is the reference number, and the `Footnote` object is the content of the footnote. The `Footnote` object has a `children` property, which is an array of `Paragraph` objects.

`FootnoteReferenceRun` is a `Run` object, which are added to `Paragraph`s. It takes a number as a parameter, which is the reference number of the footnote.
