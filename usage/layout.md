# Layout

<!-- cspell:ignore Aptos chenglou Carlito -->

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
- the [number of pages](usage/page-numbers.md#total-number-of-pages) of the document (`PageNumber.TOTAL_PAGES`) and of [each section](usage/page-numbers.md#total-number-of-pages-in-a-section) (`PageNumber.TOTAL_PAGES_IN_SECTION`), in the text, headers and footers. A section's is left blank when it shares a page with another section, or has a blank page before or after it

## What it follows

The pages are laid out with the widths and heights of the characters of the fonts Word documents use most: Calibri, Cambria, Arial, Times New Roman and Courier New. It follows:

- the document's styles, and each paragraph's and run's own formatting: fonts, sizes, bold, capitals, and hidden text
- spacing before and after paragraphs, line spacing, indents and tab stops. A line in one font is as tall as Word makes it, to a fraction of a twip (a twentieth of a point): 268.55 twips for Calibri 11. A line in several fonts is as tall as the tallest of them. Contextual spacing (`contextualSpacing`) leaves out only its paragraph's own share of the space between it and a paragraph of the same style, as Word does: all of its space after, or as much of its space before as is more than the space after the paragraph above it
- keeping a paragraph with the next, keeping its lines together, widow and orphan control, and page breaks
- numbered and bulleted lists
- footnotes, which take room at the bottom of the page their reference is on, and continue at the bottom of the next page when they don't fit, and endnotes, which follow the text. In columns, the footnotes of a page are laid out in the columns too, as Word lays them out: one after the other from the first column, evened out, and every column ends above them
- pictures in the line
- tables, with their columns' widths (`columnWidths`, or their cells' widths), their rows' heights, cell margins and borders. The columns of a table given no widths are sized to their text, as Word sizes them: each as wide as its longest line, or narrower when they don't all fit, but never narrower than its longest word, and a column whose cells give it a width keeps it. In a table whose cells all have widths, a column with a word longer than its cells give it is widened to fit the word, and the other columns are narrowed to make room, as Word does, unless the table's layout is fixed. Rows break across pages between the lines of their cells, as Word breaks them, keeping to widow and orphan control and lines kept together, and with room on the page for the space after a cell's paragraph that ends there. They move to the next page whole when a cell would have none of its lines on the page, when they are kept whole (`cantSplit`), and when the page hasn't room for the height they are set to. Where a table breaks across pages, Word draws its bottom border below the last of it on the page, which takes room there too. Header rows are repeated at the top of each page and column a table is on
- sections, with their page sizes, margins, columns, headers and footers, how they start, and their page numbering, such as roman numerals. Each column's lines are broken at its own width, so a paragraph that goes on into a column of another width is broken again there, as Word breaks it. Widow control counts the lines left for the next column as they are broken in the column before, as Word counts them, and a table sized to its text keeps its columns' widths in a wider column. Columns before a continuous section break are evened out, as Word evens them out, unless a column break is in them, and the next section starts below the longest. A section that starts in the next column (`SectionType.NEXT_COLUMN`) starts in the next column of the page when the section before has as many columns and one is left, as Word starts it, and on a new page otherwise. A paragraph kept together that is taller than a column goes down only the first column of each page, as Word lays it out, from the top of a new page unless it is at the top of this one, and what follows it goes on below it. A section that ends with a table has a line below it for the empty paragraph that ends the section, as Word has it

## What it leaves blank

It stops at the first thing it can't lay out yet, and the page numbers of the headings and bookmarks after it are left blank, for Word to fill in:

- a picture or shape that text wraps around, a text box, or a text frame
- an equation
- a footnote that doesn't fit below its reference, when it has several paragraphs or a table, would leave only one of its lines on either page, is too long for the next page too, or is referred to from a line that widow control, keeping lines together or keeping with the next paragraph could hold back
- a paragraph kept together that is taller than a column, in columns of different widths, and a paragraph kept with the next before a paragraph kept together that is taller than a column, when that one would move to a new page without it
- a table sized to its text that goes on into a narrower column
- a section that starts in the next column when its columns are of other widths than those of the section before, or when it starts before the last of 3 or more columns and a continuous section break follows it on the same page
- footnotes in columns of different widths, a footnote in columns that doesn't fit below its reference, or that moves its reference to the next page when the columns are laid out above it, footnotes referred to from two sections on one page, the first of them in columns, and a footnote in a section that starts in the next column when a column of the section before goes down further than it leaves room for
- a table row kept whole that is taller than a page, a row whose footnote doesn't fit below it, a row that breaks across pages with merged cells, or a table or a footnote in it, and a row that doesn't fit on the page with the text of a cell merged down from a row above in it
- a table whose rows give a column different widths, a table given no widths with cells merged across its columns or a table in a cell, and, in a table whose cells all have widths, a word longer than the table can make room for, a long word in a table wider than its cells, or one in a table with cells merged across its columns
- a document that hyphenates its words

