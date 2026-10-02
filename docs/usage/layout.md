# Layout

<!-- cspell:ignore Aptos chenglou Carlito -->

!> Layout requires an understanding of [Table of Contents](usage/table-of-contents.md) and [Bookmarks](usage/bookmarks.md).

`docx/layout` lays out a document's pages as Word would, when the document is written, to work out the page each heading and bookmark is on. `docx` then writes those page numbers into the document's tables of contents and page references.

Without it, their page numbers are blank until Word updates the fields, because they depend on how the document is laid out. Word only updates them when the document asks it to (`updateFields`) and the reader says yes, or when the reader updates the table. LibreOffice never fills in a table of contents' page numbers, so documents it converts to PDF have none.

It is opt-in. The page numbers are estimates: Word still works them out again when it updates the fields, such as when the reader updates the table.

It can also give what is on each page, with [`layoutDocument`](#what-is-on-each-page): the lines of each paragraph, with their text and where they are, the rows of tables, the footnotes and endnotes, and which header and footer each page shows.

## Importing

Layout comes with the `docx` package. Import it from `docx/layout`, and everything else from `docx`:

```ts
import { Document, TableOfContents } from "docx";
import { estimatePageNumbers, layoutDocument } from "docx/layout";
```

In a page without a bundler, load `dist/layout.umd.cjs` after `dist/index.umd.cjs` (or `dist/layout.iife.js` after `dist/index.iife.js`). It adds a `docxLayout` global, such as `docxLayout.estimatePageNumbers` and `docxLayout.layoutDocument`.

## Example

Give the document `estimatePageNumbers` as its `pageNumbers`:

```ts live
import { Bookmark, Document, HeadingLevel, PageReference, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const text = "The harbour was rebuilt after the storm, and this report sets out what it cost and what is left to do. ".repeat(12);

const doc = new Document({
    // Without updateFields, Word shows the page numbers as they are written, and doesn't ask to update them
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

## Opening the document in Word

Without `pageNumbers`, `docx` writes page references and tables of contents as fields for Word to update, so Word asks "This document contains fields that may refer to other files. Do you want to update the fields in this document?" when it opens the document. With `pageNumbers`, they are written as they are, so Word shows them as they are written, and doesn't update them or ask. Leave `updateFields` off, and Word opens the document without asking.

A page number `docx/layout` couldn't work out, after it stopped (see [What it leaves blank](#what-it-leaves-blank)), is left blank, and stays blank in Word until the fields are updated: by the reader, such as by updating the table of contents, or by turning `updateFields` on. A wrong page number is worse than a blank one. The same goes for what `docx/layout` doesn't write at all:

- a page reference that shows its position relative to the bookmark (`useRelativePosition`)
- a table of contents that lists no heading, or of captions or TC fields, which is left empty, and the entries of one given `cachedEntries` or `contentChildren`, which are left as they were given

Word still asks when:

- the document has `updateFields` on, which asks Word to update all of its fields
- a table of contents is given `beginDirty: true`
- the document has a `SequentialIdentifier`, a SEQ field, which is written for Word to number

## Templates

[`patchDocument`](usage/templates.md) writes the page numbers of a template it fills in too, when it is given `estimatePageNumbers` as its `pageNumbers`. The pages are laid out once the patches are in, so the numbers are those of the filled-in document:

```ts
import * as fs from "fs";
import { Paragraph, patchDocument, PatchType } from "docx";
import { estimatePageNumbers } from "docx/layout";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("Report template.docx"),
    patches: {
        summary: { type: PatchType.DOCUMENT, children: [new Paragraph("The harbour was rebuilt after the storm.")] },
    },
    pageNumbers: estimatePageNumbers,
});
```

The template is read as Word saved it, with its styles, theme, lists, settings, headers, footers and notes, and the numbers are written into its tables of contents, page references and numbers of pages, in its text, headers and footers. The numbers a template was saved with are those of the template before it was filled in, so one that `docx/layout` can't work out, after something it can't lay out, is left blank rather than kept. Its page references and tables of contents are written clean, as a document's are, so Word shows them as they are (see [Opening the document in Word](#opening-the-document-in-word)). What `estimatePageNumbersWith` returns works the same way.

`patchDocument` doesn't add entries to a table of contents for the headings patches add. Word adds them when it updates the table.

## What is on each page

`layoutDocument` lays out a document's pages as `estimatePageNumbers` does, and gives what is on each of them:

```ts
import { Document, Paragraph } from "docx";
import { layoutDocument } from "docx/layout";

