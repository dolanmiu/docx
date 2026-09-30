# Layout

<!-- cspell:ignore Aptos -->

!> Layout requires an understanding of [Table of Contents](usage/table-of-contents.md) and [Bookmarks](usage/bookmarks.md).

`docx/layout` lays out a document's pages as Word would, when the document is written, to work out the page each heading and bookmark is on. `docx` then writes those page numbers into the document's tables of contents and page references.

Without it, their page numbers are blank until Word updates the fields, because they depend on how the document is laid out. Word only updates them when the document asks it to (`updateFields`) and the reader says yes, or when the reader updates the table. LibreOffice never fills in a table of contents' page numbers, so documents it converts to PDF have none.

It is opt-in. The page numbers are estimates: Word still works them out again when it updates the fields.

## Importing

Layout comes with the `docx` package. Import it from `docx/layout`, and everything else from `docx`:

```ts
import { Document, TableOfContents } from "docx";
import { estimatePageNumbers } from "docx/layout";
```

In a page without a bundler, load `dist/layout.umd.cjs` after `dist/index.umd.cjs` (or `dist/layout.iife.js` after `dist/index.iife.js`). It adds a `docxLayout` global, such as `docxLayout.estimatePageNumbers`.

## Example

Give the document `estimatePageNumbers` as its `pageNumbers`:

```ts live
import { Bookmark, Document, HeadingLevel, PageReference, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const text = "The harbour was rebuilt after the storm, and this report sets out what it cost and what is left to do. ".repeat(12);

const doc = new Document({
    // Word still updates the page numbers when it opens the document
    features: { updateFields: true },
    pageNumbers: estimatePageNumbers,
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }),
                new Paragraph({ children: [new TextRun("The costs are on page "), new PageReference("costs"), new TextRun(".")] }),
                ...[1, 2, 3, 4].flatMap((chapter) => [
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`Chapter ${chapter}`)] }),
                    new Paragraph(text),
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`Section ${chapter}.1`)] }),
                    new Paragraph(text),
                ]),
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new Bookmark({ id: "costs", children: [new TextRun("Costs")] })],
                }),
                new Paragraph(text),
            ],
        },
    ],
});
```

The page numbers are written into:

- the entries of each [Table of Contents](usage/table-of-contents.md) filled in from the headings
- each [`PageReference`](usage/bookmarks.md#page-references), unless it shows its position relative to the bookmark (`useRelativePosition`)

## What it follows

The pages are laid out with the widths and heights of the characters of the fonts Word documents use most: Calibri, Cambria, Arial, Times New Roman and Courier New. It follows:

- the document's styles, and each paragraph's and run's own formatting: fonts, sizes, bold, capitals, and hidden text
- spacing before and after paragraphs, line spacing, indents and tab stops
- keeping a paragraph with the next, keeping its lines together, widow and orphan control, and page breaks
- numbered and bulleted lists
- footnotes, which take room at the bottom of the page their reference is on, and endnotes, which follow the text
- pictures in the line
- tables, with their rows' heights, cell margins and borders. Rows break across pages between the lines of their cells, unless they are kept whole (`cantSplit`), and header rows are repeated on each page a table is on
- sections, with their page sizes, margins, headers and footers, how they start, and their page numbering, such as roman numerals

## What it leaves blank

It stops at the first thing it can't lay out yet, and the page numbers of the headings and bookmarks after it are left blank, for Word to fill in:

- a picture or shape that text wraps around, a text box, or a text frame
- an equation
- a footnote of more than a line that doesn't fit below its reference, which Word continues on the next page
- columns
- a table row kept whole that is taller than a page, and a row that breaks across pages with merged cells, a table or a footnote in it, or a height set taller than its text
- a document that hyphenates its words

A wrong page number is worse than a blank one, so it doesn't guess.

## How close it is

Text in fonts other than those five is measured as the most similar of them, so its page numbers are rougher. Aptos, Office's default font since 2023, is measured as Arial.

Each change to `docx/layout` is checked against LibreOffice's layout of a set of documents. Word lays out some things differently from LibreOffice, so keep `updateFields` on if the page numbers must be exact once the document is opened in Word.

Laying out a document takes about 0.3 seconds per 100 pages in Node.