A wrong page number is worse than a blank one, so it doesn't guess.

## How close it is

Text in fonts other than those five is measured as the most similar of them, so its page numbers are rougher. Aptos, Office's default font since 2023, is measured as Arial. In a browser, text can be measured in the fonts the page has instead (see [Measuring with a page's fonts](#measuring-with-a-pages-fonts)).

Each change to `docx/layout` is checked against LibreOffice's layout of a set of documents. Word lays out some things differently from LibreOffice, so keep `updateFields` on if the page numbers must be exact once the document is opened in Word. LibreOffice rounds the height of each line to whole twips, 269 for Calibri 11, so where a line only just fits on a page, it can be on the next page in LibreOffice and on this one in Word, and in `docx/layout`, which follows Word.

Laying out a document takes about 0.3 seconds per 100 pages in Node.

## Measuring with a page's fonts

By default, text is measured with tables of the widths of the characters of those five fonts, which `docx/layout` has with it, so it lays out the same pages in Node and in every browser. In a browser, it can measure text in the fonts the page has instead, with [Pretext](https://github.com/chenglou/pretext), which measures text with a canvas. That helps when the document is in a font that isn't in the tables, such as Aptos, and the page has it.

`docx` doesn't come with Pretext. Install it (`npm install @chenglou/pretext`), give its module to `measureWithPretext`, and give what that returns to `estimatePageNumbersWith`, as `measureWidth`:

```ts live
import * as pretext from "@chenglou/pretext";
import { Document, HeadingLevel, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbersWith, measureWithPretext } from "docx/layout";

// Until a font has loaded, the browser measures text in another one
await document.fonts.ready;

const text = "The harbour was rebuilt after the storm, and this report sets out what it cost and what is left to do. ".repeat(14);

const doc = new Document({
    features: { updateFields: true },
    pageNumbers: estimatePageNumbersWith({
        // Carlito is as wide as Calibri, for a page that has it and not Calibri
        measureWidth: measureWithPretext(pretext, { fontFamilies: { Calibri: "Calibri, Carlito, sans-serif" } }),
    }),
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }),
                ...[1, 2, 3, 4].flatMap((chapter) => [
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`Chapter ${chapter}`)] }),
                    new Paragraph(text),
                ]),
            ],
        },
    ],
});
```

Pretext only measures how wide words and spaces are. The rest is laid out as Word lays it out: lines break where Word breaks them, rather than where a browser would, tabs move to the paragraph's tab stops, and lines are as tall as Word makes them. Their heights still come from the tables, so the lines of a font that isn't in them are as tall as those of the most similar font that is.

- Pretext needs a canvas to measure with: an `OffscreenCanvas`, or a page's. Node has neither, so use `estimatePageNumbers` there.
- Load the fonts before the document is written, such as with `document.fonts.load('11pt "Aptos"')`. A font that hasn't loaded is measured as the browser's default font, and Pretext keeps the widths it measured.
- A font the page has under another name, such as a web font, is measured in the CSS font family `fontFamilies` gives it. Fonts not in it are measured in the font of their own name, or the browser's default font when the page doesn't have one.
- The page numbers are only as close to Word's as the page's fonts are to the fonts Word has. Laid out in Chrome with Word's own fonts, the headings of the documents `docx/layout` is checked against were all on Word's page.

`measureWidth` can be any function that measures how wide text is, in points, in a font with a name, size in points, and whether it is bold or italic:

```ts
import { estimatePageNumbersWith } from "docx/layout";

const canvas = new OffscreenCanvas(1, 1).getContext("2d")!;

const estimatePageNumbers = estimatePageNumbersWith({
    measureWidth: (text, { name, size, bold, italic }) => {
        canvas.font = `${italic ? "italic " : ""}${bold ? "bold " : ""}${size}pt "${name}"`;
        return canvas.measureText(text).width * 0.75;
    },
});
```

Space between characters, and text scaled wider or narrower, are added to what it measures, as the document's formatting gives them.