const doc = new Document({ sections: [{ children: [new Paragraph("The harbour was rebuilt after the storm.")] }] });

const { pages, stoppedAt } = layoutDocument(doc);
for (const page of pages) {
    for (const block of page.body) {
        if (block.type === "paragraph") {
            for (const line of block.lines) {
                console.log(`Page ${page.pageNumber}: "${line.text}", ${line.y} pixels down`);
            }
        }
    }
}
if (stoppedAt) {
    console.log(`Laid out up to ${stoppedAt}`);
}
```

Lengths are in pixels, 96 to the inch, from the top left corner of the page. The page numbers of tables of contents and page references are laid out as `estimatePageNumbers` writes them, whether or not the document is given it.

The layout of the document, `DocumentLayout`:

| Property    | Type                    | What it is                                                                                                                                                  |
| ----------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages`     | `readonly PageLayout[]` | The pages, in order                                                                                                                                         |
| `stoppedAt` | `string` or `undefined` | What the layout [stopped at](#what-it-leaves-blank), such as `"a text box"`. The pages are those up to there, the last of them with what was laid out on it |

Each page, `PageLayout`:

| Property     | Type                                          | What it is                                                                                                                                                                                                           |
| ------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageNumber` | `string` or none                              | The page's number, as the page shows it, such as `"3"` or `"iv"`. None when Word's isn't known: when the section's page numbers start with a chapter number                                                          |
| `section`    | `number`                                      | The section the page starts in, counted from 0                                                                                                                                                                       |
| `width`      | `number`                                      | The width of the page                                                                                                                                                                                                |
| `height`     | `number`                                      | The height of the page                                                                                                                                                                                               |
| `header`     | `"default"`, `"first"`, `"even"` or none      | Which of the section's [headers](usage/headers-and-footers.md) the page shows, by the name the section's `headers` give it. A section without one of them shows the one of the section before. None when it has none |
| `footer`     | `"default"`, `"first"`, `"even"` or none      | Which of the section's footers the page shows, in the same way                                                                                                                                                       |
| `body`       | `readonly (ParagraphLayout \| TableLayout)[]` | The paragraphs and tables of the body on the page, or the parts of them on it, in order                                                                                                                              |
| `footnotes`  | `readonly NoteLayout[]`                       | The footnotes at the bottom of the page, in order. The rest of one that goes on from the page before comes first                                                                                                     |
| `endnotes`   | `readonly NoteLayout[]`                       | The endnotes on the page, which follow the body                                                                                                                                                                      |

A paragraph, `ParagraphLayout`, is `{ type: "paragraph", index, lines }`, and a table, `TableLayout`, is `{ type: "table", index, rows }`. `index` is where it is among the paragraphs and tables of the body, or of its footnote or endnote, counted from 0, so a paragraph on two pages has the same `index` on both. It counts each paragraph docx writes, such as the entries of a table of contents, and the empty paragraph it writes at the end of each section but the last, which takes no room, so it isn't on any page.

Each line, `LineLayout`:

| Property    | Type     | What it is                                                                                                                                  |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`      | `string` | The text on the line, with the spaces where it wraps and a tab as `\t`. The texts of a paragraph's lines, one after the other, are its text |
| `x`         | `number` | Where the room for the line starts across the page: the left of its column, or of the page's text, and the paragraph's indent               |
| `y`         | `number` | Where the top of the line is down the page                                                                                                  |
| `width`     | `number` | How wide the room for the line is, between the paragraph's indents                                                                          |
| `height`    | `number` | How tall the line is, with the paragraph's line spacing                                                                                     |
| `textWidth` | `number` | How far its text goes from `x`, without the spaces at its end                                                                               |

The text is lined up in the line's room as the paragraph's alignment says, so it starts at `x` when it is aligned to the left, `(width - textWidth) / 2` further on when it is centred, and `width - textWidth` further on when it is aligned to the right. Justified lines but the last fill it.

Each row of a table, or the part of a row on the page when it breaks across pages, `RowLayout`, is `{ index, y, height }`: which of the table's rows it is, counted from 0, the top of the row, and its height, with its borders. A table's header rows are repeated at the top of each page it goes on to.

A footnote or endnote, `NoteLayout`, is `{ noteNumber, content }`: its number, as its reference shows it, such as `"1"` or `"iv"`, and its paragraphs and tables on the page.

A blank page that Word adds so a section starts on an odd or even page has nothing on it, and no header or footer, as Word prints it.

`layoutDocument` doesn't give the lines in table cells, in headers and footers, or where tables are across the page, yet. Each line is where Word puts it, to within a few twentieths of a point.

## What it follows

The pages are laid out with the widths and heights of the characters of the fonts Word documents use most: Calibri, Cambria, Arial, Times New Roman and Courier New, and the heights of the lines of the Chinese, Japanese and Korean fonts Office has, such as MS Mincho, Yu Gothic, SimSun, Microsoft YaHei, PMingLiU and Malgun Gothic. The widths are those of the letters of Western and Central European languages, Turkish, Vietnamese, Greek and Cyrillic, of punctuation and the spaces other than U+0020, and of currency signs, arrows and mathematical symbols, as Word draws them in each font, plain, bold, italic and bold italic. It follows:

- the document's styles, and each paragraph's and run's own formatting: fonts, sizes, bold, italics, capitals, and hidden text. Chinese, Japanese and Korean are in the run's East Asian font (`font: { eastAsia }`), or in MS Mincho when that font has none of their characters, as Word draws them. A right-to-left run (`rightToLeft`) is in the run's font, size, bold and italics for complex scripts (`font: { cs }`, `sizeComplexScript`, `boldComplexScript`, `italicsComplexScript`), as Word draws it
- lengths given with units, such as `margin: { top: "1in" }`, `size: "12pt"` or a table's `width: { size: "6in", type: WidthType.DXA }`, as well as those given in numbers. Word reads each as a whole number of twips: rounded down from inches, points and picas, and to the nearest from centimeters and millimeters, and a size in points rounded down to a half-point, so `size: "10.75pt"` is 10.5 points. It reads the minus sign of a negative length as the whole number's only, and adds the fraction: `"-10.7pt"` is -9.3 points
- where lines break, as Word breaks them: at spaces, and at en, em, four-per-em and ideographic spaces, which go past the end of a line as spaces do, after hyphens, en and em dashes and zero-width spaces, and between Chinese and Japanese characters. Word doesn't break lines at the other spaces, such as the thin space, so neither does the layout. In text in Japanese or Chinese (`language: { eastAsia: "ja-JP" }`), Word's lists keep characters such as closing brackets and `、` from starting a line, and opening brackets from ending one, so the character before moves to the next line with it. Text with no East Asian language, or in Korean or English, has no such rules in Word. Korean, Thai and the other scripts without spaces between words break at their spaces, as Word breaks them, and a word wider than the line breaks after the last character that fits. A paragraph's `wordWrap`, which writes Word's "Allow Latin text to wrap in the middle of a word", lets the words of runs in an East Asian font or language break anywhere, as Word breaks them. Right-to-left paragraphs (`bidirectional`) break where left-to-right ones do
- spacing before and after paragraphs, line spacing, indents and tab stops. A line in one font is as tall as Word makes it, to a fraction of a twip (a twentieth of a point): 268.55 twips for Calibri 11. A line in several fonts is as tall as the tallest of them. Contextual spacing (`contextualSpacing`) leaves out only its paragraph's own share of the space between it and a paragraph of the same style, as Word does: all of its space after, or as much of its space before as is more than the space after the paragraph above it
- keeping a paragraph with the next, keeping its lines together, widow and orphan control, and page breaks
- numbered and bulleted lists, including those a paragraph's style numbers it in
- footnotes, which take room at the bottom of the page their reference is on, and endnotes, which follow the text. A footnote that doesn't fit below its reference continues at the bottom of the next page, as Word continues it: it breaks between its paragraphs and table rows, and inside a paragraph keeping to its widow and orphan control, and its reference's line moves to the next page with it when too little of it would stay. One longer than a page fills the pages after it, and the text goes on above its end. A table row refers to footnotes as a line does: it moves to the next page with a footnote that doesn't fit below it, and one that breaks across pages has each line's footnote on the page the line is on, and breaks after a line whose footnote continues. In columns, the footnotes of a page are laid out in the columns too, as Word lays them out: one after the other from the first column, evened out, and every column ends above them
- pictures in the line
- tables, with their columns' widths (`columnWidths`, or their cells' widths), their rows' heights, cell margins and borders. The columns of a table given no widths are sized to their text, as Word sizes them: each as wide as its longest line, or narrower when they don't all fit, but never narrower than its longest word, and a column whose cells give it a width keeps it. A cell merged across columns (`columnSpan`) widens them where its longest line needs more room, each in proportion to how wide it is, and a table in a cell counts as wide as its columns. In a table whose cells all have widths, a column with a word longer than its cells give it is widened to fit the word, and the other columns are narrowed to make room, as Word does, unless the table's layout is fixed. Rows break across pages between the lines of their cells, as Word breaks them, keeping to widow and orphan control and lines kept together, and with room on the page for the space after a cell's paragraph that ends there. They move to the next page whole when a cell would have none of its lines on the page, when they are kept whole (`cantSplit`), and when the page hasn't room for the height they are set to. Where a table breaks across pages, Word draws its bottom border below the last of it on the page, which takes room there too. Header rows are repeated at the top of each page and column a table is on
- sections, with their page sizes, margins, columns, headers and footers, how they start, and their page numbering. Page numbers are written in Word's number formats as Word writes them, such as roman numerals, letters, words ("twenty-one") and the numbers of other languages, but for those it leaves blank (see below), and with chapter numbers in front of them (`chapterHeadingLevel`), such as 2-5 for page 5 of chapter 2. Each column's lines are broken at its own width, so a paragraph that goes on into a column of another width is broken again there, as Word breaks it. Widow control counts the lines left for the next column as they are broken in the column before, as Word counts them, and a table sized to its text keeps its columns' widths in a wider column. Columns before a continuous section break are evened out, as Word evens them out, unless a column break is in them, and the next section starts below the longest. A section that starts in the next column (`SectionType.NEXT_COLUMN`) starts in the next column of the page when the section before has as many columns and one is left, as Word starts it, and on a new page otherwise. A paragraph kept together that is taller than a column goes down only the first column of each page, as Word lays it out, from the top of a new page unless it is at the top of this one, and what follows it goes on below it. A section that ends with a table has a line below it for the empty paragraph that ends the section, as Word has it

## What it leaves blank

It stops at the first thing it can't lay out yet, and the page numbers of the headings and bookmarks after it are left blank, until the fields are updated in Word (see [Opening the document in Word](#opening-the-document-in-word)):

- a picture or shape that text wraps around, a text box, or a text frame
- an equation
- a footnote that continues on the next page where it would break in a paragraph kept together or with the next, or in a table with header rows or a row of more than one line; one that continues from a paragraph kept with a longer one or a table, or onto a page of its own after a section break; and a footnote line, or a line and the start of its footnote, taller than a page
- a paragraph kept together that is taller than a column, in columns of different widths, and a paragraph kept with the next before a paragraph kept together that is taller than a column, when that one would move to a new page without it
- a table sized to its text that goes on into a narrower column
- a section that starts in the next column when its columns are of other widths than those of the section before, or when it starts before the last of 3 or more columns and a continuous section break follows it on the same page
- footnotes in columns of different widths, a footnote in columns that doesn't fit below its reference, or that moves its reference to the next page when the columns are laid out above it, footnotes referred to from two sections on one page, the first of them in columns, and a footnote in a section that starts in the next column when a column of the section before goes down further than it leaves room for
- a table row kept whole that is taller than a page, a row that breaks across pages with merged cells, or a table in it, and a row that doesn't fit on the page with the text of a cell merged down from a row above in it
- a footnote in a table row that holds back lines of a cell beside it, which would fit on the page above the footnote, and a table row that fits on an empty page, but not with its footnote
- a table whose rows give a column different widths, a table given no widths of more than 63 columns, more than Word allows, and, in a table whose cells all have widths, a word longer than the table can make room for, a long word in a table wider than its cells, or one in a table with cells merged across its columns
- a long word in a cell merged across the columns of a table given no widths, which Word makes room for in a way not yet followed: a word longer than those columns' longest words together, when the table is narrowed to fit, or than their longest lines together, when more than one of them has anything in it
- a character whose width in its font isn't known, so its line may not be where Word puts it: a letter or symbol its font doesn't have, which Word draws in another font, such as most mathematical symbols in Calibri, Arial and Courier New, which Word draws in Cambria Math; a few that Word drew in a way their widths can't be read from, such as Ž and Ё in Courier New; and a symbol font's own symbol, such as Wingdings' tick (`SymbolRun`), or a symbol whose character isn't four hexadecimal digits
- a document that hyphenates its words, compresses its punctuation, or uses Word's strict rules for the characters that can't start a line
- a size given in a unit other than points, such as `size: "1cm"`, which Word ignores where no style gives a size, and a negative length of a fraction of a centimeter or millimeter
- page numbers in Thai and Hindi words (`thaiCounting` and `hindiCounting`), and page numbers Word writes as an error: any in `none`, 0 in Hebrew, Arabic, Thai and Hindi digits and Chicago's symbols, and those past where a format's letters run out, such as 781 in letters. Page numbers in Hebrew past 100, and in Hindi letters past 75 (`hindiVowels`) and 37 (`hindiConsonants`), haven't been checked in Word yet
- a chapter number from a heading in a table
- a document in compatibility mode, which Word lays out as an older version of Word did: one saved by Word 2010 or earlier, or by an application that writes an older mode, such as LibreOffice, or given an older `compatibility` `version`

A wrong page number is worse than a blank one, so it doesn't guess.

## How close it is

Text in fonts other than those five is measured as the most similar of them, so its page numbers are rougher. Aptos, Office's default font since 2023, is measured as Arial. In a browser, text can be measured in the fonts the page has instead (see [Measuring with a page's fonts](#measuring-with-a-pages-fonts)). Characters the width tables don't have, such as Hebrew, Arabic and Thai letters, box drawing, shapes such as the bullets ● and ■, and emoji, are measured as an average letter of the font, or an em for emoji, and East Asian fonts Office doesn't have as MS Mincho or MS Gothic.

Each change to `docx/layout` is checked against LibreOffice's layout of a set of documents, and against the pages Word marked in documents it saved. Word lays out some things differently from LibreOffice, so turn `updateFields` on if the page numbers must be Word's own once the document is opened in Word: Word then asks to update the fields, and works them out again. LibreOffice rounds the height of each line to whole twips, 269 for Calibri 11, so where a line only just fits on a page, it can be on the next page in LibreOffice and on this one in Word, and in `docx/layout`, which follows Word.

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
